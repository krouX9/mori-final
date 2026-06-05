// ============================================================================
//  Building dim — make non-focused buildings translucent
// ----------------------------------------------------------------------------
//  When a building is selected, every other building in the campus group
//  swaps to a translucent clone of its material so the focused one reads as
//  the obvious subject. On deactivate, the originals are restored.
//
//  Materials are cloned once per mesh and cached on the mesh's userData,
//  so toggling repeatedly stays cheap.
// ============================================================================

const DIM_OPACITY = 0.15;

export class BuildingDim {
  constructor(buildings) {
    this.buildings = buildings;
    this.activeBuilding = null;
  }

  activate(building) {
    if (this.activeBuilding === building) return;
    if (this.activeBuilding) this.deactivate();
    this.activeBuilding = building || null;
    if (!building) return;

    for (const b of this.buildings.children) {
      if (b === building) continue;
      this.dim(b);
    }
  }

  deactivate() {
    if (!this.activeBuilding) return;
    for (const b of this.buildings.children) {
      if (b === this.activeBuilding) continue;
      this.restore(b);
    }
    this.activeBuilding = null;
  }

  clear() { this.deactivate(); }

  dim(building) {
    building.traverse((c) => {
      if (!c.isMesh || !c.material) return;
      if (!c.userData._dimOriginal) c.userData._dimOriginal = c.material;
      if (!c.userData._dimMaterial) {
        const dim = c.material.clone();
        dim.transparent = true;
        dim.opacity = DIM_OPACITY;
        dim.depthWrite = false;
        c.userData._dimMaterial = dim;
      }
      c.material = c.userData._dimMaterial;
    });
  }

  restore(building) {
    building.traverse((c) => {
      if (!c.isMesh) return;
      if (c.userData._dimOriginal) c.material = c.userData._dimOriginal;
    });
  }
}
