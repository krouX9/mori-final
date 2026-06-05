import * as THREE from 'three';
import { getBuildings, getPaths, getZones, getBounds } from '../data/geo-loader.js';
import { loadZones } from '../data/dev-storage.js';

const WALL_PADDING = 40;
const ROAD_INSET = 12;

function applyZoneOverrides(zones) {
  const overrides = loadZones();
  return zones.map((z) => {
    const ov = overrides[z.name];
    if (ov?.polygon?.length >= 3) {
      return { ...z, polygon: ov.polygon.map((p) => ({ x: p.x, z: p.z })) };
    }
    return z;
  });
}

export function generateLayout() {
  const layout = {
    buildingLots: [],
    walkways: [],
    roads: [],
    walls: [],
    zones: [],
    plazas: [],
    quad: { x: 0, z: 0, r: 0 },
  };

  for (const b of getBuildings()) {
    layout.buildingLots.push({
      id: b.id,
      name: b.name,
      displayName: b.displayName,
      area: b.area,
      perimeter: b.perimeter,
      shortDescription: b.shortDescription,
      longDescription: b.longDescription,
      x: b.x, z: b.z, w: b.w, d: b.d, rotY: b.rotY,
    });
  }

  const paths = getPaths();
  for (const line of paths.linestrings) {
    for (let i = 0; i < line.length - 1; i++) {
      layout.walkways.push({
        a: new THREE.Vector2(line[i].x, line[i].z),
        b: new THREE.Vector2(line[i + 1].x, line[i + 1].z),
        width: 2.6,
      });
    }
  }
  for (const poly of paths.polygons) {
    const ring = poly[0];
    if (!ring?.length) continue;
    let cx = 0, cz = 0;
    for (const p of ring) { cx += p.x; cz += p.z; }
    cx /= ring.length;
    cz /= ring.length;
    let r = 0;
    for (const p of ring) r = Math.max(r, Math.hypot(p.x - cx, p.z - cz));
    layout.plazas.push({ x: cx, z: cz, r });
  }

  layout.zones = applyZoneOverrides(
    getZones().map((z) => ({
      name: z.name,
      type: z.type,
      polygon: z.polygon.map((p) => ({ x: p.x, z: p.z })),
    })),
  );

  const b = getBounds();
  const corners = [
    new THREE.Vector2(b.minX - WALL_PADDING, b.minZ - WALL_PADDING),
    new THREE.Vector2(b.maxX + WALL_PADDING, b.minZ - WALL_PADDING),
    new THREE.Vector2(b.maxX + WALL_PADDING, b.maxZ + WALL_PADDING),
    new THREE.Vector2(b.minX - WALL_PADDING, b.maxZ + WALL_PADDING),
  ];
  for (let i = 0; i < 4; i++) {
    layout.walls.push({ a: corners[i], b: corners[(i + 1) % 4], width: 0.8 });
  }

  // Perimeter road generation removed — user draws roads in dev mode now.
  // layout.roads stays an empty array so the vehicles system bails out.

  layout.quad = { x: b.cx, z: b.cz, r: 0 };
  layout.bounds = b;

  return layout;
}

export function isOccupied(layout, x, z, radius = 1) {
  for (const lot of layout.buildingLots) {
    const halfW = lot.w / 2 + radius;
    const halfD = lot.d / 2 + radius;
    if (Math.abs(x - lot.x) < halfW && Math.abs(z - lot.z) < halfD) return true;
  }
  for (const seg of layout.walkways) {
    if (distanceToSegment2(x, z, seg.a.x, seg.a.y, seg.b.x, seg.b.y) < seg.width * 0.5 + radius) return true;
  }
  for (const seg of layout.roads) {
    if (distanceToSegment2(x, z, seg.a.x, seg.a.y, seg.b.x, seg.b.y) < seg.width * 0.5 + radius) return true;
  }
  for (const seg of layout.walls) {
    if (distanceToSegment2(x, z, seg.a.x, seg.a.y, seg.b.x, seg.b.y) < seg.width * 0.5 + radius) return true;
  }
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
