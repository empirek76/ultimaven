import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useProgress } from '../context/ProgressContext';
import { TRACKS } from '../data/tracks';
import { askBlaze, ApiMessage, UserContext } from '../services/aiMentor';

type Props = NativeStackScreenProps<RootStackParamList, 'BlazeChat'>;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  role: 'user' | 'blaze';
  text: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildContext(
  params: Props['route']['params'],
  totalLBsDone: number,
  getTrackPercent: (id: string) => number,
  getTrackLessonsDone: (id: string) => number,
): UserContext {
  const trackId   = params?.trackId ?? TRACKS[0]?.id ?? 'guitar';
  const track     = TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];
  const total     = track?.sections.flatMap((s) => s.blocks).length ?? 0;
  const completed = getTrackLessonsDone(trackId);

  return {
    name:            'Sri',
    activeTrack:     params?.trackName ?? track?.name ?? 'Guitar',
    trackEmoji:      params?.trackEmoji ?? track?.emoji ?? '🎸',
    progressPercent: getTrackPercent(trackId),
    streakDays:      14,
    completedLBs:    completed,
    totalLBs:        total,
    currentLbTitle:  params?.lbTitle,
  };
}

function getBlazeGreeting(ctx: UserContext): string {
  const streakPart = ctx.streakDays >= 7
    ? `${ctx.streakDays} day streak — you're becoming a phoenix.`
    : ctx.streakDays > 0
      ? `${ctx.streakDays} day streak — the fire is alive.`
      : "First day on the path — every phoenix starts from an ember.";
  const progressPart = ctx.progressPercent > 0
    ? ` ${ctx.progressPercent}% through ${ctx.trackEmoji} ${ctx.activeTrack} and climbing.`
    : ` Starting ${ctx.trackEmoji} ${ctx.activeTrack} — the best time to begin was yesterday. Second best is now.`;
  return `${ctx.name}! ${streakPart}${progressPart} What do you need help with today?`;
}

const QUICK_QUESTIONS = [
  'Why am I learning this?',
  'I\'m struggling — help me',
  'What should I focus on today?',
  'How long until I master this?',
];

// ─── Blaze bubble ─────────────────────────────────────────────────────────────

function BlazeBubble({ text }: { text: string }) {
  return (
    <View style={styles.blazeRow}>
      <View style={styles.blazeAvatar}>
        <Text style={styles.blazeAvatarEmoji}>🦅</Text>
      </View>
      <View style={styles.blazeBubble}>
        <Text style={styles.blazeText}>{text}</Text>
      </View>
    </View>
  );
}

// ─── User bubble ──────────────────────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userRow}>
      <LinearGradient
        colors={['#7C5CFF', '#6048FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.userBubble}
      >
        <Text style={styles.userText}>{text}</Text>
      </LinearGradient>
    </View>
  );
}

// ─── Loading indicator ────────────────────────────────────────────────────────

function BlazeThinking() {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,  duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.blazeRow}>
      <View style={styles.blazeAvatar}>
        <Animated.Text style={[styles.blazeAvatarEmoji, { transform: [{ translateY: bounceAnim }] }]}>
          🦅
        </Animated.Text>
      </View>
      <View style={[styles.blazeBubble, styles.thinkingBubble]}>
        <ActivityIndicator size="small" color="#7C5CFF" />
        <Text style={styles.thinkingText}>Blaze is thinking...</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BlazeChatScreen({ route }: Props) {
  const navigation   = useNavigation();
  const listRef      = useRef<FlatList>(null);
  const inputRef     = useRef<TextInput>(null);
  const apiHistory   = useRef<ApiMessage[]>([]);

  const { getTrackPercent, getTrackLessonsDone, totalLBsDone } = useProgress();
  const ctx = buildContext(route.params, totalLBsDone, getTrackPercent, getTrackLessonsDone);

  const greeting = getBlazeGreeting(ctx);

  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'greeting', role: 'blaze', text: greeting },
  ]);
  const [inputText, setInputText]   = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [showChips, setShowChips]   = useState(true);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInputText('');
    setShowChips(false);
    setIsLoading(true);

    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const reply = await askBlaze(trimmed, ctx, apiHistory.current);

      // Update rolling API history (keep last 10 turns to stay within token limits)
      apiHistory.current = [
        ...apiHistory.current,
        { role: 'user'      as const, content: trimmed },
        { role: 'assistant' as const, content: reply   },
      ].slice(-20);

      const blazeMsg: ChatMsg = { id: (Date.now() + 1).toString(), role: 'blaze', text: reply };
      setMessages((prev) => [...prev, blazeMsg]);
    } catch (err) {
      console.error('[BlazeChat] API error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id:   (Date.now() + 1).toString(),
          role: 'blaze',
          text: "The flames flickered — couldn't reach the API. Check your key and try again! 🔥",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [ctx, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.orbTL} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Ask Blaze 🦅</Text>
            <Text style={styles.headerSub}>Your AI Mastery Mentor</Text>
          </View>

          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* ── Messages ── */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            renderItem={({ item }) =>
              item.role === 'blaze'
                ? <BlazeBubble text={item.text} />
                : <UserBubble  text={item.text} />
            }
            ListFooterComponent={isLoading ? <BlazeThinking /> : null}
          />

          {/* ── Quick question chips ── */}
          {showChips && (
            <View style={styles.chipsRow}>
              {QUICK_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.chip}
                  activeOpacity={0.75}
                  onPress={() => send(q)}
                >
                  <Text style={styles.chipTxt}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Input row ── */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Blaze anything..."
              placeholderTextColor="#4A3A6A"
              multiline
              maxLength={500}
              returnKeyType="send"
              onFocus={() => setShowChips(false)}
              onSubmitEditing={() => send(inputText)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
              activeOpacity={0.8}
              onPress={() => send(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe:      { flex: 1 },
  flex:      { flex: 1 },

  orbTL: {
    position: 'absolute', width: 340, height: 340, borderRadius: 170,
    backgroundColor: '#7C5CFF', opacity: 0.06, top: -100, left: -100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1240',
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#1A1438',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A1A5A',
  },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle:  { color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins_700Bold' },
  headerSub:    { color: '#5A4A7A', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

  // Messages
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },

  // Blaze bubble
  blazeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    alignSelf: 'flex-start',
    maxWidth: '88%',
  },
  blazeAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1A1238',
    borderWidth: 1, borderColor: '#3A2A5A',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  blazeAvatarEmoji: { fontSize: 18 },
  blazeBubble: {
    backgroundColor: '#0E0B20',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1E1640',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
  },
  blazeText: {
    color: '#D4C8F0',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },

  // Loading bubble
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  thinkingText: {
    color: '#5A4A7A',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },

  // User bubble
  userRow: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  userBubble: {
    borderRadius: 18,
    borderTopRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },

  // Quick chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chip: {
    backgroundColor: '#120D26',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A1A4A',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipTxt: {
    color: '#9B7AFF',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A1240',
  },
  input: {
    flex: 1,
    backgroundColor: '#0E0B20',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E1640',
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C5CFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: '#2A1A50' },
});
