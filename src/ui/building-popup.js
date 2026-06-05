export class BuildingPopup {
  constructor(camera, modal = null) {
    this.camera = camera;
    this.modal = modal;
    this.target = null;

    this.el = document.getElementById('popup');
    if (!this.el) return;
    this.titleEl   = this.el.querySelector('.bottom-card-title');
    this.statsEl   = this.el.querySelector('.bottom-card-stats');
    this.eyebrowEl = this.el.querySelector('.bottom-card-eyebrow');
    this.btn       = this.el.querySelector('.bottom-card-btn');

    this.btn?.addEventListener('click', () => {
      if (!this.target) return;
      const info = this.target.userData?.info;
      if (!info) return;
      if (this.modal) {
        this.modal.show(this.target);
      } else {
        const slug = info.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        window.location.hash = slug;
      }
    });
  }

  show(target) {
    if (!this.el) return;
    const info = target?.userData?.info;
    if (!info) { this.hide(); return; }
    this.target = target;

    if (this.titleEl)   this.titleEl.textContent   = info.name;
    if (this.statsEl)   this.statsEl.textContent   = info.description || 'Campus facility';
    if (this.eyebrowEl) {
      this.eyebrowEl.textContent = target.userData?.spillover ? 'Unplaced' : 'Facility';
    }

    // Re-trigger entrance animation by toggling the visibility class
    this.el.classList.add('hidden');
    requestAnimationFrame(() => this.el.classList.remove('hidden'));
  }

  hide() {
    this.target = null;
    this.el?.classList.add('hidden');
  }

  // Bottom card is fixed-position; no per-frame work needed.
  update() {}
}
