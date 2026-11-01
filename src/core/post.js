// Post effects for the miniature look: ambient occlusion, tilt-shift, gentle bloom, anti-aliasing.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const TiltShift = {
  uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uFocus: { value: 0.52 }, uBand: { value: 0.22 }, uAmount: { value: 2.4 }, uDir: { value: new THREE.Vector2(1, 0) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uFocus; uniform float uBand; uniform float uAmount; uniform vec2 uDir;
    varying vec2 vUv;
    void main() {
      float d = max(0.0, abs(vUv.y - uFocus) - uBand);
      float r = clamp(d * 3.2, 0.0, 1.0) * uAmount;
      vec4 c = vec4(0.0); float wsum = 0.0;
      for (int i = -4; i <= 4; i++) {
        float w = exp(-float(i * i) / 8.0);
        c += texture2D(tDiffuse, vUv + uDir * float(i) * r / uRes) * w;
        wsum += w;
      }
      gl_FragColor = c / wsum;
    }`,
};

export function createPost(renderer, scene, camera, { lowPower = false } = {}) {
  if (lowPower) {
    return { render: () => renderer.render(scene, camera), setSize: () => {}, enabled: false };
  }
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, size.x, size.y);
  ao.output = GTAOPass.OUTPUT.Default;
  ao.blendIntensity = 0.85;
  ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.6, thickness: 1.2, scale: 1.0, samples: 12 });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, rings: 2, samples: 12 });
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.22, 0.5, 0.93);
  composer.addPass(bloom);
  const tsH = new ShaderPass(TiltShift);
  const tsV = new ShaderPass(TiltShift);
  tsV.uniforms.uDir.value.set(0, 1);
  composer.addPass(tsH);
  composer.addPass(tsV);
  composer.addPass(new OutputPass());

  function setSize(w, h) {
    composer.setSize(w, h);
    const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    tsH.uniforms.uRes.value.copy(s);
    tsV.uniforms.uRes.value.copy(s);
  }
  // Quality: 3 = AO + bloom + tilt-shift, 2 = bloom + tilt-shift, 1 = tilt-shift only, 0 = plain render.
  let quality = 0;
  ao.enabled = false;
  const api = {
    enabled: true,
    composer, ao, bloom,
    get quality() { return quality; },
    setQuality(q) {
      quality = Math.max(0, Math.min(3, q));
      ao.enabled = quality >= 3;
      bloom.enabled = quality >= 2;
      tsH.enabled = tsV.enabled = quality >= 1;
    },
    setTilt(amount) { tsH.uniforms.uAmount.value = amount; tsV.uniforms.uAmount.value = amount; },
    render: () => (quality === 0 ? renderer.render(scene, camera) : composer.render()),
    setSize,
  };
  return api;
}
