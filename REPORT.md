# REPORT — REPLAT P4e, the field stops being a disc (session 22, 2026-09-04)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `5c9fa1dd77d46eec3d6da3b630cd4149`.
**Nothing re-pinned. 27 of 28 vantages flagged. Seventeen sabotages, all seventeen red.**

## READ THIS FIRST — WHAT THIS PIECE DID NOT DO

You asked for the transition to be invisible **at the play camera and from the air**. It is at the
play camera. **From the air it is not, and I am not going to dress that up.** The far tier of real
blades stops at 28 m because of a hard measured wall:

| at the Retina framebuffer, DPR 2, `perf.mjs bird`, best-of-12, interleaved ×3 | ms |
|---|---|
| no far tier, no ground term | **31.5** |
| ground term only | 30.3 — free, inside the noise |
| **far tier 225k over 28 m — SHIPPED** | **40.7  (+9 ms)** |
| far tier 450k over 40 m | 48.0  (+16 ms) |
| 450k over 40 m, seg 1, no shadow receive | 40.1 |

Dropping the shadow *receive* saves 2.4 ms and is kept. **`seg 1` saves nothing at all** — so the
cost is FILL, not vertices, and the map is 240 m across. Geometry to the horizon is not affordable
on your machine. The answer is alpha **cards** — one quad carrying fifteen blades, which is exactly
the ratio the fill measurement says is needed — and that wants a CC0 alpha atlas, a licence line,
alpha-to-coverage and its own LOD handover. That is a piece, not a tuning, and shipping it
half-built would have put a second ring in the field. **TODO 82.**

## THE MEASUREMENT THAT DECIDED IT

I built the finder first: `gauntlet/verify/edgefind.mjs` + its contract test. It reports
FINDABILITY — peak step over the typical step *elsewhere* in the same scan, so a lighting gradient
scores ~1 and a line scores high.

**Then the measurement moved the instrument.** Shot under control — the same image rows, same light,
same fog, once with blades and once without:

    bare ground   rgb 178.1 166.5 128.9   chroma 49   luma 166.3
    with blades   rgb 181.9 157.9  99.7   chroma 82   luma 158.8

Red does not move, luminance moves 4.5%, **chroma moves by two thirds**. The seam is *saturation*.
I was about to certify "no colour seam is findable" with a detector structurally unable to see one,
so it grew a chroma channel and a selftest case the other two must be blind to.

Two of your three options then lost:

- **A bigger disc is still a disc.** At 40 m with the count raised to hold density the edge does not
  go away, it *moves*, and scores **worse** — 16.90 against 5.92 — because at that range the fade
  compresses into a handful of pixels near the horizon.
- **Painting the ground cannot do it alone.** Setting the terrain albedo to **black** beyond the
  blades moves luminance 18% and blue by one and a half levels; fog is 0.55% at twelve metres. An
  albedo multiplier does not reach whatever the rest of that pixel is.
- **Geometry does**, because what makes a bladed pixel different is *occlusion*.

## WHAT SHIPPED

A third instanced tier over an **annulus** (225k, 28 m, rMin 0.24), plus a ground term that carries
the colour past it and costs nothing. `fadeBand` became **per layer** — that is the lever that
dissolves the handover rather than relocating it: 0.11 → 12.79, 0.30 → 7.17, **0.55 → 5.77**, with
the peak moving off the texture channel entirely at 0.55.

**Measured result:** the colour seam across the old boundary is gone — the blue gap across it was
18.3 levels, now **2.7**. Findability at the play camera is 6.16 against P4d's 5.97: unchanged in
magnitude, but the peak has moved off *texture* onto *chroma*, where the frame's ambient variation
already sat. The hard cliff is gone.

Also fixed, because the far tier exposed it: **`keaCut` was a hard axis-aligned box test**, so grass
stopped dead along a ruled line at every tarmac edge. Invisible while the field faded out at 14 m
and the car park is 30 away. Now a signed distance with a 1.1 m verge whose *width* is
noise-perturbed — never its position, so no blade can enter a cut-out.

## TODO 80 — CLOSED, BOTH HALVES

The hills' sculpt only ever scaled x and z, and **at the pole x and z are zero**, so it multiplied
nothing — which is why a sculpt loop that looks like it should have fixed the flat cap never could.
18 bands now, displaced along the vertex's own radius in 3D. And they wear `groundTint`, closing the
horizon colour seam recorded as open in P4b, P4c *and* P4d. See `P4e_todo80_hills_AB.png`.

## THREE THINGS THAT WENT WRONG, WORTH YOUR TIME

- **The shader failed to compile for an hour while the game looked fine.** The far-grass function
  went in the shared GLSL block while its uniforms were declared only for the grass family. Every
  batteries-green signal held, and the measured effect of the whole feature was *one grey level* —
  which reads as "the fix does not work", not "the shader is dead". `MATBREAK_OK` validates that the
  patch targets exist; it cannot know whether the result compiles.
- **The first far tier photographed as sheaves of wheat** — big, few blades, visibly coarser at
  thirty metres than at three. And rMin 0.30 of 52 m left a **1.6 m ring of bare ground** between
  the tiers. Coverage is bought with count; tiers must overlap.
- **A false alarm that was a real bug.** `28_skifield_base` read 1215 against a floor of 1500 and
  looked like the far tier burying the bull wheel. Three takes of one unchanged build read **490,
  1067, 2038** — a coin flip straddling its own floor, because `rotation.z += dt*2.4` integrates
  wall-clock deltas and the rig's clock pin cannot reach an integrator. Now `= G.time*2.4` and four
  takes read **838, 838, 838, 838**. It is below the floor. **I did not lower the floor** — TODO 81
  lays out the three ways out and leaves the choice to you, because it is a composition call.

## FRAMES

`P4e_proof_edge_AB.png` (play camera, before/after) · `P4e_proof_air_AB.png` (from the air) ·
`P4e_proof_wide_AFTER.png` · `P4e_todo80_hills_AB.png`.

## PROOF

Nine batteries ALL PASS · gate CERTIFIED-SHIP · gate-selftest ALL PASS · edgefind-selftest ALL PASS ·
seventeen sabotages all red (two were green until the assertions were fixed: a far tier of *zero*
blades satisfied "its count matches the recipe", and a hill-tint threshold the untinted palette
already met) · 30/30 vantages, no retakes, no GAVE UP · diff 28/27 flagged (worst 0.2552) · boxdiff
12/8 · pxdiff 28 over band · subjects 16 checked, **3 missing** — the two known TODO 75 reds plus
28_skifield_base, now deterministic and filed · readability held: 03 reads 8213/1600, 13 reads
5131/900 · sidebyside 33 pairs.

**Everything left flagged. The look is yours.**
