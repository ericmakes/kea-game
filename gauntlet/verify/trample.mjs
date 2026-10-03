/* TRAMPLE — can a player lose the bird in the tussock? 2026-10-02, the grass-trample piece.

   Eric, on 03_kea_plate and 13_idle_preen after the render fix: blades drawn straight through the
   bird's body. GRASS.trample flattens the field round each kea; this measures whether any blade is
   still drawn OVER the bird at the PLAY camera — the game's own chase camera, not a staged lens.
   HOW. The real built game, carpark tussock, kea 0 held at approved_idle (sampled in node and
   injected by bone name, both owners stood down — birdsky.mjs's idiom, so two takes are identical).
   At each heading the chase camera settles behind the bird, then four takes differing ONLY in
   visibility and in the grass's colour:
     K  everything, every grass tier tinted a pure KEY GREEN       K2  K again, after B (noise bracket)
     B  grass hidden                                               D   grass AND bird hidden
   mask     = pixels where B and D differ (the bird with no grass in front of it), eroded 2 px;
              the bird casts no shadow and its blob is hidden for every take, so the mask is the body
   blades   = mask pixels KEY GREEN in K and not in B: a blade drawn over the bird
   noise    = mask pixels where K and K2 differ; must be 0 or the measurement refuses itself
   VERDICT: blades == 0 and noise == 0 and a non-empty mask at every spot and heading, and the keyed
   field covering >= 10% of the frame (a field that failed to compile draws nothing over anything).
   CONTROL: TRAMPLE=0 zeroes the trample at runtime (floor 1) and must FAIL — the instrument has to
   see the defect it was written for.
   Usage: node gauntlet/verify/trample.mjs [outdir]    SPOTS='x,z;x,z'  TRAMPLE=0 */
import fs from 'fs'; import path from 'path'; import url from 'url';
import * as THREE from 'three';
import sharp from 'sharp';
import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, launch, GAUNTLETSEED } from './webrig.mjs';
globalThis.createImageBitmap = async () => ({ width: 4, height: 4, close() {} });
globalThis.self = { URL: { createObjectURL: () => 'blob:stub', revokeObjectURL() {} } };
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = process.argv[2] || path.join(ROOT, 'gauntlet/capture/trample');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BIOME = 'carpark';
const SPOTS = (process.env.SPOTS || '0,0;-10.5,-24.2;-20,-14').split(';').map(t => t.split(',').map(Number));
const HEADINGS = [0, 1.6, 3.2, 4.8];
const CONTROL = process.env.TRAMPLE === '0';
const KEY = (r, g, b) => g > 90 && g > 1.7 * r && g > 1.7 * b;

const SRC = fs.readFileSync(path.join(ROOT, 'src/game.mjs'), 'utf8');
const GLBREL = (SRC.match(/\n\s*url:'([^']+\.glb)'/) || [])[1];
const buf = fs.readFileSync(path.join(ROOT, 'assets', GLBREL));
const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
let sk = null; gltf.scene.traverse(o => { if (o.isSkinnedMesh) sk = o; });
const mixer = new THREE.AnimationMixer(gltf.scene); mixer.clipAction(gltf.animations.find(a => a.name === 'approved_idle')).play(); mixer.setTime(0);
gltf.scene.updateMatrixWorld(true);
const POSE = {}; for (const b of sk.skeleton.bones) POSE[b.name] = [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()];
const W0 = (sk.morphTargetInfluences || [0])[0] || 0;

