// Ambient life: duck families, jumping fish, bobbing boats and buoys, gulls, butterflies, balloons, walkers.
import * as THREE from 'three';
import { spawn, hasAsset, getClip } from './assets.js';
import { WATER_Y } from './water.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export class Ambient {
  constructor(scene, world, physics, nav, fx, decor) {
    this.scene = scene; this.world = world; this.physics = physics; this.nav = nav; this.fx = fx;
    this.t = 0;
    this.r = rng(1234);
    this.ducks = []; this.fish = []; this.bobbers = []; this.gulls = []; this.butterflies = []; this.balloons = []; this.walkers = [];
    this.setupDucks();
    this.setupFish();
    for (const rec of decor.waterProps) this.bobbers.push({ obj: rec.obj, base: rec.obj.position.clone(), ph: this.r() * 6 });
    this.setupGulls();
    this.setupButterflies(decor.flowers);
    for (const rec of decor.balloons) this.balloons.push({ obj: rec.obj, base: rec.obj.position.clone().add(V(0, 1.3, 0)), ph: this.r() * 6, popped: 0 });
    this.setupWalkers();
    // Standing townsfolk placed as story props (a kid by the school, and so on) breathe and look around.
    this.idlers = (decor.idlers || []).map((rec) => {
      const mixer = new THREE.AnimationMixer(rec.obj);
      const c = getClip('npc_idle');
      if (c) { const a = mixer.clipAction(c); a.time = this.r() * c.duration; a.play(); }
      return mixer;
    });
  }

  waterPoint(minDist = 2, maxDist = 6) {
    // a point in open water near some island edge
    const isl = Object.values(this.world.islands);
    for (let k = 0; k < 40; k++) {
      const i = isl[Math.floor(this.r() * isl.length)];
      const t = i.tiles[Math.floor(this.r() * i.tiles.length)];
      const a = this.r() * Math.PI * 2, d = 2.2 + minDist + this.r() * (maxDist - minDist);
      const x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
      if (this.physics.ground(x, z, -1.2) === null) return V(x, WATER_Y, z);
    }
    return null;
  }

  setupDucks() {
    if (!hasAsset('duck')) return;
    for (let f = 0; f < 4; f++) {
      const c = this.waterPoint(2.5, 5);
      if (!c) continue;
      const family = { c, rad: 2.5 + this.r() * 2, speed: (0.12 + this.r() * 0.08) * (this.r() < 0.5 ? 1 : -1), ph: this.r() * 6, members: [] };
      const n = 1 + Math.floor(this.r() * 3);
      for (let i = 0; i <= n; i++) {
        const o = spawn(i === 0 ? 'duck' : hasAsset('duckling') ? 'duckling' : 'duck');
        if (i > 0 && !hasAsset('duckling')) o.scale.setScalar(0.6);
        this.scene.add(o);
        family.members.push(o);
      }
      this.ducks.push(family);
    }
  }

  setupFish() {
    if (!hasAsset('fish')) return;
    for (let i = 0; i < 5; i++) {
      const o = spawn('fish', { shadows: false });
      o.visible = false;
      this.scene.add(o);
      this.fish.push({ obj: o, next: 2 + this.r() * 8, t: -1, from: null, to: null });
    }
  }

  setupGulls() {
    const name = hasAsset('seagull') ? 'seagull' : hasAsset('bird') ? 'bird' : null;
    if (!name) return;
    for (let i = 0; i < 6; i++) {
      const o = spawn(name, { shadows: true });
      this.scene.add(o);
      const c = this.world.wallCenter || V(0, 0, 0);
      this.gulls.push({ obj: o, c: V(c.x + (this.r() - 0.5) * 50, 0, c.z + (this.r() - 0.5) * 40), rad: 6 + this.r() * 10, h: 8 + this.r() * 5, sp: 0.25 + this.r() * 0.2, ph: this.r() * 6 });
    }
  }

  setupButterflies(flowers) {
    if (!hasAsset('butterfly') || !flowers.length) return;
    for (let i = 0; i < Math.min(14, flowers.length); i++) {
      const home = flowers[Math.floor(this.r() * flowers.length)].clone();
      const o = spawn('butterfly', { shadows: false });
      this.scene.add(o);
      this.butterflies.push({ obj: o, home, ph: this.r() * 6, sp: 0.6 + this.r() * 0.6 });
    }
  }

  setupWalkers() {
    const kinds = ['npc_a', 'npc_b', 'npc_c', 'npc_d', 'npc_e'].filter(hasAsset);
    const walk = getClip('npc_walk') || getClip('player_walk');
    const idle = getClip('npc_idle') || getClip('player_idle');
    if (!kinds.length || !walk || !this.nav.nodes.length) return;
    const routes = [['home', 'services'], ['karobari', 'park'], ['whatsapp', 'home'], ['schooliee', 'services'], ['leadprofit', 'home'], ['mobile', 'cricket']];
    routes.forEach(([a, b], i) => {
      const A = this.world.islands[a], B = this.world.islands[b];
      if (!A || !B) return;
      const o = spawn(kinds[i % kinds.length]);
      this.scene.add(o);
      const mixer = new THREE.AnimationMixer(o);
      const wa = mixer.clipAction(walk), ia = idle ? mixer.clipAction(idle) : null;
      wa.play();
      const start = A.tiles[Math.floor(this.r() * A.tiles.length)];
      o.position.set(start.x, start.y, start.z);
      this.walkers.push({ obj: o, mixer, wa, ia, ends: [A, B], leg: 1, path: null, wait: this.r() * 3, speed: 1.05 + this.r() * 0.3 });
    });
  }

  update(dt, player) {
    this.t += dt;
    const t = this.t;
    for (const m of this.idlers) m.update(dt);
    for (const f of this.ducks) {
      f.ph += f.speed * dt;
      f.members.forEach((o, i) => {
        const a = f.ph - i * 0.32 * Math.sign(f.speed);
        o.position.set(f.c.x + Math.cos(a) * f.rad, WATER_Y + 0.02 + Math.sin(t * 3 + i) * 0.015, f.c.z + Math.sin(a) * f.rad);
        o.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)) * Math.sign(f.speed) + (f.speed < 0 ? Math.PI : 0);
        const head = o.getObjectByName('head');
        if (head) head.rotation.x = Math.sin(t * 2 + i * 1.7) * 0.15;
      });
    }
    for (const fi of this.fish) {
      if (fi.t < 0) {
        fi.next -= dt;
        if (fi.next <= 0) {
          const p = this.waterPoint(1.5, 6);
          if (!p) { fi.next = 3; continue; }
          const a = this.r() * Math.PI * 2;
          fi.from = p; fi.to = p.clone().add(V(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6)); fi.t = 0;
          fi.obj.visible = true;
          this.fx.ripple(p, '#F2FAFA');
        }
        continue;
      }
      fi.t += dt / 0.9;
      const k = Math.min(1, fi.t);
      const pos = fi.from.clone().lerp(fi.to, k);
      pos.y = WATER_Y + Math.sin(k * Math.PI) * 1.1;
      fi.obj.position.copy(pos);
      fi.obj.lookAt(fi.to.x, WATER_Y + Math.cos(k * Math.PI) * 1.1, fi.to.z);
      if (k >= 1) { fi.t = -1; fi.next = 3 + this.r() * 9; fi.obj.visible = false; this.fx.ripple(fi.to, '#F2FAFA'); }
    }
    for (const b of this.bobbers) {
      b.obj.position.y = b.base.y + Math.sin(t * 1.3 + b.ph) * 0.06;
      b.obj.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.05;
      b.obj.rotation.x = Math.cos(t * 0.9 + b.ph) * 0.04;
    }
    for (const g of this.gulls) {
      const a = t * g.sp + g.ph;
      g.obj.position.set(g.c.x + Math.cos(a) * g.rad, g.h + Math.sin(t * 0.7 + g.ph) * 0.8, g.c.z + Math.sin(a) * g.rad);
      g.obj.rotation.y = -a;
      g.obj.rotation.z = 0.25;
      const wl = g.obj.getObjectByName('wing_l'), wr = g.obj.getObjectByName('wing_r');
      const flap = Math.sin(t * 6 + g.ph) * 0.5;
      if (wl) wl.rotation.y = flap;
      if (wr) wr.rotation.y = -flap;
    }
    for (const b of this.butterflies) {
      const a = t * b.sp + b.ph;
      b.obj.position.set(b.home.x + Math.cos(a) * 0.9 + Math.sin(a * 2.3) * 0.3, b.home.y + 0.3 + Math.abs(Math.sin(a * 3)) * 0.4, b.home.z + Math.sin(a) * 0.9);
      b.obj.rotation.y = -a + Math.PI / 2;
      const flap = Math.sin(t * 22 + b.ph) * 0.9;
      const wl = b.obj.getObjectByName('wing_l'), wr = b.obj.getObjectByName('wing_r');
      if (wl) wl.rotation.y = flap; // wings hinge about the body's long axis (Y in the asset)
      if (wr) wr.rotation.y = -flap;
    }
    for (const b of this.balloons) {
      if (b.popped > 0) { b.popped -= dt; if (b.popped <= 0) { b.obj.visible = true; b.obj.scale.setScalar(0.01); } continue; }
      if (b.obj.scale.x < 1) b.obj.scale.setScalar(Math.min(1, b.obj.scale.x + dt * 2));
      b.obj.position.set(b.base.x + Math.sin(t * 0.7 + b.ph) * 0.15, b.base.y + Math.sin(t * 1.1 + b.ph) * 0.25, b.base.z);
      b.obj.rotation.z = Math.sin(t * 0.9 + b.ph) * 0.12;
      if (player && Math.hypot(player.pos.x - b.obj.position.x, player.pos.z - b.obj.position.z) < 0.6 && player.pos.y + 1.6 > b.obj.position.y - 0.4) {
        b.obj.visible = false;
        b.popped = 6;
        this.fx.confetti(b.obj.position.clone(), 30, 3);
        this.onPop?.();
      }
    }
    for (const w of this.walkers) {
      w.mixer.update(dt);
      if (w.wait > 0) {
        w.wait -= dt;
        if (w.ia && !w.idling) { w.wa.fadeOut(0.3); w.ia.reset().fadeIn(0.3).play(); w.idling = true; }
        continue;
      }
      if (!w.path || !w.path.length) {
        w.leg = 1 - w.leg;
        const dest = w.ends[w.leg];
        const t2 = dest.tiles[Math.floor(this.r() * dest.tiles.length)];
        w.path = this.nav.path(w.obj.position.x, w.obj.position.z, t2.x + (this.r() - 0.5) * 1.5, t2.z + (this.r() - 0.5) * 1.5) || [];
        if (!w.path.length) { w.wait = 2; continue; }
        if (w.idling) { w.ia?.fadeOut(0.3); w.wa.reset().fadeIn(0.3).play(); w.idling = false; }
      }
      const tgt = w.path[0];
      const dx = tgt.x - w.obj.position.x, dz = tgt.z - w.obj.position.z, d = Math.hypot(dx, dz);
      if (d < 0.4) { w.path.shift(); if (!w.path.length) w.wait = 3 + this.r() * 5; continue; }
      // give way to the player
      let sp = w.speed;
      if (player && Math.hypot(player.pos.x - w.obj.position.x, player.pos.z - w.obj.position.z) < 1.0) sp *= 0.2;
      w.obj.position.x += (dx / d) * sp * dt;
      w.obj.position.z += (dz / d) * sp * dt;
      const g = this.physics.ground(w.obj.position.x, w.obj.position.z, 0);
      if (g !== null) w.obj.position.y += (g - w.obj.position.y) * Math.min(1, dt * 10);
      const want = Math.atan2(dx, dz);
      let dy = ((want - w.obj.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (dy < -Math.PI) dy += Math.PI * 2;
      w.obj.rotation.y += dy * Math.min(1, dt * 8);
    }
  }
}
