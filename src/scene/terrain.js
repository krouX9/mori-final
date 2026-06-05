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
 * Build the terrain mesh. If `bounds` is supplied, the area outside the
 * boundary wall is masked so:
 *   - it doesn't sample the grass texture (the `inside` attribute mixes it
 *     out via a shader-injected substitution of the map_fragment chunk)
 *   - it's painted with CONFIG.outsideColor as a solid violet tint
 */
export function createTerrain(bounds) {
  const { terrainSize, terrainSegments, campusRadius, outerFadeStart } = CONFIG.world;
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
  const inside = new Float32Array(pos.count);
  const grass = CONFIG.palette.grass;
  const grassDry = CONFIG.palette.grassDry;
  const soil = CONFIG.palette.soil;
  const outside = CONFIG.outsideColor || new THREE.Color('#9d8eb8');
  const tmp = new THREE.Color();

  // Inside-the-wall predicate. We use the same bounding box the wall is
  // built from in layout.js (bounds + WALL_PADDING). Vertices outside go
  // straight to the violet tint; vertices inside get the usual grass blend.
  const PADDING = 40;
  const hasBounds = !!(bounds && Number.isFinite(bounds.minX));
  const isInside = (x, z) => {
    if (!hasBounds) return 1;
    if (x < bounds.minX - PADDING || x > bounds.maxX + PADDING) return 0;
    if (z < bounds.minZ - PADDING || z > bounds.maxZ + PADDING) return 0;
    return 1;
  };

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);

    const insideFlag = isInside(x, z);
    inside[i] = insideFlag;

    if (insideFlag < 0.5) {
      // Outside the wall: solid violet tint, no horizon blend, no texture.
      tmp.copy(outside);
    } else {
      const distFromCenter = Math.hypot(x, z);
      const moisture = 0.5 + 0.5 * noise.noise(x * 0.006, z * 0.006, 4);
      const dryness = THREE.MathUtils.smoothstep(distFromCenter, campusRadius, outerFadeStart);
      tmp.copy(grass).lerp(grassDry, dryness * 0.65 + (1 - moisture) * 0.25);
      if (h < -0.4) tmp.lerp(soil, 0.35);
    }
    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('inside', new THREE.BufferAttribute(inside, 1));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1.0,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

  // Shader injection: the `inside` vertex attribute becomes a varying float
  // that selects between solid tint (outside the wall) and tinted texture
  // (inside). We patch the standard `map_fragment` chunk so when USE_MAP is
  // defined we lerp the texture's contribution by vInside.
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>',
        '#include <common>\nattribute float inside;\nvarying float vInside;')
      .replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvInside = inside;');

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>',
        '#include <common>\nvarying float vInside;')
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D(map, vMapUv);
          diffuseColor.rgb *= mix(vec3(1.0), sampledDiffuseColor.rgb, vInside);
        #endif
      `);
  };

  loadTilingTexture(CONFIG.textures.grass, (tex) => {
    mat.map = tex;
    mat.needsUpdate = true;
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';

  return { mesh, sampleHeight: heightAt };
}
