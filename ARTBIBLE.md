# ARTBIBLE.md - target recipes for studio parity
Read before ANY visual piece, wave or overnight. The wall
(gauntlet/reference/board/) holds the pictures; this file holds the law
derived from them. Locked wave decisions are appended here as constants -
an unfilled section means that wave has not run yet.

## STANDING LAWS
- Judgements are made against sidebyside pairs, never memory.
- Variant strips before any taste lock (ritual in WAVES.md).
- A recipe is locked only when written as named constants + assertions.
- Vividness law: NZ tourism-campaign colour - saturated, never washed out.
- Fidelity model: UGG simplicity, ASH atmosphere, SwaG density - stylized
  correctness, not photorealism.

## REPLAT P2 - SKY AND SUN   [LOCKED 2026-09-03, session 15]
The phases below were cut for the STYLISED plan. REPLAT.md supersedes that plan for LIGHT,
MATERIALS, GRASS and DENSITY, and this section is the locked recipe for the light half of it.
Judged against ref_bow_00 (daylight), ref_bow_04 (warmth) and ref_bow_06 (shadow softness).
THE RECIPE IS THE `SKY` BLOCK IN src/game.mjs. Every number below is a named constant there and is
frozen by assertions in the REPLAT P2 section of audits/2026-08-28/harness-everything.js. Six
sabotages were run against those assertions and all six go red. Change the constants, not the
call sites - initScene and nightApply read SKY and hold no literals of their own.

ENVIRONMENT (image-based light)
  hdri            assets/hdri/pizzo_pernice_1k.hdr   (Poly Haven, CC0, licence in assets/LICENCES.md)
  envIntensity    0.55 day / 0.80 night
  envRotationY    2.0630 rad - MEASURED, and self-checking. The identity the battery asserts is
                  envRotationY === atan2(sunPosDay.z, sunPosDay.x) - hdriSunAz. Re-measure
                  hdriSunAz (0.6325) if the HDRI or the sun moves; do not carry the number over.
  WHY THIS SKY. Three candidates went to a strip. pizzo_pernice is alpine, its ground is golden dry
  tussock, and it has the strongest warm ground bounce of the three (bounce ratio 0.244 against
  0.124 and 0.082) - which is what makes shade COLOURED rather than grey, the quality all three
  reference frames turn on. dry_field looked the warmest and is the WORST fit, measured: its sun
  stands at 20.2deg elevation against the game's 39.5deg, so its IBL would contradict the
  directional light. kloofendal_43d_clear matches elevation to 3.4deg and is the alternative if the
  13.6deg residual on pizzo ever matters. All three stay in the tree; KEASKY reshoots any of them.
  ENERGY, NOT TASTE, SETS THE SCALE. The painted gradient P2 replaced was already lighting the game
  at full strength (Scene.environmentIntensity defaults to 1). Its solid-angle-weighted mean
  radiance is 0.6132 and pizzo's is 0.6892, so 0.890 is the energy-neutral swap. Each HDRI needs
  its OWN value: neutral is 0.744 for kloofendal and 1.284 for dry_field.

SUN (one warm directional)
  sunDay          0xFFEAC8   intensity 1.85 x pi     position [-46, 42, 22]
  sunNight        0xB9CCEE   intensity 0.24 x pi     position [36, 30, -26]

AMBIENT
  hemi   0.18 day / 0.13 night   sky 0xC7DBE8   ground 0x8A7C42 (the warm gold bounce)
  fill   0.05 day / 0.05 night
  rim    0.10 day / 0.04 night
  THE CENTRAL TRADE, AND THE THING NOT TO UNDO. fill and rim are directional lights that DO NOT
  CAST. They were authored to fake directional interest in a game where nothing cast a shadow, and
  they fill every real shadow straight back in. P2 moved their energy to the sun, which does cast.
  Measured at 01_carpark_wide, holding exposure at the P1 baseline throughout:
      env 0.89 / fill 0.15 / rim 0.15 / sun 1.45    YAVG 163.5   YLOW 122   flat
      env 0.55 / fill 0.05 / rim 0.10 / sun 1.85    YAVG 155.7   YLOW  97   LOCKED
      env 0.40 / fill 0.00 / rim 0.08 / sun 2.10    YAVG 152.1   YLOW  80   stronger
  A battery holds (fill+rim)/sun under 0.12; the flat state was 0.207.

FOG (exponential, tuned to the sky)
  fogDay 0xC4D2D6  density 0.0062      fogNight 0x0C1524  density 0.0148
  FogExp2, NOT the linear Fog(92,218) it replaces: a near plane means nothing hazes at all inside
  it and then haze ramps on a straight line, which is why the hills used to read as pasted on.
  The colour moved because the old 0x93AEBF was DARKER than the dome's own horizon (skyLow
  0xC9DCE6), so ridges faded toward something bluer than the sky behind them - the one thing aerial
  perspective never does. A battery asserts the fog is no darker than skyLow.
  Density strip at 06_skyline and 11_trailhead: 0.0035 / 0.0062 / 0.0090 all held exposure and
  saturation within 2 points; 0.0062 is the middle and is the least committed of the three.

