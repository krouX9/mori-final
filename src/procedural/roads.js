import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function buildRoadsAndPaths(layout, sampleHeight) {
  const group = new THREE.Group();
  group.name = 'paths-and-roads';

  const pathMat = new THREE.MeshStandardMaterial({
    color: CONFIG.palette.path,
    roughness: 0.95,
  });
  const roadMat = new THREE.MeshStandardMaterial({
    color: CONFIG.palette.road,
    roughness: 0.9,
  });

  // NB: layout.walkways is no longer rendered here. It's populated from the
  // drawn paths (corrected.json + localStorage) so that lamps, shrubs and
  // the isOccupied tests can use the same segment data, but the actual
  // ribbon meshes come from buildCustomPathsGroup (smooth CatmullRom). If
  // we rendered them here too we'd get visible double-paths in the scene.
  for (const r of layout.roads) {
    const seg = makeSegment(r.a, r.b, r.width, roadMat, sampleHeight, 0.1);
    if (seg) group.add(seg);
  }
  if (layout.plazas) {
    for (const p of layout.plazas) {
      if (p.r < 0.1) continue;
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(p.r, 32),
        pathMat,
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(p.x, sampleHeight(p.x, p.z) + 0.07, p.z);
      disc.receiveShadow = true;
      group.add(disc);
    }
  }
  return group;
}

function makeSegment(a, b, width, mat, sampleHeight, yOffset) {
  const ax = a.x, az = a.y;
  const bx = b.x, bz = b.y;
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return null;
  const angle = Math.atan2(dz, dx);

  const geo = new THREE.PlaneGeometry(len, width);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  const midX = (ax + bx) / 2;
  const midZ = (az + bz) / 2;
  mesh.position.set(midX, sampleHeight(midX, midZ) + yOffset, midZ);
  mesh.rotation.y = -angle;
  mesh.receiveShadow = true;
  return mesh;
}
