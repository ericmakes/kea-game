# REPORT — overnight session 2, 2026-08-31

Stop condition: **6 pieces certified.** Nothing parked, nothing red, no piece needed a third
staging attempt. Final build **347b4b936d00cd12f634f77177ce2f17**, gate CERTIFIED-SHIP, 24
vantages pinned at 0 flagged, new subject tripwire 6/6.

Worked the TODO diet in order, smallest first. Items 7, 8 and 9 remain, plus the 16 caravan/VS
pieces you appended mid-run (see Next).

## Shipped

| # | piece | md5 | one line |
|---|-------|-----|----------|
| 1 | night-tint-trees | `1472f58a` | Foliage and bark hand their day colour to a night registry; at nightT=1 lightness is day x 0.30 by construction. |
| 2 | glass-sky-gradient | `438f6b72` | Glazing ramps sky-blue at the head to near-white at the sill, 0.100 worst channel delta. Shipped as vertex colours, not a texture — see below. |
| 3 | score-popup-fanout | `0758d092` | Simultaneous popups fan across a 34px band with scale falloff and staggered fade, distinct by construction rather than by hash luck. |
| 4 | capture-staging-subjects | `0758d092` | Four showcase vantages had no subject in them. **Game file untouched** — md5 identical to piece 3. Adds `subjects.mjs`. |
| 5 | hud-tab-reflow | `6b7a4d36` | The 320px TAB pill no longer lands on the prompt plate. Wrap is predicted in state; the DOM only reads the verdict. |
| 6 | preen-head-visibility | `347b4b93` | The preen reaches out to the shoulder instead of down under the wing, and the wing folds lower so it stops screening the head. |

## Parked
Nothing. No piece hit the 3-attempt rule.

## Two calls you may want to overrule

**Piece 2 deviated from the brief, on measured evidence.** You asked for a `detailTex` kind
`'glass'` in MAPKIND. I measured rbox first and that route cannot work: rbox is an
ExtrudeGeometry, so its UVs are in *model units* (v spans only -0.275..0.275 on a window band, so
a 0..1 gradient shows a slice of itself), and world-y lands on V for cap faces but on **U** for
side walls — which is where the caravan side windows face. No single texture is vertical on both.
`DIRECTION.md` line 34 already says it. RepeatWrapping would have put a hard seam across every
pane; ClampToEdge would have read flat, which is the original complaint. Shipped vertex colours
instead: exact per pane, no canvas, and the proof is a first-class node assertion rather than a
stub-executed painter. **If you want the texture route anyway, say so and I will do it as a
per-pane material with tuned repeat/offset — it costs 8 materials and still cannot fix the side
walls.**

**Piece 6's briefed contract was unsatisfiable, so I calibrated it.** "Head y at or above the
wing-top line" cannot hold in this rig: the head pivot is *never* above the wing-bbox top in any
pose, including the poseLock pose the whole set is judged on (0.033 under). So `PREEN.eps` is
derived from the resting pose — the preen may not carry the head lower than the bird carries it
standing still. It now carries it slightly higher (0.0459 vs 0.0481). Derived before the new pose
existed, and the battery goes red on the old constants.

## Frames to eyeball

Highest value first:

- `gauntlet/capture/04_flight_underwing.png` — was **empty sky**. Now two scarlet underwing bands under spread wings.
- `gauntlet/capture/07_jam.png` — was an **empty road**. Now a five-car queue, cone, and the bird on the centre line with the game's own "stand your ground" hint up.
- `gauntlet/capture/09_colossal.png` — the LV10 bird is in frame and reads colossal beside a car.
- `gauntlet/capture/17_flight.png` — was **no bird at all**. Now the flight hero shot.
- `gauntlet/capture/08_readability_320.png` — `RIP WIPER` is fully readable for the first time.
- `gauntlet/capture/21_night_camp.png` and `22_torch_beam.png` — canopies dark against the mountains instead of glowing daylight green.
- `gauntlet/capture/20_dead_rear.png` — the glazing ramp. Deliberately gentle; `GLASSTOP` is the one knob if you want it harder.
- `gauntlet/capture/13_idle_preen.png` — honest caveat: the gain is modest at this camera, and the complaint named the **follow** cam, which 13 is not.

## The finding that matters most

**Four showcase vantages had been shipping without their subject, at 0 flagged, for weeks.**
`diff.mjs` could never have caught it — a birdless frame is perfectly stable, and SSIM only asks
whether a frame *changed*. New `gauntlet/verify/subjects.mjs` is a presence detector; run it after
every capture pass, beside `diff.mjs`.

It nearly shipped broken in an instructive way: a plain hue-band "olive" counter measures the
**landscape**, not the bird. On the birdless baselines it scored 3939 olive pixels in the 07 box
against 1529 in the correctly staged frame — the tussock is gold and the grass is green, both
inside the window — so the test read green for the empty road and red for the jam. The shipped
classifier is derived from the kea palette, and every floor is a measured number with the
birdless count recorded beside it. Verified adversarially: it fails all 6 checks on the four
frames it replaced.

## Suggested next three picks

1. **TODO 8, `white-object-18`** — smallest thing left, and it is an identification job before it
   is a fix. Cheap, self-contained, and it clears a visible blemish in a pinned frame.
2. **TODO 10, `caravan-door-orientation`** — I confirmed this defect twice while eyeballing other
   pieces: the door pane stands off the side as a dark vertical fin in both 20 and 12. It is
   judge-required and it is the largest remaining *visible* error in the pinned set. Worth your
   review time more than anything else on the list.
3. **A follow-cam preen vantage** — piece 6 is certified against a metric, but the complaint that
   started it was about the follow camera, and no vantage stages the preen from behind and above.
   The set cannot currently judge the thing you actually objected to.

Held over from last session and still true: `buildGrass` colours blades with `Math.random`
rather than the seeded `rnd()`, so object-count changes tint the field very slightly. That is the
entire residual 0.977 tripwire noise. Moving it onto `rnd()` would take the tripwire to near-zero.

The 16 appended caravan/VS pieces (10-25) are a much larger body of work than one overnight run;
11-17 are mechanical and gate-friendly, 18-25 depend on the MODE CONSTANTS and want your
playtest fences respected. Suggest sequencing them after 8 and 10.
