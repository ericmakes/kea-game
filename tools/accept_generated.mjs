/* ACCEPT A GENERATED MODEL — Higgsfield image-to-3D (Meshy) output, brought to MODEL_MANIFEST's conventions or refused.
   Eric, 2026-10-04: "verify against its spec before accepting - plain GLB (decode any Draco/meshopt to plain, as
   derive_tree did), the triangle tier, origin at ground contact, +Z front, 1024 maps; reject and regenerate if off."
   What this does to the file, and only this:
     - meshopt decoded (three's MeshoptDecoder, as tools/derive_tree.mjs), quantization removed (dequantize). Draco
       has no decoder installed here: a Draco file is REFUSED with that reason rather than half-read.
     - every texture brought to at most 1024 on its long side (sharp, lanczos), kept as its own format.
     - the origin moved to GROUND CONTACT UNDER THE FOOTPRINT CENTRE: geometry translated so min y = 0 and the x/z
       centre of the box is 0 (the loader's fit.ground would lift it anyway; the manifest asks the file to be right).
     - optional yaw (RY=<radians>) baked into the root node when a model arrives facing the wrong way.
   What it ASSERTS (exit 1 and REFUSED if any fails): no extensionsRequired left; float POSITION and NORMAL on every
   primitive, indexed; triangles <= the tier budget (TRIS=<n>); every texture <= 1024; min y = 0 and x/z centred.
   +Z-FRONT CANNOT BE PROVED FROM GEOMETRY: the file says nothing about which side is the front. It is checked by
   eye on a render (tools/look_model.mjs) and recorded; RY fixes it here.
   It prints the box (W x H x D) for the spec comparison and the licence row's md5.
   Usage: TRIS=2500 WIDTH=<metres> [RY=3.14159] node tools/accept_generated.mjs <raw.glb> <dst.glb> */
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dequantize } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const [SRC, DST] = process.argv.slice(2), TRIS = +(process.env.TRIS || 0), RY = +(process.env.RY || 0), WIDTH = +(process.env.WIDTH || 0);
if (!SRC || !DST || !TRIS) { console.error('usage: TRIS=<budget> [RY=rad] node tools/accept_generated.mjs <raw.glb> <dst.glb>'); process.exit(2); }
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const rawJ = (() => { const b = fs.readFileSync(SRC); return JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString()); })();
if ((rawJ.extensionsUsed || []).includes('KHR_draco_mesh_compression')) { console.log('ACCEPT_GENERATED: REFUSED — Draco-compressed; no Draco decoder is installed (regenerate uncompressed, or add draco3d)'); process.exit(1); }
const doc = await io.read(SRC);
await doc.transform(dequantize());
for (const e of doc.getRoot().listExtensionsUsed()) if (/meshopt|quantization/i.test(e.extensionName)) e.dispose();
const root = doc.getRoot(), scene = root.getDefaultScene() || root.listScenes()[0];
/* optional yaw: wrap the scene's top nodes in one node turned by RY, then bake below */
if (RY) { const n = doc.createNode('yaw').setRotation([0, Math.sin(RY / 2), 0, Math.cos(RY / 2)]);
  for (const c of scene.listChildren()) { scene.removeChild(c); n.addChild(c); } scene.addChild(n); }
/* world box over every mesh vertex */
const box = () => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; let tris = 0;
  for (const nd of root.listNodes()) { const m = nd.getMesh(); if (!m) continue; const W = nd.getWorldMatrix();
    for (const p of m.listPrimitives()) { const A = p.getAttribute('POSITION'), v = [0, 0, 0];
      tris += (p.getIndices() ? p.getIndices().getCount() : A.getCount()) / 3;
      for (let i = 0; i < A.getCount(); i++) { A.getElement(i, v); const w = [0, 1, 2].map(r => W[r] * v[0] + W[r + 4] * v[1] + W[r + 8] * v[2] + W[r + 12]);
        for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[k]); hi[k] = Math.max(hi[k], w[k]); } } } }
  return { lo, hi, tris }; };
const b0 = box();
/* origin to ground contact under the footprint centre: one translation on a new top node */
/* METRES: Meshy normalises every model to ~1.9 units on its longest side. WIDTH=<m> scales it uniformly so its x extent
   is the spec's width (MODEL_MANIFEST: "ship metres"); the game's fit still measures, per axis, against the collider. */
