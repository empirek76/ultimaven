import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TRACKS, getTrackStats } from '../data/tracks';
import { useProgress } from '../context/ProgressContext';
import { RootStackParamList } from '../types/navigation';

// ─── Avatar ────────────────────────────────────────────────────────────────

function Avatar() {
  return (
    <LinearGradient colors={['#8A6AFF', '#5A35FF']} style={styles.avatar}>
      <Text style={styles.avatarLetter}>S</Text>
    </LinearGradient>
  );
}

// ─── Streak Card ───────────────────────────────────────────────────────────

function StreakCard() {
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <LinearGradient
      colors={['#1D1238', '#130D28']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.streakCard}
    >
      <View style={styles.streakLeft}>
        <Animated.Text style={[styles.streakEmoji, { opacity: glowAnim }]}>🔥</Animated.Text>
        <View>
          <Text style={styles.streakTitle}>14 Day Streak</Text>
          <Text style={styles.streakSub}>Keep the momentum going!</Text>
        </View>
      </View>
      <View style={styles.onFireBadge}>
        <Text style={styles.onFireText}>ON FIRE 🔥</Text>
      </View>
    </LinearGradient>
  );
}

// ─── Stat Pill ─────────────────────────────────────────────────────────────

function StatPill({
  value, label, color, bgColor, borderColor,
}: {
  value: string; label: string; color: string; bgColor: string; borderColor: string;
}) {
  return (
    <View style={[styles.statPill, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Blaze Nudge ───────────────────────────────────────────────────────────

function BlazeNudge({ lbsDone }: { lbsDone: number }) {
  const nextMilestone = (Math.floor(lbsDone / 4) + 1) * 4;
  const toNext = nextMilestone - lbsDone;
  return (
    <View style={styles.blazeCard}>
      <View style={styles.blazeHeader}>
        <Text style={styles.blazeEmoji}>🦅</Text>
        <Text style={styles.blazeLabel}>Blaze says...</Text>
      </View>
      <Text style={styles.blazeMessage}>
        {"You're "}
        <Text style={styles.blazeHighlight}>{toNext} LB{toNext !== 1 ? 's' : ''}</Text>
        {" away from your next "}
        <Text style={styles.blazeHighlight}>badge milestone</Text>
        {"! Keep pushing! 🔥"}
      </Text>
    </View>
  );
}

// ─── Skill Track Card ──────────────────────────────────────────────────────

function SkillTrackCard({
  emoji, name, progress, progressColor, progressBg, lessonsDone, totalLessons, animDelay = 0,
}: {
  emoji: string; name: string; progress: number; progressColor: string;
  progressBg: string; lessonsDone: number; totalLessons: number; animDelay?: number;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 800,
      delay: animDelay,
      useNativeDriver: false,
    }).start();
  }, [progress]); // Re-animates bar whenever progress changes

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.trackCard}>
      <View style={styles.trackRow}>
        <View style={styles.trackLeft}>
          <View style={[styles.trackIconBox, { backgroundColor: progressBg }]}>
            <Text style={styles.trackEmoji}>{emoji}</Text>
          </View>
          <View>
            <Text style={styles.trackName}>{name}</Text>
            <Text style={styles.trackSub}>{lessonsDone}/{totalLessons} lessons done</Text>
          </View>
        </View>
        <Text style={[styles.trackPercent, { color: progressColor }]}>{progress}%</Text>
      </View>
      <View style={styles.progressBg}>
        <Animated.View
          style={[styles.progressFill, { width: animatedWidth, backgroundColor: progressColor }]}
        />
      </View>
    </View>
  );
}

// ─── Dashboard Screen ──────────────────────────────────────────────────────

