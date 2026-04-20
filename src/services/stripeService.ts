/*
 * ─── STRIPE SERVICE ───────────────────────────────────────────────────────────
 *
 * TEST CARD DETAILS (Stripe test mode only — no real charges):
 *   Card number: 4242 4242 4242 4242
 *   Expiry:      Any future date (e.g. 12/34)
 *   CVC:         Any 3 digits   (e.g. 123)
 *   Postcode:    Any            (e.g. 10001)
 *
 * ⚠️  SECURITY — DEV ONLY:
 *   Payment intents are created by calling Stripe's API directly from the app
 *   using EXPO_PUBLIC_STRIPE_SECRET_KEY. This is acceptable in test mode but
 *   is INSECURE for production — the key would be visible inside the app bundle.
 *
 *   Before shipping, replace createPaymentIntent() with a fetch to your own
 *   backend endpoint (e.g. POST https://api.yourapp.com/create-payment-intent).
 *   The secret key must only ever live on the server.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const IS_PRO_KEY    = 'is_pro_user';
export const PRO_SINCE_KEY = 'pro_since';

// Prices in USD cents
const PRICES: Record<'monthly' | 'yearly', number> = {
  monthly: 999,   // $9.99
  yearly:  7900,  // $79.00
};

// ─── Internal: create payment intent via Stripe API ──────────────────────────
// In production replace this with: fetch('https://your-backend.com/create-payment-intent', ...)

async function createPaymentIntent(plan: 'monthly' | 'yearly'): Promise<string> {
  const secretKey = process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY ?? '';
  const amount    = PRICES[plan];

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `amount=${amount}&currency=usd&automatic_payment_methods[enabled]=true`,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'Failed to create payment intent');
  }

  const data = await res.json();
  return data.client_secret as string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type CheckoutResult = 'success' | 'cancelled';

export async function startCheckout(plan: 'monthly' | 'yearly'): Promise<CheckoutResult> {
  const clientSecret = await createPaymentIntent(plan);

  const { error: initErr } = await initPaymentSheet({
    merchantDisplayName:       'UltiMaven',
    paymentIntentClientSecret: clientSecret,
    defaultBillingDetails:     { name: 'Sri' },
    returnURL:                 'ultimaven://stripe-redirect',
    appearance: {
      colors: {
        primary:             '#7C5CFF',
        background:          '#0D0D1A',
        componentBackground: '#0E0B20',
        componentBorder:     '#1E1640',
        componentDivider:    '#2A1A5A',
        primaryText:         '#FFFFFF',
        secondaryText:       '#9B7AFF',
        componentText:       '#FFFFFF',
        placeholderText:     '#4A3A6A',
        icon:                '#9B7AFF',
      },
    },
  });

  if (initErr) throw new Error(initErr.message);

  const { error: presentErr } = await presentPaymentSheet();

  if (presentErr) {
    if (presentErr.code === 'Canceled') return 'cancelled';
    throw new Error(presentErr.message);
  }

  // Payment succeeded — persist pro status locally and in Supabase
  const now   = new Date().toISOString();
  const today = now.split('T')[0]; // YYYY-MM-DD

  await Promise.all([
    AsyncStorage.setItem(IS_PRO_KEY,    'true'),
    AsyncStorage.setItem(PRO_SINCE_KEY, today),
  ]);

  // Update Supabase profile (fire-and-forget; local state is the fallback)
  void (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ is_pro: true, pro_since: now })
          .eq('id', session.user.id);
      }
    } catch {}
  })();

  return 'success';
}

export async function getProStatus(): Promise<{ isPro: boolean; proSince: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('is_pro, pro_since')
        .eq('id', session.user.id)
        .single();
      if (data) {
        return {
          isPro:    data.is_pro,
          proSince: data.pro_since ? (data.pro_since as string).split('T')[0] : null,
        };
      }
    }
  } catch {}

  // AsyncStorage fallback
  const [isPro, proSince] = await Promise.all([
    AsyncStorage.getItem(IS_PRO_KEY),
    AsyncStorage.getItem(PRO_SINCE_KEY),
  ]);
  return { isPro: isPro === 'true', proSince };
}

export function formatProDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${names[Number(month) - 1]} ${year}`;
}
