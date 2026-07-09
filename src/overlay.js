import * as THREE from 'three';
import { state } from './state.js';
import { toNumber, normalize, colorFromNormalized } from './utils.js';

const overlayMap = {
  force: 'Force',
  elongation: 'Elongation',
  strain: 'Engineering Strain',
  stress: 'Engineering Stress'
};

export function applyOverlay(viewer) {
  if (!state.model) return;
  const material = viewer.material;
  if (!material) return;
  if (state.overlayMode === 'none' || !state.dataset.rows.length) {
    material.color.set('#9fb7d9');
    return;
  }
  const column = overlayMap[state.overlayMode];
  const values = state.dataset.rows.map(row => toNumber(row[column])).filter(v => v !== null);
  if (!values.length) return;
  const row = state.dataset.rows[state.currentIndex] ?? state.dataset.rows[0];
  const t = normalize(toNumber(row[column]), Math.min(...values), Math.max(...values));
  material.color = new THREE.Color(colorFromNormalized(t));
}
