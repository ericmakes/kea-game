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
   REPLAT P3 adds the materials on the same seam again, and needs it for the same reason — every
   tint and tile in that piece is judged at a vantage:
       NOMATS=1                     skip the seven scanned sets, stay on flat palette colour
       KEAMATS='{"families":{"asphalt":{"tint":0.8}},"paintMean":0.6}'
                                    overwrite leaves of src/game.mjs's MATS constants
   KEAMATS IS NESTED ONE LEVEL, unlike KEASKY, because MATS is not flat: `families` is a map of
   seven records and a flat merge would mean restating all seven to change one tint. It is one
   level and no more — a family record is itself a flat block of scalars, so game.mjs
   Object.assigns over it and there is nothing deeper to get wrong.
   All six are read here so every browser tool gets them for free, and all six are absent from a
   normal pass, which therefore shoots exactly what the build pins. */
const SKY_KEYS = ['fogDay','fogDensityDay','fogNight','fogDensityNight','sunDay','sunNight',
  'sunIntensityDay','sunIntensityNight','sunPosDay','sunPosNight','shadowType','shadowMap',
  'shadowRadius','shadowBlur','shadowBias','shadowNormalBias','shadowExtent','shadowFar',
  'hdri','envIntensityDay','envIntensityNight','envRotationY','hemiIntensityDay',
  'hemiIntensityNight','hemiSkyDay','hemiSkyNight','hemiGroundDay','hemiGroundNight',
  'fillIntensityDay','fillIntensityNight','rimIntensityDay','rimIntensityNight',
  'hazeOpacityDay','hazeOpacityNight'];

/* REPLAT P3b added `breakup` and leaving it out of this list cost a whole variant strip: every
   KEAMATS in it was REFUSED, the four shots died, and four copies of one stale frame got compared
   as though they were four variants. The list is the price of catching typos and it has to be kept
   up to date with MATS itself — which is exactly why game.mjs ALSO reports what it ignored, and
   why the strip shooter now verifies the frame on disk actually changed. Two independent guards,
   because this one is a list a human has to remember. */
const MATS_KEYS = ['dir','res','paintMean','normalScale','roughScale','families','breakup'];
/* REPLAT P4 adds the grass on the same seam, and the density TIER is the whole point of it: the
   brief was "measure three tiers", and three tiers cannot be measured if switching one needs a
   rebuild.
       NOMATS is unrelated; there is no NOGRASS - KEAGRASS='{"tier":"low"}' is the way down.
       KEAGRASS='{"tier":"high"}'                     switch the density tier
       KEAGRASS='{"biomes":{"carpark":{"bare":0.18}}}' reach a per-biome leaf
   THERE IS DELIBERATELY NO KEY LIST HERE. KEASKY and KEAMATS both keep one, and the MATS one has
   now drifted twice — `breakup` was missing when P3b added it, and a P4 copy of the GRASS keys was
   stale within the hour (it still named clumpR and clumpFall, which no longer exist, and had never
   heard of clumpPull, lodFrac, snap or comb). A list of a recipe's keys kept in a second file is a
   list that drifts, and every time it drifts it REFUSES A LEGITIMATE OVERRIDE, which is the most
   annoying possible failure: it looks like the seam is broken.
   game.mjs knows its own keys, and it already reports every path it ignored. assertBooted refuses
   the pass on that report below. One source of truth, checked where the truth lives. */
