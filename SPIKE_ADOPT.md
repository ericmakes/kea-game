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
| 1 | **Cars: geometry port.** SDF hatch, Hilux-class ute, caravan, tarp trailer (`tools/cars.mjs` -> `vehicles.glb`) replace mkCar's four parked cars, traffic, the DOC ute and the carpark caravan, through the P6A seam | LANDED | seven placements + all traffic. The spike's orientation is the game's own front (-z); the anchors moved onto the real bodies (17 of 59 interactables, row-diffed). Colliders are the real bodies: bonnet + cabin, and the ute's tray. **`camp_van`** (the campground motorhome) stays primitive: the spike has no motorhome. Eric's call whether it takes the caravan body |
| 1a | — plain GLB, **no meshopt, no Draco, no quantization**; the loader asserts it decoded | LANDED | `tools/derive_vehicles.mjs` asserts no extensions, float attributes and bounds identical to the source within 1 mm. `src/vehicles.mjs` refuses any required extension and any empty body. `vehicles.mjs` (gate) refuses a vehicle that stayed primitive |
| 1b | — **WebGL clearcoat paint**: `MeshPhysicalMaterial` with clearcoat 1, roughness 0.035, standing in for the spike's TSL node paint (road dust to 35 cm, grime, panel gaps) | LANDED | `src/vehicles.mjs` `paint()`; the spike's colours as sRGB hex, converted explicitly (ColorManagement is off) |
| 1c | — the spike's lathe tyres and five-spoke alloys, **on the drawn tarmac** (slab top 0.14) | LANDED | merged to three meshes a car. `vehicles.mjs`: tyres 0.0 mm over the drawn ground on 6 of 7, the DOC ute 7.7 mm (at the slab edge) |
| 1d | — every car mission anchor still resolves (wipers, aerial, caravan mirrors, door seal, step, drawbar, DOC-ute cage, latch, keys, radio); **seal 12/12** | LANDED | the driven matrix completes wiper and keys; the seal comes off 12/12, redrawn round the spike caravan's real door. The caged kea now sits in the crate on the tray, not at the old hard-coded offset. **There are no number-plate or wheel-nut missions** |
| 1e | — licence row | LANDED | `assets/LICENCES.md` VEHICLES: first-party, both md5s recorded |
| 2 | **Props on the drawn ground**: cars, humans and sheep at drawn height (they stood 14 cm inside the seal), per prop class, mission anchors untouched, sole/wheel check extended | LANDED | cars stand on the seal by their placement (CARSLAB), traffic by its lane `y`. Humans and sheep are lifted round their update (render-only, headless untouched), and the humans' 31 mm boot depth is added. `vehicles.mjs` holds walkers to 12 mm: HEAD reads Rex at -236 mm on the apron. Re-pin folded into the trees' |
| 3 | **Trees**: Poly Haven `island_tree_01`, leaf-island pruned (1.6 M -> 194 k tris, 3.2 MB), replacing every `mkTree` | LANDED | every mkTree in every map: 6 per map, 15 at the station. The four the spike placed keep its heights and turns, others h = 2.1 + 4.4 s. The primitive is still built (seeded draws) and hidden; the collider is unchanged. `tools/derive_tree.mjs` (meshopt decoded, WebP kept, asserted); `vehicles.mjs` checks trunks on the drawn ground (0.0 mm). The **ski field's beech** are clump cones, not mkTree, and stay. A far LOD was built and measured OFF: 0.4 ms and visibly thinner at 40 m, because the leaves cost fill, not triangles |
| 4 | **Asphalt tiling breakup**: stochastic tile offsets (Quilez), 12 m / 40 m macro field, placed wear (oil under engines, tyre polish, repair patches, crack sealant, tracked gravel), worn bay paint | NEXT | the spike is TSL; this is a WebGL `onBeforeCompile` rewrite. The game already has P3b stochastic anti-tiling; the missing part is the placed wear |
| 5 | **Colour pipeline**: ColorManagement ON, CSS `saturate(1.22) contrast(1.06)` removed, re-grade to the plates (the spike's warm WB + 1.5x sat + 1.22 contrast after the tone map) | NEXT (PIECE 2) | the bird's bronze and dark rims are the test case, via a bird-vs-approved-render framescore property |
| 6 | **Tone mapper**: the spike's finding is that Khronos Neutral crushes sky-lit shade, so AgX was chosen; check shade lit only by sky before choosing | NEXT (with 5) | the game is ACES 0.95 today |
| 7 | **HDRI sun measurement**: sun colour and intensity integrated off the HDR disc (7.02, 6.83, 6.54 linear at 42.1°), the disc painted out of a sunless IBL; no hemi, fill or rim | NEXT (with 5) | the game's HDRI is `pizzo_pernice`; re-measure on it, never carry the spike's alps_field numbers over |
| 8 | **AO on indirect light only** (not multiplied over the finished frame) | NEXT | the spike measured that full-frame AO darkens every sunlit car side. WebGL: `aoMap` / `onBeforeCompile` on the indirect term |
| 9 | **Grass and ground look where it differs**: 4,400 instanced golden tussock clumps (`grass_medium_01`) + 1,250 wiry clumps (`grass_medium_02`); terrain in paint mode (`sparse_grass` value, colour matched to what is behind it; `aerial_grass_rock` 15 m field); gravel margin round the slab | NEXT | the game's blade field is P4's and kept. The clumps and the paint-mode terrain are additions, each measured against the budget |
| 10 | **Concrete wheel stops** at the head of every bay; bay lines moved +2.5 m z so a real 4 m car sits in its bay | NEXT | the bay move touches a pinned layout |
| 11 | **Poly Haven picnic table**, **hut in corrugated_iron_02 paint mode**, **wheelie bin**, **DOC sign** | NEXT | small props, P6A seam |
| 0 | **The budget at 100% render scale** (Eric, 2026-10-03: "under the 16.7 ms budget at 100% render scale on this Mac; auto scale is a safety net only") | LANDED | measured by ablation at a FIXED 100% (grass ~12.7 ms, shadows 5.6, AO 3.4, cars 2.6, trees 2.2). PCF shadows (crisp contact, the spike's) with every receive-only mesh out of the map; mid/far cascades every 2nd/4th frame; GTAO 8 samples (denoise kept at 16: at 8 its halo read as blades over the bird); a blade outside the view frustum stops in the vertex shader; 3 blade segments, not 4; the tree leaves on Standard, not Physical; no MSAA on a canvas that only ever receives the composer's quad. Alpha-to-coverage for the leaves was not usable: the composer's targets carry no MSAA. framemeter now measures at 100% |
| 12 | **12-bit normals** in any GLB derived with gltf-transform (8-bit bands a clear coat) | LANDED | the vehicle re-export keeps float normals |
| 13 | **TRAA + RCAS sharpening** | BLOCKED | TRAA is TSL / WebGPURenderer-only and ghosts in flight (SPIKE.md "could not adopt" 1, 5). RCAS alone could be a WebGL pass and is a candidate after 5 |
| 14 | **Photographic far field** (8K alps_field backplate, image-based fog dissolve 90-320 m) | NEXT (step 1) | Eric, 2026-10-03: "a CC0 alpine or NZ HDRI matched to the plates for the far field, not the Swiss one". Poly Haven has no NZ HDRI; 11 CC0 candidates scored at the strip lens against nz_alps_01/02 (platescore), lago_disola best (5/6, snow peaks over dark forest). The game's range is a 64-190 m heightfield with real parallax and the bird flies, so the dissolve must give way to geometry as the camera climbs |
| 15 | **WebGPURenderer / TSL node materials** | BLOCKED | a port of every material, every onBeforeCompile and every post pass in the game, not a setting (SPIKE.md "could not adopt" 1), and TRAA, its main payoff, ghosts in flight (row 13). Each LOOK the spike got from it is re-expressed in WebGL instead and tracked in its own row (1b paint, 4 asphalt, 5 grade) |
| 16 | **Kea slimmed to 1K WebP** | BLOCKED | 1K is too soft for the close bird vantages 03 and 18 (SPIKE.md's own caveat), and the game already ships the 2048 PNG with a 1024 WebP fallback (BIRD_STATE 7a), so the download saving it bought is already had |

## The test frame

`gauntlet/capture/proofs/SPIKE_01_spike_vs_game_vs_before.jpg`: the spike's 01 (top), the game now (middle), the game before the cars and trees (bottom). Whole set re-pinned after rows 1-3 (43 vantages, 4-run consensus).

## Frame cost

| after | live meter, AC, 1920x1080 window, bird flying |
|---|---|
| cars + props on ground | 15.4 ms at auto (settled 80%); 18.8 ms fixed at 100%, the same as before the cars |
| + trees | auto holds the budget by settling at 70% (1344x756); 20.3-20.7 ms fixed at 100%, so trees cost ~2 ms, all leaf fill |
| + the budget at 100% (row 0) | **14.41 ms fixed at 100%** (perfstep b2, 3 runs: 14.16 / 14.41 / 14.44); the gate's meter, run last on a warm machine, 16.17. Auto scale now sits at 100% |

## Done before this file existed (spike adoption pieces 0-1, the bird fix, the perf piece)

| spike thing | status | where |
|---|---|---|
| framescore (the whole-frame platescore driver) | LANDED | `gauntlet/verify/framescore.mjs`, piece 1 |
| half-resolution GTAO from one shared depth | LANDED | PERF S1-S2, `src/post.mjs` |
| the kea's cutout alpha as a MASK | LANDED | bird render fix, `src/alphamode.mjs` |
| the 60 fps rule with the whole game running | LANDED | PERF piece; `gauntlet/verify/framemeter.mjs` is in the gate |
