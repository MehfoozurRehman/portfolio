import * as THREE from 'three';
import { createRenderer } from './core/renderer.js';
import { createPost } from './core/post.js';
import { Input } from './core/input.js';
import { Audio } from './core/audio.js';
import { loadPacks, loaded } from './world/assets.js';
import { buildWorld } from './world/builder.js';
import { decorate } from './world/decor.js';
import { Ambient } from './world/ambient.js';
import { DayCycle } from './world/daycycle.js';
import { footprintRect, rectsOverlap } from './game/colliders.js';
import gsap from 'gsap';
import { globalUniforms } from './world/materials.js';
import { spawn as spawnPoint, bridges as bridgeList } from './world/map.js';
import { Physics } from './game/physics.js';
import { Nav } from './game/nav.js';
import { Player } from './game/player.js';
import { FollowCamera } from './game/camera.js';
import { FX } from './game/fx.js';
import { Game } from './game/game.js';
import { track } from './core/analytics.js';
import { UI } from './ui/ui.js';

const $ = (s) => document.querySelector(s);
const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = touch || (navigator.hardwareConcurrency || 8) <= 4;
if (touch) document.body.classList.add('is-touch');

const ui = new UI();

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

async function boot() {
  if (!webglOK()) {
    $('#loader').classList.add('is-done');
    ui.openClassic();
    return;
  }
  const canvas = $('#scene');
  canvas.tabIndex = 0;
  const { renderer, scene, followShadow, sun, hemi, sky, sunOffset } = createRenderer(canvas, { lowPower });
  const setPct = (k) => ($('#loader-pct').textContent = `${Math.round(k * 100)}%`);
  setPct(0.05);
  const T = (window.__timings = {});
  let t0 = performance.now();
  const mark = (k) => { const t = performance.now(); T[k] = Math.round(t - t0); t0 = t; };
  await loadPacks((k) => setPct(0.05 + k * 0.8));
  mark('packs');

  const physics = new Physics();
  const world = buildWorld(scene, physics);
  mark('world');
  const decor = decorate(scene, world, physics);
  mark('decor');
  world.interactables.push(...decor.interactables);
  world.physicsRegions = physics.regions;
  // Layout check (for playtests): props whose ground footprints overlap, or that hang over water.
  world.layoutIssues = () => {
    const out = [];
    const recs = world.props.filter((p) => !p.extra?.float && !p.extra?.water && !/^(grass_|tulips|flower|pebbles|shell|starfish|path_stones|launch_pad|idea_|kite|ball|kids_ball|lily|reeds|dock|pier|bridge|cloud|paper_boat|string_lights|bunting|lantern|seagull|app_balloon|chai_set|cat|cat_sleep|mail_sack|parcel)/.test(p.name));
    const rects = recs.map((p) => [p, footprintRect(p.obj)]).filter(([, r]) => r && Math.max(r.hw, r.hd) > 0.15);
    for (let i = 0; i < rects.length; i++) {
      const [p, r] = rects[i];
      if (physics.ground(r.x, r.z, 0) === null) out.push(`over water: ${p.island}/${p.name}`);
      for (let j = i + 1; j < rects.length; j++) {
        const [q, s] = rects[j];
        if (Math.hypot(r.x - s.x, r.z - s.z) > 12) continue;
        if (rectsOverlap(r, s, -0.05)) out.push(`overlap: ${p.island}/${p.name} x ${q.island}/${q.name}`);
      }
    }
    return out;
  };
  world.balls.push(...decor.balls);
  setPct(0.9);
  const nav = new Nav(physics);
  nav.build(world.interactables.map((i) => [i.x, i.z]));
  mark('nav');
  const player = new Player(scene, physics);
  const home = world.islands[spawnPoint.island];
  player.place(home.x + spawnPoint.x, home.z + spawnPoint.z, spawnPoint.yaw);
  const cam = new FollowCamera(innerWidth / innerHeight);
  const input = new Input(canvas);
  const audio = new Audio();
  const fx = new FX(scene);
  const game = new Game({ scene, cam, physics, world, player, ui, audio, fx, input, nav });
  const ambient = new Ambient(scene, world, physics, nav, fx, decor);
  ambient.onPop = () => audio.pop();
  game.ambient = ambient;
  // seated townsfolk on benches are solid too
  for (const n of game.npcs) physics.addCircle(n.npc.position.x, n.npc.position.z, 0.28, { top: n.npc.position.y + 1.2 });
  const day = new DayCycle({ scene, renderer, hemi, sun, sky, water: world.water, sunOffset });
  day.collectGlows((o) => {
    // skip bulbs inside districts that are not launched yet (they are still blueprints)
    let p = o;
    while (p) { const d = Object.values(world.districts).find((dd) => dd.objects.includes(p)); if (d) return d.launched; p = p.parent; }
    return true;
  });
  game.onLaunched = () => { if (day.mode !== 'day') day.set(day.mode, { duration: 0.8 }); };
  day.onChange = (mode) => {
    const b = game.beacon;
    if (b) {
      const on = mode === 'night' || game.state.launched.size === 6;
      b.on = on || b.on;
      gsap.to(b.beam.material, { opacity: on ? 0.16 : 0, duration: 1.2 });
      gsap.to(b.glow.scale, { x: on ? 5 : 0.01, y: on ? 5 : 0.01, z: on ? 5 : 0.01, duration: 1.2 });
    }
    const btn = $('#btn-time');
    btn.dataset.mode = mode;
    btn.setAttribute('aria-label', `Time of day: ${mode}. Change`);
    btn.querySelector('.lbl').textContent = { day: 'Day', golden: 'Golden hour', night: 'Night' }[mode];
  };

  if (touch) {
    input.attachJoystick($('#joy'), $('#joy-knob'));
    input.attachButton($('#btn-action'), 'action');
    input.attachButton($('#btn-jump'), 'jump');
  }

  // Title: a slow orbit over the isles.
  const center = new THREE.Vector3((world.bounds.minX + world.bounds.maxX) / 2, 0, (world.bounds.minZ + world.bounds.maxZ) / 2);
  cam.target.copy(center);
  cam.dist = cam.distTarget = 30;
  let titleMode = true;
  const titleDist = touch ? 120 : 92;

  const post = createPost(renderer, scene, cam.camera, { lowPower: lowPower || new URLSearchParams(location.search).has('nopost') });
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    cam.setAspect(innerWidth / innerHeight);
    post.setSize(innerWidth, innerHeight);
  }
  addEventListener('resize', resize);
  resize();

  const startGame = () => {
    if (!titleMode) return;
    titleMode = false;
    track('game_start', { device: touch ? 'touch' : 'desktop' });
    $('#title').hidden = true;
    $('#hud').hidden = false;
    $('#progress').hidden = false;
    if (touch) $('#touch').hidden = false;
    audio.start();
    cam.dist = titleDist;
    if (!reduced) cam.startIntro(cam.target.clone(), player.pos.clone());
    else { cam.target.copy(player.pos); cam.dist = cam.distTarget; }
    game.start();
    canvas.focus({ preventScroll: true });
    if (!touch) {
      const h = $('#hint');
      h.textContent = 'WASD or arrows to walk · Shift to run · Space to jump · E to use';
      h.hidden = false;
      setTimeout(() => { h.style.opacity = '0'; setTimeout(() => (h.hidden = true), 600); }, 6000);
    }
  };
  $('#start').addEventListener('click', startGame);
  $('#classic-open-title').addEventListener('click', () => ui.openClassic());
  $('#btn-classic').addEventListener('click', () => ui.openClassic());
  $('#brand').addEventListener('click', () => game.openPanel('about'));
  $('#btn-contact').addEventListener('click', () => game.openPanel('contact'));
  $('#btn-map').addEventListener('click', () => ui.openMap(world, player, (id) => game.goTo(id)));
  $('#btn-time').addEventListener('click', () => { day.next(); audio.open(); });
  $('#btn-sound').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    e.currentTarget.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
    audio.setEnabled(on);
  });
  input.on('key', (k) => {
    if (titleMode && (k === 'enter' || k === ' ')) { startGame(); return; }
    if (k === 'm' && !titleMode) { if (ui.mapOpen) ui.closeMap(); else ui.openMap(world, player, (id) => game.goTo(id)); }
    if (k === 'c' && !titleMode) { if (ui.classicOpen) ui.closeClassic(); else ui.openClassic(); }
    if (k === 'n' && !titleMode) day.next();
  });

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let titleYaw = cam.yaw;
  let frames = 0;
  // Adaptive quality: step post effects down while the frame rate is low, and try one step up when there is headroom.
  let lowStreak = 0, highStreak = 0, triedUp = false;
  const q = new URLSearchParams(location.search).get('q');
  if (q !== null && post.setQuality) post.setQuality(+q);
  setInterval(() => {
    window.__fps = frames;
    if (q === null && post.setQuality && !document.hidden) {
      if (frames < 45) { lowStreak++; highStreak = 0; } else if (frames >= 58) { highStreak++; lowStreak = 0; } else { lowStreak = highStreak = 0; }
      if (lowStreak >= 2 && post.quality > 0) { post.setQuality(post.quality - 1); lowStreak = 0; triedUp = true; }
      if (highStreak >= 5 && !triedUp && post.quality < 2) { post.setQuality(post.quality + 1); highStreak = 0; }
    }
    window.__quality = post.quality;
    frames = 0;
  }, 1000);
  function frame() {
    const dt = Math.min(0.05, clock.getDelta());
    globalUniforms.uTime.value += dt;
    const f = input.consume();
    input.jumpNow = f.jump;
    input.enabled = !titleMode && !ui.classicOpen && !ui.mapOpen;
    if (titleMode) {
      titleYaw += dt * (reduced ? 0 : 0.035);
      cam.yaw = cam.yawTarget = titleYaw;
      cam.dist = titleDist;
      // Keep the isles to the right of the title card on wide screens.
      const look = center.clone().addScaledVector(cam.basis().right, touch || innerWidth < 900 ? 0 : -titleDist * 0.2);
      cam.target.copy(look);
      const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
      cam.camera.position.copy(look).add(new THREE.Vector3(Math.sin(cam.yaw) * cp, sp, Math.cos(cam.yaw) * cp).multiplyScalar(titleDist));
      cam.camera.lookAt(look);
      player.update(dt, { axis: () => ({ x: 0, z: 0, run: false }) }, cam);
    } else {
      if (f.orbit) cam.addOrbit(-f.orbit);
      if (f.zoom) cam.addZoom(f.zoom);
      if (!input.enabled) { f.action = false; f.jump = false; f.click = null; input.jumpNow = false; }
      player.update(dt, input, cam);
      game.update(dt, f);
      cam.update(dt, player.pos, player.vel);
    }
    followShadow(titleMode ? center : player.pos);
    fx.update(dt);
    ambient.update(dt, titleMode ? null : player);
    for (const u of world.updaters) u(dt);
    ui.updateBubbles(cam.camera, innerWidth, innerHeight);
    post.setTilt?.(titleMode ? 3.2 : cam.focus ? 2.6 : 1.8);
    post.render();
    frames++;
    requestAnimationFrame(frame);
  }

  mark('rest');
  // Compile every shader now (behind the loader) so the first frames do not hitch.
  renderer.compile(scene, cam.camera);
  mark('compile');
  setPct(1);
  $('#loader').classList.add('is-done');
  setTimeout(() => ($('#loader').hidden = true), 700);
  $('#title').hidden = false;
  requestAnimationFrame(frame);

  // Test hook for automated playtests (no effect on visitors).
  window.__game = {
    game, player, world, cam, physics, nav, ui, packs: loaded.packs, renderer, scene, post,
    info: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures, progs: renderer.info.programs?.length, fps: window.__fps }),
    start: startGame,
    teleport(x, z, yaw = 180) { player.place(x, z, yaw); cam.target.copy(player.pos); },
    toIsland(id, dx = 0, dz = 3) { const i = world.islands[id]; this.teleport(i.x + dx, i.z + dz); },
    layout: () => world.layoutIssues(),
    /**
     * Simulate walking (with the real physics.move) between every bridged island pair and along random routes
     * on each island. Reports routes where the walker stalls for more than a second.
     */
    walkCheck(randomPerIsland = 12) {
      const issues = [];
      const sim = (from, to, label) => {
        const path = nav.path(from.x, from.z, to.x, to.z);
        if (!path) { issues.push(`no path: ${label}`); return; }
        let x = from.x, z = from.z, y = physics.ground(x, z) ?? 0, stall = 0;
        for (const wp of path) {
          let guard = 0;
          while (Math.hypot(wp.x - x, wp.z - z) > 0.35 && guard++ < 2000) {
            const d = Math.hypot(wp.x - x, wp.z - z), sp = 4.7 / 60;
            const r = physics.move(x, z, y, ((wp.x - x) / d) * sp, ((wp.z - z) / d) * sp);
            const moved = Math.hypot(r.x - x, r.z - z);
            x = r.x; z = r.z; y = r.ground;
            stall = moved < sp * 0.15 ? stall + 1 : 0;
            if (stall > 60) {
              const obs = physics.obstacles.filter((o) => o.enabled && Math.hypot(o.x - x, o.z - z) < 1.6).map((o) => `${o.kind}${o.kind === 'box' ? `(${o.hw.toFixed(2)}x${o.hd.toFixed(2)})` : `(r${o.r.toFixed(2)})`}@${o.x.toFixed(1)},${o.z.toFixed(1)}${o.id ? ' ' + o.id : ''}`);
              issues.push(`stuck at (${x.toFixed(1)}, ${z.toFixed(1)}) -> wp (${wp.x.toFixed(1)}, ${wp.z.toFixed(1)}) on ${label}; near: ${obs.join(' | ')}`);
              return;
            }
          }
        }
      };
      const centre = (isl) => { const n = nav.nodes[nav.nearest(isl.x, isl.z)]; return { x: n.x, z: n.z }; };
      for (const [a, b] of bridgeList) sim(centre(world.islands[a]), centre(world.islands[b]), `${a} -> ${b}`);
      let seed = 5;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (const isl of Object.values(world.islands)) {
        const c = centre(isl);
        for (let i = 0; i < randomPerIsland; i++) {
          const t = isl.tiles[Math.floor(rnd() * isl.tiles.length)];
          const p = { x: t.x + (rnd() - 0.5) * 2.4, z: t.z + (rnd() - 0.5) * 2.4 };
          if (physics.ground(p.x, p.z) === null) continue;
          const rp = physics.resolve(p.x, p.z, t.y, 0.36);
          if (Math.abs(rp.x - p.x) + Math.abs(rp.z - p.z) > 1e-3) continue; // inside or against an obstacle
          sim(c, p, `${isl.id} random ${i}`);
        }
      }
      return issues;
    },
    launchAll() { Object.keys(world.districts).forEach((s, i) => setTimeout(() => game.launch(s), i * 200)); },
    state: () => ({ pos: player.pos.toArray().map((v) => +v.toFixed(2)), mode: player.mode, anim: player.current, launched: [...game.state.launched], visited: [...game.state.visited], near: game.near?.id || null, activity: game.activity?.type || null }),
  };
}

boot().catch((e) => {
  console.error(e);
  $('#loader-pct').textContent = '';
  $('.loader-text').textContent = 'Something went wrong loading the world. Opening the classic view.';
  setTimeout(() => { $('#loader').classList.add('is-done'); ui.openClassic(); }, 1200);
});
