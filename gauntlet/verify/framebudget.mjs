/* FRAMEBUDGET — ms per frame with THE WHOLE GAME RUNNING, on the real GPU. SPIKE ADOPTION, 2026-10-02.

   WHY A NEW INSTRUMENT. Eric's ruling on adopting the render spike is that every piece holds 60 fps
   WITH the full game running, and that the spike's 11-14 ms for ONE STATIC CARPARK is the warning.
   Nothing in this tree measured that:
     perf.mjs loop-times the SCENE render (no post, no game update, no AI) in headless Chrome, which
       is the right tool for comparing two grass tiers and the wrong one for "does the game hold 60".
     headless rAF is a fixed cadence that does not move when the work grows tenfold (perf.mjs header).
   So this boots the BUILT game in a HEADFUL system Chrome — a real window, a real compositor, Metal
   via ANGLE — starts a game, and FLIES THE BIRD round a circuit by real input (press/release), so
   the follow camera, the shadow frustum, the grass anchor, the humans, the traffic and the post
   stack are all live. Nothing is pinned. Then two readings, each in its own browser:
     vsync     rAF deltas for SECS seconds at the display's refresh: fps, frames over 1.5x the
               interval (a visible hitch), p99. This is "does it hold 60".
     unlocked  --disable-gpu-vsync --disable-frame-rate-limit: the rAF delta is now the real cost of
               a frame, CPU and GPU together. Median and mean ms. This is the BUDGET figure, and the
               one a piece is refused on: the brief's line is 16.7 ms, and a piece whose unlocked
               MEAN crosses it cannot hold 60 however vsync happens to hide it on a quiet run.
   THE WINDOW MUST NOT BE THROTTLED, which macOS does to an occluded window: the three
   --disable-*-backgrounding flags keep it honest, and the page reports document.visibilityState so a
   run that measured a hidden tab says so instead of reporting a beautiful nothing.
   IT PROVES IT DREW: renderer.info.render.frame must advance by about as many frames as rAF fired,
   and the GPU string is reported, so a run that fell back to SwiftShader cannot pass as a Metal one.

   Usage: node gauntlet/verify/framebudget.mjs            env: W H DPR SECS BIOME MODES=vsync,unlocked
          JSON=1 for machine output; LABEL=<text> tags the run; NOPOST=1 etc pass through webrig. */
import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, GAUNTLETSEED } from './webrig.mjs';

const W = +(process.env.W || 1920), H = +(process.env.H || 1080), DPR = +(process.env.DPR || 1);
const SECS = +(process.env.SECS || 10), WARM = +(process.env.WARM || 3);
const BIOME = process.env.BIOME || 'carpark';
const MODES = (process.env.MODES || 'vsync,unlocked').split(',').filter(Boolean);
export const BUDGET_MS = 1000 / 60;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launchHeadful(unlocked) {
  const p = (await import('puppeteer')).default;
  const args = ['--no-sandbox', `--window-size=${W},${H + 120}`, '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--ignore-gpu-blocklist'];
  if (unlocked) args.push('--disable-gpu-vsync', '--disable-frame-rate-limit');
  const opts = { headless: false, defaultViewport: null, args };
  try { return await p.launch({ ...opts, channel: 'chrome' }); } catch (e) { return await p.launch(opts); }
}

/* the circuit: hold forward, alternate a turn every 1.6 s, flap in bursts so the bird climbs and
   glides — the camera, the shadow frustum and the grass field all move every frame */
const DRIVE = `(()=>{ const K=KEAGAME, M=K.P1MAP||{fwd:'KeyW',left:'KeyA',right:'KeyD',flap:'Space'};
  K.press(M.fwd); let t=0;
  window.__drive=setInterval(()=>{ t++;
    if(t%16===0){ K.release(M.left); K.release(M.right); K.press((t/16)%2?M.left:M.right); }
    if(t%30<6)K.press(M.flap); else K.release(M.flap);
  },100); })()`;