SOFT SHADOWS
  shadowType 'vsm'   map 2048   radius 4.2   blurSamples 14   bias 0.0   normalBias 0.022
  extent +/-58   far 170
  VSM BECAUSE IT IS THE ONLY THREE SHADOW MAP WHOSE SOFTNESS IS A PARAMETER. PCFSoftShadowMap
  ignores shadow.radius outright - its kernel is a fixed 4-tap in texel space - so the r128 build's
  `sun.shadow.radius=3` was decorative for its whole life. Compared at zero ambient, VSM's penumbra
  is clean and feathered where PCFSoft's is dithered and noisy. BIAS IS ZERO ON PURPOSE: a variance
  map compares moments, not depths, so a negative constant bias opens light leaks instead of curing
  acne. Put it back if anyone reverts to pcfsoft - the battery pairs the two.
  AND THE CARPARK HAD TO BE MADE TO RECEIVE ONE. `{noshadow:true}` turns off cast AND receive; the
  carpark slab, its apron and its bay markings all used it, so every car in the opening set had
  been casting into a surface that could not take a shadow. ARTBIBLE listed the result below as a
  GAP ("no cast shadows anywhere") and treated it as work not yet done. It was one flag per surface.

WHAT IS STILL SHORT OF THE REFERENCE, HONESTLY, AND WHY IT IS NOT P2's
  - SATURATION. 01_carpark_wide reads SATAVG 14.4 against the P1 baseline's 21.3. Ablated: fog
    costs ~3.1 and the environment swap ~3.2, and the shadow map costs nothing (identical to four
    decimals). It was NOT chased further, deliberately: SATAVG is a whole-frame chroma average
    dominated by grey tarmac and blue sky, warmth and fog-density strips barely move it, and
    pushing it back would mean distorting the light model to satisfy a landscape metric. FLAKES
    law 12 is the precedent. Judge the frames, not the average.
  - SHADOW CONTRAST is still below ref_bow_06. The softness is right; the depth is not. Variant C
    above is the closer answer and is shot.
  - THE SKY DOME cannot respond to any of this - it is unlit authored art. TODO 76.
  - EVERYTHING ELSE in the gap to ref_bow_00 is MATERIAL and GEOMETRY: flat untextured colour,
    primitive shapes, no leafy casters to throw dappled shade. That is P3 through P6.

## REPLAT P3 - SCANNED MATERIALS   [CONSTANTS LOCKED 2026-09-03, session 16; THE LOOK IS FLAGGED, NOT JUDGED]
Judged against ref_bow_00 (brick and weatherboard), ref_bow_03 (bin plastic and grass) and
ref_bow_06 (metal, asphalt, foliage), per Eric's brief. THE RECIPE IS THE `MATS` BLOCK IN
src/game.mjs. Every number below is a named constant there and is frozen by assertions in the
REPLAT P3 section of audits/2026-08-28/harness-everything.js. Fourteen sabotages were run against
those assertions; thirteen go red and the fourteenth is recorded below because it does not.
NOTHING WAS RE-PINNED. 27 of 28 vantages are flagged and the look is Eric's.

THE SEVEN FAMILIES. All Poly Haven, all CC0, all 21 files md5-verified against the publisher's API
at import and listed in assets/LICENCES.md.
  family        set                   tile      mode    tint   texel
  grass         withered_grass        2.000 m   paint   -      1.95 mm
  gravel        gravel_floor_02       2.000 m   scan    0.35   1.95 mm
  asphalt       asphalt_02            3.000 m   scan    0.45   2.93 mm
  weatherboard  dark_planks           2.000 m   paint   -      1.95 mm
  corrugate     corrugated_iron_02    2.700 m   paint   -      2.64 mm
  brick         brick_wall_09         2.010 m   scan    0.20   1.96 mm
  snow          snow_02               2.000 m   scan    0.55   1.95 mm
SNOW IS THE SEVENTH AND WAS NOT IN THE BRIEF. REPLAT P3 names six; the game has a whole ski field
and PAL.snow was carrying a procedural canvas exactly like the other six, so leaving it would have
shipped one biome half-done.

WHY THESE SEVEN SETS AND NOT THE OTHER 848. Every family went to a six-candidate contact sheet
rendered from Poly Haven's own preview spheres and judged against the wall, not picked off a name.
The reasoning that decided each:
  withered_grass    the ground under ref_bow_03's bin is DRY STRAW LITTER, not green lawn, and the
                    country here is Lindis tussock gold. leafy_grass and sparse_grass are both
                    green and both wrong for this palette; dry_decay_leaves is a forest floor.
  gravel_floor_02   NZ carpark gravel is pale crushed greywacke. gravel_stones is near-black
                    basalt and bicolour_gravel is green-cast; this one is the grey.
  asphalt_02        grey, coarse aggregate, subtle tar cracks - the closest of six to ref_bow_06's
                    driveway. asphalt_04 is a 4 m tile and would repeat less, and is too smooth
                    and too pale to read as a surface at bird height.
  dark_planks       the only candidate that is genuinely WEATHERBOARD - overlapping boards with a
                    real shadow line at each lap - and its 2 m tile puts a lap every ~140 mm,
                    which is what a weatherboard is. The brown_planks_* family is butt-jointed
                    and 1 m, so its laps land at 80 mm.
  corrugated_iron_02  galvanised, screw fixings visible, and 2.7 m over ~34 ribs is a 79 mm pitch
                    against a real sheet's 76 mm. corrugated_iron_03 is finer than any real sheet.
  brick_wall_09     ref_bow_00's brick is CLEAN AND REGULAR with crisp mortar courses, and the
                    first six candidates were all rustic or crumbling. This is the running-bond
                    red-brown one, at ~77 mm courses against a real brick's 86 mm.
  snow_02           smooth, wind-packed, powdery. PAL.snow is "hard alpine snow"; snow_03/04/05
                    are all trampled or muddy and snow_01 carries footprints.

