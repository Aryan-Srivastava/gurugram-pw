/**
 * main.js — App entry point: wires all modules together
 */

import { AppState, setState, subscribe, addAlert, updateDay } from './state.js';
import { renderWizard, getFormState, showStepErrors, clearStepErrors } from './ui/form.js';
import { renderItinerary, renderBudgetTracker, flashDayCard } from './ui/itinerary.js';
import { createAlertsPanelHTML, renderAlertsPanel, showToast } from './ui/alerts.js';
import { showItinerarySkeleton, showProgress } from './ui/loader.js';
import { generateItinerary } from './engine/generator.js';
import { parsePreferences, validateStep } from './engine/parser.js';
import { initBudget } from './engine/budget.js';
import { checkDisruptions, replanDay } from './engine/replanner.js';
import { save, load, KEYS } from './utils/storage.js';
import { fetchRates } from './utils/currency.js';

// ── DOM References ─────────────────────────────────────────────
const formSection      = document.getElementById('form-section');
const alertsSidebar    = document.getElementById('alerts-sidebar');
const itinerarySection = document.getElementById('itinerary-section');
const budgetSection    = document.getElementById('budget-section');
const themeToggle      = document.getElementById('theme-toggle');
const heroCtaBtn       = document.getElementById('hero-cta-btn');
const appSection       = document.getElementById('app-section');

// ── Init ───────────────────────────────────────────────────────
async function init() {
  // Theme
  const savedTheme = load(KEYS.THEME, 'dark');
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // Fetch exchange rates in background
  fetchRates().catch(() => {});

  // Render alerts panel shell
  if (alertsSidebar) {
    alertsSidebar.innerHTML = createAlertsPanelHTML();
  }

  // Render wizard at step 1
  renderCurrentStep();

  // Restore saved itinerary
  const savedItinerary = load(KEYS.ITINERARY);
  const savedPrefs     = load(KEYS.PREFERENCES);
  if (savedItinerary?.length && savedPrefs) {
    setState({ itinerary: savedItinerary, preferences: savedPrefs });
    renderItinerary(itinerarySection, savedItinerary, savedPrefs, handleReplan);
    initBudget(savedPrefs, savedItinerary);
    renderBudgetTracker(budgetSection, AppState.budget);
    startPolling();
    showToast({ title: 'Trip Restored', message: 'Your last itinerary has been reloaded.', type: 'info' });
  }

  // Theme toggle
  themeToggle?.addEventListener('click', toggleTheme);

  // Hero CTA
  heroCtaBtn?.addEventListener('click', () => {
    appSection?.scrollIntoView({ behavior: 'smooth' });
  });

  // Subscribe to state changes
  subscribe('itinerary', (days) => {
    renderItinerary(itinerarySection, days, AppState.preferences, handleReplan);
    renderBudgetTracker(budgetSection, AppState.budget);
  });

  subscribe('alerts', () => {
    renderAlertsPanel(alertsSidebar, handleReplan);
  });

  subscribe('budget', (budget) => {
    renderBudgetTracker(budgetSection, budget);
    if (budget.spent > budget.total * 0.9) {
      showToast({ title: 'Budget Alert', message: 'You\'re approaching your budget limit.', type: 'warning' });
    }
  });
}

// ── Wizard Step Management ─────────────────────────────────────
function renderCurrentStep() {
  renderWizard(formSection, AppState.currentStep, handleWizardAction);
}

function handleWizardAction(action, formData, step) {
  if (action === 'back') {
    clearStepErrors(step);
    setState({ currentStep: Math.max(1, step - 1) });
    renderCurrentStep();
    return;
  }

  if (action === 'next') {
    const { valid, errors } = validateStep(step, formData);
    if (!valid) { showStepErrors(step, errors); return; }
    clearStepErrors(step);
    setState({ currentStep: Math.min(4, step + 1) });
    renderCurrentStep();
    return;
  }

  if (action === 'submit') {
    const { valid, errors } = validateStep(step, formData);
    if (!valid) { showStepErrors(step, errors); return; }
    handleGenerate(formData);
  }
}

// ── Itinerary Generation ───────────────────────────────────────
async function handleGenerate(rawForm) {
  let prefs;
  try {
    prefs = parsePreferences(rawForm);
  } catch (err) {
    showToast({ title: 'Invalid Preferences', message: err.message, type: 'error' });
    return;
  }

  setState({ isLoading: true, preferences: prefs });
  save(KEYS.PREFERENCES, prefs);

  // Show progress UI
  showProgress(itinerarySection, 0, 'Starting up…');
  budgetSection.innerHTML = '';

  const onProgress = (pct, msg) => showProgress(itinerarySection, pct, msg);

  try {
    const itinerary = await generateItinerary(prefs, onProgress);
    setState({ itinerary, isLoading: false });
    save(KEYS.ITINERARY, itinerary);

    initBudget(prefs, itinerary);
    renderItinerary(itinerarySection, itinerary, prefs, handleReplan);
    renderBudgetTracker(budgetSection, AppState.budget);

    startPolling();

    showToast({
      title:   '🗺️ Itinerary Ready!',
      message: `${itinerary.length} days across ${prefs.cities.length} ${prefs.cities.length === 1 ? 'city' : 'cities'} planned.`,
      type:    'success',
      duration: 5000,
    });

    itinerarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error('[generate]', err);
    setState({ isLoading: false });
    showToast({ title: 'Generation Failed', message: 'Please try again.', type: 'error' });
    itinerarySection.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3 class="empty-state-title">Something went wrong</h3>
        <p class="empty-state-desc">${err.message}</p>
      </div>`;
  }
}

// ── Re-planner ─────────────────────────────────────────────────
async function handleReplan(dayIndex) {
  const day   = AppState.itinerary[dayIndex];
  const prefs = AppState.preferences;
  if (!day || !prefs) return;

  showToast({ title: `Re-planning Day ${dayIndex + 1}…`, type: 'info', duration: 2000 });

  try {
    await replanDay(dayIndex, day, prefs);
    flashDayCard(dayIndex);
    save(KEYS.ITINERARY, AppState.itinerary);
    renderAlertsPanel(alertsSidebar, handleReplan);
  } catch (err) {
    showToast({ title: 'Re-plan Failed', message: err.message, type: 'error' });
  }
}

// ── Polling ────────────────────────────────────────────────────
let _pollingId = null;
const POLL_INTERVAL = 5 * 60 * 1000; // 5 min

function startPolling() {
  stopPolling();
  _pollingId = setInterval(async () => {
    if (!AppState.itinerary.length || !AppState.preferences) return;
    try {
      await checkDisruptions(AppState.itinerary, AppState.preferences);
      renderAlertsPanel(alertsSidebar, handleReplan);
    } catch { /* non-fatal */ }
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (_pollingId) { clearInterval(_pollingId); _pollingId = null; }
}

// ── Theme ──────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') ?? 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  save(KEYS.THEME, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  if (themeToggle) themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
