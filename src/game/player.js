// The playable clay Mehfooz: movement, jumping, click-to-walk, seats, and animation.
import * as THREE from 'three';
import { spawn, hasAsset, getClip } from '../world/assets.js';
import { clay } from '../world/materials.js';

// Tuned for an adult of 1.65 m in a toy world: brisk walk, energetic run, a jump of about 0.8 m.
const WALK = 2.1, RUN = 4.7, ACCEL = 12, GRAV = 20, JUMP_V = 5.8, COYOTE = 0.12, BUFFER = 0.14;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
function angleLerp(a, b, t) { let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI; if (d < -Math.PI) d += Math.PI * 2; return a + d * t; }

export class Player {
  constructor(scene, physics) {
    this.physics = physics;
    this.object = new THREE.Group();
    this.object.name = 'player-root';
    scene.add(this.object);
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.vy = 0;
    this.yaw = Math.PI;
    this.grounded = true;
    this.groundY = 0;
    this.mode = 'free'; // free | seated | locked
    this.seat = null;
    this.walkTarget = null;
    this.blockedFor = 0;
    this.surface = 'grass';
    this.stepPhase = 0;
    this.events = {};

    if (hasAsset('player')) {
      this.model = spawn('player');
      this.mixer = new THREE.AnimationMixer(this.model);
      this.actions = {};
      for (const n of ['idle', 'walk', 'run', 'jump', 'fall', 'land', 'wave', 'interact', 'sit', 'swing', 'slide', 'kick', 'cheer', 'type']) {
        const c = getClip(`player_${n}`);
        if (c) this.actions[n] = this.mixer.clipAction(c);
      }
      this.head = null;
      this.model.traverse((o) => { if (o.isBone && /head/i.test(o.name) && !this.head) this.head = o; });
      this.natWalk = this.strideSpeed(getClip('player_walk')) || WALK;
      this.natRun = this.strideSpeed(getClip('player_run')) || RUN;
    } else {
      this.model = makeStandIn();
      this.standIn = true;
      this.natWalk = WALK;
      this.natRun = RUN;
    }
    this.object.add(this.model);
    this.addSilhouette();
    this.current = null;
    this.play('idle');
    this.shadowBlob = makeBlob();
    scene.add(this.shadowBlob);
  }

  /**
   * The ground speed an in-place cycle was authored for: sample how far a foot travels front-to-back
   * over the clip (two steps per cycle). Playing the clip at speed / natural speed keeps feet planted.
   */
  strideSpeed(clip) {
    if (!clip) return null;
    let foot = null;
    this.model.traverse((o) => { if (!foot && o.isBone && /(foot|ankle|toe)/i.test(o.name) && /(^|[._-])l($|[._-])|left|_l$|\.l$/i.test(o.name)) foot = o; });
    if (!foot) this.model.traverse((o) => { if (!foot && o.isBone && /(foot|ankle|toe)/i.test(o.name)) foot = o; });
    if (!foot) return null;
    const mixer = new THREE.AnimationMixer(this.model);
    const action = mixer.clipAction(clip);
    action.play();
    const inv = new THREE.Matrix4();
    let minZ = Infinity, maxZ = -Infinity;
    const p = new THREE.Vector3();
    for (let i = 0; i <= 32; i++) {
      mixer.setTime((i / 32) * clip.duration);
      this.model.updateMatrixWorld(true);
      inv.copy(this.model.matrixWorld).invert();
      foot.getWorldPosition(p).applyMatrix4(inv);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    action.stop();
    mixer.uncacheRoot(this.model);
    const range = maxZ - minZ;
    if (!(range > 0.05)) return null;
    return (2 * range) / clip.duration;
  }

  /** A soft silhouette drawn only where walls hide the character (depth test inverted), so he never gets lost. */
  addSilhouette() {
    // The character's own pixels mark the stencil; the silhouette draws only where it is hidden AND unmarked,
    // so overlapping limbs never tint the visible body.
    const mat = new THREE.MeshBasicMaterial({
      color: '#2C3567', transparent: true, opacity: 0.32, depthWrite: false, depthFunc: THREE.GreaterDepth,
      stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc, stencilZPass: THREE.KeepStencilOp,
    });
    const extra = [];
    this.model.traverse((o) => {
      if (!o.isMesh) return;
      const mark = (mm) => { const c = mm.clone(); c.stencilWrite = true; c.stencilRef = 1; c.stencilFunc = THREE.AlwaysStencilFunc; c.stencilZPass = THREE.ReplaceStencilOp; return c; };
      o.material = Array.isArray(o.material) ? o.material.map(mark) : mark(o.material);
      let m;
      if (o.isSkinnedMesh) { m = new THREE.SkinnedMesh(o.geometry, mat); m.bind(o.skeleton, o.bindMatrix); }
      else m = new THREE.Mesh(o.geometry, mat);
      m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale);
      m.renderOrder = 10;
      m.castShadow = m.receiveShadow = false;
      m.frustumCulled = false;
      extra.push([o.parent, m]);
    });
    for (const [parent, m] of extra) parent.add(m);
  }

