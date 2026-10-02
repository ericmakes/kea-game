# REPORT — bird pinned, feet + trample, and the PERFORMANCE PIECE; STOPPED for frames (2026-10-02, Opus 5.5)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `54b3bfae55bf070f4a4b7e4594d0abcf`. **Stopped before
Piece 2 (colour) as ordered: Eric looks at the perf frames first.**

## SHIPPED

| commit | one line |
|---|---|
| `a42fd27` FEET + TRAMPLE | The bird was on groundHeightAt all along; the DRAWN ground is 10-28 cm higher (seal, groomed run, relief). Kea drawn at logic y + drawnLift (render-only). Trample: zero blade pixels over the bird at the play camera. 26 vantages re-pinned. |
| (this) PERF | **63.5 ms -> 14.4 ms** on AC, live, bird flying; 15.8 ms at Retina 1512x982@2. No key-six property left its band. Meter is a gate battery. Whole set re-pinned (43, 4-run consensus). |

## THE PERF PIECE, IN ONE TABLE (details: gauntlet-log 2026-10-02d)

| step | ms | | step | ms |
|---|---|---|---|---|
| shipped | 63.5 | | far grass 28->22 m, cards camera-relative | 26.1 |
| shared depth for GTAO + Bokeh | 34.1 | | exact shader early-outs | 21.5 |
| GTAO half res (+ clip box) | 29.1 | | shadow proxies + cascade tuning | 19.2 |
| bokeh cinematic-only | 28.3 | | render scale auto (1.5 Mpx) + thinner grass | 14.4 |
| 3 fitted, texel-snapped cascades | 32.9 (slower, until the proxies) | | | |

## LOOK CHANGES ERIC SHOULD JUDGE

- **Render scale 'auto' renders a 1080p window at 85% and upscales.** F8 cycles auto/100/85/75/60%. At 100% the frame is ~19 ms.
- **Shadows are cascades now:** sharper and finer near the camera (3 cm texels against 5.7), coarser past 31 m, and the far cascade refreshes every other frame. Small casters (<0.2 m) shadow only within 14 m.
- **Depth of field is off in play**, on only in photo mode, the title orbit and travel.
- **Mid-distance grass:** blades end at 22 m and the cards take over, thinned 20% in cover and far.
- **The trampled patch** round the bird (0.6-1.2 m, ragged edge).

## FRAMES TO EYEBALL
- `gauntlet/capture/proofs/PERF_key6_before_after.jpg`: the six key vantages, shipped (left) against now (right).
- `gauntlet/capture/proofs/PERF_bird_vantages_after.jpg`: 03, 13, 18, 14, 21, 28, the bird on its feet and out of the tussock.
- 11_trailhead's hillside banding is gone (it was the old shadow map aliasing on the slope).

## FOUND, NOT FIXED
- Cars, humans and sheep stand at logic height: car wheels are 14 cm inside the seal.
- Instruments that were wrong and are now fixed: BIRDSKY's scarlet rule (recalibrated to its own data; the control still red); webrig now refuses uncompiled shaders.

## NEXT: PIECE 2 (colour), scoped, not started
ColorManagement on, CSS saturate removed, re-grade to the plates, tone-mapper check, bird-vs-approved-render colour property in framescore, its own re-pin, under the no-regression rule (framemeter is in the gate).

---

# REPORT — spike adoption, pieces 0 and 1; STOPPED at the frame budget (2026-10-02, Opus 5.5)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `a3c791ab355316f6485a8d3b069f88ac`.
Two pieces shipped and pushed. **Stopped before Piece 2 on a ruling only Eric can make.**

## SHIPPED

| piece | one line |
|---|---|
| `91cfe0d` PIECE 0 | Bird on 2048 textures (images only, byte-proved, CC BY 4.0), 1024 WebP runtime fallback, guard hole fixed, 03/13/18 re-staged and stable, `G.clockPin` rig fix. The 4096 red did not reproduce (21/21 dressed) — no fix claimed against it. |
| `954d562` PIECE 1 | `framescore.mjs` in the gauntlet (reproduces the spike exactly); GAPAUDIT.md: six key vantages 1–4 of 6 vs ref_bow, saturation the consistent gap. |

## WHY IT STOPPED — THE BUDGET IS ALREADY BROKEN