TEXEL DENSITY IS DERIVED, NOT DIALLED, AND THAT IS THE POINT OF THE PIECE.
`tileM` is the publisher's own published real-world size, in metres, cross-checked by a battery
against the millimetres recorded in LICENCES.md. The chain is: geometry UVs are rescaled into
METRES, then the family's textures repeat at 1/tileM, so a texel is tileM/1024 across on every
surface in the game. THE UVs CARRY THE METRES AND THE TEXTURE'S REPEAT DOES NOT, because a
BoxGeometry's UVs run 0..1 PER FACE - one shared repeat would give a 40 m carpark slab and a 0.7 m
chimney the same number of tiles, which is the difference between gravel and a photograph of gravel
stretched over a car park. The alternative is a material clone per (family, size) pair, which
multiplies draw calls to solve a geometry problem.
2 mm PER TEXEL IS NOT EXCESSIVE, IT IS THE VANTAGE. This game is played at bird height and
ref_bow_02 and ref_bow_03 are both shot from about 300 mm off the ground. At that range 2 mm/texel
resolves; at the wide vantages it mips to a mean, which is what it should do.

TWO MODES, BECAUSE A PAINTED SURFACE AND A MATERIAL SURFACE ARE NOT THE SAME PROBLEM.
ref_bow_00 is the whole argument in one frame: the brick is BRICK-COLOURED and the weatherboard
trim beside it is CREAM BECAUSE SOMEBODY PAINTED IT.
  scan    the scan's albedo IS the colour. The palette colour survives as a LUMINANCE-NEUTRAL
          tint - the authored hex divided by its own luminance, so it pushes hue without touching
          exposure - and `tint` lerps white toward that hue. Same energy-neutral trick P2 used on
          the environment, for the same reason: a look decision must not smuggle in an exposure
          change. A battery asserts the dressed colour's luminance is 1.000 for all four.
  paint   the palette colour IS the paint and the scan supplies the SURFACE. All three maps are
          still consumed: the albedo is reduced to its own luminance and renormalised in a canvas
          pass until its mean is `paintMean` (0.75), and the material colour is scaled by
          1/paintMean to put the exposure back. What the albedo then contributes is the thing that
          was missing - the shadow in every weatherboard lap, the dark in every corrugation valley,
          the mottle of dry grass - and the hut stays the red it has always been.
          paintMean IS 0.75 AND NOT 1.0 because an 8-bit albedo cannot hold a value above 1, so a
          map normalised to a mean of 1 has no headroom and clips every lit plank flat.
THE TERRAIN IS 'paint' FOR A THIRD REASON. Both ground planes are vertex-colour BLENDS of three or
four surfaces - grass, tussock, gravel, scree on the carpark; snow, wind-scour, rock, tussock on the
field - and one albedo cannot be four materials at once. A splat-blended scanned terrain is P4's
problem. So the planes take the scan's relief and roughness at full strength over the palette blend
they already had. The carpark plane takes grass; the ski field's takes snow.

ROUGHNESS COMES FROM THE SCAN, SO THE MATERIAL'S OWN ROUGHNESS GOES TO 1.
three MULTIPLIES material.roughness by roughnessMap.g. mat()'s authored 0.82 times a map averaging
about 0.6 is 0.49, and a wet-looking car park is not a scanned car park. `roughScale` is the named
home for a future tune and is deliberately 1.0 today. Until the textures land a family material
keeps its authored roughness, so a browser whose fetch failed looks like the game it was.
METALNESS IS ZERO ON ALL SEVEN, ON PURPOSE. The ARM map carries it in blue and P3 reads only green.
The two metal-ish surfaces here are a PAINTED corrugate roof and a painted lodge, and painted steel
is a dielectric. Bare galvanised metal is a P6 question, when there are props that are bare metal.

THE COLOUR IS THE KEY, WHICH WORKS AND ALMOST DIDN'T. mat() caches by colour, so registering a
family against a hex claims every surface painted that hex. Three call sites write the raw
`0x9B9891` instead of `PAL.gravel`, so the first grep found two of five and the material census
found the rest: half the loose-stone scatter would have stayed on the procedural speckle canvas
while its siblings went scanned, and the LODGE CHIMNEY would have been rendered in driveway gravel.
GREP THE HEX AS WELL AS THE NAME. Both fixed: 0x8E8B84 joined the gravel family so both scatters
are uniform, and the lodge chimney took the hut chimney's grey, which made brick two surfaces
instead of one.

