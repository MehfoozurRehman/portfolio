// Turns map data into the playable world: tiles, terraces, bridges, props, districts, screens, garden.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { axialToWorld, HEX_R } from './hex.js';
import { islands, bridges, props, LEVEL_H } from './map.js';
import { spawn, hasAsset } from './assets.js';
import { clay, newBuild } from './materials.js';
import { createWater } from './water.js';
import { addFootprint } from '../game/colliders.js';
import { labelTexture, imageTexture, orientToQuad } from './textures.js';
import { work, profile, services, experience, education, stack } from '@shared/content.js';
import github from '../data/github.json';

const NO_COLLIDE = /^(grass_|tulips|flower_patch|idea_bulb|idea_seed|kite|ball|launch_pad|paper_boat|dock|pier|bridge|cloud|bird|garden_|chai_cup|book|paper_plane|rock_b)/;
const TREE = /^(tree_|palm|bush_round|agave|cactus_finger)/;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function hexTileGeometry() {
  const shape = new THREE.Shape();
  const r = HEX_R - 0.06;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    const x = r * Math.cos(a), y = r * Math.sin(a);
    i ? shape.lineTo(x, y) : shape.moveTo(x, y);
  }
  shape.closePath();
  const depth = 1.1;
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -0.06, 0); // top of the bevel at y = 0
  // Extrude goes +Y after rotation; flip so the body hangs below the top.
  g.translate(0, -depth, 0);
  g.computeVertexNormals();
  return g;
}

function columnGeometry() {
  const g = new THREE.CylinderGeometry(HEX_R * 0.985, HEX_R * 0.985, 5, 6, 1, true);
  g.translate(0, -2.5 - 0.9, 0);
  return g;
}

/** Collect an asset's meshes as {geometry, material} parts in the asset's local space (for instancing). */
function assetParts(name) {
  const obj = spawn(name);
  obj.updateMatrixWorld(true);
  const parts = [];
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.length === 1) {
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      parts.push({ geometry: g, material: mats[0] });
    } else {
      parts.push({ geometry: o.geometry.clone().applyMatrix4(o.matrixWorld), material: mats });
    }
  });
  return parts;
}

