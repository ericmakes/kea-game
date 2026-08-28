# gauntlet-log
(resumable checkpoint log — newest at bottom)

## 2026-08-28 overnight, session 1

### TOOL: capture determinism — CERTIFIED (baseline re-pinned on cbfd9cca)
Verdict: green. Not a ledger piece; the visual tripwire could not run at all without it.
- Puppeteer could not launch: the bundled Chrome for Testing is unsigned, macOS refuses to
  exec it (spawn error -88). Every shot in the first sweep printed GAVE UP. launch() now
  falls back to the system Chrome.
- SURPRISE, and the big one: diff.mjs has never been able to go green. The game seeds
  nothing (setSeed is exported but never called), so buildWorld drew a different country
  at every page load and the same build reshot at ssim 0.82 against ITSELF, against a
  0.965 threshold. capture.mjs now splices setSeed in front of the game boot call.
- SURPRISE 2: seeding the global Math.random is NOT enough. three draws 12 randoms per mesh
  for uuids from the same stream, so adding one object shifts every later draw and
  reshuffles the whole world. Seeding the game rng is what makes it immune.
- Noise floor now 0.976 worst, 0 flagged. 10/11/19 pinned for the first time (22 total).
- Pinned on local Chrome 151 / Metal. The old container pins read ~0.78 here for reasons of
  renderer, not content — that is why the whole set was re-pinned rather than judged drifted.

### PIECE: context-aware grunge (Tier 2 item 1) — CERTIFIED 8c6bedf2949e1733609eafd91a2071b6
Verdict: green. Gate CERTIFIED-SHIP, tripwire 22 compared 0 flagged, worst 0.9650 (torch beam).
- SURPRISE: grunge-lite v1 ran BEFORE the road and carpark were laid, so 2 of its 3 wear discs
  were invisible — carpark mouth under the 0.14 tarmac slab, hut door under the 0.46 hut deck.
  Only the campsite disc has ever been seen. 5 of the 26 stones were sunk in the carpark seal,
  one a boulder standing in the middle of the tarmac at vantage 01.
- Fix: block moved after every surface is built and now reads the surface under each spot
  from the scene; wear takes that colour darkened 0.72 and rides 6mm proud of it.
- Stones on a laid surface are skipped; loop tops back up to 26 in the original draw order so
  surviving stones are bit-identical to v1.
- Proof: battery 9 GRUNGE READS THE GROUND. Bite-tested (forcing dirt height names 0,7.5 and
  13,32.5 as buried).
- EYEBALL: gauntlet/capture/01_carpark_wide.png (boulder gone, oil patch at the carpark mouth)
  and 02_hut_snow.png (hut-door wear moved to the foot of the step; subtle under tussock).

### PIECE: tussock blade variance (Tier 2 item 2) — CERTIFIED b51abe08a70e456e7b537b10a78d0668
Verdict: green. Gate CERTIFIED-SHIP, tripwire 19 of 22 flagged (intentional, judged, re-pinned).
- The instancing site the ledger could not find: buildGrass(), 42000 tapered planes.
- SURPRISE: lean was already there (rotation.z +-0.12) but could never read as a comb.
  rotation.z is applied inside the blade frame, so with a random yaw every blade leaned a
  random way. The field could only ever look like upright spikes. The fix is to tilt about a
  WORLD axis after the yaw.
- grassBlade(x,z) now owns the pose and is exported, so the gate can judge the field with no
  canvas. The 260 big tufts share it, at the same 4 random draws per tuft, so downstream
  scenery (snow, rocks) keeps its positions.
- Judged: 03, 05, 08, 10, 14, 21 all improved-or-equal before re-pinning.
- EYEBALL: 05_tussock_ground.png and 14_player_view.png (the comb), 10_skifield.png (gold
  dominance held after widening the tufts back).

