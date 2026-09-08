# MODEL_MANIFEST.md — every placeholder the model pass would swap

Repo root, branch `replat-b`. Generated 2026-09-08 **from the built worlds, not from reading the
source**: a probe boots all six maps at the gauntlet seed, walks `G.propReg` and `G.humans`, and
measures each placed thing's own group. Every box, origin offset, triangle count and instance
count below is measured. The triangle BUDGETS and the reference pairings are the only authored
numbers, and both rules are stated so they can be argued with.

Two independent probes were run — one in this session, one in the session that stood down — and
they agree: **58 distinct registry ids are placed**, not the 56 the handover note said and not
P6A's original 26. The figure below is the measured one.

## 0. WHAT IS HERE

| | count |
|---|---|
| registry entries in `PROPS.ALL` | **58** |
| of those, placed at least once | **58** |
| total placed registry instances, six maps | **85** |
| entries shipping `source:'model'` today | **0** — the seam is off until a registry line says otherwise |
| **families living OUTSIDE the registry** | **5** — and the model pass misses them unless it is told (§4) |

## 1. glTF CONVENTIONS THE LOADER EXPECTS

Read out of `src/models.mjs` (props) and `src/bird.mjs` (the bird). What the code does, not a
wish list.

| | |
|---|---|
| container | **`.glb`**, binary glTF 2.0, one file per asset, three.js `GLTFLoader` |
| up axis | **+Y up**, glTF's own convention. No conversion applied |
| forward axis | **+Z is the front.** Derived, not assumed: every facing anchor in the registry sits at positive local z — `tow_shed.window +1.34`, `ski_lodge.door +3.53`, `camp_ablution.door +1.56`, `vill_shop.door +3.10`, `hut.door +2.76`, `stan_woolshed.step +5.20`. Six out of six. A wrong-facing export is corrected with `fit.ry`, not re-exported |
| handedness | right-handed, glTF standard |
| units | **metres.** The loader does not trust the file: `fit.standM` names the size the prop should occupy along `fit.axis`, and the scale is **measured on the clone every time** (`normalise()`). A model exported in centimetres still lands correctly — ship metres anyway |
| origin | **ground contact at the footprint centre.** `fit.ground:true` lifts the asset so its lowest vertex sits on the prop's own y=0. Measured: 48 of the 58 already sit within 60 mm of their box bottom; the 10 exceptions are §5 and are deliberate |
| scale | 1.0 in the file. `at.scale` is a per-placement multiplier and none of the asset's business |
| textures | **glTF's own colour-space rules, and the loader does not override them.** `GLTFLoader` tags baseColor and emissive sRGB, and normal, occlusion and metallicRoughness linear. Do not pre-tag or pre-multiply. This is unlike `materials.mjs`, which must tag the family sets by hand because they arrive as loose JPEGs |
| texture format | **JPEG or PNG embedded in the GLB.** 1024² is the family-set standard and is ample; 2048² only for something that fills the frame. **No KTX2/Basis** — nothing in the tree installs `KTX2Loader` |
| Draco | **NO.** `GLTFLoader` is constructed bare — no `DRACOLoader`, no `MeshoptDecoder` — so a Draco or meshopt GLB fails to load and the prop silently keeps its primitive body. Uncompressed geometry only, or extend the loader first |
| materials | one `MeshStandardMaterial` per asset where possible. `material.keepModelPBR:true` leaves the asset wearing its own maps; `false` strips them and paints the entry's declared colour. **Materials are cloned per prop**, because GLTFLoader hands every clone of a scene the same material instance |
| rigs | **NOT SUPPORTED FOR PROPS TODAY — the one real gap.** `models.mjs` has no `AnimationMixer`, no `SkinnedMesh` handling and no `SkeletonUtils.clone`; only `bird.mjs` has those, and its own comment says `SkeletonUtils.clone` is the *only* correct way to copy a SkinnedMesh. A rigged prop would clone into a broken skeleton. Everything marked as needing a rig below needs `models.mjs` extended first, along the lines `bird.mjs` already proves |
| what a model may NOT change | **colliders and anchors.** Both are declared in the entry and emitted by `placeProp` at build time, before the model tier runs; `models.mjs` holds no reference to either array. A model cannot move what the bird perches on or where a mission attaches. **Model to fit the declared collider, not the other way round.** |

