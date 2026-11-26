import { Plus, Trash2 } from 'lucide-react';
import type { BatchEntry, PaymentTermsId, TrancheId } from '../types/billing';
import {
  BATCH_PREFIX,
  MAX_BATCHES,
  PAYMENT_TERMS_OPTIONS,
  TRANCHE_META,
  calculateBatchStandardFee,
  computeDueDateIso,
  formatBatchCode,
  formatPHP,
  formatShortDate,
  resolveCohortTrancheMode,
} from '../utils/billingLogic';
import { DateRangeCalendar } from './DateRangeCalendar';

interface TrancheAndCycleCardProps {
  tranche: TrancheId;
  batches: BatchEntry[];
  ratePerHalf: number;
  invoiceNumber: string;
  issueDate: string;
  paymentTerms: PaymentTermsId;
  customDueDate: string;
  onSelectTranche: (tranche: TrancheId) => void;
  onAddBatch: () => void;
  onUpdateBatch: (id: string, patch: Partial<Omit<BatchEntry, 'id'>>) => void;
  onRemoveBatch: (id: string) => void;
  onInvoiceNumberChange: (value: string) => void;
  onIncrementSequence: () => void;
  onIssueDateChange: (value: string) => void;
  onPaymentTermsChange: (terms: PaymentTermsId) => void;
  onCustomDueDateChange: (date: string) => void;
}

const TRANCHE_ORDER: TrancheId[] = ['first', 'second', 'full'];

