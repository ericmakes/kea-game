# SKY.md — the sky pass, run the way the mountains were run

Companion to TERRAIN.md. Binding on the sky pass the way TERRAIN.md was binding on the range.
Branch: **replat-b**. Written 2026-09-08 at Eric's instruction, at the end of the terrain work, so
that the plan survives the session that planned it.

---

## 0. WHY, AND WHY NOW

The terrain pass ended with the range scoring 7 of 7 against the plates. The sky it stands in front
of has never been measured against anything. It is the last surface in the game that is pure
authored art, and TODO 76 has named it as the largest remaining P2-shaped gap since 2026-09-03:

> THE PAINTED SKY DOME IS NOW THE ONLY THING IN THE FRAME THAT IS NOT LIT.

That is still true. The dome, its haze band, the sun sprite and the clouds are all
`MeshBasicMaterial` with `fog:false` — authored colour, responding to nothing. Everything else in
the game is lit by a measured HDRI and hazed by exponential fog.

**AND THE TERRAIN PASS PROVED THE METHOD.** Four of Eric's five terrain points were closed by
measuring one number each; every one came back in band and the strip still read as the wrong
mountain. What fixed it was platescore.mjs: five properties, each with a target band derived from
the paired reference, and a table that says which are out. The sky pass runs the same way from the
start rather than arriving there after three wasted rounds.

---

## 1. WHAT IS THERE NOW, MEASURED BEFORE ANY WORK

Read out of `src/game.mjs` (`buildSky`, `PAL`, `SKY`) on 2026-09-08:

| part | what it is |
|---|---|
| dome | `SphereGeometry(210,20,14)`, BackSide, vertex-coloured three-stop gradient: `skyTop 0x1E63B0` → `skyMid 0x5E97C8` → `skyLow 0xC9DCE6`. `MeshBasicMaterial`, `fog:false` |
| horizon haze | `CylinderGeometry(206,206,26)`, `0xC3D2DC`, opacity 0.45, at y 8 |
| sun | ONE canvas radial-gradient sprite, 52×52 plane, additive, at `(-140,40,66)` — `!HEADLESS` only |
| clouds | 8 groups of 3–5 `SphereGeometry` squashed to `scale.y 0.32`, `PAL.cloud 0xFBFCFD`, each with a grey belly sphere `0xAEBBC6` at opacity 0.5 offset down by `0.14r` |
| moon | one mesh at `(58,74,-52)`, `visible = G.time > 0.45` |
| stars | **none** |

**THREE DEFECTS FOUND WHILE WRITING THIS BRIEF, all measured, none yet fixed:**

1. **THE VISIBLE SUN IS NOT WHERE THE LIGHT COMES FROM — 25.0 degrees apart.** The directional
   light sits at `SKY.sunPosDay [-46,42,22]`, which is elevation **39.5°**, azimuth 154.4°. The sun
   sprite sits at `(-140,40,66)`: elevation **14.5°**, azimuth 154.8°. The azimuth agrees to within
   half a degree, so this is not a random placement — somebody matched the compass bearing and not
   the height. Every shadow in the game is cast from a sun 25 degrees above the one you can see.
   This is the first thing to fix and it is free: derive the sprite's position from `sunPosDay`
   rather than repeating it by hand, and assert the two are within a degree.
2. **THE CLOUDS DO NOT DRIFT, AND THE COMMENT SAYS THEY DO.** `// clouds: bright tops, grey
   bellies, drifting flat`. The groups are added to the scene anonymously — no `G.` handle, nothing
   in WORLDREGS — so nothing can animate them and no battery can see them. They are also
   `MeshBasicMaterial`: the grey belly is a hand-painted approximation of underside shading that
   cannot respond to the sun moving, which is exactly TODO 76's complaint in miniature.
3. **THE SKY IS NOT IN THE WORLD REGISTRY.** `G.sky`, `G.haze` and `G.moon` are handles; the sun
   sprite and all eight cloud groups are not. A pass that changes cloud form has nothing to assert
   against and no way to re-pin deliberately.

---

## 2. THE REFERENCES, AND WHICH REGION OF EACH

Eric named four plates, and each is named for a different reason. The sky pass measures the **sky
region** of each, not the whole frame — the terrain pass learned that lesson expensively (every
colour metric in platescore was contaminated by sky until the subject mask landed; hue read 201
where the rock was 24).

