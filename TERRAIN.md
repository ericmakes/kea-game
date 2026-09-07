# TERRAIN.md — the range is a heightfield, not a ring of cones

Companion to REPLAT.md, which governs. Branch **replat-b**. Standard laws throughout: the gate
prints CERTIFIED-SHIP before ship; one piece = one commit with its proof in the same breath; FLAKES
discipline — never weaken an assertion to get green; judged-at-vantage; taste is Eric's.

---

## 0. WHY THIS EXISTS

Session 33 was asked to fix the cone mountains and instead **improved** them: one shared ring
instead of six pasted copies, a world snowline instead of a fraction of each summit, per-massif
value, ridge-and-gully shading, a flared skirt, and a variant strip of three value levels for Eric
to choose from. Every one of those is a true improvement. All of them were applied to a shape that
should not be there.

Eric's verdict, 2026-09-07: *"My brief said fix the cones; a varied cone is still a cone, and real
mountains don't need a 3D model, they need TERRAIN."* He declined to pick from the strip, correctly:
the choice on offer was a tint and the defect was the form.

**The lesson worth keeping, because it will recur:** polishing the wrong silhouette is the most
expensive kind of near-miss, because every measurement says it is getting better. Nine assertions
went green on those cones. Not one of them could see that a cone is not a mountain — because not one
of them was a claim about SHAPE, only about the shape's properties. TODO 110 records the rejection.

---

## 1. THE REFERENCES, MEASURED

Eric named `nz_alps_01` and `nz_alps_02`. Measured with `gauntlet/verify/lum.mjs`:

| region | luma | mean RGB | sat | hue |
|---|---|---|---|---|
| nz_alps_01 near schist outcrop, lit | **0.227** | 54, 59, 62 | 0.13 | 202 |
| nz_alps_01 far massif, steep rock | 0.396 | 91, 102, 121 | 0.25 | 218 |
| nz_alps_01 far massif, snow | 0.664 | 163, 170, 182 | 0.10 | 217 |
| nz_alps_01 tussock foreground | 0.262 | 67, 67, 62 | 0.08 | 64 |
| nz_alps_02 big ridge, lit rock face | 0.467 | 120, 119, 121 | 0.02 | 290 |
| nz_alps_02 scree fan | 0.397 | 105, 100, 98 | 0.07 | 16 |
| nz_alps_02 far range | 0.446 | 93, 117, 142 | **0.35** | 210 |

**FOUR THINGS THOSE NUMBERS SAY, and each one becomes an assertion:**

1. **ROCK IS DARK.** 0.227 near, 0.396–0.467 in the middle distance. The rejected cones rendered at
   0.765–0.834 — roughly double. Whatever the new material does, rock must land in the plates' band.
2. **AERIAL PERSPECTIVE IS A BLUE-SATURATION SHIFT, NOT A LIGHTENING.** Near rock is near-neutral
   (sat 0.02–0.13); the far range is sat 0.25–0.35 at hue 210–218. Distance does not just wash a
   surface pale, it pushes it toward the sky's own hue and *increases* its saturation while lifting
   its value. **This is why Eric asked for the existing fog to be KEPT.** Session 33 took the cones
   off fog because it was flattening them; that was a workaround for a shape with no form for light
   to describe. A heightfield has form, so the fog should be doing exactly this job. If it flattens
   the terrain the way it flattened the cones, that is a measurement to report — not to route round.
3. **SNOW IS NOT WHITE.** 0.664 on a sunny far massif; 0.412 on an overcast one. The snow-form piece
   already learned this from `kea_snow_01` (real sunlit snow clips 0.04%).
4. **TUSSOCK IS DARK OLIVE** at hue 64, luma 0.262 — not the gold the current hills wear.

**AND THE BIGGEST CUE IN BOTH PLATES IS NOT A COLOUR AT ALL: SNOW IS SLOPE-DEPENDENT.** In
`nz_alps_01` snow lies in gullies and on gentle faces while bare rock stands out on the steep faces
immediately beside them, **at the same altitude**. A horizontal snowline — which is what session 33
built, and an improvement on what came before it — is still wrong. Snow needs slope AND altitude.

