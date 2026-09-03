# BASELINE MANIFEST — pinned 2026-08-27 night
Build: e1c8c3009033c907f2c5386e96fabb82 (solid lofted bird, 8 batteries green)
Pinned fresh: 02 hut, 03 plate, 05 tussock, 13 preen, 14 player-view, 15 sign,
16 trish, 17 flight, 18 rear-close — all shot on this build.
Legacy (pre-loft, refresh pending, do NOT diff the bird against these):
01, 04, 06-12 — world-content still valid; bird pixels are historical.


## Re-pin 2026-08-28 (build 41d1c6f3 — night wave)
Pinned fresh on this build: 03 plate, 12 seal, 14 player-view, 18 rear-close, 20 dead-rear,
21 night-camp, 22 torch-beam. 02/05/13/15/16/17/19 remain from earlier builds — world content
valid, bird pixels predate the size/rig/contour waves; refresh opportunistically.

## Full re-pin 2026-08-28 (build 49cd1ed5 — nine-battery era)
Legacy set re-shot and pinned on the certified build: 01,02,04,06,07,08,09,17.
Every baseline now carries the current bird (0.7 scale, unified rig, contour) and world
(caravan, night system). diff.mjs is the tripwire of record; expect all-green.

## 2026-08-28 late — traced sign + texture wave (build f4886150)
Pinned on this build: 02, 14, 15. NOTE: the texture wave repaints most surfaces, so the
other pins pre-date it; diff will flag each on its next reshoot — that is the tripwire
working, not drift. Re-pin opportunistically.

## Full sweep complete 2026-08-28 (build f4886150)
All 19 vantages reshot and pinned on the textured build. Judged clean at 02 hut, 03 plate,
12 caravan, 21 night. Tripwire truthful again.

## 2026-08-28 overnight — THE TRIPWIRE WAS NOISE (tooling fix, build cbfd9cca)
Finding: every vantage reshot at ssim 0.82 against ITSELF. diff.mjs was measuring a scenery
lottery, not drift, and could never have gone green. Two causes, both harness-side:
1. The game seeds nothing. setSeed is exported but never called, so buildWorld draws the
   mountains, hills, trees, gravel, snow and tussock from an unseeded Math.random at page
   load - a different country every capture. capture.mjs now serves the game with
   setSeed(20260828) spliced in front of its own boot call.
2. three draws 12 randoms per mesh for uuids, from the same stream. A global Math.random
   seed alone is therefore not enough: adding ONE object shifts every later draw and
   reshuffles the whole world. Seeding the game rng instead makes the world immune to that.
   The global Math.random seed is kept as well, for the direct Math.random calls in gameplay.
Also: launch() falls back to the system Chrome (channel chrome). The bundled Chrome for
Testing ships unsigned and macOS refuses to exec it (spawn error -88), which is why every
shot in the first overnight sweep came back GAVE UP.
Result: same build reshoots at ssim 0.976 worst, 0 flagged. The tripwire is real.
Full re-pin on this build: all 22 vantages, including 10_skifield, 11_trailhead and
19_roof_follow which had never been pinned. NOTE: pinned on local Chrome 151 / Metal, not
the container SwiftShader - the old pins read ~0.78 here for reasons of renderer, not
content. Threshold stays 0.965 - never lowered.

## Re-pin 2026-08-28 overnight (build 8c6bedf2 — grunge v2)
All 22 re-pinned on the certified grunge-v2 build. Nothing was flagged when this piece was
diffed against the cbfd9cca pins (worst 0.9650 at the known-noisy torch beam), so no red
frame was pinned green; this keeps baseline equal to last-certified-ship. Visible delta lives
at 01_carpark_wide: the boulder that sat embedded in the tarmac is gone, and the carpark
mouth now carries an oil-dark wear patch.

## Re-pin 2026-08-28 overnight (build b51abe08 — tussock comb)
All 22 re-pinned. The tussock is in nearly every frame and it now leans, so 19 vantages
flagged against the grunge-v2 pins; the change is intentional and global, not drift.
Judged improved-or-equal before pinning: 03 kea plate, 05 tussock ground, 08 readability 320,
10 skifield, 14 player view, 21 night camp. Nothing red was pinned green.

