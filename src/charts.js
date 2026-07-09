import { state } from './state.js';
import { toNumber } from './utils.js';

const charts = {};
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: { mode: 'nearest', intersect: false },
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#95a3b8' }, grid: { color: 'rgba(149,163,184,.15)' } },
    y: { ticks: { color: '#95a3b8' }, grid: { color: 'rgba(149,163,184,.15)' } }
  },
  onClick(event, elements) {
    if (elements.length) {
      const index = elements[0].index;
      document.dispatchEvent(new CustomEvent('chart-point-selected', { detail: { index } }));
    }
  }
};

export function initCharts() {
  charts.forceElongation = makeChart('forceElongationChart', 'Elongation', 'Force');
  charts.forceTime = makeChart('forceTimeChart', 'Point', 'Force');
  charts.positionTime = makeChart('positionTimeChart', 'Point', 'Position');
  charts.stressStrain = makeChart('stressStrainChart', 'Engineering Strain', 'Engineering Stress');
}

function makeChart(canvasId, xLabel, yLabel) {
  const ctx = document.getElementById(canvasId);
  return new Chart(ctx, {
    type: 'scatter',
    data: { datasets: [{ label: `${yLabel} vs ${xLabel}`, data: [], pointRadius: 2, showLine: true, borderWidth: 2, tension: 0.12 }] },
    options: { ...baseOptions, scales: { ...baseOptions.scales, x: { ...baseOptions.scales.x, title: { display: true, text: xLabel } }, y: { ...baseOptions.scales.y, title: { display: true, text: yLabel } } } }
  });
}

export function updateCharts(dataset) {
  setChart(charts.forceElongation, dataset, 'Elongation', 'Force');
  setChart(charts.forceTime, dataset, 'Point', 'Force');
  setChart(charts.positionTime, dataset, 'Point', 'Position');
  setChart(charts.stressStrain, dataset, 'Engineering Strain', 'Engineering Stress');
}

function setChart(chart, dataset, xKey, yKey) {
  if (!chart) return;
  const data = dataset.rows.map((row, index) => ({ x: toNumber(row[xKey]), y: toNumber(row[yKey]), index })).filter(p => p.x !== null && p.y !== null);
  chart.data.datasets[0].data = data;
  chart.update();
}

export function highlightChartIndex(index) {
  Object.values(charts).forEach(chart => {
    if (!chart) return;
    chart.data.datasets[0].pointRadius = chart.data.datasets[0].data.map(p => p.index === index ? 6 : 2);
    chart.update('none');
  });
}
