import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextIconRotation,
  getNextManualTheme,
  getThemeStorageAction,
  parseStoredTheme,
  resolveTheme,
} from './themeLogic';

test('parseStoredTheme handles manual overrides, legacy auto, and empty values', () => {
  assert.equal(parseStoredTheme('dark'), 'dark');
  assert.equal(parseStoredTheme('light'), 'light');
  assert.equal(parseStoredTheme('auto'), 'system');
  assert.equal(parseStoredTheme('system'), 'system');
  assert.equal(parseStoredTheme(null), 'system');
  assert.equal(parseStoredTheme('invalid-value'), 'system');
});

test('resolveTheme follows OS preference when set to system and honors manual overrides', () => {
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('getNextManualTheme flips from currently resolved theme', () => {
  assert.equal(getNextManualTheme('light'), 'dark');
  assert.equal(getNextManualTheme('dark'), 'light');
});

test('getNextIconRotation adds 180 degrees only when resolved theme changes', () => {
  assert.equal(getNextIconRotation(0, 'light', 'dark'), 180);
  assert.equal(getNextIconRotation(180, 'dark', 'light'), 360);
  assert.equal(getNextIconRotation(360, 'light', 'light'), 360);
});

test('getThemeStorageAction sets manual overrides and removes key when syncing with OS', () => {
  assert.deepEqual(getThemeStorageAction('dark'), { action: 'set', value: 'dark' });
  assert.deepEqual(getThemeStorageAction('light'), { action: 'set', value: 'light' });
  assert.deepEqual(getThemeStorageAction('system'), { action: 'remove' });
});
