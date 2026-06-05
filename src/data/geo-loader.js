import buildingsRaw from './geo/Buildings.geojson?raw';
import pathsRaw from './geo/paths-map.geojson?raw';
import zonesRaw from './geo/Zones.geojson?raw';
import { getDetailsFor } from './building-details.js';

const buildingsGeo = JSON.parse(buildingsRaw);
const pathsGeo = JSON.parse(pathsRaw);
const zonesGeo = JSON.parse(zonesRaw);

const ORIGIN = computeOrigin(buildingsGeo);
const LAT_M = 111320;
const LON_M = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

function computeOrigin(features) {
  let lon = 0, lat = 0, n = 0;
  for (const f of features.features) {
    if (f.geometry?.type === 'Point') {
      lon += f.geometry.coordinates[0];
      lat += f.geometry.coordinates[1];
      n++;
    }
  }
  return { lon: lon / n, lat: lat / n };
}

export function project(lon, lat) {
  return {
    x: (lon - ORIGIN.lon) * LON_M,
    z: -(lat - ORIGIN.lat) * LAT_M,
  };
}

function parseMeasure(str) {
  if (str == null) return null;
  const cleaned = String(str).replace(/,/g, '').trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function extractName(props) {
  for (const k of ['Name', 'name', 'Name ', 'Name: ']) {
    if (props[k]) return String(props[k]).trim();
  }
  return 'Unnamed Building';
}

function deriveDimensions(perimeter, area) {
  if (!area) return { w: 12, d: 12 };
  if (!perimeter) {
    const s = Math.sqrt(area);
    return { w: s, d: s };
  }
  const half = perimeter / 4;
  const disc = half * half - area;
  if (disc < 0) {
    const s = Math.sqrt(area);
    return { w: s, d: s };
  }
  const r = Math.sqrt(disc);
  return { w: half + r, d: half - r };
}

function buildLongDescription(name, area, perimeter) {
  const stats = [];
  if (area) stats.push(`${Math.round(area).toLocaleString()} m² floor area`);
  if (perimeter) stats.push(`${Math.round(perimeter)} m perimeter`);
  const statLine = stats.length ? stats.join(' · ') : '';
  return [
    `${name} is part of the Mori campus.`,
    statLine ? `It occupies ${statLine}.` : '',
    'A detailed description, history, and image gallery will be populated here. This is placeholder content that you can replace with the real copy for the building.',
  ].filter(Boolean).join(' ');
}

function processBuildings() {
  const list = [];
  buildingsGeo.features.forEach((f, idx) => {
    if (f.geometry?.type !== 'Point') return;
    const [lon, lat] = f.geometry.coordinates;
    const { x, z } = project(lon, lat);
    const name = extractName(f.properties || {});
    const perimeter = parseMeasure(f.properties?.Perimeter);
    const area = parseMeasure(f.properties?.Area);
    const { w, d } = deriveDimensions(perimeter, area);
    const rawId = f.id ?? idx;
    const details = getDetailsFor(name);
    list.push({
      id: `b-${rawId}-${idx}`,
      name,                                 // raw GeoJSON name — used for GLB slug match
      displayName: details?.displayName || name,
      x,
      z,
      w,
      d,
      area,
      perimeter,
      rotY: 0,
      shortDescription: [area && `${Math.round(area)} m²`, perimeter && `${Math.round(perimeter)} m perimeter`]
        .filter(Boolean)
        .join(' · '),
      longDescription: details?.longDescription || buildLongDescription(details?.displayName || name, area, perimeter),
    });
  });
  return list;
}

function projectRing(ring) {
  return ring.map(([lon, lat]) => project(lon, lat));
}

function processPaths() {
  const linestrings = [];
  const polygons = [];
  for (const f of pathsGeo.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'LineString') {
      linestrings.push(projectRing(g.coordinates));
    } else if (g.type === 'Polygon') {
      polygons.push(g.coordinates.map(projectRing));
    }
  }
  return { linestrings, polygons };
}

function processZones() {
  return zonesGeo.features
    .filter((f) => f.geometry?.type === 'Polygon')
    .map((f) => {
      const name = f.properties?.name || 'Zone';
      return {
        name,
        type: name.toLowerCase(),
        polygon: f.geometry.coordinates[0].map(([lon, lat]) => project(lon, lat)),
      };
    });
}

const _buildings = processBuildings();
const _paths = processPaths();
const _zones = processZones();
const _bounds = computeBounds(_buildings, _paths, _zones);

function computeBounds(buildings, paths, zones) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const consider = (x, z) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  };
  for (const b of buildings) {
    consider(b.x - b.w / 2, b.z - b.d / 2);
    consider(b.x + b.w / 2, b.z + b.d / 2);
  }
  for (const line of paths.linestrings) for (const p of line) consider(p.x, p.z);
  for (const poly of paths.polygons) for (const ring of poly) for (const p of ring) consider(p.x, p.z);
  for (const z of zones) for (const p of z.polygon) consider(p.x, p.z);
  return { minX, maxX, minZ, maxZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 };
}

export const getBuildings = () => _buildings;
export const getPaths = () => _paths;
export const getZones = () => _zones;
export const getBounds = () => _bounds;
export const getOrigin = () => ORIGIN;
