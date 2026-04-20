import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { clearAllProgressCache } from '../utils/progress';

export interface UserProfile {
  id:                string;
  full_name:         string | null;
  email:             string | null;
  avatar_url:        string | null;
  is_pro:            boolean;
  is_admin:          boolean;
  pro_since:         string | null;
  streak_count:      number;
  last_session_date: string | null;
  total_xp:          number;
  created_at:        string;
}

interface AuthContextValue {
  session:        Session | null;
  user:           User | null;
  profile:        UserProfile | null;
  isPro:          boolean;
  setIsPro:       (val: boolean) => void;
  loading:        boolean;
  profileLoading: boolean;
  isNetworkError: boolean;
  signOut:        () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(
  userId: string,
  userEmail?: string | null,
): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (data) return data as UserProfile;

  // Profile row missing — create a minimal one (e.g. after OAuth sign-in)
  const minimal = {
    id:    userId,
    email: userEmail ?? null,
  };
  await supabase.from('profiles').upsert(minimal);
  return {
    id:                userId,
    full_name:         null,
    email:             userEmail ?? null,
    avatar_url:        null,
    is_pro:            false,
    is_admin:          false,
    pro_since:         null,
    streak_count:      0,
    last_session_date: null,
    total_xp:          0,
    created_at:        new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session,        setSession]        = useState<Session | null>(null);
  const [profile,        setProfile]        = useState<UserProfile | null>(null);
  const [isPro,          setIsPro]          = useState<boolean>(false);
  const [loading,        setLoading]        = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const loadProfile = async (userId: string, userEmail?: string | null) => {
    setProfileLoading(true);
    setIsNetworkError(false);
    void clearAllProgressCache();
    try {
      const p = await fetchProfile(userId, userEmail);
      setProfile(p);
      const proValue = p?.is_pro === true;
      setIsPro(proValue);
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      const networkFail = msg.includes('Failed to fetch') || msg.includes('Network request failed') || msg.includes('ECONNREFUSED');
      setIsNetworkError(networkFail);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s?.user) loadProfile(s.user.id, s.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setLoading(false);
        if (s?.user) {
          await loadProfile(s.user.id, s.user.email);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsPro(false);
  };

  const refreshProfile = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) await loadProfile(s.user.id, s.user.email);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user:    session?.user ?? null,
      profile,
      isPro,
      setIsPro,
      loading,
      profileLoading,
      isNetworkError,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
