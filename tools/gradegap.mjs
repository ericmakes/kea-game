/* GRADE GAP — a frame against its map's spike-standard target, in CIE Lab, on the GROUND and on the SKY apart (Eric
   2026-10-04, the Ski Field: "Tell me the measured grade gap between the after frames and TARGET 28"). Each image is
   split by its sky key (the frame's own <name>.sky.png from capture SKYKEY=1; a target uses the key stored beside it),
   the HUD rectangles left out of game frames. Per region: mean L (brightness), the spread of L (contrast), mean a* and
   b* (green-red, blue-yellow: warmth), mean chroma (colourfulness).
   Usage: node tools/gradegap.mjs <target.jpg> <frame.png> [frame.png ...] */
import fs from 'fs'; import sharp from 'sharp';
const files = process.argv.slice(2);
if (files.length < 2) { console.error('usage: node tools/gradegap.mjs <target> <frame> [...]'); process.exit(2); }
const s2l = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4), f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
const lab = (r, g, b) => { const R = s2l(r / 255), G = s2l(g / 255), B = s2l(b / 255);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; };
const HUD = [[338 / 960, 8 / 540, 626 / 960, 48 / 540], [874 / 960, 4 / 540, 952 / 960, 44 / 540], [10 / 960, 454 / 540, 250 / 960, 530 / 540], [410 / 960, 496 / 540, 550 / 960, 532 / 540]];
async function stats(img, isTarget) {
  const W = 960, H = 540, key = img.replace(/\.(png|jpe?g)$/, '.sky.png');
  if (!fs.existsSync(key)) throw new Error('gradegap: no sky key at ' + key);
  const d = (await sharp(img).removeAlpha().resize(W, H, { fit: 'fill' }).raw().toBuffer()), k = (await sharp(key).removeAlpha().resize(W, H, { fit: 'fill', kernel: 'nearest' }).raw().toBuffer());
  const reg = { ground: [], sky: [] };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3;
    if (!isTarget && HUD.some(r => x >= r[0] * W && x <= r[2] * W && y >= r[1] * H && y <= r[3] * H)) continue;
    const sky = k[i] > k[i + 1] + 25 && k[i + 2] > k[i + 1] + 25; reg[sky ? 'sky' : 'ground'].push(lab(d[i], d[i + 1], d[i + 2])); }
  const ms = a => { if (!a.length) return null; const m = [0, 1, 2].map(c => a.reduce((t, v) => t + v[c], 0) / a.length);
    return { L: m[0], Lsd: Math.sqrt(a.reduce((t, v) => t + (v[0] - m[0]) ** 2, 0) / a.length), a: m[1], b: m[2], C: a.reduce((t, v) => t + Math.hypot(v[1], v[2]), 0) / a.length }; };
  return { g: ms(reg.ground), s: ms(reg.sky) }; }
const f1 = v => v.toFixed(1).padStart(6);
console.log('frame'.padEnd(26) + 'GROUND   L  spread     a*     b*  chroma  |  SKY   L     b*');
const T = await stats(files[0], true);
const row = (n, r) => console.log(n.padEnd(26) + '      ' + f1(r.g.L) + f1(r.g.Lsd) + f1(r.g.a) + f1(r.g.b) + f1(r.g.C) + '  |  ' + (r.s ? f1(r.s.L) + f1(r.s.b) : '     —'));
row('TARGET ' + files[0].split('/').pop(), T);
for (const fr of files.slice(1)) { const r = await stats(fr, false); row(fr.split('/').pop(), r);
  console.log(''.padEnd(26) + '  gap ' + f1(r.g.L - T.g.L) + f1(r.g.Lsd - T.g.Lsd) + f1(r.g.a - T.g.a) + f1(r.g.b - T.g.b) + f1(r.g.C - T.g.C) + '  |  ' + (r.s && T.s ? f1(r.s.L - T.s.L) + f1(r.s.b - T.s.b) : '')); }
