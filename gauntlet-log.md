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

### PIECE 16 — score-attribution — CERTIFIED f08f3364e9d513a03c0a6ff8c100bdc4
Verdict: green. One staging round, and it was the test that was wrong rather than the piece.
- THE BRIEF SAID THREAD IT. IT DOES NOT NEED THREADING, and session 6 was right to warn that
  threading it was bigger than two lines: there are FORTY-SIX award() call sites. But award() is
  called from one place at a time, and for nearly all of them the frame underneath is a kea updating
  itself - an interactable onDone runs inside interact(), which runs inside Kea.update, which runs
  inside the loop over G.keas. So the loop names the bird it is updating and award() reads it. One
  assignment plus one clear. The attribution is DERIVED from the structure, which also means an
  award added tomorrow is attributed correctly by an author who has never heard of this.
- THREE SITES THE STACK CANNOT SEE, AND THEY PASS THE BIRD BY HAND: a car honking at a bird on its
  roof (the honk loop has k), a ranger losing his cap (Human.update has kea), and a snowfall landing
  on somebody several seconds after the kick - that one now records by:this.idx on the fx when it is
  thrown, because by the time it lands the thrower is long out of frame. The fourth kind, the traffic
  jam, has no single author and goes LOOSE: counted, not credited. Crediting whichever bird happened
  to update last would have been worse than not crediting at all.
- THE INVARIANT IS THE PIECE. Score is the sum of the books at EVERY instant - the battery asserts it
  on arrival (11585 against 11585, accumulated by every section before it), after each staged award,
  after a loose one, and after a restart. A VS scoreboard built on books that do not add up would be
  worse than no scoreboard.
- AND THAT IS WHY A RESTART DOES NOT CLEAR THEM, which is the one design call in the piece. G.score
  is never ASSIGNED anywhere in this file - grep it, there are zero writes and only += - so it
  survives startGame the way the rest of the world does (FLAKES law 1, again). Books that reset under
  a total that does not would stop adding up at the first restart. A VS match wanting per-match
  figures snapshots at the whistle and subtracts, which is the shape pageSnap already uses for a page
  and is piece 22 work, not this piece.
- THE TEST PICKED A TARGET THAT PAYS NOTHING, and the failure was worth having. Taking the first
  unlocked peck off the list drew FLIP THE ROADWORKS PADDLE, whose award sits behind a one-shot
  G.paddleDone that an earlier section had already spent: the bird pecked a real target, completed
  it, and earned zero. The targets are now NAMED - handbag and backpack, both unconditional, at
  opposite ends of the carpark - and the assertion that they are still open fails loudly if a future
  section takes them first.
- VERIFIED ADVERSARIALLY, SIX WAYS, all caught: the loop never naming the bird, the actor left set
  after the loop (which is how you would silently credit the last bird for the jam), the explicit
  actor ignored, index zero read as a falsy nothing, no books kept at all, and a restart wiping them.
- NOTHING VISIBLE CHANGES, which is what the brief asked for outside VS: no HUD, no save field, no
  popup, no rnd draw. Capture 25/25, 0 flagged, worst 0.9845, nothing re-pinned.
- EYEBALL: nothing. This one is judged by the VS pieces that spend it.

### PIECE 48 — one-build-one-world — CERTIFIED 20ee30e813a75df2f132024da35c35b3
Verdict: green first pass on the fix; one staging round on the proof, because the proof the brief
asked for is false on a healthy build.
- OPTION (b), THE ONE ERIC CALLED THE REAL ANSWER. buildWorld now empties the six registries it
  fills before it fills them. Option (c) - move the snow section to the top - was available and free
  and I did not take it: it hides the bug rather than fixing it, and leaves the next battery to
  rediscover it the hard way, which is what piece 17 already had to do.
- WHY THE REGISTRIES AND NOT THE SCENE: boot() calls initScene, which throws the old THREE.Scene away
  and makes a new one. So the meshes were never doubled - the old ones simply stopped being in any
  scene, while the registries went on describing them. The registries have to be emptied for exactly
  the reason the scene is replaced. Put in buildWorld rather than boot so the guarantee belongs to
  the function that fills them, however it is called - and nothing else in the tree calls it: every
  battery and every capture goes through boot().
- MEASURED BEFORE AND AFTER on a plain double boot: cars 6 to 12, props 21 to 42, colliders 26 to 52,
  sheep 3 to 6, strips 2 to 4, inter 64 to 131. The three extra on inter are the sheep pecks, one per
  sheep, registered for six sheep the second time - which is the kind of detail that tells you the
  second pass really did run over the first.
- THE BRIEF ASKED FOR A PROOF THAT CANNOT BE WRITTEN. "assert G.props.length after the last section
  equals the count after the first boot" is false on a HEALTHY build, and always was: play spawns
  props. Twenty-three of them by the end of the sections above - the GoPro out of the backpack, the
  aerial, the mirror, the spikes, the nail, the ranger cap. The first version of the section asserted
  it anyway and failed 44 against 21, which is the honest way to find that out. Split into the three
  things that were actually wrong:
    1. NO REGISTRY ENTRY HANGS OFF A DISCARDED SCENE. This is the bug itself, stated directly - walk
       each prop mesh to its root and require it to be the live scene. On the sabotage that restores
       the old behaviour it reads 61 orphans of 105.
    2. THE SINGLETONS ARE SINGULAR - one latch, one set of ute keys, three sheep, six cars. That is
       what a doubled registry breaks first: a find() that expects the only one of something gets
       whichever copy sorts first.
    3. A BUILD COSTS THE SAME EVERY TIME - boot again, and all six registries come back to their
       first-boot counts exactly.
- VERIFIED ADVERSARIALLY: restoring the original bug fails 11 assertions; clearing only three of the
  six registries fails 4, including the one that names the list.
- THE TODO-17 SNAPSHOT STAYS, and its comment is corrected rather than deleted. HOMESATBOOT is still
  the only thing that can speak for the FIRST build - a rebuild is a different world even when it is
  the only one in the registries, because the second pass draws from further along the same seeded
  stream.
- NO BROWSER CHANGE BY CONSTRUCTION: boot() runs once in the browser, so the clear is a no-op there.
  Capture 25/25, 0 flagged, worst 0.9815, nothing re-pinned - which is the evidence, not the argument.
- EYEBALL: nothing. This one is judged by every count assertion written from here on.

### PIECE 47 — name-the-dead-prop-heading — CERTIFIED 4c29df092d4cf33cf5ee0f3b2524730b
Verdict: green first pass. The smallest change of the night and the one with the most careful reason
for being small.
- OPTION (b), THE FREE ONE. propAt has always drawn a random heading per prop and nothing has ever
  applied it to a prop mesh: ry is the kea and human convention, where this.ry drives g.rotation.y,
  and it is not the prop one. The field is now _ryUnused. THE DRAW IS UNTOUCHED, because every later
  rnd() in the browser is downstream of it and deleting one draw repins the whole world - the
  snow-patch lesson from session 5, which cost a full re-pin to learn once already.
- THE EVIDENCE THAT THE WORLD DID NOT MOVE IS THE CAPTURE: 25 vantages, 0 flagged, worst 0.9891,
  nothing re-pinned. A rename cannot move a frame and the frames agree.
- CHECKED BEFORE RENAMING, because a rename is only free if nothing reads it: every `<thing>.ry` in
  the file is a kea, a human, a sheep or a collider, the one `p.ry` is inside a comment, home.ry is
  piece 17 and is a different field, no propAt caller passes ry in its opts, and SAVE does not
  serialise props at all.
- THE ASSERTION THAT MATTERS IS THE ONE ABOUT WHAT YOU WOULD SEE. Not one prop mesh is turned about Y,
  and not one mesh heading agrees with its own draw - which is exactly what applying it would look
  like. The two skis are asserted from the other side: they ARE rotated by their build site, about X
  at 1.35, and never about Y. So the section says both halves of the truth rather than only the
  convenient one.
- ONE TAUTOLOGY WAS CAUGHT AND REMOVED BEFORE IT SHIPPED. The first draft asserted
  `some(skis rotated) || every(has a mesh)`, whose right-hand side is always true - an assertion that
  cannot fail is worse than no assertion, because it reads like cover. Replaced with three that can.
- VERIFIED ADVERSARIALLY: renaming the field back to ry fails four, and a propAt that starts applying
  the draw fails two and names the props it turned.
- OPTION (a) IS STILL OPEN AND STILL NOT MINE. Applying the heading turns every prop in the game; it
  is a judged art call and it would re-pin every vantage with props in it.
- EYEBALL: nothing. Frames are unchanged, which is the point.

## SESSION END — 2026-09-02, session 7, six pieces certified
Stop condition reached on the 6-piece rule, not on failures. Nothing was parked as failed, no piece
needed a third staging attempt, and no assertion was weakened, skipped or deleted. Two assertions
were REWRITTEN because they asserted something untrue, both of them mine, both written up where they
happened. Tip is 4c29df092d4cf33cf5ee0f3b2524730b, gate CERTIFIED-SHIP, working tree clean.
    49 ratify-flakes-11-13        docs, md5 unchanged
    50 revert-travel-beat         0038af8b3ce396103b14526baf162227
    15 coop-jail-hardening        3d420ba5dc1359ad6ec2c4a4071261a8
    16 score-attribution          f08f3364e9d513a03c0a6ff8c100bdc4
    48 one-build-one-world        20ee30e813a75df2f132024da35c35b3
    47 name-the-dead-prop-heading 4c29df092d4cf33cf5ee0f3b2524730b
- CAPTURE: a full 25-shot pass after every one of the four game-file pieces, 0 flagged every time,
  worst 0.9815 against 0.965. NOTHING RE-PINNED - the baseline is untouched on disk and in git.
- THE STABILITY SWEEP IS THE HEADLINE, and it ran LAST per the shift discipline. Five vantages do not
  reshoot the same: 17_flight at 0.9024, then 08 at 0.9922, 23 at 0.9929, 05 at 0.9931, 03 at 0.9943,
  everything else between 0.9959 and 0.9999. 17 is thirty times worse than the next one and it PASSES
  the pinned diff at 0.9882, so that pass is a coin toss. The cause is the SETTLE and it is measured,
  not guessed: 04 stages identically and is stable, the only difference is settle:900, and giving 17
  the same takes it to 0.9958. Not shipped - a longer settle changes the frame and a re-pin is Eric.
- THE ORDER MATTERED AGAIN, and differently from session 6. 49 and 50 were taken first because Eric
  said so. After that the diet turned out to be mostly ALREADY SHIPPED - items 1 to 12 were done in
  earlier sessions and never marked - so the real work was 15, 16 and then the two findings 47 and 48
  that Eric had asked me to strike. Marking a diet item DONE when it ships would have saved a
  read-through; the ones that were marked (13, 14, 17) were the only ones I did not have to check
  against git log.
- WHAT THE NEXT SHIFT SHOULD READ FIRST: sections 1 and 2 of REPORT.md. Section 1 needs Eric, not the
  next agent - do not strike 47 or 48 on your own judgement, and note they are both shipped now
  anyway. Section 2 is a one-line harness fix that is fully measured and only wants an eyeball.
- FOUR FINDINGS FILED: 51 (five unstable vantages, with 17 solved) and 52 (the ute cage hint still
  tells a co-op bird to mash its way out). 47 and 48 were both found in session 6 and both shipped
  tonight.
- AND THE HABIT THAT PAID OFF: every piece tonight was proved by SABOTAGE before it was committed -
  eight for the co-op cell, six for the ledger, two each for the last three. Two of those sabotage
  runs crashed instead of reporting, which cost every other finding in the run, so every read of new
  state in a battery now goes through a guard and every interpolated number through a formatter. A
  dead battery is a worse witness than a red one.

## SESSION 8 — 2026-09-02, Eric ratified the run order 53 -> 51 -> 52 -> 36 -> 22 -> 18-21 -> 23-25
Lock taken before any write. Eric pasted TODO 53 and the run order; the block had not been applied to
the tree, so it was run first and committed as his.

### PIECE 53 — settle-17-flight — CERTIFIED (harness-side, game md5 4c29df092d4cf33cf5ee0f3b2524730b unchanged)
Verdict: green, but only after the brief turned out to be built on a wrong diagnosis of MINE from
session 7. Three staging rounds, which is the FLAKES law 8 limit, and the third one was right.
- I WAS WRONG LAST NIGHT AND THE REPORT SAID SO IN BOLD. Session 7 told Eric the fix was to give 17
  the {settle:900} that 04 passes. shot() reads `o.settle||900`. NINE HUNDRED IS THE DEFAULT. So 04
  passing it explicitly is a no-op, the two vantages have always had the same settle, and the
  measurement that seemed to confirm it (0.9024 -> 0.9958) was a lucky sweep of a completely
  unchanged build. That is what a three-take sample gets you on a frame that lives between 0.979 and
  0.993.
- HOW IT WAS CAUGHT: by applying the fix and testing it properly. Five takes instead of three, twice,
  gave 0.9848 and 0.9960 - one of them under the bar the brief sets. A fix that only passes when you
  sample it thinly is not a fix, and the honest move was to stop and read the file rather than run
  the sweep again hoping.
- THEN I STOPPED GUESSING AND MEASURED THE PAGE. Wrote a probe on the capture rig that stages 17
  exactly as capture.mjs does and reads STATE back instead of taking a photograph, five times. The
  bird is IDENTICAL across takes - flapPh, flapDrive, y, vy, ry and the wing transform agreeing to
  nine decimal places. G.time is not: 2.3509 to 2.3843. The bird was never the variable. The ground
  was, and TODO 30 had measured the same thing from the other end a session ago - the grass shader
  sways on uTime, and this camera looks down across the tussock from three metres up.
- THE FIX IS THE LAW-12 IDIOM 21 AND 25 ALREADY USE: pin G.time in the PIN body. Seven sweeps of five
  takes across the session: 0.9998, 0.9993, 0.9998, then 0.9980, 0.9998, 0.9999, 0.9984. The brief
  asks for >= 0.995 and the worst of seven is 0.9980.
- ONE VANTAGE ONLY, per Eric. Doing this in QUIET for the whole set is TODO 30, and it re-pins
  everything, which is a judged call and not this one. 08, 23, 05 and 03 were not touched.
- DIFF: exactly ONE flagged, 17 at 0.9051, which is the intended change - freezing the sway moves the
  grass. NOT re-pinned, per the brief. The other 24 are clean and the baseline is untouched.
- AND THE PROBE FOUND SOMETHING ELSE, filed as TODO 54: the flapDrive pin on 17 is INERT. The PIN
  chain is registered after the game loop, so it runs after update() and render(), and the game zeroes
  flapDrive every frame because the flap key is not held. The probe reads the wing at the flapDrive=0
  GLIDE targets - rotation.z -0.300, open 1.000. So the vantage called 17_flight, whose comment says
  the wings read mid-beat, is photographing a glide, and the pinned flapPh is inert for the same
  reason. 04 avoids it by pressing the flap key so the GAME sets flapDrive. Not fixed here because it
  changes the photograph, which is Eric's call.
- THE CORRECTION IS WRITTEN WHERE THE WRONG CLAIM WAS, not just here: TODO 51 lost the paragraph that
  blamed the settle, TODO 53 carries the correction under Eric's own words, and capture.mjs says it at
  the vantage.
- EYEBALL: gauntlet/capture/17_flight.png against gauntlet/capture/baseline/17_flight.png. The grass
  is frozen at G.time 12.0; the bird should be unchanged.

### PIECE 51 — vantage stability, three fixed and one classified — CERTIFIED (harness-side, game md5 4c29df092d4cf33cf5ee0f3b2524730b unchanged)
Verdict: green for 03, 05 and 23. 08 - the vantage the item is NAMED for - is classified review-tier
under FLAKES law 8 and deliberately left alone, with the measurements to say why.
- THE FIRST THING THIS PIECE DID WAS DISPROVE ITS OWN PREMISE. Session 7 flagged five vantages off a
  single three-take sweep. Re-measured at five takes, four sweeps each, before touching anything:
  08 came back 0.9978/0.9978/0.9978/0.9995 and 23 came back 0.9980 four times - both PASSING every
  time - and 05 came back 1.0000 on the sweep right after being called unstable. Only 03 and 05
  dipped at all, once each. 17 was the only one that never passed, which is why 53 was different.
  ONE SWEEP CANNOT CLASSIFY A VANTAGE, and that is now written into TODO 51 as the finding.
- SO NOTHING WAS CHANGED ON A SINGLE READING. Each candidate got a before-distribution, then the fix,
  then an after-distribution, and only the ones that measurably improved were kept.
      03  0.9943-0.9974  ->  0.9998 0.9998 0.9998
      05  0.9947-1.0000  ->  0.9998 1.0000 0.9998
      23  0.9978-0.9980  ->  0.9995 0.9997 0.9997
- THE FIX IS THE LAW-12 IDIOM, the same one 53 proved on 17: wrap the staging in PIN so the bird
  cannot drift, and pin G.time so the grass shader cannot sway. All three are ground shots looking
  across tussock, which is what TODO 30 predicted from the other end a session ago.
- AND 08 REFUSED, WHICH IS THE PART WORTH KEEPING. The brief says wrap it in PIN and pin whatever the
  HUD reads. Done, measured: 1.0000/0.9879/0.9983 - no better than unpinned and one sweep worse. So
  the pin was REVERTED rather than shipped, because changing a baseline frame that buys no measured
  stability is a cost with no purchase.
- THE PROBE SAYS WHY. Staged and pinned, five takes report the bird, BOTH prompt strings, the wrapped
  line counts, the docked flag, the plate height and the chaos readout all identical - only the frame
  count moves, 140 to 142. Everything the rig can name is already deterministic. What is left is
  dt-driven per-frame accumulation on a 320x180 canvas, where two frames of drift is a visible number
  of pixels, and the answer to that is a deterministic frame clock for the whole rig: TODO 33.
- DIFF: four flagged - 03 at 0.8571, 05 at 0.8836, 23 at 0.8966 from this piece, and 17 at 0.9051
  still carrying piece 53. The drift is large because freezing the sway moves every blade. NOTHING
  RE-PINNED; all four are for Eric.
- EYEBALL: 03, 05, 23 and 17 against their baselines. The subject should be unchanged in each; only
  the grass phase moves.

### PIECE 52 — hint-text-resolved-when-read — CERTIFIED d72bec482c1ec516c985c9c35b060008
Verdict: green. Two staging rounds on the proof, both of them my assertions being too weak rather
than the code being wrong, and the second one is the more instructive.
- OPTION (b), AND IT DISSOLVES THE QUESTION OPTION (a) RAISED. The brief offered either re-texting
  the hint in startGame - which needs somebody to decide who owns G.hints across a restart - or
  giving hint text a function evaluated when it is read. The second needs no decision at all: strings
  still work, a mode-dependent hint becomes a function, and the mode is read at the moment somebody
  looks. addHint can go on refusing to replace a mid it already has, because the line is no longer
  baked in at the time it is added.
- THE ASSERTION THE BRIEF ASKED FOR IS THE RESTART ONE, and it now passes both ways: solo says mash,
  co-op does not, and going BACK to solo says mash again - which a baked string could never do,
  because the first mode of the process won forever.
- AND THE PIECE TRIPPED OVER SOMETHING BIGGER THAN THE LIE IT WAS SENT TO FIX. NOBODY HAS EVER BEEN
  ABLE TO READ THIS HINT. hintScan drops any hint whose mid is not an open MISSION, and there is no
  mission with the id 'cage'; every other hint mid has one. So the line has been unreachable for its
  whole life and the lie was invisible. Filed as TODO 55, with the display decision left to Eric
  because making it live puts a new line of text on screen during play.
- THE TRIPWIRE IS THE INTERESTING BIT OF THAT. The battery asserts that exactly ONE hint has no
  mission behind it and that it is the cage one. That states today's truth and FAILS the day somebody
  makes it reachable - which is exactly the day a human should read the copy. An assertion that
  documents a gap and rings when it closes, rather than one that quietly blesses it.
- TWO WEAK ASSERTIONS OF MINE WERE CAUGHT BY SABOTAGE, NOT BY LUCK:
    1. The display-path check named the hint it expected to fire. Hint radii overlap and hintScan
       returns the first match in list order, so standing in one put the bird in an earlier one and
       the test failed on a true claim. It now reads back WHICH hint fired and holds the plate to
       that one - the claim is that the path resolves, not that a particular hint wins.
    2. Worse, and this one PASSED while broken. The end-to-end check handed a live hint a function
       returning a LITERAL and looked for those words on the plate. Concatenating a function gives
       you its SOURCE, which contains the literal - so a display path that had stopped resolving
       still printed the words and the assertion was happy. The sabotage caught it. The return value
       is now computed at run time (a join), so the sentence exists nowhere in the source, and a
       second assertion requires the plate NOT to contain an arrow. Under the sabotage the failure
       message now shows the source leaking onto the plate verbatim.
