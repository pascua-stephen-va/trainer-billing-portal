import type {
  BankAccountDetails,
  BankOptionMeta,
  BankPresetId,
  BatchEntry,
  BatchFeeBreakdown,
  BillingState,
  BillingTotals,
  LineItem,
  PaymentTermsId,
  TrancheId,
  TrancheMeta,
} from '../types/billing';

export const PROGRAM_NAME = 'Virtual Assistant Services Level III';
export const BATCH_PREFIX = 'VA-L3-2026-B';
export const HOURS_PER_DAY = 3;
export const DAYS_PER_HALF = 9;
export const TOTAL_PROGRAM_DAYS = 18;
export const TOTAL_PROGRAM_HOURS = TOTAL_PROGRAM_DAYS * HOURS_PER_DAY; // 54 hours
export const MAX_BATCHES = 4;

export const PAYMENT_TERMS_OPTIONS: ReadonlyArray<{
  id: PaymentTermsId;
  label: string;
  shortLabel: string;
  daysOffset: number | null;
}> = [
  { id: 'due_on_receipt', label: 'Due on Receipt', shortLabel: 'Due on Receipt', daysOffset: 0 },
  { id: 'net_7', label: 'Net 7 Days', shortLabel: 'Net 7', daysOffset: 7 },
  { id: 'net_15', label: 'Net 15 Days', shortLabel: 'Net 15', daysOffset: 15 },
  { id: 'net_30', label: 'Net 30 Days', shortLabel: 'Net 30', daysOffset: 30 },
  { id: 'custom', label: 'Custom Due Date', shortLabel: 'Custom', daysOffset: null },
];

export const BANK_OPTIONS: readonly BankOptionMeta[] = [
  {
    id: 'maribank',
    shortLabel: 'MariBank',
    fullName: 'MariBank Philippines (formerly SeaBank)',
    channelType: 'Digital Bank',
    accountLabel: 'MariBank Account Number',
    accountPlaceholder: '1042-8819-2204',
    accentBg: '#ffedd5',
    accentText: '#9a3412',
  },
  {
    id: 'wise',
    shortLabel: 'Wise',
    fullName: 'Wise (PHP Local / InstaPay)',
    channelType: 'Global Transfer',
    accountLabel: 'Wise Account / Email or PHP Account No.',
    accountPlaceholder: 'mcsantos.trainer@email.com',
    accentBg: '#dcfce7',
    accentText: '#166534',
  },
  {
    id: 'gotyme',
    shortLabel: 'GoTyme',
    fullName: 'GoTyme Bank',
    channelType: 'Digital Bank',
    accountLabel: 'GoTyme Account Number',
    accountPlaceholder: '0188-4421-9032',
    accentBg: '#cffafe',
    accentText: '#155e75',
  },
  {
    id: 'gcash',
    shortLabel: 'GCash',
    fullName: 'GCash (G-Xchange, Inc.)',
    channelType: 'E-Wallet',
    accountLabel: 'Registered Mobile Number',
    accountPlaceholder: '0917-555-0192',
    accentBg: '#dbeafe',
    accentText: '#1d4ed8',
  },
  {
    id: 'maya',
    shortLabel: 'Maya',
    fullName: 'Maya Bank / Wallet',
    channelType: 'E-Wallet',
    accountLabel: 'Registered Mobile or Savings Account No.',
    accountPlaceholder: '0917-555-0192',
    accentBg: '#d1fae5',
    accentText: '#065f46',
  },
  {
    id: 'bpi',
    shortLabel: 'BPI',
    fullName: 'BPI (Bank of the Philippine Islands)',
    channelType: 'Commercial Bank',
    accountLabel: 'BPI Savings Account Number',
    accountPlaceholder: '3089-1124-88',
    accentBg: '#fee2e2',
    accentText: '#991b1b',
  },
  {
    id: 'bdo',
    shortLabel: 'BDO',
    fullName: 'BDO Unibank, Inc.',
    channelType: 'Commercial Bank',
    accountLabel: 'BDO Account Number',
    accountPlaceholder: '0042-8019-4412',
    accentBg: '#e0e7ff',
    accentText: '#1e3a8a',
  },
  {
    id: 'unionbank',
    shortLabel: 'UnionBank',
    fullName: 'UnionBank of the Philippines',
    channelType: 'Commercial Bank',
    accountLabel: 'UnionBank Account Number',
    accountPlaceholder: '1094-5501-8832',
    accentBg: '#fef3c7',
    accentText: '#92400e',
  },
  {
    id: 'custom',
    shortLabel: 'Other / Custom Bank',
    fullName: 'Custom Financial Institution',
    channelType: 'Custom',
    accountLabel: 'Account Number / Registered Mobile',
    accountPlaceholder: 'Enter account or mobile number',
    accentBg: '#e2e8f0',
    accentText: '#334155',
  },
] as const;

