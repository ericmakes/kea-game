/* DERIVE THE KEA'S TEXTURES SMALLER, AND TOUCH NOTHING ELSE — SPIKE ADOPTION piece 0, 2026-10-02.

   INPUT (read only): assets/models/astra_incoming/approved/kea_approved.glb and kea_animated.glb,
   Eric's approved character. Each embeds a 4096-square RGBA PNG baseColor (18.7 MB), a 4096-square
   normal map (8.7 MB) and a constant 512-square metallicRoughness (126 bytes).
   OUTPUT: assets/models/kea/<name>_<tier>.glb, two tiers per file:
     2048png   PRIMARY. 2048-square PNG, alpha preserved. A quarter of the texels of the source.
     1024webp  FALLBACK. 1024-square WebP q90 with lossless alpha, EXT_texture_webp — the spike's
               slimming, which is what Eric judged as looking right at the carpark distance. The
               spike ALSO ran meshopt and dropped clips; this does NEITHER, because the brief is
               "images only changed" and meshopt re-quantises every vertex.

   WHY A BINARY REWRITE AND NOT gltf-transform's io.write. A NodeIO round trip re-packs every buffer
   view, re-orders accessors and re-serialises floats from the decoded document — the values usually
   survive, but "usually, by value" is not what was asked. So gltf-transform is used for nothing
   here but its sharp dependency's sibling: this file splices the GLB itself. The JSON is parsed,
   the two big image bufferViews get new payloads, every bufferView is laid back out in its
   ORIGINAL ORDER with its ORIGINAL BYTES, and only byteOffset/byteLength/buffer.byteLength and the
   two images' mimeType change. Every accessor, skin, animation sampler and morph target therefore
   reads the identical bytes from the identical relative position, and `--verify` proves it by
   hashing every non-image bufferView in both files.

   THE RESIZES, AND WHY EACH IS DONE THE WAY IT IS.
     baseColor  in LINEAR light (sharp pipelineColourspace rgb16) with premultiplied alpha. sRGB-space
                averaging darkens every edge between a light and a dark feather, and un-premultiplied
                alpha drags the colour of a transparent texel into its opaque neighbour — a halo on
                every feather tip under alphaMode BLEND. Lanczos3, sharp's default.
     normal     as DATA, never as colour: no ICC, no gamma, then every texel RENORMALISED to unit
                length, because averaging unit vectors shortens them and a short normal lights flat.
                Its alpha is a constant 255 in the source and stays 255.
     metallicRoughness  untouched — 126 bytes of constant colour.

   Usage: node tools/derive_kea_textures.mjs            write all four, then verify
          node tools/derive_kea_textures.mjs --verify   verify only */
import fs from 'fs'; import path from 'path'; import url from 'url'; import crypto from 'crypto';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets/models/astra_incoming/approved');
const OUT = path.join(ROOT, 'assets/models/kea');
const FILES = ['kea_approved', 'kea_animated'];
export const TIERS = {
  '2048png':  { size: 2048, fmt: 'png' },
  '1024webp': { size: 1024, fmt: 'webp' },
};

function readGLB(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error(file + ': not a glb');
  let off = 12, json = null, bin = null;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4E4F534A) json = JSON.parse(data.toString('utf8'));
    else if (type === 0x004E4942) bin = data;
    off += 8 + len + ((len % 4) ? 4 - (len % 4) : 0);
  }
  if (!json || !bin) throw new Error(file + ': missing JSON or BIN chunk');
  if ((json.buffers || []).length !== 1) throw new Error(file + ': expected exactly one buffer');
  return { json, bin };
}

function writeGLB(file, json, bin) {
  const pad = (b, c) => b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - b.length % 4, c)]) : b;
  const j = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20), B = pad(bin, 0);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + 8 + j.length + 8 + B.length, 8);
  const ch = (len, type) => { const h = Buffer.alloc(8); h.writeUInt32LE(len, 0); h.writeUInt32LE(type, 4); return h; };
  fs.writeFileSync(file, Buffer.concat([head, ch(j.length, 0x4E4F534A), j, ch(B.length, 0x004E4942), B]));
}

const bvBytes = (g, i) => { const v = g.json.bufferViews[i]; return g.bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); };

/* which image is which, read off the material rather than off the image names */
function roles(json) {
  const m = json.materials[0], tex = i => json.textures[i].source;
  return { base: tex(m.pbrMetallicRoughness.baseColorTexture.index), normal: tex(m.normalTexture.index) };
}

async function resizeBase(png, { size, fmt }) {
  let p = sharp(png).pipelineColourspace('rgb16').resize(size, size, { kernel: 'lanczos3' }).toColourspace('srgb');
  return fmt === 'png' ? p.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
                       : p.webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
}

