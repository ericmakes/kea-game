# Ground motion revision — 11 September 2026

Reference: uploaded *Kea - Iconic New Zealand Alpine Parrot.mp4*, reviewed using the extracted frame sequences. The character remains the user-approved locked version.

| Reference | Finding | Implemented response |
|---|---|---|
| 00:32.36–00:35.72, roof contact | Low working posture; bill angle changes repeatedly while contact stays near the surface. | Replaced the old 2.5-second two-pull action with a 4.2-second crouch, angle adjustment, nibble/regrip and single pull/release sequence. The upper-bill tip remains stationary through the contact interval. |
| 00:35.8–00:37.28, edge contact | Small head movements are useful in addition to large tugging. | Three small jaw-opening pulses during the contact phase, with changing yaw/roll and brief holds. |
| 01:14–01:18.12, pursuit | Watching and short movement bouts alternate; wings stay folded. | Added watch_idle, retained folded wings, revised the walk with body sway, lower foot clearance and a longer support interval; supplied actual pose-blend preview of watch/start/walk/stop. |
| 01:26.96–01:28.9, carrying | Object remains at the bill while posture changes. | Added carry_walk and carry_idle, an unrigged toy ball and an attachment matrix derived from the existing bill joint. |

The specific 62% stance fraction, 1-second gait cycle, joint angles, nibble timing and final tear are authored choices. The edited reference does not support calibrated gait measurements or show an unambiguous complete material failure sequence. This is reference-informed animation, not extracted motion capture.

## Visual review

Front, side and three-quarter renders were checked at the working poses, pull and carry. See previews/ground_qa.jpg. The contact point remains stable while the head changes angle. The held ball slightly overlaps the hook tip to avoid an apparent gap. Walking has reduced foot lift and a small weight shift instead of the former nearly stationary torso.

The side view makes an important limitation clear: the supplied fixture is a vertical paper strip at beak height, whereas the clearest source shows a bird working down at a roof surface. The new clip captures the contact adjustments and lower posture; it is not a matched reconstruction of the roof setup. A target-height/terrain solver is still needed for arbitrary gameplay targets. The unrigged paper demonstration remains scripted, not physical vehicle damage.

Ground_locomotion.mp4 demonstrates blending the exported clips in place. World translation, turning, terrain adaptation and any foot locking during mixer transitions remain game-controller responsibilities. The pure walk/carry stance targets and stationary interaction feet are verified separately. Carry clips assume an object is already held; no pickup animation is claimed.

Flight clips are unchanged from the prior trailer-based revision. No geometry, UV, normal-map, albedo, skin-weight, rig-definition or inverse-bind edit was made.

## Validation

- All approved/model hash checks pass.
- All original accessor bytes and the approved base/morph geometry remain identical to the prior animated GLB.
- Original animation, approved_idle and all four flight clips are unchanged.
- Walk and carry stance-foot targets, and stationary interaction feet, match to less than 0.0001 source-coordinate units at sampled keys.
- Contact tip drift during the working interval is below 0.0001 source-coordinate units.
- The exported carry attachment reproduces the preview ball center; the prop has no skin or bones.
- The runtime sampler checks all 483 motion keys and the five interaction events.

See GROUND_REVISION_VALIDATION.json, MOTION_VALIDATION.json, GLB_VALIDATION.json, RUNTIME_VALIDATION.json and STANDALONE_PLAYBACK_VALIDATION.json. These checks are not an exhaustive self-intersection audit or a live-game integration test.
