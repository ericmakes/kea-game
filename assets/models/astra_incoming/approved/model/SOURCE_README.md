# Kea — local face refinement, 3q

This revision softens the forehead-to-cere slope and tucks a small mouth web inward. It retains the preceding 3p body, wing, tail and texture work. The first, stronger forehead trial was rejected because it introduced a sharp corner; the smaller broad curve is the delivered version.

## Use the matching runtime pair

**Load `model/kea_reference_shape.glb` with `runtime/kea_rest_wing_correction.json` through the included `runtime/wing-rest-correction.mjs`. The GLB alone does not contain the revised resting shape.**

The source GLB and adapter are byte-identical to 3p. The source retains 101 joints, 4,927 triangles, 293 accessors, all UVs, weights, inverse bind matrices, node transforms, stored animations, materials and embedded images. No compression, rewrapping, rig changes or texture edits were introduced. The two separate PNG textures remain 4096 × 4096 and byte-identical.

At full correction, this pass changes 121 POSITION rows and 118 NORMAL rows relative to 3p's actual corrected arrays. Crown maximum height and global standing bounds remain unchanged. The demonstrated standing pose is animation 0 at 3.5 seconds, correction weight 1. Weight 0 restores the exact source geometry.

## Review the result

- `preview/REFERENCE_COMPARISON_TEXTURED.jpg` and `REFERENCE_COMPARISON_CLAY.jpg`: supplied gallery, previous 3p and new actual renders in six comparison rows.
- `preview/head_turntable.mp4` and `body_turntable.mp4`: 36 rendered camera angles each.
- `preview/textured`, `preview/clay` and `preview/extra`: 17 fixed views in both modes.
- `review/REVIEW.md`: retained improvements, rejected trials and remaining limits.
- `validation/`: byte identities, exact changed rows, five-weight surface/contact checks and script replay evidence.

All previews come from the actual GLB and exported adapter arrays. Gallery cameras are approximately matched; the gallery's oblique head image is only a consistency reference for our straight-front view. No exact reconstruction or perfection claim is made.

## What passed

At weights 0, .25, .5, .75 and 1, the actual adapter and local surface checks pass. Relative to 3p there are no new seam increases, collapsed triangles, skin singularities, rotations over 90 degrees, worsened normal-orientation flags or strict contact pairs in the edited scope. At full rest, 16 prior mouth-related contact pairs are resolved, including 827/4221. This does not mean the whole bird is intersection-free: preceding feather-layer overlaps outside the edit remain.

The complete geometry scripts reproduce the delivered corrective JSON byte-for-byte, and their actual runtime export matches all ten delivered POSITION/NORMAL arrays. `README_REPRODUCE.md` gives the commands.

## Remaining limits and game integration

Coarse collar/head facets, some feather seams and narrow tail slots remain. The face is closer to the reference but is not its exact mesh or camera-calibrated shape.

The earlier orange shoulder strip at partial correction remains. The lower body/wing geometry is exactly preserved; this pass does not claim to fix that transition. New quarter/half textured controls show it explicitly. A scalar correction weight applied to a fixed standing pose is a diagnostic, not a verified live animation transition.

Live-game verification could not proceed: access to the referenced GitHub branch was blocked in this environment. No game code was changed. To finish integration, supply the current game checkout, including the model loader and animation controller. The existing adapter still needs to be scheduled consistently with the actual wing pose and faded out for flight.

## Attribution

Modified from **Rockatoo character by Macauley.B**, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Modifications include the project's preceding work and this local resting-shape revision. No endorsement is implied.

- [Original character](https://sketchfab.com/3d-models/rockatoo-character-1595e8668689427f87cffb2b0daf99e5)
- [Creator](https://sketchfab.com/Macauley.B)

The user-supplied [3d_molier / TurboSquid Kea Parrot Bird gallery, 716834](https://www.turbosquid.com/3d-models/3ds-max-kea-parrot-bird/716834) is the shape reference. No commercial mesh or texture atlas was incorporated.
