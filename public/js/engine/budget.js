/**
 * budget.js — Budget allocation tracking and overage detection
 */

import { allocateBudget, formatCurrency } from '../utils/currency.js';
import { AppState, setState } from '../state.js';

/**
 * Initialize the budget tracker from a generated itinerary.
 * @param {UserPreferences} prefs
 * @param {ItineraryDay[]} days
 */
export function initBudget(prefs, days) {
  const alloc    = allocateBudget(prefs.budget.usd * (prefs.groupSize ?? 1));
  const spent    = computeSpent(days, prefs.groupSize ?? 1);
  const currency = prefs.budget.currency;

  setState({
    budget: {
      total:     prefs.budget.usd * (prefs.groupSize ?? 1),
      spent:     spent.total,
      currency,
      alloc,
      breakdown: spent.breakdown,
      perPerson: prefs.budget.usd,
      groupSize: prefs.groupSize ?? 1,
    },
  });
}

/**
 * Recompute spent totals from current itinerary.
 * @param {ItineraryDay[]} days
 * @param {number} groupSize
 * @returns {{ total: number, breakdown: Record<string,number> }}
 */
export function computeSpent(days, groupSize = 1) {
  const breakdown = { flights: 0, hotels: 0, activities: 0, food: 0, buffer: 0 };

  days.forEach((day) => {
    breakdown.hotels     += (day.spend?.hotel      ?? 0) * groupSize;
    breakdown.activities += (day.spend?.activities ?? 0) * groupSize;
    breakdown.food       += (day.spend?.food       ?? 0) * groupSize;
    if (day.flight?.price) {
      breakdown.flights  += day.flight.price * groupSize;
    }
  });

  breakdown.buffer = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0) * 0.05);
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total, breakdown };
}

/**
 * Check if budget is being exceeded and return severity.
 * @param {number} spent
 * @param {number} total
 * @returns {'ok'|'warning'|'danger'}
 */
export function getBudgetStatus(spent, total) {
  const pct = spent / total;
  if (pct < 0.85) return 'ok';
  if (pct < 1.0)  return 'warning';
  return 'danger';
}

/**
 * Get budget progress percentage (capped at 100).
 * @param {number} spent
 * @param {number} total
 * @returns {number}
 */
export function getBudgetPct(spent, total) {
  return Math.min(100, Math.round((spent / total) * 100));
}

/**
 * Get budget category breakdown as array for rendering.
 * @param {object} breakdown  { flights, hotels, activities, food, buffer }
 * @param {object} alloc      Budget allocation targets
 * @param {string} currency
 * @returns {Array<{label, amount, target, pct, color}>}
 */
export function getBreakdownRows(breakdown, alloc, currency = 'USD') {
  const COLORS = {
    flights:    '#6366f1',
    hotels:     '#06b6d4',
    activities: '#10b981',
    food:       '#f59e0b',
    buffer:     '#8b5cf6',
  };
  const LABELS = {
    flights:    '✈️ Flights',
    hotels:     '🏨 Hotels',
    activities: '🎯 Activities',
    food:       '🍽️ Food',
    buffer:     '💰 Buffer',
  };

  return Object.entries(breakdown).map(([key, amount]) => ({
    key,
    label:  LABELS[key]  ?? key,
    amount,
    target: alloc[key]   ?? 0,
    pct:    alloc[key] ? Math.min(100, Math.round((amount / alloc[key]) * 100)) : 0,
    color:  COLORS[key]  ?? '#94a3b8',
    formatted: formatCurrency(amount, currency),
  }));
}