  on(name, fn) { (this.events[name] ||= []).push(fn); }
  emit(name, v) { (this.events[name] || []).forEach((f) => f(v)); }

  place(x, z, yawDeg = 180) {
    const g = this.physics.ground(x, z) ?? 0;
    this.pos.set(x, g, z);
    this.groundY = g;
    this.yaw = THREE.MathUtils.degToRad(yawDeg);
    this.sync();
  }

  play(name, { fade = 0.22, once = false, timeScale = 1 } = {}) {
    if (this.standIn) { this.current = name; return; }
    const a = this.actions[name] || this.actions.idle;
    if (!a) return;
    if (this.currentAction === a && !once) { a.timeScale = timeScale; return; }
    a.reset();
    a.timeScale = timeScale;
    a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    a.clampWhenFinished = once;
    a.enabled = true;
    if (this.currentAction) a.crossFadeFrom(this.currentAction, fade, false);
    a.play();
    this.currentAction = a;
    this.current = name;
  }

  /** Play a one-shot gesture, then return to the base loop. */
  gesture(name, onDone) {
    this.gestureUntil = performance.now() + this.clipDuration(name) * 1000;
    this.play(name, { once: true });
    this.gestureDone = onDone;
  }
  clipDuration(name) { return this.actions?.[name]?.getClip().duration ?? 1.2; }

  walkTo(point) { this.path = null; this.walkTarget = point.clone(); this.blockedFor = 0; }

  /** Follow a list of {x, z} waypoints (from the nav graph). */
  followPath(points) {
    if (!points || !points.length) return false;
    this.path = points.map((p) => new THREE.Vector3(p.x, 0, p.z));
    this.walkTarget = this.path.shift();
    this.blockedFor = 0;
    return true;
  }

  /** Where the hips are (in the model's own frame) in the first frame of a clip. Cached per clip. */
  hipsIn(loop) {
    this.hipsCache ||= {};
    if (this.hipsCache[loop]) return this.hipsCache[loop];
    let hips = null;
    this.model.traverse((o) => { if (!hips && o.isBone && /hips|pelvis/i.test(o.name)) hips = o; });
    const clip = this.actions?.[loop]?.getClip();
    if (!hips || !clip) return (this.hipsCache[loop] = new THREE.Vector3(0, 0.45, 0));
    // Sample with a throwaway mixer on a clone so the live animation state is untouched.
    const mixer = new THREE.AnimationMixer(this.model);
    const a = mixer.clipAction(clip);
    a.play();
    mixer.setTime(Math.min(0.2, clip.duration * 0.25));
    const saved = { p: this.object.position.clone(), q: this.object.quaternion.clone(), s: this.model.scale.clone() };
    this.object.position.set(0, 0, 0); this.object.quaternion.identity(); this.model.scale.set(1, 1, 1);
    this.object.updateMatrixWorld(true);
    const p = hips.getWorldPosition(new THREE.Vector3());
    this.object.position.copy(saved.p); this.object.quaternion.copy(saved.q); this.model.scale.copy(saved.s);
    a.stop();
    mixer.uncacheRoot(this.model);
    return (this.hipsCache[loop] = p);
  }