ensureBuild();
const srv = await serve(); const browser = await launch();
const results = []; let state = null;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });   // the play resolution
  await preparePage(page, { seed: GAUNTLETSEED, biome: BIOME });
  await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(1000);
  await assertBooted(page, { biome: BIOME });
  await page.evaluate('window.AudioContext=undefined; KEAGAME.startGame(1);'); await sleep(400);
  await assertBirdDressed(page);
  state = await page.evaluate(({ P, w, CONTROL }) => {
    KEAGAME.CASEFILES.forEach(c => c.seen = true); const td = document.getElementById('todo'); if (td) td.style.display = 'none';
    KEAGAME.G.cfOpen = false; KEAGAME.G.paused = false;
    { const cv = document.querySelector('canvas'); const _hd = () => { try { for (const el of document.body.children) if (el !== cv && !el.contains(cv)) el.style.visibility = 'hidden'; } catch (e) {} requestAnimationFrame(_hd); }; requestAnimationFrame(_hd); }
    const G = KEAGAME.G, k = G.keas[0], M = k._model;
    G.humans.forEach(h => { h._park = true; });
    /* NO TRAFFIC, as capture.mjs stages it: a passing spike hatch throws clear-coat highlights the bloom
       spreads across the frame, and two identical takes then differ (805 bird px on one gate run) */
    if (G.trafT) { G.trafT.a = 999; G.trafT.b = 999; }
    for (let i = G.cars.length - 1; i >= 0; i--) { const c = G.cars[i]; if (!c.traffic) continue;
      G.scene.remove(c.g); const ci = G.colliders.indexOf(c.collider); if (ci >= 0) G.colliders.splice(ci, 1);
      for (let q = G.inter.length - 1; q >= 0; q--) if (G.inter[q].car === c) G.inter.splice(q, 1); G.cars.splice(i, 1); }
    { const _tr = () => { try { G.trafT.a = 999; G.trafT.b = 999;
        /* and the sheep, as the batteries park them: they walk home every frame */
        for (const sh of G.sheep || []) { sh.x = -48; sh.z = -48; sh.home = { x: -48, z: -48 }; if (sh.g) sh.g.position.set(-48, sh.g.position.y, -48); } } catch (e) {} requestAnimationFrame(_tr); }; requestAnimationFrame(_tr); }
    const _pk = () => { try { G.humans.forEach(h => { h.x = 46; h.z = 46; h.home = { x: 46, z: 46 }; h.patrol = null; h.state = 'idle'; if (h.g) h.g.position.set(46, 0, 46); }); } catch (e) {} requestAnimationFrame(_pk); }; requestAnimationFrame(_pk);
    const by = {}; M.sk.skeleton.bones.forEach(b => by[b.name] = b);
    k._model = null; k._anim = null; window.__birdM = M; window.__at = { x: 0, z: 0, ry: 0 };
    /* THE MASK IS THE BODY, NOT ITS SHADOW: B-vs-D otherwise also differs wherever the bird's cast
       shadow and blob fall, a blade over the SHADOW counted as a blade over the bird, and the
       shadow map's take-to-take shimmer read as noise (two refusals, masks 2-4x the body) */
    M.root.traverse(o => { if (o.isMesh) o.castShadow = false; }); if (k.shadowM) k.shadowM.visible = false;
    const mats = [G.grassMat, G.grassCoverMat, G.grassFarMat].filter(m => m && m.userData.keaG);
    window.__grassMats = mats;
    if (CONTROL) for (const m of mats) m.userData.keaG.uTrample.value.z = 1.0;   // floor 1: no trample
    const hold = () => { try {
      for (const n in P) { const b = by[n]; if (!b) continue; const v = P[n]; b.position.set(v[0], v[1], v[2]); b.quaternion.set(v[3], v[4], v[5], v[6]); b.scale.set(v[7], v[8], v[9]); }
      if (M.sk.morphTargetInfluences) M.sk.morphTargetInfluences[0] = w;
      const a = window.__at; k.x = a.x; k.z = a.z; k.y = KEAGAME.groundHeightAt(a.x, a.z, 1); k.vy = 0; k.grounded = true; k.ry = a.ry; k.stun = 0;
      k.idleT = 0; k.idleAct = null; G.camYaw = 0; G.camSnap = true; G.clockPin = 12.0; G.time = 12.0; } catch (e) {} requestAnimationFrame(hold); };
    requestAnimationFrame(hold);
    const U = mats[0] && mats[0].userData.keaG;
    return { layers: mats.length, trample: G.grass && G.grass.trample, uTrample: U && U.uTrample.value.toArray() };
  }, { P: POSE, w: W0, CONTROL });
  if (!state.layers) throw new Error('trample: no grass layers carry the blade shader');
  const grassMeshes = `[KEAGAME.G.grassMesh, ...KEAGAME.G.scene.children.filter(o=>o.isInstancedMesh && window.__grassMats.includes(o.material))]`;
  const shoot = async (grass, bird, key) => {
    await page.evaluate(([g, b, key, GM]) => {
      for (const o of eval(GM)) if (o) o.visible = g;
      window.__birdM.root.visible = b;
      for (const m of window.__grassMats) { const U = m.userData.keaG; U.__save = U.__save || { a: U.uTintA.value.clone(), b: U.uTintB.value.clone(), c: U.uTintC.value.clone(), base: U.uTintBase.value.clone(), tip: U.uTintTip.value.clone() };
        for (const [n, s] of [['uTintA', 'a'], ['uTintB', 'b'], ['uTintC', 'c'], ['uTintBase', 'base'], ['uTintTip', 'tip']]) U[n].value.copy(key ? new THREE.Vector3(0, 1, 0) : U.__save[s]); }
    }, [grass, bird, key, grassMeshes]);
    await sleep(350);
    return sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  };
  for (const [x, z] of SPOTS) for (const ry of HEADINGS) {
    await page.evaluate(([x, z, ry]) => { window.__at = { x, z, ry }; }, [x, z, ry]);
    await sleep(1500);                                    // the chase camera settles behind the bird
    /* A REFUSED TAKE IS RETAKEN, up to three times (capture.mjs's shotR rule), never averaged in */
    for (let take = 1; take <= 3; take++) {
    const K = await shoot(true, true, true), B = await shoot(false, true, false), K2 = await shoot(true, true, true), D = await shoot(false, false, false);
    const W = K.info.width, Hh = K.info.height, n = W * Hh, M = new Uint8Array(n);
    const dif = (p, q, i) => Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]));
    for (let j = 0; j < n; j++) M[j] = dif(B.data, D.data, j * 3) > 12 ? 1 : 0;
    const interior = j => { if (!M[j]) return false; const xx = j % W, yy = (j / W) | 0;
      if (xx < 2 || yy < 2 || xx >= W - 2 || yy >= Hh - 2) return false;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!M[j + dy * W + dx]) return false; return true; };
    /* THE FIELD MUST BE THERE. A grass shader that fails to COMPILE draws nothing, and nothing over
       the bird is a vacuous pass — found the hard way: a comment outside its delimiters in the GLSL
       blanked the whole field and the frame looked like mown lawn. */
    let field = 0; for (let j = 0; j < n; j++) if (KEY(K.data[j * 3], K.data[j * 3 + 1], K.data[j * 3 + 2])) field++;
    let mask = 0, blades = 0, noise = 0; const vis = Buffer.alloc(n * 3);
    for (let j = 0; j < n; j++) { const i = j * 3;
      vis[i] = K.data[i] >> 1; vis[i + 1] = K.data[i + 1] >> 1; vis[i + 2] = K.data[i + 2] >> 1;
      if (!interior(j)) continue; mask++;
      if (dif(K.data, K2.data, i) > 6) noise++;
      const hit = KEY(K.data[i], K.data[i + 1], K.data[i + 2]) && !KEY(B.data[i], B.data[i + 1], B.data[i + 2]);
      if (hit) { blades++; vis[i] = 255; vis[i + 1] = 0; vis[i + 2] = 255; } else { vis[i] = B.data[i]; vis[i + 1] = B.data[i + 1]; vis[i + 2] = B.data[i + 2]; } }
    const tag = `${x}_${z}_h${ry}`;
    await sharp(vis, { raw: { width: W, height: Hh, channels: 3 } }).png().toFile(path.join(OUT, `${CONTROL ? 'control_' : ''}${tag}.png`));
    if (noise && take < 3) continue;
    results.push({ spot: `${x},${z}`, ry, mask, field: +(100 * field / n).toFixed(1), blades, pct: mask ? +(100 * blades / mask).toFixed(2) : null, noise, take });
    break; }
  }
} finally { await browser.close().catch(() => {}); await srv.close(); }

