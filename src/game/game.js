// Gameplay: interactions, the launch sequence, the guide parrot, townsfolk, the ball, collectibles.
import * as THREE from 'three';
import gsap from 'gsap';
import { spawn, hasAsset, getClip } from '../world/assets.js';
import { work, process, testimonials, profile } from '@shared/content.js';
import { bulbFacts } from '../world/map.js';
import { makeGlowSprite } from './fx.js';
import { sampleHips } from './player.js';
import { track } from '../core/analytics.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SIT_DROP = 0.0; // the seat empties are at hip height; the sit clip lowers the hips itself

const PARROT_LINES = {
  start: 'Salaam! I am Tota. Walk with WASD or click anywhere. Everything glowing can be used!',
  services: 'The bazaar sells what Mehfooz builds. Peek into each stall.',
  schooliee: 'An empty plot! Stand on the glowing seed and hold E to launch Schooliee.',
  karobari: 'Karobari turns a WhatsApp voice note into a live shop. Launch it!',
  whatsapp: 'The post office here sends thousands of messages a day. Launch it and watch.',
  leadprofit: 'The harbour is waiting for LeadProfit. Hold E on the seed.',
  dsme: 'DSME Globals needs its tower. You know what to do.',
  mobile: 'Ten mobile apps live in this park, once you launch it.',
  timeline: 'Climb Timeline Hill. Each flag is a chapter of the story.',
  garden: 'This garden grew from a year of GitHub commits. Every plant is a day.',
  park: 'Sit on a bench. People here have nice things to say about Mehfooz.',
  cricket: 'Fancy a shot? Kick the ball into the stumps!',
  lighthouse: 'Want to build something? Write to Mehfooz at the lighthouse mailbox.',
  home: 'This is home. His desk is under the canopy.',
};

export class Game {
  constructor(ctx) {
    Object.assign(this, ctx); // scene, cam, physics, world, player, ui, audio, fx, input
    this.state = { launched: new Set(), bulbs: new Set(), visited: new Set(), started: false };
    this.world.visited = this.state.visited;
    this.near = null;
    this.hold = 0;
    this.activity = null;
    this.idle = 0;
    this.time = 0;
    this.setupDistricts();
    this.setupNPCs();
    this.setupParrot();
    this.setupBall();
    this.setupBulbs();
    this.setupLighthouse();
    this.ui.onAction = (a) => { if (a === 'classic') this.ui.openClassic(); };
    this.footSide = 1;
    this.player.on('step', (s) => {
      this.audio.step(s.surface, s.run);
      if (s.run && Math.random() < 0.6) this.fx.puff(this.player.pos, 1, 0.2);
      if (s.surface === 'sand') { this.footSide = -this.footSide; this.fx.footprint(this.player.pos, this.player.yaw, this.footSide); }
      if (s.surface === 'water') this.fx.ripple(this.player.pos.clone().setY(-0.55), '#F4FBFB');
    });
    this.input.on('key', (k) => {
      if (this.activity || this.player.mode !== 'free' || this.ui.panelOpen) return;
      if (k === 'q') { this.player.gesture('wave'); this.ui.bubbleAt('emote', 'Salaam! 👋', this.player.object, 2.0, { ttl: 1600 }); }
      if (k === 'r') { this.player.gesture('cheer'); this.fx.confetti(this.player.pos.clone().add(V(0, 1.8, 0)), 24, 3); }
    });
    this.player.on('jump', () => { this.audio.jump(); this.fx.puff(this.player.pos, 3); });
    this.player.on('land', ({ hard }) => {
      if (this.player.surface === 'water') {
        this.audio.splash(true);
        const p = this.player.pos.clone().setY(-0.55);
        this.fx.ripple(p); setTimeout(() => this.fx.ripple(p), 150); this.fx.splash(p);
        return;
      }
      this.audio.land(); this.fx.puff(this.player.pos, hard ? 6 : 3, 0.4);
    });
  }

  // ---------- setup ----------
  setupDistricts() {
    for (const d of Object.values(this.world.districts)) {
      const glow = makeGlowSprite('#BFE6FF', 2.2);
      if (d.seed) { glow.position.copy(d.seed.position).add(V(0, 0.6, 0)); this.scene.add(glow); d.glow = glow; }
      d.scaffold = [];
    }
  }

