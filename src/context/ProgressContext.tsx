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

// ─── Static completions (pre-loaded in tracks.ts, e.g. Guitar LBs 1-8) ──────

const STATIC_COMPLETED: Record<string, Set<number>> = {};
for (const track of TRACKS) {
  STATIC_COMPLETED[track.id] = new Set(
    track.sections.flatMap((s) =>
      s.blocks.filter((b) => b.status === 'completed').map((b) => b.id)
    )
  );
}

const TRACK_TOTALS: Record<string, number> = {};
for (const track of TRACKS) {
  TRACK_TOTALS[track.id] = track.sections.flatMap((s) => s.blocks).length;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressContextValue {
  /** User-completed LB ids per track (from AsyncStorage). Does NOT include static ones. */
  completedByTrack: Record<string, number[]>;
  /** Sum of all completed LBs across every track (static + user). */
  totalLBsDone: number;
  totalXP: number;
  tracksActive: number;
  badges: number;
  /** Merged set: static completions + user completions for a given track. */
  getTrackCompletedIds: (trackId: string) => Set<number>;
  getTrackPercent: (trackId: string) => number;
  getTrackLessonsDone: (trackId: string) => number;
  /** Mark an LB as completed — updates state immediately, then persists. */
  completeLB: (trackId: string, lbId: number) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProgressContext = createContext<ProgressContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completedByTrack, setCompletedByTrack] = useState<Record<string, number[]>>({});

  // Load all user progress from AsyncStorage once on mount
  useEffect(() => {
    Promise.all(TRACKS.map((t) => getCompletedLBIds(t.id))).then((results) => {
      const data: Record<string, number[]> = {};
      TRACKS.forEach((t, i) => { data[t.id] = results[i]; });
      setCompletedByTrack(data);
    });
  }, []);

  // Optimistic update: state changes immediately, then persists to AsyncStorage
  const completeLB = useCallback(async (trackId: string, lbId: number): Promise<void> => {
    let newUserIds: number[] = [];
    setCompletedByTrack((prev) => {
      const existing = prev[trackId] ?? [];
      if (existing.includes(lbId)) return prev;
      newUserIds = [...existing, lbId];
      return { ...prev, [trackId]: newUserIds };
    });
    await markLBCompleted(trackId, lbId);

    // Milestone notifications (fire-and-forget)
    const staticIds  = STATIC_COMPLETED[trackId] ?? new Set<number>();
    const mergedSize = new Set([...staticIds, ...newUserIds]).size;
    const trackTotal = TRACK_TOTALS[trackId] ?? 1;
    const track      = TRACKS.find((t) => t.id === trackId);

    if (mergedSize === trackTotal) {
      sendMilestoneNotification('track_complete', track?.name).catch(() => {});
    } else if (mergedSize === Math.round(trackTotal / 2)) {
      sendMilestoneNotification('track_50pct', track?.name).catch(() => {});
    }
  }, []);

  // Merged set: static + user completions
  const getTrackCompletedIds = useCallback((trackId: string): Set<number> => {
    const staticIds = STATIC_COMPLETED[trackId] ?? new Set<number>();
    const userIds   = completedByTrack[trackId] ?? [];
    return new Set<number>([...staticIds, ...userIds]);
  }, [completedByTrack]);

  const getTrackPercent = useCallback((trackId: string): number => {
    const total = TRACK_TOTALS[trackId] ?? 1;
    return Math.round((getTrackCompletedIds(trackId).size / total) * 100);
  }, [getTrackCompletedIds]);

  const getTrackLessonsDone = useCallback((trackId: string): number => {
    return getTrackCompletedIds(trackId).size;
  }, [getTrackCompletedIds]);

  const totalLBsDone = useMemo(
    () => TRACKS.reduce((sum, t) => sum + getTrackCompletedIds(t.id).size, 0),
    [getTrackCompletedIds]
  );

  const totalXP      = totalLBsDone * 50;
  const tracksActive = TRACKS.filter((t) => getTrackCompletedIds(t.id).size > 0).length;
  const badges       = Math.floor(totalLBsDone / 4);

  const value: ProgressContextValue = {
    completedByTrack,
    totalLBsDone,
    totalXP,
    tracksActive,
    badges,
    getTrackCompletedIds,
    getTrackPercent,
    getTrackLessonsDone,
    completeLB,
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
