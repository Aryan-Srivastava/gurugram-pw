/**
 * state.js — Central reactive state store
 * Single source of truth for the entire application.
 */

export const AppState = {
  // ── User Preferences ────────────────────────────────────────
  preferences: null,

  // ── Generated Itinerary ──────────────────────────────────────
  itinerary: [],          // Array of ItineraryDay objects

  // ── Alerts ───────────────────────────────────────────────────
  alerts: [],             // Array of Alert objects

  // ── UI State ─────────────────────────────────────────────────
  isLoading: false,
  currentStep: 1,
  totalSteps: 4,
  activeCity: null,       // Currently focused city index

  // ── Budget ───────────────────────────────────────────────────
  budget: {
    total: 0,
    spent: 0,
    breakdown: {
      flights:    0,
      hotels:     0,
      activities: 0,
      food:       0,
      buffer:     0,
    },
  },

  // ── Polling ───────────────────────────────────────────────────
  pollingIntervalId: null,
  lastRefreshed: null,

  // ── Listeners ────────────────────────────────────────────────
  _listeners: {},
};

/**
 * Subscribe to state changes on a specific key.
 * @param {string} key
 * @param {Function} fn
 */
export function subscribe(key, fn) {
  if (!AppState._listeners[key]) AppState._listeners[key] = [];
  AppState._listeners[key].push(fn);
}

/**
 * Patch state and notify subscribers.
 * @param {Partial<AppState>} patch
 */
export function setState(patch) {
  Object.keys(patch).forEach((key) => {
    AppState[key] = patch[key];
    if (AppState._listeners[key]) {
      AppState._listeners[key].forEach((fn) => fn(AppState[key]));
    }
  });
}

/**
 * Add an alert to state and notify.
 * @param {Object} alert
 */
export function addAlert(alert) {
  const newAlerts = [alert, ...AppState.alerts];
  setState({ alerts: newAlerts });
}

/**
 * Dismiss an alert by ID.
 * @param {string} alertId
 */
export function dismissAlert(alertId) {
  const newAlerts = AppState.alerts.filter((a) => a.id !== alertId);
  setState({ alerts: newAlerts });
}

/**
 * Update a specific day in the itinerary.
 * @param {number} dayIndex
 * @param {Partial<ItineraryDay>} patch
 */
export function updateDay(dayIndex, patch) {
  const itinerary = [...AppState.itinerary];
  itinerary[dayIndex] = { ...itinerary[dayIndex], ...patch };
  setState({ itinerary });
}
