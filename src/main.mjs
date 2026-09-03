/* BROWSER ENTRY — REPLAT P1 (2026-09-03).

   The single-file build booted itself: its logic block ended `if(!HEADLESS)boot();`, and the
   capture rig injected determinism by string-replacing that exact line into a temp copy of the
   HTML. A bundled build cannot be patched that way — the line is minified out of existence — so
   the boot decision lives here instead, behind a global the rig can set BEFORE any module runs
   (puppeteer's evaluateOnNewDocument). Same single gauntlet seed, an actual seam to set it on.

   __KEA_BOOT__ is read once, here, and never again. Shape: {seed?:number, biome?:string}.
   Absent, the game boots exactly as it always did: unseeded, default biome. */
import './game.mjs';

const KEAGAME = globalThis.KEAGAME;
if (!KEAGAME) throw new Error('main: game module did not publish KEAGAME');

const cfg = globalThis.__KEA_BOOT__ || {};
if (cfg.seed !== undefined) KEAGAME.setSeed(cfg.seed);
KEAGAME.boot(cfg.biome ? { biome: cfg.biome } : undefined);