WHAT IS STILL SHORT OF THE REFERENCE, HONESTLY, AND WHY IT IS NOT P3's
  - TILING REPETITION IS VISIBLE on the car park and the road. asphalt_02's tar cracks repeat every
    3 m, about 13 times across the 40 m slab. On the road they read as expansion joints and are
    almost a gain; on the slab they are a repeat. The fixes are all bigger than P3: a second
    breakup layer, a triplanar or stochastic sample, or a 4 m tile at a coarser texel. NOT chased,
    because every one of them is a taste call and Eric has not seen the frames yet.
  - THE GRASS SCAN IS BARELY VISIBLE at the wide vantages, because 42,000 cone blades stand on top
    of it. That is P4's brief exactly, and the scan is what P4's blades will stand in.
  - BRICK RESTS ON TWO CHIMNEYS. ref_bow_00 is a brick HOUSE; the game has no masonry wall. The gap
    is GEOMETRY, which is P6. The family is sourced, licensed, tiled and proven so that P6 opens
    with it working rather than discovering on the day it has no brick.
  - THE PALE TARMAC ELLIPSES still read as puddles at 01. Pre-existing, listed as a PHASE 1 gap,
    untouched here.
  - NOT ONE PROP CHANGED. Bins, cars, signs and the picnic set are still primitives wearing flat
    colour - ref_bow_03's bin plastic is a MODEL question, and that is P6.
  - THE ONE SABOTAGE THAT SURVIVED. Deleting uvMetres' own idempotence guard leaves the battery
    green, because matUVSweep checks the same mark before it calls, so nothing reaches it twice
    today. Deleting BOTH guards goes red with the squaring visible in the numbers - the 240 m
    terrain reports a 57600 m UV span. The inner guard is kept as defence in depth and is labelled
    as such in the source rather than left looking load-bearing.

## REPLAT P3b - THE TILING BREAKUP   [LOCKED 2026-09-03, session 17, on Eric's P3 verdicts]
Eric's three verdicts on P3: (1) the carpark tarmac shows visible tiling repetition, fix it with
BREAKUP and not a bigger texture; (2) the four tints pass as-is; (3) the ski tow anchor block
wearing gravel is a mis-assignment, it is a poured-concrete footing. All three are here.
THE RECIPE IS THE `MATS.breakup` BLOCK AND THE `iso` FLAGS IN src/game.mjs, frozen by the REPLAT
P3b section of audits/2026-08-28/harness-everything.js. Fourteen sabotages, all fourteen red.

  patchM 2.6 m   macroM 17.3 m   macroAmount 0.16   macroRough 0.10   blendSharp 4.0
  varRestore 0.0  (measured and REJECTED - see below)

TWO HALVES, BOTH OF THEM ERIC'S BRIEF VERBATIM.
  1. A LARGE-SCALE VARIATION LAYER THAT NEVER ALIGNS WITH THE TILE. Two octaves of value noise in
     WORLD metres at 17.3 m per cell, driving albedo (0.16) and roughness (0.10) together, because
     weathering changes how a surface scatters and not only how dark it is.
     IT IS PROCEDURAL NOISE AND NOT A SCANNED GRUNGE MAP, ON PURPOSE, and that is not a retreat
     from P3's law. A breakup layer that is itself a texture HAS ITS OWN REPEAT PERIOD, so it would
     cure the problem by adding a second slower copy of it. A position hash has no period at all.
     WORLD space and not model space: the slab, its apron and the road are three separate boxes in
     one plane, and a wear field that restarted at each mesh origin would draw a join exactly where
     the geometry joins. A battery asserts macroM is not a whole multiple of any iso tile.
  2. PER-TILE ROTATION AND OFFSET SO NO TWO TILES MATCH. Stochastic tiling on a triangle lattice
     (Heitz and Neyret): each lattice vertex hashes its own rotation and offset, the three nearest
     are blended by barycentric weight, and each tap samples with textureGrad handed the ORIGINAL
     derivatives rotated by that tap's own rotation. Explicit gradients are not optional - a
     per-cell offset makes the UV jump at a cell border, and hardware auto-derivatives read that
     jump as an enormous rate of change and collapse to the smallest mip, which is the classic dark
     seam that fract() in a UV produces. three emits `#version 300 es` for every built-in material,
     so textureGrad is simply available.
     THE TANGENT-SPACE NORMAL IS ROTATED BACK per tap before blending. A normal map is a GRADIENT IN
     TEXTURE SPACE, so sampling at R*uv means the gradient read must be carried back by R^T. Skip
     it and the relief lights as though every patch had its own private sun - which reads as
     "noisy" rather than as "wrong", and would have been very hard to attribute later.

`iso` IS THE GATE, AND IT IS A FACT ABOUT THE MATERIAL RATHER THAN A PREFERENCE.
  isotropic, rotated:      grass, gravel, asphalt, snow
  directional, NOT rotated: weatherboard (laps run level), corrugate (ribs run down the slope),
                            brick (courses stay horizontal), concrete (form lines stay level)
Rotating a directional tile would tilt the laps and lean the courses, which is a worse defect than
the repetition being cured. A battery reads the gate off the FAMILY and checks, in both maps, that
every material carrying breakup uniforms belongs to an iso family and every iso material has it.

THE VARIANCE RESTORE IS CORRECT ARITHMETIC AND IS SHIPPED OFF. Measured on a four-frame strip at
01_carpark_wide:
  A  off                    the repetition Eric flagged: long parallel cracks marching in step
  B  sharp 1.0 / var 0      repetition gone, slightly soft
  C  sharp 4.0 / var 0      repetition gone, contrast held            LOCKED
  D  sharp 1.0 / var 1.0    THE LATTICE DRAWN AS DARK HEXAGONS across the whole car park
