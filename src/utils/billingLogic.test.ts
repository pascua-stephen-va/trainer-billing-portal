import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAYS_PER_HALF,
  HOURS_PER_DAY,
  MAX_BATCHES,
  TOTAL_PROGRAM_DAYS,
  TOTAL_PROGRAM_HOURS,
  TRANCHE_META,
  buildInvoiceNumber,
  calculateBillingTotals,
  cloneInvoiceToSecondHalf,
  computeDueDateIso,
  createDefaultBillingState,
  formatBatchCode,
  formatBatchCodeList,
  formatDateRange,
  formatPHP,
  getDayBlockStatus,
  getEffectiveInvoiceNumber,
  normalizeDateRange,
  resolveCohortTrancheMode,
} from './billingLogic';

test('program schedule constants match 18 days at 3 hours/day = 54 total hours (9 days per half)', () => {
  assert.equal(HOURS_PER_DAY, 3);
  assert.equal(DAYS_PER_HALF, 9);
  assert.equal(TOTAL_PROGRAM_DAYS, 18);
  assert.equal(TOTAL_PROGRAM_HOURS, 54);
  assert.equal(MAX_BATCHES, 4);
  assert.equal(TRANCHE_META.first.halves, 1);
  assert.equal(TRANCHE_META.second.halves, 1);
  assert.equal(TRANCHE_META.full.halves, 2);
});

test('date-dependent invoice numbering supports -A, -B, -FULL, and -MIX for staggered cohorts', () => {
  assert.equal(buildInvoiceNumber('2026-11-23', 1, 'first'), 'INV-20261123-01-A');
  assert.equal(buildInvoiceNumber('2026-11-23', 2, 'second'), 'INV-20261123-02-B');
  assert.equal(buildInvoiceNumber('2026-11-23', 1, 'full'), 'INV-20261123-01-FULL');
  assert.equal(buildInvoiceNumber('2026-11-23', 1, 'mixed'), 'INV-20261123-01-MIX');
});

test('staggered cohorts with per-batch tranches calculate exact fees and -MIX invoice number', () => {
  const state = createDefaultBillingState();
  state.ratePerHalf = 30000;
  state.taxRate = 0.1;
  state.batches = [
    {
      id: 'b1',
      batchNumber: '04',
      tranche: 'second', // 1 half = 30,000
      daysRendered: 9,
      coveredFrom: '2026-11-13',
      coveredTo: '2026-11-24',
      overridePriceEnabled: false,
      overridePrice: 30000,
    },
    {
      id: 'b2',
      batchNumber: '05',
      tranche: 'first', // 1 half, custom override = 28,000
      daysRendered: 9,
      coveredFrom: '2026-11-16',
      coveredTo: '2026-11-26',
      overridePriceEnabled: true,
      overridePrice: 28000,
    },
    {
      id: 'b3',
      batchNumber: '06',
      tranche: 'full', // 2 halves = 60,000
      daysRendered: 18,
      coveredFrom: '2026-11-02',
      coveredTo: '2026-11-24',
      overridePriceEnabled: false,
      overridePrice: 60000,
    },
  ];

  assert.equal(resolveCohortTrancheMode(state.batches, 'first'), 'mixed');
  assert.equal(getEffectiveInvoiceNumber(state), 'INV-20261123-01-MIX');
  assert.equal(formatBatchCodeList(state.batches), 'VA-L3-2026-B04, B05, B06');

  // Training fee = 30,000 + 28,000 + 60,000 = 118,000
  // 10% EWT = 11,800; Zoom Pro tax-free = 890; Net = 107,090
  const totals = calculateBillingTotals(state);
  assert.equal(totals.batchFees[0].tranche, 'second');
  assert.equal(totals.batchFees[1].amount, 28000);
  assert.equal(totals.batchFees[2].halvesMultiplier, 2);
  assert.equal(totals.batchFees[2].amount, 60000);
  assert.equal(totals.trainingFee, 118000);
  assert.equal(totals.withholdingTax, 11800);
  assert.equal(totals.netPayable, 107090);
});

test('payment terms compute accurate due dates', () => {
  assert.equal(computeDueDateIso('2026-11-23', 'due_on_receipt', ''), '2026-11-23');
  assert.equal(computeDueDateIso('2026-11-23', 'net_7', ''), '2026-11-30');
  assert.equal(computeDueDateIso('2026-11-23', 'net_15', ''), '2026-12-08');
  assert.equal(computeDueDateIso('2026-11-23', 'net_30', ''), '2026-12-23');
  assert.equal(computeDueDateIso('2026-11-23', 'custom', '2026-12-10'), '2026-12-10');
});

test('cloneInvoiceToSecondHalf converts 1st Half to 2nd Half while keeping client, bank, and signature', () => {
  const firstHalf = createDefaultBillingState('data:image/png;base64,QR');
  firstHalf.signatureDataUrl = 'data:image/png;base64,SIG';
  firstHalf.bank.accountName = 'Maria Clara Santos';

  const cloned = cloneInvoiceToSecondHalf(firstHalf);
  assert.equal(cloned.tranche, 'second');
  assert.equal(cloned.batches[0].tranche, 'second');
  assert.equal(cloned.batches[0].coveredFrom, '2026-11-13');
  assert.equal(cloned.batches[0].coveredTo, '2026-11-24');
  assert.equal(getEffectiveInvoiceNumber(cloned), 'INV-20261205-01-B');
  assert.equal(cloned.signatureDataUrl, 'data:image/png;base64,SIG');
  assert.equal(cloned.qrCroppedDataUrl, 'data:image/png;base64,QR');
  assert.equal(cloned.clientName, firstHalf.clientName);
});

test('date range formatting, batch prefix, progress status, and PHP formatting', () => {
  assert.equal(formatBatchCode('04'), 'VA-L3-2026-B04');
  assert.equal(formatDateRange('2026-11-02', '2026-11-12'), 'Nov 2 – Nov 12, 2026');
  assert.deepEqual(normalizeDateRange('2026-11-15', '2026-11-02'), {
    coveredFrom: '2026-11-02',
    coveredTo: '2026-11-15',
  });
  assert.equal(getDayBlockStatus(5, 'second', 9), 'completed');
  assert.equal(getDayBlockStatus(10, 'second', 9), 'active');
  assert.equal(formatPHP(107090), '₱107,090.00');
});
