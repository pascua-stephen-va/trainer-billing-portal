import { useCallback, useEffect, useState } from 'react';
import {
  THEME_STORAGE_KEY,
  getNextManualTheme,
  getThemeStorageAction,
  parseStoredTheme,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '../utils/themeLogic';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function readStoredPreference(): ThemePreference {
  try {
    return parseStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'system';
  }
}

function readSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(COLOR_SCHEME_QUERY).matches;
}

export function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    readStoredPreference()
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    readSystemPrefersDark()
  );

  const resolvedTheme: ResolvedTheme = resolveTheme(preference, systemPrefersDark);
  const isSystem = preference === 'system';

  // Listen dynamically to OS prefers-color-scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia(COLOR_SCHEME_QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    // Sync immediately in case system preference changed before effect ran
    setSystemPrefersDark(media.matches);

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  // Apply resolved theme class & native color-scheme to documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Persist manual overrides in localStorage (or clear when returning to OS sync)
  useEffect(() => {
    try {
      const storageOp = getThemeStorageAction(preference);
      if (storageOp.action === 'set') {
        window.localStorage.setItem(THEME_STORAGE_KEY, storageOp.value);
      } else {
        window.localStorage.removeItem(THEME_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write errors in restricted contexts
    }
  }, [preference]);

  // Keep multiple open tabs synchronized
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        setPreference(parseStoredTheme(event.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((prevPref) => {
      const currentlyDark =
        prevPref === 'dark' || (prevPref === 'system' && readSystemPrefersDark());
      return getNextManualTheme(currentlyDark ? 'dark' : 'light');
    });
  }, []);

  const resetToSystem = useCallback(() => {
    setPreference('system');
  }, []);

  return {
    preference,
    resolvedTheme,
    isSystem,
    toggleTheme,
    resetToSystem,
  };
}
