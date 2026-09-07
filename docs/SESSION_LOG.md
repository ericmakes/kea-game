# SESSION & DECISION LOG — the kea game chat

Written 2026-09-05. This is a RECONSTRUCTION of the project's arc and every
decision made, in order — not a verbatim transcript. For a true word-for-word
export use the Claude app: Settings → Privacy → Export data (web), which emails
you every conversation. This log is the decision history, which is usually what
you actually need to continue elsewhere.

---

## STARTING POINT
A single-file three.js r128 "kea chaos simulator" (untitled-kea-game.html),
certified build cbfd9cca, governed by the gauntlet and running overnight on a
Mac. Handover files (HANDOVER.md + a portable bundle) opened the chat.

## VISUAL AUDITS
- First: 24 showcase frames audited against Squirrel with a Gun / Untitled
  Goose Game / A Short Hike. Verdict: content is reference-grade, but the game
  lacked the LIGHT layer — shadows, fog, grounded objects, real grass, a
  protagonist face that survives close-ups. Eric: "spot on."
- Findings split into: taste "art waves" (eyes-in-loop) vs mechanical residue
  (overnight). A reference board was built from 87 photos Eric collected.

## OVERNIGHT SESSIONS (the mechanical residue, build cbfd9cca → …)
Across ~7 overnight sessions the run shipped, each piece certified:
night-tint trees, glass gradient, score-popup fan-out, HUD reflow, capture
subject-staging (+ subjects.mjs presence tripwire), preen head visibility,
white-object cull, facet normals, seeded grass tint — and repeatedly caught
its own infrastructure bugs: the gate had silently checked only 8 of 9
batteries for its whole life; the recurring "flake" was unseeded battery
worlds, not cold node (FLAKES 11/13 rewritten); several assertions were
vacuously true and were re-grounded. The long-standing **caravan door** (built
on the wrong axis, a fin off the side) was finally fixed in a supervised piece.
Canonical build advanced cbfd9cca → 36bbe94f → 347b4b93 → … → e19fcd5a.

## MODES COMMISSIONED (both built and certified)
1. **Co-op campaign** — star rating out of 3 per level (also on solo levels),
   jail holds ONE bird, a caught bird is freed by its partner. Star trio:
   page cleared / chaos par / zero cagings. Shipped: one-cell jail, star
   ledger, style star, clean-getaway star, co-op jail hardening, per-kea score
   attribution.
2. **VS mode** — chaos-causer vs order-restorer, random roles, timer, higher
   score wins. Restorer is a kea; restores cover wrecked, displaced AND
   consumed objects; every restore lands visibly botched at 80% ("parrot
   standard"). Shipped: FIX verb with decay, carry-back, consumable-replace,
   botch system, match scaffold, arena scoping, role-aware ranger, split HUD.

## THE TOUR COMMISSIONED (separate maps)
Eric: the game becomes SEPARATE MAPS, one diorama per biome, each with its own
missions and star page. Adopted six-map South Island tour: Carpark (current) →
Ski Field → Campground → Village → River → Station, plus the Nest as home pin
and trophy room. Stars unlock later maps. VS "environment" = a real loaded map
(random or sequential). Build order chassis-first. Shipped: tour chassis
(world became a biome registry, 251 lines moved byte-identical), save v3 +
DOC-brochure level-select map, flyover travel, the SKI FIELD as a real second
map with its own missions. Graduation of the Carpark's ski corner deferred to
its own supervised step.

## THE VISUAL NORTH-STAR RESET (the pivot)
Eric supplied a trailer — HexNest Games' *Birds of War* (Unreal Engine 5,
photoreal Australian suburbia, magpie) — and named it THE definitive target,
kea instead of magpie. This SUPERSEDED the stylised UGG/ASH/SwaG plan. The old
stack (one file, r128, no assets) could not reach it.

### The engine decision
Path A (Unreal) vs Path B (modern browser stack) vs Unity. Eric chose **Path
B** and, after reconsidering when a Unity-MCP post appeared, confirmed "Stay."
Reasoning accepted: the autonomous gauntlet pipeline is what will actually
FINISH the game and it runs fluently only in the browser. All game logic ports;
Unreal would have discarded it.

