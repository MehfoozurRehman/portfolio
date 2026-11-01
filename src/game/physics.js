// A small 2D collision world on the XZ plane, with ground heights.
// Walkable regions: hex tiles, oriented rectangles (bridges, piers), discs (stepping stones).
// Obstacles: circles and oriented boxes. The player is a circle of radius PR.
import { insideHex, HEX_R } from '../world/hex.js';

export const PR = 0.32; // player radius
export const SHALLOW = 2.4; // metres of wadeable water around every shore
export const WADE_Y = -0.95; // sea floor in the shallows (water surface is at -0.55: about knee deep)
const CELL = 4;

export class Physics {
  constructor() {
    this.regions = [];
    this.obstacles = [];
    this.grid = new Map();
    this.ogrid = new Map();
  }

  _cells(minX, minZ, maxX, maxZ) {
    const out = [];
    for (let i = Math.floor(minX / CELL); i <= Math.floor(maxX / CELL); i++) for (let j = Math.floor(minZ / CELL); j <= Math.floor(maxZ / CELL); j++) out.push(`${i},${j}`);
    return out;
  }
  _put(map, keys, v) { for (const k of keys) { if (!map.has(k)) map.set(k, []); map.get(k).push(v); } }

  addHex(x, z, y, r = HEX_R, tag = 'tile') {
    const reg = { kind: 'hex', x, z, y, r, tag };
    this.regions.push(reg);
    this._put(this.grid, this._cells(x - r, z - r, x + r, z + r), reg);
    return reg;
  }
  addRect(x, z, y, halfW, halfL, yaw, tag = 'bridge', y2 = null) {
    // y2: optional height at the +L end for ramps
    const reg = { kind: 'rect', x, z, y, y2: y2 ?? y, hw: halfW, hl: halfL, c: Math.cos(yaw), s: Math.sin(yaw), tag };
    this.regions.push(reg);
    const e = Math.hypot(halfW, halfL);
    this._put(this.grid, this._cells(x - e, z - e, x + e, z + e), reg);
    return reg;
  }
  addDisc(x, z, y, r, tag = 'step') {
    const reg = { kind: 'disc', x, z, y, r, tag };
    this.regions.push(reg);
    this._put(this.grid, this._cells(x - r, z - r, x + r, z + r), reg);
    return reg;
  }
  addCircle(x, z, r, opts = {}) {
    const ob = { kind: 'circle', x, z, r, top: opts.top ?? 99, id: opts.id, enabled: true };
    this.obstacles.push(ob);
    this._put(this.ogrid, this._cells(x - r, z - r, x + r, z + r), ob);
    return ob;
  }
  addBox(x, z, halfW, halfD, yaw, opts = {}) {
    const ob = { kind: 'box', x, z, hw: halfW, hd: halfD, c: Math.cos(yaw), s: Math.sin(yaw), top: opts.top ?? 99, id: opts.id, enabled: true };
    this.obstacles.push(ob);
    const e = Math.hypot(halfW, halfD);
    this._put(this.ogrid, this._cells(x - e, z - e, x + e, z + e), ob);
    return ob;
  }

