/* HDRI — one Poly Haven panorama into the three things the game's light needs, the sun MEASURED off it.
   SPIKE_ADOPT rows 7 and 14, 2026-10-03. The method is the render spike's tools/hdri.mjs (read, not
   copied: the spike folder is reference); the game keeps its own conventions.
     assets/hdri/<name>_ibl.hdr    1024x512 RGBE, the SUN DISC PAINTED OUT: image-based light only
     assets/hdri/<name>_band.jpg   W x N sRGB backplate, elevation BAND[0]..BAND[1], all 360 degrees
     assets/hdri/<name>.json       sun azimuth/elevation/irradiance (linear RGB), band scale
   THE SUN IS REMOVED FROM THE IBL because the game also draws it as the shadow-casting directional
   light; leaving it in both counts it twice and lights every shadow with the sun it is the shadow of.
   Its energy is the sum of radiance x solid angle over the disc, the circumsolar ring's median taken
   off as background, and that is what the directional light is handed.
   THE PANORAMA IS NOT ROTATED HERE. The game already rotates its environment by SKY.envRotationY
   (= game sun azimuth - the HDRI's measured sun azimuth, asserted by a battery); the band is read in
   the shader with the same rotation, so there is exactly one rotation and one author for it.
   MIRROR=1 mirrors the panorama about the sun's own column: the light direction is unchanged and only
   the scenery swaps sides (the spike's move for alps_field).
   GROUND='r,g,b' (linear albedo) REPLACES THE IBL'S LOWER HEMISPHERE with the ground the game draws, lit:
   radiance = albedo x (sun irradiance on a level surface + the sky's own irradiance) / pi, both measured
   off this panorama. Image-based light from below is light bounced off the ground, and the ground in
   the photograph is not the game's — lago_disola's is a frozen lake, which would light every underside
   in a tussock carpark white and cold. The BAND keeps the photograph's own ground: it is a picture of
   far country, not light. Blended across -GROUNDFADE..0 degrees of elevation so there is no seam.
   It ASSERTS: one sun found (peak > 1000 x the sky median), the disc is gone from the IBL (no pixel in
   it over 2x the ring), the band and IBL decode, the energy books balance within 1%.
   Usage: node tools/hdri.mjs <src.hdr> [name]     env BAND='-4,30'  BANDW=8192  MIRROR=0 */
import fs from 'fs'; import path from 'path'; import sharp from 'sharp';

const MAIN = (process.argv[1] || '').endsWith('hdri.mjs'), SRC = MAIN ? process.argv[2] : null;
if (MAIN && !SRC) { console.error('usage: node tools/hdri.mjs <src.hdr> [name]'); process.exit(2); }
const NAME = SRC ? (process.argv[3] || path.basename(SRC).replace(/_\d+k\.hdr$/, '').replace(/\.hdr$/, '')) : null;
const OUT = 'assets/hdri';
const BAND = (process.env.BAND || '-4,30').split(',').map(Number);
const BANDW = +(process.env.BANDW || 8192), MIRROR = process.env.MIRROR === '1';
const GROUND = process.env.GROUND ? process.env.GROUND.split(',').map(Number) : null, GROUNDFADE = +(process.env.GROUNDFADE || 3);
if (MAIN) fs.mkdirSync(OUT, { recursive: true });

