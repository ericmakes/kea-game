# REPORT — overnight session 13, 2026-09-03

Stop condition: **6 pieces certified**. Your order was the step-6 fix first and alone, then the
numbered queue, and the parked deterministic-rig patch untouched. That is what ran. **The game file
was never opened.** Final build **8232590523658dfc3f5a1fe59a916de0**, unchanged from the tip you
left, gate CERTIFIED-SHIP, working tree clean, SESSION.lock released. Full sweep at the end: **28
pinned vantages, 0 flagged by diff**, subjects **16 checked 0 missing**, boxdiff **12 compared, only
the two known ones changed**, pxdiff 3 over band, three selftests ALL PASS.

**ONE FRAME MOVED AND IT IS NOT RE-PINNED: 20_dead_rear.** Both parked patches still apply clean.

## The headline, and it is a sentence you can act on

**FIVE OF THE TWENTY-EIGHT STAGE MARKS IN capture.mjs ARE INSIDE A SOLID, AND THE GAME MOVES THE
BIRD OFF EVERY ONE OF THEM ON THE FIRST FRAME.** The establishing shot is the worst: `01_carpark_wide`
declares (4, 16), which is inside a parked car, and the bird is photographed **1.18 m away** at
(2.82, 16) — and has been since the line was written. `12_seal_midpeel` is the one to look at, though:
it stands the bird **at the door seal at y 1.62, mid-peel, which is the act the vantage is named
for**, and the photograph is a bird **on the tarmac, 0.63 m out and 1.62 m down**. It reads well. It
is not what the line says. Nothing here churns and nothing here is a flake — the move is one step,
identical to five decimals in node and in the browser. What it costs is anyone who edits a mark: a
small nudge does nothing at all until the mark clears the body.

## Shipped

| # | piece | one line |
|---|-------|----------|
| — | step-6-fix | `boxdiff` and `pxdiff` are in the protocol now, three reports late |
| 69 | dead-rear-camlock | the last live camera in the set, locked to the follow rig's own fixed point |
| 61 | subject-box-20 | the box 69 unblocked, and it closes TODO 61 |
| 71 | stage-mark-ejection | the audit, and four marks inside a solid |
| 69c | correct-the-20-churn-claim | my own five-run number, corrected at forty-five pairs |
| 71b | computed-stage-marks | the two marks that are not literals — and the fifth ejection |
| 71c | annotate-ejected-marks | the cheap half of 71: every mark now says what it really does |

## Three things I need you to decide

1. **RE-PIN 20_dead_rear, or tell me the lock is wrong.** The camera on that vantage was assigned
   once and eased away for the whole settle; it is now locked to the fixed point of the follow rig,
   taken from the engine by running `KEAGAME.CAMS.update` to convergence at a fixed dt rather than by
   copying its arithmetic. **Proof: the camera reads identical to five decimals at settles of 600,
   900, 1200 and 4000 ms, where all four gave a different camera before.** The lock sits **1.4 cm**
   from the eased position your baseline caught: ssim **0.9831** (diff passes it) and **16906
   changed pixels** (pxdiff flags it at 3.1x), a sub-pixel slide of the horizon in a band across the
   middle of the frame. Judged frame, left flagged, `gauntlet/capture/20_dead_rear.png`.
2. **TODO 71: move the marks, or keep the photographs.** Moving `01` 1.18 m is a different picture,
   so the sweep belongs in the same sitting as the 30 + 67 re-pin. I took the cheap half only —
   every ejected mark now carries a comment saying where the bird actually stands, so nothing is
   silently wrong while you decide. The audit is `audits/2026-09-03/audit-stage-marks.js`, a report
   rather than a battery, and it carries its own browser control on four rows.
3. **The two parked patches are untouched and still apply clean**, and TODO 69 is out of their way:
   the camera on 20 is no longer a variable, so the daylight sweep has one fewer moving part. TODO 30
   and 67 are still yours and the `12.0` sweep is still the first move.

## Parked

- **TODO 30 + 67** — untouched by your order. `git apply --check` passes on both tonight.
- **TODO 71, new** — five ejected marks. The fix is a judged re-pin; the audit and the comments ship.
- **TODO 60, 64, 39b, 40b, 56, 32-fix** — judged, design-blocked or blocked art, exactly as filed.
- **TODO 68, 70** — still waiting on the two parked causes, exactly as 68 says in its own text.
- **Nothing failed.** No piece burned a round. No assertion was weakened; one of mine was corrected
  by a bigger sample and the correction is its own commit.

## The correction you should read before you trust any pixel count

