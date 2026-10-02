/* ALPHA MODE — a glTF that says BLEND about an alpha that is really a CUTOUT is drawn as a MASK.
   BIRD RENDER FIX, 2026-10-02. Shared by bird.mjs and models.mjs, so every asset the loader brings
   in obeys one rule.

   WHY. glTF exporters routinely write alphaMode BLEND for any texture with an alpha channel, and
   three turns BLEND into transparent:true, depthWrite:false, alphaTest:0. For an alpha that is
   genuinely a cutout — feather edges, leaf cards — that is the wrong draw path three ways at once,
   all measured on the approved kea (gauntlet/verify/birdsky.mjs):
     the mesh writes no depth, so a transparent object sorted after it (the horizon haze band)
       washes straight over it: 7.7-36% of the bird's pixels at four angles;
     one transparent mesh cannot sort its own triangles: the folded scarlet underwing showed
       through the chest and face, 81-826 px;
     and it is all for nothing, because a cutout has no partial alpha to blend.
   THE ALPHA IS MEASURED, NOT TRUSTED. The base-colour map is drawn into a 256-square canvas and
   its alpha histogram read: if at least `cutoutFrac` of the samples sit at an END (below 8 or above
   247) the alpha is a cutout. The approved kea reads 96.2% at 4096, 2048 and 1024 alike; a truly
   translucent surface (glass, a soft decal) has its mass in the middle and stays BLEND.
   THE MASK: transparent false, depthWrite true, alphaTest 0.5, side unchanged (the kea's double-
   sided wings stay double-sided). `alphaHash` is the documented fallback if a resized cutout's
   softened edges ever look hard under alphaTest; it is not on by default. */
export const ALPHA = { cutoutFrac: 0.90, alphaTest: 0.5, sample: 256 };

/* the fraction of base-colour alpha samples at an end, or null when it cannot be read */
export function cutoutFraction(tex) {
  const im = tex && tex.image;
  if (!im || !(im.width || im.videoWidth) || typeof document === 'undefined') return null;
  try {
    const n = ALPHA.sample, cv = document.createElement('canvas'); cv.width = cv.height = n;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.clearRect(0, 0, n, n); cx.drawImage(im, 0, 0, n, n);
    const d = cx.getImageData(0, 0, n, n).data;
    let ends = 0; for (let i = 3; i < d.length; i += 4) if (d[i] < 8 || d[i] > 247) ends++;
    return ends / (n * n);
  } catch (e) { return null; }
}

/* Walk a loaded scene; any BLEND material whose map is a measured cutout becomes a MASK. Each
   material is decided once (a Map caches the verdict, so clones sharing a material cost nothing).
   Returns what it did, so callers can publish it as provenance. */
export function maskCutouts(root, seen = new Map()) {
  const out = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (!m || !m.transparent || !m.map) continue;
      if (!seen.has(m)) {
        const f = cutoutFraction(m.map);
        const isCut = f !== null && f >= ALPHA.cutoutFrac;
        if (isCut) { m.transparent = false; m.depthWrite = true; m.alphaTest = ALPHA.alphaTest; m.needsUpdate = true; }
        seen.set(m, { name: m.name || '(unnamed)', frac: f === null ? null : +f.toFixed(4), masked: isCut });
      }
      out.push(seen.get(m));
    }
  });
  return out;
}
