import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  FileText,
  History,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  BankAccountDetails,
  BatchEntry,
  BillingState,
  InvoiceStatus,
  LineItem,
  PaymentTermsId,
  SavedInvoiceRecord,
  TaxRate,
  TrancheId,
} from './types/billing';
import {
  MAX_BATCHES,
  PROGRAM_NAME,
  TRANCHE_META,
  buildInvoiceNumber,
  calculateBillingTotals,
  cloneInvoiceToSecondHalf,
  createBatchEntry,
  createDefaultBillingState,
  formatBatchCode,
  formatBatchCodeList,
  formatPHP,
  getEffectiveInvoiceNumber,
  resolveBatchDescriptionOnTrancheChange,
  resolveCohortTrancheMode,
} from './utils/billingLogic';
import { generateDemoQrDataUrl } from './utils/qrCanvas';
import { TopBar } from './components/TopBar';
import { TrancheAndCycleCard } from './components/TrancheAndCycleCard';
import { PartiesDetailsCard } from './components/PartiesDetailsCard';
import { RatesAndItemsCard } from './components/RatesAndItemsCard';
import { RemittanceAndQrCard } from './components/RemittanceAndQrCard';
import { QrCropperModal } from './components/QrCropperModal';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceHistoryDrawer } from './components/InvoiceHistoryDrawer';
import { ThemeToggle } from './components/ThemeToggle';
import { useThemePreference } from './hooks/useThemePreference';

const DRAFT_STORAGE_KEY = 'va-l3-trainer-billing-draft-v2';
const HISTORY_STORAGE_KEY = 'va-l3-trainer-billing-history-v1';

function migrateBillingState(
  parsed: Partial<BillingState>,
  demoQr: string
): BillingState {
  const defaults = createDefaultBillingState(demoQr);
  const fallbackTranche: TrancheId =
    parsed.tranche === 'first' || parsed.tranche === 'second' || parsed.tranche === 'full'
      ? parsed.tranche
      : defaults.tranche;

  const rawBatches =
    Array.isArray(parsed.batches) && parsed.batches.length > 0
      ? parsed.batches.slice(0, MAX_BATCHES)
      : defaults.batches;

  const validBatches: BatchEntry[] = rawBatches.map((b, idx) => {
    const bTranche: TrancheId =
      b.tranche === 'first' || b.tranche === 'second' || b.tranche === 'full'
        ? b.tranche
        : fallbackTranche;
    const defaultDays = TRANCHE_META[bTranche].days;
    const bDays =
      typeof b.daysRendered === 'number' && Number.isFinite(b.daysRendered)
        ? b.daysRendered
        : typeof parsed.daysRendered === 'number' && Number.isFinite(parsed.daysRendered)
          ? parsed.daysRendered
          : defaultDays;

    return {
      id: b.id || `batch-migrated-${idx}`,
      batchNumber: typeof b.batchNumber === 'string' ? b.batchNumber : '04',
      tranche: bTranche,
      daysRendered: bDays,
      coveredFrom: b.coveredFrom || TRANCHE_META[bTranche].defaultCoveredFrom,
      coveredTo: b.coveredTo || TRANCHE_META[bTranche].defaultCoveredTo,
      description:
        typeof b.description === 'string'
          ? b.description
          : TRANCHE_META[bTranche].competencyCoverage,
      overridePriceEnabled: Boolean(b.overridePriceEnabled),
      overridePrice:
        typeof b.overridePrice === 'number' && Number.isFinite(b.overridePrice)
          ? b.overridePrice
          : defaults.ratePerHalf,
    };
  });

  return {
    ...defaults,
    ...parsed,
    tranche: fallbackTranche,
    batches: validBatches,
    paymentTerms: parsed.paymentTerms ?? defaults.paymentTerms,
    customDueDate: parsed.customDueDate ?? defaults.customDueDate,
    signatureDataUrl:
      typeof parsed.signatureDataUrl === 'string' ? parsed.signatureDataUrl : null,
    ratePerHalf:
      typeof parsed.ratePerHalf === 'number' && Number.isFinite(parsed.ratePerHalf)
        ? parsed.ratePerHalf
        : defaults.ratePerHalf,
    bank: {
      ...defaults.bank,
      ...(parsed.bank ?? {}),
    },
    lineItems: Array.isArray(parsed.lineItems)
      ? parsed.lineItems
      : defaults.lineItems,
  };
}

