import React, { useEffect, useRef, useMemo } from 'react';
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
import { TracksStackParamList, RootStackParamList } from '../types/navigation';
import { getTrack, getTrackStats } from '../data/tracks';
import { useProgress } from '../context/ProgressContext';

const FREE_LB_LIMIT = 5;

type Props = NativeStackScreenProps<TracksStackParamList, 'MasteryMap'>;

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

// ─── Color constants ───────────────────────────────────────────────────────

const C = {
  bg:           '#0D0D1A',
  card:         '#0E0B20',
  green:        '#3DD68C',
  greenDark:    '#0C2218',
  greenBorder:  '#1A3A28',
  purple:       '#7C5CFF',
  purpleLight:  '#9B7AFF',
  purpleDark:   '#120E2A',
  purpleBorder: '#4A2EA0',
  gold:         '#FFD93D',
  grey:         '#1E1840',
  greyLine:     '#1C1640',
  greyNode:     '#1A1438',
  greyBorder:   '#251E48',
  greyText:     '#4A3A6A',
  dimText:      '#3A2A5A',
};

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

function blockLineColor(b: LearningBlock): string {
  return b.status === 'completed' ? C.green : C.greyLine;
}

// ─── Active node (pulsing glow) ────────────────────────────────────────────

function ActiveNode({ num }: { num: number }) {
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
    <View style={styles.activeNodeOuter}>
      <Animated.View style={[styles.activeGlow, { opacity: glow }]} />
      <View style={styles.activeCircle}>
        <Text style={styles.activeCircleText}>{num}</Text>
      </View>
    </View>
  );
}

// ─── Node circle ───────────────────────────────────────────────────────────

function NodeCircle({ block, displayNumber }: { block: LearningBlock; displayNumber: number }) {
  if (block.status === 'completed') {
    return (
      <View style={styles.completedNode}>
        <Ionicons name="checkmark" size={17} color="#FFFFFF" />
      </View>
    );
  }
  if (block.status === 'active') return <ActiveNode num={displayNumber} />;
  return (
    <View style={styles.lockedNode}>
      <Text style={styles.lockEmoji}>🔒</Text>
    </View>
  );
}

// ─── LB card ───────────────────────────────────────────────────────────────

