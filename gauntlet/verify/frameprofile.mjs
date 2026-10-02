import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, GAUNTLETSEED } from './webrig.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
ensureBuild(); const srv = await serve();
const p = (await import('puppeteer')).default;
const b = await p.launch({ headless: false, channel: 'chrome', defaultViewport: null, args: ['--no-sandbox', '--window-size=1920,1200', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
try {
  const pg = (await b.pages())[0]; await pg.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await preparePage(pg, { seed: GAUNTLETSEED, biome: 'carpark' }); await pg.goto(srv.origin, { waitUntil: 'load' }); await sleep(1000);
  await assertBooted(pg, { biome: 'carpark' }); await pg.evaluate('KEAGAME.startGame(1)'); await assertBirdDressed(pg); await pg.bringToFront();
  await pg.evaluate(`(()=>{ const K=KEAGAME,M=K.P1MAP; K.press(M.fwd); let t=0; setInterval(()=>{ t++; if(t%16===0){K.release(M.left);K.release(M.right);K.press((t/16)%2?M.left:M.right);} if(t%30<6)K.press(M.flap); else K.release(M.flap); },100); })()`);
  await sleep(4000);
  const cdp = await pg.target().createCDPSession();
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  const frames = await pg.evaluate(() => new Promise(res => { const d = []; let l = performance.now(); const t0 = l; const f = n => { d.push([+(n - t0).toFixed(1), +(n - l).toFixed(1)]); l = n; if (n - t0 < 8000) requestAnimationFrame(f); else res(d); }; requestAnimationFrame(f); }));
  const { profile } = await cdp.send('Profiler.stop');
  // self time per function
  const self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n]));
  const dts = profile.timeDeltas; let tot = 0;
  profile.samples.forEach((id, i) => { const n = byId.get(id); const k = n.callFrame.functionName + ' ' + (n.callFrame.url.split('/').pop()) + ':' + n.callFrame.lineNumber; const dt = dts[i] || 0; tot += dt; self.set(k, (self.get(k) || 0) + dt); });
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log('total sampled ms', (tot / 1000).toFixed(0));
  for (const [k, v] of top) console.log(String((v / 1000).toFixed(1)).padStart(8), 'ms', (100 * v / tot).toFixed(1).padStart(5) + '%', k);
  const ds = frames.map(f => f[1]).slice(1).sort((a, b) => a - b); const n = ds.length;
  console.log('frames', n, 'mean', (ds.reduce((a, b) => a + b, 0) / n).toFixed(1), 'median', ds[n >> 1], 'p90', ds[Math.floor(n * 0.9)], 'p99', ds[Math.floor(n * 0.99)]);
  console.log('long frames (t, dt):', frames.filter(f => f[1] > 45).slice(0, 30).map(f => f.join('/')).join(' '));
} finally { await b.close().catch(() => {}); await srv.close(); }
