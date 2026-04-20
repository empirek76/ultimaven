import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { TRACKS } from '../data/tracks';
import { useProgress } from '../context/ProgressContext';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SW } = Dimensions.get('window');
const CARD_W = Math.floor((SW - 48 - 12) / 2); // 24px side padding × 2, 12px gap

// ─── Data ─────────────────────────────────────────────────────────────────────

const SKILLS = [
  { id: 'guitar',  emoji: '🎸', label: 'Guitar Mastery',      sub: '28 LBs · Beginner–Advanced' },
  { id: 'finance', emoji: '💰', label: 'Personal Finance',    sub: '24 LBs · Beginner–Advanced' },
  { id: 'fitness', emoji: '💪', label: 'Body Transformation', sub: '32 LBs · All Levels' },
  { id: 'design',  emoji: '🎨', label: 'Graphic Design',      sub: '26 LBs · Beginner–Advanced' },
  { id: 'reading', emoji: '📖', label: 'Speed Reading',       sub: '22 LBs · Beginner–Advanced' },
];

const TIME_OPTIONS = [
  { id: '10', emoji: '⚡', label: '10 minutes', sub: 'Quick wins daily' },
  { id: '20', emoji: '🔥', label: '20 minutes', sub: 'Steady progress' },
  { id: '30', emoji: '💪', label: '30 minutes', sub: 'Serious mastery' },
  { id: '60', emoji: '🚀', label: '1 hour',     sub: 'Fast track to mastery' },
];

// ─── Step dots ────────────────────────────────────────────────────────────────

