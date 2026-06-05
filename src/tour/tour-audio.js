// ============================================================================
//  Tour read-aloud player
// ----------------------------------------------------------------------------
//  Wraps a single <audio> element used by the tour. The TourController drives
//  it (.play / .stop / .toggleMute) and the modal polls .progress() each frame
//  to fill the progress bar. When audio is muted, missing, or fails to load,
//  the controller falls back to its 60-second wall-clock timer.
//
//  Where to put MP3 files
//  ----------------------
//  Drop them in `public/audio/` and reference them in
//  src/data/building-details.js as a path relative to the Vite base, e.g.
//      audio: 'audio/subbamma-house.mp3'
//  This is then normalised below to `${BASE_URL}audio/subbamma-house.mp3` so
//  the deploy path (`/mori-infitown/`) is included automatically.
// ============================================================================

const STORAGE_KEY = 'tour-muted';

export class TourAudio {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.muted = this.loadMutedPref();
    this.audio.muted = this.muted;

    this.onEnded = null;
    this.onError = null;

    this.audio.addEventListener('ended', () => {
      if (this.onEnded) this.onEnded();
    });
    this.audio.addEventListener('error', () => {
      console.warn('[tour-audio] failed to load', this.audio.src);
      if (this.onError) this.onError();
    });
  }

  loadMutedPref() {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; }
    catch { return false; }
  }

  saveMutedPref() {
    try { localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0'); } catch {}
  }

  setMuted(muted) {
    this.muted = !!muted;
    this.audio.muted = this.muted;
    this.saveMutedPref();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }
  isMuted() { return this.muted; }

  normalize(src) {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('/')) return src;
    const base = import.meta.env?.BASE_URL || '/';
    // Encode path segments so filenames with spaces / special characters
    // resolve correctly. Slashes between segments are preserved.
    const encoded = src.split('/').map((s) => encodeURIComponent(s)).join('/');
    return base + encoded;
  }

  /** Load and play a track. Returns true if playback started, false if no src. */
  play(src) {
    if (!src) { this.stop(); return false; }
    const full = this.normalize(src);
    if (this.audio.src !== full) this.audio.src = full;
    this.audio.muted = this.muted;
    this.audio.currentTime = 0;
    this.audio.play().catch((err) => {
      console.warn('[tour-audio] play() rejected:', err.message);
    });
    return true;
  }

  stop() {
    this.audio.pause();
    try { this.audio.currentTime = 0; } catch {}
  }
  pause()  { this.audio.pause(); }
  resume() { this.audio.play().catch(() => {}); }

  isPlaying() { return !this.audio.paused && !this.audio.ended; }
  isPaused()  { return this.audio.paused && this.audio.currentTime > 0; }

  /** Progress 0..1, based on the actual playback head. */
  progress() {
    const d = this.audio.duration;
    if (!d || !Number.isFinite(d)) return 0;
    return Math.min(1, this.audio.currentTime / d);
  }
}
