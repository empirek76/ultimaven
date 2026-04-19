import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation';
import * as Notifications from 'expo-notifications';
import {
  getSystemPermissionStatus,
  enableNotifications,
  disableNotifications,
  requestPermissions,
} from '../notifications/notificationService';

const DECLINED_KEY = 'notifications_permission_declined';

// ─── Types ────────────────────────────────────────────────────────────────────

type IoniconName = keyof typeof Ionicons.glyphMap;

// ─── Settings row ─────────────────────────────────────────────────────────────

function SettingsRow({
  emoji,
  label,
  badge,
  badgeStyle,
  onPress,
  isLast = false,
  toggle,
  toggleValue,
  onToggle,
}: {
  emoji: string;
  label: string;
  badge?: string;
  badgeStyle?: 'grey' | 'purple';
  onPress?: () => void;
  isLast?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      activeOpacity={toggle ? 1 : 0.65}
      onPress={toggle ? undefined : onPress}
    >
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {badge && (
          <View style={[
            styles.badge,
            badgeStyle === 'purple' ? styles.badgePurple : styles.badgeGrey,
          ]}>
            <Text style={[
              styles.badgeTxt,
              badgeStyle === 'purple' ? styles.badgeTxtPurple : styles.badgeTxtGrey,
            ]}>
              {badge}
            </Text>
          </View>
        )}
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: '#2A1850', true: '#7C5CFF' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#2A1850"
          />
        ) : (
          <Ionicons name="chevron-forward" size={18} color="#3A2A5A" />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notifsEnabled, setNotifsEnabled] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Read declined flag on mount — this is the source of truth for the toggle default
  useEffect(() => {
    (async () => {
      const declined = await AsyncStorage.getItem(DECLINED_KEY);
      console.log('[Profile] Mount — notifications_permission_declined:', declined);

      if (declined === 'false') {
        // User previously allowed — verify OS permission is still granted
        const { status } = await Notifications.getPermissionsAsync();
        console.log('[Profile] Mount — OS status:', status);
        if (status === 'granted') {
          setNotifsEnabled(true);
        } else {
          // Permission was revoked externally; reflect reality
          await AsyncStorage.setItem(DECLINED_KEY, 'true');
          await disableNotifications();
          setNotifsEnabled(false);
        }
      } else {
        // 'true' (declined) or null (never asked) — both show OFF
        setNotifsEnabled(false);
      }
    })();
  }, []);

  // AppState listener — recheck permission when app returns from background (e.g. from Settings)
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState !== 'active' && nextState === 'active') {
        const { status } = await Notifications.getPermissionsAsync();
        console.log('[Profile] App foregrounded — OS permission status:', status);

        if (status === 'granted') {
          // User may have just enabled in Settings — turn toggle ON and schedule
          await AsyncStorage.setItem(DECLINED_KEY, 'false');
          await enableNotifications();
          setNotifsEnabled(true);
        } else {
          setNotifsEnabled(false);
        }
      }
    });
    return () => sub.remove();
  }, []);

  const showSettingsAlert = () => {
    Alert.alert(
      'Enable Notifications',
      'Tap Open Settings to allow UltiMaven to send you streak reminders and motivation from Blaze.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const handleNotifToggle = async (val: boolean) => {
    if (!val) {
      setNotifsEnabled(false);
      await AsyncStorage.setItem(DECLINED_KEY, 'true');
      await disableNotifications();
      return;
    }

    console.log('[Profile] Toggle switched ON');

    const { status } = await Notifications.getPermissionsAsync();
    console.log('[Profile] Permission status:', status);

    const flag = await AsyncStorage.getItem(DECLINED_KEY);
    console.log('[Profile] AsyncStorage flag:', flag);

    // Show alert if: user previously declined in-app OR OS is anything other than "granted"
    const shouldShowAlert = flag === 'true' || status !== 'granted';

    if (!shouldShowAlert) {
      console.log('[Profile] Scheduling notifications');
      setNotifsEnabled(true);
      await AsyncStorage.setItem(DECLINED_KEY, 'false');
      await enableNotifications();
      return;
    }

    console.log('[Profile] Showing alert now — flag:', flag, 'OS status:', status);
    showSettingsAlert();
    // Toggle stays OFF — setNotifsEnabled(true) never called
  };

  const openPaywall = () => navigation.navigate('Paywall', { source: 'profile' });

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('onboarding_complete');
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Splash' }] })
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <Text style={styles.screenTitle}>Profile</Text>

          {/* ── Avatar card ── */}
          <View style={styles.avatarCard}>
            <LinearGradient
              colors={['#7C5CFF', '#6C47FF', '#5A35FF']}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarInitial}>S</Text>
            </LinearGradient>

            <Text style={styles.userName}>Sri</Text>
            <Text style={styles.userEmail}>empirek@gmail.com</Text>

            <TouchableOpacity style={styles.editBtn} activeOpacity={0.72}>
              <Text style={styles.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* ── Settings ── */}
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingsCard}>
            <SettingsRow
              emoji="🔔"
              label="Notifications"
              toggle
              toggleValue={notifsEnabled}
              onToggle={handleNotifToggle}
            />
            <SettingsRow emoji="🔒" label="Privacy" />
            <SettingsRow
              emoji="💳"
              label="Subscription"
              badge="Free Plan"
              badgeStyle="grey"
              onPress={openPaywall}
            />
            <SettingsRow emoji="⭐" label="Rate UltiMaven" />
            <SettingsRow emoji="📧" label="Contact Support" isLast />
          </View>

          {/* Subscription upgrade nudge */}
          <TouchableOpacity style={styles.upgradeRow} activeOpacity={0.75} onPress={openPaywall}>
            <LinearGradient
              colors={['#7C5CFF', '#6C47FF', '#5A35FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeTxt}>⚡  Upgrade to Pro — Unlock everything</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.spacer} />

          {/* ── Sign Out ── */}
          <TouchableOpacity
            style={styles.signOutBtn}
            activeOpacity={0.78}
            onPress={confirmSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionTxt}>UltiMaven v1.0.0</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe:      { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 32,
  },

  // Orbs
  orbTL: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#7C5CFF', opacity: 0.08, top: -80, left: -80,
  },
  orbBR: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#6C47FF', opacity: 0.06, bottom: 40, right: -60,
  },

  screenTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    marginTop: 20,
    marginBottom: 24,
  },

  // Avatar card
  avatarCard: {
    alignItems: 'center',
    backgroundColor: '#0D0A1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E1240',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 36,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 44,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 30,
  },
  userEmail: {
    color: '#6A5A8A',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
    marginBottom: 20,
  },
  editBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7C5CFF',
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  editBtnTxt: {
    color: '#7C5CFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.2,
  },

  // Section title
  sectionTitle: {
    color: '#4A3A6A',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },

  // Settings card
  settingsCard: {
    backgroundColor: '#0D0A1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1240',
    overflow: 'hidden',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 17,
    gap: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#160E2E',
  },
  rowEmoji:  { fontSize: 18, lineHeight: 24, width: 28, textAlign: 'center' },
  rowLabel: {
    flex: 1,
    color: '#D4C8F0',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeGrey:      { backgroundColor: '#1C1530' },
  badgePurple:    { backgroundColor: '#2A1850' },
  badgeTxt: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
  badgeTxtGrey:   { color: '#6A5A8A' },
  badgeTxtPurple: { color: '#9B7AFF' },

  // Upgrade banner
  upgradeRow: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 28,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  upgradeTxt: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },

  spacer: { flex: 1, minHeight: 16 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#3A1818',
    backgroundColor: '#140808',
    paddingVertical: 16,
    marginBottom: 16,
  },
  signOutTxt: {
    color: '#FF6B6B',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.2,
  },

  versionTxt: {
    color: '#2E1E4A',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