## 2. THE TRIANGLE BUDGET, THE RULE, AND WHAT IT REPLACES

Four tiers, assigned by the largest dimension of the measured box, so the rule is reproducible
from the tables rather than from taste:

| tier | largest dimension | budget per instance |
|---|---|---|
| A | ≥ 4.0 m | 6 000 tris |
| B | 1.5 – 4.0 m | 2 500 |
| C | 0.6 – 1.5 m | 1 200 |
| D | < 0.6 m | 400 |

**THE BUDGET IS PER MAP, because only one map is loaded at a time**, and the primitives a swap
REPLACES are already inside what each map renders now. So the honest figure is the net:

| map | instances | model budget | primitives replaced | **net change** | map renders now |
|---|---|---|---|---|---|
| carpark | 26 | 97,000 | 120,098 | **-23,098** | 275,804 |
| skifield | 6 | 22,000 | 1,626 | **+20,374** | 108,770 |
| campground | 17 | 46,100 | 21,852 | **+24,248** | 118,892 |
| village | 14 | 48,200 | 10,406 | **+37,794** | 132,292 |
| river | 10 | 46,000 | 12,536 | **+33,464** | 111,042 |
| station | 12 | 68,500 | 10,590 | **+57,910** | 124,636 |

**THE TWO ENDS OF THAT TABLE ARE THE WHOLE STORY, AND THEY POINT OPPOSITE WAYS.**

The **carpark comes out ahead by 23,098 triangles** — a saving, not a cost. Its primitives already
cost 120,098: six rounded-box cars, a campervan, a hut built from boxes, a trailer, and the densest
prop set in the game. A model pass there is cheaper than what it replaces, and the tiers could go UP.

The other five maps do NOT. Their primitives are cheap — the ski field's six props cost 1,626
triangles between them — so a model pass is a real addition: **+20k on the ski field, +24k
campground, +34k river, +38k village, and +58k on the station, which is 46% of everything that map
renders today.** The station is the one to plan for, and it is not the props themselves so much as
their SIZE: a woolshed, a race, four pens and a ute are all tier A.

So the budget is not one decision. Where a map is already dense the swap pays for itself; where it
is sparse, the pass adds geometry and the tiers are the lever. Budgets are shared per URL — four
wheelie bins are one download and one budget, because `models.mjs` caches the promise per resolved
url — so repeated props are the cheapest wins and `stan_pen` ×4, `camp_site_post` ×6, `keasign` ×4
and `nest` ×6 should be modelled before anything unique.

## 3. THE REGISTRY — 58 PLACED ENTRIES, MEASURED

`box` is W × H × D in metres, measured on the placed group. `orig` is how far the group origin
sits above the box bottom (0.00 = ground contact). `prim` is what the primitive costs today, so
the budget can be read against it. `n` is instances across all six maps. `fam` is the material
families the primitive actually wears, read off its meshes.

### *  (1 entries)

| registry name | box W×H×D (m) | orig | fwd | tier | budget | prim | rig | anch/col | n | maps | families | reference photos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `nest` | 6.40 × 5.07 × 6.40 | +3.80 | +Z | A | 6,000 | 1,212 | no | 1/1 | 6 | carpark, skifield, campground, village, river, station | timber | kea_perch_01, swag_tree_01 |

### DOC CAMPGROUND  (11 entries)

