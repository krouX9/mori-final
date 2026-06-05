import { ModalPreview } from './modal-preview.js';

export class BuildingModal {
  constructor(controls) {
    this.controls = controls;
    this.el = document.getElementById('building-modal');
    if (!this.el) return;
    this.titleEl    = this.el.querySelector('.modal-title');
    this.eyebrowEl  = this.el.querySelector('.modal-eyebrow');
    this.descEl     = this.el.querySelector('.modal-description');
    this.areaEl     = this.el.querySelector('.stat-area');
    this.perimEl    = this.el.querySelector('.stat-perimeter');
    this.galleryEl  = this.el.querySelector('.modal-gallery');
    this.closeBtn   = this.el.querySelector('.modal-close');
    this.tourEl     = this.el.querySelector('.modal-tour');

    this.currentTour = null;
    this.onHide = null;
    this.progressRaf = null;

    this.closeBtn?.addEventListener('click', () => this.hide());
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.hide();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.hide();
    });

    const canvas = document.getElementById('modal-preview-canvas');
    if (canvas) this.preview = new ModalPreview(canvas);
  }

  show(building, opts = {}) {
    if (!this.el || !building) return;
    const info = building.userData?.info;
    if (!info) return;

    if (this.titleEl)   this.titleEl.textContent   = info.name;
    if (this.eyebrowEl) {
      this.eyebrowEl.textContent = building.userData?.spillover
        ? 'Unplaced · dev only'
        : 'Campus · facility';
    }
    if (this.areaEl)  this.areaEl.textContent  = info.area ? `${Math.round(info.area).toLocaleString()} m²` : '—';
    if (this.perimEl) this.perimEl.textContent = info.perimeter ? `${Math.round(info.perimeter)} m` : '—';
    if (this.descEl)  this.descEl.textContent  = info.longDescription || info.description || '';

    this.renderGallery(info);

    this.el.classList.remove('hidden');
    if (this.controls) {
      this.prevControlsEnabled = this.controls.enabled;
      this.controls.enabled = false;
    }
    if (this.preview) this.preview.show(building);

    if (opts.tour) this.showTourControls(opts.tour);
    else this.hideTourControls();
  }

  renderGallery(info) {
    if (!this.galleryEl) return;
    const images = info?.gallery || [];
    if (images.length) {
      this.galleryEl.innerHTML = images
        .map((src) => `<div class="modal-gallery-item"><img src="${src}" alt="" /></div>`)
        .join('');
      this.galleryEl.classList.remove('is-empty');
    } else {
      this.galleryEl.innerHTML = `
        <div class="modal-gallery-placeholder">
          <div class="gallery-eyebrow">Image gallery</div>
          <div class="gallery-hint">add via <code>gallery: [...]</code> in building-details.js</div>
        </div>`;
      this.galleryEl.classList.add('is-empty');
    }
  }

  showTourControls(tour) {
    if (!this.tourEl) return;
    this.currentTour = tour;
    this.tourEl.hidden = false;
    this.el.classList.add('tour-active');

    const counter  = this.tourEl.querySelector('.tour-counter');
    const label    = this.tourEl.querySelector('.tour-stop-label');
    const prevBtn  = this.tourEl.querySelector('.tour-prev');
    const nextBtn  = this.tourEl.querySelector('.tour-next');
    const exitBtn  = this.tourEl.querySelector('.tour-exit');
    const pauseBtn = this.tourEl.querySelector('.tour-pause');
    const soundBtn = this.tourEl.querySelector('.tour-sound');

    if (counter) counter.textContent = `Stop ${tour.index + 1} of ${tour.total}`;
    if (label)   label.textContent   = this.titleEl?.textContent || '';

    if (prevBtn) {
      prevBtn.disabled = !tour.canPrev();
      prevBtn.onclick  = () => tour.prev();
    }
    if (nextBtn) {
      const isLast = !tour.canNext();
      nextBtn.textContent = isLast ? 'Finish' : 'Next →';
      nextBtn.onclick     = () => tour.next();
    }
    if (exitBtn) exitBtn.onclick = () => tour.exit();
    if (pauseBtn) {
      const setLabel = () => { pauseBtn.textContent = tour.isPaused() ? 'Resume' : 'Pause'; };
      pauseBtn.onclick = () => { tour.togglePause(); setLabel(); };
      setLabel();
    }
    if (soundBtn) {
      const setLabel = () => {
        const muted = tour.isMuted();
        soundBtn.textContent = muted ? 'Sound off' : 'Sound on';
        soundBtn.dataset.muted = muted ? 'true' : 'false';
      };
      soundBtn.onclick = () => { tour.toggleSound(); setLabel(); };
      setLabel();
      soundBtn.disabled = !tour.hasAudio;
      soundBtn.title = tour.hasAudio ? '' : 'No audio set for this stop';
    }

    this.startProgressLoop();
  }

  hideTourControls() {
    if (this.tourEl) this.tourEl.hidden = true;
    this.el?.classList.remove('tour-active');
    this.currentTour = null;
    this.stopProgressLoop();
  }

  startProgressLoop() {
    this.stopProgressLoop();
    const tick = () => {
      if (!this.currentTour) return;
      const fill = this.tourEl?.querySelector('.tour-progress-fill');
      if (fill) {
        const p = this.currentTour.getProgress();
        fill.style.width = `${(p * 100).toFixed(1)}%`;
      }
      this.progressRaf = requestAnimationFrame(tick);
    };
    this.progressRaf = requestAnimationFrame(tick);
  }

  stopProgressLoop() {
    if (this.progressRaf) cancelAnimationFrame(this.progressRaf);
    this.progressRaf = null;
  }

  hide() {
    this.el?.classList.add('hidden');
    if (this.controls) this.controls.enabled = this.prevControlsEnabled ?? true;
    if (this.preview) this.preview.clear();
    this.hideTourControls();
    if (this.onHide) {
      const cb = this.onHide;
      cb();
    }
  }

  isOpen() {
    return this.el && !this.el.classList.contains('hidden');
  }
}
