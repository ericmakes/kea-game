# SKIFIELD_GRADUATION.md — the plan for TODO 39b

**EXECUTED 2026-09-21, in two pieces, on Eric's four rulings. This document is now the plan AND its
outcome: the plan text below is left exactly as it was written so it can be read against what
actually happened, and the section at the very bottom records where it was right and where it was
wrong.** The four decisions it asked for were taken on 2026-09-12:

1. **The four duplicates: retired**, and the carpark's WORDING kept wherever the two lines
   described the same job.
2. **Vantage 10: retired.**
3. **A new vantage on the migrated rack: yes** — `44_tow_rack`, first pin, flagged.
4. **The orphaned page: it carries** — a cleared THE SKI FIELD becomes THE ROPE TOW, by name.

---

Nothing in this document had been executed when it was written. Written 2026-09-11 on Eric's instruction: *"plan it and
STOP before executing — show me what migrates, what happens to live-save star pages, which carpark
vantages get re-staged or retired, and what the whole-set re-pin will cost. I want to approve the
plan before anything moves."*

TODO 39b in one sentence: the carpark's ski corner and its five missions move to the ski field,
carpark vantage 10 is re-staged or retired, and every baseline is re-judged.

---

## THE FINDING THAT CHANGES THE SHAPE OF THE PIECE

**Four of the five missions already exist on the hill.** TODO 39b says to do the graduation after
piece 40 "so the missions have a home to graduate INTO rather than being deleted from one map and
reinvented in another". Piece 40 reinvented them anyway. Read side by side:

| carpark, to graduate | the ski field's own list, shipped in piece 40 | |
|---|---|---|
| `s_ski` Relocate somebody's ski beyond the snowline | `k_ski` Leave somebody ski out on the groomed band | same act, better place |
| `s_pole` Make off with a ski pole | `k_poles` Redistribute all three ski poles | superset |
| `s_goggles` Help yourself to the ski goggles, and wear them | `k_goggles` Help yourself to the ski goggles, and wear them | **word-for-word identical** |
| `s_lift` Perch the spinning tow wheel | `k_wheel` Perch the spinning bull wheel | same act |
| `s_binding` Chew a binding, thoroughly | — | **the only orphan** |

So this is not a migration of five missions. It is **a retirement of four and a migration of one**,
and the four are retired because the hill already answers them better — `k_poles` wants all three,
`k_ski` wants the ski on the actual piste, `k_wheel` reads the wheel's own height instead of a
hard-coded 2.2.

**That is the first thing needing Eric's decision**, because the alternative readings are defensible:
keep the carpark's wording and drop the hill's, or keep both as different jobs on different maps.
The recommendation is to retire the four and migrate `s_binding` as a new `k_binding` on THE ROPE TOW
page, next to the rack that will now be up there.

---

## 1. WHAT MIGRATES

### The furniture — `src/game.mjs` around line 6071, the block commented "THE SKI FIELD (SW)"

| | what it is | where it goes |
|---|---|---|
| `sw_tow_shed` | a declared placement at `{x:-40,z:-40}` with a 3.4x2.6 box collider and three anchors | **retired.** The hill has `SKITOW` with its own engine shed, and `k_shed` is a mission about standing on it |
| the red tow wheel | `CylinderGeometry(0.9,0.9,0.16,14)` at `bx+2.1, 2.2, bz`, sets **`G.towWheel`** | **retired.** The hill sets the same global at line 6443 |
| the mast | one `cyl` at `bx+2.1` | retired with the wheel |
| the rack | a `box` rail plus two `cyl` legs, and a `railTop()` call whose return feeds five prop placements | **migrates.** The rack is what `s_binding` needs, and the hill has poles lying on snow with no rack at all |
| 2 skis, 2 poles, 1 goggles | five `propAt()` calls | **the props migrate; four of the five missions do not** — see above |
| `CHEW THE BINDING` | an `addTear` with `getPos` at `bx-0.7, 0.95, bz+1.95` | **migrates**, re-anchored to the new rack |

### The engine seams, which are the real work

1. **`s_lift`'s detector is biome-blind and hard-coded** (`src/game.mjs:11439`). It sits in the
   per-frame "quickie detectors" loop, reads `G.towWheel` — which **both maps set** — and tests
   `Math.abs(k.y-2.2)<0.75` against a wheel the hill puts at y 2.5. It is live on the ski field
   today and only harmless because `done()` guards an unknown id (`if(!m||m.done)return`). The
   moment `s_lift` is on the hill's list, perching the bull wheel credits it through the carpark's
   rule. **The detector must move into the mission's own `check()`**, which is the seam piece 40
   established. Same class as the `apex` throw TODO 40 records.
