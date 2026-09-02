# REPORT — overnight session 10, 2026-09-02

Stop condition: **6 pieces certified**. Your order was 54, 55, then 37, then the numbered queue, and
that is what happened — with one substitution I want you to see first. Final build
**5c955bb4e7741eaea477606db3d228ac**, gate CERTIFIED-SHIP, working tree clean, **0 of 25 pinned
vantages flagged**, two new vantages shot and deliberately left unpinned.

**THE TOUR IS REAL NOW, AND IT HAS NOWHERE TO GO.** 37 built the save schema and the brochure, 38
built the travel beats, and both work end to end — but with one biome registered there is nothing to
travel to, so **no player can trigger either of them yet**. 39 (skifield-biome) is the gate on all of
it, and it is the top recommendation below. That is also why I took **58 out of order, ahead of 39**:
`startGame` reached into `G.uteG.localToWorld` with no guard, so the first real second map could not
have booted at all. It boots now — a biome with *nothing* in it starts without throwing, and that
assertion is standing.

## Shipped

| # | piece | md5 | one line |
|---|-------|-----|----------|
| 54 | flap-the-flight-vantage | harness-side, `df4ae7c6…` unchanged | 17_flight was photographing a glide; one press line, and the brief own proof was a tautology |
| 55 | cage-hint-alive | `4c7fd986c7a3762b4e556a62ae9942e2` | option (b) — the mission gate gets an explicit opt-out, and the typo safety is proved intact |
| 37 | tour-save-and-map | `c1fcfbc6df3b2939d240f8112bb8b38a` | save schema v3, a slot per map, v2 retro-granted to the carpark, and the DOC brochure |
| 38 | tour-travel | `fdc032709319f9a207d0492077b41da2` | leaving and arriving, skippable, camera restored, driven end to end in a real browser |
| 58 | hint-belongs-to-its-map | `5c955bb4e7741eaea477606db3d228ac` | an owner rather than a guard, and hints joined the world registries |
| 57 | subject-drift-instrument | harness-side, unchanged | boxdiff.mjs — the question that fell between diff.mjs and subjects.mjs |

Plus two commits that are not pieces: **FLAKES laws 14 and 15** (below), and a one-line `.gitignore`
for `SESSION.lock`, which `git add -A` swept into a piece commit before the amend took it back out.

## Three things I need you to decide

1. **17_flight is a different photograph.** The wings went from the glide spread to mid-downstroke.
   Not re-pinned. The brief asks the question out loud and it is yours: *should 17 and 04 read
   differently at all, given 04 is the underwing shot?*
2. **07_jam has drifted in the subject box and nobody ever saw it** (TODO 60). 0.9580 in the box
   against 0.9904 on the frame; three reshoots agree to five decimal places, so it is reproducible
   and has simply moved since it was pinned at `59a8493`. The resting wings sit lower and tucked. Look
   at the pair, then either re-pin 07 or file the pose as a bug.
3. **The graduation in 39 forces a whole-set re-pin, and only you can ratify that.** `propAt` keeps a
   deliberate `rnd` draw per prop (TODO 47, `_ryUnused`) *precisely so the country does not move* — so
   deleting the carpark ski corner shifts every later draw and reshuffles grass, snow, tussock and
   beech across all 25 baselines. It also takes five missions and a whole star page out of a live
   save. That is not an overnight call, which is why 39 is a recommendation and not a shipped piece.

## Parked

- **39 skifield-biome** — not attempted. Its buildable half (the diorama) is clean and additive; its
  GRADUATION half is the re-pin question above. See the recommendation below for how I would split it.
- **56 bird-shadow-quality** — still collides with your own blocked art list (blob shadows). Untouched,
  as last session left it.
- **Nothing failed.** No piece burned three rounds; no assertion was weakened to pass.

## Frames to eyeball

    gauntlet/capture/26_tour_brochure.png      the brochure, four pin states on one sheet
    gauntlet/capture/27_travel_card.png        the arrival beat frozen halfway, card up
    gauntlet/capture/boxdrift_07_jam.png       TODO 60 — fresh left, pinned right. the wings
    gauntlet/capture/17_flight.png  vs  gauntlet/capture/baseline/17_flight.png

Two things to *do* rather than look at: press **M** at the title (and again mid-run — the map is
reachable in play and pauses the world), and run `node gauntlet/verify/journey.mjs`, which drives a
whole journey through a stand-in ski field because no player can yet.

## What the night cost me, and what it bought you

**FLAKES law 14 — an assertion that reads state only present when the code works is a fuse.**
`ok(thing().field===x)` throws, the battery prints a stack trace and *no verdict*, and the sabotage
you were checking comes back with **zero findings** — which reads as a thin test and is not. Session 9
met this four times and logged it as a guard rule. I met it **four more times in one night**, in three
different pieces, and it cost four sabotages before I stopped believing my own tests were thin. It is
law now, with the idiom and the tell written down: *a sabotage that returns nothing means look for a
stack trace first.*

**FLAKES law 15 — any section that builds a world moves the seeded stream for every section after
it.** Piece 38 added two boots and a four-build-old assertion of mine failed: it asked for
`hypot <= BAND.off` while `botchWonk` draws x and z *independently*, so the corner of the band is
`off × √2`. It had been passing on the luck of which prop the block picked, and it was the only one of
four botch assertions written that way. Fixed to the convention (TODO 59).

**Two defects the frames caught that no assertion could.** The brochure heading and BACK button were
clipped at 960×540, because `.screen` centres its children inside `overflow:hidden`. And the to-do
list flash sat on top of the arrival card, covering half the name of the place. Both found by looking
at the two new vantages on their first shot, which is the argument for having shot them.

**And a bug I created and the battery caught within a minute.** Moving the cage hint into the ute
builder changed what the same line *meant*: `localToWorld` in r128 multiplies by `matrixWorld` and
does not compute it, and at build time nothing had — so the hint landed at its local offset, 1.1m
behind the world origin, and started teaching cage mechanics in the middle of the carpark.

## Suggested next three picks

1. **39 skifield-biome, split in two.** Ship the diorama first — rope tow, day lodge and deck, racks,
   groomed band, drifts banked against structures, its own anchor, its own boot battery, all new
   vantages first-pinned and flagged. It is purely additive and it makes 37 and 38 reachable for the
   first time. Then bring me the GRADUATION as its own piece with the full re-pin diff in front of
   you. One thing 39 will need that nothing has yet: **missions per biome** — `defineMissions` is
   still biome-blind, so today the ski field would show the carpark to-do list, which is the same
   class of lie 55 was sent to fix.
2. **60 and 61 together.** Judge 07 (one look at the pair), then measure subject boxes for 03, 13, 18
   and 20 with an eyeball — ten minutes, and *do not* automate the search; both traps are written into
   the boxdiff header. Then run `boxdiff.mjs` once over the whole set and find out how many other
   birds have quietly moved. Given 07 came back red on five vantages, I would bet on at least one more.
3. **40 skifield-missions**, once 39 has a map and a mission seam to hang them on.

One process note worth taking: `boxdiff.mjs` belongs in the per-piece protocol beside `diff.mjs` —
step 6 of OVERNIGHT.md — but that is your brief to edit, not mine.
