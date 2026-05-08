/**
 * parser.js — Parse raw form inputs into structured UserPreferences object
 */

import { daysBetween } from '../utils/date.js';
import { getBudgetTier, convert } from '../utils/currency.js';

/**
 * Parse the form state object into a validated UserPreferences structure.
 * @param {object} raw  Raw form values from the wizard
 * @returns {UserPreferences}
 */
export function parsePreferences(raw) {
  // Validate & normalize cities
  const cities = (raw.cities ?? [])
    .filter((c) => c.name && c.name.trim().length > 0)
    .map((c) => ({
      name:   c.name.trim(),
      nights: Math.max(1, parseInt(c.nights, 10) || 2),
    }));

  if (cities.length === 0) throw new Error('At least one destination is required.');

  // Validate dates
  const startDate = raw.startDate;
  const endDate   = raw.endDate;
  if (!startDate || !endDate) throw new Error('Travel dates are required.');
  if (new Date(endDate) <= new Date(startDate)) throw new Error('End date must be after start date.');

  const totalNightsFromCities = cities.reduce((s, c) => s + c.nights, 0);
  const totalNightsFromDates  = daysBetween(startDate, endDate);
  // Reconcile: if date range is shorter, redistribute nights proportionally
  const scaleFactor = totalNightsFromDates / Math.max(totalNightsFromCities, 1);
  const normalizedCities = cities.map((c) => ({
    ...c,
    nights: Math.max(1, Math.round(c.nights * scaleFactor)),
  }));

  // Budget
  const budgetAmount   = Math.max(100, parseFloat(raw.budget) || 1500);
  const budgetCurrency = raw.currency ?? 'USD';
  const budgetInUSD    = budgetCurrency === 'USD' ? budgetAmount : convert(budgetAmount, budgetCurrency, 'USD');
  const budgetTier     = getBudgetTier(budgetInUSD);

  // Group size
  const groupSize = Math.max(1, parseInt(raw.groupSize, 10) || 1);

  // Travel style
  const style = VALID_STYLES.includes(raw.style) ? raw.style : 'cultural';

  // Interests
  const interests = (raw.interests ?? []).filter((i) => VALID_INTERESTS.includes(i));
  if (interests.length === 0) interests.push('museums', 'food'); // defaults

  // Flight class
  const flightClass = ['economy', 'business', 'first'].includes(raw.flightClass)
    ? raw.flightClass : 'economy';

  return {
    cities:       normalizedCities,
    startDate,
    endDate,
    totalDays:    totalNightsFromDates,
    style,
    budget: {
      amount:   budgetAmount,
      currency: budgetCurrency,
      usd:      budgetInUSD,
      tier:     budgetTier,
    },
    interests,
    groupSize,
    flightClass,
  };
}

/**
 * Validate the form at a specific step.
 * @param {number} step
 * @param {object} raw
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStep(step, raw) {
  const errors = [];

  if (step === 1) {
    if (!raw.cities || raw.cities.filter((c) => c.name?.trim()).length === 0) {
      errors.push('Add at least one destination.');
    }
    if (!raw.startDate) errors.push('Please select a start date.');
    if (!raw.endDate)   errors.push('Please select a return date.');
    if (raw.startDate && raw.endDate && new Date(raw.endDate) <= new Date(raw.startDate)) {
      errors.push('Return date must be after start date.');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (raw.startDate && new Date(raw.startDate) <= today) {
      errors.push('Start date must be in the future.');
    }
  }

  if (step === 2) {
    if (!raw.style) errors.push('Please select a travel style.');
  }

  if (step === 3) {
    if (!raw.budget || parseFloat(raw.budget) < 100) {
      errors.push('Budget must be at least 100.');
    }
  }

  if (step === 4) {
    if (!raw.interests || raw.interests.length === 0) {
      errors.push('Select at least one interest.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Valid travel styles */
export const VALID_STYLES = ['adventure', 'cultural', 'relaxation', 'business', 'foodie'];

/** Valid interest tags */
export const VALID_INTERESTS = [
  'museums', 'history', 'art', 'food', 'nightlife',
  'nature', 'hiking', 'beaches', 'shopping', 'architecture',
  'music', 'sports', 'photography', 'wellness', 'kids',
];

/** Travel style metadata for UI rendering */
export const STYLE_META = {
  adventure:   { icon: '🏔️', label: 'Adventure',   desc: 'Thrill-seeking & outdoors' },
  cultural:    { icon: '🏛️', label: 'Cultural',    desc: 'Arts, history & heritage' },
  relaxation:  { icon: '🏖️', label: 'Relaxation',  desc: 'Spa, beaches & calm' },
  business:    { icon: '💼', label: 'Business',    desc: 'Efficient & professional' },
  foodie:      { icon: '🍜', label: 'Foodie',      desc: 'Cuisine & local eats' },
};

/** Interest metadata for UI rendering */
export const INTEREST_META = {
  museums:      { icon: '🏛️', label: 'Museums' },
  history:      { icon: '📜', label: 'History' },
  art:          { icon: '🎨', label: 'Art' },
  food:         { icon: '🍽️', label: 'Food & Dining' },
  nightlife:    { icon: '🎉', label: 'Nightlife' },
  nature:       { icon: '🌿', label: 'Nature' },
  hiking:       { icon: '🥾', label: 'Hiking' },
  beaches:      { icon: '🏖️', label: 'Beaches' },
  shopping:     { icon: '🛍️', label: 'Shopping' },
  architecture: { icon: '🏗️', label: 'Architecture' },
  music:        { icon: '🎵', label: 'Music' },
  sports:       { icon: '⚽', label: 'Sports' },
  photography:  { icon: '📸', label: 'Photography' },
  wellness:     { icon: '🧘', label: 'Wellness' },
  kids:         { icon: '👨‍👩‍👧', label: 'Family Friendly' },
};
