/* DERIVE THE VEHICLES — the render spike's cars as a PLAIN GLB the game's loader can read.
   SPIKE_ADOPT row 1a, 2026-10-03.

   The spike's `public/assets/models/vehicles.glb` (four SDF bodies from its tools/cars.mjs: hatch,
   ute, caravan, trailer) is written with EXT_meshopt_compression and KHR_mesh_quantization, both
   REQUIRED. The game's GLTFLoader has no meshopt decoder registered, and an unregistered required
   extension does not throw a useful error at the call site — the asset arrives empty and the prop
   stays primitive. So this writes the same geometry with neither: meshopt decoded, every attribute
   dequantized to float, normals kept at full float precision (the spike's own finding: 8-bit normals
   band a clear coat). Node names, the per-node extras (wheels, seams) and the material ZONE names
   (paint, glass, trim, lightW, lightR, plate, chassis, stripe, glassTint, door, galv, tarp) are kept,
   because the game paints by zone.
   It ASSERTS the result: no extensions used, every primitive has float POSITION/NORMAL, the four
   nodes are there, and the bounding boxes match the source to a millimetre.
   Usage: node tools/derive_vehicles.mjs [src] [dst]
     default src ~/kea-render-spike/public/assets/models/vehicles.glb
     default dst assets/models/vehicles/vehicles_plain.glb */
import fs from 'fs'; import path from 'path'; import os from 'os'; import crypto from 'crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize, prune } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const SRC = process.argv[2] || path.join(os.homedir(), 'kea-render-spike/public/assets/models/vehicles.glb');
const DST = process.argv[3] || 'assets/models/vehicles/vehicles_plain.glb';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(SRC);
const bbox = d => Object.fromEntries(d.getRoot().listNodes().filter(n => n.getMesh()).map(n => {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], m = n.getWorldMatrix();
  for (const p of n.getMesh().listPrimitives()) { const a = p.getAttribute('POSITION'), v = [0, 0, 0];
    for (let i = 0; i < a.getCount(); i++) { a.getElement(i, v);
      const w = [0, 1, 2].map(r => m[r] * v[0] + m[r + 4] * v[1] + m[r + 8] * v[2] + m[r + 12]);
      for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[k]); hi[k] = Math.max(hi[k], w[k]); } } }
  return [n.getName(), [lo, hi]]; }));
const before = bbox(doc);
await doc.transform(dequantize({ pattern: /.*/ }), prune());
for (const e of doc.getRoot().listExtensionsUsed()) e.dispose();
/* dequantize leaves the node transforms that carried the quantization; bake nothing else */
fs.mkdirSync(path.dirname(DST), { recursive: true });
await new NodeIO().write(DST, doc);

/* ---- the asserts ---- */
const out = await new NodeIO().read(DST), fails = [];
const json = JSON.parse((() => { const b = fs.readFileSync(DST); return b.slice(20, 20 + b.readUInt32LE(12)).toString(); })());
if ((json.extensionsUsed || []).length) fails.push('extensions still used: ' + json.extensionsUsed.join(', '));
const names = out.getRoot().listNodes().map(n => n.getName());
for (const want of ['hatch', 'ute', 'caravan', 'trailer']) if (!names.includes(want)) fails.push('node missing: ' + want);
for (const m of out.getRoot().listMeshes()) for (const p of m.listPrimitives())
  for (const k of ['POSITION', 'NORMAL']) { const a = p.getAttribute(k);
    if (!a) fails.push(m.getName() + ' has no ' + k); else if (a.getComponentType() !== 5126 || a.getNormalized()) fails.push(m.getName() + ' ' + k + ' is not float'); }
const after = bbox(out);
for (const n in before) { const [a0, a1] = before[n], [b0, b1] = after[n] || [[0, 0, 0], [0, 0, 0]];
  const d = Math.max(...a0.map((v, i) => Math.abs(v - b0[i])), ...a1.map((v, i) => Math.abs(v - b1[i])));
  if (d > 0.001) fails.push(`${n}: bounds moved ${(d * 1000).toFixed(1)} mm in the re-export`); }
for (const n of out.getRoot().listNodes()) if (n.getMesh() && !(n.getExtras() || {}).wheels) fails.push(n.getName() + ' lost its wheels extras');
const md5 = crypto.createHash('md5').update(fs.readFileSync(DST)).digest('hex');
console.log(`DERIVE_VEHICLES ${SRC} -> ${DST}  ${(fs.statSync(DST).size / 1e6).toFixed(2)} MB  md5 ${md5}`);
for (const n in after) console.log(`  ${n.padEnd(8)} ${after[n][1].map((v, i) => (v - after[n][0][i]).toFixed(3)).join(' x ')} m`);
console.log(fails.length ? fails.map(f => '  ✗ ' + f).join('\n') + '\nDERIVE_VEHICLES: FAILED' : 'DERIVE_VEHICLES: OK — plain GLB, float attributes, four bodies, bounds identical');
process.exit(fails.length ? 1 : 0);