const s = WIDTH ? WIDTH / (b0.hi[0] - b0.lo[0]) : 1;
{ const t = doc.createNode('ground').setScale([s, s, s]).setTranslation([-(b0.lo[0] + b0.hi[0]) / 2 * s, -b0.lo[1] * s, -(b0.lo[2] + b0.hi[2]) / 2 * s]);
  for (const c of scene.listChildren()) { scene.removeChild(c); t.addChild(c); } scene.addChild(t); }
/* textures to <= 1024 */
for (const t of root.listTextures()) { const img = t.getImage(); if (!img) continue; const m = await sharp(Buffer.from(img)).metadata();
  if (Math.max(m.width, m.height) > 1024) { const png = t.getMimeType() === 'image/png';
    const out = sharp(Buffer.from(img)).resize(m.width >= m.height ? 1024 : null, m.height > m.width ? 1024 : null, { kernel: 'lanczos3' });
    t.setImage(new Uint8Array(await (png ? out.png() : out.jpeg({ quality: 90 })).toBuffer())); } }
fs.mkdirSync(path.dirname(DST), { recursive: true });
await io.write(DST, doc);
/* ---- the proof, on the file as written ---- */
const fails = [], out = await io.read(DST);
const J = (() => { const b = fs.readFileSync(DST); return JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString()); })();
for (const e of J.extensionsRequired || []) fails.push('requires ' + e);
for (const m of out.getRoot().listMeshes()) for (const p of m.listPrimitives()) { for (const k of ['POSITION', 'NORMAL']) { const a = p.getAttribute(k);
  if (!a) fails.push(m.getName() + ' lacks ' + k); else if (a.getComponentType() !== 5126) fails.push(m.getName() + ' ' + k + ' not float'); }
  if (!p.getIndices()) fails.push(m.getName() + ' unindexed'); }
let maxTex = 0; for (const t of out.getRoot().listTextures()) { const im = t.getImage(); if (!im) continue; const m = await sharp(Buffer.from(im)).metadata(); maxTex = Math.max(maxTex, m.width, m.height); }
if (maxTex > 1024) fails.push('a texture is ' + maxTex + ' px');
const ob = (() => { const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; let tris = 0;
  for (const nd of out.getRoot().listNodes()) { const m = nd.getMesh(); if (!m) continue; const W = nd.getWorldMatrix();
    for (const p of m.listPrimitives()) { const A = p.getAttribute('POSITION'), v = [0, 0, 0]; tris += (p.getIndices() ? p.getIndices().getCount() : A.getCount()) / 3;
      for (let i = 0; i < A.getCount(); i++) { A.getElement(i, v); const w = [0, 1, 2].map(r => W[r] * v[0] + W[r + 4] * v[1] + W[r + 8] * v[2] + W[r + 12]);
        for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[k]); hi[k] = Math.max(hi[k], w[k]); } } } }
  return { lo, hi, tris }; })();
if (ob.tris > TRIS) fails.push('triangles ' + ob.tris + ' > tier ' + TRIS);
if (Math.abs(ob.lo[1]) > 1e-3) fails.push('min y ' + ob.lo[1].toFixed(4) + ', not ground contact');
if (Math.abs(ob.lo[0] + ob.hi[0]) > 2e-3 || Math.abs(ob.lo[2] + ob.hi[2]) > 2e-3) fails.push('not centred in x/z');
const size = [0, 1, 2].map(k => +(ob.hi[k] - ob.lo[k]).toFixed(3)), sum = crypto.createHash('md5').update(fs.readFileSync(DST)).digest('hex');
console.log(`ACCEPT_GENERATED ${SRC} -> ${DST}  ${(fs.statSync(DST).size / 1e6).toFixed(2)} MB  ${ob.tris} tris (tier ${TRIS})  box ${size.join(' x ')} (file units, W x H x D)  textures <= ${maxTex}  md5 ${sum}${RY ? '  yaw ' + RY : ''}`);
console.log(fails.length ? fails.map(f => '  ✗ ' + f).join('\n') + '\nACCEPT_GENERATED: REFUSED' : 'ACCEPT_GENERATED: OK — plain GLB, float indexed geometry, within tier, ground-contact origin, textures <= 1024 (front: check the render)');
process.exit(fails.length ? 1 : 0);
