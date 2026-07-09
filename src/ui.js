import { state } from './state.js';
import { parseCSVText, parseJSONText } from './parser.js';
import { computeStatistics, buildSummary } from './statistics.js';
import { updateCharts } from './charts.js';
import { resetTimeline } from './timeline.js';
import { applyOverlay } from './overlay.js';

export function bindUI(viewer) {
  document.getElementById('modelInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    await viewer.loadFile(file);
    renderFileList();
    document.getElementById('viewerTitle').textContent = file.name;
    document.getElementById('viewerStatus').textContent = 'Model loaded.';
  });

  document.getElementById('dataInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    loadDatasetFromText(text, file.name, viewer);
  });

  document.getElementById('wireframeToggle').addEventListener('change', e => viewer.setWireframe(e.target.checked));
  document.getElementById('transparentToggle').addEventListener('change', e => viewer.setTransparent(e.target.checked));
  document.getElementById('autorotateToggle').addEventListener('change', e => viewer.autorotate = e.target.checked);
  document.getElementById('resetCameraBtn').addEventListener('click', () => viewer.frameModel());
  document.getElementById('isoCameraBtn').addEventListener('click', () => viewer.setCameraPreset('iso'));
  document.getElementById('frontCameraBtn').addEventListener('click', () => viewer.setCameraPreset('front'));
  document.getElementById('topCameraBtn').addEventListener('click', () => viewer.setCameraPreset('top'));
  document.getElementById('screenshotBtn').addEventListener('click', () => viewer.screenshot());
  document.getElementById('fullscreenBtn').addEventListener('click', () => document.getElementById('viewerContainer').requestFullscreen());
  document.getElementById('themeToggle').addEventListener('click', () => document.body.classList.toggle('light'));
  document.getElementById('overlaySelect').addEventListener('change', e => { state.overlayMode = e.target.value; applyOverlay(viewer); });
  document.getElementById('tableSearch').addEventListener('input', e => renderDataTable(e.target.value));
}

export async function loadDefaultData(viewer) {
  const response = await fetch('./data/tensile_test.csv');
  const text = await response.text();
  loadDatasetFromText(text, 'tensile_test.csv', viewer);
}

export function loadDatasetFromText(text, fileName, viewer) {
  state.dataset = fileName.toLowerCase().endsWith('.json') ? parseJSONText(text) : parseCSVText(text);
  state.dataFileName = fileName;
  const stats = computeStatistics(state.dataset);
  updateCharts(state.dataset);
  renderStats(stats);
  renderMetadata(state.dataset.metadata);
  renderDataTable('');
  renderFileList();
  document.getElementById('summaryText').textContent = buildSummary(state.dataset, stats);
  resetTimeline(viewer);
}

function renderStats(stats) {
  const priority = ['Max Force','Max Elongation','Max Engineering Stress','Max Engineering Strain','Test Duration','Motor Speed','Sample Time','Cross-section Area'];
  const entries = [...priority.filter(k => stats[k]).map(k => [k, stats[k]]), ...Object.entries(stats).filter(([k]) => !priority.includes(k)).slice(0, 8)];
  document.getElementById('statsGrid').innerHTML = entries.map(([k, v]) => `<div><small>${k}</small><strong>${v}</strong></div>`).join('');
}

function renderMetadata(metadata) {
  document.getElementById('metadataList').innerHTML = Object.entries(metadata).map(([k, v]) => `<div class="metadata-item"><span>${k}</span><strong>${v || '—'}</strong></div>`).join('');
}

function renderDataTable(search = '') {
  const rows = state.dataset.rows;
  const columns = state.dataset.columns;
  const filtered = rows.filter(row => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())).slice(0, 80);
  document.getElementById('dataTable').innerHTML = `<table><thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filtered.map(row => `<tr>${columns.map(c => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function renderFileList() {
  document.getElementById('fileList').innerHTML = `<p><strong>Model:</strong> ${state.modelFileName ?? 'None'}</p><p><strong>Data:</strong> ${state.dataFileName ?? 'None'}</p>`;
}