Other plate facts to build to: visible **scree fans** streaking below the crests (nz_alps_02, left);
**arête crests** with subsidiary spurs running down toward the camera; **bedding planes** in the
near rock (nz_alps_01 foreground is layered schist, not a boulder); a broad **U-shaped valley**
between massifs (nz_alps_02, mid-right).

---

## 2. THE GEOMETRY: ONE ANNULUS, FOOTHILLS AND MOUNTAINS TOGETHER

**An annulus, not a plane.** The mountains occupy a ring; a square heightfield spends most of its
vertices on ground the play area already owns. A polar grid puts them only where the landform is,
and makes the inner seam trivially controllable — force height to zero at the inner radius and it
meets the existing terrain plane exactly, with no join to hide.

**ONE SYSTEM FOR BOTH RINGS, because Eric asked for the foothills too.** The annulus spans roughly
r 55 → 185, and the noise CHARACTER ramps with radius: rolling and gentle near, alpine and ridged
far. That retires the cone ring (18 per map) *and* the 73 squashed-sphere tussock hills in a single
piece, which is the right shape — TODO 80 fixed the hills' flat tops in P4e and they are still
spheres.

Resolution target: 384 angular × 72 radial ≈ 27.6k verts / 55k tris. At r 135 that is 2.2 m
angular and 1.25 m radial — about 15 screen pixels a cell at play distance, enough for a ridgeline
to read as sharp. **Budget it honestly:** the rejected cones cost 12.4k tris, so this is roughly
+43k on a 230k map. `perf.mjs` is not in the gate; measure and record it, do not assume.

**THE NOISE STACK, in order:**
1. **Domain warp first.** Offset the sample position by a low-frequency noise so ridgelines *wander*
   instead of radiating. Applied before everything else, or the warp merely blurs the result.
2. **fBm for the massif** — several octaves of value noise, amplitude ramping with radius.
3. **Ridged multifractal for the arêtes** — `(1 − |noise|)²`, which turns noise troughs into sharp
   crests. This is the term that makes a mountain rather than a hill, and it is the one the cones
   could never have.
4. **U-shaped valleys, carved deliberately, not hoped for from noise.** Pick N radial valley axes
   between the massifs and subtract a quadratic cross-section along each: broad flat floor, steep
   walls. A glacial valley is a U and noise alone gives V.
5. **Thermal erosion for gullies and scree.** A handful of iterations of "move material downhill
   wherever the slope exceeds the angle of repose". Cheap, grid-local, and it produces exactly the
   two features the plates show: incised gullies above and **fans of deposited scree below**. This
   is the pass that makes the range look weathered rather than generated.

**EVERY PEAK A DIFFERENT SILHOUETTE** falls out of this for free and must be asserted, because it
is the specific thing the cones failed at.

**DETERMINISM.** Same discipline as the water, mountains, rocks and snow before it: the builder
makes a FIXED number of `rnd()` draws in a fixed order, or none at all, with per-feature variation
hashed out of position. Every seeded draw later in a biome's build depends on the sequence (TODO
47). This is a hard constraint, not a preference.

---

## 3. THE MATERIAL: BY SLOPE AND ALTITUDE, TRIPLANAR

**Step 0 is the asset, and it is the only asset this piece needs.** A CC0 rock/cliff PBR family
from Poly Haven — albedo, normal, ARM — registered as a tenth MATFAM family with its licence row
recorded *before* it is wired to anything, per REPLAT's law and P5F's precedent. TODO 111 already
asks for this; the terrain is what makes it urgent. It is a TEXTURE, not a model, so it is inside
the parked-bird constraint.

**THE BLEND:**
- **snow** on gentle faces above the snowline — slope AND altitude, per section 1
- **dark rock** on steep faces at any altitude — the plates' 0.23–0.47 band
- **scree** where the erosion pass deposited it, which the erosion pass can hand over as a mask
- **tussock** below the treeline, matched to the measured hue-64 olive
- transitions by smoothstep on both axes, with noise in the boundary so it is not a contour line

