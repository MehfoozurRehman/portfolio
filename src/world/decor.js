// Set dressing: story props per island, tile-aware scatter, shoreline life, and the pink diorama wall.
// Decorative items appear only when their Blender asset exists (no stand-in boxes for decoration).
import * as THREE from 'three';
import { spawn, hasAsset } from './assets.js';
import { clay } from './materials.js';
import { HEX_R, hexCorners, insideHex } from './hex.js';
import { WATER_Y } from './water.js';
import { setupScreensAndLabels, instanced } from './builder.js';
import { addFootprint } from '../game/colliders.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// [asset, x, z, rotDeg, opts]; opts.interact adds a small interaction; opts.float lifts it.
export const storyProps = {
  home: [
    ['charpai', -6.2, 0.6, 70, { interact: { type: 'sit', prompt: 'Sit on the charpai' } }],
    ['cat_sleep', -6.0, 1.3, 40, { interact: { type: 'pet', prompt: 'Pet the cat', sound: 'meow' } }],
    ['potted_plant_a', -0.9, -0.9, 0], ['potted_plant_b', -5.9, -0.9, 0],
    ['chai_set', -5.6, 1.6, 0],
    ['bicycle', 0.4, -1.0, 70, { interact: { type: 'ring', prompt: 'Ring the bicycle bell' } }],
    ['flower_bed', 2.6, 2.2, 0], ['mushrooms', -5.8, 3.6, 0], ['path_stones', 0.8, 2.8, 30],
  ],
  services: [
    ['electric_pole', -7.6, -0.4, 90], ['electric_pole', -3.6, -6.4, 90], ['electric_pole', 3.6, -6.4, 90], ['electric_pole', 7.6, -0.4, 90],
    ['bunting', -6.0, -5.2, 8, { float: 3.0 }], ['bunting', -2.0, -5.6, 0, { float: 3.0 }], ['bunting', 2.0, -5.6, -4, { float: 3.0 }],
    ['fruit_cart', -1.6, 2.2, 20, { interact: { type: 'honk', prompt: 'Grab a fruit', sound: 'pop' } }],
    ['notice_pillar', 2.8, 1.6, 0, { interact: { type: 'panel', panel: 'about', prompt: 'Read the notice pillar' } }],
    ['bench_picnic', 0.6, 4.8, 0, { interact: { type: 'sit', prompt: 'Sit at the picnic table' } }],
    ['sack_grain', 5.0, 3.8, 0], ['crate_fruit', 5.4, 4.6, 20], ['bin', -3.6, 5.6, 0], ['potted_plant_b', -6.8, 1.0, 0], ['potted_plant_a', 6.2, -0.4, 0],
  ],
  schooliee: [
    ['bus_stop', 4.6, 5.0, 180, { interact: { type: 'panel', panel: 'project:schooliee', prompt: 'Read the bus stop poster' } }],
    ['bicycle', 2.6, -0.6, 80, { interact: { type: 'ring', prompt: 'Ring the bicycle bell' } }],
    ['npc_f', 1.4, -1.2, 200, { kid: true }],
    ['kids_ball', -1.8, 3.2, 0, { ball: true }],
    ['electric_pole', -6.8, -2.4, 90], ['electric_pole', 2.2, -7.4, 0], ['electric_pole', 6.8, -0.8, 90],
    ['bunting', -3.0, -5.6, 0, { float: 3.1 }],
    ['flower_bed', -6.2, 2.6, 0], ['bench_picnic', 1.2, 6.8, 20, { interact: { type: 'sit', prompt: 'Sit at the picnic table' } }],
  ],
  karobari: [
    ['rickshaw', -6.2, -3.6, 60, { interact: { type: 'honk', prompt: 'Honk the rickshaw horn', sound: 'honk' } }],
    ['fruit_cart', 1.8, 1.6, -20, { interact: { type: 'honk', prompt: 'Grab a fruit', sound: 'pop' } }],
    ['string_lights', -2.6, -2.2, 0, { float: 2.8 }], ['string_lights', 0.6, -2.2, 0, { float: 2.8 }],
    ['charpai', 3.0, 5.6, -10, { interact: { type: 'sit', prompt: 'Sit on the charpai' } }], ['chai_set', 3.4, 4.8, 0],
    ['cat', 4.4, -2.8, -60, { interact: { type: 'pet', prompt: 'Pet the cat', sound: 'meow' } }],
    ['sack_grain', -0.6, 6.6, 0], ['crate_fruit', 0.4, 7.0, 30], ['water_cooler', 6.6, 0.8, -60],
    ['goat', 5.0, 5.8, -120, { interact: { type: 'pet', prompt: 'Say hello to the goat', sound: 'baa' } }],
    ['electric_pole', -3.8, -6.8, 90], ['electric_pole', 3.8, -6.8, 90],
    ['dhaba_bench', -2.0, 2.6, 160, { interact: { type: 'sit', prompt: 'Sit for a cup of chai' } }],
  ],
  whatsapp: [
    ['parcel', 1.8, -0.6, 10], ['parcel', 2.2, -0.2, 40], ['mail_sack', 1.2, 0.2, 0], ['mail_sack', -1.6, -0.2, 30],
    ['bicycle', -4.6, 0.6, 30, { interact: { type: 'ring', prompt: 'Ring the courier bell' } }],
    ['lantern', -1.4, -3.6, 0, { float: 2.6 }], ['flower_bed', 5.2, 0.0, 0], ['dog', 3.0, 3.4, -140, { interact: { type: 'pet', prompt: 'Pet the dog', sound: 'woof' } }],
  ],
  leadprofit: [
    ['bollard', -1.0, 6.4, 0], ['bollard', 1.0, 6.4, 0], ['rope_coil', 0.8, 5.8, 0], ['barrel_small', -1.6, 5.4, 0],
    ['crate_fruit', 3.6, -1.0, 15], ['sack_grain', 4.2, -0.4, 0], ['lantern', 0.0, 4.8, 0, { float: 2.2 }],
    ['seagull', 1.3, 6.5, 30, { float: 0.95 }],
  ],
  dsme: [
    ['fountain', -0.2, 3.2, 0, { interact: { type: 'wish', prompt: 'Toss a coin and make a wish' } }],
    ['street_lamp_double', 3.0, 1.0, 0], ['street_lamp_double', -3.4, -0.2, 0], ['notice_pillar', 5.2, 2.4, 0, { interact: { type: 'panel', panel: 'project:dsme-globals', prompt: 'Read the pillar' } }],
    ['potted_plant_a', 1.6, -4.8, 0], ['potted_plant_b', -3.4, -4.8, 0], ['bin', 1.2, -6.0, 0],
  ],
  mobile: [
    ['app_balloon', -1.4, 1.6, 0, { float: 0, balloon: true }], ['app_balloon', 1.6, 2.2, 0, { balloon: true }], ['app_balloon', -0.2, -1.4, 0, { balloon: true }],
    ['phone_giant', 5.0, -1.8, -40, { screen: 'expo-mobile-apps' }], ['kids_ball', 1.0, 5.0, 0, { ball: true }],
    ['bench_picnic', -3.6, 4.4, 30, { interact: { type: 'sit', prompt: 'Sit at the picnic table' } }], ['flower_bed', -6.2, -2.6, 0],
  ],
  timeline: [
    ['bench', 4.4, 6.0, 200, { interact: { type: 'sit', prompt: 'Sit and enjoy the view' } }],
    ['path_stones', -3.0, 4.6, 40], ['flower_bed', 3.4, -2.6, 0], ['bush_flowering', -6.0, 3.0, 0], ['mushrooms', 5.0, -4.4, 0],
  ],
  garden: [
    ['potted_plant_a', -2.4, 7.6, 0], ['bin', 1.0, 8.6, 0], ['cat', 1.2, 6.4, 160, { interact: { type: 'pet', prompt: 'Pet the cat', sound: 'meow' } }],
    ['bench', -8.4, 4.2, 120, { interact: { type: 'sit', prompt: 'Sit and look at the garden' } }],
  ],
  park: [
    ['dog', 1.0, 0.8, 200, { interact: { type: 'pet', prompt: 'Pet the dog', sound: 'woof' } }],
    ['potted_plant_b', -0.8, -2.6, 0], ['bush_flowering', 3.4, -2.6, 0], ['street_lamp_double', -3.6, -0.2, 0],
  ],
  cricket: [
    ['cricket_bat', -2.0, -0.8, 30], ['umbrella_beach', 2.2, 1.8, 0], ['sun_lounger', 1.4, 2.4, -30, { interact: { type: 'sit', prompt: 'Lie on the sun lounger' } }],
  ],
  lighthouse: [
    ['umbrella_beach', -2.6, -1.4, 0], ['sun_lounger', -2.0, -0.6, 40, { interact: { type: 'sit', prompt: 'Relax on the sun lounger' } }],
    ['buoy', 2.4, 6.8, 0, { water: true }], ['rowboat', -2.8, 6.4, 70, { water: true }], ['shell', 1.6, 2.4, 0], ['starfish', 2.2, 2.0, 40],
  ],
};