## New vantage 2026-08-29 (build 0c0693df — paddock gate)
23_paddock_gate pinned: the paddock had no vantage at all, so the emptiest area of the map
was invisible to the tripwire. Camera sits outside the gate looking down the pen.
The other 22 held at 0 flagged, worst 0.9870 — the paddock toy is local, as it should be.

## Re-pin 2026-08-29 (build 36bbe94f — satellite gags)
All 24 re-pinned, including the new 24_verge_paddle. The 23 previous vantages held at 0
flagged (worst 0.9738) before the re-pin, so nothing red was pinned green.
NOTE for the next run: the residual drift on grass-heavy frames comes from buildGrass
colouring blades with Math.random rather than the seeded rnd(). Object-count changes shift
that stream, so adding props tints the field very slightly. Moving grass colour onto rnd()
would take the tripwire to near-zero noise. Named as a next pick, not done here.

## Subject staging 2026-08-31 (build 0758d092 — GAME FILE UNCHANGED)
04, 07, 09, 17 re-pinned on an intentional reframe. The game did not change; capture.mjs did.
These four vantages had been shipping WITHOUT their subject: the bird flew out of frame during
the settle in 04/09/17, and QUIET deletes every traffic car, so the jam vantage was an empty
road. A one-shot stage cannot hold a bird that is still being simulated, so capture.mjs now has
PIN(), which re-applies the pose every animation frame - the harness-side perch idiom.
NEW TOOL: subjects.mjs, a presence tripwire beside diff.mjs. diff.mjs could never have caught
this, because a birdless frame is perfectly stable and SSIM only asks whether a frame CHANGED.
Verified adversarially: subjects.mjs fails all 6 checks on the four frames these pins replaced.

## Staging fixes 2026-09-01 (build 01675b29 — GAME FILE UNCHANGED by this piece)
19, 21, 22 re-pinned. capture.mjs changed, the game did not. These three did not reshoot the same
twice, and the cause in every case was something left LIVE during the 900ms settle, so the frame
depended on how many animation frames the machine got through. Measured take-to-take before and
after, with the new stability.mjs:
  19_roof_follow  0.9850 -> 0.9988   bypassed camLock, so the follow cam lerped away all settle
  21_night_camp   0.9860 -> 0.9986   nightT without nightManual (law 5), plus a live camp fire
  22_torch_beam   0.9852 -> 0.9970   same law-5 omission, plus rex and his torch sweep
  02_hut_snow     0.9899 -> 0.9988   QUIET parked the humans ONCE and dave walked back in
  16_trish        0.9911 -> 0.9983   trish is on set, so law 4 applies to her directly
02 and 16 moved but stayed under threshold, so they are NOT re-pinned here.
JUDGED BEFORE PINNING, and all three are improvements rather than merely different:
  - the OLD 19 and 21 baselines both had a STRAY HI-VIZ HUMAN standing in frame - dave and a
    second walker who had escaped the QUIET park. Both frames are now clean.
  - 22 keeps its beam. Pinning rex to state idle killed it (the torch only reads when the ranger
    has you), so rex is staged in the engine own 'chase' state, which pins the sweep to 0 and
    raises beam opacity to 0.13 - brighter AND deterministic, and it is what the vantage own
    SPOTTED IN THE BEAM popup already claims. The beam now lands squarely on the bird.
  - 19 is the true follow-cam geometry rather than wherever the lerp happened to stop.
NOTE: the 22 re-pin was reached on the third staging attempt. The first two were deterministic but
degraded the subject; recorded in gauntlet-log.md rather than hidden.

## Full re-pin 2026-09-01 (build 1667e397 — seeded grass tint)
All 24 re-pinned. The blade tint moved off Math.random onto a fixed-seed generator, so the tint
pattern reshuffled ONCE, globally and intentionally, exactly as TODO 27 predicted. 14 of 24
flagged against the previous pins before this sweep (worst 0.8719 at 14_player_view) - grass fills
most of every frame, so a tint reshuffle is expensive in SSIM and cheap in meaning.
JUDGED BEFORE PINNING: 14_player_view, 03_kea_plate, 05_tussock_ground eyeballed against their old
pins. Same three source colours, same 50/50 split, same lerp range - only the sequence differs, so
the field is statistically the same country. The bird is untouched (03 is a close-up and the bird
pixels are identical; its 0.9158 is entirely surrounding grass).
BONUS, and it argues for the QUIET fix in the same session: the OLD 14_player_view pin ALSO had a
stray escaped human standing right of centre, like 19 and 21 did. Gone now.
WHAT THIS BUYS, measured as an A/B rather than asserted: inject one extra off-camera mesh (which
consumes a three uuid, so it moves Math.random but not rnd) and reshoot 05_tussock_ground.
  before this piece                    0.9735   <- the whole residual tripwire noise
  blades seeded                        0.9968
  blades + grass detail map seeded     0.9983   <- at the renderer take-to-take floor (~0.998)
