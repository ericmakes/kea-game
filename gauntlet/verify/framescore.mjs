/* FRAMESCORE — the WHOLE-FRAME platescore. Lifted from the render spike (~/kea-render-spike/verify/
   framescore.mjs) on 2026-10-02, SPIKE ADOPTION piece 1. The spike folder is reference and was only
   read; this file is the game's own copy and is maintained here.

   WHY A DRIVER AND NOT AN EDIT, unchanged from the spike's reasoning. platescore.mjs's CLI only
   knows two strips (terrain against nz_alps_01/02, and sky), so the game had NO score for a whole
   vantage against the Birds of War wall. What platescore EXPORTS is the measuring and the band
   making, and those are used here UNCHANGED (platescore.mjs md5 4903d650e1b3b38be200942a601d08f2,
   the same file the spike copied byte for byte — which is what makes the spike's numbers and this
   file's numbers the same instrument):
     bandNorm   crop and scale to NORMW (1440) wide, here with the band set to the whole frame
     measureAll edge density, ridge p10, highlight patchiness, luma, hue, saturation
     plateBand  a plate's own four vertical tiles set its band, widened to +/-18% of the mean;
                hue gets the fixed +/-30 degree tolerance
   A property is IN BAND if it falls inside ANY plate's band — platescore's own rule.

   TWO WALLS.
     bow    ref_bow_00 / 04 / 06, the light trio ARTBIBLE's P2 section judges against (DAYLIGHT,
            WARMTH+HAZE, SHADOW SOFTNESS). gauntlet/reference/board/.
     spike  the render spike's 01_carpark_wide frame, pinned as gauntlet/reference/spike/
            01_carpark_wide.png (md5 5508e11407e082f66598df65210bfacf, copied 2026-10-02). It is a
            game-side render with no HUD and no caption, so it carries no mask of its own. Scoring a
            game frame against it answers "how far is this from the frame Eric judged better", which
            is a different question from "how far is this from the trailer" and is reported apart.
   WHAT IS MASKED. The game's HUD rectangles are excluded from every game frame, and each bow
   plate's Instagram watermark and caption from that plate. silhouette is not judged: the trio have
   no sky line to speak of, and neither does the spike frame.
   AND WHAT IT CANNOT SEE, repeated from the spike because it is the most important line here: a
   whole-frame statistic cannot see geometry. A frame can be in band on all six and still read as CG.

   Usage: node gauntlet/verify/framescore.mjs <frame.png> [...]       WALL=bow (default) | spike | both
          JSON=1 for machine output */
import path from 'path'; import url from 'url';
import fs from 'fs';
import { bandNorm, measureAll, plateBand, NORMW, loadRGB } from './platescore.mjs';
import { KEYSKY } from './stripcam.mjs';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const BOARD = path.join(ROOT, 'gauntlet/reference/board');
export const SPIKE_FRAME = path.join(ROOT, 'gauntlet/reference/spike/01_carpark_wide.png');
export const WALLS = {
  bow: ['ref_bow_00', 'ref_bow_04', 'ref_bow_06'],
  spike: ['spike_01'],
};
export const JUDGED = ['edgeDensity', 'ridgeP10', 'snowPatch', 'luma', 'hue', 'sat'];

/* Rectangles as fractions of the frame [x0,y0,x1,y1], measured off the pictures (the spike's). */
export const GAMEHUD = [
  [338 / 960, 8 / 540, 626 / 960, 48 / 540],     // CHAOS pill + kea pips
  [874 / 960, 4 / 540, 952 / 960, 44 / 540],     // sound button
  [10 / 960, 454 / 540, 250 / 960, 530 / 540],   // KEA 1 badge + E HOLD prompt
  [410 / 960, 496 / 540, 550 / 960, 532 / 540],  // TAB hint
];
const PLATEMASK = {
  ref_bow_00: [[1100 / 1280, 180 / 720, 1185 / 1280, 260 / 720], [900 / 1280, 310 / 720, 1185 / 1280, 360 / 720],
               [50 / 1280, 585 / 720, 1085 / 1280, 685 / 720]],
  ref_bow_04: [[1100 / 1280, 180 / 720, 1185 / 1280, 260 / 720], [900 / 1280, 290 / 720, 1185 / 1280, 340 / 720]],
  ref_bow_06: [[145 / 1280, 485 / 720, 222 / 1280, 562 / 720], [148 / 1280, 594 / 720, 428 / 1280, 644 / 720]],
  spike_01: [],
};
const masker = (rects, im) => (p, x, y) =>
  rects.some(r => x >= r[0] * im.w && x <= r[2] * im.w && y >= r[1] * im.h && y <= r[3] * im.h);

