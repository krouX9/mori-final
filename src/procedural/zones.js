import * as THREE from 'three';
import { CONFIG } from '../config.js';

const ZONE_STYLES = {
  garden:     { color: new THREE.Color('#82a85a'), height: 0.05 },
  playground: { color: new THREE.Color('#d8a064'), height: 0.05 },
  assembly:   { color: new THREE.Color('#c4ad84'), height: 0.04 },
};

const textureLoader = new THREE.TextureLoader();

function loadTilingTexture(cfg, onReady) {
  if (!cfg?.url) return;
  const base = import.meta.env?.BASE_URL || '/';
  const url = base + cfg.url.split('/').map((s) => encodeURIComponent(s)).join('/');
  textureLoader.load(
    url,
    (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      onReady(tex, cfg.repeat ?? 8);
    },
    undefined,
    () => {},
  );
}

// Shoelace area in our XZ plane. Positive return = clockwise winding when
// viewed from +Y down (i.e. the natural plan-view orientation).
function signedArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += (b.x - a.x) * (b.z + a.z);
  }
  return sum;
}

/**
 * Find the highest terrain elevation the zone covers. We sample every
 * polygon vertex, every edge midpoint, and the centroid — that's enough to
 * catch any noise bulge between vertices that would otherwise poke through
 * a flat mesh sitting at the corner heights.
 */
function findMaxTerrainHeight(poly, sampleHeight) {
  let maxY = -Infinity;
  let cx = 0, cz = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    maxY = Math.max(maxY, sampleHeight(a.x, a.z));
    maxY = Math.max(maxY, sampleHeight((a.x + b.x) * 0.5, (a.z + b.z) * 0.5));
    cx += a.x;
    cz += a.z;
  }
  cx /= poly.length;
  cz /= poly.length;
  maxY = Math.max(maxY, sampleHeight(cx, cz));
  return maxY;
}

/**
 * Build a flat ground polygon mesh at a single Y elevation chosen so it
 * sits just above the highest terrain point in the area. A flat mesh
 * means:
 *   • No diagonal facet from a sloped quad triangulation (the "two
 *     triangle cutouts" effect).
 *   • No terrain noise bulge poking up through the interior between
 *     vertices.
 * The lift is small (~0.3 m above the local max), so the polygon still
 * reads as flush with the ground from any normal viewing angle.
 */
function buildPolygonGeometry(rawPolygon, sampleHeight, lift) {
  if (!Array.isArray(rawPolygon) || rawPolygon.length < 3) return null;

  // Normalize winding so we always feed the triangulator CCW input.
  let poly = rawPolygon;
  if (signedArea(poly) > 0) poly = poly.slice().reverse();

  const contour = poly.map((p) => new THREE.Vector2(p.x, p.z));
  const faces = THREE.ShapeUtils.triangulateShape(contour, []);
  if (!faces.length) return null;

  const flatY = findMaxTerrainHeight(poly, sampleHeight) + lift;

  const positions = new Float32Array(poly.length * 3);
  const uvs       = new Float32Array(poly.length * 2);
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    positions[i * 3 + 0] = p.x;
    positions[i * 3 + 1] = flatY;
    positions[i * 3 + 2] = p.z;
    uvs[i * 2 + 0] = p.x;
    uvs[i * 2 + 1] = p.z;
  }

  // Reverse each triangle's winding so the face normal points +Y.
  const indices = new Array(faces.length * 3);
  for (let i = 0; i < faces.length; i++) {
    const f = faces[i];
    indices[i * 3 + 0] = f[0];
    indices[i * 3 + 1] = f[2];
    indices[i * 3 + 2] = f[1];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function buildZones(layout, sampleHeight) {
  const group = new THREE.Group();
  group.name = 'zones';

  for (const zone of layout.zones || []) {
    const style = ZONE_STYLES[zone.type] || ZONE_STYLES.assembly;
    // A bit more lift than the previous attempt — enough to clear the noise
    // bumps inside the zone area completely, still flush enough that the
    // edge reads as ground from any orbit angle.
    const lift = style.height + 0.3;
    const geo = buildPolygonGeometry(zone.polygon, sampleHeight, lift);
    if (!geo) continue;

    const mat = new THREE.MeshStandardMaterial({
      color: style.color,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const texCfg = CONFIG.textures?.[zone.type];
    if (texCfg) {
      loadTilingTexture(texCfg, (tex, repeat) => {
        tex.repeat.set(1 / repeat, 1 / repeat);
        mat.map = tex;
        mat.needsUpdate = true;
      });
    }

    // Vertex positions already include the terrain height + lift, so the
    // mesh sits at world origin and each vertex hugs its local elevation.
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.renderOrder = 1;
    mesh.name = `zone:${zone.name || zone.type}`;
    group.add(mesh);
  }

  return group;
}
