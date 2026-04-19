import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../types/navigation';
import { requestPermissions } from '../notifications/notificationService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BENEFITS = [
  { emoji: '🔥', text: 'Daily streak reminders so you never lose momentum' },
  { emoji: '🌅', text: 'Morning motivation to start your day with learning' },
  { emoji: '📊', text: 'Weekly progress reports from Blaze' },
  { emoji: '🏆', text: 'Milestone celebrations when you level up' },
];

export default function NotificationPermissionScreen() {
  const navigation = useNavigation<Nav>();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const blazeAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    console.log('[NotificationPermission] Screen mounted — showing pre-permission UI');
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

  const goToMain = () => {
    console.log('[NotificationPermission] Navigating to Main');
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
    );
  };

  const handleAllow = async () => {
    console.log('[NotificationPermission] "Allow Notifications" tapped — requesting OS permission');
    const granted = await requestPermissions();
    console.log('[NotificationPermission] Permission result:', granted ? 'GRANTED' : 'DENIED');
    // Store result so Profile toggle knows the user's choice
    await AsyncStorage.setItem('notifications_permission_declined', granted ? 'false' : 'true');
    goToMain();
  };

  const handleLater = async () => {
    console.log('[NotificationPermission] "Maybe Later" tapped — storing decline flag');
    await AsyncStorage.setItem('notifications_permission_declined', 'true');
    goToMain();
  };

  return (
    <View style={styles.container}>
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Blaze */}
          <Animated.Text style={[styles.blazeEmoji, { transform: [{ scale: blazeAnim }] }]}>
            🦅
          </Animated.Text>

          <Text style={styles.title}>Never Miss a Day</Text>
          <Text style={styles.subtitle}>
            Allow notifications so Blaze can remind you to keep your streak alive
          </Text>

          {/* Benefits list */}
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

          {/* CTA */}
          <TouchableOpacity
            style={styles.allowBtn}
            activeOpacity={0.82}
            onPress={handleAllow}
          >
            <LinearGradient
              colors={['#7C5CFF', '#6C47FF', '#5A35FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.allowGradient}
            >
              <Text style={styles.allowTxt}>Allow Notifications 🔥</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterBtn}
            activeOpacity={0.65}
            onPress={handleLater}
          >
            <Text style={styles.laterTxt}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 24,
  },

  orbTL: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#7C5CFF', opacity: 0.07, top: -100, left: -100,
  },
  orbBR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#6C47FF', opacity: 0.05, bottom: 0, right: -80,
  },

  blazeEmoji: { fontSize: 80, marginBottom: 28 },

  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    color: '#8070A8',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: 8,
  },

  benefitsList: {
    width: '100%',
    gap: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#0E0B20',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1C1640',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  benefitIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#160E30',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitEmoji: { fontSize: 20 },
  benefitText: {
    flex: 1,
    color: '#C8B8E8',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },

  spacer: { flex: 1, minHeight: 32 },

  allowBtn: { width: '100%', borderRadius: 18, overflow: 'hidden', marginBottom: 14 },
  allowGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowTxt: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.3,
  },

  laterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  laterTxt: {
    color: '#5A4A7A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 0.2,
  },
});
