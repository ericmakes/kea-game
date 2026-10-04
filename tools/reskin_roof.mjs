/* RE-SKIN A GENERATED ROOF — for the Ski Field tow shed (Step 3, SPIKE_ADOPT 23). Image-to-3D textured the shed's walls
   cleanly from three views but not its roof: from above, the projection is dark shards (five generations, single- and
   multi-view; a fourth, roof-only view fixed the roof and broke the walls). So the roof's triangles — normal facing up
   (ny > NY) and above EAVE metres — are moved to their own primitive wearing the game's OWN corrugated_iron_02 scan
   (Poly Haven CC0, already the corrugate family's set; assets/tex), with planar UVs along the roof at TILE metres a
   tile, ribs running down the fall line (+z to -z here). The walls keep the generated texture.
   It asserts: triangles unchanged, both primitives non-empty, the roof primitive's UVs present.
   DROP=1 instead REMOVES the roof's triangles: a re-skinned roof was still dark shards, because the GEOMETRY of the
   generated roof is crumpled, not only its texture. The tow shed then keeps the PRIMITIVE's own roof (already the
   corrugate family) visible over the generated walls (userData.keepWithModel, the DOC crate's mechanism).
   Usage: NY=0.55 EAVE=2.0 TILE=2.7 [DROP=1] node tools/reskin_roof.mjs <accepted.glb> <dst.glb> */
import fs from 'fs'; import crypto from 'crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [SRC, DST] = process.argv.slice(2), NY = +(process.env.NY || 0.55), EAVE = +(process.env.EAVE || 0), TILE = +(process.env.TILE || 2.7);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(SRC), root = doc.getRoot();
const nodes = root.listNodes().filter(n => n.getMesh());
if (nodes.length !== 1 || nodes[0].getMesh().listPrimitives().length !== 1) throw new Error('reskin_roof: expected one mesh, one primitive');
const node = nodes[0], prim = node.getMesh().listPrimitives()[0], W = node.getWorldMatrix();
const POS = prim.getAttribute('POSITION'), IDX = Array.from(prim.getIndices().getArray()), n0 = IDX.length / 3, v = [0, 0, 0];
const P = []; for (let i = 0; i < POS.getCount(); i++) { POS.getElement(i, v); P.push([0, 1, 2].map(r => W[r] * v[0] + W[r + 4] * v[1] + W[r + 8] * v[2] + W[r + 12])); }
const roofT = [], wallT = [];
for (let t = 0; t < n0; t++) { const [a, b, c] = [IDX[t * 3], IDX[t * 3 + 1], IDX[t * 3 + 2]], A = P[a], B = P[b], Cc = P[c];
  const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], w = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]];
  const nrm = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], L = Math.hypot(...nrm) || 1;
  ((nrm[1] / L > NY && (A[1] + B[1] + Cc[1]) / 3 > EAVE) ? roofT : wallT).push(a, b, c); }
if (!roofT.length || !wallT.length) throw new Error('reskin_roof: ' + roofT.length / 3 + ' roof / ' + wallT.length / 3 + ' wall triangles');
/* the roof's own vertices (copied, so the walls' UVs are untouched), planar UVs in metres / TILE in world x and z */
const map = new Map(), pos = [], nor = [], uv = [], idx = [], NOR = prim.getAttribute('NORMAL'), q = [0, 0, 0];
for (const i of roofT) { if (!map.has(i)) { map.set(i, map.size); POS.getElement(i, q); pos.push(...q); NOR.getElement(i, q); nor.push(...q);
    uv.push(P[i][0] / TILE, P[i][2] / TILE); } idx.push(map.get(i)); }
const tex = f => doc.createTexture(f).setImage(new Uint8Array(fs.readFileSync('assets/tex/' + f))).setMimeType('image/jpeg');
const mat = doc.createMaterial('corrugated_iron_02 (roof)').setBaseColorTexture(tex('corrugated_iron_02_diff_1k.jpg'))
  .setNormalTexture(tex('corrugated_iron_02_nor_gl_1k.jpg')).setMetallicRoughnessTexture(tex('corrugated_iron_02_arm_1k.jpg')).setMetallicFactor(1).setRoughnessFactor(1);
const roof = doc.createPrimitive().setMaterial(mat).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(idx)))
  .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)))
  .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)))
  .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(new Float32Array(uv)));
prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(wallT)));
/* DROP COMPACTS: re-indexing alone leaves the dropped roof's vertices in every attribute, and three's bounding box (and
   so the game's fit, and the ground-contact origin) is taken over the WHOLE attribute — the first DROP'd tow shed was
   sized against a box that still held its roof. So every attribute is rebuilt with only the vertices the walls use. */
const compact = (pr, keepIdx) => { const used = [...new Set(keepIdx)].sort((a, b) => a - b), remap = new Map(used.map((v, i) => [v, i]));
  for (const sem of pr.listSemantics()) { const A = pr.getAttribute(sem), n = A.getElementSize(), src = A.getArray(), out = new src.constructor(used.length * n);
    used.forEach((v, i) => { for (let k = 0; k < n; k++) out[i * n + k] = src[v * n + k]; });
    pr.setAttribute(sem, doc.createAccessor().setType(A.getType()).setArray(out).setNormalized(A.getNormalized())); }
  pr.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(keepIdx.map(v => remap.get(v))))); };
if (process.env.DROP) { compact(prim, wallT); roof.dispose(); mat.getBaseColorTexture().dispose(); mat.getNormalTexture().dispose(); mat.getMetallicRoughnessTexture().dispose(); mat.dispose(); }
else node.getMesh().addPrimitive(roof);
fs.writeFileSync(DST, await io.writeBinary(doc));
const out = await io.read(DST); let tris = 0; for (const m of out.getRoot().listMeshes()) for (const p of m.listPrimitives()) tris += p.getIndices().getCount() / 3;
const ok = tris === (process.env.DROP ? wallT.length / 3 : n0);
if (process.env.DROP) { let used = 0; for (const m of out.getRoot().listMeshes()) for (const p of m.listPrimitives()) used += p.getAttribute('POSITION').getCount();
  console.log('  compacted: ' + used + ' vertices kept, all of them indexed'); }
console.log(`RESKIN_ROOF ${SRC} -> ${DST}  walls ${wallT.length / 3} + roof ${roofT.length / 3} = ${tris} tris  roof: corrugated_iron_02 at ${TILE} m  md5 ${crypto.createHash('md5').update(fs.readFileSync(DST)).digest('hex')}`);
console.log(ok ? 'RESKIN_ROOF: OK' : 'RESKIN_ROOF: FAILED — triangles ' + n0 + ' -> ' + tris);
process.exit(ok ? 0 : 1);
