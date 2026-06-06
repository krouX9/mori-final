import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { CONFIG } from '../config.js';

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
      const r = cfg.repeat ?? 8;
      tex.repeat.set(r, r);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      onReady(tex);
    },
    undefined,
    () => {},
  );
}

/**
 * Build the terrain. Same grass tint applies everywhere (inside and outside
 * the campus). Volumetric fog (set up in atmosphere.js) handles the horizon
 * blur, so we no longer need a vertex-colour horizon blend.
 */
export function createTerrain() {
  const { terrainSize, terrainSegments, campusRadius } = CONFIG.world;
  const geo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
  geo.rotateX(-Math.PI / 2);

  const noise = new ImprovedNoise();

  const heightAt = (x, z) => {
    const distFromCenter = Math.hypot(x, z);
    const outerness = THREE.MathUtils.smoothstep(distFromCenter, 0, campusRadius);
    const broad = noise.noise(x * 0.004, z * 0.004, 0) * 4.0;
    const fine = noise.noise(x * 0.022, z * 0.022, 11) * 0.6;
    return (broad + fine) * (0.18 + 0.9 * outerness);
  };

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grass = CONFIG.palette.grass;
  const grassDry = CONFIG.palette.grassDry;
  const soil = CONFIG.palette.soil;
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);

    // Noise-based moisture / dryness variation gives the terrain its
    // organic look. No inside/outside split — the same green covers
    // everything; fog handles the horizon.
    const moisture = 0.5 + 0.5 * noise.noise(x * 0.006, z * 0.006, 4);
    const dryness = THREE.MathUtils.smoothstep(Math.hypot(x, z), campusRadius, campusRadius * 1.8);
    tmp.copy(grass).lerp(grassDry, dryness * 0.45 + (1 - moisture) * 0.25);
    if (h < -0.4) tmp.lerp(soil, 0.35);
    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1.0,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

  // Optional grass texture (can be configured in CONFIG.textures.grass if needed).
  loadTilingTexture(CONFIG.textures.grass, (tex) => {
    mat.map = tex;
    mat.needsUpdate = true;
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';

  return { mesh, sampleHeight: heightAt };
}
