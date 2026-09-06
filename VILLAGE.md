# VILLAGE.md — THE VILLAGE

The fourth map. Branch `replat-b`. Take SESSION.lock. Standard laws.

Governed by REPLAT.md. Follows the ski field's pattern (pieces 39/40) and the
campground's (piece 41), because that pattern has now been paid for twice.

The brochure has declared it since TODO 37:

    {id:'village', need:18, name:'THE VILLAGE',
     sub:'cafe tables, a bakery, a great deal of glass', pin:{x:0.79,y:0.24}}

---

## 0. RAISE THE GRASS CUT BUDGET FIRST, AND DELIBERATELY

**This is step one and it is not optional.** The campground came out a straight
gravel track instead of the loop road its brief imagined, and the reason was a
limit discovered *during* the build rather than planned for: `grassCuts(biome)`
returns exactly **four** boxes, because the shader carries four hard uniforms —

    uniform vec4 uCut0, uCut1, uCut2, uCut3;   // xz centre, xz half-extent
    alive *= keaCutK(uCut0,w,uCutSoft)*keaCutK(uCut1,...)*...*keaCutK(uCut3,...);

— and the battery pins `cuts.length===4` so a fifth is a compile-time argument
rather than a silent truncation. An oval loop cannot be cut with boxes at all:
two long sides and two ends is the whole budget before a single building is
clear of grass.

**A village is a STREET LAYOUT and needs more than four.** Counting the surfaces
that must have no blade growing through them: the sealed street, the footpath on
each side, the bakery forecourt, the cafe forecourt, the bus-shelter pad, the
bike-rack pad. That is seven before anything optional. So:

**RAISE IT TO EIGHT, AS A NAMED CONSTANT, WITH THE SHADER BUILT FROM IT.**
- `GRASS.cuts = 8` beside `cutSoft`, and it is the only place the number lives.
- The declaration and the multiply loop are generated from that constant — the
  grass shader is already a JS template string, so `uniform vec4 uCuts[N];` and
  a `for` over it is a string built from `GRASS.cuts`, not eight hand-written
  lines that can fall out of step with each other.
- `grassCuts(biome)` pads its list to `GRASS.cuts` with disabled boxes (`w<=0`),
  so every biome returns the same length and the padding is explicit.
- The battery asserts `cuts.length===GRASS.cuts` — derived, so raising it again
  is one edit and not a hunt.

**AND CLOSE THE HOLE THE CAMPGROUND OPENED WHILE YOU ARE IN THERE.** The cut
assertion loops `for(const b of ['carpark','skifield'])` — a hardcoded pair, so
the campground's four boxes have never been checked at all and neither would the
village's. It must loop over **every registered biome**, the way the biome-count
and terrain-plane assertions were made to derive in piece 41b.

**PROOF FOR STEP 0 ALONE, BEFORE ANY VILLAGE GEOMETRY:** all nine batteries green
and the 31 vantages unmoved. Widening a uniform array must be a no-op on the
three existing maps — they pad to eight and cut the same four surfaces — and the
P6A mesh digests plus a capture pass are what say so. **Ship step 0 as its own
commit.** If it moves a frame, that is a finding, and it must not be tangled up
with a new map.

---

## 1. THE DIORAMA

An alpine village main street — Arthur's Pass, Aoraki, Ohakune: one sealed road,
a short row of shopfronts on one side, and a great deal of plate glass.

- **The street** — sealed, a centre line, angle parking at the kerb. It runs the
  long axis of the map and is the organising line, the way the track was the
  campground's and the tow line the ski field's.
- **The footpaths** — one each side, kerbed, with the verandah posts standing on
  the far one.
- **The verandah** — a continuous roof over the shop footpath, on posts. **This
  is the map's signature structure**: it is a long climbable ridge at first-floor
  height that runs the whole shop row, which nothing in the tour has yet.
- **The shop row**, three units under that verandah:
  - **the bakery** — the pie warmer in the window, two outdoor tables, a
    sandwich board on the footpath;
  - **the cafe** — tables with umbrellas, sugar sachets, a menu board;
  - **the souvenir shop** — a postcard rack and a merino rack outside the door.
- **A great deal of glass** — full-height shopfront windows. The plate says so
  and a kea's reflection in one is the joke; a window is also a peck target that
  is not a lid, which the tour does not otherwise have.
