/**
 * QR Ph / InstaPay Canvas utilities:
 * - Generates a realistic, scannable-style QR Ph demo SVG data URL (including a simulated phone screenshot mode for testing crop)
 * - Auto-focus contrast detector to find QR code bounds inside mobile banking screenshots
 * - High-DPI square cropper with zoom, pan, rotation, and optional quiet zone
 */

export interface CropParams {
  zoom: number; // 1 to 4
  offsetX: number; // -0.5 to 0.5 relative to source dimension
  offsetY: number; // -0.5 to 0.5 relative to source dimension
  rotation: number; // 0, 90, 180, 270
  quietZone: boolean;
}

export const DEFAULT_CROP_PARAMS: CropParams = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  quietZone: true,
};

/**
 * Generates a clean, crisp square QR Ph / InstaPay demo graphic as a data URL.
 */
export function generateDemoQrDataUrl(): string {
  // Deterministic 21x21 QR-like matrix with proper finder patterns and QR Ph center emblem
  const size = 21;
  const cells: string[] = [];

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  const isCenterLogo = (r: number, c: number) =>
    r >= 8 && r <= 12 && c >= 8 && c <= 12;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c) || isCenterLogo(r, c)) continue;
      // Timing patterns
      if (r === 6 || c === 6) {
        if ((r + c) % 2 === 0) {
          cells.push(`<rect x="${c * 10 + 15}" y="${r * 10 + 15}" width="10" height="10" rx="2" fill="#0f172a"/>`);
        }
        continue;
      }
      // Deterministic pseudo-random modules
      const hash = ((r * 31 + c * 17 + r * c * 7) % 11);
      if (hash < 5) {
        cells.push(`<rect x="${c * 10 + 15}" y="${r * 10 + 15}" width="10" height="10" rx="2" fill="#0f172a"/>`);
      }
    }
  }

  const finder = (x: number, y: number) => `
    <rect x="${x}" y="${y}" width="70" height="70" rx="12" fill="#0f172a"/>
    <rect x="${x + 10}" y="${y + 10}" width="50" height="50" rx="7" fill="#ffffff"/>
    <rect x="${x + 20}" y="${y + 20}" width="30" height="30" rx="4" fill="#0f172a"/>
  `;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <rect width="240" height="240" rx="16" fill="#ffffff"/>
    ${finder(15, 15)}
    ${finder(155, 15)}
    ${finder(15, 155)}
    ${cells.join('')}
    <rect x="92" y="92" width="56" height="56" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <rect x="98" y="98" width="44" height="44" rx="9" fill="#3b49df"/>
    <circle cx="111" cy="112" r="4" fill="#fbbf24"/>
    <circle cx="129" cy="112" r="4" fill="#ef4444"/>
    <text x="120" y="133" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#ffffff">QRPh</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Loads an image from a data URL into an HTMLImageElement.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load QR image'));
    img.src = src;
  });
}

/**
 * Analyzes an uploaded mobile banking screenshot to estimate where the dense
 * high-contrast QR square sits, returning suggested zoom and center offsets.
 */
export function detectQrAutoCrop(img: HTMLImageElement): CropParams {
  const sampleW = 160;
  const aspect = img.naturalHeight / Math.max(1, img.naturalWidth);
  const sampleH = Math.max(60, Math.min(360, Math.round(sampleW * aspect)));

  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ...DEFAULT_CROP_PARAMS };

  ctx.drawImage(img, 0, 0, sampleW, sampleH);
  const { data } = ctx.getImageData(0, 0, sampleW, sampleH);

  // Measure high-frequency horizontal/vertical edge density (characteristic of QR codes)
  const lum = new Float32Array(sampleW * sampleH);
  for (let i = 0; i < sampleW * sampleH; i++) {
    const idx = i * 4;
    lum[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // Scan candidate square windows to find maximum edge energy
  const minDim = Math.min(sampleW, sampleH);
  const windowSizes = [0.42, 0.56, 0.72, 0.88].map((f) => Math.max(24, Math.floor(minDim * f)));

  let bestScore = -1;
  let bestCx = sampleW / 2;
  let bestCy = sampleH / 2;
  let bestSide = minDim * 0.85;

  for (const side of windowSizes) {
    const step = Math.max(4, Math.floor(side / 8));
    for (let y = 0; y <= sampleH - side; y += step) {
      for (let x = 0; x <= sampleW - side; x += step) {
        let edges = 0;
        let samples = 0;
        for (let py = y + 2; py < y + side - 2; py += 3) {
          for (let px = x + 2; px < x + side - 2; px += 3) {
            const p = py * sampleW + px;
            const dx = Math.abs(lum[p] - lum[p + 1]);
            const dy = Math.abs(lum[p] - lum[p + sampleW]);
            if (dx > 55 || dy > 55) edges++;
            samples++;
          }
        }
        const density = samples > 0 ? edges / samples : 0;
        // Favor slightly larger windows if density is comparable so we don't crop off finder corners
        const score = density * Math.sqrt(side / minDim);
        if (score > bestScore) {
          bestScore = score;
          bestCx = x + side / 2;
          bestCy = y + side / 2;
          bestSide = side;
        }
      }
    }
  }

  // Add slight padding margin around detected QR square
  const paddedSide = Math.min(minDim, bestSide * 1.12);
  const zoom = Math.max(1, Math.min(3.5, Number((minDim / paddedSide).toFixed(2))));

  const offsetX = Math.max(-0.45, Math.min(0.45, (sampleW / 2 - bestCx) / sampleW));
  const offsetY = Math.max(-0.45, Math.min(0.45, (sampleH / 2 - bestCy) / sampleH));

  return {
    zoom,
    offsetX: Number(offsetX.toFixed(3)),
    offsetY: Number(offsetY.toFixed(3)),
    rotation: 0,
    quietZone: true,
  };
}

/**
 * Renders the cropped square QR image onto a high-DPI canvas and exports a PNG data URL.
 */
export function renderCroppedQrToDataUrl(
  img: HTMLImageElement,
  params: CropParams,
  outputSize = 512
): string {
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Crisp white background for print & QR scanner reliability
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outputSize, outputSize);

  const padding = params.quietZone ? Math.round(outputSize * 0.055) : 0;
  const drawArea = outputSize - padding * 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(padding, padding, drawArea, drawArea);
  ctx.clip();

  const imgW = img.naturalWidth || outputSize;
  const imgH = img.naturalHeight || outputSize;
  const minDim = Math.min(imgW, imgH);
  const baseScale = drawArea / minDim;
  const effectiveScale = baseScale * params.zoom;

  const centerX = outputSize / 2;
  const centerY = outputSize / 2;

  ctx.translate(centerX, centerY);
  ctx.rotate((params.rotation * Math.PI) / 180);

  const shiftX = params.offsetX * imgW * effectiveScale;
  const shiftY = params.offsetY * imgH * effectiveScale;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    -imgW * effectiveScale * 0.5 + shiftX,
    -imgH * effectiveScale * 0.5 + shiftY,
    imgW * effectiveScale,
    imgH * effectiveScale
  );

  ctx.restore();
  return canvas.toDataURL('image/png');
}
