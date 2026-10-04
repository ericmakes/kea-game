/* SPLIT A LID OFF A GENERATED BIN — Eric 2026-10-04: "The bin is its own piece - it needs a separate node named 'lid'
   and models.mjs taught to bind that node to the PECK BIN LID tween." Image-to-3D returns ONE mesh; the lid is cut
   from it here, by height, into its own node.
     1. SIZE=w,h,d BAKES the manifest box into the vertices (per-axis), so nothing above the lid carries a non-uniform
        scale — a lid rotating under a per-axis scale shears. The game then fits it with standM null (trust the file).
     2. LIDY (metres, after the bake): every triangle whose centroid is above it goes to a new primitive in a node named
        'lid'; the rest stays in the body. Read off the mesh's own radius profile — the lid's rim flares past the drum.
     3. The lid node's origin is the lid's own bounding-box centre (its geometry offset by the opposite), so a rotation
        applied to it turns the lid in place — the primitive lid is a cylinder about its own centre, and the binding in
        models.mjs copies that cylinder's tween onto this node.
   It asserts: both parts non-empty, triangles unchanged, the lid node named 'lid', the whole still ground-contact.
   Usage: SIZE=0.97,1.30,1.00 LIDY=1.04 [PIVOT=rear] node tools/split_lid.mjs <accepted.glb> <dst.glb> */
import fs from 'fs'; import crypto from 'crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld } from '@gltf-transform/functions';
const [SRC, DST] = process.argv.slice(2), SIZE = (process.env.SIZE || '').split(',').map(Number), LIDY = +process.env.LIDY;
if (!SRC || !DST || SIZE.length !== 3 || !isFinite(LIDY)) { console.error('usage: SIZE=w,h,d LIDY=<m> node tools/split_lid.mjs <in.glb> <out.glb>'); process.exit(2); }
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(SRC), root = doc.getRoot(), scene = root.listScenes()[0];
const meshNodes = root.listNodes().filter(n => n.getMesh());
if (meshNodes.length !== 1 || meshNodes[0].getMesh().listPrimitives().length !== 1) throw new Error('split_lid: expected one mesh with one primitive');
const node = meshNodes[0], prim = node.getMesh().listPrimitives()[0], W = node.getWorldMatrix();
const POS = prim.getAttribute('POSITION'), NOR = prim.getAttribute('NORMAL'), IDX = prim.getIndices().getArray(), n0 = IDX.length / 3;
/* world positions, then the bake to SIZE: per-axis scale about the footprint centre, min y to 0 */
const P = [], v = [0, 0, 0]; for (let i = 0; i < POS.getCount(); i++) { POS.getElement(i, v); P.push([0, 1, 2].map(r => W[r] * v[0] + W[r + 4] * v[1] + W[r + 8] * v[2] + W[r + 12])); }
const lo = [0, 1, 2].map(k => Math.min(...P.map(p => p[k]))), hi = [0, 1, 2].map(k => Math.max(...P.map(p => p[k]))), sc = [0, 1, 2].map(k => SIZE[k] / (hi[k] - lo[k]));
const Q = P.map(p => [(p[0] - (lo[0] + hi[0]) / 2) * sc[0], (p[1] - lo[1]) * sc[1], (p[2] - (lo[2] + hi[2]) / 2) * sc[2]]);
/* normals under a per-axis scale transform by the inverse scale (then renormalise); the node's own rotation is applied first */
const N = []; for (let i = 0; i < NOR.getCount(); i++) { NOR.getElement(i, v); const w = [0, 1, 2].map(r => W[r] * v[0] + W[r + 4] * v[1] + W[r + 8] * v[2]);
  const s = [w[0] / sc[0], w[1] / sc[1], w[2] / sc[2]], L = Math.hypot(...s) || 1; N.push(s.map(c => c / L)); }
