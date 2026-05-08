/**
 * alerts.js — Real-time alert panel rendering + toast system
 */

import { AppState, dismissAlert } from '../state.js';
import { timeAgo } from '../utils/date.js';

const SEVERITY_ICONS = { info:'ℹ️', warning:'⚠️', critical:'🚨', success:'✅' };

/** Render the full alerts panel */
export function renderAlertsPanel(container, onReplan) {
  const alerts  = AppState.alerts.filter((a) => !a.dismissed);
  const panel   = container.querySelector('#alerts-panel-card');
  if (!panel) return;

  const countEl = panel.querySelector('.alerts-count-badge');
  if (countEl) countEl.textContent = alerts.length || '';
  if (countEl) countEl.style.display = alerts.length ? '' : 'none';

  const list = panel.querySelector('.alerts-list');
  if (!list) return;

  if (alerts.length === 0) {
    list.innerHTML = `
      <div class="no-alerts">
        <div class="no-alerts-icon">🛡️</div>
        <div class="no-alerts-title">All Clear</div>
        <div class="no-alerts-desc">No disruptions detected. We'll keep monitoring your trip.</div>
      </div>`;
    return;
  }

  list.innerHTML = alerts.map((alert) => `
    <div class="alert-item ${alert.severity}" data-id="${alert.id}">
      <div class="alert-item-top">
        <span class="alert-type-icon">${SEVERITY_ICONS[alert.severity] ?? 'ℹ️'}</span>
        <span class="alert-severity-badge ${alert.severity}">${alert.severity.toUpperCase()}</span>
        <span class="alert-type-icon" style="font-size:11px;color:var(--text-muted);">${getTypeLabel(alert.type)}</span>
        <span class="alert-time">${timeAgo(alert.timestamp)}</span>
      </div>
      <div class="alert-message">${alert.message}</div>
      <div class="alert-actions">
        ${alert.action === 'replan' ? `
          <button class="alert-action-btn replan" data-action="replan" data-day="${alert.affectedDay}" data-id="${alert.id}">
            🔄 Re-plan Day
          </button>` : ''}
        <button class="alert-action-btn dismiss" data-action="dismiss" data-id="${alert.id}">
          Dismiss
        </button>
      </div>
    </div>
  `).join('');

  // Bind action buttons
  list.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const action  = btn.dataset.action;
      const alertId = btn.dataset.id;
      const dayIdx  = parseInt(btn.dataset.day ?? '-1', 10);

      if (action === 'dismiss') {
        dismissAlert(alertId);
        renderAlertsPanel(container, onReplan);
      }
      if (action === 'replan' && dayIdx >= 0) {
        dismissAlert(alertId);
        onReplan(dayIdx);
      }
    });
  });

  // Update last-refreshed time
  const refreshEl = panel.querySelector('.alerts-refresh-time');
  if (refreshEl) refreshEl.textContent = `Updated ${timeAgo(new Date())}`;
}

/** Render the alerts panel shell (called once on init) */
export function createAlertsPanelHTML() {
  return `
    <div class="alerts-panel-card" id="alerts-panel-card">
      <div class="alerts-panel-header">
        <div class="alerts-panel-title">
          <span>Real-Time Alerts</span>
          <span class="alerts-live-badge">
            <span class="alerts-live-dot"></span> LIVE
          </span>
        </div>
        <span class="alerts-count-badge" style="display:none;">0</span>
      </div>
      <div class="alerts-list">
        <div class="no-alerts">
          <div class="no-alerts-icon">🛡️</div>
          <div class="no-alerts-title">Waiting for your trip…</div>
          <div class="no-alerts-desc">Generate an itinerary to start real-time monitoring.</div>
        </div>
      </div>
      <div class="alerts-panel-footer">
        <div class="alerts-refresh-info">
          <span class="spinner spinner--sm"></span>
          <span>Auto-refresh every 5 min</span>
        </div>
        <span class="alerts-refresh-time" style="font-size:11px;color:var(--text-muted);"></span>
      </div>
    </div>`;
}

// ── Toast System ──────────────────────────────────────────────

const TYPE_COLORS = { info:'toast-info', success:'toast-success', warning:'toast-warning', error:'toast-error' };
const TYPE_ICONS  = { info:'ℹ️', success:'✅', warning:'⚠️', error:'❌' };

/**
 * Show a toast notification.
 * @param {{ title, message, type, duration }} opts
 */
export function showToast({ title, message, type = 'info', duration = 4500 }) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${TYPE_COLORS[type] ?? ''}`;
  toast.innerHTML = `
    <span class="toast-icon">${TYPE_ICONS[type] ?? 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close btn-ghost btn-icon-sm" aria-label="Close">✕</button>
  `;

  container.appendChild(toast);

  const close = () => {
    toast.classList.add('dismissing');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', close);
  setTimeout(close, duration);
}

function getTypeLabel(type) {
  return { weather:'Weather', flight:'Flight', hotel:'Hotel' }[type] ?? type;
}
