/* DERIVE THE TREE — the render spike's pruned Poly Haven island_tree_01 as a GLB the game can load.
   SPIKE_ADOPT row 3, 2026-10-03.

   The spike's `public/assets/models/tree.glb` is island_tree_01 (Poly Haven, CC0) with its leaf mesh
   pruned BY ISLAND (16% of the leaves kept, survivors scaled 2.5x about their own centres — 1.6 M
   triangles to 194 k, 60 MB to 3.2 MB; spike tools/build.mjs), written with EXT_meshopt_compression and
   KHR_mesh_quantization required. The game's GLTFLoader has no meshopt decoder registered, so this
   decodes the geometry and dequantizes it to float. The WebP textures, their KHR_texture_transform and
   the IOR/specular extensions are KEPT: three reads all four natively, and re-encoding the textures
   would be a loss for nothing.
   It ASSERTS: the only required extensions left are ones GLTFLoader implements; every primitive has
   float POSITION/NORMAL; the bounds match the source within a millimetre; triangles are unchanged.
   Usage: node tools/derive_tree.mjs [src] [dst] */
import fs from 'fs'; import path from 'path'; import os from 'os'; import crypto from 'crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const SRC = process.argv[2] || path.join(os.homedir(), 'kea-render-spike/public/assets/models/tree.glb');
const DST = process.argv[3] || 'assets/models/trees/island_tree_01_spike.glb';
const LOADER_OK = new Set(['EXT_texture_webp', 'KHR_texture_transform', 'KHR_materials_ior', 'KHR_materials_specular']);
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(SRC);
const stats = d => { let tris = 0; const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const n of d.getRoot().listNodes()) { if (!n.getMesh()) continue; const m = n.getWorldMatrix();
    for (const p of n.getMesh().listPrimitives()) { tris += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
      const a = p.getAttribute('POSITION'), v = [0, 0, 0];
      for (let i = 0; i < a.getCount(); i++) { a.getElement(i, v);
        const w = [0, 1, 2].map(r => m[r] * v[0] + m[r + 4] * v[1] + m[r + 8] * v[2] + m[r + 12]);
        for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[k]); hi[k] = Math.max(hi[k], w[k]); } } } }
  return { tris, lo, hi }; };
const before = stats(doc);
await doc.transform(dequantize({ pattern: /.*/ }));
for (const e of doc.getRoot().listExtensionsUsed()) if (e.extensionName === 'EXT_meshopt_compression' || e.extensionName === 'KHR_mesh_quantization') e.dispose();
fs.mkdirSync(path.dirname(DST), { recursive: true });
await new NodeIO().registerExtensions(ALL_EXTENSIONS).write(DST, doc);

const fails = [];
const json = JSON.parse((() => { const b = fs.readFileSync(DST); return b.slice(20, 20 + b.readUInt32LE(12)).toString(); })());
for (const e of json.extensionsRequired || []) if (!LOADER_OK.has(e)) fails.push('still requires ' + e);
for (const e of json.extensionsUsed || []) if (!LOADER_OK.has(e)) fails.push('still uses ' + e);
const out = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(DST), after = stats(out);
for (const m of out.getRoot().listMeshes()) for (const p of m.listPrimitives()) for (const k of ['POSITION', 'NORMAL']) {
  const a = p.getAttribute(k); if (!a) fails.push(m.getName() + ' has no ' + k); else if (a.getComponentType() !== 5126 || a.getNormalized()) fails.push(m.getName() + ' ' + k + ' is not float'); }
if (after.tris !== before.tris) fails.push(`triangles ${before.tris} -> ${after.tris}`);
const d = Math.max(...before.lo.map((v, i) => Math.abs(v - after.lo[i])), ...before.hi.map((v, i) => Math.abs(v - after.hi[i])));
if (d > 0.001) fails.push(`bounds moved ${(d * 1000).toFixed(1)} mm`);
const md5 = crypto.createHash('md5').update(fs.readFileSync(DST)).digest('hex');
console.log(`DERIVE_TREE ${SRC} -> ${DST}  ${(fs.statSync(DST).size / 1e6).toFixed(2)} MB  ${after.tris} tris  ${after.hi.map((v, i) => (v - after.lo[i]).toFixed(2)).join(' x ')} m  md5 ${md5}`);
console.log(fails.length ? fails.map(f => '  ✗ ' + f).join('\n') + '\nDERIVE_TREE: FAILED' : 'DERIVE_TREE: OK — geometry decoded to float, textures kept, bounds and triangles identical');
process.exit(fails.length ? 1 : 0);
