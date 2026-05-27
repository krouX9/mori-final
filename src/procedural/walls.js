import * as THREE from 'three';

export function buildWalls(layout, sampleHeight) {
  const group = new THREE.Group();
  group.name = 'walls';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c9b594'),
    roughness: 1.0,
  });
  const pillarMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ad8f64'),
    roughness: 1.0,
  });

  const wallH = 1.8;
  const wallT = 0.4;
  const segsPerSide = 8;
  const pillarSpacing = 14;
  const pillarH = wallH + 0.7;

  for (const side of layout.walls) {
    const dx = side.b.x - side.a.x;
    const dz = side.b.y - side.a.y;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);

    for (let i = 0; i < segsPerSide; i++) {
      const t0 = i / segsPerSide;
      const t1 = (i + 1) / segsPerSide;
      const ax = side.a.x + dx * t0;
      const az = side.a.y + dz * t0;
      const bx = side.a.x + dx * t1;
      const bz = side.a.y + dz * t1;
      const segLen = Math.hypot(bx - ax, bz - az);
      const midX = (ax + bx) / 2;
      const midZ = (az + bz) / 2;

      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(segLen + 0.04, wallH, wallT),
        stoneMat,
      );
      wall.position.set(midX, sampleHeight(midX, midZ) + wallH / 2 + 0.1, midZ);
      wall.rotation.y = -angle;
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);
    }

    const pillarCount = Math.max(1, Math.floor(len / pillarSpacing));
    for (let i = 0; i < pillarCount; i++) {
      const t = i / pillarCount;
      const px = side.a.x + dx * t;
      const pz = side.a.y + dz * t;
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, pillarH, 0.75),
        pillarMat,
      );
      pillar.position.set(px, sampleHeight(px, pz) + pillarH / 2 + 0.1, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);
    }
  }

  return group;
}