**I FILED A 4.4x IMPROVEMENT OFF FIVE RUNS AND IT IS ABOUT 1.4x.** Piece 69 measured 20's cross-run
churn at 4334 → **991** over ten pairs a side and called the before "continuous" and the after "two
discrete states". Ten runs a side — **forty-five pairs each, same machine, same night** — say:

    before  4353 px worst    0 x4, 8 x2, 30..32 x6, 952..972 x17, 1020, 3306..3318 x4,
                             3714..3731 x8, 4338..4353 x4
    after   3185 px worst    0..8 x8, 985..998 x14, 1273..1281 x17, 2259..2271 x5, 3185
    after   2271 px worst    a second batch of ten straight afterwards

Both distributions are clustered; ten pairs cannot tell those two shapes apart and I should not have
named the shape off ten. **This is the third session in a row that a ceiling from five samples has
turned out to be a floor**, and the first time it has been my own claim rather than an inherited one.
**What survives is what the piece was for, and it never rested on the pixel count** — the camera is a
constant now, proven by a state probe rather than a sample. And it answers the question piece 69 left
open, in the opposite direction to instinct: **the pxdiff CHURN entry for 20 stays at 5489.** Lowering
it to 991 would have gone red on the very next batch of ten.

## Frames to eyeball

    gauntlet/capture/20_dead_rear.png            against baseline/20_dead_rear.png — the one moved
                                                 frame, 1.4 cm of camera, yours to re-pin or reject
    gauntlet/capture/baseline/01_carpark_wide.png the bird you have been looking at for weeks stands
                                                 1.18 m from where the stage line puts it
    gauntlet/capture/baseline/12_seal_midpeel.png the bird is on the tarmac, not at the seal
    gauntlet/capture/probeaway_20_dead_rear.png   the same photograph with the bird deleted from it —
                                                 the absent floor that TODO 61 could not measure

Two things to run rather than look at: `node audits/2026-09-03/audit-stage-marks.js` (add `MARKSALL=1`
for every row) and, after any capture pass, all three of `diff`, `boxdiff` and `pxdiff` — which is
now what step 6 of OVERNIGHT.md says.

## What the night cost me, and what it bought you

**THE FIX FOR 69 IS NOT THE ONE THE BRIEF NAMES, AND THE BRIEF WAS ONE WORD OUT.** It asks for the
camera to be held still at the offset the stage line assigns. Held there, 20 is a **close-up** — the
ease had all but converged by the shutter, so the pinned frame is the wide follow view. Piece 61 hit
that from the other side in session 12 and could not explain it. The answer was to stop nominating a
position and take the **fixed point**, from the engine: 400 iterations of the game's own `updateCams`
at a fixed dt, then lock. The collider march and the ground clamp are done by the follow rig instead
of copied out of it, which is law 10 applied to a rig file.

**THE WRONG CONVENTION COSTS AN HOUR AND LOOKS LIKE A FINDING WITH NO CAUSE.** I identified the
ejecting bodies with the camera-march test from `updateCams` — a point in a box — and `18_rear_close`
came back moved 0.274 m with no collider anywhere near it. The bird is separated by `pushOut`, with a
radius of 0.28 and a resolve on the shallower axis. With `pushOut`'s own numbers it is the caravan,
and **the predicted overlap equals the measured move on all five rows**, which is what turned a
correlation into a cause. The audit now prints the prediction beside the measurement and flags any
row where they disagree.

**ONE SELF-INFLICTED NEAR-MISS, CAUGHT BY A GREP.** My first "before" batch for the correction above
was extracted with `git show HEAD~2`, which is already the **fixed** capture.mjs — a second after-batch
wearing a before label, and it came back 2271, entirely plausible as a before. The check that caught
it was counting the old anchor in the extracted file before shooting anything. Assert the anchor
exists: it is the law for the game file and it is the law for my own tooling.

**AND SESSION 12 MEASURED HALF OF THE 12_seal_midpeel FINDING WITHOUT ASKING THE QUESTION.** TODO 70
records "y 0, vy 0, grounded true, five takes out of five" for that vantage while probing its churn.
That is the same measurement. Nobody asked why a bird staged at y 1.62 was on the ground.

## Suggested next three picks

1. **The re-pin sweep, in daylight, with both parked patches in** — unchanged from session 12's
   recommendation, and now with one fewer moving part on 20. Take the judged 20 re-pin in the same
   sitting, and pick the `12.0` value first.
2. **TODO 71's judged half**, in that same sitting: five marks, four bodies, and 01 is the frame the
   set opens with. The comments hold the fort until then.
3. **40b, starting with the tray-slide** — unchanged from sessions 11 and 12, still the signature act
   of the map, and nothing tonight touched or blocked it.
