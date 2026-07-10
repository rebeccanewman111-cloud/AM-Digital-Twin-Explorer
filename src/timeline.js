import { state } from './state.js';
import { formatNumber } from './utils.js';
import { applyOverlay } from './overlay.js';
import { highlightChartIndex } from './charts.js';
import { getDatasetColumnMap, getNumericColumns } from './columnMap.js';

export function configureTimeline(viewer) {
  const slider = document.getElementById('timelineSlider');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  slider.addEventListener('input', () =>
    setCurrentIndex(Number(slider.value), viewer)
  );

  playBtn.addEventListener('click', () => play(viewer));
  pauseBtn.addEventListener('click', pause);

  document.addEventListener('chart-point-selected', e =>
    setCurrentIndex(e.detail.index, viewer)
  );
}

export function resetTimeline(viewer) {
  const slider = document.getElementById('timelineSlider');

  slider.max = Math.max(0, state.dataset.rows.length - 1);
  slider.value = 0;

  setCurrentIndex(0, viewer);
}

export function setCurrentIndex(index, viewer) {
  if (!state.dataset.rows.length) return;

  state.currentIndex = Math.max(
    0,
    Math.min(index, state.dataset.rows.length - 1)
  );

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
  if (state.playbackTimer) {
    clearInterval(state.playbackTimer);
  }

  state.playbackTimer = null;
}

function formatValue(value, unit = '') {
  if (value === null || value === undefined || value === '') return '—';

  const numeric = Number(value);

  if (!Number.isNaN(numeric)) {
    return `${formatNumber(numeric)} ${unit}`.trim();
  }

  return `${value} ${unit}`.trim();
}

function renderCurrentPoint() {
  const row = state.dataset.rows[state.currentIndex] ?? {};
  const map = getDatasetColumnMap(state.dataset);
  const numericColumns = getNumericColumns(state.dataset).map(column => column.name);

  const importantColumns = [
    map.time,
    map.point,
    map.force,
    map.elongation,
    map.position,
    map.stress,
    map.strain,
    ...numericColumns
  ].filter(Boolean);

  const uniqueColumns = [...new Set(importantColumns)].slice(0, 6);

  document.getElementById('playbackStatus').textContent =
    `Measurement ${state.currentIndex + 1} of ${state.dataset.rows.length}`;

  if (!uniqueColumns.length) {
    document.getElementById('currentPoint').innerHTML = `
      <div>
        <small>Status</small>
        <strong>No numeric columns found</strong>
      </div>
    `;
    return;
  }

  document.getElementById('currentPoint').innerHTML = uniqueColumns
    .map(column => {
      return `
        <div>
          <small>${column}</small>
          <strong>${formatValue(row[column], state.dataset.units?.[column] || '')}</strong>
        </div>
      `;
    })
    .join('');
}