/* ---- THE SKY IS NOT SNOW — SPIKE_ADOPT 19 (Eric 2026-10-03) ----
   "Two of [the candidate's three refusals] are the snow detector counting clouds in the photographed sky. Do not
   loosen thresholds: fix the snow-patchiness detector to mask the sky region, then re-derive the edge-density and
   snow bands ... from the plates against the new sky." snowPatch takes a frame's brightest pixels; with sky in the
   frame those are cumulus, so a change to the CLOUDS read as a change to the SNOW. And edge density over a frame
   whose upper third is smooth sky is diluted by however much sky the vantage happens to hold.
   SO THE TWO GROUND PROPERTIES ARE MEASURED OFF THE SKY, on both sides, and nothing else changes: no threshold,
   no band width (MINREL, the tile rule), and luma / hue / sat / ridge p10 are still the whole frame.
     THE GAME: the sky key capture.mjs takes beside the frame (SKYKEY=1 -> <name>.sky.png; stripcam SKYKEY) —
               geometry, never a colour guess. A frame with no key is scored as before and SAYS SO (unkeyed).
     THE PLATES: the bow trio have no sky to mask (stripcam: 5.8-11.3% smooth in their top 22%, canopy and roofline;
               REF_BOW.md names none of them a sky) — their sky mask is empty, stated, so their bands are re-derived
               and come out where they were. The spike frame's sky is a MEASURED POLYGON, like the watermark
               rectangles above: a colour test (b-r>20) took the blue car, the shadows and the forest, and a flood
               from the top edge ate the hazy far slopes; the polygon follows the ridgeline to a few px (3.6% of
               the frame, the thin haze strip at the ridge left in). */
export const SKYOFF = ['edgeDensity', 'snowPatch'];
const SKYPOLY = {
  ref_bow_00: null, ref_bow_04: null, ref_bow_06: null,
  spike_01: [[0.6146, 0], [0.6528, 0.0358], [0.7431, 0.0815], [0.8125, 0.1086], [0.868, 0.1346], [0.8993, 0.1389], [0.934, 0.1327], [1, 0.1019], [1, 0]],
};
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j];
  if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; };
/* the sky key for a game frame, read at the frame's own normalisation, as a per-pixel lookup; null if there is none */
export function skyKeyFor(frame) {
  const k = frame.replace(/\.png$/, '.sky.png'); if (k === frame || !fs.existsSync(k)) return null;
  const im = bandNorm(k, 0, 1, NORMW), m = new Uint8Array(im.w * im.h);
  for (let j = 0; j < m.length; j++) m[j] = KEYSKY([im.buf[j * 3], im.buf[j * 3 + 1], im.buf[j * 3 + 2]]) ? 1 : 0;
  return { w: im.w, h: im.h, m, frac: m.reduce((a, b) => a + b, 0) / m.length };
}
const plateFile = n => n === 'spike_01' ? SPIKE_FRAME : path.join(BOARD, n + '.jpg');

export function plates(wall = 'bow') {
  const out = {};
  for (const n of WALLS[wall]) {
    const im = bandNorm(plateFile(n), 0, 1, NORMW), mk = masker(PLATEMASK[n], im);
    out[n] = plateBand(im, mk);
    /* SKYOFF: the same plate re-banded with its sky masked too (SPIKE_ADOPT 19); the polygon is in whole-plate
       fractions, so it goes to plateBand as skyAt (whole-image coordinates), not through the tile-local isSky */
    const P = SKYPOLY[n];
    if (P) { const skyAt = (x, y) => inPoly(P, x / im.w, y / im.h), off = plateBand(im, mk, skyAt);
      for (const k of SKYOFF) out[n].band[k] = off.band[k];
      let c = 0; for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) c += skyAt(x, y) ? 1 : 0;
      out[n].sky = { polygon: true, frac: c / (im.w * im.h) }; }
    else out[n].sky = { polygon: false, frac: 0, note: 'no sky in this plate' };
  }
  return out;
}

