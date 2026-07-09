import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { state } from './state.js';
import { applyOverlay } from './overlay.js';

export class ModelViewer {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.material = new THREE.MeshStandardMaterial({ color: '#9fb7d9', roughness: 0.55, metalness: 0.12 });
    this.autorotate = false;
    this.addLights();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x27374d, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(5, 8, 6);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.8);
    fill.position.set(-6, -4, 2);
    this.scene.add(fill);
    const grid = new THREE.GridHelper(80, 40, 0x2a3445, 0x2a3445);
    grid.position.y = -8;
    this.scene.add(grid);
  }

  async loadDefaultModel() {
    const response = await fetch('./models/specimen.stl');
    const buffer = await response.arrayBuffer();
    this.loadSTLBuffer(buffer, 'specimen.stl');
  }

  async loadFile(file) {
    const buffer = await file.arrayBuffer();
    const name = file.name.toLowerCase();
    if (name.endsWith('.stl')) this.loadSTLBuffer(buffer, file.name);
    else if (name.endsWith('.glb') || name.endsWith('.gltf')) this.loadGLTFBuffer(buffer, file.name);
    else throw new Error('Unsupported model type. Use STL, GLB, or GLTF.');
  }

  loadSTLBuffer(buffer, fileName) {
    const loader = new STLLoader();
    const geometry = loader.parse(buffer);
    geometry.computeVertexNormals();
    geometry.center();
    const mesh = new THREE.Mesh(geometry, this.material);
    this.setModel(mesh, fileName);
  }

  loadGLTFBuffer(buffer, fileName) {
    const loader = new GLTFLoader();
    loader.parse(buffer, '', gltf => this.setModel(gltf.scene, fileName));
  }

  setModel(object, fileName) {
    if (state.model) this.scene.remove(state.model);
    state.model = object;
    state.modelFileName = fileName;
    object.traverse(child => {
      if (child.isMesh) {
        child.material = this.material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.scene.add(object);
    this.frameModel();
    applyOverlay(this);
  }

  frameModel() {
    const box = new THREE.Box3().setFromObject(state.model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    this.camera.position.set(center.x + maxDim * 1.8, center.y + maxDim * 1.2, center.z + maxDim * 1.8);
    this.camera.near = maxDim / 100;
    this.camera.far = maxDim * 100;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.update();
  }

  setWireframe(enabled) { this.material.wireframe = enabled; }
  setTransparent(enabled) { this.material.transparent = enabled; this.material.opacity = enabled ? 0.55 : 1; }
  setCameraPreset(preset) {
    if (!state.model) return;
    const box = new THREE.Box3().setFromObject(state.model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const d = Math.max(size.x, size.y, size.z) * 2;
    const positions = { iso: [d,d,d], front: [0,0,d], top: [0,d,0.001] };
    const p = positions[preset] ?? positions.iso;
    this.camera.position.set(center.x + p[0], center.y + p[1], center.z + p[2]);
    this.controls.target.copy(center);
    this.controls.update();
  }
  resize() {
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }
  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.autorotate && state.model) state.model.rotation.y += 0.006;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  screenshot() {
    const a = document.createElement('a');
    a.download = 'digital-twin-view.png';
    a.href = this.renderer.domElement.toDataURL('image/png');
    a.click();
  }
}
