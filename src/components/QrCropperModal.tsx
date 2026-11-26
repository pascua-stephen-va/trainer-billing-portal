import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  Check,
  Focus,
  RotateCw,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  DEFAULT_CROP_PARAMS,
  detectQrAutoCrop,
  loadImage,
  renderCroppedQrToDataUrl,
} from '../utils/qrCanvas';
import type { CropParams } from '../utils/qrCanvas';

interface QrCropperModalProps {
  isOpen: boolean;
  rawImageDataUrl: string | null;
  onApply: (croppedDataUrl: string) => void;
  onClose: () => void;
}

export function QrCropperModal({
  isOpen,
  rawImageDataUrl,
  onApply,
  onClose,
}: QrCropperModalProps) {
  const [params, setParams] = useState<CropParams>(DEFAULT_CROP_PARAMS);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Load image and run auto-focus detection when modal opens with a new raw image
  useEffect(() => {
    if (!isOpen || !rawImageDataUrl) return;
    let cancelled = false;

    loadImage(rawImageDataUrl)
      .then((img) => {
        if (cancelled) return;
        setLoadedImg(img);
        // Only auto-crop if image is non-square (e.g. phone screenshot), else start centered
        const aspectRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
        const isRoughlySquare = aspectRatio > 0.85 && aspectRatio < 1.18;
        const initial = isRoughlySquare
          ? { ...DEFAULT_CROP_PARAMS }
          : detectQrAutoCrop(img);
        setParams(initial);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedImg(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, rawImageDataUrl]);

  // Re-render square canvas preview whenever params or image change
  useEffect(() => {
    if (!loadedImg || !isOpen) return;
    const url = renderCroppedQrToDataUrl(loadedImg, params, 360);
    setPreviewDataUrl(url);
  }, [loadedImg, params, isOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !rawImageDataUrl) return null;

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startOffsetX: params.offsetX,
      startOffsetY: params.offsetY,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartRef.current.clientX) / Math.max(1, rect.width * params.zoom);
    const dy = (e.clientY - dragStartRef.current.clientY) / Math.max(1, rect.height * params.zoom);

    setParams((prev) => ({
      ...prev,
      offsetX: Math.max(-0.6, Math.min(0.6, Number((dragStartRef.current!.startOffsetX + dx).toFixed(3)))),
      offsetY: Math.max(-0.6, Math.min(0.6, Number((dragStartRef.current!.startOffsetY + dy).toFixed(3)))),
    }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleAutoFocus = () => {
    if (!loadedImg) return;
    setParams(detectQrAutoCrop(loadedImg));
  };

  const handleRotate = () => {
    setParams((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  const handleReset = () => {
    setParams({ ...DEFAULT_CROP_PARAMS });
  };

  const handleApply = () => {
    if (!loadedImg) return;
    const highRes = renderCroppedQrToDataUrl(loadedImg, params, 512);
    onApply(highRes);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-cropper-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-2xl rounded-[28px] bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--md-outline-variant)]/60">
          <div>
            <h2
              id="qr-cropper-title"
              className="font-display text-lg font-extrabold text-[var(--md-on-surface)]"
            >
              Smart QR Ph / InstaPay Cropper
            </h2>
            <p className="text-xs text-[var(--md-on-surface-variant)]">
              Drag to center your QR code and adjust zoom for clean print scanning.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR cropper"
            className="m3-focus flex h-10 w-10 items-center justify-center rounded-full text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Interactive Drag/Crop Viewport */}
          <div className="sm:col-span-7 flex flex-col items-center gap-3">
            <div
              ref={stageRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              data-testid="qr-crop-stage"
              className={`relative w-full max-w-[300px] aspect-square rounded-[24px] bg-white border-2 border-[var(--md-primary)] overflow-hidden select-none touch-none shadow-inner ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Interactive QR crop preview"
                  draggable={false}
                  className="h-full w-full object-contain pointer-events-none"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  Loading image...
                </div>
              )}

              {/* Subtle Corner Finder Guide Overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-4 border border-dashed border-indigo-500/45 rounded-xl"
              />
            </div>

            <span className="text-[11px] font-medium text-[var(--md-on-surface-variant)]">
              Drag inside the square to pan · 1:1 print output
            </span>
          </div>

          {/* Controls */}
          <div className="sm:col-span-5 space-y-4">
            {/* Zoom Control */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <label htmlFor="qr-zoom-slider" className="text-[var(--md-on-surface)]">
                  Zoom Level
                </label>
                <span className="font-mono-num text-[var(--md-primary)]">
                  {params.zoom.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4 text-[var(--md-on-surface-variant)] shrink-0" aria-hidden="true" />
                <input
                  id="qr-zoom-slider"
                  type="range"
                  min={1}
                  max={4}
                  step={0.05}
                  value={params.zoom}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[var(--md-primary)] cursor-pointer"
                />
                <ZoomIn className="h-4 w-4 text-[var(--md-on-surface-variant)] shrink-0" aria-hidden="true" />
              </div>
            </div>

            {/* Utility Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAutoFocus}
                className="m3-focus inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--md-primary-container)] px-3 py-2 text-xs font-bold text-[var(--md-on-primary-container)] hover:brightness-95 dark:hover:brightness-110 transition-all cursor-pointer"
              >
                <Focus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Auto-Focus</span>
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="m3-focus inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--md-surface-container)] px-3 py-2 text-xs font-bold text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-high)] transition-all cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Rotate 90°</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="m3-focus w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--md-outline-variant)] px-3 py-2 text-xs font-bold text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container)] transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset Frame</span>
            </button>

            {/* Quiet Zone Toggle */}
            <label className="flex items-center gap-2.5 rounded-2xl bg-[var(--md-surface-container)] px-3.5 py-2.5 text-xs font-semibold text-[var(--md-on-surface)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={params.quietZone}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, quietZone: e.target.checked }))
                }
                className="h-4 w-4 rounded accent-[var(--md-primary)] cursor-pointer"
              />
              <span>Add white quiet-zone border</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--md-outline-variant)]/60 bg-[var(--md-surface-container)]/50">
          <button
            type="button"
            onClick={onClose}
            className="m3-focus rounded-full px-5 py-2.5 text-xs sm:text-sm font-bold text-[var(--md-on-surface-variant)] hover:bg-[var(--md-surface-container-high)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="m3-spring m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-primary)] px-6 py-2.5 text-xs sm:text-sm font-bold text-[var(--md-on-primary)] shadow-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>Apply Cropped QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