| registry name | box W×H×D (m) | orig | fwd | tier | budget | prim | rig | anch/col | n | maps | families | reference photos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `camp_ablution` | 4.70 × 2.76 × 3.50 | +0.00 | +Z | A | 6,000 | 60 | no | 2/1 | 1 | campground | corrugate+gravel+timber | nz_hut_01, swag_context_01, swag_density_01 |
| `camp_bin_corral` | 1.80 × 1.28 × 1.32 | +0.00 | +Z | B | 2,500 | 988 | no | 2/1 | 1 | campground | gravel | nz_carpark_01..03 |
| `camp_board` | 2.56 × 2.25 × 0.28 | +0.00 | +Z | B | 2,500 | 1,496 | no | 2/1 | 1 | campground | timber | nz_road_01, nz_carpark_01..03 |
| `camp_chair` | 0.66 × 0.99 × 0.61 | +0.00 | +Z | C | 1,200 | 1,480 | no | 1/0 | 1 | campground | — | nz_carpark_01..03, nz_hikers_01, kea_pilfer_01..09 |
| `camp_chilly` | 1.08 × 0.91 × 0.66 | +0.09 | +Z | C | 1,200 | 2,800 | no | 2/1 | 1 | campground | — | nz_carpark_01..03, nz_hikers_01, kea_pilfer_01..09 |
| `camp_line` | 3.30 × 1.60 × 0.12 | +0.00 | +Z | B | 2,500 | 60 | slack line, optional | 3/0 | 1 | campground | timber | nz_carpark_01..03, nz_hikers_01, kea_pilfer_01..09 |
| `camp_shelter` | 9.00 × 2.71 × 5.50 | +0.03 | +Z | A | 6,000 | 3,200 | no | 3/1 | 1 | campground | corrugate+gravel+timber | nz_hut_01, nz_hikers_01 |
| `camp_site_post` | 0.30 × 1.04 × 0.14 | +0.00 | +Z | C | 1,200 | 724 | no | 1/0 | 6 | campground | timber | nz_road_01, nz_carpark_01..03 |
| `camp_tap` | 1.67 × 0.95 × 2.01 | +0.01 | +Z | B | 2,500 | 846 | no | 2/0 | 1 | campground | concrete | nz_carpark_01..03, swag_density_01 |
| `camp_tent` | 2.79 × 1.65 × 2.75 | +0.01 | +Z | B | 2,500 | 200 | no | 4/1 | 1 | campground | timber | nz_hikers_01 |
| `camp_van` | 5.24 × 2.44 × 5.48 | +0.00 | +Z | A | 6,000 | 5,166 | no | 3/1 | 1 | campground | — | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |

### CARPARK (Aoraki visitor carpark)  (22 entries)