### THE RE-PLATFORM (REPLAT.md, six pieces, branch replat-b, gauntlet frozen)
- **P1 renderer port** — Vite + modern three.js, PBR, shadows, post stack.
  Split from the film-camera step at Eric's call; old r128 build kept frozen
  in-tree as a control; physical light units adopted, tuned once. Pixel parity
  with old baselines impossible by construction (Math.random stream diverges at
  boot) — acceptance became world-structure invariants + nine batteries. Eric
  judged P1 "everything present, looks the same" = a pass.
- **P2 sky & sun** — HDRI IBL, warm sun, soft shadows, exponential fog. Eric
  rulings: keep shadow-ratio B (not stronger C); defer sky-tone (TODO 76) until
  after P3/P4. Re-pinned from measured consensus (29f4592).
- **P3 scanned materials** — 7 Poly Haven CC0 PBR sets on every family incl.
  snow, texel density derived from published real-world sizes, licences
  recorded. Eric verdicts: carpark tiling repetition is real → breakup layer;
  tints pass; gravel-on-concrete anchor is a mis-assignment → concrete.
- **P4 instanced grass** (P4→P4e) — camera-following blade disc (195
  blades/m²), cover layer, real tussock colour, irregular clump territories
  (fixed "squares" caused by one-mound-per-cell), hills de-flattened, horizon
  extension. Eric: "actually perfect" once the squares died; grass border to
  the true horizon deferred (alpha cards, TODO 82).
- **P5 the kea as a real asset** — no kea model exists online (only a skull
  scan), so the bird is an adapted parrot. Eric rejected the first shortlist
  (macaw/gull/low-poly) — "widen the search," prioritising kea SILHOUETTE.
  Chosen: **Rockatoo character**, a palm-cockatoo GLB (CC-BY, Macauley.B) —
  stocky build, hooked bill, and (verified after landing) a NAMED anatomical
  rig with zygodactyl feet. Blender installed via brew (after clearing a
  99%-full disk). Shipped: rig bound via coordinate conjugation (model yawed
  45°, no axis aligned), animations retargeted, crest removed (it was 70% of
  the mesh; 17k→5k tris), first kea recolour.
  Eric's reaction to the photoreal bird: **"kind of terrifying."** He deferred
  the direction call until it's properly fixed.

### THE P5E BRIEF (the kea pass — current work)
Side-by-side vs the plates produced a six-defect list, priority order: (1) bill
too short/blunt — a kea's is long, slender, curved; (2) missing gold eye-ring;
(3) too dark — real kea are pale warm olive with green upperwing; (4) tail is
bare quills, no vane; (5) underwing flash too small (TODO 83); (6) missing pale
cere. Scalloped feather texture deferred as a painted-albedo piece (TODO 84).
P5E.md written and launched.

### THE ASTRA PARALLEL PATH (current)
Eric is trying OpenAI's GPT-6 Astra (released 2026-09-03, drives Blender
agentically) to edit the same GLB in parallel. Agreed: Astra output lands as a
SEPARATE kea_astra.glb with the armature/bone names preserved exactly; the
gauntlet verifies it (hash, bone-name match, seal mission 12/12, four renders);
Eric judges the two kea side by side. Handoff package (ASTRA_BRIEF.md + P5E.md
+ plates + both GLBs) prepared.

## OPEN THREADS AT EXPORT TIME
- P5e kea pass in progress; Astra attempt in parallel.
- Deferred: TODO 82 (grass to true horizon, alpha cards), TODO 83 (underwing
  flash), TODO 84 (scalloping, painted albedo), sky-tone (76), ski-field
  graduation, and P6 (the full geometry pass across every remaining primitive —
  trees, mountains, snow, hut roof/inverted gable TODO 79, carpark grammar,
  rocks, nest, vehicles, props).
- After the bird: P6, then the paused pre-replat queue (remaining biomes),
  then balance/playtest tuning of both modes, then audio/mobile/shipping (never
  yet scoped).

## STANDING FACTS
- Canonical frozen build (gauntlet branch): the last certified pre-replat tip.
- Re-platform lives on replat-b; the frozen r128 build is kept in-tree as a
  control until P6.
- The bird model: assets/models/rockatoo.glb (original) and kea_base.glb
  (de-crested derivative), CC-BY Macauley.B, changes recorded in LICENCES.md.

---

# SESSION 33 — 2026-09-07. Eric's river/station audit, worked end to end.

Nine certified pieces, each gated and pushed. Eric judged the river and the station, ordered the
pass, and the order was: two pre-pin fixes, then the pin, then water, bridge, TODO 47b, TODO 79,
mountains, rocks, snow forms. All of it landed.

