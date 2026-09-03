/* BROWSER ENTRY — REPLAT P1 (2026-09-03).

   The single-file build booted itself: its logic block ended `if(!HEADLESS)boot();`, and the
   capture rig injected determinism by string-replacing that exact line into a temp copy of the
   HTML. A bundled build cannot be patched that way — the line is minified out of existence — so
   the boot decision lives here instead, behind a global the rig can set BEFORE any module runs
   (puppeteer's evaluateOnNewDocument). Same single gauntlet seed, an actual seam to set it on.

   __KEA_BOOT__ is read once, here, and never again. Shape: {seed?:number, biome?:string}.
   Absent, the game boots exactly as it always did: unseeded, default biome. */
import { THREE } from './game.mjs';

/* window.THREE IS PARITY, NOT A CONVENIENCE. The single-file build loaded three from a CDN
   <script src>, which defined window.THREE, and the logic block was a plain <script> so its
   top-level declarations were globals too. A bundled module build has neither. The capture rig
   stages subjects in page context and builds real three objects while doing it — vantage 07 makes
   a MeshStandardMaterial to pin the traffic body colour, and vantage 17 makes a Vector3 to place
   the camera — so without this the stage throws ReferenceError, the shot retakes three times and
   the pass prints GAVE UP. Measured exactly that way on the first full pass after the port.
   Exposed here, in the BROWSER entry, so the headless batteries are untouched. */
globalThis.THREE = THREE;

const KEAGAME = globalThis.KEAGAME;
if (!KEAGAME) throw new Error('main: game module did not publish KEAGAME');

const cfg = globalThis.__KEA_BOOT__ || {};
if (cfg.seed !== undefined) KEAGAME.setSeed(cfg.seed);
KEAGAME.boot(cfg.biome ? { biome: cfg.biome } : undefined);

/* THE SKY goes on after boot, and BEFORE the film camera, because the composer's first frame
   should already see the real environment — an HDRI that lands after the post chain is built is
   fine functionally but makes the first captured frame depend on load order rather than on the
   recipe. Awaited for the same reason: the capture rig photographs a settled page, and a
   photograph taken between the painted fallback and the HDRI would be neither look.
   IT CANNOT TAKE THE GAME DOWN. Same law as the film camera below — a failed fetch leaves the
   painted-gradient environment initRenderer already installed, G.ibl.mode stays 'painted', and
   the game plays. The console line is the only difference, and G.ibl is where a capture pass or
   a battery looks to find out which of the two it got. */
if (!cfg.nosky && !globalThis.__KEA_NOSKY__) {
  try {
    const { installSky } = await import('./sky.mjs');
    await installSky(KEAGAME);
  } catch (e) {
    console.error('sky: HDRI environment failed to load, staying on the painted fallback —', e);
  }
}

/* THE FILM CAMERA goes on after boot, because it attaches to the renderer the boot creates.
   Wired HERE and not in game.mjs so that file keeps the single import the gauntlet's specimen
   loader asserts — see src/post.mjs. If the post stack cannot build, the game keeps playing on the
   plain renderer rather than showing a black page: a look feature must not be able to take the
   game down. __KEA_NOPOST__ turns it off for a like-for-like comparison against the plain path. */
if (!cfg.nopost && !globalThis.__KEA_NOPOST__) {
  try {
    const { installPost } = await import('./post.mjs');
    installPost(KEAGAME);
  } catch (e) {
    console.error('post: film camera failed to install, playing on the plain renderer —', e);
  }
}
