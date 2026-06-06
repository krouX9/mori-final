import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function setupAtmosphere(scene) {
  scene.background = CONFIG.palette.fog.clone();
  // Mobile reduces fog density: the camera tends to sit further from the
  // campus on small screens (more world fits in frame), and the full fog
  // strength makes the scene look washed out at that scale.
  const mobile = typeof window !== 'undefined'
    && window.matchMedia?.('(max-width: 768px)').matches;
  const density = CONFIG.fog.density * (mobile ? 0.45 : 1);
  scene.fog = new THREE.FogExp2(CONFIG.palette.fog, density);
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
