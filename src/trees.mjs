/* THE SPIKE'S TREES — SPIKE_ADOPT row 3 (2026-10-03).

   The render spike Eric approved stood Poly Haven's island_tree_01 (CC0) where the game has its sphere
   canopies: leaf mesh pruned by island, 194 k triangles, real bark and leaf scans. tools/derive_tree.mjs
   writes it as a GLB the game's loader reads (meshopt decoded, quantization removed, WebP kept). This
   module stands one in for every tree mkTree registered (G.treeReg), HIDING the primitive — whose
   seeded rnd() draws hold the rest of the country in place — and keeping its collider.
   SIZED AS THE SPIKE SIZED THEM: the four the spike placed keep its heights and turns exactly
   (8.0 / 6.5 / 7.2 / 8.7 m); any other tree is 2.1 + 4.4 x its mkTree scale, the line through those.
   THE LEAVES ARE A MASK, not a blend (alpha test 0.5, depth written, both faces), as the spike drew
   them and for the bird's reason (src/alphamode.mjs): a blended canopy cannot sort its own leaves.
   A NEW WORLD IS RE-DRESSED: map travel builds a new G.treeReg, and a cheap per-frame check notices. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* LOD1 — THE SPIKE'S OWN PRUNING, ONE STEP FURTHER. Leaves are 171 k of the tree's 194 k triangles,
   and six trees cost ~2.4 ms of the frame in the main pass (frameablate: leaf overdraw through the alpha
   test, not shadows, which were 0.3 ms). Past LODFAR metres a tree wears a copy whose leaf ISLANDS are
   thinned to KEEP — seeded, so every run prunes the same leaves — each survivor scaled about its own
   centre by 1/sqrt(KEEP) so the canopy keeps its coverage. That is how the spike made the tree in the
   first place (16% kept, x2.5), so the far tree is the same tree pruned the same way.
   AND IT IS OFF (LODFAR null), MEASURED: it saved 0.4 ms (20.7 -> 20.3 at fixed 100%), because scaled-up
   survivors cover the same pixels — the cost is FILL through the alpha test, not triangles — and at
   40 m the pruned canopy read visibly thinner than the spike's. Kept for a later fill-side LOD. */
