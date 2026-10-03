/* THE TUSSOCK CLUMPS — SPIKE_ADOPT row 9 (2026-10-03).

   The render spike scattered Poly Haven's grass_medium_01 over its verge — "painted Lindis gold through the material
   colour, since the scan's albedo is a lawn green" — densest at the seal's margin and thinning outwards. This is that,
   on every map's verge (VERGE.maps in src/game.mjs), over the game's own blade field: tools/derive_clumps.mjs gives
   two tufts (653 and 833 triangles, cut-out blades), each drawn as ONE InstancedMesh.
   WHERE A CLUMP MAY NOT STAND, read off the world rather than listed here: inside any of the map's grass cuts (+keepOff)
   — tracks, pads, the piste, the yards, the seal; on anything the drawn
   ground says is raised (a slab, a deck, a puddle); within 1 m of a tree trunk or inside a solid collider's footprint.
   Seeded per map, so a vantage is the same every run. STOOD ON THE GROUND: y is the ground height under it.
   They RECEIVE shadow and do not CAST (the spike measured ~4 ms for clump shadows at 4096; the blade field casts none
   either). Browser-only: headless never imports this file, so the batteries' world is unchanged.
   A NEW WORLD IS RE-DRESSED: map travel builds a new scene, and a cheap per-frame check notices. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function installClumps(K) {
  const G = K.G, V = K.VERGE;
  const url = new URL(V.clumps.url, document.baseURI).href;
  const gltf = await new GLTFLoader().loadAsync(url);
  const variants = []; gltf.scene.traverse(o => { if (o.isMesh) variants.push(o); });
  if (variants.length < 2) throw new Error('clumps: the GLB holds ' + variants.length + ' meshes');
  const tint = new THREE.Color(...V.clumps.tint);
  /* the atlas is the scan's DRY paint with its own alpha (tools/derive_clumps.mjs): a mask, both faces, depth written.
     VERGE.clumps.tint is a gentle grade on it now, not the spike's lawn-to-gold repaint */
  for (const v of variants) { const m = v.material = v.material.clone(); m.color.multiply(tint); m.side = THREE.DoubleSide; m.transparent = false; m.alphaTest = 0.5; m.depthWrite = true; }
  let live = [];
  const dress = () => {
    for (const im of live) { im.parent && im.parent.remove(im); im.dispose(); } live = [];
    const biome = G.biome, C = V.maps[biome]; if (!C) { G.clumps = { mode: 'none', biome }; return; }
    let s = (2166136261 ^ biome.split('').reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 0)) >>> 0 || 7;
    const rnd = () => (s = (Math.imul(s, 48271) % 2147483647 + 2147483647) % 2147483647) / 2147483647;
    const cuts = K.grassCuts(biome).filter(c => c[2] > 0 && c[3] > 0), off = V.clumps.keepOff;
    const inCut = (x, z) => cuts.some(c => Math.abs(x - c[0]) < c[2] + off && Math.abs(z - c[1]) < c[3] + off);
    const trees = (G.treeReg || []).map(t => [t.x, t.z]);
    const solid = (G.colliders || []).filter(c => c.solid && c.kind === 'box' && c.w && c.d);
    const inSolid = (x, z) => solid.some(c => Math.abs(x - c.x) < c.w / 2 + 0.3 && Math.abs(z - c.z) < c.d / 2 + 0.3);
    /* the seal's union, for "densest at the margin": distance outside the seal boxes (SEAL.maps[biome].rects, the boxes the wear is inside) */
    const rects = ((K.SEAL && K.SEAL.maps[biome]) || {}).rects || [];
    const outSeal = (x, z) => rects.length ? Math.max(0, -Math.max(...rects.map(r => Math.min(x - r[0], r[2] - x, z - r[1], r[3] - z)))) : null;
    const per = variants.map(() => []), M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    let placed = 0, tries = 0;
    while (placed < C.count && tries < C.count * 12) { tries++;
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * C.radius, x = C.centre[0] + Math.cos(a) * r, z = C.centre[1] + Math.sin(a) * r;
      if (C.zMin != null && z < C.zMin) continue;
      /* density: from the seal's margin where there is seal (the spike's rule), else from the map's centre */
      const d = C.fromSeal && rects.length ? outSeal(x, z) : Math.max(0, r - C.radius * 0.35);
      if (C.fromSeal && rects.length && d < 1.8) continue;          // the gravel margin itself is bare
      if (rnd() > Math.exp(-d / C.fall)) continue;
      if (inCut(x, z) || inSolid(x, z)) continue;     // (not terrainFlatAt: it flattens most of the play area, not only tracks — the tracks are cuts)
      if (trees.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 1.0)) continue;
      /* SOMETHING RAISED IS DRAWN HERE: a slab, a deck, a baked disc or a live floor at or above the ground plane.
         (Not drawnGroundAt minus the logic height: the drawn ground plane has relief the logic does not, so that
         test called most open ground "raised" — 13-18 clumps placed of ~1,000.) */
      const ex = K.drawnGroundExplain(x, z) || [], gp = ex.find(e => /^plane\d+\(ground\)/.test(e[0]));
      const dy = gp ? gp[1] : K.drawnGroundAt(x, z);
      if (ex.some(([kk, y]) => !/^plane|^range/.test(kk) && y > dy - 0.05)) continue;
      const k = V.clumps.scale[0] + (V.clumps.scale[1] - V.clumps.scale[0]) * Math.pow(rnd(), 1.6);
      M.compose(p.set(x, dy - 0.02, z), q.setFromAxisAngle(up, rnd() * Math.PI * 2), sc.set(k, k * (0.8 + rnd() * 0.5), k));
      per[Math.floor(rnd() * variants.length) % variants.length].push(M.clone()); placed++; }
    variants.forEach((src, j) => { if (!per[j].length) return;
      const im = new THREE.InstancedMesh(src.geometry, src.material, per[j].length);
      per[j].forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere();
      im.castShadow = false; im.receiveShadow = true; im.name = 'tussockClumps'; im.userData.keepWithModel = true;
      G.scene.add(im); live.push(im); });
    G.clumps = { mode: 'scan', biome, placed, tries, variants: live.length, tris: live.reduce((t, im) => t + im.count * (im.geometry.index ? im.geometry.index.count : im.geometry.attributes.position.count) / 3, 0) };
  };
  dress();
  let scene = G.scene;
  const watch = () => { if (G.scene !== scene) { scene = G.scene; try { dress(); } catch (e) { console.error('clumps: re-dress failed —', e); } } requestAnimationFrame(watch); };
  requestAnimationFrame(watch);
  return G.clumps;
}
