import * as THREE from 'three';
import { range } from '../utils/rng.js';

export function createCloudsSystem(rng, count = 2) {
  const group = new THREE.Group();
  group.name = 'clouds';

  const clouds = [];
  for (let i = 0; i < count; i++) {
    const cloud = makeCloud(rng);
    clouds.push({
      mesh: cloud,
      speed: 0,
      idleRemaining: i === 0 ? 0 : 18,
      active: i === 0,
    });
    spawnCloud(clouds[i], rng);
    cloud.visible = clouds[i].active;
    group.add(cloud);
  }

  return {
    group,
    update: (dt) => {
      for (const c of clouds) {
        if (!c.active) {
          c.idleRemaining -= dt;
          if (c.idleRemaining <= 0) spawnCloud(c, rng);
          continue;
        }
        c.mesh.position.x += c.speed * dt;
        if (c.mesh.position.x > 260) {
          c.active = false;
          c.mesh.visible = false;
          c.idleRemaining = range(rng, 26, 48);
        }
      }
    },
  };
}

function spawnCloud(c, rng) {
  c.mesh.position.set(
    -260 - rng() * 80,
    range(rng, 78, 102),
    range(rng, -180, 180),
  );
  c.speed = range(rng, 6, 9);
  c.active = true;
  c.mesh.visible = true;
}

function makeCloud(rng) {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
    emissive: 0xfff1d8,
    emissiveIntensity: 0.14,
  });
  const blobCount = 5 + Math.floor(rng() * 3);
  for (let i = 0; i < blobCount; i++) {
    const r = 6 + rng() * 5;
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), cloudMat);
    blob.position.set(
      (i - blobCount * 0.5) * 5.5 + (rng() - 0.5) * 4,
      (rng() - 0.5) * 3,
      (rng() - 0.5) * 7,
    );
    blob.castShadow = true;
    blob.receiveShadow = false;
    group.add(blob);
  }
  return group;
}