**THE FOUR PLATES NAMED HERE WERE WRONG AND THE SET WAS SUBSTITUTED, 2026-09-10.** Three of them
contain no sky. Measured before use over the top 22% of each frame as the fraction of pixels whose
3x3 Sobel magnitude is under 0.015 — sky is smooth, a eucalypt canopy is the opposite, and that
separates "sky in frame" from "trees in frame" without needing a colour hypothesis:

| plate | smooth | what is actually in the top of the frame |
|---|---|---|
| `ref_bow_00` | 26.8% | a brick house under gum trees, and a roofline |
| `ref_bow_04` | 5.8% | a street framed by a gum; dense canopy, white-out behind |
| `ref_bow_06` | 11.3% | a driveway in tree shade |
| `nz_alps_01` | 98.4% | a genuine deep blue sky |

Looked at as well as measured, to be sure the number was not the fault. REF_BOW.md's own board notes
agree: those three are named as the LIGHT, DENSITY and SHADOW targets and never as skies. The whole
24-frame trailer wall was then measured the same way, and **Birds of War has no frame that can
govern cloud form** — its only open sky is `ref_bow_19/20/21`, a cloudless deep blue wedge behind a
title card, and `ref_bow_13`, which is HUD to the horizon.

So the NZ wall governs the sky, and the substitutes were chosen by the same measurement:

| plate | what it is for |
|---|---|
| `nz_carpark_01` | broken cumulus over an alpine basin: cloud form, underside shading, aerial perspective. 4000x2248, and it is the CARPARK MAP'S OWN reference photo |
| `nz_tussock_03` | clear high-country sky: gradient and tone, with a strong vertical ramp |
| `nz_alps_01` | the saturated deep-blue end, already the terrain pair |

`nz_alps_02` is deliberately NOT in the sky set, which departs from the terrain pass. There, keeping
two loudly disagreeing plates was the honest reading of "look like these two photographs". Here the
disagreement is not style but WEATHER: alps_02 is uniform overcast at luma 0.851 and saturation
0.005, and the game renders a fine-weather midday sky. A blue sky scored against an overcast plate
is handed a luma band it can only reach by turning white, and under "in band if EITHER plate" that
band is not a test, it is a loophole. The BOW sky TONE is still reported — as one row of numbers
from `ref_bow_20` beside the table, not as a band a graded title card is in any position to set.

---

## 3. THE PROPERTIES platescore.mjs MUST GAIN

platescore.mjs already measures a band-cropped, width-normalised region against a target band
derived from the paired plate's own four tiles, and its selftest already carries both controls (each
plate in band against itself; the two plates out of each other's bands). The sky pass extends it
with a SKY band and these properties. Every one needs its own selftest case, synthetic and with a
known answer, the way the five terrain properties do.

1. **CLOUD FORM.** Not "are there clouds" — what SHAPE. Measure the cloud mask's perimeter over
   sqrt(area) (the terrain pass's snow-patchiness shape term, which already works and is already
   tested), plus the mask's vertical extent as a fraction of the sky band. Eight squashed ellipsoids
   at `scale.y 0.32` will score as far too flat and far too regular; a cumulus has vertical build.
   **THE VERTICAL-EXTENT HALF WAS BUILT, MEASURED AND WITHDRAWN.** The only plate with cloud in its
   sky crop is `nz_carpark_01`, and its cloud bank is larger than that crop in BOTH directions —
   one blob, bounding box 1440x276 in a 1440x276 image. So "vertical extent as a fraction of the
   sky band" measures 1.0 for that plate whatever shape its clouds are, and a band from it says
   only "your cloud must reach from the top of the visible sky to the bottom" — which is cloud
   COVER, already excluded from judging for exactly that reason, wearing the name of cloud FORM.
   Bounding-box aspect ratio is crop-limited the same way. And it was in direct conflict with
   property 2: a cloud that fills the visible sky has neither a visible top nor a visible base, so
   underside shading has nothing to measure. The game PASSED it (0.920 against 0.819-1.179) and it
   was withdrawn anyway, which makes the table harder rather than easier. Vertical build is now
   judged by eye in §4, where cloud form's unmeasurable half belongs.
