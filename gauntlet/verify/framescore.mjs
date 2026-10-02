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
import { bandNorm, measureAll, plateBand, NORMW } from './platescore.mjs';

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
const plateFile = n => n === 'spike_01' ? SPIKE_FRAME : path.join(BOARD, n + '.jpg');

export function plates(wall = 'bow') {
  const out = {};
  for (const n of WALLS[wall]) {
    const im = bandNorm(plateFile(n), 0, 1, NORMW);
    out[n] = plateBand(im, masker(PLATEMASK[n], im));
  }
  return out;
}

export function scoreFrame(frame, P) {
  const names = Object.keys(P);
  const im = bandNorm(frame, 0, 1, NORMW);
  const g = measureAll(im, masker(GAMEHUD, im));
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
  return { frame, game: g, rows, inCount, judged: JUDGED.length, plates: names };
}

export const FMT = { edgeDensity: v => v.toFixed(4), ridgeP10: v => v.toFixed(3), snowPatch: v => v.toFixed(4),
              luma: v => v.toFixed(3), hue: v => v.toFixed(0), sat: v => v.toFixed(3) };
export function table(res) {
  const L = [];
  L.push('  ' + path.basename(res.frame));
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

if ((process.argv[1] || '').endsWith('framescore.mjs')) {
  const frames = process.argv.slice(2);
  if (!frames.length) { console.error('usage: node gauntlet/verify/framescore.mjs <frame.png> ...'); process.exit(2); }
  const walls = (process.env.WALL || 'bow') === 'both' ? ['bow', 'spike'] : [process.env.WALL || 'bow'];
  const all = [];
  for (const w of walls) { const P = plates(w); for (const f of frames) all.push({ wall: w, ...scoreFrame(path.resolve(f), P) }); }
  if (process.env.JSON) console.log(JSON.stringify(all.map(r => ({ wall: r.wall, frame: r.frame, inCount: r.inCount,
    judged: r.judged, rows: r.rows.map(x => ({ k: x.k, gv: x.gv, ok: x.ok, miss: x.miss })) })), null, 1));
  else for (const w of walls) {
    console.log('FRAMESCORE — platescore.mjs properties, whole frame, against ' + WALLS[w].join(', ') + '\n');
    for (const r of all.filter(r => r.wall === w)) console.log(table(r) + '\n');
  }
}
