import * as THREE from 'three';
import { CONFIG } from './config.js';
import { createRNG } from './utils/rng.js';
import { createRenderer } from './scene/renderer.js';
import { createCamera } from './scene/camera.js';
import { setupAtmosphere } from './scene/atmosphere.js';
import { createLighting } from './scene/lighting.js';
import { createTerrain } from './scene/terrain.js';
import { createComposer } from './scene/post.js';
import { generateLayout } from './procedural/layout.js';
import { buildRoadsAndPaths } from './procedural/roads.js';
import { buildWalls } from './procedural/walls.js';
import { placeBuildings } from './procedural/buildings.js';
import { placeVegetation } from './procedural/vegetation.js';
import { placeProps } from './procedural/props.js';
import { createSwaySystem } from './life/sway.js';
import { createBirdsSystem } from './life/birds.js';
import { createCloudsSystem } from './life/clouds.js';
import { createVehiclesSystem } from './life/vehicles.js';
import { createFlythrough } from './life/flythrough.js';
import { DayNightSystem } from './life/day-night.js';
import { BuildingPopup } from './ui/building-popup.js';

export class App {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.renderer = createRenderer(container);

    const { camera, controls } = createCamera(this.renderer);
    this.camera = camera;
    this.controls = controls;

    this.clock = new THREE.Clock();
    this.updatables = [];

    setupAtmosphere(this.scene);
    this.lights = createLighting(this.scene);

    const rng = createRNG(CONFIG.seed);

    const { mesh: terrain, sampleHeight } = createTerrain();
    this.scene.add(terrain);
    this.sampleHeight = sampleHeight;

    this.layout = generateLayout(rng);
    this.scene.add(buildRoadsAndPaths(this.layout, sampleHeight));
    this.scene.add(buildWalls(this.layout, sampleHeight));

    this.buildings = placeBuildings(this.layout, sampleHeight, rng);
    this.scene.add(this.buildings);

    const veg = placeVegetation(this.layout, sampleHeight, rng);
    this.scene.add(veg.group);

    const props = placeProps(this.layout, sampleHeight, rng);
    this.scene.add(props);

    const lamps = [];
    props.traverse((obj) => {
      if (obj.userData?.kind === 'lamp') lamps.push(obj);
    });

    this.lights.sun.target.position.set(0, 0, 0);
    this.lights.sun.target.updateMatrixWorld();

    this.updatables.push(createSwaySystem(veg.trees));

    const birds = createBirdsSystem(rng);
    this.scene.add(birds.group);
    this.updatables.push(birds.update);

    const clouds = createCloudsSystem(rng);
    this.scene.add(clouds.group);
    this.updatables.push(clouds.update);

    const vehicles = createVehiclesSystem(this.layout, sampleHeight, rng);
    this.scene.add(vehicles.group);
    this.updatables.push(vehicles.update);

    this.updatables.push(this.makeSunArc());

    this.updatables.push(createFlythrough(this.camera, this.controls));

    this.popup = new BuildingPopup(this.camera);
    this.updatables.push(() => this.popup.update());
    this.setupInteraction();

    this.dayNight = new DayNightSystem(this.scene, this.lights, lamps);
    this.setupNightToggle();

    this.composer = createComposer(this.renderer, this.scene, this.camera);

    window.addEventListener('resize', this.onResize);
  }

  setupNightToggle() {
    const btn = document.getElementById('night-toggle');
    if (!btn) return;
    const label = btn.querySelector('.label');
    btn.dataset.mode = 'day';
    btn.addEventListener('click', () => {
      this.dayNight.toggle();
      const isNight = this.dayNight.isNight;
      btn.dataset.mode = isNight ? 'night' : 'day';
      if (label) label.textContent = isNight ? 'Day mode' : 'Night mode';
    });
  }

  setupInteraction() {
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const canvas = this.renderer.domElement;
    let downX = 0, downY = 0, downT = 0;

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
    });

    canvas.addEventListener('pointerup', (e) => {
      if (e.button !== 0) return;
      const elapsed = performance.now() - downT;
      if (elapsed > 350) return;
      if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) return;

      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, this.camera);
      const hits = raycaster.intersectObject(this.buildings, true);
      if (hits.length === 0) {
        this.popup.hide();
        return;
      }
      let obj = hits[0].object;
      while (obj && !obj.userData?.info) obj = obj.parent;
      if (obj) this.popup.show(obj);
      else this.popup.hide();
    });
  }

  makeSunArc() {
    const start = this.lights.sun.position.clone();
    const radius = Math.hypot(start.x, start.z);
    const baseAngle = Math.atan2(start.z, start.x);
    const sun = this.lights.sun;
    return (dt, elapsed) => {
      const ang = baseAngle + Math.sin(elapsed * 0.012) * 0.15;
      sun.position.set(Math.cos(ang) * radius, start.y, Math.sin(ang) * radius);
    };
  }

  onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h);
  };

  start() {
    this.renderer.setAnimationLoop(this.tick);
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  tick = () => {
    const dt = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;
    for (const u of this.updatables) u(dt, elapsed);
    this.controls.update();
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  };
}
