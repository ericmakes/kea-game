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

### PIECE: star-ledger (TODO item 12) — CERTIFIED cb5ae4fc49ea795e65aab68cd4dca0a5
- WHAT IT IS. Three stars per PAGE of the to-do list - cleared, style, clean - plus a per-page chaos
  snapshot, saved as schema v2. This piece owns the storage, the one grant that is derivable
  (cleared), the retro-grant for old saves, and the header pips. Pieces 13 and 14 grant style and
  clean on top of it and need nothing else from the game file.
- KEYED BY AREA, NOT BY CHAPTER INDEX. G.chapters is an array of area names and G.chapIdx is a
  position in it; if a chapter is ever inserted or reordered, an index-keyed ledger silently moves
  somebody stars from one page to another. Area strings are what the missions themselves carry
  (m.area), so they are the stable key.
- THE SNAPSHOT IS THE LOAD-BEARING PART, and it is why this piece exists before 13. "Chaos earned
  while the page was open" is not answerable from the run total - the total cannot say which page
  paid for it. So each page records {open, close, earned}: pageOpen stamps the meter, pageClose
  stamps it again and stores the difference, and pageEarned reads the live delta for a page still
  in progress. The page turn in missionDone now closes the page it leaves before advancing chapIdx
  and opens the page it lands on, which is the only moment either fact is knowable.
- THE METER IS G.score, AND FINDING THAT OUT TURNED UP A DEAD BRANCH. I went looking for G.chaos
  because the night driver reads it, and G.chaos is never assigned anywhere in the file - one read,
  zero writes - so `G.wanted>=3||G.chaos>=260` can only ever fire on the WANTED half and night can
  never arrive on chaos alone. The HUD renders 'CHAOS '+G.score, so G.score is the meter and that is
  what the ledger snapshots. Filed as TODO 35 with both honest fixes; NOT fixed here, because
  switching that clause on changes when night falls, which is a feel change on the night vantages.
- CLEARED IS DERIVABLE, AND THAT IS THE WHOLE RETRO-GRANT. One function, syncClearedStars(), grants
  the star for any page whose every non-finale non-bonus non-hidden row is done. It is idempotent,
  it runs on the page turn AND on load, and because a v1 blob still carries the done list, a player
  who cleared four pages before this piece existed gets four pips back on their first load. Style
  and clean are NOT derivable from a done list, so the loader does not invent them - asserted.
- THE BLOB IS AUTHORITATIVE, RESET-THEN-HYDRATE, which is the same contract the done list already
  has. starsInit clears G.stars and G.pageChaos and rebuilds them from the save. Without that, the
  Backspace-at-title wipe leaves stars standing in memory with no save record behind them, and the
  next startGame shows pips for a run that no longer exists. Adversarially confirmed: keeping the
  old `if(!G.stars)` guard goes red on four assertions including "wiping the save clears the ledger
  too (2 pages recorded)".
- A PAGE STILL IN PROGRESS IS RE-OPENED, NOT RESTORED. Its saved `open` was stamped against a meter
  from a previous session, and G.score restarts at whatever it restarts at, so restoring the old
  open would compute a nonsense earned - negative, clamped to zero, silently robbing the style star.
  Only CLOSED pages restore their snapshot; the live page restarts its style clock. Stated in a
  comment in the file because it is a rule somebody will otherwise "fix".
- THE STORAGE KEY IS UNCHANGED. 'keaSaveV1_'+n/c stays exactly as it was and v:2 rides inside the
  blob. Bumping the key name is the obvious move and it is wrong: the key is how a returning player
  is identified, so a new key wipes every run currently alive. Every v1 field is still written, so
  an older build reading a v2 blob still works - asserted on the wire.
- THE HEADER IS COMPUTED WITHOUT THE DOM. pageHeader(i) returns {area,state,pips,stars,text} and
  renderTodo does nothing but hand text to addHead. That is the same seam piece 5 used for the TAB
  reflow and piece 2 for MAPKIND - the render becomes assertable node-only, HEADLESS untouched.
  States are cleared / open / next / hidden, and off the end of the book returns null.
- VERIFIED ADVERSARIALLY, THREE WAYS, each red on exactly its own assertions: dropping the
  retro-grant fails only "CLEARED is retro-granted from a v1 done list"; dropping pageClose fails
  four including "earned figure (2105 -> null = 0)"; keeping stars across startGame fails the wipe
  and the fresh-run assertions. Restored and the md5 re-confirmed each time.
- NO CAPTURE, and this one is worth stating precisely because it looks like a HUD change. QUIET in
  capture.mjs sets #todo display:none for every shot, so the to-do panel is not in a single one of
  the 25 frames and the pips cannot appear in the baseline. Nothing reshot, nothing re-pinned.
- EYEBALL (controller, not frames): TAB open. Every page header should carry three pips, hollow to
  start. Clear a page and its header should read "✓ THE CARPARK — PAGE CLEARED  ★☆☆". Wipe with
  Backspace at the title and every pip should go hollow again.

### COLLISION: Eric is live in the repo, and he took the number I was using
Mid-session, between piece 11 and piece 12, commit 49586e7 landed from Eric - Phase 0: sidebyside
tool, ARTBIBLE.md, WAVES.md with the Wave 3 brief, a VERDICT on TODO 28, and a new TODO item he
numbered 34. I had just filed my G.chaos finding as 34 in the same file. Recorded because the
handling matters more than the clash:
- MY ITEM IS NOW 35, in TODO.md, in gauntlet-log.md and in the comment inside the game file that
  cites it. Eric keeps 34. The renumber touched one comment line in untitled-kea-game.html, so the
  md5 moved from cb5ae4fc49ea795e65aab68cd4dca0a5 to d6e8da1858e62f48730bcedd8d5d5db3 and the gate
  was re-run in full rather than assumed - CERTIFIED-SHIP at the new md5. A comment is still a byte.
- I HAVE STOPPED USING `git add -A`. Eric had uncommitted edits to gauntlet/verify/sidebyside.mjs in
  the working tree at the moment I committed piece 12; a blanket add would have swept his in-flight
  tool into a piece commit. It did not, by luck of timing, and luck is not a protocol. Every commit
  from here names its paths.
- WAVES.md IS NOT MY SHIFT. It is the supervised daytime ritual - variant strips, Eric judging every
  taste call - and Wave 3 (THE BIRD) is explicitly his. The blocked list in TODO.md already fenced
  the bird face; nothing in Phase 0 changes what the night shift may touch. What it DOES change is
  scope: TODO 28 now has a verdict, so it is buildable tonight.

### PIECE: snow-patch-grounding (TODO item 28) — CERTIFIED ccd4782590590e3b39d0e9356af2134a
Eric's verdict landed mid-session: UNBURY, slide clear of the shed footprint, snow banking against
the walls is welcome, judge at 10 and 11, leave flagged. Built to that.
- WHAT WAS WRONG. Snow was the only ground decal in the file that never asked what was already
  built under it. The wear paths call paintAt and lay themselves on the surface they find; the
  stones call paintAt to stay off the seal; snow was laid at a hardcoded y=0.05 wherever the draw
  landed. Two of the ten landed on the ski-field shed, so the shed stood in a white saucer with the
  disc exiting through its walls as a hard straight chord.
