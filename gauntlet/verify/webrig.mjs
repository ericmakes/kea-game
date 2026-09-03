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
/* TUNING PASSTHROUGH. The film camera is judged AT THE VANTAGE, so it has to be adjustable
   without a rebuild and without a second staging table:
       NOPOST=1                     shoot on the plain renderer, for a like-for-like A/B
       KEAFILM='{"bloom":{...}}'    deep-merge over src/post.mjs's FILM defaults
   REPLAT P2 adds the sky on the same seam, for the same reason — every variant strip in that
   piece (three HDRIs, three fog densities, two shadow maps) had to be shootable from one build:
       NOSKY=1                      skip the HDRI, stay on the painted fallback environment
       KEASKY='{"fogDensityDay":0.008,"shadowType":"pcfsoft"}'
                                    overwrite leaves of src/game.mjs's SKY constants
   KEASKY IS A FLAT LEAF MERGE, not a deep one, because SKY is a flat block of scalars and arrays
   — a nested merge would silently half-apply `sunPosDay`. game.mjs only accepts keys that already
   exist in SKY, so a typo is a no-op there rather than a new constant nobody reads; the check
   below catches it here instead, where it can still say so out loud.
   All four are read here so every browser tool gets them for free, and all four are absent from a
   normal pass, which therefore shoots exactly what the build pins. */
const SKY_KEYS = ['fogDay','fogDensityDay','fogNight','fogDensityNight','sunDay','sunNight',
  'sunIntensityDay','sunIntensityNight','sunPosDay','sunPosNight','shadowType','shadowMap',
  'shadowRadius','shadowBlur','shadowBias','shadowNormalBias','shadowExtent','shadowFar',
  'hdri','envIntensityDay','envIntensityNight','envRotationY','hemiIntensityDay',
  'hemiIntensityNight','hemiSkyDay','hemiSkyNight','hemiGroundDay','hemiGroundNight',
  'fillIntensityDay','fillIntensityNight','rimIntensityDay','rimIntensityNight',
  'hazeOpacityDay','hazeOpacityNight'];

