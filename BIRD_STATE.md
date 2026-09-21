# BIRD_STATE.md — the approved character, and what it costs to wire it in

Repo root, branch `replat-b`. **Rewritten 2026-09-21.** The previous version of this file described
a bird that was PARKED mid-revision with four pending items and a texture blocker. That state is
gone: Eric has approved a character, and `assets/models/astra_incoming/approved/` is it. Everything
below supersedes the 2026-09-10 text, which survives only in git history.

**THE BIRD IS ON.** Eric judged the preview frames on 2026-09-21 — *"the bottom-right control
(recolour off) is the bird"* — and `KEABIRD.model` is `true`. The shipped `url` is
`models/astra_incoming/approved/kea_animated.glb`, the clips own the wings, and all 43 vantages
were re-pinned in the same session.

**HEADLESS STILL SEES THE PRIMITIVE BIRD, and that is deliberate rather than an oversight.**
`installBird` is imported by `main.mjs` and never by the specimen, so a node battery has no
loader, no fetch and no model: it poses the primitive hierarchy exactly as it did before the flip.
That is what makes every headless digest, anchor and mission comparable across it — turning the
bird on re-pinned photographs and changed not one assertion in the gate. There is a row asserting
this, so it cannot quietly stop being true.

---

## 1. WHAT IS APPROVED, AND HOW TO LOOK AT IT

| | |
|---|---|
| **the character** | `assets/models/astra_incoming/approved/kea_approved.glb` — the locked approved shape, standalone. Play `approved_idle` at t=0 for the approved rest pose |
| **the animated character** | `.../kea_animated.glb` — the same approved base plus one morph (`flight_wing_release`) and ten named clips |
| **the reference for "approved"** | the four canonical renders, pinned by hash in section 2 |
| **Eric's approval** | recorded in the package as *"User approved the bill smoothing and instructed lock it in."* `APPROVED_CHARACTER_LOCK.json` |

The package's own `READ_THIS_FIRST.md`, `CLIP_MANIFEST.md` and `EXPORT_CHANGES.md` are the primary
documents and are not restated here. This file records what THIS repo verified and decided.

---

## 2. THE CANONICAL RENDERS ARE THE REFERENCE FOR "APPROVED"

Four stills, rendered by the package's own CPU rasterizer from the actual decoded mesh and embedded
textures — no generated imagery. **These are what "the approved bird" means.** Any later change to
the character is judged against them, and any claim that the bird looks wrong in game is first
checked against them to see whether the fault is the ASSET or the ENGINE. (In this session that
distinction immediately paid for itself — see section 5.)

They are pinned BY HASH AND PATH rather than copied onto the reference board, because the board is
photographs of real keas — what we aim at — and these are renders of our own asset. Mixing the two
would make "reference" mean two things.

| view | file (under `assets/models/astra_incoming/approved/`) | sha256 | what it fixes as approved |
|---|---|---|---|
| head | `canonical_renders/head.png` | `8e4d16fe7142c46d…` | the bill, cere, eye ring and crown at close range |
| side | `canonical_renders/side.png` | `4e30a2cc03becd4a…` | the standing silhouette and proportion |
| folded rear | `canonical_renders/folded_rear.png` | `b9997386ec3b1c22…` | **the wing tuck** — no scarlet underwing sheet at rest |
| wings open | `canonical_renders/wings_open.png` | `c9bee415efd40459…` | the flight state: `kea_animated.glb`, `flight_glide`, morph weight 1 |
| contact sheet | `canonical_renders/contact_sheet.jpg` | `8b747e54f333b8e4…` | all four in one frame |

Full hashes are in `PACKAGE_HASHES.json`, which this session verified 89 of 89. Render provenance —
camera, clip, time, morph weight per view — is in `CANONICAL_RENDER_PROVENANCE.json`.

---

## 3. THE EARLIER TASK LIST, SETTLED

