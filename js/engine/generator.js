/**
 * generator.js — Core itinerary generation engine
 *
 * Flow:
 * 1. Geocode each city (lat/lon)
 * 2. Fetch weather for each city's stay dates
 * 3. Score activity pool against interests + weather + budget
 * 4. Assign activities to morning / afternoon / evening slots
 * 5. Select hotel based on budget tier + style
 * 6. Add flight block on travel days (multi-city)
 * 7. Compute daily spend
 * 8. Return array of ItineraryDay objects
 */

import { geocodeCity }       from '../api/geocoding.js';
import { getWeatherForecast, getActivityWeatherFit } from '../api/weather.js';
import { selectBestHotel }   from '../api/hotels.js';
import { getFlight }         from '../api/flights.js';
import { addDays, formatShort } from '../utils/date.js';
import { allocateBudget }    from '../utils/currency.js';
import { ACTIVITY_DATABASE } from './activities.js';

/**
 * Generate a full itinerary for the given user preferences.
 * @param {UserPreferences} prefs
 * @param {function} onProgress  Called with (pct, message) during generation
 * @returns {Promise<ItineraryDay[]>}
 */
export async function generateItinerary(prefs, onProgress = () => {}) {
  const days     = [];
  const alloc    = allocateBudget(prefs.budget.usd);
  const budgetTier = prefs.budget.tier;

  let dayIndex = 0;

  // Step 1: Geocode all cities in parallel
  onProgress(5, 'Locating destinations…');
  const geoResults = await Promise.all(
    prefs.cities.map((c) => geocodeCity(c.name))
  );

  // Step 2: Calculate stay windows per city
  onProgress(20, 'Planning stay windows…');
  let walkingDate = new Date(prefs.startDate);
  const cityStays = prefs.cities.map((city, i) => {
    const stayStart = walkingDate.toISOString().split('T')[0];
    walkingDate = addDays(walkingDate, city.nights);
    const stayEnd   = walkingDate.toISOString().split('T')[0];
    return { ...city, stayStart, stayEnd, geo: geoResults[i] };
  });

  // Step 3: Fetch weather for correct date ranges
  onProgress(35, 'Fetching weather forecasts…');
  const weatherMaps = await Promise.all(
    cityStays.map(async (city) => {
      if (!city.geo) return {};
      const forecast = await getWeatherForecast(city.geo, city.stayStart, city.stayEnd);
      const map = {};
      forecast.forEach((w) => { map[w.date] = w; });
      return map;
    })
  );

  // Step 3-8: Build day-by-day
  onProgress(45, 'Building your itinerary…');

  for (let ci = 0; ci < cityStays.length; ci++) {
    const city    = cityStays[ci];
    const geo     = city.geo ?? { name: city.name, country: '', lat: 0, lon: 0 };
    const wMap    = weatherMaps[ci];
    const hotel   = selectBestHotel(city.name, budgetTier, prefs.style);

    // Flight day (transition from previous city)
    if (ci > 0) {
      const prevCity   = cityStays[ci - 1];
      const flightDate = city.stayStart;
      let flight;
      try {
        flight = await getFlight(prevCity.name, city.name, flightDate);
      } catch {
        flight = null;
      }

      // Mark the last day of previous city as travel day
      if (days.length > 0) {
        const lastDay = days[days.length - 1];
        lastDay.flight = flight;
        lastDay.isTravelDay = true;
      }
    }

    // Generate one day per night in this city
    for (let n = 0; n < city.nights; n++) {
      const dateStr = addDays(new Date(city.stayStart), n).toISOString().split('T')[0];
      const weather = wMap[dateStr] ?? generateFallbackWeather(dateStr);

      // Score & select activities
      const activities = selectActivities({
        cityName:    city.name,
        style:       prefs.style,
        interests:   prefs.interests,
        weather,
        budgetTier,
        dayNumber:   n,
      });

      // Daily spend estimate
      const hotelCost     = hotel.pricePerNight;
      const activitiesCost = activities.reduce((s, a) => s + (a.cost ?? 0), 0);
      const foodCost      = budgetTier === 'budget' ? 30
        : budgetTier === 'mid' ? 65 : 120;
      const transportCost = 15;

      days.push({
        dayIndex,
        date:     dateStr,
        dateLabel: formatShort(dateStr),
        cityName:  city.name,
        country:   geo.country,
        city:      geo,
        weather,
        hotel,
        activities,
        flight:    null,
        isTravelDay: false,
        disrupted: false,
        alerts:    [],
        spend: {
          hotel:      hotelCost,
          activities: activitiesCost,
          food:       foodCost,
          transport:  transportCost,
          total:      hotelCost + activitiesCost + foodCost + transportCost,
        },
      });

      dayIndex++;
    }

    onProgress(45 + Math.round((ci / cityStays.length) * 45), `Planning ${city.name}…`);
  }

  onProgress(95, 'Finalizing itinerary…');
  return days;
}