  /** Height of the highest region that contains (x, z) exactly (no margin), or null. Sets this._tag. */
  heightAt(x, z, inset = 0) {
    const list = this.grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`);
    if (!list) return null;
    let best = null, tag = null;
    for (const g of list) {
      let y = null;
      if (g.kind === 'hex') { if (insideHex(x, z, g.x, g.z, g.r, inset)) y = g.y; }
      else if (g.kind === 'disc') { if (Math.hypot(x - g.x, z - g.z) <= g.r - inset) y = g.y; }
      else {
        const dx = x - g.x, dz = z - g.z;
        const lx = dx * g.c - dz * g.s, lz = dx * g.s + dz * g.c;
        if (Math.abs(lx) <= g.hw - inset && Math.abs(lz) <= g.hl - Math.max(0, inset)) y = g.y + (g.y2 - g.y) * ((lz + g.hl) / (2 * g.hl));
      }
      if (y !== null && (best === null || y > best)) { best = y; tag = g.tag; }
    }
    this._tag = tag;
    return best;
  }

  /**
   * Ground height under a circle of radius `inset` centred at (x, z), or null if any part of that circle hangs
   * over water. Tested against the UNION of all walkable shapes, so the seams between neighbouring tiles,
   * bridges and stepping stones are seamless (an inset per shape would leave invisible gaps along shared edges).
   * Negative inset expands the test (used to find open water).
   */
  ground(x, z, inset = PR * 0.7) {
    const h = this.heightAt(x, z, inset < 0 ? inset : 0);
    if (h === null) return null;
    const tag = this._tag;
    if (inset > 0) {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        if (this.heightAt(x + Math.cos(a) * inset, z + Math.sin(a) * inset) === null) return null;
      }
    }
    this.lastTag = tag;
    return h;
  }

  /** Push a circle at (x,z) out of obstacles whose top is above feetY. Returns corrected {x,z}. */
  resolve(x, z, feetY, r = PR) {
    for (let iter = 0; iter < 3; iter++) {
      const list = this.ogrid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`);
      if (!list) break;
      let moved = false;
      for (const o of list) {
        if (!o.enabled || feetY >= o.top - 0.05) continue;
        if (o.kind === 'circle') {
          const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), min = o.r + r;
          if (d < min && d > 1e-5) { x = o.x + (dx / d) * min; z = o.z + (dz / d) * min; moved = true; }
        } else {
          const dx = x - o.x, dz = z - o.z;
          let lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
          const cx = Math.max(-o.hw, Math.min(o.hw, lx)), cz = Math.max(-o.hd, Math.min(o.hd, lz));
          let ex = lx - cx, ez = lz - cz, d = Math.hypot(ex, ez);
          if (d < r) {
            if (d < 1e-5) { // centre inside the box: push out along the smallest axis
              const px = o.hw - Math.abs(lx), pz = o.hd - Math.abs(lz);
              if (px < pz) { lx = Math.sign(lx || 1) * (o.hw + r); } else { lz = Math.sign(lz || 1) * (o.hd + r); }
            } else { lx = cx + (ex / d) * r; lz = cz + (ez / d) * r; }
            x = o.x + lx * o.c + lz * o.s;
            z = o.z - lx * o.s + lz * o.c;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    return { x, z };
  }

  /**
   * Move from (x,z) at height y by (dx,dz). Respects walkable ground (no walking off edges or up walls taller
   * than stepUp unless airborne above them) and obstacles. Returns {x, z, ground}.
   */
  /** Wading depth: within SHALLOW metres of any shore the sea floor is walkable, knee-deep below the surface. */
  waterGround(x, z) {
    if (this.heightAt(x, z, -SHALLOW) === null) return null;
    this.lastTag = 'water';
    return WADE_Y;
  }

  move(x, z, y, dx, dz, { stepUp = 0.46, airborne = false, water = false } = {}) {
    // Climbing out of the water onto a tile edge is allowed (a little hop), like stepping onto a dock.
    const up = y < WADE_Y + 0.1 ? 1.1 : stepUp;
    const ok = (nx, nz) => {
      let g = this.ground(nx, nz);
      if (g === null && water) g = this.waterGround(nx, nz);
      if (g === null) return null;
      if (g - y > up && !(airborne && y >= g - 0.05)) return null;
      return g;
    };
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) return { x, z, ground: this.ground(x, z) ?? (water ? this.waterGround(x, z) : null) ?? y, blocked: false };
    // Sub-step long moves so fast running never tunnels through thin obstacles or corners.
    const steps = Math.max(1, Math.ceil(len / 0.12));
    let cx = x, cz = z, cg = this.ground(x, z) ?? (water ? this.waterGround(x, z) : null) ?? y, blockedAny = false;
    const sdx = dx / steps, sdz = dz / steps, sl = len / steps;
    for (let s = 0; s < steps; s++) {
      let nx = cx + sdx, nz = cz + sdz;
      let g = ok(nx, nz);
      if (g === null) {
        // Slide: rotate the step toward the obstacle's tangent and keep the component along the wish direction.
        blockedAny = true;
        let found = false;
        const base = Math.atan2(sdx, sdz);
        for (const deg of [20, -20, 40, -40, 60, -60, 80, -80]) {
          const a = base + (deg * Math.PI) / 180;
          const k = Math.cos((deg * Math.PI) / 180);
          const tx = cx + Math.sin(a) * sl * k, tz = cz + Math.cos(a) * sl * k;
          const tg = ok(tx, tz);
          if (tg !== null) { nx = tx; nz = tz; g = tg; found = true; break; }
        }
        if (!found) break;
      }
      const r = this.resolve(nx, nz, Math.max(y, g ?? y));
      const g2 = ok(r.x, r.z);
      if (g2 === null) { blockedAny = true; break; }
      if (Math.abs(r.x - nx) + Math.abs(r.z - nz) > 1e-4) blockedAny = true;
      cx = r.x; cz = r.z; cg = g2;
    }
    const moved = Math.hypot(cx - x, cz - z);
    return { x: cx, z: cz, ground: cg, blocked: blockedAny && moved < len * 0.35 };
  }
}
