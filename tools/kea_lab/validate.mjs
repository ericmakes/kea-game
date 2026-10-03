/* VALIDATE THE KEA VARIANTS — one report per variant, in the manner of Task 3's
   POSITION_NORMAL_PATCH_VALIDATION.json + INDEPENDENT_GEOMETRY_AUDIT.json.

   A against the APPROVED file:  every bufferView outside the eight vertex/index/morph payloads byte-identical
     (skin, inverse binds, all eleven clips, the images); every ORIGINAL row of POSITION, NORMAL, TEXCOORD_0,
     JOINTS_0, WEIGHTS_0 and both morph streams byte-identical; the kept triangles in their original order;
     new rows weighted only to Tail/TailEnd, weights summing to 1, morph deltas zero.
   B and C against A:  only the POSITION and NORMAL payloads differ; the JSON differs only in those two
     accessors' min/max (glTF requires them true); images, UVs, joints, weights, indices, morph and clips
     byte-identical; joint and triangle counts unchanged.
   EVERY FILE: no NaN, unit normals, and MEASURED in the rest pose (approved_idle, t=0): head size, eye span,
     bill length and depth, body girth, tail span and tip width — and the tail's CLIPPING: triangle pairs where
     the tail cuts the rest of the bird, at four times through every clip.
   Usage: node tools/kea_lab/validate.mjs [dir]     writes <dir>/VALIDATION_{A,B,C}.json and prints a table */
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
import * as THREE from 'three';
globalThis.createImageBitmap = async () => ({ width: 4, height: 4, close() {} });
globalThis.self = { URL: { createObjectURL: () => 'blob:stub', revokeObjectURL() {} } };
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const DIR = path.resolve(process.argv[2] || path.join(ROOT, 'kea_variants_local'));
const SRC = path.join(ROOT, 'assets/models/astra_incoming/approved/kea_animated.glb');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const readGLB = buf => { const jl = buf.readUInt32LE(12); const json = JSON.parse(buf.slice(20, 20 + jl)); const bo = 20 + jl; return { buf, json, jsonBytes: buf.slice(20, 20 + jl), bin: buf.slice(bo + 8, bo + 8 + buf.readUInt32LE(bo)) }; };
const view = (g, i) => { const V = g.json.bufferViews[i]; return g.bin.slice(V.byteOffset || 0, (V.byteOffset || 0) + V.byteLength); };
const EYEUV = [0.2072, 0.8730], EYER = 0.012;

async function load(file) {
  const buf = fs.readFileSync(file); const g = await new Promise((res, rej) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
  let sk; g.scene.traverse(o => { if (o.isSkinnedMesh) sk = o; }); return { g, sk, raw: readGLB(buf) }; }
function posed(L, clip, t) {
  const mixer = new THREE.AnimationMixer(L.g.scene); mixer.clipAction(L.g.animations.find(a => a.name === clip)).play(); mixer.setTime(t);
  L.g.scene.updateMatrixWorld(true); L.sk.skeleton.update(); const n = L.sk.geometry.attributes.position.count, out = new Float32Array(n * 3), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) { L.sk.getVertexPosition(i, v); v.applyMatrix4(L.sk.matrixWorld); out.set([v.x, v.y, v.z], i * 3); } mixer.stopAllAction(); mixer.uncacheRoot(L.g.scene); return out; }
const dominant = (L, i) => { const J = L.sk.geometry.attributes.skinIndex, W = L.sk.geometry.attributes.skinWeight; let b = 0; for (let k = 1; k < 4; k++) if (W.getComponent(i, k) > W.getComponent(i, b)) b = k; return L.sk.skeleton.bones[J.getComponent(i, b)].name; };

