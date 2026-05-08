import assert from 'assert';
import { parsePreferences, validateStep } from '../public/js/engine/parser.js';

// Setup mock for global Date
const origDate = global.Date;

// Basic validation test
const validRaw = {
  cities: [{ name: 'Paris', nights: 3 }],
  startDate: '2026-08-01',
  endDate: '2026-08-05', // 4 nights total
  budget: 2000,
  currency: 'USD',
  style: 'cultural',
  groupSize: 2,
  flightClass: 'economy',
  interests: ['museums', 'food']
};

try {
  // Test 1: Parser outputs normalized nights correctly (4 total nights / 1 city = 4 nights)
  const prefs = parsePreferences(validRaw);
  assert.strictEqual(prefs.totalDays, 4, 'Total days should be 4');
  assert.strictEqual(prefs.cities[0].nights, 4, 'City nights should scale to 4');
  assert.strictEqual(prefs.budget.usd, 2000, 'Budget should be 2000');

  // Test 2: Missing data validation
  assert.throws(() => {
    parsePreferences({ ...validRaw, cities: [] });
  }, /At least one destination is required/);

  // Test 3: validateStep logic
  const step1Valid = validateStep(1, validRaw);
  assert.strictEqual(step1Valid.valid, true, 'Step 1 should be valid with correct data');

  console.log('✅ parser.test.js passed');
} catch (err) {
  console.error('❌ parser.test.js failed:', err.message);
  process.exit(1);
}
