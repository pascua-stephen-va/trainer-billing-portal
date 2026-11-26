import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CopyPlus,
  Download,
  FileCheck2,
  FolderOpen,
  History,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { InvoiceStatus, SavedInvoiceRecord } from '../types/billing';
import { formatPHP } from '../utils/billingLogic';

interface InvoiceHistoryDrawerProps {
  isOpen: boolean;
  records: SavedInvoiceRecord[];
  activeInvoiceNumber: string;
  onClose: () => void;
  onLoadRecord: (record: SavedInvoiceRecord) => void;
  onCloneToSecondHalf: (record: SavedInvoiceRecord) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
  onDeleteRecord: (id: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

const STATUS_FILTERS: ReadonlyArray<{ id: 'all' | InvoiceStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'paid', label: 'Paid' },
];

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  draft:
    'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] border-[var(--md-outline-variant)]',
  sent: 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] border-[var(--md-primary)]/40',
  paid: 'bg-[var(--md-tertiary-container)] text-[var(--md-on-tertiary-container)] border-[var(--md-tertiary)]/40',
};

function formatSavedTimestamp(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'Saved';
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function InvoiceHistoryDrawer({
  isOpen,
  records,
  activeInvoiceNumber,
  onClose,
  onLoadRecord,
  onCloneToSecondHalf,
  onUpdateStatus,
  onDeleteRecord,
  onExportJson,
  onImportJson,
}: InvoiceHistoryDrawerProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const counts = useMemo(() => {
    return {
      all: records.length,
      draft: records.filter((r) => r.status === 'draft').length,
      sent: records.filter((r) => r.status === 'sent').length,
      paid: records.filter((r) => r.status === 'paid').length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') return records;
    return records.filter((r) => r.status === statusFilter);
  }, [records, statusFilter]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
      data-testid="invoice-history-drawer"
      className="no-print fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-m3-enter flex h-full w-full max-w-lg flex-col bg-[var(--md-surface)] text-[var(--md-on-surface)] shadow-2xl border-l border-[var(--md-outline-variant)]/70">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[var(--md-outline-variant)]/60 bg-[var(--md-surface-container-low)] px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[var(--md-primary)] shrink-0" aria-hidden="true" />
              <h2
                id="history-drawer-title"
                className="font-display text-lg font-extrabold tracking-tight text-[var(--md-on-surface)]"
              >
                Invoice History &amp; Backup
              </h2>
            </div>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">
              Stored locally in your browser. Track payment status or clone any 1st-Half statement into its 2nd Half.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice history"
            className="m3-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--md-surface-container)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)] cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Filter Bar + Backup Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--md-outline-variant)]/50 px-5 py-3 bg-[var(--md-surface-container-low)]/50">
          <div
            role="tablist"
            aria-label="Filter invoices by status"
            className="inline-flex items-center gap-1 rounded-full bg-[var(--md-surface-container)] p-1 border border-[var(--md-outline-variant)]/50"
          >
            {STATUS_FILTERS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`m3-focus rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer tabular-nums ${
                    active
                      ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]'
                      : 'text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)]'
                  }`}
                >
                  {tab.label} ({counts[tab.id]})
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={onExportJson}
              disabled={records.length === 0}
              className={`m3-focus inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors whitespace-nowrap ${
                records.length > 0
                  ? 'bg-[var(--md-surface-container)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)] cursor-pointer'
                  : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] opacity-50 cursor-not-allowed'
              }`}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export JSON</span>
            </button>

            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJson(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="m3-focus inline-flex items-center gap-1 rounded-full border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3 py-1.5 text-[11px] font-bold text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] px-5 py-10 text-center">
              <FileCheck2
                className="mx-auto h-8 w-8 text-[var(--md-on-surface-variant)]/60 mb-2.5"
                aria-hidden="true"
              />
              <p className="font-display text-sm font-bold text-[var(--md-on-surface)]">
                {records.length === 0
                  ? 'No saved invoices yet'
                  : `No ${statusFilter} invoices`}
              </p>
              <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 max-w-xs mx-auto leading-relaxed">
                {records.length === 0
                  ? 'Click "Save Draft" in the toolbar to store the current Statement of Account here for quick reload or 2nd-Half cloning.'
                  : 'Switch the status filter above or save a new statement from the workspace.'}
              </p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const isCurrent = record.invoiceNumber === activeInvoiceNumber;
              return (
                <article
                  key={record.id}
                  data-testid={`history-record-${record.invoiceNumber}`}
                  className={`rounded-[22px] border p-4 transition-colors space-y-3 ${
                    isCurrent
                      ? 'border-[var(--md-primary)]/70 bg-[var(--md-primary-container)]/20'
                      : 'border-[var(--md-outline-variant)]/70 bg-[var(--md-surface-container-low)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-num text-xs font-extrabold text-[var(--md-on-surface)]">
                          {record.invoiceNumber}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--md-primary)]">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-[var(--md-on-surface)] mt-1 truncate">
                        {record.clientName || 'Untitled Client'}
                      </p>
                      <p className="text-[11px] text-[var(--md-on-surface-variant)] truncate mt-0.5">
                        {record.batchSummary} · {formatSavedTimestamp(record.savedAt)}
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1.5">
                      <div className="font-mono-num text-sm font-extrabold text-[var(--md-on-surface)]">
                        {formatPHP(record.netPayable)}
                      </div>
                      <label className="sr-only" htmlFor={`status-${record.id}`}>
                        Status for {record.invoiceNumber}
                      </label>
                      <select
                        id={`status-${record.id}`}
                        value={record.status}
                        onChange={(e) =>
                          onUpdateStatus(record.id, e.target.value as InvoiceStatus)
                        }
                        aria-label={`Payment status for ${record.invoiceNumber}`}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold outline-none cursor-pointer ${STATUS_STYLE[record.status]}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  {/* Record Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[var(--md-outline-variant)]/40">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onLoadRecord(record)}
                        className="m3-focus inline-flex items-center gap-1.5 rounded-full bg-[var(--md-surface-container)] px-3 py-1.5 text-xs font-bold text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)] cursor-pointer transition-colors"
                      >
                        <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Load</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onCloneToSecondHalf(record)}
                        className="m3-spring m3-focus inline-flex items-center gap-1.5 rounded-full bg-[var(--md-primary-container)] px-3 py-1.5 text-xs font-bold text-[var(--md-on-primary-container)] hover:brightness-95 dark:hover:brightness-110 active:scale-95 cursor-pointer transition-all"
                      >
                        <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Clone → 2nd Half</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      aria-label={`Delete saved invoice ${record.invoiceNumber}`}
                      className="m3-focus flex h-8 w-8 items-center justify-center rounded-xl text-[var(--md-error)] hover:bg-[var(--md-error-container)] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