- VERIFIED ADVERSARIALLY, THREE WAYS, all caught: the display path reading h.text raw, the resolver
  refusing to call a function, and the hint going back to a baked string.
- CAPTURE: 25 shots. Four flagged - 03, 05, 23 from piece 51 and 17 from piece 53, all still awaiting
  Eric - and NO NEW ONES, which is the claim for this piece: the cage hint cannot display, so no
  frame can contain it. Nothing re-pinned.
- EYEBALL: nothing new. The four already-flagged frames are the ones to judge.

### PIECE 36 — tour-chassis — CERTIFIED 520a4d78a337a9f7f08f9b7e0967d88c
Verdict: green first pass. The proof contract is ZERO OBSERVABLE CHANGE, so most of the evidence is
not assertions at all - it is three comparisons that either match or do not.
- WHAT LANDED: buildWorld is now a DISPATCHER. It resolves a biome, records which one it built in
  G.biome, empties the registries, and calls that biome builder. What used to be its body is
  buildCarpark, registered as the only biome there is.
- THE BODY MOVED WITHOUT A LINE CHANGING, and that is checked mechanically rather than eyeballed: a
  script lifts the old buildWorld body out of HEAD and the new buildCarpark body out of the working
  file and compares them - 251 lines, BYTE-IDENTICAL. That matters more here than tidiness, because
  every rnd() draw in the browser is downstream of every earlier one and the smallest reshuffle
  repins the whole country. The snow-patch lesson, applied to a refactor instead of a feature.
- THE SECOND COMPARISON: nine battery transcripts, before and after. Seven byte-identical. Smoke
  differs only in the file size it prints and its own process id. The everything battery differs by
  exactly one line - the name of the new section. That is what "no touched assertions" looks like
  when it is measured instead of asserted.
- THE THIRD: the capture set. Four flagged, and they are the SAME four already awaiting Eric from
  pieces 53 and 51 - 03, 05, 17, 23. No new ones, and the 21 untouched vantages match their pinned
  baselines exactly, which is the clause the brief actually asks for.
- WHAT THE SECTION DOES ASSERT is the seam: that there is a registry, that the default is the world
  that already existed, that exactly ONE biome is registered today (which is the honest state of the
  tour and will fail loudly and correctly when the ski field lands), that a boot names what it built,
  and that an unregistered id lands you somewhere REAL rather than throwing or leaving an empty
  world. A save or a link naming a biome that has not shipped yet must not be a crash.
- THE TODO 48 GUARANTEE MOVED UP, ON PURPOSE. The registry clear now lives in the dispatcher, ABOVE
  the biome call, so a biome author cannot forget it and cannot opt out of it. Asserted by booting
  twice through the new seam and requiring one world.
- THE RIG DOOR IS ADDITIVE: H.boot(name) exists, H.boot() and X.boot() still mean the default, so not
  one existing call site changed. capture.mjs takes BIOME from the environment and defaults to
  carpark, so every pinned baseline is a carpark baseline by construction.
- VERIFIED ADVERSARIALLY, THREE WAYS: a dispatcher that stops clearing the registries fails piece 48
  assertions (61 orphans of 105); one that stops naming what it built fails five; and a resolver
  without its fallback fails three - after being guarded, because the first run of that sabotage
  KILLED the battery on `b.id` and took every later finding with it. The boot is wrapped now.
- EYEBALL: nothing new. The four flagged frames are still the ones from 53 and 51.

### PIECE 22 — vs-match-scaffold — CERTIFIED 846ee651e37429d7fa3355a49ee9329b
Verdict: green. Two staging rounds, both of them my assertions being naive about systems the file
already had, and both worth writing down.
- A MATCH IS A WINDOW OVER THE SHARED ECONOMY, NOT A SECOND ONE. Piece 16 gave every bird a book that
  adds up to the score at every instant; a match snapshots both books at the whistle and reads the
  difference. So the chaos you arrived with does not count, nothing about scoring had to change to
  get a scoreboard, and there is no second award path to keep in step with the first. Four days of
  ledger work paid for in one subtraction.
- FOUR ENDINGS, ALL FOUR DRIVEN: the horn with a leader, level-at-the-horn opening sudden death,
  the golden point, and the sudden-death cap running out as an honest draw. Sudden death is decided
  by the LEDGER MOVING rather than by a counter of its own, so anything that pays chaos ends it -
  the same rule the rest of the match ran under.
- THE ROLES ARE A SEEDED COIN, and the assertion is that forty flips produce BOTH assignments, so it
  is a coin rather than a constant. They do nothing yet: piece 24 is what makes rex hunt the menace.
  This piece only has to make them exist, be opposite, and be reported.
- THE COMBO ATE MY FIRST DRAFT, exactly as the style-star section warned it would. award() multiplies
  the base by the live combo, so a staged 30 paid 150 and a staged 55 was no longer the biggest play
  by the time three awards had run. Two fixes, both the house idiom: the combo is ISOLATED before
  every staged payment (zeroed, so bumpCombo takes it to one), and pay() RETURNS what actually landed
  so every figure below is derived from the payout rather than from the number asked for. The best
  play is then whichever measured payout was largest, which survives anything that ever multiplies an
  award again.
- AND THE GUARD LESSON, TAKEN AS A HABIT NOW RATHER THAN RELEARNED. Two of the six sabotages produced
  ZERO findings on the first run: a broken ending leaves result null, and reading result.winner threw
  and took every later finding down with it. Every result read now goes through RES(). That is the
  third time this session, so it is written here as a rule: if an assertion reads state that only
  exists when the code under test WORKS, read it through an accessor.
- VERIFIED ADVERSARIALLY, SIX WAYS, all caught once guarded: the coin not being a coin, a level
  scoreline declared a result, sudden death never ending, the golden point not ending it, the LATEST
  play kept instead of the biggest, and the match counting chaos earned before the whistle.
- SCREENS ARE FLAGGED, per the brief, and no vantage covers them - the capture set photographs the
  world, never the title or a results screen. Eric has to look at these by playing: the title has a
  fourth button (key 4), and the results screen is a new #vsend that borrows the win screen wholesale
  with a colder ground so a match reads as a verdict rather than a coronation.
- CAPTURE: four flagged, the same four from 53 and 51, NO new ones. The title gained a button and no
  photograph contains a title.
- EYEBALL: press 4 on the title. The horn, the roles popup, and the results screen after five minutes
  - or set G.vs.t near G.vs.len from the console if you do not want to wait.

### PIECE 18 — fix-verb — CERTIFIED 74e048b26061845b4f4da8e9cccf1997
Verdict: green first pass on the code, and I did not trust that - five sabotages, and the sixth thing
I did was throw away an assertion of mine that was passing by a thousandth.
- ONE VERB, NO SPECIAL CASES. THE MANAGEMENT holds the same grab key on a wrecked tear and it goes
  back. Every tear in the game is restorable by the same code because addTear ALREADY snapshots the
  base position and rotation - it needs them for the wreck animation to lean from - so the restore is
  putting a snapshot back. Nothing per-object had to be written.
- WHAT AN ACT IS WORTH IS LEARNED, NOT TABULATED, which is piece 13 for the third time. A tear has no
  points field; every value is a literal inside its own onDone. So the FIRST wreck measures what
  actually landed and that becomes the pristine value. Change any award in the file and this follows
  it without anybody remembering to.
- ONE COUNTER, BOTH DIRECTIONS, which is what the mode constants ask for. Every completed act on an
  object advances the same count and pays pristine x DECAY^count: measured 35 -> 21 -> 13 -> 8 across
  wreck, fix, wreck, fix. An object that gets fought over is worth less to BOTH sides every time,
  which is the whole point of the rule and is why the counter cannot belong to one direction.
- THE DECAY REACHES THE WRECK SIDE THROUGH ONE HOOK IN award(), scoped to the onDone call and armed
  only inside a match. That is not elegance for its own sake: a tear award is a literal inside its
  own handler, and there is no other way to reach it without editing forty handlers.
- VS ONLY, BY CONSTRUCTION AND NOT BY CIRCUMSTANCE. The gate was originally implicit - outside a
  match nothing can un-do a tear, so no second wreck can happen, so no decay can apply. That is true
  today and would stop being true the moment anything else restored a tear. The hook now tests
  vsOn() as well, and the battery asserts the hook is unarmed outside a match.
- I THREW AWAY MY OWN ASSERTION FOR BEING NEARLY FLAKY. The sequence was checked by step RATIOS
  against a 0.02 tolerance. Measured, the ratios are 0.600, 0.619 and 0.615 - rounding at small
  values - so two of the three sat inside the tolerance by a THOUSANDTH. It passes today and fails
  the day a tear award changes, on correct code. Replaced with the exact form, which has no tolerance
  to get wrong: each act equals the pristine value decayed by the number of acts before it, rounded
  the way the game rounds.
- THE COMBO IS HELD AT ZERO FOR THE WHOLE ACT, not just before it, because the award lands somewhere
  inside a multi-second hold and there is no single moment to zero it at. Piece 22 learned the same
  thing one piece earlier; this is the version that works for holds rather than instants.
- VERIFIED ADVERSARIALLY, FIVE WAYS, all caught: anybody in a match being able to restore, the decay
  never reaching the wreck side, a fix not advancing the shared counter, the order value ignoring the
  cycles, and the pristine value being re-measured on every wreck.
- CAPTURE: four flagged, the same four from 53 and 51, no new ones.
- EYEBALL: press 4, wreck something as kea 1, then hold the other bird key on the wreckage.

## SESSION END — 2026-09-02, session 8, six pieces certified in Eric's ratified order
Stop condition on the 6-piece rule. Nothing parked as failed. Tip 74e048b26061845b4f4da8e9cccf1997,
gate CERTIFIED-SHIP, working tree clean, SESSION.lock released.
    53 settle-17-flight             harness-side, md5 unchanged
    51 vantage-stability            harness-side, md5 unchanged
    52 hint-text-resolved-when-read d72bec482c1ec516c985c9c35b060008
    36 tour-chassis                 520a4d78a337a9f7f08f9b7e0967d88c
    22 vs-match-scaffold            846ee651e37429d7fa3355a49ee9329b
    18 fix-verb                     74e048b26061845b4f4da8e9cccf1997
- THE SESSION IS MOSTLY A CORRECTION, and that is the honest headline. Session 7 told Eric the settle
  fixed 17. shot() reads o.settle||900 - nine hundred IS the default, so the change was a no-op and
  the measurement that confirmed it was a lucky three-take sweep of an unchanged build. It was caught
  by applying the fix and then testing it PROPERLY at five takes, which failed at 0.9848.
- THE METHOD THAT REPLACED GUESSING, and it should be the first move next time something is unstable:
  a probe on the capture rig that stages a vantage exactly as capture.mjs does and reads STATE back
  instead of taking a photograph. It answered 17 in one run (the bird identical to nine decimals,
  G.time not) and it answered 08 in one run (everything the rig can name identical, only the frame
  count moving). Both answers were unavailable to any amount of reasoning about the code.
- THREE ASSERTIONS OF MINE WERE THROWN AWAY, one per failure mode, all written up where they
  happened: one that PASSED WHILE BROKEN (a function concatenated to its own source contains the
  literal you are looking for), one that was flaky by a thousandth (ratios with a tolerance where an
  exact form existed), and one that asserted a wrong expectation about a stale prompt.
- AND ONE LESSON BECAME A RULE: three separate sabotages produced ZERO findings because an assertion
  read state that only exists when the code works - G.squawk.n, result.winner, b.id - threw, and took
  every later finding with it. Every such read now goes through an accessor. If an assertion reads
  state that only exists on the happy path, read it through one.
- WHAT THE NEXT SHIFT SHOULD READ FIRST: sections 1 and 2 of REPORT.md, then TODO 54 and 55, which
  are both judged and both small. The run order after that is Eric's: 19-21, then 23-25.
- FOUR FRAMES ARE FLAGGED AND NOTHING WAS RE-PINNED. 03, 05, 17 and 23 all carry the same intentional
  change - the grass sway frozen so the frame is reproducible - and the baseline is untouched on disk
  and in git. Final stability on those four against the shipped build: 0.9991, 1.0000, 0.9999, 0.9991.

### CORRECTION — the four flagged frames, after actually looking at them (2026-09-02, session 8)
Eric opened the four flagged frames and I built baseline-vs-new composites to check my own claim
about them. THE CLAIM WAS WRONG for three of the four, and it was wrong in the way that matters:
I described them from MECHANISM rather than from looking. What the report said was "the subject
should be unchanged in each; only the blade phase moves". What is actually true:
    17_flight            bird identical, only the tussock. The claim holds here.
    03_kea_plate         THE BIRD HAS MOVED, right and slightly up, and the preen pose differs
    05_tussock_ground    THE BIRD HAS MOVED slightly left, pose differs
    23_paddock_gate      bird effectively unchanged, but THE SHEEP HAVE SHIFTED
- THE CAUSE IS IN MY OWN FIX. For 03, 05 and 23 I did not only pin G.time - I also wrapped the
  staging in PIN, which holds the bird at the staged coordinates EVERY frame. Before, the bird was
  set once and then drifted through the 900ms settle under gravity, ground snap and animation. So the
  new frames show the bird where the staging actually asks for it and the baselines show where it
  drifted to. That is arguably the more faithful photograph - it is the position the staging names -
  but it is a SUBJECT change and Eric has to judge it as one, not as a grass-phase change.
- WHY IT MATTERS BEYOND THIS FRAME: a stability fix that moves the subject is a different proposition
  from one that only freezes the background, and the difference decides whether a re-pin is routine
  or a judgement. Piece 53 (17) was the routine kind. Piece 51 (03, 05, 23) is not, and I filed it as
  though it were.
- THE LESSON, WHICH IS THE SAME ONE AS THE SETTLE: I described a photograph without looking at it,
  on the strength of knowing what the code did. Composite the baseline against the new frame and LOOK
  before writing the eyeball note - it costs one ffmpeg hstack per frame.
- THE SHEEP IN 23 ARE STILL UNPINNED and are ambient, so they are a residual source in that frame
  that this piece did not address. Pinning them is the same FLAKES law 4 move QUIET already makes for
  humans. Not done, because it moves the subject again and 23 already measures 0.9991 to 0.9997.

## SESSION 9 — 2026-09-02, resuming the ratified order at 19
Lock taken. Eric pasted a command to launch a SECOND claude session against this tree; not run - that
is the two-writer collision SESSION.lock exists to prevent - and the run was continued in place.

### PIECE 19 — botch-system — CERTIFIED ed17c5d8cb9f044870769dedc59b8e83
Verdict: green. Two staging rounds, both of them the world being more interesting than my driver.
- A RESTORE NEVER LANDS PRISTINE. The management puts a thing back with its beak, so it lands crooked
  - a small rotation and a small offset - and the SUCCESS CONDITION is untouched: the object reads
  restored, the mission reads restored, only the transform is wonky.
- NON-COMPOUNDING IS THE WHOLE PIECE, and it is the constant speaking rather than my taste. Every
  wonk is measured from PRISTINE, never from where it last landed, so an object fought over seven
  times is exactly as crooked as one put back once. Asserted at one restore, at two, and at seven -
  because compounding is the kind of bug that only shows after a few. The sabotage that multiplies
  the wonk by the cycle fails at the second restore and is a full radian out by the seventh.
- THE BAND IS DERIVED FROM THE CONSTANT, not written next to it: rot and off are (1-BOTCH) times a
  fixed shape. Sabotaging that took two goes to do honestly - replacing the derivation with literals
  of the SAME value changes nothing observable and rightly caught nothing. The real sabotage moves
  BOTCH to 0.5 and leaves the band behind, and that fails two assertions.
- SEEDED PER OBJECT AND PER CYCLE, NOT OFF THE WORLD STREAM. rnd() would have worked and would have
  been wrong: the wonk would then depend on how many draws happened to be spent before the restore.
  Hashing the object id with the cycle makes the wonk a FUNCTION of what is being restored -
  reproducible from nothing but the object. The assertion that says so spends FIFTY rnd() draws
  between two calls and requires the same answer.
- ONE ENTRY POINT, because pieces 20 and 21 have to put carried props and replacements back through
  exactly this and must not be able to invent a second kind of crooked.
- TWO STAGING ROUNDS, BOTH WORTH KEEPING. First, dist2 is a game function and not a battery one, so
  the helper threw. Second and better: RIP OFF SPIKES SPAWNS A LOOSE SPIKE AT THE TEAR POSITION when
  it is wrecked, so the restorer standing on the wreckage picks the PROP as its nearest interactable
  and never sees the thing it came to fix - fixProgress stayed undefined and the fix silently never
  ran. FLAKES law 3, exactly: the driver now clears the ground around the tear every frame.
- VERIFIED ADVERSARIALLY, FIVE WAYS: a restore landing pristine, every restore being the same frozen
  pose, the wonk compounding with the cycle, the constant moving without the band, and the noise
  losing its negative half.
- CAPTURE: 25 shots, 0 flagged, worst 0.9894. Nothing re-pinned. The botch only fires inside a match
  and no vantage runs one.
- EYEBALL: nothing in the set. Press 4, wreck something, put it back, and look at how it sits.

### PIECE 20 — carry-back-restore — CERTIFIED d16cf644cfdffd8c4ca08510f288b5d9
Verdict: green. Three staging rounds, all of them the world being more crowded than the driver
assumed, and the third one is a good FLAKES law 3 story.
- THE WHOLE VERB IS TWO QUESTIONS ASKED AT A DROP: was this thing away when you picked it up, and is
  it home now. That is deliberately all the state there is - no carry flag to keep in step with the
  physics, nothing to unwind if the bird is shooed mid-carry. It simply does not count.
- WHAT IT PAYS IS LEARNED, third time this week: whatever the drop that displaced it AWARDED becomes
  its pristine value, measured across the whole tail of drop() so any future award added there is
  picked up without anybody remembering to. A prop nobody was ever paid for is worth nothing to tidy,
  which is correct and is asserted rather than dodged.
- ONE COUNTER AND ONE KIND OF CROOKED. The carry-back decays on the same shared cycle count the tears
  use, and it lands through piece 19's botchApply rather than a second implementation.
- WHICH MEANT GENERALISING 19 RATHER THAN COPYING IT, and the reason is worth writing down: a tear
  owns its mesh transform outright, but a PROP mesh is re-positioned from p.x/p.y/p.z every frame by
  the physics loop and has its rotation.x flattened when it settles. So a prop is wonked on the axes
  that survive - the logical position and rotation.y - while the band, the seed and the
  non-compounding rule stay exactly the same. One function, two application paths, and both asserted.
- THREE STAGING ROUNDS, AND THE THIRD IS THE LESSON. interact() takes the NEAREST candidate, and the
  first displaceable prop in the world is a ski lying under CHEW THE BINDING: the tear sits 0.36 away
  and the ski 0.57, so every tap went to the tear and the bird never picked anything up - twenty-three
  findings, all downstream of one silent miss. FLAKES law 3 says isolate by teleporting the prop to
  clean ground; that is exactly wrong here, because this piece is about where a prop LIVES and moving
  its neighbourhood moves the question. So the driver picks the prop with the MOST ELBOW ROOM in the
  world instead, and asserts it has more than 0.9m of it.
- VERIFIED ADVERSARIALLY, FIVE WAYS: the menace being allowed to tidy up, a prop never learning it
  was away, a carry-back counting no cycle, the prop landing exactly home unbotched, and the value
  ignoring the cycles.
- CAPTURE: 25 shots, 0 flagged, worst 0.9900. Nothing re-pinned - the verb only fires in a match.
- EYEBALL: nothing in the set. Press 4, take a cone somewhere it should not be, then bring it back.

### PIECE 21 — consumable-replace — CERTIFIED 6b4c21db02a72392d733500958471896
Verdict: green. One staging round on the code, three on my own assertions - and two of those three
are the more useful half of the piece.
- THE ASYMMETRY IS THE DESIGN. A scoffed sandwich cannot be un-eaten: the menace undoes the
  management with one bite and the management cannot answer it in place, it has to WALK to a source.
  The price of the snack strategy is paid in travel, which is exactly what the brief asks for, and
  the source runs out, which is what stops it being a treadmill.
- THE SOURCE FOR A CONSUMABLE IS DERIVED, NOT TABULATED: the nearest registered source to where that
  consumable LIVES. A food added to the picnic table tomorrow is replaceable from the picnic table
  without anybody adding a row to a map.
- THE REPLACEMENT IS THE EATEN PROP, RE-INSTANTIATED, and that is a deliberate call rather than a
  shortcut. Nothing observes object identity - a scoffed prop is banked with its mesh hidden - so
  un-banking it at the source IS a replacement, and it means the home, the learned pristine value and
  the shared cycle count come along instead of being copied onto a new object and drifting from it.
  The fiction stays in the fiction and out of the state.
