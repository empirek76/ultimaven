import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  Modal,
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
  enableNotifications,
  disableNotifications,
} from '../notifications/notificationService';
import { formatProDate } from '../services/stripeService';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeColors, ThemePreference } from '../context/ThemeContext';
import { supabase } from '../services/supabase';
import { TRACKS } from '../data/tracks';

const DECLINED_KEY = 'notifications_permission_declined';

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
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        rowBase.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      activeOpacity={toggle ? 1 : 0.65}
      onPress={toggle ? undefined : onPress}
    >
      <Text style={rowBase.emoji}>{emoji}</Text>
      <Text style={[rowBase.label, { color: colors.text }]}>{label}</Text>
      <View style={rowBase.right}>
        {badge && (
          <View style={[
            rowBase.badge,
            { backgroundColor: badgeStyle === 'purple' ? colors.primary + '33' : colors.surface2 },
          ]}>
            <Text style={[
              rowBase.badgeTxt,
              { color: badgeStyle === 'purple' ? colors.primaryLight : colors.textSecondary },
            ]}>
              {badge}
            </Text>
          </View>
        )}
        {toggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.border}
          />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const rowBase = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17, gap: 14 },
  emoji:    { fontSize: 18, lineHeight: 24, width: 28, textAlign: 'center' },
  label:    { flex: 1, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  right:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Appearance modal ─────────────────────────────────────────────────────────

const APPEARANCE_OPTIONS: Array<{ value: ThemePreference; emoji: string; label: string; sub: string }> = [
  { value: 'light', emoji: '☀️', label: 'Light Mode', sub: 'Always light' },
  { value: 'dark',  emoji: '🌙', label: 'Dark Mode',  sub: 'Always dark'  },
  { value: 'auto',  emoji: '🌓', label: 'Auto',       sub: 'Light by day, dark by night' },
];

function AppearanceModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, themePreference, setThemePreference } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={appearanceStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[
            appearanceStyles.sheet,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={[appearanceStyles.handle, { backgroundColor: colors.border }]} />
          <Text style={[appearanceStyles.title, { color: colors.text }]}>Appearance</Text>
          {APPEARANCE_OPTIONS.map((opt, idx) => {
            const isSelected = themePreference === opt.value;
            const isLast = idx === APPEARANCE_OPTIONS.length - 1;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  appearanceStyles.option,
                  !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => { setThemePreference(opt.value); onClose(); }}
                activeOpacity={0.65}
              >
                <Text style={appearanceStyles.optEmoji}>{opt.emoji}</Text>
                <View style={appearanceStyles.optInfo}>
                  <Text style={[appearanceStyles.optLabel, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[appearanceStyles.optSub, { color: colors.textSecondary }]}>{opt.sub}</Text>
                </View>
                {isSelected && (
                  <Text style={[appearanceStyles.check, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const appearanceStyles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40, borderTopWidth: 1 },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:    { fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 16 },
  option:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14 },
  optEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  optInfo:  { flex: 1 },
  optLabel: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  optSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  check:    { fontSize: 18, fontFamily: 'Poppins_700Bold' },
});

// ─── Submission history ───────────────────────────────────────────────────────

interface MySubmission {
  id:          string;
  track_id:    string;
  lb_number:   number;
  lb_title:    string;
  status:      'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  submitted_at: string;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: 'Under Review',      bg: '#FFD93D22', text: '#B8860B' },
  approved: { label: 'Live on UltiMaven', bg: '#3DD68C22', text: '#1A7A3A' },
  rejected: { label: 'Not Approved',      bg: '#FF6B6B22', text: '#CC2200' },
};

function SubmissionHistoryCard({ item, isDark }: { item: MySubmission; isDark: boolean }) {
  const { colors } = useTheme();
  const track  = TRACKS.find((t) => t.id === item.track_id);
  const badge  = STATUS_BADGE[item.status];
  return (
    <View style={[shStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={shStyles.topRow}>
        <View style={[shStyles.trackIcon, { backgroundColor: isDark ? track?.iconBgDark ?? '#1E1E38' : track?.iconBgLight ?? '#F0EEFF' }]}>
          <Text>{track?.emoji ?? '📚'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[shStyles.lbLine, { color: colors.textSecondary }]}>
            {track?.name ?? item.track_id} · LB {item.lb_number}
          </Text>
          <Text style={[shStyles.lbTitle, { color: colors.text }]} numberOfLines={1}>{item.lb_title}</Text>
        </View>
        <View style={[shStyles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[shStyles.badgeTxt, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>
      {item.status === 'rejected' && item.admin_notes ? (
        <Text style={[shStyles.feedback, { color: colors.textSecondary }]} numberOfLines={2}>
          💬 {item.admin_notes}
        </Text>
      ) : null}
    </View>
  );
}

const shStyles = StyleSheet.create({
  card:     { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, gap: 8 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trackIcon:{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lbLine:   { fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.4, textTransform: 'uppercase' },
  lbTitle:  { fontSize: 13, fontFamily: 'Poppins_600SemiBold', marginTop: 1 },
  badge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  feedback: { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 17 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile, signOut } = useAuth();
  const { colors, themePreference, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [notifsEnabled,    setNotifsEnabled]    = useState(false);
  const [showAppearance,   setShowAppearance]    = useState(false);
  const [mySubmissions,    setMySubmissions]     = useState<MySubmission[]>([]);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const isAdmin = (profile as any)?.is_admin === true;

  const fetchMySubmissions = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('lb_submissions')
      .select('id, track_id, lb_number, lb_title, status, admin_notes, submitted_at')
      .eq('creator_id', profile.id)
      .order('submitted_at', { ascending: false })
      .limit(10);
    if (data) setMySubmissions(data as MySubmission[]);
  }, [profile?.id]);

  const isPro    = profile?.is_pro   ?? false;
  const proSince = profile?.pro_since
    ? profile.pro_since.split('T')[0]
    : null;

  const appearanceBadge =
    themePreference === 'auto'  ? 'Auto'  :
    themePreference === 'light' ? 'Light' : 'Dark';

  useEffect(() => { fetchMySubmissions(); }, [fetchMySubmissions]);

  useEffect(() => {
    (async () => {
      const declined = await AsyncStorage.getItem(DECLINED_KEY);
      if (declined === 'false') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
          setNotifsEnabled(true);
        } else {
          await AsyncStorage.setItem(DECLINED_KEY, 'true');
          await disableNotifications();
          setNotifsEnabled(false);
        }
      } else {
        setNotifsEnabled(false);
      }
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;
      if (prevState !== 'active' && nextState === 'active') {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'granted') {
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
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      setNotifsEnabled(true);
      await AsyncStorage.setItem(DECLINED_KEY, 'false');
      await enableNotifications();
      return;
    }
    if (status === 'undetermined') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus === 'granted') {
        setNotifsEnabled(true);
        await AsyncStorage.setItem(DECLINED_KEY, 'false');
        await enableNotifications();
      }
      return;
    }
    showSettingsAlert();
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
            await signOut();
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
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <Text style={styles.screenTitle}>Profile</Text>

          <View style={[styles.avatarCard, !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }]}>
            <LinearGradient
              colors={['#7C5CFF', '#6C47FF', '#5A35FF']}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarInitial}>
                {(profile?.full_name ?? 'U')[0].toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{profile?.full_name ?? 'Champion'}</Text>
              {isPro && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeTxt}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{profile?.email ?? ''}</Text>
            {isPro && proSince && (
              <Text style={styles.proSinceTxt}>
                Pro Member since {formatProDate(proSince)}
              </Text>
            )}

            <TouchableOpacity style={styles.editBtn} activeOpacity={0.72}>
              <Text style={styles.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={[styles.settingsCard, !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }]}>
            <SettingsRow
              emoji="🔔"
              label="Notifications"
              toggle
              toggleValue={notifsEnabled}
              onToggle={handleNotifToggle}
            />
            <SettingsRow
              emoji="🎨"
              label="Appearance"
              badge={appearanceBadge}
              badgeStyle="grey"
              onPress={() => setShowAppearance(true)}
            />
            <SettingsRow emoji="🔒" label="Privacy" />
            <SettingsRow
              emoji="💳"
              label="Subscription"
              badge={isPro ? 'PRO' : 'Free Plan'}
              badgeStyle={isPro ? 'purple' : 'grey'}
              onPress={isPro ? undefined : openPaywall}
            />
            <SettingsRow emoji="⭐" label="Rate UltiMaven" />
            <SettingsRow emoji="📧" label="Contact Support" isLast />
          </View>

          <Text style={styles.sectionTitle}>Creator</Text>

          <View style={[styles.settingsCard, !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }]}>
            <SettingsRow
              emoji="🎬"
              label="Become a Creator"
              isLast={!isAdmin}
              onPress={() => navigation.navigate('CreatorSubmit')}
            />
            {isAdmin && (
              <SettingsRow
                emoji="🔧"
                label="Admin Panel"
                badge="Admin"
                badgeStyle="purple"
                isLast
                onPress={() => navigation.navigate('AdminPanel')}
              />
            )}
          </View>

          {mySubmissions.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionTitle}>My Submissions</Text>
              {mySubmissions.map((s) => (
                <SubmissionHistoryCard key={s.id} item={s} isDark={isDark} />
              ))}
            </View>
          )}

          {isPro ? (
            <TouchableOpacity
              style={styles.upgradeRow}
              activeOpacity={0.75}
              onPress={() => Alert.alert(
                'Manage Subscription',
                'To manage your Pro subscription, visit your account settings at ultimaven.com or contact support@ultimaven.com.',
                [{ text: 'OK' }]
              )}
            >
              <LinearGradient
                colors={['#2A1850', '#1E1238', '#160E30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                <Text style={styles.upgradeTxt}>⭐  Pro Member — Manage Subscription</Text>
                <Ionicons name="arrow-forward" size={16} color="#9B7AFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
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
          )}

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.78} onPress={confirmSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionTxt}>UltiMaven v1.0.0</Text>

          <TouchableOpacity style={styles.devBtn} activeOpacity={0.5} onPress={() => Linking.openSettings()}>
            <Text style={styles.devBtnTxt}>🔧 Notification Settings</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>

      <AppearanceModal visible={showAppearance} onClose={() => setShowAppearance(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    safe:      { flex: 1 },
    scroll:    { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 32 },

    orbTL: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: c.primary, opacity: 0.08, top: -80, left: -80 },
    orbBR: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: c.primary, opacity: 0.06, bottom: 40, right: -60 },

    screenTitle: { color: c.text, fontSize: 26, fontFamily: 'Poppins_700Bold', marginTop: 20, marginBottom: 24 },

    avatarCard: {
      alignItems: 'center', backgroundColor: c.card, borderRadius: 24, borderWidth: 1,
      borderColor: c.border, paddingVertical: 32, paddingHorizontal: 24, marginBottom: 24,
    },
    avatarCircle: {
      width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
      marginBottom: 16, shadowColor: '#7C5CFF', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
    },
    avatarInitial: { color: '#FFFFFF', fontSize: 36, fontFamily: 'Poppins_700Bold', lineHeight: 44 },
    userNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
    userName:      { color: c.text, fontSize: 22, fontFamily: 'Poppins_700Bold', lineHeight: 30 },
    proBadge:      { backgroundColor: '#FFD93D', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    proBadgeTxt:   { color: '#1A0E00', fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 1.2 },
    userEmail:     { color: c.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 4, marginBottom: 20 },
    proSinceTxt:   { color: c.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2, marginBottom: 18 },
    editBtn:       { borderRadius: 14, borderWidth: 1.5, borderColor: c.primary, paddingVertical: 10, paddingHorizontal: 32 },
    editBtnTxt:    { color: c.primary, fontSize: 14, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },

    sectionTitle: {
      color: c.textSecondary, fontSize: 12, fontFamily: 'Poppins_600SemiBold',
      letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4,
    },

    settingsCard: {
      backgroundColor: c.card, borderRadius: 20, borderWidth: 1,
      borderColor: c.border, overflow: 'hidden', marginBottom: 14,
    },

    upgradeRow:      { borderRadius: 16, overflow: 'hidden', marginBottom: 28 },
    upgradeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20 },
    upgradeTxt:      { color: '#FFFFFF', fontSize: 13.5, fontFamily: 'Poppins_600SemiBold', flex: 1 },

    spacer: { flex: 1, minHeight: 16 },

    signOutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      borderRadius: 18, borderWidth: 1.5, borderColor: c.coral + '44',
      backgroundColor: c.coral + '0F', paddingVertical: 16, marginBottom: 16,
    },
    signOutTxt: { color: c.coral, fontSize: 16, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },

    versionTxt: { color: c.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', opacity: 0.6 },
    devBtn:     { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
    devBtnTxt:  { color: c.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', opacity: 0.5 },
  });
}
