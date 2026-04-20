import React, { useEffect, useRef, useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { getTrack, getTrackStats } from '../data/tracks';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { supabase } from '../services/supabase';

const FREE_LB_LIMIT = 5;

type Props = NativeStackScreenProps<RootStackParamList, 'MasteryMap'>;

// ─── Types ─────────────────────────────────────────────────────────────────

type BlockStatus = 'completed' | 'active' | 'locked';

interface LearningBlock {
  type: 'block';
  id: number;
  title: string;
  status: BlockStatus;
  score?: number;
  badge?: string;
}

interface SectionHeader {
  type: 'section';
  label: string;
}

type MapItem = LearningBlock | SectionHeader;

// ─── Description template ──────────────────────────────────────────────────

function makeLBDescription(trackId: string, title: string): string {
  const map: Record<string, string> = {
    guitar:  `Master ${title} — one of the core building blocks of guitar playing. By the end of this LB you'll play it cleanly and transition smoothly into other chords.`,
    finance: `Understand ${title} — a key concept on your path to financial freedom. By the end of this LB you'll apply this principle directly to your own finances.`,
    body:    `Learn ${title} — an essential part of your transformation journey. By the end of this LB you'll have the technique and knowledge to level up your training.`,
    design:  `Explore ${title} — a foundational skill every great designer masters. By the end of this LB you'll confidently apply it in your own creative work.`,
    reading: `Practise ${title} — a powerful technique to unlock faster comprehension. By the end of this LB you'll measurably improve your reading performance.`,
  };
  return map[trackId] ?? `Dive into ${title} and build your skills in this track.`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getPrevBlock(items: MapItem[], index: number): LearningBlock | undefined {
  for (let i = index - 1; i >= 0; i--) {
    if (items[i].type === 'block') return items[i] as LearningBlock;
  }
  return undefined;
}

// ─── Active node (pulsing glow) ────────────────────────────────────────────

function ActiveNode({ num, colors }: { num: number; colors: ThemeColors }) {
  const glow = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.65, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.15, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={nodeStyles.activeOuter}>
      <Animated.View style={[nodeStyles.glow, { opacity: glow, backgroundColor: colors.primary }]} />
      <View style={[nodeStyles.circle, { backgroundColor: colors.primary }]}>
        <Text style={nodeStyles.circleText}>{num}</Text>
      </View>
    </View>
  );
}

const NODE_SIZE = 34;
const nodeStyles = StyleSheet.create({
  activeOuter: { width: NODE_SIZE, height: NODE_SIZE, alignItems: 'center', justifyContent: 'center' },
  glow:        { position: 'absolute', width: 54, height: 54, borderRadius: 27 },
  circle:      { width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#A882FF', zIndex: 1 },
  circleText:  { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins_700Bold' },
});

// ─── Node circle ───────────────────────────────────────────────────────────

function NodeCircle({ block, displayNumber, colors }: { block: LearningBlock; displayNumber: number; colors: ThemeColors }) {
  if (block.status === 'completed') {
    return (
      <View style={[nodeStyles2.completed]}>
        <Ionicons name="checkmark" size={17} color="#FFFFFF" />
      </View>
    );
  }
  if (block.status === 'active') return <ActiveNode num={displayNumber} colors={colors} />;
  return (
    <View style={[nodeStyles2.locked, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <Text style={nodeStyles2.lockEmoji}>🔒</Text>
    </View>
  );
}
const nodeStyles2 = StyleSheet.create({
  completed: { width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2, backgroundColor: '#2ECC71', alignItems: 'center', justifyContent: 'center', shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  locked:    { width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  lockEmoji: { fontSize: 13 },
});

// ─── LB card ───────────────────────────────────────────────────────────────

function LBCard({ block, displayNumber, isProLocked, onPress, colors }: {
  block: LearningBlock; displayNumber: number; isProLocked?: boolean; onPress?: () => void; colors: ThemeColors;
}) {
  const { isDark } = useTheme();
  const done    = block.status === 'completed';
  const active  = block.status === 'active';
  const locked  = block.status === 'locked';
  const tappable = active || isProLocked;

  // Card background / border per status
  const cardBg = done   ? (isDark ? 'rgba(107,203,119,0.08)' : '#F0FFF4')
               : active ? (isDark ? 'rgba(108,71,255,0.12)'  : '#F0EEFF')
               : locked ? (isDark ? 'rgba(255,255,255,0.03)' : '#F8F8FC')
               : colors.card;

  const cardBorder = done   ? (isDark ? 'rgba(107,203,119,0.2)' : '#C6F0D0')
                   : active ? (isDark ? 'rgba(108,71,255,0.4)'  : '#C4B5FD')
                   : locked ? (isDark ? 'rgba(255,255,255,0.05)': '#E8E8F0')
                   : colors.border;

  // LB number tag
  const tagBg       = active && !isProLocked ? (isDark ? colors.surface : '#EEEEFF')
                    : locked ? (isDark ? '#1E1E38' : '#EEEEFF')
                    : (isDark ? '#1E1E38' : '#EEEEFF');
  const tagTxtColor = active && !isProLocked ? colors.primaryLight
                    : locked ? (isDark ? colors.border : '#C0C0D0')
                    : (isDark ? '#8B8BAE' : '#6C47FF');

  // Dim title for locked / pro-locked
  const titleColor  = (locked || isProLocked) ? (isDark ? colors.border : '#C0C0D0') : colors.text;

  // Score badge
  const scoreBg     = isDark ? '#0C2010' : '#E6F7EE';
  const scoreBorder  = isDark ? '#1A4A20' : '#B8E6C0';
  const scoreColor  = isDark ? '#6BCB77'  : '#1A7A3A';

  return (
    <TouchableOpacity
      onPress={tappable ? onPress : undefined}
      activeOpacity={tappable ? 0.78 : 1}
      style={[
        lbCardStyles.card,
        { backgroundColor: cardBg, borderColor: cardBorder },
        done && { borderLeftWidth: 3, borderLeftColor: '#6BCB77' },
        active && !isProLocked && lbCardStyles.cardActive,
        locked && !isProLocked && { opacity: 0.52 },
        isProLocked && { borderColor: isDark ? 'rgba(108,71,255,0.3)' : '#C4B5FD', borderWidth: 1, opacity: 0.85 },
      ]}
    >
      <View style={lbCardStyles.top}>
        <View style={[lbCardStyles.tag, { backgroundColor: tagBg }]}>
          <Text style={[lbCardStyles.tagTxt, { color: tagTxtColor }]}>
            LB {displayNumber}
          </Text>
        </View>
        <Text style={[lbCardStyles.title, { color: titleColor }]} numberOfLines={2}>
          {block.title}
        </Text>
        {isProLocked && (
          <View style={[lbCardStyles.proBadge, { backgroundColor: colors.surface2, borderColor: colors.primary }]}>
            <Text style={[lbCardStyles.proBadgeTxt, { color: colors.primaryLight }]}>PRO</Text>
          </View>
        )}
      </View>

      <View style={lbCardStyles.bottom}>
        {done && (
          <>
            <View style={[lbCardStyles.scorePill, { backgroundColor: scoreBg, borderColor: scoreBorder }]}>
              <Text style={[lbCardStyles.scoreText, { color: scoreColor }]}>
                {block.score != null && !isNaN(block.score) ? `${Math.round(block.score)}%` : '100%'}
              </Text>
            </View>
            <Text style={lbCardStyles.badgeEmoji}>{block.badge}</Text>
          </>
        )}
        {active && !isProLocked && (
          <>
            <View style={[lbCardStyles.dot, { backgroundColor: colors.primaryLight }]} />
            <Text style={[lbCardStyles.inProgressTxt, { color: colors.primaryLight }]}>In progress</Text>
            <View style={[lbCardStyles.playBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="play" size={13} color="#FFFFFF" />
            </View>
          </>
        )}
        {isProLocked && (
          <Text style={[lbCardStyles.proLockedTxt, { color: colors.primaryLight }]}>Unlock with Pro 🔒</Text>
        )}
        {locked && !isProLocked && (
          <Text style={[lbCardStyles.lockedTxt, { color: colors.textSecondary }]}>Locked · Complete previous lessons</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
const lbCardStyles = StyleSheet.create({
  card:         { borderRadius: 16, padding: 14, borderWidth: 1, gap: 10 },
  cardActive:   { shadowColor: '#7C5CFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  top:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tag:          { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  tagTxt:       { fontSize: 10, fontFamily: 'Poppins_700Bold', letterSpacing: 0.3 },
  title:        { flex: 1, fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
  proBadge:     { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, alignSelf: 'flex-start' },
  proBadgeTxt:  { fontSize: 9, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  bottom:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scorePill:    { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1 },
  scoreText:    { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  badgeEmoji:   { fontSize: 15 },
  dot:          { width: 7, height: 7, borderRadius: 3.5 },
  inProgressTxt:{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  playBtn:      { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C5CFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 4 },
  proLockedTxt: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  lockedTxt:    { fontSize: 11, fontFamily: 'Poppins_400Regular' },
});

// ─── Map rows ──────────────────────────────────────────────────────────────

const NODE_COL = 52;

function BlockRow({ block, displayNumber, isProLocked, bottomLineColor, showBottomLine, onPress, colors }: {
  block: LearningBlock; displayNumber: number; isProLocked?: boolean;
  bottomLineColor: string; showBottomLine: boolean; onPress?: () => void; colors: ThemeColors;
}) {
  return (
    <View style={rowStyles.mapRow}>
      <View style={rowStyles.nodeCol}>
        <NodeCircle block={block} displayNumber={displayNumber} colors={colors} />
        {showBottomLine && <View style={[rowStyles.connLine, { backgroundColor: bottomLineColor }]} />}
      </View>
      <View style={rowStyles.cardCol}>
        <LBCard block={block} displayNumber={displayNumber} isProLocked={isProLocked} onPress={onPress} colors={colors} />
      </View>
    </View>
  );
}

function SectionRow({ label, lineColor, showLine, colors }: { label: string; lineColor: string; showLine: boolean; colors: ThemeColors }) {
  const { isDark } = useTheme();
  const labelColor = isDark ? '#6B7280' : '#9CA3AF';
  return (
    <View style={rowStyles.sectionRow}>
      <View style={rowStyles.nodeCol}>
        {showLine && <View style={[rowStyles.sectionLine, { backgroundColor: lineColor }]} />}
      </View>
      <View style={rowStyles.sectionContent}>
        <Text style={[rowStyles.sectionLabel, { color: labelColor }]}>{label}</Text>
        <View style={[rowStyles.sectionDivider, { backgroundColor: colors.border }]} />
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  mapRow:       { flexDirection: 'row', alignItems: 'stretch' },
  nodeCol:      { width: NODE_COL, alignItems: 'center', alignSelf: 'stretch' },
  cardCol:      { flex: 1, paddingLeft: 10, paddingBottom: 12 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', minHeight: 44, marginBottom: 4 },
  sectionLine:  { flex: 1, width: 2 },
  sectionContent:{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 10, gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 2.5 },
  sectionDivider:{ flex: 1, height: 1 },
  connLine:     { flex: 1, width: 2, minHeight: 12 },
});

// ─── Stat badge ────────────────────────────────────────────────────────────

function StatBadge({ value, label, color, colors }: { value: string; label: string; color: string; colors: ThemeColors }) {
  return (
    <View style={statStyles.badge}>
      <Text style={[statStyles.val, { color }]}>{value}</Text>
      <Text style={[statStyles.lbl, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  badge: { flex: 1, alignItems: 'center' },
  val:   { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  lbl:   { fontSize: 10, fontFamily: 'Poppins_400Regular', marginTop: 3 },
});

// ─── Screen ────────────────────────────────────────────────────────────────

export default function MasteryMapScreen({ navigation, route }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rootNav  = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, isDark } = useTheme();

  const track = getTrack(route.params.trackId);
  const { completedByTrack, getTrackCompletedIds } = useProgress();
  const { isPro, user, profileLoading } = useAuth();

  const [scoresMap, setScoresMap] = useState<Map<number, number>>(new Map());

  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!track || !user) return;
    supabase
      .from('learning_blocks')
      .select('lb_number, score')
      .eq('user_id', user.id)
      .eq('track_key', track.id)
      .eq('is_completed', true)
      .then(({ data }) => {
        if (data) {
          const map = new Map<number, number>();
          data.forEach((r: { lb_number: number; score: number | null }) => {
            map.set(r.lb_number, r.score ?? 100);
          });
          setScoresMap(map);
        }
      });
  }, [track?.id, user?.id]);

  const blockNumberMap = useMemo((): Map<number, number> => {
    if (!track) return new Map();
    const map = new Map<number, number>();
    let n = 1;
    for (const section of track.sections) {
      for (const block of section.blocks) {
        map.set(block.id, n++);
      }
    }
    return map;
  }, [track]);

  const mapItems = useMemo((): MapItem[] => {
    if (!track) return [];
    const completedSet = getTrackCompletedIds(track.id);
    const allBlocks = track.sections.flatMap((s) => s.blocks);
    let foundActive = false;
    const statusMap = new Map<number, BlockStatus>();
    for (const block of allBlocks) {
      if (completedSet.has(block.id)) {
        statusMap.set(block.id, 'completed');
      } else if (!foundActive) {
        statusMap.set(block.id, 'active');
        foundActive = true;
      } else {
        statusMap.set(block.id, 'locked');
      }
    }
    const result: MapItem[] = [];
    for (const section of track.sections) {
      result.push({ type: 'section', label: section.label });
      for (const block of section.blocks) {
        result.push({ type: 'block', ...block, status: statusMap.get(block.id) ?? block.status, score: scoresMap.get(block.id) });
      }
    }
    return result;
  }, [track, completedByTrack, scoresMap]);

  if (!track) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text, padding: 20 }}>Track not found</Text>
      </View>
    );
  }

  const safePercent = (val: number | null | undefined) =>
    `${!val || isNaN(val) ? 0 : Math.round(val)}%`;

  const stats = getTrackStats(track);
  const completedCount = mapItems.filter((i) => i.type === 'block' && (i as LearningBlock).status === 'completed').length;
  const lockedCount    = Math.max(0, stats.total - completedCount - 1);
  const masteryRaw     = stats.total > 0 ? Math.round((completedCount / stats.total) * 100) : 0;
  const mastery        = Number.isFinite(masteryRaw) ? masteryRaw : 0;

  const blockLineColor = (b: LearningBlock) =>
    b.status === 'completed' ? '#6BCB77' : (isDark ? 'rgba(255,255,255,0.06)' : '#E0E0F0');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEmoji}>{track.emoji}</Text>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>{track.name}</Text>
              <Text style={styles.headerSub}>{stats.total} Learning Blocks · {track.level}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.blazeBtn}
            activeOpacity={0.75}
            onPress={() => rootNav.navigate('BlazeChat', { trackId: track.id, trackName: track.name, trackEmoji: track.emoji })}
          >
            <Text style={styles.blazeBtnEmoji}>🦅</Text>
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim }}
        >
          {/* ── Progress summary ── */}
          <View style={[
            styles.statsCard,
            { borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E8E8F5' },
            !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
          ]}>
            <StatBadge value={String(completedCount)} label="Completed" color={colors.primary}       colors={colors} />
            <View style={styles.statSep} />
            <StatBadge value="1"                       label="Active"    color={colors.gold}          colors={colors} />
            <View style={styles.statSep} />
            <StatBadge value={String(lockedCount)}     label="Locked"    color={colors.textSecondary} colors={colors} />
            <View style={styles.statSep} />
            <StatBadge value={safePercent(mastery)}    label="Mastery"   color="#3DD68C"              colors={colors} />
          </View>

          {/* ── Mastery map ── */}
          <View>
            {mapItems.map((item, index) => {
              const isLast  = index === mapItems.length - 1;
              const prevBlk = getPrevBlock(mapItems, index);

              if (item.type === 'section') {
                const lineColor = prevBlk ? blockLineColor(prevBlk) : colors.border;
                return (
                  <SectionRow
                    key={`sec-${item.label}`}
                    label={item.label}
                    lineColor={lineColor}
                    showLine={prevBlk !== undefined}
                    colors={colors}
                  />
                );
              }

              const displayNumber = blockNumberMap.get(item.id) ?? item.id;
              const isProLocked   = displayNumber > FREE_LB_LIMIT && !isPro && !profileLoading;
              const bottomColor   = blockLineColor(item);
              return (
                <BlockRow
                  key={`blk-${item.id}`}
                  block={item}
                  displayNumber={displayNumber}
                  isProLocked={isProLocked}
                  bottomLineColor={bottomColor}
                  showBottomLine={!isLast}
                  colors={colors}
                  onPress={() => {
                    if (isProLocked) { rootNav.navigate('Paywall', { source: 'lb_limit' }); return; }
                    navigation.navigate('LearningBlockPlayer', {
                      lbId:          item.id,
                      lbTitle:       item.title,
                      lbNumber:      displayNumber,
                      lbDescription: makeLBDescription(track.id, item.title),
                      trackId:       track.id,
                      trackEmoji:    track.emoji,
                      trackName:     track.name,
                      totalLBs:      stats.total,
                    });
                  }}
                />
              );
            })}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    safe:      { flex: 1 },

    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn:     { width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    blazeBtn:    { width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    blazeBtnEmoji: { fontSize: 20 },
    headerCenter:  { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
    headerEmoji:   { fontSize: 30 },
    headerTextCol: { flex: 1 },
    headerTitle:   { color: c.text, fontSize: 17, fontFamily: 'Poppins_700Bold' },
    headerSub:     { color: c.textSecondary, fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },

    scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },

    statsCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: c.card,
      borderRadius: 20, padding: 16, marginBottom: 28, borderWidth: 1, borderColor: c.border,
    },
    statSep: { width: 1, height: 30, backgroundColor: c.border },
  });
}
