import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { pick } from '../utils/rng.js';

export function createVehiclesSystem(layout, sampleHeight, rng) {
  const group = new THREE.Group();
  group.name = 'vehicles';

  const perim = layout.roads.slice(0, 4);
  let totalLen = 0;
  const segMeta = perim.map((seg) => {
    const len = Math.hypot(seg.b.x - seg.a.x, seg.b.y - seg.a.y);
    const startLen = totalLen;
    totalLen += len;
    return { seg, len, startLen };
  });

  const vehicles = [];
  const count = CONFIG.life.vehicleCount;
  for (let i = 0; i < count; i++) {
    const car = makeCar(rng);
    vehicles.push({
      mesh: car,
      offset: rng() * totalLen,
      speed: 5 + rng() * 4,
      laneOffset: 1.4 + rng() * 0.5,
      wheels: car.userData.wheels,
    });
    group.add(car);
  }

  return {
    group,
    update: (dt) => {
      for (const v of vehicles) {
        v.offset = (v.offset + v.speed * dt) % totalLen;
        let m = segMeta[0];
        for (const meta of segMeta) {
          if (v.offset >= meta.startLen && v.offset < meta.startLen + meta.len) {
            m = meta;
            break;
          }
        }
        const t = (v.offset - m.startLen) / m.len;
        const seg = m.seg;
        const dx = seg.b.x - seg.a.x;
        const dz = seg.b.y - seg.a.y;
        const ux = dx / m.len;
        const uz = dz / m.len;
        const nx = uz;
        const nz = -ux;
        const cx = seg.a.x + dx * t + nx * v.laneOffset;
        const cz = seg.a.y + dz * t + nz * v.laneOffset;
        v.mesh.position.set(cx, sampleHeight(cx, cz) + 0.05, cz);
        v.mesh.rotation.y = -Math.atan2(dz, dx);

        const spin = (v.speed * dt) / 0.24;
        for (const w of v.wheels) w.rotation.z -= spin;
      }
    },
  };
}

function makeCar(rng) {
  const group = new THREE.Group();
  const color = pick(rng, [
    new THREE.Color('#c4665a'),
    new THREE.Color('#4f6b8a'),
    new THREE.Color('#5a7a5a'),
    new THREE.Color('#2a2a2a'),
    new THREE.Color('#cdbf95'),
    new THREE.Color('#7a4f6a'),
    new THREE.Color('#d9a25c'),
  ]);
  const cabinColor = color.clone().multiplyScalar(0.65);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.7, 1.1),
    new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2 }),
  );
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.55, 1.0),
    new THREE.MeshStandardMaterial({ color: cabinColor, roughness: 0.3, metalness: 0.3 }),
  );
  cabin.position.set(-0.15, 1.18, 0);
  cabin.castShadow = true;
  group.add(cabin);

  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.18, 10);
  wheelGeo.rotateX(Math.PI / 2);

  const wheels = [];
  for (const [x, z] of [[-0.8, 0.55], [-0.8, -0.55], [0.8, 0.55], [0.8, -0.55]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(x, 0.24, z);
    w.castShadow = true;
    wheels.push(w);
    group.add(w);
  }
  group.userData.wheels = wheels;

  return group;
}
