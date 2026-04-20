import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { startCheckout } from '../services/stripeService';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeColors } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const { width: SW } = Dimensions.get('window');
const PLAN_W = (SW - 44 - 10) / 2;

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  'Unlimited Learning Blocks across all tracks',
  'AI Mentor personalised learning path',
  'Priority peer review within 24 hours',
  'Offline mode — learn anywhere',
  'Advanced progress analytics',
  'Community Mastery Certification',
  '2 × monthly mentor sessions',
];

const PROPLUS_FEATURES = [
  '1-on-1 mentor sessions (live video)',
  'Verified Certificate of Mastery',
  'Early access to new tracks',
];

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: 'monthly' | 'yearly';
  selected: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const isYearly = plan === 'yearly';

  return (
    <TouchableOpacity
      style={[
        planCardStyles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        selected && { borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
        selected && isYearly && { borderColor: colors.primaryLight, shadowColor: colors.primaryLight, shadowOpacity: 0.45 },
      ]}
      onPress={onSelect}
      activeOpacity={0.78}
    >
      {isYearly && (
        <View style={planCardStyles.bestValueBadge}>
          <Text style={planCardStyles.bestValueTxt}>BEST VALUE · Save 34%</Text>
        </View>
      )}

      <View style={[planCardStyles.dot, { borderColor: colors.border }]}>
        <View style={[planCardStyles.dotInner, selected && { backgroundColor: colors.primary }]} />
      </View>

      <Text style={[planCardStyles.title, { color: selected ? colors.primaryLight : colors.textSecondary }]}>
        {isYearly ? 'Pro Yearly' : 'Pro Monthly'}
      </Text>

      <View style={planCardStyles.priceRow}>
        <Text style={[planCardStyles.currency, { color: selected ? colors.primaryLight : colors.textSecondary }]}>$</Text>
        <Text style={[planCardStyles.price, { color: colors.text }]}>{isYearly ? '79' : '9.99'}</Text>
      </View>
      <Text style={[planCardStyles.period, { color: colors.textSecondary }]}>/{isYearly ? 'year' : 'month'}</Text>

      {isYearly && <Text style={planCardStyles.savings}>≈ $6.58/month</Text>}
    </TouchableOpacity>
  );
}

