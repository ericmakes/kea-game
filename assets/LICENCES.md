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

---

## RIGGED BIRD BASE MESH  (REPLAT P5 — the kea as a real asset, 2026-09-04)

**THIS IS THE PROJECT'S FIRST CC-BY ASSET, and that changes an obligation.** Every asset above this
line is CC0 from Poly Haven: attribution is given because the authors did the work, not because the
licence demands it. This one demands it. Sketchfab's own licence field for it reads:

> **"Author must be credited. Commercial use is allowed."**

So the credit is not a courtesy here, it is a condition of use — and a ledger line is no longer
enough on its own. **It must also be visible to a player**, which is why `CREDITS` now exists in
`src/game.mjs` and renders on the title screen, and why a battery cross-checks this table against
it. An asset whose credit is only in a file nobody ships is not credited.

| field | value |
|---|---|
| model | **Rockatoo character** |
| author / licensor | **Macauley.B** — https://sketchfab.com/Macauley.B |
| source | Sketchfab, uid `1595e8668689427f87cffb2b0daf99e5` |
| viewer | https://sketchfab.com/3d-models/rockatoo-character-1595e8668689427f87cffb2b0daf99e5 |
| licence | **CC Attribution 4.0 (CC-BY 4.0)** — http://creativecommons.org/licenses/by/4.0/ |
| requirement | Author must be credited. Commercial use is allowed. |
| published | 2021-08-13 |
| geometry (page) | 17,229 faces / 8,559 vertices |
| geometry (file) | **16,989 triangles / 10,108 vertices** — read out of the GLB, not off the page |
| animations | 1 clip, `Animation_01`, 22.47 s, 311 channels (translation + rotation) |
| skin | **161 joints, anatomically named** — see the readout below |
| textures | 3 PNG: baseColor 334 KB, metallicRoughness 126 B (a placeholder), normal 305 KB |
| model bounds | 169.6 x 94.5 x 134.6 model units — **not metres**, needs a scale normalisation |
| file | `models/rockatoo.glb`, 5,460,720 bytes |
| md5 | `fa371ff7da2f70034a3a27bb244c6cf9` |
| sha256 | `b51837f5db6c84b40555e15ceaba7df95f8702e77ee768fe76405ea4c3c9218a` |

<!-- ASSET file=models/rockatoo.glb md5=fa371ff7da2f70034a3a27bb244c6cf9 attrib=required author="Macauley.B" title="Rockatoo character" licence="CC-BY-4.0" -->

**THE VERIFICATION PROTOCOL IS WEAKER FOR THIS ASSET THAN FOR THE POLY HAVEN ONES, AND PRETENDING
OTHERWISE WOULD BE THE WORST THING IN THIS FILE.** The rule at the top says the recorded md5 is
taken *from the publisher's API* and compared against the downloaded file, so a mismatch means the
bytes were altered in transit. **Sketchfab publishes no checksum** — its download is generated per
request and there is nothing authoritative to compare against. So the hash above is of **the file as
received**. It detects any later alteration of the bytes in this tree, which is most of the value;
it does NOT prove the download matched what Macauley.B uploaded. That is a real gap in the chain and
it is recorded rather than papered over. The same will be true of any Sketchfab asset.

### THE SKELETON, READ OUT OF THE FILE — and it is the good outcome

The open question through all of P5's sourcing was whether the bones would be NAMED. Both candidates
that could be downloaded for inspection had armatures of `Bone.001 … Bone.0NN`, which would have made
the joint map a hand-built index table. This one is anatomical:

    _rootJoint
      Ilium ....................... pelvis / body root
        Scapula ................... shoulder girdle
          Neck -> Bone051 -> Head
            UpperMandible, LowerMandible ...... A REAL TWO-PART BEAK
            FeatherHead_* x60 ................. the cockatoo CREST
          Humerus_r/l -> Ulna_r/l -> Metacarpus_r/l ..... three-segment wings
        Femur_R/l -> Tibia_R/l -> Tarsus_R/l -> Leg_R/L
          FingerBF, FingerBB, FingerSB, FingerSF (x3 segments, both feet)
        Tail -> TailEnd -> TailEnd_LongFeather x30, FeatherTail_r/l

