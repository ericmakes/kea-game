/* THE FILM CAMERA — REPLAT P1 step 5 (2026-09-03).
   Bloom, ambient occlusion and a subtle depth of field, per REPLAT P1's post stack.

   WHY IT IS NOT IN game.mjs. The gauntlet loads game.mjs as a TEXT SPECIMEN and evaluates it with
   THREE injected; keasrc.js asserts that file has exactly one import. Importing EffectComposer and
   four passes there would break all nine batteries at once. So game.mjs delegates through G.post
   and this module is wired from the browser entry, where no headless battery ever sees it.

   SPLIT SCREEN IS WHY THERE ARE TWO COMPOSERS. The game renders 2P by scissoring one canvas into
   halves and drawing the scene twice. A composer cannot be scissored that way: its passes render
   full-screen quads into their own render targets, so a scissor on the default framebuffer clips
   the OUTPUT but every intermediate pass still runs at full width — the bloom of one player's view
   would bleed across the divider and the depth of field would focus on the wrong half. Each eye
   therefore gets its own composer at half width. They are built lazily and only in 2P, so a
   one-player session never pays for the second.

   EVERY PASS IS SIZED IN CSS PIXELS x pixelRatio, and rebuilt on resize, because a composer whose
   targets disagree with the canvas produces a soft, subtly-wrong frame rather than an obvious one. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* THE LOOK, IN NAMED CONSTANTS. Tuned once, against the Birds of War wall, at a light model that
   is now physical. Subtle is the brief: this is a film camera on the same geometry, not a filter. */
/* __KEA_FILM__ OVERRIDES ANY OF THESE, set before the page boots. The look is judged at the
   vantage, so it must be adjustable without a rebuild — one deep merge, read once at install.
   Setting every effect to zero also gives the rig a like-for-like A/B against the plain renderer,
   which is how the tone-mapping chain below was verified rather than assumed. */
export const FILM = {
  /* BLOOM RUNS ON LINEAR HDR, BEFORE TONE MAPPING, and that is why the threshold is above 1.
     The first tuning used 0.86 with strength 0.34 — sensible-looking numbers for a post-tonemap
     buffer, and wrong here: lit surfaces already exceed 1.0 in linear, so nearly every bright
     thing bloomed. Measured against the plain renderer on 01_carpark_wide, that setting came out
     +13% brighter and 37% LESS SATURATED — the cars glowed and the hills went milky.
     These values were picked from a measured sweep (see the commit): +3 brightness, -1.6
     saturation, which reads as a lens rather than a filter.

     THE THRESHOLD IS SET BY THE SKI FIELD, NOT THE CARPARK. 1.35 measured well on 01_carpark_wide
     and blew 28_skifield_base to near-white: snow is high-albedo, so its DIFFUSE radiance alone
     reaches ~1.5-2.0 linear and the whole field bloomed. Measured at the real vantage:
         plain 194.7 YAVG / 11.24 SAT      thr 1.35  214.1 / 5.01   (saturation HALVED)
         thr 1.6  202.9 / 8.46             thr 1.8   196.1 / 10.67
         thr 2.0  195.5 / 10.89  <- clean
     2.0 sits above every lit diffuse surface in the game and below the emissive sources, so bloom
     now catches what is actually a light — the torch beam measures +3.2 YAVG on 22_torch_beam —
     and never a brightly lit wall or a snowfield. It is deliberately quiet. Raise it at the
     vantage with __KEA_FILM__ / KEAFILM= rather than by guessing here. */
  bloom:   { strength: 0.12, radius: 0.45, threshold: 2.0 },
  // AO darkens contact and crevice only; the scene already carries its own painted shade. Measured
  // at YAVG 154.5 against the plain renderer's 154.5 — it adds shade without lifting exposure.
  ao:      { distance: 0.42, thickness: 0.62, scale: 1.0, blend: 0.45 },
  // a long focus and a narrow aperture: the far hills soften, everything you play in stays sharp
  /* MAXBLUR CAME DOWN FROM 0.003 TO 0.0008, and it is the range that asked for it. The original
     comment here read "a long focus and a narrow aperture: the far hills soften, everything you
     play in stays sharp", which was a deliberate choice and turned out to be softening the far
     hills into mush: measured with platescore, the range's edge density is 0.0675 with this pass at
     0.003 and 0.1708 with the whole post stack OFF, against a plate band that opens at 0.1692. The
     film camera was destroying 60% of the mountains' detail, and no amount of rock texture could
     get through it — the first three attempts to fix "the range has no surface" were all upstream
     of this line and all failed.
     0.0008 KEEPS A LITTLE. It is not zero, because a trace of far softening is part of the look
     Eric asked for at P1 and it still reads at the horizon; it is small enough that the range
     scores in band. Eric's own note this round — "fix the blurred yellow foreground band at the
     foothills" — is the same fault seen from the other end of the frame. */
  bokeh:   { focus: 26.0, aperture: 0.00010, maxblur: 0.0008 },
};

