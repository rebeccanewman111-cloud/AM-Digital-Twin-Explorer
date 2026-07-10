import { toNumber } from './utils.js';
import { getDatasetColumnMap, getNumericColumns } from './columnMap.js';

const charts = {};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: { mode: 'nearest', intersect: false },
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      ticks: { color: '#95a3b8' },
      grid: { color: 'rgba(149,163,184,.15)' }
    },
    y: {
      ticks: { color: '#95a3b8' },
      grid: { color: 'rgba(149,163,184,.15)' }
    }
  },
  onClick(event, elements) {
    if (elements.length) {
      const index = elements[0].index;

      document.dispatchEvent(
        new CustomEvent('chart-point-selected', {
          detail: { index }
        })
      );
    }
  }
};

export function initCharts() {
  charts.forceElongation = makeChart(
    'forceElongationChart',
    'Measurement index',
    'Numeric column 1'
  );

  charts.forceTime = makeChart(
    'forceTimeChart',
    'Measurement index',
    'Numeric column 2'
  );

  charts.positionTime = makeChart(
    'positionTimeChart',
    'Measurement index',
    'Numeric column 3'
  );

  charts.stressStrain = makeChart(
    'stressStrainChart',
    'Measurement index',
    'Numeric column 4'
  );
}

function makeChart(canvasId, xLabel, yLabel) {
  const ctx = document.getElementById(canvasId);

  return new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: `${yLabel} vs ${xLabel}`,
          data: [],
          pointRadius: 2,
          showLine: true,
          borderWidth: 2,
          tension: 0.12
        }
      ]
    },
    options: {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        x: {
          ...baseOptions.scales.x,
          title: {
            display: true,
            text: xLabel
          }
        },
        y: {
          ...baseOptions.scales.y,
          title: {
            display: true,
            text: yLabel
          }
        }
      }
    }
  });
}

export function updateCharts(dataset) {
  const map = getDatasetColumnMap(dataset);
  const numericColumns = getNumericColumns(dataset).map(column => column.name);

  const indexFallback = '__index__';

  const x = map.xColumn || indexFallback;

  const y1 = map.force || numericColumns[0] || null;
  const y2 = map.elongation || map.position || numericColumns[1] || numericColumns[0] || null;
  const y3 = map.stress || numericColumns[2] || numericColumns[0] || null;
  const y4 = map.strain || numericColumns[3] || numericColumns[0] || null;

  setChart(
    charts.forceElongation,
    dataset,
    map.elongation || map.position || x,
    map.force || y1,
    map.elongation || map.position || map.xColumn || 'Measurement index',
    map.force || y1 || 'Numeric column'
  );

  setChart(
    charts.forceTime,
    dataset,
    x,
    y1,
    map.xColumn || 'Measurement index',
    y1 || 'Numeric column'
  );

  setChart(
    charts.positionTime,
    dataset,
    x,
    y2,
    map.xColumn || 'Measurement index',
    y2 || 'Numeric column'
  );

  setChart(
    charts.stressStrain,
    dataset,
    map.strain || x,
    map.stress || y3 || y4,
    map.strain || map.xColumn || 'Measurement index',
    map.stress || y3 || y4 || 'Numeric column'
  );
}

function getXValue(row, xKey, index) {
  if (xKey === '__index__') return index;
  return toNumber(row[xKey]);
}

function setChart(chart, dataset, xKey, yKey, xLabel, yLabel) {
  if (!chart) return;

  if (!dataset?.rows?.length || !yKey) {
    chart.data.datasets[0].data = [];
    chart.data.datasets[0].label = 'No numeric data found';
    chart.options.scales.x.title.text = xLabel;
    chart.options.scales.y.title.text = yLabel;
    chart.update();
    return;
  }

  const data = dataset.rows
    .map((row, index) => ({
      x: getXValue(row, xKey, index),
      y: toNumber(row[yKey]),
      index
    }))
    .filter(point => point.x !== null && point.y !== null);

  chart.data.datasets[0].data = data;
  chart.data.datasets[0].label = `${yLabel} vs ${xLabel}`;
  chart.options.scales.x.title.text = xLabel;
  chart.options.scales.y.title.text = yLabel;

  chart.update();
}

export function highlightChartIndex(index) {
  Object.values(charts).forEach(chart => {
    if (!chart) return;

    chart.data.datasets[0].pointRadius = chart.data.datasets[0].data.map(point =>
      point.index === index ? 6 : 2
    );

    chart.update('none');
  });
}