/* DERIVE CLOUD CARDS — alpha-cut cumulus photographs for the photo-cloud sky (SPIKE_ADOPT 25, Eric 2026-10-04: "(B) PHOTO
   CLOUD CARDS - alpha-cut CC0 cloud photographs on layered billboards at altitude").
   SOURCE (CC0): Poly Haven kloofendal_48d_partly_cloudy_puresky, the 8K tonemapped JPG the API publishes (md5 checked):
   a clear fair-weather sky with isolated cumulus near the horizon — the clear alpine morning the game keeps.
   THE KEY: a cloud is bright and NEUTRAL, the sky is blue. alpha = smoothstep on blueness (b - r, 45 -> 15) times
   smoothstep on luma (0.42 -> 0.58), over the band 3-35 degrees above the horizon (equirect rows; the distortion there
   is small). THE SOFT EDGE IS UN-BLENDED: a half-alpha pixel is half sky, so its colour is (c - (1 - a) * sky) / a with
   sky the row's median sky colour — otherwise every card carries a blue fringe onto whatever sky it is drawn over.
   CARDS are the connected components of the key (on a quarter-scale mask), largest first, cropped with a margin, at
   most 1024 wide, RGBA PNG (straight alpha). It prints each card's size and the licence row.
   Usage: node tools/derive_cloud_cards.mjs [N=10] [outDir=assets/sky/cards] */
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import sharp from 'sharp';
const N = +(process.argv[2] || 10), OUT = process.argv[3] || 'assets/sky/cards';
const ID = 'kloofendal_48d_partly_cloudy_puresky', MD5 = '3f2b19fa9c14943b34e5d4f480ba13ba';
const SRC = 'raw_polyhaven/clouds/' + ID + '.jpg', URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/' + ID + '.jpg';
const md5 = b => crypto.createHash('md5').update(b).digest('hex');
if (!fs.existsSync(SRC) || md5(fs.readFileSync(SRC)) !== MD5) { const r = await fetch(URL); const b = Buffer.from(await r.arrayBuffer());
  if (md5(b) !== MD5) throw new Error('derive_cloud_cards: ' + URL + ' md5 ' + md5(b)); fs.mkdirSync(path.dirname(SRC), { recursive: true }); fs.writeFileSync(SRC, b); }
const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, rowOf = el => Math.round((90 - el) / 180 * H);
const y0 = rowOf(35), y1 = rowOf(3), BH = y1 - y0;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* the row's sky: median colour of the bluest half of the row */
const sky = []; for (let y = y0; y < y1; y++) { const px = []; for (let x = 0; x < W; x += 4) { const i = (y * W + x) * 3; px.push([data[i], data[i + 1], data[i + 2], data[i + 2] - data[i]]); }
  px.sort((a, b) => b[3] - a[3]); const top = px.slice(0, px.length >> 1); const med = k => top.map(p => p[k]).sort((a, b) => a - b)[top.length >> 1]; sky.push([med(0), med(1), med(2)]); }
const A = new Float32Array(W * BH);
for (let y = 0; y < BH; y++) for (let x = 0; x < W; x++) { const i = ((y + y0) * W + x) * 3, r = data[i], g = data[i + 1], b = data[i + 2];
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; A[y * W + x] = sm(45, 15, b - r) * sm(0.42, 0.58, L); }
/* components on a quarter-scale mask */
const q = 4, w4 = Math.floor(W / q), h4 = Math.floor(BH / q), M = new Uint8Array(w4 * h4), lab = new Int32Array(w4 * h4);
for (let y = 0; y < h4; y++) for (let x = 0; x < w4; x++) { let s = 0; for (let dy = 0; dy < q; dy++) for (let dx = 0; dx < q; dx++) s += A[(y * q + dy) * W + x * q + dx]; M[y * w4 + x] = s / (q * q) > 0.3 ? 1 : 0; }
const comps = []; let id = 0;
for (let j = 0; j < M.length; j++) { if (!M[j] || lab[j]) continue; id++; const st = [j]; lab[j] = id; let n = 0, xa = 1e9, xb = -1, ya = 1e9, yb = -1;
  while (st.length) { const k = st.pop(), x = k % w4, y = (k / w4) | 0; n++; xa = Math.min(xa, x); xb = Math.max(xb, x); ya = Math.min(ya, y); yb = Math.max(yb, y);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w4 || ny >= h4) continue; const kk = ny * w4 + nx; if (M[kk] && !lab[kk]) { lab[kk] = id; st.push(kk); } } }
  comps.push({ n, xa, xb, ya, yb }); }