const fails = [];
for (const r of results) {
  if (!r.mask) fails.push(`${r.spot} heading ${r.ry}: the bird drew NO pixels`);
  if (r.field < 10) fails.push(`${r.spot} heading ${r.ry}: the grass covers only ${r.field}% of the frame — the field did not draw`);
  if (r.noise) fails.push(`${r.spot} heading ${r.ry}: ${r.noise} bird pixels differ between identical takes — refused`);
  if (r.blades) fails.push(`${r.spot} heading ${r.ry}: ${r.blades} of ${r.mask} bird pixels are under a blade (${r.pct}%)`);
}
console.log(`TRAMPLE ${CONTROL ? '[CONTROL: trample off] ' : ''}carpark tussock, play camera, ${SPOTS.length} spots x ${HEADINGS.length} headings   trample ${JSON.stringify(state && state.trample)}`);
for (const r of results) console.log(`  ${r.spot.padEnd(12)} heading ${String(r.ry).padEnd(4)} bird ${String(r.mask).padStart(6)} px   blades over bird ${String(r.blades).padStart(5)} (${r.pct}%)   field ${r.field}%   noise ${r.noise}` + (r.take > 1 ? `  (take ${r.take})` : ''));
if (process.env.JSON) console.log(JSON.stringify(results));
console.log(fails.length ? fails.map(f => '    ✗ ' + f).join('\n') + `\nTRAMPLE: ${fails.length} FINDINGS` : 'TRAMPLE: ALL PASS — no blade is drawn over the bird at the play camera');
process.exit(fails.length ? 1 : 0);