async function resizeNormal(png, { size, fmt }) {
  const { data, info } = await sharp(png).resize(size, size, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  for (let i = 0; i < data.length; i += ch) {
    const x = data[i] / 127.5 - 1, y = data[i + 1] / 127.5 - 1, z = data[i + 2] / 127.5 - 1;
    const l = Math.hypot(x, y, z) || 1;
    data[i] = Math.round((x / l + 1) * 127.5); data[i + 1] = Math.round((y / l + 1) * 127.5); data[i + 2] = Math.round((z / l + 1) * 127.5);
    if (ch === 4) data[i + 3] = 255;
  }
  const p = sharp(data, { raw: { width: size, height: size, channels: ch } });
  return fmt === 'png' ? p.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
                       : p.webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
}

async function derive(name, tierName) {
  const tier = TIERS[tierName];
  const g = readGLB(path.join(SRC, name + '.glb'));
  const json = structuredClone(g.json);
  const R = roles(json);
  const repl = new Map();   // bufferView index -> new bytes
  repl.set(json.images[R.base].bufferView, await resizeBase(bvBytes(g, json.images[R.base].bufferView), tier));
  repl.set(json.images[R.normal].bufferView, await resizeNormal(bvBytes(g, json.images[R.normal].bufferView), tier));
  if (tier.fmt === 'webp') {
    for (const i of [R.base, R.normal]) json.images[i].mimeType = 'image/webp';
    json.extensionsUsed = [...new Set([...(json.extensionsUsed || []), 'EXT_texture_webp'])];
    json.extensionsRequired = [...new Set([...(json.extensionsRequired || []), 'EXT_texture_webp'])];
    /* EXT_texture_webp puts the WebP source on the TEXTURE, not in images[].mimeType alone. three's
       GLTFLoader reads textures[i].extensions.EXT_texture_webp.source and falls back to .source;
       setting both to the same image keeps it valid either way. */
    for (const t of json.textures) if (t.source === R.base || t.source === R.normal)
      t.extensions = { ...(t.extensions || {}), EXT_texture_webp: { source: t.source } };
  }
  /* lay every bufferView back out IN ITS ORIGINAL ORDER BY OFFSET, 4-byte aligned as the spec
     requires for accessor data, carrying its original bytes unless it is one of the two images */
  const order = json.bufferViews.map((v, i) => i).sort((a, b) => (g.json.bufferViews[a].byteOffset || 0) - (g.json.bufferViews[b].byteOffset || 0));
  const parts = []; let off = 0;
  for (const i of order) {
    const bytes = repl.get(i) || bvBytes(g, i);
    const padN = off % 4 ? 4 - off % 4 : 0;
    if (padN) { parts.push(Buffer.alloc(padN)); off += padN; }
    json.bufferViews[i].byteOffset = off; json.bufferViews[i].byteLength = bytes.length;
    parts.push(bytes); off += bytes.length;
  }
  json.buffers[0].byteLength = off;
  fs.mkdirSync(OUT, { recursive: true });
  const dst = path.join(OUT, `${name}_${tierName}.glb`);
  writeGLB(dst, json, Buffer.concat(parts));
  return dst;
}

/* THE PROOF. Byte-identical means byte-identical: every bufferView that is not one of the two
   resized images must hash the same in both files, and the JSON must be identical once the fields
   this tool is ALLOWED to touch are removed from both. Anything else is a rejection, named. */
export function verify(name, tierName) {
  const a = readGLB(path.join(SRC, name + '.glb'));
  const b = readGLB(path.join(OUT, `${name}_${tierName}.glb`));
  const R = roles(a.json), imgBV = new Set([a.json.images[R.base].bufferView, a.json.images[R.normal].bufferView]);
  const errs = [];
  if (a.json.bufferViews.length !== b.json.bufferViews.length) errs.push('bufferView count changed');
  let same = 0;
  a.json.bufferViews.forEach((v, i) => {
    if (imgBV.has(i)) return;
    const h = g => crypto.createHash('sha256').update(bvBytes(g, i)).digest('hex');
    if (h(a) !== h(b)) errs.push('bufferView ' + i + ' bytes differ'); else same++;
    for (const k of ['byteStride', 'target', 'buffer']) if (v[k] !== b.json.bufferViews[i][k]) errs.push('bufferView ' + i + ' ' + k + ' changed');
  });
  const strip = j => { const c = structuredClone(j);
    c.bufferViews = c.bufferViews.map(({ byteOffset, byteLength, ...rest }) => rest);
    c.buffers = c.buffers.map(({ byteLength, ...rest }) => rest);
    for (const i of [R.base, R.normal]) delete c.images[i].mimeType;
    for (const t of c.textures) if (t.extensions) { delete t.extensions.EXT_texture_webp; if (!Object.keys(t.extensions).length) delete t.extensions; }
    for (const k of ['extensionsUsed', 'extensionsRequired']) if (c[k]) { c[k] = c[k].filter(e => e !== 'EXT_texture_webp'); if (!c[k].length) delete c[k]; }
    return JSON.stringify(c); };
  if (strip(a.json) !== strip(b.json)) errs.push('JSON differs outside the allowed fields');
  return { name, tierName, errs, sameViews: same, imageViews: imgBV.size,
           bytesIn: fs.statSync(path.join(SRC, name + '.glb')).size, bytesOut: fs.statSync(path.join(OUT, `${name}_${tierName}.glb`)).size };
}

if ((process.argv[1] || '').endsWith('derive_kea_textures.mjs')) {
  if (!process.argv.includes('--verify'))
    for (const n of FILES) for (const t of Object.keys(TIERS)) console.log('wrote', path.relative(ROOT, await derive(n, t)));
  let bad = 0;
  for (const n of FILES) for (const t of Object.keys(TIERS)) {
    const r = verify(n, t); if (r.errs.length) bad++;
    console.log(`${n}_${t}: ${r.errs.length ? 'REJECT ' + r.errs.slice(0, 5).join('; ') : 'IMAGES ONLY'}  ` +
      `${r.sameViews} views byte-identical, ${r.imageViews} image views replaced, ` +
      `${(r.bytesIn / 1e6).toFixed(2)} MB -> ${(r.bytesOut / 1e6).toFixed(2)} MB`);
  }
  process.exit(bad ? 1 : 0);
}
