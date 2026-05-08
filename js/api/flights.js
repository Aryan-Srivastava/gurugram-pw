/**
 * flights.js — Flight data with Aviationstack wrapper + rich mock fallback
 *
 * Free tier: https://aviationstack.com/ (100 req/month)
 * All mock data is clearly labeled with [Simulated] badge.
 */

// ── Replace with your Aviationstack API key ──────────────────
const AVIATIONSTACK_KEY = ''; // Leave blank to use mock data only
const AVIATIONSTACK_URL = 'https://api.aviationstack.com/v1/flights';

/**
 * City → IATA airport code map.
 */
const CITY_IATA = {
  paris:        'CDG', tokyo:       'NRT', 'new york':  'JFK',
  rome:         'FCO', barcelona:   'BCN', london:      'LHR',
  amsterdam:    'AMS', prague:      'PRG', bali:        'DPS',
  bangkok:      'BKK', dubai:       'DXB', sydney:      'SYD',
  istanbul:     'IST', lisbon:      'LIS', vienna:      'VIE',
  berlin:       'BER', singapore:   'SIN', marrakech:   'RAK',
  cairo:        'CAI', kyoto:       'ITM', 'new delhi': 'DEL',
  mumbai:       'BOM', 'los angeles':'LAX', miami:      'MIA',
  zurich:       'ZRH', 'hong kong': 'HKG', seoul:       'ICN',
};

const AIRLINES = [
  'Emirates', 'Singapore Airlines', 'Qatar Airways', 'Lufthansa',
  'British Airways', 'Air France', 'KLM', 'Turkish Airlines',
  'Delta Air Lines', 'United Airlines', 'American Airlines',
  'Etihad Airways', 'Cathay Pacific', 'Japan Airlines', 'Swiss Air',
];

/**
 * Get flight info between two cities.
 * Tries Aviationstack first; falls back to mock.
 * @param {string} fromCity
 * @param {string} toCity
 * @param {string} date  YYYY-MM-DD
 * @returns {Promise<Flight>}
 */
export async function getFlight(fromCity, toCity, date) {
  if (AVIATIONSTACK_KEY) {
    try {
      return await fetchLiveFlight(fromCity, toCity, date);
    } catch {
      // Fall through to mock
    }
  }
  return getMockFlight(fromCity, toCity, date);
}

/**
 * Fetch live flight data from Aviationstack.
 */
async function fetchLiveFlight(fromCity, toCity, date) {
  const dep = CITY_IATA[fromCity.toLowerCase()] ?? 'NYC';
  const arr = CITY_IATA[toCity.toLowerCase()] ?? 'LAX';
  const url = new URL(AVIATIONSTACK_URL);
  url.searchParams.set('access_key', AVIATIONSTACK_KEY);
  url.searchParams.set('dep_iata', dep);
  url.searchParams.set('arr_iata', arr);
  url.searchParams.set('flight_date', date);
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error('Aviationstack request failed');
  const data = await res.json();
  if (!data.data || data.data.length === 0) throw new Error('No flight data');

  const f = data.data[0];
  return {
    id:        f.flight?.iata ?? generateFlightId(),
    from:      fromCity,
    to:        toCity,
    fromCode:  dep,
    toCode:    arr,
    airline:   f.airline?.name ?? 'Unknown Airline',
    departure: f.departure?.scheduled ?? `${date}T08:00:00`,
    arrival:   f.arrival?.scheduled   ?? `${date}T12:00:00`,
    status:    mapStatus(f.flight_status),
    duration:  estimateDuration(fromCity, toCity),
    price:     estimatePrice(fromCity, toCity, 'economy'),
    class:     'economy',
    isLive:    true,
    isSimulated: false,
  };
}

/**
 * Generate a realistic mock flight.
 */