**TRIPLANAR, because a cliff is the case a UV map cannot serve.** A heightfield's natural UV is its
plan projection, which stretches a texture to nothing on a vertical face — and vertical faces are
the whole point of an arête. Sample on all three world axes and blend by the squared normal. There
is precedent for shader injection in this codebase: `matBreakup` already uses `onBeforeCompile` with
custom uniforms, and the grass is a full custom vertex shader.

**KEEP THE FOG.** Section 1 point 2. Measure what it does to the rock/snow separation and report the
number either way.

---

## 4. WHAT ERIC JUDGES, AND WHEN

**A WIDE STRIP OF 2–3 NOISE RECIPES, shot before the material work.** Eric picks a **silhouette
family, not a tint** — that is explicit. So the strip must be shot with the material held constant
and only the noise stack varying, and it must be WIDE (the whole skyline, not one massif), because
silhouette is a property of the range and not of a peak.

**SIDE-BY-SIDE PAIRS against `nz_alps_01` and `nz_alps_02`,** using `gauntlet/verify/sidebyside.mjs`.

The law of best applies: never ship attempt one unseen.

---

## 5. WHAT THE GAUNTLET MUST ASSERT

Not one of these may restate a constant. The cones passed nine assertions.

1. **NO CONE MOUNTAIN SURVIVES ANYWHERE** — no ConeGeometry of massif scale in any map, and
   `mountainRing` is gone rather than merely unused. Same for the sphere hills.
2. **THE RANGE IS A HEIGHTFIELD** — one mesh per ring, vertex count and inner-seam height at zero.
3. **EVERY PEAK IS A DIFFERENT SILHOUETTE** — measured, e.g. the radial height profile at N azimuths
   must not correlate between peaks. This is the assertion the cones could never have passed and is
   therefore the one that matters most.
4. **ARÊTES ARE SHARP** — the distribution of local curvature along crest lines has a tail a
   smooth landform does not.
5. **SLOPE-DEPENDENT SNOW** — at a fixed altitude band, steep faces must carry materially less snow
   than gentle ones. Directly the plates' biggest cue.
6. **SCREE SITS BELOW GULLIES** — the erosion pass's deposition mask must be downhill of its
   removal, which is a claim about the erosion actually running rather than about its parameters.
7. **U-VALLEYS ARE U, NOT V** — cross-section curvature at the floor, measured across the axis.
8. **TRIPLANAR: NO STRETCH ON STEEP FACES** — texel density on a vertical face within tolerance of
   a horizontal one. The P3 texel-density assertions are the model.
9. **ROCK, SNOW AND TUSSOCK LAND IN THE PLATES' MEASURED BANDS**, via `lum.mjs` budgets on the
   skyline vantages.
10. **DETERMINISM** — the same seed gives the same range, and the builder's `rnd()` draw count is
    fixed.

---

## 6. OUT OF SCOPE, DELIBERATELY

Rivers or lakes on the terrain; anything the bird can walk on (the range is scenery — no colliders,
and `groundHeightAt` must be untouched); trees on the slopes; LOD; the sky (TODO 76 and the sky
piece come after); the ski field's own piste terrain, which is play space and separately tuned.

---

## 7. ORDER OF WORK

0. **The re-pin of the current set first** — Eric's instruction, so the terrain is judged against a
   clean baseline rather than against a baseline that is already stale in 32 places.
1. Source the CC0 rock/cliff family; licence row lands with the file, not after it.
2. The heightfield geometry: annulus, warp, fBm, ridged, valleys, erosion. Cones and sphere hills
   retired in the same piece so the world never carries both.
3. **The silhouette strip → Eric picks.**
4. The material: slope/altitude blend, triplanar, fog kept, plate budgets.
5. Then TODO 100 (the levitating woolshed), 112 (the carpark's invisible snow), 82 (grass to the
   true horizon), and the sky.
