# REPORT — REPLAT P4c, nature has no right angles (session 20, 2026-09-04)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `4a8bf227f48413bed78ad9cee7a19715`.
**Nothing re-pinned. 27 of 28 vantages flagged.**

## THE INVESTIGATION — ONE TEST, TWO CANDIDATES RULED OUT

Shooting `14_player_view` at clumpM **0.70 / 1.35 / 2.70** makes the square patches shrink and grow
with it. That is the clump cell and nothing else — the placement lattice is a golden-angle
sunflower spiral (radial, no grid) and the patch edge is a disc, so both of your other candidates
are out.

The model was **one mound per square cell**, and `bare` culled **whole cells** — literal right
angles in open country. Jitter could never have fixed it: a jittered grid is still a grid, because
every cell contributes exactly one mound and its territory *is* the cell.

## THE THREE FIXES

- **Mounds are territories, not tiles.** A mound is the nearest of nine jittered feature points, so
  its territory is an irregular polygon whose edges follow no cell boundary. The subtle half: the
  winning neighbour has to become the mound *identity* too, or the geometry stops stepping at cell
  edges while height and colour still do, and the squares come back in the colour.
- **Bare ground is a noise field, not a per-cell step** — patches ~6.9 m across with soft wandering
  outlines, deliberately much larger than the 1.35 m mound spacing so the noise does not just
  re-cut the same grid.
- **The edge is ragged.** The fade was a pure function of distance — a perfect disc, the straight
  line's circular cousin. Now perturbed by world-space noise on both thresholds.

## PROOF

`14_player_view`, `05_tussock_ground`, `06_skyline` and `01_carpark_wide` — no straight line and no
repeating lattice in any of them. `14` is the direct before/after: the rectangular patches are gone
and the gaps have wandering outlines.

## COST — AND A CORRECTION TO EVERY FIELD NUMBER I HAVE GIVEN YOU

`perf.mjs` set `G.camLock = true`. **camLock is an object** — `{x,y,z,lx,ly,lz}` — so a bare `true`
is truthy with no coordinates: `updateCams` honoured a lock that said nothing and the camera stayed
where the follow cam had it. **Every loop-timed figure I have reported for the grass was taken at
the follow camera, not the vantage it was labelled with.** The comparisons between them hold — every
run did the same wrong thing — but the absolute numbers do not. Found while debugging why a grass
field would not appear in a debug view. Re-measured at the corrected camera:

    pre-P4 (P3 carpet)      7.057 ms
    P4b                    17.103 ms   2.4x
    P4c                    18.040 ms   2.6x   <- shipped
    P4c, blobScan off      17.335 ms   2.5x

**The squares fix costs +0.94 ms**, of which the 3×3 blob scan is +0.71 ms.

## THE BIRD GOT MORE READABLE, NOT LESS

`03_kea_plate` reads **9693** against a floor of 1600 and `13_idle_preen` **5988** against 900 —
both far better than P4b, because noise-driven bare ground means the bird is often standing in a
gap rather than buried in a mound. The readability tune was not touched.

## ONE HAZARD I OWN, AND TWO FIXES THAT MADE IT WORSE

The field is snapped to a grid so it cannot swim, which makes its content a **step function of
camera position**: a take-to-take camera difference near a boundary jumps the whole field by `snap`.
`05_tussock_ground` went from 1.0000 to 0.9842. With the ragged edge disabled it was still
unstable, so the edge is not it. Then **anchoring to the bird gave three unstable instead of one**
(the bird is no more settled than the lens at shutter time), and **a finer derived snap also gave
three** (a smaller step is crossed far more often, and 4 cm is plenty of pixels on a portrait).

Then the measurement stopped agreeing with itself: snap 0.5 / 2.0 / 6.0 gave **3 / 1 / 3** unstable,
and 0.5 had given 1 earlier in the same session on the same code. A signal that moves without the
code moving is the machine. I left `snap` at the value P4 shipped, recorded the hazard, and stopped
— the honest next step is `crossrun` on a quiet machine, not another constant fitted to noise.
**No threshold was touched.**

## STILL SHORT

- **The ground tint is one flat multiplier**, and at `06_skyline` the mid-distance is a single
  unvaried olive — P4b's own note said so and P4c did not touch it.
- **The colour seam at the horizon is still there**: the rolling tussock hills are separate
  vertex-coloured geometry and do not get `groundTint`. Those two are one piece, and it is P3's
  territory rather than the grass's.

## VERIFIED

Nine batteries ALL PASS; gate-selftest ALL PASS; **twelve P4c sabotages, all twelve red**; 30/30
vantages shoot clean; sidebyside 33 pairs; subjects 16 checked, **2 missing — the two known TODO 75
reds, no new regression**. diff 27 of 28 flagged, boxdiff 7 of 12 changed, pxdiff 28 over band.

## SUGGESTED NEXT

P5 — the kea as an asset. It is the only thing left in frame made of primitives.
