import * as THREE from 'three';

const NIGHT = {
  fog: new THREE.Color('#1a1830'),
  bg: new THREE.Color('#1a1830'),
  hemiSky: new THREE.Color('#5e6f9c'),
  hemiGround: new THREE.Color('#0a0a18'),
  ambient: new THREE.Color('#3a4258'),
  hemiIntensity: 0.18,
  ambientIntensity: 0.08,
  bulbEmissive: 2.4,
};

const LAMP_LIGHT = {
  color: 0xffd28a,
  intensity: 20,
  distance: 22,
  decay: 1.6,
};

const MAX_LAMP_LIGHTS = 28;

export class DayNightSystem {
  constructor(scene, lights, lamps) {
    this.scene = scene;
    this.lights = lights;
    this.lamps = lamps;
    this.isNight = false;

    this.day = {
      sunIntensity: lights.sun.intensity,
      hemiIntensity: lights.hemi.intensity,
      ambientIntensity: lights.ambient.intensity,
      hemiSkyColor: lights.hemi.color.clone(),
      hemiGroundColor: lights.hemi.groundColor.clone(),
      ambientColor: lights.ambient.color.clone(),
      fogColor: scene.fog.color.clone(),
      bgColor: scene.background.clone(),
      bulbEmissive: lamps[0]?.userData?.bulbMesh?.material?.emissiveIntensity ?? 1.4,
    };

    this.skydome = null;
    scene.traverse((obj) => {
      if (obj.name === 'skydome') this.skydome = obj;
    });

    this.bulbMat = lamps[0]?.userData?.bulbMesh?.material ?? null;

    this.litLamps = this.pickLitLamps(MAX_LAMP_LIGHTS);
  }

  pickLitLamps(n) {
    if (this.lamps.length <= n) return [...this.lamps];
    const chosen = [];
    for (let i = 0; i < n; i++) {
      chosen.push(this.lamps[Math.floor((i * this.lamps.length) / n)]);
    }
    return chosen;
  }

  toggle() {
    this.setNight(!this.isNight);
  }

  setNight(on) {
    if (this.isNight === on) return;
    this.isNight = on;

    if (on) {
      this.lights.sun.intensity = 0;
      this.lights.sun.castShadow = false;
      this.lights.hemi.intensity = NIGHT.hemiIntensity;
      this.lights.hemi.color.copy(NIGHT.hemiSky);
      this.lights.hemi.groundColor.copy(NIGHT.hemiGround);
      this.lights.ambient.intensity = NIGHT.ambientIntensity;
      this.lights.ambient.color.copy(NIGHT.ambient);
      this.scene.fog.color.copy(NIGHT.fog);
      this.scene.background.copy(NIGHT.bg);

      if (this.skydome) {
        this.skydome.material.vertexColors = false;
        this.skydome.material.color.copy(NIGHT.bg);
        this.skydome.material.needsUpdate = true;
      }
      if (this.bulbMat) this.bulbMat.emissiveIntensity = NIGHT.bulbEmissive;

      for (const lamp of this.litLamps) {
        const light = new THREE.PointLight(
          LAMP_LIGHT.color,
          LAMP_LIGHT.intensity,
          LAMP_LIGHT.distance,
          LAMP_LIGHT.decay,
        );
        const bulb = lamp.userData.bulbMesh;
        if (bulb) light.position.copy(bulb.position);
        lamp.add(light);
        lamp.userData.activeLight = light;
      }
    } else {
      this.lights.sun.intensity = this.day.sunIntensity;
      this.lights.sun.castShadow = true;
      this.lights.hemi.intensity = this.day.hemiIntensity;
      this.lights.hemi.color.copy(this.day.hemiSkyColor);
      this.lights.hemi.groundColor.copy(this.day.hemiGroundColor);
      this.lights.ambient.intensity = this.day.ambientIntensity;
      this.lights.ambient.color.copy(this.day.ambientColor);
      this.scene.fog.color.copy(this.day.fogColor);
      this.scene.background.copy(this.day.bgColor);

      if (this.skydome) {
        this.skydome.material.vertexColors = true;
        this.skydome.material.color.set(0xffffff);
        this.skydome.material.needsUpdate = true;
      }
      if (this.bulbMat) this.bulbMat.emissiveIntensity = this.day.bulbEmissive;

      for (const lamp of this.litLamps) {
        const light = lamp.userData.activeLight;
        if (light) {
          lamp.remove(light);
          light.dispose?.();
          lamp.userData.activeLight = null;
        }
      }
    }
  }
}