07_jam ALSO CHANGED HANDS. spawnTraffic picks the body colour with pick(), which draws
Math.random, so removing ~94k draws from buildGrass turned the queue from blue to white and
subjects.mjs went red (carblue 9930 -> 441). The frame was a perfectly good jam; its subject had
simply changed identity. Rather than re-fit the classifier to an accident, capture.mjs now STAGES
the body colour (fresh material per car, applied only to meshes sharing that car body material
inside its own bodyG, so bumpers/glass/lamps are untouched). carblue is now 17649 against the
ORIGINAL calibrated floor of 3000 and absent of 14 - piece 4 calibration untouched, nothing refit.
Measured first: on the new build carblue separated cars from a carless reference by only x7.5
(441 vs 59) and no colour-agnostic classifier did better than x2.1, because a body colour drawn
from Math.random cannot be pinned by a hue window at all. Staging beat calibrating.

## New vantage 2026-09-01 (build 1667e397 — GAME FILE UNCHANGED)
25_preen_follow pinned. Piece 6 fixed the preen head read and was certified against a metric, but
the original complaint named the FOLLOW camera and no vantage stood there: 13 is a 1.35-unit
portrait and 14 is follow distance with no preen. The set could not see the actual complaint.
Camera is the engine own follow geometry rather than an invented distance - back
5.2*(0.62+0.42*S), height 2.15*(0.62+0.45*S) from updateCams, aimed at the engine own head height
k.y+0.72*S - at camDist 0.6, which is the closest the game itself allows (clamp 0.6..1.6, default
1). NOTE FOR ERIC: at the DEFAULT camDist the bird is about 40px tall and NO head read is possible
at all, by eye or by classifier. That is worth knowing on its own.
It stages the WORST frame of the cycle, measured headless over both sides at 0.05s steps: t=1.60
side -1, where the head sits 0.0459 under the wing line against PREEN.eps 0.055. Judging the easy
frame would have proved nothing.
VERDICT ON THE ACTUAL COMPLAINT: the fix HOLDS. At the worst frame the head is a distinct lobe
with the pale cere and the dark beak clear of the body mass. Reshot with the PRE-piece-6 constants
for comparison, the head is buried and the beak does not show at all.
subjects.mjs gains a beak check calibrated on exactly that pair - 33 with the fix, 0 without, so
absent:0 is a measured frame rather than a guess. The cere was tried first and rejected at x1.2: a
sliver of it shows even when the head is fully buried.
G.time is pinned in this vantage. The grass shader sways on uTime, so it reshot at 0.9949 until
time was frozen, then 0.9998 - filed as TODO 30, because the same residual is on every grass frame.

## FULL RE-PIN 2026-09-03 (build 8232590523658dfc3f5a1fe59a916de0 — GAME FILE UNCHANGED)
THE DETERMINISTIC RIG, TODO 30 + 67. The game did not change; capture.mjs did. QUIET now pins
G.time=12.0 every frame and empties the popup feed every frame, so the grass, the tussock sway, the
camp fire, a dozen idle animations and the startGame caption stop depending on how many animation
frames the 900ms settle got through. 26 of 28 vantages re-pinned on this rig.
TWO ARE DELIBERATELY NOT RE-PINNED and stay flagged: 07_jam (TODO 60) and 17_flight (TODO 57), the
two known subject drifts held open for Eric judgement. They read 18171 and 10142 px from their
baselines and boxdiff 0.9426 and 0.6359. That is a re-pin that has not happened, not churn, and
retiring it by pinning would be exactly the law-12 trap from the other end.
WHAT IT BOUGHT, ten runs per vantage and forty-five pairwise distances each:
    06_skyline      8791 ->  184     the worst vantage in the set before tonight
    13_idle_preen   6932 ->  347     20_dead_rear   5489 ->   82
    10_skifield     5822 -> 1785     19_roof_follow 4168 ->   15
    01_carpark_wide 3996 ->  104     18_rear_close  3909 ->   14
    29_lodge_deck    229 ->    0     30_groomed_band 1597 ->   0
