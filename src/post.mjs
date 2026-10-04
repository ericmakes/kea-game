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
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/* THE LOOK, IN NAMED CONSTANTS. Tuned once, against the Birds of War wall, at a light model that
   is now physical. Subtle is the brief: this is a film camera on the same geometry, not a filter. */
/* __KEA_FILM__ OVERRIDES ANY OF THESE, set before the page boots. The look is judged at the
   vantage, so it must be adjustable without a rebuild — one deep merge, read once at install.
   Setting every effect to zero also gives the rig a like-for-like A/B against the plain renderer,
   which is how the tone-mapping chain below was verified rather than assumed. */
export const FILM = {
  /* THE DISPLAY GRADE — SPIKE_ADOPT row 5, 2026-10-03. The render spike graded AFTER its tone map, in
     display space (its src/main.js): saturation about luma, a warm white-balance shift (+r, +0.35 g,
     -b), contrast about mid-grey, a vignette, film grain. This is that grade as one WebGL pass after
     OutputPass, reading the encoded frame and writing it straight to the canvas (a raw ShaderMaterial
     carries no colour-space or tone-map chunk, so nothing is applied twice). It REPLACES the CSS
     saturate/contrast/brightness filter index.html used to put on the canvas, which graded the
     same way but outside anything the game could measure or a screenshot of the canvas could see.
     on:false is the identity. Grain is a fixed per-pixel pattern, not animated: a capture must be
     reproducible, and grain that moves between two takes of the same frame is noise in every diff.
     TWO FORMS. 'spike' is the spike's arithmetic verbatim: contrast per channel about mid-grey and the
     warmth ADDED. Both raise saturation as a side effect — per-channel contrast drives a dark
     channel toward zero, and an added tint is a large relative chroma change on a dark pixel — and
     the bird's bronze is a dark, low-chroma colour, so it is where that shows: measured by
     birdcolour.mjs, the spike grade took the bird's saturation from 0.37 to 0.81-0.89 against the
     approved render's 0.41. 'luma' does what the knobs say and nothing else: contrast on LUMINANCE
     with the colour ratios held, warmth as white-balance GAINS (r x (1+w), g x (1+0.35w), b x (1-w)).
     THE VALUES are the spike's knobs fitted under a constraint the spike did not have: the bird's bronze
     must stay inside its approved render's band (framescore birdProps). Spike numbers (1.5 / 0.08 / 1.22)
     took the bird's saturation to 0.59 even in luma form; 1.2 / 0.05 / 1.15 holds it at 0.43-0.46
     (approved 0.335-0.483) and scores 27/36 on the bow trio and 5/6 against the spike frame. */
  grade:   { on: true, form: 'luma', sat: 1.15, warm: 0.05, warmG: 0.55, contrast: 1.05, lift: 0.0, vig: 0.22, grain: 0.018 },   // ON since SPIKE_ADOPT 19; SPIKE_ADOPT 21c moved it toward the spike frame's grade: warmG 0.35 -> 0.55 (orange -> the spike's yellow-green), contrast 1.15 -> 1.05, sat 1.2 -> 1.15 — 26/42 -> 29/42 on the look of record, none lost
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
  /* dayOff (2026-10-03, budget recovery before the per-map pass): the pass is SKIPPED while the night blend is under
     nightOn. By day the 2.0 threshold catches almost nothing but clear-coat glints, and its mip chain cost ~1.1 ms at
     100% (perfstep 15.13 -> 14.03 with it off, the key six unchanged); at night it is what makes a torch or a lamp
     glow (22_torch_beam), so it comes back with the dark. The pass is kept built, so nightfall costs no recompile. */
  bloom:   { strength: 0.12, radius: 0.45, threshold: 2.0, dayOff: true, nightOn: 0.02 },
  // AO darkens contact and crevice only; the scene already carries its own painted shade. Measured
  // at YAVG 154.5 against the plain renderer's 154.5 — it adds shade without lifting exposure.
  ao:      { distance: 0.42, thickness: 0.62, scale: 1.0, blend: 0.45, res: 0.5, clip: 120, samples: 8, pdSamples: 16 },   // samples: 2026-10-03, 16 -> 8 for the 100% budget. pdSamples STAYS 16: at 8 the denoise left a halo round the bird that trample.mjs read as 5 blade pixels over it   // res: PERF S2; clip: the AO box's half-width, m
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

/* PERF S1 — ONE DEPTH FOR THE WHOLE CHAIN (2026-10-02).
   GTAOPass and BokehPass each re-rendered the WHOLE SCENE for their own depth, with an override
   material — so every frame drew the scene three times, grass included, and the two prepasses drew
   the grass WRONG besides: an override material has none of the blade vertex shader, so the field
   reached the AO and the depth of field as undisplaced blades piled at the lattice. frameablate's
   non-additive table (post, shadows, grass or half the pixels each halve the frame) was this.
   Now SCENEPASS draws the scene ONCE into its own target, which owns the DepthTexture, copies the
   colour into the chain, and hands the depth to both passes before they run. ITS OWN TARGET, NOT
   THE COMPOSER'S: the first cut hung the depth on the composer's ping-pong pair, and three passes
   later that same target was Bokeh's WRITE buffer while its depth was being sampled — a WebGL
   feedback loop, which draws nothing and logs nothing: a black frame. GTAO reconstructs its normals from it (NORMAL_VECTOR_TYPE 0); Bokeh samples it raw
   (DEPTH_PACKING 0). A transparent quad with depthWrite off — the cloud wisps G.postExclude exists
   for — is now absent from the depth by construction, which is what the exclusion was faking. */
class ScenePass extends Pass {
  constructor(scene, camera, w, h, consumers) {
    super(); this.scene = scene; this.camera = camera; this.consumers = consumers; this.needsSwap = true;
    this.target = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType,
      depthTexture: new THREE.DepthTexture(w, h, THREE.UnsignedIntType) });
    this.copy = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader, fragmentShader: CopyShader.fragmentShader, depthTest: false, depthWrite: false });
    this.quad = new FullScreenQuad(this.copy);
  }
  setSize(w, h) { this.target.setSize(w, h); }
  render(renderer, writeBuffer) {
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    for (const f of this.consumers) f(this.target.depthTexture);
    this.copy.uniforms.tDiffuse.value = this.target.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }
  dispose() { this.target.dispose(); this.copy.dispose(); this.quad.dispose(); }
}
class SharedDepthBokehPass extends BokehPass {
  constructor(scene, camera, params) {
    super(scene, camera, params);
    this.materialBokeh.defines.DEPTH_PACKING = 0;   // a raw DepthTexture, not RGBA-packed
    this.materialBokeh.needsUpdate = true;
  }
  render(renderer, writeBuffer, readBuffer) {
    this.uniforms.tColor.value = readBuffer.texture;
    this.uniforms.nearClip.value = this.camera.near;
    this.uniforms.farClip.value = this.camera.far;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (!this.renderToScreen) renderer.clear();
    this._fsQuad.render(renderer);
  }
}

