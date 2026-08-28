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
