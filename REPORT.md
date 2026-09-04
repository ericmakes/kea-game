# REPORT — TODO 81 closed, and P5 stopped at the decision point (session 23, 2026-09-04)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `5c9fa1dd77d46eec3d6da3b630cd4149`.
Two commits: TODO 81 (rig calibration), and this P5 plan. **`src/` is untouched by P5.**

## TODO 81 — DONE, AND THE REFERENCE WAS THE WRONG HALF

You asked me to reground the tow-wheel floor against the now-deterministic reading. Doing that
properly meant re-deriving the *reference* too — and `absent:440` turned out to be the only
reference in `subjects.mjs` with **no derivation recorded beside it**, and it does not reproduce.

Measured the way every other reference in that file was — same vantage, same stage, the real
classifier imported from `subjects.mjs` rather than a copy, with the bull wheel taken out of the
scene and held out every frame — the box scores **0, 0, 0**. The scarlet window sees the wheel and
nothing else in it. (The carpark frame from the same camera, which is how the `hutgreen` reference
was taken, scores 11 — so that is not where 440 came from either.)

| | staged | floor | reference | separation |
|---|---|---|---|---|
| **before** | 490–2038 *(nondeterministic)* | 1500 | 440 | 3.4× — a coin flip against a reference that was never measured |
| **after** | **838 ±1** *(deterministic)* | **400** | **0** | **∞** — 2.1× headroom under the reading, nothing at all in the box without it |

The floor moved **down**, and that is grounding rather than weakening: 1500 was fitted to the top of
a nondeterministic spread and was unmeetable by the frame the rig actually produces. 400 is 0.48 of
the deterministic reading, in line with the sibling kea test in the same vantage (70 against 128).
The calibration script validates its own stage copy — it reproduces the shipped 838 before its
absent number is trusted. `subjects` is back to **2 missing**, the two known TODO 75 reds.

## P5 — I STOPPED WHERE THE BRIEF SAID TO STOP

Full plan and sourcing in **`P5.md`**. Three things you should know before you read it.

**1. P5 is not what the REPLAT clause says it is.** The clause says "retarget the existing
animations". There are no animation clips. There is a hand-written procedural rig with **80 pose-
write sites across 13 joints** — including a `jaw`, five **individually fanning** tail feathers, and
a `neck` that *scales*. So P5 is **re-binding a procedural rig onto a skeleton**, and the model's
bone structure matters more than its mesh. A pretty model with eight anonymous bones costs more to
adopt than a plain one with thirteen named ones.

**2. The free rigged-parrot pool is thin, and the obvious answer is disqualified.** I downloaded
three.js's `Parrot.glb` — the internet's default free parrot — and opened it: `skins: 0`,
`JOINTS_0: false`, 12 morph targets. **No bones at all.** Poly Haven has 521 models and zero birds;
Quaternius has no bird pack. The shortlist is three CC-BY Sketchfab models and two OpenGameArt ones,
all licences verified from the publisher's own API or licence field.

**3. The finding that is not on any product page.** I opened both OpenGameArt `.blend` files
directly and read their armatures out: **every bone in both is called `Bone.0NN`.** Anonymous. And
the CC-BY one has **nine bones against the thirteen joints the rig drives** — the jaw and the tail
fan would both have to go.

## THREE DECISIONS THAT ARE YOURS

- **Which base model, or none.** My honest read is that **A (shabdar44's macaw, CC-BY, 378k faces,
  has a beak bone)** is the only candidate that moves toward the Birds of War target; the rest are
  sideways moves from the procedural bird. It needs decimation and its silhouette is a macaw, not a
  kea. "None of these — widen the search or buy one" is a legitimate answer. **I have not picked.**
- **Blender is not installed.** The brief said it was available; it is not. `brew` is, and `blender`
  is a cask at 5.2.1. Every route from here needs it. ~1GB on your machine, so I have not run it.
- **Sketchfab downloads need an account.** Metadata is public — that is where the spec table comes
  from — but `/download` returns `"Authentication credentials were not provided."`

**No renders of my own**, and I want to be straight about that: I cannot render what I cannot
download, and cannot open a `.blend` without Blender. `gauntlet/capture/P5_candidate_thumbnails.png`
holds the publishers' thumbnails — all wings-spread, tiny, not good enough to judge on. **The
Sketchfab viewer links in `P5.md` are better than any render I would have made**: you can orbit the
model and inspect its rig. Judge there.

## PROOF

Nine batteries ALL PASS · gate CERTIFIED-SHIP · `subjects` 16 checked, 2 missing (back to the two
known TODO 75 reds) · 28_skifield_base scarlet 838 against floor 400 on two further full capture
passes · nothing in `assets/`, nothing in `LICENCES.md`, no change to `src/` from P5.