The ruling is 60 fps with the full game running, refusing any piece that breaks it. Measured
headful on Metal with the game live, **the shipped game is 40–70 ms/frame at 1080p (15–25 fps)
before any spike piece lands.** Post, VSM shadows, grass and fill each cost ~25–35 ms; all four
off reaches 13.8 ms (GAPAUDIT.md). So, read literally, every remaining piece is refused on day one,
and Pieces 3–5 all ADD GPU cost. The choices, which are Eric's:
1. **A performance piece first** — cuts to post (GTAO res, DOF), the shadow map (VSM blur, map
   size) and grass tiers until the live game holds 16.7 ms. Each cut is a LOOK change and a
   whole-set re-pin, so it should land before Piece 2's whole-set re-pin, not after.
2. **A no-regression rule instead** — each piece must not ADD measurable ms/frame. Piece 2 passes
   that (colour pipeline is free); Pieces 3–5 would each need a cost line.
3. **A different target** — 60 fps at a lower internal resolution (half-res measured 28 ms) or 30 fps.

## FRAMES TO EYEBALL
- `gauntlet/capture/baseline/03_kea_plate.png`, `13_idle_preen.png`, `18_rear_close.png` — the new close-up framing.
- `29_lodge_deck` — its pin is a grass state this machine no longer reshoots (pre-existing, inside threshold, NOT re-pinned).

## READY FOR THE NEXT SESSION
- Piece 2 scoped: 57 hand conversions become plain `new Color(hex)` with identical values; what actually shifts is fog, hemi, sun, fill, rim, torch, fire light, 8 raw Colors, 5 raw material colours.
- Piece 3: 7 `mkTree` call sites (the 39 is an instance count); must keep the seeded rnd draws (FLAKES 15) — swap at the model tier, as P6A does. The pruned spike tree is 194k tris; 39 of them is 7.5M — LOD/impostor mandatory.
- Piece 5: the WebGL stochastic anti-tiling already exists (P3b); what is missing is the spike's PLACED WEAR.
- `sharp` and `@gltf-transform/*` are devDependencies but NOT vendored into the tracked node_modules (18 MB of native binaries); `npm install` before re-running `tools/derive_kea_textures.mjs`.

---

# REPORT — the terrain pass, closed against the plates (session 35, 2026-09-08)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `b7d4fc7993c2b0d6c718c398812fdec8`,
bundle `1c5ca6d3d74fe044601ff01dcc1d827d`. Whole set re-pinned, 40 vantages, eleven-run consensus.

Eric's five ordered terrain fixes are all closed, the strip scores **7 of 7** against the plates,
and the next pass is briefed in `SKY.md`.

## SHIPPED

| piece | specimen after | one line |
|---|---|---|
| `5dfc097` TERRAIN step 0 | `26f88373…` | The holes were the triangle winding, inside out — 27648 of 27648 normals pointed down, so the range was backface-culled below eye level AND receiving no diffuse sun. Eye-level row 17.6% → 100% range. |
| `e92757e` TERRAIN step 1 | `3956d562…` | The range gets its own aerial perspective: three.js fog is per-scene, so it carries two uniforms of its own and a rewritten `fog_fragment`. |
| `f910f6a` TERRAIN step 2 | `069ecf73…` | It read flat because it WAS flat — recipe c eroded at `talus 0.50`, which is 26.6°, shallower than gravel rests at. Unhazed spread 0.167 → 0.335. |
| `10dcff9` TERRAIN step 3 | — | The base: a foothill skirt inward to r 43, built after erosion so the chosen silhouette is bit-identical, and `groundHeightAt` now reads it. Worst outward fall 0.0000 m on 384 azimuths. |
| `52f5531` TERRAIN step 4 | — | Scale and the fog gradient, both measured, neither needing a change. **Wrong** — see below. |
| `20c485e` TERRAIN step 4 revisited | — | The strip contradicted the measurement and the strip was right. peakH 56 → 70, snowline back to the plates' proportion. |
| `84756e3` platescore | (tools only) | Five properties, target bands from the paired plate's own tiles, 22-check selftest with both controls. Baseline: 4 of 7. |
| `8a1596e` TERRAIN.md step 4 | `b7d4fc79…` | The triplanar rock family. Six iterations, **7 of 7**. |
| `9da81bd` PIN | — | All 40 vantages, eleven-run consensus (five runs left two frames on bare majorities). |
| `2d3443a` SKY.md | (doc) | The next pass, briefed. |

