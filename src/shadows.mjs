/* THE SUN'S SHADOWS, IN CASCADES FITTED TO THE CAMERA — PERF S4 (2026-10-02).

   WHAT IT REPLACES. One 2048 VSM map, fixed on the world origin and spanning +/-58 m — the whole
   map, whatever the camera looks at, blurred with 14 samples a side every frame. Texel 5.7 cm
   everywhere: the same detail under the bird as behind the range, and the same cost.
   WHAT IT IS. three's CSM (three/addons/csm): CASCADES shadow maps of SIZE, each fitted to a slice
   of the camera frustum out to MAXFAR, each centre SNAPPED TO ITS OWN TEXEL GRID (CSM.update does
   this) so the shadows do not swim as the camera moves. Each fragment takes the sun from exactly one
   cascade. The near slice, where the bird is, gets ~3 cm texels; the far slice ~10 cm.

   WHY NOT csm.setupMaterial. It REPLACES each material's onBeforeCompile, and the grass, the terrain,
   the scanned-material breakup and the bird's alpha mask all have their own. So the two chunks CSM
   needs are installed GLOBALLY, with USE_CSM, CSM_CASCADES and the cascade breaks written into the
   chunk as constants (the camera's near/far and MAXFAR never change). No per-material setup, nothing
   overwritten, and nothing can be missed — a material the shadows never saw is still in the chunk.
   EVERY LIT PROGRAM RECOMPILES ONTO IT BY ITSELF: adding the cascade lights changes the number of
   shadow-casting directional lights, which is part of every lit program's cache key.

   THE AUTHORED SUN STAYS THE AUTHOR. game.mjs keeps writing G.sun's colour, intensity and position
   (the day/night roll, the sky); the cascades copy them every frame. G.sun itself is made invisible
   and stops casting, so it neither double-lights nor renders a map — in the BROWSER only: headless
   never loads this module, and the P2 proof that the sun casts is about the authored light.
   IT FITS WHICHEVER CAMERA IS DRAWING. renderer.render is wrapped: a render of G.scene through a
   perspective camera refits the cascades to that camera first — the follow cam, a camLock, either
   half of split screen (each eye already renders its own shadow maps). */
import * as THREE from 'three';
import { CSM } from 'three/addons/csm/CSM.js';
import { CSMShader } from 'three/addons/csm/CSMShader.js';

export const CASCADE = {
  cascades: 3, size: 1024, maxFar: 80, mode: 'practical',
  /* THE SHADOW BOX IS A COLUMN TOWARD THE SUN, and its depth decides how many casters it gathers.
     80 m of margin and 300 m of depth swept a strip ~230 m long across the map into every cascade:
     the NEAR cascade alone submitted ~360 casters. A caster that matters stands at most a tree's
     height over the ground it shadows, so 20 m toward the sun is enough, and 150 m holds the far
     slice (~100 m across in light space) with room to spare. */
  lightMargin: 20, lightFar: 150,
  /* VSM stays VSM (the shadow type is the renderer's, SKY.shadowType). Its softness is in TEXELS,
     so a cascade with finer texels has a narrower penumbra for the same radius; blur stays modest
     because each map is a quarter of the old one's pixels. */
  radius: 4.2, blurSamples: 10,
  /* THE SHADOW PASS IS DRAW-CALL BOUND, not fill bound: 1,766 of a frame's 1,983 draw calls were
     shadow casters re-submitted per cascade (gauntlet/verify/framecount.mjs), and render scale did
     not move the median frame at all. So: a caster smaller than smallR casts into the NEAR cascade
     only (338 of 810 casters — gravel, bolts, handles — whose shadows are centimetres wide), and the
     cascades past the first re-render every `every[i]` frames, holding still between. */
  smallR: 0.2, every: [1, 2, 4], proxies: true,   // every: 2026-10-03, mid cascade every 2nd frame, far every 4th
  /* recvOnly: ALSO drop every receive-only mesh (ground, slabs) from the shadow pass. OFF, and
     measured off: three's VSM needs its receivers in the map — without them 01_carpark_wide lost the
     big tree's shadow and 12_seal_midpeel grew a dark slab of false shadow right of the caravan. The
     grass and the range stay out (G.noShadowPass): the grass was junk depth at the origin anyway. */
  recvOnly: true,   // ON since PCF (2026-10-03): only VSM needed its receivers in the map
};

