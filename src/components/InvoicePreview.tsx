import { Building2, QrCode, ShieldCheck } from 'lucide-react';
import type { BillingState, BillingTotals } from '../types/billing';
import {
  PROGRAM_NAME,
  TOTAL_PROGRAM_DAYS,
  TOTAL_PROGRAM_HOURS,
  TRANCHE_META,
  computeDueDateIso,
  formatBatchCodeList,
  formatHalvesLabel,
  formatIssueDateLong,
  formatPHP,
  getBankOption,
  getDayBlockStatus,
  getDisplayBankName,
  getEffectiveInvoiceNumber,
  getPaymentTermsShortLabel,
  resolveCohortTrancheMode,
} from '../utils/billingLogic';

interface InvoicePreviewProps {
  state: BillingState;
  totals: BillingTotals;
}

const ALL_DAYS = Array.from({ length: TOTAL_PROGRAM_DAYS }, (_, i) => i + 1);

export function InvoicePreview({ state, totals }: InvoicePreviewProps) {
  const cohortMode = resolveCohortTrancheMode(state.batches, state.tranche);
  const isMixed = cohortMode === 'mixed';
  const uniformMeta = TRANCHE_META[isMixed ? state.tranche : cohortMode];

  const invoiceNumber = getEffectiveInvoiceNumber(state);
  const batchCodeList = formatBatchCodeList(state.batches);
  const formattedDate = formatIssueDateLong(state.issueDate);
  const dueDateIso = computeDueDateIso(
    state.issueDate,
    state.paymentTerms,
    state.customDueDate
  );
  const formattedDueDate = formatIssueDateLong(dueDateIso);
  const termsShortLabel = getPaymentTermsShortLabel(state.paymentTerms);

  const displayBankName = getDisplayBankName(state.bank);
  const bankMeta = getBankOption(state.bank.bankPreset);
  const taxPercentLabel = `${Math.round(state.taxRate * 100)}%`;

  const primaryCoveredLabel =
    totals.batchFees.length === 1
      ? totals.batchFees[0].coveredLabel
      : `${totals.batchFees.length} Batches (See Schedule Below)`;

  const isDensePrint = state.batches.length >= 3 || state.lineItems.length >= 3;

  return (
    <div id="section-preview" className="w-full">
      {/* Subtle non-print label row */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
          Live A4 Statement of Account Preview
        </span>
        <span className="text-xs font-semibold text-[var(--md-primary)] tabular-nums">
          {isMixed
            ? 'Staggered Cohorts (Mixed Halves)'
            : `${uniformMeta.shortLabel} (${uniformMeta.dayRangeLabel})`}{' '}
          · {state.batches.length} {state.batches.length === 1 ? 'Batch' : 'Batches'}
        </span>
      </div>

      {/* Crisp White Printable A4 Sheet (always white even in High-Contrast Dark Mode) */}
      <article
        data-testid="invoice-sheet"
        data-dense-print={isDensePrint ? 'true' : undefined}
        aria-label="Statement of Account Invoice Preview"
        className="print-only-sheet rounded-[28px] bg-white text-slate-900 border border-slate-200/90 shadow-lg p-6 sm:p-9 lg:p-10"
      >
        {/* 1. STATEMENT HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start gap-5 pb-6 border-b-2 border-slate-900">
          <div className="space-y-1 min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#3b49df]">
              Statement of Account · Trainer Billing Invoice
            </p>
            <h1 className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-950 leading-tight">
              {state.trainerName || 'Trainer Name'}
            </h1>
            <p className="text-xs font-semibold text-slate-700">
              Lead Competency Trainer · {PROGRAM_NAME}
            </p>
            <p className="text-xs text-slate-500 pt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                TIN:{' '}
                <span className="font-mono-num font-semibold text-slate-700">
                  {state.trainerTin || '—'}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600">{state.trainerContact || '—'}</span>
            </p>
          </div>

          <div className="sm:text-right shrink-0 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Invoice Number
            </p>
            <p
              data-testid="preview-invoice-number"
              className="font-mono-num text-base sm:text-lg font-extrabold text-slate-950"
            >
              {invoiceNumber}
            </p>
            <p className="text-xs text-slate-600 pt-0.5">
              <span className="text-slate-400 font-medium">Issued:</span>{' '}
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </p>
            <p className="text-xs text-slate-600">
              <span className="text-slate-400 font-medium">Due:</span>{' '}
              <span
                data-testid="preview-due-date"
                className="font-semibold text-slate-900"
              >
                {formattedDueDate} ({termsShortLabel})
              </span>
            </p>
            <p className="text-xs text-slate-600">
              <span className="text-slate-400 font-medium">
                {state.batches.length > 1 ? 'Batch Codes:' : 'Batch Code:'}
              </span>{' '}
              <span
                data-testid="preview-batch-code"
                className="font-mono-num font-bold text-slate-900"
              >
                {batchCodeList}
              </span>
            </p>
          </div>
        </header>

        {/* 2. BILLED TO & PROGRAM SCHEDULE */}
        <div className="print-section-pad grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-slate-200">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Billed To (Training Provider)
            </p>
            <p className="text-sm font-bold text-slate-950 leading-snug">
              {state.clientName || 'Training Institution'}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {state.clientAddress || '—'}
            </p>
            <p className="text-xs text-slate-700 pt-1.5">
              <span className="font-bold text-slate-500">Attention:</span>{' '}
              <span className="font-semibold text-slate-900">
                {state.clientAttention || '—'}
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-[#f4f5fb] p-4 border border-slate-200/70 space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#3b49df]">
              Program &amp; Schedule Summary
            </p>
            <p className="text-xs font-extrabold text-slate-950">{PROGRAM_NAME}</p>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Program Load:</dt>
                <dd className="font-semibold text-slate-900 text-right tabular-nums">
                  {TOTAL_PROGRAM_DAYS} Days · 3 hrs/day ({TOTAL_PROGRAM_HOURS} hrs)
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Billing Tranche:</dt>
                <dd
                  data-testid="preview-tranche-label"
                  className="font-bold text-[#3b49df] text-right"
                >
                  {isMixed
                    ? 'Staggered Cohorts (Mixed Halves)'
                    : uniformMeta.fullLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Covered Period:</dt>
                <dd
                  data-testid="preview-covered-summary"
                  className="font-semibold text-slate-900 text-right"
                >
                  {primaryCoveredLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Class Size:</dt>
                <dd className="font-semibold text-slate-900 text-right tabular-nums">
                  {state.traineeCount} {state.traineeCount === 1 ? 'Trainee' : 'Trainees'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* 3. 18-DAY VISUAL PROGRESS BAR (Single or Stacked per Staggered Cohort) */}
        <div className="print-section-pad print-avoid-break py-4 border-b border-slate-200">
          {!isMixed ? (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs mb-2.5">
                <span className="font-bold text-slate-800">
                  18-Day Training Cycle Progress
                </span>
                <span className="font-bold text-[#3b49df] text-[11px] tabular-nums">
                  {uniformMeta.progressSummary}
                </span>
              </div>

              <div
                data-testid="progress-18-days"
                role="img"
                aria-label={`18-day training progress: ${uniformMeta.progressSummary}`}
                className="grid gap-1 rounded-full bg-slate-100 p-1 border border-slate-200/80"
                style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
              >
                {ALL_DAYS.map((day) => {
                  const activeDays = totals.batchFees[0]?.daysRendered ?? state.daysRendered;
                  const status = getDayBlockStatus(day, uniformMeta.id, activeDays);
                  const colorClass =
                    status === 'active'
                      ? 'bg-[#3b49df]'
                      : status === 'completed'
                        ? 'bg-[#0b7a53]'
                        : 'bg-slate-200';

                  return (
                    <div
                      key={day}
                      title={`Day ${day} (${status})`}
                      data-day={day}
                      data-status={status}
                      className={`m3-spring h-2.5 rounded-full transition-all duration-300 ${colorClass} ${
                        status === 'active'
                          ? 'scale-y-100 opacity-100'
                          : status === 'completed'
                            ? 'scale-y-90 opacity-100'
                            : 'scale-y-85 opacity-65'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-medium tabular-nums">
                <span>Day 1 (Start)</span>
                <span>Day 9 (27 hrs · 1st Half Cutoff)</span>
                <span>Day 18 (54 hrs · Completion)</span>
              </div>
            </>
          ) : (
            <div data-testid="progress-18-days" className="space-y-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                <span className="font-bold text-slate-800">
                  18-Day Training Cycle Progress (By Cohort)
                </span>
                <span className="font-bold text-[#3b49df] text-[11px] tabular-nums">
                  {totals.batchFees.length} Staggered Batches · {totals.hoursRendered} Total Hrs
                </span>
              </div>

              <div className="space-y-2">
                {totals.batchFees.map((bf) => {
                  const bMeta = TRANCHE_META[bf.tranche];
                  return (
                    <div key={bf.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-mono-num font-bold text-slate-800">
                          {bf.batchCode}
                        </span>
                        <span className="font-semibold text-[#3b49df] tabular-nums">
                          {bMeta.shortLabel} ({bMeta.dayRangeLabel} · {bf.hoursRendered} hrs)
                        </span>
                      </div>
                      <div
                        role="img"
                        aria-label={`${bf.batchCode}: ${bMeta.progressSummary}`}
                        className="grid gap-1 rounded-full bg-slate-100 p-0.5 border border-slate-200/80"
                        style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
                      >
                        {ALL_DAYS.map((day) => {
                          const status = getDayBlockStatus(day, bf.tranche, bf.daysRendered);
                          const colorClass =
                            status === 'active'
                              ? 'bg-[#3b49df]'
                              : status === 'completed'
                                ? 'bg-[#0b7a53]'
                                : 'bg-slate-200';
                          return (
                            <div
                              key={day}
                              data-day={day}
                              data-status={status}
                              className={`h-2 rounded-full ${colorClass} ${
                                status === 'upcoming' ? 'opacity-65' : 'opacity-100'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. ITEMIZED BILLING TABLE */}
        <div className="print-section-pad py-5 overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-3">Description of Services &amp; Batches</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Halves / Hours</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Rate / Half</th>
                <th className="py-2.5 pl-3 text-right whitespace-nowrap">Amount (PHP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* One Row Per Active Batch (1–4 Batches) */}
              {totals.batchFees.map((batchFee, idx) => {
                const rowTrancheMeta = TRANCHE_META[batchFee.tranche];
                const rowQtyDisplay = `${formatHalvesLabel(batchFee.halvesMultiplier)} (${batchFee.daysRendered}d · ${batchFee.hoursRendered}h)`;

                return (
                  <tr key={batchFee.id} data-testid={`preview-batch-row-${idx + 1}`}>
                    <td className="py-3.5 pr-3 align-top">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-bold text-slate-950">
                          Lead Trainer Services — {PROGRAM_NAME}
                        </span>
                        <span className="font-mono-num text-[11px] font-bold text-[#3b49df]">
                          {batchFee.batchCode}
                        </span>
                        {batchFee.isOverridden && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
                            Custom Price
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                        {rowTrancheMeta.fullLabel} · Covered:{' '}
                        <span className="font-bold text-slate-900">
                          {batchFee.coveredLabel}
                        </span>
                      </div>
                      {batchFee.description.trim() !== '' && (
                        <div
                          data-testid={`preview-batch-description-${idx + 1}`}
                          className="text-[11px] text-slate-500 mt-1 leading-relaxed whitespace-pre-line"
                        >
                          {batchFee.description}
                        </div>
                      )}
                    </td>
                    <td
                      data-testid={idx === 0 ? 'preview-qty-hours' : undefined}
                      className="py-3.5 px-3 text-center font-semibold text-slate-700 align-top whitespace-nowrap tabular-nums"
                    >
                      {batchFee.isOverridden ? 'Flat / Custom' : rowQtyDisplay}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono-num text-slate-700 align-top whitespace-nowrap">
                      {formatPHP(batchFee.unitRate)}
                    </td>
                    <td
                      data-testid={
                        idx === 0 ? 'preview-training-fee' : `preview-batch-amount-${idx + 1}`
                      }
                      className="py-3.5 pl-3 text-right font-mono-num font-bold text-slate-950 align-top whitespace-nowrap"
                    >
                      {formatPHP(batchFee.amount)}
                    </td>
                  </tr>
                );
              })}

              {/* Dynamic Line Items (Reimbursements & Allowances) */}
              {state.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-3 align-top">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-slate-900">
                        {item.description || 'Untitled Item'}
                      </span>
                      {item.isReimbursement ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#0b7a53]">
                          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                          Reimb. (Tax-Free)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Taxable Allowance
                        </span>
                      )}
                    </div>
                    {item.referenceNote.trim() !== '' && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5">
                        {item.referenceNote}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-medium text-slate-600 align-top whitespace-nowrap tabular-nums">
                    1
                  </td>
                  <td className="py-3 px-3 text-right font-mono-num text-slate-700 align-top whitespace-nowrap">
                    {formatPHP(item.amount)}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono-num font-bold text-slate-950 align-top whitespace-nowrap">
                    {formatPHP(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. HERO MOMENT: NET AMOUNT PAYABLE & QR PH / INSTAPAY REMITTANCE CARD */}
        <section
          aria-label="Net Amount Payable and Remittance Details"
          className="print-avoid-break print-hero-card mt-2 rounded-[24px] bg-[#f3f5fc] border border-[#d6dcf5] p-5 sm:p-6"
        >
          <div className="print-hero-grid grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-6 items-stretch">
            {/* Left: Payee Bank / E-Wallet & Cropped QR Ph Square */}
            <div className="print-hero-left md:col-span-7 print:col-span-7 flex flex-col sm:flex-row print:flex-row items-start justify-between gap-4 sm:border-r sm:border-[#d6dcf5] sm:pr-5 print:border-r print:border-[#d6dcf5] print:pr-5">
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#3b49df]">
                  <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Remittance · {bankMeta.channelType}</span>
                </div>

                <div>
                  <p
                    data-testid="preview-bank-name"
                    className="font-display text-base font-extrabold text-slate-950 leading-snug"
                  >
                    {displayBankName}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    Payee: <span className="text-slate-950">{state.bank.accountName || '—'}</span>
                  </p>
                </div>

                <div className="pt-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Account / Registered Mobile No.
                  </p>
                  <p
                    data-testid="preview-account-number"
                    className="font-mono-num text-base font-extrabold tracking-tight text-slate-950 mt-0.5 break-all"
                  >
                    {state.bank.accountNumber || '—'}
                  </p>
                </div>

                {state.bank.remittanceNote.trim() !== '' && (
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {state.bank.remittanceNote}
                  </p>
                )}
              </div>

              {/* Cropped QR Ph Code Box */}
              {state.qrCroppedDataUrl ? (
                <div className="shrink-0 flex flex-col items-center rounded-2xl bg-white p-2.5 border border-slate-200 shadow-sm self-center sm:self-start">
                  <img
                    data-testid="preview-qr-image"
                    src={state.qrCroppedDataUrl}
                    alt={`QR Ph InstaPay code for ${state.bank.accountName}`}
                    className="h-28 w-28 object-contain rounded-lg"
                  />
                  <span className="mt-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#3b49df] whitespace-nowrap">
                    Scan · QR Ph / InstaPay
                  </span>
                </div>
              ) : (
                <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl bg-white/70 border border-dashed border-slate-300 h-28 w-28 p-2 text-center self-center sm:self-start">
                  <QrCode className="h-6 w-6 text-slate-400 mb-1" aria-hidden="true" />
                  <span className="text-[10px] font-semibold text-slate-500 leading-tight">
                    Bank Transfer Only
                  </span>
                </div>
              )}
            </div>

            {/* Right: Totals Math & Hero Net Amount Payable */}
            <div className="print-hero-right md:col-span-5 print:col-span-5 flex flex-col justify-between gap-4">
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-600 font-medium whitespace-nowrap">
                    Taxable Training Fee
                  </dt>
                  <dd
                    data-testid="preview-taxable-subtotal"
                    className="font-mono-num font-bold text-slate-900 whitespace-nowrap"
                  >
                    {formatPHP(totals.taxableSubtotal)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-600 font-medium whitespace-nowrap">
                    Less: EWT ({taxPercentLabel})
                  </dt>
                  <dd
                    data-testid="preview-withholding-tax"
                    className={`font-mono-num font-bold whitespace-nowrap ${
                      totals.withholdingTax > 0 ? 'text-[#c4233b]' : 'text-slate-500'
                    }`}
                  >
                    {totals.withholdingTax > 0
                      ? `-${formatPHP(totals.withholdingTax)}`
                      : formatPHP(0)}
                  </dd>
                </div>

                {totals.reimbursementsTotal > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#0b7a53] font-semibold whitespace-nowrap">
                      Plus: Tax-Free Reimb.
                    </dt>
                    <dd
                      data-testid="preview-reimbursements-total"
                      className="font-mono-num font-bold text-[#0b7a53] whitespace-nowrap"
                    >
                      +{formatPHP(totals.reimbursementsTotal)}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Expressive Focal Net Payable Container */}
              <div className="rounded-2xl bg-[#141827] text-white px-4 py-3.5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b8c2ff]">
                  Net Amount Payable (PHP)
                </div>
                <div
                  key={totals.netPayable}
                  data-testid="preview-net-payable"
                  className="animate-m3-pop font-display text-2xl xl:text-[28px] font-extrabold tracking-tight text-white font-mono-num mt-0.5 whitespace-nowrap"
                >
                  {formatPHP(totals.netPayable)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. SUPPORTING ATTACHMENTS NOTE */}
        <p className="mt-4 text-[11px] text-slate-500 italic leading-relaxed">
          Supporting attachments: Daily Attendance Sheet (DTR), Competency Monitoring Log, Session Plan for {PROGRAM_NAME}, and Official Receipts / e-Receipts for all non-taxable reimbursable items.
        </p>

        {/* 7. DUAL SIGNATORIES FOOTER (With Optional E-Signature & Print Break Safeguard) */}
        <div className="print-avoid-break print-signatories grid grid-cols-1 sm:grid-cols-2 gap-8 mt-7 pt-5 border-t border-slate-200">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Submitted &amp; Certified Correct By
            </p>
            <div className="h-11 flex items-end pb-1">
              {state.signatureDataUrl && (
                <img
                  data-testid="preview-signature-image"
                  src={state.signatureDataUrl}
                  alt={`Signature of ${state.trainerName || 'Trainer'}`}
                  className="max-h-10 max-w-[180px] object-contain"
                />
              )}
            </div>
            <div className="border-b border-slate-400 w-4/5 mb-1.5" />
            <p className="text-xs font-bold text-slate-950">
              {state.trainerName || 'Trainer Name'}
            </p>
            <p className="text-[11px] text-slate-500">
              Lead Trainer · {PROGRAM_NAME}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              Verified &amp; Approved for Payment By
            </p>
            <div className="h-11" aria-hidden="true" />
            <div className="border-b border-slate-400 w-4/5 mb-1.5" />
            <p className="text-xs font-bold text-slate-950">
              {state.clientAttention || 'Authorized Representative'}
            </p>
            <p className="text-[11px] text-slate-500">
              Authorized Signatory · {state.clientName || 'Training Provider'}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