## PARKED

- **Sharpening the ridgelines — barely moved, and I say so in the commit.** The crest-sparing
  erosion is in and measurable but buys only **4.1%** more skyline second-difference: at talus 1.60
  the erosion hardly acts, and the silhouette's smoothness is set by the recipe's band-limited noise.
  Silhouette roughness is 0.112 against alps_01's 0.189 floor, in band only on alps_02. Reaching
  alps_01 needs a higher-frequency ridged octave — which changes the family Eric picked, so I did not.
- **`06_skyline` still reads flat on terrainvalue's form floor** (spread 0.177 against 0.227). It
  carries only 12% range and its p90 is 0.458 where the other two vantages reach 0.487 and 0.505.
- **Walkable foothills are only barely walkable, and it is Eric's call.** The clamp is a ±52 BOX,
  real content sits out to |coord| 46.5, and the pad must protect it — so the roll only lives
  between r 52 and r 64, which the bird touches only near the corners (~1.4 m of climb). Properly
  walkable foothills need the clamp opened, which changes the size of the play area.
- **The relief at amplitude 4.4 reads as fine directional streaking** rather than blocky strata.
- **`26_tour_brochure` and `27_travel_card`** are still unpinned. Eric's call since session 15b.
- **The bird stays parked.** Unchanged.

## FRAMES TO EYEBALL

    gauntlet/capture/SCORE_vs_alps_01.png      the final strip, plate over game, ridge bands
    gauntlet/capture/SCORE_vs_alps_02.png
    gauntlet/capture/HOLES_fog_off.png         step 0's evidence: the ring, fog off
    gauntlet/capture/STRIP_SHEET_plate_then_abc.png   all three families under one plate

## WHAT COST THE MOST TIME, SO THE NEXT SESSION DOES NOT PAY IT AGAIN

**TWO COLOUR-SPACE BUGS, BOTH THE SAME SHAPE.** The haze colour was written into an encoded blend
after being converted to linear; then the rock scan's mean was measured on the canvas's ENCODED
bytes (0.2002) while `texture2D` on an `SRGBColorSpace` map returns LINEAR (0.033). The second
presented as "the texture will not resolve" — edge density did not move for tile scales from 3.2 m
to 28 m, nor for a forced mip 0 against mip 6, because the sampled value was **constant**. I spent
that stretch on mip and anisotropy theory. **ColorManagement is OFF in this project** (`mat()` calls
`convertSRGBToLinear` by hand); check which space a number is in before theorising about GPUs.

**THE FILM CAMERA WAS EATING 60% OF THE RANGE.** `bokeh.maxblur 0.003` at focus 26 m. Edge density
0.0675 with it, 0.1708 with the post stack off. Three attempts to fix "the range has no surface"
were all upstream of that line and all failed. It is 0.0008 now, and that is why every vantage moved.

**MY OWN ASSERTIONS WERE WRONG SIX TIMES**, and every one is recorded where it lives: a ditch check
that averaged rings and went green on the defect it was written for; a walk that ran a straight line
through the village and reported buildings as terrain; a slope threshold that would have passed the
flat range; an edge metric that was reading brightness; colour metrics that included the sky; and a
hue band derived from tile spread that came out 199 degrees wide and called a yellow-tan "in band".
Roughly a third of this session's findings were in the instruments, not the code.

## SUGGESTED NEXT THREE PICKS

1. **TODO 100** — the woolshed levitates. Small, and it is a pinned eyeball item Eric has raised.
2. **TODO 112** — the carpark's snow does not exist in node. It is the last known place where
   geometry is invisible to every battery, and TODO 47's draw-order trap is why it is still open.
3. **TODO 82** — grass to the true horizon. Then **`SKY.md`**, per the RUN ORDER line added to
   TODO.md this session.

Also cheap and worth taking early: **TODO 117** — the PRESEAM mesh digest went green straight
through an inside-out winding, so it does not cover index order. That is the strongest invariant the
gauntlet has, and it was blind to the defect that cost this session its first two pieces.
