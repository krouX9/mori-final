import * as THREE from 'three';
import { CONFIG } from '../config.js';

// ============================================================================
//  Birds — single coordinated flock with a swaying flight path
// ----------------------------------------------------------------------------
//  One virtual "flock centre" sweeps a large circle around the campus. Layered
//  on top of that path are two slow sine waves — radial (pulses in/out) and
//  vertical (rises/falls) — that produce a majestic undulating motion.
//
//  Each bird has a fixed formation offset relative to the flock centre's
//  forward / right / up axes, so the flock holds shape while drifting. The
//  offsets are distributed in a loose cluster, not a strict V, to read as
//  organic instead of marching.
//
//  Per frame the only work is: build the orientation matrix once, then for
//  each bird write a position + heading. Cheap on mobile.
// ============================================================================

const FLOCK_RADIUS    = 220;   // base radius of orbit (m)
const FLOCK_ALT       = 90;    // base altitude (m)
const ORBIT_SPEED     = 0.04;  // rad/sec — slow, majestic
const RADIAL_SWAY_AMP = 18;    // metres in / out
const RADIAL_SWAY_FREQ = 0.07;
const VERTICAL_SWAY_AMP = 7;
const VERTICAL_SWAY_FREQ = 0.11;

const FORMATION_FWD   = 28;    // metres of spread front-to-back in formation
const FORMATION_RIGHT = 36;    // metres of spread left-to-right
const FORMATION_UP    = 10;    // metres of spread up-down

// Reusable scratch vectors — zero allocation in the hot loop.
const _fwd   = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up    = new THREE.Vector3(0, 1, 0);
const _worldOffset = new THREE.Vector3();
const _lookTarget  = new THREE.Vector3();

export function createBirdsSystem(rng) {
  const group = new THREE.Group();
  group.name = 'birds';
  const birds = [];
  const count = CONFIG.life.birdCount;

  for (let i = 0; i < count; i++) {
    const bird = makeBird();
    birds.push({
      bird,
      // Formation offset in flock-local frame (forward, right, up).
      offFwd:   (rng() - 0.5) * FORMATION_FWD,
      offRight: (rng() - 0.5) * FORMATION_RIGHT,
      offUp:    (rng() - 0.5) * FORMATION_UP,
      // Per-bird wing animation params for variety.
      wingPhase: rng() * Math.PI * 2,
      wingFreq:  3.4 + rng() * 1.3,
      bobPhase:  rng() * Math.PI * 2,
    });
    group.add(bird);
  }

  return {
    group,
    update: (dt, elapsed) => {
      // Flock centre on its circular path, with radial + vertical sway.
      const a = elapsed * ORBIT_SPEED;
      const radius = FLOCK_RADIUS + Math.sin(elapsed * RADIAL_SWAY_FREQ) * RADIAL_SWAY_AMP;
      const cx = Math.cos(a) * radius;
      const cz = Math.sin(a) * radius;
      const cy = FLOCK_ALT + Math.sin(elapsed * VERTICAL_SWAY_FREQ) * VERTICAL_SWAY_AMP;

      // Forward = tangent to the circle, right = +90° turned tangent.
      _fwd.set(-Math.sin(a), 0, Math.cos(a));
      _right.set(Math.cos(a), 0, Math.sin(a));

      // A look-ahead point along the path for lookAt (same forward, +10m).
      _lookTarget.set(cx + _fwd.x * 10, cy, cz + _fwd.z * 10);

      for (const b of birds) {
        // World position = flock centre + (fwd × offFwd) + (right × offRight) + (up × offUp)
        _worldOffset
          .copy(_fwd).multiplyScalar(b.offFwd)
          .addScaledVector(_right, b.offRight)
          .addScaledVector(_up, b.offUp + Math.sin(elapsed * 0.6 + b.bobPhase) * 0.6);
        b.bird.position.set(
          cx + _worldOffset.x,
          cy + _worldOffset.y,
          cz + _worldOffset.z,
        );
        // All birds face the same direction (parallel formation).
        b.bird.lookAt(
          _lookTarget.x + _worldOffset.x,
          _lookTarget.y + _worldOffset.y,
          _lookTarget.z + _worldOffset.z,
        );
        // Wing flap.
        const flap = Math.sin(elapsed * b.wingFreq + b.wingPhase) * 0.55;
        b.bird.userData.leftWing.rotation.z = flap;
        b.bird.userData.rightWing.rotation.z = -flap;
      }
    },
  };
}

function makeBird() {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x1f1c18 });

  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([
      0,   0, 0,
      0.7, 0, -0.3,
      0.5, 0,  0.3,
    ]), 3),
  );
  wingGeo.computeVertexNormals();

  const leftWing  = new THREE.Mesh(wingGeo, mat);
  const rightWing = new THREE.Mesh(wingGeo, mat);
  rightWing.scale.x = -1;
  group.add(leftWing, rightWing);

  group.userData.leftWing = leftWing;
  group.userData.rightWing = rightWing;
  return group;
}
