# REPORT — REPLAT P4, instanced grass (session 18, 2026-09-03)

Branch `replat-b`. Gate **CERTIFIED-SHIP** at specimen `3793c3c45fb34fbac82e506b3e4697d3`.
**Nothing re-pinned. 25 of 28 vantages flagged and waiting on you.**

## WHAT SHIPPED

A GPU-instanced blade field that **follows the camera**. 120,000 blades in a 14 m radius —
**195 blades/m²** — with per-blade vertex wind, distance thinning that fades rather than pops,
clumping into mounds with real bare ground between, and a transmission term so the blades glow when
you look down-sun through them. The ski field has grass for the first time: its terrain has always
lerped to tussock below z=34 and there was never a blade standing in it.

**The camera-following design is a measurement, not a preference.** A static field over the
playable world can afford **33 blades/m²** at this budget, which photographs as stubble; and
shrinking its radius to raise density just moves the grass away from the bird — the r20 frame in
that sweep came back with an empty foreground. Same budget, six times the density, everywhere the
bird actually goes.

## THE FRAME BUDGET, MEASURED AT THREE TIERS

Loop-timed scene cost, GPU synced with a readPixels, best of six passes of forty renders, at the
Retina framebuffer the game actually runs at — 2304×1296, because `setPixelRatio` caps at 1.8 and a
Mac reports 2. Pre-P4 baseline (the 42,000-blade triangle carpet): **8.978 ms**.

| tier | blades | radius | blades/m² | scene ms | vs baseline |
|---|---|---|---|---|---|
| low | 60,000 | 14 m | 97 | 16.710 | 1.9× |
| **mid** | **120,000** | **14 m** | **195** | **23.878** | **2.7×** |
| high | 240,000 | 17 m | 264 | 39.360 | 4.4× |

Beyond the tiers: 420,000 → 62.4 ms; 1,900,000 → 259.5 ms at 26.9M triangles, all genuinely drawn.

**Why mid, and the honest limit on that choice.** I could not measure a true frame rate from this
machine and you should know it. I wrote a RAF-based fps mode and it reported **59.9 fps for 120,000
blades, for 1,900,000 blades, and for the pre-P4 build — all identical** — because headless Chrome
drives requestAnimationFrame on a fixed cadence. A number that doesn't move when the work grows
tenfold isn't measuring the work. So "holds a playable frame rate on your Mac" is the one part of
the brief I cannot settle. What I can say: 8.978 ms was the already-accepted cost of the build you
have been judging, mid is 2.7× that and high is 4.4×, and the four densities photograph close
enough that above 240k the difference is barely visible while the cost doubles again. Shipping the
2.7× tier is the defensible call. **high is measured, kept, and one env var away on the machine
that can actually judge it:**

    KEAGRASS='{"tier":"high"}' npm run dev

## THE ONE THING I WANT YOUR EYE ON FIRST

**The first tuning buried the bird.** At the heights I picked by eye, the kea portrait read
**465 pixels against a floor of 1600** and the preen vantage 414 against 900 — three bird
classifiers red at once. Blade height is the dominant lever; five tunings measured; locked at
0.20–0.48 m, which reads 1663/1600 and 1604/900 and puts the set back to exactly the two known
TODO 75 reds. **No floor was touched.** Some occlusion is authentic — ref_bow_03's bin is
half-buried and looks right — but that is the trade I most want you to check, because it is the
line between "a field" and "where did the bird go".

## FRAMES TO EYEBALL

- `gauntlet/capture/05_tussock_ground.png` — the field at bird height, against **nz_tussock_01**
- `gauntlet/capture/03_kea_plate.png` — the bird IN the grass; the readability trade
- `gauntlet/reference/pairs/05_tussock_ground__ref_bow_02.png` — density and light through blades
- `gauntlet/capture/24_verge_paddle.png` — the cut-outs: road and car park bare, verge grassed

## WHAT IS STILL SHORT, AND WHY IT IS NOT P4's

- **The 260 tuft cones are still standing among the real blades** (the small gold triangles at 05).
  The blades do their job now, but removing 260 `rnd` draws shifts the seeded stream for everything
  built after them, and that is a re-pin of its own rather than a side effect of this piece.
- **The grass casts no shadow.** A shadow pass over 120,000 blades is a second full vertex pass;
  the transmission term and the ground's AO stand in for it.
- **No ground-texture tint on the blades.** Sampling the P3 scanned ground and tinting each blade by
  the ground it grows from would tie the field to the terrain at the macro scale. Good idea, not in
  the brief.

## VERIFIED

Nine batteries ALL PASS; gate CERTIFIED-SHIP; gate-selftest ALL PASS; **fifteen P4 sabotages, all
fifteen red**; 30/30 vantages shoot with no retakes; sidebyside 33 pairs.

    stability  4 vantages x 3 takes, 0 unstable (worst 0.9956)
    diff       28 compared, 25 flagged (worst 0.4866)
    boxdiff    12 compared, 5 changed
    pxdiff     28 compared, 27 over band
    subjects   16 checked, 2 missing — the two known TODO 75 reds, no new regression

**05_tussock_ground, the grassiest frame in the set, reshoots at exactly 1.0000** — the cleanest
available proof that the wind is deterministic under the capture clock pin, which is the third
claim in P4's proof contract.

Four things I got wrong are in the log with their causes: the anchor was never written (the field
sat at the world origin and photographed as "no grass"), blade width was in the wrong units (metre-
wide shards), the fps instrument measured the browser idling, and a battery edit of mine shifted
the seeded stream and broke six unrelated hint assertions.

## SUGGESTED NEXT

P5 — the kea as an asset. It is the last thing still made of primitives in a world that is now
scanned ground, real materials and a real field, and REPLAT calls it the end of "blocks taped
together".