The full table with its provenance columns is in gauntlet/verify/pxdiff.mjs.
JUDGED BEFORE PINNING: Eric accepted the 13_idle_preen pose, which is the only frame in the sweep
where the BIRD changed rather than the landscape - a pinned clock freezes poses as well as grass, so
the preen is caught at a different moment of its cycle. Measured before pinning: the pose is now
reproducible (idleAct.t 1.5999, 1.6, 1.5999, 1.5999 over four runs, head rotation identical to five
decimals), so this pins a repeatable pose rather than one sample of a moving one. subjects reads 16
checked 0 missing across every moved frame - eleven photographs moved and not one bird was lost.
03_kea_plate IS THE CONTROL AND IT STILL IS, in the only way that survives being re-pinned. It
already pinned G.time locally, so the clock half of the patch is a no-op there - measured, its 3108
px of movement sits ENTIRELY in the top-centre caption strip, cells cx 5..10 cy 0, and nowhere else.
That is the cleanest evidence in the sweep that the two halves do what they claim: the clock moved
the vantages that did not pin it, and the caption moved everything.
AND TWO FRAMES WERE PINNED TWICE, WHICH IS THE PROCESS FINDING. 23_paddock_gate and 28_skifield_base
were first pinned from a sweep that turned out to be an OUTLIER: a fresh sweep read 1165 and 3581 px
from them, while 15 runs of those two vantages - 105 pairwise distances - churn 129 and 5. A sweep
can land in a state the next fifteen do not visit, and pinning from it mis-pins the vantage
silently. Both were re-pinned from the consensus run and verified. Filed as TODO 73.
VERIFIED ON A FRESH SWEEP, not on the one the pins came from: diff 28 compared 0 flagged, pxdiff 2
over band and both of them the held-open drifts, boxdiff 12 compared 2 changed and the same two,
subjects 16 checked 0 missing, gate CERTIFIED-SHIP, three selftests ALL PASS.

## FULL RE-PIN 2026-09-03 — THE REPLAT-B BASELINES (specimen dfbbb247aaadf0b6db06c2c38da31ee8)
Branch `replat-b`. REPLAT.md P1: the game is a Vite project on three 0.185.1 with a film camera.
Bundle `f087df18379a73a8c2ba4cbd91c77856`. All 28 vantages re-pinned, judged by Eric first —
"everything present, no breakage, reads as a working game."

**PIXEL PARITY WITH THE r128 BASELINES IS IMPOSSIBLE BY CONSTRUCTION. READ THIS BEFORE COMPARING
ANY FRAME ACROSS THE RE-PLATFORM.** Measured at boot in the browser, same seed 20260828, same
generator, the two stacks consume a DIFFERENT NUMBER OF Math.random draws building the same world:

        r128 (frozen single-file build)   10,570 draws
        r185 (ported bundle)              10,738 draws      +168

three's own internals take those 168, so the stream parts company partway through buildWorld and
every randomised placement AFTER that point lands somewhere else — grass, tussock, scatter, the
throw on every dropped prop. The world STRUCTURE is identical on both (402 scene children, 64
interactables, 21 props, 29 colliders, the same four named humans). This is exactly the property
rig.js has always recorded between node and the browser — "one seed and two reproducible worlds,
not one world" — now true across three versions as well.

No seed, no lighting compensation and no capture setting closes that gap. The pre-port baselines
are therefore NOT a target the ported build can be steered back onto, and any drift measured
against them is uninterpretable. They are history from here.

**THE ACCEPTANCE CRITERION FROM HERE IS WORLD-STRUCTURE INVARIANTS PLUS THE NINE BATTERIES.** SSIM
against a baseline answers "did this frame change since the last pin", which is still the tripwire
of record WITHIN this stack. It cannot answer "is this the same game" across a renderer change, and
it was never asked to. What carries that claim instead:
  - the nine batteries, ALL PASS, ~500 assertions against the ported logic
  - the structure counts above, identical on both stacks under the one gauntlet seed
  - subjects.mjs for presence, boxdiff.mjs for the subject box, pxdiff.mjs for churn
A future re-platform piece that moves the renderer again should expect every baseline to move and
should re-pin deliberately, exactly as this one did, rather than hunting a diff it cannot win.

