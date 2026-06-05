import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

const STORAGE_KEY = 'campus-overrides';

export class TransformEditor {
  constructor({ scene, camera, renderer, controls, buildings, onSelectionChange, onObjectChange }) {
    this.scene = scene;
    this.controls = controls;
    this.buildings = buildings;
    this.selected = null;
    this.lastDragEnd = 0;
    this.onSelectionChange = onSelectionChange;
    this.onObjectChange = onObjectChange;

    this.tc = new TransformControls(camera, renderer.domElement);
    this.tc.size = 0.85;
    this.tc.setSpace('local');

    const helper = this.tc.getHelper ? this.tc.getHelper() : this.tc;
    helper.name = 'transform-helper';
    scene.add(helper);

    this.tc.addEventListener('dragging-changed', (e) => {
      this.controls.enabled = !e.value;
      if (!e.value) this.lastDragEnd = performance.now();
    });
    this.tc.addEventListener('objectChange', () => {
      this.saveOverride();
      if (this.onObjectChange) this.onObjectChange(this.selected);
    });

    this.onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!this.selected) return;
      // Rebound off the WASD row so we don't fight the camera-pan keys
      // that OrbitControls now listens for. T/E/R is Blender-ish and
      // doesn't overlap with any movement key.
      const k = e.key.toLowerCase();
      if (k === 't')      { this.tc.setMode('translate'); e.preventDefault(); }
      else if (k === 'e') { this.tc.setMode('rotate');    e.preventDefault(); }
      else if (k === 'r') { this.tc.setMode('scale');     e.preventDefault(); }
      else if (k === 'escape') this.deselect();
    };
    document.addEventListener('keydown', this.onKey);

    this.overrides = this.loadOverrides();
    this.applyOverrides();
  }

  loadOverrides() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  applyOverrides() {
    for (const b of this.buildings.children) {
      const id = b.userData.buildingId;
      if (!id || !this.overrides[id]) continue;
      const ov = this.overrides[id];
      if (ov.position) b.position.fromArray(ov.position);
      if (ov.rotation != null) b.rotation.y = ov.rotation;
      if (ov.scale != null) b.scale.setScalar(ov.scale);
    }
  }

  isBusy() {
    return performance.now() - this.lastDragEnd < 150;
  }

  select(building) {
    this.selected = building;
    this.tc.attach(building);
    if (this.onSelectionChange) this.onSelectionChange(building);
  }

  deselect() {
    this.selected = null;
    this.tc.detach();
    if (this.onSelectionChange) this.onSelectionChange(null);
  }

  /** Programmatic uniform scale — used by the slider UI. */
  setScale(s) {
    if (!this.selected) return;
    if (!Number.isFinite(s) || s <= 0) return;
    this.selected.scale.setScalar(s);
    this.saveOverride();
  }

  saveOverride() {
    if (!this.selected) return;
    const id = this.selected.userData.buildingId;
    if (!id) return;
    this.overrides[id] = {
      name: this.selected.userData.info?.name,
      position: this.selected.position.toArray().map((n) => +n.toFixed(3)),
      rotation: +this.selected.rotation.y.toFixed(4),
      scale: +this.selected.scale.x.toFixed(4),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.overrides));
  }

  clearAll() {
    if (!confirm('Reset all building overrides? Page will reload.')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  exportToClipboard() {
    const json = JSON.stringify(this.overrides, null, 2);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).catch(() => fallback(json));
    } else {
      fallback(json);
    }
    return json;
  }
}

function fallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  ta.remove();
}