| registry name | box W×H×D (m) | orig | fwd | tier | budget | prim | rig | anch/col | n | maps | families | reference photos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `bench` | 1.96 × 1.28 × 0.59 | +0.04 | +Z | B | 2,500 | 4,200 | no | 1/1 | 1 | carpark | timber | nz_carpark_01..03, nz_hikers_01, kea_pilfer_01..09 |
| `bin` | 0.97 × 1.30 × 1.00 | +0.00 | +Z | C | 1,200 | 802 | no | 3/1 | 1 | carpark | — | nz_carpark_01..03 |
| `campervan` | 5.19 × 2.67 × 7.05 | -0.01 | +Z | A | 6,000 | 24,850 | no | 6/2 | 1 | carpark | — | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |
| `car_blue` | 3.80 × 1.61 × 4.46 | +0.00 | +Z | A | 6,000 | 8,726 | no | 4/1 | 1 | carpark | — | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |
| `car_red` | 3.80 × 1.61 × 4.46 | +0.00 | +Z | A | 6,000 | 8,726 | no | 4/1 | 1 | carpark | — | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |
| `car_white` | 3.80 × 1.61 × 4.46 | +0.00 | +Z | A | 6,000 | 10,126 | no | 4/1 | 1 | carpark | — | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |
| `car_yellow` | 3.80 × 1.61 × 4.46 | +0.00 | +Z | A | 6,000 | 8,726 | no | 4/1 | 1 | carpark | — | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |
| `chilly_bin` | 1.08 × 0.91 × 0.66 | +0.09 | +Z | C | 1,200 | 2,800 | no | 2/1 | 1 | carpark | — | nz_carpark_01..03, nz_hikers_01, kea_pilfer_01..09 |
| `doc_board` | 2.20 × 2.45 × 0.21 | +0.00 | +Z | B | 2,500 | 68 | no | 1/1 | 1 | carpark | timber | nz_road_01, nz_carpark_01..03 |
| `doc_ute` | 4.33 × 2.09 × 4.77 | +0.03 | +Z | A | 6,000 | 6,782 | no | 4/1 | 1 | carpark | timber | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |
| `handbag` | 0.67 × 0.64 × 0.31 | +0.25 | +Z | C | 1,200 | 1,628 | no | 1/0 | 1 | carpark | — | nz_carpark_01..03, nz_hikers_01, kea_pilfer_01..09 |
| `hut` | 8.00 × 5.01 × 7.20 | +0.09 | +Z | A | 6,000 | 23,830 | no | 7/2 | 1 | carpark | brick+corrugate+gravel+snow+timber+weatherboard | nz_hut_01, swag_context_01, swag_density_01 |
| `keasign` | 0.38 × 2.92 × 1.28 | +0.00 | +Z | B | 2,500 | 36 | no | 1/0 | 4 | carpark | — | nz_road_01, nz_carpark_01..03 |
| `pen_gate` | 0.07 × 0.67 × 5.70 | -0.33 | +Z | A | 6,000 | 48 | one hinge | 1/0 | 1 | carpark | timber | nz_tussock_01..03, swag_context_01 |
| `picnic_table` | 2.47 × 0.91 × 2.32 | +0.05 | +Z | B | 2,500 | 9,100 | no | 2/1 | 1 | carpark | timber | nz_carpark_01..03, nz_hikers_01, kea_pilfer_01..09 |
| `roadworks_paddle` | 0.59 × 1.43 × 0.08 | +0.01 | +Z | C | 1,200 | 118 | no | 1/0 | 1 | carpark | — | nz_road_01, nz_carpark_01..03 |
| `sheep_pen` | 9.50 × 0.90 × 6.12 | +0.00 | +Z | A | 6,000 | 288 | no | 2/0 | 1 | carpark | timber | nz_tussock_01..03, swag_context_01 |
| `sign_dontfeed` | 1.79 × 2.45 × 0.24 | +0.00 | +Z | B | 2,500 | 1,022 | no | 2/0 | 1 | carpark | — | nz_road_01, nz_carpark_01..03 |
| `sw_tow_shed` | 3.60 × 2.28 × 2.80 | +0.00 | +Z | B | 2,500 | 24 | no | 3/1 | 1 | carpark | corrugate | nz_hut_01, swag_context_01, swag_density_01 |
| `tent` | 2.69 × 1.58 × 2.65 | +0.01 | +Z | B | 2,500 | 200 | no | 3/1 | 1 | carpark | timber | nz_hikers_01 |
| `trail_pack` | 0.85 × 1.33 × 0.50 | +0.07 | +Z | C | 1,200 | 1,400 | no | 1/0 | 1 | carpark | — | nz_carpark_01..03, nz_hikers_01, kea_pilfer_01..09 |
| `trailer` | 4.13 × 1.17 × 3.60 | +0.00 | +Z | A | 6,000 | 5,278 | no | 2/1 | 1 | carpark | — | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |

### BRAIDED RIVER  (7 entries)

