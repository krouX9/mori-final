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
import { buildZones } from './procedural/zones.js';
import { placeBuildings } from './procedural/buildings.js';
import { placeVegetation } from './procedural/vegetation.js';
import { placeProps } from './procedural/props.js';
import { buildCustomPathsGroup } from './procedural/path-render.js';
import { createSwaySystem } from './life/sway.js';
import { createBirdsSystem } from './life/birds.js';
import { createCloudsSystem } from './life/clouds.js';
import { createVehiclesSystem } from './life/vehicles.js';
import { createFlythrough } from './life/flythrough.js';
import { DayNightSystem } from './life/day-night.js';
import { BuildingPopup } from './ui/building-popup.js';
import { BuildingModal } from './ui/building-modal.js';
import { GPSController } from './gps/gps-controller.js';
import { ProximityHighlight } from './gps/proximity-highlight.js';
import { BuildingFloat } from './life/building-float.js';
import { BuildingDim } from './life/building-dim.js';
import { CameraIntro } from './scene/camera-intro.js';
import { TourController } from './tour/tour-controller.js';
import { TourAudio } from './tour/tour-audio.js';

// Log-scale slider mapping: slider 0..100 → scale 0.1..50.
// Log mapping gives even precision across the range — 0→0.1, 50→~2.2, 100→50.
const SCALE = (() => {
  const MIN = 0.1;
  const MAX = 50;
  const minL = Math.log10(MIN);
  const maxL = Math.log10(MAX);
  const span = maxL - minL;
  return {
    sliderToScale: (v) => 10 ** (minL + (v / 100) * span),
    scaleToSlider: (s) => {
      if (!Number.isFinite(s) || s <= 0) return 50;
      return Math.max(0, Math.min(100, ((Math.log10(s) - minL) / span) * 100));
    },
  };
})();
import { getBounds } from './data/geo-loader.js';
import { loadBuildings, loadPaths, exportAll, resetAll } from './data/dev-storage.js';
import { getFilePathOverrides } from './data/file-overrides.js';
import { loadAllModels } from './assets/model-loader.js';

export class App {
  constructor(container) {
    this.container = container;
    this.devMode = new URLSearchParams(location.search).get('dev') === '1';
    if (this.devMode) document.body.classList.add('dev-mode');
  }

