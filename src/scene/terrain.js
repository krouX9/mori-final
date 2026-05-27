import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { CONFIG } from '../config.js';

export function createTerrain() {
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
  const grass = CONFIG.palette.grass;
  const grassDry = CONFIG.palette.grassDry;
  const soil = CONFIG.palette.soil;
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);

    const distFromCenter = Math.hypot(x, z);
    const moisture = 0.5 + 0.5 * noise.noise(x * 0.006, z * 0.006, 4);
    const dryness = THREE.MathUtils.smoothstep(distFromCenter, campusRadius, outerFadeStart);
    tmp.copy(grass).lerp(grassDry, dryness * 0.65 + (1 - moisture) * 0.25);
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
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';

  return { mesh, sampleHeight: heightAt };
}
