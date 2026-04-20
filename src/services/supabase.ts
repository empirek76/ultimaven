import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// SecureStore has a 2 048-byte limit per entry; Supabase JWTs can exceed this.
// We chunk large values across sequentially-keyed entries.
const CHUNK_SIZE = 1900;

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}__count`);
    if (!countStr) return SecureStore.getItemAsync(key);
    const count = parseInt(countStr, 10);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}__${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}__${i}`, chunk))
    );
    await SecureStore.setItemAsync(`${key}__count`, String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}__count`);
    if (countStr) {
      const count = parseInt(countStr, 10);
      await Promise.all([
        ...Array.from({ length: count }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}__${i}`)
        ),
        SecureStore.deleteItemAsync(`${key}__count`),
      ]);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL       ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY  ?? '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage:            secureStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});