2. **`G.chapters` loses `A.ski`**, taking the carpark from eight pages to seven.
3. **`propAt` draws one `rnd()` per prop** — `_ryUnused:rnd(0,6)`, TODO 47 — so the block consumes
   **exactly five draws**. Counted rather than assumed: the block's own 25 lines contain no `rnd()`
   call at all, and `placeProp`, `railTop`, `addTear`, `box`, `cyl` and `mat` contain none either.
   Five `propAt` calls, one draw each. See the next section.

### THE DRAW-ORDER HAZARD, AND WHY IT IS NOT ACTUALLY A BLOCKER

TODO 39b names this as one of two reasons the piece is not an overnight job: deleting five props
shifts every later `rnd()` draw and "reshuffles grass, snow, tussock and beech across all 25
baselines".

**The precedent for not shifting them is already in the tree, twice.** TODO 47 kept a draw nothing
reads and renamed the field `_ryUnused` rather than deleting it. The cloud recipe does the same
thing in the other direction — "THE DRAWS ARE STILL ALL MADE… lobes past this limit simply do not
emit geometry". So:

```
keep the five propAt() calls exactly where they are in the source order,
and give the block a biome guard that suppresses only the GEOMETRY.
```

Five draws in, five draws out, and the country does not move. This is the difference between a piece
that re-pins three frames and a piece that re-pins twenty-eight. **It must be verified rather than
asserted**: the check is that `01_carpark_wide` and `05_tussock_ground` come back bit-identical with
the corner suppressed, which is the probe in section 3.

---

## 2. WHAT HAPPENS TO LIVE-SAVE STAR PAGES

The save is v3 (`src/game.mjs:3761`), one slot per biome:

```
biomes['carpark'] = { done:[...ids], chapIdx:n, stars:{<AREA NAME>:{...}}, pages:{<AREA NAME>:{...}},
                      hats:[...], areas:[...the chapter list as it was...] }
```

**`stars` and `pages` are keyed by the AREA TITLE STRING, not by mission id.** That is what makes
this delicate, and it breaks in three separate places:

| what breaks | why | the fix |
|---|---|---|
| **`chapIdx` silently points at the wrong page** | it is an INDEX into `G.chapters`, and `A.ski` sits at index 4 of 8. Drop it and every save with `chapIdx>=5` resumes one page early — a player on THE TRAILHEAD wakes up on THE PADDOCK | **remap by name, not by number.** The slot already stores `areas` — the chapter list as it was when saved — precisely so a map can be read without being loaded. `migrate()` looks up `areas[chapIdx]` in the new list and re-derives the index |
| **`stars['THE SKI FIELD']` and `pages['THE SKI FIELD']` are orphaned** | the carpark no longer has a page by that name, so a cleared page with its three pips becomes unreachable data | **do not merge it into a hill page.** A page record is `{open,close,earned,paid,caged}` — a chaos ledger for one visit to one page — and adding two together produces a number that describes no session that ever happened. Keep the record under its old key, unread, and let the hill's own pages start clean |
| **four of the five ids in `done` name retired missions** | `done` is a list of ids; ids not on the current list are ignored on hydrate, so nothing throws | **leave them.** They are the honest record that the player did those jobs on that map. The hill's equivalents are different jobs and should be earned again |

**What a player actually loses:** if they had cleared THE SKI FIELD page in the carpark, they lose
that page's cleared mark from their carpark total (seven pages instead of eight, so the denominator
moves with it) and they will earn the hill's equivalents again. **What they must not lose is their
place**, which is the `chapIdx` fix above. That fix is the only part of this section that is not
optional, and it is the part a careless graduation would silently get wrong.

Bumping to **v4** is the honest way to carry it: `migrate()` already takes "any vintage in, v3 shape
out", and the name-based `chapIdx` remap belongs in exactly that function.

---

## 3. WHICH CARPARK VANTAGES GET RE-STAGED OR RETIRED

**`10_skifield` is the only vantage staged ON the corner**, and it is staged tightly on it: the bird
at `(-37,-36)`, camera at `(-28,5,-27)` looking at `(-40,1.6,-40)` — the shed's own placement
coordinates. With the corner gone the frame is an empty snowy corner. **Eric's judgement either
way**, and the two honest options are:

- **re-stage** it as a carpark vantage that still has a subject — the natural one is the snowline
  itself, which is what that corner of the map is now about; or
- **retire** it, since `28_skifield_base`, `29_lodge_deck` and `30_groomed_band` already cover the
  tow and the hill has the furniture now.

The recommendation is **retire**, and let the hill's three vantages carry the ski material — a
re-staged 10 would be a fourth frame of snow with nothing in it.

**Every other carpark vantage should be unchanged, and that is a claim to be measured, not assumed.**
The probe, before any migration lands:

```
suppress the corner's geometry, keep its five rnd() draws, shoot all 28 carpark vantages,
diff against the pinned set.
```

