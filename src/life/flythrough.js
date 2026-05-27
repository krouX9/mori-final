import * as THREE from 'three';

export function createFlythrough(camera, controls) {
  const waypoints = [
    new THREE.Vector3(160, 55, 145),
    new THREE.Vector3(40, 65, 185),
    new THREE.Vector3(-100, 60, 160),
    new THREE.Vector3(-180, 70, 50),
    new THREE.Vector3(-175, 55, -70),
    new THREE.Vector3(-80, 50, -165),
    new THREE.Vector3(60, 65, -180),
    new THREE.Vector3(170, 60, -75),
    new THREE.Vector3(190, 55, 40),
  ];
  const curve = new THREE.CatmullRomCurve3(waypoints, true, 'centripetal');
  const targetWaypoints = waypoints.map((p) =>
    new THREE.Vector3(p.x * 0.18, 8, p.z * 0.18),
  );
  const targetCurve = new THREE.CatmullRomCurve3(targetWaypoints, true, 'centripetal');

  const state = { active: false, t: 0, speed: 0.018 };
  const tmpPos = new THREE.Vector3();
  const tmpTarget = new THREE.Vector3();

  const toggle = () => {
    state.active = !state.active;
    controls.enabled = !state.active;
    if (!state.active) {
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      controls.target.copy(camera.position).add(forward.multiplyScalar(60));
      controls.update();
    }
  };

  window.addEventListener('keydown', (e) => {
    if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey) {
      toggle();
    }
  });

  return (dt) => {
    if (!state.active) return;
    state.t = (state.t + state.speed * dt) % 1;
    curve.getPointAt(state.t, tmpPos);
    targetCurve.getPointAt((state.t + 0.04) % 1, tmpTarget);
    camera.position.lerp(tmpPos, Math.min(1, dt * 4));
    controls.target.lerp(tmpTarget, Math.min(1, dt * 4));
    camera.lookAt(controls.target);
  };
}
