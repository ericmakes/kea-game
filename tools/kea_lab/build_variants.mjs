/* BUILD THE KEA VARIANTS — the approved kea with a rebuilt tail (A), and two appeal strips (B, C).
   Eric, 2026-10-03: "TAIL REBUILD, properly this time ... a short FAN of 10-12 broad overlapping vanes
   ... weighted to the existing tail bones so the clips still drive it" and "THREE variants of the body
   proportions as vertex-only edits (POSITION/NORMAL only ...)".

   INPUT (read only): assets/models/astra_incoming/approved/kea_animated.glb — Eric's approved character.
   OUTPUT: <out>/kea_animated_{A,B,C}.glb and <out>/build_report.json.

   ONE FRAME FOR EVERY EDIT: THE REST POSE. Every change is AUTHORED in the posed rest — approved_idle at
   t=0, the clip the game rests on — where "the head is 12% bigger" and "the tail droops 12 degrees" mean
   what they say. Each vertex is then carried back to bind space through ITS OWN blended skin matrix
   (M = meshWorld . bindMatrixInverse . sum(w_i . boneWorld_i . boneInverse_i) . bindMatrix), and its
   normal through M's transpose, so in the rest pose the result is exactly what was authored, and in every
   other pose a rigid region moves as it always did. The inversion is checked against three's own
   SkinnedMesh.getVertexPosition for every original vertex before anything is built on it.

   THE TAIL (A). The approved tail is three thin straps, three tip caps and two narrow vanes, all rigid on
   TailEnd (TODO 90 found the long-feather rods; Astra's Task 2 left straps). Those triangles leave the
   INDEX buffer; the rump coverts (the 102-triangle piece above them) and the seam stay. Twelve vanes are
   APPENDED as new vertex rows: every original row of POSITION, NORMAL, TEXCOORD_0, JOINTS_0, WEIGHTS_0
   and both morph streams is byte-identical, and the orphaned strap rows stay in place, unreferenced, so
   no index anywhere in the file moves. New rows weight TailEnd 1.0 (0.9/0.1 with Tail at the root), as
   the existing tail does; their morph deltas are zero. UVs land on paint already in the atlas — the
   tail's green feather fan for the upper surface, the brown under-tail field below, and a solid 48 px
   patch of the tail's own green-black (23,28,24) for the terminal band — so the images stay byte-identical.

   THE APPEAL STRIP (B, C). Vertex-only on A: only the POSITION and NORMAL payloads differ (and those two
   accessors' min/max, which glTF requires to be true). Masks come from the skin weights themselves —
   the head is the weight on Head and the three bill bones, so the neck blends exactly as it bends; the
   bill is the weight on the three bill bones; the body is the weight on ilium, scapula, the wing chain and
   the thighs, faded out toward the rump so the coverts and the new tail (TailEnd) do not move: the tail
   is the same on all three.
     B  head (and eye) x1.12 about the Head joint; bill 0.90 as long and 1.10 as deep as the approved bill
        (absolute — it is measured against A); body 8% plumper (radial about the ilium-neck axis)
     C  head (and eye) x1.20; bill 0.85 as long, its depth following the head; body 15% plumper
   THE EYE scales with the head it sits in — "+12% head and eye" read as both 12% larger in absolute size.

   Usage: node tools/kea_lab/build_variants.mjs [outdir]      (default: kea_variants_local/, gitignored) */
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
import * as THREE from 'three';
globalThis.createImageBitmap = async () => ({ width: 4, height: 4, close() {} });
globalThis.self = { URL: { createObjectURL: () => 'blob:stub', revokeObjectURL() {} } };
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const SRC = path.join(ROOT, 'assets/models/astra_incoming/approved/kea_animated.glb');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'kea_variants_local'));
fs.mkdirSync(OUT, { recursive: true });
const md5 = b => crypto.createHash('md5').update(b).digest('hex');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