**Every joint the procedural rig drives has a named home, and several are finer than what it has
now.** The current `Kea` writes one `wings[i]` group per side; the model has humerus/ulna/metacarpus.
It writes one `jaw`; the model has an upper and a lower mandible. It fans five `tailF` groups; the
model has thirty tail-feather chains. **The rig can be bound without inventing anything**, which is
the outcome P5b was most at risk from.

### VERIFIED THROUGH three's OWN GLTFLoader, not just by parsing the bytes

Parsing the JSON myself proves the file is well-formed; this proves the **engine** can consume it,
which is the claim P5b actually rests on. Loaded in a headless browser through
`three/addons/loaders/GLTFLoader.js`:

    SkinnedMesh   true            bones 161          triangles 16,989
    clips         Animation_01, 22.47 s
    material      MeshStandardMaterial, baseColor map + normal map, roughness 0.93
    joints found  Head 1 · Neck 1 · Mandible 2 · wing 6 · leg 6 · toe 24 · tail 45 · crest 60

**It arrives as a `MeshStandardMaterial` with a normal map already**, so it drops into the P3 PBR
pipeline without a material rewrite.

**THE TWO SIZE FIGURES ARE BOTH TRUE AND MEAN DIFFERENT THINGS, which is worth writing down before
someone picks the wrong one.** The raw POSITION accessor spans 169.6 units across — that is the
BIND pose, wings spread. The loaded scene's bounding box is 75.9 x 96.5 x 76.5 — that is the model
POSED, perched and folded. The number to scale the game bird against is the posed height, 96.5
units: a kea stands about 0.5 m, so the scale factor lands near **0.0052**. Derived properly in P5c
against `kea_scale_01` rather than taken from this note.

**TWO THINGS TO DEAL WITH IN P5d, both concrete:**
- **60 of the 161 joints are the crest** (`FeatherHead_*`). A kea has no crest. That is 37% of the
  skeleton driving geometry that has to go or be repurposed into a crown.
- **FOUR TOES PER FOOT, arranged BF / BB / SB / SF** — big-front, big-back, small-back, small-front.
  That is **zygodactyl**, two forward and two back, which is exactly what the brief asks of the kea's
  feet and exactly what the current cone-stack does not have. It came free with the species choice.

**THAT HTML COMMENT ABOVE IS LOAD-BEARING.** It is invisible in rendered markdown and it is the
machine-readable half of this row: the batteries parse `ASSET` markers out of this file and check
them against `CREDITS` in `src/game.mjs` and against the bytes on disk. Prose is for people and
drifts; the marker is for the gate and cannot. Every asset added from P5 onward carries one.

**WHY THIS ONE, out of 158.** The candidate pool was enumerated rather than browsed: Sketchfab's
public search API over `[parrot, macaw, cockatoo, kea, parrot rigged, bird rigged, crow rigged,
raven rigged]` x `[cc0, by]`, downloadable only, gave 158 distinct models. **There is no kea 3D
model anywhere** — Sketchfab, CGTrader and TurboSquid all searched for `kea` and `Nestor notabilis`;
the only kea asset on the internet is a skull scan. So the bird is an adapted parrot whatever we do.
A **black palm cockatoo** is the closest animal in the pool to a kea: massive hooked bill, stocky
body, heavy head, zygodactyl feet. Eric chose it over a technically better robin rig (78k faces,
twelve clips) precisely because anatomy beats polish when the target is a specific bird.

**A PROVENANCE NOTE THAT IS NOT HIDDEN.** The uploader's description reads *"A blackpalm cockatoo
bird named rockatoo. Owned by Ardacious."* — so the CHARACTER appears to be a third party's
original character, while the 3D model is licensed CC-BY by Macauley.B. We are using it as a base
MESH of a cockatoo and re-sculpting and recolouring it into a kea, so the character identity is
discarded rather than adopted. Recorded here rather than left for someone to find, because "owned
by" beside a CC-BY grant is exactly the kind of thing that should be a decision and not a surprise.

**THE md5 IS PENDING ON PURPOSE AND CANNOT SILENTLY STAY THAT WAY.** Eric downloads the file from
Sketchfab (its `/download` endpoint needs an account, which is why the bytes are not fetched here).
The battery asserts, for every row in this ledger: **either the file exists and its md5 matches,
or the file does not exist and the md5 says PENDING.** A landed file sitting on a PENDING md5 is a
red gate, so the ledger cannot drift into decoration.
