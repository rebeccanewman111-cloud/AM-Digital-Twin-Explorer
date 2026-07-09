export const state = {
  model: null,
  modelFileName: 'specimen.stl',
  dataset: { metadata: {}, rows: [], columns: [], derived: {} },
  currentIndex: 0,
  playbackTimer: null,
  overlayMode: 'none',
  chartPointRadius: 3
};

export function hasData() {
  return state.dataset.rows.length > 0;
}