- IT RIDES PIECE 20 HOME. Fetching sets _wasAway and puts the thing in the beak; everything after
  that is the carry-back verb already certified - same ORDER value, same decay, same botch, same
  counter. No second restore path exists, which was the whole reason 19 and 20 were built as one
  entry point each.
- A COUNT WAS THE WRONG ASSERTION, and this piece proved it. Adding G.foodSrc to WORLDREGS broke my
  own piece-48 assertion that six registries are cleared - a magic number that failed on a correct
  change and said nothing about what was missing. It now NAMES the registries, which is what the
  claim was always about.
- THREE OF MY OWN ASSERTIONS WERE WRONG AND ALL THREE WERE CAUGHT BY SABOTAGE, NOT BY LUCK:
    1. Two sabotages CRASHED the battery on rep.banked when a refused fetch returned null - the same
       unguarded-happy-path read that has now bitten in four consecutive pieces. Guarded.
    2. The second-source assertion sat BEFORE the food was eaten, so both sources answered null and
       it passed against a sabotage that had broken the rule outright. Moved after the meal.
    3. One sabotage was unobservable for an honest reason rather than a test bug: falling back to
       foodSrc[0] hands over nothing when the order belongs to the OTHER source. Replaced with the
       sabotage that actually states the rule - proximity does not matter - which fails immediately.
- VERIFIED ADVERSARIALLY, FIVE WAYS, all caught: a source that never runs out, the menace fetching,
  proximity not mattering, the replacement not counting as away, and any source answering any order.
- CAPTURE: 25 shots, 0 flagged, worst 0.9904. Nothing re-pinned.
- EYEBALL: nothing in the set. Press 4, eat the sandwich as kea 1, then walk kea 2 to the picnic
  table and back to where it was.

### PIECE 23 — arena-scoping — CERTIFIED 96a83803f067232a08463219ced371ed
Verdict: green. Two staging rounds, and the first one is a finding about the diet rather than the code.
- THE BRIEF NAMES DATA THE FILE DOES NOT HAVE, for the fourth time this week, and this time it is
  load bearing: "only interactables whose mission area matches the arena". TWENTY-NINE of SIXTY-FIVE
  interactables carry a mission id. Scoping on mission area alone would leave 36 of them - most of
  the tears, most of the props - unscoreable in EVERY arena, which is not a match, it is an empty
  carpark.
- SO EVERY INTERACTABLE IS STAMPED, AND THE STAMP IS DERIVED: its own mission area if it has one,
  otherwise the area of the nearest thing that does. No table and no per-object tagging, so a tear
  added beside the hut tomorrow is a hut tear without anybody saying so. Stamped from where a thing
  LIVES rather than where it currently is, so carrying a cone across the map does not move the patch
  it belongs to. The assertion that the derivation is a FALLBACK and not an override is the one that
  matters: a thing with a mission keeps its own area, and a sabotage that takes that away fails four.
- THE GATE READS THE PLACE, NOT THE CALL SITE. award() already carries the position an act happened
  at, so the gate asks which patch that position is in - forty-six call sites untouched, exactly like
  the actor stack in piece 16. An award with NO position is not a patch act at all (a page turn, a
  finale) and is never gated, which is asserted because getting it wrong would silently stop the game
  paying for anything without a location.
- THE ARENA RULE IMMEDIATELY BROKE FIVE EARLIER SECTIONS, and that was the rule working. Pieces 18
  through 22 stage awards wherever is convenient, which is now out of patch. Every one of those
  sections now turns the arena OFF with a line saying why - FLAKES law 3 applied to a rule the
  section is not testing - rather than being quietly moved into the arena.
- VERIFIED ADVERSARIALLY, SIX WAYS: a gate that never refuses, every patch being the arena, scoping
  applied with no match running, the gaps never filled, a mission-bearing thing losing its own area,
  and every match picking the same patch. Four report findings; the no-match one CRASHES the game on
  a null match, which the gate catches as a dead battery but which cannot be turned into a finding
  from the test side - the guard it removes is the fix.
- AND THE FIFTH UNGUARDED READ OF THE WEEK, mine again: with the stamp sabotaged there is nothing to
  aim at, and every read below threw. The block now bails and keeps its verdict. This has now
  happened in five consecutive pieces and is written up in the report as a rule rather than a lesson.
- CAPTURE: 25 shots, 0 flagged, worst 0.9904. Nothing re-pinned.
- EYEBALL: nothing in the set. Press 4 and read the patch popup, then go and wreck something in a
  different chapter and watch it pay nothing.

### PIECE 24 — role-aware-rex — CERTIFIED 39c2d931f488caa1679afa01fff0e697
Verdict: green first pass. Six sabotages, one of which found a real gap in my own section.
- THE CELL CHANGES HANDS, AND IT COST ONE LINE. Piece 15 stopped the cage clock in co-op because
  your mate is the only way out. In a match your mate is the one who put you there, so the solo
  rules come back - the sentence runs down, mashing works - and the latch is LOCKED. That whole
  reversal is `coopCell()` gaining `&&!vsOn()`, which is the return on having written piece 15 as
  ONE predicate with one place to read it. Asserted in both directions: a match is a solo cell, and
  a plain two-player game is a co-op cell again with the latch unlocked.
- REX PICKS A SIDE ONLY WHEN THERE IS A WARRANT. Below WANTED 3 he takes the nearest bird exactly as
  he always did; at 3 and above, inside a match, he walks past the management standing a metre away
  to hunt the menace nine metres off. Asserted as the ROLE and not the index by swapping the roles
  and requiring him to swap targets, and range still applies.
- THE CAGING BONUS HAS NO POSITION, ON PURPOSE, and the section is built to pay for that claim: the
  arena is left ON and set to a patch the ute is not in. If the bonus were scoped it would vanish
  whenever the ute was parked outside the arena, which is most of the time. The sabotage that gives
  it a position fails immediately.
- THE SABOTAGE SWEEP FOUND A HOLE IN MY OWN SECTION. Making the bonus fire for ANY caging caught
  nothing, because the section only ever caged the menace - so the reverse is now driven too: rex
  cages the management and nobody is paid. That is the sixth sabotage and it is the one that made
  the piece honest.
- VERIFIED ADVERSARIALLY, SIX WAYS, all caught: the co-op cell staying on in a match, the latch still
  opening, rex never picking a side, rex picking one with no warrant, the bonus being patch-scoped,
  and any caging paying.
- CAPTURE: 25 shots, 0 flagged, worst 0.9894. Nothing re-pinned.
- EYEBALL: nothing in the set. Press 4, get WANTED to 3 as the menace, and see who he comes for.

### PIECE 25 — vs-hud-split — CERTIFIED df4ae7c6cdee29c3a0bbe3aa7f514f24
Verdict: green. Six sabotages, and the one that FAILED to break anything is the reason this entry is
worth reading.
- BUILT THE WAY PIECE 5 BUILT THE REFLOW: the layout is a set of FLAGS computed from the viewport
  width and the match state, and the DOM is left with nothing to decide. Nothing measures an element,
  which is exactly why the whole section runs under node at 320, 420, 500, 640 and 1280 without a
  browser anywhere near it.
- THREE BANDS, EACH DROPPING THE LEAST USEFUL THING rather than shrinking everything. Wide spells the
  roles out and labels the clock; mid keeps the role words; narrow keeps two numbers, a clock and ONE
  LETTER per role, because at 320 the scoreline IS the HUD and the rest is decoration. Both
  breakpoints are asserted on the exact pixel either side.
- A CONDITION THAT CANNOT FIRE IS WORSE THAN NO CONDITION. I added "or a match is on and narrow" to
  the TAB pill docking rule, and the sabotage that removed it changed NOTHING - because the versus
  HUD goes narrow below 420 and the plate already docks the pill below 480, so the match term is a
  strict subset and could never change the answer. It reads like a rule and is not one. Removed, and
  the assertion now states the real relationship: 420 sits inside 480, and the pill docks at 320 with
  no match at all for the reason it always did.
- VERIFIED ADVERSARIALLY, SIX WAYS: every width being the wide layout, role words that never shorten,
  sudden death showing the match clock instead of its own cap, a clock that counts past zero into
  negative minutes, the scoreline showing the shared total instead of the match delta, and the dead
  docking clause - which is the one that caught nothing and was therefore the most useful.
- CAPTURE: 25 shots, 0 flagged, worst 0.9903. Vantage 08 - the 320px HUD frame this piece had to
  respect - reads 0.9994, because no capture runs a match and the scoreline stays hidden.
- EYEBALL: press 4 and narrow the window. The look is FLAGGED per the brief - the bands and what
  survives each one are the decision, and they are Eric's to move.

## SESSION END — 2026-09-02, session 9, six pieces and the run order is finished
Stop condition on the 6-piece rule. Tip df4ae7c6cdee29c3a0bbe3aa7f514f24, gate CERTIFIED-SHIP, 25
vantages 0 flagged, working tree clean, SESSION.lock released.
    19 botch-system          ed17c5d8cb9f044870769dedc59b8e83
    20 carry-back-restore    d16cf644cfdffd8c4ca08510f288b5d9
    21 consumable-replace    6b4c21db02a72392d733500958471896
    23 arena-scoping         96a83803f067232a08463219ced371ed
    24 role-aware-rex        39c2d931f488caa1679afa01fff0e697
    25 vs-hud-split          df4ae7c6cdee29c3a0bbe3aa7f514f24
- THE BLOCK CAME OUT AS ONE MACHINE, which is the return on how 16, 18 and 19 were written: one ORDER
  economy serving tears, carry-backs and replacements; one botchApply that every restore lands
  through; one predicate that reverses the whole cage for a match; one gate that scopes forty-six
  award call sites by reading the position award() already carries.
- FOUR OF MY OWN ASSERTIONS WERE WRONG AND SABOTAGE FOUND ALL FOUR. One could not fail (a docking
  clause whose condition was a strict subset of one already there), one tested nothing (a bonus rule
  never driven in reverse), one ran before the state it asked about existed, and one was a magic
  count that broke on a correct change. All four are written up where they happened.
- AND THE GUARD RULE IS NOW FIVE PIECES OLD: if an assertion reads state that only exists when the
  code WORKS, read it through an accessor. Sabotages kept returning zero findings because a test threw
  on rep.banked, result.winner and inIt.area and took every later finding with it.
- THE STABILITY INSTRUMENT IS CONFIRMED TWICE. A four-take sweep flagged 12_seal_midpeel at 0.9941;
  three five-take sweeps read 0.9988, 0.9980, 0.9951. That is the second time a single sweep has named
  a vantage repeated sweeps clear, so TODO 51 now carries it as a rule: nothing is unstable until
  three sweeps agree.
- ERIC PASTED A COMMAND TO LAUNCH A SECOND CLAUDE SESSION AGAINST THIS TREE. Not run - that is the
  two-writer collision the lock exists to prevent - and the run was continued in place. Worth a line
  because the next agent will see the same paste in the transcript and should make the same call.
- WHAT THE NEXT SHIFT SHOULD READ FIRST: REPORT.md, then the three things still waiting on Eric - the
  re-pin question from session 8, TODO 56 (which collides with his own blocked list), and 54/55.

## SESSION 10 — 2026-09-02, Eric order: 54, 55, then 37, then the numbered queue

### PIECE 54 — flap-the-flight-vantage — HARNESS-SIDE, game md5 df4ae7c6cdee29c3a0bbe3aa7f514f24 unchanged
Verdict: green. One line of staging, and the brief own proof had to be thrown out first.
- THE FIX IS THE ONE LINE THE BRIEF NAMES: KEAGAME.press(KEAGAME.P1MAP.flap) in the 17 stage, which
  04 has always had. The PIN chain is registered after the game loop, so it lands after update() and
  render(); the game zeroed flapDrive every frame and the pinned 1 never reached an animate() call.
  Pressing the key makes the GAME set it, so the pose is the real flap branch.
- THE PROOF THE BRIEF ASKS FOR IS A TAUTOLOGY, AND IT WAS MY OWN WRONG SPEC FROM SESSION 8. It says
  assert flapDrive is 1 at read time. It ALREADY read 1 while inert - the PIN writes it back after
  render, so reading it reads my pin and never the game. Three takes on the unchanged build:
  flapDrive 1, and the wing at the glide constants beside it.
- SO READ THE POSE, AND READ THE ONE THING animate ASSIGNS. `H.rotation.x=this.flapDrive?-0.1:-0.2`
  is not lerped, so it is exactly what animate last saw, and it moved -0.200 -> -0.100. Beside it:
  wing.rotation.z -0.300 -> -1.171 (the glide constant, gone), wing.rotation.x 0.000 -> -0.120,
  open 1.000 -> 0.998, and _beatT - the flap audio cadence, game-owned and NOT in the pin - went from
  absent to 0.02-0.04, which is the game telling you the flapHeld branch is running.
- THE PROBE IS capture.mjs WITH THE SHUTTER SWAPPED, one sed on the screenshot line, so the staging
  cannot drift from the rig it is meant to be measuring. Five takes each side of the change.
- STABILITY, three sweeps of five takes: 0.9997, 0.9972, 0.9976 against a bar of 0.995. Three sweeps
  because one cannot classify a vantage - the session 9 rule, applied.
- AND THE DRIFT DETECTOR NEVER SAW IT. The frame reads 0.9826 against the re-pinned baseline and
  diff.mjs does not flag under 0.965, while the same pair cropped to the subject box subjects.mjs
  already carries for 17 reads 0.639. A bird filling a twentieth of the frame can be replaced
  outright inside the drift budget. Filed as TODO 57 - it is a missing instrument, not a bug in a
  working one.
- CAPTURE: 17 reshot, 25 compared, 0 flagged, worst 0.9826 (which is 17). Subject tripwire green,
  442 kea pixels against a floor of 190. NOTHING RE-PINNED, per the brief.
- EYEBALL: gauntlet/capture/17_flight.png against gauntlet/capture/baseline/17_flight.png. The wings
  were at the glide spread and are now mid-downstroke. The decision is whether 17 and 04 should read
  differently at all, given 04 is the underwing shot - the brief asks that out loud and it is yours.

### PIECE 55 — cage-hint-alive — CERTIFIED 4c7fd986c7a3762b4e556a62ae9942e2
Verdict: green. Option (b) of the three the brief offers, which it calls the smallest honest change.
- THE MISSION GATE GETS AN EXPLICIT OPT-OUT. addHint takes an options bag; hintScan skips the mission
  lookup for a hint carrying free:true; the cage hint declares it at the call site with the reason
  written beside it. Nine hints on the board, one of them free.
- THE GATE WAS NEVER REALLY ABOUT MISSIONS, IT WAS ABOUT TYPOS, and that is the part that must not be
  traded away for one line of teaching. So it is driven now instead of assumed: the battery adds a
  hint whose mid no mission has, without the flag, stands the bird in its radius, asserts the plate
  stays empty, then splices it back out - because nothing clears G.hints between runs (FLAKES law 1)
  and the counts above it are asserted again on the next pass through the file.
- THE TRIPWIRE FIRED, WHICH IS WHAT IT WAS BUILT FOR, AND IT WAS RE-AIMED RATHER THAN DELETED. It now
  asserts strictly more: still exactly one missionless hint, still the cage one, missionless ON
  PURPOSE, the opt-out has not spread to a second hint, and the typo safety still holds. This is the
  distinction the no-weakening law turns on - the old assertion stated a fact that piece 55 was
  commissioned to change, and the new one states what is true after it, plus the safety underneath.
- SABOTAGED THREE WAYS AND ALL THREE CAUGHT BY NAME: dropping the free flag from the call site (9
  findings, including both modes going silent), making hintScan gate nothing (2 findings, and it is
  the typo hint that catches it, not the cage one), and making addHint default to free (4 findings,
  and the spread assertion names all nine hints in its message).
- A VERB BEATS A HINT, and that is the answer to the judged part of the brief - whether this puts new
  noise on screen during play. hintScan only writes to an EMPTY plate, so standing at the hint centre,
  inside grab range of the ute keys, a player reads GRAB UTE KEYS and the hint says nothing. Asserted
  both ways: the hint is the one in range there, and it is silent there.
- BOTH MODES READ THEIR OWN LINE, which is the proof the brief asks for: solo gets the mash sentence,
  co-op gets the latch one and no mash anywhere in it, from the same hint object, off the resolver
  piece 52 built.
- TWO THINGS LEFT FOR ERIC, NEITHER BUILT. Caging needs G.wanted >= 3 and an empty cell, so the copy
  teaches a mechanic that cannot fire below WANTED 3 - gating the hint on the warrant would teach it
  the moment it becomes true, and that is a copy call. And the hint is placed off G.uteG.localToWorld
  inside startGame with no guard, which the second biome walks straight into: TODO 58.
- CAPTURE: full pass, 25 compared, 0 flagged, worst 0.9823 which is 17 carrying piece 54. No vantage
  stands within the 6-unit cage radius at (12.2, 5.9), so nothing else moved. Subjects 7/7.
- EYEBALL: press E near the DOC ute in solo and again in co-op. The line is new on screen - it has
  never displayed before tonight - so it is worth ten seconds of reading it in place.

### PIECE 37 — tour-save-and-map — CERTIFIED c1fcfbc6df3b2939d240f8112bb8b38a
Verdict: green. The biggest piece of the run: a save schema, a migration, a level select and its
state machine. Five sabotages, and the one that came back EMPTY is the entry worth reading.
- SCHEMA v3 KEEPS A SLOT PER BIOME - done, chapIdx, stars, pages, hats, and the page list so a pin
  can say n of m without loading the map. The career numbers stay at the top of the blob because
  peak chaos, time played and band colour are the PLAYER, not the map. Same storage key: the key is
  how a returning player is identified and bumping it would wipe every run alive.
- MIGRATION IS RETRO-GRANTING, NOT GUESSING. A v1 or v2 blob described the carpark, so the whole of
  it becomes the carpark slot and the slot records which vintage it came from. Nothing is dropped and
  nothing is invented for a map that never existed - asserted both ways, including that a v2 save
  HYDRATES through the migration rather than merely converting.
- AND IT STILL WRITES THE v2 SHAPE ALONGSIDE. The v2 assertion said an older build reading this blob
  still works, and there are older copies of this file; that promise was not mine to break. So the
  top of the blob is a MIRROR of whichever map you are standing in, written and never read, and the
  battery holds it to being exactly the current slot rather than a second version of the truth.
- THE COLLISION THE SLOTS EXIST FOR IS PROVED WITH TWO MAPS WHOSE PAGES SHARE A NAME. The stars
  ledger is keyed by AREA, and two maps are perfectly free to have a page called THE CARPARK. The
  stub biome in the proof BUILDS the carpark, so both slots key by identical strings - which is
  exactly what v2 would have written over. Two biomes with different chapter lists would have proved
  nothing about the thing that made this schema necessary.
- THE BROCHURE IS ONE TABLE and everything on the paper comes out of it: order, copy, pin position,
  price. Currency is the TOTAL stars across the tour, so a map opens by being good anywhere rather
  than by grinding the one before it.
- FOUR PIN STATES, WHICH ARE NOT THE SAME QUESTION: locked (not paid for), soon (paid for, no builder
  yet), open (go), current (here). A pin can be unlocked and unbuilt, and saying GO when there is
  nothing to walk into would be the lie. tourPick refuses with a WHY and the price in the answer.
- A PLAIN BOOT FOLLOWS A RECORDED PICK, and that assertion exists because the feature caught me while
  I was writing the section: the migration block booted plainly, landed in the picked map instead of
  the carpark, and read a slot nobody had written. That was the pick working. It is an assertion now
  instead of a surprise.
- THE SABOTAGE THAT CAUGHT NOTHING, AND WHY. A write that clobbered every other map returned ZERO
  findings and looked like a hole in the test. It was not: my own assertion read
  blob.biomes.carpark.stars directly, threw when the slot was gone, and took every finding after it
  down with it. That is the session-9 guard rule - if an assertion reads state that only exists when
  the code WORKS, read it through an accessor - and it is now five pieces old and still landing.
  Rewritten through an accessor, the same sabotage produces eight findings. The other four:
  a pin saying GO when unbuilt (1), the brochure counting only the current map (7), migration losing
  the vintage marker (2), a wipe leaving the pick behind (2).
- CAPTURE: 26 shots, 25 compared, 0 flagged, worst 0.9826 which is still 17 carrying piece 54.
  Subjects 7/7. NEW VANTAGE 26_tour_brochure, deliberately NOT pinned - the look is flagged per the
  brief, so it has no baseline and diff ignores it.
- IT ALREADY EARNED ITS KEEP: the first 26 frame showed the heading cut off the top and the BACK
  button off the bottom, because .screen centres its children inside overflow hidden and the
  brochure is taller than 540px. That screen now scrolls from the top. Nothing else could have seen
  it - no assertion measures a browser, which is the whole reason the vantage exists.
