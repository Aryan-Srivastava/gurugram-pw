import { test } from 'node:test';
import assert from 'node:assert';
import { getBudgetStatus, getBudgetPct } from '../public/js/engine/budget.js';

test('Budget: Status checks limits correctly', () => {
  assert.strictEqual(getBudgetStatus(500, 1000), 'ok');
  assert.strictEqual(getBudgetStatus(900, 1000), 'warning');
  assert.strictEqual(getBudgetStatus(1100, 1000), 'danger');
});

test('Budget: Percentage caps at 100', () => {
  assert.strictEqual(getBudgetPct(500, 1000), 50);
  assert.strictEqual(getBudgetPct(1500, 1000), 100);
  assert.strictEqual(getBudgetPct(0, 1000), 0);
});
