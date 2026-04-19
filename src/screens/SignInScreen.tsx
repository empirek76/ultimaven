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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

const { width: SW } = Dimensions.get('window');

export default function SignInScreen({ navigation }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const passwordRef             = useRef<TextInput>(null);

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backTxt}>← Back</Text>
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={styles.phoenix}>🦅</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your mastery journey
            </Text>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#4A3A6A"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              <View style={styles.inputBox}>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#4A3A6A"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={() => navigation.replace('Main')}
                />
              </View>

              <TouchableOpacity style={styles.forgotLink} activeOpacity={0.65}>
                <Text style={styles.forgotTxt}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />

            {/* Sign in button */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => navigation.replace('Main')}
            >
              <LinearGradient
                colors={['#7C5CFF', '#6C47FF', '#5A35FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnTxt}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Create account link */}
            <TouchableOpacity
              style={styles.createLink}
              activeOpacity={0.65}
              onPress={() => navigation.navigate('Onboarding')}
            >
              <Text style={styles.createTxt}>
                Don't have an account?{' '}
                <Text style={styles.createHighlight}>Start your journey</Text>
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
    paddingHorizontal: 28,
    paddingBottom: 12,
  },

  orbTL: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#7C5CFF', opacity: 0.09, top: -80, left: -80,
  },
  orbBR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#6C47FF', opacity: 0.07, bottom: 40, right: -70,
  },

  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  backTxt: {
    color: '#7C5CFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },

  phoenix: {
    fontSize: 64,
    textAlign: 'center',
    lineHeight: 80,
    marginTop: 24,
    marginBottom: 20,
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
    marginBottom: 4,
  },

  form: { marginTop: 36, gap: 14 },
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

  forgotLink: { alignSelf: 'flex-end', marginTop: 4 },
  forgotTxt: {
    color: '#7C5CFF',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  spacer: { flex: 1, minHeight: 36 },

  primaryBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#6C47FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 9,
    marginBottom: 16,
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },

  createLink: { alignItems: 'center', paddingVertical: 8 },
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
