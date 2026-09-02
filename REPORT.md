# REPORT — overnight session 11, 2026-09-02

Stop condition: **6 pieces certified**. Your order was 39 first, additive only, no graduation — then
the numbered queue — and that is what happened. Final build **8232590523658dfc3f5a1fe59a916de0**,
gate CERTIFIED-SHIP, working tree clean, **0 of 25 pinned vantages flagged**, three new vantages shot,
measured and deliberately left unpinned.

**THE TOUR IS REACHABLE. A PLAYER CAN GO TO THE SKI FIELD AND FIND ITS OWN LIST OF JOBS THERE.** 37
built the brochure, 38 built the flyover, and for two sessions neither could be triggered by anybody.
Tonight: press **M** with six stars, click **GO** on THE CLUB SKI FIELD, and the flyover carries you
to a club field with a rope tow, a day lodge, three racks of somebody else's gear, a groomed band and
sixteen drifts banked against the buildings — where **TAB** shows THE ROPE TOW ☆☆☆ and eight jobs
about a mountain instead of eight pages about a carpark. Driven end to end in a real browser by
`node gauntlet/verify/journey.mjs`, which no longer injects a stand-in because there is a real map to
drive into.

## Shipped

| # | piece | md5 | one line |
|---|-------|-----|----------|
| 39 | skifield-biome | `aff1fa389a8e8ed138299474e77dc028` | the second map, additive only — and three globals that only looked like constants |
| 40 | skifield-missions | `1ba30ea41fe5df6e624f3919ad4cfad9` | the to-do list belongs to the map; eight jobs, a finale, a coop row |
| 62 | build-handles-swept | `789c9056e7c0e0d96007888e4aa22389` | twenty-one handles a build left pointing at a discarded scene |
| 63 | props-rest-on-rails | `b541758aae2631001ea2a397106fbffc` | twelve of twenty-two props were on the ground in three seconds |
| 65 | peak-chaos-is-alive | `9dfe7f3d147d65b4dc639df8775ab575` | PEAK 0 was not modesty, it was a dead read, for every player, always |
| 66 | the-footer-is-a-clock | `8232590523658dfc3f5a1fe59a916de0` | and the footer only told you about it when a mission landed |

Plus one commit that is not a piece: the **stability record** for the three new vantages, written into
`capture.mjs` beside their staging.

## Three things I need you to decide

1. **The graduation is still yours, and it is now filed as its own piece (39b).** The carpark ski
   corner and its five missions still live in the carpark. `propAt` keeps a deliberate `rnd` draw per
   prop precisely so the country does not move, so deleting five props reshuffles grass, snow, tussock
   and beech across all 25 baselines — and it takes five missions and a star page out of a live save.
   **My recommendation: do it AFTER 40b**, so the missions graduate INTO a map that already has verbs
   of its own rather than being deleted from one map and reinvented in another.
2. **Three first pins to judge, and reproducibility is no longer part of the question.** 28, 29 and 30
   were measured before anybody pins them — three sweeps of five takes plus a fourth at the shipped
   build, worst take-to-take 0.9990 against a 0.995 bar, where your twitchy carpark set reads 0.9960
   on the same machine tonight. They are pinnable. What is left is the look: the mountain ring is the
   carpark's own construction with ski-field radii (deliberately NOT a new silhouette language, which
   is on your blocked list), and the skis now stand upright in the racks.
3. **`10_skifield` is RE-PINNED and it is the one pin I made tonight.** The skis and poles are on the
   rack instead of lying in the tussock, which read 0.9909 — under the 0.965 threshold, so it would
   have sat in the set as a permanent 1% drift, which is exactly the law-12 trap. Eyeball the pair and
   revert the pin if you disagree with the change rather than with the pinning.

## Parked

- **39b skifield-graduation** — filed, not attempted. Judged, per the brief and your order.
- **40b skifield-signature-acts** — filed: the tray-slide as a new chaos verb, the tow ride, the deck
  lunch raids (which need a cast and food props, so they land on top of piece 21), and the buried
  lunchbox digs. One piece each. None of them needs a diorama change — 39 built the furniture they all
  want.
- **61 subject-drift coverage** — not run, per your order.
- **60 07_jam** — still your judgement. `boxdiff` reports it unchanged at 0.9580 tonight, and 17 at
  0.6389, both exactly as session 10 left them.
- **56 bird-shadow-quality** — still on your blocked art list. Untouched.
- **64 the beanie rests on a head** — found by 63 and filed with the design question: a prop that
  RIDES a thing that moves is not a prop that rests on a thing that does not.
- **35 the night auto-driver** — the peak half is fixed; the night half is still yours, and today's
  behaviour is now pinned by an assertion that goes red the day you take option (a). That is deliberate.
- **Nothing failed.** No piece burned three rounds; no assertion was weakened to pass. Where an old
  assertion had to change, it got MORE precise — the details are in the log and in the two entries
  below.