function LBCard({
  block,
  displayNumber,
  onPress,
}: {
  block: LearningBlock;
  displayNumber: number;
  onPress?: () => void;
}) {
  const done    = block.status === 'completed';
  const active  = block.status === 'active';
  const locked  = block.status === 'locked';

  return (
    <TouchableOpacity
      onPress={active ? onPress : undefined}
      activeOpacity={active ? 0.78 : 1}
      style={[
        styles.card,
        done   && styles.cardDone,
        active && styles.cardActive,
        locked && styles.cardLocked,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.lbTag, active && styles.lbTagActive, locked && styles.lbTagLocked]}>
          <Text style={[styles.lbTagTxt, active && styles.lbTagTxtActive, locked && styles.lbTagTxtLocked]}>
            LB {displayNumber}
          </Text>
        </View>
        <Text style={[styles.cardTitle, locked && styles.cardTitleLocked]} numberOfLines={2}>
          {block.title}
        </Text>
      </View>

      <View style={styles.cardBottom}>
        {done && (
          <>
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>{block.score}%</Text>
            </View>
            <Text style={styles.badgeEmoji}>{block.badge}</Text>
          </>
        )}
        {active && (
          <>
            <View style={styles.inProgressDot} />
            <Text style={styles.inProgressTxt}>In progress</Text>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={13} color="#FFFFFF" />
            </View>
          </>
        )}
        {locked && (
          <Text style={styles.lockedTxt}>Locked · Complete previous lessons</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Map rows ──────────────────────────────────────────────────────────────

function BlockRow({
  block,
  displayNumber,
  bottomLineColor,
  showBottomLine,
  onPress,
}: {
  block: LearningBlock;
  displayNumber: number;
  bottomLineColor: string;
  showBottomLine: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={styles.mapRow}>
      <View style={styles.nodeCol}>
        <NodeCircle block={block} displayNumber={displayNumber} />
        {showBottomLine && (
          <View style={[styles.connLine, { backgroundColor: bottomLineColor }]} />
        )}
      </View>
      <View style={styles.cardCol}>
        <LBCard block={block} displayNumber={displayNumber} onPress={onPress} />
      </View>
    </View>
  );
}

function SectionRow({
  label,
  lineColor,
  showLine,
}: {
  label: string;
  lineColor: string;
  showLine: boolean;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.nodeCol}>
        {showLine && <View style={[styles.sectionLine, { backgroundColor: lineColor }]} />}
      </View>
      <View style={styles.sectionContent}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <View style={styles.sectionDivider} />
      </View>
    </View>
  );
}

// ─── Stat badge ────────────────────────────────────────────────────────────

function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function MasteryMapScreen({ navigation, route }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const rootNav   = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const track = getTrack(route.params.trackId);
  const { completedByTrack, getTrackCompletedIds } = useProgress();

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

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
      if (block.status === 'completed' || completedSet.has(block.id)) {
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
        result.push({
          type: 'block',
          ...block,
          status: statusMap.get(block.id) ?? block.status,
        });
      }
    }
    return result;
  }, [track, completedByTrack]);

  if (!track) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#FFFFFF', padding: 20 }}>Track not found</Text>
      </View>
    );
  }

  const stats = getTrackStats(track);
  const completedCount = mapItems.filter(
    (i) => i.type === 'block' && (i as LearningBlock).status === 'completed'
  ).length;
  const lockedCount = mapItems.filter(
    (i) => i.type === 'block' && (i as LearningBlock).status === 'locked'
  ).length;
  const mastery = stats.total > 0 ? Math.round((completedCount / stats.total) * 100) : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
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
            onPress={() => rootNav.navigate('BlazeChat', {
              trackId:    track.id,
              trackName:  track.name,
              trackEmoji: track.emoji,
            })}
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
          <View style={styles.statsCard}>
            <StatBadge value={String(completedCount)} label="Completed" color={C.purple}  />
            <View style={styles.statSep} />
            <StatBadge value="1"                       label="Active"    color={C.gold}    />
            <View style={styles.statSep} />
            <StatBadge value={String(lockedCount)}     label="Locked"    color={C.greyText}/>
            <View style={styles.statSep} />
            <StatBadge value={`${mastery}%`}           label="Mastery"   color={C.green}   />
          </View>

          {/* ── Mastery map ── */}
          <View style={styles.mapContainer}>
            {mapItems.map((item, index) => {
              const isLast  = index === mapItems.length - 1;
              const prevBlk = getPrevBlock(mapItems, index);

              if (item.type === 'section') {
                const lineColor = prevBlk ? blockLineColor(prevBlk) : C.greyLine;
                return (
                  <SectionRow
                    key={`sec-${item.label}`}
                    label={item.label}
                    lineColor={lineColor}
                    showLine={prevBlk !== undefined}
                  />
                );
              }

              const displayNumber = blockNumberMap.get(item.id) ?? item.id;
              const bottomColor = blockLineColor(item);
              return (
                <BlockRow
                  key={`blk-${item.id}`}
                  block={item}
                  displayNumber={displayNumber}
                  bottomLineColor={bottomColor}
                  showBottomLine={!isLast}
                  onPress={() => {
                    if (displayNumber > FREE_LB_LIMIT) {
                      rootNav.navigate('Paywall', { source: 'lb_limit' });
                      return;
                    }
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

const NODE_SIZE = 34;
const NODE_COL  = 52;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  safe:      { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  blazeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#120E2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A2070',
  },
  blazeBtnEmoji: { fontSize: 20 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  headerEmoji:   { fontSize: 30 },
  headerTextCol: { flex: 1 },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  headerSub: {
    color: '#4A3A6A',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: C.greyBorder,
  },
  statBadge: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
  statLbl: {
    fontSize: 10,
    color: C.greyText,
    fontFamily: 'Poppins_400Regular',
    marginTop: 3,
  },
  statSep: { width: 1, height: 30, backgroundColor: C.greyLine },

  mapContainer: {},
  mapRow: { flexDirection: 'row', alignItems: 'stretch' },
  nodeCol: {
    width: NODE_COL,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  cardCol: { flex: 1, paddingLeft: 10, paddingBottom: 12 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 4,
  },
  sectionLine: { flex: 1, width: 2 },
  sectionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    color: C.greyText,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 2.5,
  },
  sectionDivider: { flex: 1, height: 1, backgroundColor: C.greyLine },

  connLine: { flex: 1, width: 2, minHeight: 12 },

  completedNode: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  activeNodeOuter: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.purple,
  },
  activeCircle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A882FF',
    zIndex: 1,
  },
  activeCircleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  lockedNode: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: C.greyNode,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.greyBorder,
  },
  lockEmoji: { fontSize: 13 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.greyLine,
    gap: 10,
  },
  cardDone: {
    borderLeftWidth: 3,
    borderLeftColor: C.green,
  },
  cardActive: {
    backgroundColor: C.purpleDark,
    borderColor: C.purpleBorder,
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLocked: { opacity: 0.52 },

  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },

  lbTag: {
    backgroundColor: C.greyLine,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  lbTagActive: { backgroundColor: '#261A52' },
  lbTagLocked: { backgroundColor: '#131028' },
  lbTagTxt: {
    color: C.greyText,
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.3,
  },
  lbTagTxtActive: { color: C.purpleLight },
  lbTagTxtLocked: { color: C.dimText },

  cardTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 20,
  },
  cardTitleLocked: { color: '#3A2A5A' },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scorePill: {
    backgroundColor: C.greenDark,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.greenBorder,
  },
  scoreText: {
    color: C.green,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  badgeEmoji: { fontSize: 15 },

  inProgressDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.purpleLight,
  },
  inProgressTxt: {
    color: C.purpleLight,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  lockedTxt: {
    color: C.dimText,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
});