- EYEBALL: gauntlet/capture/26_tour_brochure.png, and press M at the title. Six rows and six pins,
  four states on one sheet. At 960x540 the sixth row and the BACK button are below the fold and it
  scrolls to them - shrinking the paper again to fit all six is a look call and it is yours.
- AND WHAT IS NOT REACHABLE YET: with one biome registered, GO cannot be clicked in the shipped game
  - every pin but the carpark reads LOCKED or NOT BUILT YET. The open path is proved headless until
  piece 39 builds the ski field. That is the honest state of the tour, and the brochure says so out
  loud rather than pretending.

### PIECE 38 — tour-travel — CERTIFIED fdc032709319f9a207d0492077b41da2
Verdict: green. Built fresh - 34 was reverted and there was no travel code left to re-key - and all
four findings of the Sep 1 investigation honoured rather than rediscovered.
- ANCHORS ARE A TABLE, declared by the biome beside its builder. The binding evidence says centroids
  cannot come from hints or mission props, so they do not. What a table CAN be held to is the world it
  names: the carpark look-at is asserted within 24 of the built prop centroid, above the ground at its
  own feet, and pointing down. Move the carpark and not the line and an assertion says so.
- TWO LOCKS ON THE SKIP, ANSWERING DIFFERENT QUESTIONS. A key still held from the press that OPENED
  the beat has not asked for anything - it counts only after a release and a fresh press. A key
  pressed INSIDE the arm delay is a real request, so it is not discarded; it lands the moment the beat
  arms, and the assertion measures that it lands at the arm delay and not at the end of the beat.
- THE BLEND SITS BEFORE camLock, AND THAT IS PROVABLE UNDER NODE AFTER ALL. G.cams is empty headless,
  but nothing in updateCams needs a real camera - a stub with a position and a lookAt answers the only
  question that matters. With a beat running at u=0.5 AND camLock set, camLock wins, look-at included,
  which is the half a blend would have quietly kept.
- THE PAGE LOAD IN THE MIDDLE IS AN IMPLEMENTATION DETAIL, and the state machine is written so it
  stays one. OUT arms an arrival in storage and reloads; boot lands in the picked biome AND STARTS
  THE RUN IT LEFT rather than dropping the player at a title screen; startGame consumes the arrival
  once and plays IN. When a biome can be swapped in place, travelOut stops reloading and nothing else
  about this piece changes.
- DRIVEN END TO END IN A REAL BROWSER, because half of this does not exist anywhere else.
  gauntlet/verify/journey.mjs injects a stand-in ski field into a temp copy of the game so it survives
  the reload - and stops injecting the day 39 registers a real one, rather than overwriting the thing
  it is meant to be testing. Map opens mid-run and PAUSES the world; GO closes it, puts the pause back
  the way it found it, and runs the OUT beat; the load lands in the ski field with the run going and
  the card up; one fresh press of SPACE skips it.
- TWO DEFECTS THE FRAMES CAUGHT, and no assertion could have. The to-do list flash sat on top of the
  arrival card and covered half the name of the place - it now waits for the beat, raised by travelEnd,
  which is also correct after a SKIP where a timer would have been wrong. And the opening popup called
  every map A CARPARK; the carpark keeps its exact wording and anywhere else is named by the registry.
  Both were made reachable by this piece, which is why they are in it.
- SIX SABOTAGES, ALL CAUGHT - and the first caught NOTHING until the read went through an accessor.
  THIRD TIME IN ONE SESSION for that rule, and this time in my own brand new section: held only
  exists while a beat is RUNNING, the ended record does not carry it, so every sabotage that ends a
  beat early turned tv().held[KEY] into a throw and killed the battery. Two of the three cost a
  sabotage each before I spotted it. If a section reads a field that only exists in one phase, read it
  through an accessor - it is no longer a guideline in this file, it is the failure mode.
- AND IT FOUND A FOUR-BUILD-OLD BAD ASSERTION OF MINE, filed and fixed as TODO 59. Adding world
  builds moved the seeded rng stream, the carry-back section picked a different prop, and an assertion
  asking for hypot <= BAND.off failed - because botchWonk draws x and z independently, so the
  invariant is PER AXIS and the corner of the band is off times root two. It had been passing on the
  luck of which prop got picked, and it was the only one of four botch assertions written that way.
- CAPTURE: 27 shots, 25 compared, 0 flagged, worst 0.9826 which is still 17 from piece 54. Subjects
  7/7. New vantage 27_travel_card, NOT pinned - the feel is flagged per the brief.
- EYEBALL: gauntlet/capture/27_travel_card.png - the arrival beat frozen halfway, the anchor shot of
  the carpark with the name over it. Then run `node gauntlet/verify/journey.mjs` and read the state
  line by line, because no player can do this yet.
- AND WHAT IS NOT REACHABLE, SAID PLAINLY: with one biome registered there is nowhere to travel to.
  GO is disabled on every pin but the one you are standing on, so nothing in this piece can be
  triggered by a player until 39 builds the ski field. The journey instrument is the stand-in until
  then, and it is committed for exactly that reason.

### PIECE 58 — hint-belongs-to-its-map — CERTIFIED 5c955bb4e7741eaea477606db3d228ac
Verdict: green. Taken AHEAD of 39 in the queue because it blocks it - the first real second map
cannot boot at all while startGame reaches into G.uteG with no guard.
- THE FIX IS AN OWNER, NOT A GUARD, which is what the brief guessed and it was right. The cage hint
  moved into mkDocUte, the thing that builds the cage. A map with no ute never calls it, so it never
  has the hint, and nothing anywhere has to remember that.
- AND G.hints JOINED THE WORLD REGISTRIES, which was the other half of the same bug and was not in
  the brief. It was the one thing a build put on the board that the dispatcher never took back off -
  invisible while there was one map, and with two it means the carpark teaching follows you to the ski
  field and points at props in a country that is not there.
- MOVING CODE EARLIER IN THE FRAME CHANGED WHAT IT MEANT. localToWorld in r128 multiplies by
  matrixWorld and does not compute it. In startGame the renderer had been through several frames; at
  build time nothing had, so the hint landed at its LOCAL offset - 1.1m behind the world origin - and
  the cage teaching started firing in the middle of the carpark. The battery caught it on the first
  run. updateMatrixWorld first, and it is back at 12.16, 5.91: the exact coordinates the old site
  produced, asserted to nine decimal places across two builds of the same world.
- A BIOME WITH NOTHING IN IT BOOTS AND STARTS, and that assertion is worth more than this piece. It
  says startGame needs nothing else from the carpark, which is the thing 39 would otherwise discover
  the hard way, one throw at a time.
- THREE SABOTAGES, and the third caught NOTHING TWICE before it landed. Three separate reads in the
  hint section went straight at cage() - .text, .free and .x - and each threw the moment the hint was
  gone. Two of those reads were mine from tonight and one was from piece 52. Through an accessor the
  same sabotage lands 21 findings.
- FOUR TIMES IN ONE SESSION IS NOT A HABIT, IT IS A LAW. Written into FLAKES as law 14 in its own
  commit, because the next agent should read it before writing a test rather than after burning two
  sabotages on it.
- CAPTURE: 27 shots, 25 compared, 0 flagged, worst 0.9823 which is 17 from piece 54. Subjects 7/7.
  Nothing moved, which is the expected result: no mesh and no rnd draw changed hands.
- EYEBALL: nothing new. Stand by the DOC ute in solo and in co-op and the line is where it was.

### PIECE 57 — subject-drift-instrument — HARNESS-SIDE, game md5 5c955bb4e7741eaea477606db3d228ac unchanged
Verdict: green, and it found something on its first run.
- gauntlet/verify/boxdiff.mjs asks the question that fell between the two instruments we had.
  diff.mjs asks whether the FRAME moved; subjects.mjs asks whether the bird is THERE; nothing asked
  whether the bird MOVED. Piece 54 proved the gap was real - a glide became a mid-downstroke and the
  frame detector passed it at 0.9826.
- THE BOXES ARE subjects.mjs OWN, IMPORTED, not copied. One small refactor there: SPEC and the
  classifiers are exported and the run is guarded as a main module, so importing the file no longer
  fires seven ffmpeg crops and prints a verdict nobody asked for. The jam road box is excluded by
  CLASS rather than by vantage name, because what disqualifies it is being scenery.
- THE 54 PAIR IS THE PROOF AND IT LANDS: 17_flight 0.6388 in the box, 0.9826 on the frame.
  Threshold 0.98, sitting between that and the three unchanged boxes at 0.9999, 1.0000 and 0.9996.
- AND 07_jam CAME BACK RED, which was not planned. 0.9580 in the box against 0.9904 on the frame,
  and not noise: three consecutive reshoots gave 0.957981, 0.957981, 0.957993. The subject is
  perfectly reproducible and has MOVED since it was pinned - the resting wings sit lower and tucked
  where the baseline has them slightly spread. Baseline pinned at 59a8493, many builds back. Filed
  as TODO 60 with the crop pair saved at gauntlet/capture/boxdrift_07_jam.png. NOT re-pinned.
- DO NOT TRY TO FIND THE BIRD AUTOMATICALLY, and both traps are written into the instrument header
  so the next agent does not pay for them again. A bounding box over every kea-window pixel spans 96
  percent of the frame, because that window only discriminates INSIDE a chosen region - the trap
  subjects.mjs already warns about, wearing a new coat. And a peak-density search finds the HUD in 24
  of 25 frames, because the KEA 1 badge is painted in var(--kea): the same olive as the bird, by
  design. Two attempts, both worthless, both recorded.
- COVERAGE IS FIVE VANTAGES and the four that need boxes most - 03, 13, 18, 20, where the subject IS
  the photograph - do not have them. TODO 61, with the method spelled out and the automation warned
  off.
- CAPTURE: nothing reshot beyond 07 three times for the stability measurement. Game file untouched.
- EYEBALL: gauntlet/capture/boxdrift_07_jam.png - fresh on the left, pinned on the right. The wings.

## SESSION END — 2026-09-02, session 10, six pieces and the tour exists but has nowhere to go
Stop condition on the 6-piece rule. Tip 5c955bb4e7741eaea477606db3d228ac, gate CERTIFIED-SHIP, 25
pinned vantages 0 flagged, two new vantages shot and deliberately unpinned, working tree clean,
SESSION.lock released.
    54 flap-the-flight-vantage   harness-side (df4ae7c6 unchanged)
    55 cage-hint-alive           4c7fd986c7a3762b4e556a62ae9942e2
    37 tour-save-and-map         c1fcfbc6df3b2939d240f8112bb8b38a
    38 tour-travel               fdc032709319f9a207d0492077b41da2
    58 hint-belongs-to-its-map   5c955bb4e7741eaea477606db3d228ac
    57 subject-drift-instrument  harness-side (unchanged)
- ERIC ORDER WAS 54, 55, 37, THEN THE NUMBERED QUEUE, and it was followed with one substitution:
  58 was taken ahead of 39 because it BLOCKS it. startGame reached into G.uteG.localToWorld with no
  guard, so the first real second map could not have booted at all. A biome with nothing in it now
  boots and starts, and that assertion is standing for 39 to lean on.
- THE TOUR IS REAL AND UNREACHABLE. 37 built the schema and the brochure, 38 built the beats, both
  work end to end - and with one biome registered no player can trigger either. 39 is the gate on all
  of it. That is the headline of the report and it is said out loud rather than implied.
- 39 WAS NOT ATTEMPTED, and the reason is worth reading before somebody tries it at 3am: its
  GRADUATION half deletes the carpark ski corner, and propAt keeps a deliberate rnd draw per prop
  (TODO 47) PRECISELY SO THE COUNTRY DOES NOT MOVE - so removing five props shifts every later draw
  and reshuffles grass, snow, tussock and beech across all 25 baselines. It also takes five missions
  and a star page out of a live save. That is a ratification, not an overnight decision. The diorama
  half is clean and additive and should ship on its own first.
- FOUR SABOTAGES DIED ON A THROW BEFORE I BELIEVED IT WAS A PATTERN. Session 9 logged the guard rule;
  this session met it four more times in three different pieces - a save blob slot, a travel held-key
  map, and three separate reads of one hint. It is FLAKES law 14 now, with the tell written down: a
  sabotage that returns NOTHING means look for a stack trace before you conclude the test is thin.
- AND FLAKES LAW 15, paid for the same way: piece 38 added two world builds, the seeded stream moved,
  and a four-build-old assertion of mine failed because it asked for hypot <= BAND.off while
  botchWonk draws x and z independently. The corner of the band is off times root two. It was the
  only one of four botch assertions written that way. TODO 59.
- THE TWO NEW VANTAGES EARNED THEIR KEEP ON THEIR FIRST SHOT. 26 showed the brochure heading clipped
  at 540px (.screen centres inside overflow hidden); 27 showed the to-do flash sitting on top of the
  arrival card. Neither was reachable by any assertion in the file, and both are fixed.
- WHAT THE NEXT SHIFT SHOULD READ FIRST: REPORT.md, then the three decisions in it - 17 as a
  photograph, 07 as a drift (TODO 60), and the 39 graduation re-pin. Then FLAKES 14 before writing a
  single assertion.

## SESSION 11 — 2026-09-02, Eric order: 39 first (additive only, no graduation), then the numbered queue

### PIECE 39 — skifield-biome — CERTIFIED aff1fa389a8e8ed138299474e77dc028
Verdict: green. THE SECOND MAP EXISTS AND A PLAYER CAN WALK INTO IT. Additive only, per the order:
the graduation is not here and nothing in the carpark moved - 25 pinned vantages, 0 flagged.
- THE BROCHURE SAYS GO AND IT WORKS END TO END IN A BROWSER. journey.mjs no longer injects a
  stand-in, because there is a real ski field to drive into: map opens mid-run and pauses the world,
  GO records the pick and runs the OUT beat, the load lands in the SKI FIELD with the run going and
  the arrival card reading THE CLUB SKI FIELD, and one fresh press of SPACE skips it. 37 and 38 have
  been unreachable for two sessions and are reachable as of this commit.
- THE DIORAMA: a rope tow up the fall line (engine shed, bull wheel, six towers with sheaves, a
  nutcracker on every second span, an A-frame and an old concrete anchor at the top), a day lodge on
  piles with a gable roof, three windows, a chimney and the deck everybody eats on (railing, two
  trestle tables, benches, steps), three ski racks with five skis, three poles, two goggles, a ski
  boot and somebody litter, a groomed band of corduroy down the middle wanded on both edges, sixteen
  drifts banked against the structures, a nest on the rock at the bottom, and the carpark own
  mountain construction with ski field radii and a snowline dropped to where a club field sits.
- FLAT WHERE THE BIRD WALKS, and that is a physics fact rather than a style choice. groundHeightAt
  reads COLLIDERS and returns zero everywhere else, so a terrain with a real gradient would have the
  bird walking above the snow or under it. The country rises outside the play clamp the way the
  carpark does, and the fall line is told by the corduroy, the tow and the drifts.
- THREE OWNERS, NOT THREE GUARDS - TODO 58 applied one layer up, three times:
  THE CAST was a live throw and the sharpest of the three. startGame pushed four humans by hand with
  carpark coordinates in them, and read G.ladder - set only by buildHut - with NO guard. A fresh load
  into a map without a hut died before the run started, in every mode. It never showed in a battery
  because an earlier carpark boot always left G.ladder lying about, which is exactly why the section
  deletes it and proves both halves: the carpark cast in a hutless map still dies for want of a
  ladder, and the ski field boots with no ladder in the world at all. The cast is declared beside the
  builder now; the ski field declares NOBODY, on purpose, until 40.
  THE NEST SITE was a G default that only looked like a constant. buildNest is called off G.nestPos,
  so the day the ski field set its own, the next carpark build would have put the carpark nest up the
  mountain. Both maps declare their own; the carpark value is the one it has always had.
  THE SNOW ENVELOPE is now the only parameter of the unbury verdict. SNOWFIELD is the band the
  CARPARK draws patches from; up here it is snow edge to edge. What counts as a structure and where a
  blocked disc slides to is unchanged law on every map.
- AND A FOURTH THAT A SOAK TEST FOUND, NOT THE BRIEF: THE ROAD. spawnTraffic had the carpark lane
  numbers written into it and updateTraffic runs whenever a run does, so thirty seconds up the
  mountain put SEVEN HATCHBACKS across the snow at z 34, driving through a road that is not there.
  The lanes are a biome declaration now, and a map with no road gets no traffic. Found by running
  1800 frames in both modes and printing what was on the board - which is a test no assertion in the
  file would have thought to write.
- ONE GUARD WENT BACK OUT AGAIN for the reason piece 25 documented. The first version also returned
  early from updateTraffic, and no sabotage could break it: spawnTraffic refuses a roadless map
  anyway, so the condition was a strict subset that could never change an answer. One place, one
  truth, and a test that can reach it.
- SNOW JOINED THE WORLD REGISTRIES, the last thing a build put on the board that the dispatcher never
  took back off. Invisible under node, where the carpark patches are not built at all, and two maps
  worth of drifts in the browser. Same shape as hints in 58.
- THE DRIFTS ARE INSPECTABLE, unlike the carpark patches, which live inside a !HEADLESS branch and
  can only be trusted by looking at them. Records are built headless, meshes are not, and every
  drift says what it was AIMED at - which is not decoration: two of the candidate coordinates
  collide, and without the tag the only way to tell a tower drift from a gable one is to re-derive
  the builder arithmetic in the test. Sixteen drifts, none buried, ten still banked against a
  building having slid one ladder step, and the six at the tower feet never moved at all because
  SNOWBULK says a pole is banked against and not slid off.
- ELEVEN SABOTAGES, ALL CAUGHT, no stack traces and not one zero-finding result: the borrowed cast
  (4 findings), the nest global (2), snowSpot dropping the envelope (4), unresolved drifts (2), snow
  out of the registries (4), the snowline sign flipped (2), a ski claiming s_ski (1), the anchor
  looking elsewhere (1), the wheel left off the hill (1), every map inheriting the road (4), and the
  spawner not asking which map it is in (3). Law 14 held: the one sabotage that produced a throw
  reported it as an assertion message rather than dying.
- A PROP NAME IS A DETECTOR IN THIS ENGINE, which is why the ski boot is called a SKI BOOT. Anything
  named boot scores the carpark ONE BOOT, NEVER RECOVERED bonus the moment it is carried 22 units
  from home, and two of them complete b_boot2. Nothing up here carries a mission id at all.
- THE BATTERY SECTIONS THAT HAD TO CHANGE, and why none of it is a weakened assertion: three
  sections had encoded THERE IS ONE MAP. The chassis asserted exactly one biome (now two, and every
  registered map is held to having a pin on the brochure) and used skifield as its unregistered id,
  which would have quietly become a test that booting the ski field lands in the ski field. The tour
  section moved its unbuilt-pin questions one pin along the paper - and its finally deleted TABLE[1]
  by index, which as of this piece would have DELETED THE REAL SKI FIELD out of the registry for
  every section after it. The travel section registered a skifield stub over the top of the real one;
  it drives into the real map now.
- CAPTURE: full pass, 30 shots. 25 compared, 0 FLAGGED, worst 0.9826 (17, which session 10 left
  deliberately un-repinned). boxdiff reports the same two known subjects it did last night - 07 at
  0.9580 (TODO 60, yours to judge) and 17 at 0.6389 - and skips the three new vantages as having no
  pinned pair. NOTHING RE-PINNED, and the three new vantages are FIRST PINS LEFT FLAGGED per the
  brief.
- THE RIG SHOOTS A NAMED MAP PER SHOT now, one seeded temp copy per biome. BIOME is still the
  default, so every existing baseline is a carpark baseline shot exactly as before.
- PRESENCE CHECKS: three new vantages, five new tests, all measured. ABSENT MEANS TWO THINGS and both
  are reproducible from a note in subjects.mjs - a bird floor against the same frame with the bird
  parked in the far corner, a diorama floor against the same CAMERA in the carpark, which is the map
  that has no lodge and no bull wheel. The bull wheel scores 3342 against 440, the lodge wall 15858
  against 5, and the three birds 55, 27 and 70 against 0, 1 and 0.
- AND 30 GETS NO DIORAMA TEST, WHICH IS A MEASURED FINDING RATHER THAN A GAP. The groomed band is the
  subject of that photograph and a colour classifier cannot see it: the ridge window scores 711
  inside the piste box on 30 and 9755 on the plain SHADED SNOW of 29, where there is no piste at all.
  Corduroy reads as geometry, not as colour.
- TWO THINGS THE FIRST FRAMES CAUGHT, both fixed before the pass: the ski racks stood ON the deck
  footprint, so the skis came up through the boards, and the bird pinned on the deck FLOOR sat behind
  its own railing at that distance. Racks moved downhill of the deck; the bird stands on the near
  trestle table, which is where a kea would be anyway.
