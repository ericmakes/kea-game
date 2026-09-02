# REPORT — overnight session 12, 2026-09-02

Stop condition: **6 pieces certified**. Your order was the numbered queue, and the numbered queue is
what ran. **The game file was never opened.** Final build **8232590523658dfc3f5a1fe59a916de0**,
unchanged from the tip you left, gate CERTIFIED-SHIP, working tree clean, **0 of 28 pinned vantages
flagged**, subjects 15 checked 0 missing, boxdiff 11 compared with only the two known ones flagged,
three selftests ALL PASS. **Nothing was re-pinned.**

**ONE PATCH AND ONE RE-PIN MAKES THIS RIG DETERMINISTIC, AND THAT IS THE WHOLE REPORT.** Park the
caption, pin the clock, and **nineteen of twenty-eight vantages fall under 100 changed pixels of
cross-run churn, with four at exactly zero** — from a set whose worst was 8791. That is the target
TODO 33 named back in session 4 and that nothing here could measure until tonight. It costs 11
flagged frames and a look call on the whole set, so it is measured, packaged and **parked for you**:
`gauntlet/parked/todo30-and-67-deterministic-rig.patch` applies clean.

## Shipped

| # | piece | one line |
|---|-------|----------|
| 31 | changed-pixel-tripwire | `pxdiff.mjs` — every instrument here was SSIM, and SSIM cannot see a re-shade |
| 33 | cross-run-churn | `crossrun.mjs` — the third question about a frame, and it corrected 31 an hour later |
| 61 | subject-boxes-03-13-18 | boxdiff coverage 8 → 11; two of three re-posings pass `diff.mjs` outright |
| 32 | bevel-flank-audit | it is not caravan-only: 52 panels prove their own intent across nine bodies |
| 70 | name-the-last-churn | the residual is dt-weighted lerps, measured by letting them converge |
| 22 | name-the-torch-churn | Rex's arm, not the torch — and it corrects piece 70 one commit later |

Plus two commits that are **not** pieces: the **MEASURE** records for TODO 67 and TODO 30, each with
a patch in `gauntlet/parked/` and the full before/after table in its TODO entry.

## Three things I need you to decide

1. **THE DETERMINISTIC RIG, and it is one patch.** `todo30-and-67-deterministic-rig.patch` carries
   both causes because between them they want **one** re-pin sweep, not two. Before → after churn is
   tabled in TODO 30; the short version is 19 of 28 under 100 px and 19_roof_follow, 05_tussock_ground,
   28, 29 and 30 at zero. **The cost:** `diff.mjs` goes to 11 flagged, worst **13_idle_preen at
   0.8467**, then 14_player_view 0.8884 and 16_trish 0.9166. The session-3 note said "every frame
   moves slightly" and slightly is wrong — pinning the clock freezes **poses**, because the idle
   animations are sines on `G.time`. Every bird is still present (subjects 15/0); they are in
   different phases of their idles. **`12.0` is a free parameter** and it is one number in the patch,
   so a sweep to pick the value that disturbs the set least is worth an hour before the re-pin.
2. **TODO 67 alone, if you want the cheap half.** `todo67-park-the-feed.patch` is the caption on its
   own: the single biggest churn source in the set, ten vantages under 100 px by itself, one flagged
   frame (08_readability_320 at 0.9506, where the caption is a tenth of a 320x180 picture). I tried
   three ways to get it for free and there is no free version — the caption is in essentially every
   baseline, so any deterministic choice costs ~2900 px per frame. My recommendation is to take the
   combined patch and re-pin once, in daylight.
3. **TODO 32 is not caravan-only, and the scope is now known rather than guessed.** 52 panels stand
   proud of their skin on the exact axis and inside it on a bevelled one, across nine bodies. **The
   hut is the witness and it is one object:** `rbox(7,2.6,5.4,0.1)` really measures 7.184 wide, and
   the five weatherboard lines at `box(7.02,0.02,5.42)` sit **buried 0.082 on x** and **proud 0.010
   on z** — one mesh, one +0.02 margin, visible on two walls and sealed inside the other two. Nobody
   has ever seen the grooves on the long walls. The fix is still the reposition sweep with a look on
   every frame, which is yours.

## Parked

- **TODO 30 + 67** — measured, built, patched, parked. See the two decisions above.
- **TODO 69, new** — `20_dead_rear` assigns `G.cams[0].position` once with no camLock and no PIN,
  which is the one law-12 case FLAKES names in its own text. **Piece 61 proved something worse than
  drift while trying to measure a floor for it: that vantage cannot be reproduced from its own stage
  line at all.** Parking its bird moves the camera with it; locking the camera to the position the
  stage line computes gives a *close-up*, nothing like the pinned wide frame. The baseline is the
  **eased** position. Needs a PIN and a judged re-pin of 20.
- **TODO 70, new** — the last of the churn, named: dt-weighted lerp convergence on animated bones,
  which is the class the `08_readability_320` comment guessed at in session 8. Two ways out, both
  re-pin: a fixed `dt` for the rig, or a longer settle on four vantages. ~300 px on 22_torch_beam is
  a **named unknown of known size** — likeliest the spotlight shadow map, and that is labelled a guess.
- **TODO 68, rewritten** — see the correction below. What survives is the establishment that the
  pinned set is far less reproducible across processes than any instrument here had ever said.
- **39b, 40b, 60, 64, 56** — untouched. Judged, design-blocked or blocked art, exactly as filed.
- **Nothing failed.** No piece burned three rounds. No assertion was weakened to pass; three of mine
  had to get *less* absolute and more honest, and the details are in the log.

