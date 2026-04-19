import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, {
  Path,
  Ellipse,
  Circle,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
} from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

// ─── Phoenix SVG ───────────────────────────────────────────────────────────

function PhoenixMascot() {
  return (
    <Svg width={210} height={230} viewBox="0 0 200 220">
      <Defs>
        <SvgGrad id="wingL" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A882FF" />
          <Stop offset="1" stopColor="#FF6B6B" />
        </SvgGrad>
        <SvgGrad id="wingR" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A882FF" />
          <Stop offset="1" stopColor="#FF6B6B" />
        </SvgGrad>
        <SvgGrad id="tailGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#7A5AFF" />
          <Stop offset="1" stopColor="#FF4D4D" />
        </SvgGrad>
        <SvgGrad id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9B7AFF" />
          <Stop offset="1" stopColor="#5C37FF" />
        </SvgGrad>
        <SvgGrad id="flameGrad" x1="0.5" y1="1" x2="0.5" y2="0">
          <Stop offset="0" stopColor="#FF4D4D" />
          <Stop offset="1" stopColor="#FFB347" />
        </SvgGrad>
        <SvgGrad id="headGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A882FF" />
          <Stop offset="1" stopColor="#7A5AFF" />
        </SvgGrad>
      </Defs>

      {/* Tail feathers */}
      <Path d="M 70,143 C 54,162 44,184 37,207 L 56,213 C 59,191 68,170 78,151 Z" fill="#FF5A5A" opacity={0.7} />
      <Path d="M 85,150 C 73,169 64,190 59,213 L 78,217 C 79,195 85,174 93,156 Z" fill="url(#tailGrad)" opacity={0.88} />
      <Path d="M 100,153 C 96,174 93,196 93,219 L 107,219 C 107,196 104,174 100,153 Z" fill="url(#tailGrad)" />
      <Path d="M 115,150 C 127,169 136,190 141,213 L 122,217 C 121,195 115,174 107,156 Z" fill="url(#tailGrad)" opacity={0.88} />
      <Path d="M 130,143 C 146,162 156,184 163,207 L 144,213 C 141,191 132,170 122,151 Z" fill="#FF5A5A" opacity={0.7} />

      {/* Left wing */}
      <Path d="M 76,90 C 52,68 16,66 5,91 C -5,116 28,142 80,128 C 83,118 81,102 76,90 Z" fill="url(#wingL)" />
      <Path d="M 18,90 C 38,85 62,94 76,107" stroke="#D4BBFF" strokeWidth={1.5} fill="none" opacity={0.5} />
      <Path d="M 10,106 C 32,101 60,110 76,121" stroke="#D4BBFF" strokeWidth={1.5} fill="none" opacity={0.4} />

      {/* Right wing */}
      <Path d="M 124,90 C 148,68 184,66 195,91 C 205,116 172,142 120,128 C 117,118 119,102 124,90 Z" fill="url(#wingR)" />
      <Path d="M 182,90 C 162,85 138,94 124,107" stroke="#D4BBFF" strokeWidth={1.5} fill="none" opacity={0.5} />
      <Path d="M 190,106 C 168,101 140,110 124,121" stroke="#D4BBFF" strokeWidth={1.5} fill="none" opacity={0.4} />

      {/* Body */}
      <Ellipse cx={100} cy={116} rx={27} ry={37} fill="url(#bodyGrad)" />
      <Ellipse cx={95} cy={108} rx={13} ry={17} fill="#C4AAFF" opacity={0.28} />
      <Path d="M 86,105 C 93,102 107,102 114,105" stroke="#B89AFF" strokeWidth={1} fill="none" opacity={0.4} />
      <Path d="M 83,115 C 91,111 109,111 117,115" stroke="#B89AFF" strokeWidth={1} fill="none" opacity={0.3} />
      <Path d="M 85,125 C 93,121 107,121 115,125" stroke="#B89AFF" strokeWidth={1} fill="none" opacity={0.25} />

      {/* Neck */}
      <Ellipse cx={100} cy={82} rx={13} ry={17} fill="#7A5AFF" />

      {/* Head */}
      <Circle cx={100} cy={64} r={22} fill="url(#headGrad)" />
      <Circle cx={94} cy={57} r={10} fill="#C4AAFF" opacity={0.32} />

      {/* Flame crest */}
      <Path d="M 85,48 C 77,29 86,13 91,21 C 96,29 89,44 88,52 Z" fill="url(#flameGrad)" />
      <Path d="M 100,43 C 96,21 104,6 109,14 C 114,22 107,39 105,47 Z" fill="url(#flameGrad)" />
      <Path d="M 115,48 C 123,29 114,14 109,22 C 104,30 112,45 113,53 Z" fill="url(#flameGrad)" />
      <Path d="M 91,51 C 88,39 93,30 96,35 C 99,40 93,49 92,53 Z" fill="#FFD580" opacity={0.7} />
      <Path d="M 109,51 C 112,39 107,30 104,35 C 101,40 107,49 108,53 Z" fill="#FFD580" opacity={0.7} />

      {/* Eye */}
      <Circle cx={91} cy={62} r={7} fill="#0D0D1A" />
      <Circle cx={91} cy={62} r={4.5} fill="#FFD700" />
      <Circle cx={91} cy={62} r={2.5} fill="#0D0D1A" />
      <Circle cx={89.5} cy={60.5} r={1} fill="#FFFFFF" />

      {/* Beak */}
      <Path d="M 78,68 L 69,76 L 80,78 Z" fill="#FFB347" />
      <Path d="M 78,71 L 69,76 L 80,74 Z" fill="#E8860A" opacity={0.65} />
    </Svg>
  );
}