/** Instanced meshes split into spatial chunks so frustum culling can skip what is off screen. */
export function instanced(scene, parts, matrices, { castShadow = true, receiveShadow = true, chunk = 14 } = {}) {
  const buckets = new Map();
  const v = new THREE.Vector3();
  for (const m of matrices) {
    v.setFromMatrixPosition(m);
    const k = `${Math.floor(v.x / chunk)},${Math.floor(v.z / chunk)}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(m);
  }
  const meshes = [];
  for (const list of buckets.values()) {
    for (const p of parts) {
      const im = new THREE.InstancedMesh(p.geometry, p.material, list.length);
      list.forEach((m, i) => im.setMatrixAt(i, m));
      im.castShadow = castShadow;
      im.receiveShadow = receiveShadow;
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      scene.add(im);
      meshes.push(im);
    }
  }
  return meshes;
}

const TILE_TOP = { grass: 'pal_grass', grass_deep: 'pal_grass_deep', sand: 'pal_sand', stone: 'pal_stone', cream: 'pal_cream' };

export function buildWorld(scene, physics) {
  const world = { islands: {}, interactables: [], districts: {}, screens: [], updaters: [], places: [], props: [], bounds: null, npcBenches: [], balls: [], stumps: [], bulbs: [], boats: [] };

  // ---------- tiles ----------
  const seen = new Set();
  const tilesByType = {};
  const columns = [];
  const shapes = [];
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const isl of islands) {
    const c = axialToWorld(isl.cq, isl.cr);
    const info = { ...isl, x: c.x, z: c.z, tiles: [] };
    world.islands[isl.id] = info;
    for (const t of isl.tiles) {
      const k = `${t.q},${t.r}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const p = axialToWorld(t.q, t.r);
      const y = t.level * LEVEL_H;
      info.tiles.push({ ...t, x: p.x, z: p.z, y });
      (tilesByType[t.type] ||= []).push(new THREE.Matrix4().makeTranslation(p.x, y, p.z));
      if (t.level > 0) columns.push(new THREE.Matrix4().makeTranslation(p.x, y, p.z));
      physics.addHex(p.x, p.z, y, HEX_R, t.type);
      shapes.push({ kind: 'hex', x: p.x, z: p.z, r: HEX_R });
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    world.places.push({ id: isl.id, name: isl.name, label: isl.label, x: c.x, z: c.z, project: isl.project || null });
  }
  const tileGeo = hexTileGeometry();
  for (const [type, mats] of Object.entries(tilesByType)) {
    const assetName = `hex_${type}`;
    const parts = hasAsset(assetName) ? assetParts(assetName) : [{ geometry: tileGeo, material: [clay(TILE_TOP[type] || 'pal_grass'), clay('pal_cream')] }];
    instanced(scene, parts, mats, { castShadow: true });
  }
  if (columns.length) {
    const parts = hasAsset('hex_column') ? assetParts('hex_column') : [{ geometry: columnGeometry(), material: clay('pal_cream') }];
    instanced(scene, parts, columns.map((m) => m.clone().multiply(new THREE.Matrix4().makeTranslation(0, hasAsset('hex_column') ? -1.0 : 0, 0))));
  }

  // ---------- bridges and stepping stones ----------
  const bridgeMats = [], stepMats = [];
  for (const [a, b, kind] of bridges) {
    const A = world.islands[a], B = world.islands[b];
    let best = null;
    for (const ta of A.tiles) for (const tb of B.tiles) {
      const d = Math.hypot(ta.x - tb.x, ta.z - tb.z);
      if (!best || d < best.d) best = { d, ta, tb };
    }
    if (!best || best.d < HEX_R * 1.9) continue; // islands touch: no bridge needed
    const { ta, tb } = best;
    const dirX = (tb.x - ta.x) / best.d, dirZ = (tb.z - ta.z) / best.d;
    const ap = HEX_R * 0.866 - 0.15;
    const p0 = { x: ta.x + dirX * ap, z: ta.z + dirZ * ap, y: ta.y };
    const p1 = { x: tb.x - dirX * ap, z: tb.z - dirZ * ap, y: tb.y };
    const L = Math.hypot(p1.x - p0.x, p1.z - p0.z);
    const yaw = Math.atan2(dirX, dirZ);
    const mx = (p0.x + p1.x) / 2, mz = (p0.z + p1.z) / 2;
    if (kind === 'bridge') {
      const n = Math.max(1, Math.round(L / 2));
      const seg = L / n;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const x = p0.x + (p1.x - p0.x) * t, z = p0.z + (p1.z - p0.z) * t;
        const y = p0.y + (p1.y - p0.y) * t + Math.sin(t * Math.PI) * 0.12;
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.atan2(-(p1.y - p0.y), L), yaw, 0, 'YXZ')), new THREE.Vector3(1, 1, seg / 2));
        bridgeMats.push(m);
      }
      physics.addRect(mx, mz, p0.y + 0.04, 0.78, L / 2 + 0.35, yaw, 'wood', p1.y + 0.04);
      shapes.push({ kind: 'rect', x: mx, z: mz, hw: 0.8, hl: L / 2, c: Math.cos(yaw), s: Math.sin(yaw) });
    } else {
      const n = Math.max(2, Math.ceil(L / 1.25));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = p0.x + (p1.x - p0.x) * t, z = p0.z + (p1.z - p0.z) * t;
        const y = p0.y + (p1.y - p0.y) * t - 0.05;
        const wob = Math.sin(i * 2.3) * 0.18;
        stepMats.push(new THREE.Matrix4().compose(new THREE.Vector3(x + wob * dirZ, y, z - wob * dirX), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 0.7), new THREE.Vector3(1, 1, 1)));
        physics.addDisc(x + wob * dirZ, z - wob * dirX, y, 0.8, 'stone');
        shapes.push({ kind: 'disc', x: x + wob * dirZ, z: z - wob * dirX, r: 0.8 });
      }
    }
  }
  if (bridgeMats.length) instanced(scene, assetParts('bridge'), bridgeMats);
  if (stepMats.length) {
    const parts = hasAsset('hex_step') ? assetParts('hex_step') : [{ geometry: new THREE.CylinderGeometry(0.78, 0.8, 1.2, 6).translate(0, -0.6, 0), material: clay('pal_stone') }];
    instanced(scene, parts, stepMats);
  }

  // ---------- districts (one build state per project) ----------
  for (const isl of islands) {
    if (!isl.project) continue;
    const build = newBuild();
    build.uBuildOn.value = 1;
    build.uBuildY.value = -50;
    build.uReveal.value = 0.32;
    world.districts[isl.project] = { slug: isl.project, island: isl.id, build, objects: [], screens: [], launched: false, minY: 0, maxY: 6, pad: null };
  }

  // ---------- props ----------
  const prng = rng(7);
  for (const [islandId, list] of Object.entries(props)) {
    const isl = world.islands[islandId];
    if (!isl) continue;
    for (const [name, ox, oz, rot = 0, extra = {}] of list) {
      let x = isl.x + ox, z = isl.z + oz;
      // Keep trees and bushes off paths, bridge ends and stepping stones: nudge them onto grass nearby.
      if (TREE.test(name)) {
        const onPath = (px, pz) => { physics.heightAt(px, pz); return physics._tag !== 'grass' && physics._tag !== 'grass_deep' && physics._tag !== 'sand'; };
        if (onPath(x, z)) {
          let best = null;
          for (let r = 0.8; r <= 3.2 && !best; r += 0.6) for (let a = 0; a < 12; a++) {
            const px = x + Math.cos((a / 12) * Math.PI * 2) * r, pz = z + Math.sin((a / 12) * Math.PI * 2) * r;
            if (physics.ground(px, pz, 0.6) !== null && !onPath(px, pz)) { best = [px, pz]; break; }
          }
          if (!best) continue;
          [x, z] = best;
        }
      }
      const gy = physics.ground(x, z, 0) ?? 0;
      const district = extra.district ? world.districts[extra.district] : null;
      const obj = spawn(name, { build: district ? district.build : null });
      const yaw = THREE.MathUtils.degToRad(rot);
      obj.position.set(x, gy + (extra.float || 0), z);
      obj.rotation.y = yaw;
      if (TREE.test(name)) obj.scale.setScalar(0.92 + prng() * 0.2);
      scene.add(obj);
      obj.updateMatrixWorld(true);
      const rec = { name, obj, island: islandId, x, z, y: gy, yaw, extra };
      world.props.push(rec);

      // collider from what touches the ground (trunks, walls, legs), never roofs or awnings
      if (!NO_COLLIDE.test(name) && !extra.float) {
        if (TREE.test(name)) rec.collider = physics.addCircle(x, z, name === 'agave' || name === 'cactus_finger' ? 0.38 : 0.24, { top: gy + 3 });
        else if (/^(signpost|lamp_post|flagpole|milestone_flag|summit_flag|mailbox)$/.test(name)) rec.collider = physics.addCircle(x, z, 0.16, { top: gy + 3 });
        else rec.collider = addFootprint(physics, obj);
        // Blueprints (unlaunched districts) are walk-through; they turn solid when launched.
        if (district && rec.collider) { rec.collider.enabled = false; (district.colliders ||= []).push(rec.collider); }
      }
      if (name === 'dock' || name === 'pier') {
        physics.addRect(x, z, gy + 0.02, 1.0, 1.0, yaw, 'wood');
        shapes.push({ kind: 'rect', x, z, hw: 1.0, hl: 1.0, c: Math.cos(yaw), s: Math.sin(yaw) });
      }

      if (district) district.objects.push(obj);
      setupScreensAndLabels(rec, world, district);
      if (extra.plaque) addPlaque(scene, obj, extra.plaque, physics);

      if (extra.launch) {
        const d = world.districts[extra.launch];
        d.pad = rec;
        const seed = spawn('idea_seed');
        seed.position.set(x, gy + 0.05, z);
        scene.add(seed);
        d.seed = seed;
        world.interactables.push({ id: `launch:${extra.launch}`, type: 'launch', slug: extra.launch, x, z, y: gy, r: 2.2, prompt: 'Hold to launch', obj: rec.obj });
      }
      if (extra.interact) {
        const use = obj.getObjectByName('use');
        const p = new THREE.Vector3();
        if (use) use.getWorldPosition(p); else p.set(x + Math.sin(yaw) * 1.2, gy, z + Math.cos(yaw) * 1.2);
        world.interactables.push({ id: `${extra.interact.type}:${islandId}:${name}:${ox}`, ...extra.interact, x: p.x, z: p.z, y: gy, r: 1.6, obj, rec, district: extra.district || null });
      }
      if (extra.npc !== undefined) world.npcBenches.push({ index: extra.npc, rec });
      if (extra.ball) world.balls.push(rec);
      if (name === 'cricket_stumps') world.stumps.push(rec);
      if (extra.collect) world.bulbs.push({ id: extra.collect, rec, taken: false });
      if (name === 'paper_boat') world.boats.push(rec);
    }
  }

  // Districts: measure their height for the build sweep, hide screens until launched.
  for (const d of Object.values(world.districts)) {
    const bb = new THREE.Box3();
    d.objects.forEach((o) => bb.expandByObject(o));
    if (isFinite(bb.min.y)) { d.minY = bb.min.y; d.maxY = bb.max.y; }
    d.screens.forEach((s) => (s.visible = false));
  }

  // ---------- grass spikes ----------
  const spikeMats = [];
  const gr = rng(42);
  const blockers = world.props.filter((p) => !/grass_|flower/.test(p.name));
  for (const isl of Object.values(world.islands)) {
    if (isl.id === 'garden') continue;
    for (const t of isl.tiles) {
      if (t.type !== 'grass' && t.type !== 'grass_deep') continue;
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = gr() * Math.PI * 2, rr = Math.sqrt(gr()) * HEX_R * 0.78;
        const x = t.x + Math.cos(a) * rr, z = t.z + Math.sin(a) * rr;
        if (blockers.some((p) => Math.hypot(p.x - x, p.z - z) < 1.3)) continue;
        const s = 0.7 + gr() * 0.7;
        spikeMats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, t.y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), gr() * 6.28), new THREE.Vector3(s, s * (0.8 + gr() * 0.6), s)));
      }
    }
  }
  // Grass blades: a light procedural cone (a dozen triangles) instead of the detailed asset, since there are thousands.
  if (spikeMats.length) instanced(scene, [{ geometry: new THREE.ConeGeometry(0.045, 0.17, 6, 1).translate(0, 0.085, 0), material: clay('pal_grass_deep') }], spikeMats, { castShadow: false });

  // ---------- GitHub garden ----------
  buildGarden(scene, world, physics);

  // ---------- clouds ----------
  const cr = rng(9);
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const c = spawn('cloud', { shadows: false });
    // Above the highest camera, so clouds never block the view; their soft shadows drift over the islands.
    c.position.set((cr() - 0.5) * 140, 34 + cr() * 6, (cr() - 0.5) * 120);
    c.scale.setScalar(1.2 + cr() * 1.6);
    c.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
    scene.add(c);
    clouds.push({ c, v: 0.4 + cr() * 0.5 });
  }
  world.updaters.push((dt) => {
    for (const { c, v } of clouds) {
      c.position.x += v * dt;
      if (c.position.x > 90) c.position.x = -90;
    }
  });

  // ---------- water ----------
  const pad = 30;
  world.bounds = { minX: minX - pad, minZ: minZ - pad, maxX: maxX + pad, maxZ: maxZ + pad };
  world.water = createWater({ bounds: world.bounds, shapes });
  scene.add(world.water);

  return world;
}