**HOW THE GROUND WAS ESTABLISHED, because 26 of 28 flagged on the first ported pass and something
had to say whether the port had moved or the machine had.** `gauntlet/verify/frozen.mjs` reshoots
the FROZEN r128 build through the pre-port path — it checks the pre-port capture rig out of git
verbatim rather than copying its staging table, so the staging is always the staging that pinned
the old set. Against the old baselines it read **0.99998** and **1.00000**. The machine, the GPU
and the rig were never the variable. Keep that tool through P2-P6.

**VERIFIED ON A FRESH SWEEP, not on the sweep the pins came from** (the TODO 73 protocol, and the
reason both mis-pins last session were caught):
    diff      28 compared, 0 flagged, worst 0.9991
    pxdiff    28 compared, 0 over band, 0 over churn (loudest 437 px, 12_seal_midpeel)
    boxdiff   12 subjects compared, 0 changed, worst 0.9971
    subjects  16 checked, 1 missing — see below, deliberately red
    gate      CERTIFIED-SHIP
NOTE: the per-vantage churn bands in pxdiff.mjs were calibrated on the r128 renderer and were NOT
recalibrated here. They held with room to spare on the new stack, so the ported renderer is at
least as deterministic as the one they were cut from. Left alone rather than re-fitted.

**ONE CHECK IS RED ON PURPOSE AND WAS NOT PINNED GREEN.** subjects.mjs reads 07_jam carblue at
**2950 against a floor of 3000** — 98% of a floor calibrated in r128 pixel counts, while the frame
plainly carries four blue cars, the cone and the bird. EVERY subject floor is in that position;
07_jam is simply the first to surface because it sat closest to its floor. Filed as TODO 74. No
floor was lowered to clear it: a floor moved to get green is that check deleted.

**NOT IN THE SET, AND STILL NOT:** 26_tour_brochure and 27_travel_card shoot every pass but have
never been pinned, so diff.mjs cannot see them. That gap predates the re-platform and is unchanged
by it; adding them is a new-vantage decision for Eric, not a side effect of a re-pin.

---

# RE-PIN 2026-09-03 (session 15b) — THE P2 BASELINES, PINNED FROM CONSENSUS

Eric judged the P2 set and accepted it. 28 vantages re-pinned on specimen
`6a6aac54d7a3d3dff61de5f634052082`, bundle `372f1b98408a424e2a621b0d7f048d85`, gate
CERTIFIED-SHIP. Ratio variant B kept as locked — Eric's reasoning, recorded because it is a
judgement and not a measurement: variant C would chase contrast that the trailer gets from
**canopy and materials**, not from shadow darkness. TODO 76 (the unlit sky dome) is DEFERRED until
after P3/P4 on the grounds that it cannot be judged against a spike field.

## THE PINS CAME FROM A MEASURED CONSENSUS, NOT FROM THE SWEEP THAT WAS ON DISK

This is the first re-pin to implement TODO 73's actual fix rather than only its manual fallback.
Four independent sweeps were shot, each in its own process and its own directory, and every frame
was pinned from the **medoid**: the take whose total pixel distance to the same frame in the other
three runs is smallest.

**PER VANTAGE, NOT PER RUN, AND THAT MATTERED.** A sweep is thirty independent photographs, each in
its own browser process, so a run can be the outlier on one vantage and the consensus on another —
which is exactly what 23 and 28 did last session, out of a sweep that was fine everywhere else.
Provenance of the 28 pins: **run1 -> 7, run2 -> 12, run3 -> 4, run4 -> 5.**

**AND IT CAUGHT A BAD SWEEP THAT WOULD OTHERWISE HAVE BEEN PINNED.** run1 stands clear of the other
three on **12 of 28 vantages**, and on several of those the other three agree with each other
EXACTLY. The tell is unmistakable once the distances are laid out per run:

    14_player_view    sums [5061, 1687, 1687, 1687]   runs 2-4 are 0 px apart; run1 is 1687 away
    15_sign           sums [ 423,  141,  141,  141]   same shape
    19_roof_follow    sums [2240,  748,  748,  748]   same shape
    25_preen_follow   sums [3918, 1306, 1306, 1306]   same shape
    17_flight         sums [32068, 10735, 10799, 10730]
    09_colossal       sums [13014, 4349, 4351, 4350]