| item | status now |
|---|---|
| **Task 3b — skull rounding** | **SUPERSEDED.** The head reading as a raptor was a fault of the shape this package replaces. The approved head is the head, and `canonical_renders/head.png` is what it is. Do not re-open 3b; a further head change is a NEW change to an approved character and needs Eric's explicit say-so |
| **Task 2 — tail vanes** | **STILL OPEN, and the package says so itself.** Broad feather surfaces are visible from the rear now, but narrow tail slots remain and the side view still shows thin pointed tips. *"Do not mark Task 2 fully resolved."* Any tail refinement is a new change to approved geometry and is reviewed explicitly |
| **the neck feather-size gradient** | folded into the approved paint. It is not carried as a pending texture item any more; if Eric still sees it, it is a new item against the approved character |
| **the wing-fold rest pose** | **RESOLVED FOR REST, NOT FOR MOTION.** The folded wings are baked into the approved base and the rear render proves it. Procedural wing folding and transitions are NOT certified — and this session measured exactly how far from certified they are (section 5) |
| **the 1c texture blocker** | **DEAD.** It was a question about which paint to build on; the approved character settles it by existing. The guarded 1c head patch in the Task 3 drop is now historical |

---

## 4. THE HARD CONSTRAINTS

- **DO NOT APPLY THE LEGACY SHAPE ADAPTER TO THE STANDALONE FILES.** Not
  `wing-rest-correction.mjs`, not `kea_motion_shape.json`, not `kea_rest_wing_correction.json`.
  The approved correction is **already baked into the mesh arrays** of both GLBs; applying it again
  doubles it. Those files live in **`astra_archive/approved/model/`** at the repo root, which is
  gitignored — moved out of the asset tree on 2026-09-21 because the game never loads them and
  `publicDir` was copying 36 MB into `dist/` on every build. They are evidence, not a runtime step,
  and their hashes stay recorded in `assets/LICENCES.md`, `APPROVED_CHARACTER_LOCK.json` and
  `PACKAGE_HASHES.json` so the chain is still auditable. The adapter instructions in
  `SOURCE_README.md` apply to the SOURCE route only.
- **Do not auto-play `animations[0]`.** It is `Animation_01`, the 22.5 s legacy source sequence
  with substantial ilium travel, and the package says explicitly: *"do not select automatically"*.
  `src/bird.mjs` does exactly this today — see section 5, defect 1.
- **Preserve the armature.** 101 joints in, 101 joints out; the game binds by bone NAME and
  `glbdiff.mjs` catches a single renamed joint. This session confirmed the approved skeleton is
  identical in **name and order** to the shipped `kea_bill.glb`, so the existing `KEABIRD.bones`
  map binds it with no edit.
- **One owner per bone, and one owner for the morph weight.** The clips write all 101 joints;
  `rigCommit()` writes 15 of them every frame. They cannot both win.
- **No asset lands without its licence line.** Rows for all five GLBs in the package are in
  `assets/LICENCES.md`, with the CC-BY chain and the AI-generated edits recorded plainly.

---

## 5. WHAT THIS REPO VERIFIED, SO IT IS NOT RE-DERIVED

**Identity.** Both GLBs match their recorded SHA256, MD5 and byte count. `PACKAGE_HASHES.json`
verifies 89 of 89 files, nothing missing, nothing present-but-unlisted except the manifest itself.
All seven files in `APPROVED_CHARACTER_LOCK.json` match.

**Structure**, measured rather than taken from the paperwork: both files 4,927 triangles, 3,013
vertices, 101 joints with the original `cockatoo_*` names in identical order. `POSITION`, `NORMAL`,
`TEXCOORD_0`, `JOINTS_0`, `WEIGHTS_0` and the index buffer are **byte-identical between the two
files**. The approved file's POSITION and NORMAL hash to the locked `actual_position_1.bin` and
`actual_normal_1.bin`. `glbdiff.mjs` against the 3q source: **0 accessors changed, 0 images
changed**. One morph target, `flight_wing_release`, moving **532 of 3,013** rows — matching
`MORPH_VERTEX_SCOPE.csv` exactly. Eleven clips, durations as the manifest states.

