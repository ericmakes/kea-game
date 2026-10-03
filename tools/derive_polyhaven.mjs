/* DERIVE A POLY HAVEN MODEL — fetch one CC0 model at a resolution and pack it as a plain GLB the game loads.
   MODEL_MANIFEST's rule for the per-map pass (Eric, 2026-10-03): "replace placeholders in pixel order: Poly Haven CC0
   first, Higgsfield image-to-3D second, Astra last". This is the first route, made repeatable.

   FROM THE PUBLIC API ONLY: https://api.polyhaven.com/files/<id> lists the glTF at each resolution with its `include`
   map (bin + textures) and an md5 for every file; every download is checked against that md5, and the authors come
   from https://api.polyhaven.com/info/<id>. Raw downloads are cached under raw_polyhaven/ (gitignored).
   THE GLB IS PLAIN: no Draco, no meshopt, no quantization (the game's loader has no decoders registered; vehicles and
   trees learned that), textures embedded as the JPEG/PNG Poly Haven ships. It ASSERTS: it reads back, every
   primitive has float POSITION/NORMAL and indices, triangles and bounds equal the source's.
   Usage: node tools/derive_polyhaven.mjs <id> <dst.glb> [res=1k]      prints the licence row to paste */
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const [ID, DST, RES = '1k'] = process.argv.slice(2);
if (!ID || !DST) { console.error('usage: node tools/derive_polyhaven.mjs <id> <dst.glb> [res]'); process.exit(2); }
const RAW = path.join('raw_polyhaven', ID, RES); fs.mkdirSync(RAW, { recursive: true });
const md5 = b => crypto.createHash('md5').update(b).digest('hex');
async function fetchChecked(url, dst, want) {
  if (fs.existsSync(dst) && (!want || md5(fs.readFileSync(dst)) === want)) return;
  const r = await fetch(url); if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
  const b = Buffer.from(await r.arrayBuffer()); if (want && md5(b) !== want) throw new Error(url + ': md5 ' + md5(b) + ' != ' + want);
  fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, b); }
const files = await (await fetch('https://api.polyhaven.com/files/' + ID)).json();
const info = await (await fetch('https://api.polyhaven.com/info/' + ID)).json();
const G = files.gltf && files.gltf[RES] && files.gltf[RES].gltf; if (!G) throw new Error(ID + ': no glTF at ' + RES);
const gltfPath = path.join(RAW, path.basename(G.url));
await fetchChecked(G.url, gltfPath, G.md5);
const got = [{ rel: path.basename(G.url), md5: G.md5, size: G.size }];
for (const [rel, f] of Object.entries(G.include || {})) { await fetchChecked(f.url, path.join(RAW, rel), f.md5); got.push({ rel, md5: f.md5, size: f.size }); }

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(gltfPath);
const stats = d => { let tris = 0; const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const n of d.getRoot().listNodes()) { const m = n.getMesh(); if (!m) continue; const W = n.getWorldMatrix();
    for (const p of m.listPrimitives()) { tris += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
      const A = p.getAttribute('POSITION'), v = [0, 0, 0]; for (let i = 0; i < A.getCount(); i++) { A.getElement(i, v);
        const w = [0, 1, 2].map(r => W[r] * v[0] + W[r + 4] * v[1] + W[r + 8] * v[2] + W[r + 12]); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], w[k]); hi[k] = Math.max(hi[k], w[k]); } } } }
  return { tris, lo, hi }; };
const before = stats(doc);
fs.mkdirSync(path.dirname(DST), { recursive: true });
await io.write(DST, doc);
const fails = [], out = await io.read(DST), after = stats(out);
const J = (() => { const b = fs.readFileSync(DST); return JSON.parse(b.slice(20, 20 + b.readUInt32LE(12)).toString()); })();
for (const e of J.extensionsRequired || []) fails.push('requires ' + e);
for (const m of out.getRoot().listMeshes()) for (const p of m.listPrimitives()) { for (const k of ['POSITION', 'NORMAL']) { const a = p.getAttribute(k);
    if (!a) fails.push(m.getName() + ' lacks ' + k); else if (a.getComponentType() !== 5126) fails.push(m.getName() + ' ' + k + ' not float'); } if (!p.getIndices()) fails.push(m.getName() + ' unindexed'); }
if (after.tris !== before.tris) fails.push('triangles ' + before.tris + ' -> ' + after.tris);
if (Math.max(...before.lo.map((v, i) => Math.abs(v - after.lo[i])), ...before.hi.map((v, i) => Math.abs(v - after.hi[i]))) > 1e-3) fails.push('bounds moved');
const size = after.hi.map((v, i) => +(v - after.lo[i]).toFixed(3)), sum = md5(fs.readFileSync(DST));
const authors = Object.entries(info.authors || {}).map(([a, r]) => a + ' (' + r + ')').join(', ');
console.log(`DERIVE_POLYHAVEN ${ID} ${RES} -> ${DST}  ${(fs.statSync(DST).size / 1e6).toFixed(2)} MB  ${after.tris} tris  ${size.join(' x ')} m  md5 ${sum}`);
console.log(`  licence row: | \`${DST.replace(/^assets\//, '')}\` | ${info.name} (${ID}) | ${authors} | CC0 | \`${sum}\` | from ${got.length} Poly Haven files, md5-checked: ${got.map(g => g.rel + ' ' + g.md5).join('; ')} |`);
console.log(fails.length ? fails.map(f => '  ✗ ' + f).join('\n') + '\nDERIVE_POLYHAVEN: FAILED' : 'DERIVE_POLYHAVEN: OK — plain GLB, float geometry, triangles and bounds equal the source');
process.exit(fails.length ? 1 : 0);
