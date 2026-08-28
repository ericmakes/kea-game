# OPPORTUNITIES — the refinement ledger (2026-08-28 pass)
## Tier 1 — implemented this pass
- SANDWICH PROMISE: credit moved from take to the nest-scoff; label now mechanically honest.
- FINALE FANFARE: the apex unlock announces itself (popup + fanfare) instead of appearing silently.
- GRUNGE-LITE v1: 26 seeded greywacke stones + 3 wear discs (hut door, carpark mouth, campsite).
  Judged at 01/06 — the country reads walked-on.
## Tier 2 — shipped overnight 2026-08-29
- 1. CONTEXT-AWARE WEAR: done (8c6bedf2). Wear reads the surface under it and rides proud of it;
  three more discs on desire paths. Found: two of the three v1 discs were buried under the
  tarmac and the hut deck, and five stones were sunk in the carpark seal.
- 2. TUSSOCK BLADE VARIANCE: done (b51abe08). Site was buildGrass(), 42000 planes. Lean existed
  but was applied inside the blade frame, so a random yaw pointed it a random way and no comb
  could ever read. Tilt now happens about a world axis; heights clump on a 2.5m cell.
- 4. PADDOCK DENSITY: done (0c0693df). Geometry verified sound; the ledger count of 0 was wrong
  (it is 3 sheep pecks). Given a gate hung with baling twine to chew open, mission q_twine.

- 3. SATELLITE JUICE: done (36bbe94f). Roadworks paddle at the verge, ski goggles at the rack,
  woollen sock under the boot rail. Found: props always fall, so nothing can be placed on a rail.
- 5. WEARABLES PERSISTENCE: done (e961cf8b). The worn hat is in the save. Found and fixed: a
  restart took the worn hat, and anything carried, to the grave with the old bird.
- 7. HUD JUICE: done (35c17a69). The chaos meter kicks for the points that land, not the base.

## Tier 2 — still open
- 6. Night ambience bed: crickets/wind loop under nightT (hooks exist, needs Eric audio). PARKED.

## Tier 3 — found while working, ranked (2026-08-29)
1. THE COUCH READ: at 320px the prompt pill covers the kea entirely, the pills collide, and the
   chapter line is clipped both edges. CRITIC caps the whole set on this frame. Highest value.
2. PROPS REST WHERE PLACED: no rail, rack or clothesline holds anything - props fall every time.
   A collider pass on rails and lines. Bit this pass twice.
3. SEED THE WORLD: setSeed is exported and never called, so every load is a different country;
   buildGrass also tints blades from Math.random. Capture works around it; the game does not.

## Tier 2 — named, ranked, awaiting appetite
1. Context-aware wear colours (brown on dirt, oil-dark on seal); 2-3 more discs on desire paths.
2. Tussock blade variance (height/lean jitter) — blade instancing site still to be located.
3. Satellite-area juice: ROAD/SKI/TRAILHEAD sit at 4-5 interactables vs core 10-20; one gag each.
4. Paddock density: bucket probe read 0 interactables — verify geometry, then give it one toy.
5. Wearables persistence: worn hat into the save file (Dumpster Gang ref 17 lean-in).
6. Night ambience bed: crickets/wind loop under nightT (hooks exist, needs Eric's audio).
7. HUD juice: chaos-meter pulse on big awards.
## Probe facts (evidence base)
Density CARPARK 20 / CAMP 12 / HUT 10 / ROAD 4 / SKI 5 / TRAILHEAD 4 / PADDOCK 0(verify).
Re-probed 2026-08-29 after startGame, radius-bucketed: CARPARK 14 / HUT 10 / CAMP 6 / SKI 5 /
TRAILHEAD 4 / PADDOCK 3 (now 4) / ROAD 0 / NEST 0. ROAD and NEST read 0 because their content is
emergent (traffic, stashing) rather than placed - that is the honest gap, not the paddock.
Onboarding: page-1 = five clear carpark tasks; nearest interactable 4u (locked latch, hidden).
Traversal: walk 4.6u/s across ~100u map; flight covers the rest. Feel: right.