export function scoreFrame(frame, P) {
  const names = Object.keys(P);
  const im = bandNorm(frame, 0, 1, NORMW), hud = masker(GAMEHUD, im);
  const g = measureAll(im, hud);
  /* SKYOFF (SPIKE_ADOPT 19): snow and edge density off the sky, from the frame's own key. No key, no change — and
     the result says it was unkeyed, so a keyed band is never silently compared with an unkeyed frame. */
  const key = skyKeyFor(frame);
  if (key && (key.w !== im.w || key.h !== im.h)) throw new Error('framescore: sky key ' + key.w + 'x' + key.h + ' does not match its frame ' + im.w + 'x' + im.h);
  if (key) { const g2 = measureAll(im, (p, x, y) => hud(p, x, y) || key.m[y * im.w + x] === 1); for (const k of SKYOFF) g[k] = g2[k]; }
  let inCount = 0;
  const rows = JUDGED.map(k => {
    const cells = names.map(n => { const b = P[n].band[k];
      return { n, b, ok: b && g[k] !== null ? g[k] >= b.lo && g[k] <= b.hi : null }; });
    const ok = cells.some(c => c.ok); if (ok) inCount++;
    /* distance outside the nearest band, in units of that band's half-width: 0 = inside */
    const miss = Math.min(...cells.filter(c => c.b && g[k] !== null).map(c => {
      const half = (c.b.hi - c.b.lo) / 2, mid = (c.b.hi + c.b.lo) / 2;
      return Math.max(0, Math.abs(g[k] - mid) - half) / half; }));
    return { k, gv: g[k], cells, ok, miss };
  });
  return { frame, game: g, rows, inCount, judged: JUDGED.length, plates: names, sky: key ? { keyed: true, frac: +key.frac.toFixed(4) } : { keyed: false } };
}

export const FMT = { edgeDensity: v => v.toFixed(4), ridgeP10: v => v.toFixed(3), snowPatch: v => v.toFixed(4),
              luma: v => v.toFixed(3), hue: v => v.toFixed(0), sat: v => v.toFixed(3) };
export function table(res) {
  const L = [];
  L.push('  ' + path.basename(res.frame) + (res.sky ? (res.sky.keyed ? '   (sky keyed: ' + (res.sky.frac * 100).toFixed(1) + '% of the frame off snow and edge density)' : '   (UNKEYED: no .sky.png — snow and edge density include the sky)') : ''));
  L.push('  property        frame     ' + res.plates.map(n => (n + ' band').padEnd(22)).join('') + 'verdict');
  for (const r of res.rows) {
    const f = FMT[r.k];
    L.push('  ' + r.k.padEnd(16) + (r.gv === null ? '—' : f(r.gv)).padEnd(10) +
      r.cells.map(c => (c.b ? '[' + f(c.b.lo) + ' … ' + f(c.b.hi) + ']' + (c.ok ? '*' : '') : '—').padEnd(22)).join('') +
      (r.ok ? 'IN BAND' : 'OUT  (' + r.miss.toFixed(2) + ' half-widths from nearest)'));
  }
  L.push('  ' + res.inCount + ' of ' + res.judged + ' in band   (* = inside that plate)');
  return L.join('\n');
}

