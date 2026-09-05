# P6A.md — THE MODEL-SWAP SEAM

The piece that makes every future model cheap. Branch `replat-b`. Take
SESSION.lock. Standard laws — proof in the same commit as the change.

---

## 0. WHY THIS EXISTS

Eric will obtain and adapt GLB models for essentially every object in the
game — vehicles, buildings, props, trees, humans, animals — via an external
tool, arriving in batches at unknown future dates. Today every one of those
objects is built inline as primitives inside `buildWorld` and its helpers.

Without a seam, each arriving model is a mini-refactor: find where the thing is
built, tear out the primitive, wire in a loader, re-hook its collider, its
mission anchors, its interaction points, its night-tint and material handling —
and re-prove all of it. Twenty models, twenty refactors, twenty chances to
break a mission anchor.

With a seam, an arriving model is a **line of configuration and a file**.

**This piece adds NO models and changes NO visuals.** Its success condition is
that the game looks and behaves exactly as it does now, byte-identically where
the instruments can measure it, while gaining the ability to swap any registered
prop for a GLB without touching game logic.

## 1. WHAT IT MUST DO

Establish a **prop registry**: a single place where each world object is
declared, with everything the rest of the game needs to know about it, and a
`source` that is either the current primitive builder or a GLB.

Each registry entry carries, at minimum:
- **id** — stable, used by missions and saves.
- **source** — `primitive` (call the existing builder) or `model` (load a GLB
  by path, with its licence-ledger row required as usual).
- **transform** — position, rotation, scale; and for a model, the normalisation
  needed to bring it to the game's units and orientation (the bird's own
  posed-height derivation is the pattern).
- **collider** — the physical shape the game uses. **This must NOT come from
  the model's geometry.** Keep the existing collider primitives; a swapped
  model must not silently change what the bird can perch on, walk into, or
  peck. If a model warrants a different collider that is a separate, judged
  decision.
- **anchors** — the named points missions attach to (the caravan door seal, the
  wiper, the bin lid, the tow rope). These are the highest-risk thing in this
  piece. They must resolve identically whether the prop is a primitive or a
  model.
- **material policy** — which P3 scanned family it uses if primitive, and for a
  model whether its own PBR maps are kept or overridden; plus how night-tint
  and any biome tinting applies either way.
- **biome** — which map(s) it belongs to, so the tour chassis keeps working.

## 2. HOW IT MUST NOT BREAK ANYTHING

The invariants, all assertable:
- All nine batteries green with **no assertion edits**. If a battery needs
  editing, the seam has changed behaviour and that is a failure, not a fix.
- Every mission anchor resolves. **The caravan door seal completes 12/12
  headless** — that is the canary that has caught more regressions than any
  other check.
- World structure invariants hold: the same child count, interactable count,
  prop count and collider count as before, in every biome.
- All 28 pinned vantages match their baselines. **Nothing is re-pinned in this
  piece.** A visual change here means the seam moved something.
- The seeded random stream is not disturbed. Registering a prop must not
  consume draws in a different order — that reshuffles the world and shows up
  as every vantage flagged. If a registry pass must run at a different point in
  the build, prove the stream is unchanged (draw-count comparison, as the
  P1 port did) or state plainly that it isn't and stop.

## 3. THE PROOF THAT MATTERS

Registering props without swapping any of them proves the plumbing exists but
not that it works. So the piece must also demonstrate a swap end-to-end:

**Pick ONE low-risk prop with no mission anchors** — a rock or a bollard is
ideal — and prove the mechanism both ways:
1. Build a trivial placeholder GLB (or use an existing simple mesh), landed
   with its licence-ledger row like any other asset.
2. Show the prop rendering from the model, with its collider unchanged, its
   position and scale correct, its night-tint applied.
3. Flip it back to `primitive` and show the frame returns to baseline.
4. Assert both directions. A registry that can only go one way is half a seam.

Then leave every real prop on `primitive`. **Nothing ships swapped.**

## 4. WHAT THIS DELIBERATELY DOES NOT DO

- Does not source, adapt, or import any real model.
- Does not change how anything looks.
- Does not restructure missions, the tour chassis, or the save schema.
- Does not decide the git-LFS question — that is now unavoidable (the asset
  tier is ~30 MB and every future model adds to it), but it is its own piece
  and should be decided deliberately, not folded in here.

## 5. WHY A REGISTRY AND NOT JUST A LOADER

A loader alone would let a model replace a primitive's *mesh*. The reason this
is a registry is the other four columns: collider, anchors, material policy and
biome. Those are what actually break when a model arrives, and they are what a
future session — or a future Eric handing a batch of GLBs to a fresh
assistant — needs written down in one place rather than inferred from twenty
call sites.

The test of whether this piece succeeded: when the first batch of real models
lands, adding one should be **editing a registry entry and dropping a file** —
no hunting through `buildWorld`, no re-hooking anchors, no mission
re-verification beyond the standard gate.
