import * as THREE from 'three';
import { getOrigin } from '../data/geo-loader.js';

const EYE_HEIGHT = 1.7;
const POSITION_LERP = 0.08;
const RANGE_M = 10000;

export class GPSController {
  constructor({ camera, controls, sampleHeight }) {
    this.camera = camera;
    this.controls = controls;
    this.sampleHeight = sampleHeight;
    this.origin = getOrigin();
    this.LAT_M = 111320;
    this.LON_M = 111320 * Math.cos((this.origin.lat * Math.PI) / 180);

    this.enabled = false;
    this.simulated = false;
    this.userPos = null;
    this.heading = null;
    this.targetPos = new THREE.Vector3();
    this.savedCamera = null;
    this.savedTarget = null;

    this.keys = new Set();
    this.onKeyDown = (e) => { if (this.simulated) this.keys.add(e.key.toLowerCase()); };
    this.onKeyUp   = (e) => { if (this.simulated) this.keys.delete(e.key.toLowerCase()); };
  }

  async enableLive() {
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm !== 'granted') console.warn('Compass permission denied');
      } catch (e) {
        console.warn('Compass perm error:', e.message);
      }
    }
    if (!navigator.geolocation) throw new Error('Geolocation not supported');

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = this.haversine(pos.coords.latitude, pos.coords.longitude, this.origin.lat, this.origin.lon);
          if (dist > RANGE_M) {
            reject(new Error(`Beyond ${(RANGE_M / 1000).toFixed(0)} km of campus (${(dist / 1000).toFixed(1)} km away)`));
            return;
          }
          this.startTracking();
          this.updatePos(pos);
          resolve(dist);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000 },
      );
    });
  }

  startTracking() {
    this.captureCameraState();
    this.watchId = navigator.geolocation.watchPosition(
      (p) => {
        const d = this.haversine(p.coords.latitude, p.coords.longitude, this.origin.lat, this.origin.lon);
        if (d <= RANGE_M) this.updatePos(p);
      },
      (err) => console.warn('GPS:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
    );
    window.addEventListener('deviceorientation', this.onOrient, true);
    window.addEventListener('deviceorientationabsolute', this.onOrient, true);
    if (this.controls) this.controls.enabled = false;
    this.enabled = true;
  }

  enableSimulated() {
    this.captureCameraState();
    this.userPos = { x: 0, z: 0, lat: this.origin.lat, lon: this.origin.lon, accuracy: 5 };
    this.targetPos.set(0, EYE_HEIGHT + this.sampleHeight(0, 0), 0);
    this.heading = 0;
    if (this.controls) this.controls.enabled = false;
    this.enabled = true;
    this.simulated = true;
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  disable() {
    if (this.watchId != null) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    window.removeEventListener('deviceorientation', this.onOrient, true);
    window.removeEventListener('deviceorientationabsolute', this.onOrient, true);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.keys.clear();
    if (this.controls) this.controls.enabled = true;
    this.restoreCameraState();
    this.enabled = false;
    this.simulated = false;
    this.userPos = null;
    this.heading = null;
  }

  captureCameraState() {
    this.savedCamera = this.camera.position.clone();
    this.savedTarget = this.controls ? this.controls.target.clone() : null;
  }
  restoreCameraState() {
    if (this.savedCamera) this.camera.position.copy(this.savedCamera);
    if (this.savedTarget && this.controls) this.controls.target.copy(this.savedTarget);
    if (this.controls) this.controls.update();
  }

  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  updatePos(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const x = (lon - this.origin.lon) * this.LON_M;
    const z = -(lat - this.origin.lat) * this.LAT_M;
    this.userPos = { x, z, lat, lon, accuracy: pos.coords.accuracy };
    const groundY = this.sampleHeight(x, z);
    this.targetPos.set(x, groundY + EYE_HEIGHT, z);
  }

  onOrient = (e) => {
    if (e.webkitCompassHeading != null) this.heading = e.webkitCompassHeading;
    else if (e.alpha != null) this.heading = (360 - e.alpha) % 360;
  };

  update(dt) {
    if (!this.enabled || !this.userPos) return;

    if (this.simulated) {
      const speed = 6 * dt;
      const headingRad = ((this.heading || 0) * Math.PI) / 180;
      const fwdX = Math.sin(headingRad);
      const fwdZ = -Math.cos(headingRad);
      const rightX = Math.cos(headingRad);
      const rightZ = Math.sin(headingRad);
      let dx = 0, dz = 0;
      if (this.keys.has('w') || this.keys.has('arrowup'))    { dx += fwdX * speed; dz += fwdZ * speed; }
      if (this.keys.has('s') || this.keys.has('arrowdown'))  { dx -= fwdX * speed; dz -= fwdZ * speed; }
      if (this.keys.has('d') || this.keys.has('arrowright')) { dx += rightX * speed; dz += rightZ * speed; }
      if (this.keys.has('a') || this.keys.has('arrowleft'))  { dx -= rightX * speed; dz -= rightZ * speed; }
      if (this.keys.has('q')) this.heading = ((this.heading || 0) - 60 * dt + 360) % 360;
      if (this.keys.has('e')) this.heading = ((this.heading || 0) + 60 * dt) % 360;
      this.userPos.x += dx;
      this.userPos.z += dz;
      const y = this.sampleHeight(this.userPos.x, this.userPos.z);
      this.targetPos.set(this.userPos.x, y + EYE_HEIGHT, this.userPos.z);
    }

    this.camera.position.lerp(this.targetPos, POSITION_LERP);
    if (this.heading != null) {
      const headingRad = (this.heading * Math.PI) / 180;
      const fwdX = Math.sin(headingRad);
      const fwdZ = -Math.cos(headingRad);
      this.camera.lookAt(
        this.camera.position.x + fwdX * 20,
        this.camera.position.y,
        this.camera.position.z + fwdZ * 20,
      );
    }
  }
}
