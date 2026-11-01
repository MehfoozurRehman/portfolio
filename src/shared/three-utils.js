// Loaders that work inside a claude.ai artifact.
// The artifact frame blocks fetch() of data: and blob: URLs (connect-src), but allows <img> with them.
// So: decode inlined GLB data URLs in memory and parse them, and make GLTFLoader decode embedded
// textures through <img> (TextureLoader) instead of fetch-based ImageBitmapLoader.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function dataUrlToArrayBuffer(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  if (!meta.includes(';base64')) return new TextEncoder().encode(decodeURIComponent(body)).buffer;
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function makeGLTFLoader() {
  const loader = new GLTFLoader();
  loader.register((parser) => {
    parser.textureLoader = new THREE.TextureLoader(parser.options.manager);
    return { name: 'artifact_img_textures' };
  });
  return loader;
}

/** Load a GLB that was imported in src/ (Vite inlines it as a data URL at build time). Resolves to the gltf. */
export async function loadGLB(url) {
  const loader = makeGLTFLoader();
  if (url.startsWith('data:')) {
    return loader.parseAsync(dataUrlToArrayBuffer(url), '');
  }
  // Dev server or a real file URL: fetch is fine outside the artifact.
  const buf = await (await fetch(url)).arrayBuffer();
  return loader.parseAsync(buf, '');
}

/** Load an image texture (webp/png/jpg/svg from shared/images or src/). Uses <img>, which the artifact allows. */
export function loadTexture(url, { srgb = true } = {}) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (t) => {
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        resolve(t);
      },
      undefined,
      reject,
    );
  });
}

/** Decode an inlined binary (for example an .hdr) to an ArrayBuffer, for loaders that offer .parse(). */
export function inlinedBuffer(url) {
  return url.startsWith('data:') ? Promise.resolve(dataUrlToArrayBuffer(url)) : fetch(url).then((r) => r.arrayBuffer());
}