// ─── Splash Screen ─────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -14, duration: 1900, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1900, useNativeDriver: true }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }),
    ]).start();

    // Auto-navigate to dashboard after 3 seconds (returning user fast-path)
    timerRef.current = setTimeout(() => {
      navigation.replace('Main');
    }, 3000);

    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <LinearGradient
      colors={['#0D0D1A', '#130828', '#1A0A3A']}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        {/* Glow orbs */}
        <View style={styles.orbTopLeft} />
        <View style={styles.orbTopRight} />
        <View style={styles.orbBottomRight} />
        <View style={styles.orbCenter} />

        {/* Main content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Phoenix */}
          <Animated.View style={[styles.phoenixWrapper, { transform: [{ translateY: floatAnim }] }]}>
            <View style={styles.phoenixGlowOuter} />
            <View style={styles.phoenixGlowInner} />
            <PhoenixMascot />
          </Animated.View>

          {/* Gradient title */}
          <MaskedView
            maskElement={
              <Text style={[styles.title, { fontFamily: 'Poppins_700Bold' }]}>UltiMaven</Text>
            }
          >
            <LinearGradient
              colors={['#FFFFFF', '#C4AAFF', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.title, { opacity: 0, fontFamily: 'Poppins_700Bold' }]}>
                UltiMaven
              </Text>
            </LinearGradient>
          </MaskedView>

          <Text style={[styles.tagline, { fontFamily: 'Poppins_400Regular' }]}>
            Mastery. Redefined.
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={[styles.buttons, { opacity: fadeAnim }]}>
          <TouchableOpacity activeOpacity={0.82} onPress={() => {
            clearTimeout(timerRef.current);
            navigation.navigate('Onboarding');
          }}>
            <LinearGradient
              colors={['#7C5CFF', '#6C47FF', '#5A35FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <Text style={[styles.primaryButtonText, { fontFamily: 'Poppins_600SemiBold' }]}>
                Start Your Journey 🔥
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButton} activeOpacity={0.7}>
            <Text style={[styles.outlineButtonText, { fontFamily: 'Poppins_400Regular' }]}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 44,
  },
  orbTopLeft: {
    position: 'absolute', width: 340, height: 340, borderRadius: 170,
    backgroundColor: '#6C47FF', opacity: 0.13, top: -120, left: -110,
  },
  orbTopRight: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#9B47FF', opacity: 0.09, top: 40, right: -60,
  },
  orbBottomRight: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#7A3FFF', opacity: 0.1, bottom: 80, right: -90,
  },
  orbCenter: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#FF6B6B', opacity: 0.055,
    top: height * 0.32, left: width * 0.5 - 90,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  phoenixWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  phoenixGlowOuter: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#6C47FF', opacity: 0.16,
  },
  phoenixGlowInner: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#9B7AFF', opacity: 0.22,
  },
  title: {
    fontSize: 50,
    letterSpacing: 0.5,
    textAlign: 'center',
    color: '#FFFFFF',
    lineHeight: 60,
  },
  tagline: {
    fontSize: 13,
    color: '#7A6A9A',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  buttons: {
    width: '100%',
    paddingHorizontal: 28,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#6C47FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  outlineButton: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3A2A5A',
  },
  outlineButtonText: {
    color: '#8A7AAA',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
