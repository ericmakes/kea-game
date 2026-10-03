# HIGGSFIELD IMAGE-TO-3D REQUESTS — the Carpark's three (Eric, 2026-10-03)

Eric: "Bench, wheelie bin and DOC board go to Higgsfield image-to-3D: produce a clean reference image and a one-line
spec for each from MODEL_MANIFEST (dimensions, origin, budget) ... I will run the generations and drop the GLBs back in."
Poly Haven, the first route, had none of the three (SPIKE_ADOPT 11). These are SPIKE_ADOPT 20, BLOCKED-awaiting-generation.

The reference images were generated with Higgsfield `gpt_image_2_5` (job ids below): one object, three-quarter front,
seamless light-grey background, even light, no text or logos.

## The three specs (one line each; MODEL_MANIFEST §1 conventions apply to all: binary .glb, +Y up, **+Z is the front**, metres, scale 1.0, origin at ground contact under the footprint centre, JPEG/PNG maps embedded at 1024², one MeshStandardMaterial where possible, **no Draco / meshopt / KTX2**)

| drop the GLB at | reference | spec |
|---|---|---|
| `assets/models/props/bench.glb` | `bench_reference.png` (job a6eecf6f) | **bench** — weathered timber park bench, **1.90 W × ~1.21 H × 0.59 D m** (manifest box 1.96 × 1.28 × 0.59), **seat top at 0.62 m** across its whole length (collider 1.9 × 0.6, top 0.62; anchor `seat` 0.62; Tom naps lying along it), backrest on −Z, origin ground contact, tier **B: 2,500 tris** (primitive 4,200) |
| `assets/models/props/bin.glb` | `bin_reference.png` (job 4d4d8751) | **bin** — round green litter bin, **0.90 Ø × 1.20 H m** to the lid top (manifest box 0.97 × 1.30 × 1.00; collider 0.95 × 0.95, top 1.20; anchors `lid` 1.10, `body` 0.70, `mouth` 1.30), origin ground contact, tier **C: 1,200 tris** (primitive 802). **THE LID MUST BE ITS OWN NODE named `lid`, pivot on its rear rim edge (−Z, y ≈ 1.10)** — PECK BIN LID flips it open |
| `assets/models/props/doc_board.glb` | `doc_board_reference.png` (job c13398b2) | **doc_board** — trailhead board, **2.20 W × 2.45 H × 0.21 D m**, two posts at x ±0.90, green panel 2.20 × 1.10 centred at y 1.90 (1.35–2.45), **panel face blank** and facing +Z (anchor `face` at y 1.90, z +0.07), origin ground contact, tier **B: 2,500 tris** (primitive 68) |

## What the game still has to do when they land (so nobody is surprised)

- **bench and doc_board** swap through the P6A seam as the picnic table did: `source:'model'`, the url, a measured
  `fit` (per-axis `fit.size` to the collider if the proportions come back off), the harness's named batch gains the
  id, LICENCES gains the row. Colliders and anchors do not move — the model fits them.
- **bin is not a drop-in.** PECK BIN LID tweens the PRIMITIVE's lid (`p.lid.rotation.z`, `.position`), and TIP THE BIN
  rotates the whole group. A swapped model hides the primitive, so its lid would never open: `models.mjs` has to bind
  the model's `lid` node to the tween first (MODEL_MANIFEST §1: props have no sub-node binding today). That is a
  seam change and its own piece.
- Every GLB goes through the gate's checks (plain GLB, float geometry) — if Higgsfield returns Draco or meshopt it is
  decoded to plain first, as `tools/derive_tree.mjs` did for the spike's trees.

## The reference images ship in dist

`assets/` is Vite's publicDir, so these three PNGs (3.8 MB) are copied into `dist/` on every build. They are here
because Eric named this folder; move them out of `assets/` (as `astra_archive/` was) once the GLBs are in.