const LODFAR = null, KEEP = 0.35;
function pruneLeaves(geo, keep, seed) {
  const P = geo.attributes.position, I = geo.index ? geo.index.array : null, n = P.count;
  const par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
  const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  const nt = (I ? I.length : n) / 3, idx = k => I ? I[k] : k;
  for (let t = 0; t < nt; t++) { const a = find(idx(t * 3)), b = find(idx(t * 3 + 1)), c = find(idx(t * 3 + 2)); par[b] = a; par[find(c)] = a; }
  let st = seed >>> 0; const rnd = () => (st = (st * 16807) % 2147483647) / 2147483647;
  const keepRoot = new Map(), cent = new Map();
  for (let i = 0; i < n; i++) { const r = find(i); if (!cent.has(r)) cent.set(r, [0, 0, 0, 0]); const c = cent.get(r); c[0] += P.getX(i); c[1] += P.getY(i); c[2] += P.getZ(i); c[3]++; }
  for (const r of cent.keys()) keepRoot.set(r, rnd() < keep);
  const out = geo.clone(), OP = out.attributes.position, sc = 1 / Math.sqrt(keep);
  for (let i = 0; i < n; i++) { const r = find(i); if (!keepRoot.get(r)) continue; const c = cent.get(r), cx = c[0] / c[3], cy = c[1] / c[3], cz = c[2] / c[3];
    OP.setXYZ(i, cx + (P.getX(i) - cx) * sc, cy + (P.getY(i) - cy) * sc, cz + (P.getZ(i) - cz) * sc); }
  const keptIdx = []; for (let t = 0; t < nt; t++) if (keepRoot.get(find(idx(t * 3)))) keptIdx.push(idx(t * 3), idx(t * 3 + 1), idx(t * 3 + 2));
  out.setIndex(keptIdx); out.computeBoundingSphere();
  return { geo: out, islands: cent.size, tris: keptIdx.length / 3 };
}
const SPIKE = [[-38, 10, 8.0, 0.3], [-40, -28, 6.5, 1.9], [12, -38, 7.2, 4.0], [-14, 26, 8.7, 2.6]];
export const TREEURL = 'models/trees/island_tree_01_spike.glb';
export async function installTrees(K) {
  const G = K.G;
  const gltf = await new Promise((res, rej) => new GLTFLoader().load(TREEURL, res, undefined, rej));
  const req = (gltf.parser.json.extensionsRequired || []).filter(e => !['EXT_texture_webp', 'KHR_texture_transform'].includes(e));
  if (req.length) throw new Error('trees: ' + TREEURL + ' requires ' + req.join(', ') + ' — run tools/derive_tree.mjs');
  let tris = 0;
  gltf.scene.traverse(o => { if (!o.isMesh) return; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    /* STANDARD, NOT PHYSICAL (2026-10-03): the GLB's IOR/specular extensions make three build a
       MeshPhysicalMaterial, and for leaf fill that heavier shader was ~0.5-0.8 ms; at foliage range the
       specular tint it buys is not visible */
    if (o.material.isMeshPhysicalMaterial) { const sm = new THREE.MeshStandardMaterial(); THREE.MeshStandardMaterial.prototype.copy.call(sm, o.material); o.material = sm; }
    const m = o.material; m.transparent = false; m.alphaTest = 0.5; m.side = THREE.DoubleSide; m.depthWrite = true;
    o.castShadow = o.receiveShadow = true; });
  if (!tris) throw new Error('trees: the tree decoded to no triangles');
  const box = new THREE.Box3().setFromObject(gltf.scene), H0 = box.max.y - box.min.y;
  const far = LODFAR ? gltf.scene.clone(true) : null; let farTris = 0, islands = 0;
  if (far) far.traverse(o => { if (!o.isMesh) return;
    if (/leaves/.test(o.material.name)) { const r = pruneLeaves(o.geometry, KEEP, 7); o.geometry = r.geo; islands = r.islands; }
    const g = o.geometry; farTris += (g.index ? g.index.count : g.attributes.position.count) / 3; });
  const dress = () => {
    const done = [];
    for (const r of G.treeReg || []) {
      if (r.model) continue;
      const sp = SPIKE.find(t => Math.abs(t[0] - r.x) < 0.01 && Math.abs(t[1] - r.z) < 0.01);
      const h = sp ? sp[2] : 2.1 + 4.4 * r.s;
      const ry = sp ? sp[3] : ((Math.sin(r.x * 12.9898 + r.z * 78.233) * 43758.5453) % 1 + 1) % 1 * Math.PI * 2;
      const t = new THREE.LOD(), sc = h / H0;
      t.addLevel(gltf.scene.clone(true), 0); if (far) t.addLevel(far.clone(true), LODFAR);
      t.scale.setScalar(sc); t.rotation.y = ry;
      /* the group sits at terrainHeightAt and carries the primitive's scale; the model is placed in
         WORLD units under it, so the group's own scale is divided back out */
      const gs = r.g.scale.x || 1;
      const holder = new THREE.Group(); holder.scale.setScalar(1 / gs); holder.add(t);
      t.position.y = -box.min.y * sc;
      for (const o of r.g.children) o.visible = false;
      /* on the DRAWN ground (SPIKE_ADOPT 2): the group stands at terrainHeightAt, the plane under it can
         carry +-0.18 m of display relief */
      if (K.drawnGroundAt) holder.position.y = (K.drawnGroundAt(r.x, r.z) - r.g.position.y) / gs;
      r.g.add(holder); r.model = holder; r.h = h; done.push(r);
    }
    return done;
  };
  dress();
  let reg = G.treeReg;
  const watch = () => { if (G.treeReg !== reg) { reg = G.treeReg; try { dress(); } catch (e) { console.error('trees: re-dress failed —', e); } } requestAnimationFrame(watch); };
  requestAnimationFrame(watch);
  G.trees = { mode: 'spike', url: TREEURL, tris, farTris, lodFarM: LODFAR, leafIslands: islands, keep: KEEP, heightM: +H0.toFixed(3), placed: (G.treeReg || []).length };
  return G.trees;
}
