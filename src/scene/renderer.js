import * as THREE from 'three';

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    // Logarithmic depth eliminates the z-fighting that becomes obvious now
    // there's no fog to mask precision loss at distance. Slight perf cost
    // (per-fragment gl_FragDepth write) but worth it across 1m→1500m far.
    logarithmicDepthBuffer: true,
  });
  // Capped at 1.5× — main + bloom + shadow render-targets all scale with this.
  // Going from 2× to 1.5× is roughly a 44% reduction in render-target memory.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  return renderer;
}