| registry name | box W×H×D (m) | orig | fwd | tier | budget | prim | rig | anch/col | n | maps | families | reference photos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `riv_approach` | 1.65 × 3.00 × 6.04 | -0.48 | +Z | A | 6,000 | 672 | no | 2/6 | 1 | river | timber | nz_river_01, nz_water_01, nz_gorge_01 |
| `riv_boardwalk` | 2.33 × 1.43 × 17.14 | +0.13 | +Z | A | 6,000 | 1,156 | no | 2/1 | 1 | river | timber | nz_river_01, nz_water_01, nz_gorge_01 |
| `riv_boat` | 4.34 × 1.57 × 5.20 | +0.13 | +Z | A | 6,000 | 3,554 | no | 3/1 | 1 | river | — | nz_river_01, nz_water_01, nz_gorge_01 |
| `riv_bridge` | 3.25 × 5.97 × 24.15 | -0.04 | +Z | A | 6,000 | 4,540 | deck + hangers | 4/1 | 1 | river | timber | nz_river_01, nz_water_01, nz_gorge_01 |
| `riv_floe` | 2.30 × 0.40 × 2.24 | +0.01 | +Z | B | 2,500 | 82 | drift only, no joints | 1/1 | 3 | river | — | nz_river_01, nz_water_01, nz_gorge_01 |
| `riv_landing` | 1.65 × 3.53 × 8.45 | +0.05 | +Z | A | 6,000 | 1,008 | no | 2/8 | 1 | river | timber | nz_river_01, nz_water_01, nz_gorge_01 |
| `riv_shelter` | 3.20 × 2.41 × 2.60 | +0.00 | +Z | B | 2,500 | 148 | no | 2/1 | 1 | river | corrugate+timber | nz_hut_01, nz_hikers_01 |

### SKI FIELD  (3 entries)

| registry name | box W×H×D (m) | orig | fwd | tier | budget | prim | rig | anch/col | n | maps | families | reference photos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `gear_rack` | 2.40 × 1.00 × 0.71 | +0.01 | +Z | B | 2,500 | 72 | no | 1/0 | 3 | skifield | timber | nz_carpark_01..03, swag_density_01 |
| `ski_lodge` | 11.60 × 5.55 × 7.63 | +0.00 | +Z | A | 6,000 | 162 | no | 3/2 | 1 | skifield | brick+corrugate+timber | nz_hut_01, swag_context_01, swag_density_01 |
| `tow_shed` | 3.80 × 2.51 × 3.00 | +0.00 | +Z | B | 2,500 | 36 | no | 3/1 | 1 | skifield | corrugate+timber | nz_hut_01, swag_context_01, swag_density_01 |

### HIGH STATION  (6 entries)

| registry name | box W×H×D (m) | orig | fwd | tier | budget | prim | rig | anch/col | n | maps | families | reference photos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `stan_gate` | 0.17 × 1.20 × 7.56 | +0.00 | +Z | A | 6,000 | 104 | one hinge | 1/0 | 3 | station | timber | nz_tussock_01..03, swag_context_01 |
| `stan_kennel` | 1.63 × 1.05 × 1.64 | +0.00 | +Z | B | 2,500 | 664 | no | 3/1 | 1 | station | corrugate+timber | nz_tussock_01..03, swag_context_01 |
| `stan_pen` | 7.12 × 1.05 × 8.14 | +0.01 | +Z | A | 6,000 | 348 | no | 2/0 | 4 | station | timber | nz_tussock_01..03, swag_context_01 |
| `stan_race` | 15.00 × 2.00 × 1.82 | +0.00 | +Z | A | 6,000 | 744 | gates, optional | 2/1 | 1 | station | timber | nz_tussock_01..03, swag_context_01 |
| `stan_ute` | 4.87 × 1.64 × 4.87 | +0.00 | +Z | A | 6,000 | 5,254 | no | 3/1 | 1 | station | — | kea_on_car_01..09, kea_bus_01, kea_caravan_01, nz_carpark_01..03, nz_road_01 |
| `stan_woolshed` | 16.90 × 6.91 × 10.42 | +0.00 | +Z | A | 6,000 | 1,012 | no | 4/2 | 1 | station | concrete+corrugate+timber | nz_hut_01, swag_context_01, swag_density_01 |

### VILLAGE  (8 entries)

