/**
 * form.js — 4-step wizard UI: render, validate, state management
 */

import { STYLE_META, INTEREST_META, VALID_STYLES, VALID_INTERESTS } from '../engine/parser.js';
import { SUPPORTED_CURRENCIES } from '../utils/currency.js';
import { minTripDate, addDays } from '../utils/date.js';
import { getPopularCities } from '../api/geocoding.js';
import { escapeHTML } from '../utils/sanitize.js';

/** Internal form state */
let _formState = {
  cities:      [{ name: '', nights: 2 }],
  startDate:   '',
  endDate:     '',
  style:       '',
  budget:      2000,
  currency:    'USD',
  groupSize:   1,
  flightClass: 'economy',
  interests:   [],
};

export function getFormState() { return { ..._formState }; }

/** Render the full wizard container */
export function renderWizard(container, currentStep, onSubmit) {
  container.innerHTML = `
    <div class="wizard-container">
      <div class="wizard-header">
        <div class="wizard-title">Plan Your Trip</div>
        ${renderStepProgress(currentStep)}
      </div>
      <div class="wizard-body">
        ${renderStep(currentStep)}
      </div>
      <div class="wizard-footer">
        <span class="step-info">Step ${currentStep} of 4</span>
        <div class="wizard-nav">
          ${currentStep > 1 ? `<button class="btn btn-secondary btn-sm" id="wizard-back">← Back</button>` : ''}
          ${currentStep < 4
            ? `<button class="btn btn-primary btn-sm" id="wizard-next">Continue →</button>`
            : `<button class="btn btn-primary" id="wizard-submit">✈️ Generate My Trip</button>`}
        </div>
      </div>
    </div>`;

  bindStepEvents(container, currentStep, onSubmit);
}

/** Step progress indicator */
function renderStepProgress(current) {
  const steps = ['Destinations', 'Style', 'Budget', 'Interests'];
  return `
    <div class="step-progress">
      ${steps.map((label, i) => {
        const n     = i + 1;
        const cls   = n < current ? 'completed' : n === current ? 'active' : '';
        const icon  = n < current ? '✓' : n;
        return `
          ${i > 0 ? `<div class="step-line ${n <= current ? 'filled' : ''}"></div>` : ''}
          <div class="step-item ${cls}">
            <div class="step-circle">${icon}</div>
            <span class="step-label">${label}</span>
          </div>`;
      }).join('')}
    </div>`;
}

/** Render step content */
function renderStep(step) {
  if (step === 1) return renderStep1();
  if (step === 2) return renderStep2();
  if (step === 3) return renderStep3();
  if (step === 4) return renderStep4();
  return '';
}

function renderStep1() {
  const minDate = minTripDate();
  const defaultEnd = addDays(new Date(minDate), 7).toISOString().split('T')[0];
  return `
    <div class="wizard-step active" id="step-1">
      <h2 class="step-heading">Where are you going?</h2>
      <p class="step-desc">Add one or more destinations. Specify how many nights at each.</p>
      <div id="city-rows">
        ${_formState.cities.map((c, i) => renderCityRow(c, i)).join('')}
      </div>
      <button class="add-city-btn" id="add-city-btn" type="button">
        + Add Another City
      </button>
      <div class="date-row" style="margin-top:20px;">
        <div class="input-group">
          <label class="input-label" for="start-date">Departure Date</label>
          <input class="input-field" type="date" id="start-date" min="${minDate}"
                 value="${_formState.startDate || minDate}">
        </div>
        <div class="input-group">
          <label class="input-label" for="end-date">Return Date</label>
          <input class="input-field" type="date" id="end-date" min="${minDate}"
                 value="${_formState.endDate || defaultEnd}">
        </div>
      </div>
      <div id="step-1-error" style="margin-top:8px;"></div>
    </div>`;
}

function renderCityRow(city, index) {
  const cities = getPopularCities();
  return `
    <div class="city-row" id="city-row-${index}">
      <div class="input-group" style="flex:1;">
        ${index === 0 ? `<label class="input-label" for="city-name-${index}">City / Destination</label>` : ''}
        <input class="input-field" type="text" list="city-suggestions"
               id="city-name-${index}" placeholder="e.g. Paris" value="${escapeHTML(city.name)}"
               autocomplete="off">
      </div>
      <div class="input-group city-nights">
        ${index === 0 ? `<label class="input-label" for="city-nights-${index}">Nights</label>` : ''}
        <input class="input-field" type="number" id="city-nights-${index}"
               min="1" max="30" value="${city.nights}" style="text-align:center;">
      </div>
      ${index > 0 ? `
        <button class="city-row-remove" data-remove="${index}" style="margin-top:0;" title="Remove">✕</button>
      ` : '<div style="width:32px;"></div>'}
    </div>
    <datalist id="city-suggestions">
      ${cities.map((c) => `<option value="${c}">`).join('')}
    </datalist>`;
}