function build(renderer, scene, camera, w, h) {
  const c = new EffectComposer(renderer);
  c.setSize(w, h);
  const consumers = [];
  const sp = new ScenePass(scene, camera, w, h, consumers);
  c.addPass(sp);

  /* G.postExclude (the cloud wisps) used to be hidden here around each depth prepass, because an
     override material ignores depthWrite and the wisps occluded as solid quads. With ONE shared
     depth from the real frame there is no override and the wisps, which write no depth, are absent
     from it by construction — so the wrapper is gone. See PERF S1 above. */
  const ao = new GTAOPass(scene, camera, w, h);
  ao.output = GTAOPass.OUTPUT.Default;
  ao.setGBuffer(sp.target.depthTexture);           // no normal texture: reconstructed from depth
  consumers.push(d => { ao.gtaoMaterial.uniforms.tDepth.value = d; ao.pdMaterial.uniforms.tDepth.value = d; });
  /* AO ONLY WHERE THERE IS CONTACT TO SHADE. The sky dome is geometry 210 m out and writes depth, so
     the pass computed occlusion on it — invisible at full resolution, and at half resolution its
     normals, reconstructed from depth quantised at 210 m, came out noisy and painted dark blotches
     and scan lines across open sky (12_seal_midpeel, S2). The clip box keeps AO to the play area and
     its near country; every sky pixel is now skipped, which is cheaper as well as clean. */
  ao.setSceneClipBox(new THREE.Box3(new THREE.Vector3(-FILM.ao.clip, -20, -FILM.ao.clip), new THREE.Vector3(FILM.ao.clip, 60, FILM.ao.clip)));
  if (ao.updateGtaoMaterial) {
    ao.updateGtaoMaterial({ distanceExponent: 1.0, radius: FILM.ao.distance,
      thickness: FILM.ao.thickness, scale: FILM.ao.scale, samples: FILM.ao.samples });
  }
  if (ao.updatePdMaterial) ao.updatePdMaterial({ samples: FILM.ao.pdSamples });
  ao.blendIntensity = FILM.ao.blend;
  /* PERF S2 — AO AT HALF RESOLUTION. Occlusion is a low-frequency term, and the pass's own Poisson
     denoise already blurs it; computing it on a quarter of the pixels and letting the blend upsample
     it bilinearly is the standard trade. The pass reads the FULL-resolution shared depth (so its
     samples are still placed on true geometry); only its own AO and denoise targets are halved.
     Wrapped rather than set once because EffectComposer.addPass and every resize call setSize with
     the full size. */
  { const full = ao.setSize.bind(ao), F = FILM.ao.res;
    ao.setSize = (sw, sh) => full(Math.max(1, Math.round(sw * F)), Math.max(1, Math.round(sh * F))); }
  c.addPass(ao);

  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), FILM.bloom.strength, FILM.bloom.radius, FILM.bloom.threshold);
  c.addPass(bloom);

  /* Only added when it would actually do something: BokehPass resamples the whole frame even at
     maxblur 0, which cost ~0.005 SSIM of pure softness for no visible depth of field while the
     effect was being tuned off. A pass that does nothing should not be in the chain. */
  let bokeh = null;
  if (FILM.bokeh.maxblur > 0 && FILM.bokeh.aperture > 0) {
    bokeh = new SharedDepthBokehPass(scene, camera, {
      focus: FILM.bokeh.focus, aperture: FILM.bokeh.aperture, maxblur: FILM.bokeh.maxblur });
    consumers.push(d => { bokeh.uniforms.tDepth.value = d; });
    c.addPass(bokeh);
  }

  // OutputPass owns tone mapping and the sRGB encode once the chain is composited, so the
  // renderer must NOT also do it — doing both tone maps the frame twice and washes it out.
  c.addPass(new OutputPass());
  if (FILM.grade.on) c.addPass(gradePass());
  return { composer: c, ao, bokeh, bloom, w, h, camera };
}

