import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { saveZones } from '../data/dev-storage.js';

export class ZoneEditor {
  constructor({ scene, camera, renderer, controls, sampleHeight, layout, onUpdate }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = controls;
    this.sampleHeight = sampleHeight;
    this.layout = layout;
    this.onUpdate = onUpdate;
    this.active = false;
    this.handles = [];
    this.lastDragEnd = 0;

    this.tc = new TransformControls(camera, renderer.domElement);
    this.tc.size = 0.6;
    this.tc.showY = false;
    this.tc.setMode('translate');
    this.tc.setSpace('world');
    this.helper = this.tc.getHelper ? this.tc.getHelper() : this.tc;
    this.helper.name = 'zone-editor-helper';

    this.tc.addEventListener('dragging-changed', (e) => {
      this.controls.enabled = !e.value;
      if (!e.value) {
        this.lastDragEnd = performance.now();
        this.saveAll();
      }
    });
    this.tc.addEventListener('objectChange', () => this.onHandleChange());

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.scene.add(this.helper);
    this.renderHandles();
  }

  deactivate() {
    if (!this.active) return;
    this.active = false;
    this.tc.detach();
    if (this.scene.children.includes(this.helper)) this.scene.remove(this.helper);
    for (const h of this.handles) {
      this.scene.remove(h);
      h.geometry?.dispose?.();
      h.material?.dispose?.();
    }
    this.handles = [];
  }

  renderHandles() {
    for (const h of this.handles) {
      this.scene.remove(h);
      h.geometry?.dispose?.();
      h.material?.dispose?.();
    }
    this.handles = [];
    const handleGeo = new THREE.SphereGeometry(0.8, 12, 8);
    this.layout.zones.forEach((zone, zoneIdx) => {
      zone.polygon.forEach((p, vertexIdx) => {
        // skip closing vertex (last == first in GeoJSON rings)
        if (vertexIdx === zone.polygon.length - 1 &&
            Math.abs(p.x - zone.polygon[0].x) < 1e-6 &&
            Math.abs(p.z - zone.polygon[0].z) < 1e-6) return;
        const mesh = new THREE.Mesh(
          handleGeo,
          new THREE.MeshBasicMaterial({ color: 0x42c0e0, depthTest: true }),
        );
        mesh.position.set(p.x, this.sampleHeight(p.x, p.z) + 1.0, p.z);
        mesh.userData.zoneIdx = zoneIdx;
        mesh.userData.vertexIdx = vertexIdx;
        mesh.userData.isZoneHandle = true;
        this.scene.add(mesh);
        this.handles.push(mesh);
      });
    });
  }

  handleClick(e) {
    if (!this.active) return false;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.handles);
    if (hits.length > 0) {
      this.tc.attach(hits[0].object);
      return true;
    }
    this.tc.detach();
    return false;
  }

  onHandleChange() {
    const obj = this.tc.object;
    if (!obj || obj.userData.isZoneHandle !== true) return;
    const { zoneIdx, vertexIdx } = obj.userData;
    const zone = this.layout.zones[zoneIdx];
    if (!zone) return;
    obj.position.y = this.sampleHeight(obj.position.x, obj.position.z) + 1.0;
    zone.polygon[vertexIdx] = { x: obj.position.x, z: obj.position.z };
    // also update closing vertex if this was the first vertex
    if (vertexIdx === 0) {
      const last = zone.polygon.length - 1;
      if (last > 0 &&
          Math.abs(zone.polygon[last].x - zone.polygon[0].x) < 50 &&
          Math.abs(zone.polygon[last].z - zone.polygon[0].z) < 50) {
        zone.polygon[last] = { x: obj.position.x, z: obj.position.z };
      }
    }
    if (this.onUpdate) this.onUpdate();
  }

  saveAll() {
    const overrides = {};
    for (const z of this.layout.zones) {
      overrides[z.name] = { polygon: z.polygon.map((p) => ({ x: +p.x.toFixed(3), z: +p.z.toFixed(3) })) };
    }
    saveZones(overrides);
  }

  isBusy() {
    return performance.now() - this.lastDragEnd < 150;
  }
}
