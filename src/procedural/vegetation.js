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
  const pathShrubs = placeShrubsAlongPaths(layout, sampleHeight, rng);

  group.add(trees);
  group.add(shrubs);
  group.add(pathShrubs);

  return { group, trees, shrubs };
}

// Standard ray-casting point-in-polygon test for the playground-exclusion
// check. Polygon points are { x, z }.
function pointInPolygon(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, zi = polygon[i].z;
    const xj = polygon[j].x, zj = polygon[j].z;
    const intersect = ((zi > z) !== (zj > z)) &&
      (x < ((xj - xi) * (z - zi)) / ((zj - zi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isInPlayground(x, z, zones) {
  if (!Array.isArray(zones) || zones.length === 0) return false;
  for (const zone of zones) {
    if (zone.type === 'playground' && pointInPolygon(x, z, zone.polygon)) return true;
  }
  return false;
}

// Walk every path segment and sprinkle shrub clusters perpendicular to it
// at random intervals on alternating sides. This produces the natural
// "shrubs lining the path" look without us having to add a dedicated
// placement system per path.
function placeShrubsAlongPaths(layout, sampleHeight, rng) {
  const out = new THREE.Group();
  out.name = 'path-shrubs';
  for (const seg of layout.walkways) {
    const dx = seg.b.x - seg.a.x;
    const dz = seg.b.y - seg.a.y;
    const len = Math.hypot(dx, dz);
    if (len < 6) continue;
    const ux = dx / len;
    const uz = dz / len;
    const nx = -uz;
    const nz = ux;

    const spacing = 5;
    const n = Math.floor(len / spacing);
    for (let i = 0; i < n; i++) {
      if (rng() > 0.55) continue;
      const t = (i + 0.5) / n;
      const cx = seg.a.x + dx * t;
      const cz = seg.a.y + dz * t;
      const side = rng() < 0.5 ? 1 : -1;
      const offset = seg.width * 0.5 + 1.2 + rng() * 1.6;
      const px = cx + nx * offset * side;
      const pz = cz + nz * offset * side;
      if (isOccupied(layout, px, pz, 0.5)) continue;
      if (isInPlayground(px, pz, layout.zones)) continue;
      const sh = createProp('shrub', rng);
      sh.position.set(px, sampleHeight(px, pz), pz);
      sh.rotation.y = rng() * Math.PI * 2;
      sh.scale.setScalar(range(rng, 0.7, 1.3));
      out.add(sh);
    }
  }
  return out;
}

// Vegetation is allowed inside the wall AND in a generous skirt around it
// — fog hides whatever drifts far, so a soft halo of trees outside the
// campus reads as natural countryside.
const VEG_PADDING = 140;
function isInVegRange(x, z, bounds) {
  if (!bounds || !Number.isFinite(bounds.minX)) return true;
  return (
    x > bounds.minX - VEG_PADDING &&
    x < bounds.maxX + VEG_PADDING &&
    z > bounds.minZ - VEG_PADDING &&
    z < bounds.maxZ + VEG_PADDING
  );
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
    if (!isInVegRange(x, z, layout.bounds)) continue;
    if (isInPlayground(x, z, layout.zones)) continue;
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
    if (!isInVegRange(x, z, layout.bounds)) continue;
    if (isInPlayground(x, z, layout.zones)) continue;
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
