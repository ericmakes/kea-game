/* BIRDFEET — are the bird's feet ON the ground? 2026-10-02, before the performance piece.

   Eric, judging 18_rear_close after the render fix: "the bird reads sunk, flat-bottomed, no legs or
   feet". This measures it instead of eyeballing it. The real built game, on the ski field's flat
   groomed snow (17, 19), kea 0 held still. For each pose, every vertex whose DOMINANT skin joint is a
   foot bone (Finger* toes, Tarsus, Leg_ — bird.mjs's own foot rule) is skinned on the CPU with three's
   SkinnedMesh.getVertexPosition (morph + bones, exactly what the GPU does), carried into world space,
   and its height compared with groundHeightAt under the bird:
     sole   = lowest foot vertex  - ground     (want ~0: negative is sunk, positive is floating)
     body   = lowest vertex of ANY region - ground  (a sunk belly with the feet buried reads here too)
   POSES: 'game' is the bird exactly as the game poses it at a standing idle — clips, rigCommit and
   all, nothing injected. 'approved_idle' and eight phases of 'walk_loop' are sampled in node from the
   shipped GLB with three's AnimationMixer and injected by bone name, both owners (_model, _anim)
   stood down, as birdsky.mjs does.
   VERDICT: |sole| <= TOL (12 mm by default — a kea's toe pad is ~10 mm thick) for every pose.
   Usage: node gauntlet/verify/birdfeet.mjs        JSON=1 for machine output; TOL=<metres> */
import fs from 'fs'; import path from 'path'; import url from 'url';
import * as THREE from 'three';
import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, launch, GAUNTLETSEED } from './webrig.mjs';
globalThis.createImageBitmap = async () => ({ width: 4, height: 4, close() {} });
globalThis.self = { URL: { createObjectURL: () => 'blob:stub', revokeObjectURL() {} } };
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const TOL = +(process.env.TOL || 0.012);
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* WHERE: every spot a bird vantage stands the kea on, plus one of each drawn-ground kind. The tarmac
   seal (18, 20), the groomed run (ski field), the carpark's plane at its own relief crest, and 0,0
   (03, 13, 25) where the relief happens to be zero — the one spot that measured right all along.
   SPOTS='biome:x,z;biome:x,z' overrides. */
const SPOTS = (process.env.SPOTS || 'carpark:-9.2,10.6;carpark:-9.55,10.15;carpark:0,0;carpark:-10.5,-24.2;skifield:17,19')
  .split(';').map(t => { const [b, xz] = t.split(':'); return { BIOME: b, AT: xz.split(',').map(Number) }; });
const SRC = fs.readFileSync(path.join(ROOT, 'src/game.mjs'), 'utf8');
const GLBREL = (SRC.match(/\n\s*url:'([^']+\.glb)'/) || [])[1];

/* ---- poses sampled in node ---- */
const buf = fs.readFileSync(path.join(ROOT, 'assets', GLBREL));
const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
let sk = null; gltf.scene.traverse(o => { if (o.isSkinnedMesh) sk = o; });
const mixer = new THREE.AnimationMixer(gltf.scene);
const sample = (name, t) => { const c = gltf.animations.find(a => a.name === name); mixer.stopAllAction();
  const a = mixer.clipAction(c); a.reset(); a.play(); mixer.setTime(Math.min(t, c.duration)); gltf.scene.updateMatrixWorld(true);
  const P = {}; for (const b of sk.skeleton.bones) P[b.name] = [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()];
  return { P, w: (sk.morphTargetInfluences || [0])[0] || 0, dur: c.duration }; };
const POSES = [['approved_idle', sample('approved_idle', 0)]];
const wd = gltf.animations.find(a => a.name === 'walk_loop').duration;
for (let i = 0; i < 8; i++) POSES.push([`walk_loop@${(i / 8).toFixed(3)}`, sample('walk_loop', wd * i / 8)]);

