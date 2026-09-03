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