for (const [k, v] of Object.entries(globalThis.__KEA_FILM__ || {})) {
  if (FILM[k] && v && typeof v === 'object') Object.assign(FILM[k], v);
}

function build(renderer, scene, camera, w, h) {
  const c = new EffectComposer(renderer);
  c.setSize(w, h);
  c.addPass(new RenderPass(scene, camera));

  const ao = new GTAOPass(scene, camera, w, h);
  ao.output = GTAOPass.OUTPUT.Default;
  if (ao.updateGtaoMaterial) {
    ao.updateGtaoMaterial({ distanceExponent: 1.0, radius: FILM.ao.distance,
      thickness: FILM.ao.thickness, scale: FILM.ao.scale });
  }
  ao.blendIntensity = FILM.ao.blend;
  c.addPass(ao);

  c.addPass(new UnrealBloomPass(new THREE.Vector2(w, h),
    FILM.bloom.strength, FILM.bloom.radius, FILM.bloom.threshold));

  /* Only added when it would actually do something: BokehPass resamples the whole frame even at
     maxblur 0, which cost ~0.005 SSIM of pure softness for no visible depth of field while the
     effect was being tuned off. A pass that does nothing should not be in the chain. */
  let bokeh = null;
  if (FILM.bokeh.maxblur > 0 && FILM.bokeh.aperture > 0) {
    bokeh = new BokehPass(scene, camera, {
      focus: FILM.bokeh.focus, aperture: FILM.bokeh.aperture, maxblur: FILM.bokeh.maxblur });
    c.addPass(bokeh);
  }

  // OutputPass owns tone mapping and the sRGB encode once the chain is composited, so the
  // renderer must NOT also do it — doing both tone maps the frame twice and washes it out.
  c.addPass(new OutputPass());
  return { composer: c, ao, bokeh, w, h, camera };
}

export function installPost(KEAGAME) {
  const G = KEAGAME.G;
  const renderer = G.renderer;
  if (!renderer) throw new Error('post: no renderer to attach to');

  // the composer chain tone maps at the end; hand the responsibility over cleanly
  const toneMapping = renderer.toneMapping, exposure = renderer.toneMappingExposure;
  renderer.toneMapping = THREE.NoToneMapping;

  let eyes = [];            // one composer per active camera
  let key = '';

  const ensure = (split, w, h) => {
    const pr = renderer.getPixelRatio();
    const vw = Math.max(1, Math.floor((split ? w / 2 : w) * pr));
    const vh = Math.max(1, Math.floor(h * pr));
    const k = (split ? '2' : '1') + ':' + vw + 'x' + vh + ':' + G.cams.length;
    if (k === key && eyes.length) return { vw, vh };
    for (const e of eyes) e.composer.dispose && e.composer.dispose();
    const n = split ? 2 : 1;
    eyes = [];
    for (let i = 0; i < n; i++) {
      const cam = G.cams[i] || G.cams[0];
      const e = build(renderer, G.scene, cam, vw, vh);
      // OutputPass does the tone mapping now, with the exposure the game authored
      renderer.toneMappingExposure = exposure;
      e.tone = toneMapping;
      eyes.push(e);
    }
    key = k;
    return { vw, vh };
  };

  const post = {
    FILM, get eyes() { return eyes.length; },
    render(split, w, h) {
      ensure(split, w, h);
      renderer.toneMapping = toneMapping;   // OutputPass reads it off the renderer
      renderer.toneMappingExposure = exposure;
      if (split) {
        const half = w / 2;
        for (let i = 0; i < 2; i++) {
          const e = eyes[i];
          e.composer.passes[0].camera = G.cams[i];
          if (e.bokeh) e.bokeh.camera = G.cams[i];
          renderer.setScissorTest(true);
          renderer.setViewport(i * half, 0, half, h);
          renderer.setScissor(i * half, 0, half, h);
          e.composer.render();
        }
        renderer.setScissorTest(false);
      } else {
        const e = eyes[0];
        e.composer.passes[0].camera = G.cams[0];
        if (e.bokeh) e.bokeh.camera = G.cams[0];
        renderer.setViewport(0, 0, w, h);
        e.composer.render();
      }
      renderer.toneMapping = THREE.NoToneMapping;
    },
  };
  G.post = post;
  return post;
}
