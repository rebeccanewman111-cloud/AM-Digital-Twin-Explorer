export function toNumber(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[^0-9eE+\-.]/g, '');
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function formatNumber(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(digits);
}

export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function normalize(value, min, max) {
  if (value === null || value === undefined || max === min) return 0;
  return clamp((value - min) / (max - min));
}

export function colorFromNormalized(t) {
  const stops = [
    [47, 128, 237],
    [39, 174, 96],
    [242, 201, 76],
    [242, 153, 74],
    [235, 87, 87]
  ];
  const scaled = clamp(t) * (stops.length - 1);
  const i = Math.floor(scaled);
  const j = Math.min(i + 1, stops.length - 1);
  const local = scaled - i;
  const rgb = stops[i].map((start, k) => Math.round(start + (stops[j][k] - start) * local));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

export function downloadText(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