- WHAT IS STILL A LIE UP THERE, and it is 40 and not this piece: defineMissions is biome-blind, so
  the ski field shows the CARPARK to-do list. That is the same class as TODO 55 and it is the reason
  40 should be next. One of those missions - s_lift, perch the spinning tow wheel - is answerable
  here, because this map has a tow wheel, which is a preview of the graduation rather than a bug.
- FOUND, NOT FIXED: a build leaves its single-object handles on the board. Filed as TODO 62 with the
  evidence - the wheel sabotage reported the CARPARK wheel coordinates from inside the ski field,
  because G.towWheel, G.ladder, G.signG, G.uteG, G.paddle and G.snowCap are not registries and the
  dispatcher clears none of them.
- EYEBALL: gauntlet/capture/28_skifield_base.png, 29_lodge_deck.png, 30_groomed_band.png - three
  first pins, nothing pinned, all yours. Also worth doing rather than looking at: press M in a run
  with six stars and click GO on the ski field.

### PIECE 40 — skifield-missions — CERTIFIED 1ba30ea41fe5df6e624f3919ad4cfad9
Verdict: green. THE LIE 39 LEFT STANDING IS GONE: the ski field had the CARPARK to-do list on it, and
now it has its own. Eight jobs and a finale on two pages, every one of them answerable by the diorama
39 built - no cast, no new verb, nothing that needs a human to walk into shot.
- TAB SHOWS THE PAGE, and that is a browser fact rather than a claim: journey.mjs opens the list
  after the arrival and reads THE ROPE TOW with three empty stars, its four rows, the second page
  hidden as ??? and the finale as ???. renderTodo returns immediately under HEADLESS, so the list a
  player actually reads had no headless proof available to it at all.
- THE LIST: page one THE ROPE TOW - redistribute all three poles, perch the spinning bull wheel,
  supervise the tow from the roof of its own engine shed, leave somebody ski out on the groomed band.
  Page two THE DAY LODGE - take the goggles and wear them, stand on the lodge roof, lose one ski boot
  thoroughly, furnish the nest with three pieces of other people kit. Two-bird runs get a coop row -
  BOTH beaks on the lodge roof at once, which one bird cannot do, and the assertion says so. Finale:
  THE SUMMIT, perch the top station.
- THREE THINGS IN THE ENGINE HAD THE CARPARK WRITTEN INTO THEM, and each was a throw or a dead end
  rather than a matter of taste:
  missionDone unlocked the mission whose id is literally apex and set a property on it WITH NO GUARD,
    in the one code path a player reaches once - so the first map to declare a list without an apex
    would have thrown on finishing its last job. Every reader goes through the finale FLAG now.
  checkFinale WAS the carpark sentence in engine code - four humans in pursuit, then home to the nest
    - which a map with nobody on it can never satisfy. arm() and check() are declared with the
    mission; a finale with no arm() is live the moment the list closes, which is the honest reading
    for a map where nothing has to happen first. The carpark finale reads exactly as it always did,
    now written down where it belongs.
  checkMisc was a run of carpark detectors behind a carpark guard, so a second map could not add one
    without editing carpark code. A mission may carry check(), called for as long as it is unlocked
    and undone. The four ski field jobs that are about PLACE use it.
- AND THE PROOF THAT MATTERS MOST IS THE NEGATIVE ONE: no mission id appears on both maps, asserted
  against the carpark list itself rather than against ids typed into a test, and every mission id on
  every ski field PROP is held to being one this map declares. That last one replaced 39 assertion
  that no prop claimed anything - the claim got stronger rather than weaker.
- STARS LAND ON THIS MAP PAGES, which is the collision the save slots were built for and which could
  only be tested with two maps sharing one page list until tonight. The skifield slot lists THE ROPE
  TOW and THE DAY LODGE and keys its stars by them; the carpark slot is not written at all by a run
  that never went there; and the brochure reads the ski field denominator - 6 - off its own page count.
- ELEVEN SABOTAGES, ALL CAUGHT, and one of them found my own broken sabotage first: an undefined||
  edit that was a no-op rather than a change, which reported zero findings and was NOT the test being
  thin. Replaced with a real one - free:true on the summit hint - which the gate caught immediately.
  The carpark list handed to the ski field lands 28 findings.
- THE HINTS ARE THE PIECE 55 GATE EARNING ITS KEEP. Four hints on the hill, one per job that is about
  a place rather than a thing lying there, and the SUMMIT hint says nothing at all until the finale
  unlocks - so the end of the map is not spoiled by walking past it. Driven: silent at the top
  station while locked, speaking the moment the list is done.
- A FINDING THAT WAS MY OWN TEST, worth the line because it is FLAKES law 1 with the save on top: the
  hint block booted a map whose save had just been written FINISHED, so every job hydrated as done
  and every hint went quiet. The gate was working perfectly. The wipe is now part of the block and
  the hydration is an assertion.
- A PLAIN X.boot() DOES NOT GO HOME. buildWorld falls back to G.biome before the default, so the
  finally of a section that ends on the mountain has to NAME the carpark or every section after it
  runs up there. Cost one finding; written into the section.
- CAPTURE: 25 compared, 0 flagged. 28 RE-STAGED because of this piece: the bird was pinned on the
  engine shed roof, which now PAYS, so it completed a mission during the settle and the tick popup
  sat across the top of the photograph - a live thing whose presence depends on how many frames the
  settle got through, which is what law 12 forbids. It stands at the rack instead, which reads bigger
  and carries its own GRAB SKI GOGGLES prompt. Presence floor re-measured: 142 kea pixels against 0.
- AND TWO OF THE THREE NEW FRAMES NOW TEACH. 28 carries the wheel hint and 30 carries the ski hint,
  both deterministic because the bird is pinned inside the radius every frame.
- EYEBALL: gauntlet/capture/28_skifield_base.png and 30_groomed_band.png (both changed, both still
  first pins, nothing pinned), and gauntlet/capture/probe_todo_skifield.png - the to-do list on the
  mountain, which is the whole piece in one picture.

### PIECE 62 — build-handles-swept — CERTIFIED 789c9056e7c0e0d96007888e4aa22389
Verdict: green. The last thing a build put on the board that the dispatcher never took back off it -
filed by piece 39 the same night, fixed here, and the only reason it is worth its own commit is the
reader audit rather than the sweep.
- WORLDREGS covered every LIST a build fills. It did not cover the HANDLES - one object per thing a
  map has exactly one of - so after a carpark boot all twenty-one of them still pointed at meshes in
  a scene that had already been thrown away.
- THE TRANSCRIPT THAT FOUND IT, kept in the section because it is better than any description: with
  G.towWheel=wheel deleted from the ski field builder, the battery reported the wheel at -37.9,-40
  FROM INSIDE THE SKI FIELD. The carpark one, still spun by update every frame, and still able to
  answer a proximity detector at coordinates in a country that was not loaded.
- AND IT IS HOW THE CAST BUG HID FOR TWO SESSIONS: a stale G.ladder made a hutless boot look
  perfectly safe in every battery, because Dave found the LAST map ladder and climbed that.
- THE AUDIT IS HALF THE PIECE, and it is the half that decided the shape. Every handle was read
  reader by reader BEFORE the sweep was written: fire, pen, vanTop, towWheel, uteG, grassSh,
  chimneyRef and the two per-frame snowCap reads are already behind truthiness guards, and every
  other reader lives inside an interactable that its own builder registered - which a map without
  that builder never has. So the sweep needed NO new guards, and the soak is what proves that claim
  rather than my reading of it: thirty seconds of a solo run plus fifteen of a two-bird run with a
  match on it, on bare ground with no fire, no bin, no ute, no hut and no cast, night driver going
  and the traffic timer wound to zero. Nothing throws.
- THREE CLASSES, THREE TREATMENTS, and the exceptions are asserted so they are decisions rather than
  oversights: handles go to NULL (21 of them), the three data lists are EMPTIED rather than nulled so
  anything counting them reads nothing instead of throwing, and six latches go back to their own
  defaults - nestY, gymOut, the three paddle flags and _qtDone.
- G.nestPos IS DELIBERATELY NOT SWEPT, and the sabotage that adds it lands five findings including a
  throw: the finale and the bank check read it every frame with no guard BY DESIGN, and every map
  declares one, so nulling it trades a stale value for a crash. The stash counters are left alone
  too - they count what the player has done, not what a build put out.
- TWO STALE THINGS THIS QUIETLY FIXED that nobody had filed. G._qtDone latches the cleared picnic
  table, so once q_table was done in a process, a rebuilt carpark could never pay for it again; and
  G.gymOut kept the kea gym deployed, so the ranger would never put a fresh decoy out in the next
  map while the old one sat in a discarded scene.
- FIVE SABOTAGES: four caught by findings, and the fifth - running the sweep AFTER the build instead
  of before it - caught by the GATE rather than by an assertion, because it kills the game outright.
  Trace attributed rather than shrugged at, per law 14: castCarpark reading G.ladder.x at the first
  startGame in the file, which is game code dying and not a fuse in a test. TODO 46 is why that is
  a red gate instead of a pass.
- CAPTURE: 25 compared, 0 flagged. No frame could move - the sweep draws no randoms and the carpark
  refills every handle it had - and it is asserted rather than assumed: coming back rebuilds exactly
  the handles it had, by name.

### PIECE 63 — props-rest-on-rails — CERTIFIED b541758aae2631001ea2a397106fbffc
Verdict: green. OPPORTUNITIES Tier 3 item 2, which says in as many words that it bit that pass
TWICE: props rest where placed, no rail or rack or line holds anything.
- MEASURED BEFORE THE FIX: twelve of the carpark twenty-two props were on the ground inside three
  seconds. Two skis and two poles off the ski rack, both walking poles off the boot rail, ALL THREE
  CLOTHES PEGS off the line, plus the goggles, the sock and the beanie. The pegs are the sharpest -
  the row says steal all three clothes PEGS and every one of them was lying in the dirt - and the
  poles were the funniest: placed upright at 0.7 with a 1.15 shaft, they fell to 0.08 and spent every
  frame of every session half sunk in the ground.
- THE ANSWER WAS ALREADY IN THE PHYSICS, which is why this is a collider pass and not a new rule. A
  prop falls until groundHeightAt gives it something to stand on, and it has consulted the colliders
  since the day it was written: the sandwich has rested on the picnic table for weeks because that
  table HAS a collider. The rails did not. railTop declares the top of a thing you can rest something
  on - never solid, because a rail is perched and walked over rather than bumped into - and the props
  that sit on one are placed AT their resting height, so nothing pops upward on the first frame.
- SIX SURFACES: the carpark ski rack, the trailhead boot rail, the clothesline, and the ski field
  three racks, plus the two deck tables so the bird in vantage 29 is standing on something real
  rather than being pinned in the air.
- THE SKI FIELD RACKS ARE ROTATED, and the first version of this piece got it wrong in the most
  instructive way: the gear was placed in WORLD coordinates guessed off the rack position, which put
  every ski 0.6 metres in FRONT of a rotated rail - so the new collider held nothing and all twelve
  props were in the snow exactly as before. The gear is placed in each rack own frame now, with the
  same arithmetic the rack is drawn with, and the collider carries the rack yaw.
- A REGRESSION I CAUSED, FOUND BY SOMEBODY ELSE TEST, AND MEASURED RATHER THAN GUESSED. Raising the
  skis onto the rack broke s_binding and the whole piece-18 fix-verb section: interact() measures
  from the beak - y plus 0.4 - so a ski at rack height sat 0.395 from the beak against the CHEW THE
  BINDING tear at 0.410, and holding the key at the binding picked up a ski. Half a ski width each
  way and the tear is nearest again. The sabotage that puts them back lands 18 findings.
- AND A CONFLATED ASSERTION IN THE SNOW SECTION, which had to get MORE precise rather than more
  forgiving. It said: a disc centred on any slender upright in the band stays put. True of the only
  slender uprights the band had - tree trunks in the open - and quietly assuming no other kind could
  exist. Two of the three new rails stand within arm reach of a building (the ski rack rail is 1.9m
  off the tow shed), so a disc centred there slides, and it SHOULD. The claim is split into the two
  things it was conflating: a slender upright in the open holds its ground, and one beside a building
  slides because of the BUILDING.
- PLUS A BOUND READ OFF THE ENGINE AT LAST (law 10, third time tonight): that section filtered the
  band with hand-picked constants -53 and -17, generous around SNOWFIELD, and generous was wrong the
  moment a slender upright landed at z -17 - the clothesline sits INSIDE that window and OUTSIDE the
  real envelope, so a disc centred on it starts off-map, slides 3.2 to get on-map, and read as a
  trunk that failed to hold. The window is X.SNOWFIELD now.
- SIX SABOTAGES, all caught: no rack collider (3 findings), no line collider (2), a SOLID rail (4,
  including the bird being shoved sideways), a rail declared too thin for what it holds (2), the ski
  field racks losing their yaw (2), and the skis crowding the binding again (18).
- AND MY OWN FINDER WAS THE LAW-14 SHAPE IN ITS OTHER FORM: the rail was found with
  find(...&&!c.solid), so the solid-rail sabotage returned nothing, the guard skipped every
  behavioural assertion, and the finding read as a missing collider rather than as a wall in the
  middle of the ski corner. It is found by WHERE IT IS now, and the same sabotage lands four.
- FOUND, NOT FIXED: THE BEANIE. It is placed at head height on the sleeping tramper and a person is
  not a surface, so it falls into the dirt beside him while the row says steal the beanie off the
  sleeping tramper HEAD. Excluded by name in the assertion with the reason written next to it, and
  filed as TODO 64 - a prop that RIDES a thing that moves is a different mechanic from one that rests
  on a thing that does not, and it wants a design answer rather than a collider.
- CAPTURE: 25 compared, 0 flagged. 10_skifield came back 0.9909 - the skis and poles now standing in
  the rack rather than lying in the tussock - which is under the 0.965 threshold and would therefore
  have sat in the set as a permanent 1% drift, which is the FLAKES law 12 trap. RE-PINNED, because it
  is exactly the intentional change this piece is: eyeball it and revert the pin if you disagree.
  11_trailhead moved 0.0004 and was left alone.
- EYEBALL: gauntlet/capture/10_skifield.png (RE-PINNED - the skis are in the rack) and
  gauntlet/capture/29_lodge_deck.png (three skis standing in the near rack, first pin, unpinned).

### PIECE 65 — peak-chaos-is-alive — CERTIFIED 9dfe7f3d147d65b4dc639df8775ab575
Verdict: green. TODO 35, the half of it that needed no judgement - and it turned out to be worth more
than the half that does.
- ONE LINE IN update READ G.chaos, which nothing in the file has ever assigned. The meter is G.score
  and the HUD says so out loud: it renders CHAOS plus G.score. So (undefined||0) > (peak||0) was
  0 > 0 on every frame of every run since the line was written.
- WHICH MEANS EVERY PLAYER HAS ALWAYS BEEN SHOWN PEAK 0, in three places: the to-do footer (the
  journey instrument printed 0/8 PEAK 0 0:00 on the mountain tonight and I read straight past it),
  the win screen, and the save blob that carries the number between maps. Not modesty - a dead read.
- SESSION 5 FOUND THE READ AND DID NOT KNOW THE COST. TODO 35 describes the night auto-driver clause
  and treats the peak line as the same item; it is not. The night clause is a FEEL change on two
  pinned vantages and a playtest call. The peak is a statistic that has never once been right.
- THE NIGHT CLAUSE IS UNTOUCHED, and the last assertion in the section PINS today behaviour: a quiet
  five thousand chaos still does not bring the night on, and WANTED 3 still does. That line goes red
  the day somebody takes TODO 35 option (a), which is the point of writing it.
- IT IS A PEAK, NOT A MIRROR, and that is asserted both ways: the meter can fall - the fix verb pays
  less every cycle - and the high-water mark does not follow it down.
- AND IT IS A CAREER NUMBER, so it lives at the TOP of the blob rather than in a map slot, which is
  the piece 37 schema rule. This is the first number that has ever been able to test that rule: the
  sabotage that writes it into the carpark slot lands three findings.
- FOUR SABOTAGES, all caught, including the tripwire one.
- CAPTURE: 25 compared, 0 flagged. The two places a player reads the peak are DOM strings and
  renderTodo returns immediately under HEADLESS, so no pinned frame could move.

### PIECE 66 — the-footer-is-a-clock — CERTIFIED 8232590523658dfc3f5a1fe59a916de0
Verdict: green. The other half of piece 65 rather than a new complaint, and I only saw it because the
journey instrument printed the footer at me twice tonight and I read straight past it both times.
- THE THREE LIVE NUMBERS A PLAYER CHECKS - jobs done, career peak, time at it - were built INSIDE
  renderTodo, which runs on a mission event and at no other time. So the footer was a snapshot of
  whenever the last row was ticked: open the list two minutes into a run and it read 0:00.
- AND PIECE 65 WOULD HAVE MADE IT WORSE. With the peak finally alive, the footer would have sat
  showing PEAK 0 next to a meter reading four hundred, which is a louder lie than the dead read was.
- ONE FUNCTION, TWO CALL SITES. todoFoot() builds the line; renderTodo writes it when it rebuilds the
  list, and the HUD frame rewrites that ONE element - only while the panel is open, and only when the
  string has actually changed, because the list is a full-height panel and rebuilding it every frame
  for three numbers is a layout thrash.
- THE STRING IS THE ASSERTABLE PART AND THE DOM IS NOT, which is the shape piece 5 and the versus HUD
  both use: the render is browser-only, the decision is not. Nine assertions on the line, and the one
  that matters is that all three numbers move with NO MISSION EVENT AT ALL.
- BROWSER PROOF in journey.mjs, on the mountain, reading the same element twice with nothing ticked
  in between: "0/8 PEAK 0 0:00" -> "0/8 PEAK 240 0:01".
- FOUR SABOTAGES, all caught. And the combo bit me for the third time in this file history: award
  multiplies by G.combo, so a 240 landed 960 and my first assertion compared the footer against a
  number I had typed. It reads the meter now, which is the claim anyway.
- CAPTURE: 25 compared, 0 flagged. QUIET hides the to-do panel, and the frame guard needs it open.

## SESSION END — 2026-09-02, session 11, six pieces and the tour is reachable
Stop condition on the 6-piece rule. Tip 8232590523658dfc3f5a1fe59a916de0, gate CERTIFIED-SHIP, 25
pinned vantages 0 flagged, three new vantages shot AND MEASURED and deliberately unpinned, working
tree clean, SESSION.lock released.
    39 skifield-biome          aff1fa389a8e8ed138299474e77dc028
    40 skifield-missions       1ba30ea41fe5df6e624f3919ad4cfad9
    62 build-handles-swept     789c9056e7c0e0d96007888e4aa22389
    63 props-rest-on-rails     b541758aae2631001ea2a397106fbffc
    65 peak-chaos-is-alive     9dfe7f3d147d65b4dc639df8775ab575
    66 the-footer-is-a-clock   8232590523658dfc3f5a1fe59a916de0
- ERIC ORDER WAS 39 FIRST, ADDITIVE ONLY, NO GRADUATION, THEN THE NUMBERED QUEUE, and that is exactly
  what happened. 41-44 are gated on the judged graduation and were not touched; 56 is blocked art; 60
  is a judgement; 61 was excluded by name. So the queue after 40 was 62 (filed by 39 the same night),
  then OPPORTUNITIES Tier 3 item 2 as 63, then the two halves of TODO 35 as 65 and 66.
- THE HEADLINE IS THAT A PLAYER CAN GO THERE. M, six stars, GO, and the flyover lands you on a club
  field whose to-do list is about a mountain. 37 and 38 were unreachable for two sessions.
- THE SAME BUG FOUR LAYERS DEEP, and every layer hid the one below it: the cast (a live throw on
  G.ladder), the nest site, the snow envelope, the road (seven hatchbacks across the snow, found by a
  soak test and not by a brief), and underneath all of them TODO 62 - twenty-one build handles left
  pointing at a discarded scene, which is WHY the ladder throw looked safe in every battery for two
  sessions. Dave found the last map ladder and climbed that.
- THE BATTERY ITSELF HAD THREE SECTIONS THAT ENCODED THERE IS ONE MAP, and the tour one was dangerous:
  its finally deleted TABLE[1] by index, which as of piece 39 would have deleted the real ski field
  out of the registry for every section after it. Nobody weakened an assertion tonight; three of them
  got MORE precise, and two of those were law 10 - a bound read off the engine instead of off the
  number one world happened to produce.
- THIRTY-SIX SABOTAGES, ALL CAUGHT, and two were my own broken sabotages: a no-op edit that returned
  zero findings (law 14 met from the other side - the tell is real in both directions), and a finder
  written as find(...&&!c.solid), which let the property under test decide whether the assertion ran.
- WHAT IT COST: piece 63 raised the skis onto the rack and broke s_binding and the whole of piece 18
  fix-verb section, because interact() measures from the beak and a ski at rack height sat 0.395 away
  against the tear at 0.410. Somebody else test found my regression. Every prop placed on a surface
  joins that nearest-thing race, and that is worth remembering before the next collider pass.
