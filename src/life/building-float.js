// ============================================================================
//  Building float — rise + hover + slow rotation for the focused building
// ----------------------------------------------------------------------------
//  No more holo shader. The selected building simply:
//    1. Lerps upward from its baseline to LIFT_HEIGHT
//    2. Rotates around Y at ROT_SPEED rad/sec while floating
//    3. Adds a soft sinusoidal hover bob layered on top of the lift
//
//  When the focus clears it lerps back to the baseline and the accumulated
//  rotation gracefully decays so the building lands facing the same way it
//  started.
// ============================================================================

const LIFT_HEIGHT = 3.5;   // metres of rise above the ground
const ROT_SPEED   = 0.4;   // rad/sec while floating (~23°/sec)
const BOB_AMP     = 0.35;  // metres of vertical hover
const BOB_FREQ    = 1.0;   // Hz-ish, scaled with lift so it eases in
const LERP_SPEED  = 3.0;   // exponential approach rate for lift

export class BuildingFloat {
  constructor(buildings) {
    this.buildings = buildings;
    this.activeBuilding = null;
    this.state = new Map();

    for (const b of buildings.children) {
      this.state.set(b, {
        baseY: b.position.y,
        baseRotY: b.rotation.y,
        lift: 0,
        targetLift: 0,
        rotOffset: 0,
        active: false,
      });
    }
  }

  /** Re-capture base transforms (call after dev-mode override edits). */
  syncBase() {
    for (const b of this.buildings.children) {
      const s = this.state.get(b);
      if (!s) continue;
      s.baseY = b.position.y - s.lift;
      s.baseRotY = b.rotation.y - s.rotOffset;
    }
  }

  setActive(building) {
    if (this.activeBuilding === building) return;
    if (this.activeBuilding) {
      const prev = this.state.get(this.activeBuilding);
      if (prev) { prev.targetLift = 0; prev.active = false; }
    }
    this.activeBuilding = building || null;
    if (building) {
      const s = this.state.get(building);
      if (s) { s.targetLift = LIFT_HEIGHT; s.active = true; }
    }
  }

  clear() { this.setActive(null); }

  update(dt, elapsed) {
    const lerp = Math.min(1, dt * LERP_SPEED);
    for (const b of this.buildings.children) {
      const s = this.state.get(b);
      if (!s) continue;

      s.lift += (s.targetLift - s.lift) * lerp;

      if (s.active) {
        s.rotOffset += dt * ROT_SPEED;
      } else if (s.lift < 0.05) {
        // Ease accumulated rotation back to zero once we've nearly settled.
        s.rotOffset *= Math.max(0, 1 - lerp * 1.8);
      }

      const bob = s.lift > 0.4
        ? Math.sin(elapsed * BOB_FREQ * 2 * Math.PI / 6) * BOB_AMP * (s.lift / LIFT_HEIGHT)
        : 0;

      b.position.y = s.baseY + s.lift + bob;
      b.rotation.y = s.baseRotY + s.rotOffset;
    }
  }
}
