// Canvas-drawn textures: sign labels and screen images (real screenshots, the portrait, SVG covers).
import * as THREE from 'three';
import { loadTexture } from '@shared/three-utils.js';

const fontStack = '"Fredoka", "Nunito", "Segoe UI", system-ui, sans-serif';

export function labelTexture(text, { w = 512, h = 128, bg = '#F3EDE6', fg = '#2B2A31', size = 64, weight = 600, align = 'center', sub = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  x.fillStyle = fg;
  x.textBaseline = 'middle';
  x.textAlign = align;
  let s = size;
  x.font = `${weight} ${s}px ${fontStack}`;
  while (x.measureText(text).width > w * 0.9 && s > 12) { s -= 2; x.font = `${weight} ${s}px ${fontStack}`; }
  const cx = align === 'center' ? w / 2 : w * 0.06;
  x.fillText(text, cx, sub ? h * 0.38 : h / 2);
  if (sub) {
    x.globalAlpha = 0.7;
    x.font = `500 ${Math.round(s * 0.5)}px ${fontStack}`;
    x.fillText(sub, cx, h * 0.72);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const imgCache = new Map();
/** Texture for an image URL (webp/png/svg); SVGs are rasterised at a good size first. */
export async function imageTexture(url, { cover = null } = {}) {
  if (imgCache.has(url)) return imgCache.get(url);
  const p = (async () => {
    if (url.endsWith('.svg') || url.startsWith('data:image/svg')) {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = 1280;
      c.height = Math.round(1280 * (img.naturalHeight / img.naturalWidth || 0.625));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    }
    return loadTexture(url);
  })();
  imgCache.set(url, p);
  return p;
}

/**
 * Map an image upright onto an arbitrary quad mesh (from Blender or code), whatever its UV orientation.
 * Reads the first triangle's positions and UVs to find which way u and v run on the visible face,
 * then sets flipY/repeat/offset so the image reads left-to-right and top-to-bottom. Optionally crops
 * to cover the quad's aspect ratio (keeping the top of screenshots).
 */
export function orientToQuad(tex, geometry, { cover = true, alignTop = true } = {}) {
  const pos = geometry.attributes.position, uv = geometry.attributes.uv;
  if (!pos || !uv) return tex;
  const idx = geometry.index;
  const ia = idx ? idx.getX(0) : 0, ib = idx ? idx.getX(1) : 1, ic = idx ? idx.getX(2) : 2;
  const P = (i) => new THREE.Vector3().fromBufferAttribute(pos, i);
  const U = (i) => new THREE.Vector2().fromBufferAttribute(uv, i);
  const p0 = P(ia), p1 = P(ib), p2 = P(ic), t0 = U(ia), t1 = U(ib), t2 = U(ic);
  const e1 = p1.clone().sub(p0), e2 = p2.clone().sub(p0);
  const d1 = t1.clone().sub(t0), d2 = t2.clone().sub(t0);
  const r = d1.x * d2.y - d2.x * d1.y || 1e-6;
  const T = e1.clone().multiplyScalar(d2.y).sub(e2.clone().multiplyScalar(d1.y)).divideScalar(r); // direction of +u
  const B = e2.clone().multiplyScalar(d1.x).sub(e1.clone().multiplyScalar(d2.x)).divideScalar(r); // direction of +v
  let N = new THREE.Vector3();
  if (geometry.attributes.normal) N.fromBufferAttribute(geometry.attributes.normal, ia);
  else N.crossVectors(e1, e2);
  N.normalize();
  const up = Math.abs(N.y) > 0.9 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, N).normalize();
  const upP = new THREE.Vector3().crossVectors(N, right).normalize();
  // With flipY = false, image row 0 sits at v = 0. We want +u to run right and +v to run down.
  tex.flipY = false;
  const mirrorX = T.dot(right) < 0;
  const mirrorY = B.dot(upP) > 0;
  // quad aspect from the vertex extents along right/up
  let minR = Infinity, maxR = -Infinity, minU = Infinity, maxU = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const p = P(i);
    const a = p.dot(right), b = p.dot(upP);
    minR = Math.min(minR, a); maxR = Math.max(maxR, a); minU = Math.min(minU, b); maxU = Math.max(maxU, b);
  }
  const quadAspect = (maxR - minR) / Math.max(1e-4, maxU - minU);
  let rx = 1, ry = 1, ox = 0, oy = 0;
  if (cover && tex.image) {
    const img = tex.image;
    const ia2 = (img.width || img.naturalWidth) / (img.height || img.naturalHeight);
    if (ia2 > quadAspect) { rx = quadAspect / ia2; ox = (1 - rx) / 2; }
    else { ry = ia2 / quadAspect; oy = alignTop ? 0 : (1 - ry) / 2; }
  }
  if (mirrorX) { ox = ox + rx; rx = -rx; }
  if (mirrorY) { oy = oy + ry; ry = -ry; }
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(rx, ry);
  tex.offset.set(ox, oy);
  tex.needsUpdate = true;
  return tex;
}

/** Fit a texture into a plane of aspect `planeAspect` (cover), by adjusting repeat/offset. */
export function coverFit(tex, planeAspect, alignTop = true) {
  const img = tex.image;
  const ia = (img.width || img.naturalWidth) / (img.height || img.naturalHeight);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  if (ia > planeAspect) {
    const r = planeAspect / ia;
    tex.repeat.set(r, 1);
    tex.offset.set((1 - r) / 2, 0);
  } else {
    const r = ia / planeAspect;
    tex.repeat.set(1, r);
    tex.offset.set(0, alignTop ? 1 - r : (1 - r) / 2);
  }
  tex.needsUpdate = true;
  return tex;
}
