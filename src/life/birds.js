import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createBirdsSystem(rng) {
  const group = new THREE.Group();
  group.name = 'birds';
  const birds = [];
  const count = CONFIG.life.birdCount;

  for (let i = 0; i < count; i++) {
    const bird = makeBird();
    const path = {
      centerX: (rng() - 0.5) * 200,
      centerZ: (rng() - 0.5) * 200,
      radius: 55 + rng() * 90,
      altitude: 45 + rng() * 30,
      speed: (0.06 + rng() * 0.1) * (rng() < 0.5 ? -1 : 1),
      phase: rng() * Math.PI * 2,
      wobble: 1 + rng() * 3,
      wingPhase: rng() * Math.PI * 2,
      wingFreq: 3 + rng() * 2,
    };
    birds.push({ bird, path });
    group.add(bird);
  }

  return {
    group,
    update: (dt, elapsed) => {
      for (const { bird, path } of birds) {
        const a = elapsed * path.speed + path.phase;
        const x = path.centerX + Math.cos(a) * path.radius;
        const z = path.centerZ + Math.sin(a) * path.radius;
        const y = path.altitude + Math.sin(elapsed * 0.6 + path.phase) * path.wobble;
        bird.position.set(x, y, z);
        const aNext = a + 0.04 * Math.sign(path.speed);
        bird.lookAt(
          path.centerX + Math.cos(aNext) * path.radius,
          y,
          path.centerZ + Math.sin(aNext) * path.radius,
        );
        const flap = Math.sin(elapsed * path.wingFreq + path.wingPhase) * 0.55;
        bird.userData.leftWing.rotation.z = flap;
        bird.userData.rightWing.rotation.z = -flap;
      }
    },
  };
}

function makeBird() {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x2a2521 });
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0,   0, 0,
    0.7, 0, -0.3,
    0.5, 0,  0.3,
  ]), 3));
  wingGeo.computeVertexNormals();

  const leftWing = new THREE.Mesh(wingGeo, mat);
  const rightWing = new THREE.Mesh(wingGeo, mat);
  rightWing.scale.x = -1;
  group.add(leftWing);
  group.add(rightWing);
  group.userData.leftWing = leftWing;
  group.userData.rightWing = rightWing;
  return group;
}