/**
 * Select and score activities for a given day.
 * Returns up to 3 activities (morning, afternoon, evening).
 */
function selectActivities({ cityName, style, interests, weather, budgetTier, dayNumber }) {
  const cityKey   = cityName.toLowerCase().trim();
  const cityActs  = ACTIVITY_DATABASE[cityKey] ?? ACTIVITY_DATABASE['default'] ?? [];
  const slots     = ['morning', 'afternoon', 'evening'];
  const selected  = [];
  const usedIds   = new Set();

  for (const slot of slots) {
    // Filter by slot preference
    const candidates = cityActs.filter((a) => {
      if (usedIds.has(a.id)) return false;
      if (a.preferredSlot && a.preferredSlot !== slot) return false;
      return true;
    });

    if (candidates.length === 0) continue;

    // Score each candidate
    const scored = candidates.map((act) => {
      const interestScore = interests.some((i) => act.tags?.includes(i)) ? 0.4 : 0;
      const weatherScore  = getActivityWeatherFit(weather, act.weatherType ?? 'outdoor') * 0.3;
      const budgetScore   = budgetFit(act.cost ?? 0, budgetTier) * 0.2;
      const ratingScore   = ((act.rating ?? 8) / 10) * 0.1;
      return { ...act, _score: interestScore + weatherScore + budgetScore + ratingScore };
    });

    scored.sort((a, b) => b._score - a._score);

    // Pick top activity (with slight randomization for variety)
    const topN    = scored.slice(0, Math.min(3, scored.length));
    const pick    = topN[dayNumber % topN.length] ?? topN[0];

    if (pick) {
      usedIds.add(pick.id);
      selected.push({ ...pick, slot });
    }
  }

  return selected;
}

/**
 * Score how well an activity cost fits the budget tier.
 * @param {number} cost  Activity cost in USD
 * @param {string} tier
 * @returns {number} 0-1
 */
function budgetFit(cost, tier) {
  if (tier === 'budget') {
    if (cost < 15) return 1;
    if (cost < 30) return 0.7;
    return 0.3;
  }
  if (tier === 'mid') {
    if (cost >= 15 && cost <= 60) return 1;
    if (cost < 80) return 0.7;
    return 0.4;
  }
  // luxury: expensive activities score higher
  if (cost > 50) return 1;
  if (cost > 20) return 0.7;
  return 0.5;
}

/**
 * Generate plausible fallback weather when API fails.
 */
function generateFallbackWeather(date) {
  return {
    date,
    code:        1,
    icon:        '🌤️',
    label:       'Mainly Clear',
    suitability: 0.9,
    tempMax:     24,
    tempMin:     16,
    tempAvg:     20,
    precipitation: 0,
    windspeed:   12,
    uvIndex:     5,
    isRainy:     false,
    isStormy:    false,
    isMock:      true,
  };
}
