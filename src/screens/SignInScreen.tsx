import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

type FocusedField = 'email' | 'password' | null;

export default function SignInScreen({ navigation }: Props) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]         = useState<FocusedField>(null);
  const [emailError, setEmailError] = useState('');
  const [passError,  setPassError]  = useState('');
  const [loading,    setLoading]    = useState(false);
  const passwordRef                 = useRef<TextInput>(null);

  const handleSignIn = async () => {
    const emailBlank = !email.trim();
    const passBlank  = !password;
    setEmailError(emailBlank ? 'Please enter your email'    : '');
    setPassError(passBlank   ? 'Please enter your password' : '');
    if (emailBlank || passBlank) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      setPassError(error.message);
      return;
    }

    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />
      <View style={styles.orbMid} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#7C5CFF" />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Phoenix */}
            <Text style={styles.phoenix}>🦅</Text>

            {/* Header */}
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your mastery journey</Text>

            {/* ── Form ── */}
            <View style={styles.form}>

              {/* Email */}
              <View>
                <View style={[
                  styles.inputBox,
                  focused === 'email' && styles.inputFocused,
                  !!emailError        && styles.inputError,
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={focused === 'email' ? '#7C5CFF' : '#4A3A6A'}
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#4A3A6A"
                    value={email}
                    onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onFocus={() => setFocused('email')}
                    onBlur={() =>  setFocused(null)}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
                {!!emailError && (
                  <Text style={styles.errorTxt}>
                    <Ionicons name="alert-circle-outline" size={12} /> {emailError}
                  </Text>
                )}
              </View>

              {/* Password */}
              <View>
                <View style={[
                  styles.inputBox,
                  focused === 'password' && styles.inputFocused,
                  !!passError           && styles.inputError,
                ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={focused === 'password' ? '#7C5CFF' : '#4A3A6A'}
                    style={styles.icon}
                  />
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#4A3A6A"
                    value={password}
                    onChangeText={(t) => { setPassword(t); if (passError) setPassError(''); }}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onFocus={() => setFocused('password')}
                    onBlur={() =>  setFocused(null)}
                    onSubmitEditing={handleSignIn}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.eyeBtn}
                    activeOpacity={0.65}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={19}
                      color="#4A3A6A"
                    />
                  </TouchableOpacity>
                </View>
                {!!passError && (
                  <Text style={styles.errorTxt}>
                    <Ionicons name="alert-circle-outline" size={12} /> {passError}
                  </Text>
                )}
              </View>

              {/* Forgot password */}
              <TouchableOpacity style={styles.forgotLink} activeOpacity={0.65}>
                <Text style={styles.forgotTxt}>Forgot Password?</Text>
              </TouchableOpacity>

            </View>
            {/* ── End form ── */}

            {/* Sign In */}
            <TouchableOpacity
              activeOpacity={loading ? 1 : 0.84}
              onPress={loading ? undefined : handleSignIn}
              style={styles.signInWrap}
            >
              <LinearGradient
                colors={loading ? ['#1C1230', '#1C1230', '#1C1230'] : ['#7C5CFF', '#6C47FF', '#5A35FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                {loading
                  ? <ActivityIndicator color="#7C5CFF" />
                  : <Text style={styles.primaryBtnTxt}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* OR divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerTxt}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.75}>
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              <Text style={styles.socialTxt}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Apple */}
            <TouchableOpacity style={[styles.socialBtn, { marginTop: 12 }]} activeOpacity={0.75}>
              <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
              <Text style={styles.socialTxt}>Continue with Apple</Text>
            </TouchableOpacity>

            {/* Create account link */}
            <TouchableOpacity
              style={styles.createLink}
              activeOpacity={0.65}
              onPress={() => navigation.navigate('Onboarding')}
            >
              <Text style={styles.createTxt}>
                {"Don't have an account? "}
                <Text style={styles.createHighlight}>Start for free</Text>
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 26,
    paddingBottom: 24,
  },

  // Orbs
  orbTL: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#7C5CFF', opacity: 0.10, top: -90, left: -90,
  },
  orbBR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#6C47FF', opacity: 0.08, bottom: 30, right: -80,
  },
  orbMid: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#FF6B6B', opacity: 0.04, top: '45%', left: '30%',
  },

  // Back button
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  backTxt: {
    color: '#7C5CFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Header
  phoenix: {
    fontSize: 52,
    textAlign: 'center',
    lineHeight: 66,
    marginTop: 12,
    marginBottom: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 8,
  },
  subtitle: {
    color: '#6A5A8A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form
  form: { marginTop: 32, gap: 14 },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#120D26',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2A1A4A',
    paddingHorizontal: 16,
    height: 56,
  },
  inputFocused: {
    borderColor: '#7C5CFF',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  icon:   { marginRight: 12 },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    height: 56,
  },
  eyeBtn: { padding: 6 },

  errorTxt: {
    color: '#FF4444',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 6,
    marginLeft: 4,
  },

  forgotLink: { alignSelf: 'flex-end', marginTop: 2 },
  forgotTxt: {
    color: '#7C5CFF',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  // Sign in button
  signInWrap: { marginTop: 24 },
  primaryBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#6C47FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A1A4A',
  },
  dividerTxt: {
    color: '#4A3A6A',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 0.5,
  },

  // Social buttons
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#2E1E50',
    paddingVertical: 15,
    backgroundColor: '#0F0A20',
  },
  socialTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.2,
  },

  // Create account link
  createLink: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 20,
  },
  createTxt: {
    color: '#4A3A6A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  createHighlight: {
    color: '#7C5CFF',
    fontFamily: 'Poppins_600SemiBold',
  },
});