function screenImage(key) {
  if (key === 'portrait') return profile.portrait;
  const p = work.projects.find((x) => x.slug === key);
  return p ? p.image : null;
}

export function setupScreensAndLabels(rec, world, district) {
  const { obj, extra, name } = rec;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name === 'screen' || o.name.startsWith('screen')) {
      const key = extra.screen;
      const url = key ? screenImage(key) : null;
      const mat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      o.material = mat;
      o.castShadow = false;
      if (url) {
        imageTexture(url).then((t) => { const tt = t.clone(); mat.map = orientToQuad(tt, o.geometry, { cover: true, alignTop: key !== 'portrait' }); mat.needsUpdate = true; });
      }
      world.screens.push(o);
      if (district) district.screens.push(o);
    }
    const m = /^label(?:_(\d))?$/.exec(o.name);
    if (m) {
      const text = labelFor(name, extra, m[1] ? +m[1] : 0);
      if (text) {
        const tex = labelTexture(text.t, { sub: text.s || null, w: 512, h: 512 / Math.max(1.2, Math.min(8, quadAspect(o.geometry))) });
        o.material = new THREE.MeshBasicMaterial({ map: orientToQuad(tex, o.geometry, { cover: false }) });
        o.castShadow = false;
      }
    }
  });
}

/** A low cream plinth in front of a sculpture with a two-line caption, so big numbers explain themselves. */
function addPlaque(scene, obj, [line1, line2], physics) {
  obj.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(obj);
  const w = Math.max(1.4, Math.min(3.2, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * 0.9));
  const g = new THREE.Group();
  // A lectern-style sign: a short stand with a board tilted back, so the caption faces up toward the camera.
  const stand = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.42, 0.22), clay('pal_cream'));
  stand.position.y = 0.21;
  const board = new THREE.Group();
  board.position.set(0, 0.5, 0);
  board.rotation.x = -0.95;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 0.06), clay('pal_cream'));
  const tex = labelTexture(line1.toUpperCase(), { w: 1024, h: 256, size: 120, weight: 700, sub: line2, bg: '#F3EDE6', fg: '#C9573F' });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, 0.44), new THREE.MeshBasicMaterial({ map: tex }));
  face.position.z = 0.031;
  board.add(slab, face);
  for (const m of [stand, slab]) { m.castShadow = true; m.receiveShadow = true; }
  g.add(stand, board);
  // Face the plaque toward the default camera view and stand it just in front of the sculpture, so it reads at a glance.
  const camYaw = THREE.MathUtils.degToRad(-32);
  const camDir = new THREE.Vector3(Math.sin(camYaw), 0, Math.cos(camYaw));
  const size = new THREE.Vector3();
  bb.getSize(size);
  g.position.copy(obj.position).addScaledVector(camDir, Math.max(size.x, size.z) * 0.5 + 0.35);
  g.rotation.y = camYaw;
  scene.add(g);
  physics?.addBox(g.position.x, g.position.z, w / 2 - 0.05, 0.16, camYaw, { top: g.position.y + 0.32, id: 'plaque' });
}

