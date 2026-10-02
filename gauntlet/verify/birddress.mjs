/* BIRDDRESS — does the shipped bird come out of GLTFLoader with its texture ON, in the capture
   browser? Added 2026-10-02, SPIKE ADOPTION piece 0.

   WHY THIS IS ITS OWN TOOL AND NOT A CAPTURE PASS. BIRD_STATE.md §7 found that the 4096-square PNGs
   inside kea_animated.glb come back from the loader with NO MAP in headless Chrome, and
   webrig.assertBirdDressed() now refuses to shoot when that happens. A fix to that is only a fix if
   it is tested against the RED first, so this boots the real built bundle exactly as capture.mjs
   does (same seed, same boot, same assert) and reports the verdict per run, plus what the loader
   actually handed back: map size, normal map size, and every console line the page wrote.
   KEABIRD='{"url":"..."}' points it at a candidate file without a code edit, which is how the
   repro (4096 approved) and the fix (derived 2048) are run through one unchanged instrument.

   Usage: RUNS=3 node gauntlet/verify/birddress.mjs                 the shipped url
          KEABIRD='{"url":"models/...glb"}' node gauntlet/verify/birddress.mjs   a candidate
   Exit 0 only if EVERY run is dressed. */
import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, launch, GAUNTLETSEED } from './webrig.mjs';

const RUNS = +(process.env.RUNS || 3);
/* PAR runs that many browsers AT ONCE. The original red (BIRD_STATE.md §7) was met mid-sweep, not on a
   quiet machine, and a quiet machine decodes the 4096 PNGs every time — so pressure is part of the
   repro, and this is the honest way to apply it without inventing a failure. */
const PAR = +(process.env.PAR || 1);
const sleep = ms => new Promise(r => setTimeout(r, ms));
ensureBuild();
const srv = await serve();
let bad = 0;
async function one(i) {
  const browser = await launch();
  const logs = [];
  let verdict = null, info = null;
  try {
    const page = await browser.newPage();
    page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 240)));
    page.on('pageerror', e => logs.push('pageerror: ' + String(e.message).slice(0, 240)));
    await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
    await preparePage(page, { seed: GAUNTLETSEED, biome: 'carpark' });
    await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(1000);
    await assertBooted(page, { biome: 'carpark' });
    await page.evaluate('window.AudioContext=undefined; KEAGAME.startGame(1);'); await sleep(500);
    try { verdict = await assertBirdDressed(page); } catch (e) { verdict = 'REFUSED: ' + e.message.split('—')[0].trim(); }
    info = await page.evaluate(() => {
      const G = (globalThis.KEAGAME || {}).G || {}, k = (G.keas || [])[0] || {};
      const m = k._model && k._model.sk && k._model.sk.material;
      const sz = t => t && t.image ? (t.image.width || 0) + 'x' + (t.image.height || 0) : 'none';
      return { url: (G.bird || {}).url, mode: (G.bird || {}).mode, map: sz(m && m.map), normal: sz(m && m.normalMap),
               rough: sz(m && m.roughnessMap), transparent: m && m.transparent, alphaTest: m && m.alphaTest };
    });
  } finally { await browser.close().catch(() => {}); }
  const ok = verdict === 'dressed';
  if (!ok) bad++;
  console.log(`run ${i}/${RUNS}: ${ok ? 'DRESSED' : 'NOT DRESSED'}  ${JSON.stringify(info)}  verdict=${verdict}`);
  for (const l of logs.filter(l => /error|warn|texture|image|GLTF|bird/i.test(l) && !/favicon|404/.test(l)).slice(0, 8)) console.log('    ' + l);
}
for (let i = 1; i <= RUNS; i += PAR)
  await Promise.all(Array.from({ length: Math.min(PAR, RUNS - i + 1) }, (_, j) => one(i + j)));
await srv.close();
console.log(bad ? `BIRDDRESS: RED — ${bad} of ${RUNS} runs came back undressed` : `BIRDDRESS: GREEN — ${RUNS} of ${RUNS} dressed`);
process.exit(bad ? 1 : 0);
