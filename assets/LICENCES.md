# ASSET LICENCES — the ledger

REPLAT.md retired the NO EXTERNAL ASSETS law on one condition: **no asset lands
without its licence line.** This file is that condition. Every entry records what
the file is, where it came from, who made it, the licence, and the publisher's own
md5 — so a later session can re-verify the bytes rather than trust them.

Verification protocol: `md5 -q assets/<path>` must equal the md5 below, which was
taken from the publisher's API at import time and NOT from the downloaded file.
Both were compared at import; a mismatch means the file was altered or truncated.

---

## HDRI ENVIRONMENTS  (REPLAT P2 — sky and sun, 2026-09-03)

Source: Poly Haven (polyhaven.com). **Every Poly Haven asset is CC0** — public
domain dedication, no attribution required, redistribution and commercial use
permitted. Attribution is given here anyway, because the authors did the work.

| file | asset | author(s) | licence | md5 (1k .hdr) |
|---|---|---|---|---|
| `hdri/pizzo_pernice_1k.hdr` | pizzo_pernice | Andreas Mischok | CC0 | `c1b8292bc6f6d6c21fbaed8b2fdcc372` |
| `hdri/kloofendal_43d_clear_1k.hdr` | kloofendal_43d_clear | Greg Zaal | CC0 | `036ef061f3f6c20f509599552e60cb16` |
| `hdri/dry_field_1k.hdr` | dry_field | Greg Zaal | CC0 | `7d0de3d3879054859c32776371ef29c6` |

**WHY THREE AND NOT ONE.** The HDRI is a taste call, so it went to a variant strip
per the WAVES law of best (never ship attempt one unseen). All three are kept in the
tree so Eric can reshoot any of them with `KEASKY='{"hdri":"<name>_1k.hdr"}'` rather
than needing this session's network access back. `pizzo_pernice` is the shipped
default — see ARTBIBLE.md PHASE 2 for the recipe and the reasoning.

**WHY 1k AND NOT 2k/4k.** The HDRI is used for image-based lighting only, never as
a visible background — the game keeps its own painted sky dome, which is authored
art and the thing the NZ palette is tuned to. IBL is consumed as a PMREM-blurred
irradiance/specular cube, so resolution above 1k is discarded by the convolution and
costs only download and VRAM. 1.5MB against 6MB for 2k, with no visible difference
in the lighting it produces.

**SIZE NOTE.** These are the first binary assets in the repo. 4.7MB total. If the
asset tier grows past a few tens of MB, that is the moment to reach for git-lfs or a
fetch-on-build step — not before.

---

## SCANNED PBR MATERIALS  (REPLAT P3 — scanned materials, 2026-09-03)

Source: Poly Haven (polyhaven.com), same publisher and same CC0 dedication as the
HDRI tier above — public domain, no attribution required, redistribution and
commercial use permitted. Attribution is given anyway, because the authors did the
work and one of these sets is a photograph somebody had to go and take.

**SEVEN FAMILIES, SEVEN SETS, THREE MAPS EACH.** REPLAT.md P3 names grass, gravel,
asphalt, weatherboard, corrugated iron and brick; snow is the seventh because this
game has a whole ski field and PAL.snow was carrying a procedural canvas exactly like
the other six. Each set is albedo (`_diff`), OpenGL-convention normal (`_nor_gl`) and
packed ARM (`_arm`). All 21 files verified byte-for-byte against the publisher's API
md5 at import — see the verification protocol at the top of this file.

**WHY `nor_gl` AND NOT `nor_dx`.** three.js reads a normal map in OpenGL convention
(+Y up). The DirectX variant has its green channel inverted, and the failure it
produces is not a crash or a warning — it is lighting that looks *plausible* and is
inside out, which is precisely the class of defect this project photographs rather
than argues about. Poly Haven publishes both; the name is the whole safeguard.

**WHY ONE PACKED `arm` FILE AND NOT A SEPARATE ROUGHNESS MAP.** ARM is the standard
glTF packing — ambient occlusion in red, roughness in green, metalness in blue — and
three reads exactly those channels from `roughnessMap.g` and `metalnessMap.b` without
any help. It is the same download size as the standalone `Rough` map, so the AO and
metalness channels come along for free rather than costing a second fetch on the day a
later piece wants them. **P3 consumes the GREEN CHANNEL ONLY.** Metalness is left at
zero for all seven families on purpose: the two metal-ish surfaces here are a PAINTED
corrugate roof and a painted lodge, and painted steel is a dielectric. Bare galvanised
metal is a P6 question, when there are props that are actually bare metal.