/* ---- THE BIRD AGAINST ITS APPROVED RENDER (SPIKE_ADOPT row 5, 2026-10-03) ----
   Eric: "the bird's bronze and dark rims are the test case — add a bird-vs-approved-render colour
   property to framescore". A whole-frame statistic cannot see the bird (it is 1% of a play frame), so
   this one is measured ON THE BIRD: the caller hands a mask of the body (gauntlet/verify/birdcolour.mjs
   shoots the game with and without the bird), and the reference is the approved package's own
   canonical render of the same view (BIRD_STATE section 2: canonical_renders/folded_rear.png, rendered
   from the decoded mesh and its embedded textures — "what the approved bird means").
   THREE PROPERTIES, the ones a grade can break and the albedo carries:
     hue   circular mean hue of the body, degrees — the BRONZE (an olive-brown ~40-60 deg)
     sat   median HSV saturation of the body — a grade that greys or cooks the bronze moves this
     rim   fraction of body pixels under 0.65 x their NEIGHBOURHOOD's mean luma (see birdProps) — the
           DARK FEATHER RIMS that draw the scalloping; a crushed grade fills them, a lifted one empties them
   LUMA IS NOT JUDGED: the canonical render is flat-lit on a pale backdrop and the game is sun and sky,
   so their brightness differs by design. It is reported.
   THE BAND is platescore's rule: the reference's four vertical tiles over the body set the spread,
   widened to at least +/-18% of the mean; hue gets the fixed +/-30 degrees. */
export const BIRDREF = path.join(ROOT, 'assets/models/astra_incoming/approved/canonical_renders/folded_rear.png');
export const BIRDPROPS = ['hue', 'sat', 'rim'];
const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d > 0) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx]; };
/* birdProps(buf, w, h, mask[, x0, x1]) — buf is packed RGB bytes, mask a Uint8Array of the body */
/* RIM IS LOCAL. The first cut compared each pixel with the body's median luma, and in the game that
   read the SUN, not the feathers: the shaded flank of a sunlit bird is a third of its pixels, all
   "dark" (rim 0.18-0.27 against the flat-lit render's 0.06). So a rim pixel is one under 0.65 x the
   mean luma of the body pixels round it, in a window scaled to the bird (sqrt(area)/40 px) — a high
   pass, which keeps the scalloping and drops the light's slow gradient across the body. */
export function birdProps(buf, w, h, mask, x0 = 0, x1 = w) {
  const Lm = new Float32Array(w * h), S = []; let hx = 0, hy = 0, n = 0;
  for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) { const j = y * w + x; if (!mask[j]) continue;
    const i = j * 3, r = buf[i] / 255, g = buf[i + 1] / 255, b = buf[i + 2] / 255, [H, Sv] = hsv(r, g, b);
    Lm[j] = 0.2126 * r + 0.7152 * g + 0.0722 * b; S.push(Sv);
    hx += Math.cos(H * Math.PI / 180) * Sv; hy += Math.sin(H * Math.PI / 180) * Sv; n++; }
  if (n < 200) return null;
  /* integral images of masked luma and mask count, over the WHOLE mask (a tile's window may look past its edge) */
  let area = 0; for (let j = 0; j < w * h; j++) if (mask[j]) area++;
  const R = Math.max(2, Math.round(Math.sqrt(area) / 40)), W1 = w + 1, IL = new Float64Array(W1 * (h + 1)), IC = new Float64Array(W1 * (h + 1));
  for (let y = 0; y < h; y++) { let sl = 0, sc = 0; for (let x = 0; x < w; x++) { const j = y * w + x;
    if (mask[j]) { const i = j * 3; sl += (0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2]) / 255; sc++; }
    IL[(y + 1) * W1 + x + 1] = IL[y * W1 + x + 1] + sl; IC[(y + 1) * W1 + x + 1] = IC[y * W1 + x + 1] + sc; } }
  const box = (I, xa, ya, xb, yb) => I[yb * W1 + xb] - I[ya * W1 + xb] - I[yb * W1 + xa] + I[ya * W1 + xa];
  let rim = 0; const L = [];
  for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) { const j = y * w + x; if (!mask[j]) continue; L.push(Lm[j]);
    const xa = Math.max(0, x - R), xb = Math.min(w, x + R + 1), ya = Math.max(0, y - R), yb = Math.min(h, y + R + 1);
    const c = box(IC, xa, ya, xb, yb); if (c && Lm[j] < 0.65 * box(IL, xa, ya, xb, yb) / c) rim++; }
  const med = a => { const s = Float64Array.from(a).sort(); return s[s.length >> 1]; };
  return { n, hue: (Math.atan2(hy, hx) * 180 / Math.PI + 360) % 360, sat: med(S), rim: rim / n, luma: med(L), window: R };
}
/* the reference's body: everything that is not the pale backdrop (blue-grey, b >= r) or its floor shadow */
export function birdRefMask(buf, w, h) {
  const m = new Uint8Array(w * h);
  for (let j = 0; j < w * h; j++) { const r = buf[j * 3], g = buf[j * 3 + 1], b = buf[j * 3 + 2], l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    m[j] = (r - b > 12 || l < 0.35) ? 1 : 0; }
  return erode(m, w, h, 2);
}
export function erode(m, w, h, R) { const o = new Uint8Array(w * h);
  for (let y = R; y < h - R; y++) for (let x = R; x < w - R; x++) { let k = 1;
    for (let dy = -R; dy <= R && k; dy++) for (let dx = -R; dx <= R; dx++) if (!m[(y + dy) * w + x + dx]) { k = 0; break; }
    o[y * w + x] = k; } return o; }
