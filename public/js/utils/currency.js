/**
 * currency.js — Budget formatting & currency conversion helpers
 */

// Approximate exchange rates from USD (updated periodically; free tier)
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.89,
  INR: 83.1,
  SGD: 1.34,
  AED: 3.67,
  THB: 35.1,
  IDR: 15700,
  BRL: 4.97,
  MXN: 17.1,
  TRY: 32.0,
  ZAR: 18.5,
  SEK: 10.5,
  NOK: 10.6,
  DKK: 6.89,
  PLN: 4.02,
};

let _rates = { ...FALLBACK_RATES };
let _lastFetched = null;

/**
 * Attempt to fetch live rates; fall back to static table.
 * @param {string} base  Currency code to use as base (default: USD)
 */
export async function fetchRates(base = 'USD') {
  try {
    // Free ExchangeRate API (no key required for basic endpoint)
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${base}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) throw new Error('rate fetch failed');
    const data = await res.json();
    if (data.result === 'success') {
      _rates = data.rates;
      _lastFetched = Date.now();
    }
  } catch {
    // Silently fall back to FALLBACK_RATES
    _rates = { ...FALLBACK_RATES };
  }
}

/**
 * Convert amount from one currency to another.
 * @param {number} amount
 * @param {string} from
 * @param {string} to
 * @returns {number}
 */
export function convert(amount, from = 'USD', to = 'USD') {
  if (from === to) return amount;
  const inUSD = amount / (_rates[from] ?? 1);
  return inUSD * (_rates[to] ?? 1);
}

/**
 * Format a number as currency string.
 * @param {number} amount
 * @param {string} currency
 * @param {{ compact?: boolean }} opts
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'USD', opts = {}) {
  const num = Math.round(amount);
  if (opts.compact && Math.abs(num) >= 1000) {
    const k = (num / 1000).toFixed(1);
    return `${getCurrencySymbol(currency)}${k}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Get symbol for a currency code.
 * @param {string} code
 * @returns {string}
 */
export function getCurrencySymbol(code) {
  const symbols = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$',
    CAD: 'C$', CHF: 'CHF', INR: '₹', SGD: 'S$', AED: 'د.إ',
    THB: '฿', IDR: 'Rp', BRL: 'R$', MXN: '$', TRY: '₺',
    ZAR: 'R', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł',
  };
  return symbols[code] ?? code;
}

/**
 * List of supported currencies for the selector.
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'TRY', name: 'Turkish Lira' },
];

/**
 * Get budget tier label from amount (USD).
 * @param {number} usdAmount  Per-person total budget
 * @returns {'budget'|'mid'|'luxury'}
 */
export function getBudgetTier(usdAmount) {
  if (usdAmount < 1500) return 'budget';
  if (usdAmount < 5000) return 'mid';
  return 'luxury';
}

/**
 * Budget allocation percentages.
 */
export const BUDGET_ALLOCATION = {
  flights:    0.25,
  hotels:     0.35,
  activities: 0.20,
  food:       0.15,
  buffer:     0.05,
};

/**
 * Calculate per-category budget breakdown.
 * @param {number} total
 * @returns {Record<string, number>}
 */
export function allocateBudget(total) {
  return Object.fromEntries(
    Object.entries(BUDGET_ALLOCATION).map(([k, pct]) => [k, Math.round(total * pct)])
  );
}