export async function preparePage(page, { seed = GAUNTLETSEED, biome } = {}) {
  const nopost = !!process.env.NOPOST;
  const nosky = !!process.env.NOSKY;
  let film = null;
  if (process.env.KEAFILM) {
    try { film = JSON.parse(process.env.KEAFILM); }
    catch (e) { throw new Error('webrig: KEAFILM is not valid JSON — ' + e.message); }
  }
  let sky = null;
  if (process.env.KEASKY) {
    try { sky = JSON.parse(process.env.KEASKY); }
    catch (e) { throw new Error('webrig: KEASKY is not valid JSON — ' + e.message); }
    /* A MISSPELLED KNOB MUST NOT LOOK LIKE A TUNING THAT DID NOTHING. game.mjs ignores unknown
       keys by design, so without this a variant strip could be shot, judged and locked while one
       of its frames was silently the default — the same class of failure as an unseeded capture
       pass that photographs fine. Thrown, not warned, because a strip is judged by eye and a
       warning scrolls past. */
    const bad = Object.keys(sky).filter(k => !SKY_KEYS.includes(k));
    if (bad.length) throw new Error('webrig: KEASKY has no such SKY constant: ' + bad.join(', ') +
      '\n  known keys: ' + SKY_KEYS.join(', '));
  }
  if (nopost || nosky || film || sky) await page.evaluateOnNewDocument((np, f, ns, sk) => {
    if (np) globalThis.__KEA_NOPOST__ = true;
    if (ns) globalThis.__KEA_NOSKY__ = true;
    if (f) globalThis.__KEA_FILM__ = f;
    if (sk) globalThis.__KEA_SKY__ = sk;
  }, nopost, film, nosky, sky);
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
export async function assertBooted(page, { biome, iblTimeout = 8000 } = {}) {
  /* THE ENVIRONMENT IS FETCHED, SO IT IS WAITED FOR — bounded, then asserted. main.mjs awaits the
     HDRI before the film camera goes on, but that await lives inside the page's module graph and
     page.goto's 'load' does not cover it: a caller can be here before the fetch resolves. Found
     immediately by probe.mjs, which asserts straight after goto and read 'painted' on a build
     where the HDRI loads fine in under a second.
     THE WAIT BELONGS HERE AND NOT IN THE FOUR CALLERS. capture.mjs happens to sleep 1000ms first
     and so never saw this; probe, motion and journey do not, and fixing it four times is how
     webrig.mjs came to exist in the first place. Polling rather than a fixed sleep so a normal run
     costs one evaluate, and BOUNDED so a genuinely failed fetch still fails loudly below instead
     of hanging a pass forever. */
  /* IT WAITS FOR THE TERMINAL STATE, NOT FOR "ANY STATE". The first version of this loop broke as
     soon as G.ibl.mode stopped being 'none', and 'painted' is not an outcome — it is the fallback
     initRenderer installs on the first frame so the scene is never unlit, and sky.mjs upgrades it
     to 'hdri' a moment later. Breaking on it meant the wait returned before the thing it was
     waiting for, and probe.mjs failed exactly as it had without any wait at all. */
  const want = process.env.NOSKY ? 'painted' : 'hdri';
  const t0 = Date.now();
  for (;;) {
    const mode = await page.evaluate(() => ((((globalThis.KEAGAME || {}).G || {}).ibl) || {}).mode || null);
    if (mode === want) break;
    if (Date.now() - t0 > iblTimeout) break;            // let the assertions below say what went wrong
    await new Promise(r => setTimeout(r, 100));
  }
  const state = await page.evaluate(() => ({
    keagame: typeof globalThis.KEAGAME !== 'undefined',
    seen: globalThis.__KEA_BOOT__ || null,
    biome: (globalThis.KEAGAME && globalThis.KEAGAME.G && globalThis.KEAGAME.G.biome) || null,
    children: (globalThis.KEAGAME && globalThis.KEAGAME.G && globalThis.KEAGAME.G.scene)
      ? globalThis.KEAGAME.G.scene.children.length : 0,
    // REPLAT P2: read through an accessor that cannot throw (FLAKES law 14) — this must report
    // a missing G.ibl as a fact, not die on the way to reporting it.
    ibl: ((globalThis.KEAGAME || {}).G || {}).ibl || null,
  }));
  if (!state.keagame) throw new Error('webrig: page did not publish KEAGAME');
  if (!state.seen) throw new Error('webrig: __KEA_BOOT__ never reached the page');
  if (state.seen.seed !== GAUNTLETSEED) throw new Error('webrig: wrong seed on page: ' + state.seen.seed);
  if (biome && state.biome !== biome) throw new Error('webrig: asked for biome ' + biome + ', page built ' + state.biome);
  if (state.children < 40) throw new Error('webrig: world looks unbuilt (' + state.children + ' children)');
  /* THE ENVIRONMENT IS PROVEN PER PAGE, NOT ASSUMED — REPLAT P2, and it is the same argument the
     seed seam above rests on. The painted gradient is a deliberate fallback that keeps the game
     up when the HDRI cannot be fetched, which means a capture pass whose fetch failed photographs
     a COMPLETE, PLAUSIBLE, WRONGLY-LIT world and says nothing. Every frame in the pass would then
     be judged, and possibly pinned, as the HDRI look. So a pass that asked for the sky asserts it
     got the sky; NOSKY=1 is the way to ask for the fallback on purpose. */
  if (!state.ibl) throw new Error('webrig: G.ibl is missing — the page has no IBL provenance at all');
  if (!process.env.NOSKY && state.ibl.mode !== 'hdri')
    throw new Error('webrig: the HDRI environment did not land — G.ibl.mode is "' + state.ibl.mode +
      '" (expected "hdri"). The painted fallback lights the scene differently, so this pass would ' +
      'photograph the wrong look. Set NOSKY=1 to shoot the fallback deliberately.');
  if (process.env.NOSKY && state.ibl.mode !== 'painted')
    throw new Error('webrig: NOSKY=1 asked for the painted fallback but G.ibl.mode is "' + state.ibl.mode + '"');
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
