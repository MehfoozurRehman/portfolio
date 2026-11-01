// Renderer, scene, lights and sky for the pastel clay look.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const SKY = {
  top: new THREE.Color('#B9E0EC'),
  horizon: new THREE.Color('#F8DCD3'),
  fog: new THREE.Color('#F4D9D1'),
};

export function createRenderer(canvas, { lowPower = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.98;
  // Phones skip dynamic shadows (the assets carry baked AO and the player keeps a soft blob shadow).
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = lowPower ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = SKY.horizon.clone();
  scene.fog = new THREE.Fog(SKY.fog, 110, 300);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  // Soft sky and bounce from the water.
  const hemi = new THREE.HemisphereLight('#FFF3EC', '#8FCBD4', 1.05);
  scene.add(hemi);

  // Warm key light from the upper left, casting soft shadows around the player.
  const sun = new THREE.DirectionalLight('#FFF0E2', 3.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  const s = 26;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 120 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = lowPower ? 1 : 7;
  sun.shadow.blurSamples = 16;
  scene.add(sun, sun.target);
  const sunOffset = new THREE.Vector3(-28, 46, 22);

  // Gradient sky dome.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: SKY.top }, horizon: { value: SKY.horizon } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float t = smoothstep(-0.05, 0.55, vP.y); gl_FragColor = vec4(mix(horizon, top, t), 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyMat);
  sky.renderOrder = -1;
  scene.add(sky);

  function followShadow(target) {
    // Snap the shadow camera to texel-sized steps to avoid shimmering while the player moves.
    const step = (2 * s) / sun.shadow.mapSize.x;
    const tx = Math.round(target.x / step) * step;
    const tz = Math.round(target.z / step) * step;
    sun.position.set(tx + sunOffset.x, sunOffset.y, tz + sunOffset.z);
    sun.target.position.set(tx, 0, tz);
    sky.position.set(target.x, 0, target.z);
  }

  return { renderer, scene, sun, hemi, sky, followShadow, sunOffset };
}