export function readHDR(f) {
  const b = fs.readFileSync(f); let p = 0;
  const line = () => { let s = ''; while (b[p] !== 10) s += String.fromCharCode(b[p++]); p++; return s; };
  while (line() !== '') {}
  const t = line().split(/\s+/); if (t[0] !== '-Y' || t[2] !== '+X') throw new Error('unsupported orientation ' + t.join(' '));
  const H = +t[1], W = +t[3], px = new Float32Array(W * H * 3), sc = new Uint8Array(W * 4);
  for (let y = 0; y < H; y++) {
    if (b[p] === 2 && b[p + 1] === 2) { p += 4;                         // new-style RLE (Poly Haven)
      for (let c = 0; c < 4; c++) for (let x = 0; x < W;) { let n = b[p++];
        if (n > 128) { n -= 128; const v = b[p++]; while (n--) sc[(x++) * 4 + c] = v; } else while (n--) sc[(x++) * 4 + c] = b[p++]; } }
    else { b.copy(sc, 0, p, p + W * 4); p += W * 4; }                    // flat, as writeHDR writes
    for (let x = 0; x < W; x++) { const e = sc[x * 4 + 3], f2 = e ? Math.pow(2, e - 136) : 0, o = (y * W + x) * 3;
      px[o] = sc[x * 4] * f2; px[o + 1] = sc[x * 4 + 1] * f2; px[o + 2] = sc[x * 4 + 2] * f2; }
  }
  return { W, H, px };
}
function writeHDR(f, W, H, px) {
  const head = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${H} +X ${W}\n`), body = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) { const r = px[i * 3], g = px[i * 3 + 1], bl = px[i * 3 + 2], m = Math.max(r, g, bl);
    if (m < 1e-32) continue; const e = Math.ceil(Math.log2(m) + 1e-9), s = 256 / Math.pow(2, e);
    body[i * 4] = Math.min(255, r * s); body[i * 4 + 1] = Math.min(255, g * s); body[i * 4 + 2] = Math.min(255, bl * s); body[i * 4 + 3] = e + 128; }
  fs.writeFileSync(f, Buffer.concat([head, body]));
}
const lum = (px, i) => 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];

if (MAIN) {
  const fails = [];
  const { W, H, px } = readHDR(SRC);
  const dOm = y => (2 * Math.PI / W) * (Math.PI / H) * Math.cos(Math.PI / 2 - (y + 0.5) / H * Math.PI);
  /* energy of the whole sphere before, for the books */
  let before = 0; for (let y = 0; y < H; y++) { const w = dOm(y); for (let x = 0; x < W; x++) before += lum(px, (y * W + x) * 3) * w; }

  /* ---- the sun: brightest upper-hemisphere pixel, a 1.6 deg disc, a 3.2 deg sampling ring ---- */
  let best = 0, bi = 0; for (let i = 0; i < W * H / 2; i++) { const L = lum(px, i * 3); if (L > best) { best = L; bi = i; } }
  const sx = bi % W, sy = (bi / W) | 0, dp = W / 360, RD = 1.6 * dp, RR = 3.2 * dp;
  const at = (x, y) => ((y * W) + ((x % W) + W) % W) * 3;
  const ring = [[], [], []];
  for (let dy = -RR; dy <= RR; dy++) for (let dx = -RR; dx <= RR; dx++) { const r = Math.hypot(dx, dy); if (r < RD || r > RR) continue;
    const o = at(sx + Math.round(dx), sy + Math.round(dy)); for (let c = 0; c < 3; c++) ring[c].push(px[o + c]); }
  const bg = ring.map(a => a.sort((p, q) => p - q)[a.length >> 1]);
  const skyL = []; for (let y = 0; y < H / 2; y += 4) for (let x = 0; x < W; x += 8) skyL.push(lum(px, at(x, y))); skyL.sort((a, b) => a - b);
  if (!(best > 1000 * skyL[skyL.length >> 1])) fails.push(`no sun disc: peak ${best.toFixed(1)} against sky median ${skyL[skyL.length >> 1].toFixed(3)}`);
  const E = [0, 0, 0]; let cx = 0, cy = 0, cw = 0;
  for (let dy = -RD; dy <= RD; dy++) for (let dx = -RD; dx <= RD; dx++) { if (Math.hypot(dx, dy) > RD) continue;
    const y = sy + Math.round(dy), o = at(sx + Math.round(dx), y), w = dOm(y); let ws = 0;
    for (let c = 0; c < 3; c++) { const v = Math.max(0, px[o + c] - bg[c]); E[c] += v * w; ws += v; px[o + c] = bg[c]; }
    cx += (sx + dx) * ws; cy += (sy + dy) * ws; cw += ws; }
  cx /= cw; cy /= cw;
  for (let dy = -RD; dy <= RD; dy++) for (let dx = -RD; dx <= RD; dx++) { if (Math.hypot(dx, dy) > RD) continue;
    const o = at(sx + Math.round(dx), sy + Math.round(dy)); if (lum(px, o) > 2 * lum(bg, 0)) fails.push('the disc survived the paint-out'); }
  /* three's equirect: u = atan2(z,x)/2pi + 0.5 , v(top=1) = asin(y)/pi + 0.5 — the SAME convention
     as SKY.hdriSunAz (atan2(z,x) of the sun in the unrotated panorama) */
  const sunAz = ((cx + 0.5) / W - 0.5) * 2 * Math.PI, sunEl = Math.PI / 2 - (cy + 0.5) / H * Math.PI;
  let after = 0; for (let y = 0; y < H; y++) { const w = dOm(y); for (let x = 0; x < W; x++) after += lum(px, (y * W + x) * 3) * w; }
  const books = (after + lum(E, 0)) / before;
  if (Math.abs(books - 1) > 0.01) fails.push(`energy books off by ${((books - 1) * 100).toFixed(2)}%`);
  const srcX = x => MIRROR ? Math.round(2 * cx) - x : x;

  /* ---- IBL: box-downsample to 1024x512 ---- */
  const IW = 1024, IH = 512, f = W / IW, ibl = new Float32Array(IW * IH * 3);
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) { let r = 0, g = 0, b2 = 0;
    for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) { const o = at(srcX(x * f + i), y * f + j); r += px[o]; g += px[o + 1]; b2 += px[o + 2]; }
    const o = (y * IW + x) * 3, n = f * f; ibl[o] = r / n; ibl[o + 1] = g / n; ibl[o + 2] = b2 / n; }
  /* the measured ground: horizontal irradiance from the sky hemisphere (sun painted out) + the sun's */
  let groundL = null;
  if (GROUND) { const Es = [0, 0, 0];
    for (let y = 0; y < IH / 2; y++) { const el = Math.PI / 2 - (y + 0.5) / IH * Math.PI, dO = (2 * Math.PI / IW) * (Math.PI / IH) * Math.cos(el);
      for (let x = 0; x < IW; x++) { const o = (y * IW + x) * 3; for (let c = 0; c < 3; c++) Es[c] += ibl[o + c] * Math.sin(el) * dO; } }
    const Eh = [0, 1, 2].map(c => Es[c] + E[c] * Math.sin(sunEl));
    groundL = [0, 1, 2].map(c => GROUND[c] * Eh[c] / Math.PI);
    for (let y = IH / 2; y < IH; y++) { const el = (Math.PI / 2 - (y + 0.5) / IH * Math.PI) * 180 / Math.PI, w = Math.min(1, -el / GROUNDFADE);
      for (let x = 0; x < IW; x++) { const o = (y * IW + x) * 3; for (let c = 0; c < 3; c++) ibl[o + c] = ibl[o + c] * (1 - w) + groundL[c] * w; } }
    console.log(`  ground: albedo ${GROUND.join(',')} x horizontal irradiance ${Eh.map(v => v.toFixed(3)).join(' ')} / pi -> ${groundL.map(v => v.toFixed(4)).join(' ')}`); }
  writeHDR(path.join(OUT, NAME + '_ibl.hdr'), IW, IH, ibl);
  if (readHDR(path.join(OUT, NAME + '_ibl.hdr')).W !== IW) fails.push('the IBL does not decode');

  /* ---- backplate band: rows BAND[0]..BAND[1] deg, resampled to BANDW wide, sRGB of L x scale ---- */
  const y0 = Math.round((90 - BAND[1]) / 180 * H), y1 = Math.round((90 - BAND[0]) / 180 * H);
  const BW = Math.min(BANDW, W), BH = Math.round((y1 - y0) * BW / W), k = W / BW;
  const ls = []; for (let y = y0; y < y1; y += 4) for (let x = 0; x < W; x += 4) ls.push(lum(px, at(x, y))); ls.sort((a, b) => a - b);
  const scale = 0.97 / ls[Math.floor(ls.length * 0.999)];
  const enc = v => { v = Math.max(0, v * scale); v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, Math.round(v * 255))); };
  const band = Buffer.alloc(BW * BH * 3);
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const r = [0, 0, 0]; let n = 0;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) { const o = at(srcX(Math.floor(x * k + i)), Math.min(H - 1, y0 + Math.floor(y * k + j))); r[0] += px[o]; r[1] += px[o + 1]; r[2] += px[o + 2]; n++; }
    const d = (y * BW + x) * 3; band[d] = enc(r[0] / n); band[d + 1] = enc(r[1] / n); band[d + 2] = enc(r[2] / n); }
  await sharp(band, { raw: { width: BW, height: BH, channels: 3 } }).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(OUT, NAME + '_band.jpg'));
  const bm = await sharp(path.join(OUT, NAME + '_band.jpg')).metadata(); if (bm.width !== BW || bm.height !== BH) fails.push('the band does not decode');

  let skyR = 0, skyW = 0; for (let y = 0; y < IH / 2; y++) { const w = Math.cos(Math.PI / 2 - (y + 0.5) / IH * Math.PI);
    for (let x = 0; x < IW; x++) { skyR += lum(ibl, (y * IW + x) * 3) * w; skyW += w; } }
  const meta = { source: path.basename(SRC) + ' (Poly Haven, CC0)', size: [W, H], mirroredAboutSun: MIRROR,
    sun: { azimuthRad: +sunAz.toFixed(4), elevationRad: +sunEl.toFixed(4), elevationDeg: +(sunEl * 180 / Math.PI).toFixed(2),
           irradiance: E.map(v => +v.toFixed(4)), peak: +best.toFixed(0) },
    band: { elevationDeg: BAND, width: BW, height: BH, scale: +scale.toPrecision(6), encoding: 'sRGB of linear L x scale' },
    skyMeanRadiance: +(skyR / skyW).toFixed(4), energyBooks: +books.toFixed(5),
    ground: GROUND ? { albedo: GROUND, radiance: groundL.map(v => +v.toFixed(5)), fadeDeg: GROUNDFADE } : null };
  fs.writeFileSync(path.join(OUT, NAME + '.json'), JSON.stringify(meta, null, 1) + '\n');
  console.log(`HDRI ${SRC} -> ${OUT}/${NAME}_{ibl.hdr,band.jpg,.json}`);
  console.log(`  sun az ${(sunAz * 180 / Math.PI).toFixed(2)} deg  el ${(sunEl * 180 / Math.PI).toFixed(2)} deg  irradiance ${E.map(v => v.toFixed(3)).join(' ')} (linear)  books ${books.toFixed(4)}`);
  console.log(`  ibl ${(fs.statSync(path.join(OUT, NAME + '_ibl.hdr')).size / 1e6).toFixed(2)} MB  band ${BW}x${BH} ${(fs.statSync(path.join(OUT, NAME + '_band.jpg')).size / 1e6).toFixed(2)} MB  scale ${scale.toPrecision(4)}`);
  console.log(fails.length ? fails.map(f => '  ✗ ' + f).join('\n') + '\nHDRI: FAILED' : 'HDRI: OK — sun measured and painted out, IBL and band written');
  process.exit(fails.length ? 1 : 0);
}