/* SHADOW PROXIES — one draw call per prop per cascade instead of one per part. PERF S4.
   A car is twenty-odd small meshes and every cascade re-submitted each of them; the shadow pass was
   most of the frame's draw calls and the frame is draw-call bound on ANGLE/Metal. For each top-level
   group, its casters' triangles are merged ONCE into a single geometry in the group's own frame, and
   that one mesh casts in their place, as a CHILD of the group — so a car that drives, a bin that is
   knocked over, carries its shadow with it.
   SEEN BY THE SHADOW PASS ONLY. The proxy sits on PROXYLAYER, which no game camera enables, so the
   frame never draws it. three's shadow pass tests layers against the camera it is HANDED, so the
   cascade wrapper hands it a camera that sees PROXYLAYER as well as the default.
   CASTERS AND RECEIVERS BOTH. three's VSM draws every RECEIVER into the map as well as every caster
   (and needs them — see CASCADE.recvOnly), so a proxy that merged only the casters left the parts
   drawn one by one as receivers and saved nothing. A proxy merges every member that casts OR
   receives; during the shadow pass the members' receiveShadow is off (G.__proxyMembers, read by
   excludeFromShadowPass) and the proxy writes the same depth they would have, in one call.
   ONLY WHAT MERGES HONESTLY: FrontSide, opaque, no alpha test, no map-with-alpha, not skinned, not
   instanced, not morphed. Anything else keeps casting on its own.
   PARTS THAT MOVE ARE LET GO. Every MEMBER's matrix relative to its group is checked every
   CHECKEVERY frames; a part that moved, was detached or hidden — a wiper ripped off, a gate that
   swings, the tow wheel — goes back to casting by itself for good, and the group's proxy is rebuilt
   without it. A static prop costs nothing after its first build. */
export const PROXYLAYER = 3;
/* the scene's child count WITHOUT the scene-level proxy, which is itself a child of the scene: keying a
   rebuild on the raw count would rebuild every frame */
