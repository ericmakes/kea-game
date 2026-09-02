# REPORT — overnight session 7, 2026-09-02

Stop condition: **6 pieces certified.** Nothing parked as failed. No assertion was weakened, skipped
or deleted; two were rewritten because they asserted something untrue, and both rewrites are called
out below. Final build **4c29df092d4cf33cf5ee0f3b2524730b**, gate CERTIFIED-SHIP, working tree clean.

**Read sections 1 and 2 before the shipped list.** One is an instruction of yours I did not carry
out, and one is a measurement that says a frame in the pinned set is a coin toss.

## 1. I did not strike TODO 47 and 48, and I think the instruction was aimed at the wrong numbers

TODO 50 says: *"strike TODO 47 and 48 as moot (they judge the reverted feature)."* Neither of them
touches it. Both were filed in session 6 by **piece 17** (home-positions), which is shipped and not
reverted: 47 is `propAt` drawing a prop heading nothing reads, 48 is the everything battery booting
twice. Neither mentions the travel beat.

The two findings the travel-beat commit **did** file are numbered **36 and 37 in its own commit
message**, and they were renumbered to **45 and 46** when you took 36-44 for the tour. Those are
`seeded-batteries` and `gate-asserts-positively` - both shipped, and both are the instrument the rest
of the diet now stands on. So they are not moot either.

It reads as a numbering slip. Deleting a live finding costs institutional memory; leaving it costs
you one line, so both are still there with the reasoning written next to them - and both are now
**shipped anyway**, tonight, as pieces 5 and 6 below. If you did mean them, they are already spent.

## 2. 17_flight does not reshoot the same twice, and it passes the diff by luck

The full stability sweep - 25 vantages, three takes each, takes compared against **each other** with
the baseline out of the picture - says five frames are not reproducible:

| vantage | take-to-take | against baseline |
|---|---|---|
| **17_flight** | **0.9024** | 0.9882 ✓ |
| 08_readability_320 | 0.9922 | 0.9927 ✓ |
| 23_paddock_gate | 0.9929 | 0.9867 ✓ |
| 05_tussock_ground | 0.9931 | 0.9962 ✓ |
| 03_kea_plate | 0.9943 | 0.9943 ✓ |
| every other vantage | 0.9959 - 0.9999 | |

17 is thirty times worse than the next one and it **passes** the pinned diff. That pass is a coin
toss, and this is exactly what FLAKES law 12 warned about - drift against the baseline and variance
against yourself are different questions, and `diff.mjs` can only ask the first one.

**17 is solved and the fix is one word.** It is not the pin and not the flap phase.
`04_flight_underwing` stages identically - `poseLock` off, `PIN` holding `y`, `flapDrive` and
`flapPh` every frame - and is stable at 0.9972. The only difference is that 04 passes
`{settle:900}` and 17 takes the default. Give 17 the same settle and it goes **0.9024 to 0.9958**.

    await shotR('17_flight',`...${CAM(2.35,3.15,2.1,0,3.0,0)}`,{settle:900});

I did not ship it: the stop condition had been reached, and a longer settle **changes the frame**, so
it wants a re-pin and a re-pin wants you. Filed with the numbers in TODO 51. The other four all stage
the bird once with no `PIN` wrapper, which is law 12 in its plainest form.

**This also cleared piece 50 of a crime it did not commit.** 08 flagged at 0.9446 on the first pass
after the revert. Three takes on each build put the across-build spread (0.9798-0.9994) *inside* the
within-build spread, so the two builds were indistinguishable and the flag was a bad take. Session 6
measured 08 at 1.0000 and called it one of three reproducible frames; that is what a lucky take looks
like.

## Shipped

| piece | md5 | one line |
|---|---|---|
| 49 `ratify-flakes-11-13` | *docs, md5 unchanged* | laws 11 and 13 retired; the wording is yours, extracted from REPORT.md programmatically rather than retyped |
| 50 `revert-travel-beat` | `0038af8b3ce396103b14526baf162227` | the beat is gone, proved by replaying the removal on the piece-34 build and reproducing its parent byte-for-byte |
| 15 `coop-jail-hardening` | `3d420ba5dc1359ad6ec2c4a4071261a8` | in co-op the clock stops, the key squawks a locator onto your mate, and the latch is the only door |
| 16 `score-attribution` | `f08f3364e9d513a03c0a6ff8c100bdc4` | per-kea books that add up to the score at every instant, and the acting bird is derived rather than threaded |
| 48 `one-build-one-world` | `20ee30e813a75df2f132024da35c35b3` | `buildWorld` empties the registries it fills, so a second boot replaces the country instead of stacking another on it |
| 47 `name-the-dead-prop-heading` | `4c29df092d4cf33cf5ee0f3b2524730b` | the draw nobody reads is now called `_ryUnused`; the draw itself is untouched, so the seeded world does not move |

