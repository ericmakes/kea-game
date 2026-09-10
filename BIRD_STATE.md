# BIRD_STATE.md — the bird is PARKED, and this is how it resumes

Repo root, branch `replat-b`. Written 2026-09-10 at the end of the Astra revision drop, so that the
bird can be picked up in one line months later without re-deriving anything.

## RESUME IN ONE LINE

```
KEABIRD='{"model":true,"url":"models/astra_incoming/astra_kea_task3_face_geometry/kea_bill_face_geometry.glb"}' npm run dev
```

That is the whole switch. `KEABIRD.model` is **false** by default in `src/game.mjs`, so every pinned
vantage and every battery still sees the primitive bird they were calibrated on; `G.bird` reports
`{mode:'primitive', why:'KEABIRD.model is off'}` and node never loads a GLB at all. The shipped
`url` remains `models/kea_bill.glb`. **Nothing in this drop is loaded by the game.**

## WHAT IS APPROVED

| | |
|---|---|
| **the 1c texture** | colour, scallops, coverts and barring. Eric's approval, from the renders |
| **Task 3's closed gape** | the rest and folded poses show no exposed red mouth lining |
| **Task 3's shortened bill** | shorter, continuously hooked, lower mandible a shallow tucked wedge |

## WHAT IS PENDING

| | what is wrong | whose problem |
|---|---|---|
| **Task 3b — skull rounding** | the head reads as a **raptor**. The eye is too large and the cere is too big | geometry (POSITION/NORMAL) |
| **the neck feather-size gradient** | feather scale does not grade down the neck | texture |
| **Task 2 — tail vanes** | the tail renders as bare quills with no vane | geometry, and possibly alpha |
| **the wing-fold rest pose** | wings sit as **flat plates with the underside exposed** | **rig-side, not geometry or texture** — see below |

**THE WING FOLD IS NOT AN ASSET PROBLEM AND MUST NOT BE SENT OUT AS ONE.** The mesh and the skin are
fine; the rest pose the game samples is wrong. `src/bird.mjs` sets it by seeking `Animation_01` to
`BIRD.restT` and reading the pose there — one clip, one time value. Fixing it is our side of the
seam: either a better `restT`, or a authored fold pose. Asking a texture or geometry pass to fix a
pose would get a re-rigged file back, and the automated gate rejects any change to the armature.

## THE BLOCKER, AND IT IS THE FIRST THING TO SETTLE

**THE APPROVED 1c TEXTURE IS NOT IN THIS TREE, OR ANYWHERE ON THIS MACHINE.**

Three drops arrived: Task 1, Task 1b and Task 3. Searched `~` to depth 4 and `~/Downloads`: there is
no `1c` directory, no `1c` GLB and no `1c` PNG pair. Task 3's own README states the position from the
other side — *"The user confirmed a geometry-only delivery on Task 1b, with the approved Task 1c
images to be embedded in their pipeline"* — i.e. Astra was told we hold 1c and would embed it. We do
not hold it.

So the approved paint cannot be applied, and **Task 3's GLB carries Task 1b's images, not 1c's.**
Two ways forward, both Eric's call:

1. **get the 1c drop** (albedo + normal 4096 PNGs, or a GLB carrying them), then apply the guarded
   patch below; or
2. **promote 1b** as the paint of record and re-approve from its renders.

## THE GUARDED 1c PATCH

Task 3 ships `astra_kea_task3_face_geometry/head_patch/` precisely because of the gap above: a sparse
POSITION+NORMAL patch that can be applied to a *different* GLB that already carries the 1c images,
instead of taking Task 3's whole file with 1b's paint baked in.

```
cd assets/models/astra_incoming/astra_kea_task3_face_geometry/head_patch
python3 apply_head_patch.py INPUT_1c.glb head_patch.npz OUTPUT.glb    # needs numpy
```

**IT IS GUARDED, WHICH IS WHY IT IS SAFE TO KEEP AROUND.** It verifies the affected head's original
POSITION and NORMAL values, the UVs, the indices and the skin weights before it writes, and stops if
any of them differ. It never rewrites textures or metadata and leaves a validation JSON beside the
output. Run `gauntlet/verify/glbdiff.mjs OUTPUT.glb --expect posnorm` against the 1c input afterwards
anyway — the patch checking itself is not the same as us checking it.

## WHAT WAS VERIFIED, SO IT IS NOT RE-DERIVED

By `gauntlet/verify/glbdiff.mjs` (18-check selftest, controls both directions). **All three
deliveries ACCEPT.**

| delivery | baseline | expectation | result |
|---|---|---|---|
| Task 1 | `kea_bill.glb` | images only | **ACCEPT** — 0 of 293 accessors moved |
| Task 1b | `kea_bill.glb` | images only | **ACCEPT** — 0 of 293 accessors moved |
| Task 3 | **Task 1b**, not `kea_bill.glb` | POSITION+NORMAL only | **ACCEPT** — zero JSON changes at all |

- Task 3's baseline is Task 1b. Verified against `kea_bill.glb` it would show both images and
  geometry moving; the honest decomposition is the chain above, and both links check out.
- Task 3 moved **443 of 3,013 vertices**, confined to 15% of the model's x span, 7% of z and the
  upper 38% of y. A head — verified here, not taken on trust.
- Topology, UVs, skin weights, inverse bind matrices, **all 101 joint names**, hierarchy, animation
  and the metallicRoughness image are provably untouched in all three.
- Their own `SHA256SUMS.txt`: **72 of 72 OK**. Their declared source hash for `kea_bill.glb`
  (`a83f9af2c7f8…`) matches ours. Task 3's declared baseline (`a119267fab2b…`) matches Task 1b's
  actual file.

## WHERE EVERYTHING IS

```
assets/models/kea_bill.glb                        the bird the game loads   md5 0d5a2497…
assets/models/kea_bill_uv_layout.png              2048² UV layout for painting
assets/models/astra_incoming/
  astra_kea_task1_skin/kea_task1_skin/            Task 1   glb md5 e708f7ff…  superseded
  astra_kea_task1b_skin/                          Task 1b  glb md5 61cf9977…  Task 3's baseline
  astra_kea_task3_face_geometry/                  Task 3   glb md5 14252546…  + head_patch/
```

Licence rows for all three are in `assets/LICENCES.md`: derivatives of the CC-BY 4.0 rockatoo chain,
Macauley.B credited, with the paint and the vertex edits recorded plainly as **AI-generated by
OpenAI GPT-6 Astra at Eric's direction**. Two byte-identical duplicates were removed rather than
committed, one of which had been sitting loose in `assets/models/` since 2026-09-09 and was found by
the ledger's own law going red.

## THE STANDING CONSTRAINTS

- **The bird is PARKED.** Do not touch bird face, tail, underwing, trees, vehicles, humans or hero
  props on the way past. This file is a record, not a licence to resume.
- **Preserve the armature exactly.** 101 joints in, 101 joints out. The game binds animation by bone
  NAME and the gate rejects any change to it — `glbdiff.mjs` catches a single renamed joint.
- **The externally generated `kea_astra.glb` harvest was REJECTED** and must not be re-attempted. It
  stays in the tree as a licensed source artifact the game never loads.
- **No asset lands without its licence line**, recorded at import time.