  setupNPCs() {
    this.npcs = [];
    const kinds = ['npc_a', 'npc_b', 'npc_c'];
    for (const nb of this.world.npcBenches) {
      const bench = nb.rec.obj;
      const seat = bench.getObjectByName('seat');
      const npc = spawn(kinds[nb.index % 3]);
      const p = new THREE.Vector3();
      if (seat) seat.getWorldPosition(p); else p.set(nb.rec.x, nb.rec.y + 0.45, nb.rec.z);
      const side = V(-0.42, 0, 0).applyAxisAngle(V(0, 1, 0), nb.rec.yaw);
      npc.rotation.y = nb.rec.yaw;
      this.scene.add(npc);
      let mixer = null, actions = {};
      if (hasAsset(kinds[0])) {
        // Seat the hips on the bench, like the player.
        const hips = sampleHips(npc, getClip('npc_sit'));
        const yq = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), nb.rec.yaw);
        npc.position.copy(p).add(side).add(V(0, 0.08, 0)).sub(hips.applyQuaternion(yq));
        mixer = new THREE.AnimationMixer(npc);
        for (const n of ['idle', 'sit', 'talk', 'wave']) { const c = getClip(`npc_${n}`); if (c) actions[n] = mixer.clipAction(c); }
        actions.sit?.play();
      } else {
        npc.position.copy(p).add(side);
        npc.position.y = nb.rec.y + 0.05;
      }
      this.npcs.push({ npc, mixer, actions, bench: nb.rec, index: nb.index, talking: false });
    }
  }

  setupParrot() {
    const has = hasAsset('parrot');
    this.parrot = { obj: has ? spawn('parrot') : this.makeStandInParrot(), mode: 'perch', pos: new THREE.Vector3(), target: null, t: 0, said: new Set(), hintCooldown: 8 };
    this.scene.add(this.parrot.obj);
    if (has) {
      this.parrot.mixer = new THREE.AnimationMixer(this.parrot.obj);
      this.parrot.actions = {};
      for (const n of ['idle', 'fly', 'hop', 'talk']) { const c = getClip(`parrot_${n}`); if (c) this.parrot.actions[n] = this.parrot.mixer.clipAction(c); }
      this.parrot.actions.idle?.play();
    }
  }
  makeStandInParrot() {
    const g = new THREE.Group();
    const body = spawn('bird');
    if (!hasAsset('bird')) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: '#74C391', roughness: 0.9 }));
      m.scale.set(1, 1.2, 1.3);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 8), new THREE.MeshStandardMaterial({ color: '#F28C6F' }));
      beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.06, 0.18);
      g.add(m, beak);
    } else g.add(body);
    return g;
  }

  setupBall() {
    this.balls = this.world.balls.map((rec) => ({ rec, obj: rec.obj, home: rec.obj.position.clone(), vel: new THREE.Vector3(), y: rec.obj.position.y + 0.11, sunk: 0 }));
    this.balls.forEach((b) => (b.obj.position.y = b.y));
    this.stumps = this.world.stumps.map((rec) => ({ rec, down: 0 }));
  }

  setupBulbs() {
    for (const b of this.world.bulbs) {
      b.base = b.rec.obj.position.clone().add(V(0, 0.9, 0));
      b.rec.obj.position.copy(b.base);
      const g = makeGlowSprite('rgba(255,214,120,0.9)', 0.75, { additive: false, opacity: 0.55 });
      b.rec.obj.add(g);
    }
  }

  setupLighthouse() {
    const lh = this.world.props.find((p) => p.name === 'lighthouse');
    if (!lh) return;
    const lamp = lh.obj.getObjectByName('lamp');
    const top = new THREE.Vector3();
    if (lamp) lamp.getWorldPosition(top); else top.set(lh.x, lh.y + 6.8, lh.z);
    this.beacon = { top, glow: makeGlowSprite('#FFF1C2', 0.01), on: false, angle: 0 };
    this.beacon.glow.position.copy(top);
    this.scene.add(this.beacon.glow);
    // A soft beam that is brightest at the lamp and fades out along its length.
    const beamMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { opacity: { value: 0 }, color: { value: new THREE.Color('#FFF1C2') } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform float opacity; uniform vec3 color; varying vec2 vUv; void main(){ float a = pow(vUv.y, 2.2) * opacity; gl_FragColor = vec4(color * a, a); }',
    });
    Object.defineProperty(beamMat, 'opacity', { get: () => beamMat.uniforms.opacity.value, set: (v) => { if (beamMat.uniforms) beamMat.uniforms.opacity.value = v; } });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.4, 26, 32, 1, true), beamMat);
    beam.geometry.translate(0, -13, 0);
    beam.geometry.rotateZ(Math.PI / 2);
    beam.geometry.rotateY(0);
    beam.position.copy(top);
    this.scene.add(beam);
    this.beacon.beam = beam;
  }

  // ---------- start ----------
  start() {
    this.state.started = true;
    setTimeout(() => this.parrotSay('start', 7000), 2600);
  }

  // ---------- frame ----------
  update(dt, frame) {
    this.time += dt;
    const p = this.player;

    if (this.activity) this.updateActivity(dt, frame);
    else this.updateNearby(dt, frame);

    if (frame.click && !this.activity && !this.ui.panelOpen) this.handleClick(frame.click);

    this.pushFromPeople();
    this.updateDiscovery();
    this.updateParrot(dt);
    this.updateBalls(dt);
    this.updateBulbs(dt);
    this.updateNPCs(dt);
    this.updateDistrictIdle(dt);
    if (this.beacon?.on) { this.beacon.angle += dt * 0.9; this.beacon.beam.rotation.y = this.beacon.angle; }

    const moving = p.speed > 0.3 || frame.jump;
    this.idle = moving ? 0 : this.idle + dt;
  }

  // ---------- nearby interactables ----------
  available(it) {
    if (it.district && !this.state.launched.has(it.district)) return false;
    if (it.type === 'launch') return true;
    if (it.type === 'stumps') return false;
    return true;
  }

  updateNearby(dt, frame) {
    const p = this.player.pos;
    let best = null, bd = Infinity;
    for (const it of this.world.interactables) {
      if (!this.available(it)) continue;
      const d = Math.hypot(it.x - p.x, it.z - p.z);
      if (d < it.r && d < bd && Math.abs((it.y ?? 0) - p.y) < 1.2) { best = it; bd = d; }
    }
    this.near = best;
    if (!best) { this.ui.hidePrompt(); this.hold = 0; return; }
    if (best.type === 'launch') {
      const launched = this.state.launched.has(best.slug);
      if (launched) {
        this.ui.showPrompt('Read the case study');
        if (frame.action) this.openPanel(`project:${best.slug}`);
        return;
      }
      const name = work.projects.find((x) => x.slug === best.slug)?.name || 'project';
      this.hold = this.input.actionDown ? Math.min(1, this.hold + dt / 1.1) : Math.max(0, this.hold - dt * 3);
      this.ui.showPrompt(`Hold to launch ${name}`, { hold: this.hold });
      if (this.hold >= 1) { this.hold = 0; this.ui.hidePrompt(); this.launch(best.slug); }
      return;
    }
    this.ui.showPrompt(best.prompt || 'Use');
    if (frame.action) this.use(best);
  }

  handleClick(click) {
    const hit = this.pick(click);
    if (!hit) return;
    // Clicking near an interactable walks there and uses it on arrival.
    let target = null, bd = 2.4;
    for (const it of this.world.interactables) {
      if (!this.available(it)) continue;
      const d = Math.hypot(it.x - hit.x, it.z - hit.z);
      if (d < bd) { bd = d; target = it; }
    }
    const goal = target ? V(target.x, 0, target.z) : hit;
    if (this.physics.ground(goal.x, goal.z) === null && !target) return;
    this.walkPath(goal);
    this.fx.ripple(V(goal.x, this.physics.ground(goal.x, goal.z, 0) ?? 0, goal.z), '#FFFFFF');
    if (target && target.type !== 'launch') {
      const off = () => { this.player.events.arrived = []; if (this.near === target) this.use(target); };
      this.player.events.arrived = [off];
    }
  }

  pick(click) {
    const ray = new THREE.Raycaster();
    const ndc = V((click.clientX / innerWidth) * 2 - 1, -(click.clientY / innerHeight) * 2 + 1, 0);
    ray.setFromCamera(ndc, this.cam.camera);
    // Intersect the ground: step along the ray and find the first walkable point at its height.
    const o = ray.ray.origin, d = ray.ray.direction;
    for (let t = 5; t < 260; t += 0.25) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      const g = this.physics.ground(x, z, 0);
      if (g !== null && y <= g + 0.05) return V(x, g, z);
      if (y < -0.6) return null;
    }
    return null;
  }

  openPanel(id, onClose) {
    if (this.ui.openPanel(id, { onClose })) this.audio.open();
  }

  // ---------- using things ----------
  use(it) {
    const p = this.player;
    this.ui.hidePrompt();
    switch (it.type) {
      case 'panel':
        this.openPanel(it.panel);
        p.gesture('interact');
        break;
      case 'sit': this.startSit(it); break;
      case 'desk': this.startDesk(it); break;
      case 'swing': this.startSwing(it); break;
      case 'slide': this.startSlide(it); break;
      case 'seesaw': this.startSeesaw(it); break;
      case 'planes': this.sendPlanes(it, 9); p.gesture('wave'); break;
      case 'boat': this.launchBoat(it); break;
      case 'bell': this.ringBell(it); break;
      case 'service': this.serviceDemo(it); break;
      case 'phone': this.phoneDemo(it); break;
      case 'pet': this.pet(it); break;
      case 'honk': this.honk(it); break;
      case 'ring': this.audio.ding(); this.bounce(it.obj, 0.04); p.gesture('interact'); break;
      case 'wish': this.wish(it); break;
    }
  }

  /**
   * Services are shown by doing, not by a price board: each stall plays a short, clearly labelled example of
   * what that service does, as a little conversation above the stall, then opens the service card.
   */
  serviceDemo(it) {
    if (this.demoBusy) return;
    const scripts = {
      'whatsapp-ai': [
        ['customer', '🎤 Voice note: "Aaj 20 kilo aloo aaye hain, 60 rupay kilo."'],
        ['bot', '✓ Added: Potatoes · Rs 60/kg · 20 kg in stock'],
        ['bot', 'Your shop page is updated. Share the link with your customers.'],
      ],
      saas: [
        ['bot', 'Good morning! Attendance is in for all classes.'],
        ['bot', 'Parents of absent students have been notified on WhatsApp.'],
        ['bot', 'November fee challans are generated and ready to print.'],
      ],
      mobile: [
        ['bot', '📦 New delivery assigned · 2.4 km away'],
        ['bot', '📍 Live route updated on the map'],
        ['bot', '✓ Delivered · signature captured offline, synced when online'],
      ],
      desktop: [
        ['bot', '⏱ Scheduled run started: fee receipts for today'],
        ['bot', '✉ Receipts queued · sending one by one'],
        ['bot', '✓ All sent. Report saved to the dashboard'],
      ],
    };
    const lines = scripts[it.service] || [];
    const anchor = new THREE.Vector3();
    it.obj.getWorldPosition(anchor);
    anchor.y += 3.3;
    this.demoBusy = true;
    this.player.gesture('interact');
    const awning = it.obj.getObjectByName('awning');
    if (awning) gsap.fromTo(awning.rotation, { x: awning.rotation.x }, { x: awning.rotation.x - 0.25, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' });
    this.audio.open();
    this.ui.bubble('demo-head', '<small style="opacity:.6">Example of what I build</small>', { anchor: anchor.clone().add(V(0, 0.9, 0)), ttl: lines.length * 1600 + 900 });
    lines.forEach(([who, text], i) => {
      setTimeout(() => {
        this.ui.bubble('demo', `<span style="font-size:12px;opacity:.6">${who === 'customer' ? 'Customer' : 'Your system'}</span><br>${text}`, { anchor, ttl: 1700, kind: who === 'bot' ? 'parrot' : '', wide: true });
        this.audio.pop();
      }, 300 + i * 1600);
    });
    setTimeout(() => {
      this.demoBusy = false;
      this.openPanel(`service:${it.service}`);
    }, 300 + lines.length * 1600 + 200);
  }

  /** The giant phones light up, play a tap, and show what the apps do. */
  phoneDemo(it) {
    const screen = it.obj.getObjectByName('screen');
    this.player.gesture('interact');
    this.audio.pop();
    if (screen?.material) {
      const m = screen.material;
      gsap.fromTo(m.color, { r: 1.6, g: 1.6, b: 1.6 }, { r: 1, g: 1, b: 1, duration: 0.9 });
    }
    this.bounce(it.obj, 0.04);
    const p = new THREE.Vector3();
    it.obj.getWorldPosition(p);
    const proj = work.projects.find((x) => x.slug === 'expo-mobile-apps');
    this.phoneI = ((this.phoneI ?? -1) + 1) % proj.highlights.length;
    this.ui.bubble(`phone-${it.id}`, `<b>${proj.highlights[this.phoneI]}</b><br><small>${proj.result}</small>`, { anchor: p.clone().add(V(0, 3.1, 0)), ttl: 3000, wide: true });
    if (this.phoneI === proj.highlights.length - 1) setTimeout(() => this.openPanel('project:expo-mobile-apps'), 1400);
  }

  bounce(obj, amt = 0.08) {
    gsap.fromTo(obj.scale, { y: 1 - amt, x: 1 + amt * 0.6, z: 1 + amt * 0.6 }, { y: 1, x: 1, z: 1, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
  }

  pet(it) {
    const p = this.player;
    p.gesture('interact');
    this.bounce(it.obj, 0.12);
    this.audio[it.sound || 'meow']?.();
    const pos = it.obj.position.clone().add(V(0, 0.6, 0));
    this.fx.hearts(pos);
    const lines = { meow: 'Purrr...', woof: 'Woof! *tail wags*', baa: 'Baaa!' };
    this.ui.bubble(`pet-${it.id}`, lines[it.sound] || '♥', { anchor: pos.clone().add(V(0, 0.5, 0)), ttl: 1800 });
    this.state.pets = (this.state.pets || 0) + 1;
    if (this.state.pets === 3) this.ui.toast('Friend of the isles', 'You have petted three animals.', '🐾');
  }

  honk(it) {
    this.bounce(it.obj, 0.06);
    this.audio[it.sound || 'pop']?.();
    this.player.gesture('interact');
    if (it.sound === 'honk') this.ui.bubble(`honk-${it.id}`, '<b>Peep peep!</b>', { anchor: it.obj.position.clone().add(V(0, 2.4, 0)), ttl: 1400 });
    else { this.ui.bubble(`fruit-${it.id}`, 'Fresh mangoes from Multan!', { anchor: it.obj.position.clone().add(V(0, 2.2, 0)), ttl: 2000 }); this.fx.sparkle(it.obj.position.clone().add(V(0, 1, 0)), 8); }
  }

  wish(it) {
    this.player.gesture('interact');
    this.audio.collect();
    const pos = it.obj.position.clone().add(V(0, 1.0, 0));
    this.fx.sparkle(pos, 18);
    this.fx.ripple(it.obj.position.clone().add(V(0, 0.55, 0)), '#FFFFFF');
    const wishes = [
      'You wished for a product that ships on time. Granted.',
      'You wished for software your team actually uses every day.',
      'You wished for a WhatsApp bot that answers in Urdu and English.',
      'You wished for a dashboard that shows real margins. Granted.',
      'You wished for an app on both stores in one go.',
    ];
    this.wishI = ((this.wishI ?? -1) + 1) % wishes.length;
    this.ui.bubble('wish', wishes[this.wishI], { anchor: pos.clone().add(V(0, 1.2, 0)), ttl: 3800, wide: true });
  }

  seatTransform(obj, name = 'seat', sideOffset = 0) {
    const s = obj.getObjectByName(name);
    const pos = new THREE.Vector3(), q = new THREE.Quaternion();
    if (s) { s.getWorldPosition(pos); s.getWorldQuaternion(q); }
    else { obj.getWorldPosition(pos); pos.y += 0.45; obj.getWorldQuaternion(q); }
    const yaw = new THREE.Euler().setFromQuaternion(q, 'YXZ').y;
    if (sideOffset) pos.add(V(sideOffset, 0, 0).applyAxisAngle(V(0, 1, 0), yaw));
    pos.y -= SIT_DROP;
    return { pos, yaw };
  }

  exitPoint(it) { return V(it.x, 0, it.z); }

  startSit(it) {
    const npc = this.npcs.find((n) => n.bench === it.rec);
    const { pos, yaw } = this.seatTransform(it.obj, 'seat', npc ? 0.42 : 0);
    this.player.setSeat({ position: pos, yaw, loop: 'sit' });
    this.activity = { type: 'sit', it, npc };
    this.cam.focus = { point: pos.clone().add(V(0, 0, 0)), dist: 11 };
    this.audio.pop();
    if (npc) {
      const t = testimonials.items[npc.index];
      setTimeout(() => {
        if (this.activity?.npc !== npc) return;
        this.ui.bubbleAt(`npc${npc.index}`, `"${t.quote}"<cite>${t.name}, ${t.role}</cite>`, npc.npc, 1.55, { wide: true });
        npc.talking = true;
        if (npc.actions.talk) { npc.actions.sit?.fadeOut(0.3); npc.actions.talk.reset().fadeIn(0.3).play(); }
      }, 700);
    }
    this.hintOnce('sit', 'Press E or move to stand up');
  }

  startDesk(it) {
    const { pos, yaw } = this.seatTransform(it.obj, 'seat');
    this.player.setSeat({ position: pos, yaw, loop: this.player.actions?.type ? 'type' : 'sit' });
    this.activity = { type: 'desk', it };
    this.cam.focus = { point: pos.clone(), dist: 10 };
    this.openPanel('about', () => { if (this.activity?.type === 'desk') this.endActivity(); });
  }

  startSwing(it) {
    const i = 0;
    const pivot = it.obj.getObjectByName(`swing_${i}`);
    const seat = it.obj.getObjectByName(`seat_${i}`);
    if (!pivot || !seat) return;
    this.player.setSeat({ position: new THREE.Vector3(), yaw: 0, loop: this.player.actions?.swing ? 'swing' : 'sit', follow: seat });
    this.player.seat.yawOffset = 0;
    this.activity = { type: 'swing', it, pivot, amp: 0.15, phase: 0 };
    const p = new THREE.Vector3(); seat.getWorldPosition(p);
    this.cam.focus = { point: p, dist: 13 };
    this.audio.creak();
    this.hintOnce('swing', 'Hold E to swing higher, move to hop off');
  }

  startSlide(it) {
    const pts = [];
    for (let i = 0; i < 16; i++) { const e = it.obj.getObjectByName(`slide_${i}`); if (!e) break; pts.push(e.getWorldPosition(new THREE.Vector3())); }
    if (pts.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(pts);
    // climb: teleport to the top (short climb animation is the jump clip)
    this.player.mode = 'locked';
    this.activity = { type: 'slide', it, curve, t: 0, v: 0.05, phase: 'climb', climbT: 0, start: this.player.pos.clone() };
    this.cam.focus = { point: pts[Math.floor(pts.length / 2)], dist: 13 };
    this.audio.pop();
  }

  startSeesaw(it) {
    const beam = it.obj.getObjectByName('beam');
    const seat = it.obj.getObjectByName('seat_0');
    if (!beam || !seat) return;
    this.player.setSeat({ position: new THREE.Vector3(), yaw: 0, loop: 'sit', follow: seat });
    this.activity = { type: 'seesaw', it, beam, t: 0 };
    const p = new THREE.Vector3(); beam.getWorldPosition(p);
    this.cam.focus = { point: p, dist: 12 };
  }

  endActivity() {
    const a = this.activity;
    if (!a) return;
    if (a.type === 'swing') gsap.to(a.pivot.rotation, { x: 0, duration: 1.2, ease: 'power2.out' });
    if (a.type === 'seesaw') gsap.to(a.beam.rotation, { x: 0, duration: 0.8, ease: 'power2.out' });
    if (a.npc) {
      this.ui.removeBubble(`npc${a.npc.index}`);
      a.npc.talking = false;
      if (a.npc.actions.talk) { a.npc.actions.talk.fadeOut(0.3); a.npc.actions.sit?.reset().fadeIn(0.3).play(); }
    }
    this.player.clearSeat(this.exitPoint(a.it));
    this.player.mode = 'free';
    this.cam.focus = null;
    this.activity = null;
    if (this.ui.panelOpen && a.type === 'desk') this.ui.closePanel();
  }

  updateActivity(dt, frame) {
    const a = this.activity;
    const ax = this.input.axis();
    const wantsOut = frame.jump || Math.hypot(ax.x, ax.z) > 0.4;
    if (a.type === 'slide') { this.updateSlide(dt); return; }
    this.ui.showPrompt(a.type === 'swing' ? 'Hold to swing higher' : 'Stand up');
    if (a.type === 'swing') {
      if (this.input.actionDown) a.amp = Math.min(0.75, a.amp + dt * 0.3); else a.amp = Math.max(0.12, a.amp - dt * 0.05);
      a.phase += dt * 2.6;
      a.pivot.rotation.x = Math.sin(a.phase) * a.amp;
      if (Math.abs(Math.sin(a.phase)) > 0.995 && a.amp > 0.4 && !a.creaked) { this.audio.creak(); a.creaked = true; } else if (Math.abs(Math.sin(a.phase)) < 0.9) a.creaked = false;
      if (wantsOut) this.endActivity();
      return;
    }
    if (a.type === 'seesaw') {
      a.t += dt;
      a.beam.rotation.x = Math.sin(a.t * 1.8) * 0.28;
      if (wantsOut || frame.action) this.endActivity();
      return;
    }
    if (frame.action || wantsOut) this.endActivity();
  }

  updateSlide(dt) {
    const a = this.activity, p = this.player;
    this.ui.hidePrompt();
    if (a.phase === 'climb') {
      a.climbT += dt / 0.7;
      const top = a.curve.getPoint(0);
      const k = Math.min(1, a.climbT);
      p.pos.lerpVectors(a.start, top, k);
      p.pos.y = THREE.MathUtils.lerp(a.start.y, top.y, k) + Math.sin(k * Math.PI) * 0.4;
      if (p.current !== 'jump') p.play('jump', { once: true, fade: 0.1 });
      p.sync(dt);
      if (k >= 1) { a.phase = 'slide'; p.play(p.actions?.slide ? 'slide' : 'sit'); this.audio.whoosh(); }
      return;
    }
    if (a.phase === 'slide') {
      a.v = Math.min(0.7, a.v + dt * 0.55);
      a.t = Math.min(1, a.t + a.v * dt);
      const pt = a.curve.getPoint(a.t), tan = a.curve.getTangent(a.t);
      p.pos.copy(pt);
      p.yaw = Math.atan2(tan.x, tan.z);
      p.sync(dt);
      if (a.t >= 1) {
        a.phase = 'hop';
        a.hop = { t: 0, from: pt.clone(), dir: V(tan.x, 0, tan.z).normalize() };
        p.play('jump', { once: true, fade: 0.1 });
      }
      return;
    }
    if (a.phase === 'hop') {
      a.hop.t += dt / 0.45;
      const k = Math.min(1, a.hop.t);
      const goal = a.hop.from.clone().addScaledVector(a.hop.dir, 1.1);
      const g = this.physics.ground(goal.x, goal.z) ?? a.hop.from.y;
      p.pos.lerpVectors(a.hop.from, V(goal.x, g, goal.z), k);
      p.pos.y += Math.sin(k * Math.PI) * 0.5;
      p.sync(dt);
      if (k >= 1) {
        this.fx.puff(p.pos, 6, 0.4);
        this.audio.land();
        p.mode = 'free';
        p.grounded = true;
        p.vy = 0;
        p.play('cheer', { once: true });
        p.gestureUntil = performance.now() + p.clipDuration('cheer') * 1000;
        this.cam.focus = null;
        this.activity = null;
        if (!this.state.slid) { this.state.slid = true; this.ui.toast('Wheee!', 'Every school needs a slide.', '🛝'); }
      }
    }
  }

  ringBell(it) {
    const bell = it.obj.getObjectByName('bell');
    if (bell) gsap.fromTo(bell.rotation, { z: 0.6 }, { z: 0, duration: 1.6, ease: 'elastic.out(1, 0.3)' });
    this.audio.bell();
    this.player.gesture('interact');
  }

  sendPlanes(it, n) {
    const from = new THREE.Vector3();
    it.obj.getWorldPosition(from);
    from.y += 3;
    const dests = Object.values(this.world.islands).filter((i) => i.id !== it.rec.island);
    for (let i = 0; i < n; i++) {
      const d = dests[(i * 7 + Math.floor(this.time)) % dests.length];
      this.fx.plane(from, V(d.x + (Math.random() - 0.5) * 6, 1.5, d.z + (Math.random() - 0.5) * 6), i * 0.12);
    }
    this.audio.whoosh();
  }

  launchBoat(it) {
    const boat = it.obj;
    if (boat.userData.sailing) return;
    boat.userData.sailing = true;
    const start = boat.position.clone();
    const dir = V(Math.sin(it.rec.yaw), 0, Math.cos(it.rec.yaw));
    this.player.gesture('wave');
    this.audio.whoosh();
    gsap.to(boat.position, { x: start.x + dir.x * 26, z: start.z + dir.z * 26, y: start.y - 0.5, duration: 9, ease: 'power1.in' });
    gsap.to(boat.rotation, { z: 0.15, duration: 1.2, yoyo: true, repeat: 7, ease: 'sine.inOut' });
    this.ui.toast('Your paper boat is sailing', "Mehfooz is a message away: tap the mailbox to write.", '⛵');
    setTimeout(() => { gsap.killTweensOf(boat.position); boat.position.copy(start); boat.rotation.z = 0; boat.userData.sailing = false; this.fx.puff(start, 4); }, 10000);
  }

  // ---------- launch sequence ----------
  launch(slug) {
    const d = this.world.districts[slug];
    if (!d || d.launched || d.building) return;
    d.building = true;
    const proj = work.projects.find((x) => x.slug === slug);
    const b = d.build;
    const center = new THREE.Vector3();
    d.objects.forEach((o) => center.add(o.position));
    center.divideScalar(Math.max(1, d.objects.length));
    this.player.mode = 'locked';
    this.player.play('cheer', { once: true });
    this.cam.focus = { point: center, dist: 24 };
    this.audio.build(0);
    // scaffolding around each building-sized object
    const scaffolds = [];
    for (const o of d.objects) {
      const bb = new THREE.Box3().setFromObject(o);
      const sz = bb.getSize(new THREE.Vector3());
      if (sz.y < 1.6 || sz.x * sz.z < 2) continue;
      const s = spawn('scaffold_block');
      s.position.set((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);
      s.scale.set(Math.max(1, sz.x / 2 + 0.2), 0.01, Math.max(1, sz.z / 2 + 0.2));
      this.scene.add(s);
      scaffolds.push({ s, h: Math.max(1, sz.y / 2 + 0.15) });
    }
    const caption = (i) => this.ui.bubble('launch', `<b>${i + 1}. ${process.steps[i].title}</b>`, { anchor: center.clone().add(V(0, d.maxY - d.minY + 1.5, 0)) });
    const tl = gsap.timeline();
    tl.call(() => caption(0))
      .to(b.uReveal, { value: 1, duration: 0.9, ease: 'power2.out' })
      .call(() => { caption(1); this.audio.build(1); })
      .add(() => scaffolds.forEach(({ s, h }, i) => gsap.to(s.scale, { y: h, duration: 0.6, delay: i * 0.08, ease: 'back.out(1.6)' })))
      .to({}, { duration: 1.0 })
      .call(() => { caption(2); this.audio.build(2); b.uBuildY.value = d.minY - 0.2; })
      .to(b.uBuildY, { value: d.maxY + 0.3, duration: 3.2, ease: 'power1.inOut' })
      .add(() => scaffolds.forEach(({ s }, i) => gsap.to(s.scale, { y: 0.01, duration: 0.45, delay: i * 0.06, ease: 'back.in(1.6)', onComplete: () => this.scene.remove(s) })))
      .call(() => {
        b.uBuildOn.value = 0;
        d.screens.forEach((s) => (s.visible = true));
        // The finished district is solid now; if the player stands inside a footprint, step them out.
        (d.colliders || []).forEach((c) => (c.enabled = true));
        const out = this.physics.resolve(this.player.pos.x, this.player.pos.z, this.player.pos.y);
        if (this.physics.ground(out.x, out.z) !== null) { this.player.pos.x = out.x; this.player.pos.z = out.z; }
        clearTimeout(this.navTimer);
        this.navTimer = setTimeout(() => this.nav?.build(this.nav.extraPoints), 1500); // paths now route around the new buildings
        d.launched = true;
        d.building = false;
        this.state.launched.add(slug);
        track('project_launch', { project: slug, launched_count: this.state.launched.size });
        if (d.seed) { gsap.to(d.seed.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.4 }); }
        if (d.glow) d.glow.visible = false;
        this.fx.confetti(center.clone().add(V(0, 2, 0)), 90, 7);
        this.audio.launch();
        this.ui.removeBubble('launch');
        this.ui.bubble(`res-${slug}`, `<b>${proj.name}</b><br>${proj.result}`, { anchor: center.clone().add(V(0, d.maxY - d.minY + 1.2, 0)), ttl: 7000, wide: true });
        this.ui.toast(`${proj.name} launched`, 'Stand on the pad to read the case study.', '🚀');
        this.updateHUD(true);
        this.onLaunched?.(slug);
        this.player.mode = 'free';
        this.cam.focus = null;
        if (this.state.launched.size === 6) setTimeout(() => this.finale(), 2500);
      });
  }

  finale() {
    this.audio.fanfare();
    this.ui.toast('All six launched!', 'The lighthouse is lit. Come say hello.', '🎉', 6000);
    if (this.beacon) {
      this.beacon.on = true;
      gsap.to(this.beacon.glow.scale, { x: 5, y: 5, z: 5, duration: 1.2 });
      gsap.to(this.beacon.beam.material, { opacity: 0.18, duration: 1.2 });
      for (let i = 0; i < 6; i++) setTimeout(() => this.fx.confetti(this.beacon.top.clone().add(V((Math.random() - 0.5) * 14, 6 + Math.random() * 4, (Math.random() - 0.5) * 14)), 70, 5), i * 500);
    }
  }

  updateDistrictIdle(dt) {
    for (const d of Object.values(this.world.districts)) {
      if (d.seed && !d.launched) {
        d.seed.rotation.y += dt * 0.8;
        d.seed.position.y = (d.pad?.y ?? 0) + 0.05 + Math.sin(this.time * 2 + d.seed.position.x) * 0.06;
        if (d.glow) d.glow.material.opacity = 0.55 + Math.sin(this.time * 3) * 0.25;
      }
      // ambient life once launched
      if (d.launched && d.slug === 'whatsapp-business-automation' && Math.random() < dt * 0.25) {
        const po = this.world.interactables.find((i) => i.type === 'planes');
        if (po) this.sendPlanes(po, 1);
      }
    }
  }

  /** People are solid: softly push the player out of walking townsfolk (they also slow down to give way). */
  pushFromPeople() {
    const p = this.player;
    if (p.mode !== 'free') return;
    const people = (this.ambient?.walkers || []).map((w) => w.obj.position);
    for (const q of people) {
      const dx = p.pos.x - q.x, dz = p.pos.z - q.z, d = Math.hypot(dx, dz), min = 0.55;
      if (d < min && d > 1e-4) {
        const push = (min - d) * 0.6;
        const nx = p.pos.x + (dx / d) * push, nz = p.pos.z + (dz / d) * push;
        if (this.physics.ground(nx, nz) !== null) { p.pos.x = nx; p.pos.z = nz; }
      }
    }
  }

  // ---------- discovery ----------
  updateDiscovery() {
    const p = this.player.pos;
    for (const pl of this.world.places) {
      if (this.state.visited.has(pl.id)) continue;
      if (Math.hypot(pl.x - p.x, pl.z - p.z) < 6) {
        this.state.visited.add(pl.id);
        track('island_visit', { island: pl.id });
        if (this.state.started && pl.id !== 'home') {
          this.ui.toast(`Discovered: ${pl.name}`, pl.project ? 'Find the glowing seed to launch it.' : '', '📍', 3000);
          this.audio.pop();
          if (PARROT_LINES[pl.id] && !this.parrot.said.has(pl.id)) setTimeout(() => this.parrotSay(pl.id, 6000), 900);
        }
      }
    }
  }

  // ---------- parrot ----------
  parrotSay(key, ms = 5000) {
    const line = PARROT_LINES[key];
    if (!line) return;
    this.parrot.said.add(key);
    this.ui.bubbleAt('parrot', line, this.parrot.obj, 0.55, { kind: 'parrot', ttl: ms });
    this.audio.parrot();
    if (this.parrot.actions?.talk) { this.parrot.actions.talk.reset().play(); setTimeout(() => this.parrot.actions.talk?.fadeOut(0.3), ms * 0.6); }
  }

  updateParrot(dt) {
    const pr = this.parrot, p = this.player;
    pr.mixer?.update(dt);
    // Perch point: hovering beside the player's shoulder, or at a hint destination.
    if (pr.mode === 'perch') {
      const side = V(0.55, 1.45, -0.1).applyAxisAngle(V(0, 1, 0), p.yaw);
      const goal = p.pos.clone().add(side);
      goal.y += Math.sin(this.time * 2.2) * 0.08;
      pr.pos.lerp(goal, 1 - Math.exp(-5 * dt));
      pr.obj.rotation.y = p.yaw;
      // Lead the way: after standing still a while, fly to the nearest unvisited place.
      pr.hintCooldown -= dt;
      if (this.idle > 7 && pr.hintCooldown <= 0 && this.state.started && !this.activity && !this.ui.panelOpen) {
        const next = this.world.places.filter((x) => !this.state.visited.has(x.id) || (x.project && !this.state.launched.has(x.project)))
          .sort((a, b) => Math.hypot(a.x - p.pos.x, a.z - p.pos.z) - Math.hypot(b.x - p.pos.x, b.z - p.pos.z))[0];
        if (next) {
          pr.mode = 'fly';
          pr.from = pr.pos.clone();
          pr.to = V(next.x, (this.physics.ground(next.x, next.z, 0) ?? 0) + 2.2, next.z);
          pr.t = 0;
          pr.dest = next;
          pr.actions?.fly?.reset().play();
          this.audio.parrot();
          this.ui.bubbleAt('parrot', `Follow me to ${next.label}!`, pr.obj, 0.55, { kind: 'parrot', ttl: 2600 });
        }
        pr.hintCooldown = 18;
      }
    } else if (pr.mode === 'fly' || pr.mode === 'back') {
      const dist = pr.from.distanceTo(pr.to);
      pr.t = Math.min(1, pr.t + dt * (6 / Math.max(4, dist)));
      const k = pr.t;
      pr.pos.lerpVectors(pr.from, pr.to, k);
      pr.pos.y += Math.sin(k * Math.PI) * Math.min(6, dist * 0.25);
      pr.obj.rotation.y = Math.atan2(pr.to.x - pr.from.x, pr.to.z - pr.from.z);
      if (k >= 1) {
        if (pr.mode === 'fly') {
          pr.mode = 'wait';
          pr.waitT = 0;
          pr.actions?.fly?.fadeOut(0.3);
          const key = pr.dest.id;
          this.ui.bubbleAt('parrot', PARROT_LINES[key] || `Here is ${pr.dest.name}.`, pr.obj, 0.55, { kind: 'parrot', ttl: 6000 });
          this.audio.parrot();
        } else { pr.mode = 'perch'; pr.actions?.fly?.fadeOut(0.3); }
      }
    } else if (pr.mode === 'wait') {
      pr.waitT += dt;
      pr.pos.y += Math.sin(this.time * 3) * 0.003;
      const near = Math.hypot(pr.pos.x - p.pos.x, pr.pos.z - p.pos.z) < 5;
      if (near || pr.waitT > 14) {
        pr.mode = 'back';
        pr.from = pr.pos.clone();
        pr.to = p.pos.clone().add(V(0.55, 1.45, 0));
        pr.t = 0;
        pr.actions?.fly?.reset().play();
      }
    }
    pr.obj.position.copy(pr.pos);
    if (!pr.mixer) pr.obj.children.forEach((c) => (c.rotation.z = pr.mode === 'perch' ? 0 : Math.sin(this.time * 18) * 0.4));
  }

  // ---------- ball and stumps ----------
  updateBalls(dt) {
    const p = this.player;
    for (const b of this.balls) {
      if (b.sunk > 0) {
        b.sunk -= dt;
        b.obj.position.y -= dt * 0.6;
        if (b.sunk <= 0) { b.obj.position.copy(b.home); b.obj.position.y = b.home.y + 0.11; b.vel.set(0, 0, 0); b.y = b.obj.position.y; this.fx.puff(b.obj.position, 4); }
        continue;
      }
      const bp = b.obj.position;
      const dx = bp.x - p.pos.x, dz = bp.z - p.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.55 && Math.abs(p.pos.y - (bp.y - 0.11)) < 0.5 && p.mode === 'free') {
        const sp = Math.max(3, p.speed * 1.7 + 2);
        const dir = V(dx, 0, dz).normalize();
        b.vel.set(dir.x * sp, 2.2, dir.z * sp);
        b.air = true;
        if (p.speed > 0.5) { p.play('kick', { once: true, fade: 0.08 }); p.gestureUntil = performance.now() + 450; }
        this.audio.kick();
      }
      if (b.vel.lengthSq() < 0.0004 && !b.air) continue;
      const g = this.physics.ground(bp.x, bp.z, 0);
      // horizontal
      const nx = bp.x + b.vel.x * dt, nz = bp.z + b.vel.z * dt;
      const res = this.physics.resolve(nx, nz, bp.y - 0.11, 0.11);
      if (Math.abs(res.x - nx) + Math.abs(res.z - nz) > 1e-4) { b.vel.x *= -0.6; b.vel.z *= -0.6; this.audio.noiseHit({ freq: 700, dur: 0.05, vol: 0.06 }); }
      bp.x = res.x; bp.z = res.z;
      // vertical
      const gy = this.physics.ground(bp.x, bp.z, 0);
      if (b.air) {
        b.vel.y -= 14 * dt;
        bp.y += b.vel.y * dt;
        const floor = (gy ?? -0.55) + 0.11;
        if (bp.y <= floor) {
          bp.y = floor;
          if (gy === null) { b.sunk = 1.8; this.fx.ripple(V(bp.x, -0.55, bp.z)); this.fx.ripple(V(bp.x, -0.55, bp.z), '#E6F6F8'); this.audio.noiseHit({ freq: 600, dur: 0.3, vol: 0.12 }); continue; }
          if (Math.abs(b.vel.y) > 1.2) b.vel.y = -b.vel.y * 0.45; else { b.vel.y = 0; b.air = false; }
        }
      } else {
        if (gy === null) { b.air = true; continue; }
        bp.y = gy + 0.11;
        const f = Math.exp(-1.6 * dt);
        b.vel.x *= f; b.vel.z *= f;
      }
      b.obj.rotation.x += b.vel.z * dt * 4;
      b.obj.rotation.z -= b.vel.x * dt * 4;
      // stumps
      for (const s of this.stumps) {
        if (s.down > 0) continue;
        if (Math.hypot(bp.x - s.rec.x, bp.z - s.rec.z) < 0.42 && Math.hypot(b.vel.x, b.vel.z) > 1.5) this.knockStumps(s);
      }
    }
    for (const s of this.stumps) {
      if (s.down > 0) {
        s.down -= dt;
        if (s.down <= 0) for (let i = 0; i < 3; i++) { const st = s.rec.obj.getObjectByName(`stump_${i}`); if (st) gsap.to(st.rotation, { x: 0, z: 0, duration: 0.5 }); }
      }
    }
  }

  knockStumps(s) {
    s.down = 6;
    for (let i = 0; i < 3; i++) {
      const st = s.rec.obj.getObjectByName(`stump_${i}`);
      if (st) gsap.to(st.rotation, { x: (Math.random() - 0.3) * 1.4, z: (Math.random() - 0.5) * 1.2, duration: 0.35, ease: 'power2.out' });
    }
    const bails = s.rec.obj.getObjectByName('bails');
    if (bails) gsap.to(bails.position, { y: bails.position.y + 0.6, duration: 0.3, yoyo: true, repeat: 1 });
    this.audio.clatter();
    this.fx.confetti(V(s.rec.x, s.rec.y + 0.8, s.rec.z), 40, 4);
    this.ui.bubble('howzat', '<b>Howzat!</b> Clean bowled.', { anchor: V(s.rec.x, s.rec.y + 1.4, s.rec.z), ttl: 2600 });
    this.player.gesture('cheer');
    if (!this.state.bowled) { this.state.bowled = true; this.ui.toast('Clean bowled!', 'Cricket in Pakistan is not optional.', '🏏'); }
  }

  // ---------- bulbs ----------
  updateBulbs(dt) {
    const p = this.player.pos;
    for (const b of this.world.bulbs) {
      if (b.taken) continue;
      const o = b.rec.obj;
      o.rotation.y += dt * 1.4;
      o.position.y = b.base.y + Math.sin(this.time * 2.4 + b.base.x) * 0.12;
      if (Math.hypot(o.position.x - p.x, o.position.z - p.z) < 0.9 && Math.abs(o.position.y - 0.9 - p.y) < 1.2) {
        b.taken = true;
        this.state.bulbs.add(b.id);
        this.fx.sparkle(o.position, 16);
        this.audio.collect();
        gsap.to(o.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.3, onComplete: () => (o.visible = false) });
        this.ui.toast(`Idea ${this.state.bulbs.size} of 4`, bulbFacts[b.id] || '', '💡', 5000);
        this.updateHUD(false, true);
      }
    }
  }

  updateNPCs(dt) {
    for (const n of this.npcs) {
      n.mixer?.update(dt);
      if (!n.mixer) n.npc.position.y += Math.sin(this.time * 2 + n.index) * 0.0006;
    }
  }

  updateHUD(bumpLaunch, bumpBulb) {
    const l = document.getElementById('pg-launched'), b = document.getElementById('pg-bulbs');
    l.textContent = this.state.launched.size;
    b.textContent = this.state.bulbs.size;
    const pick = bumpLaunch ? l : bumpBulb ? b : null;
    if (pick) { const it = pick.parentElement; it.classList.remove('bump'); void it.offsetWidth; it.classList.add('bump'); }
  }

  hintOnce(key, text) {
    this.shownHints ||= new Set();
    if (this.shownHints.has(key)) return;
    this.shownHints.add(key);
    const h = document.getElementById('hint');
    h.textContent = text;
    h.hidden = false;
    h.style.opacity = '1';
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => { h.style.opacity = '0'; setTimeout(() => (h.hidden = true), 500); }, 3600);
  }

  /** Walk to a place (from the map). */
  goTo(islandId) {
    const isl = this.world.islands[islandId];
    if (!isl) return;
    // nearest walkable tile centre on that island
    const t = isl.tiles.reduce((a, b) => (Math.hypot(b.x - isl.x, b.z - isl.z) < Math.hypot(a.x - isl.x, a.z - isl.z) ? b : a), isl.tiles[0]);
    this.walkPath(V(t.x + 0.8, 0, t.z + 0.8));
  }

  walkPath(goal) {
    const p = this.player.pos;
    // If the goal sits inside something (a flag, a lamp, a wall), aim for the nearest free spot instead.
    const r = this.physics.resolve(goal.x, goal.z, this.physics.ground(goal.x, goal.z, 0) ?? 0);
    if (Math.abs(r.x - goal.x) + Math.abs(r.z - goal.z) > 0.02 || this.physics.ground(goal.x, goal.z) === null) {
      const n = this.nav?.nodes[this.nav.nearest(goal.x, goal.z)];
      if (n) goal = new THREE.Vector3(n.x, 0, n.z);
    }
    const path = this.nav?.path(p.x, p.z, goal.x, goal.z);
    if (path && path.length) this.player.followPath(path);
    else this.player.walkTo(goal);
  }
}
