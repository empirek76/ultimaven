import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { supabase } from '../services/supabase';
import { getLBVideoUrl } from '../services/videoService';
import { TRACKS } from '../data/tracks';

type FilterTab = 'Pending' | 'Approved' | 'Rejected';

interface Submission {
  id:               string;
  creator_id:       string;
  track_id:         string;
  lb_number:        number;
  lb_title:         string;
  lb_description:   string | null;
  lb_outcome:       string | null;
  video_path:       string | null;
  youtube_url:      string | null;
  thumbnail_path:   string | null;
  duration_seconds: number | null;
  status:           string;
  admin_notes:      string | null;
  submitted_at:     string;
  reviewed_at:      string | null;
  creator: { full_name: string | null; email: string | null } | null;
}

// ─── Video preview for admin card ─────────────────────────────────────────────
// YouTube → show thumbnail + external link. File → inline Video player.

function AdminVideoPreview({ videoPath, youtubeUrl }: { videoPath: string | null; youtubeUrl: string | null }) {
  const { colors } = useTheme();

  if (youtubeUrl) {
    const match   = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const ytId    = match?.[1];
    const thumbUri = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

    return (
      <View style={avStyles.wrap}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={avStyles.thumb} resizeMode="cover" />
        ) : (
          <View style={[avStyles.thumb, { backgroundColor: '#0F0F0F', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 32 }}>▶</Text>
          </View>
        )}
        <TouchableOpacity
          style={[avStyles.ytBtn, { backgroundColor: '#FF0000' }]}
          onPress={() => Linking.openURL(youtubeUrl)}
          activeOpacity={0.82}
        >
          <Text style={avStyles.ytBtnTxt}>▶  Preview on YouTube</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (videoPath) {
    return <AdminFilePlayer videoPath={videoPath} />;
  }

  return null;
}

function AdminFilePlayer({ videoPath }: { videoPath: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    try {
      setVideoUrl(getLBVideoUrl(videoPath));
    } catch (e) {
      console.error('AdminFilePlayer URL error:', e);
    }
  }, [videoPath]);

  if (!videoUrl) return null;

  return (
    <View style={avStyles.wrap}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={avStyles.thumb}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping={false}
        useNativeControls
        onError={(error) => console.error('Admin video error:', error)}
      />
    </View>
  );
}