**And three integration defects, each measured, none of them the asset's fault.** The instruments
are `gauntlet/verify/birdclips.mjs` (rig/morph arithmetic) and `gauntlet/verify/birdpose.mjs`
(photographs each clip through the game's own loader). Full findings and the recommendation are in
section 6; the short version:

1. **`bird.mjs` takes its rest pose from `gltf.animations[0]` at `restT` 5.49 s** — which for this
   package is the legacy `Animation_01`. The scale and the ground offset are measured from that
   wrong pose, so a naive URL swap puts the bird **sunk to mid-body in the ground with one wing
   half-open**. It must select `approved_idle` by name.
2. **`rigCommit`'s `open` term folds the wing instead of opening it.** Measured wrist-to-wrist:
   the authored `flight_glide` reaches **55.6** units, the folded rest is **27.7**, and the
   procedural pose at `open` 1.0 reaches **19.6** — tighter than folded. No axis and no sign of a
   single-scalar `open` gets past **35.6**. This is PRE-EXISTING: the shipped `kea_bill.glb` does
   the same thing (27.0 -> 21.9), so it is a defect in the adapter that the authored clips would
   CURE, not one this package causes.
3. **`keaRecolour` over-paints an asset that is already painted.** The palette pass was written for
   an unpainted black-cockatoo base; the approved character arrives with the kea paint in its own
   texture. With the recolour on, the head washes to pale cream and the folded wing becomes a flat
   green slab. With `KEABIRD='{"plume":null}'` the asset's own paint comes through and matches the
   canonical renders. The recolour — and the eye-ring geometry it adds, which this texture does not
   need — should be OFF for this asset.

---

## 6. THE INTEGRATION, AS BUILT

**SHIPPED 2026-09-21.** What follows was the recommendation and is now the wiring; it is kept in
this shape because the reasoning is the part worth re-reading. The numbers and frames are in
`gauntlet-log.md`.

**The clips own the wings; the game keeps the rest.** As built:

- **A mixer owns locomotion, flight and the carry states** — `walk_loop`, `watch_idle`,
  `carry_walk`, `carry_idle`, `flight_loop`, `flight_glide`, the two banks — because those are
  whole-body authored poses and, for flight, because the procedural rig demonstrably cannot make
  the shape at all (defect 2).
- **`rigCommit` keeps the head, neck, jaw and body** for everything the game does that no clip
  covers: look-at, the peck, the preen and scan idles, the stun wobble, the scream, `poseLock`.
  These are 4 of the 15 bones it writes and they are where the game's character actually lives.
- **The wing, leg and tail channels are MASKED OUT of rigCommit while a clip owns them**, which is
  the "explicit ownership" `EXPORT_CHANGES.md` asks for. One owner, decided by state, never both.
- **The morph weight follows the clip** (every clip keys it: 0 on ground, 1 on flight) and
  procedural code never writes it, because there is no certified mapping from an arbitrary
  procedural wing angle to an intermediate weight.
- **`beak_tear` is a mission-anchor exception**: it is target-aligned, it carries five timed events,
  and the game already has its own tear geometry and timing. Recommended as a LATER piece, driven
  by the existing tear rather than replacing it.

**Cost against the gate: low, and that is measured rather than hoped.** `interact()` — which every
mission reach, every anchor and the seal's 12 hits go through — computes from `this.x`,
`this.y+0.4*size`, `this.z`, the kea GROUP, and never from a bone. So bones moving under a mixer
cannot move a mission anchor or change a detector's range. The only bone-parented gameplay objects
in the tree are `kea.headAttach` (carried and worn props) and the eye rings; a carried prop
following the animated head is desirable, and the eye rings go away with the recolour.

**What it does cost: a whole-set re-pin, and the bird is in every frame.** That is Eric's to judge
and is the reason the switch stays off.


---

## 7. THE BLOCKER: THE 4096-SQUARE TEXTURES DO NOT DECODE IN THE CAPTURE BROWSER

**Found 2026-09-21 while re-staging the close-ups, and it stops both that job and the tail views.**

`kea_animated.glb` embeds three PNGs: an 18.7 MB 4096² baseColor, an 8.7 MB 4096² normal, and a
126-byte metallicRoughness. In the capture browser the two big ones fail and `GLTFLoader` hands
back a material with **no map at all** — a sharp, settled, entirely plausible photograph of a
WHITE bird. Reproduced 3 runs of 3.

**What was eliminated, each by measurement rather than by argument:**

| suspect | result |
|---|---|
| truncated copy in `dist/` | md5 identical to the source, both 32,741,172 bytes |
| the PNGs themselves | decoded in the same browser: 4096² in 154 ms and 370 ms |
| blob URLs | a blob-backed `Image` and `createImageBitmap` both load fine |
| three's `colorSpaceConversion:'none'` path | decodes fine |
| path prefixing of the blob URL | `LoaderUtils.resolveURL` has the `blob:` guard |
| a CSP or a failed request | no CSP; the only 404 is `favicon.ico` |
| machine memory | 1.5 GB free and 2 stray browsers swept; still fails |

**The boundary is the asset size.** Same code, same browser, same boot, one run apart:

    models/kea_bill.glb                          (2.2 MB, 512² texture)   -> MAP 512
    models/astra_incoming/approved/kea_animated.glb (32 MB, 4096²)        -> NO MAP

**The pinned set is NOT affected and that was checked, not assumed** — the bird region of the
pinned frames measures 140,116,68 on `03_kea_plate`, a warm brown. The textures decoded during the
four re-pin sweeps and the held-out sweep. So the baselines are right; what is broken is the
ability to RESHOOT them, which is worse in a different way: the set cannot currently be reproduced.

**The rig now refuses rather than pinning one.** `webrig.assertBirdDressed()` runs after the boot
evaluate in `capture.mjs` and throws with the reason; `shotR` retakes three times and then gives
up loudly. A white bird can no longer reach a baseline.

**Three ways out, and the choice is Eric's:**
1. **Re-export the textures smaller** — 2048² would be a quarter of the pixels, and a JPEG
   baseColor smaller again. A new Astra drop, and the cleanest fix if it also helps real players.
2. **Un-embed them** — ship the PNGs beside the GLB so they load as ordinary image requests
   rather than through the blob path. No re-authoring, but it changes the package's shape.
3. **Judge the bird only on a real GPU** and accept that the headless set cannot reshoot it,
   which costs the gauntlet its whole photographic tripwire on every frame with a bird in it.

Until one of those lands, **the five close-ups cannot be re-staged and the tail views cannot be
shot**: both need frames this machine will not currently render correctly.

## 8. WHAT IS STILL OPEN

- **Task 2, the tail vanes** — still open, as section 3 records and as the package insists.
- **Five close-up bird vantages want re-staging.** `03_kea_plate`, `13_idle_preen`,
  `18_rear_close`, `20_dead_rear` and `25_preen_follow` were framed for the primitive bird, which
  is 1.084 m wide with its wings splayed; the approved bird is 0.626 m wide with them folded. The
  frames are correct and inside threshold, they are just photographs of a smaller subject. A
  closer camera on each is a look decision and a piece of its own. BASELINE.md's 2026-09-21b entry
  has the measurements.
- **`beak_tear` drives the clip, not the tearing.** The five authored beats fire in order and are
  recorded on `G.birdBeats`, but `tear_impulse` does nothing yet — real detachment physics is the
  piece those beats exist for.
- **The walk cycle's rate is a believable band, not the authored stance rate.** The game's kea
  moves 52x faster than the authored walk; matching footfall needs the ground speed retuned toward
  a real bird, which is a game-feel decision. `KEABIRD.walkAuthoredMS` records the real figure.