function StepDots({ current }: { current: number }) {
  return (
    <View style={styles.dots}>
      {[1, 2, 3, 4].map((n) => (
        <View key={n} style={[styles.dot, n === current && styles.dotActive]} />
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }: Props) {
  const { refreshActiveTracks } = useProgress();
  const [step, setStep] = useState(1);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signUpError, setSignUpError] = useState('');

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1900, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const advance = (nextStep: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  // ─── Step 1 — Welcome ───────────────────────────────────────────────────────

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Animated.Text style={[styles.heroEmoji, { transform: [{ translateY: floatAnim }] }]}>
        🦅
      </Animated.Text>
      <Text style={styles.title}>Welcome to UltiMaven</Text>
      <Text style={styles.subtitle}>
        The world's first skill mastery platform.{'\n'}Not just learning — transformation.
      </Text>
      <View style={styles.spacer} />
      <PrimaryBtn label="Let's Begin →" onPress={() => advance(2)} />
      <StepDots current={1} />
    </View>
  );

  // ─── Step 2 — Choose skill ──────────────────────────────────────────────────

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>What do you want{'\n'}to master?</Text>
      <Text style={styles.subtitle}>Choose your first skill track</Text>

      <View style={styles.skillGrid}>
        <View style={styles.skillRow}>
          {SKILLS.slice(0, 2).map((sk) => (
            <TouchableOpacity
              key={sk.id}
              style={[styles.skillCard, selectedSkill === sk.id && styles.cardSelected]}
              activeOpacity={0.75}
              onPress={() => setSelectedSkill(sk.id)}
            >
              <Text style={styles.skillEmoji}>{sk.emoji}</Text>
              <Text style={[styles.skillLabel, selectedSkill === sk.id && styles.labelSelected]}>
                {sk.label}
              </Text>
              <Text style={styles.skillSub}>{sk.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.skillRow}>
          {SKILLS.slice(2, 4).map((sk) => (
            <TouchableOpacity
              key={sk.id}
              style={[styles.skillCard, selectedSkill === sk.id && styles.cardSelected]}
              activeOpacity={0.75}
              onPress={() => setSelectedSkill(sk.id)}
            >
              <Text style={styles.skillEmoji}>{sk.emoji}</Text>
              <Text style={[styles.skillLabel, selectedSkill === sk.id && styles.labelSelected]}>
                {sk.label}
              </Text>
              <Text style={styles.skillSub}>{sk.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.skillRow, { justifyContent: 'center' }]}>
          {SKILLS.slice(4).map((sk) => (
            <TouchableOpacity
              key={sk.id}
              style={[styles.skillCard, selectedSkill === sk.id && styles.cardSelected]}
              activeOpacity={0.75}
              onPress={() => setSelectedSkill(sk.id)}
            >
              <Text style={styles.skillEmoji}>{sk.emoji}</Text>
              <Text style={[styles.skillLabel, selectedSkill === sk.id && styles.labelSelected]}>
                {sk.label}
              </Text>
              <Text style={styles.skillSub}>{sk.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.spacer} />
      <PrimaryBtn
        label="Continue →"
        onPress={() => advance(3)}
        disabled={!selectedSkill}
      />
      <StepDots current={2} />
    </View>
  );

  // ─── Step 3 — Daily commitment ──────────────────────────────────────────────

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>How much time can you{'\n'}commit daily?</Text>
      <Text style={styles.subtitle}>
        We'll build your personal mastery path{'\n'}around your schedule
      </Text>

      <View style={styles.timeList}>
        {TIME_OPTIONS.map((opt) => {
          const active = selectedTime === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.timeCard, active && styles.cardSelected]}
              activeOpacity={0.75}
              onPress={() => setSelectedTime(opt.id)}
            >
              <Text style={styles.timeEmoji}>{opt.emoji}</Text>
              <View style={styles.timeTexts}>
                <Text style={[styles.timeLabel, active && styles.labelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.timeSub}>{opt.sub}</Text>
              </View>
              {active && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.spacer} />
      <PrimaryBtn
        label="Continue →"
        onPress={() => advance(4)}
        disabled={!selectedTime}
      />
      <StepDots current={3} />
    </View>
  );

  // ─── Step 4 — Create account ────────────────────────────────────────────────

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setSignUpError('Please fill in all fields');
      return;
    }
    setIsSigningUp(true);
    setSignUpError('');

    const { data, error } = await supabase.auth.signUp({
      email:   email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });

    if (error) {
      setSignUpError(error.message);
      setIsSigningUp(false);
      return;
    }

    // If email confirmation is enabled in Supabase, signUp returns session: null.
    // We immediately sign in with the credentials to establish a session.
    let session = data.session;
    if (!session) {
      console.log('[Onboarding] No session from signUp — signing in immediately');
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password,
      });
      if (signInErr) {
        // Most likely "Email not confirmed" — tell the user to disable it in Supabase
        setSignUpError(
          'Please disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email, then try again.'
        );
        setIsSigningUp(false);
        return;
      }
      session = signInData.session;
    }

    console.log('[Onboarding] Session established for:', session?.user?.id);

    // DB trigger auto-creates the profile row. Attempt upsert as belt-and-suspenders.
    if (session?.user) {
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id:        session.user.id,
        full_name: name.trim(),
        email:     email.trim(),
      });
      if (profileErr) console.log('[Onboarding] Profile upsert note:', profileErr.message);
      else console.log('[Onboarding] Profile upsert succeeded');

      // Save the skill the user selected to skill_tracks
      if (selectedSkill) {
        const track = TRACKS.find((t) => t.id === selectedSkill);
        const now = new Date().toISOString();
        const { error: trackErr } = await supabase.from('skill_tracks').insert({
          user_id:             session.user.id,
          track_key:           selectedSkill,
          track_name:          track?.name ?? selectedSkill,
          track_emoji:         track?.emoji ?? '',
          total_lbs:           track?.sections.flatMap((s) => s.blocks).length ?? 0,
          completed_lbs:       0,
          progress_percentage: 0,
          is_active:           true,
          started_at:          now,
          updated_at:          now,
        });
        if (trackErr) {
          console.log('[Onboarding] skill_tracks insert error:', trackErr.message);
        } else {
          console.log('[Onboarding] skill_tracks inserted:', selectedSkill);
        }

        // Force-refresh activeTracks in context with the known user ID.
        // This is necessary because onAuthStateChange fires before the insert
        // completes, so ProgressContext may have already queried an empty table.
        await refreshActiveTracks(session.user.id);
      }
    }

    setIsSigningUp(false);
    console.log("NAVIGATING TO NOTIFICATION SCREEN");
    navigation.replace('NotificationPermission');
  };

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Almost there!</Text>
      <Text style={styles.subtitle}>
        Create your free account to save your progress
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#4A3A6A"
            value={name}
            onChangeText={(t) => { setName(t); if (signUpError) setSignUpError(''); }}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#4A3A6A"
            value={email}
            onChangeText={(t) => { setEmail(t); if (signUpError) setSignUpError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#4A3A6A"
            value={password}
            onChangeText={(t) => { setPassword(t); if (signUpError) setSignUpError(''); }}
            secureTextEntry
          />
        </View>
        {!!signUpError && (
          <Text style={styles.errorTxt}>{signUpError}</Text>
        )}
      </View>

      <View style={styles.spacer} />
      <TouchableOpacity
        activeOpacity={isSigningUp ? 1 : 0.82}
        onPress={isSigningUp ? undefined : handleSignUp}
      >
        <LinearGradient
          colors={isSigningUp ? ['#1C1230', '#1C1230', '#1C1230'] : ['#7C5CFF', '#6C47FF', '#5A35FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryBtn}
        >
          {isSigningUp
            ? <ActivityIndicator color="#7C5CFF" />
            : <Text style={styles.primaryBtnTxt}>Start Mastering Free 🔥</Text>
          }
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.signInLink}
        activeOpacity={0.65}
        onPress={() => navigation.navigate('SignIn' as any)}
      >
        <Text style={styles.signInTxt}>Already have an account? Sign in</Text>
      </TouchableOpacity>
      <StepDots current={4} />
    </View>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Reusable primary button ──────────────────────────────────────────────────

function PrimaryBtn({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity activeOpacity={disabled ? 1 : 0.82} onPress={onPress} disabled={disabled}>
      <LinearGradient
        colors={disabled ? ['#1C1230', '#1C1230', '#1C1230'] : ['#7C5CFF', '#6C47FF', '#5A35FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.primaryBtn}
      >
        <Text style={[styles.primaryBtnTxt, disabled && styles.disabledTxt]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe:      { flex: 1 },
  scroll:    { flexGrow: 1 },

  orbTL: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#7C5CFF', opacity: 0.09, top: -80, left: -80,
  },
  orbBR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#6C47FF', opacity: 0.07, bottom: 40, right: -70,
  },

  // Step wrapper
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 8,
  },
  spacer: { flex: 1, minHeight: 28 },

  // Typography
  heroEmoji: {
    fontSize: 84,
    textAlign: 'center',
    lineHeight: 100,
    marginBottom: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    color: '#6A5A8A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Skill grid
  skillGrid: { marginTop: 26, gap: 12 },
  skillRow:  { flexDirection: 'row', gap: 12 },
  skillCard: {
    width: CARD_W,
    backgroundColor: '#120D26',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#2A1A4A',
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },
  skillEmoji: { fontSize: 32, lineHeight: 40 },
  skillLabel: {
    color: '#6A5A8A',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  skillSub: {
    color: '#3A2A5A',
    fontSize: 9,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 4,
  },

  // Time options
  timeList: { marginTop: 26, gap: 12 },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120D26',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#2A1A4A',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
  },
  timeEmoji:  { fontSize: 26, lineHeight: 32, width: 34, textAlign: 'center' },
  timeTexts:  { flex: 1 },
  timeLabel: {
    color: '#6A5A8A',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 22,
  },
  timeSub: {
    color: '#3A2A5A',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
    marginTop: 2,
  },
  checkBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#7C5CFF',
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 18,
  },

  // Shared selected state
  cardSelected: {
    borderColor: '#7C5CFF',
    backgroundColor: '#160E38',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  labelSelected: { color: '#C4AAFF' },

  // Inputs
  inputGroup: { marginTop: 28, gap: 14 },
  inputBox: {
    backgroundColor: '#120D26',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2A1A4A',
    paddingHorizontal: 18,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 15,
    height: 52,
  },

  // Buttons
  primaryBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#6C47FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 9,
    marginBottom: 12,
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
  disabledTxt: { color: '#3A2A5A' },

  signInLink: { alignItems: 'center', paddingVertical: 8, marginBottom: 4 },
  signInTxt: {
    color: '#4A3A6A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  errorTxt: {
    color: '#FF4444',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },

  // Step indicator
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#2A1A4A',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#7C5CFF',
  },
});