const avStyles = StyleSheet.create({
  wrap:    { width: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', gap: 0 },
  thumb:   { width: '100%', aspectRatio: 16/9 },
  ytBtn:   { paddingVertical: 10, alignItems: 'center' },
  ytBtnTxt:{ color: '#FFF', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
});

// ─── Submission card ───────────────────────────────────────────────────────────

function SubmissionCard({
  item,
  onApprove,
  onReject,
}: {
  item: Submission;
  onApprove: (id: string) => void;
  onReject:  (id: string, reason: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const track = TRACKS.find((t) => t.id === item.track_id);
  const date  = new Date(item.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert('Reason required', 'Please provide a rejection reason for the creator.');
      return;
    }
    onReject(item.id, rejectReason.trim());
  };

  return (
    <View style={[
      cardStyles.card,
      { backgroundColor: colors.card, borderColor: colors.border },
      !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    ]}>
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.trackBadge, { backgroundColor: isDark ? track?.iconBgDark ?? '#1E1E38' : track?.iconBgLight ?? '#F0EEFF' }]}>
          <Text style={{ fontSize: 16 }}>{track?.emoji ?? '📚'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.lbLabel, { color: colors.textSecondary }]}>{track?.name ?? item.track_id} · LB {item.lb_number}</Text>
          <Text style={[cardStyles.lbTitle, { color: colors.text }]} numberOfLines={2}>{item.lb_title}</Text>
        </View>
        <Text style={[cardStyles.date, { color: colors.textSecondary }]}>{date}</Text>
      </View>

      <View style={[cardStyles.creatorRow, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        <View style={[cardStyles.creatorAvatar, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
          <Text style={[cardStyles.creatorInitial, { color: colors.primaryLight }]}>
            {(item.creator?.full_name ?? 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[cardStyles.creatorName, { color: colors.text }]}>{item.creator?.full_name ?? 'Unknown'}</Text>
          <Text style={[cardStyles.creatorEmail, { color: colors.textSecondary }]}>{item.creator?.email ?? ''}</Text>
        </View>
      </View>

      {item.lb_description ? (
        <Text style={[cardStyles.desc, { color: colors.textSecondary }]} numberOfLines={3}>{item.lb_description}</Text>
      ) : null}

      {item.thumbnail_path ? (
        <Image
          source={{ uri: item.thumbnail_path }}
          style={cardStyles.thumbnail}
          resizeMode="cover"
        />
      ) : null}

      <AdminVideoPreview videoPath={item.video_path} youtubeUrl={item.youtube_url} />

      {item.duration_seconds ? (
        <Text style={[cardStyles.duration, { color: colors.textSecondary }]}>
          ⏱ {Math.floor(item.duration_seconds / 60)}:{String(item.duration_seconds % 60).padStart(2, '0')} duration
        </Text>
      ) : null}

      {item.status === 'rejected' && item.admin_notes ? (
        <View style={[cardStyles.noteBox, { backgroundColor: colors.coral + '15', borderColor: colors.coral + '40' }]}>
          <Text style={[cardStyles.noteLabel, { color: colors.coral }]}>Rejection reason:</Text>
          <Text style={[cardStyles.noteText, { color: colors.textSecondary }]}>{item.admin_notes}</Text>
        </View>
      ) : null}

      {item.status === 'pending' && (
        showRejectInput ? (
          <View style={cardStyles.rejectForm}>
            <TextInput
              style={[cardStyles.rejectInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for rejection..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={300}
              autoFocus
            />
            <View style={cardStyles.rejectBtns}>
              <TouchableOpacity
                style={[cardStyles.rejectCancelBtn, { borderColor: colors.border }]}
                onPress={() => { setShowRejectInput(false); setRejectReason(''); }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cardStyles.rejectConfirmBtn, { backgroundColor: '#FF6B6B' }]}
                onPress={handleReject}
              >
                <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' }}>Reject ❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={cardStyles.actionRow}>
            <TouchableOpacity
              style={[cardStyles.approveBtn, { backgroundColor: '#3DD68C' }]}
              onPress={() => {
                Alert.alert('Approve LB', `Approve "${item.lb_title}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Approve ✅', onPress: () => onApprove(item.id) },
                ]);
              }}
              activeOpacity={0.82}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              <Text style={cardStyles.actionBtnTxt}>Approve ✅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cardStyles.rejectBtn, { backgroundColor: '#FF6B6B' }]}
              onPress={() => setShowRejectInput(true)}
              activeOpacity={0.82}
            >
              <Ionicons name="close-circle" size={18} color="#FFF" />
              <Text style={cardStyles.actionBtnTxt}>Reject ❌</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card:          { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  topRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  trackBadge:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  lbLabel:       { fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  lbTitle:       { fontSize: 15, fontFamily: 'Poppins_700Bold', lineHeight: 22, marginTop: 2 },
  date:          { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  creatorRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 10 },
  creatorAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  creatorInitial:{ fontSize: 14, fontFamily: 'Poppins_700Bold' },
  creatorName:   { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  creatorEmail:  { fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  desc:          { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 19 },
  thumbnail:     { width: '100%', aspectRatio: 16/9, borderRadius: 12 },
  duration:      { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  noteBox:       { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  noteLabel:     { fontSize: 11, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  noteText:      { fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  actionRow:     { flexDirection: 'row', gap: 10 },
  approveBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
  rejectBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12 },
  actionBtnTxt:  { color: '#FFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  rejectForm:    { gap: 10 },
  rejectInput:   { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, fontFamily: 'Poppins_400Regular', minHeight: 80, textAlignVertical: 'top' },
  rejectBtns:    { flexDirection: 'row', gap: 10 },
  rejectCancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  rejectConfirmBtn:{ flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminScreen() {
  const navigation  = useNavigation();
  const { colors, isDark }  = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab,    setActiveTab]    = useState<FilterTab>('Pending');
  const [submissions,  setSubmissions]  = useState<Submission[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const statusMap: Record<FilterTab, string> = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected' };

  const fetchSubmissions = useCallback(async (tab: FilterTab) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lb_submissions')
        .select('*, creator:creator_id (full_name, email)')
        .eq('status', statusMap[tab])
        .order('submitted_at', { ascending: false });

      console.error('ADMIN QUERY RESULT tab:', tab, 'count:', data?.length ?? 0, 'ERROR:', JSON.stringify(error));

      setSubmissions((data ?? []) as Submission[]);

      if (tab !== 'Pending') {
        const { count } = await supabase
          .from('lb_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingCount(count ?? 0);
      } else {
        setPendingCount((data ?? []).length);
      }
    } catch (e: any) {
      console.error('ADMIN FETCH ERROR:', e?.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubmissions(activeTab); }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions(activeTab);
    setRefreshing(false);
  };

  const handleApprove = async (id: string) => {
    const item = submissions.find((s) => s.id === id);
    if (!item) return;
    try {
      await supabase
        .from('lb_submissions')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', id);

      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setPendingCount((c) => Math.max(0, c - 1));
      Alert.alert('Approved ✅', `"${item.lb_title}" is now live on UltiMaven!`);
    } catch {
      Alert.alert('Error', 'Could not approve submission. Please try again.');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    const item = submissions.find((s) => s.id === id);
    if (!item) return;
    try {
      await supabase
        .from('lb_submissions')
        .update({ status: 'rejected', admin_notes: reason, reviewed_at: new Date().toISOString() })
        .eq('id', id);

      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setPendingCount((c) => Math.max(0, c - 1));
      Alert.alert('Rejected', 'Rejection recorded and feedback saved for creator.');
    } catch {
      Alert.alert('Error', 'Could not reject submission. Please try again.');
    }
  };

  const TABS: FilterTab[] = ['Pending', 'Approved', 'Rejected'];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel 🔧</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.72}
            >
              <Text style={[styles.tabTxt, activeTab === tab && styles.tabTxtActive]}>{tab}</Text>
              {tab === 'Pending' && pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          >
            {submissions.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>
                  {activeTab === 'Pending' ? '🎉' : activeTab === 'Approved' ? '✅' : '📋'}
                </Text>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                  {activeTab === 'Pending' ? 'No pending submissions!' : `No ${activeTab.toLowerCase()} submissions`}
                </Text>
              </View>
            ) : (
              submissions.map((item) => (
                <SubmissionCard
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    safe:      { flex: 1 },

    header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    backBtn:     { width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 17, fontFamily: 'Poppins_700Bold' },

    tabRow:       { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    tabPill:      { borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1.5, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
    tabPillActive:{ backgroundColor: c.primary, borderColor: c.primary },
    tabTxt:       { color: c.textSecondary, fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    tabTxtActive: { color: '#FFFFFF' },
    badge:        { backgroundColor: '#FF6B6B', borderRadius: 8, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    badgeTxt:     { color: '#FFF', fontSize: 10, fontFamily: 'Poppins_700Bold' },

    scroll:      { paddingHorizontal: 16, paddingTop: 4 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    empty:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
    emptyEmoji: { fontSize: 48 },
    emptyTxt:   { fontSize: 15, fontFamily: 'Poppins_400Regular' },
  });
}