2. **UNDERSIDE SHADING.** The luma difference between the top third and the bottom third of each
   cloud mask, signed. This is the property TODO 76 is actually about. The current grey belly gives
   a number; the question is whether it is the plates' number and whether it points the right way
   relative to the sun.
3. **SKY GRADIENT.** Luma and hue as a function of height up the sky band, as a slope. Three stops
   of vertex colour on a 14-segment sphere is a coarse ramp; the plates are smooth and their hue
   ROTATES with height, not just their luma. Reuse the fog-banding metric from terrainvalue.mjs —
   band width in rows — since a smooth gradient is exactly what it was written to check.
   **BUILT AS A RATIO, NOT A SLOPE, AND THE HUE CLAIM IS NOT WHAT THE PLATES SHOW.** A slope per
   unit of band height is not comparable between images whose sky crops are 0.34, 0.14 and 0.09 of
   their own frames, and normalising by frame height only moves the problem onto the field of view,
   which the plates do not carry. The absolutes at the two ends are comparable but exposure-bound —
   the three plates' zenith luma reads 0.637, 0.653 and 0.428, a band from 0.35 to 0.80 that passes
   anything. Their horizon-over-zenith RATIO reads 1.046, 1.179 and 1.100: they agree, because how
   much a sky pales toward the horizon is a property of the atmosphere and not of the shutter.
   So the judged rows are the luma ratio and the saturation ratio, with the absolutes as context.
   AND THE HUE DOES NOT ROTATE. Measured across each plate's own sky crop: -1.9 degrees, 0.0, +2.4.
   They do not agree on the SIGN, and a band from them spans -6.3 to +4.4, so hue rotation is
   reported and not judged. What the plates do instead is desaturate toward the horizon while
   holding their hue, which is property 5, and that one they agree on.
   BANDWIDTH IS REPORTED AND NOT JUDGED for a related reason — it conflates a smooth ramp with no
   ramp. `nz_alps_01`, a photograph with no banding anywhere in it, holds each 8-bit level for 17.4
   rows because its gradient is shallow. The judged form is the largest single-row 8-bit STEP, which
   is what contouring looks like, and the two clear-sky plates agree on it exactly: 1 level, all
   four tiles, both plates.
4. **SUN DISC.** Its measured elevation and azimuth against `SKY.sunPosDay`, which is the defect in
   §1.1 and is a headless assertion rather than a pixel one. Plus its rendered size and the clipped
   fraction of its core, using `gauntlet/verify/lum.mjs`, which already measures white clipping.
5. **AERIAL PERSPECTIVE.** The luma and saturation gradient from the horizon upward, and how the
   horizon haze band meets the range's own haze. The range now carries its own aerial perspective at
   `TERRAIN.haze` (colour `0x506476`, density 0.0045, chosen against these plates); the sky's haze
   band is an unrelated `0xC3D2DC` at opacity 0.45. Two aerial perspectives that were never compared.

**THE SKY BAND NEEDS ITS OWN MASK, AND IT IS THE EASY DIRECTION.** The terrain pass ends holding an
exact range mask — a second frame with the range painted magenta through its own haze uniform. Sky
is everything that mask does not claim, above the silhouette, which is exact and needs no colour
threshold. Four sky detectors were built and thrown away during the terrain pass; do not build a
fifth.

---

## 4. THE THREE THINGS BEYOND THE SCORE

The score cannot judge these. They are Eric's, and they are why the pass ends with a strip and not
with a table alone.

