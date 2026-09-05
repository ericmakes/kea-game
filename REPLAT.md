# REPLAT.md — Path B: the photoreal browser re-platform

Companion to OVERNIGHT.md (night shift) and WAVES.md (supervised art). This
document governs the re-platform and is binding on every piece in it.
Branch: **replat-b**. The `gauntlet` branch and its certified tip are FROZEN
and must not be touched until Eric merges.

---

## 0. WHY THIS EXISTS

On 2026-09-03 Eric named a new definitive visual reference: HexNest Games'
*Birds of War* (Unreal Engine 5, photoreal Australian suburbia, magpie
protagonist). Every environment and unit should read like that trailer, kea
instead of magpie.

The old stack cannot reach it. One HTML file, three.js r128, no external
assets, everything procedural from primitives — those laws capped the look
far below the target, and no amount of stylised polish crosses the gap. The
bird in particular: the reference magpie is a sculpted, textured, rigged
asset; a pile of cones cannot be nudged into it.

Path B was chosen over Unreal (Path A) because ALL existing game logic
survives — both multiplayer modes, the tour chassis, every mission, the
scoring economy, the gauntlet philosophy. Path A would have discarded them.

**Honest target: "unmistakably the same kind of game as that trailer,"
not a frame-match.** Two axes stay below the reference and that is accepted
going in:
- grass density (UE5 pushes millions of blades; a browser does hundreds of
  thousands before it stutters)
- the kea (an adapted free parrot model, not a photoscanned bird)
Everything else — lighting, scanned ground materials, real props, soft
shadows, fog, depth of field — gets genuinely close.

---

## 1. LAWS THAT CHANGE

Retired, deliberately, with reasons:
- **ONE FILE** — retired. The game becomes a Vite project (`src/`,
  `package.json`, static build output). This law bought portability and
  simplicity and earned its keep for months; it is also the law that capped
  the visuals.
- **r128** — retired. Modern three.js (module build).
- **NO EXTERNAL ASSETS** — retired. Real GLB models, real PBR texture sets,
  HDRI environments. All assets must be CC0 / CC-BY / otherwise
  redistributable, with licence recorded in `assets/LICENCES.md` at import
  time. No asset lands without its licence line.

Laws that SURVIVE unchanged:
- Certify before ship: the gate must print CERTIFIED-SHIP.
- One piece = one commit, proof in the same breath as the change.
- FLAKES discipline; never weaken an assertion to get green.
- Judged-at-vantage: visual work is eyeballed where it shows, and re-pinned
  deliberately.
- Session lock: one writer owns the tree.
- Taste is Eric's. The machine proves; Eric chooses.

---

## 2. THE BUILD (six pieces, in order, each keeping the game PLAYABLE)

Never leave the tree with a broken game. Each piece ends certified.

### P1 — renderer foundation  (supervised; Eric judges the jump)
Vite project scaffold; game source moved into `src/` largely intact. Modern
three.js. PBR pipeline on: `ACESFilmicToneMapping`, physically-correct
lighting units, shadow maps, colour management. Post stack: bloom, SSAO,
subtle depth of field.
Same geometry, real film camera. The visible jump on day one.
GAUNTLET WORK IN THIS PIECE (mandatory, not optional): teach the harness and
the capture rig the new stack — headless WebGL for captures, module loading
for the logic gate, `npm run build` before any capture pass. The nine
batteries must run green against the ported logic before P1 ships.
PROOF: all nine batteries green on the ported build; game boots and plays;
captures shoot at the new renderer; gate CERTIFIED-SHIP.
RE-PIN: everything changes. Whole-set re-pin, judged by Eric.

### P2 — sky and sun
HDRI environment map for image-based lighting (Poly Haven, free). One warm
directional sun, soft shadows. Exponential fog tuned to the sky so distance
hazes. This is the old Wave 1, on an engine that can actually do it.
PROOF: IBL and sun present in scene state; shadow casting on; fog params
pinned as named constants. Look: flagged for Eric.

### P3 — scanned materials
Replace procedural-canvas textures with real CC0 PBR sets (Poly Haven /
ambientCG): grass, gravel, asphalt, weatherboard, corrugated iron, brick.
Full albedo/normal/roughness. Correct tiling and texel density per surface.
PROOF: every material family resolves a real texture set; licences recorded;
no procedural canvas left on the swapped families.

### P4 — instanced grass
A real grass field: InstancedMesh, a few hundred thousand textured blades,
vertex-shader wind, distance thinning, clumping. Replaces the triangle
carpet. The biggest "it's a real game now" moment after P1.
PROOF: instance count and LOD thresholds asserted; frame budget measured and
recorded (must hold a playable frame rate on Eric's Mac); wind deterministic
under the capture clock pin.

### P5 — the kea as an asset  (supervised; Eric judges the bird)
Load a rigged parrot GLB (CC-licensed, vetted with Eric). Recolour to kea:
olive body, scarlet underwing, slate hooked bill. Retarget existing
animations to its skeleton. Keep every mission anchor working.
**This permanently ends "blocks taped together" — it is a model, not cones.**
PROOF: model loads; all mission anchors still resolve; seal mission 12/12
headless; animation set retargeted. Look: Eric judges against the kea photo
board.

### P6 — hero props as models
Real GLBs for the highest-impact props: wheelie bins, cars, picnic set,
signs — the close-range detail tier. Fills out from there.
PROOF: per-prop presence and placement assertions; licences recorded.

**P6A — the model-swap seam. SHIPPED 2026-09-05.** See P6A.md. The prop
registry landed before any model did: 26 entries covering both biomes' hero
tier, each declaring id, source, transform, collider, anchors, material policy
and biome, with the collider and the anchors emitted from the ENTRY and never
from a mesh. Zero visual change — mesh digest, collider digest, all sixty-five
carpark mission-anchor positions and every teaching hint byte-identical to the
pre-seam tree, all nine batteries green with no assertion edits, nothing
re-pinned. Adding a model is now a registry line and a file. The swap is proved
both ways on the bench with a generated placeholder GLB
(`gauntlet/verify/p6a-swap.mjs`). **Every real prop ships `source:'primitive'`.**

---

## 3. THE REFERENCE BOARD GAINS A NEW WALL

`gauntlet/reference/board/` keeps the kea photos and NZ plates — those still
govern the bird and the country. Added: frames from the Birds of War trailer
as `ref_bow_*.jpg`, the target for LIGHT, MATERIALS, GRASS and DENSITY.
The old UGG / A Short Hike / SwaG shots are now HISTORICAL — they informed
the stylised plan that this document supersedes. Do not judge against them.

---

## 4. WHAT DOES NOT CHANGE

Game logic ports and stays: both multiplayer modes (co-op campaign with the
star trio and one-cell jail; VS with the ORDER economy, the FIX/carry-back/
replace verbs and the 80% botch), the tour chassis and biome registry, the
map screen and travel, every mission, the chaos economy, the save schema.
The rules do not care what the renderer is. That is why Path B was chosen.

Unshipped queue items in TODO.md (ski field graduation, remaining biomes,
outstanding instrument pieces) are PAUSED, not cancelled. They resume on the
new stack after the re-platform lands.
