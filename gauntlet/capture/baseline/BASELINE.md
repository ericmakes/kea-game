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
