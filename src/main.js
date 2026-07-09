import { ModelViewer } from './viewer.js';
import { initCharts } from './charts.js';
import { configureTimeline } from './timeline.js';
import { bindUI, loadDefaultData } from './ui.js';

async function startApp() {
  const viewer = new ModelViewer(document.getElementById('viewerContainer'));
  initCharts();
  bindUI(viewer);
  configureTimeline(viewer);

  try {
    await viewer.loadDefaultModel();
    document.getElementById('viewerStatus').textContent = 'Default specimen loaded.';
  } catch (error) {
    document.getElementById('viewerStatus').textContent = 'Upload an STL or GLB to begin.';
    console.error(error);
  }

  try {
    await loadDefaultData(viewer);
  } catch (error) {
    document.getElementById('summaryText').textContent = 'Upload a CSV to begin data analysis.';
    console.error(error);
  }
}

startApp();
