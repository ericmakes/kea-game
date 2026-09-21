# Clip manifest

Measured from `kea_animated.glb`. Durations below are rounded seconds; exact float32 values are in CLIP_MEASUREMENTS.json. Loop is intended playback, not inferred just from matching endpoints. Root motion here means displacement intended to move the actor through the world; local body sway/crouch is not locomotion root motion.

| Clip | Duration (s) | Loop | Root motion | Intended game state | Wing-release weight |
|---|---:|---|---|---|---:|
| Animation_01 | 22.458334 | No; not loop-certified | Yes: legacy skeletal ilium travel; not extraction-ready | Original source sequence, provenance only; do not select automatically | No weight track |
| approved_idle | 1.0 | Yes, held pose | No | Approved static rest/look reference | 0 |
| walk_loop | 1.0 | Yes | No, in place | Ground locomotion, empty bill | 0 |
| flight_loop | 0.6 | Yes | No | Powered wingbeat | 1 |
| beak_tear | 4.2 | No | No; local crouch/reach/recovery | Target-aligned nibble, regrip, pull and release | 0 |
| flight_glide | 1.0 | Yes, held pose | No | Unpowered broad-wing glide | 1 |
| flight_bank_left | 1.0 | Yes, held pose | No | 20-degree left bank; controller turns actor | 1 |
| flight_bank_right | 1.0 | Yes, held pose | No | 20-degree right bank; controller turns actor | 1 |
| watch_idle | 3.0 | Yes | No | Alert ground idle, small head turns/tilts | 0 |
| carry_walk | 1.0 | Yes | No, in place | Ground locomotion with already attached object | 0 |
| carry_idle | 3.0 | Yes | No | Idle with already attached object | 0 |

All ten added clips write translation, rotation and scale for all 101 existing joints, plus mesh node 103 (`Object_168`) morph weights. They are full poses, not additive layers. Animated scales remain equal to the approved pose. Nine motion clips have 30 Hz keys with LINEAR glTF interpolation; approved_idle has two identical endpoint poses. Rotation interpolation is quaternion interpolation in a compliant player.

The original Animation_01 has stationary node 102 `_rootJoint`, but node 83 ilium translates substantially (end-minus-start local coordinates: -380.37448, 168.38649, -165.18527). It must not be treated as an in-place production action. The new clips have no accumulated actor travel. Local ilium sway, pitching and reach still occur.

## Interaction events

Events are animation extras; glTF players do not automatically emit application events. Dispatch them when playback crosses their times, accounting for seeks, interruptions and loop wrapping.

| beak_tear time (s) | Event | Game responsibility |
|---:|---|---|
| 1.05 | beak_grip | Attach target to the existing bill socket |
| 1.62 | beak_regrip | Keep attachment; optional contact sound |
| 2.05 | beak_regrip | Keep attachment; optional contact sound |
| 2.90 | tear_impulse | Decide failure/damage/detachment |
| 3.35 | beak_release | Release held part if game logic requires |

BEAK_GRIP.json identifies node 41 and its local socket. Carry clips assume an already held item; they do not implement pickup. CARRY_ATTACHMENT.json demonstrates a local transform for the unrigged example ball. No new attachment bone is required.

## Controller requirements

- Move the actor during walking: the authored flat-plane stance rate is 9.677419 source-render units per second, multiplied by the existing game asset scale. This is not a metre-per-second specification.
- Keep walk/carry_walk phases aligned; ground-blend.mjs supplies weights, not collision or terrain logic.
- Flight travel, heading and altitude belong to the controller. Bank clips change pose, not the actor's flight path.
- Blend the morph along with the skeletal pose. Avoid applying both procedural wing transforms and full-pose wing tracks without explicit ownership/masking; see EXPORT_CHANGES.md.
- Takeoff, landing, arbitrary target reach, terrain IK, general destruction physics and in-game verification remain integration work.
