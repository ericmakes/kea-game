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

## SESSION 2 — 2026-08-31 (overnight, TODO diet)

### PIECE: night-tint-trees (TODO item 1) — CERTIFIED 1472f58a0ec1fdb92c7b2a7a893f9634
Verdict: green. Gate CERTIFIED-SHIP, tripwire 24 compared 0 flagged, 21 and 22 re-pinned.
- nightTint(m) is the whole mechanism: a material hands over its day colour once, the registry
  computes its night colour as day x 0.30 with a +0.02 hue nudge and -0.30 saturation, and
  nightApply lerps day to night on nightT alongside the sky, the fog and the warm windows.
- WHY multiplyScalar and not a hand-picked night hex: scaling all three channels scales HSL
  lightness by exactly the same factor and leaves hue and saturation alone, so the 0.45 contract
  the TODO asked for holds BY CONSTRUCTION for every material, present and future. offsetHSL
  then buys the cool cast without touching lightness. The proof reads 0.301 with no tuning.
- Six materials registered: bark (trunk plus branch, one shared material), the under-canopy
  beech mass, the three canopy greens, and the far beech skirts at r 88-100.
- SURPRISE: the bark material is shared with the walking-pole knob, a 5cm sphere on Trish pole
  (mat() memoises on colour plus extras, and cyl() passes no extras). Left shared on purpose -
  a wooden knob going dark at night is correct, and splitting the key would cost a draw call.
- Staging took 2 attempts (FLAKES law 1, the oldest one in the book). The first proof read its
  day colour off the live material and found 0.039 - the finale section earlier in the battery
  had tripped the wanted>=3 auto-night driver, and night PERSISTED into my section. The fix is
  to own the day first (night=false, nightManual=true, tick to settled) exactly as law 5 says
  to own the night, and to read the day value from the registry rather than the live material.
- EYEBALL: 21_night_camp.png (the right-edge canopy and the mid-ground tree now sit dark against
  the mountains instead of glowing daylight green) and 22_torch_beam.png (the big left tree).
  Day vantages were reshot as a control and did not move beyond the known 0.977 capture noise.

### PIECE: glass-sky-gradient (TODO item 2) — CERTIFIED 438f6b72dd09f60c3d315dca4bf1472f
Verdict: green. Gate CERTIFIED-SHIP, tripwire 24 compared 0 flagged. Glazing now ramps.
- DEVIATION FROM THE TODO, on measured evidence. The brief asked for a detailTex kind 'glass'
  registered in MAPKIND. I measured rbox first and that route cannot work. rbox is an
  ExtrudeGeometry, so (a) its UVs are in MODEL UNITS - v spans -h/2..h/2 on a cap face, so a
  0..1 gradient shows only a 0.55-wide SLICE of itself on a window band - and (b) world y
  correlates 1.00 with V on the cap faces but 1.00 with U on the side walls, which is where the
  caravan side windows actually face. No single texture is vertical on both. DIRECTION.md line
  34 already says it: rbox UVs slice canvas textures. With RepeatWrapping the panes would take a
  hard seam across their mid-height; with ClampToEdge they would read flat, which is the very
  complaint. Numbers in the scratch measurement: front band v -0.275..1.040, door pane
  v -0.475..1.030, side face y-to-U 1.00.
- SHIPPED INSTEAD: vertex colours. glassRamp() clones the pane geometry (roundedBoxGeo caches by
  dims - poisoning the cache would tint non-glass boxes) and writes a per-vertex colour ramping
  on the pane OWN bounding-box y, so it is exactly vertical on every face of every pane
  regardless of dims. GLASSTOP 0.90,0.945,1.00 to GLASSBOT 1.00,1.020,1.01 as a multiplier on
  the existing glass base: worst channel delta 0.100, inside the 0.12 ceiling the TODO set.
  Better than the brief in three ways - no canvas, so the proof is a first-class node assertion
  rather than a stub-executed painter; per-pane correctness; and it costs no texture.
- pane() replaces nine rbox glazing calls. 18 panes live in the scene (traffic brings its own).
- SURPRISE, and it would have shipped silently: moving the panes to a new material memo key
  (mat(c,GLASSX)) ORPHANED the warm night window. boot() had w1=mat(0x9FB8C4) with no extras, so
  after the patch it held a material nothing in the scene wore, and the caravan window glow at
  night would have quietly stopped while every existing assertion stayed green. Fixed at the
  source and the proof now pins it both ways: warmMats[0] is a registered glazing material AND
  something in the scene actually wears it.
- REGISTRY NOTE: registers the two MATERIALS, not the meshes. Cars spawn and despawn panes, so a
  mesh list would pile up references to dead traffic; the proof traverses the live scene instead.
- EYEBALL: 20_dead_rear.png (rear window band, bluer at the head, near-white at the sill) and
  12_seal_midpeel.png / 18_rear_close.png. Deliberately gentle - 10% is a 10% look. 07 and 15
  re-pinned for car glass. Nothing crossed the tripwire threshold; all five were re-pinned as
  intentional. If Eric wants it to read harder, GLASSTOP is the one knob.
- SEEN WHILE EYEBALLING 20: the caravan door pane stands out as a dark vertical fin off the
  side, exactly as new TODO item 10 (caravan-door-orientation) describes. Confirmed, untouched.

### PIECE: score-popup-fanout (TODO item 3) — CERTIFIED 0758d092ed473f72e18665ee78cf7940
Verdict: green. Gate CERTIFIED-SHIP, tripwire 24 compared 0 flagged, 07/09/12 re-pinned.
- popStack() runs BEFORE the HEADLESS bail and returns {i,dx,scale,delay}. Same lesson as HUD
  juice: computing the fan as STATE rather than as a CSS class is the only reason the gate can
  judge it. The DOM path then spends that state - a wrapper div owns translateX and scale so the
  existing rise keyframes keep their own transform, and animationDelay plus fillMode both gives
  the stagger.
- DISTINCT BY CONSTRUCTION, not by luck. The obvious build is a hash per popup and a hope that no
  two collide; that gate would go red on a hash collision one night for no reason. Instead the
  68px band is cut into five slots, one per stack depth, and the hash only jitters WITHIN a slot
  (+-40% of slot width). Two different depths can never land on the same x. Structural floor on
  the closest pair is 2.72px, the assertion floor is 2px, so it cannot flake. Measured 6.48px.
- Slots fill in the order 2,0,4,1,3 - centre, far left, far right, mid left, mid right - so a
  burst opens outward instead of walking a diagonal staircase.
- The hash is Math.sin-based (the idiom already in buildGrass), NOT rnd(). Deliberate: rnd()
  draws from the seeded world stream, and capture.mjs warns in its own header that anything
  drawing from that stream at runtime reshuffles later spawns and turns the tripwire back into
  noise. A popup must not be able to move a car.
- The stack index derives from POPLIFE, the feed own 1.7s life, rather than a new invented window
  (law 10). The proof also pins the release: after a burst ages out, the next lone popup is i=0
  and full scale, so it is never shrunk as if it were buried.
- EYEBALL: 09_colossal.png against the old baseline is the whole argument. Before: five
  pixel-identical lines in a rigid left-aligned column, overlapping the CHAOS chip. After: five
  offsets, five scales, five fade starts, and clear of the chip.
- OPEN FINDING, NOT MINE, worth a piece: in 09_colossal the colossal feed lines render as
  "x +1500 x5" - a bare leading x where a crime name should be. Present in the PINNED BASELINE,
  so it predates this work. Ruled out: it is not any of the 40 enumerated award() labels, and a
  40s headless colossal run only ever produced named labels (A DRIVER GETS OUT, DRIVER THROWS A
  CHIP, GROWTH SPURT - LEVEL 2). Cause not confirmed, so not guessed at. Needs a browser feed to
  catch it. Suggest it as a small piece: find the caller that popups a bare x at 300 base.

