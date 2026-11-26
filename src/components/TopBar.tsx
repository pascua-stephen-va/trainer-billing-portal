import { Printer } from 'lucide-react';

interface TopBarProps {
  onPrint: () => void;
}

export function TopBar({ onPrint }: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-[var(--md-outline-variant)]/70 bg-[var(--md-surface)]/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line display wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-extrabold tracking-tight text-[var(--md-on-surface)] whitespace-nowrap shrink-0 m3-focus rounded-lg"
        >
          Trainer Billing Portal
        </a>

        {/* Zone 2: Clean single-line section links */}
        <nav
          aria-label="Billing sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--md-on-surface-variant)]"
        >
          <a
            href="#section-tranche"
            className="hover:text-[var(--md-primary)] transition-colors whitespace-nowrap shrink-0 m3-focus rounded"
          >
            Tranche
          </a>
          <a
            href="#section-parties"
            className="hover:text-[var(--md-primary)] transition-colors whitespace-nowrap shrink-0 m3-focus rounded"
          >
            Parties
          </a>
          <a
            href="#section-rates"
            className="hover:text-[var(--md-primary)] transition-colors whitespace-nowrap shrink-0 m3-focus rounded"
          >
            Rates &amp; Items
          </a>
          <a
            href="#section-remittance"
            className="hover:text-[var(--md-primary)] transition-colors whitespace-nowrap shrink-0 m3-focus rounded"
          >
            Remittance
          </a>
          <a
            href="#section-preview"
            className="hover:text-[var(--md-primary)] transition-colors whitespace-nowrap shrink-0 m3-focus rounded"
          >
            Invoice Sheet
          </a>
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrint}
            className="m3-spring m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-primary)] px-5 py-2.5 text-xs sm:text-sm font-bold text-[var(--md-on-primary)] shadow-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}