**WHY 1k, WHICH IS A DIFFERENT ANSWER FROM THE HDRI's.** The HDRI is 1k because PMREM
convolution throws away resolution above that. These are the opposite case — they are
sampled directly, so resolution is real detail — and 1k is chosen on TEXEL DENSITY
rather than on file size. A 2 m tile at 1024 px is **~2 mm per texel**, and this is a
game played at bird height: ref_bow_02 and ref_bow_03 are both shot from about 300 mm
off the ground, which is where the kea stands. At that range 2 mm/texel resolves; at
the wide vantages it mips to a mean, which is what it should do. 2k would double the
tier to 32 MB to buy detail below the size of a grass seed.

**SIZE.** 21 files, 16 MB, on top of the HDRI tier's 4.7 MB — 21 MB of binary assets
in the repo. This is the point LICENCES.md's own earlier note said to start watching:
"if the asset tier grows past a few tens of MB, that is the moment to reach for git-lfs
or a fetch-on-build step." It is not past it yet. P4 adds no texture tier of its own,
P5 and P6 add models, and **P6 is the piece that should arrive with that decision
already made** rather than discovering it mid-import.

### grass — `withered_grass` (Withered Grass)

Author(s): Charlotte Baglioni.  Licence: **CC0**.  Publisher category: Ground & Terrain/Grass & Vegetation/Dry & Sparse Grass.
Published real-world size: **2000.0 x 2000.0 mm** — this is the number the texel density is derived from, not a guess.

| file | bytes | md5 (publisher API, verified against the file at import) |
|---|---|---|
| `tex/withered_grass_diff_1k.jpg` | 1138384 | `a6e00946839a9ab1975457ae4a39823b` |
| `tex/withered_grass_nor_gl_1k.jpg` | 1472149 | `1d86c19a4dd4826eeb6db9653f8736bb` |
| `tex/withered_grass_arm_1k.jpg` | 1109845 | `d6c0f0249d24003e7aa32caf66f669e2` |

### gravel — `gravel_floor_02` (Gravel Floor 02)

Author(s): Jenelle van Heerden, Dimitrios Savva.  Licence: **CC0**.  Publisher category: Ground & Terrain/Gravel & Pebbles/Driveway Gravel.
Published real-world size: **2000.0 x 2000.0 mm** — this is the number the texel density is derived from, not a guess.

| file | bytes | md5 (publisher API, verified against the file at import) |
|---|---|---|
| `tex/gravel_floor_02_diff_1k.jpg` | 1240441 | `9e420814367b8ee7a25bcfea10ff4b08` |
| `tex/gravel_floor_02_nor_gl_1k.jpg` | 1545680 | `ed3da750848a3e05faff98bc5b08c491` |
| `tex/gravel_floor_02_arm_1k.jpg` | 1103127 | `985dce4fb099a723dc083286d2ed757a` |

### asphalt — `asphalt_02` (Asphalt 02)

Author(s): Rob Tuytel.  Licence: **CC0**.  Publisher category: Asphalt & Bitumen/Asphalt/Cracked Asphalt.
Published real-world size: **3000.0 x 3000.0 mm** — this is the number the texel density is derived from, not a guess.

| file | bytes | md5 (publisher API, verified against the file at import) |
|---|---|---|
| `tex/asphalt_02_diff_1k.jpg` | 731707 | `fa19772d4817754c3efab708c651f5a8` |
| `tex/asphalt_02_nor_gl_1k.jpg` | 1240122 | `338da8de636ea36133170578cac82e8e` |
| `tex/asphalt_02_arm_1k.jpg` | 296770 | `33820445f43af5e5ee484674b6939271` |

### weatherboard — `dark_planks` (Dark Planks)

Author(s): Rob Tuytel.  Licence: **CC0**.  Publisher category: Wood/Boards & Planks/Weathered Planks.
Published real-world size: **2000.0 x 2000.0 mm** — this is the number the texel density is derived from, not a guess.

| file | bytes | md5 (publisher API, verified against the file at import) |
|---|---|---|
| `tex/dark_planks_diff_1k.jpg` | 379047 | `8fcc9957942c4a187269030c2cdf1342` |
| `tex/dark_planks_nor_gl_1k.jpg` | 409238 | `38bbe50031892895c0c30b0b09c8f291` |
| `tex/dark_planks_arm_1k.jpg` | 100786 | `7a15fe930353711d862c837cabc96e8d` |