  async init() {
    this.scene = new THREE.Scene();
    this.renderer = createRenderer(this.container);

    const { camera, controls } = createCamera(this.renderer);
    this.camera = camera;
    this.controls = controls;

    this.clock = new THREE.Clock();
    this.updatables = [];

    setupAtmosphere(this.scene);
    this.lights = createLighting(this.scene);

    const rng = createRNG(CONFIG.seed);

    // Build the layout FIRST so the terrain knows where the wall sits and
    // can mask the texture / paint the outside area violet.
    this.layout = generateLayout();
    this.recenterCameraOnBounds();

    const { mesh: terrain, sampleHeight } = createTerrain();
    this.scene.add(terrain);
    this.terrain = terrain;
    this.sampleHeight = sampleHeight;

    this.pathsGroup = buildRoadsAndPaths(this.layout, sampleHeight);
    this.scene.add(this.pathsGroup);
    this.scene.add(buildWalls(this.layout, sampleHeight));

    this.zonesGroup = buildZones(this.layout, sampleHeight);
    this.scene.add(this.zonesGroup);

    // Custom paths come from BOTH the corrected.json baseline AND the
    // user's live localStorage edits. Merge by id with localStorage winning.
    const filePaths = getFilePathOverrides();
    const livePaths = loadPaths();
    const seenIds = new Set(livePaths.map((p) => p.id));
    const mergedPaths = [...livePaths, ...filePaths.filter((p) => !seenIds.has(p.id))];
    this.customPathsGroup = buildCustomPathsGroup(mergedPaths, sampleHeight);
    this.scene.add(this.customPathsGroup);

    await loadAllModels();

    this.buildings = placeBuildings(this.layout, sampleHeight, rng, loadBuildings());
    this.scene.add(this.buildings);

    this.debugBuildings();

    const veg = placeVegetation(this.layout, sampleHeight, rng);
    this.scene.add(veg.group);
    this.vegTrees = veg.trees;
    this.vegShrubs = veg.shrubs;

    const props = placeProps(this.layout, sampleHeight, rng);
    this.scene.add(props);

    const lamps = [];
    props.traverse((obj) => { if (obj.userData?.kind === 'lamp') lamps.push(obj); });
    this.lamps = lamps;

    if (this.devMode) this.setClutterVisible(false);

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

    this.modal = new BuildingModal(this.controls, this);
    this.popup = new BuildingPopup(this.camera, this.modal);
    this.updatables.push(() => this.popup.update());

    this.gps = new GPSController({ camera: this.camera, controls: this.controls, sampleHeight: this.sampleHeight });
    this.updatables.push((dt) => this.gps.update(dt));

    this.currentTarget = null;
    if (!this.devMode) {
      this.float = new BuildingFloat(this.buildings);
      this.updatables.push((dt, elapsed) => this.float.update(dt, elapsed));
      this.dim = new BuildingDim(this.buildings);
    }

    this.proximity = new ProximityHighlight({
      buildings: this.buildings,
      gps: this.gps,
      onNearChange: (building) => {
        if (this.devMode) return;
        this.setTarget(building);
      },
    });
    this.updatables.push((dt, elapsed) => this.proximity.update(dt, elapsed));

    this.dayNight = new DayNightSystem(this.scene, this.lights, lamps);
    this.setupNightToggle();
    this.setupGPSUI();

    this.tourAudio = new TourAudio();
    this.tour = new TourController({
      buildings: this.buildings,
      modal: this.modal,
      audio: this.tourAudio,
      onShowStop: (building) => this.focusTourStop(building),
      onStop: () => this.endTourFocus(),
    });
    this.setupTourButton();
    this.setupMobileDock();

    // Shadow policy: only clouds occlude the sun's shadow map. Everything
    // else has castShadow=false. Done after every group is added so we
    // don't need to babysit each system individually.
    this.applyShadowPolicy();

    if (this.devMode) await this.initDevMode();
    this.setupInteraction();

    this.composer = createComposer(this.renderer, this.scene, this.camera);

    window.addEventListener('resize', this.onResize);

    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.remove();
  }

  recenterCameraOnBounds() {
    const b = getBounds();
    const target = new THREE.Vector3(b.cx, 4, b.cz);
    const span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    const dist = Math.max(220, span * 1.0);
    const finalPos = new THREE.Vector3(b.cx + dist * 0.6, dist * 0.55, b.cz + dist * 0.85);
    // Remember overview pose — used to scale back out when modal closes.
    this.overviewPos = finalPos.clone();
    this.overviewTarget = target.clone();
    // Drone intro animates from a higher / farther starting position to
    // this overview pose.
    this.intro = new CameraIntro(this.camera, this.controls, finalPos, target);
    this.updatables.push((dt) => this.intro?.update(dt));
  }

  setClutterVisible(visible) {
    this.clutterVisible = visible;
    if (this.vegTrees) this.vegTrees.visible = visible;
    if (this.vegShrubs) this.vegShrubs.visible = visible;
    if (this.pathsGroup) this.pathsGroup.visible = visible;
    if (this.lamps) for (const l of this.lamps) l.visible = visible;
    const btn = document.getElementById('dev-toggle-clutter');
    if (btn) btn.textContent = visible ? 'Hide clutter' : 'Show clutter';
  }

  refreshCustomPaths() {
    if (this.customPathsGroup) {
      this.scene.remove(this.customPathsGroup);
      this.customPathsGroup.traverse((o) => o.geometry?.dispose?.());
    }
    this.customPathsGroup = buildCustomPathsGroup(loadPaths(), this.sampleHeight);
    this.scene.add(this.customPathsGroup);
  }

  refreshZones() {
    if (this.zonesGroup) {
      this.scene.remove(this.zonesGroup);
      this.zonesGroup.traverse((o) => o.geometry?.dispose?.());
    }
    this.zonesGroup = buildZones(this.layout, this.sampleHeight);
    this.scene.add(this.zonesGroup);
  }

