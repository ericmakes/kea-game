/* THE KEA GAME — ported from untitled-kea-game.html at REPLAT P1 (2026-09-03).
   The logic below is the r128 single-file logic block, moved VERBATIM except for the
   renderer-era API fixes recorded in REPLAT-PORT.md. THREE is imported rather than
   injected as a global; nothing else about the module's shape changed. The
   KEA-LOGIC-START / KEA-LOGIC-END markers are kept: the gauntlet identifies this code
   by content, never by file position, and that law did not change with the stack. */
import * as THREE from 'three';

/* COLOUR MANAGEMENT STAYS OFF, PERMANENTLY — REPLAT P1, corrected at step 5.

   Step 2 pinned this as a temporary holding position and said the game compensated by hand "in
   exactly one place, the grass tints". THAT WAS WRONG, and the correction matters: the game
   converts sRGB -> linear in ~18 places, including BOTH central material helpers —

       mat(c)  -> new THREE.Color(c).convertSRGBToLinear()      every Standard material
       bmat(c) -> new THREE.Color(c).convertSRGBToLinear()      every Basic material

   plus every vertex-colour site (sky dome, ground, mountains, tussock, snow, grass) and the
   day/night lerp in nightApply. The game owns a complete and internally consistent colour
   pipeline: authored values are sRGB, converted once at source, handed to the materials linear,
   and encoded back by renderer.outputColorSpace = SRGBColorSpace.

   Modern three's ColorManagement does the SAME conversion in the Color constructor. Enabling it
   would therefore convert everything TWICE — not just the grass — and un-doing that means deleting
   eighteen call sites to buy exactly the pipeline the game already has. So this is not a debt to
   pay off at step 5; it is the correct setting for this codebase, and it is now documented as one.
   Turn it on only alongside removing every convertSRGBToLinear above, and re-pin the whole set. */
THREE.ColorManagement.enabled = false;

/* PHYSICAL LIGHT UNITS — REPLAT P1 step 5 (2026-09-03).
   r155 made lighting physically correct and r165 DELETED useLegacyLights, so r128's light maths is
   gone and cannot be switched back. Measured on an identical scene, output colour space matched
   and nothing clipped, r128/r185 radiance at the lit point:
       directional 3.11-3.21    hemisphere 3.11-3.20    point 7.635    spot 12.59
   Directional and hemisphere are exactly PI: the legacy renderer omitted the 1/pi of the Lambert
   BRDF, so pi restores them precisely and for a reason, not by fitting.
   Point and spot are NOT constants. r128 attenuated by pow(1-d/distance, decay); r185 uses the
   physical window(d)/d^2. Their ratio therefore MOVES WITH DISTANCE, and no single multiplier can
   restore both the level and the shape of a light pool. The figures below are that ratio at each
   light's working radius — the campfire read at ~2m, the torch beam at ~3m — which is where each
   was authored to look right. Close in, both now fall off faster than they used to. That is the
   physical model being honest, and it is the look Eric took deliberately.
   ONE TUNE, as briefed. Named so the next change is to a constant, not to scattered literals. */
const LX_DIR=Math.PI, LX_HEMI=Math.PI, LX_POINT=7.64, LX_SPOT=12.59;

/* ============================================================
   SKY AND SUN — REPLAT P2 (2026-09-03). THE RECIPE, IN NAMED CONSTANTS.

   P2's proof contract is "fog params pinned as named constants", and this block is that pin for
   the whole of sky, sun, shadow and image-based light. Nothing about the daylight is a literal
   buried in initScene any more: the numbers below ARE the look, and the assertions in
   harness-everything.js freeze them so the night shift cannot drift them by accident.

   __KEA_SKY__ OVERRIDES ANY LEAF, set before the page boots (KEASKY= through the web rig). This
   is the same seam post.mjs's FILM uses and it exists for the same reason: a look is judged AT THE
   VANTAGE, so every variant strip in this piece had to be shootable without a rebuild. It is read
   ONCE, here, at module scope — which is early enough because initScene runs at boot, and the rig
   installs the global before any module on the page evaluates. Absent, the game gets exactly what
   is pinned below, which is why a normal capture pass photographs the recipe and not a mood.

   WHY EXPONENTIAL FOG AND NOT THE LINEAR PAIR IT REPLACES. Linear fog is a near/far ramp: nothing
   hazes at all inside `near`, then haze climbs on a straight line. Real aerial perspective has no
   such edge — extinction is exponential in distance, which is why the middle distance in
   ref_bow_04 is already visibly milky while the near verge is not. The old Fog(92,218) put the
   whole carpark inside a hard no-haze zone and then ramped, so the hills read as pasted-on rather
   than far away. FogExp2 has no near plane to give the game away.

   AND WHY THE COLOUR MOVED. The old fog was 0x93AEBF — DARKER and more saturated than the sky
   dome's own horizon (skyLow 0xC9DCE6, haze band 0xC3D2DC). Distant ridges therefore faded toward
   something bluer than the sky immediately behind them, which is the one thing aerial perspective
   never does: haze IS the sky, seen edge-on. Tuning the fog to the sky is not a preference, it is
   the correction, and it is what P2 means by "fog tuned to the sky". */
const SKY={
  /* FOG — day and night. Both are FogExp2 densities, and the night pair reproduces the old
     linear night fog's REACH rather than its shape: Fog(34,126) was fully opaque by 126 units,
     and 1-exp(-(d*density)^2) reaches 0.97 at d=126 when density is 0.0148. */
  fogDay:0xC4D2D6, fogDensityDay:0.0062,
  fogNight:0x0C1524, fogDensityNight:0.0148,

  /* THE SUN — one warm directional, per P2, and the piece's main light in a way it was not
     before. Warmed 0xFFF4E2 -> 0xFFEAC8 toward the reference wall's daylight (picked off a
     three-step warmth strip; the values are in ARTBIBLE) and raised 1.45 -> 1.85 to take over the
     work withdrawn from fill and rim. The multiplier is LX_DIR (pi) like every other light, so
     the number is directly comparable with the r128 one it replaces. */
  sunDay:0xFFEAC8, sunNight:0xB9CCEE,
  sunIntensityDay:1.85, sunIntensityNight:0.24,
  sunPosDay:[-46,42,22], sunPosNight:[36,30,-26],

  /* SOFT SHADOWS. `type` picks the shadow map: 'vsm' is THREE.VSMShadowMap, which is the only
     three shadow map whose softness is a PARAMETER — it blurs the depth variance, so `radius`
     and `blurSamples` genuinely widen the penumbra. PCFSoftShadowMap ignores `radius` entirely
     (its kernel is a fixed 4-tap in texel space), which is why the r128 build set radius=3 and
     got nothing for it: that line has been decorative for as long as it has existed.
     VSM IS ALSO WHY THE BIAS IS ZERO. Variance shadow maps compare moments, not depths, so a
     negative constant bias does not fix acne, it opens light leaks under thin geometry; the
     normal-offset bias is the one that belongs here and it is doing the work alone. */
  shadowType:'vsm', shadowMap:2048, shadowRadius:4.2, shadowBlur:14,
  shadowBias:0.0, shadowNormalBias:0.022, shadowExtent:58, shadowFar:170,

  /* IMAGE-BASED LIGHT. The file is fetched at runtime and convolved by PMREMGenerator; see
     src/sky.mjs for the load, the fallback and why this is not bundled.
     THE ROTATION IS MEASURED, NOT EYEBALLED. An HDRI whose sun sits somewhere other than the
     game's directional light gives every surface a bright side that disagrees with its own
     shadow — the specular highlight points one way and the shadow falls the other. So the
     environment is rotated about Y until the two agree: the HDRI's solar azimuth was measured
     as the energy-weighted centroid of its top 0.02% of pixels in the upper hemisphere
     (36.24deg for pizzo_pernice), the game's sun sits at azimuth 154.44deg, and 2.0630 rad is the
     difference. Re-measure it if the HDRI or sunPosDay changes; do not carry this number over.
     RESIDUAL, RECORDED RATHER THAN HIDDEN: azimuth is matched exactly, ELEVATION is not.
     pizzo_pernice's sun stands at 53.1deg against the game's 39.5deg, a 13.6deg residual, and
     tilting an environment to fix that tips its horizon and drags the ground bounce sideways —
     a worse artefact than the one it cures. kloofendal_43d_clear matches elevation to 3.4deg and
     is on the shelf in assets/hdri/ if Eric would rather have that trade. */
  hdri:'hdri/pizzo_pernice_1k.hdr', envIntensityDay:0.55, envIntensityNight:0.80,
  envRotationY:2.0630,
  /* THE MEASURED INPUTS TO envRotationY, KEPT SO THE ROTATION CAN CHECK ITSELF. hdriSunAz is
     pizzo_pernice's own solar azimuth (the energy-weighted centroid of its brightest 0.02% of
     upper-hemisphere pixels) and hdriSunEl its elevation, both in radians. The identity that must
     hold is  envRotationY === atan2(sunPosDay.z, sunPosDay.x) - hdriSunAz, and a battery asserts
     exactly that — so moving the sun or swapping the HDRI without re-measuring goes RED with a
     message saying to re-measure, instead of silently pointing the environment's sun one way and
     the shadows the other. That is the failure this constant exists to make impossible.
     hdriSunEl is not used by the renderer at all; it is recorded because the 13.6deg elevation
     residual against the game's 39.5deg sun is a known, accepted trade (see the note above) and a
     number nobody wrote down is a number the next session re-derives. */
  hdriSunAz:0.6325, hdriSunEl:0.9269,
  /* HOW 0.55 WAS ARRIVED AT, IN THREE MEASURED STEPS. Recorded in full because the obvious value
     is wrong twice over and the next person to touch it will otherwise repeat both mistakes.

     STEP 1 — 0.45, BY EYE, AND WRONG. The first cut came back 6 YAVG darker and A THIRD LESS
     SATURATED across four vantages: the exact shape of the P1 bloom mis-tune, and the same root
     cause, a number that looked sensible for a quantity nobody had measured. Two facts were
     missing. Scene.environmentIntensity DEFAULTS TO 1, so the painted gradient initRenderer
     builds was already lighting the game at FULL strength — P2 does not add image-based light to
     a dark scene, it REPLACES a full-strength environment. And hemi/fill/rim were authored ON TOP
     of that full-strength environment, so cutting them to "make room for the IBL" cut a second
     time. Two cuts, one of them intended.

     STEP 2 — 0.890, THE ENERGY-NEUTRAL SWAP, MEASURED. The solid-angle-weighted mean radiance of
     the painted gradient is 0.6132 (measured the way three samples it: ColorManagement is off and
     a CanvasTexture is NoColorSpace, so its sRGB bytes are consumed AS LINEAR) and
     pizzo_pernice's is 0.6892, so 0.6132/0.6892 = 0.890 delivers exactly the energy the game
     always had. That restored the exposure — and the shadows still would not read.

     STEP 3 — 0.55, BECAUSE THE SHADOWS ARE THE POINT. `fill` and `rim` are DIRECTIONAL lights
     that DO NOT CAST, and that is the whole problem: they were authored to fake directional
     interest back when nothing in the game cast a shadow, and they fill every shadow straight
     back in. With the environment at 0.890 and those two at their authored 0.15, toggling the
     shadow map moved 40,601 px at a max delta of 74 — the shadows were being drawn correctly and
     softly, in the right places, and were simply washed out. Measured at 01_carpark_wide, the
     ratio strip read
         env 0.89 / fill 0.15 / rim 0.15 / sun 1.45    YAVG 163.5   YLOW 122   flat
         env 0.55 / fill 0.05 / rim 0.10 / sun 1.85    YAVG 155.7   YLOW  97   shadows read
         env 0.40 / fill 0.00 / rim 0.08 / sun 2.10    YAVG 152.1   YLOW  80   strong
     The middle row is locked: YLOW falls 25 levels, so the shade genuinely deepens, while YAVG
     lands on the P1 baseline of 156.08 to within a third of a level, and 11_trailhead reads
     169.57 against its own baseline 169.50. Exposure held, contrast bought from the fill that was
     never physical.

     THE OTHER TWO HDRIs NEED THEIR OWN NUMBER. Energy-neutral measures 0.744 for
     kloofendal_43d_clear and 1.284 for dry_field, so the same 0.62 ratio off neutral gives 0.46
     and 0.80. Scale env WITH the swap or the strip compares brightness rather than sky.

     THE NIGHT VALUE HOLDS THE AUTHORED NIGHT, DELIBERATELY. nightApply never touched the
     environment before, so a night scene was lit by a full-strength MIDDAY gradient. That is not
     defensible, but neither is silently darkening a vantage this piece was not asked to change:
     the first cut's 0.06 took 21_night_camp from YAVG 92.3 to 50.9. Swept, 0.60/0.80/1.00 read
     81.3/89.8/97.1, so 0.80 holds the authored exposure to within 2.5 levels and comes back MORE
     saturated (36.8 against 33.9). Darkening the night so the torch has more to do is a real and
     probably good idea, and it is a separate judged change rather than a side effect of P2. */

  /* FILL AND RIM COME DOWN BECAUSE THEY DO NOT CAST — see step 3 in the env note above. They are
     unshadowed directionals that were faking directional interest in a game where nothing cast a
     shadow; now that the carpark receives one, they are the single largest thing erasing it. The
     energy they gave up went to the SUN (1.45 -> 1.85), which does cast, so the frame keeps its
     exposure and gains its contrast. hemi keeps most of its strength because its groundColor
     (0x8A7C42) is the warm gold bounce the country is tuned to and it is the cheapest source of
     the coloured shade ref_bow_00 and _06 read as; 0.18 was picked off the warmth strip, where
     0.14/0.18/0.22 all held exposure and the middle sat closest to the baseline on 28.
     NIGHT VALUES ARE UNTOUCHED r128 VALUES. Only the night environment moved. */
  hemiIntensityDay:0.18, hemiIntensityNight:0.13,
  hemiSkyDay:0xC7DBE8, hemiSkyNight:0x22304C,
  hemiGroundDay:0x8A7C42, hemiGroundNight:0x161A24,
  fillIntensityDay:0.05, fillIntensityNight:0.05,
  rimIntensityDay:0.10, rimIntensityNight:0.04,

  /* the painted dome keeps its own art; these are the two knobs nightApply already drove */
  hazeOpacityDay:0.45, hazeOpacityNight:0.14,
};
for(const [k,v] of Object.entries((typeof globalThis!=='undefined'&&globalThis.__KEA_SKY__)||{})){
  if(k in SKY) SKY[k]=v;
}

/* ============================================================
   SCANNED MATERIALS — REPLAT P3 (2026-09-03). THE RECIPE, IN NAMED CONSTANTS.
   ============================================================
   P3's proof contract is three claims: every material family resolves a REAL texture set, the
   licences are recorded, and no procedural canvas is left on a swapped family. This block is the
   pin for all three. Every set is CC0 from Poly Haven and every file is listed in
   assets/LICENCES.md with the publisher's own md5 — see that file for the licence law this tier
   lands under and for why nor_gl, why the packed arm, and why 1k.

   __KEA_MATS__ OVERRIDES ANY LEAF, exactly like __KEA_SKY__ and for the same reason: a material is
   judged AT THE VANTAGE, so every tint and tile in this piece has to be shootable without a
   rebuild. Nested one level, so KEAMATS='{"families":{"asphalt":{"tint":0.8}}}' reaches a family
   without restating the other six.

   ---- TEXEL DENSITY IS THE POINT OF THIS BLOCK, AND IT IS DERIVED, NOT DIALLED ----
   `tileM` is the PUBLISHER'S OWN real-world size for the scan, in metres, straight off the Poly
   Haven API and recorded per set in LICENCES.md. It is not a taste number and it is not fitted by
   eye. The whole density chain is:

       geometry UVs are rescaled to METRES  (uvMetres, below)
       the family's textures repeat at 1/tileM
       so a texel lands tileM/1024 metres across, everywhere, on every surface

   WHY THE UVs MOVED AND THE TEXTURE'S REPEAT DID NOT. A BoxGeometry's UVs run 0..1 PER FACE, so a
   shared texture with one repeat gives a 40 m carpark slab and a 0.7 m chimney the same number of
   tiles — which is not a small error, it is the difference between gravel and a photograph of
   gravel stretched over a car park. The alternative fix is a material clone per (family, size)
   pair, and that multiplies draw calls for a problem that is really about geometry. So the UVs
   carry the metres and ONE material per family serves every mesh in it.

   ---- TWO MODES, BECAUSE A PAINTED SURFACE AND A MATERIAL SURFACE ARE NOT THE SAME PROBLEM ----
   Look at ref_bow_00 and this is the whole distinction: the brick is BRICK-COLOURED and the
   weatherboard trim beside it is CREAM BECAUSE SOMEBODY PAINTED IT. Feeding one pipeline both
   gives you either a red-brown hut (a red palette colour multiplied by a brown plank albedo) or a
   country that has lost its palette.

     mode 'scan'   the scan's albedo IS the colour. asphalt, gravel, brick, snow. The palette
                   colour survives as a LUMINANCE-NEUTRAL TINT: the authored hex is divided by its
                   own luminance, so it pushes hue without touching exposure, and `tint` lerps
                   white -> that hue. tint 0 is the raw scan; tint 1 is the scan wearing the NZ
                   palette's hue at the scan's own brightness. This is the same energy-neutral
                   trick P2 used on the environment, for the same reason: a look decision should
                   not smuggle in an exposure change.
     mode 'paint'  the palette colour IS the paint, and the scan supplies the SURFACE. grass,
                   weatherboard, corrugate. All three maps are still consumed — the albedo is
                   reduced to its own luminance and renormalised so its mean is `paintMean`, and
                   the material colour is scaled by 1/paintMean to put the exposure back. What the
                   albedo then contributes is the thing that was actually missing: the shadow in
                   every weatherboard lap, the dark in every corrugation valley, the mottle of dry
                   grass. Chroma is dropped ON PURPOSE, and the hut stays the red it has always
                   been.
   THE GROUND IS 'paint' FOR A THIRD REASON. The terrain plane is a vertex-colour BLEND of grass,
   tussock, gravel and scree — one albedo cannot serve four families at once, and a splat-blended
   scanned terrain is P4's problem, not a thing to fake here. So the terrain takes the grass scan's
   relief and roughness at full strength over the palette blend it already had.

   ---- ROUGHNESS COMES FROM THE SCAN, SO THE MATERIAL'S OWN ROUGHNESS GOES TO 1 ----
   three MULTIPLIES material.roughness by roughnessMap.g. mat()'s authored 0.82 times a map that
   averages around 0.6 is 0.49, and a wet-looking car park is not a scanned car park. A family
   material therefore holds roughness 1.0 once its maps land and lets the scan own it outright;
   `roughScale` exists as the named home for a future tune and is deliberately 1.0 today, so
   nothing here is a fudge waiting to be discovered. UNTIL the maps land the material keeps the
   authored 0.82, because a browser that never finishes the fetch must look like the game it was,
   not like a mirror. */
const MATS={
  dir:'tex/', res:'1k',
  /* THE MEAN THE PAINT MODE NORMALISES TO. 0.75 and not 1.0 because an 8-bit albedo cannot hold a
     value above 1, so a map normalised to a mean of 1 would have no headroom for the highlights
     and would clip every lit plank flat. 0.75 leaves a third of a stop above the mean, which
     covers the brightest lap on all three paint-mode scans, and the material colour carries the
     reciprocal so the surface lands back on its authored luminance. */
  paintMean:0.75,
  normalScale:1.0,
  roughScale:1.0,
  /* tileM IS THE PUBLISHER'S PUBLISHED SIZE IN METRES. Cross-checked against LICENCES.md, which
     records the same number in millimetres straight from the API. A battery asserts the two agree,
     because the failure this guards is somebody re-tiling a surface by eye and leaving the ledger
     saying something else. */
  /* ---- THE BREAKUP, added 2026-09-03 (session 17) on Eric's P3 verdict ----
     P3 shipped with visible tiling repetition on the car park: asphalt_02's tar cracks land every
     3 m, about thirteen times across the 40 m slab, and the eye locks onto the pattern. Eric's
     call was explicit — fix it with BREAKUP, NOT A BIGGER TEXTURE — in two halves, and both are
     here:

       1. A LARGE-SCALE VARIATION LAYER that never aligns with the tile. Two octaves of value
          noise in WORLD metres, driving albedo and roughness together, at `macroM` metres per
          cell. It is procedural rather than a scanned grunge map ON PURPOSE and this is not a
          retreat from P3's law: a breakup layer that is itself a texture HAS ITS OWN REPEAT
          PERIOD, so it would solve the problem by adding a second, slower copy of it. Noise from
          a position hash has no period at all, which is the only version of this that cannot
          re-introduce what it was sent to remove.
       2. PER-TILE ROTATION AND OFFSET so no two tiles match, by stochastic tiling: the surface is
          cut into a triangle lattice, each vertex draws its own rotation and offset from a hash of
          its lattice coordinate, and the three nearest are blended by barycentric weight. Three
          taps, so it costs three fetches per map where it is on.
          IT NEEDS EXPLICIT GRADIENTS AND IT HAS THEM. A per-cell offset makes the UV jump at a
          cell border, so hardware auto-derivatives would read that jump as an enormous rate of
          change and collapse to the smallest mip — the classic dark seam that `fract()` in a UV
          produces. Each tap therefore samples with textureGrad, handed the ORIGINAL derivatives
          rotated by that tap's own rotation, which is what the chain rule says they are. three
          emits `#version 300 es` for every built-in material, so textureGrad is simply available.

     `iso` IS THE GATE AND IT IS A FACT ABOUT THE MATERIAL, NOT A PREFERENCE. Rotating a tile is
     only safe on an ISOTROPIC surface — gravel, asphalt, dry grass, snow have no grain, so a
     rotated patch is still the same material. Weatherboard laps, corrugate ribs, brick courses and
     concrete form lines are all DIRECTIONAL: rotating those tiles would tilt the laps and lean the
     courses, which is a far worse defect than the repetition being cured. So the four ground
     families are `iso:true` and the four built ones are not, and a battery asserts that a
     directional family never gets the rotation.

     WHY THESE NUMBERS. patchM is deliberately NOT equal to any tileM: a patch lattice the same
     size as the tile grid would lock to it and produce a visible second grid. macroM is 17.3 m
     because it has to be well above the largest tile (3 m) to read as weathering rather than as
     more texture, and well below the 40 m slab so more than one macro feature is in frame. */
  /* blendSharp AND THE VARIANCE RESTORE ARE BOTH THERE BECAUSE OF WHAT THE FIRST A/B SHOWED.
     Three-tap blending fixed the repetition and cost CONTRAST: the aggregate grain went visibly
     soft, because averaging three independent samples of a stochastic texture reduces its variance
     by the sum of the squared weights. That is not a matter of taste, it is arithmetic, and it has
     two standard corrections and both are cheap:
       blendSharp  raises the barycentric weights to a power and renormalises, so most of the
                   surface is ONE tap at full contrast and only narrow bands blend. 1.0 is the
                   plain barycentric blend.
       varRestore  rescales each blended value's deviation from the texture's own MEAN by
                   1/sqrt(sum of squared weights) — exactly the factor the blend removed. At a
                   lattice vertex the weight vector is (1,0,0), the factor is 1, and the sample is
                   untouched; at a triangle centre it is sqrt(3). The mean is MEASURED per map at
                   load time and passed in, not guessed.
     AND THEY FIGHT EACH OTHER, WHICH IS WHY varRestore SHIPPED AT ZERO. Run together at
     blendSharp 4, the lattice became VISIBLE — dark hexagonal cell borders across the whole car
     park, photographed and unmistakable. The cause is not subtle once seen: sharpening
     concentrates all the blending into narrow bands, and the restore then boosts contrast hardest
     exactly where the blend is widest, so the correction lands precisely on the seams it was
     supposed to hide and draws them instead. Heitz and Neyret pair weight sharpening with a
     histogram-preserving transform, which needs a precomputed decorrelated texture and an inverse
     CDF per map; without that the restore is statistically right and perceptually wrong.
     THE STRIP SETTLED IT. Sharpening ALONE fixes the softness for the reason that matters: it
     makes most of the surface a SINGLE tap at full native contrast, leaving only narrow slightly
     soft bands. varRestore is kept, at 0, because it is the correct arithmetic and the right thing
     to reach for on the day somebody adds the histogram transform — and because a knob that was
     measured and rejected is worth more written down than deleted. */
  breakup:{
    patchM:2.6, macroM:17.3, macroAmount:0.16, macroRough:0.10, blendSharp:4.0, varRestore:0.0,
  },
  families:{
    grass:        {asset:'withered_grass',     tileM:2.000, mode:'paint', iso:true },
    gravel:       {asset:'gravel_floor_02',    tileM:2.000, mode:'scan', tint:0.35, iso:true },
    asphalt:      {asset:'asphalt_02',         tileM:3.000, mode:'scan', tint:0.45, iso:true },
    snow:         {asset:'snow_02',            tileM:2.000, mode:'scan', tint:0.55, iso:true },
    weatherboard: {asset:'dark_planks',        tileM:2.000, mode:'paint', iso:false},
    corrugate:    {asset:'corrugated_iron_02', tileM:2.700, mode:'paint', iso:false},
    brick:        {asset:'brick_wall_09',      tileM:2.010, mode:'scan', tint:0.20, iso:false},
    /* THE EIGHTH FAMILY, on Eric's verdict that the ski tow's top anchor block wearing driveway
       gravel is a mis-assignment. It is a poured-concrete footing. NOT iso: concrete_layers_02
       carries the horizontal lines a timber form leaves, and those must stay level. */
    concrete:     {asset:'concrete_layers_02', tileM:2.000, mode:'scan', tint:0.30, iso:false},
  },
};
/* AND IT REPORTS WHAT IT IGNORED. Unknown keys are skipped by design — a leaf merge that invented
   constants would be worse — but a SILENTLY ignored override is how a variant strip gets shot,
   judged and locked with one frame quietly on the default, which is the same class of failure as an
   unseeded capture pass. webrig already refuses a misspelled KEASKY leaf; it cannot do the same for
   a misspelled FAMILY NAME without keeping a second copy of the seven names, and it kept one
   briefly and let `{"families":{"asfalt":{...}}}` straight through. So the knowledge stays here,
   where the names actually live, and the list of what was ignored travels out in G.mats for the rig
   to refuse. One source of truth, checked at both levels. */
const MATSIGNORED=[];
/* ONE MERGE FOR BOTH NESTED BLOCKS, and it only ever writes a leaf that already exists.
   THE FIRST CUT SPECIAL-CASED `families` AND WHOLESALE-ASSIGNED EVERYTHING ELSE, which turned
   KEAMATS='{"breakup":{"blendSharp":4}}' into a breakup block with ONE key in it: patchM, macroM
   and both macro amounts became undefined, the uniforms became NaN, and four variants of a strip
   came back byte-identical because every one of them was equally broken. The merge is generic and
   depth-limited now, so `breakup` and `families` behave the same way and neither can lose a leaf.
   THE TYPE AND THE FINITENESS ARE BOTH CHECKED, because the failure above was silent: a NaN
   uniform renders SOMETHING, and what it renders looks like a deliberate look. */
function matMerge(dst,src,path,depth,sink){
  sink=sink||MATSIGNORED;
  for(const [k,v] of Object.entries(src||{})){
    const at=path?path+'.'+k:k;
    if(!(k in dst)){ sink.push(at); continue; }
    const cur=dst[k];
    const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
    if(plain(cur)&&plain(v)){
      if(depth<=0){ sink.push(at+' (too deep)'); continue; }
      matMerge(cur,v,at,depth-1,sink); continue; }
    if(typeof cur==='number'&&(typeof v!=='number'||!isFinite(v))){
      sink.push(at+' (not a finite number: '+v+')'); continue; }
    if(typeof cur==='boolean'&&typeof v!=='boolean'){
      sink.push(at+' (not a boolean: '+v+')'); continue; }
    dst[k]=v;
  }
}
matMerge(MATS,(typeof globalThis!=='undefined'&&globalThis.__KEA_MATS__)||{},'',2);

/* ============================================================
   INSTANCED GRASS — REPLAT P4 (2026-09-03). THE RECIPE, IN NAMED CONSTANTS.
   ============================================================
   P4's proof contract is three claims: instance count and LOD thresholds asserted, frame budget
   MEASURED and recorded, and wind deterministic under the capture clock pin. This block is the pin
   for all three, and `gauntlet/verify/perf.mjs` is the instrument that produced the numbers.

   __KEA_GRASS__ OVERRIDES ANY LEAF, same seam and same reason as __KEA_SKY__ and __KEA_MATS__:
   a density tier is judged AT THE VANTAGE and has to be shootable without a rebuild. It goes
   through the same depth-limited leaf merge, so a tier cannot lose a sibling and a typo is
   reported rather than ignored — that bug cost session 17 a whole variant strip.

   ---- THE TIER IS A MEASUREMENT, NOT A PREFERENCE ----
   The brief was "the highest density that holds a playable frame rate on this Mac - measure three
   tiers, do not assume". The measured numbers live in ARTBIBLE under REPLAT P4 and the shipped
   tier is whichever one those numbers chose. `count` is the number of blades PLACED; what is
   DRAWN at any moment is far smaller, because distance thinning collapses far blades in the vertex
   shader — G.grass reports both, so the two can never be confused in a later reading.

   ---- WHY ONE InstancedMesh AND NOT LOD RINGS ----
   The textbook answer to "too many blades" is several instanced meshes at different segment counts,
   swapped by distance. It is also three times the draw calls, three geometries to keep in step, and
   a seam at every ring boundary — and the seam is the thing the brief explicitly forbids. One mesh
   with vertex-shader thinning has no rings to seam, and the cost it saves is the cost that actually
   matters: a blade scaled to zero produces degenerate triangles, which the rasteriser discards
   before it shades a single fragment. Vertex work is paid for every blade; fragment work, which is
   where grass actually hurts, is paid only for the blades you can see. */
const GRASS={
  /* THE SHIPPED TIER. Set from the measurement, not from taste — see ARTBIBLE REPLAT P4. */
  /* ---- THE FIELD FOLLOWS THE CAMERA, AND THE MEASUREMENT IS WHY ----
     The first cut placed blades statically over a disc centred on the world origin, and three
     measured tiers plus a photographed density sweep proved that cannot work. The playable world
     is a 104 m square, so a static field has to cover roughly 12,900 m2; the frame budget tops out
     near 420,000 blades; and 420,000 over 12,900 m2 is THIRTY-THREE BLADES PER SQUARE METRE, which
     photographs as stubble. Shrinking the radius to raise density does not help either — it moves
     the grass away from the bird, which is exactly what the r20 frame in that sweep showed: an
     empty foreground, because the field was a disc round the origin and the vantage was not.
     So `near` is a radius AROUND THE CAMERA, not around the origin. Every blade submitted is a
     blade close enough to matter, density is the same wherever the bird goes, and the same budget
     buys 195 to 334 blades per square metre instead of 33. Beyond `near` the ground is the P3
     scanned grass under fog, which is what distance grass actually looks like. */
  /* THE SHIPPED TIER IS `mid`, AND THE REASON IS A MEASUREMENT AND A LIMIT ON IT.
     Loop-timed scene cost at the Retina framebuffer this game actually runs at (2304x1296, because
     setPixelRatio caps at 1.8 and a Mac reports 2), against a pre-P4 baseline of 8.98 ms:
         60k in r14   97/m2    16.5 ms   1.8x baseline
        120k in r14  195/m2    24.3 ms   2.7x baseline     <- SHIPPED
        240k in r17  264/m2   ~40   ms   4.5x baseline
        420k in r20  334/m2    62.4 ms   6.9x baseline
     Photographed at 05_tussock_ground, the four are close: 60k already reads as a field because
     the clumping concentrates it, and above 240k the difference is barely visible while the cost
     doubles again. THE HONEST LIMIT ON THIS CHOICE: no instrument in this harness can measure a
     true frame rate — headless Chrome's requestAnimationFrame runs on a fixed cadence and reported
     the same 59.9 for 120k, for 1.9M and for the pre-P4 build — so "holds a playable frame rate"
     cannot be settled here. Given that, the tier that costs 2.7x the ALREADY-ACCEPTED baseline is
     the defensible one to ship, and `high` is measured, kept, and one env var away
     (KEAGRASS='{"tier":"high"}') on the machine that can actually judge it. */
  /* ---- THE COVER LAYER — REPLAT P4b ----
     Eric played P4 and the field read as ISLANDS IN BARE SAND: the clumps were right and the
     ground between them was naked. Real tussock country has a continuous low mat under the mounds
     — nz_tussock_01's ground is never bare between clumps, it is short growth with the mounds
     rising out of it. So a second layer, same shader and same geometry, different numbers: short,
     wide, dense, laid nearly UNIFORMLY (clumpPull 0.10, bare 0) so it fills every gap the clump
     layer deliberately leaves.
     IT IS SHORT ENOUGH NOT TO COST THE BIRD. 45-105 mm against a kea that stands about 300 mm —
     the cover reaches its ankles. The readability trade P4 tuned is in the CLUMP layer's height,
     and this layer is deliberately below it.
     AND SMALL ENOUGH IN RADIUS TO BE AFFORDABLE. It only has to cure bare ground you can SEE the
     ground of, which is close range; past 9 m the clump layer and the P3 scanned ground carry it.
     Its measured cost is in ARTBIBLE. */
  /* near 16 AND NOT 9. The first cut covered a 9 m disc, and the play camera looks at ground from
     five to twenty metres out — so the cover cured bare ground exactly where none was visible and
     stopped short of everywhere it was. Its cost is measured in ARTBIBLE; it is the cheapest layer
     in the game per blade because every blade is 45-105 mm tall and mostly sub-pixel past ten
     metres, which is also why it can afford the radius. */
  /* THE COVER KEEPS FULL DENSITY ALMOST TO ITS EDGE (lodFrac 0.88) where the clump layer starts
     thinning at 0.55 of its radius. They are doing different jobs: the clumps are a SHAPE and can
     afford to fade early because the eye reads their silhouette, while the cover's entire purpose
     is that no ground shows — and a cover that has already half-faded at nine metres leaves
     exactly the bare sand it was added to cure, which is what the play camera photographed. */
  /* THE COVER IS A NEAR-FIELD LAYER AND ITS RADIUS WAS CUT BACK TO SAY SO. At 340,000 blades over
     16 m it cost 21.9 ms — MORE than the clump layer — and it still did not cure the bare ground
     the play camera sees at ten to twenty metres, because a 100 mm blade at fifteen metres is two
     pixels tall and the ground behind it wins. That is not a density problem and no amount of
     geometry solves it: what reads as naked sand at that range is THE GROUND'S OWN COLOUR, which
     measured out at #9b9787 — a desaturated grey-beige. `groundTint` below is the fix for the
     distance; this layer is the fix for the foreground, where it genuinely works and is cheap. */
  cover:{count:150000, near:10, h:[0.055,0.130], w:[0.013,0.026], lean:[0.28,0.66],
         bare:0.0, clumpM:0.55, clumpPull:0.10, clumpPullVar:0.06, taper:0.45, lodFrac:0.88, seg:2},
  /* ---- THE FAR TIER — REPLAT P4e ----
     WHY IT IS GEOMETRY AND NOT PAINT, WHICH IS THE MEASUREMENT THAT DECIDED THIS PIECE. The
     obvious cheap fix is to tint the ground to match the field. It was built, and it does not
     work, and the reason is worth keeping: the ground's rendered colour is barely made of its own
     albedo. Setting the terrain's albedo to BLACK at the band just beyond the blades moves its
     luminance by 18% (159.5 -> 131.1) and its blue by ONE AND A HALF LEVELS. Fog cannot explain it
     - FogExp2 at 0.0062 is 0.55% at twelve metres. Whatever the rest of that pixel is, an albedo
     multiplier cannot reach it, and the sweep says so: gain 1 through 4 moved the blue of that
     band from 115.0 to 112.9 against a target of 96.7. A tint is a lever with almost nothing on
     the end of it.
     What makes a bladed pixel different is that blades OCCLUDE - they hide bright ground and
     brighter sky behind a lot of thin, self-shadowing, back-lit geometry. Nothing painted on a
     flat plane reproduces that, so the far tier is real instances.
     IT IS AN ANNULUS, NOT A DISC. rMin 0.30 puts every one of its blades outside 0.3 of its own
     radius, because inside that the clump and cover layers have the ground covered and a far blade
     there is an instance nobody can see.
     ITS BLADES ARE FEW, BIG AND CHEAP. Four to five times the width of a clump blade and about
     twice the height, at seg 2 - five vertices, three triangles. At twenty to fifty metres a 9 mm
     blade is a fraction of a pixel and costs a whole vertex shader to contribute nothing, which is
     what a naive radius extension spends its entire budget on. The count, radius and width were
     swept and the tables are in ARTBIBLE. */
  /* THE FIRST CUT MADE THEM BIG AND FEW AND IT WAS WRONG, WHICH IS THE OTHER HALF OF THE LESSON.
     110k blades of 34-86 cm at 45-105 mm wide photographed as SHEAVES OF WHEAT: grass that is
     visibly coarser at thirty metres than at three, which is a scale break and reads worse than the
     bare ground it replaced. Screen coverage bought with blade SIZE breaks the one thing a far tier
     must preserve, which is that the country is made of the same grass all the way out.
     SO THE FAR BLADE IS THE NEAR BLADE. h and w sit just above the carpark profile's 0.20-0.48 m
     and 9-20 mm — enough to hold a pixel at range, not enough to change species — and the coverage
     is bought with COUNT instead. The sweep is in ARTBIBLE; 300k reads patchy at the road and 450k
     reads continuous. */
  farLayer:{count:225000, near:28, rMin:0.24,
            h:[0.22,0.52], w:[0.012,0.028], lean:[0.10,0.36],
            bare:0.22, clumpM:1.60, clumpPull:0.44, clumpPullVar:0.28,
            taper:0.55, lodFrac:0.08, seg:2, shadow:false, fadeBand:0.55},
  /* ---- THE GROUND UNDER THE FIELD ----
     Eric's note said the monochrome yellow-beige runs across grass AND GROUND, and the ground was
     the half no blade can fix. The terrain is a vertex-colour blend that averages to #9b9787 at the
     play camera — pale, grey and sandy, which is what shows between every clump. This is a
     MULTIPLIER on the grass-family terrain material only: it darkens it and pulls it off grey
     toward soil and short growth, so ground between mounds reads as ground rather than as sand.
     It costs nothing — it is one colour on one material — and it is the single largest thing in
     P4b that the play camera actually sees. */
  groundTint:0xA8B078,
  /* ---- THE GROUND *IS* THE GRASS — REPLAT P4e ----
     Eric played P4d and the field reads perfectly, but he can see WHERE IT STOPS. The blade field
     is a 14 m disc anchored to the camera; beyond it the ground is bare terrain, and the boundary
     is the loudest line in a wide frame.
     THE SEAM WAS MEASURED UNDER CONTROL BEFORE ANYTHING WAS BUILT, and the answer is not the one
     the eye reports. The SAME image rows, same light, same fog, shot once with blades standing
     there and once without:
         bare ground   rgb 178.1 166.5 128.9    chroma 49    luma 166.3
         with blades   rgb 181.9 157.9  99.7    chroma 82    luma 158.8
     Red does not move, luminance moves 4.5%, and CHROMA moves by two thirds. **The field's edge is
     a SATURATION seam, not a brightness one** — the ground beyond it is not darker, it is washed
     out. That is why `grassMul` below is a per-channel multiplier of almost exactly those ratios
     and not a brightness knob, and it is why gauntlet/verify/edgefind.mjs grew a chroma channel:
     the instrument was about to certify "no colour seam" while structurally unable to see one.
     AND EXTENDING THE BLADE RADIUS DOES NOT FIX IT — MEASURED, NOT ASSUMED. Shot at near 40 m with
     the count raised to hold density (980k blades), the edge does not go away, it MOVES, and the
     edge finder scores it WORSE than the shipped 14 m one: 16.90 against 5.92. At 40 m the fade
     band is compressed into a handful of pixels near the horizon, so the transition is SHARPER in
     screen space even though it is softer in metres. A bigger disc is still a disc.
     SO THE GROUND STOPS BEING SOMETHING THE FIELD SITS ON AND BECOMES THE FIELD'S OWN FAR TIER.
     It wears the grass's colour and the grass's clumping everywhere, and the blades are near-field
     DETAIL laid on top of it. There is then no radius to give away, by construction, because
     nothing changes at one.
     THE DRIFT PATTERN IS THE BLADE FIELD'S OWN, NOT A LOOKALIKE. `keaFarFbm` is character-for-
     character the blade shader's `keaFbm`, over the same `bareScale`, off the same position hash —
     so where the ground reads bare is exactly where a blade would have declined to grow. A battery
     asserts the two expressions are identical rather than merely similar, because "a similar noise
     field" is how a seam gets reintroduced by a later tune of one of them. */
  far:{
    /* MEASURED, from the controlled shot above: blades/bare = 1.021 / 0.948 / 0.773. Red barely
       moves, blue drops by a quarter. Rounded to three places and used as-is — this is a number
       that was taken, not chosen, and if the blade palette is retuned it should be re-taken. */
    grassMul:[1.021,0.948,0.773],
    /* THE MEASURED RATIO IS A DIRECTION; `gain` IS HOW FAR ALONG IT TO GO, AND IT IS CALIBRATED
       RATHER THAN CHOSEN. The ratio above was read off RENDERED pixels, which are fogged — so
       applying it to the ALBEDO under-corrects by exactly the fog fraction at the rows it was
       measured on. The effective multiplier is 1+(grassMul-1)*gain, and gain was swept and read
       back off the frame until the ground band landed on the blade band's own colour. Because fog
       is a lerp toward one colour, matching the two UNFOGGED colours matches them at every
       distance at once - which is why one number serves the whole field and not a distance ramp.
       The sweep is in ARTBIBLE. */
    gain:1.0,
    /* where the field would be BARE the ground is already right: bare ground is what it is. Unity
       rather than a second invented colour, so the correction has exactly one measured half. */
    soilMul:[1.0,1.0,1.0],
    amount:1.0,
    /* a mound-scale mottle so the TEXTURE frequency continues past the blades rather than stopping
       with them. It is FADED OUT WITH DISTANCE on purpose: 1.35 m features are sub-pixel by about
       sixty metres and procedural noise has no mipmap, so left on it would shimmer along the
       horizon — trading a static seam for a moving one. */
    /* 0.16 AND A 120 m FADE, BOTH RAISED AFTER SHOOTING THE AIR FRAME. At 0.075 over 55 m the term
       was invisible from fourteen metres up, which is the one view it was most needed in — the far
       tier stops at 28 m and everything past that is ground. Raised until the far ground carries a
       drift structure that reads as tussock country rather than as paint, and no further: this is a
       MOTTLE standing in for grass nobody can resolve, and pushed harder it becomes a pattern in
       its own right. Still faded out at the far end, for the anti-shimmer reason above. */
    moundAmt:0.16, moundFadeM:120.0,
  },
  /* ---- THE GROUND'S OWN COLOUR MASK — REPLAT P4d's MEASUREMENT SEAM ----
     P4c proved the mound lattice by SHOOTING IT at three clumpM multipliers and watching the
     patches shrink and grow. The other three candidate systems for "the field reads in squares"
     needed the same test, and two of them already had a knob (GRASS.cover.clumpM, GRASS.bareScale)
     while the ground's colour had NONE: its lattice was `PlaneGeometry(240,240,48,48)` and its
     pattern was four magic sine frequencies inline in buildCarpark. A system with no scale knob
     cannot be ruled in or out by measurement, which is the only kind of evidence this piece
     accepts — so both became named constants BEFORE anything was diagnosed.
       segs       the terrain plane's tessellation across 240 m. The vertex colour is computed PER
                  VERTEX, so 240/segs metres IS the colour lattice's cell size: 5 m at 48.
       maskScale  a multiplier on the mask pattern's spatial FREQUENCY, geometry untouched. 2.0
                  halves every feature, 0.5 doubles it. This is the knob that separates "the
                  pattern is on a grid" from "the plane is on a grid". */
  ground:{ segs:48, maskScale:1.0 },
  tier:'mid', snap:0.5,
  tiers:{
    low:  {count: 60000, near:14},
    mid:  {count:120000, near:14},
    high: {count:240000, near:17},
  },
  lodFrac:0.55,          // lodNear as a fraction of `near`: blades hold full density inside it
  /* BLADE GEOMETRY. seg is the number of segments up the blade, and it is what lets a blade ARC
     rather than stand up like a fence paling — ref_bow_02's blades are long curves, not spikes.
     seg 4 gives 9 vertices and 7 triangles per blade. */
  /* seg/bend are shared; TAPER IS PER LAYER. A tussock LEAF stays wide most of its length and
     only narrows near the tip — that is what makes it catch the light along its whole edge — where
     0.72 tapered almost from the base and read as a strand of hair. P4b widened both the taper
     exponent and the width range toward a leaf. */
  seg:4, bend:0.34,
  /* CLUMPING. The country in nz_tussock_01 is not a carpet: it is discrete tussock mounds with
     open ground between them, and that is the single biggest reason the old triangle carpet read
     as a lawn. Blades are scattered around clump centres drawn on a jittered grid, `bare` of the
     cells are left EMPTY on purpose, and `clumpFall` controls how tightly blades gather to their
     centre. */
  /* clumpJit and clumpPull are FIELD-WIDE; the mound SPACING and the bare fraction are per-biome
     (GRASS.biomes.*), because a tussock mound is coarser and sits in more open ground than
     pasture. There were top-level `clumpM` and `bare` here too and they were DEAD — the shader
     reads B.clumpM and B.bare — so tuning them did exactly nothing. Found by a sabotage that set
     the top-level `bare` to zero and stayed GREEN. A dead constant in a recipe block is worse than
     no constant: it is a knob that lies about being connected. */
  /* clumpJit AT 0.95, NOT 0.55, AND THE PULL VARIES PER MOUND. The clump cell is a SQUARE grid
     (floor(w/clumpM)), and at half a cell of jitter with one fixed pull the field photographed as
     a visible checkerboard of rectangular patches on bare ground — a grid is exactly what a grid
     looks like from the play camera, however good the blades in it are. Nearly a full cell of
     jitter breaks the rows, and varying the pull per cell breaks the rhythm: some mounds are tight
     and some are spread, which is what stops the eye finding the lattice. */
  clumpJit:0.95, clumpPull:0.42, clumpPullVar:0.30,
  /* THE COMB. The whole field leans ONE WAY, wandering slowly across the flats — that is what a
     breeze looks like on tussock and it is the difference between a field and a scatter. The
     amplitude BOUNDS the spread (twice `amp` radians, end to end), which is what lets the gate
     assert "the field leans one way" from the constants instead of from a sample. The shader line
     is generated from these four numbers, so there is exactly one copy of them. */
  comb:{base:2.1, amp:0.55, fx:0.055, fz:0.041},
  /* ---- REPLAT P4c: NATURE HAS NO RIGHT ANGLES ----
     Eric played P4b and the field read in SQUARES. Measured before touching anything: shooting
     14_player_view at clumpM 0.70 / 1.35 / 2.70 makes the square patches shrink and grow with it,
     which identifies the cause exactly. The clump model was ONE MOUND PER SQUARE CELL —
     `cell=floor(w/clumpM)` — so the mound lattice was a jittered square grid, and worse, `bare`
     culled WHOLE CELLS, giving literal right-angled holes. Jitter cannot fix that: a jittered grid
     is still a grid, because every cell contributes exactly one mound.
     Three changes, and none of them is a tuning:
       blobScan   a mound is now the NEAREST feature point among the 3x3 neighbourhood, not the
                  own-cell centre. That makes mound territories irregular Voronoi polygons whose
                  boundaries follow no cell edge — overlapping organic blobs, which is what the
                  brief asked for. Skipped where the pull is negligible (the cover layer), because
                  nine hash lookups per vertex is not free.
       bareScale  bare ground comes off a SMOOTH NOISE FIELD instead of a per-cell step, so a bare
                  patch has an organic outline instead of four right angles. bareSoft is the width
                  of that boundary in density units.
       edgeVar    the field's outer fade was `length(w-camera)`, a perfect circle. The radius is
                  now perturbed by noise in world space, so the boundary is ragged and does not
                  read as a disc following the bird. */
  /* ---- REPLAT P4d: THE SQUARES WERE THE COVER LAYER, AND blobMinPull IS WHY ----
     Eric played P4c and still saw SQUARES. P4c had fixed the CLUMP layer and, in the same breath,
     written the exemption that kept the bug alive: "the SEARCH IS SKIPPED where the pull is
     negligible: the cover layer sits at 0.10 and gathers almost nothing, so nine hash lookups per
     vertex would buy it nothing." That sentence is a GUESS, it was never shot, and it is wrong.
     Measured the P4c way — shoot 14_player_view at cover.clumpM 0.55 / 1.10 / 2.20 — the straight
     bare LANES in the near field double and double again with it, exactly in step. The bare-ground
     noise field (bareScale 0.0725 / 0.145 / 0.29) and the ground colour mask (ground.segs 24/48/96,
     ground.maskScale 0.5/1.0/2.0) both moved the frame and neither produced a square at any
     setting. The full tables are in ARTBIBLE.
     AND THE MECHANISM IS THE PULL ITSELF, NOT THE MOUND'S COLOUR. Re-shot at cover.clumpPull 0
     the lanes vanish completely at both 0.55 and 2.20. A pull of 0.10 toward ONE CENTRE PER SQUARE
     CELL moves every blade 10% of the way in from wherever it stood, which VACATES A MARGIN ALONG
     EVERY CELL EDGE — so the square lattice is drawn in NEGATIVE SPACE, as a grid of straight
     empty lanes, and it is drawn by the very smallness that was thought to make it safe. "Gathers
     almost nothing" is not the same as "gathers nothing": a 10% gather is a 10% gap, and a gap on
     a square grid is a square grid.
     So the threshold stops being a magic 0.2 buried in a uniform and becomes a named constant AT
     ZERO. Any layer that pulls at all gets irregular territories, because any pull at all draws
     the lattice it pulls toward. It is kept as a knob rather than deleted so the next session can
     shoot the exemption instead of arguing about it. */
  blobScan:true, blobMinPull:0.0, bareScale:0.145, bareSoft:0.12, edgeVar:0.26,
  /* REPLAT P4e: the width IN METRES of the verge where grass thins into a cut-out. 1.1 m is about
     a stride, which is what the edge of a gravel car park in tussock country actually looks like —
     and it is wide enough to read as a verge at thirty metres, which is the range the far tier now
     shows the car park's edge from. */
  cutSoft:1.1,
  /* HOW MANY CUT-OUT BOXES A BIOME MAY HAVE, and it is a constant because it used to be four
     hand-written uniforms and four hand-written multiplies. VILLAGE.md step 0: the campground came
     out a straight gravel track instead of the loop road its brief imagined, because an oval
     cannot be cut with boxes and two long sides plus two ends is the whole budget of four before a
     single building is clear of grass. A village street layout needs seven before anything
     optional — road, two footpaths, two forecourts, a bus-shelter pad, a bike-rack pad.
     THE SHADER IS BUILT FROM THIS NUMBER rather than agreeing with it: the declaration and the
     multiply loop are generated below, so raising it again is this one edit. */
  cuts:8,
  /* THINNING. `fade` is how sharply a blade shrinks out as it crosses its own cull threshold —
     `fadeBand` is the WIDTH of that shrink window in density units, and the density ramp is
     stretched to 1+fadeBand on purpose so that "full density" really means every blade at full
     height — a naive ramp to exactly 1 leaves the top fadeBand of blades permanently stunted right
     under the camera, which is the most visible place in the frame. `comp`
     widens the survivors as the field thins, so distance reads as haze rather than as balding. */
  fadeBand:0.11, comp:0.45,
  /* WIND. Two frequencies: a slow large-scale GUST that crosses the whole field, and a faster
     per-blade FLUTTER. Both are functions of uTime, which the capture rig pins at 12.0 — so a
     photographed frame is a fixed frame. Nothing here reads performance.now(). */
  windGust:0.19, windFlutter:0.075, gustHz:0.55, flutterHz:2.7, gustM:0.055,
  /* LIGHT THROUGH THE BLADES. ref_bow_02 and ref_bow_15 are both backlit and the blades GLOW —
     that is transmission, and an opaque Lambert blade cannot do it at any density. A wrap term
     plus a view-dependent forward-scatter lobe, both scaled by height up the blade because a
     blade is thinnest at its tip. */
  transAmt:0.55, transPow:3.2, transColor:0xFFE7A8, wrap:0.32,
  /* PER-BIOME BLADE PROFILE. "Tussock-shaped blades for the alpine biome" is a shape claim, not a
     colour one: a tussock blade is longer, stiffer, narrower and stands closer to upright than
     pasture grass, and it grows in tighter mounds with more bare ground between. */
  biomes:{
    /* w IS IN METRES AND IT IS A BLADE WIDTH, NOT A MULTIPLIER. The first cut carried the old
       code's numbers straight over — 0.85 to 1.35 — which were a multiplier on a 95 mm plane and
       became an ABSOLUTE width the moment the geometry went unit-sized. The field came back as
       metre-wide angular shards, photographed at 05_tussock_ground and unmistakable. Real pasture
       grass is 4-10 mm across and a tussock leaf is narrower and stiffer than that. */
    /* THE HEIGHTS AND THE CLUMPING WERE TUNED AGAINST THE SUBJECT FLOORS, NOT BY EYE, and the
       reason is that the first cut BURIED THE BIRD. At h 0.30-0.78 with clumpPull 0.62 the kea
       portrait read 465 pixels against a floor of 1600 and the preen vantage 414 against 900 —
       three bird classifiers went red at once, which is the gauntlet saying the game had stopped
       showing its protagonist. Measured across five tunings at 03_kea_plate and 13_idle_preen:
           h 0.30-0.78  pull 0.62  bare 0.28   03  465/1600   13   414/900
           h 0.30-0.78  pull 0.42  bare 0.18   03  737/1600   13   595/900
           h 0.22-0.52  pull 0.42  bare 0.18   03 1573/1600   13 1494/900
           h 0.20-0.48  pull 0.42  bare 0.18   03 1663/1600   13 1604/900   <- LOCKED
           h 0.18-0.44  pull 0.42  bare 0.18   03 1683/1600   13 1647/900
       Blade HEIGHT is the dominant lever and the looser clumping is what stopped the field reading
       as isolated brushes with bare ground between them. Some occlusion is authentic — ref_bow_03's
       bin is half-buried and it looks right — but a bird you cannot see is not a trade, it is a
       bug, and the floors are the instrument that said so. */
    /* ---- COLOUR, FROM nz_tussock_03 ----
       The foreground mound in that photograph is the whole brief in one object: an OLIVE-GREEN
       heart, an OCHRE body, and RUST-BROWN outer leaves, all in the SAME mound — and P4 shipped
       three golds that differed by a few percent, which is why Eric read the whole country as
       monochrome yellow-beige. Four colours per biome now, and they are used along the blade as
       well as between blades:
         base   the green at the foot of a leaf, where it is alive and shaded
         a,b,c  the body: three genuinely different draws, ochre / tawny / pale dry stalk
         tip    the rust-brown of an old outer leaf, and the seed head
       A blade mixes base -> its own body colour over the first half, then toward tip over the top
       — and the AMOUNT of tip it takes is per-blade, so some leaves are green to the end and
       others are rust from halfway. The clump weight leans the whole mound one way on top of that,
       which is what stops a field of individually-varied blades averaging back to one colour. */
    /* THE SEPARATION HAD TO BE PUSHED, AND A CONTROL SAID SO. The first cut of this palette was
       base 0x5E6B30 / body 0xB98F42,0xA87C2C,0xD8C288 / tip 0x8A5A2B — four colours inside about
       twenty degrees of hue and half a stop of value, which photographed as the same monochrome
       gold P4b was sent to fix. Forcing base to pure red and tip to pure blue showed the gradient
       working perfectly, so the mechanism was never the problem: the colours were. Widened to a
       real green, a genuinely deep tawny, a bleached stalk and a dark rust, which is the spread
       nz_tussock_03's foreground mound actually has. */
    carpark:  {h:[0.20,0.48], w:[0.009,0.020], lean:[0.10,0.34], bare:0.18, clumpM:1.35, taper:0.55,
               base:0x4C6B22, tint:[0xC58E31,0x8E6118,0xE6D6A2], tip:0x7A3F16},
    skifield: {h:[0.26,0.62], w:[0.006,0.014], lean:[0.05,0.19], bare:0.34, clumpM:1.75, taper:0.50,
               base:0x46661F, tint:[0xD09B2C,0x94661C,0xEADCAC], tip:0x8A4A18},
    /* A RIVER FLAT IS THE GREENEST GROUND IN THE TOUR, and it is the one place a profile should
       NOT be the tussock palette with the numbers nudged: this is grazed river-flat pasture, so it
       is shorter than the carpark's, much less bare, and its body colours lean green-to-straw
       rather than ochre-to-rust. `bare` is the lever that says "somebody mows this". Heights stay
       inside the band the carpark's were LOCKED at against the subject floors (0.20-0.48) so the
       bird cannot be buried — that measurement was paid for once. */
    campground:{h:[0.18,0.42], w:[0.008,0.017], lean:[0.12,0.38], bare:0.10, clumpM:1.15, taper:0.58,
               base:0x3E6A1C, tint:[0xA8B043,0x62701F,0xE6E2BC], tip:0x66521E},
    /* THE VILLAGE VERGE IS MOWN AND IT IS THE ONE PLACE THAT IS HONEST. A campground is grazed and
       TODO 92 asks whether its 0.10 read as lawn; a village berm between a footpath and a fence
       genuinely IS lawn, so it is short, dense and green, and the ochres come almost out. Heights
       stay inside the band the carpark's were locked at against the subject floors — that
       measurement is not spent again here. */
    village:  {h:[0.14,0.32], w:[0.007,0.015], lean:[0.14,0.40], bare:0.07, clumpM:1.05, taper:0.60,
               base:0x37631A, tint:[0x8CA83A,0x53701C,0xCFD8A4], tip:0x5E5220},
  },
};
/* ITS OWN IGNORED LIST, not MATS's. matMerge pushes rejected paths into whatever array it is
   handed, and sharing MATSIGNORED would file a mistyped grass tier under G.mats.ignored — a
   report that points at the wrong recipe is worse than no report. Depth 3, because a tier and a
   biome profile both sit two levels down (`tiers.high.count`, `biomes.skifield.bare`). */
const GRASSIGNORED=[];
matMerge(GRASS,(typeof globalThis!=='undefined'&&globalThis.__KEA_GRASS__)||{},'',3,GRASSIGNORED);
function grassTier(){
  const t=GRASS.tiers[GRASS.tier]||GRASS.tiers.high;
  /* the thresholds are DERIVED from the tier's radius, never typed twice: full density inside
     lodFrac of it, gone by the edge. A tier cannot be given a lodFar that disagrees with the
     radius it draws over, because there is only one number. */
  return {count:t.count, near:t.near, lodNear:t.near*GRASS.lodFrac, lodFar:t.near,
          density:t.count/(Math.PI*t.near*t.near)};
}

/* ============================================================
   KEA-LOGIC-START  · untitled kea game · single-file build
   state root: G · tick: update(dt) · input seam: KEYS/press()
   ============================================================ */
'use strict';
const HEADLESS = (typeof window!=='undefined' && window.__KEA_HEADLESS__) || (typeof window==='undefined');

/* ---------- palette ---------- */
/* ============================================================
   CREDITS — REPLAT P5 (2026-09-04). ATTRIBUTION IS A CONDITION OF USE, NOT A COURTESY.
   ============================================================
   Every asset before P5 was CC0 from Poly Haven. assets/LICENCES.md credits those authors anyway,
   because they did the work — but nothing obliged it, and so this game shipped for months with no
   credits surface at all and nobody noticed.
   THE PALM COCKATOO BASE MESH IS CC-BY, and Sketchfab's own licence field for it reads "Author must
   be credited. Commercial use is allowed." That is a CONDITION. A credit that lives only in a
   markdown file in the repo is not a credit to a player who has the game and not the repo, so it
   has to reach the screen — and something has to stop the next asset being added without one.
   THE LEDGER IS THE SOURCE OF TRUTH AND THIS BLOCK IS CHECKED AGAINST IT. assets/LICENCES.md
   carries a machine-readable `<!-- ASSET ... attrib=required ... -->` marker per attribution-
   required asset; a battery parses those and asserts the set matches this block exactly, in both
   directions. Add an asset without a credit and the gate goes red; delete a credit for an asset
   still in the ledger and the gate goes red. That is the only way an obligation survives contact
   with a hurried session.
   CC0 ENTRIES ARE LISTED TOO, and deliberately. They do not have to be, which is exactly why a
   human would drop them first under time pressure. */
const CREDITS=[
  {what:'kea base mesh', title:'Rockatoo character', author:'Macauley.B',
   lic:'CC-BY 4.0', url:'sketchfab.com/Macauley.B', required:true},
  {what:'HDRI skies', title:'pizzo_pernice · kloofendal_43d_clear · dry_field',
   author:'Andreas Mischok, Greg Zaal — Poly Haven', lic:'CC0', url:'polyhaven.com', required:false},
  {what:'scanned materials', title:'eight PBR sets', author:'Poly Haven', lic:'CC0',
   url:'polyhaven.com', required:false},
];
/* Rendered into the title screen at boot. Plain text, no innerHTML from any field that could ever
   come from outside this block — these are constants, but the habit is cheap and the alternative
   is a credits line that is also an injection point the day one of them is fetched. */
function creditsRender(){
  if(typeof document==='undefined')return 0;
  const el=document.getElementById('credits'); if(!el)return 0;
  el.textContent='';
  const head=document.createElement('b'); head.textContent='ASSETS  ';
  el.appendChild(head);
  CREDITS.forEach((c,i)=>{
    if(i)el.appendChild(document.createTextNode('  ·  '));
    el.appendChild(document.createTextNode(
      c.what+': '+c.title+' — '+c.author+' ('+c.lic+')'));
  });
  return CREDITS.length;
}

/* ============================================================
   THE BIRD AS AN ASSET — REPLAT P5b (2026-09-04). THE RIG ADAPTER.
   ============================================================
   P5a landed a skinned cockatoo whose bones are anatomically NAMED, which was the good outcome.
   The name map is the easy half. This block is the hard half, and the measurement that shaped it is
   worth reading before touching anything here.

   THE BIRD'S ANIMATION IS 80 HAND-WRITTEN POSE WRITES, not animation clips: `H.rotation.x=-0.1`,
   `jaw.rotation.x=0.5`, `w.rotation.z=side*stroke`, onto plain Groups whose rest orientation is
   identity. A SKINNED BONE IS NOT A GROUP. It poses relative to a bind pose, and its local axes
   point wherever the rigger left them — so writing `.rotation.x` straight onto a bone throws the
   bind pose away and folds the bird inside out.

   AND NO AXIS-SWAP TABLE CAN FIX THAT, WHICH IS THE MEASUREMENT. Every key bone's rest frame was
   read out in world space (gauntlet log, session 26). Not one is axis-aligned:
       head   local X -> (-0.92, 0.28, 0.26)   Y -> ( 0.13, 0.87,-0.47)   Z -> (-0.36,-0.40,-0.84)
       jaw    local X -> (-0.95, 0.23, 0.23)   Y -> ( 0.11, 0.89,-0.44)   Z -> (-0.31,-0.39,-0.87)
       ulnaR  local X -> (-0.13, 0.36, 0.92)   Y -> ( 0.33,-0.86, 0.39)   Z -> ( 0.93, 0.35,-0.01)
   A per-bone {x:'z', y:'-x'} table is a lie about frames like these. The whole MODEL is yawed too:
   the wing bones sit on a lateral axis of (-0.71, 0.01, -0.70), about 45 degrees off world X, and
   the beak points (-0.86, 0.27, 0.24) from the head. Nothing here is aligned to anything.

   SO THE BINDING IS A CONJUGATION, NOT A REMAP. The pose writes are treated as a delta rotation in
   the BIRD'S OWN frame — right/up/forward, which is what the author of `H.rotation.x=-0.1` meant —
   and carried into each bone's local frame by its rest world orientation:

       delta_local = conj(restWorld) * delta_bird * restWorld
       bone.quaternion = restLocal * delta_local

   That needs no hand-tuned constants at all: `restWorld` is read off the loaded skeleton, so the
   same code binds a differently-rigged model without a table to re-derive. The bird frame itself is
   MEASURED from the model (lateral axis from the two humeri, up from world Y), not assumed.

   THE 80 WRITE SITES DO NOT CHANGE. Each handle stays an Object3D the game writes exactly as it
   does today; `rigCommit()` runs once at the end of the pose and maps handles onto bones. That is
   the whole point of the indirection — a retarget that edited 80 sites would be unreviewable.

   IT IS OFF BY DEFAULT AND THAT IS DELIBERATE. `KEABIRD='{"model":true}'` switches it on. The
   primitive bird is what every pinned vantage and every battery still sees, so this piece cannot
   move a baseline or break a mission while the look is still being judged. Eric flips it when the
   bird is right, and that is a one-line piece with its own proof. */
const KEABIRD={
  model:false,                       // OFF: the primitive bird ships until Eric judges the model
  /* THE SHIPPED FILE IS THE DERIVED ONE. rockatoo.glb is the unmodified upstream and stays in the
     tree so the derivation chain can be re-run; kea_base.glb is it with the crest gone; kea_bill.glb
     is that with the mandible reshaped. Each has its own ledger row and md5. */
  url:'models/kea_bill.glb',
  /* Posed scene box is 96.5 model units tall (the BIND pose spans 169.6 with the wings out — the
     wrong number to scale against, and both are recorded in LICENCES.md so nobody picks it twice).
     A kea stands about 0.5 m. Derived, not typed: `scale = standM / posedUnits`. */
  standM:0.50, posedUnits:96.5,
  /* THE JOINT MAP. Names read out of the file, not guessed — see LICENCES.md for the full skeleton.
     `crest` is listed because P5d has to remove 60 joints of it and something has to name them. */
  bones:{
    body :'cockatoo_Ilium_bone_02',
    chest:'cockatoo_Scapula_bone_03',
    neck :'cockatoo_Neck_bone_04',
    head :'cockatoo_Head_bone_06',
    jaw  :'cockatoo_LowerMandible_bone_039',
    upper:'cockatoo_UpperMandible_bone_07',
    tail :'cockatoo_Tail_bone_0106',
    humR :'cockatoo_Humerus_r_bone_070', ulnaR:'cockatoo_Ulna_r_bone_071', metaR:'cockatoo_Metacarpus_r_bone_072',
    humL :'cockatoo_Humerus_l_bone_073', ulnaL:'cockatoo_Ulna_l_bone_074', metaL:'cockatoo_Metacarpus_l_bone_075',
    /* THE LEFT LEG'S SUFFIXES ARE NOT THE MIRROR OF THE RIGHT'S, and guessing them cost a render:
       the right leg runs _076/_077 and the left runs _092/_00 — the exporter numbered them in
       creation order, not symmetrically. Every name here is READ OUT OF THE FILE. The bind reports
       exactly which key is missing when one is wrong, which is how this was caught in one shot. */
    femR :'cockatoo_Femur_R_bone_076',   tibR :'cockatoo_Tibia_R_bone_077',
    femL :'cockatoo_Femur_l_bone_092',   tibL :'cockatoo_Tibia_l_bone_00',
  },
  crestPrefix:'cockatoo_FeatherHead',   // 60 joints a kea does not have — removed in P5d
  /* ---- THE REST POSE COMES FROM THE RIGGER, NOT FROM THE BIND POSE — REPLAT P5d ----
     The model's BIND pose is wings-SPREAD, which is how rigs are usually bound and is the worst
     possible rest for a bird that spends the game perched: it photographed as a fairground ride.
     Its own 22 s clip contains the pose we want. Scanned by measuring metacarpus separation across
     the whole clip: it runs from 26.5 model units (folded) to 55.2 (spread), and the tightest frame
     is t=4.81 s - but the BILL gapes there, so span and gape were scored TOGETHER across 90
     samples (each normalised to its own range) and t=5.49 s wins: span 26.9 against a 26.5 minimum,
     for a gape of 0.659 against 0.806. The clip is evaluated ONCE there and the result captured as the
     rest every delta is measured from — the fold comes from the person who rigged the bird rather
     than from me guessing three joint angles.
     restT IS A KNOB because it is a look decision: sweep it and every perched frame changes. */
  restT:5.49,
  /* ---- THE KEA PALETTE — REPLAT P5d ----
     Read off kea_underwing_01, which is the one plate that shows body, underwing, flight feathers,
     bill and feet in a single frame under one light. A kea is NOT the olive-green a description
     suggests: the body is a warm olive-BROWN with dark feather scalloping, browner over the crown,
     and the famous colour is confined to the underwing — vivid orange-scarlet coverts over
     yellow-olive flight feathers with bold black barring.
     THE TEXTURE STILL DOES THE WORK. This is the P3 'paint mode' idiom: the model's own baseColor
     supplies feather detail as LUMINANCE and the palette supplies hue, so a black cockatoo's silky
     plumage becomes olive plumage rather than a flat olive decal. What it cannot supply is the
     kea's scalloped feather EDGING, which is a texture feature the source does not have. */
  plume:{
    /* ---- SAMPLED OFF THE PLATES BY HSV CLASS, WITH MATCH COUNTS — REPLAT P5e ----
       Not boxes drawn by eye: each region is a stated hue/saturation window searched over a stated
       area, and the count is reported so a class that matched almost nothing can be seen to have
       been absent. P5E.md's own warning, and it was earned — earlier eyeballed boxes caught feather
       instead of eye-ring.
         kea_head_01     eye-ring  #a37c29  hsv  41 0.75 0.64   (1981 px)  <- high-sat orange-gold
                         cere      #bda283  hsv  31 0.31 0.74   (3564 px)
                         bill      #565865  hsv 230 0.15 0.40
                         crown     #676865  hsv  86 0.03 0.41
         kea_posture_01  mantle    #857b5c  hsv  45 0.31 0.52   (9259 px, 68% of the box)
                         chest     #776c4a  hsv  45 0.38 0.46
                         crown     #8b8274  hsv  37 0.17 0.55
                         UPPERWING #506e41  hsv 100 0.41 0.43   (5321 px)  <- the green IS there
                         belly     #b2b18b  hsv  60 0.22 0.70   <- the bird's lightest tone
                         bill      #6a7586  hsv 216 0.21 0.53
       THE BIRD IS LIGHT. Plate values run 0.46 to 0.70 and centre near 0.52; the P5d2 render
       measured 0.21 on the chest and 0.39 on the lit mantle — roughly HALF. "Dark reads as
       sinister" was not a mood, it was a factor of two. Values below are the plate lifted ~1.15x
       into albedo, because the plate carries its own daylight. */
    body   :0x968C69,   // mantle/back: the plate's #857b5c lifted
    crown  :0x9C9384,   // crown/nape: lighter and greyer than the body, as both plates agree
    chest  :0x8E8461,   // breast: warmer and a touch darker than the mantle
    wing   :0x5C7F4A,   // FOLDED UPPERWING COVERTS: emerald green, hue 100 - absent until now
    covert :0xA82A10,   // underwing coverts: deep brick red, from kea_underwing_01's 121,33,12
    flight :0xA29260,   // flight-feather ground: yellow-olive, not gold
    bar    :0x2A2418,   // near-black barring across it
    bill   :0x79849A,   // slate blue-grey: the one region where B > G > R on both plates
    foot   :0x848D9C,   // grey, faintly blue - matched already, do not disturb
    barN   :0.28, barW:0.42,
    mean   :0.34,       // the source texture's mean luminance, MEASURED at load and overwritten
    /* THE SHADING WINDOW IS RAISED, which is most of the value fix. The texture is a BLACK
       cockatoo: its texels sit far below the mean, so a low floor drags the whole bird down however
       light the palette is. 0.62 was costing about a fifth of the value on lit surfaces and far
       more in shadow. */
    detail :0.40, shadeLo:0.80, shadeHi:1.16,
    jawShut:0.60,
    openLo :0.14, openHi:0.55,
    /* ---- THE EYE-RING: geometry, not texture ----
       P5E.md allows either route and names the condition: "add a small ring geometry if the texture
       route fights the UVs". It does — the source is one atlas for the whole animal and the eye's
       island cannot be located without unwrapping it, which is a texture piece. A ring is two small
       meshes parented to the head bone and it is exact.
       THE COLOUR IS THE MEASURED ONE: kea_head_01's ring classed at hsv 41 / 0.75 / 0.64 over 1981
       pixels — high-saturation orange-gold, and the plate's most distinctive single feature.
       THE PLACEMENT IS IN HEAD-BONE FRACTIONS, not model units, so it survives the bill warp and
       any future rescale. Swept against the plate. */
    eyeRing:0xD9A32E, eyeDark:0x1A1712,
    /* placed and sized in tenths of the head's own diagonal, and laterally as a fraction of its
       half-width so the ring lands ON the surface rather than beside it. Swept once against the
       plate: the eye sits a little forward of the head's centroid and a little above it. */
    eyeFwd :0.55, eyeUp:0.85, eyeLat:0.88, eyeR:0.42, eyeW:0.30,
  },
  /* THE WING HAS THREE SEGMENTS AND THE OLD RIG HAD ONE, so the single `w.rotation` drives the
     chain in these proportions: the humerus takes the stroke, the ulna and metacarpus follow it
     softened. The primitive bird's per-primary feather spread (`feathers[wi][i]`) has NO bone to
     drive — the model carries no per-primary bones — so `open` folds into the ulna/metacarpus
     extension instead. That is a real loss of articulation and it is written down rather than
     quietly dropped. */
  wingChain:[1.0, 0.55, 0.30],
  openChain:[0.0, 0.62, 0.85],
};
for(const [k,v] of Object.entries((typeof globalThis!=='undefined'&&globalThis.__KEA_BIRD__)||{})){
  if(!(k in KEABIRD))continue;
  if(typeof KEABIRD[k]==='object'&&KEABIRD[k]&&typeof v==='object'&&v)Object.assign(KEABIRD[k],v);
  else KEABIRD[k]=v;
}

const PAL={ // v6 (2026-08-26): colours lifted from the real country — Lindis tussock gold, greywacke, beech, hard alpine snow
  ground:0x96762E, ground2:0x7A6830, ground3:0x54772F, gravel:0x9B9891, tussock:0xC9992F, tussock2:0xA07C24,
  tarmac:0x63666C, road:0x4E5257, roadLine:0xE8E4D6, snow:0xF6FAFD, snowShade:0xC5D4E2,
  rock:0x8A8D8F, rockD:0x63676B, mtn:0x4E5E6E, mtnFar:0x7E96AC, mtnSnow:0xF2F7FB, beech:0x2F4A33,
  skyTop:0x1E63B0, skyMid:0x5E97C8, skyLow:0xC9DCE6, sun:0xFFF6E6, cloud:0xFBFCFD,
  bad:0xC03A30, keaBody:0x6C6B33, keaBelly:0x8A8748, keaWing:0x4E5426, keaSheen:0x3E5B4E, keaOrange:0xE84E12, keaBeak:0x413C35, keaEye:0x2A2118, keaCere:0xB09A4E,
  wood:0x7E6644, woodD:0x5E4B32, hut:0xB33A24, hutRoof:0x5C666E, glass:0x8FC3D4,
  skin:0xE0AC7E, skin2:0xC08A5C, hiviz:0xFF6A1A, ranger:0x24513B, red:0xC03A30,
  blue:0x3E6484, green:0x3F7A44, white:0xF2F1EC, dark:0x2E3238, yellow:0xE9B93A,
  cone:0xFF5A14, rubber:0x232629, metal:0xAEB3B9, paper:0xE9E1CB, cash:0x76A263,
  pie:0xC08F3E, sandwich:0xE5D49A, pav:0xF9F5EC, coral:0xD96A50, mint:0x4E7A55, mustard:0xC99A34, teal:0x27A6B2, plum:0x8A6478
};
const M={}; // shared materials (2026-08-28: detail-mapped by family via MAPKIND)
/* texture families: every big surface gets quiet grain (registered post-PAL, read inside mat) */
const TOONGRAD=(()=>{ // 4-tone ramp: deep shade -> lit
  const d=new Uint8Array([120,168,214,255]);
  const t=new THREE.DataTexture(d,4,1,THREE.RedFormat);
  t.minFilter=THREE.NearestFilter; t.magFilter=THREE.NearestFilter; t.needsUpdate=true; return t; })();
const STYLE={outlines:false}; // v4 'lawn' look; v6 realism (2026-08-26): NZ palette + IBL + scalloped kea
let KEASCALMAT=null;
let KEAWINGMAT=null;
function keaWing(){ // folded wing: smooth olive, lengthwise shafts, dark tip band, teal trailing edge
  if(HEADLESS)return mat(PAL.keaWing);
  if(KEAWINGMAT)return KEAWINGMAT;
  const cv=document.createElement('canvas'); cv.width=128; cv.height=64; const c=cv.getContext('2d');
  c.fillStyle='#565B26'; c.fillRect(0,0,128,64);
  c.strokeStyle='#474B1E'; c.lineWidth=1.4;
  for(let i=0;i<6;i++){ c.beginPath(); c.moveTo(0,7+i*10); c.lineTo(128,9+i*10); c.stroke(); }
  c.fillStyle='#2E3216'; c.fillRect(112,0,16,64); // dark tip
  c.fillStyle='#3E6B5A'; c.fillRect(0,58,128,6);  // teal trailing edge
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace;
  KEAWINGMAT=new THREE.MeshStandardMaterial({map:t,roughness:0.85,metalness:0,envMapIntensity:0.3});
  return KEAWINGMAT;
}
function loft(st,V){ // st: [{z,y,rx,ry}] rings tail->front; outward-wound, both ends capped
  V=V||14; const pos=[],uv=[],idx=[];
  for(let i=0;i<st.length;i++){ const s=st[i];
    for(let j=0;j<=V;j++){ const a=j/V*Math.PI*2;
      pos.push(Math.cos(a)*s.rx, s.y+Math.sin(a)*s.ry, s.z);
      uv.push(j/V*5.0, i/(st.length-1)*7.0); } }
  const W=V+1;
  for(let i=0;i<st.length-1;i++)for(let j=0;j<V;j++){
    const a=i*W+j,b=a+1,c=a+W,d=c+1; idx.push(a,b,c, b,d,c); }
  const s0=st[0], sN=st[st.length-1];
  const c0=pos.length/3; pos.push(0,s0.y,s0.z); uv.push(0.5,0);
  const cN=pos.length/3; pos.push(0,sN.y,sN.z); uv.push(0.5,7.0);
  for(let j=0;j<V;j++){ idx.push(c0, j+1, j);                       // tail cap faces -z
    const base=(st.length-1)*W; idx.push(cN, base+j, base+j+1); }   // front cap faces +z
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function keaScal(){ // every feather edged in dark olive — fine, dense, field-guide scale
  if(HEADLESS)return mat(PAL.keaBody);
  if(KEASCALMAT)return KEASCALMAT;
  const cv=document.createElement('canvas'); cv.width=cv.height=256; const c=cv.getContext('2d');
  c.fillStyle='#5C5B2A'; c.fillRect(0,0,256,256);
  let sd=7; const rnd01=()=>{ sd=(sd*16807)%2147483647; return sd/2147483647; }; // fixed-seed mottle
  for(let row=0;row<17;row++){ const y=row*16+((row%2)*8);
    for(let i=-1;i<17;i++){ const x=i*16+((row%2)*8);
      const j=(rnd01()-0.5)*14, base=[[99,97,47],[94,93,44],[87,86,38]][row%3];
      c.fillStyle='rgb('+(base[0]+j|0)+','+(base[1]+j|0)+','+(base[2]+j*0.6|0)+')';
      const rx=8.5+(rnd01()-0.5)*1.2, ry=7+(rnd01()-0.5)*0.8;
      c.beginPath(); c.ellipse(x+8,y+9,rx,ry,0,0,Math.PI*2); c.fill();
      c.strokeStyle='#2A2D14'; c.lineWidth=1.5; c.beginPath(); c.arc(x+8,y+9,7.6,0.12*Math.PI,0.88*Math.PI); c.stroke();
      c.strokeStyle='rgba(42,45,20,0.55)'; c.lineWidth=0.8; c.beginPath(); c.moveTo(x+8,y+3.4); c.lineTo(x+8,y+11.5); c.stroke(); // feather shaft
    } }
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping;
  KEASCALMAT=new THREE.MeshStandardMaterial({map:t,roughness:0.85,metalness:0,envMapIntensity:0.3,side:THREE.DoubleSide});
  return KEASCALMAT;
}
const DTEX={};
/* REPLAT P3 DELETED THREE KINDS FROM THIS FUNCTION: 'asphalt', 'corrugate' and 'snowtex'. Their
   families are scanned now, nothing registers them, and a dead branch in a texture builder is a
   trap — the next person to add a road would have found a plausible-looking asphalt kind sitting
   here and used it. What is left is the four families REPLAT P3 does NOT name: wood grain,
   greywacke speckle, brushed alloy, painted panel and woven fabric. */
function detailTex(kind){ // subtle multiply-maps: texture without killing the toon read
  if(HEADLESS)return null; if(DTEX[kind])return DTEX[kind];
  const cv=document.createElement('canvas'); cv.width=cv.height=128; const c=cv.getContext('2d');
  c.fillStyle='#FFFFFF'; c.fillRect(0,0,128,128);
  let sd=kind.length*37+11; const r=()=>{sd=(sd*16807)%2147483647; return sd/2147483647;};
  if(kind==='grain'){ for(let i=0;i<44;i++){ c.strokeStyle='rgba(58,40,16,'+(0.05+r()*0.07).toFixed(3)+')'; c.lineWidth=1+r()*1.4;
      const y=r()*128; c.beginPath(); c.moveTo(0,y); c.bezierCurveTo(42,y+r()*8-4,86,y+r()*8-4,128,y+r()*6-3); c.stroke(); }
    for(let i=0;i<5;i++){ c.strokeStyle='rgba(58,40,16,0.10)'; c.beginPath(); const x=r()*128,y=r()*128; c.ellipse(x,y,2+r()*3,4+r()*5,0,0,6.3); c.stroke(); } }
  else if(kind==='speckle'){ for(let i=0;i<420;i++){ const a=r(); c.fillStyle=a<0.5?'rgba(30,32,34,'+(0.06+r()*0.09).toFixed(3)+')':'rgba(255,255,255,'+(0.05+r()*0.06).toFixed(3)+')';
      const q=1+r()*3; c.beginPath(); c.arc(r()*128,r()*128,q,0,6.3); c.fill(); } }
  else if(kind==='brushed'){ for(let x=0;x<128;x+=2){ c.strokeStyle='rgba(40,44,50,'+(0.03+r()*0.05).toFixed(3)+')'; c.beginPath(); c.moveTo(x+r(),0); c.lineTo(x+r(),128); c.stroke(); } }
  else if(kind==='weave'){ for(let i=-128;i<128;i+=5){ c.strokeStyle='rgba(30,26,20,0.05)'; c.beginPath(); c.moveTo(i,0); c.lineTo(i+128,128); c.stroke();
      c.strokeStyle='rgba(255,255,255,0.04)'; c.beginPath(); c.moveTo(i+128,0); c.lineTo(i,128); c.stroke(); } }
  else if(kind==='panel'){ for(let i=0;i<4;i++){ const y=18+i*30+r()*8; c.strokeStyle='rgba(60,66,74,0.10)'; c.lineWidth=1.4;
      c.beginPath(); c.moveTo(0,y); c.lineTo(128,y); c.stroke(); }
    for(let i=0;i<260;i++){ c.fillStyle='rgba(255,255,255,'+(0.02+r()*0.03).toFixed(3)+')'; c.fillRect(r()*128,r()*128,1.5,1.5); } }
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(2,2);
  return DTEX[kind]=t;
}
const MAPKIND={};
function _mk(c,k){ MAPKIND[c]=k; }
_mk(PAL.wood,'grain'); _mk(PAL.woodD,'grain'); _mk(0x9C7B52,'grain'); _mk(0x7E6644,'grain'); _mk(0x6E5334,'grain');
_mk(PAL.rock,'speckle'); _mk(PAL.rockD,'speckle'); _mk(0x7A7468,'speckle');
_mk(PAL.metal,'brushed');
_mk(PAL.white,'panel'); _mk(0x596068,'panel');
_mk(PAL.ranger,'weave'); _mk(PAL.hiviz,'weave'); _mk(0xE8946A,'weave'); _mk(0xD3805A,'weave'); _mk(0x2F6E5E,'weave'); _mk(0x3E8272,'weave');

/* ---------- REPLAT P3: WHICH PALETTE COLOUR BELONGS TO WHICH SCANNED FAMILY ----------
   The registry above says "this colour gets that procedural canvas"; this one says "this colour IS
   that scanned material", and the two are mutually exclusive by construction — a battery asserts
   no colour appears in both, because a colour in both would silently get whichever branch mat()
   happened to test first.

   FIVE ENTRIES WERE MOVED OUT OF _mk RATHER THAN ADDED ALONGSIDE IT, and that is the "no
   procedural canvas left on the swapped families" half of P3's proof. Three whole detailTex kinds
   are now gone from the file — 'asphalt', 'corrugate' and 'snowtex' — because nothing claims them
   any more. 'grain', 'speckle', 'brushed', 'panel' and 'weave' stay: wood trim, greywacke rock,
   brushed alloy, painted panel and fabric are not families REPLAT P3 names, and swapping them on
   the way past would be four unbriefed art decisions riding along with seven briefed ones.

   THE COLOUR IS THE KEY, AND IT IS ONLY SAFE BECAUSE IT WAS CHECKED. `mat()` caches by colour, so
   registering a family against a hex claims EVERY surface painted that hex. Each of these was
   grepped before it was registered:
     PAL.hut       ONE site, the hut wall. Weatherboard claims it and nothing else.
     PAL.tarmac    the carpark slab and its apron.     PAL.road    the road deck.
     PAL.gravel + 0x9AA0A6 + 0x8E8B84   the 26 carpark grit pebbles, the 26 loose greywacke stones
                   on the country, and the hut step stone. EVERY grey in a scatter lands in ONE
                   family, and the third entry is here because the first pass MISSED IT and the
                   battery found it. The grit pebbles alternate 0x9AA0A6/PAL.gravel and the loose
                   stones alternate 0x8E8B84/PAL.gravel — so registering PAL.gravel alone put half
                   of the loose scatter on a scanned set and left the other half on the procedural
                   speckle canvas, which is EXACTLY the defect the grit-pebble assertion in
                   harness-everything was written to catch, reappearing in a different scatter one
                   registry later. Both scatters are uniform again.
                   HOW IT WAS MISSED IS WORTH RECORDING: PAL.gravel was grepped and came back with
                   two sites, because three of its five call sites write the raw hex 0x9B9891
                   instead of the palette name. Grep the HEX as well as the name.
     PAL.hutRoof + 0x4A545C  the hut gable, the veranda eave, the shelter, the tow shed, the lodge
                   roof, and the ridge battens.
     0x8C8F93      the hut chimney AND the ski lodge chimney. The masonry in the game. ref_bow_00
                   is a brick HOUSE and these are two brick chimneys; the gap between those is
                   geometry, which is P6, and the family is sourced, licensed, tiled and proven here
                   so that P6 opens with it working rather than discovering on the day it has no
                   brick.
     0xA9A7A2      the ski tow's top anchor block, and the reason this colour exists at all: it
                   used to be PAL.gravel, which made P3 render a poured footing in driveway gravel.
                   A hex of its own is what stops one family's colour speaking for another object's
                   material - which is this table's whole failure mode, twice over now.
     PAL.snow + PAL.snowShade   every snow surface in both biomes.
   THE TERRAIN IS NOT IN THIS TABLE. Both ground planes build their own material (vertex colours),
   so the grass family is attached to them directly in buildCarpark/buildSkifield. */
const MATFAM={};
function _mf(c,f){ MATFAM[c]=f; }
_mf(PAL.hut,'weatherboard');
_mf(PAL.tarmac,'asphalt');   _mf(PAL.road,'asphalt');
_mf(PAL.gravel,'gravel');    _mf(0x9AA0A6,'gravel');    _mf(0x8E8B84,'gravel');
_mf(PAL.hutRoof,'corrugate');_mf(0x4A545C,'corrugate');
_mf(0x8C8F93,'brick');
_mf(0xA9A7A2,'concrete');
_mf(PAL.snow,'snow');        _mf(PAL.snowShade,'snow');

/* THE FAMILY RUNTIME. One record per family: the three texture objects once they land, and every
   material that belongs to it. Both halves are needed because materials are built lazily during
   buildWorld and the textures arrive from the network AFTER that — and because travel builds the
   ski field long after the first install, so a material created LATER must dress itself
   immediately. matDress is therefore called from both directions and is idempotent. */
const MATSET={};
function matFam(f){ return MATSET[f]||(MATSET[f]={maps:null,mats:[],failed:false}); }
const _lumOf=c=>0.2126*c.r+0.7152*c.g+0.0722*c.b;
function matDress(m){
  const fam=m.userData.matFamily, F=MATS.families[fam], S=MATSET[fam], base=m.userData.matBase;
  if(!F||!base)return m;
  const U=m.userData.keaU;
  if(!S||!S.maps){                      // pre-install, or a fetch that never landed: the old look
    m.color.copy(base); m.roughness=m.userData.matRough;
    if(U){ U.uKeaMacroAmt.value=0; U.uKeaMacroRough.value=0; }
    m.map=null; m.normalMap=null; m.roughnessMap=null; m.needsUpdate=true; return m; }
  if(U){ U.uKeaMacroAmt.value=MATS.breakup.macroAmount; U.uKeaMacroRough.value=MATS.breakup.macroRough;
    U.uKeaSharp.value=MATS.breakup.blendSharp; U.uKeaVar.value=MATS.breakup.varRestore;
    const mn=S.mean;                       // measured off the real images by src/materials.mjs
    if(mn){ U.uKeaMeanA.value.set(mn.albedo[0],mn.albedo[1],mn.albedo[2]); U.uKeaMeanR.value=mn.rough; } }
  if(F.mode==='scan'){
    /* luminance-neutral tint: the authored hex divided by its own luminance pushes hue without
       touching exposure, then `tint` lerps white -> that hue. See the recipe note. */
    const L=_lumOf(base)||1, hue=base.clone().multiplyScalar(1/L);
    m.color.setRGB(1,1,1).lerp(hue,F.tint===undefined?0:F.tint);
  } else {
    m.color.copy(base).multiplyScalar(1/MATS.paintMean);
  }
  m.map=S.maps.map; m.normalMap=S.maps.normalMap; m.roughnessMap=S.maps.roughnessMap;
  m.normalScale.set(MATS.normalScale,MATS.normalScale);
  m.roughness=MATS.roughScale;
  m.needsUpdate=true; return m;
}

/* ---------- REPLAT P3: UVs IN METRES ----------
   The one job here is that a texel is the same size in the world on every surface. Each geometry
   kind knows its own UV convention, so each gets its own branch and every branch is asserted
   headless in harness-everything.js — this is pure arithmetic on a BufferAttribute and runs in
   node exactly as it runs in a browser, which is the only reason texel density can be LAW here
   rather than an eyeball.

   IT IS DRIVEN OFF geometry.parameters, NOT off the caller's arguments, so a geometry that was
   built with non-default segments cannot be silently mis-scaled: the branch reads the same numbers
   three built the UVs from, and bails if it does not recognise the type. */
function uvMetres(g){
  const uv=g.attributes&&g.attributes.uv, p=g.parameters;
  if(!uv||!p)return g;
  /* IDEMPOTENT, AND THAT IS LOAD-BEARING RATHER THAN TIDY. Two things call this: the geometry
     helpers, eagerly, and the post-build sweep below, which exists because meshes built with
     `new THREE.Mesh(new THREE.BoxGeometry(...))` never pass through a helper at all. A geometry can
     therefore arrive here twice, and scaling metre UVs by metres again would square the tile count
     — a silent, plausible-looking error, and exactly the kind that is only ever found in a
     photograph. The mark is on the GEOMETRY because that is what gets shared: `rl.clone()` in
     buildHut hands one BoxGeometry to two roof panels.
     AND IT IS DEFENCE IN DEPTH RATHER THAN THE LOAD-BEARING GUARD TODAY, which is worth saying
     out loud because a sabotage proved it: deleting this line alone leaves the battery GREEN,
     because matUVSweep checks the same mark before it calls and so nothing reaches here twice.
     Deleting BOTH goes red with the squaring visible in the numbers — the 240 m terrain reports a
     57600 m UV span. Kept anyway: the sweep is not the only future caller, and a guard that costs
     one property read is the cheapest possible insurance against an error whose signature is a
     texture that renders perfectly at the wrong scale. */
  if(g.userData.uvMetres)return g;
  if(g.type==='BoxGeometry'){
    /* three lays a box down as six planes in a FIXED order — px, nx, py, ny, pz, nz — and each
       plane's u runs along the first extent it was handed and v along the second. So the u/v
       extents per face are (d,h) (d,h) (w,d) (w,d) (w,h) (w,h), and nothing here is guesswork:
       the order is buildPlane's call order in BoxGeometry and the assertion reads it back. */
    const per=(p.widthSegments+1)*(p.heightSegments+1);
    if(p.widthSegments!==1||p.heightSegments!==1||p.depthSegments!==1)return g;
    const ext=[[p.depth,p.height],[p.depth,p.height],[p.width,p.depth],
               [p.width,p.depth],[p.width,p.height],[p.width,p.height]];
    if(uv.count!==24)return g;
    for(let f=0;f<6;f++)for(let i=0;i<4;i++){ const k=f*4+i;
      uv.setXY(k, uv.getX(k)*ext[f][0], uv.getY(k)*ext[f][1]); }
  } else if(g.type==='PlaneGeometry'){
    for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)*p.width, uv.getY(i)*p.height);
  } else if(g.type==='CylinderGeometry'){
    /* torso first, then the top cap, then the bottom cap. The torso's u goes once around, so it
       spans the MEAN circumference (these are truncated cones as often as cylinders); its v spans
       the height. A cap's uv is a 0..1 disc, so it spans that end's diameter. */
    const rs=p.radialSegments, hs=p.heightSegments;
    const torso=(rs+1)*(hs+1), circ=Math.PI*(p.radiusTop+p.radiusBottom);
    for(let i=0;i<torso&&i<uv.count;i++) uv.setXY(i, uv.getX(i)*circ, uv.getY(i)*p.height);
    let k=torso;
    for(const r of [p.radiusTop,p.radiusBottom]){
      if(p.openEnded||r<=0)continue;
      const n=2*rs+1;
      for(let i=0;i<n&&k<uv.count;i++,k++) uv.setXY(k, uv.getX(k)*2*r, uv.getY(k)*2*r); }
  } else if(g.type==='SphereGeometry'||g.type==='DodecahedronGeometry'||
            g.type==='IcosahedronGeometry'||g.type==='PolyhedronGeometry'){
    /* equirectangular by construction — u once around the equator, v pole to pole — and a
       three polyhedron uses the same azimuth/inclination mapping, which is why the loose stones
       belong in this branch rather than being left at one whole gravel tile per rock face. */
    for(let i=0;i<uv.count;i++) uv.setXY(i, uv.getX(i)*2*Math.PI*p.radius, uv.getY(i)*Math.PI*p.radius);
  } else return g;
  g.userData.uvMetres=true; uv.needsUpdate=true; return g;
}

/* THE GATE ON ALL OF IT. A mesh gets metre UVs only if its material belongs to a scanned family;
   nothing else in the game is touched, so a surface P3 was not asked about cannot move. Called
   from box/cyl/sph AFTER the material is resolved and BEFORE the mesh is parented. */
function matUV(m){
  if(!m||!m.material||!m.material.userData||!m.material.userData.matFamily)return m;
  uvMetres(m.geometry); return m;
}
/* AND THE SWEEP THAT MAKES IT COMPLETE RATHER THAN CONSCIENTIOUS. Putting matUV in box/cyl/sph
   covers the overwhelming majority of the world and MISSED THE HUT ROOF, because the two gable
   panels and their twelve ridge battens are built with `new THREE.Mesh(new THREE.BoxGeometry(...))`
   directly — as are a handful of others. Found by the battery, which measured 7 family boxes where
   it should have found more and printed a 1.000x1.000 span on a 7.8 m roof panel.
   A "remember to call the helper" rule is the wrong shape of fix for that: the next direct
   construction would miss it again, and the failure renders perfectly and looks like a texture
   choice. So the sweep walks what was actually BUILT. The eager calls stay, because a mesh made
   after buildWorld — spawned loot, traffic — is past the sweep and still needs its metres. */
function matUVSweep(){
  let n=0;
  G.scene.traverse(o=>{ if(!o.isMesh||!o.material||!o.material.userData)return;
    if(!o.material.userData.matFamily||!o.geometry)return;
    if(o.geometry.userData.uvMetres)return;
    if(uvMetres(o.geometry).userData.uvMetres)n++; });
  return n;
}

/* THE TWO TERRAIN PLANES DO NOT GO THROUGH mat(). They are vertex-coloured, one per biome, and
   they must not share a cached material with anything else — so they enrol in a family directly.
   WHICH FAMILY IS A FACT ABOUT THE MAP, not a default: the carpark's ground is the Lindis tussock
   blend, so it takes the grass scan; the ski field's is a snowfield, so it takes snow. Both are
   'paint' mode, and the recipe note says why at length — the plane is a vertex-colour BLEND of
   three or four surfaces and no single albedo can be four materials at once, so what it takes from
   the scan is relief and roughness over the palette it already had. */
/* ---------- REPLAT P3b: THE BREAKUP SHADER ----------
   Injected into MeshStandardMaterial by onBeforeCompile for the four ISOTROPIC ground families.
   It lives in game.mjs, as a string, because the recipe belongs where the batteries can read it -
   the same argument that keeps the SKY and MATS blocks here - and because a GLSL string adds no
   import to the file whose single import the specimen loader asserts.

   THE HASH IS SINE-FREE ON PURPOSE. The usual fract(sin(dot(p,k))*43758.5) is precision-dependent
   across GPU vendors, and this project photographs its own output and diffs it against a pinned
   baseline: a hash that resolves differently on a different driver would make the ground itself a
   source of capture drift. This is Dave Hoskins' integer-style hash, which is exact float
   arithmetic and gives the same answer everywhere. */
const MATBREAK_GLSL=`
float keaH1(vec2 p){
  vec3 q=fract(vec3(p.xyx)*0.1031);
  q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
vec2 keaH2(vec2 p){
  vec3 q=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  q+=dot(q,q.yzx+33.33);
  return fract((q.xx+q.yz)*q.zy);
}
float keaVal(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float a=keaH1(i), b=keaH1(i+vec2(1.0,0.0)), c=keaH1(i+vec2(0.0,1.0)), d=keaH1(i+vec2(1.0,1.0));
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
/* two octaves, weighted so the mean stays near 0.5 - the macro layer must not shift exposure */
float keaMacroField(vec2 pm){
  return keaVal(pm)*0.68 + keaVal(pm*2.31+7.3)*0.32;
}
/* the triangle lattice of Heitz and Neyret: the three nearest lattice vertices and their
   barycentric weights, which sum to exactly 1 */
void keaLattice(vec2 p, out vec3 w, out vec2 v1, out vec2 v2, out vec2 v3){
  vec2 sk=vec2(p.x - p.y*0.57735027, p.y*1.15470054);
  vec2 b=floor(sk);
  vec3 t=vec3(fract(sk),0.0);
  t.z=1.0-t.x-t.y;
  if(t.z>0.0){ w=vec3(t.z,t.y,t.x); v1=b;                v2=b+vec2(0.0,1.0); v3=b+vec2(1.0,0.0); }
  else       { w=vec3(-t.z,1.0-t.y,1.0-t.x); v1=b+vec2(1.0,1.0); v2=b+vec2(1.0,0.0); v3=b+vec2(0.0,1.0); }
  /* sharpen and renormalise: most of the surface becomes one tap at full contrast */
  w=pow(w,vec3(uKeaSharp));
  w/=max(1e-6,w.x+w.y+w.z);
}
/* one tap: this vertex's rotation and offset, and the rotation matrix so the caller can rotate
   the derivatives and the tangent-space normal by the same amount */
vec2 keaTap(vec2 uv, vec2 cell, out mat2 R){
  vec2 h=keaH2(cell);
  float a=h.x*6.28318531, c=cos(a), sn=sin(a);
  R=mat2(c,-sn,sn,c);
  return R*uv + h*37.19;
}
struct KeaTiles { vec3 w; vec2 u1; vec2 u2; vec2 u3; mat2 R1; mat2 R2; mat2 R3; vec2 dx; vec2 dy; };
KeaTiles keaTiles(vec2 uv){
  KeaTiles k;
  k.dx=dFdx(uv); k.dy=dFdy(uv);
  vec2 v1,v2,v3;
  keaLattice(uv*uKeaPatch, k.w, v1, v2, v3);
  k.u1=keaTap(uv,v1,k.R1); k.u2=keaTap(uv,v2,k.R2); k.u3=keaTap(uv,v3,k.R3);
  return k;
}
/* the variance the blend removed, put back: see the blendSharp note in MATS.breakup */
vec4 keaBlend(sampler2D tex, KeaTiles k, vec4 mean){
  vec4 s=k.w.x*textureGrad(tex,k.u1,k.R1*k.dx,k.R1*k.dy)
        +k.w.y*textureGrad(tex,k.u2,k.R2*k.dx,k.R2*k.dy)
        +k.w.z*textureGrad(tex,k.u3,k.R3*k.dx,k.R3*k.dy);
  return mean + (s-mean)*mix(1.0,inversesqrt(dot(k.w,k.w)),uKeaVar);
}
/* THE NORMAL NEEDS ITS OWN BLEND, because a tangent-space normal is a GRADIENT IN TEXTURE SPACE.
   Sampling at R*uv means a gradient g' read from the texture corresponds to R^T*g' in the
   surface's own uv frame, so each tap's xy must be rotated BACK by its own rotation before the
   three are combined. Skip that and the relief lights as though every patch were lit from its own
   private direction - which reads as "noisy" rather than as "wrong", and is the reason this is
   spelled out here instead of being left to be rediscovered. */
vec3 keaBlendN(sampler2D tex, KeaTiles k){
  vec3 s1=textureGrad(tex,k.u1,k.R1*k.dx,k.R1*k.dy).xyz*2.0-1.0;
  vec3 s2=textureGrad(tex,k.u2,k.R2*k.dx,k.R2*k.dy).xyz*2.0-1.0;
  vec3 s3=textureGrad(tex,k.u3,k.R3*k.dx,k.R3*k.dy).xyz*2.0-1.0;
  vec3 n = k.w.x*vec3(s1.xy*k.R1, s1.z)
         + k.w.y*vec3(s2.xy*k.R2, s2.z)
         + k.w.z*vec3(s3.xy*k.R3, s3.z);
  /* A TANGENT-SPACE NORMAL'S xy HAS A MEAN OF EXACTLY ZERO, so the same variance restore applies
     with no measured mean at all — and it is needed for the same reason: averaging three normals
     shortens the slope and reads as flattened relief. z is left alone and the result renormalised,
     so nothing here can produce a normal that is not a unit vector. */
  n.xy *= mix(1.0,inversesqrt(dot(k.w,k.w)),uKeaVar);
  return n;
}
`;

/* WHICH THREE CHUNKS GET REWRITTEN, AND THE EXACT LINE IN EACH.
   THE FIRST CUT OF THIS SHIPPED AS A SILENT NO-OP and that is the reason this table exists.
   onBeforeCompile hands you the shader with its `#include <...>` directives STILL UNRESOLVED —
   three expands them afterwards — so surgery against the expanded chunk text finds nothing,
   changes nothing, and throws nothing. The frame came back looking almost right, the uniforms all
   read correctly, and a runtime A/B of breakup-on against breakup-off returned BYTE-IDENTICAL
   screenshots. That last test is the only reason it was caught.
   So the includes are now expanded HERE, from THREE.ShaderChunk itself rather than from a copy,
   and every substring this file expects is CHECKED AT MODULE SCOPE, once, against the three that
   is actually installed. If an upgrade renames a chunk or rewrites a line, MATBREAK_OK goes false
   with a reason, the breakup does not install, G.mats says so, and a battery goes red in the gate.
   A look feature must not be able to take the game down — and it must not be able to quietly
   stop working either, which is the failure this one already had once. */
const MATBREAK_PATCH=[
  ['map_fragment',[
    ['vec4 sampledDiffuseColor = texture2D( map, vMapUv );',
     'KEA_G = keaTiles( vMapUv );\n\tvec4 sampledDiffuseColor = clamp( keaBlend( map, KEA_G, '+
     'vec4(uKeaMeanA,1.0) ), 0.0, 1.0 );\n'+
     '\tsampledDiffuseColor.rgb *= 1.0 + (keaMacroField(vKeaWorld.xz*uKeaMacro)-0.5)*2.0*uKeaMacroAmt;']]],
  ['roughnessmap_fragment',[
    ['vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );',
     'vec4 texelRoughness = clamp( keaBlend( roughnessMap, KEA_G, vec4(uKeaMeanR) ), 0.0, 1.0 );'],
    ['roughnessFactor *= texelRoughness.g;',
     'roughnessFactor *= texelRoughness.g;\n\troughnessFactor *= 1.0 + '+
     '(keaMacroField(vKeaWorld.xz*uKeaMacro+11.7)-0.5)*2.0*uKeaMacroRough;\n'+
     '\troughnessFactor = clamp(roughnessFactor,0.04,1.0);']]],
  ['normal_fragment_maps',[
    ['vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
     'vec3 mapN = keaBlendN( normalMap, KEA_G );']]],
];
/* REPLAT P4e's SEAM IS SEPARATE, and deliberately so: it is installed on the GRASS family alone,
   where the other three run on every isotropic ground family. It goes in AFTER the vertex colours
   rather than in map_fragment, because the terrain's colour is a vertex-colour BLEND over the scan
   and the thing that has to match the blade field is the FINAL base colour, not the albedo texture
   underneath it. Validated against the installed three exactly like the other three are. */
/* ---- REPLAT P4e: THE GROUND IS THE GRASS ----
   ITS OWN STRING, NOT PART OF MATBREAK_GLSL, AND THE FIRST CUT LEARNED THAT THE HARD WAY. The
   function was put in the shared block while its UNIFORMS were declared only for the grass family,
   so gravel, asphalt and snow compiled a function referencing identifiers that did not exist:
   `ERROR: 'uFarSoft' : undeclared identifier`. Every isotropic ground material failed to link.
   AND THE GAME LOOKED FINE, WHICH IS THE REAL LESSON. MATBREAK_OK validates that the patch TARGETS
   still exist; it cannot know whether the result compiles. The frame came back, the batteries were
   green, G.mats said breakup:true, and the measured effect of the whole feature was 1 grey level —
   which read as "the fix did not work" rather than as "the shader is dead". Found by probing the
   live WebGL program for its link status, which is now what matShaderState does every boot.
   Declaration and uniforms travel together, always.
   keaFarFbm IS CHARACTER-FOR-CHARACTER THE BLADE SHADER'S keaFbm. Same two octaves, same 0.62/0.38
   weights, same 2.17 lacunarity, same 7.3 offset, off the same position hash — so the ground's
   grass-versus-bare drift is not a lookalike of the field's, it IS the field's, continued past the
   last blade. A battery asserts the two expressions are identical, because "a similar noise field"
   is exactly how a seam gets quietly reintroduced by a later tune of one of them. */
const MATFAR_GLSL=`
uniform vec3 uFarGrassMul, uFarSoilMul;
uniform float uFarAmt, uFarBare, uFarSoft, uFarBareScale, uFarMoundK, uFarMoundAmt, uFarMoundFade;
float keaFarFbm(vec2 p){ return keaVal(p)*0.62+keaVal(p*2.17+7.3)*0.38; }
vec3 keaFarGrass(vec3 c, vec2 w, float dist){
  /* where the field would grow, and where it would leave the ground open */
  float alive=smoothstep(uFarBare-uFarSoft,uFarBare+uFarSoft,keaFarFbm(w*uFarBareScale));
  vec3 o=mix(c*uFarSoilMul, c*uFarGrassMul, alive);
  /* the mound-scale mottle, faded out with distance so sub-pixel noise cannot shimmer */
  float nearK=1.0-smoothstep(uFarMoundFade*0.45,uFarMoundFade,dist);
  if(nearK>0.001){
    float mound=keaFarFbm(w*uFarMoundK);
    o*=1.0+(mound-0.5)*2.0*uFarMoundAmt*nearK;
  }
  return mix(c,o,uFarAmt);
}
`;
const MATFAR_PATCH=[
  ['color_fragment',[
    ['\tdiffuseColor *= vColor;',
     '\tdiffuseColor *= vColor;\n\tdiffuseColor.rgb = keaFarGrass( diffuseColor.rgb, '+
     'vKeaWorld.xz, length(vKeaWorld - cameraPosition) );']]],
];
const MATBREAK_OK=(()=>{
  const C=THREE.ShaderChunk||{};
  for(const [name,pairs] of MATBREAK_PATCH.concat(MATFAR_PATCH)){
    if(typeof C[name]!=='string')return 'three has no ShaderChunk.'+name;
    for(const [from] of pairs)
      if(C[name].indexOf(from)<0)return 'ShaderChunk.'+name+' no longer contains: '+from;
  }
  return true;
})();
if(MATBREAK_OK!==true&&typeof console!=='undefined')
  console.error('materials: the tiling breakup did not install — '+MATBREAK_OK);

function matChunk(src,name,pairs){
  const inc='#include <'+name+'>';
  let body=THREE.ShaderChunk[name];
  for(const [from,to] of pairs) body=body.split(from).join(to);
  return src.split(inc).join(body);
}

/* THE INJECTION. Installed at material CREATION rather than when the textures land, so the family
   compiles ONCE with its final shader: the amounts are uniforms starting at zero, so an
   undressed material is pixel-for-pixel the game it was, and matDress only writes numbers.
   THE UNIFORM OBJECTS ARE KEPT ON THE MATERIAL and the SAME objects are handed to the shader, so a
   later write reaches the GPU. Assigning fresh objects into sh.uniforms is the classic
   onBeforeCompile mistake - it works until the first time you try to change a value. */
/* REPLAT P4e. `far` is true only for the grass-family terrain: the code is INJECTED rather than
   merely disabled elsewhere, so gravel, asphalt and snow pay nothing for a term they do not use. */
function matBreakup(m,F,far){
  if(MATBREAK_OK!==true)return m;
  const B=MATS.breakup, FG=GRASS.far;
  const V3=a=>new THREE.Vector3(a[0],a[1],a[2]);
  const U=m.userData.keaU={
    uKeaPatch:{value:F.tileM/B.patchM},
    uKeaMacro:{value:1/B.macroM},
    uKeaSharp:{value:B.blendSharp},
    uKeaVar:{value:B.varRestore},
    /* the MEASURED means, written by matDress from what materials.mjs read off the actual images.
       They start at a neutral mid-grey so a material that somehow renders before the measurement
       lands is merely un-restored, never wrong. */
    uKeaMeanA:{value:new THREE.Vector3(0.5,0.5,0.5)},
    uKeaMeanR:{value:0.5},
    uKeaMacroAmt:{value:0},          // matDress lifts these when the maps arrive
    uKeaMacroRough:{value:0},
  };
  /* THE FAR-GRASS UNIFORMS COME OFF THE SAME BLOCKS THE BLADES READ, never off a second copy. The
     bare threshold and its softness are the CARPARK BIOME'S, because that is the field this ground
     lies under; taking them from anywhere else is how the ground and the blades drift apart. */
  if(far){ const B4=GRASS.biomes.carpark;
    Object.assign(U,{
      /* the gain is folded in HERE, once, so the shader sees one multiplier and the recipe keeps
         the measured direction and the calibrated distance as two separate readable numbers */
      uFarGrassMul:{value:V3(FG.grassMul.map(v=>1+(v-1)*FG.gain))},
      uFarSoilMul:{value:V3(FG.soilMul.map(v=>1+(v-1)*FG.gain))},
      uFarAmt:{value:FG.amount},
      uFarBare:{value:B4.bare}, uFarSoft:{value:GRASS.bareSoft},
      uFarBareScale:{value:GRASS.bareScale},
      uFarMoundK:{value:1/B4.clumpM}, uFarMoundAmt:{value:FG.moundAmt},
      uFarMoundFade:{value:FG.moundFadeM},
    }); }
  m.onBeforeCompile=(sh)=>{
    Object.assign(sh.uniforms,U);
    /* WORLD POSITION, NOT MODEL POSITION, and it matters. The macro field has to be continuous
       ACROSS meshes: the carpark slab, its entrance apron and the road are three separate boxes
       lying in the same plane, and a wear field that restarted at each mesh origin would draw a
       visible join exactly where the geometry joins. XZ because every family this runs on is
       ground. `#include <project_vertex>` is appended to rather than expanded — the directive is
       what is present at this point, and that is all this one needs. */
    sh.vertexShader='varying vec3 vKeaWorld;\n'+sh.vertexShader.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n  vKeaWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='varying vec3 vKeaWorld;\nuniform float uKeaPatch;\nuniform float uKeaMacro;\n'+
      'uniform float uKeaMacroAmt;\nuniform float uKeaMacroRough;\nuniform float uKeaSharp;\n'+
      'uniform vec3 uKeaMeanA;\nuniform float uKeaMeanR;\nuniform float uKeaVar;\n'+MATBREAK_GLSL+
      /* THE FAR BLOCK CARRIES ITS OWN UNIFORMS, so a family without it compiles without them and
         cannot reference an identifier that was never declared. */
      (far?MATFAR_GLSL:'')+
      'KeaTiles KEA_G;\n'+sh.fragmentShader;
    /* THE TAPS ARE COMPUTED ONCE, in the albedo chunk, and reused by the other two. The order is
       three's and is not an assumption: meshphysical_frag runs map_fragment, then
       roughnessmap_fragment, then normal_fragment_maps. All three maps arrive together or not at
       all (matDress sets them as a set), so USE_MAP being on is what guarantees KEA_G is filled
       before the other two read it. */
    for(const [name,pairs] of MATBREAK_PATCH) sh.fragmentShader=matChunk(sh.fragmentShader,name,pairs);
    if(far) for(const [name,pairs] of MATFAR_PATCH)
      sh.fragmentShader=matChunk(sh.fragmentShader,name,pairs);
  };
  return m;
}

/* THE PROVENANCE BLOCK. Rebuilt on demand rather than mutated, so it can never disagree with the
   registry it describes: every field is read straight off MATS and MATSET. */
function matState(){
  const out={mode:'none',dir:MATS.dir,res:MATS.res,families:{},loaded:0,failed:0,
             ignored:MATSIGNORED.slice(),
             /* REPLAT P3b: whether the tiling breakup could install at all. true, or the reason
                it could not — see MATBREAK_PATCH on why this is a reported fact and not a hope. */
             breakup:MATBREAK_OK===true?Object.assign({ok:true},MATS.breakup):{ok:false,why:MATBREAK_OK}};
  for(const [f,F] of Object.entries(MATS.families)){
    const S=MATSET[f]||{};
    out.families[f]={asset:F.asset,tileM:F.tileM,mode:F.mode,tint:F.tint===undefined?null:F.tint,
                     materials:(S.mats||[]).length,maps:!!S.maps,failed:!!S.failed};
    if(S.maps)out.loaded++; if(S.failed)out.failed++; }
  const n=Object.keys(MATS.families).length;
  out.mode=out.loaded===n?'scanned':(out.loaded?'partial':(out.failed?'failed':'none'));
  return out;
}
function matGround(fam,rough){
  const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:rough,metalness:0,envMapIntensity:0.3});
  /* REPLAT P4b: the GRASS-family terrain wears GRASS.groundTint. Only the grass one — the ski
     field's ground is the snow family and snow is not supposed to look like soil. The tint rides
     in matBase so matDress's paint-mode exposure compensation applies to it exactly as it does to
     the white it replaces, rather than being multiplied in afterwards where the two would fight. */
  const base=fam==='grass'?new THREE.Color(GRASS.groundTint).convertSRGBToLinear()
                          :new THREE.Color(1,1,1);
  m.userData.matFamily=fam; m.userData.matBase=base; m.userData.matRough=rough;
  { const FF=MATS.families[fam]; if(FF&&FF.iso)matBreakup(m,FF,fam==='grass'); }
  matFam(fam).mats.push(m); matDress(m); return m;
}
function mat(c,extra){const k=c+JSON.stringify(extra||{});if(!M[k]){const col=new THREE.Color(c).convertSRGBToLinear();M[k]=new THREE.MeshStandardMaterial(Object.assign({color:col,roughness:0.82,metalness:0.0,envMapIntensity:0.3},extra||{}));
    /* REPLAT P3: a scanned family claims the colour BEFORE the procedural branch gets a look at
       it, and the two are exclusive by registration rather than by this ordering — see MATFAM.
       THE FAMILY BRANCH IS NOT BEHIND `!HEADLESS`, on purpose and unlike the branch below it.
       detailTex has to be, because it paints on a canvas; this one only records a family, a base
       colour and a roughness, so node can read the whole registry back and P3's contract can be a
       battery instead of a photograph. matDress with no maps yet leaves the material exactly as
       mat() built it, so a headless world is byte-identical to the one it was before.
       AND IT DOES NOT CARE ABOUT `extra`. No family colour is called with an extra today (grepped,
       all ten of them), and a future one that is — a DoubleSide snow cap, say — should still be
       snow. matDress writes roughness LAST, so an extra that sets roughness on a family colour
       loses to the scan deliberately rather than by accident; that is the whole point of the
       roughness note in the recipe. */
    if(MATFAM[c]){ M[k].userData.matFamily=MATFAM[c]; M[k].userData.matBase=col.clone();
      M[k].userData.matRough=M[k].roughness;
      { const FF=MATS.families[MATFAM[c]]; if(FF&&FF.iso)matBreakup(M[k],FF); }
      matFam(MATFAM[c]).mats.push(M[k]); matDress(M[k]); }
    else if(!HEADLESS&&MAPKIND[c]&&!M[k].map){ const t=detailTex(MAPKIND[c]); if(t)M[k].map=t; } }return M[k];}
function bmat(c,extra){const k='b'+c+JSON.stringify(extra||{});if(!M[k]){const col=new THREE.Color(c).convertSRGBToLinear();M[k]=new THREE.MeshBasicMaterial(Object.assign({color:col},extra||{}));}return M[k];}

/* ---------- tiny utils ---------- */
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);
const lerp=(a,b,t)=>a+(b-a)*t;
let RNGF=Math.random;
const rnd=(a,b)=>a+RNGF()*(b-a);
function setSeed(sd){ let t=sd>>>0; RNGF=()=>{ t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t); r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; }
const wrapAng=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
const dist2=(ax,az,bx,bz)=>{const dx=ax-bx,dz=az-bz;return Math.sqrt(dx*dx+dz*dz);};
function el(id){return HEADLESS?{style:{},classList:{add:()=>{},remove:()=>{},toggle:()=>{}},textContent:'',innerHTML:'',appendChild:()=>{},firstChild:null,children:[],querySelector:()=>el(),querySelectorAll:()=>[],addEventListener:()=>{},remove:()=>{}}:document.getElementById(id);}

/* ---------- audio (all procedural) ---------- */
const AU={ctx:null,master:null,muted:false,
  boot(){ if(HEADLESS||this.ctx)return; try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.master=this.ctx.createGain(); this.master.gain.value=0.5; this.master.connect(this.ctx.destination); this.wind(); }catch(e){} },
  g(v,t0,dur){const g=this.ctx.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+0.015);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);g.connect(this.master);return g;},
  osc(type,f0,f1,dur,vol,t0){ if(!this.ctx||this.muted)return; t0=t0||this.ctx.currentTime; const o=this.ctx.createOscillator();o.type=type;
    o.frequency.setValueAtTime(f0,t0); o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t0+dur);
    o.connect(this.g(vol,t0,dur)); o.start(t0); o.stop(t0+dur+0.05); },
  noise(dur,vol,fc,t0){ if(!this.ctx||this.muted)return; t0=t0||this.ctx.currentTime; const n=this.ctx.createBufferSource();
    const len=Math.floor(this.ctx.sampleRate*dur), buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1; n.buffer=buf;
    const f=this.ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=fc||1200; f.Q.value=0.8;
    n.connect(f); f.connect(this.g(vol,t0,dur)); n.start(t0); },
  screech(pitch){ if(!this.ctx||this.muted)return; const t=this.ctx.currentTime; const q=pitch||1;
    this.osc('sawtooth',1750*q,900*q,0.34,0.20,t); this.osc('sawtooth',1400*q,650*q,0.30,0.12,t+0.05);
    this.osc('square',2300*q,1600*q,0.12,0.05,t); this.noise(0.3,0.05,2600*q,t); },
  chirp(){ this.osc('sine',rnd(900,1400),rnd(1600,2100),0.09,0.06); },
  tug(){ this.noise(0.09,0.06,rnd(500,900)); this.osc('sawtooth',rnd(120,180),rnd(70,110),0.09,0.03); },
  rip(){ if(!this.ctx||this.muted)return; const t=this.ctx.currentTime; this.noise(0.22,0.22,1800,t); this.noise(0.3,0.12,500,t+0.03); this.osc('sawtooth',300,90,0.2,0.08,t); },
  pop(){ this.osc('square',500,120,0.1,0.12); },
  clang(){ if(!this.ctx||this.muted)return; const t=this.ctx.currentTime; this.osc('square',820,780,0.25,0.10,t); this.osc('square',1230,1150,0.22,0.06,t); this.noise(0.12,0.1,3000,t); },
  honk(long){ if(!this.ctx||this.muted)return; const t=this.ctx.currentTime,d=long?0.7:0.25; this.osc('square',330,325,d,0.09,t); this.osc('square',415,410,d,0.07,t); },
  oi(){ this.osc('square',200,110,0.18,0.14); this.noise(0.1,0.06,700); },
  gasp(){ this.osc('sine',300,600,0.2,0.08); },
  munch(){ this.noise(0.08,0.14,900); this.noise(0.08,0.1,700,this.ctx?this.ctx.currentTime+0.12:0); },
  ding(){ if(!this.ctx||this.muted)return; const t=this.ctx.currentTime; this.osc('sine',880,880,0.3,0.1,t); this.osc('sine',1320,1320,0.4,0.07,t+0.06); },
  tick(){ this.noise(0.05,0.1,2500); this.osc('sine',1200,1400,0.08,0.05); },
  fanfare(){ if(!this.ctx||this.muted)return; const t=this.ctx.currentTime; [523,659,784,1047].forEach((f,i)=>this.osc('square',f,f,0.22,0.09,t+i*0.11)); this.noise(0.5,0.05,3000,t+0.4); },
  whoosh(){ this.noise(0.25,0.08,600); },
  flap(){ this.noise(0.07,0.05,300); },
  baa(){ this.osc('sawtooth',480,300,0.35,0.08); },
  splat(){ this.noise(0.18,0.2,400); this.osc('sine',180,60,0.2,0.1); },
  wind(){ if(!this.ctx)return; const n=this.ctx.createBufferSource(); const len=this.ctx.sampleRate*3, buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1; n.buffer=buf; n.loop=true;
    const f=this.ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380;
    const g=this.ctx.createGain(); g.gain.value=0.035; n.connect(f);f.connect(g);g.connect(this.master); n.start(); }
};

/* ---------- input seam ---------- */
const KEYS=new Set();          // held codes
let PRESSED=[];                // discrete presses this frame (codes)
function press(code){ PRESSED.push(code); KEYS.add(code); }   // harness-friendly
function release(code){ KEYS.delete(code); }
/* ---------- VOX: sidecar voice clips (vo/*.wav) — optional, silent fallback ---------- */
const VOXN=12; // number of recorded voice sets on disk (vo/p01..pNN). Edit to match your recordings.
const VOX={cache:{},last:0,catN:{shoo:2,chase:2,grumble:2,snowed:2,flee:2,capped:1,cone:1,wash:1},
  persona(h){ if(h.voxP===undefined){ let x=0; const id=String(h.id||'x');
      for(let i=0;i<id.length;i++)x=(x*31+id.charCodeAt(i))>>>0; h.voxP=1+(x%VOXN); } return h.voxP; },
  play(cat,h,pForce){ if(HEADLESS||typeof Audio==='undefined'||!h)return;
    const t=(typeof performance!=='undefined'?performance.now():Date.now());
    if(t-this.last<900)return; this.last=t;
    const p=pForce?((pForce-1)%VOXN)+1:this.persona(h), n=1+Math.floor(Math.random()*(this.catN[cat]||1));
    const key='vo/p'+String(p).padStart(2,'0')+'_'+cat+n+'.wav';
    let a=this.cache[key];
    if(a===null)return;
    if(!a){ a=new Audio(key); a.onerror=()=>{VOX.cache[key]=null;}; this.cache[key]=a; }
    const k=G.keas&&G.keas[0]; let g=0.8;
    if(k){ const d=Math.hypot(h.x-k.x,h.z-k.z); g=Math.max(0.25,Math.min(0.9,1.1-d*0.03)); }
    try{ a.volume=g; a.currentTime=0; a.play().catch(()=>{}); }catch(e){}
  }
};
/* ---------- procedural ambience: wind, korimako, far kea, sheep, traffic swells ---------- */
const RM=(()=>{ try{ return typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } })();
const AMB={on:false,
  start(){ if(this.on||HEADLESS||!AU.ctx)return; this.on=true; const c=AU.ctx;
    this.bus=c.createGain(); this.bus.gain.value=0.14; this.bus.connect(AU.master);
    const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate), d=nb.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const src=c.createBufferSource(); src.buffer=nb; src.loop=true;
    const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=380; lp.Q.value=0.3;
    this.windG=c.createGain(); this.windG.gain.value=0.35;
    src.connect(lp); lp.connect(this.windG); this.windG.connect(this.bus); src.start();
    this.t=0; this.birdT=rnd(3,7); this.keaT=rnd(10,20); this.sheepT=rnd(6,14); this.beat=0; this.beatT=0;
  },
  tone(fr,t0,dur,vol,type){ if(AU.muted)return {frequency:{value:0,exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},setValueAtTime(){}}}; const c=AU.ctx,o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine'; o.frequency.value=fr;
    g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+0.03);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    o.connect(g); g.connect(this.bus); o.start(t0); o.stop(t0+dur+0.05); return o; },
  bell(){ const t=AU.ctx.currentTime, f0=rnd(1500,1950);
    this.tone(f0,t,0.5,0.045); this.tone(f0*rnd(0.74,0.82),t+0.17,0.55,0.04);
    if(Math.random()<0.4)this.tone(f0*1.12,t+0.36,0.4,0.03); },
  farKea(){ const t=AU.ctx.currentTime, o=this.tone(rnd(950,1150),t,0.9,0.035,'sawtooth');
    o.frequency.exponentialRampToValueAtTime(520,t+0.85); },
  baa(){ const t=AU.ctx.currentTime, f=rnd(200,240);
    const o=this.tone(f,t,0.45,0.05,'sawtooth'); o.frequency.linearRampToValueAtTime(f*0.86,t+0.4);
    this.tone(f*1.02,t,0.42,0.035,'sawtooth'); },
  swell(){ const c=AU.ctx,t=c.currentTime;
    const nb=c.createBuffer(1,Math.floor(c.sampleRate*1.4),c.sampleRate),d=nb.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const sr=c.createBufferSource(); sr.buffer=nb;
    const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=1.1;
    bp.frequency.setValueAtTime(260,t); bp.frequency.linearRampToValueAtTime(900,t+0.55); bp.frequency.linearRampToValueAtTime(240,t+1.3);
    const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.11,t+0.5); g.gain.exponentialRampToValueAtTime(0.0001,t+1.35);
    sr.connect(bp); bp.connect(g); g.connect(this.bus); sr.start(t); sr.stop(t+1.4); },
  music(){ if(AU.muted)return; const c=AU.ctx,t=c.currentTime, st=this.beat%16;
    const P=[220,0,262,0, 294,0,262,330, 220,0,196,0, 262,247,220,0]; // cheeky A-minor waddle
    const B=[110,0,0,0, 98,0,0,0, 110,0,0,0, 131,0,98,0];
    if(P[st]){ const o=this.tone(P[st],t,0.16,0.028,'triangle'); o.frequency&&o.frequency.setValueAtTime&&o.frequency.setValueAtTime(P[st],t); }
    if(B[st])this.tone(B[st],t,0.3,0.03,'sine');
    if(st===14&&Math.random()<0.3)this.tone(rnd(520,660),t,0.1,0.02,'square');
    this.beat++; },
  update(dt,k){ if(HEADLESS)return; if(!this.on){ if(AU.ctx)this.start(); return; } if(!k)return;
    this.t+=dt;
    this.beatT+=dt; const step=0.21+(G.colossal?-0.03:0);
    if(this.beatT>=step){ this.beatT-=step; this.music(); }
    const gust=0.55+0.28*Math.sin(this.t*0.21)+0.17*Math.sin(this.t*0.067+1.7);
    const alpine=clamp((Math.hypot(k.x,k.z)-26)/44,0,1);
    this.windG.gain.value=AU.muted?0:(0.2+0.45*gust)*(0.55+0.65*alpine);
    this.birdT-=dt; if(this.birdT<=0){ this.bell(); this.birdT=rnd(4,12); }
    this.keaT-=dt; if(this.keaT<=0){ this.farKea(); this.keaT=rnd(14,30); }
    this.sheepT-=dt; if(this.sheepT<=0){ if(Math.random()<0.7)this.baa(); this.sheepT=rnd(8,18); }
    for(const c of G.cars){ if(!c.traffic)continue;
      if(Math.abs(c.x-k.x)<5&&!c._swell&&Math.abs(c.speed||0)>3){ c._swell=true; this.swell(); }
      if(Math.abs(c.x-k.x)>14)c._swell=false; }
  }
};
/* wearables: what you were wearing is part of who you are (reference 17, lean in) */
const WEARABLE={"ranger's cap":{build:'rangercap',owner:'rex',mission:'b_cap'},
                "tramper's beanie":{build:'beanie',owner:'tom',mission:'b_beanie'},
                "ski goggles":{build:'goggles',owner:null,mission:'s_goggles'}};
/* THE STAR LEDGER (2026-09-01). Three stars per PAGE of the to-do list:
     cleared - every mission on the page is done (derivable, so it can always be retro-granted)
     style   - the chaos earned WHILE the page was open cleared par (piece 13 grants it)
     clean   - nobody got caged while the page was open (piece 14 grants it)
   Keyed by AREA rather than by chapter index, so reordering or inserting a chapter cannot
   silently move somebody stars. The per-page chaos snapshot is what makes 'earned while the page
   was open' answerable at all: the run total cannot tell you which page paid for it.
   NOTE the meter is G.score. G.chaos is read once at the night auto-driver and never assigned
   anywhere in the file, so it is undefined - filed as TODO 35, deliberately not fixed here. */
const STARKINDS=['cleared','style','clean'];
function starRec(area){ if(!G.stars)G.stars={};
  let r=G.stars[area]; if(!r){ r={cleared:false,style:false,clean:false}; G.stars[area]=r; } return r; }
function starCount(area){ const r=G.stars&&G.stars[area]; return r?STARKINDS.filter(k=>!!r[k]).length:0; }
function starPips(area){ const r=G.stars&&G.stars[area];
  return STARKINDS.map(k=>(r&&r[k])?'★':'☆').join(''); }
function pageRows(area){ return G.missions.filter(m=>m.area===area&&!m.finale&&!m.hide&&!m.bonus); }
function pageCleared(area){ const rows=pageRows(area); return rows.length>0&&rows.every(m=>m.done); }
function curPage(){ return (G.chapters&&G.chapters[G.chapIdx||0])||null; }
/* CLEARED is a function of the done list, so the same call serves the live grant and the
   retro-grant for a legacy blob that never stored a star. Idempotent, returns how many it added. */
function syncClearedStars(){ let n=0;
  for(const a of (G.chapters||[])) if(pageCleared(a)&&!starRec(a).cleared){ starRec(a).cleared=true; n++; }
  return n; }
function pageSnap(area){ if(!area)return null; if(!G.pageChaos)G.pageChaos={};
  return G.pageChaos[area]||(G.pageChaos[area]={open:0,close:null,earned:0,paid:0,caged:0}); }
function pageOpen(area){ const p=pageSnap(area); if(!p)return null;
  p.open=G.score||0; p.close=null; p.earned=0; p.paid=0; p.caged=0; return p; }
function pageClose(area){ const p=area&&G.pageChaos&&G.pageChaos[area]; if(!p)return null;
  p.close=G.score||0; p.earned=Math.max(0,p.close-p.open); return p; }
function pageEarned(area){ const p=area&&G.pageChaos&&G.pageChaos[area]; if(!p)return 0;
  return p.close==null?Math.max(0,(G.score||0)-p.open):p.earned; }
/* the header line for chapter i, computed WITHOUT the DOM so it can be asserted headless */
function pageHeader(i){ const a=G.chapters&&G.chapters[i]; if(!a)return null;
  const ci=G.chapIdx||0, pips=starPips(a), stars=starCount(a);
  const state=i<ci?'cleared':(i===ci?'open':(i===ci+1?'next':'hidden'));
  const text=state==='cleared'?('✓ '+a+' — PAGE CLEARED  '+pips)
            :state==='open'?(a+'  '+pips)
            :state==='next'?'??? — THE NEXT PAGE':null;
  return {area:a,state,pips,stars,text}; }
/* hydrate from a save blob of ANY vintage, then open the live page */
function starsInit(b,ver){
  // the BLOB is authoritative, exactly as the done list is: reset then hydrate, so that wiping the
  // save at the title and restarting cannot leave a star behind that no save record supports.
  G.stars={}; G.pageChaos={};
  const st=b&&b.stars;
  if(st)for(const a in st){ const r=starRec(a), sv=st[a]||{};
    for(const k of STARKINDS)if(sv[k])r[k]=true; }
  const pg=b&&b.pages;
  // only CLOSED pages restore their snapshot: the chaos meter itself restarts at 0 on load, so a
  // page still in progress must restart its style clock rather than measure against a stale open.
  if(pg)for(const a in pg){ const p=pg[a]||{};
    if(p.close==null)continue;
    G.pageChaos[a]={open:+p.open||0,close:+p.close||0,earned:+p.earned||0,paid:+p.paid||0,
                    caged:+p.caged||0}; }
  const retro=syncClearedStars();
  pageOpen(curPage());
  return {stars:!!st,pages:!!pg,retro,v:ver||(b&&b.v)||1}; }

/* ---------- THE STYLE STAR (TODO 13, 2026-09-02) ----------
   Second of the three page stars: you cleared the page, but were you FLAMBOYANT about it. Granted
   when the chaos earned while the page was open reaches par.
   PAR IS MEASURED, NOT TABULATED, and that is a correction to the brief rather than a shortcut. TODO
   13 asks for 1.5 x the sum of the page missions points, and the file has no such number: missions
   carry no points field and every value lives inside the award() call in its own handler. Scraping
   them out of the source pairs only 17 of the 40 done() ids - the rest award through prog(), through
   a shared handler, or nowhere near their own done() - so a hand-written table would be thirty-nine
   unverifiable numbers with nothing able to check one of them. Instead the page LEARNS what it paid:
   award() drops every point into a per-frame purse and a mission finishing in that frame claims it.
   A page can only turn once every row on it is done, so by page close paid IS the sum of that page
   missions points - the figure the brief asked for, derived rather than transcribed, and it
   re-derives itself if any award value in the file ever changes.
   THE PURSE IS PER FRAME because BOTH ORDERS occur in the file: nine handlers award and then call
   done(), eight call done() and then award. A frame is the exact window, since all handler code for
   a tick runs synchronously inside update(), so a claim takes what the frame has banked so far AND
   anything banked later in the same frame. Freelance chaos landing in the same frame as a mission is
   counted as mission pay, which can only RAISE par, so the error is in the safe direction.
   THE STAR IS JUDGED AT END OF FRAME, not at the turn, for exactly that reason: the mission that
   turns the page may award AFTER done(), so at the instant of the turn the last payout is not in
   G.score yet and the bar would depend on which order that one handler happened to use. FLAKES law 2
   under another name - tick first, then read.
   THE PURSE KEYS ON G.frames RATHER THAN G.time, because the photographer pins G.time in QUIET and a
   pinned clock would collapse every frame into one purse. */
const PARRATIO=1.5;   // FENCED FOR PLAYTEST: this one number is the whole difficulty of the star
function purseFrame(){ if(G._purseF!==G.frames){ G._purseF=G.frames; G._purse=0; G._purseTaken=0;
    G._purseOpen=false; G._purseArea=null; } }
function purseAdd(pts){ purseFrame(); G._purse+=pts;
  /* A LATE AWARD BELONGS TO THE PAGE THAT CLAIMED THE FRAME, NOT TO curPage(), and the difference is
     not academic: the mission that TURNS a page is very often one that awards after done(), and by
     then curPage() is already the NEXT page. Routing the payout there charged the new page for the
     old page last mission - inflating its par before the player had done a thing on it - and handed
     the old page a style star it had not earned, because its own par was short by that payout. */
  if(G._purseOpen){ const p=G.pageChaos&&G._purseArea&&G.pageChaos[G._purseArea];
    if(p){ p.paid=(p.paid||0)+pts; G._purseTaken+=pts; } } }
function purseClaim(area){ if(!area||area!==curPage())return 0;
  purseFrame();
  const take=Math.max(0,(G._purse||0)-(G._purseTaken||0));
  const p=pageSnap(area); if(p)p.paid=(p.paid||0)+take;
  G._purseTaken=G._purse||0; G._purseOpen=true; G._purseArea=area; return take; }
function pagePar(area){ const p=area&&G.pageChaos&&G.pageChaos[area];
  return p?Math.round(PARRATIO*(p.paid||0)):0; }
function styleQueue(area){ if(!area)return; (G._styleQ=G._styleQ||[]).push(area); }
function styleJudge(area){ const p=area&&G.pageChaos&&G.pageChaos[area]; if(!p)return null;
  pageClose(area);                          // recompute, so a late award in the turning frame counts
  const par=pagePar(area), earned=p.earned||0, had=!!starRec(area).style;
  const win=(p.paid||0)>0&&earned>=par;
  if(win&&!had){ starRec(area).style=true;
    popup('\u2605 STYLE','THAT WAS SHOWING OFF  '+earned+' / '+par,0,null,true); AU.ding(); }
  return {area,earned,par,paid:p.paid||0,granted:!!starRec(area).style,fresh:win&&!had}; }
/* ---------- THE CLEAN GETAWAY STAR (TODO 14, 2026-09-02) ----------
   Third of the three page stars: did you do the whole page without once being put in the cage. The
   counter only ever goes UP, so escaping does not clean the record - the star is for not being caught,
   not for getting out. Either bird counts in co-op, which needs no special case at all: cageKea is the
   ONE place in the file that puts a bird behind bars, it is called per bird, and the page does not ask
   which one. That single entry point is also what makes the cage spy TODO 14 asks for usable as an
   independent witness in the battery rather than a second implementation of the same rule.
   THERE IS NO RETRO-GRANT, and that is deliberate. Piece 12 could retro-grant CLEARED because CLEARED
   is a function of the done list, which every save has. Nothing in a v1 or early-v2 blob records
   whether anybody was caged, so a returning player CANNOT be handed this star honestly - and handing
   it out on the grounds that the record is silent would give every legacy page a free third star. */
function pageCaged(area){ const p=area&&pageSnap(area); if(!p)return 0;
  p.caged=(p.caged||0)+1; return p.caged; }
function cleanJudge(area){ const p=area&&G.pageChaos&&G.pageChaos[area]; if(!p)return null;
  const had=!!starRec(area).clean, win=(p.caged||0)===0;
  if(win&&!had){ starRec(area).clean=true;
    popup('\u2605 CLEAN GETAWAY','NEVER ONCE IN THE CAGE',0,null,true); AU.ding(); }
  return {area,caged:p.caged||0,granted:!!starRec(area).clean,fresh:win&&!had}; }
function pageJudge(area){ return {area,style:styleJudge(area),clean:cleanJudge(area)}; }
function styleDrain(){ const q=G._styleQ; if(!q||!q.length)return [];
  G._styleQ=[]; const out=[]; for(const a of q){ const r=pageJudge(a); if(r)out.push(r); } return out; }

/* ---------- SCORE ATTRIBUTION (TODO 16, 2026-09-02) ----------
   THE BRIEF SAYS THREAD THE ACTING KEA THROUGH award(). It does not have to be threaded, and
   threading it would have meant touching forty-six call sites to carry a fact the call stack
   already knows. award() is called from exactly one place at a time, and for the overwhelming
   majority of those calls the frame underneath it is a kea updating itself: an interactable
   onDone runs inside interact(), which runs inside Kea.update, which runs inside the loop over
   G.keas. So the loop NAMES the bird it is updating and award() reads it. One assignment, and the
   attribution is derived from the structure rather than restated at every site - which also means
   a new award added tomorrow is attributed correctly without its author knowing this exists.
   WHAT THE STACK CANNOT SEE, THREE THINGS, AND THEY ARE PASSED BY HAND. A car honking at a bird on
   its roof, a ranger losing his cap to a bird, and a snowfall landing on a human several seconds
   after the bird kicked it - all three run outside the kea loop, and all three have the bird in
   hand at the point of the award. The fourth kind is the traffic jam, which genuinely has no single
   author, and it goes where it belongs: LOOSE, counted but not credited.
   THE INVARIANT IS THE POINT. Every point that reaches G.score reaches exactly one of the ledgers,
   so score equals the sum of the books at every instant. That is what makes the split trustworthy
   later - a VS scoreboard built on books that do not add up is worse than no scoreboard.
   AND THAT IS WHY A RESTART DOES NOT CLEAR THEM. G.score is never assigned anywhere in this file,
   only added to, so it survives startGame the way the rest of the world does. Books that reset
   under a total that does not would stop adding up at the first restart, which costs more than it
   buys. A VS match wanting per-match figures takes a SNAPSHOT at the whistle and subtracts - the
   same shape pageSnap already uses for a page. */
function actorOf(who){
  if(who===undefined||who===null)who=G.actor;
  if(typeof who==='number')return who>=0?who:-1;
  return who&&typeof who.idx==='number'?who.idx:-1; }
function ledgerAdd(pts,who){ const i=actorOf(who);
  if(i<0){ G.ledgerLoose=(G.ledgerLoose||0)+pts; return -1; }
  G.ledger=G.ledger||[]; G.ledger[i]=(G.ledger[i]||0)+pts; return i; }
function ledgerOf(i){ return (G.ledger&&G.ledger[i])||0; }
function ledgerTotal(){ return (G.ledger||[]).reduce((a,b)=>a+(b||0),0)+(G.ledgerLoose||0); }

/* ---------- 2 KEA VERSUS: THE MATCH SCAFFOLD (TODO 22, 2026-09-02) ----------
   A match is a WINDOW over the shared economy, not a second economy. Piece 16 gave every bird a book
   that adds up to the score at every instant; a match snapshots both books at the whistle and reads
   the difference, so the chaos you arrived with does not count and nothing about scoring has to
   change to support a scoreboard. That is also why this piece needs no per-mode award path: it is
   subtraction.
   PURE STATE, for the same reason the travel beat was: the screens are browser-only and the timer is
   feel, but the DECISION - who won, why, and when a tie stops being a tie - is a state machine and
   every branch of it can be driven headless.
   THE ROLES ARE A SEEDED COIN. rnd() rather than Math.random, so a battery can predict the flip and
   a replay of the same seed gives the same match. They do nothing yet: piece 24 is what makes rex
   hunt the menace, and this piece only has to make the roles exist, be opposite, and be reported. */
/* ---------- ARENA SCOPING (TODO 23, 2026-09-02) ----------
   A MATCH IS ONE PATCH. Acts inside the arena score and acts outside it are free - the bird still
   does the thing, it just does not get paid, and it is told why.
   THE BRIEF SAYS "interactables whose mission area matches the arena" AND THE FILE CANNOT ANSWER
   THAT FOR MOST OF THEM: 29 of 65 interactables carry a mission id, so scoping on mission area alone
   would leave 36 of them - most of the tears, most of the props - unscoreable in every arena, which
   is not a match, it is an empty carpark.
   SO EVERY INTERACTABLE IS STAMPED WITH AN AREA, AND THE STAMP IS DERIVED FROM DATA THAT EXISTS: its
   own mission area if it has one, otherwise the area of the NEAREST thing that does. No table, no
   per-object tagging, and a tear added tomorrow beside the hut is a hut tear without anybody saying
   so. Stamped from where a thing LIVES rather than where it currently is, so carrying a cone across
   the map does not move the patch it belongs to.
   AND THE SCORE GATE READS THE PLACE, NOT THE CALL SITE. award() already takes the position an act
   happened at, so the gate asks which patch that position is in and pays nothing outside the arena -
   one function, forty-six call sites untouched. An award with no position is not a patch act at all
   (a page turn, a finale) and is never gated. */
function areaOfInter(it){
  if(!it)return null;
  const mid=it.mission||it.missionFar||it.missionProg;
  if(mid&&G.missions){ const m=G.missions.find(x=>x.id===mid); if(m&&m.area)return m.area; }
  return null; }
function interHome(it){
  if(!it)return null;
  if(it.kind==='prop'&&it.home)return {x:it.home.x,z:it.home.z};
  const q=it.getPos?it.getPos():it;
  return (q&&q.x!==undefined)?{x:q.x,z:q.z}:null; }
function arenaStamp(){
  const known=[];
  for(const it of (G.inter||[])){ const a=areaOfInter(it); it.area=a||null;
    if(a){ const h=interHome(it); if(h)known.push({a,x:h.x,z:h.z}); } }
  for(const it of (G.inter||[])){ if(it.area)continue;
    const h=interHome(it); if(!h)continue;
    let bd=Infinity,ba=null;
    for(const k of known){ const d=Math.hypot(k.x-h.x,k.z-h.z); if(d<bd){bd=d;ba=k.a;} }
    it.area=ba; }
  return (G.inter||[]).filter(it=>it.area).length; }
function arenaAt(pos){
  if(!pos||pos.x===undefined)return null;
  let bd=Infinity,ba=null;
  for(const it of (G.inter||[])){ if(!it.area)continue;
    const h=interHome(it); if(!h)continue;
    const d=Math.hypot(h.x-pos.x,h.z-pos.z); if(d<bd){bd=d;ba=it.area;} }
  return ba; }
function arenaOK(pos){
  const v=G.vs;
  if(!v||v.phase==='over'||!v.arena)return true;      // no match, no scoping
  const a=arenaAt(pos);
  return a===null||a===v.arena; }

const VSLEN={short:180,std:300,long:480};   // seconds: 3, 5, 8 minutes. FENCED FOR PLAYTEST
const VSSUDDEN=60;                          // sudden death runs this long, then it is an honest draw
function vsOn(){ return !!(G.vs&&G.vs.phase!=='over'); }
function vsScores(){ const v=G.vs; if(!v)return [0,0];
  return [ledgerOf(0)-v.base[0], ledgerOf(1)-v.base[1]]; }
function vsRoleOf(i){ const v=G.vs; if(!v)return null;
  return v.roles.menace===i?'menace':(v.roles.management===i?'management':null); }
function vsStart(opts){
  if(G.keas.length<2)return null;                       // a versus match needs two birds
  const key=(opts&&opts.len)||'std', len=VSLEN[key]||VSLEN.std;
  const coin=rnd(0,1)<0.5?0:1;
  arenaStamp();                                    // TODO 23: missions exist by now, so areas can be read
  const patches=(G.chapters||[]).slice();
  let arena=null;
  if(opts&&opts.arena&&patches.indexOf(opts.arena)>=0)arena=opts.arena;
  else if(opts&&opts.tour&&patches.length){ G.vsTour=((G.vsTour||0))%patches.length; arena=patches[G.vsTour]; G.vsTour++; }
  else if(patches.length)arena=patches[Math.floor(rnd(0,patches.length))%patches.length];
  G.vs={phase:'play',t:0,len,lenKey:VSLEN[key]?key:'std',sudden:0,arena,
        roles:{menace:coin,management:1-coin},
        base:[ledgerOf(0),ledgerOf(1)], tieAt:null,
        best:[null,null], result:null, why:null};
  popup('2 KEA VERSUS','KEA '+(coin+1)+' IS THE MENACE - KEA '+(2-coin)+' IS THE MANAGEMENT',0,null,true);
  if(arena)popup('THE PATCH: '+arena,'only this patch pays',0,null,true);
  AU.honk&&AU.honk(true);
  return G.vs; }
/* the biggest single play each side, which is the one line of a results screen anybody reads. Fed
   from award() through the ledger, so it counts exactly what the scoreboard counts. */
function vsNote(i,pts,label){ const v=G.vs;
  if(!v||v.phase==='over'||!(i>=0))return null;
  if(!v.best[i]||pts>v.best[i].pts)v.best[i]={pts,label:label||''};
  return v.best[i]; }
function vsEnd(why){ const v=G.vs; if(!v||v.phase==='over')return null;
  const s=vsScores();
  v.phase='over'; v.why=why;
  v.result={scores:s, winner:(s[0]>s[1]?0:(s[1]>s[0]?1:-1)), why,
            roles:{menace:v.roles.menace,management:v.roles.management},
            best:[v.best[0],v.best[1]]};
  AU.honk&&AU.honk(true); G.paused=true;
  vsScreen(v.result);
  return v.result; }
function vsUpdate(dt){
  const v=G.vs; if(!v||v.phase==='over')return null;
  v.t+=dt;
  if(v.phase==='play'){
    if(v.t>=v.len){ const s=vsScores();
      if(s[0]===s[1]){ v.phase='sudden'; v.sudden=0; v.tieAt=s.slice();
        popup('SUDDEN DEATH','level at the horn - FIRST POINT TAKES IT',0,null,true); AU.honk&&AU.honk(true); return v; }
      return vsEnd('time'); }
    return v; }
  /* SUDDEN DEATH IS DECIDED BY THE LEDGER MOVING, not by a points counter of its own - anything that
     pays chaos ends it, which is the same rule the whole match ran under. */
  v.sudden+=dt;
  const s=vsScores();
  if(s[0]!==v.tieAt[0]||s[1]!==v.tieAt[1])return vsEnd('sudden');
  if(v.sudden>=VSSUDDEN)return vsEnd('draw');
  return v; }
function vsScreen(r){
  if(HEADLESS||!r)return null;
  const nm=i=>'KEA '+(i+1)+' ('+(vsRoleOf(i)||'').toUpperCase()+')';
  const play=b=>b?(b.label+' <b>'+b.pts+'</b>'):'nothing worth mentioning';
  const h=document.getElementById('vswin'), st=document.getElementById('vsstats'),
        sc=document.getElementById('vsend');
  if(h)h.innerHTML=(r.winner<0?'A DRAW':nm(r.winner)+' TAKES IT')+
    '<em>'+({time:'ON THE HORN',sudden:'SUDDEN DEATH',draw:'NOBODY BLINKED'})[r.why]+'</em>';
  if(st)st.innerHTML=
    nm(0)+': <b>'+r.scores[0]+'</b> &middot; best play: '+play(r.best[0])+'<br>'+
    nm(1)+': <b>'+r.scores[1]+'</b> &middot; best play: '+play(r.best[1]);
  if(sc)sc.style.display='flex';
  return r; }

/* ---------- THE FIX VERB (TODO 18, 2026-09-02) ----------
   THE MANAGEMENT gets one generic verb and no special cases: hold the grab key on anything that has
   been wrecked and it goes back. Every tear in the game is restorable by the same code, because the
   tear already records what it looked like before - addTear snapshots base position and rotation so
   the wreck animation can lean from it, and the restore just puts the snapshot back.
   WHAT AN ACT IS WORTH IS LEARNED, NOT TABULATED, which is piece 13 again: a tear does not carry a
   points field, every value lives inside the award() call in its own onDone, and scraping those
   pairs only ever half works. So the FIRST wreck measures what actually landed and that becomes the
   object pristine value. Change any award in the file and this follows it.
   ONE COUNTER, BOTH DIRECTIONS, which is what the mode constants ask for: every completed act on an
   object - wreck or fix - advances the same cycle count, and what it pays is the pristine value
   times DECAY to that count. So a first wreck pays full, putting it back pays 0.6, wrecking it again
   pays 0.36, and an object that gets fought over is worth less to both sides every time. The
   decay reaches the WRECK side through one hook in award(), scoped to the onDone call, because a
   tear award is written inside its own handler and cannot be reached any other way.
   VS ONLY. Outside a match there is no management, nothing is restorable, no cycle is counted and no
   award is scaled - the hook reads G._decay and G._decay is only ever set inside a match. */
const DECAY=0.60;                    // per object, per cycle, both directions. FENCED FOR PLAYTEST
/* ---------- THE BOTCH (TODO 19, 2026-09-02) ----------
   A restore never lands pristine. THE MANAGEMENT puts the thing back and it goes back CROOKED - a
   small rotation, a small offset - because a bird did it with its beak. The success condition is
   untouched: the object is restored, the mission reads restored, and only the transform is wonky.
   NON-COMPOUNDING, WHICH IS THE CONSTANT SPEAKING. Every wonk is measured from the PRISTINE
   transform, never from the last restore, so an object put back five times is exactly as crooked as
   one put back once. Compounding would turn a contested object into scenery on the floor, and the
   mode constants explicitly reserve compounding as a playtest experiment rather than the default.
   SEEDED PER OBJECT AND PER CYCLE, NOT OFF THE WORLD STREAM. rnd() would work and would be wrong:
   the wonk would then depend on how many draws happened to have been spent before the restore, so
   the same object restored at the same point in two runs could land differently and the tripwire
   would have to tolerate it. Hashing the object id with the cycle instead makes the wonk a FUNCTION
   of what is being restored - reproducible from nothing but the object, and still different every
   time it is put back. */
const BOTCH=0.80;                                        // fidelity of pristine. FENCED FOR PLAYTEST
const BOTCHBAND={rot:(1-BOTCH)*0.6, off:(1-BOTCH)*0.18}; // radians and metres, derived from the constant
function botchNoise(key){                                // deterministic, in [-1,1], from a string
  let h=2166136261>>>0;
  for(let i=0;i<key.length;i++){ h^=key.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  h=(h+0x6D2B79F5)>>>0; let r=Math.imul(h^h>>>15,1|h); r^=r+Math.imul(r^r>>>7,61|r);
  return ((((r^r>>>14)>>>0)/4294967296)*2)-1; }
function botchWonk(id,cycle){ const k=String(id)+':'+(cycle||0)+':';
  return {rot:botchNoise(k+'rot')*BOTCHBAND.rot, tilt:botchNoise(k+'tilt')*BOTCHBAND.rot,
          x:botchNoise(k+'x')*BOTCHBAND.off, z:botchNoise(k+'z')*BOTCHBAND.off}; }
/* THE ONE PLACE A RESTORE LANDS. Two kinds of thing get put back and they are held in the world
   differently, so the APPLICATION differs while the wonk does not: a tear owns its mesh transform
   outright, but a prop mesh is re-positioned from p.x/p.y/p.z every frame by the physics loop and
   has its rotation.x flattened when it settles - so a prop is wonked on the axes that survive, which
   is the logical position and rotation.y. Same band, same seed, same non-compounding rule, one
   function: piece 21 puts its replacements back through this too. */
function botchApply(o,cycle){
  if(!o)return null;
  const w=botchWonk(o.id,cycle);
  if(o.kind==='prop'&&o.home){
    o.x=o.home.x+w.x; o.z=o.home.z+w.z;
    if(o.home.y!==undefined)o.y=o.home.y;
    o.vx=0; o.vz=0; o.vy=0; o.rvx=0; o.rvy=0;
    if(o.mesh){ o.mesh.position.set(o.x,o.y,o.z); o.mesh.rotation.y=(o.home.ry||0)+w.rot; }
    o.botch=w; return w; }
  if(o.mesh&&o.base){
    o.mesh.position.x=o.base.px+w.x;
    o.mesh.position.z=o.base.pz+w.z;
    o.mesh.rotation.x=(o.base.rx||0)+w.tilt;
    o.mesh.rotation.z=(o.baseRz||0)+w.rot;
    o.botch=w; return w; }
  return null; }

/* ---------- THE SOURCE (TODO 21, 2026-09-02) ----------
   A SCOFFED SANDWICH CANNOT BE UN-EATEN, and that asymmetry is the point of the whole restore side:
   the menace can undo the management with one bite and the management cannot answer it in place. It
   has to WALK. Every consumable is replaceable from a source - the picnic spread, the chilly bin -
   and the price of the snack strategy is paid in travel, which is what the brief asks for.
   THE SOURCE FOR A CONSUMABLE IS DERIVED, NOT TABULATED: it is the nearest registered source to the
   place that consumable LIVES. So a food added to the picnic table tomorrow is replaceable from the
   picnic table without anybody adding a row to a map, and the rule reads the world instead of a
   second copy of it.
   THE REPLACEMENT IS THE EATEN PROP, RE-INSTANTIATED. Nothing observes object identity - a scoffed
   prop is banked with its mesh hidden - so un-banking it at the source is materially a replacement,
   and it means the home, the learned pristine value and the shared cycle count come along instead of
   being copied onto a new object and drifting from it. The fiction is in the fiction, not the state.
   DEPLETION IS WHAT STOPS IT BEING A TREADMILL. A source holds STOCK; when it is out, the management
   is out of answers and the menace is ahead. */
const FOODSTOCK=2;                       // per source, per match. FENCED FOR PLAYTEST
function addFoodSrc(id,x,z,r){ (G.foodSrc=G.foodSrc||[]).push({id,x,z,r:r||2.2,stock:FOODSTOCK}); }
function foodSrcNear(x,z){ let best=null,bd=Infinity;
  for(const s of (G.foodSrc||[])){ const d=Math.hypot(s.x-x,s.z-z); if(d<bd){bd=d;best=s;} }
  return best; }
function foodOrders(){ return (G.props||[]).filter(p=>p.banked&&p.food&&p.home); }
function foodSrcAt(k){ return (G.foodSrc||[]).find(s=>Math.hypot(k.x-s.x,k.z-s.z)<=s.r)||null; }
function foodOrderFor(src){ if(!src)return null;
  return foodOrders().find(p=>foodSrcNear(p.home.x,p.home.z)===src)||null; }
function foodFetch(k){
  if(!canRestore(k)||!k||k.held)return null;
  const src=foodSrcAt(k); if(!src)return null;
  const order=foodOrderFor(src); if(!order)return null;
  if(src.stock<=0){ popup('OUT OF STOCK','the '+src.id+' has nothing left to put back',0,k.pos(),true); return null; }
  src.stock--;
  order.banked=false; order._wasAway=true;
  order.x=src.x; order.z=src.z; order.y=0.95; order.vx=0; order.vz=0; order.vy=0;
  if(order.mesh){ order.mesh.visible=true; order.mesh.position.set(order.x,order.y,order.z); }
  order.heldBy=k; k.held=order; AU.chirp&&AU.chirp();
  popup('REPLACEMENT '+String(order.name||'').toUpperCase(),'put it back where it lived',0,k.pos(),true);
  return order; }

/* ---------- THE CARRY-BACK (TODO 20, 2026-09-02) ----------
   A cone on the road, a boot in the tussock, a shiny in the nest-ward direction: the management
   picks it up and drops it where it lives, and it counts. The whole verb is two questions asked at
   the moment of a drop - was this thing away when you picked it up, and is it home now - so there is
   no carry state to keep in step with the physics and nothing to clean up if the bird is shooed
   mid-carry. It simply does not count.
   WHAT IT PAYS IS LEARNED, the same way the tear learned it: whatever the DROP that displaced it
   actually awarded becomes its pristine value, and the carry-back pays that decayed by the shared
   cycle count. A cone nobody was ever paid for is worth nothing to tidy, which is correct. */
function carryValue(p){ return Math.round((p&&p.paid||0)*Math.pow(DECAY,(p&&p.cycles)||0)); }
function carryBack(p,by){
  if(!p||!p.home)return null;
  const pts=carryValue(p);
  botchApply(p,p.cycles||0);
  p._wasAway=false; p.cycles=(p.cycles||0)+1;
  if(pts>0)award(pts,'ORDER: '+String(p.name||'prop').toUpperCase()+' PUT BACK',{x:p.x,y:p.y+0.4,z:p.z},by);
  AU.pop&&AU.pop();
  return {pts,cycles:p.cycles}; }
function canRestore(k){ return !!(k&&vsOn()&&vsRoleOf(k.idx)==='management'); }
function fixable(it,k){ return !!(it&&it.kind==='tear'&&it.done&&canRestore(k)); }
function orderValue(it){ return Math.round((it&&it.paid||0)*Math.pow(DECAY,(it&&it.cycles)||0)); }
function fixTear(it,by){
  if(!it||!it.done)return null;
  const pts=orderValue(it);
  it.done=false; it.progress=0; it.fixProgress=0; it.hits=0;
  if(it.mesh){ it.mesh.visible=true;
    if(it.base){ it.mesh.position.set(it.base.px,it.base.py,it.base.pz); it.mesh.rotation.x=it.base.rx||0; }
    it.mesh.rotation.z=it.baseRz||0;
    botchApply(it,it.cycles||0); }   // TODO 19: it goes back, and it goes back crooked
  it.cycles=((it.cycles||0)+1);
  const p=it.getPos?it.getPos():null;
  if(pts>0)award(pts,'ORDER: '+String(it.label||'PUT BACK').toUpperCase(),p,by);
  AU.tug&&AU.tug();
  if(it.tuggers)it.tuggers.forEach(k=>{k.tug=null;});
  return {pts,cycles:it.cycles}; }

/* ---------- THE SAVE, SCHEMA v3: PROGRESS IS PER BIOME (TODO 37, 2026-09-02) ----------
   v2 stored one world because there WAS one world. The tour makes that assumption wrong in the only
   way that costs a player something: two maps whose chapters happen to share a name would have
   written over each other stars. So the blob now carries a slot per biome and nothing else about it
   changes - same storage key, because the key is how a returning player is identified and bumping it
   would wipe every run alive.
   MIGRATION IS RETRO-GRANTING, NOT GUESSING. A v1 or v2 blob described the carpark, so the whole of
   it becomes the carpark slot and the slot records which vintage it came from. Nothing is dropped
   and nothing is invented for a map that never existed.
   AND IT STILL WRITES THE OLD SHAPE ALONGSIDE, as a mirror of whichever biome you are standing in.
   That is not belt and braces, it is the promise the v2 assertion made and this piece has no right
   to break: somebody who opens an older copy of this file - and there are copies - still finds the
   map that build knows about, exactly where it looks for it. The mirror is written and never read;
   every reader goes through migrate() to the slots. */
const SAVE={
  key(){ return 'keaSaveV1_'+(G.colossal?'c':'n'); },
  ok(){ try{ return typeof localStorage!=='undefined'&&!!localStorage; }catch(e){ return false; } },
  slot(){ return {
    done:G.missions.filter(m=>m.done).map(m=>m.id), chapIdx:G.chapIdx||0,
    stars:G.stars||{}, pages:G.pageChaos||{},
    hats:G.keas.map(k=>(k.hatProp&&k.hatProp.name)||null),
    areas:(G.chapters||[]).slice() }; },   // so a map can say n stars of m without being loaded
  write(){ if(!this.ok())return; try{
    const b=this.migrate(this.load())||{v:3,biome:BIOME_DEFAULT,peak:0,t:0,band:0,biomes:{}};
    const id=G.biome||BIOME_DEFAULT, s=this.slot();
    b.v=3; b.biome=id; b.biomes=b.biomes||{}; b.biomes[id]=s;
    b.peak=Math.max(b.peak||0,G.chaosPeak||0); b.t=G.playT||b.t||0; b.band=G.bandIdx||0;
    b.done=s.done; b.chapIdx=s.chapIdx; b.stars=s.stars; b.pages=s.pages; b.hats=s.hats; // the mirror
    localStorage.setItem(this.key(),JSON.stringify(b)); }catch(e){} },
  load(){ if(!this.ok())return null; try{ const r=localStorage.getItem(this.key()); return r?JSON.parse(r):null; }catch(e){ return null; } },
  /* any vintage in, v3 shape out, and the containers always exist so no caller has to test for them */
  migrate(b){ if(!b||typeof b!=='object')return null;
    const base={v:3, biome:(b.v>=3&&b.biome)||BIOME_DEFAULT,
                 peak:+b.peak||0, t:+b.t||0, band:+b.band||0, biomes:{}};
    if(b.v>=3&&b.biomes&&typeof b.biomes==='object'){ base.biomes=b.biomes; return base; }
    base.biomes[BIOME_DEFAULT]={done:b.done||[], chapIdx:+b.chapIdx||0,
      stars:b.stars||{}, pages:b.pages||{}, hats:b.hats||null,
      areas:(b.areas&&b.areas.slice())||null, from:'v'+(+b.v||1)};
    return base; },
  pick(id){ if(!this.ok())return; try{ localStorage.setItem(TOURKEY,String(id)); }catch(e){} },
  picked(){ if(!this.ok())return null; try{ const v=localStorage.getItem(TOURKEY);
    return (v&&BIOMES[v])?v:null; }catch(e){ return null; } },
  /* THE ARRIVAL IS A ONE-SHOT (TODO 38). The pick is durable - it is where you live now - but the
     flyover in must play once and not on every reload of that map, so it is a separate key, and it
     carries the run you left so the new map opens in the mode you were playing rather than at a
     title screen. peek is for boot, which has to decide whether to start a run at all; take is for
     startGame, which consumes it. */
  armArrival(to,run){ if(!this.ok())return; try{ localStorage.setItem(ARRIVEKEY,JSON.stringify(
    {to:String(to), from:G.biome||null, run:run||{mode:G.mode||1}})); }catch(e){} },
  peekArrival(){ if(!this.ok())return null; try{ const r=localStorage.getItem(ARRIVEKEY);
    const o=r?JSON.parse(r):null; return (o&&o.to&&BIOMES[o.to])?o:null; }catch(e){ return null; } },
  takeArrival(){ const o=this.peekArrival();
    if(this.ok())try{ localStorage.removeItem(ARRIVEKEY); }catch(e){}
    return o; },
  wipe(){ if(!this.ok())return; try{ localStorage.removeItem('keaSaveV1_n'); localStorage.removeItem('keaSaveV1_c');
    localStorage.removeItem(TOURKEY); localStorage.removeItem(ARRIVEKEY); }catch(e){} }
};
/* THE SLOT FOR THE MAP YOU ARE STANDING IN IS THE ONE THAT HYDRATES, and the career-wide numbers -
   peak chaos, time played, band colour - stay at the top of the blob because they are the player,
   not the map. */
function applySave(){ const blob=SAVE.migrate(SAVE.load());
  const b=blob&&blob.biomes&&blob.biomes[G.biome||BIOME_DEFAULT];
  if(!blob||!b){ starsInit(null); return renderTodo(); }
  G.chaosPeak=Math.max(G.chaosPeak||0,blob.peak||0); G.playT=blob.t||G.playT||0; G.bandIdx=blob.band||0;
  let any=false; for(const id of (b.done||[])){ const m=G.missions.find(m=>m.id===id); if(m&&!m.done){ m.done=true; any=true; } }
  if(any){
    if(G.chapters){ while(G.chapIdx<G.chapters.length-1){ const rows=G.missions.filter(x=>x.area===G.chapters[G.chapIdx]&&!x.finale&&!x.hide&&!x.bonus);
      if(rows.length&&!rows.every(x=>x.done))break; G.chapIdx++; } }
    const open=G.missions.filter(x=>!x.finale&&!x.bonus&&!x.done);
    if(open.length===0&&!G.finaleOn){ G.finaleOn=true; const f=G.missions.find(x=>x.finale); if(f)f.locked=false;
      for(const x of G.missions)if(x.bonus&&x.locked)x.locked=false;
      popup('THE FINALE UNLOCKS',(f&&f.label)||'',0,null,true); AU.fanfare&&AU.fanfare(); }
  }
  starsInit(b,blob.v);
  rewear(b.hats);
  renderTodo();
}
function rewear(hats){ // the cap may not exist yet on a fresh world: it only drops when screeched off
  if(!hats)return;
  for(let i=0;i<hats.length;i++){ const nm=hats[i], k=G.keas[i];
    if(!nm||!k||k.hatProp)continue;
    let p=G.props.find(pp=>pp.name===nm&&!pp.heldBy&&!pp.banked&&!pp.worn);
    if(!p){ const w=WEARABLE[nm]; if(!w||!PB[w.build])continue;
      p=propAt(nm,k.x,0.4,k.z,PB[w.build],{wearable:true,owner:w.owner,mission:w.mission});
      const src=G.humans.find(h=>h.key===w.owner);
      if(src&&src.hatG){ p.srcHatG=src.hatG; src._capPopped=true; } }
    k.wear(p); }
}
const P1MAP={fwd:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',flap:'Space',grab:'KeyE',scream:'KeyQ'};
const P2MAP={fwd:'ArrowUp',back:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',flap:'Slash',grab:'Period',scream:'Comma'};
if(!HEADLESS){
  addEventListener('keydown',e=>{ if(e.repeat)return; if(['Space','Tab','Slash','Period','Comma','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault(); press(e.code); });
  addEventListener('keyup',e=>release(e.code));
  addEventListener('blur',()=>KEYS.clear());
}

/* ---------- state root ---------- */
const G={
  scene:null, renderer:null, cams:[], mode:0, running:false, paused:false, headless:HEADLESS,
  time:0, frames:0, dawn:0,
  keas:[], humans:[], cars:[], props:[], inter:[], colliders:[], sheep:[],
  score:0, combo:0, comboT:0, wanted:0, wantedT:0,
  missions:[], finaleOn:false, won:false, gymOut:false, gym:null,
  stars:{}, pageChaos:{}, snow:[], squawk:null, actor:null, ledger:[], ledgerLoose:0, biome:null, vs:null, foodSrc:[],
  propReg:[],                     // REPLAT P6A: the placed world props, one record per registry entry placed

  noiseEvents:[], stats:{wipers:0,shinies:0,screeches:0,shooed:0,jams:0,snow:0,food:0},
  nestPos:{x:-4,z:-33}, nestStash:0,
  colossal:false, level:1
};
const MAXLVL=10;
/* ---------- documented crimes: real footage, then you re-enact it (2026-08-26) ---------- */
const CASEFILES=[
  {id:'jam',     vid:'FuA5tO_c7s4', at:{x:0,z:31,r:9},   title:'THE HOMER TUNNEL JOB', sub:'SH94, Milford Road — NZTA site cameras, 2016',
   blurb:'Road cones at the tunnel mouth kept moving overnight. The agency checked their own CCTV: kea, dragging cones into the live lane between cars, then hiding while traffic weaved. They titled the tape “The Kea Movie” and eventually built the birds a gym to keep them off the road. Your turn.'},
  {id:'wiper',   vid:'fBdvRCkCNfo', at:{x:2,z:17,r:9},   title:'THE POLICE CAR INCIDENT', sub:'South Island — filmed 2011',
   blurb:'Two kea were filmed calmly disassembling a parked police car — wipers first. Nobody was arrested, because you cannot arrest a kea. Recreate the classic: three cars, three wipers.'},
  {id:'seal',    vid:'c6vY0s83NLg', at:{x:-11,z:8,r:7},  title:'RUBBER, GENERALLY', sub:'kea country — an ongoing pattern of offending',
   blurb:'Rental companies fear them for a reason: wiper blades peeled “like string cheese”, then the window gaskets, then the door seals, then the aerial. Whole trims stripped in minutes. The campervan is right there.'},
  {id:'passport',vid:'WvHZy9i9LMA', at:{x:15,z:-13,r:7}, title:'THE VALUABLES DEPARTMENT', sub:'Fiordland — GoPro, 2022 · passport, 2009 · £600 cash, 2013',
   blurb:'A kea snatched a family’s GoPro off a hut balcony and filmed its own getaway over the bush. Another took a Scottish tourist’s passport from a Milford bus. Another, six hundred quid from a car. Documented. Repeatedly. There’s a handbag on that picnic table.'},
  {id:'bootroad',vid:'7N_ggTVKQWE', at:{x:33,z:-8,r:7},  title:'FOOTWEAR, UNATTENDED', sub:'carparks and camps, everywhere south of Arthur’s',
   blurb:'They chew tourists’ shoes while the tourists film it. DOC’s advice amounts to: do not leave boots outside. The tramper has left his boots outside. One of them belongs in the middle of the road.'},
  {id:'slide',   vid:'8OgxNr3hw5c', at:{x:-24,z:-9,r:9}, title:'SNOW CONDUCT', sub:'alpine kea — snow play, on the record',
   blurb:'Kea treat fresh snow as playground equipment — rolling, digging, sliding. The hut roof has a pitch, a snow cap, and no rules against it. Toboggan it.'},
];
function checkCaseFiles(){
  if(HEADLESS||G.cfOpen)return;
  G.cfCd=Math.max(0,(G.cfCd||0)-0.016);
  if(G.cfCd>0)return;
  for(const cf of CASEFILES){
    if(cf.seen)continue;
    const m=G.missions.find(x=>x.id===cf.id); if(!m||m.done||m.locked)continue;
    for(const k of G.keas){ if(dist2(k.x,k.z,cf.at.x,cf.at.z)<cf.at.r){ cf.seen=true; openCaseFile(cf,m); return; } }
  }
}
function openCaseFile(cf,m){
  G.cfOpen=true; G.paused=true; G._cfM=m;
  el('cftitle').textContent=cf.title; el('cfsub').textContent=cf.sub; el('cfblurb').textContent=cf.blurb;
  el('cfframe').src='https://www.youtube-nocookie.com/embed/'+cf.vid+'?rel=0&modestbranding=1';
  el('cfback').classList.add('open'); AU.tick();
}
function closeCaseFile(reenact){
  el('cfback').classList.remove('open'); el('cfframe').src='';
  G.cfOpen=false; G.paused=false; G.cfCd=2;
  if(reenact&&G._cfM){ popup('RE-ENACT THE CRIME','▸ '+G._cfM.label.toUpperCase(),0,null,true); flashTodo(); AU.ding(); }
  G._cfM=null;
}
function lvlThresh(n){ return Math.round(42*Math.pow(n,1.55)); } // cumulative chaos to REACH level n+1
function sizeForLevel(n){ return 1+0.21*(n-1); }                 // teeny-tiny bigger, every time
function levelUp(){
  G.level++; const S=sizeForLevel(G.level);
  for(const k of G.keas){ k.size=S; k.g.scale.setScalar(0.7*S); }
  AU.fanfare(); AU.screech(1/Math.sqrt(S)); G.shake=Math.max(G.shake||0,0.3);
  for(const k of G.keas)burst(k.pos(),0xFF8A2E,14);
  popup('GROWTH SPURT — LEVEL '+G.level,(G.level>=MAXLVL?'FULLY GROWN':'+'+Math.round((S-1)*100)+'% kea'),0,null,false,true);
  renderTodo();
}

/* ---------- scene ---------- */
function initScene(){
  G.scene=new THREE.Scene();
  /* REPLAT P2: exponential fog, tuned to the sky. See the SKY block for why the near/far pair
     went away and why the colour moved toward the dome's own horizon. */
  G.scene.fog=new THREE.FogExp2(SKY.fogDay,SKY.fogDensityDay);
  G.scene.environmentIntensity=SKY.envIntensityDay;
  G.scene.environmentRotation.set(0,SKY.envRotationY,0);
  /* IBL PROVENANCE LIVES IN SCENE STATE, and it is declared HERE — in the headless path — rather
     than only where the texture is built. P2's proof is "IBL present in scene state", and the
     PMREM convolution needs a WebGL renderer, so a battery running in node can never see the
     texture itself. What it CAN see, and now does, is the contract: which source is meant to be
     installed, at what intensity, at what rotation, and whether anything has actually claimed
     the slot. initRenderer marks it 'painted' when it installs the fallback gradient and
     src/sky.mjs marks it 'hdri' when the real file lands, so `G.ibl.mode` distinguishes the
     three states — unclaimed, degraded, and correct — instead of collapsing them into one. */
  G.ibl={mode:'none',source:SKY.hdri,intensity:SKY.envIntensityDay,rotationY:SKY.envRotationY,pmrem:false};
  /* REPLAT P3: MATERIAL PROVENANCE IN SCENE STATE, the same shape and for the same reason as
     G.ibl above. A capture pass and a battery both need to find out WHICH of the two possible
     worlds they are looking at — the scanned one or the palette-coloured fallback — and the answer
     has to be readable rather than inferred from pixels. `mode` is 'none' until something installs
     the textures; the browser sets it to 'scanned' (or leaves it and records the failure) exactly
     as installSky does, and webrig refuses to photograph the wrong one. */
  G.mats=matState();
  const hemi=new THREE.HemisphereLight(SKY.hemiSkyDay,SKY.hemiGroundDay,SKY.hemiIntensityDay*LX_HEMI); G.scene.add(hemi); G.hemi=hemi;
  const sun=new THREE.DirectionalLight(SKY.sunDay,SKY.sunIntensityDay*LX_DIR);
  sun.position.set(SKY.sunPosDay[0],SKY.sunPosDay[1],SKY.sunPosDay[2]);
  /* THE SHADOW CONFIG CAME OUT OF THE HEADLESS GUARD, deliberately. Every line below sets a
     number or a boolean on an object three constructs regardless; not one of them allocates a
     shadow map, which is the renderer's job and still only happens in a browser. Under the old
     guard "shadow casting on" was unprovable by any battery — the flag simply did not exist in
     node — so P2's second proof would have rested on the eye alone. It is asserted now.
     The per-MESH castShadow guards are untouched: those are thousands of meshes, not one light. */
  sun.castShadow=true;
  sun.shadow.mapSize.set(SKY.shadowMap,SKY.shadowMap);
  sun.shadow.radius=SKY.shadowRadius; sun.shadow.blurSamples=SKY.shadowBlur;
  sun.shadow.bias=SKY.shadowBias; sun.shadow.normalBias=SKY.shadowNormalBias;
  { const sc=sun.shadow.camera, E=SKY.shadowExtent;
    sc.left=-E;sc.right=E;sc.top=E;sc.bottom=-E;sc.far=SKY.shadowFar; sc.updateProjectionMatrix(); }
  G.scene.add(sun); G.sun=sun;
  const fill=new THREE.DirectionalLight(0x9FB6C8,SKY.fillIntensityDay*LX_DIR); fill.position.set(30,20,-30); G.scene.add(fill); G.fill=fill;
  const rim=new THREE.DirectionalLight(0xFFE2B8,SKY.rimIntensityDay*LX_DIR); rim.position.set(20,10,44); G.scene.add(rim); G.rim=rim;
  const moon=new THREE.Mesh(new THREE.SphereGeometry(4.5,12,10),new THREE.MeshBasicMaterial({color:0xEAF2FF,fog:false}));
  moon.position.set(58,74,-52); moon.visible=false; G.scene.add(moon); G.moon=moon;
  buildSky();
}
function buildSky(){
  // gradient dome
  const sg=new THREE.SphereGeometry(210,20,14);
  const cols=[]; const pos=sg.attributes.position; const cTop=new THREE.Color(PAL.skyTop).convertSRGBToLinear(),cMid=new THREE.Color(PAL.skyMid).convertSRGBToLinear(),cLow=new THREE.Color(PAL.skyLow).convertSRGBToLinear();
  for(let i=0;i<pos.count;i++){ const y=pos.getY(i)/210; const c=y>0.25?cTop.clone().lerp(cMid,1-(y-0.25)/0.75):cMid.clone().lerp(cLow,1-Math.max(0,(y+0.15)/0.4));
    cols.push(c.r,c.g,c.b); }
  sg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  const sky=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false}));
  G.scene.add(sky); G.sky=sky; sky.material.color=new THREE.Color(0xFFFFFF);
  // horizon haze band
  const haze=new THREE.Mesh(new THREE.CylinderGeometry(206,206,26,24,1,true),
    new THREE.MeshBasicMaterial({color:0xC3D2DC,transparent:true,opacity:0.45,side:THREE.BackSide,fog:false}));
  G.haze=haze;
  haze.position.y=8; G.scene.add(haze);
  // one soft sun — a glow, not a circle
  if(!HEADLESS){ const sc2=document.createElement('canvas'); sc2.width=sc2.height=128; const sg2=sc2.getContext('2d');
    const gr=sg2.createRadialGradient(64,64,4,64,64,62);
    gr.addColorStop(0,'rgba(255,248,230,1)'); gr.addColorStop(0.25,'rgba(255,242,214,0.85)'); gr.addColorStop(1,'rgba(255,238,205,0)');
    sg2.fillStyle=gr; sg2.fillRect(0,0,128,128);
    const spr=new THREE.Mesh(new THREE.PlaneGeometry(52,52),
      new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
    spr.position.set(-140,40,66); spr.lookAt(0,14,0); G.scene.add(spr); }
  // clouds: bright tops, grey bellies, drifting flat
  for(let i=0;i<8;i++){ const cg=new THREE.Group(); const n=3+((i*7)%3);
    for(let j=0;j<n;j++){ const r=rnd(6,12);
      const top=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),new THREE.MeshBasicMaterial({color:PAL.cloud,transparent:true,opacity:0.95}));
      top.position.set(j*rnd(5,8)-n*3,rnd(-0.5,1.5),rnd(-2,2)); top.scale.y=0.32; cg.add(top);
      const belly=new THREE.Mesh(new THREE.SphereGeometry(r*0.85,10,8),new THREE.MeshBasicMaterial({color:0xAEBBC6,transparent:true,opacity:0.5}));
      belly.position.copy(top.position); belly.position.y-=r*0.14; belly.scale.y=0.2; cg.add(belly); }
    cg.position.set(rnd(-140,140),rnd(36,62),rnd(-160,-70)); if(i%2)cg.position.z=rnd(90,160);
    G.scene.add(cg); }
}

/* ---------- collider helpers ---------- */
function addBoxCollider(x,z,w,d,top,solid,ry){ G.colliders.push({kind:'box',x,z,w:w/2,d:d/2,top,solid:solid!==false,ry:ry||0}); }
/* A RAIL IS A SURFACE (TODO 63). The three of them - ski rack, boot rail, clothesline - held nothing
   because a mesh is not a collider, and the prop physics only knows about colliders. railTop declares
   the top of a thing you can REST something on: never solid, because a rail is something a kea perches
   and walks over rather than something that stops it, and generous in depth, because a builder placing
   a ski on a rack aims for the rail rather than for a 6cm strip down the middle of it.
   THE PROPS THAT SIT ON ONE ARE PLACED AT THEIR RESTING HEIGHT - top plus the 8cm the physics allows
   every prop - so that nothing pops upward on the first frame. That is the difference between a prop
   that rests where it was placed and a prop that is merely caught by something. */
function railTop(x,z,w,d,top,ry){ addBoxCollider(x,z,w,d,top,false,ry); return top+0.08; }
function groundHeightAt(x,z,curY){
  let h=0;
  for(const c of G.colliders){
    let lx=x-c.x, lz=z-c.z;
    if(c.ry){ const sn=Math.sin(c.ry),cs=Math.cos(c.ry); const tx=lx*cs-lz*sn, tz=lx*sn+lz*cs; lx=tx; lz=tz; }
    if(Math.abs(lx)<=c.w && Math.abs(lz)<=c.d){
      if(c.kind==='box'){ if(curY>=c.top-0.55 && c.top>h) h=c.top; }
      else if(c.kind==='roof'){ const rh=c.ridge - Math.abs(z-c.z)*c.slope; if(curY>=rh-0.7 && rh>h) h=rh; }
    }
  }
  return h;
}
function pushOut(k,rad){ // horizontal separation from solid boxes below their top; rotation-aware
  const R=(rad!==undefined?rad:0.28*(k.size||1));
  for(const c of G.colliders){ if(!c.solid||c.kind!=='box')continue;
    let dx=k.x-c.x, dz=k.z-c.z;
    if(c.ry){ const sn=Math.sin(c.ry),cs=Math.cos(c.ry); const lx=dx*cs-dz*sn, lz=dx*sn+dz*cs; dx=lx; dz=lz; }
    const ky=(k.y!==undefined?k.y:0);
    if(Math.abs(dx)<c.w+R && Math.abs(dz)<c.d+R && ky<c.top-0.15){
      const ox=(c.w+R)-Math.abs(dx), oz=(c.d+R)-Math.abs(dz);
      let px=0,pz=0;
      if(ox<oz) px=Math.sign(dx||0.01)*ox; else pz=Math.sign(dz||0.01)*oz;
      if(c.ry){ const sn=Math.sin(c.ry),cs=Math.cos(c.ry); k.x+=px*cs+pz*sn; k.z+=-px*sn+pz*cs; }
      else { k.x+=px; k.z+=pz; }
    } }
  const B=52; k.x=clamp(k.x,-B,B); k.z=clamp(k.z,-B,B);
}

/* ---------- geometry helpers ---------- */
function box(w,h,d,c,x,y,z,parent,opts){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), (opts&&opts.mats)||mat(c));
  matUV(m);                                   // REPLAT P3: texel density, per face, in metres
  m.position.set(x||0,y||0,z||0);
  if(!HEADLESS && !(opts&&opts.noshadow)){m.castShadow=true;m.receiveShadow=true;}
  (parent||G.scene).add(m); return m;
}
function cyl(rt,rb,h,c,x,y,z,parent,seg){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||10),mat(c));
  matUV(m);
  m.position.set(x||0,y||0,z||0);
  if(!HEADLESS){m.castShadow=true;m.receiveShadow=true;}
  (parent||G.scene).add(m); return m;
}
function sph(r,c,x,y,z,parent,seg){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,seg||12,seg||10),mat(c));
  matUV(m);
  m.position.set(x||0,y||0,z||0);
  if(!HEADLESS){m.castShadow=true;}
  (parent||G.scene).add(m); return m;
}
const RBG={}; // rounded-box geometry cache
// FACET NORMALS (2026-09-01): rbox is an ExtrudeGeometry with bevelSegments 3 and curveSegments 5,
// and ExtrudeGeometry is NON-INDEXED - every triangle carries its own three vertices and its own
// flat normal. That is the shading banding on the ute bonnet and the caravan roofline. Note the
// briefed fix, computeVertexNormals, is a NO-OP here for exactly that reason: with no shared
// vertices there is nothing to average, so it recomputes the same flat facets.
// What works is averaging normals across vertices that share a POSITION, and only across those
// whose normals already lie within SMOOTH_DEG of each other - so the bevel and arc facet joins
// smooth out while the genuine box edges stay crisp. Vertex and triangle counts are untouched and
// not one position moves, so the silhouette is bit-identical.
// The threshold is measured, not invented: on the car body shell (2.0 x 0.55 x 4.2, r 0.16) the
// per-position normal-angle histogram is 15deg:166, 30deg:168, then NOTHING until 45deg:7, with a
// handful at 90 and 150-180. 37 sits in that valley.
const SMOOTH_DEG=37;
const SMOOTHSTAT={geos:0,verts:0};
function smoothFacetNormals(g){
  const pos=g.attributes.position, nor=g.attributes.normal;
  if(!pos||!nor||g.index)return g;                       // indexed geometry already shares normals
  const byPos=new Map();
  for(let i=0;i<pos.count;i++){
    const k=pos.getX(i).toFixed(4)+'_'+pos.getY(i).toFixed(4)+'_'+pos.getZ(i).toFixed(4);
    let a=byPos.get(k); if(!a){ a=[]; byPos.set(k,a); } a.push(i);
  }
  // NOTE, measured: ExtrudeGeometry emits 6 exactly-zero normals per rounded box, and they belong
  // to exactly TWO ZERO-AREA triangles (verified against a bare three ExtrudeGeometry, so it is
  // upstream). Zero-area triangles rasterize to nothing, so there is no black facet to fix and no
  // repair here. The averaging below leaves those normals alone because a zero normal fails its own
  // in-threshold test, which is the behaviour we want.
  const lim=Math.cos(SMOOTH_DEG*Math.PI/180);
  const out=new Float32Array(nor.count*3);
  for(const idx of byPos.values()) for(const i of idx){
    const nx=nor.getX(i), ny=nor.getY(i), nz=nor.getZ(i);
    let ax=0,ay=0,az=0;
    for(const j of idx){
      const mx=nor.getX(j), my=nor.getY(j), mz=nor.getZ(j);
      if(nx*mx+ny*my+nz*mz<lim)continue;                 // a real edge - do not blend across it
      ax+=mx; ay+=my; az+=mz;
    }
    const L=Math.hypot(ax,ay,az);
    if(L>1e-6){ out[i*3]=ax/L; out[i*3+1]=ay/L; out[i*3+2]=az/L; }
    else { out[i*3]=nx; out[i*3+1]=ny; out[i*3+2]=nz; }
  }
  nor.copyArray(out); nor.needsUpdate=true;
  SMOOTHSTAT.geos++; SMOOTHSTAT.verts+=pos.count;
  return g;
}
/* REPLAT P3 gave this function ONE new argument and no new behaviour by default.
   `uvY` asks for a variant whose UVs put WORLD Y ON V ON EVERY FACE, cached under its own key so
   the plain geometry every other caller shares cannot be poisoned by it (glassRamp learned that
   lesson the hard way and clones; a second cache key is cheaper and cannot be forgotten).

   WHY IT IS NEEDED, AND IT IS THE SAME DEFECT glassRamp's COMMENT GAVE UP ON. An ExtrudeGeometry's
   UVs are in MODEL UNITS already, which is exactly what texel density wants — no rescale at all.
   But three's WorldUVGenerator lays the cap faces down as (x,y) and the side walls as (y,-z) or
   (x,-z), so world Y lands on V on the caps and on U on the two end walls. For an untextured
   colour that is invisible. For a WEATHERBOARD it is not: the laps run horizontally across the
   hut's front and back and then turn ninety degrees and run vertically down its gable ends. Same
   for a corrugate rib. So the end walls get u and v swapped, which is the one thing that makes
   world Y land on V everywhere, and the branch is chosen from the VERTEX NORMAL rather than from
   the vertex position — a swapped wall is one whose normal points along x.
   THE BEVEL CORNERS ARE THE HONEST LIMIT. smoothFacetNormals blends the normals in the corner
   radius, so a handful of vertices inside a 100 mm fillet take whichever branch their blended
   normal falls on. That is a sub-centimetre smear on a rounded corner, and it is a much smaller
   error than a wall of vertical weatherboard. */
function roundedBoxGeo(w,h,d,r,uvY){
  const k=[w,h,d,r].join('_')+(uvY?'_uvY':''); if(RBG[k])return RBG[k];
  r=Math.min(r,w/2-0.001,h/2-0.001);
  const sh=new THREE.Shape();
  const hw=w/2-r,hh=h/2-r;
  sh.moveTo(-hw, -h/2); sh.lineTo(hw,-h/2); sh.absarc(hw,-hh,r,-Math.PI/2,0,false);
  sh.lineTo(w/2,hh); sh.absarc(hw,hh,r,0,Math.PI/2,false);
  sh.lineTo(-hw,h/2); sh.absarc(-hw,hh,r,Math.PI/2,Math.PI,false);
  sh.lineTo(-w/2,-hh); sh.absarc(-hw,-hh,r,Math.PI,Math.PI*1.5,false);
  const g=new THREE.ExtrudeGeometry(sh,{depth:d-r*2,bevelEnabled:true,bevelThickness:r,bevelSize:r*0.92,bevelSegments:3,curveSegments:5});
  g.translate(0,0,-(d-r*2)/2); smoothFacetNormals(g);
  if(uvY){ const uv=g.attributes.uv, ps=g.attributes.position;
    /* THE SWAP READS THE UV ITSELF, PER TRIANGLE. Two earlier cuts of this got it wrong and the
       battery caught both, which is the whole reason the check measures spans instead of trusting
       the helper:
         CUT 1 filtered on the vertex normal over the WHOLE geometry, and swapped LID vertices —
           smoothFacetNormals blends normals across the corner fillets, so cap vertices near the
           wall's vertical edges come out x-dominant. A 7 m wall face read 7.07 on V.
         CUT 2 scoped that filter to the side-wall group, which fixed the lids and NOT the walls:
           measured, all three normal-dominance buckets inside group 1 span the same 7.07, because
           three bevel segments of blended normal contaminate every bucket with its neighbours.
           The normal is simply not a discriminator on a rounded box.
       WHAT IS EXACT IS THE UV. three's WorldUVGenerator writes side-wall u as the RAW local
       coordinate it chose — a_y on a wall of constant x, a_x on a wall of constant y — so a vertex
       whose u equals its own position.y is on a vertical end wall and wants the swap, and one
       whose u equals its position.x is already horizontal and does not. No tolerance stack, no
       blended anything: it is the same float. Decided per TRIANGLE by majority because the
       generator assigns per quad, and because a vertex that happens to sit at x === y is ambiguous
       on its own and is not ambiguous alongside its two neighbours. */
    const wall=(g.groups||[]).find(gr=>gr.materialIndex===1);
    const lo=wall?wall.start:0, hi=Math.min(wall?wall.start+wall.count:0,uv.count);
    for(let t=lo;t+2<hi;t+=3){
      let yv=0,xv=0;
      for(let k=0;k<3;k++){ const u=uv.getX(t+k);
        if(Math.abs(u-ps.getY(t+k))<1e-6)yv++; if(Math.abs(u-ps.getX(t+k))<1e-6)xv++; }
      if(yv<=xv)continue;                       // already horizontal, or genuinely ambiguous
      for(let k=0;k<3;k++) uv.setXY(t+k,uv.getY(t+k),uv.getX(t+k)); }
    uv.needsUpdate=true; }
  RBG[k]=g; return g;
}
function rbox(w,h,d,r,c,x,y,z,parent,opts){
  /* the material is resolved FIRST, because whether this is a scanned family decides which
     geometry variant to ask for — and an ExtrudeGeometry needs no UV rescale either way, its
     units are already metres. */
  const mt=(opts&&opts.mats)||mat(c,opts&&opts.extra);
  const m=new THREE.Mesh(roundedBoxGeo(w,h,d,r,!!(mt.userData&&mt.userData.matFamily)),mt);
  m.position.set(x||0,y||0,z||0);
  if(!HEADLESS&&!(opts&&opts.noshadow)){m.castShadow=true;m.receiveShadow=true;}
  (parent||G.scene).add(m); return m;
}
const GLASSX={vertexColors:true};                  // one memo key for every pane, warm windows included
const GLASSTOP=[0.90,0.945,1.00], GLASSBOT=[1.00,1.020,1.01]; // sky at the head, near-white at the sill
function glassRamp(m){
  // MEASURED, not assumed: rbox is an ExtrudeGeometry, so its UVs are in MODEL UNITS
  // (v spans -h/2..h/2 on a cap) and world y lands on V on the cap faces but on U on the
  // side walls. No single texture can be vertical on both - see DIRECTION.md on rbox UVs.
  // So the ramp rides VERTEX Y, which every face of every pane agrees on.
  const g=m.geometry=m.geometry.clone();           // roundedBoxGeo caches by dims; do not poison it
  const p=g.attributes.position; g.computeBoundingBox();
  const y0=g.boundingBox.min.y, sp=Math.max(1e-6,g.boundingBox.max.y-y0);
  const col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){ const t=(p.getY(i)-y0)/sp;   // 0 at the sill, 1 at the head
    for(let c=0;c<3;c++)col[i*3+c]=GLASSBOT[c]+(GLASSTOP[c]-GLASSBOT[c])*t; }
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  // register the MATERIALS, not the meshes: cars spawn and despawn panes all match, so a
  // mesh list would pile up refs to dead traffic. Two materials, and the scene owns the rest.
  const GM=G.glassMats=G.glassMats||[]; if(GM.indexOf(m.material)<0)GM.push(m.material);
  return m;
}
function pane(w,h,d,r,c,x,y,z,parent){ // glazing: the glass material plus its vertical sky ramp
  return glassRamp(rbox(w,h,d,r,0,x,y,z,parent,{noshadow:true,mats:mat(c,GLASSX)})); }
function capsule(r,h,c,x,y,z,parent){
  const g=new THREE.Group(); g.position.set(x||0,y||0,z||0);
  cyl(r,r,Math.max(0.01,h-r*2),c,0,0,0,g,14);
  sph(r,c,0,(h-r*2)/2,0,g,12); sph(r,c,0,-(h-r*2)/2,0,g,12);
  (parent||G.scene).add(g); return g;
}
const HULLMAT={};
function hull(mesh,thick,tint){ // inverted-hull outline (retired in v4 'lawn' style)
  if(HEADLESS||!STYLE.outlines)return null;
  const k=tint||0x2E2A26; if(!HULLMAT[k])HULLMAT[k]=new THREE.MeshBasicMaterial({color:k,side:THREE.BackSide});
  const o=new THREE.Mesh(mesh.geometry,HULLMAT[k]);
  o.scale.setScalar(1+(thick||0.045)); mesh.add(o); return o;
}
let BLOBTEX=null;
function blob(parent,r,op){ // soft contact shadow
  if(HEADLESS)return {position:{set:()=>{}},scale:{setScalar:()=>{}},material:{opacity:0}};
  if(!BLOBTEX){ const cv=document.createElement('canvas'); cv.width=cv.height=64; const g=cv.getContext('2d');
    const gr=g.createRadialGradient(32,32,4,32,32,30); gr.addColorStop(0,'rgba(30,40,35,0.55)'); gr.addColorStop(1,'rgba(30,40,35,0)');
    g.fillStyle=gr; g.fillRect(0,0,64,64); BLOBTEX=new THREE.CanvasTexture(cv); }
  const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),new THREE.MeshBasicMaterial({map:BLOBTEX,transparent:true,depthWrite:false,opacity:op||1}));
  m.rotation.x=-Math.PI/2; m.position.y=0.02; m.renderOrder=1; parent.add(m); return m;
}
/* ---------- tween runner (choreography layer) ---------- */
const TW={list:[],
  add(dur,fn,done,ease){ this.list.push({t:0,dur,fn,done,ease:ease||(u=>u*u*(3-2*u))}); },
  step(dt){ for(let i=this.list.length-1;i>=0;i--){ const w=this.list[i]; w.t+=dt;
    const u=Math.min(1,w.t/w.dur); w.fn(w.ease(u),u);
    if(u>=1){ this.list.splice(i,1); if(w.done)w.done(); } } }
};

/* ---------- the lawn (v4): instanced wind grass ---------- */
/* one blade pose. Tussock is wind-combed and clumped, never a lawn of upright spikes: the
   whole field leans one way, the breeze wanders across it, and height comes in patches.
   Lives outside buildGrass so the gate can read it with no canvas. */
/* THE COMB, ON THE CPU. P4 moved every per-blade decision into the vertex shader, so this is no
   longer the field's pose function — it is the seam the 260 TUFT CONES still use, and it exists so
   that the tufts and the blades share ONE set of comb constants rather than two copies that can
   drift. The shader's `dir` line is generated from the same GRASS.comb block by string
   interpolation, which is what makes "the tufts take the same comb as the blades" a fact rather
   than a comment. The gate asserts both halves read the same numbers. */
function grassComb(x,z){
  const C=GRASS.comb;
  return C.base+C.amp*Math.sin(x*C.fx+z*C.fz);
}
function grassTuftPose(x,z){
  const B=GRASS.biomes.carpark;
  const lean=B.lean[0]+(B.lean[1]-B.lean[0])*(0.5+0.5*Math.sin(x*0.031-z*0.047))+rnd(0,0.06);
  const cell=Math.abs(Math.sin(Math.floor(x/2.5)*39.34+Math.floor(z/2.5)*11.13)*24634.6)%1;
  return {yaw:rnd(0,Math.PI), dir:grassComb(x,z), lean, cell,
          h:(B.h[0]+(B.h[1]-B.h[0])*RNGF())*(0.72+cell*0.56), w:0.85+cell*0.5};
}

/* ---------- REPLAT P4: THE GRASS SHADER ----------
   Same discipline as the P3b breakup and for the same reason: three hands onBeforeCompile a shader
   whose `#include` directives are STILL UNRESOLVED, so surgery written against expanded chunk text
   matches nothing, throws nothing, and ships a field with no wind that looks almost right. That
   defect cost session 17 half a day. Every substring is validated at module scope against the
   three that is installed, and G.grass reports whether it took. */
const GRASS_PATCH=[
  ['begin_vertex',[
    ['vec3 transformed = vec3( position );',
     'vec3 transformed = vec3( position );\n\tkeaGrass( transformed );']]],
  ['lights_fragment_end',[
    ['#if defined( RE_IndirectDiffuse )',
     'reflectedLight.indirectDiffuse += keaGrassTrans();\n#if defined( RE_IndirectDiffuse )']]],
];
/* THE DIFFUSE DECLARATION IS NOT A CHUNK — it is a line in meshphysical_frag's own body, so it
   cannot be validated the same way and gets its own check against the shader three ships. */
const GRASS_DIFFUSE_LINE='vec4 diffuseColor = vec4( diffuse, opacity );';
const GRASS_OK=(()=>{
  const C=THREE.ShaderChunk||{};
  for(const [n,pairs] of GRASS_PATCH){
    if(typeof C[n]!=='string')return 'three has no ShaderChunk.'+n;
    for(const [from] of pairs) if(C[n].indexOf(from)<0)return 'ShaderChunk.'+n+' no longer contains: '+from;
  }
  const F=(THREE.ShaderLib&&THREE.ShaderLib.physical&&THREE.ShaderLib.physical.fragmentShader)||'';
  if(F.indexOf(GRASS_DIFFUSE_LINE)<0)return 'meshphysical_frag no longer declares: '+GRASS_DIFFUSE_LINE;
  return true;
})();
if(GRASS_OK!==true&&typeof console!=='undefined')
  console.error('grass: the blade shader did not install — '+GRASS_OK);

const GRASS_GLSL_V=`
#define COMB_BASE ${GRASS.comb.base.toFixed(6)}
#define COMB_AMP  ${GRASS.comb.amp.toFixed(6)}
#define COMB_FX   ${GRASS.comb.fx.toFixed(6)}
#define COMB_FZ   ${GRASS.comb.fz.toFixed(6)}
attribute vec2 aOff;
uniform vec2 uAnchor;
uniform float uTime, uNear, uLodNear, uLodFar, uBand, uComp;
uniform float uGust, uFlutter, uGustHz, uFlutterHz, uGustM;
uniform float uClumpM, uClumpJit, uClumpPull, uClumpPullVar, uBare;
uniform float uBlobScan, uBareScale, uBareSoft, uEdgeVar, uCutSoft;
uniform vec2 uHmul; uniform float uHamp;
uniform vec4 uCuts[GRASS_CUTS];               // xz centre, xz half-extent; w<=0 disables
uniform vec2 uHrange, uWrange, uLrange;
uniform vec3 uTintA, uTintB, uTintC, uTintBase, uTintTip;
uniform float uSeed;
varying float vGrassT;
varying vec3 vGrassW;
varying vec3 vGrassTint;
varying vec3 vGrassBase;
varying vec3 vGrassTip;
varying float vGrassSeed;
float keaGH(vec2 p){
  vec3 q=fract(vec3(p.xyx)*0.1031);
  q+=dot(q,q.yzx+33.33);
  return fract((q.x+q.y)*q.z);
}
vec2 keaGH2(vec2 p){
  vec3 q=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
  q+=dot(q,q.yzx+33.33);
  return fract((q.xx+q.yz)*q.zy);
}
/* SMOOTH NOISE, for the two things that must not have cell edges: where the ground is bare, and
   where the field stops. Both were step functions of a square cell before. */
float keaVal(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(keaGH(i),keaGH(i+vec2(1.0,0.0)),u.x),
             mix(keaGH(i+vec2(0.0,1.0)),keaGH(i+vec2(1.0,1.0)),u.x),u.y);
}
float keaFbm(vec2 p){ return keaVal(p)*0.62+keaVal(p*2.17+7.3)*0.38; }
/* ---- THE CUT-OUTS ARE SOFT NOW, AND THE FAR TIER IS WHAT EXPOSED THEM — REPLAT P4e ----
   This was "abs(w.x-c.x)<c.z && abs(w.y-c.y)<c.w": a hard axis-aligned box test that killed a
   blade outright. Every cut-out therefore ended in a RULED RIGHT ANGLE — the same defect P4c and
   P4d spent two sessions removing from the mound lattice — and nobody had seen it because the
   field faded out at fourteen metres and the car park is thirty away. Give the grass the range to
   reach the tarmac and it arrives at it along a straight line.
   A SIGNED DISTANCE TO THE BOX, then a ramp. Negative inside, so the surfaces stay swept exactly
   as they were and no blade can grow through the road; the ramp lives entirely OUTSIDE the box, so
   the batteries that assert the cut-outs cover the road still hold to the millimetre.
   THE NOISE VARIES THE RAMP'S WIDTH, NOT ITS POSITION, which is the safe way round: at sd<=0 the
   smoothstep is zero whatever the noise says, so a verge can wander in how far it thins but can
   never put a blade inside the box. */
float keaCutK(vec4 c, vec2 w, float soft){
  if(c.w<=0.0) return 1.0;
  vec2 d=abs(w-c.xy)-c.zw;
  float sd=min(max(d.x,d.y),0.0)+length(max(d,0.0));
  float n=(keaFbm(w*0.22)-0.5)*2.0;
  return smoothstep(0.0, max(0.05, soft*(1.0+n*0.6)), sd);
}
void keaGrass(inout vec3 t){
  /* ---- WHERE THIS BLADE STANDS ----
     The lattice offset is a fixed point on a unit disc; the anchor is the camera, snapped to a
     grid so the field does not swim as the camera creeps. Every property below is then hashed from
     the resulting WORLD position, never from the instance index — which is the whole trick: when
     the anchor snaps and a blade lands on a new patch of ground, it takes on that patch's blade
     instead of carrying its own appearance across the world. */
  vec2 w=uAnchor+aOff*uNear;

  /* ---- CLUMPING ----
     nz_tussock_01 is discrete mounds with open ground between them, and a uniform scatter cannot
     read as that at any density. Blades are pulled toward their cell's jittered centre, and whole
     cells are dropped so the ground between mounds is genuinely bare. */
  /* ---- WHICH MOUND THIS BLADE BELONGS TO ----
     THE NEAREST FEATURE POINT IN THE 3x3 NEIGHBOURHOOD, not the centre of its own cell. One mound
     per square cell is a square lattice however hard the centre is jittered, because every cell
     contributes exactly one mound and its territory is the cell. Taking the nearest of nine makes
     the territories irregular polygons whose edges follow no cell boundary at all — and a blade
     near a cell edge is pulled to whichever mound is actually closer, which is the whole point.
     REPLAT P4d: THE SEARCH IS NO LONGER SKIPPED FOR A SMALL PULL, and the sentence that used to
     sit here ("the cover layer sits at 0.10 and gathers almost nothing, so nine hash lookups per
     vertex would buy it nothing") is the bug Eric photographed twice. A pull of p moves every
     blade p of the way toward its centre, which empties a p-wide margin along every cell EDGE —
     so a tiny pull on a square cell does not draw a faint grid, it draws a grid of straight bare
     LANES, which is the most legible artefact a field can have. The gate is GRASS.blobMinPull and
     it is zero: any pull at all earns the nine lookups. */
  vec2 base=floor(w/uClumpM);
  vec2 cell=base, cc=(base+0.5+(keaGH2(base)-0.5)*uClumpJit)*uClumpM;
  if(uBlobScan>0.5){
    float bestD=1e9;
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
      vec2 cn=base+vec2(float(i),float(j));
      vec2 pt=(cn+0.5+(keaGH2(cn)-0.5)*uClumpJit)*uClumpM;
      vec2 dv=pt-w; float dd=dot(dv,dv);
      if(dd<bestD){ bestD=dd; cc=pt; cell=cn; } }
  }
  /* the pull varies PER MOUND, so some are tight and some are spread */
  float pull=clamp(uClumpPull+(keaGH(cell*2.9+5.3)-0.5)*2.0*uClumpPullVar,0.0,0.9);
  w=mix(w,cc,pull);
  /* ---- WHERE THE GROUND IS BARE ----
     A SMOOTH FIELD, NOT A PER-CELL STEP. Culling whole square cells is what put right angles in
     the middle of the country; a noise field gives a bare patch an outline that wanders. */
  float alive=uBare<=0.0?1.0
    :smoothstep(uBare-uBareSoft,uBare+uBareSoft,keaFbm(w*uBareScale));

  /* the places grass does not grow: road, carpark, hut slab, pen — or piste, tow line, lodge, or
     a village street and its footpaths.
     MULTIPLIED, not branched: soft factors, so two overlapping cut-outs thin each other rather
     than one of them winning outright at a seam between them. A LOOP over a uniform array now
     rather than N hand-written multiplies — same arithmetic, and the count is GRASS.cuts. A
     disabled box (w<=0) contributes exactly 1.0, so padding costs nothing but the iteration. */
  for(int ci=0;ci<GRASS_CUTS;ci++) alive*=keaCutK(uCuts[ci],w,uCutSoft);

  /* ---- THIS BLADE'S POSE, all of it hashed from the world position ---- */
  vec2 h1=keaGH2(w*0.911), h2=keaGH2(w*1.703+11.7);
  float cw=keaGH(cell*0.37+7.7);                       // the mound's own weight: a mound agrees
  float hgt=mix(uHrange.x,uHrange.y,h1.x)*(0.72+cw*0.56);
  float wid=mix(uWrange.x,uWrange.y,h1.y);
  float yaw=h2.x*3.14159265;
  float lean=mix(uLrange.x,uLrange.y,0.5+0.5*sin(w.x*0.031-w.y*0.047))+h2.y*0.06;
  float dir=COMB_BASE+COMB_AMP*sin(w.x*COMB_FX+w.y*COMB_FZ);

  /* ---- DISTANCE THINNING ----
     The density ramp runs to 1+uBand so full density is genuinely full, and a blade over the local
     density shrinks away across uBand rather than vanishing. Scaling to zero yields degenerate
     triangles, which the rasteriser drops before shading a fragment — that is where the saving is,
     and it is also what makes the field's outer edge a fade rather than a wall. */
  /* ---- WHERE THE FIELD STOPS ----
     A RAGGED EDGE, NOT A CIRCLE. The fade was a pure function of distance, so the field's boundary
     was a perfect disc centred on the camera — which is a straight line's circular cousin and
     reads as a patch following the bird. The radius is perturbed by noise in WORLD space, so the
     boundary wanders and stays put as the camera moves through it. */
  float d=length(w-cameraPosition.xz);
  float edge=1.0+(keaFbm(w*0.085)-0.5)*2.0*uEdgeVar;
  float keep=(1.0+uBand)*(1.0-smoothstep(uLodNear*edge,uLodFar*edge,d));
  float live=alive*clamp((keep-keaGH(w*2.3))/max(uBand,1e-4),0.0,1.0);
  float comp=mix(1.0,inversesqrt(clamp(keep,0.25,1.0)),uComp);

  /* ---- WIND ----
     A slow plane-wave GUST across the whole field plus a fast per-blade FLUTTER, both functions of
     uTime ONLY. The capture rig pins G.time at 12.0 every frame and uTime is driven from it, so a
     photographed frame is a fixed frame; nothing here reads performance.now(). The bend rides
     height SQUARED because a blade is anchored at the base and moves most at the tip. */
  float gb=max(0.0,position.y), gb2=gb*gb;
  float gust=sin(uTime*uGustHz + w.x*uGustM + w.y*uGustM*0.82);
  float flut=sin(uTime*uFlutterHz + dot(w,vec2(0.37,0.29)));
  float bend=gust*uGust + flut*uFlutter;

  /* ---- ASSEMBLE ----
     Scale, then lean about a world axis, then yaw — the yaw has to happen INSIDE the lean or the
     blade's fall direction spins with it, which is the same "the comb must not spin with the
     blade" the old CPU path was written around. */
  vec3 p=vec3(t.x*wid*comp, t.y*hgt, t.z*wid*comp);
  p.x+=bend*gb2*hgt; p.z+=bend*0.62*gb2*hgt; p.y-=abs(bend)*0.35*gb2*hgt;
  float cy=cos(yaw), sy=sin(yaw);
  p=vec3(p.x*cy+p.z*sy, p.y, -p.x*sy+p.z*cy);
  vec3 ax=vec3(sin(dir),0.0,-cos(dir));
  float cl=cos(lean), sl=sin(lean);
  p=p*cl+cross(ax,p)*sl+ax*dot(ax,p)*(1.0-cl);          // Rodrigues, about the fall axis
  p*=live;

  /* the terrain is two sines inside the flat disc, so a blade can sit ON it rather than at y=0 */
  float gy=sin(w.x*uHmul.x)*cos(w.y*uHmul.y)*uHamp;
  t=p+vec3(w.x,gy,w.y)-vec3(0.0,0.0,0.0);
  vGrassT=clamp(position.y,0.0,1.0);
  vGrassW=vec3(w.x,gy,w.y);
  /* ---- COLOUR, PER BLADE AND PER CLUMP ----
     Three genuinely different body colours picked per blade, then leaned toward the pale draw by
     the MOUND's own weight — without that second term a field of individually varied blades
     averages straight back to one colour at any distance, which is exactly what P4 shipped. */
  vec3 body=mix(mix(uTintA,uTintB,step(0.5,h2.x)),uTintC,h1.x*0.85);
  body=mix(body,uTintC,cw*0.30);
  vGrassTint=body;
  vGrassBase=uTintBase;
  vGrassTip=uTintTip;
  /* how much rust this particular leaf has gone. Some are green to the end and some are brown from
     halfway, which is what the foreground mound in nz_tussock_03 actually looks like. */
  vGrassSeed=uSeed*smoothstep(0.25,0.95,keaGH(w*3.7+19.3));
}
`;
const GRASS_GLSL_F=`
uniform float uTransAmt, uTransPow, uWrap;
uniform vec3 uTransColor, uSunDir;
varying float vGrassT;
varying vec3 vGrassW;
varying vec3 vGrassTint;
varying vec3 vGrassBase;
varying vec3 vGrassTip;
varying float vGrassSeed;
/* GREEN AT THE FOOT, BODY THROUGH THE MIDDLE, RUST AT THE TIP. A leaf is alive and shaded where it
   leaves the ground and bleached where it has been in the wind longest; one flat colour along the
   whole blade is most of why the old field read as plastic, and all of why it read as monochrome.
   nz_tussock_03's foreground mound is green at its heart and rust at its outer leaves AT THE SAME
   TIME, so the gradient has to be per blade and not a global tint. */
vec3 keaGrassColour(){
  /* the green reaches further up than half a leaf: at 0.42 the base was buried under its own
     neighbours and never appeared in a frame at all */
  vec3 c=mix(vGrassBase,vGrassTint,smoothstep(0.0,0.58,vGrassT));
  return mix(c,vGrassTip,smoothstep(0.46,1.0,vGrassT)*vGrassSeed);
}
/* ---- LIGHT THROUGH THE BLADE ----
   ref_bow_02 and ref_bow_15 are both backlit and the blades GLOW; an opaque Lambert blade cannot
   do that at any density, which is why the old carpet read as plastic however many triangles went
   into it. Two cheap terms: WRAP, so a blade facing away from the sun is not black, and a FORWARD
   scatter lobe for looking down-sun THROUGH a blade. Both ride the square of the height up the
   blade, because a blade is thinnest at its tip and that is where light actually gets through. */
vec3 keaGrassTrans(){
  vec3 V=normalize(vGrassW-cameraPosition);
  float lobe=pow(max(0.0,dot(V,uSunDir)),uTransPow);
  float thin=vGrassT*vGrassT;
  return uTransColor*keaGrassColour()*(uTransAmt*lobe*thin + uWrap*thin*0.35);
}
`;
/* THE CUT-OUTS, as four boxes the vertex shader can test: centre xz, half-extent xz. The CPU used
   to carry this as a per-biome closure; a camera-anchored field decides where a blade stands in
   the shader, so the same information has to travel as uniforms. Four is what both biomes need,
   and a fifth is a new uniform rather than a silent truncation — the gate asserts the list fits. */
/* EVERY BIOME RETURNS THE SAME LENGTH, padded with disabled boxes, and the padding is EXPLICIT.
   A short list used to be a silent truncation waiting to happen; now it is a pad, and the battery
   holds every registered biome's list to GRASS.cuts rather than holding two named maps to four. */
function grassPad(list){ const out=list.slice(0,GRASS.cuts);
  while(out.length<GRASS.cuts)out.push([0,0,0,0]); return out; }
function grassCuts(biome){
  if(biome==='skifield'){
    const P=SKIPISTE, T=SKITOW, L=SKILODGE;
    return grassPad([
      [(P.x0+P.x1)/2,(P.z0+P.z1)/2,(P.x1-P.x0)/2+1.2,(P.z1-P.z0)/2],  // the groomed run
      [T.x,0,2.2,60],                                                  // under the rope tow
      [L.x,L.z,L.w/2+1.5,L.d/2+L.deck+1.5]]);                          // the lodge and deck
  }
  /* FOUR IS THE BUDGET AND THE CAMPGROUND WAS LAID OUT AROUND IT (CAMPGROUND.md section 2). An
     oval loop road cannot be cut with boxes — two long sides and two ends spends the lot before a
     building is clear — so the map is a straight gravel track with the sites hung off it, which is
     what the smaller DOC sites actually are. The sites themselves keep their grass on purpose:
     a tent standing in mown pasture is the picture, a tent on a bald disc is not. */
  if(biome==='campground'){
    const T=CAMPTRACK, S=CAMPSHELTER, A=CAMPABLUTION;
    return grassPad([
      [T.x,(T.z0+T.z1)/2,T.w/2+0.6,(T.z1-T.z0)/2+1.0],   // the gravel track
      [S.x,S.z,S.w/2+0.6,S.d/2+0.8],                      // the shelter pad
      [A.x,A.z,A.w/2+0.5,A.d/2+0.5],                      // the ablutions pad
      [CAMPVAN.x,CAMPVAN.z,3.4,3.0]]);                    // the campervan hardstand
  }
  if(biome==='village'){
    const S=VILLST, P2=VILLPATH, U=VILLUNITS, SH=VILLSHOP;
    const L=(S.x1-S.x0)/2, cx=(S.x0+S.x1)/2;
    /* SEVEN LIVE BOXES, WHICH IS WHY THE BUDGET WENT TO EIGHT (VILLAGE.md step 0). Four could not
       have carried this map: the sealed street, a footpath each side, the two shop forecourts under
       the verandah, the bus-shelter pad and the bike-rack pad. The eighth stays a pad. */
    return grassPad([
      [cx,S.z,L,S.w/2+0.4],                                  // the sealed street
      [cx,P2.north,L,P2.w/2+0.3],                            // the north footpath
      [cx,P2.south,L,P2.w/2+0.3],                            // the south footpath
      [U[0].x,SH.z+SH.d/2+1.4,SH.w/2+1.0,2.0],               // the bakery forecourt
      [U[1].x,SH.z+SH.d/2+1.4,SH.w/2+1.0,2.0],               // the cafe forecourt
      [VILLSHELTER.x,VILLSHELTER.z,2.2,1.4],                 // the bus-shelter pad
      [VILLBIKE.x,VILLBIKE.z,1.4,0.9]]);                     // the bike-rack pad
  }
  return grassPad([
    [0,34,120,5.6],            // road
    [2,17,21,11.5],            // carpark
    [-24,-9,4.2,3.4],          // hut slab
    [28,-14,3.4,2.4]]);        // pen core
}
/* THE ONE PLACE THE CUT COUNT REACHES THE GLSL. Asserted rather than assumed: a source that still
   carries the token after substitution would compile to a syntax error at a point three swallows
   into a shader-compile warning, so it is caught here where the message can say what happened. */
function grassSub(src){
  const out=src.split('GRASS_CUTS').join(String(GRASS.cuts|0));
  if(out.indexOf('GRASS_CUTS')>=0)throw new Error('grassSub: GRASS_CUTS survived substitution');
  return out;
}
function grassShader(m,B,tier,biome){   // B is a LAYER spec: the clump layer or the cover layer
  if(GRASS_OK!==true)return m;
  const C=grassCuts(biome), V4=(c)=>new THREE.Vector4(c[0],c[1],c[2],c[3]);
  const lin=h=>new THREE.Color(h).convertSRGBToLinear();
  /* THE TERRAIN, as the two sines the ground plane is actually built from, so a blade sits ON the
     ground instead of at y=0 — which is what the old carpet did, and why blades floated over every
     undulation. The plane is built in XY and laid down by the minus-90 rotation, so its local y is
     world MINUS z; cosine is even, so the sign falls out and one expression serves both biomes. */
  const H=biome==='skifield'?{mul:[0.13,0.11],amp:0.14}:{mul:[0.15,0.13],amp:0.18};
  const V3=h=>{ const c=lin(h); return new THREE.Vector3(c.r,c.g,c.b); };
  const U=m.userData.keaG={
    uTime:{value:0}, uAnchor:{value:new THREE.Vector2(0,0)},
    /* the mean spacing of this layer's own scatter, which is what the anchor snaps to */
    uSnap:{value:GRASS.snap},
    uNear:{value:tier.near}, uLodNear:{value:tier.lodNear}, uLodFar:{value:tier.lodFar},
    /* REPLAT P4e: fadeBand IS PER LAYER NOW, exactly as taper and seg already were, and it is the
       single lever that dissolves a tier's outer edge rather than relocating it. It is the WIDTH of
       the window a blade shrinks out across, so a wide band turns a density cliff into a long taper
       of blades getting shorter — which is what the eye needs at a handover and what a near layer
       must NOT have, because there the same width would stunt blades under the camera. Measured:
       at the far tier's edge, 0.11 scores 12.79 findability, 0.30 scores 7.17 and 0.55 scores 5.77
       with the peak moving off the texture channel entirely. The near layers keep the 0.11 P4
       tuned. */
    uBand:{value:B.fadeBand===undefined?GRASS.fadeBand:B.fadeBand}, uComp:{value:GRASS.comp},
    uGust:{value:GRASS.windGust}, uFlutter:{value:GRASS.windFlutter},
    uGustHz:{value:GRASS.gustHz}, uFlutterHz:{value:GRASS.flutterHz}, uGustM:{value:GRASS.gustM},
    uClumpM:{value:B.clumpM}, uClumpJit:{value:GRASS.clumpJit},
    uClumpPull:{value:B.clumpPull===undefined?GRASS.clumpPull:B.clumpPull},
    uClumpPullVar:{value:B.clumpPullVar===undefined?GRASS.clumpPullVar:B.clumpPullVar},
    uBare:{value:B.bare},
    /* REPLAT P4d: the gate is GRASS.blobMinPull, and it is 0. It was a hardcoded 0.2 whose only
       justification was that a small pull "buys nothing" — and a small pull on a square cell is
       precisely what drew the squares Eric saw. See the blobMinPull note in the recipe. */
    uBlobScan:{value:(GRASS.blobScan&&
      (B.clumpPull===undefined?GRASS.clumpPull:B.clumpPull)>GRASS.blobMinPull)?1:0},
    uBareScale:{value:GRASS.bareScale}, uBareSoft:{value:GRASS.bareSoft},
    uCutSoft:{value:GRASS.cutSoft},
    uEdgeVar:{value:GRASS.edgeVar},
    uHmul:{value:new THREE.Vector2(H.mul[0],H.mul[1])}, uHamp:{value:H.amp},
    uCuts:{value:C.map(V4)},
    uHrange:{value:new THREE.Vector2(B.h[0],B.h[1])},
    uWrange:{value:new THREE.Vector2(B.w[0],B.w[1])},
    uLrange:{value:new THREE.Vector2(B.lean[0],B.lean[1])},
    uTintA:{value:V3(B.tint[0])}, uTintB:{value:V3(B.tint[1])}, uTintC:{value:V3(B.tint[2])},
    uTintBase:{value:V3(B.base)}, uTintTip:{value:V3(B.tip)}, uSeed:{value:B.seed},
    uTransAmt:{value:GRASS.transAmt}, uTransPow:{value:GRASS.transPow}, uWrap:{value:GRASS.wrap},
    uTransColor:{value:lin(GRASS.transColor)},
    uSunDir:{value:new THREE.Vector3(0,1,0)},
  };
  m.onBeforeCompile=(sh)=>{
    Object.assign(sh.uniforms,U);
    /* GRASS_CUTS IS SUBSTITUTED, NOT DECLARED AS A GLSL const, because an array size must be a
       compile-time literal in GLSL ES and `const int` from a uniform is not one. So the number
       lives in GRASS.cuts, reaches the source here, and appears in exactly two places in it — the
       array declaration and the loop bound — which is what keeps them from disagreeing. */
    sh.vertexShader=grassSub(GRASS_GLSL_V)+sh.vertexShader;
    sh.fragmentShader=grassSub(GRASS_GLSL_F)+sh.fragmentShader;
    for(const [name,pairs] of GRASS_PATCH){
      const inc='#include <'+name+'>';
      let body=THREE.ShaderChunk[name];
      for(const [from,to] of pairs) body=body.split(from).join(to);
      const which=name==='begin_vertex'?'vertexShader':'fragmentShader';
      sh[which]=sh[which].split(inc).join(body);
    }
    /* the blade carries its own colour in a varying, so the material's flat white is replaced at
       the one line three declares diffuse on — validated in GRASS_OK, because it is a line in
       meshphysical_frag's body rather than a chunk and cannot be checked the same way. */
    sh.fragmentShader=sh.fragmentShader.replace(GRASS_DIFFUSE_LINE,
      'vec4 diffuseColor = vec4( keaGrassColour(), opacity );');
  };
  return m;
}

function grassBladeGeo(seg,taper,bend){
  const pos=[],uv=[],idx=[];
  for(let i=0;i<seg;i++){ const t=i/seg, hw=0.5*Math.pow(1-t,taper), z=bend*t*t;
    pos.push(-hw,t,z, hw,t,z); uv.push(0,t, 1,t); }
  const tip=2*seg; pos.push(0,1,bend); uv.push(0.5,1);          // the point
  for(let i=0;i<seg-1;i++){ const a=i*2, b=a+1, c=a+2, d=a+3;
    idx.push(a,c,b, b,c,d); }
  { const a=(seg-1)*2; idx.push(a,tip,a+1); }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  /* NORMALS POINT ALONG +Z FOR EVERY VERTEX, deliberately, and not computed from the faces. A
     blade is one triangle thick; a face normal on a curved strip swings through ninety degrees and
     makes the field read as noise under a directional sun. A single sheet normal, lit from both
     sides, is what a grass card wants — and the transmission term below is what carries the shape
     information the flat normal gives up. */
  const n=[]; for(let i=0;i<pos.length/3;i++) n.push(0,0,1);
  g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));
  g.setIndex(idx);
  g.userData.tris=idx.length/3;
  return g;
}

/* THE SCATTER LATTICE. The only thing the CPU still places: a fixed jittered scatter over a unit
   disc, one vec2 per blade, uploaded once and never touched again. Everything else about a blade —
   where in the world it stands, how tall it is, which mound it belongs to, whether it exists at
   all — is derived in the vertex shader from the WORLD position it lands on, so that snapping the
   field to follow the camera cannot make a blade change its mind about what it looks like.
   SUNFLOWER SPACING, not uniform random: a random disc scatter clumps and voids on its own, and
   those voids are indistinguishable from the deliberate bare ground the clumping puts in. The
   golden-angle spiral is even, and the jitter that breaks its regularity is added on top. */
/* REPLAT P4e: AN INNER RADIUS, SO A LAYER CAN BE AN ANNULUS RATHER THAN A DISC. The far tier only
   has to cover the ground the near layers have already given up on, and spending a third of its
   instances under the clump layer where nothing can see them is a third of its cost wasted.
   `r = sqrt(rMin^2 + (1-rMin^2)*u)` is the area-uniform draw over an annulus - the same inverse-CDF
   the plain sqrt is, with the inner disc removed - so the ring is as evenly covered as the disc
   was, and rMin 0 gives back the original expression exactly. */
function grassLattice(n,rMin){
  const off=new Float32Array(n*2), GA=Math.PI*(3-Math.sqrt(5));
  const r0=(rMin||0)*(rMin||0);
  const h=(i,k)=>{ const v=Math.sin(i*12.9898+k*78.233)*43758.5453; return v-Math.floor(v); };
  for(let i=0;i<n;i++){
    const r=Math.sqrt(r0+(1-r0)*((i+0.5)/n)), a=i*GA;
    const jr=(h(i,1)-0.5)*0.9/Math.sqrt(n), ja=(h(i,2)-0.5)*GA*0.9;
    off[i*2]  =Math.cos(a+ja)*(r+jr);
    off[i*2+1]=Math.sin(a+ja)*(r+jr);
  }
  return off;
}

/* ONE LAYER OF THE FIELD. Called twice: once for the COVER — short, wide, dense, laid nearly
   uniformly so there is no naked ground anywhere — and once for the CLUMPS that rise out of it.
   Same geometry builder, same shader, different numbers; a second shader for the second layer
   would be two things to keep in step for no gain. */
function grassLayer(biome,L,name){
  /* seg IS PER LAYER: a 100 mm cover blade does not need four segments to arc, it needs to exist.
     Two segments is 3 triangles against 7 and the curve is invisible at that height. */
  const geo0=grassBladeGeo(L.seg===undefined?GRASS.seg:L.seg,L.taper,GRASS.bend);
  const geo=new THREE.InstancedBufferGeometry();
  geo.index=geo0.index;
  geo.setAttribute('position',geo0.attributes.position);
  geo.setAttribute('normal',geo0.attributes.normal);
  geo.setAttribute('uv',geo0.attributes.uv);
  geo.setAttribute('aOff',new THREE.InstancedBufferAttribute(grassLattice(L.count,L.rMin),2));
  geo.instanceCount=L.count;
  /* A BOUNDING SPHERE BIG ENOUGH TO NEVER BE THE ANSWER. The vertex shader moves every blade to
     wherever the camera is, so three's idea of where this geometry lives is wrong by construction
     — and frustumCulled=false alone is not enough, because an empty bounding sphere makes three
     skip the draw outright. Given explicitly rather than computed. */
  geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,0,0),1e5);
  const m=new THREE.MeshStandardMaterial({color:0xFFFFFF,roughness:0.92,metalness:0,
    side:THREE.DoubleSide,envMapIntensity:0.3});
  const lf=L.lodFrac===undefined?GRASS.lodFrac:L.lodFrac;
  grassShader(m,L,{near:L.near,lodNear:L.near*lf,lodFar:L.near},biome);
  const mesh=new THREE.Mesh(geo,m);
  /* REPLAT P4e: RECEIVING A SHADOW IS PER LAYER, and on the far tier it is off. A shadow-map
     lookup is a PER-FRAGMENT cost, and the far tier is hundreds of thousands of thin blades at a
     grazing angle — which is the most overdrawn thing in the frame and the cheapest place to stop
     paying for a lookup nobody can resolve at thirty metres. Measured, not assumed; the table is in
     ARTBIBLE. `shadow:false` is a layer-spec key, so the clump and cover layers are untouched. */
  mesh.frustumCulled=false; mesh.receiveShadow=(L.shadow!==false);
  /* NOT A SHADOW CASTER, and that is a budget decision rather than an oversight: a shadow pass
     over this many blades is a second full vertex pass for a contribution the transmission term
     and the ground's ambient occlusion already stand in for. */
  mesh.castShadow=false;
  mesh.name='grass_'+name;
  G.scene.add(mesh);
  return {mesh,mat:m,tris:geo0.userData.tris,count:L.count,
          density:L.count/(Math.PI*L.near*L.near)};
}

/* THE LAYER SPECS. The clump layer takes the biome profile; the cover layer takes GRASS.cover and
   BORROWS the biome's colours, so the two layers cannot drift into different countries. */
function grassSpecs(biome){
  const B=GRASS.biomes[biome]||GRASS.biomes.carpark, T=grassTier(), C=GRASS.cover, F=GRASS.farLayer;
  const clump=Object.assign({},B,{count:T.count, near:T.near, seed:1.0});
  const cover=Object.assign({},C,{tint:B.tint, base:B.base, tip:B.tip,
    /* the cover is YOUNGER growth: greener, and it does not go rust at the tip the way a long
       outer leaf does. One number says that, rather than a second palette to keep in step. */
    seed:0.25});
  /* REPLAT P4e. THE FAR TIER BORROWS THE BIOME'S WHOLE PALETTE — base, tint triple and tip — and
     that is not tidiness, it is the seam. A far tier with colours of its own is a ring of a
     slightly different country drawn around the player, which is the artefact this piece exists to
     remove, wearing a bigger radius. Its `seed` matches the clump layer's so the rust gradient runs
     the same way through both. */
  const far=Object.assign({},F,{tint:B.tint, base:B.base, tip:B.tip, seed:1.0});
  return {clump,cover,far,B,T};
}

function buildGrass(biome){
  const {clump,cover,far,B,T}=grassSpecs(biome);
  /* the annulus covers pi*(1-rMin^2) of its disc, so its density is over the ring it actually
     occupies and not over a disc a third of which it deliberately leaves empty */
  const ringA=Math.PI*far.near*far.near*(1-far.rMin*far.rMin);
  const farState=(inst)=>({count:far.count,near:far.near,rMin:far.rMin,bare:far.bare,
    density:far.count/ringA, hi:far.h[1], wide:far.w[1], instances:inst});
  if(HEADLESS){
    G.grass={tier:GRASS.tier,instances:0,perBladeTris:2*GRASS.seg-1,headless:true,
             ignored:GRASSIGNORED.slice(), shader:GRASS_OK===true?true:GRASS_OK,
             lodNear:T.lodNear,lodFar:T.lodFar,near:T.near,count:T.count,density:T.density,
             clumpM:B.clumpM,bare:B.bare,biome:biome,
             cover:{count:cover.count,near:cover.near,bare:cover.bare,
                    density:cover.count/(Math.PI*cover.near*cover.near),
                    hi:cover.h[1],instances:0},
             far:farState(0)}; return; }
  /* THE COVER GOES DOWN FIRST so the clumps are drawn over it — not that depth testing cares, but
     the reading order of the code should match the reading order of the ground. The FAR tier goes
     down before both, for the same reason: it is behind them. */
  const fr=grassLayer(biome,far,'far');
  const cv=grassLayer(biome,cover,'cover');
  const cl=grassLayer(biome,clump,'clump');
  G.grassMesh=cl.mesh; G.grassMat=cl.mat;
  G.grassCoverMat=cv.mat; G.grassFarMat=fr.mat;
  G.grass={tier:GRASS.tier, instances:cl.count, shader:GRASS_OK===true?true:GRASS_OK,
           ignored:GRASSIGNORED.slice(), perBladeTris:cl.tris,
           tris:cl.count*cl.tris+cv.count*cv.tris+fr.count*fr.tris,
           near:T.near, density:cl.density,
           lodNear:T.lodNear, lodFar:T.lodFar, clumpM:B.clumpM, bare:B.bare, biome:biome,
           cover:{count:cv.count,near:cover.near,bare:cover.bare,density:cv.density,
                  hi:cover.h[1],instances:cv.count},
           far:farState(fr.count)};
}
function nightTint(m){ // foliage and bark go dark by construction: L_night is 0.30 x L_day
  if(!m)return m; G.nightMats=G.nightMats||[];
  if(!G.nightMats.some(e=>e.m===m)){
    const day=m.color.clone(), night=day.clone().multiplyScalar(0.30);
    night.offsetHSL(0.02,-0.30,0);                 // a cool cast, lightness untouched
    G.nightMats.push({m,day,night}); }
  return m; }
function mkTree(x,z,s){
  const g=new THREE.Group(); g.position.set(x,0,z); G.scene.add(g);
  const trunk=cyl(0.22*s,0.34*s,2.6*s,0x6E5334,0,1.3*s,0,g,9); nightTint(trunk.material);
  cyl(0.1*s,0.16*s,1.2*s,0x6E5334,0.5*s,2.2*s,0.2*s,g,7).rotation.z=-0.5;
  const leafs=[0x3E6B34,0x4E7F3E,0x5E9448];
  { // under-canopy: the dark mass that gives the tree weight
    const uc=new THREE.Mesh(new THREE.SphereGeometry(1.9*s,12,9),nightTint(mat(PAL.beech,{roughness:0.98})));
    uc.scale.y=0.55; uc.position.y=3.0*s; g.add(uc); }
  for(let i=0;i<8;i++){
    const cg=new THREE.SphereGeometry(rnd(0.9,1.5)*s,12,9);
    const pp=cg.attributes.position;
    for(let v=0;v<pp.count;v++){ const j=0.3*s; pp.setXYZ(v,pp.getX(v)+rnd(-j,j),pp.getY(v)+rnd(-j,j)*0.6,pp.getZ(v)+rnd(-j,j)); }
    cg.computeVertexNormals();
    const cm=new THREE.Mesh(cg,nightTint(mat(leafs[i%3],{roughness:0.95})));
    cm.scale.y=rnd(0.55,0.75);
    cm.position.set(rnd(-1.1,1.1)*s,(3.0+rnd(0.2,1.7))*s,rnd(-1.1,1.1)*s);
    cm.castShadow=!HEADLESS; g.add(cm);
  }
  addBoxCollider(x,z,0.7*s,0.7*s,2.4*s,true);
  return g;
}
function buildTrees(){
  mkTree(-14,26,1.5);   // the big one by the carpark, like the reference
  mkTree(34,-24,1.2); mkTree(-38,10,1.35); mkTree(-40,-28,1.0); mkTree(40,14,1.1); mkTree(12,-38,1.25);
}

/* ---------- world ---------- */
/* SNOW LANDS ON THE COUNTRY, NOT ON THE SHED ROOF.
   TODO 28, Eric's verdict 2026-09-01: unbury, slide clear of the shed footprint, snow banking
   against the walls is welcome. Two of the ten patches were measured sitting on the ski-field shed
   (-40.94,-40.41 r 2.57 and -39.25,-39.79 r 1.69 against a 1.7 x 1.3 collider topped at 2.00), so
   the shed stood in a white saucer with the disc exiting through its walls as a straight chord.
   THE SPOT IS RESOLVED, NOT REJECTED. A rejection (a continue) would change the mesh count and the
   draw count; every later rnd() draw in the browser is downstream of this loop - the fourteen far
   rocks first, then prop rotations and human scan timers - so a resolver that consumes nothing and
   builds the same number of discs is the only kind that cannot move the rest of the world. The
   candidate is tried first, then a FIXED ladder of offsets in growing rings; the first clear spot
   wins, so a patch that was never buried does not move at all.
   The test is the HARD disc against the footprint. The soft halo is 1.35x and may still lap a wall,
   which is precisely the banking the verdict asks for: it sits at y 0.042, far under any roof, so
   the only part of it anyone sees is the part outside the wall. */
const SNOWFIELD={x0:-50,x1:50,z0:-50,z1:-20};          // the envelope the patches are drawn from
const SNOWSTEPS=[1.6,3.2,4.8,6.4,8.0];
/* ONLY A BUILDING BLOCKS A DISC. A slender thing - a tree trunk, a sign post - reads correctly
   with snow banked round its foot; it is a BROAD footprint that turns the disc into a saucer with
   the building standing in it. Threshold set off the measured footprints in the snow band:
   trunks are 0.35 to 0.44 half-extent and the sign is 0.15 deep, while the shed the verdict names
   is 1.3 and the nest is 2.3. Mirrors the paintAt convention next door - big surfaces, never props. */
const SNOWBULK=0.6;
const SNOWSLIDE=(()=>{ const t=[[0,0]];
  for(const step of SNOWSTEPS)for(let i=0;i<8;i++){ const a=i*Math.PI/4;
    t.push([+(Math.cos(a)*step).toFixed(4),+(Math.sin(a)*step).toFixed(4)]); }
  return t; })();
/* THE ENVELOPE IS THE ONE PART OF THIS THAT BELONGS TO A MAP (TODO 39). SNOWFIELD is the band the
   CARPARK draws its patches from; a ski field is snow from edge to edge. The verdict itself - what
   counts as a structure, and where a blocked disc slides to - is the same law on every map, so the
   envelope is the only parameter and it defaults to the carpark one. */
function snowBlocked(x,z,r,env){ // the raised structure this disc would sit on, or null
  const F=env||SNOWFIELD;
  if(x<F.x0||x>F.x1||z<F.z0||z>F.z1)return {offmap:true};
  for(const c of G.colliders){
    if(c.kind==='box'&&!(c.top>0.2))continue;           // laid ground is not a structure
    if(Math.min(c.w,c.d)<SNOWBULK)continue;            // a post or a trunk is banked against, not slid off
    let lx=x-c.x, lz=z-c.z;
    if(c.ry){ const sn=Math.sin(c.ry),cs=Math.cos(c.ry); const tx=lx*cs-lz*sn, tz=lx*sn+lz*cs; lx=tx; lz=tz; }
    const dx=Math.max(0,Math.abs(lx)-c.w), dz=Math.max(0,Math.abs(lz)-c.d);
    if(dx*dx+dz*dz<r*r)return c;                       // closest point on the footprint is inside the disc
  }
  return null; }
function snowSpot(x,z,r,env){
  for(const [dx,dz] of SNOWSLIDE){ const nx=x+dx, nz=z+dz;
    if(!snowBlocked(nx,nz,r,env))return {x:nx,z:nz,r,slid:Math.hypot(dx,dz)}; }
  return {x,z,r,slid:0,stuck:true}; }                  // nowhere to go: leave it where it was, and say so
/* ONE BUILD, ONE WORLD (TODO 48, 2026-09-02). boot() calls initScene, which throws the old
   THREE.Scene away and makes a new one - so a second boot leaves the registries describing meshes
   that are no longer in any scene, on top of the ones that are. The registries have to be emptied
   for exactly the reason the scene is replaced, and they were not. Measured on a plain double boot:
   cars 6 to 12, props 21 to 42, colliders 26 to 52, sheep 3 to 6, strips 2 to 4, and inter 64 to 131
   (the extra three are the sheep pecks, one per sheep, registered for six sheep the second time).
   Nothing asserted before today depended on a count, which is the only reason it never bit, but
   every count written from here would have been silently wrong and every find() would have got
   whichever duplicate came first. Emptied in buildWorld rather than in boot() so that the guarantee
   belongs to the function that fills them, however it is called - and it stays in the DISPATCHER
   below, above the biome, so a biome author cannot forget it and cannot opt out of it. */
/* TODO 58 adds hints. They were the one thing a build put on the board that the dispatcher did not
   take back off it, which was invisible while there was one map: build a second biome and the
   carpark teaching came with you, pointing at props forty units away in a country that no longer
   existed. A hint belongs to the map that can answer it. */
/* TODO 39 adds snow, for the same reason 58 added hints. The carpark drifts are built inside a
   !HEADLESS branch, so a second build left the first map drifts on the board and drew its own on top
   of them - invisible under node, two maps worth of snow in the browser. A drift is a fact about one
   map. */
/* REPLAT P6A adds propReg, for the reason every name on this line is here: it is a LIST a build
   fills, so a second build must not leave the first map's prop records on the board describing
   meshes in a scene that was thrown away. It is the registry's own G.towWheel lesson. */
const WORLDREGS=['props','inter','colliders','cars','sheep','strips','foodSrc','hints','snow','propReg'];
/* AND THE SINGLE THINGS A BUILD HANGS ON G (TODO 62, found in session 11 by the piece 39 sabotage
   sweep). WORLDREGS covers every LIST a build fills. It did not cover the handles - one object per
   thing a map has exactly one of - so after a carpark boot they all still pointed at meshes in a
   scene that had been thrown away, and the ski field ran with the CARPARK tow wheel on G. The
   transcript that found it: with G.towWheel=wheel deleted from the ski field builder, the battery
   reported the wheel at -37.9,-40 from inside the ski field - the carpark one, still being spun by
   update every frame, and still able to answer a proximity detector at coordinates in a country
   that was not loaded.
   IT IS ALSO HOW THE CAST BUG HID FOR TWO SESSIONS. A stale G.ladder made a hutless boot look
   perfectly safe in every battery, because Dave found the last map ladder and used it.
   THE AUDIT MATTERS AS MUCH AS THE SWEEP, and it was done reader by reader before this line was
   written: every handle below is either read behind a truthiness guard (fire, pen, vanTop, towWheel,
   uteG, grassSh, chimneyRef, snowCap in the two places that run every frame) or read only from
   inside an interactable that its OWN builder registered, which a map without the builder never has.
   Nothing here needed a new guard.
   THREE THINGS ARE DELIBERATELY NOT IN THE SWEEP, and each for its own reason:
     G.nestPos, because it has unguarded readers BY DESIGN - the finale and the bank check read it
       every frame - and every map declares one, so nulling it would trade a stale value for a throw;
     G.nestStash, G.spikeStash and G.nailStash, because they count what the PLAYER has done rather
       than what a build put out;
     the lists below are emptied rather than nulled, because a reader that counts them should read
       nothing rather than throw.
   THE LATCHES GO TOO. _chCol caches a collider computed off the old chimney mesh, _qtDone latches a
   table cleared in a country that no longer exists, the paddle flags belong to the paddle that was
   just discarded, and the kea gym is a mesh in the thrown-away scene - a run put it there, but a
   build is what invalidated it. */
const WORLDHANDLES=['towWheel','ladder','signG','nestG','uteG','paddle','snowCap','chimneyRef',
  'chilly','chillyLidG','bin','fire','tarp','pen','penGate','vanTop','vanDoor','cage','skiGround',
  'gym','_chCol'];
const WORLDLISTS=['gravel','stones','wear'];
const WORLDFLAGS={nestY:0,gymOut:false,paddleFlipped:false,paddleDone:false,paddleFlips:0,_qtDone:0};

/* ---------- THE PROP REGISTRY — REPLAT P6A (2026-09-05) ----------
   Eric will obtain and adapt GLB models for essentially every object in this game, in batches, at
   unknown future dates. Without a seam each arriving model is a mini-refactor of buildWorld: find
   the primitive, tear it out, wire a loader, re-hook the collider, the mission anchors, the
   night-tint and the material handling, and re-prove all of it. Twenty models, twenty refactors,
   twenty chances to break a mission anchor. With a seam an arriving model is a line of
   configuration and a file.

   THIS BLOCK ADDS NO MODELS AND CHANGES NO VISUALS. Every entry ships `source:'primitive'` and
   calls the builder it always called, at the point in the build it always ran, with the arithmetic
   it always used. The gauntlet's own numbers say so: G.world carries the mesh digest, the collider
   digest and the per-biome counts, and the P6A battery holds all three to the values measured on
   the pre-seam tree.

   ---- WHY A REGISTRY AND NOT JUST A LOADER ----
   A loader would let a model replace a primitive's MESH. The reason this is a registry is the other
   four columns — collider, anchors, material policy and biome. Those are what actually break when a
   model arrives, and they are what a future session, or a future Eric handing a batch of GLBs to a
   fresh assistant, needs written down in ONE place rather than inferred from twenty call sites.

   ---- THE COLLIDER DOES NOT COME FROM THE MODEL ----
   Declared here, as data, emitted by placeProp, and IDENTICAL whichever source is live. A swapped
   model must not silently change what the bird can perch on, walk into or peck; if a model warrants
   a different collider that is a separate, judged decision and it is made by editing this line.
   `kind:'box'` takes FULL width and depth, exactly as addBoxCollider does, and is halved on the way
   out; `kind:'roof'` passes through verbatim because that is the shape groundHeightAt reads. Local
   to the prop's own origin, rotated and translated by the placement.

   ---- THE ANCHORS DO NOT COME FROM THE MODEL EITHER ----
   The named points missions attach to — the caravan door seal, the wiper, the bin lid, the tow
   rope — are the highest-risk thing in this piece, and the reason they are safe is that they were
   ALREADY independent of the geometry: every one of them was a literal offset from the prop's
   placement, not a point read off a mesh. So the seam's job is to NAME them here and hand them out
   through propAnchor(), which composes the declared local point with the placement transform and
   never touches a vertex. A model can therefore not move an anchor, and the battery proves it by
   moving the body and re-reading every anchor in the world.

   ---- WHY THE PRIMITIVE IS ALWAYS BUILT, EVEN FOR source:'model' ----
   The bird's pattern, for the bird's reasons (see src/bird.mjs). A GLB is fetched, so it is async
   and it can fail, and a look feature must not be able to take the game down. So the body is built
   at build time — which is also what keeps the seeded random stream bit-identical, since a prop
   that skipped its builder would stop drawing and reshuffle the country downstream of it — and the
   model tier, when it lands, HIDES the body and adds the model beside it in the same group. A
   failed load leaves the primitive visible and says why in G.models. The cost is that a swapped
   prop still allocates its primitive geometry; that is written down rather than quietly paid.

   ---- THE ORDER OF THE COLLIDER PUSHES IS PRESERVED ON PURPOSE ----
   pushOut() walks G.colliders and mutates the bird's position as it goes, so for a bird standing
   inside two overlapping boxes the ORDER of the array is load-bearing, not just its contents. Most
   builders pushed their collider partway through their body rather than at the end. So a body says
   where its collider lands by calling p.collide() at exactly the line addBoxCollider used to be on,
   and placeProp emits anything the body did not ask for as a backstop. G.world.colliderDigest is
   an ordered hash, so a reshuffle shows up as a red battery rather than as a bird that walks
   through a wall in a corner nobody photographs. */
const PROPS={}, PROPSIGNORED=[]; let PROPSCFGDONE=false;
const PROPDEFAULTS={
  biome:'carpark',
  source:'primitive',     // or 'model'
  url:null,               // 'models/<file>.glb', served out of assets/ — needs its licence row
  /* MODEL NORMALISATION, the bird's own pattern: a target size in GAME METRES and the axes the
     asset arrives on, so a model is brought to this game's units and orientation by measurement
     rather than by a typed-in scale that is wrong the moment the file is re-exported. `standM` is
     the height the prop should occupy; null means "trust the file's own units". */
  fit:{standM:null,axis:'y',ry:0,ground:true},
  at:{x:0,y:0,z:0,ry:0,scale:1},
  collider:[],
  anchors:{},
  /* MATERIAL POLICY.
     `family` NAMES A REAL P3 SCANNED FAMILY OR NOTHING, and defineProp throws on anything else.
     It is the family a MODEL should be dressed in — the intent recorded for whoever brings the
     file — and it is deliberately NOT a claim about what the primitive body wears, because a
     primitive body wears as many families as it has colours: the ski lodge alone is untinted
     ranger green, a corrugate roof and cream piles. What the body actually resolved is MEASURED
     instead, per placement, off the materials themselves (`p.families`), which cannot be wrong the
     way a declaration can.
     `keepModelPBR` decides whether a model arrives wearing its own maps or is overridden.
     `color` is consulted only when keepModelPBR is false; null means "keep whatever the file came
     with", so an override can drop bad MAPS without also inventing a hue.
     `nightTint` enrols the prop's materials in the night lerp either way, which is the half a
     bare loader would have dropped on the floor. */
  material:{family:null,keepModelPBR:true,nightTint:false,color:null},
  build:null,
};
function defineProp(id,e){
  if(PROPS[id])throw new Error('defineProp: '+id+' is already registered');
  const d=PROPDEFAULTS;
  const o={id,
    biome:e.biome||d.biome,
    source:e.source||d.source,
    url:e.url||d.url,
    fit:Object.assign({},d.fit,e.fit),
    at:Object.assign({},d.at,e.at),
    collider:(e.collider||d.collider).slice(),
    anchors:Object.assign({},e.anchors),
    material:Object.assign({},d.material,e.material),
    build:e.build};
  if(typeof o.build!=='function')throw new Error('defineProp: '+id+' has no primitive builder');
  /* A MISSPELLED FAMILY MUST NOT LOOK LIKE A POLICY. 'corrugated' is not a family and 'metal' has
     never been one — both were in the first cut of this registry, and neither would have done
     anything at all. Checked against MATS.families, which is where the seven names actually live. */
  if(o.material.family!==null&&!(o.material.family in MATS.families))
    throw new Error('defineProp: '+id+' names no such material family: '+o.material.family+
      ' (known: '+Object.keys(MATS.families).join(', ')+')');
  if(o.source==='model'&&!o.url)throw new Error('defineProp: '+id+' is source:model with no url');
  PROPS[id]=o; return o;
}
function propOf(id){ const e=PROPS[id]; if(!e)throw new Error('placeProp: no prop registered as "'+id+'"'); return e; }
/* KEAPROPS REACHES ANY ENTRY, same seam and same reason as KEASKY, KEAMATS, KEAGRASS and KEABIRD:
   a swap is a look decision and it has to be shootable without a rebuild.
       KEAPROPS='{"bench":{"source":"model","url":"models/placeholder_box.glb"}}'
   Only keys that already exist on the entry are honoured, and every path that was refused travels
   out in G.propsCfg.ignored for the rig to fail the pass on — a misspelled id must not look like a
   swap that did nothing. */
function propsConfig(){
  const cfg=(typeof globalThis!=='undefined'&&globalThis.__KEA_PROPS__)||{};
  for(const [id,over] of Object.entries(cfg)){
    if(!PROPS[id]){ PROPSIGNORED.push(id+' (no such prop)'); continue; }
    matMerge(PROPS[id],over,id,2,PROPSIGNORED);
    if(PROPS[id].source==='model'&&!PROPS[id].url)PROPSIGNORED.push(id+'.source (model with no url)');
  }
}
/* WORLD-SPACE FROM PROP-SPACE, and it is the only conversion in the seam. Scale, then the
   placement yaw, then the placement origin — the same composition Object3D applies to the group,
   written out because an anchor must be answerable without a matrix update mid-frame. */
function propLocalToWorld(p,a){
  const s=p.at.scale; let x=a.x*s, y=(a.y||0)*s, z=a.z*s;
  const ry=p.at.ry;
  if(ry){ const sn=Math.sin(ry), cs=Math.cos(ry); const tx=x*cs+z*sn, tz=-x*sn+z*cs; x=tx; z=tz; }
  return {x:p.at.x+x, y:(p.at.y||0)+y, z:p.at.z+z};
}
function propAnchor(p,name){
  const a=p.entry.anchors[name];
  if(!a)throw new Error('prop '+p.id+': no anchor "'+name+'" (has '+Object.keys(p.entry.anchors).join(', ')+')');
  return propLocalToWorld(p,a);
}
function propCollider(p,c){
  const w=propLocalToWorld(p,{x:c.x||0,y:0,z:c.z||0});
  const ry=(c.ry||0)+p.at.ry, s=p.at.scale;
  if(c.kind==='roof')
    return {kind:'roof',x:w.x,z:w.z,w:c.w*s,d:c.d*s,ridge:c.ridge*s,slope:c.slope,
            slide:!!c.slide,hut:!!c.hut};
  /* FULL DIMS IN, HALF-EXTENTS OUT — the addBoxCollider convention, kept so a collider line reads
     the same in an entry as it did at the call site it was lifted from. */
  return {kind:'box',x:w.x,z:w.z,w:c.w*s/2,d:c.d*s/2,top:c.top*s,
          solid:c.solid!==false,ry:ry||0};
}
function placeProp(id,over){
  const e=propOf(id);
  const at=Object.assign({},e.at,over&&over.at);
  const g=new THREE.Group();
  g.position.set(at.x,at.y||0,at.z);
  if(at.ry)g.rotation.y=at.ry;
  if(at.scale!==1)g.scale.setScalar(at.scale);
  G.scene.add(g);
  const p={id,entry:e,at,group:g,mode:'primitive',body:[],colliders:[],model:null,
           source:(over&&over.source)||e.source};
  p.collide=()=>{ if(p._collided)return p.colliders; p._collided=true;
    for(const c of e.collider){ const out=propCollider(p,c); G.colliders.push(out); p.colliders.push(out); }
    return p.colliders; };
  p.anchor=(name)=>propAnchor(p,name);
  /* THE BODY IS WHATEVER THE BUILDER PUT IN THIS GROUP, recorded rather than re-parented. Most
     builders already made their own group at the prop's position and hung everything off it, so
     this group IS that group and not one level more — which is why the mesh digest does not move.
     The two that added straight to the scene gain one empty Group above them and nothing else. */
  e.build(g,p);
  p.body=g.children.slice();
  /* WHAT THIS BODY ACTUALLY WEARS, measured rather than declared. Every material that belongs to a
     P3 family carries its name in userData.matFamily, so this is a read and not a guess — and it is
     the line a future model author wants: "the hut is weatherboard and corrugate", from the hut. */
  { const fams=new Set();
    g.traverse(o=>{ const m=o.isMesh&&o.material;
      if(m&&m.userData&&m.userData.matFamily)fams.add(m.userData.matFamily); });
    p.families=Array.from(fams).sort(); }
  p.collide();
  (G.propReg=G.propReg||[]).push(p);
  return p;
}
/* THE PLACEMENT, BY ID. propAt() was already taken by the loose-carryable helper and the two are
   different things: that one MAKES a carryable, this one FINDS a placed world prop. */
function propPlaced(id){ return (G.propReg||[]).find(p=>p.id===id)||null; }
/* WHAT THE SEAM ACTUALLY DID, for the batteries and the rig to read rather than infer. */
function propsState(){
  const reg=G.propReg||[];
  return {registered:Object.keys(PROPS).length,
          placed:reg.length,
          primitive:reg.filter(p=>p.mode==='primitive').length,
          model:reg.filter(p=>p.mode==='model').length,
          wantModel:reg.filter(p=>p.source==='model').map(p=>p.id),
          colliders:reg.reduce((n,p)=>n+p.colliders.length,0),
          anchors:reg.reduce((n,p)=>n+Object.keys(p.entry.anchors).length,0),
          families:Object.fromEntries(reg.filter(p=>p.families&&p.families.length)
                                         .map(p=>[p.id,p.families])),
          ignored:PROPSIGNORED.slice()};
}

/* ---------- THE BIOME REGISTRY (TODO 36, the tour chassis) ----------
   The tour turns this game into separate maps, one diorama per biome. Nothing about that can start
   until there is a seam to put the second map through, and this is it: the world is no longer THE
   world, it is a biome that happens to be the only one registered. What used to be the body of
   buildWorld is now buildCarpark, moved without a single line reordered inside it, because every
   rnd() draw in the browser is downstream of every earlier one and the smallest reshuffle repins
   the country - the snow-patch lesson, and the reason this piece has a zero-observable-change proof
   contract rather than a feature.
   THE DISPATCHER KEEPS THE TWO THINGS THAT MUST BE TRUE OF EVERY BIOME: the registries are emptied
   before the build (TODO 48), and G.biome names what was actually built, so nothing downstream has
   to guess. An unknown id falls back to the default rather than throwing, because a save or a URL
   naming a biome that no longer exists should land you somewhere real. */
const BIOMES={}, BIOME_DEFAULT='carpark';
function defineBiome(id,o){ BIOMES[id]=Object.assign({id},o); return BIOMES[id]; }
function biomeOf(id){ return BIOMES[id]||BIOMES[BIOME_DEFAULT]; }
function buildWorld(biome){
  const b=biomeOf(biome||G.biome||BIOME_DEFAULT);
  G.biome=b.id;
  /* REPLAT P6A: THE KEAPROPS OVERRIDES ARE APPLIED ONCE, HERE, and not at module scope, because
     the entries are declared next to the builders they wrap — which is further down the file than
     any module-scope line that could merge them. First build, before a single prop is placed. */
  if(!PROPSCFGDONE){ PROPSCFGDONE=true; propsConfig(); }
  for(const r of WORLDREGS)if(Array.isArray(G[r]))G[r].length=0;
  for(const h of WORLDHANDLES)G[h]=null;                 // TODO 62: and the handles, above the biome
  for(const l of WORLDLISTS)G[l]=[];
  for(const k in WORLDFLAGS)G[k]=WORLDFLAGS[k];
  b.build();
  matUVSweep();
  /* REPLAT P6A: the prop seam reports what it placed, rebuilt per build for the same reason G.mats
     is — a state block that is mutated rather than rebuilt drifts from the registry. */
  G.propsState=propsState();
  /* REPLAT P3: the provenance block is REBUILT once the map has built its materials, not mutated,
     so it can never drift from the registry. initScene declares the slot before anything exists
     (mode 'none', zero materials, exactly like G.ibl); this is where the material counts become
     real, and travel through the map screen refreshes them for the biome it just built. */
  G.mats=matState();
}
function buildCarpark(){
  /* THE MAP OWNS ITS NEST SITE (TODO 39). buildNest is called below off G.nestPos, which was a G
     default and so a global that only looked like a constant. The ski field sets its own, and the
     day it did, the next carpark build would have put the carpark nest up the mountain. Same value
     it has always had, declared by the map that uses it. */
  G.nestPos={x:-4,z:-33};
  // terrain
  const GRD=GRASS.ground;
  const gg=new THREE.PlaneGeometry(240,240,GRD.segs,GRD.segs);
  const pos=gg.attributes.position;
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i),y=pos.getY(i); const d=Math.sqrt(x*x+y*y);
    let h=0; if(d>58) h=(d-58)*0.06*(1+0.4*Math.sin(x*0.08)*Math.cos(y*0.07));
    h+=Math.sin(x*0.15)*Math.cos(y*0.13)*0.18; pos.setZ(i,h); }
  gg.computeVertexNormals();
  { const cols=[],c1=new THREE.Color(PAL.ground).convertSRGBToLinear(),c2=new THREE.Color(PAL.ground2).convertSRGBToLinear(),c3=new THREE.Color(PAL.ground3).convertSRGBToLinear(),cg=new THREE.Color(PAL.gravel).convertSRGBToLinear();
    const pp=gg.attributes.position;
    const cR=new THREE.Color(PAL.rock).convertSRGBToLinear();
    /* maskScale MULTIPLIES ONLY THE MASK'S OWN FREQUENCIES. It deliberately does NOT scale x,y
       for the two features below it — the carpark's gravel rectangle and the scree ring are
       PLACES, not pattern, and shrinking them would confound the very measurement this knob
       exists to make. */
    const MS=GRD.maskScale;
    for(let i=0;i<pp.count;i++){ const x=pp.getX(i),y=pp.getY(i), mx=x*MS, my=y*MS;
      const n=Math.sin(mx*0.11+1.7)*Math.cos(my*0.09)+Math.sin(mx*0.31)*0.5+Math.cos(my*0.27+0.6)*0.5;
      let c=n>0.55?c3.clone():(n<-0.55?c2.clone():c1.clone());
      if(Math.abs(y+2)<16&&Math.abs(x)<26&&n>0.1)c=cg.clone().lerp(c1,0.45); // braided-gravel carpark
      const d=Math.hypot(x,y); if(d>55)c.lerp(cR,Math.min(0.85,(d-55)/38)); // scree toward the ring
      cols.push(c.r,c.g,c.b); }
    gg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
  /* REPLAT P3: THE LAST PROCEDURAL CANVAS ON A SWAPPED FAMILY DIED HERE. This was 2600 fixed-seed
     speckles on a 256px canvas repeated 9x9 over 240 m — which is one dot every 400 mm, a
     resolution that could only ever read as noise, and it was the only "texture" the ground of the
     whole opening biome had. It is the grass scan now, at the publisher's own 2 m tile, which is
     ~120 tiles across the plane and about 2 mm per texel where the bird actually stands. The
     HEADLESS branch is gone with it: matGround allocates no canvas, so node and the browser build
     the same material and a battery can read it. */
  const gMat=matGround('grass',0.95);
  uvMetres(gg);
  const ground=new THREE.Mesh(gg,gMat); ground.rotation.x=-Math.PI/2;
  if(!HEADLESS)ground.receiveShadow=true; G.scene.add(ground);
  buildGrass('carpark'); buildTrees();

  // mountain ring: two depth layers, vertex snowline blend
  for(let i=0;i<18;i++){ const far=i%2===0, a=i/18*Math.PI*2+rnd(-0.1,0.1), r=far?rnd(135,165):rnd(102,128);
    const h=far?rnd(34,60):rnd(24,46), w=far?rnd(45,70):rnd(28,50);
    const geo=new THREE.ConeGeometry(w,h,22,7);
    { // sculpt: multi-octave radial noise carves a ridgeline out of the cone
      const pos=geo.attributes.position, ph=rnd(0,6.3), ph2=rnd(0,6.3);
      for(let v=0;v<pos.count;v++){
        const x=pos.getX(v), y=pos.getY(v), z=pos.getZ(v);
        const rr=Math.hypot(x,z); if(rr<0.001)continue;
        const ang=Math.atan2(z,x), t01=y/h+0.5;
        const nz=0.55*Math.sin(ang*3+ph)+0.3*Math.sin(ang*7+ph2)+0.15*Math.sin(ang*13+ph*2);
        const kR=1+nz*0.28*(1-t01*0.55);
        pos.setX(v,x*kR); pos.setZ(v,z*kR);
        pos.setY(v,y+h*0.05*Math.sin(ang*5+ph2)*t01);
      }
      geo.computeVertexNormals();
    }
    { const cols=[],pos=geo.attributes.position, cS=new THREE.Color(PAL.mtnSnow).convertSRGBToLinear(), cR=new THREE.Color(far?PAL.mtnFar:PAL.mtn).convertSRGBToLinear();
      if(far){ const hz=new THREE.Color(0x9FB8CC).convertSRGBToLinear(); cR.lerp(hz,0.2); cS.lerp(hz,0.14); }
      for(let v=0;v<pos.count;v++){ const t=clamp((pos.getY(v)/h+0.5-0.72)*8,0,1);
        const c=cR.clone().lerp(cS,t); cols.push(c.r,c.g,c.b); }
      geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
    const m=new THREE.Mesh(geo,mat(0xFFFFFF,{vertexColors:true}));
    m.position.set(Math.cos(a)*r,h*0.34,Math.sin(a)*r); m.rotation.y=rnd(0,3); G.scene.add(m);
  }
  /* ---- ROLLING TUSSOCK HILLS: the depth band between the flats and the peaks ----
     TODO 80, FIXED IN REPLAT P4e. These were SphereGeometry(rad,18,10) squashed to scale.y 0.2-0.3
     with a sculpt loop that only ever touched x and z. Ten height bands means the two nearest the
     pole are already almost horizontal, and squashing to a quarter of the radius collapses them
     into a genuinely FLAT CAP several metres across — which at their placement radius of 64-84 m
     presents as a dead straight horizontal line against the sky. After P4d removed the last lattice
     from the grass these were the only straight edges left in a wide frame, which is exactly why
     they were written down rather than left for Eric to find twice.
     TWO CHANGES AND THEY ARE BOTH ABOUT THE VERTICAL. The band count goes 10 -> 18 so the cap has
     geometry to be shaped WITH, and the sculpt now displaces RADIALLY IN 3D — the vertex is pushed
     along its own direction from the centre, so a point at the pole moves UP rather than sideways.
     The old loop scaled x and z by k and left y alone, which is precisely why no amount of noise in
     it could ever break a flat top: at the pole x and z are zero and k multiplies nothing.
     THREE OCTAVES, TWO OF THEM KEYED ON HEIGHT AS WELL AS ANGLE. A term that is a function of
     `ang` alone is constant up any meridian, so it corrugates the skirt and leaves the crown
     smooth; the t01 terms are what actually put a shoulder and a saddle into the top.
     AND THEY WEAR THE GROUND TINT NOW, WHICH IS THE OTHER HALF OF TODO 80. They are separate
     vertex-coloured geometry that never went through matGround, so tinted flat ground met untinted
     gold hill along a visible join — recorded as an open colour seam in the P4b, P4c and P4d
     recipes and closed here. Same GRASS.groundTint, same linear space, applied to the vertex colour
     rather than to the material because the material is the shared white vertex-colour one. */
  { const cG=new THREE.Color(PAL.ground2).convertSRGBToLinear(), cT=new THREE.Color(PAL.tussock).convertSRGBToLinear();
    const gt=new THREE.Color(GRASS.groundTint).convertSRGBToLinear();
    for(let i=0;i<9;i++){ const a=i/9*Math.PI*2+rnd(-0.22,0.22), r=rnd(64,84);
      const rad=rnd(13,21);
      const hg=new THREE.SphereGeometry(rad,18,18);
      const pos=hg.attributes.position, ph=rnd(0,6.3), ph2=rnd(0,6.3);
      for(let v=0;v<pos.count;v++){ const x=pos.getX(v),y=pos.getY(v),z=pos.getZ(v);
        const ang=Math.atan2(z,x), t01=clamp(y/rad*0.5+0.5,0,1);
        const k=1 + 0.16*Math.sin(ang*3+ph) + 0.10*Math.sin(ang*6+ph*2)
                  + 0.13*Math.sin(ang*2+ph2)*Math.sin(t01*3.1)
                  + 0.07*Math.cos(ang*5+ph2*1.7)*Math.sin(t01*5.3+ph);
        pos.setX(v,x*k); pos.setY(v,y*k); pos.setZ(v,z*k); }
      hg.computeVertexNormals();
      { const cols=[]; for(let v=0;v<pos.count;v++){ const t=clamp(pos.getY(v)/rad*0.5+0.5,0,1);
          const c=cG.clone().lerp(cT,t*0.85).multiply(gt); cols.push(c.r,c.g,c.b); }
        hg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
      const hm=new THREE.Mesh(hg,mat(0xFFFFFF,{vertexColors:true}));
      hm.scale.y=rnd(0.2,0.3); hm.position.set(Math.cos(a)*r,-rad*0.06,Math.sin(a)*r);
      hm.name='tussockHill';
      G.scene.add(hm);
    } }
  // THE SKI FIELD (SW): rope-tow base, rack of skis, the most documented crime scene in the country
  { const B=placeProp('sw_tow_shed'), bx=B.at.x, bz=B.at.z;
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,0.16,14),mat(PAL.red));
    wheel.rotation.x=Math.PI/2; wheel.position.set(bx+2.1,2.2,bz); G.scene.add(wheel); G.towWheel=wheel;
    cyl(0.09,0.09,2.2,PAL.metal,bx+2.1,1.1,bz,null,8);
    box(1.8,0.08,0.12,PAL.woodD,bx-0.4,0.9,bz+1.9); cyl(0.05,0.05,0.9,PAL.woodD,bx-1.2,0.45,bz+1.9,null,6); cyl(0.05,0.05,0.9,PAL.woodD,bx+0.4,0.45,bz+1.9,null,6);
    const rackY=railTop(bx-0.4,bz+1.9,1.8,0.34,0.94);      // TODO 63: the rack now holds what is put on it
    /* THE BINDING NEEDS ELBOW ROOM NOW THAT THE SKIS ARE ACTUALLY ON THE RACK. The two of them sat
       0.4 apart with the CHEW THE BINDING tear between them, which was fine while they were lying in
       the dirt 0.9 metres below it: interact() measures from the beak - y plus 0.4 - so raising them
       to the rail put a ski 0.395 from the beak against the tear 0.41, and holding the key at the
       binding picked up a ski instead. Measured, not guessed, and the drive that found it is the
       piece 18 fix-verb section, which works on the first solo tear in the world and this is it.
       Half a ski width each way and the tear is the nearest thing again. */
    const sk1=propAt('ski',bx-1.0,rackY,bz+1.95,PB.ski,{heavy:true,missionFar:'s_ski',farR:18}); sk1.mesh.rotation.x=1.35;
    const sk2=propAt('ski',bx-0.4,rackY,bz+1.95,PB.ski,{heavy:true}); sk2.mesh.rotation.x=1.35;
    /* AND THE POLES WERE STANDING IN THE GROUND. Placed upright at 0.7 with a 1.15 shaft, they fell
       to 0.08 and spent every frame of every session half sunk in the dirt. They lie across the rack
       like the skis do now, which is where a pole in a rack is. */
    propAt('ski pole',bx+0.1,rackY,bz+1.95,PB.skipole,{mission:'s_pole'}).mesh.rotation.x=1.35;
    propAt('ski pole',bx+0.3,rackY,bz+1.95,PB.skipole,{}).mesh.rotation.x=1.35;
    propAt('ski goggles',bx-1.2,0.2,bz+2.25,PB.goggles,{wearable:true,mission:'s_goggles'}); // dropped at the rack, as they always are
    addTear({label:'CHEW THE BINDING',need:1.6,range:1.2,air:true,keepMesh:true,getPos:()=>({x:bx-0.7,y:0.95,z:bz+1.95}),
      onDone(p){ award(35,'BINDING: CHEWED',p); done('s_binding'); AU.pop(); burst(p,PAL.dark,8); }});
  }
  // THE TRAILHEAD (SE): the big DOC sign, an unattended pack, a boot rail
  { const SG=placeProp('doc_board'), sg=SG.group, tx=SG.at.x, tz=SG.at.z;
    { const pth=[]; for(let i=0;i<=5;i++)pth.push({x:-1.0+i*0.4,y:2.12,z:0.07});
      addStrip({group:sg,path:pth,thick:{x:0.4,y:0.28,z:0.04},color:PAL.paper,
        label:'PEEL THE 3 HR RETURN STICKER',need:0.5,range:1.25,owner:null,mission:'t_sign',
        propName:'track sticker',propBuilder:PB.longSticker,propExtra:{shiny:true},points:30,doneText:'TRACK TIME: REVISED'});
    }
    const PK=placeProp('trail_pack'), pk=PK.group;
    addTear({label:'UNZIP THE UNATTENDED PACK',need:1.8,range:1.2,air:true,keepMesh:true,getPos:()=>PK.anchor('zip'),
      onDone(p){ award(35,'PACK: OPENED',p); done('t_pack');
        const mb=spawnLoose('muesli bar',PB.muesli,{x:tx-2.4,y:1.1,z:tz+1.4},{food:true}); mb.snack='t_bar'; mb.vy=1.4; mb.vx=0.6; AU.pop(); }});
    box(1.6,0.06,0.1,PAL.woodD,tx+2.2,0.75,tz+1.0); cyl(0.05,0.05,0.75,PAL.woodD,tx+1.5,0.37,tz+1.0,null,6); cyl(0.05,0.05,0.75,PAL.woodD,tx+2.9,0.37,tz+1.0,null,6);
    const railY=railTop(tx+2.2,tz+1.0,1.6,0.34,0.78);      // TODO 63: the boot rail is a rail again
    propAt('walking pole',tx+1.8,railY,tz+1.1,PB.walkpole,{missionProg:'t_pole2'}).mesh.rotation.x=1.35;
    propAt('walking pole',tx+2.5,railY,tz+1.1,PB.walkpole,{missionProg:'t_pole2'}).mesh.rotation.x=1.35;
    propAt('woollen sock',tx+2.15,0.2,tz+1.45,PB.sock,{mission:'t_sock'});  // it blew off the rail hours ago
  }
  // campsite clothes line: three pegs, all crimes
  { const cx=19,cz=-17;
    cyl(0.05,0.06,1.5,PAL.woodD,cx-1.5,0.75,cz,null,6); cyl(0.05,0.06,1.5,PAL.woodD,cx+1.5,0.75,cz,null,6);
    box(3.0,0.02,0.02,0xD8D2C4,cx,1.42,cz,null,{noshadow:true});
    /* THE PEGS WERE ON THE GROUND UNDER THE LINE, all three of them, in every frame ever shot of
       that corner - and the mission says steal all three clothes PEGS, which reads differently when
       they are lying in the dirt. The line holds them now. */
    const lineY=railTop(cx,cz,3.0,0.24,1.43);
    propAt('clothes peg',cx-0.8,lineY,cz,PB.peg,{missionProg:'q_pegs'});
    propAt('clothes peg',cx,lineY,cz,PB.peg,{missionProg:'q_pegs'});
    propAt('clothes peg',cx+0.8,lineY,cz,PB.peg,{missionProg:'q_pegs'});
  }
  // dark beech skirts where the slopes meet the flats
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2+rnd(-0.15,0.15), r=rnd(88,100);
    const b=new THREE.Mesh(new THREE.ConeGeometry(rnd(14,24),rnd(5,9),6),nightTint(mat(PAL.beech)));
    b.position.set(Math.cos(a)*r,1.4,Math.sin(a)*r); b.scale.y=0.7; b.rotation.y=rnd(0,3); G.scene.add(b);
  }

  // ROAD along z=34, x -120..120
  const road=box(240,0.12,9,PAL.road,0,0.06,34,null,{noshadow:true}); road.receiveShadow=!HEADLESS;
  box(240,0.125,0.5,0x6A7280,0,0.065,29.7,null,{noshadow:true}); box(240,0.125,0.5,0x6A7280,0,0.065,38.3,null,{noshadow:true}); // edge wear
  for(let x=-118;x<120;x+=6) box(2.6,0.13,0.28,PAL.roadLine,x+rnd(-0.3,0.3),0.13,34,null,{noshadow:true});
  for(let x=-116;x<120;x+=9){ cyl(0.05,0.06,0.85,PAL.white,x,0.42,28.6,null,6); box(0.12,0.1,0.03,PAL.red,x,0.78,28.66,null,{noshadow:true});
    cyl(0.05,0.06,0.85,PAL.white,x+4.5,0.42,39.4,null,6); } // roadside marker posts
  /* carpark slab
     REPLAT P2: THE CARPARK NOW RECEIVES SHADOWS, and this is the fix that made "soft shadows" mean
     anything. `noshadow:true` on these plates turns off BOTH cast and receive, which is right for
     casting — a 14cm slab lying flat on the ground casts nothing but its own acne — and wrong for
     receiving, because the carpark IS the ground for the whole opening set. The sun has had
     castShadow on since long before the re-platform and every car has cast dutifully into a
     surface that could not take it, so 01_carpark_wide, 07_jam and 12_seal_midpeel have never had
     a cast shadow in them. ARTBIBLE PHASE 1 lists "no cast shadows anywhere" as a GAP and treats
     it as work not yet done; it was one flag per surface.
     NOT A NEW IDIOM — THE FILE ALREADY HAD IT TWICE. The road two blocks up and the ski-field
     slab both do exactly this, `{noshadow:true}` followed by an explicit receiveShadow, and the
     carpark was simply missed. The bay markings get it too: they sit 2cm above the tarmac, so a
     shadow crossing a bay would otherwise leave the white line glowing straight through it. */
  { const slab=box(40,0.14,22,PAL.tarmac,2,0.07,17,null,{noshadow:true}); slab.receiveShadow=!HEADLESS;
    const apron=box(8,0.13,8,PAL.tarmac,2,0.14,27,null,{noshadow:true}); apron.receiveShadow=!HEADLESS; } // entrance apron
  for(let i=0;i<5;i++){ const bay=box(0.25,0.14,5.4,PAL.roadLine,-12+i*6.6,0.16,13.4,null,{noshadow:true}); bay.receiveShadow=!HEADLESS; }
  for(const [px,pz,pr] of [[-8,24.5,1.3],[14,10,1.0],[-2,20,0.8]]){ const pd=cyl(pr,pr,0.03,0,px,0.145,pz,null,16); pd.material=bmat(0xC6DCE8); } // puddles
  G.gravel=[]; // carpark grit, named: vantage 18 caught one behind the bird and nothing could say what it was
  for(let i=0;i<26;i++){ const grr=rnd(0.05,0.12), gcol=i%2?0x9AA0A6:PAL.gravel, gx=2+rnd(-19,19), gz=17+rnd(-10,10);
    const gr=sph(grr,gcol,gx,0.16,gz,null,5); gr.scale.y=0.5;
    G.gravel.push({x:gx,z:gz,r:grr,color:gcol}); } // gravel scatter

  buildHut();
  buildPicnic();
  buildBench();
  buildTent();
  buildBin();
  buildSign();
  { // kea-crossing diamonds: seeded scatter across half the areas
    let ks=29; const kr=()=>{ ks=(ks*16807)%2147483647; return ks/2147483647; };
    const spots=[[-16,12,0.5],[24,-20,-0.6],[-18,-2.5,1.2],[-28,31.2,0],[23,36.6,Math.PI],[-33,-31,0.8],[37,-33,-0.9]];
    for(let i=spots.length-1;i>0;i--){ const j=Math.floor(kr()*(i+1)); const t=spots[i]; spots[i]=spots[j]; spots[j]=t; }
    for(let i=0;i<4;i++){ const sp=spots[i]; mkKeaSign(sp[0]+(kr()-0.5)*2,sp[1]+(kr()-0.5)*2,sp[2]+(kr()-0.5)*0.4); }
  }
  { // the verge: a roadworks paddle, STOP one side and GO the other, nobody minding it
    const P=placeProp('roadworks_paddle'), px=P.at.x, pz=P.at.z, pad=P.pad;
    G.paddle=pad; G.paddleFlipped=false;
    addPeck({label:'FLIP THE ROADWORKS PADDLE',needHits:2,range:1.35,repeat:true,
      getPos:()=>P.anchor('face'),
      onDone(p){ G.paddleFlipped=!G.paddleFlipped; G.paddleFlips=(G.paddleFlips||0)+1;
        const to=G.paddleFlipped?1:0, from=G.paddleFlipped?0:1;
        TW.add(0.5,u=>{ pad.rotation.y=(from+(to-from)*u)*Math.PI; });
        AU.pop(); burst(p,PAL.bad,5);
        if(!G.paddleDone){ G.paddleDone=true; award(25,'PADDLE: FLIPPED. NOT YOUR JOB.',p);
          done('r_paddle'); noise({x:px,y:1.0,z:pz},6,'misdeed',null); }
      }});                                  // repeat: it flips back and forth, but it only pays once
  }
  buildTrailer();
  buildNest(G.nestPos.x,G.nestPos.z);
  buildSheepPen();
  buildConeStack(20,29.5);

  // parked vehicles in bays
  G.cars.push(placeCar('car_red'));
  G.cars.push(placeCar('car_blue'));
  G.cars.push(placeCar('car_white'));
  G.cars.push(placeCar('car_yellow'));
  G.cars.push(mkCampervan());
  G.cars.push(mkDocUte());
  addHint('roofhonk',0,0.8,26,6,'traffic passes here — a roof looks very rideable');
  addHint('jam',0,0.8,34,5,'stand your ground and see what the traffic does');
  addHint('q_median',0,0.4,34,4,'the centre line: stay on foot, collect a honk');
  addHint('airmail',0,4.5,30,8,'anything dropped from way up here counts as air mail');
  addPeck({label:'PECK THE UTE',needHits:2,getPos:()=>({x:12,y:1.0,z:7}),range:1.25,
    onDone(p){ award(12,'UTE: PECKED. IT HAD IT COMING.',p); done('q_peck'); AU.pop(); }});

  { // grunge-lite v2 (2026-08-28): the country is old, and the wear reads the surface it is worn into
    let gs=11; const gr=()=>{ gs=(gs*16807)%2147483647; return gs/2147483647; };
    G.scene.updateMatrixWorld(true);
    const _wp=new THREE.Vector3();
    const paintAt=(x,z)=>{ // the laid surface under this spot, measured from what is already built
      let best=null;
      G.scene.traverse(m=>{ const g=m.geometry; if(!g||g.type!=='BoxGeometry')return;
        const p=g.parameters; if(p.width<4||p.depth<4)return;        // big laid surfaces only, never props
        m.getWorldPosition(_wp); const top=_wp.y+p.height/2;
        if(top>0.6||(best&&top<=best.top))return;                    // ground level only
        if(Math.abs(x-_wp.x)<=p.width/2&&Math.abs(z-_wp.z)<=p.depth/2) best={top,mat:m.material}; });
      return best; };
    G.stones=[];
    for(let i=0;i<60&&G.stones.length<26;i++){ const gx=(gr()-0.5)*88, gz=(gr()-0.5)*88;
      if(Math.abs(gx)<4&&Math.abs(gz-4)<6)continue; if(Math.hypot(gx,gz-34)<5)continue;
      const sc=0.10+gr()*0.22, gc=gr()<0.5?0x8E8B84:0x9B9891;
      const rx=gr()*3, ry=gr()*3, rz=gr()*3, sy=0.55+gr()*0.35;
      if(paintAt(gx,gz))continue;                                    // the seal is swept: loose stones live on the country
      const st=new THREE.Mesh(new THREE.DodecahedronGeometry(sc,0),mat(gc));
      st.position.set(gx,sc*0.42,gz); st.rotation.set(rx,ry,rz);
      st.scale.y=sy; st.castShadow=!HEADLESS; G.scene.add(st); G.stones.push({x:gx,z:gz}); }
    G.wear=[]; // desire paths: hut door, carpark mouth, campsite, hut cut, road pull-in, campsite track
    for(const [wx,wz,wr] of [[-24,-4.6,1.6],[0,7.5,2.4],[16.5,-14,1.8],[-19.5,1.5,1.9],[13,32.5,2.0],[15.5,-1.0,1.7]]){
      const pa=paintAt(wx,wz);
      const col=pa?pa.mat.color.clone().convertLinearToSRGB().multiplyScalar(0.72).getHex():0x8A7A52; // oil-dark on seal, brown on dirt
      const wy=pa?pa.top+0.006:0.012;
      const wm=new THREE.Mesh(new THREE.CircleGeometry(wr,18),mat(col));
      wm.rotation.x=-Math.PI/2; wm.position.set(wx,wy,wz); wm.receiveShadow=!HEADLESS; G.scene.add(wm);
      G.wear.push({x:wx,z:wz,r:wr,y:wy,color:col,paint:!!pa}); }
  }
  /* THE OLD TUSSOCK CONES ARE GONE — REPLAT P4b. 260 five-sided ConeGeometry cones, 0.9 m tall,
     scattered across the country as a stand-in for tussock mounds. P4 built a real blade field and
     LEFT THESE IN, on the reasoning that removing them shifts the seeded stream. Eric played it and
     named the result exactly: both grass systems live at once, so the ground read as sand with
     party hats. A superseded system is not a fallback. The blades do this job now.
     THE STREAM DOES NOT MOVE. This whole block was inside `if(!HEADLESS)`, so node never made
     these draws and no battery ever saw them — deleting it changes the browser world and nothing
     the gate reads. */
  if(!HEADLESS){
    // snow patches — the only ground decal that used to ignore what was already built there
    for(let i=0;i<10;i++){ const x=rnd(SNOWFIELD.x0,SNOWFIELD.x1),z=rnd(SNOWFIELD.z0,SNOWFIELD.z1),r=rnd(1.5,3.6);
      const q=snowSpot(x,z,r);
      const sp=new THREE.Mesh(new THREE.CircleGeometry(r,20),mat(PAL.snow)); sp.rotation.x=-Math.PI/2;
      sp.position.set(q.x,0.05,q.z); sp.receiveShadow=true; G.scene.add(sp);
      const so=new THREE.Mesh(new THREE.CircleGeometry(r*1.35,20),new THREE.MeshStandardMaterial({color:0xFFFFFF,transparent:true,opacity:0.42,roughness:0.96}));
      so.rotation.x=-Math.PI/2; so.position.set(q.x,0.042,q.z); G.scene.add(so);
      // registered the way G.wear and G.stones are, so what actually landed is inspectable
      G.snow.push({x:q.x,z:q.z,r,y:0.05,want:{x,z},slid:q.slid,stuck:!!q.stuck,disc:sp,halo:so}); }
    for(let i=0;i<14;i++){ const a=rnd(0,6.3),r=rnd(42,54);
      const rk=sph(rnd(0.5,1.6),i%2?PAL.rock:PAL.rockD,Math.cos(a)*r,0.2,Math.sin(a)*r,null,6); rk.scale.y=0.6; }
  }
}
/* THE ANCHOR IS PART OF DECLARING A BIOME (TODO 38). It is the establishing shot: where the camera
   stands to show you the whole map on the way out and on the way in. It is a TABLE and not a
   derivation, and that is the binding evidence from the Sep 1 investigation rather than a
   preference - area centroids cannot come from hints or mission props, because three or four
   chapters have none and the paddock resolved forty units off the paddock. What the table CAN be
   held to is the world it names, and the battery does exactly that: the look-at sits on the built
   prop centroid, so the day somebody moves the carpark and not this line, an assertion says so. */
function castCarpark(){
  // humans
  G.humans.push(new Human('trish','Trish',PAL.red,15,-10.5,{hat:'beanie',patrol:[{x:15,z:-10.5},{x:13,z:-13.8},{x:17,z:-12}]}));
  G.humans.push(new Human('tom','Tramper Tom',0x2F6E5E,28,0,{asleep:true,hat:'beanie'}));
  { const tomH=G.humans[G.humans.length-1];
    const bn=propAt("tramper's beanie",tomH.x+1.05,0.9,tomH.z,PB.beanie,{wearable:true,owner:'tom',sleepGuard:'tom',mission:'b_beanie'});
    bn.srcHatG=tomH.hatG; if(tomH.hatG)tomH.hatG.visible=false; }
  const dave=new Human('dave','Dave',PAL.blue,G.ladder.x,G.ladder.z+0.6,{hat:'hard',vest:true}); dave.onLadder=true; G.humans.push(dave);
  G.humans.push(new Human('rex','Ranger Rex',PAL.ranger,8,24,{hat:'cap',hatColor:PAL.ranger,vest:false,
    patrol:[{x:8,z:24},{x:-6,z:22},{x:-14,z:12},{x:2,z:8},{x:14,z:12},{x:18,z:26}]}));
  { const rex=G.humans[G.humans.length-1];
    const tg=new THREE.Group(); tg.position.set(0.34,1.05,0.2); rex.g.add(tg);
    const body=cyl(0.045,0.05,0.24,PAL.dark,0,0,0,tg,8); body.rotation.x=1.57;
    const lens=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,8),new THREE.MeshBasicMaterial({color:0xFFE9B8,fog:false}));
    lens.position.set(0,0,0.14); lens.visible=false; tg.add(lens);
    const spot=new THREE.SpotLight(0xFFE0B0,0,17,0.42,0.5,1.5); spot.position.set(0,0,0.1);
    const tgt=new THREE.Object3D(); tgt.position.set(0,-0.35,4.5); tg.add(tgt); spot.target=tgt; tg.add(spot);
    const beam=new THREE.Mesh(new THREE.ConeGeometry(0.8,6.8,12,1,true),
      new THREE.MeshBasicMaterial({color:0xFFE0A6,transparent:true,opacity:0.08,side:THREE.FrontSide,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));
    beam.rotation.x=Math.PI/2-0.078; beam.position.set(0,-0.16,3.5); beam.visible=false; tg.add(beam);
    rex.torch={g:tg,spot,lens,beam};
  }
}
defineBiome('carpark',{label:'THE CARPARK',build:buildCarpark,cast:castCarpark,missions:missionsCarpark,
  anchor:{x:7,y:26,z:34, lx:7,ly:1,lz:-11},
  traffic:{up:32.2,down:35.8,x:115}});      // the two lanes of the road along z 34, where they have always been

/* ---------- THE CLUB SKI FIELD (TODO 39, the first new map) ----------
   36 built the seam, 37 built the brochure and 38 built the flyover, and no player could reach any
   of it, because a tour of one map is not a tour. This is the second map: a NZ club field at dawn -
   a rope tow straight up the fall line, a day lodge with the deck everybody eats on, racks of other
   people gear, a groomed band down the middle, and drifts banked against everything that stood
   still long enough.
   IT IS ADDITIVE, AND THAT IS THE WHOLE SHAPE OF THE PIECE. The GRADUATION the brief asks for -
   moving the carpark ski corner and its five missions up here - shifts every seeded draw after it
   and therefore re-pins all 25 baselines, and it takes five missions and a star page out of a live
   save. That is a judged call, so it is filed and not done: nothing below moves or deletes one line
   of the carpark.
   FLAT WHERE THE BIRD WALKS. groundHeightAt reads COLLIDERS and returns zero everywhere else, so a
   terrain mesh with a real gradient in it would have the bird walking on air above the snow or
   buried under it. The country therefore rises OUTSIDE the play clamp - pushOut holds the bird
   inside 52 - exactly the way the carpark does, and the fall line is told by the corduroy, the tow
   line and the drifts rather than by a slope nobody could stand on.
   THE MAP OWNS ITS NEST, ITS SNOW ENVELOPE AND ITS CAST, and every one of those three was a global
   that only looked like a constant while there was one map. */
const SKISNOW={x0:-52,x1:52,z0:-52,z1:52};        // up here the whole map is snow: the envelope is the map
const SKITOW={x:4, base:24, top:-40, towers:[18,8,-2,-12,-22,-32], rope:3.2, ret:2.9};
const SKIPISTE={x0:10,x1:30,z0:-44,z1:30};
const SKILODGE={x:-22,z:8,w:11,d:7,h:3.0,deck:4.4};
/* ---- THE SKI FIELD'S THREE STRUCTURES — REPLAT P6A ----
   Same treatment as the carpark's, and the same reason: all three were inline blocks inside
   buildSkifield with their colliders as literals underneath them. Their transforms come from the
   SKITOW / SKILODGE constants the map already keeps, so the entries reference those rather than
   copying the numbers — one source of truth, as the tow-tower spacing and the lodge dims already
   are. The gear rack is ONE entry placed THREE times, off the map's own RACKS table, which is the
   same repeated-prop shape as the four kea-crossing diamonds.
   THE DECK IS NOT HERE, deliberately. It is decking, rails, two tables and a run of steps drawn in
   world coordinates with three railTop colliders interleaved through them, and it is furniture
   rather than a building — a GLB batch would deliver the lodge long before it delivered the deck.
   Registering it is a piece of its own and it is written down here rather than half-done. */
defineProp('tow_shed',{
  biome:'skifield', at:{x:SKITOW.x,z:SKITOW.base},
  collider:[{kind:'box',w:3.4,d:2.6,top:2.2,solid:true}],
  anchors:{roof:{x:0,y:2.3,z:0}, window:{x:0,y:0.75,z:1.34}, wheel:{x:0,y:2.5,z:-2.0}},
  material:{family:'corrugate',nightTint:false},
  build(shed,p){
    box(3.4,2.2,2.6,0x4E6E8E,0,1.1,0,shed);
    const sr=box(3.8,0.16,3.0,PAL.hutRoof,0,2.3,0,shed); sr.rotation.z=0.07;
    box(1.0,1.1,0.08,PAL.woodD,0,0.75,1.34,shed);                     // the ticket window, shuttered
    p.collide();
  },
});
defineProp('ski_lodge',{
  biome:'skifield', at:{x:SKILODGE.x,z:SKILODGE.z},
  collider:[{kind:'roof',w:(SKILODGE.w+0.6)/2,d:SKILODGE.d*0.55,ridge:SKILODGE.h+1.32,slope:0.48},
            {kind:'box',w:SKILODGE.w,d:SKILODGE.d,top:SKILODGE.h+0.4,solid:true}],
  anchors:{roof:{x:0,y:SKILODGE.h+1.32,z:0},
           door:{x:-SKILODGE.w/2+1.2,y:1.4,z:SKILODGE.d/2+0.03},
           chimney:{x:2.0,y:SKILODGE.h+2.3,z:-0.4}},
  material:{family:'weatherboard',nightTint:false},
  build(g,p){
    const L=SKILODGE;
    box(L.w+0.3,0.5,L.d+0.3,PAL.paper,0,0.25,0,g);                     // piles, cream, forty winters old
    box(L.w,L.h,L.d,PAL.ranger,0,L.h/2+0.4,0,g);
    for(const s of [-1,1]){ const rf=box(L.w+0.6,0.16,L.d*0.62,PAL.hutRoof,0,L.h+1.0,s*L.d*0.26,g); rf.rotation.x=s*0.44; }
    p.collide();
    for(const wx of [-3.4,0,3.4]){ const pane=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.1),bmat(PAL.glass));
      pane.position.set(wx,2.2,L.d/2+0.02); g.add(pane);
      box(2.4,0.1,0.08,PAL.paper,wx,1.58,L.d/2+0.03,g,{noshadow:true}); }
    box(1.0,2.0,0.1,PAL.woodD,-L.w/2+1.2,1.4,L.d/2+0.03,g);            // the door, out onto the deck
    /* REPLAT P3: THE LODGE CHIMNEY IS BRICK, and it was wearing the gravel grey. 0x9B9891 is
       PAL.gravel, so once that colour became the scanned gravel family this chimney would have
       been rendered in driveway gravel — the same colour-as-a-key hazard MATFAM's note describes,
       found by the material census rather than by eye. It takes the hut chimney's own grey, which
       is the brick family: two chimneys, one material, and the brick family stops resting on a
       single 0.7 m surface. */
    cyl(0.22,0.26,1.2,0x8C8F93,2.0,L.h+1.5,-0.4,g,8); cyl(0.16,0.16,0.5,PAL.dark,2.0,L.h+2.3,-0.4,g,7);
  },
});
defineProp('gear_rack',{
  biome:'skifield', at:{x:0,z:0},
  collider:[],                        // the rail collider is railTop's, emitted by the map with its yaw
  anchors:{rail:{x:0,y:0.995,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    box(2.4,0.09,0.14,PAL.woodD,0,0.95,0,g);
    cyl(0.06,0.07,0.95,PAL.woodD,-1.1,0.47,0,g,6); cyl(0.06,0.07,0.95,PAL.woodD,1.1,0.47,0,g,6);
    box(2.4,0.07,0.1,PAL.woodD,0,0.3,0.12,g);
  },
});
const SKINEST={x:-40,z:32};
function buildSkifield(){
  G.nestPos={x:SKINEST.x,z:SKINEST.z};
  // terrain: hard alpine snow, scoured grey where the wind gets at it, tussock where the snow ends
  /* REPLAT P4d: THE SAME NAMED BLOCK AS THE CARPARK'S, and that is not tidiness. GRASS.ground is a
     measurement seam, and a seam that reaches one of the two terrain planes is a knob that lies
     about its scope: a later session sweeping ground.segs on the ski field would photograph four
     identical frames and conclude the ground was innocent, which is precisely the failure this
     piece exists to undo. */
  const GRD=GRASS.ground;
  const gg=new THREE.PlaneGeometry(240,240,GRD.segs,GRD.segs);
  const pos=gg.attributes.position;
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i),y=pos.getY(i); const d=Math.sqrt(x*x+y*y);
    let h=0; if(d>58) h=(d-58)*0.075*(1+0.35*Math.sin(x*0.07)*Math.cos(y*0.06));
    h+=Math.sin(x*0.13)*Math.cos(y*0.11)*0.14; pos.setZ(i,h); }
  gg.computeVertexNormals();
  /* THE PLANE IS BUILT IN XY AND LAID DOWN BY THE MINUS-90 ROTATION, so local y is world MINUS z -
     which matters because the snowline is a fact about the bottom of the map and getting the sign
     wrong puts bush above the peaks. The battery reads the vertex colours back at known world
     coordinates rather than trusting this comment. */
  { const cols=[], pp=gg.attributes.position;
    const cS=new THREE.Color(PAL.snow).convertSRGBToLinear(), cW=new THREE.Color(PAL.snowShade).convertSRGBToLinear(),
          cR=new THREE.Color(PAL.rock).convertSRGBToLinear(), cT=new THREE.Color(PAL.tussock).convertSRGBToLinear();
    const MS=GRD.maskScale;
    for(let i=0;i<pp.count;i++){ const x=pp.getX(i), zw=-pp.getY(i), mx=x*MS, mz=zw*MS;
      const n=Math.sin(mx*0.09+0.6)*Math.cos(mz*0.08)+Math.sin(mx*0.27)*0.4;
      const c=cS.clone().lerp(cW,clamp(n*0.28+0.2,0,0.55));            // wind scour
      const t=clamp((zw-34)/16,0,1); if(t>0)c.lerp(cT,t*0.85);         // the snowline, at the bottom of the map
      const d=Math.hypot(x,zw); if(d>52)c.lerp(cR,Math.min(0.8,(d-52)/30));
      cols.push(c.r,c.g,c.b); }
    gg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
  uvMetres(gg);                                     // REPLAT P3: metre UVs before it is laid down
  const ground=new THREE.Mesh(gg,matGround('snow',0.82));
  ground.rotation.x=-Math.PI/2; if(!HEADLESS)ground.receiveShadow=true; G.scene.add(ground);
  G.skiGround=ground;
  /* REPLAT P4: THE SKI FIELD GETS GRASS FOR THE FIRST TIME. Its terrain has always lerped to
     tussock below z=34 and there has never been a blade standing in it, so the bottom of the map
     was a painted gold gradient. grassReject('skifield') keeps it inside that same band and off
     the groomed run, the rope tow line and the lodge. "Tussock-shaped blades for the alpine
     biome" is the profile in GRASS.biomes.skifield: longer, narrower, closer to upright, in
     tighter mounds with nearly half the cells left bare. */
  buildGrass('skifield');

  // THE GROOMED BAND: corduroy down the fall line, which is where the tray-slide goes in TODO 40
  { const P=SKIPISTE, w=P.x1-P.x0, len=P.z1-P.z0, cx=(P.x0+P.x1)/2, cz=(P.z0+P.z1)/2;
    const slab=box(w,0.1,len,PAL.snow,cx,0.05,cz,null,{noshadow:true}); slab.receiveShadow=!HEADLESS;
    for(let z=P.z0+0.9;z<P.z1;z+=1.8) box(w-0.5,0.06,0.34,PAL.snowShade,cx,0.11,z,null,{noshadow:true});
    // wanded both edges, because a club field marks its groomer runs and its rocks with the same bamboo
    for(let z=P.z0+2;z<P.z1;z+=6)for(const wx of [P.x0-0.7,P.x1+0.7]){
      cyl(0.02,0.025,1.4,PAL.woodD,wx,0.7,z,null,5);
      box(0.16,0.12,0.02,PAL.cone,wx+0.09,1.3,z,null,{noshadow:true}); } }

  // THE ROPE TOW: engine shed and bull wheel at the bottom, six towers, a return at the top
  { const T=SKITOW;
    const SH=placeProp('tow_shed'); const shed=SH.group;
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.0,0.18,16),mat(PAL.red));
    wheel.rotation.x=Math.PI/2; wheel.position.set(T.x,2.5,T.base-2.0); G.scene.add(wheel); G.towWheel=wheel;
    cyl(0.1,0.12,2.5,PAL.metal,T.x,1.25,T.base-2.0,null,8);
    const stops=[T.base-2.0].concat(T.towers,[T.top]);
    for(const z of T.towers){
      cyl(0.11,0.14,T.rope+0.3,PAL.metal,T.x,(T.rope+0.3)/2,z,null,8);
      box(1.1,0.1,0.1,PAL.metal,T.x,T.rope+0.25,z);
      for(const ox of [-0.42,0.42]){ const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.07,10),mat(PAL.dark));
        sh.rotation.x=Math.PI/2; sh.position.set(T.x+ox,T.rope+0.12,z); G.scene.add(sh); }
      box(0.6,0.05,0.6,PAL.snowShade,T.x,0.055,z,null,{noshadow:true}); }   // the pad the queue stamps flat
    { const z=T.top;                                                   // the top: A-frame, return wheel, old anchor
      cyl(0.12,0.15,3.6,PAL.metal,T.x-0.7,1.8,z,null,8).rotation.z=0.18;
      cyl(0.12,0.15,3.6,PAL.metal,T.x+0.7,1.8,z,null,8).rotation.z=-0.18;
      const rw=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,0.16,14),mat(PAL.metal));
      rw.rotation.x=Math.PI/2; rw.position.set(T.x,T.rope,z); G.scene.add(rw);
      /* REPLAT P3b: THE OLD ANCHOR IS POURED CONCRETE, NOT GRAVEL. It carried PAL.gravel, so P3
         rendered a 1.8 m footing in driveway gravel; Eric called it a mis-assignment. Its own grey
         now, registered to the concrete family. The colour changes by a couple of levels and the
         MATERIAL changes completely, which is the whole point. */
      box(1.8,0.5,1.4,0xA9A7A2,T.x,0.25,z+1.2); addBoxCollider(T.x,z+1.2,1.8,1.4,0.5,true); }
    for(let i=0;i<stops.length-1;i++){ const a=stops[i], b=stops[i+1], mid=(a+b)/2, L=Math.abs(b-a);
      for(const [y,rr,ox] of [[T.rope,0.035,0],[T.ret,0.03,0.5]]){
        const rope=cyl(rr,rr,L,PAL.dark,T.x+ox,y,mid,null,6); rope.rotation.x=Math.PI/2; }
      if(i%2===0){ box(0.1,0.34,0.06,PAL.metal,T.x,T.rope-0.2,mid,null,{noshadow:true});
        box(0.24,0.06,0.06,PAL.rubber,T.x,T.rope-0.36,mid,null,{noshadow:true}); } }   // a nutcracker, hung and forgotten
  }

  // THE DAY LODGE, and the deck it eats its lunch on
  { const L=SKILODGE, x=L.x, z=L.z;
    const LD=placeProp('ski_lodge'), g=LD.group;
    /* REPLAT P3: THE LODGE CHIMNEY IS BRICK, and it was wearing the gravel grey. 0x9B9891 is
       PAL.gravel, so once that colour became the scanned gravel family this chimney would have
       been rendered in driveway gravel — the same colour-as-a-key hazard MATFAM's note describes,
       found by the material census rather than by eye. It takes the hut chimney's own grey, which
       is the brick family: two chimneys, one material, and the brick family stops resting on a
       single 0.7 m surface. */
    const dz=z+L.d/2+L.deck/2;
    box(L.w,0.18,L.deck,PAL.wood,x,0.62,dz);
    for(const px of [-L.w/2+0.4,0,L.w/2-0.4])for(const pz of [-L.deck/2+0.3,L.deck/2-0.3])
      cyl(0.09,0.09,0.62,PAL.woodD,x+px,0.31,dz+pz,null,6);
    addBoxCollider(x,dz,L.w,L.deck,0.71,false);                        // walk onto it, do not walk through it
    for(let i=0;i<9;i++) cyl(0.05,0.05,0.9,PAL.woodD,x-L.w/2+0.4+i*((L.w-0.8)/8),1.16,dz+L.deck/2,null,6);
    box(L.w,0.08,0.08,PAL.wood,x,1.6,dz+L.deck/2,null,{noshadow:true});
    for(const s of [-1,1]) box(0.08,0.08,L.deck,PAL.wood,x+s*(L.w/2-0.04),1.6,dz,null,{noshadow:true});
    for(const tx of [-2.6,2.6]){ rbox(2.2,0.09,0.8,0.03,PAL.wood,x+tx,1.44,dz-0.4,null);
      railTop(x+tx,dz-0.4,2.2,0.8,1.485);                  // a table a kea can actually stand on

      for(const lx of [-0.9,0.9])for(const lz of [-0.3,0.3]) cyl(0.05,0.05,0.7,PAL.woodD,x+tx+lx,1.05,dz-0.4+lz,null,6);
      rbox(2.0,0.07,0.3,0.02,PAL.wood,x+tx,1.16,dz+0.55,null); }       // the bench everybody straddles
    for(let i=0;i<3;i++) box(1.6,0.08,0.34,PAL.wood,x-L.w/2+1.2,0.5-i*0.17,dz+L.deck/2+0.25+i*0.34,null); }

  /* RACKS OF OTHER PEOPLE GEAR, which is the only reason a kea comes to a ski field. NO MISSION IDS
     ON ANY OF IT: the missions are TODO 40, and a prop up here that answered a CARPARK mission would
     be the same class of lie TODO 55 was sent to fix. The ski boot is called a SKI BOOT for the same
     reason - a prop NAME is a detector in this engine, and anything called boot scores the carpark
     bonus the moment it is carried twenty-two metres from where it was built. */
  { const RACKS=[[-16,18.5,0.2],[-28,18.5,-0.15],[SKITOW.x+3.4,SKITOW.base+1.8,0.6]];
    for(const [rx,rz,ry] of RACKS){
      placeProp('gear_rack',{at:{x:rx,z:rz,ry}});
      railTop(rx,rz,2.4,0.4,0.995,ry); }                   // TODO 63, and rotated with its own rack
    /* THE GEAR IS PLACED IN THE RACK OWN FRAME (TODO 63). It was world coordinates guessed off the
       rack position, which put every ski 0.6 metres in FRONT of a rotated rail - so the new rail
       collider held nothing at all and the whole lot was in the snow inside three seconds, exactly
       as before. Same arithmetic the rack is drawn with, so a rail that moves takes its skis. */
    const onRack=(i,px,pz)=>{ const [rx,rz,ry]=RACKS[i], cs=Math.cos(ry), sn=Math.sin(ry);
      return {x:rx+px*cs+pz*sn, z:rz-px*sn+pz*cs, ry}; };
    const RACKY=1.075;
    for(const [i,px] of [[0,-0.9],[0,-0.35],[0,0.4],[1,-0.5],[1,0.55]]){ const q=onRack(i,px,0.06);
      propAt('ski',q.x,RACKY,q.z,PB.ski,{heavy:true}).mesh.rotation.set(1.35,q.ry,0); }
    /* TODO 40: the gear carries THIS MAP missions. It carried none at all the night the diorama
       shipped, because a prop up here answering a CARPARK mission is the lie 55 was sent to fix -
       and the battery still holds every id on every prop to the list this map declares. */
    for(const [i,px] of [[0,0.95],[1,-1.05],[2,-0.4]]){ const q=onRack(i,px,0.09);
      propAt('ski pole',q.x,RACKY,q.z,PB.skipole,{missionProg:'k_poles'}).mesh.rotation.set(1.35,q.ry,0); }
    propAt('ski goggles',-17.4,0.2,20.2,PB.goggles,{wearable:true,mission:'k_goggles'});
    propAt('ski goggles',SKITOW.x+2.6,0.2,SKITOW.base+2.6,PB.goggles,{wearable:true,mission:'k_goggles'});
    propAt('ski boot',-13.2,0.2,17.7,PB.boot,{missionFar:'k_boot',farR:12});
    propAt('rubbish',SKITOW.x+1.4,0.2,SKITOW.base+3.2,PB.rubbish,{}); }

  /* DRIFTS BANKED AGAINST THE STRUCTURES, and the unbury verdict is the law they obey. TODO 28 said
     a snow disc must never be the saucer a building stands in; up here every drift is DELIBERATELY
     aimed at a wall, so the same resolver does the work it was written for - the hard disc slides
     clear of the footprint and stays there, the soft halo is free to lap the wall, and the banked
     wedge leans back the way the drift came, which is the part that touches.
     THE RECORDS ARE BUILT HEADLESS TOO, unlike the carpark patches, which live inside a !HEADLESS
     branch and can therefore only be trusted by looking at them. Every drift up here is inspectable,
     so a battery holds all of them to the verdict rather than the drawing. */
  { const L=SKILODGE, T=SKITOW, want=[];
    for(const dx of [-3.2,1.0,4.2]) want.push([L.x+dx,L.z-L.d/2-1.3,'lodge']);   // the uphill wall, where it always drifts
    for(const dx of [-3.0,2.4]) want.push([L.x+dx,L.z+L.d/2+L.deck+1.3,'deck']); // below the deck, clear of the steps
    want.push([L.x-L.w/2-1.2,L.z,'lodge'],[L.x+L.w/2+1.2,L.z,'lodge']);      // and both gable ends
    want.push([T.x-2.4,T.base,'shed'],[T.x+2.4,T.base-0.6,'shed'],[T.x,T.top+2.4,'anchor']);
    for(const z of T.towers) want.push([T.x-1.4,z,'tower']);
    /* EVERY DRIFT SAYS WHAT IT WAS AIMED AT, the way G.wear and G.stones say what surface they were
       painted on. Without it the only way to tell a tower drift from a gable one is to re-derive the
       builder arithmetic in whatever is asking, and two of those coordinates already collide. */
    for(const [wx,wz,at] of want){ const r=1.3+rnd(0,1.3);
      const q=snowSpot(wx,wz,r,SKISNOW);
      G.snow.push({x:q.x,z:q.z,r,y:0.05,want:{x:wx,z:wz},at,slid:q.slid,stuck:!!q.stuck,bank:true}); }
    if(!HEADLESS)for(const s of G.snow){
      const disc=new THREE.Mesh(new THREE.CircleGeometry(s.r,20),mat(PAL.snow));
      disc.rotation.x=-Math.PI/2; disc.position.set(s.x,0.05,s.z); disc.receiveShadow=true; G.scene.add(disc);
      const halo=new THREE.Mesh(new THREE.CircleGeometry(s.r*1.35,20),
        new THREE.MeshStandardMaterial({color:0xFFFFFF,transparent:true,opacity:0.42,roughness:0.96}));
      halo.rotation.x=-Math.PI/2; halo.position.set(s.x,0.042,s.z); G.scene.add(halo);
      s.disc=disc; s.halo=halo;
      /* THE WEDGE ONLY EXISTS WHERE THE DRIFT IS STILL AT THE WALL. One ladder step out is snow
         piled against a building; four steps out is a drift that had to go somewhere else entirely,
         and leaning a bank at a wall six metres away would be drawing a lie. */
      if(s.slid>0.01&&s.slid<=3.3){ const ux=s.want.x-s.x, uz=s.want.z-s.z, ul=Math.hypot(ux,uz)||1;
        const wedge=sph(s.r*0.8,PAL.snow,s.x+ux/ul*s.r*0.6,0.02,s.z+uz/ul*s.r*0.6,null,10);
        wedge.scale.set(1.15,0.42,1.15); s.wedge=wedge; } } }

  buildNest(G.nestPos.x,G.nestPos.z);
  /* THE TEACHING BELONGS TO THIS MAP (TODO 58, applied by TODO 40). Four hints, one per job that is
     about a PLACE rather than a thing you can see lying there - and every one of them is silent
     until its own mission is both declared and unlocked, which is the piece 55 gate doing the work.
     The summit hint therefore says nothing at all until the list is finished. */
  addHint('k_wheel',SKITOW.x,2.5,SKITOW.base-2.0,5,'that wheel has been turning since dawn - something could ride it');
  addHint('k_ski',(SKIPISTE.x0+SKIPISTE.x1)/2,0.8,20,7,'skis belong out on the snow, surely, and not on a rack');
  addHint('k_stash',SKINEST.x,1.2,SKINEST.z,5,'a nest is somewhere to keep things that were never yours');
  addHint('k_summit',SKITOW.x,3.0,SKITOW.top+1.2,8,'the top station: the whole field is below it');

  /* THE COUNTRY. This is the carpark own mountain construction with ski field radii and a snowline
     dropped to where a club field actually sits - deliberately NOT a new silhouette language, which
     is on the blocked art list and belongs to a wave with eyes on it. */
  for(let i=0;i<16;i++){ const far=i%2===0, a=i/16*Math.PI*2+rnd(-0.1,0.1), r=far?rnd(120,150):rnd(88,112);
    const h=far?rnd(38,64):rnd(26,48), w=far?rnd(42,66):rnd(26,48);
    const geo=new THREE.ConeGeometry(w,h,22,7);
    { const pos=geo.attributes.position, ph=rnd(0,6.3), ph2=rnd(0,6.3);
      for(let v=0;v<pos.count;v++){
        const x=pos.getX(v), y=pos.getY(v), z=pos.getZ(v);
        const rr=Math.hypot(x,z); if(rr<0.001)continue;
        const ang=Math.atan2(z,x), t01=y/h+0.5;
        const nz=0.55*Math.sin(ang*3+ph)+0.3*Math.sin(ang*7+ph2)+0.15*Math.sin(ang*13+ph*2);
        const kR=1+nz*0.28*(1-t01*0.55);
        pos.setX(v,x*kR); pos.setZ(v,z*kR);
        pos.setY(v,y+h*0.05*Math.sin(ang*5+ph2)*t01); }
      geo.computeVertexNormals(); }
    { const cols=[],pos=geo.attributes.position, cS=new THREE.Color(PAL.mtnSnow).convertSRGBToLinear(),
        cR=new THREE.Color(far?PAL.mtnFar:PAL.mtn).convertSRGBToLinear();
      if(far){ const hz=new THREE.Color(0x9FB8CC).convertSRGBToLinear(); cR.lerp(hz,0.2); cS.lerp(hz,0.14); }
      for(let v=0;v<pos.count;v++){ const t=clamp((pos.getY(v)/h+0.5-0.42)*7,0,1);
        const c=cR.clone().lerp(cS,t); cols.push(c.r,c.g,c.b); }
      geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
    const m=new THREE.Mesh(geo,mat(0xFFFFFF,{vertexColors:true}));
    m.position.set(Math.cos(a)*r,h*0.34,Math.sin(a)*r); m.rotation.y=rnd(0,3); G.scene.add(m); }
  // rock through the snow, everywhere the groomer does not sweep
  for(let i=0;i<14;i++){ const a=rnd(0,6.3), r=rnd(26,50), rx=Math.cos(a)*r, rz=Math.sin(a)*r;
    if(rx>SKIPISTE.x0-2&&rx<SKIPISTE.x1+2&&rz>SKIPISTE.z0&&rz<SKIPISTE.z1)continue;
    const rk=sph(rnd(0.6,1.8),i%2?PAL.rock:PAL.rockD,rx,0.15,rz,null,6); rk.scale.y=0.55; }
  // beech below the snowline only, which is the bottom arc of the map and nowhere near the peaks
  for(let i=0;i<9;i++){ const a=0.42+i/9*2.3, r=rnd(74,92);
    const b=new THREE.Mesh(new THREE.ConeGeometry(rnd(12,20),rnd(5,8),6),nightTint(mat(PAL.beech)));
    b.position.set(Math.cos(a)*r,1.2,Math.sin(a)*r); b.scale.y=0.7; b.rotation.y=rnd(0,3); G.scene.add(b); }
  /* THE LAST DRAWS IN THE BUILDER ARE THE BROWSER-ONLY ONES, on purpose: a !HEADLESS block consumes
     seeded draws that node never makes, so anything after it lands somewhere else in the two worlds.
     Everything a battery reads back - the drifts above especially - is drawn before this line. */
  /* AND THE SKI FIELD'S 26 TUFT CYLINDERS WITH THEM — REPLAT P4b, same reason. These were the
     "tufts of hair" in the snow: 0.85 m cones standing in the tussock band. buildGrass('skifield')
     grows real blades there now. Also inside `if(!HEADLESS)`, so the seeded stream is untouched. */
}
/* THE CAST BELONGS TO THE MAP TOO, and this is the TODO 58 finding one layer up. startGame pushed
   four humans by hand with CARPARK coordinates baked into them - Trish on a carpark patrol, Tom
   asleep at the campsite, Rex walking the bays, and Dave up a ladder that only buildHut ever builds.
   So G.ladder.x was read with no guard at all: a fresh load into a map with no hut threw before the
   run began, in every mode, and it only ever looked safe in the batteries because an earlier carpark
   boot had left G.ladder lying about. An owner, not a guard - the cast is declared beside the
   builder, and a map with nobody on it says so by declaring nobody. */
function castSkifield(){
  /* NOBODY YET, AND THAT IS THE HONEST STATE OF THIS MAP. The club field crowd - the ones whose
     lunch, goggles and tow tickets are the whole point - arrive with the missions in TODO 40.
     DECLARED AND EMPTY rather than left out, so the registry says nobody is home on purpose. */
}
/* THE ANCHOR STANDS DOWNHILL AND LOOKS UP THE TOW LINE, which is the establishing shot of this map
   the way the road is the carpark one. Held to the world it names by the same assertion the carpark
   anchor is: the look-at sits on the built prop centroid, above the ground at its own feet, pointing
   down the way in rather than up out of it. */
defineBiome('skifield',{label:'THE CLUB SKI FIELD',build:buildSkifield,cast:castSkifield,missions:missionsSkifield,
  anchor:{x:-2,y:28,z:52, lx:-4,ly:1.5,lz:14}, snow:SKISNOW});

/* ---------- THE DOC CAMPGROUND (CAMPGROUND.md, the third map) ----------
   The brochure has declared this map since TODO 37 and rendered it 'soon' for exactly one reason:
   BIOMES['campground'] did not exist. The pin, the star accounting, the travel beat, the save slot
   and the unlock arithmetic were all built and all waiting on this call.
   ADDITIVE, AND THAT IS TODO 47 RATHER THAN TASTE. The carpark keeps its tent, its clothes line,
   its chilly bin and its picnic set: propAt keeps a deliberate rnd draw per prop so the country
   does not move, so deleting one carpark prop reshuffles grass, snow, tussock and beech across all
   28 baselines. Two maps have a tent. That is what campgrounds and carparks are like.

   ---- WHY THE ROAD IS A STRAIGHT TRACK AND NOT THE LOOP THE BRIEF IMAGINED ----
   grassCuts() gives a biome FOUR boxes and says so: "a fifth is a new uniform rather than a silent
   truncation". An oval loop cannot be cut with boxes at all — it would want its two long sides and
   both ends, which is the whole budget before a single building is clear of grass. So the map is
   built the way the smaller DOC sites actually are: one gravel access track with the sites hung off
   it. The four cuts are the track, the shelter pad, the ablutions pad and the campervan hardstand,
   which is exactly the budget and leaves the sites themselves standing in grass, where they belong. */
const CAMPNEST={x:-34,z:-26};
const CAMPTRACK={x:0, z0:-18, z1:26, w:5.0};        // the gravel access track, entrance at +z
const CAMPSHELTER={x:-11,z:-6,w:8.4,d:5.0,h:2.45};  // open-sided cook shelter, the climbable one
const CAMPABLUTION={x:11,z:-8,w:4.2,d:3.0,h:2.35};  // the block, with a roof to stand on
const CAMPVAN={x:9,z:8};                            // the occupied hardstand site
const CAMPTENTSITE={x:-10,z:9};                     // the occupied grass site
const CAMPBOARD={x:3.6,z:21};                       // information board + honesty box, at the gate
const CAMPTAP={x:-3.4,z:2};                         // the standpipe everybody walks to
const CAMPBIN={x:4.2,z:14};                         // the rat-proof bin corral
/* SIX NUMBERED SITES, TWO OCCUPIED. A bare site is not filler: it is where the bird lands when it
   is chased off an occupied one, and it is what makes the occupied two read as somebody's. */
const CAMPSITES=[
  {n:1,x:-10,z:9,  occupied:'tent'},
  {n:2,x:9,  z:8,  occupied:'van'},
  {n:3,x:-11,z:-1, occupied:null},
  {n:4,x:10, z:0,  occupied:null},
  {n:5,x:-9, z:17, occupied:null},
  {n:6,x:9,  z:17, occupied:null},
];
/* NO SNOW ENVELOPE AND NO ROAD LANES, BOTH DECLARED RATHER THAN OMITTED — piece 39 found four
   globals that were really carpark declarations, and the one it did NOT find put seven hatchbacks
   across the ski field. A river flat in summer has no drifts and a campground track takes no
   through traffic. The battery holds both to zero. */
const CAMPSNOW=null;

defineProp('camp_shelter',{
  biome:'campground', at:{x:CAMPSHELTER.x,z:CAMPSHELTER.z},
  collider:[{kind:'box',w:CAMPSHELTER.w,d:CAMPSHELTER.d,top:CAMPSHELTER.h+0.25,solid:true}],
  anchors:{ridge:{x:0,y:CAMPSHELTER.h+0.42,z:0}, tableA:{x:-2.1,y:0.78,z:0}, tableB:{x:2.1,y:0.78,z:0}},
  material:{family:'corrugate',nightTint:false},
  build(g,p){
    const S=CAMPSHELTER;
    for(const sx of [-1,1])for(const sz of [-1,1])
      cyl(0.09,0.10,S.h,PAL.woodD,sx*(S.w/2-0.35),S.h/2,sz*(S.d/2-0.3),g,7);
    box(S.w,0.10,S.d,PAL.hutRoof,0,S.h+0.05,0,g);                    // the roof
    for(let i=0;i<5;i++) box(S.w-0.4,0.05,0.07,0x4A545C,0,S.h+0.12,-S.d/2+0.5+i*((S.d-1.0)/4),g,{noshadow:true});
    box(S.w+0.5,0.14,0.16,PAL.hutRoof,0,S.h+0.16,0,g,{noshadow:true}); // ridge batten
    box(S.w+0.6,0.16,S.d+0.5,0x9AA0A6,0,0.05,0,g,{noshadow:true});     // the concrete pad
    for(const tx of [-2.1,2.1]){                                       // two trestle tables
      rbox(2.2,0.09,0.8,0.03,PAL.wood,tx,0.74,0,g);
      for(const lx of [-0.85,0.85])for(const lz of [-0.28,0.28])
        cyl(0.05,0.05,0.70,PAL.woodD,tx+lx,0.37,lz,g,6);
      rbox(2.0,0.07,0.28,0.02,PAL.wood,tx,0.44,0.62,g);                // the bench everybody straddles
    }
    p.collide();
  },
});
defineProp('camp_ablution',{
  biome:'campground', at:{x:CAMPABLUTION.x,z:CAMPABLUTION.z},
  collider:[{kind:'box',w:CAMPABLUTION.w,d:CAMPABLUTION.d,top:CAMPABLUTION.h+0.2,solid:true}],
  anchors:{roof:{x:0,y:CAMPABLUTION.h+0.2,z:0}, door:{x:0,y:1.0,z:CAMPABLUTION.d/2+0.06}},
  material:{family:'weatherboard',nightTint:false},
  build(g,p){
    const A=CAMPABLUTION;
    box(A.w+0.3,0.22,A.d+0.3,0x9AA0A6,0,0.11,0,g,{noshadow:true});    // the pad
    /* DOC GREEN, NOT THE CARPARK HUT'S RED. PAL.hut is the alpine hut's weatherboard and it
       photographed as a bright red shed on a green flat — the one building on this map that a
       visitor is meant not to notice. Department buildings are dark green or brown; this is the
       green the DOC board already uses, a shade down so the board still reads against it. */
    box(A.w,A.h,A.d,0x2F5140,0,A.h/2+0.2,0,g);
    const rf=box(A.w+0.5,0.12,A.d+0.5,PAL.hutRoof,0,A.h+0.26,0,g); rf.rotation.x=0.05;
    box(0.9,1.9,0.08,PAL.woodD,0,1.15,A.d/2+0.04,g);                  // the door
    box(0.5,0.16,0.05,0x4A545C,0,A.h-0.1,A.d/2+0.04,g,{noshadow:true});// the vent
    p.collide();
  },
});
defineProp('camp_board',{
  biome:'campground', at:{x:CAMPBOARD.x,z:CAMPBOARD.z},
  collider:[{kind:'box',w:2.1,d:0.3,top:2.3,solid:true}],
  anchors:{panel:{x:0,y:1.75,z:0.08}, box:{x:1.35,y:1.05,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    cyl(0.08,0.10,2.2,PAL.woodD,-0.85,1.10,0,g,7); cyl(0.08,0.10,2.2,PAL.woodD,0.85,1.10,0,g,7);
    box(2.0,1.0,0.08,0x2A5A3E,0,1.75,0,g);                             // the DOC board
    /* THE HONESTY BOX IS THE MAP'S SIGNATURE TARGET and it is its own post beside the board, not a
       decal on it — a kea works a lid, and a lid needs a body to be hinged to. */
    cyl(0.07,0.08,1.0,PAL.woodD,1.35,0.50,0,g,7);
    rbox(0.34,0.30,0.26,0.04,0x6E4A2A,1.35,1.05,0,g);
    rbox(0.36,0.05,0.28,0.02,PAL.metal,1.35,1.22,0,g,{noshadow:true}); // the lid
    p.collide();
  },
});
defineProp('camp_tap',{
  biome:'campground', at:{x:CAMPTAP.x,z:CAMPTAP.z},
  collider:[],
  anchors:{spout:{x:0,y:0.86,z:0.12}, puddle:{x:0,y:0.02,z:0.55}},
  material:{family:'concrete',nightTint:false},
  build(g,p){
    const pad=cyl(0.85,0.85,0.08,0xA9A7A2,0,0.04,0,g,18);
    cyl(0.05,0.055,0.95,PAL.metal,0,0.47,0,g,8);
    cyl(0.03,0.03,0.22,PAL.metal,0,0.86,0.10,g,6).rotation.x=1.57;     // the spout
    rbox(0.16,0.04,0.05,0.015,0x8E3A2E,0,0.90,-0.03,g,{noshadow:true});// the handle
    if(!HEADLESS){ const pd=new THREE.Mesh(new THREE.CircleGeometry(0.62,18),bmat(0xC6DCE8));
      pd.rotation.x=-Math.PI/2; pd.position.set(0,0.085,0.55); g.add(pd); }
  },
});
defineProp('camp_bin_corral',{
  biome:'campground', at:{x:CAMPBIN.x,z:CAMPBIN.z},
  collider:[{kind:'box',w:1.7,d:1.2,top:1.25,solid:true}],
  anchors:{lid:{x:0,y:1.28,z:0}, latch:{x:0,y:0.95,z:0.62}},
  material:{family:null,nightTint:false},
  build(g,p){
    box(1.8,0.12,1.3,0x8E8B84,0,0.06,0,g,{noshadow:true});             // the pad
    for(const sx of [-1,1])for(const sz of [-1,1])
      box(0.08,1.2,0.08,PAL.metal,sx*0.8,0.6,sz*0.55,g);
    /* THE RAT-PROOF CAGE: a mesh box, which is a run of bars rather than a solid, because the
       whole point of the thing is that you can see the bags inside it and not reach them. */
    for(let i=0;i<9;i++) box(0.03,1.1,0.03,PAL.metal,-0.76+i*0.19,0.62,-0.6,g,{noshadow:true});
    for(let i=0;i<9;i++) box(0.03,1.1,0.03,PAL.metal,-0.76+i*0.19,0.62,0.6,g,{noshadow:true});
    p.lid=box(1.75,0.09,1.28,0x4E6E5E,0,1.24,0,g);
    rbox(0.28,0.06,0.10,0.02,PAL.dark,0,0.95,0.62,g,{noshadow:true});  // the latch
    p.collide();
  },
});
/* THE SITE MARKER: six of them, one entry placed six times, the kea-crossing-diamond pattern. */
defineProp('camp_site_post',{
  biome:'campground', at:{x:0,z:0},
  collider:[],
  anchors:{plate:{x:0,y:0.92,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    cyl(0.06,0.07,1.0,PAL.woodD,0,0.50,0,g,6);
    rbox(0.26,0.20,0.04,0.02,0xE8E2D2,0,0.92,0.03,g,{noshadow:true});
  },
});


/* ---- THE TWO OCCUPIED SITES ----
   PLACEHOLDER PRIMITIVES, AND THEY SAY SO IN THE ONLY PLACE THAT MATTERS. Every one of these is a
   P6A registry entry with source:'primitive', its collider and anchors declared and its biome set —
   so when Eric's models arrive the model pass finds them by listing the registry rather than by
   reading this file. That is the seam doing the job it was built for; there is deliberately no
   second list of "things to model later" anywhere in the tree. */
defineProp('camp_tent',{
  biome:'campground', at:{x:CAMPTENTSITE.x,z:CAMPTENTSITE.z},
  collider:[{kind:'box',w:2.2,d:2.2,top:1.15,solid:true}],
  anchors:{peak:{x:0,y:1.58,z:0}, guyA:{x:-1.34,y:0.4,z:0.50}, guyB:{x:1.34,y:0.4,z:-0.50},
           door:{x:0,y:0.5,z:1.05}},
  material:{family:null,nightTint:false},
  build(g,p){
    const t=new THREE.Mesh(new THREE.ConeGeometry(1.55,1.6,4),mat(0x4E7FA8));
    t.position.y=0.80; t.rotation.y=Math.PI/4; t.castShadow=!HEADLESS; g.add(t); p.tentBody=t;
    const fly=new THREE.Mesh(new THREE.ConeGeometry(0.6,0.95,4),mat(0x3E6E96));
    fly.position.set(0,0.48,0.74); fly.rotation.y=Math.PI/4; g.add(fly);
    sph(0.05,PAL.yellow,0,1.58,0,g,7); cyl(0.02,0.02,1.6,PAL.metal,0,0.80,0,g,5);
    for(const [px,pz] of [[-1.35,0.52],[1.35,-0.52],[-0.52,-1.35],[0.52,1.35]])
      cyl(0.02,0.03,0.14,PAL.woodD,px,0.06,pz,g,5).rotation.z=0.3;
    p.collide();
  },
});
defineProp('camp_van',{
  biome:'campground', at:{x:CAMPVAN.x,z:CAMPVAN.z,ry:-0.22},
  collider:[{kind:'box',w:2.4,d:5.2,top:2.3,solid:true}],
  anchors:{roof:{x:0,y:2.3,z:0}, door:{x:1.25,y:1.0,z:0.4}, awning:{x:2.4,y:2.05,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    /* A PLACEHOLDER VAN. Deliberately plain — no wipers, no mirrors, no door seal, because those
       are the carpark campervan's mission anchors and a prop NAME is a detector in this engine. */
    const shell=rbox(2.2,1.9,5.0,0.26,PAL.white,0,1.25,0,g); hull(shell,0.02);
    rbox(2.3,0.5,5.1,0.18,0,0,0.62,0,g,{noshadow:true,mats:mat(0x3A4046)});
    pane(1.6,0.5,0.05,0.04,0x9FB8C4,0,1.62,2.49,g);
    for(const wz of [-1.4,0.6]){ pane(0.05,0.52,0.8,0.03,0x9FB8C4,1.11,1.62,wz,g);
                                 pane(0.05,0.52,0.8,0.03,0x9FB8C4,-1.11,1.62,wz,g); }
    for(const sdx of [-1,1])for(const wz of [-1.6,1.6]){
      const wh=cyl(0.34,0.34,0.16,0x23262B,sdx*1.12,0.34,wz,g,12); wh.rotation.z=1.57; }
    /* the awning: the roll-out roof every one of these has, and the thing the chair sits under */
    box(0.10,0.10,4.0,PAL.metal,2.35,2.00,0,g,{noshadow:true});
    for(const az of [-1.8,1.8]) cyl(0.035,0.035,2.0,PAL.metal,2.35,1.0,az,g,6);
    { const aw=box(2.5,0.05,4.0,0xC8B48A,1.22,2.02,0,g,{noshadow:true}); aw.rotation.z=-0.05; }
    blob(g,2.0,0.5);
    p.collide();
  },
});
defineProp('camp_chilly',{
  biome:'campground', at:{x:CAMPVAN.x+2.3,z:CAMPVAN.z-2.2},
  collider:[{kind:'box',w:0.9,d:0.6,top:0.72,solid:true}],
  anchors:{latch:{x:0,y:0.7,z:0}, lid:{x:0,y:0.67,z:0}},
  material:{family:null,nightTint:false},
  build(cb,p){
    rbox(0.9,0.6,0.6,0.1,0x2E7D5E,0,0.3,0,cb); rbox(0.94,0.08,0.64,0.03,0x24634A,0,0.56,0,cb,{noshadow:true});
    const lidG=new THREE.Group(); lidG.position.set(0,0.62,-0.32); cb.add(lidG);
    p.lid=rbox(0.96,0.14,0.66,0.05,0xE8E2D2,0,0.05,0.32,lidG);
    rbox(0.3,0.06,0.12,0.025,PAL.dark,0,0.14,0.5,lidG);
    p.lidG=lidG; p.collide();
  },
});
defineProp('camp_chair',{
  biome:'campground', at:{x:CAMPVAN.x+2.6,z:CAMPVAN.z+0.9},
  collider:[],
  anchors:{seat:{x:0,y:0.46,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    for(const [lx,lz] of [[-0.28,-0.26],[0.28,-0.26],[-0.28,0.26],[0.28,0.26]])
      cyl(0.022,0.022,0.46,PAL.metal,lx,0.23,lz,g,5);
    rbox(0.62,0.05,0.56,0.02,0x8E3A2E,0,0.46,0,g);
    const bk=rbox(0.62,0.52,0.05,0.02,0x8E3A2E,0,0.72,-0.26,g); bk.rotation.x=-0.18;
  },
});
defineProp('camp_line',{
  biome:'campground', at:{x:CAMPVAN.x+1.2,z:CAMPVAN.z+3.4},
  collider:[],
  anchors:{wash0:{x:-1.0,y:1.30,z:0}, wash1:{x:0,y:1.30,z:0}, wash2:{x:1.0,y:1.30,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    cyl(0.05,0.06,1.6,PAL.woodD,-1.6,0.80,0,g,6); cyl(0.05,0.06,1.6,PAL.woodD,1.6,0.80,0,g,6);
    box(3.2,0.02,0.02,0xD8D2C4,0,1.52,0,g,{noshadow:true});
  },
});

function buildCampground(){
  /* THE MAP OWNS ITS NEST SITE (TODO 39). Out in the beech scrub behind the sites, well off the
     track, because a nest beside the toilet block is not where a kea puts one. */
  G.nestPos={x:CAMPNEST.x,z:CAMPNEST.z};
  /* ---- TERRAIN: a river flat, greener and flatter than either map so far ----
     THE SAME NAMED BLOCK AS THE OTHER TWO. GRASS.ground is a measurement seam and a seam that
     reaches two of three terrain planes is a knob that lies about its scope — the P4d note on the
     ski field says so at length and it applies a third time now. */
  const GRD=GRASS.ground;
  const gg=new THREE.PlaneGeometry(240,240,GRD.segs,GRD.segs);
  const pos=gg.attributes.position;
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i),y=pos.getY(i); const d=Math.sqrt(x*x+y*y);
    /* A FLAT, not a basin: the rise starts further out and climbs harder, because a river flat is
       a floor with hills at the edge of it rather than a bowl. */
    let h=0; if(d>66) h=(d-66)*0.085*(1+0.3*Math.sin(x*0.06)*Math.cos(y*0.05));
    h+=Math.sin(x*0.15)*Math.cos(y*0.13)*0.11; pos.setZ(i,h); }
  gg.computeVertexNormals();
  { const cols=[], pp=gg.attributes.position;
    const cG=new THREE.Color(PAL.ground3).convertSRGBToLinear(),      // the flat: the greenest of the three
          cD=new THREE.Color(PAL.ground).convertSRGBToLinear(),
          cS=new THREE.Color(PAL.gravel).convertSRGBToLinear(),       // river shingle
          cR=new THREE.Color(PAL.rock).convertSRGBToLinear();
    const MS=GRD.maskScale;
    for(let i=0;i<pp.count;i++){ const x=pp.getX(i), zw=-pp.getY(i), mx=x*MS, mz=zw*MS;
      const n=Math.sin(mx*0.10+0.9)*Math.cos(mz*0.08)+Math.sin(mx*0.29)*0.45;
      let c=n>0.4?cD.clone():cG.clone();
      /* THE RIVER IS A BAND OF SHINGLE ALONG THE FAR EDGE, not water: this is a braided river flat
         and what a campground looks out at is stones. The water itself is the RIVER map, later. */
      const shingle=clamp((zw-40)/14,0,1); if(shingle>0)c.lerp(cS,shingle*0.9);
      /* AND THE GRAVEL TRACK IS PAINTED IN, the way the carpark's braided rectangle is — the
         shader cut below stops grass growing on it, and this is what makes it read as a surface
         rather than a bald patch. */
      if(Math.abs(x-CAMPTRACK.x)<CAMPTRACK.w/2+0.4&&zw>CAMPTRACK.z0-1&&zw<CAMPTRACK.z1+1&&n>-0.6)
        c=cS.clone().lerp(cD,0.35);
      const d=Math.hypot(x,zw); if(d>62)c.lerp(cR,Math.min(0.8,(d-62)/34));
      cols.push(c.r,c.g,c.b); }
    gg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
  uvMetres(gg);
  const ground=new THREE.Mesh(gg,matGround('grass',0.93));
  ground.rotation.x=-Math.PI/2; if(!HEADLESS)ground.receiveShadow=true; G.scene.add(ground);
  G.campGround=ground;
  buildGrass('campground');
  buildTrees();

  /* ---- THE GRAVEL TRACK, as a laid surface with a crown ---- */
  { const len=CAMPTRACK.z1-CAMPTRACK.z0, cz=(CAMPTRACK.z0+CAMPTRACK.z1)/2;
    /* THE TRACK IS DARKER THAN THE GRAVEL FAMILY'S OWN GREY, and it has to be. PAL.gravel is
       calibrated for the carpark's braided rectangle under alpine light; laid as a 44 m ribbon
       across a green flat it photographed as a poured concrete road, brighter than anything else in
       the frame including the ablutions roof. A wet-metal campground track is a brown-grey. */
    const slab=box(CAMPTRACK.w,0.12,len,0x7A736A,CAMPTRACK.x,0.06,cz,null,{noshadow:true});
    slab.receiveShadow=!HEADLESS;
    /* wheel ruts either side of a grassy crown, which is what an unsealed campground track is */
    for(const rx of [-1.35,1.35]) box(1.5,0.13,len-1.2,0x6B6459,CAMPTRACK.x+rx,0.075,cz,null,{noshadow:true});
  }

  /* ---- THE SHARED STRUCTURES, every one a registry placement ---- */
  const SH=placeProp('camp_shelter');
  const AB=placeProp('camp_ablution');
  const BD=placeProp('camp_board');
  const TP=placeProp('camp_tap');
  const BC=placeProp('camp_bin_corral');
  G.campShelter=SH; G.campAblution=AB; G.campBoard=BD; G.campBin=BC;

  /* ---- SIX NUMBERED SITES ---- */
  for(const s of CAMPSITES){
    placeProp('camp_site_post',{at:{x:s.x-2.6,z:s.z+2.2}});
    /* a flattened pad and a fire ring per site: the ring is what says somebody has camped here */
    /* A TRAMPLED PAD, NOT A YELLOW DISC. The first cut used PAL.ground — the carpark's strong
       Lindis ochre, which against this map's green pasture photographed as a saturated custard
       circle in all three first pins. A camp pad is grass worn down to dirt: a desaturated brown
       barely darker than the ground it is worn into. */
    { const pad=new THREE.Mesh(new THREE.CircleGeometry(2.4,20),mat(0x6E6440));
      pad.rotation.x=-Math.PI/2; pad.position.set(s.x,0.02,s.z); pad.receiveShadow=!HEADLESS;
      G.scene.add(pad); }
    for(let i=0;i<9;i++){ const a=i/9*Math.PI*2;
      const st=sph(0.13,i%2?0x7A7468:PAL.rockD,s.x+Math.cos(a)*0.72,0.08,s.z+Math.sin(a)*0.72,null,6);
      st.scale.y=0.6; }
    { const ash=new THREE.Mesh(new THREE.CircleGeometry(0.66,14),mat(0x3A362E));
      ash.rotation.x=-Math.PI/2; ash.position.set(s.x,0.035,s.z); G.scene.add(ash); }
  }

  /* ---- SITE 1: THE TENT, and the two guy lines that hold it up ---- */
  { const T=placeProp('camp_tent'), g=T.group; G.campTent={g,down:false,lines:2,body:T.tentBody};
    [['guyA',-1.6,0.6],['guyB',1.6,-0.6]].forEach(([an,ox,oz],i)=>{
      const rope=cyl(0.02,0.02,1.4,PAL.paper,ox*0.84,0.36,oz*0.84,g,5);
      rope.rotation.z=ox>0?-1.1:1.1;
      addTear({label:'CHEW THE GUY LINE',need:1.0,mesh:rope,getPos:()=>T.anchor(an),range:1.4,owner:'marg',
        onDone(p){ G.campTent.lines--; prog('c_guyline');
          TW.add(0.3,u=>{rope.scale.x=1+Math.sin(u*Math.PI*4)*0.4*(1-u);
            rope.rotation.x=Math.sin(u*28)*0.5*(1-u);},()=>{rope.visible=false;});
          if(G.campTent.lines<=0&&!G.campTent.down){ G.campTent.down=true; AU.whoosh();
            const t=G.campTent.body;
            TW.add(0.7,u=>{ t.scale.y=lerp(1,0.2,u); t.position.y=lerp(0.80,0.18,u);
              t.rotation.z=Math.sin(u*Math.PI*3)*0.14*(1-u); t.scale.x=t.scale.z=1+Math.sin(u*Math.PI)*0.18; },
              ()=>{burst(T.anchor('peak'),0x4E7FA8,10);});
            award(35,'TENT DOWN',p); noise(p,9,'misdeed','marg'); }
          else award(10,'GUY-LINE CHEWED',p); }});
    });
    propAt('tramping boot',T.at.x+1.5,0.1,T.at.z+1.5,PB.boot,{owner:'marg'});
    propAt('tramping boot',T.at.x+1.9,0.1,T.at.z+1.2,PB.boot,{owner:'marg'});
  }

  /* ---- SITE 2: THE VAN, ITS AWNING, AND EVERYTHING UNDER IT ---- */
  { const V=placeProp('camp_van'); G.campVan=V;
    const CH=placeProp('camp_chilly'); G.campChilly=CH;
    addFoodSrc('camp chilly bin',CH.at.x,CH.at.z,1.8);
    /* THE COOP JOB. Same shape as the carpark's: the latch only advances while a second bird holds
       the lid, so one kea cannot do it and the badge is honest. */
    G.campChillyTear=addTear({label:'TUG THE LATCH',coop:'HOLD LID',need:1.6,mesh:CH.group,
      getPos:()=>CH.anchor('latch'),range:1.5,owner:'barry',needsPartner:true,
      onDone(p){ AU.pop();
        TW.add(0.5,u=>{ CH.lidG.rotation.x=-2.0*Math.min(1,u*1.3)+Math.sin(u*Math.PI*2.5)*0.15*(1-u); });
        spawnLoose('camp sausages',PB.sandwich,{x:p.x,y:0.9,z:p.z},{food:true,owner:'barry'});
        award(40,'CHILLY BIN CRACKED',p); done('c_chilly'); }});
    const CR=placeProp('camp_chair');
    addTear({label:'TIP THE CAMP CHAIR',need:1.2,mesh:CR.group,getPos:()=>CR.anchor('seat'),
      range:1.3,owner:'barry',keepMesh:true,
      onDone(p){ AU.clang();
        TW.add(0.5,u=>{ CR.group.rotation.z=1.4*Math.min(1,u*1.25)+Math.sin(u*16)*0.1*(1-u); });
        award(20,'THE CHAIR: RESOLVED',p); done('c_chair'); noise(p,6,'misdeed','barry'); }});
    const LN=placeProp('camp_line');
    for(let i=0;i<3;i++){ const an='wash'+i;
      const w=LN.anchor(an);
      const gm=rbox(0.30,0.34,0.03,0.02,[0xE8E2D2,0x8E6118,0x4E7FA8][i],0,-0.18,0,null);
      gm.position.set(w.x,w.y-0.18,w.z); G.scene.add(gm);
      addTear({label:'ROB THE WASHING LINE',need:1.1,mesh:gm,getPos:()=>LN.anchor(an),range:1.25,
        owner:'marg',air:true,keepMesh:true,
        onDone(p){ gm.visible=false; AU.rip(); burst(p,0xE8E2D2,6);
          spawnLoose('somebody sock',PB.sock,{x:p.x,y:0.9,z:p.z},{owner:'marg'});
          award(12,'WASHING: LIBERATED',p); prog('c_line'); }});
    }
  }

  buildNest(G.nestPos.x,G.nestPos.z);

  /* ---- THE SHARED-STRUCTURE JOBS ---- */
  addPeck({label:'WORK THE HONESTY BOX',needHits:3,mesh:BD.group,getPos:()=>BD.anchor('box'),
    range:1.4,owner:null,
    onDone(p){ AU.clang(); burst(p,PAL.sun,12);
      for(let i=0;i<3;i++)spawnLoose('camp fee coin',PB.keys,
        {x:p.x+rnd(-0.4,0.4),y:1.0,z:p.z+rnd(-0.4,0.4)},{shiny:true,vy:2.4});
      award(50,'THE HONESTY BOX. HONESTLY.',p); done('c_honesty'); noise(p,11,'misdeed',null); }});
  addPeck({label:'PECK THE BIN LATCH',needHits:3,mesh:BC.group,getPos:()=>BC.anchor('latch'),
    range:1.4,owner:'nan',
    onDone(p){ AU.clang(); G.campBinOpen=true;
      TW.add(0.55,u=>{ BC.lid.rotation.z=1.4*Math.min(1,u*1.4)+Math.sin(u*20)*0.1*(1-u);
        BC.lid.position.x=0.7*u; });
      spawnLoose('rubbish',PB.rubbish,{x:BC.at.x+0.6,y:1.3,z:BC.at.z+0.2},{vy:2.8});
      spawnLoose('rubbish',PB.rubbish,{x:BC.at.x-0.5,y:1.3,z:BC.at.z-0.3},{vy:2.4});
      spawnLoose('shiny can',PB.can,{x:BC.at.x+0.2,y:1.35,z:BC.at.z+0.5},{shiny:true,vy:2.6});
      award(35,'RAT-PROOF. NOT KEA-PROOF.',p); done('c_bin'); noise(p,9,'misdeed','nan'); }});

  /* ---- THE TEACHING, one hint per job that is about a PLACE rather than a visible thing ---- */
  addHint('c_honesty',CAMPBOARD.x+1.35,1.2,CAMPBOARD.z,5,'that box has other people money in it');
  addHint('c_roof',CAMPSHELTER.x,CAMPSHELTER.h+0.5,CAMPSHELTER.z,6,'the shelter roof is the best seat on this map');
  addHint('c_bin',CAMPBIN.x,1.3,CAMPBIN.z,5,'rat-proof is not kea-proof, and everybody knows it');
  addHint('c_tap',CAMPTAP.x,0.9,CAMPTAP.z,5,'somebody has to walk to this tap for every cup of tea');

  /* ---- THE COUNTRY: the carpark's own mountain construction at river-flat radii, and the beech
     scrub the nest sits in. Deliberately NOT a new silhouette language, which is on the blocked art
     list and belongs to a wave with eyes on it. */
  for(let i=0;i<18;i++){ const far=i%2===0, a=i/18*Math.PI*2+rnd(-0.1,0.1), r=far?rnd(140,172):rnd(108,134);
    const h=far?rnd(30,54):rnd(20,40), w=far?rnd(46,72):rnd(30,52);
    const geo=new THREE.ConeGeometry(w,h,22,7);
    { const pos2=geo.attributes.position, ph=rnd(0,6.3), ph2=rnd(0,6.3);
      for(let v=0;v<pos2.count;v++){
        const x=pos2.getX(v), y=pos2.getY(v), z=pos2.getZ(v);
        const rr=Math.hypot(x,z); if(rr<0.001)continue;
        const ang=Math.atan2(z,x), t01=y/h+0.5;
        const nz=0.55*Math.sin(ang*3+ph)+0.3*Math.sin(ang*7+ph2)+0.15*Math.sin(ang*13+ph*2);
        const kR=1+nz*0.28*(1-t01*0.55);
        pos2.setX(v,x*kR); pos2.setZ(v,z*kR);
        pos2.setY(v,y+h*0.05*Math.sin(ang*5+ph2)*t01);
      }
      geo.computeVertexNormals(); }
    { const cols=[],pos2=geo.attributes.position, cS=new THREE.Color(PAL.mtnSnow).convertSRGBToLinear(),
        cR=new THREE.Color(far?PAL.mtnFar:PAL.mtn).convertSRGBToLinear();
      if(far){ const hz=new THREE.Color(0x9FB8CC).convertSRGBToLinear(); cR.lerp(hz,0.2); cS.lerp(hz,0.14); }
      for(let v=0;v<pos2.count;v++){ const t=clamp((pos2.getY(v)/h+0.5-0.78)*8,0,1);
        const c=cR.clone().lerp(cS,t); cols.push(c.r,c.g,c.b); }
      geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
    const m=new THREE.Mesh(geo,mat(0xFFFFFF,{vertexColors:true}));
    m.position.set(Math.cos(a)*r,h*0.34,Math.sin(a)*r); m.rotation.y=rnd(0,3); G.scene.add(m);
  }
}

function castCampground(){
  /* A CAMPGROUND HAS CAMPERS, and unlike the ski field this map declares a real cast — the whole
     point of the place is that the soft things belong to somebody. Three, which is what the
     carpark carries, so the frame budget and the noise economy are the ones already measured.
     NO RANGER, and that is deliberate: Rex and his cage are the carpark's, the jail verb is wired
     to G.cage which this map does not build, and a second ranger would be a second cell. */
  G.humans.push(new Human('marg','Marg',0x7A3D6E,CAMPTENTSITE.x+2.4,CAMPTENTSITE.z-1.2,
    {hat:'beanie',patrol:[{x:CAMPTENTSITE.x+2.4,z:CAMPTENTSITE.z-1.2},{x:CAMPTAP.x+0.9,z:CAMPTAP.z},
                          {x:CAMPSHELTER.x+2.0,z:CAMPSHELTER.z+2.6},{x:CAMPTENTSITE.x+1.0,z:CAMPTENTSITE.z+2.0}]}));
  G.humans.push(new Human('barry','Barry',0x2F6E5E,CAMPVAN.x-2.2,CAMPVAN.z+1.4,{asleep:true,hat:'cap'}));
  G.humans.push(new Human('nan','Nan',0x8E6118,CAMPSHELTER.x+2.6,CAMPSHELTER.z+1.4,
    {hat:'beanie',patrol:[{x:CAMPSHELTER.x+2.6,z:CAMPSHELTER.z+1.4},{x:CAMPBIN.x-1.2,z:CAMPBIN.z-1.0},
                          {x:CAMPBOARD.x-1.6,z:CAMPBOARD.z-1.4},{x:CAMPSHELTER.x-2.4,z:CAMPSHELTER.z+1.0}]}));
}

/* THE ANCHOR COMES IN OVER THE ENTRANCE AND LOOKS DOWN THE TRACK, which is the establishing shot of
   this map the way the road is the carpark's and the tow line is the ski field's. Held to the world
   it names by the same assertion the other two are: the look-at sits on the built prop centroid,
   above the ground at its own feet, pointing down the way IN rather than up out of it. */
defineBiome('campground',{label:'THE DOC CAMPGROUND',build:buildCampground,cast:castCampground,
  missions:missionsCampground,
  anchor:{x:0,y:24,z:56, lx:0,ly:1.2,lz:4}, snow:CAMPSNOW});


/* ---------- SHOPFRONT GLASS — a material call, not a pane() reuse (VILLAGE.md) ----------
   Eric's instruction was to make this a proper material decision and judge it against the windows
   in ref_bow_00 and ref_bow_06. Both plates say the same thing and it is the OPPOSITE of what
   "reflective window" suggests:
     ref_bow_00  the house windows are DARK — well below the cream trim and the red brick around
                 them — and the mullions read AS A GRID AGAINST A NEAR-BLACK INTERIOR. There is a
                 sheen, but it is subtle and it does not carry the read; the value does.
     ref_bow_06  the garage mouth is a dark space WITH THINGS IN IT, and the small window in the
                 door is pale only where it catches sky. So the interior is visible, not implied.
   THREE CONSEQUENCES, AND EACH IS A DEPARTURE FROM pane():
   1. pane() IS THE WRONG TOOL AND ITS RAMP IS UPSIDE DOWN. It exists for vehicle glazing and its
      vertex ramp runs GLASSBOT near-white at the sill to GLASSTOP sky at the head — correct for a
      RAKED windscreen, which catches the road ahead in its lower half. A vertical shopfront does
      the reverse: sky at the head, dark footpath at the sill. Reusing it would have put the bright
      end on the ground.
   2. THE REFLECTION IS REAL, NOT PAINTED. P2 put a genuine HDRI environment on the scene, so a
      low-roughness clearcoated sheet reflects the actual sky and mountains rather than a
      three-stop vertex gradient. That is the whole reason this is worth a material rather than a
      colour: the reflection moves with the camera, which is what makes a window read as glass.
   3. THE INTERIOR IS BUILT. A tinted plane cannot be "interior visible" however it is shaded, so
      every shopfront gets a dark recess box behind its glass with something in it. That is what
      the plates actually show and it is cheap — one box and two shelves per unit.
   VALUES: the body colour is dark and COOL, sampled to sit under the weatherboard and brick it
   stands beside rather than picked for prettiness; opacity is high enough that the recess reads
   through it and low enough that the sheet is still a sheet. */
const SHOPGLASS={
  body   :0x16232A,   // dark, cool, well below any wall value in the frame
  rough  :0.10,       // a flat sheet, not a perfect mirror — a perfect mirror reads as chrome
  env    :1.9,        // the reflection is the dominant highlight, off the P2 HDRI
  coat   :1.0,        // plate glass has a specular sheet ON TOP of its body colour
  coatRough:0.035,
  opacity:0.68,       // the recess behind shows through, which is the half a tint cannot fake
  interior:0x140F0C,  // the box the recess is made of: near-black, warmer than the glass
  /* THE INTERIOR IS LIT, AND THE FIRST CUT WAS NOT — that is the whole difference between a
     shopfront and a painted-out window. Shot at 35_village_glass the panes came back as flat matte
     black rectangles: a dark sheet at 0.68 over a dark brown recess is just dark, and under a
     verandah there is no sky in the reflection direction to rescue it. The verandah shading is
     AUTHENTIC and it is not the bug — it means the REFLECTION cannot carry the read here, so the
     interior has to, which is exactly what ref_bow_06 shows: that garage is legible because light
     falls into it.
     `lit` is drawn with bmat — MeshBasicMaterial, unlit — so it reads at the same value whatever
     the sun is doing, which is the same idiom the hut's warm window and the pie warmer already
     use. It is a shop with its lights on at midday, which is what a shop is. */
  lit    :0xE8C88A,   // the warm back wall the recess is lit by
  shelf  :0xA98A5E,   // and the shelves lift with it, or they vanish against the box
};
/* ONE MATERIAL, MEMOISED, because every shopfront shares it and a per-window clone would be a
   per-window PMREM lookup for no gain. MeshPhysicalMaterial rather than Standard: clearcoat is the
   term that puts a sheet of specular over a dark body, and it is the cheap half of Physical —
   transmission is the expensive half and this does not use it, because a shop window is not a
   lens and the recess behind it is built rather than refracted. */
let SHOPGLASSMAT=null;
function shopGlassMat(){
  if(SHOPGLASSMAT)return SHOPGLASSMAT;
  const g=SHOPGLASS;
  SHOPGLASSMAT=new THREE.MeshPhysicalMaterial({
    color:new THREE.Color(g.body).convertSRGBToLinear(),
    roughness:g.rough, metalness:0.0,
    clearcoat:g.coat, clearcoatRoughness:g.coatRough,
    envMapIntensity:g.env,
    transparent:true, opacity:g.opacity,
    side:THREE.FrontSide, depthWrite:false,
  });
  SHOPGLASSMAT.name='shopGlass';
  return SHOPGLASSMAT;
}
/* A SHOPFRONT: the recess, what is in it, the sheet, and the mullions — in that order, which is
   also back to front in depth so the transparent sheet is drawn over a solid interior.
   THE GLASS DOES NOT WRITE DEPTH (depthWrite:false) and the recess does, so the interior is never
   sorted out from behind its own window — the failure that makes a transparent sheet look like a
   hole. Returns the glass mesh, because that is what a peck mission wants to shake. */
function shopWindow(w,h,x,y,z,parent,deep){
  const d=deep===undefined?1.6:deep;
  const G2=SHOPGLASS;
  /* the recess: a five-sided box, open toward the street, so the interior is a SPACE — and its
     BACK WALL IS LIT, which is what makes the space legible through a dark sheet */
  const back=new THREE.Mesh(new THREE.PlaneGeometry(w*0.96,h*0.92),bmat(G2.lit));
  back.position.set(x,y,z-d+0.03); parent.add(back);
  box(w,h,0.06,G2.interior,x,y,z-d,parent,{noshadow:true});
  box(w,0.06,d,G2.interior,x,y+h/2,z-d/2,parent,{noshadow:true});     // ceiling
  box(w,0.06,d,G2.interior,x,y-h/2,z-d/2,parent,{noshadow:true});     // floor
  for(const sx of [-1,1]) box(0.06,h,d,G2.interior,x+sx*w/2,y,z-d/2,parent,{noshadow:true});
  /* something in it, because "interior visible" is a claim a shelf can settle */
  for(let i=0;i<2;i++) box(w*0.82,0.05,d*0.5,G2.shelf,x,y-h*0.18+i*h*0.30,z-d*0.55,parent,{noshadow:true});
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(w,h),shopGlassMat());
  gl.position.set(x,y,z); gl.renderOrder=2; parent.add(gl);
  /* the mullions read as a grid against the dark, which is the ref_bow_00 read */
  for(const mx of [-w/4,0,w/4]) box(0.05,h,0.05,PAL.paper,x+mx,y,z+0.02,parent,{noshadow:true});
  box(w+0.10,0.09,0.09,PAL.paper,x,y+h/2,z+0.02,parent,{noshadow:true});
  box(w+0.10,0.09,0.09,PAL.paper,x,y-h/2,z+0.02,parent,{noshadow:true});
  return gl;
}

/* ---------- THE VILLAGE (VILLAGE.md, the fourth map) ----------
   An alpine village main street. The brochure has declared it since TODO 37 and rendered it 'soon'
   for one reason: BIOMES['village'] did not exist.
   THE STREET IS THE ORGANISING LINE, the way the track was the campground's and the tow line the
   ski field's — one sealed road along z=0, a kerbed footpath each side, and a continuous verandah
   over the shop footpath. THE VERANDAH IS THE SIGNATURE STRUCTURE: a 25 m climbable ridge at
   first-floor height running the whole shop row, which nothing in the tour has yet.
   IT IS THE FIRST NEW MAP THAT WANTS ROAD LANES. The carpark declares them, the ski field and the
   campground declare none, and a main street with no through traffic is a street with no point. */
const VILLNEST={x:-30,z:-30};
const VILLST={z:0, w:7.0, x0:-44, x1:44};              // the sealed road
const VILLPATH={north:-5.4, south:5.4, w:2.6};         // kerbed footpaths either side
const VILLVER={z:-6.4, x0:-13.0, x1:13.0, h:3.05};     // the verandah over the shop footpath
const VILLSHOP={z:-10.2, w:7.6, d:6.0, h:4.2};         // the shop row, three units deep of it
/* THE UNITS ABUT, AND THE SPACING IS THE WIDTH FOR A REASON. They were 7.6 wide at 8.0 centres,
   which leaves a 0.4 m gap between every pair — and shot at 36_village_bakery that gap read as a
   bright hole through the shop row to the field behind, because a terrace of shops with daylight
   between them is not a terrace. Spaced at exactly VILLSHOP.w so the party walls meet. */
const VILLUNITS=[
  {id:'bakery',   x:-7.6, name:'BAKERY',   wall:0xB8563A},
  {id:'cafe',     x: 0.0, name:'CAFE',     wall:0xC9B48A},
  {id:'souvenir', x: 7.6, name:'MERINO',   wall:0x4E6E8E},
];
const VILLSHELTER={x:7.0, z:6.8};                      // the bus shelter, across the street
const VILLBIKE={x:-14.2, z:-5.0};
const VILLLAMP={x:13.6, z:-4.6};
const VILLPOLE={x:-17.5, z:5.6};
const VILLBINS=[{x:-4.2,z:-4.9},{x:11.0,z:-4.9}];
const VILLPLANTERS=[{x:-11.6,z:-4.7},{x:-2.0,z:-4.7},{x:5.6,z:-4.7}];
/* NO SNOW IN A VILLAGE SUMMER, declared rather than omitted — piece 39 found four globals that
   were really carpark declarations and the one it did not find put seven hatchbacks on the snow. */
const VILLSNOW=null;

/* THE SHOP ROW, one entry per unit, placed three times off VILLUNITS. Its glass is the material
   call recorded above SHOPGLASS, not a pane() reuse. */
defineProp('vill_shop',{
  biome:'village', at:{x:0,z:VILLSHOP.z},
  collider:[{kind:'box',w:VILLSHOP.w,d:VILLSHOP.d,top:VILLSHOP.h,solid:true}],
  anchors:{door:{x:0,y:1.05,z:VILLSHOP.d/2+0.1}, window:{x:0,y:1.75,z:VILLSHOP.d/2+0.12},
           parapet:{x:0,y:VILLSHOP.h+0.25,z:0}},
  material:{family:'weatherboard',nightTint:false},
  build(g,p){
    const S=VILLSHOP, fz=S.d/2;
    /* THE FRONT WALL IS AN OPENING, NOT A DECAL ON A SOLID, and the first cut was the latter: the
       carcass was one box from z -3 to +3 with the glass hung at +3.06 and a lit recess placed at
       +1.56 — INSIDE the solid. Shot at 35_village_glass the panes came back flat black, because
       the carcass's own front face stood between the lens and the interior it was meant to show.
       So the shell is built as walls, and the front is built as the masonry AROUND the openings:
       four piers, a sill under each window, and a spandrel over the lot. The window is then a hole
       with a lit box behind it, which is what a shopfront is. */
    const W=2.4, H=2.2, y0=0.65, y1=y0+H;                 // the opening, and where it sits
    const XW=[-2.2,2.2];                                   // the two window centres
    p.shellParts=[];
    const wall=(w,h,d,x,y,z)=>{ const m=box(w,h,d,PAL.paper,x,y,z,g); p.shellParts.push(m); return m; };
    wall(S.w,S.h,0.20,0,S.h/2,-fz+0.10);                              // the back
    for(const sx of [-1,1]) wall(0.20,S.h,S.d,sx*(S.w/2-0.10),S.h/2,0);   // the sides
    box(S.w,0.18,S.d,PAL.hutRoof,0,S.h-0.09,0,g);                     // the roof slab
    /* the front: piers either side of each opening, sills under them, spandrel over */
    for(const px of [-3.80,-1.00,1.00,3.80]) wall(0.42,y1,0.22,px,y1/2,fz-0.11);
    for(const wx of XW) wall(W,y0,0.22,wx,y0/2,fz-0.11);              // the sills
    wall(S.w,S.h-y1,0.22,0,y1+(S.h-y1)/2,fz-0.11);                    // the spandrel
    /* AND A TRANSOM OVER THE DOOR. The door is 2.1 tall and the spandrel starts at 2.85, so the
       front wall had a 0.75 m open band straight over the doorway — daylight through the shop,
       visible as a sliver beside the door head at 36_village_bakery. A shopfront has a transom
       there; this is it. */
    wall(2.0,y1-2.10,0.22,0,2.10+(y1-2.10)/2,fz-0.11);
    const par=box(S.w+0.4,0.5,S.d+0.3,PAL.paper,0,S.h+0.25,0,g);      // the parapet every shop has
    p.shellParts.push(par);
    /* THE SHOPFRONT GLASS, in the opening the masonry left. Its recess is now a real space. */
    p.glass=[];
    for(const wx of XW) p.glass.push(shopWindow(W,H,wx,y0+H/2,fz-0.02,g,1.5));
    box(1.1,2.1,0.10,PAL.woodD,0,1.05,fz-0.06,g);                     // the door
    sph(0.05,PAL.metal,0.42,1.05,fz+0.02,g,7);
    p.collide();
  },
});
defineProp('vill_verandah',{
  biome:'village', at:{x:(VILLVER.x0+VILLVER.x1)/2,z:VILLVER.z},
  /* THE RIDGE IS A ROOF COLLIDER, not a box: it is what the bird stands on and it is 26 m long, so
     groundHeightAt has to answer for every metre of it. Half-extents, verbatim, like the hut's. */
  collider:[{kind:'roof',w:(VILLVER.x1-VILLVER.x0)/2,d:1.5,ridge:VILLVER.h+0.22,slope:0.10}],
  anchors:{ridge:{x:0,y:VILLVER.h+0.24,z:0}, west:{x:-11.5,y:VILLVER.h+0.24,z:0},
           east:{x:11.5,y:VILLVER.h+0.24,z:0}},
  material:{family:'corrugate',nightTint:false},
  build(g,p){
    const V=VILLVER, L=V.x1-V.x0;
    const rf=box(L,0.12,3.0,PAL.hutRoof,0,V.h+0.16,0,g); rf.rotation.x=0.05;
    for(let i=0;i<14;i++) box(L-0.4,0.05,0.08,0x4A545C,0,V.h+0.23,-1.4+i*0.215,g,{noshadow:true});
    box(L+0.3,0.20,0.14,PAL.hutRoof,0,V.h+0.26,1.45,g,{noshadow:true});   // the street-side fascia
    for(let i=0;i<=6;i++){ const px=-L/2+i*(L/6);
      cyl(0.08,0.09,V.h,PAL.paper,px,V.h/2,1.3,g,7); }                    // the posts on the kerb
    p.collide();
  },
});
defineProp('vill_shelter',{
  biome:'village', at:{x:VILLSHELTER.x,z:VILLSHELTER.z,ry:Math.PI},
  collider:[{kind:'box',w:3.2,d:1.6,top:2.35,solid:true}],
  anchors:{roof:{x:0,y:2.38,z:0}, bench:{x:0,y:0.46,z:-0.5}, timetable:{x:1.1,y:1.5,z:-0.7}},
  material:{family:'corrugate',nightTint:false},
  build(g,p){
    box(3.4,0.10,1.8,PAL.hutRoof,0,2.32,0,g);
    for(const sx of [-1,1]) cyl(0.06,0.07,2.3,PAL.metal,sx*1.55,1.15,-0.75,g,7);
    for(const sx of [-1,1]) cyl(0.06,0.07,2.3,PAL.metal,sx*1.55,1.15,0.75,g,7);
    box(3.3,1.5,0.08,0x9FB8C4,0,1.25,-0.82,g,{noshadow:true});          // the back panel
    rbox(2.8,0.08,0.42,0.03,PAL.wood,0,0.44,-0.50,g);                    // the bench
    box(0.55,0.7,0.04,0xE8E2D2,1.10,1.50,-0.76,g,{noshadow:true});       // the timetable
    p.collide();
  },
});
defineProp('vill_bin',{
  biome:'village', at:{x:0,z:0},
  collider:[{kind:'box',w:0.7,d:0.7,top:1.0,solid:true}],
  anchors:{rim:{x:0,y:1.02,z:0}, body:{x:0,y:0.55,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    cyl(0.32,0.28,0.95,0x3E5B4E,0,0.48,0,g,12);
    for(const ry of [0.28,0.62,0.88]){ const rib=new THREE.Mesh(new THREE.TorusGeometry(0.315,0.018,6,14),mat(0x334E42));
      rib.position.y=ry; rib.rotation.x=1.57; g.add(rib); }
    cyl(0.34,0.34,0.07,PAL.dark,0,1.00,0,g,12);
    p.collide();
  },
});
defineProp('vill_planter',{
  biome:'village', at:{x:0,z:0},
  collider:[{kind:'box',w:1.1,d:0.7,top:0.62,solid:true}],
  anchors:{soil:{x:0,y:0.60,z:0}},
  material:{family:'concrete',nightTint:false},
  build(g,p){
    box(1.15,0.55,0.75,0xA9A7A2,0,0.28,0,g);
    box(0.95,0.06,0.58,0x4A3A22,0,0.57,0,g,{noshadow:true});             // the soil
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2;
      const b=sph(0.13,i%2?0x4E7F3E:0x5E9448,Math.cos(a)*0.28,0.66,Math.sin(a)*0.16,g,7);
      b.scale.y=0.7; }
    p.collide();
  },
});
defineProp('vill_bikerack',{
  biome:'village', at:{x:VILLBIKE.x,z:VILLBIKE.z},
  collider:[],
  anchors:{bellA:{x:-0.55,y:0.98,z:0.06}, bellB:{x:0.55,y:0.98,z:0.06}},
  material:{family:null,nightTint:false},
  build(g,p){
    for(let i=0;i<3;i++){ const hoop=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.028,6,14,Math.PI),mat(PAL.metal));
      hoop.position.set(-0.7+i*0.7,0.34,0); g.add(hoop); }
    /* two bikes, leaned: a frame triangle, two wheels and a bar, which is all a bike needs to be
       one at this distance — and the BELL is the anchor, because that is what a kea takes */
    for(const bx of [-0.55,0.55]){
      for(const wz of [-0.42,0.42]){ const w=new THREE.Mesh(new THREE.TorusGeometry(0.30,0.025,6,16),mat(PAL.dark));
        w.position.set(bx,0.30,wz); g.add(w); }
      cyl(0.022,0.022,0.86,bx<0?0xC0392B:0x2F6E5E,bx,0.55,0,g,6).rotation.x=1.57;
      cyl(0.020,0.020,0.42,PAL.metal,bx,0.78,-0.30,g,6);
      box(0.30,0.035,0.05,PAL.dark,bx,0.98,-0.30,g,{noshadow:true});     // the bars
      sph(0.045,PAL.sun,bx,0.98,0.06,g,7);                               // the bell
    }
  },
});
defineProp('vill_lamp',{
  biome:'village', at:{x:VILLLAMP.x,z:VILLLAMP.z},
  collider:[{kind:'box',w:0.4,d:0.4,top:0.3,solid:true}],
  anchors:{head:{x:0,y:4.05,z:0}, base:{x:0,y:0.3,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    cyl(0.16,0.20,0.30,0xA9A7A2,0,0.15,0,g,10);
    cyl(0.07,0.09,3.8,PAL.metal,0,1.95,0,g,10);
    const arm=cyl(0.05,0.05,0.7,PAL.metal,0.28,3.92,0,g,7); arm.rotation.z=1.2;
    rbox(0.46,0.14,0.30,0.05,PAL.dark,0.56,4.02,0,g);
    p.lampGlow=new THREE.Mesh(new THREE.PlaneGeometry(0.40,0.24),bmat(0xFFE2A8));
    p.lampGlow.position.set(0.56,3.93,0); p.lampGlow.rotation.x=-Math.PI/2; g.add(p.lampGlow);
    p.collide();
  },
});
defineProp('vill_sandwich_board',{
  biome:'village', at:{x:-8.0,z:-4.6},
  collider:[],
  anchors:{face:{x:0,y:0.55,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    for(const s of [-1,1]){ const f=rbox(0.70,0.95,0.04,0.02,0x2A2418,0,0.50,s*0.16,g);
      f.rotation.x=s*0.16; }
    box(0.70,0.04,0.30,PAL.woodD,0,0.03,0,g,{noshadow:true});
  },
});

function buildVillage(){
  G.nestPos={x:VILLNEST.x,z:VILLNEST.z};
  /* ---- TERRAIN: a valley floor, flatter than any of the three, because a village is built on
     the one bit of ground that is flat. The SAME named block as the other three (GRASS.ground). */
  const GRD=GRASS.ground;
  const gg=new THREE.PlaneGeometry(240,240,GRD.segs,GRD.segs);
  const pos=gg.attributes.position;
  for(let i=0;i<pos.count;i++){ const x=pos.getX(i),y=pos.getY(i); const d=Math.sqrt(x*x+y*y);
    let h=0; if(d>58) h=(d-58)*0.10*(1+0.28*Math.sin(x*0.05)*Math.cos(y*0.06));
    h+=Math.sin(x*0.14)*Math.cos(y*0.12)*0.09; pos.setZ(i,h); }
  gg.computeVertexNormals();
  { const cols=[], pp=gg.attributes.position;
    const cG=new THREE.Color(PAL.ground3).convertSRGBToLinear(),
          cD=new THREE.Color(PAL.ground).convertSRGBToLinear(),
          cR=new THREE.Color(PAL.rock).convertSRGBToLinear();
    const MS=GRD.maskScale;
    for(let i=0;i<pp.count;i++){ const x=pp.getX(i), zw=-pp.getY(i), mx=x*MS, mz=zw*MS;
      const n=Math.sin(mx*0.11+1.2)*Math.cos(mz*0.09)+Math.sin(mx*0.30)*0.4;
      let c=n>0.45?cD.clone():cG.clone();
      const d=Math.hypot(x,zw); if(d>54)c.lerp(cR,Math.min(0.8,(d-54)/32));
      cols.push(c.r,c.g,c.b); }
    gg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
  uvMetres(gg);
  const ground=new THREE.Mesh(gg,matGround('grass',0.94));
  ground.rotation.x=-Math.PI/2; if(!HEADLESS)ground.receiveShadow=true; G.scene.add(ground);
  buildGrass('village'); buildTrees();

  /* ---- THE STREET, THE KERBS AND THE FOOTPATHS ---- */
  { const S=VILLST, L=S.x1-S.x0, cx=(S.x0+S.x1)/2;
    const slab=box(L,0.16,S.w,PAL.tarmac,cx,0.08,S.z,null,{noshadow:true});
    slab.receiveShadow=!HEADLESS;
    /* the centre line, dashed, which is what says ROAD rather than APRON */
    for(let x=S.x0+2;x<S.x1;x+=5) box(2.2,0.16,0.16,PAL.roadLine,x,0.17,S.z,null,{noshadow:true});
    for(const pz of [VILLPATH.north,VILLPATH.south]){
      const kerb=box(L,0.28,0.22,0xA9A7A2,cx,0.14,pz+(pz<0?VILLPATH.w/2:-VILLPATH.w/2),null,{noshadow:true});
      kerb.receiveShadow=!HEADLESS;
      const path=box(L,0.24,VILLPATH.w,0xB4AFA6,cx,0.12,pz,null,{noshadow:true});
      path.receiveShadow=!HEADLESS;
    } }

  /* ---- THE SHOP ROW, THE VERANDAH OVER IT, AND WHAT SITS UNDER IT ---- */
  const SHOPS={};
  for(const u of VILLUNITS){
    const P=placeProp('vill_shop',{at:{x:u.x,z:VILLSHOP.z}});
    /* EVERY MASONRY PART TAKES THE UNIT'S COLOUR. The shell used to be one box and one assignment;
       it is nine parts now because the front had to become an opening, and painting only the first
       of them would have left a shop with a coloured back and a cream front. */
    for(const m of (P.shellParts||[]))m.material=mat(u.wall);
    SHOPS[u.id]=P;
  }
  const VER=placeProp('vill_verandah'); G.villVerandah=VER;
  G.villShops=SHOPS;

  /* THE BAKERY: the pie warmer in the window, and the sandwich board on the footpath */
  { const B=SHOPS.bakery, w=B.anchor('window');
    const warm=rbox(1.30,0.60,0.50,0.05,PAL.metal,0,0,0,null);
    warm.position.set(B.at.x,1.20,VILLSHOP.z+VILLSHOP.d/2-0.85); G.scene.add(warm);
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.14,0.44),bmat(0xFFC66B));
    glow.position.set(B.at.x,1.20,VILLSHOP.z+VILLSHOP.d/2-0.58); G.scene.add(glow);
    G.villWarmer={x:B.at.x,z:VILLSHOP.z+VILLSHOP.d/2-0.85,open:false,mesh:warm};
    addPeck({label:'WORK THE PIE WARMER',needHits:3,mesh:warm,
      getPos:()=>({x:B.at.x,y:1.35,z:VILLSHOP.z+VILLSHOP.d/2+0.15}),range:1.5,owner:'baker',
      onDone(p){ G.villWarmer.open=true; AU.clang();
        TW.add(0.5,u=>{ warm.rotation.x=-0.9*Math.min(1,u*1.3); });
        for(let i=0;i<3;i++)spawnLoose('mince pie',PB.pie,
          {x:p.x+rnd(-0.5,0.5),y:1.3,z:p.z+0.4},{food:true,owner:'baker',vy:2.2});
        award(45,'THE PIE WARMER. WARM NO LONGER.',p); done('v_warmer');
        noise(p,10,'misdeed','baker'); }});
    const SB=placeProp('vill_sandwich_board');
    addTear({label:'FLATTEN THE SANDWICH BOARD',need:1.3,mesh:SB.group,
      getPos:()=>SB.anchor('face'),range:1.3,owner:'baker',keepMesh:true,
      onDone(p){ AU.clang();
        TW.add(0.6,u=>{ SB.group.rotation.x=1.45*Math.min(1,u*1.2)+Math.sin(u*15)*0.1*(1-u); });
        award(20,'TODAY SPECIAL: NOTHING',p); done('v_board'); noise(p,6,'misdeed','baker'); }});
  }

  /* THE CAFE: tables with umbrellas under the verandah, and a tray of sugar sachets */
  { const C=SHOPS.cafe;
    for(const tx of [-1.9,1.9]){
      const t=cyl(0.52,0.50,0.06,PAL.paper,C.at.x+tx,0.74,VILLVER.z+0.6,null,14);
      cyl(0.05,0.05,0.72,PAL.metal,C.at.x+tx,0.37,VILLVER.z+0.6,null,7);
      for(let i=0;i<2;i++){ const ch=rbox(0.42,0.05,0.42,0.02,PAL.woodD,
        C.at.x+tx+(i?0.78:-0.78),0.46,VILLVER.z+0.6,null);
        for(const [lx,lz] of [[-0.15,-0.15],[0.15,-0.15],[-0.15,0.15],[0.15,0.15]])
          cyl(0.02,0.02,0.46,PAL.metal,C.at.x+tx+(i?0.78:-0.78)+lx,0.23,VILLVER.z+0.6+lz,null,5); }
    }
    /* THE UMBRELLA is the one that tips, so it is the one with a tear on it */
    const um=new THREE.Group(); um.position.set(C.at.x-1.9,0,VILLVER.z+0.6); G.scene.add(um);
    cyl(0.035,0.035,2.3,PAL.metal,0,1.15,0,um,7);
    const canopy=new THREE.Mesh(new THREE.ConeGeometry(1.35,0.55,8),mat(PAL.bad));
    canopy.position.y=2.15; um.add(canopy);
    G.villUmbrella=um;
    addTear({label:'TIP THE CAFE UMBRELLA',need:1.7,mesh:um,
      getPos:()=>({x:C.at.x-1.9,y:1.5,z:VILLVER.z+0.6}),range:1.7,owner:'barista',keepMesh:true,
      onDone(p){ AU.whoosh();
        TW.add(0.8,u=>{ um.rotation.z=1.35*Math.min(1,u*1.15)+Math.sin(u*13)*0.08*(1-u); },
          ()=>{ burst({x:C.at.x-1.9,y:0.6,z:VILLVER.z+1.6},PAL.bad,10); });
        award(30,'AL FRESCO, CANCELLED',p); done('v_umbrella'); noise(p,8,'misdeed','barista'); }});
    /* the sachet tray: three peels off one strip, which is the addStrip verb doing what it does */
    /* THE STRIP NEEDS A REAL GROUP AND ITS PATH IS LOCAL TO IT. addStrip's frontier is resolved by
       stripWorld, which does group.localToWorld — so `group:null` is not "no parent", it is a
       throw on the first frame the tear is measured. The carpark's two strips both pass a real
       group and their paths are in its space; this one does the same. */
    { const trayG=new THREE.Group(); trayG.position.set(C.at.x+1.9,0,VILLVER.z+0.6); G.scene.add(trayG);
      rbox(0.34,0.04,0.24,0.01,0xE8E2D2,0,0.78,0,trayG);
      const pth=[]; for(let i=0;i<=3;i++)pth.push({x:-0.30+i*0.20,y:0.81,z:0});
      addStrip({group:trayG,path:pth,thick:{x:0.18,y:0.02,z:0.16},color:0xE8E2D2,
        label:'SCATTER THE SUGAR SACHETS',need:0.5,range:1.2,owner:'barista',mission:'v_sachets',
        propName:'sugar sachet',propBuilder:PB.longSticker,propExtra:{},points:25,
        doneText:'EVERY SACHET. EVERYWHERE.',noiseAmt:5}); }
  }

  /* THE SOUVENIR SHOP: the postcard rack outside the door, three peels of it */
  { const S=SHOPS.souvenir;
    const rk=new THREE.Group(); rk.position.set(S.at.x+2.3,0,VILLVER.z+0.4); G.scene.add(rk);
    cyl(0.05,0.06,1.5,PAL.metal,0,0.75,0,rk,7);
    for(let i=0;i<3;i++){ const a=i/3*Math.PI*2;
      /* rbox is (w,h,d,r,c,x,y,z,parent,opts) — ten positional args, and a stray eleventh put the
         RADIUS where the parent goes, so `0.01.add` was the throw. Named nothing; counted wrong. */
      const card=rbox(0.30,0.42,0.03,0.01,[0x4E7FA8,0xC9992F,0x4E7F3E][i],
        Math.cos(a)*0.24,1.05,Math.sin(a)*0.24,rk);
      addTear({label:'ROB THE POSTCARD RACK',need:0.9,mesh:card,air:true,keepMesh:true,
        getPos:()=>({x:S.at.x+2.3+Math.cos(a)*0.24,y:1.05,z:VILLVER.z+0.4+Math.sin(a)*0.24}),
        range:1.2,owner:'tourist',
        onDone(p){ card.visible=false; AU.rip(); burst(p,0xE8E2D2,6);
          spawnLoose('postcard',PB.longSticker,{x:p.x,y:0.9,z:p.z},{shiny:true});
          award(12,'POSTCARD: SENT',p); prog('v_rack'); }});
    }
    /* THE GLASS PECK: a shopfront window is a peck target that is not a lid, which the tour does
       not otherwise have — you cannot open it, you can only annoy somebody through it. */
    const gl=(S.glass&&S.glass[0])||S.group;
    addPeck({label:'PECK THE SHOP WINDOW',needHits:4,mesh:gl,repeat:false,
      getPos:()=>S.anchor('window'),range:1.5,owner:'tourist',
      onDone(p){ AU.clang(); G.shake=Math.max(G.shake||0,0.22);
        for(const g2 of (S.glass||[])) TW.add(0.5,u=>{ g2.position.x=(S.at.x===0?0:0)+Math.sin(u*40)*0.02*(1-u); });
        award(35,'SOMEBODY IS COMING OUT',p); done('v_glass'); noise(p,12,'misdeed','tourist'); }});
  }

  /* ---- KERBSIDE FURNITURE ---- */
  for(const b of VILLBINS){ const P=placeProp('vill_bin',{at:{x:b.x,z:b.z}});
    addTear({label:'TIP THE STREET BIN',need:1.5,mesh:P.group,getPos:()=>P.anchor('body'),
      range:1.4,owner:null,keepMesh:true,
      onDone(p){ AU.clang();
        TW.add(0.6,u=>{ P.group.rotation.z=1.5*Math.min(1,u*1.25)+Math.sin(u*17)*0.1*(1-u); });
        spawnLoose('rubbish',PB.rubbish,{x:p.x+0.7,y:0.6,z:p.z},{vy:2.2});
        spawnLoose('shiny can',PB.can,{x:p.x+0.4,y:0.7,z:p.z+0.3},{shiny:true,vy:2.5});
        award(18,'STREET BIN: REDISTRIBUTED',p); prog('v_bin'); noise(p,7,'misdeed',null); }});
  }
  for(const q of VILLPLANTERS) placeProp('vill_planter',{at:{x:q.x,z:q.z}});
  const BK=placeProp('vill_bikerack');
  for(const an of ['bellA','bellB']){
    addPeck({label:'TAKE A BIKE BELL',needHits:2,mesh:BK.group,getPos:()=>BK.anchor(an),
      range:1.2,owner:null,
      onDone(p){ AU.pop(); spawnLoose('bike bell',PB.keys,{x:p.x,y:0.8,z:p.z},{shiny:true,vy:1.8});
        award(15,'DING',p); done('v_bell'); }});
  }
  const LP=placeProp('vill_lamp'); G.villLamp=LP;
  placeProp('vill_shelter');
  /* the power pole, which is furniture rather than a prop: nothing attaches to it */
  { cyl(0.14,0.18,7.0,PAL.woodD,VILLPOLE.x,3.5,VILLPOLE.z,null,8);
    box(1.8,0.10,0.10,PAL.woodD,VILLPOLE.x,6.6,VILLPOLE.z,null,{noshadow:true});
    rbox(0.34,0.46,0.34,0.05,0x8C8F93,VILLPOLE.x,5.4,VILLPOLE.z+0.24,null); }

  buildNest(G.nestPos.x,G.nestPos.z);

  /* ---- ANGLE-PARKED CARS. Placeholders through the registry, like everything else. ---- */
  G.cars.push(mkCar(-19.5,-3.6,0.42, PAL.white,'hatch'));
  G.cars.push(mkCar(2.6,-3.6,0.42, PAL.blue,'hatch'));

  /* ---- THE TEACHING ---- */
  addHint('v_verandah',0,VILLVER.h+0.6,VILLVER.z,7,'that verandah runs the whole row, and it is flat');
  addHint('v_warmer',VILLUNITS[0].x,1.4,VILLSHOP.z+VILLSHOP.d/2,5,'something is warm in that window');
  addHint('v_glass',VILLUNITS[2].x,1.8,VILLSHOP.z+VILLSHOP.d/2,5,'you cannot open a window, but you can be heard through one');
  addHint('v_lamp',VILLLAMP.x,4.2,VILLLAMP.z,6,'the lamp post sees the whole street');

  /* ---- THE COUNTRY: the carpark's own construction at valley radii. ---- */
  for(let i=0;i<18;i++){ const far=i%2===0, a=i/18*Math.PI*2+rnd(-0.1,0.1), r=far?rnd(132,164):rnd(100,126);
    const h=far?rnd(34,58):rnd(24,44), w=far?rnd(44,68):rnd(28,50);
    const geo=new THREE.ConeGeometry(w,h,22,7);
    { const pos2=geo.attributes.position, ph=rnd(0,6.3), ph2=rnd(0,6.3);
      for(let v=0;v<pos2.count;v++){
        const x=pos2.getX(v), y=pos2.getY(v), z=pos2.getZ(v);
        const rr=Math.hypot(x,z); if(rr<0.001)continue;
        const ang=Math.atan2(z,x), t01=y/h+0.5;
        const nz=0.55*Math.sin(ang*3+ph)+0.3*Math.sin(ang*7+ph2)+0.15*Math.sin(ang*13+ph*2);
        const kR=1+nz*0.28*(1-t01*0.55);
        pos2.setX(v,x*kR); pos2.setZ(v,z*kR);
        pos2.setY(v,y+h*0.05*Math.sin(ang*5+ph2)*t01); }
      geo.computeVertexNormals(); }
    { const cols=[],pos2=geo.attributes.position, cS=new THREE.Color(PAL.mtnSnow).convertSRGBToLinear(),
        cR=new THREE.Color(far?PAL.mtnFar:PAL.mtn).convertSRGBToLinear();
      if(far){ const hz=new THREE.Color(0x9FB8CC).convertSRGBToLinear(); cR.lerp(hz,0.2); cS.lerp(hz,0.14); }
      for(let v=0;v<pos2.count;v++){ const t=clamp((pos2.getY(v)/h+0.5-0.76)*8,0,1);
        const c=cR.clone().lerp(cS,t); cols.push(c.r,c.g,c.b); }
      geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3)); }
    const m=new THREE.Mesh(geo,mat(0xFFFFFF,{vertexColors:true}));
    m.position.set(Math.cos(a)*r,h*0.34,Math.sin(a)*r); m.rotation.y=rnd(0,3); G.scene.add(m);
  }
}

function castVillage(){
  /* SHOPKEEPERS AND A TOURIST. A village with nobody in it has no glass worth pecking, and three
     is what the carpark and the campground carry so the frame budget and the noise economy are the
     ones already measured. NO RANGER, for the campground's reason: the jail verb is wired to
     G.cage, which this map does not build. */
  G.humans.push(new Human('baker','The Baker',0xE8E2D2,VILLUNITS[0].x+1.2,VILLSHOP.z+VILLSHOP.d/2+1.4,
    {hat:'beanie',patrol:[{x:VILLUNITS[0].x+1.2,z:VILLSHOP.z+VILLSHOP.d/2+1.4},
                          {x:VILLUNITS[0].x-1.6,z:VILLVER.z+0.8},{x:VILLUNITS[1].x-1.0,z:VILLVER.z+0.8}]}));
  G.humans.push(new Human('barista','The Barista',0x7A3D2E,VILLUNITS[1].x+1.6,VILLVER.z+1.0,
    {hat:'cap',patrol:[{x:VILLUNITS[1].x+1.6,z:VILLVER.z+1.0},{x:VILLUNITS[1].x-2.2,z:VILLVER.z+0.9},
                       {x:VILLUNITS[1].x,z:VILLSHOP.z+VILLSHOP.d/2+1.2}]}));
  G.humans.push(new Human('tourist','A Tourist',0x4E7FA8,VILLUNITS[2].x+2.0,VILLVER.z+1.6,
    {hat:'beanie',patrol:[{x:VILLUNITS[2].x+2.0,z:VILLVER.z+1.6},{x:VILLSHELTER.x,z:VILLSHELTER.z-1.2},
                          {x:VILLUNITS[2].x-1.4,z:VILLVER.z+1.0}]}));
}

function missionsVillage(mode){
  const A={street:'THE MAIN STREET', bakery:'THE BAKERY'};
  G.chapters=[A.street,A.bakery]; G.chapIdx=0; G.needHydrate=true;
  const anyKea=fn=>()=>G.keas.some(fn);
  const settled=k=>Math.abs(k.vy||0)<0.7;
  const onVerandah=k=>k.x>=VILLVER.x0&&k.x<=VILLVER.x1&&Math.abs(k.z-VILLVER.z)<1.6&&
                       k.y>VILLVER.h-0.4&&settled(k);
  G.missions=[
    {id:'v_verandah',area:A.street,label:'Take the verandah, end to end',
      check:anyKea(k=>onVerandah(k))},
    {id:'v_bin',   area:A.street,label:'Redistribute both street bins',need:2,n:0},
    {id:'v_rack',  area:A.street,label:'Rob all three postcards off the rack',need:3,n:0},
    {id:'v_bell',  area:A.street,label:'Take a bike bell off somebody bike'},
    {id:'v_planter',area:A.street,label:'Excavate a footpath planter',
      check:()=>G.props.some(p=>!p.heldBy&&!p.banked&&
        VILLPLANTERS.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<1.0&&p.y>0.5))},
    {id:'v_warmer',area:A.bakery,label:'Work the pie warmer open'},
    {id:'v_sachets',area:A.bakery,label:'Scatter the tray of sugar sachets'},
    {id:'v_board', area:A.bakery,label:'Flatten the bakery sandwich board'},
    {id:'v_umbrella',area:A.bakery,label:'Tip the cafe umbrella'},
    {id:'v_glass', area:A.bakery,label:'Peck the shop window until somebody comes out'},
  ];
  if(mode===2)G.missions.push({id:'v_duet',area:A.street,coop:true,
    label:'Get BOTH beaks up on the verandah at once',
    check:()=>G.keas.length>1&&G.keas.every(k=>onVerandah(k))});
  /* THE FINALE IS DECLARED WITH THE MISSION (piece 40's seam). The village has shopkeepers, not
     the carpark's four-in-pursuit-then-the-nest, so it declares its own sentence: the lamp post is
     the highest thing on the street and it sees all of it. */
  G.missions.push({id:'v_lamp',finale:true,locked:true,
    label:'THE LAMP POST — take the highest thing on the street',
    armText:{t:'ONE THING LEFT',s:'THE LAMP POST — ALL OF IT FROM UP THERE'},
    check:()=>G.keas.some(k=>Math.hypot(k.x-VILLLAMP.x,k.z-VILLLAMP.z)<1.5&&k.y>3.4)});
}

/* THE ANCHOR COMES IN OVER THE STREET AND LOOKS DOWN IT, which is the establishing shot of this
   map. Held to the world it names by the same assertion the other three are. */
defineBiome('village',{label:'THE VILLAGE',build:buildVillage,cast:castVillage,
  missions:missionsVillage,
  anchor:{x:-34,y:22,z:26, lx:0,ly:1.4,lz:-4},
  snow:VILLSNOW,
  /* THE FIRST NEW MAP THAT DECLARES ROAD LANES. The two lanes of the main street, at the z the
     street is actually built on, and the spawn distance the carpark uses. */
  traffic:{up:VILLST.z-1.75, down:VILLST.z+1.75, x:115}});

/* ---------- THE TOUR: A DOC BROCHURE WITH PINS IN IT (TODO 37, 2026-09-02) ----------
   The level select. One table, and everything the brochure says comes out of it: the order of the
   maps, the copy on each pin, where the pin sits on the paper, and what it costs to open. Tuning the
   tour means editing THIS and nothing else - which is the whole reason it is a table and not six
   branches somewhere in a render function.
   THE CURRENCY IS STARS, because that is the only progress measure the game already keeps that
   survives a reload and cannot be farmed by replaying one act: three per page, granted by pieces 12,
   13 and 14, and banked in the save. need is a TOTAL across the whole tour, so a map can be opened
   by being good anywhere rather than by grinding the one before it.
   A PIN HAS FOUR STATES AND THEY ARE NOT THE SAME QUESTION. locked means you have not paid for it;
   soon means you have and the map does not exist yet, which is the honest thing to say while the
   tour is half built; open means go; current is where you are standing. A pin can be unlocked and
   unbuilt, and saying open when there is nothing to walk into would be the lie.
   THE MODEL IS DATA AND CARRIES NO DOM, so the whole state machine is assertable under node - which
   matters here more than usual, because five of the six pins cannot be photographed yet. */
const TOURKEY='keaTourPick', ARRIVEKEY='keaTourArrive';
const TOUR=[
  {id:'carpark',   need:0,  name:'THE CARPARK',        sub:'where it started - rubber, sandwiches, no witnesses', pin:{x:0.27,y:0.60}},
  {id:'skifield',  need:6,  name:'THE CLUB SKI FIELD', sub:'a rope tow, a day lodge, and a carpark full of nutters', pin:{x:0.44,y:0.28}},
  {id:'campground',need:12, name:'THE DOC CAMPGROUND', sub:'a tent is a bag that somebody left out', pin:{x:0.62,y:0.52}},
  {id:'village',   need:18, name:'THE VILLAGE',        sub:'cafe tables, a bakery, a great deal of glass', pin:{x:0.79,y:0.24}},
  {id:'river',     need:24, name:'THE BRAIDED RIVER',  sub:'jetboats, sandflies, and somebody lunch', pin:{x:0.51,y:0.80}},
  {id:'station',   need:30, name:'THE HIGH STATION',   sub:'a woolshed, a dog kennel, ten thousand sheep', pin:{x:0.86,y:0.66}},
];
function tourStarsIn(rec){ let n=0; if(!rec)return 0;
  for(const a in rec)for(const k of STARKINDS)if(rec[a]&&rec[a][k])n++; return n; }
/* THE MAP YOU ARE STANDING IN IS READ LIVE, not off the blob, so the brochure is right the moment a
   star is granted rather than the next time the game happens to write. */
function tourModel(blob){
  const b=blob||SAVE.migrate(SAVE.load())||{v:3,biomes:{}};
  const here=G.biome||BIOME_DEFAULT, slots=b.biomes||{};
  let total=0;
  const pins=TOUR.map(t=>{ const s=slots[t.id]||null, cur=(t.id===here);
    const stars=cur?tourStarsIn(G.stars):tourStarsIn(s&&s.stars);
    const pages=cur?((G.chapters||[]).length):((s&&s.areas&&s.areas.length)||0);
    total+=stars;
    return {id:t.id, name:t.name, sub:t.sub, pin:t.pin, need:t.need, stars, pages,
            of:pages*STARKINDS.length, built:!!BIOMES[t.id], visited:cur||!!s, current:cur}; });
  for(const p of pins){ p.have=total; p.unlocked=total>=p.need;
    p.stamp=p.of>0&&p.stars>=p.of;                       // every page on that map, every star on it
    p.state=!p.unlocked?'locked':(p.current?'current':(p.built?'open':'soon')); }
  return {stars:total, here, pins, v:b.v||3};
}
function tourPin(id){ return tourModel().pins.find(p=>p.id===id)||null; }
/* PICKING A MAP IS A DECISION, NOT A NAVIGATION. It says yes or no and records the choice; the
   flyover that carries you there is piece 38, and until it exists the browser reloads into the
   pick. boot() reads it, so nothing about the pick has to survive in memory. */
function tourPick(id){
  const m=tourModel(), p=m.pins.find(x=>x.id===id);
  if(!p)return {ok:false,why:'no such map on the brochure',id};
  if(!p.unlocked)return {ok:false,why:'locked',id,need:p.need,have:m.stars};
  if(!p.built)return {ok:false,why:'not built yet',id};
  SAVE.pick(id);
  return {ok:true,id};
}
/* THE BROCHURE ITSELF. Everything above is data; this is the only part that touches the DOM, and it
   reads the model rather than recomputing anything. The PINS are decoration - the rows underneath
   are what a player clicks - because a pin layer that has to stay hit-testable at 320px stops being
   a drawing and starts being a layout problem, and vantage 08 is the standing reminder of what 320px
   does to layouts here. A locked map does not even give its name away. */
function tourRender(){
  if(HEADLESS)return null;
  const m=tourModel();
  const head=document.getElementById('tourstars');
  if(head)head.textContent=m.stars+(m.stars===1?' STAR':' STARS');
  const paper=document.getElementById('tourpaper');
  if(paper){ paper.innerHTML='';
    for(const p of m.pins){ const d=document.createElement('div');
      d.className='tpin '+p.state;
      d.style.left=(p.pin.x*100).toFixed(1)+'%'; d.style.top=(p.pin.y*100).toFixed(1)+'%';
      const b=document.createElement('b'); b.textContent=p.unlocked?p.name:'???';
      d.appendChild(b); paper.appendChild(d); } }
  const list=document.getElementById('tourlist');
  if(list){ list.innerHTML='';
    for(const p of m.pins){ const r=document.createElement('div'); r.className='trow';
      const nm=document.createElement('div'); nm.className='nm';
      const i=document.createElement('i');
      i.textContent=p.unlocked?p.sub:('locked - '+p.need+' stars opens it, you have '+p.have);
      nm.textContent=p.unlocked?p.name:'???'; nm.appendChild(i); r.appendChild(nm);
      if(p.stamp){ const st=document.createElement('span'); st.className='stamp'; st.textContent='CLEARED'; r.appendChild(st); }
      if(p.of){ const pp=document.createElement('div'); pp.className='pips'; pp.textContent=p.stars+' / '+p.of+' STARS'; r.appendChild(pp); }
      const btn=document.createElement('button');
      btn.textContent=p.state==='current'?'YOU ARE HERE':p.state==='open'?'GO':p.state==='soon'?'NOT BUILT YET':'LOCKED';
      btn.disabled=p.state!=='open';
      /* TODO 38: GO records the pick and flies OUT; the reload happens when the beat ends, inside
         travelEnd, so the player sees the map they are leaving rather than a white flash. From the
         TITLE there is nothing to fly out of - no run, no bird - so it arms the arrival directly
         and the flyover IN is the whole transition. */
      btn.onclick=()=>{ if(!tourPick(p.id).ok)return;
        tourOpen(false);
        if(G.running&&travelOut(p.id))return;
        SAVE.armArrival(p.id,{mode:G.mode||1,colossal:!!G.colossal}); location.reload(); };
      r.appendChild(btn); list.appendChild(r); } }
  return m;
}
function tourOpen(on){ if(HEADLESS)return false; const t=document.getElementById('tour');
  if(!t)return false;
  // OPENING THE MAP MID-RUN STOPS THE WORLD, because reading a brochure is not a thing a bird does
  // while a ranger is chasing it. Closing puts the pause back the way it was, not to false.
  if(on===false){ t.classList.remove('open'); if(G.running)G.paused=!!G._tourPaused; return false; }
  if(G.running){ G._tourPaused=!!G.paused; G.paused=true; }
  tourRender(); t.classList.add('open'); return true; }

/* ---------- TRAVEL: LEAVING AND ARRIVING (TODO 38, 2026-09-02) ----------
   Two beats and one state machine. OUT flies the camera off the map you are on; IN flies it down
   onto the map you arrived at, with the name of the place on screen. Both are skippable and both put
   the camera and control state back exactly as they found them.
   THE WORLD CANNOT BE REBUILT IN PLACE YET - buildWorld empties the registries but the old meshes
   are still in the scene - so the swap in the middle is a page load, and the state machine is
   written so that the load is an implementation detail: OUT arms an arrival in storage and reloads,
   boot lands in the picked biome and starts the run it was in, and startGame consumes the arrival
   and plays IN. The day a biome can be swapped in place, travelOut stops reloading and nothing else
   about this changes.
   SKIP ARMS LATE AND REMEMBERS WHAT WAS ALREADY DOWN, which is the second piece of binding evidence
   from Sep 1 and cost a session to learn: the thing that opened this beat was itself a keypress, so
   a key still held from that press has not asked for anything. A key only counts once it has been
   released and pressed again, and not before the arm delay either.
   THE CAMERA BLEND SITS BEFORE THE camLock LINE in updateCams. That is not a style choice - camLock
   is the photographer hook, and a blend applied after it would make every pinned vantage depend on
   whether a travel beat happened to be running. */
const TRAVEL={out:0.95, in:1.7, arm:0.25};        // seconds. FENCED FOR PLAYTEST
const TRAVELKEYS=['Space','Enter','Escape','KeyE','Period','Slash'];
function travelBusy(){ return !!(G.travel&&G.travel.phase); }
function travelAnchorOf(id){ const b=BIOMES[id]; return (b&&b.anchor)||null; }
function travelKeep(){ return {camYaw:G.camYaw||0, camDist:G.camDist||1, photo:!!G.photo}; }
function travelHeld(){ const h={}; for(const c of TRAVELKEYS)h[c]=KEYS.has(c); return h; }
function travelBegin(phase,o){
  G.travel={phase, t:0, dur:phase==='out'?TRAVEL.out:TRAVEL.in,
            from:o.from||null, to:o.to||null, anchor:o.anchor||null, card:o.card||null,
            keep:travelKeep(), held:travelHeld(), armed:false, skipped:false, ended:null};
  return G.travel;
}
function travelOut(to,run){
  if(travelBusy()||!BIOMES[to])return null;   // nothing flies out toward a map that has no builder
  const v=travelBegin('out',{from:G.biome,to,anchor:travelAnchorOf(G.biome)});
  v.run=run||{mode:G.mode||1,colossal:!!G.colossal,vs:!!(G.vs&&G.vs.on)};
  return v;
}
function travelIn(from){
  const id=G.biome||BIOME_DEFAULT;
  return travelBegin('in',{from:from||null,to:id,anchor:travelAnchorOf(id),
                           card:(BIOMES[id]&&BIOMES[id].label)||id});
}
function travelU(){ const v=G.travel; return (!v||!v.dur)?1:clamp(v.t/v.dur,0,1); }
function travelSkip(){ const v=G.travel; if(!v||!v.phase||!v.armed)return false;
  v.skipped=true; v.t=v.dur; travelEnd(); return true; }
function travelUpdate(dt){
  const v=G.travel; if(!v||!v.phase)return;
  v.t+=dt;
  if(!v.armed&&v.t>=TRAVEL.arm)v.armed=true;
  for(const c of TRAVELKEYS){ const down=KEYS.has(c);
    if(!down&&v.held[c]){ v.held[c]=false; continue; }          // released: it may ask from now on
    if(down&&!v.held[c]&&v.armed){ travelSkip(); return; } }
  if(v.t>=v.dur)travelEnd();
}
function travelEnd(){
  const v=G.travel; if(!v||!v.phase)return G.travel||null;
  const ph=v.phase, to=v.to, skipped=v.skipped, run=v.run;
  G.camYaw=v.keep.camYaw; G.camDist=v.keep.camDist; G.photo=v.keep.photo;
  G.travel={phase:null, ended:ph, to, from:v.from, skipped};
  if(ph==='out'&&to)SAVE.armArrival(to,run);
  if(!HEADLESS){ travelCard(null);
    if(ph==='in')flashTodo();                  // the list gets its flash once the card is done with the screen
    if(ph==='out'&&to)location.reload(); }
  return G.travel;
}
function travelCard(text){ if(HEADLESS)return; const el2=document.getElementById('travelcard');
  if(!el2)return; if(!text){ el2.classList.remove('on'); return; }
  el2.textContent=text; el2.classList.add('on'); }

/* ---------- HOME POSITIONS (TODO 17, 2026-09-02) ----------
   Every displaceable and consumable prop remembers the transform it was BUILT at, so a later piece
   can put it back. Foundation only: nothing in this piece changes where anything goes or how anything
   looks. Pieces 19, 20 and 21 are the customers - a botched restore needs a pristine reference to be
   botched AGAINST, and a carry-back needs to know what "within the home radius" means.
   POSITION WAS ALREADY THERE and is already load bearing: propAt has recorded home {x,y,z} all along,
   and the boot score, the missionFar relocations, the cleared-picnic-table detector and the human
   tidy-up all read it. What was missing is ROTATION, and one thing more subtle - WHEN to read it.
   THE SWEEP IS WHY THIS IS NOT A ONE-LINER. Reading the mesh rotation inside propAt is not enough,
   because a build site can rotate a prop AFTER the factory returns: the two skis on the rack are laid
   over at rotation.x=1.35 on the line after they are created. So the factory records what it can see,
   and then homesRegister() sweeps the finished world and re-reads every prop, which is the only moment
   at which the built transform is actually final. Props that spawn DURING play - bin loot, the muesli
   bar out of the pack - keep their factory home, which is their spawn point and correct for them.
   THE FIELD THAT LIED IS NOW NAMED (TODO 47, closed session 7 with option b). propAt draws a random
   heading for every prop and nothing has ever applied it to a prop mesh - ry is the kea and human
   convention, where this.ry drives g.rotation.y, and it is not the prop one. So the honest spawn
   rotation is the MESH transform, and it always was. The DRAW IS NOT REMOVED, because every later
   rnd() in the browser is downstream of it and deleting one draw repins the whole world - the
   snow-patch lesson from session 5, which cost a full re-pin to learn. Renaming the field costs
   nothing and stops the next reader believing it. Applying it (option a) is a visual change to every
   prop in the game and therefore a judged call, not an overnight one. */
const HOMER=1.6;                    // metres. FENCED FOR PLAYTEST: the catch radius for a carry-back
function homeClass(p){ return !p?null:(p.food?'consumable':'displaceable'); }
function homesRegister(){ let n=0;
  for(const p of G.props){ if(!p.mesh)continue;
    p.home={x:p.mesh.position.x,y:p.mesh.position.y,z:p.mesh.position.z,
            rx:p.mesh.rotation.x,ry:p.mesh.rotation.y,rz:p.mesh.rotation.z};
    n++; }
  G.homesN=n; return n; }
function homeDist(p){ return !p||!p.home?Infinity:Math.hypot(p.x-p.home.x,p.z-p.home.z); }
function atHome(p,r){ return homeDist(p)<=(r===undefined?HOMER:r); }

/* ---------- interactable + prop registries ---------- */
let IID=0;
function stripWorld(st,pt){ const v=new THREE.Vector3(pt.x,pt.y,pt.z);
  st.group.updateWorldMatrix(true,false); return st.group.localToWorld(v); }
function addStrip(o){ // a long thing peeled off bit by bit, staying intact
  const segs=[], N=o.path.length-1;
  for(let i=0;i<N;i++){ const a=o.path[i],b=o.path[i+1];
    const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z, L=Math.hypot(dx,dy,dz);
    const ax=Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>Math.abs(dz)?'x':(Math.abs(dy)>Math.abs(dz)?'y':'z');
    const m=rbox(ax==='x'?L:o.thick.x, ax==='y'?L:o.thick.y, ax==='z'?L:o.thick.z, Math.min(o.thick.x,o.thick.y,o.thick.z)*0.48, o.color,
      (a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2, o.group);
    segs.push({m,axis:ax,L,hx:(a.x+b.x)/2,hy:(a.y+b.y)/2,hz:(a.z+b.z)/2});
  }
  const st={segs,f:0,N,group:o.group,path:o.path,done:false,sway:Math.random()*6,avgL:segs.reduce((q,s)=>q+s.L,0)/N};
  G.strips=G.strips||[]; G.strips.push(st);
  const t=addTear({label:o.label+' (0/'+N+')',need:o.need,range:o.range,air:true,owner:o.owner,keepMesh:true,
    getPos:()=>stripWorld(st,st.path[Math.min(st.f,N)]),
    onDone(p){
      st.f++; AU.pop(); if(Math.random()<0.6)AU.tug(); burst(p,o.color,5);
      if(st.f<N){ t.done=false; t.progress=0; t.label=o.label+' ('+st.f+'/'+N+')'; }
      else { st.done=true; segs.forEach(sg=>{ if(sg.m)sg.m.visible=false; });
        const wp=stripWorld(st,st.path[N]);
        spawnLoose(o.propName,o.propBuilder,{x:wp.x,y:Math.max(0.15,wp.y-0.5),z:wp.z},o.propExtra||{});
        AU.rip(); award(o.points,o.doneText,wp); if(o.noiseAmt)noise(wp,o.noiseAmt,'misdeed',o.owner);
        if(o.mission)done(o.mission);
      }
    }});
  t.strip=st; return t;
}
function updateStrips(dt){ if(!G.strips)return;
  for(const st of G.strips){ if(st.done||st.f===0)continue;
    const fr=st.path[st.f];
    const sway=Math.sin(G.time*1.6+st.sway)*(RM?0.1:0.26);
    let px=fr.x+0.05, py=fr.y, pz=fr.z;
    const dir=new THREE.Vector3(0.6,-0.35,0).normalize(); // leaves the groove outward, already sagging
    const AX={x:new THREE.Vector3(1,0,0),y:new THREE.Vector3(0,1,0),z:new THREE.Vector3(0,0,1)};
    for(let j=0;j<st.f;j++){ const sg=st.segs[st.f-1-j], m=sg.m; if(!m)continue;
      const L=sg.L*0.98;
      const curl=0.09+j*0.05+sway*0.05; // a long lazy droop that remembers its coil at the tip
      const nx=dir.x*Math.cos(curl)-dir.y*Math.sin(curl), ny=dir.x*Math.sin(curl)+dir.y*Math.cos(curl);
      dir.x=nx; dir.y=ny-0.06; dir.z+=Math.sin(G.time*2.4+j*0.8)*0.01*(RM?0.3:1); dir.normalize();
      const ex=px+dir.x*L, ey=py+dir.y*L, ez=pz+dir.z*L;
      m.position.set((px+ex)/2,(py+ey)/2,(pz+ez)/2);
      m.quaternion.setFromUnitVectors(AX[sg.axis],dir); // one continuous strand, joint to joint
      m.scale.set(sg.axis==='x'?1:1.12, sg.axis==='y'?1:1.12, sg.axis==='z'?1:1.12);
      px=ex; py=ey; pz=ez;
    }
  }
}
function addTear(o){ o.id='t'+(IID++); o.kind='tear'; o.progress=0; o.done=false;
  if(o.mesh){ o.baseRz=o.mesh.rotation.z;
    o.base={px:o.mesh.position.x,py:o.mesh.position.y,pz:o.mesh.position.z,rx:o.mesh.rotation.x}; }
  G.inter.push(o); return o; }
function addPeck(o){ o.id='k'+(IID++); o.kind='peck'; o.hits=0; o.done=false; G.inter.push(o); return o; }
function mkProp(o){ // loose carryable
  o.id='p'+(IID++); o.kind='prop'; o.heldBy=null; o.banked=false; o.vy=0;
  /* TODO 17: classified HERE and not in the sweep, because this is the one choke point every prop
     passes through AFTER its opts have been merged - so a prop the bin coughs up mid-game is classed
     the same way as one the world was built with. The sweep only owns the transform. */
  o.homeClass=homeClass(o);
  G.props.push(o); G.inter.push(o); return o;
}
function propAt(name,x,y,z,buildFn,opts){
  const g=new THREE.Group(); g.position.set(x,y,z); buildFn(g); if(!HEADLESS)blob(g,0.2,0.26); G.scene.add(g);
  return mkProp(Object.assign({name,mesh:g,x,y:y,z,
    home:{x,y,z,rx:g.rotation.x,ry:g.rotation.y,rz:g.rotation.z},   // spawn transform, TODO 17
    shiny:false,food:false,heavy:false,owner:null,
    _ryUnused:rnd(0,6)},opts||{}));   // TODO 47: the draw stays so the seeded world does not move; the NAME is the fix
}

/* prop visual builders */
const PB={
  wiper(g){ rbox(0.66,0.05,0.07,0.02,PAL.rubber,0,0,0,g); rbox(0.34,0.045,0.05,0.015,PAL.metal,0.16,0.05,0,g).rotation.z=-0.1; sph(0.035,PAL.dark,-0.3,0.03,0,g,6); },
  aerial(g){ const a=cyl(0.016,0.028,0.8,PAL.metal,0,0,0,g,7); a.rotation.z=1.2; sph(0.05,PAL.dark,0.36,0.25,0,g,8); cyl(0.03,0.035,0.06,PAL.dark,-0.36,-0.22,0,g,7).rotation.z=1.2; },
  mirror(g){ rbox(0.26,0.2,0.09,0.035,PAL.dark,0,0,0,g); const gl=new THREE.Mesh(new THREE.PlaneGeometry(0.19,0.13),bmat(PAL.glass)); gl.position.set(0,0,0.048); g.add(gl);
    const gt=new THREE.Mesh(new THREE.PlaneGeometry(0.05,0.09),bmat(0xFFFFFF)); gt.position.set(0.05,0.02,0.049); gt.rotation.z=0.5; g.add(gt); },
  rubberSeal(g){ const s=rbox(0.9,0.055,0.055,0.02,PAL.rubber,0,0,0,g); s.rotation.z=0.4; rbox(0.5,0.055,0.055,0.02,PAL.rubber,0.5,0.16,0,g).rotation.z=-0.5; rbox(0.3,0.05,0.05,0.02,PAL.rubber,-0.42,-0.12,0,g).rotation.z=0.9; },
  spike(g){ rbox(0.5,0.05,0.11,0.02,PAL.metal,0,0,0,g); for(let i=0;i<4;i++){ cyl(0.007,0.013,0.15,PAL.metal,-0.18+i*0.12,0.085,0,g,5); sph(0.014,PAL.metal,-0.18+i*0.12,0.16,0,g,5); } },
  nail(g){ const n=cyl(0.014,0.019,0.16,PAL.metal,0,0,0,g,7); n.rotation.z=1.4; const h=cyl(0.045,0.045,0.02,0x8E9AA6,-0.085,0,0,g,9); h.rotation.z=1.57; },
  cone(g){ cyl(0.05,0.3,0.7,PAL.cone,0,0.37,0,g,10); rbox(0.72,0.06,0.72,0.025,PAL.cone,0,0.03,0,g); const band=cyl(0.185,0.225,0.15,0,0,0.34,0,g,10); band.material=bmat(PAL.white); },
  sandwich(g){ rbox(0.34,0.07,0.34,0.03,PAL.sandwich,0,0,0,g); rbox(0.37,0.03,0.37,0.012,PAL.green,0,0.05,0,g); rbox(0.36,0.025,0.36,0.01,0xD97060,0,0.075,0,g); rbox(0.34,0.07,0.34,0.03,PAL.sandwich,0,0.115,0,g); },
  pie(g){ cyl(0.16,0.19,0.1,PAL.pie,0,0,0,g,12); cyl(0.185,0.185,0.025,PAL.metal,0,-0.055,0,g,12); const cr=sph(0.14,0xE2B463,0,0.05,0,g,10); cr.scale.y=0.35; },
  pav(g){ cyl(0.2,0.23,0.16,PAL.pav,0,0,0,g,12); const cr=sph(0.19,0xFFFFFF,0,0.1,0,g,10); cr.scale.y=0.4;
    sph(0.045,PAL.red,0.06,0.15,0.04,g,7); sph(0.045,PAL.red,-0.03,0.16,-0.06,g,7); sph(0.04,0x7CB85C,-0.08,0.15,0.05,g,7); },
  chip(g){ rbox(0.17,0.035,0.055,0.015,0xF2C230,0,0,0,g); },
  passport(g){ rbox(0.22,0.035,0.3,0.012,0x1E3A6E,0,0,0,g); const em=cyl(0.05,0.05,0.005,PAL.yellow,0,0.02,0.02,g,10); em.rotation.x=1.57; },
  cash(g){ rbox(0.26,0.06,0.14,0.015,PAL.cash,0,0,0,g); rbox(0.26,0.018,0.14,0.008,PAL.paper,0,0.042,0,g); const b=cyl(0.03,0.03,0.145,0xC9B45B,0,0,0,g,8); b.rotation.x=1.57; },
  keys(g){ const ring=new THREE.Mesh(new THREE.TorusGeometry(0.05,0.012,6,12),mat(PAL.metal)); ring.position.set(0,0.02,-0.08); ring.rotation.x=1.57; g.add(ring);
    rbox(0.055,0.02,0.14,0.008,PAL.metal,0,0,0,g); rbox(0.055,0.02,0.14,0.008,PAL.metal,0.06,0,0.03,g).rotation.y=0.5; sph(0.045,PAL.red,0,0.02,-0.09,g,7); },
  radio(g){ rbox(0.15,0.27,0.09,0.025,PAL.dark,0,0,0,g); cyl(0.008,0.008,0.2,PAL.metal,0.045,0.21,0,g,5); sph(0.014,PAL.metal,0.045,0.31,0,g,5);
    for(let i=0;i<3;i++)box(0.09,0.008,0.002,0x596068,0,0.06-i*0.03,0.046,g,{noshadow:true}); box(0.05,0.03,0.02,PAL.red,-0.03,-0.09,0.04,g); },
  gopro(g){ rbox(0.16,0.12,0.1,0.02,PAL.dark,0,0,0,g); const lens=cyl(0.035,0.035,0.035,PAL.glass,0.035,0.02,0.055,g,10); lens.rotation.x=1.57; cyl(0.042,0.042,0.02,0x596068,0.035,0.02,0.05,g,10).rotation.x=1.57; },
  can(g){ cyl(0.07,0.07,0.2,PAL.metal,0,0,0,g,12); cyl(0.072,0.072,0.012,0x9AA2AC,0,0.1,0,g,12); const tab=new THREE.Mesh(new THREE.TorusGeometry(0.02,0.006,5,8),mat(0x9AA2AC)); tab.position.set(0,0.11,0.02); tab.rotation.x=1.57; g.add(tab);
    box(0.1,0.07,0.002,PAL.red,0,0,0.071,g,{noshadow:true}); },
  boot(g){ rbox(0.17,0.15,0.32,0.045,PAL.woodD,0,0.02,0,g); rbox(0.18,0.06,0.14,0.02,PAL.dark,0,-0.055,0.15,g);
    for(let i=0;i<3;i++)box(0.11,0.012,0.012,0xE8E2D2,0,0.06-i*0.035,0.13-i*0.02,g,{noshadow:true}); },
  rubbish(g){ const a=sph(0.085,PAL.paper,0,0,0,g,7); a.scale.set(1,0.7,1); const b=sph(0.055,0xE2D8BE,0.06,0.04,0.03,g,6); b.scale.set(1,0.75,0.9); },
  branch(g){ cyl(0.03,0.05,0.7,PAL.woodD,0,0,0,g,7).rotation.z=1.5; cyl(0.015,0.02,0.22,PAL.woodD,0.15,0.1,0,g,5).rotation.z=0.7; },
  beanie(g){ const b=sph(0.17,PAL.red,0,0.06,0,g,12); b.scale.y=0.8; cyl(0.175,0.175,0.06,0xA8423E,0,-0.03,0,g,12); sph(0.05,PAL.white,0,0.21,0,g,7); },
  rangercap(g){ const dome=sph(0.17,PAL.ranger,0,0.03,0,g,12); dome.scale.y=0.62; rbox(0.26,0.03,0.2,0.012,PAL.ranger,0,0.005,0.2,g,{noshadow:true}); },
  peg(g){ box(0.05,0.16,0.04,PAL.red,0,0,0,g); box(0.05,0.07,0.045,0xC8C2B4,0,-0.05,0,g); },
  ski(g){ rbox(0.14,0.04,1.7,0.02,0x2FA8B5,0,0,0,g); rbox(0.12,0.06,0.3,0.02,PAL.dark,0,0.05,0.1,g); const tip=rbox(0.14,0.035,0.3,0.02,0x2FA8B5,0,0.06,-0.9,g); tip.rotation.x=0.5; },
  skipole(g){ cyl(0.02,0.02,1.15,PAL.metal,0,0,0,g,7); sph(0.045,PAL.dark,0,0.6,0,g,7); cyl(0.09,0.09,0.02,PAL.dark,0,-0.45,0,g,8); },
  walkpole(g){ cyl(0.018,0.022,1.2,0x8A4A3E,0,0,0,g,7); sph(0.05,0x6E5334,0,0.62,0,g,7); },
  muesli(g){ rbox(0.24,0.05,0.1,0.02,0xC99A34,0,0,0,g); box(0.25,0.052,0.02,PAL.red,0,0,0,g); },
  longSeal(g){ for(let i=0;i<11;i++){ const a=i*0.62, r=0.34-i*0.014;
    const b=rbox(0.3,0.055,0.075,0.026,PAL.rubber,Math.cos(a)*r,0.05+i*0.016,Math.sin(a)*r,g);
    b.rotation.y=-a+1.57; b.rotation.z=Math.sin(i*1.7)*0.1; } }, // a peeled seal coils
  goggles(g){ rbox(0.3,0.12,0.075,0.03,0x2E3238,0,0,0,g);
    const l=new THREE.Mesh(new THREE.PlaneGeometry(0.23,0.075),bmat(0xE38B2A)); l.position.set(0,0,0.042); g.add(l);
    rbox(0.33,0.045,0.03,0.014,0x8A3A2E,0,0.012,-0.05,g); },
  sock(g){ rbox(0.14,0.36,0.14,0.055,0xE4DCC6,0,0,0,g); rbox(0.25,0.14,0.14,0.055,0xE4DCC6,0.07,-0.15,0,g);
    box(0.15,0.05,0.15,0xC24A3A,0,0.15,0,g); box(0.15,0.05,0.15,0xC24A3A,0,0.07,0,g); }, // one big woolly tramping sock
  twine(g){ for(let i=0;i<8;i++){ const a=i*0.85, r=0.105;
    const b=cyl(0.015,0.015,0.2,0xD8CBA0,Math.cos(a)*r,0.015+i*0.012,Math.sin(a)*r,g,5);
    b.rotation.z=1.57; b.rotation.y=-a; } },                    // a chewed length of twine coils
  longSticker(g){ for(let i=0;i<5;i++){ const b=box(0.4,0.26,0.03,PAL.paper,-0.8+i*0.4,Math.sin(i*1.4)*0.04,0,g); b.rotation.y=Math.sin(i)*0.3; b.rotation.x=Math.sin(i*1.7)*0.15; } }
};

/* ---------- set pieces ---------- */
/* ---- THE HUT — REPLAT P6A ----
   The biggest body in the game and the one with the most attached to it, so the split is worth
   stating: the ENTRY is the building — walls, veranda, roof, chimney, the eave snow cap. The beam
   with its six bird spikes, the ladder, the tradie's toolbox and the three lead-head nails are
   SATELLITES placed off the entry's transform, because they are separate objects that happen to
   live against the hut and a hut GLB would not bring them.
   TWO COLLIDERS, BOTH DECLARED: the box the bird walks into and the ROOF wedge it slides down.
   `kind:'roof'` passes through verbatim, half-extents and all, because that is the shape
   groundHeightAt reads — and `slide:true, hut:true` are the flags the snow mission keys on, which
   is precisely the sort of thing that would be lost if a collider were ever derived from a mesh. */
defineProp('hut',{
  biome:'carpark', at:{x:-24,z:-9},
  collider:[{kind:'roof',w:4.0,d:3.05,ridge:4.05,slope:0.52,slide:true,hut:true},
            {kind:'box',w:7,d:5.4,top:2.6,solid:true}],
  anchors:{chimney:{x:2.4,y:4.9,z:-1.6}, door:{x:0,y:0.95,z:2.76},
           roof:{x:0,y:3.5,z:0}, snowcap:{x:0,y:3.0,z:2.4},
           beam:{x:0,y:3.35,z:3.4}, ladder:{x:3.2,y:0,z:3.0}, toolbox:{x:4.3,y:0.2,z:4.2}},
  material:{family:'weatherboard',nightTint:false},
  build(g,p){
  const wall=rbox(7,2.6,5.4,0.1,PAL.hut,0,1.3,0,g);
  /* THE FIVE FAKE WEATHERBOARD LINES ARE GONE — REPLAT P3. They were 20 mm slabs standing proud of
     the wall every 480 mm, standing in for a lap line. The scan has real ones, at the real
     spacing: dark_planks is a 2 m tile of overlapping boards, so a lap lands every ~140 mm, which
     is what a weatherboard actually is. Leaving both would have put a second, wrong, three-times-
     too-coarse set of lines on top of the right ones. Nothing else referenced them: no collider,
     no mission anchor, and 0x9E5442 had exactly one site in the file. */
  for(const cx of [-3.45,3.45])for(const cz of [-2.65,2.65]) rbox(0.16,2.6,0.16,0.05,0x8E4A3A,cx,1.3,cz,g,{noshadow:true});
  rbox(1.2,2.0,0.06,0.04,0x8E4A3A,0,1.0,2.74,g,{noshadow:true}); // door frame
  rbox(1.02,1.86,0.14,0.05,PAL.woodD,0,0.95,2.76,g); sph(0.045,PAL.metal,0.36,0.95,2.85,g,7); // door + knob
  rbox(1.4,0.16,0.7,0.05,0x9AA0A6,0,0.06,3.2,g); // step stone
  // veranda: deck, white posts, rail + LATTICE skirt (the reference house treatment)
  rbox(7.2,0.14,1.5,0.04,0x9C7B52,0,0.3,3.35,g);
  for(const px of [-3.3,-1.65,1.65,3.3]){ rbox(0.14,2.7,0.14,0.05,PAL.white,px,1.7,3.95,g);
    rbox(0.2,0.08,0.2,0.03,PAL.white,px,3.06,3.95,g); }
  rbox(7.0,0.09,0.09,0.03,PAL.white,0,1.24,3.98,g,{noshadow:true});
  for(let i=0;i<12;i++){ if(Math.abs(-3.1+i*0.56)<0.75)continue; rbox(0.06,0.5,0.06,0.02,PAL.white,-3.1+i*0.56,0.98,3.98,g,{noshadow:true}); }
  rbox(7.2,0.2,0.1,0.03,PAL.hutRoof,0,3.12,4.0,g); // veranda eave
  if(!HEADLESS){ const lcv=document.createElement('canvas'); lcv.width=256; lcv.height=64; const lg=lcv.getContext('2d');
    lg.fillStyle='#F6F5F0'; lg.fillRect(0,0,256,64); lg.strokeStyle='#D8D4C8'; lg.lineWidth=5;
    for(let k=-64;k<256;k+=22){ lg.beginPath(); lg.moveTo(k,64); lg.lineTo(k+64,0); lg.stroke();
      lg.beginPath(); lg.moveTo(k+64,64); lg.lineTo(k,0); lg.stroke(); }
    const ltx=new THREE.CanvasTexture(lcv); ltx.wrapS=THREE.RepeatWrapping; ltx.repeat.x=4;
    const skirt=new THREE.Mesh(new THREE.PlaneGeometry(7.0,0.28),new THREE.MeshStandardMaterial({map:ltx,roughness:0.9}));
    skirt.position.set(0,0.16,4.11); g.add(skirt); }
  for(const wx of [-2.2,2.2]){ rbox(1.42,1.22,0.06,0.05,0x8E4A3A,wx,1.6,2.72,g,{noshadow:true});
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.24,1.02),bmat(0xFFE2A8)); glow.position.set(wx,1.6,2.755); g.add(glow);
    box(0.05,1.02,0.02,0x8E4A3A,wx,1.6,2.76,g,{noshadow:true}); box(1.24,0.05,0.02,0x8E4A3A,wx,1.6,2.76,g,{noshadow:true}); }
  rbox(0.7,1.6,0.7,0.08,0x8C8F93,2.4,4.0,-1.6,g); rbox(0.86,0.12,0.86,0.04,PAL.dark,2.4,4.82,-1.6,g); // chimney
  { const _ch=new THREE.Object3D(); _ch.position.set(2.4,4.95,-1.6); g.add(_ch); G.chimneyRef=_ch; }
  // gable roof, ridge along x
  const rl=new THREE.Mesh(new THREE.BoxGeometry(7.8,0.18,3.6),mat(PAL.hutRoof));
  for(let ri=0;ri<12;ri++){ const rg=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,3.5,5),mat(0x4A545C));
    rg.rotation.x=Math.PI/2; rg.position.set(-3.45+ri*0.62,0.1,0); rl.add(rg); }
  rl.position.set(0,3.35,-1.45); rl.rotation.x=0.62; rl.castShadow=rl.receiveShadow=!HEADLESS; g.add(rl);
  const rr=rl.clone(); rr.position.z=1.45; rr.rotation.x=-0.62; g.add(rr);
  const cap=box(8,0.14,0.5,PAL.dark,0,3.98,0,g);
  // snow cap on the sunny-side eave over the door
  const sn=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.2,1.2),mat(PAL.snow)); sn.position.set(0,3.0,2.4); sn.rotation.x=-0.62; g.add(sn);
  for(const bx of [-0.8,0,0.85]){ const sb=sph(rnd(0.32,0.42),PAL.snow,bx,0.16,rnd(-0.1,0.1),sn,9); sb.scale.y=0.55; }
  sph(0.3,PAL.snowShade,0.4,0.1,0.3,sn,8).scale.y=0.5;
  G.snowCap={mesh:sn,hut:{x:g.position.x,z:g.position.z},loaded:true,reloadT:0};
  p.collide();
  },
});
function buildHut(){
  const P=placeProp('hut'), x=P.at.x, z=P.at.z;
  const A=n=>P.anchor(n);
  { const c=A('chimney'); addHint('q_chimney',c.x,c.y,c.z,4,'that chimney is begging to be stood on'); }
  { const r=A('roof');    addHint('snow',r.x,r.y,r.z,5,'the roof snow is loaded — peck it loose on somebody'); }
  // beam out front with bird spikes + ladder + tradie toolbox
  cyl(0.12,0.12,3.4,PAL.wood,x-4.6,1.7,z+3.4,null,8);
  cyl(0.12,0.12,3.4,PAL.wood,x+4.6,1.7,z+3.4,null,8);
  const beam=box(9.6,0.24,0.3,PAL.wood,x,3.35,z+3.4);
  addBoxCollider(x,z+3.4,9.6,0.35,3.5,false);
  for(let i=0;i<6;i++){
    const sx=x-3+i*1.2, sg=new THREE.Group(); sg.position.set(sx,3.52,z+3.4); G.scene.add(sg);
    PB.spike(sg);
    addTear({label:'RIP OFF SPIKES',need:1.3,mesh:sg,getPos:()=>({x:sx,y:3.5,z:z+3.4}),range:1.5,air:true,fx:'snapoff',
      owner:'dave',mission:'spikes',onDone(p){ award(15,'SPIKE: EVICTED',p); spawnLoose('spikes',PB.spike,p,{shiny:true,owner:'dave'}); noise(p,7,'misdeed','dave'); }});
  }
  const lad=new THREE.Group(); lad.position.set(x+3.2,0,z+3.0); lad.rotation.y=-0.25; G.scene.add(lad);
  for(let i=0;i<2;i++)box(0.09,3.6,0.09,PAL.metal,i?0.5:-0.5+1,1.8,0,lad,{noshadow:true});
  cyl(0.045,0.045,3.6,PAL.metal,-0.25,1.8,0,lad,6); cyl(0.045,0.045,3.6,PAL.metal,0.25,1.8,0,lad,6);
  for(let i=0;i<6;i++)box(0.5,0.05,0.05,PAL.metal,0,0.4+i*0.58,0,lad);
  G.ladder={x:x+3.2,z:z+3.0};
  box(0.7,0.4,0.45,PAL.red,x+4.3,0.2,z+4.2); addBoxCollider(x+4.3,z+4.2,0.7,0.45,0.4,true);
  propAt('pie',x+4.3,0.48,z+4.2,PB.pie,{food:true,owner:'dave',mission:'pie'});
  // lead-head nails on the roof edge (stash 'em sorted by size)
  for(let i=0;i<3;i++){ const nx=x-2+i*2, ng=new THREE.Group(); ng.position.set(nx,3.15,z+2.62); G.scene.add(ng); PB.nail(ng);
    addTear({label:'PULL NAIL',need:0.8,mesh:ng,getPos:()=>({x:nx,y:3.1,z:z+2.62}),range:1.3,air:true,owner:null,pull:'extract',
      onDone(p){ award(8,'NAIL NICKED',p); spawnLoose('nail',PB.nail,p,{shiny:true}); }});
  }
}

/* ---- THE PICNIC SET, THREE ENTRIES — REPLAT P6A ----
   P6 names "picnic set" as a hero prop, and it is three objects, not one: a table, a handbag on
   it and a chilly bin beside it. They get three entries because they will arrive as three files,
   they carry three different colliders and two of them carry mission anchors. The old builder drew
   all three plus a sandwich, which is exactly the "twenty call sites" shape this seam exists to
   undo — the sandwich is loose loot and stays a satellite.
   THE HANDBAG'S TRANSFORM IS ITS OWN, not an offset typed twice: its entry says (15.7, 0.95, -13.2)
   because that is where the bag is, and the peck anchor is the bag's own origin. */
defineProp('picnic_table',{
  biome:'carpark', at:{x:15,z:-13},
  collider:[{kind:'box',w:2.4,d:1.3,top:0.85,solid:true}],
  anchors:{top:{x:0,y:0.85,z:0},spread:{x:0,y:0.92,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    for(let i=0;i<3;i++) rbox(2.4,0.09,0.4,0.03,PAL.wood,0,0.78,-0.44+i*0.44,g);
    for(let i=0;i<6;i++) rbox(0.34,0.02,1.24,0.008,i%2?PAL.red:PAL.white,-0.9+i*0.36,0.845,0,g,{noshadow:true}); // gingham runner
    rbox(2.4,0.1,0.42,0.04,PAL.wood,0,0.46,-0.95,g); rbox(2.4,0.1,0.42,0.04,PAL.wood,0,0.46,0.95,g);
    rbox(0.14,0.8,1.1,0.05,PAL.woodD,-1,0.4,0,g); rbox(0.14,0.8,1.1,0.05,PAL.woodD,1,0.4,0,g);
  },
});
defineProp('handbag',{
  biome:'carpark', at:{x:15.7,y:0.95,z:-13.2},
  collider:[],
  anchors:{clasp:{x:0,y:0,z:0}},
  material:{family:null,nightTint:false},
  build(hb,p){
    rbox(0.5,0.34,0.3,0.09,PAL.plum,0,0,0,hb);
    const hbFlap=new THREE.Group(); hbFlap.position.set(0,0.16,-0.14); hb.add(hbFlap);
    rbox(0.46,0.05,0.3,0.02,0x8A5E82,0,0,0.14,hbFlap); sph(0.035,PAL.yellow,0,0.03,0.27,hbFlap,7);
    const strap=new THREE.Mesh(new THREE.TorusGeometry(0.16,0.025,6,12),mat(0x8A5E82)); strap.position.set(0,0.2,0); hb.add(strap);
    hb.userData.flap=hbFlap;
  },
});
defineProp('chilly_bin',{
  biome:'carpark', at:{x:12.6,z:-11.6},
  collider:[{kind:'box',w:0.9,d:0.6,top:0.72,solid:true}],
  anchors:{latch:{x:0,y:0.7,z:0},lid:{x:0,y:0.67,z:0}},
  material:{family:null,nightTint:false},
  build(cb,p){
    rbox(0.9,0.6,0.6,0.1,PAL.blue,0,0.3,0,cb); rbox(0.94,0.08,0.64,0.03,0x477BA8,0,0.56,0,cb,{noshadow:true});
    const lidG=new THREE.Group(); lidG.position.set(0,0.62,-0.32); cb.add(lidG);
    p.lid=rbox(0.96,0.14,0.66,0.05,PAL.white,0,0.05,0.32,lidG);
    rbox(0.3,0.06,0.12,0.025,PAL.dark,0,0.14,0.5,lidG); // handle
    p.lidG=lidG;
  },
});
function buildPicnic(){
  const T=placeProp('picnic_table'), x=T.at.x, z=T.at.z;
  addFoodSrc('picnic spread',x,z,2.4);        // TODO 21
  propAt('sandwich',x-0.6,0.92,z+0.15,PB.sandwich,{food:true,owner:'trish',snack:'sandwich'});
  // handbag: peck open, then passport + cash pop out
  const HB=placeProp('handbag'), hb=HB.group;
  addPeck({label:'PECK OPEN HANDBAG',needHits:2,mesh:hb,getPos:()=>HB.anchor('clasp'),range:1.4,owner:'trish',
    onDone(p){ AU.pop(); TW.add(0.4,u=>{hb.userData.flap.rotation.x=-1.7*u; hb.rotation.z=0.25*Math.sin(u*Math.PI);});
      spawnLoose('passport',PB.passport,{x:p.x-0.2,y:1.1,z:p.z},{shiny:true,owner:'trish',mission:'passport'});
      spawnLoose('cash ($1300)',PB.cash,{x:p.x+0.25,y:1.1,z:p.z+0.2},{shiny:true,owner:'trish'});
      award(15,'HANDBAG BREACHED',p);
    }});
  // chilly bin: two-kea job. latch tear only advances while a second kea holds the lid handle.
  const CB=placeProp('chilly_bin'), cb=CB.group, lid=CB.lid;
  G.chillyLidG=CB.lidG;
  addFoodSrc('chilly bin',CB.at.x,CB.at.z,1.8);   // TODO 21
  G.chilly={x:CB.at.x,z:CB.at.z,lid,open:false,
    latch:addTear({label:'TUG LATCH',coop:'HOLD LID',need:1.6,mesh:cb,getPos:()=>CB.anchor('latch'),range:1.5,owner:'trish',needsPartner:true,
      onDone(p){ G.chilly.open=true; AU.pop();
        TW.add(0.5,u=>{ G.chillyLidG.rotation.x=-2.0*Math.min(1,u*1.3)+Math.sin(u*Math.PI*2.5)*0.15*(1-u); });
        spawnLoose('pavlova',PB.pav,{x:p.x,y:0.9,z:p.z},{food:true,shiny:false,owner:'trish',mission:'pav'});
        award(40,'CHILLY BIN CRACKED',p); done('coop_bin');
      }})};
}

/* ---- THE SWAP DEMO PROP — REPLAT P6A ----
   P6A.md asks for ONE low-risk prop with no mission anchors, proved both ways, and this is it. The
   bench qualifies on every count the brief names: it is a discrete object a GLB would obviously
   replace, it carries a collider the bird stands on, it is in a biome the rig photographs, and
   NOTHING in the game attaches a mission to its geometry. The boots and the backpack sit BESIDE it
   and are placed off this entry's own transform, so they are satellites of the bench rather than
   parts of it — which is exactly the granularity the seam needs: the registry entry is the
   swappable BODY, never the builder function that happens to have drawn its neighbours too.
   ITS ANCHOR IS DECLARED EVEN THOUGH NOTHING READS IT. `seat` is where a bird lands on it, and it
   is here so the both-ways proof has an anchor to hold constant across a swap on a prop where an
   anchor moving could not break a mission. An anchor-free prop with a declared anchor is the safe
   place to prove the anchor contract. */
defineProp('bench',{
  biome:'carpark', at:{x:28,z:0},
  collider:[{kind:'box',w:1.9,d:0.6,top:0.62,solid:true}],
  anchors:{seat:{x:0,y:0.62,z:0}},
  material:{family:null,nightTint:false},
  build(h){
    for(let i=0;i<2;i++) rbox(1.9,0.075,0.26,0.03,PAL.wood,0,0.55,-0.14+i*0.28,h);
    rbox(0.12,0.55,0.5,0.04,PAL.woodD,-0.8,0.27,0,h); rbox(0.12,0.55,0.5,0.04,PAL.woodD,0.8,0.27,0,h);
    for(let i=0;i<2;i++) rbox(1.9,0.22,0.075,0.03,PAL.wood,0,0.82+i*0.28,-0.28,h);
  },
});
function buildBench(){
  const p=placeProp('bench'), x=p.at.x, z=p.at.z;
  propAt('boot',x-0.7,0.1,z+0.8,PB.boot,{owner:'tom'});
  propAt('boot',x-0.3,0.1,z+0.9,PB.boot,{owner:'tom'});
  // backpack: peck open -> gopro
  const bp=new THREE.Group(); bp.position.set(x+1.4,0.35,z+0.3); G.scene.add(bp);
  rbox(0.5,0.7,0.4,0.12,0x3E8272,0,0,0,bp);
  const bpFlap=new THREE.Group(); bpFlap.position.set(0,0.3,0.12); bp.add(bpFlap);
  rbox(0.42,0.24,0.16,0.06,0x2F6558,0,-0.1,0.1,bpFlap); sph(0.03,PAL.metal,0,-0.2,0.19,bpFlap,6);
  rbox(0.1,0.5,0.06,0.02,0x2F6558,-0.18,0,-0.22,bp,{noshadow:true}); rbox(0.1,0.5,0.06,0.02,0x2F6558,0.18,0,-0.22,bp,{noshadow:true});
  bp.userData.flap=bpFlap;
  addPeck({label:'PECK OPEN BACKPACK',needHits:2,mesh:bp,getPos:()=>({x:x+1.4,y:0.5,z:z+0.3}),range:1.4,owner:'tom',
    onDone(p){ AU.pop(); TW.add(0.4,u=>{bp.userData.flap.rotation.x=1.5*u; bp.rotation.x=0.2*Math.sin(u*Math.PI);});
      spawnLoose('GoPro',PB.gopro,{x:p.x,y:0.7,z:p.z+0.3},{shiny:true,owner:'tom'}); award(15,'BACKPACK RAIDED',p); }});
}

/* REPLAT P6A. THE CAMPFIRE IS NOT PART OF THE TENT and it never was — its meshes went straight to
   the scene, not into the tent's group. It is a satellite below, placed off this entry's transform,
   so swapping the tent for a model cannot take the fire with it. The two guy-lines are anchors
   because both are mission tears; the pegs are not, because nothing attaches to them. */
defineProp('tent',{
  biome:'carpark', at:{x:33,z:-8},
  collider:[{kind:'box',w:2,d:2,top:1.1,solid:true}],
  anchors:{guyA:{x:-1.28,y:0.4,z:0.48},guyB:{x:1.28,y:0.4,z:-0.48},peak:{x:0,y:1.52,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
  const t=new THREE.Mesh(new THREE.ConeGeometry(1.5,1.5,4),mat(0xE8946A)); t.position.y=0.75; t.rotation.y=Math.PI/4;
  t.castShadow=!HEADLESS; g.add(t); p.tentBody=t; hull(t,0.03);
  const dfl=new THREE.Mesh(new THREE.ConeGeometry(0.55,0.9,4),mat(0xD3805A)); dfl.position.set(0,0.46,0.72); dfl.rotation.y=Math.PI/4; g.add(dfl);
  sph(0.05,PAL.yellow,0,1.52,0,g,7); cyl(0.02,0.02,1.5,PAL.metal,0,0.75,0,g,5);
  for(const [px,pz] of [[-1.3,0.5],[1.3,-0.5],[-0.5,-1.3],[0.5,1.3]]) cyl(0.02,0.03,0.14,PAL.woodD,px,0.06,pz,g,5).rotation.z=0.3;
  },
});
function buildTent(){
  const P=placeProp('tent'), g=P.group, x=P.at.x, z=P.at.z, t=P.tentBody;
  const A=n=>P.anchor(n);
  G.tent={g,x,z,lines:2,down:false,body:t};
  { const fx=x+2.6, fz=z+1.8; // campfire by the tent
    for(let i=0;i<7;i++){ const a=i/7*Math.PI*2; const st=sph(0.11,0x7A7468,0,0,0,null,6); st.position.set(fx+Math.cos(a)*0.5,0.07,fz+Math.sin(a)*0.5); G.scene.add(st); }
    const l1=cyl(0.06,0.07,0.7,PAL.woodD,fx-0.1,0.12,fz,null,6); l1.rotation.z=1.35; G.scene.add(l1);
    const l2=cyl(0.06,0.07,0.7,PAL.woodD,fx+0.1,0.12,fz+0.05,null,6); l2.rotation.x=1.3; G.scene.add(l2);
    const flame=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.55,7),new THREE.MeshBasicMaterial({color:0xFFA13F,fog:false}));
    flame.position.set(fx,0.42,fz); flame.visible=false; G.scene.add(flame);
    const inner=new THREE.Mesh(new THREE.ConeGeometry(0.11,0.34,6),new THREE.MeshBasicMaterial({color:0xFFE08A,fog:false}));
    inner.position.set(fx,0.36,fz); inner.visible=false; G.scene.add(inner);
    const fl=new THREE.PointLight(0xFF9A3C,0,9,2); fl.position.set(fx,0.8,fz); G.scene.add(fl);
    G.fire={light:fl,flame,inner,x:fx,z:fz};
  }
  [[-1.6,0.6],[1.6,-0.6]].forEach((o,i)=>{
    const rope=cyl(0.02,0.02,1.4,PAL.paper,o[0]*0.8,0.35,o[1]*0.8,g,5); rope.rotation.z=o[0]>0?-1.1:1.1;
    addTear({label:'CHEW GUY-LINE',need:1.0,mesh:rope,getPos:()=>A(i?'guyB':'guyA'),range:1.4,owner:'tom',
      onDone(p){ G.tent.lines--;
        TW.add(0.3,u=>{rope.scale.x=1+Math.sin(u*Math.PI*4)*0.4*(1-u); rope.rotation.x=Math.sin(u*28)*0.5*(1-u);},()=>{rope.visible=false;}); // TWANG
        if(G.tent.lines<=0&&!G.tent.down){ G.tent.down=true; AU.whoosh();
          TW.add(0.7,u=>{ t.scale.y=lerp(1,0.2,u); t.position.y=lerp(0.75,0.17,u);
            t.rotation.z=Math.sin(u*Math.PI*3)*0.14*(1-u); t.scale.x=t.scale.z=1+Math.sin(u*Math.PI)*0.18; },
            ()=>{burst({x:x,y:0.4,z:z},0xE8946A,10);});
          award(35,'TENT DOWN',p); noise(p,9,'misdeed','tom'); }
        else award(10,'GUY-LINE CHEWED',p);
      }});
  });
}

/* REPLAT P6A. `lid` is the anchor the PECK BIN LID mission attaches to and `body` is the TIP THE
   BIN tear's — both were already literal offsets from the placement rather than points read off
   the mesh, which is why a model can be dropped in behind them without a mission noticing. */
defineProp('bin',{
  biome:'carpark', at:{x:7,z:-6},
  collider:[{kind:'box',w:0.95,d:0.95,top:1.2,solid:true}],
  anchors:{lid:{x:0,y:1.1,z:0},body:{x:0,y:0.7,z:0},mouth:{x:0,y:1.3,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    const body=cyl(0.45,0.4,1.1,PAL.green,0,0.55,0,g,14);
    for(const ry of [0.3,0.65,0.95]) { const rib=new THREE.Mesh(new THREE.TorusGeometry(0.44-((ry-0.3)*0.02),0.02,6,16),mat(0x4E8248)); rib.position.y=ry; rib.rotation.x=1.57; g.add(rib); }
    p.lid=cyl(0.5,0.5,0.1,PAL.dark,0,1.15,0,g,14);
    sph(0.06,PAL.dark,0,1.24,0,g,8);
    const peel=new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.44),bmat(0xE8E2D2)); peel.position.set(0,0.65,0.452); g.add(peel); // taped notice
    p.collide();
  },
});
function buildBin(){
  const P=placeProp('bin'), g=P.group, lid=P.lid, x=P.at.x, z=P.at.z;
  const A=n=>P.anchor(n);
  G.bin={g,lid,open:false,tipped:false,x,z};
  addPeck({label:'PECK BIN LID',needHits:3,mesh:g,getPos:()=>A('lid'),range:1.4,owner:'rex',
    onDone(p){ G.bin.open=true; AU.clang();
      TW.add(0.55,u=>{ lid.rotation.z=1.5*Math.min(1,u*1.4)+Math.sin(u*22)*0.12*(1-u); lid.position.x=0.62*u; lid.position.y=1.15-0.18*u+Math.sin(u*Math.PI)*0.35; });
      spawnLoose('shiny can',PB.can,{x:x+0.5,y:1.3,z:z+0.2},{shiny:true,mission:'can',vy:2.6});
      spawnLoose('rubbish',PB.rubbish,{x:x-0.45,y:1.25,z:z+0.4},{vy:3.1});
      spawnLoose('rubbish',PB.rubbish,{x:x+0.15,y:1.35,z:z-0.5},{vy:2.2});
      spawnLoose('rubbish',PB.rubbish,{x:x-0.2,y:1.2,z:z-0.15},{vy:2.9});
      burst({x,y:1.3,z},0xC8BFA8,10); burst({x,y:1.5,z},0x8A8F5A,7); AU.pop();
      spawnLoose('rubbish',PB.rubbish,{x:x-0.5,y:1.2,z:z-0.3},{}); spawnLoose('rubbish',PB.rubbish,{x:x+0.2,y:1.2,z:z-0.6},{});
      award(20,'BIN BREACHED',p); noise(p,8,'misdeed','rex');
    }});
  addTear({label:'TIP THE BIN',need:1.6,mesh:g,getPos:()=>A('body'),range:1.5,owner:'rex',locked:()=>!G.bin.open,
    onDone(p){ if(G.bin.tipped)return; G.bin.tipped=true; AU.clang();
      TW.add(0.6,u=>{ g.rotation.z=1.52*Math.min(1,u*1.25)+Math.sin(u*18)*0.1*(1-u); g.position.y=0.45*Math.min(1,u*1.3)*(1-u*0.0)+Math.sin(u*Math.PI)*0.12; g.position.y=Math.sin(Math.min(1,u*1.3)*Math.PI*0.5)*0.45; },
        ()=>{ burst({x:x,y:0.5,z:z},0xE2D8BE,8); spawnLoose('rubbish',PB.rubbish,{x:x+0.9,y:0.6,z:z+0.2},{}); });
      award(25,'FULL BIN FLIP',p); noise(p,10,'misdeed','rex'); }});
}

function drawKeaSil(c,cx,cy,sc,col){ // traced verbatim from the reference road sign (2026-08-28)
  const KP=[[-26.5,-55.0],[-14.3,-50.9],[-6.1,-42.8],[-2.0,-24.4],[14.3,-8.1],[28.5,20.4],[38.7,30.6],[42.8,40.7],[30.6,42.8],[20.4,38.7],[14.3,30.6],[10.2,30.6],[4.1,48.9],[6.1,50.9],[14.3,48.9],[14.3,50.9],[-10.2,55.0],[-10.2,53.0],[-2.0,53.0],[2.0,46.9],[0.0,38.7],[2.0,34.6],[-10.2,28.5],[-12.2,34.6],[-16.3,36.7],[-12.2,40.7],[-18.3,44.8],[-28.5,48.9],[-38.7,46.9],[-28.5,44.8],[-18.3,36.7],[-20.4,26.5],[-32.6,2.0],[-30.6,-32.6],[-38.7,-38.7],[-42.8,-32.6],[-42.8,-40.7],[-28.5,-53.0]];
  c.save(); c.translate(cx,cy); c.scale(sc,sc); c.fillStyle=col;
  c.beginPath(); c.moveTo(KP[0][0],KP[0][1]);
  for(let i=1;i<KP.length;i++)c.lineTo(KP[i][0],KP[i][1]);
  c.closePath(); c.fill(); c.restore();
}
/* ---- THE KEA-CROSSING DIAMOND — REPLAT P6A, AND THE ENTRY THAT IS PLACED FOUR TIMES ----
   Four of these go out per carpark, at coordinates that come from a SEEDED SHUFFLE, so their
   transform cannot be a declaration — it is decided at build time. This is why placeProp takes a
   per-placement `at` override: one registry row describes the OBJECT (its body, its absent
   collider, its material policy, its biome) and four placements say where the four of them are.
   The same override is what lets the nest be declared once and placed in two maps. */
/* ---- THE THREE CARPARK STRUCTURES THAT WERE NEVER EVEN A FUNCTION — REPLAT P6A ----
   The SW rope-tow shed, the trailhead's DOC board and the unattended pack were written inline
   inside buildCarpark, with their colliders pushed as raw literals a few lines under their
   geometry. They are exactly the case P6A.md opens with: nothing named them, so nothing could
   swap them, and a model arriving for any of the three would have meant reading forty lines of
   map to find out where its collider was. Now each is a row.
   THE RAW PUSHES BECOME DECLARED BOXES, and note the units: those three literals were HALF
   extents, because they went into G.colliders directly rather than through addBoxCollider. The
   entries state the full dimensions, which is the convention everywhere else in this file, and
   propCollider halves them on the way out. The collider digest is what proves the conversion. */
defineProp('sw_tow_shed',{
  biome:'carpark', at:{x:-40,z:-40},
  collider:[{kind:'box',w:3.4,d:2.6,top:2.0,solid:true}],
  anchors:{roof:{x:0,y:2.1,z:0}, wheel:{x:2.1,y:2.2,z:0}, rack:{x:-0.4,y:0.9,z:1.9}},
  material:{family:'corrugate',nightTint:false},
  build(base,p){
    box(3.2,2.0,2.4,0x4E6E8E,0,1.0,0,base);
    const shR=box(3.6,0.14,2.8,PAL.hutRoof,0,2.1,0,base); shR.rotation.z=0.06;
    p.collide();
  },
});
defineProp('doc_board',{
  biome:'carpark', at:{x:44,z:-40},
  collider:[{kind:'box',w:2.3,d:0.3,top:2.45,solid:true}],
  anchors:{face:{x:0,y:1.9,z:0.07}},
  material:{family:null,nightTint:false},
  build(sg,p){
    cyl(0.09,0.11,2.3,PAL.woodD,-0.9,1.15,0,sg,7); cyl(0.09,0.11,2.3,PAL.woodD,0.9,1.15,0,sg,7);
    box(2.2,1.1,0.09,0x2A5A3E,0,1.9,0,sg);
    p.collide();
  },
});
defineProp('trail_pack',{
  biome:'carpark', at:{x:41.4,z:-38.8},
  collider:[],
  anchors:{zip:{x:0,y:0.7,z:0}},
  material:{family:null,nightTint:false},
  build(pk,p){
    rbox(0.7,1.0,0.5,0.08,0x8E3A2E,0,0.5,0,pk); rbox(0.6,0.3,0.45,0.06,0x6E2A22,0,1.05,0,pk);
  },
});

/* ---- THE ROADWORKS PADDLE — REPLAT P6A ----
   The disc SPINS: the flip tween writes pad.rotation.y, so the disc has to stay a group of its own
   INSIDE the prop rather than becoming the prop's own group. That is the general shape for any
   prop with a moving part — the placement group is the object's pose in the world, and anything
   that animates hangs off it. `face` is the peck anchor and it is the disc's centre, which is
   where it has always been. */
defineProp('roadworks_paddle',{
  biome:'carpark', at:{x:7,z:29.0},
  collider:[],
  anchors:{face:{x:0,y:1.12,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
    cyl(0.035,0.04,1.05,PAL.metal,0,0.52,0,g,7);
    const pad=new THREE.Group(); pad.position.set(0,1.12,0); g.add(pad);
    const disc=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.035,18),mat(PAL.bad));
    disc.rotation.x=1.57; pad.add(disc);
    const back=new THREE.Mesh(new THREE.CircleGeometry(0.275,18),bmat(PAL.green));
    back.position.z=-0.024; back.rotation.y=Math.PI; pad.add(back);
    p.pad=pad;
  },
});
defineProp('keasign',{
  biome:'carpark', at:{x:0,z:0},
  collider:[],
  anchors:{plate:{x:0,y:2.25,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){ mkKeaSignBody(g,p); },
});
function mkKeaSign(x,z,ry){ return placeProp('keasign',{at:{x,z,ry:ry||0}}).group; }
function mkKeaSignBody(g,P){
  cyl(0.05,0.06,2.3,PAL.metal,0,1.15,0,g,8);
  if(HEADLESS){ const d=rbox(0.95,0.95,0.05,0.03,PAL.yellow,0,2.25,0,g,{noshadow:true}); d.rotation.z=Math.PI/4;
    rbox(0.85,0.34,0.05,0.02,PAL.yellow,0,1.45,0,g,{noshadow:true}); return; }
  const cv=document.createElement('canvas'); cv.width=cv.height=256; const c=cv.getContext('2d');
  c.clearRect(0,0,256,256);
  c.save(); c.translate(128,128); c.rotate(Math.PI/4);
  const half=176/2; c.fillStyle='#F2B705'; c.fillRect(-half,-half,176,176);
  c.lineWidth=9; c.strokeStyle='#1E1B14'; c.strokeRect(-half+7,-half+7,162,162); c.restore();
  drawKeaSil(c,128,130,1.12,'#1E1B14');
  const tx=new THREE.CanvasTexture(cv); tx.colorSpace=THREE.SRGBColorSpace;
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(1.34,1.34),
    new THREE.MeshLambertMaterial({map:tx,transparent:true,side:THREE.DoubleSide}));
  plate.position.set(0,2.25,0.03); g.add(plate);
  const c2v=document.createElement('canvas'); c2v.width=256; c2v.height=96; const c2=c2v.getContext('2d');
  c2.fillStyle='#F2B705'; c2.fillRect(0,0,256,96); c2.lineWidth=8; c2.strokeStyle='#1E1B14'; c2.strokeRect(5,5,246,86);
  c2.fillStyle='#1E1B14'; c2.textAlign='center'; c2.font='bold 34px Fredoka, sans-serif';
  c2.fillText('CAUTION',128,40); c2.fillText('NEXT 5 km',128,78);
  const sub=new THREE.Mesh(new THREE.PlaneGeometry(0.88,0.33),
    new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c2v),side:THREE.DoubleSide}));
  sub.position.set(0,1.42,0.03); g.add(sub);
}
/* REPLAT P6A. The DON'T FEED THE KEA sign carries NO collider — it never had one — and that
   absence is now declared rather than merely absent from a builder, so a model arriving with a
   fat trunk cannot quietly grow one. Its text is a per-entry knob because the panel is drawn, not
   modelled; a GLB replacing this prop would bring its own and `keepModelPBR` says so. */
defineProp('sign_dontfeed',{
  biome:'carpark', at:{x:2,z:24.5},
  collider:[],
  anchors:{panel:{x:0,y:1.6,z:0},face:{x:0,y:1.9,z:0.05}},
  material:{family:null,nightTint:false},
  build(g,p){ buildSignBody(g,p,"DON'T FEED\nTHE KEA"); },
});
function buildSign(){
  const P=placeProp('sign_dontfeed'), g=P.group, x=P.at.x, z=P.at.z;
  const A=n=>P.anchor(n);
  G.signG=g;
  addTear({label:'TEAR DOWN SIGN',need:3.0,mesh:g,getPos:()=>A('panel'),range:1.6,owner:'rex',mission:'sign',wobble:true,
    keepMesh:true,
    onDone(p){ AU.whoosh();
      TW.add(0.8,u=>{ const f=Math.min(1,u*1.15); g.rotation.x=1.52*f*f + Math.sin(Math.max(0,u-0.7)*30)*0.06*(1-u);
        g.position.y=-0.35*f; },
        ()=>{ AU.clang(); burst({x:x,y:0.3,z:z+1.6},0xC8BFA8,10); G.shake=Math.max(G.shake||0,0.25); });
      award(50,'SIGN? WHAT SIGN?',p); noise(p,12,'misdeed','rex'); done('sign'); }});
}
function buildSignBody(g,P,text){
  cyl(0.07,0.075,1.7,PAL.metal,0,0.85,0,g,10);
  cyl(0.1,0.12,0.06,PAL.metal,0,0.03,0,g,10);
  const panel=rbox(1.7,1.0,0.08,0.05,PAL.paper,0,1.9,0,g);
  for(const bx of [-0.72,0.72])for(const by of [1.48,2.32]) sph(0.028,PAL.metal,bx,by,0.05,g,6);
  if(!HEADLESS){
    const cv=document.createElement('canvas'); cv.width=340; cv.height=200; const cx=cv.getContext('2d');
    cx.fillStyle='#EFE7CC'; cx.fillRect(0,0,340,200); cx.strokeStyle='#7A2020'; cx.lineWidth=10; cx.strokeRect(6,6,328,188);
    cx.fillStyle='#7A2020'; cx.font='bold 38px Fredoka, sans-serif'; cx.textAlign='center';
    const lines=text.split('\n');
    lines.forEach((ln,i)=>cx.fillText(ln,170,(lines.length>1?52:118)+i*44));
    drawKeaSil(cx,178,148,0.72,'#2A2118'); // the culprit, traced from the real sign
    const plate=new THREE.Mesh(new THREE.PlaneGeometry(1.58,0.9),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(cv)}));
    plate.position.set(0,1.9,0.046); g.add(plate);
  }
  P.collide();
}

/* REPLAT P6A. `tarp` is the coop TUG TARP anchor; `bed` is where the freed loot lands. The tarp
   MESH is still handed to the tear as its wobble target, and that is deliberate: a mesh is what
   the animation moves, an anchor is what the mission measures from, and the seam only guarantees
   the second. A model swap that brought no tarp mesh would lose the wobble and keep the mission,
   which is the right way round. */
defineProp('trailer',{
  biome:'carpark', at:{x:-14,z:20},
  collider:[{kind:'box',w:2.6,d:1.6,top:1.1,solid:true}],
  anchors:{tarp:{x:0,y:1.0,z:0},bed:{x:0,y:1.1,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
  rbox(2.6,0.5,1.6,0.08,0x596068,0,0.55,0,g);
  for(const rx of [-1.32,1.32]) rbox(0.06,0.34,1.6,0.02,PAL.metal,rx,0.85,0,g,{noshadow:true});
  rbox(1.0,0.08,0.08,0.03,PAL.metal,-1.75,0.5,0,g,{noshadow:true}); cyl(0.14,0.14,0.1,PAL.rubber,-2.2,0.24,0,g,10).rotation.x=1.57; // drawbar + jockey wheel
  for(const [wx,wz] of [[-0.9,0.95],[0.9,0.95],[-0.9,-0.95],[0.9,-0.95]]){ cyl(0.3,0.3,0.2,PAL.rubber,wx,0.3,wz,g,12).rotation.x=1.57; cyl(0.13,0.13,0.22,PAL.metal,wx,0.3,wz,g,9).rotation.x=1.57; }
  const tarp=rbox(2.8,0.34,1.8,0.14,PAL.teal,0,0.95,0,g); tarp.scale.y=0.6;
  for(const sz of [-0.55,0.55]) { const st=rbox(0.08,0.42,1.86,0.02,0xD3A34E,sz*2,0.94,0,tarp?g:g,{noshadow:true}); st.position.set(sz*1.8,0.94,0); tarp.userData.straps=tarp.userData.straps||[]; tarp.userData.straps.push(st); }
  blob(g,1.8,0.5);
  p.tarp=tarp;
  p.collide();
  },
});
function buildTrailer(){
  const P=placeProp('trailer'), g=P.group, tarp=P.tarp, x=P.at.x, z=P.at.z;
  const A=n=>P.anchor(n);
  G.tarp=addTear({label:'TUG TARP',coop:'BOTH KEAS MUST TUG',need:2.4,mesh:tarp,getPos:()=>A('tarp'),range:2.1,owner:null,needsBoth:true,mission:'tarp',
    keepMesh:true,
    onDone(p){ AU.whoosh(); AU.rip();
      (tarp.userData.straps||[]).forEach(st=>st.visible=false);
      TW.add(0.7,u=>{ tarp.position.z=2.4*u; tarp.rotation.x=1.3*u; tarp.position.y=0.95+Math.sin(u*Math.PI)*0.9; },
        ()=>{ tarp.visible=false; burst({x:x,y:0.8,z:z+2.2},0x62A0A8,10); });
      spawnLoose('spanner',PB.keys,{x:x-0.5,y:1.0,z:z},{shiny:true});
      spawnLoose('shiny can',PB.can,{x:x+0.5,y:1.1,z:z+0.3},{shiny:true,vy:2.6});
      spawnLoose('rubbish',PB.rubbish,{x:x-0.4,y:1.1,z:z+0.35},{vy:3.0});
      spawnLoose('rubbish',PB.rubbish,{x:x+0.1,y:1.2,z:z-0.45},{vy:2.3});
      burst({x,y:1.2,z},0xC8BFA8,10); AU.pop();
      award(60,'THE BIG PULL',p); done('tarp'); }});
}

/* ---- THE NEST KNOLL — REPLAT P6A ----
   BOTH BIOMES PLACE IT, at coordinates the MAP owns (TODO 39), so this is the entry whose `at` is
   always overridden at the call site. That is what the per-placement override on placeProp is for
   and this is the prop that needed it: one declaration, two maps, two positions. `cup` is the
   anchor the finale and the bank check read as G.nestY — declared here so a nest model has one
   number to hit.
   Its collider is NOT solid: you walk onto a knoll, you do not walk into it. */
defineProp('nest',{
  biome:'*', at:{x:-4,z:-33},
  collider:[{kind:'box',w:4.6,d:4.6,top:1.0,solid:false}],
  anchors:{cup:{x:0,y:1.1,z:0}},
  material:{family:null,nightTint:false},
  build(g,p){
  const knoll=sph(3.2,PAL.rock,0,-1.4,0,g,12); knoll.scale.y=0.75;
  const moss=sph(3.0,PAL.mint,0,-1.15,0,g,12); moss.scale.y=0.62;
  /* the five cone tufts on the knoll went with the rest of the old grass at P4b. THIS ONE WAS NOT
     HEADLESS-GUARDED, so unlike the other two it DOES move the seeded stream — which is why it is
     called out here rather than quietly removed: everything built after buildNest lands somewhere
     slightly different, and that is a deliberate, recorded cost of "remove it entirely". */
  p.collide();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.85,0.22,7,14),mat(PAL.woodD));
  ring.position.y=1.05; ring.rotation.x=1.57; ring.castShadow=!HEADLESS; g.add(ring);
  for(let i=0;i<7;i++){ const tw=cyl(0.03,0.03,rnd(0.6,1),PAL.wood,rnd(-0.7,0.7),1.05,rnd(-0.7,0.7),g,5); tw.rotation.set(1.57,0,rnd(0,3)); }
  for(const [ex,ez] of [[-0.22,0.1],[0.2,-0.15]]){ const egg=sph(0.11,0xF6EFE0,ex,1.12,ez,g,9); egg.scale.y=1.25; }
  sph(0.05,PAL.keaOrange,0.4,1.08,0.3,g,6).scale.set(1,0.3,2); // stray feather
  },
});
function buildNest(x,z){
  const P=placeProp('nest',{at:{x,z}});
  G.nestG=P.group; G.nestY=P.entry.anchors.cup.y;
}

/* ---- THE PADDOCK: FENCE AND GATE, TWO ENTRIES — REPLAT P6A ----
   They are two objects because the gate SWINGS and the fence does not, and a swap has to respect
   that: the gate's group is what the twine tween rotates, so a gate model inherits the swing for
   free while a fence model cannot accidentally acquire it. The two hang posts stay with the fence
   below — they are fence posts that a gate happens to hang on, they do not swing, and a gate GLB
   would not bring them.
   BOTH POSITIONS ARE DECLARED ABSOLUTELY, even though the gate's has always been derived from the
   pen's (x-4.2, z-3). A registry entry that has to be read together with another entry's
   arithmetic to find out where its object is would defeat the point of writing it down.
   THE TWINE ANCHOR BELONGS TO THE FENCE, NOT THE GATE, and that is the whole reason to be careful
   here: the chew target is a fixed point in the world, and hanging it off the gate would have made
   it swing away from the bird as the gate opened. */
defineProp('sheep_pen',{
  biome:'carpark', at:{x:-38,z:4},
  collider:[],
  anchors:{centre:{x:0,y:0.5,z:0}, twine:{x:-4.2,y:0.7,z:2.86}},
  material:{family:null,nightTint:false},
  build(g,p){
    /* the fence is drawn in WORLD coordinates off the placement, unchanged, because every rail's
       run-off test (`px+1.35>x+4`) is written in them and rewriting it in local space would be a
       silent chance to move a rail. The meshes land in this group all the same. */
    const x=p.at.x, z=p.at.z;
    for(let i=0;i<4;i++){ const px=x-4+i*2.7;
      cyl(0.06,0.06,0.9,PAL.woodD,px-x,0.45,-3,g,6); cyl(0.06,0.06,0.9,PAL.woodD,px-x,0.45,3,g,6);
      box(2.7,0.08,0.08,PAL.wood,(px+1.35>x+4?px:px+1.35)-x,0.7,-3,g); box(2.7,0.08,0.08,PAL.wood,(px+1.35>x+4?px:px+1.35)-x,0.7,3,g); }
  },
});
defineProp('pen_gate',{
  biome:'carpark', at:{x:-42.2,z:1},
  collider:[],
  anchors:{hinge:{x:0,y:0.66,z:0}},
  material:{family:null,nightTint:false},
  build(gate,p){
    for(let i=0;i<3;i++) box(0.07,0.07,5.7,PAL.wood,0,0.36+i*0.3,2.85,gate);
    { const br=box(0.06,1.15,0.06,PAL.wood,0,0.66,2.85,gate); br.rotation.x=1.1; } // the brace
  },
});
function buildSheepPen(){
  const P=placeProp('sheep_pen');
  buildSheepPenRest(P.at.x,P.at.z,P);
}
function buildSheepPenRest(x,z,P){
  for(let i=0;i<3;i++){ const s=new THREE.Group(); s.position.set(x+rnd(-3,3),0,z+rnd(-2,2)); G.scene.add(s);
    const body=sph(0.55,PAL.white,0,0.62,0,s,10); body.scale.set(1,0.85,1.3); hull(body,0.04);
    sph(0.34,0xEDEBE2,0.2,0.86,0.3,s,8); sph(0.3,0xEDEBE2,-0.24,0.8,-0.3,s,8); sph(0.28,0xEDEBE2,0.1,0.9,-0.45,s,8);
    const face=sph(0.24,0x4A4642,0,0.76,0.66,s,9); face.scale.z=1.15;
    for(const ex of [-1,1]){ const ear=sph(0.09,0x4A4642,ex*0.22,0.9,0.58,s,6); ear.scale.set(1.4,0.5,0.8); }
    sph(0.16,PAL.white,0,1.0,0.5,s,7); // forelock
    for(const [lx,lz] of [[-0.25,0.3],[0.25,0.3],[-0.25,-0.35],[0.25,-0.35]]) cyl(0.055,0.06,0.5,0x4A4642,lx,0.25,lz,s,6);
    blob(s,0.8,0.5);
    G.sheep.push({g:s,x:s.position.x,z:s.position.z,home:{x,z},panic:0,calmT:0,ry:rnd(0,6)});
  }
  { // the gate, hung shut with baling twine, the way every farm gate in the country is
    const gx=x-4.2;
    cyl(0.075,0.085,1.2,PAL.woodD,gx,0.6,z-3,null,7); cyl(0.075,0.085,1.2,PAL.woodD,gx,0.6,z+3,null,7);
    const gate=placeProp('pen_gate').group;
    const twine=new THREE.Group(); twine.position.set(gx,0.67,z+2.86); G.scene.add(twine);
    for(let i=0;i<3;i++){ const w=cyl(0.028,0.028,0.44,0xD8CBA0,0,i*0.055-0.055,0,twine,6); w.rotation.x=1.57; }
    G.penGate=gate;
    addTear({label:'CHEW THE BALING TWINE',need:1.4,range:1.35,air:true,keepMesh:true,
      getPos:()=>P.anchor('twine'),
      onDone(p){ award(30,'TWINE: CHEWED. THE GATE IS A SUGGESTION NOW.',p); done('q_twine');
        AU.rip(); burst(p,0xD8CBA0,7); twine.visible=false;
        spawnLoose('length of twine',PB.twine,{x:gx-0.5,y:0.5,z:z+2.5},{});
        TW.add(1.6,u=>{ gate.rotation.y=-u*1.2; });
        for(const sh of G.sheep) sh.panic=Math.max(sh.panic,3);
        noise({x:gx,y:0.8,z},7,'misdeed',null); }});
  }
  G.pen={x,z,w:4.5,d:2.6};
  addHint('q_muster',x,0.5,z,7,'these sheep look very herdable — push one all the way to the road');
  addHint('paddock',x,0.5,z,7,'a furious chasing driver would fit right in here');
}

function buildConeStack(x,z){
  for(let i=0;i<4;i++) spawnLoose('road cone',PB.cone,{x:x+(i%2)*0.9,y:0.02,z:z+Math.floor(i/2)*0.9},{heavy:true,owner:'rex',cone:true});
}

function spawnLoose(name,builder,p,opts){
  const pr=propAt(name,p.x,p.y,p.z,builder,opts);
  pr.vy=rnd(1.4,2.4); pr.vx=rnd(-1.2,1.2); pr.vz=rnd(-1.2,1.2);
  pr.rvx=rnd(-7,7); pr.rvy=rnd(-9,9); return pr;
}

/* ---------- vehicles ---------- */
/* ---- THE FOUR PARKED CARS ARE REGISTRY ENTRIES; TRAFFIC IS NOT — REPLAT P6A ----
   mkCar has two callers with opposite lifetimes. The four in the bays are WORLD props: they are
   there when the map is built, they never move, and they are exactly what P6 means by "cars". The
   traffic is SPAWNED mid-run, despawned at the far end of the road, and a registry entry for a
   thing that does not exist at build time would be a lie. So mkCar becomes the shared BODY and
   `carEntry` declares one registry row per bay; spawnTraffic keeps calling mkCar directly.
   THE COLLIDER STOPS BEING READ BACK OFF THE ARRAY. `car.collider=G.colliders[G.colliders.length-1]`
   worked only because addBoxCollider had just pushed it; the placement hands back its own colliders
   by identity, which is both clearer and immune to anything else pushing in between. */
function carEntry(id,x,z,ry,color,type){
  return defineProp(id,{
    biome:'carpark', at:{x,z,ry},
    collider:[{kind:'box',w:2.2,d:4.3,top:1.35,solid:true}],
    /* the two wiper roots and the aerial root, in the car's own frame — the anchors the RIP WIPER
       and SNAP AERIAL missions have always measured from, named at last. `wsz` is the windscreen
       set-back, which differs between a hatch and a ute. */
    anchors:{wiperL:{x:-0.45,y:0.92,z:type==='ute'?0.35:0.85},
             wiperR:{x: 0.45,y:0.92,z:type==='ute'?0.35:0.85},
             aerial:{x:0.8,y:1.35,z:-1.3},
             roof  :{x:0,y:1.42,z:type==='ute'?-0.7:-0.2}},
    material:{family:null,nightTint:false},
    build(g,p){ p.car=mkCarBody(g,p,color,type); },
  });
}
function mkCar(x,z,ry,color,type){
  const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=ry; G.scene.add(g);
  const car=mkCarBody(g,null,color,type);
  car.x=x; car.z=z; car.ry=ry;
  addBoxCollider(x,z,2.2,4.3,1.35,true); car.collider=G.colliders[G.colliders.length-1];
  mkCarTears(g,car);
  return car;
}
function mkCarBody(g,P,color,type){
  const car={g,x:g.position.x,z:g.position.z,ry:g.rotation.y,type,parked:true,speed:0,dir:1,stopped:false,stopT:0,driverOut:false,honkT:0,wipers:[]};
  const bodyG=car.bodyG=new THREE.Group(); g.add(bodyG);
  const shell=rbox(2.0,0.55,4.2,0.16,color,0,0.56,0,bodyG); hull(shell,0.03);
  const cabZ=type==='ute'?-0.7:-0.2;
  const cab=rbox(1.76,0.66,2.1,0.24,color,0,1.06,cabZ,bodyG);
  pane(1.68,0.46,1.98,0.16,PAL.glass,0,1.12,cabZ,bodyG);
  pane(1.5,0.4,0.06,0.1,PAL.glass,0,0.98,cabZ+1.02,bodyG); // windscreen
  if(type==='ute'){ rbox(1.9,0.34,1.7,0.08,color,0,0.66,1.15,bodyG); rbox(1.86,0.06,0.06,0.02,PAL.metal,0,0.9,0.35,bodyG,{noshadow:true}); }
  rbox(2.04,0.16,0.3,0.06,PAL.white,0,0.4,-2.08,bodyG,{noshadow:true}); rbox(2.04,0.16,0.3,0.06,PAL.white,0,0.4,2.08,bodyG,{noshadow:true}); // bumpers
  sph(0.085,PAL.sun,-0.65,0.62,-2.12,bodyG,8); sph(0.085,PAL.sun,0.65,0.62,-2.12,bodyG,8);
  sph(0.065,PAL.red,-0.65,0.6,2.12,bodyG,8); sph(0.065,PAL.red,0.65,0.6,2.12,bodyG,8);
  rbox(0.5,0.05,1.4,0.02,PAL.dark,0,1.42,cabZ,bodyG,{noshadow:true}); // roof rail
  for(const [wx,wz] of [[-1,1.4],[1,1.4],[-1,-1.4],[1,-1.4]]){
    const arch=cyl(0.42,0.42,0.03,0x22262B,wx*0.92,0.42,wz,g,14); arch.rotation.z=1.57; // shadowed wheel well
    const w=cyl(0.34,0.34,0.24,PAL.rubber,wx,0.34,wz,g,12); w.rotation.z=1.57;
    rbox(0.10,0.30,0.98,0.05,0xDDD6C8,wx*1.02,0.58,wz,g,{noshadow:true}); // wheel arch eyebrow
    const hub=cyl(0.16,0.16,0.26,PAL.metal,wx,0.34,wz,g,10); hub.rotation.z=1.57;
  }
  blob(g,1.9,0.55).position.z=0;
  if(P){ P.collide(); car.collider=P.colliders[0]; }
  return car;
}
function mkCarTears(g,car){
  // wipers ×2 at windscreen base
  const wsz=car.type==='ute'?0.35:0.85;
  for(let i=0;i<2;i++){
    const wg=new THREE.Group(); wg.position.set(-0.45+i*0.9,0.92,wsz); wg.rotation.z=0.5; g.add(wg); PB.wiper(wg);
    const t=addTear({label:'RIP WIPER',need:1.4,mesh:wg,car,owner:'driver',mission:'wiper',range:1.6,air:true,fx:'snapoff',
      getPos:()=>{const v=new THREE.Vector3();wg.getWorldPosition(v);return v;},
      onDone(p){ G.stats.wipers++; spawnLoose('wiper',PB.wiper,p,{owner:null});
        award(20,pick(['WIPER: LIBERATED','STRING CHEESE','SQUEAK NO MORE']),p); noise(p,8,'misdeed',car.humanOwner||null,car); }});
    car.wipers.push(t);
  }
  // aerial on rear
  const ag=new THREE.Group(); ag.position.set(0.8,1.35,-1.3); g.add(ag); cyl(0.02,0.03,0.8,PAL.metal,0,0.4,0,ag,6);
  addTear({label:'SNAP AERIAL',need:1.2,mesh:ag,car,owner:'driver',range:1.6,air:true,fx:'snapoff',
    getPos:()=>{const v=new THREE.Vector3();ag.getWorldPosition(v);v.y+=0.3;return v;},bendy:ag,
    onDone(p){ spawnLoose('aerial',PB.aerial,p,{shiny:true}); award(15,'AERIAL: SNAPPED',p); noise(p,7,'misdeed',null,car); }});
  return car;
}
/* THE PARKED FOUR. Colour and body style are declaration, not argument — a bay is a registry row. */
carEntry('car_red',   -9,  16.4,0,PAL.red,   'hatch');
carEntry('car_blue',  -2.4,16.4,0,PAL.blue,  'hatch');
carEntry('car_white',  4.2,16.4,0,PAL.white, 'ute');
carEntry('car_yellow',10.8,16.4,0,PAL.yellow,'hatch');
function placeCar(id){
  const P=placeProp(id), car=P.car;
  mkCarTears(P.group,car);
  return car;
}

/* ---- THE CAMPERVAN — REPLAT P6A, AND THE HIGHEST-RISK ENTRY IN THE PIECE ----
   The door seal is the canary that has caught more regressions than any other check in this
   gauntlet, and it lives on this prop. It is safe across a swap for the reason every anchor here
   is: the twelve-step bead path is drawn in the PLACEMENT'S OWN FRAME and always was — one wall-
   normal x, a run of y and z — so it is a fact about where the van is, not about which mesh is
   standing there. What a model WOULD have to bring is the door geometry the bead is drawn against,
   and `door`/`step`/`wall` are declared here so that a future entry can say where they must land.
   THE DRAWBAR COLLIDER STOPS BEING TRIGONOMETRY AT THE CALL SITE. It was
   addBoxCollider(x+Math.sin(0.2)*3.4, z+Math.cos(0.2)*3.4, ..., 0.2) — the van's own yaw written
   out by hand in two places. In the entry it is simply local z 3.4, and the placement rotates it. */
defineProp('campervan',{
  biome:'carpark', at:{x:-11,z:8,ry:0.2},
  collider:[{kind:'box',w:2.8,d:5.8,top:2.5,solid:true},
            {kind:'box',x:0,z:3.4,w:0.9,d:1.5,top:0.6,solid:true}],   // the drawbar
  anchors:{door :{x:1.50,y:1.02,z:0.6},      // the door centre, in the wall plane the bead runs in
           step :{x:1.61,y:0.28,z:0.6},
           roof :{x:0,y:2.5,z:0},
           mirrorL:{x:-1.3,y:1.8,z:-2.6}, mirrorR:{x:1.3,y:1.8,z:-2.6},
           drawbar:{x:0,y:0.46,z:3.92}},
  material:{family:null,nightTint:false},
  build(g,p){ p.van=mkCampervanBody(g,p); },
});
function mkCampervan(){
  const P=placeProp('campervan'), g=P.group, x=P.at.x, z=P.at.z;
  G.vanTop={x,z,top:2.5,w:1.2,d:2.7};
  // Registered the way G.wear and G.stones are: a data record with the meshes on it, so the gate
  // can read the door orientation off the scene instead of a reader projecting it out of dims.
  G.vanDoor=Object.assign({axis:'x',wallAt:1.47,cz:0.6,cy:1.02,group:g},P.doorParts);
  // door rubber seal — worked off bit by bit with the beak, comes away intact
  { const pth=[]; // beading around the REORIENTED frame edges: up the handle edge, across the head, down the hinge edge
    // The path was ALREADY drawn in the wall plane (one x, varying y and z) - it was the slabs that
    // were turned the wrong way, and the bead was left hanging in space beside them. Now it hugs
    // the door it seals: the door edge sits at z 0.12 and z 1.08, y 0.2625..1.7775, so the bead
    // runs that seam at z 0.12 / 1.08 and y 0.27..1.77. It rides out to x 1.50 with the frame,
    // which puts it BETWEEN the frame face (1.495) and the door face (1.516) - a seam bead - and
    // 0.255 further from the van than before, so the tear reach (range 1.7) only gets easier.
    // Segment counts 5 + 3 + 4 are held deliberately: N = path.length-1 = 12 steps (FLAKES law 10).
    for(let i=0;i<=5;i++)pth.push({x:1.50,y:0.27+i*0.30,z:0.12});
    for(let i=1;i<=3;i++)pth.push({x:1.50,y:1.77,z:0.12+i*0.32});
    for(let i=1;i<=4;i++)pth.push({x:1.50,y:1.77-i*0.375,z:1.08});
    addStrip({group:g,path:pth,thick:{x:0.05,y:0.055,z:0.055},color:0x1A1D20,
      label:'WORK THE DOOR SEAL',need:0.55,range:1.7,owner:'trish',mission:'seal',
      propName:'door seal',propBuilder:PB.longSeal,points:45,doneText:'THE WHOLE SEAL. INTACT.',noiseAmt:9});
  }
  // wing mirrors ×2
  for(const s of [-1,1]){ const mg=new THREE.Group(); mg.position.set(s*1.3,1.8,-2.6); g.add(mg); PB.mirror(mg);
    addTear({label:'RIP MIRROR',need:1.6,mesh:mg,owner:'trish',range:1.6,air:true,fx:'snapoff',
      getPos:()=>{const v=new THREE.Vector3();mg.getWorldPosition(v);return v;},
      onDone(p){ spawnLoose('wing mirror',PB.mirror,p,{shiny:true,owner:'trish'}); award(20,'MIRROR, MIRROR, GONE',p); noise(p,8,'misdeed','trish'); }});
  }
  return {g,x,z,parked:true,van:true};
}
function mkCampervanBody(g,P){
  const shell=rbox(2.4,2.1,5.6,0.3,PAL.white,0,1.35,0,g); hull(shell,0.02);
  rbox(2.56,0.6,5.7,0.2,0,0,0.85,0,g,{noshadow:true,mats:mat(0x1E2226)}); // Crusader black skirt
  rbox(2.56,0.12,5.7,0.05,0,0,1.22,0,g,{noshadow:true,mats:mat(0x7BC043)}); // green accent stripe
  rbox(2.565,0.05,5.7,0.02,0,0,1.33,0,g,{noshadow:true,mats:mat(0x2A2E33)}); // charcoal pinline
  for(const wz of [-1.5,-0.3,1.8]){ rbox(0.06,0.7,0.9,0.04,0x3A4046,1.225,1.72,wz,g,{noshadow:true});
    pane(0.05,0.56,0.76,0.03,0x9FB8C4,1.25,1.72,wz,g); }
  for(const wz of [-1.3,0.3,1.7]){ rbox(0.06,0.7,0.9,0.04,0x3A4046,-1.225,1.72,wz,g,{noshadow:true});
    pane(0.05,0.56,0.76,0.03,0x9FB8C4,-1.25,1.72,wz,g); }
  pane(1.7,0.55,0.05,0.04,0x9FB8C4,0,1.75,2.79,g); // front window band
  { // the caravan silhouette: A-frame drawbar, coupling, jockey wheel, gas bottle
    const b1=cyl(0.045,0.045,1.3,PAL.metal,-0.42,0.42,3.32,g,7); b1.rotation.x=1.57; b1.rotation.y=0.32;
    const b2=cyl(0.045,0.045,1.3,PAL.metal,0.42,0.42,3.32,g,7); b2.rotation.x=1.57; b2.rotation.y=-0.32;
    box(0.16,0.12,0.22,PAL.metal,0,0.46,3.92,g,{noshadow:true}); // coupling head
    cyl(0.028,0.028,0.34,PAL.metal,0.2,0.32,3.55,g,6); // jockey post
    { const jw=cyl(0.09,0.09,0.05,PAL.rubber,0.2,0.1,3.55,g,10); jw.rotation.z=1.57; } // jockey wheel
    rbox(1.1,0.52,0.55,0.06,0x1E2226,0,0.58,3.12,g); // drawbar toolbox
    rbox(1.12,0.05,0.57,0.02,0x33383E,0,0.82,3.12,g,{noshadow:true}); // toolbox lid line
  }
  // The door-side wall is the +X face of the shell, so the wall PLANE is Y-Z and the wall NORMAL is
  // X: every slab is thin in X and spans Y and Z, the way the window band above states it too.
  // Dims are the old dims unchanged - 1.04x1.56 frame, 0.96x1.48 door, 0.3x0.95 pane - only the
  // axis they sit on moved, so the seal still walks a 12-step path around them.
  // WHERE THE WALL ACTUALLY IS, MEASURED, because the nominal 1.2 half-width is not it: rbox is an
  // ExtrudeGeometry and three expands the shape by bevelSize (r*0.92) on the two shape axes while
  // leaving the extrude axis exact. So the 2.4-wide shell really reaches x 1.476 across the door
  // band, and the 2.56-wide skirt reaches 1.464 over y 0.366..1.334. The outer skin at this door is
  // therefore x ~1.47, not 1.2, and the layering has to start from there or the door is inside the
  // van. Faces land at 1.495 frame, 1.516 door, 1.535 glass - each 0.02 proud of the one behind.
  const dFrame=rbox(0.03,1.56,1.04,0.04,0x2E3338,1.467,1.02,0.6,g,{noshadow:true}); // door frame
  const dDoor=rbox(0.04,1.48,0.96,0.045,0x23272B,1.478,1.02,0.6,g,{noshadow:true}); // the door itself — Crusader black
  const dPane=pane(0.045,0.95,0.3,0.03,0x9FB8C4,1.493,1.22,0.6,g); // tall narrow door pane
  const dGrip=sph(0.05,PAL.metal,1.52,0.98,0.24,g,6); // handle — proud of the glass face, on the door
  rbox(1.6,0.14,2.6,0.05,PAL.white,0,2.48,0.4,g,{noshadow:true}); cyl(0.14,0.18,0.16,PAL.metal,-0.5,2.56,-1.2,g,8); // roof pod + vent
  rbox(0.06,0.05,3.4,0.02,PAL.metal,1.23,2.34,0.2,g,{noshadow:true}); // awning rail
  for(const sdx of [-1,1]){ // tandem axles: two wheels under one long fender (Crusader)
    for(const twz of [-1.15,-0.45]){
      const wh=cyl(0.36,0.36,0.16,0x23262B,sdx*1.27,0.36,twz,g,14); wh.rotation.z=1.57;
      const hub=cyl(0.13,0.13,0.17,0x1B1E22,sdx*1.27,0.36,twz,g,10); hub.rotation.z=1.57;
      const hcap=cyl(0.045,0.045,0.18,PAL.metal,sdx*1.27,0.36,twz,g,8); hcap.rotation.z=1.57; }
    rbox(0.2,0.1,1.0,0.04,PAL.white,sdx*1.27,0.82,-0.9,g,{noshadow:true});
    const a1=rbox(0.2,0.1,0.5,0.04,PAL.white,sdx*1.27,0.66,-1.34,g,{noshadow:true}); a1.rotation.x=0.6;
    const a2=rbox(0.2,0.1,0.5,0.04,PAL.white,sdx*1.27,0.66,-0.46,g,{noshadow:true}); a2.rotation.x=-0.6;
    sph(0.045,0xE8A13A,sdx*1.2,1.05,2.7,g,6); sph(0.045,0xC0392B,sdx*1.2,1.05,-2.7,g,6); // clearance + tail lights
    rbox(0.04,0.05,5.5,0.02,PAL.white,sdx*1.22,2.36,0,g,{noshadow:true}); // roof gutter trim
  }
  const dStep=rbox(0.34,0.09,0.5,0.03,PAL.metal,1.61,0.28,0.6,g,{noshadow:true}); // door step
  pane(1.7,0.55,0.05,0.04,0x9FB8C4,0,1.62,-2.79,g); // rear window band
  box(2.3,0.16,0.14,PAL.metal,0,0.62,-2.83,g,{noshadow:true}); // rear bumper
  { const sw=cyl(0.34,0.34,0.12,PAL.rubber,-0.62,1.05,-2.85,g,12); sw.rotation.x=1.57; } // spare wheel
  box(0.42,0.14,0.02,PAL.white,0.55,0.75,-2.84,g,{noshadow:true}); // number plate
  blob(g,2.2,0.5);
  P.collide();
  P.doorParts={frame:dFrame,door:dDoor,pane:dPane,step:dStep,grip:dGrip};
}

/* ---- THE DOC UTE — REPLAT P6A ----
   TWO ANCHORS REPLACE TWO localToWorld CALLS, and that is the whole argument of this piece in one
   prop. The cage hint and the PECK THE LATCH mission both used to project a local offset through
   the group's matrixWorld — which is correct, and is also exactly the thing that breaks when the
   group stops holding the mesh those offsets were measured against. Declared here, they are facts
   about where the ute IS, and a model can be dropped in behind them untouched.
   THE CRATE STAYS INSIDE THE BODY, and that is a judged call rather than an oversight: a DOC
   kea-transport crate bolted to the tray is part of the vehicle a modeller would deliver. If a
   future ute GLB arrives without one, the crate becomes its own entry parented to `tray` — which
   is a decision to make with the file in hand, not now. */
defineProp('doc_ute',{
  biome:'carpark', at:{x:12,z:7,ry:-0.15},
  collider:[{kind:'box',w:2.2,d:4.5,top:1.4,solid:true}],
  anchors:{cage:{x:0,y:1.2,z:-1.1},          // the teaching hint, and the crate's own origin
           latch:{x:0.44,y:1.76,z:-1.1},     // the jailbreak peck, crate-local 0.44/0.34/0 lifted out
           bonnet:{x:-0.3,y:1.0,z:-2.0}, tray:{x:0.3,y:0.95,z:1.1}},
  material:{family:null,nightTint:false},
  build(g,p){ mkDocUteBody(g,p); },
});
function mkDocUte(){
  const P=placeProp('doc_ute'), g=P.group, x=P.at.x, z=P.at.z;
  G.uteG=g;
  { const up=P.anchor('cage');
    addHint('cage',up.x,up.y,up.z,6,()=>coopCell()
      ? 'the night ranger cages troublemakers - only a mate can peck the latch open'
      : 'the night ranger cages troublemakers - a mate pecks the latch, or mash your way out',
      {free:true}); }
  addPeck({label:'PECK THE LATCH',needHits:4,repeat:true,mesh:P.cageG,range:1.5,owner:null,
    getPos:()=>P.anchor('latch'),
    locked:()=>!jailFull()||vsOn(),   // TODO 24: in a match nobody lets you out - mash your own way
    onDone(p){ const k=jailedKea(); if(k){ k.freeCage&&k.freeCage(); award(40,'JAILBREAK',p); } this.done=false; this.hits=0; }});
  // keys on the bonnet, radio on the tray — Rex's prized possessions
  propAt('ute keys',x-0.3,1.0,z-2.0,PB.keys,{shiny:true,owner:'rex',mission:'keys'});
  propAt('DOC radio',x+0.3,0.95,z+1.1,PB.radio,{shiny:true,owner:'rex',guarded:true,mission:'radio'});
  return {g,x,z,parked:true};
}
function mkDocUteBody(g,P){
  /* THE CAGE HINT BELONGS TO THE THING THAT OWNS THE CAGE (TODO 58), and REPLAT P6A moved it up to
     the placement, where the registry can answer it from a DECLARED anchor rather than by
     projecting a hand-typed offset through this group's matrix. The old note about
     updateMatrixWorld is now moot for the same reason it was load-bearing then: propAnchor composes
     scale, yaw and origin arithmetically and never reads a matrix, so there is no matrix to be
     stale. TODO 52's two-mode text and TODO 55's `free` both survive verbatim at the call site. */
  const shell=rbox(2.0,0.55,4.4,0.16,PAL.ranger,0,0.56,0,g); hull(shell,0.03);
  rbox(1.76,0.68,1.6,0.22,PAL.ranger,0,1.1,-0.9,g);
  pane(1.66,0.46,1.5,0.16,PAL.glass,0,1.16,-0.9,g);
  rbox(1.9,0.36,2.0,0.06,PAL.dark,0,0.68,1.1,g);
  rbox(1.92,0.05,0.05,0.02,PAL.metal,0,0.92,0.15,g,{noshadow:true}); rbox(1.92,0.05,0.05,0.02,PAL.metal,0,0.92,2.05,g,{noshadow:true}); // tray rails
  rbox(2.02,0.2,0.24,0.08,PAL.metal,0,0.5,-2.2,g,{noshadow:true}); // bullbar
  sph(0.08,PAL.sun,-0.62,0.62,-2.22,g,8); sph(0.08,PAL.sun,0.62,0.62,-2.22,g,8);
  for(const [wx,wz] of [[-1,1.5],[1,1.5],[-1,-1.5],[1,-1.5]]){
    const arch=cyl(0.46,0.46,0.03,0x22262B,wx*0.88,0.42,wz,g,14); arch.rotation.z=1.57;
    const w=cyl(0.36,0.36,0.26,PAL.rubber,wx,0.36,wz,g,12); w.rotation.z=1.57;
    cyl(0.17,0.17,0.28,PAL.metal,wx,0.36,wz,g,10).rotation.z=1.57;
  }
  rbox(1.2,0.5,0.06,0.04,PAL.paper,0,1.0,2.21,g,{noshadow:true}); // kea-warning decal panel
  const doc=cyl(0.22,0.22,0.01,PAL.white,0.95,0.62,-0.9,g,12); doc.rotation.z=1.57; // door roundel
  blob(g,1.9,0.55);
  P.collide();
  { const cg=new THREE.Group(); cg.position.set(0,1.42,-1.1); g.add(cg); // DOC kea-transport crate
    box(0.82,0.05,0.64,PAL.woodD,0,0.03,0,cg,{noshadow:true});
    box(0.82,0.05,0.64,0x8F8878,0,0.62,0,cg,{noshadow:true});
    for(const [cx,cz] of [[-0.38,-0.29],[0.38,-0.29],[-0.38,0.29],[0.38,0.29]]) box(0.05,0.6,0.05,0x8F8878,cx,0.32,cz,cg,{noshadow:true});
    for(let i=-2;i<=2;i++){ cyl(0.012,0.012,0.56,PAL.metal,i*0.16,0.32,-0.3,cg,5); cyl(0.012,0.012,0.56,PAL.metal,i*0.16,0.32,0.3,cg,5); }
    const latch=sph(0.05,PAL.sun,0.44,0.34,0,cg,6);
    G.cage={g:cg,latch}; P.cageG=cg;
  }
}

/* traffic cars share mkCar but start on road */
/* THE ROAD BELONGS TO THE MAP THAT HAS ONE (TODO 39). These two lane numbers were the carpark road
   written into the traffic spawner, and updateTraffic runs whenever a run is running - so the first
   thing the ski field did with a soak test was put seven hatchbacks across the snow at z 34, driving
   through a road that is not there. Same shape as the cast and the nest: the lanes are declared by
   the biome, and a map that declares no road gets no traffic rather than somebody elses. */
function biomeTraffic(){ const b=BIOMES[G.biome||BIOME_DEFAULT]; return (b&&b.traffic)||null; }
function spawnTraffic(dir){
  const T=biomeTraffic(); if(!T)return null;
  const z=dir>0?T.up:T.down, x=dir>0?-T.x:T.x;
  if(G.cars.some(c=>c.traffic&&c.dir===dir&&Math.abs(c.x-x)<7))return null; // never spawn into someone's boot
  const c=mkCar(x,z,dir>0?0:Math.PI,pick([PAL.blue,PAL.white,PAL.yellow,0x9C5AA0,0x666E76]),'hatch');
  c.parked=false; c.dir=dir; c.speed=8; c.traffic=true;
  c.g.rotation.y=dir>0?-Math.PI/2:Math.PI/2;           // body front is local -z
  c.collider.w=2.15; c.collider.d=1.1;                 // rotated footprint
  G.cars.push(c);
  return c;
}
function pick(a){return a[Math.floor(Math.random()*a.length)];}

/* ---------- kea gym (the ranger's decoy) ---------- */
function deployGym(){
  if(G.gymOut)return; G.gymOut=true;
  const g=new THREE.Group(); const p={x:G.nestPos.x+7,z:G.nestPos.z+6}; g.position.set(p.x,0,p.z); G.scene.add(g);
  cyl(0.06,0.06,1.6,PAL.metal,0,0.8,0,g,6);
  const spin=box(1.2,0.1,0.16,PAL.cone,0,1.5,0,g); const ball=sph(0.16,PAL.yellow,0,1.1,0.3,g,8);
  G.gym={g,spin,ball,p};
  addPeck({label:'PLAY WITH GYM (suspiciously fun)',needHits:1,repeat:true,mesh:g,getPos:()=>({x:p.x,y:1.2,z:p.z}),range:1.5,owner:null,
    onDone(pp){ G.wantedT=Math.max(0,G.wantedT-1.1); G.wanted=Math.max(0,G.wanted-1); updWanted(); AU.chirp(); popup('DISTRACTED BY GYM','-1 WANTED',5,pp);
      G.gym.spinV=9; }});
  popup('RANGER REX DEPLOYS A "KEA GYM"','decoy!',0,{x:p.x,y:2,z:p.z},true);
}

/* ============================================================
   KEA — the player character
   ============================================================ */
/* ---- THE RIG ADAPTER'S WORKING PARTS — REPLAT P5b ----
   keaBirdFrame  measures the bird's own right/up/forward off the loaded skeleton
   keaRigBind    captures each bone's rest and returns the binding list
   keaRigCommit  maps the handles onto the bones, once per frame
   All three are module functions rather than Kea methods so a battery can exercise them against a
   synthetic skeleton without booting a bird. */

/* THE BIRD'S OWN FRAME, MEASURED. The lateral axis is the line between the two humeri — the one
   pair of bones guaranteed to be symmetric about the spine — and up is world Y because the model is
   authored standing. Forward falls out of the cross product. Measured rather than assumed because
   this model is yawed about 45 degrees off world X and any assumption would be wrong by that much. */
function keaBirdFrame(THREE,bones){
  const wl=bones.humL, wr=bones.humR;
  const up=new THREE.Vector3(0,1,0);
  let right;
  if(wl&&wr){
    const a=new THREE.Vector3().setFromMatrixPosition(wr.matrixWorld);
    const b=new THREE.Vector3().setFromMatrixPosition(wl.matrixWorld);
    right=a.sub(b).setY(0).normalize();
  } else right=new THREE.Vector3(1,0,0);
  /* forward = up x right for a right-handed frame; verified against the beak, which must lie in
     front of the head and does (the check is in the battery, not a comment). */
  const fwd=new THREE.Vector3().crossVectors(up,right).normalize();
  const m=new THREE.Matrix4().makeBasis(right,up,fwd.clone().negate());
  return {right,up,fwd,quat:new THREE.Quaternion().setFromRotationMatrix(m)};
}

/* CAPTURE THE REST. `restLocal` is what the bone sits at in the bind pose and every posed
   quaternion is built from it; `restWorld` is what carries a bird-frame delta into bone space. */
function keaRigBind(THREE,bones,frame){
  const out=[];
  for(const [key,bone] of Object.entries(bones)){
    if(!bone)continue;
    const restWorld=new THREE.Quaternion();
    bone.matrixWorld.decompose(new THREE.Vector3(),restWorld,new THREE.Vector3());
    out.push({key,bone,
      restLocal:bone.quaternion.clone(),
      restPos:bone.position.clone(),
      restWorld,
      /* conj(restWorld) * q * restWorld, precomputed halves */
      inv:restWorld.clone().invert()});
  }
  return out;
}

/* ONE JOINT. `rot` is a delta in the BIRD's frame; the result is the bone's local quaternion.
   THE FRAME QUATERNION IS FOLDED IN because the pose writes mean "about the bird's right/up/
   forward", and the bird's frame is not the world's on this model. */
const KEARIG_TMP={};
function keaRigApply(THREE,b,rot,frame,posScale){
  const T=KEARIG_TMP;
  T.e=T.e||new THREE.Euler(); T.q=T.q||new THREE.Quaternion(); T.o=T.o||new THREE.Quaternion();
  T.e.set(rot.x,rot.y,rot.z,'XYZ');
  T.q.setFromEuler(T.e);                        // the delta, in bird-frame axes
  if(frame){ T.o.copy(frame.quat); T.q.premultiply(T.o).multiply(T.o.clone().invert()); }
  // carry into the bone's local frame: conj(restWorld) * delta * restWorld
  T.q.premultiply(b.inv).multiply(b.restWorld);
  b.bone.quaternion.copy(b.restLocal).multiply(T.q);
}

class Kea{
  constructor(idx,map,x,z){
    this.idx=idx; this.map=map;
    this.x=x; this.y=0; this.z=z; this.ry=Math.PI; this.vy=0;
    this.grounded=true; this.speedMul=1; this.stun=0;
    this.held=null; this.tug=null; this.tugHeld=false; this.grabHeld=false;
    this.screamT=99; this.screamCd=0; this.walkPh=0; this.flapPh=0; this.airT=0;
    this.onRoof=false; this.slideD=0; this.slideV=0; this.eatingT=0; this.size=1;
    this.buildMesh();
    /* REPLAT P5b: A BIRD BORN AFTER THE MODEL LOADED STILL GETS IT. installBird attaches to every
       kea that exists when the GLB resolves — and the keas are built by startGame, which on a fast
       machine happens BEFORE a 5.4 MB fetch finishes and on a slow one after. The first render of
       this piece only worked because the load lost that race; the other way round the model would
       simply never have appeared, with nothing in G.bird to say so. Both directions covered. */
    if(typeof KEAGAME!=='undefined'&&KEAGAME._birdAttach)KEAGAME._birdAttach(this);
  }
  buildMesh(){
    const g=this.g=new THREE.Group(); G.scene.add(g);
    const scale=0.7*(this.size||1); g.scale.setScalar(scale);
    const body=this.body=new THREE.Group(); g.add(body);
    // one continuous lofted body: tail root -> rump -> deep chest -> shoulder rise
    const torso=new THREE.Mesh(loft([
      {z:-0.44,y:0.41,rx:0.045,ry:0.04},
      {z:-0.32,y:0.41,rx:0.145,ry:0.115},
      {z:-0.16,y:0.385,rx:0.225,ry:0.195},
      {z: 0.02,y:0.36, rx:0.265,ry:0.235},
      {z: 0.16,y:0.375,rx:0.245,ry:0.225},
      {z: 0.27,y:0.43, rx:0.175,ry:0.165},
      {z: 0.33,y:0.50, rx:0.105,ry:0.10}
    ],16),keaScal());
    torso.castShadow=!HEADLESS; body.add(torso); hull(torso,0.05);
    const belly=sph(0.2,PAL.keaBelly,0,0.27,0.13,body,16); belly.scale.set(0.82,0.62,1.0);
    // neck (stretchable) + head
    const neck=this.neck=new THREE.Group(); neck.position.set(0,0.47,0.28); body.add(neck);
    const nseg=new THREE.Mesh(loft([
      {z:-0.10,y:0.0,rx:0.125,ry:0.12},{z:0.02,y:0.05,rx:0.118,ry:0.115},{z:0.12,y:0.10,rx:0.112,ry:0.11}
    ],14),keaScal()); neck.add(nseg);
    const head=this.head=new THREE.Group(); head.position.set(0,0.16,0.15); neck.add(head);
    const skull=new THREE.Mesh(loft([
      {z:-0.15,y:-0.02,rx:0.075,ry:0.07},
      {z:-0.06,y:0.005,rx:0.135,ry:0.125},
      {z: 0.03,y:0.015,rx:0.155,ry:0.145},
      {z: 0.11,y:0.0,  rx:0.13, ry:0.12},
      {z: 0.165,y:-0.03,rx:0.075,ry:0.07}
    ],14),keaScal()); head.add(skull); skull.castShadow=!HEADLESS; hull(skull,0.06);
    sph(0.1,PAL.keaBelly,0,-0.06,0.06,head,10).scale.set(0.9,0.7,0.9); // cheek
    // eyes: dark iris + cere-cream ring + glint
    for(const sx of [-1,1]){
      const ring=sph(0.048,PAL.keaCere,sx*0.1,0.035,0.095,head,8);
      sph(0.034,PAL.keaEye,sx*0.105,0.035,0.115,head,8);
      const gl=new THREE.Mesh(new THREE.SphereGeometry(0.012,6,6),bmat(0xFFFFFF)); gl.position.set(sx*0.115,0.055,0.135); head.add(gl);
    }
    // long hooked upper beak + openable lower jaw
    const beakG=new THREE.Group(); beakG.position.set(0,-0.005,0.135); head.add(beakG);
    { // curved culmen: five overlapped cones tracing one smooth hooked arc
      const arc=[[0.058,0.0,-0.005,0.06,1.58],[0.050,0,-0.030,0.115,1.78],[0.041,0,-0.065,0.165,2.02],[0.031,0,-0.105,0.205,2.30],[0.020,0,-0.148,0.235,2.62]];
      for(const [r,ax,ay,az,rx] of arc){ const seg=new THREE.Mesh(new THREE.ConeGeometry(r,0.1,12),mat(PAL.keaBeak));
        seg.position.set(ax,ay,az); seg.rotation.x=rx; beakG.add(seg); } }
    cyl(0.045,0.05,0.05,PAL.keaCere,0,0.015,0.06,beakG,8).rotation.x=1.5; // cere band
    const jaw=this.jaw=new THREE.Group(); jaw.position.set(0,-0.05,0.02); beakG.add(jaw);
    const low=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.17,8),mat(0x463B32)); low.position.set(0,-0.01,0.11); low.rotation.x=1.75; jaw.add(low);
    this.beakTip=new THREE.Object3D(); this.beakTip.position.set(0,-0.12,0.31); beakG.add(this.beakTip);
    // tail: fanned feathers, orange under-flash
    { const rump=sph(0.115,0xD9481F,0,0.435,-0.40,body,10); rump.scale.set(1.05,0.5,0.75); } // orange-red rump — the kea's rear ID
    const tail=this.tail=new THREE.Group(); tail.position.set(0,0.4,-0.28); body.add(tail);
    this.tailF=[];
    for(let i=0;i<5;i++){ const a=(i-2)*0.21;
      const f=new THREE.Group(); f.rotation.y=a; tail.add(f);
      const fmats=[mat(PAL.keaWing),mat(PAL.keaWing),mat(PAL.keaWing),mat(PAL.keaOrange),mat(PAL.keaWing),mat(PAL.keaWing)];
      const b=new THREE.Mesh(new THREE.BoxGeometry(0.092,0.022,0.36),fmats); b.position.z=-0.18; b.castShadow=!HEADLESS; f.add(b);
      box(0.094,0.024,0.075,0x2E3216,0,0,-0.335,f,{noshadow:true});
      this.tailF.push(f);
    }
    // wings: shoulder pivots, 3 layered feathers; primaries flash ORANGE beneath
    this.wings=[]; this.feathers=[[],[]];
    for(const sd of [-1,1]){
      const w=new THREE.Group(); w.position.set(sd*0.16,0.5,0.1); body.add(w); w.userData.side=sd; w.userData.open=0.06;
      { const scap=rbox(0.24,0.05,0.26,0.02,0,sd*0.02,0.055,-0.02,w,{mats:keaScal()}); scap.rotation.z=sd*-0.55; } // scapulars: body feathers over the pivot
      const armG=new THREE.Group(); w.add(armG); w.userData.arm=armG;
      { const arm=new THREE.Mesh(loft([
          {z:0.02,y:0,rx:0.115,ry:0.03},{z:-0.14,y:-0.005,rx:0.125,ry:0.026},{z:-0.30,y:-0.008,rx:0.10,ry:0.02},{z:-0.38,y:-0.01,rx:0.07,ry:0.016}
        ],10),keaScal()); arm.rotation.z=sd*-0.18; arm.castShadow=!HEADLESS; armG.add(arm); }
      for(let si=0;si<4;si++){ const sec=rbox(0.10-si*0.008,0.014,0.20+si*0.02,0.006,0,sd*(0.02+si*0.004),-0.028,-0.10-si*0.065,armG,{mats:keaWing()});
        sec.rotation.y=sd*-0.05; } // secondaries riding the trailing edge
      const oPan=box(0.14,0.005,0.30,PAL.keaOrange,sd*0.01,-0.045,-0.18,armG,{noshadow:true}); w.userData.oPan=oPan; // underwing flash
      const wrist=new THREE.Group(); wrist.position.set(0,-0.008,-0.36); armG.add(wrist); w.userData.wrist=wrist;
      const fl=this.feathers[sd<0?0:1];
      for(let i=0;i<8;i++){
        const fg=new THREE.Group(); wrist.add(fg);
        const len=0.28+i*0.032;
        const blade=rbox(0.084-i*0.004,0.015,len,0.007,0,0,0,-len/2,fg,{mats:keaWing()});
        blade.castShadow=(!HEADLESS)&&(i%3===0);
        fg.userData={i}; fl.push(fg);
      }
      this.wings.push(w);
    }
    // legs: feathered thigh, tarsus, three-toe feet
    this.legs=[];
    for(const sd of [-1,1]){
      const L=new THREE.Group(); L.position.set(sd*0.09,0.2,0.02); body.add(L);
      sph(0.07,PAL.keaBelly,0,-0.01,0,L,8).scale.set(0.9,1.1,0.9);
      cyl(0.024,0.028,0.15,0x7A756E,0,-0.1,0,L,6);
      if(sd===-1){ const BANDCOLS=[0xD84B3A,0x2F6FB0,0xE8C22E,0x3E8E4E];
        this.band=cyl(0.034,0.034,0.045,BANDCOLS[(G.bandIdx||0)%4],0,-0.13,0,L,8); this.band._cols=BANDCOLS; }
      const foot=new THREE.Group(); foot.position.set(0,-0.18,0.01); L.add(foot);
      for(const ta of [-0.5,0,0.5]){ const t=box(0.022,0.018,0.1,0x7A756E,Math.sin(ta)*0.045,0,0.05+Math.cos(ta)*0.01,foot); t.rotation.y=ta; }
      box(0.02,0.018,0.06,0x7A756E,0,0,-0.05,foot);
      this.legs.push(L);
    }
    // contact shadow
    this.shadowM=blob(g,0.72,0.85);
    if(this.idx===1){ // P2: dusty-plum crown band + tail tips — readable at couch distance
      const band=cyl(0.16,0.165,0.055,PAL.plum,0,0.055,0,this.head,12);
      box(0.09,0.026,0.1,PAL.plum,0,0.415,-0.44,body);
      for(const f of this.tailF){ const t=box(0.07,0.024,0.07,PAL.plum,0,0.001,-0.315,f,{noshadow:true}); }
    }
  }
  input(){
    const m=this.map;
    return { f:KEYS.has(m.fwd), b:KEYS.has(m.back), l:KEYS.has(m.left), r:KEYS.has(m.right),
      flap:PRESSED.includes(m.flap), flapHeld:KEYS.has(m.flap),
      grab:PRESSED.includes(m.grab), grabHeld:KEYS.has(m.grab),
      scream:PRESSED.includes(m.scream) };
  }
  update(dt){
    const inp=G.running&&!G.paused&&!travelBusy()&&this.stun<=0?this.input():{f:0,b:0,l:0,r:0};   // TODO 38
    if(this.stun>((this._stunPrev||0)+0.1)){ RUMBLE(this.idx,220,0.85); if(G._rumbleSpy)G._rumbleSpy.push({i:this.idx,why:'stun'}); }
    this._stunPrev=this.stun;
    if((this.caged||0)>0){ const coop=coopCell();
      if(!coop)this.caged-=dt;                                       // co-op: the sentence does not run itself down
      const wp=new THREE.Vector3(0,1.7,-1.1); if(G.uteG)G.uteG.localToWorld(wp);
      this.x=wp.x; this.y=wp.y-0.28; this.z=wp.z; this.vy=0; this.grounded=true; this.stun=0;
      if(coop)setPrompt(this.idx,'<b>'+keyName(this.map.grab)+'</b> SQUAWK - only a mate can peck you out');
      const gp=KEYS.has(this.map.grab);
      if(gp&&!this._cagePrev){ if(coop)squawkFire(this); else { this.caged-=0.5; AU.pop&&AU.pop(); } }
      this._cagePrev=gp;
      if(this.caged<=0)this.freeCage();
      this.animate(dt,false); return; }
    this.stun=Math.max(0,this.stun-dt); this.screamCd=Math.max(0,this.screamCd-dt); this.screamT+=dt;
    this.grabHeld=!!inp.grabHeld;
    // steering
    const turn=3.1*dt; if(inp.l)this.ry+=turn; if(inp.r)this.ry-=turn;
    let spd=0; if(inp.f)spd=1; else if(inp.b)spd=-0.55;
    const S=this.size||1;
    const heavy=this.held&&this.held.heavy&&S<1.5; // a big enough kea carries cones like chips
    const base=(this.grounded?4.4:8.6)*(0.75+0.3*S);
    const mul=(heavy?0.55:1)*(this.tug?0.0:1);
    const vx=Math.sin(this.ry)*spd*base*mul, vz=Math.cos(this.ry)*spd*base*mul;
    this.x+=vx*dt; this.z+=vz*dt;
    // flight
    // FLIGHT v3 (2026-08-26): HOLD to fly — sustained wingbeats while the key is down
    if(inp.flapHeld && this.stun<=0 && !this.tug){
      if(this.grounded){ this.vy=4.6; this.grounded=false; this.airT=0; this.flapPh=0; AU.flap(); this._beatT=0.22; this.squash=0.14; }
      else { this.vy+=(heavy?12:26)*dt; this.vy=Math.min(this.vy,heavy?2.8:5.4);
        this._beatT=(this._beatT||0)-dt; if(this._beatT<=0){ AU.flap(); this._beatT=0.22; } }
      this.flapDrive=1;
    } else this.flapDrive=0;
    if(!this.grounded){
      this.airT+=dt;
      const gliding=spd>0&&this.vy<0&&!inp.flapHeld;
      if(!inp.flapHeld)this.vy-=(gliding?5.5:13.5)*dt;
      if(gliding)this.vy=Math.max(this.vy,-2.2);
      this.vy=Math.max(this.vy,-16);
      this.y+=this.vy*dt;
      if(heavy&&this.y>2.2){this.y=2.2;this.vy=Math.min(this.vy,0);} // cones are draggable, not airmail (until you outgrow the rule)
      if(this.y>15){this.y=15;this.vy=Math.min(this.vy,0);} // ceiling above the ridgelines
    }
    // colossal contact chaos: bunt cars, bowl humans
    if(G.colossal&&S>=1.8){
      this._bonkCd=Math.max(0,(this._bonkCd||0)-dt);
      for(const h of G.humans){ if(h.launched||h.sprawl||h.asleep)continue;
        if(dist2(this.x,this.z,h.x,h.z)<0.55+0.4*S&&this._bonkCd<=0){
          const dx=h.x-this.x,dz=h.z-this.z,dl=Math.max(0.2,Math.hypot(dx,dz));
          h.launch(dx/dl*3.2,4.6,dz/dl*3.2,8); this._bonkCd=0.5;
          award(15,'BOWLED OVER',{x:h.x,y:1.5,z:h.z}); heat(1); G.stats.bowls=(G.stats.bowls||0)+1;
        } }
      if(S>=2.0)for(const c of G.cars){ if(!c.traffic)continue;
        c._buntCd=Math.max(0,(c._buntCd||0)-dt);
        if(Math.abs(this.x-c.x)<1.1+0.5*S&&Math.abs(this.z-c.z)<2.5&&c._buntCd<=0){
          const fx=Math.sin(this.ry)||Math.sign(this.x-c.x)||1;
          c.x+=Math.sign(fx)*3.4; c.g.position.x=c.x; c.collider.x=c.x; c.speed=0; c.stopT=Math.max(c.stopT,1.2); c._buntCd=0.9;
          AU.clang(); AU.honk(); G.shake=Math.max(G.shake,0.22); burst({x:c.x,y:1,z:c.z},0xC4CAD2,8);
          if(c.bodyG){const bg=c.bodyG;TW.add(0.45,u=>{bg.rotation.z=Math.sin(u*Math.PI*3)*0.09*(1-u);bg.position.y=Math.sin(u*Math.PI)*0.12;});}
          if(!c.bunted){ c.bunted=true; markMission('c_bunt'); award(30,'CAR: BUNTED',{x:c.x,y:1.6,z:c.z}); heat(1.4); }
        } }
      if(this.held&&this.held.cone&&this.y>3)done('c_coneair');
    }
    if(!this.grounded&&this.vy<-0.8){ const ghL=groundHeightAt(this.x,this.z,this.y+0.4*S);
      if(this.y-ghL<1.35){ this.landFlare=Math.max(this.landFlare,0.3); this.vy*=(1-dt*1.6); } } // flare and brake for touchdown
    // ground resolve
    pushOut(this);
    const gh=groundHeightAt(this.x,this.z,this.y+0.4*S);
    if(this.y<=gh+0.001){ 
      if(!this.grounded){ this.squash=clamp(-this.vy*0.05,this.squash||0,0.42); this.landFlare=0.3; this.crouchT=0.22;
        if(this.vy<-5)burst({x:this.x,y:this.y+0.05,z:this.z},0xC8BFA8,6);
        if(this.vy<-8)AU.pop(); }
      this.y=gh; if(this.vy<0)this.vy=0; this.grounded=true;
    } else if(this.grounded && this.y>gh+0.05){ // walked off an edge
      this.grounded=false; this.vy=Math.min(this.vy,0);
    }
    // roof slide
    this.onRoof=false;
    for(const c of G.colliders){ if(c.kind!=='roof'||!c.slide)continue;
      if(this.grounded&&Math.abs(this.x-c.x)<=c.w&&Math.abs(this.z-c.z)<=c.d){
        const rh=c.ridge-Math.abs(this.z-c.z)*c.slope;
        if(Math.abs(this.y-rh)<0.35){ this.onRoof=c;
          if(this.tug){ this.slideV=0; }
          else if(Math.abs(this.z-c.z)>0.25){
            this.slideV+=7*dt; const dir=Math.sign(this.z-c.z);
            this.z+=dir*this.slideV*dt; this.slideD+=this.slideV*dt;
            this.y=c.ridge-Math.abs(this.z-c.z)*c.slope;
            if(!this._slSfx||G.time-this._slSfx>0.4){AU.whoosh();this._slSfx=G.time;}
            this._sprayT=(this._sprayT||0)-dt; if(this._sprayT<=0){ this._sprayT=0.07; burst({x:this.x,y:this.y+0.1,z:this.z-dir*0.3},PAL.snow,2); }
            if(this.slideD>1.8&&!this.slideScored){ this.slideScored=true; G.stats.slides=(G.stats.slides||0)+1; award(30,'ALPINE LUGE',this.pos()); done('slide'); if(this.hatProp)done('b_dress'); }
          }
        }
      }
    }
    if(!this.onRoof){ this.slideV=0; if(this.grounded)this.slideD=0,this.slideScored=this.slideScored&&this.slideD>0; }
    // actions
    if(inp.scream&&this.screamCd<=0&&this.stun<=0)this.screech();
    this.interact(inp,dt);
    this.carryUpdate();
    this.animate(dt,spd,inp);
  }
  pos(){return {x:this.x,y:this.y+0.5,z:this.z};}
  screech(){
    const S=this.size||1;
    this.screamCd=1.6; this.screamT=0; AU.screech((this.idx===1?0.8:1)/Math.sqrt(S)); G.stats.screeches++;
    burst(this.pos(),0xFFD34D,6);
    if(G.colossal&&this.grounded&&S>=1.6){ // THE STOMP
      G.shake=Math.max(G.shake||0,0.22+0.08*S); AU.splat(); G.stats.stomps=(G.stats.stomps||0)+1;
      burst({x:this.x,y:0.15,z:this.z},0xC8BFA8,Math.round(8*S));
      let hits=0;
      for(const h of G.humans){ if(h.asleep||h.launched)continue;
        const d=dist2(this.x,this.z,h.x,h.z);
        if(d<2.6*S){ const dx=h.x-this.x,dz=h.z-this.z,dl=Math.max(0.3,d);
          h.launch(dx/dl*(3.5+S),5+S*0.8,dz/dl*(3.5+S),9); hits++; } }
      for(const pr of G.props){ if(pr.heldBy||pr.banked)continue;
        if(dist2(this.x,this.z,pr.x,pr.z)<2.4*S){ pr.vy=Math.max(pr.vy||0,2.5); pr.rvx=rnd(-6,6); pr.rvy=rnd(-6,6); } }
      if(hits>0){ heat(1+hits*0.6); award(12*hits,'STOMP! ×'+hits,this.pos()); }
      if(hits>=3)done('c_stomp3');
      if(G.colossal&&G.level>=MAXLVL&&this.onRoof&&this.onRoof.hut&&Math.abs(this.z-this.onRoof.z)<0.7){
        done('c_apex'); winGame();
      }
    }
    const wakeM=G.missions.find(m=>m.id==='wake');
    if(wakeM&&!wakeM.done){
      const tomH=G.humans.find(h=>h.key==='tom');
      if(tomH&&tomH.asleep&&dist2(this.x,this.z,tomH.x,tomH.z)<6){ award(25,'DAWN CHORUS',this.pos()); done('wake'); }
    }
    for(const h of G.humans)h.hearScreech(this);
    for(const s of G.sheep){ if(dist2(this.x,this.z,s.x,s.z)<10){s.panic=3;AU.baa();} }
    // duet check
    const other=G.keas.find(k=>k!==this);
    if(other&&other.screamT<0.8){
      if(dist2(this.x,this.z,other.x,other.z)<7){ award(15,'DUET SCREECH',this.pos()); 
        if(onVanRoof(this)&&onVanRoof(other))done('duet'); }
    }
  }
  interact(inp,dt){
    /* TODO 21, ahead of the scan on purpose. Fetching a replacement is a deliberate act available to
       one role at one place, so it outranks whatever happens to be lying on the picnic table - which
       is a lot, and all of it closer to the bird than the table itself. */
    if(canRestore(this)&&!this.held){ const _src=foodSrcAt(this);
      if(_src&&foodOrderFor(_src)){
        setPrompt(this.idx,'<b>'+keyName(this.map.grab)+'</b> FETCH A REPLACEMENT from the '+_src.id+
                           (_src.stock>0?(' ('+_src.stock+' left)'):' — OUT OF STOCK'));
        if(inp.grab){ foodFetch(this); return; } } }
    // find target
    let best=null,bd=99;
    for(const it of G.inter){
      if(it.done&&!fixable(it,this))continue; if(it.locked&&it.locked())continue;   // TODO 18: the management sees wrecks
      if(it.kind==='prop'&&(it.heldBy||it.banked))continue;
      const p=it.getPos?it.getPos():it;
      const S2=this.size||1;
      const d=Math.sqrt((this.x-p.x)**2+(this.y+0.4*S2-p.y)**2+(this.z-p.z)**2);
      const r=(it.range||1.3)*S2;
      if(d<r&&d<bd){bd=d;best=it;}
    }
    // snow kick zone (roof eave over hut door) — only when nothing deliberate is in reach (F16)
    const sc=G.snowCap;
    if(!best&&!this.held&&sc&&sc.loaded&&this.onRoof&&this.onRoof.hut){
      const hx=sc.hut.x,hz=sc.hut.z;
      if(Math.abs(this.x-hx)<1.5&&this.z>hz+1.5&&this.z<hz+3.2){
        setPrompt(this.idx,'<b>'+keyName(this.map.grab)+'</b> KICK SNOW ONTO THE DOORWAY');
        if(inp.grab){ this.kickSnow(hx,hz); return; }
      }
    }
    // nest banking prompt
    const nearNest=dist2(this.x,this.z,G.nestPos.x,G.nestPos.z)<2.4&&Math.abs(this.y-G.nestY)<1.2;
    if(this.held&&nearNest){
      setPrompt(this.idx,'<b>'+keyName(this.map.grab)+'</b> '+(this.held.food?'SCOFF ':'STASH ')+this.held.name.toUpperCase()+' IN NEST');
      if(inp.grab){ this.bank(); return; }
    } else if(this.held){
      setPrompt(this.idx,'<b>'+keyName(this.map.grab)+'</b> DROP '+this.held.name.toUpperCase());
      if(inp.grab){ this.drop(); return; }
    } else if(!this.held&&!best&&this.hatProp){
      setPrompt(this.idx,'<b>'+keyName(this.map.grab)+'</b> DOFF THE '+this.hatProp.name.toUpperCase());
      if(inp.grab){ this.doff(); return; }
    } else if(best){
      let label=best.label|| ('GRAB '+(best.name||'').toUpperCase());
      if(best.kind==='prop')label='GRAB '+best.name.toUpperCase();
      if(best.kind==='tear')label=fixable(best,this)?'HOLD to PUT IT BACK':('HOLD to '+label);
      setPrompt(this.idx,'<b>'+keyName(this.map.grab)+'</b> '+label);
    } else setPrompt(this.idx,'');
    hintScan(this);
    // resolve press / hold
    if(best&&!this.held){
      if(best.kind==='prop'&&inp.grab){ this.take(best); }
      else if(best.kind==='peck'&&inp.grab){
        best.hits=(best.hits||0)+1; AU.tug(); this.peckAnim=0.18; burst(best.getPos(),0xffffff,3);
        if(best.mesh){ const m=best.mesh; TW.add(0.22,u=>{ m.rotation.z=Math.sin(u*Math.PI*3)*0.08*(1-u); }); }
        if(best.hits>=(best.needHits||1)){ if(best.repeat){best.hits=0;best.onDone(best.getPos());} else {best.done=true;best.onDone(best.getPos());} }
      }
      else if(fixable(best,this)&&inp.grabHeld){
        /* the same effort as wrecking it, because putting a thing back should not be the cheap
           option - the price of ORDER is the decay, not a shorter hold. */
        this.tug=best; best.tuggers=best.tuggers||new Set(); best.tuggers.add(this);
        best.fixProgress=(best.fixProgress||0)+dt*(this.size||1);
        setTug(this.idx,best.fixProgress/best.need);
        if(Math.random()<dt*7)AU.tug();
        if(best.fixProgress>=best.need)fixTear(best,this);
      }
      else if(best.kind==='tear'&&inp.grabHeld){
        this.tug=best; best.tuggers=best.tuggers||new Set(); best.tuggers.add(this);
        let ok=true;
        const giant=(this.size||1)>=1.8;
        if(best.needsBoth){ ok=giant||(G.keas.length>1&&G.keas.every(k=>k.tug===best));
          if(!ok)setPrompt(this.idx,best.coop+' <b>(both keas!)</b>'); }
        if(best.needsPartner){ const other=G.keas.find(k=>k!==this);
          ok=giant||(other&&dist2(other.x,other.z,best.getPos().x,best.getPos().z)<2.1&&other.grabHeld);
          if(!ok)setPrompt(this.idx,G.keas.length>1?'PARTNER MUST <b>HOLD THE LID</b> (their grab key)':'latch is spring-loaded — <b>NEEDS TWO BEAKS</b>'); }
        if(ok){
          best.progress+=dt*(best.needsBoth?1.35:1)*(this.size||1);
          if(Math.random()<dt*7)AU.tug();
          if(best.mesh){ const u=best.progress/best.need, w=best.wobble?0.2:0.06;
            best.mesh.rotation.z=(best.baseRz||0)+Math.sin(G.time*33)*w*(0.3+u);
            if(best.base){ // stateless lean toward the pulling beak + jitter
              const bp=best.getPos();
              const dx=this.x-bp.x, dz=this.z-bp.z, dl=Math.max(0.2,Math.hypot(dx,dz));
              const amp=(best.pull==='extract')?0:0.09*u;
              best.mesh.position.x=best.base.px+dx/dl*amp+Math.sin(G.time*40)*0.012*u;
              best.mesh.position.z=best.base.pz+dz/dl*amp+Math.cos(G.time*37)*0.012*u;
              best.mesh.rotation.x=(best.base.rx||0)+((this.y+0.4)<bp.y?0.16:-0.16)*u;
              if(best.pull==='extract')best.mesh.position.y=best.base.py+u*0.2; // nail slides visibly out
            }
            if(best.bendy)best.bendy.rotation.z=Math.sin(G.time*20)*0.5*u; }
          setTug(this.idx,best.progress/best.need);
          if(best.progress>=best.need&&!best.done){
            best.done=true; const p=best.getPos(); if(best.mesh&&!best.keepMesh)best.mesh.visible=false;
            if(best.strip&&best.strip.f<best.strip.N-1){ this.peckAnim=0.3; AU.tug(); } // beak-work: stay latched, hop to the next bit
            else { AU.rip(); burst(p,0x333333,8); burst(p,0xFF8A2E,5); burst(p,0x7D8C4A,6);
              this.recoilT=0.5; this.vy=Math.max(this.vy,2.0); this.grounded=false; }
            if(typeof BREAKFX!=='undefined'&&best.fx&&BREAKFX[best.fx])BREAKFX[best.fx](best,p,this);
            if(G.colossal&&(this.size||1)>=1.8&&G.keas.length===1){
              if(best.needsPartner)done('c_sololatch'); if(best.needsBoth)done('c_solotarp'); }
            /* THE PRISTINE VALUE IS MEASURED ONCE, on the first wreck, before any decay can touch
               it - and the decay for every later wreck is applied through the award hook, because
               the value is a literal inside the handler and there is no other way to reach it. */
            { const cyc=best.cycles||0, s0=G.score;
              if(cyc>0&&vsOn())G._decay=Math.pow(DECAY,cyc);   // VS ONLY, by construction and not by circumstance
              best.onDone(p);
              G._decay=null;
              if(!cyc)best.paid=Math.max(0,G.score-s0);
              best.cycles=cyc+1; }
            if(best.mission)markMission(best.mission);
            if(best.tuggers)best.tuggers.forEach(k=>{k.tug=null;});
          }
        }
      }
    }
    if(this.tug&&!this.tug.done){ const tp=this.tug.getPos();
      const td=Math.sqrt((this.x-tp.x)**2+(this.y+0.4-tp.y)**2+(this.z-tp.z)**2);
      if(td>((this.tug.range||1.3)*(this.size||1))+0.7){ if(this.tug.tuggers)this.tug.tuggers.delete(this); this.tug=null; setTug(this.idx,-1); }
    }
    if(this.tug&&(!inp.grabHeld||this.tug.done)){ if(this.tug.tuggers)this.tug.tuggers.delete(this); this.tug=null; setTug(this.idx,-1); }
    if(this.tug)setTug(this.idx,this.tug.progress/this.tug.need); 
  }
  kickSnow(hx,hz){
    const sc=G.snowCap; sc.loaded=false; sc.reloadT=14; sc.mesh.visible=false; this.peckAnim=0.2;
    // falling snow blob
    const blob=sph(0.55,PAL.snow,hx,3.0,hz+2.55,null,8); blob.scale.y=0.5;
    G.fx.push({mesh:blob,vy:0,t:0,kind:'snow',hx,hz,by:this.idx});   // TODO 16: it lands seconds later, outside the loop
    AU.whoosh();
  }
  take(prop){
    if(prop.guarded){ const rex=G.humans.find(h=>h.key==='rex');
      if(rex&&rex.distracted<=0&&dist2(rex.x,rex.z,prop.x,prop.z)<9){
        popup('REX IS WATCHING THE RADIO','distract him!',0,this.pos(),true); AU.oi(); rex.aggro(this,0.6); return; } }
    if(prop.sleepGuard){ const gh=G.humans.find(h=>h.key===prop.sleepGuard);
      if(gh&&!gh.asleep){ popup("HE'S AWAKE — the beanie stays on",'wait for the snoring',0,this.pos(),true); return; } }
    if(prop.wearable){
      this.wear(prop);
      AU.chirp(); this.peckAnim=0.2; award(15,'NOW WEARING: '+prop.name.toUpperCase(),this.pos());
      if(prop.mission)done(prop.mission);
      if(prop.missionProg)prog(prop.missionProg);
      noise(prop,prop.sleepGuard?5:7,'theft',prop.owner);
      return; }
    prop.heldBy=this; if(prop.mission&&!prop.wearable)done(prop.mission); if(prop.missionProg&&!prop.wearable)prog(prop.missionProg); this.held=prop; AU.chirp(); this.peckAnim=0.2;
    if(prop.owner)noise(prop,7,'theft',prop.owner);
    if(prop.name==='road cone')popup('CONE ACQUIRED','drag it to the road…',0,this.pos(),true);
    { const rm=G.missions.find(m=>m.id==='radio'); if(prop.mission==='radio'&&rm&&!rm.done){ done('radio'); award(50,'RADIO SILENCE',this.pos()); } }
    if(prop.mission==='pie'){ const dv=G.humans.find(h=>h.key==='dave'); if(dv&&dv.onLadder){ done('pielift'); award(20,'PIE, FROM UNDER HIS NOSE',this.pos()); } }
  }
  wear(prop){ // hats ride the head, not the beak. Quiet: no award, no noise, so the save can call it
    if(this.hatProp)this.doff();
    prop.heldBy=this; prop.worn=true; this.hatProp=prop;
    prop.mesh.visible=true; (this.headAttach||this.head).add(prop.mesh);
    prop.mesh.position.set(0,0.13,0.0); prop.mesh.rotation.set(0,0,0); prop.mesh.scale.setScalar(1/0.7);
    if(prop.srcHatG)prop.srcHatG.visible=false; }
  doff(){ const p=this.hatProp; if(!p)return;
    (this.headAttach||this.head).remove(p.mesh); G.scene.add(p.mesh); p.mesh.scale.setScalar(1);
    p.worn=false; p.heldBy=null; this.hatProp=null;
    p.x=this.x+Math.sin(this.ry)*0.5; p.z=this.z+Math.cos(this.ry)*0.5; p.y=this.y+0.6;
    p.vy=0.8; p.rvy=rnd(-4,4);
    p.mesh.position.set(p.x,p.y,p.z); AU.pop(); }
  drop(){
    const p=this.held; if(!p)return;
    const _s0=G.score;                       // TODO 20: what this drop pays for moving it
    p.heldBy=null; this.held=null; AU.pop();
    p.x=this.x+Math.sin(this.ry)*0.5; p.z=this.z+Math.cos(this.ry)*0.5; p.y=this.y+0.5;
    p.vy=0.6; p.vx=Math.sin(this.ry)*1.4; p.vz=Math.cos(this.ry)*1.4; p.rvx=rnd(-5,5); p.rvy=rnd(-6,6);
    // boot-launch: drop anything from altitude
    if(this.y>5&&!p.heavy){ award(15,'AIR MAIL',this.pos()); done('airmail'); }
    if(p.name==='boot'&&Math.abs(p.z-34)<3.6){ done('bootroad'); }
    if(p.name==='boot'&&dist2(p.x,p.z,p.home.x,p.home.z)>22&&!p.bootScored){ p.bootScored=true; award(30,'ONE BOOT, NEVER RECOVERED',this.pos());
      if(G.props.filter(q=>q.name==='boot'&&q.bootScored).length>=2)done('b_boot2'); }
    if(p.missionFar&&!p._farScored&&dist2(p.x,p.z,p.home.x,p.home.z)>(p.farR||16)){ p._farScored=true; done(p.missionFar); award(20,'RELOCATED: '+p.name.toUpperCase(),this.pos()); }
    /* TODO 20. Two questions, asked here and nowhere else: did this drop leave it AWAY from home -
       in which case whatever it just paid is what displacing it is worth - or has the management
       brought it back inside the radius, in which case it goes home crooked and pays ORDER. */
    if(p.home&&!atHome(p)){ p._wasAway=true; p.paid=Math.max(p.paid||0,G.score-_s0); }
    else if(p.home&&p._wasAway&&canRestore(this))carryBack(p,this);
  }
  bank(){
    const p=this.held; if(!p)return;
    p.heldBy=null; this.held=null; p.banked=true; p.mesh.visible=false;
    if(p.food){ AU.munch(); this.eatT=0.7; G.stats.food++; award(20,'SCOFFED: '+p.name.toUpperCase(),this.pos());
      const rexH=G.humans.find(h=>h.key==='rex');
      const _sgm=G.missions.find(m=>m.id==='sign');
      if(rexH&&_sgm&&!_sgm.done&&dist2(rexH.x,rexH.z,this.x,this.z)<11){
        popup('REX: "CAN\'T YOU READ THE SIGN?!"','',0,this.pos(),true); rexH.aggro(this); heat(1.2); award(10,'ATE IT IN FRONT OF HIM',this.pos());
      }
      if(p.snack)done(p.snack); if(G.colossal)done('c_snack');
      this.eatingT=0.8;
    } else {
      AU.ding(); G.nestStash++; G.stats.shinies++;
      if(G.nestStash>=5)done('b_five');
      if(!HEADLESS){ const m=p.mesh, sx=m.position.x, sy=m.position.y, sz2=m.position.z;
        const tx=G.nestPos.x+rnd(-0.4,0.4), ty=G.nestY+0.15, tz=G.nestPos.z+rnd(-0.4,0.4);
        m.visible=true;
        TW.add(0.45,u=>{ m.position.x=lerp(sx,tx,u); m.position.z=lerp(sz2,tz,u);
          m.position.y=lerp(sy,ty,u)+Math.sin(u*Math.PI)*1.1; m.rotation.y+=0.3; },()=>{ m.visible=false; }); }
      // stash visual: little pile grows
      const tw=sph(0.07,p.name==='spikes'?PAL.metal:pick([PAL.metal,PAL.yellow,0x9CC4E4]),rnd(-0.5,0.5),G.nestY+0.05+G.nestStash*0.015,rnd(-0.5,0.5),G.nestG,6);
      award(25,'STASHED: '+p.name.toUpperCase(),this.pos());
      if(p.mission==='passport')done('passport');
      if(p.mission==='keys')done('keys');
      if(p.mission==='can')done('can');
      if(p.name==='spikes'){ G.spikeStash=(G.spikeStash||0)+1; if(G.spikeStash>=3)award(40,'BUNKER NEST (real birds do this)',this.pos()); }
      if(p.name==='nail'){ G.nailStash=(G.nailStash||0)+1; if(G.nailStash>=3)award(30,'NAILS — SORTED BY SIZE',this.pos()); }
    }
  }
  carryUpdate(){
    const p=this.held; if(!p)return;
    const v=new THREE.Vector3(); this.beakTip.getWorldPosition(v);
    p.mesh.position.copy(v); p.mesh.rotation.y=this.ry; p.x=v.x; p.y=v.y; p.z=v.z;
  }
  animate(dt,spd,inp){
    // idle life: preen, scan, hop, stretch, ruffle, ground-peck when the player's hands are off
    /* A BIRD IN A CRATE IS NOT ENTERTAINING ITSELF (TODO 15). The caged branch returns before the
       movement code but it still calls animate, and animate is where the idle clock lives - so an
       act rolled the frame before the door shut used to sit there mid-preen inside the crate. Solo
       it healed itself when the sentence ran out; under the co-op cell the sentence never runs out,
       so it would have been forever, and harness-systems is what found it. Added to handsOff rather
       than cleared in the caged branch, because the else below already knows how to stop idling and
       a caged bird that never clocks idle time never rolls for an act either. */
    const handsOff=this.grounded&&!this.tug&&(this.recoilT||0)<=0&&(this.eatT||0)<=0&&Math.abs(spd)<0.05
      &&!(inp&&(inp.flap||inp.flapHeld||inp.grabHeld||inp.grab||inp.scream))&&(this.stun||0)<=0&&!G.poseLock
      &&(this.caged||0)<=0;
    if(handsOff){ this.idleT=(this.idleT||0)+dt;
      if(this.idleAct){ this.idleAct.t+=dt; if(this.idleAct.t>=this.idleAct.dur)this.idleAct=null; }
      else if(this.idleT>2.2&&rnd(0,1)<dt*0.6){
        const kinds=['preen','preen','scan','scan','hop','stretch','ruffle','peckG'];
        const kind=kinds[Math.floor(rnd(0,kinds.length))%kinds.length];
        this.idleAct={kind,t:0,dur:kind==='hop'?0.5:(kind==='ruffle'?0.6:rnd(1.2,2.2)),side:rnd(0,1)<0.5?-1:1};
        this._idleEver=true;
        if(kind==='hop'){ this.vy=1.5; this.grounded=false; this.ry+=rnd(-0.55,0.55); if(!HEADLESS&&AU.ctx&&AU.chirp)AU.chirp(); }
      }
    } else { this.idleT=0; if(this.idleAct)this.idleAct=null; }
    const g=this.g; g.position.set(this.x,this.y,this.z);
    this.peckAnim=Math.max(0,(this.peckAnim||0)-dt);
    this.squash=Math.max(0,(this.squash||0)-dt*1.8);
    this.landFlare=Math.max(0,(this.landFlare||0)-dt);
    this.recoilT=Math.max(0,(this.recoilT||0)-dt);
    this.eatT=Math.max(0,(this.eatT||0)-dt);
    const B=this.body,H=this.head,N=this.neck;

    // face the work: while tugging, the whole bird orients to its grip point
    if(this.tug&&this.tug.getPos){ const tp=this.tug.getPos();
      const want=Math.atan2(tp.x-this.x,tp.z-this.z);
      this.ry+=wrapAng(want-this.ry)*Math.min(1,dt*10);
      this._tugPitch=clamp((tp.y-(this.y+0.45))*0.9,-0.5,0.9);
    }
    g.rotation.y=this.ry;
    // squash & stretch
    const sq=this.squash;
    B.scale.set(1+sq*0.55,1-sq,1+sq*0.4);
    // shadow locks to the ground beneath
    if(this.shadowM&&this.shadowM.material){ const gh=groundHeightAt(this.x,this.z,this.y+0.4);
      const h=Math.max(0,this.y-gh);
      this.shadowM.position.y=((gh-this.y))/(1.15*(this.size||1))+0.02;
      this.shadowM.scale.setScalar(lerp(1,0.45,Math.min(1,h/5)));
      this.shadowM.material.opacity=lerp(0.85,0.12,Math.min(1,h/6)); }
    if(this.tug){
      // THE PULL: plant feet, lean back, stretch the neck to the grip, shake with effort
      const p=this.tug.progress||0, shake=0.02+p*0.05;
      B.rotation.x=lerp(B.rotation.x,-0.62,dt*10);
      B.position.y=lerp(B.position.y,-0.04,dt*10);
      N.scale.z=lerp(N.scale.z,1.5+Math.sin(G.time*26)*0.12,dt*12);
      N.rotation.x=lerp(N.rotation.x,(this._tugPitch||0)+0.5,dt*10);
      H.rotation.x=lerp(H.rotation.x,(this._tugPitch||0)*0.6+0.35+Math.sin(G.time*30)*0.12,dt*12);
      this.jaw.rotation.x=lerp(this.jaw.rotation.x,0.5,dt*12); // beak clamped wide on the thing
      g.position.x+=Math.sin(G.time*47+this.idx)*shake; g.position.z+=Math.cos(G.time*41)*shake*0.7;
      for(const w of this.wings){ w.rotation.z=w.userData.side*(-0.5+Math.sin(G.time*22+w.userData.side)*0.35); w.rotation.x=-0.2; }
      this.legs.forEach((l,i)=>{ l.rotation.x=lerp(l.rotation.x,0.55-(i?1.1:0),dt*10); });
      this.tail.rotation.x=0.65+Math.sin(G.time*24)*0.1;
      this.tailF.forEach((f,i)=>f.rotation.y=(i-2)*0.26); // fan for balance
      return;
    }
    if(this.recoilT>0){ // the SNAP: back-tumble with the prize
      const u=1-this.recoilT/0.5;
      B.rotation.x=-u*Math.PI*2;
      B.position.y=Math.sin(u*Math.PI)*0.22;
      this.jaw.rotation.x=0.4;
      for(const w of this.wings)w.rotation.z=w.userData.side*Math.sin(u*Math.PI*3)*1.0;
      return;
    }
    N.scale.z=lerp(N.scale.z,1,dt*10); N.rotation.x=lerp(N.rotation.x,0,dt*8);
    this.jaw.rotation.x=lerp(this.jaw.rotation.x,this.screamT<0.3?0.75:(this.eatT>0?Math.abs(Math.sin(G.time*20))*0.5:0.03),dt*14);
    if(this.grounded){
      this.walkPh+=dt*(2+Math.abs(spd)*11);
      const hop=Math.abs(Math.sin(this.walkPh))*(0.07*Math.abs(spd));
      this.crouchT=Math.max(0,(this.crouchT||0)-dt);
      const crouch=this.crouchT>0?Math.sin((this.crouchT/0.22)*Math.PI)*0.055:0;
      B.position.y=hop-crouch; B.rotation.x+=crouch*1.6; 
      B.rotation.x=lerp(B.rotation.x,(Math.abs(spd)>0?Math.sin(this.walkPh)*0.05:0)+(this.held?0.12:0),dt*10);
      B.rotation.z=lerp(B.rotation.z,0,dt*8);
      const flare=this.landFlare>0?1:0;
      for(const w of this.wings){ const sd2=w.userData.side;
        w.rotation.z=lerp(w.rotation.z,sd2*(flare?-0.7:-0.30),dt*(flare?18:9));
        w.rotation.x=lerp(w.rotation.x,flare?-0.25:0.14,dt*9);
        w.rotation.y=lerp(w.rotation.y,flare?0:sd2*-0.14,dt*9);
        if(w.userData.arm)w.userData.arm.rotation.y=lerp(w.userData.arm.rotation.y,flare?sd2*-0.7:sd2*0.06,dt*10);
        w.userData.open=lerp(w.userData.open,flare?0.55:0.085,dt*8);
      }
      // strut: head bobs WITH the step, kea style
      { const thr=Math.abs(spd)>0?Math.pow(Math.max(0,Math.sin(this.walkPh*2)),3):0; // sharp stab, long hold
        this._thr=lerp(this._thr||0,thr,dt*22);
        H.rotation.x=(Math.abs(spd)>0?-this._thr*0.22+0.06:Math.sin(G.time*2+this.idx)*0.05)-0.14+(this.peckAnim>0?1.05:0); }
      if(G.poseLock){ H.rotation.x=-0.1; N.rotation.x=0.04; this.jaw.rotation.x=0.04; }
      N.position.z=0.22+(this._thr||0)*0.06;
      this.legs.forEach((l,i)=>l.rotation.x=Math.sin(this.walkPh+i*Math.PI)*0.75*Math.abs(spd));
      this.tail.rotation.x=this.onRoof&&this.slideV>0.5?0.8:Math.sin(G.time*3)*0.07;
      this.tailF.forEach((f,i)=>f.rotation.y=lerp(f.rotation.y,(i-2)*(this.onRoof&&this.slideV>0.5?0.3:0.14),dt*8));
      if(this.onRoof&&this.slideV>0.5){ B.rotation.x=0.35; this.legs.forEach(l=>l.rotation.x=1.2); } // luge posture
      if(this.eatT>0){ H.rotation.x=-0.5+Math.abs(Math.sin(G.time*14))*0.9; } // head-toss gulp
      if(this.idleAct){ const a=this.idleAct,u=a.t/a.dur,sd=a.side;
        if(a.kind==='preen'){ // the head reaches OUT to the shoulder now, not DOWN under the wing
          N.rotation.y=lerp(N.rotation.y,sd*PREEN.yaw,dt*10); N.rotation.x=PREEN.neckX;
          H.rotation.x=PREEN.headX+Math.abs(Math.sin(a.t*16))*PREEN.headAmp;
          this.jaw.rotation.x=Math.abs(Math.sin(a.t*18))*0.3;
          const w=this.wings[sd<0?0:1]; if(w){ w.rotation.z=w.userData.side*-PREEN.wingZ; w.rotation.x=0.06; } }
        else if(a.kind==='scan'){ N.rotation.y=Math.sin(a.t*2.2)*0.8; H.rotation.z=sd*0.35*Math.sin(a.t*3.1+1); H.rotation.x=-0.15; }
        else if(a.kind==='stretch'){ const w=this.wings[sd<0?0:1]; if(w){ w.rotation.z=lerp(w.rotation.z,w.userData.side*0.55,dt*8); w.rotation.x=-0.25; }
          this.tailF.forEach((f,i)=>f.rotation.y=(i-2)*0.26); this.tail.rotation.x=0.25; }
        else if(a.kind==='ruffle'){ B.rotation.z=Math.sin(a.t*40)*0.16*(1-u); g.position.x+=Math.sin(a.t*55)*0.012;
          for(const w of this.wings){ w.rotation.z=w.userData.side*(-1.0+Math.sin(a.t*46+w.userData.side)*0.25); } }
        else if(a.kind==='peckG'){ H.rotation.x=0.2+Math.abs(Math.sin(a.t*9))*0.95; N.rotation.x=0.35; }
      } else { N.rotation.y=lerp(N.rotation.y||0,0,dt*8); H.rotation.z=lerp(H.rotation.z||0,0,dt*8); }
      if(G.poseLock){ this.landFlare=0; this.eatT=0; this.idleAct=null;
        H.rotation.x=-0.1; H.rotation.z=0; N.rotation.x=0.04; N.rotation.y=0; this.jaw.rotation.x=0.04; B.rotation.x=0; B.rotation.z=0;
        for(const w of this.wings){ w.rotation.z=w.userData.side*-1.05; w.rotation.x=0.18; }
        this.tail.rotation.x=0.05; this.tailF.forEach((f,i)=>f.rotation.y=(i-1.5)*0.16); }
    } else {
      this.flapPh+=dt*(this.flapDrive?19:10);
      for(const w of this.wings){
        if(w.userData.arm)w.userData.arm.rotation.y=lerp(w.userData.arm.rotation.y,w.userData.side*-1.30,dt*10);
        const sst=Math.sin(this.flapPh);
        const stroke=this.flapDrive?(sst>0?Math.pow(sst,0.62)*1.18:sst*0.55):(this.vy<-0.5?0.08:0.3); // fast deep downstroke, lazy lift
        w.rotation.z=lerp(w.rotation.z,w.userData.side*stroke,dt*18);
        w.rotation.x=lerp(w.rotation.x,this.flapDrive?-0.12:0,dt*10);
        w.rotation.y=lerp(w.rotation.y,0,dt*10);
        w.userData.open=lerp(w.userData.open,this.flapDrive?0.8+0.2*Math.abs(sst):1.0,dt*10);
      }
      B.rotation.x=clamp(-this.vy*0.06,-0.5,0.45)+(this.flapDrive?-0.12:0.1);
      B.position.y=0.05; this.legs.forEach(l=>l.rotation.x=lerp(l.rotation.x,1.0,dt*10));
      H.rotation.x=this.flapDrive?-0.1:-0.2;
      const glide=!this.flapDrive&&this.vy<0;
      this.tail.rotation.x=glide?-0.1:0.2;
      this.tailF.forEach((f,i)=>f.rotation.y=lerp(f.rotation.y,(i-1.5)*(glide?0.4:0.16),dt*10)); // fan wide on the glide
    }
    if(!this.grounded&&this.landFlare>0){
      B.rotation.x=lerp(B.rotation.x,-0.34,dt*12);
      this.tail.rotation.x=lerp(this.tail.rotation.x,-0.5,dt*12);
      this.tailF.forEach((f,i)=>f.rotation.y=lerp(f.rotation.y,(i-2)*0.3,dt*12));
      this.legs.forEach(l=>l.rotation.x=lerp(l.rotation.x,-0.75,dt*12));
      for(const w of this.wings){ w.userData.open=lerp(w.userData.open,0.95,dt*14); w.rotation.x=lerp(w.rotation.x,-0.34,dt*12); }
    }
    for(let wi=0;wi<2;wi++){ const w=this.wings[wi]; if(!w)break;
      const sd=w.userData.side, open=w.userData.open, fl=this.feathers[wi];
      if(w.userData.oPan){ w.userData.oPan.visible=open>0.25; }
      if(w.userData.wrist){ const swing=sd*-0.34*clamp((open-0.15)/0.8,0,1);
        w.userData.wrist.rotation.y=lerp(w.userData.wrist.rotation.y,swing,dt*11); }
      for(const fg of fl){ const i=fg.userData.i;
        const ty=sd*-(0.05+i*0.145)*open;
        fg.rotation.y=lerp(fg.rotation.y,ty,dt*(15-i*1.2));
        const whip=this.flapDrive?Math.sin(this.flapPh-i*0.42)*0.12*open:0;
        fg.rotation.z=lerp(fg.rotation.z,sd*(whip+i*0.012*open),dt*(13-i*1.0));
      } }
    if(this.screamT<0.3){ H.rotation.x=-0.7; N.rotation.x=-0.3; for(const w of this.wings)w.rotation.z=w.userData.side*-0.35;
      H.scale.setScalar(1+Math.sin(this.screamT*30)*0.05); }
    else H.scale.setScalar(1);
    if(this.stun>0){ B.rotation.z=Math.sin(G.time*20)*0.32; H.rotation.z=Math.sin(G.time*17)*0.2; } else H.rotation.z=lerp(H.rotation.z,0,dt*8);
    if(G.poseLock){ // photography: outranks every state, applied LAST
      this.landFlare=0; this.eatT=0; this.idleAct=null; this.vy=0; this.grounded=true;
      B.rotation.set(0,0,0); B.position.y=0.01;
      N.rotation.set(-0.14,0,0); N.scale.z=1.08; N.position.z=0.26;
      H.rotation.set(-0.34,0,0); H.scale.setScalar(1); this.jaw.rotation.x=0.06;
      for(const w of this.wings){ const sd2=w.userData.side;
        w.rotation.set(0.14,sd2*-0.14,sd2*-0.30); w.userData.open=0.085;
        if(w.userData.oPan)w.userData.oPan.visible=false;
        if(w.userData.arm)w.userData.arm.rotation.y=sd2*0.06;
        if(w.userData.wrist)w.userData.wrist.rotation.y=0; }
      for(let wi=0;wi<2;wi++){ for(const fg of this.feathers[wi]){ const i=fg.userData.i;
        fg.rotation.y=this.wings[wi].userData.side*(-0.05-i*0.155)*0.07; fg.rotation.z=0; } }
      this.tail.rotation.x=0.05; this.tailF.forEach((f,i)=>f.rotation.y=(i-1.5)*0.16);
      this.legs.forEach(l=>l.rotation.x=0.1);
    }
    /* REPLAT P5b: THE HANDLES ARE NOW READ, ONCE, AND MAPPED ONTO BONES. Everything above this
       line wrote to the primitive hierarchy exactly as it always has — that is the whole design.
       No-op unless the model is attached. */
    if(this._model)this.rigCommit();
  }
  /* ---- REPLAT P5b: HANDLES -> BONES ----
     Reads the pose the 80 write sites just built and carries each one into its bone's local frame.
     The wing is the interesting case: the old rig has ONE joint per wing and the model has three,
     so the stroke is distributed down humerus/ulna/metacarpus by KEABIRD.wingChain, and `open` —
     which used to spread individual primaries the model has no bones for — extends the ulna and
     metacarpus instead. That is a genuine loss of articulation, recorded in the recipe. */
  rigCommit(){
    const M=this._model; if(!M)return;
    const T=THREE, B=KEABIRD, bn=M.bones, fr=M.frame, rig=M.rig;
    const by={}; for(const b of rig)by[b.key]=b;
    const put=(key,x,y,z)=>{ const b=by[key]; if(b)keaRigApply(T,b,{x,y,z},fr); };
    const R=this.body.rotation, N=this.neck.rotation, H=this.head.rotation;
    put('body', R.x, R.y, R.z);
    put('neck', N.x, N.y, N.z);
    put('head', H.x, H.y, H.z);
    /* THE BILL RESTS SHUT. jawShut is added to whatever the game asks, so `jaw.rotation.x` still
       opens and closes the beak — from a closed rest instead of a permanent gape. */
    put('jaw',  this.jaw.rotation.x + (B.plume?B.plume.jawShut:0), 0, 0);
    put('tail', this.tail.rotation.x, 0, 0);
    for(const w of this.wings){
      const sd=w.userData.side, L=sd<0, open=w.userData.open||0;
      const seg=L?['humL','ulnaL','metaL']:['humR','ulnaR','metaR'];
      for(let i=0;i<3;i++){
        const k=B.wingChain[i], o=B.openChain[i]*(open-0.06);
        put(seg[i], w.rotation.x*k, w.rotation.y*k + sd*o, w.rotation.z*k);
      }
    }
    this.legs.forEach((l,i)=>{ put(i?'femL':'femR', l.rotation.x, 0, 0);
      put(i?'tibL':'tibR', -l.rotation.x*0.6, 0, 0); });
    /* AND THE WING-OPEN GATE, driven from the wing's own state. The coverts and the barred
       underside only exist on screen while the wing is actually open — which is what a kea does. */
    { const U=M.sk&&M.sk.material&&M.sk.material.userData.keaU;
      if(U&&B.plume){ const o=(this.wings[0]&&this.wings[0].userData.open)||0;
        U.uOpen.value=clamp((o-B.plume.openLo)/Math.max(1e-4,B.plume.openHi-B.plume.openLo),0,1); } }
  }
  freeCage(){
    this.caged=0; this.vy=3.2; this.grounded=false; G.squawk=null;
    const p={x:this.x,y:this.y+0.3,z:this.z};
    burst(p,0xFFD34D,10); popup('JAILBROKEN','',0,p,true); AU.rip&&AU.rip();
  }
  shooed(byHuman,noVacancy){
    if(this.stun>0)return;
    this.stun=1.0; G.stats.shooed++;
    AU.oi(); burst(this.pos(),0x6B7A3A,10);
    if(G._shooSpy)G._shooSpy.push({idx:this.idx,noVacancy:!!noVacancy});
    // knockback + lose the goods
    const dx=this.x-byHuman.x, dz=this.z-byHuman.z, d=Math.max(0.3,Math.sqrt(dx*dx+dz*dz));
    this.x+=dx/d*1.6; this.z+=dz/d*1.6; this.vy=3.5; this.grounded=false;
    const dropped=this.held?this.held.name.toUpperCase():null;
    if(this.held){ const p=this.held; this.drop(); p.vy=2; }
    if(noVacancy) popup('NO VACANCY',dropped?('the cell is taken - dropped the '+dropped):'the cell is taken - shooed instead',0,this.pos(),true);
    else if(dropped) popup('SHOOED! DROPPED THE '+dropped,'',0,this.pos(),true);
    else popup(pick(['SHOOED!','"OI!! GIT!!"','BONKED']),'',0,this.pos(),true);
  }
}
let idxTint=false;
/* JAIL: one cell, one bird, globally. Occupancy is a property of the WORLD, not of a bird,
   so every reader asks the same question here instead of testing its own kea. */
function jailedKea(){ return G.keas.find(k=>(k.caged||0)>0)||null; }
function jailFull(){ return !!jailedKea(); }
/* THE CO-OP CELL (TODO 15, 2026-09-02). Solo, the cage is a timer you mash your way out of, and the
   latch peck is a courtesy. In co-op that shape is wrong twice over: it makes the cell a solo
   minigame the partner can only watch, and it makes the latch - the only piece of two-bird
   choreography the jail owns - a shortcut nobody needs. So in co-op the CLOCK STOPS. The grab key
   buys no seconds; it SQUAWKS, and the latch is the door. Solo is untouched, and the branch that
   decides is one predicate so there is exactly one place to read.
   THE SQUAWK IS STATE, AND THAT IS A TESTABILITY DECISION AS MUCH AS A DESIGN ONE. It lands on the
   partner as a prompt, and prompts are written by each kea inside its own update - so a ping fired
   by kea 0 would be wiped when kea 1 updates after it, and would survive when the caged bird happens
   to be kea 1. Whether your mate can see you would depend on which of you got caught. squawkUpdate
   runs ONCE after the whole kea loop instead, which is the only place that wins for both orders.
   THE BEARING IS DERIVED, NEVER RESTATED (FLAKES law 10). The file has no compass and no north; what
   it has is a steering convention - forward is (sin ry, cos ry) and the left key ADDS to ry - so the
   ping speaks in the only directions a player can act on, relative to where the partner is looking.
   Read the angle off that convention and a re-mapped control scheme carries the ping with it. */
const SQUAWK={hold:1.8,cd:0.55,say:['AHEAD','AHEAD LEFT','LEFT','BEHIND LEFT','BEHIND','BEHIND RIGHT','RIGHT','AHEAD RIGHT']};
/* TODO 24: A VERSUS MATCH IS NOT CO-OP, and the cell knows it. Piece 15 stopped the clock in co-op
   because your mate is the only way out; in a match your mate is the one who put you there, so the
   solo rules come back - the sentence runs down and mashing works - and the latch is locked. One
   predicate still, which is why reversing the whole cell is a line. */
function coopCell(){ return G.keas.length>1&&!vsOn(); }   // one predicate, one place to read
const VSCAGE=30;                                          // the caging bonus. FENCED FOR PLAYTEST
function squawkDir(from,to){
  const dx=to.x-from.x, dz=to.z-from.z, d=Math.sqrt(dx*dx+dz*dz);
  let rel=Math.atan2(dx,dz)-(from.ry||0);               // same parameterisation as ry: forward is (sin,cos)
  while(rel>Math.PI)rel-=Math.PI*2; while(rel<-Math.PI)rel+=Math.PI*2;
  const oct=Math.round(rel/(Math.PI/4)), i=((oct%8)+8)%8;
  return {d,rel,say:SQUAWK.say[i]}; }
function squawkFire(k){
  if(!coopCell())return null;
  const s=G.squawk; if(s&&s.cd>0)return null;           // a held key repeats no faster than the ear takes it
  G.squawk={idx:k.idx,x:k.x,y:k.y,z:k.z,t:SQUAWK.hold,cd:SQUAWK.cd,n:((s&&s.n)||0)+1};
  const other=G.keas.find(o=>o!==k);
  AU.screech&&AU.screech(1.2); if(other)RUMBLE(other.idx,180,0.5);
  popup('SQUAWK!','your mate can hear you',0,{x:k.x,y:k.y+1.4,z:k.z},true);
  return G.squawk; }
function squawkUpdate(dt){
  const s=G.squawk; if(!s)return null;
  s.t=Math.max(0,s.t-dt); s.cd=Math.max(0,s.cd-dt);
  if(s.t>0&&coopCell()){ const other=G.keas.find(o=>o.idx!==s.idx);
    /* the line is BUILT ONCE and kept on the ping, so the HUD and anyone asking what the HUD says
       are reading the same string rather than two that have to be kept in step. */
    if(other){ const b=squawkDir(other,s);
      s.to=other.idx; s.dist=b.d; s.say=b.say;
      s.text='<b>SQUAWK!</b> your mate is CAGED - '+Math.round(b.d)+'m '+b.say+' - <b>PECK THE LATCH</b>';
      setPrompt(other.idx,s.text); } }
  return s; }
function onVanRoof(k){ const v=G.vanTop; return v&&Math.abs(k.x-v.x)<v.w+0.4&&Math.abs(k.z-v.z)<v.d+0.4&&k.y>v.top-0.6; }

/* ---------- fx ---------- */
G.fx=[]; G.shake=0;
const BREAKFX={
  snapoff(tear,p,kea){ // directional spring: bits fly away from the beak
    const dx=p.x-kea.x, dz=p.z-kea.z, dl=Math.max(0.2,Math.hypot(dx,dz));
    if(!HEADLESS)for(let i=0;i<5;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.02,0.09),mat(PAL.metal));
      m.position.set(p.x,p.y,p.z); G.scene.add(m);
      G.fx.push({mesh:m,vx:dx/dl*rnd(2,4)+rnd(-1,1),vy:rnd(2,4.5),vz:dz/dl*rnd(2,4)+rnd(-1,1),t:0,kind:'bit'}); }
    AU.pop(); G.shake=Math.max(G.shake,0.12);
  }
};
function burst(p,color,n){
  if(HEADLESS)return;
  for(let i=0;i<n;i++){
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.07,0.02),mat(color));
    m.position.set(p.x+rnd(-0.2,0.2),p.y+rnd(0,0.3),p.z+rnd(-0.2,0.2));
    G.scene.add(m);
    G.fx.push({mesh:m,vx:rnd(-2,2),vy:rnd(1,4),vz:rnd(-2,2),t:0,kind:'bit'});
  }
}
function updateFX(dt){
  if(G.hudPulse>0){ G.hudPulse=Math.max(0,G.hudPulse-dt*2.4);
    /* THE FOOTER TICKS WHILE YOU ARE READING IT (TODO 66), and only while you are: the list is a
       full-height panel and rebuilding it every frame would be a layout thrash for three numbers, so
       this writes the ONE line, and only when it has actually changed and the panel is open. */
    if(!HEADLESS){ const _td=document.getElementById('todo');
      if(_td&&_td.classList.contains('open')){ const _ft=document.getElementById('mifoot'), _s=todoFoot();
        if(_ft&&_s!==G._footLast){ _ft.textContent=_s; G._footLast=_s; } } }
    if(!HEADLESS){ const ce=el('chaos'), p=G.hudPulse;
      ce.style.transform='scale('+(1+p*0.14).toFixed(3)+')';
      ce.style.textShadow=p>0.05?'0 0 '+(p*14).toFixed(1)+'px rgba(255,211,77,'+(p*0.75).toFixed(2)+')':''; } }
  if(G.fire&&(G.nightT||0)>0.05){ const t=G.nightT, T=G.time;
    const fl=0.82+Math.sin(T*11.3)*0.16*(RM?0.35:1)+Math.sin(T*23.7)*0.09+Math.sin(T*5.1+1.7)*0.07;
    const spit=(G._fireSpit=Math.max(0,(G._fireSpit||0)-dt))>0?0.25:((Math.random()<dt*1.4)?((G._fireSpit=0.09),0.25):0);
    const F=fl+spit;
    G.fire.light.intensity=t*1.3*F*LX_POINT;
    const f=G.fire.flame; f.scale.set(0.68+0.3*F,0.6+0.62*F,0.68+0.3*F);
    f.position.y=0.42+0.05*Math.sin(T*17.3); f.rotation.y=T*2.1;
    f.material.color.setHSL(0.066+0.02*Math.sin(T*7.7),1.0,0.58+0.06*F);
    const n=G.fire.inner; if(n){ n.scale.set(0.6+0.35*F,0.55+0.75*F,0.6+0.35*F);
      n.position.y=0.36+0.06*Math.sin(T*21.1+2); n.rotation.y=-T*3.4; }
    if(G._fireSpy)G._fireSpy.push(F);
  }
  /* THE CAREER PEAK WAS DEAD (TODO 35, the half of it that needs no judgement). This line read
     G.chaos, which NOTHING in the file has ever assigned - the meter is G.score, and the HUD says so
     out loud: it renders CHAOS plus G.score. So (undefined||0) > (peak||0) was 0 > 0 every frame of
     every run, the peak never rose off zero, and every player has always been shown PEAK 0 - on the
     to-do footer, on the win screen, and in the save blob that carries it between maps.
     THE OTHER READ OF G.chaos IS THE NIGHT AUTO-DRIVER and it is deliberately left alone: pointing
     that one at the meter changes WHEN NIGHT FALLS, which is a feel change on two pinned vantages
     and a playtest call. TODO 35 still holds it, and the battery asserts it is still there. */
  G.playT=(G.playT||0)+dt; if((G.score||0)>(G.chaosPeak||0))G.chaosPeak=G.score;
  /* THE BULL WHEEL IS A FUNCTION OF THE PINNED CLOCK, NOT AN INTEGRAL OF dt — REPLAT P4e.
     It was `rotation.z += dt*2.4`, which accumulates WALL-CLOCK deltas: the capture rig holds
     G.time at 12.0 on every animation frame and that pin could not reach an integrator, so the
     wheel's angle depended on how many frames the settle got through and how long each one took.
     It is a 14-sided cylinder seen nearly edge-on, so a few degrees swings its visible red area by
     a factor of four — 28_skifield_base's `scarlet` subject reshot at 490, 1067 and 2038 across
     three takes of ONE build, straddling its floor of 1500 in both directions. That is a coin
     flip wearing the clothes of a regression, and it cost this session a false alarm.
     Reading G.time directly is exactly the idiom the grass wind already uses and for the same
     reason. In play G.time advances by dt, so the wheel turns at the speed it always did; under
     the pin it stops at one angle. Nothing about the motion changes, only its reproducibility. */
  if(G.towWheel)G.towWheel.rotation.z=G.time*2.4;
  updateStrips(dt);
  AMB.update(dt,G.keas&&G.keas[0]);
  TW.step(dt);
  /* REPLAT P4: uTime comes off G.time and NOTHING ELSE, which is what makes the wind
     deterministic under the capture rig's clock pin (it holds G.time at 12.0 every frame). The
     sun direction rides along because the transmission term needs it and the sun crosses the sky
     on the day/night roll — reading it here keeps one author for it. */
  /* REPLAT P4e: THE FAR TIER IS DRIVEN FROM THE SAME LIST. A layer left off this loop keeps its
     anchor at (0,0) — a static disc round the world origin — and its wind frozen, which reads as
     "the far grass does not follow" and is precisely the failure the anchor note below describes.
     One list, every layer, so adding a tier cannot half-connect it. */
  for(const _gm of [G.grassMat,G.grassCoverMat,G.grassFarMat]) if(_gm&&_gm.userData.keaG){ const U=_gm.userData.keaG;
    U.uTime.value=G.time;
    if(G.sun)U.uSunDir.value.copy(G.sun.position).normalize();
    /* THE ANCHOR IS THE WHOLE POINT OF A CAMERA-FOLLOWING FIELD and it has to be written EVERY
       FRAME. Left at its initial (0,0) the field is a 20 m disc around the world origin, which is
       exactly the empty-foreground failure the static version had — and it photographs as "the
       grass did not build" rather than as "the grass is somewhere else", which is why it is worth
       a note. SNAPPED to a grid so the field does not swim under a creeping camera: a blade's
       every property is hashed from its world position, so an unsnapped anchor would have blades
       changing height and colour continuously as the camera drifted. The snap is small enough
       (0.5 m) that the swap happens well inside the fade band at the field's edge. */
    /* THE SNAP IS THE LATTICE SPACING, AND IT IS DERIVED — REPLAT P4c.
       The field is snapped to a grid so it cannot swim, which makes the anchor a STEP FUNCTION of
       the camera: a hair of difference either side of a boundary jumps the WHOLE field by `snap`
       metres. At 0.5 m that jump moved enough pixels to fail the stability bar — 05_tussock_ground,
       the grassiest frame in the set, went from reshooting at exactly 1.0000 to 0.9842.
       ATTRIBUTED, NOT GUESSED, AND THE FIRST FIX WAS WRONG. With the ragged edge disabled it was
       still unstable, so the edge was not it; with a finer snap it was stable, which points at the
       boundary. I then tried anchoring to the BIRD instead of the camera on the theory that a
       pinned bird is more reproducible than a settling camera — and it was WORSE, three vantages
       unstable instead of one, because the bird is no more settled than the lens at shutter time.
       THEN A FINER SNAP WAS WORSE TOO — three vantages instead of one — because a smaller step is
       crossed far MORE often for the same camera jitter, and at a close-up like 03_kea_plate a
       four-centimetre shift of the whole field is plenty of pixels.
       AND THEN THE MEASUREMENT STOPPED AGREEING WITH ITSELF. Sweeping snap 0.5 / 2.0 / 6.0 gave
       3 / 1 / 3 unstable, and 0.5 had given 1 earlier in the same session on the same code. A
       signal that changes without the code changing is the machine, not the field — the same
       finding sessions 17 and 19 recorded — and tuning against it would be fitting to noise. So
       `snap` is left at the value P4 shipped and the HAZARD IS RECORDED INSTEAD: the field's
       content is a step function of camera position, so a take-to-take camera difference near a
       boundary shifts the whole field by `snap` metres. It is real, it is mine, and the honest
       next step is `crossrun` on a quiet machine rather than another constant picked off a noisy
       reading. NO THRESHOLD WAS TOUCHED. */
    const c=G.cams&&G.cams[0];
    if(c){ const q=U.uSnap.value;
      U.uAnchor.value.set(Math.round(c.position.x/q)*q, Math.round(c.position.z/q)*q); } }
  for(let i=G.fx.length-1;i>=0;i--){
    const f=G.fx[i]; f.t+=dt;
    if(f.kind==='bit'){
      f.vy-=10*dt; f.mesh.position.x+=f.vx*dt; f.mesh.position.y+=f.vy*dt; f.mesh.position.z+=f.vz*dt;
      f.mesh.rotation.x+=dt*8; f.mesh.rotation.z+=dt*6;
      if(f.t>0.9||f.mesh.position.y<0){ G.scene.remove(f.mesh); G.fx.splice(i,1); }
    } else if(f.kind==='snow'){
      f.vy-=9*dt; f.mesh.position.y+=f.vy*dt; f.mesh.rotation.x+=dt*7; f.mesh.rotation.z+=dt*4;
      if(f.mesh.position.y<=1.0){
        const hitPos={x:f.mesh.position.x,y:1,z:f.mesh.position.z};
        G.scene.remove(f.mesh); G.fx.splice(i,1);
        // did it hit a human at the door?
        let hit=null;
        for(const h of G.humans){ if(dist2(h.x,h.z,f.hx,f.hz+2.9)<1.6)hit=h; }
        if(!HEADLESS){ const sp=cyl(0.4,0.5,0.05,PAL.snow,hitPos.x,0.1,hitPos.z,null,12);
          TW.add(1.6,u=>{ sp.scale.x=sp.scale.z=1+u*0.9; sp.position.y=0.1-u*0.04; },()=>G.scene.remove(sp)); }
        if(hit){ AU.splat(); hit.snowed(); G.stats.snow++;
          award(60,'SNOW BUSINESS — DIRECT HIT',hitPos,f.by); done('snow'); burst(hitPos,0xF4F7FA,12); G.shake=Math.max(G.shake,0.18);
        } else { AU.splat(); burst(hitPos,0xF4F7FA,8); popup('SNOW DUMPED… nobody under it','wait for a human at the door',0,hitPos,true); }
      }
    }
  }
  const sc=G.snowCap;
  if(sc&&!sc.loaded){ sc.reloadT-=dt; if(sc.reloadT<=0){sc.loaded=true;sc.mesh.visible=true;} }
  if(G.gym){ if(G.gym.spinV){ G.gym.spin.rotation.y+=G.gym.spinV*dt; G.gym.spinV*=(1-dt*1.5); }
    G.gym.ball.position.x=0.3*Math.sin(G.time*2.4); G.gym.ball.position.y=1.1+Math.sin(G.time*3.1)*0.08; }
}

/* ---------- noise / misdeed broadcast ---------- */
function noise(p,sev,type,ownerKey,car){
  G.noiseEvents.push({x:p.x,z:p.z,sev,type,ownerKey,car,t:0});
  heat(sev);
  bumpCombo();
}
function fmtT(t){ t=Math.max(0,t|0); return (t/60|0)+':'+String(t%60).padStart(2,'0'); }
function heat(sev){
  G.wantedT+=sev*0.09;
  const lvl=clamp(Math.floor(G.wantedT),0,5);
  if(lvl!==G.wanted){ G.wanted=lvl; updWanted();
    if(lvl>=4&&!G.gymOut)deployGym();
  }
}
function updWanted(){
  if(HEADLESS)return;
  const fs=document.querySelectorAll('#wanted .feather');
  fs.forEach((f,i)=>f.classList.toggle('on',i<G.wanted));
}

/* ============================================================
   HUMANS — perturbed, irritated, ultimately outsmarted
   ============================================================ */
class Human{
  constructor(key,name,color,x,z,opts){
    this.key=key; this.name=name; this.x=x; this.z=z; this.ry=0;
    this.home={x,z}; this.state='idle'; this.t=0; this.speed=2.0;
    this.target=null; this.carry=null; this.distracted=0; this.stun=0;
    this.giveUpT=0; this.scanT=rnd(0,1.5); this.walkPh=0; this.grumbleT=0;
    Object.assign(this,opts||{});
    this.buildMesh(color);
    if(this.asleep)this.lieDown();
  }
  buildMesh(color){
    const g=this.g=new THREE.Group(); g.position.set(this.x,0,this.z); G.scene.add(g);
    // legs pivot at the hip
    const mkLeg=(sx)=>{ const L=new THREE.Group(); L.position.set(sx,0.72,0); g.add(L);
      capsule(0.085,0.6,PAL.dark,0,-0.32,0,L);
      rbox(0.18,0.1,0.3,0.045,0x4A4038,0,-0.66,0.05,L); return L; };
    this.legL=mkLeg(-0.13); this.legR=mkLeg(0.13);
    const torso=this.torso=new THREE.Group(); torso.position.set(0,1.05,0); g.add(torso);
    const tc=capsule(0.3,0.78,color,0,0,0,torso); hull(tc.children[0],0.05);
    rbox(0.5,0.09,0.34,0.04,PAL.woodD,0,-0.3,0,torso,{noshadow:true}); // belt
    const mkArm=(sx)=>{ const A=new THREE.Group(); A.position.set(sx,1.34,0); g.add(A);
      capsule(0.075,0.52,color,0,-0.26,0,A);
      sph(0.075,this.skin||PAL.skin,0,-0.56,0,A,8); return A; };
    this.armL=mkArm(-0.38); this.armR=mkArm(0.38);
    this.head=sph(0.2,this.skin||PAL.skin,0,1.64,0,g,14); hull(this.head,0.06);
    { const nose=new THREE.Mesh(new THREE.SphereGeometry(0.035,7,6),mat(this.skin2||PAL.skin2));
      nose.position.set(0,-0.03,0.19); this.head.add(nose); } // nose, on the face where it belongs
    if(this.hat==='cap'){ const cg=this.hatG=new THREE.Group(); g.add(cg);
      const dome=sph(0.205,this.hatColor||PAL.ranger,0,1.76,0,cg,12); dome.scale.y=0.62;
      rbox(0.3,0.035,0.24,0.015,this.hatColor||PAL.ranger,0,1.73,0.25,cg,{noshadow:true}); }
    if(this.hat==='hard'){ const h=sph(0.23,PAL.yellow,0,1.76,0,g,12); h.scale.y=0.68;
      const brim=cyl(0.26,0.27,0.03,PAL.yellow,0,1.68,0,g,14); }
    if(this.hat==='beanie'){ const bg=this.hatG=new THREE.Group(); g.add(bg);
      const b=sph(0.21,PAL.red,0,1.77,0,bg,12); b.scale.y=0.8;
      cyl(0.215,0.215,0.07,0xA8423E,0,1.66,0,bg,12); sph(0.06,PAL.white,0,1.96,0,bg,7); }
    if(this.vest){ rbox(0.6,0.52,0.4,0.08,PAL.hiviz,0,0.06,0,torso,{noshadow:true});
      rbox(0.62,0.06,0.41,0.02,0xF2F2EE,0,0.16,0,torso,{noshadow:true}); rbox(0.62,0.06,0.41,0.02,0xF2F2EE,0,-0.06,0,torso,{noshadow:true}); }
    const ex=this.exMark=new THREE.Group(); ex.position.set(0,2.24,0); g.add(ex);
    const exm=bmat(PAL.bad);
    const b1=new THREE.Mesh(roundedBoxGeo(0.09,0.26,0.09,0.03),exm); b1.position.y=0.08; ex.add(b1);
    const b2=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,8),exm); b2.position.y=-0.14; ex.add(b2);
    ex.visible=false;
    this.zzz=box(0.2,0.2,0.02,0x9CC4E4,0.4,1.9,0,g,{noshadow:true}); this.zzz.visible=!!this.asleep;
    this.shadowM=blob(g,0.75,0.7);
  }
  lieDown(){ this.g.rotation.z=1.45; this.g.position.y=0.75; this.g.position.x=this.x; }
  wake(){ if(!this.asleep)return; this.asleep=false; this.g.rotation.z=0; this.g.position.y=0; this.zzz.visible=false;
    AU.gasp(); this.state='grumble'; this.t=0; this.exMark.visible=true; this.sleepT=22; VOX.play('grumble',this); }
  hearScreech(kea){
    if(this.asleep){ if(dist2(kea.x,kea.z,this.x,this.z)<7)this.wake(); return; }
    const d=dist2(kea.x,kea.z,this.x,this.z);
    if(d<2.4&&this.hat==='cap'&&this.hatG&&this.hatG.visible&&!this._capPopped&&!this.launched){
      this._capPopped=true; this.hatG.visible=false; VOX.play('capped',this,12);
      const dx=this.x-kea.x,dz=this.z-kea.z,dl=Math.max(0.3,Math.hypot(dx,dz));
      this.launch(dx/dl*2.2,3.6,dz/dl*2.2,7);
      spawnLoose("ranger's cap",PB.rangercap,{x:this.x+rnd(-0.3,0.3),y:2.0,z:this.z+rnd(-0.3,0.3)},{wearable:true,owner:'rex',mission:'b_cap'});
      popup('THE CAP! CLEAN OFF!','',0,{x:this.x,y:2.3,z:this.z},true); award(20,'DECAPPED',{x:this.x,y:2,z:this.z},kea);
    }
    if(d<10&&this.state!=='chase'&&this.stun<=0){
      this.state='investigate'; this.target={x:kea.x,z:kea.z}; this.distracted=2.6; this.t=0; this.exMark.visible=true;
    }
  }
  cageKea(k){
    k.caged=8; k._cagePrev=true;
    if(k.held){k.held.heldBy=null;k.held=null;}
    popup('BEHIND BARS',coopCell()?('SQUAWK with '+keyName(k.map.grab)+' — only a mate can peck you out')
                                   :('mash '+keyName(k.map.grab)+' — or a mate pecks the latch'),0,{x:k.x,y:k.y+1.4,z:k.z},true);
    G.squawk=null;
    AU.clang(); RUMBLE(k.idx,420,0.9);
    this.state='return'; this.chaseKea=null; this.exMark.visible=false;
    pageCaged(curPage());   // the clean-getaway star: this page is no longer clean, TODO 14
    /* TODO 24: in a match, putting the menace away is the management doing its job and it pays. NO
       POSITION on purpose - a caging is a match event, not a patch act, so piece 23 must not scope
       it to wherever the ute happens to be parked. */
    if(vsOn()&&G.vs&&k.idx===G.vs.roles.menace){
      const mg=G.keas.find(q=>q.idx===G.vs.roles.management);
      if(mg)award(VSCAGE,'ORDER: MENACE CAGED',null,mg); }
    if(G._cageSpy)G._cageSpy.push({idx:k.idx});
  }
  aggro(kea,delay){ VOX.play('chase',this);
    if(this.asleep)this.wake();
    if(this.stun>0)return;
    this.state='chase'; this.chaseKea=kea; this.giveUpT=0; this.t=-(delay||0); this.exMark.visible=true;
    if(this.torch)this._torchChase=1.2;
    if(Math.random()<0.7)AU.oi();
  }
  launch(vx,vy,vz,spin){ VOX.play('snowed',this);
    if(this.launched)return;
    this.launched={vx,vy,vz,y:Math.max(this.g.position.y,0.1),spin:spin||rnd(5,9),t:0};
    this.state='launched'; this.stun=Math.max(this.stun,1); this.chaseKea=null;
    this.onLadder=false; AU.oi(); AU.whoosh();
  }
  snowed(){ this.stun=2.6; this.exMark.visible=true; heat(2);
    this.launch(rnd(-1.2,1.2),4.4,rnd(-1.2,1.2),7);
    popup('"'+pick(['AW COME ON','MY NECK','NOT AGAIN','RIGHT DOWN THE COLLAR'])+'"','',0,{x:this.x,y:2.2,z:this.z},true);
    this.state='grumble'; this.t=0; VOX.play('grumble',this); }
  nearestKea(maxD){
    let best=null,bd=maxD||26;
    /* TODO 24: with a warrant out in a match, rex is not looking for the nearest bird, he is looking
       for THE MENACE. Below the warrant he behaves exactly as he always did, so nothing outside a
       match and nothing early in one changes. */
    const hunt=this.key==='rex'&&vsOn()&&G.wanted>=3&&G.vs?G.keas.find(k=>k.idx===G.vs.roles.menace):null;
    for(const k of G.keas){ if(hunt&&k!==hunt)continue;
      const d=dist2(k.x,k.z,this.x,this.z); if(d<bd){bd=d;best=k;} }
    return best;
  }
  update(dt){
    this.t+=dt; this.stun=Math.max(0,this.stun-dt); this.distracted=Math.max(0,this.distracted-dt);
    this.scanT-=dt; this.grumbleT=Math.max(0,this.grumbleT-dt);
    if(this.launched){ const L=this.launched; L.t+=dt;
      L.vy-=13*dt; this.x+=L.vx*dt; this.z+=L.vz*dt; L.y+=L.vy*dt;
      this.x=clamp(this.x,-52,52); this.z=clamp(this.z,-52,52);
      this.g.position.set(this.x,L.y,this.z);
      this.g.rotation.x+=L.spin*dt; this.g.rotation.z+=L.spin*0.55*dt;
      this.armL.rotation.x=Math.sin(G.time*20)*1.4; this.armR.rotation.x=-Math.sin(G.time*22)*1.4; // flailing
      if(L.y<=0.05&&L.vy<0){ this.launched=null; this.g.rotation.x=0;
        this.sprawl=1.4; this.stun=Math.max(this.stun,1.8);
        AU.splat(); burst({x:this.x,y:0.4,z:this.z},0xC8BFA8,9); heat(0.8);
        popup('"'+pick(['I WAS AIRBORNE','THE SKY. I WAS IN THE SKY','MY BACK','WHO GAVE IT WINGS'])+'"','',0,{x:this.x,y:2,z:this.z},true);
      }
      return; }
    if(this.sprawl>0){ this.sprawl-=dt;
      this.g.position.y=0.32; this.g.rotation.z=1.5;
      if(this.sprawl<=0){ this.sprawl=0; this.g.rotation.z=0; this.g.position.y=0; this.state='grumble'; this.t=0; }
      return; }
    if(this.asleep){ this.zzz.position.y=1.9+Math.sin(G.time*2)*0.1; this.zzz.scale.setScalar(1+Math.sin(G.time*2)*0.2); return; }
    if(this.stun>0){ this.g.rotation.z=Math.sin(G.time*18)*0.12; this.animate(dt,0); return; } else this.g.rotation.z=0;
    if(this.sleepT!==undefined&&this.key==='tom'){ this.sleepT-=dt;
      if(this.sleepT<=0&&this.state!=='chase'){
        if(this.state==='idle'&&dist2(this.x,this.z,this.home.x,this.home.z)<3){ this.asleep=true; this.zzz.visible=true; this.lieDown(); this.exMark.visible=false; return; }
        else if(this.state==='idle'||this.state==='grumble'){ this.state='return'; }
      } }
    if(G.colossal&&this.state!=='flee'&&this.state!=='launched'){
      const gk=this.nearestKea(5.5);
      if(gk&&(gk.size||1)>=1.6){ this.state='flee'; VOX.play('flee',this); this.t=0; this.exMark.visible=true; if(Math.random()<0.3)AU.gasp(); }
    }
    // react to fresh misdeeds
    for(const n of G.noiseEvents){
      if(n.consumed)continue;
      const d=dist2(n.x,n.z,this.x,this.z);
      const mine=(n.ownerKey===this.key)||(this.driverCar&&n.car===this.driverCar);
      if(mine&&d<28){ const k=this.nearestKea(28); if(k)this.aggro(k); }
      else if(d<12&&this.state==='idle'&&n.sev>=8){ this.state='investigate'; this.target={x:n.x,z:n.z}; this.t=0; this.exMark.visible=true; }
    }
    // guard owned props / retrieve strays
    if(this.scanT<=0){ this.scanT=1.2;
      if(this.state==='idle'||this.state==='walk'){
        for(const p of G.props){
          if(p.owner!==this.key||p.banked)continue;
          if(p.heldBy){ if(this.distracted<=0&&dist2(p.x,p.z,this.x,this.z)<16)this.aggro(p.heldBy); break; }
          const dHome=dist2(p.x,p.z,p.home.x,p.home.z);
          if(dHome>2.5&&p.y<1.8&&dist2(p.x,p.z,this.x,this.z)<24){ this.state='retrieve'; this.fetch=p; this.exMark.visible=true; break; }
          // lurking kea near my stuff
          for(const k of G.keas){ if(this.distracted<=0&&dist2(k.x,k.z,p.x,p.z)<1.8&&dist2(this.x,this.z,p.x,p.z)<11){
            this.state='investigate'; this.target={x:k.x,z:k.z}; this.t=0; this.exMark.visible=true; } }
        }
      }
    }
    const sp=(this.state==='chase'?3.5+G.wanted*0.22:2.1)*(this.speedMul||1);
    let moving=0;
    const go=(tx,tz,arrive)=>{
      const dx=tx-this.x,dz=tz-this.z,d=Math.sqrt(dx*dx+dz*dz);
      if(d<(arrive||0.4))return true;
      this.ry=Math.atan2(dx,dz);
      this.x+=dx/d*sp*dt; this.z+=dz/d*sp*dt; moving=1; return false;
    };
    switch(this.state){
      case 'idle':
        this.exMark.visible=false;
        if(this.patrol){ this.state='walk'; this.wp=(this.wp||0); }
        if(this.key==='dave'&&!this.onLadder&&this.t>2){ this.state='return'; }
        break;
      case 'walk':
        if(this.patrol){ const w=this.patrol[this.wp%this.patrol.length];
          if(go(w.x,w.z,0.6)){ this.wp++; this.t=0; this.state='idle'; setTimeout(()=>{if(this.state==='idle')this.state='walk';},0); if(this.t>-1)this.state=Math.random()<0.4?'idle':'walk'; } }
        else this.state='idle';
        break;
      case 'investigate':
        if(this.target&&go(this.target.x,this.target.z,1.2)){ this.state='grumble'; this.t=0; }
        if(this.t>4){ this.state='grumble'; this.t=0; }
        break;
      case 'chase':{
        const k=this.chaseKea;
        if(!k){this.state='return';break;}
        if(k.y>2.4)this.giveUpT+=dt; else this.giveUpT=Math.max(0,this.giveUpT-dt*0.5);
        const d=dist2(k.x,k.z,this.x,this.z);
        if(G.colossal&&(k.size||1)>=1.6){ this.state='flee'; VOX.play('flee',this); this.t=0; break; }
        if(this.giveUpT>1.3||d>26){ this.state='grumble'; this.t=0; popup('"'+pick(['BLOODY KEA','GET DOWN HERE','I KNOW WHERE YOU NEST','THAT\'S DOC PROPERTY'])+'"','',0,{x:this.x,y:2.2,z:this.z},true); this.chaseKea=null; break; }
        go(k.x,k.z,1.05);
        if(d<1.15&&k.y<2.0&&(k.size||1)<1.6){
          const warrant=this.key==='rex'&&G.wanted>=3;
          if(warrant&&!jailFull()){ this.cageKea(k); }
          else { this.state='shoo'; this.t=0; k.shooed(this,warrant); VOX.play('shoo',this); } }
        break;}
      case 'shoo':
        if(this.t>0.8){ this.state='return'; }
        break;
      case 'flee':{
        const gk=this.nearestKea(14);
        if(!gk||(gk.size||1)<1.6){ this.state='grumble'; this.t=0; break; }
        const dx=this.x-gk.x,dz=this.z-gk.z,dl=Math.max(0.3,Math.hypot(dx,dz));
        this.ry=Math.atan2(dx,dz); this.x+=dx/dl*3.3*dt; this.z+=dz/dl*3.3*dt; moving=1;
        this.x=clamp(this.x,-50,50); this.z=clamp(this.z,-50,50);
        if(dl>12){ this.state='grumble'; this.t=0; }
        break;}
      case 'retrieve':{
        const p=this.fetch;
        if(!p||p.heldBy||p.banked){ this.state='return'; break; }
        if(go(p.x,p.z,0.8)){ this.carry=p; p.heldBy=this; this.state='return'; }
        break;}
      case 'grumble':
        if(this.t>1.4)this.state='return';
        break;
      case 'return':
        if(this.carry){ const p=this.carry;
          const v=new THREE.Vector3(0,1.1,0.35); this.g.localToWorld(v); p.mesh.position.copy(v); p.x=v.x;p.y=v.y;p.z=v.z;
          if(go(p.home.x,p.home.z,0.7)){ p.heldBy=null; this.carry=null;
            p.x=p.home.x;p.y=p.home.y;p.z=p.home.z; p.mesh.position.set(p.x,p.y,p.z);
            popup(this.name+' puts the '+p.name+' back','',0,{x:this.x,y:2,z:this.z},true); }
        } else if(this.key==='dave'&&!this.onLadder){
          if(go(G.ladder.x,G.ladder.z+0.7,0.5)){ this.onLadder=true; }
        } else if(go(this.home.x,this.home.z,0.5)){ this.state='idle'; this.t=0; this.exMark.visible=this.distracted>0; }
        break;
    }
    // dave on his ladder
    if(this.key==='dave'){
      if(this.onLadder&&(this.state==='chase'||this.state==='investigate'||this.state==='retrieve'))this.onLadder=false;
      const targY=this.onLadder?2.5:0;
      this.g.position.y=lerp(this.g.position.y,targY,dt*4);
      if(this.onLadder){ this.x=lerp(this.x,G.ladder.x,dt*4); this.z=lerp(this.z,G.ladder.z+0.6,dt*4);
        this.armR.rotation.x=-1.6+Math.sin(G.time*6)*0.5; }
    }
    this.animate(dt,moving);
  }
  animate(dt,moving){
    if(this.torch){ const on=G.nightT>0.3&&!this.asleep;
      this.torch.spot.intensity=on?(this.state==='chase'?3.0:2.1)*G.nightT*LX_SPOT:0;
      this.torch.lens.visible=!!on;
      if(this.torch.beam){ this.torch.beam.visible=!!on;
        this.torch.beam.material.opacity=(this.state==='chase'?0.13:0.075)*G.nightT; }
      const sweep=(this.state==='chase')?0:Math.sin(G.time*0.85+2)*0.55;
      this.torch.g.rotation.y=lerp(this.torch.g.rotation.y||0,sweep,dt*4);
      if(on){ for(const k of G.keas){ if((k.caged||0)>0)continue;
        const dx=k.x-this.x,dz=k.z-this.z,d=Math.hypot(dx,dz);
        let inBeam=false;
        if(d<13&&k.y<3){ const facing=this.ry+this.torch.g.rotation.y;
          const ang=Math.abs(((Math.atan2(dx,dz)-facing+Math.PI*3)%(Math.PI*2))-Math.PI);
          if(ang<0.4){ let blocked=false;
            for(let si=1;si<=5&&!blocked;si++){ const f=si/5,px=this.x+dx*f,pz=this.z+dz*f,py=1.0+(k.y+0.4-1.0)*f;
              for(const c of G.colliders){ if(!c.solid||c.kind!=='box')continue;
                let ax=px-c.x,az=pz-c.z;
                if(c.ry){const sn=Math.sin(c.ry),cs=Math.cos(c.ry);const lx=ax*cs-az*sn,lz=ax*sn+az*cs;ax=lx;az=lz;}
                if(Math.abs(ax)<c.w&&Math.abs(az)<c.d&&py<c.top){blocked=true;break;} } }
            if(!blocked){ inBeam=true; k._beamT=(k._beamT||0)+dt;
              if(k._beamT>0.55&&this.distracted<=0&&this.state!=='chase'){
                k._beamT=-2.5; heat(0.8); this.aggro(k);
                popup('SPOTTED IN THE BEAM','',0,{x:k.x,y:k.y+1.2,z:k.z},true);
                RUMBLE(k.idx,200,0.7); if(G._spotSpy)G._spotSpy.push({idx:k.idx}); } } } }
        if(!inBeam)k._beamT=Math.max(0,(k._beamT||0)-dt*2);
      } } }
    if(!this.launched&&!this.onLadder&&this.sprawl<=0)pushOut(this,0.34);
    this.g.position.x=this.x; this.g.position.z=this.z; this.g.rotation.y=this.ry;
    this.walkPh+=dt*(moving?9:2);
    const sw=moving?0.55:0;
    this.legL.rotation.x=Math.sin(this.walkPh)*sw; this.legR.rotation.x=-Math.sin(this.walkPh)*sw;
    const angry=this.state==='chase'||this.state==='shoo';
    if(this.exMark){ if(this.state==='investigate'){ this.exMark.visible=true; this.exMark.scale.setScalar(0.72+0.12*Math.sin(this.t*6)); }
      else this.exMark.scale.setScalar(1); }
    if(this.key==='dave'&&this.onLadder){ this.armL.rotation.x=lerp(this.armL.rotation.x,-0.4,dt*6); }
    else{
      this.armL.rotation.x=lerp(this.armL.rotation.x,angry?-2.6+Math.sin(G.time*14)*0.3:Math.sin(this.walkPh)*sw*0.8,dt*8);
      this.armR.rotation.x=lerp(this.armR.rotation.x,angry?-2.6-Math.sin(G.time*14)*0.3:-Math.sin(this.walkPh)*sw*0.8,dt*8);
    }
    if(this.state==='shoo'){ this.g.position.z+=Math.sin(this.t*12)*0.01; }
    this.exMark.visible=(angry||this.state==='investigate'||this.distracted>0)&&!this.asleep;
    this.exMark.rotation.y=G.time*3;
  }
}

/* ---------- traffic ---------- */
G.trafT={a:2,b:7};
function roadObstructionAhead(car){
  const dir=car.dir, lookMax=6.5;
  // cones or heavy props on the road
  for(const p of G.props){
    if(p.heldBy||p.banked)continue;
    if(!(p.cone||p.heavy))continue;
    if(Math.abs(p.z-34)>4.2)continue;
    const ahead=(p.x-car.x)*dir;
    if(ahead>0.5&&ahead<lookMax&&Math.abs(p.z-car.z)<2.6)return 'cone';
  }
  // grounded kea on the road
  for(const k of G.keas){
    const ks=k.size||1;
    if(k.y>1.1*ks)continue; if(Math.abs(k.z-34)>4.4)continue;
    const ahead=(k.x-car.x)*dir;
    if(ahead>0.5&&ahead<5&&Math.abs(k.z-car.z)<2.2*(0.5+0.5*ks))return 'kea';
  }
  // queued car ahead
  for(const c of G.cars){
    if(c===car||!c.traffic||c.dir!==car.dir)continue;
    const ahead=(c.x-car.x)*dir;
    if(ahead>0.5&&ahead<6&&c.speed<2)return 'car';
  }
  return null;
}
function updateTraffic(dt){
  /* THE ROAD TEST IS IN THE SPAWNER AND NOWHERE ELSE. The first version of TODO 39 also returned
     early here, and no sabotage could break it: spawnTraffic refuses a map with no road anyway, so
     the extra condition was a strict subset that could never change the answer - the same shape as
     the match term piece 25 put in tabDocked and then took back out. One place, one truth, and a
     test that can reach it. */
  if(!G.running)return;
  G.trafT.a-=dt; G.trafT.b-=dt;
  const trafficCount=G.cars.filter(c=>c.traffic).length;
  if(G.trafT.a<=0&&trafficCount<7){ spawnTraffic(1); G.trafT.a=rnd(6,13); }
  if(G.trafT.b<=0&&trafficCount<7){ spawnTraffic(-1); G.trafT.b=rnd(7,14); }
  let stoppedByMischief=0;
  for(let i=G.cars.length-1;i>=0;i--){
    const c=G.cars[i]; if(!c.traffic)continue;
    const ob=roadObstructionAhead(c);
    if(ob)c.speed=Math.max(0,c.speed-14*dt); else c.speed=Math.min(8,c.speed+5*dt);
    c.x+=c.speed*c.dir*dt;
    { // respect the car ahead — overlap impossible by construction (2026-08-26)
      let lead=null,ld=1e9;
      for(const o of G.cars){ if(o===c||!o.traffic||o.dir!==c.dir)continue;
        const ah=(o.x-c.x)*c.dir; if(ah>0&&ah<ld){ld=ah;lead=o;} }
      const GAP=3.4;
      if(lead&&ld<GAP){ c.x=lead.x-GAP*c.dir; c.speed=Math.min(c.speed,lead.speed*0.9); }
    }
    c.g.position.x=c.x; c.collider.x=c.x;
    if(c.speed<0.4&&ob){ c.stopT+=dt; if(ob!=='car')c.rootCause=ob;
      if(ob==='cone'||ob==='kea'||c.stopT>1)stoppedByMischief++;
      c.honkT-=dt;
      if(c.honkT<=0){ AU.honk(c.stopT>5); c.honkT=rnd(1.8,4); if(c.stopT>2)heat(0.6);
        for(const kk of G.keas){ if(Math.hypot(kk.x-c.x,kk.z-c.z)<6){ RUMBLE(kk.idx,130,0.5); if(G._rumbleSpy)G._rumbleSpy.push({i:kk.idx,why:'honk'}); } }
        for(const k of G.keas){ if(Math.abs(k.x-c.x)<1.35&&Math.abs(k.z-c.z)<2.4&&k.y>1.1){ done('roofhonk'); if(!G._rhk){G._rhk=1;award(20,'HONKED AT. UNMOVED.',k.pos(),k);} }
          if(k.grounded&&Math.abs(k.z-34)<2&&k.y<0.5&&Math.abs(k.x-c.x)<8)done('q_median'); }
        if(c.bodyG){const bg=c.bodyG; TW.add(0.4,u=>{bg.position.y=Math.sin(u*Math.PI*3)*0.05*(1-u); bg.rotation.x=Math.sin(u*Math.PI*2)*0.02*(1-u);});} }
      if(c.stopT>6&&!c.driverOut&&G.humans.filter(h=>h.driverCar).length<2&&(ob==='cone'||ob==='kea')){
        c.driverOut=true;
        const d=new Human('driver'+i,'Angry Driver',pick([0x9C5AA0,0x666E76,PAL.blue]),c.x,c.z+2.2*(c.dir),{hat:'beanie',driverCar:c,speedMul:1.1});
        d.home={x:c.x,z:c.z+2.2*c.dir}; G.humans.push(d); VOX.play('cone',d,3);
        const k=d.nearestKea(14); if(k)d.aggro(k,0.4);
        popup('A DRIVER GETS OUT','uh oh',0,{x:c.x,y:2,z:c.z},true);
      }
      if(c.stopT>9&&!c.chipThrown){ c.chipThrown=true;
        {const ch=spawnLoose('hot chip',PB.chip,{x:c.x,y:1.2,z:c.z+1.6*c.dir},{food:true}); ch.vz=2.6*c.dir; ch.vy=2.8;}
        popup('DRIVER THROWS A CHIP','the cone trick works',0,{x:c.x,y:2,z:c.z},true); }
    } else { c.stopT=0;
      if(c.driverOut){ const d=G.humans.find(h=>h.driverCar===c);
        if(d&&d.state!=='chase'){ removeHuman(d); c.driverOut=false; } }
    }
    if(Math.abs(c.x)>118){ // despawn
      G.scene.remove(c.g);
      const ci=G.colliders.indexOf(c.collider); if(ci>=0)G.colliders.splice(ci,1);
      for(let q=G.inter.length-1;q>=0;q--){ if(G.inter[q].car===c)G.inter.splice(q,1); }
      const d=G.humans.find(h=>h.driverCar===c); if(d)removeHuman(d);
      G.cars.splice(i,1);
    }
  }
  if(stoppedByMischief>=2){ G.jamAge=(G.jamAge||0)+dt;
    const _jm=G.missions.find(m=>m.id==='jam');
    if(G.jamAge>1.2&&_jm&&!_jm.done){ done('jam'); G.stats.jams++; award(55,'TRAFFIC: JAMMED',{x:0,y:2,z:34});
      if(G.cars.some(c=>c.traffic&&c.speed<0.4&&c.rootCause==='kea'))done('b_body'); }
  } else G.jamAge=0;
}
function removeHuman(h){ G.scene.remove(h.g); const i=G.humans.indexOf(h); if(i>=0)G.humans.splice(i,1); }

/* ---------- sheep ---------- */
function registerSheepPecks(){
  for(const s of G.sheep){
    addPeck({label:'PECK SHEEP (rude)',needHits:1,repeat:true,mesh:s.g,getPos:()=>({x:s.x,y:0.7,z:s.z}),range:1.5,owner:null,
      onDone(p){ if(s.panic<=0&&(!s.cd||s.cd<=0)){ s.cd=9; award(15,'SHEEP: RATTLED',p); } s.panic=4; AU.baa(); burst(p,0xF2F2EE,4); }});
  }
}
function updateSheep(dt){
  for(const s of G.sheep){
    s.cd=Math.max(0,(s.cd||0)-dt); s.y=0;
    let nk=null,nd=1e9;
    for(const k of G.keas){ const d=Math.hypot(k.x-s.x,k.z-s.z); if(d<nd){nd=d;nk=k;} }
    const scareR=3.4+(((nk&&nk.size)||1)-1)*1.6;
    if(nk&&nd<scareR&&nk.y<2.4){ // HERDING: driven away from the bird
      s.calmT=0; s.mode='herd';
      const away=Math.atan2(s.x-nk.x,s.z-nk.z);
      s.ry+=wrapAng(away-s.ry)*Math.min(1,dt*6);
      const sp=2.3+(s.panic>0?1.0:0);
      s.x+=Math.sin(s.ry)*sp*dt; s.z+=Math.cos(s.ry)*sp*dt;
      s.g.position.y=Math.abs(Math.sin(G.time*11+s.x))*0.14;
      if((s.baaT=(s.baaT||0)-dt)<=0){ AU.baa(); s.baaT=rnd(1.2,3.2); }
    } else if(s.panic>0){ s.panic-=dt; s.calmT=0; s.mode='panic';
      s.ry+=Math.sin(G.time*7+s.x)*3*dt;
      s.x+=Math.sin(s.ry)*3.2*dt; s.z+=Math.cos(s.ry)*3.2*dt;
      s.g.position.y=Math.abs(Math.sin(G.time*12))*0.15;
      if(Math.random()<dt*0.7)AU.baa();
    } else {
      s.calmT=(s.calmT||0)+dt;
      const hd=Math.hypot(s.home.x-s.x,s.home.z-s.z);
      if(s.calmT>15&&hd>1.6){ s.mode='home'; // the slow, put-upon trudge back
        s._hT=(s._hT||0)+dt;
        if(s._hT>1.1){ s._hT=0; if(hd>(s._hLast!==undefined?s._hLast:1e9)-0.06){ s._hN=(s._hN||0)+1; if(s._hN>=3){s._hSlip=-(s._hSlip||1);s._hN=0;} else s._hSlip=s._hSlip||1; s._hSlipT=2.6; } else s._hN=0; s._hLast=hd; }
        s._hSlipT=Math.max(0,(s._hSlipT||0)-dt);
        let want=Math.atan2(s.home.x-s.x,s.home.z-s.z);
        if(s._hSlipT>0)want+=(s._hSlip||1)*1.25; // shoulder round whatever is in the way
        s.ry+=wrapAng(want-s.ry)*Math.min(1,dt*3);
        s.x+=Math.sin(s.ry)*0.55*dt; s.z+=Math.cos(s.ry)*0.55*dt;
        s.g.position.y=Math.abs(Math.sin(G.time*6+s.z))*0.07;
        if(Math.random()<dt*0.08)AU.baa();
      } else { s.mode='graze'; s.g.position.y=0; s.ry+=Math.sin(G.time*0.3+s.z)*0.2*dt; }
    }
    for(const o of G.sheep){ if(o===s)continue; const d=Math.hypot(o.x-s.x,o.z-s.z);
      if(d<0.9&&d>0.001){ s.x+=(s.x-o.x)/d*0.5*dt; s.z+=(s.z-o.z)/d*0.5*dt; } }
    s.x=clamp(s.x,-51,51); s.z=clamp(s.z,-51,51);
    pushOut(s);
    s.g.position.x=s.x; s.g.position.z=s.z; s.g.rotation.y=s.ry;
  }
}

/* ============================================================
   MISSIONS · SCORE · UI
   ============================================================ */
function defineMissions(mode,opts){
  if(opts&&opts.colossal){
    const T1='STAGE I — SPARROW-SIZED',T2='STAGE II — GETTING BIGGER (LV3)',T3='STAGE III — BIG (LV5)',T4='STAGE IV — TOWERING (LV7)';
    G.missions=[
      {id:'wiper',area:T1,label:'Relieve three cars of their wipers',need:3,n:0},
      {id:'c_snack',area:T1,label:'Steal any meal; scoff it at the nest'},
      {id:'jam',area:T1,label:'Bring the traffic to a standstill'},
      {id:'slide',area:T1,label:'Toboggan down the hut roof'},
      {id:'c_coneair',area:T2,label:'Carry a road cone into the SKY (you\'re strong now)',locked:()=>G.level<3},
      {id:'c_sololatch',area:T2,label:'Crack the chilly bin ALONE — one enormous beak will do',locked:()=>G.level<3},
      {id:'c_solotarp',area:T2,label:'THE BIG PULL, solo',locked:()=>G.level<3},
      {id:'snow',area:T2,label:'Peck the hut\'s roof snow down onto somebody below',locked:()=>G.level<3},
      {id:'c_stomp3',area:T3,label:'STOMP three humans off their feet at once',locked:()=>G.level<5},
      {id:'c_bunt',area:T3,label:'Shove three cars right out of their lane',need:3,n:0,locked:()=>G.level<5},
      {id:'pielift',area:T3,label:'Take the pie. Dave can see you. Dave cannot stop you.',locked:()=>G.level<5},
      {id:'c_fleeall',area:T4,label:'Make every human on the mountain flee at once',locked:()=>G.level<7},
      {id:'sign',area:T4,label:'Retire the DO NOT FEED THE KEA sign. Permanently.',locked:()=>G.level<7},
      {id:'c_apex',label:'COLOSSUS — at full size, perch the ridge and screech at the dawn',finale:true,locked:()=>G.level<MAXLVL},
    ];
    G.chapters=null; G.needHydrate=true; renderTodo(); return;
  }
  /* THE TO-DO LIST BELONGS TO THE MAP (TODO 40). This function was one hardcoded carpark list, and
     TODO 39 shipped a second map that therefore opened with the CARPARK to-do list on it - eight
     pages of jobs about a campervan, a hut and a road, none of which are on the mountain and none of
     which can be finished there. The same class of lie as the cage hint in 55 and the carpark
     teaching in 58, and the same fix a third time: an owner. The list is declared beside the builder,
     and a biome that declares none gets the carpark one, which is what every stub in the batteries
     expects and what the colossal branch above has always been.
     THE FINALE IS PART OF THE DECLARATION, and it had to be: missionDone reached for the mission
     whose id is literally apex and unlocked it with no guard, so the first map to declare a list
     without one would have thrown on completing its last job. Every reader goes through the finale
     FLAG now, and the finale carries its own arming check - because four humans in pursuit is a
     carpark sentence and there is nobody at all on the ski field. */
  (biomeOf(G.biome).missions||missionsCarpark)(mode);
  renderTodo();
}
function missionsCarpark(mode){
  // v5 (2026-08-26): to-do list rewritten in the Untitled-Goose grammar — grouped by area,
  // imperative, specific, and rude. Same ids, same detectors; six new tasks appended.
  const A={cp:'THE CARPARK',hut:'THE HUT',camp:'THE CAMPSITE',road:'THE ROAD',ski:'THE SKI FIELD',tr:'THE TRAILHEAD',pad:'THE PADDOCK & NEST',co:'TOGETHER'};
  G.chapters=[A.cp,A.camp,A.hut,A.road,A.ski,A.tr,A.pad,A.co]; G.chapIdx=0; G.needHydrate=true;
  G.missions=[
    {id:'wiper',  area:A.cp,  label:'Relieve three cars of their windscreen wipers',need:3,n:0},
    {id:'roofhonk',area:A.cp, label:'Ride a moving car\'s roof until the driver honks'},
    {id:'seal',   area:A.cp,  label:'Peel the entire rubber seal off the campervan door'},
    {id:'duet2',  area:A.cp,  hide:mode!==2, label:''},
    {id:'spikes', area:A.hut, label:'Evict all six anti-kea spikes from the beam',need:6,n:0},
    {id:'pielift',area:A.hut, label:'Steal Dave\'s pie while he\'s up the ladder'},
    {id:'slide',  area:A.hut, label:'Toboggan down the hut roof (they really do this)'},
    {id:'snow',   area:A.hut, label:'Peck the hut\'s roof snow down onto somebody below'},
    {id:'sandwich',area:A.camp,label:'Steal a sandwich; scoff it at the nest'},
    {id:'wake',   area:A.camp,label:'Screech the sleeping tramper awake'},
    {id:'can',    area:A.camp,label:'Raid the bin for something shiny'},
    {id:'passport',area:A.camp,label:'Pinch the passport from the handbag; stash it at your nest'},
    {id:'jam',    area:A.road,label:'Bring the morning traffic to a standstill'},
    {id:'bootroad',area:A.road,label:'Leave one boot in the middle of the road'},
    {id:'airmail',area:A.road,label:'Deliver something by air mail (drop it from great height)'},
    {id:'r_paddle',area:A.road,label:'Flip the roadworks paddle at the verge'},
    {id:'q_peck', area:A.cp,  label:'Give the DOC ute a good hard peck'},
    {id:'q_table',area:A.cp,  label:'Clear the picnic table entirely'},
    {id:'q_pegs', area:A.camp,label:'Steal all three clothes pegs',need:3,n:0},
    {id:'q_chimney',area:A.hut,label:'Stand on the chimney like you own the place'},
    {id:'q_median',area:A.road,label:'Get honked at from the centre line, on foot'},
    {id:'q_muster',area:A.pad, label:'Herd a sheep all the way onto the road'},
    {id:'q_twine', area:A.pad, label:'Chew through the baling twine holding the paddock gate shut'},
    {id:'s_ski',  area:A.ski, label:'Relocate somebody\'s ski beyond the snowline'},
    {id:'s_pole', area:A.ski, label:'Make off with a ski pole'},
    {id:'s_binding',area:A.ski,label:'Chew a binding, thoroughly'},
    {id:'s_goggles',area:A.ski,label:'Help yourself to the ski goggles, and wear them'},
    {id:'s_lift', area:A.ski, label:'Perch the spinning tow wheel'},
    {id:'t_pack', area:A.tr,  label:'Unzip the unattended pack'},
    {id:'t_bar',  area:A.tr,  label:'Scoff the muesli bar at your nest'},
    {id:'t_pole2',area:A.tr,  label:'Redistribute both walking poles',need:2,n:0},
    {id:'t_sign', area:A.tr,  label:'Revise the 3 HR RETURN sign'},
    {id:'t_sock', area:A.tr,  label:'Liberate the woollen sock under the boot rail'},
    {id:'keys',   area:A.pad, label:'Confiscate the ranger\'s ute keys'},
    {id:'sign',   area:A.pad, label:'Retire the DO NOT FEED THE KEA sign'},
    {id:'paddock',area:A.pad, label:'Get a driver out of his car, then lead the chase into the sheep paddock'},
    {id:'grumble3',area:A.pad,label:'Have three humans grumbling at once'},
  ].filter(m=>!m.hide&&m.id!=='duet2');
  if(mode===2)G.missions.push(
    {id:'coop_bin',area:A.co,label:'Crack the chilly bin together; liberate the pavlova',coop:true},
    {id:'tarp',   area:A.co,label:'THE BIG PULL — de-tarp the trailer, both beaks',coop:true},
    {id:'radio',  area:A.co,label:'One kea distracts the ranger; the other nicks his radio',coop:true},
    {id:'duet',   area:A.co,label:'Duet screech from the campervan roof',coop:true}
  );
  const AW='TO DO (AS WELL)';
  G.missions.push(
    {id:'b_beanie',area:AW,bonus:true,locked:true,label:'Steal the beanie off the sleeping tramper\'s head — and wear it'},
    {id:'b_cap',   area:AW,bonus:true,locked:true,label:'Screech the ranger\'s cap clean off'},
    {id:'b_dress', area:AW,bonus:true,locked:true,label:'Get dressed up, then luge the roof in your new hat'},
    {id:'b_boot2', area:AW,bonus:true,locked:true,label:'Lose BOTH of the tramper\'s boots beyond recovery'},
    {id:'b_body',  area:AW,bonus:true,locked:true,label:'Stop the traffic using only your body'},
    {id:'b_five',  area:AW,bonus:true,locked:true,label:'Stash five shinies in one nest'}
  );
  /* THE CARPARK FINALE CARRIES ITS OWN ARMING, which is where checkFinale used to keep it: four
     humans in pursuit, and then home to the nest. Written here so the map that needs a cast to
     finish says so itself. */
  G.missions.push({id:'apex',label:'APEX MENACE — four humans in pursuit, then home to the nest',finale:true,locked:true,
    arm:()=>G.humans.filter(h=>h.state==='chase').length>=4,
    armText:{t:'FULL PURSUIT!',s:'NOW — TO THE NEST!'},
    check:()=>G.keas.some(k=>dist2(k.x,k.z,G.nestPos.x,G.nestPos.z)<2.6&&Math.abs(k.y-G.nestY)<1.4)});
}
/* ---------- THE CLUB FIELD TO-DO LIST (TODO 40) ----------
   EIGHT JOBS AND A FINALE, on two pages, and every one of them is answerable by the diorama TODO 39
   built - no cast, no new verb, nothing that needs a human to walk into shot. The signature acts the
   brief names are NOT here and the reason is written into TODO 40b: the tray-slide down the groomed
   band is a new chaos verb, the tow ride is a second one, and the deck lunch raids and buried
   lunchboxes need both a cast to steal from and food props, which shadow a counted economy if they
   are put out carelessly (FLAKES law 6). Those are content pieces with their own proofs.
   WHAT IS HERE IS DETECTABLE AND FINISHABLE, which is the bar for shipping a list at all: three
   poles and a pair of goggles carry their missions the way the carpark props do, the boot is a
   missionFar relocation, and the four that are about PLACE carry their own check(). Nothing up here
   answers a carpark mission and nothing in the carpark answers one of these. */
function missionsSkifield(mode){
  const A={tow:'THE ROPE TOW', lodge:'THE DAY LODGE'};
  G.chapters=[A.tow,A.lodge]; G.chapIdx=0; G.needHydrate=true;
  const anyKea=fn=>()=>G.keas.some(fn);
  const settled=k=>Math.abs(k.vy||0)<0.7;                  // standing on it, not falling past it
  const onPiste=p=>p.x>=SKIPISTE.x0&&p.x<=SKIPISTE.x1&&p.z>=SKIPISTE.z0&&p.z<=SKIPISTE.z1;
  G.missions=[
    {id:'k_poles', area:A.tow, label:'Redistribute all three ski poles',need:3,n:0},
    {id:'k_wheel', area:A.tow, label:'Perch the spinning bull wheel',
      check:anyKea(k=>!!G.towWheel&&Math.abs(k.x-G.towWheel.position.x)<1.1&&
        Math.abs(k.z-G.towWheel.position.z)<1.1&&Math.abs(k.y-G.towWheel.position.y)<0.85)},
    {id:'k_shed',  area:A.tow, label:'Supervise the tow from the roof of its own engine shed',
      check:anyKea(k=>Math.abs(k.x-SKITOW.x)<1.7&&Math.abs(k.z-SKITOW.base)<1.3&&k.y>=2.0&&settled(k))},
    {id:'k_ski',   area:A.tow, label:'Leave somebody ski out on the groomed band',
      check:()=>G.props.some(p=>p.name==='ski'&&!p.heldBy&&!p.banked&&onPiste(p))},
    {id:'k_goggles',area:A.lodge,label:'Help yourself to the ski goggles, and wear them'},
    {id:'k_roof',  area:A.lodge,label:'Stand on the day lodge roof like you own the place',
      check:anyKea(k=>Math.abs(k.x-SKILODGE.x)<SKILODGE.w/2&&Math.abs(k.z-SKILODGE.z)<SKILODGE.d/2&&
        k.y>SKILODGE.h&&settled(k))},
    {id:'k_boot',  area:A.lodge,label:'Lose one ski boot, thoroughly'},
    {id:'k_stash', area:A.lodge,label:'Furnish the nest with three pieces of other people kit',
      check:()=>G.props.filter(p=>p.banked).length>=3},
  ];
  /* THE COOP BADGE, and it is a coop badge because it cannot be done alone: both birds on the roof
     at once, which one bird cannot be. */
  if(mode===2)G.missions.push({id:'k_duet',area:A.lodge,coop:true,
    label:'Get BOTH beaks up on the lodge roof at once',
    check:()=>G.keas.length>1&&G.keas.every(k=>Math.abs(k.x-SKILODGE.x)<SKILODGE.w/2&&
      Math.abs(k.z-SKILODGE.z)<SKILODGE.d/2&&k.y>SKILODGE.h)});
  /* THE FINALE NEEDS NO ARMING, which is the honest reading of a map with nobody on it: there is
     nothing that has to happen first, so it is live the moment the list is done. The top station is
     the far end of the tow and the highest thing a bird can perch up there. */
  G.missions.push({id:'k_summit',finale:true,locked:true,
    label:'THE SUMMIT — perch the top station and look at what you have done',
    armText:{t:'ONE THING LEFT',s:'THE TOP STATION — ALL THE WAY UP'},
    check:()=>G.keas.some(k=>Math.hypot(k.x-SKITOW.x,k.z-SKITOW.top)<1.9&&k.y>2.6)});
}
function missionsCampground(mode){
  const A={loop:'THE CAMP LOOP', shelter:'THE SHELTER'};
  G.chapters=[A.loop,A.shelter]; G.chapIdx=0; G.needHydrate=true;
  const anyKea=fn=>()=>G.keas.some(fn);
  const settled=k=>Math.abs(k.vy||0)<0.7;                  // standing on it, not falling past it
  /* A BARE SITE IS ONE NOBODY IS CAMPED ON, read off the same table the map was built from rather
     than from four numbers copied down here — the sites move, the mission follows. */
  const bareSites=CAMPSITES.filter(s=>!s.occupied);
  const atBareSite=p=>bareSites.some(s=>Math.hypot(p.x-s.x,p.z-s.z)<2.6);
  const nearTap=p=>Math.hypot(p.x-CAMPTAP.x,p.z-CAMPTAP.z)<1.1;
  G.missions=[
    /* THE CAMP LOOP — the two occupied sites, and the soft things on them */
    {id:'c_guyline',area:A.loop,label:'Chew through both of the tent guy lines',need:2,n:0},
    {id:'c_boot',   area:A.loop,label:'Rehome a tramping boot to somebody else site',
      check:()=>G.props.some(p=>p.name==='tramping boot'&&!p.heldBy&&!p.banked&&atBareSite(p))},
    {id:'c_line',   area:A.loop,label:'Take all three things off the washing line',need:3,n:0},
    {id:'c_chair',  area:A.loop,label:'Tip the camp chair over, on principle'},
    {id:'c_chilly', area:A.loop,label:'Get into the chilly bin under the awning'},
    /* THE SHELTER — the shared structures everybody has to walk to */
    {id:'c_honesty',area:A.shelter,label:'Work the honesty box open and scatter the takings'},
    {id:'c_bin',    area:A.shelter,label:'Prove the rat-proof bin is not kea-proof'},
    {id:'c_roof',   area:A.shelter,label:'Hold the cook shelter roof against all comers',
      check:anyKea(k=>Math.abs(k.x-CAMPSHELTER.x)<CAMPSHELTER.w/2&&
        Math.abs(k.z-CAMPSHELTER.z)<CAMPSHELTER.d/2&&k.y>CAMPSHELTER.h&&settled(k))},
    {id:'c_tap',    area:A.shelter,label:'Leave something of somebody else in the tap puddle',
      check:()=>G.props.some(p=>!p.heldBy&&!p.banked&&nearTap(p))},
    {id:'c_stash',  area:A.shelter,label:'Furnish the nest with three pieces of other people kit',
      check:()=>G.props.filter(p=>p.banked).length>=3},
  ];
  /* THE COOP BADGE IS A COOP BADGE BECAUSE ONE BIRD CANNOT DO IT: both beaks on the shelter roof at
     once, which is the same honest test the ski field's duet uses. */
  if(mode===2)G.missions.push({id:'c_duet',area:A.shelter,coop:true,
    label:'Get BOTH beaks up on the cook shelter roof at once',
    check:()=>G.keas.length>1&&G.keas.every(k=>Math.abs(k.x-CAMPSHELTER.x)<CAMPSHELTER.w/2&&
      Math.abs(k.z-CAMPSHELTER.z)<CAMPSHELTER.d/2&&k.y>CAMPSHELTER.h)});
  /* THE FINALE IS DECLARED WITH THE MISSION, which is piece 40's seam and the reason this map does
     not inherit the carpark's sentence — four-in-pursuit-then-the-nest needs a cast of four and a
     jail, and this map has three campers and no cage. Standing on the board that tells everyone the
     rules is the campground's version of the same joke. */
  G.missions.push({id:'c_gate',finale:true,locked:true,
    label:'THE NOTICE — read the rules from the top of the board that lists them',
    armText:{t:'ONE THING LEFT',s:'THE INFORMATION BOARD — FROM ABOVE'},
    check:()=>G.keas.some(k=>Math.hypot(k.x-CAMPBOARD.x,k.z-CAMPBOARD.z)<1.6&&k.y>2.0)});
}
function markMission(id){
  const m=G.missions.find(m=>m.id===id); if(!m||m.done)return;
  if(m.need!==undefined)prog(id); else done(id);
}
function prog(id){
  const m=G.missions.find(m=>m.id===id); if(!m||m.done)return;
  m.n=(m.n||0)+1;
  if(m.n>=m.need){ m.done=true; missionDone(m); }
  renderTodo();
}
function done(id){
  const m=G.missions.find(m=>m.id===id); if(!m||m.done)return;
  m.done=true; missionDone(m); renderTodo(); SAVE.write();
}
function missionDone(m){
  purseClaim(m.area);   // what this page paid for this mission, whichever order the handler used
  AU.tick(); AU.ding();
  popup('✓ '+m.label.toUpperCase(),'',0,null,false,true);
  flashTodo();
  const open=G.missions.filter(x=>!x.finale&&!x.bonus&&!x.done);
  if(G.colossal)return;
  if(G.chapters){
    syncClearedStars();
    let moved=false;
    while(G.chapIdx<G.chapters.length-1){
      const rows=G.missions.filter(x=>x.area===G.chapters[G.chapIdx]&&!x.finale&&!x.hide&&!x.bonus);
      if(rows.length&&!rows.every(x=>x.done))break;
      pageClose(G.chapters[G.chapIdx]); styleQueue(G.chapters[G.chapIdx]);
      G.chapIdx++; moved=true;
    }
    if(moved){ pageOpen(curPage());
      popup('PAGE TURNED','NOW: '+G.chapters[G.chapIdx],0,null,true); AU.ding(); flashTodo(); }
  }
  if(open.length===0&&!G.finaleOn){
    /* THE FLAG, NOT THE ID (TODO 40). This read G.missions.find(x=>x.id==='apex') and then set a
       property on it with no guard, so the first map to declare a list without a mission called apex
       threw on finishing its last job - in the one code path a player only reaches once. */
    G.finaleOn=true; const f=G.missions.find(x=>x.finale); if(f)f.locked=false;
    let aw=0; for(const x of G.missions)if(x.bonus&&x.locked){x.locked=false;aw++;}
    renderTodo();
    popup('THE LIST IS DONE','ONE THING LEFT…',0,null,true); AU.fanfare();
    if(aw)setTimeout(()=>popup('…AND A SECOND PAGE APPEARS','TO DO (AS WELL)',0,null,true),900);
  }
}
function checkMisc(){
  if(G.missions.length===0)return;
  /* A DETECTOR CAN BELONG TO ITS MISSION (TODO 40), and this loop is the seam that let the ski field
     have a to-do list at all. Everything below this point is a CARPARK detector behind a carpark
     guard - the chimney, the tow wheel, the sheep on the road, the cleared picnic table - and a
     second map could not add one without editing another map code. A mission may carry check(),
     which is called for exactly as long as it is unlocked and undone. The finale is skipped here
     because checkFinale owns it: it has to be armed first. */
  for(const m of G.missions){ if(m.finale||m.done||!m.check)continue;
    const lk=(typeof m.locked==='function')?m.locked():m.locked; if(lk)continue;
    if(m.check())markMission(m.id); }
  if(!G.missions.find(m=>m.id==='grumble3'||m.id==='paddock'))return;
  let gr=0;
  for(const h of G.humans){ if(h.state==='grumble')gr++;
    if(h.driverCar&&G.pen&&Math.abs(h.x-G.pen.x)<G.pen.w&&Math.abs(h.z-G.pen.z)<G.pen.d)done('paddock'); }
  if(gr>=3)done('grumble3');
  // quickie detectors (2026-08-27)
  if(G.chimneyRef&&!G._chCol){ const wp=new THREE.Vector3(); G.chimneyRef.getWorldPosition(wp);
    G.colliders.push({kind:'box',solid:true,x:wp.x,z:wp.z,w:0.46,d:0.46,top:wp.y-0.05}); G._chCol=wp; }
  for(const k of G.keas){
    if(G._chCol){ const wp=G._chCol;
      if(Math.abs(k.x-wp.x)<0.9&&Math.abs(k.z-wp.z)<0.9&&Math.abs(k.y-wp.y)<1.2&&Math.abs(k.vy||0)<0.6)done('q_chimney'); }
    if(G.towWheel&&Math.abs(k.x-G.towWheel.position.x)<1.0&&Math.abs(k.z-G.towWheel.position.z)<1.0&&Math.abs(k.y-2.2)<0.75)done('s_lift');
  }
  for(const sh of G.sheep){ if(Math.abs(sh.z-34)<2.2)done('q_muster'); }
  if(!G._qtDone){ const tp=G.props.filter(p=>p.home&&dist2(p.home.x,p.home.z,15,-13)<3.2);
    if(tp.length>=3&&tp.every(p=>p.heldBy||dist2(p.x,p.z,p.home.x,p.home.z)>4)){ G._qtDone=1; done('q_table'); } }
  if(G.colossal&&G.humans.length>=4){
    const fleeing=G.humans.filter(h=>h.state==='flee'||h.launched||h.sprawl).length;
    if(fleeing>=G.humans.length)done('c_fleeall');
  }
}
/* THE FINALE IS THE MAP FINALE (TODO 40). All of this used to be the carpark sentence written out in
   engine code - four humans in pursuit, then home to the nest - so a map with nobody on it could
   never have finished, and the ski field has nobody on it by declaration. The two halves are
   declared beside the mission now: arm() is what has to become true before the last act is possible,
   check() is the last act. A finale with no arm() is armed the moment the list is done, which is the
   honest reading for a map where nothing has to happen first. */
function checkFinale(){
  if(G.colossal)return; // colossal has its own summit
  if(!G.finaleOn||G.won)return;
  const f=(G.missions||[]).find(m=>m.finale); if(!f)return;
  if(!G.apexArmed&&(!f.arm||f.arm()))G.apexArmed=true;
  if(G.apexArmed&&!G.apexNoted){ G.apexNoted=true;
    const t=f.armText||{t:'THE LAST ONE',s:''}; popup(t.t,t.s,0,null,true); AU.fanfare(); }
  if(G.apexArmed&&f.check&&f.check())winGame();
}
function winGame(){
  if(G.won)return; G.won=true;
  { const f=(G.missions||[]).find(m=>m.finale); if(f)done(f.id); }   // TODO 40: whichever map you finished
  AU.fanfare(); setTimeout(()=>AU.screech(),400);
  const s=G.stats;
  el('winstats').innerHTML=
    'CHAOS SCORE: <b>'+G.score+'</b> · PEAK CHAOS: <b>'+Math.round(G.chaosPeak||0)+'</b> · TIME: <b>'+fmtT(G.playT||0)+'</b><br>'+
    s.wipers+' wipers liberated · '+s.shinies+' shinies stashed · '+s.screeches+' screeches<br>'+
    s.jams+' traffic jam · '+(s.slides||0)+' roof luges · '+s.snow+' snow victims · '+s.food+' meals stolen · shooed '+s.shooed+'×<br><br>'+
    (G.colossal?('Final size: LV'+G.level+' — '+Math.round(sizeForLevel(G.level)*100)+'% kea.<br>'+(G.stats.stomps||0)+' stomps · '+(G.stats.bowls||0)+' humans bowled · '+(G.stats.bunts||0)+' cars bunted.<br>The mountain has a new landlord.')
    :'The Department of Conservation would like a word.<br>The kea gym remains untouched, as is tradition.');
  if(!HEADLESS)document.getElementById('win').style.display='flex';
}

/* score / combo / popups */
function bumpCombo(){ G.comboT=5; G.combo=Math.min(5,(G.comboArmed?G.combo:0)+1); G.comboArmed=true; }
function award(base,label,pos,who){
  /* TODO 23: outside the arena the act still happens and pays nothing. Ahead of bumpCombo so an
     out-of-patch act does not even build a combo for the next in-patch one. */
  if(!arenaOK(pos)){ popup('WRONG PATCH','NO POINTS - this match is in '+(G.vs&&G.vs.arena),0,pos,true);
    if(G._wrongSpy)G._wrongSpy.push({label,area:arenaAt(pos)});
    return 0; }
  if(base>=45&&pos){ burst(pos,0xFFD34D,14); burst({x:pos.x,y:(pos.y||1)+0.4,z:pos.z},0xFFF3B0,8);
    if(G._fxSpy)G._fxSpy.push({why:'sparkle',pts:base}); }
  bumpCombo();
  const mult=Math.max(1,G.combo);
  const pts=Math.round(base*mult*(G._decay||1));   // TODO 18: a re-wreck is worth less, and only in a match
  G.score+=pts;
  purseAdd(pts);                    // the page keeps its own books: TODO 13
  vsNote(ledgerAdd(pts,who),pts,label);   // TODO 16 books it, TODO 22 remembers the biggest one
  popup(label,'+'+pts+(mult>1?'  ×'+mult:''),pts,pos);
  if(G.colossal){ while(G.level<MAXLVL&&G.score>=lvlThresh(G.level))levelUp();
    el('chaos').textContent='CHAOS '+G.score+' · LV'+G.level+(G.level<MAXLVL?' ('+lvlThresh(G.level)+' next)':' MAX'); }
  else el('chaos').textContent='CHAOS '+G.score;
  if(pts>=40){ G.hudPulse=Math.min(1.5,(G.hudPulse||0)+0.85);   // HUD juice: the meter kicks for what actually lands
    if(G._fxSpy)G._fxSpy.push({why:'hudpulse',pts}); }
}
let FEEDN=0;
const POPFAN=34, POPLIFE=1.7, POPSLOT=[2,0,4,1,3]; // px of scatter, seconds on screen, fill order
function popStack(){
  // the popups STILL ON SCREEN are the stack - that is exactly the set of identical lines
  // being complained about, so the index derives from the feed own lifetime, not a new constant.
  const F=G.popFan=G.popFan||[], now=G.time||0;
  while(F.length&&now-F[0].at>POPLIFE)F.shift();
  const i=Math.min(F.length,POPSLOT.length-1);
  const band=(POPFAN*2)/POPSLOT.length, seq=G.popSeq=(G.popSeq||0)+1;
  const h=Math.abs(Math.sin(seq*12.9898+i*78.233)*43758.5453)%1; // seeded by hash, never an rnd()
  const f={ i, at:now,                                           // draw - the world stream stays put
    dx:-POPFAN+band*(POPSLOT[i]+0.5)+(h-0.5)*band*0.8,           // one band per slot, so pairwise
    scale:1-0.11*i,                                              // distinct BY CONSTRUCTION
    delay:0.06*i };
  F.push(f); return f;
}
function popup(label,pts,val,pos,small,big){
  const f=popStack();                              // state first, so the gate can judge the fan
  if(HEADLESS){ G.lastPopup=label; return; }
  const d=document.createElement('div'); d.className='pf'+(big?' big':'');
  d.innerHTML=(label||'')+(pts?' <span class="pts">'+pts+'</span>':'');
  if(small)d.style.fontSize='16px',d.style.opacity=.92;
  d.style.animationDelay=f.delay.toFixed(3)+'s'; d.style.animationFillMode='both';
  const w=document.createElement('div');           // the wrapper owns the fan so the rise
  w.style.transform='translateX('+f.dx.toFixed(1)+'px) scale('+f.scale.toFixed(3)+')'; // keyframes
  w.style.transformOrigin='left center';           // keep their own transform
  w.appendChild(d);
  const feed=document.getElementById('feed'); feed.appendChild(w);
  while(feed.children.length>5)feed.removeChild(feed.firstChild);
  setTimeout(()=>w.remove(),POPLIFE*1000+f.delay*1000);
}
/* prompts + tug bars (cached to avoid DOM churn) */
const PROMPTS=['',''],TUGS=[-1,-1],HOLDS=['',''];
function addHint(mid,x,y,z,r,text,o){ if(G.hints&&G.hints.some(h=>h.mid===mid))return;  (G.hints=G.hints||[]).push(Object.assign({},o||{},{mid,x,y,z,r,text})); }
/* A HINT WITH NO MISSION BEHIND IT IS A DELIBERATE THING NOW, NOT AN ACCIDENT (TODO 55, 2026-09-02).
   hintScan gates every hint on an OPEN mission with its mid, which is the right default: it is what
   retires a hint when its job is done, and it is what silently drops a hint whose mid is a typo. But
   it also meant the cage hint - the only one whose subject is a mechanic rather than a mission - had
   been unreachable for its whole life, in both modes, and the lie piece 52 was sent out of it was
   invisible while it lasted. free:true opts a hint out of the mission gate and says so at the call
   site. The typo safety is untouched: a hint that does NOT declare itself free and has no mission is
   still dropped, exactly as before. */
/* HINT TEXT IS RESOLVED WHEN IT IS READ, NOT WHEN IT IS ADDED (TODO 52, 2026-09-02). addHint refuses
   to replace a mid it already has and nothing clears G.hints between runs, so a line baked in at
   build time is the line the player gets for the rest of the process - including after a restart
   into a different mode. A hint that depends on the mode therefore cannot be a string; it has to be
   a function, evaluated at the moment somebody reads it. Strings still work and are still the normal
   case. */
function hintText(h){ return h&&typeof h.text==='function'?h.text():(h?h.text:''); }
function hintScan(k){
  G.hintNow=G.hintNow||[null,null];
  if(!G.hints){ G.hintNow[k.idx]=null; return; }
  for(const h of G.hints){
    if(!h.free){                            // the mission gate, and the default for every hint
      const m=(G.missions||[]).find(m=>m.id===h.mid);
      if(!m||m.done||(typeof m.locked==='function'?m.locked():m.locked))continue; }
    if(Math.hypot(k.x-h.x,k.z-h.z)<h.r&&Math.abs(k.y-h.y)<3.5){
      G.hintNow[k.idx]=h.mid; if(!PROMPTS[k.idx])setPrompt(k.idx,'<span style="opacity:.78">✎ '+hintText(h)+'</span>'); return; }
  }
  G.hintNow[k.idx]=null;
}
/* PREEN, constrained (2026-08-31). yaw carries the reach, neckX is what decides whether the head
   pivot clears the wing line, and headX only swings the beak ABOUT that pivot, so it costs the
   contract nothing and pays for the whole read of the animation. */
const PREEN={yaw:1.18, neckX:-0.06, headX:0.44, headAmp:0.20, wingZ:1.02, eps:0.055};
function setPrompt(i,s){ PROMPTS[i]=s; }
/* HUD REFLOW. The TAB pill is centred on the bottom edge and the prompt plate is anchored to the
   same edge at max-width 44vw, so at narrow widths the plate reaches the pill and the pill lands
   on top of the plate second line. Fixing that by MEASURING the DOM would put the whole thing
   beyond the gate, which is node-only - so the wrap is PREDICTED from the plate own CSS
   constants and the DOM is left with nothing to decide. Validated against two real captures:
   19 chars at 320px wraps to 2 (vantage 08) and 46 chars at 960px wraps to 2 (the jam hint in
   vantage 07), both of which is what the frames show. */
const PLATE={font:21, padX:14, chW:0.52, maxVW:0.44, narrow:480};
function plateLines(html,vw){
  const txt=String(html==null?'':html).replace(/<[^>]*>/g,'').trim(); // the plate wraps TEXT, not markup
  if(!txt)return 0;
  const usable=Math.max(40, vw*PLATE.maxVW - PLATE.padX*2);
  const perLine=Math.max(6, Math.floor(usable/(PLATE.font*PLATE.chW)));
  return Math.max(1, Math.ceil(txt.length/perLine));
}
/* ---------- THE VERSUS HUD (TODO 25, 2026-09-02) ----------
   Two scores, two roles and a clock, and it has to survive the vantage-08 law: 320px is a real width
   and the plate already reaches the TAB pill there. So this is BUILT the way piece 5 built the
   reflow - the layout is a set of FLAGS computed from the viewport width and the match state, and
   the DOM is left with nothing to decide. Nothing here measures an element, which is what makes it
   assertable under node at any width without a browser.
   THREE BANDS, and each one drops the least useful thing rather than shrinking everything: wide
   shows role words and a labelled clock; mid drops the labels and keeps the role words; narrow keeps
   the two numbers, the clock, and a single letter for each role, because at 320px the scoreline IS
   the HUD and everything else is decoration. */
const VSHUDW={wide:640, mid:420};                 // px. FENCED FOR PLAYTEST
function vsClock(sec){ const t=Math.max(0,Math.ceil(sec));
  return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); }
function vsHudState(vw){
  const w=vw||G.hudVW||1280, v=G.vs;
  if(!v)return {on:false,band:null};
  const band=w>=VSHUDW.wide?'wide':(w>=VSHUDW.mid?'mid':'narrow');
  const sc=vsScores();
  const left =v.roles.menace===0?'menace':'management';
  const right=v.roles.menace===1?'menace':'management';
  const nm=r=>band==='narrow'?(r==='menace'?'M':'O'):(r==='menace'?'MENACE':'MANAGEMENT');
  const rem=v.phase==='sudden'?Math.max(0,VSSUDDEN-v.sudden):Math.max(0,v.len-v.t);
  return {on:true, band, narrow:band==='narrow',
          showLabels:band==='wide', showRoleWords:band!=='narrow',
          scores:sc, roles:[left,right], names:[nm(left),nm(right)],
          clock:vsClock(rem), sudden:v.phase==='sudden', over:v.phase==='over',
          lead:sc[0]===sc[1]?-1:(sc[0]>sc[1]?0:1)}; }

function hudReflow(vw){
  const w=vw||(typeof innerWidth==='number'&&innerWidth>0?innerWidth:1280);
  G.hudVW=w;
  G.vsHud=vsHudState(w);                          // TODO 25: state first, DOM later
  G.hudLines=[plateLines(PROMPTS[0],w), plateLines(PROMPTS[1],w)];
  G.hudNarrow=w<PLATE.narrow;
  /* THE VANTAGE-08 LAW NEEDS NOTHING ADDED FOR A MATCH, and I only know that because a sabotage
     could not break the clause I had put here. The versus HUD goes narrow below 420 and the plate
     already docks the pill below 480, so "a match is narrow" is a strict subset of "the viewport is
     narrow" and the extra term could never change the answer. A condition that cannot fire is worse
     than no condition: it reads like a rule and is not one. */
  G.tabDocked=!!(G.hudNarrow||G.hudLines[0]>1||G.hudLines[1]>1);
  return G.tabDocked;
}
function setTug(i,v){ TUGS[i]=v; }
function keyName(code){ return ({Space:'SPACE',Slash:'/',Period:'.',Comma:',',KeyE:'E',KeyQ:'Q'})[code]||code.replace('Key',''); }
let uiCache=['','',-2,-2,'','',''];
let _cardShown=null;
function updateUI(){
  if(HEADLESS)return;
  /* THE CARD IS RAISED FROM THE UI SIDE, not from travelIn, because travelIn has to run under node
     where there is no DOM at all. One string compared per frame, and the state machine stays clean. */
  { const v=G.travel, want=(v&&v.phase==='in'&&v.card)||null;
    if(want!==_cardShown){ _cardShown=want; travelCard(want); } }
  for(let i=0;i<2;i++){
    const pEl=document.getElementById('prompt'+(i+1));
    if(uiCache[i]!==PROMPTS[i]){ uiCache[i]=PROMPTS[i]; pEl.innerHTML=PROMPTS[i]; pEl.style.display=PROMPTS[i]?'block':'none'; }
    const tEl=document.getElementById('tug'+(i+1));
    if(TUGS[i]>=0){ tEl.style.display='block'; tEl.firstElementChild.style.width=Math.min(100,TUGS[i]*100)+'%'; }
    else tEl.style.display='none';
    const k=G.keas[i]; const h=k&&k.held?('◈ '+k.held.name):'';
    if(uiCache[4+i]!==h){ uiCache[4+i]=h; const hEl=document.getElementById('hold'+(i+1)); hEl.textContent=h; hEl.style.display=h?'block':'none'; }
  }
  { const th=document.getElementById('todohint');
    if(th){ const want=G.tabHintOn?'block':'none';
      if(th.style.display!==want)th.style.display=want;
      th.classList.toggle('docked',!!G.tabDocked); } }
  { const v=G.vsHud, el2=document.getElementById('vshud');       // TODO 25: the versus scoreline
    let want='';
    if(v&&v.on&&!v.over){
      const s=v.scores, n=v.names;
      const side=i=>(v.showLabels?(n[i]+' '):(v.showRoleWords?n[i].slice(0,4)+' ':n[i]+' '))+
                    '<b>'+s[i]+'</b>';
      want=side(0)+' <span style="opacity:.6">|</span> '+side(1)+
           ' <span style="opacity:.75">'+(v.sudden?'SUDDEN ':'')+v.clock+'</span>'; }
    if(uiCache[6]!==want){ uiCache[6]=want;
      if(el2){ el2.innerHTML=want; el2.style.display=want?'block':'none'; } } }
  const cEl=document.getElementById('combo');
  if(G.combo>=2&&G.comboT>0){ cEl.style.display='block'; cEl.textContent='×'+G.combo+' SPREE'; } else cEl.style.display='none';
}
/* THE FOOTER OF THE TO-DO LIST (TODO 66). It was three live numbers built inside renderTodo, which
   runs when a MISSION EVENT happens and at no other time - so the page count, the career peak and
   the clock were a snapshot of whenever the last row was ticked. Open the list two minutes into a
   run and it said 0:00, and after tonight peak fix it would have said PEAK 0 next to a meter reading
   four hundred. One function, two call sites: renderTodo writes it once when it rebuilds the list,
   and the HUD frame keeps it honest between rebuilds. */
function todoFoot(){
  const all=(G.missions||[]).filter(m=>!m.finale&&!m.hide), dn=all.filter(m=>m.done).length;
  return dn+'/'+all.length+' · PEAK '+Math.round(G.chaosPeak||0)+' · '+fmtT(G.playT||0); }
function renderTodo(){
  if(HEADLESS)return;
  const list=document.getElementById('milist'); list.innerHTML='';
  const addHead=(txt,cls)=>{ const h=document.createElement('div'); h.className='miarea'+(cls?' '+cls:''); h.textContent=txt; list.appendChild(h); };
  const addRow=(m)=>{ const d=document.createElement('div');
    d.className='mi'+(m.done?' done':'')+(m.coop?' coop':'')+(m.finale?' finale':'')+(m.locked?' locked':'');
    d.innerHTML='<div class="box"></div><span>'+(m.locked?'???':m.label)+(m.need&&!m.done?' <span class="prog">('+(m.n||0)+'/'+m.need+')</span>':'')+'</span>';
    list.appendChild(d); };
  if(G.chapters){
    for(let i=0;i<G.chapters.length;i++){
      const rows=G.missions.filter(m=>m.area===G.chapters[i]&&!m.finale&&!m.hide&&!m.bonus);
      if(!rows.length)continue;
      const hd=pageHeader(i);
      if(i<G.chapIdx){ addHead(hd.text); continue; }
      if(i===G.chapIdx){ addHead(hd.text); rows.forEach(addRow); continue; }
      if(i===G.chapIdx+1){ addHead(hd.text); }
    }
    const bonus=G.missions.filter(m=>m.bonus&&!m.locked&&!m.hide);
    if(bonus.length){ addHead(bonus[0].area); bonus.forEach(addRow); }
    const fin=G.missions.find(m=>m.finale);
    if(fin){ addHead('AND FINALLY'); addRow(fin); }
    { addHead(todoFoot()); list.lastChild.id='mifoot'; }
    return;
  }
  let lastArea=null;
  for(const m of G.missions){
    if(m.area&&m.area!==lastArea){ lastArea=m.area; addHead(m.area); }
    if(m.finale&&lastArea!==null){ addHead('AND FINALLY'); lastArea=null; }
    addRow(m);
  }
}
function flashTodo(){
  if(HEADLESS)return;
  const t=document.getElementById('todo'); t.classList.add('open');
  clearTimeout(G._todoT); if(!G.todoPinned)G._todoT=setTimeout(()=>t.classList.remove('open'),2200);
}

/* ============================================================
   CAMERAS · LOOP · BOOT
   ============================================================ */
function initRenderer(){
  const cv=document.getElementById('c');
  G.renderer=new THREE.WebGLRenderer({preserveDrawingBuffer:true,canvas:cv,antialias:true});
  G.renderer.outputColorSpace=THREE.SRGBColorSpace;
  G.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  G.renderer.toneMappingExposure=0.95;
  G.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
  G.renderer.setSize(innerWidth,innerHeight);
  G.renderer.shadowMap.enabled=true;
  /* REPLAT P2: SOFT SHADOWS ARE A SHADOW-MAP CHOICE, not a radius. See the SKY block — PCFSoft
     ignores shadow.radius outright, so 'vsm' is what actually buys a wide penumbra. The constant
     keeps PCFSoft reachable for an A/B at the vantage rather than deleting the old look. */
  G.renderer.shadowMap.type = SKY.shadowType==='vsm' ? THREE.VSMShadowMap : THREE.PCFSoftShadowMap;
  /* THE PAINTED SKY IS NOW THE FALLBACK, NOT THE PLAN. src/sky.mjs installs a real HDRI over the
     top of this a moment later. It is still built, and built FIRST, for two reasons: the HDRI is
     fetched over the network and a fetch can fail, and Standard materials with no environment at
     all read dead rather than merely wrong. So the game always has an environment from the first
     frame, and a failed download costs fidelity instead of the look. Marked 'painted' in G.ibl so
     a degraded run is visible in scene state and not a silent downgrade. */
  { const ec=document.createElement('canvas'); ec.width=64; ec.height=32; const eg=ec.getContext('2d');
    const grd=eg.createLinearGradient(0,0,0,32);
    grd.addColorStop(0,'#2F6FAE'); grd.addColorStop(0.55,'#7FA8CC'); grd.addColorStop(0.72,'#D9E4EA'); grd.addColorStop(0.78,'#B9A468'); grd.addColorStop(1,'#6E6438');
    eg.fillStyle=grd; eg.fillRect(0,0,64,32);
    const eqt=new THREE.CanvasTexture(ec); eqt.mapping=THREE.EquirectangularReflectionMapping;
    const pm=new THREE.PMREMGenerator(G.renderer); G.scene.environment=pm.fromEquirectangular(eqt).texture; pm.dispose();
    if(G.ibl){ G.ibl.mode='painted'; G.ibl.pmrem=true; } }
  addEventListener('resize',()=>{ G.renderer.setSize(innerWidth,innerHeight); setCamAspect(); });
}
function setCamAspect(){
  const a=innerWidth/innerHeight;
  G.cams.forEach(c=>{ c.aspect=G.mode===2?a/2:a; c.updateProjectionMatrix(); });
}
function mkCam(){ const c=new THREE.PerspectiveCamera(60,1,0.1,300); c.position.set(0,26,44); c.lookAt(0,0,10); return c; }
function updateCams(dt){
  for(let i=0;i<G.cams.length;i++){
    const cam=G.cams[i], k=G.keas[i];
    if(!k){ // title orbit
      const t=G.time*0.08; cam.position.set(Math.sin(t)*36,15+Math.sin(t*0.7)*3,Math.cos(t)*36+16);
      cam.lookAt(0,1,10); continue;
    }
    if(G.photo){ const t=G.time*0.22, S2=(k.size||1), r=5.5*S2;
      cam.position.set(k.x+Math.sin(t)*r, 1.6+0.9*S2+Math.sin(t*0.6)*0.5, k.z+Math.cos(t)*r);
      cam.lookAt(k.x,0.7*S2,k.z); continue; }
    const S=(k.size||1); const back=5.2*(0.62+0.42*S)*((G.mode===1&&G.camDist)||1),h=2.15*(0.62+0.45*S);
    const effRy=k.ry+((G.mode===1&&G.camYaw)||0);
    let tx=k.x-Math.sin(effRy)*back, tz=k.z-Math.cos(effRy)*back;
    let ty=k.y+h;
    { const bx=k.x, by=k.y+0.7*S, bz=k.z; let frac=1; // march lens-ward; stop before the first solid
      for(let si=1;si<=10;si++){ const f=si/10, px=bx+(tx-bx)*f, py=by+(ty-by)*f, pz=bz+(tz-bz)*f; let hit=false;
        for(const c of G.colliders){ if(!c.solid||c.kind!=='box')continue;
          let dx=px-c.x, dz=pz-c.z;
          if(c.ry){ const sn=Math.sin(c.ry),cs=Math.cos(c.ry); const lx=dx*cs-dz*sn, lz=dx*sn+dz*cs; dx=lx; dz=lz; }
          if(Math.abs(dx)<c.w-0.05&&Math.abs(dz)<c.d-0.05&&py<c.top-0.1){ hit=true; break; } }
        if(hit){ frac=Math.max(0.22,(si-1)/10); break; } }
      if(frac<1){ tx=bx+(tx-bx)*frac; ty=by+(ty-by)*frac; tz=bz+(tz-bz)*frac; } }
    const gh=groundHeightAt(tx,tz,ty); ty=Math.max(ty,gh+1.2,1.4);
    const sm=1-Math.pow(0.0018,dt);
    cam.position.x+=(tx-cam.position.x)*sm; cam.position.y+=(ty-cam.position.y)*sm; cam.position.z+=(tz-cam.position.z)*sm;
    if(G.shake>0){ const shk=G.shake*(RM?0.15:1); cam.position.x+=rnd(-1,1)*shk*0.3; cam.position.y+=rnd(-1,1)*shk*0.22; }
    let lax=k.x+Math.sin(effRy)*1.6, lay=k.y+0.72*(k.size||1), laz=k.z+Math.cos(effRy)*1.6;
    /* TODO 38: THE TRAVEL BLEND, and it sits HERE - after the follow cam has decided where it wants
       to be and BEFORE camLock. Out eases the eye away toward the anchor, in comes down from it.
       Smoothstep both ways so neither end of a beat starts or stops with a jerk. */
    if(travelBusy()&&G.travel.anchor){ const A=G.travel.anchor, u=travelU();
      const f=G.travel.phase==='out'?u:1-u, e=f*f*(3-2*f);
      cam.position.x=lerp(cam.position.x,A.x,e); cam.position.y=lerp(cam.position.y,A.y,e); cam.position.z=lerp(cam.position.z,A.z,e);
      lax=lerp(lax,A.lx,e); lay=lerp(lay,A.ly,e); laz=lerp(laz,A.lz,e); }
    cam.lookAt(lax,lay,laz);
    if(G.camLock){ const L=G.camLock; cam.position.set(L.x,L.y,L.z); cam.lookAt(L.lx,L.ly,L.lz); } // gauntlet photographer hook (inert in play)
  }
  G.shake=Math.max(0,(G.shake||0)-dt*1.4);
}
function render(){
  const w=innerWidth,hh=innerHeight,r=G.renderer;
  /* THE POST HOOK — REPLAT P1 step 5. The film camera (bloom, ambient occlusion, depth of field)
     lives in src/post.mjs and installs itself here, for one hard reason: the gauntlet loads THIS
     file as a text specimen and evaluates it with THREE injected, and the loader asserts it has
     exactly ONE import. Importing EffectComposer and four passes here would break all nine
     batteries at once. So game.mjs stays a single-import module and merely DELEGATES; post.mjs is
     wired from the browser entry and is never seen by a headless battery.
     G.post is absent headless and absent until the composer is built, so the plain path below
     remains the real path for the batteries and for the first frames of any page. */
  const split=(G.mode===2&&G.keas.length===2);
  if(G.post&&G.post.render){ G.post.render(split,w,hh); return; }
  if(split){
    r.setScissorTest(true);
    r.setViewport(0,0,w/2,hh); r.setScissor(0,0,w/2,hh); r.render(G.scene,G.cams[0]);
    r.setViewport(w/2,0,w/2,hh); r.setScissor(w/2,0,w/2,hh); r.render(G.scene,G.cams[1]);
    r.setScissorTest(false);
  } else { r.setViewport(0,0,w,hh); r.render(G.scene,G.cams[0]); }
}

/* master tick */
const PADPREV=[{},{}];
function RUMBLE(i,dur,mag){ if(HEADLESS)return; try{
  const pads=(navigator.getGamepads&&navigator.getGamepads())||[]; const live=[];
  for(const gp of pads){ if(gp&&gp.buttons&&gp.buttons.length){ live.push(gp); if(live.length===2)break; } }
  const gp=live[i]; const va=gp&&(gp.vibrationActuator||gp.hapticActuators&&gp.hapticActuators[0]);
  if(va&&va.playEffect)va.playEffect('dual-rumble',{duration:dur,strongMagnitude:mag,weakMagnitude:mag*0.6});
  else if(va&&va.pulse)va.pulse(mag,dur);
}catch(e){} }
function pollPads(){
  if(typeof navigator==='undefined'||!navigator.getGamepads)return;
  let pads; try{ pads=navigator.getGamepads(); }catch(e){ return; }
  if(!pads)return;
  const maps=[P1MAP,P2MAP];
  const live=[]; for(const gp of pads){ if(gp&&gp.buttons&&gp.buttons.length){ live.push(gp); if(live.length===2)break; } }
  for(let i=0;i<2;i++){ const gp=live[i], m=maps[i], pv=PADPREV[i];
    if(!gp){ if(pv)for(const kk in pv){ if(pv[kk]&&m[kk])release(m[kk]); pv[kk]=false; } continue; }
    const ax=gp.axes||[0,0], b=k=>!!(gp.buttons[k]&&gp.buttons[k].pressed);
    let hu=false,hd=false,hl=false,hr=false;
    if(typeof ax[9]==='number'&&ax[9]>-1.2&&ax[9]<1.2){ // D-input hat (8BitDo D-mode)
      const hv=Math.round((ax[9]+1)/0.2857)%8;
      hu=(hv===0||hv===1||hv===7); hr=(hv===1||hv===2||hv===3); hd=(hv===3||hv===4||hv===5); hl=(hv===5||hv===6||hv===7); }
    const want={ fwd:ax[1]<-0.4||b(12)||hu, back:ax[1]>0.4||b(13)||hd, left:ax[0]<-0.4||b(14)||hl, right:ax[0]>0.4||b(15)||hr,
      flap:b(0)||b(1), grab:b(2)||b(4)||b(5), scream:b(3)||b(7) };
    for(const k in want){ const code=m[k];
      if(want[k]&&!pv[k])press(code); else if(!want[k]&&pv[k])release(code);
      pv[k]=want[k]; }
  }
}
function nightApply(t){
  const L=(a,b)=>a+(b-a)*t, C=(h1,h2)=>new THREE.Color(h1).lerp(new THREE.Color(h2),t).convertSRGBToLinear();
  if(!G.sun)return;
  G.sun.intensity=L(SKY.sunIntensityDay,SKY.sunIntensityNight)*LX_DIR; G.sun.color=C(SKY.sunDay,SKY.sunNight);
  G.sun.position.set(L(SKY.sunPosDay[0],SKY.sunPosNight[0]),L(SKY.sunPosDay[1],SKY.sunPosNight[1]),L(SKY.sunPosDay[2],SKY.sunPosNight[2]));
  G.hemi.intensity=L(SKY.hemiIntensityDay,SKY.hemiIntensityNight)*LX_HEMI;
  G.hemi.color=C(SKY.hemiSkyDay,SKY.hemiSkyNight); G.hemi.groundColor=C(SKY.hemiGroundDay,SKY.hemiGroundNight);
  G.fill.intensity=L(SKY.fillIntensityDay,SKY.fillIntensityNight)*LX_DIR;
  G.rim.intensity=L(SKY.rimIntensityDay,SKY.rimIntensityNight)*LX_DIR;
  /* THE FOG LERPS ITS DENSITY NOW, NOT A NEAR/FAR PAIR — FogExp2 has neither. Density is the
     one parameter, so the day/night roll is a single lerp instead of two that could disagree. */
  if(G.scene.fog){ G.scene.fog.color=C(SKY.fogDay,SKY.fogNight);
    G.scene.fog.density=L(SKY.fogDensityDay,SKY.fogDensityNight); }
  /* AND THE ENVIRONMENT DIMS WITH THE SKY. Without this the IBL would keep pouring full daylight
     bounce into a night scene: the sun stands down to 17% and the hemisphere halves, but a PMREM
     of a midday HDRI does not care what time the game thinks it is. It is the single biggest
     reason a night frame can look flat and lifted after IBL goes in — the torch stops reading
     because everything already has fill. Scene.environmentIntensity is the correct knob because
     it scales the contribution without rebuilding the convolution. */
  G.scene.environmentIntensity=L(SKY.envIntensityDay,SKY.envIntensityNight);
  if(G.ibl)G.ibl.intensity=G.scene.environmentIntensity;
  if(G.sky)G.sky.material.color.setRGB(L(1,0.16),L(1,0.20),L(1,0.34));
  if(G.haze)G.haze.material.opacity=L(SKY.hazeOpacityDay,SKY.hazeOpacityNight);
  if(G.moon)G.moon.visible=t>0.45;
  if(G.warmMats)for(const m of G.warmMats)m.emissiveIntensity=t*(m===G.warmMats[0]?0.95:0.6);
  if(G.nightMats)for(const e of G.nightMats)e.m.color.copy(e.day).lerp(e.night,t);
  if(G.fire){ G.fire.flame.visible=t>0.2; if(G.fire.inner)G.fire.inner.visible=t>0.2; }
}
function update(dt){
  pollPads();
  { const nDown=KEYS.has('KeyN'); if(nDown&&!G._nPrev&&G.running&&!G.photo){ G.night=!G.night; G.nightManual=true; popup(G.night?'NIGHT SHIFT':'DAY SHIFT',G.night?'the torches come out':'',0,{x:G.keas[0].x,y:2,z:G.keas[0].z},true); } G._nPrev=nDown; }
  if(!G.nightManual&&!G.night&&G.running&&!G.won&&(G.wanted>=3||G.chaos>=260)){
    G.night=true; popup('NIGHT SHIFT','you have been NOTICED — the torches come out',0,{x:G.keas[0].x,y:2.2,z:G.keas[0].z},true); }
  G.nightT=G.nightT||0; const wantN=G.night?1:0;
  if(Math.abs(G.nightT-wantN)>0.001){ G.nightT+=(wantN-G.nightT)*Math.min(1,dt*1.1); nightApply(G.nightT); }
  if(G.mode===1&&G.running){
    const L=KEYS.has('ArrowLeft'),R=KEYS.has('ArrowRight'),U=KEYS.has('ArrowUp'),D=KEYS.has('ArrowDown');
    if(L||R)G.camYaw=(G.camYaw||0)+(L?1:-1)*dt*2.3;
    if(U||D)G.camDist=clamp((G.camDist||1)+(D?1:-1)*dt*0.9,0.6,1.6);
    if(L||R||U||D)G.camIdleT=0; else G.camIdleT=(G.camIdleT||0)+dt;
    if(G.camIdleT>3&&G.camYaw){ G.camYaw*=Math.max(0,1-dt*1.6); if(Math.abs(G.camYaw)<0.02)G.camYaw=0; }
  }
  if(G.needHydrate){ G.needHydrate=false; applySave(); }
  G.time+=dt; G.frames=(G.frames||0)+1;
  travelUpdate(dt);   // TODO 38: outside the running gate, because a beat can play with no run on
  if(G.running&&!G.paused&&!G.won){
    for(const k of G.keas){ G.actor=k; k.update(dt); }   // TODO 16: award() reads whose frame this is
    G.actor=null;                                        // nothing outside the loop gets to be a bird by accident
    squawkUpdate(dt);   // after the loop: a prompt written inside it belongs to whoever updates last
    vsUpdate(dt);       // the match clock, after everything that could have paid a point this frame
    for(const h of [...G.humans])h.update(dt);
    updateTraffic(dt); updateSheep(dt); updateFX(dt);
    /* PROPS PHYSICS. A prop falls until groundHeightAt gives it something to stand on, and it has
       ALWAYS consulted the colliders - the sandwich has rested on the picnic table for weeks because
       that table has one. Nothing on a RAIL did: the ski rack, the boot rail and the clothesline are
       meshes and nothing else, so every ski, pole and peg dropped to the dirt inside three seconds
       and the racks were decoration. OPPORTUNITIES Tier 3 item 2, and it says it bit that pass
       twice. The fix is the collider pass it asks for - see railTop below - and not a new rule here. */
    for(const p of G.props){
      if(p.heldBy||p.banked)continue;
      p.vy=(p.vy||0)-9*dt; 
      const gh=Math.max(0.06,groundHeightAt(p.x,p.z,p.y+0.3)+0.08);
      p.y+=p.vy*dt;
      if(p.vx||p.vz){ p.x+=(p.vx||0)*dt; p.z+=(p.vz||0)*dt; }
      const air=p.y>gh+0.01;
      if(air&&(p.rvx||p.rvy)){ p.mesh.rotation.x+=(p.rvx||0)*dt; p.mesh.rotation.y+=(p.rvy||0)*dt; } // tumble
      if(p.y<=gh){
        if(p.vy<-3&&!p._bounced){ p._bounced=true; p.vy=-p.vy*0.3; p.y=gh+0.01; if(Math.random()<0.6)AU.pop(); }
        else { p.y=gh; p.vy=0; p.vx=0; p.vz=0; p._bounced=false;
          if(p.rvx||p.rvy){ p.rvx=0; p.rvy=0; p.mesh.rotation.x*=0.3; } }
      }
      p.mesh.position.set(p.x,p.y,p.z);
    }
    // tear decay + wobble settle
    for(const it of G.inter){
      if(it.kind!=='tear'||it.done)continue;
      if((!it.tuggers||it.tuggers.size===0)&&it.progress>0){ it.progress=Math.max(0,it.progress-dt*0.5);
        if(it.mesh){ it.mesh.rotation.z=(it.baseRz||0)+(it.mesh.rotation.z-(it.baseRz||0))*(1-dt*6);
          if(it.base){ const u=it.progress/it.need;
            it.mesh.position.x=lerp(it.mesh.position.x,it.base.px,dt*6);
            it.mesh.position.z=lerp(it.mesh.position.z,it.base.pz,dt*6);
            it.mesh.rotation.x=lerp(it.mesh.rotation.x,it.base.rx||0,dt*6);
            if(it.pull==='extract')it.mesh.position.y=it.base.py+u*0.2; } } }
    }
    // noise aging
    for(let i=G.noiseEvents.length-1;i>=0;i--){ const n=G.noiseEvents[i]; n.t+=dt; if(n.t>0.6)G.noiseEvents.splice(i,1); }
    // combo + wanted decay
    G.comboT-=dt; if(G.comboT<=0){G.combo=0;G.comboArmed=false;}
    G.wantedT=Math.max(0,G.wantedT-dt*0.045); const lvl=clamp(Math.floor(G.wantedT),0,5);
    if(lvl!==G.wanted){G.wanted=lvl;updWanted();}
    checkMisc(); checkFinale(); checkCaseFiles();
    styleDrain();       // every award for this frame has landed by now: judge the page that turned
  } else if(!G.running){ updateFX(dt); updateSheep(dt); }
  hudReflow();
  PRESSED=[];
}

function startGame(mode,opts){
  G.mode=mode; G.running=true; AU.boot();
  G.colossal=!!(opts&&opts.colossal); G.level=1;
  G.camYaw=0; G.camDist=1; G.squawk=null; G.actor=null; G.vs=null;   // the ledgers are NOT cleared: see the note at ledgerAdd
  G.won=false; G.finaleOn=false; G.apexArmed=false; G.apexNoted=false;
  for(const k of G.keas){ if(k.hatProp)k.doff(); if(k.held)k.drop();   // the bird leaves with nothing: what it carried stays in the world
    if(k.g&&k.g.parent)k.g.parent.remove(k.g); if(k.labelEl&&k.labelEl.remove)k.labelEl.remove(); }
  G.keas.length=0;
  for(const h of G.humans){ if(h.g&&h.g.parent)h.g.parent.remove(h.g); }
  G.humans.length=0;
  defineMissions(mode,opts);
  G.keas.push(new Kea(0,P1MAP,0,4));
  if(mode===2){ G.keas.push(new Kea(1,P2MAP,1.6,4.8)); }
  if(opts&&opts.vs)vsStart(opts);   // TODO 22: after both birds exist, because a match needs two
  G.travel=null;
  { const ar=SAVE.takeArrival();   // TODO 38: one shot, and only for the map it was armed for
    if(ar&&ar.to===(G.biome||BIOME_DEFAULT))travelIn(ar.from); }
  /* THE CAST IS THE MAP CAST (TODO 39). This was four hand-written pushes of carpark furniture,
     one of which read G.ladder with no guard - see the note above castSkifield. */
  { const cast=biomeOf(G.biome).cast; if(cast)cast(); }
  if(!HEADLESS){
    document.getElementById('title').style.display='none';
    tourOpen(false);                                        // the brochure never survives into play
    G.tabHintOn=true;
    document.getElementById('mutebtn').style.display='block';
    if(mode===2){ document.getElementById('phud2').style.display='flex'; document.getElementById('splitline').style.display='block'; }
    setCamAspect();
    /* TODO 38: THE TO-DO FLASH WOULD SIT ON TOP OF THE ARRIVAL CARD, which the 27 frame showed
       plainly - the list panel covered half the name of the place. So on arrival the flash waits for
       the beat and travelEnd raises it, which also puts it after a SKIP rather than after a timer
       that a skip would have made wrong. */
    if(!travelBusy())flashTodo();
    /* AND THE OPENING LINE CALLED EVERY MAP A CARPARK. One line of copy that was true while there
       was one biome. The carpark keeps its own wording exactly; anywhere else is named by the
       registry rather than described wrongly. */
    popup(G.biome===BIOME_DEFAULT?'DAWN. A CARPARK. NO WITNESSES YET.'
          :('DAWN. '+((BIOMES[G.biome]&&BIOMES[G.biome].label)||'SOMEWHERE')+'. NO WITNESSES YET.'),
          '',0,null,true);
  }
}

const TOUCH={on:false,_st:{f:0,b:0,l:0,r:0},
  axes(dx,dy){ const w={f:dy<-0.35,b:dy>0.35,l:dx<-0.35,r:dx>0.35};
    const map={f:P1MAP.fwd,b:P1MAP.back,l:P1MAP.left,r:P1MAP.right};
    for(const k in w){ if(w[k]&&!this._st[k])press(map[k]); else if(!w[k]&&this._st[k])release(map[k]); this._st[k]=w[k]; } },
  init(){ if(typeof window==='undefined'||!('ontouchstart' in window))return; this.on=true; document.body.classList.add('touch');
    const ov=document.createElement('div'); ov.id='touchui';
    ov.innerHTML='<div id="tjoy"><div id="tknob"></div></div><div class="tbtn" id="tflap">FLAP</div><div class="tbtn" id="tgrab">GRAB</div><div class="tbtn" id="tscreech">SCREECH</div>';
    document.body.appendChild(ov);
    const bind=(id,code)=>{ const el=document.getElementById(id);
      el.addEventListener('touchstart',e=>{e.preventDefault(); press(code); el.classList.add('on');},{passive:false});
      const off=e=>{e.preventDefault(); release(code); el.classList.remove('on');};
      el.addEventListener('touchend',off,{passive:false}); el.addEventListener('touchcancel',off,{passive:false}); };
    bind('tflap',P1MAP.flap); bind('tgrab',P1MAP.grab); bind('tscreech',P1MAP.scream);
    const joy=document.getElementById('tjoy'), knob=document.getElementById('tknob');
    let jid=null,ox=0,oy=0;
    joy.addEventListener('touchstart',e=>{ e.preventDefault(); const t=e.changedTouches[0]; jid=t.identifier; ox=t.clientX; oy=t.clientY; },{passive:false});
    joy.addEventListener('touchmove',e=>{ for(const t of e.changedTouches){ if(t.identifier!==jid)continue; e.preventDefault();
      const dx=clamp((t.clientX-ox)/45,-1,1), dy=clamp((t.clientY-oy)/45,-1,1);
      knob.style.transform='translate('+(dx*26)+'px,'+(dy*26)+'px)'; this.axes(dx,dy); } },{passive:false});
    const jend=e=>{ for(const t of e.changedTouches){ if(t.identifier!==jid)continue; jid=null; knob.style.transform=''; this.axes(0,0); } };
    joy.addEventListener('touchend',jend,{passive:false}); joy.addEventListener('touchcancel',jend,{passive:false});
    let lid=null,lx=0,pinchD=0;
    addEventListener('touchstart',e=>{ 
      if(e.touches.length===2&&!(e.target.closest&&e.target.closest('#touchui'))){
        pinchD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); lid=null; return; }
      const t=e.changedTouches[0];
      if(t.clientX>innerWidth*0.5&&!(e.target.closest&&e.target.closest('#touchui'))){ lid=t.identifier; lx=t.clientX; } },{passive:true});
    addEventListener('touchmove',e=>{
      if(e.touches.length===2&&pinchD>0){
        const nd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
        if(nd>4){ G.camDist=clamp((G.camDist||1)*(pinchD/nd),0.6,1.6); pinchD=nd; } return; }
      for(const t of e.changedTouches){ if(t.identifier!==lid)continue;
        G.camYaw=(G.camYaw||0)-(t.clientX-lx)*0.0075; G.camIdleT=0; lx=t.clientX; } },{passive:true});
    addEventListener('touchend',e=>{ if(e.touches.length<2)pinchD=0;
      for(const t of e.changedTouches){ if(t.identifier===lid)lid=null; } },{passive:true});
  } };
function boot(opts){
  /* TODO 37: an explicit biome still wins - the capture rig passes one and every baseline depends
     on it - and a pick made on the brochure is the fallback, ahead of the default. */
  initScene(); buildWorld((opts&&opts.biome)||SAVE.picked()); registerSheepPecks(); homesRegister();   // TODO 17: after the build, so site rotations count
  { const w1=mat(0x9FB8C4,GLASSX), w2=mat(PAL.sun);
    for(const m of [w1,w2]){ m.emissive=new THREE.Color(0xFFB35C).convertSRGBToLinear(); m.emissiveIntensity=0; }
    G.warmMats=[w1,w2]; }
  if(HEADLESS)return;
  TOUCH.init();
  initRenderer();
  G.cams=[mkCam(),mkCam()]; setCamAspect();
  document.getElementById('btn1p').onclick=()=>startGame(1);
  document.getElementById('btn2p').onclick=()=>startGame(2);
  document.getElementById('btncol').onclick=()=>startGame(1,{colossal:true});
  document.getElementById('btnvs').onclick=()=>startGame(2,{vs:true});
  document.getElementById('btntour').onclick=()=>tourOpen(true);
  document.getElementById('tourback').onclick=()=>tourOpen(false);
  document.getElementById('btnvsagain').onclick=()=>location.reload();
  /* TODO 38: AN ARMED ARRIVAL STARTS THE RUN IT LEFT, so the page load in the middle of a journey
     is a load and not a trip back to the title screen. peek, not take - startGame consumes it. */
  { const ar=SAVE.peekArrival();
    if(ar&&ar.to===G.biome){ const r=ar.run||{};
      setTimeout(()=>startGame(r.mode||1,{colossal:!!r.colossal}),0); } }
  /* REPLAT P5: the credits reach the screen at boot, before anything is played. A CC-BY asset's
     credit is a condition of use, so it cannot be behind a menu the player may never open. */
  creditsRender();
  document.getElementById('btnagain').onclick=()=>location.reload();
  document.getElementById('cfgo').onclick=()=>closeCaseFile(true);
  document.getElementById('cfskip').onclick=()=>closeCaseFile(false);
  document.getElementById('mutebtn').onclick=e=>{ AU.muted=!AU.muted; e.target.textContent=AU.muted?'🔇 muted':'🔊 sound'; };
  addEventListener('keydown',e=>{
    if(!G.running){
      const tOpen=document.getElementById('tour').classList.contains('open');
      if(e.code==='Escape'){ tourOpen(false); return; }
      if(e.code==='KeyM'){ tourOpen(!tOpen); return; }
      if(tOpen)return;                       // the brochure owns the keyboard while it is up
      if(e.code==='Enter'||e.code==='Digit1')startGame(1); else if(e.code==='Digit2')startGame(2); else if(e.code==='Digit3')startGame(1,{colossal:true}); else if(e.code==='Digit4')startGame(2,{vs:true}); return; }
    if(G.cfOpen){ if(e.code==='Enter')closeCaseFile(true); else if(e.code==='Escape')closeCaseFile(false); e.preventDefault(); return; }
    if(e.code==='Tab'&&G.running){ const t=document.getElementById('todo'); G.todoPinned=!t.classList.contains('open'); t.classList.toggle('open'); }
    if(e.code==='Backspace'&&!G.running){ SAVE.wipe(); const h=document.getElementById('hint2p'); if(h)h.innerHTML='<b>save wiped</b> — fresh beak, fresh crimes'; }
    if(e.code==='KeyO'&&G.running){ G.photo=!G.photo; document.body.classList.toggle('photo',G.photo); }
    if(e.code==='KeyC'&&G.running){ G.bandIdx=((G.bandIdx||0)+1)%4;
      for(const k of G.keas){ if(k.band&&k.band.material){ k.band.material=mat(k.band._cols[G.bandIdx]); } }
      SAVE.write(); }
    if(e.code==='KeyP'&&G.running&&!G.cfOpen){ G.paused=!G.paused; popup(G.paused?'PAUSED':'RESUMED','',0,null,true); }
    // TODO 38: the map is reachable mid-run, which is what LEAVING via it means
    if(e.code==='KeyM'&&G.running&&!G.cfOpen&&!travelBusy()){
      tourOpen(!document.getElementById('tour').classList.contains('open')); }
  });
  let last=performance.now();
  function frame(now){
    const dt=clamp((now-last)/1000,0.001,0.05); last=now;
    update(dt); updateCams(dt); updateUI(); render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if(typeof globalThis!=='undefined'){
  globalThis.KEAGAME={G,boot,startGame,update,press,release,nightApply,nightApply,KEYS,initScene,buildWorld,registerSheepPecks,defineMissions,noise,award,done,prog,groundHeightAt,onVanRoof,jailFull,jailedKea,SNOWFIELD,SNOWSLIDE,SNOWBULK,snowBlocked,snowSpot,
    STARS:{KINDS:STARKINDS,rec:starRec,count:starCount,pips:starPips,header:pageHeader,
           rows:pageRows,cleared:pageCleared,cur:curPage,sync:syncClearedStars,
           snap:pageSnap,open:pageOpen,close:pageClose,earned:pageEarned,init:starsInit,
           PARRATIO,par:pagePar,purse:purseClaim,judge:styleJudge,drain:styleDrain,queue:styleQueue,
           caged:pageCaged,judgeClean:cleanJudge,judgePage:pageJudge},
    HOMES:{R:HOMER,cls:homeClass,register:homesRegister,dist:homeDist,at:atHome},
    JAIL:{SQUAWK,coop:coopCell,dir:squawkDir,fire:squawkFire,ping:squawkUpdate},
    LEDGER:{actorOf,add:ledgerAdd,of:ledgerOf,total:ledgerTotal},
    HINTS:{text:hintText,scan:hintScan,add:addHint},   // add: the seam the TODO 55 typo-safety proof drives
    WORLDREGS,WORLDHANDLES,WORLDLISTS,WORLDFLAGS,
    BIOME:{ALL:BIOMES,DEFAULT:BIOME_DEFAULT,define:defineBiome,of:biomeOf},
    /* THE CAMPGROUND'S OWN TABLE, exported for the same reason SKI is: the battery pins the
       CONSTANTS the map was built from rather than re-typing coordinates that would then drift. */
    CAMP:{NEST:CAMPNEST,TRACK:CAMPTRACK,SHELTER:CAMPSHELTER,ABLUTION:CAMPABLUTION,
          VAN:CAMPVAN,TENT:CAMPTENTSITE,BOARD:CAMPBOARD,TAP:CAMPTAP,BIN:CAMPBIN,SITES:CAMPSITES},
    VILL:{NEST:VILLNEST,ST:VILLST,PATH:VILLPATH,VER:VILLVER,SHOP:VILLSHOP,UNITS:VILLUNITS,
          SHELTER:VILLSHELTER,BIKE:VILLBIKE,LAMP:VILLLAMP,BINS:VILLBINS,PLANTERS:VILLPLANTERS},
    SHOPGLASS, PAL,
    /* REPLAT P6A: THE PROP SEAM. Exported as a block for the same reason SKY is — the batteries pin
       the registry itself rather than re-typing twenty-six rows of it, and src/models.mjs reads one
       source of truth for what wants a model, where it stands and what its material policy is.
       `nightTint` and `matFam` are here because the model tier has to apply the SAME two policies a
       primitive body gets, and a loader with its own copy of either would drift from the world it
       is dropping a model into. */
    PROPS:{ALL:PROPS,define:defineProp,of:propOf,place:placeProp,placed:propPlaced,
           anchor:propAnchor,localToWorld:propLocalToWorld,collider:propCollider,
           state:propsState,ignored:PROPSIGNORED,defaults:PROPDEFAULTS},
    nightTint, matFam, propsState,
    /* REPLAT P2: the sky recipe is exported so the batteries pin the CONSTANTS rather than
       re-typing the numbers, and so src/sky.mjs reads one source of truth for the HDRI path,
       the env intensity and the measured rotation instead of keeping a second copy. */
    SKY,
    /* REPLAT P3. MATS is the recipe, MATFAM the colour->family registry, and MATSET the runtime
       the browser installer fills; matState/matDress/uvMetres are exported because the battery
       proves the ARITHMETIC (texel density, the tint, the paint normalisation) rather than
       photographing its consequences, and src/materials.mjs needs the runtime to install into. */
    MATS, MATFAM, MATSET, matState, matDress, uvMetres, matFam,
    /* REPLAT P4. GRASS is the recipe; grassTier/grassReject/grassBladeGeo are exported because the
       gate proves the ARITHMETIC — tier thresholds, the reject mask, blade topology — rather than
       photographing its consequences, none of which a headless battery could otherwise reach. */
    /* REPLAT P5: the credits block and its renderer, so a battery can cross-check the licence
       ledger against what a player actually sees. */
    CREDITS, creditsRender,
    /* REPLAT P5b: the rig adapter. Exported so bird.mjs can bind and a battery can exercise the
       conjugation against a synthetic skeleton without booting a bird. */
    KEABIRD, keaBirdFrame, keaRigBind, keaRigApply,
    GRASS, grassTier, grassCuts, grassBladeGeo, grassLattice, GRASS_GLSL_V,
    /* REPLAT P4e. The ground term's fbm has to be comparable to the blade shader's AS TEXT, because
       "a similar noise field" is how the seam comes back. */
    MATFAR_GLSL,
    grassComb, grassTuftPose,
    /* REPLAT P4d. The gate has to compute the blob-scan gate the way grassShader computes it —
       from the LAYER SPECS — rather than from a second copy of the numbers, because the bug this
       piece fixed was a gate whose threshold nobody could see from the recipe. */
    grassSpecs,
    /* PAL travels with SKY for one reason: "the fog is tuned to the sky" is only checkable if a
       battery can read BOTH numbers, and the dome's colours live here. Exported as the palette it
       is, not as a favour to one assertion. */
    PAL,
    SKI:{SNOW:SKISNOW,TOW:SKITOW,PISTE:SKIPISTE,LODGE:SKILODGE,NEST:SKINEST},
    TRAFFIC:{of:biomeTraffic,spawn:spawnTraffic},
    TOUR:{TABLE:TOUR,KEY:TOURKEY,ARRIVEKEY,model:tourModel,pin:tourPin,pick:tourPick,render:tourRender,open:tourOpen},
    TRAVEL:{K:TRAVEL,KEYS:TRAVELKEYS,out:travelOut,in:travelIn,busy:travelBusy,u:travelU,
            skip:travelSkip,end:travelEnd,tick:travelUpdate,anchor:travelAnchorOf},
    CAMS:{update:updateCams},   // the seam the TODO 38 camLock-ordering proof drives, with a stub camera
    FIX:{DECAY,can:canRestore,fixable,value:orderValue,fix:fixTear},
    BOTCH:{FIDELITY:BOTCH,BAND:BOTCHBAND,noise:botchNoise,wonk:botchWonk,apply:botchApply},
    CARRY:{value:carryValue,back:carryBack,HOMER,at:atHome,dist:homeDist},
    ARENA:{stamp:arenaStamp,of:areaOfInter,at:arenaAt,ok:arenaOK,home:interHome},
    ROLEREX:{CAGE:VSCAGE},
    VSHUD:{W:VSHUDW,state:vsHudState,clock:vsClock},
    FOOD:{STOCK:FOODSTOCK,list:()=>G.foodSrc,near:foodSrcNear,at:foodSrcAt,
          orders:foodOrders,orderFor:foodOrderFor,fetch:foodFetch},
    VS:{LEN:VSLEN,SUDDEN:VSSUDDEN,on:vsOn,start:vsStart,end:vsEnd,update:vsUpdate,
        scores:vsScores,role:vsRoleOf,note:vsNote},
    plateLines,hudReflow,todoFoot,setPrompt,PROMPTS,PREEN,P1MAP,P2MAP,CASEFILES,checkCaseFiles,setSeed,SAVE,rnd,MAPKIND,smoothFacetNormals,SMOOTHSTAT,SMOOTH_DEG,roundedBoxGeo};
}
/* boot moved to src/main.mjs at REPLAT P1 — see REPLAT-PORT.md */
/* KEA-LOGIC-END */

export default globalThis.KEAGAME;
export { THREE };
