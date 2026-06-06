import * as THREE from 'three';
import { CONFIG } from '../config.js';

export const PATH_TYPES = {
  pedestrian: { width: 2.4, color: 0xe6d2a7, yOffset: 0.14, label: 'Pedestrian', texKey: 'pedestrianPath' },
  cycle:      { width: 2.4, color: 0xb6896c, yOffset: 0.13, label: 'Cycle',      texKey: 'pedestrianPath' },
  service:    { width: 4.8, color: 0x6c6c60, yOffset: 0.12, label: 'Service road', texKey: 'roadPath' },
  road:       { width: 7.2, color: 0x52524c, yOffset: 0.11, label: 'Road',       texKey: 'roadPath' },
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
      onReady(tex, cfg.repeat ?? 4);
    },
    undefined,
    () => {},
  );
}

const matCache = new Map();
function getMat(type) {
  if (matCache.has(type)) return matCache.get(type);
  const cfg = PATH_TYPES[type] || PATH_TYPES.pedestrian;
  const m = new THREE.MeshStandardMaterial({
    color: cfg.color,
    roughness: 0.95,
    side: THREE.DoubleSide,
    // Sit slightly ahead of terrain in depth — same trick as zones.
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const texCfg = cfg.texKey ? CONFIG.textures?.[cfg.texKey] : null;
  if (texCfg) {
    loadTilingTexture(texCfg, (tex, repeat) => {
      // UVs in the ribbon are raw world XZ, so this maps world metres to
      // texture tiles: every `repeat` metres = one full tile.
      tex.repeat.set(1 / repeat, 1 / repeat);
      m.map = tex;
      m.needsUpdate = true;
    });
  }
  matCache.set(type, m);
  return m;
}

export function buildCurvedPath(points, type, sampleHeight) {
  if (!points || points.length < 2) return null;
  const cfg = PATH_TYPES[type] || PATH_TYPES.pedestrian;
  const mat = getMat(type);

  const vec3 = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
  const closed = false;
  let curve;
  if (vec3.length === 2) {
    // No curve needed; a straight line still uses Catmull with 4 control pts repeated
    curve = new THREE.CatmullRomCurve3([vec3[0], vec3[0], vec3[1], vec3[1]], false, 'catmullrom', 0.0);
  } else {
    curve = new THREE.CatmullRomCurve3(vec3, closed, 'catmullrom', 0.4);
  }
  const totalLen = Math.max(0.5, curve.getLength());
  const segs = Math.max(8, Math.ceil(totalLen / 1.5));
  const samples = curve.getPoints(segs);

  const positions = new Float32Array(samples.length * 2 * 3);
  const uvs       = new Float32Array(samples.length * 2 * 2);
  const indices = [];
  const halfW = cfg.width / 2;
  const yOff = cfg.yOffset;

  for (let i = 0; i < samples.length; i++) {
    const p = samples[i];
    let tx, tz;
    if (i === 0) {
      tx = samples[1].x - p.x;
      tz = samples[1].z - p.z;
    } else if (i === samples.length - 1) {
      tx = p.x - samples[i - 1].x;
      tz = p.z - samples[i - 1].z;
    } else {
      tx = samples[i + 1].x - samples[i - 1].x;
      tz = samples[i + 1].z - samples[i - 1].z;
    }
    const len = Math.hypot(tx, tz) || 1;
    const nx = -tz / len;
    const nz = tx / len;
    const y = sampleHeight(p.x, p.z) + yOff;
    const lx = p.x + nx * halfW;
    const lz = p.z + nz * halfW;
    const rx = p.x - nx * halfW;
    const rz = p.z - nz * halfW;

    const pBase = i * 6;
    positions[pBase + 0] = lx;
    positions[pBase + 1] = y;
    positions[pBase + 2] = lz;
    positions[pBase + 3] = rx;
    positions[pBase + 4] = y;
    positions[pBase + 5] = rz;

    // UVs in raw world metres so the texture tiles seamlessly along curves.
    const uBase = i * 4;
    uvs[uBase + 0] = lx;
    uvs[uBase + 1] = lz;
    uvs[uBase + 2] = rx;
    uvs[uBase + 3] = rz;
  }

  // Winding ordered so that the surface normal points up (+Y)
  for (let i = 0; i < samples.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1);
    indices.push(a + 1, a + 2, a + 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.userData.kind = 'custom-path';
  mesh.userData.type = type;
  return mesh;
}

export function buildCustomPathsGroup(paths, sampleHeight) {
  const group = new THREE.Group();
  group.name = 'custom-paths';
  if (!paths?.length) return group;
  for (const p of paths) {
    const mesh = buildCurvedPath(p.points, p.type, sampleHeight);
    if (mesh) {
      mesh.userData.pathId = p.id;
      group.add(mesh);
    }
  }
  return group;
}