/* ---------------- the raw GLB ---------------- */
function readGLB(buf) {
  if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('not a GLB');
  const jl = buf.readUInt32LE(12); const json = JSON.parse(buf.slice(20, 20 + jl).toString('utf8'));
  const bo = 20 + jl; const bl = buf.readUInt32LE(bo); const bin = buf.slice(bo + 8, bo + 8 + bl);
  return { json, bin, jsonBytes: buf.slice(20, 20 + jl) };
}
const viewBytes = (g, bv) => { const V = g.json.bufferViews[bv]; return g.bin.slice(V.byteOffset || 0, (V.byteOffset || 0) + V.byteLength); };
/* writeGLB(json, payloads): bufferViews laid back out IN ORDER, each from payloads[i] if given, else its original bytes */
function writeGLB(src, json, payloads) {
  const parts = []; let off = 0;
  json.bufferViews.forEach((V, i) => { const b = payloads[i] || viewBytes(src, i); const pad = (4 - (off % 4)) % 4;
    if (pad) { parts.push(Buffer.alloc(pad)); off += pad; } V.byteOffset = off; V.byteLength = b.length; parts.push(b); off += b.length; });
  const binPad = (4 - (off % 4)) % 4; if (binPad) parts.push(Buffer.alloc(binPad)); const bin = Buffer.concat(parts);
  json.buffers[0].byteLength = bin.length;
  let js = Buffer.from(JSON.stringify(json), 'utf8'); const jp = (4 - (js.length % 4)) % 4; if (jp) js = Buffer.concat([js, Buffer.alloc(jp, 0x20)]);
  const h = Buffer.alloc(12); h.writeUInt32LE(0x46546C67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4E4F534A, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004E4942, 4);
  return Buffer.concat([h, jh, js, bh, bin]);
}
const f32 = b => new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
const u16 = b => new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
const u8 = b => new Uint8Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
const minmax = (a, k) => { const lo = new Array(k).fill(Infinity), hi = new Array(k).fill(-Infinity);
  for (let i = 0; i < a.length; i += k) for (let c = 0; c < k; c++) { lo[c] = Math.min(lo[c], a[i + c]); hi[c] = Math.max(hi[c], a[i + c]); } return { min: lo, max: hi }; };

const srcBuf = fs.readFileSync(SRC), G0 = readGLB(srcBuf), J0 = G0.json;
const prim = J0.meshes[0].primitives[0], AT = prim.attributes, TG = prim.targets[0];
const AV = k => J0.accessors[k].bufferView;
const BV = { pos: AV(AT.POSITION), nrm: AV(AT.NORMAL), uv: AV(AT.TEXCOORD_0), jnt: AV(AT.JOINTS_0), wgt: AV(AT.WEIGHTS_0), idx: AV(prim.indices), mpos: AV(TG.POSITION), mnrm: AV(TG.NORMAL) };
const N0 = J0.accessors[AT.POSITION].count;
const P0 = f32(viewBytes(G0, BV.pos)), Nn0 = f32(viewBytes(G0, BV.nrm)), UV0 = f32(viewBytes(G0, BV.uv)), JN0 = u8(viewBytes(G0, BV.jnt)), W0 = f32(viewBytes(G0, BV.wgt)), I0 = u16(viewBytes(G0, BV.idx));
const jointNames = J0.skins[0].joints.map(n => J0.nodes[n].name);
const JI = n => { const i = jointNames.findIndex(s => s.includes(n)); if (i < 0) throw new Error('no joint ' + n); return i; };

/* ---------------- the rest pose, through three ---------------- */
const gltf = await new Promise((res, rej) => new GLTFLoader().parse(srcBuf.buffer.slice(srcBuf.byteOffset, srcBuf.byteOffset + srcBuf.byteLength), '', res, rej));
let SK = null; gltf.scene.traverse(o => { if (o.isSkinnedMesh) SK = o; });
const mixer = new THREE.AnimationMixer(gltf.scene); mixer.clipAction(gltf.animations.find(a => a.name === 'approved_idle')).play(); mixer.setTime(0);
gltf.scene.updateMatrixWorld(true); SK.skeleton.update();
/* three's skeleton is in skin-joint order — the same order JOINTS_0 indexes */
if (SK.skeleton.bones.length !== jointNames.length) throw new Error('skeleton/joint count mismatch');
const boneM = SK.skeleton.bones.map((b, i) => new THREE.Matrix4().multiplyMatrices(b.matrixWorld, SK.skeleton.boneInverses[i]));
const pre = new THREE.Matrix4().multiplyMatrices(SK.matrixWorld, SK.bindMatrixInverse), post = SK.bindMatrix;
function skinMatrix(js, ws) { const S = new THREE.Matrix4().set(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0);
  for (let k = 0; k < 4; k++) if (ws[k]) { const e = boneM[js[k]].elements; for (let q = 0; q < 16; q++) S.elements[q] += ws[k] * e[q]; }
  return new THREE.Matrix4().multiplyMatrices(pre, S).multiply(post); }
