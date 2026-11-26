export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'va-l3-trainer-billing-theme-v1';

/**
 * Parses a raw value from localStorage into a valid ThemePreference.
 * Accepts legacy 'auto' values as 'system', and falls back to 'system' when unset/invalid.
 */
export function parseStoredTheme(raw: string | null | undefined): ThemePreference {
  if (raw === 'light' || raw === 'dark') {
    return raw;
  }
  return 'system';
}

/**
 * Resolves the active light/dark color scheme from the user's preference and OS media query.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemPrefersDark ? 'dark' : 'light';
}

/**
 * Computes the next manual override when the user clicks the theme toggle button.
 * Always flips away from the currently visible resolved theme.
 */
export function getNextManualTheme(currentResolved: ResolvedTheme): 'light' | 'dark' {
  return currentResolved === 'dark' ? 'light' : 'dark';
}

/**
 * Computes the next rotation angle (in multiples of 180deg) whenever the resolved theme switches.
 */
export function getNextIconRotation(
  currentRotationDeg: number,
  previousResolved: ResolvedTheme,
  nextResolved: ResolvedTheme
): number {
  if (previousResolved === nextResolved) {
    return currentRotationDeg;
  }
  return currentRotationDeg + 180;
}

/**
 * Returns the storage action for persisting a ThemePreference.
 * Explicit 'light'/'dark' overrides are written to localStorage;
 * returning to 'system' clears the manual override key so OS preference governs initial load.
 */
export function getThemeStorageAction(
  preference: ThemePreference
): { action: 'set'; value: 'light' | 'dark' } | { action: 'remove' } {
  if (preference === 'light' || preference === 'dark') {
    return { action: 'set', value: preference };
  }
  return { action: 'remove' };
}
