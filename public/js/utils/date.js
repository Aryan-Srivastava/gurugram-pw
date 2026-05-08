/**
 * date.js — Date utility helpers (no moment.js dependency)
 */

/**
 * Format a date string to a human-readable string.
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} opts
 * @returns {string}
 */
export function formatDate(date, opts = {}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaults = { weekday: 'short', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-US', { ...defaults, ...opts });
}

/**
 * Format a date to a short label like "Mon, 3 Jun"
 * @param {string|Date} date
 * @returns {string}
 */
export function formatShort(date) {
  return formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Format a date to a long label like "Monday, June 3, 2026"
 * @param {string|Date} date
 * @returns {string}
 */
export function formatLong(date) {
  return formatDate(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Add days to a date.
 * @param {string|Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get array of date strings between start and end (inclusive).
 * @param {string} startDate
 * @param {string} endDate
 * @returns {string[]}
 */
export function getDateRange(startDate, endDate) {
  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Get day-of-week label.
 * @param {string|Date} date
 * @returns {string}
 */
export function getDayLabel(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Return number of days between two date strings.
 * @param {string} start
 * @param {string} end
 * @returns {number}
 */
export function daysBetween(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Get relative time label ("2 hours ago", "Just now")
 * @param {Date|string} date
 * @returns {string}
 */
export function timeAgo(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60)  return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60)  return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return `${hr}h ago`;
  return formatShort(d);
}

/**
 * Format time from ISO string, e.g. "14:35"
 * @param {string} isoString
 * @returns {string}
 */
export function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Check if date is in the past.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isPast(dateStr) {
  return new Date(dateStr) < new Date();
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string}
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get min date for trip start (today + 1)
 * @returns {string}
 */
export function minTripDate() {
  return addDays(new Date(), 1).toISOString().split('T')[0];
}
