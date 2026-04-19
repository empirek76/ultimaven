import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TracksStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<TracksStackParamList, 'TracksList'>;

const TRACKS = [
  {
    id: 'guitar',
    name: 'Guitar',
    emoji: '🎸',
    progress: 29,
    color: '#FF6B6B',
    bgColor: '#2A1018',
    borderColor: '#3A1A22',
    lessonsDone: 8,
    total: 28,
    level: 'Beginner → Advanced',
    hasMap: true,
  },
  {
    id: 'finance',
    name: 'Personal Finance',
    emoji: '💰',
    progress: 50,
    color: '#4ECDC4',
    bgColor: '#0C201E',
    borderColor: '#143530',
    lessonsDone: 12,
    total: 24,
    level: 'Beginner → Intermediate',
    hasMap: false,
  },
  {
    id: 'body',
    name: 'Body Transformation',
    emoji: '💪',
    progress: 16,
    color: '#FF9F43',
    bgColor: '#201508',
    borderColor: '#2E1E08',
    lessonsDone: 4,
    total: 25,
    level: 'All Levels',
    hasMap: false,
  },
];

function TrackCard({
  track,
  onPress,
}: {
  track: typeof TRACKS[0];
  onPress?: () => void;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: track.progress,
      duration: 1000,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <TouchableOpacity
      style={[styles.trackCard, { borderColor: track.borderColor }]}
      onPress={onPress}
      activeOpacity={track.hasMap ? 0.78 : 1}
    >
      <View style={styles.trackCardTop}>
        <View style={[styles.trackIconBox, { backgroundColor: track.bgColor }]}>
          <Text style={styles.trackEmoji}>{track.emoji}</Text>
        </View>
        <View style={styles.trackInfo}>
          <Text style={styles.trackName}>{track.name}</Text>
          <Text style={styles.trackLevel}>{track.level}</Text>
        </View>
        {track.hasMap ? (
          <View style={styles.mapBadge}>
            <Text style={styles.mapBadgeText}>Mastery Map</Text>
            <Ionicons name="chevron-forward" size={12} color="#9B7AFF" />
          </View>
        ) : (
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>Soon</Text>
          </View>
        )}
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBg}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: track.color,
                width: widthAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.progressPct, { color: track.color }]}>{track.progress}%</Text>
      </View>
      <Text style={styles.lessonCount}>
        {track.lessonsDone}/{track.total} lessons done
      </Text>
    </TouchableOpacity>
  );
}

export default function TracksScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Tracks</Text>
              <Text style={styles.subtitle}>3 active · Keep building</Text>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>3</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {TRACKS.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onPress={
                  track.hasMap
                    ? () =>
                        navigation.navigate('MasteryMap', {
                          trackId: track.id,
                          trackName: track.name,
                        })
                    : undefined
                }
              />
            ))}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

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
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 13,
    color: '#5A4A7A',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#1A1438',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A1A5A',
  },
  headerBadgeText: {
    color: '#7C5CFF',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  trackCard: {
    backgroundColor: '#0E0B20',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
  },
  trackCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  trackIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackEmoji: { fontSize: 26 },
  trackInfo: { flex: 1 },
  trackName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  trackLevel: {
    color: '#5A4A7A',
    fontSize: 11.5,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1A1040',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#3A2070',
  },
  mapBadgeText: {
    color: '#9B7AFF',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  soonBadge: {
    backgroundColor: '#141228',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#1E1840',
  },
  soonText: {
    color: '#3A2A6A',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  progressBg: {
    flex: 1,
    height: 7,
    backgroundColor: '#1A1640',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    width: 36,
    textAlign: 'right',
  },
  lessonCount: {
    color: '#4A3A6A',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
});
