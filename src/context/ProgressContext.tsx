import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { TRACKS } from '../data/tracks';
import { getCompletedLBIds, markLBCompleted } from '../utils/progress';
import { sendMilestoneNotification } from '../notifications/notificationService';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

const TRACK_TOTALS: Record<string, number> = {};
for (const track of TRACKS) {
  TRACK_TOTALS[track.id] = track.sections.flatMap((s) => s.blocks).length;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressContextValue {
  completedByTrack: Record<string, number[]>;
  totalLBsDone: number;
  totalXP: number;
  tracksActive: number;
  badges: number;
  activeTracks: string[];
  getTrackCompletedIds: (trackId: string) => Set<number>;
  getTrackPercent: (trackId: string) => number;
  getTrackLessonsDone: (trackId: string) => number;
  completeLB: (trackId: string, lbId: number, score?: number) => Promise<void>;
  addTrack: (trackId: string) => Promise<void>;
  refreshActiveTracks: (userId?: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProgressContext = createContext<ProgressContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [completedByTrack, setCompletedByTrack] = useState<Record<string, number[]>>({});
  const [activeTracks, setActiveTracks] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;

    setCompletedByTrack({});
    setActiveTracks([]);

    if (!user) return;

    // Load which tracks the user has added
    supabase
      .from('skill_tracks')
      .select('track_key')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const keys = data.map((r: { track_key: string }) => r.track_key);
          setActiveTracks(keys);
        }
      });

    // Load real completions from Supabase only
    Promise.all(TRACKS.map((t) => getCompletedLBIds(t.id)))
      .then((results) => {
        const data: Record<string, number[]> = {};
        TRACKS.forEach((t, i) => { data[t.id] = results[i]; });
        setCompletedByTrack(data);
      })
      .catch(() => {});
  }, [user, authLoading]);

  // Optimistic update: state changes immediately, then persists to AsyncStorage
  const completeLB = useCallback(async (trackId: string, lbId: number, score: number = 100): Promise<void> => {
    let newUserIds: number[] = [];
    setCompletedByTrack((prev) => {
      const existing = prev[trackId] ?? [];
      if (existing.includes(lbId)) return prev;
      newUserIds = [...existing, lbId];
      return { ...prev, [trackId]: newUserIds };
    });
    await markLBCompleted(trackId, lbId, score);

    // Milestone notifications (fire-and-forget)
    const mergedSize = new Set(newUserIds).size;
    const trackTotal = TRACK_TOTALS[trackId] ?? 1;
    const track      = TRACKS.find((t) => t.id === trackId);

    if (mergedSize === trackTotal) {
      sendMilestoneNotification('track_complete', track?.name).catch(() => {});
    } else if (mergedSize === Math.round(trackTotal / 2)) {
      sendMilestoneNotification('track_50pct', track?.name).catch(() => {});
    }
  }, []);

  const refreshActiveTracks = useCallback(async (userId?: string): Promise<void> => {
    const id = userId ?? user?.id;
    if (!id) return;
    const { data } = await supabase
      .from('skill_tracks')
      .select('track_key')
      .eq('user_id', id);
    if (data) {
      const trackKeys = data.map((r: { track_key: string }) => r.track_key);
      setActiveTracks(trackKeys);
    }
  }, [user]);

  const addTrack = useCallback(async (trackId: string): Promise<void> => {
    if (!user) return;

    setActiveTracks((prev) => prev.includes(trackId) ? prev : [...prev, trackId]);

    const track = TRACKS.find((t) => t.id === trackId);
    try {
      await supabase.from('skill_tracks').upsert(
        {
          user_id:             user.id,
          track_key:           trackId,
          track_name:          track?.name ?? trackId,
          track_emoji:         track?.emoji ?? '',
          total_lbs:           track?.sections.flatMap((s) => s.blocks).length ?? 0,
          completed_lbs:       0,
          progress_percentage: 0,
          is_active:           true,
        },
        { onConflict: 'user_id,track_key' }
      );
    } catch {
      setActiveTracks((prev) => prev.filter((id) => id !== trackId));
    }
  }, [user]);

  const getTrackCompletedIds = useCallback((trackId: string): Set<number> => {
    return new Set<number>(completedByTrack[trackId] ?? []);
  }, [completedByTrack]);

  const getTrackPercent = useCallback((trackId: string): number => {
    const total = TRACK_TOTALS[trackId];
    if (!total || total === 0) return 0;
    const completed = getTrackCompletedIds(trackId).size;
    return Math.round((completed / total) * 100);
  }, [getTrackCompletedIds]);

  const getTrackLessonsDone = useCallback((trackId: string): number => {
    return getTrackCompletedIds(trackId).size;
  }, [getTrackCompletedIds]);

  const totalLBsDone = useMemo(
    () => TRACKS.reduce((sum, t) => sum + getTrackCompletedIds(t.id).size, 0),
    [getTrackCompletedIds]
  );

  const totalXP      = totalLBsDone * 50;
  const tracksActive = activeTracks.length;
  const badges       = Math.floor(totalLBsDone / 4);

  const value: ProgressContextValue = {
    completedByTrack,
    totalLBsDone,
    totalXP,
    tracksActive,
    badges,
    activeTracks,
    getTrackCompletedIds,
    getTrackPercent,
    getTrackLessonsDone,
    completeLB,
    addTrack,
    refreshActiveTracks,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