The prediction: only `10_skifield` moves. `01_carpark_wide` looks down the bearing of the corner
from 83 m and `06_skyline` has it about 21 degrees off axis, so both are worth watching. **If any
frame other than 10 moves, the draw preservation has failed and the piece stops there** — that is
the whole reason to run the probe first rather than after.

---

## 4. WHAT THE WHOLE-SET RE-PIN WILL COST

Measured on this machine rather than estimated. One sweep of all 43 vantages at `BATCH=6` takes
**3 minutes 06 seconds** — 43 of 43 frames, no dead batches, 164 s user plus 55 s system at 117% CPU.
The pin needs at least three sweeps for a medoid, and four is what the last two re-pins used. So:

    4 sweeps x 43 vantages = 172 frames,  about **12 and a half minutes** of machine time
    plus 8 batches per sweep = 32 browser launches, which is why BATCH exists at all
    (7 vantages in one process exhausted 8 GB and returned zero frames, four passes running)

**But the whole-set re-pin should not be what this piece costs**, and that is the point of the draw
preservation. The expected pin is:

| | frames | who judges |
|---|---|---|
| `10_skifield` | 1, re-staged or deleted | **Eric** |
| `28_skifield_base`, `29_lodge_deck`, `30_groomed_band` | 3 — the rack and the tear are new furniture in that map | **Eric**, and they are already FLAGGED first pins |
| a new vantage on the migrated rack | 1, if Eric wants one | **Eric**, as a first pin |
| everything else | 0 | — |

So **four or five frames, not forty-three** — if the probe comes back clean. A whole-set re-pin is
the fallback if it does not, and the cost of that fallback is the number above.

**PRESEAM will need re-pinning either way**, because the carpark world digest, its mesh count and
its triangle count all move when the corner's geometry stops being emitted. That is one edit to
`audits/2026-08-28/harness-everything.js` and costs nothing.

---

## 5. THE ASSERTIONS THAT MUST CHANGE, AND ONE THAT IS A FLAKES 16

Fourteen references across two batteries and `gauntlet/TASKS.md`.

**The FLAKES 16 case** — `audits/2026-08-28/harness-everything.js:3615`:

```js
ok(cpIds.indexOf('s_ski')>=0 && skiIds.indexOf('s_ski')<0,
   'the carpark keeps its own ski corner jobs and the ski field is not handed them')
```

That asserts the PRE-graduation arrangement as though it were a law. It is the exact shape FLAKES 16
warns about — an assertion that encodes what currently explains the state instead of how it should
be — and it will go red on the graduation for the right reason. It gets rewritten to the law that
survives: **no id appears on both maps** (which is the line above it, and stays), plus **the retired
ids appear on neither**.

Also to move or retire:

- `harness-everything.js:3616` — `cpIds.length===43 && G.chapters.length===8` becomes 38 and 7.
- `harness-everything.js:85,86,288` — drivers for `s_pole`, `s_binding`, `s_goggles` under a carpark
  boot. `s_binding`'s driver moves to a skifield boot as `k_binding`; the other two retire.
- `harness-systems.js:69,368-384` — drivers for `s_binding`, `s_pole`, `s_ski`, `s_lift`. Same
  treatment. **Note `s_ski`'s driver measures a 24 m relocation against `farR:18`** — the hill's
  `k_ski` tests "is it on the piste" instead, so this driver does not port, it is replaced.
- `gauntlet/TASKS.md:46,47,55` — the driven/reviewed tallies name all five. Bookkeeping.

---

## 6. THE ORDER OF WORK

1. **The probe.** Suppress the corner's geometry behind a guard, keep the five draws, shoot 28
   carpark vantages, diff. **Stop and report if anything but `10_skifield` moves.** No missions
   touched, nothing migrated — this is a measurement and it is reversible by one edit.
2. **Eric's two decisions**: retire-four-or-keep-both, and re-stage-or-retire vantage 10.
3. **The save migration to v4**, with the name-based `chapIdx` remap, and a battery that loads a
   hand-built v3 blob with `chapIdx:5` and asserts it resumes on THE TRAILHEAD and not THE PADDOCK.
   **This lands before the missions move**, so there is never a build in which a live save resumes
   on the wrong page.
4. **The furniture.** Rack and tear up the hill, corner suppressed in the carpark, `s_lift`'s
   detector moved into a `check()`.
5. **The missions.** Four retired, `k_binding` declared on THE ROPE TOW.
6. **The batteries**, including the FLAKES 16 rewrite, then PRESEAM re-pinned.
7. **The frames.** Whatever the probe said, shot and left FLAGGED for Eric, per the brief: "All new
   skifield vantages are first-pins: shoot, leave ALL flagged."

One commit per numbered step, proof in the same breath, gate green before each push.

---

## WHAT I NEED FROM ERIC BEFORE STEP 2

