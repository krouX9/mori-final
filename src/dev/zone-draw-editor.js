import * as THREE from 'three';
import { loadZones, saveZones } from '../data/dev-storage.js';

const ZONE_TYPES = ['garden', 'playground', 'assembly'];
const PREVIEW_COLORS = {
  garden:     0x82a85a,
  playground: 0xd8a064,
  assembly:   0xc4ad84,
};

export class ZoneDrawEditor {
  constructor({ scene, camera, renderer, terrain, sampleHeight, onFinish }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.terrain = terrain;
    this.sampleHeight = sampleHeight;
    this.onFinish = onFinish;

    this.active = false;
    this.points = [];
    this.type = 'garden';

    this.preview = new THREE.Group();
    this.preview.name = 'zone-draw-preview';
    this.scene.add(this.preview);

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();

    this.onKey = (e) => {
      if (!this.active) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Enter')        { e.preventDefault(); this.finish(); }
      else if (e.key === 'Escape')  { e.preventDefault(); this.cancel(); }
      else if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); this.undo(); }
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
    if (!ZONE_TYPES.includes(type)) return;
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
    const color = PREVIEW_COLORS[this.type] || 0x999999;
    // Markers at each clicked point.
    const markerGeo = new THREE.SphereGeometry(0.7, 10, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color });
    for (const pt of this.points) {
      const m = new THREE.Mesh(markerGeo, markerMat);
      m.position.set(pt.x, this.sampleHeight(pt.x, pt.z) + 0.9, pt.z);
      this.preview.add(m);
    }
    // Connecting line so the user sees the closing polygon shape.
    if (this.points.length >= 2) {
      const linePts = this.points.map((p) =>
        new THREE.Vector3(p.x, this.sampleHeight(p.x, p.z) + 0.7, p.z),
      );
      // Close back to first point.
      linePts.push(linePts[0].clone());
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const lineMat = new THREE.LineBasicMaterial({ color });
      const line = new THREE.Line(lineGeo, lineMat);
      this.preview.add(line);
    }
  }

  clearPreview() {
    while (this.preview.children.length) {
      const c = this.preview.children.pop();
      c.geometry?.dispose?.();
    }
  }

  undo() {
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
  finish() {
    if (this.points.length < 3) { this.cancel(); return null; }
    const all = (loadZones() || []);
    const arr = Array.isArray(all) ? all : [];
    const zone = {
      id: `z-${Date.now().toString(36)}`,
      type: this.type,
      name: this.type[0].toUpperCase() + this.type.slice(1),
      polygon: this.points.map((p) => ({ x: +p.x.toFixed(3), z: +p.z.toFixed(3) })),
    };
    arr.push(zone);
    saveZones(arr);
    this.points = [];
    this.clearPreview();
    this.active = false;
    if (this.onFinish) this.onFinish(zone, 'save');
    return zone;
  }
}
