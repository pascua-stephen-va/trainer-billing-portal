import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type { LineItem, TaxRate } from '../types/billing';
import {
  DAYS_PER_HALF,
  HOURS_PER_DAY,
  QUICK_ADD_PRESETS,
  TOTAL_PROGRAM_DAYS,
  formatHalvesLabel,
  formatPHP,
} from '../utils/billingLogic';

interface RatesAndItemsCardProps {
  ratePerHalf: number;
  daysRendered: number;
  standardBatchFee: number;
  batchCount: number;
  totalHoursRendered: number;
  isMixedTranches: boolean;
  taxRate: TaxRate;
  lineItems: LineItem[];
  onRatePerHalfChange: (amount: number) => void;
  onDaysRenderedChange: (days: number) => void;
  onTaxRateChange: (rate: TaxRate) => void;
  onAddPresetItem: (preset: {
    description: string;
    referenceNote: string;
    amount: number;
    isReimbursement: boolean;
  }) => void;
  onAddCustomItem: () => void;
  onUpdateItem: (id: string, patch: Partial<Omit<LineItem, 'id'>>) => void;
  onDeleteItem: (id: string) => void;
}

const EWT_OPTIONS: ReadonlyArray<{ value: TaxRate; label: string; hint: string }> = [
  { value: 0, label: '0% Exempt', hint: 'Sworn Declaration' },
  { value: 0.05, label: '5% EWT', hint: 'Non-VAT < ₱3M' },
  { value: 0.1, label: '10% EWT', hint: 'Standard Rate' },
];

