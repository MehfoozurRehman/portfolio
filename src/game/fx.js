// Small pooled effects: dust puffs, confetti, sparkles, ripples, and flying paper planes.
import * as THREE from 'three';
import { spawn } from '../world/assets.js';
import { clay } from '../world/materials.js';

export class FX {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.puffGeo = new THREE.SphereGeometry(0.12, 10, 8);
    this.puffMat = new THREE.MeshBasicMaterial({ color: '#FFF8F0', transparent: true, opacity: 0.8, depthWrite: false });
    this.confGeo = new THREE.PlaneGeometry(0.12, 0.07);
    this.confMats = ['#F28C6F', '#F6CF6B', '#74C391', '#A9D6E5', '#ECBDB7', '#FFFFFF'].map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    this.ringGeo = new THREE.RingGeometry(0.3, 0.38, 32).rotateX(-Math.PI / 2);
    this.sparkGeo = new THREE.OctahedronGeometry(0.06, 0);
    this.sparkMat = new THREE.MeshBasicMaterial({ color: '#FFE8A8' });
  }

  puff(p, n = 3, spread = 0.25) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.puffGeo, this.puffMat.clone());
      m.position.set(p.x + (Math.random() - 0.5) * spread, p.y + 0.06, p.z + (Math.random() - 0.5) * spread);
      const s = 0.5 + Math.random() * 0.6;
      m.scale.setScalar(s);
      this.scene.add(m);
      this.items.push({ m, life: 0, max: 0.55 + Math.random() * 0.3, v: new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.5 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6), kind: 'puff', s });
    }
  }

  confetti(p, n = 60, power = 6) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.confGeo, this.confMats[i % this.confMats.length]);
      m.position.copy(p);
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      this.scene.add(m);
      const a = Math.random() * Math.PI * 2, up = power * (0.7 + Math.random() * 0.6);
      this.items.push({ m, life: 0, max: 2.2 + Math.random(), v: new THREE.Vector3(Math.cos(a) * power * 0.35 * Math.random(), up, Math.sin(a) * power * 0.35 * Math.random()), spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8), kind: 'confetti' });
    }
  }

  /** Water droplets thrown up when jumping into the shallows. */
  splash(p, n = 18) {
    if (!this.dropMat) this.dropMat = new THREE.MeshBasicMaterial({ color: '#EAF7F8', transparent: true, opacity: 0.9 });
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.sparkGeo, this.dropMat);
      m.position.copy(p);
      m.scale.setScalar(0.8 + Math.random() * 0.8);
      this.scene.add(m);
      const a = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * 1.4;
      this.items.push({ m, life: 0, max: 0.6 + Math.random() * 0.3, v: new THREE.Vector3(Math.cos(a) * r, 2.2 + Math.random() * 2, Math.sin(a) * r), kind: 'spark' });
    }
  }

  sparkle(p, n = 10) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.sparkGeo, this.sparkMat);
      m.position.copy(p);
      this.scene.add(m);
      const a = Math.random() * Math.PI * 2;
      this.items.push({ m, life: 0, max: 0.7 + Math.random() * 0.4, v: new THREE.Vector3(Math.cos(a) * 1.4, 1.5 + Math.random() * 1.5, Math.sin(a) * 1.4), kind: 'spark' });
    }
  }

  hearts(p, n = 5) {
    if (!this.heartTex) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      g.fillStyle = '#F28C6F';
      g.font = '52px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('♥', 32, 36);
      this.heartTex = new THREE.CanvasTexture(c);
    }
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.heartTex, transparent: true, depthWrite: false }));
      s.scale.setScalar(0.3);
      s.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4));
      this.scene.add(s);
      this.items.push({ m: s, life: -i * 0.12, max: 1.2, kind: 'heart', v: new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.9, (Math.random() - 0.5) * 0.3) });
    }
  }

  footprint(p, yaw, side) {
    if (!this.footGeo) {
      this.footGeo = new THREE.CircleGeometry(0.07, 12).rotateX(-Math.PI / 2);
      this.footGeo.scale(1, 1, 1.7);
      this.footMat = new THREE.MeshBasicMaterial({ color: '#C9A989', transparent: true, opacity: 0.55, depthWrite: false });
    }
    const m = new THREE.Mesh(this.footGeo, this.footMat.clone());
    const off = new THREE.Vector3(side * 0.1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    m.position.set(p.x + off.x, p.y + 0.012, p.z + off.z);
    m.rotation.y = yaw;
    this.scene.add(m);
    this.items.push({ m, life: 0, max: 5, kind: 'foot' });
  }

  ripple(p, color = '#FFFFFF') {
    const m = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false }));
    m.position.set(p.x, p.y + 0.02, p.z);
    this.scene.add(m);
    this.items.push({ m, life: 0, max: 1.1, kind: 'ripple' });
  }

  plane(from, to, delay = 0) {
    const m = spawn('paper_plane', { shadows: false });
    m.visible = false;
    m.scale.setScalar(1.2);
    this.scene.add(m);
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 4 + Math.random() * 3;
    const side = new THREE.Vector3(-(to.z - from.z), 0, to.x - from.x).normalize().multiplyScalar((Math.random() - 0.5) * 6);
    mid.add(side);
    this.items.push({ m, life: -delay, max: 2.6, kind: 'plane', curve: new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone()) });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life += dt;
      if (it.life < 0) continue;
      const k = it.life / it.max;
      const m = it.m;
      if (it.kind === 'puff') {
        m.position.addScaledVector(it.v, dt);
        it.v.multiplyScalar(0.92);
        m.scale.setScalar(it.s * (1 + k * 1.6));
        m.material.opacity = 0.75 * (1 - k);
      } else if (it.kind === 'confetti') {
        it.v.y -= 9 * dt;
        it.v.multiplyScalar(0.985);
        if (it.v.y < -1.6) it.v.y = -1.6;
        m.position.addScaledVector(it.v, dt);
        m.rotation.x += it.spin.x * dt; m.rotation.y += it.spin.y * dt;
      } else if (it.kind === 'spark') {
        it.v.y -= 6 * dt;
        m.position.addScaledVector(it.v, dt);
        m.scale.setScalar(1 - k);
      } else if (it.kind === 'foot') {
        m.material.opacity = 0.55 * (1 - Math.max(0, k - 0.5) * 2);
      } else if (it.kind === 'heart') {
        m.position.addScaledVector(it.v, dt);
        m.material.opacity = 1 - k;
      } else if (it.kind === 'ripple') {
        m.scale.setScalar(1 + k * 3);
        m.material.opacity = 0.8 * (1 - k);
      } else if (it.kind === 'plane') {
        m.visible = true;
        const t = Math.min(1, k);
        const p = it.curve.getPoint(t), p2 = it.curve.getPoint(Math.min(1, t + 0.02));
        m.position.copy(p);
        m.lookAt(p2); // for non-camera objects lookAt turns +Z (the asset's front) toward the target
      }
      if (it.life >= it.max) {
        this.scene.remove(m);
        if (it.kind === 'puff' || it.kind === 'ripple' || it.kind === 'heart' || it.kind === 'foot') m.material.dispose();
        this.items.splice(i, 1);
      }
    }
  }
}

export function makeGlowSprite(color = '#FFE6A3', size = 1, { additive = true, opacity = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, color);
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  s.scale.setScalar(size);
  return s;
}

export { clay };
