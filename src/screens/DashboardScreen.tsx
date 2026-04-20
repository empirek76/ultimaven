import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TRACKS, getTrackStats } from '../data/tracks';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';

// ─── Avatar ────────────────────────────────────────────────────────────────

function Avatar({ initial }: { initial: string }) {
  return (
    <LinearGradient colors={['#8A6AFF', '#5A35FF']} style={avatarStyles.avatar}>
      <Text style={avatarStyles.letter}>{initial}</Text>
    </LinearGradient>
  );
}
const avatarStyles = StyleSheet.create({
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  letter: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_700Bold' },
});

// ─── Streak Card ───────────────────────────────────────────────────────────

function StreakCard({ streak }: { streak: number }) {
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cardBg     = isDark ? '#1A1030' : '#FFF8E7';
  const cardBorder = isDark ? 'rgba(255,217,61,0.25)' : 'rgba(255,180,0,0.3)';
  const subColor   = isDark ? 'rgba(255,217,61,0.7)' : '#B8860B';

  return (
    <View style={[streakStyles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={streakStyles.left}>
        <Animated.Text style={[streakStyles.emoji, { opacity: glowAnim }]}>🔥</Animated.Text>
        <View>
          <Text style={[streakStyles.title, { color: colors.gold }]}>{streak} Day Streak</Text>
          <Text style={[streakStyles.sub, { color: subColor }]}>Keep the momentum going!</Text>
        </View>
      </View>
      {streak >= 7 && (
        <View style={streakStyles.badge}>
          <Text style={streakStyles.badgeTxt}>ON FIRE 🔥</Text>
        </View>
      )}
    </View>
  );
}
const streakStyles = StyleSheet.create({
  card:     { borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderWidth: 1 },
  left:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emoji:    { fontSize: 38 },
  title:    { fontSize: 18, fontFamily: 'Poppins_700Bold' },
  sub:      { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 3 },
  badge:    { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: '#FFD93D' },
  badgeTxt: { color: '#0D0D1A', fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.8 },
});

// ─── Stat Pill ─────────────────────────────────────────────────────────────

function StatPill({ value, label, color, bgColor, borderColor }: {
  value: string; label: string; color: string; bgColor: string; borderColor: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[statStyles.pill, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  pill:  { flex: 1, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1 },
  value: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  label: { fontSize: 10.5, fontFamily: 'Poppins_400Regular', marginTop: 3, textAlign: 'center' },
});

// ─── Blaze Nudge ───────────────────────────────────────────────────────────

function BlazeNudge({ lbsDone }: { lbsDone: number }) {
  const { colors, isDark } = useTheme();
  const nextMilestone = (Math.floor(lbsDone / 4) + 1) * 4;
  const toNext = nextMilestone - lbsDone;
  return (
    <View style={[
      nudgeStyles.card,
      { backgroundColor: colors.card, borderColor: colors.primary },
      !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    ]}>
      <View style={nudgeStyles.header}>
        <Text style={nudgeStyles.emoji}>🦅</Text>
        <Text style={[nudgeStyles.label, { color: colors.primaryLight }]}>Blaze says...</Text>
      </View>
      <Text style={[nudgeStyles.message, { color: colors.textSecondary }]}>
        {"You're "}
        <Text style={[nudgeStyles.highlight, { color: colors.gold }]}>{toNext} LB{toNext !== 1 ? 's' : ''}</Text>
        {" away from your next "}
        <Text style={[nudgeStyles.highlight, { color: colors.gold }]}>badge milestone</Text>
        {"! Keep pushing! 🔥"}
      </Text>
    </View>
  );
}
const nudgeStyles = StyleSheet.create({
  card:      { borderRadius: 20, padding: 18, marginBottom: 24, borderWidth: 1.5 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  emoji:     { fontSize: 22 },
  label:     { fontSize: 14, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },
  message:   { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  highlight: { fontFamily: 'Poppins_600SemiBold' },
});

// ─── Skill Track Card ──────────────────────────────────────────────────────

function SkillTrackCard({
  emoji, name, progress, progressColor, progressBg, cardBorder, lessonsDone, totalLessons, animDelay = 0, onPress,
}: {
  emoji: string; name: string; progress: number; progressColor: string;
  progressBg: string; cardBorder: string; lessonsDone: number; totalLessons: number; animDelay?: number; onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: progress, duration: 800, delay: animDelay, useNativeDriver: false }).start();
  }, [progress]);

  const animatedWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <TouchableOpacity
      style={[
        trackCardStyles.card,
        { backgroundColor: colors.card, borderColor: isDark ? cardBorder : '#E8E8F5' },
        !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={trackCardStyles.row}>
        <View style={trackCardStyles.left}>
          <View style={[trackCardStyles.iconBox, { backgroundColor: progressBg }]}>
            <Text style={trackCardStyles.emoji}>{emoji}</Text>
          </View>
          <View style={{ flex: 1, flexShrink: 1 }}>
            <Text style={[trackCardStyles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            <Text style={[trackCardStyles.sub, { color: colors.textSecondary }]}>{lessonsDone}/{totalLessons} lessons done</Text>
          </View>
        </View>
        <Text style={[trackCardStyles.percent, { color: colors.primaryLight }]}>{Math.round(progress)}%</Text>
      </View>
      <View style={[trackCardStyles.progressBg, { backgroundColor: colors.surface2 }]}>
        <Animated.View style={[trackCardStyles.progressFill, { width: animatedWidth, backgroundColor: progressColor }]} />
      </View>
      <Text style={[trackCardStyles.continueLink, { color: colors.primary }]}>Continue →</Text>
    </TouchableOpacity>
  );
}
const trackCardStyles = StyleSheet.create({
  card:        { borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1 },
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  left:        { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 8 },
  iconBox:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 24 },
  name:        { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  sub:         { fontSize: 11.5, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  percent:     { minWidth: 45, textAlign: 'right', paddingLeft: 4, fontSize: 18, fontWeight: '800', zIndex: 10 },
  progressBg:  { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 4 },
  continueLink:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginTop: 12, textAlign: 'right' },
});

// ─── Offline Banner ────────────────────────────────────────────────────────

function OfflineBanner() {
  return (
    <View style={offlineStyles.banner}>
      <Ionicons name="cloud-offline-outline" size={14} color="#FFD93D" />
      <Text style={offlineStyles.txt}>Offline mode · Showing cached data</Text>
    </View>
  );
}
const offlineStyles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1A1200', borderBottomWidth: 1, borderBottomColor: '#3A2A00', paddingVertical: 8 },
  txt:    { color: '#FFD93D', fontSize: 12, fontFamily: 'Poppins_400Regular' },
});

// ─── Greeting ──────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, champion 🌅';
  if (h < 17) return 'Good afternoon, champion ☀️';
  return 'Good evening, champion 🌙';
}

// ─── Dashboard Screen ──────────────────────────────────────────────────────

export default function DashboardScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [refreshing, setRefreshing] = useState(false);

  const { colors, isDark } = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { totalLBsDone, tracksActive, badges, getTrackPercent, getTrackLessonsDone, activeTracks, refreshActiveTracks, refreshProgress } = useProgress();
  const { profile, profileLoading, isNetworkError, refreshProfile } = useAuth();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.all([refreshProfile(), refreshActiveTracks(), refreshProgress()]);
    } catch {}
    setRefreshing(false);
  };

  const openBlaze = () => {
    const firstTrack = TRACKS[0];
    rootNav.navigate('BlazeChat', { trackId: firstTrack?.id, trackName: firstTrack?.name, trackEmoji: firstTrack?.emoji });
  };

  const openAddTrack = () => {
    rootNav.dispatch(CommonActions.navigate('Main', { screen: 'Tracks', params: { screen: 'AddTrack' } }));
  };

  const displayTracks = TRACKS.filter((t) => activeTracks.includes(t.id));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const displayName   = profile?.full_name ?? 'Champion';
  const avatarInitial = displayName[0].toUpperCase();
  const streakCount   = profile?.streak_count ?? 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isNetworkError && <OfflineBanner />}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        bounces
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            title="Refreshing..."
            titleColor={colors.primary}
          />
        }
      >
        {profileLoading && !profile ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
                <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
              </View>
              <Avatar initial={avatarInitial} />
            </View>

            {/* ── Streak ── */}
            <StreakCard streak={streakCount} />

            {/* ── Ask Blaze ── */}
            <TouchableOpacity style={[
              styles.blazeBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
            ]} activeOpacity={0.82} onPress={openBlaze}>
              <View style={styles.blazeBtnLeft}>
                <Text style={styles.blazeBtnEmoji}>🦅</Text>
                <View>
                  <Text style={[styles.blazeBtnTitle, { color: colors.text }]}>Ask Blaze</Text>
                  <Text style={[styles.blazeBtnSub, { color: colors.textSecondary }]}>Your AI mastery mentor</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </TouchableOpacity>

            {/* ── Stat Pills ── */}
            <View style={styles.statRow}>
              <StatPill value={String(totalLBsDone)} label="LBs Done"     color="#A882FF" bgColor={colors.surface2} borderColor={colors.border} />
              <StatPill value={String(tracksActive)} label="Tracks Active" color={colors.coral}  bgColor={colors.surface2} borderColor={colors.border} />
              <StatPill value={String(badges)}       label="Badges"        color={colors.green}  bgColor={colors.surface2} borderColor={colors.border} />
            </View>

            {/* ── Blaze Nudge ── */}
            <BlazeNudge lbsDone={totalLBsDone} />

            {/* ── Skill Tracks ── */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Skill Tracks</Text>

            {displayTracks.map((track, index) => {
              const total = getTrackStats(track).total;
              return (
                <SkillTrackCard
                  key={track.id}
                  emoji={track.emoji}
                  name={track.name}
                  progress={getTrackPercent(track.id)}
                  progressColor={track.progressColor}
                  progressBg={isDark ? track.iconBgDark : track.iconBgLight}
                  cardBorder={track.cardBorder}
                  lessonsDone={getTrackLessonsDone(track.id)}
                  totalLessons={total}
                  animDelay={index * 120}
                  onPress={() => rootNav.navigate('MasteryMap', { trackId: track.id, trackName: track.name })}
                />
              );
            })}

            <TouchableOpacity style={[styles.exploreBtn, { borderColor: colors.border, backgroundColor: colors.card }]} activeOpacity={0.75} onPress={openAddTrack}>
              <Text style={[styles.exploreTxt, { color: colors.primary }]}>Explore More Skills →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:        { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
    greeting:    { fontSize: 13, fontFamily: 'Poppins_400Regular', letterSpacing: 0.2 },
    userName:    { fontSize: 28, fontFamily: 'Poppins_700Bold', marginTop: 1 },

    blazeBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 18, marginBottom: 14 },
    blazeBtnLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
    blazeBtnEmoji: { fontSize: 28 },
    blazeBtnTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    blazeBtnSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

    statRow:  { flexDirection: 'row', gap: 10, marginBottom: 14 },

    sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 14 },

    exploreBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4, marginBottom: 8, borderRadius: 14, borderWidth: 1 },
    exploreTxt: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },
  });
}
