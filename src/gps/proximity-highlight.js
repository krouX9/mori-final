import * as THREE from 'three';

const HIGHLIGHT_COLOR = 0xffd28a;

export class ProximityHighlight {
  constructor({ buildings, gps, threshold = 18, onNearChange = null }) {
    this.buildings = buildings;
    this.gps = gps;
    this.threshold = threshold;
    this.onNearChange = onNearChange;
    this.initialized = false;
    this.activeId = null;
  }

  init() {
    for (const b of this.buildings.children) {
      b.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        if (child.userData.materialCloned) return;
        child.material = child.material.clone();
        child.userData.materialCloned = true;
        child.userData.originalEmissive = child.material.emissive?.clone() ?? new THREE.Color(0);
        child.userData.originalEmissiveIntensity = child.material.emissiveIntensity ?? 0;
      });
    }
    this.initialized = true;
  }

  update(dt, elapsed) {
    if (!this.gps?.enabled || !this.gps?.userPos) {
      if (this.activeId) {
        const prev = this.findById(this.activeId);
        if (prev) this.restore(prev);
        this.activeId = null;
        if (this.onNearChange) this.onNearChange(null);
      }
      return;
    }
    if (!this.initialized) this.init();

    const u = this.gps.userPos;
    let nearest = null;
    let nearestDist = Infinity;
    for (const b of this.buildings.children) {
      const dist = Math.hypot(b.position.x - u.x, b.position.z - u.z);
      if (dist < this.threshold && dist < nearestDist) {
        nearest = b;
        nearestDist = dist;
      }
    }

    const newId = nearest?.userData?.buildingId ?? null;
    if (newId !== this.activeId) {
      if (this.activeId) {
        const prev = this.findById(this.activeId);
        if (prev) this.restore(prev);
      }
      this.activeId = newId;
      if (this.onNearChange) this.onNearChange(nearest);
    }
    if (nearest) {
      const pulse = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(elapsed * 3.5));
      this.applyEmissive(nearest, HIGHLIGHT_COLOR, pulse);
    }
  }

  findById(id) {
    return this.buildings.children.find((b) => b.userData?.buildingId === id) || null;
  }

  applyEmissive(b, hex, intensity) {
    b.traverse((c) => {
      if (!c.isMesh || !c.userData.materialCloned || !c.material.emissive) return;
      c.material.emissive.setHex(hex);
      c.material.emissiveIntensity = intensity;
    });
  }

  restore(b) {
    b.traverse((c) => {
      if (!c.isMesh || !c.userData.materialCloned || !c.material.emissive) return;
      c.material.emissive.copy(c.userData.originalEmissive);
      c.material.emissiveIntensity = c.userData.originalEmissiveIntensity;
    });
  }

  clearAll() {
    for (const b of this.buildings.children) this.restore(b);
    this.activeId = null;
  }
}
