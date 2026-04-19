import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StyleSheet as RNStyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TracksStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<TracksStackParamList, 'LearningBlockPlayer'>;
type TabName = 'Learn' | 'Practice' | 'Examples';

// ─── Answer data ────────────────────────────────────────────────────────────

const ANSWERS = [
  { id: 0, text: 'Fingers 2, 3 and 4 on strings 6, 5 and 1', correct: true  },
  { id: 1, text: 'Fingers 1, 2 and 3 on strings 4, 5 and 6', correct: false },
  { id: 2, text: 'Any three fingers on the top three strings', correct: false },
];

// ─── Video zone ─────────────────────────────────────────────────────────────

function VideoZone() {
  return (
    <LinearGradient
      colors={['#1E0A44', '#180940', '#0D0D1A']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.videoZone}
    >
      {/* Glow stack centred via playArea fixed-size container */}
      <View style={styles.playArea}>
        <View style={styles.glowRingOuter} />
        <View style={styles.glowRingMid}  />
        <View style={styles.glowRingInner} />
        <TouchableOpacity style={styles.playCircle} activeOpacity={0.82}>
          <Ionicons name="play" size={30} color="#FFFFFF" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>

      {/* Bottom meta row */}
      <View style={styles.videoMeta} pointerEvents="none">
        <Text style={styles.videoTitle} numberOfLines={1}>
          Open Chord: G Major — Concept
        </Text>
        <View style={styles.durationPill}>
          <Text style={styles.durationText}>2:47</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── Tab bar ────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: TabName;
  onChange: (t: TabName) => void;
}) {
  const tabs: TabName[] = ['Learn', 'Practice', 'Examples'];
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, active === tab && styles.tabActive]}
          onPress={() => onChange(tab)}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabTxt, active === tab && styles.tabTxtActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Answer card ────────────────────────────────────────────────────────────

