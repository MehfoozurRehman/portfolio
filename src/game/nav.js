// Navigation graph over walkable ground (tile centres, bridge and stepping-stone points) with A*.
// Used for click-to-walk and map travel so the character finds bridges instead of walking into the sea.
export class Nav {
  constructor(physics) {
    this.physics = physics;
    this.nodes = [];
    this.edges = [];
  }

  build(extraPoints = []) {
    this.nodes = [];
    this.extraPoints = extraPoints;
    const P = this.physics;
    // A dense grid over every walkable region, plus the centre lines of bridges and stepping stones
    // (narrow paths a grid can miss), plus the points where interactions happen.
    const pts = [];
    const G = 0.7;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const r of P.regions) {
      const e = r.kind === 'rect' ? Math.hypot(r.hw, r.hl) : r.r;
      minX = Math.min(minX, r.x - e); maxX = Math.max(maxX, r.x + e); minZ = Math.min(minZ, r.z - e); maxZ = Math.max(maxZ, r.z + e);
      if (r.kind === 'disc') pts.push([r.x, r.z]);
      if (r.kind === 'rect') {
        const n = Math.max(2, Math.ceil((r.hl * 2) / 0.5));
        for (let i = 0; i <= n; i++) { const lz = -r.hl + (2 * r.hl * i) / n; pts.push([r.x + lz * r.s, r.z + lz * r.c]); }
      }
    }
    for (let x = Math.floor(minX / G) * G; x <= maxX; x += G) for (let z = Math.floor(minZ / G) * G; z <= maxZ; z += G) pts.push([x, z]);
    for (const p of extraPoints) pts.push(p);
    const seen = new Set();
    for (const [x, z] of pts) {
      const k = `${Math.round(x * 4)},${Math.round(z * 4)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const g = P.ground(x, z);
      if (g === null) continue;
      const r = P.resolve(x, z, g, 0.36);
      if (Math.abs(r.x - x) + Math.abs(r.z - z) > 0.02) continue; // inside or touching an obstacle
      this.nodes.push({ x, z, y: g, n: [] });
    }
    // connect nearby nodes with clear segments
    const cell = 2, grid = new Map();
    this.nodes.forEach((n, i) => { const k = `${Math.floor(n.x / cell)},${Math.floor(n.z / cell)}`; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
    this.grid = grid;
    this.cell = cell;
    this.nodes.forEach((a, i) => {
      const cx = Math.floor(a.x / cell), cz = Math.floor(a.z / cell);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        for (const j of grid.get(`${cx + dx},${cz + dz}`) || []) {
          if (j <= i) continue;
          const b = this.nodes[j];
          const d = Math.hypot(a.x - b.x, a.z - b.z);
          if (d > 1.1) continue;
          if (this.clear(a, b)) { a.n.push([j, d]); b.n.push([i, d]); }
        }
      }
    });
  }

  clear(a, b) {
    const d = Math.hypot(a.x - b.x, a.z - b.z);
    const steps = Math.max(2, Math.ceil(d / 0.25));
    let prev = a.y ?? this.physics.ground(a.x, a.z, 0) ?? 0;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      const g = this.physics.ground(x, z);
      if (g === null || Math.abs(g - prev) > 0.46) return false;
      const r = this.physics.resolve(x, z, g, 0.36);
      if (Math.abs(r.x - x) + Math.abs(r.z - z) > 0.04) return false;
      prev = g;
    }
    return true;
  }

  nearest(x, z) {
    let best = -1, bd = Infinity;
    const cx = Math.floor(x / this.cell), cz = Math.floor(z / this.cell);
    for (let rr = 0; rr <= 6 && best < 0; rr++) {
      for (let dx = -rr; dx <= rr; dx++) for (let dz = -rr; dz <= rr; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== rr) continue;
        for (const i of this.grid.get(`${cx + dx},${cz + dz}`) || []) { const n = this.nodes[i]; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = i; } }
      }
    }
    return best;
  }

  /** Returns an array of {x, z} waypoints from (sx,sz) to (gx,gz), or null. */
  path(sx, sz, gx, gz) {
    const s = this.nearest(sx, sz), g = this.nearest(gx, gz);
    if (s < 0 || g < 0) return null;
    const N = this.nodes;
    const came = new Map();
    const gs = new Map([[s, 0]]);
    const h = (i) => Math.hypot(N[i].x - N[g].x, N[i].z - N[g].z);
    // binary min-heap of [f, node]
    const heap = [[h(s), s]];
    const push = (it) => { heap.push(it); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const closed = new Set();
    let guard = 0;
    while (heap.length && guard++ < 60000) {
      const [, cur] = pop();
      if (cur === g) break;
      if (closed.has(cur)) continue;
      closed.add(cur);
      for (const [j, d] of N[cur].n) {
        const ng = gs.get(cur) + d;
        if (ng < (gs.get(j) ?? Infinity)) { gs.set(j, ng); came.set(j, cur); push([ng + h(j), j]); }
      }
    }
    if (!came.has(g) && s !== g) return null;
    const out = [];
    let c = g;
    while (c !== undefined && c !== s) { out.push({ x: N[c].x, z: N[c].z }); c = came.get(c); }
    out.reverse();
    out.push({ x: gx, z: gz });
    // simplify: drop points the player can walk past directly
    const simp = [];
    let from = { x: sx, z: sz, y: this.physics.ground(sx, sz, 0) ?? 0 };
    for (let i = 0; i < out.length; i++) {
      const nextPt = out[i + 1];
      if (nextPt && this.clear(from, { ...nextPt, y: this.physics.ground(nextPt.x, nextPt.z, 0) ?? 0 })) continue;
      simp.push(out[i]);
      from = { ...out[i], y: this.physics.ground(out[i].x, out[i].z, 0) ?? 0 };
    }
    return simp;
  }
}
