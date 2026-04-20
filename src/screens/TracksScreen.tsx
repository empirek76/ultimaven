import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { TracksStackParamList, RootStackParamList } from '../types/navigation';
import { TRACKS, getTrackStats } from '../data/tracks';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeColors } from '../context/ThemeContext';

type Props = NativeStackScreenProps<TracksStackParamList, 'TracksList'>;

// ─── Track Card ────────────────────────────────────────────────────────────

function TrackCard({
  track,
  progress,
  lessonsDone,
  total,
  onPress,
}: {
  track: typeof TRACKS[0];
  progress: number;
  lessonsDone: number;
  total: number;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: progress, duration: 800, delay: 200, useNativeDriver: false }).start();
  }, [progress]);

  return (
    <TouchableOpacity
      style={[
        cardStyles.card,
        { backgroundColor: colors.card, borderColor: isDark ? track.cardBorder : '#E8E8F5' },
        !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
      ]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={cardStyles.top}>
        <View style={[cardStyles.iconBox, { backgroundColor: isDark ? track.iconBgDark : track.iconBgLight }]}>
          <Text style={cardStyles.emoji}>{track.emoji}</Text>
        </View>
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, { color: colors.text }]}>{track.name}</Text>
          <Text style={[cardStyles.level, { color: colors.textSecondary }]}>{track.level}</Text>
        </View>
        <View style={[cardStyles.badge, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={[cardStyles.badgeTxt, { color: colors.primaryLight }]}>Mastery Map</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.primaryLight} />
        </View>
      </View>

      <View style={cardStyles.progressRow}>
        <View style={[cardStyles.progressBg, { backgroundColor: colors.surface2 }]}>
          <Animated.View
            style={[
              cardStyles.progressFill,
              {
                backgroundColor: track.progressColor,
                width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
        <Text style={[cardStyles.pct, { color: colors.primaryLight }]}>{Math.round(progress)}%</Text>
      </View>
      <Text style={[cardStyles.count, { color: colors.textSecondary }]}>{lessonsDone}/{total} lessons done</Text>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card:        { borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1 },
  top:         { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  iconBox:     { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 26 },
  info:        { flex: 1 },
  name:        { fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  level:       { fontSize: 11.5, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1 },
  badgeTxt:    { fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  progressBg:  { flex: 1, maxWidth: '70%', height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 4 },
  pct:         { minWidth: 45, textAlign: 'right', paddingLeft: 4, fontSize: 18, fontWeight: '800', zIndex: 10 },
  count:       { fontSize: 11, fontFamily: 'Poppins_400Regular' },
});

// ─── Screen ────────────────────────────────────────────────────────────────

export default function TracksScreen({ navigation }: Props) {
  const rootNav  = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const { getTrackPercent, getTrackLessonsDone, activeTracks, refreshActiveTracks, refreshProgress } = useProgress();
  const { user, loading: authLoading } = useAuth();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.all([refreshActiveTracks(), refreshProgress()]);
    } catch {}
    setRefreshing(false);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const displayTracks = TRACKS.filter((t) => activeTracks.includes(t.id));
  const isLoading = !authLoading && !!user && activeTracks.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>My Tracks</Text>
                <Text style={styles.subtitle}>
                  {displayTracks.length} {displayTracks.length === 1 ? 'track' : 'tracks'} · Your mastery path
                </Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{displayTracks.length}</Text>
              </View>
            </View>

            {displayTracks.map((track) => {
              const total = getTrackStats(track).total;
              return (
                <TrackCard
                  key={track.id}
                  track={track}
                  progress={getTrackPercent(track.id)}
                  lessonsDone={getTrackLessonsDone(track.id)}
                  total={total}
                  onPress={() => rootNav.navigate('MasteryMap', { trackId: track.id, trackName: track.name })}
                />
              );
            })}

            {/* Add New Skill Track card */}
            <TouchableOpacity
              style={styles.addCard}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('AddTrack')}
            >
              <View style={styles.addCardInner}>
                <View style={styles.addIconBox}>
                  <Ionicons name="add" size={28} color={colors.primary} />
                </View>
                <View style={styles.addTextCol}>
                  <Text style={styles.addTitle}>Add New Skill Track</Text>
                  <Text style={styles.addSub}>
                    {TRACKS.length - displayTracks.length} more {TRACKS.length - displayTracks.length === 1 ? 'track' : 'tracks'} available
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe:        { flex: 1, backgroundColor: c.background },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 100 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
    },
    title:    { fontSize: 24, color: c.text, fontFamily: 'Poppins_700Bold' },
    subtitle: { fontSize: 13, color: c.textSecondary, fontFamily: 'Poppins_400Regular', marginTop: 2 },
    headerBadge: {
      width: 36, height: 36, borderRadius: 12,
      backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border,
    },
    headerBadgeText: { color: c.primary, fontSize: 15, fontFamily: 'Poppins_700Bold' },

    addCard: {
      borderRadius: 20, borderWidth: 1.5, borderColor: c.border,
      borderStyle: 'dashed', backgroundColor: c.card, marginBottom: 14, overflow: 'hidden',
    },
    addCardInner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
    addIconBox: {
      width: 52, height: 52, borderRadius: 16,
      backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border,
    },
    addTextCol: { flex: 1 },
    addTitle:   { color: c.primary, fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
    addSub:     { color: c.textSecondary, fontSize: 11.5, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  });
}
