import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { range, pick } from '../utils/rng.js';
import { createProp } from '../assets/registry.js';
import { isOccupied } from './layout.js';

export function placeProps(layout, sampleHeight, rng) {
  const group = new THREE.Group();
  group.name = 'props';

  group.add(placeLamps(layout, sampleHeight, rng));
  group.add(placeBenches(layout, sampleHeight, rng));
  group.add(placeSigns(layout, sampleHeight, rng));
  group.add(placePoles(layout, sampleHeight, rng));

  return group;
}

function placeLamps(layout, sampleHeight, rng) {
  const lamps = new THREE.Group();
  lamps.name = 'lamps';
  const allSegs = [...layout.walkways, ...layout.roads];
  for (const seg of allSegs) {
    const dx = seg.b.x - seg.a.x;
    const dz = seg.b.y - seg.a.y;
    const len = Math.hypot(dx, dz);
    if (len < 6) continue;
    const spacing = CONFIG.props.lampSpacing;
    const n = Math.floor(len / spacing);
    if (n < 1) continue;
    const ux = dx / len;
    const uz = dz / len;
    const nx = -uz;
    const nz = ux;
    const offset = seg.width * 0.5 + 0.7;
    for (let i = 0; i <= n; i++) {
      const t = (i + 0.5) / (n + 1);
      const cx = seg.a.x + dx * t;
      const cz = seg.a.y + dz * t;
      const side = i % 2 === 0 ? 1 : -1;
      const px = cx + nx * offset * side;
      const pz = cz + nz * offset * side;
      if (isOccupied(layout, px, pz, 0.4)) continue;
      const lamp = createProp('lamp', rng);
      lamp.position.set(px, sampleHeight(px, pz), pz);
      lamp.rotation.y = Math.atan2(-nx * side, -nz * side);
      lamps.add(lamp);
    }
  }
  return lamps;
}

function placeBenches(layout, sampleHeight, rng) {
  const benches = new THREE.Group();
  benches.name = 'benches';
  const target = CONFIG.props.benchCount;
  for (let i = 0; i < target; i++) {
    const a = (i / target) * Math.PI * 2 + (rng() - 0.5) * 0.08;
    const r = layout.quad.r + 1.8;
    const x = layout.quad.x + Math.cos(a) * r;
    const z = layout.quad.z + Math.sin(a) * r;
    if (isOccupied(layout, x, z, 0.5)) continue;
    const b = createProp('bench', rng);
    b.position.set(x, sampleHeight(x, z), z);
    b.rotation.y = a + Math.PI / 2;
    benches.add(b);
  }
  return benches;
}

function placeSigns(layout, sampleHeight, rng) {
  const signs = new THREE.Group();
  signs.name = 'signs';
  if (!layout.walkways.length) return signs;
  for (let i = 0; i < CONFIG.props.signCount; i++) {
    const seg = pick(rng, layout.walkways);
    const t = range(rng, 0.2, 0.8);
    const dx = seg.b.x - seg.a.x;
    const dz = seg.b.y - seg.a.y;
    const len = Math.hypot(dx, dz);
    if (len < 1) continue;
    const cx = seg.a.x + dx * t;
    const cz = seg.a.y + dz * t;
    const nx = -dz / len;
    const nz = dx / len;
    const off = seg.width * 0.5 + 0.8;
    const side = rng() < 0.5 ? 1 : -1;
    const px = cx + nx * off * side;
    const pz = cz + nz * off * side;
    if (isOccupied(layout, px, pz, 0.5)) continue;
    const sn = createProp('sign', rng);
    sn.position.set(px, sampleHeight(px, pz), pz);
    sn.rotation.y = Math.atan2(dx, dz) + (rng() - 0.5) * 0.4;
    signs.add(sn);
  }
  return signs;
}

function placePoles(layout, sampleHeight, rng) {
  const poles = new THREE.Group();
  poles.name = 'poles';
  let placed = 0;
  let tries = 0;
  while (placed < CONFIG.props.poleCount && tries < CONFIG.props.poleCount * 20) {
    tries++;
    const r = layout.quad.r + 55 + rng() * 35;
    const a = rng() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (isOccupied(layout, x, z, 0.5)) continue;
    const p = createProp('pole', rng);
    p.position.set(x, sampleHeight(x, z), z);
    poles.add(p);
    placed++;
  }
  return poles;
}