Three-tap blending removes variance by the sum of the squared weights, and `varRestore` puts back
exactly that - so it is not wrong, it is misplaced: it boosts contrast HARDEST where the blend is
widest, which is precisely on the seams it was meant to hide. Heitz and Neyret pair weight
sharpening with a histogram-preserving transform, which needs a precomputed decorrelated texture
and an inverse CDF per map. Without that, `blendSharp` alone is the answer, and it works for the
reason that matters: it makes most of the surface a SINGLE tap at full native contrast and leaves
only narrow slightly soft bands. varRestore is KEPT at 0 - it is the right thing to reach for the
day somebody adds the histogram transform, and a knob that was measured and rejected is worth more
written down than deleted. A battery pins it at 0.

THE COST, MEASURED IN PLACE AND NOT ESTIMATED. Three taps on three maps is nine texture fetches
where the breakup runs. At 1280x720, against a control built by swapping the same 72 meshes to a
plain MeshStandardMaterial carrying the IDENTICAL maps and lights, with the GPU flushed by a
readPixels each pass and the best of five runs of forty renders taken:
  breakup 3.692 ms/render     plain 3.240 ms/render     +0.452 ms, +14% of scene render
That is 2.7% of a 16.67 ms frame, and the game stays vsync-locked at 60. Recorded here so P4 starts
from a number rather than from a guess.

THE CONCRETE FAMILY, Eric's third verdict. `concrete_layers_02` (CC0, Poly Haven, 2.000 m,
mode scan, tint 0.30, NOT iso). The ski tow's top anchor block carried PAL.gravel, so P3 rendered a
poured footing in driveway gravel. It has a hex of its own now (0xA9A7A2) - which is the second
time in two sessions that one family's colour speaking for another object's material has been the
defect, and the reason MATFAM's note now says GREP THE HEX AS WELL AS THE NAME.
Board-formed rather than plain: six candidates went to a sheet, and `concrete_floor_02` would have
done but carries a green moss cast that is wrong above the snowline.

WHAT IS STILL SHORT, HONESTLY, AND WHY IT IS NOT P3b's
  - THE ANCHOR BLOCK IS 12.6 PIXELS WIDE, AND THAT IS MEASURED RATHER THAN GUESSED. It sits at the
    TOP of the rope tow, and the only pinned vantage that can see it is 30_groomed_band, which
    looks up the hill: projecting the block through that vantage's camera puts it 66.7 m out, 5.5deg
    off axis (well inside the 45.7deg horizontal half-FOV), and 1.8 m at that range is 12.6 px of
    960. So the fix is correct, asserted, and very nearly invisible. Whether it deserves a vantage
    of its own is Eric's call and not a side effect of this piece.
  - THE MACRO LAYER IS SUBTLE ON SNOW at 0.16, because snow is high-albedo and a 16% swing reads
    much softer there than on tarmac. One amount serves four families; a per-family amount is a
    real idea and is not in the brief.
  - THE BLEND BANDS ARE STILL SLIGHTLY SOFT at blendSharp 4. The histogram-preserving transform is
    the real fix and it is a piece of its own, with a precomputed texture per family.
  - THE GRASS SCAN IS STILL UNDER 42,000 CONE BLADES. P4, unchanged.

## REPLAT P4 - INSTANCED GRASS   [LOCKED 2026-09-03, session 18; THE LOOK IS FLAGGED, NOT JUDGED]
Judged against nz_tussock_01 for the country and ref_bow_02 / ref_bow_03 / ref_bow_15 for density
and light through the blades. THE RECIPE IS THE `GRASS` BLOCK IN src/game.mjs, frozen by the REPLAT
P4 section of audits/2026-08-28/harness-everything.js. NOTHING WAS RE-PINNED.

  SHIPPED TIER  mid = 120,000 blades in a 14 m radius = 195 blades/m2
  seg 4 (9 vertices, 7 triangles)   taper 0.72   bend 0.34   snap 0.5 m
  clumpJit 0.55   clumpPull 0.42   fadeBand 0.11   comp 0.45
  (mound spacing and bare fraction are PER BIOME - see the profiles below)
  wind: gust 0.19 @ 0.55 Hz over 0.055 m^-1, flutter 0.075 @ 2.7 Hz
  transmission: amt 0.55, pow 3.2, wrap 0.32, colour 0xFFE7A8

THE FIELD FOLLOWS THE CAMERA, AND THAT IS THE WHOLE DESIGN.
The first cut placed blades statically over a disc centred on the world origin, and the measurement
killed it: the playable world is ~12,900 m2, the budget tops out near 420,000 blades, and 420,000
over 12,900 m2 is THIRTY-THREE BLADES PER SQUARE METRE, which photographs as stubble. Shrinking the
radius to raise density does not help — it moves the grass away from the bird, and the r20 frame in
the density sweep came back with an EMPTY FOREGROUND for exactly that reason. So `near` is a radius
around the CAMERA: every blade submitted is close enough to matter, density is the same wherever
the bird goes, and the same budget buys 195/m2 instead of 33/m2. Beyond `near` the ground is the P3
scanned grass under fog, which is what distance grass actually looks like.
The anchor is SNAPPED to 0.5 m so the field cannot swim, and every per-blade property is hashed
from the blade's WORLD POSITION rather than its instance index - so when the anchor snaps and a
blade lands on new ground it takes on that ground's blade instead of carrying its own appearance
across the world.

