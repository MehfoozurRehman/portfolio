// Shared clay materials, keyed by the palette names used in the Blender packs (see ASSETS.md).
// Every material can switch into "blueprint" mode for the launch sequence: above a world-space height
// it renders as a glowing blueprint grid, below it as finished clay, with a bright seam between.
import * as THREE from 'three';

export const PALETTE = {
  pal_grass: '#74C391', pal_grass_light: '#9ED6A8', pal_grass_deep: '#2E9B78', pal_leaf_dark: '#1F7A60',
  pal_coral: '#F28C6F', pal_coral_deep: '#DC6B52', pal_peach: '#F7B79F', pal_cream: '#F3EDE6',
  pal_stone: '#E3D8CF', pal_sand: '#F1DCC2', pal_wood: '#C98C62', pal_wood_dark: '#8E5B3D',
  pal_pink: '#ECBDB7', pal_sky: '#A9D6E5', pal_water: '#79BFC9', pal_yellow: '#F6CF6B',
  pal_navy: '#2C3567', pal_ink: '#2B2A31', pal_white: '#FFFFFF', pal_tan: '#C9955E',
  pal_fur: '#EDE3D3', pal_skin: '#E9B48F', pal_glass: '#BFE3EE', pal_emissive: '#FFE6A3',
  // townsfolk clothing (shalwar kameez, kurti, dupatta)
  pal_kameez_a: '#D9A3A0', pal_kameez_b: '#A9C2A2', pal_kameez_c: '#A7C7DD', pal_kameez_d: '#DDB85E',
};

const ROUGH = { pal_glass: 0.18, pal_emissive: 0.5, pal_white: 0.75 };

// One build-state object per "district" (null = always finished). Materials read its uniforms.
export function makeBuildState() {
  return {
    uBuildOn: { value: 0 }, // 1 while a district is unbuilt or building
    uBuildY: { value: -10 }, // world-space height of the clay/blueprint seam
    uReveal: { value: 0 }, // 0 = invisible, 1 = blueprint visible (fades the blueprint in)
  };
}

export const globalUniforms = { uTime: { value: 0 } };

const cache = new Map();

function patchBlueprint(mat, build) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uBuildOn = build.uBuildOn;
    shader.uniforms.uBuildY = build.uBuildY;
    shader.uniforms.uReveal = build.uReveal;
    shader.uniforms.uTime = globalUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBpWorld;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 bpW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          bpW = instanceMatrix * bpW;
        #endif
        #ifdef USE_SKINNING
          bpW = vec4(transformed, 1.0);
        #endif
        vBpWorld = (modelMatrix * bpW).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vBpWorld;
        uniform float uBuildOn; uniform float uBuildY; uniform float uReveal; uniform float uTime;
        float bpGrid(vec3 p, float s) {
          vec3 g = abs(fract(p * s - 0.5) - 0.5) / fwidth(p * s);
          float l = min(min(g.x, g.y), g.z);
          return 1.0 - min(l, 1.0);
        }`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
        if (uBuildOn > 0.5) {
          float above = step(uBuildY, vBpWorld.y);
          if (above > 0.5) {
            // Blueprint: fine light-blue grid lines; thinner and sparser while it is only an idea (low reveal).
            // While waiting to be launched, the plot shows only a faint, sparse outline (dotted, pale) so it reads
            // as a promise, not a cage. During the launch it fills in with a denser, brighter blueprint grid.
            float major = bpGrid(vBpWorld, 1.0);
            float minor = bpGrid(vBpWorld, 4.0) * 0.6;
            float building = smoothstep(0.4, 1.0, uReveal);
            float line = max(major, minor * building);
            float thresh = mix(0.93, 0.5, building);
            float dots = step(0.5, fract((vBpWorld.x + vBpWorld.y + vBpWorld.z) * 3.0)); // dashed while idle
            if (building < 0.05 && dots < 0.5) discard;
            float scan = 0.5 + 0.5 * sin(vBpWorld.y * 5.0 - uTime * 2.5);
            if (line < thresh || uReveal < 0.01) discard;
            vec3 bp = mix(vec3(0.62, 0.80, 0.96), vec3(0.92, 0.97, 1.0), scan * 0.45 + 0.25);
            gl_FragColor = vec4(bp, 1.0);
          } else {
            float seam = 1.0 - smoothstep(0.0, 0.18, uBuildY - vBpWorld.y);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.96, 0.82), seam * 0.85);
          }
        }`);
  };
  mat.customProgramCacheKey = () => 'bp';
}

/**
 * Get the clay material for a palette name.
 * @param {string} name palette material name (pal_*); unknown names fall back to pal_cream
 * @param {object} opts { vertexColors, build (a build state), skinned }
 */
export function clay(name, { vertexColors = false, build = null, skinned = false } = {}) {
  const pal = PALETTE[name] ? name : 'pal_cream';
  const id = `${pal}|${vertexColors ? 1 : 0}|${skinned ? 1 : 0}|${build ? build.id : 'x'}`;
  if (cache.has(id)) return cache.get(id);
  const color = new THREE.Color(PALETTE[pal]);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: ROUGH[pal] ?? 0.92,
    metalness: 0,
    vertexColors,
    envMapIntensity: pal === 'pal_glass' ? 1.0 : 0.35,
  });
  mat.name = pal;
  if (pal === 'pal_emissive') {
    mat.emissive = new THREE.Color('#FFD98A');
    mat.emissiveIntensity = 0.9;
  }
  if (build) patchBlueprint(mat, build);
  cache.set(id, mat);
  return mat;
}

let buildId = 0;
export function newBuild() {
  const b = makeBuildState();
  b.id = `b${buildId++}`;
  return b;
}
