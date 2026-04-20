import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { TRACKS, getTrackStats } from '../data/tracks';
import { supabase } from '../services/supabase';
import { uploadLBVideo, uploadThumbnail } from '../services/videoService';

const SW = Dimensions.get('window').width;
const MAX_VIDEO_SECONDS = 180;
const MAX_VIDEO_BYTES   = 500 * 1024 * 1024; // 500 MB

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/mov'];

function getPhaseLabel(progress: number): string {
  if (progress < 30) return 'Preparing video...';
  if (progress < 70) return 'Uploading...';
  if (progress < 90) return 'Processing...';
  return 'Almost done...';
}

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View style={stepStyles.row}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done   = n < current;
        const active = n === current;
        return (
          <React.Fragment key={n}>
            <View style={[
              stepStyles.dot,
              done   && { backgroundColor: colors.primary, borderColor: colors.primary },
              active && { backgroundColor: colors.primary, borderColor: colors.primary, width: 28, borderRadius: 8 },
              !done && !active && { backgroundColor: 'transparent', borderColor: colors.border },
            ]}>
              {done
                ? <Ionicons name="checkmark" size={10} color="#FFF" />
                : <Text style={[stepStyles.dotTxt, active && { color: '#FFF' }, !active && !done && { color: colors.textSecondary }]}>{n}</Text>
              }
            </View>
            {n < total && (
              <View style={[stepStyles.line, { backgroundColor: n < current ? colors.primary : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
const stepStyles = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, paddingVertical: 4 },
  dot:    { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dotTxt: { fontSize: 10, fontFamily: 'Poppins_700Bold' },
  line:   { width: 24, height: 1.5, marginHorizontal: 4 },
});

// ─── Field with character counter ─────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, maxLength, multiline = false,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; maxLength: number; multiline?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={fieldStyles.wrap}>
      <View style={fieldStyles.labelRow}>
        <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[fieldStyles.counter, { color: value.length >= maxLength ? colors.coral : colors.textSecondary }]}>
          {value.length}/{maxLength}
        </Text>
      </View>
      <TextInput
        style={[fieldStyles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, multiline && { height: 90, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        maxLength={maxLength}
        multiline={multiline}
      />
    </View>
  );
}
const fieldStyles = StyleSheet.create({
  wrap:      { marginBottom: 18 },
  labelRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label:     { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  counter:   { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  input:     { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, fontFamily: 'Poppins_400Regular' },
});

// ─── Upload progress bar ───────────────────────────────────────────────────────

function UploadProgressBar({ progress }: { progress: number }) {
  const { colors } = useTheme();
  const anim  = useRef(new Animated.Value(0)).current;
  const label = getPhaseLabel(progress);

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 250, useNativeDriver: false }).start();
  }, [progress]);

  return (
    <View style={uploadStyles.wrap}>
      <View style={uploadStyles.labelRow}>
        <Text style={[uploadStyles.phase, { color: colors.primaryLight }]}>{label}</Text>
        <Text style={[uploadStyles.pct, { color: colors.textSecondary }]}>{Math.round(progress)}%</Text>
      </View>
      <View style={[uploadStyles.track, { backgroundColor: colors.surface2 }]}>
        <Animated.View
          style={[uploadStyles.fill, {
            backgroundColor: colors.primary,
            width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }]}
        />
      </View>
    </View>
  );
}
const uploadStyles = StyleSheet.create({
  wrap:     { gap: 8, marginTop: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phase:    { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  pct:      { fontSize: 12, fontFamily: 'Poppins_400Regular' },
  track:    { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: 4 },
});

// ─── Success screen ────────────────────────────────────────────────────────────

function SuccessView({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 72, marginBottom: 24 }}>🦅</Text>
      <Text style={{ color: colors.text, fontSize: 24, fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 12 }}>
        Submitted!
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 15, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 24, marginBottom: 36 }}>
        Blaze will review your LB within 48 hours. Thank you for contributing to UltiMaven!
      </Text>
      <TouchableOpacity onPress={onDone} activeOpacity={0.82}>
        <LinearGradient colors={['#7C5CFF', '#6C47FF']} style={{ borderRadius: 18, paddingVertical: 16, paddingHorizontal: 48 }}>
          <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' }}>Back to Profile</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreatorSubmitScreen() {
  const navigation = useNavigation();
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [step,          setStep]          = useState(1);
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedLB,    setSelectedLB]    = useState<number | null>(null);
  const [takenLBs,      setTakenLBs]      = useState<Set<number>>(new Set());
  const [lbTitle,       setLbTitle]       = useState('');
  const [lbDesc,        setLbDesc]        = useState('');
  const [lbOutcome,     setLbOutcome]     = useState('');
  const [videoUri,       setVideoUri]       = useState<string | null>(null);
  const [videoDurationS, setVideoDurationS]  = useState(0);
  const [videoFileSize,  setVideoFileSize]   = useState(0);
  const [videoMimeType,  setVideoMimeType]   = useState('video/mp4');
  const [thumbUri,       setThumbUri]       = useState<string | null>(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success,        setSuccess]        = useState(false);

  const track = TRACKS.find((t) => t.id === selectedTrack);
  const totalLBs = track ? getTrackStats(track).total : 0;

  useEffect(() => {
    if (!selectedTrack) return;
    supabase
      .from('lb_submissions')
      .select('lb_number')
      .eq('track_id', selectedTrack)
      .eq('status', 'approved')
      .then(({ data }) => {
        setTakenLBs(new Set(data?.map((r) => r.lb_number) ?? []));
      });
  }, [selectedTrack]);

  const canNext = () => {
    if (step === 1) return !!selectedTrack;
    if (step === 2) return selectedLB !== null;
    if (step === 3) return lbTitle.trim().length > 2 && lbDesc.trim().length > 2 && lbOutcome.trim().length > 2;
    if (step === 4) return !!videoUri && videoDurationS <= MAX_VIDEO_SECONDS;
    return true;
  };

  const pickVideo = async (fromCamera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'videos' as ImagePicker.MediaType,
      allowsEditing: true,
      quality: 0.5,
      videoMaxDuration: MAX_VIDEO_SECONDS,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_960x540,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (result.canceled || !result.assets[0]) return;
    const asset      = result.assets[0];
    const durationS  = asset.duration ? asset.duration / 1000 : 0;
    const mimeType   = asset.mimeType ?? 'video/mp4';
    const fileSize   = asset.fileSize ?? 0;

    console.error('RAW PICKED ASSET:', JSON.stringify({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
    }));

    if (fileSize > MAX_VIDEO_BYTES) {
      Alert.alert('Video too large', 'Maximum file size is 500 MB. Please choose a smaller video.');
      return;
    }
    if (durationS > MAX_VIDEO_SECONDS) {
      Alert.alert('Video too long', 'Video must be under 3 minutes. Please trim or choose a shorter clip.');
      return;
    }
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      Alert.alert('Unsupported format', `File type "${mimeType}" is not supported. Please use MP4 or MOV.`);
      return;
    }

    setVideoUri(asset.uri);
    setVideoDurationS(durationS);
    setVideoFileSize(fileSize);
    setVideoMimeType(mimeType);
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setThumbUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!profile || !videoUri || !selectedTrack || !selectedLB) return;
    setUploading(true);
    setUploadProgress(0);

    // Phase-driven progress: ramps fast to 30, slower to 70, crawls to 90, stops.
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => {
        if (p < 30) return Math.min(p + 6,  30);
        if (p < 70) return Math.min(p + 2.5, 70);
        if (p < 90) return Math.min(p + 0.8, 90);
        return p;
      });
    }, 200);

    try {
      const videoPath = await uploadLBVideo(
        videoUri, selectedTrack, selectedLB, profile.id, videoMimeType,
      );

      let thumbnailPath: string | undefined;
      if (thumbUri) {
        thumbnailPath = await uploadThumbnail(thumbUri, selectedTrack, selectedLB);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      const { error: insertError } = await supabase.from('lb_submissions').insert({
        creator_id:       profile.id,
        track_id:         selectedTrack,
        lb_number:        selectedLB,
        lb_title:         lbTitle.trim(),
        lb_description:   lbDesc.trim(),
        lb_outcome:       lbOutcome.trim(),
        video_path:       videoPath,
        thumbnail_path:   thumbnailPath ?? null,
        duration_seconds: Math.round(videoDurationS),
      });

      if (insertError) {
        console.error('INSERT ERROR:', JSON.stringify(insertError));
        throw new Error(insertError.message);
      }

      setSuccess(true);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('SUBMIT FAILED:', err?.message ?? err);
      Alert.alert(
        'Upload failed',
        err?.message ?? 'Something went wrong. Check Terminal for details.',
      );
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <SuccessView onDone={() => navigation.goBack()} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Submit a Learning Block</Text>
            <StepIndicator current={step} total={5} />
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Select a Track</Text>
              <Text style={styles.stepSub}>Share your expertise with UltiMaven learners</Text>
              <View style={styles.trackGrid}>
                {TRACKS.map((t) => {
                  const active = selectedTrack === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.trackCard,
                        { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border },
                        active && { backgroundColor: colors.primary + '15' },
                        !isDark && { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
                      ]}
                      onPress={() => { setSelectedTrack(t.id); setSelectedLB(null); }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.trackIconBox, { backgroundColor: isDark ? t.iconBgDark : t.iconBgLight }]}>
                        <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
                      </View>
                      <Text style={[styles.trackCardName, { color: active ? colors.primaryLight : colors.text }]} numberOfLines={2}>{t.name}</Text>
                      {active && <View style={styles.trackCheck}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /></View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 2 && track && (
            <View>
              <Text style={styles.stepTitle}>Select LB Number</Text>
              <Text style={styles.stepSub}>{track.emoji} {track.name} · {totalLBs} learning blocks</Text>
              <View style={styles.lbGrid}>
                {Array.from({ length: totalLBs }, (_, i) => i + 1).map((n) => {
                  const taken   = takenLBs.has(n);
                  const active  = selectedLB === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.lbCell,
                        { backgroundColor: colors.card, borderColor: active ? colors.primary : taken ? colors.border : colors.border },
                        active && { backgroundColor: colors.primary, borderColor: colors.primary },
                        taken  && { opacity: 0.4 },
                      ]}
                      onPress={() => !taken && setSelectedLB(n)}
                      activeOpacity={taken ? 1 : 0.75}
                      disabled={taken}
                    >
                      <Text style={[styles.lbCellNum, { color: active ? '#FFF' : colors.text }]}>{n}</Text>
                      {taken && <Text style={[styles.lbCellSub, { color: colors.textSecondary }]}>Taken</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>LB Details</Text>
              <Text style={styles.stepSub}>Help learners know what to expect</Text>
              <Field
                label="LB Title"
                value={lbTitle}
                onChangeText={setLbTitle}
                placeholder="e.g. Mastering the G Major Chord"
                maxLength={50}
              />
              <Field
                label="LB Description"
                value={lbDesc}
                onChangeText={setLbDesc}
                placeholder="Brief overview of what this learning block covers..."
                maxLength={200}
                multiline
              />
              <Field
                label="What will learners be able to do after this LB?"
                value={lbOutcome}
                onChangeText={setLbOutcome}
                placeholder="e.g. Play a clean G Major chord transition..."
                maxLength={150}
                multiline
              />
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={styles.stepTitle}>Upload Your Video</Text>
              <Text style={styles.stepSub}>Max 3 minutes · MP4 or MOV</Text>

              {!videoUri ? (
                <View style={[styles.uploadZone, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="videocam-outline" size={44} color={colors.textSecondary} />
                  <Text style={[styles.uploadZoneHint, { color: colors.textSecondary }]}>No video selected</Text>
                  <View style={styles.uploadBtnsCol}>
                    <TouchableOpacity
                      style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
                      onPress={() => pickVideo(true)}
                      activeOpacity={0.82}
                    >
                      <Ionicons name="camera-outline" size={18} color="#FFF" />
                      <Text style={styles.uploadBtnTxt}>Record Video Now 📹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.uploadBtn, styles.uploadBtnOutline, { borderColor: colors.primary }]}
                      onPress={() => pickVideo(false)}
                      activeOpacity={0.82}
                    >
                      <Ionicons name="phone-portrait-outline" size={18} color={colors.primaryLight} />
                      <Text style={[styles.uploadBtnTxt, { color: colors.primaryLight }]}>Choose from Library 📱</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={[styles.videoPreview, { backgroundColor: colors.card, borderColor: videoDurationS > MAX_VIDEO_SECONDS ? colors.coral : colors.primary }]}>
                  <Ionicons name="checkmark-circle" size={28} color={videoDurationS > MAX_VIDEO_SECONDS ? colors.coral : colors.green} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.videoPreviewName, { color: colors.text }]} numberOfLines={1}>
                      {videoMimeType === 'video/quicktime' ? 'MOV' : 'MP4'} · {(videoFileSize / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                    <Text style={[styles.videoPreviewDur, { color: videoDurationS > MAX_VIDEO_SECONDS ? colors.coral : colors.textSecondary }]}>
                      {Math.floor(videoDurationS / 60)}:{String(Math.round(videoDurationS % 60)).padStart(2, '0')}
                      {videoDurationS > MAX_VIDEO_SECONDS && ' — too long!'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { setVideoUri(null); setVideoDurationS(0); setVideoFileSize(0); setVideoMimeType('video/mp4'); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {videoDurationS > MAX_VIDEO_SECONDS && (
                <View style={[styles.errorBox, { backgroundColor: colors.coral + '15', borderColor: colors.coral + '40' }]}>
                  <Ionicons name="warning-outline" size={16} color={colors.coral} />
                  <Text style={[styles.errorTxt, { color: colors.coral }]}>Video must be under 3 minutes. Please trim or choose a shorter clip.</Text>
                </View>
              )}
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={styles.stepTitle}>Add Thumbnail</Text>
              <Text style={styles.stepSub}>A great thumbnail gets more learners watching</Text>

              {!thumbUri ? (
                <TouchableOpacity
                  style={[styles.thumbZone, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={pickThumbnail}
                  activeOpacity={0.75}
                >
                  <Ionicons name="image-outline" size={44} color={colors.textSecondary} />
                  <Text style={[styles.thumbZoneTxt, { color: colors.textSecondary }]}>Tap to add thumbnail image</Text>
                  <Text style={[styles.thumbZoneSub, { color: colors.textSecondary }]}>16:9 ratio recommended</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.thumbPreviewWrap}>
                  <Image source={{ uri: thumbUri }} style={styles.thumbPreview} resizeMode="cover" />
                  <TouchableOpacity
                    style={[styles.thumbChangeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={pickThumbnail}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.thumbChangeTxt, { color: colors.primaryLight }]}>Change Thumbnail</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={{ alignItems: 'center', paddingVertical: 12, marginTop: 4 }}
                onPress={() => setThumbUri(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.skipTxt, { color: colors.textSecondary }]}>Skip thumbnail →</Text>
              </TouchableOpacity>

              {uploading ? (
                <UploadProgressBar progress={uploadProgress} />
              ) : (
                <TouchableOpacity style={styles.submitRow} onPress={handleSubmit} activeOpacity={0.84}>
                  <LinearGradient colors={['#7C5CFF', '#6C47FF', '#5A35FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                    <Text style={styles.submitBtnTxt}>Submit for Review 🚀</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {step < 5 && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
              onPress={() => canNext() && setStep(step + 1)}
              activeOpacity={0.82}
              disabled={!canNext()}
            >
              <LinearGradient
                colors={canNext() ? ['#7C5CFF', '#6C47FF'] : [colors.border, colors.border]}
                style={styles.nextBtnGrad}
              >
                <Text style={[styles.nextBtnTxt, !canNext() && { color: colors.textSecondary }]}>
                  {step === 4 ? 'Continue to Thumbnail' : 'Continue'} →
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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

    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    backBtn:     { width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 15, fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },

    scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 16 },

    stepTitle: { color: c.text,          fontSize: 22, fontFamily: 'Poppins_700Bold',   marginBottom: 6 },
    stepSub:   { color: c.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20, marginBottom: 24 },

    // Track grid (2 columns)
    trackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    trackCard: {
      width: (SW - 44 - 12) / 2,
      borderRadius: 18, borderWidth: 1.5, padding: 16,
      alignItems: 'center', gap: 10, position: 'relative',
    },
    trackIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    trackCardName: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', lineHeight: 18 },
    trackCheck:    { position: 'absolute', top: 10, right: 10 },

    // LB number grid (5 per row)
    lbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    lbCell: {
      width: (SW - 44 - 40) / 5,
      aspectRatio: 1, borderRadius: 12, borderWidth: 1.5,
      alignItems: 'center', justifyContent: 'center',
    },
    lbCellNum: { fontSize: 15, fontFamily: 'Poppins_700Bold' },
    lbCellSub: { fontSize: 8,  fontFamily: 'Poppins_400Regular', marginTop: 1 },

    // Upload zone
    uploadZone:     { borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', padding: 36, alignItems: 'center', gap: 12, marginBottom: 12 },
    uploadZoneHint: { fontSize: 14, fontFamily: 'Poppins_400Regular' },
    uploadBtnsCol:  { width: '100%', gap: 10, marginTop: 8 },
    uploadBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 13 },
    uploadBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5 },
    uploadBtnTxt:   { color: '#FFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },

    videoPreview:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 12 },
    videoPreviewName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
    videoPreviewDur:  { fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },

    errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
    errorTxt: { flex: 1, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 18 },

    // Thumbnail
    thumbZone:      { borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', aspectRatio: 16/9, alignItems: 'center', justifyContent: 'center', gap: 8 },
    thumbZoneTxt:   { fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
    thumbZoneSub:   { fontSize: 12, fontFamily: 'Poppins_400Regular' },
    thumbPreviewWrap: { gap: 12 },
    thumbPreview:   { width: '100%', aspectRatio: 16/9, borderRadius: 16 },
    thumbChangeBtn: { alignSelf: 'center', borderRadius: 12, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 20 },
    thumbChangeTxt: { fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
    skipTxt:        { fontSize: 13, fontFamily: 'Poppins_400Regular' },

    submitRow:    { marginTop: 24 },
    submitBtn:    { borderRadius: 18, paddingVertical: 18, alignItems: 'center', shadowColor: '#7C5CFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
    submitBtnTxt: { color: '#FFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', letterSpacing: 0.2 },

    footer:       { borderTopWidth: 1, paddingHorizontal: 22, paddingVertical: 14 },
    nextBtn:      { borderRadius: 18, overflow: 'hidden' },
    nextBtnDisabled: { opacity: 0.5 },
    nextBtnGrad:  { paddingVertical: 17, alignItems: 'center' },
    nextBtnTxt:   { color: '#FFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  });
}
