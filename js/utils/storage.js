/**
 * storage.js — localStorage persistence helpers
 */

const PREFIX = 'tpe_'; // Travel Planning Engine

/**
 * Save a value to localStorage.
 * @param {string} key
 * @param {*} value
 */
export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('[storage] Could not save:', key, e);
  }
}

/**
 * Load a value from localStorage.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Remove a key from localStorage.
 * @param {string} key
 */
export function remove(key) {
  localStorage.removeItem(PREFIX + key);
}

/**
 * Clear all Travel Planning Engine data.
 */
export function clearAll() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

/** Known storage keys */
export const KEYS = {
  PREFERENCES:  'preferences',
  ITINERARY:    'itinerary',
  ALERTS:       'alerts',
  THEME:        'theme',
  WEATHER_CACHE:'weather_cache',
};

/** Weather cache TTL in ms (30 minutes) */
const WEATHER_TTL = 30 * 60 * 1000;

/**
 * Cache weather data with timestamp.
 * @param {string} cacheKey  e.g. "paris_2026-06-01"
 * @param {*} data
 */
export function cacheWeather(cacheKey, data) {
  const store = load(KEYS.WEATHER_CACHE, {});
  store[cacheKey] = { data, ts: Date.now() };
  save(KEYS.WEATHER_CACHE, store);
}

/**
 * Get cached weather if still fresh.
 * @param {string} cacheKey
 * @returns {*|null}
 */
export function getCachedWeather(cacheKey) {
  const store = load(KEYS.WEATHER_CACHE, {});
  const entry = store[cacheKey];
  if (!entry) return null;
  if (Date.now() - entry.ts > WEATHER_TTL) return null;
  return entry.data;
}
