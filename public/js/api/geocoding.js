/**
 * geocoding.js — City name → {lat, lon, country} via Open-Meteo Geocoding API
 * No API key required. https://geocoding-api.open-meteo.com/
 */

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Search for a city by name. Returns first matching result.
 * @param {string} cityName
 * @returns {Promise<{name, country, lat, lon, timezone, countryCode} | null>}
 */
export async function geocodeCity(cityName) {
  try {
    const url = `${BASE_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const r = data.results[0];
    return {
      name:        r.name,
      country:     r.country,
      countryCode: r.country_code,
      lat:         r.latitude,
      lon:         r.longitude,
      timezone:    r.timezone,
      admin1:      r.admin1 ?? null,
    };
  } catch (e) {
    console.warn('[geocoding] Failed for', cityName, e);
    return getFallbackCity(cityName);
  }
}

/**
 * Geocode multiple cities in parallel (with concurrency limit).
 * @param {string[]} cityNames
 * @returns {Promise<Array<{name, country, lat, lon} | null>>}
 */
export async function geocodeCities(cityNames) {
  return Promise.all(cityNames.map(geocodeCity));
}

/**
 * Fallback city data for popular destinations (offline safety net).
 */
const CITY_FALLBACKS = {
  paris:      { name: 'Paris',     country: 'France',       countryCode: 'FR', lat: 48.8566, lon: 2.3522,   timezone: 'Europe/Paris' },
  tokyo:      { name: 'Tokyo',     country: 'Japan',        countryCode: 'JP', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo' },
  'new york': { name: 'New York',  country: 'USA',          countryCode: 'US', lat: 40.7128, lon: -74.0060, timezone: 'America/New_York' },
  rome:       { name: 'Rome',      country: 'Italy',        countryCode: 'IT', lat: 41.9028, lon: 12.4964,  timezone: 'Europe/Rome' },
  barcelona:  { name: 'Barcelona', country: 'Spain',        countryCode: 'ES', lat: 41.3851, lon: 2.1734,   timezone: 'Europe/Madrid' },
  london:     { name: 'London',    country: 'UK',           countryCode: 'GB', lat: 51.5074, lon: -0.1278,  timezone: 'Europe/London' },
  amsterdam:  { name: 'Amsterdam', country: 'Netherlands',  countryCode: 'NL', lat: 52.3676, lon: 4.9041,   timezone: 'Europe/Amsterdam' },
  prague:     { name: 'Prague',    country: 'Czech Republic',countryCode: 'CZ', lat: 50.0755, lon: 14.4378,  timezone: 'Europe/Prague' },
  bali:       { name: 'Bali',      country: 'Indonesia',    countryCode: 'ID', lat: -8.4095, lon: 115.1889, timezone: 'Asia/Makassar' },
  bangkok:    { name: 'Bangkok',   country: 'Thailand',     countryCode: 'TH', lat: 13.7563, lon: 100.5018, timezone: 'Asia/Bangkok' },
  dubai:      { name: 'Dubai',     country: 'UAE',          countryCode: 'AE', lat: 25.2048, lon: 55.2708,  timezone: 'Asia/Dubai' },
  sydney:     { name: 'Sydney',    country: 'Australia',    countryCode: 'AU', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney' },
  istanbul:   { name: 'Istanbul',  country: 'Turkey',       countryCode: 'TR', lat: 41.0082, lon: 28.9784,  timezone: 'Europe/Istanbul' },
  lisbon:     { name: 'Lisbon',    country: 'Portugal',     countryCode: 'PT', lat: 38.7169, lon: -9.1395,  timezone: 'Europe/Lisbon' },
  vienna:     { name: 'Vienna',    country: 'Austria',      countryCode: 'AT', lat: 48.2082, lon: 16.3738,  timezone: 'Europe/Vienna' },
  berlin:     { name: 'Berlin',    country: 'Germany',      countryCode: 'DE', lat: 52.5200, lon: 13.4050,  timezone: 'Europe/Berlin' },
  singapore:  { name: 'Singapore', country: 'Singapore',    countryCode: 'SG', lat: 1.3521,  lon: 103.8198, timezone: 'Asia/Singapore' },
  marrakech:  { name: 'Marrakech', country: 'Morocco',      countryCode: 'MA', lat: 31.6295, lon: -7.9811,  timezone: 'Africa/Casablanca' },
  cairo:      { name: 'Cairo',     country: 'Egypt',        countryCode: 'EG', lat: 30.0444, lon: 31.2357,  timezone: 'Africa/Cairo' },
  kyoto:      { name: 'Kyoto',     country: 'Japan',        countryCode: 'JP', lat: 35.0116, lon: 135.7681, timezone: 'Asia/Tokyo' },
  'new delhi':{ name: 'New Delhi', country: 'India',        countryCode: 'IN', lat: 28.6139, lon: 77.2090,  timezone: 'Asia/Kolkata' },
  mumbai:     { name: 'Mumbai',    country: 'India',        countryCode: 'IN', lat: 19.0760, lon: 72.8777,  timezone: 'Asia/Kolkata' },
  'los angeles':{ name: 'Los Angeles', country: 'USA',      countryCode: 'US', lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles' },
  miami:      { name: 'Miami',     country: 'USA',          countryCode: 'US', lat: 25.7617, lon: -80.1918,  timezone: 'America/New_York' },
  zurich:     { name: 'Zurich',    country: 'Switzerland',  countryCode: 'CH', lat: 47.3769, lon: 8.5417,   timezone: 'Europe/Zurich' },
};

/**
 * Get fallback city data (case-insensitive).
 * @param {string} cityName
 * @returns {{ name, country, countryCode, lat, lon, timezone } | null}
 */
function getFallbackCity(cityName) {
  const key = cityName.toLowerCase().trim();
  return CITY_FALLBACKS[key] ?? null;
}

/**
 * Autocomplete suggestions for popular cities.
 * @param {string} query
 * @returns {string[]}
 */
export function getPopularCities() {
  return [
    'Paris', 'Tokyo', 'New York', 'Rome', 'Barcelona', 'London',
    'Amsterdam', 'Prague', 'Bali', 'Bangkok', 'Dubai', 'Sydney',
    'Istanbul', 'Lisbon', 'Vienna', 'Berlin', 'Singapore', 'Marrakech',
    'Cairo', 'Kyoto', 'New Delhi', 'Mumbai', 'Los Angeles', 'Miami',
    'Zurich', 'Hong Kong', 'Seoul', 'Buenos Aires', 'Cape Town',
  ];
}
