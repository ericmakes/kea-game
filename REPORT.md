# REPORT — overnight session 6, 2026-09-02

Stop condition: **6 pieces certified.** Nothing parked as failed, no piece needed a third staging
attempt, and no assertion was weakened to pass anything. Final build
**e19fcd5a9ae90f754e36f26a64ef5509**, gate CERTIFIED-SHIP.

**Read the first three sections before the shipped list.** One of them is a collision with your own
commit, one retires two FLAKES laws, and one is a hole in the gate that has been open for nine
sessions.

## 1. I shipped piece 34 about twenty minutes before your commit told me not to

Your `af9111e` (South Island Tour) landed mid-session and says *"Piece 34 (chapter-travel-beat) is
SUPERSEDED by piece 38 - do not build 34 separately."* By the time that sentence existed in my tree,
34 was patched, proved, gated and committed. The only mid-session notice I received was the
`OVERNIGHT.md` half of your commit; nothing re-read `TODO.md`, so I did not see the tour at all until
I went to write my own findings into the same file and found your numbers 36-44 sitting on them.

**I have not reverted it, and the call is yours.** The reasoning is not sunk cost: piece 38's own
BINDING EVIDENCE paragraph asks for exactly the four things 34 implements, because it is quoting the
session-5 investigation that 34 was built from. What separates them is the KEY - 34 anchors per
chapter *area*, 38 anchors per *biome* - plus 38 wanting control state restored across a map load,
which cannot exist before the chassis (36) does. Re-keying the anchor table is a rename; the state
machine, the fresh-input skip, the arm delay and the pre-camLock blend all carry over unchanged.

    to throw it away:  git revert 1c096b4

My two findings were renumbered to **45** and **46**; you keep 36-44 including the reservations.
And I have changed my own habit: I now re-read `TODO.md` and `OVERNIGHT.md` before starting each
piece, not once at session start. Your `SESSION.lock` rule exists for the same reason and I took it.

## 2. FLAKES laws 11 and 13 can be retired. It was never the cold node.

Two sessions blamed *"a COLD or CONTENDED node process"* for red batteries that would not reproduce.
Both sightings recurred this session and both named themselves - `EVERYTHING: 12 driven, 1 failed:
can`, then `SYSTEMS: b_five fires at stash 5`. Instead of shrugging I measured the rate against
**build**, which is the question that actually distinguishes the theories:

| build | harness-systems.js |
|---|---|
| `ccd4782` (old, untouched) | **3 failures / 40 runs** |
| `49335b9` (mine) | **1 failure / 40 runs** |

Pre-existing, roughly 2-8 percent per battery per run, and *the failing assertion moves between
runs*. That last fact is what rules out the code. The cause was in plain sight: `RNGF` defaults to
`Math.random` and **not one battery had ever called `setSeed`**, so every battery built a different
country and threw every dropped prop differently. Every failure seen so far is a mission whose driver
must grab ONE named prop out of a randomly thrown pile. `capture.mjs` solved exactly this for the
frames back on 2026-08-28; the batteries never got the same treatment.

Fixed as piece 45. **Result: 0/40 on both offenders, and all nine batteries now produce
byte-identical output across eight consecutive runs.** Not "unlikely to flake" - unable to.

I did **not** edit `FLAKES.md`. It is described in `OVERNIGHT.md` as law, and rewriting two laws out
of it on the strength of one session is your call. Proposed replacement, if you want it:

> 11+13 (SUPERSEDED 2026-09-02). The unreproducible red battery was never the cold node. The
> batteries ran unseeded, so each run built a different country and threw props to different places;
> the drivers that grab one named prop out of a pile failed at a few percent. rig.js now seeds both
> the game rng and Math.random at capture.mjs's seed 20260828, and every battery is byte-identical
> run to run. A red battery now MEANS something. If one ever fails to reproduce again, suspect a new
> unseeded draw, not the machine - and check `harness-audit-pass2`, the one battery whose transcript
> once varied for a reason I could not attribute.

