/* THE SCANNED MATERIALS — REPLAT P3 (2026-09-03).
   The seven PBR texture sets, fetched and installed onto the family materials game.mjs built.

   WHY IT IS NOT IN game.mjs, which is the same answer sky.mjs and post.mjs give. The gauntlet
   loads game.mjs as a TEXT SPECIMEN and evaluates it with THREE injected, and keasrc.js asserts
   that file has exactly ONE import. So the RECIPE — the family table, every tile size, both modes,
   the tint arithmetic, the UV-to-metres maths — lives in game.mjs where nine batteries can read
   it, and only the LOADING lives out here, wired from the browser entry where no battery looks.

   WHY THE FILES ARE FETCHED AND NOT BUNDLED. Same law as the HDRI: vite would inline 16 MB of jpg
   as base64 into dist/kea.js, the single chunk the gate md5s and the capture rig serves, and a
   look asset has no business changing that hash. They are copied through publicDir (assets/ is the
   public dir — see vite.config.mjs) and requested by URL.

   WHY THE GAME DOES NOT WAIT FOR IT, AND WHAT IT LOOKS LIKE MEANWHILE. Every family material was
   built by mat() with its authored palette colour and its authored roughness, so the first frame
   is the game exactly as P2 shipped it. matDress swaps each material to its scanned form when the
   set arrives. A slow network therefore costs fidelity for a moment rather than showing a black
   page, and a network that fails outright costs only the upgrade — G.mats.mode stays 'none' and
   says so, which is what assertBooted reads to refuse photographing the wrong world. */
import * as THREE from 'three';

/* THE THREE MAPS, AND THE ONLY PLACE THEIR FILENAMES ARE WRITTEN.
   `arm` is the standard glTF ARM packing — AO in red, roughness in green, metalness in blue. three
   reads roughness from `roughnessMap.g` with no help, which is why one file serves as the
   roughness map. P3 consumes the green channel ONLY; see assets/LICENCES.md on why metalness is
   left at zero for all seven families. */
const SUFFIX={ map:'diff', normalMap:'nor_gl', roughnessMap:'arm' };

export function matURL(KEAGAME, asset, kind) {
  const MATS = KEAGAME.MATS;
  /* RELATIVE, for the reason skyURL is: vite is configured base:'./', the capture rig serves
     dist/ from a loopback root, and a real deploy may sit in a subdirectory. An absolute
     '/tex/...' would work in the rig and 404 in the subdirectory — which is the worst failure
     shape available, because it passes every check here and degrades only where nobody looks. */
  return new URL(MATS.dir + asset + '_' + SUFFIX[kind] + '_' + MATS.res + '.jpg', document.baseURI).href;
}

function loadTex(loader, url) {
  return new Promise((res, rej) => loader.load(url, res, undefined,
    () => rej(new Error('materials: could not load ' + url))));
}

/* THE PAINT-MODE ALBEDO PASS, and the one thing in this file that is arithmetic rather than
   plumbing. A 'paint' family's colour is the game's and its SURFACE is the scan's, so the scan's
   albedo is reduced to luminance and renormalised until its mean is MATS.paintMean; game.mjs
   scales the material colour by 1/paintMean to put the exposure back. What survives is the shadow
   in every weatherboard lap and the dark in every corrugation valley, with none of the plank's
   brown fighting the hut's red.

   IT MEASURES THE MEAN RATHER THAN ASSUMING ONE. Each scan has its own average brightness, so a
   fixed gain would land the three paint families on three different exposures — which is exactly
   the mistake P2's env-intensity note spent forty lines warning about. The measured mean is
   returned and recorded in G.mats so the number is in scene state rather than in a comment.

   LUMINANCE IS COMPUTED ON THE sRGB BYTES ON PURPOSE. ColorManagement is off in this codebase and
   a CanvasTexture is NoColorSpace, so the shader consumes these bytes as linear — the same seam
   the P2 notes documented. Normalising in the encoding the renderer will actually read is the only
   version of this that lands where it was measured. */
function toPaintDetail(img, paintMean) {
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const d = cx.getImageData(0, 0, cv.width, cv.height), px = d.data;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) {
    const y = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
    px[i] = px[i + 1] = px[i + 2] = y * 255;      // keep it in the buffer; scaled in the second pass
    sum += y;
  }
  const n = px.length / 4, mean = sum / n, gain = mean > 1e-6 ? paintMean / mean : 1;
  for (let i = 0; i < px.length; i += 4) {
    const v = px[i] * gain;
    px[i] = px[i + 1] = px[i + 2] = v > 255 ? 255 : v;
  }
  cx.putImageData(d, 0, 0);
  return { canvas: cv, mean, gain };
}