THE FRAME BUDGET, MEASURED AND NOT ASSUMED.
Loop-timed scene cost with the GPU synced by a readPixels, best of six passes of forty renders, at
the Retina framebuffer this game actually runs at - 2304x1296, because setPixelRatio caps at 1.8 and
a Mac reports 2. Pre-P4 baseline (the 42,000-blade triangle carpet): 8.978 ms.

     TIER        blades   radius   blades/m2      scene ms    vs baseline
     low         60,000     14 m          97        16.710          1.9x
     mid        120,000     14 m         195        23.878          2.7x    <- SHIPPED
     high       240,000     17 m         264        39.360          4.4x
     (measured beyond the tiers, before the height tune: 420,000 in r20 = 334/m2, 62.360 ms;
      1,000,000 -> 134.7 ms; 1,900,000 -> 259.5 ms with 26.9M triangles submitted, all of which
      the GPU really did draw - the triangle counter was checked, because a cost that does not
      move is usually a thing that is not happening)

  seg 2 INSTEAD OF seg 4 saves about 19% (120,000 blades: 24.307 -> 19.775 ms) and costs the blade
  its arc. Not taken: the curve is most of what makes a blade read as a blade at bird height.

WHY mid AND NOT high, WHICH IS THE HONEST LIMIT ON THIS PIECE.
NO INSTRUMENT IN THIS HARNESS CAN MEASURE A TRUE FRAME RATE. Headless Chrome drives
requestAnimationFrame on a fixed cadence: it reported 59.9 fps median for 120,000 blades, for
1,900,000 blades AND for the pre-P4 build, all identical, while the loop-timed cost of those three
differs by a factor of ten. A number that does not move when the work grows tenfold is not
measuring the work, and I nearly recorded it as proof that everything held 60. `perf.mjs` RAF mode
now says so in its own header and reports a CADENCE rather than an fps.
So "holds a playable frame rate on Eric's Mac" cannot be settled from here. What CAN be said is
that 8.978 ms was the already-accepted cost of the shipped build, and mid is 2.7x that while high
is 4.5x. Photographed at 05_tussock_ground the four densities are close - 60k already reads as a
field because the clumping concentrates it, and above 240k the difference is barely visible while
the cost doubles again. Shipping the 2.7x tier is the defensible call; `high` is measured, kept,
and one env var away on the machine that can actually judge it:
    KEAGRASS='{"tier":"high"}' npm run dev

THE HEIGHTS AND THE CLUMPING WERE TUNED AGAINST THE SUBJECT FLOORS, BECAUSE THE FIRST CUT BURIED
THE BIRD. At h 0.30-0.78 with clumpPull 0.62 the kea portrait read 465 pixels against a floor of
1600 and the preen vantage 414 against 900 - three bird classifiers red at once, which is the
gauntlet saying the game had stopped showing its protagonist. Measured at 03_kea_plate / 13_idle_preen:

     h 0.30-0.78  pull 0.62  bare 0.28     465/1600     414/900
     h 0.30-0.78  pull 0.42  bare 0.18     737/1600     595/900
     h 0.22-0.52  pull 0.42  bare 0.18    1573/1600    1494/900
     h 0.20-0.48  pull 0.42  bare 0.18    1663/1600    1604/900   <- LOCKED
     h 0.18-0.44  pull 0.42  bare 0.18    1683/1600    1647/900

Blade HEIGHT is the dominant lever; the looser clumping is what stopped the field reading as
isolated brushes with bare ground between them. Some occlusion is authentic - ref_bow_03's bin is
half-buried and it looks right - but a bird you cannot see is not a trade, it is a bug, and the
subject floors are the instrument that said so. NO FLOOR WAS TOUCHED.

CLUMPING IS WHAT MAKES IT A FIELD AND NOT A LAWN.
nz_tussock_01 is discrete golden mounds with open ground between them, and a uniform scatter cannot
read as that at any density - which is the real reason the old triangle carpet looked like a lawn.
Blades are pulled toward their cell's jittered centre (`clumpPull`) and 28% of cells are dropped
entirely (`bare`), both in the vertex shader off a hash of the cell coordinate. The scatter itself
is a golden-angle sunflower lattice rather than uniform random, because a random disc scatter makes
its own voids and those are indistinguishable from the deliberate bare ground.

TUSSOCK IS A SHAPE CLAIM, NOT A COLOUR ONE.
  carpark   h 0.20-0.48 m   w 5.5-12.5 mm   lean 0.10-0.34   bare 18%   mounds 1.35 m
  skifield  h 0.26-0.62 m   w 3.5-8.0 mm    lean 0.05-0.19   bare 34%   mounds 1.75 m
A tussock leaf is longer, narrower and stands closer to upright than pasture grass, in tighter
mounds with more open ground between. The battery asserts the RELATION between the two profiles so
it survives both being retuned.
AND THE SKI FIELD HAS GRASS FOR THE FIRST TIME. Its terrain has always lerped to tussock below
z=34 and there was never a blade standing in it - the bottom of that map was a painted gradient.

