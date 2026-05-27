import * as THREE from 'three';
import { CONFIG } from '../config.js';

export function createLighting(scene) {
  const cfg = CONFIG.lighting;

  const hemi = new THREE.HemisphereLight(
    CONFIG.palette.skyTop,
    CONFIG.palette.foliageDeep,
    cfg.hemiSkyIntensity,
  );
  hemi.position.set(0, 200, 0);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(CONFIG.palette.skyHorizon, cfg.ambientIntensity);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(CONFIG.palette.sun, cfg.sunIntensity);
  sun.position.copy(cfg.sunPosition);
  sun.castShadow = true;
  const s = 180;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 500;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 2;
  scene.add(sun);
  scene.add(sun.target);

  return { sun, hemi, ambient };
}
