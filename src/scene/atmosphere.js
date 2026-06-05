import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function setupAtmosphere(scene) {
  // Background colour shows behind the skydome at extreme angles and is the
  // same as the horizon colour so any sliver between dome + terrain reads
  // as sky.
  scene.background = CONFIG.palette.skyHorizon.clone();
  // No volumetric fog — depth fade is done in vertex colours on the terrain
  // (see terrain.js) which blends the ground toward skyHorizon at distance.
  scene.fog = null;
  scene.add(createSkydome());
}

function createSkydome() {
  const radius = 900;
  const geo = new THREE.SphereGeometry(radius, 32, 16);
  const top = CONFIG.palette.skyTop;
  const horiz = CONFIG.palette.skyHorizon;
  const fog = CONFIG.palette.fog;
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / radius;
    if (y >= 0) {
      const t = THREE.MathUtils.smoothstep(y, 0, 1);
      c.copy(horiz).lerp(top, t);
    } else {
      const t = THREE.MathUtils.smoothstep(-y, 0, 0.5);
      c.copy(horiz).lerp(fog, t);
    }
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'skydome';
  mesh.renderOrder = -10;
  return mesh;
}
