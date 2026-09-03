# REPORT — REPLAT P3b, Eric's three P3 verdicts (session 17, 2026-09-03)

Branch `replat-b`. Tip certified before anything moved. **P4 not started, as ordered.**

## THE THREE VERDICTS

**(1) The carpark tiling repetition — fixed with breakup, not a bigger texture.** Both halves you
asked for: a large-scale variation layer that never aligns with the tile (two octaves of value
noise in *world* metres at 17.3 m, driving albedo **and** roughness), plus per-tile rotation and
offset by stochastic tiling on a triangle lattice, three taps blended by barycentric weight, each
sampled with explicit gradients so a cell border cannot collapse the mip.

Applied to every large flat family surface — which turns out to be a fact about the material, not
about size. The four **isotropic** ground families (grass, gravel, asphalt, snow) get the rotation.
The four **directional** ones do not, and must not: weatherboard laps run level, corrugate ribs run
down the slope, brick courses stay horizontal, concrete form lines stay level. Rotating those would
be a worse defect than the repetition. A battery reads that gate off the family and checks it in
both maps.

**(2) The four tints — kept, and now pinned.** gravel 0.35, asphalt 0.45, brick 0.20, snow 0.55.
They are asserted at your accepted values, so a later session has to change that line to move them.

**(3) The anchor block — it is concrete now.** An eighth family, `concrete_layers_02` (Poly Haven,
CC0, licensed and md5-verified before any code), board-formed rather than plain because that is
what a poured-in-place footing looks like. It has a hex of its own so one family's colour can no
longer speak for another object's material — the second time in two sessions that was the defect.

## THE STRIP THAT SETTLED IT — `strip_breakup.png`

Four frames at 01_carpark_wide, tarmac at 2x:

| | | |
|---|---|---|
| **A** | off | the repetition you flagged — long parallel cracks marching in step |
| **B** | sharp 1.0 / var 0 | repetition gone, slightly soft |
| **C** | sharp 4.0 / var 0 | repetition gone, contrast held — **SHIPPED** |
| **D** | sharp 1.0 / var 1.0 | **the lattice drawn as dark hexagons across the whole car park** |

D is the interesting one. Three-tap blending removes contrast — that is arithmetic, not taste — and
the standard correction puts back exactly the variance it removed. It made things *worse*, because
it boosts contrast hardest where the blend is widest, which is precisely on the seams it was meant
to hide. The proper pairing needs a histogram-preserving transform (a precomputed texture per
family); without it, weight sharpening alone is the answer, because it makes most of the surface a
single tap at full native contrast. The rejected knob is kept at 0 and pinned there.

## COST, MEASURED IN PLACE

Nine texture fetches where the breakup runs. Against a control built by swapping the same 72 meshes
to a plain material carrying identical maps and lights, GPU flushed each pass, best of five runs of
forty renders at 1280×720:

    breakup 3.692 ms/render    plain 3.240 ms/render    +0.452 ms, +14% of scene render

2.7% of a 60 fps frame; still vsync-locked. Recorded so P4 starts from a number.

## FRAMES TO EYEBALL

- `strip_breakup.png` (in the scratch dir, path in the log) — the four-variant strip above
- `gauntlet/capture/01_carpark_wide.png` — the tarmac, which is the verdict
- `gauntlet/capture/07_jam.png` — the road at bird height
- `gauntlet/reference/pairs/01_carpark_wide__ref_bow_00.png` and `07_jam__ref_bow_06.png`

## FOUR THINGS I GOT WRONG, BECAUSE THEY COST TIME AND ARE WORTH KNOWING

- **The breakup shipped as a silent no-op.** `onBeforeCompile` hands you the shader with its
  `#include` directives *unresolved*, so surgery against expanded chunk text matches nothing and
  throws nothing. Every uniform read correctly and the frame looked almost right. Only a runtime
  on/off A/B returning byte-identical screenshots caught it. It is now validated at module scope
  against the three that is installed, and a chunk rename turns into a red gate.