## The correction you should read before the table

**I SHIPPED A WRONG TABLE AND THE NEXT PIECE CAUGHT IT, AND THAT WAS THE MOST USEFUL HOUR OF THE
NIGHT.** Piece 31 filed four drift findings off five capture sweeps — `09_colossal` at 1565..1584 px
from its baseline against a churn of 22, **seventy-one times over**, ssim 0.9992, with session 6
measuring that same pair at 0 px. It looked unanswerable. Piece 33 then shot five more sweeps an hour
later on the same unchanged build and **09 churned 2233 px by itself**; fourteen of twenty-eight
vantages beat their five-sweep ceiling. All four new claims collapsed. Only `07_jam` and `17_flight`
survive ten sweeps and both were already known to you. The table, the file header and TODO 68 were
corrected in the same commit that found it.

The lesson is now written into the table about itself: **a ceiling from three samples is a floor, and
so is a ceiling from five.** Three sweeps said 07_jam churns 20 px; five said 1881; ten said 2865.

## Frames to eyeball

    gauntlet/capture/baseline/20_dead_rear.png   the caption, top-centre — the thing TODO 67 removes,
                                                 and the frame that cannot be reproduced (TODO 69)
    gauntlet/capture/baseline/09_colossal.png    the popup fanout, which is why 67 clears the feed
                                                 for everything and lets THIS vantage opt out
    gauntlet/capture/baseline/03_kea_plate.png   the first of piece 61's three new subject boxes
    gauntlet/capture/baseline/18_rear_close.png  the vantage the pixel tripwire was proved on

Nothing moved tonight, so there is no before/after pair to judge — the frames above are for reading
the two decisions against, not for approving a change.

Two things to *run* rather than look at: `node gauntlet/verify/pxdiff.mjs` after any capture pass
(add `PXCELLS=1` and it tells you *where*), and `BEVELALL=1 node
audits/2026-08-28/audit-bevel-flanks.js` for the whole 32 ledger.

## What the night cost me, and what it bought you

**FLAKES 14 FROM ITS OTHER SIDE, TWICE IN ONE PIECE, exactly as your session-11 log warned.** Two of
piece 33's sabotages were **no-ops**: my sed anchor ended `)};` where the file says `)});`, so nothing
was edited. One reported ALL PASS on an unmodified file; the other "found" something only because an
unrelated real flake fired in the same run. Assert the anchor exists *first* — it is the law for the
game file and it should have been the law for my own tooling.

**THREE OF MY OWN ASSERTIONS WERE FLAKES, and running them is what found all three.** A claim that the
re-shade *passes* the diff threshold (0.9868, 0.9863, 0.9863 — then **0.9580** on one run in six,
because the pair straddles the bar). A ratio against a control whose denominator churns. And two
assertions that passed on the **null** fixture, because ordinary churn on that vantage moves 49 grey
levels and warms 12 cells — measured, **the re-shade peaks lower than the churn does**, so amplitude
does not discriminate a re-shade at all. The count and the spread do.

**AND THE NEW INSTRUMENT STOPPED ME SHIPPING SOMETHING ON ITS FIRST DAY.** My first TODO 67 fix froze
each popup at a fixed phase of its own animation. It keeps the stagger, it reads beautifully, and it
requires clone-replacing the wrapper so it survives its own pending `remove()` — which makes the
caption **permanent and fully opaque in all 28 frames** and drops 08_readability_320 to **0.8711**. A
rig change that reds the diff on a vantage it was not aiming at is not a staging fix. `pxdiff` and
`diff` caught it before it was committed.

**ONE HYPOTHESIS DIED IN ONE PROBE, and it is the cheapest lesson here.** `12_seal_midpeel` sets the
bird `grounded=false` with no PIN, so I expected a bird still falling through the settle. Measured at
shutter: `y 0, vy 0, grounded true`, five takes out of five, frame count 142 every time. It is the
**wings** — a `lerp(current, target, dt*k)` that had not converged. Reading the state beat reasoning
about the stage line, and it beat it in about ninety seconds.

**AND ONE OUTLIER IS DELIBERATELY NOT IN THE TABLE.** `18_rear_close` returned **16317 px** once in a
real cross-run pair, against a distribution topping out at 3909 over thirty-odd pairs and 2563 over
fifteen more taken straight afterwards. Fitting to it would push 18's band above the piece-9 re-shade
and blind the tripwire on the one vantage it was proved with. Recorded as law 9, watched, not absorbed.

One process note, and it is the third session in a row it has been made: **`boxdiff.mjs` still is not
in the per-piece protocol at step 6 of OVERNIGHT.md, and now `pxdiff.mjs` should be beside it.** I ran
both by hand again tonight.

## Suggested next three picks

1. **The re-pin sweep, with both patches in and in daylight.** It is the gate to a great deal: TODO
   69 and 70 both want it, and every future drift reading in this repo gets sharper the moment the
   rig stops churning thousands of pixels. Pick the `G.time` value first.
2. **TODO 69** — small, self-contained, harness-side, and piece 61 has already done the diagnosis. It
   wants a PIN of the same assignment every frame, the way the other nine live vantages do it, and a
   re-pin of one frame. Take it in the same sitting as the sweep.
3. **40b, starting with the tray-slide** — unchanged from session 11's recommendation and still the
   signature act of the map. Nothing tonight touched it and nothing tonight blocks it.