### PIECE: capture-staging-subjects (TODO item 4) — CERTIFIED 0758d092ed473f72e18665ee78cf7940
Verdict: green. Gate CERTIFIED-SHIP. GAME FILE MD5 UNCHANGED - identical to piece 3, as the TODO
required. Only capture.mjs changed, plus one new tool. Tripwire 24 compared 0 flagged after
re-pinning 04/07/09/17; subjects 6 checked 0 missing.
- ROOT CAUSE, and it was one cause for three of the four: the bird is STILL BEING SIMULATED
  during the settle. 04/09/17 staged a pose once and then slept 600-900ms while gravity, flap
  drive and colossal contact chaos carried the bird out of frame. A one-shot stage cannot hold a
  live bird. capture.mjs now has PIN(body), which re-applies the pose every animation frame for
  as long as the page lives - the harness-side reading of FLAKES law 7, and law 4 besides (pin
  the state INSIDE the loop, every frame).
- 07 was a different cause: QUIET deletes every traffic car, so the jam vantage could only ever
  be an empty road. spawnTraffic is not exported and the game file was out of scope, so the fix
  drives the game OWN spawner - zero its timers, tick, and move each new car out of the spawn
  mouth so the next is let in (it refuses to spawn within 7 units of a same-direction car).
  Five cars, jammed, cone in the lane, bird standing on the centre line facing them down.
- 04 took two tries on taste. flapPh PI/2 is max stroke, which raises the wings to 68 degrees of
  dihedral and EDGES the scarlet panel away from a low camera. flapPh 0.36 gives stroke 0.615
  rad, wings spread rather than raised, open still 0.87 - and open above 0.25 is the only thing
  that makes oPan visible at all. The vantage is called underwing; now it has one.
- 09: the colossal bird at LV10 measures 1.61 units tall against a 1.2-unit car, so colossal only
  READS next to a car. Staged clear of the parked row at z 20.0, three-quarter to the lens.
- RESOLVES the open finding logged under piece 3. The bare "x" in the colossal feed was not a
  game bug at all - capture.mjs pumps the colossal score with award(300,'x') and its own
  placeholder label was being photographed. Now award(300,'CAR: BUNTED'). Nine identical lines of
  a real crime name is a much better showcase frame, and the game file never needed touching.
- NEW TOOL: gauntlet/verify/subjects.mjs, a PRESENCE tripwire, run beside diff.mjs. diff.mjs
  could never have caught this class of bug: a birdless frame is perfectly stable, and SSIM only
  asks whether a frame CHANGED. Four vantages shipped subjectless for weeks at 0 flagged.
- THE TRAP INSIDE THE PROOF, worth its own law: a plain hue-band olive counter measures the
  LANDSCAPE, not the bird. Measured on the birdless baselines, a loose h45-95 window scored 3939
  olive pixels in the 07 box and only 1529 in the correctly staged frame - the tussock is gold
  and the grass is green and both sat inside the window, so the test read GREEN for the empty
  road and RED for the jam. The shipped classifier is derived from the palette instead: hue 52-80
  excludes gold at 41 and grass at 89, and saturation under 0.62 excludes tussock and ground,
  which sit above 0.65. Every floor is a measured number and the file records what the birdless
  frame scored, so the margin is auditable in both directions.
- VERIFIED ADVERSARIALLY, which is the only reason I trust it: copied the tool into a scratch tree
  fed the four OLD frames and it failed all 6 checks and exited 1. A presence test that has never
  been shown to fail is not a test.