- **TODO 76 — SKY TONE. PICKED AND SHIPPED 2026-09-10: SOFTER, satMul 0.70, hueRot +8.**
  Eric's reasoning, recorded because the numbers alone do not carry it: the whole-sky references
  sit closest to that panel — `nz_carpark_01` 0.374, `nz_tussock_03` 0.356, `ref_bow_20` 0.426 —
  and *"alps_01 was the wrong anchor"*. That plate reads 0.582, MORE saturated than what shipped,
  and it is a narrow near-zenith slice on an exceptionally clear day with almost no gradient in it
  (0.581 to 0.570 top to horizon). A whole frame with a horizon in it cannot be judged against a
  crop that has none. The shipped sky now measures **luma 0.597, hue 213, saturation 0.441** — in
  band against both whole-sky plates rather than only against alps_01.

  **SHIPPING IT BROKE THE BANDING ROW, AND THAT UNCOVERED TWO REAL DEFECTS IN THE DOME.** The
  largest single-row 8-bit step went from 1 level to 2 while both clear-sky plates sit at exactly 1.
  Blame was placed wrongly three times before it was instrumented — the haze band's missing convert
  (innocent: satMul 1.0 reads 1 at either hue, 0.70 reads 2 at either hue), the dome's stop junction
  (a real kink, fixed, not this), and the haze band's top rim (at 2.7 degrees of elevation, where
  the step is at 8.7). Hiding the haze, the wisps and the clouds in turn left the step exactly where
  it was: it is the DOME's own ramp.
  What it was: the visible sky spans y 0.134 to 0.304 on the dome, which STRADDLES the mid stop at
  0.25 — so the band's lower two thirds crossed 29% of a 0.40-wide low ramp while its upper third
  crossed 7% of a 0.75-wide top ramp. Four times the rate, hence 154 156 161 166 over the last
  thirty-six rows against seven levels over the hundred and forty above. `skyLowAt` moves the low
  stop from -0.15 to **-0.45**, chosen for margin off a sweep (-0.15 and -0.30 read 2; -0.35
  onward read 1), at a cost of 1.110 to 1.067 in the horizon-over-zenith ratio against plate ratios
  of 1.046, 1.100 and 1.179.
  Both fixes are kept: the kink was real even though it was not the culprit, and the haze band now
  fades with a per-vertex alpha instead of ending in a horizontal line drawn across the sky.

  The page that produced the pick, for the record:

- **TODO 76 — the page as shot.** The dome is a saturated blue
  tuned to the NZ tourism palette that ARTBIBLE's vividness law names. The plates are not that
  blue. `gauntlet/verify/skytone.mjs` shoots the page: the two plates Eric named at the top, then
  the shipped sky, then three tones, one variable per step, everything else identical. Page at
  `gauntlet/capture/SKYTONE_page.png`.

  | panel | luma | hue | sat | knobs |
  |---|---|---|---|---|
  | PLATE nz_alps_01 | 0.449 | 212 | 0.582 | — |
  | PLATE nz_alps_02 | 0.807 | 358 | 0.009 | — (overcast; its hue is meaningless) |
  | AS SHIPPED | 0.633 | 205 | 0.527 | satMul 1.00, hueRot +0 |
  | HUE ONLY | 0.585 | 213 | 0.542 | satMul 1.00, hueRot +8 |
  | SOFTER | 0.606 | 214 | 0.418 | satMul 0.70, hueRot +8 |
  | THE PLATES | 0.623 | 214 | 0.293 | satMul 0.45, hueRot +8 |

  **THE HUE IS NOT REALLY A TASTE CALL and it is broken out as its own panel for that reason.**
  Every plate with a meaningful hue agrees — 212, 214, 216, 217 — against the game's 205. That is a
  correctable bias, and panel 1 moves it alone so the two questions can be answered separately.
  Saturation is the taste call: the references run 0.009 to 0.582 and there is no band in that.

  **AND ONE DEFECT FOUND WHILE ADDING THE KNOBS, DELIBERATELY NOT FIXED IN THE SAME COMMIT.** The
  dome's three stops go through `convertSRGBToLinear()`; the horizon haze band's `0xC3D2DC` never
  has, so with ColorManagement off it is handed to its material as a LINEAR value and comes out of
  the sRGB encode brighter than it was authored. Routing it through the tone function corrected it
  by accident and the world mesh digest caught that inside a minute. The haze band is the HORIZON
  of the sky whose tone Eric is picking, so correcting its brightness inside the same commit would
  move the thing being judged and hide it in a refactor. It is reported here instead and belongs
  with whichever tone is chosen.
- **CLOUD VARIETY.** One recipe, eight instances, three to five spheres each. The plates carry
  cumulus, stratus and cirrus in one frame. Variety is a count of RECIPES, not of instances, and it
  should be asserted as such — the terrain pass's "every peak its own shape" measurement (mean
  correlation between normalised profiles, where identical cones score 1.00) transfers directly.