  /** Sit (or ride) at a transform; loop is the animation name. position = the seat surface point. */
  setSeat({ position, yaw, loop = 'sit', follow = null }) {
    this.mode = 'seated';
    this.seat = { position: position.clone(), yaw, loop, follow, hips: this.standIn ? new THREE.Vector3(0, 0.3, 0) : this.hipsIn(loop) };
    this.walkTarget = null;
    this.vel.set(0, 0, 0);
    this.play(loop);
  }
  clearSeat(exitTo) {
    this.mode = 'free';
    this.seat = null;
    if (exitTo) {
      const g = this.physics.ground(exitTo.x, exitTo.z) ?? this.pos.y;
      this.pos.set(exitTo.x, g, exitTo.z);
    }
    this.play('idle');
  }

  update(dt, input, cam) {
    if (this.mixer) this.mixer.update(dt);
    if (this.mode === 'seated') {
      const s = this.seat;
      // Place the body so its hips rest just above the seat surface (the hip joint sits ~8 cm above it).
      const HIP_ABOVE_SEAT = 0.08;
      if (s.follow) {
        const seatPos = s.follow.getWorldPosition(new THREE.Vector3());
        const q = new THREE.Quaternion();
        s.follow.getWorldQuaternion(q);
        this.yaw = new THREE.Euler().setFromQuaternion(q, 'YXZ').y + (s.yawOffset || 0);
        const up = new THREE.Vector3(0, HIP_ABOVE_SEAT, 0).applyQuaternion(q);
        this.pos.copy(seatPos).add(up).sub(s.hips.clone().applyQuaternion(q));
        this.sync(dt);
        this.object.quaternion.copy(q); // ride the seat: tilt with the swing or seesaw
        return;
      }
      const yq = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.yaw);
      this.pos.copy(s.position).add(new THREE.Vector3(0, HIP_ABOVE_SEAT, 0)).sub(s.hips.clone().applyQuaternion(yq));
      this.yaw = s.yaw;
      this.sync(dt);
      return;
    }
    if (this.mode === 'locked') { this.sync(dt); return; }

    const ax = input.axis();
    const { forward, right } = cam.basis();
    const wish = new THREE.Vector3();
    let run = ax.run;
    if (Math.abs(ax.x) + Math.abs(ax.z) > 0.05) {
      wish.addScaledVector(right, ax.x).addScaledVector(forward, -ax.z);
      this.walkTarget = null;
      this.path = null;
    } else if (this.walkTarget) {
      const d = new THREE.Vector3(this.walkTarget.x - this.pos.x, 0, this.walkTarget.z - this.pos.z);
      const dist = d.length();
      const last = !this.path || !this.path.length;
      if (dist < (last ? 0.25 : 0.7)) {
        if (!last) this.walkTarget = this.path.shift();
        else { this.walkTarget = null; this.emit('arrived'); }
      } else {
        const remain = dist + (this.path ? this.path.reduce((s, p, i, arr) => s + (i ? p.distanceTo(arr[i - 1]) : p.distanceTo(this.walkTarget)), 0) : 0);
        wish.copy(d.normalize()).multiplyScalar(last ? Math.min(1, dist / 0.8 + 0.3) : 1);
        run = remain > 7;
      }
    }
    // Wading through the shallows is slower (no running at full speed in knee-deep water).
    const inWater = this.surface === 'water' && this.pos.y < -0.6;
    const speed = (run ? RUN : WALK) * (inWater ? 0.55 : 1);
    this.inWater = inWater;
    // Turning: when the wish direction is far from where the body faces, ease the speed down so the
    // character turns into the new direction instead of sliding sideways (no moonwalking).
    let turnFactor = 1;
    if (wish.lengthSq() > 0.0025 && this.grounded) {
      const wishYaw = Math.atan2(wish.x, wish.z);
      let d = Math.abs(((wishYaw - this.yaw + Math.PI) % (Math.PI * 2)) - Math.PI);
      if (d > Math.PI) d = Math.PI * 2 - d;
      turnFactor = 0.4 + 0.6 * Math.max(0, Math.cos(Math.min(d, Math.PI / 2)));
    }
    const targetVel = wish.multiplyScalar(speed * turnFactor);
    // Snappier start than stop, gentle in the air.
    const accelerating = targetVel.lengthSq() > this.vel.x * this.vel.x + this.vel.z * this.vel.z;
    const k = this.grounded ? (accelerating ? ACCEL : ACCEL * 0.75) : ACCEL * 0.3;
    this.vel.x = damp(this.vel.x, targetVel.x, k, dt);
    this.vel.z = damp(this.vel.z, targetVel.z, k, dt);

