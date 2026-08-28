# OVERNIGHT REPORT — 2026-08-29, morning
Six pieces certified, all from OPPORTUNITIES Tier 2. Nothing parked as red.
Final build: 36bbe94f86deedcf5d1b11b73b406e91 — gate CERTIFIED-SHIP, tripwire 24 vantages green.
Branch `gauntlet`, one commit per piece, newest last. Resume by reading gauntlet-log.md.

## Shipped
- TOOL: capture determinism — (baseline re-pinned on cbfd9cca) — the visual tripwire had never
  been able to run here, or go green anywhere; it does now, and every piece below was judged on it.
- PIECE: context-aware grunge — 8c6bedf2949e1733609eafd91a2071b6 — wear reads the surface under
  it and rides proud of it; oil-dark on seal, brown on dirt, three more discs on desire paths.
- PIECE: tussock blade variance — b51abe08a70e456e7b537b10a78d0668 — the field is wind-combed
  instead of a pincushion of upright spikes, and height clumps on a 2.5m cell.
- PIECE: the paddock gate — 0c0693df4fbb60acc32754b7e3b10432 — a farm gate hung with baling
  twine for the emptiest area to chew open; the sheep are rattled and the gate swings.
- PIECE: wearables persistence — e961cf8bb187529fe1e9a58d6cb1a5f1 — the worn hat goes into the
  save file, and two lifecycle bugs that were eating carried props on restart are fixed.
- PIECE: HUD juice — 35c17a69692ce3a44bec2c30f450922d — the chaos meter kicks for what actually
  lands, after the combo multiplier, and settles inside a second.
- PIECE: satellite-area juice — 36bbe94f86deedcf5d1b11b73b406e91 — a roadworks paddle at the
  verge, ski goggles at the rack, a woollen sock under the boot rail.

## Parked
- Night ambience bed (Tier 2 item 6) — blocked on your audio, exactly as the ledger says. Not
  started; the hooks are still waiting.
- Nothing else. No piece went red, no assertion was weakened, no gate was committed red.

## Frames to eyeball
All under gauntlet/capture/ (fresh) with the pinned reference in gauntlet/capture/baseline/.
- 01_carpark_wide.png — the boulder that stood embedded in the middle of the tarmac is gone,
  and the carpark mouth now carries an oil-dark wear patch.
- 05_tussock_ground.png and 14_player_view.png — the comb. This is the piece with the widest
  reach; if the lean is too strong for you it is one constant in grassBlade().
- 10_skifield.png — gold dominance after the tufts were widened back. Check I did not thin the
  country too far.
- 23_paddock_gate.png — new vantage. Twine wraps at the latch post, kea on them.
- 24_verge_paddle.png — new vantage. Green paddle at the verge, and the seal wear reads here too.

## The one you should look at first
08_readability_320.png. At 320px the kea is COMPLETELY hidden behind the E HOLD to RIP WIPER
prompt pill, that pill collides with the TAB pill, and the chapter line is clipped at both
edges. By CRITIC.md the couch read caps every shot in the set at 5 when a stranger cannot
instantly find the bird. This is not something I caused and not something I fixed — it is the
highest-value frame on the board and it wants a layout decision from you, not from me.

## Suggested next three picks
1. THE COUCH READ (new, and I would put it first). Move the prompt pill off the bird, stop the
   two pills colliding, and inset the chapter line. The score cap for the whole set is sitting
   on this one frame.
2. Props rest where they are placed. Nothing in the world can sit on a rail, a rack or a
   clothesline: props fall to the ground every time, so the pegs, the skis, the goggles and the
   sock all end up on the dirt. A small collider pass on rails and lines would let set dressing
   stay where it was dressed. This one bit me twice tonight.
3. Seed the world. The game calls setSeed never, so every load builds a different country, and
   three draws twelve randoms per mesh from the same stream. The capture harness now works
   around both, but the last of the tripwire noise is buildGrass tinting blades with
   Math.random rather than the seeded rnd(). Moving that one call takes the noise floor to
   near zero. Whether the WORLD should be identical every session is a design call and yours.
Tier 2 item 6 (night ambience) stays parked until you drop the audio in.
