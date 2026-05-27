import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from '../config.js';

export function createCamera(renderer) {
  const c = CONFIG.camera;
  const camera = new THREE.PerspectiveCamera(
    c.fov,
    window.innerWidth / window.innerHeight,
    c.near,
    c.far,
  );
  camera.position.copy(c.initialPosition);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(c.target);
  controls.enableDamping = true;
  controls.dampingFactor = c.damping;
  controls.minDistance = c.minDistance;
  controls.maxDistance = c.maxDistance;
  controls.minPolarAngle = c.minPolar;
  controls.maxPolarAngle = c.maxPolar;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.6;
  controls.update();

  return { camera, controls };
}
