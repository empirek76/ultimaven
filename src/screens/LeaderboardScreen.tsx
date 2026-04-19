import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────

const FILTERS = ['Global', 'Friends', 'This Week'] as const;

const TOP3 = [
  {
    rank: 2, name: 'Aisha K.',  initial: 'A', xp: '2,840 XP',
    medal: '🥈', avatarBg: ['#8A8A9A', '#B8B8C8'] as [string, string],
    standBg: '#16161F', standAccent: '#A0A0B0', standH: 60,
  },
  {
    rank: 1, name: 'Marcus T.', initial: 'M', xp: '3,920 XP',
    medal: '🥇', avatarBg: ['#D4A017', '#FFD93D'] as [string, string],
    standBg: '#1C1600', standAccent: '#FFD93D', standH: 88, crown: true,
  },
  {
    rank: 3, name: 'Priya S.',  initial: 'P', xp: '2,210 XP',
    medal: '🥉', avatarBg: ['#8B4513', '#CD7F32'] as [string, string],
    standBg: '#1A0E00', standAccent: '#CD7F32', standH: 44,
  },
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

function PodiumItem({ item }: { item: typeof TOP3[0] }) {
  const isFirst = item.rank === 1;
  const avatarSize = isFirst ? 72 : 58;

  return (
    <View style={styles.podiumItem}>
      {/* Crown / spacing above avatar */}
      {isFirst
        ? <Text style={styles.crown}>👑</Text>
        : <View style={styles.crownSpacer} />
      }

      {/* Avatar */}
      <View
        style={[
          styles.podiumAvatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: item.avatarBg[1],
            borderColor: item.standAccent,
          },
          isFirst && styles.podiumAvatarGlow,
        ]}
      >
        <Text style={[styles.podiumInitial, isFirst && styles.podiumInitialLg]}>
          {item.initial}
        </Text>
      </View>

      {/* Medal */}
      <Text style={styles.podiumMedal}>{item.medal}</Text>

      {/* Name + XP */}
      <Text style={[styles.podiumName, isFirst && styles.podiumNameGold]}>
        {item.name}
      </Text>
      <Text style={styles.podiumXp}>{item.xp}</Text>

      {/* Stand */}
      <View
        style={[
          styles.podiumStand,
          {
            height: item.standH,
            backgroundColor: item.standBg,
            borderTopColor: item.standAccent,
          },
        ]}
      >
        <Text style={[styles.podiumRankNum, { color: item.standAccent }]}>
          {item.rank}
        </Text>
      </View>
    </View>
  );
}

// ─── Rank row ─────────────────────────────────────────────────────────────────

function RankRow({ item, isLast }: { item: typeof RANKS[0]; isLast: boolean }) {
  return (
    <View style={[styles.rankRow, !isLast && styles.rankRowBorder]}>
      <Text style={styles.rankNum}>{item.rank}</Text>
      <View style={[styles.rankAvatar, { backgroundColor: item.color + '22', borderColor: item.color + '44' }]}>
        <Text style={[styles.rankInitial, { color: item.color }]}>{item.initial}</Text>
      </View>
      <View style={styles.rankInfo}>
        <Text style={styles.rankName}>{item.name}</Text>
        <Text style={styles.rankXp}>{item.xp}</Text>
      </View>
      <Text style={styles.rankEmoji}>{item.emoji}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]>('Global');

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <View style={styles.orbTL} />
      <View style={styles.orbBR} />

      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>

        {/* ── Filter tabs ── */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              activeOpacity={0.72}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterTxt, activeFilter === f && styles.filterTxtActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Scrollable body ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Podium */}
          <View style={styles.podiumRow}>
            {TOP3.map((item) => (
              <PodiumItem key={item.rank} item={item} />
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>RANKINGS</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Ranks 4–10 */}
          <View style={styles.rankCard}>
            {RANKS.map((item, idx) => (
              <RankRow key={item.rank} item={item} isLast={idx === RANKS.length - 1} />
            ))}
          </View>

          {/* Bottom padding so last row isn't hidden behind user rank card */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── Your Rank card (sticky above tab bar) ── */}
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
            <Text style={styles.yourXp}>890 XP</Text>
          </View>

          {/* Motivational text */}
          <View style={styles.motivationRow}>
            <Text style={styles.motivationTxt}>
              ⚡ You're{' '}
              <Text style={styles.motivationHighlight}>160 XP</Text>
              {' '}away from rank 46
            </Text>
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PODIUM_ITEM_W = Math.floor((SW - 44) / 3);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe:      { flex: 1 },

  orbTL: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#7C5CFF', opacity: 0.09, top: -80, left: -80,
  },
  orbBR: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#FFD93D', opacity: 0.04, bottom: 80, right: -80,
  },

  // Header
  header: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
  },

  // Filter tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    gap: 10,
    marginBottom: 20,
  },
  filterPill: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#2A1A4A',
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#7C5CFF',
    borderColor: '#7C5CFF',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  filterTxt: {
    color: '#4A3A6A',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  filterTxtActive: {
    color: '#FFFFFF',
  },

  // Scroll
  scroll: { paddingHorizontal: 22 },

  // Podium
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 24,
  },
  podiumItem: {
    width: PODIUM_ITEM_W,
    alignItems: 'center',
  },
  crown:       { fontSize: 22, lineHeight: 30, marginBottom: 4 },
  crownSpacer: { height: 34 },

  podiumAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    marginBottom: 6,
  },
  podiumAvatarGlow: {
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
  },
  podiumInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  podiumInitialLg: { fontSize: 26 },

  podiumMedal: { fontSize: 16, lineHeight: 22, marginBottom: 4 },

  podiumName: {
    color: '#C4B0E4',
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    lineHeight: 16,
  },
  podiumNameGold: { color: '#FFD93D' },

  podiumXp: {
    color: '#4A3A6A',
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
    textAlign: 'center',
  },

  podiumStand: {
    width: '100%',
    borderTopWidth: 3,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRankNum: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    marginTop: 6,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E1240' },
  dividerTxt: {
    color: '#3A2A5A',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1.5,
  },

  // Rank list card
  rankCard: {
    backgroundColor: '#0D0A1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1240',
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
  },
  rankRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#140E2A',
  },
  rankNum: {
    color: '#4A3A6A',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    width: 22,
    textAlign: 'center',
  },
  rankAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  rankInitial: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  rankInfo: { flex: 1 },
  rankName: {
    color: '#D4C8F0',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 20,
  },
  rankXp: {
    color: '#4A3A6A',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  rankEmoji: { fontSize: 18, lineHeight: 24 },

  // Your Rank card
  yourRankCard: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#130E2E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#3D2880',
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  yourRankLeft: { flex: 1 },
  yourRankLabel: {
    color: '#6A5A8A',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  yourRankNum: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 36,
  },

  yourRankCenter: {
    alignItems: 'center',
    gap: 4,
  },
  yourAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C5CFF22',
    borderWidth: 2,
    borderColor: '#7C5CFF',
    alignItems: 'center', justifyContent: 'center',
  },
  yourAvatarInitial: {
    color: '#A882FF',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  yourName: {
    color: '#C4AAFF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },

  yourRankRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  yourXp: {
    color: '#A882FF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },

  motivationRow: {
    width: '100%',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A1A4A',
    alignItems: 'center',
  },
  motivationTxt: {
    color: '#6A5A8A',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  motivationHighlight: {
    color: '#FFD93D',
    fontFamily: 'Poppins_700Bold',
  },
});
