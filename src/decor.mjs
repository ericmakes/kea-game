/* THE CLUTTER — Step 3 of Eric's per-map pass ("add clutter and wear"), 2026-10-03.

   Poly Haven CC0 models (tools/derive_polyhaven.mjs) set down where a carpark collects them: bags of rubbish beside
   the bin, old tyres against the hut. DECOR.maps in src/game.mjs says what stands where; this file only loads and
   places it. Each piece is DRESSING, not world: it has no collider and no anchor, the bird and the walkers pass
   through it, and it is placed where they rarely go (against a wall, in a bin's lee). Anything that should be
   perched on or pecked is a registry prop (P6A), not this.
   Browser-only, like the clumps: headless never imports this file, so the batteries' world is unchanged. Stood on the
   DRAWN ground; seeded nothing (every placement is declared). Re-dressed when map travel builds a new scene.
   A failed load leaves the map without its clutter and says why in G.decor. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function installDecor(K) {
  const G = K.G, D = K.DECOR, cache = new Map();
  const load = url => { if (!cache.has(url)) cache.set(url, new GLTFLoader().loadAsync(new URL(url, document.baseURI).href)); return cache.get(url); };
  let live = [];
  const dress = async () => {
    for (const o of live) o.parent && o.parent.remove(o); live = [];
    const biome = G.biome, list = D.maps[biome] || [], scene = G.scene, placed = [], failed = [];
    for (const d of list) {
      try { const gltf = await load(d.url); if (G.scene !== scene) return;   // travelled while loading: the next dress places it
        const root = gltf.scene.clone(true);
        root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        const g = new THREE.Group(); g.add(root); g.name = 'decor:' + d.url.split('/').pop();
        /* the file's own metres, times d.scale; its lowest point on the drawn ground, plus d.y for a stack */
        root.rotation.set(d.rx || 0, 0, d.rz || 0); g.scale.setScalar(d.scale || 1); g.rotation.y = d.ry || 0;
        g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(g);
        g.position.set(d.at[0], K.drawnGroundAt(d.at[0], d.at[1]) - bb.min.y + (d.y || 0), d.at[1]);
        scene.add(g); live.push(g); placed.push(g.name); }
      catch (e) { failed.push({ url: d.url, why: String(e && e.message || e) }); console.error('decor: ' + d.url + ' did not load —', e); } }
    G.decor = { biome, placed: placed.length, failed };
  };
  await dress();
  let scene = G.scene;
  const watch = () => { if (G.scene !== scene) { scene = G.scene; dress().catch(e => console.error('decor: re-dress failed —', e)); } requestAnimationFrame(watch); };
  requestAnimationFrame(watch);
  return G.decor;
}
