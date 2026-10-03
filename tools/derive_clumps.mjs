/* DERIVE THE TUSSOCK CLUMPS — Poly Haven grass_medium_01 (CC0) as the game's verge clumps. SPIKE_ADOPT row 9,
   2026-10-03. The render spike scattered this scan over its verge (its src/main.js, "GOLDEN TUSSOCK: grass_medium_01's
   mid LODs ... painted Lindis gold through the material colour, since the scan's albedo is a lawn green").

   SOURCE (read only): the spike's own Poly Haven download, ~/kea-render-spike/raw/grass_medium_01 (1k glTF + jpg).
   THE FILE HOLDS SIZE VARIANTS, NOT LODS: tiny (28-79 tris), small (650-830), mid (1.2-2.3 k), tall (290-340), large
   (4.6-6.4 k). Kept: the three TALL clumps and small_b — 290 to 650 triangles, the cheapest that read as a tussock
   at play distance (the spike used everything from 250 to 1600). Each node is RECENTRED on its own base (the file
   lays them out in a row along x) so an instance stands where it is put.
   THE BLADES ARE CARDS, AND THE 1k glTF DROPS THEIR ALPHA: its diffuse is a 3-channel JPEG of blades on BLACK (the
   image is even named diff-..._alpha), so drawn opaque every clump came out as dark sticks (measured, and the spike
   drew the same). Poly Haven publishes the cut-out separately, and better: grass_medium_01_dry_diff_1k.png is the
   SAME atlas painted as DRY grass, with its alpha in the fourth channel — Lindis gold without tinting a lawn. It is
   the colour map here (DRY=<path>, md5-checked), the material an alpha MASK (cut at 0.5), both faces.
   TEXTURES at 512, all PNG (the colour carries its alpha), plenty for a 40 cm clump.
   It ASSERTS: four meshes, triangles unchanged, every base at y 0 and centred in x/z, float attributes.
   Usage: node tools/derive_clumps.mjs [srcDir] [dst] */
import fs from 'fs'; import path from 'path'; import os from 'os'; import crypto from 'crypto';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const SRC = process.argv[2] || path.join(os.homedir(), 'kea-render-spike/raw/grass_medium_01');
const DST = process.argv[3] || 'assets/models/grass/tussock_clumps.glb';
const DRY = process.env.DRY || path.join(os.tmpdir(), 'grass_medium_01_dry_diff_1k.png');
const DRYMD5 = '6f5ae8d4f152542de30aad6b6a3ea327';   // https://dl.polyhaven.org/file/ph-assets/Models/png/1k/grass_medium_01/grass_medium_01_dry_diff_1k.png
if (!fs.existsSync(DRY) || crypto.createHash('md5').update(fs.readFileSync(DRY)).digest('hex') !== DRYMD5) { console.error('derive_clumps: DRY must be Poly Haven grass_medium_01_dry_diff_1k.png (md5 ' + DRYMD5 + ')'); process.exit(2); }
const KEEP = ['grass_medium_01_small_a_LOD0', 'grass_medium_01_small_b_LOD0'];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(path.join(SRC, 'grass_medium_01_1k.gltf'));
const R = doc.getRoot(), fails = [], tris0 = {};
const triCount = m => m.listPrimitives().reduce((s, p) => s + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0);
/* drop every node not kept, and its mesh */
for (const n of R.listNodes()) { if (!n.getMesh()) continue; if (!KEEP.includes(n.getName())) { const m = n.getMesh(); n.dispose(); if (m.listParents().filter(p => p !== R).length === 0) m.dispose(); } else tris0[n.getName()] = triCount(n.getMesh()); }
/* recentre each kept node on its own base: geometry moved so min y = 0 and the x/z centre is 0; node translation zeroed */
for (const n of R.listNodes()) { const m = n.getMesh(); if (!m) continue; n.setTranslation([0, 0, 0]);
  for (const p of m.listPrimitives()) { const A = p.getAttribute('POSITION'), v = [0, 0, 0], lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
    for (let i = 0; i < A.getCount(); i++) { A.getElement(i, v); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } }
    const c = [(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2];
    for (let i = 0; i < A.getCount(); i++) { A.getElement(i, v); A.setElement(i, [v[0] - c[0], v[1] - c[1], v[2] - c[2]]); } } }
/* the material: opaque, double-sided; textures to 512 */
for (const m of R.listMaterials()) { m.setAlphaMode('MASK'); m.setAlphaCutoff(0.5); m.setDoubleSided(true); }
for (const t of R.listTextures()) { const isColour = /diff/.test(t.getName() || t.getURI());
  /* the colour map is the DRY atlas with its alpha; resized with premultiplied alpha so no black halo bleeds in */
  const img = isColour ? sharp(fs.readFileSync(DRY)).ensureAlpha().resize(512, 512, { kernel: 'lanczos3', premultiplied: true })
                       : sharp(Buffer.from(t.getImage())).resize(512, 512, { kernel: 'lanczos3' });
  if (isColour) { t.setImage(new Uint8Array(await img.png().toBuffer())); t.setMimeType('image/png'); }
  else { t.setImage(new Uint8Array(await img.png().toBuffer())); t.setMimeType('image/png'); }
  t.setURI(''); }
fs.mkdirSync(path.dirname(DST), { recursive: true });
await io.write(DST, doc);
/* ---- the proof ---- */
const out = await io.read(DST), names = out.getRoot().listNodes().filter(n => n.getMesh()).map(n => n.getName());
if (names.length !== KEEP.length || !KEEP.every(k => names.includes(k))) fails.push('meshes ' + names.join(','));
for (const n of out.getRoot().listNodes()) { const m = n.getMesh(); if (!m) continue;
  if (triCount(m) !== tris0[n.getName()]) fails.push(n.getName() + ' triangles changed');
  for (const p of m.listPrimitives()) { const A = p.getAttribute('POSITION'); if (A.getComponentType() !== 5126) fails.push(n.getName() + ' POSITION not float');
    const v = [0, 0, 0], lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < A.getCount(); i++) { A.getElement(i, v); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); } }
    if (Math.abs(lo[1]) > 1e-4 || Math.abs(lo[0] + hi[0]) > 1e-3 || Math.abs(lo[2] + hi[2]) > 1e-3) fails.push(n.getName() + ' not stood on its base');
    console.log(`  ${n.getName().padEnd(32)} ${String(triCount(m)).padStart(5)} tris  ${(hi[0] - lo[0]).toFixed(2)} x ${(hi[1] - lo[1]).toFixed(2)} x ${(hi[2] - lo[2]).toFixed(2)} m`); } }
const md5 = crypto.createHash('md5').update(fs.readFileSync(DST)).digest('hex');
console.log(`DERIVE_CLUMPS ${SRC} -> ${DST}  ${(fs.statSync(DST).size / 1e6).toFixed(2)} MB  md5 ${md5}`);
console.log(fails.length ? fails.map(f => '  ✗ ' + f).join('\n') + '\nDERIVE_CLUMPS: FAILED' : 'DERIVE_CLUMPS: OK — four clumps, stood on their bases, dry-grass colour with its alpha as a mask, 512 textures');
process.exit(fails.length ? 1 : 0);
