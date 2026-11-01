// Calm pastel water with soft foam rings around the islands.
// A top-down mask of every walkable footprint is drawn to a canvas and blurred; the shader uses it
// as a distance-to-shore proxy for shallow tint and foam.
import * as THREE from 'three';
import { hexCorners } from './hex.js';
import { globalUniforms } from './materials.js';

export const WATER_Y = -0.55;

export function createWater({ bounds, shapes }) {
  const size = 1024;
  const { minX, minZ, maxX, maxZ } = bounds;
  const w = maxX - minX, h = maxZ - minZ;
  const sx = size / w, sz = size / h;
  const base = document.createElement('canvas');
  base.width = base.height = size;
  const ctx = base.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  const px = (x) => (x - minX) * sx, pz = (z) => (z - minZ) * sz;
  for (const s of shapes) {
    ctx.beginPath();
    if (s.kind === 'hex') {
      hexCorners(s.x, s.z, s.r).forEach(([x, z], i) => (i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z))));
    } else if (s.kind === 'disc') {
      ctx.arc(px(s.x), pz(s.z), s.r * sx, 0, Math.PI * 2);
    } else if (s.kind === 'rect') {
      const corners = [[-s.hw, -s.hl], [s.hw, -s.hl], [s.hw, s.hl], [-s.hw, s.hl]].map(([lx, lz]) => [s.x + lx * s.c + lz * s.s, s.z - lx * s.s + lz * s.c]);
      corners.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z))));
    }
    ctx.closePath();
    ctx.fill();
  }
  // Two blur radii: a tight one for foam, a wide one for the shallow tint.
  const blur = (r) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    x.filter = `blur(${r}px)`;
    x.drawImage(base, 0, 0);
    return c;
  };
  const tight = blur(Math.round(0.7 * sx)), wide = blur(Math.round(4 * sx));
  const comb = document.createElement('canvas');
  comb.width = comb.height = size;
  const cc = comb.getContext('2d');
  const a = tight.getContext('2d').getImageData(0, 0, size, size), b = wide.getContext('2d').getImageData(0, 0, size, size), o = cc.createImageData(size, size);
  for (let i = 0; i < a.data.length; i += 4) { o.data[i] = a.data[i]; o.data[i + 1] = b.data[i]; o.data[i + 2] = base.getContext('2d') ? 0 : 0; o.data[i + 3] = 255; }
  cc.putImageData(o, 0, 0);
  const mask = new THREE.CanvasTexture(comb);
  mask.colorSpace = THREE.NoColorSpace;
  mask.wrapS = mask.wrapT = THREE.ClampToEdgeWrapping;

  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uMask: { value: mask },
        uBounds: { value: new THREE.Vector4(minX, minZ, w, h) },
        uDeep: { value: new THREE.Color('#6FB3C2') },
        uShallow: { value: new THREE.Color('#9AD7D9') },
        uFoam: { value: new THREE.Color('#F7FBF9') },
        uSkyTop: { value: new THREE.Color('#B9E0EC') },
        uHorizon: { value: new THREE.Color('#F8DCD3') },
        uSunDir: { value: new THREE.Vector3(-28, 46, 22).normalize() },
        uSunCol: { value: new THREE.Color('#FFF4E0') },
      },
    ]),
    vertexShader: `
      #include <fog_pars_vertex>
      varying vec3 vW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      #include <fog_pars_fragment>
      uniform sampler2D uMask; uniform vec4 uBounds; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFoam; uniform float uTime;
      uniform vec3 uSkyTop; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunCol;
      varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      // Height field of small travelling waves; its slope gives a normal for reflections and glints.
      float waves(vec2 p) {
        return noise(p * 0.55 + vec2(uTime * 0.18, uTime * 0.11)) * 0.55
             + noise(p * 1.3 - vec2(uTime * 0.25, -uTime * 0.12)) * 0.3
             + noise(p * 3.1 + vec2(-uTime * 0.4, uTime * 0.33)) * 0.15;
      }
      void main() {
        vec2 uv = (vW.xz - uBounds.xy) / uBounds.zw;
        vec2 m = (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? vec2(0.0) : texture2D(uMask, uv).rg;
        float shore = m.r, near = m.g;
        vec3 col = mix(uDeep, uShallow, smoothstep(0.02, 0.55, near));
        // sandy floor glow in the very shallow water right by the islands
        col = mix(col, uShallow * 1.08 + vec3(0.03, 0.03, 0.0), smoothstep(0.35, 0.8, near) * 0.5);
        float e = 0.15;
        float h0 = waves(vW.xz), hx = waves(vW.xz + vec2(e, 0.0)), hz = waves(vW.xz + vec2(0.0, e));
        vec3 N = normalize(vec3(-(hx - h0) / e * 0.35, 1.0, -(hz - h0) / e * 0.35));
        vec3 V = normalize(cameraPosition - vW);
        // Fresnel: grazing angles reflect the sky more
        float fres = pow(1.0 - max(dot(N, V), 0.0), 4.0);
        vec3 R = reflect(-V, N);
        vec3 skyCol = mix(uHorizon, uSkyTop, smoothstep(0.0, 0.6, R.y));
        col = mix(col, skyCol, clamp(fres * 0.65 + 0.04, 0.0, 0.6));
        // soft sun glints
        float spec = pow(max(dot(R, normalize(uSunDir)), 0.0), 180.0);
        col += uSunCol * spec * 0.9;
        // caustic shimmer in the shallows
        float caust = smoothstep(0.55, 0.9, noise(vW.xz * 2.2 + h0 * 3.0 + uTime * 0.3));
        col += vec3(0.06, 0.07, 0.06) * caust * smoothstep(0.2, 0.7, near);
        float n = h0;
        // foam: a soft ring hugging the shore, breathing in and out
        float breathe = 0.5 + 0.5 * sin(uTime * 1.2 + n * 6.0);
        float band = smoothstep(0.10 + 0.04 * breathe, 0.32, shore) * (1.0 - smoothstep(0.42, 0.62, shore));
        float foamN = smoothstep(0.35, 0.65, noise(vW.xz * 2.2 + uTime * 0.25));
        col = mix(col, uFoam, band * (0.55 + 0.45 * foamN));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  mat.uniforms.uTime = globalUniforms.uTime;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(900, 900, 1, 1), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = WATER_Y;
  plane.receiveShadow = false;
  return plane;
}
