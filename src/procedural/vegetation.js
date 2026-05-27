import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { range } from '../utils/rng.js';
import { createProp } from '../assets/registry.js';
import { isOccupied } from './layout.js';

export function placeVegetation(layout, sampleHeight, rng) {
  const group = new THREE.Group();
  group.name = 'vegetation';

  const trees = placeTrees(layout, sampleHeight, rng);
  const shrubs = placeShrubs(layout, sampleHeight, rng);

  group.add(trees);
  group.add(shrubs);

  return { group, trees, shrubs };
}

function placeTrees(layout, sampleHeight, rng) {
  const trees = new THREE.Group();
  trees.name = 'trees';

  const { campusRadius, outerFadeStart } = CONFIG.world;
  const ringCenter = campusRadius + 18;
  const ringWidth = 90;
  let placed = 0;
  let tries = 0;
  const target = CONFIG.vegetation.treeCount;
  while (placed < target && tries < target * 40) {
    tries++;
    const r = Math.sqrt(rng()) * outerFadeStart * 1.5;
    const a = rng() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const dist = Math.hypot(x, z);

    const ringDensity = Math.exp(-((dist - ringCenter) ** 2) / (ringWidth * ringWidth));
    const farDensity = 0.04 * Math.max(0, 1 - (dist - 260) / 260);
    const density = Math.max(ringDensity, farDensity);
    if (rng() > density) continue;
    if (isOccupied(layout, x, z, 4)) continue;

    const tree = createProp('tree', rng);
    tree.position.set(x, sampleHeight(x, z), z);
    tree.rotation.y = rng() * Math.PI * 2;
    tree.scale.setScalar(range(rng, 0.85, 1.3));
    trees.add(tree);
    placed++;
  }
  return trees;
}

function placeShrubs(layout, sampleHeight, rng) {
  const shrubs = new THREE.Group();
  shrubs.name = 'shrubs';
  const target = CONFIG.vegetation.shrubCount;
  let placed = 0;
  let tries = 0;
  while (placed < target && tries < target * 25) {
    tries++;
    const r = Math.sqrt(rng()) * (CONFIG.world.campusRadius + 80);
    const a = rng() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (isOccupied(layout, x, z, 1.5)) continue;
    const sh = createProp('shrub', rng);
    sh.position.set(x, sampleHeight(x, z), z);
    sh.rotation.y = rng() * Math.PI * 2;
    sh.scale.setScalar(range(rng, 0.7, 1.4));
    shrubs.add(sh);
    placed++;
  }
  return shrubs;
}
