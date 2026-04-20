import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TracksStackParamList } from '../types/navigation';
import { TRACKS } from '../data/tracks';
import { useProgress } from '../context/ProgressContext';

type Props = NativeStackScreenProps<TracksStackParamList, 'AddTrack'>;

export default function AddTrackScreen({ navigation }: Props) {
  const { activeTracks, addTrack } = useProgress();
  const [adding, setAdding] = useState<string | null>(null);

  const handleAdd = async (trackId: string) => {
    if (activeTracks.includes(trackId) || adding) return;
    setAdding(trackId);
    await addTrack(trackId);
    setAdding(null);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Add Skill Track</Text>
            <Text style={styles.subtitle}>Choose a new track to master</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {TRACKS.map((track) => {
            const isAdded   = activeTracks.includes(track.id);
            const isLoading = adding === track.id;

            return (
              <TouchableOpacity
                key={track.id}
                style={[styles.card, isAdded && styles.cardAdded]}
                activeOpacity={isAdded ? 1 : 0.78}
                onPress={() => handleAdd(track.id)}
                disabled={isAdded || !!adding}
              >
                <View style={[styles.iconBox, { backgroundColor: track.iconBg }]}>
                  <Text style={styles.emoji}>{track.emoji}</Text>
                </View>

                <View style={styles.textCol}>
                  <Text style={[styles.trackName, isAdded && styles.trackNameAdded]}>
                    {track.name}
                  </Text>
                  <Text style={styles.trackLevel}>{track.level}</Text>
                </View>

                <View style={styles.actionBox}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#7C5CFF" />
                  ) : isAdded ? (
                    <View style={styles.addedBadge}>
                      <Ionicons name="checkmark" size={14} color="#3DD68C" />
                      <Text style={styles.addedTxt}>Added</Text>
                    </View>
                  ) : (
                    <View style={styles.addBadge}>
                      <Ionicons name="add" size={18} color="#7C5CFF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe:      { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#1A1438',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A1A5A',
  },
  headerText: { flex: 1 },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    color: '#4A3A6A',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0B20',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1C1640',
    gap: 14,
  },
  cardAdded: {
    borderColor: '#1A3A28',
    opacity: 0.6,
  },

  iconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 26 },

  textCol: { flex: 1 },
  trackName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  trackNameAdded: { color: '#5A4A7A' },
  trackLevel: {
    color: '#4A3A6A',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  actionBox: {
    width: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  addBadge: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#160E38',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#3A2070',
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#0C2218',
    borderWidth: 1,
    borderColor: '#1A3A28',
  },
  addedTxt: {
    color: '#3DD68C',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
});
