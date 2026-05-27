import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { range } from '../utils/rng.js';

export function generateLayout(rng) {
  const layout = {
    buildingLots: [],
    walkways: [],
    roads: [],
    walls: [],
    quad: { x: 0, z: 0, r: 22 },
  };

  const lotCount = CONFIG.buildings.lots;
  const baseR = 52;
  for (let i = 0; i < lotCount; i++) {
    const angle = (i / lotCount) * Math.PI * 2 + (rng() - 0.5) * 0.18;
    const r = baseR + rng() * 12;
    const w = range(rng, 14, 22);
    const d = range(rng, 14, 22);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const rotY = angle + Math.PI;
    layout.buildingLots.push({ x, z, w, d, rotY });
  }

  for (const lot of layout.buildingLots) {
    const dir = new THREE.Vector2(lot.x, lot.z).normalize();
    const entrance = dir.clone().multiplyScalar(layout.quad.r + 2);
    const lotEdge = new THREE.Vector2(lot.x, lot.z).sub(
      dir.clone().multiplyScalar(Math.max(lot.w, lot.d) * 0.55),
    );
    layout.walkways.push({
      a: entrance,
      b: lotEdge,
      width: 3.2,
    });
  }

  const ringSegments = 20;
  for (let i = 0; i < ringSegments; i++) {
    const a0 = (i / ringSegments) * Math.PI * 2;
    const a1 = ((i + 1) / ringSegments) * Math.PI * 2;
    layout.walkways.push({
      a: new THREE.Vector2(Math.cos(a0) * layout.quad.r, Math.sin(a0) * layout.quad.r),
      b: new THREE.Vector2(Math.cos(a1) * layout.quad.r, Math.sin(a1) * layout.quad.r),
      width: 2.4,
    });
  }

  const roadR = 95;
  const roadCorners = [
    new THREE.Vector2(-roadR, -roadR),
    new THREE.Vector2(roadR, -roadR),
    new THREE.Vector2(roadR, roadR),
    new THREE.Vector2(-roadR, roadR),
  ];
  for (let i = 0; i < 4; i++) {
    layout.roads.push({
      a: roadCorners[i],
      b: roadCorners[(i + 1) % 4],
      width: 6.5,
    });
  }
  for (let i = 0; i < 4; i++) {
    const inner = roadCorners[i].clone().multiplyScalar(0.78);
    layout.roads.push({
      a: roadCorners[i],
      b: inner,
      width: 5.5,
    });
  }

  const wallR = 115;
  const wallCorners = [
    new THREE.Vector2(-wallR, -wallR),
    new THREE.Vector2(wallR, -wallR),
    new THREE.Vector2(wallR, wallR),
    new THREE.Vector2(-wallR, wallR),
  ];
  for (let i = 0; i < 4; i++) {
    layout.walls.push({
      a: wallCorners[i],
      b: wallCorners[(i + 1) % 4],
      width: 0.8,
    });
  }

  return layout;
}

export function isOccupied(layout, x, z, radius = 1) {
  for (const lot of layout.buildingLots) {
    const halfW = lot.w / 2 + radius;
    const halfD = lot.d / 2 + radius;
    if (Math.abs(x - lot.x) < halfW && Math.abs(z - lot.z) < halfD) return true;
  }
  for (const seg of layout.walkways) {
    if (distanceToSegment2(x, z, seg.a.x, seg.a.y, seg.b.x, seg.b.y) < seg.width * 0.5 + radius) {
      return true;
    }
  }
  for (const seg of layout.roads) {
    if (distanceToSegment2(x, z, seg.a.x, seg.a.y, seg.b.x, seg.b.y) < seg.width * 0.5 + radius) {
      return true;
    }
  }
  for (const seg of layout.walls) {
    if (distanceToSegment2(x, z, seg.a.x, seg.a.y, seg.b.x, seg.b.y) < seg.width * 0.5 + radius) {
      return true;
    }
  }
  const dq = Math.hypot(x - layout.quad.x, z - layout.quad.z);
  if (dq < layout.quad.r + radius) return true;
  return false;
}

function distanceToSegment2(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const denom = abx * abx + abz * abz;
  if (denom < 1e-6) return Math.hypot(px - ax, pz - az);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / denom));
  const cx = ax + abx * t;
  const cz = az + abz * t;
  return Math.hypot(px - cx, pz - cz);
}