- WHAT THE NEXT SHIFT SHOULD READ FIRST: REPORT.md and the three decisions in it, then TODO 40b (the
  tray-slide is the signature act of the map and the feel is Eric), then FLAKES 14 before writing a
  single assertion.

## SESSION 12 — 2026-09-02, overnight, the numbered queue
Started clean at 8232590523658dfc3f5a1fe59a916de0, gate CERTIFIED-SHIP, no lock held. Eligible queue
after session 11: 30, 31, 32, 33, 61, plus the judged ones (39b, 40b, 60, 64) and blocked art (56).
Took 31 first because 30 and 33 both say in their own briefs that they need its instrument to decide
what they cover, and 32 is a look-to-judge sweep on every frame it touches.

### PIECE 31 — changed-pixel-tripwire — harness-side, game md5 8232590523658dfc3f5a1fe59a916de0
Verdict: green. gauntlet/verify/pxdiff.mjs and pxdiff-selftest.mjs. TODO 67 and 68 filed off its
first run.
- FOUR INSTRUMENTS IN THIS DIRECTORY AND ALL FOUR WERE SSIM, so all four shared one blind spot. The
  new one is a count, in pixels, with the amplitude beside it and an optional 16x9 density map that
  costs one extra ffmpeg call rather than 144 crops - the mask is area-scaled and read back raw.
- THE PROOF IS THE PAIR THE BRIEF NAMED, REBUILT RATHER THAN RECOVERED. The brief said the piece-9
  before/after was a ready-made test case sitting in the repo; it is not any more, because 59a8493
  re-pinned the baselines on the smooth hulls. But the AFTER being pinned is exactly what makes the
  BEFORE cheap: computeVertexNormals on non-indexed ExtrudeGeometry puts the flat facets back, which
  is the same fact the piece-9 battery was built on. It reads ssim 0.9868 against a 0.965 gate and
  12660 changed pixels against a band of 1650, and 0.9868 is the number the brief recorded for that
  pair eleven builds ago from the other direction.
- SHOT THROUGH A COPY OF capture.mjs, NOT A SWITCH INSIDE IT. gate-selftest.sh already established
  the idiom and wrote the reason next to it: the production instrument keeps no override for anybody
  to narrow it with by accident. The copy has to live in the repo, though - ESM resolves node_modules
  from the file location, so a copy in /tmp cannot import puppeteer.
- THREE SWEEPS WOULD HAVE LIED, AND MY OWN SELFTEST CAUGHT IT. I had a per-vantage table built from
  three full sweeps and was about to commit it. Then the selftest control - an untouched frame shot
  through the same rig - came back 3909 px on 18_rear_close, whose three-sweep ceiling was 825, twice
  in eight runs. Re-measured over the ten pairwise distances of FIVE sweeps: 07_jam 20 -> 1881,
  10_skifield 3 -> 1152, 19_roof_follow 890 -> 4168, 13_idle_preen 2922 -> 6932. The states are
  discrete but there are more than three of them, so a ceiling from three samples is a floor.
- THE CHURN IS NOT NOISE, IT IS A HANDFUL OF DISCRETE STATES, and that is why a ceiling means
  anything at all. 01_carpark_wide: run1-run2 3993, run1-run3 3993, run2-run3 0 - two of the three
  captures are bit-identical and the third is a different photograph. 14_player_view 1611/1611/0.
  21_night_camp 2379/2379/0. And 08_readability_320 churns 1477 px tonight, which is the same 1477
  session 6 recorded for it. The settle lands on one of a few frame counts, and each count is exact.
- THE COUNT IS A STEP FUNCTION AND I ALMOST READ IT AS A DISTANCE. 29_lodge_deck sits 129 px from
  its baseline on four sweeps and 1452 on the fifth, while its worst churn PAIR is 229 - which is
  impossible for a metric and fine for a threshold: a wide area of that frame sits within a grey
  level of the window, so one small move flips thirteen hundred pixels across the boundary together.
  Written into the file header, because the next person will hit it too.
- TWO OF MY OWN ASSERTIONS WERE FLAKES AND BOTH ARE NOW STATED DIFFERENTLY. (a) I asserted the
  re-shade pair PASSES the 0.965 diff threshold. It reads 0.9868, 0.9863, 0.9863 - and 0.9580 on one
  run in six, because the BEFORE shot carries the vantage own churn on top of the re-shade and the
  pair straddles the bar. The claim does not need that side of it: SSIM barely registering a change
  of this size is the complaint, so that is what it asserts. (b) I asked for the re-shade to be four
  times the control and it went red twice in eight runs, because the denominator churns. A ratio
  against a moving denominator is not a bound. It is a DIFFERENCE now, with both distributions
  written down: the re-shade contribution is 11904/12651/12659/12660/12664 - stable to a fifth of a
  percent, because it is the same hulls every time - and the control tops out under 4000.
- AND THE FIRST VERSION HAD TWO ASSERTIONS THAT PASSED ON THE NULL FIXTURE, which is FLAKES 14 from
  its other side. The no-op sabotage left "the worst pixel moved 43 levels" and "8 of 144 cells are
  warm" green, because ordinary churn on that vantage moves 49 levels and warms 12 cells. Measured,
  the re-shade peaks LOWER than the churn does. Amplitude does not discriminate here at all; the
  count and the spread do, and both are now asserted against a control shot through the same copy.
- THREE SABOTAGES, all caught: a no-op BEFORE fixture (3 findings), 18 band widened to 99999 (1),
  and pxdelta with its geq threshold replaced by a constant (3, including the identity fixture).
- CAPTURE: 28 compared by diff.mjs, 0 flagged, worst 0.9823. pxdiff on the same set: 5 over band,
  5 over churn only. Nothing was re-pinned and the game file was not opened.
- WHAT IT FOUND ON ITS FIRST RUN, filed as TODO 68: six vantages sit above their own five-sweep churn
  ceiling on every one of five sweeps, so it is not churn. 07_jam and 17_flight were already known.
  09_colossal is the cleanest signal in the set - 1565..1584 px against a churn of 22, ssim 0.9992,
  seventy-one times its own churn - and session 6 measured that same pair at 0 px, so it moved after
  that. Plus 20_dead_rear, 11_trailhead and 23_paddock_gate.
- AND TODO 67, FOUND BY THE CELL MAP RATHER THAN BY A BRIEF: 13, 19 and 20 put their hottest cells in
  the same top-centre strip. Cropped, it is the DAWN. A CARPARK. NO WITNESSES YET. caption, which
  popup() builds as a div in #feed with a CSS animation on the WALL CLOCK. QUIET parks the humans
  every frame, kills the traffic, marks the casefiles seen and hides the to-do panel, and does not
  touch #feed - so every vantage shot inside POPLIFE of startGame is photographed over a caption
  mid-fade. Item 33 guessed accumulated simulation state; this is a fourth live thing and no amount
  of pinning the world settles it.
- EYEBALL: nothing moved, so there is nothing new to look at. The instrument is read, not seen.

### PIECE 33 — cross-run-churn — harness-side, game md5 8232590523658dfc3f5a1fe59a916de0
Verdict: green. gauntlet/verify/crossrun.mjs and crossrun-selftest.mjs. It corrected piece 31 an
hour after piece 31 shipped, which is the entry worth reading.
- THE THIRD QUESTION ABOUT A FRAME, and three instruments had asked the other two. diff: has it
  changed since it was pinned. stability: does it reshoot the same twice INSIDE one run, which is
  what law 12 says in as many words. boxdiff: did the subject move. Nobody asked whether it reshoots
  the same twice in a DIFFERENT PROCESS. Session 4 measured that by hand off a checkout and nothing
  has measured it since.
- THE BRIEF ASKED FOR A CONTRACT THAT CANNOT HOLD, and it took the measuring to see why. TODO 33
  says assert the count per frame is near zero. That would be red on nineteen of twenty-eight
  vantages, and red for something no assertion can fix: the settle lands on one of a handful of
  animation frame counts and each count is an exact photograph, so the distance between two runs is
  the distance between two STATES. Near zero is the goal of TODO 30 and 67, not a contract. What
  ships instead is: no vantage churns more than it is recorded as churning, with the ceilings kept in
  pxdiff.mjs - the file that has to read them - and a paste-ready table printed for recalibration.
- AND ITS FIRST REAL RUN KILLED FOUR OF PIECE 31 SIX FINDINGS. Five more sweeps on the same
  unchanged build, an hour later, and fourteen of twenty-eight vantages beat the five-sweep ceiling:
  09_colossal 22 -> 2233, 11_trailhead 673 -> 4446, 23_paddock_gate 117 -> 1252, 10_skifield
  1152 -> 5822. So the drift claims for 09, 20, 11 and 23 collapse - including 09, which had looked
  unanswerable at seventy-one times its own churn with session 6 measuring the same pair at 0 px.
  Only 07_jam and 17_flight survive ten sweeps, and both were already known. The pxdiff table, the
  pxdiff header and TODO 68 are corrected in this commit rather than left to be read wrong.
- WHICH MEANS MY OWN HEADLINE WAS WRONG BY ONE MEASUREMENT, and the lesson is the one piece 31
  already had written on it in smaller print: a ceiling from three samples is a floor, and so is a
  ceiling from five. The table now says that about itself.
- WHAT IS ACTUALLY ESTABLISHED IS BIGGER THAN WHAT IT COST. The pinned set is far less reproducible
  across processes than any instrument here has said: 06_skyline 8791 px of churn on one unchanged
  build, 13_idle_preen 6932, 10_skifield 5822, 20_dead_rear 5489. stability.mjs calls them clean
  because it compares takes inside a run. diff.mjs reads them at 0.998 and passes.
- ONE OUTLIER LEFT OUT ON PURPOSE: 18_rear_close returned 16317 px once in a real cross-run pair
  inside the selftest, against a distribution topping out at 3909 over thirty-odd pairs and 2563
  over fifteen more taken straight afterwards. Fitting the table to it would put the 18 band above
  the piece-9 re-shade and blind pxdiff on the one vantage it was proved with. Recorded as law 9,
  watched, not absorbed.
- THE SELFTEST DRIVES compare() OVER PREPARED DIRECTORIES, because the contract is about a frame that
  got LESS reproducible and waiting for the rig to go unstable by itself is not a test. Fixture 5
  still shoots for real, twice, on one vantage - a comparison function never handed a real pair
  proves nothing about the shooting path.
- THREE SABOTAGES, all caught: the first pair reported instead of the worst, only consecutive runs
  paired so run1-vs-run3 is never taken, and a hardcoded ceiling instead of the pxdiff table.
- AND TWO OF THEM WERE NO-OPS ON THE FIRST ATTEMPT, which is FLAKES 14 from its other side and the
  exact thing the session 11 log warned about. My sed anchor ended )}; and the file says )}); so
  nothing was edited; sabotage A "found" something only because an unrelated real flake fired in the
  same run, and sabotage C reported ALL PASS on an unmodified file. Both redone against an anchor
  asserted to exist first, which is the law for the game file and should have been the law here.
- CAPTURE: nothing re-pinned, nothing shot for the record. Ten sweeps went through /tmp and out.

### TODO 67 — park-the-feed — MEASURED, BUILT, PARKED (no piece, no commit to the rig)
Verdict: parked for judgement, per its own brief - measure first, leave flagged, do not pin. The
patch is gauntlet/parked/todo67-park-the-feed.patch and applies clean to capture.mjs.
- IT IS THE BIGGEST SINGLE SOURCE OF CROSS-RUN CHURN IN THE SET, and that is now measured rather
  than argued: five sweeps before, five after. Ten of twenty-eight vantages fall under 100 px of
  cross-run churn - 05_tussock_ground 2775 -> 0, 29_lodge_deck 229 -> 0, 30_groomed_band 1597 -> 0,
  03_kea_plate 3033 -> 13, 04 3086 -> 19, 21_night_camp 2399 -> 21, 25 2801 -> 27, 08 1480 -> 3,
  17_flight 1951 -> 95, 23 1252 -> 111 - out of a set whose worst was 8791.
- AND IT IS NOT SHIPPABLE WITHOUT ERIC, WHICH IS THE POINT OF STOPPING. Every deterministic choice
  costs about 2900 px on the pinned frames, because the caption is in essentially every baseline
  rather than the eleven I first guessed. There is no version of this that is free.
- I BUILT THE WRONG ONE FIRST AND THE INSTRUMENT CAUGHT IT. Freezing each popup at a fixed phase of
  its own animation keeps the stagger and looks right, and it needs the wrapper clone-replaced to
  survive its own pending remove() - which makes the caption PERMANENT and fully opaque in every
  frame. Measured: ~5700 px into all 28 vantages and 08_readability_320 down to ssim 0.8711 against
  a 0.965 threshold. A rig change that reds the diff on a vantage it was not aiming at is not a
  staging fix. Piece 31 is one session old and has already stopped me shipping something.
- THEN I TRIED TO BUY DETERMINISM FOR NOTHING and could not. Freezing at the late phase the
  baselines already caught keeps diff.mjs at 0 flagged, worst 0.9798 - but the frames still move
  ~2900 px each, because one fixed phase is not the distribution of phases 28 baselines were pinned
  at. That trial also wasted four capture runs to a sed that failed silently on a bracket and left
  FREEZE at its default for all four, so the sweep measured the same value four times. Read the
  echo, not the intention.
- THE EXCEPTION IS THE h._park SHAPE THIS FILE ALREADY USES. 09_colossal IS the popup fanout -
  CHAOS 10500 LV10 MAX over five staggered CAR: BUNTED rows - and it awards AFTER QUIET runs, so the
  patch has it set __keaFeedKeep and keep what it puts there. Eyeballed: the five rows survive.
- FILED ON THE WAY PAST: TODO 69, from an A/B run to check whether this had made 20_dead_rear worse.
  It had not - 4688 px of churn without the change, 974 and 964 on two batches with it - but 20 sets
  G.cams[0].position ONCE with no camLock and no PIN, which is the one law-12 case whose text names
  the follow cam by name. Its samples spread continuously from 968 to 4688 rather than sitting in
  discrete states, which is what an easing camera looks like.
- EYEBALL, if you want to judge it before applying: the caption is the top-centre strip of any
  pinned frame - gauntlet/capture/baseline/20_dead_rear.png is the clearest.

### PIECE 61 — subject-boxes-03-13-18 — harness-side, game md5 8232590523658dfc3f5a1fe59a916de0
Verdict: green for three of the four; the fourth is blocked on TODO 69 and the probe is what proved
it. Coverage goes from 8 subjects to 11.
- BOXES BY EYE, per the brief and the boxdiff header, which records both automated attempts as
  worthless and says reading them off the frame is ten minutes and correct. It was.
- ABSENT MEASURED THE SKI-FIELD WAY: a copy of capture.mjs that parks the bird at (-49,-49) every
  frame AFTER the stage line, so a vantage that aims its camera off the bird has already aimed it.
  03 2464 kea px present against 3 away, 13 1424 against 5, 18 1101 against 0. Floors 1600/900/700.
- PROVED BOTH WAYS BECAUSE THE BRIEF ASKED FOR BOTH. Unchanged reshoot in the box: 1.0000, 0.9992,
  0.9998. Subject re-posed from each vantage own stage line - 03 turned to ry 3.4, 13 to the far side
  of the preen cycle at t 2.2 side -1, 18 turned to ry 4.4 - and the box reads 0.7503, 0.7278, 0.5139
  against a 0.98 bar.
- AND HERE IS THE GAP IN ONE LINE: those same three re-posed frames read 0.9517, 0.9672 and 0.9621
  WHOLE. Two of the three pass diff.mjs 0.965 threshold with a completely different bird in them.
- 20_dead_rear IS BLOCKED, AND THE PROBE PROVED IT RATHER THAN GUESSING. Parking its bird moved the
  CAMERA with it - it assigns G.cams[0].position once and the follow cam eases off it - so the parked
  probe photographs the bird at (-49,-49) and scored 135 against 200 for the real thing. Then locking
  the camera to the position its own stage line COMPUTES gives a close-up nothing like the pinned
  wide frame, and scored 0 with the bird present. So the pinned 20 is the eased position and cannot
  be reproduced from its own stage line at all. No honest floor exists until TODO 69 is fixed, and a
  guessed one is worse than none, so it is written into subjects.mjs with the numbers and left out.
- CAPTURE: diff 28 compared 0 flagged, subjects 15 checked 0 missing, boxdiff 11 compared with only
  the two known ones (07 at 0.9580, 17 at 0.6358) flagged. Nothing re-pinned.

### TODO 30 — pin-G-time-set-wide — MEASURED, BUILT, PARKED (no piece, no commit to the rig)
Verdict: parked for judgement, per its own brief. The patch carries BOTH 30 and 67 because they want
ONE re-pin sweep between them: gauntlet/parked/todo30-and-67-deterministic-rig.patch.
- THE TARGET TODO 33 NAMED IS REACHED. Five sweeps with both patches in: nineteen of twenty-eight
  vantages under 100 px of cross-run churn and FOUR AT EXACTLY ZERO, from a set whose worst was
  8791. 19_roof_follow 4168 -> 0, 01_carpark_wide 3996 -> 11, 06_skyline 8791 -> 130, 11_trailhead
  4446 -> 7, 10_skifield 5822 -> 72, 13_idle_preen 6932 -> 229, 22_torch_beam 5308 -> 395. The full
  table is in TODO 30.
- THE GAME FILE ALREADY EXPECTED THE PIN, which is the nicest thing found tonight: the purse keys on
  G.frames rather than G.time and says why in a comment - "the photographer pins G.time in QUIET and
  a pinned clock would collapse every frame into one purse". Somebody wrote the defensive half a
  session before the pin existed.
- WHAT IS LEFT IS NAMED, not residual: 20_dead_rear 2114 (TODO 69, the easing camera), 09_colossal
  820 (its own popups, kept on purpose by the __keaFeedKeep exception), and 12_seal_midpeel 703,
  which is the only number tonight I cannot attribute.
- AND THE SESSION-3 NOTE UNDERSTATED THE COST. It said every frame moves slightly. Pinning the clock
  freezes POSES, not just the sway, because the idle animations are sines on G.time: diff.mjs goes to
  11 flagged, worst 13_idle_preen at 0.8467, then 14_player_view 0.8884 and 16_trish 0.9166.
  subjects.mjs still reads 15 checked 0 missing - every bird is still there, in a different phase of
  its idle - so this is a look call and a 28-frame re-pin, which is why it is parked and not shipped.
- 12.0 IS A FREE PARAMETER. Any value freezes the poses somewhere and 12.0 is only what the four
  existing local pins use. Worth a sweep before the re-pin if you want the set disturbed less.

### PIECE 32-AUDIT — bevel-flank-audit — harness-side, game md5 8232590523658dfc3f5a1fe59a916de0
Verdict: green. audits/2026-08-28/audit-bevel-flanks.js. TODO 32 asked a question before it asked
for a fix - is it caravan-only - and the answer is no. The FIX is untouched and still a judged sweep.
- DELIBERATELY NOT A GATE BATTERY. TODO 32 is unfixed, so an assertion here would be red by design,
  and a red battery that is MEANT to be red teaches the gate to lie. It prints and exits zero.
- NINE EXTRUDED BODIES CARRY DETAIL, and it walks the scene rather than a handle list - only the
  caravan door has a G handle - so the ski field buildings and the four parked cars are in the report
  as well, which no brief asked for.
- THE ASYMMETRY IS THE CONTROL AS MUCH AS THE FINDING: 161 buried thin faces, 88 on x, 52 on y and
  21 on the extrude axis z. If z came back as buried as x, the model - rbox(w,h,d,r) really measures
  (w+1.84r) x (h+1.84r) x d - would be wrong and this would be measuring something else.
- 52 PANELS PROVE THEIR OWN INTENT, and that section is the one to read. A panel standing PROUD of
  the skin on z and INSIDE it on x or y had ONE authored margin; it works on the exact axis and fails
  on the bevelled ones. No thinness window, no distance window, nothing to argue with.
- THE CARAVAN REPRODUCES THE BRIEF FROM THE OTHER DIRECTION: shell 2.952 x 2.652 x 5.600, skin 1.476,
  42 buried faces on x including 1.282, 1.278, 1.257, 1.245 - the window frame, pane, awning rail and
  trim the brief listed by nominal offset.
- THE HUT IS THE CLEAN WITNESS AND IT IS ONE OBJECT. rbox(7,2.6,5.4,0.1) really measures 7.184 wide;
  the five weatherboard lines are box(7.02,0.02,5.42), so their x faces sit at 3.510 against a skin
  of 3.592 - BURIED 0.082 - and their z faces at 2.710 against 2.700 - PROUD 0.010. One mesh, one
  +0.02 margin, visible on two walls of the hut and sealed inside the other two. Nobody has ever
  seen the grooves on the long walls.
