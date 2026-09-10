# Kea — Task 1b skin revision

## Deliverables

| File | Purpose |
|---|---|
| `kea_albedo_4096.png` | 4096 × 4096 RGBA albedo, sRGB; Task 1 opacity retained exactly. |
| `kea_normal_4096.png` | 4096 × 4096 RGB tangent-space normal; linear/non-colour. |
| `kea_bill_skin.glb` | Original `kea_bill.glb` with only the two embedded image payloads replaced. |
| `renders/01_head_closeup.png` | Actual model, head detail. |
| `renders/02_full_body_side.png` | Actual model, folded side view. |
| `renders/03_folded_wing_rear.png` | Actual model, folded rear view. |
| `renders/04_wings_open_underwing.png` | Actual model, open underwing view. |
| `VALIDATION.json` | GLB byte-preservation checks and hashes. |
| `INDEPENDENT_MODEL_AUDIT.json` | Independent verification of the model and embedded images. |
| `TEXTURE_VALIDATION.json` | Bake parameters, colour statistics and preservation checks. |
| `INDEPENDENT_TEXTURE_AUDIT.json` | Independent checks of PNGs, exact Task 1 feet/alpha and tangent-normal vectors. |
| `renders/folded_red_qa.json` | Folded-view red checks and their scope. |
| `CHANGES.md` | Revision details and original model attribution. |
| `PAINT_PROVENANCE.md` | Reference-driven source artwork and UV bake method. |
| `SHA256SUMS.txt` | File checksums. |

The GLB remains plain binary glTF 2.0 with embedded PNG images and uncompressed geometry. It keeps the original material and metallic-roughness image. Nothing is re-exported through a modelling application.

## UV and fixed-model limitations

| Area | Constraint and treatment |
|---|---|
| Eyes | Both sides share UV pixels. The Task 1 43 × 48 pixel ring was a paint footprint rather than a strict UV allocation ceiling; this revision uses about 66 × 71 pixels for the outer ring and 43 × 47 for the dark eye. Its geometric position and shape remain unchanged. |
| Cere and nostril | The cere crosses the existing bill/head transition. Soft paint improves the junction, but the nostril is painted detail and the bill's outline remains the supplied geometry. |
| Underwing | Upper and lower wing charts are separate, but the original folded animation exposes part of the lower chart. Orange on those pixels would show when folded. The revision enlarges the orange covert area while retaining four-view visibility protection, with two extra pixels of sampling padding at the 2048 audit scale. The protected region covers about 54% of the underside chart and intersects about 44% of the intended scarlet covert sheet; those patches remain muted bronze/olive. These are UV-area measurements, not projected wing-area measurements. A fully scarlet inner sheet together with zero red in this folded pose cannot be achieved by a static texture alone. |
| Symmetry | Mirrored wings, facial sides and feet share texture pixels. Independent left/right paint is unavailable without a UV change. |
| Feather edges | The original 512² opacity silhouette is preserved from Task 1. The 4096 maps add surface detail but cannot create separated feather geometry or recover missing edge resolution. |
| Tiny UV scraps | Several small scraps overlap unrelated anatomy. They retain neutral paint to avoid detail bleeding onto other parts. |
| Tail | Green dorsal paint and the terminal band are prepared on the existing charts. The narrow tail rods remain. Eighteen endcap triangles collapse to UV(0,0), so distinct endcap detail is unavailable. |

## Renders and verification scope

The four PNGs render the actual model and its embedded textures under the same neutral daylight review lighting and cameras as Task 1. They use the original `Animation_01`: folded views at 3.5 seconds and open wings at 0.2 seconds. Render-only camera/orientation adjustments are recorded in `renders/render_metadata.json` and are never written into the model.

The handoff does not include the game renderer, procedural pose implementation or fixed screenshot camera settings. These are the requested four review views, rather than pixel-matched reproductions of gameplay screenshots. Folded red checks apply to the documented original animation pose and review views; they do not claim coverage of every possible runtime pose.

The head, posture and underwing plates were inspected beside the renders. Their exposure and lighting are not calibrated albedo measurements; the comparison guides hue, value and feather morphology under fixed review lighting.
