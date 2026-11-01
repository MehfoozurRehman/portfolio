// Time of day: day, golden hour and night. Blends sky, fog, lights, water and makes every bulb glow at night.
import * as THREE from 'three';
import gsap from 'gsap';
import { clay } from './materials.js';
import { makeGlowSprite } from '../game/fx.js';

const C = (h) => new THREE.Color(h);
const MODES = {
  day: { top: C('#B9E0EC'), horizon: C('#F8DCD3'), fog: C('#F4D9D1'), hemiSky: C('#FFF3EC'), hemiGround: C('#8FCBD4'), hemi: 1.05, sun: C('#FFF0E2'), sunI: 3.0, sunPos: [-28, 46, 22], deep: C('#6FB3C2'), shallow: C('#9AD7D9'), foam: C('#F7FBF9'), emissive: 0.9, glow: 0, exposure: 0.98 },
  golden: { top: C('#F6C9A8'), horizon: C('#FFB79A'), fog: C('#F8C3AA'), hemiSky: C('#FFE2C8'), hemiGround: C('#B79AA8'), hemi: 0.9, sun: C('#FFB27A'), sunI: 2.6, sunPos: [-46, 16, 10], deep: C('#7FA2B8'), shallow: C('#E3B9A9'), foam: C('#FFF1E4'), emissive: 1.4, glow: 0.35, exposure: 1.0 },
  night: { top: C('#161D45'), horizon: C('#3B3B6B'), fog: C('#2E3260'), hemiSky: C('#7A8AD6'), hemiGround: C('#1F2850'), hemi: 0.34, sun: C('#A9BCFF'), sunI: 0.5, sunPos: [24, 40, -18], deep: C('#1E2C52'), shallow: C('#34507A'), foam: C('#9FB0DE'), emissive: 3.4, glow: 1, exposure: 1.0 },
};
export const MODE_ORDER = ['day', 'golden', 'night'];

export class DayCycle {
  constructor({ scene, renderer, hemi, sun, sky, water, sunOffset }) {
    Object.assign(this, { scene, renderer, hemi, sun, sky, water, sunOffset });
    this.mode = 'day';
    this.glows = [];
    this.state = { k: 0 };
  }

  /** Put a soft glow sprite on every emissive bulb in the world (visible at dusk and night). */
  collectGlows(filter = () => true) {
    this.glowFilter = filter;
    this.glowOwners = [];
    const emissiveMat = (m) => m && m.name === 'pal_emissive';
    const v = new THREE.Vector3();
    const seen = [];
    this.scene.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some(emissiveMat)) return;
      o.geometry.computeBoundingSphere();
      v.copy(o.geometry.boundingSphere.center);
      o.localToWorld(v);
      if (seen.some((p) => p.distanceToSquared(v) < 0.09)) return;
      seen.push(v.clone());
      const s = makeGlowSprite('rgba(255,214,140,1)', Math.min(2.2, 0.7 + o.geometry.boundingSphere.radius * 3));
      s.position.copy(v);
      s.material.opacity = 0;
      this.scene.add(s);
      this.glows.push(s);
      this.glowOwners.push(o);
    });
  }

  set(mode, { duration = 1.6 } = {}) {
    const m = MODES[mode];
    if (!m) return;
    this.mode = mode;
    const sky = this.sky.material.uniforms, wu = this.water.material.uniforms;
    const tw = (color, target) => gsap.to(color, { r: target.r, g: target.g, b: target.b, duration, ease: 'sine.inOut' });
    tw(sky.top.value, m.top); tw(sky.horizon.value, m.horizon);
    tw(this.scene.fog.color, m.fog);
    tw(this.hemi.color, m.hemiSky); tw(this.hemi.groundColor, m.hemiGround);
    tw(this.sun.color, m.sun);
    tw(wu.uDeep.value, m.deep); tw(wu.uShallow.value, m.shallow); tw(wu.uFoam.value, m.foam);
    tw(wu.uSkyTop.value, m.top); tw(wu.uHorizon.value, m.horizon); tw(wu.uSunCol.value, m.sun);
    const sd = new THREE.Vector3(...m.sunPos).normalize();
    gsap.to(wu.uSunDir.value, { x: sd.x, y: sd.y, z: sd.z, duration });
    gsap.to(this.hemi, { intensity: m.hemi, duration });
    gsap.to(this.sun, { intensity: m.sunI, duration });
    gsap.to(this.sunOffset, { x: m.sunPos[0], y: m.sunPos[1], z: m.sunPos[2], duration });
    gsap.to(this.renderer, { toneMappingExposure: m.exposure, duration });
    if (!this.emissives) {
      const set = new Set([clay('pal_emissive')]);
      this.scene.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => { if (mt?.name === 'pal_emissive') set.add(mt); }); });
      this.emissives = [...set];
    }
    for (const em of this.emissives) gsap.to(em, { emissiveIntensity: m.emissive, duration });
    this.glows.forEach((g, i) => gsap.to(g.material, { opacity: this.glowFilter(this.glowOwners[i]) ? m.glow * 0.85 : 0, duration }));
    this.onChange?.(mode, m);
  }

  next() {
    const i = MODE_ORDER.indexOf(this.mode);
    this.set(MODE_ORDER[(i + 1) % MODE_ORDER.length]);
    return this.mode;
  }
}
