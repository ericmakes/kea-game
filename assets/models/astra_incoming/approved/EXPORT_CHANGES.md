# Export changes and procedural rig contract

## Authoritative baseline

The approved character is the combination recorded by APPROVED_CHARACTER_LOCK.json: the original source GLB plus exact evaluated position/normal arrays and the locked correction data. It is NOT the historical Task 3 GLB. All seven locked file hashes were rechecked in this handoff.

`kea_approved.glb` is a newly packaged standalone representation of that already approved shape, not a new sculpt or a previously approved whole-file byte identity. Its active POSITION/NORMAL bytes equal model/actual_position_1.bin and model/actual_normal_1.bin exactly. The new file hashes are in CHARACTER_HASHES.json, SHA256SUMS.txt and MD5SUMS.txt.

The original file `model/kea_reference_shape.glb` alone does not show all the approved corrections. Do not substitute it for kea_approved.glb.

## All changes beyond animation tracks

### Source GLB -> standalone approved character

- Preserve the entire source BIN prefix and original accessor/bufferView definitions.
- Append POSITION and NORMAL arrays at accessors 293 and 294 and redirect the sole mesh primitive to those arrays. These bake the exact locked correction; no mesh resculpt was performed for this handoff.
- Append a static `approved_idle` animation copied from the existing animated deliverable, without its morph-weight channel. It preserves the approved skeletal pose originally sampled at source animation time 3.5 seconds, including the head tilt. Select this clip at t=0 for canonical rest; bind pose is not the approved presentation pose.
- Extend bufferViews/accessors and buffers[0].byteLength; serialize updated JSON and GLB chunk lengths/padding. Original data remain present, including the original Animation_01.
- No morph is added to kea_approved.glb. No node transforms, hierarchy, inverse bind matrices, joint/weight arrays, topology, UVs, tangents, embedded images, materials, samplers, scenes, source animation data, compression or asset scale changes.

### Approved base -> kea_animated.glb

The delivered animated GLB is byte-for-byte the recovered September 11 motion deliverable; it was not re-exported in this handoff.

- Same exact approved active POSITION/NORMAL bytes, same UVs/weights/indices and rig data.
- One primitive morph target: `flight_wing_release`. POSITION accessor 295; NORMAL accessor 296. Mesh-level default weights `[0]`; mesh extras targetNames records the name. No new bones or altered skinning.
- Append ten named clips (including approved_idle), channel/sampler metadata, loop/event extras, and supporting accessors/bufferViews. The original source animation is retained.
- Buffer lengths/JSON/chunk layout differ. Newly constructed approved GLB and existing animated GLB use different appended accessor numbering for animation data; whole-file equality is neither expected nor claimed.
- No image swap, texture repaint, material change, coordinate conversion, rescale, origin shift, Draco or meshopt was introduced. Legacy source transforms remain; keep the game's existing asset-scale conversion.

## Wing-release morph: exact scope

The morph changes POSITION and NORMAL on **532 of 3,013 vertex rows**. `MORPH_VERTEX_SCOPE.csv` lists every affected zero-based vertex row, all delta components, partition weight, and every existing skin influence on that row. It is the precise scope, including blended shoulder-adjacent rows; this is not a hand-selected anatomical mask.

The partition weight is the sum of existing skin weights assigned to these node indices:

| Node index | Existing bone name |
|---:|---|
| 34 | cockatoo_Metacarpus_l_bone_075 |
| 35 | cockatoo_Ulna_l_bone_074 |
| 36 | cockatoo_Humerus_l_bone_073 |
| 37 | cockatoo_Metacarpus_r_bone_072 |
| 38 | cockatoo_Ulna_r_bone_071 |
| 39 | cockatoo_Humerus_r_bone_070 |

No bone is itself deformed or changed by the morph. Vertices are displaced in mesh coordinates BEFORE ordinary skeletal skinning. Some affected vertices also carry non-wing bone influences, listed in the CSV.

For each corrected row, with source position S, locked correction D and summed wing influence w, the released endpoint is `S + D * (1-w)`. The stored morph POSITION delta is that endpoint minus the exact approved position. Normals use the normalized blend between source and corrected normals at the same retained correction fraction; the stored NORMAL delta is the released normal minus approved normal. Float32 endpoint reconstruction is checked by the supplied validation.

This releases the wing-weighted part of the prior rest correction and retains other shape corrections. It does not create feather vanes, re-rig wings, detect collisions, or automatically produce an anatomically valid fold.

## Driving it

- Mesh node: 103, `Object_168`. Target index: 0.
- Weight 0: approved folded-rest base.
- Weight 1: flight-ready released endpoint.
- All added ground clips explicitly key 0; all four flight clips explicitly key 1.
- Blend pose and morph together on state changes. The older external correction uses the opposite convention (`wingRestWeight` 1 = folded). Do not confuse those values.
- Do NOT apply `wing-rest-correction.mjs`, kea_motion_shape.json or the legacy shape adapter to either standalone GLB. The approved correction is already baked; applying it again doubles the correction.

## What happens during procedural wing poses

The morph has no bone-angle driver. A procedural rotation of a wing bone does not change its weight. Weight 0 under an open-wing procedural pose carries the folded correction into that pose and may bunch, overlap or distort geometry. Weight 1 under the standing folded skeleton releases the correction without folding the wing; gaps, shoulder colour exposure or a different silhouette may result. Intermediate combinations are unverified in the actual game.

All added clips write all 101 joints. A procedural rig writing those same transforms can fight with or overwrite the mixer. Integration must choose ownership: mask the baked wing channels if procedural flight owns them, or let the clips own the wings. Apply intentional procedural overlays in a defined order, and provide ONE owner of the morph weight. If procedural code owns the weight, remove/mask the weight tracks at runtime or set the value after the mixer consistently.

For procedural flight, weight 1 is the intended starting endpoint; test the actual procedural poses. For approved standing rest, use approved_idle and weight 0. There is no certified mapping from arbitrary procedural wing angles to intermediate morph weights. Recompute suitable bounds/culling envelopes for animated wings; static accessor bounds are not a complete flight envelope.

## Props and previews

The ball and paper fixtures are separate unrigged demonstration GLBs, not additions to the bird. Paper deformation is scripted; gameplay must implement target selection and failure/detachment. Four new canonical stills use the actual decoded mesh and embedded textures. Head, side and rear render kea_approved.glb with approved_idle; wings_open renders kea_animated.glb with flight_glide and morph 1. The open image is explicitly a flight-state diagnostic, not a claim that the static approved file includes a wing-opening driver.
