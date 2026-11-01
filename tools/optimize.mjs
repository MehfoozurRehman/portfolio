// Shrink GLB packs without needing a decoder in the browser: dedupe, prune, and quantize vertex data
// (KHR_mesh_quantization, decoded natively by three's GLTFLoader). Writes <name>.opt.glb next to the source.
// Usage: node tools/optimize.mjs world/src/models/buildings.glb [...]
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, quantize } from '@gltf-transform/functions';
import fs from 'node:fs';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const file of process.argv.slice(2)) {
  const before = fs.statSync(file).size;
  const doc = await io.read(file);
  await doc.transform(
    dedup(),
    prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }),
    quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeColor: 8, quantizeWeight: 8, quantizeGeneric: 12 }),
  );
  const out = file.replace(/\.glb$/, '.opt.glb');
  await io.write(out, doc);
  console.log(`${file}: ${(before / 1e6).toFixed(2)} MB -> ${(fs.statSync(out).size / 1e6).toFixed(2)} MB`);
}