export function TrancheAndCycleCard({
  tranche,
  batches,
  ratePerHalf,
  invoiceNumber,
  issueDate,
  paymentTerms,
  customDueDate,
  onSelectTranche,
  onAddBatch,
  onUpdateBatch,
  onRemoveBatch,
  onInvoiceNumberChange,
  onIncrementSequence,
  onIssueDateChange,
  onPaymentTermsChange,
  onCustomDueDateChange,
}: TrancheAndCycleCardProps) {
  const canAddBatch = batches.length < MAX_BATCHES;
  const cohortMode = resolveCohortTrancheMode(batches, tranche);
  const isMixed = cohortMode === 'mixed';
  const computedDueIso = computeDueDateIso(issueDate, paymentTerms, customDueDate);

  return (
    <section
      id="section-tranche"
      aria-labelledby="heading-tranche"
      className="rounded-[28px] bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)]/70 p-5 sm:p-6 transition-colors"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2
          id="heading-tranche"
          className="font-display text-lg font-bold tracking-tight text-[var(--md-on-surface)]"
        >
          01. Billing Tranche, Batches &amp; Cycle
        </h2>
        <span className="text-xs font-semibold text-[var(--md-on-surface-variant)] tabular-nums">
          18 Days · 3 hrs/day · 54 Total Hrs
        </span>
      </div>
      <p className="text-xs sm:text-sm text-[var(--md-on-surface-variant)] mb-4">
        Apply a quick tranche preset across all cohorts, or configure staggered tranches, calendars, and price overrides per batch.
      </p>

      {isMixed && (
        <div
          data-testid="mixed-cohorts-notice"
          className="mb-3 rounded-2xl bg-[var(--md-secondary-container)]/70 px-3.5 py-2 text-xs font-semibold text-[var(--md-on-secondary-container)] flex flex-wrap items-center justify-between gap-1.5"
        >
          <span>Staggered cohorts active (suffix -MIX)</span>
          <span className="text-[11px] opacity-85">Click any preset below to sync all batches</span>
        </div>
      )}

      {/* Expressive M3 3-Way Segmented Tranche Preset Cards */}
      <div
        role="radiogroup"
        aria-label="Billing tranche milestone"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        {TRANCHE_ORDER.map((id) => {
          const meta = TRANCHE_META[id];
          const isSelected = !isMixed && cohortMode === id;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectTranche(id)}
              className={`m3-spring m3-focus relative overflow-hidden rounded-[20px] p-3.5 text-left transition-all duration-200 cursor-pointer border ${
                isSelected
                  ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] shadow-sm ring-2 ring-inset ring-[var(--md-primary)]/40 scale-[1.01]'
                  : 'border-[var(--md-outline-variant)]/80 bg-[var(--md-surface)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)] active:scale-[0.98]'
              }`}
            >
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isSelected
                      ? 'text-[var(--md-primary)]'
                      : 'text-[var(--md-on-surface-variant)]'
                  }`}
                >
                  {meta.shortLabel}
                </span>
                <span className="font-mono-num text-[11px] font-bold opacity-80">
                  {meta.invoiceSuffix}
                </span>
              </div>
              <div className="relative z-10 font-display text-base font-extrabold mt-1.5 leading-tight">
                {meta.dayRangeLabel}
              </div>
              <div
                className={`relative z-10 text-xs font-medium mt-1 tabular-nums ${
                  isSelected ? 'opacity-90' : 'text-[var(--md-on-surface-variant)]'
                }`}
              >
                {meta.days} days · {meta.hours} hrs ({meta.halves}{' '}
                {meta.halves === 1 ? 'half' : 'halves'})
              </div>
            </button>
          );
        })}
      </div>

      {/* Invoice Number + Issue Date + Payment Terms Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 mt-5 pt-5 border-t border-[var(--md-outline-variant)]/50">
        <div className="sm:col-span-7">
          <label
            htmlFor="invoice-number-input"
            className="block text-xs font-bold tracking-wide text-[var(--md-on-surface-variant)] mb-1.5"
          >
            Invoice Number (Date + Seq)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="invoice-number-input"
              type="text"
              value={invoiceNumber}
              onChange={(e) => onInvoiceNumberChange(e.target.value)}
              className="w-full min-w-0 rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3 py-2.5 text-xs font-bold font-mono-num text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
            <button
              type="button"
              onClick={onIncrementSequence}
              aria-label="Increment same-day invoice sequence"
              title="Increment same-day sequence (+1)"
              className="m3-spring m3-focus inline-flex items-center justify-center gap-0.5 rounded-full bg-[var(--md-secondary-container)] px-3 py-2.5 text-xs font-extrabold text-[var(--md-on-secondary-container)] hover:brightness-95 dark:hover:brightness-110 active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>1 #</span>
            </button>
          </div>
        </div>

        <div className="sm:col-span-5">
          <label
            htmlFor="issue-date-input"
            className="block text-xs font-bold tracking-wide text-[var(--md-on-surface-variant)] mb-1.5"
          >
            Invoice Issue Date
          </label>
          <input
            id="issue-date-input"
            type="date"
            value={issueDate}
            onChange={(e) => onIssueDateChange(e.target.value)}
            className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3 py-2.5 text-xs sm:text-sm font-medium text-[var(--md-on-surface)] dark:[color-scheme:dark] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
          />
        </div>

        {/* Payment Terms & Due Date */}
        <div className="sm:col-span-7">
          <label
            htmlFor="payment-terms-select"
            className="block text-xs font-bold tracking-wide text-[var(--md-on-surface-variant)] mb-1.5"
          >
            Payment Terms
          </label>
          <select
            id="payment-terms-select"
            value={paymentTerms}
            onChange={(e) => onPaymentTermsChange(e.target.value as PaymentTermsId)}
            className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3 py-2.5 text-xs sm:text-sm font-semibold text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all cursor-pointer"
          >
            {PAYMENT_TERMS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-5">
          <label
            htmlFor="due-date-input"
            className="block text-xs font-bold tracking-wide text-[var(--md-on-surface-variant)] mb-1.5"
          >
            Payment Due Date
          </label>
          {paymentTerms === 'custom' ? (
            <input
              id="due-date-input"
              type="date"
              value={customDueDate}
              onChange={(e) => onCustomDueDateChange(e.target.value)}
              className="w-full rounded-2xl border border-[var(--md-primary)]/60 bg-[var(--md-surface)] px-3 py-2.5 text-xs sm:text-sm font-medium text-[var(--md-on-surface)] dark:[color-scheme:dark] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          ) : (
            <div
              id="due-date-input"
              aria-live="polite"
              className="flex items-center justify-between rounded-2xl border border-[var(--md-outline-variant)]/70 bg-[var(--md-surface-container)]/60 px-3 py-2.5 text-xs sm:text-sm font-semibold text-[var(--md-on-surface)] tabular-nums"
            >
              <span>{formatShortDate(computedDueIso)}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-primary)]">
                Auto
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Batches Section (1 to 4 Batches with Per-Batch Tranche, Calendar From/To & Price Overwrite) */}
      <div className="mt-5 pt-5 border-t border-[var(--md-outline-variant)]/50">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-primary)]">
              Batches &amp; Covered Periods
            </span>
            <span className="ml-2 text-xs font-semibold text-[var(--md-on-surface-variant)] tabular-nums">
              {batches.length} of {MAX_BATCHES}
            </span>
          </div>

          <button
            type="button"
            onClick={onAddBatch}
            disabled={!canAddBatch}
            className={`m3-spring m3-focus inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              canAddBatch
                ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] hover:brightness-95 dark:hover:brightness-110 active:scale-95 cursor-pointer'
                : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] opacity-60 cursor-not-allowed'
            }`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {canAddBatch ? `Add Batch (${batches.length}/${MAX_BATCHES})` : 'Max 4 Batches'}
            </span>
          </button>
        </div>

        <div className="space-y-3" data-testid="batches-editor-list">
          {batches.map((batch, idx) => {
            const fullCode = formatBatchCode(batch.batchNumber);
            const batchCalc = calculateBatchStandardFee(ratePerHalf, batch.daysRendered);
            return (
              <div
                key={batch.id}
                data-testid={`batch-card-${idx + 1}`}
                className="animate-m3-enter rounded-2xl bg-[var(--md-surface)] border border-[var(--md-outline-variant)]/80 p-3.5 space-y-3"
              >
                {/* Batch Row Header + Batch Code Input */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--md-on-surface-variant)] shrink-0">
                      Batch {idx + 1}
                    </span>
                    <div className="flex items-stretch flex-1 min-w-0 max-w-[230px] rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] overflow-hidden focus-within:border-[var(--md-primary)] focus-within:ring-2 focus-within:ring-[var(--md-primary)]/20 transition-all">
                      <span className="flex items-center px-2.5 text-[11px] font-bold font-mono-num bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] border-r border-[var(--md-outline-variant)]/70 select-none whitespace-nowrap">
                        {BATCH_PREFIX}
                      </span>
                      <input
                        id={`batch-number-${batch.id}`}
                        type="text"
                        value={batch.batchNumber}
                        onChange={(e) =>
                          onUpdateBatch(batch.id, { batchNumber: e.target.value })
                        }
                        placeholder="04"
                        aria-label={`Batch ${idx + 1} code number`}
                        className="w-full min-w-0 bg-transparent px-2.5 py-1.5 text-xs font-bold font-mono-num text-[var(--md-on-surface)] outline-none"
                      />
                    </div>
                  </div>

                  {batches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveBatch(batch.id)}
                      aria-label={`Remove Batch ${fullCode}`}
                      className="m3-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[var(--md-error)] hover:bg-[var(--md-error-container)] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Per-Batch Tranche Selector (Staggered Cohort Support) */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-[var(--md-on-surface-variant)]">
                      Batch Tranche
                    </span>
                    <span className="text-[11px] font-mono-num font-bold text-[var(--md-primary)]">
                      {batch.daysRendered}d · {batchCalc.hoursRendered} hrs
                    </span>
                  </div>
                  <div
                    role="radiogroup"
                    aria-label={`Tranche for Batch ${idx + 1}`}
                    className="grid grid-cols-3 gap-1.5 rounded-full bg-[var(--md-surface-container)] p-1 border border-[var(--md-outline-variant)]/50"
                  >
                    {TRANCHE_ORDER.map((tId) => {
                      const tMeta = TRANCHE_META[tId];
                      const active = batch.tranche === tId;
                      return (
                        <button
                          key={tId}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() =>
                            onUpdateBatch(batch.id, {
                              tranche: tId,
                              daysRendered: tMeta.days,
                            })
                          }
                          className={`m3-focus rounded-full py-1 px-2 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-xs'
                              : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                          }`}
                        >
                          {tMeta.shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Covered Period Interactive Calendar (From / To) */}
                <div>
                  <span className="block text-[11px] font-semibold text-[var(--md-on-surface-variant)] mb-1.5">
                    Covered Period (Select Start &amp; End Day)
                  </span>
                  <DateRangeCalendar
                    idPrefix={`batch-cal-${idx + 1}`}
                    coveredFrom={batch.coveredFrom}
                    coveredTo={batch.coveredTo}
                    onChangeRange={(range) => onUpdateBatch(batch.id, range)}
                  />
                </div>

                {/* Per-Batch Price Overwrite Option */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--md-outline-variant)]/40">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--md-on-surface)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={batch.overridePriceEnabled}
                      onChange={(e) =>
                        onUpdateBatch(batch.id, {
                          overridePriceEnabled: e.target.checked,
                          overridePrice: e.target.checked
                            ? batch.overridePrice || batchCalc.standardFee
                            : batch.overridePrice,
                        })
                      }
                      aria-label={`Overwrite price for Batch ${fullCode}`}
                      className="h-3.5 w-3.5 rounded accent-[var(--md-primary)] cursor-pointer"
                    />
                    <span>Overwrite price</span>
                  </label>

                  {batch.overridePriceEnabled ? (
                    <div className="relative w-36">
                      <label
                        htmlFor={`batch-override-price-${batch.id}`}
                        className="sr-only"
                      >
                        Custom price for Batch {fullCode}
                      </label>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono-num text-[var(--md-primary)]"
                      >
                        ₱
                      </span>
                      <input
                        id={`batch-override-price-${batch.id}`}
                        type="number"
                        min={0}
                        step={100}
                        value={batch.overridePrice}
                        onChange={(e) =>
                          onUpdateBatch(batch.id, {
                            overridePrice: Math.max(0, parseFloat(e.target.value) || 0),
                          })
                        }
                        aria-label={`Custom price for Batch ${fullCode}`}
                        className="w-full rounded-xl border-2 border-[var(--md-primary)]/60 bg-[var(--md-surface-container-low)] pl-6 pr-2.5 py-1.5 text-right text-xs font-bold font-mono-num text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] transition-colors"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-mono-num font-semibold text-[var(--md-on-surface-variant)]">
                      Standard: {formatPHP(batchCalc.standardFee)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
