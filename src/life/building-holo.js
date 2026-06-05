import * as THREE from 'three';

// ============================================================================
//  Holographic highlight effect
// ----------------------------------------------------------------------------
//  Swaps every mesh in the selected building's material for a single shared
//  ShaderMaterial that draws three layered effects:
//
//    1. BASE TINT      uColor × 0.4  — flat low-opacity cyan body
//    2. RIM / FRESNEL  pow(1 - dot(N, V), 2.4) painted in uFresnelColor.
//                      Brightest where the surface faces away from camera,
//                      i.e. along silhouettes. This is the "edge glow".
//    3. SWEEP BEAM     a single bright band at y = mod(uTime*uBeamSpeed,
//                      uBeamRange) with smoothstep falloff over uBeamWidth.
//                      This is the "light bar climbing up the building".
//
//  Final fragment is the sum of all three; alpha is uOpacity + fresnel + beam
//  clamped to [0.18, 1.0] so the surface never disappears nor goes fully
//  opaque.
//
//  TUNING GUIDE
//  ------------
//  uColor          base cyan/blue tint. 0x3aa8e0 is a soft cyan; warmer
//                  hex like 0xff8a5b will make it look like a fire scan.
//  uFresnelColor   colour of BOTH the rim and the beam. 0x9fefff is icy
//                  cyan. Try 0xffffff for white, 0xff66cc for pink, etc.
//  uOpacity        floor opacity of the body before fresnel/beam add. 0.15
//                  reads as nearly invisible; 0.4 reads as solid glass.
//  uBeamSpeed      metres/sec the beam climbs at (default 4.0 → 5s to clear
//                  a 20m building). Slower = more dramatic.
//  uBeamWidth      metres tall the band is. 0.4 is thin; 1.5 is a wide
//                  sweep; 5+ becomes more like a wash.
//  uBeamRange      metres of travel before the beam wraps. Should be at
//                  least 1m taller than your tallest building so the snap
//                  happens off-model (default 30).
//  Fresnel exponent (the `2.4` in the shader) — higher = thinner rim,
//  lower = wider rim. Hand-edit in the fragment shader if you want.
// ============================================================================

const vertexShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>

varying vec3 vViewNormal;
varying vec3 vViewToCam;
varying vec3 vLocalPos;

void main() {
  vec4 viewPos = modelViewMatrix * vec4(position, 1.0);
  vViewNormal  = normalize(normalMatrix * normal);
  vViewToCam   = normalize(-viewPos.xyz);
  vLocalPos    = position;
  gl_Position  = projectionMatrix * viewPos;

  #include <logdepthbuf_vertex>
}
`;

const fragmentShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>

uniform float uTime;
uniform vec3  uColor;
uniform vec3  uFresnelColor;
uniform float uOpacity;
uniform float uBeamSpeed;
uniform float uBeamWidth;
uniform float uBeamRange;

varying vec3 vViewNormal;
varying vec3 vViewToCam;
varying vec3 vLocalPos;

void main() {
  #include <logdepthbuf_fragment>

  // -------- 1. RIM / FRESNEL --------
  // Dot product between the surface normal and the view direction. 1.0 means
  // we're looking straight at the surface, 0.0 means we're skimming it.
  // (1 - dot)^N inverts that and biases toward edges; higher N = thinner rim.
  float ndotv   = max(0.0, dot(normalize(vViewNormal), normalize(vViewToCam)));
  float fresnel = pow(1.0 - ndotv, 2.4);

  // -------- 2. SWEEP BEAM --------
  // Move a marker up the Y axis at uBeamSpeed metres/sec, wrap every
  // uBeamRange metres. smoothstep falls off symmetrically over uBeamWidth.
  float beamY    = mod(uTime * uBeamSpeed, uBeamRange);
  float beamDist = abs(vLocalPos.y - beamY);
  float beam     = smoothstep(uBeamWidth, 0.0, beamDist);

  // -------- 3. COMPOSE --------
  vec3 base = uColor * 0.4;
  vec3 rim  = uFresnelColor * fresnel;
  vec3 sweep = uFresnelColor * beam * 1.5;
  vec3 color = base + rim + sweep;

  float alpha = uOpacity + fresnel * 0.55 + beam * 0.55;
  alpha = clamp(alpha, 0.18, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

export class HoloEffect {
  constructor({
    color        = 0x3aa8e0,
    fresnelColor = 0x9fefff,
    opacity      = 0.22,
    beamSpeed    = 4.0,
    beamWidth    = 0.4,
    beamRange    = 30.0,
  } = {}) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime:         { value: 0 },
        uColor:        { value: new THREE.Color(color) },
        uFresnelColor: { value: new THREE.Color(fresnelColor) },
        uOpacity:      { value: opacity },
        uBeamSpeed:    { value: beamSpeed },
        uBeamWidth:    { value: beamWidth },
        uBeamRange:    { value: beamRange },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    this.activeBuilding = null;
  }

  activate(building) {
    if (this.activeBuilding === building) return;
    if (this.activeBuilding) this.deactivate(this.activeBuilding);
    this.activeBuilding = building || null;
    if (!building) return;
    building.traverse((c) => {
      if (!c.isMesh) return;
      if (!c.userData._holoOriginal) c.userData._holoOriginal = c.material;
      c.material = this.material;
    });
  }

  deactivate(building) {
    if (!building) return;
    if (this.activeBuilding === building) this.activeBuilding = null;
    building.traverse((c) => {
      if (!c.isMesh) return;
      if (c.userData._holoOriginal) c.material = c.userData._holoOriginal;
    });
  }

  clear() {
    if (this.activeBuilding) this.deactivate(this.activeBuilding);
  }

  update(dt, elapsed) {
    this.material.uniforms.uTime.value = elapsed;
  }
}
