# HIGGSFIELD IMAGE-TO-3D REQUESTS — the Carpark's three (Eric, 2026-10-03) — GENERATED AND LANDED 2026-10-04 (see assets/LICENCES.md)

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

# THE SKI FIELD'S THREE (Step 3, the Ski Field pass, 2026-10-04) — GENERATED AND LANDED 2026-10-04 (see assets/LICENCES.md)

Poly Haven, the first route, has no shed, hut or lodge (its only buildings are city facades) and no ski rack. Same
conventions as above. References: Higgsfield `gpt_image_2_5`, one object, plain background, no snow, no text.

| drop the GLB at | reference | spec |
|---|---|---|
| `assets/models/props/ski_lodge.glb` | `ski_lodge_reference.png` (job 321290cc) | **ski_lodge** — single-storey gabled club lodge, **11.6 W × 5.55 H × 7.63 D m** (manifest box), green weatherboard on cream piles, corrugated roof, walls 11 × 7 × 3.0 m on 0.4 m piles (SKILODGE), brick chimney at **x +2.0, z −0.4** (anchor `chimney`, top at y 5.3), three front windows centred at y 2.2, **door near the front-left (anchor `door` x −4.3, y 1.4, z +3.53, on +Z)**, roof ridge at the `roof` anchor (y 4.32), origin ground contact, tier **A: 6,000 tris** (primitive 162). The deck, racks and drift are separate props — not in the model |
| `assets/models/props/tow_shed.glb` | `tow_shed_reference.png` (job 3273ff85) | **tow_shed** — corrugated-iron rope-tow shed, **3.4 W × 2.2 H walls × 2.6 D m, roof 3.8 × 3.0 to 2.51 m** (manifest box 3.80 × 2.51 × 3.00; collider 3.4 × 2.6, top 2.2), the **shuttered ticket window on +Z centred at y 0.75** (anchor `window`, z +1.34), origin ground contact, tier **B: 2,500 tris** (primitive 36). The bullwheel (anchor `wheel`, behind on −Z) is the map's own geometry — not in the model |
| `assets/models/props/gear_rack.glb` | `gear_rack_reference.png` (job ce4878f4) | **gear_rack** — timber A-frame ski rack, **2.40 W × 1.00 H × 0.71 D m**, top rail at **y 0.995** along its length (anchor `rail`; its collider is the map's rail, not the model's), origin ground contact, tier **B: 2,500 tris** (primitive 72); placed **three times**, so one download and one budget |
