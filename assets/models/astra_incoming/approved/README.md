# Approved kea — animation pack

The user-approved bird is locked in model/ and APPROVED_CHARACTER_LOCK.json. Its original GLB, shape corrections, evaluated POSITION/NORMAL arrays, skin weights, rig definitions and textures are preserved. Motion work does not revise the sculpture.

## Start with kea_animated.glb

This is a self-contained plain GLB with embedded textures, the exact approved evaluated geometry as its base, 101 joints and 4,927 triangles. Select one of these animation clips:

| Clip | Duration | Playback |
|---|---:|---|
| approved_idle | 1.0 s | Repeat; still approved pose, including the head tilt |
| walk_loop | 1.0 s | Repeat; in-place alternating steps, planted stance foot |
| flight_loop | 0.6 s | Repeat; wingbeat, forward body attitude, tucked feet |
| flight_glide | 1.0 s | Held broad-span glide pose |
| flight_bank_left | 1.0 s | Held glide with 20-degree left bank |
| flight_bank_right | 1.0 s | Held glide with 20-degree right bank |
| beak_tear | 4.2 s | Once; crouch, nibble/regrip, pull, release and recover |
| watch_idle | 3.0 s | Repeat; attentive head turns and tilts |
| carry_walk | 1.0 s | Repeat; walking with a held object |
| carry_idle | 3.0 s | Repeat; looking around while holding |

The original Animation_01 is also retained unchanged for provenance. Choose the named clips above to see the new motions.

The latest flight revision follows sampled inspection of the supplied Birds of War trailer. It adds glide/bank states and flattens the previously upright flight wing planes. `previews/flight_states.mp4` demonstrates 0.24-second pose blends; `flight-blend.mjs` provides engine-independent target weights. Travel and steering still belong to the game. See MOTION_REFERENCE_REVIEW.md for the preceding flight evidence and GROUND_MOTION_REVIEW.md for current ground evidence and limits. The subsequently uploaded kea video has now informed the ground revision; see GROUND_MOTION_REVIEW.md. Flight remains unchanged in that revision.

The animation GLB already contains the approved shape. **Do not apply the earlier shape adapter to kea_animated.glb**, which would apply the correction twice. A single standard glTF POSITION/NORMAL morph target releases the existing folded-wing correction during flight. Its weights are driven by the supplied clips. The original rig, UVs, skin weights, triangles, materials, textures and animation remain intact; new base POSITION/NORMAL accessors exactly match the approved evaluated arrays. No Draco or meshopt, new bones, rewrapping, remeshing or rigged props are used.

The model's existing transforms are preserved. Apply your existing asset-to-game scale and +Z movement convention. The paper prop is authored in metres, with its origin at the support's ground contact and +Z front.

## Beak interaction

BEAK_GRIP.json gives the exact existing node and local point for a grip socket at the approved bill tip. The clip emits:

- 1.05 s: beak_grip
- 1.62 s: beak_regrip
- 2.05 s: beak_regrip
- 2.90 s: tear_impulse
- 3.35 s: beak_release

Keep the attachment active through beak_regrip events; these mark small contact/jaw adjustments, not release.

Use these to attach/release a selected object and trigger damage, sound and debris in your game. The supplied paper_tear_demo.glb is an unrigged 10-triangle prop. paper_tear_motion.json and paper-tear-player.mjs reproduce the scripted tearing seen in the preview: its centre strip stretches free, follows the bill, then drops. This is a visual interaction example, not a general-purpose destruction physics system. Its JSON contains the transform that places the metric prop into the original bird render coordinate space; adapt placement to your scene.

## Carrying

carry_ball.glb is an unrigged, 120-triangle, 5 cm toy ball with embedded textures and its origin at the bottom. CARRY_ATTACHMENT.json supplies a column-major local matrix: parent the prop root to the named existing bill joint and apply that matrix. It accounts for the legacy asset transforms, so retain your usual bird scale above both objects. Detach the prop when gameplay releases it. Carry clips assume the object is already held; a pickup sequence is not included.

## Locomotion integration

Walk is in-place. The authored stance advances backward at 9.677419 source-render coordinate units per second; move the character forward by that rate multiplied by your existing source-to-world scale. This is approximately 0.18 of the rendered bird height per second; this value is not metres per second. Feet are solved for a flat stance plane; your controller supplies navigation, terrain adaptation and collision.

ground-blend.mjs supplies target weights for watch/walk and carry-idle/carry-walk. Keep the two walking actions synchronized and blend over about 0.2 seconds. Crossfade named actions through the game's existing animation system. The locomotion preview demonstrates pose blending in place, not controller movement. Takeoff/landing transitions, target-reaching for arbitrary objects, terrain IK, sounds and gameplay damage are not included in this pack. The wing-fold morph should be blended along with the skeletal actions.

## Files and verification

previews/ contains actual skinned-model movie renders. approved_idle and the ground motions use the exact locked shape; flight releases only the prior wing-rest contribution. Original beak/head geometry is not resculpted. Model animation uses the existing bones; the source definitions and inverse bind matrices are unchanged.

GLB_VALIDATION.json checks the approved evaluated arrays, original binary prefix, rig, indices, UV/weight bindings, embedded images and original animation. STANDALONE_PLAYBACK_VALIDATION.json compares sampled standalone GLB playback with the reviewed runtime poses. MOTION_VALIDATION.json checks the lock hashes, constant animated bone scales, looping endpoints and flat-ground foot constraints. RUNTIME_VALIDATION.json verifies 483 motion keys and five interaction events. GROUND_REVISION_VALIDATION.json compares protected data and unchanged flight clips with the preceding delivered animated GLB, and checks beak contact and carry attachment. These are not an exhaustive animated self-intersection audit or a live-game test.

model/ contains the locked original source and its earlier adapter workflow. kea_motion_clips.json, kea_motion_shape.json and kea-motion-player.mjs are provided for that legacy/source route only. For the standalone animated GLB, play its built-in clips directly and do not apply these source-shape corrections.

## Rebuild

Python dependencies: numpy, scipy, Pillow. Node and ffmpeg are also required. From this directory:

1. python tools/build_motion.py
2. python tools/export_standalone.py
3. python tools/render_motion.py movies
4. python tools/export_paper.py
5. node tools/check_runtime.mjs
6. python tools/validate_motion.py
7. python tools/check_standalone.py
8. python tools/render_flight_states.py
9. python tools/export_carry.py
10. python tools/render_ground_qa.py
11. python tools/render_ground_blend.py
12. python tools/validate_ground_revision.py /path/to/preceding/kea_animated.glb

The lock file intentionally stays unchanged during rebuild. SOURCE_README.md in model/ retains the original model provenance and attribution. No commercial reference mesh or texture atlas is included.