function AnswerCard({
  answer,
  selected,
  revealed,
  onPress,
}: {
  answer: typeof ANSWERS[0];
  selected: boolean;
  revealed: boolean; // correct answer shown after wrong pick
  onPress: () => void;
}) {
  const showCorrect = selected && answer.correct;
  const showWrong   = selected && !answer.correct;
  const showReveal  = revealed && answer.correct && !selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.answerCard,
        showCorrect && styles.answerCardCorrect,
        showWrong   && styles.answerCardWrong,
        showReveal  && styles.answerCardReveal,
      ]}
    >
      <Text
        style={[
          styles.answerTxt,
          showCorrect && styles.answerTxtCorrect,
          showWrong   && styles.answerTxtWrong,
          showReveal  && styles.answerTxtCorrect,
        ]}
      >
        {answer.text}
      </Text>
      {(showCorrect || showReveal) && (
        <View style={[styles.answerIcon, styles.iconCorrect]}>
          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        </View>
      )}
      {showWrong && (
        <View style={[styles.answerIcon, styles.iconWrong]}>
          <Ionicons name="close" size={13} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Practice tab ────────────────────────────────────────────────────────────

function PracticeTab({ onRetry }: { onRetry: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const hasWrongPick = selected !== null && !ANSWERS[selected].correct;

  function handleRetry() {
    setSelected(null);
    onRetry();
  }

  return (
    <View style={styles.practiceWrap}>
      {/* Score row */}
      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>Practice Score</Text>
        <Text style={styles.scoreValue}>82% ✓</Text>
      </View>

      {/* Exercise card */}
      <View style={styles.exerciseCard}>
        <View style={styles.exerciseBadge}>
          <Text style={styles.exerciseBadgeTxt}>Exercise 1</Text>
        </View>
        <Text style={styles.question}>
          Which fingers should you use to fret the G Major chord?
        </Text>
      </View>

      {/* Answer options */}
      {ANSWERS.map((ans) => (
        <AnswerCard
          key={ans.id}
          answer={ans}
          selected={selected === ans.id}
          revealed={hasWrongPick}
          onPress={() => { if (selected === null) setSelected(ans.id); }}
        />
      ))}

      {/* Inline retry link */}
      {selected !== null && (
        <TouchableOpacity onPress={handleRetry} style={styles.retryInline} activeOpacity={0.7}>
          <Ionicons name="refresh" size={13} color="#7C5CFF" />
          <Text style={styles.retryInlineTxt}>Retry this exercise</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Placeholder tab ─────────────────────────────────────────────────────────

function PlaceholderTab({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderEmoji}>{emoji}</Text>
      <Text style={styles.placeholderTxt}>{label}</Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LearningBlockPlayerScreen({ navigation, route }: Props) {
  const { lbId, lbTitle } = route.params;
  const [activeTab, setActiveTab] = useState<TabName>('Practice');
  const [retryKey, setRetryKey]   = useState(0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Learning Block</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Video zone */}
          <VideoZone />

          {/* Content */}
          <View style={styles.body}>
            {/* LB badge */}
            <View style={styles.lbBadge}>
              <Text style={styles.lbBadgeTxt}>🎸  LB {lbId} of 28</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{lbTitle}</Text>

            {/* Description */}
            <Text style={styles.description}>
              Master the G Major chord — one of the most used chords in music. By
              the end of this LB you'll be able to form and strum G Major cleanly
              without muting strings.
            </Text>

            {/* Tabs */}
            <TabBar active={activeTab} onChange={setActiveTab} />

            {/* Tab content */}
            {activeTab === 'Practice' && (
              <PracticeTab key={retryKey} onRetry={() => setRetryKey((k) => k + 1)} />
            )}
            {activeTab === 'Learn'    && <PlaceholderTab emoji="📖" label="Lesson content coming soon" />}
            {activeTab === 'Examples' && <PlaceholderTab emoji="🎵" label="Song examples coming soon" />}

            {/* Bottom buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={() =>
                  navigation.navigate('AchievementCelebration', { lbId, lbTitle })
                }
              >
                <LinearGradient
                  colors={['#7C5CFF', '#6C47FF', '#5A35FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnTxt}>Complete LB & Advance 🔥</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineBtn}
                activeOpacity={0.7}
                onPress={() => setRetryKey((k) => k + 1)}
              >
                <Text style={styles.outlineBtnTxt}>Retry Practice Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe:      { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#1A1438',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A1A5A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },

  scrollContent: { paddingBottom: 48 },

  // Video zone
  videoZone: {
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Play area — fixed size container so glow rings can be abs-positioned predictably
  playArea: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#7C5CFF',
    opacity: 0.13,
    top: 0,
    left: 0,
  },
  glowRingMid: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#7C5CFF',
    opacity: 0.18,
    top: 21,  // (160-118)/2
    left: 21,
  },
  glowRingInner: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#9B7AFF',
    opacity: 0.25,
    top: 39,  // (160-82)/2
    left: 39,
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 1,
  },

  // Video bottom meta
  videoMeta: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
    marginRight: 10,
  },
  durationPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Body content
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  lbBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#261A52',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#4A2EA0',
  },
  lbBadgeTxt: {
    color: '#A882FF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.2,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 30,
    marginBottom: 10,
  },
  description: {
    color: '#7A6A9A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
    marginBottom: 22,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E0B20',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1C1640',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#7C5CFF',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  tabTxt: {
    color: '#4A3A6A',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  tabTxtActive: {
    color: '#FFFFFF',
  },

  // Practice tab
  practiceWrap: { gap: 10 },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E0B20',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#1C1640',
  },
  scoreLabel: {
    color: '#7A6A9A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  scoreValue: {
    color: '#3DD68C',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },

  exerciseCard: {
    backgroundColor: '#0E0B20',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1C1640',
    gap: 12,
  },
  exerciseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1438',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2A1A5A',
  },
  exerciseBadgeTxt: {
    color: '#7C5CFF',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.4,
  },
  question: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 22,
  },

  // Answer cards
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E0B20',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#1C1640',
    gap: 10,
  },
  answerCardCorrect: {
    backgroundColor: '#0A1E14',
    borderColor: '#3DD68C',
  },
  answerCardWrong: {
    backgroundColor: '#1E0A0A',
    borderColor: '#FF6B6B',
  },
  answerCardReveal: {
    backgroundColor: '#0A1E14',
    borderColor: '#3DD68C',
    opacity: 0.8,
  },
  answerTxt: {
    color: '#C4B4E0',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
    lineHeight: 20,
  },
  answerTxtCorrect: {
    color: '#3DD68C',
    fontFamily: 'Poppins_600SemiBold',
  },
  answerTxtWrong: {
    color: '#FF6B6B',
    fontFamily: 'Poppins_600SemiBold',
  },
  answerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconCorrect: { backgroundColor: '#3DD68C' },
  iconWrong:   { backgroundColor: '#FF6B6B' },

  retryInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  retryInlineTxt: {
    color: '#7C5CFF',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  // Placeholder tabs
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  placeholderEmoji: { fontSize: 40 },
  placeholderTxt: {
    color: '#4A3A6A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },

  // Bottom buttons
  buttons: {
    marginTop: 28,
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  primaryBtnTxt: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
  outlineBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2A1A5A',
  },
  outlineBtnTxt: {
    color: '#7A6A9A',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
});
