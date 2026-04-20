import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackActions } from '@react-navigation/native';
import { TracksStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<TracksStackParamList, 'AchievementCelebration'>;

const BLAZE_QUOTES: Record<string, string> = {
  guitar:  "That's how a phoenix rises. Another block mastered. Keep building — your first real song is closer than you think.",
  finance: "Money isn't complicated — discipline is. You just proved you have it. One block at a time, you're building real wealth.",
  body:    "Your body is responding. Every rep, every lesson is rewiring you. The transformation has already begun.",
  design:  "Great design isn't magic — it's mastery. You just took another step. The world needs more people who can make things beautiful.",
  reading: "Speed is a skill. Comprehension is wisdom. You're building both. Keep going — your mind is your greatest asset.",
};

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Deterministic pseudo-random (no Math.random so values are stable) ──────

function pr(i: number, n: number): number {
  const x = Math.sin(i * 9.301 + n * 3.743) * 10000;
  return x - Math.floor(x);
}

// ─── Confetti data ────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#7C5CFF', '#FF6B6B', '#FFD93D', '#3DD68C'];

const CONFETTI_PIECES = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: pr(i, 1) * SW,
  color: CONFETTI_COLORS[i % 4],
  size: 5 + pr(i, 3) * 7,
  duration: 1700 + pr(i, 4) * 1800,
  delay: pr(i, 5) * 1100,
  swayA: (pr(i, 6) - 0.5) * 90,   // primary sway direction
  swayB: (pr(i, 9) - 0.5) * 40,   // secondary sway
  isCircle: pr(i, 7) > 0.5,
  totalRotation: (pr(i, 8) - 0.5) * 1440, // ±2 full rotations
}));

// ─── Confetti piece ───────────────────────────────────────────────────────────

