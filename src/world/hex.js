// Pointy-top hex grid in axial coordinates (q, r). One tile = circumradius HEX_R metres.
export const HEX_R = 2.0;
export const SQRT3 = Math.sqrt(3);
export const HEX_W = SQRT3 * HEX_R; // flat-to-flat width, 3.464 m

export function axialToWorld(q, r) {
  return { x: HEX_R * SQRT3 * (q + r / 2), z: HEX_R * 1.5 * r };
}

export function worldToAxial(x, z) {
  const q = ((SQRT3 / 3) * x - (1 / 3) * z) / HEX_R;
  const r = ((2 / 3) * z) / HEX_R;
  return axialRound(q, r);
}

export function axialRound(q, r) {
  let x = q, zc = r, y = -x - zc;
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(zc);
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - zc);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

export const key = (q, r) => `${q},${r}`;

export const DIRS = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

/** All axial coords within `radius` of (0,0). */
export function disc(radius) {
  const out = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) out.push([q, r]);
  }
  return out;
}

/** Corners of a pointy-top hex at (cx, cz), circumradius rr, in the XZ plane. */
export function hexCorners(cx, cz, rr = HEX_R) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push([cx + rr * Math.cos(a), cz + rr * Math.sin(a)]);
  }
  return pts;
}

/** Point-in-pointy-top-hex test with an inset margin (metres). */
export function insideHex(px, pz, cx, cz, rr = HEX_R, inset = 0) {
  const dx = Math.abs(px - cx), dz = Math.abs(pz - cz);
  const R = rr - inset / Math.cos(Math.PI / 6);
  if (R <= 0) return false;
  const w = (SQRT3 / 2) * R; // apothem
  if (dx > w) return false;
  return dz <= R - dx / SQRT3;
}
