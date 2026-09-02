# REPORT — overnight session 8, 2026-09-02

Stop condition: **6 pieces certified**, taken in the order you ratified. Nothing parked as failed.
No assertion was weakened, skipped or deleted — but **three of mine were thrown away and rewritten**
because they were wrong, weak, or nearly flaky, and each is called out where it happened. Final build
**74e048b26061845b4f4da8e9cccf1997**, gate CERTIFIED-SHIP, working tree clean.

**Read section 1 first: I got last night's headline diagnosis wrong, and the correction is the
piece.**

## 1. The settle was not the cause, and 900 was already the default

Last night I told you `17_flight` was fixed by giving it the `{settle:900}` that 04 passes.
`shot()` reads **`o.settle||900`**. Nine hundred **is** the default — 04 passing it explicitly is a
no-op, the two vantages have always had the same settle, and the 0.9024 → 0.9958 that seemed to
confirm it was a lucky three-take sweep of a completely unchanged build.

It was caught by applying the "fix" and then testing it properly: five takes instead of three, twice,
gave **0.9848** and 0.9960 — one of them under the bar your own brief sets. A fix that only passes
when you sample it thinly is not a fix.

So I stopped guessing and **measured the page**. A probe stages 17 exactly as `capture.mjs` does and
reads state back instead of taking a photograph:

    take 1 {flapPh:1.1, flapDrive:1, y:3, ry:2.2, wz:-0.29999999632943347, ... t:2.3842}
    take 3 {flapPh:1.1, flapDrive:1, y:3, ry:2.2, wz:-0.29999999632943347, ... t:2.3841}
    take 2 {flapPh:1.1, flapDrive:1, y:3, ry:2.2, wz:-0.29999999631482993, ... t:2.3509}

The bird is identical to nine decimal places. **`G.time` is not.** The bird was never the variable —
the ground was, and TODO 30 had measured the same thing from the other end a session ago: the grass
shader sways on `uTime`, and 17 looks down across the tussock from three metres up. Pinning `G.time`
is the law-12 idiom 21 and 25 already use. Seven sweeps of five takes: worst **0.9980**.

The correction is written where the wrong claim was — TODO 51 lost the paragraph blaming the settle,
TODO 53 carries it under your own words, and `capture.mjs` says it at the vantage.

**The same probe found something you should know about that frame:** the `flapDrive` pin on 17 is
**inert**. The PIN chain is registered after the game loop, so it runs after `update()` and
`render()`, and the game zeroes `flapDrive` every frame because the flap key is not held. The probe
reads the wing sitting at its **glide** targets. The vantage called `17_flight`, whose comment says
the wings read mid-beat, is photographing a glide. 04 avoids it by pressing the flap key so the
*game* sets `flapDrive`. Filed as **TODO 54** — it changes the photograph, so it is yours.

## 2. Your table over-classified, and one sweep cannot classify a vantage

Piece 51's first act was to disprove its own premise. Re-measured at five takes, four sweeps each,
**before touching anything**:

| vantage | before (4 sweeps) | after | verdict |
|---|---|---|---|
| 03 | 0.9943 0.9974 0.9974 0.9974 | **0.9998** ×3 | fixed |
| 05 | 1.0000 0.9983 0.9947 0.9984 | **0.9998** ×3 | fixed |
| 23 | 0.9980 0.9980 0.9980 0.9978 | **0.9997** ×3 | fixed |
| 08 | 0.9978 0.9978 0.9978 0.9995 | 1.0000 **0.9879** 0.9983 | **reverted** |

08 and 23 **passed every single time** before I touched them, and 05 came back at 1.0000 on the sweep
right after being called unstable. Only 17 never passed, which is why it was the real one.

**08 — the vantage TODO 51 is named for — refused.** The brief asks for a `PIN`; it was applied,
measured no better and one sweep *worse*, and **reverted**. Changing a baseline frame that buys no
measured stability is a cost with no purchase. The probe says why nothing else will help either:
staged and pinned, five takes report the bird, **both prompt strings, the wrapped line counts, the
docked flag, the plate height and the chaos readout all identical**, with only the frame count moving
(140→142). Everything the rig can name is already deterministic; what is left is dt-driven
accumulation on a 320×180 canvas. That is a deterministic frame clock — **TODO 33** — and it re-pins
everything. Classified review-tier under law 8.

## Shipped

