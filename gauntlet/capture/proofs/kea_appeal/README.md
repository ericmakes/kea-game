# Kea — tail rebuild + appeal strip (for Eric's pick), 2026-10-03

Built by `tools/kea_lab/build_variants.mjs` from the approved `assets/models/astra_incoming/approved/kea_animated.glb`
(read only), validated by `tools/kea_lab/validate.mjs`. The GLBs are not committed (33 MB each): the builder
rebuilds them byte for byte into `kea_variants_local/` (full 4096 textures) and `assets/models/kea_variants/`
(the game copies, the shipped 2048 images spliced in). Nothing in the game loads them yet.

| file | md5 (full) | md5 (game copy, 2048png) |
|---|---|---|
| kea_animated_A.glb | `24fa5ebb1577b146312d49748023b69c` | `1ab1e692b5f3f4ed0627f26c8cd06055` |
| kea_animated_B.glb | `037f0e8c88ceed66e5dd168cfa47c8ef` | `832c15b8f45081817abe610f18962756` |
| kea_animated_C.glb | `d1302e11d6fba572f7442439959fe4b5` | `5e9053a0d1d33eb64d2f7e8ee8837cc8` |

## 1. The tail (all three variants carry the same one)

The approved tail was three thin straps, three tip caps and two narrow vanes, all rigid on `TailEnd`. Those 786
triangles leave the index buffer; the rump coverts above them (102 triangles) and the seam stay. In their place:
**12 broad overlapping vanes**, a closed fan:

- each vane 0.9 units wide at the root to **2.8 at the tip (~2.7 cm)**, stacked thickness at the root (0.5 thinning
  to 0.1), a soft stepped edge (three small notches, alternating sides), a squared tip with the **dark terminal
  band** (the last 12% UV-mapped to a solid patch of the tail's own green-black, 23,28,24)
- held **level with a slight droop** (8 degrees at the root to 11 at the tip, kea_posture_01), graduated
  (central pair longest, ~5% shorter per rank outward), spread ±15 degrees: 15 units long, 8.1 across
- **weighted to the existing tail bones** exactly as the old tail was: `TailEnd` 1.0 (0.9/0.1 with `Tail` at the
  root), so every clip drives it (all eleven animate those bones). Morph deltas zero.
- it leaves the rump under the crossed wingtips, as a kea's primaries lie over its tail.
- UVs land on paint already in the atlas — **the images are byte-identical**.

Every original vertex row (POSITION, NORMAL, UV, JOINTS, WEIGHTS, both morph streams) is byte-identical; the new
2,808 rows are appended; the 4,141 kept triangles keep their order. 4,927 -> 7,189 triangles.
**Clipping, measured** (tail triangles crossing the rest of the bird, worst of four times per clip): 389 at rest,
87-95 in flight — all within 6 units of `TailEnd`, where the vanes pierce the rump and pass under the folded
wingtips. The approved tail measured 162 / 24 on the same test with 874 triangles (12.8% of the new tail's
triangles against 18.5% of the old at rest; 2.9% against 2.7% in flight).

## 2. The appeal strip — vertex-only edits on A

Only the POSITION and NORMAL payloads differ from A (and those two accessors' min/max, which glTF requires to
be true). Armature, weights, UVs, indices, all eleven clips, the morph and the images are byte-identical —
proved per bufferView in `VALIDATION_B.json` / `VALIDATION_C.json`. Every edit is authored in the rest pose
(approved_idle t=0) and carried back to bind space through each vertex's own skin matrix.

| measured against A (rest pose) | head | eye | bill length | bill depth | body girth |
|---|---|---|---|---|---|
| **A** as approved (0%) | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| **B** asked +12% / +12% / -10% & deeper / +8% | **1.12** | **1.12** | **0.90** | **1.10** | **1.08** |
| **C** asked +20% / +20% / -15% / +15% | **1.20** | **1.20** | **0.85** | **1.20** | **1.15** |

- **Readings taken:** the bill numbers are absolute against A (B's bill is 0.90 the approved length although its
  head grew 12%); C names no bill depth, so its depth follows its head. The eye grows with the head it sits in.
- **Head:** uniform about the Head joint, masked by the head + bill skin weights (the neck blends as it bends).
- **Bill:** the mandible weights select it (the eye is pure Head weight, so it is out exactly); shortening grows
  from the bill's rear edge along the head's forward axis, so the gape stays closed (Task 3's closure holds).
- **Body:** radial about the ilium-neck axis (thighs and the folded wing ride out with it), faded out at the rump,
  so the coverts and the tail are untouched.

## Renders

- `APPEAL_game_vantages_ABC.jpg` — the game's own three cameras (03 standing side, 13 idle preen, 18 folded rear),
  warm low sun (15 degrees, 0xFFC27A), soft shadow, cropped round the bird, beside kea_posture_01.jpg.
- `APPEAL_lab_views_ABC.jpg` — the same three bodies large: side, three-quarter, rear.
- `TAIL_before_after.jpg` — the approved tail against the fan: side, rear, from below, flight_glide.

**Not ours:** a pale patch on the cheek in the 13 preen pose is in the shipped bird too (the pinned 13 shows it).

## Validation files

`VALIDATION_A.json` (A against the approved file), `VALIDATION_B.json` / `VALIDATION_C.json` (against A), and
`build_report.json` (parameters, pivots, hashes).