function quadAspect(geo) {
  geo.computeBoundingBox();
  const s = geo.boundingBox.getSize(new THREE.Vector3());
  const d = [s.x, s.y, s.z].sort((a, b) => b - a);
  // width = the larger in-plane extent that is horizontal (x or z); height = y when the quad stands up
  const w = Math.max(s.x, s.z), h = s.y > d[2] * 1.5 ? s.y : Math.min(s.x, s.z);
  return w / Math.max(h, 1e-3);
}

function labelFor(name, extra, i) {
  if (extra.signs) return { t: extra.signs[i] || '' };
  if (name.startsWith('stall_')) {
    const id = { stall_whatsapp: 'whatsapp-ai', stall_saas: 'saas', stall_mobile: 'mobile', stall_desktop: 'desktop' }[name];
    const s = services.items.find((x) => x.id === id);
    return s ? { t: s.short } : null;
  }
  if (name === 'milestone_flag' || name === 'summit_flag') {
    const p = extra.interact?.panel || '';
    if (p === 'timeline:today') return { t: 'Today', s: 'Lead at Devscot' };
    const idx = +p.split(':')[1];
    const tl = timeline()[idx];
    return tl ? { t: tl.year, s: tl.short } : null;
  }
  if (name === 'toolshed') return { t: stack.groups[i]?.label || 'Toolshed' };
  if (name === 'library_kiosk') return { t: 'Library', s: `${github.repos.length} public repos` };
  if (name === 'storefront') return { t: 'Karobari', s: 'Live in 2 minutes' };
  if (name === 'welcome_arch') return { t: profile.name };
  return null;
}