const Mv = [], Mi = [];
for (let i = 0; i < N0; i++) { const M = skinMatrix([JN0[i*4], JN0[i*4+1], JN0[i*4+2], JN0[i*4+3]], [W0[i*4], W0[i*4+1], W0[i*4+2], W0[i*4+3]]); Mv.push(M); Mi.push(M.clone().invert()); }
/* PROOF the matrix is three's skinning: every original vertex, posed both ways */
{ let err = 0; const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < N0; i++) { SK.getVertexPosition(i, a); a.applyMatrix4(SK.matrixWorld); b.set(P0[i*3], P0[i*3+1], P0[i*3+2]).applyMatrix4(Mv[i]); err = Math.max(err, a.distanceTo(b)); }
  if (err > 1e-3) throw new Error('skin matrix disagrees with three by ' + err); console.log('skinning check: max |three - ours| =', err.toExponential(2)); }
const posedOf = (Pb, i, M) => new THREE.Vector3(Pb[i*3], Pb[i*3+1], Pb[i*3+2]).applyMatrix4(M);
const P0w = []; for (let i = 0; i < N0; i++) P0w.push(posedOf(P0, i, Mv[i]));
const jointPos = n => SK.skeleton.bones[JI(n)].getWorldPosition(new THREE.Vector3());

/* ================= A: THE TAIL ================= */
const iTail = JI('Tail_bone_0106'), iTailEnd = JI('TailEnd_bone_0107');
const dom = i => { let b = 0; for (let k = 1; k < 4; k++) if (W0[i*4+k] > W0[i*4+b]) b = k; return JN0[i*4+b]; };
const isTail = new Uint8Array(N0).map((_, i) => /Tail/.test(jointNames[dom(i)]) ? 1 : 0);
/* the old tail's pieces: connected components of all-tail triangles. The rump coverts reach y 19.8 in the
   rest pose; every strap, cap and vane is below y 13 — that is the line between them */
const par = new Int32Array(N0).map((_, i) => i), fnd = x => par[x] === x ? x : (par[x] = fnd(par[x]));
const T0 = I0.length / 3, allTail = [];
for (let t = 0; t < T0; t++) { const a = I0[t*3], b = I0[t*3+1], c = I0[t*3+2]; if (isTail[a] && isTail[b] && isTail[c]) { allTail.push(t); par[fnd(a)] = fnd(b); par[fnd(b)] = fnd(c); } }
const compMaxY = {}; for (const t of allTail) for (let k = 0; k < 3; k++) { const v = I0[t*3+k], r = fnd(v); compMaxY[r] = Math.max(compMaxY[r] ?? -1e9, P0w[v].y); }
const drop = new Set(allTail.filter(t => compMaxY[fnd(I0[t*3])] < 13.5));
const kept = allTail.length - drop.size;

/* the fan, authored in the rest pose. The bird faces +z (measured: Head minus TailEnd), y up. */
const FAN = { n: 12, origin: [-0.2, 9.0, -23.5], length: 15.0, graduate: 0.05, droop0: 8, droop1: 11, spreadDeg: 2.5, firstDeg: 1.2,
  baseW: 0.9, tipW: 2.8, thick0: 0.50, thick1: 0.10, stack: 0.26, rollDeg: 1.6, band: 0.88,
  notch: 0.10, notchLen: 0.05, uvTop: [0.040, 0.0125, 0.010, 0.205, 0.075], uvBot: [0.300, 0.008, 0.010, 0.215, 0.085], uvBand: [0.0290, 0.0550, 0.0360, 0.0620] };
const tailV = { pos: [], nrm: [], uv: [], jnt: [], wgt: [] }, tailT = [];
const add = (p, n, u, rootish) => { tailV.pos.push(p); tailV.nrm.push(n); tailV.uv.push(u);
  tailV.jnt.push(rootish ? [iTailEnd, iTail, 0, 0] : [iTailEnd, 0, 0, 0]); tailV.wgt.push(rootish ? [0.9, 0.1, 0, 0] : [1, 0, 0, 0]); return N0 + tailV.pos.length - 1; };
