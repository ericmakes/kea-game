# SPIKE_ADOPT.md — landing the render spike Eric approved

Eric approved `~/kea-render-spike` (SPIKE.md, `out/01_carpark_wide.png`) **in full**. This file has one
row per thing the spike did. It is kept current in **every commit** from 2026-10-03 on. Rows land in
pixel-impact order, each certified and under the 16.7 ms budget.
**The test** is `gauntlet/capture/baseline/01_carpark_wide.png` beside the spike's
`out/01_carpark_wide.png`, shown to Eric after the cars and the trees land.

Status: **LANDED** · **IN PROGRESS** · **NEXT** (queued, in order) · **BLOCKED** (reason) · **NOT APPLICABLE** (reason)

## In landing order

| # | spike thing | status | notes |
|---|---|---|---|
| 1 | **Cars: geometry port.** SDF hatch, Hilux-class ute, caravan, tarp trailer (`tools/cars.mjs` -> `vehicles.glb`) replace mkCar's four parked cars, traffic, the DOC ute and the carpark caravan, through the P6A seam | LANDED | seven placements + all traffic. The spike's orientation is the game's own front (-z); the anchors moved onto the real bodies (17 of 59 interactables, row-diffed). Colliders are the real bodies: bonnet + cabin, and the ute's tray. **`camp_van`** (the campground motorhome) **takes the caravan body** (Eric, 2026-10-03: "for now"): mirrored as the carpark's is, its awning kept (the chair sits under it), door anchor on the model's door, colliders the body and its drawbar |
| 1a | — plain GLB, **no meshopt, no Draco, no quantization**; the loader asserts it decoded | LANDED | `tools/derive_vehicles.mjs` asserts no extensions, float attributes and bounds identical to the source within 1 mm. `src/vehicles.mjs` refuses any required extension and any empty body. `vehicles.mjs` (gate) refuses a vehicle that stayed primitive |
| 1b | — **WebGL clearcoat paint**: `MeshPhysicalMaterial` with clearcoat 1, roughness 0.035, standing in for the spike's TSL node paint (road dust to 35 cm, grime, panel gaps) | LANDED | `src/vehicles.mjs` `paint()`; the spike's colours as sRGB hex, converted explicitly (ColorManagement is off) |
| 1c | — the spike's lathe tyres and five-spoke alloys, **on the drawn tarmac** (slab top 0.14) | LANDED | merged to three meshes a car. `vehicles.mjs`: tyres 0.0 mm over the drawn ground on 6 of 7, the DOC ute 7.7 mm (at the slab edge) |
| 1d | — every car mission anchor still resolves (wipers, aerial, caravan mirrors, door seal, step, drawbar, DOC-ute cage, latch, keys, radio); **seal 12/12** | LANDED | the driven matrix completes wiper and keys; the seal comes off 12/12, redrawn round the spike caravan's real door. The caged kea now sits in the crate on the tray, not at the old hard-coded offset. **There are no number-plate or wheel-nut missions** |
| 1e | — licence row | LANDED | `assets/LICENCES.md` VEHICLES: first-party, both md5s recorded |
| 2 | **Props on the drawn ground**: cars, humans and sheep at drawn height (they stood 14 cm inside the seal), per prop class, mission anchors untouched, sole/wheel check extended | LANDED | cars stand on the seal by their placement (CARSLAB), traffic by its lane `y`. Humans and sheep are lifted round their update (render-only, headless untouched), and the humans' 31 mm boot depth is added. `vehicles.mjs` holds walkers to 12 mm: HEAD reads Rex at -236 mm on the apron. Re-pin folded into the trees' |
| 3 | **Trees**: Poly Haven `island_tree_01`, leaf-island pruned (1.6 M -> 194 k tris, 3.2 MB), replacing every `mkTree` | LANDED | every mkTree in every map: 6 per map, 15 at the station. The four the spike placed keep its heights and turns, others h = 2.1 + 4.4 s. The primitive is still built (seeded draws) and hidden; the collider is unchanged. `tools/derive_tree.mjs` (meshopt decoded, WebP kept, asserted); `vehicles.mjs` checks trunks on the drawn ground (0.0 mm). The **ski field's beech** are clump cones, not mkTree, and stay. A far LOD was built and measured OFF: 0.4 ms and visibly thinner at 40 m, because the leaves cost fill, not triangles |
| 4 | **Asphalt wear** on every sealed surface (the carpark slab, apron and road; the village street): stochastic tile offsets and a macro field (the game's P3b, kept), plus the spike's placed wear | LANDED | `SEAL` + `SEAL_GLSL` in `src/game.mjs`: a WebGL rewrite of the spike's TSL, in every breakup shader behind a per-material uniform (asphalt only, so all iso families still share ONE compiled program). PER MAP AND DERIVED: oil under each parked vehicle's own bonnet (4 in the carpark, 2 in the village), tyre polish down every traffic lane's wheel tracks and the carpark aisle, newer-seal repair patches on a jittered 7 x 5 m grid, tar sealant down the scan's own cracks, a narrow broken gravel fringe where the seal meets ground (not the village: kerbs). The bay lines and centre dashes are worn road PAINT now, missing where the aggregate pokes through, in place of boxes 7-9 cm proud of the seal (walkers stepped onto them). Headless keeps the boxes, so the batteries' world is unchanged |
| 5a | **ColorManagement ON** | LANDED | three converts sRGB -> linear in the Color constructor; the 59 hand conversions it replaces are gone. The two sites that do arithmetic in sRGB (the sky's HSL knobs, nightApply's lerp) keep doing it there (`srgbBytes`); six night-light hexes tuned as linear say so (`linHex`). PROVED by `colourdigest.mjs` (every colour the game hands the GPU, six maps): every material and vertex colour identical; 61 values moved, all raw-hex sites — the day lights at boot (the r128 boot/night seam, now closed: boot equals what nightApply writes) and the fog at boot. World mesh digests unchanged. Batteries: expectations now computed independent of the setting, none loosened |
| 5b | **CSS `saturate(1.22) contrast(1.06) brightness(1.03)` removed** from the canvas | LANDED | with 5a: the six key vantages 20/36 -> 23/36 on the bow trio, nothing out of band (perfstep l1_colour_managed); the bird's saturation 0.54-0.58 -> 0.50 against its approved render (the filter was on it) |
| 5c | **Re-grade to the plates** (the spike's display grade after the tone map) | BLOCKED | REFUSED BY THE LOOK RULE, Eric's call. Built: `FILM.grade`, one pass after OutputPass, off. The spike's arithmetic (per-channel contrast, ADDED warmth) took the bird's saturation to 0.81-0.89 against the approved 0.41, so a 'luma' form holds colour ratios; fitted to the bird it is sat 1.2 / warm 0.05 / contrast 1.15 / vig 0.22. As part of the light-and-grade candidate below it lifts the key six to 27/36 and the spike frame to 5/6 but drops 06 edge density, 06 and 12 snow patchiness out of band (0.06-0.34 half-widths); no variant of exposure, contrast, cloud albedo or fill passed all of them |
| 5d | **Bird bronze and dark rims: a bird-vs-approved-render property** | LANDED | framescore.mjs `birdProps/birdBand/birdScore` (hue, saturation, local dark-rim fraction, banded off `canonical_renders/folded_rear.png` scaled to the game bird); `gauntlet/verify/birdcolour.mjs` shoots it (keyed body mask, three rear-quarter cameras on open seal). Reads: shipped before 0.54-0.58 sat (out); now 0.50 (out by 0.02); the candidate 0.43-0.46 (in) |
| 6 | **Tone mapper**: AgX against ACES | BLOCKED | SCORED, NOT ADOPTED: under the measured light each at its best, AgX 30/36 bow and 6/6 against the spike frame, ACES 30/36 and 3-4/6 (it clips the highlights the spike frame keeps). AgX is in the refused candidate; ACES 0.95 ships. `SKY.toneMapper` / `exposure` |
| 7 | **HDRI sun measurement** | BLOCKED | THE MEASUREMENT LANDED, ITS ADOPTION IS REFUSED: `tools/hdri.mjs` integrates the disc of the 8K original (pizzo_pernice: 5.650 / 5.228 / 4.814 linear at 53.1 deg), paints it out of a sunless IBL whose ground half is the game's ground lit by that sun and sky, and writes the backplate band. As the game's light (no hemi, fill or rim by day) it alone pushes 11_trailhead's edge density out of band (0.339 -> 0.367); with the fills kept it drops 06 instead. In the candidate |
| 8 | **AO on indirect light only** (not multiplied over the finished frame) | NEXT | the spike measured that full-frame AO darkens every sunlit car side. WebGL: `aoMap` / `onBeforeCompile` on the indirect term |
| 9 | **The verge, every map**: a gravel margin round the seal, the 25 m dry/green patchwork, the spike's tussock clumps (Poly Haven grass_medium_01) | LANDED | `VERGE` + `VERGE_GLSL` (the grass-family terrain): gravel within ~2 m OUTSIDE the same seal boxes the wear is inside, broken by noise (the carpark's blade cut NOT widened to clear it: tried, and 06_skyline's edge density left its band — blades run onto the gravel's edge as a real verge does); the patchwork's dry patches gold-shifted and wet ones greener. CLUMPS (`src/clumps.mjs`, browser-only): the scan's two tufts (653 / 833 tris) in its own DRY paint with its alpha (the 1k glTF drops the alpha, so drawn as shipped they were black sticks — the spike's too; `dry_diff` is the scan painted as dry grass), scaled to tussock size, 300-650 a map, kept off every cut, seal, slab, tree and solid collider. MEASURED: 1,400 clumps of the spike's mix cost ~1.2 ms for little that read over the game's own blade field; the shipped set costs ~0.35 ms. They read in the open ground (station, campground) and barely at carpark range — the game's blade field already carries most of what the spike's clumps did |
| 10 | **Concrete wheel stops** at the head of every bay; bay lines moved +2.5 m z so a real 4 m car sits in its bay | IN PROGRESS | the bay lines MOVED with row 4 (z 13.6..19.0, painted, framing the cars). Wheel stops are the next ground piece |
| 11 | **Poly Haven picnic table**, **hut in corrugated_iron_02 paint mode**, **wheelie bin**, **DOC sign** | NEXT | small props, P6A seam |
| 0 | **The budget at 100% render scale** (Eric, 2026-10-03: "under the 16.7 ms budget at 100% render scale on this Mac; auto scale is a safety net only") | LANDED | measured by ablation at a FIXED 100% (grass ~12.7 ms, shadows 5.6, AO 3.4, cars 2.6, trees 2.2). PCF shadows (crisp contact, the spike's) with every receive-only mesh out of the map; mid/far cascades every 2nd/4th frame; GTAO 8 samples (denoise kept at 16: at 8 its halo read as blades over the bird); a blade outside the view frustum stops in the vertex shader; 3 blade segments, not 4; the tree leaves on Standard, not Physical; no MSAA on a canvas that only ever receives the composer's quad. Alpha-to-coverage for the leaves was not usable: the composer's targets carry no MSAA. framemeter now measures at 100% |
| 12 | **12-bit normals** in any GLB derived with gltf-transform (8-bit bands a clear coat) | LANDED | the vehicle re-export keeps float normals |
| 13 | **TRAA + RCAS sharpening** | BLOCKED | TRAA is TSL / WebGPURenderer-only and ghosts in flight (SPIKE.md "could not adopt" 1, 5). RCAS alone could be a WebGL pass and is a candidate after 5 |
| 14a | **Photographic far field: the backplate** | BLOCKED | BUILT AND REFUSED WITH THE CANDIDATE. By day the dome draws the photograph (8K band, the sunless IBL above it) through the same rotation and mapping three uses for the light (`G.farU`, `SKY.farOn`, off). THE PANORAMA: no CC0 NZ HDRI exists; 11 scored — at the strip lens on nz_alps_01/02, for a clean sky at 8-30 deg (a backplate at infinity cannot carry near trees: lago_disola drew a conifer forest across the sky, 57% clean), and in game: **pizzo_pernice** (Italian Alps, 99.7% clean sky, range 7/7 and sky 8/11 on the plates, spike frame 5/6). Its clouds' cumulus fell to beige under AgX (cloud contrast 0.163 vs 0.237): `SKY.cloudAlbedo` 2.6 brings it to 0.231 |
| 14b | **Image-based haze** | BLOCKED | in the candidate: the range's haze takes the photograph's colour 12 deg over the horizon in its own azimuth, at the tuned haze's luminance (at 2 deg a mountain panorama's "air" is its own far ridges: the range went hue 29-34, out of the plates' blue). Range 7/7 on the plates with it |
| 14c | **The 90-320 m dissolve into the photograph** | BLOCKED | the game's range is the far field — real mountains 64-190 m out, with parallax, that the bird flies into. Dissolving them would ghost two silhouettes (about 40% photo at the range's far edge) and draw geometry the bird can hit as a picture. The spike dissolved a flat field into a photographed field |
| 15 | **WebGPURenderer / TSL node materials** | BLOCKED | a port of every material, every onBeforeCompile and every post pass in the game, not a setting (SPIKE.md "could not adopt" 1), and TRAA, its main payoff, ghosts in flight (row 13). Each LOOK the spike got from it is re-expressed in WebGL instead and tracked in its own row (1b paint, 4 asphalt, 5 grade) |
| 16 | **Kea slimmed to 1K WebP** | BLOCKED | 1K is too soft for the close bird vantages 03 and 18 (SPIKE.md's own caveat), and the game already ships the 2048 PNG with a 1024 WebP fallback (BIRD_STATE 7a), so the download saving it bought is already had |

## The light-and-grade candidate (rows 5c, 6, 7, 14a-b) — refused by the look rule, for Eric

Everything in it is built and off. Shoot it with the rig:

```
KEASKY='{"hdri":"hdri/pizzo_pernice_ibl.hdr","farBand":"hdri/pizzo_pernice_band.jpg","farBandScale":1.03879,"hdriSunAz":0.6327,"hdriSunEl":0.9273,"envRotationY":2.0628,"sunDay":16774894,"sunIntensityDay":1.9194,"envIntensityDay":1.0673,"hemiIntensityDay":0,"fillIntensityDay":0,"rimIntensityDay":0,"toneMapper":"agx","exposure":0.65,"farOn":true,"cloudAlbedo":2.6,"cloudEmissive":0.1}' \
KEAFILM='{"grade":{"on":true,"form":"luma","sat":1.2,"warm":0.05,"contrast":1.15,"vig":0.22,"grain":0.018}}' \
SHOTS=01_carpark_wide node gauntlet/verify/capture.mjs
```

| measured | shipped (5a-5b) | candidate |
|---|---|---|
| key six against the bow trio | 23/36 | 27/36 |
| 01 against the spike frame | 3/6 (2/6 before) | 5/6 |
| the range against nz_alps_01/02 (platescore) | 7/7 | 7/7 |
| the sky against the sky plates | 9/11 (painted) | 8/11 (cloud underside out) |
| the bird against its approved render | sat 0.50 (out by 0.02) | sat 0.43-0.46 (in) |
| ms/frame at 100% | 14.12 | 14.25 |
| **refused because** | — | 06 edge density 0.199 -> 0.176, 06 snow patchiness 0.097 -> 0.046, 12 snow patchiness 0.067 -> 0.051 |

The whole-frame "snow" in 06 is its brightest pixels — the cumulus against the sky — so 06's refusal is the
clouds' contrast against the photographed sky, the same fault the sky plates see as the underside.

Proof sheets: `gauntlet/capture/proofs/LIGHT1_key6_before_shipped_candidate.jpg`,
`LIGHT1_carpark_spike_shipped_candidate.jpg`, `LIGHT1_bird_approved_shipped_candidate.jpg`.

## The test frame

`gauntlet/capture/proofs/SPIKE_01_spike_vs_game_vs_before.jpg`: the spike's 01 (top), the game now (middle), the game before the cars and trees (bottom). Whole set re-pinned after rows 1-3 (43 vantages, 4-run consensus).

## Frame cost

| after | live meter, AC, 1920x1080 window, bird flying |
|---|---|
| cars + props on ground | 15.4 ms at auto (settled 80%); 18.8 ms fixed at 100%, the same as before the cars |
| + trees | auto holds the budget by settling at 70% (1344x756); 20.3-20.7 ms fixed at 100%, so trees cost ~2 ms, all leaf fill |
| + the budget at 100% (row 0) | **14.41 ms fixed at 100%** (perfstep b2, 3 runs: 14.16 / 14.41 / 14.44); the gate's meter, run last on a warm machine, 16.17. Auto scale now sits at 100% |
| + ColorManagement ON, CSS filter off (5a-5b) | **14.12 ms** at 100% (perfstep l1_colour_managed: 13.93 / 14.44 / 14.12); gate meter 15.57. The refused light-and-grade candidate measured 14.25 |
| + seal wear (4) | 14.59 ms (perfstep g2a); gate meter 15.96 |
| + verge (9) | 15.13 ms (perfstep g2b); gate meter 16.53 — 0.14 inside; the wheel-stop piece then read 16.81 and was REFUSED |
| + bloom off by day (budget recovery) | **14.40 ms** (perfstep r1, 14.44 / 14.40 / 14.19); gate meter 15.46. Bloom's mip chain cost ~1.1 ms for clear-coat glints by day; it is skipped while the night blend is under 0.02, so 21 / 22 / 43 are unchanged (mean diff 0.00-0.05) |

## Done before this file existed (spike adoption pieces 0-1, the bird fix, the perf piece)

| spike thing | status | where |
|---|---|---|
| framescore (the whole-frame platescore driver) | LANDED | `gauntlet/verify/framescore.mjs`, piece 1 |
| half-resolution GTAO from one shared depth | LANDED | PERF S1-S2, `src/post.mjs` |
| the kea's cutout alpha as a MASK | LANDED | bird render fix, `src/alphamode.mjs` |
| the 60 fps rule with the whole game running | LANDED | PERF piece; `gauntlet/verify/framemeter.mjs` is in the gate |