LIGHT THROUGH THE BLADES.
ref_bow_02 and ref_bow_15 are both backlit and the blades GLOW. An opaque Lambert blade cannot do
that at any density, and it is a large part of why the old carpet read as plastic. Two cheap terms:
a WRAP term so a blade facing away from the sun is not black, and a FORWARD scatter lobe for
looking down-sun through a blade. Both ride the SQUARE of the height up the blade, because a blade
is thinnest at its tip and that is where light actually gets through.
The blade's vertex normals are ONE SHEET normal rather than computed face normals - a blade is one
triangle thick, and a face normal on a curved strip swings through ninety degrees and makes the
whole field read as noise under a directional sun.

WHAT IS STILL SHORT, HONESTLY, AND WHY IT IS NOT P4's
  - THE 260 TUFT CONES ARE STILL THERE, standing among the real blades. They were the stand-in for
    tussock mounds and the blades now do that job; they are left because removing 260 rnd draws
    shifts the seeded stream for everything built after them (FLAKES law 15) and that is a re-pin
    of its own, not a side effect of this piece. Visible as the small gold triangles at 05.
  - THE GRASS CASTS NO SHADOW. A shadow pass over 120,000 blades is a second full vertex pass, and
    the transmission term plus the ground's ambient occlusion stand in for it. Measurable if it is
    ever wanted; not measured, because it was not close.
  - NO GROUND-TEXTURE TINT ON THE BLADES. Sampling the P3 scanned ground in the vertex shader and
    tinting each blade by the ground it grows from would tie the field to the terrain at the macro
    scale. It is a genuinely good idea and it is not in the brief.
  - THE FIELD'S OUTER EDGE IS A FADE, NOT A HORIZON. At 14 m the blades are gone and the P3 ground
    scan carries the distance. That is correct behaviour and it is also the thing to look at first
    if the field ever reads as a circle following the bird.

## REPLAT P4b - THE FIELD ERIC PLAYED   [LOCKED 2026-09-03, session 19; LOOK FLAGGED, NOT JUDGED]
Eric played P4 and named the fault exactly: BOTH GRASS SYSTEMS WERE LIVE AT ONCE. The P4 blade
field and the procedural cone grass it superseded were both in the world, so the ground read as
sand with party hats and tufts of hair. Four fixes, all four here. Judged against nz_tussock_01 and
nz_tussock_03. Fourteen sabotages, all fourteen red.

(1) THE OLD PROCEDURAL GRASS IS DELETED, NOT DISABLED.
  260 five-sided ConeGeometry cones in the carpark, 26 tuft cylinders in the ski field, 5 on the
  nest knoll. P4 left the 260 in on the reasoning that removing them shifts the seeded stream -
  which was true of the nest five and FALSE of the other two, because both of those blocks sat
  inside `if(!HEADLESS)` and node never made their draws. A superseded system is not a fallback.
  A battery now asserts PAL.tussock survives only as a terrain vertex colour: no scattered geometry
  may wear it again.

