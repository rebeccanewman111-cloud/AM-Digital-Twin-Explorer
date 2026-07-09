import { toNumber } from './utils.js';

export function parseCSVText(text) {
  const rawLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const headerIndex = rawLines.findIndex(line => parseCSVLine(line).some(cell => cell.trim().toLowerCase() === 'point'));
  if (headerIndex === -1) throw new Error('Could not find a numeric data table. Expected a header row containing Point.');

  const metadata = {};
  for (const line of rawLines.slice(0, headerIndex)) {
    const cells = parseCSVLine(line);
    const first = cells.join(' ').replace(/^"|"$/g, '').trim();
    if (!first) continue;
    const splitIndex = first.indexOf(' : ');
    if (splitIndex > -1) {
      metadata[first.slice(0, splitIndex).trim()] = first.slice(splitIndex + 3).trim();
    } else {
      metadata[`Note ${Object.keys(metadata).length + 1}`] = first;
    }
  }

  const columns = parseCSVLine(rawLines[headerIndex]).map(c => c.trim());
  const rows = rawLines.slice(headerIndex + 1).map(line => {
    const cells = parseCSVLine(line);
    const row = {};
    columns.forEach((column, i) => {
      const raw = cells[i] ?? '';
      const num = toNumber(raw);
      row[column] = num ?? raw.replace(/^"|"$/g, '');
    });
    return row;
  }).filter(row => Object.values(row).some(v => v !== ''));

  const derived = addDerivedValues(rows, metadata);
  return { metadata, columns: [...columns, ...derived.columns], rows, derived };
}

export function parseJSONText(text) {
  const json = JSON.parse(text);
  if (Array.isArray(json)) return { metadata: {}, rows: json, columns: Object.keys(json[0] ?? {}), derived: {} };
  return {
    metadata: json.metadata ?? {},
    rows: json.rows ?? json.data ?? [],
    columns: Object.keys((json.rows ?? json.data ?? [])[0] ?? {}),
    derived: {}
  };
}

function addDerivedValues(rows, metadata) {
  const width = toNumber(metadata.Width);
  const thickness = toNumber(metadata.Thickness);
  const span = toNumber(metadata.Span);
  const area = width && thickness ? width * thickness : null;
  const columns = [];

  for (const row of rows) {
    const force = toNumber(row.Force);
    const elongation = toNumber(row.Elongation);
    if (span && elongation !== null) {
      row['Engineering Strain'] = elongation / span;
    }
    if (area && force !== null) {
      row['Engineering Stress'] = force / area;
    }
  }
  if (span) columns.push('Engineering Strain');
  if (area) columns.push('Engineering Stress');
  return { width, thickness, span, area, columns };
}

function parseCSVLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map(cell => cell.trim().replace(/^"|"$/g, ''));
}