const deg = Math.PI / 180, UP = new THREE.Vector3(0, 1, 0);
for (let i = 0; i < FAN.n; i++) {
  const half = FAN.n / 2, s = i < half ? -1 : 1, r = i < half ? half - 1 - i : i - half;      // r 0 = central pair
  const yaw = s * (FAN.firstDeg + FAN.spreadDeg * r) * deg, roll = s * r * FAN.rollDeg * deg;
  const O = new THREE.Vector3(...FAN.origin).add(new THREE.Vector3(Math.sin(yaw) * 0.8, -r * FAN.stack, 0));
  /* rows along the vane; extra rows at each soft notch so the step is a step, and a doubled row at the band */
  const notches = [0.40, 0.61, 0.80].map((t, k) => ({ t: t + ((i * 0.037 + k * 0.05) % 0.05), side: ((i + k) % 2) ? 1 : -1 }));
  let ts = [0, 0.08, 0.16, 0.25, 0.33, 0.5, 0.7, FAN.band, 0.94, 1.0];
  for (const nt of notches) ts.push(nt.t - FAN.notchLen - 0.01, nt.t - FAN.notchLen, nt.t - 0.008, nt.t);
  ts = [...new Set(ts.map(t => +t.toFixed(4)))].sort((a, b) => a - b);
  /* centreline by integrating the drooping direction */
  const dirAt = t => { const dr = (FAN.droop0 + (FAN.droop1 - FAN.droop0) * t) * deg;
    return new THREE.Vector3(Math.sin(yaw) * Math.cos(dr), -Math.sin(dr), -Math.cos(yaw) * Math.cos(dr)).normalize(); };
  /* GRADUATED: the central pair longest, each rank outward a little shorter, so the closed fan ends in a
     stepped outline of squared tips rather than one straight edge */
  const L = FAN.length * (1 - FAN.graduate * r);
  const C = []; { let p = O.clone(), tp = 0; for (const t of ts) { const steps = 8; for (let q = 0; q < steps; q++) p.addScaledVector(dirAt(tp + (t - tp) * (q + 0.5) / steps), L * (t - tp) / steps); C.push(p.clone()); tp = t; } }
  const rows = ts.map((t, k) => { const d = dirAt(t), lat0 = new THREE.Vector3().crossVectors(UP, d).normalize(); // +lat points to the bird's left of the vane
    const lat = lat0.clone().applyAxisAngle(d, roll), nrm = new THREE.Vector3().crossVectors(d, lat).normalize();      // nrm ~ up
    let hw = (FAN.baseW + (FAN.tipW - FAN.baseW) * Math.pow(t, 0.8)) / 2, hwL = hw, hwR = hw;
    for (const nt of notches) { const inN = t > nt.t - FAN.notchLen - 1e-6 && t < nt.t - 1e-6 ? 1 : 0; if (inN) { if (nt.side > 0) hwL -= FAN.notch; else hwR -= FAN.notch; } }
    if (t > 0.985) { hwL -= 0.10; hwR -= 0.10; }     // the squared tip's corners, barely softened
    const th = FAN.thick0 * Math.pow(1 - t, 1.5) + FAN.thick1;
    return { t, c: C[k], d, lat, nrm, hwL, hwR, th }; });
  /* the surfaces: top (L, ridge, R), bottom (L, mid, R), two side walls, the squared tip */
  const uvT = (t, x, band) => band ? [FAN.uvBand[0] + (x + 1) / 2 * (FAN.uvBand[2] - FAN.uvBand[0]), FAN.uvBand[1] + Math.min(1, (t - FAN.band) / (1 - FAN.band)) * (FAN.uvBand[3] - FAN.uvBand[1])]
    : [FAN.uvTop[0] + FAN.uvTop[1] * i + x * FAN.uvTop[2], FAN.uvTop[3] + (FAN.uvTop[4] - FAN.uvTop[3]) * (t / FAN.band)];
  const uvB = (t, x, band) => band ? uvT(t, x, true) : [FAN.uvBot[0] + FAN.uvBot[1] * (i - 5.5) + x * FAN.uvBot[2], FAN.uvBot[3] + (FAN.uvBot[4] - FAN.uvBot[3]) * (t / FAN.band)];
  const grid = { top: [], bot: [], wl: [], wr: [] };
  rows.forEach((R, k) => {
    const band = R.t >= FAN.band - 1e-6, bandDup = Math.abs(R.t - FAN.band) < 1e-6, root = R.t < 0.12;
    const mk = (bandFlag) => {
      const pL = R.c.clone().addScaledVector(R.lat, R.hwL), pR = R.c.clone().addScaledVector(R.lat, -R.hwR);
      const tL = pL.clone().addScaledVector(R.nrm, R.th / 2), tR = pR.clone().addScaledVector(R.nrm, R.th / 2), tC = R.c.clone().addScaledVector(R.nrm, R.th / 2 + R.th * 0.25);
      const bL = pL.clone().addScaledVector(R.nrm, -R.th / 2), bR = pR.clone().addScaledVector(R.nrm, -R.th / 2), bC = R.c.clone().addScaledVector(R.nrm, -R.th / 2);
      return { tL, tC, tR, bL, bC, bR, band: bandFlag };
    };
    const sets = bandDup ? [mk(false), mk(true)] : [mk(band)];
    for (const S of sets) {
      const b = S.band;
      grid.top.push([add(S.tL, null, uvT(R.t, 1, b), root), add(S.tC, null, uvT(R.t, 0, b), root), add(S.tR, null, uvT(R.t, -1, b), root), b, R.t]);
      grid.bot.push([add(S.bL, null, uvB(R.t, 1, b), root), add(S.bC, null, uvB(R.t, 0, b), root), add(S.bR, null, uvB(R.t, -1, b), root), b, R.t]);
      grid.wl.push([add(S.tL, R.lat.clone(), uvT(R.t, 1, b), root), add(S.bL, R.lat.clone(), uvB(R.t, 1, b), root), b, R.t]);
      grid.wr.push([add(S.tR, R.lat.clone().negate(), uvT(R.t, -1, b), root), add(S.bR, R.lat.clone().negate(), uvB(R.t, -1, b), root), b, R.t]);
    } });
  /* quads between consecutive rows of the same band flag */
  /* winding: [A,B,B+1] crosses to -nrm (down), which is right for the bottom sheet; the top sheet is reversed */
  const strip = (g, w, flip) => { for (let k = 0; k + 1 < g.length; k++) { const A = g[k], B = g[k + 1]; if (A[w] !== B[w]) continue;
      for (let q = 0; q + 1 < w; q++) { if (flip) tailT.push([A[q], B[q + 1], B[q]], [A[q], A[q + 1], B[q + 1]]); else tailT.push([A[q], B[q], B[q + 1]], [A[q], B[q + 1], A[q + 1]]); } } };
  strip(grid.top, 3, true); strip(grid.bot, 3, false); strip(grid.wl, 2, false); strip(grid.wr, 2, true);
  /* the squared tip: a quad across the end, the band's colour */
  { const R = rows[rows.length - 1], tt = grid.top[grid.top.length - 1], bb = grid.bot[grid.bot.length - 1];
    const e = [add(tailV.pos[tt[0] - N0].clone(), R.d.clone(), uvT(1, 1, true)), add(tailV.pos[tt[2] - N0].clone(), R.d.clone(), uvT(1, -1, true)),
               add(tailV.pos[bb[2] - N0].clone(), R.d.clone(), uvT(1, -1, true)), add(tailV.pos[bb[0] - N0].clone(), R.d.clone(), uvT(1, 1, true))];
    tailT.push([e[0], e[1], e[2]], [e[0], e[2], e[3]]); }
}
/* smooth normals for the top and bottom sheets from their own triangles (walls and tip carry theirs) */
{ const acc = tailV.pos.map(() => new THREE.Vector3());
  for (const [a, b, c] of tailT) { const A = tailV.pos[a - N0], B = tailV.pos[b - N0], Cc = tailV.pos[c - N0];
    const n = new THREE.Vector3().crossVectors(B.clone().sub(A), Cc.clone().sub(A)); for (const v of [a, b, c]) acc[v - N0].add(n); }
  tailV.nrm = tailV.nrm.map((n, k) => n ? n.normalize() : acc[k].normalize()); }