- AND THE PANEL RULE WAS WRONG THE FIRST TIME, in a way that mattered: it required thinness on the
  axis UNDER TEST, which excluded the weatherboards, because 7.02 is not thin. The audit was blind to
  exactly the detail it exists for. A panel is thin on SOME axis, not on the one being asked about.
- PLUS A REAL BUG THE SIGNATURE SECTION EXPOSED AND THE HEURISTIC LIST HAD BEEN HIDING: comparing a
  left-wall trim against the RIGHT-hand skin, which is true and meaningless, and it put a burial of
  7.023 in my first output. The heuristic list was immune only because its 0.30 window threw those
  rows away. Every test picks the NEAR side now, off the sign of the offset from the shell centre.
- TWO SABOTAGES, both caught by the numbers: dropping the near-side rule loses 61 real cases
  (161 -> 100), and dropping the panel rule floods 30 non-panels in (161 -> 191).

### PIECE 70 — name-the-last-churn — investigation, no game change, no rig change
Verdict: the one number I could not attribute in the TODO 30 measurement now has a cause.
- WITH THE 30+67 PATCH APPLIED so only the residual was left, the set churns under 130 px everywhere
  except four vantages. 12_seal_midpeel at 704 is the clean case and IT IS THE WINGS.
- MY FIRST HYPOTHESIS WAS WRONG AND ONE PROBE KILLED IT. 12 sets the bird grounded=false with no PIN,
  so I expected a bird still falling through the settle. Measured at shutter: y 0, vy 0, grounded
  true, on all five takes, frame count 142 every time. Reading the state beat reasoning about the
  stage line, which is the whole lesson of the piece.
- WHAT DIFFERS IS THE WINGS: body, head and tail identical to five decimals, the four freed seal
  segments identical to four, the changed pixels one blob at x420..540 y360..420 which is the bird.
  Wing rz reads 0.45017, 0.45034, 0.47679 - and the third take shares the FIRST take flapPh, so it
  is not the flap phase. Wing rest is lerp(current, target, dt*k): it depends on the SEQUENCE of real
  dt values and on no clock that can be pinned.
- PROVED BY LETTING IT CONVERGE rather than by argument: settle 900ms -> 4000ms takes 12_seal_midpeel
  704 -> 106 and 13_idle_preen 89 -> 28.
- THE CLASS WAS ALREADY GUESSED AT IN SESSION 8, in the 08_readability_320 comment - dt-driven
  per-frame accumulation, fix is a deterministic frame clock. This is that guess, measured on two
  more vantages.

### PIECE 22 — name-the-torch-churn — investigation, no game change, no rig change
Verdict: it corrects the piece before it, one commit later. TODO 70 filed 22_torch_beam as NOT this
class on the strength of a single convergence test. It IS this class for the component that matters.
- THE TORCH IS INNOCENT, which is where the vantage name sends you first, and torch.g.rotation.y is
  itself a dt lerp (line 4017) so it was the obvious culprit. Probed across four takes: rotation.y 0
  every time, spot.intensity 2.6, beam opacity 0.13. The 22 PIN holds all three.
- IT IS REX LEFT ARM, line 4046, the same shape as the 12 wings. With G.time pinned the angry target
  is a constant -2.8957, and watched over ONE run the arm walks to it monotonically: -2.73089,
  -2.83549, -2.87691, -2.88915, -2.89364, -2.89543. At the 900ms shutter it has not arrived, and
  across takes it read -2.75284, -2.75286, -2.73091, -2.73060.
- THE LEGS ARE INNOCENT FOR A NICE REASON, and it is worth writing down because they are the obvious
  suspect. walkPh is a pure dt accumulator with nothing that can pin it - measured advancing 8.3165
  to 13.8659 in one run with everything else frozen - but sw is "moving ? 0.55 : 0" and a vantage
  that pins Rex in place makes moving false. legL and legR sit at exactly 0. A non-converging
  accumulator that nothing reads is not a flake.
- ABOUT 300 PX ARE STILL UNNAMED AND SAID TO BE. At a 4000ms settle the arm is converged and the legs
  are static and 22 still churns 297, so the irreducible part is neither. Likeliest is the spotlight
  shadow map on a night frame - a law 9 renderer cause rather than a staging one - and that is
  labelled a guess. Time-boxed under law 8 after six probes: a named unknown of known size beats the
  wrong name it had an hour earlier.

## SESSION END — 2026-09-02, session 12, six pieces and the rig can be made deterministic
Stop condition on the 6-piece rule. Tip 8232590523658dfc3f5a1fe59a916de0 - THE GAME FILE WAS NEVER
OPENED - gate CERTIFIED-SHIP, 28 pinned vantages 0 flagged, subjects 15 checked 0 missing, boxdiff 11
compared with only the two known ones flagged, three selftests ALL PASS, working tree clean,
SESSION.lock released. Nothing was re-pinned.
    31  changed-pixel-tripwire     pxdiff.mjs + selftest
    33  cross-run-churn            crossrun.mjs + selftest
    61  subject-boxes-03-13-18     coverage 8 -> 11 subjects
    32  bevel-flank-audit          audit-bevel-flanks.js
    70  name-the-last-churn        investigation
    22  name-the-torch-churn       investigation
Plus two commits that are not pieces: the MEASURE records for TODO 67 and TODO 30, each with a patch
in gauntlet/parked/ that applies clean.
- THE QUEUE WAS THE INSTRUMENTS, AND THEY TURNED OUT TO BE ONE PIECE OF WORK. 31 built a unit, 33
  built the sampler, and between them they answered 30, 67, 69, 70 and half of 32. Taking 31 first
  because 30 and 33 said in their own briefs that they needed it was the right read.
- THE HEADLINE FOR ERIC IS ONE PATCH AND ONE RE-PIN. Park the caption, pin the clock, and nineteen of
  twenty-eight vantages fall under 100 px of cross-run churn with FOUR AT EXACTLY ZERO, from a set
  whose worst was 8791. That is the target TODO 33 named in session 4 and nobody could measure until
  tonight. It costs 11 flagged frames and a look call, so it is parked, measured, and his.
- I SHIPPED A WRONG TABLE AND THE NEXT PIECE CAUGHT IT, WHICH IS THE MOST USEFUL HOUR OF THE NIGHT.
  Piece 31 filed four drift findings off five capture sweeps, including 09_colossal at seventy-one
  times its own churn with session 6 measuring that same pair at 0 px. Five more sweeps an hour later
  and 09 churned 2233 by itself; all four collapsed. Only 07_jam and 17_flight survive ten sweeps and
  both were already known. Corrected in the same commit that found it - table, header and TODO 68.
- THE LESSON UNDERNEATH IT: a ceiling from three samples is a floor, and so is a ceiling from five.
  Three sweeps said 07_jam churns 20 px; five said 1881; ten said 2865. The table now says that about
  itself rather than pretending to be a ceiling.
- FLAKES 14 FROM ITS OTHER SIDE, TWICE IN ONE PIECE, exactly as the session 11 log warned. Two of
  piece 33 sabotages were NO-OPS: my sed anchor ended )}; where the file says )}); so nothing was
  edited, and one of them reported ALL PASS on an unmodified file while the other "found" something
  only because an unrelated real flake fired in the same run. Assert the anchor exists first - it is
  the law for the game file and it should have been the law for my own tooling.
- AND THREE OF MY OWN ASSERTIONS WERE FLAKES, all found by running them, not by thinking about them:
  a claim that the re-shade PASSES the diff threshold (0.9868, 0.9863, 0.9863, then 0.9580 on one run
  in six); a ratio against a control whose denominator churns; and two assertions that passed on the
  NULL fixture because ordinary churn moves 49 levels and warms 12 cells. Amplitude does not
  discriminate a re-shade at all - measured, the re-shade peaks LOWER than the churn does.
- THE INSTRUMENT STOPPED ME SHIPPING SOMETHING ON ITS FIRST DAY. My first TODO 67 fix froze each
  popup at a fixed phase, which reads beautifully and requires clone-replacing the wrapper to survive
  its own pending remove() - making the caption PERMANENT and opaque in all 28 frames and dropping
  08_readability_320 to ssim 0.8711. pxdiff and diff caught it before it was committed.
- WHAT THE NEXT SHIFT SHOULD READ FIRST: REPORT.md and the two patches in gauntlet/parked/, then
  TODO 69 (20_dead_rear cannot be reproduced from its own stage line at all, which piece 61 proved
  while trying to measure a floor for it), then FLAKES 14 before writing a single assertion.
- I DID NOT RUN stability.mjs, and that is deliberate rather than an omission: crossrun.mjs shot ten
  full sweeps in separate processes tonight, which is strictly more than the take-to-take question
  stability.mjs asks, and the numbers are in TODO 30 and 68.

## SESSION 13 — 2026-09-03, overnight, the numbered queue
Started clean at 8232590523658dfc3f5a1fe59a916de0, gate CERTIFIED-SHIP, no lock held, SESSION.lock
taken. Eric order: the OVERNIGHT.md step-6 fix first and alone, then the numbered queue, and the
parked deterministic-rig patch is HIS - not to be applied tonight. Eligible queue after session 12:
69, then whatever a piece files. 30 and 67 are parked for daylight by name, 68 says in its own text
that the next move is not more measurement, 32 is a judged look sweep, and 39b, 40b, 56, 60 and 64
are judged or blocked art.

### PROCESS — step 6 runs boxdiff and pxdiff, not diff alone — no game change, no rig change
Verdict: green. The report has asked for this three sessions running (10, 11, 12) and every session
has run both instruments by hand instead. A session that follows OVERNIGHT.md literally runs only
diff.mjs, which is the one instrument that cannot see either failure the other two exist for - a
replaced subject inside the drift budget (boxdiff, TODO 57) or a thin re-shade over the whole frame
(pxdiff, TODO 31). Step 6 now names all three with one line each on what question each asks, and
carries the rule that caught a bad staging fix in session 12: a re-pin that moves a subject box or a
pixel count on a vantage you were NOT aiming at is parked, not pinned.

### PIECE 69 — dead-rear-camlock — harness-side, game md5 8232590523658dfc3f5a1fe59a916de0 unchanged
Verdict: green, frame moved on purpose, NOT RE-PINNED. gauntlet/verify/capture.mjs, one vantage.
- THE BRIEF WAS RIGHT ABOUT THE SHAPE AND WRONG ABOUT ONE WORD. It asks for the camera to be held
  still at the assignment the stage line makes. Held still at THAT offset is a close-up: 1.7 behind
  the bird is where the direct set starts, and the ease is 99 percent converged by the 900ms
  shutter, so the pinned photograph is the WIDE follow view. Piece 61 hit this from the other side
  in session 12 and could not explain it. The fix is the FIXED POINT of the follow rig, not the
  stage-line offset - and it is taken from the engine, by running KEAGAME.CAMS.update 400 times at a
  fixed dt and locking camLock to where the game put the camera. The collider march and the ground
  clamp are done by the follow rig rather than copied out of it, which is law 10 applied to a rig
  file. The lookAt comes off the camera own quaternion as a ray, so it needs no convention at all.
- AND THE BIRD IS EJECTED BY ONE FRAME OF PHYSICS, which is the surprise of the night. The mark this
  vantage has declared since it was written, (-9.55, 10.15), is inside a solid. ONE update(1/60)
  puts the bird at (-8.87763, 10.0137) and it does not move again for 240 frames. So the dead-rear
  offset has always been computed from a mark the bird does not occupy, and every frame 20 has ever
  taken was framed 0.68 off its own stage line. The new line takes that update itself, at fixed dt,
  before it converges the camera - so the camera converges against where the bird IS.
- THE PROOF IS REPRODUCIBILITY, NOT A BATTERY, because the game file was never opened. Probed at
  four settle lengths - 600, 900, 1200, 4000 ms, frame counts 36, 54, 73, 240 - the camera reads
  -5.85379, 2.30050, 14.49733 and the quaternion -0.10585, 0.29055, 0.03236, 0.95044 at every one,
  identical to five decimals. Before the change all four settles gave four different cameras.
- CROSSRUN, FIVE RUNS EACH SIDE, TEN PAIRS EACH: before 4334 px worst, samples 6, 25, 952, 958, 968,
  974, 3702, 3704, 4331, 4334 - continuous, which is an ease. After 991 px worst, samples 0, 5, 5,
  14, 976, 976, 981, 986, 986, 991 - two discrete clusters, which is a settle state. The residual is
  the caption feed and the grass, TODO 67 and 30, parked for Eric by name.
- THE FRAME MOVED AND IS LEFT FLAGGED. ssim 0.9831 against the 0.965 gate, so diff.mjs passes it;
  16308 changed pixels against a recorded churn of 5489, so pxdiff.mjs flags it at 3.0x. That split
  is the two instruments working exactly as written - a 1.4 cm camera translation is a sub-pixel
  slide of a textured horizon, which SSIM averages away and a pixel count sees. PXCELLS puts every
  hot cell in a band across the full width at rows 3 and 4. Subjects 15 checked 0 missing, boxdiff
  11 compared with only the two known ones flagged, gate CERTIFIED-SHIP.
- I DID NOT TOUCH THE pxdiff CHURN TABLE, on purpose. 991 is a real recalibration of a 5489 entry
  and it belongs with the re-pin, on more than five runs - session 12 law: a ceiling from five
  samples is a floor.
- ONE A/B THAT LOOKED LIKE A FINDING AND IS NOT. The old stage line at a 4000ms settle reads 24133
  px from the baseline and 20220 from the new frame, which for an hour looked like the lock landing
  somewhere the ease never goes. It is the world, not the camera: a 4000ms settle moves the grass
  and the caption by four seconds. The honest A/B is at equal settle, and there the old line reads
  4692 from its own baseline (inside its 4334-to-5489 churn) and 13237 from the new frame.
- WHAT IT UNBLOCKS: TODO 61 for vantage 20. That frame has neither a subjects.mjs presence check nor
  a boxdiff box, so nothing in the rig verifies the bird is in this photograph at all.

### PIECE 61-20 — subject-box-20 — harness-side, game md5 8232590523658dfc3f5a1fe59a916de0 unchanged
Verdict: green. gauntlet/verify/subjects.mjs, one SPEC entry, which boxdiff.mjs picks up by itself.
Closes TODO 61: subjects 15 -> 16 checks, boxdiff 11 -> 12 boxes.
- IT IS THE PIECE 69 DIVIDEND, AND IT ARRIVED THE SAME NIGHT. The away probe - capture.mjs with the
  bird parked at (-49,-49) every frame after the stage line - used to drag the CAMERA with it and
  score 135 against 200 for the real thing, which is why session 12 refused to guess a floor. With
  the camera locked to the follow fixed point, computed before the bird is parked, the probe is now
  literally the same photograph with the bird deleted from it. Absent 0, staged 198.
- THE SMALLEST SUBJECT IN THE SET: the bird is 31x46 px behind the caravan, measured bbox
  x 464..494, y 302..347, about 200 kea pixels in a 55x65 box read off the frame by eye.
- THE TWO PROOFS THE BRIEF ASKED FOR, and the second one is the whole argument for boxdiff existing:
    unchanged reshoot  three separate captures score the box 1.0000, 1.0000, 1.0000 - bit-identical,
                       which is also the cleanest confirmation that the piece-69 lock holds
    re-posed subject   yaw the bird 1.2 rad from its own stage line: box ssim 0.4550, while
                       diff.mjs reads the whole frame at 0.9953 and passes it comfortably
- AND I MOVED THE FLOOR OFF THE HOUSE CONVENTION ON PURPOSE. Every other box sits at about half its
  staged count, which here would be 100. The re-posed bird scores 91 - and 91 is a bird that is
  THERE. A floor of 100 would report it MISSING, which is a lie about the question this file owns.
  60 against a measured absent of 0 keeps presence and pose in the two files that can answer them.
- ONE ACCIDENT WORTH RECORDING, because it ran the whole instrument set by mistake and they all told
  the truth: I ran subjects and boxdiff while the re-posed probe frame was still sitting in the
  capture directory. subjects passed it at 91 over a floor of 60 (the bird is there), boxdiff flagged
  it at 0.4550 (the bird is not the same bird), and diff passed it at 0.9953 (the photograph barely
  moved). That is the three-instrument split from OVERNIGHT step 6, unplanned, on one frame.
- THE 20 BASELINE IS STILL THE PRE-69 PIN and the new box passes against it at 0.9893, so nothing
  here is waiting on the re-pin. Subjects 16 checked 0 missing, boxdiff 12 compared with only the
  two known ones flagged, diff 28 compared 0 flagged, gate CERTIFIED-SHIP.

### PIECE 71-AUDIT — stage-mark-ejection — investigation + report, no game change, no rig change
Verdict: green. audits/2026-09-03/audit-stage-marks.js, filed as TODO 71. Nothing was re-pinned and
capture.mjs was not touched: the finding is that four stage lines do not say where their bird stands.
- THE QUESTION CAME OUT OF PIECE 69 AN HOUR EARLIER. That piece had to know where the bird actually
  was before it could converge a camera on it, and found the 20 mark inside the caravan. The obvious
  next question is whether 20 was the only one, and it is cheap to ask headless.
- FOUR OF TWENTY-SIX LITERAL MARKS ARE INSIDE A SOLID, and pushOut ejects the bird on the first frame:
    01_carpark_wide     4, 16          -> 2.82, 16            1.180 m   a PARKED CAR at 4.2, 16.4
    08_readability_320  4, 16          -> 2.82, 16            1.180 m   the same mark, same car
    20_dead_rear        -9.55, 10.15   -> -8.87763, 10.0137   0.686 m   the caravan at -11, 8
    18_rear_close       -9.2, 10.6     -> -9.14552, 10.86876  0.274 m   the caravan, on z
  THE ESTABLISHING SHOT IS THE WORST OF THEM. 01 is the frame the whole set opens with.
- IT IS NOT A FLAKE AND THE DISTINCTION MATTERS. The move is one step, identical to five decimals
  every take, in both engines. Nothing here churns. What it costs is anybody who edits a mark: a
  small nudge does nothing until it clears the body, so the rig reads as if it ignored the edit.
- THE WRONG CONVENTION COST AN HOUR AND IS WRITTEN INTO THE FILE. I first identified the ejector with
  the camera march test from updateCams - a POINT in a box - and 18_rear_close came back moved with
  no collider anywhere near it. The bird is separated by pushOut with a radius of 0.28 and resolves
  on the SHALLOWER axis; with pushOut own numbers 18 is the caravan at 2.906 against 2.9 + 0.28 in
  the collider rotated frame. FLAKES law 10, met from the side where the wrong convention produces a
  finding with no cause rather than a number that is merely off.
- SO THE AUDIT PREDICTS ITS OWN ANSWER NOW. It prints pushOut overlap beside the measured move and
  flags any row where they disagree. All four agree exactly, which is what turns the cause from a
  correlation into a fact.
- AND THE CONTROL IS THREE BROWSER MEASUREMENTS, not one, because rig.js says in its own text that
  node and the browser build different countries from one seed. 20, 01 and 18 were all read off the
  staged page at shutter through puppeteer, and headless and browser agree to five decimals on every
  one - including the parked car, which is the body a seeded-world divergence would most likely move.
  The control prints before any row and says the rows are worthless if it breaks.
- ONE THING THE AUDIT GETS RIGHT THAT THE FIRST DRAFT DID NOT: a vantage names its own map. The ski
  field marks are tested in a ski field world, not in carpark tussock where all three would have read
  clean and meant nothing.
- THE FIX IS A JUDGED RE-PIN, so it is filed rather than taken: moving the 01 mark 1.18 m is a
  different photograph. The cheap half, if Eric wants one, is to write the ejected position beside
  each mark as a comment and move nothing.

### PIECE 69-CORRECTION — the churn drop was oversold by a five-run sample — no rig behaviour change
Verdict: green, and it corrects my own piece three commits later. capture.mjs comment and TODO 69
prose only; the stage line is not touched and no frame moves.
- I MEASURED THE AFTER AT FIVE RUNS AND FILED 4334 -> 991, which is exactly the mistake session 12
  wrote into the log twice and into pxdiff own header once: A CEILING FROM FIVE SAMPLES IS A FLOOR.
  Ten runs a side, 45 pairs each, same machine, same night:
      before  4353   0 x4, 8 x2, 30..32 x6, 952..972 x17, 1020, 3306..3318 x4, 3714..3731 x8,
                     4338..4353 x4
      after   3185   0..8 x8, 985..998 x14, 1273..1281 x17, 2259..2271 x5, 3185
      after   2271   a second batch of ten straight afterwards
- SO THE HONEST NUMBER IS A WORST CASE DOWN ABOUT A QUARTER, not down four times. And the second
  half of the claim was worse than the first: I called the before "continuous" and the after "two
  discrete states". At 45 pairs BOTH are clustered. Ten pairs cannot tell those two shapes apart and
  I should not have named the shape off ten.
