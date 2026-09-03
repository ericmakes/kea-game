# REPORT — REPLAT P4d, the squares were the cover layer (session 21, 2026-09-04)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `2219325fdb3ebf535d749399d625275d`.
**Nothing re-pinned. 27 of 28 vantages flagged. Fifteen sabotages, all fifteen red.**

## IT WAS THE COVER LAYER, AND THE BUG WAS A SENTENCE P4c WROTE

P4c fixed the clump layer and exempted the cover layer in the same commit: *"the search is skipped
where the pull is negligible: the cover layer sits at 0.10 and gathers almost nothing, so nine hash
lookups per vertex would buy it nothing."* That was reasoned, never photographed, and wrong — and it
left the defect in the layer covering the closest ten metres of every play frame.

## THE MEASUREMENT — FOUR CANDIDATES, ONE VANTAGE, ONE BUILD

| system | knob swept | what the frame did |
|---|---|---|
| **cover layer placement** | `cover.clumpM` 0.55 / 1.10 / 2.20 | **straight bare lanes in a rectangular lattice; the cell doubles and doubles again in step** ← the cause |
| bare-ground noise field | `bareScale` 0.29 / 0.145 / 0.0725 | pattern shifts, no square at any setting (4× range) |
| ground mask — lattice | `ground.segs` 24 / 48 / 96 | horizon blobs shift, no square at any setting |
| ground mask — pattern | `ground.maskScale` 0.5 / 1.0 / 2.0 | blob size changes as asked, no square at any setting |

The ground colour mask had **no scale knob** — a literal `PlaneGeometry(240,240,48,48)` and four
magic sine frequencies inline. A candidate with no knob cannot be ruled in *or* out, so it got one
before it was diagnosed. It reaches both terrain planes; the assertion enforcing that went red on the
ski field's plane first time it ran.

## THE MECHANISM — ARITHMETIC, NOT TASTE

`w = mix(w, cc, pull)` moves every blade `pull` of the way toward its cell's centre. On a square cell
that **vacates a margin along every cell edge**, so a small pull does not draw a faint grid — it
draws a grid of straight empty lanes, in negative space. The smallness that was thought to make it
safe is exactly what makes it legible. Re-shot at `cover.clumpPull` 0 the lanes vanish completely at
both 0.55 and 2.20, which pins the pull and rules out the mound's own colour.

## THE FIX — ONE CONSTANT, AND THAT IT *IS* A CONSTANT IS THE POINT

`GRASS.blobMinPull = 0.0`, replacing a hardcoded `0.2` buried in a uniform expression. That 0.2 was
unreachable from the recipe: it could not be tuned, could not be shot, and could not be argued with.
At zero, **any layer that pulls at all gets an irregular territory**, because any pull at all draws
the lattice it pulls toward. The cover's mound identity (height and colour) now travels with that
territory too — the subtle half P4c learned the hard way on the clump layer.

The cheaper alternative was measured and **not** shipped: `cover.clumpPull 0` also kills the squares
and costs less, but it flattens the cover to a mathematically even carpet and leaves the identity on
a square lattice that would surface the moment anyone tunes the cover's colour. It is one env var
away (`KEAGRASS='{"cover":{"clumpPull":0}}'`) if you want to judge it.

## COST — AND THE FIRST READING WAS WRONG

Interleaved, quiet machine, `perf.mjs bird`, best-of-6 × 40 renders, 1280×720 DPR 1:

    blobScan off entirely   14.16 ms   (4 runs, 13.79-14.45)
    P4c (clump only)        14.36 ms   (7 runs, 13.89-15.22)
    P4d (both layers)       14.69 ms   (7 runs, 14.12-15.10)   <- SHIPPED
    P4c / P4d at DPR 2      17.87 / 17.90 ms

**About +0.33 ms, and nothing measurable at Retina** — the added work is per-vertex and that frame is
fragment-bound. The ranges overlap; "at or below this instrument's noise floor" is the honest
statement. The first reading said +1.3 ms and was taken with eleven headless Chromes from the capture
sweep still on the machine — publishing it would have been P4c's camLock mistake in another currency.

## THE PROOF FRAME

1920×1080, HUD hidden, camera `(-8, 2.4, -6)` → `(6, 0.45, -30)` — a **diagonal** look across the
field, chosen so a world-axis-aligned lattice crosses the frame at an angle and cannot hide in the
perspective. Shot at `blobMinPull` 0.2 and 0.0 from the same build. Before: straight lanes and a
right-angle corner. After: wandering channels, **no straight segment anywhere in the grass**, and a
ground colour that is a soft wash with no lattice and no facet edge.

## TWO THINGS FILED, NOT FIXED

- **TODO 79 — the hut roof is an inverted gable.** Verified from the geometry, not filed on report:
  each panel's edges land at ±1.04 in y, so the two planes **meet at their lowest point (y 2.31 on
  the centre line) and rise to 4.39 at both eaves.** The rotation signs are swapped. The ridge batten
  at y 3.98 therefore floats 1.67 m above the valley it caps, and the collider says `ridge 4.05` — so
  the bird walks an invisible *correct* ridge above a visible wrong one, which means the fix brings
  the drawn roof to the collider, not the reverse. The wall gap is the same bug sideways and may
  close on its own. One honest gap: I found no mesh named for a solar panel in `buildHut` — what
  reads as off-pitch panels is most likely the twelve ridge battens riding `rl`'s wrong rotation.
  Recorded as unconfirmed.
- **TODO 80 — the rolling tussock hills have flat tops.** `SphereGeometry(rad,18,10)` at `scale.y`
  0.2-0.3 collapses the polar bands into a genuinely flat cap, and the sculpt only perturbs x/z.
  At 64-84 m that is a dead straight line against the sky — **and it is the only straight edge left
  in the wide proof frame,** which is why you are reading about it here rather than finding it.

## ALSO IN THE TREE

- `perf.mjs` had the camLock bug **twice**; P4c fixed one call site. Fixed the other.
- An assertion's own message was a law-14 fuse (`undefined.toString`) and killed the battery instead
  of reporting a finding. **My sabotage script scored that green** because it only grepped for
  FINDINGS; it now judges a throw the way the gate does.
- The dead-knob sweep now goes inside the nested blocks, with its limit stated in the file.

## PROOF

Nine batteries ALL PASS · gate CERTIFIED-SHIP · gate-selftest ALL PASS · fifteen sabotages all red ·
bundle builds · 30/30 vantages shot, no retakes, no GAVE UP · diff 28/27 flagged (worst 0.2690 vs
P4c's 0.2694) · boxdiff 12/7 changed · pxdiff 28 over band · subjects 16 checked, 2 missing (the two
known TODO 75 reds) · sidebyside 33 pairs · bird readability held: 03 reads 9674/1600, 13 reads
5683/900 · the 05/14 reshoot hazard is unchanged, still P4c's, no threshold touched.

**Everything left flagged. The look is yours.**