/* THE MEAN OF A MAP, MEASURED RATHER THAN ASSUMED. The breakup's variance restore needs to know
   what value to rescale each blended sample's deviation AROUND, and that is the texture's own
   average. Measured on a 64x64 downscale — 4096 samples is far more than enough for a mean and
   costs about a millisecond, against a full-resolution pass that would buy three more decimals
   nobody can see. Same sRGB-bytes-as-linear seam the paint pass documents: ColorManagement is off
   in this codebase, so the number is taken in the encoding the shader will actually read. */
function imageMean(img) {
  const N = 64, cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, N, N);
  const px = cx.getImageData(0, 0, N, N).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i + 1]; b += px[i + 2]; }
  const n = px.length / 4;
  return [r / n / 255, g / n / 255, b / n / 255];
}

export async function installMaterials(KEAGAME) {
  const G = KEAGAME.G, MATS = KEAGAME.MATS;
  if (!G.scene) throw new Error('materials: no scene to dress');
  const loader = new THREE.TextureLoader();
  const report = {};

  for (const [fam, F] of Object.entries(MATS.families)) {
    const S = KEAGAME.matFam(fam);
    try {
      const [diff, nor, arm] = await Promise.all(
        ['map', 'normalMap', 'roughnessMap'].map(k => loadTex(loader, matURL(KEAGAME, F.asset, k))));

      /* THE COLOUR SPACES ARE NOT INTERCHANGEABLE AND GETTING THEM WRONG IS SILENT. An albedo is
         sRGB data; a normal map and an ARM map are raw vectors and scalars and must stay linear.
         Tagging a normal map sRGB bends every normal toward the surface and looks merely "flatter"
         rather than broken, which is the class of defect that survives review. */
      diff.colorSpace = THREE.SRGBColorSpace;
      nor.colorSpace = THREE.NoColorSpace;
      arm.colorSpace = THREE.NoColorSpace;

      let map = diff, paint = null;
      if (F.mode === 'paint') {
        paint = toPaintDetail(diff.image, MATS.paintMean);
        map = new THREE.CanvasTexture(paint.canvas);
        map.colorSpace = THREE.SRGBColorSpace;
        diff.dispose();                            // the source jpg has done its job
      }

      /* TILING IS ONE NUMBER PER FAMILY BECAUSE THE UVs CARRY THE METRES. game.mjs rescaled every
         family mesh's UVs into metres, so repeat = 1/tileM turns them into tile counts and a
         texel lands tileM/1024 metres across on every surface in the game. All three maps must
         get the same repeat and the same wrap or the albedo and its relief slide apart. */
      const rep = 1 / F.tileM;
      for (const t of [map, nor, arm]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(rep, rep);
        /* ANISOTROPY, and it is not a nicety on these surfaces. The car park and both terrain
           planes are viewed at a hard grazing angle from every vantage in the set, which is
           precisely where an isotropic mip filter smears a scanned ground into grey mud. 8 is
           the value every current desktop GPU supports without a capability check. */
        t.anisotropy = 8;
        t.needsUpdate = true;
      }

      /* THE MEAN IS ONLY NEEDED WHERE THE BREAKUP RUNS, so it is only measured there. A paint
         family's albedo mean is not measured at all — it is MATS.paintMean BY CONSTRUCTION, since
         toPaintDetail just normalised the map to exactly that. Measuring it again would be a
         second, worse copy of a number this file already guarantees. */
      if (F.iso) {
        const a = F.mode === 'paint'
          ? [MATS.paintMean, MATS.paintMean, MATS.paintMean]
          : imageMean(map.image);
        S.mean = { albedo: a, rough: imageMean(arm.image)[1] };   // roughness is the GREEN channel
      }
      S.maps = { map, normalMap: nor, roughnessMap: arm };
      S.failed = false;
      for (const m of S.mats) KEAGAME.matDress(m);
      report[fam] = { asset: F.asset, tileM: F.tileM, repeat: rep,
                      texelMM: +(F.tileM / map.image.width * 1000).toFixed(3),
                      px: map.image.width,
                      paintMean: paint ? +paint.mean.toFixed(4) : null,
                      paintGain: paint ? +paint.gain.toFixed(4) : null,
                      mean: S.mean ? { albedo: S.mean.albedo.map(v => +v.toFixed(4)),
                                       rough: +S.mean.rough.toFixed(4) } : null,
                      materials: S.mats.length };
    } catch (e) {
      /* ONE FAMILY FAILING MUST NOT COST THE OTHER SIX. Its materials keep the palette colour and
         the authored roughness matDress already left them holding, G.mats records the family as
         failed, and the game plays. Same law as the film camera and the sky: a look feature must
         not be able to take the game down. */
      S.failed = true;
      console.error('materials: family ' + fam + ' (' + F.asset + ') did not install —', e);
    }
  }

  G.mats = KEAGAME.matState();
  G.mats.report = report;
  return G.mats;
}
