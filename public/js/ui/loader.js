/**
 * loader.js — Skeleton screens and loading states
 */

/** Show full-page itinerary skeleton while generating */
export function showItinerarySkeleton(container, dayCount = 5) {
  container.innerHTML = Array.from({ length: dayCount }, (_, i) => `
    <div class="day-card" style="animation-delay:${i * 80}ms">
      <div class="day-card-header">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="skeleton" style="width:40px;height:40px;border-radius:10px;"></div>
          <div>
            <div class="skeleton" style="width:140px;height:16px;margin-bottom:6px;"></div>
            <div class="skeleton" style="width:90px;height:12px;"></div>
          </div>
        </div>
        <div class="skeleton" style="width:100px;height:30px;border-radius:999px;"></div>
      </div>
      <div class="day-card-body">
        <div>
          ${Array.from({length:3}, () => `
            <div style="display:flex;gap:12px;margin-bottom:12px;">
              <div class="skeleton" style="width:36px;height:36px;border-radius:8px;flex-shrink:0;"></div>
              <div style="flex:1;">
                <div class="skeleton" style="width:70%;height:14px;margin-bottom:6px;"></div>
                <div class="skeleton" style="width:50%;height:11px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <div>
          <div class="skeleton" style="width:100%;height:120px;border-radius:16px;"></div>
        </div>
      </div>
    </div>
  `).join('');
}

/** Show a centered spinner with message */
export function showSpinner(container, message = 'Loading…') {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:16px;">
      <div class="spinner spinner--lg"></div>
      <p style="color:var(--text-muted);font-size:var(--text-sm);">${message}</p>
    </div>
  `;
}

/** Inline progress bar (used during generation) */
export function showProgress(container, pct, message) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:20px;text-align:center;">
      <div style="font-size:48px;animation:float 3s ease-in-out infinite;">✈️</div>
      <h3 style="font-size:var(--text-xl);font-weight:700;color:var(--text-primary);">Building Your Itinerary</h3>
      <p style="color:var(--text-muted);font-size:var(--text-sm);max-width:320px;">${message}</p>
      <div style="width:280px;">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;">
          <span style="font-size:11px;color:var(--text-muted);">Analyzing preferences</span>
          <span style="font-size:11px;color:var(--accent-indigo-light);font-weight:600;">${pct}%</span>
        </div>
      </div>
    </div>
  `;
}

/** Alert item skeleton */
export function alertSkeleton() {
  return `
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);">
      <div class="skeleton" style="width:60%;height:12px;margin-bottom:8px;"></div>
      <div class="skeleton" style="width:90%;height:11px;"></div>
    </div>
  `.repeat(3);
}