### PIECE: the paddock gate (Tier 2 item 4) — CERTIFIED 0c0693df4fbb60acc32754b7e3b10432
Verdict: green. Gate CERTIFIED-SHIP, tripwire 22 compared 0 flagged (the toy is local).
- SURPRISE: the ledger claim of PADDOCK 0 interactables is wrong. Re-probed after startGame:
  PADDOCK 3 (the sheep pecks). The genuinely empty buckets are ROAD 0 and NEST 0, and both
  are empty because their content is emergent (traffic, stashing) rather than placed.
- Toy shipped: a farm gate hung with three wraps of baling twine. CHEW THE BALING TWINE swings
  the gate open on a tween, drops a carryable length of twine, rattles the sheep. Mission q_twine.
- New vantage 23_paddock_gate: the paddock had no frame at all, so the emptiest area of the map
  was invisible to the tripwire.
- EYEBALL: gauntlet/capture/23_paddock_gate.png (twine wraps at the latch post, kea on them).

### PIECE: wearables persistence (Tier 2 item 5) — CERTIFIED e961cf8bb187529fe1e9a58d6cb1a5f1
Verdict: green. Gate CERTIFIED-SHIP, tripwire 23 compared 0 flagged.
- Kea.wear(prop) split out of take() as a quiet verb; SAVE carries a hats array; applySave
  calls rewear(), minting the ranger cap if the save says you had it and the world has none.
- SURPRISE 1: a restart took the worn hat to the grave. The hat mesh is a child of the bird
  head, so clearing G.keas deleted it while prop.heldBy still pointed at the dead bird.
- SURPRISE 2: the same for anything carried. The new invariant assertion found a GoPro held by
  a bird that no longer existed, in the CLEAN build. startGame now doffs and drops first.
- Staging took 2 attempts (FLAKES law 3): takeProp grabbed a stale beanie from an earlier
  section. Isolating the target on clean ground first is what worked. Logged for the next run.
- No frame to eyeball; this one is mechanical. Proof is battery 9.

### PIECE: HUD juice (Tier 2 item 7) — CERTIFIED 35c17a69692ce3a44bec2c30f450922d
Verdict: green. Gate CERTIFIED-SHIP, tripwire 23 compared 0 flagged.
- G.hudPulse is set from the points that LAND (after the combo multiplier), caps at 1.5, decays
  at 2.4/s in updateFX; the chip scales and glows, HEADLESS guarded.
- Making the pulse a state value rather than a CSS class is the only reason the gate can judge it.
- MANUAL QA (10s): the pulse is transient, no vantage can catch it reliably and none was added.
  Land any 45+ crime and watch the CHAOS chip.

### PIECE: satellite-area juice (Tier 2 item 3) — CERTIFIED 36bbe94f86deedcf5d1b11b73b406e91
Verdict: green. Gate CERTIFIED-SHIP, tripwire 23 compared 0 flagged. New vantage 24_verge_paddle.
- ROAD roadworks paddle (peck to flip, engine repeat convention, pays once only), SKI goggles
  (wearable, exercises the piece-4 save path), TRAILHEAD woollen sock.
- SURPRISE: props ALWAYS fall. Nothing rests on a rail or a rack in this engine, so the sock and
  the goggles could never hang where I placed them. Labels reworded to match where they land
  rather than promising a rail (the SANDWICH PROMISE lesson). Named as next pick 2.
- The gate could not see two of these: the sock was placed INSIDE the rail post and invisible,
  and once moved it was too small to read. Both caught by eyeballing a throwaway close-up.
- Staging took 3 attempts: peckL fires needHits+1 taps, so counting flips by hand was wrong.
  The assertion now derives from the engine flip counter and state flag (FLAKES law 10).

## SESSION END — 2026-08-29
Stop condition reached: 6 pieces certified. REPORT.md written. Final build 36bbe94f, gate
CERTIFIED-SHIP, 24 vantages pinned and green. Nothing parked red; Tier 2 item 6 (night
ambience) still waiting on Eric audio. Highest-value open finding: 08_readability_320 hides
the kea behind the prompt pill, which caps the whole set by CRITIC law.