/* orient: a top-sheet normal must point UP-ish, a bottom-sheet normal DOWN-ish; flip the sheet's winding if not */
// (the material is double-sided; the normals are what the light reads, and they were built per sheet above)
const NT = tailV.pos.length;
console.log(`tail: dropped ${drop.size} of ${allTail.length} old tail triangles (kept ${kept}: the rump coverts), built ${FAN.n} vanes = ${NT} vertices, ${tailT.length} triangles`);

/* assemble A's streams */
const NA = N0 + NT;
const PA = new Float32Array(NA * 3), NAr = new Float32Array(NA * 3), UVA = new Float32Array(NA * 2), JNA = new Uint8Array(NA * 4), WA = new Float32Array(NA * 4);
PA.set(P0); NAr.set(Nn0); UVA.set(UV0); JNA.set(JN0); WA.set(W0);
for (let k = 0; k < NT; k++) { const i = N0 + k; const M = skinMatrix(tailV.jnt[k], tailV.wgt[k]), Minv = M.clone().invert();
  const pb = tailV.pos[k].clone().applyMatrix4(Minv); PA.set([pb.x, pb.y, pb.z], i * 3);
  const nb = tailV.nrm[k].clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(M).transpose()).normalize(); NAr.set([nb.x, nb.y, nb.z], i * 3);
  UVA.set(tailV.uv[k], i * 2); JNA.set(tailV.jnt[k], i * 4); WA.set(tailV.wgt[k], i * 4); Mv.push(M); Mi.push(Minv); }