    // Jump with coyote time (a moment after leaving an edge) and buffering (pressed just before landing).
    this.coyote = this.grounded ? COYOTE : Math.max(0, (this.coyote || 0) - dt);
    if (input.jumpNow) this.jumpBuffer = BUFFER;
    else this.jumpBuffer = Math.max(0, (this.jumpBuffer || 0) - dt);
    if (this.jumpBuffer > 0 && (this.grounded || this.coyote > 0) && this.vy <= 0.01) {
      this.vy = JUMP_V;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.jumpHeldAtStart = true;
      this.play('jump', { once: true, fade: 0.08 });
      this.emit('jump');
    }
    // Variable height: releasing jump early cuts the rise.
    if (!this.grounded && this.vy > 0 && !input.jumpHeld?.()) this.vy -= GRAV * 1.4 * dt;

    // horizontal move with collision
    const res = this.physics.move(this.pos.x, this.pos.z, this.pos.y, this.vel.x * dt, this.vel.z * dt, { airborne: !this.grounded, water: true });
    if (res.blocked && this.walkTarget) {
      // steer around: try sideways directions
      const base = Math.atan2(this.vel.x, this.vel.z);
      for (const off of [0.6, -0.6, 1.2, -1.2]) {
        const a = base + off, s = Math.hypot(this.vel.x, this.vel.z) * dt;
        const r2 = this.physics.move(this.pos.x, this.pos.z, this.pos.y, Math.sin(a) * s, Math.cos(a) * s, { airborne: !this.grounded, water: true });
        if (!r2.blocked) { res.x = r2.x; res.z = r2.z; res.ground = r2.ground; res.blocked = false; break; }
      }
      this.blockedFor += dt;
      if (this.blockedFor > 1.2) this.walkTarget = null;
    } else this.blockedFor = 0;
    const movedX = res.x - this.pos.x, movedZ = res.z - this.pos.z;
    this.pos.x = res.x;
    this.pos.z = res.z;
    this.groundY = res.ground;
    this.surface = this.physics.lastTag || this.surface;

    // vertical
    if (!this.grounded) {
      this.vy = Math.max(-22, this.vy - GRAV * (this.vy < 0 ? 1.25 : 1) * dt); // falls a little faster than it rises
      this.pos.y += this.vy * dt;
      if (this.pos.y <= this.groundY && this.vy <= 0) {
        this.pos.y = this.groundY;
        const hard = this.vy < -7;
        this.vy = 0;
        this.grounded = true;
        this.emit('land', { hard });
        this.landSquash = hard ? 1 : 0.6;
        if (hard && this.actions?.land) this.gesture('land');
      }
    } else {
      const drop = this.pos.y - this.groundY;
      if (drop > 0.55) { this.grounded = false; this.vy = 0; } // a real ledge: fall
      else if (drop > 0) this.pos.y = Math.max(this.groundY, this.pos.y - Math.max(drop * 18, 3.5) * dt); // stick to steps going down
      else this.pos.y = damp(this.pos.y, this.groundY, 24, dt); // ease up onto steps
    }

    // facing: turn faster when nearly stopped, smoothly while moving
    const hs = Math.hypot(movedX, movedZ) / Math.max(dt, 1e-4);
    const wishSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (wishSpeed > 0.25) this.yaw = angleLerp(this.yaw, Math.atan2(this.vel.x, this.vel.z), 1 - Math.exp(-(hs < 1.5 ? 16 : 11) * dt));

