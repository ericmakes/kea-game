/* THE WEB RIG — REPLAT P1 step 4 (2026-09-03).

   Everything the browser-side tools (capture, probe, motion, journey) need in order to photograph
   a BUILT bundle instead of a single HTML file. It exists because the port broke the same three
   assumptions in all four of them, and fixing them four times would have left four copies to drift.

   WHAT BROKE, AND WHY EACH FIX IS THE ONLY ONE AVAILABLE

   1. `node_modules/three/build/three.min.js` fed by request interception.
      Modern three SHIPS NO UMD BUILD — the build directory holds three.module.js, three.cjs and
      the webgpu/tsl variants, and nothing a <script src> could ever load. Nothing to intercept.
      three is bundled into dist/kea.js by Vite now, so the interception is not replaced, it is
      DELETED. Fonts are still blocked: the page asks Google for Fredoka and Patrick Hand, and a
      capture pass that reaches the network is a capture pass that differs when the network does.

   2. Navigation to file://.
      ES modules will not load over file:// — the origin is opaque and the browser refuses the
      module script outright. So dist/ is served over loopback for the life of the run.

   3. `seeded()` STRING-REPLACING `if(!HEADLESS)boot();` in a temp copy of the HTML.
      That anchor does not survive bundling and minification, and the old code threw if it did not
      appear exactly once — correctly, because a silent miss would have produced an unseeded world
      that still photographed fine and drifted every baseline underneath everyone.
      The replacement is a real seam: main.mjs reads globalThis.__KEA_BOOT__ once, before it boots,
      and evaluateOnNewDocument sets it before ANY module on the page runs. Same single gauntlet
      seed, set through an interface instead of a regex over minified output.

   ONE SEED, NEVER SHOPPED — unchanged from rig.js, and still the same number the batteries use.
   Math.random is overridden here as well as seeded in-game for the reason rig.js records at
   length: pick(), the human wander coin flip and three's own per-mesh draws never touch rnd(). */
import fs from 'fs'; import path from 'path'; import url from 'url';
import http from 'http'; import { execFileSync } from 'child_process';

export const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../..');
export const DIST = path.join(ROOT, 'dist');
export const GAUNTLETSEED = 20260828;

/* ---- build ---------------------------------------------------------------------------------
   The gauntlet photographs the BUILT bundle, so a capture pass that skipped the build would be
   photographing whatever happened to be in dist/ from last time. Built once per process. */
let built = false;
export function ensureBuild({ quiet = true } = {}) {
  if (built) return DIST;
  execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: quiet ? 'pipe' : 'inherit' });
  const entry = path.join(DIST, 'index.html');
  if (!fs.existsSync(entry)) throw new Error('webrig: build produced no dist/index.html');
  built = true;
  return DIST;
}

/* ---- serve ---------------------------------------------------------------------------------- */
const MIME = { '.html':'text/html', '.js':'application/javascript', '.mjs':'application/javascript',
  '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
  '.json':'application/json', '.map':'application/json', '.woff2':'font/woff2' };

export async function serve(dir = DIST) {
  const server = http.createServer((req, res) => {
    const clean = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(dir, clean === '/' ? 'index.html' : clean);
    // never serve outside the served directory
    if (!path.resolve(file).startsWith(path.resolve(dir))) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  server.unref();   // never hold a capture pass open just because the server is listening
  const origin = 'http://127.0.0.1:' + server.address().port;
  return { origin, close: () => new Promise(r => server.close(r)) };
}

/* ---- the page ------------------------------------------------------------------------------
   Determinism is installed BEFORE any module on the page evaluates, which is the whole point:
   the world is built at import time, so anything set afterwards is set too late. */
export async function preparePage(page, { seed = GAUNTLETSEED, biome } = {}) {
  await page.evaluateOnNewDocument((s, b) => {
    let t = s >>> 0;
    Math.random = () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t);
      r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; };
    globalThis.__KEA_BOOT__ = b ? { seed: s, biome: b } : { seed: s };
  }, seed, biome || null);
  await page.setRequestInterception(true);
  page.on('request', r => {
    if (/fonts\.(googleapis|gstatic)\./.test(r.url())) r.respond({ contentType: 'text/css', body: '' });
    else r.continue();
  });
}

/* Assert the page actually booted the way we asked. A capture pass that quietly fell back to an
   unseeded default world is the exact failure the old anchor-throw existed to prevent, so the
   replacement seam gets the same treatment: proven per page, not assumed. */
export async function assertBooted(page, { biome } = {}) {
  const state = await page.evaluate(() => ({
    keagame: typeof globalThis.KEAGAME !== 'undefined',
    seen: globalThis.__KEA_BOOT__ || null,
    biome: (globalThis.KEAGAME && globalThis.KEAGAME.G && globalThis.KEAGAME.G.biome) || null,
    children: (globalThis.KEAGAME && globalThis.KEAGAME.G && globalThis.KEAGAME.G.scene)
      ? globalThis.KEAGAME.G.scene.children.length : 0,
  }));
  if (!state.keagame) throw new Error('webrig: page did not publish KEAGAME');
  if (!state.seen) throw new Error('webrig: __KEA_BOOT__ never reached the page');
  if (state.seen.seed !== GAUNTLETSEED) throw new Error('webrig: wrong seed on page: ' + state.seen.seed);
  if (biome && state.biome !== biome) throw new Error('webrig: asked for biome ' + biome + ', page built ' + state.biome);
  if (state.children < 40) throw new Error('webrig: world looks unbuilt (' + state.children + ' children)');
  return state;
}

/* Unchanged from capture.mjs, which has carried all three of these paths for months: bundled
   chromium first, the system Chrome channel when the bundled binary is unsigned (which it is on
   this Mac — `spawn Unknown system error -88`), and @sparticuz/chromium in a container. */
export async function launch() {
  try {
    const p = await import('puppeteer');
    try { return await p.default.launch({ headless: true, args: ['--no-sandbox'] }); }
    catch (e) { return await p.default.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] }); }
  } catch (e) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const p = await import('puppeteer-core');
    return p.default.launch({ executablePath: await chromium.executablePath(),
      args: [...chromium.args, '--no-sandbox'], headless: true });
  }
}
