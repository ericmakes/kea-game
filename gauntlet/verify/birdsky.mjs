/* BIRDSKY — is the bird drawn as a solid animal against the sky? BIRD RENDER FIX, 2026-10-02.

   WHAT IT GUARDS. kea_animated.glb's material arrives as alphaMode BLEND — transparent, no depth
   write, no alpha test — while its base-colour alpha is a true CUTOUT (86% of texels exactly 255,
   9% exactly 0). Drawn as BLEND it fails three ways, all measured by the render spike on this
   renderer type and reproduced here before the fix:
     1. HAZE CONTAMINATION. The horizon haze band (G.haze) is a transparent cylinder centred near the
        world origin; three sorts transparent objects by origin distance, so the haze can draw AFTER
        the bird, and with the bird writing no depth it washes straight over it.
     2. SELF MIS-SORT. One transparent mesh cannot sort its own triangles, so the scarlet underwing
        shows through the folded chest and face.
     3. CULLING. A SkinnedMesh's bounds are the bind pose's; posed by clips they go stale and the
        bird is culled while in view.
   HOW. The real built game, in the capture browser, on the ski field's clean groomed snow. The
   bird is posed at approved_idle (sampled in node from the shipped GLB with three's own
   AnimationMixer and injected by bone NAME, as birdpose.mjs does), the clock is held with
   G.clockPin, and the camera sits LOW — eye 0.18 m above the snow, the bird 0.9 m off — so the
   horizon and the haze band cross the bird. Four angles, 90 degrees apart. At each, three takes
   that differ ONLY in visibility:
     A  everything             B  haze hidden             D  haze AND bird hidden
   mask          = pixels where B and D differ (the bird, and only the bird), ERODED by 2 px to
                   its interior so anti-aliased silhouette pixels are not counted
   contamination = mask pixels where A and B differ: the haze reached a bird pixel
   red           = mask pixels scarlet in A and NOT scarlet in D, so a red sign BEHIND the bird's
                   silhouette edge is not counted as the bird (found at angle 0: 8 px of a disc
                   sign, exactly on the edge). Scarlet is r>140, r>2g, r>2b — calibrated on the
                   canonical renders: side 0, folded_rear 0, head 2 of 1M px, wings_open 15,480
   noise         = interior pixels where two identical takes (A, A2) differ; must be 0 or the
                   measurement is refused, because a live bird makes every other number noise
   THE VERDICT: zero noise, zero contamination, zero red, a non-empty mask at every angle (a culled bird is an
   empty mask), and the live SkinnedMesh must report transparent false, depthWrite true,
   alphaTest > 0, frustumCulled false.
   Usage: node gauntlet/verify/birdsky.mjs [outdir]    KEABIRD='{"url":...}' for a candidate */
import fs from 'fs'; import path from 'path'; import url from 'url';
import * as THREE from 'three';
import sharp from 'sharp';
import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, launch, GAUNTLETSEED } from './webrig.mjs';
globalThis.createImageBitmap = async () => ({ width: 4, height: 4, close() {} });
globalThis.self = { URL: { createObjectURL: () => 'blob:stub', revokeObjectURL() {} } };
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = process.argv[2] || path.join(ROOT, 'gauntlet/capture/birdsky');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const AT = [17, 19], BIOME = 'skifield';
export const RED = (r, g, b) => r > 140 && r > 2 * g && r > 2 * b;

/* the shipped url, read from the specimen so this cannot drift from what the game loads */
const SRC = fs.readFileSync(path.join(ROOT, 'src/game.mjs'), 'utf8');
const shipped = (SRC.match(/\n\s*url:'([^']+\.glb)'/) || [])[1];
let override = {}; try { override = JSON.parse(process.env.KEABIRD || '{}'); } catch (e) {}
const GLBREL = override.url || shipped;

/* ---- approved_idle, sampled in node ---- */
const buf = fs.readFileSync(path.join(ROOT, 'assets', GLBREL));
const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
let sk = null; gltf.scene.traverse(o => { if (o.isSkinnedMesh) sk = o; });
const clip = gltf.animations.find(a => a.name === 'approved_idle');
if (!clip) { console.error('birdsky: no approved_idle in ' + GLBREL); process.exit(2); }
const mixer = new THREE.AnimationMixer(gltf.scene); mixer.clipAction(clip).play(); mixer.setTime(0);
gltf.scene.updateMatrixWorld(true);
const POSE = {}; for (const b of sk.skeleton.bones) POSE[b.name] = [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()];
const W0 = (sk.morphTargetInfluences || [0])[0] || 0;

