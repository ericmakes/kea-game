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