run1 was shot immediately after a stalled run was killed, while the machine was still settling, and
it also took two retakes. **Had this re-pin used the frames that happened to be in
gauntlet/capture — effectively one sweep — it would have pinned run1's state on roughly fifteen
vantages.** That is the TODO 73 failure, avoided by measurement rather than by luck. run1 was still
used for the 7 vantages where it AGREES with the other three (its median distance there is 0-33 px);
a run is not disqualified wholesale, it is disqualified per frame.

**28_skifield_base's OUTLIER WAS run3, NOT run1** — sums [4682, 953, 7301, 4006]. Different run,
same hazard, and the second independent confirmation this session that the outlier is a property of
a (run, vantage) pair.

## VERIFIED ON A FRESH FIFTH SWEEP, NOT ON THE SWEEPS THE PINS CAME FROM

    diff      28 compared, 0 flagged, worst 0.9997
    pxdiff    28 compared, 0 over band, 0 over churn (loudest 123 px, 13_idle_preen)
    boxdiff   12 subjects compared, 0 changed, worst 0.9990
    subjects  16 checked, 2 missing — deliberately red, see below
    gate      CERTIFIED-SHIP
    stability 4 vantages x 4 takes, 0 unstable (worst 0.9981)

## THREE VANTAGES ARE NOW LESS REPRODUCIBLE THAN pxdiff RECORDS, AND THE BANDS WERE NOT RE-FIT

Measured among the CONSENSUS runs only (2-4, with the outlier run excluded so the number is churn
and not run1's badness):

    01_carpark_wide        churn  500   recorded ceiling  104
    04_flight_underwing    churn  291   recorded ceiling   69
    28_skifield_base       churn 3369   recorded ceiling 1291

The other 25 hold. **The bands were left exactly as they are.** Session 14b left them alone because
they held; leaving them alone now, when three do NOT hold, is the more deliberate choice: re-fitting
a churn ceiling inside a re-pin is a recalibration smuggled in as housekeeping, and FLAKES is clear
that a ceiling moved to accommodate today's number is that ceiling deleted. The verification sweep
above came in at 0 over band on all 28 — but ONE sweep landing inside a ceiling does not prove the
ceiling is right, and it should not be read as retiring this finding. A real recalibration wants
`crossrun` with RUNS=5 on a quiet machine and is its own piece.

## TWO SUBJECT CHECKS ARE RED ON PURPOSE AND WERE NOT PINNED GREEN

`25_preen_follow beak` 3 against a floor of 12, and `29_lodge_deck hutgreen` 4645 against 8000. No
floor and no window was touched. Both subjects were verified BY EYE to be plainly in frame. The
cause is TODO 75: P2 made shade COLOURED rather than grey, and every classifier window in
subjects.mjs was cut on frames where shade was neutral — the lodge's green rotates out of its HUE
band, and the beak's `dark AND grey` conjunction is empty because the mean saturation of its dark
pixels went 0.154 -> 0.569. **07_jam carblue, TODO 74's standing red, fixed itself on the same
mechanism: 2950 -> 10655 against an untouched floor of 3000.** Both remaining reds fail
conservatively — they under-report presence and so still cannot pass a frame whose subject is gone.

## THE PHOTOGRAPHER HAD AN UNBOUNDED HANG, AND IT IS FIXED

Three stalls in one session — 600s, 8m20s, and 25 MINUTES with the node process at 0.0% CPU — plus
three more during these sweeps. `shot()` had no timeout, so a browser that stopped answering stopped
the pass forever, and `shotR`'s three retakes could never fire because a hang raises no exception.
`SHOT_MS` (default 90s, far above a healthy ~6s shot) now turns a stall into a retake. In the same
breath: `await browser.close()` sat on the SUCCESS PATH ONLY, so every failed shot leaked a headless
Chrome — **124 of them were counted mid-session**, and their CPU contention is what made the first
stall look like a machine problem instead of a missing timeout. It is a try/finally now, with a
SIGKILL fallback for a browser that will not close cleanly. Proven both ways: `SHOT_MS=1` gives three
retakes, a GAVE UP that says why, and zero orphans.

## NOT IN THE SET, AND STILL NOT

26_tour_brochure and 27_travel_card shoot every pass and have still never been pinned, so diff.mjs
cannot see them. Unchanged by this re-pin and flagged for the third time: adding a vantage is a
new-vantage decision for Eric, not a side effect of a re-pin.