export const TRANCHE_META: Record<TrancheId, TrancheMeta> = {
  first: {
    id: 'first',
    shortLabel: '1st Half',
    dayRangeLabel: 'Days 1–9',
    fullLabel: '1st Half Billing (Days 1–9 of 18)',
    days: 9,
    hours: 27,
    halves: 1,
    percentage: 50,
    invoiceSuffix: '-A',
    progressSummary: 'Tranche 1 of 2 · Days 1–9 Billed (27 hrs · 50%)',
    competencyCoverage:
      'Covers Basic & Common Competencies + Core Module 1: Administrative Workflows, Cloud File Architecture, Email & Calendar Operations.',
    defaultCoveredFrom: '2026-11-02',
    defaultCoveredTo: '2026-11-12',
  },
  second: {
    id: 'second',
    shortLabel: '2nd Half',
    dayRangeLabel: 'Days 10–18',
    fullLabel: '2nd Half Billing (Days 10–18 of 18)',
    days: 9,
    hours: 27,
    halves: 1,
    percentage: 50,
    invoiceSuffix: '-B',
    progressSummary: 'Tranche 2 of 2 · Days 10–18 Billed (27 hrs · Final 50%)',
    competencyCoverage:
      'Covers Core Modules 2 & 3: CRM Operations, Social Media & Content Systems, Bookkeeping Essentials, Institutional Mock Assessment.',
    defaultCoveredFrom: '2026-11-13',
    defaultCoveredTo: '2026-11-24',
  },
  full: {
    id: 'full',
    shortLabel: 'Full Term',
    dayRangeLabel: 'Days 1–18',
    fullLabel: 'Full Term Billing (Days 1–18 of 18)',
    days: 18,
    hours: 54,
    halves: 2,
    percentage: 100,
    invoiceSuffix: '-FULL',
    progressSummary: 'Full Term · Days 1–18 Complete (54 hrs · 100%)',
    competencyCoverage:
      'Complete 54-Hour Delivery of Virtual Assistant Services Level III (18 Training Days at 3 Hours/Day, including Final Competency Evaluation).',
    defaultCoveredFrom: '2026-11-02',
    defaultCoveredTo: '2026-11-24',
  },
};

export function getBankOption(preset: BankPresetId): BankOptionMeta {
  return BANK_OPTIONS.find((item) => item.id === preset) ?? BANK_OPTIONS[0];
}

export function getDisplayBankName(bank: BankAccountDetails): string {
  if (bank.bankPreset === 'custom') {
    const trimmed = bank.customBankName.trim();
    return trimmed.length > 0 ? trimmed : 'Custom Bank / E-Wallet';
  }
  return getBankOption(bank.bankPreset).fullName;
}

export function formatBatchCode(batchNumber: string): string {
  const cleaned = batchNumber.trim();
  return `${BATCH_PREFIX}${cleaned}`;
}

export function formatBatchCodeList(batches: readonly BatchEntry[]): string {
  if (batches.length === 0) return formatBatchCode('04');
  if (batches.length === 1) return formatBatchCode(batches[0].batchNumber);
  const first = formatBatchCode(batches[0].batchNumber);
  const rest = batches.slice(1).map((b) => `B${b.batchNumber.trim() || '—'}`);
  return `${first}, ${rest.join(', ')}`;
}

