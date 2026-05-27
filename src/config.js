import * as THREE from 'three';

export const CONFIG = {
  seed: 1337,

  world: {
    terrainSize: 2000,
    terrainSegments: 192,
    campusRadius: 110,
    outerFadeStart: 230,
  },

  palette: {
    skyTop: new THREE.Color('#e9d8b4'),
    skyHorizon: new THREE.Color('#f3cda1'),
    fog: new THREE.Color('#f4d2a5'),
    grass: new THREE.Color('#b8c270'),
    grassDry: new THREE.Color('#d6c682'),
    path: new THREE.Color('#e6d2a7'),
    road: new THREE.Color('#52524c'),
    soil: new THREE.Color('#a08664'),
    foliage: new THREE.Color('#7ea25b'),
    foliageDeep: new THREE.Color('#52723c'),
    trunk: new THREE.Color('#5a3d29'),
    building: [
      new THREE.Color('#e7d4b6'),
      new THREE.Color('#d2bfa0'),
      new THREE.Color('#bfac8a'),
      new THREE.Color('#c69b76'),
    ],
    roof: [
      new THREE.Color('#7b8a6e'),
      new THREE.Color('#8a6f59'),
      new THREE.Color('#5e6a55'),
    ],
    metal: new THREE.Color('#4f4a44'),
    sun: new THREE.Color('#ffd9a8'),
  },

  fog: {
    density: 0.001,
  },

  life: {
    birdCount: 12,
    walkerCount: 18,
    vehicleCount: 6,
  },

  lighting: {
    sunIntensity: 2.6,
    ambientIntensity: 0.35,
    hemiSkyIntensity: 0.6,
    sunPosition: new THREE.Vector3(120, 95, 60),
  },

  bloom: {
    strength: 0.32,
    radius: 0.8,
    threshold: 0.85,
  },

  camera: {
    fov: 38,
    near: 1,
    far: 1500,
    initialPosition: new THREE.Vector3(150, 95, 175),
    target: new THREE.Vector3(0, 4, 0),
    minDistance: 40,
    maxDistance: 360,
    minPolar: 0.15,
    maxPolar: Math.PI * 0.46,
    damping: 0.075,
  },

  vegetation: {
    treeCount: 200,
    shrubCount: 320,
    grassPatchCount: 2400,
  },

  props: {
    lampSpacing: 16,
    benchCount: 14,
    signCount: 8,
    poleCount: 22,
  },

  buildings: {
    lots: 7,
  },
};
