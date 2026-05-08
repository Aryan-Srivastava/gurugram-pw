/**
 * weather.js — Open-Meteo weather API wrapper
 * Completely free, no API key required.
 * https://open-meteo.com/
 */

import { cacheWeather, getCachedWeather } from '../utils/storage.js';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * WMO Weather interpretation codes → { label, icon, suitability }
 * suitability: 1 = great, 0.7 = ok, 0.4 = poor, 0.1 = bad
 */
const WMO_CODES = {
  0:  { label: 'Clear Sky',         icon: '☀️',  suitability: 1 },
  1:  { label: 'Mainly Clear',      icon: '🌤️',  suitability: 1 },
  2:  { label: 'Partly Cloudy',     icon: '⛅',  suitability: 0.8 },
  3:  { label: 'Overcast',          icon: '☁️',  suitability: 0.6 },
  45: { label: 'Foggy',             icon: '🌫️',  suitability: 0.5 },
  48: { label: 'Icy Fog',           icon: '🌫️',  suitability: 0.4 },
  51: { label: 'Light Drizzle',     icon: '🌦️',  suitability: 0.6 },
  53: { label: 'Drizzle',           icon: '🌧️',  suitability: 0.5 },
  55: { label: 'Heavy Drizzle',     icon: '🌧️',  suitability: 0.4 },
  61: { label: 'Light Rain',        icon: '🌧️',  suitability: 0.5 },
  63: { label: 'Rain',              icon: '🌧️',  suitability: 0.4 },
  65: { label: 'Heavy Rain',        icon: '⛈️',  suitability: 0.2 },
  71: { label: 'Light Snow',        icon: '🌨️',  suitability: 0.5 },
  73: { label: 'Snow',              icon: '❄️',  suitability: 0.4 },
  75: { label: 'Heavy Snow',        icon: '❄️',  suitability: 0.2 },
  80: { label: 'Showers',           icon: '🌦️',  suitability: 0.5 },
  81: { label: 'Moderate Showers',  icon: '🌧️',  suitability: 0.4 },
  82: { label: 'Heavy Showers',     icon: '⛈️',  suitability: 0.2 },
  95: { label: 'Thunderstorm',      icon: '⛈️',  suitability: 0.1 },
  96: { label: 'Thunderstorm + Hail',icon: '⛈️', suitability: 0.1 },
  99: { label: 'Thunderstorm + Hail',icon: '⛈️', suitability: 0.1 },
};

/**
 * Get weather for a city by coordinates for a date range.
 * @param {{ lat: number, lon: number, name: string }} city
 * @param {string} startDate  YYYY-MM-DD
 * @param {string} endDate    YYYY-MM-DD
 * @returns {Promise<WeatherDay[]>}
 */
export async function getWeatherForecast(city, startDate, endDate) {
  const cacheKey = `${city.name.toLowerCase()}_${startDate}_${endDate}`;
  const cached = getCachedWeather(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      latitude:             city.lat,
      longitude:            city.lon,
      daily:                'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max',
      timezone:             'auto',
      start_date:           startDate,
      end_date:             endDate,
      wind_speed_unit:      'kmh',
      temperature_unit:     'celsius',
    });

    const res = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const data = await res.json();

    const days = parseWeatherResponse(data);
    cacheWeather(cacheKey, days);
    return days;
  } catch (e) {
    console.warn('[weather] Fetch failed, using mock data:', e);
    return getMockWeather(startDate, endDate);
  }
}

/**
 * Parse Open-Meteo daily response into WeatherDay array.
 * @param {object} data
 * @returns {WeatherDay[]}
 */
function parseWeatherResponse(data) {
  const d = data.daily;
  return d.time.map((date, i) => {
    const code = d.weathercode[i];
    const meta = WMO_CODES[code] ?? WMO_CODES[0];
    return {
      date,
      code,
      icon:        meta.icon,
      label:       meta.label,
      suitability: meta.suitability,
      tempMax:     Math.round(d.temperature_2m_max[i]),
      tempMin:     Math.round(d.temperature_2m_min[i]),
      tempAvg:     Math.round((d.temperature_2m_max[i] + d.temperature_2m_min[i]) / 2),
      precipitation:d.precipitation_sum[i] ?? 0,
      windspeed:   Math.round(d.windspeed_10m_max[i] ?? 0),
      uvIndex:     Math.round(d.uv_index_max?.[i] ?? 3),
      isRainy:     (d.precipitation_sum[i] ?? 0) > 2,
      isStormy:    [65, 80, 81, 82, 95, 96, 99].includes(code),
    };
  });
}

/**
 * Generate plausible mock weather data for given date range.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {WeatherDay[]}
 */
function getMockWeather(startDate, endDate) {
  const codes = [0, 1, 2, 3, 51, 63, 80, 95];
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const result = [];
  const cur = new Date(start);
  while (cur <= end) {
    const code = codes[Math.floor(Math.random() * codes.length)];
    const meta = WMO_CODES[code];
    const tempMax = 18 + Math.floor(Math.random() * 14);
    const tempMin = tempMax - 6 - Math.floor(Math.random() * 6);
    result.push({
      date:        cur.toISOString().split('T')[0],
      code,
      icon:        meta.icon,
      label:       meta.label,
      suitability: meta.suitability,
      tempMax,
      tempMin,
      tempAvg:     Math.round((tempMax + tempMin) / 2),
      precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 10) : 0,
      windspeed:   5 + Math.floor(Math.random() * 25),
      uvIndex:     2 + Math.floor(Math.random() * 7),
      isRainy:     Math.random() > 0.75,
      isStormy:    false,
      isMock:      true,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

/**
 * Interpret weather suitability for a given activity type.
 * @param {WeatherDay} weather
 * @param {string} activityType  e.g. 'outdoor', 'museum', 'food'
 * @returns {number} 0-1
 */
export function getActivityWeatherFit(weather, activityType) {
  if (activityType === 'indoor') return 1; // always fine indoors
  if (activityType === 'outdoor') return weather.suitability;
  if (activityType === 'beach')   return weather.tempMax > 25 && !weather.isRainy ? 1 : 0.2;
  if (activityType === 'hiking')  return weather.suitability * (weather.windspeed < 30 ? 1 : 0.5);
  return weather.suitability;
}

/** Re-export WMO table for UI use */
export { WMO_CODES };