  async initDevMode() {
    const [{ TransformEditor }, { PathEditor }, { ZoneEditor }, { ZoneDrawEditor }, { DevModeManager }] = await Promise.all([
      import('./dev/transform-editor.js'),
      import('./dev/path-editor.js'),
      import('./dev/zone-editor.js'),
      import('./dev/zone-draw-editor.js'),
      import('./dev/dev-mode-manager.js'),
    ]);
    this.transformEditor = new TransformEditor({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      controls: this.controls,
      buildings: this.buildings,
      onSelectionChange: (b) => this.updateScaleRow(b),
      onObjectChange: (b) => this.syncScaleSlider(b),
    });
    this.pathEditor = new PathEditor({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      terrain: this.terrain,
      sampleHeight: this.sampleHeight,
      onFinish: () => this.refreshCustomPaths(),
    });
    this.zoneEditor = new ZoneEditor({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      controls: this.controls,
      sampleHeight: this.sampleHeight,
      layout: this.layout,
      onUpdate: () => this.refreshZones(),
    });
    this.zoneDrawEditor = new ZoneDrawEditor({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      terrain: this.terrain,
      sampleHeight: this.sampleHeight,
      onFinish: () => this.refreshZones(),
    });
    this.devManager = new DevModeManager({
      transformEditor: this.transformEditor,
      pathEditor: this.pathEditor,
      zoneEditor: this.zoneEditor,
      zoneDrawEditor: this.zoneDrawEditor,
      onModeChange: (m) => this.updateDevUI(m),
    });
    this.wireDevUI();
  }

