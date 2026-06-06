import * as THREE from 'three';

// ============================================================================
//  Drone-style intro camera sweep
// ----------------------------------------------------------------------------
//  On first load the camera starts high + far from the campus, then eases
//  into the overview pose over INTRO_DURATION seconds. While the sweep is
//  active OrbitControls is disabled so the user can't fight it; it
//  re-enables when the sweep lands.
// ============================================================================

const INTRO_DURATION = 4.0;

export class CameraIntro {
  constructor(camera, controls, finalPos, finalTarget) {
    this.camera = camera;
    this.controls = controls;
    this.t = 0;
    this.duration = INTRO_DURATION;

    this.endPos = finalPos.clone();
    this.endTarget = finalTarget.clone();

    // Start: much higher, farther, slightly past the target so the camera
    // appears to swoop in and arc over the campus.
    const reach = finalPos.distanceTo(finalTarget);
    const dir = new THREE.Vector3().subVectors(finalPos, finalTarget).normalize();
    this.startPos = finalTarget.clone()
      .addScaledVector(dir, reach * 2.4)
      .add(new THREE.Vector3(0, reach * 0.9, 0));
    this.startTarget = finalTarget.clone();

    camera.position.copy(this.startPos);
    controls.target.copy(this.startTarget);
    controls.enabled = false;
    controls.update();

    this.active = true;
    this.onComplete = null;
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    const p = Math.min(1, this.t / this.duration);
    // Ease-out quint — fast descent that settles slowly.
    const e = 1 - Math.pow(1 - p, 5);
    this.camera.position.lerpVectors(this.startPos, this.endPos, e);
    this.controls.target.lerpVectors(this.startTarget, this.endTarget, e);
    if (p >= 1) {
      this.active = false;
      this.controls.enabled = true;
      if (this.onComplete) this.onComplete();
    }
  }

  skip() {
    this.t = this.duration;
    this.update(0);
  }
}