- **THE NIGHT SKY — BUILT 2026-09-11, FLAGGED FOR ERIC.** Page:
  `gauntlet/capture/NIGHTSKY_page.png`. Nothing here is scored; it is his to judge.

  **THE MOON WAS 10.6 DEGREES FROM THE MOONLIGHT**, the same defect step 0 found in the sun one
  notch smaller. Hard-coded at (58,74,-52) — elevation 43.5, azimuth 318.1 — against
  `SKY.sunPosNight` at elevation 34.0, azimuth 324.2. Derived from the light now: 0.000 degrees.

  **420 STARS, ON `G.starfield` AND NOT ON `G.stars`.** That name was already taken by the game's
  PROGRESSION LEDGER — three stars per page of the to-do list, keyed by area — so a Points object
  written over it would have destroyed every player's earned stars silently. Placed on a
  golden-angle spiral with `_thash` for per-star brightness, so the field costs the seeded stream
  nothing (TODO 47); kept off the horizon, where the haze band and the ranges are; and ramped in
  from `t` 0.55 rather than switched, because four hundred points appearing in one frame reads as a
  bug and not as dusk. The moon still switches at 0.45, so it is out before the stars are.

  **AND THE CLOUDS GLOWED AFTER DARK.** Their emissive floor stands in for sky light, and
  `nightApply` was darkening the dome and the haze band around it while leaving that floor at its
  daytime value: a cloud top measured rgb 229,231,235 over a deep blue sky. Worse, zeroing the
  night ENVIRONMENT took it to 82,101,127 while zeroing the night DIRECTIONAL barely moved it (224
  against 229) — so the clouds at night are lit almost entirely by the HDRI, whose night intensity
  is **0.80 against the day's 0.55, higher after dark**. A material cannot opt out of
  `scene.environment` in this three (`reflectivity:0`, `envMapIntensity:0` and a Lambert-to-Standard
  swap were all tried), so what gets turned down is what the env has to work with: the emissive
  floor to 10% and the albedo to 34% at midnight, both lerped from stored day values so the ramp
  cannot compound.

  **WHAT IS STILL OPEN.** SKY.md said `21_night_camp` and `22_torch_beam` were "already pinned to
  judge it" and they are not: 21 sits at (38.2, 1.7, -3.2) looking DOWN at a campfire and carries
  almost no sky, which is why this whole change moved it by 0.002 of SSIM. A night vantage that
  frames the sky is a NEW PIN and Eric's call. And CLOUD VARIETY is still one recipe with size
  variation — §4 asks for a count of RECIPES, which this pass did not do.

- *(original brief)* **THE NIGHT SKY: stars, moon, moonlit snowcaps.** There are no stars. The moon is one unlit mesh
  that switches on at `G.time > 0.45`. And the snowcaps — which the terrain pass just gave real
  relief, a real snow mask and baked sun occlusion — are lit at night by `SKY.sunNight 0xB9CCEE` at
  intensity 0.24 from `sunPosNight [36,30,-26]`, which is a blue directional standing in for
  moonlight and has never been checked against the moon's own position. Moonlit snow against a dark
  sky is the single strongest night image the game could have, and vantage 21_night_camp and
  22_torch_beam are already pinned to judge it.

---

## 5. ORDER OF WORK

Mirrors the terrain pass, which converged in six iterations because the instrument came first.

0. **The free fix, and its assertion:** derive the sun sprite from `SKY.sunPosDay`; assert the
   visible sun and the light agree within a degree. Register the sun sprite and the cloud groups on
   `G.` and in WORLDREGS so the rest of the pass has something to assert against.
1. **Extend platescore.mjs** with the sky band and the five properties of §3, each with its
   selftest case and both controls. Score the sky as it stands; that table is the baseline.
2. **Converge, capped at six iterations.** After each change: shoot the strip, score it, view the
   composite against `ref_bow_00`, `ref_bow_04`, `ref_bow_06` and `nz_alps_01`, adjust.
3. **Stop** when every property is in band or the cap hits. Show Eric ONLY the final strip and the
   score table.
4. **Then** the taste calls of §4 as variant strips, on Eric's judgement.
5. **Then** whole-set re-pin per TODO 73 — a sky change moves every vantage in the set, exactly as
   the film camera did.

---

---