  wireDevUI() {
    this.wireScaleControl();

    const modeButtons = document.querySelectorAll('#dev-toolbar .mode-btn');
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.devManager.setMode(btn.dataset.mode));
    });

    const pathType = document.getElementById('path-type');
    pathType?.addEventListener('change', () => this.devManager.setPathType(pathType.value));
    document.getElementById('path-finish')?.addEventListener('click', () => this.pathEditor.finishPath());
    document.getElementById('path-cancel')?.addEventListener('click', () => this.pathEditor.cancel());

    // Zone draw buttons — these were missing wiring in a previous edit, so
    // the Save button was a no-op. Hooking them up here.
    const zoneType = document.getElementById('zone-type');
    zoneType?.addEventListener('change', () => this.devManager.setZoneType(zoneType.value));
    document.getElementById('zone-finish')?.addEventListener('click', () => this.zoneDrawEditor.finish());
    document.getElementById('zone-cancel')?.addEventListener('click', () => this.zoneDrawEditor.cancel());

    document.getElementById('dev-simulate-gps')?.addEventListener('click', () => {
      if (this.gps.enabled) this.gps.disable();
      else this.gps.enableSimulated();
      this.updateGPSStatus();
    });

    document.getElementById('dev-toggle-clutter')?.addEventListener('click', () => {
      this.setClutterVisible(!this.clutterVisible);
    });

    document.getElementById('dev-export')?.addEventListener('click', () => {
      const data = JSON.stringify(exportAll(), null, 2);
      navigator.clipboard?.writeText(data).catch(() => fallbackCopy(data));
      this.setDevStatus('Copied all overrides to clipboard');
    });
    document.getElementById('dev-reset')?.addEventListener('click', () => {
      if (confirm('Reset all overrides (buildings, paths, zones)? Page will reload.')) {
        resetAll();
        location.reload();
      }
    });

    this.updateDevUI('buildings');
  }

  wireScaleControl() {
    const slider = document.getElementById('scale-slider');
    const input = document.getElementById('scale-input');
    const reset = document.getElementById('scale-reset');

    slider?.addEventListener('input', () => {
      const s = SCALE.sliderToScale(+slider.value);
      this.transformEditor.setScale(s);
      if (input) input.value = s.toFixed(s < 1 ? 3 : 2);
    });
    input?.addEventListener('input', () => {
      const s = +input.value;
      if (!Number.isFinite(s) || s <= 0) return;
      this.transformEditor.setScale(s);
      if (slider) slider.value = SCALE.scaleToSlider(s);
    });
    reset?.addEventListener('click', () => {
      const b = this.transformEditor.selected;
      if (!b) return;
      const auto = b.userData.autoScale ?? 1;
      this.transformEditor.setScale(auto);
      this.syncScaleSlider(b);
    });
  }

  updateScaleRow(building) {
    const row = document.getElementById('scale-row');
    if (!row) return;
    row.hidden = !building;
    if (building) this.syncScaleSlider(building);
  }

  syncScaleSlider(building) {
    if (!building) return;
    const slider = document.getElementById('scale-slider');
    const input = document.getElementById('scale-input');
    const s = building.scale.x;
    if (slider) slider.value = SCALE.scaleToSlider(s);
    if (input) input.value = s.toFixed(s < 1 ? 3 : 2);
  }

  updateDevUI(mode) {
    document.querySelectorAll('#dev-toolbar .mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    document.getElementById('path-options').hidden = mode !== 'draw-path';
    const zoneOpts = document.getElementById('zone-options');
    if (zoneOpts) zoneOpts.hidden = mode !== 'draw-zone';
  }

  setDevStatus(msg) {
    const el = document.getElementById('dev-status');
    if (!el) return;
    el.textContent = msg;
    clearTimeout(this._devStatusTimer);
    this._devStatusTimer = setTimeout(() => { el.textContent = ''; }, 2200);
  }

  debugBuildings() {
    const rows = this.buildings.children.map((b) => {
      const bbox = new THREE.Box3().setFromObject(b);
      const size = bbox.getSize(new THREE.Vector3());
      return {
        name: b.userData.info?.name || '?',
        model: b.userData.hasModel ? '✓ GLB' : '·  placeholder',
        x: +b.position.x.toFixed(1),
        z: +b.position.z.toFixed(1),
        w: +size.x.toFixed(1),
        h: +size.y.toFixed(1),
        d: +size.z.toFixed(1),
      };
    });
    console.groupCollapsed(`[buildings] ${rows.length} placed — expand for table`);
    console.table(rows);
    console.groupEnd();
  }

  applyShadowPolicy() {
    this.scene.traverse((obj) => {
      if (!obj.isMesh) return;
      let cur = obj;
      let isCloud = false;
      while (cur) {
        if (cur.name === 'clouds') { isCloud = true; break; }
        cur = cur.parent;
      }
      obj.castShadow = isCloud;
    });
  }

  setupMobileDock() {
    const live = document.getElementById('mobile-live');
    const tour = document.getElementById('mobile-tour');

    const setLiveLabel = (active) => {
      if (!live) return;
      live.textContent = active ? 'Stop live' : 'Live view';
      live.classList.toggle('active', active);
    };
    const setTourLabel = (active) => {
      if (!tour) return;
      tour.textContent = active ? 'Stop tour' : 'Start tour';
      tour.classList.toggle('active', active);
    };

    live?.addEventListener('click', async () => {
      if (this.gps.enabled) {
        this.gps.disable();
        setLiveLabel(false);
        return;
      }
      live.disabled = true;
      try {
        await this.gps.enableLive(); // asks for geolocation + compass perm
        setLiveLabel(true);
      } catch (err) {
        console.warn('[live view]', err?.message || err);
        alert(err?.message || 'Could not start live view.');
      } finally {
        live.disabled = false;
      }
    });

    tour?.addEventListener('click', () => {
      if (this.tour.isActive()) this.tour.stop();
      else this.tour.start();
    });

    // Mirror state-changes from the existing controllers so the pill labels
    // stay in sync whether the user starts something from the desktop UI or
    // the dock.
    const prevTourCb = this.tour.onStateChange;
    this.tour.onStateChange = (active) => {
      prevTourCb?.(active);
      setTourLabel(active);
    };
  }

  setupTourButton() {
    const btn = document.getElementById('tour-toggle');
    if (!btn) return;
    const label = btn.querySelector('.label');
    const setLabel = (active) => {
      btn.dataset.active = active ? 'true' : 'false';
      if (label) label.textContent = active ? 'Stop tour' : 'Start tour';
    };
    setLabel(false);
    this.tour.onStateChange = (active) => setLabel(active);
    btn.addEventListener('click', () => {
      if (this.tour.isActive()) this.tour.stop();
      else this.tour.start();
    });
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

  setupGPSUI() {
    const btn = document.getElementById('gps-toggle');
    if (!btn) return;
    const label = btn.querySelector('.label');
    btn.addEventListener('click', async () => {
      if (this.gps.enabled) {
        this.gps.disable();
        if (label) label.textContent = 'Use my location';
        this.updateGPSStatus();
        return;
      }
      btn.disabled = true;
      try {
        const dist = await this.gps.enableLive();
        if (label) label.textContent = 'Stop tracking';
        this.setGPSStatusText(`Tracking · ${Math.round(dist)}m from campus origin`);
      } catch (err) {
        this.setGPSStatusText(err.message || 'Location unavailable');
      } finally {
        btn.disabled = false;
      }
    });
    this.updateGPSStatus();
    setInterval(() => this.updateGPSStatus(), 1000);
  }

  setGPSStatusText(text) {
    const el = document.getElementById('gps-status');
    if (el) el.textContent = text;
  }

  updateGPSStatus() {
    if (!this.gps.enabled || !this.gps.userPos) { this.setGPSStatusText(''); return; }
    const acc = this.gps.userPos.accuracy ? `±${Math.round(this.gps.userPos.accuracy)}m` : '';
    const tag = this.gps.simulated ? 'Sim' : 'Live';
    const heading = this.gps.heading != null ? ` · ${Math.round(this.gps.heading)}°` : '';
    this.setGPSStatusText(`${tag} ${acc}${heading}`);
  }

  setupInteraction() {
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const canvas = this.renderer.domElement;
    let downX = 0, downY = 0, downT = 0;

    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      downX = e.clientX; downY = e.clientY; downT = performance.now();
    });

    canvas.addEventListener('pointerup', (e) => {
      if (e.button !== 0) return;
      if (this.transformEditor?.isBusy?.()) return;
      if (this.zoneEditor?.isBusy?.()) return;
      const elapsed = performance.now() - downT;
      if (elapsed > 350) return;
      if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) return;

      if (this.devMode && this.devManager) {
        const mode = this.devManager.getMode();
        if (mode === 'draw-path')  { this.pathEditor.handleClick(e); return; }
        if (mode === 'draw-zone')  { this.zoneDrawEditor.handleClick(e); return; }
        if (mode === 'edit-zones') { this.zoneEditor.handleClick(e); return; }
      }

      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, this.camera);
      const hits = raycaster.intersectObject(this.buildings, true);
      let target = null;
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj && !obj.userData?.info) obj = obj.parent;
        target = obj;
      }
      if (this.devMode && this.transformEditor) {
        if (target) this.transformEditor.select(target);
        else this.transformEditor.deselect();
      } else {
        this.setTarget(target);
      }
    });
  }

  setTarget(building) {
    if (this.currentTarget === building) return;
    this.currentTarget = building || null;
    if (building) {
      this.popup.show(building);
      this.float?.setActive(building);
      this.dim?.activate(building);
      this.focusCameraOn(building);
    } else {
      this.popup.hide();
      this.float?.clear();
      this.dim?.clear();
    }
  }

  /** Smoothly move the camera so `building` fits nicely in the viewport. */
  focusCameraOn(building) {
    if (!building) return;
    if (this.gps?.enabled) return;            // GPS owns the camera in live mode
    if (this.intro?.active) this.intro.skip();

    // Frame the *actual* world bbox of the building so the camera fits the
    // model regardless of its scale override.
    const bbox = new THREE.Box3().setFromObject(building);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Distance computed from the camera FOV so the bbox always fits with a
    // ~30% margin around it.
    const vFov = (this.camera.fov * Math.PI) / 180;
    const fitDist = (maxDim / 2) / Math.tan(vFov / 2) * 1.35;

    // Account for the BuildingFloat lift so we frame the lifted position.
    const lift = 3.5;
    const focusCenter = center.clone().add(new THREE.Vector3(0, lift, 0));

    // Keep the user's current horizontal viewing direction; just close in.
    const dir = new THREE.Vector3()
      .subVectors(this.camera.position, focusCenter)
      .setY(0);
    if (dir.lengthSq() < 1) dir.set(1, 0, 1);
    dir.normalize();

    const endPos = focusCenter.clone()
      .addScaledVector(dir, fitDist)
      .add(new THREE.Vector3(0, size.y * 0.35, 0));
    const endTarget = focusCenter;

    this.cameraFocus = {
      active: true,
      t: 0,
      duration: 1.1,
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPos,
      endTarget,
    };
    this.controls.enabled = false;
  }

  /**
   * Focus a tour stop. The framing shifts so the building doesn't sit under
   * the tour panel:
   *   - desktop: panel is on the RIGHT half → shift right (building lands left)
   *   - mobile:  panel covers the BOTTOM half → shift down (building lands top)
   */
  focusTourStop(building) {
    if (!building) return;
    if (this.gps?.enabled) return;
    if (this.intro?.active) this.intro.skip();

    const mobile = window.matchMedia('(max-width: 768px)').matches;

    const bbox = new THREE.Box3().setFromObject(building);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const vFov = (this.camera.fov * Math.PI) / 180;
    // Slightly tighter framing on mobile because the panel only covers half
    // the screen and the building is the focus.
    const fitDist = (maxDim / 2) / Math.tan(vFov / 2) * (mobile ? 1.45 : 1.55);

    const lift = 3.5;
    const focusCenter = center.clone().add(new THREE.Vector3(0, lift, 0));

    const dir = new THREE.Vector3()
      .subVectors(this.camera.position, focusCenter)
      .setY(0);
    if (dir.lengthSq() < 1) dir.set(1, 0, 1);
    dir.normalize();

    const endPos = focusCenter.clone()
      .addScaledVector(dir, fitDist)
      .add(new THREE.Vector3(0, size.y * 0.35, 0));
    const endTarget = focusCenter.clone();

    // Build the camera basis at the final pose so we can pan in screen-axes.
    const fwd = new THREE.Vector3().subVectors(endTarget, endPos).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const camUp = new THREE.Vector3().crossVectors(right, fwd).normalize();

    if (mobile) {
      // Pan the whole frame DOWN — shifting camera + target by the same
      // vector preserves the view direction but moves the world up in
      // screen space, so the building reads as centred in the visible top
      // half rather than sitting behind the modal.
      const halfHeight = fitDist * Math.tan(vFov / 2);
      const shift = halfHeight * 0.42;
      endTarget.addScaledVector(camUp, -shift);
      endPos.addScaledVector(camUp, -shift);
    } else {
      // Desktop tour: panel on the right, push the building to the left.
      const halfWidth = fitDist * Math.tan(vFov / 2) * this.camera.aspect;
      const shift = halfWidth * 0.5;
      endTarget.addScaledVector(right, shift);
      endPos.addScaledVector(right, shift);
    }

    // Hide the leftover "Read more" bottom card if the user had a popup
    // open from a previous click — during tour the modal is the surface.
    this.popup?.hide();
    this.currentTarget = null;

    this.float?.setActive(building);
    this.dim?.activate(building);

    this.cameraFocus = {
      active: true,
      t: 0,
      duration: 1.2,
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPos,
      endTarget,
    };
    this.controls.enabled = false;
  }

  endTourFocus() {
    this.float?.clear();
    this.dim?.clear();
    this.zoomToOverview();
  }

  /** Pull camera back to the saved overview pose (called from modal close). */
  zoomToOverview() {
    if (!this.overviewPos) return;
    this.cameraFocus = {
      active: true,
      t: 0,
      duration: 1.4,
      startPos: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPos: this.overviewPos.clone(),
      endTarget: this.overviewTarget.clone(),
    };
    this.controls.enabled = false;
  }

  updateCameraFocus(dt) {
    const cf = this.cameraFocus;
    if (!cf || !cf.active) return;
    cf.t += dt;
    const p = Math.min(1, cf.t / cf.duration);
    // Ease in-out cubic — smooth start and finish.
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    this.camera.position.lerpVectors(cf.startPos, cf.endPos, e);
    this.controls.target.lerpVectors(cf.startTarget, cf.endTarget, e);
    if (p >= 1) {
      cf.active = false;
      // Don't re-enable OrbitControls while a modal still owns them — both
      // the tour modal and the normal popup-modal want them disabled. They
      // restore themselves on hide().
      if (!this.modal?.isOpen()) this.controls.enabled = true;
    }
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

  start() { this.renderer.setAnimationLoop(this.tick); }
  stop()  { this.renderer.setAnimationLoop(null); }

  tick = () => {
    const dt = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;

    // Skip the main scene render ONLY when the modal is in its normal full
    // overlay state. During a tour the left half of the screen IS the live
    // campus — we need updateCameraFocus + the bird/cloud/float updates to
    // keep running so the focused building hovers in view.
    if (this.modal?.isOpen() && !this.tour?.isActive()) return;

    for (const u of this.updatables) u(dt, elapsed);
    this.updateCameraFocus(dt);
    this.controls.update();
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  };
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  ta.remove();
}
