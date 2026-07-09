import { toNumber, formatNumber } from './utils.js';

export function computeStatistics(dataset) {
  const rows = dataset.rows;
  const stats = {};
  addColumnStats(stats, rows, 'Force', 'N');
  addColumnStats(stats, rows, 'Elongation', 'mm');
  addColumnStats(stats, rows, 'Position', 'mm');
  addColumnStats(stats, rows, 'Engineering Strain', '');
  addColumnStats(stats, rows, 'Engineering Stress', 'MPa');

  if (dataset.metadata['Test duration']) stats['Test Duration'] = dataset.metadata['Test duration'];
  if (dataset.metadata['Start Speed']) stats['Motor Speed'] = dataset.metadata['Start Speed'];
  if (dataset.metadata['Start Sampletime']) stats['Sample Time'] = dataset.metadata['Start Sampletime'];
  if (dataset.derived.area) stats['Cross-section Area'] = `${formatNumber(dataset.derived.area)} mm²`;
  return stats;
}

function addColumnStats(stats, rows, key, unit) {
  const values = rows.map(row => toNumber(row[key])).filter(v => v !== null);
  if (!values.length) return;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  stats[`Max ${key}`] = `${formatNumber(max)} ${unit}`.trim();
  stats[`Min ${key}`] = `${formatNumber(min)} ${unit}`.trim();
  stats[`Avg ${key}`] = `${formatNumber(avg)} ${unit}`.trim();
}

export function buildSummary(dataset, stats) {
  if (!dataset.rows.length) return 'Waiting for data...';
  const maxForce = stats['Max Force'] ?? 'unknown';
  const maxElongation = stats['Max Elongation'] ?? 'unknown';
  const duration = stats['Test Duration'] ?? 'unknown duration';
  const area = stats['Cross-section Area'] ?? 'unknown area';
  return `This tensile test contains ${dataset.rows.length} measurement points over ${duration}. The maximum measured force is ${maxForce}, and the maximum elongation is ${maxElongation}. Width and thickness metadata give a cross-section of ${area}, so engineering stress and strain are computed as global specimen-level values. No local stress field is present, so overlays are intentionally global experimental indicators rather than invented per-location FEA results.`;
}
