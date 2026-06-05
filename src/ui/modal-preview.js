import * as THREE from 'three';

export class ModalPreview {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x99988a, 0.7);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff4e8, 1.6);
    key.position.set(8, 12, 6);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d8ee, 0.55);
    fill.position.set(-7, 4, -4);
    this.scene.add(fill);

    this.currentModel = null;
    this.running = false;
    this.rafId = null;
    this.lastTime = 0;

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
  }

  show(building) {
    this.clear();
    if (!building) return;

    const clone = building.clone(true);
    clone.position.set(0, 0, 0);
    clone.rotation.set(0, building.rotation.y, 0);
    clone.scale.copy(building.scale);

    // Restore original (non-holo) materials on cloned meshes so the preview
    // always shows the real model regardless of scene-side highlight state.
    clone.traverse((c) => {
      if (c.isMesh && c.userData._holoOriginal) c.material = c.userData._holoOriginal;
    });

    const bbox = new THREE.Box3().setFromObject(clone);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    clone.position.y += size.y / 2; // put base at y=0

    this.scene.add(clone);
    this.currentModel = clone;

    const maxDim = Math.max(size.x, size.y, size.z, 4);
    const dist = maxDim * 1.85;
    this.camera.position.set(dist * 0.85, dist * 0.65, dist * 0.95);
    this.camera.lookAt(0, size.y * 0.42, 0);

    requestAnimationFrame(() => {
      this.resize();
      this.start();
    });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.animate();
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  animate = () => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (this.currentModel) this.currentModel.rotation.y += dt * 0.22;
    this.renderer.render(this.scene, this.camera);
  };

  clear() {
    this.stop();
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }
  }

  dispose() {
    this.clear();
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
  }
}