## 5b. WHAT STEPS 1 AND 2 ACTUALLY DID — 2026-09-10

**BASELINE: 6 of 9 properties in band.** The three that failed were the three §3.1 and §3.2 named:
cloud boundary complexity (5.26 against 7.11-17.25), vertical extent (0.231 against 0.819-1.179)
and underside shading (0.008 against 0.077-0.227). The brief's prediction was exactly right.

**FINAL: 7 of 8**, after six iterations, the cap. Cloud vertical extent was withdrawn as
unmeasurable (§3.1). Underside shading came in at 0.128 against the plate's own 0.116. Cloud
boundary complexity is the one still out, at 4.76 against 7.11 — see below.

**THREE DEFECTS OF PLUMBING, NOT OF ART, FOUND BY MEASURING:**

1. **The clouds were the only fogged part of the sky.** The dome and the horizon haze band are both
   `fog:false`; `MeshBasicMaterial` defaults fog to TRUE and nobody had ever said otherwise. The
   clouds sit 70 to 218 m from the strip camera in `FogExp2` at density 0.0062, which is a fog
   factor of 0.17 at the nearest and 0.84 at the furthest — between a sixth and five sixths of
   every cloud in the frame was the fog colour `0xc4d2d6`. That is why the first two iterations
   measured no underside shading with the sun plainly on them.
2. **The shadowed side was tussock brown.** With the sun off it, a cloud's dark side is lit by the
   hemisphere light's ground colour `0x8a7c42`, at saturation 0.55 — so it was not inside the
   scorer's neutrality mask at all, and the underside number could only ever see the lit half. A
   neutral emissive floor brings it to 0.15, which is a grey cloud.
3. **The altitudes were drawn with no reference to distance.** `rnd(36,62)` put a cloud 110 m away
   at 20.4 degrees of elevation and one 215 m away at 9.2, while the strip's sky band spans 7.7 to
   17.7. The near ones were ABOVE the picture, showing nothing but their undersides along its top
   edge: the largest blob in the frame measured -0.031 while every unclipped cloud beside it
   measured +0.055 to +0.182. Clouds are now placed by ELEVATION, which on a 210 m dome is an art
   decision rather than a physical one, and it is what puts whole clouds inside the frame.

**AND ONE IN THE RIG.** `webrig.mjs` keeps a hand-written `SKY_KEYS` list and refuses any KEASKY
override not in it. Its own comment records two past drifts, one costing a whole variant strip. A
new assertion comparing that list against `SKY` found a third the moment it ran: `hdriSunAz` and
`hdriSunEl` were already unreachable. Both added; the comparison is now a battery row.

**WHAT IS STILL OUT, AND WHY IT NEEDS A DIFFERENT TECHNIQUE.** Cloud boundary complexity is 4.76
against a target of 7.11 — a circle scores 3.545, so the game's cloud outline is 1.34 times a
circle's and the plate's is 4.1 times. A fringe of 26 small spheres per lobe took it from 4.99 to
7.27 at one point, but that reading was flattered by clipping: the clouds were being cut by the
frame edge and the ridgeline, and mask fragments carry a great deal of boundary. With whole,
unclipped clouds the honest number is 4.76. **Opaque sphere unions cannot make a wispy edge.** The
plate's cloud is feathered and semi-transparent at its margins, and closing this needs an
alpha-textured wisp tier — a baked cloud alpha atlas, the way `tools/bake_grass_cards.mjs` bakes the
grass cards. That is a next piece, not a seventh iteration.

**AND ONE ROW IS GREEN ONLY BY THE LETTER OF THE RULE.** Sky saturation reads 0.527, inside
`nz_alps_01`'s band (0.478-0.687) and above both `nz_carpark_01`'s (0.131-0.442) and
`nz_tussock_03`'s (0.261-0.485). alps_01 is the one plate whose sky crop is a thin near-zenith
slice of the deepest blue in the set. Against the two plates that carry a whole sky, the game is
too saturated — which is precisely TODO 76's complaint, and it is §4's first taste call.

---

## 5c. CLOUD FORM — ERIC'S BRIEF, 2026-09-11

