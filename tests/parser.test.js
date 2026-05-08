import { test } from 'node:test';
import assert from 'node:assert';
import { parsePreferences, validateStep } from '../public/js/engine/parser.js';

test('Parser: Validates basic form preferences', () => {
  const validRaw = {
    cities: [{ name: 'Paris', nights: 3 }],
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    budget: 2000,
    currency: 'USD',
    style: 'cultural',
    groupSize: 2,
    flightClass: 'economy',
    interests: ['museums', 'food']
  };

  const prefs = parsePreferences(validRaw);
  assert.strictEqual(prefs.totalDays, 4);
  assert.strictEqual(prefs.cities[0].nights, 4);
  assert.strictEqual(prefs.budget.usd, 2000);
});

test('Parser: Throws error when missing destinations', () => {
  assert.throws(() => {
    parsePreferences({
      cities: [],
      startDate: '2026-08-01',
      endDate: '2026-08-05'
    });
  }, /At least one destination is required/);
});

test('Parser: Step 1 validation logic', () => {
  const step1Valid = validateStep(1, {
    cities: [{ name: 'Paris', nights: 3 }],
    startDate: '2026-08-01',
    endDate: '2026-08-05'
  });
  assert.strictEqual(step1Valid.valid, true);

  const step1Invalid = validateStep(1, {
    cities: [],
    startDate: '2026-08-01',
    endDate: '2026-08-05'
  });
  assert.strictEqual(step1Invalid.valid, false);
});