ensureBuild();
const srv = await serve();
const browser = await launch();
const results = []; let material = null;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  await preparePage(page, { seed: GAUNTLETSEED, biome: BIOME });
  if (override.url) await page.evaluateOnNewDocument(`globalThis.__KEA_BIRD__=Object.assign(globalThis.__KEA_BIRD__||{},${JSON.stringify(override)});`);
  await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(1000);
  await assertBooted(page, { biome: BIOME });
  await page.evaluate('window.AudioContext=undefined; KEAGAME.startGame(1);'); await sleep(400);
  await assertBirdDressed(page);
  await page.evaluate(`(()=>{ KEAGAME.CASEFILES.forEach(c=>c.seen=true); const td=document.getElementById('todo'); if(td)td.style.display='none';
    KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
    /* EVERY DOM OVERLAY IS HIDDEN, EVERY FRAME. This tool measures the WebGL picture and nothing else.
       The first cut hid #feed/.hud once, and a gate run went red at 73.9% 'haze on bird': a caption
       box with a CSS-animated backdrop sat over the bird and faded between the haze-on and haze-off
       takes (FLAKES law 12, TODO 67's wall-clock animation) — the mask showed the caption's letters
       as holes. Re-asserted each frame because popups are created after the stage. */
    { const cv=document.querySelector('canvas'); const _hd=()=>{ try{ for(const el of document.body.children) if(el!==cv&&!el.contains(cv)) el.style.visibility='hidden'; }catch(e){} requestAnimationFrame(_hd); }; requestAnimationFrame(_hd); }
    KEAGAME.G.humans.forEach(h=>{h._park=true;});
    const _pk=()=>{ try{ KEAGAME.G.humans.forEach(h=>{h.x=46;h.z=46;h.home={x:46,z:46};h.patrol=null;h.state='idle';if(h.g)h.g.position.set(46,0,46);}); }catch(e){} requestAnimationFrame(_pk); }; requestAnimationFrame(_pk); })()`);
  material = await page.evaluate(({ P, w, at }) => {
    const G = KEAGAME.G, k = G.keas[0], M = k._model;
    const by = {}; M.sk.skeleton.bones.forEach(b => by[b.name] = b);
    /* THE POSE OWNS THE BONES FOR THE PHOTOGRAPH, and that means BOTH owners stand down: _model is
       rigCommit's handle, _anim is the clip mixer keaAnimDrive updates inside the frame. Nulling only
       _model (birdpose.mjs's idiom, written before the clips were wired) left the mixer re-posing the
       bird every frame, and two identical takes differed on up to 5,154 bird pixels. */
    k._model = null; k._anim = null;
    window.__birdM = M;
    const hold = () => { try {
      for (const n in P) { const b = by[n]; if (!b) continue; const v = P[n];
        b.position.set(v[0], v[1], v[2]); b.quaternion.set(v[3], v[4], v[5], v[6]); b.scale.set(v[7], v[8], v[9]); }
      if (M.sk.morphTargetInfluences) M.sk.morphTargetInfluences[0] = w;
      k.x = at[0]; k.z = at[1]; k.y = KEAGAME.groundHeightAt(at[0], at[1], 1); k.vy = 0; k.grounded = true; k.ry = 1.9; k.stun = 0;
      G.clockPin = 12.0; G.time = 12.0; } catch (e) {} requestAnimationFrame(hold); };
    requestAnimationFrame(hold);
    const m = M.sk.material;
    return { transparent: m.transparent, depthWrite: m.depthWrite, alphaTest: m.alphaTest, alphaHash: !!m.alphaHash,
             side: m.side, frustumCulled: M.sk.frustumCulled };
  }, { P: POSE, w: W0, at: AT });
  const GY = await page.evaluate(`KEAGAME.groundHeightAt(${AT[0]},${AT[1]},1)`);
  const shoot = async (haze, bird) => {
    await page.evaluate(([h, b]) => { const G = KEAGAME.G; if (G.haze) G.haze.visible = h; window.__birdM.root.visible = b; }, [haze, bird]);
    await sleep(350);
    return sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  };
  for (const deg of [0, 90, 180, 270]) {
    const a = 1.9 + deg * Math.PI / 180, d = 0.9;
    /* THE HAZE IS CENTRED ON THE CAMERA — the worst case, staged on purpose. three sorts transparent
       objects by ORIGIN distance; the band's origin is (0,8,0), and on this staging the bird is 0.9 m
       from the camera and the band origin ~25 m, so the band sorts FIRST and cannot wash the bird
       whatever its material — the unfixed bird read 0% here, which proved nothing. Centred on the
       camera (a 206 m cylinder looks the same from its axis) the band sorts LAST, as it does in play
       whenever the camera is nearer the world origin than the bird is. Only depth can stop it then.
       AND THE BAND IS STRETCHED, opacity 1 and 20x taller (elevation about +/-51 deg instead of the
       shipped -1.4..+5.8, which the ridge line hides almost everywhere): with the shipped band the
       unfixed bird ALSO read 0%, because a bird can only be washed where open sky is behind it and
       the band is still visible there. THIS IS A MECHANISM CHECK, NOT A SCENERY PHOTOGRAPH: it asks
       "if a later-sorted transparent covers the sky behind the bird, does the bird stop it?" — the
       one question that decides whether the spike's 63%-washed frames can happen anywhere in play. */
    await page.evaluate(([x, y, z, lx, ly, lz]) => { KEAGAME.G.camLock = { x, y, z, lx, ly, lz };
      const H = KEAGAME.G.haze; if (H) { H.position.set(x, 8, z); H.scale.y = 20; H.material.opacity = 1; } },
      [AT[0] + Math.sin(a) * d, GY + 0.18, AT[1] + Math.cos(a) * d, AT[0], GY + 0.26, AT[1]]);
    await sleep(500);
    /* A2 is taken AFTER B, so the A-vs-A2 noise control BRACKETS the haze-off take: anything that
       drifts while B is shot — a fading caption, a live pose, a clock — shows as noise and the
       measurement refuses itself, instead of reading as haze on the bird. Taken right after A it
       could not see a slow fade, and a gate run proved it. */
    const A = await shoot(true, true), B = await shoot(false, true), A2 = await shoot(true, true), D = await shoot(false, false);
    const n = A.info.width * A.info.height, dif = (p, q, i) => Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]));
    /* THE BIRD'S INTERIOR, not its silhouette. The mask is eroded by TWO pixels before anything is
       counted: an anti-aliased edge pixel is part bird and part background by construction, so when
       the background changes the edge pixel changes too, and that is not haze drawn OVER the bird.
       Measured on the fixed bird before this was added: 82 and 154 residual pixels at two angles,
       every one of them on the 1 px edge, none within 2 px of it, none interior. One px erosion then
       left a single pixel at the BILL TIP, a sub-pixel feature whose faint anti-aliased edge fell
       below the mask threshold and so did not count as edge; two px covers it. */
    const W = A.info.width, Hh = A.info.height, M = new Uint8Array(n);
    for (let j = 0; j < n; j++) M[j] = dif(B.data, D.data, j * 3) > 12 ? 1 : 0;
    const interior = j => { if (!M[j]) return false; const x = j % W, y = (j / W) | 0;
      if (x < 2 || y < 2 || x >= W - 2 || y >= Hh - 2) return false;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!M[j + dy * W + dx]) return false; return true; };
    let mask = 0, contam = 0, red = 0, noise = 0; const vis = Buffer.alloc(n * 3);
    for (let j = 0; j < n; j++) { const i = j * 3;
      vis[i] = vis[i + 1] = vis[i + 2] = A.data[i + 1] >> 2;
      if (!interior(j)) continue; mask++;
      if (dif(A.data, A2.data, i) > 6) noise++;
      const c = dif(A.data, B.data, i) > 6, r = RED(A.data[i], A.data[i + 1], A.data[i + 2]) && !RED(D.data[i], D.data[i + 1], D.data[i + 2]);
      if (c) contam++; if (r) red++;
      vis[i] = c ? 80 : A.data[i]; vis[i + 1] = c ? 160 : A.data[i + 1]; vis[i + 2] = c ? 255 : A.data[i + 2];
      if (r) { vis[i] = 255; vis[i + 1] = 0; vis[i + 2] = 255; } }
    await sharp(A.data, { raw: { width: A.info.width, height: A.info.height, channels: 3 } }).png().toFile(path.join(OUT, `angle${deg}.png`));
    await sharp(vis, { raw: { width: A.info.width, height: A.info.height, channels: 3 } }).png().toFile(path.join(OUT, `angle${deg}_mask.png`));
    results.push({ deg, mask, contam, contamPct: mask ? +(100 * contam / mask).toFixed(2) : null, red, noise });
  }
} finally { await browser.close().catch(() => {}); await srv.close(); }

