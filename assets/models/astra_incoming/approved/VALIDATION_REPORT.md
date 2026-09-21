# Current handoff validation

Baseline: the seven files named and hashed in APPROVED_CHARACTER_LOCK.json, especially the exact approved evaluated POSITION/NORMAL arrays. This is the user's final approved resting character, not Task 3.

## PASS — checked again for this handoff

- All seven locked SHA256 hashes match.
- Both standalone files have 101 skin joints and 4,927 triangles.
- Active base POSITION and NORMAL arrays in both files match the approved arrays byte-for-byte.
- Original BIN prefix is unchanged in both exports. All original buffer-backed data, including embedded image bytes, source animation arrays, skin joint/weight attributes and inverse bind matrices, are therefore preserved.
- Original accessor definitions, nodes, skins, materials, textures, images, samplers, scenes and first-animation JSON match the source. Index/UV/joint/weight payloads also pass direct decoded-byte comparisons.
- No Draco or meshopt. No rig, topology, UV, scale or texture edits were performed in this handoff.
- Exact morph scope: 532 POSITION rows and 532 NORMAL rows out of 3,013; detailed rows/skin influences are in MORPH_VERTEX_SCOPE.csv.
- Re-ran standalone playback comparison: four samples per nine motion clips agree with the established source-plus-correction evaluator, maximum position difference 0.000005659 source-coordinate units.
- Re-ran motion validation: finite rotations, approved constant bone scales, exact loop endpoints, locked file hashes and flat-plane foot constraints pass. Maximum checked planted-foot error is approximately 0.000001807 source-coordinate units.
- Re-ran JavaScript runtime sampler: 483 motion keys and all five interaction events pass.
- Canonical stills were rendered from these actual files using their embedded images and visually reviewed. No image generation or shape edits were used.

Detailed output: HANDOFF_VALIDATION.json, CLIP_MEASUREMENTS.json, STANDALONE_PLAYBACK_VALIDATION.json, MOTION_VALIDATION.json and RUNTIME_VALIDATION.json. GLB_VALIDATION.json and GROUND_REVISION_VALIDATION.json are retained prior-delivery reports; see READ_THIS_FIRST.md for provenance.

## Export accounting

The source has 293 accessors. The new approved standalone has 901: original 293, two approved base arrays and 606 appended idle input/output accessors. These contain repeated static time/pose data; no claim of compact optimization is made. The animated file has 3,347 accessors: original 293, two approved base arrays, two morph arrays and 3,050 animation accessors. Its active POSITION/NORMAL accessors are 293/294; morph POSITION/NORMAL are 295/296. Original source accessors are preserved; active position/normal bindings are redirected. See EXPORT_CHANGES.md for the complete semantic change list.

## Limits and outstanding work

This verifies byte preservation and the stated sampled behaviour, not a game certification. No current game checkout, game loader, procedural wing generator, nine-battery gauntlet or 43-frame tripwire was run. CPU preview lighting may differ from the game renderer. No exhaustive collision/intersection audit or arbitrary-pose morph compatibility test is claimed. Source coordinate transforms were preserved, not standardized to a new metric export.

Rest wing tuck is present at the approved pose. Folding transitions remain an integration check. Tail vane work remains partially unresolved: narrow slots and thin pointed tips are visible. Those imperfections are retained to preserve the approved baseline, not silently fixed.

The wing-open canonical image uses flight_glide with release morph weight 1 in kea_animated.glb. It is not a render of kea_approved.glb with a procedural wing driver. The static approved GLB has no such morph/driver.