function renderStep2() {
  return `
    <div class="wizard-step active" id="step-2">
      <h2 class="step-heading">What's your travel style?</h2>
      <p class="step-desc">This shapes your activity recommendations and hotel choices.</p>
      <div class="style-grid">
        ${VALID_STYLES.map((s) => {
          const m = STYLE_META[s];
          return `
            <div class="style-card ${_formState.style === s ? 'selected' : ''}" data-style="${s}" id="style-${s}">
              <span class="style-card-icon">${m.icon}</span>
              <span class="style-card-name">${m.label}</span>
              <span style="font-size:10px;color:var(--text-muted);text-align:center;">${m.desc}</span>
            </div>`;
        }).join('')}
      </div>
      <div id="step-2-error" style="margin-top:12px;"></div>
    </div>`;
}

function renderStep3() {
  return `
    <div class="wizard-step active" id="step-3">
      <h2 class="step-heading">What's your budget?</h2>
      <p class="step-desc">Total per person for the whole trip, including flights.</p>
      <div class="budget-grid">
        <div class="input-group">
          <label class="input-label">Total Budget (per person)</label>
          <div class="range-wrapper">
            <input class="range-slider" type="range" id="budget-slider"
                   min="300" max="15000" step="100" value="${_formState.budget}">
            <div class="range-labels"><span>$300</span><span>$15,000</span></div>
          </div>
          <div class="range-value" id="budget-display">$${_formState.budget.toLocaleString()}</div>
        </div>
        <div class="input-group">
          <label class="input-label">Currency</label>
          <select class="input-field select-field" id="currency-select">
            ${SUPPORTED_CURRENCIES.map((c) => `
              <option value="${c.code}" ${_formState.currency === c.code ? 'selected' : ''}>
                ${c.code} — ${c.name}
              </option>`).join('')}
          </select>
        </div>
      </div>
      <div class="budget-tier-row">
        ${[
          { key:'budget', icon:'🎒', label:'Budget', range:'< $1,500' },
          { key:'mid',    icon:'🌟', label:'Mid-Range', range:'$1,500–$5,000' },
          { key:'luxury', icon:'👑', label:'Luxury', range:'> $5,000' },
        ].map((t) => `
          <div class="budget-tier ${getBudgetTier(_formState.budget) === t.key ? 'selected' : ''}"
               id="tier-${t.key}">
            <div class="budget-tier-icon">${t.icon}</div>
            <div class="budget-tier-name">${t.label}</div>
            <div class="budget-tier-range">${t.range}</div>
          </div>`).join('')}
      </div>
      <div style="margin-top:20px;">
        <div class="input-group" style="flex-direction:row;align-items:center;gap:16px;flex-wrap:wrap;">
          <label class="input-label" style="white-space:nowrap;">Group Size</label>
          <div class="number-stepper">
            <button class="stepper-btn" id="group-minus">−</button>
            <span class="stepper-value" id="group-display">${_formState.groupSize}</span>
            <button class="stepper-btn" id="group-plus">+</button>
          </div>
          <div class="input-group" style="flex:1;min-width:160px;">
            <label class="input-label">Flight Class</label>
            <div class="flight-class-row">
              ${['economy','business','first'].map((fc) => `
                <div class="flight-class-opt ${_formState.flightClass === fc ? 'selected' : ''}"
                     data-class="${fc}">${fc.charAt(0).toUpperCase()+fc.slice(1)}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function renderStep4() {
  return `
    <div class="wizard-step active" id="step-4">
      <h2 class="step-heading">What are your interests?</h2>
      <p class="step-desc">Select everything that excites you — we'll prioritize these in your itinerary.</p>
      <div class="interest-grid">
        ${VALID_INTERESTS.map((tag) => {
          const m = INTEREST_META[tag];
          return `
            <div class="interest-chip ${_formState.interests.includes(tag) ? 'selected' : ''}"
                 data-interest="${tag}" id="interest-${tag}">
              <span class="interest-chip-icon">${m.icon}</span>
              <span>${m.label}</span>
            </div>`;
        }).join('')}
      </div>
      <div id="step-4-error" style="margin-top:12px;"></div>
    </div>`;
}

/** Bind all events for the current step */
function bindStepEvents(container, step, onSubmit) {
  // Navigation
  container.querySelector('#wizard-back')?.addEventListener('click', () => {
    saveStepData(step);
    onSubmit('back', _formState, step);
  });

  container.querySelector('#wizard-next')?.addEventListener('click', () => {
    saveStepData(step);
    onSubmit('next', _formState, step);
  });

  container.querySelector('#wizard-submit')?.addEventListener('click', () => {
    saveStepData(step);
    onSubmit('submit', _formState, step);
  });

  if (step === 1) bindStep1(container);
  if (step === 2) bindStep2(container);
  if (step === 3) bindStep3(container);
  if (step === 4) bindStep4(container);
}

function bindStep1(container) {
  container.querySelector('#add-city-btn')?.addEventListener('click', () => {
    saveStepData(1);
    _formState.cities.push({ name: '', nights: 2 });
    const rows = container.querySelector('#city-rows');
    rows.innerHTML = _formState.cities.map((c, i) => renderCityRow(c, i)).join('');
    bindCityRowEvents(container);
  });
  bindCityRowEvents(container);
}

function bindCityRowEvents(container) {
  container.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.remove, 10);
      _formState.cities.splice(idx, 1);
      const rows = container.querySelector('#city-rows');
      rows.innerHTML = _formState.cities.map((c, i) => renderCityRow(c, i)).join('');
      bindCityRowEvents(container);
    });
  });
}

