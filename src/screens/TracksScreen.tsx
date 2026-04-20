import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TracksStackParamList } from '../types/navigation';
import { TRACKS, getTrackStats } from '../data/tracks';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';

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
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <TouchableOpacity
      style={[styles.trackCard, { borderColor: track.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={styles.trackCardTop}>
        <View style={[styles.trackIconBox, { backgroundColor: track.iconBg }]}>
          <Text style={styles.trackEmoji}>{track.emoji}</Text>
        </View>
        <View style={styles.trackInfo}>
          <Text style={styles.trackName}>{track.name}</Text>
          <Text style={styles.trackLevel}>{track.level}</Text>
        </View>
        <View style={styles.mapBadge}>
          <Text style={styles.mapBadgeText}>Mastery Map</Text>
          <Ionicons name="chevron-forward" size={12} color="#9B7AFF" />
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBg}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: track.progressColor,
                width: widthAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressPct}>
          {Math.round(progress)}%
        </Text>
      </View>
      <Text style={styles.lessonCount}>{lessonsDone}/{total} lessons done</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function TracksScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { getTrackPercent, getTrackLessonsDone, activeTracks } = useProgress();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const displayTracks = TRACKS.filter((t) => activeTracks.includes(t.id));
  const isLoading = !authLoading && !!user && activeTracks.length === 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
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

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#7C5CFF" />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {displayTracks.map((track) => {
                const total = getTrackStats(track).total;
                return (
                  <TrackCard
                    key={track.id}
                    track={track}
                    progress={getTrackPercent(track.id)}
                    lessonsDone={getTrackLessonsDone(track.id)}
                    total={total}
                    onPress={() =>
                      navigation.navigate('MasteryMap', {
                        trackId:   track.id,
                        trackName: track.name,
                      })
                    }
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
                    <Ionicons name="add" size={28} color="#7C5CFF" />
                  </View>
                  <View style={styles.addTextCol}>
                    <Text style={styles.addTitle}>Add New Skill Track</Text>
                    <Text style={styles.addSub}>
                      {TRACKS.length - displayTracks.length} more {TRACKS.length - displayTracks.length === 1 ? 'track' : 'tracks'} available
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7C5CFF" />
                </View>
              </TouchableOpacity>
            </ScrollView>
          )}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title:    { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  subtitle: { fontSize: 13, color: '#5A4A7A', fontFamily: 'Poppins_400Regular', marginTop: 2 },
  headerBadge: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#1A1438',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A1A5A',
  },
  headerBadgeText: { color: '#7C5CFF', fontSize: 15, fontFamily: 'Poppins_700Bold' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  trackCard: {
    backgroundColor: '#0E0B20', borderRadius: 20,
    padding: 18, marginBottom: 14, borderWidth: 1,
  },
  trackCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  trackIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  trackEmoji:   { fontSize: 26 },
  trackInfo:    { flex: 1 },
  trackName:    { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  trackLevel:   { color: '#5A4A7A', fontSize: 11.5, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  mapBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#1A1040', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: '#3A2070',
  },
  mapBadgeText: { color: '#9B7AFF', fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, overflow: 'visible' },
  progressBg: { flex: 1, maxWidth: '70%', height: 7, backgroundColor: '#1A1640', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { minWidth: 45, textAlign: 'right', paddingLeft: 4, color: '#8B6FFF', fontSize: 18, fontWeight: '800', zIndex: 10 },
  lessonCount: { color: '#4A3A6A', fontSize: 11, fontFamily: 'Poppins_400Regular' },

  addCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#3A2070',
    borderStyle: 'dashed',
    backgroundColor: '#0C0A1E',
    marginBottom: 14,
    overflow: 'hidden',
  },
  addCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  addIconBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#160E38',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#3A2070',
  },
  addTextCol: { flex: 1 },
  addTitle: { color: '#9B7AFF', fontSize: 15, fontFamily: 'Poppins_600SemiBold' },
  addSub:   { color: '#4A3A6A', fontSize: 11.5, fontFamily: 'Poppins_400Regular', marginTop: 2 },
});