const sceneKids = (scene) => { let n = 0; for (const o of scene.children) if (!o.userData.shadowProxy) n++; return n; };
const CHECKEVERY = 20;
function mergeable(o) {
  const m = o.material;
  return o.isMesh && (o.castShadow || o.receiveShadow) && !o.isSkinnedMesh && !o.isInstancedMesh && !o.morphTargetInfluences && o.geometry &&
    o.geometry.attributes.position && !Array.isArray(m) && m && !m.transparent && !(m.alphaTest > 0) && m.side === THREE.FrontSide &&
    !m.displacementMap && o.visible;
}
function installProxies(G) {
  const roots = new Map(), dynamic = new WeakSet(), inv = new THREE.Matrix4(), rel = new THREE.Matrix4(), v = new THREE.Vector3();
  const mat = new THREE.MeshBasicMaterial({ side: THREE.FrontSide });
  let key = null, frame = 0, builds = 0;
  /* walkers animate every part every frame: they are never proxied */
  const walkers = () => { const S = new Set(); for (const L of [G.keas, G.humans, G.sheep]) for (const e of (L || [])) if (e && e.g) S.add(e.g); return S; };
  const visibleChain = (o, root) => { for (let p = o; p && p !== root; p = p.parent) if (!p.visible) return false; return true; };
  const PM = G.__proxyMembers = G.__proxyMembers || new Set();
  const release = (R) => { for (const m of R.members) { m.mesh.castShadow = m.cast; PM.delete(m.mesh); } if (R.proxy) { R.proxy.removeFromParent(); R.proxy.geometry.dispose(); } };
  const build = (root) => {
    const old = roots.get(root); if (old) release(old);
    root.updateMatrixWorld(true); inv.copy(root.matrixWorld).invert();
    const members = [];
    /* THE SCENE IS A ROOT TOO, for its DIRECT mesh children only — box(...) with no parent puts a
       slab, a kerb, a puddle straight into the scene, and those were the bulk of what was left */
    const visit = root === G.scene ? (f) => { for (const o of G.scene.children) if (o.isMesh) f(o); } : (f) => root.traverse(f);
    visit(o => { if (o.userData.shadowProxy || dynamic.has(o) || !mergeable(o) || !visibleChain(o, root)) return;
      members.push({ mesh: o, cast: o.castShadow, rel: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), parent: o.parent }); });
    if (members.length < 2) { roots.set(root, { members: [], proxy: null }); return; }
    let n = 0; for (const m of members) { const g = m.mesh.geometry; n += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(n * 3); let k = 0;
    for (const m of members) { const g = m.mesh.geometry, P = g.attributes.position, I = g.index, c = I ? I.count : P.count;
      for (let i = 0; i < c; i++) { v.fromBufferAttribute(P, I ? I.getX(i) : i).applyMatrix4(m.rel); pos[k++] = v.x; pos[k++] = v.y; pos[k++] = v.z; } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.computeBoundingSphere();
    const proxy = new THREE.Mesh(geo, mat); proxy.castShadow = true; proxy.receiveShadow = false; proxy.layers.set(PROXYLAYER);
    proxy.userData.shadowProxy = true; proxy.name = 'shadowProxy'; root.add(proxy);
    for (const m of members) { m.mesh.castShadow = false; PM.add(m.mesh); }
    roots.set(root, { members, proxy }); builds++; G.__proxyBuilds = builds;
  };
  const check = (root, R) => {
    root.updateMatrixWorld(true); inv.copy(root.matrixWorld).invert(); let moved = false;
    for (const m of R.members) { const o = m.mesh;
      rel.multiplyMatrices(inv, o.matrixWorld);
      let attached = false; for (let p = o.parent; p; p = p.parent) if (p === root) { attached = true; break; }
      if (!attached || !visibleChain(o, root) || !o.visible || !rel.equals(m.rel)) { dynamic.add(o); moved = true; } }
    /* a released dynamic part casts on its own again — release() puts castShadow back */
    if (moved) build(root);
  };
  return {
    update() {
      frame++;
      /* A NEW WORLD REBUILDS EVERYTHING; ANYTHING ELSE IS INCREMENTAL. Keying a full rebuild on the
         scene's child count rebuilt all ~58 proxies every few seconds — a spawned bit, a loose item
         or a passing car changes the count — which is a merge of ~650 meshes and a hitch each time. */
      const k = G.scene.uuid + ':' + (G.biome || '');
      if (k !== key) { for (const [r, R] of roots) release(R); roots.clear(); key = k;
        const W = walkers();
        for (const root of G.scene.children) if (root.isObject3D && !root.isMesh && root.children && root.children.length && !root.isLight && !W.has(root)) build(root);
        build(G.scene); return; }
      if (frame % CHECKEVERY !== 0) return;
      const W = walkers();
      for (const [r, R] of roots) if (r !== G.scene && r.parent !== G.scene) { release(R); roots.delete(r); }
      for (const root of G.scene.children) if (!roots.has(root) && root.isObject3D && !root.isMesh && !root.userData.shadowProxy &&
          root.children && root.children.length && !root.isLight && !W.has(root)) build(root);
      for (const [r, R] of roots) if (R.members.length) check(r, R);
    },
    get builds() { return builds; },
    get state() { let p = 0, m = 0; for (const R of roots.values()) if (R.proxy) { p++; m += R.members.length; } return { proxies: p, merged: m }; },
  };
}

export function installCascades(KEAGAME) {
  const G = KEAGAME.G, renderer = G.renderer, sun = G.sun;
  if (!renderer || !sun || !G.cams || !G.cams[0]) throw new Error('shadows: nothing to attach to');
  for (const [k, v] of Object.entries(globalThis.__KEA_CASCADE__ || {})) if (k in CASCADE) CASCADE[k] = v;
  const cam = G.cams[0];
  const dir = new THREE.Vector3();
  const sunDir = () => dir.copy(sun.position).negate().normalize();   // the sun aims at the origin
  const csm = new CSM({ camera: cam, parent: G.scene, cascades: CASCADE.cascades, maxFar: CASCADE.maxFar,
    mode: CASCADE.mode, shadowMapSize: CASCADE.size, lightDirection: sunDir().clone(),
    lightIntensity: sun.intensity, shadowBias: sun.shadow.bias || 0.000001,
    lightMargin: CASCADE.lightMargin, lightFar: CASCADE.lightFar, lightNear: 1 });
  /* the chunk, with the breaks as constants — see the header */
  const breaks = []; csm._getExtendedBreaks(breaks);
  const far = Math.min(cam.far, CASCADE.maxFar), f = x => x.toFixed(8);
  const consts = `#define USE_CSM 1
#define CSM_CASCADES ${CASCADE.cascades}
const vec2 CSM_cascades[${CASCADE.cascades}] = vec2[${CASCADE.cascades}](${breaks.map(b => `vec2(${f(b.x)},${f(b.y)})`).join(',')});
const float cameraNear = ${f(cam.near)};
const float shadowFar = ${f(far)};
`;
  const pars = CSMShader.lights_pars_begin;
  const decl = pars.slice(0, pars.indexOf('#endif') + '#endif'.length);
  if (!/uniform vec2 CSM_cascades/.test(decl)) throw new Error('shadows: CSMShader.lights_pars_begin no longer opens with its uniform block');
  THREE.ShaderChunk.lights_pars_begin = consts + pars.slice(decl.length);
  THREE.ShaderChunk.lights_fragment_begin = CSMShader.lights_fragment_begin;
  for (const L of csm.lights) {
    L.shadow.radius = CASCADE.radius; L.shadow.blurSamples = CASCADE.blurSamples;
    L.shadow.normalBias = sun.shadow.normalBias; L.shadow.bias = sun.shadow.bias;
  }
  sun.castShadow = false; sun.visible = false;

  /* ONE CASCADE PER SHADOW-MAP CALL. three renders every shadow light in one sm.render; wrapping it
     to render the cascades one at a time is what lets the small casters cast into the first only. */
  const sm = renderer.shadowMap, smInner = sm.render.bind(sm), sp = new THREE.Sphere();
  let frame = 0, small = [], smallKey = -1;
  const refreshSmall = () => {
    const key = sceneKids(G.scene) + ':' + (G.biome || '') + ':' + (proxies ? proxies.builds : 0);
    if (key === smallKey) return; smallKey = key; small = [];
    G.scene.updateMatrixWorld(true);
    G.scene.traverse(o => { if (!o.isMesh || !o.castShadow || !o.geometry) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      sp.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      if (sp.radius < CASCADE.smallR && !o.userData.shadowProxy) small.push(o); });
  };
  for (const L of csm.lights) L.shadow.autoUpdate = false;
  const due = i => (frame % (CASCADE.every[i] || 1)) === 0;
  const proxies = CASCADE.proxies ? installProxies(G) : null;
  const viewer = new THREE.PerspectiveCamera(); viewer.layers.enable(PROXYLAYER);   // the shadow pass's layer test
  sm.render = (lights, scene, camera) => {
    if (scene !== G.scene) return smInner(lights, scene, camera);
    if (proxies) proxies.update();
    viewer.layers.mask = camera.layers.mask; viewer.layers.enable(PROXYLAYER);
    camera = viewer;
    refreshSmall();
    for (let i = 0; i < csm.lights.length; i++) {
      if (!due(i)) continue;
      for (let j = 0; j < csm.lights.length; j++) csm.lights[j].shadow.needsUpdate = (j === i);
      const off = i > 0, was = off ? small.map(o => o.castShadow) : null;
      if (off) for (const o of small) o.castShadow = false;
      try { smInner(lights, scene, camera); } finally { if (off) small.forEach((o, j) => { o.castShadow = was[j]; }); }
    }
    for (const L of csm.lights) L.shadow.needsUpdate = false;
  };
  const held = csm.lights.map(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3() }));
  const sync = (camera) => {
    frame++;
    camera.updateMatrixWorld();
    if (csm.parent !== G.scene) { csm.remove(); csm.parent = G.scene; }
    for (const L of csm.lights) if (L.parent !== G.scene) { G.scene.add(L); G.scene.add(L.target); }
    if (csm.camera !== camera) { csm.camera = camera; csm.updateFrustums(); }
    csm.lightDirection.copy(sunDir());
    for (const L of csm.lights) { L.color.copy(sun.color); L.intensity = sun.intensity; L.shadow.intensity = sun.shadow.intensity; }
    /* a cascade that will not re-render this frame keeps the light position its map was drawn
       from, or its shadows would slide by a frame's camera motion */
    csm.lights.forEach((L, i) => { if (!due(i)) { held[i].p.copy(L.position); held[i].t.copy(L.target.position); } });
    csm.update();
    csm.lights.forEach((L, i) => { if (!due(i)) { L.position.copy(held[i].p); L.target.position.copy(held[i].t); } });
  };
  const render = renderer.render.bind(renderer);
  renderer.render = (scene, camera) => {
    if (scene === G.scene && camera && camera.isPerspectiveCamera) sync(camera);
    return render(scene, camera);
  };
  const state = { get proxies() { return proxies ? proxies.state : null; }, mode: 'cascades', cascades: CASCADE.cascades, size: CASCADE.size, maxFar: CASCADE.maxFar,
    breaks: breaks.map(b => [+b.x.toFixed(4), +b.y.toFixed(4)]), csm };
  G.shadows = state;
  return state;
}