- **My own A/B harness lied first.** It called `renderer.render` while the game draws through the
  post composer, so the screenshot never showed my render. I found that only by adding a control
  that *must* be visible (forcing the asphalt red) and watching it change nothing.
- **A whole variant strip was shot and nearly judged on four identical frames** — twice, from two
  different causes: `breakup` missing from the rig's key list (and I had silenced stderr), then an
  override loop that assigned the block wholesale so every other leaf went `undefined` and the
  uniforms went NaN. A NaN uniform still renders something, and it looks deliberate. The merge is
  leaf-wise and type-checked now, and the strip shooter prints an md5 per frame.
- **I ran sabotages while a capture pass was shooting**, which rebuilt `dist/` underneath it and
  contaminated the fourth sweep of the first re-pin. Killed it, restored the committed baselines
  from git, and re-ran the whole thing with nothing else touching the tree. Same lesson as
  SESSION.lock, one level down: a capture pass owns the tree while it runs.

## VERIFIED

Nine batteries ALL PASS; gate CERTIFIED-SHIP; gate-selftest ALL PASS; **sixteen P3b sabotages, all
sixteen red**; bundle builds; 30/30 vantages shoot with no retakes and no GAVE UP; sidebyside 33
pairs; all 24 texture files re-verified against their ledger md5s.

**THE RE-PIN — four sweeps, medoid per vantage, by instrument.** `gauntlet/verify/repin.mjs` is
new: it shoots N sweeps, scores each run's frame by its total pixel distance to the same frame in
every other run, pins the lowest, and prints provenance. TODO 73 was a hand procedure in a scratch
script that no longer existed; you have now ordered it twice, so it is a tool.

    PIN PROVENANCE   run1 10, run2 7, run3 7, run4 4

Spread across all four, which is the whole point — the outlier is a property of a (run, vantage)
PAIR, not of a run. On this set it was run 2 on 02_hut_snow, run 1 on 14_player_view, run 3 on
18_rear_close and run 4 on 17_flight. Third independent confirmation.

**VERIFIED ON A FRESH FIFTH SWEEP**, not on the sweeps the pins came from:

    diff       28 compared, 0 flagged, worst 0.9952
    pxdiff     28 compared, 3 over band
    boxdiff    12 compared, 1 changed (25_preen_follow beak, 0.9625)
    subjects   16 checked, 2 missing — the two known-red from TODO 75, no new regression
    stability  4 vantages x 3 takes, 1 unstable — 22_torch_beam at 0.9830

## TWO THINGS FLAGGED FOR YOU, NEITHER OF THEM A REGRESSION

**22_torch_beam does not reshoot the same twice right now (0.9830, bar 0.995), and it is not P3b.**
I attributed it rather than guessing: re-run at five takes it reads 0.9826, and re-run at five takes
with `NOMATS=1` — no scanned materials at all, same build — it reads **0.9805, slightly worse**. So
the materials are not implicated; this is the vantage FLAKES law 12 already names as the hardest
(night easing, follow-cam lerp, the campfire's random spit), on a machine currently at load 8.7
from these very sweeps. Session 16 read 0.9998 on a quiet machine. **I did not touch the threshold.**

**The churn ceilings were not re-fit, and the reason is now much stronger.** Measured the way
session 15b measured it (outlier run dropped per vantage, then the worst remaining pair), 5 of 28
exceed their recorded ceiling — and they are a *different five*. Session 15b's three now hold
comfortably: 01_carpark_wide 13 against 104, 04_flight_underwing 20 against 69, 28_skifield_base 156
against 1291, every one of which was over last session. A set of ceilings whose violators change
completely between two sessions is measuring the machine, not the vantages, so re-fitting them
inside a re-pin would pin today's noise as tomorrow's contract. TODO 77 stands and this is the
evidence for it.

## SUGGESTED NEXT

P4 — instanced grass, as briefed. The breakup and the scanned ground are what its blades will stand
in, and the frame budget now has a measured starting number (+0.45 ms for the breakup, still
vsync-locked).
