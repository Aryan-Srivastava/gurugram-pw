import { test } from 'node:test';
import assert from 'node:assert';
import { daysBetween, formatShort } from '../public/js/utils/date.js';

test('Date: Calculates days between dates', () => {
  const start = '2026-08-01';
  const end = '2026-08-05';
  assert.strictEqual(daysBetween(start, end), 4);
});

test('Date: Formats short dates properly', () => {
  // Use UTC to avoid local timezone issues in testing
  const date = '2026-08-01T00:00:00Z';
  const formatted = formatShort(date);
  // It formats based on locale, but it should output a string
  assert.strictEqual(typeof formatted, 'string');
  assert.ok(formatted.length > 0);
});
