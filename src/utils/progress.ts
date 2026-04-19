import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(trackId: string) {
  return `progress_${trackId}`;
}

export async function getCompletedLBIds(trackId: string): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(trackId));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export async function markLBCompleted(trackId: string, lbId: number): Promise<void> {
  try {
    const existing = await getCompletedLBIds(trackId);
    if (!existing.includes(lbId)) {
      await AsyncStorage.setItem(storageKey(trackId), JSON.stringify([...existing, lbId]));
    }
  } catch {}
}