/* ---- byte gates ---- */
function byteGate(ref, cur, allowViews, allowAccessorKeys) {
  const out = { viewsDiffering: [], viewsAllowed: allowViews, jsonDiffOutsideAllowed: [] };
  const n = Math.max(ref.json.bufferViews.length, cur.json.bufferViews.length);
  for (let i = 0; i < n; i++) if (!view(ref, i).equals(view(cur, i))) out.viewsDiffering.push(i);
  out.onlyAllowedViewsDiffer = out.viewsDiffering.every(i => allowViews.includes(i));
  /* JSON: strip what is allowed to move (bufferView offsets/lengths, buffer length, and the named accessor keys), then compare */
  const strip = j => { const c = JSON.parse(JSON.stringify(j)); c.bufferViews.forEach(v => { delete v.byteOffset; delete v.byteLength; }); c.buffers.forEach(b => delete b.byteLength);
    for (const [a, keys] of allowAccessorKeys) for (const k of keys) delete c.accessors[a][k]; return JSON.stringify(c); };
  out.jsonIdenticalOutsideAllowed = strip(ref.json) === strip(cur.json);
  out.imagesIdentical = ref.json.images.every((im, k) => view(ref, im.bufferView).equals(view(cur, cur.json.images[k].bufferView)));
  out.jsonChunkByteIdentical = ref.jsonBytes.equals(cur.jsonBytes);
  return out; }

/* ---- triangle-triangle intersection count between two triangle sets, on a grid ---- */
function segTri(p, q, a, b, c) { const e1 = [b[0]-a[0],b[1]-a[1],b[2]-a[2]], e2 = [c[0]-a[0],c[1]-a[1],c[2]-a[2]], d = [q[0]-p[0],q[1]-p[1],q[2]-p[2]];
  const h = [d[1]*e2[2]-d[2]*e2[1], d[2]*e2[0]-d[0]*e2[2], d[0]*e2[1]-d[1]*e2[0]], det = e1[0]*h[0]+e1[1]*h[1]+e1[2]*h[2]; if (Math.abs(det) < 1e-12) return false;
  const f = 1/det, s = [p[0]-a[0],p[1]-a[1],p[2]-a[2]], u = f*(s[0]*h[0]+s[1]*h[1]+s[2]*h[2]); if (u < 0 || u > 1) return false;
  const qv = [s[1]*e1[2]-s[2]*e1[1], s[2]*e1[0]-s[0]*e1[2], s[0]*e1[1]-s[1]*e1[0]], v = f*(d[0]*qv[0]+d[1]*qv[1]+d[2]*qv[2]); if (v < 0 || u + v > 1) return false;
  const t = f*(e2[0]*qv[0]+e2[1]*qv[1]+e2[2]*qv[2]); return t > 1e-6 && t < 1 - 1e-6; }
function crossings(P, trisA, trisB, cell = 2) {
  const V = i => [P[i*3], P[i*3+1], P[i*3+2]], key = (x, y, z) => x + ',' + y + ',' + z, grid = new Map();
  const cells = tri => { const pts = tri.map(V), lo = [0,1,2].map(k => Math.floor(Math.min(...pts.map(p => p[k])) / cell)), hi = [0,1,2].map(k => Math.floor(Math.max(...pts.map(p => p[k])) / cell)), out = [];
    for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) out.push(key(x, y, z)); return out; };
  trisB.forEach((t, k) => { for (const c of cells(t)) (grid.get(c) || grid.set(c, []).get(c)).push(k); });
  let hits = 0;
  for (const ta of trisA) { const seen = new Set(), A = ta.map(V);
    for (const c of cells(ta)) for (const k of grid.get(c) || []) { if (seen.has(k)) continue; seen.add(k); const tb = trisB[k]; if (tb.some(v => ta.includes(v))) continue; const B = tb.map(V);
      if (segTri(A[0],A[1],...B) || segTri(A[1],A[2],...B) || segTri(A[2],A[0],...B) || segTri(B[0],B[1],...A) || segTri(B[1],B[2],...A) || segTri(B[2],B[0],...A)) { hits++; break; } } }
  return hits; }