const IA = []; for (let t = 0; t < T0; t++) if (!drop.has(t)) IA.push(I0[t*3], I0[t*3+1], I0[t*3+2]);
for (const tri of tailT) IA.push(...tri);
const IA16 = new Uint16Array(IA);
const mpos0 = f32(viewBytes(G0, BV.mpos)), mnrm0 = f32(viewBytes(G0, BV.mnrm));
const MPA = new Float32Array(NA * 3), MNA = new Float32Array(NA * 3); MPA.set(mpos0); MNA.set(mnrm0);

function buildGLB(base, streams) {
  const json = JSON.parse(JSON.stringify(base.json)), pr = json.meshes[0].primitives[0], tg = pr.targets[0], pay = {};
  const put = (acc, bv, arr, k, mm) => { const A = json.accessors[acc]; A.count = arr.length / k; pay[bv] = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    if (mm) { const m = minmax(arr, k); A.min = m.min; A.max = m.max; } };
  if (streams.pos) put(pr.attributes.POSITION, BV.pos, streams.pos, 3, true);
  if (streams.nrm) put(pr.attributes.NORMAL, BV.nrm, streams.nrm, 3, 'min' in base.json.accessors[pr.attributes.NORMAL]);
  if (streams.uv) put(pr.attributes.TEXCOORD_0, BV.uv, streams.uv, 2, 'min' in base.json.accessors[pr.attributes.TEXCOORD_0]);
  if (streams.jnt) put(pr.attributes.JOINTS_0, BV.jnt, streams.jnt, 4, false);
  if (streams.wgt) put(pr.attributes.WEIGHTS_0, BV.wgt, streams.wgt, 4, false);
  if (streams.idx) put(pr.indices, BV.idx, streams.idx, 1, 'min' in base.json.accessors[pr.indices]);
  if (streams.mpos) put(tg.POSITION, BV.mpos, streams.mpos, 3, true);
  if (streams.mnrm) put(tg.NORMAL, BV.mnrm, streams.mnrm, 3, 'min' in base.json.accessors[tg.NORMAL]);
  return writeGLB(base, json, pay);
}
const bufA = buildGLB(G0, { pos: PA, nrm: NAr, uv: UVA, jnt: JNA, wgt: WA, idx: IA16, mpos: MPA, mnrm: MNA });
fs.writeFileSync(path.join(OUT, 'kea_animated_A.glb'), bufA);