| registry name | box W×H×D (m) | orig | fwd | tier | budget | prim | rig | anch/col | n | maps | families | reference photos |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `vill_bikerack` | 2.14 × 1.05 × 0.88 | +0.03 | +Z | B | 2,500 | 1,560 | no | 2/0 | 1 | village | — | nz_carpark_01..03, swag_density_01 |
| `vill_bin` | 0.68 × 1.03 × 0.68 | -0.01 | +Z | C | 1,200 | 600 | no | 2/1 | 2 | village | — | nz_carpark_01..03 |
| `vill_lamp` | 1.03 × 4.14 × 0.40 | +0.00 | +Z | A | 6,000 | 810 | no | 2/1 | 1 | village | concrete | nz_carpark_01..03, swag_density_01 |
| `vill_planter` | 1.15 × 0.75 × 0.75 | -0.01 | +Z | C | 1,200 | 444 | no | 1/1 | 3 | village | concrete | nz_carpark_01..03, swag_density_01 |
| `vill_sandwich_board` | 0.74 × 0.98 × 0.51 | -0.01 | +Z | C | 1,200 | 1,412 | no | 1/0 | 1 | village | timber | nz_road_01, nz_carpark_01..03 |
| `vill_shelter` | 3.40 × 2.37 × 1.80 | +0.00 | +Z | B | 2,500 | 848 | no | 3/1 | 1 | village | corrugate+timber | nz_hut_01, nz_hikers_01 |
| `vill_shop` | 8.02 × 4.70 × 6.30 | +0.00 | +Z | A | 6,000 | 548 | no | 3/1 | 3 | village | corrugate+timber | nz_hut_01, swag_context_01, swag_density_01 |
| `vill_verandah` | 26.30 × 3.41 × 3.02 | +0.00 | +Z | A | 6,000 | 388 | no | 3/1 | 1 | village | corrugate | nz_hut_01, swag_context_01, swag_density_01 |

## 4. THE FIVE FAMILIES OUTSIDE THE REGISTRY

**`PROPS.ALL` WILL NOT FIND THESE, AND THAT IS THE MOST IMPORTANT SECTION IN THIS FILE.** A model
pass that works the registry list alone ships a world of real props populated by placeholder
people. Each is built by a different route, and the route is why it is invisible:

| subject | box W×H×D (m) | orig | tier | budget | prim | rig | n | where | why the registry misses it |
|---|---|---|---|---|---|---|---|---|---|
| **human** | 1.50 × 2.51 × 1.50 | -0.03 | A | 6 000 | 7,235 avg | **YES — skinned, walk + idle + carry** | 15 | all but the ski field | added by `cast()` at **startGame**, not `buildWorld` — so a probe that only boots a map sees none of them |
| **sheep** | 1.04 × 1.14 × 1.51 | +0.00 | B | 2 500 | — | **YES — walk + graze, and RIDDEN** | 10 | carpark 3, station 7 | built inline in `buildSheepPenRest`, no registry entry and no `defineProp` |
| **tree** (`mkTree`) | 5.82 × 7.05 × 5.58 | +0.00 | A | 6 000 | — | canopy wind, optional | 39 | 5 maps (6 each, 15 at the station) | a free function, not a prop; groups are named `tree` and that name is the only handle |
| **village car** (`mkCar`) | 3.81 × 2.15 × 4.95 | +0.00 | A | 6 000 | — | wheels + doors as nodes, no skin | 2 | village | **TODO 97.** Direct `mkCar` calls at the kerb. The carpark's four bays DID get entries in P6A (`carEntry`); the village's two were skipped because the piece was already long |
| **station dog** | 0.50 × 0.61 × 1.06 | +0.00 | C | 1 200 | 576 | YES if it is ever to move | 1 | station | a **sub-object of `stan_kennel`** — it has no handle of its own, which is why a `G.dog` lookup finds nothing and an earlier draft of this manifest wrongly said there is no dog |

