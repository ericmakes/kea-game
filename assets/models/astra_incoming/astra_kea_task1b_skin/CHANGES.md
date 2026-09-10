# Kea — Task 1b colour and detail correction

Source model: `kea_bill.glb`, SHA-256 `a83f9af2c7f853f1212dadc2263faa452750da5fa48c9d4dfc711448b169c32b`.

This is a texture-only revision of Task 1. The source mesh, indices, UV coordinates, skin weights, inverse bind matrices, joint names and hierarchy, node transforms, animations, material settings, samplers and metallic-roughness image are retained. The original BIN payload is preserved byte-for-byte. New albedo and normal PNG payloads are appended, and only their image buffer-view offsets/lengths and necessary container/buffer lengths are updated. No modelling application export, unwrap, scale, origin or rig operation is involved.

## Revised paint

- Warmer, deeper bronze/brown-olive body palette, reviewed beside `kea_head_01.jpg`, `kea_posture_01.jpg` and `kea_underwing_01.jpg`.
- New irregular overlapping body feather artwork, with different coarse and fine fields for back/shoulders and neck/chest. Fine streaky head artwork replaces the round head scales in both colour and relief.
- Enlarged dark eye and thicker, brighter orange-gold ring, registered to the existing eye socket.
- Broader pale orange-yellow cere, soft feather boundary, clear painted nostril and warm ochre cheek wash.
- Deep slate-blue-grey bill with a near-black tip and lighter cutting edge.
- Broader scarlet-orange inner coverts. Finer, denser black-on-yellow-ochre flight-feather barring is confined to the outer vanes, subject to the unchanged folded-pose visibility constraint documented in `README.md`.
- Less saturated upperwing green, feather detail and a softened bronze transition at the root.
- Green dorsal tail feathers and a dark terminal band; no mesh correction is included.
- Task 1 feet and grey shins retained, including their normal-map detail and the original opacity channel.

The delivered normal map is tangent-space relief derived from the revised feather detail. Pigment-only colour changes such as underwing bars do not create geometric ridges. Texture detail cannot alter the silhouette or move facial anatomy.

## Attribution

Derived from “Rockatoo character” by **Macauley.B**, via the project's recorded model derivatives.

- Author: https://sketchfab.com/Macauley.B
- Original model: https://sketchfab.com/3d-models/rockatoo-character-1595e8668689427f87cffb2b0daf99e5
- Licence recorded in the supplied ledger: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/

Retain the project's existing author credit. The reference photographs and trailer frames guided the paint and are not bundled in this deliverable.
