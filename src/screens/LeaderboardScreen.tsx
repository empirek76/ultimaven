import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgress } from '../context/ProgressContext';
import { useTheme, ThemeColors } from '../context/ThemeContext';

const { width: SW } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────

const FILTERS = ['Global', 'Friends', 'This Week'] as const;

const TOP3 = [
  { rank: 2, name: 'Aisha K.',  initial: 'A', xp: '2,840 XP', medal: '🥈', avatarBg: ['#8A8A9A', '#B8B8C8'] as [string, string], standBg: '#16161F', standAccent: '#A0A0B0', standH: 60  },
  { rank: 1, name: 'Marcus T.', initial: 'M', xp: '3,920 XP', medal: '🥇', avatarBg: ['#D4A017', '#FFD93D'] as [string, string], standBg: '#1C1600', standAccent: '#FFD93D', standH: 88, crown: true },
  { rank: 3, name: 'Priya S.',  initial: 'P', xp: '2,210 XP', medal: '🥉', avatarBg: ['#8B4513', '#CD7F32'] as [string, string], standBg: '#1A0E00', standAccent: '#CD7F32', standH: 44  },
];

const RANKS = [
  { rank: 4,  name: 'David L.',  initial: 'D', xp: '1,980 XP', emoji: '🎸', color: '#7C5CFF' },
  { rank: 5,  name: 'Sarah M.',  initial: 'S', xp: '1,750 XP', emoji: '💰', color: '#3DD68C' },
  { rank: 6,  name: 'James K.',  initial: 'J', xp: '1,620 XP', emoji: '💪', color: '#FF6B6B' },
  { rank: 7,  name: 'Lina R.',   initial: 'L', xp: '1,480 XP', emoji: '🎨', color: '#FFD93D' },
  { rank: 8,  name: 'Omar H.',   initial: 'O', xp: '1,320 XP', emoji: '📖', color: '#06B6D4' },
  { rank: 9,  name: 'Fatima A.', initial: 'F', xp: '1,180 XP', emoji: '🎸', color: '#A78BFA' },
  { rank: 10, name: 'Chen W.',   initial: 'C', xp: '1,050 XP', emoji: '💰', color: '#FF8C42' },
];

// ─── Podium item ──────────────────────────────────────────────────────────────

const PODIUM_ITEM_W = Math.floor((SW - 44) / 3);

