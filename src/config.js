import * as THREE from 'three';

export const CONFIG = {
  seed: 1337,

  world: {
    terrainSize: 2400,
    terrainSegments: 200,
    campusRadius: 170,
    outerFadeStart: 300,
  },

  // ------------------------------------------------------------------------
  // Palette
  //   Edit any colour to retune the scene. These flow into:
  //     • the hemisphere/ambient/sun lights (skyTop, skyHorizon, sun)
  //     • the skydome gradient (skyTop → skyHorizon)
  //     • the terrain vertex colours (grass, grassDry, soil, skyHorizon
  //       blend at the horizon — no fog any more, see terrain.js).
  //   For overall warm/cool feel, change skyTop + skyHorizon + sun.
  // ------------------------------------------------------------------------
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
    birdCount: 20,
    walkerCount: 0,
    vehicleCount: 0,
  },

  // ------------------------------------------------------------------------
  // Texture paths (relative to Vite base — drop files in public/textures/).
  //   The terrain and each zone type try to load these on init. If a file
  //   is missing, the load fails silently and we fall back to the vertex
  //   colour / flat colour that was rendering before.
  //
  //   Recommended files (seamless tileable JPGs, 512–1024 px):
  //     public/textures/grass.jpg       — terrain ground tint
  //     public/textures/garden.jpg      — Garden zone
  //     public/textures/playground.jpg  — Playground zone
  //     public/textures/assembly.jpg    — Assembly zone
  //
  //   Adjust the `repeat` values to control how many tiles fit across the
  //   surface (higher = more tiling = finer detail).
  // ------------------------------------------------------------------------
  textures: {
    grass:          { url: 'textures/grass.jpg',      repeat: 60 },
    garden:         { url: 'textures/garden.jpg',     repeat: 8  },
    playground:     { url: 'textures/playground.jpg', repeat: 6  },
    assembly:       { url: 'textures/assembly.jpg',   repeat: 4  },
    // Path textures — drop files at the same place and they'll tile.
    pedestrianPath: { url: 'textures/pedestrian.jpg', repeat: 1.6 },
    roadPath:       { url: 'textures/road.jpg',       repeat: 4   },
  },

  // Solid colour for terrain OUTSIDE the boundary wall. No texture is applied
  // there — it's a flat tint so the campus sits on a clean coloured field.
  outsideColor: new THREE.Color('#9d8eb8'),

  lighting: {
    sunIntensity: 2.6,
    ambientIntensity: 0.35,
    hemiSkyIntensity: 0.6,
    sunPosition: new THREE.Vector3(180, 140, 90),
  },

  bloom: {
    strength: 0.32,
    radius: 0.8,
    threshold: 0.85,
  },

  camera: {
    fov: 38,
    near: 1,
    far: 1800,
    initialPosition: new THREE.Vector3(220, 150, 260),
    target: new THREE.Vector3(0, 4, 0),
    minDistance: 40,
    maxDistance: 520,
    minPolar: 0.15,
    maxPolar: Math.PI * 0.46,
    damping: 0.075,
  },

  vegetation: {
    treeCount: 120,
    shrubCount: 180,
  },

  props: {
    lampSpacing: 18,
    benchCount: 14,
    signCount: 10,
    poleCount: 22,
  },
};
