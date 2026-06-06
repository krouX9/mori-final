import { TOUR_ORDER } from '../data/tour-list.js';
import { getDetailsFor } from '../data/building-details.js';

const AUTO_ADVANCE_MS = 60_000;

export class TourController {
  constructor({ buildings, modal, audio, onShowStop, onStop }) {
    this.buildings = buildings;
    this.modal = modal;
    this.audio = audio;
    this.onShowStop = onShowStop;   // fires every stop with the building
    this.onStop = onStop;           // fires once when the tour ends
    this.order = TOUR_ORDER;
    this.currentIndex = -1;
    this.active = false;
    this.paused = false;
    this.timer = null;
    this.timerStart = 0;
    this.lastProgress = 0;
    this.audioActive = false;
    this.onStateChange = null;

    if (this.audio) {
      this.audio.onEnded = () => {
        if (this.active && !this.paused) this.next();
      };
      this.audio.onError = () => {
        // Audio failed: fall back to the 60s timer.
        this.audioActive = false;
        this.startTimer();
      };
    }
  }

  isActive() { return this.active; }
  isPaused() { return this.paused; }

  start() {
    if (this.active) return;
    this.active = true;
    this.paused = false;
    this.currentIndex = -1;
    this.modal.onHide = () => this.handleExternalClose();
    this.notify();
    this.advance(+1);
  }

  handleExternalClose() {
    const wasActive = this.active;
    this.active = false;
    this.paused = false;
    this.clearTimer();
    if (this.audio) this.audio.stop();
    this.audioActive = false;
    this.notify();
    if (wasActive && this.onStop) this.onStop();
  }

  stop() {
    const wasActive = this.active;
    this.active = false;
    this.paused = false;
    this.clearTimer();
    if (this.audio) this.audio.stop();
    this.audioActive = false;
    this.modal.onHide = null;
    if (wasActive) this.modal.hide();
    this.notify();
    if (wasActive && this.onStop) this.onStop();
  }

  next() { this.advance(+1); }
  prev() { this.advance(-1); }

  advance(direction) {
    const newIdx = this.currentIndex + direction;
    if (newIdx >= this.order.length) { this.stop(); return; }
    if (newIdx < 0) return;
    this.currentIndex = newIdx;
    this.showCurrent();
  }

  showCurrent() {
    const rawName = this.order[this.currentIndex];
    const building = this.findBuilding(rawName);
    if (!building) {
      console.warn(`[tour] No building found for "${rawName}" — skipping`);
      this.advance(+1);
      return;
    }

    const audioSrc = this.audioFor(rawName);
    this.modal.show(building, {
      tour: {
        index: this.currentIndex,
        total: this.order.length,
        next: () => this.next(),
        prev: () => this.prev(),
        exit: () => this.stop(),
        togglePause: () => this.togglePause(),
        isPaused: () => this.paused,
        getProgress: () => this.getProgress(),
        canPrev: () => this.currentIndex > 0,
        canNext: () => this.currentIndex < this.order.length - 1,
        toggleSound: () => this.toggleSound(),
        isMuted: () => this.audio?.isMuted() ?? true,
        hasAudio: !!audioSrc,
      },
    });

    if (audioSrc && this.audio && !this.audio.isMuted()) {
      this.audioActive = this.audio.play(audioSrc);
      this.clearTimer(); // audio drives advancement now
    } else {
      this.audioActive = false;
      if (this.audio) this.audio.stop();
      this.startTimer();
    }

    // Tell the app which building this stop is on so it can run the camera
    // sweep + float + dim around the focused model.
    if (this.onShowStop) this.onShowStop(building);
  }

  audioFor(rawName) {
    return getDetailsFor(rawName)?.audio || null;
  }

  findBuilding(rawName) {
    return this.buildings.children.find((b) => {
      const info = b.userData?.info;
      return info?.rawName === rawName || info?.name === rawName;
    }) || null;
  }

  startTimer() {
    this.clearTimer();
    if (this.paused) return;
    this.timerStart = performance.now();
    this.timer = setTimeout(() => {
      if (this.active && !this.paused) this.next();
    }, AUTO_ADVANCE_MS);
  }

  clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.clearTimer();
      if (this.audioActive) this.audio.pause();
    } else if (this.audioActive) {
      this.audio.resume();
    } else {
      this.startTimer();
    }
    return this.paused;
  }

  toggleSound() {
    if (!this.audio) return true;
    const muted = this.audio.toggleMute();
    if (muted) {
      // Stop the current playback and fall back to the timer.
      this.audio.stop();
      this.audioActive = false;
      if (this.active) this.startTimer();
    } else {
      // Re-attempt to play the current stop's audio.
      const rawName = this.order[this.currentIndex];
      const src = this.audioFor(rawName);
      if (src) {
        this.clearTimer();
        this.audioActive = this.audio.play(src);
      }
    }
    return muted;
  }

  getProgress() {
    if (this.audioActive && this.audio?.isPlaying()) {
      this.lastProgress = this.audio.progress();
      return this.lastProgress;
    }
    if (this.audioActive && this.audio?.isPaused?.()) {
      return this.lastProgress;
    }
    if (this.paused) return this.lastProgress;
    if (!this.timer) return 0;
    const elapsed = performance.now() - this.timerStart;
    this.lastProgress = Math.min(1, elapsed / AUTO_ADVANCE_MS);
    return this.lastProgress;
  }

  notify() {
    if (this.onStateChange) this.onStateChange(this.active);
  }
}
