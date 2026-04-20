import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Video, ResizeMode } from 'expo-av';
import { RootStackParamList } from '../types/navigation';
import { useProgress } from '../context/ProgressContext';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { supabase } from '../services/supabase';
import { getLBVideoUrl } from '../services/videoService';

type Props = NativeStackScreenProps<RootStackParamList, 'LearningBlockPlayer'>;
type TabName = 'Learn' | 'Practice' | 'Examples';

// ─── Quiz data per track ─────────────────────────────────────────────────────

type QuizAnswer = { id: number; text: string; correct: boolean };
type Quiz = { question: string; answers: QuizAnswer[] };

const QUIZ_DATA: Record<string, Quiz> = {
  guitar: {
    question: 'Which fingers should you use to fret the G Major chord?',
    answers: [
      { id: 0, text: 'Fingers 2, 3 and 4 on strings 6, 5 and 1', correct: true  },
      { id: 1, text: 'Fingers 1, 2 and 3 on strings 4, 5 and 6', correct: false },
      { id: 2, text: 'Any three fingers on the top three strings', correct: false },
    ],
  },
  finance: {
    question: 'What is the first step to building financial health?',
    answers: [
      { id: 0, text: 'Track every dollar you earn and spend',     correct: true  },
      { id: 1, text: 'Invest as much as possible right away',     correct: false },
      { id: 2, text: 'Pay off all debts before saving anything',  correct: false },
    ],
  },
  body: {
    question: 'Which of the following best describes a compound movement?',
    answers: [
      { id: 0, text: 'An exercise targeting multiple muscle groups at once', correct: true  },
      { id: 1, text: 'An exercise performed on machines only',               correct: false },
      { id: 2, text: 'Any movement that requires free weights',              correct: false },
    ],
  },
  design: {
    question: 'What is the primary purpose of visual hierarchy in design?',
    answers: [
      { id: 0, text: "Guide the viewer's eye to the most important elements first", correct: true  },
      { id: 1, text: 'Use as many fonts as possible for visual variety',            correct: false },
      { id: 2, text: 'Fill all available white space on the canvas',                correct: false },
    ],
  },
  reading: {
    question: 'What is subvocalisation in reading?',
    answers: [
      { id: 0, text: 'Silently pronouncing words in your head while reading', correct: true  },
      { id: 1, text: 'Reading out loud to improve comprehension',             correct: false },
      { id: 2, text: 'Using a pointer to track text on the page',             correct: false },
    ],
  },
};

// ─── Video player ─────────────────────────────────────────────────────────────

const VIDEO_HEIGHT = 230;

type VideoZoneState = 'fetching' | 'no_video' | 'ready';