Reference photos: human — `kea_pilfer_01..09`, `kea_social_01..03`, `nz_hikers_01`. sheep and dog
— `nz_tussock_01..03`, `swag_context_01`. tree — `swag_tree_01`, `nz_gorge_01`, `nz_mist_01`.
village car — `kea_on_car_01..09`, `nz_carpark_01..03`, `nz_road_01`.

**THE HUMANS ARE THE PRIORITY AND THE MEASUREMENT SAYS SO.** They cost 7,235 triangles each as
primitives — more than the 6 000 a tier-A model is allowed — they appear in five of six maps, and
they are the only subject in the game a player reads as a *person*. Named, so a modeller can tell
them apart: Trish, Tramper Tom, Dave and Ranger Rex (carpark); Marg, Barry and Nan (campground);
The Baker, The Barista and A Tourist (village); three tourists (river); The Farmer and The Shearer
(station). Two of the boxes are not standing figures — `Tramper Tom` measures 2.53 × 1.49 × 1.50
at y 0.75 and `Ranger Rex` 1.89 × 2.65 × 7.84 — because one is seated and the other carries
something on a long axis. Model the STANDING figure at ~1.85 m and let the game pose it.

And three fittings built inline with no handle and no entry — the pass will not find these either:

- **water trough**, station: one box 2.60 × 0.42 × 0.80 m with a `PlaneGeometry(2.3,0.6)` water
  surface at y 0.40 and a solid collider. Tier B, 2 500, no rig.
- **hay bales**, station: four rounded boxes 1.00 × 1.30 × 1.00 m at 1.15 m spacing. Tier C,
  1 200 each, no rig — an obvious instancing candidate.
- **shop fittings**, village: a counter box plus two shelves per unit, inside the shop builder
  (`G2.shelf 0xA98A5E`). TODO 98 already defers shop interiors; if the pass takes the shop it
  should take these with it. Tier C, 1 200.

## 5. THE TEN ORIGINS THAT ARE NOT AT GROUND CONTACT

Measured, and every one deliberate — but a modeller who assumes ground contact will float or bury
the asset:

| entry | origin above box bottom | why |
|---|---|---|
| `nest` | +3.80 m | it is up a tree — the origin is the branch it rests on |
| `camp_chilly` | +0.09 m | lid-line origin, shared with `chilly_bin` |
| `chilly_bin` | +0.09 m | lid-line origin, shared with `camp_chilly` |
| `handbag` | +0.25 m | a carryable; the origin is where the beak takes it |
| `hut` | +0.09 m | floor level, one step above the ground outside |
| `pen_gate` | -0.33 m | hinged — the origin is the hinge axis, not the ground |
| `trail_pack` | +0.07 m | stands on its base but is gripped higher up |
| `riv_approach` | -0.48 m | a stair: the origin is the TOP tread and the flight hangs down from it |
| `riv_boardwalk` | +0.13 m | deck level, not ground — the piles go below |
| `riv_boat` | +0.13 m | a hull; the origin is the waterline |

## 6. HOW TO TURN ONE ON

No rebuild needed — the registry decides and `models.mjs` only obeys:

```
KEAPROPS='{"bench":{"source":"model","url":"models/bench.glb"}}'
```

Drop the GLB in `assets/models/`, add its licence row to `assets/LICENCES.md` **at import time**
with the publisher's own md5 — no asset lands without its licence line — then set `source:'model'`
and `url` on the entry. `fit` corrects a wrong export: `standM` (size in metres along `axis`),
`ry` (yaw), `ground` (drop to y=0).

The swap is proved both ways on the bench by `gauntlet/verify/p6a-swap.mjs` against a generated
placeholder GLB, and P6A shipped with zero visual change — mesh digest, collider digest, all
sixty-five carpark mission-anchor positions and every teaching hint byte-identical to the pre-seam
tree. That is the guarantee a model swap inherits, and the reason a model cannot quietly move a
mission.
