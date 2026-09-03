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