export async function preparePage(page, { seed = GAUNTLETSEED, biome } = {}) {
  const nopost = !!process.env.NOPOST;
  const nosky = !!process.env.NOSKY;
  const nomats = !!process.env.NOMATS;
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
  let grass = null;
  if (process.env.KEAGRASS) {
    try { grass = JSON.parse(process.env.KEAGRASS); }
    catch (e) { throw new Error('webrig: KEAGRASS is not valid JSON — ' + e.message); }
  }
  /* REPLAT P5b: KEABIRD reaches the bird model tier. Same seam and same reason as the three above —
     the model is a look decision and has to be shootable without a rebuild. Nested one level, so
     KEABIRD='{"bones":{"head":"..."}}' reaches a leaf. */
  let bird = null;
  if (process.env.KEABIRD) {
    try { bird = JSON.parse(process.env.KEABIRD); }
    catch (e) { throw new Error('webrig: KEABIRD is not valid JSON — ' + e.message); }
  }
  /* REPLAT P6A: KEAPROPS reaches the prop registry, same seam and same reason as the four above —
     a model swap is a look decision and it has to be shootable without a rebuild. Nested TWO levels
     because an entry is a row of blocks: KEAPROPS='{"bench":{"material":{"nightTint":true}}}'
     reaches a leaf.
     THERE IS DELIBERATELY NO KEY LIST HERE, for the reason KEAGRASS's note gives at length: the
     ids and the column names live in game.mjs, game.mjs reports every path it refused in
     G.propsState.ignored, and assertBooted fails the pass on that report. A list kept in this file
     would drift and would then refuse a legitimate swap, which is the most annoying possible
     failure because it looks like the seam is broken. */
  let props = null;
  if (process.env.KEAPROPS) {
    try { props = JSON.parse(process.env.KEAPROPS); }
    catch (e) { throw new Error('webrig: KEAPROPS is not valid JSON — ' + e.message); }
  }
  let mats = null;
  if (process.env.KEAMATS) {
    try { mats = JSON.parse(process.env.KEAMATS); }
    catch (e) { throw new Error('webrig: KEAMATS is not valid JSON — ' + e.message); }
    /* SAME ARGUMENT AS KEASKY's, ONE LEVEL DEEPER. A misspelled knob must not look like a tuning
       that did nothing: game.mjs ignores unknown keys by design, so a strip could be shot, judged
       and locked with one frame silently on the default. Checked at BOTH levels, because
       `{"families":{"asfalt":{...}}}` is the typo that actually happens. */
    const bad = Object.keys(mats).filter(k => !MATS_KEYS.includes(k));
    if (bad.length) throw new Error('webrig: KEAMATS has no such MATS constant: ' + bad.join(', ') +
      '\n  known keys: ' + MATS_KEYS.join(', '));
    /* THE TOP LEVEL IS CHECKED HERE AND THE FAMILIES ARE NOT, and that division is deliberate.
       A family NAME cannot be validated from this side without keeping a second copy of the
       seven, and a list kept in two files is a list that drifts — this file did keep one for
       about ten minutes and let `{"families":{"asfalt":{"tint":0.8}}}` through untouched,
       because `tint` is a valid KEY and `asfalt` is not a family. game.mjs knows the names, so
       game.mjs reports what it ignored and assertBooted refuses the pass below. */
  }
  const nopropmodels = !!process.env.NOPROPMODELS;
  if (nopost || nosky || nomats || film || sky || mats || grass || bird || props || nopropmodels)
    await page.evaluateOnNewDocument((np, f, ns, sk, nm, mt, gr, bd, pr, npm) => {
      if (pr) globalThis.__KEA_PROPS__ = pr;
      if (npm) globalThis.__KEA_NOPROPMODELS__ = true;
      if (bd) globalThis.__KEA_BIRD__ = bd;
      if (np) globalThis.__KEA_NOPOST__ = true;
      if (ns) globalThis.__KEA_NOSKY__ = true;
      if (f) globalThis.__KEA_FILM__ = f;
      if (sk) globalThis.__KEA_SKY__ = sk;
      if (nm) globalThis.__KEA_NOMATS__ = true;
      if (mt) globalThis.__KEA_MATS__ = mt;
      if (gr) globalThis.__KEA_GRASS__ = gr;
    }, nopost, film, nosky, sky, nomats, mats, grass, bird, props, nopropmodels);
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
export async function assertBooted(page, { biome, iblTimeout = 8000, matsTimeout = 20000 } = {}) {
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
  /* REPLAT P3 PUT SEVEN MORE FETCHES BEHIND THE SAME await, so the wait covers both and the
     terminal state is now a PAIR. 21 jpgs, 16 MB, so matsTimeout is generous where iblTimeout is
     not — measured cold on this Mac at about 1.5s over loopback, and a bound that only fires on a
     genuine failure is worth more than a tight one. */
  const want = process.env.NOSKY ? 'painted' : 'hdri';
  const wantMats = process.env.NOMATS ? 'none' : 'scanned';
  const t0 = Date.now();
  for (;;) {
    const st = await page.evaluate(() => ({
      ibl: ((((globalThis.KEAGAME || {}).G || {}).ibl) || {}).mode || null,
      mats: ((((globalThis.KEAGAME || {}).G || {}).mats) || {}).mode || null,
    }));
    if (st.ibl === want && st.mats === wantMats) break;
    if (Date.now() - t0 > Math.max(iblTimeout, matsTimeout)) break;   // the assertions below say what went wrong
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
    // REPLAT P3: the same accessor discipline, for the same reason — a missing G.mats is a fact
    // to report, not a stack trace on the way to reporting it.
    mats: ((globalThis.KEAGAME || {}).G || {}).mats || null,
    grass: ((globalThis.KEAGAME || {}).G || {}).grass || null,
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
  /* AND THE MATERIALS ARE PROVEN THE SAME WAY, REPLAT P3, because they fail in the same shape and
     it is a WORSE shape. A family whose three jpgs 404 keeps its authored palette colour and its
     authored roughness — so a pass with two families missing photographs a world that is complete,
     plausible, and wearing 1990s flat colour on the car park while the hut is scanned. Nobody
     eyeballing thirty frames would catch that; the difference is a shade of grey, not a black
     page. G.mats.mode is 'scanned' only when EVERY family landed, so this is the assertion that
     makes "the look Eric judged" and "the look the code describes" the same thing.
     IT NAMES THE FAMILIES THAT FAILED, because "partial" is useless on its own and the whole point
     of the provenance block is that the answer is readable rather than inferred from pixels. */
  if (!state.mats) throw new Error('webrig: G.mats is missing — the page has no material provenance at all');
  if (!process.env.NOMATS && state.mats.mode !== 'scanned') {
    const bad = Object.entries(state.mats.families || {})
      .filter(([, v]) => !v.maps).map(([k, v]) => k + ' (' + v.asset + ')');
    throw new Error('webrig: the scanned materials did not land — G.mats.mode is "' + state.mats.mode +
      '" (expected "scanned"), ' + state.mats.loaded + '/' +
      Object.keys(state.mats.families || {}).length + ' families dressed' +
      (bad.length ? '; missing: ' + bad.join(', ') : '') +
      '. Those surfaces keep flat palette colour, so this pass would photograph a half-dressed ' +
      'world. Set NOMATS=1 to shoot the pre-P3 look deliberately.');
  }
  /* A KEAMATS OVERRIDE THAT WENT NOWHERE IS A STRIP JUDGED ON THE DEFAULT. game.mjs ignores keys
     it does not recognise, which is right, and records them — so the pass refuses rather than
     photographing a variant that was never applied. Thrown and not warned, because a strip is
     judged by eye and a warning scrolls past. */
  if ((state.mats.ignored || []).length)
    throw new Error('webrig: KEAMATS set something the recipe does not have, so it was IGNORED: ' +
      state.mats.ignored.join(', ') + '. This pass would photograph the default and be judged as ' +
      'the variant.');
  /* THE GRASS OVERRIDE IS REFUSED THE SAME WAY, for the same reason a mistyped KEAMATS is: a tier
     that did not apply photographs as the default and gets judged as the variant. */
  if ((state.grass && (state.grass.ignored || []).length))
    throw new Error('webrig: KEAGRASS set something the recipe does not have, so it was IGNORED: ' +
      state.grass.ignored.join(', ') + '. This pass would photograph the default tier.');
  if (state.grass && state.grass.shader !== true)
    throw new Error('webrig: the grass blade shader did not install — ' + state.grass.shader +
      '. Wind, thinning and transmission are all off, so this pass would photograph a dead field.');
  if (process.env.NOMATS && state.mats.mode !== 'none')
    throw new Error('webrig: NOMATS=1 asked for the palette look but G.mats.mode is "' + state.mats.mode + '"');
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