    // animation state; walk/run play at the speed their stride was authored for, so feet do not slide
    const gesturing = this.gestureUntil && performance.now() < this.gestureUntil;
    if (gesturing && hs > 0.5) this.gestureUntil = 0;
    if (!gesturing) {
      if (this.gestureUntil) { this.gestureUntil = 0; this.gestureDone?.(); this.gestureDone = null; }
      const runFrom = (WALK + RUN) / 2;
      if (!this.grounded) { if (this.vy < -1 && this.current !== 'fall') this.play('fall', { fade: 0.25 }); }
      else if (hs > runFrom) this.play('run', { timeScale: THREE.MathUtils.clamp(hs / this.natRun, 0.7, 2.3) });
      else if (hs > 0.3) this.play('walk', { timeScale: THREE.MathUtils.clamp(hs / this.natWalk, 0.55, 1.9) });
      else this.play('idle', { fade: 0.3 });
    }
    // footsteps follow the gait cycle (two per cycle)
    if (this.grounded && hs > 0.3) {
      const a = this.currentAction;
      const cyc = a ? a.getClip().duration / Math.max(0.1, a.timeScale) : 0.8;
      this.stepPhase += dt / (cyc / 2);
      if (this.stepPhase >= 1) { this.stepPhase -= 1; this.emit('step', { surface: this.surface, run: hs > (WALK + RUN) / 2 }); }
    }
    this.speed = hs;
    this.sync(dt);
  }

  sync(dt = 0) {
    this.object.position.copy(this.pos);
    this.object.rotation.set(0, this.yaw, 0);
    // landing squash
    if (this.landSquash) {
      this.landSquash = Math.max(0, this.landSquash - dt * 5);
      const s = 1 - Math.sin(this.landSquash * Math.PI) * 0.12;
      this.model.scale.set(1 + (1 - s) * 0.6, s, 1 + (1 - s) * 0.6);
    }
    if (this.standIn) animateStandIn(this.model, this.current, this.speed || 0, performance.now() / 1000);
    const gy = this.physics.ground(this.pos.x, this.pos.z, 0) ?? this.groundY;
    this.shadowBlob.position.set(this.pos.x, gy + 0.02, this.pos.z);
    const h = Math.max(0, this.pos.y - gy);
    this.shadowBlob.scale.setScalar(Math.max(0.5, 1 - h * 0.25));
    this.shadowBlob.material.opacity = 0.32 * Math.max(0.3, 1 - h * 0.3);
  }

  /** Turn the head toward a world point (only with a rigged model). */
  lookAt(point, weight = 1) {
    if (!this.head || !point) return;
    const local = this.object.worldToLocal(point.clone());
    const yaw = THREE.MathUtils.clamp(Math.atan2(local.x, local.z), -0.9, 0.9) * weight;
    this.head.rotation.y = damp(this.head.rotation.y, yaw, 6, 1 / 60);
  }
}

/** Hips position (model frame) in an early frame of `clip`, for seating any rigged character. */
export function sampleHips(model, clip) {
  let hips = null;
  model.traverse((o) => { if (!hips && o.isBone && /hips|pelvis/i.test(o.name)) hips = o; });
  if (!hips || !clip) return new THREE.Vector3(0, 0.45, 0);
  const saved = { p: model.position.clone(), q: model.quaternion.clone() };
  model.position.set(0, 0, 0); model.quaternion.identity();
  const mixer = new THREE.AnimationMixer(model);
  const a = mixer.clipAction(clip);
  a.play();
  mixer.setTime(Math.min(0.2, clip.duration * 0.25));
  model.updateMatrixWorld(true);
  const out = hips.getWorldPosition(new THREE.Vector3());
  a.stop();
  mixer.uncacheRoot(model);
  model.position.copy(saved.p); model.quaternion.copy(saved.q);
  model.updateMatrixWorld(true);
  return out;
}

