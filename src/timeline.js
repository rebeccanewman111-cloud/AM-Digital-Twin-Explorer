import { state } from './state.js';
import { formatNumber } from './utils.js';
import { applyOverlay } from './overlay.js';
import { highlightChartIndex } from './charts.js';

export function configureTimeline(viewer) {
  const slider = document.getElementById('timelineSlider');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  slider.addEventListener('input', () => setCurrentIndex(Number(slider.value), viewer));
  playBtn.addEventListener('click', () => play(viewer));
  pauseBtn.addEventListener('click', pause);
  document.addEventListener('chart-point-selected', e => setCurrentIndex(e.detail.index, viewer));
}

export function resetTimeline(viewer) {
  const slider = document.getElementById('timelineSlider');
  slider.max = Math.max(0, state.dataset.rows.length - 1);
  slider.value = 0;
  setCurrentIndex(0, viewer);
}

export function setCurrentIndex(index, viewer) {
  if (!state.dataset.rows.length) return;
  state.currentIndex = Math.max(0, Math.min(index, state.dataset.rows.length - 1));
  document.getElementById('timelineSlider').value = state.currentIndex;
  renderCurrentPoint();
  applyOverlay(viewer);
  highlightChartIndex(state.currentIndex);
}

function play(viewer) {
  if (!state.dataset.rows.length || state.playbackTimer) return;
  state.playbackTimer = setInterval(() => {
    const next = state.currentIndex + 1;
    if (next >= state.dataset.rows.length) {
      pause();
      return;
    }
    setCurrentIndex(next, viewer);
  }, 120);
}

function pause() {
  if (state.playbackTimer) clearInterval(state.playbackTimer);
  state.playbackTimer = null;
}

function renderCurrentPoint() {
  const row = state.dataset.rows[state.currentIndex] ?? {};
  document.getElementById('playbackStatus').textContent = `Point ${state.currentIndex + 1} of ${state.dataset.rows.length}`;
  document.getElementById('currentPoint').innerHTML = [
    ['Point', formatNumber(row.Point, 2)],
    ['Force', `${formatNumber(row.Force)} N`],
    ['Elongation', `${formatNumber(row.Elongation)} mm`],
    ['Stress', row['Engineering Stress'] !== undefined ? `${formatNumber(row['Engineering Stress'])} MPa` : '—']
  ].map(([k, v]) => `<div><small>${k}</small><strong>${v}</strong></div>`).join('');
}