- EYEBALL: all four. 04_flight_underwing.png (two scarlet bands under spread wings),
  07_jam.png (queue, cone, bird on the centre line, and the game own hint reading "stand your
  ground and see what the traffic does"), 09_colossal.png, 17_flight.png.

### PIECE: hud-tab-reflow (TODO item 5) — CERTIFIED 6b7a4d36a52eb5ecfb38cfe51c09c5d6
Verdict: green. Gate CERTIFIED-SHIP, tripwire 24 compared 0 flagged, 07 and 08 re-pinned,
subjects 6 checked 0 missing.
- The collision is pure geometry: the TAB pill is centred on the bottom edge, and the prompt
  plate is anchored to that SAME edge at max-width 44vw, so at 320px the plate reaches the pill.
  Geometry is exactly what a node-only gate cannot see, so the wrap is PREDICTED from the plate
  own CSS constants (font 21, padding 14, 44vw, 0.52 average char width) and the DOM is left with
  nothing to decide - it reads G.tabDocked and toggles a class.
- WHY I TRUST THE PREDICTOR: it was validated against two real captures BEFORE the proof was
  written, not fitted to the test. 19 chars at 320px predicts 2 lines and vantage 08 shows 2
  lines. 48 chars at 960px predicts 2 lines and the jam hint in vantage 07 shows 2 lines. Same
  19 chars at 960px predicts 1 and shows 1. Three independent points, no tuning.
- Both trigger branches ship and both are proven: width alone docks the pill at 320 with an empty
  plate, and a wrap docks it at 960 where nothing is narrow at all. 07 is the visible proof of the
  second branch - its two-line road hint used to sit right beside the centred pill.
- Staging took 2 attempts (FLAKES law 1 AND law 3, together). The first proof stood the bird in
  the road and asserted the hint wrapped the plate. It read 1 line, not 2: hintScan only fills a
  prompt that is EMPTY, and by that point in the battery an earlier section had left something at
  that spot whose shorter interactable prompt won. Standalone it passed; in the battery it did
  not. Fixed by splitting the two claims - the world check stays a world check (the bird does pick
  up the jam hint) and the CONTRACT is driven straight through setPrompt plus hudReflow with no
  tick in between, so nothing can overwrite the plate under the assertion.
- setPrompt joins plateLines and hudReflow in the exports. A UI setter is a fair thing to export
  when it is the only way to make a UI contract hermetic.
- EYEBALL: 08_readability_320.png - the pill now sits bottom-right at 11px and RIP WIPER is fully
  readable for the first time. Also 07_jam.png for the wrap branch at full width.

### PIECE: preen-head-visibility (TODO item 6) — CERTIFIED 347b4b936d00cd12f634f77177ce2f17
Verdict: green. Gate CERTIFIED-SHIP, tripwire 24 compared 0 flagged, 13 re-pinned, subjects clean.
- MEASURED FIRST, and the measurement changed the piece. The TODO asked for head y at or above the
  wing-top line. Taken literally that is UNSATISFIABLE in this rig: the head pivot is never above
  the wing-bbox top in ANY pose, because the folded wing tops are simply higher than the head.
  Standing still the head sits 0.048 under it; in the poseLock photographic pose, 0.033 under.
  The pose the whole set is judged on is already "below the line".
- So eps is not a fudge, it is the contract. The old preen drove the head pivot to 0.085 under the
  wing line - nearly double the resting deficit - and the beak tip to 0.379 under against 0.094 at
  rest. eps 0.055 sits just above the resting deficit, so the assertion says something worth
  saying: THE PREEN MAY NOT CARRY THE HEAD LOWER THAN THE BIRD CARRIES IT STANDING STILL.
- The fix is not "less preen". neckX went from +0.42 (neck slumped down) to -0.06 (neck arched
  very slightly UP), and the reach moved into the yaw, 0.9 to 1.18 rad. The head now goes OUT to
  the shoulder instead of DOWN under the wing. headX barely moved (0.52 to 0.44) and deliberately
  so: H.rotation.x turns the head ABOUT its own pivot, so it costs the contract NOTHING and pays
  for the entire read of the animation. That is the whole trick of this piece.
- Also folded the preening wing from -0.82 to -1.02. The wing at -0.82 was raised right beside the
  head, and no amount of head-height fixes an occluder. This is probably what actually stopped the
  headless read; the y contract alone would not have.
- Result: worst head deficit over the full cycle both sides is 0.0459, which is BETTER than the
  0.0481 the bird manages standing still. Worst beak 0.297, from 0.379.
- The proof range-asserts every 0.05s across both sides, 142 samples, and it also pins that the
  animation is still a PREEN and not a scan: the beak must stay below the head pivot on every
  single sampled frame, and reach deeper than a resting bird ever does. A visibility fix that
  quietly turned preening into head-turning would pass a y-only test and fail this one.
- VERIFIED ADVERSARIALLY: temporarily restored the old constants and the battery went red on 4
  assertions (head -0.0983, beak -0.410), then restored and green again. eps was NOT chosen to
  make the new numbers pass; it was derived from the resting pose before the new pose existed.
- PREEN joins the exports so the test reads the engine tolerance instead of restating it (law 10).
- EYEBALL: 13_idle_preen.png. The head is a distinct lobe out to the right with the dark beak
  clear of the body mass, where it used to be tucked low and merged into the wing. Honest caveat:
  at this camera the gain is modest, and the complaint named the FOLLOW cam, which vantage 13 is
  not. If Eric wants the follow-cam read judged, that wants a new vantage staging the preen from
  behind and above - named as a next pick.

## SESSION END — 2026-08-31
Stop condition reached: 6 pieces certified (TODO items 1-6, in order). REPORT.md written.
Final build 347b4b936d00cd12f634f77177ce2f17, gate CERTIFIED-SHIP, 24 vantages pinned at 0
flagged, subjects.mjs 6 checked 0 missing. Nothing parked, nothing red, no piece needed a third
staging attempt (two needed a second: night-tint-trees and hud-tab-reflow, both FLAKES law 1).
Open TODO: items 7, 8, 9, plus the 16 caravan/VS pieces appended mid-run (10-25).
NEW LAW EARNED THIS RUN, for the ledger: a presence test is not the same tool as a drift test,
and a colour-band classifier must be proven against the frame that LACKS the subject before it is
trusted - measured on the birdless baselines, a naive olive window scored the tussock higher than
the bird and would have passed the empty road.
SECOND LAW: measure the rig before believing a brief. Two of six pieces (glass, preen) asked for
something the geometry cannot do, and both were only caught by measuring first.

## SESSION 3 — 2026-09-01

### GATE WAS RED ON ARRIVAL (before any piece)
The session opened by running the gate on a clean tree at the certified md5 and it came back
CERT-FAIL: "every driven classic mission completes (12 driven, 1 failed)". Then it went green
11 times running - 8 standalone battery runs and 3 full gate-shaped serial passes - and has not
reproduced since.
- The mission id was UNRECOVERABLE. gate.sh keeps only `tail -1` per battery, so the "FAILED:"
  console line scrolls past, and the assertion message carried counts without names. That is the
  actual defect worth fixing: a rare red that cannot say what went red is a red you cannot chase.
- Fixed the DIAGNOSTICS, not the assertion. The message is byte-identical when green and only
  grows the ids when it fails, so nothing was weakened and no baseline prose moved.
- PROVED BY SABOTAGE, because a diagnostic nobody has seen fire is not a diagnostic: killing the
  `can` driver prints "12 driven, 1 failed: can" - the exact shape of the opening failure. That
  also settles what the numbers meant. 13 drive() calls each push to driven or failed, so
  12+1=13: every mission WAS attempted and exactly one did not complete. No mission dropped out.
- Logged as FLAKES law 11, review-tier under law 8. Next occurrence names itself.

### PIECE: floating-text-cull (TODO item 7) — INVESTIGATION, PREMISE FALSIFIED, no game change
Verdict: green gate, GAME FILE MD5 UNCHANGED at 347b4b936d00cd12f634f77177ce2f17. No patch,
because the thing the piece was written to fix does not exist.
- THE BRIEF OFFERED TWO FORKS - stray label, or legitimate signage - and the answer is neither.
  THERE IS NO WORLD-SPACE TEXT IN THIS GAME AT ALL. Zero occurrences of the string Sprite in the
  file, so there is no billboard/label system to leak one. Exactly two fillText sites exist
  (mkKeaSign CAUTION / NEXT 5 km, and buildSign DONT FEED THE KEA), both painted into a canvas
  texture on a plate bolted to a post, both accounted for, and neither anywhere near the region
  complained about.
- WHAT IS ACTUALLY OUT THERE, identified by projection rather than by squinting: I staged
  vantage 20 under the capture harness, then projected every mesh in the scene through that
  camera and listed what landed in the band x 800-960, y 170-210. Twenty hits. The one at the
  complaint position is a CircleGeometry, 5.2 across, textured, pale #ebf3fa, at world
  (1.2, 0.05, -38.3), 53 units from the lens, screen (899.5, 191.9). That is a SNOW PATCH.
- CONFIRMED BY ABLATION, which is the only reason I believe it: hid every flat circle decal on
  the live page and reshot the same frame. The pale glyph-like band is GONE, and nothing else in
  the crop moved. Identification closed.
- WHY IT READS AS TINY LETTERING: it is a flat disc at y=0.05 seen from eye height 2.3 at 53
  units, so it projects to a roughly one-pixel sliver, and the tussock in front chops that sliver
  into disconnected pale fragments on a dark ground. Fragmented high-contrast specks in a
  horizontal row is exactly what small text looks like. It is aliasing, not glyphs.
- AND IT IS NOT A DEFECT. I suspected the disc was buried in sloping ground - a flat decal at
  fixed y is the classic way to get a clipped bright band - so I measured. groundHeightAt at
  (1.2,-38.3) is 0.000, and sampling the whole footprint (16 rays x 4 radii) gives raised
  samples 0/80. The disc sits correctly on dead-flat country. Distance culling was the briefed
  remedy for the stray fork and it would be wrong here: a legitimate snow patch that pops out of
  existence at 40 units is a worse artifact than a distant sliver, and the same aliasing would
  come back on every other ground decal in the game.
- NO CODE CHANGE IS THE DELIVERABLE. Recorded rather than improvised on.
- SEPARATE REAL DEFECT FOUND WHILE DOING THIS, and it is visible in a pinned showcase frame -
  see TODO item 28. Two of the ten snow patches are buried in the ski-field shed. That is a
  different frame (vantage 10, not 20) and a different cause, so it is NOT folded into this
  piece.

### PIECE: white-object-18 (TODO item 8) — CERTIFIED 01675b29bbc79301633b8e383bc72dde
Verdict: green. Gate CERTIFIED-SHIP, tripwire 24 compared 2 flagged (BOTH pre-existing and proven
not mine, see below), subjects 6 checked 0 missing. Nothing re-pinned.
- IT IS CARPARK GRIT, and it is intentional. The pale rounded lump behind the bird at the caravan
  door is one of the 26 gravel-scatter pebbles built at line 937: a scene-level 5-segment sphere,
  radius 0.05 to 0.12, squashed to half height, laid over the carpark slab. Not seal-step debris,
  not the nest egg, not an orphan. So the verdict is KEEP, which is the fork the TODO asked for.
- HOW IT WAS IDENTIFIED, because squinting at a 33-pixel blob proves nothing: staged vantage 18
  under the capture harness and projected every mesh in the scene through that camera, then
  filtered to the blob screen box. One hit - SphereGeometry, geometry bbox 0.17x0.20x0.18,
  material #525961, at world (-8.96, 0.16, 10.01), 2.76 units from the lens, screen (553,368).
  Every one of those numbers matches the line-937 scatter: y exactly 0.16, radius in band, five
  segments (hence the pentagon facets), and #525961 is 0x9AA0A6 stored linear.
- WHICH TINT MATTERS, and it is the whole reason the thing reads wrong. The scatter alternates two
  greys: PAL.gravel on even indices and 0x9AA0A6 on odd ones. PAL.gravel is registered in MAPKIND
  for the speckle detail map. 0x9AA0A6 WAS NOT. So thirteen of the twenty-six pebbles rendered as
  flat untextured putty while their thirteen siblings rendered as stone, and the flat ones are
  the ones that read as a dropped white object. One line fixes it: _mk(0x9AA0A6,'speckle'). That
  is the "texture it" half of the TODO instruction, and it was a real inconsistency, not a
  cosmetic preference. The same colour is the hut step stone, which also wanted speckle.
- THE "NAME IT" HALF: the scatter was not recorded to G at all - unlike G.stones and G.wear
  twenty-five lines below it, which both push their placements to a registry. That is exactly why
  this piece needed a browser projection to answer a one-line question. It now pushes to G.gravel
  in the same house style, so the population is nameable and, more to the point, assertable.
- STREAM-NEUTRAL, PROVED, not assumed. Recording to G.gravel meant hoisting the three rnd() calls
  out of the sph() argument list into locals, and argument order IS the rnd order, so getting it
  wrong would have reshuffled the entire captured world. Verified by fingerprint: seeded both the
  HEAD build and the patched build with setSeed(20260828), booted, and hashed every mesh world
  position. 1039 meshes and md5 6d9233cf3ce11c1e1e0cb1f8d78cac63 on BOTH. Identical world.
- A TRAP I WALKED INTO FIRST, worth recording: my first stream check compared gravel positions
  before and after and they were completely different, which looked like a disaster. They differ
  because THE WORLD IS UNSEEDED BY DEFAULT - RNGF falls back to Math.random unless setSeed is
  called, and only capture.mjs seeds it. Two consecutive runs of the SAME build give a different
  carpark. So the headless batteries build a different world every run, and no assertion may ever
  hardcode a built-in coordinate. That also means the browser gravel is nowhere near where the
  headless gravel is, which is why the proof pins the CLASS and not the coordinate.
- THE PROOF pins the decision both ways, as the TODO asked. G.gravel is a named population of 26;
  every pebble is inside the carpark slab footprint, which is what makes a pebble at the caravan
  door legitimate BY CONSTRUCTION; the caravan door is inside the scatter reach; every named
  pebble has a real mesh; both tints are read out of MAPKIND rather than restated (law 10); and
  the one with a future - NOTHING else unparented is loose on the carpark slab.
- VERIFIED ADVERSARIALLY, twice. Un-registering 0x9AA0A6 goes red on "BOTH are registered speckle
  (1/2)". Dropping a stray white sphere at the exact vantage-18 anchor goes red on "27 spheres
  there, all 26 of them named grit" - the tripwire catches precisely the bug class this piece was
  opened for.
- MAPKIND joins the exports. It is a registry, and reading it beats restating it (law 10).
- THE TWO FLAGGED VANTAGES ARE NOT MINE, and I proved it rather than asserting it. 19_roof_follow
  and 22_torch_beam flagged at 0.9606 and 0.9494. Control: restored the HEAD game file, reshot
  those two, and they flag AT THE SAME BASELINE slightly WORSE - 0.9576 and 0.9438. Repeated
  twice more: 19 sits 0.956-0.961, 22 sits 0.944-0.950. Consistent, so it is not shot flake, and
  the game file is byte-identical to the one that pinned them at 0 flagged last session. Root
  cause diagnosed, see the finding below. Nothing re-pinned: my own change is sub-threshold on
  all 24, and re-pinning a frame I did not move would have laundered someone elses drift.
- EYEBALL: 18_rear_close.png. The pebble is STILL THERE and is meant to be - it is grit. It is
  now speckled rather than flat putty. If you want it gone from that spot the knob is the scatter
  count or an exclusion around the caravan door, and that is a taste call I did not make.

### FINDING: two vantages are mis-staged against the flake laws (not fixed in piece 8)
Filed as TODO item 29. Both flagged frames trace to staging that the FLAKES ledger already warns
about, and both drift with machine load, which is why they passed last session and fail now on
an identical game file.
- 22_torch_beam VIOLATES LAW 5 OUTRIGHT. It sets G.night=true and G.nightT=1 and calls
  nightApply(1), but it never sets G.nightManual. Law 5 is explicit: nightT eases toward the
  auto-driver verdict every frame, so tests set night AND nightManual, never nightT alone. Over
  the 900ms settle the frame eases back toward day by however many animation frames the machine
  managed. 21_night_camp has the same omission and sits at 0.9791, the worst of the passing
  frames - same cause, smaller because there is no torch beam to expose it.
- 19_roof_follow is one of only TWO vantages in the whole set that set the camera directly
  instead of through camLock, so the follow cam lerps away from the staged position for the
  entire settle and lands wherever the frame count leaves it. Its bird is also parked at y=5.2 on
  the roof with no per-frame PIN, so it is free to be moved by gravity and the roof logic (law 7
  and the piece-4 lesson: a one-shot stage cannot hold a live bird).

### PIECE: vantage-staging-vs-the-flake-laws (TODO item 29) — CERTIFIED 01675b29bbc79301633b8e383bc72dde
Verdict: green. GAME FILE MD5 UNCHANGED - capture.mjs only, plus one new tool. Gate
CERTIFIED-SHIP, tripwire 24 compared 0 flagged after re-pinning 19/21/22, subjects 6/6.
- WHY THIS WAS WORTH A PIECE: two frames flagged in piece 8 against a BYTE-IDENTICAL game file,
  and the answer was not drift at all - those vantages had never reshot the same twice. diff.mjs
  structurally cannot notice that. It asks whether a frame changed since it was pinned, so a
  vantage whose staging wanders with machine load reads as permanent drift no matter how often it
  is re-pinned. That is exactly how 22_torch_beam sat in BASELINE.md as "known-noisy" across four
  builds without anyone finding a cause.
- NEW TOOL: gauntlet/verify/stability.mjs. It reshoots a vantage N times and compares the takes
  AGAINST EACH OTHER, baseline out of the picture. BASELINE.md shows this measurement was done
  once by hand back in August (0.976 worst) and never automated; now it is an instrument.
- THE THRESHOLD IS CALIBRATED, NOT INVENTED. Measured before touching anything: 03_kea_plate, a
  properly camLocked and poseLocked vantage, reshoots at 0.9976, while the three suspects sat at
  0.9850 / 0.9860 / 0.9852. 0.995 separates them cleanly with room on both sides.
- FIVE VANTAGES FIXED, and every single cause was a law already in the ledger that nobody had
  applied to the camera rig:
    19_roof_follow  0.9850 -> 0.9988  one of only TWO vantages that set cams[0].position directly
                                      instead of using camLock, so the follow cam spent the whole
                                      settle lerping away from the staged pose.
    22_torch_beam   0.9852 -> 0.9970  LAW 5 outright: night and nightT set, nightManual never set,
                                      so the frame eased back toward the day driver all settle.
    21_night_camp   0.9860 -> 0.9986  same law-5 omission, AND the camp fire is four sines on
                                      G.time plus a Math.random spit. Freeze G.time and hold
                                      _fireSpit above zero: that takes the deterministic branch
                                      and the random is never rolled at all.
    02_hut_snow     0.9899 -> 0.9988  QUIET IS NOT QUIET - see below, this is the big one.
    16_trish        0.9911 -> 0.9983  a human opted OUT of the park is a human the AI owns again.
- THE FINDING THAT MATTERS MOST: QUIET parks all four humans at (46,46) ONCE, and the ambient AI
  walks them straight back. That is FLAKES law 4 word for word - pin state INSIDE the loop, every
  frame - and the harness was breaking its own law. MEASURED on vantage 02: dave is at (46,46) at
  stage time and at (-19.19,-4.16), in frame beside the hut, 900ms later. Whether he arrived
  before the shutter was down to the machine.
  THE PROOF THAT IT HAD BEEN HAPPENING FOR MONTHS: the OLD baselines for 19 AND 21 both have a
  stray hi-viz human standing in frame. Those were pinned, judged and shipped with an escaped
  walker in the shot. Nobody saw it because SSIM cannot tell you a frame is wrong, only that it
  changed - the same blind spot subjects.mjs was built for in piece 4.
  QUIET now re-parks every frame, state included, and a vantage that WANTS a human on set clears
  h._park before staging them.
- 22 TOOK THREE STAGING ATTEMPTS and the first two are worth recording because both were
  deterministic and both were WRONG. Attempt 1 (nightManual) got it to 0.9968. Attempt 2 gave rex
  a park opt-out, which regressed it to 0.9847 - the per-frame park loop changed the frame budget,
  and 22 was still frame-count sensitive through rex and his torch. Attempt 3 pinned rex per frame
  and hit 0.9992 - but KILLED THE BEAM, which is the entire subject of the vantage. Forcing
  state='idle' stops the torch reading, because the torch only lights up when the ranger has you.
  A vantage can be perfectly reproducible and still be the wrong photograph.
  The fix was to read the engine instead of inventing a pose (law 10): state='chase' is the game
  own "ranger has you in the light" state, and it pins the torch sweep to 0 while raising beam
  opacity to 0.13 and the spot to 3.0. Brighter AND deterministic, and it is precisely what the
  vantage own SPOTTED IN THE BEAM popup was already claiming. 0.9970, beam landing on the bird.
- NEW LAW: FLAKES law 12. A photograph is a staging contract, and drift against the baseline is
  not the same question as variance against yourself.
- PARTIAL SWEEP NOTE: a full 24-vantage stability sweep was started and killed at 8 vantages
  because it runs over an hour and blocks every game-file edit. The salvaged takes are real data
  and are recorded: 01,03,04,05,06,07,08 all reshoot at 0.998 or better, so the set is otherwise
  healthy; 02 was the one bad apple among them and is now fixed. 09-15,17,18,20,23,24 are still
  UNMEASURED for stability - named as a next pick, and the tool now exists to do it.
- EYEBALL: 19_roof_follow.png (stray human gone, true follow-cam framing, bird on the chimney),
  21_night_camp.png (stray human gone), 22_torch_beam.png (beam on the bird, alert mark up).

### PIECE: seeded-grass-tint (TODO item 27) — CERTIFIED 1667e39746f7b0367c39f22273eaa18b
Verdict: green. Gate CERTIFIED-SHIP, tripwire 24 compared 0 flagged after the sanctioned one-time
re-pin sweep, subjects 6 checked 0 missing, stability clean.
- THE BRIEFED PROOF WAS IMPOSSIBLE, and measuring first is what caught it. The TODO asked for two
  headless builds producing identical blade tint sequences. buildGrass opens with
  `if(HEADLESS)return` - node can never see the field. Third time this has happened (glass, preen,
  now grass), which is the standing lesson: measure the rig before believing a brief.
- AND THE BRIEFED FIX WOULD HAVE BEEN A DISASTER. "Move blade tinting onto rnd()" sounds right and
  is not: 42000 blades at two draws each injects 84000 rnd draws into the MIDDLE of buildWorld, so
  every object built after it moves. That would have reshuffled the entire country to fix a tint.
- WHAT SHIPPED INSTEAD is the idiom the file already uses twice - keaScal fixed-seed mottle and the
  kea-sign scatter both run a local Lehmer generator. The tint gets its own GTSEED, so it is
  immune to Math.random AND to the world seed, and it touches the rnd stream not at all. PROVED:
  the seeded headless world fingerprint is byte-identical before and after, 1039 meshes,
  md5 6d9233cf3ce11c1e1e0cb1f8d78cac63.
- THE PROOF is a seam, exported, plus a structural check stated plainly rather than disguised as a
  behavioural one: a fresh SECOND instance with a different world seed and Math.random poisoned to
  a constant produces the SAME 200-tint sequence; the seam calls Math.random zero times; and
  buildGrass is read from source to confirm the field goes through that seam and no longer touches
  Math.random anywhere. All five verified adversarially - putting the tint back on Math.random goes
  red on three, and bypassing the seam goes red on the other two, with 400 calls counted, exactly
  2 per blade.
- THE PAYOFF, measured as an A/B instead of asserted. Inject ONE extra off-camera mesh, which
  consumes a three uuid and so moves Math.random but not rnd, then reshoot 05_tussock_ground:
    HEAD                              0.9735   <- the entire residual tripwire noise, as advertised
    blades seeded                     0.9968
    blades + detail map seeded        0.9983   <- the renderer own take-to-take floor is ~0.998
  I went after the second one because the first fix left 0.003 on the table: the grass detail map
  painter was another ~10k Math.random draws, and detailTex twenty lines below it already painted
  from a fixed seed. The grass was the only painter in the file that did not.
- THE SURPRISE, and the tripwire earned its keep: after the re-pin, subjects.mjs went RED on
  07_jam - carblue 9930 -> 441. The frame was a perfectly good five-car jam. spawnTraffic picks
  the body colour with pick(), which draws Math.random, so removing ~94k draws turned the queue
  from blue to WHITE. The subject had not gone missing, it had changed identity, which is a thing
  I did not know a presence tripwire could catch.
  I did NOT re-fit the classifier, and I measured before deciding not to: against a purpose-shot
  CARLESS reference frame, carblue separated by only x7.5 on the new build (441 vs 59), and every
  colour-agnostic candidate I tried was worse - carglass x2.1, a tight glass window x1.5, a
  glass-blue union x0.8. "Bright and desaturated" separated x28.6 but only because the cars happen
  to be white this week; it would collapse the moment they turn blue again. The honest conclusion
  is that a body colour drawn from Math.random cannot be pinned by ANY hue window.
  So the photographer stages it, exactly as piece 4 established: 07 now assigns a fresh material
  per held car, applied ONLY to meshes sharing that car body material inside its own bodyG, so
  bumpers, glass and lamps are left alone. carblue is 17649 against the ORIGINAL floor of 3000 and
  absent of 14. Nothing recalibrated, nothing refitted, and it is immune to the next stream shift.
- grassTint and grassTintReset join the exports - the seam is the only way to make a browser-only
  contract hermetic (the piece-5 precedent).
- EYEBALL: 05_tussock_ground.png, 14_player_view.png, 03_kea_plate.png for the new tint, and
  07_jam.png for the staged blue queue. Note the old 14 pin had a stray human in it too.

### PIECE: followcam-preen-vantage (TODO item 26) — CERTIFIED 1667e39746f7b0367c39f22273eaa18b
Verdict: green. GAME FILE MD5 UNCHANGED - capture.mjs and subjects.mjs only. Gate CERTIFIED-SHIP,
tripwire 25 compared 0 flagged, subjects 7 checked 0 missing, stability 0.9998.
- THE POINT OF THE PIECE: piece 6 was certified against a metric, and I flagged at the time that
  the metric was not the complaint. The complaint named the FOLLOW camera; 13 is a 1.35-unit
  portrait and 14 is follow distance with no preen, so nothing in the set could see it.
- THE CAMERA IS THE ENGINE OWN, not an invented distance: back 5.2*(0.62+0.42*S) and height
  2.15*(0.62+0.45*S) read straight out of updateCams, aimed at the head height the engine uses
  (k.y+0.72*S). Written as those expressions in capture.mjs so it stays honest if the rig changes.
- AND IT STAGES THE WORST FRAME, which is the only frame worth judging. Measured headless across
  both sides at 0.05s steps: the head sits deepest at t=1.60 on side -1, 0.0459 under the wing
  line against an eps of 0.055 - the exact number piece 6 logged, independently rederived.
- A REAL FINDING ABOUT THE FOLLOW CAM, and it is why the vantage is at camDist 0.6: at the DEFAULT
  camDist the bird is about 40 PIXELS TALL and there is no head read available at all, to a human
  or a classifier. The game lets the player pull in to 0.6 (clamp 0.6..1.6), so the vantage stands
  at the closest distance the engine itself permits - a real player camera, not a flattering one.
  Eric should know that the original complaint may partly be "the bird is small", not "the head is
  buried".
- THE VERDICT ON THE COMPLAINT: THE FIX HOLDS. At the worst frame of the cycle, from behind and
  above, the head is a distinct lobe with the pale cere and the dark beak clear of the body mass.
- THE CALIBRATION IS A MATCHED PAIR, which is the only honest way to do it: I reshot this same
  vantage with the PRE-piece-6 preen constants (yaw 0.9, neckX 0.42, headX 0.52, wingZ 0.82) and
  the head is buried under the wing with no beak visible. So `absent` is a MEASURED frame of the
  bug, not a guess and not an unrelated old capture.
    beak in the head box    33 with the fix    0 without it
  Floor set at 12. And the cere was tried FIRST and rejected on measurement at x1.2 - a sliver of
  cere shows even when the head is completely buried, so it cannot tell the two apart. The beak
  can, because a buried head does not have one.
- VERIFIED ADVERSARIALLY BY ACCIDENT, which is the best kind: I added the check before reshooting,
  so it ran against the old-constants frame still on disk and reported exactly 0 against floor 12.
  The check demonstrably fails on the bug it was written for.
- STABILITY CAUGHT MY OWN VANTAGE. First pin attempt reshot at 0.9949, under the 0.995 the tool I
  wrote three pieces ago demands. Cause: the grass shader sways on uTime, so any grass-filled frame
  varies with the settle frame count - the same class as the camp fire in 21. Pinned G.time and it
  went to 0.9998. I did not pin an unstable frame and I did not widen my own threshold to let it
  through. The general fix is filed as TODO 30, since that residual is on every grass frame
  (05 0.9969, 03 0.9972, 14 0.9978) and its re-pin sweep deserves its own piece.
- EYEBALL: 25_preen_follow.png, and it wants magnifying - the bird is ~70px at this camera. The
  head lobe, cere and beak are on the right side of the body mass.

### PIECE: facet-normals (TODO item 9) — CERTIFIED d5c59486c55a24fb251bf0615605fde5
Verdict: green. Gate CERTIFIED-SHIP, tripwire 25 compared 0 FLAGGED (which is itself the finding -
see below), subjects 7 checked 0 missing. NOTHING RE-PINNED, per the brief.
- THE BRIEF NAMED THE WRONG GEOMETRY AND THE WRONG FIX, and measuring caught both. It asked to
  recompute vertex normals on "lofted/lathed hulls". The banded surfaces are neither: the ute
  bonnet and the caravan roofline are rbox, which is roundedBoxGeo, which is an ExtrudeGeometry
  with bevelSegments 3 and curveSegments 5. And loft() already calls computeVertexNormals.
- AND computeVertexNormals CANNOT FIX IT, which is the crux. ExtrudeGeometry is NON-INDEXED:
  measured on the car body shell, 2142 vertices for 714 triangles but only 358 distinct positions.
  Every triangle owns its three vertices, so there is nothing for computeVertexNormals to average
  and it just recomputes the same flat facets. The briefed fix is a no-op, and the battery now
  proves that rather than asserting it - three own recompute is used as the BEFORE state.
- hull() is also a red herring: it returns immediately because STYLE.outlines is false. Retired.
- WHAT SHIPPED: average normals across vertices that SHARE A POSITION, and only across those whose
  normals already lie within SMOOTH_DEG of each other. Bevel and arc facet joins weld smooth;
  anything that is a genuine edge is left alone. Vertex count, triangle count and every single
  position are untouched, which is the silhouette constraint the brief set - and the test checks it
  rather than promising it (0 positions moved).
- THE THRESHOLD IS MEASURED, NOT INVENTED. The per-position normal-angle histogram on the car
  shell is 15deg:166, 30deg:168, then NOTHING until 45deg:7, plus a few at 90 and 150-180. 37
  sits in that valley. The data chose it.
- A WRONG ASSERTION I WROTE AND THEN MEASURED MY WAY OUT OF, worth recording because the fix was
  the test and not the code: my first edge-preservation check used the per-position MAX angle, and
  it failed on 2 groups. Measuring them showed max 47.8deg and 40.3deg but CLOSEST PAIR 0.0deg -
  chains of near-identical normals stepping round an arc. That is a smooth curve and it SHOULD
  smooth. A real edge is a group where no two normals are close, so there is nothing legitimate to
  blend. Re-stated on that basis, and it then turned out a ROUNDED box has no hard edges at all -
  every edge is an arc - so edge preservation needed a fixture that actually has one. Two quads on
  a hinge, non-indexed: 20deg welds to 0.00deg, 90deg stays at 90deg.
- A DEFECT I FOUND, MEASURED, AND DELIBERATELY DID NOT FIX: ExtrudeGeometry emits 6 exactly-ZERO
  normals per rounded box (confirmed against a bare three ExtrudeGeometry, so it is upstream). I
  wrote a face-normal repair for them, then measured which triangles they belong to: exactly TWO,
  both with area 0.000e+0. Zero-area triangles rasterize to nothing, so there is no black facet and
  the repair could never fire. I removed it and left the measurement as a comment. Shipping code
  that provably cannot act is worse than not shipping it.
- VERIFIED ADVERSARIALLY, both directions. Disabling the pass goes red on four assertions (333
  joins left banded). Raising SMOOTH_DEG to 120 goes red on the hinge: the 90deg edge collapses to
  0.0deg. So the threshold is load-bearing, not decoration.
- THE FINDING THAT MATTERS FOR THE TRIPWIRE: this piece changed the shading of every curved hull in
  the game and the tripwire did not flag ONE vantage. Worst was 18_rear_close at 0.9865, then 12 at
  0.9900 - both comfortably inside the 0.965 threshold. Yet measured numerically the change is
  real: max channel delta 108 on vantage 12, 17396 pixels shifted by more than 6 levels, and at a
  crop of the caravan roofline corner the before/after is night and day - blocky polygonal facet
  bands become a continuous curve. SSIM AT 0.965 CANNOT POLICE A SHADING CHANGE. That is a third
  blind spot in the same family as the two already found (a birdless frame is stable; an unstable
  frame reads as drift). It wants its own instrument or a tighter threshold - filed as TODO 31.
- NOTHING RE-PINNED, exactly as the brief required, so the baseline still carries the BANDED
  shading. NOTE FOR THE NEXT SESSION: the resulting ~0.986-0.99 on caravan and vehicle vantages is
  NOT drift, it is this piece awaiting Eric judgement. Re-pin when he approves the look.
- THE TASTE CALL, stated plainly: the curves are now genuinely smooth, which is a big improvement
  on the banding but does soften the faceted toon character on the caravan shell. That is Eric
  call, which is why the brief marked this judge-required and why I pinned nothing.
- EYEBALL: crop the caravan front-top rounded corner in 12_seal_midpeel.png and compare against
  gauntlet/capture/baseline/12_seal_midpeel.png. Also 18_rear_close and 01/09 for the ute bonnet.

### STABILITY: THE WHOLE SET IS NOW MEASURED
Ran the deferred sweep at the end of the session, once no more file edits were needed. Combined
with the earlier measurements and the takes salvaged from the sweep I killed mid-run, ALL 25
vantages have now been checked for take-to-take reproducibility, and all 25 pass at 0.995.
  clean as found   01 1.0000  03 0.9972  04 0.9999  05 0.9969  06 0.9981  07 0.9995  08 0.9983
                   09 1.0000  10 0.9984  11 0.9988  12 0.9986  13 0.9970  14 0.9978  15 1.0000
                   17 0.9980  18 0.9995  20 0.9994  23 0.9998  24 0.9997
  FIXED this run   02 0.9899 -> 0.9988   16 0.9911 -> 0.9983   19 0.9850 -> 0.9988
                   21 0.9860 -> 0.9986   22 0.9852 -> 0.9970   25 0.9949 -> 0.9998
So the set was 6 for 25 unreproducible and is now 25 for 25. Worth noting the floor: the best
frames sit at 0.997-1.000 and the grass-heavy ones at 0.997, which is the uTime sway residual that
TODO 30 would remove.
LESSON FOR THE NEXT RUN, on my own process: I started this sweep in the middle of the session and
it blocked every game-file edit for 25 minutes before I killed it. Its take files were still on
disk and I recovered real data from them - that is how 02_hut_snow was caught, which I had not
suspected. Run the full sweep LAST, and salvage rather than rerun.

## SESSION 4 — 2026-09-01 (evening)

### PIECE: caravan-door-orientation (TODO item 10) — CERTIFIED 006ae2061309cf5d9e96324bb8f1eef9
- THE BRIEF WAS RIGHT ABOUT THE DEFECT AND HALF RIGHT ABOUT THE FIX. The door was built with the
  hut door build - a slab thin in Z - on a wall whose normal is X, so the face pointed fore-aft and
  the slab stood out of the side of the van as a black fin. Confirmed in the baseline of 12: the
  door-side wall is blank white and the only thing on it is a black tab sticking straight out with
  the peeled seal snaking off it. Axis swap done, all dims kept: frame 1.04x1.56, door 0.96x1.48,
  pane 0.3x0.95, thin axis now X, faces spanning the Y-Z wall plane.
- THE PART THE BRIEF DID NOT KNOW, AND IT CHANGED THE PIECE. "Restagger the layering offsets onto
  the wall axis" only means something if you know where the wall is, and the nominal half width is
  NOT where the wall is. rbox is an ExtrudeGeometry and three expands the shape by bevelSize
  (r*0.92) on the two SHAPE axes while leaving the EXTRUDE axis exact. Measured on the shell,
  rbox(2.4,2.1,5.6,0.3): actual extents 2.952 x 2.652 x 5.600. So the 2.4-wide shell reaches
  x 1.476, not 1.2. A door laid on the nominal plane with faces at 1.215/1.235/1.255 would have
  been entirely INSIDE the van - I wrote exactly that patch first, fastgated it green, and only
  caught it because the wall surface did not smell right and I went and measured it.
- SO THE OFFSETS COME OFF THE MEASURED SKIN: frame 1.467, door 1.478, glass 1.493, handle 1.52,
  step 1.61, bead 1.50. Faces land at 1.495 / 1.516 / 1.535 / 1.570 against a skin of 1.476 - each
  layer 0.02 proud of the one behind it, frame back face bedded 0.037 INSIDE the skin so there is
  no gap to see under. Worst proud margin over the whole door height is +0.0189 at y 0.61.
- THE HANDLE AND THE STEP CAME WITH IT, and I am saying so because the brief named only frame, door
  and pane. A door whose handle is sealed inside the wall is not a door, and the handle was already
  buried before this piece (sph at x 1.25 against a skin of 1.476 - invisible in every frame ever
  shot). The step was buried too: it reached 1.517, clearing the skin by 0.04. Both now sit on the
  door. The step also swapped axes - it was 0.5 deep off the wall and 0.34 wide along it, a tongue
  pointing fore-aft; it is now 0.34 deep and 0.5 wide, which is what a step is.
- THE BEAD DID NOT NEED REORIENTING, only relocating. It was ALREADY drawn in the wall plane - one
  constant x, varying y and z - which is the tell that the path was written for a flush door and the
  slabs were the thing that went wrong. It was at x 1.245, i.e. sealed inside the van; only the
  freed segments were ever visible, which is why 12_seal_midpeel reads as a strip of rubber hanging
  off a featureless wall. Rebuilt on the reoriented frame edges (z 0.12 / 1.08, y 0.27..1.77, all
  at x 1.50, between the frame face and the door face where a seam bead belongs) and moved 0.255
  further out from the van, so the tear reach only got easier.
- TWELVE STEPS HELD BY CONSTRUCTION AND BY ASSERTION. Segment counts 5 + 3 + 4 kept deliberately;
  N is read as path.length-1 (FLAKES law 10), the segment axis string is asserted as yyyyyzzzyyyy,
  and the mission is DRIVEN to 12/12 through real held input with the perch idiom at each frontier
  rather than argued about. harness-systems already drove the seal and stayed green through the
  move, which is independent confirmation.
- REGISTERED G.vanDoor {axis,wallAt,cz,cy,frame,door,pane,step,grip,group} the way G.wear and
  G.stones are registered, because none of the above was assertable before: the door slabs were
  anonymous children of the van group and nothing in the file could name them.
- THE INSTRUMENT THAT MADE THE PROUDNESS CLAIM REAL, worth recording because the obvious version
  does not work. I first tried to find the wall surface by sampling vertex positions in the door
  band and got NOTHING back: the shell side wall between its corner arcs is two vertices and a
  quad, so at the door height (y 0.26..1.79, z 0.1..1.1) there is not a single vertex to sample.
  ExtrudeGeometry only emits vertices at its z layers, measured here as -2.800 -2.760 -2.650 -2.500
  and mirrored. So the test cuts every triangle of every non-door body of the van by the plane y=Y,
  then cuts that segment at z=0.6, and takes the biggest x - a scanline through the mesh, topology
  free, 55 bodies, 31 slices up the door. That returns 1.4760 flat from y 0.6 up and tapers to
  1.3906 at y 0.30, which matches the shape profile exactly.
- VERIFIED ADVERSARIALLY, BOTH FAILURE MODES. Putting the slabs back on the fin axis goes red on 15
  assertions. Keeping the correct axis but laying the door on the nominal 1.2 plane - the patch I
  nearly shipped - goes red on exactly one, and it is the right one: "the door face stands proud of
  the van skin at every height - worst margin -0.2481 at y 0.61". That single assertion is the
  difference between a door that is oriented correctly and a door you can see.
- A DEFECT I FOUND, MEASURED, AND DID NOT FIX because it is not this piece: the ENTIRE door-side
  wall detailing is swallowed by the same bevel margin. Side window frames at x 1.225 (faces 1.282),
  panes at 1.25 (1.297), awning rail at 1.23, roof gutter trim at 1.22, green accent stripe at
  1.326, charcoal pinline at 1.301 - every one of them inside a skin of 1.464..1.476. That is why
  the caravan flank photographs as blank white in 12 and why the green stripe and black skirt only
  appear as short bands on the FRONT face, where they poke past the z cap because they are 5.7 long
  against a 5.6 shell. Filed as TODO 32. It is the same class of bug as this piece and probably
  affects other rbox-shelled bodies, but it is a wave of art-adjacent repositioning, not a swap.
- NOTHING RE-PINNED, as the brief required. 12, 18 and 20 reshot and left flagged in the working
  tree for Eric. EYEBALL: the door should now read as a flush black door with glass, a handle and a
  step on the caravan flank, instead of a tab sticking out of it. 20 is the decisive one - dead
  astern is where a fin is unmistakable.

### RE-PIN: the full set, judged by Eric — and two frames that needed a second pass
Eric judged the door in 12, 18 and 20 and re-pinned the whole 25-frame set in one sweep (commit
59a8493), which also pinned piece 9 smooth hulls and the piece 26 preen vantage. Recorded here
because the sweep pinned MORE than it looked like it was pinning, and two frames were stale.
- WHAT WAS STALE. Only 12, 18 and 20 were reshot for piece 10. The other 22 working captures were
  session-3 shots taken against game md5 d5c59486, so `cp gauntlet/capture/*.png baseline/` pinned
  22 frames from the PREVIOUS build. Harmless for any frame with no caravan in it, but 01 and 09
  both look down the carpark at (-11,8), so both were pinned against the pre-door build. Nothing
  would ever have flagged it - the residual sits at 0.998, far inside the 0.965 threshold - and the
  next session would have inherited an unexplained ~0.002 on two frames with no cause in its own
  work. That is precisely how 22_torch_beam sat in BASELINE.md as known-noisy for four builds.
- CAUGHT BY RESHOOTING 01 AND 09 AFTER THE PIN, not by diff.mjs, which by construction read 1.0000
  on all 25 immediately after the copy. The lesson generalises: a blanket cp to baseline makes the
  tripwire agree with itself no matter what state the working captures are in, so the freshness of
  the working set is a precondition of a re-pin and worth stating out loud before running one.
- 09 DECOMPOSED CLEAN: 302 pixels changed by more than 8 grey levels, bbox x 452..464, y 189..214 -
  a 12x25 box, max delta 189. One cause, the caravan door, real and permanent.
- 01 DID NOT, and my first reading of it to Eric was too coarse. Whole-frame SSIM said 0.9981 and I
  attributed all of it to the door. Localised, it is TWO causes: 405 pixels in one cell at x 360
  y 180 (the caravan, max delta 193, real and permanent), plus ~750 pixels spread across the entire
  frame width at y 145..267 with max delta only 33. The second is not this piece.
- PROVED BY TAKING THE BASELINE OUT OF THE PICTURE, which is the FLAKES law 12 instrument: reshot
  01 and diffed take against take. 755 pixels over 8 levels, same bbox, same hot cells at x 780,
  600, 660, 540, 0, 840 all at y 180, and the caravan cell absent from the hot list. So the grass
  band is take-to-take noise (TODO 30, the uTime sway) and the caravan cell is the door.
- AND THE FINDING THAT OUTLASTS THIS PIECE: session 3 recorded 01 at 1.0000 take-to-take and filed
  it under "clean as found". That number is wrong - 01 churns 755 pixels between takes. SSIM missed
  it on AMPLITUDE, not area: 33 levels spread thin over a wide band does not move the fourth
  decimal on a 960x540 frame. This is item 31 from the other end. 31 is a big change SSIM averages
  away; this is a small change SSIM averages away, and one changed-pixel count catches both. The
  correction is appended to TODO 30, including the consequence that the session-3 "clean as found"
  column cannot be trusted to scope the G.time re-pin sweep.
- 01 and 09 reshot against 006ae2061309cf5d9e96324bb8f1eef9 and pinned. Baseline is now internally
  consistent with HEAD on all 25.

### FULL SWEEP: THREE MORE FRAMES WERE STALE, AND THE SWEEP FOUND A NEW CLASS OF INSTABILITY
Ran the full 25-frame capture (85s, not the 25 minutes the session-3 note implies - that figure was
stability.mjs with multiple takes per frame, not one capture pass) to close the gap left by the
blanket re-pin. The answer: 08_readability_320, 15_sign and 22_torch_beam were also stale, now
reshot against 006ae2061309cf5d9e96324bb8f1eef9 and pinned. But the route to that answer matters
more than the answer, because TWO instruments failed first.
- WHOLE-FRAME SSIM: useless here, as expected. Nothing flagged.
- CHANGED-PIXEL COUNT vs BASELINE: useless on its own. 20_dead_rear, pinned against this exact
  build an hour earlier, showed 6212 changed pixels. So a big count proves nothing about staleness.
- TAKE-VS-TAKE AS A NOISE CONTROL: this is the one that looked right and was WRONG, and it is the
  lesson of this entry. Two takes shot back to back read 9px on 01 and 0px on 08, 13 and 19 - but
  01 measured 755px take-to-take earlier the same session, minutes apart. Take-to-take variance is
  LOAD DEPENDENT: under a steady machine two takes land on the same settle frame count and the
  grass sway, HUD and traffic all agree. So a back-to-back control UNDERSTATES the real variance
  and manufactures false staleness. It named 10 frames, including 13_idle_preen (a 1.35-unit
  close-up of the bird) and 23_paddock_gate, where the caravan cannot possibly be.
- WHAT ACTUALLY ANSWERED IT WAS GEOMETRY, NOT PHOTOGRAPHY. Project the measured door bbox through
  each vantage camera and ask whether it lands in the frustum: pure arithmetic, no capture, so no
  staging noise can contaminate it. Occlusion ignored, which only makes the verdict conservative.
  At the real fov of 60 the door can appear in EIGHT frames - 01, 08, 09, 12, 15, 18, 20, 22 - and
  provably cannot appear in the other seventeen (02,03,04,05,06,07,10,11,13,14,16,17,19,21,23,24,25).
  Five were already current, so exactly three needed pinning. The projection also predicted WHERE:
  the door lands in 60px cell 9,3 on 22 and cell 3,4 on 15, and those are precisely the cells the
  pixel diff had flagged (910px and 463px against near-zero local noise). Two independent
  instruments agreeing on the same cells is what makes this a verdict rather than a guess.
- CONFIRMED AGAINST THE ACTUAL OLD BUILD rather than inferred. Checked out d5c59486 into the working
  file, reshot the three, restored 006ae2 and verified the md5. Isolated:
      08  oldbuild vs pinned baseline 1477px max 29   |  oldbuild vs current 162px max 187
      15  oldbuild vs pinned baseline    1px max 15   |  oldbuild vs current 608px max 191
      22  oldbuild vs pinned baseline 2645px max 102  |  oldbuild vs current 4264px max 220
  15 is the clean case: its baseline reproduces the old build to ONE pixel, and the entire 608px
  delta is the door. That is what an honest stale-baseline verdict looks like.
- AND THE NEW FINDING, from the left-hand column above. 08 and 22 do NOT reproduce their own
  baselines from the very build those baselines were shot on - 1477px at max 29, and 2645px at max
  102 - while reading 0px take-to-take within a single session. That is a THIRD instability class,
  distinct from both entries already on the books: not take-to-take (TODO 30, uTime sway) and not
  drift-versus-baseline (FLAKES law 12), but SESSION-TO-SESSION. A frame can be perfectly
  reproducible inside one capture run and unreproducible across runs, so stability.mjs comparing
  takes within a run cannot see it. Both amplitudes are low (29 and 102) which is why SSIM never
  noticed. Filed as TODO 33.
- WHAT I DID NOT PIN, deliberately. 07_jam, 13_idle_preen, 19_roof_follow and 23_paddock_gate all
  show large clusters against their baselines (8919, 4182, 3349, 1184 px) and the door is provably
  outside all four frusta. That is session-to-session staging variance, so pinning would swap one
  arbitrary roll for another and teach the baseline nothing. Left alone, and they are the evidence
  base for TODO 33.

### THE GATE WENT RED ONCE DURING THE RE-PIN, AND IT WAS A GHOST
Worth recording because the correct response was to do nothing to the code. After the third
consecutive puppeteer capture pass, fastgate printed FASTGATE:COLOSSAL-FAIL - against a game file
byte-identical to the one that had printed CERTIFIED-SHIP earlier in the session, with only TODO.md,
gauntlet-log.md and three baseline PNGs pending. The commit did not land, because the && chain broke
on the red, which is the shell doing exactly what the hard law wants.
Run standalone, COLOSSAL: ALL PASS. Then fastgate three times: PASS, PASS, PASS. Zero stray chrome
processes, so not an orphaned browser. Then the full nine-battery gate: CERTIFIED-SHIP at
006ae2061309cf5d9e96324bb8f1eef9. So it was a cold or load-contended node process, and it is the
second sighting of the family FLAKES law 11 opened - filed as FLAKES law 13 with the trigger this
time recorded (first node invocation while the machine was still settling from sustained puppeteer
load) and the idiom stated: rerun standalone before touching anything, and never start editing the
game file to chase a battery that just failed after a capture pass.

## SESSION 5 — 2026-09-01 (overnight)
Arrived green: gate printed CERTIFIED-SHIP at 006ae2061309cf5d9e96324bb8f1eef9 before any edit,
first node invocation of the session, so no repeat of the FLAKES law 13 cold-node sighting.

### PIECE: one-cell-jail (TODO item 11) — CERTIFIED 0f162964ea696f71a3a9ddcc7e3e93f2
- THE DEFECT WAS A SCOPE ERROR, not a missing feature. The cage gate read `!(k.caged>0)` - it asked
  whether THIS bird was already inside, never whether the cell was. So at WANTED 3 rex could serve
  two warrants and put BOTH keas in the one DOC transport crate, which is a bunk room, not a jail.
- OCCUPANCY IS NOW A PROPERTY OF THE WORLD, asked in one place: `jailedKea()` returns the tenant or
  null, `jailFull()` is its truthiness. The latch already had the correct global form inline
  (`!G.keas.some(k=>(k.caged||0)>0)` at `locked`, and the matching `find` in `onDone`) - so the
  predicate was ALREADY right in one reader and wrong in the other, which is exactly the shape of
  bug a shared predicate prevents. Both readers now call the helpers; the latch behaviour is
  byte-for-byte what it was.
- A FULL CELL DEGRADES TO A SHOO RATHER THAN A NO-OP, which matters because the alternative reading
  of the brief - just fail the cage - leaves rex standing on a bird doing nothing. The warrant is
  now hoisted (`const warrant=this.key==='rex'&&G.wanted>=3`) and passed into `shooed(byHuman,
  noVacancy)`, so a shoo that happened BECAUSE the cell was taken says NO VACANCY and names the
  reason, while an ordinary shoo keeps its original three-way pick verbatim.
- pick() IS STILL ONLY ROLLED ON THE PATH THAT ALWAYS ROLLED IT. Deliberate: the no-vacancy line is
  fixed prose, so no new Math.random draw enters the stream on any existing path and no seeded
  world can shift under it.
- THE HANDLE ON IT: G._shooSpy, mirroring the G._cageSpy idiom already in cageKea, because a shoo
  was previously unobservable - it sets stun and fires a popup and leaves nothing to assert on. The
  spy carries idx and the noVacancy flag, so the test can say WHY the shoo happened, not just that
  a bird got knocked back.
- DRIVEN THROUGH THE REAL COLLISION, not by calling cageKea. The branch under test is inside
  case 'chase', so the test forces rex into chase with chaseKea set and parks him 0.3 behind the
  bird for up to 40 frames, breaking on caged-or-shoo. Reused the pass2 staging (kea on clean
  ground at 0,31.5, y pinned 0.25 every frame - law 7) rather than inventing a new one.
- AND IT IS OCCUPANCY, NOT A LOCKOUT: the third siege frees the tenant and cages the SECOND bird
  successfully, which is what distinguishes "the cell is full" from "this bird is immune". Without
  that assertion a patch that simply banned second cagings forever would pass.
- VERIFIED ADVERSARIALLY. Putting `!(k.caged>0)` back goes red on exactly five assertions and the
  numbers in the messages tell the story on their own: "the second bird CANNOT be caged while the
  cell is taken (caged 8.00)" and "the cage spy saw no second caging (2 total)". Restored, gate
  green, md5 confirmed.
- NO CAPTURE. No vantage stages a caging and no geometry moved - the DOC crate, latch and ute are
  untouched - so the frame set cannot see this piece. Nothing reshot, nothing re-pinned.
- EYEBALL (controller, not frames): at WANTED 3 with two birds, get one caged, then walk the second
  into rex. Expect a feather burst and NO VACANCY / "the cell is taken - shooed instead", and the
  first bird still in the crate.
