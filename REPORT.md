# REPORT — session 14, 2026-09-03: REPLAT P1, the renderer foundation

**P1's build work is done and certified. The re-pin is yours and is not done.**

Branch `replat-b`, five certifiable pieces, every one ending CERTIFIED-SHIP. The `gauntlet` branch
was never written to. `REPLAT.md` and the Birds of War wall arrived by fast-forward rather than
cherry-pick, so there are no duplicate SHAs waiting for you at merge time.

| | |
|---|---|
| nine batteries | ALL PASS on the ported build |
| gate | CERTIFIED-SHIP (now builds the bundle too) |
| captures | 30/30, no retakes, no give-ups |
| subjects | 16 checked, 1 red **on purpose** |
| playtest | both birds driven by real key events, split-screen post live |
| specimen | `dfbbb247aaadf0b6db06c2c38da31ee8` src/game.mjs |
| bundle | `f087df18379a73a8c2ba4cbd91c77856` dist/kea.js |
| frozen | `8232590523658dfc3f5a1fe59a916de0` **unchanged** |

## THE ONE THING THAT CHANGES HOW YOU JUDGE THE REST

**Pixel parity with the old baselines is impossible by construction.** Measured at boot in the
browser, same seed, same generator: r128 consumes **10,570** `Math.random` draws, r185 **10,738**.
three's internals take 168 more, so the stream diverges partway through the world build and every
randomised placement after that point — grass, tussock, scatter — lands differently. Scene
structure is identical (402 children, 64 interactables, 21 props on both).

This is rig.js's own "one seed and two reproducible worlds, not one world", now true across three
versions as well as across node and the browser. **No lighting fix, no seed, and no amount of
tuning closes it.** Your port-proves-itself split still earned its keep — it is why the colour
double-conversion, two three.js defects the batteries were pinning, and the light-model change were
each caught separately instead of as one unreadable blur — but SSIM against the r128 baselines
cannot be P1's acceptance instrument. The whole-set re-pin REPLAT already calls for is the only one
available.

**The control is what turned that into a measurement.** The first ported pass flagged 26 of 28
vantages and nothing on hand could say whether the port had moved or the machine had. Reshooting
the FROZEN r128 build through the pre-port path read **0.99998** and **1.00000** against the same
baselines. The ground is exactly where it was. Kept as `gauntlet/verify/frozen.mjs` for P2–P6.

## WHAT IS WAITING FOR YOUR EYE

Thirty fresh frames in `gauntlet/capture/`. The film camera is ACES + physical lights + GTAO +
a deliberately quiet bloom + subtle depth of field, tuned once as you asked.

- **The campfire lights its ground again** (`21_night_camp`). Its pool is tighter than r128's,
  because r128 attenuated by `pow(1-d/distance, decay)` and r185 uses physical `window(d)/d²`. That
  is the physical model being honest, not a bug.
- **Bloom is quieter than you may expect, and the ski field is why.** It runs on linear HDR before
  tone mapping, where lit surfaces already exceed 1.0. At 1.35 the carpark measured well and
  `28_skifield_base` blew to near-white — snow is high-albedo and its diffuse radiance alone reaches
  1.5–2.0. Pinned at 2.0 it sits above every lit diffuse surface and below the emissive sources: it
  catches the torch beam (+3.2 YAVG) and never a snowfield. **Raise it at the vantage** with
  `KEAFILM='{"bloom":{"threshold":1.8}}'`, or shoot the plain renderer with `NOPOST=1` for an A/B.

## LEFT RED ON PURPOSE

`subjects.mjs` → `07_jam` carblue scores **2950 against a floor of 3000**. That floor was calibrated
against the r128 renderer; the frame plainly contains four blue cars, the cone and the bird. Every
subject floor is in the same position — they are part of the pinned set and want recalibrating WITH
the baselines. Lowering one to get green is the thing FLAKES forbids, so it stands red and is
reported instead.

## FOUR ASSERTIONS RE-GROUNDED, NONE WEAKENED — AND THREE WERE PINNING DEFECTS

- `nonUnit===6` pinned r128 zeroing normals on two ZERO-AREA seam triangles. r185 emits neither
  (714 tris / 2 degenerate → 700 / 0).
- `arc>0` was worse. It counted 25 "chain" vertex groups and **never checked they smoothed** —
  measured, all 25 were still banded on r128 and the battery called that green. r185 smooths all
  352. Re-pinning it would have demanded the defect back.
- `G.sun.intensity<1.0` was an absolute intensity in r128 units, really "under 69% of daylight" with
  the 69% hidden in a literal. Every light is now ×π and nothing was wrong with the game.
- Each now asserts its CAUSE, is unit- and version-independent, and **r128 would fail two of them.**

## TWO INSTRUMENTS THAT HID THEIR REASONS

- `gate.sh` kept `tail -1` per battery, so a battery with two findings surfaced only the second. It
  still went red, but this session fixed one finding and only then learned another existed.
