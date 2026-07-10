import { formatNumber } from './utils.js';
import {
  getDatasetColumnMap,
  getNumericColumns,
  getNumericColumnValues
} from './columnMap.js';

export function computeStatistics(dataset) {
  const rows = dataset.rows || [];
  const stats = {};
  const numericColumns = getNumericColumns(dataset);
  const map = getDatasetColumnMap(dataset);

  stats['Rows Analyzed'] = rows.length.toString();
  stats['Numeric Columns Found'] = numericColumns.length.toString();

  if (numericColumns.length === 0) {
    stats['Analysis Mode'] = 'No numeric columns found';
    return stats;
  }

  const engineeringDetected = [];

  if (map.force) engineeringDetected.push(`force/load → ${map.force}`);
  if (map.elongation) engineeringDetected.push(`elongation/extension → ${map.elongation}`);
  if (map.position) engineeringDetected.push(`position/displacement → ${map.position}`);
  if (map.time) engineeringDetected.push(`time/index → ${map.time}`);
  if (map.stress) engineeringDetected.push(`stress → ${map.stress}`);
  if (map.strain) engineeringDetected.push(`strain → ${map.strain}`);

  stats['Analysis Mode'] = engineeringDetected.length
    ? 'Engineering-assisted analysis'
    : 'Generic numeric analysis';

  stats['Detected Engineering Columns'] = engineeringDetected.length
    ? engineeringDetected.join('; ')
    : 'None confidently detected';

  // Engineering-style priority stats if detected
  addColumnStats(stats, rows, map.force, 'Force / Load', getUnit(dataset, map.force, ''));
  addColumnStats(stats, rows, map.elongation, 'Elongation / Extension', getUnit(dataset, map.elongation, ''));
  addColumnStats(stats, rows, map.position, 'Position / Displacement', getUnit(dataset, map.position, ''));
  addColumnStats(stats, rows, map.stress, 'Stress', getUnit(dataset, map.stress, ''));
  addColumnStats(stats, rows, map.strain, 'Strain', getUnit(dataset, map.strain, ''));

  // Generic stats for first several numeric columns
  numericColumns.slice(0, 8).forEach(columnInfo => {
    addColumnStats(
      stats,
      rows,
      columnInfo.name,
      columnInfo.name,
      getUnit(dataset, columnInfo.name, '')
    );
  });

  if (dataset.derived?.area) {
    stats['Cross-section Area'] = `${formatNumber(dataset.derived.area)} mm²`;
  }

  return stats;
}

function addColumnStats(stats, rows, columnName, displayName, unit) {
  if (!columnName) return;

  const values = getNumericColumnValues(rows, columnName);

  if (!values.length) return;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  stats[`Max ${displayName}`] = `${formatNumber(max)} ${unit}`.trim();
  stats[`Min ${displayName}`] = `${formatNumber(min)} ${unit}`.trim();
  stats[`Avg ${displayName}`] = `${formatNumber(avg)} ${unit}`.trim();
}

function getUnit(dataset, columnName, fallback = '') {
  if (!columnName) return fallback;

  return dataset.units?.[columnName] || fallback;
}

export function buildSummary(dataset, stats) {
  if (!dataset.rows?.length) return 'Waiting for data...';

  const mode = stats['Analysis Mode'] ?? 'Generic numeric analysis';
  const numericCount = stats['Numeric Columns Found'] ?? '0';
  const detected = stats['Detected Engineering Columns'] ?? 'None confidently detected';

  return `This dataset contains ${dataset.rows.length} rows and ${numericCount} numeric columns. The dashboard is running in ${mode}. Detected engineering columns: ${detected}. If engineering roles are not confidently identified, the dashboard still performs generic numeric analysis by calculating min, max, and average values and plotting numeric trends without assuming what each column physically means.`;
}