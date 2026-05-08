/**
 * replanner.js — Disruption detection and itinerary re-planning
 */

import { getWeatherForecast } from '../api/weather.js';
import { selectBestHotel }    from '../api/hotels.js';
import { ACTIVITY_DATABASE }  from './activities.js';
import { addAlert }           from '../state.js';
import { updateDay }          from '../state.js';
import { timeAgo }            from '../utils/date.js';

let _pollCount = 0;

/**
 * Run one disruption-check cycle over the full itinerary.
 * @param {ItineraryDay[]} days
 * @param {UserPreferences} prefs
 */
export async function checkDisruptions(days, prefs) {
  _pollCount++;

  for (let i = 0; i < days.length; i++) {
    const day = days[i];

    // 1. Weather re-check (real API)
    try {
      await checkWeatherDisruption(day, i, prefs);
    } catch { /* non-fatal */ }

    // 2. Simulated flight disruption (random, low probability)
    if (day.flight && Math.random() < 0.04) {
      triggerFlightDisruption(day, i);
    }

    // 3. Simulated hotel unavailability (very rare)
    if (Math.random() < 0.015) {
      triggerHotelDisruption(day, i, prefs);
    }
  }
}

/**
 * Check if weather has changed significantly for a day.
 */
async function checkWeatherDisruption(day, dayIndex, prefs) {
  if (!day.city?.lat || !day.city?.lon) return;

  const forecast = await getWeatherForecast(day.city, day.date, day.date);
  if (!forecast.length) return;

  const newWeather = forecast[0];
  const old        = day.weather;

  // Detect meaningful change: was fine, now stormy
  const wasGood   = (old?.suitability ?? 1) >= 0.6;
  const nowBad    = newWeather.suitability < 0.4;

  if (wasGood && nowBad) {
    updateDay(dayIndex, { weather: newWeather, disrupted: true });

    // Swap outdoor activities to indoor alternatives
    const replanActivities = replanForWeather(day, newWeather, prefs);
    if (replanActivities) {
      updateDay(dayIndex, { activities: replanActivities, disrupted: false });
    }

    addAlert({
      id:          crypto.randomUUID(),
      type:        'weather',
      severity:    newWeather.isStormy ? 'critical' : 'warning',
      message:     `${newWeather.isStormy ? '⛈️ Thunderstorm' : '🌧️ Heavy rain'} expected in ${day.cityName} on Day ${dayIndex + 1}. Outdoor activities have been adjusted.`,
      affectedDay: dayIndex,
      timestamp:   new Date().toISOString(),
      dismissed:   false,
      action:      'replan',
    });
  }
}

/**
 * Swap weather-sensitive activities with indoor alternatives.
 */
function replanForWeather(day, weather, prefs) {
  const cityKey  = day.cityName.toLowerCase().trim();
  const cityActs = ACTIVITY_DATABASE[cityKey] ?? ACTIVITY_DATABASE['default'] ?? [];
  const usedIds  = new Set(day.activities.map((a) => a.id));

  return day.activities.map((act) => {
    if (act.weatherType === 'indoor') return act; // already fine

    // Find a suitable indoor alternative
    const alt = cityActs.find(
      (a) => a.weatherType === 'indoor' && !usedIds.has(a.id) && a.slot !== act.slot
    );
    if (alt) {
      usedIds.add(alt.id);
      return { ...alt, slot: act.slot, _replanned: true };
    }
    return { ...act, weatherWarning: true };
  });
}

/**
 * Simulate a flight delay/cancellation alert.
 */
function triggerFlightDisruption(day, dayIndex) {
  const isCancel  = Math.random() < 0.2;
  const delayMins = isCancel ? 0 : 30 + Math.floor(Math.random() * 150);
  const newStatus = isCancel ? 'cancelled' : 'delayed';

  updateDay(dayIndex, {
    flight:    { ...day.flight, status: newStatus, delayMins },
    disrupted: true,
  });

  addAlert({
    id:          crypto.randomUUID(),
    type:        'flight',
    severity:    isCancel ? 'critical' : 'warning',
    message:     isCancel
      ? `✈️ Flight ${day.flight.id} (${day.flight.from} → ${day.flight.to}) has been cancelled. Alternative routes available.`
      : `✈️ Flight ${day.flight.id} delayed by ${delayMins} min. Arrival revised to ${getRevisedTime(day.flight.arrival, delayMins)}.`,
    affectedDay: dayIndex,
    timestamp:   new Date().toISOString(),
    dismissed:   false,
    action:      'replan',
  });
}

/**
 * Simulate hotel unavailability and find an alternative.
 */
function triggerHotelDisruption(day, dayIndex, prefs) {
  const alt = selectBestHotel(day.cityName, prefs.budget.tier, prefs.style);
  if (alt.id === day.hotel.id) return; // same hotel, no disruption

  updateDay(dayIndex, { hotel: alt, disrupted: true });

  addAlert({
    id:          crypto.randomUUID(),
    type:        'hotel',
    severity:    'warning',
    message:     `🏨 ${day.hotel.name} is no longer available for Day ${dayIndex + 1}. Switched to ${alt.name} (${alt.rating}⭐).`,
    affectedDay: dayIndex,
    timestamp:   new Date().toISOString(),
    dismissed:   false,
    action:      'none',
  });
}

/**
 * Re-plan a specific day fully (triggered by user clicking "Re-plan Day").
 * @param {number} dayIndex
 * @param {ItineraryDay} day
 * @param {UserPreferences} prefs
 */
export async function replanDay(dayIndex, day, prefs) {
  const cityKey  = day.cityName.toLowerCase().trim();
  const cityActs = ACTIVITY_DATABASE[cityKey] ?? ACTIVITY_DATABASE['default'] ?? [];
  const usedIds  = new Set();

  const slots    = ['morning', 'afternoon', 'evening'];
  const newActs  = slots.map((slot) => {
    const pool = cityActs.filter((a) => !usedIds.has(a.id) && (!a.preferredSlot || a.preferredSlot === slot));
    if (!pool.length) return null;
    // Pick randomly from top 3 for variety
    const pick = pool[Math.floor(Math.random() * Math.min(3, pool.length))];
    usedIds.add(pick.id);
    return { ...pick, slot, _replanned: true };
  }).filter(Boolean);

  const newHotel = selectBestHotel(day.cityName, prefs.budget.tier, prefs.style);

  updateDay(dayIndex, {
    activities: newActs,
    hotel:      newHotel,
    disrupted:  false,
    alerts:     [],
  });

  addAlert({
    id:          crypto.randomUUID(),
    type:        'weather',
    severity:    'success',
    message:     `✅ Day ${dayIndex + 1} (${day.cityName}) has been successfully re-planned with fresh activities and accommodation.`,
    affectedDay: dayIndex,
    timestamp:   new Date().toISOString(),
    dismissed:   false,
    action:      'none',
  });
}

/** Compute revised arrival time string. */
function getRevisedTime(isoTime, addMinutes) {
  if (!isoTime) return 'TBD';
  const d = new Date(isoTime);
  d.setMinutes(d.getMinutes() + addMinutes);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
