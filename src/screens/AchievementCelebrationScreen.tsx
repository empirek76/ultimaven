import React, { useEffect, useRef, useMemo } from 'react';
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
import { RootStackParamList } from '../types/navigation';
import { useTheme, ThemeColors } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AchievementCelebration'>;

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
  swayA: (pr(i, 6) - 0.5) * 90,
  swayB: (pr(i, 9) - 0.5) * 40,
  isCircle: pr(i, 7) > 0.5,
  totalRotation: (pr(i, 8) - 0.5) * 1440,
}));

// ─── Confetti piece ───────────────────────────────────────────────────────────

function ConfettiPiece({ piece }: { piece: typeof CONFETTI_PIECES[0] }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(piece.delay),
        Animated.timing(anim, { toValue: 1, duration: piece.duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-30, SH + 50] });
  const translateX = anim.interpolate({ inputRange: [0, 0.3, 0.65, 1], outputRange: [0, piece.swayA, piece.swayB, piece.swayA * 0.3] });
  const rotate     = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.totalRotation}deg`] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.015, 0.72, 1], outputRange: [0, 1, 1, 0] });

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

const BADGE_SIZE  = 96;
const BADGE_RING  = 10;
const BADGE_INNER = BADGE_SIZE - BADGE_RING * 2;

function SpinningBadge({ emoji }: { emoji: string }) {
  const { colors } = useTheme();
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
    <Animated.View style={[badgeStyles.outer, { transform: [{ scale: pulseAnim }] }]}>
      <Animated.View style={[badgeStyles.ringWrapper, { transform: [{ rotate: spin }] }]}>
        <LinearGradient
          colors={['#FFD93D', '#FF6B6B', '#A78BFA', '#3DD68C', '#FFD93D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={[badgeStyles.inner, { backgroundColor: colors.background }]}>
        <Text style={badgeStyles.emoji}>{emoji}</Text>
      </View>
    </Animated.View>
  );
}

const badgeStyles = StyleSheet.create({
  outer:       { width: BADGE_SIZE, height: BADGE_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringWrapper: { position: 'absolute', width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE / 2, overflow: 'hidden' },
  inner:       { width: BADGE_INNER, height: BADGE_INNER, borderRadius: BADGE_INNER / 2, alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 36 },
});

// ─── Gradient "LB Mastered!" title ────────────────────────────────────────────

function MasteredTitle() {
  return (
    <MaskedView
      maskElement={
        <Text style={[masteredStyles.text, { backgroundColor: 'transparent' }]}>
          LB Mastered!
        </Text>
      }
    >
      <LinearGradient
        colors={['#FFD93D', '#FF8C42', '#FF6B6B', '#C084FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[masteredStyles.text, { opacity: 0 }]}>LB Mastered!</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const masteredStyles = StyleSheet.create({
  text: { fontSize: 40, fontFamily: 'Poppins_700Bold', textAlign: 'center', lineHeight: 50, color: '#FFD93D' },
});

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={[pillStyles.pill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[pillStyles.value, { color }]}>{value}</Text>
      <Text style={[pillStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill:  { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  value: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  label: { fontSize: 10.5, fontFamily: 'Poppins_400Regular', marginTop: 3, textAlign: 'center' },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AchievementCelebrationScreen({ navigation, route }: Props) {
  const { lbId, lbTitle, lbNumber, trackId, trackEmoji, trackName, nextLbNumber, totalLBs, score } = route.params;
  const displayScore = score != null && !isNaN(score) ? Math.round(score) : 100;

  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.82)).current;
  const phoenixY   = useRef(new Animated.Value(-60)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;
  const combinedY  = Animated.add(phoenixY, floatAnim);
  const autoTimer  = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleContinue() {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    navigation.dispatch(StackActions.pop(2));
  }

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    autoTimer.current = setTimeout(handleContinue, 3000);

    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 48, friction: 7, useNativeDriver: true }),
      Animated.spring(phoenixY,  { toValue: 0, tension: 55, friction: 9, delay: 120, useNativeDriver: true }),
    ]).start(() => {
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
      <View style={[StyleSheet.absoluteFill, styles.confettiLayer]} pointerEvents="none">
        {CONFETTI_PIECES.map((p) => <ConfettiPiece key={p.id} piece={p} />)}
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.orbTL} />
        <View style={styles.orbBR} />
        <View style={styles.orbCoral} />
        <View style={styles.orbGold} />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Animated.Text style={[styles.phoenix, { transform: [{ translateY: combinedY }] }]}>
              🦅
            </Animated.Text>

            <SpinningBadge emoji={trackEmoji} />

            <MasteredTitle />

            <Text style={styles.conqueredLine}>You've conquered {lbTitle}</Text>
            <Text style={styles.metaLine}>Score: {displayScore}% · LB Complete</Text>

            <View style={styles.blazeCard}>
              <Text style={styles.blazeIcon}>🦅</Text>
              <Text style={styles.blazeQuote}>
                "{BLAZE_QUOTES[trackId] ?? BLAZE_QUOTES['guitar']}"
              </Text>
            </View>

            <View style={styles.pillRow}>
              <StatPill value="🔥 15"              label="Day Streak" color={colors.gold}        />
              <StatPill value={`${lbNumber}/${totalLBs}`} label="LBs Done"   color={colors.primaryLight} />
              <StatPill value="+50"                label="XP Earned"  color={colors.green}       />
            </View>

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

              <TouchableOpacity style={styles.continueBtn} activeOpacity={0.75} onPress={handleContinue}>
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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    safe:      { flex: 1 },

    confettiLayer: { zIndex: 20 },

    orbTL: {
      position: 'absolute', width: 340, height: 340, borderRadius: 170,
      backgroundColor: c.primary, opacity: 0.11, top: -90, left: -90,
    },
    orbBR: {
      position: 'absolute', width: 280, height: 280, borderRadius: 140,
      backgroundColor: c.primary, opacity: 0.09, bottom: 30, right: -70,
    },
    orbCoral: {
      position: 'absolute', width: 220, height: 220, borderRadius: 110,
      backgroundColor: c.coral, opacity: 0.07, top: SH * 0.38, left: SW * 0.5 - 110,
    },
    orbGold: {
      position: 'absolute', width: 160, height: 160, borderRadius: 80,
      backgroundColor: c.gold, opacity: 0.05, top: 60, right: 10,
    },

    scroll:  { paddingBottom: 52 },
    content: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 36, gap: 18 },

    phoenix: { fontSize: 76, lineHeight: 92 },

    conqueredLine: { color: c.text, fontSize: 17, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 24, marginTop: -4 },
    metaLine:      { color: c.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', letterSpacing: 0.3, marginTop: -8 },

    blazeCard: {
      width: '100%', backgroundColor: c.card, borderRadius: 20, borderWidth: 1.5,
      borderColor: c.border, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: -4,
    },
    blazeIcon:  { fontSize: 22, lineHeight: 28 },
    blazeQuote: { flex: 1, color: c.textSecondary, fontSize: 13.5, fontFamily: 'Poppins_400Regular', lineHeight: 21, fontStyle: 'italic' },

    pillRow: { flexDirection: 'row', width: '100%', gap: 10, marginTop: -4 },

    buttons:     { width: '100%', gap: 12, marginTop: 4 },
    shareBtn:    { borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: '#FFD93D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8 },
    shareTxt:    { color: '#160800', fontSize: 17, fontFamily: 'Poppins_700Bold', letterSpacing: 0.3 },
    continueBtn: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: c.border },
    continueTxt: { color: c.primaryLight, fontSize: 15, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },
  });
}