/* ---- measurements in the rest pose ---- */
function measure(L, P, N0, pivots) {
  const n = P.length / 3, UV = L.sk.geometry.attributes.uv, m = {};
  const V = i => new THREE.Vector3(P[i*3], P[i*3+1], P[i*3+2]);
  const headIdx = [], billIdx = [], eyes = { l: [], r: [] }, bodyIdx = [];
  for (let i = 0; i < n; i++) { const d = dominant(L, i);
    /* the skull: vertices wholly on Head — not the bill, which B and C shorten, nor the neck blend, which scales part-way */
    { const Jx = L.sk.geometry.attributes.skinIndex, Wx = L.sk.geometry.attributes.skinWeight; let wh = 0; for (let k = 0; k < 4; k++) if (/Head_bone/.test(L.sk.skeleton.bones[Jx.getComponent(i, k)].name)) wh += Wx.getComponent(i, k); if (wh > 0.99) headIdx.push(i); }
    if (/Mandible|Bone047/.test(d)) billIdx.push(i);
    if (/Ilium|Scapula/.test(d)) bodyIdx.push(i);
    if (Math.hypot(UV.getX(i) - EYEUV[0], UV.getY(i) - EYEUV[1]) < EYER) (P[i*3] < 0 ? eyes.l : eyes.r).push(i); }
  const box = idx => idx.reduce((b, i) => b.expandByPoint(V(i)), new THREE.Box3());
  const hb = box(headIdx); m.headSize = +hb.getSize(new THREE.Vector3()).length().toFixed(3);
  const fwd = new THREE.Vector3(...pivots.headForward), up = new THREE.Vector3(0, 1, 0);
  const proj = (idx, ax) => { let lo = Infinity, hi = -Infinity; for (const i of idx) { const s = V(i).dot(ax); lo = Math.min(lo, s); hi = Math.max(hi, s); } return hi - lo; };
  m.billLength = +proj(billIdx, fwd).toFixed(3); m.billDepth = +proj(billIdx, up).toFixed(3);
  m.eyeSpan = +((proj(eyes.l, fwd) + proj(eyes.r, fwd)) / 2).toFixed(3); m.eyeVertices = eyes.l.length + eyes.r.length;
  /* girth: mean distance from the ilium-neck axis of the torso vertices in the middle third of it */
  const A = new THREE.Vector3(...pivots.bodyAxisFrom), Bp = new THREE.Vector3(...pivots.bodyAxisTo), ax = Bp.clone().sub(A), len = ax.length(); ax.normalize();
  let s = 0, c = 0; for (const i of bodyIdx) { const d = V(i).sub(A), a = d.dot(ax); if (a < len * 0.2 || a > len * 0.75) continue; s += d.addScaledVector(ax, -a).length(); c++; } m.bodyGirth = +(s / c).toFixed(3);
  /* the tail: the new rows */
  if (n > N0) { const tb = new THREE.Box3(); for (let i = N0; i < n; i++) tb.expandByPoint(V(i)); const sz = tb.getSize(new THREE.Vector3());
    m.tail = { spanX: +sz.x.toFixed(2), dropY: +sz.y.toFixed(2), lengthZ: +sz.z.toFixed(2), rearmostZ: +tb.min.z.toFixed(2) }; }
  return m; }

