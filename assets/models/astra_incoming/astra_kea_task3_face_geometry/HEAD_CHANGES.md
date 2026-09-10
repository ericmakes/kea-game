# Task 3: head geometry changes

The face has a shorter hooked bill, a shallower lower mandible, larger eyes moved forward, and a rounded forehead with the crown brought forward. The existing eye-ring paint follows the enlarged eye surface.

The measurements below come from `HEAD_MEASUREMENTS.json`. They use the original POSITION accessor's coordinate space, before node and skin transforms; they are **not world-space metres**. All original model transforms and overall accessor bounds remain unchanged.

| Measurement | Original | Revised |
|---|---:|---:|
| External upper-bill vertical extent | 17.20 | 5.94 |
| External lower-mandible vertical extent | 3.16 | 1.25 |
| Bill tip below lower-jaw bottom | 8.57 | 2.22 |

The lower mandible is approximately 60% shallower. The hook still extends below the lower jaw; it is not exactly level with it. The sampled eye cores move forward approximately 1.81 source units. Their horizontal spans increase about 57%, and their vertical spans increase 40–50% across the two sides. These are measurements of a fixed UV sample region, not additional texture resolution.

The lower cutting edge follows the upper lip with a nominal 0.12-unit upward underlap and 0.035-unit inward offset. This deliberate contact closes the gape while retaining the thin wedge beneath the upper bill. `CLOSURE_REPORT.json` identifies the affected lip vertices and targets. The validation distinguishes these intended lip contacts from unwanted cheek or cere intersections.

Only POSITION and NORMAL accessor payloads change. The authorized delivered GLB retains the Task 1b embedded images byte for byte. The companion sparse geometry patch carries the same edit to a compatible Task 1c GLB while preserving its textures.

The fixed UVs constrain the paint: both eyes share mirrored atlas space, and enlarging the eye geometry stretches the same texels over a larger surface. The existing gold ring moves with that surface; it was not repainted because the geometry-only requirement permits changes only to POSITION and NORMAL data. Bill, cere and feather paint likewise carry over through the unchanged UV coordinates. The two internal mouth surfaces were recessed to eliminate exposed lining without moving the exterior. The 62 upper-lining vertices use 40% scale inside the bill; the 37 lower-lining vertices use 20% scale behind the bill base so they remain hidden in the checked open-jaw poses. No triangles were removed. Their original spatial seams are not preserved. `MOUTH_RECESS_REPORT.json` records this adjustment.