function PodiumItem({ item }: { item: typeof TOP3[0] }) {
  const { colors, isDark } = useTheme();
  const isFirst = item.rank === 1;
  const avatarSize = isFirst ? 72 : 58;
  const standBg  = isDark ? item.standBg : colors.surface;
  const nameColor = isDark ? '#C4B0E4' : colors.text;
  const xpColor   = isDark ? '#4A3A6A' : colors.textSecondary;

  return (
    <View style={{ width: PODIUM_ITEM_W, alignItems: 'center' }}>
      {isFirst ? <Text style={{ fontSize: 22, lineHeight: 30, marginBottom: 4 }}>👑</Text>
               : <View style={{ height: 34 }} />}

      <View style={[
        podiumStyles.avatar,
        { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: item.avatarBg[1], borderColor: item.standAccent },
        isFirst && podiumStyles.avatarGlow,
      ]}>
        <Text style={[podiumStyles.initial, isFirst && podiumStyles.initialLg]}>{item.initial}</Text>
      </View>

      <Text style={{ fontSize: 16, lineHeight: 22, marginBottom: 4 }}>{item.medal}</Text>
      <Text style={[podiumStyles.name, { color: isFirst ? '#FFD93D' : nameColor }]}>{item.name}</Text>
      <Text style={[podiumStyles.xp, { color: xpColor }]}>{item.xp}</Text>

      <View style={[podiumStyles.stand, { height: item.standH, backgroundColor: standBg, borderTopColor: item.standAccent }]}>
        <Text style={[podiumStyles.rankNum, { color: item.standAccent }]}>{item.rank}</Text>
      </View>
    </View>
  );
}
const podiumStyles = StyleSheet.create({
  avatar:    { alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, marginBottom: 6 },
  avatarGlow:{ shadowColor: '#FFD93D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 14, elevation: 10 },
  initial:   { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_700Bold' },
  initialLg: { fontSize: 26 },
  name:      { fontSize: 11, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 16 },
  xp:        { fontSize: 10, fontFamily: 'Poppins_400Regular', marginBottom: 8, textAlign: 'center' },
  stand:     { width: '100%', borderTopWidth: 3, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  rankNum:   { fontSize: 20, fontFamily: 'Poppins_700Bold', marginTop: 6 },
});

// ─── Rank row ─────────────────────────────────────────────────────────────────

function RankRow({ item, isLast }: { item: typeof RANKS[0]; isLast: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[rankStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[rankStyles.num, { color: colors.textSecondary }]}>{item.rank}</Text>
      <View style={[rankStyles.avatar, { backgroundColor: item.color + '22', borderColor: item.color + '44' }]}>
        <Text style={[rankStyles.initial, { color: item.color }]}>{item.initial}</Text>
      </View>
      <View style={rankStyles.info}>
        <Text style={[rankStyles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[rankStyles.xp, { color: colors.textSecondary }]}>{item.xp}</Text>
      </View>
      <Text style={rankStyles.emoji}>{item.emoji}</Text>
    </View>
  );
}
const rankStyles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 14 },
  num:     { fontSize: 13, fontFamily: 'Poppins_700Bold', width: 22, textAlign: 'center' },
  avatar:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  initial: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
  info:    { flex: 1 },
  name:    { fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 20 },
  xp:      { fontSize: 12, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  emoji:   { fontSize: 18, lineHeight: 24 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('Global');
  const { totalXP } = useProgress();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              activeOpacity={0.72}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterTxt, activeFilter === f && styles.filterTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.podiumRow}>
            {TOP3.map((item) => <PodiumItem key={item.rank} item={item} />)}
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>RANKINGS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={[styles.rankCard, !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }]}>
            {RANKS.map((item, idx) => (
              <RankRow key={item.rank} item={item} isLast={idx === RANKS.length - 1} />
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.yourRankCard}>
          <View style={styles.yourRankLeft}>
            <Text style={styles.yourRankLabel}>Your Rank</Text>
            <Text style={styles.yourRankNum}>#47</Text>
          </View>
          <View style={styles.yourRankCenter}>
            <View style={styles.yourAvatar}>
              <Text style={styles.yourAvatarInitial}>S</Text>
            </View>
            <Text style={styles.yourName}>Sri</Text>
          </View>
          <View style={styles.yourRankRight}>
            <Text style={styles.yourXp}>{totalXP} XP</Text>
          </View>
          <View style={styles.motivationRow}>
            <Text style={styles.motivationTxt}>
              ⚡ You've earned{' '}
              <Text style={styles.motivationHighlight}>{totalXP} XP</Text>
              {' '}· Keep completing LBs to climb!
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    safe:      { flex: 1 },

    orbTL: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: c.primary, opacity: 0.09, top: -80, left: -80 },
    orbBR: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: c.gold,    opacity: 0.04, bottom: 80, right: -80 },

    header:      { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 16 },
    headerTitle: { color: c.text, fontSize: 26, fontFamily: 'Poppins_700Bold' },

    filterRow: { flexDirection: 'row', paddingHorizontal: 22, gap: 10, marginBottom: 20 },
    filterPill: { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18, borderWidth: 1.5, borderColor: c.border, backgroundColor: 'transparent' },
    filterPillActive: { backgroundColor: c.primary, borderColor: c.primary, shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.45, shadowRadius: 10, elevation: 6 },
    filterTxt:       { color: c.textSecondary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    filterTxtActive: { color: '#FFFFFF' },

    scroll:    { paddingHorizontal: 22 },
    podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 24 },

    divider:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerTxt:  { color: c.textSecondary, fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1.5 },

    rankCard: { backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },

    yourRankCard: {
      marginHorizontal: 14, marginBottom: 12,
      backgroundColor: c.surface, borderRadius: 20, borderWidth: 1.5, borderColor: c.primary,
      paddingVertical: 14, paddingHorizontal: 18,
      flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
      shadowColor: c.primary, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
    },
    yourRankLeft:    { flex: 1 },
    yourRankLabel:   { color: c.textSecondary, fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 1, textTransform: 'uppercase' },
    yourRankNum:     { color: c.text, fontSize: 28, fontFamily: 'Poppins_700Bold', lineHeight: 36 },
    yourRankCenter:  { alignItems: 'center', gap: 4 },
    yourAvatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary + '22', borderWidth: 2, borderColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    yourAvatarInitial: { color: c.primaryLight, fontSize: 18, fontFamily: 'Poppins_700Bold' },
    yourName:        { color: c.primaryLight, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    yourRankRight:   { flex: 1, alignItems: 'flex-end' },
    yourXp:          { color: c.primaryLight, fontSize: 16, fontFamily: 'Poppins_700Bold' },
    motivationRow:   { width: '100%', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border, alignItems: 'center' },
    motivationTxt:   { color: c.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
    motivationHighlight: { color: c.gold, fontFamily: 'Poppins_700Bold' },
  });
}
