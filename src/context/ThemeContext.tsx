import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemePreference = 'light' | 'dark' | 'auto';
export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
  background:    string;
  surface:       string;
  surface2:      string;
  card:          string;
  inputBg:       string;
  text:          string;
  textSecondary: string;
  border:        string;
  // Shared (same in both themes)
  primary:       string;
  primaryLight:  string;
  coral:         string;
  gold:          string;
  green:         string;
  navy:          string;
}

// ─── Palettes ─────────────────────────────────────────────────────────────────

const DARK: ThemeColors = {
  background:    '#0D0D1A',
  surface:       '#1E1E38',
  surface2:      '#252545',
  card:          '#1E1E38',
  inputBg:       '#1E1E38',
  text:          '#FFFFFF',
  textSecondary: '#8B8BAE',
  border:        '#2A2A4A',
  primary:       '#6C47FF',
  primaryLight:  '#8B6FFF',
  coral:         '#FF6B6B',
  gold:          '#FFD93D',
  green:         '#6BCB77',
  navy:          '#0D0D1A',
};

const LIGHT: ThemeColors = {
  background:    '#F5F5FF',
  surface:       '#FFFFFF',
  surface2:      '#F0F0FA',
  card:          '#FFFFFF',
  inputBg:       '#F0F0FA',
  text:          '#0D0D1A',
  textSecondary: '#6B6B8A',
  border:        '#E0E0F0',
  primary:       '#6C47FF',
  primaryLight:  '#8B6FFF',
  coral:         '#FF6B6B',
  gold:          '#FFD93D',
  green:         '#6BCB77',
  navy:          '#0D0D1A',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THEME_KEY = 'theme_preference';

export const getAutoTheme = (): ThemeName => {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colors:             ThemeColors;
  themePreference:    ThemePreference;
  setThemePreference: (pref: ThemePreference) => Promise<void>;
  isDark:             boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>('auto');
  const [resolved,   setResolved]   = useState<ThemeName>(getAutoTheme());
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        setPreference(saved);
        setResolved(saved === 'auto' ? getAutoTheme() : saved);
      }
    });
  }, []);

  useEffect(() => {
    if (preference !== 'auto') return;
    const id = setInterval(() => {
      const next = getAutoTheme();
      setResolved((prev) => {
        if (prev === next) return prev;
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        return next;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [preference]);

  const setThemePreference = useCallback(async (pref: ThemePreference): Promise<void> => {
    Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setPreference(pref);
      setResolved(pref === 'auto' ? getAutoTheme() : pref);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
    await AsyncStorage.setItem(THEME_KEY, pref);
  }, []);

  const colors = resolved === 'light' ? LIGHT : DARK;
  const isDark  = resolved === 'dark';

  const value = useMemo<ThemeContextValue>(() => ({
    colors,
    themePreference: preference,
    setThemePreference,
    isDark,
  }), [colors, preference, setThemePreference, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      <Animated.View style={{ flex: 1, opacity }}>
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