export function RatesAndItemsCard({
  ratePerHalf,
  daysRendered,
  standardBatchFee,
  batchCount,
  totalHoursRendered,
  isMixedTranches,
  taxRate,
  lineItems,
  onRatePerHalfChange,
  onDaysRenderedChange,
  onTaxRateChange,
  onAddPresetItem,
  onAddCustomItem,
  onUpdateItem,
  onDeleteItem,
}: RatesAndItemsCardProps) {
  const computedHours = daysRendered * HOURS_PER_DAY;
  const halvesMultiplier = daysRendered / DAYS_PER_HALF;

  return (
    <section
      id="section-rates"
      aria-labelledby="heading-rates"
      className="rounded-[28px] bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)]/70 p-5 sm:p-6 transition-colors"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2
          id="heading-rates"
          className="font-display text-lg font-bold tracking-tight text-[var(--md-on-surface)]"
        >
          03. Rate per Half, Reimbursements &amp; EWT
        </h2>
        <span className="font-mono-num text-xs font-bold text-[var(--md-on-surface-variant)]">
          PHP (₱)
        </span>
      </div>
      <p className="text-xs sm:text-sm text-[var(--md-on-surface-variant)] mb-5">
        Set your standard Rate per Half (9 days · 27 hours) and itemize tax-exempt reimbursements.
      </p>

      {/* Rate per Half & Days Rendered */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="rate-per-half-input"
            className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
          >
            Rate per Half (9 Days · 27 hrs)
          </label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold font-mono-num text-[var(--md-on-surface-variant)]"
            >
              ₱
            </span>
            <input
              id="rate-per-half-input"
              type="number"
              min={0}
              step={500}
              value={ratePerHalf}
              onChange={(e) =>
                onRatePerHalfChange(Math.max(0, parseFloat(e.target.value) || 0))
              }
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] pl-8 pr-3.5 py-2.5 text-sm font-bold font-mono-num text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          </div>
          <p className="text-[11px] text-[var(--md-on-surface-variant)] mt-1.5 tabular-nums">
            {isMixedTranches ? (
              <>
                1 Half ={' '}
                <span className="font-mono-num font-bold text-[var(--md-on-surface)]">
                  {formatPHP(ratePerHalf)}
                </span>{' '}
                · Full Term ={' '}
                <span className="font-mono-num font-bold text-[var(--md-on-surface)]">
                  {formatPHP(ratePerHalf * 2)}
                </span>
              </>
            ) : (
              <>
                {formatHalvesLabel(halvesMultiplier)} per batch ={' '}
                <span className="font-mono-num font-bold text-[var(--md-on-surface)]">
                  {formatPHP(standardBatchFee)}
                </span>
                {batchCount > 1 ? ` · ${batchCount} batches active` : ''}
              </>
            )}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="days-rendered-input"
              className="block text-xs font-semibold text-[var(--md-on-surface-variant)]"
            >
              {isMixedTranches
                ? 'Combined Hours (Staggered)'
                : `Days Rendered (1–${TOTAL_PROGRAM_DAYS})`}
            </label>
            <span className="text-xs font-bold font-mono-num text-[var(--md-primary)]">
              {isMixedTranches ? `${totalHoursRendered} hrs` : `${computedHours} hrs`}
            </span>
          </div>

          {isMixedTranches ? (
            <div
              id="days-rendered-input"
              className="rounded-2xl border border-[var(--md-outline-variant)]/70 bg-[var(--md-surface-container)]/60 px-3.5 py-2.5 text-xs font-semibold text-[var(--md-on-surface)] tabular-nums"
            >
              {batchCount} staggered cohorts · {totalHoursRendered} total hrs
            </div>
          ) : (
            <input
              id="days-rendered-input"
              type="number"
              min={1}
              max={TOTAL_PROGRAM_DAYS}
              value={daysRendered}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                const clamped = Number.isNaN(parsed)
                  ? 0
                  : Math.max(0, Math.min(TOTAL_PROGRAM_DAYS, parsed));
                onDaysRenderedChange(clamped);
              }}
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm font-bold font-mono-num text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          )}

          <p className="text-[11px] text-[var(--md-on-surface-variant)] mt-1.5 tabular-nums">
            {isMixedTranches
              ? 'Adjust each batch tranche in Section 01 above'
              : '9 days = 1 Half · 18 days = 2 Halves (Full Term)'}
          </p>
        </div>
      </div>

      {/* Hairline Divider */}
      <hr className="my-5 border-[var(--md-outline-variant)]/50" />

      {/* Line Items & Reimbursements */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
            Line Items &amp; Reimbursements
          </span>
          <span className="text-xs text-[var(--md-tertiary)] font-semibold">
            Tax-free items bypass EWT
          </span>
        </div>

        {/* Expressive Pill Quick-Add Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_ADD_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() =>
                onAddPresetItem({
                  description: preset.description,
                  referenceNote: preset.referenceNote,
                  amount: preset.amount,
                  isReimbursement: preset.isReimbursement,
                })
              }
              className={`m3-spring m3-focus inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap ${
                preset.isReimbursement
                  ? 'bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)] hover:brightness-95 dark:hover:brightness-110'
                  : 'bg-[var(--md-secondary-container)] text-[var(--md-on-secondary-container)] hover:brightness-95 dark:hover:brightness-110'
              }`}
            >
              <span>{preset.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={onAddCustomItem}
            className="m3-spring m3-focus inline-flex items-center gap-1 rounded-full border border-[var(--md-outline)]/60 bg-[var(--md-surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Custom Item</span>
          </button>
        </div>

        {/* Dynamic Line Item Rows */}
        <div className="space-y-3" data-testid="line-items-editor-list">
          {lineItems.length === 0 ? (
            <div className="animate-m3-enter rounded-2xl border border-dashed border-[var(--md-outline-variant)] bg-[var(--md-surface)]/70 px-4 py-5 text-center">
              <p className="text-xs font-medium text-[var(--md-on-surface-variant)]">
                No additional reimbursements or allowances attached.
              </p>
              <p className="text-[11px] text-[var(--md-on-surface-variant)]/80 mt-1">
                Use a quick-add chip above to include Zoom Pro, VA tools, or allowances.
              </p>
            </div>
          ) : (
            lineItems.map((item, idx) => (
              <div
                key={item.id}
                className="animate-m3-enter rounded-2xl bg-[var(--md-surface)] border border-[var(--md-outline-variant)]/80 p-3.5 space-y-2.5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`item-desc-${item.id}`} className="sr-only">
                      Item {idx + 1} description
                    </label>
                    <input
                      id={`item-desc-${item.id}`}
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        onUpdateItem(item.id, { description: e.target.value })
                      }
                      placeholder="Item or subscription description"
                      className="w-full rounded-xl border border-[var(--md-outline-variant)]/80 bg-[var(--md-surface-container-low)] px-3 py-2 text-xs sm:text-sm font-semibold text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] transition-colors"
                    />
                  </div>

                  <div className="w-28 sm:w-32 shrink-0 relative">
                    <label htmlFor={`item-amount-${item.id}`} className="sr-only">
                      Item {idx + 1} PHP amount
                    </label>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono-num text-[var(--md-on-surface-variant)]"
                    >
                      ₱
                    </span>
                    <input
                      id={`item-amount-${item.id}`}
                      type="number"
                      min={0}
                      step={10}
                      value={item.amount}
                      onChange={(e) =>
                        onUpdateItem(item.id, {
                          amount: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full rounded-xl border border-[var(--md-outline-variant)]/80 bg-[var(--md-surface-container-low)] pl-6 pr-2.5 py-2 text-right text-xs sm:text-sm font-bold font-mono-num text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] transition-colors"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Delete ${item.description || `item ${idx + 1}`}`}
                    className="m3-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--md-error)] hover:bg-[var(--md-error-container)] transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`item-ref-${item.id}`} className="sr-only">
                      Item {idx + 1} receipt reference note
                    </label>
                    <input
                      id={`item-ref-${item.id}`}
                      type="text"
                      value={item.referenceNote}
                      onChange={(e) =>
                        onUpdateItem(item.id, { referenceNote: e.target.value })
                      }
                      placeholder="Official receipt # or proof reference..."
                      className="w-full rounded-xl border border-[var(--md-outline-variant)]/60 bg-transparent px-3 py-1.5 text-xs text-[var(--md-on-surface-variant)] outline-none focus:border-[var(--md-primary)] transition-colors"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 self-end sm:self-auto rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer select-none transition-colors shrink-0 border border-transparent hover:border-[var(--md-outline-variant)]/60 bg-[var(--md-surface-container)]">
                    <input
                      type="checkbox"
                      checked={item.isReimbursement}
                      onChange={(e) =>
                        onUpdateItem(item.id, {
                          isReimbursement: e.target.checked,
                        })
                      }
                      aria-label={`Reimb. (Tax-Free) for ${item.description || `item ${idx + 1}`}`}
                      className="h-3.5 w-3.5 rounded accent-[var(--md-tertiary)] cursor-pointer"
                    />
                    <span
                      className={
                        item.isReimbursement
                          ? 'text-[var(--md-tertiary)] inline-flex items-center gap-1'
                          : 'text-[var(--md-on-surface-variant)]'
                      }
                    >
                      {item.isReimbursement && (
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      Reimb. (Tax-Free)
                    </span>
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hairline Divider */}
      <hr className="my-5 border-[var(--md-outline-variant)]/50" />

      {/* Expanded Withholding Tax (EWT) Segmented Control */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
            Expanded Withholding Tax (EWT)
          </span>
          <span className="text-xs font-medium text-[var(--md-on-surface-variant)]">
            Taxable fee only · {formatPHP(ratePerHalf)}/half
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Expanded Withholding Tax rate"
          className="grid grid-cols-3 gap-2"
        >
          {EWT_OPTIONS.map((opt) => {
            const active = taxRate === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onTaxRateChange(opt.value)}
                className={`m3-spring m3-focus rounded-2xl px-3 py-2.5 text-left transition-all duration-200 cursor-pointer border ${
                  active
                    ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]'
                    : 'border-[var(--md-outline-variant)]/80 bg-[var(--md-surface)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)]'
                }`}
              >
                <div className="text-xs sm:text-sm font-extrabold font-mono-num">
                  {opt.label}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5 truncate">
                  {opt.hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
