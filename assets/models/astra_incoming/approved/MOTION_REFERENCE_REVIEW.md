# Historical flight-reference review

This records the preceding flight revision. The ground-footage access limitation below was resolved by the later upload; current ground work is documented in GROUND_MOTION_REVIEW.md.

# Motion reference review — 11 September 2026

## Inspected footage

The supplied birds_of_war_TRAILER.mp4 was recovered and inspected as a whole-trailer contact sheet and a denser 6 fps sequence from 16–20 seconds. This is sampled visual inspection, not a measured aerodynamic analysis. Around 16.5–18 seconds the player bird carries broad, extended wings through a curved flight path; later frames show changing wingbeat poses during the encounter. The useful animation distinction is extended-wing travel and banking versus powered flapping. The footage is a magpie game reference, not evidence of kea wingbeat frequency.

The first pass provided only a continuously repeated wingbeat. This revision adds flight_glide, flight_bank_left and flight_bank_right. All flight poses also correct an overly upright wing-plane pitch found in front-view review. The 40-degree humerus adjustment, 20-degree banks and 0.24-second preview blends are authored choices, not measurements from the trailer. The existing 0.6-second wingbeat duration has not been claimed as a measured kea cadence.

The preview renders the exported GLB's approved base geometry and its existing flight-release morph, then blends the actual animation poses. It demonstrates pose transitions in place. The game must provide travel, heading, acceleration and collision handling. Banking clips alone do not steer the character. Takeoff and landing are not included in this pass.

## Real kea footage located, but not visually inspected

- Walking: https://www.youtube.com/watch?v=ybqDMfqkVkk — “Kea walking”.
- Car interaction: https://www.youtube.com/watch?v=fBdvRCkCNfo — “Kea destroying police car”.
- Additional behavior: https://www.youtube.com/watch?v=dNpkGQLNgYQ — BBC Earth's “Playtime for Young Kea Birds”.
- Additional manipulation: https://www.youtube.com/watch?v=bxoCuRuHlt8 — BBC Earth's “Sneaky Kea Raids A Garbage Bin”.
- Specific rubber interaction candidate: https://www.gettyimages.co.nz/detail/video/kea-chews-and-tears-at-rubber-on-car-roof-rack-stock-video-footage/1B05677_0003

Search located these clips, but web retrieval failed and direct YouTube access returned HTTP 403. No frames were obtained. Titles and snippets are not sufficient to infer gait timing, force, foot bracing or bite technique. Consequently walk_loop and beak_tear remain byte-identical to the previous external clip definitions; no claim of reference-matched ground motion is made.

Once usable footage is available, inspect complete strides and grip-to-release sequences. Compare stance duration, support-foot location, body weight transfer, head stabilization, bite/regrip timing, neck rotation, pull direction and recoil. These are review questions, not observations claimed from inaccessible videos. Replace the paper demonstration with an unrigged car-rubber fixture only after the interaction is understood.

## Protection and validation

Approved character lock hashes, base POSITION/NORMAL bytes, nodes, skins, UV and weight bindings, triangles, embedded images and original animation are checked by the supplied validators. New poses animate existing joints; no model/ file is edited. See GLB_VALIDATION.json, MOTION_VALIDATION.json, STANDALONE_PLAYBACK_VALIDATION.json and REFERENCE_REVISION_VALIDATION.json. Validation does not constitute a live-game or exhaustive self-intersection test.