export function parseIsoDateUTC(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  if (
    dateObj.getUTCFullYear() !== y ||
    dateObj.getUTCMonth() !== m - 1 ||
    dateObj.getUTCDate() !== d
  ) {
    return null;
  }
  return dateObj;
}

export function formatDateToIsoUTC(dateObj: Date): string {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIso(isoDate: string, days: number): string {
  const base = parseIsoDateUTC(isoDate);
  if (!base) return isoDate;
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return formatDateToIsoUTC(next);
}

export function computeDueDateIso(
  issueDate: string,
  paymentTerms: PaymentTermsId,
  customDueDate: string
): string {
  if (paymentTerms === 'custom') {
    return customDueDate || issueDate;
  }
  const opt = PAYMENT_TERMS_OPTIONS.find((o) => o.id === paymentTerms);
  const offset = opt?.daysOffset ?? 0;
  return addDaysIso(issueDate, offset);
}

export function getPaymentTermsShortLabel(paymentTerms: PaymentTermsId): string {
  return (
    PAYMENT_TERMS_OPTIONS.find((o) => o.id === paymentTerms)?.shortLabel ??
    'Net 7'
  );
}

export function formatShortDate(isoDate: string): string {
  const dateObj = parseIsoDateUTC(isoDate);
  if (!dateObj) return isoDate || 'Select date';
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateRange(fromIso: string, toIso: string): string {
  const fromDate = parseIsoDateUTC(fromIso);
  const toDate = parseIsoDateUTC(toIso);
  if (!fromDate && !toDate) return 'Select dates';
  if (fromDate && !toDate) return `${formatShortDate(fromIso)} – Select end`;
  if (!fromDate && toDate) return `Select start – ${formatShortDate(toIso)}`;

  const f = fromDate!;
  const t = toDate!;
  const sameYear = f.getUTCFullYear() === t.getUTCFullYear();
  const sameMonth = sameYear && f.getUTCMonth() === t.getUTCMonth();

  if (sameMonth && f.getUTCDate() === t.getUTCDate()) {
    return formatShortDate(fromIso);
  }

  const fromMonthDay = f.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const toMonthDayYear = t.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  if (sameYear) {
    return `${fromMonthDay} – ${toMonthDayYear}`;
  }

  return `${formatShortDate(fromIso)} – ${toMonthDayYear}`;
}

export function normalizeDateRange(
  fromIso: string,
  toIso: string
): { coveredFrom: string; coveredTo: string } {
  if (!fromIso || !toIso) return { coveredFrom: fromIso, coveredTo: toIso };
  return fromIso <= toIso
    ? { coveredFrom: fromIso, coveredTo: toIso }
    : { coveredFrom: toIso, coveredTo: fromIso };
}

export function resolveCohortTrancheMode(
  batches: readonly Pick<BatchEntry, 'tranche'>[],
  fallbackTranche: TrancheId
): TrancheId | 'mixed' {
  if (batches.length === 0) return fallbackTranche;
  const first = batches[0].tranche;
  for (let i = 1; i < batches.length; i++) {
    if (batches[i].tranche !== first) return 'mixed';
  }
  return first;
}

export function buildInvoiceNumber(
  issueDate: string,
  sequence: number,
  trancheOrMode: TrancheId | 'mixed'
): string {
  const dateCompact = /^\d{4}-\d{2}-\d{2}$/.test(issueDate)
    ? issueDate.replace(/-/g, '')
    : '20261123';
  const safeSeq = Math.max(1, Math.floor(Number.isFinite(sequence) ? sequence : 1));
  const seqStr = String(safeSeq).padStart(2, '0');
  const suffix =
    trancheOrMode === 'mixed'
      ? '-MIX'
      : TRANCHE_META[trancheOrMode].invoiceSuffix;
  return `INV-${dateCompact}-${seqStr}${suffix}`;
}

export function getEffectiveInvoiceNumber(
  state: Pick<
    BillingState,
    'issueDate' | 'invoiceSequence' | 'tranche' | 'batches' | 'invoiceNumberOverride'
  >
): string {
  if (
    state.invoiceNumberOverride !== null &&
    state.invoiceNumberOverride.trim() !== ''
  ) {
    return state.invoiceNumberOverride;
  }
  const mode = resolveCohortTrancheMode(state.batches, state.tranche);
  return buildInvoiceNumber(state.issueDate, state.invoiceSequence, mode);
}

export function formatIssueDateLong(isoDate: string): string {
  const dateObj = parseIsoDateUTC(isoDate);
  if (!dateObj) return isoDate || 'Not set';
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatHalvesLabel(halvesMultiplier: number): string {
  if (Math.abs(halvesMultiplier - 1) < 0.001) return '1 Half';
  if (Math.abs(halvesMultiplier - 2) < 0.001) return '2 Halves';
  const rounded = Number(halvesMultiplier.toFixed(2));
  return `${rounded} ${rounded === 1 ? 'Half' : 'Halves'}`;
}

export function calculateBatchStandardFee(
  ratePerHalf: number,
  daysRendered: number
): { hoursRendered: number; halvesMultiplier: number; standardFee: number } {
  const safeRatePerHalf = Math.max(0, Number.isFinite(ratePerHalf) ? ratePerHalf : 0);
  const safeDays = Math.max(
    0,
    Math.min(
      TOTAL_PROGRAM_DAYS,
      Number.isFinite(daysRendered) ? daysRendered : 0
    )
  );
  const hoursRendered = roundCurrency(safeDays * HOURS_PER_DAY);
  const halvesMultiplier = roundCurrency(safeDays / DAYS_PER_HALF);
  const standardFee = roundCurrency(safeRatePerHalf * halvesMultiplier);
  return { hoursRendered, halvesMultiplier, standardFee };
}

export function calculateBillingTotals(
  state: Pick<
    BillingState,
    'batches' | 'ratePerHalf' | 'daysRendered' | 'taxRate' | 'lineItems'
  >
): BillingTotals {
  const safeRatePerHalf = Math.max(
    0,
    Number.isFinite(state.ratePerHalf) ? state.ratePerHalf : 0
  );
  const globalCalc = calculateBatchStandardFee(safeRatePerHalf, state.daysRendered);

  const activeBatches =
    state.batches.length > 0 ? state.batches.slice(0, MAX_BATCHES) : [];

  const batchFees: BatchFeeBreakdown[] = activeBatches.map((batch) => {
    const batchDays =
      typeof batch.daysRendered === 'number' && Number.isFinite(batch.daysRendered)
        ? batch.daysRendered
        : TRANCHE_META[batch.tranche].days;
    const calc = calculateBatchStandardFee(safeRatePerHalf, batchDays);
    const safeOverride = Math.max(
      0,
      Number.isFinite(batch.overridePrice) ? batch.overridePrice : 0
    );
    const amount = batch.overridePriceEnabled
      ? roundCurrency(safeOverride)
      : calc.standardFee;

    return {
      id: batch.id,
      batchCode: formatBatchCode(batch.batchNumber),
      tranche: batch.tranche,
      daysRendered: batchDays,
      hoursRendered: calc.hoursRendered,
      coveredLabel: formatDateRange(batch.coveredFrom, batch.coveredTo),
      description:
        typeof batch.description === 'string'
          ? batch.description
          : TRANCHE_META[batch.tranche].competencyCoverage,
      halvesMultiplier: calc.halvesMultiplier,
      isOverridden: batch.overridePriceEnabled,
      unitRate: batch.overridePriceEnabled
        ? roundCurrency(safeOverride)
        : safeRatePerHalf,
      standardFee: calc.standardFee,
      amount,
    };
  });

  const trainingFee = roundCurrency(
    batchFees.reduce((sum, b) => sum + b.amount, 0)
  );

  let taxableExtrasTotal = 0;
  let reimbursementsTotal = 0;

  for (const item of state.lineItems) {
    const safeAmount = Math.max(0, Number.isFinite(item.amount) ? item.amount : 0);
    if (item.isReimbursement) {
      reimbursementsTotal += safeAmount;
    } else {
      taxableExtrasTotal += safeAmount;
    }
  }

  taxableExtrasTotal = roundCurrency(taxableExtrasTotal);
  reimbursementsTotal = roundCurrency(reimbursementsTotal);

  const taxableSubtotal = roundCurrency(trainingFee + taxableExtrasTotal);
  const withholdingTax = roundCurrency(taxableSubtotal * state.taxRate);
  const netPayable = roundCurrency(
    taxableSubtotal - withholdingTax + reimbursementsTotal
  );

  const totalHoursRendered = roundCurrency(
    batchFees.reduce((sum, b) => sum + b.hoursRendered, 0)
  );

  return {
    hoursRendered:
      batchFees.length === 1 ? batchFees[0].hoursRendered : totalHoursRendered,
    halvesMultiplier: globalCalc.halvesMultiplier,
    standardBatchFee: globalCalc.standardFee,
    batchFees,
    trainingFee,
    taxableExtrasTotal,
    taxableSubtotal,
    withholdingTax,
    reimbursementsTotal,
    netPayable,
  };
}

export function formatPHP(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const absFormatted = Math.abs(safe).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return safe < 0 ? `-₱${absFormatted}` : `₱${absFormatted}`;
}

export function getDayBlockStatus(
  dayNumber: number,
  tranche: TrancheId,
  daysRendered: number
): 'active' | 'completed' | 'upcoming' {
  if (tranche === 'first') {
    return dayNumber <= Math.min(daysRendered, 9) ? 'active' : 'upcoming';
  }
  if (tranche === 'second') {
    if (dayNumber <= 9) return 'completed';
    const endDay = Math.min(18, 9 + Math.max(0, daysRendered));
    return dayNumber <= endDay ? 'active' : 'upcoming';
  }
  return dayNumber <= Math.min(daysRendered, 18) ? 'active' : 'upcoming';
}

export function suggestNextBatchNumber(batches: readonly BatchEntry[]): string {
  let maxNum = 3;
  for (const b of batches) {
    const parsed = parseInt(b.batchNumber, 10);
    if (!Number.isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }
  return String(maxNum + 1).padStart(2, '0');
}

export function resolveBatchDescriptionOnTrancheChange(
  currentDescription: string | undefined,
  previousTranche: TrancheId,
  nextTranche: TrancheId
): string {
  const prevDefault = TRANCHE_META[previousTranche].competencyCoverage.trim();
  const nextDefault = TRANCHE_META[nextTranche].competencyCoverage;
  if (typeof currentDescription !== 'string') {
    return nextDefault;
  }
  if (currentDescription.trim() === prevDefault) {
    return nextDefault;
  }
  return currentDescription;
}

export function createBatchEntry(
  batches: readonly BatchEntry[],
  tranche: TrancheId,
  ratePerHalf: number
): BatchEntry {
  const meta = TRANCHE_META[tranche];
  const last = batches[batches.length - 1];
  const calc = calculateBatchStandardFee(ratePerHalf, meta.days);
  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    batchNumber: suggestNextBatchNumber(batches),
    tranche,
    daysRendered: meta.days,
    coveredFrom: last?.coveredFrom || meta.defaultCoveredFrom,
    coveredTo: last?.coveredTo || meta.defaultCoveredTo,
    description: meta.competencyCoverage,
    overridePriceEnabled: false,
    overridePrice: calc.standardFee,
  };
}

/**
 * One-click helper to clone a 1st-Half (or existing) invoice into its 2nd-Half billing cycle,
 * preserving trainer, institution, bank, QR Ph, and e-signature details.
 */
export function cloneInvoiceToSecondHalf(source: BillingState): BillingState {
  const secondMeta = TRANCHE_META.second;
  const clonedBatches: BatchEntry[] = source.batches.map((b, idx) => {
    // Advance covered period forward by 11 days if valid, else use 2nd Half default dates
    const hasValidDates =
      Boolean(parseIsoDateUTC(b.coveredFrom)) && Boolean(parseIsoDateUTC(b.coveredTo));
    const nextFrom = hasValidDates
      ? addDaysIso(b.coveredTo, 1)
      : secondMeta.defaultCoveredFrom;
    const nextTo = hasValidDates
      ? addDaysIso(nextFrom, 11)
      : secondMeta.defaultCoveredTo;

    return {
      ...b,
      id: `batch-2nd-${Date.now()}-${idx}`,
      tranche: 'second',
      daysRendered: secondMeta.days,
      coveredFrom: nextFrom,
      coveredTo: nextTo,
      description: resolveBatchDescriptionOnTrancheChange(
        b.description,
        b.tranche,
        'second'
      ),
    };
  });

  const nextIssueDate = parseIsoDateUTC(source.issueDate)
    ? addDaysIso(source.issueDate, 12)
    : source.issueDate;

  return {
    ...source,
    tranche: 'second',
    daysRendered: secondMeta.days,
    issueDate: nextIssueDate,
    invoiceSequence: 1,
    invoiceNumberOverride: null,
    batches: clonedBatches,
  };
}

export const QUICK_ADD_PRESETS: ReadonlyArray<{
  key: string;
  label: string;
  description: string;
  referenceNote: string;
  amount: number;
  isReimbursement: boolean;
}> = [
  {
    key: 'zoom',
    label: '+ Zoom Pro (1 Mo)',
    description: 'Zoom Pro Subscription (1 Month — Virtual Classroom Host)',
    referenceNote: 'Official Receipt / Subscription Ref #ZM-2026-8841 (Attached)',
    amount: 890,
    isReimbursement: true,
  },
  {
    key: 'canva',
    label: '+ Canva / VA Tools',
    description: 'Canva Pro & VA Productivity Tools Subscription (1 Month)',
    referenceNote: 'Digital Receipt / Workspace Billing Ref (Attached)',
    amount: 600,
    isReimbursement: true,
  },
  {
    key: 'internet',
    label: '+ Internet Allowance',
    description: 'Internet & Fiber Connectivity Allowance',
    referenceNote: 'Training Delivery Connectivity Support',
    amount: 1500,
    isReimbursement: false,
  },
];

export function createDefaultLineItems(): LineItem[] {
  return [
    {
      id: 'item-zoom-default',
      description: 'Zoom Pro Subscription (1 Month — Virtual Classroom Host)',
      referenceNote: 'Official Receipt / Subscription Ref #ZM-2026-8841 (Attached)',
      amount: 890,
      isReimbursement: true,
    },
  ];
}

export function createDefaultBillingState(
  demoQrDataUrl: string | null = null
): BillingState {
  return {
    tranche: 'first',
    batches: [
      {
        id: 'batch-default-1',
        batchNumber: '04',
        tranche: 'first',
        daysRendered: 9,
        coveredFrom: TRANCHE_META.first.defaultCoveredFrom,
        coveredTo: TRANCHE_META.first.defaultCoveredTo,
        description: TRANCHE_META.first.competencyCoverage,
        overridePriceEnabled: false,
        overridePrice: 31500,
      },
    ],
    issueDate: '2026-11-23',
    paymentTerms: 'net_7',
    customDueDate: '2026-11-30',
    invoiceSequence: 1,
    invoiceNumberOverride: null,

    trainerName: 'Maria Clara Santos, LPT',
    trainerTin: '248-910-442-000',
    trainerContact: 'mcsantos.trainer@email.com',
    signatureDataUrl: null,

    clientName: 'Apex Digital Skills & Tech Institute Inc.',
    clientAddress: '4F TechHub Bldg., Commonwealth Ave., Quezon City, Metro Manila',
    clientAttention: 'Engr. Roberto Reyes (Training Director)',
    traineeCount: 25,

    ratePerHalf: 31500,
    daysRendered: 9,
    taxRate: 0.1,

    lineItems: createDefaultLineItems(),

    bank: {
      bankPreset: 'bpi',
      customBankName: '',
      accountName: 'Maria Clara Santos',
      accountNumber: '3089-1124-88',
      remittanceNote: 'InstaPay / QR Ph Transfer Preferred',
    },

    qrRawDataUrl: demoQrDataUrl,
    qrCroppedDataUrl: demoQrDataUrl,
  };
}