function loadInitialBillingState(demoQr: string): BillingState {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return createDefaultBillingState(demoQr);
    return migrateBillingState(JSON.parse(raw) as Partial<BillingState>, demoQr);
  } catch {
    return createDefaultBillingState(demoQr);
  }
}

function loadInitialHistory(): SavedInvoiceRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedInvoiceRecord =>
        Boolean(item && typeof item.id === 'string' && item.state)
    );
  } catch {
    return [];
  }
}

export default function App() {
  const demoQr = useMemo(() => generateDemoQrDataUrl(), []);
  const [state, setState] = useState<BillingState>(() => loadInitialBillingState(demoQr));
  const [history, setHistory] = useState<SavedInvoiceRecord[]>(() => loadInitialHistory());
  const { preference: themePreference, resolvedTheme, toggleTheme, resetToSystem } =
    useThemePreference();
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Persist active draft automatically
  useEffect(() => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  // Persist invoice history automatically
  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore quota errors
    }
  }, [history]);

  const totals = useMemo(() => calculateBillingTotals(state), [state]);
  const effectiveInvoiceNumber = useMemo(
    () => getEffectiveInvoiceNumber(state),
    [state]
  );
  const cohortMode = useMemo(
    () => resolveCohortTrancheMode(state.batches, state.tranche),
    [state.batches, state.tranche]
  );

  // Handlers
  const handleSelectTranche = (tranche: TrancheId) => {
    const meta = TRANCHE_META[tranche];
    setState((prev) => ({
      ...prev,
      tranche,
      daysRendered: meta.days,
      invoiceNumberOverride: null,
      batches: prev.batches.map((b, idx) => ({
        ...b,
        tranche,
        daysRendered: meta.days,
        description: resolveBatchDescriptionOnTrancheChange(
          b.description,
          b.tranche,
          tranche
        ),
        ...(prev.batches.length === 1 && idx === 0
          ? {
              coveredFrom: meta.defaultCoveredFrom,
              coveredTo: meta.defaultCoveredTo,
            }
          : {}),
      })),
    }));
  };

  const handleAddBatch = () => {
    setState((prev) => {
      if (prev.batches.length >= MAX_BATCHES) return prev;
      const newBatch = createBatchEntry(
        prev.batches,
        prev.tranche,
        prev.ratePerHalf
      );
      showToast(`Added Batch ${formatBatchCode(newBatch.batchNumber)}`);
      return {
        ...prev,
        batches: [...prev.batches, newBatch],
      };
    });
  };

  const handleUpdateBatch = (
    id: string,
    patch: Partial<Omit<BatchEntry, 'id'>>
  ) => {
    setState((prev) => {
      const nextBatches = prev.batches.map((b) => {
        if (b.id !== id) return b;
        const nextTranche = patch.tranche ?? b.tranche;
        const nextDays =
          patch.daysRendered !== undefined
            ? patch.daysRendered
            : patch.tranche !== undefined
              ? TRANCHE_META[patch.tranche].days
              : b.daysRendered;
        const nextDescription =
          patch.description !== undefined
            ? patch.description
            : patch.tranche !== undefined
              ? resolveBatchDescriptionOnTrancheChange(
                  b.description,
                  b.tranche,
                  patch.tranche
                )
              : b.description;
        return {
          ...b,
          ...patch,
          tranche: nextTranche,
          daysRendered: nextDays,
          description: nextDescription,
        };
      });

      const isSingle = nextBatches.length === 1;
      const updatedSingle = isSingle ? nextBatches[0] : null;

      return {
        ...prev,
        tranche: updatedSingle ? updatedSingle.tranche : prev.tranche,
        daysRendered: updatedSingle ? updatedSingle.daysRendered : prev.daysRendered,
        invoiceNumberOverride:
          patch.tranche !== undefined ? null : prev.invoiceNumberOverride,
        batches: nextBatches,
      };
    });
  };

  const handleRemoveBatch = (id: string) => {
    setState((prev) => {
      if (prev.batches.length <= 1) return prev;
      const nextBatches = prev.batches.filter((b) => b.id !== id);
      const nextMode = resolveCohortTrancheMode(nextBatches, prev.tranche);
      return {
        ...prev,
        tranche: nextMode === 'mixed' ? prev.tranche : nextMode,
        daysRendered:
          nextBatches.length === 1 ? nextBatches[0].daysRendered : prev.daysRendered,
        invoiceNumberOverride: null,
        batches: nextBatches,
      };
    });
  };

  const handleDaysRenderedChange = (daysRendered: number) => {
    setState((prev) => ({
      ...prev,
      daysRendered,
      batches: prev.batches.map((b) => ({
        ...b,
        daysRendered,
      })),
    }));
  };

  const handleIssueDateChange = (issueDate: string) => {
    setState((prev) => ({
      ...prev,
      issueDate,
      invoiceSequence: 1,
      invoiceNumberOverride: null,
    }));
  };

  const handleIncrementSequence = () => {
    setState((prev) => {
      const nextSeq = prev.invoiceSequence + 1;
      const mode = resolveCohortTrancheMode(prev.batches, prev.tranche);
      const nextNum = buildInvoiceNumber(prev.issueDate, nextSeq, mode);
      showToast(`Invoice sequence incremented to ${nextNum}`);
      return {
        ...prev,
        invoiceSequence: nextSeq,
        invoiceNumberOverride: null,
      };
    });
  };

  const handlePartyFieldChange = (
    field:
      | 'trainerName'
      | 'trainerTin'
      | 'trainerContact'
      | 'clientName'
      | 'clientAddress'
      | 'clientAttention'
      | 'traineeCount',
    value: string | number
  ) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureSelected = (dataUrl: string) => {
    setState((prev) => ({ ...prev, signatureDataUrl: dataUrl }));
    showToast('Trainer e-signature added to invoice');
  };

  const handleRemoveSignature = () => {
    setState((prev) => ({ ...prev, signatureDataUrl: null }));
    showToast('Trainer e-signature removed');
  };

  const handleAddPresetItem = (preset: {
    description: string;
    referenceNote: string;
    amount: number;
    isReimbursement: boolean;
  }) => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ...preset,
    };
    setState((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
    showToast(`Added "${preset.description}"`);
  };

  const handleAddCustomItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: 'Custom Training Resource / Software Fee',
      referenceNote: 'Official receipt attached',
      amount: 500,
      isReimbursement: true,
    };
    setState((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  };

  const handleUpdateItem = (id: string, patch: Partial<Omit<LineItem, 'id'>>) => {
    setState((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleDeleteItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateBank = (patch: Partial<BankAccountDetails>) => {
    setState((prev) => ({
      ...prev,
      bank: { ...prev.bank, ...patch },
    }));
  };

  const handleQrFileSelected = (dataUrl: string) => {
    setState((prev) => ({
      ...prev,
      qrRawDataUrl: dataUrl,
    }));
    setIsCropperOpen(true);
  };

  const handleApplyCroppedQr = (croppedDataUrl: string) => {
    setState((prev) => ({
      ...prev,
      qrCroppedDataUrl: croppedDataUrl,
    }));
    setIsCropperOpen(false);
    showToast('Cropped QR Ph applied to invoice');
  };

  const handleLoadDemoQr = () => {
    setState((prev) => ({
      ...prev,
      qrRawDataUrl: demoQr,
      qrCroppedDataUrl: demoQr,
    }));
    showToast('Demo QR Ph loaded');
  };

  const handleRemoveQr = () => {
    setState((prev) => ({
      ...prev,
      qrRawDataUrl: null,
      qrCroppedDataUrl: null,
    }));
    showToast('QR code removed from invoice');
  };

  const handleSaveDraft = () => {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }

    const batchSummary = formatBatchCodeList(state.batches);
    setHistory((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.invoiceNumber === effectiveInvoiceNumber
      );
      if (existingIdx >= 0) {
        const updated: SavedInvoiceRecord = {
          ...prev[existingIdx],
          savedAt: new Date().toISOString(),
          clientName: state.clientName,
          batchSummary,
          netPayable: totals.netPayable,
          state: structuredClone(state),
        };
        const copy = [...prev];
        copy.splice(existingIdx, 1);
        return [updated, ...copy];
      }

      const freshRecord: SavedInvoiceRecord = {
        id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        savedAt: new Date().toISOString(),
        invoiceNumber: effectiveInvoiceNumber,
        clientName: state.clientName,
        batchSummary,
        netPayable: totals.netPayable,
        status: 'draft',
        state: structuredClone(state),
      };
      return [freshRecord, ...prev];
    });

    showToast(`Saved ${effectiveInvoiceNumber} to History`);
  };

  const handleLoadHistoryRecord = (record: SavedInvoiceRecord) => {
    setState(migrateBillingState(record.state, demoQr));
    setIsHistoryOpen(false);
    showToast(`Loaded ${record.invoiceNumber}`);
  };

  const handleCloneHistoryToSecondHalf = (record: SavedInvoiceRecord) => {
    const migrated = migrateBillingState(record.state, demoQr);
    const cloned = cloneInvoiceToSecondHalf(migrated);
    setState(cloned);
    setIsHistoryOpen(false);
    showToast(`Cloned ${record.invoiceNumber} → 2nd Half`);
  };

  const handleUpdateHistoryStatus = (id: string, status: InvoiceStatus) => {
    setHistory((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status } : rec))
    );
  };

  const handleDeleteHistoryRecord = (id: string) => {
    setHistory((prev) => prev.filter((rec) => rec.id !== id));
    showToast('Removed invoice from history');
  };

  const handleExportHistoryJson = () => {
    const payload = JSON.stringify(history, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `va-l3-invoice-history-${state.issueDate || 'backup'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`Exported ${history.length} saved invoice(s)`);
  };

  const handleImportHistoryJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          showToast('Invalid backup file format');
          return;
        }
        const valid = parsed.filter(
          (item): item is SavedInvoiceRecord =>
            Boolean(item && typeof item.id === 'string' && item.state)
        );
        if (valid.length === 0) {
          showToast('No invoice records found in file');
          return;
        }
        setHistory((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const merged = [...prev];
          for (const rec of valid) {
            if (!existingIds.has(rec.id)) {
              merged.push(rec);
            }
          }
          return merged;
        });
        showToast(`Imported ${valid.length} invoice record(s)`);
      } catch {
        showToast('Could not read JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    const fresh = createDefaultBillingState(demoQr);
    setState(fresh);
    setConfirmReset(false);
    showToast('Reset to default VA Level III billing template');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="top" className="min-h-screen flex flex-col">
      <TopBar onPrint={handlePrint} />

      {/* Workspace Sub-Toolbar (Program Context, Theme Switcher, History, Save Draft, Reset) */}
      <div className="no-print border-b border-[var(--md-outline-variant)]/50 bg-[var(--md-surface-container-low)]/75">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-sm sm:text-base font-bold text-[var(--md-on-surface)] truncate">
              {PROGRAM_NAME}
            </p>
            <p className="text-xs text-[var(--md-on-surface-variant)] tabular-nums">
              18 Training Days · 3 Hours/Day · 54 Total Hours · Net Payable{' '}
              <span className="font-mono-num font-bold text-[var(--md-primary)]">
                {formatPHP(totals.netPayable)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Tactile Framer Motion Theme Toggle (Auto OS Detection + Manual Override) */}
            <ThemeToggle
              preference={themePreference}
              resolvedTheme={resolvedTheme}
              onToggle={toggleTheme}
              onResetToSystem={resetToSystem}
            />

            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                data-testid="open-history-button"
                className="m3-focus inline-flex items-center gap-1.5 rounded-full bg-[var(--md-secondary-container)] px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[var(--md-on-secondary-container)] hover:brightness-95 dark:hover:brightness-110 transition-all cursor-pointer whitespace-nowrap tabular-nums"
              >
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                <span>History ({history.length})</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="m3-focus inline-flex items-center gap-1.5 rounded-full bg-[var(--md-surface-container)] px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className={`m3-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  confirmReset
                    ? 'bg-[var(--md-error-container)] text-[var(--md-on-error-container)]'
                    : 'text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container)] hover:text-[var(--md-on-surface)]'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{confirmReset ? 'Confirm Reset?' : 'Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View Switcher (Edit Form vs Live Invoice Preview) */}
      <div className="no-print lg:hidden mx-auto w-full max-w-[1440px] px-4 pt-4">
        <div
          role="tablist"
          aria-label="Mobile workspace view"
          className="grid grid-cols-2 gap-1.5 rounded-full bg-[var(--md-surface-container)] p-1 border border-[var(--md-outline-variant)]/60"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'editor'}
            onClick={() => setMobileTab('editor')}
            className={`m3-focus inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'editor'
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-sm'
                : 'text-[var(--md-on-surface-variant)]'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Billing Controls</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'preview'}
            onClick={() => setMobileTab('preview')}
            className={`m3-focus inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold transition-all cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-sm'
                : 'text-[var(--md-on-surface-variant)]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Invoice Preview</span>
          </button>
        </div>
      </div>

      {/* Main 12-Column Split Workspace */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT COLUMN: Interactive Billing Controls (5 cols on desktop) */}
          <div
            className={`no-print lg:col-span-5 space-y-5 ${
              mobileTab === 'preview' ? 'hidden lg:block' : 'block'
            }`}
          >
            <TrancheAndCycleCard
              tranche={state.tranche}
              batches={state.batches}
              ratePerHalf={state.ratePerHalf}
              invoiceNumber={effectiveInvoiceNumber}
              issueDate={state.issueDate}
              paymentTerms={state.paymentTerms}
              customDueDate={state.customDueDate}
              onSelectTranche={handleSelectTranche}
              onAddBatch={handleAddBatch}
              onUpdateBatch={handleUpdateBatch}
              onRemoveBatch={handleRemoveBatch}
              onInvoiceNumberChange={(val) =>
                setState((prev) => ({ ...prev, invoiceNumberOverride: val }))
              }
              onIncrementSequence={handleIncrementSequence}
              onIssueDateChange={handleIssueDateChange}
              onPaymentTermsChange={(paymentTerms: PaymentTermsId) =>
                setState((prev) => ({ ...prev, paymentTerms }))
              }
              onCustomDueDateChange={(customDueDate: string) =>
                setState((prev) => ({ ...prev, customDueDate }))
              }
            />

            <PartiesDetailsCard
              trainerName={state.trainerName}
              trainerTin={state.trainerTin}
              trainerContact={state.trainerContact}
              signatureDataUrl={state.signatureDataUrl}
              clientName={state.clientName}
              clientAddress={state.clientAddress}
              clientAttention={state.clientAttention}
              traineeCount={state.traineeCount}
              onChangeField={handlePartyFieldChange}
              onSignatureSelected={handleSignatureSelected}
              onRemoveSignature={handleRemoveSignature}
            />

            <RatesAndItemsCard
              ratePerHalf={state.ratePerHalf}
              daysRendered={state.daysRendered}
              standardBatchFee={totals.standardBatchFee}
              batchCount={state.batches.length}
              totalHoursRendered={totals.hoursRendered}
              isMixedTranches={cohortMode === 'mixed'}
              taxRate={state.taxRate}
              lineItems={state.lineItems}
              onRatePerHalfChange={(ratePerHalf) =>
                setState((prev) => ({ ...prev, ratePerHalf }))
              }
              onDaysRenderedChange={handleDaysRenderedChange}
              onTaxRateChange={(taxRate: TaxRate) =>
                setState((prev) => ({ ...prev, taxRate }))
              }
              onAddPresetItem={handleAddPresetItem}
              onAddCustomItem={handleAddCustomItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
            />

            <RemittanceAndQrCard
              bank={state.bank}
              qrCroppedDataUrl={state.qrCroppedDataUrl}
              hasRawQr={Boolean(state.qrRawDataUrl)}
              onUpdateBank={handleUpdateBank}
              onQrFileSelected={handleQrFileSelected}
              onOpenCropper={() => setIsCropperOpen(true)}
              onLoadDemoQr={handleLoadDemoQr}
              onRemoveQr={handleRemoveQr}
            />
          </div>

          {/* RIGHT COLUMN: Sticky Live A4 Statement of Account Preview (7 cols on desktop) */}
          <div
            className={`lg:col-span-7 lg:sticky lg:top-20 ${
              mobileTab === 'editor' ? 'hidden lg:block' : 'block'
            }`}
          >
            <InvoicePreview state={state} totals={totals} />
          </div>
        </div>
      </main>

      {/* Smart QR Ph Cropper Modal */}
      <QrCropperModal
        isOpen={isCropperOpen}
        rawImageDataUrl={state.qrRawDataUrl}
        onApply={handleApplyCroppedQr}
        onClose={() => setIsCropperOpen(false)}
      />

      {/* Invoice History & 2nd-Half Clone Drawer */}
      <InvoiceHistoryDrawer
        isOpen={isHistoryOpen}
        records={history}
        activeInvoiceNumber={effectiveInvoiceNumber}
        onClose={() => setIsHistoryOpen(false)}
        onLoadRecord={handleLoadHistoryRecord}
        onCloneToSecondHalf={handleCloneHistoryToSecondHalf}
        onUpdateStatus={handleUpdateHistoryStatus}
        onDeleteRecord={handleDeleteHistoryRecord}
        onExportJson={handleExportHistoryJson}
        onImportJson={handleImportHistoryJson}
      />

      {/* Expressive Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="animate-m3-toast no-print fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-[var(--md-on-surface)] text-[var(--md-surface)] px-4 py-2.5 shadow-xl"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--md-tertiary)] text-[var(--md-on-tertiary)]">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
