import React, { useEffect, useRef, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const { width: SW } = Dimensions.get('window');

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
  const isYearly = plan === 'yearly';

  return (
    <TouchableOpacity
      style={[
        styles.planCard,
        selected && styles.planCardSelected,
        isYearly && selected && styles.planCardYearlySelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.78}
    >
      {/* Best value badge */}
      {isYearly && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueTxt}>BEST VALUE · Save 34%</Text>
        </View>
      )}

      <View style={styles.planDot}>
        <View style={[styles.planDotInner, selected && styles.planDotInnerSelected]} />
      </View>

      <Text style={[styles.planTitle, selected && styles.planTitleSelected]}>
        {isYearly ? 'Pro Yearly' : 'Pro Monthly'}
      </Text>

      <View style={styles.planPriceRow}>
        <Text style={[styles.planCurrency, selected && styles.planPriceSelected]}>$</Text>
        <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
          {isYearly ? '79' : '9.99'}
        </Text>
      </View>
      <Text style={styles.planPeriod}>/{isYearly ? 'year' : 'month'}</Text>

      {isYearly && (
        <Text style={styles.planSavings}>≈ $6.58/month</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Feature row ──────────────────────────────────────────────────────────────

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureCheck}>✅</Text>
      <Text style={styles.featureTxt}>{text}</Text>
    </View>
  );
}

// ─── Pro+ Modal ───────────────────────────────────────────────────────────────

function ProPlusModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalSheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Handle bar */}
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Pro+ Plan</Text>
            <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
              <Ionicons name="close" size={20} color="#6A5A8A" />
            </TouchableOpacity>
          </View>

          {/* Price */}
          <View style={styles.sheetPriceRow}>
            <Text style={styles.sheetCurrency}>$</Text>
            <Text style={styles.sheetPrice}>19.99</Text>
            <Text style={styles.sheetPeriod}>/month</Text>
          </View>
          <Text style={styles.sheetPriceSub}>Everything in Pro, plus:</Text>

          {/* Extra features */}
          {PROPLUS_FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>⭐</Text>
              <Text style={styles.featureTxt}>{f}</Text>
            </View>
          ))}

          <TouchableOpacity activeOpacity={0.84} style={{ marginTop: 24 }} onPress={onClose}>
            <LinearGradient
              colors={['#FFD93D', '#FF9F43', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sheetCta}
            >
              <Text style={styles.sheetCtaTxt}>Get Pro+ — $19.99/month</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.sheetNote}>Cancel anytime. Billed monthly.</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaywallScreen({ navigation, route }: Props) {
  const source = route.params?.source;
  const insets = useSafeAreaInsets();
  const { refreshProfile, setIsPro } = useAuth();

  const [selectedPlan, setSelectedPlan]   = useState<'monthly' | 'yearly'>('yearly');
  const [showProPlus, setShowProPlus]     = useState(false);
  const [showFreeMsg, setShowFreeMsg]     = useState(false);
  const [isProcessing, setIsProcessing]   = useState(false);

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
        setTimeout(() => {
          try { navigation.goBack(); } catch {}
        }, 2200);
      } else {
        navigation.goBack();
      }
    } catch {
      // Navigation errors fail silently — the screen will be dismissed by the OS
    }
  }

  const handlePurchase = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await startCheckout(selectedPlan);
      if (result === 'success') {
        // Update isPro instantly so screens unlock before the async profile refresh completes
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
      // 'cancelled' → sheet dismissed, stay on paywall
    } catch (err: any) {
      Alert.alert(
        'Payment Failed',
        'Please check your card details and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const ctaSubtext = selectedPlan === 'yearly'
    ? 'Then USD 79/year. Cancel anytime.'
    : 'Then USD 9.99/month. Cancel anytime.';

  return (
    <View style={styles.container}>
      {/* Background gradient blobs */}
      <View style={styles.blobTL} />
      <View style={styles.blobBR} />

      {/* ── Close button — sits above SafeAreaView, clears notch via insets ── */}
      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top + 12 }]}
        onPress={handleClose}
        disabled={isClosing.current}
        activeOpacity={0.65}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        <Animated.ScrollView
          style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Phoenix ── */}
          <Animated.Text style={[styles.phoenix, { transform: [{ translateY: phoenixY }] }]}>
            🦅
          </Animated.Text>

          {/* ── Headline ── */}
          <Text style={styles.title}>Unlock Your Full Potential</Text>
          <Text style={styles.subtitle}>
            Join thousands of learners achieving real mastery
          </Text>

          {/* ── Plan selector ── */}
          <View style={styles.planRow}>
            <PlanCard plan="monthly" selected={selectedPlan === 'monthly'} onSelect={() => setSelectedPlan('monthly')} />
            <PlanCard plan="yearly"  selected={selectedPlan === 'yearly'}  onSelect={() => setSelectedPlan('yearly')} />
          </View>

          {/* ── Features ── */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Everything in Pro</Text>
            {FEATURES.map((f) => <FeatureRow key={f} text={f} />)}
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity
            activeOpacity={0.84}
            style={styles.ctaWrap}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
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

          {/* ── Pro+ upsell link ── */}
          <TouchableOpacity
            style={styles.proPlusLink}
            onPress={() => setShowProPlus(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.proPlusTxt}>See Pro+ plans ›</Text>
          </TouchableOpacity>

          {/* ── Footer links ── */}
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

        {/* ── Free tier message banner (shown on close from lb_limit) ── */}
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

      {/* ── Pro+ Modal ── */}
      <ProPlusModal visible={showProPlus} onClose={() => setShowProPlus(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PLAN_W = (SW - 44 - 10) / 2; // two cards with 10px gap inside 22px padding

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  safe:      { flex: 1 },

  blobTL: {
    position: 'absolute', width: 360, height: 360, borderRadius: 180,
    backgroundColor: '#7C5CFF', opacity: 0.10, top: -100, left: -100,
  },
  blobBR: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#5A35FF', opacity: 0.07, bottom: 40, right: -80,
  },

  closeBtn: {
    position: 'absolute',
    // top is set dynamically via insets.top + 12
    right: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E38',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 32,
    alignItems: 'center',
  },

  // Phoenix
  phoenix: {
    fontSize: 72,
    lineHeight: 88,
    textAlign: 'center',
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    marginBottom: 8,
  },

  // Headline
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    color: '#6A5A8A',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  // Plan cards
  planRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 22,
  },
  planCard: {
    width: PLAN_W,
    backgroundColor: '#0F0C24',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2A1A4A',
    padding: 16,
    alignItems: 'center',
    gap: 4,
    minHeight: 140,
    justifyContent: 'center',
  },
  planCardSelected: {
    borderColor: '#7C5CFF',
    backgroundColor: '#130E2E',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  planCardYearlySelected: {
    borderColor: '#9B7AFF',
    shadowColor: '#9B7AFF',
    shadowOpacity: 0.45,
  },

  bestValueBadge: {
    position: 'absolute',
    top: -11,
    backgroundColor: '#FFD93D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  bestValueTxt: {
    color: '#1A0E00',
    fontSize: 8.5,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.4,
  },

  planDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#3A2A5A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  planDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  planDotInnerSelected: {
    backgroundColor: '#7C5CFF',
  },

  planTitle: {
    color: '#6A5A8A',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  planTitleSelected: { color: '#C4B0FF' },

  planPriceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 1 },
  planCurrency: {
    color: '#4A3A6A',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
  },
  planPrice: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 36,
  },
  planPriceSelected: { color: '#FFFFFF' },

  planPeriod: {
    color: '#4A3A6A',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  planSavings: {
    color: '#3DD68C',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 2,
  },

  // Features card
  featuresCard: {
    width: '100%',
    backgroundColor: '#0D0A1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E1640',
    padding: 20,
    gap: 12,
    marginBottom: 24,
  },
  featuresTitle: {
    color: '#7A6A9A',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureCheck: { fontSize: 15, lineHeight: 22 },
  featureTxt: {
    flex: 1,
    color: '#D4C8F0',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 22,
  },

  // CTA
  ctaWrap: { width: '100%' },
  ctaBtn: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaTxt: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.3,
  },
  ctaSub: {
    color: '#4A3A6A',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },

  // Pro+ link
  proPlusLink: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  proPlusTxt: {
    color: '#9B7AFF',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  footerLink: {
    color: '#3A2A5A',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  footerDot: {
    color: '#2A1A4A',
    fontSize: 12,
  },

  // Free tier message banner
  freeMsgBanner: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#0D0A1E',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3D2880',
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  freeMsgIcon: { fontSize: 20, lineHeight: 26 },
  freeMsgTxt: {
    flex: 1,
    color: '#9A8ABB',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  freeMsgBold: {
    color: '#C4B0FF',
    fontFamily: 'Poppins_600SemiBold',
  },

  // Pro+ modal sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0F0C22',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: '#2A1A4A',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#2A1A4A',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  sheetCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1A1438',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginBottom: 4,
  },
  sheetCurrency: {
    color: '#9B7AFF', fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 6,
  },
  sheetPrice: {
    color: '#FFFFFF', fontSize: 38,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 48,
  },
  sheetPeriod: {
    color: '#6A5A8A', fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
  },
  sheetPriceSub: {
    color: '#6A5A8A',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 16,
  },
  sheetCta: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sheetCtaTxt: {
    color: '#1A0800',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.2,
  },
  sheetNote: {
    color: '#3A2A5A',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 10,
  },
});