const SCATTER = {
  grass: [['tulips', 0.10], ['flower_patch', 0.04], ['bush_round', 0.05], ['bush_flowering', 0.05], ['rock_a', 0.04], ['rock_b', 0.04], ['mushrooms', 0.03], ['grass_tall', 0.10], ['tree_small_mint', 0.03], ['tree_small_coral', 0.03]],
  grass_deep: [['grass_tall', 0.14], ['agave', 0.04], ['bush_round', 0.06], ['rock_c', 0.04], ['mushrooms', 0.04], ['tulips', 0.06]],
  sand: [['shell', 0.14], ['starfish', 0.08], ['rock_a', 0.06], ['pebbles', 0.1]],
  stone: [['pebbles', 0.08]],
  cream: [['potted_plant_a', 0.05], ['potted_plant_b', 0.05]],
};
const NO_COLLIDE = /^(tulips|flower_patch|grass_|mushrooms|pebbles|shell|starfish|path_stones|string_lights|bunting|lantern|lily|duck|fish|seagull|butterfly|app_balloon|chai_set|parcel|kids_ball)/;

export function decorate(scene, world, physics) {
  const out = { interactables: [], balls: [], balloons: [], waterProps: [], flowers: [], idlers: [] };
  const occupied = world.props.map((p) => ({ x: p.x, z: p.z, r: 1.4 }));

  // ---------- story props ----------
  for (const [islandId, list] of Object.entries(storyProps)) {
    const isl = world.islands[islandId];
    if (!isl) continue;
    for (const [name, ox, oz, rot = 0, o = {}] of list) {
      if (!hasAsset(name)) continue;
      const x = isl.x + ox, z = isl.z + oz;
      let gy = physics.ground(x, z, 0);
      if (gy === null) gy = o.water ? WATER_Y : 0;
      if (o.water) gy = WATER_Y + 0.02;
      const obj = spawn(name);
      const yaw = THREE.MathUtils.degToRad(rot);
      obj.position.set(x, gy + (o.float || 0), z);
      obj.rotation.y = yaw;
      scene.add(obj);
      obj.updateMatrixWorld(true);
      occupied.push({ x, z, r: 1.2 });
      const rec = { name, obj, island: islandId, x, z, y: gy, yaw, extra: o };
      world.props.push(rec);
      if (!NO_COLLIDE.test(name) && !o.float && !o.water) addFootprint(physics, obj);
      if (o.water) out.waterProps.push(rec);
      if (o.ball) out.balls.push(rec);
      if (o.balloon) out.balloons.push(rec);
      if (/^npc_/.test(name)) out.idlers.push(rec);
      setupScreensAndLabels(rec, world, null);
      if (o.interact) {
        const use = obj.getObjectByName('use');
        const p = new THREE.Vector3();
        if (use) use.getWorldPosition(p); else p.set(x + Math.sin(yaw) * 1.1, gy, z + Math.cos(yaw) * 1.1);
        out.interactables.push({ id: `${o.interact.type}:${islandId}:${name}:${ox}`, ...o.interact, x: p.x, z: p.z, y: gy, r: 1.5, obj, rec });
      }
    }
  }

  // ---------- electricity poles with sagging wires (consecutive poles on an island are wired together) ----------
  const wireMat = clay('pal_ink');
  for (const isl of Object.values(world.islands)) {
    const poles = world.props.filter((p) => p.island === isl.id && p.name === 'electric_pole');
    for (let i = 0; i + 1 < poles.length; i++) {
      const A = poles[i].obj, B = poles[i + 1].obj;
      for (const end of ['wire_a', 'wire_b']) {
        const ea = A.getObjectByName(end), eb = B.getObjectByName(end);
        if (!ea || !eb) continue;
        const pa = ea.getWorldPosition(new THREE.Vector3()), pb = eb.getWorldPosition(new THREE.Vector3());
        const mid = pa.clone().lerp(pb, 0.5);
        mid.y -= Math.min(1.2, pa.distanceTo(pb) * 0.08);
        const curve = new THREE.QuadraticBezierCurve3(pa, mid, pb);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.014, 5, false), wireMat);
        tube.castShadow = true;
        scene.add(tube);
      }
    }
  }

  // ---------- tile scatter (instanced) ----------
  const r = rng(77);
  const groups = new Map();
  for (const isl of Object.values(world.islands)) {
    if (isl.id === 'garden') continue;
    for (const t of isl.tiles) {
      const rules = SCATTER[t.type];
      if (!rules) continue;
      for (const [name, chance] of rules) {
        if (!hasAsset(name)) continue;
        const tries = 3;
        for (let i = 0; i < tries; i++) {
          if (r() > chance) continue;
          const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * HEX_R * 0.8;
          const x = t.x + Math.cos(a) * rr, z = t.z + Math.sin(a) * rr;
          if (occupied.some((o) => Math.hypot(o.x - x, o.z - z) < o.r)) continue;
          if (!insideHex(x, z, t.x, t.z, HEX_R, 0.35)) continue;
          occupied.push({ x, z, r: 0.6 });
          const s = 0.8 + r() * 0.45;
          const m = new THREE.Matrix4().compose(new THREE.Vector3(x, t.y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28), new THREE.Vector3(s, s, s));
          if (!groups.has(name)) groups.set(name, []);
          groups.get(name).push(m);
          // Only sapling trunks are solid; bushes, rocks, pebbles and flowers never block the player.
          if (/tree_small/.test(name)) physics.addCircle(x, z, 0.12 * s, { top: t.y + 2 });
          if (/tulips|flower|bush_flowering/.test(name)) out.flowers.push(new THREE.Vector3(x, t.y + 0.5, z));
        }
      }
    }
  }
  for (const [name, mats] of groups) instancedAsset(scene, name, mats, !/grass_|pebbles|shell|starfish/.test(name));

  // ---------- shoreline: reeds and lily pads in the water next to grass edges ----------
  const shore = new Map();
  const tileSet = new Set(Object.values(world.islands).flatMap((i) => i.tiles.map((t) => `${t.q},${t.r}`)));
  const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  for (const isl of Object.values(world.islands)) {
    for (const t of isl.tiles) {
      dirs.forEach(([dq, dr], i) => {
        if (tileSet.has(`${t.q + dq},${t.r + dr}`)) return;
        if (r() > 0.22) return;
        // edge midpoint direction for pointy-top axial neighbours
        const nx = HEX_R * Math.sqrt(3) * (dq + dr / 2), nz = HEX_R * 1.5 * dr;
        const len = Math.hypot(nx, nz);
        const px = t.x + (nx / len) * (HEX_R * 0.866 + 0.7 + r() * 0.8), pz = t.z + (nz / len) * (HEX_R * 0.866 + 0.7 + r() * 0.8);
        if (physics.ground(px, pz, 0) !== null) return;
        const name = t.type === 'sand' ? 'lily_pad' : r() < 0.55 ? 'reeds' : 'lily_pad';
        if (!hasAsset(name)) return;
        const y = name === 'reeds' ? WATER_Y - 0.15 : WATER_Y + 0.01;
        const m = new THREE.Matrix4().compose(new THREE.Vector3(px, y, pz), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28), new THREE.Vector3(1, 1, 1).multiplyScalar(0.8 + r() * 0.5));
        if (!shore.has(name)) shore.set(name, []);
        shore.get(name).push(m);
      });
    }
  }
  for (const [name, mats] of shore) instancedAsset(scene, name, mats, false);

  // ---------- the pink diorama wall (like the reference) ----------
  const b = world.bounds;
  const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
  const R = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 0.62 + 14;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 3.2, 96, 1, true), clay('pal_pink'));
  wall.material = wall.material.clone();
  wall.material.side = THREE.BackSide;
  wall.position.set(cx, WATER_Y + 1.1, cz);
  const cap = new THREE.Mesh(new THREE.TorusGeometry(R, 0.55, 12, 120), clay('pal_cream'));
  cap.rotation.x = Math.PI / 2;
  cap.position.set(cx, WATER_Y + 2.7, cz);
  const ledge = new THREE.Mesh(new THREE.RingGeometry(R - 0.1, R + 9, 96).rotateX(-Math.PI / 2), clay('pal_cream'));
  ledge.position.set(cx, WATER_Y + 2.7, cz);
  wall.receiveShadow = cap.receiveShadow = ledge.receiveShadow = true;
  scene.add(wall, cap, ledge);
  world.wallRadius = R;
  world.wallCenter = new THREE.Vector3(cx, 0, cz);

  return out;
}

function instancedAsset(scene, name, mats, castShadow) {
  const obj = spawn(name);
  obj.updateMatrixWorld(true);
  const parts = [];
  obj.traverse((o) => { if (o.isMesh) parts.push({ geometry: o.geometry.clone().applyMatrix4(o.matrixWorld), material: o.material }); });
  instanced(scene, parts, mats, { castShadow });
}

export { hexCorners };
