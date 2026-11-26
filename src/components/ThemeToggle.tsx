import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  getNextIconRotation,
  type ResolvedTheme,
  type ThemePreference,
} from '../utils/themeLogic';

interface ThemeToggleProps {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  onToggle: () => void;
  onResetToSystem: () => void;
}

const ICON_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20,
  mass: 0.75,
};

export function ThemeToggle({
  preference,
  resolvedTheme,
  onToggle,
  onResetToSystem,
}: ThemeToggleProps) {
  const isDark = resolvedTheme === 'dark';
  const isSystem = preference === 'system';

  // Track cumulative 180deg rotations for every resolved theme transition (click OR OS change)
  const [rotationDeg, setRotationDeg] = useState(0);
  const prevResolvedRef = useRef<ResolvedTheme>(resolvedTheme);

  useEffect(() => {
    const prev = prevResolvedRef.current;
    if (prev !== resolvedTheme) {
      setRotationDeg((deg) => getNextIconRotation(deg, prev, resolvedTheme));
      prevResolvedRef.current = resolvedTheme;
    }
  }, [resolvedTheme]);

  const nextModeLabel = isDark ? 'light' : 'dark';
  const sourceLabel = isSystem ? 'following system' : 'manual override';

  return (
    <div className="inline-flex items-center gap-1.5">
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        data-testid="theme-toggle-button"
        data-theme-resolved={resolvedTheme}
        data-theme-source={isSystem ? 'system' : 'manual'}
        data-rotation-deg={rotationDeg}
        aria-label={`Switch to ${nextModeLabel} mode (currently ${resolvedTheme}, ${sourceLabel})`}
        title={`Switch to ${nextModeLabel} mode`}
        className="m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-surface-container)] hover:bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)]/70 pl-1.5 pr-3.5 py-1 text-xs font-bold text-[var(--md-on-surface)] shadow-2xs transition-colors cursor-pointer whitespace-nowrap select-none"
      >
        <span
          className={`relative flex h-7 w-7 items-center justify-center rounded-full overflow-hidden transition-colors duration-200 ${
            isDark
              ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]'
              : 'bg-amber-100 text-amber-700'
          }`}
          aria-hidden="true"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={resolvedTheme}
              data-testid="theme-toggle-icon"
              initial={{ rotate: -180, opacity: 0, scale: 0.55 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 180, opacity: 0, scale: 0.55 }}
              transition={ICON_SPRING}
              className="flex items-center justify-center"
            >
              {isDark ? (
                <Moon className="h-4 w-4" strokeWidth={2.25} />
              ) : (
                <Sun className="h-4 w-4" strokeWidth={2.25} />
              )}
            </motion.span>
          </AnimatePresence>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <span>{isDark ? 'Dark' : 'Light'}</span>
          {isSystem && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--md-primary)]">
              Auto
            </span>
          )}
        </span>
      </motion.button>

      <AnimatePresence initial={false}>
        {!isSystem && (
          <motion.button
            key="use-os-btn"
            type="button"
            initial={{ opacity: 0, scale: 0.85, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, x: -6 }}
            transition={{ type: 'spring', stiffness: 360, damping: 24 }}
            onClick={onResetToSystem}
            data-testid="theme-reset-system-button"
            aria-label="Reset theme to follow system color scheme"
            title="Follow system color scheme"
            className="m3-focus inline-flex items-center gap-1 rounded-full border border-[var(--md-outline-variant)]/70 bg-[var(--md-surface)] px-2.5 py-1.5 text-[11px] font-bold text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Monitor className="h-3 w-3" aria-hidden="true" />
            <span>Auto</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
