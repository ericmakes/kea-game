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
| 3 | **Trees**: Poly Haven `island_tree_01`, leaf-island pruned (1.6 M -> 194 k tris, 3.2 MB), replacing every `mkTree` | NEXT | the 7 call sites keep their seeded `rnd()` draws (FLAKES 15). Swapped at the model tier |
| 4 | **Asphalt tiling breakup**: stochastic tile offsets (Quilez), 12 m / 40 m macro field, placed wear (oil under engines, tyre polish, repair patches, crack sealant, tracked gravel), worn bay paint | NEXT | the spike is TSL; this is a WebGL `onBeforeCompile` rewrite. The game already has P3b stochastic anti-tiling; the missing part is the placed wear |
| 5 | **Colour pipeline**: ColorManagement ON, CSS `saturate(1.22) contrast(1.06)` removed, re-grade to the plates (the spike's warm WB + 1.5x sat + 1.22 contrast after the tone map) | NEXT (PIECE 2) | the bird's bronze and dark rims are the test case, via a bird-vs-approved-render framescore property |
| 6 | **Tone mapper**: the spike's finding is that Khronos Neutral crushes sky-lit shade, so AgX was chosen; check shade lit only by sky before choosing | NEXT (with 5) | the game is ACES 0.95 today |
| 7 | **HDRI sun measurement**: sun colour and intensity integrated off the HDR disc (7.02, 6.83, 6.54 linear at 42.1°), the disc painted out of a sunless IBL; no hemi, fill or rim | NEXT (with 5) | the game's HDRI is `pizzo_pernice`; re-measure on it, never carry the spike's alps_field numbers over |
| 8 | **AO on indirect light only** (not multiplied over the finished frame) | NEXT | the spike measured that full-frame AO darkens every sunlit car side. WebGL: `aoMap` / `onBeforeCompile` on the indirect term |
| 9 | **Grass and ground look where it differs**: 4,400 instanced golden tussock clumps (`grass_medium_01`) + 1,250 wiry clumps (`grass_medium_02`); terrain in paint mode (`sparse_grass` value, colour matched to what is behind it; `aerial_grass_rock` 15 m field); gravel margin round the slab | NEXT | the game's blade field is P4's and kept. The clumps and the paint-mode terrain are additions, each measured against the budget |
| 10 | **Concrete wheel stops** at the head of every bay; bay lines moved +2.5 m z so a real 4 m car sits in its bay | NEXT | the bay move touches a pinned layout |
| 11 | **Poly Haven picnic table**, **hut in corrugated_iron_02 paint mode**, **wheelie bin**, **DOC sign** | NEXT | small props, P6A seam |
| 12 | **12-bit normals** in any GLB derived with gltf-transform (8-bit bands a clear coat) | LANDED | the vehicle re-export keeps float normals |
| 13 | **TRAA + RCAS sharpening** | BLOCKED | TRAA is TSL / WebGPURenderer-only and ghosts in flight (SPIKE.md "could not adopt" 1, 5). RCAS alone could be a WebGL pass and is a candidate after 5 |
| 14 | **Photographic far field** (8K alps_field backplate, image-based fog dissolve 90-320 m) | NOT APPLICABLE | Swiss valley with a church; the game's range is a 64-190 m heightfield with real parallax and the bird flies (SPIKE.md "could not adopt" 4). Needs a real NZ HDRI |
| 15 | **WebGPURenderer / TSL node materials** | NOT APPLICABLE | a port of every material and post pass, not a setting (SPIKE.md "could not adopt" 1). Each look is re-expressed in WebGL instead |
| 16 | **Kea slimmed to 1K WebP** | NOT APPLICABLE | the game already ships 2048 PNG + 1024 WebP fallback (BIRD_STATE 7a); 1K is too soft for 03 / 18 (SPIKE.md's own caveat) |

## Frame cost

| after | live meter, AC, 1920x1080 window, bird flying |
|---|---|
| cars + props on ground | 15.4 ms at auto (settled 80%); 18.8 ms fixed at 100%, the same as before the cars |

## Done before this file existed (spike adoption pieces 0-1, the bird fix, the perf piece)

| spike thing | status | where |
|---|---|---|
| framescore (the whole-frame platescore driver) | LANDED | `gauntlet/verify/framescore.mjs`, piece 1 |
| half-resolution GTAO from one shared depth | LANDED | PERF S1-S2, `src/post.mjs` |
| the kea's cutout alpha as a MASK | LANDED | bird render fix, `src/alphamode.mjs` |
| the 60 fps rule with the whole game running | LANDED | PERF piece; `gauntlet/verify/framemeter.mjs` is in the gate |