- **A bus shelter** with a timetable, across the street.
- **Kerbside furniture** — two rubbish bins, a bike rack with two bikes, three
  planter boxes, a lamp post, a power pole with a transformer.
- **Angle-parked cars**, two or three. Placeholders; they are `mkCar` bodies and
  the model pass will find them in the registry like everything else.
- Beech and a hill line behind the shops; the road leaves the map both ways.

**EVERY DISCRETE OBJECT IS A P6A REGISTRY ENTRY** with `source:'primitive'`, its
collider and anchors declared and `biome:'village'`. There is no separate list
of things to model later, because `PROPS.ALL` filtered by biome IS that list —
the campground's battery asserts it can be read that way and the village's must
too.

**LOOK: judged against the `ref_bow_*` wall and the `nz_*` plates.** Asphalt,
concrete, brick and corrugate are all existing P3 families. **Glass is the one
open question** — `PAL.glass` and the `pane()` helper exist and are used on
vehicle glazing, but a two-metre shopfront is a different problem from a
windscreen, and it is the one thing in this map that may want a material
decision. Raise it rather than inventing one.

---

## 2. THE MISSIONS — 8 TO 12, TWO STAR PAGES

`G.chapters=[A.street, A.bakery]`.

**THE MAIN STREET** — the kerb and the traffic.
Candidates: hold the verandah ridge end to end; tip a rubbish bin; rob the
postcard rack; take a bike bell; get into a planter box; stand on the lamp post.

**THE BAKERY** — the food and the glass.
Candidates: work the pie warmer; scatter a tray of sugar sachets; knock the
sandwich board flat; tip a cafe umbrella; peck a shopfront window until somebody
comes out; carry a pie to the nest.

**A FINALE DECLARED WITH THE MISSION**, per piece 40's seam — the village has a
cast of shopkeepers, not the carpark's four-in-pursuit, so it declares its own
sentence. The lamp post over the whole street is the obvious candidate.

**NOT ONE MISSION ID MAY APPEAR ON ANOTHER MAP, IN EITHER MODE.** Piece 41's
battery checks this across three lists and both modes — a gap sabotage found,
because half the ids on every map are coop-only and were outside the check. Four
lists now.

---

## 3. THE MAP DECLARATIONS

Every one answered, and the empty ones **declared** empty rather than omitted —
declared-empty and forgotten are different things and only an assertion tells
them apart:

- **CAST** — shopkeepers and a tourist. A village with nobody in it has no glass
  worth pecking. Three, as the carpark and the campground carry.
- **NEST SITE** — the map owns it; up the hill behind the shops.
- **SNOW ENVELOPE** — none in summer; declare null and assert no drift lands.
- **ROAD LANES** — **the village is the FIRST NEW MAP THAT WANTS THEM.** The
  carpark declares `traffic:{up,down,x}` and the ski field and campground
  declare none. A village main street with through traffic is the point of
  having a street, so this map declares real lanes — and the assertion is that
  cars spawn ON the street and nowhere else.
- **THE TRAVEL ANCHOR** — held to the world it names, like the other three: the
  look-at on the built prop centroid, above the ground at its own feet, pointing
  down the way in.

---

## 4. PROOF

- Step 0 shipped and certified separately, with the 31 vantages unmoved.
- A boot-village battery in house style, beside the campground's.
- Every mission completes headless, driven, in this map.
- Additivity: the carpark, ski field and campground mesh and collider digests
  unchanged. The P6A instrument answers this; do not write a second assertion to
  agree with it.
- Traffic spawns on the village lanes and on no other map's.
- The brochure pin flips `soon` → `locked`/`open`; the travel beat lands.
- New vantages are **FIRST PINS, SHOT AND LEFT FLAGGED**. Nothing in the 31 is
  re-pinned. That is Eric's call, as it was for the campground.
- Push once certified.

## 5. WHAT THIS DELIBERATELY DOES NOT DO

- No graduation of anything (TODO 47: removing one carpark prop reshuffles every
  later seeded draw and re-pins the whole set).
- No new chaos verb. The ski field's signature acts are still 40b and unbuilt.
- Nothing that needs a sourced 3D model — the bird is parked and so is that tier.
- No re-pin of the existing 31.
- Does NOT fix TODO 91/92/93 (the campground's deferred calls) in passing.
