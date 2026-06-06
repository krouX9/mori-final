import * as THREE from 'three';
import { getBuildings, getPaths, getBounds } from '../data/geo-loader.js';
import { loadPaths, loadZones } from '../data/dev-storage.js';
import { getFilePathOverrides, getFileZoneOverrides } from '../data/file-overrides.js';
import { PATH_TYPES } from './path-render.js';

// Zones come from BOTH the corrected.json baseline AND the user's live
// localStorage edits. Live wins by id so dev edits override the baseline.
function loadDrawnZones() {
  const fileZones = getFileZoneOverrides();
  const stored = loadZones();
  let liveZones = [];
  if (Array.isArray(stored)) liveZones = stored;
  else if (stored && typeof stored === 'object') {
    // Legacy: stored was { 'Garden': { polygon: [...] } } — convert.
    liveZones = Object.entries(stored).map(([name, v]) => ({
      id: `legacy-${name}`,
      name,
      type: name.toLowerCase(),
      polygon: v.polygon || [],
    }));
  }
  const seenIds = new Set(liveZones.map((z) => z.id).filter(Boolean));
  return [...liveZones, ...fileZones.filter((z) => !seenIds.has(z.id))];
}

const WALL_PADDING = 40;
const ROAD_INSET = 12;


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

  // GeoJSON paths and plazas are no longer loaded. Instead the drawn paths
  // (from corrected.json + live localStorage edits) are expanded into
  // layout.walkways here so the existing props / vegetation systems pick
  // them up automatically — lamps spaced along their segments, shrubs
  // hugging the curves, etc.
  const filePaths = getFilePathOverrides();
  const livePaths = loadPaths();
  const seenPathIds = new Set(livePaths.map((p) => p.id).filter(Boolean));
  const allPaths = [...livePaths, ...filePaths.filter((p) => !seenPathIds.has(p.id))];
  for (const path of allPaths) {
    const pts = path?.points;
    if (!Array.isArray(pts) || pts.length < 2) continue;
    const width = PATH_TYPES[path.type]?.width ?? 2.6;
    for (let i = 0; i < pts.length - 1; i++) {
      layout.walkways.push({
        a: new THREE.Vector2(pts[i].x, pts[i].z),
        b: new THREE.Vector2(pts[i + 1].x, pts[i + 1].z),
        width,
        type: path.type,
      });
    }
  }

  // GeoJSON-baked zones are no longer rendered — user draws fresh zones
  // through dev mode and they persist to localStorage via dev-storage.
  // Anything in localStorage will hydrate here as a layout.zones entry.
  layout.zones = loadDrawnZones();

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
