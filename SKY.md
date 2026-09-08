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

| plate | what it is for |
|---|---|
| `ref_bow_00` | the definitive look. TODO 76 names it and `_04` as where the seam shows most |
| `ref_bow_04` | cloud form and underside shading against a lit sky |
| `ref_bow_06` | the third BOW sky, for cloud VARIETY — one cloud recipe is what we have now |
| `nz_alps_01` | the NZ sky over the range we just built, and the aerial-perspective reference |

`ref_bow_*` govern LIGHT and CLOUD FORM; the `nz_*` plates govern the country. Both walls already
exist in `gauntlet/reference/board/`.

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
2. **UNDERSIDE SHADING.** The luma difference between the top third and the bottom third of each
   cloud mask, signed. This is the property TODO 76 is actually about. The current grey belly gives
   a number; the question is whether it is the plates' number and whether it points the right way
   relative to the sun.
3. **SKY GRADIENT.** Luma and hue as a function of height up the sky band, as a slope. Three stops
   of vertex colour on a 14-segment sphere is a coarse ramp; the plates are smooth and their hue
   ROTATES with height, not just their luma. Reuse the fog-banding metric from terrainvalue.mjs —
   band width in rows — since a smooth gradient is exactly what it was written to check.
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

- **TODO 76 — SKY TONE.** The dome is a saturated blue tuned to the NZ tourism palette that
  ARTBIBLE's vividness law names. The plates are not that blue. This is a taste call about how far
  the game's sky moves toward the reference, and it wants a variant strip: three tones, one page,
  material held constant, the way the silhouette families were shot.
- **CLOUD VARIETY.** One recipe, eight instances, three to five spheres each. The plates carry
  cumulus, stratus and cirrus in one frame. Variety is a count of RECIPES, not of instances, and it
  should be asserted as such — the terrain pass's "every peak its own shape" measurement (mean
  correlation between normalised profiles, where identical cones score 1.00) transfers directly.
- **THE NIGHT SKY: stars, moon, moonlit snowcaps.** There are no stars. The moon is one unlit mesh
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
