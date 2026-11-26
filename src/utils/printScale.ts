export type PrintDensity = 'normal' | 'compact' | 'ultra';

export const A4_PAGE_WIDTH_MM = 210;
export const A4_PAGE_HEIGHT_MM = 297;
export const A4_MARGIN_MM = 8;
export const CSS_PX_PER_MM = 96 / 25.4;

/**
 * Printable A4 Portrait dimensions at 96 CSS DPI with 8mm page margins:
 * - Width: (210 - 16)mm ≈ 733px
 * - Height: (297 - 16)mm ≈ 1062px, minus 22px safety buffer = 1040px
 *   so Chromium/Safari/Firefox rounding never spills onto a 2nd blank page.
 */
export const A4_PRINTABLE_WIDTH_PX = Math.floor(
  (A4_PAGE_WIDTH_MM - A4_MARGIN_MM * 2) * CSS_PX_PER_MM
);
export const A4_PRINTABLE_HEIGHT_PX =
  Math.floor((A4_PAGE_HEIGHT_MM - A4_MARGIN_MM * 2) * CSS_PX_PER_MM) - 22;

export const MIN_PRINT_SCALE = 0.42;

export interface PrintScaleSolution {
  scale: number;
  frameHeightPx: number;
  innerWidthPercent: number;
}

/**
 * Selects progressive print spacing density before applying any proportional scale,
 * keeping typography crisp and generous for 1-2 batches while tightening padding
 * smoothly for 3-4 batches and multiple line items/reimbursements.
 */
export function getPrintDensity(
  batchCount: number,
  lineItemCount: number,
  isMixedTranches: boolean
): PrintDensity {
  const safeBatches = Math.max(1, Math.floor(batchCount));
  const safeItems = Math.max(0, Math.floor(lineItemCount));
  const score =
    safeBatches * 2 + safeItems + (isMixedTranches ? safeBatches : 0);

  if (safeBatches >= 4 || score >= 10) {
    return 'ultra';
  }
  if (safeBatches >= 2 || safeItems >= 3 || score >= 6) {
    return 'compact';
  }
  return 'normal';
}

function floorScale3(raw: number): number {
  const clamped = Math.max(MIN_PRINT_SCALE, Math.min(1, raw));
  return Math.max(MIN_PRINT_SCALE, Math.floor(clamped * 1000) / 1000);
}

/**
 * Solves for the largest scale s in [MIN_PRINT_SCALE, 1] such that an invoice
 * rendered at width (targetWidthPx / s) and scaled visually by s fills 100% of
 * A4 printable width while staying strictly within targetHeightPx (1 single page).
 *
 * Uses up to 3 layout-measurement passes because widening the inner width to
 * (targetWidthPx / s) allows long batch/item descriptions to wrap onto fewer lines,
 * producing an even cleaner, larger final font size.
 */
export function solveSinglePagePrintScale(
  measureHeightAtWidth: (widthPx: number) => number,
  targetWidthPx: number = A4_PRINTABLE_WIDTH_PX,
  targetHeightPx: number = A4_PRINTABLE_HEIGHT_PX
): PrintScaleSolution {
  const h1 = measureHeightAtWidth(targetWidthPx);
  if (!Number.isFinite(h1) || h1 <= 0) {
    return {
      scale: 1,
      frameHeightPx: targetHeightPx,
      innerWidthPercent: 100,
    };
  }

  if (h1 <= targetHeightPx) {
    return {
      scale: 1,
      frameHeightPx: Math.ceil(h1),
      innerWidthPercent: 100,
    };
  }

  let scale = floorScale3(targetHeightPx / h1);
  let measuredHeight = h1;

  for (let pass = 0; pass < 3; pass++) {
    const candidateWidth = Math.round(targetWidthPx / scale);
    measuredHeight = measureHeightAtWidth(candidateWidth);

    if (!Number.isFinite(measuredHeight) || measuredHeight <= 0) {
      break;
    }

    const projectedHeight = measuredHeight * scale;
    const nextScale = floorScale3(targetHeightPx / measuredHeight);

    // If it fits cleanly and nextScale is within 0.015 of current scale, stop early
    if (
      projectedHeight <= targetHeightPx &&
      Math.abs(nextScale - scale) <= 0.015
    ) {
      break;
    }

    // Converge safely without oscillating upward into an overflow
    if (nextScale < scale) {
      scale = nextScale;
    } else {
      // Midpoint step upward when wider layout freed vertical height
      scale = floorScale3((scale + nextScale) / 2);
    }
  }

  // Final safety guarantee: never allow scaled height to exceed targetHeightPx
  const finalWidth = Math.round(targetWidthPx / scale);
  const finalMeasuredHeight = measureHeightAtWidth(finalWidth);
  if (
    Number.isFinite(finalMeasuredHeight) &&
    finalMeasuredHeight > 0 &&
    finalMeasuredHeight * scale > targetHeightPx
  ) {
    scale = floorScale3((targetHeightPx - 2) / finalMeasuredHeight);
  }

  const safeMeasured =
    Number.isFinite(finalMeasuredHeight) && finalMeasuredHeight > 0
      ? finalMeasuredHeight
      : measuredHeight;

  return {
    scale,
    frameHeightPx: Math.min(targetHeightPx, Math.ceil(safeMeasured * scale)),
    innerWidthPercent: Number((100 / scale).toFixed(3)),
  };
}
