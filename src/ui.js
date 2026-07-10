import { state } from './state.js';
import { parseCSVText, parseJSONText } from './parser.js';
import { computeStatistics, buildSummary } from './statistics.js';
import { updateCharts } from './charts.js';
import { resetTimeline } from './timeline.js';
import { applyOverlay } from './overlay.js';
import { getDatasetColumnMap } from './columnMap.js';

let activeViewer = null;

export function bindUI(viewer) {
  activeViewer = viewer;

  document.getElementById('modelInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    await viewer.loadFile(file);

    state.modelFileName = file.name;

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

  document.getElementById('wireframeToggle').addEventListener('change', e =>
    viewer.setWireframe(e.target.checked)
  );

  document.getElementById('transparentToggle').addEventListener('change', e =>
    viewer.setTransparent(e.target.checked)
  );

  document.getElementById('autorotateToggle').addEventListener('change', e =>
    viewer.autorotate = e.target.checked
  );

  document.getElementById('resetCameraBtn').addEventListener('click', () =>
    viewer.frameModel()
  );

  document.getElementById('isoCameraBtn').addEventListener('click', () =>
    viewer.setCameraPreset('iso')
  );

  document.getElementById('frontCameraBtn').addEventListener('click', () =>
    viewer.setCameraPreset('front')
  );

  document.getElementById('topCameraBtn').addEventListener('click', () =>
    viewer.setCameraPreset('top')
  );

  document.getElementById('screenshotBtn').addEventListener('click', () =>
    viewer.screenshot()
  );

  document.getElementById('fullscreenBtn').addEventListener('click', () =>
    document.getElementById('viewerContainer').requestFullscreen()
  );

  document.getElementById('themeToggle').addEventListener('click', () =>
    document.body.classList.toggle('light')
  );

  document.getElementById('overlaySelect').addEventListener('change', e => {
    state.overlayMode = e.target.value;
    applyOverlay(viewer);
  });

  document.getElementById('tableSearch').addEventListener('input', e =>
    renderDataTable(e.target.value)
  );

  const applyMappingBtn = document.getElementById('applyColumnMappingBtn');

  if (applyMappingBtn) {
    applyMappingBtn.addEventListener('click', () => {
      applyColumnMappingFromUI();
      refreshAnalysis(viewer);
    });
  }
}

export async function loadDefaultData(viewer) {
  const response = await fetch('./data/tensile_test.csv');
  const text = await response.text();

  loadDatasetFromText(text, 'tensile_test.csv', viewer);
}

export function loadDatasetFromText(text, fileName, viewer, manifest = null) {
  state.dataset = fileName.toLowerCase().endsWith('.json')
    ? parseJSONText(text)
    : parseCSVText(text);

  state.dataset.manifest = manifest;
  state.dataset.columnRoles = manifest?.columnRoles || {};
  state.dataset.units = manifest?.units || {};

  state.dataFileName = fileName;

  renderColumnMappingPanel();
  refreshAnalysis(viewer);
}

function refreshAnalysis(viewer = activeViewer) {
  if (!state.dataset) return;

  const stats = computeStatistics(state.dataset);

  updateCharts(state.dataset);
  renderStats(stats);

  renderMetadata({
    ...state.dataset.metadata,
    ...(state.dataset.manifest
      ? {
          'Part ID': state.dataset.manifest.partId || '',
          'Part Name': state.dataset.manifest.partName || ''
        }
      : {})
  });

  renderDataTable('');
  renderFileList();

  document.getElementById('summaryText').textContent =
    buildSummary(state.dataset, stats);

  resetTimeline(viewer);
  applyOverlay(viewer);
}

function renderColumnMappingPanel() {
  const panel = document.getElementById('columnMappingPanel');

  if (!panel) {
    console.warn('columnMappingPanel was not found in index.html');
    return;
  }

  if (!state.dataset?.columns?.length) {
    panel.innerHTML = 'No dataset columns found.';
    return;
  }

  const columns = state.dataset.columns;
  const detectedMap = getDatasetColumnMap(state.dataset);
  const currentRoles = state.dataset.columnRoles || {};

  const roles = [
    ['force', 'Force / Load', detectedMap.force],
    ['elongation', 'Elongation / Extension', detectedMap.elongation],
    ['time', 'Time', detectedMap.time],
    ['position', 'Position / Displacement', detectedMap.position],
    ['stress', 'Stress', detectedMap.stress],
    ['strain', 'Strain', detectedMap.strain],
    ['point', 'Point / Index', detectedMap.point]
  ];

  panel.innerHTML = roles
    .map(([roleKey, label, detectedColumn]) => {
      const selectedColumn = currentRoles[roleKey] || detectedColumn || '';

      return `
        <div class="metadata-item">
          <span>${escapeHtml(label)}</span>
          <select class="column-role-select" data-role="${escapeHtml(roleKey)}">
            <option value="">Not mapped</option>
            ${columns
              .map(column => {
                const selected = column === selectedColumn ? 'selected' : '';
                return `<option value="${escapeHtml(column)}" ${selected}>${escapeHtml(column)}</option>`;
              })
              .join('')}
          </select>
        </div>
      `;
    })
    .join('');
}

function applyColumnMappingFromUI() {
  const panel = document.getElementById('columnMappingPanel');

  if (!panel || !state.dataset) return;

  const selects = panel.querySelectorAll('.column-role-select');

  const newRoles = {};

  selects.forEach(select => {
    const role = select.dataset.role;
    const column = select.value;

    if (role && column) {
      newRoles[role] = column;
    }
  });

  state.dataset.columnRoles = newRoles;

  console.log('Applied column mapping:', newRoles);
}

function renderStats(stats) {
  const priority = [
    'Max Force',
    'Max Elongation',
    'Max Engineering Stress',
    'Max Engineering Strain',
    'Test Duration',
    'Motor Speed',
    'Sample Time',
    'Cross-section Area',
    'Rows Analyzed',
    'Detected Columns'
  ];

  const entries = [
    ...priority
      .filter(key => stats[key])
      .map(key => [key, stats[key]]),
    ...Object.entries(stats)
      .filter(([key]) => !priority.includes(key))
      .slice(0, 8)
  ];

  document.getElementById('statsGrid').innerHTML = entries
    .map(([key, value]) => {
      return `
        <div>
          <small>${escapeHtml(key)}</small>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
    })
    .join('');
}

function renderMetadata(metadata) {
  document.getElementById('metadataList').innerHTML = Object.entries(metadata)
    .map(([key, value]) => {
      return `
        <div class="metadata-item">
          <span>${escapeHtml(key)}</span>
          <strong>${escapeHtml(value || '—')}</strong>
        </div>
      `;
    })
    .join('');
}

function renderDataTable(search = '') {
  if (!state.dataset?.rows?.length) {
    document.getElementById('dataTable').innerHTML = 'No data loaded.';
    return;
  }

  const rows = state.dataset.rows;
  const columns = state.dataset.columns;

  const filtered = rows
    .filter(row =>
      JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 80);

  document.getElementById('dataTable').innerHTML = `
    <table>
      <thead>
        <tr>
          ${columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${filtered
          .map(row => {
            return `
              <tr>
                ${columns
                  .map(column => `<td>${escapeHtml(row[column] ?? '')}</td>`)
                  .join('')}
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

function renderFileList() {
  document.getElementById('fileList').innerHTML = `
    <p><strong>Model:</strong> ${escapeHtml(state.modelFileName ?? 'None')}</p>
    <p><strong>Data:</strong> ${escapeHtml(state.dataFileName ?? 'None')}</p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}