async function measure(mode) {
  const browser = await launchHeadful(mode === 'unlocked');
  try {
    const page = (await browser.pages())[0] || await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
    await preparePage(page, { seed: GAUNTLETSEED, biome: BIOME });
    await page.goto(SRV.origin, { waitUntil: 'load' }); await sleep(1000);
    await assertBooted(page, { biome: BIOME });
    await page.evaluate('KEAGAME.startGame(1); KEAGAME.CASEFILES&&KEAGAME.CASEFILES.forEach(c=>c.seen=true); KEAGAME.G.cfOpen=false;');
    await assertBirdDressed(page);
    await page.bringToFront();
    await page.evaluate(DRIVE);
    await sleep(WARM * 1000);
    const r = await page.evaluate((secs) => new Promise(res => {
      const G = KEAGAME.G, gl = G.renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const f0 = G.renderer.info.render.frame, dt = []; let last = performance.now(); const t0 = last;
      const tick = (now) => { dt.push(now - last); last = now;
        if (now - t0 < secs * 1000) requestAnimationFrame(tick);
        else { const s = dt.slice(1).sort((a, b) => a - b), n = s.length, q = p => s[Math.min(n - 1, Math.floor(n * p))];
          const mean = s.reduce((a, b) => a + b, 0) / n;
          res({ gpu, vis: document.visibilityState, frames: n, renders: G.renderer.info.render.frame - f0,
                fps: +(1000 / mean).toFixed(1), meanMs: +mean.toFixed(2), medianMs: +q(0.5).toFixed(2),
                p95Ms: +q(0.95).toFixed(2), p99Ms: +q(0.99).toFixed(2), maxMs: +s[n - 1].toFixed(2),
                over25: s.filter(x => x > 25).length,
                px: G.renderer.domElement.width + 'x' + G.renderer.domElement.height,
                calls: G.renderer.info.render.calls, tris: G.renderer.info.render.triangles,
                keaMoved: !!(G.keas && G.keas[0] && (Math.abs(G.keas[0].x) + Math.abs(G.keas[0].z) > 0.5)),
                post: !!G.post || !!G.composer }); } };
      requestAnimationFrame(tick);
    }), SECS);
    return { mode, ...r };
  } finally { await browser.close().catch(() => {}); }
}

ensureBuild();
const SRV = await serve();
const out = [];
for (const m of MODES) out.push(await measure(m));
await SRV.close();
let refuse = [];
for (const r of out) {
  if (/swiftshader|software|llvmpipe/i.test(r.gpu)) refuse.push(r.mode + ': software renderer (' + r.gpu + ')');
  if (r.vis !== 'visible') refuse.push(r.mode + ': page was ' + r.vis + ', so rAF was throttled');
  if (r.renders < r.frames * 0.9) refuse.push(r.mode + ': only ' + r.renders + ' renders for ' + r.frames + ' rAF ticks');
}
const unl = out.find(r => r.mode === 'unlocked'), vs = out.find(r => r.mode === 'vsync');
const verdict = refuse.length ? 'INVALID' : (unl ? (unl.meanMs <= BUDGET_MS ? 'IN BUDGET' : 'OVER BUDGET') : (vs.fps >= 59 ? 'HOLDS 60' : 'DROPS'));
if (process.env.JSON) console.log(JSON.stringify({ label: process.env.LABEL || null, W, H, DPR, BIOME, SECS, out, verdict, refuse }, null, 1));
else {
  console.log(`FRAMEBUDGET ${process.env.LABEL ? '[' + process.env.LABEL + '] ' : ''}${W}x${H} @${DPR}x  ${BIOME}  ${SECS}s live play, bird flying`);
  for (const r of out) console.log(`  ${r.mode.padEnd(9)} ${String(r.fps).padStart(6)} fps  mean ${r.meanMs} ms  median ${r.medianMs}  p95 ${r.p95Ms}  p99 ${r.p99Ms}  max ${r.maxMs}  >25ms ${r.over25}/${r.frames}  ` +
    `fb ${r.px}  ${r.calls} calls  ${(r.tris / 1e6).toFixed(2)}M tris  moved:${r.keaMoved}  ${r.gpu}`);
  console.log(`  budget ${BUDGET_MS.toFixed(2)} ms -> ${verdict}` + (refuse.length ? '  REFUSED: ' + refuse.join('; ') : ''));
}
process.exit(verdict === 'INVALID' || verdict === 'OVER BUDGET' ? 1 : 0);