function ConfettiPiece({ piece }: { piece: typeof CONFETTI_PIECES[0] }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(piece.delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: piece.duration,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, SH + 50],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 0.3, 0.65, 1],
    outputRange: [0, piece.swayA, piece.swayB, piece.swayA * 0.3],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${piece.totalRotation}deg`],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.015, 0.72, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: piece.x,
        top: 0,
        width: piece.size,
        height: piece.isCircle ? piece.size : piece.size * 0.55,
        borderRadius: piece.isCircle ? piece.size : 1.5,
        backgroundColor: piece.color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

// ─── Spinning rainbow badge ───────────────────────────────────────────────────

function SpinningBadge({ emoji }: { emoji: string }) {
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 5000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.badgeOuter, { transform: [{ scale: pulseAnim }] }]}>
      {/* Spinning gradient ring */}
      <Animated.View style={[styles.badgeRingWrapper, { transform: [{ rotate: spin }] }]}>
        <LinearGradient
          colors={['#FFD93D', '#FF6B6B', '#A78BFA', '#3DD68C', '#FFD93D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Static inner dark circle with emoji */}
      <View style={styles.badgeInner}>
        <Text style={styles.badgeEmoji}>{emoji}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Gradient "LB Mastered!" title ────────────────────────────────────────────

function MasteredTitle() {
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.masteredText, { backgroundColor: 'transparent' }]}>
          LB Mastered!
        </Text>
      }
    >
      <LinearGradient
        colors={['#FFD93D', '#FF8C42', '#FF6B6B', '#C084FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.masteredText, { opacity: 0 }]}>LB Mastered!</Text>
      </LinearGradient>
    </MaskedView>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  value, label, color, bg, border,
}: {
  value: string; label: string; color: string; bg: string; border: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AchievementCelebrationScreen({ navigation, route }: Props) {
  const { lbId, lbTitle, lbNumber, trackId, trackEmoji, trackName, nextLbNumber, totalLBs, score } = route.params;
  const displayScore = score != null && !isNaN(score) ? Math.round(score) : 100;

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.82)).current;
  const phoenixY   = useRef(new Animated.Value(-60)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const combinedY  = Animated.add(phoenixY, floatAnim);
  const autoTimer  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Pop both AchievementCelebration + LBPlayer off the stack, returning to MasteryMap
  function handleContinue() {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    navigation.dispatch(StackActions.pop(2));
  }

  useEffect(() => {
    // Haptic celebration burst
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Auto-advance after 3 seconds if user doesn't tap
    autoTimer.current = setTimeout(handleContinue, 3000);

    // Entrance: fade + scale + phoenix drop
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 700, useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 48, friction: 7, useNativeDriver: true,
      }),
      Animated.spring(phoenixY, {
        toValue: 0, tension: 55, friction: 9, delay: 120, useNativeDriver: true,
      }),
    ]).start(() => {
      // Float loop starts after entrance settles
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -14, duration: 1900, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0,   duration: 1900, useNativeDriver: true }),
        ])
      ).start();
    });

    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, []);

  return (
    <View style={styles.container}>
      {/* Confetti — fullscreen, non-interactive overlay */}
      <View style={[StyleSheet.absoluteFill, styles.confettiLayer]} pointerEvents="none">
        {CONFETTI_PIECES.map((p) => <ConfettiPiece key={p.id} piece={p} />)}
      </View>

      {/* Background glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.orbTL} />
        <View style={styles.orbBR} />
        <View style={styles.orbCoral} />
        <View style={styles.orbGold} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
          >
            {/* Phoenix */}
            <Animated.Text
              style={[styles.phoenix, { transform: [{ translateY: combinedY }] }]}
            >
              🦅
            </Animated.Text>

            {/* Spinning badge */}
            <SpinningBadge emoji={trackEmoji} />

            {/* "LB Mastered!" */}
            <MasteredTitle />

            {/* Subtitles */}
            <Text style={styles.conqueredLine}>
              You've conquered {lbTitle}
            </Text>
            <Text style={styles.metaLine}>Score: {displayScore}% · LB Complete</Text>

            {/* Blaze message */}
            <View style={styles.blazeCard}>
              <Text style={styles.blazeIcon}>🦅</Text>
              <Text style={styles.blazeQuote}>
                "{BLAZE_QUOTES[trackId] ?? BLAZE_QUOTES['guitar']}"
              </Text>
            </View>

            {/* Stat pills */}
            <View style={styles.pillRow}>
              <StatPill
                value="🔥 15"
                label="Day Streak"
                color="#FFD93D"
                bg="#1C1300"
                border="#352500"
              />
              <StatPill
                value={`${lbNumber}/${totalLBs}`}
                label="LBs Done"
                color="#A882FF"
                bg="#130E28"
                border="#28184A"
              />
              <StatPill
                value="+50"
                label="XP Earned"
                color="#3DD68C"
                bg="#0A1C12"
                border="#123020"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity activeOpacity={0.84}>
                <LinearGradient
                  colors={['#FFD93D', '#FF9F43', '#FF6B6B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareBtn}
                >
                  <Text style={styles.shareTxt}>🚀  Share My Progress</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueBtn}
                activeOpacity={0.75}
                onPress={handleContinue}
              >
                <Text style={styles.continueTxt}>Continue to LB {nextLbNumber}  →</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const BADGE_SIZE    = 96;
const BADGE_RING    = 10; // ring thickness in px
const BADGE_INNER   = BADGE_SIZE - BADGE_RING * 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe:      { flex: 1 },

  confettiLayer: { zIndex: 20 },

  // Background orbs
  orbTL: {
    position: 'absolute',
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: '#7C5CFF', opacity: 0.11,
    top: -90, left: -90,
  },
  orbBR: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#6C47FF', opacity: 0.09,
    bottom: 30, right: -70,
  },
  orbCoral: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#FF6B6B', opacity: 0.07,
    top: SH * 0.38, left: SW * 0.5 - 110,
  },
  orbGold: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#FFD93D', opacity: 0.05,
    top: 60, right: 10,
  },

  scroll:  { paddingBottom: 52 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 36,
    gap: 18,
  },

  // Phoenix
  phoenix: { fontSize: 76, lineHeight: 92 },

  // Badge
  badgeOuter: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRingWrapper: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    overflow: 'hidden',
  },
  badgeInner: {
    width: BADGE_INNER,
    height: BADGE_INNER,
    borderRadius: BADGE_INNER / 2,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: { fontSize: 36 },

  // Title
  masteredText: {
    fontSize: 40,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    lineHeight: 50,
    color: '#FFD93D',
  },

  // Subtitles
  conqueredLine: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: -4,
  },
  metaLine: {
    color: '#6A5A8A',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 0.3,
    marginTop: -8,
  },

  // Blaze card
  blazeCard: {
    width: '100%',
    backgroundColor: '#0D0A1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#4A2EA0',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: -4,
  },
  blazeIcon:  { fontSize: 22, lineHeight: 28 },
  blazeQuote: {
    flex: 1,
    color: '#C4B0E4',
    fontSize: 13.5,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 21,
    fontStyle: 'italic',
  },

  // Stat pills
  pillRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: -4,
  },
  pill: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  pillValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  pillLabel: {
    color: '#4A3A6A',
    fontSize: 10.5,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
    textAlign: 'center',
  },

  // Buttons
  buttons: { width: '100%', gap: 12, marginTop: 4 },
  shareBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  shareTxt: {
    color: '#160800',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.3,
  },
  continueBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3D2880',
  },
  continueTxt: {
    color: '#A882FF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
});
