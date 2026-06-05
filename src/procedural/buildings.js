import * as THREE from 'three';
import { createProp } from '../assets/registry.js';
import { getModelForBuilding, listUnmatchedModels } from '../assets/model-loader.js';

const tmpBBox = new THREE.Box3();
const tmpSize = new THREE.Vector3();

// Maximum allowed auto-scale. A reasonable building never needs > 30× scale;
// if a GLB does, the source is broken (origin at center, wrong units, etc.) —
// clamping here keeps a single bad model from blotting the campus.
function clampScale(s) {
  return Math.max(0.05, Math.min(s, 30));
}

/**
 * Uniformly scale a GLB so its XZ footprint *fits inside* the lot.
 * Uses the smaller of the two dimension ratios (so the model never spills
 * over the lot in either axis), preserving proportions. Falls back to a
 * height-based default for spillover models without a lot.
 */
function computeFitScale(model, lot) {
  tmpBBox.setFromObject(model);
  tmpBBox.getSize(tmpSize);

  if (lot?.w && lot?.d && tmpSize.x > 0.001 && tmpSize.z > 0.001) {
    const fitX = lot.w / tmpSize.x;
    const fitZ = lot.d / tmpSize.z;
    return clampScale(Math.min(fitX, fitZ));
  }
  // No lot — boost very short models to ~8m so they read as buildings.
  if (tmpSize.y > 0.001 && tmpSize.y < 1.5) {
    return clampScale(8 / tmpSize.y);
  }
  return 1;
}

function applyOverride(obj, lot, sampleHeight, ov, autoScale = 1) {
  if (ov?.position) {
    obj.position.set(ov.position[0], ov.position[1], ov.position[2]);
  } else {
    obj.position.set(lot.x, sampleHeight(lot.x, lot.z), lot.z);
  }
  obj.rotation.y = (ov?.rotation != null) ? ov.rotation : lot.rotY;
  obj.scale.setScalar(ov?.scale != null ? ov.scale : autoScale);
}

export function placeBuildings(layout, sampleHeight, rng, overrides = {}) {
  const group = new THREE.Group();
  group.name = 'buildings';

  for (const lot of layout.buildingLots) {
    const model = getModelForBuilding(lot.name);
    const b = model || createProp('building', rng, { w: lot.w, d: lot.d, area: lot.area });

    const autoScale = model ? computeFitScale(b, lot) : 1;
    applyOverride(b, lot, sampleHeight, overrides[lot.id], autoScale);

    b.userData.info = {
      id: lot.id,
      name: lot.displayName || lot.name,
      rawName: lot.name,
      area: lot.area,
      perimeter: lot.perimeter,
      description: lot.shortDescription || 'Campus facility',
      longDescription: lot.longDescription || `Description for ${lot.displayName || lot.name} coming soon.`,
    };
    b.userData.clickable = true;
    b.userData.buildingId = lot.id;
    b.userData.layoutLot = lot;
    b.userData.hasModel = !!model;
    b.userData.autoScale = autoScale;
    group.add(b);
  }

  // Spillover: GLBs without a matched GeoJSON building.
  const unmatched = listUnmatchedModels();
  if (unmatched.length && layout.bounds) {
    const startX = layout.bounds.maxX + 80;
    const startZ = layout.bounds.minZ + 20;
    const spacing = 35;
    const cols = 4;
    unmatched.forEach((entry, i) => {
      const id = `glb-${entry.basename}`;
      const ov = overrides[id];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const baseX = startX + col * spacing;
      const baseZ = startZ + row * spacing;
      const m = entry.scene;

      const autoScale = computeFitScale(m, null);
      m.scale.setScalar(ov?.scale != null ? ov.scale : autoScale);

      if (ov?.position) {
        m.position.set(ov.position[0], ov.position[1], ov.position[2]);
      } else {
        m.position.set(baseX, sampleHeight(baseX, baseZ), baseZ);
      }
      if (ov?.rotation != null) m.rotation.y = ov.rotation;

      m.userData.info = {
        id,
        name: entry.basename,
        description: 'Unplaced model · drag in dev mode',
        longDescription: `${entry.basename}.glb has no GeoJSON building counterpart. Open ?dev=1 and drag it into place; the override will be saved with the rest.`,
      };
      m.userData.clickable = true;
      m.userData.buildingId = id;
      m.userData.hasModel = true;
      m.userData.spillover = true;
      m.userData.autoScale = autoScale;
      group.add(m);
    });
  }

  return group;
}