## 3. The gate has been an eight-battery gate for its whole life

My own adversarial sabotage crashed a battery and the gate printed **CERTIFIED-SHIP**. `gate.sh` kept
`tail -1` per battery and went red only on a *negative* match, so a stack trace - which matches
neither the tick nor `FINDINGS` - certified. Then it got worse: **`harness-smoke.js`, battery one of
nine, has never been visible to the gate.** It ends with a node `ExperimentalWarning` about
localStorage, emitted two lines *after* its verdict, so `tail -1` kept the warning and threw the
verdict away. It prints `FINDINGS` and exits 1 on failure and neither ever reached the check.
`fastgate` caught smoke by exit code all along, which is why this never bit - but the gate is the
ship criterion, and the evidence has been sitting in plain sight in every gate transcript in the log:
the first of the nine lines is a node warning, not a verdict.

Now every battery must print its own `ALL PASS` **and** exit zero, and the verdict count must equal
the battery count. New contract test `gauntlet/verify/gate-selftest.sh` drives seven cases; run
against the old gate restored from HEAD it reports exactly four findings - a throw, a silent battery,
a liar that prints ALL PASS then exits 1, and **a battery file that does not exist**.

## Shipped

| piece | md5 | one line |
|---|---|---|
| 34 `chapter-travel-beat` | `49335b92f810540fbe5e52cfb816929a` | page turn flies the camera to the new area, names it, comes home; superseded by your 38, see section 1 |
| 46 `gate-asserts-positively` | *harness-side, md5 unchanged* | the gate can now see a battery that dies, and battery one is in the gate for the first time |
| 45 `seeded-batteries` | *harness-side, md5 unchanged* | the law-11 intermittent, closed: 3/40 to 0/40, nine batteries byte-identical, zero assertions touched |
| 13 `style-star` | `071ced95438ec024e44cbb0f4c6c5d8f` | par is 1.5x what the page PAID you, learned per frame rather than tabulated |
| 14 `clean-getaway-star` | `c8ced0cf4a7afb6a3a2faa5f000a476a` | third pip: never caged while the page was open; escaping does not clear the record |
| 17 `home-positions` | `e19fcd5a9ae90f754e36f26a64ef5509` | every prop remembers the transform it was BUILT at, rotation included; foundation for 19/20/21 |

## Parked

Nothing failed. Two things were deliberately **not** touched:

- **TODO 35** (`G.chaos` read but never assigned). Your own note says the decision is yours, because
  pointing the test at `G.score` changes when night falls and that is a feel call. Left alone.
  One correction to that note: there are **two** reads, not one - the second is `G.chaosPeak` at the
  play-timer line, so the win screen's PEAK CHAOS figure is also permanently zero.
- **`FLAKES.md` laws 11 and 13**, per section 2 - superseded by measurement, but yours to rewrite.

## Two briefs described data the file does not have

The standing pattern from sessions 3 and 4 held again, in both cases where a *number* was assumed:

| piece | the brief asked for | what the file actually has |
|---|---|---|
| 13 `style-star` | par = 1.5 x the sum of the page missions' **points** | missions carry **no points field**. Every value lives inside the `award()` call in its own handler; scraping `done('id')` against the nearest `award(N)` pairs only **17 of 40** ids |
| 17 `home-positions` | record spawn **pos + rot** | position was already there and already load bearing. Rotation could not be read in the factory at all, because a build site rotates the skis on the line *after* `propAt` returns |

Both shipped the honest version: piece 13's page **learns** what it paid (award drops points into a
per-frame purse, a mission finishing in that frame claims it), which is the figure you asked for,
derived rather than transcribed - and it re-derives itself if any award value ever changes.

## Frames to eyeball

Only piece 34 has anything to look at. Four probe frames, shot in the real browser by turning a page
for real under the capture seed:

    gauntlet/capture/beat_hold.png    <- start here. Card reads THE CAMPSITE over the picnic spread
    gauntlet/capture/beat_out.png     <- mid-flight, leaving the carpark. Should read as a departure, not a cut
    gauntlet/capture/beat_back.png    <- on the way home
    gauntlet/capture/beat_after.png   <- beat over, follow cam restored