- THE ONE CONSTRAINT THAT SHAPED EVERY DECISION: the seeded stream. Every later rnd() draw in the
  browser is downstream of that loop - the fourteen far rocks first, then prop rotations and human
  scan timers - so a fix that consumes a different number of draws, or builds a different number of
  meshes, repins the world for reasons that have nothing to do with snow. So the spot is RESOLVED,
  never rejected: same three draws per patch in the same order, same ten discs and ten halos, and a
  candidate that was never buried is returned untouched by rung zero of the ladder.
- THE LADDER. SNOWSLIDE is a fixed table - the identity, then eight compass offsets at each of
  1.6/3.2/4.8/6.4/8.0 - forty-one rungs, first clear one wins, so a patch moves the least distance
  that frees it. Deterministic, no rnd() of its own.
- THE BLOCKER TEST IS ANALYTIC, NOT SAMPLED, which is the piece-10 lesson applied again. Instead of
  peppering the footprint with groundHeightAt samples and hoping the density catches a thin wall,
  snowBlocked computes the closest point on each collider rectangle (rotation-aware) and compares
  its distance to the radius. Exact, 26 colliders, no sampling artefacts. Tangent is allowed and
  overlap is not, which is precisely "banking against the wall is welcome".
- I NEARLY OVER-FIXED IT, and the measurement caught me. The first version blocked on any raised
  collider and slid 4.9 percent... no: 9 percent of the envelope, because the snow band also holds
  THREE TREE TRUNKS and a sign post. Snow round the foot of a trunk is right - it is a BROAD
  footprint that turns a disc into a saucer with a building in it. So SNOWBULK=0.6 half-extent,
  set off the measured footprints in that band: trunks are 0.35 to 0.44 and the sign is 0.15 deep,
  while the shed is 1.3 and the nest is 2.3. Mirrors the paintAt convention twenty-five lines above
  it - big surfaces, never props. After the threshold, 4.9 percent of the envelope slides.
- THE PROOF IS A TOTALITY PROOF, and that is the interesting part. The patch loop is inside the
  browser-only branch and CANNOT be reproduced headless: the tussock loop above it draws from the
  same seeded stream and never runs under node, so the headless stream has already diverged by the
  time snow is drawn. Moving the loop out to "compute in both paths" - which is what TODO 28 asked
  for - would fill G.snow under node with positions the browser does not have, and a test asserting
  those is worse than no test. So instead the RESOLVER is exported and swept over the entire
  envelope: 9,393 candidates at three radii, and the assertions are that not one resolved spot has a
  building under it, none is stuck, the slide is bounded by the ladder, and only a minority moves.
  That holds for every draw the generator could ever make, which is strictly stronger than checking
  the ten discs one seed produced. G.snow is still registered in the browser and declared on G, and
  the battery asserts it is HONESTLY EMPTY under node with the reason written next to it.
- VERIFIED ADVERSARIALLY. Collapsing the ladder to the identity rung goes red on six, including
  "and none is stuck with nowhere to go (432)". Dropping SNOWBULK goes red on exactly one - "a disc
  centred on every one of them stays put (0/8)" - which is the over-fix I nearly shipped.
- THE BROWSER WAS MEASURED, NOT ASSUMED. A one-off puppeteer probe under the capture seed dumped
  G.snow: patches 5 and 8 are the two the ledger measured, at (-40.94,-40.413) r 2.566 and
  (-39.251,-39.787) r 1.688 - matching the session-3 figures to three decimals - and they slid 4.80
  and 3.20 to (-40.94,-35.613) and (-36.051,-39.787). The other EIGHT did not move at all. Blocked
  before 2, blocked after 0.
- ATTRIBUTION, BECAUSE ONE CAPTURE PASS CANNOT TELL YOU WHOSE CHANGE IT IS. Shot all 25 on the new
  build, checked out the pre-snow build (d6e8da18), shot all 25 again, and built the three-way table
  old-vs-baseline / new-vs-baseline / old-vs-new. Only ONE frame separates from its own noise:
      10_skifield   old-vs-base 2170px   new-vs-base 17703px   old-vs-new 16740px max 164
  Provably unchanged, at under 100px old-vs-new: 02 (25), 08 (2), 09 (3), 14 (12), 15 (0), 16 (15),
  18 (19), 23 (63), 07 (768). And THREE I CANNOT SEPARATE from their own churn with one take each:
  01 (3011), 05 (6514), 06 (3302) - all three sit inside the band their own build reproduces at.
- AND A CORRECTION I HAVE TO MAKE TO MY OWN EVIDENCE, in the spirit of the session-4 note on 01. A
  focused ten-frame pass earlier in this session measured 06_skyline at 0 pixels old-build against
  baseline, and I wrote it down as a clean instrument. The full pass measured the same comparison at
  5215 pixels. Same build, same baseline, minutes apart. So 06 is not a stable frame; the zero was a
  lucky roll, and a single take against a baseline is not evidence of stability in either direction.
  That is TODO 33 biting exactly where it said it would.
- THE GEOMETRY, which is noise-free and therefore the only clean answer for the three I could not
  separate. Projecting both discs at both spots through each static vantage camera: 11_trailhead,
  14_player_view and 24_verge_paddle are BLIND to them (the corner is behind the camera), and 01,
  02, 05, 06, 08, 10, 18 and 23 can all see that corner - 01 remarkably so, because the carpark-wide
  camera looks straight down a line through (-41,-41) at 83 units. So 01, 05 and 06 are frames where
  the change is geometrically possible and photographically indistinguishable from their own noise.
  Separating them needs multiple takes per build, which is the instrument TODO 33 asks for and not
  this piece.
- NOTHING RE-PINNED, per the verdict. diff.mjs flags zero of 25 (worst 0.9763 against 0.965). All 25
  working captures are fresh against ccd4782590590e3b39d0e9356af2134a and left in the tree - they
  are gitignored as of Eric's Phase 0 commit, so the baseline is untouched on disk and in git.
- EYEBALL: 10_skifield. The shed should be standing on the ground with snow banked NEAR it, not
  sitting in the middle of a white dinner plate. One patch moved 4.8 north of it, one moved 3.2
  east. 11 is blind to the change - its residual is the known cross-run churn, not this piece.

### HANDOVER — session 5 stopped mid-investigation on TODO 34 (another session needs the tree)
Stopped on request, not on a stop condition. THREE pieces certified and committed this shift
(one-cell-jail, star-ledger, snow-patch-grounding); the tip is CERTIFIED-SHIP at
ccd4782590590e3b39d0e9356af2134a and nothing of mine is pending in the working tree. The one
modified file, gauntlet/verify/sidebyside.mjs, is ERIC'S in-flight Phase 0 edit and has been left
exactly as found - not reverted, not committed, not touched.
- PIECE 34 (chapter-travel-beat) WAS IN INVESTIGATION ONLY. No edit was made to any file, so there
  was nothing to revert. It restarts next shift from scratch, but NOT from zero: the read-only
  measurements below are the expensive part and are worth keeping.