function getMockFlight(fromCity, toCity, date) {
  const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
  const depHour = 6 + Math.floor(Math.random() * 10);
  const duration = estimateDuration(fromCity, toCity);
  const depTime  = `${date}T${String(depHour).padStart(2, '0')}:${['00','30'][Math.floor(Math.random()*2)]}:00`;
  const arrDate  = new Date(depTime);
  arrDate.setMinutes(arrDate.getMinutes() + duration);

  const statuses = ['scheduled', 'scheduled', 'scheduled', 'delayed', 'on-time', 'on-time'];
  const status   = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    id:          generateFlightId(),
    from:        fromCity,
    to:          toCity,
    fromCode:    CITY_IATA[fromCity.toLowerCase()] ?? 'XXX',
    toCode:      CITY_IATA[toCity.toLowerCase()]   ?? 'YYY',
    airline,
    departure:   depTime,
    arrival:     arrDate.toISOString(),
    status,
    duration,
    price:       estimatePrice(fromCity, toCity, 'economy'),
    class:       'economy',
    isLive:      false,
    isSimulated: true,
  };
}

/**
 * Map Aviationstack status string to our status type.
 */
function mapStatus(raw) {
  if (!raw) return 'scheduled';
  const map = {
    active:    'on-time',
    scheduled: 'scheduled',
    landed:    'on-time',
    cancelled: 'cancelled',
    incident:  'disrupted',
    diverted:  'disrupted',
  };
  return map[raw] ?? 'scheduled';
}

/**
 * Estimate flight duration in minutes between two cities.
 */
function estimateDuration(from, to) {
  // Simple heuristic based on known distances
  const LONG_HAUL = new Set([
    'new york-tokyo','new york-singapore','new york-dubai','new york-sydney',
    'london-sydney','london-tokyo','london-singapore','paris-tokyo',
    'paris-sydney','los angeles-tokyo','los angeles-london',
  ]);
  const MID_HAUL = new Set([
    'london-dubai','london-bali','paris-dubai','paris-bali',
    'london-istanbul','paris-istanbul','rome-dubai','barcelona-dubai',
    'berlin-dubai','amsterdam-dubai','london-new york','paris-new york',
  ]);

  const key = `${from.toLowerCase()}-${to.toLowerCase()}`;
  const rev = `${to.toLowerCase()}-${from.toLowerCase()}`;

  if (LONG_HAUL.has(key) || LONG_HAUL.has(rev)) return 720 + Math.floor(Math.random() * 120);
  if (MID_HAUL.has(key)  || MID_HAUL.has(rev))  return 360 + Math.floor(Math.random() * 120);
  return 120 + Math.floor(Math.random() * 120);
}

/**
 * Estimate flight price in USD.
 */
function estimatePrice(from, to, flightClass) {
  const duration = estimateDuration(from, to);
  const basePerMin = flightClass === 'economy' ? 0.9
    : flightClass === 'business' ? 3.5
    : 8.0;
  return Math.round(duration * basePerMin * (0.8 + Math.random() * 0.4));
}

function generateFlightId() {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const code = alpha[Math.floor(Math.random() * 26)] + alpha[Math.floor(Math.random() * 26)];
  const num  = 100 + Math.floor(Math.random() * 900);
  return `${code}${num}`;
}

/**
 * Format flight duration as "2h 35m"
 * @param {number} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Get status display properties.
 * @param {string} status
 * @returns {{ label, cssClass }}
 */
export function getFlightStatusDisplay(status) {
  const map = {
    'on-time':    { label: 'On Time',    cssClass: 'on-time'   },
    'scheduled':  { label: 'Scheduled',  cssClass: 'on-time'   },
    'delayed':    { label: 'Delayed',    cssClass: 'delayed'   },
    'cancelled':  { label: 'Cancelled',  cssClass: 'cancelled' },
    'disrupted':  { label: 'Disrupted',  cssClass: 'cancelled' },
  };
  return map[status] ?? { label: status, cssClass: 'on-time' };
}