function gradePass() {
  const G = FILM.grade;
  const sh = { uniforms: { tDiffuse: { value: null }, uSat: { value: G.sat }, uWarm: { value: G.warm }, uWarmG: { value: G.warmG ?? 0.35 }, uCon: { value: G.contrast },
      uLift: { value: G.lift }, uVig: { value: G.vig }, uGrain: { value: G.grain }, uSpike: { value: G.form === 'spike' ? 1 : 0 } },
    vertexShader: CopyShader.vertexShader,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uSat, uWarm, uWarmG, uCon, uLift, uVig, uGrain; uniform int uSpike; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec4 t = texture2D(tDiffuse, vUv); vec3 d = t.rgb;
        float l = dot(d, vec3(0.2126, 0.7152, 0.0722));
        d = mix(vec3(l), d, uSat);
        if (uSpike == 1) { d += vec3(uWarm, uWarm * 0.35, -uWarm) * 0.5; d = (d - 0.5) * uCon + 0.5 + uLift; }
        else { d *= vec3(1.0 + uWarm, 1.0 + uWarmG * uWarm, 1.0 - uWarm);   // warmG: green's share of the warm tilt — 0.35 orange, toward 1 yellow
               float l1 = max(dot(d, vec3(0.2126, 0.7152, 0.0722)), 1e-4), l2 = max((l1 - 0.5) * uCon + 0.5 + uLift, 0.0);
               d *= l2 / l1; }
        float r = length((vUv - 0.5) * vec2(1.0, 0.75));
        d *= 1.0 - smoothstep(0.25, 0.85, r) * uVig;
        d += (hash(gl_FragCoord.xy) - 0.5) * uGrain;
        gl_FragColor = vec4(clamp(d, 0.0, 1.0), t.a);
      }` };
  const p = new ShaderPass(sh); p.name = 'grade'; return p;
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

  /* PERF S3 — DEPTH OF FIELD ONLY ON A CINEMATIC CAMERA. At maxblur 0.0008 the bokeh is a trace of
     far softening that a player chasing a bird cannot see and pays a full-frame resample for. It
     stays on where the frame is LOOKED AT rather than played through: photo mode, the title orbit,
     a map-travel blend, and anything that sets G.cinematic. EffectComposer skips a disabled pass. */
  const cinematic = () => !!(G.cinematic || G.photo || !G.running || (G.travel && G.travel.phase));
  const post = {
    FILM, cinematic, get eyes() { return eyes.length; }, _eyesList: () => eyes,   // _eyesList: for frameablate
    render(split, w, h) {
      ensure(split, w, h);
      { const cin = cinematic(); for (const e of eyes) if (e.bokeh) e.bokeh.enabled = cin; }
      { const on = !FILM.bloom.dayOff || (G.nightT || 0) >= FILM.bloom.nightOn; for (const e of eyes) if (e.bloom) e.bloom.enabled = on; }
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
