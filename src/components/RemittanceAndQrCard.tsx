import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Crop, QrCode, Trash2, Upload } from 'lucide-react';
import type { BankAccountDetails, BankPresetId } from '../types/billing';
import { BANK_OPTIONS, getBankOption } from '../utils/billingLogic';

interface RemittanceAndQrCardProps {
  bank: BankAccountDetails;
  qrCroppedDataUrl: string | null;
  hasRawQr: boolean;
  onUpdateBank: (patch: Partial<BankAccountDetails>) => void;
  onQrFileSelected: (dataUrl: string) => void;
  onOpenCropper: () => void;
  onLoadDemoQr: () => void;
  onRemoveQr: () => void;
}

export function RemittanceAndQrCard({
  bank,
  qrCroppedDataUrl,
  hasRawQr,
  onUpdateBank,
  onQrFileSelected,
  onOpenCropper,
  onLoadDemoQr,
  onRemoveQr,
}: RemittanceAndQrCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedBankMeta = getBankOption(bank.bankPreset);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onQrFileSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
    // Reset input value so re-uploading the same file triggers onChange
    e.target.value = '';
  };

  const handleSelectBank = (preset: BankPresetId) => {
    onUpdateBank({ bankPreset: preset });
  };

  return (
    <section
      id="section-remittance"
      aria-labelledby="heading-remittance"
      className="rounded-[28px] bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)]/70 p-5 sm:p-6 transition-colors"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2
          id="heading-remittance"
          className="font-display text-lg font-bold tracking-tight text-[var(--md-on-surface)]"
        >
          04. Remittance Bank &amp; Smart QR Ph
        </h2>
        <span className="text-xs font-medium text-[var(--md-on-surface-variant)]">
          InstaPay / PESONet
        </span>
      </div>
      <p className="text-xs sm:text-sm text-[var(--md-on-surface-variant)] mb-4">
        Select your disbursement channel and upload a mobile banking screenshot to crop a crisp QR Ph square.
      </p>

      {/* Multi-Bank / E-Wallet Expressive Pill Selector */}
      <div className="mb-4">
        <span className="block text-xs font-bold tracking-wide text-[var(--md-on-surface-variant)] mb-2">
          Bank or E-Wallet Channel
        </span>
        <div
          role="radiogroup"
          aria-label="Bank or E-Wallet channel"
          className="flex flex-wrap gap-2"
        >
          {BANK_OPTIONS.map((option) => {
            const isSelected = bank.bankPreset === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectBank(option.id)}
                className={`m3-spring m3-focus rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'border-[var(--md-primary)] bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-sm scale-[1.02]'
                    : 'border-[var(--md-outline-variant)]/80 bg-[var(--md-surface)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)]'
                }`}
              >
                {option.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Bank Name Input (revealed when Other / Custom Bank is chosen) */}
      {bank.bankPreset === 'custom' && (
        <div className="mb-3.5">
          <label
            htmlFor="custom-bank-name-input"
            className="block text-xs font-bold text-[var(--md-primary)] mb-1.5"
          >
            Custom Bank / Institution Name
          </label>
          <input
            id="custom-bank-name-input"
            type="text"
            value={bank.customBankName}
            onChange={(e) => onUpdateBank({ customBankName: e.target.value })}
            placeholder="e.g., LandBank, Metrobank, CIMB Bank PH, Tonik"
            className="w-full rounded-2xl border-2 border-[var(--md-primary)]/60 bg-[var(--md-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] transition-colors"
          />
        </div>
      )}

      {/* Dedicated Payee Account Name & Account / Mobile Number Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="payee-account-name-input"
            className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
          >
            Payee Account Name
          </label>
          <input
            id="payee-account-name-input"
            type="text"
            value={bank.accountName}
            onChange={(e) => onUpdateBank({ accountName: e.target.value })}
            placeholder="Maria Clara Santos"
            className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="payee-account-number-input"
            className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
          >
            {selectedBankMeta.accountLabel}
          </label>
          <input
            id="payee-account-number-input"
            type="text"
            value={bank.accountNumber}
            onChange={(e) => onUpdateBank({ accountNumber: e.target.value })}
            placeholder={selectedBankMeta.accountPlaceholder}
            className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm font-bold font-mono-num text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="remittance-note-input"
            className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
          >
            Remittance Note / Branch (Optional)
          </label>
          <input
            id="remittance-note-input"
            type="text"
            value={bank.remittanceNote}
            onChange={(e) => onUpdateBank({ remittanceNote: e.target.value })}
            placeholder="InstaPay / QR Ph Transfer Preferred · Send transfer slip via email"
            className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
          />
        </div>
      </div>

      {/* Hairline Divider */}
      <hr className="my-5 border-[var(--md-outline-variant)]/50" />

      {/* Smart QR Ph / InstaPay Upload & Cropper Controls */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Square Thumbnail Preview */}
        <div className="shrink-0">
          {qrCroppedDataUrl ? (
            <div className="h-24 w-24 rounded-2xl bg-white p-1.5 border border-[var(--md-outline-variant)] shadow-sm flex items-center justify-center overflow-hidden">
              <img
                src={qrCroppedDataUrl}
                alt="Cropped QR Ph remittance code"
                className="h-full w-full object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="h-24 w-24 rounded-2xl border border-dashed border-[var(--md-outline)]/60 bg-[var(--md-surface)] flex flex-col items-center justify-center text-[var(--md-on-surface-variant)] gap-1">
              <QrCode className="h-6 w-6 opacity-50" aria-hidden="true" />
              <span className="text-[10px] font-semibold">No QR</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <div>
            <h3 className="text-sm font-bold text-[var(--md-on-surface)]">
              Smart QR Ph / InstaPay Cropper
            </h3>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5 leading-relaxed">
              Upload any phone screenshot from GCash, Maya, MariBank, GoTyme, or BPI — the cropper isolates a clean scannable square for accounting.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            aria-label="Upload QR Ph or InstaPay image"
            className="sr-only"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="m3-spring m3-focus inline-flex items-center gap-1.5 rounded-full bg-[var(--md-primary-container)] px-4 py-2 text-xs font-bold text-[var(--md-on-primary-container)] hover:brightness-95 dark:hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Upload QR Image</span>
            </button>

            {hasRawQr && (
              <button
                type="button"
                onClick={onOpenCropper}
                className="m3-spring m3-focus inline-flex items-center gap-1.5 rounded-full bg-[var(--md-secondary-container)] px-4 py-2 text-xs font-bold text-[var(--md-on-secondary-container)] hover:brightness-95 dark:hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Crop className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Adjust / Crop QR</span>
              </button>
            )}

            {!qrCroppedDataUrl && (
              <button
                type="button"
                onClick={onLoadDemoQr}
                className="m3-focus inline-flex items-center gap-1.5 rounded-full border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2 text-xs font-bold text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)] transition-colors cursor-pointer whitespace-nowrap"
              >
                <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Load Demo QR</span>
              </button>
            )}

            {qrCroppedDataUrl && (
              <button
                type="button"
                onClick={onRemoveQr}
                className="m3-focus inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-[var(--md-error)] hover:bg-[var(--md-error-container)] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
