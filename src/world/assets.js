// Loads the Blender packs (character, nature, buildings), swaps palette materials for shared clay
// materials, and hands out copies by root name. Missing assets fall back to simple clay stand-ins,
// so the world is playable before (or without) every pack.
// Asset front faces +Z (Blender -Y after glTF export). Origin at the bottom centre.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { loadGLB } from '@shared/three-utils.js';
import { clay } from './materials.js';

// Lazy glob: each pack becomes its own JS chunk (the GLB inlined as a data URL), keeping every published
// file under the artifact's per-file size limit and letting packs load in parallel.
const packUrls = import.meta.glob('../models/*.glb', { query: '?url', import: 'default' });

const roots = new Map(); // name -> Object3D (template)
const clips = new Map(); // name -> AnimationClip
export const loaded = { packs: [] };

export async function loadPacks(onProgress) {
  const entries = Object.entries(packUrls);
  let done = 0;
  const urls = await Promise.all(entries.map(([, load]) => load().catch(() => null)));
  for (const [i, [path]] of entries.entries()) {
    const url = urls[i];
    if (!url) { done++; continue; }
    try {
      const gltf = await loadGLB(url);
      const pack = path.split('/').pop().replace('.glb', '');
      // GLTFLoader makes node names unique across a file (seat_0 -> seat_0_1). The engine looks children up
      // by their Blender names (seat_0, use, label, screen...), so restore the original names.
      // Animation tracks were created with the unique names, so remap them too.
      const json = gltf.parser.json;
      const rename = new Map();
      gltf.scene.traverse((o) => {
        const a = gltf.parser.associations.get(o);
        const orig = a && a.nodes !== undefined ? json.nodes[a.nodes]?.name : null;
        if (orig && orig !== o.name) { rename.set(o.name, orig); o.name = orig; }
      });
      for (const clip of gltf.animations) {
        for (const t of clip.tracks) {
          const dot = t.name.indexOf('.');
          const node = t.name.slice(0, dot);
          if (rename.has(node)) t.name = rename.get(node) + t.name.slice(dot);
        }
      }
      for (const child of [...gltf.scene.children]) roots.set(child.name, child);
      for (const clip of gltf.animations) clips.set(clip.name, clip);
      loaded.packs.push(pack);
    } catch (e) {
      console.warn('pack failed', path, e);
    }
    done++;
    onProgress?.(done / Math.max(1, entries.length));
  }
}

export const hasAsset = (name) => roots.has(name);
export const getClip = (name) => clips.get(name);
export const allClips = () => [...clips.values()];

/** Swap palette materials for shared clay ones; set shadows. */
export function claify(obj, { build = null, shadows = true } = {}) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const hasVC = !!o.geometry.attributes.color;
    const swap = (m) => clay(m?.name || 'pal_cream', { vertexColors: hasVC, build, skinned: !!o.isSkinnedMesh });
    o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
    o.castShadow = shadows;
    o.receiveShadow = true;
  });
  return obj;
}

/** A fresh copy of an asset by root name (with clay materials). */
export function spawn(name, opts = {}) {
  const tpl = roots.get(name);
  let obj;
  if (tpl) {
    let skinned = false;
    tpl.traverse((o) => { if (o.isSkinnedMesh) skinned = true; });
    obj = skinned ? SkeletonUtils.clone(tpl) : tpl.clone(true);
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
  } else {
    obj = placeholder(name);
  }
  obj.name = name;
  claify(obj, opts);
  return obj;
}

// ---------- stand-ins ----------
const m = (pal) => new THREE.MeshStandardMaterial({ name: pal });
function mesh(geo, pal, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m(pal));
  o.position.set(x, y, z);
  return o;
}
function empty(name, x, y, z, ry = 0) {
  const e = new THREE.Object3D();
  e.name = name;
  e.position.set(x, y, z);
  e.rotation.y = ry;
  return e;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d, 1, 1, 1);
const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r) => new THREE.SphereGeometry(r, 24, 16);

function tree(canopy, h = 2.4, shape = 'round') {
  const g = new THREE.Group();
  g.add(mesh(cyl(0.12, 0.16, h * 0.55), 'pal_cream', 0, h * 0.27, 0));
  if (shape === 'capsule') g.add(mesh(new THREE.CapsuleGeometry(0.42, h * 0.45, 8, 20), canopy, 0, h * 0.78, 0));
  else if (shape === 'pear') { const s = mesh(sph(0.62), canopy, 0, h * 0.72, 0); s.scale.set(1, 1.35, 1); g.add(s); }
  else { g.add(mesh(sph(0.7), canopy, 0, h * 0.72, 0)); g.add(mesh(sph(0.5), canopy, 0.35, h * 0.95, 0.1)); }
  return g;
}

