# Kea — Task 1 skin pass

Source: `kea_bill.glb`, MD5 `0d5a2497d4f07067c51d24a288ef1dad`.

## Scope

Texture-only derivative. The new 4096 × 4096 albedo and tangent-space normal replace the two existing embedded PNG image views. The supplied UV coordinates are used exactly; there is no unwrapping, mesh editing, rig editing, export through a modelling application, rescale, or origin change.

The original geometry, UVs, indices, skin weights, inverse bind matrices, bone names/hierarchy/transforms, animations, material settings, samplers, and metallic-roughness image are retained. The source BIN payload is kept byte-for-byte and new image payloads are appended. Only the two image buffer-view offsets/lengths and necessary buffer/container lengths change. Unused original image bytes remain in the container deliberately.

The user’s Task 1 instruction authorizes scalloping in this pass and supersedes P5E’s earlier deferral.

## Surface changes

- New imagegen-painted feather material baked into the original anatomical UV islands: dark-rimmed, staggered scalloped body feathers with fine barbs.
- Pale warm olive/buff breast, olive mantle, finer grey-olive head feathers and emerald upperwing coverts.
- Scarlet-orange underwing coverts with yellow/charcoal barred flight vanes, confined to the separate underside UV islands.
- Gold-orange eye-ring, dark eye, pale grey-tan cere and painted nostril, slate-blue-grey bill, and grey scaly feet.
- Matching mild feather relief in a new tangent-space normal map; no displacement or geometry change.
- Original opacity mask resampled to 4096 to retain the feather silhouettes and existing tail quills.

## Attribution

Derived from “Rockatoo character” by **Macauley.B**, via the project’s `kea_base.glb` and `kea_bill.glb` derivatives.

- Author: https://sketchfab.com/Macauley.B
- Original model: https://sketchfab.com/3d-models/rockatoo-character-1595e8668689427f87cffb2b0daf99e5
- Licence recorded in supplied ledger: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/

This pass changes the textures as described above. Retain the project’s existing in-game author credit. Reference photographs and trailer frames were used for visual guidance and are not bundled in this deliverable.