function bindStep2(container) {
  container.querySelectorAll('.style-card').forEach((card) => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.style-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      _formState.style = card.dataset.style;
    });
  });
}

function bindStep3(container) {
  const slider  = container.querySelector('#budget-slider');
  const display = container.querySelector('#budget-display');
  const tiers   = container.querySelectorAll('.budget-tier');

  slider?.addEventListener('input', () => {
    _formState.budget = parseInt(slider.value, 10);
    if (display) display.textContent = `$${_formState.budget.toLocaleString()}`;
    const t = getBudgetTier(_formState.budget);
    tiers.forEach((el) => el.classList.toggle('selected', el.id === `tier-${t}`));
  });

  container.querySelector('#currency-select')?.addEventListener('change', (e) => {
    _formState.currency = e.target.value;
  });

  container.querySelector('#group-minus')?.addEventListener('click', () => {
    if (_formState.groupSize > 1) {
      _formState.groupSize--;
      container.querySelector('#group-display').textContent = _formState.groupSize;
    }
  });
  container.querySelector('#group-plus')?.addEventListener('click', () => {
    if (_formState.groupSize < 20) {
      _formState.groupSize++;
      container.querySelector('#group-display').textContent = _formState.groupSize;
    }
  });

  container.querySelectorAll('.flight-class-opt').forEach((opt) => {
    opt.addEventListener('click', () => {
      container.querySelectorAll('.flight-class-opt').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      _formState.flightClass = opt.dataset.class;
    });
  });
}

function bindStep4(container) {
  container.querySelectorAll('.interest-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.interest;
      if (_formState.interests.includes(tag)) {
        _formState.interests = _formState.interests.filter((i) => i !== tag);
        chip.classList.remove('selected');
      } else {
        _formState.interests.push(tag);
        chip.classList.add('selected');
      }
    });
  });
}

/** Sync DOM state into _formState before navigating */
function saveStepData(step) {
  if (step === 1) {
    const rows = document.querySelectorAll('.city-row');
    _formState.cities = Array.from(rows).map((_, i) => ({
      name:   (document.getElementById(`city-name-${i}`)?.value ?? '').trim(),
      nights: parseInt(document.getElementById(`city-nights-${i}`)?.value ?? '2', 10) || 2,
    }));
    _formState.startDate = document.getElementById('start-date')?.value ?? '';
    _formState.endDate   = document.getElementById('end-date')?.value   ?? '';
  }
}

/** Show validation errors in the step */
export function showStepErrors(step, errors) {
  const el = document.getElementById(`step-${step}-error`);
  if (!el) return;
  el.innerHTML = errors.map((e) => `
    <div class="input-error-msg">⚠️ ${e}</div>`).join('');
}

export function clearStepErrors(step) {
  const el = document.getElementById(`step-${step}-error`);
  if (el) el.innerHTML = '';
}

function getBudgetTier(amount) {
  if (amount < 1500) return 'budget';
  if (amount < 5000) return 'mid';
  return 'luxury';
}