### corrugate — `corrugated_iron_02` (Corrugated Iron 02)

Author(s): Jenelle van Heerden, Sergej Majboroda.  Licence: **CC0**.  Publisher category: Metal/Sheet & Corrugated/Corrugated Iron.
Published real-world size: **2700.0 x 2700.0 mm** — this is the number the texel density is derived from, not a guess.

| file | bytes | md5 (publisher API, verified against the file at import) |
|---|---|---|
| `tex/corrugated_iron_02_diff_1k.jpg` | 568492 | `0437ba7acc3a60e9a00245580ae7e10b` |
| `tex/corrugated_iron_02_nor_gl_1k.jpg` | 489773 | `e3a9b41f29a5dee9f0835bddb440efbd` |
| `tex/corrugated_iron_02_arm_1k.jpg` | 904443 | `58d9a11932fae9f85d4cbcde4700abb2` |

### brick — `brick_wall_09` (Brick Wall 09)

Author(s): Rob Tuytel, Matterfield.  Licence: **CC0**.  Publisher category: Brick & Block/Clay Brick/Running-Bond.
Published real-world size: **2010.0 x 2010.0 mm** — this is the number the texel density is derived from, not a guess.

| file | bytes | md5 (publisher API, verified against the file at import) |
|---|---|---|
| `tex/brick_wall_09_diff_1k.jpg` | 777371 | `d08a1a4be611135d174f051189e00156` |
| `tex/brick_wall_09_nor_gl_1k.jpg` | 1039733 | `dabdbe435f6880f41dc7bbdc3f02840a` |
| `tex/brick_wall_09_arm_1k.jpg` | 663260 | `8cf1a80689ae46cfd9d2da63ff887b58` |

### snow — `snow_02` (Snow 02)

Author(s): Rob Tuytel.  Licence: **CC0**.  Publisher category: Ground & Terrain/Snow/Fresh Snow.
Published real-world size: **2000.0 x 2000.0 mm** — this is the number the texel density is derived from, not a guess.

| file | bytes | md5 (publisher API, verified against the file at import) |
|---|---|---|
| `tex/snow_02_diff_1k.jpg` | 325497 | `fc54766c6b36ff298699115a619d440b` |
| `tex/snow_02_nor_gl_1k.jpg` | 1081858 | `f16b5701f9ad521cdd6af10c1d6d2b48` |
| `tex/snow_02_arm_1k.jpg` | 88100 | `701fa0f0fa36bc69f3a8f3cde0ad2d95` |

### concrete — `concrete_layers_02` (Concrete Layers 02)

Author(s): Rob Tuytel.  Licence: **CC0**.  Publisher category: Concrete/Plaster & Stucco/Bare Plaster.
Published real-world size: **2000.0 x 2000.0 mm** — this is the number the texel density is derived from, not a guess.

| file | bytes | md5 (publisher API, verified against the file at import) |
|---|---|---|
| `tex/concrete_layers_02_diff_1k.jpg` | 598800 | `d308cd7bb23bcf1208d37d4ba670c2e6` |
| `tex/concrete_layers_02_nor_gl_1k.jpg` | 734532 | `7706ee74f02099fda216a1815cf037eb` |
| `tex/concrete_layers_02_arm_1k.jpg` | 509499 | `41cf57c26706eaa048ea639c7b18b90f` |

**THE EIGHTH FAMILY, ADDED 2026-09-03 (session 17) ON ERIC'S P3 VERDICT.** The ski tow's top
anchor block is a poured-concrete footing and it was sharing `PAL.gravel`, so P3 rendered it in
driveway gravel. Eric called it a mis-assignment; this is the material it should have had.
**WHY THE BOARD-FORMED ONE.** Six candidates went to a contact sheet. `concrete_floor_02` is a
plain weathered slab and would have done, but it carries a green moss cast that is wrong above the
snowline. `concrete_layers_02` is plain weathered grey with the faint horizontal lines a timber
FORM leaves in concrete poured in place — which is exactly what a club field's anchor block is.
`concrete_floor_worn_02` and `concrete_wall_005` are both brown and read as exposed aggregate or
rock rather than as a casting.
**IT IS A DIRECTIONAL SET, so it is NOT in the isotropic group** that gets per-tile rotation — see
the `iso` flag in the MATS block. Form lines must stay level, for the same reason weatherboard laps
and corrugate ribs must.