- WHAT SURVIVES UNTOUCHED IS THE POINT OF THE PIECE, and it never rested on the pixel count: the
  camera reads identical to five decimals at settles of 600, 900, 1200 and 4000 ms, where all four
  moved it before. That is a state probe, not a sample - the camera cannot land somewhere else
  because the machine was busy, and the residual churn is the caption feed and the grass.
- AND IT ANSWERS THE QUESTION I HAD DELIBERATELY LEFT OPEN, in the opposite direction to my instinct.
  Piece 69 declined to lower the pxdiff CHURN entry for 20 from 5489 to 991 on the grounds that five
  runs is not a calibration. Lowering it would have gone red on the very next batch of ten. The entry
  stays at 5489 and now has a reason in the file rather than a hunch.
- ONE PROCESS SLIP OF MY OWN, caught by a grep before it printed a number: my first "before" batch
  was shot from git show HEAD~2, which is already the fixed capture.mjs, so it was a second AFTER
  batch wearing a before label - and it came back 2271, which reads perfectly plausible as a before.
  The check that caught it was counting the old anchor in the extracted file, which is the same
  assert-the-anchor-exists law the game file has had since session 3.

### PIECE 71b — the two computed marks — investigation, no game change, no rig change
Verdict: green, and it found a fifth ejection that the literal sweep could not see. Extends
audits/2026-09-03/audit-stage-marks.js; TODO 71 updated.
- THE HOLE WAS EXACTLY WHERE THE FINDINGS ARE. Two vantages do not name a number: 15_sign stands the
  bird off G.signG and 12_seal_midpeel stands it off the door-seal strip own getPos() after peeling
  it six times. Both are at the caravan end of the carpark, which is the body that ejects three of
  the four already found. A sweep that reads literals only is a sweep that skips the neighbourhood.
- THEY ARE TRANSCRIBED AS FUNCTIONS OF THE WORLD WITH THEIR SOURCE ASSERTED, which is the game-file
  anchor law applied to my own tooling - the thing session 12 said it should have done and did not.
  If capture.mjs stops saying exactly that line, the row prints TRANSCRIPTION STALE and no number.
- 12_seal_midpeel IS EJECTED 0.632 m AND FALLS 1.62 m. The stage line stands the bird at the seal,
  y 1.62, grounded=false - a bird mid-peel, which is the act the vantage is named for. Browser at
  shutter: -9.1728, 0, 8.55761, grounded true. So the photograph is a bird on the tarmac beside an
  open door with a half-peeled strip above it. It reads well and it is not what the line describes.
- AND SESSION 12 WALKED PAST THE EVIDENCE WHILE STANDING ON IT. TODO 70 probed this exact vantage
  for churn and recorded "y 0, vy 0, grounded true, five takes out of five" as proof the bird had
  settled. It is the same measurement; nobody asked why a bird staged at 1.62 was on the ground.
- 15_sign IS CLEAN in both engines, which is worth having: it is the control for the transcription
  method, a computed mark that does not move.
- THE CONTROL IS NOW FOUR BROWSER MEASUREMENTS. 20, 01, 18 by position, and 12 by position AND fall.

### PIECE 71c — annotate the ejected marks — comments only, no frame moves
Verdict: green. The cheap half TODO 71 offers: leave every mark where it is and write the truth
beside it, so nobody has to run the audit to find out that a stage line is not describing its own
photograph. capture.mjs comments only - four notes, outside every template literal.
- 01 gets the long note because it is the establishing frame and the worst case, 08 gets a pointer
  to it because it shares the mark, 18 gets one line, and 12 gets the one that matters most: THE
  BIRD IS NOT AT THE SEAL. 20 already carries it inside the piece-69 block.
- PROVED IT CHANGED NOTHING rather than asserting it: 01 and 12 reshot at 1564 and 1017 changed
  pixels against churns of 3996 and 3123, ssim 0.9989 and 0.9993. Comments outside a template
  literal cannot move a frame, and now there is a measurement saying so.

## SESSION END — 2026-09-03, session 13, six pieces and five marks inside a solid
Stop condition on the 6-piece rule. Tip 8232590523658dfc3f5a1fe59a916de0 - THE GAME FILE WAS NEVER
OPENED - gate CERTIFIED-SHIP, full sweep at the end reading 28 pinned vantages 0 flagged, subjects 16
checked 0 missing, boxdiff 12 compared with only the two known ones changed, pxdiff 3 over band
(07_jam, 17_flight and tonight's 20), three selftests ALL PASS, working tree clean, SESSION.lock
released. ONE FRAME MOVED AND IS NOT RE-PINNED: 20_dead_rear.
    --   step-6-fix                boxdiff and pxdiff into OVERNIGHT.md, three reports late
    69   dead-rear-camlock         the last live camera in the set
    61   subject-box-20            closes TODO 61, and it is the piece-69 dividend
    71   stage-mark-ejection       the audit, and four marks inside a solid
    69c  correct-the-20-churn-claim my own five-run number, corrected at 45 pairs
    71b  computed-stage-marks      the two non-literal marks, and the fifth ejection
    71c  annotate-ejected-marks    the cheap half of 71, comments only
- THE QUEUE RAN OUT AFTER TWO AND THE NIGHT DID NOT. Eligible after session 12 was 69 and whatever it
  filed; 30, 67 and the re-pin are Eric by name, 68 says in its own text that the next move is not
  more measurement, and 32, 39b, 40b, 56, 60 and 64 are judged, design-blocked or blocked art. Four
  of the six pieces are findings that piece 69 turned up on its way past, which is the same shape
  session 12 had - the instrument answers a question and the answer is the next three pieces.
- THE BRIEF FOR 69 WAS ONE WORD OUT AND THAT WORD WAS THE WHOLE PIECE. Held STILL at the offset the
  stage line assigns, 20 is a close-up: the ease had all but converged by the shutter, so the pinned
  frame is the wide follow view. The answer is to stop nominating a position and take the FIXED
  POINT from the engine - 400 iterations of the game own updateCams at a fixed dt, then lock. Law 10
  applied to a rig file: the collider march and the ground clamp are done BY the follow rig.
- FIVE STAGE MARKS ARE INSIDE A SOLID and the establishing shot is the worst of them. 01_carpark_wide
  photographs its bird 1.18 m from its own line, inside a parked car; 12_seal_midpeel stands the bird
  at the seal at y 1.62 and photographs it on the tarmac 0.63 out and 1.62 down. Not a flake - one
  step, identical in both engines - so it costs nobody a frame and costs everybody who edits a mark.
- I MADE THE SESSION-12 MISTAKE MYSELF AND CAUGHT IT THE SAME NIGHT. A 4334 -> 991 churn claim off
  five runs a side is 4353 -> 3185 at forty-five pairs, and the "continuous versus discrete" shape I
  read off ten pairs is not there at forty-five. Third session running that a ceiling from five
  samples turned out to be a floor, first time it was my own. What survives is the state probe: the
  camera is identical to five decimals at four settle lengths, which is not a sample.
- AND IT ANSWERED THE QUESTION I HAD LEFT OPEN, THE OTHER WAY. Piece 69 declined to lower the pxdiff
  churn entry for 20 from 5489 to 991 for want of a bigger sample. Lowering it would have gone red on
  the very next batch of ten. The entry stays and now has a measurement beside it.
- THE WRONG CONVENTION PRODUCES A FINDING WITH NO CAUSE, which is its tell. Reading the ejectors with
  the camera march test instead of pushOut gave 18_rear_close a 0.274 m move and no collider. With
  pushOut own radius and shallower-axis resolve, the predicted overlap equals the measured move on
  all five rows.
- WHAT THE NEXT SHIFT SHOULD READ FIRST: REPORT.md, then TODO 71 and the audit it names, then TODO 69
  including its correction, and FLAKES 14 before writing a single assertion. The two parked patches
  in gauntlet/parked/ are untouched and still apply clean.

## SESSION 13b — 2026-09-03, Eric order mid-session: APPLY THE RIG PATCH
The lock was retaken for this. gauntlet/parked/todo30-and-67-deterministic-rig.patch applied clean
onto the six pieces above; capture.mjs only, game file still never opened, md5 unchanged, gate
CERTIFIED-SHIP. NOT RE-PINNED and NOT RECALIBRATED - both are judged and both are Eric.

### PIECE: apply-deterministic-rig — TODO 30 and 67, applied
Verdict: green, and it does what session 12 said it would do, to the fourth decimal.
- SESSION 12 PREDICTED 11 FLAGGED FRAMES WORST 0.8467. Measured tonight: 11 flagged, worst
  13_idle_preen 0.8468, then 14_player_view 0.8884 and 16_trish 0.9166 - their whole table, one
  build and one machine later. The eleven are 02, 06, 08, 10, 11, 12, 13, 14, 16, 19 and 20.
- WHAT IT BUYS, FULL SET, FIVE SWEEPS, TEN PAIRS EACH: nineteen of twenty-eight vantages under 100
  px of cross-run churn, two at exactly zero (29_lodge_deck, 30_groomed_band), and the vantage that
  used to be the worst in the set - 06_skyline, recorded 8791 - reads 129. 20_dead_rear, which was
  4353 last night before piece 69 and 3185 after it, reads 22. The two pieces stack the way they
  were supposed to.
- THE THREE THAT DO NOT COLLAPSE: 28_skifield_base 1291, 22_torch_beam 969, 09_colossal 825. The
  last of those is BY DESIGN - it is the popup fanout and it sets __keaFeedKeep - and 22 is the Rex
  arm lerp that TODO 70 named. 28 is new and is now TODO 72.
- ONE RED ON THE crossrun CONTRACT AND IT IS NOT THE PATCH, which took twenty minutes to establish
  and was worth every one of them. 28_skifield_base churns 1291 against a recorded 453. Measured
  with the patch STASHED, same machine, same night, six runs and fifteen pairs: 5844 px worst,
  samples 14 250 265 464 608 742 1105 1249 1810 3678 5046 5515 5655 5756 5844. So the patch takes 28
  from 5844 to 1291 and the RECORDED CEILING was always too low. Third time in three sessions that a
  ceiling from a sample turned out to be a floor, and the first time it has been the calibration
  table rather than a claim in a report.
- AND THE CAUSE OF THE RESIDUAL IS NAMED RATHER THAN GUESSED: the bull wheel, line 3720,
  `G.towWheel.rotation.z+=dt*2.4`, a pure dt accumulator that no clock pin can reach. Two runs
  cropped side by side show the same red disc with its bolt-head at a different angle, and the hot
  cells are cx 7..9 cy 3..4, which is where it sits. One line in the 28 PIN fixes it and moves that
  frame, so it is filed as TODO 72 rather than taken.
- THE NEW BOXDIFF ROW IS THE INSTRUMENT EARNING ITS KEEP. 13_idle_preen goes to 0.8891 in the
  subject box: a pinned clock freezes the idle animation, so the preen is caught at a different
  phase and that is a different bird in the same frame. diff sees it too here, but the box is what
  says WHY - and it is exactly the failure boxdiff was built for after piece 54.
- SUBJECTS STAYS 16 CHECKED 0 MISSING, which is the load-bearing check for a change this wide: the
  clock pin and the feed park moved eleven photographs and did not lose a single bird.

## SESSION 13c — 2026-09-03, Eric order: RE-PIN EVERYTHING THE PATCH CHANGED, BANDS FROM THE SAME SWEEP
Lock retaken. One atomic commit: 26 re-pinned baselines, the recalibrated pxdiff CHURN table,
BASELINE.md and the TODO entries. Game file never opened, md5 unchanged, gate CERTIFIED-SHIP.

### PIECE: repin-deterministic-set — TODO 30 and 67 closed
Verdict: green, and it took three corrections to get there - two of them mine, caught by the
instruments rather than by argument.
- THE SET IS 26 OF 28. 07_jam (TODO 60) and 17_flight (TODO 57) keep their pre-patch baselines by
  order and stay loud: 18171 px at 790x band and 10142 at 46x, boxdiff 0.9426 and 0.6359. Everything
  else was re-pinned on the deterministic rig, including the fifteen sub-threshold movers that diff
  had passed all along - 01_carpark_wide alone sat 18484 px from its baseline while reading 0.99 ssim.
- THE TABLE IS THE MAX OF EVERY BATCH TAKEN TONIGHT, with the provenance in the file: five runs (10
  pairs), ten runs (45 pairs), a warm four-run re-test of six vantages, and fifteen runs of the two
  that needed it. 06_skyline 8791 -> 184. 13_idle_preen 6932 -> 347. 19_roof_follow 4168 -> 15.
  18_rear_close 3909 -> 14. Two at zero.
- ONE ROW EXCLUDES A SAMPLE AND THE FILE SAYS SO. 07_jam read 5717 over ten runs, and the pair matrix
  says that is ONE sweep standing 5714 px from the other nine while the nine agree within 23. Four
  warm sweeps read 22 and four single-vantage runs read 7 to 24. Absorbing it would have set the 07
  band to 11434 - ABOVE that vantage own open drift of 18171 - and silently retired TODO 60. That is
  the 18_rear_close 16317 precedent this file already carries, applied a second time.
- AND I PINNED TWO FRAMES FROM AN OUTLIER SWEEP, which is the finding of the sitting and is now TODO
  73. After the first re-pin, a fresh sweep read 23_paddock_gate 1165 px and 28_skifield_base 3581 px
  from baselines pinned minutes earlier. Fifteen runs of those two - 105 pairwise distances - churn
  129 and 5. So the pin source was a state the next fifteen sweeps never visited. Re-pinned from the
  consensus run and verified. THE ONLY REASON THIS WAS CAUGHT is that the verification sweep was a
  FRESH one rather than the sweep the pins came from, which is now written into BASELINE.md as the
  protocol.
- THE TIGHTER THE RIG, THE MORE A MIS-PIN COSTS. 28 churns five pixels over 105 pairs now; a sweep
  3581 px out is three orders of magnitude clear of its own noise. Last week that would have been
  indistinguishable from ordinary churn.
- 03_kea_plate SURVIVES AS THE CONTROL IN THE ONLY WAY THAT SURVIVES BEING RE-PINNED, and it is the
  cleanest evidence in the sweep. It already pinned G.time locally, so the clock half is a no-op
  there - measured, its 3108 px sits ENTIRELY in cells cx 5..10 cy 0, the caption strip, and nowhere
  else. The clock moved the vantages that did not pin it; the caption moved everything.
- 13_idle_preen IS THE ONLY FRAME WHERE THE BIRD CHANGED and Eric accepted the pose. Measured before
  pinning rather than asserted: idleAct.t reads 1.5999, 1.6, 1.5999, 1.5999 over four runs with the
  head identical to five decimals, and the clock pin's only effect on the bird is the TAIL, -0.0698
  pinned against +0.0557..+0.0596 live. The preen phase is a dt accumulator that was never
  reproducible before and is now.
- VERIFIED ON A FRESH SWEEP, TWICE: diff 28 compared 0 flagged, pxdiff 2 over band and both of them
  the held-open drifts, boxdiff 12 compared 2 changed and the same two, subjects 16 checked 0
  missing, gate CERTIFIED-SHIP, three selftests ALL PASS.
- NOT DONE, BY ORDER: the 12.0 sweep. Shipped as-is.

## SESSION 14 — 2026-09-03, Eric order: REPLAT.md P1, the renderer foundation, supervised

Branch `replat-b`, lock held, Eric present. The `gauntlet` branch was never written to; `REPLAT.md`
and the Birds of War wall came across by FAST-FORWARD, not cherry-pick — replat-b was strictly
behind gauntlet by exactly those two commits, so there are no duplicate SHAs for Eric to reconcile
at merge time and the gauntlet ref never moved.

**ERIC'S TWO CALLS, TAKEN BEFORE ANY CODE MOVED.** P1 split into port-then-film rather than one
step, and `untitled-kea-game.html` kept frozen rather than retired. Five certifiable pieces:
scaffold, port, harness, capture rig, film camera. Every one ended CERTIFIED-SHIP.

- **THE PORT WAS SMALL BECAUSE THE FILE WAS ALREADY A MODULE IN A COSTUME.** 348KB of HTML is a
  19KB shell, one CDN tag and one 328KB logic block that already took THREE injected, exported
  `globalThis.KEAGAME` and ended `if(!HEADLESS)boot();`. Seven API sites changed and nothing else:
  5x texture `.encoding`, 1x `outputEncoding`, 1x `LuminanceFormat`. The bundler found all seven
  statically at step 1, confirming an inventory taken by hand before anything moved.
- **THE PORTED BUILD MAKES THE SAME COUNTRY HEADLESS.** 64 interactables, 21 props, 29 colliders,
  identical on both stacks under seed 20260828. That the counts match at all is the load-bearing
  result: three draws Math.random per object, so a version bump that changed the draw count would
  have reshuffled the world and silently invalidated every baseline.
- **AND IN THE BROWSER IT DOES NOT, AND CANNOT.** Measured at boot: r128 consumes 10,570 draws,
  r185 10,738. three's internals take 168 more, so the stream parts company partway through the
  build and every randomised placement after that lands differently. Scene STRUCTURE is identical
  (402 children both). **PIXEL PARITY WITH THE OLD BASELINES IS IMPOSSIBLE BY CONSTRUCTION** — this
  is rig.js's "one seed and two reproducible worlds, not one world", now true across three versions
  as well as across node and the browser. No lighting fix and no seed changes it.
- **THE CONTROL IS WHAT MADE THAT A MEASUREMENT.** The first ported pass flagged 26 of 28 vantages
  and nothing on hand could say whether the port moved or the machine had. Reshooting the FROZEN
  build through the PRE-PORT path read **0.99998 and 1.00000** against the same baselines. So the
  ground is where it was and all of the drift is the port. Kept as `gauntlet/verify/frozen.mjs` for
  P2-P6. It does NOT copy the staging table — a first draft did and got both frames wrong; it checks
  the pre-port rig out of git verbatim and patches exactly two paths.
- **FOUR ASSERTIONS RE-GROUNDED, NONE WEAKENED, AND THREE OF THEM WERE PINNING DEFECTS.**
  `nonUnit===6` pinned r128 zeroing normals on two ZERO-AREA seam triangles; r185 emits neither
  (714 tris/2 degenerate -> 700/0). `arc>0` was worse: it counted 25 "chain" groups and never
  checked they smoothed — measured, ALL 25 were still banded on r128 and the battery called that
  green. r185 smooths all 352. Re-pinning either number would have demanded the defect back, so
  both now assert their CAUSE and r128 would fail them. `G.sun.intensity<1.0` was an absolute
  intensity in r128 units — really "under 69% of daylight" with the 69% hidden in a literal; every
  light is now x pi and nothing was wrong with the game.
- **BLOOM RUNS ON LINEAR HDR AND THE SKI FIELD IS WHAT SETS THE THRESHOLD.** 0.86 bloomed
  everything (+13% brighter, 37% LESS SATURATED). 1.35 measured well on the carpark and blew
  28_skifield_base to near-white, because snow is high-albedo and its DIFFUSE radiance alone reaches
  1.5-2.0 linear. 2.0 is clean (195.5 YAVG / 10.89 SAT against plain 194.7 / 11.24) and still
  catches the torch beam at +3.2. **A LOOK TUNED ON ONE VANTAGE IS NOT TUNED.**
- **THE TONE-MAPPING CHAIN WAS VERIFIED RATHER THAN SUSPECTED.** OutputPass tone maps at the end so
  double-tone-mapping was the obvious culprit for the washout; A/B against the plain renderer with
  every effect off read 155.3/21.8 against 154.5/22.0. Identical. It was the bloom numbers.
- **TWO INSTRUMENTS THAT HID THEIR REASONS, FIXED.** `gate.sh` kept `tail -1` per battery, so a
  battery with two findings showed only the second — this session fixed one and only then learned
  the other existed. `shotR` swallowed its exception, so a stage that could NEVER succeed looked
  exactly like a flaky GPU: the first pass said only "GAVE UP 07_jam", and the cause (a bundled
  build has no global `THREE`, which two vantages stage with) took a separate hunt. Both now say why.
- **VERIFIED:** nine batteries ALL PASS, gate CERTIFIED-SHIP, bundle builds, 30/30 vantages shoot
  with no retakes, subjects 16 checked 1 missing, playtest drives both birds with real key events in
  split screen. specimen `dfbbb247aaadf0b6db06c2c38da31ee8`, bundle `f087df18379a73a8c2ba4cbd91c77856`,
  frozen `8232590523658dfc3f5a1fe59a916de0` unchanged.
- **NOT DONE, BY ORDER: THE RE-PIN.** Every baseline and every subject floor is calibrated to r128
  and all thirty frames have moved. `07_jam` carblue stands red at 2950 against a floor of 3000 —
  98% of an r128-calibrated floor, with four blue cars plainly in the frame. Lowering it to get
  green is the thing FLAKES forbids. The whole set is Eric's look and Eric's judgement.
