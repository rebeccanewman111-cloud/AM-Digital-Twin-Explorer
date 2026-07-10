import { toNumber } from './utils.js';

export function parseCSVText(text) {
  const rawLines = text
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0);

  const parsedLines = rawLines.map(line => parseCSVLine(line));

  const headerIndex = findHeaderIndex(parsedLines);

  if (headerIndex === -1) {
    throw new Error(
      'Could not find a numeric data table. Expected a row with column headers followed by numeric data.'
    );
  }

  const metadata = extractMetadata(rawLines.slice(0, headerIndex));

  const columns = makeUniqueColumns(
    parsedLines[headerIndex].map(c => c.trim()).filter(Boolean)
  );

  const rows = rawLines
    .slice(headerIndex + 1)
    .map(line => {
      const cells = parseCSVLine(line);
      const row = {};

      columns.forEach((column, i) => {
        const raw = cells[i] ?? '';
        const num = toNumber(raw);
        row[column] = num ?? raw.replace(/^"|"$/g, '');
      });

      return row;
    })
    .filter(row => {
      const values = Object.values(row);
      return values.some(v => v !== '' && v !== null && v !== undefined);
    });

  if (rows.length === 0) {
    throw new Error('A header row was found, but no data rows were found below it.');
  }

  const derived = addDerivedValues(rows, metadata, columns);

  return {
    metadata,
    columns: [...columns, ...derived.columns],
    rows,
    derived
  };
}

export function parseJSONText(text) {
  const json = JSON.parse(text);

  if (Array.isArray(json)) {
    return {
      metadata: {},
      rows: json,
      columns: Object.keys(json[0] ?? {}),
      derived: {}
    };
  }

  const rows = json.rows ?? json.data ?? [];

  return {
    metadata: json.metadata ?? {},
    rows,
    columns: Object.keys(rows[0] ?? {}),
    derived: {}
  };
}

function findHeaderIndex(parsedLines) {
  // First, preserve support for your original file format.
  const pointHeaderIndex = parsedLines.findIndex(line =>
    line.some(cell => cell.trim().toLowerCase() === 'point')
  );

  if (pointHeaderIndex !== -1) {
    return pointHeaderIndex;
  }

  // Otherwise, find the row that looks most like a table header.
  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < parsedLines.length - 1; i++) {
    const possibleHeader = parsedLines[i].map(c => c.trim()).filter(Boolean);
    const nextRows = parsedLines.slice(i + 1, i + 6);

    if (possibleHeader.length < 2) continue;

    const headerHasText = possibleHeader.some(cell => toNumber(cell) === null);
    if (!headerHasText) continue;

    let numericCellsBelow = 0;
    let totalCellsBelow = 0;

    for (const row of nextRows) {
      const cells = row.slice(0, possibleHeader.length);

      for (const cell of cells) {
        if (cell.trim() === '') continue;

        totalCellsBelow++;

        if (toNumber(cell) !== null) {
          numericCellsBelow++;
        }
      }
    }

    if (totalCellsBelow === 0) continue;

    const numericRatio = numericCellsBelow / totalCellsBelow;
    const score = possibleHeader.length * numericRatio;

    if (numericRatio >= 0.4 && score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function extractMetadata(metadataLines) {
  const metadata = {};

  for (const line of metadataLines) {
    const cells = parseCSVLine(line);
    const first = cells.join(' ').replace(/^"|"$/g, '').trim();

    if (!first) continue;

    const colonIndex = first.indexOf(' : ');

    if (colonIndex > -1) {
      metadata[first.slice(0, colonIndex).trim()] = first
        .slice(colonIndex + 3)
        .trim();
    } else if (first.includes(':')) {
      const [key, ...rest] = first.split(':');

      metadata[key.trim()] = rest.join(':').trim();
    } else {
      metadata[`Note ${Object.keys(metadata).length + 1}`] = first;
    }
  }

  return metadata;
}

function makeUniqueColumns(columns) {
  const seen = {};

  return columns.map((column, index) => {
    const clean = column || `Column ${index + 1}`;

    if (!seen[clean]) {
      seen[clean] = 1;
      return clean;
    }

    seen[clean] += 1;
    return `${clean} ${seen[clean]}`;
  });
}

function addDerivedValues(rows, metadata, columns) {
  const width = findMetadataNumber(metadata, ['width']);
  const thickness = findMetadataNumber(metadata, ['thickness']);
  const span = findMetadataNumber(metadata, ['span', 'gauge length', 'length']);

  const area = width && thickness ? width * thickness : null;

  const forceColumn = findColumn(columns, [
    'force',
    'load'
  ]);

  const elongationColumn = findColumn(columns, [
    'elongation',
    'extension',
    'displacement',
    'position'
  ]);

  const derivedColumns = [];

  for (const row of rows) {
    const force = forceColumn ? toNumber(row[forceColumn]) : null;
    const elongation = elongationColumn ? toNumber(row[elongationColumn]) : null;

    if (span && elongation !== null) {
      row['Engineering Strain'] = elongation / span;
    }

    if (area && force !== null) {
      row['Engineering Stress'] = force / area;
    }
  }

  if (span && elongationColumn) derivedColumns.push('Engineering Strain');
  if (area && forceColumn) derivedColumns.push('Engineering Stress');

  return {
    width,
    thickness,
    span,
    area,
    forceColumn,
    elongationColumn,
    columns: derivedColumns
  };
}

function findMetadataNumber(metadata, possibleNames) {
  const entry = Object.entries(metadata).find(([key]) =>
    possibleNames.some(name =>
      key.toLowerCase().includes(name.toLowerCase())
    )
  );

  if (!entry) return null;

  return toNumber(entry[1]);
}

function findColumn(columns, possibleNames) {
  return columns.find(column =>
    possibleNames.some(name =>
      column.toLowerCase().includes(name.toLowerCase())
    )
  );
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