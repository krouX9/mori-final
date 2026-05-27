import * as THREE from 'three';

export class BuildingPopup {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.worldPos = new THREE.Vector3();

    this.el = document.getElementById('popup');
    this.innerEl = this.el.querySelector('.popup-inner');
    this.titleEl = this.el.querySelector('.popup-title');
    this.descEl = this.el.querySelector('.popup-desc');
    this.btn = this.el.querySelector('.popup-btn');

    this.btn.addEventListener('click', () => {
      const info = this.target?.userData?.info;
      if (!info) return;
      const slug = info.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      window.location.hash = slug;
    });

    this.innerEl.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.innerEl.addEventListener('pointerup', (e) => e.stopPropagation());
  }

  show(target) {
    const info = target?.userData?.info;
    if (!info) {
      this.hide();
      return;
    }
    this.target = target;
    this.titleEl.textContent = info.name;
    this.descEl.textContent = info.description;
    this.el.classList.add('hidden');
    requestAnimationFrame(() => {
      this.el.classList.remove('hidden');
      this.update();
    });
  }

  hide() {
    this.target = null;
    this.el.classList.add('hidden');
  }

  update() {
    if (!this.target) return;
    const t = this.target;
    this.worldPos.set(t.position.x, t.position.y + 18, t.position.z);
    this.worldPos.project(this.camera);
    if (this.worldPos.z > 1) {
      this.el.style.opacity = '0';
      return;
    }
    this.el.style.opacity = '1';
    const x = (this.worldPos.x + 1) * 0.5 * window.innerWidth;
    const y = (1 - this.worldPos.y) * 0.5 * window.innerHeight;
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
  }
}