His words: the clouds "read as stacked balloons - blinding white, perfectly round, no flat base, no
shaded underside", against real alpine cumulus that is "flat-bottomed, horizontally stretched,
soft-topped, greyer and shadowed underneath, and varied from wisps to towers". Reference:
`nz_alps_02`. Six iterations, the cap. Page: `gauntlet/capture/CLOUDFORM_page.png`.

| property | baseline | final | band | plate |
|---|---|---|---|---|
| cloud flatness (layered vs round) | 2.060 | **4.173** IN | [2.062 … 4.493] | 2.708 |
| underside shading | 0.125 | **0.126** IN | [0.077 … 0.227] | 0.117 |
| boundary complexity | 4.88 | 5.38 OUT | [7.11 … 17.25] | 14.6 |

**A BASE PLANE DOES TWO OF HIS FOUR AT ONCE.** Real cumulus condenses at an altitude and is cut off
below it, which is why its base is flat — and a flat base faces DOWNWARD, away from the sun, so it
shades itself. Clipping every host lobe's vertices to one shared plane and pointing their normals at
the ground gives the flat bottom and the shaded underside in a single move, with no painted grey.

**AND THEN IT CAME OUT TAN.** A downward face gets no sun, so what lights it is the hemisphere
light's ground colour (`0x8a7c42`, tussock brown) and the HDRI's lower half (alpine rock and grass).
Measured on the bare plane: rgb 182,174,157 at saturation 0.137 where the tops sit near 0.95 luma —
a bright tan saucer. **Four wrong fixes were paid for**: the hemisphere light alone (neutralising its
ground moved the pixel only 183,173,157 → 174,166,158), `reflectivity:0`, `envMapIntensity:0`, and
switching Lambert → Standard. Neither material can opt out of `scene.environment` in this three.
What settled the diagnosis was turning the base plane OFF: the same pixel went to 194,195,195 at
saturation 0.01, which is the base and nothing else. The fix is a **vertex colour** on the clipped
vertices — a cool grey multiplied into the diffuse, ramped over a band above the plane so the
shading has no edge of its own. The direction is still derived: a vertex is tinted because the plane
clipped it, not because anyone painted a cloud.

**TWO MORE THINGS THE PICTURE DEMANDED.** The plane was clipping the rim fringe too, flattening each
puff into a thin wafer sticking out sideways — the clouds read as saucers with a hard disc past the
mass on both sides; only the hosts meet the plane now. And the horizontal stretch made 10x8 lobes
show facets across the top while leaving the tint's fade one or two vertex rows to work with, so
hosts are 16x12 and the fringe stays 6x4. +9,536 triangles, +0.10 ms as a mean of three interleaved
pairs.

**BOUNDARY IS UNCHANGED AND THAT IS EXPECTED** — TODO 118 recorded it as a ceiling rather than a
tuning, and Eric left coverage as-is ("a clear alpine morning is the right weather").

**THE BANDING ROW IS NOW UNJUDGED**, because cloud cover rose to 28.9% and the scorer refuses that
metric above a quarter cover — there is no clear vertical slice of sky left to look for contouring
in. The gate is working; the row is honest about being unmeasurable rather than green.

---

## 6. OUT OF SCOPE

- **The bird stays parked.** No bird face, tail, underwing, trees, vehicles, humans or hero props.
- **No new 3D model.** An HDRI is a texture, not a model, and P2 already installs one; if the sky
  wants a different HDRI it lands with its licence line in `assets/LICENCES.md` at import time,
  verified against the publisher's API md5, like every other asset.
- **No graduation.** `rnd()` draw order is load-bearing (TODO 47): the eight cloud groups make
  `rnd()` calls, so changing how many there are relocates every later seeded draw in the build.
  Additive only, or move the loop the way the ski field's snow loop was moved — outside the guard,
  making no new draws.
- **The fog stays.** Eric's instruction on the range holds for the sky: the existing fog is the
  aerial perspective, and §3.5 is about making the sky's haze agree with it, not about removing it.

---

## 7. THE LAWS, UNCHANGED

The gate prints CERTIFIED-SHIP before ship. One piece = one commit with its proof in the same
breath. FLAKES discipline — never weaken an assertion to get green; if a target band is wrong, fix
the band and say why, and expect that to make the test harder. Judged at vantage. Session lock: one
writer owns the tree. Every look fix ships with its assertion in the same commit. Taste is Eric's.