1. **The four duplicates**: retire them (recommended), keep the carpark's wording instead of the
   hill's, or keep both as separate jobs on separate maps?
2. **Vantage 10**: retire (recommended), or re-stage — and if re-staged, on what subject?
3. **A new vantage on the migrated rack**: yes or no?
4. **The orphaned `stars['THE SKI FIELD']` page record**: leave it unread (recommended), or should a
   player who cleared it in the carpark arrive on the hill with THE ROPE TOW already marked?


---

# WHAT ACTUALLY HAPPENED — 2026-09-21

## WHERE THE PLAN WAS RIGHT

**The shape.** Four retirements and one migration, exactly as §1 predicted, and the four were
retired because the hill answers them better rather than because they were in the way.

**The draw-order answer.** Keeping the five `propAt` draws and suppressing only the geometry held.
It is now proved twice over rather than argued: the world's mesh rows diffed against the
pre-piece tree ROW BY ROW come back as ONE contiguous deleted block — 22 meshes, 2 colliders, 5
props, 1 tear — with every other row byte-identical **and in the same order**; and deleting a
single one of the five draws turns the carpark mesh digest and the anchor digest red.

**The frame cost.** §4 predicted four or five frames instead of forty-three. It was four: 10
retired, 44 first-pinned, 28 and 29 re-pinned. A 28-frame carpark probe confirmed the prediction
that only the frame staged ON the corner moves.

**The FLAKES 16 call.** `harness-everything:3615` did go red on the graduation for the right
reason, and the law it encoded wrongly has been replaced by the law underneath it: the five
graduated ids are on NEITHER list, so a later session cannot quietly reinstate a carpark ski
corner and have the pair of assertions pass.

## WHERE THE PLAN WAS WRONG, AND IT MATTERS BOTH TIMES

**§2's `chapIdx` hazard does not exist.** This was found by 39b/1 and is repeated here because
this document is where somebody will look: `applySave` never reads the saved `chapIdx`. It walks
`G.chapters` from zero and stops at the first page whose rows are not all done, so the derivation
is already by name and a page leaving the list cannot misplace anybody. "A player on THE TRAILHEAD
wakes up on THE PADDOCK" was wrong. What a rename really breaks is the other half — `G.stars` and
`G.pageChaos` are keyed by the AREA TITLE — and that is what `SAVE.graduate` carries.

**§5 undercounted the damage by a long way.** It named "fourteen references across two batteries"
and four assertions to rewrite. The real count was **thirty-six findings**, and the difference is
the interesting part: eleven of them were in the VS fix-verb and carry-back sections, three hundred
lines from anything about skiing. Two causes, both of them laws this project has already written
down:
- `G.inter.find(... kind==='tear' ...)` returned CHEW THE BINDING for its whole life because the
  binding happened to be the first tear in the carpark. With the binding gone it returned PEEL THE
  3 HR RETURN STICKER, a **strip** tear that resets `done` after each of its five units, so the
  section held a key for twenty seconds four times and reported the fix economy as broken. The
  predicate now says what the section always needed: `!it.strip`, because a thing that comes apart
  in five pieces cannot be put back.
- Then the same section met FLAKES 3: UNZIP THE UNATTENDED PACK spawns a muesli bar a metre and a
  half from its own anchor, so the management's restore hold went to the SNACK.
**The lesson to carry:** a piece that removes props should expect its damage in the sections that
pick a prop or an interactable BY POSITION, not only in the ones that name the thing it removed.
Those sections do not mention skis anywhere.

**A boot is not free, and the first cut of this piece paid for it.** Moving the goggles test to the
hill by booting the ski field inside an EARLY carpark section shifted the seeded stream for every
section after it (FLAKES 15) and made the VS sections pick different props out of a differently
scattered world. The test went to the hill's OWN section instead, where the map is already booted
and the boot count does not change.

## WHAT THE PLAN DID NOT MENTION AT ALL

- **`sw_tow_shed`'s registry row.** The plan retired the shed's placement and said nothing about
  its P6A entry. A registry row is a request to source, licence and fit a model, so a row nothing
  places asks for a GLB of a shed that is not in the game. Retired, and MODEL_MANIFEST.md
  re-measured with the same probe that generated it (57 entries, 57 placed, 84 instances).
- **Four assertions elsewhere that were quietly about the ski corner**: the `_ryUnused` section's
  "the two skis are the build site that rotates a prop" (the walking poles are that pair now), the
  corrugate-drainage precondition (three panels, now two — the third was the shed's roof), the snow
  resolver's fixture, and the rail-is-a-surface section's collider find.
- **The hill's page shape.** `k_binding` makes THE ROPE TOW five rows against THE DAY LODGE's four.
  Nothing requires a page to be four, and the battery now asserts the shape that is true plus the
  invariant that matters: the two pages between them hold every job bar the finale.
