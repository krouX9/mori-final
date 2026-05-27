import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { range, pick } from '../utils/rng.js';

const matCache = new Map();
function mat(color, opts = {}) {
  const key = color.getHexString() + '|' + (opts.roughness ?? 0.9) + '|' + (opts.metalness ?? 0) + '|' + (opts.flatShading ?? false) + '|' + (opts.emissive?.getHexString() ?? '') + '|' + (opts.emissiveIntensity ?? 0);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.9,
    metalness: opts.metalness ?? 0.0,
    flatShading: opts.flatShading ?? false,
    emissive: opts.emissive,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
  matCache.set(key, m);
  return m;
}

const P = CONFIG.palette;

export function makeTree(rng = Math.random) {
  const group = new THREE.Group();
  const height = range(rng, 4.5, 8.5);
  const trunkH = height * range(rng, 0.32, 0.45);
  const trunkR = range(rng, 0.18, 0.32);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkR * 0.75, trunkR, trunkH, 7),
    mat(P.trunk, { roughness: 1 }),
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const foliageColor = P.foliage.clone().lerp(P.foliageDeep, rng() * 0.45);
  const foliageMat = mat(foliageColor, { flatShading: true });
  const clusters = 2 + Math.floor(rng() * 3);
  const top = trunkH + (height - trunkH) * 0.3;
  for (let i = 0; i < clusters; i++) {
    const r = range(rng, 1.3, 2.4);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), foliageMat);
    mesh.position.set(
      range(rng, -0.7, 0.7),
      top + range(rng, -0.3, 1.3),
      range(rng, -0.7, 0.7),
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.kind = 'tree';
  return group;
}

export function makeShrub(rng = Math.random) {
  const group = new THREE.Group();
  const color = P.foliage.clone().lerp(P.foliageDeep, 0.2 + rng() * 0.4);
  const m = mat(color, { flatShading: true });
  const clusters = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < clusters; i++) {
    const r = range(rng, 0.5, 1.1);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m);
    mesh.position.set(range(rng, -0.5, 0.5), r * 0.6, range(rng, -0.5, 0.5));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.userData.kind = 'shrub';
  return group;
}

export function makeLamp() {
  const group = new THREE.Group();
  const metalMat = mat(P.metal);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8), metalMat);
  pole.position.y = 2.1;
  pole.castShadow = true;
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.08), metalMat);
  arm.position.set(0.3, 4.05, 0);
  group.add(arm);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), metalMat);
  head.position.set(0.55, 3.95, 0);
  head.castShadow = true;
  group.add(head);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 8),
    mat(new THREE.Color('#fff1c0'), {
      emissive: new THREE.Color('#ffd28a'),
      emissiveIntensity: 1.4,
      roughness: 0.4,
    }),
  );
  bulb.position.set(0.55, 3.78, 0);
  group.add(bulb);

  group.userData.kind = 'lamp';
  group.userData.bulbMesh = bulb;
  return group;
}

export function makeBench() {
  const group = new THREE.Group();
  const wood = mat(new THREE.Color('#7a5a3a'));
  const metalMat = mat(P.metal);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.6), wood);
  seat.position.y = 0.55;
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 0.1), wood);
  back.position.set(0, 0.85, -0.25);
  back.castShadow = true;
  group.add(back);

  for (const x of [-1.0, 1.0]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.5), metalMat);
    leg.position.set(x, 0.27, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  group.userData.kind = 'bench';
  return group;
}

export function makePole() {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), mat(P.metal));
  pole.position.y = 1.6;
  pole.castShadow = true;
  group.add(pole);
  group.userData.kind = 'pole';
  return group;
}

export function makeSign(rng = Math.random) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.09, 2.4, 6),
    mat(new THREE.Color('#4a3a2c')),
  );
  post.position.y = 1.2;
  post.castShadow = true;
  group.add(post);

  const boardColor = pick(rng, [P.path, new THREE.Color('#cdb787'), new THREE.Color('#a98a5e')]);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.06), mat(boardColor));
  board.position.set(0, 2.1, 0);
  board.castShadow = true;
  group.add(board);

  group.userData.kind = 'sign';
  return group;
}

export function makeBuilding(rng, footprint) {
  const group = new THREE.Group();
  const w = footprint?.w ?? 16;
  const d = footprint?.d ?? 16;
  const stories = 1 + Math.floor(rng() * 3);
  const storyH = range(rng, 3.4, 4.2);
  const totalH = stories * storyH;

  const wallColor = pick(rng, P.building);
  const wallMat = mat(wallColor);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, totalH, d), wallMat);
  body.position.y = totalH / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roofMat = mat(pick(rng, P.roof));
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.45, d + 0.5), roofMat);
  roof.position.y = totalH + 0.22;
  roof.castShadow = true;
  group.add(roof);

  if (rng() < 0.5) {
    const w2 = w * range(rng, 0.35, 0.6);
    const d2 = d * range(rng, 0.35, 0.6);
    const h2 = totalH + range(rng, 1.5, storyH * 1.4);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, d2), wallMat);
    tower.position.set(
      (rng() - 0.5) * (w - w2) * 0.6,
      h2 / 2,
      (rng() - 0.5) * (d - d2) * 0.6,
    );
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const towerRoof = new THREE.Mesh(new THREE.BoxGeometry(w2 + 0.4, 0.4, d2 + 0.4), roofMat);
    towerRoof.position.set(tower.position.x, h2 + 0.2, tower.position.z);
    towerRoof.castShadow = true;
    group.add(towerRoof);
  }

  if (rng() < 0.6) {
    const stepW = Math.min(w * 0.4, 6);
    const steps = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, 0.4, 1.4),
      mat(P.path),
    );
    steps.position.set(0, 0.2, d / 2 + 0.7);
    steps.castShadow = true;
    steps.receiveShadow = true;
    group.add(steps);
  }

  group.userData.kind = 'building';
  group.userData.footprint = { w, d };
  return group;
}
