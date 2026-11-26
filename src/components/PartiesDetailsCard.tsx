import { useRef } from 'react';
import { PenTool, Trash2, Upload } from 'lucide-react';

interface PartiesDetailsCardProps {
  trainerName: string;
  trainerTin: string;
  trainerContact: string;
  signatureDataUrl: string | null;
  clientName: string;
  clientAddress: string;
  clientAttention: string;
  traineeCount: number;
  onChangeField: (
    field:
      | 'trainerName'
      | 'trainerTin'
      | 'trainerContact'
      | 'clientName'
      | 'clientAddress'
      | 'clientAttention'
      | 'traineeCount',
    value: string | number
  ) => void;
  onSignatureSelected: (dataUrl: string) => void;
  onRemoveSignature: () => void;
}

export function PartiesDetailsCard({
  trainerName,
  trainerTin,
  trainerContact,
  signatureDataUrl,
  clientName,
  clientAddress,
  clientAttention,
  traineeCount,
  onChangeField,
  onSignatureSelected,
  onRemoveSignature,
}: PartiesDetailsCardProps) {
  const sigInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSignatureSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section
      id="section-parties"
      aria-labelledby="heading-parties"
      className="rounded-[28px] bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)]/70 p-5 sm:p-6 transition-colors"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2
          id="heading-parties"
          className="font-display text-lg font-bold tracking-tight text-[var(--md-on-surface)]"
        >
          02. Trainer &amp; Institution Details
        </h2>
        <span className="text-xs font-medium text-[var(--md-on-surface-variant)]">
          Payee &amp; Bill To
        </span>
      </div>
      <p className="text-xs sm:text-sm text-[var(--md-on-surface-variant)] mb-5">
        Identify the Lead Trainer, optional e-signature, and the commissioning Training Center for statement signatories.
      </p>

      {/* Sub-section A: Trainer (Payee) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-[var(--md-primary)]">
            Trainer (Payee)
          </span>
          <span className="text-[var(--md-on-surface-variant)]">
            Lead Competency Trainer
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label
              htmlFor="trainer-name-input"
              className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
            >
              Trainer Full Name
            </label>
            <input
              id="trainer-name-input"
              type="text"
              value={trainerName}
              onChange={(e) => onChangeField('trainerName', e.target.value)}
              placeholder="Maria Clara Santos, LPT"
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="trainer-tin-input"
              className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
            >
              TIN (Tax Identification No.)
            </label>
            <input
              id="trainer-tin-input"
              type="text"
              value={trainerTin}
              onChange={(e) => onChangeField('trainerTin', e.target.value)}
              placeholder="248-910-442-000"
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm font-mono-num text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="trainer-contact-input"
              className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
            >
              Contact / Email
            </label>
            <input
              id="trainer-contact-input"
              type="text"
              value={trainerContact}
              onChange={(e) => onChangeField('trainerContact', e.target.value)}
              placeholder="mcsantos.trainer@email.com"
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          </div>

          {/* Optional Transparent PNG E-Signature Upload */}
          <div className="sm:col-span-2 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--md-on-surface-variant)]">
                <PenTool className="h-3.5 w-3.5 text-[var(--md-primary)]" aria-hidden="true" />
                <span>Trainer E-Signature (Optional PNG)</span>
              </span>
              {signatureDataUrl && (
                <button
                  type="button"
                  onClick={onRemoveSignature}
                  className="m3-focus inline-flex items-center gap-1 text-xs font-bold text-[var(--md-error)] hover:underline cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <input
              ref={sigInputRef}
              id="trainer-signature-input"
              type="file"
              accept="image/png,image/webp,image/svg+xml,image/jpeg"
              className="hidden"
              onChange={(e) => {
                handleFileChange(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            {signatureDataUrl ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] p-3">
                <div className="flex items-center justify-center rounded-xl bg-white px-4 py-2 border border-slate-200 min-w-[140px]">
                  <img
                    src={signatureDataUrl}
                    alt="Uploaded trainer e-signature preview"
                    className="max-h-10 max-w-[160px] object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => sigInputRef.current?.click()}
                  className="m3-focus inline-flex items-center gap-1.5 rounded-full bg-[var(--md-secondary-container)] px-3.5 py-1.5 text-xs font-bold text-[var(--md-on-secondary-container)] hover:brightness-95 dark:hover:brightness-110 transition-all cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Replace PNG</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => sigInputRef.current?.click()}
                className="m3-focus w-full flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--md-outline-variant)] bg-[var(--md-surface)]/70 px-3.5 py-2.5 text-left hover:bg-[var(--md-surface-container)] transition-colors cursor-pointer"
              >
                <span className="text-xs text-[var(--md-on-surface-variant)]">
                  Upload transparent PNG signature to stamp above the Trainer signatory line
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--md-primary-container)] px-3 py-1 text-[11px] font-bold text-[var(--md-on-primary-container)] shrink-0">
                  <Upload className="h-3 w-3" aria-hidden="true" />
                  <span>Upload</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hairline Divider */}
      <hr className="my-5 border-[var(--md-outline-variant)]/50" />

      {/* Sub-section B: Training Institution / Client (Bill To) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-[var(--md-primary)]">
            Training Institution (Bill To)
          </span>
          <span className="text-[var(--md-on-surface-variant)]">
            Provider Academy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label
              htmlFor="client-name-input"
              className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
            >
              Training Center / Academy Name
            </label>
            <input
              id="client-name-input"
              type="text"
              value={clientName}
              onChange={(e) => onChangeField('clientName', e.target.value)}
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="client-address-input"
              className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
            >
              Institution Address
            </label>
            <input
              id="client-address-input"
              type="text"
              value={clientAddress}
              onChange={(e) => onChangeField('clientAddress', e.target.value)}
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="client-attention-input"
              className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
            >
              Attention / Coordinator
            </label>
            <input
              id="client-attention-input"
              type="text"
              value={clientAttention}
              onChange={(e) => onChangeField('clientAttention', e.target.value)}
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="trainee-count-input"
              className="block text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1.5"
            >
              No. of Trainees / Scholars
            </label>
            <input
              id="trainee-count-input"
              type="number"
              min={1}
              max={500}
              value={traineeCount}
              onChange={(e) =>
                onChangeField('traineeCount', Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="w-full rounded-2xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] px-3.5 py-2.5 text-sm font-mono-num font-bold text-[var(--md-on-surface)] outline-none focus:border-[var(--md-primary)] focus:ring-2 focus:ring-[var(--md-primary)]/20 transition-all"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
