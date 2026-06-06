import * as THREE from 'three';
import { buildCurvedPath } from '../procedural/path-render.js';
import { loadPaths, savePaths } from '../data/dev-storage.js';

export class PathEditor {
  constructor({ scene, camera, renderer, terrain, sampleHeight, onFinish }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.terrain = terrain;
    this.sampleHeight = sampleHeight;
    this.onFinish = onFinish;

    this.active = false;
    this.points = [];
    this.type = 'pedestrian';
    this.previewMesh = null;
    this.markers = new THREE.Group();
    this.markers.name = 'path-editor-markers';
    this.scene.add(this.markers);

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();

    this.onKey = (e) => {
      if (!this.active) return;
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'SELECT') return;
      if (e.key === 'Enter') { e.preventDefault(); this.finishPath(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.cancel(); }
      else if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); this.undoPoint(); }
    };
    document.addEventListener('keydown', this.onKey);
  }

  activate(type) {
    this.active = true;
    if (type) this.type = type;
    this.points = [];
    this.refreshPreview();
  }

  deactivate() {
    this.active = false;
    this.points = [];
    this.clearPreview();
  }

  setType(type) {
    this.type = type;
    this.refreshPreview();
  }

  handleClick(e) {
    if (!this.active) return false;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObject(this.terrain);
    if (hits.length === 0) return false;
    const p = hits[0].point;
    this.points.push({ x: p.x, z: p.z });
    this.refreshPreview();
    return true;
  }

  refreshPreview() {
    this.clearPreview();
    if (!this.points.length) return;
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff8a3a });
    const markerGeo = new THREE.SphereGeometry(0.5, 10, 8);
    for (const p of this.points) {
      const m = new THREE.Mesh(markerGeo, markerMat);
      m.position.set(p.x, this.sampleHeight(p.x, p.z) + 0.8, p.z);
      this.markers.add(m);
    }
    if (this.points.length >= 2) {
      this.previewMesh = buildCurvedPath(this.points, this.type, this.sampleHeight);
      if (this.previewMesh) {
        this.previewMesh.userData.preview = true;
        this.scene.add(this.previewMesh);
      }
    }
  }

  clearPreview() {
    while (this.markers.children.length) {
      const c = this.markers.children.pop();
      c.geometry?.dispose?.();
    }
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh.geometry?.dispose?.();
      this.previewMesh = null;
    }
  }

  undoPoint() {
    if (this.points.length > 0) {
      this.points.pop();
      this.refreshPreview();
    }
  }

  cancel() {
    this.points = [];
    this.clearPreview();
    this.active = false;
    if (this.onFinish) this.onFinish(null, 'cancel');
  }

  finishPath() {
    if (this.points.length < 2) {
      this.cancel();
      return null;
    }
    const path = {
      id: `p-${Date.now().toString(36)}`,
      type: this.type,
      points: this.points.map((p) => ({ x: +p.x.toFixed(3), z: +p.z.toFixed(3) })),
    };
    const all = loadPaths();
    all.push(path);
    savePaths(all);
    this.points = [];
    this.clearPreview();
    this.active = false;
    if (this.onFinish) this.onFinish(path, 'save');
    return path;
  }
}
