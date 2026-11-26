export type TrancheId = 'first' | 'second' | 'full';

export type TaxRate = 0 | 0.05 | 0.1;

export type ThemeMode = 'auto' | 'light' | 'dark';

export type PaymentTermsId = 'due_on_receipt' | 'net_7' | 'net_15' | 'net_30' | 'custom';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export type BankPresetId =
  | 'maribank'
  | 'wise'
  | 'gotyme'
  | 'gcash'
  | 'maya'
  | 'bpi'
  | 'bdo'
  | 'unionbank'
  | 'custom';

export interface BankOptionMeta {
  id: BankPresetId;
  shortLabel: string;
  fullName: string;
  channelType: 'Digital Bank' | 'E-Wallet' | 'Commercial Bank' | 'Global Transfer' | 'Custom';
  accountLabel: string;
  accountPlaceholder: string;
  accentBg: string;
  accentText: string;
}

export interface BatchEntry {
  id: string;
  batchNumber: string;
  tranche: TrancheId;
  daysRendered: number;
  coveredFrom: string; // ISO YYYY-MM-DD
  coveredTo: string; // ISO YYYY-MM-DD
  overridePriceEnabled: boolean;
  overridePrice: number;
}

export interface LineItem {
  id: string;
  description: string;
  referenceNote: string;
  amount: number;
  isReimbursement: boolean;
}

export interface BankAccountDetails {
  bankPreset: BankPresetId;
  customBankName: string;
  accountName: string;
  accountNumber: string;
  remittanceNote: string;
}

export interface BillingState {
  tranche: TrancheId; // Global quick-preset / default tranche for new batches
  batches: BatchEntry[];
  issueDate: string;
  paymentTerms: PaymentTermsId;
  customDueDate: string;
  invoiceSequence: number;
  invoiceNumberOverride: string | null;

  trainerName: string;
  trainerTin: string;
  trainerContact: string;
  signatureDataUrl: string | null;

  clientName: string;
  clientAddress: string;
  clientAttention: string;
  traineeCount: number;

  ratePerHalf: number;
  daysRendered: number;
  taxRate: TaxRate;

  lineItems: LineItem[];
  bank: BankAccountDetails;

  qrRawDataUrl: string | null;
  qrCroppedDataUrl: string | null;
}

export interface SavedInvoiceRecord {
  id: string;
  savedAt: string;
  invoiceNumber: string;
  clientName: string;
  batchSummary: string;
  netPayable: number;
  status: InvoiceStatus;
  state: BillingState;
}

export interface TrancheMeta {
  id: TrancheId;
  shortLabel: string;
  dayRangeLabel: string;
  fullLabel: string;
  days: number;
  hours: number;
  halves: number;
  percentage: number;
  invoiceSuffix: string;
  progressSummary: string;
  competencyCoverage: string;
  defaultCoveredFrom: string;
  defaultCoveredTo: string;
}

export interface BatchFeeBreakdown {
  id: string;
  batchCode: string;
  tranche: TrancheId;
  daysRendered: number;
  hoursRendered: number;
  coveredLabel: string;
  halvesMultiplier: number;
  isOverridden: boolean;
  unitRate: number;
  standardFee: number;
  amount: number;
}

export interface BillingTotals {
  hoursRendered: number;
  halvesMultiplier: number;
  standardBatchFee: number;
  batchFees: BatchFeeBreakdown[];
  trainingFee: number;
  taxableExtrasTotal: number;
  taxableSubtotal: number;
  withholdingTax: number;
  reimbursementsTotal: number;
  netPayable: number;
}