/* KEEP RECEIVERS THAT ARE NOT OCCLUDERS OUT OF THE SHADOW PASS — PERF S4. three's VSM pass draws
   every object with receiveShadow into the shadow map too, caster or not. For the grass that was
   2.6 M triangles of undisplaced blades a frame, per cascade; for the ground, the slabs and the range
   it is a few hundred draw calls a frame — but those three's VSM NEEDS (see CASCADE.recvOnly).
   So only G.noShadowPass (the grass) and the range have receiveShadow switched
   off for the length of the shadow pass and restored before the scene draws (the depth material does
   not read it; the frame's own program does, and sees it true). Classic VSM: occluders in the map,
   receivers compare against it. Installed with or without cascades, so a NOCSM A/B is like for like.
   The list is rebuilt when the scene's child count or the map changes. */
export function excludeFromShadowPass(KEAGAME) {
  for (const [k, v] of Object.entries(globalThis.__KEA_CASCADE__ || {})) if (k in CASCADE) CASCADE[k] = v;
  const G = KEAGAME.G, sm = G.renderer && G.renderer.shadowMap;
  if (!sm) throw new Error('shadows: no shadow map to wrap');
  const inner = sm.render.bind(sm), was = [];
  let L = [], key = -1;
  const refresh = () => {
    const k = sceneKids(G.scene) + ':' + (G.biome || '') + ':' + ((G.noShadowPass || []).length) + ':' + ((G.__proxyMembers || { size: 0 }).size) + ':' + (G.__proxyBuilds || 0);
    if (k === key) return; key = k;
    const S = new Set(G.noShadowPass || []);
    for (const o of (G.__proxyMembers || [])) S.add(o);
    if (CASCADE.recvOnly) G.scene.traverse(o => { if (o.isMesh && o.receiveShadow && !o.castShadow) S.add(o); });
    L = [...S];
  };
  sm.render = (lights, scene, camera) => {
    if (scene !== G.scene) return inner(lights, scene, camera);
    refresh();
    for (let i = 0; i < L.length; i++) { was[i] = L[i].receiveShadow; L[i].receiveShadow = false; }
    try { return inner(lights, scene, camera); }
    finally { for (let i = 0; i < L.length; i++) L[i].receiveShadow = was[i]; }
  };
}