const planCardStyles = StyleSheet.create({
  card:           { width: PLAN_W, borderRadius: 20, borderWidth: 1.5, padding: 16, alignItems: 'center', gap: 4, minHeight: 140, justifyContent: 'center' },
  bestValueBadge: { position: 'absolute', top: -11, backgroundColor: '#FFD93D', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'center' },
  bestValueTxt:   { color: '#1A0E00', fontSize: 8.5, fontFamily: 'Poppins_700Bold', letterSpacing: 0.4 },
  dot:            { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dotInner:       { width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent' },
  title:          { fontSize: 12, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  priceRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 1 },
  currency:       { fontSize: 14, fontFamily: 'Poppins_700Bold', marginTop: 4 },
  price:          { fontSize: 28, fontFamily: 'Poppins_700Bold', lineHeight: 36 },
  period:         { fontSize: 11, fontFamily: 'Poppins_400Regular' },
  savings:        { color: '#3DD68C', fontSize: 10, fontFamily: 'Poppins_600SemiBold', marginTop: 2 },
});

// ─── Feature row ──────────────────────────────────────────────────────────────

function FeatureRow({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={featureStyles.row}>
      <Text style={featureStyles.check}>✅</Text>
      <Text style={[featureStyles.txt, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  check: { fontSize: 15, lineHeight: 22 },
  txt:   { flex: 1, fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 22 },
});

// ─── Pro+ Modal ───────────────────────────────────────────────────────────────

function ProPlusModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={modalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={[modalStyles.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={[modalStyles.handle, { backgroundColor: colors.border }]} />

          <View style={modalStyles.header}>
            <Text style={[modalStyles.title, { color: colors.text }]}>Pro+ Plan</Text>
            <TouchableOpacity onPress={onClose} style={[modalStyles.closeBtn, { backgroundColor: colors.surface2 }]}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.priceRow}>
            <Text style={[modalStyles.currency, { color: colors.primaryLight }]}>$</Text>
            <Text style={[modalStyles.price, { color: colors.text }]}>19.99</Text>
            <Text style={[modalStyles.period, { color: colors.textSecondary }]}>/month</Text>
          </View>
          <Text style={[modalStyles.priceSub, { color: colors.textSecondary }]}>Everything in Pro, plus:</Text>

          {PROPLUS_FEATURES.map((f) => (
            <View key={f} style={featureStyles.row}>
              <Text style={featureStyles.check}>⭐</Text>
              <Text style={[featureStyles.txt, { color: colors.text }]}>{f}</Text>
            </View>
          ))}

          <TouchableOpacity activeOpacity={0.84} style={{ marginTop: 24 }} onPress={onClose}>
            <LinearGradient
              colors={['#FFD93D', '#FF9F43', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={modalStyles.cta}
            >
              <Text style={modalStyles.ctaTxt}>Get Pro+ — $19.99/month</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[modalStyles.note, { color: colors.textSecondary }]}>Cancel anytime. Billed monthly.</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  sheet:    { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36, borderTopWidth: 1 },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:    { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginBottom: 4 },
  currency: { fontSize: 16, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  price:    { fontSize: 38, fontFamily: 'Poppins_700Bold', lineHeight: 48 },
  period:   { fontSize: 14, fontFamily: 'Poppins_400Regular', marginBottom: 8 },
  priceSub: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
  cta:      { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  ctaTxt:   { color: '#1A0800', fontSize: 16, fontFamily: 'Poppins_700Bold', letterSpacing: 0.2 },
  note:     { fontSize: 11, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 10 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaywallScreen({ navigation, route }: Props) {
  const source = route.params?.source;
  const insets = useSafeAreaInsets();
  const { refreshProfile, setIsPro } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [showProPlus,  setShowProPlus]  = useState(false);
  const [showFreeMsg,  setShowFreeMsg]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.94)).current;
  const freeMsgAnim = useRef(new Animated.Value(0)).current;
  const phoenixY    = useRef(new Animated.Value(-20)).current;
  const isClosing   = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }),
      Animated.spring(phoenixY,  { toValue: 0, tension: 45, friction: 8, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleClose() {
    if (isClosing.current) return;
    isClosing.current = true;
    try {
      if (source === 'lb_limit') {
        setShowFreeMsg(true);
        Animated.timing(freeMsgAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
        setTimeout(() => { try { navigation.goBack(); } catch {} }, 2200);
      } else {
        navigation.goBack();
      }
    } catch {}
  }

  const handlePurchase = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await startCheckout(selectedPlan);
      if (result === 'success') {
        setIsPro(true);
        await refreshProfile();
        Alert.alert(
          'Welcome to Pro! 🔥',
          'Blaze is ready to take you to mastery',
          [{
            text: "Let's Go!",
            onPress: () => navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] })
            ),
          }]
        );
      }
    } catch {
      Alert.alert('Payment Failed', 'Please check your card details and try again.', [{ text: 'OK' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const ctaSubtext = selectedPlan === 'yearly'
    ? 'Then USD 79/year. Cancel anytime.'
    : 'Then USD 9.99/month. Cancel anytime.';

  return (
    <View style={styles.container}>
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        onPress={handleClose}
        disabled={isClosing.current}
        activeOpacity={0.65}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={20} color={colors.text} />
      </TouchableOpacity>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.ScrollView
          style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text style={[styles.phoenix, { transform: [{ translateY: phoenixY }] }]}>
            🦅
          </Animated.Text>

          <Text style={styles.title}>Unlock Your Full Potential</Text>
          <Text style={styles.subtitle}>Join thousands of learners achieving real mastery</Text>

          <View style={styles.planRow}>
            <PlanCard plan="monthly" selected={selectedPlan === 'monthly'} onSelect={() => setSelectedPlan('monthly')} />
            <PlanCard plan="yearly"  selected={selectedPlan === 'yearly'}  onSelect={() => setSelectedPlan('yearly')}  />
          </View>

          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Everything in Pro</Text>
            {FEATURES.map((f) => <FeatureRow key={f} text={f} />)}
          </View>

          <TouchableOpacity activeOpacity={0.84} style={styles.ctaWrap} onPress={handlePurchase} disabled={isProcessing}>
            <LinearGradient
              colors={['#9B7AFF', '#7C5CFF', '#5A35FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaBtn}
            >
              {isProcessing
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.ctaTxt}>Start 7-Day Free Trial 🔥</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.ctaSub}>{ctaSubtext}</Text>

          <TouchableOpacity style={styles.proPlusLink} onPress={() => setShowProPlus(true)} activeOpacity={0.7}>
            <Text style={styles.proPlusTxt}>See Pro+ plans ›</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <TouchableOpacity activeOpacity={0.65}>
              <Text style={styles.footerLink}>Restore Purchase</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity activeOpacity={0.65}>
              <Text style={styles.footerLink}>Terms & Privacy</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>

        {showFreeMsg && (
          <Animated.View style={[styles.freeMsgBanner, { opacity: freeMsgAnim }]}>
            <Text style={styles.freeMsgIcon}>🔓</Text>
            <Text style={styles.freeMsgTxt}>
              You can access{' '}
              <Text style={styles.freeMsgBold}>LBs 1–5 for free.</Text>
              {' '}Upgrade anytime to unlock all content.
            </Text>
          </Animated.View>
        )}
      </SafeAreaView>

      <ProPlusModal visible={showProPlus} onClose={() => setShowProPlus(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    safe:      { flex: 1 },

    blobTL: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: c.primary, opacity: 0.10, top: -100, left: -100 },
    blobBR: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: c.primary, opacity: 0.07, bottom: 40, right: -80 },

    closeBtn: {
      position: 'absolute', right: 20, zIndex: 100,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },

    scroll: { paddingHorizontal: 22, paddingTop: 36, paddingBottom: 32, alignItems: 'center' },

    phoenix: {
      fontSize: 72, lineHeight: 88, textAlign: 'center',
      shadowColor: '#FFD93D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 24,
      marginBottom: 8,
    },

    title:    { color: c.text,          fontSize: 26, fontFamily: 'Poppins_700Bold',    textAlign: 'center', lineHeight: 34, marginBottom: 8 },
    subtitle: { color: c.textSecondary, fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },

    planRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 22 },

    featuresCard:  { width: '100%', backgroundColor: c.card, borderRadius: 20, borderWidth: 1, borderColor: c.border, padding: 20, gap: 12, marginBottom: 24 },
    featuresTitle: { color: c.textSecondary, fontSize: 11, fontFamily: 'Poppins_700Bold', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 },

    ctaWrap: { width: '100%' },
    ctaBtn:  { borderRadius: 18, paddingVertical: 17, alignItems: 'center', shadowColor: c.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.55, shadowRadius: 20, elevation: 10 },
    ctaTxt:  { color: '#FFFFFF', fontSize: 17, fontFamily: 'Poppins_700Bold', letterSpacing: 0.3 },
    ctaSub:  { color: c.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginTop: 12, marginBottom: 4 },

    proPlusLink: { paddingVertical: 10, paddingHorizontal: 20, marginBottom: 20 },
    proPlusTxt:  { color: c.primaryLight, fontSize: 13, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },

    footerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    footerLink: { color: c.textSecondary, fontSize: 12, fontFamily: 'Poppins_400Regular' },
    footerDot:  { color: c.border,        fontSize: 12 },

    freeMsgBanner: {
      position: 'absolute', bottom: 100, left: 16, right: 16,
      backgroundColor: c.card, borderRadius: 16, borderWidth: 1.5, borderColor: c.border,
      paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    freeMsgIcon: { fontSize: 20, lineHeight: 26 },
    freeMsgTxt:  { flex: 1, color: c.textSecondary, fontSize: 13, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
    freeMsgBold: { color: c.primaryLight, fontFamily: 'Poppins_600SemiBold' },
  });
}
