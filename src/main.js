import { ModelViewer } from './viewer.js';
import { initCharts } from './charts.js';
import { configureTimeline } from './timeline.js';
import { bindUI, loadDefaultData, loadDatasetFromText } from './ui.js';

function findFileByManifestPath(files, manifestPath) {
  if (!manifestPath) return null;

  const normalizedPath = manifestPath.replaceAll('\\', '/').toLowerCase();

  return files.find(file => {
    const relativePath = (file.webkitRelativePath || file.name)
      .replaceAll('\\', '/')
      .toLowerCase();

    return relativePath.endsWith(normalizedPath);
  });
}

async function readManifest(files) {
  const manifestFile = files.find(
    file => file.name.toLowerCase() === 'manifest.json'
  );

  if (!manifestFile) return null;

  try {
    const manifestText = await manifestFile.text();
    return JSON.parse(manifestText);
  } catch (error) {
    console.error('Manifest parse error:', error);

    alert(
      `manifest.json was found but could not be parsed.\n\n${error.message}`
    );

    return null;
  }
}

function chooseModelFile(files, manifest) {
  if (manifest?.primaryModel) {
    const modelFromManifest = findFileByManifestPath(files, manifest.primaryModel);

    if (modelFromManifest) {
      return modelFromManifest;
    }

    console.warn(
      `Manifest requested model "${manifest.primaryModel}", but it was not found.`
    );
  }

  return files.find(file => {
    const name = file.name.toLowerCase();

    return (
      name.endsWith('.stl') ||
      name.endsWith('.glb') ||
      name.endsWith('.gltf')
    );
  }) || null;
}

function chooseDataFile(files, manifest) {
  if (manifest?.primaryData) {
    const dataFromManifest = findFileByManifestPath(files, manifest.primaryData);

    if (dataFromManifest) {
      return dataFromManifest;
    }

    console.warn(
      `Manifest requested data "${manifest.primaryData}", but it was not found.`
    );
  }

  const csvFile = files.find(file =>
    file.name.toLowerCase().endsWith('.csv')
  );

  if (csvFile) return csvFile;

  const jsonFile = files.find(file => {
    const name = file.name.toLowerCase();

    return (
      name.endsWith('.json') &&
      name !== 'manifest.json'
    );
  });

  if (jsonFile) return jsonFile;

  return files.find(file =>
    file.name.toLowerCase().endsWith('.txt')
  ) || null;
}

function updateProjectFileList({ files, manifest, modelFile, dataFile }) {
  const fileList = document.getElementById('fileList');
  if (!fileList) return;

  const folderName =
    files[0]?.webkitRelativePath?.split('/')[0] ||
    'Selected folder';

  fileList.innerHTML = `
    <p><strong>Folder:</strong> ${folderName}</p>
    <p><strong>Manifest:</strong> ${manifest ? 'manifest.json loaded' : 'No manifest.json found'}</p>
    <p><strong>Model:</strong> ${modelFile ? modelFile.name : 'No model found'}</p>
    <p><strong>Data:</strong> ${dataFile ? dataFile.name : 'No data found'}</p>
  `;
}

function setupPartFolderChooser(viewer) {
  const folderInput = document.getElementById('partFolderInput');

  if (!folderInput) return;

  folderInput.addEventListener('change', async () => {
    const files = Array.from(folderInput.files || []);

    if (files.length === 0) return;

    const manifest = await readManifest(files);
    const modelFile = chooseModelFile(files, manifest);
    const dataFile = chooseDataFile(files, manifest);

    console.log('Selected model:', modelFile?.webkitRelativePath || modelFile?.name);
    console.log('Selected data:', dataFile?.webkitRelativePath || dataFile?.name);

    updateProjectFileList({
      files,
      manifest,
      modelFile,
      dataFile
    });

    if (!modelFile) {
      alert('No STL, GLB, or GLTF model was found in this folder.');
      return;
    }

    try {
      await viewer.loadFile(modelFile);

      document.getElementById('viewerTitle').textContent = modelFile.name;
      document.getElementById('viewerStatus').textContent = 'Model loaded from selected folder.';
    } catch (error) {
      console.error('Model load error:', error);
      alert('The model file was found but could not be loaded.');
      return;
    }

    if (!dataFile) {
      alert('Model loaded, but no CSV/JSON/TXT data file was found.');
      return;
    }

    try {
      const text = await dataFile.text();

      loadDatasetFromText(text, dataFile.name, viewer, manifest);

      document.getElementById('playbackStatus').textContent =
        `Loaded data from ${dataFile.name}.`;
    } catch (error) {
      console.error('Data load error:', error);

      alert(
        `The data file "${dataFile.name}" was found, but it could not be analyzed.\n\n${error.message}`
      );
    }
  });
}

async function startApp() {
  const viewer = new ModelViewer(document.getElementById('viewerContainer'));

  initCharts();
  bindUI(viewer);
  configureTimeline(viewer);
  setupPartFolderChooser(viewer);

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