export function timeline() {
  const ex = experience.items;
  return [
    { year: '2019', short: 'Virtual University', title: education.degree, org: education.school, period: education.period, text: `Studied ${education.focus.join(', ')}.` },
    { year: '2020', short: 'CrazyBeings Studios', title: ex[4].role, org: ex[4].company, period: ex[4].period, text: ex[4].summary },
    { year: '2020', short: 'Devscot', title: ex[0].role, org: ex[0].company, period: ex[0].period, text: ex[0].summary },
    { year: '2023', short: 'LeadProfit', title: ex[3].role, org: ex[3].company, period: ex[3].period, text: ex[3].summary },
    { year: '2024', short: 'Schooliee', title: ex[1].role, org: ex[1].company, period: ex[1].period, text: ex[1].summary },
    { year: '2025', short: 'Karobari', title: ex[2].role, org: ex[2].company, period: ex[2].period, text: ex[2].summary },
  ];
}

function buildGarden(scene, world, physics) {
  const isl = world.islands.garden;
  if (!isl) return;
  const days = github.days;
  const sp = 0.46;
  // A year folded into four seasonal beds (13 weeks each) in a 2x2 grid, so the garden fits its island.
  const cx = isl.x, cz = isl.z - 1.2;
  const bedW = 14 * sp, bedD = 7 * sp, gap = 1.3;
  const bedOrigin = (b) => ({ x: cx + (b % 2 === 0 ? -(bedW + gap / 2) : gap / 2), z: cz + (b < 2 ? -(bedD + gap / 2) : gap / 2) });
  const first = new Date(days[0][0] + 'T00:00:00Z').getUTCDay();
  const tiles = [], plants = [[], [], [], [], []];
  const gr = rng(3);
  // GitHub's own levels are skewed by a single very large day, so derive levels from quartiles of the real counts.
  const nz = days.map((d) => d[1]).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] ?? 1;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  const levelOf = (c) => (c <= 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);
  days.forEach(([, count], i) => {
    const level = levelOf(count);
    const idx = i + first;
    const week = Math.floor(idx / 7), row = idx % 7;
    const bed = Math.min(3, Math.floor(week / 14)), col = week - bed * 14;
    const o = bedOrigin(bed);
    const x = o.x + (col + 0.5) * sp, z = o.z + (row + 0.5) * sp;
    tiles.push(new THREE.Matrix4().makeTranslation(x, 0, z));
    if (level > 0) {
      const s = (0.85 + gr() * 0.3) * 1.5;
      plants[level].push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.1, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), gr() * 6.28), new THREE.Vector3(s, s, s)));
    }
  });
  instanced(scene, assetParts('garden_tile'), tiles, { castShadow: false });
  for (let l = 1; l <= 4; l++) if (plants[l].length) instanced(scene, assetParts(`garden_plant_${l}`), plants[l], { castShadow: l >= 3 });
  world.garden = { x: cx, z: cz, w: 2 * bedW + gap, h: 2 * bedD + gap, total: github.total?.lastYear ?? 0 };
  // Season markers: a small sign at the front of each bed, named by the months it covers.
  const monthName = (iso) => new Date(iso + 'T00:00:00Z').toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  for (let b = 0; b < 4; b++) {
    const startDay = Math.max(0, b * 98 - first), endDay = Math.min(days.length - 1, (b + 1) * 98 - first - 1);
    if (startDay > endDay) continue;
    const o = bedOrigin(b);
    const tex = labelTexture(`${monthName(days[startDay][0])} - ${monthName(days[endDay][0])}`, { w: 512, h: 160, size: 70 });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.34), new THREE.MeshBasicMaterial({ map: tex }));
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), clay('pal_wood'));
    const sx = o.x + bedW / 2, sz = b < 2 ? o.z - 0.25 : o.z + bedD + 0.25;
    post.position.set(sx, 0.25, sz);
    sign.position.set(sx, 0.62, sz);
    if (b < 2) sign.rotation.y = Math.PI;
    sign.rotation.x = b < 2 ? 0.25 : -0.25;
    scene.add(post, sign);
  }
  world.interactables.push({ id: 'garden', type: 'panel', panel: 'garden', prompt: 'Read the garden sign', x: isl.x - 0.6, z: isl.z + 4.8, y: 0, r: 2.0 });
}