## WHAT SHIPPED
1. **The two pre-pin fixes.** The swing bridge did not CONNECT — its deck sat 2.04 m above the
   boardwalk with no far-side landing, past a battery that asserted the deck existed at three points
   and a mission that TELEPORTED the bird onto it. And the woolshed's walls wore no material family
   despite its entry declaring one. New instrument: `gauntlet/verify/walkable.js`.
2. **37-42 pinned** from an eleven-run consensus. Baseline 34 -> 40; the pinned set is now every map
   the tour has. 41_station_shed is a 6/5 coin at N=11, like 03_kea_plate.
3. **Water as a system.** One material for the braid, the lake and any later tarn. Hot spot
   15.53% -> 0.00% clipped. New instruments: `lum.mjs` (+ selftest) and `sunangle.mjs`.
4. **The swing bridge** against the Hooker Valley archetype: A-frames, catenary, hangers, mesh,
   one-person deck.
5. **TODO 47b, the timber family** — 651 meshes, the most common surface in the game.
6. **TODO 79, the hut roof** — a gable at last, derived from its own collider.
7. **Mountains** — one ring instead of six copies, a world snowline instead of a fraction of each
   peak, and the "grey slabs" turned out to be the FOG.
8. **Rocks** — icosahedra, settled, bedded, lichened, and hashed out of position rather than drawn.
9. **Snow forms** — mounds with ragged outlines instead of flat discs.

## THE PATTERN OF THE SESSION, WORTH KEEPING
Every one of the four look pieces turned out to be an UNSIGNED SYSTEM that had been copied rather
than shared: the water was two hand-tuned planes, the mountains were six pasted blocks, the rocks
were a sphere call at four sites, the snow was a disc call at two. Each is now one function with a
constants table and no `rnd()` of its own — every variation hashed out of position, because the call
sites' draw ORDER is load-bearing (TODO 47).
AND THREE OF THEM WERE INVISIBLE TO THE GAUNTLET. The carpark's boulders and snow are inside
`if(!HEADLESS)`; the ski field's snow built records in node and meshes only in a browser. Geometry
no battery can see is geometry that regresses silently, which is how a flat white circle and a
squashed-sphere boulder survived this long. One half is fixed; TODO 112 carries the rest.

## MY OWN MISTAKES, RECORDED
- **I deleted most of TODO.md** with a bad scripted edit and did not notice for two commits. 18
  entries recovered byte-identical from git; 7 existed in no commit and were rewritten from Eric's
  fix list, so they are close but not guaranteed identical. There is now a self-maintaining check:
  all 45 TODO numbers the code cites must resolve, sabotage-tested with the exact bug. It has since
  caught me twice more, citing TODO 111 and 112 before filing them.
- **Roughly a third of the sabotages this session found MY assertions rather than the code.** The
  recurring shapes: a threshold derived from the constant it was testing (the snow crown); an
  absolute threshold that a lesser effect already satisfied (snow depth, met by sun cups alone); a
  literal that agreed with the world (the gravel-bar heights); a raycast grid coarser than the thing
  it hunted (40 mm purlins on a 500 mm grid); and a measurement taken in the wrong space (rock
  sampled above the snowline, albedo compared with a photograph).

## OPEN THREADS AT EXPORT TIME
- **31 of 40 vantages are FLAGGED and nothing is re-pinned** — cumulative across water, bridge,
  timber, hut roof, mountains, rocks and snow. Re-pinning is Eric's call and is the next thing.
- **A mountain variant strip is waiting on Eric**: `MTN_a_darker`, `MTN_b_shipped`, `MTN_c_paler`.
- **Two eyeball answers are waiting on Eric**: the woolshed reads as levitating (TODO 100), and the
  hut's "solar panels" are the bird spikes and nails, which are missions (TODO 109).
- Still deferred from before: TODO 82 (grass to the horizon), 76 (sky tone), night stars/moon/
  moonlit caps, the ambient particle layer, the ski-field graduation (piece 61, supervised), and the
  instrument tail (60, 77, 33, vantages 26/27).
- New this session and unshipped: 99 (walkability coverage), 100-105 (Eric's MEDIUM list and
  opportunities), 106 (what water still isn't), 107 (where the new instruments stop), 108 (the
  bridge does not sway), 110 (mountains are still cones), 111 (no scanned rock family), 112 (the
  carpark's snow is invisible to node), 113 (what snow still isn't).
- **The bird is still PARKED.** Nothing this session touched it.
