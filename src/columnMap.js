import { toNumber } from './utils.js';

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function findColumn(columns, possibleNames) {
  if (!columns || columns.length === 0) return null;

  return columns.find(column =>
    possibleNames.some(name =>
      normalize(column).includes(normalize(name))
    )
  ) || null;
}

export function getNumericColumnValues(rows, columnName) {
  if (!rows || !columnName) return [];

  return rows
    .map(row => toNumber(row[columnName]))
    .filter(value => value !== null && !Number.isNaN(value));
}

export function getNumericColumns(dataset) {
  const rows = dataset.rows || [];
  const columns = dataset.columns || [];

  return columns
    .map(column => {
      const values = getNumericColumnValues(rows, column);

      return {
        name: column,
        values,
        count: values.length
      };
    })
    .filter(columnInfo => columnInfo.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function getDatasetColumnMap(dataset) {
  const columns = dataset.columns || [];
  const roles = dataset.columnRoles || {};

  const numericColumns = getNumericColumns(dataset).map(column => column.name);

  const point =
    getRoleColumn(columns, roles, 'point') ||
    findColumn(columns, ['point', 'index', 'sample', 'measurement', 'row']);

  const time =
    getRoleColumn(columns, roles, 'time') ||
    findColumn(columns, ['time', 'sampletime', 'sample time', 'seconds', 'sec', 'timestamp']);

  const force =
    getRoleColumn(columns, roles, 'force') ||
    findColumn(columns, ['force', 'load', 'loadcell', 'load cell', 'axialload', 'axial load']);

  const elongation =
    getRoleColumn(columns, roles, 'elongation') ||
    findColumn(columns, ['elongation', 'extension', 'elong']);

  const position =
    getRoleColumn(columns, roles, 'position') ||
    findColumn(columns, ['position', 'crosshead', 'displacement', 'travel', 'stroke']);

  const stress =
    getRoleColumn(columns, roles, 'stress') ||
    findColumn(columns, ['engineeringstress', 'engineering stress', 'stress', 'vonmises', 'von mises']);

  const strain =
    getRoleColumn(columns, roles, 'strain') ||
    findColumn(columns, ['engineeringstrain', 'engineering strain', 'strain']);

  return {
    point,
    time,
    force,
    elongation,
    position,
    stress,
    strain,

    // Generic fallbacks
    numericColumns,
    xColumn: time || point || null,
    yColumn1: force || numericColumns[0] || null,
    yColumn2: elongation || position || numericColumns[1] || numericColumns[0] || null,
    yColumn3: stress || numericColumns[2] || numericColumns[0] || null
  };
}

function getRoleColumn(columns, roles, roleName) {
  const requestedColumn = roles?.[roleName];

  if (!requestedColumn) return null;

  return (
    columns.find(column => normalize(column) === normalize(requestedColumn)) ||
    null
  );
}