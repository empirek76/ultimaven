import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { supabase } from '../services/supabase';
import { useTheme, ThemeColors } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'BlazeChat'>;

interface ChatMsg { id: string; role: 'user' | 'blaze'; text: string; }

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
  const { colors, isDark } = useTheme();
  return (
    <View style={bubbleStyles.blazeRow}>
      <View style={[bubbleStyles.blazeAvatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={bubbleStyles.avatarEmoji}>🦅</Text>
      </View>
      <View style={[
        bubbleStyles.blazeBubble,
        { backgroundColor: colors.card, borderColor: colors.border },
        !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
      ]}>
        <Text style={[bubbleStyles.blazeText, { color: colors.text }]}>{text}</Text>
      </View>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <View style={bubbleStyles.userRow}>
      <LinearGradient colors={['#7C5CFF', '#6048FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={bubbleStyles.userBubble}>
        <Text style={bubbleStyles.userText}>{text}</Text>
      </LinearGradient>
    </View>
  );
}

function BlazeThinking() {
  const { colors } = useTheme();
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
    <View style={bubbleStyles.blazeRow}>
      <View style={[bubbleStyles.blazeAvatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Animated.Text style={[bubbleStyles.avatarEmoji, { transform: [{ translateY: bounceAnim }] }]}>🦅</Animated.Text>
      </View>
      <View style={[bubbleStyles.blazeBubble, bubbleStyles.thinkingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[bubbleStyles.thinkingText, { color: colors.textSecondary }]}>Blaze is thinking...</Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  blazeRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, alignSelf: 'flex-start', maxWidth: '88%' },
  blazeAvatar:  { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarEmoji:  { fontSize: 18 },
  blazeBubble:  { borderRadius: 18, borderTopLeftRadius: 4, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, flex: 1 },
  blazeText:    { fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
  thinkingBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  thinkingText: { fontSize: 13, fontFamily: 'Poppins_400Regular' },
  userRow:      { alignSelf: 'flex-end', maxWidth: '80%' },
  userBubble:   { borderRadius: 18, borderTopRightRadius: 4, paddingHorizontal: 16, paddingVertical: 12 },
  userText:     { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BlazeChatScreen({ route }: Props) {
  const navigation = useNavigation();
  const listRef    = useRef<FlatList>(null);
  const inputRef   = useRef<TextInput>(null);
  const apiHistory = useRef<ApiMessage[]>([]);

  const { colors } = useTheme();
  const { getTrackPercent, getTrackLessonsDone, totalLBsDone } = useProgress();
  const ctx      = buildContext(route.params, totalLBsDone, getTrackPercent, getTrackLessonsDone);
  const greeting = getBlazeGreeting(ctx);

  const [messages,  setMessages]  = useState<ChatMsg[]>([{ id: 'greeting', role: 'blaze', text: greeting }]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);

  const styles = useMemo(() => makeStyles(colors), [colors]);

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

      void (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('blaze_conversations').insert({ user_id: session.user.id, message: trimmed, response: reply });
          }
        } catch {}
      })();

      apiHistory.current = [
        ...apiHistory.current,
        { role: 'user' as const, content: trimmed },
        { role: 'assistant' as const, content: reply },
      ].slice(-20);

      const blazeMsg: ChatMsg = { id: (Date.now() + 1).toString(), role: 'blaze', text: reply };
      setMessages((prev) => [...prev, blazeMsg]);
    } catch (err) {
      console.error('[BlazeChat] API error:', err);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'blaze',
        text: "The flames flickered — couldn't reach the API. Check your key and try again! 🔥",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [ctx, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.orbTL} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Ask Blaze 🦅</Text>
            <Text style={styles.headerSub}>Your AI Mastery Mentor</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            renderItem={({ item }) =>
              item.role === 'blaze' ? <BlazeBubble text={item.text} /> : <UserBubble text={item.text} />
            }
            ListFooterComponent={isLoading ? <BlazeThinking /> : null}
          />

          {showChips && (
            <View style={styles.chipsRow}>
              {QUICK_QUESTIONS.map((q) => (
                <TouchableOpacity key={q} style={styles.chip} activeOpacity={0.75} onPress={() => send(q)}>
                  <Text style={styles.chipTxt}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Blaze anything..."
              placeholderTextColor={colors.textSecondary}
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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    safe:      { flex: 1 },
    flex:      { flex: 1 },

    orbTL: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: c.primary, opacity: 0.06, top: -100, left: -100 },

    header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    backBtn:      { width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    headerCenter: { alignItems: 'center', flex: 1 },
    headerTitle:  { color: c.text,          fontSize: 17, fontFamily: 'Poppins_700Bold' },
    headerSub:    { color: c.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 1 },

    messageList: { paddingHorizontal: 16, paddingVertical: 20, gap: 16 },

    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
    chip:     { backgroundColor: c.surface2, borderRadius: 20, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 8 },
    chipTxt:  { color: c.primaryLight, fontSize: 12, fontFamily: 'Poppins_400Regular' },

    inputRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: c.border },
    input:          { flex: 1, backgroundColor: c.inputBg, borderRadius: 18, borderWidth: 1, borderColor: c.border, paddingHorizontal: 18, paddingVertical: 12, color: c.text, fontSize: 14, fontFamily: 'Poppins_400Regular', maxHeight: 100 },
    sendBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    sendBtnDisabled:{ backgroundColor: c.border },
  });
}
