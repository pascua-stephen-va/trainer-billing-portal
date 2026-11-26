import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  formatShortDate,
  normalizeDateRange,
  parseIsoDateUTC,
} from '../utils/billingLogic';

interface DateRangeCalendarProps {
  idPrefix: string;
  coveredFrom: string;
  coveredTo: string;
  onChangeRange: (next: { coveredFrom: string; coveredTo: string }) => void;
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

function toIsoDate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function DateRangeCalendar({
  idPrefix,
  coveredFrom,
  coveredTo,
  onChangeRange,
}: DateRangeCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<'from' | 'to'>('from');

  const initialMonth = useMemo(() => {
    const parsed = parseIsoDateUTC(coveredFrom) ?? parseIsoDateUTC(coveredTo);
    if (parsed) {
      return { year: parsed.getUTCFullYear(), month: parsed.getUTCMonth() };
    }
    return { year: 2026, month: 10 }; // Nov 2026
  }, [coveredFrom, coveredTo]);

  const [viewYear, setViewYear] = useState(initialMonth.year);
  const [viewMonth, setViewMonth] = useState(initialMonth.month);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const openForField = (field: 'from' | 'to') => {
    setActiveField(field);
    const targetIso = field === 'from' ? coveredFrom : coveredTo;
    const parsed = parseIsoDateUTC(targetIso);
    if (parsed) {
      setViewYear(parsed.getUTCFullYear());
      setViewMonth(parsed.getUTCMonth());
    }
    setIsOpen(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (iso: string) => {
    if (activeField === 'from') {
      const nextTo = coveredTo && iso > coveredTo ? iso : coveredTo || iso;
      onChangeRange({ coveredFrom: iso, coveredTo: nextTo });
      setActiveField('to');
    } else {
      const normalized = normalizeDateRange(coveredFrom || iso, iso);
      onChangeRange(normalized);
      setIsOpen(false);
    }
  };

  const monthTitle = useMemo(() => {
    const dt = new Date(Date.UTC(viewYear, viewMonth, 1));
    return dt.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }, [viewYear, viewMonth]);

  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const cells: Array<{ day: number; iso: string } | null> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, iso: toIsoDate(viewYear, viewMonth, day) });
    }
    return cells;
  }, [viewYear, viewMonth]);

  return (
    <div ref={containerRef} className="relative">
      {/* From / To Trigger Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          id={`${idPrefix}-from`}
          type="button"
          onClick={() => openForField('from')}
          aria-expanded={isOpen && activeField === 'from'}
          aria-label={`Select covered period start date (From), currently ${formatShortDate(coveredFrom)}`}
          className={`m3-focus flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
            isOpen && activeField === 'from'
              ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)]/50 ring-2 ring-[var(--md-primary)]/20'
              : 'border-[var(--md-outline-variant)] bg-[var(--md-surface)] hover:bg-[var(--md-surface-container)]'
          }`}
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
              From (Start)
            </span>
            <span className="block text-xs font-bold font-mono-num text-[var(--md-on-surface)] truncate mt-0.5">
              {formatShortDate(coveredFrom)}
            </span>
          </div>
          <Calendar className="h-3.5 w-3.5 text-[var(--md-primary)] shrink-0" aria-hidden="true" />
        </button>

        <button
          id={`${idPrefix}-to`}
          type="button"
          onClick={() => openForField('to')}
          aria-expanded={isOpen && activeField === 'to'}
          aria-label={`Select covered period end date (To), currently ${formatShortDate(coveredTo)}`}
          className={`m3-focus flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
            isOpen && activeField === 'to'
              ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)]/50 ring-2 ring-[var(--md-primary)]/20'
              : 'border-[var(--md-outline-variant)] bg-[var(--md-surface)] hover:bg-[var(--md-surface-container)]'
          }`}
        >
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
              To (End)
            </span>
            <span className="block text-xs font-bold font-mono-num text-[var(--md-on-surface)] truncate mt-0.5">
              {formatShortDate(coveredTo)}
            </span>
          </div>
          <Calendar className="h-3.5 w-3.5 text-[var(--md-primary)] shrink-0" aria-hidden="true" />
        </button>
      </div>

      {/* Interactive Calendar Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Covered period calendar picker"
          className="animate-m3-enter mt-2 rounded-[22px] border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-3.5 shadow-xl z-30"
        >
          {/* Mode Tabs (From vs To) + Close */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div
              role="tablist"
              aria-label="Choose start or end date"
              className="grid grid-cols-2 gap-1 rounded-full bg-[var(--md-surface-container)] p-0.5 flex-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeField === 'from'}
                onClick={() => setActiveField('from')}
                className={`m3-focus rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  activeField === 'from'
                    ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                    : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                }`}
              >
                From: {formatShortDate(coveredFrom)}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeField === 'to'}
                onClick={() => setActiveField('to')}
                className={`m3-focus rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  activeField === 'to'
                    ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)]'
                    : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                }`}
              >
                To: {formatShortDate(coveredTo)}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close calendar"
              className="m3-focus flex h-7 w-7 items-center justify-center rounded-full text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)] cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Month Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="m3-focus flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="font-display text-sm font-bold text-[var(--md-on-surface)]">
              {monthTitle}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="m3-focus flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_LABELS.map((w) => (
              <span
                key={w}
                className="text-[10px] font-bold uppercase text-[var(--md-on-surface-variant)] py-1"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="h-8" />;
              }

              const isStart = cell.iso === coveredFrom;
              const isEnd = cell.iso === coveredTo;
              const isInRange =
                Boolean(coveredFrom) &&
                Boolean(coveredTo) &&
                cell.iso > coveredFrom &&
                cell.iso < coveredTo;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => handleSelectDay(cell.iso)}
                  aria-label={`Select ${formatShortDate(cell.iso)} as ${
                    activeField === 'from' ? 'start date' : 'end date'
                  }`}
                  aria-pressed={isStart || isEnd}
                  className={`m3-focus h-8 w-full text-xs font-mono-num font-semibold transition-all cursor-pointer ${
                    isStart || isEnd
                      ? 'rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] font-extrabold shadow-xs'
                      : isInRange
                        ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] rounded-md'
                        : 'rounded-full text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)]'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <p className="mt-2.5 text-[11px] text-center text-[var(--md-on-surface-variant)]">
            {activeField === 'from'
              ? 'Click a day to set the start (From) date'
              : 'Click a day to set the end (To) date'}
          </p>
        </div>
      )}
    </div>
  );
}
