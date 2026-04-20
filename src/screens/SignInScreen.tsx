import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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

export default function SignInScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passError,  setPassError]  = useState('');
  const [loading,    setLoading]    = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D1A' }} edges={['top', 'bottom']}>

      {/* Background orbs — pointerEvents="none" so they never swallow input touches */}
      <View style={styles.orbTL} pointerEvents="none" />
      <View style={styles.orbBR} pointerEvents="none" />
      <View style={styles.orbMid} pointerEvents="none" />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        activeOpacity={0.7}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={22} color="#7C5CFF" />
        <Text style={styles.backTxt}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>

          {/* Phoenix */}
          <Text style={styles.phoenix}>🦅</Text>

          {/* Header */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your mastery journey</Text>

          {/* ── Email input ── */}
          <View style={{ marginBottom: 16, marginTop: 32 }}>
            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
              placeholder="Email"
              placeholderTextColor="#6B6B8A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
              style={{
                backgroundColor: '#1E1E38',
                borderRadius: 14,
                padding: 16,
                color: '#FFFFFF',
                fontSize: 16,
                borderWidth: 1,
                borderColor: emailError ? '#FF4444' : '#2A2A4A',
              }}
            />
            {!!emailError && (
              <Text style={styles.errorTxt}>{emailError}</Text>
            )}
          </View>

          {/* ── Password input ── */}
          <View style={{ marginBottom: 8 }}>
            <TextInput
              value={password}
              onChangeText={(t) => { setPassword(t); if (passError) setPassError(''); }}
              placeholder="Password"
              placeholderTextColor="#6B6B8A"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              style={{
                backgroundColor: '#1E1E38',
                borderRadius: 14,
                padding: 16,
                color: '#FFFFFF',
                fontSize: 16,
                borderWidth: 1,
                borderColor: passError ? '#FF4444' : '#2A2A4A',
              }}
            />
            {!!passError && (
              <Text style={styles.errorTxt}>{passError}</Text>
            )}
          </View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotLink} activeOpacity={0.65}>
            <Text style={styles.forgotTxt}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In button */}
          <TouchableOpacity
            activeOpacity={loading ? 1 : 0.84}
            onPress={loading ? undefined : handleSignIn}
            style={{ marginTop: 24 }}
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

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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

  errorTxt: {
    color: '#FF4444',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 6,
    marginLeft: 4,
  },

  forgotLink: { alignSelf: 'flex-end', marginTop: 8 },
  forgotTxt: {
    color: '#7C5CFF',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  // Sign in button
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
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A1A4A' },
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
    marginBottom: 16,
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