(2) A CONTINUOUS COVER LAYER, AND WHAT IT CAN AND CANNOT FIX.
  cover: 150,000 blades in a 10 m radius, h 55-130 mm, w 13-26 mm, bare 0.0, clumpPull 0.10,
  seg 2, lodFrac 0.88. Same shader and same geometry builder as the clumps, different numbers.
  It is SHORTER than the shortest clump blade by construction, so the clumps rise out of it and the
  bird readability P4 tuned is untouched. It holds full density almost to its edge (0.88 against
  the clump layer's 0.55) because a clump is a silhouette that can fade early and a cover that has
  half-faded leaves exactly the bare ground it was added to cure.
  THE FIRST CUT OF IT WAS 340,000 BLADES OVER 16 m AND COST 21.9 ms - more than the clump layer -
  AND STILL DID NOT WORK at the play camera. A 100 mm blade at fifteen metres is two pixels tall
  and the ground behind it wins; that is not a density problem and no amount of geometry solves it.
  Cut back to a near-field layer, where it genuinely works and is cheap.

(3) COLOUR, PER BLADE AND PER CLUMP - AND THE GROUND, WHICH WAS THE HALF NO BLADE COULD FIX.
  From nz_tussock_03's foreground mound: an olive-green heart, an ochre body, rust-brown outer
  leaves, ALL IN THE SAME MOUND. A blade mixes base -> its own body colour over the first 58% of
  its length, then toward tip over the top, and HOW MUCH tip it takes is per blade - so some leaves
  are green to the end and others are rust from halfway. The mound's own weight leans the whole
  clump on top of that, without which a field of individually varied blades averages straight back
  to one colour at any distance.
     carpark   base 0x4C6B22  body 0xC58E31 / 0x8E6118 / 0xE6D6A2  tip 0x7A3F16
     skifield  base 0x46661F  body 0xD09B2C / 0x94661C / 0xEADCAC  tip 0x8A4A18
  THE FIRST PALETTE WAS FOUR COLOURS INSIDE TWENTY DEGREES OF HUE and photographed as exactly the
  monochrome it was sent to fix. Forcing base to pure red and tip to pure blue showed the gradient
  working perfectly - the mechanism was never the problem, the colours were. The battery asserts
  SEPARATION now (the base must be a real green by hue, the tip must be darker than the body, the
  three body draws must span a real value range), not merely that the mechanism is present.
  AND THE GROUND. Measured at the play camera, the terrain averaged #9b9787 - a desaturated
  grey-beige - and that is what showed between every clump. `GRASS.groundTint` (0xA8B078) is a
  multiplier on the GRASS-family terrain material only; the ski field's ground is the snow family
  and snow is not supposed to look like soil. It costs nothing and it is the single largest thing
  in P4b that the play camera actually sees.

(4) THE BLADE IS A LEAF, NOT A STRAND.
  taper is PER LAYER now (carpark 0.55, skifield 0.50, cover 0.45) where it was a global 0.72 that
  narrowed almost from the base. Widths 9-20 mm on the carpark clump, 6-14 mm on the alpine one. A
  tussock leaf stays wide most of its length and only narrows near the tip - that is what makes it
  catch light along its whole edge instead of reading as hair.

THE FRAME COST OF THE COVER LAYER, MEASURED AS ERIC ASKED.
Loop-timed scene cost, GPU synced, at the Retina framebuffer (2304x1296). Baseline 8.978 ms.
     clumps only                  19.863 ms   2.2x baseline
     clumps + cover               25.165 ms   2.8x baseline
     THE COVER LAYER              +5.302 ms
For comparison the first, failed cut of the cover was +21.9 ms. P4 shipped at 23.878 ms, so P4b
buys the whole of the above for 1.3 ms over what was already accepted.

WHAT IS STILL SHORT, HONESTLY
  - THE GROUND TINT IS ONE FLAT MULTIPLIER. It cures the sand; it does not give the ground its own
    variation. A second macro layer on the terrain, or splat-blending the P3 gravel family into the
    grass one, is the real answer and is P3's territory rather than P4b's.
  - THE COVER STOPS AT 10 m. Past that the ground tint carries it. That is the correct division of
    labour and it is also the first thing to look at if the field ever reads as a disc.
  - STABILITY IS CLEAN BUT THE MACHINE IS NOT. A four-vantage sweep flagged 05 on one run and
    21/03 on the next; run alone with four takes each, all three read 0.9997 or better and 05 reads
    1.0000. A flagged vantage that MOVES between runs is measuring machine load, not the code -
    the same finding session 17 recorded for 22_torch_beam. Load averaged ~6 from this session's
    own capture passes.

## PHASE 1 - LIGHT & AIR   [not yet run]
TARGETS: ugg_shadows_01/02, swag_shadows_01, nz_mist_01, kea_social_02.
GAPS: no cast shadows anywhere; no AO; pale tarmac ellipses read as
puddles; directionless neutral light; no fog or aerial perspective; torch
cone unoccluded; no sun disc.
JUDGE AT: 01, 03, 12, 14 (+21 night).
LOCKED RECIPE: (unfilled)

## PHASE 2 - GROUND & GRAMMAR   [not yet run]
TARGETS: nz_tussock_01/02/03, nz_carpark_01, nz_road_01, nz_water_01,
nz_river_01, swag_grass_01, swag_ground_01.
GAPS: blades are single flat triangles, no tufts or clumps; biome sameness
(paddock = alpine = verge); knife-edge material seams; white tarn/snow
ellipses unresolved; no bay markings or kerbs; water has no read; rocks
are unburied smooth blobs.
JUDGE AT: 05, 14, 23, 24, 11, 10.
LOCKED RECIPE: (unfilled)

## PHASE 3 - THE BIRD   [brief live in WAVES.md]
TARGETS: kea_head_01/02, kea_underwing_01/02, kea_posture_01/02,
kea_feet_01, kea_scale_01, kea_attitude_01.
GAPS: periscope eyes; cone-stack beak; floating wing shelf; stub feet;
quarter-coverage scarlet with no barring; colossal underscaled.
JUDGE AT: 03, 13, 18, 25, 04, 09.
LOCKED RECIPE: (unfilled)

## PHASE 4 - BUILDINGS, PROPS & DENSITY   [not yet run]
TARGETS: nz_hut_01, swag_density_01, swag_context_01, kea_solar_01,
kea_caravan_01, nz_hikers_01, ugg_shadows_01 (prop/NPC grammar).
GAPS: hut roof floats off its walls; TODO 32 caravan flank details
entombed; sign backs front-coloured; no micro-prop scatter; nothing rests
on rails; humans need UGG noses; no chimney smoke.
JUDGE AT: 02, 06, 19, 23, 12, 20.
LOCKED RECIPE: (unfilled)

## PHASE 5 - MOUNTAINS & SKY   [not yet run]
TARGETS: nz_alps_01/02, kea_lookout_01, nz_mist_01.
GAPS: one cone profile with ruler snowlines; black night cutouts, no
stars or moon; flat-white cloud undersides, one cloud type; no foothills.
JUDGE AT: 01, 06, 11, 21, 22.
LOCKED RECIPE: (unfilled)

## PHASE 6 - COHESION   [not yet run]
TARGETS: the whole wall.
GAPS: no ambient particles; chapter text unplated; pip tray illegible;
popup contrast; the final per-vantage colour pass (the House House
hand-adjust).
JUDGE AT: all 25, then the blind test.
LOCKED RECIPE: (unfilled)
