import * as THREE from 'three';
import { createProp } from '../assets/registry.js';
import { BUILDINGS } from '../data/building-info.js';

export function placeBuildings(layout, sampleHeight, rng) {
  const group = new THREE.Group();
  group.name = 'buildings';
  layout.buildingLots.forEach((lot, i) => {
    const b = createProp('building', rng, { w: lot.w, d: lot.d });
    b.position.set(lot.x, sampleHeight(lot.x, lot.z), lot.z);
    b.rotation.y = lot.rotY;
    b.userData.info = BUILDINGS[i % BUILDINGS.length];
    b.userData.clickable = true;
    group.add(b);
  });
  return group;
}
