// Collision footprints from what an object actually has at ground level (walls, legs, counters), not its
// full bounding box: roofs, awnings, porches, signs and lamp heads overhang without blocking the player.
import * as THREE from 'three';

const BASE_H = 0.55; // only geometry below this height (above the object's base) forms the footprint
const v = new THREE.Vector3();

/** Returns {minX,maxX,minZ,maxZ,top} in the object's local frame (unrotated), or null. */
function groundFootprint(obj) {
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, top = 0, n = 0;
  obj.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh || !o.visible) return;
    const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 4000));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m);
      top = Math.max(top, v.y);
      if (v.y > BASE_H) continue;
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
      minZ = Math.min(minZ, v.z); maxZ = Math.max(maxZ, v.z);
      n++;
    }
  });
  if (!n || !isFinite(minX)) return null;
  return { minX, maxX, minZ, maxZ, top };
}

/** World-space ground footprint as an oriented rectangle {x, z, hw, hd, yaw}, or null. For overlap checks. */
export function footprintRect(obj) {
  obj.updateMatrixWorld(true);
  const fp = groundFootprint(obj);
  if (!fp) return null;
  const yaw = obj.rotation.y, s = obj.scale.x;
  const cx = ((fp.minX + fp.maxX) / 2) * s, cz = ((fp.minZ + fp.maxZ) / 2) * s;
  return {
    x: obj.position.x + cx * Math.cos(yaw) + cz * Math.sin(yaw),
    z: obj.position.z - cx * Math.sin(yaw) + cz * Math.cos(yaw),
    hw: ((fp.maxX - fp.minX) / 2) * s, hd: ((fp.maxZ - fp.minZ) / 2) * s, yaw,
  };
}

/** Separating-axis overlap test between two oriented rectangles, with a margin (positive = must be apart). */
export function rectsOverlap(a, b, margin = 0) {
  const axes = [a.yaw, a.yaw + Math.PI / 2, b.yaw, b.yaw + Math.PI / 2].map((t) => [Math.cos(t), -Math.sin(t)]);
  const corners = (r) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => {
    const lx = sx * r.hw, lz = sz * r.hd;
    return [r.x + lx * Math.cos(r.yaw) + lz * Math.sin(r.yaw), r.z - lx * Math.sin(r.yaw) + lz * Math.cos(r.yaw)];
  });
  const ca = corners(a), cb = corners(b);
  for (const [ax, az] of axes) {
    const pa = ca.map(([x, z]) => x * ax + z * az), pb = cb.map(([x, z]) => x * ax + z * az);
    if (Math.max(...pa) + margin < Math.min(...pb) || Math.max(...pb) + margin < Math.min(...pa)) return false;
  }
  return true;
}

/**
 * Add a collider for a placed object. Small things get a circle; larger ones an oriented box shrunk a
 * little so the character can brush past edges. Returns the collider (or null).
 */
export function addFootprint(physics, obj, { inset = 0.12, minSize = 0.18, circle = false } = {}) {
  obj.updateMatrixWorld(true);
  const fp = groundFootprint(obj);
  if (!fp) return null;
  const w = fp.maxX - fp.minX, d = fp.maxZ - fp.minZ;
  if (Math.max(w, d) < minSize) return null; // pebbles, tiny props: walk over them
  const yaw = obj.rotation.y;
  const s = obj.scale.x;
  const cx = ((fp.minX + fp.maxX) / 2) * s, cz = ((fp.minZ + fp.maxZ) / 2) * s;
  const wx = obj.position.x + cx * Math.cos(yaw) + cz * Math.sin(yaw);
  const wz = obj.position.z - cx * Math.sin(yaw) + cz * Math.cos(yaw);
  const top = obj.position.y + fp.top * s;
  const id = obj.name;
  if (circle || Math.max(w, d) < 0.7) return physics.addCircle(wx, wz, Math.max(0.12, (Math.min(w, d) / 2) * s * 0.85), { top, id });
  return physics.addBox(wx, wz, Math.max(0.1, (w / 2) * s - inset), Math.max(0.1, (d / 2) * s - inset), yaw, { top, id });
}
