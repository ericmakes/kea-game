/* BIRDCOLOUR — the bird in the game against its approved render: bronze and dark rims. SPIKE_ADOPT row 5,
   2026-10-03. The measuring is framescore.mjs's (birdProps / birdBand / birdScore); this shoots it.

   HOW. The real built game, kea 0 held at approved_idle (sampled in node, injected by bone name, both
   owners stood down — trample.mjs's staging) on OPEN SEAL: a spot whose drawn ground is the 0.14 m slab
   for 6 m round and no car within 5 m, found at run time. On tussock the body mask holes wherever a
   bronze feather sits over a bronze blade (measured: blotched masks, rim read 0.33). A fixed camera
   (G.camLock) at the canonical render's own rear-quarter elevation, 1.4 m off, 26 degree lens, at three
   azimuths round the back so the sun falls three ways across the wings. Per angle: the bird as drawn,
   the bird keyed flat magenta (the mask, eroded 2 px), and the bird as drawn again, which must match
   the first or the reading refuses itself. The bird's cast shadow and blob are off.
   VERDICT per heading: hue, sat and rim in the canonical render's band (framescore.mjs). Exit 1 if any
   property is out at any heading — the look piece may not take the bird's bronze out of its band.
   CONTROL=1 greys the bird's material at runtime (saturation to zero) and must FAIL on sat.
   Usage: node gauntlet/verify/birdcolour.mjs [outdir]     HEADINGS='0,1.6'  CONTROL=1  JSON=1 */
import fs from 'fs'; import path from 'path'; import url from 'url';
import * as THREE from 'three';
import sharp from 'sharp';
import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, launch, GAUNTLETSEED } from './webrig.mjs';
import { birdProps, birdBand, birdScore, erode, BIRDREF } from './framescore.mjs';
globalThis.createImageBitmap = async () => ({ width: 4, height: 4, close() {} });
globalThis.self = { URL: { createObjectURL: () => 'blob:stub', revokeObjectURL() {} } };
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = process.argv[2] || path.join(ROOT, 'gauntlet/capture/birdcolour');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const HEADINGS = (process.env.HEADINGS || '-0.5,0,0.5').split(',').map(Number);   // camera azimuth off dead-behind, radians
const CONTROL = process.env.CONTROL === '1';