/* ================= B, C: THE APPEAL STRIP ================= */
const GA = readGLB(bufA);
const W = i => [JNA[i*4], JNA[i*4+1], JNA[i*4+2], JNA[i*4+3]].map((j, k) => [j, WA[i*4+k]]);
const maskOf = (i, set) => W(i).reduce((s, [j, w]) => s + (set.has(j) ? w : 0), 0);
const HEAD = new Set([JI('Head_bone_06'), JI('LowerMandible'), JI('UpperMandible'), JI('Bone047')]);
const BILL = new Set([JI('LowerMandible'), JI('UpperMandible'), JI('Bone047')]);
const BODY = new Set(['Ilium_bone_02', 'Scapula_bone_03', 'Humerus_l', 'Ulna_l', 'Metacarpus_l', 'Humerus_r', 'Ulna_r', 'Metacarpus_r', 'Femur_l', 'Femur_R'].map(JI));
const headPivot = jointPos('Head_bone_06'), billPivot = jointPos('UpperMandible');
/* the bill's own axis: from its pivot to its farthest vertex in the rest pose; depth is world-up off that axis */
let billTip = billPivot.clone(); for (let i = 0; i < N0; i++) if (maskOf(i, BILL) > 0.5 && P0w[i].distanceTo(billPivot) > billTip.distanceTo(billPivot)) billTip = P0w[i].clone();
const bAx = billTip.clone().sub(billPivot).normalize(), bDp = UP.clone().addScaledVector(bAx, -UP.dot(bAx)).normalize();
/* the head's forward axis (horizontal, pivot toward the bill tip), the ramp across the cere, the bill's mid-height */
const fwdH = billTip.clone().sub(headPivot).setY(0).normalize();
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* the bill's rear edge (least forward bill vertex), its length from there, and its mid-height above that point */
let sMin = Infinity, sMax = -Infinity; for (let i = 0; i < N0; i++) if (maskOf(i, BILL) > 0.5) { const s = P0w[i].clone().sub(billPivot).dot(fwdH); sMin = Math.min(sMin, s); sMax = Math.max(sMax, s); }
const billRear = billPivot.clone().addScaledVector(fwdH, sMin), billLenS = sMax - sMin;
let hs = []; for (let i = 0; i < N0; i++) if (maskOf(i, BILL) > 0.5) hs.push(P0w[i].clone().sub(billRear).dot(UP));
const billMidH = hs.reduce((a, b) => a + b, 0) / hs.length;
const bodyA = jointPos('Ilium_bone_02'), bodyB = jointPos('Neck_bone_04'), bodyAx = bodyB.clone().sub(bodyA).normalize();
/* the rump fade, ALONG THE BODY AXIS: none from 2 units behind the ilium (the tail root sits ~6 behind it), full from
   4 in front. The first cut faded by world z, and on a bird standing this upright that took the whole lower
   torso out (girth 1.06 for 1.08). The coverts are TailEnd weight, outside the body mask already; this only keeps
   the body's own rump vertices from stepping away from them. */
const fadeAx = p => { const a = p.clone().sub(bodyA).dot(bodyAx); return smooth(-2, 4, a); };
function deformer(V) {
  return (p, i) => { const q = p.clone();
    /* body: radial about the ilium-neck axis, masked by weight and faded at the rump */
    const mb = maskOf(i, BODY) * fadeAx(p);
    if (mb > 0 && V.body !== 1) { const d = q.clone().sub(bodyA), along = bodyAx.clone().multiplyScalar(d.dot(bodyAx)), rad = d.sub(along); q.addScaledVector(rad, mb * (V.body - 1)); }
    /* head (and eye): uniform about the Head joint */
    const mh = maskOf(i, HEAD);
    if (mh > 0 && V.head !== 1) { q.sub(headPivot).multiplyScalar(1 + mh * (V.head - 1)).add(headPivot); }
    /* bill: the region is the mandible WEIGHTS (the eye is pure Head weight, so it is out exactly), the
       displacement a function of POSITION in one axis-aligned frame — the head's forward axis and up —
       measured from the bill's REAR edge. Two earlier cuts are why: a weight mask on a skewed axis about the
       UpperMandible joint (which sits above and behind the bill) opened the gape, and a purely spatial ramp
       could not tell the bill from the eye, which overlaps it along the forward axis (eye s -1.8..1.3, bill
       -3.7..7.2) and came out squashed. Here shortening grows from zero at the rear edge, so the gape-corner
       vertices — the only ones with partial bill weight — barely move; depth grows in over the bill's first
       half the same way; lips meeting at one place get one displacement. */
    const mB = maskOf(i, BILL);
    if (mB > 0 && (V.billLen !== 1 || V.billDepth !== 1)) {
      const rear = billRear.clone().sub(headPivot).multiplyScalar(V.head).add(headPivot), sc = V.head;
      const d = q.clone().sub(rear), sF = d.dot(fwdH), h = d.dot(UP) - billMidH * sc;
      q.addScaledVector(fwdH, mB * (V.billLen - 1) * Math.max(0, sF)).addScaledVector(UP, mB * (V.billDepth - 1) * h * smooth(0, 0.5 * billLenS * sc, sF)); }
    return q; };
}
/* THE BILL NUMBERS ARE ABSOLUTE, against A: "10% shorter" means the bill measures 0.90 of the approved
   bill, though the head it sits on grew 12%. C names only a length, so its depth follows its head. */
const VARIANTS = { B: { head: 1.12, billLen: 0.90 / 1.12, billDepth: 1.10 / 1.12, body: 1.08, asked: 'head and eye +12%, bill 10% shorter and deeper, body 8% plumper' },
                   C: { head: 1.20, billLen: 0.85 / 1.20, billDepth: 1.00, body: 1.15, asked: 'head and eye +20%, bill 15% shorter, body 15% plumper' } };