export default function DashboardScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { totalLBsDone, tracksActive, badges, getTrackPercent, getTrackLessonsDone } = useProgress();

  const openBlaze = () => {
    const firstTrack = TRACKS[0];
    rootNav.navigate('BlazeChat', {
      trackId:    firstTrack?.id,
      trackName:  firstTrack?.name,
      trackEmoji: firstTrack?.emoji,
    });
  };

  useEffect(() => {
    console.log('[Dashboard] Mounted — totalLBsDone:', totalLBsDone);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Header ── */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Good morning, champion 🌅</Text>
                <Text style={styles.userName}>Sri</Text>
              </View>
              <Avatar />
            </View>

            {/* ── Streak ── */}
            <StreakCard />

            {/* ── Ask Blaze ── */}
            <TouchableOpacity style={styles.blazeBtn} activeOpacity={0.82} onPress={openBlaze}>
              <View style={styles.blazeBtnLeft}>
                <Text style={styles.blazeBtnEmoji}>🦅</Text>
                <View>
                  <Text style={styles.blazeBtnTitle}>Ask Blaze</Text>
                  <Text style={styles.blazeBtnSub}>Your AI mastery mentor</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color="#7C5CFF" />
            </TouchableOpacity>

            {/* ── Stat Pills ── */}
            <View style={styles.statRow}>
              <StatPill
                value={String(totalLBsDone)}
                label="LBs Done"
                color="#A882FF"
                bgColor="#130F28"
                borderColor="#2A1A50"
              />
              <StatPill
                value={String(tracksActive)}
                label="Tracks Active"
                color="#FF7070"
                bgColor="#1E0E18"
                borderColor="#3A1A2A"
              />
              <StatPill
                value={String(badges)}
                label="Badges"
                color="#4ECDC4"
                bgColor="#0C1E1C"
                borderColor="#143530"
              />
            </View>

            {/* ── Blaze Nudge ── */}
            <BlazeNudge lbsDone={totalLBsDone} />

            {/* ── Skill Tracks ── */}
            <Text style={styles.sectionTitle}>Your Skill Tracks</Text>

            {TRACKS.map((track, index) => {
              const total = getTrackStats(track).total;
              return (
                <SkillTrackCard
                  key={track.id}
                  emoji={track.emoji}
                  name={track.name}
                  progress={getTrackPercent(track.id)}
                  progressColor={track.progressColor}
                  progressBg={track.iconBg}
                  lessonsDone={getTrackLessonsDone(track.id)}
                  totalLessons={total}
                  animDelay={index * 120}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: '#6A5A8A',
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    marginTop: 1,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF', fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },

  streakCard: {
    borderRadius: 22, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1, borderColor: '#2A1A4A',
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  streakEmoji: { fontSize: 38 },
  streakTitle: { fontSize: 18, color: '#FFD93D', fontFamily: 'Poppins_700Bold' },
  streakSub:   { fontSize: 12, color: '#6A5A8A', fontFamily: 'Poppins_400Regular', marginTop: 3 },
  onFireBadge: {
    borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7,
    borderWidth: 1.5, borderColor: '#FF9F43', backgroundColor: '#1E1000',
  },
  onFireText: { color: '#FF9F43', fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8 },

  blazeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0C0A1E',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#3A2070',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  blazeBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  blazeBtnEmoji: { fontSize: 28 },
  blazeBtnTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  blazeBtnSub:   { color: '#5A4A7A', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statPill: {
    flex: 1, borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', borderWidth: 1,
  },
  statValue: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  statLabel: {
    fontSize: 10.5, color: '#5A4A7A',
    fontFamily: 'Poppins_400Regular',
    marginTop: 3, textAlign: 'center',
  },

  blazeCard: {
    borderRadius: 20, padding: 18, marginBottom: 24,
    backgroundColor: '#0C0A1E',
    borderWidth: 1.5, borderColor: '#4A2EA0',
  },
  blazeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  blazeEmoji:  { fontSize: 22 },
  blazeLabel:  { color: '#9B7AFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },
  blazeMessage: { color: '#C8B8E8', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  blazeHighlight: { color: '#FFD93D', fontFamily: 'Poppins_600SemiBold' },

  sectionTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 14 },

  trackCard: {
    backgroundColor: '#0E0B20', borderRadius: 20,
    padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#1C1640',
  },
  trackRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  trackLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trackIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trackEmoji:   { fontSize: 24 },
  trackName:    { color: '#FFFFFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  trackSub:     { color: '#5A4A7A', fontSize: 11.5, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  trackPercent: { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  progressBg:   { height: 8, backgroundColor: '#1A1640', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
});