function VideoPlayer({ trackId, lbNumber, lbTitle }: { trackId: string; lbNumber: number; lbTitle: string }) {
  const [zoneState, setZoneState] = useState<VideoZoneState>('fetching');
  const [videoUrl,  setVideoUrl]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('lb_submissions')
          .select('video_path')
          .eq('track_id', trackId)
          .eq('lb_number', lbNumber)
          .eq('status', 'approved')
          .limit(1)
          .maybeSingle();

        if (!mounted) return;

        if (data?.video_path) {
          const url = getLBVideoUrl(data.video_path);
          console.error('VIDEO URL:', url);
          if (!mounted) return;
          setVideoUrl(url);
          setZoneState('ready');
        } else {
          setZoneState('no_video');
        }
      } catch {
        if (mounted) setZoneState('no_video');
      }
    })();
    return () => { mounted = false; };
  }, [trackId, lbNumber]);

  if (zoneState === 'fetching') {
    return (
      <View style={videoStyles.zone}>
        <ActivityIndicator size="large" color="#7C5CFF" />
      </View>
    );
  }

  if (zoneState === 'no_video') {
    return (
      <LinearGradient colors={['#1E0A44', '#180940', '#0D0D1A']} style={videoStyles.zone}>
        <View style={videoStyles.placeholderContent}>
          <Text style={videoStyles.placeholderEmoji}>🎬</Text>
          <Text style={videoStyles.placeholderText}>Video coming soon</Text>
        </View>
        <View style={videoStyles.zoneMeta} pointerEvents="none">
          <Text style={videoStyles.zoneTitle} numberOfLines={1}>{lbTitle} — Concept</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View>
      <View style={videoStyles.playerWrap}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl! }}
          style={videoStyles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          useNativeControls
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={(error) => console.error('Video error:', error)}
        />
        {loading && (
          <View style={videoStyles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7C5CFF" />
          </View>
        )}
      </View>
      {__DEV__ && videoUrl && (
        <TouchableOpacity
          style={videoStyles.testBtn}
          onPress={() => Linking.openURL(videoUrl)}
        >
          <Text style={videoStyles.testBtnTxt}>🔗 Test video URL in browser</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const videoStyles = StyleSheet.create({
  zone:               { height: VIDEO_HEIGHT, backgroundColor: '#0D0D1A', alignItems: 'center', justifyContent: 'center' },
  placeholderContent: { alignItems: 'center', gap: 8 },
  placeholderEmoji:   { fontSize: 44 },
  placeholderText:    { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  zoneMeta:           { position: 'absolute', bottom: 14, left: 16, right: 16 },
  zoneTitle:          { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  playerWrap:         { backgroundColor: '#000', position: 'relative' },
  video:              { width: '100%', height: VIDEO_HEIGHT },
  loadingOverlay:     { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  testBtn:            { backgroundColor: '#2a2a2a', paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  testBtnTxt:         { color: '#888', fontSize: 11, fontFamily: 'Poppins_400Regular' },
});

// ─── Tab bar ────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: TabName; onChange: (t: TabName) => void }) {
  const { colors } = useTheme();
  const tabs: TabName[] = ['Learn', 'Practice', 'Examples'];
  return (
    <View style={[tabStyles.bar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[tabStyles.tab, active === tab && tabStyles.tabActive]}
          onPress={() => onChange(tab)}
          activeOpacity={0.75}
        >
          <Text style={[tabStyles.txt, { color: colors.textSecondary }, active === tab && tabStyles.txtActive]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const tabStyles = StyleSheet.create({
  bar:      { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 20, borderWidth: 1 },
  tab:      { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: 'center' },
  tabActive:{ backgroundColor: '#7C5CFF', shadowColor: '#7C5CFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 4 },
  txt:      { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  txtActive:{ color: '#FFFFFF' },
});

// ─── Answer card ────────────────────────────────────────────────────────────

function AnswerCard({ answer, selected, revealed, onPress }: {
  answer: QuizAnswer; selected: boolean; revealed: boolean; onPress: () => void;
}) {
  const { colors } = useTheme();
  const showCorrect = selected && answer.correct;
  const showWrong   = selected && !answer.correct;
  const showReveal  = revealed && answer.correct && !selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        answerStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        showCorrect && answerStyles.correct,
        showWrong   && answerStyles.wrong,
        showReveal  && [answerStyles.correct, { opacity: 0.8 }],
      ]}
    >
      <Text style={[
        answerStyles.txt, { color: colors.text },
        showCorrect && answerStyles.txtCorrect,
        showWrong   && answerStyles.txtWrong,
        showReveal  && answerStyles.txtCorrect,
      ]}>
        {answer.text}
      </Text>
      {(showCorrect || showReveal) && (
        <View style={[answerStyles.icon, answerStyles.iconCorrect]}>
          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        </View>
      )}
      {showWrong && (
        <View style={[answerStyles.icon, answerStyles.iconWrong]}>
          <Ionicons name="close" size={13} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
}
const answerStyles = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 16, borderWidth: 1.5, gap: 10 },
  correct:    { backgroundColor: '#0A1E14', borderColor: '#3DD68C' },
  wrong:      { backgroundColor: '#1E0A0A', borderColor: '#FF6B6B' },
  txt:        { fontSize: 14, fontFamily: 'Poppins_400Regular', flex: 1, lineHeight: 20 },
  txtCorrect: { color: '#3DD68C', fontFamily: 'Poppins_600SemiBold' },
  txtWrong:   { color: '#FF6B6B', fontFamily: 'Poppins_600SemiBold' },
  icon:       { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconCorrect:{ backgroundColor: '#3DD68C' },
  iconWrong:  { backgroundColor: '#FF6B6B' },
});

// ─── Practice tab ────────────────────────────────────────────────────────────

function PracticeTab({ quiz, onRetry, onAnswered }: { quiz: Quiz; onRetry: () => void; onAnswered: (score: number) => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const hasWrongPick = selected !== null && !quiz.answers[selected].correct;
  const scoreDisplay = selected === null ? '—' : quiz.answers[selected].correct ? '100% ✓' : '50% ✓';

  function handleRetry() { setSelected(null); onRetry(); }
  function handleSelect(id: number) {
    if (selected !== null) return;
    setSelected(id);
    onAnswered(quiz.answers[id].correct ? 100 : 50);
  }

  return (
    <View style={practiceStyles.wrap}>
      <View style={[practiceStyles.scoreRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[practiceStyles.scoreLabel, { color: colors.textSecondary }]}>Practice Score</Text>
        <Text style={practiceStyles.scoreValue}>{scoreDisplay}</Text>
      </View>

      <View style={[practiceStyles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[practiceStyles.exerciseBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[practiceStyles.exerciseBadgeTxt, { color: colors.primary }]}>Exercise 1</Text>
        </View>
        <Text style={[practiceStyles.question, { color: colors.text }]}>{quiz.question}</Text>
      </View>

      {quiz.answers.map((ans) => (
        <AnswerCard
          key={ans.id}
          answer={ans}
          selected={selected === ans.id}
          revealed={hasWrongPick}
          onPress={() => handleSelect(ans.id)}
        />
      ))}

      {selected !== null && (
        <TouchableOpacity onPress={handleRetry} style={practiceStyles.retry} activeOpacity={0.7}>
          <Ionicons name="refresh" size={13} color="#7C5CFF" />
          <Text style={practiceStyles.retryTxt}>Retry this exercise</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const practiceStyles = StyleSheet.create({
  wrap:          { gap: 10 },
  scoreRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1 },
  scoreLabel:    { fontSize: 14, fontFamily: 'Poppins_400Regular' },
  scoreValue:    { color: '#3DD68C', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  exerciseCard:  { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  exerciseBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  exerciseBadgeTxt: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 0.4 },
  question:      { fontSize: 15, fontFamily: 'Poppins_600SemiBold', lineHeight: 22 },
  retry:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 4 },
  retryTxt:      { color: '#7C5CFF', fontSize: 13, fontFamily: 'Poppins_400Regular' },
});

// ─── Placeholder tab ─────────────────────────────────────────────────────────

function PlaceholderTab({ emoji, label }: { emoji: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={placeholderStyles.wrap}>
      <Text style={placeholderStyles.emoji}>{emoji}</Text>
      <Text style={[placeholderStyles.txt, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
const placeholderStyles = StyleSheet.create({
  wrap:  { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emoji: { fontSize: 40 },
  txt:   { fontSize: 14, fontFamily: 'Poppins_400Regular' },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LearningBlockPlayerScreen({ navigation, route }: Props) {
  const { lbId, lbTitle, lbNumber, lbDescription, trackId, trackEmoji, trackName, totalLBs } = route.params;

  const [activeTab, setActiveTab]         = useState<TabName>('Practice');
  const [retryKey, setRetryKey]           = useState(0);
  const [practiceScore, setPracticeScore] = useState<number | null>(null);

  const { colors } = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { completeLB } = useProgress();
  const quiz = QUIZ_DATA[trackId] ?? QUIZ_DATA['guitar'];

  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function handleComplete() {
    const score = practiceScore ?? 100;
    await completeLB(trackId, lbId, score);
    navigation.navigate('AchievementCelebration', { lbId, lbTitle, lbNumber, trackId, trackEmoji, trackName, nextLbNumber: lbNumber + 1, totalLBs, score });
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Learning Block</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <VideoPlayer trackId={trackId} lbNumber={lbNumber} lbTitle={lbTitle} />

          <View style={styles.body}>
            <View style={styles.lbBadge}>
              <Text style={styles.lbBadgeTxt}>{trackEmoji}  LB {lbNumber} of {totalLBs}</Text>
            </View>

            <Text style={styles.title}>{lbTitle}</Text>
            <Text style={styles.description}>{lbDescription}</Text>

            <TabBar active={activeTab} onChange={setActiveTab} />

            {activeTab === 'Practice' && (
              <PracticeTab key={retryKey} quiz={quiz} onRetry={() => setRetryKey((k) => k + 1)} onAnswered={(s) => setPracticeScore(s)} />
            )}
            {activeTab === 'Learn'    && <PlaceholderTab emoji="📖" label="Lesson content coming soon" />}
            {activeTab === 'Examples' && <PlaceholderTab emoji="🎵" label="Examples coming soon" />}

            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.blazeBtn}
                activeOpacity={0.8}
                onPress={() => rootNav.navigate('BlazeChat', { trackId, trackName, trackEmoji, lbTitle })}
              >
                <Text style={styles.blazeBtnEmoji}>🦅</Text>
                <Text style={styles.blazeBtnTxt}>Ask Blaze about this LB</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.84} onPress={handleComplete}>
                <LinearGradient colors={['#7C5CFF', '#6C47FF', '#5A35FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnTxt}>Complete LB & Advance 🔥</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.7} onPress={() => setRetryKey((k) => k + 1)}>
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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: c.background },
    safe:         { flex: 1 },
    header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    backBtn:      { width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    headerTitle:  { color: c.text, fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
    scrollContent:{ paddingBottom: 48 },
    body:         { paddingHorizontal: 20, paddingTop: 20 },

    lbBadge:    { alignSelf: 'flex-start', backgroundColor: c.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 14, borderWidth: 1, borderColor: c.border },
    lbBadgeTxt: { color: c.primaryLight, fontSize: 13, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },

    title:       { color: c.text,          fontSize: 22, fontFamily: 'Poppins_700Bold',   lineHeight: 30, marginBottom: 10 },
    description: { color: c.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22, marginBottom: 22 },

    buttons:      { marginTop: 28, gap: 12 },
    blazeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, paddingVertical: 14 },
    blazeBtnEmoji:{ fontSize: 18 },
    blazeBtnTxt:  { color: c.primaryLight, fontSize: 14, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },

    primaryBtn:    { borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: '#7C5CFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 10 },
    primaryBtnTxt: { color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.3 },
    outlineBtn:    { borderRadius: 18, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: c.border },
    outlineBtnTxt: { color: c.textSecondary, fontSize: 15, fontFamily: 'Poppins_400Regular' },
  });
}
