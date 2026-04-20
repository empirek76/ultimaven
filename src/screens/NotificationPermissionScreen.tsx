import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from '../types/navigation';
import { enableNotifications } from '../notifications/notificationService';
import { useTheme, ThemeColors } from '../context/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BENEFITS = [
  { emoji: '🔥', text: 'Daily streak reminders so you never lose momentum' },
  { emoji: '🌅', text: 'Morning motivation to start your day with learning' },
  { emoji: '📊', text: 'Weekly progress reports from Blaze' },
  { emoji: '🏆', text: 'Milestone celebrations when you level up' },
];

export default function NotificationPermissionScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const blazeAnim  = useRef(new Animated.Value(0.8)).current;

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const goToMain = () => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blazeAnim, { toValue: 1.1, duration: 1400, useNativeDriver: true }),
        Animated.timing(blazeAnim, { toValue: 0.8, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleAllow = async () => {
    let { status } = await Notifications.requestPermissionsAsync();
    if (status === 'undetermined') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status === 'granted') {
      await AsyncStorage.setItem('notifications_permission_declined', 'false');
      await enableNotifications();
      goToMain();
      return;
    }
    Alert.alert(
      'Enable Notifications',
      'To enable notifications, go to iPhone Settings → UltiMaven → Notifications → Allow Notifications.',
      [
        { text: 'Skip for now', onPress: () => goToMain() },
        { text: 'Open iPhone Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const handleLater = async () => {
    await AsyncStorage.setItem('notifications_permission_declined', 'true');
    goToMain();
  };

  return (
    <View style={styles.container}>
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Animated.Text style={[styles.blazeEmoji, { transform: [{ scale: blazeAnim }] }]}>🦅</Animated.Text>

          <Text style={styles.title}>Never Miss a Day</Text>
          <Text style={styles.subtitle}>
            Allow notifications so Blaze can remind you to keep your streak alive
          </Text>

          <View style={styles.benefitsList}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={styles.benefitIconBox}>
                  <Text style={styles.benefitEmoji}>{b.emoji}</Text>
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.allowBtn} activeOpacity={0.82} onPress={handleAllow}>
            <LinearGradient colors={['#7C5CFF', '#6C47FF', '#5A35FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.allowGradient}>
              <Text style={styles.allowTxt}>Allow Notifications 🔥</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterBtn} activeOpacity={0.65} onPress={handleLater}>
            <Text style={styles.laterTxt}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    safe:      { flex: 1 },
    content:   { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 40, paddingBottom: 24 },

    orbTL: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: c.primary, opacity: 0.07, top: -100, left: -100 },
    orbBR: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: c.primary, opacity: 0.05, bottom: 0,    right: -80  },

    blazeEmoji:  { fontSize: 80, marginBottom: 28 },
    title:       { color: c.text,          fontSize: 30, fontFamily: 'Poppins_700Bold',    textAlign: 'center', marginBottom: 14 },
    subtitle:    { color: c.textSecondary, fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 24, marginBottom: 36, paddingHorizontal: 8 },

    benefitsList: { width: '100%', gap: 14 },
    benefitRow:   { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, paddingVertical: 14, paddingHorizontal: 18 },
    benefitIconBox:{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },
    benefitEmoji: { fontSize: 20 },
    benefitText:  { flex: 1, color: c.text, fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20 },

    spacer:       { flex: 1, minHeight: 32 },
    allowBtn:     { width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 14 },
    allowGradient:{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
    allowTxt:     { color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins_700Bold', letterSpacing: 0.3 },
    laterBtn:     { paddingVertical: 12, paddingHorizontal: 24 },
    laterTxt:     { color: c.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', letterSpacing: 0.2 },
  });
}