/* birdBand(im) — im defaults to the canonical render at its own 1000 px. THE CALLER SHOULD SCALE IT TO
   THE GAME BIRD'S SIZE (birdcolour.mjs does, by body area): rim is a per-pixel quantity, and a 1 px dark
   feather edge on an 850 px bird is half a pixel on the game's 450 px one (measured: rim read under the
   band at every grade, the ungraded frame included, until the two were compared at one scale). */
export function birdBand(im = loadRGB(BIRDREF)) {
  const W = im.w, H = im.h, M = birdRefMask(im.buf, W, H);
  let lo = W, hi = 0; for (let j = 0; j < W * H; j++) if (M[j]) { const x = j % W; lo = Math.min(lo, x); hi = Math.max(hi, x); }
  const whole = birdProps(im.buf, W, H, M), tiles = [];
  for (let t = 0; t < 4; t++) { const p = birdProps(im.buf, W, H, M, lo + Math.floor((hi - lo) * t / 4), lo + Math.floor((hi - lo) * (t + 1) / 4)); if (p) tiles.push(p); }
  const band = {};
  for (const k of BIRDPROPS) { const v = tiles.map(p => p[k]), c = whole[k];
    if (k === 'hue') { band[k] = { lo: c - 30, hi: c + 30 }; continue; }
    const pad = Math.abs(c) * 0.18; band[k] = { lo: Math.min(Math.min(...v), c - pad), hi: Math.max(Math.max(...v), c + pad) }; }
  return { ref: whole, band };
}
export function birdScore(p, B = birdBand()) {
  const rows = BIRDPROPS.map(k => { const b = B.band[k], v = p ? p[k] : null;
    const d = k === 'hue' && v !== null ? ((v - B.ref.hue + 540) % 360) - 180 + B.ref.hue : v;      // hue on the reference's side of the circle
    return { k, gv: v, lo: b.lo, hi: b.hi, ok: v !== null && d >= b.lo && d <= b.hi }; });
  return { rows, inCount: rows.filter(r => r.ok).length, judged: rows.length, ref: B.ref };
}

if ((process.argv[1] || '').endsWith('framescore.mjs')) {
  const frames = process.argv.slice(2);
  if (!frames.length) { console.error('usage: node gauntlet/verify/framescore.mjs <frame.png> ...'); process.exit(2); }
  const walls = (process.env.WALL || 'bow') === 'both' ? ['bow', 'spike'] : [process.env.WALL || 'bow'];
  const all = [];
  for (const w of walls) { const P = plates(w); for (const f of frames) all.push({ wall: w, ...scoreFrame(path.resolve(f), P) }); }
  if (process.env.JSON) console.log(JSON.stringify(all.map(r => ({ wall: r.wall, frame: r.frame, inCount: r.inCount,
    judged: r.judged, sky: r.sky, rows: r.rows.map(x => ({ k: x.k, gv: x.gv, ok: x.ok, miss: x.miss })) })), null, 1));
  else for (const w of walls) {
    console.log('FRAMESCORE — platescore.mjs properties, whole frame, against ' + WALLS[w].join(', ') + '\n');
    for (const r of all.filter(r => r.wall === w)) console.log(table(r) + '\n');
  }
}