| piece | md5 | one line |
|---|---|---|
| 53 `settle-17-flight` | *harness-side, unchanged* | not the settle — `G.time`; 0.9024 → worst-of-seven 0.9980 |
| 51 `vantage-stability` | *harness-side, unchanged* | 03/05/23 fixed and flagged; 08 measured, reverted, classified |
| 52 `hint-text-resolved-when-read` | `d72bec482c1ec516c985c9c35b060008` | mode-dependent hint text is a function evaluated when read |
| 36 `tour-chassis` | `520a4d78a337a9f7f08f9b7e0967d88c` | the world is a biome now; 251 lines moved byte-identical |
| 22 `vs-match-scaffold` | `846ee651e37429d7fa3355a49ee9329b` | a match is a window over the shared economy; four endings, all driven |
| 18 `fix-verb` | `74e048b26061845b4f4da8e9cccf1997` | one verb, one counter, both directions: 35 → 21 → 13 → 8 |

## Three assertions of mine were thrown away, not weakened

Worth reading as a group, because they are three different ways to write a test that lies.

1. **One passed while broken** (52). It handed a hint a function returning a *literal* and looked for
   those words on the plate. Concatenating a function gives you its **source**, which contains the
   literal — so a display path that had stopped resolving still printed the words. The sabotage caught
   it. The return value is now computed at run time, so the sentence exists nowhere in the source.
2. **One was nearly flaky** (18). The decay sequence was checked by step *ratios* against a 0.02
   tolerance. Measured, the ratios are 0.600, 0.619, 0.615 — rounding at small values — so two of the
   three sat inside by a **thousandth**. It would pass today and fail on correct code the day a tear
   award changed. Replaced with the exact form, which has no tolerance to get wrong.
3. **One asserted a wrong expectation** (51/08 and, last session, 15). Written up where it happened.

And a fourth thing became a rule rather than a lesson: **three separate sabotages produced zero
findings** because the assertion read state that only exists when the code works (`G.squawk.n`,
`result.winner`, `b.id`), threw, and took every later finding down with it. Every such read now goes
through an accessor. A dead battery is a worse witness than a red one.

## Parked

- **TODO 54** (17 is photographing a glide) — changes the photograph.
- **TODO 55** (the cage hint has no mission behind it, so nobody has ever read it) — making it live
  puts new text on screen during play. There is a **tripwire** on it: the battery asserts exactly one
  hint has no mission and that it is the cage one, so the day somebody makes it reachable the
  assertion fails and says to read the copy.
- **08**, per section 2.
- **19–21, 23–25** — next in your order, and 18 shipping means the verbs now have a role to belong to.

## Frames to eyeball — four, and they are the whole visual output of the session

    gauntlet/capture/17_flight.png        vs baseline  (piece 53)
    gauntlet/capture/03_kea_plate.png     vs baseline  (piece 51)
    gauntlet/capture/05_tussock_ground.png vs baseline (piece 51)
    gauntlet/capture/23_paddock_gate.png  vs baseline  (piece 51)

All four are the same intentional change: **the grass sway is frozen** so the frame is reproducible.
The subject should be unchanged in each; only the blade phase moves. **Nothing was re-pinned** — the
baseline is untouched on disk and in git, and these four are yours to accept or reject. Every other
vantage matches its pinned baseline through all six pieces.

Two things have no vantage at all and need you to *play* them: the title now has a fourth button
(**key 4**, `2 KEA VERSUS`) and there is a new results screen. The look of both is flagged.

Final stability on the four changed frames, against the shipped build: **0.9991 / 1.0000 / 0.9999 /
0.9991**.

## Suggested next three picks

1. **19 `botch-system`.** It is the next number, it is the reason 18 exists, and 18 gave it the seam:
   `fixTear` is the single place a restore happens, so the wonk transform goes in one function.
2. **54 or 33.** 54 is small and yours; 33 is the deterministic frame clock that closes 08 and the
   whole residual band, and it re-pins everything, so it wants a session where that is the plan.
3. **24 `role-aware-rex`.** Roles exist now and do nothing. 24 is what makes them matter, and it
   modifies the co-op cell from piece 15 rather than inventing anything.

## Housekeeping

Your TODO block had not been applied to the tree, so it was run first and committed as yours before
anything else. `SESSION.lock` taken before the first write, released as the final act. Every commit
names its paths — no `git add -A`. Six piece commits, the log has a section each, and TODO 51 and 53
carry the correction to last night's report.