- `shotR` swallowed its exception, so a stage that could NEVER succeed looked exactly like a flaky
  GPU. The first pass reported only "GAVE UP 07_jam"; the cause — a bundled build has no global
  `THREE`, which two vantages stage with — took a separate hunt.

Both now say why. Neither loosened a check.

## A CORRECTION I OWE YOU

Step 2's commit said the game hand-converts sRGB "in exactly one place, the grass tints", and pinned
`ColorManagement.enabled=false` as temporary. **That was wrong.** The game converts in ~18 places
including both central material helpers `mat()` and `bmat()`. It owns a complete, consistent colour
pipeline, so enabling ColorManagement would double-convert *everything* and undoing that means
deleting eighteen call sites to buy the pipeline it already has. It is the correct **permanent**
setting, and step 5 documents it as one instead of promising it away.

---

# REPORT — overnight session 13, 2026-09-03

## ADDENDUM — session 13b: YOU SAID APPLY THE RIG PATCH, AND IT IS IN

`gauntlet/parked/todo30-and-67-deterministic-rig.patch` applied clean onto tonight's six pieces.
capture.mjs only — **the game file is still unopened**, md5 `8232590523658dfc3f5a1fe59a916de0`, gate
CERTIFIED-SHIP, tree clean. **NOT RE-PINNED and NOT RECALIBRATED**: both are your look, and the
eleven flagged frames are sitting in `gauntlet/capture/pair_<vantage>_todo30.png`, baseline on the
left and the new frame on the right.

**IT DOES EXACTLY WHAT SESSION 12 SAID IT WOULD.** They predicted 11 flagged frames worst 0.8467.
Measured: **11 flagged, worst `13_idle_preen` 0.8468**, then `14_player_view` 0.8884 and `16_trish`
0.9166 — their whole table, a build and a machine later. The eleven are 02, 06, 08, 10, 11, 12, 13,
14, 16, 19, 20.

**AND THE PRIZE IS REAL.** Full set, five sweeps, ten pairs each:

    nineteen of twenty-eight vantages under 100 px of cross-run churn
    two at exactly zero          29_lodge_deck, 30_groomed_band
    06_skyline    8791 -> 129    the worst vantage in the set, before tonight
    20_dead_rear  4353 ->  22    piece 69 and this patch, stacking as intended
    the three that do not collapse: 28_skifield_base 1291, 22_torch_beam 969, 09_colossal 825

`09_colossal` is **by design** — it is the popup fanout and it sets `__keaFeedKeep`. `22_torch_beam`
is the Rex arm lerp TODO 70 named. `28_skifield_base` is new, and it is the one thing worth your
attention below.

### The crossrun red on 28 is not the patch, and the bull wheel is

`crossrun` goes red on `28_skifield_base`: 1291 px against a recorded ceiling of 453. **I stashed the
patch and measured the same vantage on the same machine the same night** — six runs, fifteen pairs:
**5844 px worst**, samples 14 250 265 464 608 742 1105 1249 1810 3678 5046 5515 5655 5756 5844. So
the patch takes 28 from **5844 to 1291** and the recorded 453 was always too low. That is the third
time in three sessions that a ceiling from a sample has turned out to be a floor, and the first time
it has been the calibration table itself rather than a claim in a report.

**The residual is named: the bull wheel.** Line 3720, `if(G.towWheel)G.towWheel.rotation.z+=dt*2.4;`
— a pure `dt` accumulator that no clock pin can reach, which is why it survived a patch that took
06_skyline from 8791 to 129. Two runs cropped side by side are the same red disc with its bolt-head
at a different angle, and the hot cells are cx 7..9, cy 3..4, which is where it sits. **The fix is
one line in the 28 PIN** and it is the law-12 idiom every other vantage already uses — filed as
**TODO 72**, not taken, because choosing the angle moves that frame.

### Two things I did not do, both because they are judgements

1. **THE RE-PIN.** Eleven frames. Start with `pair_13_idle_preen_todo30.png`: the caption is gone
   (that is 67 working) and **the preen is caught at a different moment of its cycle**, because a
   pinned clock freezes poses as well as grass. That is the one real question in the sweep — every
   bird is still present, subjects reads **16 checked, 0 missing** across all eleven. boxdiff also
   flags `13_idle_preen` at 0.8891, which is that same pose change seen from the instrument built
   for it after piece 54.
2. **THE CHURN RECALIBRATION.** Every ceiling in the `pxdiff` table is now 20-50x too loose, so the
   instrument can no longer see a regression. The paste-ready table is in the crossrun output and it
   should be taken at **ten runs, not five** — tonight proved that on my own claim and again on 28.
   It belongs in the same sitting as the re-pin, because pxdiff reads fresh against baseline.

**And `12.0` is still a free parameter.** Nothing tonight swept it. If you want the value that
disturbs the pinned set least, that measurement is an hour and I have not spent it.


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