- THE OPEN DESIGN QUESTION IS WHERE AN AREA IS. The brief says "flyover from the bird to the new
  area's centroid", and the file has no such thing as an area centroid. Two candidate sources were
  measured and BOTH are too sparse to derive one:
    G.hints (9 hints total) covers only 4 of the 8 chapters - carpark 1, hut 2, road 3, paddock 2 -
      and CAMPSITE, SKI FIELD, TRAILHEAD and TOGETHER have none at all. Hints are contextual nudges,
      not area anchors.
    Props and interactables reached through mission.area do better but still miss three chapters -
      campsite 0, road 0, together 0 - and where they do land they land on ONE cluster rather than
      an area: THE HUT resolves to (-24.0,-5.6) which is the spike beam, and THE PADDOCK & NEST
      resolves to (6.8,14.8) from two props that are nowhere near the nest at (-4,-33).
  So a derived centroid is not available, and the honest shape is a NAMED ANCHOR TABLE keyed by the
  area string - which is also what WAVES.md and ARTBIBLE want of any recipe ("named constants +
  assertions"). The assertion that keeps such a table from drifting is the useful part: every
  chapter has an anchor, every anchor is on the map, and every anchor is within a stated radius of
  at least one thing that actually belongs to that area. Landmarks already on G to hang it off:
  G.nestPos (-4,-33), G.ladder (-20.8,-6), the ski shed collider (-40,-40).
- TWO OTHER THINGS THE NEXT SHIFT SHOULD KNOW BEFORE WRITING A LINE OF IT.
  updateCams runs over G.cams, which is EMPTY under node (G.cams is built after the HEADLESS return
  in boot), so nothing about the camera transform is assertable headless. The beat must therefore be
  pure state that updateCams merely reads - which is what Eric's proof spec already asks for
  ("page turn sets the travel-beat state with the correct area target, timer expiry restores camera
  state, any input skips"). Assert the state machine, never a camera position.
  And the blend must be applied BEFORE the G.camLock line at the end of updateCams, not after:
  camLock is the gauntlet photographer hook and it has to stay authoritative or every vantage in the
  capture set becomes nondeterministic.
  The skip also needs an arm delay. The page turn is CAUSED by input, and the key that finished the
  mission is still down when the beat starts, so "skippable with any input" will eat itself on the
  first frame unless the skip only arms after roughly a quarter second. That threshold is feel, so
  it belongs in the named constants and in the FENCED FOR PLAYTEST list, not chosen in the dark.

## SESSION 6 — 2026-09-02 (overnight)
Opened with the gate green at ccd4782590590e3b39d0e9356af2134a. Mid-session OVERNIGHT.md grew a
SESSION LOCK rule; SESSION.lock did not exist, so it was created the moment the rule appeared, with
a note saying so. At that point the only writes made were my own two uncommitted files.

### PIECE: chapter-travel-beat (TODO item 34) — CERTIFIED 49335b92f810540fbe5e52cfb816929a
Eric's brief: each page should FEEL like a different environment, so on a page turn fly from the
bird to the new area, show a title card, come back, skippable with any input, no teleports.
- BUILT ON SESSION 5's INVESTIGATION, which was the expensive part and was right. The three things
  it warned about all bit exactly where it said they would: there is no derivable area centroid, so
  the anchors are named; G.cams is empty under node, so nothing about the camera is assertable and
  the beat had to be pure state; and the skip needed an arm delay because the page turn is CAUSED by
  the keypress that is still in PRESSED on the beat's first frame.
- WHERE AN AREA IS: TRAVELANCHOR, eight named spots measured off the build sites in buildWorld. The
  assertion is the part that keeps it honest, and it does NOT restate the table - it gathers
  landmarks from sources that know nothing about it (the CASEFILES crime sites, which carry a
  mission id and therefore an area; G.hints, likewise; the hut roof, ski shed and DOC sign
  colliders; G.pen, G.nestPos, G.vanTop) and asserts every chapter owns at least one landmark and
  its anchor sits within 8u of the nearest. Measured: five anchors land dead on a landmark, THE ROAD
  is 3.00u off the jam crime site and THE CAMPSITE 3.16u off the passport one. Plus: every chapter
  has an anchor, every anchor is a chapter (the orphan check catches a typo the pairing cannot), and
  no two chapters share a destination (closest pair 12.0u).
- THE BEAT BLENDS THE CAMERA TARGET, NOT THE CAMERA. updateCams already lerps toward a target at
  1-0.0018^dt; the beat mixes the beat aim into that target by a weight and lets the existing rig do
  the flying, so there is no second smoothing law in the file and no discontinuity anywhere. The
  weight is a smoothstep out, a flat 1 across the hold, a smoothstep home - asserted as a curve
  (nought at both ends, monotone on each ramp, worst step under 0.01 at 1ms sampling) rather than by
  sampling three points and hoping.
- APPLIED BEFORE THE G.camLock LINE, per the handover, so the gauntlet photographer stays
  authoritative and no vantage can become nondeterministic. The lookAt was hoisted into lx/ly/lz to
  blend it; with no beat running the expressions are character-for-character the old ones.
- travelAim IS PURE AND NODE-CALLABLE even though the transform is not, which bought an assertion I
  did not expect to get: the beat camera clears the ground under every anchor. The ski field is the
  one that needed it - its anchor IS the shed, and groundHeightAt there returns 2.0, so the aim
  looks at the shed roof rather than through it.
- THE SKIP IS TWO CONTRACTS, NOT ONE. A fresh press skips. A key already held when the beat opened
  does NOT, because a player mid-waddle has not asked to skip anything - so the beat snapshots the
  held set at the open and watches only for what is new. The arm delay (0.25s) then covers the
  finishing keypress, which is still in PRESSED for the rest of that frame. All three cases staged.
- SEVEN TURNS, NOT ONE. The battery drives every page turn in the book through the real done list
  and asserts each opens a beat aimed at the page it turned to. FLAKES law 1 caught me here and cost
  the first red: done() writes the save, startGame hydrates it straight back, so a run staged after
  the book had been cleared came up already cleared and the turn under test could not fire. Every
  stage now goes through freshBook(), which restarts, ticks, THEN empties the book.
- VERIFIED ADVERSARIALLY, FOUR WAYS, each red on exactly its own assertions: arm:0 fails the two
  skip-window assertions; pointing the TOGETHER anchor at the origin fails exactly one, naming the
  campervan roof at 13.60u; dropping the held-set snapshot fails only "a key held from before the
  turn is not new input"; removing travelStart from the page turn fails seventeen.
- AND SABOTAGE C FOUND A DEFECT IN MY OWN BATTERY, which is the point of doing it: an unguarded
  G.travelLast.ended threw a TypeError instead of reporting a finding. Guarded, re-run, 17 findings.
  That miss is filed as TODO 46, because a battery that THROWS currently passes the gate.
- NO CAPTURE PASS, and the reason is mechanical rather than a judgement: capture.mjs never completes
  a mission and never touches chapIdx - grep it - so G.travel is null in all 25 frames, #travelcard
  is display:none by default, and the beat branch in updateCams is gated on G.travel.w>0. Nothing
  reshot, nothing re-pinned, baseline untouched.
- INSTEAD THE PIECE WAS PHOTOGRAPHED DIRECTLY, which is better evidence than a drift check on frames
  that cannot contain it. A one-off puppeteer probe under the capture seed turned a page for real in
  the browser and shot the beat at three points: out (t 0.42, w 0.445), hold (t 1.40, w 1, card up
  reading THE CAMPSITE), back (t 3.00, w 0.156), then travel null with ended='expiry'. Zero console
  errors, which is the only browser-side check the CSS and the new div could get - fastgate reads
  the script block and nothing else. Frames: gauntlet/capture/beat_out.png, beat_hold.png,
  beat_back.png, beat_after.png (gitignored, left on disk).
- TWO THINGS TO JUDGE, both feel, both fenced: the hold camera at high 13 / standoff 9 reads more
  map-view than flyover from directly above the campsite, and the existing 'PAGE TURNED / NOW: THE
  CAMPSITE' popup is now saying the same thing as the card, one line above it. I did NOT remove the
  popup - it is certified behaviour from an earlier piece and other batteries may read it - but the
  duplication is visible in beat_hold.png and it is Eric's call.
- EYEBALL: gauntlet/capture/beat_hold.png first. The card should read THE CAMPSITE over a view of
  the picnic spread from the south and above; beat_out.png should look like a bird's-eye departure
  from the carpark, not a cut.

### THE LAW 11 INTERMITTENT HAS A NAME, AND IT IS NOT THE COLD NODE
Laws 11 and 13 recorded two unreproduced red batteries and settled on "a COLD or CONTENDED node
process" as the common factor. That explanation is wrong, or at least unnecessary, and this session
has the measurement to say so. Both sightings this session named themselves:
    EVERYTHING   "12 driven, 1 failed: can"                      (law 11's rename finally paid off)
    SYSTEMS      "b_five fires at stash 5", then on a later run "beanie stolen off the sleeping head"
Both went green on immediate standalone rerun, exactly as before. So instead of shrugging, I measured
the rate against BUILD, which is the question that matters:
    OLD build ccd4782590590e3b39d0e9356af2134a   3 failures / 40 runs of harness-systems.js
    NEW build 49335b92f810540fbe5e52cfb816929a   1 failure  / 40 runs
The flake is PRE-EXISTING, it is roughly 2-8 percent per battery per run, and the failing assertion
MOVES between runs. That last fact is what rules out the code.
THE CAUSE IS IN PLAIN SIGHT: RNGF=Math.random by default and NOT ONE battery calls setSeed. Every
battery therefore builds a different country and throws every dropped prop differently: spawnLoose
gives each prop vy=rnd(1.4,2.4), vx=rnd(-1.2,1.2), vz=rnd(-1.2,1.2). The three failures seen so far
are all missions whose driver has to grab ONE named prop out of a pile that was thrown at random -
'can' comes out of a bin that spits a shiny can plus six rubbish props into the same half metre,
b_five counts five shinies into a nest, b_beanie takes a hat off a sleeping head.
WHAT I DID NOT PROVE: I could not reproduce the 'can' failure in isolation - 16 seeded reruns of the
isolated driver all passed, with the can always landing 0.63u from the pinned bird. So it needs the
full battery's accumulated prop scatter, not just the bin. That is consistent with the theory and is
not a demonstration of it, and the honest disposition is a named piece with a real verification cost
rather than a one-line seed added on a hunch. Filed as TODO 45.
CONSEQUENCE FOR THE PROTOCOL TONIGHT: the gate needs re-running until green, and "green after rerun"
still is not licence to commit on a shrug (law 13's corollary). Piece 34 was committed after the
full nine-battery gate printed CERTIFIED-SHIP three consecutive times at the same md5.

### COLLISION, SECOND TIME: Eric commissioned the South Island Tour while I was mid-piece
Commit af9111e landed during piece 34 - OVERNIGHT.md gained the SESSION LOCK rule, WAVES.md gained a
line, and TODO.md gained THE SOUTH ISLAND TOUR: items 36-44, one map per biome, level select as a
DOC-brochure paper map, and a graduation rule that migrates each Carpark corner into its new biome as
that biome ships. Two consequences for this session, and one lesson.
- MY TWO FINDINGS ARE NOW 45 AND 46. Eric keeps 36-44 including the 41-44 reservations. Same handling
  as the session-5 clash on 34: he keeps the numbers, I move, and every reference moves with me.
- PIECE 34 IS SUPERSEDED BY HIS PIECE 38, WHICH SAYS "do not build 34 separately". I had already
  patched, proved, gated and committed it by the time that sentence was visible: the only mid-session
  notice I received was the OVERNIGHT.md half of the commit, and nothing re-read TODO.md. I have NOT
  reverted it, and the reasoning is not sunk cost - piece 38's own BINDING EVIDENCE paragraph asks for
  exactly the four things piece 34 implements, because it is quoting the session-5 investigation that
  piece 34 was built from. What separates them is the KEY: 34 anchors per chapter area, 38 anchors per
  biome, and 38 also wants control state restored across a map load, which cannot exist before the
  chassis (36) does. Re-keying the table is a rename; the state machine, the fresh-input skip, the arm
  delay and the pre-camLock blend all carry over unchanged. The revert is one command and it is his
  call, not mine: git revert 1c096b4.
- THE LESSON, AND IT IS MINE TO WEAR: I read TODO.md once, at session start, and treated it as stable
  for the rest of the shift. With a second writer live in the tree that is not safe. From here I
  re-read TODO.md and OVERNIGHT.md before STARTING each piece, not just at session start, and the
  SESSION.lock rule Eric added in the same commit exists precisely because this keeps happening.

### PIECE: gate-asserts-positively (TODO item 46) — harness-side, game md5 unchanged
Found by my own adversarial sabotage on piece 34, and it turned out to be bigger than the thing that
found it. Two classes of dead battery used to certify, and a third case that was live in the tree.
- THE ORIGINAL DEFECT. gate.sh kept `tail -1` per battery and went red only on a NEGATIVE match
  (grep for the tick or FINDINGS). A battery that THROWS prints a stack trace, which matches neither,
  so a battery dying on its first assertion was indistinguishable from one that passed all of them.
  The batteries already set process.exitCode, and the pipe threw it away.
- AND THE ONE I DID NOT EXPECT: harness-smoke.js, battery ONE of nine, has been a no-op in this gate
  for its whole life. It ends with a node ExperimentalWarning about localStorage - emitted two lines
  AFTER its verdict, because process warnings land asynchronously - so tail -1 kept
  "(Use `node --trace-warnings ...`)" and threw the verdict away. On failure it prints FINDINGS and
  exits 1; neither reached the check. Every gate transcript in this log shows the evidence in plain
  sight: the first line of the nine is a node warning, not a verdict. fastgate caught smoke failures
  by exit code all along, which is why this never bit - but the GATE is the ship criterion, and for
  nine sessions it has been an eight-battery gate.
- THE FIX IS TO ASSERT POSITIVELY. Every battery must print its own ALL PASS line AND exit zero, and
  the number of verdicts must equal the number of batteries. Warning noise is filtered before the
  verdict line is taken, so smoke's verdict now survives. The negative grep stays, because a battery
  that prints findings AND exits zero would otherwise slip through the count.
- PROOF, WHICH TODO 46 SPECIFIED AND WHICH THE GATE CANNOT GET FROM A NODE BATTERY: a new contract
  test, gauntlet/verify/gate-selftest.sh. It copies the real gate.sh, substitutes the battery list
  for stubs, and drives seven cases - two clean batteries certify; a throw, a silent battery, a liar
  that prints ALL PASS then exits 1, a missing battery file, and a findings report are each red; and
  a verdict buried under node warnings still counts. The production list stays hardcoded in gate.sh:
  the substitution happens in the COPY, so the shipped gate has no environment override anybody can
  narrow it with by accident.
- IT DISCRIMINATES, WHICH IS THE ONLY THING THAT MAKES IT WORTH HAVING. Run against the old gate
  restored from HEAD it reports exactly four findings - the throw, the silent battery, the liar and
  the missing file - and passes the two cases the old gate could genuinely see. Run against the new
  one, ALL PASS. The old gate certified a battery list with a file that does not exist in it.
- NO GAME CHANGE, so no re-pin and no capture: md5 stays 49335b92f810540fbe5e52cfb816929a and the
  full nine-battery gate prints CERTIFIED-SHIP with nine visible verdicts for the first time.
- EYEBALL: nothing visual. Read the first line of the next gate transcript - it should say
  "ALL PASS — 99 interactables, final chaos 580" where it used to say a node warning.

### PIECE: seeded-batteries (TODO item 45) — harness-side, game md5 unchanged
The law-11 intermittent, closed. Two edit sites, no game change, and NOT ONE ASSERTION TOUCHED -
which was the outcome I was least sure of going in.
- WHAT WAS WRONG. RNGF defaults to Math.random and no battery had ever called setSeed, so every
  battery built a different country and threw every dropped prop differently. capture.mjs solved
  exactly this for the frames on 2026-08-28 and the batteries never got the same treatment.
- THE SEED IS 20260828, capture.mjs's own, so there is ONE gauntlet seed rather than two. And a
  correction to my own first draft of the comment, which claimed the batteries and the photographs
  now stand in the same country: they do NOT. The browser also runs the !HEADLESS branches - tussock,
  snow, the grass field - and those consume draws node never makes, so the streams diverge partway
  through the build. One seed, two reproducible worlds, not one world.
- ONE SEED, NEVER SHOPPED, and this is the line that mattered most. A seed chosen because it dodges a
  failing assertion is that assertion weakened, which the hard laws forbid. So the rule was: pick the
  seed with the best provenance, run all nine, and treat any red as a fragility to investigate rather
  than a number to change. All nine went green on the first attempt at the canonical seed. Nothing was
  re-based, nothing was re-hardcoded, and no assertion was relaxed.
- setSeed ALONE WAS NOT ENOUGH, measured rather than assumed. Several draws never go through rnd() at
  all - pick(), the human wander coin flip at state=Math.random()<0.4, addStrip sway, the fire spit -
  and three draws its own randoms per mesh. So the rig now overrides global Math.random with the same
  generator, set BEFORE the script is evaluated so the module-scope RNGF=Math.random binding picks up
  the seeded one. harness-smoke.js does not use the rig and seeds itself the same way.
- THE MEASUREMENT, which is the proof TODO 45 asked for:
      harness-systems.js     3 failures / 40 runs BEFORE   ->   0 / 40 AFTER
      harness-everything.js  the 'can' sighting            ->   0 / 40 AFTER
  And the stronger statement, because it makes flaking impossible rather than unlikely: all NINE
  batteries now produce BYTE-IDENTICAL output across 8 consecutive runs, timing figures normalised.
  Eight of nine were already identical with setSeed alone; the ninth needed the Math.random override.
- ONE THING I COULD NOT ATTRIBUTE, and it is recorded rather than tidied away. Under setSeed-only,
  harness-audit-pass2 printed two different bin transcripts across eight runs (the bin-lid peck at 3
  hits or 0 - a debug print, never an assertion, so the verdict was ALL PASS either way). After the
  override it went to 1 of 8. But when I removed the override again to confirm the attribution, it
  stayed at 1 of 8, so the split did not reproduce and I cannot honestly say which mechanism fixed it.
  BOTH ARE KEPT. Current shipping configuration measured over 24 runs: 1 distinct transcript, 0
  failures. Watch that battery if a mystery ever comes back; the sample that produced the split was
  four runs of one variant and two of the other, so it was not rare when it was there.
- CONSEQUENCE FOR FLAKES.MD LAWS 11 AND 13: they can be retired, and the log entry above this one
  explains why the cold-node theory was unnecessary. I have NOT edited FLAKES.md myself - it is
  described in OVERNIGHT.md as law, and rewriting two laws out of it on the strength of one session
  is Eric's call, not mine. Proposed replacement wording is in REPORT.md.
- NO GAME CHANGE: md5 stays 49335b92f810540fbe5e52cfb816929a, gate CERTIFIED-SHIP three times, no
  capture, no re-pin. EYEBALL: nothing visual.

### PIECE: style-star (TODO item 13) — CERTIFIED 071ced95438ec024e44cbb0f4c6c5d8f
Second of the three page stars. Cleared says you did the page; STYLE says you were flamboyant about
it. Granted when the chaos earned while the page was open reaches par.
- THE BRIEF ASKED FOR A NUMBER THE FILE DOES NOT HAVE, and that is the interesting part. "Par v1 =
  1.5 x the sum of the page missions points" assumes per-mission points exist. They do not: missions
  carry no points field and every value sits inside the award() call in its own handler. I scraped the
  source to see whether a table could be built mechanically - pairing each done('id') with the
  award(N) in the same statement - and it pairs only 17 of the 40 ids. The rest award through prog(),
  through a shared handler, or nowhere near their own done(). So a hand-written table would have been
  thirty-nine unverifiable numbers with no assertion able to check a single one of them.
- SO THE PAGE LEARNS WHAT IT PAID. award() drops every point into a per-frame purse and a mission
  finishing in that frame claims it. Because a page can only turn once every row on it is done, by
  page close paid IS the sum of that page missions points - the figure the brief asked for, derived
  rather than transcribed. It also re-derives itself for free if any award value in the file ever
  changes, which a table never would.
- THE PURSE IS PER FRAME BECAUSE BOTH ORDERS EXIST IN THE FILE: nine handlers award and then call
  done(), eight call done() and then award. A frame is the exact window - all handler code for a tick
  runs synchronously inside update() - so a claim takes what the frame has banked so far AND anything
  banked later in the same frame. Asserted in both directions; a star that saw only one order would
  have been silently wrong on half the missions, and which half would depend on nothing but the house
  style of whoever wrote each handler.
- AND THE STAR IS JUDGED AT END OF FRAME, not at the turn. The mission that turns a page may award
  AFTER done(), so at the instant of the turn the final payout is not in G.score yet and the bar would
  depend on that handler order too. Measured: at the turn the page reads earned 100, one tick later
  500. FLAKES law 2 under another name.
- THE PROBE FOUND A BUG I WOULD OTHERWISE HAVE SHIPPED, which is the whole argument for probing before
  writing assertions. A late award was routed to G.pageChaos[curPage()] - but the mission that turns
  the page awards after the turn, when curPage() is ALREADY THE NEXT PAGE. So the new page was charged
  for the old page last mission, its par inflated before the player had done a thing on it, and the old
  page par came up short by that payout and handed out a style star for earning exactly what it paid.
  The purse now remembers WHICH page claimed the frame. Before the fix the case-B page granted at par
  150 on earned 500; after it correctly denies at par 750 on earned 500.
- THE ASSERTIONS COMPARE MEASURED DELTAS, NEVER LITERALS, because award() multiplies the base by the
  live combo. An assertion written against the base value would be asserting the combo multiplier and
  would break the first time anything touched spree behaviour.
- VERIFIED ADVERSARIALLY, FOUR WAYS: routing late awards back to curPage() fails five including "the
  new page starts owing nothing (200)"; dropping the paid>0 guard fails exactly one, the free star for
  an unpaid page; removing the end-of-frame judging fails four; keying the purse on G.time instead of
  G.frames fails ten.
- WHY G.frames AND NOT G.time: QUIET pins G.time for the photographer, and a pinned clock collapses
  every frame in a run into one purse, which would count freelance chaos from any earlier frame as
  mission pay. So the piece added a frame counter and the battery pins G.time to 7 exactly the way
  QUIET does and asserts the purse still separates the frames.
- paid RIDES IN THE SAVE at no schema cost: the blob already writes pages:G.pageChaos wholesale, so
  the new field is on the wire and asserted there. Closed pages only, per piece 12 law - an open page
  restarts its clock because the meter itself restarts at zero on load.
- NO CAPTURE, same mechanical reason as piece 34: capture.mjs completes no mission and never touches
  chapIdx, so no page can turn in a frame and the star popup cannot appear in one. Nothing re-pinned.
- EYEBALL (controller, not frames): play a page, cause some chaos beyond the missions themselves, and
  the second pip on that page header should fill when the page turns, with a STYLE popup naming the
  numbers. Clear a page with nothing but the missions and it should stay hollow. PARRATIO is the one
  number to argue about and it is fenced.

### PIECE: clean-getaway-star (TODO item 14) — CERTIFIED c8ced0cf4a7afb6a3a2faa5f000a476a
The third pip, and the page-star set is complete: cleared, style, clean.
- THE RULE IS NOT-CAUGHT, NOT GOT-OUT. The page keeps a caging COUNT that only ever goes up, so
  escaping the cage does not clean the record. The most useful assertion in the section is the one
  that pins that distinction: cage the bird, free it, tick six frames, THEN turn the page - and the
  star is still refused. The sabotage that judges on whether the bird is caged right now instead of on
  the page record fails exactly that pair.
- EITHER BIRD COUNTS IN CO-OP AND IT NEEDED NO SPECIAL CASE, which is worth saying because I went
  looking for one. cageKea is the ONE place in the file that puts a bird behind bars, it is called per
  bird, and the page never asks which. Asserted with the SECOND bird in mode 2, so kea two can lose
  kea one the star - which is what co-op is for.
- THE CAGE SPY TODO 14 NAMES IS USED AS A WITNESS, NOT AS THE IMPLEMENTATION. G._cageSpy was already
  there from an earlier piece and is written by cageKea beside the page mark rather than by it, so
  asserting spy count === page count checks two independent records against each other. If the mark
  were ever moved somewhere cleverer, that assertion is what would notice.
- NO RETRO-GRANT, WHICH IS THE OPPOSITE CALL TO PIECE 12, DELIBERATELY. CLEARED is a function of the
  done list, so every save of any vintage can be asked and piece 12 could hand it back. Nothing in a
  v1 or early-v2 blob records whether anybody was caged, so granting on a silent record would give
  every legacy page a free third star. One assertion drives a legacy blob with no caged field at all
  and checks BOTH halves in one go: CLEARED retro-granted, CLEAN refused.
- AND IT RIDES IN THE SAVE, because a fresh snapshot starts at zero cagings, so without it a reload
  would hand the star to a page that had been dirty all along. Asserted on the wire and after an init.
- I HAD TO RE-BASE TWO OF PIECE 12's ASSERTIONS, and I want that on the record rather than buried in a
  diff. Piece 12 cleared a page through done() with nobody caged and asserted the pips read exactly
  one filled, first position. Under this piece that page legitimately holds TWO, so the pips are now
  cleared-hollow-clean. That is a re-base and not a weakening, and the difference is that everything
  the original was protecting is still asserted - the count, the glyphs, and the POSITION of each pip -
  with the MIDDLE pip still hollow, since only mission pay landed and style wants half again as much.
  The comment above the assertion says so, dated, so a future reader does not have to reconstruct it.
  If piece 12 had asserted "exactly one star ever" as a policy I would have parked instead; it did not,
  and its own header comment already named pieces 13 and 14 as the grantors of the other two.
- NO CAPTURE: same mechanical reason as pieces 34 and 13 - capture.mjs completes no mission and never
  touches chapIdx, so no page can turn in a frame and no star popup can appear in one.
- EYEBALL (controller, not frames): clear a page having been caged once, and the third pip stays hollow
  even if you mashed your way out. Clear a page without ever being caught and it fills, with a CLEAN
  GETAWAY popup. The full set on a good page reads three filled pips in the TAB header.

### PIECE: home-positions (TODO item 17) — CERTIFIED e19fcd5a9ae90f754e36f26a64ef5509
Foundation for pieces 19, 20 and 21: every prop remembers the transform it was BUILT at, so a later
piece can put it back and a botched restore has something pristine to be botched against. Nothing in
this piece moves anything or changes how anything looks.
- HALF OF IT ALREADY EXISTED, which is worth checking before writing a line: propAt has recorded
  home {x,y,z} all along, and it is already load bearing - the never-recovered boot score, the
  missionFar relocations, the cleared-picnic-table detector and the human tidy-up all read it. What was
  missing was ROTATION, and something subtler: WHEN to read it.
- THE SWEEP IS WHY THIS IS NOT A ONE-LINER, and the skis are the proof. Reading the mesh rotation
  inside propAt is not enough, because a build site can rotate a prop AFTER the factory returns - the
  two skis on the rack are laid over at rotation.x=1.35 on the very next line. So the factory records
  what it can see and homesRegister() sweeps the finished world afterwards, which is the only moment
  the built transform is final. The sabotage that removes the sweep reports their home rotation as
  0.00, which is precisely the bug: a restore would have stood the skis upright on the rack like new
  stock. Props that spawn DURING play keep their factory home, which is their spawn point and correct.
- THE ASSERTION FOUND A REAL GAP. Classification (consumable vs displaceable - a scoffed sandwich
  cannot be carried home, it has to be replaced) was being set by the sweep, so props created mid-game
  had no class at all. Moved into mkProp, which is the one choke point every prop passes through AFTER
  its opts are merged, so the bin loot is classed exactly like the built world. The sweep now owns only
  the transform.
- AND IT TOOK A DETOUR THROUGH SOMEBODY ELSE'S BUG, which is now TODO 48. My build-time assertions kept
  failing with "two skis on the rack (4)". harness-everything calls X.boot() a SECOND time in the snow
  section, and boot() re-runs buildWorld without clearing G.props, G.inter or G.colliders - so from that
  line on the battery has two of every prop, interactable and collider. Nothing asserted today depends
  on a count, which is the only reason it has never bitten, but every section after that line is
  testing a world the game can never be in. Worked around honestly rather than papered over: the
  build-time truth is snapshotted at the FIRST boot and the section asserts against the snapshot,
  with a comment saying why and where the real fix is filed.
- ALSO FILED, TODO 47: propAt draws ry:rnd(0,6) for every prop and nothing ever applies it to a prop
  mesh - it is the kea and human convention, not the prop one. So every prop carries a random number
  that means nothing, and this piece had to record the MESH transform to get an honest answer. The draw
  is NOT removed, because every later rnd() in the browser is downstream of it and deleting one draw
  repins the world. Snow-patch lesson, applied without having to relearn it.
- HOMER=1.6 IS NAMED AND FENCED, with atHome() asserted on both sides of it - inside the radius reads
  home, just outside does not. That predicate is literally what piece 20 needs and nothing else.
- VERIFIED ADVERSARIALLY, FOUR WAYS: removing the sweep fails four including the ski rotation; making
  homeDist return zero fails the two radius assertions; dropping rotation from the factory fails only
  the mid-game spawn; classing everything displaceable fails exactly the food pair.
- NO CAPTURE: the piece adds fields and reads meshes. Nothing is moved, nothing is drawn, no rnd() draw
  is added or removed, so the seeded stream is untouched and every frame is unchanged by construction.
- EYEBALL: nothing visual, by design. This one is judged by pieces 19 to 21 using it.

## SESSION END — 2026-09-02, six pieces certified
Stop condition reached on the 6-piece rule, not on failures: nothing was parked as failed, no piece
needed a third staging attempt, and no assertion was weakened to pass anything. Tip is
e19fcd5a9ae90f754e36f26a64ef5509, gate CERTIFIED-SHIP, working tree clean.
    34 chapter-travel-beat     49335b92f810540fbe5e52cfb816929a
    46 gate-asserts-positively harness-side, md5 unchanged
    45 seeded-batteries        harness-side, md5 unchanged
    13 style-star              071ced95438ec024e44cbb0f4c6c5d8f
    14 clean-getaway-star      c8ced0cf4a7afb6a3a2faa5f000a476a
    17 home-positions          e19fcd5a9ae90f754e36f26a64ef5509
- CAPTURE: full 25-shot pass on the final build, diff 0 flagged, worst 0.9901 against 0.965, and
  08/09/15 at 1.0000. NOTHING RE-PINNED - the baseline is untouched on disk and in git. A one-off
  changed-pixel count is recorded in REPORT.md and its ffmpeg recipe is now in TODO 31, where the
  piece that wants that instrument lives.
- THE ORDER THE PIECES WERE TAKEN IN MATTERED, and it was not the order the diet lists them in. 46
  and 45 came second and third on purpose: until the gate could see a dead battery and the batteries
  stopped flaking, every later piece would have been certified against an instrument that lied a few
  percent of the time. Piece 36 (tour-chassis) has a "zero observable change" proof contract, and that
  contract is worth something now in a way it was not this morning.
- FOUR THINGS FOUND AND FILED, none of them fixed tonight: 45 and 46 were found and fixed; 47 (propAt
  draws a prop rotation nothing reads - do NOT delete the draw, it repins the world) and 48
  (harness-everything boots twice, doubling every registry from that line on) are open.
- WHAT THE NEXT SHIFT SHOULD READ FIRST: sections 1 to 3 of REPORT.md. Section 1 is the piece-34
  collision and it needs Eric, not the next agent - do not revert 1c096b4 on your own judgement.
- AND THE HABIT CHANGE THAT CAME OUT OF IT: re-read TODO.md and OVERNIGHT.md before STARTING each
  piece, not once at session start. Both changed under me mid-session tonight, in the same commit, and
  I only noticed the half of it that the harness told me about.

## SESSION 7 — 2026-09-02, overnight
Lock: no SESSION.lock at start; created one naming this session and its purpose before any write.
Run order taken from TODO 49 and 50, which say so explicitly.

### PIECE 49 — ratify-flakes-11-13 — CERTIFIED e19fcd5a9ae90f754e36f26a64ef5509
Verdict: green first pass, no staging attempts (documentation piece, no test to stage).
- WHAT LANDED: FLAKES.md laws 11 and 13 are deleted and replaced by one block at the law 11 slot,
  headed "11+13 (SUPERSEDED 2026-09-02)". Law 12 keeps its number and its position, so nothing
  renumbers and no cross-reference in the log or the harness goes stale.
- VERBATIM MEANS VERBATIM, so I did not retype it. The script pulls the blockquote out of REPORT.md
  section 2 by matching its first line, asserts the extracted prose starts and ends with the expected
  words, and only then writes it. Two changes of MARKUP, no words: the blockquote markers go, and the
  one pair of backticks (around harness-audit-pass2) is stripped because FLAKES.md contains zero
  backticks anywhere else and names diff.mjs, stability.mjs and gate.sh bare. Called out in the commit
  message so Eric can see exactly what was normalised.
- PROOF IS A DIFF, THREE WAYS. Header plus laws 1-10 diffed byte-clean against HEAD; law 12 diffed
  byte-clean against HEAD; and the four load-bearing phrases of the disproven theory (COLD OR,
  CONTENDED, SECOND SIGHTING, RARE INTERMITTENT) return zero hits in the file. That is the brief - new
  wording present, disproven claims gone, no other line changed - checked as three assertions rather
  than eyeballed.
- WHAT THE LAW NOW SAYS, and it is worth reading as a working instruction rather than history: a red
  battery MEANS something now. The old wording told the next agent to rerun and shrug. The new one
  tells them to suspect a new unseeded draw. Those are opposite instructions, which is why leaving the
  retired laws in place would have been worse than the usual stale-doc cost.
- NO CAPTURE, NO GAME EDIT: game file untouched, md5 identical to the session 6 tip. fastgate PASS,
  gate CERTIFIED-SHIP with all nine batteries green.
- EYEBALL: gauntlet/verify/FLAKES.md, lines 29-35. Nothing visual.

### PIECE 50 — revert-travel-beat — CERTIFIED 0038af8b3ce396103b14526baf162227
Verdict: green first pass. No assertion was staged, weakened or deleted; 182 lines of battery came
out as one block because the feature they judge is gone.
- WHY A SCRIPT AND NOT git revert: commit 1c096b4 also carried gauntlet-log.md, TODO.md and
  SESSION.lock, and three shipped pieces (13, 14, 17) have landed on the game file since. Reverting
  the commit would have deleted a session of log history and Eric numbers 45-50 along with the beat.
  So the two halves that ARE the feature - the game file and the everything battery - were removed by
  exact-string anchored edits, one atomic write each.
- THE REMOVAL IS PROVED, NOT INSPECTED, and this is the part worth keeping. The same script was
  replayed against the piece-34 build itself and reproduced 1c096b4^ BYTE-FOR-BYTE, both halves. That
  is a stronger statement than "the diff looks right": it says the twelve edits are exactly the
  inverse of what the commit added, with nothing left behind and nothing extra taken.
- AND THE LATER PIECES ARE PROVED PRESERVED THE SAME WAY. The added/removed line set of
  (piece-34 build -> HEAD) is identical to the set of (pre-34 build -> reverted build). Pieces 13, 14
  and 17 land on the older file with the same 132 lines they landed on the newer one - purseClaim,
  purseAdd, styleQueue, styleDrain, homesRegister, the STARS and HOMES exports, all untouched.
- THE SEEDED-STREAM WORRY WAS MEASURED, NOT ASSUMED. Removing a battery section removes its
  startGame calls, and since piece 45 the batteries are byte-identical run to run - so a shifted draw
  would have shown up as a changed transcript downstream. Ran the everything battery on both builds
  and diffed the transcripts with the travel section filtered out: identical. The only line that
  differs in the whole run is the section header that no longer exists.
- TWELVE EDITS: the card CSS and its keyframe, the card div, the whole beat block (anchors,
  constants, phase/weight/start/end/fresh/update/aim), the two G fields, the page-turn trigger, the
  win teardown, the uiCache slot, the card writer in updateUI, the camera blend plus the lookAt that
  was refactored to feed it, the per-frame tick, the startGame reset, the harness export.
- CAPTURE, AND A REAL FINDING IN IT: full 25-shot pass, 0 flagged, worst 0.9870. Nothing re-pinned,
  baseline untouched. But the first pass flagged 08_readability_320 at 0.9446, and 08 is the vantage
  session 6 called one of the three reproducible ones at 1.0000. IT WAS NOT THE REVERT. Three takes
  on each build, all pairwise: within-mine 0.9884-0.9994, within-HEAD 0.9927-0.9979, ACROSS builds
  0.9798-0.9994. The across-build numbers sit inside the within-build band, so the two builds are
  indistinguishable and 0.9446 was simply a bad take. stability.mjs on 08 alone: take-to-take worst
  0.9936 against a 0.995 threshold - unstable. Cause is in plain sight under FLAKES law 12: 08 is
  one of the vantages that sets the bird ONCE and never uses PIN(), so something stays live through
  the settle. Filed as TODO 51.
- THE 47/48 STRIKE WAS NOT CARRIED OUT, deliberately, and it is flagged at the top of both items and
  in REPORT.md. TODO 50 says to strike 47 and 48 as moot because they judge the reverted feature.
  They do not - both were filed in session 6 by piece 17 (home-positions, shipped and not reverted),
  one is about propAt drawing an unread rotation and the other about the battery booting twice, and
  neither mentions the beat. The findings the travel-beat commit DID file were 36 and 37 in its own
  message, renumbered to 45 and 46, and both are done and load-bearing. It reads as a numbering slip.
  Deleting a live finding costs institutional memory; leaving it costs Eric one line in the morning,
  so it was left standing with the reasoning written next to it.
- TODO 34 marked REVERTED with the reasoning kept below the line, because piece 38 quotes it. TODO 38
  annotated: it starts from nothing now, its BINDING EVIDENCE paragraph remains binding because that
  is the Sep 1 investigation and not a description of 34, and the two things 34 learned on top of it
  are written down so 38 does not rediscover them.
- BEAT FRAMES RETIRED: beat_hold, beat_out, beat_back, beat_after deleted from gauntlet/capture.
  There was never any committed staging for them - the shot script was ephemeral and is not in the
  tree, so nothing else needed removing.
- EYEBALL: nothing. The removal is invisible by construction, and the 25-frame diff says so.

### PIECE 15 — coop-jail-hardening — CERTIFIED 3d420ba5dc1359ad6ec2c4a4071261a8
Verdict: green. Two staging rounds, both of them because the piece was RIGHT and something else was
leaning on the old behaviour. No assertion was weakened, skipped or deleted; two were added to the
game side of the ledger and one existing certified assertion was left untouched and made true again
by fixing the game rather than the test.
- WHAT LANDED: in co-op the cage clock STOPS. The grab key buys no seconds, it SQUAWKS - a locator
  ping on the partner plate carrying distance and a direction - and the latch peck is the only door.
  Solo is untouched: the sentence still runs down and a mash is still worth half a second.
- ONE PREDICATE, coopCell(), so there is exactly one place to read what mode the cell is in. It is
  used by the caged branch, the ping, and the BEHIND BARS popup, which now tells the truth about
  which cell you are in rather than saying mash in a mode where mashing does nothing.
- THE PING IS STATE, AND THAT SOLVED A REAL ORDERING BUG BEFORE IT COULD BE WRITTEN. Prompts are set
  by each kea inside its own update, so a ping fired from kea 0 is wiped by kea 1 updating after it,
  and survives when the caged bird happens to be kea 1. Whether your mate could see you would have
  depended on which of you got caught. squawkUpdate runs ONCE after the whole kea loop, which is the
  only place that wins for both orders, and the line it builds is kept on the ping so the HUD and
  anyone asking what the HUD says read the same string.
- THE BEARING IS DERIVED FROM THE STEERING CONVENTION, NOT A COMPASS. The file has no north - I
  looked, there is no compass anywhere in it - so inventing one would have been a convention nobody
  else obeys. What the file does have is forward=(sin ry, cos ry) and a left key that ADDS to ry, so
  the ping speaks in AHEAD / LEFT / BEHIND RIGHT and the test READS the convention first (hold the
  left key, assert ry went up) before requiring the ping to agree with it. Re-map the controls and
  the assertion follows them, which is FLAKES law 10 doing its job.
- THE FIRST ASSERTION I WROTE WAS WRONG, AND THE GAP IT FOUND IS REAL. I asserted the prisoner plate
  would be EMPTY. It is not: nothing writes a prompt for a caged bird, because the caged branch
  returns before interact() and hintScan(), so the plate keeps whatever was on it when the door shut.
  The sabotage transcript shows it verbatim - E DROP UTE KEYS, held over from the frame before the
  arrest. In solo the stale line is usually the cage hint and happens to be true. In co-op it says
  mash your way out, which is a lie told to the one bird that cannot act on it. So the co-op cell
  writes its own plate, and the assertion now says what the plate should say instead of what I
  guessed it said.
- AND THE GATE FOUND THE SECOND ONE, WHICH IS THE PART WORTH READING. harness-systems went red on an
  assertion nine sessions old: kea2 preens while kea1 works. It was not a flake and it was not the
  battery being wrong - the idle section runs up to sixty thousand frames with the humans parked
  ONCE, rex wanders back, and mid-section he cages the bird. That used to cost eight seconds and heal
  itself. Under the co-op cell it is permanent, so everything after that line was testing a jailed
  bird. TWO separate things were wrong and both are now fixed:
    1. GAME: a caged bird kept its idle act. animate() owns the idle clock and the caged branch still
       calls animate, so an act rolled the frame before the door shut sat there mid-preen inside the
       crate. Added to handsOff rather than cleared in the caged branch - the else there already
       knows how to stop idling, and a bird that never clocks idle time never rolls for an act, so
       no rnd draw is spent behind bars and the seeded stream is untouched. Asserted in BOTH modes,
       because it was never right in either; solo just healed it in eight seconds.
    2. HARNESS: the idle section now pins the humans every frame inside its loops instead of once
       before them. That is FLAKES law 4 word for word, applied to the section that needed it most.
       Verified necessary, not cosmetic: with the pins reverted the hop assertion fails 200 tries out
       of 200.
- VERIFIED ADVERSARIALLY, EIGHT WAYS, every one of them caught: the clock never stopping (18
  findings), co-op never detected (20), the squawk also buying seconds, the cooldown removed, the
  bearing sign flipped, the ping outliving the door, the ping addressed to the prisoner instead of
  the mate, and the caged bird kept preening.
- A DEAD BATTERY IS A WORSE WITNESS THAN A RED ONE. The first sabotage run threw on G.squawk.n and
  took every other finding with it, so every read of the ping now goes through PING() and every
  interpolated number through nm() - the message has to survive the failure too, not just the test.
  That is what turned 1 crash into 18 named findings.
- CAPTURE: 25 shots, 0 flagged, worst 0.9883. Nothing re-pinned. No vantage stages a cage and the
  piece adds no rnd draw, so the frames are unchanged by construction and the diff agrees.
- ALSO FILED, TODO 52: the world hint at the ute still tells a co-op bird to mash its way out. Not
  fixed here because addHint refuses to replace an existing mid and nothing clears G.hints between
  runs, so mode-aware text set at build time is unreliable by construction - it needs a decision
  about who owns G.hints across a restart.
- EYEBALL: nothing in the 25. To see it: two-player, get caught, hold the grab key, and watch the
  other plate.