/* triangles by centroid height */
const lidT = [], bodyT = [];
for (let t = 0; t < n0; t++) { const a = IDX[t * 3], b = IDX[t * 3 + 1], c = IDX[t * 3 + 2]; ((Q[a][1] + Q[b][1] + Q[c][1]) / 3 > LIDY ? lidT : bodyT).push(a, b, c); }
if (!lidT.length || !bodyT.length) throw new Error('split_lid: LIDY ' + LIDY + ' leaves an empty part');
/* the lid's centre, for its node origin */
const lv = [...new Set(lidT)], llo = [0, 1, 2].map(k => Math.min(...lv.map(i => Q[i][k]))), lhi = [0, 1, 2].map(k => Math.max(...lv.map(i => Q[i][k])));
/* PIVOT=rear puts the lid node's origin on its REAR BOTTOM EDGE (min z, min y) — a hinged lid, as the chilly bins'
   lid groups are hinged (lidG at the back edge); the default is the lid's centre, as the litter bin's lid turns in place */
const C = process.env.PIVOT === 'rear' ? [(llo[0] + lhi[0]) / 2, llo[1], llo[2]] : [0, 1, 2].map(k => (llo[k] + lhi[k]) / 2);
const mkPrim = (tris, off) => { const map = new Map(), pos = [], nor = [], uv = [], idx = [], UV = prim.getAttribute('TEXCOORD_0'), u = [0, 0];
  for (const i of tris) { if (!map.has(i)) { map.set(i, map.size); pos.push(Q[i][0] - off[0], Q[i][1] - off[1], Q[i][2] - off[2]); nor.push(...N[i]); if (UV) { UV.getElement(i, u); uv.push(u[0], u[1]); } } idx.push(map.get(i)); }
  const p = doc.createPrimitive().setMaterial(prim.getMaterial()).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(idx)))
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos))).setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)));
  if (UV) p.setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)));
  return p; };
const body = doc.createNode('body').setMesh(doc.createMesh('body').addPrimitive(mkPrim(bodyT, [0, 0, 0])));
const lid = doc.createNode('lid').setMesh(doc.createMesh('lid').addPrimitive(mkPrim(lidT, C))).setTranslation(C);
for (const c of scene.listChildren()) { scene.removeChild(c); }
const top = doc.createNode('bin').addChild(body).addChild(lid); scene.addChild(top);
for (const nd of root.listNodes()) if (nd !== top && nd !== body && nd !== lid && !nd.listParents().some(x => x === scene)) nd.dispose();
for (const m of root.listMeshes()) if (m.getName() !== 'body' && m.getName() !== 'lid') m.dispose();
for (const a of root.listAccessors()) if (!a.listParents().some(x => x !== root)) a.dispose();
fs.writeFileSync(DST, await io.writeBinary(doc));
/* ---- the proof ---- */
const out = await io.read(DST), names = out.getRoot().listNodes().map(n => n.getName()), fails = [];
if (!names.includes('lid')) fails.push('no node named lid');
let tris = 0, minY = 1e9; for (const nd of out.getRoot().listNodes()) { const m = nd.getMesh(); if (!m) continue; const Wm = nd.getWorldMatrix();
  for (const p of m.listPrimitives()) { tris += p.getIndices().getCount() / 3; const A = p.getAttribute('POSITION'), q = [0, 0, 0]; for (let i = 0; i < A.getCount(); i++) { A.getElement(i, q); minY = Math.min(minY, Wm[1] * q[0] + Wm[5] * q[1] + Wm[9] * q[2] + Wm[13]); } } }
if (tris !== n0) fails.push('triangles ' + n0 + ' -> ' + tris);
if (Math.abs(minY) > 1e-3) fails.push('min y ' + minY.toFixed(4));
console.log(`SPLIT_LID ${SRC} -> ${DST}  body ${bodyT.length / 3} + lid ${lidT.length / 3} = ${tris} tris  baked to ${SIZE.join(' x ')} m  lid centre ${C.map(c => c.toFixed(3)).join(', ')}  md5 ${crypto.createHash('md5').update(fs.readFileSync(DST)).digest('hex')}`);
console.log(fails.length ? fails.map(f => '  ✗ ' + f).join('\n') + '\nSPLIT_LID: FAILED' : 'SPLIT_LID: OK — body and a node named lid, triangles unchanged, ground contact');
process.exit(fails.length ? 1 : 0);