**Two things in `beat_hold.png` are yours to call, both fenced:**
1. The hold camera (`high:13`, `standoff:9`) reads more **map-view than flyover** from directly above
   the campsite. Lower and further back would feel more like flying.
2. The existing `PAGE TURNED / NOW: THE CAMPSITE` popup now says **the same thing as the card**, one
   line above it. I did not remove it - it is certified behaviour from an earlier piece - but the
   duplication is visible in the frame.

The other three game pieces cannot appear in a frame and I can say why mechanically rather than by
judgement: `capture.mjs` completes no mission and never touches `chapIdx`, so no page can turn in any
of the 25 vantages, no star popup can fire, `#travelcard` stays `display:none`, and piece 17 adds
fields without moving a mesh or spending an `rnd()` draw.

## The capture set confirms it: 25 vantages, 0 flagged

Ran a full 25-shot pass on the final build and diffed against the pinned baselines. **0 flagged,
worst 0.9901 against a 0.965 threshold**, and 08/09/15 read `1.0000`. Nothing re-pinned, baseline
untouched on disk and in git.

Then I went further, because sessions 3-5 established that SSIM cannot police a subtle wide change
(items 31 and 33) - a one-off changed-pixel count, pixels differing by more than 8 grey levels:

    09_colossal              0 px   max delta   0      <- perfect reproduction
    15_sign                  2 px   max delta  15
    08_readability_320      26 px   max delta  32
    everything else    1031-9315 px

**Those big numbers are item 33's cross-run churn, not my pieces**, and the comparison that says so is
item 33's own figures for the SAME build across two capture runs: 07 at 8919, 13 at 4182, 19 at 3349,
23 at 1184. Mine are 9315, 7828, 1031, 4957 - the same band. The frames item 33 identified as actually
reproducible are exactly the ones that came back clean here: 09 at zero pixels and 15 at two.

I have left the ffmpeg recipe and these readings in **item 31**, which is the piece that wants this
instrument built properly. One thing the readings suggest about its design: the warning band has to be
**per vantage**, not global. A threshold that tolerates 07 at nine thousand flags nothing useful, while
09 and 15 should scream at three figures.

## Suggested next three picks

1. **36 `tour-chassis`.** Your headline, and its proof contract - *zero observable change* - is now
   worth something for the first time, because piece 45 made the batteries reproducible and piece 46
   made the gate able to see a dead one. Doing it before 45 would have meant chasing ghosts.
2. **48 `harness-everything boots twice`** (new, filed tonight). `boot()` re-runs `buildWorld()`
   without clearing `G.props`/`G.inter`/`G.colliders`, so from the snow section onward the battery has
   **two of every prop, interactable and collider**. Nothing asserted today depends on a count, which
   is the only reason it has not bitten - but every count assertion written from here is silently
   wrong, and every section after that line tests a world the game cannot be in. Cheap, and it should
   land before the tour starts adding biome-shaped assertions.
3. **15 `coop-jail-hardening`** or **16 `score-attribution`**. 15 is self-contained and finishes the
   jail work pieces 11 and 14 started. 16 is the honest prerequisite for the whole VS block, but be
   warned: `award(base,label,pos)` does not know which bird acted, and threading an actor through 40+
   call sites is a bigger piece than its two lines of brief suggest. Worth re-scoping before you diet it.

Also filed tonight: **47** (`propAt` draws a rotation for every prop that nothing ever reads - do not
just delete the draw, it repins the world).

## Housekeeping

`SESSION.lock` was created the moment your rule appeared and deleted as my final act. Every commit
names its paths - no `git add -A` - and the one file of yours I found in the tree at session start
(`gauntlet/verify/sidebyside.mjs`, already committed in `308f536`) was never touched.