const SRC = fs.readFileSync(path.join(ROOT, 'src/game.mjs'), 'utf8');
const GLBREL = (SRC.match(/\n\s*url:'([^']+\.glb)'/) || [])[1];
const buf = fs.readFileSync(path.join(ROOT, 'assets', GLBREL));
const gltf = await new Promise((res, rej) => new GLTFLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
let sk = null; gltf.scene.traverse(o => { if (o.isSkinnedMesh) sk = o; });
const mixer = new THREE.AnimationMixer(gltf.scene); mixer.clipAction(gltf.animations.find(a => a.name === 'approved_idle')).play(); mixer.setTime(0);
gltf.scene.updateMatrixWorld(true);
const POSE = {}; for (const b of sk.skeleton.bones) POSE[b.name] = [...b.position.toArray(), ...b.quaternion.toArray(), ...b.scale.toArray()];
const W0 = (sk.morphTargetInfluences || [0])[0] || 0;

/* the reference, scaled so its body has the game bird's area (see birdBand); set after the first take */
let B = null;
const bandAt = async (area) => { const ref = await sharp(BIRDREF).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const B0 = birdBand({ w: ref.info.width, h: ref.info.height, buf: ref.data }), s = Math.sqrt(area / B0.ref.n);
  const W2 = Math.round(ref.info.width * s), H2 = Math.round(ref.info.height * s);
  const sm = await sharp(BIRDREF).removeAlpha().resize(W2, H2, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const b = birdBand({ w: W2, h: H2, buf: sm.data }); b.scale = +s.toFixed(3); return b; };
ensureBuild();
const srv = await serve(); const browser = await launch();
const results = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await preparePage(page, { seed: GAUNTLETSEED, biome: 'carpark' });
  await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(1000);
  await assertBooted(page, { biome: 'carpark' });
  await page.evaluate('window.AudioContext=undefined; KEAGAME.startGame(1);'); await sleep(400);
  await assertBirdDressed(page);
  const SPOT = await page.evaluate(() => { for (let r = 0; r < 60; r++) for (let a = 0; a < 6.28; a += 0.2) { const x = r * Math.cos(a), z = r * Math.sin(a);
      if ([[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [0, -6], [3, -6], [-3, -6]].every(([dx, dz]) => Math.abs(KEAGAME.drawnGroundAt(x + dx, z + dz) - 0.14) < 0.004)
          && !KEAGAME.G.cars.some(c => Math.hypot(c.x - x, c.z - z) < 5)) return [+x.toFixed(2), +z.toFixed(2)]; } return null; });
  if (!SPOT) throw new Error('birdcolour: no open seal spot in the carpark');
  await page.evaluate(({ P, w, CONTROL, SPOT }) => {
    KEAGAME.CASEFILES.forEach(c => c.seen = true); const td = document.getElementById('todo'); if (td) td.style.display = 'none';
    KEAGAME.G.cfOpen = false; KEAGAME.G.paused = false;
    { const cv = document.querySelector('canvas'); const _hd = () => { try { for (const el of document.body.children) if (el !== cv && !el.contains(cv)) el.style.visibility = 'hidden'; } catch (e) {} requestAnimationFrame(_hd); }; requestAnimationFrame(_hd); }
    const G = KEAGAME.G, k = G.keas[0], M = k._model;
    if (G.trafT) { G.trafT.a = 999; G.trafT.b = 999; }
    for (let i = G.cars.length - 1; i >= 0; i--) { const c = G.cars[i]; if (!c.traffic) continue;
      G.scene.remove(c.g); const ci = G.colliders.indexOf(c.collider); if (ci >= 0) G.colliders.splice(ci, 1);
      for (let q = G.inter.length - 1; q >= 0; q--) if (G.inter[q].car === c) G.inter.splice(q, 1); G.cars.splice(i, 1); }
    { const _tr = () => { try { G.trafT.a = 999; G.trafT.b = 999;
        for (const sh of G.sheep || []) { sh.x = -48; sh.z = -48; sh.home = { x: -48, z: -48 }; if (sh.g) sh.g.position.set(-48, sh.g.position.y, -48); }
        G.humans.forEach(h => { h.x = 46; h.z = 46; h.home = { x: 46, z: 46 }; h.patrol = null; h.state = 'idle'; if (h.g) h.g.position.set(46, 0, 46); }); } catch (e) {} requestAnimationFrame(_tr); }; requestAnimationFrame(_tr); }
    const by = {}; M.sk.skeleton.bones.forEach(b => by[b.name] = b);
    k._model = null; k._anim = null; window.__birdM = M; window.__at = { x: SPOT[0], z: SPOT[1], ry: 0, cam: 0 };
    M.root.traverse(o => { if (o.isMesh) o.castShadow = false; }); if (k.shadowM) k.shadowM.visible = false;
    if (CONTROL) M.root.traverse(o => { if (o.isMesh && o.material) { const m = o.material; m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
      '#include <map_fragment>\n diffuseColor.rgb = vec3(dot(diffuseColor.rgb, vec3(0.2126,0.7152,0.0722)));'); }; m.customProgramCacheKey = () => 'grey'; m.needsUpdate = true; } });
    for (const c of G.cams) { c.fov = 26; c.updateProjectionMatrix(); }
    const hold = () => { try {
      for (const n in P) { const b = by[n]; if (!b) continue; const v = P[n]; b.position.set(v[0], v[1], v[2]); b.quaternion.set(v[3], v[4], v[5], v[6]); b.scale.set(v[7], v[8], v[9]); }
      if (M.sk.morphTargetInfluences) M.sk.morphTargetInfluences[0] = w;
      const a = window.__at; k.x = a.x; k.z = a.z; k.y = KEAGAME.groundHeightAt(a.x, a.z, 1); k.vy = 0; k.grounded = true; k.ry = a.ry; k.stun = 0;
      k.idleT = 0; k.idleAct = null; G.clockPin = 12.0; G.time = 12.0;
      /* behind is +z at ry 0 (measured: a camera at -z photographs the chest); the canonical rear
         camera is (0.55, 0.18, -1) in the package's own frame */
      const az = a.cam, d = 1.8, el = 0.18 / Math.hypot(0.55, 1);
      G.camLock = { x: a.x + Math.sin(az) * d, y: k.y + 0.28 + el * d, z: a.z + Math.cos(az) * d, lx: a.x, ly: k.y + 0.28, lz: a.z };
      for (const c of G.cams) if (c.fov !== 26) { c.fov = 26; c.updateProjectionMatrix(); } } catch (e) {} requestAnimationFrame(hold); };
    requestAnimationFrame(hold);
  }, { P: POSE, w: W0, CONTROL, SPOT });
  /* THE MASK IS A KEYED TAKE, not visible-minus-hidden: that difference also catches the GTAO contact
     shade the bird lays on the asphalt round its feet (measured: a grey apron under the bird read as
     body). The key take draws every bird mesh in flat magenta, so the mask is exactly the body. */
  const shoot = async (bird, key) => { await page.evaluate(([b, key]) => { const R = window.__birdM.root; R.visible = b;
      R.traverse(o => { if (!o.isMesh) return; if (key) { if (!o.userData.__m) { o.userData.__m = o.material;
          o.material = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide }); } }   // no map: magenta x a dark feather is not magenta
        else if (o.userData.__m) { o.material = o.userData.__m; delete o.userData.__m; } }); }, [bird, key]); await sleep(350);
    return sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true }); };
  /* the key survives the WHOLE post chain, tone mapper and grade included: AgX pulls a flat magenta a long
     way toward grey (measured: the strict 2g+30 test kept 7k of 71k body px), so the test is only that red
     AND blue both stand 25 levels clear of green — no bronze (b < g), sky (r < g) or red paint (b < g) can */
  const KEYPX = (d, i) => d[i] > d[i + 1] + 25 && d[i + 2] > d[i + 1] + 25;
  for (const ry of HEADINGS) {
    await page.evaluate(ry => { window.__at.cam = ry; }, ry); await sleep(1200);
    for (let take = 1; take <= 3; take++) {
      const A = await shoot(true, false), K = await shoot(true, true), A2 = await shoot(true, false);
      const W = A.info.width, H = A.info.height, n = W * H, m0 = new Uint8Array(n);
      const dif = (p, q, i) => Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]));
      for (let j = 0; j < n; j++) m0[j] = KEYPX(K.data, j * 3) ? 1 : 0;
      const M = erode(m0, W, H, 2);
      let mask = 0, noise = 0; for (let j = 0; j < n; j++) if (M[j]) { mask++; if (dif(A.data, A2.data, j * 3) > 6) noise++; }
      if (noise && take < 3) continue;
      if (!B) B = await bandAt(mask);
      const p = birdProps(A.data, W, H, M), s = birdScore(p, B);
      const vis = Buffer.alloc(n * 3); for (let j = 0; j < n; j++) for (let c = 0; c < 3; c++) vis[j * 3 + c] = M[j] ? A.data[j * 3 + c] : A.data[j * 3 + c] >> 2;
      await sharp(vis, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(OUT, `${CONTROL ? 'control_' : ''}h${ry}.png`));
      results.push({ ry, mask, noise, take, p, s }); break; }
  }
} finally { await browser.close().catch(() => {}); await srv.close(); }