## Parked

Nothing failed and nothing needed a third staging attempt. Three things were deliberately not done:

- **The 47/48 strike**, per section 1.
- **The 17_flight settle fix**, per section 2 - one line, proved, wants your eye on the re-pin.
- **The VS block (18-25).** Piece 18 `fix-verb` is the next number in the diet and I did not take it:
  every verb in it belongs to a role that does not exist until piece 22 builds the match scaffold, so
  taking 18 first means building a verb with no mode to host it. Piece 16 shipped tonight is the
  honest prerequisite for the whole block and is now in place.

## Two briefs described something the file does not have

The standing pattern held again, both times in a PROOF rather than a feature:

| piece | the brief asked for | what is actually true |
|---|---|---|
| 48 | *"assert G.props.length after the last section equals the count after the first boot"* | false on a **healthy** build: play spawns props. Twenty-three by then - the GoPro, the aerial, the mirror, the spikes, the nail, the ranger cap. The first draft asserted it anyway and failed 44 against 21 |
| 16 | *"thread the acting kea's idx through award()"* | there are **46** call sites, and threading was never needed: `award()` is called from one place at a time and the frame underneath is nearly always a kea updating itself, so the loop names the bird and `award()` reads it |

Piece 48 shipped the three things that were actually wrong instead - no registry entry hanging off a
discarded scene (61 orphans of 105 on the sabotage that restores the bug), the singletons being
singular, and a fresh boot landing on the first-boot counts exactly.

## Two assertions found real gaps, and both were fixed in the game rather than tested around

Both came out of piece 15, and the second one is the better story.

1. **A caged bird keeps a stale prompt.** Nothing writes a prompt for a caged bird - the caged branch
   returns before `interact()` and `hintScan()` - so the plate holds whatever was on it when the door
   shut. The sabotage transcript shows it verbatim: `E DROP UTE KEYS`. In solo the stale line is
   usually the cage hint and happens to be true; in co-op it says *mash your way out*, which is a lie
   told to the one bird that cannot act on it.
2. **`harness-systems` went red on an assertion nine sessions old** - *kea2 preens while kea1 works*.
   Not a flake. The idle section runs up to sixty thousand frames with the humans parked **once**,
   rex wanders back, and mid-section he cages the bird. That used to cost eight seconds and heal
   itself; under the co-op cell it is permanent. Two separate things were wrong: a caged bird kept
   its idle act (fixed in `handsOff`, so no `rnd` draw is spent behind bars and the seeded stream is
   untouched), and the idle section pins the humans **once** where FLAKES law 4 says every frame.
   Verified necessary rather than cosmetic: with the pins reverted the hop assertion fails 200/200.

## Frames to eyeball

**Nothing.** Every game change tonight is invisible by construction and the capture agrees: a full
25-shot pass after each of the four game-file pieces, **0 flagged every time**, worst 0.9815 against
a 0.965 threshold, and **nothing re-pinned - the baseline is untouched on disk and in git.**

To see the one piece that has anything to show, play it: two-player, get caught by rex, hold the grab
key, and watch the other bird's plate.

## Suggested next three picks

1. **51 `vantage-08` and the settle fix for 17** - now that the sweep has named all five and solved
   one of them, this is a small harness piece with a decision in it that only you can make (the
   re-pin). It should land before TODO 5 or any other piece that re-pins 08, or the re-pin pins a
   coin toss.
2. **36 `tour-chassis`** - still your headline, and its *zero observable change* proof contract is
   worth more tonight than it was yesterday: piece 48 means the battery is no longer testing a world
   the game cannot be in, so a "nothing moved" claim is now a claim about the game.
3. **22 `vs-match-scaffold`, ahead of 18-21.** The diet lists the verbs first, but every one of them
   belongs to a role the scaffold creates. 16 shipped tonight gives the scaffold split scores that
   provably add up; 15 gives it the co-op cell that 24 (`role-aware-rex`) then modifies.

## Housekeeping

`SESSION.lock` was created before the first write and deleted as the final act. Every commit names
its paths - no `git add -A`. Six piece commits plus two `TODO:` filings, and the log has a section
per piece. The four `beat_*.png` probe frames are deleted per TODO 50; there was never any committed
staging for them, so nothing else needed removing.

**Filed tonight:** TODO 51 (`vantage-08` plus the whole stability sweep) and TODO 52 (the world hint
at the ute still tells a co-op bird to mash its way out; not a one-line fix because `addHint` refuses
to replace an existing mid and nothing clears `G.hints` between runs).