ensureBuild();
const srv = await serve(); const browser = await launch();
const rows = [];
try {
for (const { BIOME, AT } of SPOTS) {
      const page = await browser.newPage();
    await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
    await preparePage(page, { seed: GAUNTLETSEED, biome: BIOME });
    await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(1000);
    await assertBooted(page, { biome: BIOME });
    await page.evaluate('window.AudioContext=undefined; KEAGAME.startGame(1);'); await sleep(400);
    await assertBirdDressed(page);
    /* the measuring function, installed once */
    await page.evaluate(() => {
      window.__feet = () => {
        const G = KEAGAME.G, k = G.keas[0], M = window.__M || k._model;
        const S = M.sk; S.updateMatrixWorld(true); S.skeleton.update();
        const bones = S.skeleton.bones, foot = bones.map(b => /Finger|Tarsus|Leg_/.test(b.name));
        const J = S.geometry.attributes.skinIndex, W = S.geometry.attributes.skinWeight, n = J.count;
        const v = new (S.position.constructor)(); let sole = Infinity, body = Infinity;
        for (let i = 0; i < n; i++) {
          let bj = 0, bw = -1; for (let c = 0; c < 4; c++) { const w = W.getComponent(i, c); if (w > bw) { bw = w; bj = J.getComponent(i, c); } }
          S.getVertexPosition(i, v); v.applyMatrix4(S.matrixWorld);
          if (v.y < body) body = v.y; if (foot[bj] && v.y < sole) sole = v.y; }
        const gy = KEAGAME.groundHeightAt(k.x, k.z, 1);
        /* the VISIBLE surface: a ray down through every drawn mesh except the kea itself and the grass */
        const rc = new THREE.Raycaster(new THREE.Vector3(k.x, gy + 3, k.z), new THREE.Vector3(0, -1, 0), 0, 6);
        const own = new Set(); k.g && k.g.traverse(o => own.add(o)); M.root && M.root.traverse(o => own.add(o));
        /* the first UPWARD face no higher than 0.35 m over the sole: a car roof over a bird that has been
         ejected beneath it (20_dead_rear) is not the ground it stands on */
      const hits = rc.intersectObjects(G.scene.children, true).filter(h => h.object.visible && !own.has(h.object) && !h.object.isInstancedMesh && !h.object.isSprite && !h.object.isPoints
        && h.point.y <= sole + 0.35 && h.face && h.face.normal.clone().transformDirection(h.object.matrixWorld).y > 0.5);
        const surf = hits.length ? hits[0].point.y : gy, surfName = hits.length ? (hits[0].object.name || hits[0].object.type) + '' : '(none)';
        return { surf: +(surf - gy).toFixed(4), surfName, soleVis: +(sole - surf).toFixed(4), sole: +(sole - gy).toFixed(4), body: +(body - gy).toFixed(4), keaY: +(k.y - gy).toFixed(4),
                 groundLift: M.groundLift, scale: M.scale, restClip: (G.bird || {}).restClip };
      };
    });
    /* 'game': the bird as the game poses it, held in place only */
    await page.evaluate(([x, z]) => { const G = KEAGAME.G, k = G.keas[0];
      const h = () => { try { k.x = x; k.z = z; k.vy = 0; k.grounded = true; k.stun = 0; } catch (e) {} requestAnimationFrame(h); }; requestAnimationFrame(h); }, AT);
    await sleep(1500);
    rows.push({ spot: `${BIOME} ${AT}`, pose: 'game (as shipped)', ...(await page.evaluate('window.__feet()')) });
    /* injected poses */
    await page.evaluate(() => { const k = KEAGAME.G.keas[0]; window.__M = k._model; k._model = null; k._anim = null; });
    for (const [name, p] of POSES) {
      await page.evaluate(({ P, w }) => { const M = window.__M; const by = {}; M.sk.skeleton.bones.forEach(b => by[b.name] = b);
        for (const n in P) { const b = by[n]; if (!b) continue; const v = P[n]; b.position.set(v[0], v[1], v[2]); b.quaternion.set(v[3], v[4], v[5], v[6]); b.scale.set(v[7], v[8], v[9]); }
        if (M.sk.morphTargetInfluences) M.sk.morphTargetInfluences[0] = w; M.root.updateMatrixWorld(true); }, p);
      rows.push({ spot: `${BIOME} ${AT}`, pose: name, ...(await page.evaluate('window.__feet()')) });
    }
    await page.close();
  }
} finally { await browser.close().catch(() => {}); await srv.close(); }

const bad = rows.filter(r => Math.abs(r.soleVis) > TOL);
if (process.env.JSON) console.log(JSON.stringify({ TOL, rows, bad: bad.length }, null, 1));
else {
  console.log(`BIRDFEET ${GLBREL}   ${SPOTS.length} spots   tolerance ±${(TOL * 1000).toFixed(0)} mm   groundLift ${rows[0].groundLift}  scale ${rows[0].scale}  rest ${rows[0].restClip}`);
  for (const r of rows) console.log(`  ${r.spot.padEnd(20)} ${r.pose.padEnd(18)} sole-over-drawn ${(r.soleVis * 1000).toFixed(1).padStart(7)} mm   (drawn ground ${(r.surf * 1000).toFixed(0)} mm over logic; sole-over-logic ${(r.sole * 1000).toFixed(1)}; lowest vertex ${(r.body * 1000).toFixed(1)})` + (Math.abs(r.soleVis) > TOL ? '   <-- ' + (r.soleVis < 0 ? 'SUNK' : 'FLOATING') : ''));
}
console.log(bad.length ? bad.map(r => `    ✗ ${r.spot} ${r.pose}: foot sole ${(r.soleVis * 1000).toFixed(1)} mm from the DRAWN ground`).join('\n') + `\nBIRDFEET: ${bad.length} FINDINGS`
                       : 'BIRDFEET: ALL PASS — feet on the ground in every pose');
process.exit(bad.length ? 1 : 0);