const fails = [], f3 = v => v == null ? '—' : v.toFixed(3);
for (const r of results) {
  if (r.mask < 2000) fails.push(`camera ${r.ry}: the bird drew only ${r.mask} px`);
  if (r.noise) fails.push(`camera ${r.ry}: ${r.noise} bird pixels differ between identical takes — refused`);
  if (!r.p) { fails.push(`camera ${r.ry}: no reading (body mask ${r.mask} px)`); continue; }
  for (const x of r.s.rows) if (!x.ok) fails.push(`camera ${r.ry}: ${x.k} ${x.k === 'hue' ? x.gv.toFixed(1) : f3(x.gv)} is outside the approved render's band [${x.k === 'hue' ? x.lo.toFixed(0) + ' … ' + x.hi.toFixed(0) : f3(x.lo) + ' … ' + f3(x.hi)}]`);
}
console.log(`BIRDCOLOUR ${CONTROL ? '[CONTROL: bird greyed] ' : ''}carpark seal, approved_idle, rear-quarter camera 1.4 m, 26 deg, against ${path.basename(BIRDREF)}`);
if (B) console.log(`  reference (scaled x${B.scale} to the game bird)  hue ${B.ref.hue.toFixed(1)}  sat ${f3(B.ref.sat)}  rim ${f3(B.ref.rim)}  (luma ${f3(B.ref.luma)}, not judged)   band hue ${B.band.hue.lo.toFixed(0)}…${B.band.hue.hi.toFixed(0)}  sat ${f3(B.band.sat.lo)}…${f3(B.band.sat.hi)}  rim ${f3(B.band.rim.lo)}…${f3(B.band.rim.hi)}`);
for (const r of results) console.log(`  camera ${String(r.ry).padEnd(5)} ${String(r.mask).padStart(6)} px   hue ${r.p ? r.p.hue.toFixed(1) : '—'}  sat ${f3(r.p && r.p.sat)}  rim ${f3(r.p && r.p.rim)}  luma ${f3(r.p && r.p.luma)}   ${r.s.inCount}/${r.s.judged}` + (r.take > 1 ? `  (take ${r.take})` : ''));
if (process.env.JSON) console.log(JSON.stringify(results.map(r => ({ ry: r.ry, mask: r.mask, ...r.p, in: r.s.inCount }))));
console.log(fails.length ? fails.map(f => '    ✗ ' + f).join('\n') + `\nBIRDCOLOUR: ${fails.length} FINDINGS` : 'BIRDCOLOUR: ALL PASS — the bird\'s bronze and rims are inside the approved render\'s band');
process.exit(fails.length ? 1 : 0);
