# REPORT — overnight session 9, 2026-09-02

Stop condition: **6 pieces certified**, and with them **the ratified run order is finished** — 53, 51,
52, 36, 22 and 18 last session, 19, 20, 21, 23, 24 and 25 this one. The whole VS block exists.
Nothing parked as failed. Final build **df4ae7c6cdee29c3a0bbe3aa7f514f24**, gate CERTIFIED-SHIP,
working tree clean, **0 of 25 vantages flagged**.

**One housekeeping note first:** you pasted a command to launch a second Claude session against this
tree. I did not run it — that is the two-writer collision `SESSION.lock` exists to prevent — and
continued the run in place instead.

## Shipped

| piece | md5 | one line |
|---|---|---|
| 19 `botch-system` | `ed17c5d8cb9f044870769dedc59b8e83` | a restore lands crooked, measured from pristine every time, so it never gets worse |
| 20 `carry-back-restore` | `d16cf644cfdffd8c4ca08510f288b5d9` | two questions at a drop: was it away, is it home |
| 21 `consumable-replace` | `6b4c21db02a72392d733500958471896` | a scoffed sandwich cannot be un-eaten, so the management walks |
| 23 `arena-scoping` | `96a83803f067232a08463219ced371ed` | a match is one patch; the gate reads the position `award()` already carries |
| 24 `role-aware-rex` | `39c2d931f488caa1679afa01fff0e697` | rex picks a side, and the cell changes hands in one line |
| 25 `vs-hud-split` | `df4ae7c6cdee29c3a0bbe3aa7f514f24` | two scores, two roles, a clock, down to 320px |

## The VS block came out as one machine, not six features

Worth saying because it is the return on how 16, 18 and 19 were written:

- **One ORDER economy.** Piece 18's decay counter serves tears, piece 20's carry-backs and piece 21's
  replacements. There is no second scoring path anywhere.
- **One kind of crooked.** `botchApply` is the only place a restore lands. Piece 20 needed props as
  well as tears, so 19 was *generalised* rather than copied — a tear owns its mesh transform, but a
  prop mesh is re-positioned from `p.x/p.y/p.z` every frame and has `rotation.x` flattened when it
  settles, so a prop is wonked on the axes that survive.
- **One predicate for the cell.** Piece 24 reverses piece 15's entire co-op cage — clock running,
  mashing back, latch locked — by adding `&&!vsOn()` to `coopCell()`.
- **One scoring gate.** Piece 23 scopes 46 award call sites by reading the position `award()` already
  takes, the same trick piece 16 used for attribution.

## The brief named data the file does not have — again, and this time it was load-bearing

Piece 23 asks to scope on *"interactables whose mission area matches the arena"*. **29 of 65
interactables carry a mission id.** Scoping on mission area alone would have left 36 of them — most
of the tears, most of the props — unscoreable in every arena, which is not a match, it is an empty
carpark.

So every interactable is **stamped** with an area derived from data that exists: its own mission
area, or the area of the nearest thing that has one, taken from where it **lives** rather than where
it currently is. No table, no per-object tagging, and a tear added beside the hut tomorrow is a hut
tear without anybody saying so. The assertion that matters is that the derivation is a **fallback and
never an override**.

## Four assertions of mine were wrong, and the sabotage sweeps found all four

This is the pattern of the session and it is worth reading as a group.

1. **One could not fail.** Piece 25: I added *"or a match is on and narrow"* to the TAB-pill docking
   rule, and the sabotage that removed it changed nothing — the versus narrow band (420) is a strict
   subset of the plate narrow band (480), so the term could never change the answer. **A condition
   that cannot fire is worse than no condition: it reads like a rule and is not one.** Removed.
2. **One tested nothing.** Piece 24: making the caging bonus fire for *any* caging caught nothing,
   because the section only ever caged the menace. Rex now cages the management too.
3. **One ran too early.** Piece 21: the second-source assertion sat *before* the food was eaten, so
   both sources answered null and it passed against a sabotage that had broken the rule outright.
4. **One was a magic number.** Piece 21 added a seventh registry and broke my own piece-48 assertion
   that *six* registries are cleared — a count that failed on a correct change and said nothing about
   what was missing. It names them now.

And a fifth thing has now happened in **five consecutive pieces**, so it is a rule rather than a
lesson: **if an assertion reads state that only exists when the code works, read it through an
accessor.** Sabotages kept producing *zero* findings because a test threw on `rep.banked`,
`result.winner`, `inIt.area` and took every later finding down with it.

## Frames to eyeball

**None.** Every piece this session is match-only behaviour, and no capture runs a match — so all
25 vantages match their pinned baselines through all six, worst 0.9903. Nothing re-pinned.

The two things that need *playing* rather than looking, both flagged per their briefs: the **results
screen** (piece 22, last session) and the **versus HUD bands** (piece 25). Press **4** on the title
and narrow the window.

## The stability instrument, confirmed twice

Full sweep on the shipped build: **24 of 25 clean**, only `12_seal_midpeel` flagged at 0.9941 on four
takes — and then **0.9988 / 0.9980 / 0.9951** across three sweeps of five. Borderline, sitting on the
threshold, exactly as 03/05/08/23 did before you re-pinned them.

That is now **twice** a single sweep has named a vantage that repeated sweeps clear. The rule is in
TODO 51: **nothing is unstable until three sweeps agree it is.** 12 is not fixed and should not be
until there is a reason beyond one reading.

## Still open from your own list

- **Your re-pin question is unanswered.** All four frames you pinned last night are a consistent
  ~0.991–0.998 from the attractor because they came from the tail of a stability sweep. Everything
  passes with room; it just spends margin for no reason. One command, still yours.
- **TODO 56** (`bird-shadow-quality`) — filed by you from a live frame, and **it collides with your
  own blocked list**, which names *blob shadows* as an art wave requiring your eyes. I have not
  touched it. If the block no longer applies, say so and it is a normal piece.
- **TODO 54** (17 is photographing a glide, not a flap) and **55** (the cage hint has no mission, so
  nobody has ever read it) — both judged, both small.

## Suggested next three picks

1. **54 and 55 together.** Both are one-line decisions of yours with the analysis already done, and
   55 has a tripwire in the battery that fires the day anyone makes that hint reachable.
2. **37 `tour-save-and-map`.** The chassis (36) landed last session and 22–25 have now filled the
   mode side; the save schema is what lets any of it persist.
3. **33** — the deterministic frame clock. It closes 08, closes 12, and retires the whole "is this
   vantage unstable" question that has now cost two sessions of measurement. It re-pins everything,
   so it wants a session where that is the plan rather than a surprise.

## Housekeeping

`SESSION.lock` taken before the first write and released as the final act. Every commit names its
paths — no `git add -A`. Six piece commits, a log section each, and TODO 51 carries the second
confirmation of the three-sweep rule.