## Frames to eyeball

    gauntlet/capture/28_skifield_base.png    the bottom station, the wheel, drifts on the shed, and a
                                            bird at the rack with GRAB SKI GOGGLES up
    gauntlet/capture/29_lodge_deck.png       the day lodge, the deck, three skis standing in the rack
    gauntlet/capture/30_groomed_band.png     up the corduroy with the tow line running away
    gauntlet/capture/10_skifield.png         RE-PINNED — the carpark rack, holding its skis at last
    gauntlet/capture/probe_todo_skifield.png the to-do list on the mountain, which is piece 40 in one
                                             picture

Two things to *do* rather than look at: press **M** in a run with six stars and click **GO**; then on
the mountain press **TAB** and watch the footer clock tick while you read it.

## What the night cost me, and what it bought you

**THE SAME BUG, FOUR LAYERS DEEP, AND EVERY LAYER HID THE ONE BELOW IT.** TODO 58 moved a hint into
the thing that builds it. Tonight the same shape came back three more times, each one a live throw or
a visible lie on the second map: the **cast** (startGame read `G.ladder` with no guard — a fresh load
into a map with no hut died before the run started, in every mode), the **nest site**, the **snow
envelope**, and — found by a soak test rather than a brief — **the road**: `spawnTraffic` had the
carpark lane numbers written into it, so thirty seconds up the mountain put **seven hatchbacks across
the snow at z 34**, driving through a road that is not there.

**AND THE REASON IT COULD HIDE FOR TWO SESSIONS IS TODO 62, WHICH THE 39 SABOTAGE SWEEP FOUND BY
ACCIDENT.** A stale `G.ladder` made a hutless boot look perfectly safe in every battery, because Dave
found the LAST map's ladder and climbed that. The transcript worth keeping: with `G.towWheel` deleted
from the ski field builder, the battery reported the wheel at **-37.9,-40 from inside the ski field** —
the carpark one, still spun by update every frame, still able to answer a proximity detector at
coordinates in a country that was not loaded. Twenty-one handles, three lists and six latches now come
off the board with the world.

**THE BATTERY HAD THREE SECTIONS THAT ENCODED THERE IS ONE MAP, and one of them was dangerous.** The
tour section's `finally` deleted `TABLE[1]` by index — the stub while the ski field was hypothetical,
and as of piece 39 that line would have deleted the REAL ski field out of the registry for every
section after it. The chassis used `skifield` as its unregistered-id case, which would have quietly
become a test that booting the ski field lands in the ski field. Both re-aimed at real maps.

**A PROP NAME IS A DETECTOR IN THIS ENGINE.** Anything called `boot` scores the carpark's ONE BOOT,
NEVER RECOVERED the moment it is carried 22 metres from home, and two of them complete `b_boot2`. The
ski field's is called a **ski boot** for that reason, and the battery now holds every mission id on
every prop to being one the map it stands on declares.

**AND TWO ASSERTIONS THAT WERE TRUE FOR THE WRONG REASON.** Piece 63 put three rails into the snow
band, and the snow section's claim — *a disc centred on any slender upright stays put* — was true of
tree trunks in the open and quietly assumed no other kind of slender upright could exist. Two of the
new rails stand within arm's reach of a building. The claim is split into the two things it was
conflating. The same section filtered the band with hand-picked constants (-53, -17) that were
*generous* around SNOWFIELD, and generous was wrong the moment a slender upright landed at z -17: the
clothesline sits inside that window and outside the real envelope, so a disc centred on it starts
off-map, slides to get on-map, and read as a trunk that failed to hold. It reads `X.SNOWFIELD` now.
That is FLAKES law 10 twice in one piece.

**THE THING I AM LEAST COMFORTABLE WITH, said plainly:** piece 63 raised the skis onto the rack and
broke `s_binding` and the whole of piece 18's fix-verb section, because `interact()` measures from the
beak — y plus 0.4 — and a ski at rack height sat **0.395** from the beak against the CHEW THE BINDING
tear at **0.410**. Somebody else's test found my regression, I measured it rather than guessing, and
half a ski width each way fixed it. But it is a reminder that this file's interaction chooser is a
nearest-thing race and every prop I place on a surface joins that race.

**Thirty-six sabotages across the six pieces, all caught, and two of them were my own broken
sabotages** — a no-op edit that reported zero findings and was NOT the test being thin (law 14's tell,
met from the other side), and a `find(...&&!c.solid)` that let the property under test decide whether
the assertion ran at all.

## Suggested next three picks

1. **40b, starting with the tray-slide** — the signature act of the whole map and the one thing the
   ski field is shaped around. It is a new chaos verb and the feel is yours, so my recommendation is to
   build it with the feel flagged and a frame, the way 38 was built: the piste is a 20x74 band at y 0.1
   with no collider at all, and the roof luge already proves the mechanic exists.
2. **39b, once 40b has landed** — with the full re-pin diff in front of you, in daylight.
3. **64, the beanie** — small, self-contained, and it needs your design answer first: does the beanie
   ride his head until it is stolen, or does a wearer carry a rest-on-me anchor that any prop can sit
   in? I would take the second one, because the deck tables in 29 want the same thing for a lunchbox.

One process note, and it is the same one session 10 left: `boxdiff.mjs` still belongs in the per-piece
protocol beside `diff.mjs` at step 6 of OVERNIGHT.md. I ran it by hand again tonight.
