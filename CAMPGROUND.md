# CAMPGROUND.md — THE DOC CAMPGROUND

The third map, and the first of the four that finish the tour. Branch
`replat-b`. Take SESSION.lock. Standard laws.

Governed by REPLAT.md. Follows the ski field's pattern exactly — piece 39
(diorama) and piece 40 (missions) — because that pattern was paid for once
and there is no reason to pay for it again.

---

## 0. WHY THIS ONE, AND WHY NOW

The bird is parked pending externally-sourced models. Everything that needs a
3D model is blocked; the tour maps are the biggest thing that is not. The
brochure has declared this map since TODO 37 —

    {id:'campground', need:12, name:'THE DOC CAMPGROUND',
     sub:'a tent is a bag that somebody left out', pin:{x:0.62,y:0.52}}

— and it renders as `soon` for exactly one reason: `BIOMES['campground']` does
not exist. The pin, the star accounting, the travel beat, the save slot and the
unlock arithmetic are all built and all waiting. This piece is a `defineBiome`
call and the world behind it.

**A DOC campground is the best-matched map in the tour to what this game
already does.** The carpark is about vehicles; the ski field is about gear on
racks. A campground is about *unattended soft things* — tents, packs, food in
chilly bins, boots outside doors, washing on a line, an honesty box with actual
money in it. Every one of those is a verb the engine already has.

---

## 1. ADDITIVE. NO GRADUATION. THIS IS NOT NEGOTIABLE

The carpark keeps its tent, its campsite clothes line, its chilly bin and its
picnic set. Nothing migrates. Nothing is deleted from any existing map.

**The reason is measured and it is TODO 47.** `propAt` keeps a deliberate
`rnd()` draw per prop (`_ryUnused`) precisely so the country does not move, so
removing a single prop from the carpark shifts every later draw and reshuffles
grass, snow, tussock and beech across all 28 baselines. The ski field
graduation (39b) is a judged piece for that reason and this piece must not
smuggle a graduation in behind it.

So: two maps have a tent. That is what campgrounds and carparks are like.

---

## 2. THE DIORAMA

A Department of Conservation campground on a river flat: gravel loop road,
numbered sites, and the shared structures everybody has to walk to.

- **The loop road** — gravel, a flattened oval, the organising line of the map.
- **Six numbered sites** off it, each a flattened pad with a marker post and a
  fire ring. Two occupied, four bare — an occupied site is a set of props, a
  bare one is where the bird lands when it is chased.
- **The shelter** — an open-sided cook shelter: roof, four posts, two long
  trestle tables, a bench run. The map's one climbable structure.
- **The ablutions block** — a small weatherboard box with a corrugated roof,
  a door and a vent. Solid; a roof to stand on.
- **The tap stand** — a standpipe on a concrete pad with a puddle under it.
- **The bin corral** — the rat-proof cage every DOC site has, with a lid.
- **The honesty box and information board** — the fee box on a post beside a
  DOC board. This is the map's signature target.
- **Two occupied sites**: a tent with guy lines and boots outside; a campervan
  awning with a chilly bin, a camp chair, a clothesline and a solar shower bag.
- **Beech scrub** along the back, river shingle along the front.

**PLACEHOLDER PRIMITIVES ARE EXPECTED AND MUST BE REGISTERED, NOT JUST BUILT.**
Everything above is primitives today. P6A's prop registry exists exactly so the
model pass can find them: every discrete object gets a `defineProp` entry with
`source:'primitive'`, its collider and anchors declared, and its biome set to
`campground`. When Eric's models arrive, the model pass reads the registry
rather than this file — that is the seam working as designed, and it is why
this brief does not need a separate list of "things to model later".

**LOOK: judged against the `ref_bow_*` wall and the `nz_*` plates**, like every
other map. Gravel, beech, river shingle and weatherboard are all P3 scanned
families that already exist — no new material family should be needed, and if
one is, say so rather than inventing a colour.

---

## 3. THE MISSIONS — 8 TO 12, TWO STAR PAGES

Two areas, in the ski field's shape (`G.chapters=[A.loop, A.shelter]`):

**THE CAMP LOOP** — the occupied sites.
Candidates: chew a guy line and drop the tent; carry a boot to a bare site and
leave it there; open the chilly bin (coop, two birds); peel the awning seal;
raid the clothesline; roll the solar shower bag off its post.

**THE SHELTER** — the shared structures.
Candidates: work the honesty box open and scatter the coins; peck the bin
corral latch and tip it; hold the shelter roof ridge; leave a boot in the water
tap's puddle; dig somebody's food out of the bin.

**A FINALE, declared with the mission** — `checkFinale`'s `arm()`/`check()`
are a mission declaration since piece 40, so this map declares its own sentence
rather than inheriting the carpark's four-in-pursuit-then-the-nest, which a map
with a different cast can never satisfy.

**NOT ONE MISSION ID MAY APPEAR ON ANOTHER MAP.** Piece 40 asserts this against
the carpark list; the assertion extends to three lists now, and every mission id
on every campground prop must be one this map declares. A prop NAME is a
detector in this engine — `boot` scores the carpark bonus the moment it is
carried twenty-two metres from where it was built — so name new props with that
in mind or scope the detector.

---

## 4. THE MAP DECLARATIONS THAT ONLY LOOK LIKE CONSTANTS

Piece 39 found four globals that were really carpark declarations, and a fifth
would have shipped a bug. Every one of them must be answered by this map:

- **CAST** — `startGame` reads the cast; a map that declares none must declare
  it EMPTY rather than leave it out. A campground should have campers, and the
  missions above want somebody to steal from, so this map declares a real one.
- **NEST SITE** — `buildNest` reads `G.nestPos`; the map owns it.
- **SNOW ENVELOPE** — `SNOWFIELD` is the carpark band. A river flat in summer
  has no snow: declare the envelope empty and prove no drift lands.
- **ROAD LANES** — `spawnTraffic` had the carpark lanes written into it and put
  seven hatchbacks across the ski field snow. A campground loop road is gravel
  and takes no through traffic: declare no lanes and assert none spawn.
- **THE TRAVEL ANCHOR** — the flyover the tour lands on. Held to the world it
  names by the same assertion the other two anchors are: the look-at sits on the
  built prop centroid, above the ground at its own feet.

---

## 5. PROOF

- A boot-campground battery in house style, beside the ski field's.
- Every mission completes headless, driven, in this map.
- World invariants: the carpark and ski field mesh digests and collider digests
  are UNCHANGED — this piece is additive, and the instrument from P6A proves it
  rather than asserting it. If either moves, a graduation has been smuggled in.
- Seal mission 12/12 headless still passes (it lives on the carpark campervan).
- The brochure pin flips `soon` → `locked`/`open` and the travel beat lands.
- New vantages are **FIRST PINS, SHOT AND LEFT FLAGGED**, per the ski field.
  Nothing in the existing 28 is re-pinned. That is Eric's call, not this piece's.
- Push to origin once certified.

## 6. WHAT THIS DELIBERATELY DOES NOT DO

- No graduation of any existing mission or prop (section 1).
- No new chaos verb. The ski field's signature acts are still 40b and unbuilt;
  this map is furniture and jobs, built out of verbs that already work.
- No model sourcing, no bird work, nothing that needs an asset (the bird is
  parked).
- No re-pin of the existing set.
