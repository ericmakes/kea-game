/* GRADE A TARGET — put the approved grade on a spike-standard target. Eric, 2026-10-04: "the spike-standard target for
   [each map] must be built with the same grade, so every map inherits the look I approved" (SPIKE_ADOPT 21).

   A map's target is its key vantage brought to the spike's standard (an image-to-image pass over the game's own pinned
   frame, the spike frame as the material reference). A generator grades however it likes, so the grade is not left to
   it: the target is run through THE GAME'S OWN GRADE OPERATOR — the arithmetic of gradePass in src/post.mjs, with the
   values FILM.grade ships, read out of that file so the two cannot drift. Same operator, same numbers, on every map.
   WHY NOT A STATISTICS TRANSFER, which this file did first: matching each Lab channel's mean and spread to the spike
   frame put the spike's CONTENT on the target — a snowfield forced to a carpark's mean brightness came out murky
   yellow-grey (ground L 67 -> 44). A grade is an operator applied to a picture, not the picture's statistics.
   Grain is left out (it is noise, and the target is a reference, not a frame). The proof is reported, not asserted:
   framescore WALL=spike on the result — content still differs between maps, so a target is not required to land in
   the carpark's bands, and saying otherwise would be the mistake above.
   Usage: node tools/grade_match.mjs <in.png> <out.png> */
import fs from 'fs'; import sharp from 'sharp';
const [IN, OUT] = process.argv.slice(2);
if (!IN || !OUT) { console.error('usage: node tools/grade_match.mjs <in.png> <out.png>'); process.exit(2); }
/* FILM.grade as shipped, read from src/post.mjs (one line, `grade: { ... }`) */
const line = fs.readFileSync('src/post.mjs', 'utf8').split('\n').find(l => /^\s*grade:\s*\{/.test(l));
if (!line) throw new Error('grade_match: no `grade: {...}` line in src/post.mjs');
const num = k => { const m = line.match(new RegExp('\\b' + k + ':\\s*(-?[0-9.]+)')); return m ? +m[1] : null; };
const on = /\bon:\s*true/.test(line), form = (line.match(/form:\s*'(\w+)'/) || [])[1] || 'luma';
const G = { sat: num('sat'), warm: num('warm'), warmG: num('warmG') ?? 0.35, contrast: num('contrast'), lift: num('lift') ?? 0, vig: num('vig') };
if (!on) throw new Error('grade_match: FILM.grade is off in src/post.mjs — there is no shipped grade to apply');
if (form !== 'luma') throw new Error('grade_match: only the shipped luma form is ported (got ' + form + ')');
const { data, info } = await sharp(IN).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, out = Buffer.alloc(W * H * 3);
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3;
  let d = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
  const l = 0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2];
  d = d.map(c => l + (c - l) * G.sat);                                                    // mix(vec3(l), d, uSat)
  d = [d[0] * (1 + G.warm), d[1] * (1 + G.warmG * G.warm), d[2] * (1 - G.warm)];          // the warm tilt
  const l1 = Math.max(0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2], 1e-4), l2 = Math.max((l1 - 0.5) * G.contrast + 0.5 + G.lift, 0);
  d = d.map(c => c * l2 / l1);                                                            // contrast on luma, hue kept
  const u = x / (W - 1) - 0.5, v = (1 - y / (H - 1)) - 0.5, r = Math.hypot(u, v * 0.75);
  const vg = 1 - sm(0.25, 0.85, r) * G.vig;
  for (let k = 0; k < 3; k++) out[i + k] = Math.round(Math.min(1, Math.max(0, d[k] * vg)) * 255); }
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(OUT);
console.log('GRADE_MATCH: ' + IN + ' -> ' + OUT + '  through the shipped FILM.grade ' + JSON.stringify(G));