function placeholder(name) {
  const g = new THREE.Group();
  const n = name;
  if (n.startsWith('tree_') || n === 'palm' || n === 'bush_round') {
    const pal = n.includes('coral') ? 'pal_coral' : n.includes('deep') ? 'pal_grass_deep' : n.includes('light') ? 'pal_grass_light' : 'pal_grass';
    return tree(pal, n === 'bush_round' ? 1 : 2.6, n.includes('capsule') ? 'capsule' : n.includes('pear') ? 'pear' : 'round');
  }
  switch (n) {
    case 'bench':
      g.add(mesh(box(1.6, 0.1, 0.5), 'pal_coral', 0, 0.42, 0), mesh(box(1.6, 0.4, 0.08), 'pal_coral', 0, 0.68, -0.22));
      g.add(mesh(box(0.08, 0.42, 0.4), 'pal_cream', -0.7, 0.21, 0), mesh(box(0.08, 0.42, 0.4), 'pal_cream', 0.7, 0.21, 0));
      g.add(empty('seat', 0, 0.45, 0.02), empty('use', 0, 0, 0.75));
      return g;
    case 'swing_set': {
      g.add(mesh(box(3.0, 0.12, 0.12), 'pal_cream', 0, 2.3, 0));
      for (const x of [-1.5, 1.5]) g.add(mesh(cyl(0.06, 0.06, 2.4, 10), 'pal_cream', x, 1.15, 0));
      for (const [i, x] of [[0, -0.7], [1, 0.7]]) {
        const piv = empty(`swing_${i}`, x, 2.3, 0);
        piv.add(mesh(box(0.5, 0.06, 0.3), 'pal_coral', 0, -1.85, 0));
        piv.add(mesh(cyl(0.015, 0.015, 1.85, 6), 'pal_ink', -0.22, -0.92, 0), mesh(cyl(0.015, 0.015, 1.85, 6), 'pal_ink', 0.22, -0.92, 0));
        piv.add(empty(`seat_${i}`, 0, -1.82, 0));
        g.add(piv);
      }
      g.add(empty('use', 0, 0, 1.2));
      return g;
    }
    case 'slide': {
      const ramp = mesh(box(0.7, 0.08, 3.2), 'pal_coral', 0, 1.0, 1.0);
      ramp.rotation.x = 0.62;
      g.add(ramp, mesh(box(0.8, 0.1, 0.8), 'pal_cream', 0, 1.9, -0.9));
      for (const x of [-0.35, 0.35]) g.add(mesh(cyl(0.05, 0.05, 1.9, 8), 'pal_cream', x, 0.95, -1.3));
      for (let i = 0; i < 8; i++) g.add(empty(`slide_${i}`, 0, 2.05 - (i / 7) * 1.95, -0.7 + (i / 7) * 3.0));
      g.add(empty('use', 0, 0, -1.9, Math.PI));
      return g;
    }
    case 'seesaw': {
      g.add(mesh(cyl(0.18, 0.25, 0.45, 12), 'pal_cream', 0, 0.22, 0));
      const beam = empty('beam', 0, 0.45, 0);
      beam.add(mesh(box(0.25, 0.08, 3.2), 'pal_coral', 0, 0, 0), empty('seat_0', 0, 0.1, -1.35, Math.PI), empty('seat_1', 0, 0.1, 1.35));
      g.add(beam, empty('use', 0.9, 0, -1.3));
      return g;
    }
    case 'lamp_post':
      g.add(mesh(cyl(0.06, 0.09, 2.6, 12), 'pal_cream', 0, 1.3, 0), mesh(sph(0.2), 'pal_emissive', 0, 2.7, 0));
      return g;
    case 'signpost':
      g.add(mesh(cyl(0.07, 0.07, 2.2, 10), 'pal_wood', 0, 1.1, 0));
      for (let i = 0; i < 4; i++) {
        const b = mesh(box(1.2, 0.26, 0.05), 'pal_cream', 0, 1.9 - i * 0.34, 0);
        b.rotation.y = i * 0.8 - 1.2;
        const l = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.22), m('pal_cream'));
        l.name = `label_${i}`;
        l.position.z = 0.03;
        b.add(l);
        g.add(b);
      }
      return g;
    case 'flagpole': {
      g.add(mesh(cyl(0.04, 0.05, 4, 10), 'pal_cream', 0, 2, 0));
      const f = empty('flag', 0, 3.7, 0);
      f.add(mesh(box(0.9, 0.55, 0.02), 'pal_grass_deep', 0.45, 0, 0));
      g.add(f);
      return g;
    }
    case 'mailbox': {
      g.add(mesh(cyl(0.05, 0.05, 1.0, 8), 'pal_cream', 0, 0.5, 0), mesh(box(0.4, 0.32, 0.55), 'pal_coral', 0, 1.15, 0));
      const lid = empty('lid', 0, 1.3, 0.27);
      lid.add(mesh(box(0.38, 0.04, 0.3), 'pal_coral_deep', 0, 0, -0.14));
      g.add(lid, empty('use', 0, 0, 0.8));
      return g;
    }
    case 'crate': g.add(mesh(box(0.7, 0.7, 0.7), 'pal_wood', 0, 0.35, 0)); return g;
    case 'crate_stack': g.add(mesh(box(0.7, 0.7, 0.7), 'pal_wood', 0, 0.35, 0), mesh(box(0.7, 0.7, 0.7), 'pal_wood', 0.75, 0.35, 0), mesh(box(0.7, 0.7, 0.7), 'pal_wood', 0.35, 1.05, 0)); return g;
    case 'barrel': g.add(mesh(cyl(0.32, 0.32, 0.8), 'pal_wood_dark', 0, 0.4, 0)); return g;
    case 'bridge': g.add(mesh(box(1.5, 0.12, 2.0), 'pal_wood', 0, -0.06, 0)); return g;
    case 'dock': case 'pier': g.add(mesh(box(2.0, 0.14, 2.0), 'pal_wood', 0, -0.07, 0)); return g;
    case 'cricket_stumps': {
      for (let i = 0; i < 3; i++) { const s = empty(`stump_${i}`, (i - 1) * 0.11, 0, 0); s.add(mesh(cyl(0.02, 0.02, 0.72, 8), 'pal_cream', 0, 0.36, 0)); g.add(s); }
      return g;
    }
    case 'ball': g.add(mesh(sph(0.11), 'pal_coral_deep', 0, 0, 0)); return g;
    case 'paper_boat': g.add(mesh(new THREE.ConeGeometry(0.3, 0.3, 4), 'pal_white', 0, 0.15, 0)); return g;
    case 'kite': { const k = mesh(new THREE.OctahedronGeometry(0.5, 0), 'pal_yellow'); k.scale.set(1, 1.3, 0.12); g.add(k); return g; }
    case 'idea_bulb': g.add(mesh(sph(0.22), 'pal_emissive', 0, 0.1, 0), mesh(cyl(0.1, 0.1, 0.16, 12), 'pal_cream', 0, -0.15, 0)); return g;
    case 'cloud': g.add(mesh(sph(1.0), 'pal_white', 0, 0, 0), mesh(sph(0.8), 'pal_white', 1.0, -0.2, 0), mesh(sph(0.75), 'pal_white', -1.0, -0.25, 0.2)); return g;
    case 'grass_spike': g.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 8), 'pal_grass_deep', 0, 0.08, 0)); return g;
    case 'tulips': for (let i = 0; i < 3; i++) g.add(mesh(sph(0.1), 'pal_coral', (i - 1) * 0.15, 0.4, (i % 2) * 0.1)); return g;
    case 'agave': case 'cactus_finger': g.add(mesh(new THREE.ConeGeometry(0.4, 0.8, 7), 'pal_leaf_dark', 0, 0.4, 0)); return g;
    case 'flower_patch': g.add(mesh(cyl(0.9, 0.9, 0.06, 24), 'pal_grass_light', 0, 0.03, 0)); return g;
    case 'garden_tile': g.add(mesh(box(0.42, 0.12, 0.42), 'pal_wood_dark', 0, 0.06, 0)); return g;
    case 'garden_plant_1': case 'garden_plant_2': case 'garden_plant_3': case 'garden_plant_4': {
      const s = +n.slice(-1);
      g.add(mesh(cyl(0.015, 0.02, 0.1 * s, 6), 'pal_grass_deep', 0, 0.05 * s, 0));
      g.add(mesh(sph(0.04 + 0.025 * s), s >= 3 ? 'pal_coral' : 'pal_grass', 0, 0.1 * s + 0.02, 0));
      return g;
    }
    case 'launch_pad': g.add(mesh(cyl(1.2, 1.2, 0.08, 6), 'pal_sky', 0, 0.04, 0)); return g;
    case 'idea_seed': g.add(mesh(sph(0.2), 'pal_emissive', 0, 0.5, 0)); return g;
    case 'scaffold_block': {
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(mesh(cyl(0.04, 0.04, 2, 6), 'pal_cream', x * 0.95, 1, z * 0.95));
      g.add(mesh(box(2, 0.06, 2), 'pal_wood', 0, 1.0, 0));
      return g;
    }
    case 'billboard': case 'portrait_board': case 'noticeboard': case 'price_board': {
      const portrait = n === 'portrait_board';
      const w = portrait ? 2.4 : n === 'billboard' ? 3.2 : 1.6, h = portrait ? 3.0 : n === 'billboard' ? 2.0 : 1.0;
      const y0 = n === 'billboard' || portrait ? 1.0 : 0.8;
      g.add(mesh(box(w + 0.2, h + 0.2, 0.12), 'pal_cream', 0, y0 + h / 2, 0));
      for (const x of [-w / 3, w / 3]) g.add(mesh(cyl(0.06, 0.06, y0, 8), 'pal_cream', x, y0 / 2, -0.02));
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m('pal_white'));
      sc.name = 'screen';
      sc.position.set(0, y0 + h / 2, 0.07);
      g.add(sc);
      return g;
    }
    case 'phone_monolith': case 'phone_stand': {
      const s = n === 'phone_stand' ? 0.25 : 1;
      g.add(mesh(box(1.2 * s, 2.4 * s, 0.18 * s), 'pal_ink', 0, 1.25 * s + (s < 1 ? 0.9 : 0), 0));
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.05 * s, 2.15 * s), m('pal_white'));
      sc.name = 'screen';
      sc.position.set(0, 1.25 * s + (s < 1 ? 0.9 : 0), 0.1 * s);
      g.add(sc);
      return g;
    }
    case 'home_desk': {
      g.add(mesh(box(1.4, 0.06, 0.7), 'pal_wood', 0, 0.72, 0));
      for (const [x, z] of [[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]]) g.add(mesh(cyl(0.03, 0.03, 0.72, 8), 'pal_cream', x, 0.36, z));
      const lid = mesh(box(0.5, 0.34, 0.02), 'pal_ink', 0, 0.94, -0.12);
      lid.rotation.x = -0.2;
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.3), m('pal_white'));
      sc.name = 'screen';
      sc.position.z = 0.012;
      lid.add(sc);
      g.add(lid, mesh(box(0.5, 0.45, 0.45), 'pal_coral', 0, 0.22, 0.6));
      g.add(empty('seat', 0, 0.47, 0.55, Math.PI), empty('use', 0.6, 0, 1.0));
      return g;
    }
  }
  // Buildings and everything else: a rounded block with a roof.
  const big = /school|warehouse|post_office|glass_tower|home_hut|lighthouse|toolshed|storefront|library|stall|chai|bazaar|crane|signal|pigeon|globe|summit|milestone|number|welcome|van/.test(n);
  if (big) {
    const tall = n === 'glass_tower' ? 7 : n === 'lighthouse' ? 7 : n === 'signal_tower' ? 5 : n.includes('flag') ? 2.4 : n.startsWith('number') ? 1.6 : 2.6;
    const w = n.includes('flag') || n === 'signal_tower' ? 0.4 : n.startsWith('stall') || n.includes('chai') || n.includes('bazaar') ? 2.2 : n === 'school_van' ? 1.6 : 3.4;
    g.add(mesh(box(w, tall, n === 'school_van' ? 2.8 : w * 0.8), n === 'school_van' ? 'pal_yellow' : n.startsWith('number') ? 'pal_coral' : 'pal_cream', 0, tall / 2, 0));
    if (!n.includes('flag') && !n.startsWith('number') && n !== 'school_van') g.add(mesh(box(w * 1.1, 0.3, w * 0.9), 'pal_coral_deep', 0, tall + 0.15, 0));
    if (n.startsWith('stall') || n.includes('flag') || n === 'toolshed' || n === 'library_kiosk' || n === 'welcome_arch') {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.8, w * 0.8), 0.4), m('pal_cream'));
      l.name = 'label';
      l.position.set(0, Math.min(tall - 0.3, 2.0), w * 0.4 + 0.02);
      g.add(l);
    }
    g.add(empty('use', 0, 0, w * 0.5 + 0.7));
    return g;
  }
  g.add(mesh(box(0.8, 0.8, 0.8), 'pal_cream', 0, 0.4, 0));
  return g;
}