const report = { source: path.relative(ROOT, SRC), sourceSha256: sha(srcBuf), fan: FAN, tail: { dropped: drop.size, keptRump: kept, newVertices: NT, newTriangles: tailT.length }, variants: {} };
const PAw = []; for (let i = 0; i < NA; i++) PAw.push(posedOf(PA, i, Mv[i]));
for (const [name, V] of Object.entries(VARIANTS)) {
  const D = deformer(V), PV = new Float32Array(PA), NV = new Float32Array(NAr); let changed = [];
  for (let i = 0; i < NA; i++) {
    const p = PAw[i], q = D(p, i); if (q.distanceToSquared(p) < 1e-12) continue;
    const pb = q.clone().applyMatrix4(Mi[i]); PV.set([pb.x, pb.y, pb.z], i * 3);
    /* the normal through the deformation's Jacobian (finite differences, the masks held at this vertex) */
    const e = 1e-3, Jm = new THREE.Matrix3(), cols = [];
    for (const ax of [[e,0,0],[0,e,0],[0,0,e]]) cols.push(D(p.clone().add(new THREE.Vector3(...ax)), i).sub(q).divideScalar(e));
    Jm.set(cols[0].x, cols[1].x, cols[2].x, cols[0].y, cols[1].y, cols[2].y, cols[0].z, cols[1].z, cols[2].z);
    const M3 = new THREE.Matrix3().setFromMatrix4(Mv[i]);
    const nw = new THREE.Vector3(NAr[i*3], NAr[i*3+1], NAr[i*3+2]).applyMatrix3(M3.clone().invert().transpose()).normalize();
    const nw2 = nw.applyMatrix3(Jm.clone().invert().transpose()).normalize();
    const nb = nw2.applyMatrix3(M3.clone().transpose()).normalize(); NV.set([nb.x, nb.y, nb.z], i * 3);
    changed.push(i); }
  const buf = buildGLB(GA, { pos: PV, nrm: NV });
  fs.writeFileSync(path.join(OUT, `kea_animated_${name}.glb`), buf);
  report.variants[name] = { params: V, changedVertices: changed.length, tailVerticesChanged: changed.filter(i => i >= N0).length };
  console.log(`variant ${name}: ${changed.length} vertices moved (${report.variants[name].tailVerticesChanged} of them tail)`);
}
/* THE GAME COPIES: each variant with the shipped 2048 images spliced in (assets/models/kea/kea_animated_2048png.glb's
   two image payloads, which tools/derive_kea_textures.mjs made from these same approved images), so the game can
   load them as it loads the bird — the 4096 PNGs do not decode in the capture browser (BIRD_STATE section 7).
   Written under assets/ so the build serves them; gitignored, like the full files. */
const GAME = path.join(ROOT, 'assets/models/kea_variants'); fs.mkdirSync(GAME, { recursive: true });
{ const D = readGLB(fs.readFileSync(path.join(ROOT, 'assets/models/kea/kea_animated_2048png.glb')));
  if (D.json.images.length !== J0.images.length) throw new Error('the 2048 derivative has a different image list');
  for (const k of ['A', 'B', 'C']) { const V = readGLB(fs.readFileSync(path.join(OUT, `kea_animated_${k}.glb`))), json = JSON.parse(JSON.stringify(V.json)), pay = {};
    json.images.forEach((im, q) => { pay[im.bufferView] = viewBytes(D, D.json.images[q].bufferView); if (D.json.images[q].mimeType) im.mimeType = D.json.images[q].mimeType; });
    fs.writeFileSync(path.join(GAME, `kea_animated_${k}_2048png.glb`), writeGLB(V, json, pay)); } }
report.files = Object.fromEntries(['A', 'B', 'C'].map(k => { const b = fs.readFileSync(path.join(OUT, `kea_animated_${k}.glb`)); return [k, { bytes: b.length, md5: md5(b), sha256: sha(b) }]; }));
report.pivots = { head: headPivot.toArray(), bill: billPivot.toArray(), headForward: fwdH.toArray(), billRear: billRear.toArray(), billLength: billLenS, billMidHeight: billMidH, bodyAxisFrom: bodyA.toArray(), bodyAxisTo: bodyB.toArray() };
fs.writeFileSync(path.join(OUT, 'build_report.json'), JSON.stringify(report, null, 1) + '\n');
console.log('BUILD:', Object.entries(report.files).map(([k, f]) => `${k} ${(f.bytes / 1e6).toFixed(2)} MB ${f.md5}`).join('  '));
