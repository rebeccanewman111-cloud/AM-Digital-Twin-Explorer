# AM Digital Twin Explorer

A GitHub Pages-ready web app for visualizing an additive manufacturing specimen with experimental tensile-test data.

This project is intentionally grounded in the actual uploaded data:

- `models/specimen.stl` is displayed in a browser-based 3D viewer.
- `data/tensile_test.csv` is parsed for tensile-test metadata and measurement rows.
- The app computes global engineering values such as engineering strain and engineering stress when width, thickness, span, elongation, and force are available.
- It does **not** invent a local stress map. Current overlays are global experiment indicators, not FEA per-node results.

## Current Features

- Interactive STL / GLB / GLTF viewer
- Rotate, zoom, pan, reset camera
- Camera presets: isometric, front, top
- Wireframe, transparency, auto-rotate
- Screenshot export
- CSV and JSON upload
- Automatic metadata extraction
- Tensile-test statistics cards
- Data inspector table with search
- Force vs elongation chart
- Force vs time chart
- Position vs time chart
- Stress-strain chart when computable
- Experiment playback timeline
- Global overlay modes:
  - Force
  - Elongation
  - Engineering strain
  - Engineering stress
- Light/dark theme toggle
- Modular code structure for future datasets

## Why the overlay is global

The provided CSV contains tensile-test measurements for the whole specimen, including force, elongation, position, sample rate, and specimen dimensions. It does not contain a spatial field such as:

```csv
NodeID, X, Y, Z, VonMisesStress
```

or

```csv
VertexID, Stress
```

Because of that, the app does not fake a red/blue stress map across the part. Instead, it honestly visualizes global experimental progression. If future FEA or digital twin data includes per-node or per-element values, the overlay system can be extended to show true spatial heat maps.

## Folder Structure

```text
AM-Digital-Twin-Explorer/
├── index.html
├── style.css
├── README.md
├── src/
│   ├── main.js
│   ├── viewer.js
│   ├── parser.js
│   ├── statistics.js
│   ├── charts.js
│   ├── timeline.js
│   ├── overlay.js
│   ├── ui.js
│   ├── state.js
│   └── utils.js
├── models/
│   └── specimen.stl
├── data/
│   └── tensile_test.csv
├── assets/
└── docs/
```

## Run Locally in VS Code

Because the app uses JavaScript modules, open it through a local server instead of double-clicking `index.html`.

### Option A: VS Code Live Server

1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Click **Open with Live Server**.

### Option B: Python local server

From the project folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Publish on GitHub Pages

1. Create a new GitHub repository named `AM-Digital-Twin-Explorer`.
2. Upload or commit all files in this folder.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Save.
6. GitHub will provide a public website link.

## How to Add More Data

### Add another CSV with similar tensile-test structure

Use the upload button in the app.

The parser currently expects a measurement table with a header row that includes `Point`. It works well with columns like:

```text
Point, Elongation, Force, Position, Code, Samplerate, Motorspeed
```

### Add a new parser

Create a new file in `src/`, for example:

```text
src/hdf5Parser.js
```

Then connect it in `src/ui.js` or `src/parser.js`.

### Add a true spatial stress overlay later

The ideal future data format would look like one of these:

```csv
NodeID,X,Y,Z,Stress
1,0.0,0.0,0.0,21.4
2,0.1,0.0,0.0,22.0
```

or

```csv
VertexID,Stress
0,21.4
1,22.0
```

Then `src/overlay.js` can be extended to assign vertex colors instead of a global material color.

## Module Guide

- `viewer.js`: Three.js scene, STL/GLB loading, camera, screenshot, display controls
- `parser.js`: CSV/JSON parsing and derived engineering values
- `statistics.js`: summary statistics and auto-generated experiment summary
- `charts.js`: Chart.js graph creation and updates
- `timeline.js`: experiment playback, play/pause, slider sync
- `overlay.js`: data-driven global coloring
- `ui.js`: DOM events, uploads, table, metadata, stats rendering
- `state.js`: shared app state
- `utils.js`: formatting, normalization, color utilities

## Scientific Note

Engineering stress is computed as:

```text
stress = force / cross-sectional area
```

where area is derived from metadata:

```text
area = width × thickness
```

Engineering strain is computed as:

```text
strain = elongation / span
```

These are global specimen-level values. They are useful for tensile-test interpretation but are not the same as local von Mises stress from FEA.