/* each component's id, so a card keeps ONLY its own cloud (its cells dilated by 2) — neighbours inside the crop are cut */
comps.forEach((c, k) => c.id = k + 1);
const own = (c, gx, gy) => { const cx = Math.floor(gx / q), cy = Math.floor(gy / q); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = cx + dx, y = cy + dy;
  if (x >= 0 && y >= 0 && x < w4 && y < h4 && lab[y * w4 + x] === c.id) return true; } return false; };
/* HOLLOW AND RAGGED CARDS ARE REFUSED: near the sun the sky is pale too and the key drops a cloud's bright core (measured:
   four of the first twelve had blue holes or were rings). A hole is not part of the component, so it is found the other way:
   flood the bounding box from its border through non-cloud cells; a non-cloud cell the flood cannot reach is ENCLOSED.
   holes / (cloud + holes) over 0.05 is hollow. And a cloud filling under 40% of its box is a hook or a wisp, not a cumulus. */
const hollow = c => { const bw = c.xb - c.xa + 1, bh = c.yb - c.ya + 1, seen = new Uint8Array(bw * bh), st = [];
  const inC = (x, y) => lab[(c.ya + y) * w4 + c.xa + x] === c.id;
  for (let x = 0; x < bw; x++) for (const y of [0, bh - 1]) if (!inC(x, y)) { seen[y * bw + x] = 1; st.push([x, y]); }
  for (let y = 0; y < bh; y++) for (const x of [0, bw - 1]) if (!inC(x, y) && !seen[y * bw + x]) { seen[y * bw + x] = 1; st.push([x, y]); }
  while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= bw || ny >= bh || seen[ny * bw + nx] || inC(nx, ny)) continue; seen[ny * bw + nx] = 1; st.push([nx, ny]); } }
  let holes = 0; for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (!inC(x, y) && !seen[y * bw + x]) holes++;
  return holes / (c.n + holes) > 0.05 || c.n / (bw * bh) < 0.4 ? 1 : 0; };
/* largest first; not touching the band's top or bottom (cut-off clouds), not a sliver, not hollow */
const pick = comps.filter(c => c.ya > 1 && c.yb < h4 - 2 && (c.xb - c.xa) > 12 && (c.yb - c.ya) > 6 && (c.xb - c.xa) / (c.yb - c.ya + 1) < 6 && hollow(c) < 0.15).sort((a, b) => b.n - a.n).slice(0, N);
fs.mkdirSync(OUT, { recursive: true }); const rows = [];
for (let c = 0; c < pick.length; c++) { const P = pick[c], mg = 6;
  const x0 = Math.max(0, (P.xa - mg) * q), x1 = Math.min(W, (P.xb + mg + 1) * q), ya = Math.max(0, (P.ya - mg) * q), yb = Math.min(BH, (P.yb + mg + 1) * q), cw = x1 - x0, ch = yb - ya;
  const buf = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const gy = ya + y, gx = x0 + x, i = ((gy + y0) * W + gx) * 3, a = own(P, gx, gy) ? A[gy * W + gx] : 0, s = sky[gy], o = (y * cw + x) * 4;
    for (let k = 0; k < 3; k++) buf[o + k] = a > 0.02 ? Math.round(Math.min(255, Math.max(0, (data[i + k] - (1 - a) * s[k]) / a))) : 255;
    buf[o + 3] = Math.round(a * 255); }
  const f = path.join(OUT, 'cloud_' + String(c).padStart(2, '0') + '.png');
  let img = sharp(buf, { raw: { width: cw, height: ch, channels: 4 } }); if (cw > 1024) img = img.resize(1024);
  await img.png().toFile(f); const m = await sharp(f).metadata();
  rows.push({ f, w: m.width, h: m.height, md5: md5(fs.readFileSync(f)) }); console.log(`  ${f}  ${m.width} x ${m.height}  (${P.n * q * q} px of cloud)`); }
fs.writeFileSync(path.join(OUT, 'cards.json'), JSON.stringify(rows.map(r => ({ file: path.basename(r.f), w: r.w, h: r.h })), null, 1));
console.log(`DERIVE_CLOUD_CARDS ${rows.length} cards from ${ID} (CC0, md5 ${MD5}) -> ${OUT}`);
console.log(`  licence row: | \`sky/cards/cloud_00..${String(rows.length - 1).padStart(2, '0')}.png\` | cumulus cut from ${ID} | Poly Haven (CC0) | CC0 | tonemapped 8K JPG md5 \`${MD5}\` |`);
