/**
 * itinerary.js — Render day cards, timeline, hotels, flights, budget tracker
 */

import { formatShort, formatTime } from '../utils/date.js';
import { formatCurrency }          from '../utils/currency.js';
import { getAmenityIcon }          from '../api/hotels.js';
import { getFlightStatusDisplay, formatDuration } from '../api/flights.js';
import { getBudgetStatus, getBudgetPct, getBreakdownRows } from '../engine/budget.js';
import { AppState }                from '../state.js';

/** Render the full itinerary section */
export function renderItinerary(container, itinerary, prefs, onReplan) {
  if (!itinerary || itinerary.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🗺️</div>
        <h3 class="empty-state-title">Your itinerary will appear here</h3>
        <p class="empty-state-desc">Fill in your travel preferences above and click "Generate My Trip" to get started.</p>
      </div>`;
    return;
  }

  // City nav tabs
  const cities = [...new Set(itinerary.map((d) => d.cityName))];
  const cityNav = cities.map((c, i) => `
    <button class="city-nav-btn ${i === 0 ? 'active' : ''}" data-city="${c}" id="city-nav-${i}">
      📍 ${c}
    </button>`).join('');

  // Day cards
  const dayCards = itinerary.map((day, i) =>
    renderDayCard(day, i, prefs, onReplan)
  ).join('');

  container.innerHTML = `
    <div class="itinerary-header anim-fade-up">
      <div class="itinerary-title-block">
        <h2 class="section-title">Your Itinerary</h2>
        <p class="section-subtitle">${itinerary.length} days · ${cities.length} ${cities.length === 1 ? 'city' : 'cities'}</p>
      </div>
      <div class="itinerary-meta">
        <span class="badge badge-indigo">✈️ ${prefs?.flightClass ?? 'Economy'}</span>
        <span class="badge badge-cyan">👥 ${prefs?.groupSize ?? 1} traveller${(prefs?.groupSize ?? 1) > 1 ? 's' : ''}</span>
        <span class="badge badge-violet">🎯 ${capitalize(prefs?.style ?? 'cultural')}</span>
      </div>
    </div>
    <nav class="city-nav" aria-label="City navigation">${cityNav}</nav>
    <div class="days-grid" id="days-grid">${dayCards}</div>
  `;

  // City nav click — smooth scroll to first day of that city
  container.querySelectorAll('.city-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.city-nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cityName = btn.dataset.city;
      const target = container.querySelector(`.day-card[data-city="${cityName}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Re-plan buttons
  container.querySelectorAll('[data-action="replan-day"]').forEach((btn) => {
    btn.addEventListener('click', () => onReplan(parseInt(btn.dataset.dayIndex, 10)));
  });
}

/** Render a single day card */
function renderDayCard(day, i, prefs, onReplan) {
  const disrupted = day.disrupted ? 'disrupted' : '';
  const currency  = prefs?.budget?.currency ?? 'USD';

  return `
    <article class="day-card ${disrupted} anim-fade-up delay-${Math.min(i + 1, 8)}"
             id="day-card-${i}" data-city="${day.cityName}">

      ${day.disrupted ? `
        <div class="disruption-banner">
          <span class="disruption-icon">⚠️</span>
          <span class="disruption-msg">This day has been affected by a disruption. Review alerts or re-plan.</span>
          <button class="btn btn-sm btn-outline" data-action="replan-day" data-day-index="${i}">Re-plan</button>
        </div>` : ''}

      <div class="day-card-header">
        <div class="day-number-block">
          <div class="day-number-badge">D${i + 1}</div>
          <div class="day-info">
            <div class="day-title">📍 ${day.cityName}${day.country ? `, ${day.country}` : ''}</div>
            <div class="day-date">${formatShort(day.date)}${day.isTravelDay ? ' · Travel Day' : ''}</div>
          </div>
        </div>
        <div class="day-header-right">
          ${renderWeatherWidget(day.weather)}
          <button class="btn btn-ghost btn-sm" data-action="replan-day" data-day-index="${i}" title="Re-plan this day">🔄</button>
        </div>
      </div>

      <div class="day-card-body">
        ${day.flight ? renderFlightBlock(day.flight) : ''}

        <div class="timeline">${renderTimeline(day.activities)}</div>

        ${renderHotelCard(day.hotel, currency)}

        ${renderSpendBar(day.spend, currency)}
      </div>
    </article>`;
}

function renderWeatherWidget(w) {
  if (!w) return '';
  return `
    <div class="weather-widget" title="${w.label} · Wind: ${w.windspeed}km/h">
      <span class="weather-icon">${w.icon}</span>
      <span class="weather-temp">${w.tempMax}°C</span>
      <span class="weather-condition">${w.label}</span>
      ${w.isMock ? '<span style="font-size:9px;color:var(--text-muted);">(est)</span>' : ''}
    </div>`;
}

function renderTimeline(activities) {
  if (!activities?.length) return '<p style="color:var(--text-muted);font-size:13px;">No activities planned.</p>';
  const DOT_CLASSES = { morning:'morning', afternoon:'afternoon', evening:'evening' };

  return activities.map((act) => `
    <div class="timeline-slot">
      <div class="timeline-time">
        <div class="timeline-dot ${DOT_CLASSES[act.slot] ?? ''}"></div>
        <div class="timeline-label">${act.slot ?? ''}</div>
      </div>
      <div class="timeline-content">
        <div class="activity-item ${act.weatherWarning ? 'weather-warning' : ''}">
          <div class="activity-icon ${act.type ?? ''}">
            <span>${act.icon ?? '📍'}</span>
          </div>
          <div class="activity-body">
            <div class="activity-name">${act.name}${act._replanned ? ' <span class="badge badge-emerald" style="font-size:9px;padding:1px 5px;">Updated</span>' : ''}</div>
            <div class="activity-desc">${act.desc ?? ''}</div>
            <div class="activity-meta">
              ${act.duration ? `<span class="activity-meta-item">⏱️ ${act.duration}</span>` : ''}
              ${act.rating   ? `<span class="activity-meta-item">⭐ ${act.rating}</span>` : ''}
              ${act.weatherWarning ? `<span class="activity-meta-item" style="color:var(--accent-amber);">🌧️ Weather advisory</span>` : ''}
            </div>
          </div>
          <div class="activity-cost">${act.cost ? '$' + act.cost : 'Free'}</div>
        </div>
      </div>
    </div>`).join('');
}

function renderHotelCard(hotel, currency) {
  if (!hotel) return '';
  const stars = '⭐'.repeat(hotel.stars ?? 3);
  return `
    <div class="hotel-card">
      <div class="hotel-card-header">
        <div>
          <div class="hotel-tag">🏨 Tonight's Stay</div>
          <div class="hotel-name">${hotel.name}</div>
          <div class="hotel-stars">${stars}</div>
          ${hotel.neighborhood ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">📍 ${hotel.neighborhood}</div>` : ''}
        </div>
        <div class="hotel-price-block">
          <div class="hotel-price">$${hotel.pricePerNight}</div>
          <div class="hotel-price-per">/ night</div>
          <div class="hotel-rating">⭐ ${hotel.rating}</div>
        </div>
      </div>
      <div class="hotel-amenities">
        ${(hotel.amenities ?? []).slice(0, 6).map((a) => `
          <span class="amenity-chip">${getAmenityIcon(a)} ${a}</span>`).join('')}
      </div>
    </div>`;
}

function renderFlightBlock(flight) {
  if (!flight) return '';
  const { label, cssClass } = getFlightStatusDisplay(flight.status);
  return `
    <div class="flight-block" style="grid-column:1/-1;">
      <span class="flight-icon">✈️</span>
      <div class="flight-route">
        <span class="flight-city">${flight.from} <span style="font-size:11px;color:var(--text-muted);">(${flight.fromCode})</span></span>
        <div class="flight-arrow">
          <div class="flight-line"></div>
          <span style="font-size:11px;color:var(--text-muted);">${formatDuration(flight.duration ?? 0)}</span>
        </div>
        <span class="flight-city">${flight.to} <span style="font-size:11px;color:var(--text-muted);">(${flight.toCode})</span></span>
      </div>
      <div class="flight-meta">
        <span class="flight-airline">${flight.airline}</span>
        <span class="flight-times">${flight.departure ? formatTime(flight.departure) : '—'} → ${flight.arrival ? formatTime(flight.arrival) : '—'}</span>
        <span class="flight-status-badge ${cssClass}">${label}</span>
        ${flight.isSimulated ? '<span class="flight-status-badge simulated" style="font-size:9px;">[Simulated]</span>' : ''}
      </div>
    </div>`;
}

function renderSpendBar(spend, currency) {
  if (!spend) return '';
  return `
    <div class="day-spend-bar" style="grid-column:1/-1;">
      <div class="spend-items">
        <div class="spend-item"><span class="spend-item-label">🏨 Hotel</span><span class="spend-item-value">$${spend.hotel ?? 0}</span></div>
        <div class="spend-item"><span class="spend-item-label">🎯 Activities</span><span class="spend-item-value">$${spend.activities ?? 0}</span></div>
        <div class="spend-item"><span class="spend-item-label">🍽️ Food</span><span class="spend-item-value">$${spend.food ?? 0}</span></div>
        <div class="spend-item"><span class="spend-item-label">🚌 Transport</span><span class="spend-item-value">$${spend.transport ?? 0}</span></div>
      </div>
      <div>
        <div class="spend-total-label">Est. Day Total</div>
        <div class="spend-total">$${spend.total ?? 0}</div>
      </div>
    </div>`;
}

/** Render budget tracker section */
export function renderBudgetTracker(container, budget) {
  if (!budget?.total) { container.innerHTML = ''; return; }

  const pct     = getBudgetPct(budget.spent, budget.total);
  const status  = getBudgetStatus(budget.spent, budget.total);
  const rows    = getBreakdownRows(budget.breakdown ?? {}, budget.alloc ?? {}, budget.currency ?? 'USD');
  const currency = budget.currency ?? 'USD';
  const remaining = Math.max(0, budget.total - budget.spent);

  const fillClass = status === 'ok' ? '' : status === 'warning' ? 'amber' : 'amber';

  container.innerHTML = `
    <div class="budget-tracker anim-fade-up">
      <div class="section-header">
        <div><h2 class="section-title">💰 Budget Tracker</h2><p class="section-subtitle">Per person: $${budget.perPerson?.toLocaleString() ?? 0} · Group of ${budget.groupSize ?? 1}</p></div>
        <span class="badge ${status === 'ok' ? 'badge-emerald' : status === 'warning' ? 'badge-amber' : 'badge-rose'}">${status === 'ok' ? 'On Track' : status === 'warning' ? 'Near Limit' : 'Over Budget'}</span>
      </div>
      <div class="budget-overview">
        <div class="budget-stat">
          <div class="budget-stat-label">Total Budget</div>
          <div class="budget-stat-value">$${budget.total?.toLocaleString()}</div>
        </div>
        <div class="budget-stat">
          <div class="budget-stat-label">Estimated Spend</div>
          <div class="budget-stat-value ${status}">${formatCurrency(budget.spent, currency, { compact: true })}</div>
        </div>
        <div class="budget-stat">
          <div class="budget-stat-label">Remaining</div>
          <div class="budget-stat-value success">${formatCurrency(remaining, currency, { compact: true })}</div>
        </div>
        <div class="budget-stat">
          <div class="budget-stat-label">Used</div>
          <div class="budget-stat-value">${pct}%</div>
        </div>
      </div>
      <div style="margin-bottom:20px;">
        <div class="progress-bar" style="height:10px;">
          <div class="progress-fill ${fillClass}" style="width:${pct}%;"></div>
        </div>
        <div class="range-labels" style="margin-top:6px;">
          <span>0%</span><span>${pct}% used</span><span>100%</span>
        </div>
      </div>
      <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;">Breakdown by Category</h4>
      <div class="budget-breakdown">
        ${rows.map((r) => `
          <div class="breakdown-item">
            <span class="breakdown-label">${r.label}</span>
            <div class="breakdown-bar-track">
              <div class="breakdown-bar-fill" style="width:${r.pct}%;background:${r.color};"></div>
            </div>
            <span class="breakdown-amount">${r.formatted}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

/** Highlight a day card that was just re-planned */
export function flashDayCard(dayIndex) {
  const card = document.getElementById(`day-card-${dayIndex}`);
  if (!card) return;
  card.classList.remove('updated');
  void card.offsetWidth; // reflow
  card.classList.add('updated');
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false }); }
  catch { return iso; }
}
