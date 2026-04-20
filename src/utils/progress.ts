import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { TRACKS } from '../data/tracks';

function storageKey(trackId: string): string {
  return `progress_${trackId}`;
}

// ─── One-time migration: nuclear-clear on version mismatch ───────────────────

const DATA_VERSION = '2.0';

export async function migrateDataVersion(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem('data_version');
    if (stored !== DATA_VERSION) {
      await AsyncStorage.clear();
      await AsyncStorage.setItem('data_version', DATA_VERSION);
      console.log('[progress] Data migration: cleared all AsyncStorage → version', DATA_VERSION);
    }
  } catch {}
}

// ─── Clear all cached progress from AsyncStorage ─────────────────────────────

export async function clearAllProgressCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const progressKeys = keys.filter((k) => k.startsWith('progress_'));
    if (progressKeys.length > 0) {
      await AsyncStorage.multiRemove(progressKeys);
      console.log('[progress] Cleared', progressKeys.length, 'cached progress keys');
    }
  } catch {}
}

// ─── Local-only (AsyncStorage) — always fast ──────────────────────────────────

export async function getCompletedLBIdsLocal(trackId: string): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(trackId));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

async function cacheLocally(trackId: string, ids: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(trackId), JSON.stringify(ids));
  } catch {}
}

// ─── Supabase + AsyncStorage fallback ────────────────────────────────────────

export async function getCompletedLBIds(trackId: string): Promise<number[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await supabase
        .from('learning_blocks')
        .select('lb_number')
        .eq('user_id', session.user.id)
        .eq('track_key', trackId)
        .eq('is_completed', true);

      if (!error && data) {
        const ids = data.map((r: { lb_number: number }) => r.lb_number);
        await cacheLocally(trackId, ids);
        return ids;
      }
    }
  } catch {}

  return getCompletedLBIdsLocal(trackId);
}

// ─── Write: local-first, then Supabase ───────────────────────────────────────

export async function markLBCompleted(trackId: string, lbId: number, score: number = 100): Promise<void> {
  // Always write to AsyncStorage immediately (offline-safe)
  try {
    const existing = await getCompletedLBIdsLocal(trackId);
    if (!existing.includes(lbId)) {
      await AsyncStorage.setItem(storageKey(trackId), JSON.stringify([...existing, lbId]));
    }
  } catch {}

  // Sync to Supabase in the background
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;
    const track  = TRACKS.find((t) => t.id === trackId);
    const block  = track?.sections.flatMap((s) => s.blocks).find((b) => b.id === lbId);
    const lbTitle = block?.title ?? `LB ${lbId}`;

    await supabase.from('learning_blocks').upsert(
      {
        user_id:      userId,
        track_key:    trackId,
        lb_number:    lbId,
        lb_title:     lbTitle,
        is_completed: true,
        score:        score,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,track_key,lb_number' }
    );

    // Atomically increment XP via the DB function
    await supabase.rpc('increment_xp', { user_id_param: userId, xp_amount: 50 });

    // Save achievement record
    console.log('[progress] Saving achievement for:', lbTitle, 'in track:', track?.name);
    const { error: achieveErr } = await supabase.from('achievements').insert({
      user_id:           userId,
      achievement_type:  'lb_completed',
      achievement_title: `Completed "${lbTitle}"`,
      track_name:        track?.name ?? trackId,
      xp_earned:         50,
      earned_at:         new Date().toISOString(),
    });
    console.log('[progress] Achievement result:', achieveErr?.message ?? 'success');

    // Upsert the skill_track summary row
    const allIds = await getCompletedLBIdsLocal(trackId);
    const total  = track?.sections.flatMap((s) => s.blocks).length ?? 0;
    await supabase.from('skill_tracks').upsert(
      {
        user_id:             userId,
        track_key:           trackId,
        track_name:          track?.name ?? trackId,
        track_emoji:         track?.emoji ?? '',
        total_lbs:           total,
        completed_lbs:       allIds.length,
        progress_percentage: total > 0 ? Math.round((allIds.length / total) * 100) : 0,
        updated_at:          new Date().toISOString(),
      },
      { onConflict: 'user_id,track_key' }
    );
  } catch {
    // Silently ignore network errors — data is already in AsyncStorage
  }
}
