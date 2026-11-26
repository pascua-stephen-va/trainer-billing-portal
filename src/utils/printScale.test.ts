import test from 'node:test';
import assert from 'node:assert/strict';
import {
  A4_PRINTABLE_HEIGHT_PX,
  A4_PRINTABLE_WIDTH_PX,
  MIN_PRINT_SCALE,
  getPrintDensity,
  solveSinglePagePrintScale,
} from './printScale';

test('getPrintDensity escalates cleanly from normal to compact to ultra for 4 batches and reimbursements', () => {
  assert.equal(getPrintDensity(1, 1, false), 'normal');
  assert.equal(getPrintDensity(1, 2, false), 'normal');
  assert.equal(getPrintDensity(2, 1, false), 'compact');
  assert.equal(getPrintDensity(1, 4, false), 'compact');
  assert.equal(getPrintDensity(4, 0, false), 'ultra');
  assert.equal(getPrintDensity(4, 5, true), 'ultra');
  assert.equal(getPrintDensity(3, 3, true), 'ultra');
});

test('solveSinglePagePrintScale returns scale=1 when natural height fits within 1 A4 page', () => {
  const result = solveSinglePagePrintScale(() => 940);
  assert.equal(result.scale, 1);
  assert.equal(result.innerWidthPercent, 100);
  assert.equal(result.frameHeightPx, 940);
});

test('solveSinglePagePrintScale shrinks tall 4-batch + multi-item content to strictly fit 1 A4 page at full width', () => {
  // Simulate realistic wrapped text height that decreases modestly as width increases
  const measureSimulated = (widthPx: number) => {
    const fixedHeight = 760;
    const textArea = 560 * A4_PRINTABLE_WIDTH_PX;
    return fixedHeight + textArea / widthPx;
  };

  const result = solveSinglePagePrintScale(
    measureSimulated,
    A4_PRINTABLE_WIDTH_PX,
    A4_PRINTABLE_HEIGHT_PX
  );

  assert.ok(result.scale < 1, 'Expected scale < 1 for overflowing content');
  assert.ok(result.scale >= MIN_PRINT_SCALE, 'Expected scale >= MIN_PRINT_SCALE');

  const finalWidth = Math.round(A4_PRINTABLE_WIDTH_PX / result.scale);
  const finalNaturalHeight = measureSimulated(finalWidth);
  assert.ok(
    finalNaturalHeight * result.scale <= A4_PRINTABLE_HEIGHT_PX,
    `Scaled height ${finalNaturalHeight * result.scale} must not exceed ${A4_PRINTABLE_HEIGHT_PX}`
  );
  assert.ok(result.frameHeightPx <= A4_PRINTABLE_HEIGHT_PX);
  assert.ok(
    Math.abs((result.innerWidthPercent / 100) * result.scale - 1) < 0.002,
    'Inner width percent * scale must fill 100% of A4 printable width'
  );
});

test('solveSinglePagePrintScale clamps extreme overflow safely at MIN_PRINT_SCALE and handles invalid measurements', () => {
  const extreme = solveSinglePagePrintScale(() => 5000);
  assert.equal(extreme.scale, MIN_PRINT_SCALE);
  assert.ok(extreme.frameHeightPx <= A4_PRINTABLE_HEIGHT_PX);

  const invalid = solveSinglePagePrintScale(() => 0);
  assert.equal(invalid.scale, 1);
  assert.equal(invalid.innerWidthPercent, 100);
});