const fails = [];
for (const r of results) {
  if (!r.mask) fails.push(`angle ${r.deg}: the bird drew NO pixels (culled, or never drawn)`);
  if (r.contam) fails.push(`angle ${r.deg}: haze reached ${r.contam} of ${r.mask} bird pixels (${r.contamPct}%)`);
  if (r.noise) fails.push(`angle ${r.deg}: two identical takes differ on ${r.noise} bird pixels — the stage is live, nothing else here can be trusted`);
  if (r.red) fails.push(`angle ${r.deg}: ${r.red} scarlet pixels on the folded bird at approved_idle`);
}
if (material.transparent) fails.push('the bird material is transparent (BLEND) — its alpha is a cutout and must be a MASK');
if (!material.depthWrite) fails.push('the bird material writes no depth');
if (!(material.alphaTest > 0) && !material.alphaHash) fails.push('the bird material has neither alphaTest nor alphaHash');
if (material.frustumCulled) fails.push('the skinned mesh is frustum-culled against stale bind-pose bounds');
console.log('BIRDSKY ' + GLBREL + '   material ' + JSON.stringify(material));
for (const r of results) console.log(`  angle ${String(r.deg).padStart(3)}   bird ${String(r.mask).padStart(6)} px   haze on bird ${String(r.contam).padStart(6)} (${r.contamPct}%)   red ${r.red}   noise(A vs A2) ${r.noise}`);
/* THE GATE'S CONTRACT (gate.sh): an ALL PASS line and exit 0, or FINDINGS with a cross per finding and exit 1. */
console.log(fails.length ? fails.map(f => '    ✗ ' + f).join('\n') + '\nBIRDSKY: ' + fails.length + ' FINDINGS'
                         : 'BIRDSKY: ALL PASS — solid against the sky from four angles, no haze, no red, never culled');
process.exit(fails.length ? 1 : 0);
