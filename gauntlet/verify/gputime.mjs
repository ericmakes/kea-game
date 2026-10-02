/* GPUTIME — what a frame actually costs the GPU and the main thread, with the bird flying, separate
   from when the browser chooses to start the next frame. framebudget.mjs reads rAF deltas, and in a
   headful window those are quantised by the compositor (median 19.5, p95 39.0 — two intervals), so a
   step that saves GPU time can read as no change at all. This times the frame's render() directly:
     cpu   performance.now() round the game's render call (submission, including any GL stall)
     gpu   EXT_disjoint_timer_query_webgl2 round the same call, if the browser exposes it
   Usage: node gauntlet/verify/gputime.mjs     env: W H SECS */
import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, GAUNTLETSEED } from './webrig.mjs';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080), SECS = +(process.env.SECS || 8);
const sleep = ms => new Promise(r => setTimeout(r, ms));
ensureBuild(); const srv = await serve();
const p = (await import('puppeteer')).default;
const b = await p.launch({ headless: false, channel: 'chrome', defaultViewport: null, args: ['--no-sandbox', `--window-size=${W},${H + 120}`, '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--enable-webgl-draft-extensions'] });
try {
  const pg = (await b.pages())[0]; await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await preparePage(pg, { seed: GAUNTLETSEED, biome: process.env.BIOME || 'carpark' }); await pg.goto(srv.origin, { waitUntil: 'load' }); await sleep(1000);
  await assertBooted(pg, { biome: process.env.BIOME || 'carpark' }); await pg.evaluate('KEAGAME.startGame(1)'); await assertBirdDressed(pg); await pg.bringToFront();
  await pg.evaluate(`(()=>{ const K=KEAGAME,M=K.P1MAP; K.press(M.fwd); let t=0; setInterval(()=>{ t++; if(t%16===0){K.release(M.left);K.release(M.right);K.press((t/16)%2?M.left:M.right);} if(t%30<6)K.press(M.flap); else K.release(M.flap); },100); })()`);
  await sleep(3000);
  const r = await pg.evaluate((secs) => new Promise(res => {
    const G = KEAGAME.G, gl = G.renderer.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const cpu = [], gpu = [], pend = []; const post = G.post; const inner = post.render.bind(post);
    post.render = (...a) => { let q = null; if (ext) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); }
      const t0 = performance.now(); inner(...a); cpu.push(performance.now() - t0);
      if (q) { gl.endQuery(ext.TIME_ELAPSED_EXT); pend.push(q); } };
    const t0 = performance.now(), dt = []; let last = t0;
    const tick = (n) => { dt.push(n - last); last = n;
      for (let i = pend.length - 1; i >= 0; i--) { const q = pend[i];
        if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) && !gl.getParameter(ext.GPU_DISJOINT_EXT)) { gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); gl.deleteQuery(q); pend.splice(i, 1); } }
      if (n - t0 < secs * 1000) requestAnimationFrame(tick); else { post.render = inner;
        const st = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? { mean: +(s.reduce((x, y) => x + y, 0) / n).toFixed(2), median: +s[n >> 1].toFixed(2), p95: +s[Math.floor(n * 0.95)].toFixed(2), n } : null; };
        res({ ext: !!ext, raf: st(dt.slice(1)), cpu: st(cpu), gpu: st(gpu) }); } };
    requestAnimationFrame(tick); }), SECS);
  console.log(`GPUTIME ${W}x${H}  timer query ${r.ext ? 'available' : 'NOT available'}`);
  for (const k of ['raf', 'cpu', 'gpu']) if (r[k]) console.log(`  ${k.padEnd(4)} mean ${r[k].mean} ms  median ${r[k].median}  p95 ${r[k].p95}  (${r[k].n})`);
} finally { await b.close().catch(() => {}); await srv.close(); }