function makeBlob() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, 'rgba(40,40,60,1)');
  grd.addColorStop(1, 'rgba(40,40,60,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.3 }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

// ---------- stand-in character (used until the Blender character pack exists) ----------
function makeStandIn() {
  const g = new THREE.Group();
  const add = (geo, pal, x, y, z, name) => { const m = new THREE.Mesh(geo, clay(pal)); m.position.set(x, y, z); m.castShadow = true; if (name) m.name = name; g.add(m); return m; };
  const body = new THREE.Group(); body.name = 'body'; g.add(body);
  const legL = new THREE.Group(); legL.position.set(-0.09, 0.32, 0); legL.name = 'legL';
  const legR = new THREE.Group(); legR.position.set(0.09, 0.32, 0); legR.name = 'legR';
  for (const leg of [legL, legR]) {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.18, 6, 12), clay('pal_ink')); m.position.y = -0.15; m.castShadow = true; leg.add(m);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 10), clay('pal_white')); s.scale.set(1, 0.6, 1.4); s.position.set(0, -0.3, 0.03); leg.add(s);
    g.add(leg);
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.18, 8, 16), clay('pal_tan')); torso.position.y = 0.52; torso.castShadow = true; body.add(torso);
  const tee = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), clay('pal_navy')); tee.scale.set(1, 1.3, 0.5); tee.position.set(0, 0.53, 0.16); body.add(tee);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.055, 10, 20), clay('pal_fur')); collar.rotation.x = Math.PI / 2; collar.position.y = 0.68; body.add(collar);
  const armL = new THREE.Group(); armL.position.set(-0.22, 0.64, 0); armL.name = 'armL';
  const armR = new THREE.Group(); armR.position.set(0.22, 0.64, 0); armR.name = 'armR';
  for (const arm of [armL, armR]) {
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.16, 6, 12), clay('pal_tan')); a.position.y = -0.12; a.castShadow = true; arm.add(a);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), clay('pal_skin')); h.position.y = -0.25; arm.add(h);
    body.add(arm);
  }
  const head = new THREE.Group(); head.position.y = 0.9; head.name = 'head'; body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18), clay('pal_skin')); skull.scale.set(1, 1.02, 0.95); skull.castShadow = true; head.add(skull);
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), clay('pal_ink')); beard.position.set(0, -0.03, 0.03); beard.scale.set(1.04, 1.05, 1.0); head.add(beard);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), clay('pal_ink')); cap.position.y = 0.04; head.add(cap);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.025, 20, 1, false, -Math.PI / 2, Math.PI), clay('pal_ink')); brim.position.set(0, 0.05, 0.16); brim.scale.set(1, 1, 0.9); head.add(brim);
  for (const x of [-0.075, 0.075]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), clay('pal_ink')); e.position.set(x, 0.0, 0.2); head.add(e); }
  return g;
}

function animateStandIn(g, state, speed, t) {
  const legL = g.getObjectByName('legL'), legR = g.getObjectByName('legR'), armL = g.getObjectByName('armL'), armR = g.getObjectByName('armR'), body = g.getObjectByName('body');
  const moving = state === 'walk' || state === 'run';
  const f = state === 'run' ? 11 : 7.5, amp = state === 'run' ? 0.9 : 0.55;
  const s = moving ? Math.sin(t * f) * amp : 0;
  const seated = ['sit', 'swing', 'slide', 'type'].includes(state);
  legL.rotation.x = seated ? -1.45 : s; legR.rotation.x = seated ? -1.45 : -s;
  armL.rotation.x = state === 'slide' ? -2.8 : -s * 0.8; armR.rotation.x = state === 'slide' ? -2.8 : state === 'wave' ? -2.6 + Math.sin(t * 12) * 0.3 : s * 0.8;
  armR.rotation.z = state === 'wave' ? 0.4 : 0;
  body.position.y = moving ? Math.abs(Math.cos(t * f)) * 0.04 : Math.sin(t * 2) * 0.008;
  body.rotation.x = state === 'run' ? 0.12 : 0;
  g.position.y = seated ? -0.3 : 0;
}