const ref = await load(SRC), A = await load(path.join(DIR, 'kea_animated_A.glb'));
const build = JSON.parse(fs.readFileSync(path.join(DIR, 'build_report.json'), 'utf8'));
const prim = ref.raw.json.meshes[0].primitives[0], acc = k => ref.raw.json.accessors[k].bufferView;
const VERTV = [acc(prim.attributes.POSITION), acc(prim.attributes.NORMAL), acc(prim.attributes.TEXCOORD_0), acc(prim.attributes.JOINTS_0), acc(prim.attributes.WEIGHTS_0), acc(prim.indices), acc(prim.targets[0].POSITION), acc(prim.targets[0].NORMAL)];
const PNV = [acc(prim.attributes.POSITION), acc(prim.attributes.NORMAL)];
const N0 = ref.raw.json.accessors[prim.attributes.POSITION].count;
const CLIPS = ref.g.animations.map(a => a.name).filter(n => n !== 'Animation_01');
const results = {};
for (const name of ['A', 'B', 'C']) {
  const L = name === 'A' ? A : await load(path.join(DIR, `kea_animated_${name}.glb`)), R = { file: `kea_animated_${name}.glb`, sha256: sha(L.raw.buf), bytes: L.raw.buf.length };
  const pa = L.raw.json.meshes[0].primitives[0];
  if (name === 'A') {
    R.against = 'approved kea_animated.glb'; R.gate = byteGate(ref.raw, L.raw, VERTV, [pa.attributes.POSITION, pa.attributes.NORMAL, pa.attributes.TEXCOORD_0, pa.attributes.JOINTS_0, pa.attributes.WEIGHTS_0, pa.indices, pa.targets[0].POSITION, pa.targets[0].NORMAL].map(a => [a, ['count', 'min', 'max']]));
    /* original rows byte-identical in every vertex stream */
    const rows = {}; for (const [nm, bv, stride] of [['POSITION', VERTV[0], 12], ['NORMAL', VERTV[1], 12], ['TEXCOORD_0', VERTV[2], 8], ['JOINTS_0', VERTV[3], 4], ['WEIGHTS_0', VERTV[4], 16], ['morph POSITION', VERTV[6], 12], ['morph NORMAL', VERTV[7], 12]])
      rows[nm] = view(ref.raw, bv).equals(view(L.raw, bv).slice(0, N0 * stride));
    R.originalRowsByteIdentical = rows;
    const J = new Uint8Array(view(L.raw, VERTV[3])), W = new Float32Array(view(L.raw, VERTV[4]).buffer.slice(view(L.raw, VERTV[4]).byteOffset, view(L.raw, VERTV[4]).byteOffset + view(L.raw, VERTV[4]).length));
    const MP = new Float32Array(view(L.raw, VERTV[6]).buffer.slice(view(L.raw, VERTV[6]).byteOffset, view(L.raw, VERTV[6]).byteOffset + view(L.raw, VERTV[6]).length));
    const names = ref.raw.json.skins[0].joints.map(n => ref.raw.json.nodes[n].name); let badJ = 0, badW = 0, badM = 0;
    for (let i = N0; i < W.length / 4; i++) { let s = 0; for (let k = 0; k < 4; k++) { s += W[i*4+k]; if (W[i*4+k] > 0 && !/Tail_bone|TailEnd_bone/.test(names[J[i*4+k]])) badJ++; } if (Math.abs(s - 1) > 1e-5) badW++;
      for (let k = 0; k < 3; k++) if (MP[i*3+k] !== 0) badM++; }
    R.newRows = { count: W.length / 4 - N0, weightedOnlyToTailBones: badJ === 0, weightsSumToOne: badW === 0, morphDeltasZero: badM === 0 };
    const I0 = new Uint16Array(view(ref.raw, VERTV[5]).buffer.slice(view(ref.raw, VERTV[5]).byteOffset, view(ref.raw, VERTV[5]).byteOffset + view(ref.raw, VERTV[5]).length));
    const I1 = new Uint16Array(view(L.raw, VERTV[5]).buffer.slice(view(L.raw, VERTV[5]).byteOffset, view(L.raw, VERTV[5]).byteOffset + view(L.raw, VERTV[5]).length));
    const kept = []; { const t1 = new Set(); for (let t = 0; t < I1.length / 3; t++) t1.add(I1[t*3] + ',' + I1[t*3+1] + ',' + I1[t*3+2]); for (let t = 0; t < I0.length / 3; t++) if (t1.has(I0[t*3] + ',' + I0[t*3+1] + ',' + I0[t*3+2])) kept.push(t); }
    R.triangles = { approved: I0.length / 3, kept: kept.length, dropped: I0.length / 3 - kept.length, added: I1.length / 3 - kept.length, total: I1.length / 3,
      keptInOriginalOrder: I1.slice(0, kept.length * 3).every((v, k) => v === I0[kept[Math.floor(k / 3)] * 3 + (k % 3)]) };
  } else {
    R.against = 'kea_animated_A.glb'; R.gate = byteGate(A.raw, L.raw, PNV, [[pa.attributes.POSITION, ['min', 'max']], [pa.attributes.NORMAL, ['min', 'max']]]);
    const P0 = view(A.raw, PNV[0]), P1 = view(L.raw, PNV[0]); let ch = 0; for (let i = 0; i < P0.length / 12; i++) if (!P0.slice(i*12, i*12+12).equals(P1.slice(i*12, i*12+12))) ch++;
    R.changedVertices = ch; R.params = build.variants[name].params;
  }
  R.joints = L.raw.json.skins[0].joints.length; R.clips = L.raw.json.animations.length; R.morphTargets = pa.targets.length;
  /* sanity */
  const pb = view(L.raw, VERTV[0]), nb = view(L.raw, VERTV[1]), Pf = new Float32Array(pb.buffer.slice(pb.byteOffset, pb.byteOffset + pb.length)), Nf = new Float32Array(nb.buffer.slice(nb.byteOffset, nb.byteOffset + nb.length));
  let nan = 0, nonunit = 0; for (let i = 0; i < Pf.length; i++) if (!Number.isFinite(Pf[i]) || !Number.isFinite(Nf[i])) nan++;
  for (let i = 0; i < Nf.length; i += 3) if (Math.abs(Math.hypot(Nf[i], Nf[i+1], Nf[i+2]) - 1) > 1e-3) nonunit++; R.sanity = { nan, nonUnitNormals: nonunit };
  /* measured, rest pose */
  const rest = posed(L, 'approved_idle', 0); R.measured = measure(L, rest, N0, build.pivots);
  /* the tail's clipping: tail triangles against every other kept triangle, through every clip */
  const Ib = view(L.raw, VERTV[5]), I = new Uint16Array(Ib.buffer.slice(Ib.byteOffset, Ib.byteOffset + Ib.length)), tails = [], body = [];
  for (let t = 0; t < I.length / 3; t++) { const tri = [I[t*3], I[t*3+1], I[t*3+2]]; (tri.every(v => v >= N0) ? tails : body).push(tri); }
  R.tailClipping = {};
  for (const clip of CLIPS) { const d = L.g.animations.find(a => a.name === clip).duration; let worst = 0;
    for (const f of [0, 0.25, 0.5, 0.75]) worst = Math.max(worst, crossings(posed(L, clip, d * f), tails, body)); R.tailClipping[clip] = worst; }
  results[name] = R; fs.writeFileSync(path.join(DIR, `VALIDATION_${name}.json`), JSON.stringify(R, null, 1) + '\n');
}
/* ratios against A, which is what Eric asked for */
const mA = results.A.measured;
for (const k of ['B', 'C']) { const m = results[k].measured; results[k].ratiosToA = Object.fromEntries(['headSize', 'eyeSpan', 'billLength', 'billDepth', 'bodyGirth'].map(q => [q, +(m[q] / mA[q]).toFixed(3)]));
  fs.writeFileSync(path.join(DIR, `VALIDATION_${k}.json`), JSON.stringify(results[k], null, 1) + '\n'); }
for (const [k, R] of Object.entries(results)) {
  console.log(`== ${k}  ${R.file}  ${(R.bytes / 1e6).toFixed(2)} MB  against ${R.against}`);
  console.log(`   views differing ${JSON.stringify(R.gate.viewsDiffering)} (allowed only: ${R.gate.onlyAllowedViewsDiffer})  JSON identical outside allowed: ${R.gate.jsonIdenticalOutsideAllowed}  images identical: ${R.gate.imagesIdentical}`);
  if (R.originalRowsByteIdentical) console.log(`   original rows identical ${JSON.stringify(R.originalRowsByteIdentical)}\n   new rows ${JSON.stringify(R.newRows)}\n   triangles ${JSON.stringify(R.triangles)}`);
  if (R.changedVertices != null) console.log(`   changed vertices ${R.changedVertices}   ratios to A ${JSON.stringify(R.ratiosToA)}`);
  console.log(`   joints ${R.joints} clips ${R.clips} morphs ${R.morphTargets}  sanity ${JSON.stringify(R.sanity)}  measured ${JSON.stringify(R.measured)}`);
  console.log(`   tail clipping (worst of 4 times, triangles) ${JSON.stringify(R.tailClipping)}`); }
