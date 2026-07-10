import * as THREE from 'three';
import { state } from './state.js';
import { toNumber, normalize, colorFromNormalized } from './utils.js';
import { getDatasetColumnMap, getNumericColumns } from './columnMap.js';

export function applyOverlay(viewer) {
  if (!state.model) return;

  const material = viewer.material;
  if (!material) return;

  if (
    state.overlayMode === 'none' ||
    !state.dataset?.rows?.length
  ) {
    material.color.set('#9fb7d9');
    updateOverlayReadout('No overlay active.');
    return;
  }

  const column = getOverlayColumn(state.overlayMode, state.dataset);

  if (!column) {
    material.color.set('#9fb7d9');
    updateOverlayReadout('No compatible numeric column found for overlay.');
    return;
  }

  const rows = state.dataset.rows;
  const values = rows
    .map(row => toNumber(row[column]))
    .filter(value => value !== null && !Number.isNaN(value));

  if (!values.length) {
    material.color.set('#9fb7d9');
    updateOverlayReadout(`Column "${column}" does not contain numeric overlay values.`);
    return;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  const row = rows[state.currentIndex] ?? rows[0];
  const currentValue = toNumber(row[column]);

  if (currentValue === null || Number.isNaN(currentValue)) {
    material.color.set('#9fb7d9');
    updateOverlayReadout(`No numeric value at this playback point for "${column}".`);
    return;
  }

  const t = normalize(currentValue, min, max);

  material.color = new THREE.Color(colorFromNormalized(t));

  updateOverlayReadout(
    `Global overlay: ${column} = ${formatOverlayValue(currentValue)}. This colors the whole part from the experimental data row, not a local stress/FEA field.`
  );
}

function getOverlayColumn(overlayMode, dataset) {
  const map = getDatasetColumnMap(dataset);
  const numericColumns = getNumericColumns(dataset).map(column => column.name);

  const fallback1 = numericColumns[0] || null;
  const fallback2 = numericColumns[1] || fallback1;
  const fallback3 = numericColumns[2] || fallback1;
  const fallback4 = numericColumns[3] || fallback1;

  const overlayColumns = {
    force: map.force || fallback1,
    elongation: map.elongation || map.position || fallback2,
    strain: map.strain || fallback3,
    stress: map.stress || fallback4,

    numeric1: fallback1,
    numeric2: fallback2,
    numeric3: fallback3,
    numeric4: fallback4
  };

  return overlayColumns[overlayMode] || fallback1;
}

function formatOverlayValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: 4
  });
}

function updateOverlayReadout(message) {
  const status = document.getElementById('overlayReadout');

  if (status) {
    status.textContent = message;
  }
}