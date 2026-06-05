import * as THREE from 'three';
import { CONFIG } from '../config.js';

// ============================================================================
//  Lighting
// ----------------------------------------------------------------------------
//  Three lights total:
//    1. Hemisphere — sky colour from above, ground colour from below.
//       Drives the soft top-vs-bottom shading that makes everything feel
//       "outdoors". Cheap, no shadow cost.
//    2. Ambient    — flat fill so even unlit faces aren't black.
//    3. Directional sun — single soft key light. Casts shadows but ONLY
//       cloud meshes have castShadow=true (see applyShadowPolicy in app.js),
//       so the only thing in the shadow map is the moving cloud silhouette.
//
//  TEMPERATURE TUNING
//  ------------------
//  Colours are pulled from CONFIG.palette in src/config.js — change them
//  there (search for "skyTop", "skyHorizon", "foliageDeep", "sun"). Hex
//  reference:
//      warm gold dusk:  #ffd9a8 #f3cda1
//      cool dawn:       #cfd9f0 #b6c6df
//      overcast midday: #e8e8e0 #d8d4c8
//      moonlit:         #5e6f9c #2a3552
//  Intensities live in CONFIG.lighting — lower numbers = dimmer scene.
// ============================================================================

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
  // Shadow map size — only the clouds write into it now, so we can keep
  // this small.
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 2;
  scene.add(sun);
  scene.add(sun.target);

  return { sun, hemi, ambient };
}
