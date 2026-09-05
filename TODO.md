# TODO.md — overnight diet, cut 2026-08-29 from the 24-frame studio audit
# Takes precedence over OPPORTUNITIES.md Tier 2 while unshipped pieces remain.
# House laws apply unchanged: FLAKES.md before any test, fastgate every patch,
# battery proof for mechanical changes, CERTIFIED-SHIP before commit,
# one piece = one commit ("PIECE: <name> — certified <md5>"), log everything
# to gauntlet-log.md.

## ⛔ BLOCKED — do not attempt overnight (art waves, eyes required)
Blob shadows · scene fog / light tint · tussock rework · bird face
(eyes/feet/wing/beak) · hut roof rebuild · mountain silhouettes / night sky.
These are taste-calibrated waves Eric runs interactively with capture-eyeball
loops. If only blocked items remain, STOP and write REPORT.md — never
improvise on them.

## Pieces (smallest first)

### 1. night-tint-trees
Canopy foliage stays daylight-green at night (vantage 21). Tie foliage (and
trunk) material colour to nightT wherever other surfaces take their night
tint: at nightT=1, canopy HSL lightness ≤ 0.45 × its day lightness.
PROOF: stage nightT=1 headless, getHSL a canopy material, assert the ratio.
Append to harness-everything in house style.
RE-PIN: 21 (and 22 if flagged). If unsure, leave flagged for Eric.

### 2. glass-sky-gradient
All glazing is flat pale blue (vantages 12, 20). Add detailTex kind 'glass':
vertical two-stop gradient, sky-blue top → near-white bottom, LOW contrast
(≤ 12% delta), 128px, no marks. Register the glass hex(es) in MAPKIND via
_mk so mat() applies it (!HEADLESS path).
PROOF: MAPKIND entry exists headless; stub-execute the painter under node
against a stubbed 2D context (§6 stub-execute law — browser-only canvas).
RE-PIN: 12, 15, 20 on flag.

### 3. score-popup-fanout
Simultaneous popups stack as identical lines (vantage 09). Give each spawn a
seeded x-offset (±34px), scale falloff by stack index, staggered fade start.
PROOF: spawn 5 popups in one tick headless; assert pairwise-distinct offsets
and monotonic scale/stagger.
RE-PIN: none expected (HUD outside baseline judgment) — confirm via diff.

### 4. capture-staging-subjects  (harness-side only — game file untouched)
Four showcase vantages miss their subject: 04 bird hidden behind the HUD,
09 no colossal bird in frame, 17 no flying bird, 07 empty road. In
capture.mjs stage each subject: 04 bird below the HUD band, wings raised,
scarlet underwing visible; 09 colossal bird in frame; 17 airborne bird
mid-frame; 07 three-plus cars staged on the road.
PROOF: extend the pixel tripwire — assert olive/scarlet pixel counts inside
the expected frame region exceed a calibrated threshold per shot.
RE-PIN: 04, 07, 09, 17 (intentional reframe). Game md5 unchanged — say so
in the commit message.

### 5. hud-tab-reflow
At 320px the TAB pill overlaps the prompt plate's second line (vantage 08).
Make the collision logic-driven so it is assertable: track prompt-plate line
count in state; when it wraps OR viewport < 480, hide/dock the TAB hint via
a state flag the DOM reads.
PROOF: headless — set the state conditions, assert the flag. No DOM
measurement.
RE-PIN: 08.

### 6. preen-head-visibility
Preen buries the head so deep the bird reads headless from the follow cam
(vantage 13). Constrain the pose: head/beak pivot keeps world-y at or above
the wing-top line throughout the cycle.
PROOF: run the preen anim headless across its full cycle; range-assert head
y ≥ wing-top y − ε at every sampled frame.
RE-PIN: 13.

### 7. floating-text-cull
Tiny world-space text renders far-field in vantage 20 (right side).
Investigation first: identify the source label. If it is stray, add
distance/visibility culling (hidden beyond ~40 units or when its anchor prop
despawns). If it is legitimate signage, fix legibility instead and say which
in the log.
PROOF: assert the label hidden at a staged distance (or the legibility fix's
own contract).

### 8. white-object-18
Stray white rounded object under the bird's tail at the caravan door
(vantage 18). Identify it — seal-step debris, egg prop, or orphan. If
intentional: name and texture it, keep. If orphan: remove.
PROOF: an assertion that pins the decision either way (prop exists with
kind X at that anchor, or scene contains no unparented white prop there).

### 9. facet-normals  (judge-required — expect Eric's review before merge)
Curved hulls show shading bands (ute bonnet 01/09, caravan roofline 12).
Recompute vertex normals on lofted/lathed hulls after build. Do NOT change
silhouettes, geometry, or vertex/face counts.
PROOF: assert the recompute ran (flag) and vertex/face counts are unchanged.
RE-PIN: none — leave ALL flagged vantages unpinned for Eric's morning
eyeball; shading character is a taste call.

## CARAVAN FIX + MODE PIECES (appended 2026-08-31)
Design sign-off: star trio, restorer-as-kea, areas-as-arenas, 80% botch rule.

## MODE CONSTANTS (single source of truth for pieces 11+)
BOTCH = 0.80   # every restore lands at 80% fidelity of pristine — seeded
               # wonk: small rotation + offset + misalignment. Success
               # condition still true. Non-compounding (always 80% of the
               # ORIGINAL). Playtest experiment behind one constant:
               # compound mode (80% of the LAST restore).
DECAY = 0.60   # per-object per-cycle score decay, both directions
ORDER value = the chaos value of the act being undone (after DECAY)
JAIL: one cell, one bird, globally.

### 10. caravan-door-orientation  (judge-required)
The caravan door copies the hut door build (slab thin in Z) but the
caravan's door wall faces X — so the door face points fore-aft, a fin off
the side (edge-on in vantages 12/18; visible from dead ahead in 20, which a
flush door never is). Anchor on the comment strings ('the door itself —
Crusader black', 'tall narrow door pane', 'door step'): reorient frame,
door, and pane flush to the door-side wall — thin axis into the wall, face
spanning the wall plane — keep ALL dims (the 12-step seal law), restagger
the layering offsets onto the wall axis, rebuild the seal beading path
around the reoriented frame edges, keep the tear reachable (range 1.7).
PROOF: assert the door bounding box is thin toward the wall and its face
spans the wall plane; seal mission still completes all 12 steps headless.
RE-PIN: none — leave 12, 18, 20 flagged for Eric.

### 11. one-cell-jail
The cage check is per-bird — rex can currently cage both keas at once.
Make occupancy global: rex cages only if NO kea is caged. Jail full → rex
SHOOS the second bird instead: feathers hit + NO VACANCY popup.
PROOF: stage both keas at WANTED 3, cage one, assert the second cannot be
caged (cage spy) and the shoo fires.

### 12. star-ledger
SAVE schema v2: per-page stars {cleared, style, clean} keyed by area, plus
per-page chaos snapshots. Retro-grant CLEARED from existing done lists on
load so nobody loses progress. TAB page headers render star pips.
PROOF: save/load round trip headless; legacy blob loads and retro-grants;
header render state asserts.

### 13. style-star  — DONE session 6 (071ced95438ec024e44cbb0f4c6c5d8f)
Snapshot score at page open; on page turn, STYLE star if chaos earned
during the page >= par. Par v1 = 1.5 x the sum of the page missions'
points (placeholder — tuning is playtest, note it in the log).
PROOF: simulate awards across a page turn; assert grant and deny on both
sides of par.

### 14. clean-getaway-star  — DONE session 6 (c8ced0cf4a7afb6a3a2faa5f000a476a)
Zero cagings while the page was open (either bird counts in co-op). Cage
spy pattern.
PROOF: clean page grants; a caging mid-page voids.

### 15. coop-jail-hardening  — DONE session 7 (3d420ba5dc1359ad6ec2c4a4071261a8)
Co-op only: the caged timer freezes, mash becomes a SQUAWK ping (locator
on the partner's screen, no time reduction), latch-peck JAILBREAK is the
only fast exit. Solo behaviour unchanged.
PROOF: co-op stage — caged persists without partner action, frees on latch
onDone; solo stage — mash-out still works.

### 16. score-attribution  — DONE session 7 (f08f3364e9d513a03c0a6ff8c100bdc4)
Thread the acting kea's idx through award() into per-kea ledgers alongside
the shared score. Outside VS nothing visible changes.
PROOF: two keas award separately; ledgers split; shared total unchanged.

### 17. home-positions  — DONE session 6 (e19fcd5a9ae90f754e36f26a64ef5509)
Record spawn transform (pos + rot) for every displaceable and consumable
prop at build time. Foundation for pieces 20/21.
PROOF: homes recorded for cones, boots, shinies, food props; survive
save/load.

### 18. fix-verb  (VS)  — DONE session 8 (74e048b26061845b4f4da8e9cccf1997)
Restorer role gets one generic verb: E-hold on any wrecked tear → restored
state; ORDER points = chaos value undone x DECAY^cycles (per object; both
directions share the cycle count).
PROOF: wreck/fix/wreck/fix one object headless; assert the decaying value
sequence and the state flips.

### 19. botch-system  (VS)  — DONE session 9 (ed17c5d8cb9f044870769dedc59b8e83)
Every restore lands at BOTCH fidelity: seeded wonk transform — slight
rotation, offset, misalignment — signs crooked, wipers skewed. Success
condition still true. Applies to fixes, carry-back placements, and
replacements.
PROOF: restore an object; assert state restored AND transform inside the
wonk band and not pristine; seeded so the tripwire stays deterministic.

### 20. carry-back-restore  (VS)  — DONE session 9 (d16cf644cfdffd8c4ca08510f288b5d9)
Displaced props (cones on the road, boots, stolen shinies): restorer picks
up and drops within the home radius → restored (botched placement) + ORDER
points on the drop.
PROOF: displace, carry, drop in radius → points + restored; drop outside
radius → nothing.

### 21. consumable-replace  (VS)  — DONE session 9 (6b4c21db02a72392d733500958471896)
Scoffed food cannot be un-eaten: each consumable class gets a SOURCE (the
picnic spread / the chilly bin). Restorer fetches a replacement and places
it at the home spot → restored + ORDER points. Travel time is the price of
the menace's snack strategy.
PROOF: scoff → fetch → place at home → points + prop present (botched);
source depletion rules assert.

### 22. vs-match-scaffold  — DONE session 8 (846ee651e37429d7fa3355a49ee9329b)
Title gains 2 KEA VERSUS. Match flow: coin-flip roles (THE MENACE / THE
MANAGEMENT popups), timer 3/5/8 min (default 5), horn, results screen with
split scores + the biggest single play each side. Tie → sudden death,
first point wins, 60s cap then draw.
PROOF: state machine headless — seeded random roles, timer expiry, winner
decision incl. the tie path. Screens: leave flagged for Eric.

### 23. arena-scoping  — DONE session 9 (96a83803f067232a08463219ced371ed)
A match is one patch: only interactables whose mission area matches the
arena score; anything else → WRONG PATCH, NO POINTS prompt. RANDOM PATCH
picks one; TOUR runs the chapter order as a series.
PROOF: in-arena act scores; out-of-arena act scores zero and prompts;
seeded selector; TOUR sequence asserts.

### 24. role-aware-rex  (VS)  — DONE session 9 (39c2d931f488caa1679afa01fff0e697)
Rex hunts THE MENACE specifically at WANTED >= 3 during VS; a caging pays
the restorer an ORDER bonus; menace mash-out is solo (latch locked in VS).
PROOF: staged — rex targets the menace only; bonus lands; latch locked.

### 25. vs-hud-split  — DONE session 9 (df4ae7c6cdee29c3a0bbe3aa7f514f24)
Two scores + roles + timer, readable at 320px (the vantage 08 law). Reuse
the reflow logic from piece 5.
PROOF: state-driven layout flags assert at narrow widths; leave the look
flagged for Eric.

## FOUND IN SESSION 3 (appended 2026-09-01 by the overnight run)

### 28. snow-patch-grounding  (judge-adjacent — I did NOT improvise on this)
Found while investigating item 7. Snow patches are laid by the tussock block with a hardcoded
y=0.05 (halo 0.042), no ground query and no exclusion zones — the only ground decal in the file
that does neither. Twenty-five lines above them, the G.wear desire paths call paintAt() and lay
themselves on whatever surface they find (pa.top+0.006), and G.stones calls paintAt() to stay off
the seal. Snow is the odd one out, and it is not recorded to G at all, so nothing can assert it.
MEASURED, capture seed 20260828: two of the ten patches are buried in the ski-field shed —
(-40.94,-40.41) r 2.57 with 45/80 footprint samples at ground height 2.00, and (-39.25,-39.79)
r 1.69 with 62/80. The shed is a 3.2x2x2.4 box at (-40,1,-40), top 2.00, with a 3.6x0.14x2.8 eave
slab at 2.10. So most of each disc sits inside the building volume and the rest exits through the
walls as a hard straight chord. VISIBLE in vantage 10: the shed stands in a white saucer.
WHY I PARKED IT rather than shipping it overnight:
  - "lay it on the surface it finds" (the wear convention) is WRONG here — the raised sample is
    the shed ROOF at 2.00 and the eave underside is at ~2.03, so a disc laid at 2.05 pokes
    through the eave. Snow belongs on the country, not on the shed.
  - so the patch must MOVE, and where scenery moves to is a taste call next door to the blocked
    tussock wave.
  - and the fix must be stream-neutral or it repins the world. It must consume identical rnd()
    draws AND build an identical number of meshes: an exclusion test that `continue`s changes the
    mesh count, and mesh count moves Math.random, which is what tints the grass (item 27). A
    fixed deterministic offset ladder — try the spot, else try centre+(dx,dz) from a constant
    table, first clear one wins — is count-neutral and draw-neutral and would do it.
  - DO ITEM 27 FIRST and this constraint relaxes: once blade tint is on the seeded rnd(), mesh
    count stops tinting the field and a plain exclusion `continue` becomes legal.
PROOF once built: register the chosen spots to G.snow the way G.wear and G.stones already do,
computed in BOTH paths with the meshes still built only when !HEADLESS, then assert no patch
footprint contains a raised ground sample. That is what makes it node-assertable at all.
RE-PIN: 10, and any grass vantage the moved patches touch. Leave flagged for Eric.

### 29. vantage-staging-vs-the-flake-laws  (harness-side only — game file untouched)
Found in session 3 when two frames flagged against a byte-identical game file. Both are staging
bugs the FLAKES ledger already warns about, and both drift with machine load, which is why they
passed at 0 flagged last session and fail now.
  - 22_torch_beam sets G.night, G.nightT=1 and nightApply(1) but NOT G.nightManual. Law 5 says
    nightT eases toward the auto-driver every frame, so night+nightManual is the only stable
    staging. It currently eases back toward day for the whole 900ms settle. 21_night_camp has the
    same omission (0.9791, worst of the passing frames).
  - 19_roof_follow is one of only two vantages that set the camera directly instead of through
    camLock, so the follow cam lerps away from the staged pose for the entire settle. Its bird
    also sits at y=5.2 on the roof with no per-frame PIN, so gravity and the roof logic can move
    it (law 7, and the piece-4 lesson that a one-shot stage cannot hold a live bird).
FIX: add nightManual to both night vantages; give 19 a camLock (or PIN the bird and the camera).
PROOF: reshoot each flagged vantage three times and assert the spread collapses — that is the
actual contract, since the defect is variance, not a wrong-looking frame.
RE-PIN: 19, 21, 22 after the staging is stable. Expect a one-time move; leave flagged for Eric.
NOTE: measured spread before the fix — 19 sits 0.956-0.961, 22 sits 0.944-0.950 across runs.

### 30. pin-G-time-set-wide  (harness-side only — game file untouched)  — APPLIED and RE-PINNED session 13c on Eric order. CLOSED.
MEASURED AND BUILT IN SESSION 12, THEN PARKED FOR YOUR JUDGEMENT, exactly as this item asked - judge
before pinning, leave flagged. The patch is gauntlet/parked/todo30-and-67-deterministic-rig.patch and
it carries BOTH this and TODO 67, because they want ONE re-pin sweep between them rather than two.
It applies clean and fastgate passes with it in.
THE ORIGINAL COMPLAINT WAS RIGHT AND UNDERSTATED. The grass shader takes uTime straight off G.time,
the tussock sway is sin(G.time*1.6+phase), the camp fire is four sines on it, and a dozen idle
animations ride it - so every grass-filled frame varies with how many animation frames the settle
got through. Four vantages already pin it locally (03, 28, 29, 30) and the patch is that same line
applied once in QUIET at the same value, 12.0.
AND THE GAME FILE ALREADY EXPECTED IT. The purse keys on G.frames rather than G.time, with the
comment "the photographer pins G.time in QUIET and a pinned clock would collapse every frame into
one purse" - so the defensive work was done a session before the pin existed. nightT is a separate
driver, so the night vantages are unaffected.
WHAT IT BUYS, MEASURED WITH crossrun.mjs OVER FIVE SWEEPS, both patches in, cross-run churn per
vantage before -> after:
    19_roof_follow  4168 ->    0     28_skifield_base  453 ->   0
    29_lodge_deck    229 ->    0     30_groomed_band  1597 ->   0
    24_verge_paddle 1922 ->    1     15_sign          1924 ->   2
    14_player_view  3872 ->    5     08_readability   1480 ->   5
    02_hut_snow     2575 ->    6     11_trailhead     4446 ->   7
    05_tussock_grnd 2775 ->    8     01_carpark_wide  3996 ->  11
    18_rear_close   3909 ->   13     04_flight_undwng 3086 ->  14
    16_trish        1700 ->   15     25_preen_follow  2801 ->  15
    21_night_camp   2399 ->   21     07_jam           2865 ->  24
    03_kea_plate    3033 ->   37     10_skifield      5822 ->  72
    17_flight       1951 ->   92     06_skyline       8791 -> 130
    23_paddock_gate 1252 ->  181     13_idle_preen    6932 -> 229
    22_torch_beam   5308 ->  395     12_seal_midpeel  3123 -> 703
    09_colossal     2233 ->  820     20_dead_rear     5489 -> 2114
NINETEEN OF TWENTY-EIGHT UNDER 100 PIXELS AND FOUR AT EXACTLY ZERO, from a set whose worst was 8791.
That is the target TODO 33 named - a changed-pixel count near zero - reached. What is left is named:
20_dead_rear is TODO 69 (its camera is live and eases), 09_colossal keeps its own popups by design
(the __keaFeedKeep exception), and 12_seal_midpeel at 703 is the only one still unexplained.
WHAT IT COSTS, AND WHY IT IS YOURS. diff.mjs goes to 11 flagged, worst 0.8467. The session-3 note
said "every frame moves slightly" and slightly is wrong: pinning the clock freezes POSES, not just
the sway, because the idle animations are sines on G.time. 13_idle_preen 0.8467, 14_player_view
0.8884, 16_trish 0.9166, 19_roof_follow 0.9491, 12_seal_midpeel 0.9617, 20_dead_rear 0.9623 and five
more under the bar. subjects.mjs still reads 15 checked 0 missing, so nothing has lost its subject -
the birds are all there, in different phases of their idles.
12.0 IS A FREE PARAMETER AND YOU MAY WANT TO CHOOSE IT. Any value freezes the poses somewhere; 12.0
is only the value the four existing local pins use. If you would rather disturb the pinned set less,
the value is one number in the patch and worth a sweep before the re-pin.
RE-PIN: all 28, ONCE, judged, in daylight, together with TODO 67 out of the same patch.

### 31. a-tripwire-that-can-see-shading  (harness-side only)
Found in session 3 by piece 9. The facet-normal smoothing changed the shading of EVERY curved hull
in the game and diff.mjs flagged nothing: worst 0.9865 (18_rear_close), then 0.9900 (12), against
a 0.965 threshold. Measured numerically the change is large - max channel delta 108 on vantage 12,
17396 pixels shifted by more than 6 levels - and at a crop of the caravan roofline corner the
before/after is night and day.
So SSIM at 0.965 cannot police a shading change. This is the THIRD blind spot in the same family:
a birdless frame is perfectly stable (piece 4), an unstable frame reads as permanent drift (piece
29), and now a global re-shade reads as no change at all.
OPTIONS: a second tighter threshold band that WARNS rather than fails (say 0.995) so global
subtle changes surface; or a dedicated shading check that samples a few known curved-hull crops
and compares gradient smoothness rather than whole-frame SSIM.
PROOF: whatever ships must flag the piece-9 before/after pair, which is a ready-made test case -
the baseline currently holds the banded shading and the working capture holds the smooth one.
THE INSTRUMENT ALREADY HAS A RECIPE, worked out as a one-off in session 6 and left here so nobody has
to invent it again. Two ffmpeg passes per frame, no new dependency (diff.mjs already shells to ffmpeg):
  changed-pixel count, pixels differing by more than 8 grey levels -
    ffmpeg -i FRESH -i BASE -lavfi \
      "blend=all_mode=difference,format=gray,geq='if(gt(p(X\,Y)\,8)\,255\,0)',signalstats,metadata=print:key=lavfi.signalstats.YAVG" \
      -f null -            then pixels = (YAVG/255) * width * height
  worst amplitude -
    ffmpeg -i FRESH -i BASE -lavfi "blend=all_mode=difference,format=gray,signalstats,metadata=print:key=lavfi.signalstats.YMAX" -f null -
SESSION 6 READINGS against the pinned baselines, build e19fcd5a (four game pieces, none of them
visual): 09_colossal 0 px / max 0, 15_sign 2 px / max 15, 08_readability_320 26 px / max 32, and
everything else between 1031 (19_roof_follow) and 9315 (07_jam). Those big numbers are the item-33
cross-run churn, not drift - compare item 33 own figures for the SAME build across runs (07 at 8919,
13 at 4182, 19 at 3349, 23 at 1184, 08 at 1477, 22 at 2645). Note 08 came in at 26 rather than 1477
this time, which is one sample and not a trend, but it is the kind of thing a real instrument would
track. THE WARNING BAND SHOULD THEREFORE BE PER-VANTAGE, not global: a threshold that flags 07 at
9000 flags nothing useful, while 09 and 15 should scream at three figures.

## FOUND IN SESSION 4 (appended 2026-09-01 by the overnight run)

### 32. rbox-bevel-swallows-wall-detail  (AUDITED session 12 — the fix is still a judged look sweep)
Found by piece 10, which nearly shipped a door sealed inside the caravan. rbox is an
ExtrudeGeometry and three expands the shape by bevelSize (r*0.92) on the two SHAPE axes while
leaving the EXTRUDE axis EXACT. So rbox(w,h,d,r) really measures (w + 1.84r) x (h + 1.84r) x d.
MEASURED on the campervan shell, rbox(2.4,2.1,5.6,0.3): actual extents 2.952 x 2.652 x 5.600, so
the flank is at x 1.476 and not the nominal 1.2. Everything mounted on that flank at nominal
offsets is therefore INSIDE the van: side window frames at 1.225 (faces 1.282), their panes at
1.25 (1.297), awning rail at 1.23, roof gutter trim at 1.22, green accent stripe at 1.326,
charcoal pinline at 1.301 - against a skin of 1.464 (skirt) to 1.476 (shell). VISIBLE in vantage
12: the caravan flank is blank white, and the green stripe and black skirt appear only as short
bands on the FRONT face, where they poke past the z cap because they are 5.7 long against a 5.6
shell. Piece 10 fixed only the door assembly (frame, door, pane, handle, step, seal bead).
WHY IT IS NOT A ONE-LINER: the fix is a reposition of every flank detail onto the measured skin,
per body, and the same arithmetic applies to any other rbox-shelled body with detail mounted on a
SHAPE axis - the ute and the hut want auditing before anyone believes this is caravan-only. That
is a sweep with a look to judge on every frame it touches, not a swap.
DO NOT "fix" it by shrinking r or by subtracting the bevel inside roundedBoxGeo: r is what gives
the toon bodies their radius, and the extents are load bearing for colliders, blob shadows and
G.vanTop, all of which were authored against the shapes as they actually render.
PROOF once built: the piece-10 scanline is the ready-made instrument - cut every triangle of the
body by the plane y=Y, cut that segment at the detail z, take the biggest x - so assert every
registered flank detail has its outer face proud of the skin at its own height.
RE-PIN: 12, 18, 20 and any caravan or ute vantage. Leave flagged for Eric.
AUDITED IN SESSION 12, and the answer to the question this item asked - is it caravan-only - is NO.
audits/2026-08-28/audit-bevel-flanks.js reports it; BEVELALL=1 prints every row. It is deliberately
not a gate battery, because 32 is unfixed and an assertion here would be red by design.
    NINE extruded bodies carry detail. 161 buried thin faces: 88 on x, 52 on y, 21 on the extrude
    axis z - so the shape axes carry SEVEN TIMES the burial of the exact one, which is the control as
    much as the finding. 52 panels are PROVABLY wrong rather than heuristically: they stand proud of
    the skin on z and inside it on x or y, so one authored margin works on the exact axis and fails
    on the bevelled ones, and the intent is on the record in the geometry.
    THE CARAVAN reproduces this item own numbers exactly - shell 2.952 x 2.652 x 5.600, skin x 1.476,
    with 42 buried faces on x including 1.282, 1.278, 1.257 and 1.245, which is the window frame,
    pane, awning rail and trim list above measured from the other direction.
    THE HUT IS THE CLEAN WITNESS, and it is one object rather than a list. rbox(7,2.6,5.4,0.1) really
    measures 7.184 wide, and the five weatherboard lines are box(7.02,0.02,5.42): their x faces sit
    at 3.510 against a skin of 3.592 - BURIED 0.082 - while their z faces sit at 2.710 against 2.700,
    PROUD 0.010. The same mesh, one +0.02 margin, visible on two walls of the hut and sealed inside
    the other two. Nobody has ever seen the grooves on the long walls.
    THE SKI FIELD BUILDINGS ARE IN IT TOO (no brief asked; the audit walks the scene rather than a
    handle list), as are the four parked cars, whose buried faces are mostly on y and mostly bumpers.
WHAT IS STILL YOURS: the fix. Every one of these is a reposition onto the measured skin and a look on
every frame it touches, which is what this item said from the start. The audit only means nobody has
to guess the scope any more: 52 provable panels across nine bodies, not one caravan door.


### 33. session-to-session frame instability  (harness-side only — game file untouched)
Found in session 4 by the piece-10 full sweep, and it is a THIRD instability class, not a restatement
of items 29/30. Measured by checking out the pre-door build d5c59486, reshooting, and comparing those
frames against the baselines that were themselves shot from d5c59486 in session 3 - so same build,
same staging code, different capture run:
    08_readability_320   1477 px differ by >8 grey levels, max delta only 29
    22_torch_beam        2645 px, max delta 102
    15_sign                 1 px  (reproduces perfectly - so this is NOT universal)
Both offenders read ZERO px take-to-take inside a single capture run. That is the whole point: the
frame is perfectly reproducible against itself in one session and unreproducible across sessions.
WHY THE EXISTING INSTRUMENTS CANNOT SEE IT: stability.mjs compares takes WITHIN a run (FLAKES law 12
is explicitly "takes compared against each other"), so it reports these frames as clean - and it did,
08 at 0.9983 and 22 at 0.9970 after the law-5 fix. diff.mjs compares against the baseline and cannot
tell this apart from real drift. And the amplitudes are low (29 and 102) spread over a wide area,
which is the exact blind spot recorded in item 31 and in the session-4 correction to item 30, so SSIM
rounds it away. A changed-pixel count with a per-cell map is what caught it.
SUSPECTED CAUSE, NOT YET PROVEN - do not fix on this basis without measuring: the frames that fail
this test are the ones whose content depends on accumulated simulation state rather than on a pose
that gets PINned every frame. 07_jam (8919 px vs baseline, door provably out of frame), 13_idle_preen
(4182), 19_roof_follow (3349) and 23_paddock_gate (1184) show the same signature. Traffic positions,
idle-animation phase and ambient-human paths all advance during boot and settle, and how far they get
depends on machine load - the same mechanism as law 5 and law 12, one level up.
PROOF once built: the contract is a CROSS-RUN one, so it needs a separate instrument from
stability.mjs - shoot the set, quit the browser entirely, shoot it again in a fresh process, and
assert the changed-pixel count per frame is near zero. Cheap to write and it turns a whole class of
"mystery residual" into a named number.
RE-PIN: whatever the fix moves, ONCE, judged. Leave flagged for Eric.
NOTE: 08 and 22 were pinned in session 4 against 006ae2 anyway, because the caravan door is genuinely
in frame in both and they were stale on that ground. Their session-to-session churn is unfixed and
will still be there.

## FENCED FOR PLAYTEST (never overnight)
Par values, timer defaults, DECAY/BOTCH feel, catch balance, results-screen
look, mode-select copy. The machinery above gets built; the couch tunes it.

## SESSION-2 FOLLOW-UPS (appended 2026-08-31, evening)
RUN ORDER NOTE: take pieces 26 and 27 immediately after piece 10, before
the mode pieces — both are small and both raise the quality of every
judgement that follows.

### 26. followcam-preen-vantage  (harness-side only — game file untouched)
Piece 6 is certified against a metric, but the original complaint named the
FOLLOW camera and no vantage stages the preen from behind-and-above. Add
vantage 25_preen_follow: stage the preen mid-cycle, camera at follow-cam
distance behind and above the bird. Pin it, add it to the diff set, and add
a subjects.mjs presence check for the head/beak region so the set can judge
the actual complaint from now on.
PROOF: vantage captures, pinned, listed in diff + subjects output.
RE-PIN: the new frame itself — leave flagged for Eric's first judgement.

### 27. seeded-grass-tint
buildGrass colours blades with Math.random rather than the seeded rnd(), so
object-count changes tint the field slightly — the entire residual tripwire
noise (worst 0.977). Move blade tinting onto rnd().
PROOF: two headless builds on the same seed produce identical blade tint
sequences; diff noise on grass vantages drops to ~zero afterwards.
RE-PIN: expect a ONE-TIME flag on grass-heavy vantages from the tint
reshuffle — eyeball, then re-pin the sweep. Permanent near-zero noise after.

## VERDICTS (2026-09-01, Eric)
- TODO 28 (buried snow patches): UNBURY. Slide both patches clear of the
  shed footprint - snow banking against the hut walls is welcome. Judge
  at 10 (and 11 if flagged); leave flagged.

### 34. chapter-travel-beat  — REVERTED session 7 (was 49335b92f810540fbe5e52cfb816929a)
CLOSED. Eric's verdict, TODO 50: the tour absorbs travel wholesale and under the maps design travel
happens BETWEEN MAPS, so the within-map page-turn beat has no future. Reverted in session 7 at
0038af8b3ce396103b14526baf162227 - the game-file and battery halves of 1c096b4 were removed by a
script proved to reproduce that commit's parent byte-for-byte, and the four beat_*.png probe frames
were deleted. Nothing below this line is live work; it is kept because piece 38 quotes it.
THE ORIGINAL NOTE, KEPT FOR THE RECORD: Eric's commission arrived in commit af9111e
while this piece was already patched, proved and gated, and the only mid-session notice I got was the
OVERNIGHT.md half of that commit, so "do not build 34 separately" was not visible until after the
commit landed. It is NOT reverted, because what it builds is the machinery piece 38 specifies -
named anchor table, pure state machine, blend before camLock, fresh-input skip with an arm delay -
keyed by chapter area rather than by biome. Re-keying it to biomes is a rename of the table and its
lookup, not a rebuild. If Eric would rather start 38 from nothing: git revert 1c096b4.
Eric's stated intent: each mission page should FEEL like a different
environment. The world already delivers this structurally (eight areas,
one seamless map - the reference games' own pattern); what is missing is
the presentation. On page turn: brief camera flyover from the bird to the
new area's centroid, area title card ("THE SKI FIELD"), then return.
Skippable with any input. No new areas, no teleports - the bird stays
where it is.
PROOF: headless - page turn sets the travel-beat state with the correct
area target, timer expiry restores camera state, any input skips. Battery
in house style.
RE-PIN: none expected. Feel and timing: leave flagged for Eric.

### 35. G.chaos is read but never assigned  (found in session 5 by piece 12)
The night auto-driver at the `if(!G.nightManual&&!G.night&&G.running&&!G.won&&(G.wanted>=3||G.chaos>=260))`
test reads G.chaos. Nothing in the file ever assigns G.chaos - grep it: one read, zero writes. The
chaos meter is G.score (the HUD literally renders 'CHAOS '+G.score). So `G.chaos>=260` evaluates
`undefined>=260`, which is false forever, and the second half of that condition is dead code: night
can only ever be triggered by WANTED >= 3, never by a big quiet chaos total.
NOT FIXED IN PIECE 12, deliberately - piece 12 needed to know which property is the meter (it uses
G.score) and finding this was a side effect. Fixing it CHANGES WHEN NIGHT FALLS, which is a feel
change on the night vantages (21, 22) and arguably a playtest call, not an overnight one.
TWO HONEST OPTIONS: (a) point the test at G.score, which switches the branch on and makes night
arrive at 260 chaos as the code plainly intends; or (b) delete the clause, which keeps today's
behaviour and stops the file lying about it. (a) is almost certainly what was meant.
PROOF once built: stage chaos just under and just over the threshold with wanted at 0 and assert
G.night flips on exactly one side of it - currently that test cannot be made to pass at all.
RE-PIN: none from the code change itself, but night arriving earlier may change what a playtest
sees. Leave the decision to Eric.
SPLIT AND HALF-DONE, session 11 (65, 9dfe7f3d147d65b4dc639df8775ab575). There are TWO reads of
G.chaos, not one, and this entry treated them as the same item. They are not:
  THE CAREER PEAK - `if((G.chaos||0)>(G.chaosPeak||0))G.chaosPeak=G.chaos` in update - was a dead
  statistic and no feel call at all. Every player has always been shown PEAK 0 on the to-do footer,
  on the win screen and in the save blob. FIXED: it reads G.score, which is the meter.
  THE NIGHT AUTO-DRIVER at `(G.wanted>=3||G.chaos>=260)` is STILL OPEN and still yours, exactly as
  written above. Options (a) and (b) unchanged. Today behaviour is now PINNED by an assertion in the
  everything battery - a quiet 5000 chaos does not bring the night, WANTED 3 does - so the day you
  take option (a) that line goes red and tells you to update it. That is deliberate.

## THE SOUTH ISLAND TOUR (commissioned 2026-09-01, Eric)
DESIGN INTENT, binding on all tour pieces: the game becomes separate maps
- one diorama per biome, each with its OWN mission list, star page, and
look. Level select is a DOC-brochure paper map; stars earned anywhere
unlock later maps (thresholds tunable, playtest). Lineup: CARPARK
(current world, level one) -> SKI FIELD -> CAMPGROUND -> VILLAGE ->
RIVER -> STATION, plus THE NEST as home pin and trophy room where stashed
loot physically displays. GRADUATION RULE: when a biome ships, the
matching Carpark corner (ski/camp/paddock) and its missions MIGRATE
there - one graduation per shipped biome, vantages re-judged by Eric.
VS integration: arena = the loaded map; RANDOM picks any unlocked map,
TOUR runs them in order. Piece 34 (chapter-travel-beat) is SUPERSEDED by
piece 38 - do not build 34 separately.

### 36. tour-chassis  (invisible surgery - first tour piece)  — DONE session 8 (520a4d78a337a9f7f08f9b7e0967d88c)
World build becomes a biome registry, current world = biome "carpark",
boot-selectable; batteries and capture rig gain a biome parameter
defaulting to carpark. No content changes.
PROOF - the whole point: zero observable change. Nine batteries green
without touched assertions; all 25 vantages match pinned baselines; gate
CERTIFIED-SHIP.

### 37. tour-save-and-map
Save schema v3: per-biome progress with v2 migration retro-granting all
current progress to carpark. DOC-brochure level-select map: stamp badges,
star counts, locked pins, unlock thresholds in one tunable table.
PROOF: headless save round-trip + migration; unlock state machine;
boot-into-biome and back. Map look: leave flagged.
DONE session 10 (c1fcfbc6df3b2939d240f8112bb8b38a).
SCHEMA v3: the blob keeps a slot per biome - done, chapIdx, stars, pages, hats, plus the page list
so a pin can say n of m without loading the map - and the career numbers (peak, time, band) stay at
the top because they are the player and not the map. Same storage key, because the key is how a
returning player is identified. migrate() takes any vintage to v3: a v1 or v2 blob described the
carpark, so the whole of it becomes the carpark slot and the slot records the vintage it came from.
AND IT STILL WRITES THE v2 SHAPE ALONGSIDE, as a mirror of the map you are standing in. There are
older copies of this file and one of them opening a v3 save has to find the carpark where it looks
for it; the v2 assertion that promised this was not mine to break. Written, never read - every
reader goes through migrate() to the slots, and the battery holds the mirror to being exactly the
current slot rather than a second version of the truth.
THE COLLISION THIS EXISTS FOR IS PROVED WITH TWO MAPS WHOSE PAGES SHARE A NAME. The stub biome in
the proof builds the carpark, so both slots key their stars by the same area strings - which is what
v2 would have written over. A test with two different chapter lists would not have touched it.
THE BROCHURE IS ONE TABLE: order, copy, pin position, price. Currency is TOTAL stars across the
tour, so a map opens by being good anywhere. FOUR PIN STATES, and they are not the same question -
locked (not paid for), soon (paid for, no builder yet), open (go), current (here). A pin can be
unlocked and unbuilt, and saying GO with nothing to walk into would be the lie. tourPick refuses
with WHY and the price; boot() honours a recorded pick ahead of the default, so the GO button
records and reloads until piece 38 replaces the reload with a flyover.
FIVE SABOTAGES, ALL CAUGHT - but the second one caught NOTHING first time round and that is the
entry worth reading: a write that clobbered every other map came back with zero findings because my
own assertion read blob.biomes.carpark.stars directly, threw, and took every finding after it down.
The session-9 guard rule, five pieces old, and it still got me. Read through an accessor and the
same sabotage lands eight findings.
LOOK IS FLAGGED, per the brief, and there is a frame for it: vantage 26_tour_brochure, NOT pinned.
The pins are decoration and the rows underneath are what you click, because a pin layer that has to
stay hit-testable at 320px stops being a drawing. At 960x540 the sixth row and the BACK button sit
below the fold and the screen scrolls to them - whether the paper should shrink again to fit all six
is a look call. Keyboard path checked in a real browser: M opens, ESC closes, and 1 is swallowed
while the brochure is up so nothing starts behind the map.
NOT BUILT, AND WORTH KNOWING: with one biome registered, GO is unreachable in the shipped game -
every other pin is LOCKED or NOT BUILT YET. The open path is proved headless only until 39 lands.

### 38. tour-travel  (absorbs 34; inherits the Sep 1 investigation)
Leaving via the map: flyover out; arriving: flyover in + level title
card; skippable; camera/control state restored exactly. BINDING EVIDENCE
from the read-only investigation in gauntlet-log (Sep 1): area centroids
canNOT come from hints or mission props (3-4 chapters have none; paddock
resolves 40 units off) - build a per-biome anchor table instead; G.cams
is empty under node so assert the state machine only; the blend must sit
before the camLock line or the photographer loses determinism; skip
needs an arm delay because page turns are input-caused.
BUILD IT FRESH, KEYED TO BIOMES (Eric, TODO 50). Piece 34 is reverted and there is no travel code
left in the file to re-key, so this piece starts from nothing. The BINDING EVIDENCE paragraph above
REMAINS BINDING - it is the Sep 1 read-only investigation, not a description of 34, and every one of
its four findings was paid for before 34 existed. What 34 proved on top of it, worth knowing rather
than rediscovering: the anchor table can be asserted against the build sites in buildWorld so it
cannot drift from the world, and the skip needs to remember which keys were ALREADY down at the open
as well as arming late, because a player mid-waddle has not asked to skip anything.
PROOF: state machine headless incl. skip + restore. Feel: flagged.
DONE session 10 (fdc032709319f9a207d0492077b41da2). Built fresh, keyed to biomes, and all four
findings of the Sep 1 investigation honoured rather than rediscovered.
ANCHORS ARE A TABLE, declared by the biome in the registry beside its builder - not derived from
hints or mission props, which is the binding evidence. What a table CAN be held to is the world it
names, so the battery asserts the carpark look-at sits within 24 of the built prop centroid, above
the ground at its own feet, and pointing down rather than up. Move the carpark and not the line and
an assertion says so.
THE SKIP ARMS LATE AND REMEMBERS WHAT WAS ALREADY DOWN. Two separate locks, and they answer
different questions: a key still held from the press that OPENED the beat has not asked for
anything, so it only counts after being released and pressed again; and a key pressed inside the arm
delay is a real request, so it is not thrown away - it lands the moment the beat arms. Both driven.
THE BLEND SITS BEFORE camLock, and that is provable under node after all. G.cams is empty, but
nothing in updateCams needs a real camera: a stub with a position and a lookAt answers the only
question that matters - with a beat running AND camLock set, camLock wins, look-at included.
THE PAGE LOAD IN THE MIDDLE IS AN IMPLEMENTATION DETAIL. The world cannot be rebuilt in place yet,
so OUT arms an arrival in storage and reloads, boot lands in the picked biome AND STARTS THE RUN IT
LEFT rather than dropping you at a title screen, and startGame consumes the arrival once and plays
IN. The day a biome can be swapped in place, travelOut stops reloading and nothing else changes.
DRIVEN END TO END IN A REAL BROWSER, which is the only place half of this exists:
gauntlet/verify/journey.mjs injects a stand-in ski field into a temp copy so it survives the reload
(and stops injecting the day 39 registers a real one), then opens the map mid-run, clicks GO, and
reads the state across the load. Map opens and PAUSES the world; GO closes it, restores the pause,
runs the OUT beat; the load lands in the ski field with the run going, the card up, and one fresh
press of SPACE skips it.
TWO DEFECTS THE FRAMES CAUGHT, both fixed here because this piece made them reachable: the to-do
list flash sat on top of the arrival card (it now waits for the beat and travelEnd raises it, which
is also right after a skip), and the opening popup called every map A CARPARK (the carpark keeps its
exact wording, anywhere else is named by the registry).
SIX SABOTAGES, all caught - and the first caught NOTHING until I read tv().held through an accessor.
That is the guard rule landing for the THIRD time in one session, in my own new section this time:
held only exists while a beat is RUNNING, so any sabotage that ends a beat early turned the read
into a throw and killed the battery.
AND IT FOUND A FOUR-BUILD-OLD BAD ASSERTION IN SOMEBODY ELSE WORK - mine, piece 20. See TODO 59.
FEEL IS FLAGGED, per the brief, with a frame: vantage 27_travel_card, not pinned - the arrival beat
frozen at u=0.5 with the card up.
NOT REACHABLE IN THE SHIPPED GAME YET, and this needs saying plainly: with one biome registered
there is nowhere to travel to, so no player can trigger any of this until 39 lands. Same shape as
TODO 55. The journey instrument is what stands in for a player until then.

### 39. skifield-biome
First new map: a club ski field diorama - rope tow line, day lodge with
deck, ski racks, groomed band, drifts banked against structures (snow
touches buildings, never buries - the unbury verdict as law).
GRADUATION: Carpark's ski corner + missions migrate here; Carpark
vantage 10 re-staged or retired, Eric judges. All new skifield vantages
are first-pins: shoot, leave ALL flagged.
PROOF: boot-skifield battery in house style; presence checks per new
vantage; migrated missions complete headless in the new map.
DIORAMA HALF DONE session 11 (aff1fa389a8e8ed138299474e77dc028), ADDITIVE ONLY per Eric order.
The graduation is NOT done and is still the piece below.
THE MAP EXISTS AND THE TOUR IS REACHABLE. journey.mjs drives it end to end in a browser: M opens the
brochure mid-run, GO runs the OUT beat, the load lands in the ski field with the card up, SPACE
skips it. 37 and 38 had been unreachable for two sessions.
THREE GLOBALS THAT ONLY LOOKED LIKE CONSTANTS became map declarations, each one TODO 58 a layer up:
the CAST (a live throw - startGame read G.ladder, set only by buildHut, with no guard, so a fresh
load into a hutless map died before the run started; it only ever looked safe because an earlier
carpark boot left G.ladder lying about), the NEST SITE (buildNest reads G.nestPos), and the SNOW
ENVELOPE (SNOWFIELD is the carpark band). Plus a fourth a soak test found and the brief did not
name: THE ROAD. spawnTraffic had the carpark lanes written into it, so the ski field put seven
hatchbacks across the snow at z 34. Lanes are a biome declaration now.
G.snow JOINED THE WORLD REGISTRIES - the last thing a build left on the board.
THE SKI FIELD DECLARES NO CAST ON PURPOSE. Nobody is on the hill until 40 brings the missions the
crowd exists for.
CAPTURE: 25 pinned compared, 0 flagged. Three first pins - 28_skifield_base, 29_lodge_deck,
30_groomed_band - shot and left FLAGGED, per the brief. Five new presence checks, all measured.
STILL A LIE UP THERE, AND IT IS 40: defineMissions is biome-blind, so the ski field shows the
CARPARK to-do list. Same class as TODO 55. s_lift is the one carpark mission this map can honestly
answer, because it has a tow wheel.

### 39b. skifield-graduation  (JUDGED - Eric only, never overnight)
The other half of 39, unchanged and unattempted: the carpark ski corner and its five missions
(s_ski, s_pole, s_binding, s_goggles, s_lift) migrate to the ski field, carpark vantage 10 is
re-staged or retired, and every baseline is re-judged.
WHY IT IS NOT AN OVERNIGHT PIECE, twice over: propAt keeps a deliberate rnd draw per prop (TODO 47,
_ryUnused) PRECISELY so the country does not move, so deleting five props shifts every later draw
and reshuffles grass, snow, tussock and beech across all 25 baselines. And it takes five missions
and a star page out of a live save.
DO IT AFTER 40, so the missions have a home to graduate INTO rather than being deleted from one map
and reinvented in another.

### 40. skifield-missions
8-12 missions incl. the graduates. Signatures: tray-slide down the
groomed band (new chaos verb), rope-tow ride, goggle heist, deck lunch
raids (VS consumable sources), buried-lunchbox digs. Star page wired;
coop badges where a mission wants two birds.
PROOF: mission batteries; star grants both sides; TAB shows the page.
DONE session 11 (1ba30ea41fe5df6e624f3919ad4cfad9) - THE LIST AND THE SEAM. Eight jobs and a finale on
two pages (THE ROPE TOW, THE DAY LODGE), a coop row for two-bird runs, star page wired, and TAB
proved in a real browser because renderTodo returns immediately under HEADLESS.
THE SEAM IS THE PART THAT WILL MATTER FOR 41-44: the list is declared beside the builder, and three
things in the engine had the carpark written into them - missionDone unlocked the mission whose id is
literally apex WITH NO GUARD (a throw for any map without one), checkFinale WAS the carpark sentence
(four in pursuit, then the nest, which a map with nobody on it can never satisfy, so arm() and
check() are declared with the mission), and checkMisc was carpark detectors behind a carpark guard
(a mission may carry its own check() now).
NOT ONE ID APPEARS ON BOTH MAPS, asserted against the carpark list itself, and every mission id on
every ski field prop is held to being one this map declares.
THE GRADUATES ARE NOT HERE, because they are 39b and judged: nothing was moved off the carpark.
THE SIGNATURE ACTS ARE NOT HERE EITHER, and that is 40b below.

### 40b. skifield-signature-acts  (the verbs, filed session 11 by piece 40)
What the 40 brief names that a list of eight place-and-prop jobs could not honestly cover:
- THE TRAY-SLIDE down the groomed band. A NEW CHAOS VERB, which is the biggest single item: the roof
  luge already exists (colliders with slide:true, G.slideV on the kea) and the piste is a 20x74 band
  at y 0.1 with no collider at all, so the verb needs either a slide-zone collider kind that is not a
  roof or a ground-level slide state. Judge the feel; it is the signature act of the whole map.
- THE TOW RIDE. Grab the rope at the bottom and be carried up. Needs a carry state on the kea that is
  not the perch idiom and a rope path to follow - the spans are already a table (SKITOW).
- THE DECK LUNCH RAIDS, which need a CAST to steal from (the ski field declares none by design) and
  food props, which shadow a counted economy if they are put out carelessly (FLAKES law 6) and are
  the VS consumable sources, so this one lands on top of piece 21 work.
- THE BURIED LUNCHBOX DIGS. A dig verb against the drifts, which are registered records with a
  radius and a slid distance already - G.snow up here is inspectable, unlike the carpark patches.
One piece each, and none of them is a diorama change: 39 built the furniture they all need.

### 41-44. RESERVED: campground, village, river, station
One biome briefed at a time, only after its predecessor ships and its
graduation is judged. Never improvised from the intent paragraph alone.

## FOUND IN SESSION 6 (appended 2026-09-02 by the overnight run)
NUMBERING: Eric's South Island Tour commission (36-44) landed mid-session and took the numbers I had
just used. He keeps 36-44 including the 41-44 reservations; my two findings are 45 and 46. Same
handling as the session-5 collision on 34.

### 45. THE BATTERIES ARE UNSEEDED, WHICH IS THE LAW-11 INTERMITTENT  — DONE session 6 (harness-side, game md5 unchanged; 0/40 both offenders, zero assertions touched)
Laws 11 and 13 blamed a cold or contended node process for two unreproduced red batteries. Session 6
measured the rate against BUILD instead of shrugging: harness-systems.js fails 3 times in 40 runs on
the OLD build ccd4782 and 1 in 40 on the new one, and the failing assertion MOVES between runs
(b_five, then b_beanie). Pre-existing, roughly 2-8 percent per battery per run, and not the code.
CAUSE: RNGF=Math.random by default and NOT ONE battery calls setSeed, so every battery builds a
different country and throws every dropped prop differently - spawnLoose gives each prop
vy=rnd(1.4,2.4), vx=rnd(-1.2,1.2), vz=rnd(-1.2,1.2). Every failure seen so far is a mission whose
driver must grab ONE named prop out of a randomly thrown pile: 'can' out of a bin that spits a shiny
can plus six rubbish into the same half metre, b_five counting five shinies into a nest, b_beanie
taking a hat off a sleeping head. capture.mjs already solved exactly this problem for frames, by
seeding the game rng at its own boot - the batteries never got the same treatment.
NOT PROVEN, AND SAY SO: 16 seeded reruns of the isolated 'can' driver all passed (the can lands 0.63u
from the pinned bird every time), so the failure needs the full battery's accumulated prop scatter,
not just the bin. Consistent with the theory, not a demonstration of it.
WHY IT IS NOT A ONE-LINER: setSeed before boot changes WORLD GENERATION, so every existing assertion
in all nine batteries is potentially re-based - positions, counts, which prop is nearest what. The
piece is: seed each battery at a named constant, run the full gate, and fix or re-base whatever moves,
one battery at a time. The prize is large - the gate becomes reproducible, a red means something, and
laws 11 and 13 can be retired rather than worked around.
PROOF once built: the same 40-run measurement, and it must read 0/40. Keep the instrument.

### 46. gate.sh PASSES A BATTERY THAT CRASHES  — DONE session 6 (harness-side, game md5 unchanged)
Found in session 6 by adversarial sabotage C on piece 34: an unguarded read in a battery threw a
TypeError, and the battery printed no findings line at all. gate.sh does
`node $h | grep -v THREE.Material | tail -1` then `grep -q "✗\|FINDINGS"` - a stack trace matches
neither, so a battery that dies on its first assertion is indistinguishable from one that passed.
The batteries already set process.exitCode, and the pipe throws it away.
FIX: assert POSITIVELY rather than negatively - every battery must print its own "ALL PASS" line, and
the count of ALL PASS lines must equal the count of batteries. That also catches a battery file that
is missing, renamed or silently skipped, which the current grep cannot see either.
PROOF: the ready-made test case is any battery with a deliberate throw in it - the gate must go red.

### 47. propAt DRAWS A ROTATION FOR EVERY PROP THAT NOTHING EVER READS  — DONE session 7 (4c29df092d4cf33cf5ee0f3b2524730b)
Closed with option (b), the free one: the field is renamed _ryUnused and the draw is untouched, so
the seeded world does not move - 25 vantages, 0 flagged, is the evidence. Option (a), applying it,
remains open and remains a judged art call: every prop in the game would turn.
NOT STRUCK - PLEASE RE-READ, ERIC. TODO 50 says to strike 47 and 48 as moot because they judge the
reverted feature. Neither of them touches it: both were filed in session 6 by piece 17
(home-positions), which is shipped and not reverted, and neither mentions the travel beat. The two
findings the travel-beat commit itself filed were numbered 36 and 37 in its own commit message and
were renumbered to 45 and 46 - both are DONE, and both are the gate and battery infrastructure the
rest of the diet now stands on, so neither is moot either. Session 7 left all four alone rather than
delete a live finding on what looks like a numbering slip. Strike them in one line if you meant it.
Found in session 6 by piece 17. propAt sets ry:rnd(0,6) on every prop and no code path applies it to a
prop mesh - ry is the kea and human convention (this.ry drives g.rotation.y for those), not the prop
one. Props are built axis-aligned unless a build site rotates the mesh itself, which two do (the skis,
rotation.x=1.35). So every prop in the world carries a random number that means nothing, and piece 17
had to record the MESH transform instead to get an honest spawn rotation.
DO NOT JUST DELETE THE DRAW. Every later rnd() in the browser is downstream of it, so removing one
draw shifts the seeded stream and repins the whole world - the snow-patch lesson from session 5. The
honest options are (a) apply it, which is a visual change to every prop in the game and therefore a
judged art call, not an overnight one; or (b) keep the draw and rename the field so it stops looking
like something that works - _ryUnused, or a comment at minimum. (b) is free and (a) might be nice.
PROOF once built: for (a), assert every prop mesh rotation.y equals its own p.ry after build, and
re-pin every vantage with props in it. For (b), nothing to prove but the md5 and the unchanged frames.

### 48. harness-everything BOOTS THE GAME TWICE, so half its sections run against a doubled world  — DONE session 7 (20ee30e813a75df2f132024da35c35b3)
Fixed with option (b), the one the note calls the real answer: buildWorld empties the registries it
fills, so a second boot replaces the world instead of stacking another on it. Option (c) was not
taken - moving the snow section would have hidden the bug rather than fixed it, and left the next
battery to rediscover it. The proof could not be written as this note wrote it: see the log.
NOT STRUCK - see the note under 47. Still live, and independent of the travel beat: the double boot
is in the snow section, which the revert did not touch, and it still doubles every registry from
that line on. Session 7 confirmed it survives the revert - the battery is 182 lines shorter and the
snow section reboots exactly as before.
Found in session 6 by piece 17, which could not make a build-time assertion about props until it
worked out why there were four skis. The snow section calls X.boot() a second time (it wants a fresh
world for its resolver sweep), and boot() runs buildWorld() again WITHOUT clearing G.props, G.inter or
G.colliders - so from that line on the battery has two of every prop, two of every interactable and two
of every collider in its registries. Nothing currently asserted depends on a count, which is the only
reason this has never bitten; piece 17 worked around it by snapshotting the build-time truth at the
first boot and asserting against the snapshot.
WHY IT MATTERS BEYOND TIDINESS: any future assertion of the form "there are N of these" is silently
wrong after that line, and a find() that expects to get the only one of something gets whichever
duplicate is first. It also means the sections after it are testing a world the game can never be in.
FIX OPTIONS: (a) make the snow section use a second rig instance instead of re-booting - but note
rig.load() replaces global.localStorage, which would wipe the save the earlier sections wrote; (b) give
boot() an idempotent guard or a teardown that empties the registries first, which is a game-file change
with the whole gate behind it; (c) move the snow section to the top, before anything else runs.
(c) is free and (b) is the real answer.
PROOF once built: assert G.props.length after the last section equals the count after the first boot.

### 49. ratify-flakes-11-13  (RUN ORDER: take this FIRST tonight)
Session 6 proved laws 11 and 13 misattributed the intermittent - it was
never cold node, it was unseeded battery worlds (3/40 on the old build,
0/40 seeded). Eric ratifies: apply the proposed wording from REPORT.md
section 2 to FLAKES.md VERBATIM, as its own commit, quoting exact
before/after lines in the commit message and log.
PROOF: new wording present, disproven claims gone, no other line changed.

### 50. revert-travel-beat  (RUN ORDER: second tonight, after 49)
Eric's verdict: piece 34 is REVERTED. The tour (piece 38) absorbs travel
wholesale, and under the maps design travel happens BETWEEN MAPS - the
within-map page-turn beat has no future. Revert commit 1c096b4 cleanly:
resolve any overlap with later pieces (45/46/13/14/17), preserving THEIR
behaviour exactly; remove the travelcard DOM/CSS and beat machinery;
retire the beat_hold capture and its staging; strike TODO 47 and 48 as
moot (they judge the reverted feature); annotate piece 38 that it builds
travel fresh, keyed to biomes - its binding-evidence paragraph remains
binding.
PROOF: no travelcard/beat code remains; all nine batteries green; gate
CERTIFIED-SHIP; star and home-position proofs still pass untouched; diff
flags nothing new.

### 51. VANTAGE 08 DOES NOT RESHOOT THE SAME TWICE  — DONE session 8, BUT NOT FOR 08 (harness-side, game md5 unchanged)
OUTCOME: 03, 05 and 23 are fixed and are FLAGGED for judging. 08 - the vantage this item is named
for - is NOT fixed and was deliberately left alone; it is review-tier under FLAKES law 8 and the
evidence is below. The session-7 table that started this over-classified: it read three takes once,
and one sweep cannot classify a vantage.
    vantage   before (4 sweeps x 5 takes)              after
    03        0.9943 0.9974 0.9974 0.9974              0.9998 0.9998 0.9998
    05        1.0000 0.9983 0.9947 0.9984              0.9998 1.0000 0.9998
    23        0.9980 0.9980 0.9980 0.9978              0.9995 0.9997 0.9997
    08        0.9978 0.9978 0.9978 0.9995   pinned ->  1.0000 0.9879 0.9983   (no better, one worse)
THE FIX FOR THE THREE is the law-12 idiom 21 and 25 already use and 53 proved on 17: wrap the staging
in PIN and pin G.time, so the bird cannot drift and the grass shader cannot sway. Frames change - the
sway freezes - so all three are left FLAGGED and NOT re-pinned.
WHY 08 RESISTS, and this is the useful part. The probe stages 08 exactly as capture.mjs does, pinned,
and reads state back five times: the bird, BOTH prompt strings, the wrapped line counts, the docked
flag, the plate height and the chaos readout are all identical, and only the frame count moves (140
to 142). Everything this rig can name is already deterministic. What is left is dt-driven per-frame
accumulation on a 320x180 canvas, where two frames of drift is a visible number of pixels. The fix is
a deterministic frame clock for the whole rig - TODO 33 - and it re-pins every vantage.
SESSION 9 ADDS A SECOND CONFIRMATION AND A FIFTH NAME. The full sweep on the VS build read 24 of 25
clean, with only 12_seal_midpeel flagged at 0.9941 on four takes - and then 0.9988, 0.9980, 0.9951
across three sweeps of five. Borderline, sitting ON the threshold, exactly like 03/05/08/23 did
before them. That is now twice that a single sweep has named a vantage that repeated sweeps clear, so
the rule is not a one-off observation: NOTHING IS UNSTABLE UNTIL THREE SWEEPS AGREE IT IS. 12 is not
fixed and should not be, until somebody has a reason beyond one reading.
DO NOT PIN 08 FOR THE SAKE OF PINNING. Changing a baseline frame that buys no measured stability is a
cost with no purchase, and it was measured twice.
Found in session 7 by piece 50, which it very nearly got blamed on. 08_readability_320 flagged at
ssim 0.9446 against its baseline on the first pass after the revert. Three takes on each build,
compared pairwise, cleared the code: within-mine 0.9884-0.9994, within-HEAD 0.9927-0.9979, ACROSS
builds 0.9798-0.9994 - the across-build spread sits inside the within-build spread, so the two
builds are indistinguishable and the flag was a bad take. stability.mjs agrees: 08 alone, four
takes, worst 0.9936 against the 0.995 threshold.
THE CAUSE IS FLAKES LAW 12 AND IT IS VISIBLE IN ONE LINE OF capture.mjs. 08 stages with
`k.x=4;k.z=16;k.y=0;k.grounded=true;k.ry=2.6` and NO PIN() wrapper, so the bird is set once and then
lives through the whole settle - and 08 is a 320x180 HUD shot, where the prompt plate and the TAB
pill are driven by what the bird is standing next to. A bird that drifts changes the HUD text, and a
few characters of changed text is a large SSIM move on a frame that small.
WHY IT MATTERS MORE THAN THE USUAL NOISE: session 6 measured 08 at ssim 1.0000 and 26 changed pixels
and named it one of the three genuinely reproducible frames in the set, which is exactly the reading
a lucky take gives you. It is currently the tripwire most likely to accuse an innocent piece.
FIX: wrap the staging in PIN() like 09/21/22 do, and pin whatever the HUD reads as well as the bird.
Then confirm with stability.mjs, which is the instrument that can answer this and diff.mjs is not.
PROOF: stability.mjs 08 at TAKES=5 comes back above 0.995; diff unchanged or re-pinned once with the
reason recorded. Game md5 unchanged - say so in the commit message.
NOTE FOR TODO 5 (hud-tab-reflow), which re-pins 08: land this first or the re-pin pins a coin toss.

FULL SWEEP, SESSION 7, on the final build 4c29df092d4cf33cf5ee0f3b2524730b - all 25 vantages, three
takes each, compared against EACH OTHER (baseline out of the picture). Five do not reshoot the same:

    17_flight            0.9024   <- thirty times worse than the next one, and it PASSES the
                                     baseline diff at 0.9989. That number is a coin toss.
    08_readability_320   0.9922
    23_paddock_gate      0.9929
    05_tussock_ground    0.9931
    03_kea_plate         0.9943
    every other vantage  0.9959 to 0.9999

17 IS SOLVED - BUT NOT BY THE SETTLE, AND THE PARAGRAPH THAT USED TO SIT HERE WAS WRONG. It claimed
the fix was to give 17 the {settle:900} that 04 passes. shot() reads `o.settle||900`, so 900 IS THE
DEFAULT and 04 passing it explicitly is a no-op: the two vantages always had the same settle, and
the 0.9958 that seemed to confirm it was a lucky sweep of the unchanged build. Corrected and fixed
in session 8, piece 53. The real cause was read off the rig instead of reasoned about: five takes
reported the BIRD identical at read time - flapPh, flapDrive, y, ry and the wing transform agreeing
to nine decimal places - while G.time came back between 2.3509 and 2.3843. The bird was never the
variable, the ground was, and TODO 30 had already measured the same thing from the other end (the
grass shader sways on uTime). Pinning G.time in 17 alone: 0.9980 to 0.9999 across seven sweeps.
The other four (08, 23, 05, 03) all stage the bird ONCE with no PIN wrapper, which is FLAKES law 12
in its plainest form. Whether they want a PIN, a longer settle, or both is one measurement each -
run stability.mjs after every change, because diff.mjs cannot answer this question at all.

### 52. THE CAGE HINT STILL TELLS A CO-OP BIRD TO MASH ITS WAY OUT  — DONE session 8 (d72bec482c1ec516c985c9c35b060008)
Fixed with option (b): hint text is RESOLVED WHEN READ, so a hint that depends on the mode is a
function rather than a baked line, and the ownership-of-G.hints question option (a) raised does not
have to be answered at all. Strings still work and are still the normal case. See TODO 55 for what
this turned up: the hint has never been displayable.
Found in session 7 by piece 15, and deliberately not fixed there because it is a world hint rather
than the cell. startGame adds hint 'cage' at the ute with the text 'the night ranger cages
troublemakers - a mate pecks the latch, or mash your way out'. Under the co-op cell the second half
of that is false: mashing squawks and buys nothing. A caged bird no longer reads it (the co-op cell
writes the prisoner plate itself) but a FREE bird standing near the ute still does, and it is being
told something untrue about how to help its mate.
NOT A ONE-LINE FIX, WHICH IS WHY IT IS FILED. addHint returns early when a hint with that mid already
exists, and nothing clears G.hints between runs - so a solo run followed by a co-op run keeps the solo
wording, and mode-aware text set at build time is unreliable by construction. The honest options are
(a) clear or re-text the hint in startGame, which means deciding who owns G.hints across a restart, or
(b) give the hint a function for text the way the prompts have, evaluated when it is read.
PROOF once built: solo run then co-op restart, assert the hint the free bird reads matches the mode
it is actually in - which is the assertion that fails today.

### 53. settle-17-flight  (one line + a flag)
Session 7 measured it: 17_flight passes the pinned diff by luck (0.9882)
while reshooting at 0.9024 take-to-take; 04 stages identically but passes
settle:900. Apply the same settle to 17. Do NOT touch the four mildly
unstable vantages (08, 23, 05, 03) - they belong to piece 51's table.
PROOF: take-to-take stability >= 0.995 across repeated reshoots.
RE-PIN: none - leave the new 17 flagged for Eric's weekend judging.
DONE session 8 (harness-side, game md5 4c29df092d4cf33cf5ee0f3b2524730b unchanged) - BUT NOT THE WAY
THIS BRIEF SAYS, because the brief inherited a wrong diagnosis of mine. settle:900 IS the default
(shot reads `o.settle||900`), so applying it to 17 is a no-op and 04 has never differed from 17 in
that respect. The cause is time-based ambient animation, not the settle and not the pose: the probe
found the bird identical across takes to nine decimal places while G.time varied. 17 now pins G.time
in its PIN body, the law-12 idiom 21 and 25 already use. Seven sweeps of five takes: 0.9980-0.9999.
The four mildly unstable vantages were NOT touched, per the brief. 17 is flagged and not re-pinned.

## RUN ORDER (ratified by Eric, 2026-09-02)
53 -> 51 -> 52 -> 36 (tour-chassis) -> 22 (vs-match-scaffold) -> 18-21
(restore verbs) -> 23-25. Rationale: instruments first, then the maps
foundation, then the stage before the actors.

### 54. THE flapDrive PIN ON 17 IS INERT, AND THAT FRAME IS A GLIDE, NOT A FLAP
Found in session 8 by piece 53, while probing what actually varies on 17. The PIN chain is registered
AFTER the game loop, so it runs after update() and render(); the game zeroes flapDrive every frame
because the flap key is not held, and the pinned flapDrive=1 never reaches an animate() call. The
probe reads the wing sitting at the flapDrive=0 glide targets - rotation.z -0.300, userData.open
1.000 - so the vantage named 17_flight, whose comment says the wings read mid-beat, is photographing
a glide. The pinned flapPh=1.1 is inert for the same reason.
04 DOES NOT HAVE THIS PROBLEM and shows the fix: it calls KEAGAME.press(P1MAP.flap), so the GAME sets
flapDrive=1 every frame and the pose is the real flap branch. One line, same as 04.
NOT DONE IN 53 because it CHANGES THE FRAME - the wings would go from glide to mid-downstroke, which
is a different photograph and a judged one. It also wants deciding alongside whether 17 and 04 should
read differently at all, given 04 is the underwing shot.
PROOF: probe the staged page and assert flapDrive is 1 and the wing is off its glide targets at read
time; then stability >= 0.995 across repeated reshoots.
RE-PIN: 17, once, on Eric's judgement.
DONE session 10 (harness-side, game md5 df4ae7c6cdee29c3a0bbe3aa7f514f24 unchanged). One line, the
same one 04 has always had. THE PROOF THIS BRIEF NAMES CANNOT WORK, THOUGH, AND THAT IS MY OWN ERROR
FROM SESSION 8: flapDrive ALREADY reads 1 at read time while inert, because the PIN writes it back
after render - reading it is reading my own pin, not the game. The honest witness is the pose, and
the sharpest part of it is head.rotation.x, which animate ASSIGNS rather than lerps
(`H.rotation.x=this.flapDrive?-0.1:-0.2`), so it is exactly what animate last saw. Five takes each
side, off a probe that is capture.mjs with the shutter swapped for a state read so the staging cannot
drift from the rig: head.rotation.x -0.200 -> -0.100, wing.rotation.z -0.300 -> -1.171,
wing.rotation.x 0.000 -> -0.120, open 1.000 -> 0.998, and _beatT - the flap audio cadence, game-owned
and unpinned - goes from absent to 0.02-0.04. Stability three sweeps of five takes: 0.9997, 0.9972,
0.9976, bar 0.995. Subject tripwire still green, 442 kea pixels against a floor of 190.
NOT RE-PINNED, per the brief: the wings are now mid-downstroke and that is the judged part.

### 55. THE CAGE HINT HAS NO MISSION BEHIND IT, SO NOBODY HAS EVER READ IT
Found in session 8 by piece 52, while fixing the line it carries. hintScan drops any hint whose mid
is not an OPEN mission - `const m=G.missions.find(m=>m.id===h.mid); if(!m||m.done||locked)continue;`
- and there is no mission with the id 'cage'. Every other hint mid has one: airmail, jam, paddock,
q_chimney, q_median, q_muster, roofhonk, snow. So this hint has been unreachable for its whole life,
in both modes, and the lie piece 52 was sent to fix was invisible.
THE COPY IS NOW CORRECT IN BOTH MODES REGARDLESS, so nothing is broken by leaving it dead. The
question is whether it should be alive, and it is a judged one because it puts a new line of text on
screen during play: a bird near the ute would start being told how the cage works.
THREE OPTIONS: (a) leave it dead and delete it, which loses a genuinely useful piece of teaching;
(b) give hintScan a path for hints with no mission behind them - a hint that is always available
while its subject exists - which is the smallest honest change and makes this one live; (c) give
'cage' a real mission and let the existing machinery carry it.
THERE IS A TRIPWIRE ON THIS ALREADY. The everything battery asserts that exactly one hint has no
mission and that it is the cage one. The day somebody makes it reachable, that assertion FAILS and
says so - which is exactly when a human should read the copy and decide.
PROOF once built: stand a bird in the hint radius in both modes and assert the plate carries the
resolved line for the mode it is in. The resolver and its display path are already proved by 52.
DONE session 10 (4c7fd986c7a3762b4e556a62ae9942e2), OPTION (b) - the brief calls it the smallest
honest change and it is. addHint takes an options bag and hintScan skips the mission gate for a hint
that declares free:true; the cage hint declares it at the call site, with the reason written there.
THE TYPO SAFETY IS WHAT THE MISSION GATE WAS REALLY FOR and it is not traded away: a hint with a mid
no mission has, that does NOT declare itself free, is still dropped. That is now driven rather than
assumed - the battery adds one, stands the bird in it, asserts the plate stays empty, and splices it
back out (FLAKES law 1: nothing clears G.hints).
THE TRIPWIRE FIRED AND WAS RE-AIMED, NOT DELETED. It now asserts more than it did: still exactly one
missionless hint, still the cage one, missionless ON PURPOSE, the opt-out has not spread to a second
hint, and the typo safety still works. Sabotaged three ways and all three were caught by name -
dropping the free flag (9 findings), gating nothing in hintScan (2), and making addHint default to
free (4).
A VERB STILL BEATS A HINT, which is what keeps this from being noise: hintScan only writes to an
empty plate, so at the hint centre - inside grab range of the ute keys - a player sees GRAB UTE KEYS
and the hint stays quiet. Asserted, because it is the answer to the judged part of this item.
TWO THINGS FOR ERIC, NEITHER BUILT. (1) Caging needs G.wanted >= 3 and an empty cell, so the copy
now teaches a mechanic that cannot fire below WANTED 3. Gating the hint on the warrant instead of on
proximity would teach it at the moment it becomes true - a copy and timing call, and yours. (2) The
hint is added from G.uteG.localToWorld in startGame with no guard, so it is now filed as TODO 58.

### 56. bird-shadow-quality  (spotted in a live frame, 2026-09-02)
The kea's cast shadow reads as a hard-edged flat duplicate of the mesh -
oversized and stretched for the near-overhead light, and detached under
the tail - not a soft contact shadow. Distinct from the Wave-1 "nothing
else casts a shadow" gap, which stands. Soften/scale the bird's own
shadow toward a grounded contact read; if it's a blob, fix its size and
anchor; if it's a shadow map, soften the edge and correct the projection.
PROOF: shadow footprint bounded to a sane contact size at the feet across
representative poses; no detached gap under the tail.
RE-PIN: leave any affected vantage flagged for Eric.

### 57. THE DRIFT DETECTOR CANNOT SEE THE SUBJECT CHANGE  (found in session 10 by piece 54)
Piece 54 turned 17_flight from a glide into a mid-downstroke - a different photograph of a different
wing pose - and diff.mjs reported 0.9826 against a threshold of 0.965 and did not flag it. Cropped to
the subject box that subjects.mjs already carries for this vantage, the same pair reads 0.639. The
bird fills about a twentieth of a 960x540 frame, so a whole-frame SSIM is a landscape metric: the
subject can be replaced outright and stay inside the drift budget. Every showcase vantage is exposed
to this and 03, 04, 13, 18, 20 and 25 are the ones where the subject IS the photograph.
NOT A FLAKE AND NOT A BUG IN diff.mjs - it measures what it says it measures. The gap is that
nothing measures the subject box for drift. subjects.mjs asks whether the bird is THERE; diff.mjs
asks whether the FRAME moved; between them there is no instrument that asks whether the bird moved.
PROOF once built: crop both frames to the box and SSIM that, with a tighter threshold than the frame
one; prove it by feeding it the 54 pair, where the frame passes and the box must fail.
DONE session 10 (harness-side, game md5 5c955bb4e7741eaea477606db3d228ac unchanged).
gauntlet/verify/boxdiff.mjs, run beside diff.mjs after a capture pass. The boxes are subjects.mjs OWN,
IMPORTED rather than copied - the same regions, a different question - which needed one small
refactor there: SPEC and the classifiers are exported and the run is guarded as a main module, so
importing the file no longer fires seven crops and prints a verdict nobody asked for. The 07 road box
is excluded by class, because a queue of cars is scenery and not a subject.
THE 54 PAIR IS THE PROOF THE BRIEF ASKS FOR AND IT LANDS: 17_flight reads 0.6388 in the box while
diff.mjs reads 0.9826 on the frame and passes it at 0.965. Threshold 0.98, measured against the three
unchanged boxes at 0.9999, 1.0000 and 0.9996.
AND ITS FIRST RUN FOUND A DRIFT NOBODY HAD SEEN - see TODO 60. 07_jam reads 0.9580 in the subject box
against 0.9904 on the frame.
DO NOT TRY TO FIND THE BIRD AUTOMATICALLY, and this is the finding worth keeping. Two attempts, both
worthless, and both traps are written into the instrument header: a bounding box over every kea-window
pixel spans 96 percent of the frame, because that window only discriminates INSIDE a chosen region -
the trap subjects.mjs already warns about, in a new coat. And a peak-density search finds the HUD in
24 of 25 frames, because the KEA 1 badge is painted in var(--kea) - the same olive as the bird, by
design. Coverage is therefore the five vantages that carry a measured subject box today; 03, 13, 18
and 20 need one measured per vantage with an eyeball, which is TODO 61.

### 58. THE CAGE HINT IS BUILT OFF G.uteG WITH NO GUARD, WHICH THE SECOND BIOME WALKS INTO
Found in session 10 by piece 55. startGame does `const up=new THREE.Vector3(0,1.2,-1.1);
G.uteG.localToWorld(up);` to place the cage hint, and G.uteG is set by mkDocUte inside buildCarpark.
Nothing in the biome chassis promises a ute: the day a second biome builds, startGame throws on the
line before the hint, and it throws for every mode. Same shape for the rest of the rex torch block
around it, which reaches into G.uteG the same way.
PREDATES PIECE 55 - the throw is on the localToWorld, not on the hint - and only the tour makes it
reachable, which is why it was not fixed inside a piece about hint reachability.
THE FIX IS PROBABLY NOT A GUARD BUT AN OWNER: the cage hint belongs to whatever builds the cage, so
it wants moving into the carpark build beside the ute rather than sitting in startGame testing for
one. Then a biome with no cage has no cage hint and needs no if.
PROOF: boot a biome with no ute and assert startGame completes and the cage hint is absent; carpark
unchanged, hint present, and the 55 assertions still green.
DONE session 10 (5c955bb4e7741eaea477606db3d228ac), and taken AHEAD of 39 because it blocks it: the
first real second map cannot boot at all while startGame reaches into G.uteG.
THE FIX IS THE OWNER, AS THIS BRIEF GUESSED. The hint moved into mkDocUte, which is the thing that
builds the cage. A map with no ute never calls it, so it never has the hint, and no if anywhere has
to remember that.
AND G.hints JOINED THE WORLD REGISTRIES, which was the second half of the same bug and not in this
brief. It was the one thing a build put on the board that the dispatcher never took back off:
invisible with one map, and with two it means the carpark teaching follows you to the ski field and
points at props in a country that is not there. Proved by booting a biome with NOTHING in it and
asserting the board is empty.
MOVING CODE EARLIER IN THE FRAME CHANGED WHAT IT MEANT, and the battery caught it on the first run.
localToWorld in r128 multiplies by matrixWorld and does not compute it; at build time nothing had,
so the hint landed at its LOCAL offset, 1.1 metres behind the world origin, and started firing in
the middle of the carpark. updateMatrixWorld first, and it is back at 12.16, 5.91 - the exact
coordinates startGame gave it, asserted to nine decimal places across two builds.
AND A BIOME WITH NOTHING IN IT BOOTS AND STARTS, which is worth knowing before 39: startGame needs
nothing else from the carpark. That assertion is now standing.
THREE SABOTAGES. The third caught NOTHING twice before it landed, because three separate reads in
the hint section went straight at cage() - cage().text, cage().free, and cage().x - and each one
threw the moment the hint was gone, taking every finding with it. Fixed through an accessor and the
same sabotage lands 21 findings. That is the FOURTH time in this session, so it is now FLAKES law 14.

### 59. A BOTCH ASSERTION HAD THE WRONG BOUND AND PASSED FOR FOUR BUILDS  — DONE session 10 (harness-side)
Found by piece 38, which added world builds and so moved the seeded rng stream, which handed the
carry-back section a different prop to tidy. botchWonk draws x and z INDEPENDENTLY - each a noise in
[-1,1] times BOTCHBAND.off - so the invariant is PER AXIS and the furthest a botched landing can sit
from home is the corner of the band, off times root two. One assertion in the carry-back section
asked for hypot <= off, which the code has never guaranteed; it passed on the luck of which prop the
block picked. The new prop was DOC radio: dx -0.0314, dz 0.0248 against an off of 0.0360 - inside
the band on both axes, 0.0399 away in a straight line.
FIXED IN PLACE, and not by loosening a number: the assertion now reads the convention the other
three botch assertions in the file already read (per axis), plus the diagonal as the total bound. It
was the only one of the four written differently, which is what made it wrong.
WORTH REMEMBERING AS A CLASS: any section that builds a world moves the stream for every section
after it, so a magic bound that happens to hold for one prop is a time bomb. FLAKES law 10 already
says the assertion reads the convention; this is what it costs when one does not.

### 60. 07_jam HAS DRIFTED IN THE SUBJECT BOX AND NOBODY SAW IT  (found in session 10 by piece 57)
The new subject-drift instrument reads 07_jam at 0.9580 against its pinned baseline while the whole
frame reads 0.9904 and passes at 0.965. It is NOT noise: three consecutive reshoots gave 0.957981,
0.957981 and 0.957993, so the subject is perfectly reproducible and has simply moved since it was
pinned. Cropped side by side (gauntlet/capture/boxdrift_07_jam.png) the resting WINGS sit
differently - lower and tucked now, slightly spread in the baseline - and the tail with them.
THE BASELINE WAS PINNED AT 59a8493, which is many builds back, so the change could be any of a dozen
pieces; narrowing it needs a bisect with a camera at every step and that is real money.
WHAT IS ACTUALLY WANTED IS A JUDGEMENT, not a bisect: look at the pair, decide whether the current
wing rest is the one you want, and either re-pin 07 or file the pose as a bug. NOT re-pinned by me -
a judged frame is Eric.
AND THE SAME QUESTION SHOULD BE ASKED OF EVERY OTHER VANTAGE, which is exactly what TODO 61 buys.

### 61. THE SUBJECT-DRIFT INSTRUMENT ONLY COVERS FIVE VANTAGES  — DONE. 03, 13 and 18 session 12; 20 session 13 once TODO 69 unblocked it (harness-side, game md5 unchanged)
boxdiff.mjs uses the boxes subjects.mjs already carries, which is 04, 07, 09, 17 and 25. The
vantages where the subject IS the photograph and there is no box are 03, 13, 18 and 20 - a portrait,
a preen, a rear close and a dead rear, every one of which could have its bird replaced outright
inside the frame drift budget and nothing would say so.
A BOX PER VANTAGE, MEASURED WITH AN EYEBALL. Do not automate the search: piece 57 tried twice and
both traps are written into the boxdiff header - the kea colour window spans the frame outside a
chosen region, and a density peak lands on the KEA 1 HUD badge because it is painted in the same
olive as the bird. Reading the fractions off the frame by eye is ten minutes and is correct.
PROOF: each new box scores above 0.99 on an unchanged reshoot, and fails when the subject is staged
into a different pose - which every one of those four vantages can do from its own stage line.
CLOSED session 13 with the fourth box, and 20 is the one that makes the case for the whole item.
  THE FLOOR IS HONEST NOW BECAUSE THE CAMERA IS. The away probe - a copy of capture.mjs that parks
  the bird at (-49,-49) every frame AFTER the stage line - used to take the camera with it and score
  135 against 200, a margin of nothing. With the piece-69 lock the camera is computed before the
  bird is parked, so the probe is the same photograph with the bird deleted: absent 0, staged 198.
  THE BOX IS 55x65 AND THE BIRD IS 31x46 OF IT, read off the frame by eye per the brief, measured
  bbox x 464..494, y 302..347. It is the smallest subject in the set.
  PROOF, both halves, and they come apart exactly the way the item predicted:
    unchanged reshoot   three separate captures, box ssim 1.0000, 1.0000, 1.0000 - bit-identical
    re-posed subject    yaw the bird 1.2 rad from its own stage line: box ssim 0.4550, while
                        diff.mjs reads the WHOLE FRAME at 0.9953 and passes it comfortably
  THE PRESENCE FLOOR SITS UNDER THE RE-POSE ON PURPOSE, which is a departure from the half-the-count
  convention the other boxes use. The re-posed bird scores 91 kea pixels and 91 is a bird that is
  THERE; a floor of 100 would report it MISSING, which is a lie about a question this file owns.
  60 against a measured absent of 0 is the presence answer; the pose answer is boxdiff at 0.4550.

### 62. A BUILD LEAVES ITS SINGLE-OBJECT HANDLES ON THE BOARD  (found in session 11 by piece 39)
WORLDREGS now covers props, inter, colliders, cars, sheep, strips, foodSrc, hints and snow - every
LIST a build fills. It does not cover the single objects a builder hangs on G: G.towWheel, G.ladder,
G.signG, G.uteG, G.nestG, G.paddle, G.snowCap, G.gravel, G.stones, G.wear. The dispatcher clears
none of them, so after a carpark boot they describe meshes in a scene that was thrown away.
THE EVIDENCE IS A SABOTAGE TRANSCRIPT, not a theory. With G.towWheel=wheel removed from the ski
field builder, the battery reported the wheel at -37.9,-40 FROM INSIDE THE SKI FIELD - the carpark
wheel, still on G, still being spun by update every frame, and still able to complete s_lift at
coordinates in a country that is not loaded.
NO SHIPPED CONSEQUENCE TODAY, which is why it is filed and not fixed in 39: both registered maps set
G.towWheel, every read of G.snowCap and G.uteG is guarded, and G.ladder is only read for Dave, who is
carpark cast. The consequence arrives with the third map.
IT IS ALSO HOW THE CAST BUG HID FOR TWO SESSIONS: a stale G.ladder made a hutless boot look safe in
every battery. That is the argument for fixing it as a class rather than one handle at a time.
PROOF: the dispatcher nulls a declared list of handles; a biome that does not set one reads undefined
rather than the last map value; and the ONE BUILD ONE WORLD section grows a handle sweep beside its
registry sweep. Watch for readers that are NOT guarded once the value can be undefined - that sweep
is the risky half, and vantage 15 reads G.signG from the rig.
DONE session 11 (789c9056e7c0e0d96007888e4aa22389). Twenty-one handles nulled, three data lists
emptied rather than nulled, six latches back to their defaults - all in the dispatcher, above the
biome, so a biome author cannot forget it.
THE RISKY HALF TURNED OUT TO BE ALREADY SAFE, and that was established by reading every reader before
writing the sweep: the cross-map ones are all behind truthiness guards, and the rest live inside
interactables their own builder registered. No new guards. The soak is the proof - thirty seconds
solo plus fifteen two-bird with a match, on bare ground, night on, traffic timer at zero.
G.nestPos IS NOT SWEPT ON PURPOSE (unguarded readers by design, every map declares one), nor are the
stash counters (the player, not the map). Both asserted, so they read as decisions.
AND IT QUIETLY FIXED TWO STALE LATCHES nobody had filed: G._qtDone meant a rebuilt carpark could
never pay for the picnic table again, and G.gymOut kept the kea gym deployed into the next map.

### 63. PROPS REST WHERE PLACED  (OPPORTUNITIES Tier 3 item 2)  — DONE session 11 (b541758aae2631001ea2a397106fbffc)
No rail, rack or line held anything: twelve of the carpark twenty-two props were on the ground inside
three seconds, including all three clothes pegs off the line and both ski poles standing half sunk in
the dirt. The prop physics already consults colliders - the sandwich rests on the picnic table because
that table has one - so the fix is the collider pass the item asks for. railTop declares a rest
surface (never solid), six of them, and the props on one are placed at their resting height.
IT COST TWO REAL REGRESSIONS, both in the log: the ski at rack height beat the CHEW THE BINDING tear
by 15mm at the beak and broke s_binding plus the whole fix-verb section, and the snow section had an
assertion that conflated a slender upright with its surroundings.
FOUND, NOT FIXED: the beanie (TODO 64).

### 64. THE BEANIE RESTS ON A HEAD, AND A HEAD IS NOT A SURFACE  (found in session 11 by piece 63)
propAt puts the tramper beanie at head height beside the sleeping Tom and it falls into the dirt,
which it has done since the day it was added - while the row says steal the beanie off the sleeping
tramper HEAD. The rail pass (63) cannot help: there is nothing under it to rest on, and a human is
not a collider.
IT IS A DIFFERENT MECHANIC. A prop that RIDES a thing that moves is not a prop that rests on a thing
that does not: Tom wakes, gets up and walks, and the beanie should go with him until it is taken.
THE DESIGN ANSWER IS YOURS: either the beanie is parented to his hatG until stolen (which is close to
what srcHatG already implies - the prop exists so that his own hat mesh can be hidden), or the wearer
carries a rest-on-me anchor that any prop can sit in.
PROOF when it is built: the beanie stays at head height for a minute of run; it moves when he does;
b_beanie still completes through the sleepGuard; and the prop is still takeable at his head rather
than at his feet.

### 65. THE CAREER PEAK WAS A DEAD READ  — DONE session 11 (9dfe7f3d147d65b4dc639df8775ab575)
The peak half of TODO 35. See that entry: split, half done, and the night auto-driver is still yours.

### 66. THE TO-DO FOOTER WAS A SNAPSHOT OF THE LAST MISSION  — DONE session 11 (8232590523658dfc3f5a1fe59a916de0)
Jobs done, career peak and time were built inside renderTodo, which runs on a mission event and at no
other time, so the footer read 0:00 two minutes into a run - and piece 65 would have made it worse by
parking a live meter beside a frozen PEAK 0. todoFoot() is one function with two call sites: renderTodo
on a rebuild, and the HUD frame while the panel is open and the string has changed. Browser-proved in
journey.mjs.


## FOUND IN SESSION 12 (appended 2026-09-02 by the overnight run)

### 67. QUIET DOES NOT PARK THE POPUP FEED, SO EVERY VANTAGE IS SHOT OVER A FADING CAPTION  — APPLIED and RE-PINNED session 13c inside the combined patch. CLOSED.
Found in session 12 by piece 31, from the cell map on its first run. MEASURED AND BUILT IN SESSION
12, THEN PARKED FOR YOUR JUDGEMENT - the patch is gauntlet/parked/todo67-park-the-feed.patch and it
applies clean. Everything below is measured on 8232590523658dfc3f5a1fe59a916de0.
THE FAULT. Three vantages - 13_idle_preen, 19_roof_follow, 20_dead_rear - put their hottest changed
cells in the same top-centre strip, x300..x600 y0. Cropping it shows the caption: startGame calls
popup() with DAWN. A CARPARK. NO WITNESSES YET., and popup() builds a div in #feed whose .pf rule is
"animation: rise 1.6s ease forwards" - a CSS animation on the WALL CLOCK, not on G.time, with a
setTimeout removing the wrapper at POPLIFE plus its own delay. So the caption is mid-fade when the
shutter opens at a phase nobody controls, and sometimes it has been deleted first. That is why
02_hut_snow reads either exactly 0 or exactly 1234 px against itself and never anything between.
QUIET parks the humans every frame, kills the traffic, marks the casefiles seen and hides the to-do
panel. It has never touched #feed. This is FLAKES law 12 with a fourth live thing in it, and it is
NOT the cause item 33 suspected - not accumulated simulation state, a DOM animation on a timer.
IT IS THE SINGLE BIGGEST SOURCE OF CROSS-RUN CHURN IN THE WHOLE SET. Five sweeps before, five after,
worst pairwise distance per vantage:
    05_tussock_ground  2775 ->    0     21_night_camp  2399 ->   21
    29_lodge_deck       229 ->    0     25_preen_follow 2801 ->  27
    30_groomed_band    1597 ->    0     17_flight       1951 ->  95
    03_kea_plate       3033 ->   13     08_readability  1480 ->    3
    04_flight_underwng 3086 ->   19     23_paddock_gate 1252 ->  111
    11_trailhead       4446 ->  665     07_jam          2865 ->  768
    18_rear_close      3909 ->  821     19_roof_follow  4168 ->  851
    10_skifield        5822 -> 1074     22_torch_beam   5308 -> 1209
    01_carpark_wide    3996 -> 1521     20_dead_rear    5489 -> 5037
    13_idle_preen      6932 -> 2853     06_skyline      8791 -> 5613
Ten of twenty-eight vantages drop under 100 px of cross-run churn, from a set where the worst was
8791. What is left is three named causes: 20_dead_rear is TODO 69 (the camera is live), and
06_skyline and 13_idle_preen are the shape TODO 30 describes.
WHY IT IS PARKED AND NOT SHIPPED: EVERY DETERMINISTIC CHOICE COSTS ABOUT 2900 PIXELS ON THE PINNED
FRAMES, and choosing which one is a look call on the whole set. The caption turns out to be in
essentially every baseline, not the eleven I first guessed.
  - EMPTY THE FEED (the patch). The caption leaves ~26 frames at about 2800 px each. diff.mjs goes
    to 1 flagged, worst 0.9506, which is 08_readability_320 - a 320x180 frame where the caption is a
    tenth of the picture. Everything else stays green.
  - FREEZE EACH POPUP AT A FIXED PHASE instead, keeping the stagger. Reads beautifully and I built it
    first. It requires clone-replacing the wrapper to survive its own pending remove(), which makes
    the caption PERMANENT and fully opaque in every frame: about 5700 px into all 28 vantages and
    08_readability_320 down to ssim 0.8711. Worse, and rejected.
  - FREEZE AT THE LATE PHASE THE BASELINES ALREADY CAUGHT, to try to buy determinism for nothing. It
    keeps diff.mjs at 0 flagged, worst 0.9798 - but the frames still move ~2900 px each, because a
    single fixed phase is not the distribution of phases the baselines were pinned at. No free lunch.
MY RECOMMENDATION: empty the feed, and re-pin the set in daylight. The 28_skifield_base comment at
the bottom of capture.mjs is already the house position on this - a popup in a pinned frame is a
live thing whose presence depends on how many frames the settle got through, and that vantage was
restaged specifically to get one out of shot. The exception is built into the patch and is the same
shape as h._park: 09_colossal IS the popup fanout and awards AFTER QUIET, so it sets __keaFeedKeep
and keeps what it puts there. Verified by eye - the five staggered CAR: BUNTED rows survive.
RE-PIN: the whole set, ONCE, judged. Do not pin it to make an instrument quiet.

### 68. WHAT A PIXEL COUNT CAN AND CANNOT SAY ABOUT THE PINNED SET
Filed in session 12 by piece 31, and CORRECTED the same night by piece 33 before it had been read by
anybody. Keep the correction: it is the useful half.
AS FILED, this said four baselines had provably drifted - 09_colossal, 20_dead_rear, 11_trailhead and
23_paddock_gate - on the argument that each sat further from its baseline than it churned on every
one of five capture sweeps. 09 looked unanswerable: 1565..1584 px from its pin against a churn of 22,
seventy-one times over, ssim 0.9992, and session 6 measured that same pair at 0 px.
CROSSRUN THEN SHOT FIVE MORE SWEEPS AN HOUR LATER AND 09 CHURNED 2233 PX BY ITSELF. Fourteen of
twenty-eight vantages beat their five-sweep ceiling on the second batch. All four claims collapse;
only the two that were already known survive ten sweeps, and both survive comfortably:
    07_jam      7497..9372 px against a churn of 2865   TODO 60, boxdiff 0.9580
    17_flight   7333..9189 px against a churn of 1951   TODO 57, the piece 54 wing
WHAT IS ACTUALLY ESTABLISHED, and it is worth more than the four claims were: THE PINNED SET IS FAR
LESS REPRODUCIBLE ACROSS PROCESSES THAN ANY INSTRUMENT HERE HAS EVER SAID. Ten sweeps of one
unchanged build put 06_skyline at 8791 px of churn, 13_idle_preen at 6932, 10_skifield at 5822 and
20_dead_rear at 5489. stability.mjs reports these frames clean because it compares takes inside one
run; diff.mjs reads them at ssim 0.998 and passes. The churn is not noise - it is a handful of
DISCRETE states, and a sweep lands on whichever one the machine gives it that night.
SO THE ORDER OF WORK IS SETTLED, AND IT IS NOT MORE MEASUREMENT. No number of sweeps will make a
churn ceiling stable while the causes are live; TODO 67 (the caption animates on the wall clock) and
TODO 30 (the grass sways on G.time) are the two named causes, and 33 said from the start that the
honest target is a changed-pixel count near zero. Fix those, re-run crossrun, and the ceilings should
collapse - at which point a band means something and this item can be asked again with real teeth.
DO NOT RE-PIN ANYTHING TO MAKE AN INSTRUMENT QUIET. That is the law-12 trap from the other end.

### 69. 20_dead_rear LEAVES THE CAMERA LIVE, WHICH IS THE ONE LAW-12 CASE ALREADY WRITTEN DOWN  — DONE session 13 (harness-side, game md5 8232590523658dfc3f5a1fe59a916de0 unchanged). NOT RE-PINNED.
Found in session 12 by piece 67, in an A/B that was run to check whether piece 67 had made this
vantage worse. It had not - it made it four times better - but the A/B is what put a number on what
is left. Its stage line sets G.cams[0].position ONCE and uses no camLock and no PIN:
    const c=KEAGAME.G.cams&&KEAGAME.G.cams[0]; if(c){c.position.set(...)}
FLAKES law 12 names this exact case in its own text - "the follow cam lerped away from a directly
assigned camera position (only camLock holds)" - and 20 is the vantage that still does it. Measured
on the same build, five sweeps each: without the popup freeze 4688 px of cross-run churn with the
samples spread continuously from 968 to 4688, which is the signature of a camera easing rather than
of a discrete settle state; with the freeze 974 and 964 on two further batches.
WHY IT IS NOT JUST camLock: this vantage is the FOLLOW cam view - a dead rear from the bird own
camera at 1.7 behind it - so camLock would have to reproduce the follow rig geometry rather than
override it. PIN the same assignment every frame instead, which is what the other nine live vantages
do, and derive the offset the way the stage line already does.
RE-PIN: 20 only, and it is a judged frame because holding the camera still WILL land it somewhere
slightly different from the eased position the baseline caught. Measure first, leave flagged.
DONE session 13, and the brief was right about the shape and wrong about one word - the camera is
not held STILL at the offset the stage line names, it is held at the FIXED POINT of the follow rig.
  WHY NOT THE STAGE-LINE OFFSET. 1.7 behind the bird is a close-up. The ease had all but converged
  by the 900ms shutter, so the pinned photograph IS the wide follow view - which is what piece 61
  hit from the other side when locking to the stage line gave it a close-up and nothing like 20.
  Measured: the direct set puts the eye at (-8.60, 1.10, 11.56) and the shutter catches it at
  (-5.86309, 2.29643, 14.48738), 3.7 m away and 99 percent of the way to the follow target.
  HOW IT IS DERIVED, and it is law 10 rather than a number. The stage line now runs the game OWN
  updateCams to convergence at a fixed dt - 400 iterations of 1/60 through KEAGAME.CAMS.update - and
  locks camLock to where the engine put the camera, with the lookAt taken off the camera own
  quaternion as a ray. The collider march and the ground clamp are therefore done BY the follow rig,
  not copied out of it, and the result is a property of the geometry rather than of settle length.
  AND THE BIRD IS EJECTED BY ONE FRAME OF PHYSICS, which nobody had noticed in four builds. The mark
  this vantage has always declared, (-9.55, 10.15), is inside a solid: ONE update(1/60) moves the
  bird to (-8.87763, 10.0137) and it does not move again for 240 frames. So the 1.7 dead-rear offset
  has always been computed from a mark the bird does not occupy, and the fix converges against where
  the bird IS. The stage line takes that one update itself, at a fixed dt, before it converges.
  PROOF, and it is the reproducibility claim rather than a battery. Probed at four settle lengths -
  600, 900, 1200 and 4000 ms, frame counts 36, 54, 73 and 240 - the camera reads
  -5.85379, 2.30050, 14.49733 and the quaternion -0.10585, 0.29055, 0.03236, 0.95044 at every one of
  them, identical to five decimals. Before the change every one of those four settles gave a
  different camera. Cross-run churn over ten pairs, same build, same machine, an hour apart:
      before   4334 px    6, 25, 952, 958, 968, 974, 3702, 3704, 4331, 4334   an ease
      after     991 px    0, 5, 5, 14, 976, 976, 981, 986, 986, 991           two discrete states
  The residual 991 is the caption feed and the grass, which are TODO 67 and 30 and are parked.
  CORRECTED THE SAME NIGHT, BY THE RULE SESSION 12 WROTE DOWN: a ceiling from five runs is a floor,
  and the 991 above is one. Ten runs a side, 45 pairs each, same machine, same night:
      before  4353 px worst   0 x4, 8 x2, 30..32 x6, 952..972 x17, 1020, 3306..3318 x4,
                              3714..3731 x8, 4338..4353 x4
      after   3185 px worst   0..8 x8, 985..998 x14, 1273..1281 x17, 2259..2271 x5, 3185
      after   2271 px worst   a second batch of ten taken straight afterwards
  So the pixel claim is a worst case down about a QUARTER, not down four times, and the "continuous
  spread versus discrete states" reading was an artifact of a ten-pair sample - BOTH distributions
  are clustered. WHAT IS UNAFFECTED is the thing the piece was for: the camera is a constant now,
  proven by the four-settle probe above, and it cannot land somewhere else because the machine was
  busy. AND IT SETTLES THE CHURN-TABLE QUESTION IN THE OTHER DIRECTION - 5489 stays, because
  lowering it to 991 would have gone red on the very next batch of ten.
  THE FRAME MOVED AND IS LEFT FLAGGED, per the brief. The lock sits 1.4 cm from the eased position
  the baseline caught: ssim 0.9831 against a 0.965 gate, which diff.mjs passes, and 16308 changed
  pixels against a recorded churn of 5489, which pxdiff.mjs flags at 3.0x. PXCELLS puts the change
  in a band across the full width at rows 3 and 4 - a sub-pixel translation of a textured horizon,
  not a subject change. Subjects 15 checked 0 missing, boxdiff 11 compared with only the two known.
  NOT RE-PINNED. It is Eric judgement and it is one frame: gauntlet/capture/20_dead_rear.png against
  gauntlet/capture/baseline/20_dead_rear.png.
  ONE NUMBER LEFT ON THE TABLE ON PURPOSE: the pxdiff CHURN entry for 20 still says 5489. Lowering
  it to 991 is a real recalibration, but it belongs with the re-pin and with five more runs than I
  took - session 12 law, a ceiling from five samples is a floor.
  AND THIS UNBLOCKS TODO 61 FOR 20: the vantage has neither a subjects.mjs presence check nor a
  boxdiff box, so nothing verifies the bird is in this photograph at all.

### 70. THE LAST OF THE CHURN IS dt-WEIGHTED LERPS, AND ONE VANTAGE IS NOT THAT
Investigated in session 12, with the TODO 30+67 patch applied so that only the residual was left.
After the caption is parked and the clock is pinned, the whole set churns under 130 px except four
vantages, and this is what those four are. NOTHING IS SHIPPED HERE - it is a name for the class the
08_readability_320 comment guessed at in session 8, now measured on a second and third vantage.
    20_dead_rear   5037   TODO 69, the easing camera. Not this class.
    09_colossal     820   its own award popups, kept on purpose by the __keaFeedKeep exception.
    12_seal_midpeel 704   THIS CLASS.
    22_torch_beam   364   NOT this class, and not yet named. See below.
    13_idle_preen   229   this class.
12_seal_midpeel IS THE CLEAN CASE AND IT IS THE WINGS. Probed at shutter time across takes: the frame
count is 142, 142, 143; the bird is y 0, vy 0, grounded true every time; body, head and tail
rotations are IDENTICAL to five decimals; the four freed seal segments are identical to four
decimals. The changed pixels are a single blob at x420..540 y360..420, which is the bird itself. The
wings are what differ - rz 0.45017, 0.45034, 0.47679 - and the third take has the SAME flapPh as the
first, so it is not the flap phase. Wing rest is a lerp(current, target, dt*k), so its value depends
on the SEQUENCE of real dt values and not on the frame count or on any pinnable clock.
PROVED BY LETTING IT CONVERGE. With the settle raised from 900ms to 4000ms: 12_seal_midpeel
704 -> 106 and 13_idle_preen 89 -> 28. That is a converging accumulator, measured, not argued.
22_torch_beam WAS INVESTIGATED AFTER ALL, and the first sentence of this item was wrong about it.
It IS this class for the part that matters, and the correction is worth more than the guess was:
    THE TORCH IS INNOCENT. Probed at shutter across four takes: torch.g.rotation.y 0 every time,
    spot.intensity 2.6, beam opacity 0.13. The 22 PIN holds all three.
    IT IS REX LEFT ARM, line 4046, the same lerp shape as the 12 wings:
    lerp(armL.rotation.x, angry ? -2.6+sin(G.time*14)*0.3 : ..., dt*8). With G.time pinned the
    target is a constant -2.8957, and watched over one run the arm walks to it monotonically:
    -2.73089, -2.83549, -2.87691, -2.88915, -2.89364, -2.89543. At 900ms it is not there yet, and
    where it has got to depends on the dt sequence. Across takes it read -2.75284, -2.75286,
    -2.73091, -2.73060.
    THE LEGS ARE NOT IT, which is worth writing down because they look like the obvious suspect.
    walkPh does keep advancing on pure dt with nothing to pin it - measured 8.3165 to 13.8659 in
    one run - but sw is "moving ? 0.55 : 0" and a vantage that pins Rex in place makes moving false,
    so legL and legR sit at exactly 0 and walkPh drives nothing.
    WHAT IS LEFT IS ABOUT 300 PX AND I DID NOT NAME IT. With a 4000ms settle the arm is converged
    and the legs are static, and 22 still churns 297. So the irreducible part is neither, and the
    most likely candidate is the spotlight shadow map on a night frame, which would be a renderer
    cause of the FLAKES law 9 family rather than a staging one. TIME-BOXED under law 8 after six
    probes and left as a named unknown of known size.
THE TWO WAYS OUT, and both re-pin, so both are yours:
  (a) A FIXED dt FOR THE RIG - the deterministic frame clock the 08_readability_320 comment already
      named and attributed to TODO 33. It fixes the class outright and every frame moves.
  (b) A LONGER SETTLE on the four affected vantages, which is one number per shot rather than a rig
      change. Cheaper, weaker - 106 px is not 0 - and it still moves those frames.
DO NOT take (b) globally: the settle is 900ms x 30 shots today and 4000ms would make a capture pass
take three times as long for four vantages worth of benefit.

## FOUND IN SESSION 13 (appended 2026-09-03 by the overnight run)

### 71. FOUR VANTAGES STAND THEIR BIRD INSIDE A SOLID, AND THE GAME QUIETLY MOVES IT
Found in session 13 by piece 69, which needed to know where the bird actually WAS before it could
converge a camera on it. The audit is audits/2026-09-03/audit-stage-marks.js - a report, not a
battery, deliberately out of gate.sh for the reason audit-bevel-flanks.js states for itself.
FIVE OF THE TWENTY-EIGHT MARKS IN capture.mjs ARE INSIDE A SOLID BOX, and pushOut ejects the
bird on the FIRST frame of the settle. It is not drift and it is not a flake: the move is the same
to five decimals every time, in node and in the browser, and it is a single step.
    01_carpark_wide     4, 16          -> 2.82, 16              1.180 m   a PARKED CAR at 4.2, 16.4
    08_readability_320  4, 16          -> 2.82, 16              1.180 m   the same mark, same car
    20_dead_rear        -9.55, 10.15   -> -8.87763, 10.0137     0.686 m   the caravan at -11, 8
    18_rear_close       -9.2, 10.6     -> -9.14552, 10.86876    0.274 m   the caravan, on z
    12_seal_midpeel     -9.79249, 8.68323 -> -9.1728, 8.55761   0.632 m   the caravan, and see below
AND THE FIFTH ONE IS THE INTERESTING ONE, because it is not just moved sideways. 12_seal_midpeel
computes its mark off the door-seal strip's own getPos() and stands the bird at y 1.62 with
grounded=false - a bird up at the seal, mid-peel, which is the act the vantage is named for. The
first frame pushes it 0.632 m out of the caravan AND it falls: measured in the browser at the
shutter, -9.1728, 0, 8.55761, grounded true. The photograph is a bird standing on the tarmac beside
an open door with a half-peeled strip above it. Whether that picture is the one you want is yours -
it reads well - but it is not the picture the stage line describes, and session 12 walked past the
evidence while probing this exact vantage for churn: TODO 70 records "y 0, vy 0, grounded true, five
takes out of five" and did not ask why a bird staged at 1.62 was on the ground.
THE ESTABLISHING SHOT IS THE WORST ONE. 01_carpark_wide is the frame the set opens with, and its
bird has been standing 1.18 m from its own stage line since the day it was written - beside a parked
car it is meant to be near, not where the line says. 08 is the same mark through a different camera
at 320x180, so the readability frame inherits it exactly.
WHAT IT COSTS, and it is not the photographs: they are what they are and the baselines are pinned to
them. It costs anyone who edits a mark. A small nudge to 01 or 20 does nothing at all until the mark
clears the body, so the frame does not respond to the edit and the next person reads that as the rig
ignoring them. Piece 69 hit exactly this: the camera offset for 20 was computed from a mark the bird
does not occupy, which is how that vantage framed a bird 0.68 off its own line for four builds.
TWO MARKS ARE NOT LITERAL AND ARE TRANSCRIBED INTO THE AUDIT AS FUNCTIONS OF THE WORLD, with their
source lines asserted so a row prints TRANSCRIPTION STALE rather than a stale number if capture.mjs
changes. They are 15_sign (off G.signG, clean) and 12_seal_midpeel (off the seal strip, the fifth
ejection). The only two vantages with no mark at all are 06_skyline and 26_tour_brochure, which
stage no bird.
THE FIX IS A JUDGED RE-PIN AND THEREFORE NOT MINE. Moving a mark out of its body moves the bird in
the photograph - 1.18 m on the establishing shot is a different picture, not a nudge - so it wants
the same sitting as the TODO 30 and 67 re-pin sweep. The honest cheap half, if you want one: leave
the marks alone and write the EJECTED position beside each one as a comment, so the next person
reads the truth without the frame moving.
PROOF THE AUDIT IS MEASURING THE PHOTOGRAPHED WORLD, because rig.js says node and the browser build
different countries from one seed: all three ejecting marks were also measured through puppeteer on
the staged page at shutter, and headless and browser agree to five decimals on every one. The
control is in the file and prints before any row.
AND THE AUDIT PREDICTS ITS OWN ANSWER. It reports pushOut's overlap alongside the measured move and
flags a row where they disagree; all four agree exactly, which is what makes the cause a fact rather
than a correlation.

### 72. THE BULL WHEEL IS A dt ACCUMULATOR, AND IT IS THE LARGEST CHURNER LEFT IN THE SET
Found in session 13b by applying the deterministic rig, which is the point of a rig that stops
churning: the next thing up is visible. With TODO 30 and 67 in, the whole pinned set falls under
1000 px of cross-run churn except three, and 28_skifield_base is the worst of them at 1291.
IT IS THE BULL WHEEL AT THE BOTTOM STATION, line 3720: `if(G.towWheel)G.towWheel.rotation.z+=dt*2.4;`
A PURE dt ACCUMULATOR with nothing to pin it - TODO 70 class (a), and the same shape as walkPh
except that walkPh drives nothing in a pinned frame and this one is a red disc a metre across in the
middle of the photograph. Pinning G.time does not touch it, which is why it survived the patch that
took 06_skyline from 8791 to 129. Cropped, two runs show the same wheel with its bolt-head at a
different angle; the hot cells are cx 7..9, cy 3..4, which is exactly where it sits.
THE FIX IS THE LAW-12 IDIOM AND IT IS ONE LINE, in the 28 stage PIN beside the bird:
    if(KEAGAME.G.towWheel)KEAGAME.G.towWheel.rotation.z=<a chosen angle>;
A vantage that leaves something LIVE during the settle must pin it every frame, and this vantage
does not. The angle is a free parameter exactly like the 12.0 in TODO 30, and choosing it moves the
frame, so it is a judged re-pin of 28 - which is why it is filed rather than taken.
NOTE THE RECORDED CHURN FOR 28 IS WRONG IN THE OTHER DIRECTION AND WAS ALREADY WRONG. crossrun goes
red on 28 with the patch in - 1291 against a recorded 453 - and that is NOT the patch. Measured on
the same machine the same night with the patch STASHED, six runs, fifteen pairs: 5844 px worst,
with the samples 14, 250, 265, 464, 608, 742, 1105, 1249, 1810, 3678, 5046, 5515, 5655, 5756, 5844.
The patch takes 28 from 5844 to 1291. The 453 in the table is a ceiling from a sample that never saw
the wheel in its far states - the third session in a row that a recorded ceiling has turned out to
be a floor, and this time it is the calibration table itself.

### 73. A SWEEP CAN LAND IN A STATE THE NEXT FIFTEEN DO NOT VISIT, AND PINNING FROM IT MIS-PINS
Found in session 13c, twice in one sitting, while re-pinning the set onto the deterministic rig.
It is not the churn this repo has spent three sessions measuring. It is the SAMPLE a pin is taken
from, and it makes a ceiling wrong in both directions.
    07_jam       the ten-run batch read 5717 px. The pair matrix says ONE sweep of the ten stood
                 5714 from the other nine while those nine agreed within 23. It did not come back:
                 a warm four-run batch read 22, four single-vantage runs read 7 to 24.
    23, 28       both were first pinned from a sweep that a fresh sweep then read 1165 and 3581 px
                 away from - while 15 runs of the same two vantages, 105 pairwise distances, churn
                 129 and 5. Pinned from an outlier, verified against consensus, caught by pxdiff.
WHY IT MATTERS MORE NOW THAN IT DID LAST WEEK: while the rig churned thousands of pixels an outlier
sweep was indistinguishable from ordinary churn. On the deterministic rig 28_skifield_base churns
FIVE pixels over 105 pairs, so a sweep 3581 px out is three orders of magnitude clear of the noise
and there is no excuse for pinning it. The tighter the rig, the more a mis-pin costs.
THE FIX IS A PROTOCOL AND crossrun ALREADY HAS THE DATA FOR IT. It computes every pairwise distance;
it should also print WHICH RUN is the odd one out - a run whose median distance to the others is far
above the rest - and a re-pin should be taken from a consensus run rather than from whatever sweep
happened to be on disk. Suggested: `CROSSKEEP=1` plus a printed "pin from run N" line, or a
`crossrun --pin` that copies the consensus run into baseline itself.
UNTIL THEN, THE MANUAL PROTOCOL IS: re-pin, then reshoot and diff against what you just pinned. Both
mis-pins here were caught that way and would have been invisible without it. That check is now the
last line of the session-13c re-pin note in BASELINE.md.


## FOUND IN SESSION 14 (appended 2026-09-03 by the REPLAT P1 run)

### 74. EVERY SUBJECT FLOOR IS CALIBRATED IN r128 PIXEL COUNTS, AND 07_jam IS ONLY THE FIRST TO SURFACE
Found while certifying REPLAT P1. `subjects.mjs` reads 07_jam carblue at **2950 against a floor of
3000** and calls the subject MISSING, while the frame plainly carries four blue cars, the traffic
cone and the bird standing its ground. Nothing is wrong with the photograph.

WHAT IS ACTUALLY WRONG: every floor in subjects.mjs was calibrated by counting pixels on the r128
renderer, and the ported build does not produce r128's pixel counts. Two independent reasons, both
measured and neither a defect:
  1. THE FILM CAMERA MOVES PIXEL STATISTICS GLOBALLY. Bloom, GTAO and the depth of field shift
     brightness and saturation across the whole frame, and every classifier in subjects.mjs is an
     HSV window — `carblue` is h 195-225, s 0.35-0.75, v 0.30-0.70. Pixels near a window edge fall
     out of it. Measured on 01_carpark_wide, the film camera alone moved SATAVG 21.9 -> 21.3 at the
     shipped setting and 22.0 -> 5.0 at the first (rejected) bloom threshold.
  2. THE WORLD RNG STREAM DIVERGED. r128 consumes 10,570 Math.random draws at boot and r185 10,738,
     so randomised placement differs and a subject can legitimately occupy a slightly different
     pixel area. See the re-pin note in BASELINE.md.

WHY 07_jam SURFACED FIRST AND THE OTHER FIFTEEN DID NOT: it sat closest to its floor. carblue is a
STAGED colour (capture.mjs paints the queue 0x3E6484 per piece 4 of session 12), so its count is
tightly bounded rather than generous — the others clear their floors by multiples. That is luck of
margin, not a property of 07_jam, and the next look change moves whichever check is closest then.

DO NOT LOWER A FLOOR TO GET GREEN — Eric's order, and it is the FLAKES law stated for this
instrument: a floor moved to clear a red is that check deleted, and subjects.mjs exists precisely
because diff.mjs cannot see a birdless frame. The 2950 stands red until this piece runs.

THE PIECE: recalibrate all sixteen floors against the ported renderer, the way piece 4 originally
cut them — measure each subject present AND against its `absent` reference frame, and keep the
separation ratio the calibration was chosen for rather than shaving the floor to fit today's count.
The reference-frame scores (the `absent:` column) must be re-measured too; they are r128 numbers as
well. Report the before/after separation for each check so a weakened one cannot hide in the batch.
WORTH DOING IN THE SAME BREATH: 07_jam's carblue window may simply be too tight for a post-processed
frame. Widening the HSV window with the separation ratio HELD is a recalibration; widening it until
the red goes away is not. Prove which by re-measuring against the absent reference.

NOT URGENT, AND SAFE TO LEAVE RED: the check is failing conservatively — it under-reports presence,
so it cannot pass a frame whose subject is genuinely gone. The instrument is still trustworthy in
the direction that matters.

### 75. SUBJECT CLASSIFIERS ASSUME NEUTRAL SHADE, AND REPLAT P2 RETIRED THAT ASSUMPTION
Filed 2026-09-03, session 15 (REPLAT P2). SUPERSEDES THE DIAGNOSIS IN TODO 74 WITHOUT REPLACING
ITS PIECE — 74 said every floor is calibrated in r128 PIXEL COUNTS and predicted "the next look
change moves whichever check is closest then". P2 moved three of them, and measured, the cause is
not the counts and not the film camera. It is the COLOUR OF SHADE.

WHAT P2 CHANGED. The environment went from a 64x32 painted gradient to a real HDRI, so ambient
light is now warm and directional instead of near-neutral. Shade is consequently COLOURED, which
is the whole point of the piece and the thing ref_bow_00/04/06 read as. Every classifier in
subjects.mjs is an HSV window cut on frames whose shade was grey.

MEASURED, PER FAILING CLAUSE, WITH THE WINDOW SPLIT INTO ITS CONJUNCTS — because guessing which
clause fails produced a WRONG answer first time round. The initial hypothesis was "the subjects
brightened out of an upper value bound", and both had in fact got DARKER:

  29_lodge_deck  hutgreen  (h140-175 AND s>=0.45 AND v 0.10-0.45)   4645 against a floor of 8000
      h140-175 clause   15877 -> 5479      <-- THIS is the collapse
      s>=0.45  clause   19252 -> 18306         held
      v<=0.45  clause   16478 -> 19628         IMPROVED
    The lodge is PAL.ranger 0x24513B, h155. Warm bounce rotates a green surface toward yellow, so
    its hue leaves the low edge of a window whose whole safety argument was "the only saturated
    green on a map made of snow". The green is still the only green; it is no longer h155.

  25_preen_follow  beak  (v<=0.34 AND s<=0.35)                         3 against a floor of 12
      v<=0.34 clause   24 -> 80      MORE dark pixels than before
      s<=0.35 clause 1204 -> 1149    barely moved
      BOTH CLAUSES HAVE PLENTY AND THEIR INTERSECTION IS EMPTY, which can only mean the dark
      pixels and the desaturated pixels stopped being the SAME pixels. Measured directly: the mean
      saturation OF THE DARK PIXELS (v<=0.34) in that box went 0.154 -> 0.569, max 0.244 -> 0.789,
      at hue 48deg. The comment in subjects.mjs calls this a "crude dark and grey window" and says
      it works because the beak "is the ONLY dark thing" in the box. It still is. It is no longer
      grey, because nothing in shade is grey any more.

AND ONE CHECK WENT THE OTHER WAY, WHICH IS THE PROOF THE CAUSE IS DIRECTIONAL AND NOT DRIFT.
07_jam carblue — TODO 74's own red, 2950 against a floor of 3000 — now reads 10655. Same window,
same floor, untouched. The blue cars moved INTO it. A cause that only ever lowered counts could
not do that; a hue-and-saturation rotation can, and does, in whichever direction each surface's
own colour happens to sit relative to its window.

THE PIECE, AND IT IS TODO 74's PIECE WITH A CORRECTED BRIEF: recalibrate all sixteen checks on the
P2 renderer, and recalibrate the WINDOWS as well as the floors, which 74 only raised as a maybe for
07_jam. The window edges are the thing that broke. Hold the separation ratio each window was chosen
for — measure every subject present AND against a re-measured `absent` reference frame, and report
before/after separation per check so a weakened one cannot hide in the batch. A window widened with
the separation held is a recalibration; widened until the red goes away it is that check deleted.

DO NOT LOWER A FLOOR OR WIDEN A WINDOW TO GET GREEN — Eric's standing order on this instrument,
restated because this session had two reds and an obvious way to clear both.

SAFE TO LEAVE RED, AND VERIFIED BY EYE THIS SESSION: both subjects are plainly in frame. The day
lodge fills a third of 29_lodge_deck; the preening bird is centre-frame in 25. The checks fail
CONSERVATIVELY — they under-report presence and so still cannot pass a frame whose subject is
genuinely gone, which is the direction that matters.

### 76. THE PAINTED SKY DOME IS NOW THE ONLY THING IN THE FRAME THAT IS NOT LIT
Filed 2026-09-03, session 15 (REPLAT P2). NOT a defect — a consequence, and the largest remaining
P2-shaped gap against ref_bow_00 and ref_bow_04.

The dome, its haze band, the sun sprite and the clouds are all MeshBasicMaterial with `fog:false`.
They are authored art: a saturated blue gradient tuned to the NZ tourism-campaign palette that
ARTBIBLE's vividness law names. Everything else in the game is now lit by a measured HDRI and
hazed by exponential fog. So the sky is the one surface that cannot respond to the light model, and
the seam shows exactly where the reference is least like the game: ref_bow_00 and _04 both have a
BLOWN, PALE, WARM sky that reads as atmosphere, while the dome stays a confident blue.

THE TENSION IS REAL AND IT IS ERIC'S TO RESOLVE, which is why this is filed rather than fixed:
  - REPLAT section 3 says ref_bow_* is THE target for LIGHT and that the stylised references are
    historical.
  - ARTBIBLE STANDING LAWS say "NZ tourism-campaign colour - saturated, never washed out."
  - A real NZ alpine sky IS deep blue. The reference is Australian suburbia in haze. On this one
    axis the country and the target disagree, and no tuning satisfies both.

THE OPTIONS, cheapest first, none of them taken:
  1. Leave it. The dome is good art and the disagreement is honest.
  2. Tune the dome's low band toward the fog colour so the horizon transition stops being a seam,
     keeping skyTop saturated. Small, reversible, does not touch the vividness law at altitude.
  3. Put the HDRI on scene.background at low intensity behind the dome, or replace the dome with
     it. This is the photoreal answer and it DELETES a piece of authored art; it also makes the
     sky respond to nothing the game controls.
Option 2 is the one worth a variant strip. Judge at 06_skyline and 11_trailhead against ref_bow_04.

### 77. THREE VANTAGES ARE LESS REPRODUCIBLE THAN pxdiff RECORDS, MEASURED ON CONSENSUS RUNS
Filed 2026-09-03, session 15b, during the P2 re-pin. NOT re-fitted, deliberately.
Measured across four independent sweeps with the outlier run excluded per vantage, so the number is
churn and not a bad sweep:
    01_carpark_wide        churn  500   recorded ceiling  104     4.8x
    04_flight_underwing    churn  291   recorded ceiling   69     4.2x
    28_skifield_base       churn 3369   recorded ceiling 1291     2.6x
The other 25 hold. The ceilings were cut on r128 and session 14b left them alone because they held;
three of them no longer do, and P2 is the only thing between.
WHY IT WAS NOT FIXED IN THE RE-PIN: re-fitting a churn ceiling inside a re-pin is a recalibration
smuggled in as housekeeping. FLAKES is explicit that a ceiling moved to accommodate today's number
is that ceiling deleted, and the whole value of the pxdiff table is that it was measured once,
deliberately, on a quiet machine.
AND DO NOT READ THE VERIFICATION SWEEP AS RETIRING THIS. The fresh sweep after the re-pin came in
0 over band on all 28, because a consensus pin puts every vantage at the state most sweeps visit.
One sweep landing inside a ceiling is not evidence the ceiling is right.
THE PIECE: `crossrun` with RUNS=5 on a quiet machine (no other capture pass, no leftover browsers —
see TODO 78), then paste its table. Report the before/after per vantage so a widened ceiling cannot
hide in the batch. WORTH ASKING FIRST whether the cause is the LOOK or the STAGING: 01 and 04 both
gained soft shadows and 28 is the high-albedo snow frame that already sets the bloom threshold, so
a VSM shadow map re-blurring a 2048 map per frame is a plausible new source of per-frame variance
that no previous ceiling had to absorb. Measure with `KEASKY='{"shadowType":"pcfsoft"}'` before
touching a number: if the churn drops back inside the r128 ceilings under PCFSoft, the cause is the
shadow map and the honest fix may be a VSM parameter rather than a wider band.

### 78. THE PHOTOGRAPHER'S HANG IS BOUNDED NOW, BUT THE CAUSE IS STILL UNKNOWN
Filed 2026-09-03, session 15b. The SYMPTOM is fixed and the ROOT CAUSE is not, so this is filed
rather than closed.
WHAT HAPPENED: six stalls in one session. Three before the fix (600s, 8m20s, and 25 minutes with
the node process at 0.0% CPU and no frame written) and three during the consensus sweeps, at roughly
one per 30-shot sweep — a ~3% per-shot rate. Every one of them sat in `shot()` with nothing bounded.
WHAT WAS FIXED: `SHOT_MS` (default 90s, against a healthy shot of ~6s and a full 30-vantage sweep of
~110s) turns a stall into one of `shotR`'s three retakes, which could never fire before because a
hang raises no exception. And `await browser.close()` moved into a try/finally with a SIGKILL
fallback — it had been on the SUCCESS PATH ONLY, so every failed shot leaked a headless Chrome.
124 orphans were counted mid-session and their contention is what made the first stall look like a
machine problem rather than a missing timeout. That misdiagnosis cost the better part of an hour.
WHAT IS STILL OPEN: WHY does a browser stop answering? One retake printed
`Protocol error (Runtime.evaluate): Target closed`, which says the browser DIED rather than hung, so
there may be two failure modes wearing one symptom. capture.mjs launches a fresh browser PER SHOT —
30 per sweep, 150 per crossrun — and repeated system-Chrome launches are the obvious suspect.
WORTH TRYING, cheapest first: (1) log the stall's stage by timing each await inside `shot` so the
next occurrence names the step; (2) reuse ONE browser per sweep with a fresh page per shot, which
would cut 30 launches to 1 and is a behaviour change to a rig every baseline depends on, so it wants
its own piece and a stability sweep; (3) capture the browser's stderr on a timeout.
NOT URGENT: the pass now self-heals and says so in its output. But a 3% stall rate on a 30-shot
sweep means most sweeps take a 90s penalty, and crossrun with RUNS=5 takes five of them.

### 79. THE HUT ROOF IS AN INVERTED GABLE — IT MEETS IN A VALLEY WHERE A RIDGE SHOULD BE
Filed 2026-09-04, session 21, on Eric's instruction: FILE, DO NOT FIX. This is P6 geometry work and
it is on the BLOCKED list at the top of this file (`hut roof rebuild`), so it must not be improvised
overnight.
WHAT ERIC SEES, three defects in one object:
  1. THE PITCH IS INVERTED. The two roof planes meet in a VALLEY, not a ridge — the roof reads as a
     shallow V collecting water where it should shed it. Every other cue in the hut (walls, chimney,
     the way the eaves are lit) says gable, so the eye reads the roof as wrong rather than as a
     design.
  2. A VISIBLE GAP TO THE WALLS. The roof does not land on the wall plates; there is daylight
     between them. ARTBIBLE's PHASE 4 gap list has carried "hut roof floats off its walls" since the
     24-frame audit, so this half is a re-sighting of a known defect, not a new one.
  3. THE SOLAR PANELS ARE OFF-PITCH. They do not lie in either roof plane, so they read as boards
     resting at their own angle rather than as panels fixed to a roof.
WHERE TO JUDGE IT: 02_hut_snow (the hut's own vantage), 19_roof_follow (the bird ON the roof, so the
pitch is read against a subject standing on it), 01_carpark_wide and the P4d wide proof frame (the
hut in the left third, which is where it was noticed).
VERIFIED FROM THE GEOMETRY, so whoever takes this does not have to re-derive it. In `buildHut`:
    const rl = Mesh(BoxGeometry(7.8, 0.18, 3.6)); rl.position.set(0, 3.35, -1.45); rl.rotation.x =  0.62;
    const rr = rl.clone();                        rr.position.z = 1.45;            rr.rotation.x = -0.62;
    const cap = box(8, 0.14, 0.5, PAL.dark, 0, 3.98, 0);          // the ridge batten
Each panel is 3.6 deep, so its edges sit at local z = ±1.8. Under Rx(0.62) that is ±1.8·sin(0.62) =
±1.04 in y and ±1.8·cos(0.62) = ±1.46 in z. Landing them:
    rl  high edge  y 4.39 at z −2.91   ->  low edge  y 2.31 at z  0.01
    rr  low  edge  y 2.31 at z −0.01   ->  high edge y 4.39 at z  2.91
THE TWO PLANES MEET AT z≈0 AT y 2.31, WHICH IS THEIR LOWEST POINT, AND RISE TO 4.39 AT BOTH EAVES.
That is the inverted gable, in arithmetic: a V-shaped valley down the centre line. The two rotation
signs are simply swapped — `rl` wants −0.62 and `rr` wants +0.62 — but see below on why that alone
is not the piece.
AND THE OTHER TWO DEFECTS FALL OUT OF THAT ONE, WHICH IS WHY IT IS ONE PIECE:
  - THE RIDGE CAP IS AT y 3.98 AND THE PANELS MEET AT y 2.31, so the batten floats 1.67 m above the
    valley it is supposed to cap. That dark bar hanging in mid-air is part of what Eric is seeing.
  - THE COLLIDER ALREADY BELIEVES IN A RIDGE: `{kind:'roof', ridge:4.05, slope:0.52, slide:true}`,
    and `groundHeightAt` walks the bird on `ridge − |z−c.z|·slope`. 4.05 agrees with the CAP and
    disagrees with the drawn panels by 1.7 m at the centre line, so the bird currently walks an
    invisible correct ridge above a visible wrong valley. 19_roof_follow is the vantage that shows
    it, and it means fixing the geometry should bring the drawn roof TO the collider rather than the
    other way round — the collider is the one that is right.
  - THE GAP TO THE WALLS IS THE SAME BUG SEEN SIDEWAYS. With the pitch inverted the eaves are lifted
    to 4.39 instead of dropping to the wall plate, so the roof's outer edges pull away from the top
    of the walls; 02_hut_snow shows daylight between the roof and the wall top plate across the
    whole front. Correcting the pitch moves the eaves DOWN, which may close it on its own — check
    before adding any packing geometry, or the fix will double up.
ONE THING I COULD NOT CONFIRM: there is no mesh named for a solar panel anywhere in `buildHut`. What
reads as off-pitch panels in 02_hut_snow is most likely the twelve `rg` ridge battens (0.02 m
cylinders parented to `rl`, so they ride its wrong rotation and present as a framed array) and/or
the `sn` snow cap at z 2.4 / rotation.x −0.62. Whoever takes this should confirm at the vantage
first: if the panels are the battens, they are fixed by fixing the pitch and there is no third
defect; if Eric means a mesh I have not found, it is elsewhere in the hut group.

### 80. THE ROLLING TUSSOCK HILLS HAVE FLAT TOPS, AND THEY ARE THE LAST STRAIGHT EDGE IN A WIDE FRAME
Filed 2026-09-04, session 21, during P4d. FILED, NOT FIXED: P4d's scope was the squares in the grass
and the ground colour, and this is neither — it is landform silhouette, so it belongs with the
mountain shape work (ARTBIBLE PHASE 5 / P6).
WHAT IT IS: the nine rolling hills in `buildCarpark` are `SphereGeometry(rad,18,10)` with
`scale.y` between 0.2 and 0.3. Ten height segments means the polar bands are already nearly
horizontal, and squashing to a quarter of the radius collapses the top two bands into a genuinely
FLAT cap several metres across. At their placement radius (64-84 m) that cap presents as a dead
straight horizontal line against the sky, and the radial noise applied to x/z does not touch it
because it only perturbs the horizontal profile.
WHY IT MATTERS NOW: P4d's proof frame was shot to show that no straight edge or lattice remains in
the grass or the ground colour, and it does show that. These caps are the only straight edges left
in the frame, so they are what the eye goes to next. They are also visible in 01_carpark_wide
(y~145-175) and 05_tussock_ground (the yellow shape with the ruled top edge, left third).
CHEAPEST HONEST FIX, for whoever takes it: perturb the vertical profile as well as the horizontal
one — the sculpt loop already has a per-hill phase, so a `pos.setY(v, y*(1+n*...))` term costs
nothing — and/or raise the height segment count, which is nine meshes and not a budget question.
Do NOT just raise scale.y: that changes the landform's read, which is a taste call and Eric's.
RELATED, AND STILL OPEN: these same hills are the horizon COLOUR SEAM recorded in the P4b/P4c/P4d
recipes — they are separate vertex-coloured geometry and do not wear `GRASS.groundTint`, so tinted
flat ground meets untinted gold hill with a visible join. Same nine meshes, so the two are probably
one piece.

### 81. [CLOSED 2026-09-04] 28_skifield_base's BULL WHEEL FLOOR WAS BEING MET BY LUCK
Filed 2026-09-04, session 22 (REPLAT P4e). The DETERMINISM half is fixed; the THRESHOLD half is a
composition call and therefore Eric's, so it is filed rather than decided.
WHAT WAS WRONG: `G.towWheel.rotation.z += dt*2.4` INTEGRATED wall-clock deltas. The capture rig pins
`G.time = 12.0` on every animation frame, and that pin cannot reach an integrator — so the wheel's
angle depended on how many frames the settle got through and how long each took. Measured across
three takes of ONE unchanged build: scarlet 490, 1067, 2038, against a floor of 1500. It straddled
its own floor in both directions, which is a coin flip wearing the clothes of a regression — and it
cost this session a false alarm, because the first P4e sweep read 1215 and looked like the far tier
burying the wheel.
WHAT IS FIXED: the wheel is now `rotation.z = G.time*2.4`, the same idiom the grass wind already
uses. In play G.time advances by dt so the wheel turns exactly as it always did; under the pin it
stops at one angle. Four consecutive takes now read **838, 838, 838, 838**. A battery asserts both
halves — that no integrator is left, and, measured on the live object, that eight frames at a pinned
clock leave the angle unmoved while advancing the clock does turn it.
WHAT IS STILL OPEN, AND WHY IT WAS NOT DECIDED HERE: 838 is below the floor of 1500. The floor was
calibrated against a frame where the wheel happened to sit at a favourable phase, so the assertion
has always been phase-dependent and only ever passed by luck. **The floor was NOT lowered** — moving
a threshold to meet the frame is the one thing FLAKES forbids. Three ways out, and choosing between
them is a taste call:
  (a) STAGE THE PHASE. Pin `G.towWheel.rotation.z` in 28_skifield_base's own stage the way the bird's
      pose is pinned, so the showcase frame presents the wheel's face. Consistent with existing
      practice (29_lodge_deck already stands the bird on a table for the composition). Needs care:
      the game writes the angle every frame, so a PIN callback and the game loop would race — the
      stage would have to win, or the game would need a `G.wheelLock` the way it has `G.camLock`.
  (b) GIVE THE WHEEL A PHASE CONSTANT so that at the pinned clock it is face-on. Cheapest, but it is
      fitting the world to the test and should be called that if it is chosen.
  (c) ACCEPT that the vantage photographs the wheel edge-on and re-derive the floor from the now
      deterministic frame — only defensible as a deliberate re-pin by Eric, never as a fix.
WHERE TO JUDGE IT: 28_skifield_base. The wheel is the red disc above the blue base shed.

**CLOSED 2026-09-04, session 23, on Eric's call — option (c), and the reference turned out to be the
wrong half.** Re-deriving `absent` the way every other reference in subjects.mjs was derived — same
vantage, same stage, same classifier, the bull wheel taken out of the scene and held out every
frame — scores **0, 0, 0**. The scarlet window sees the wheel and nothing else in that box. Where
440 came from is recorded nowhere (it is the only reference in that file with no derivation beside
it) and it does not reproduce: the carpark frame from the same camera, which is how the hutgreen
reference was taken, scores 11.
    before   staged 490..2038 (nondeterministic)   floor 1500   reference 440   ratio 3.4x
    after    staged 838 +/-1  (deterministic)      floor  400   reference   0   ratio inf
The floor moved DOWN and that is grounding, not weakening: 1500 was fitted to the top of a
nondeterministic spread and was unmeetable by the frame the rig actually produces. 400 is 0.48 of
the deterministic reading, in line with the sibling kea test in the same vantage (70 against 128).
Options (a) and (b) were not taken and remain available if Eric later wants the wheel face-on for
composition rather than merely present.

### 82. HORIZON-SCALE GRASS NEEDS ALPHA CARDS, AND THE MEASUREMENT THAT SAYS SO IS IN P4e
Filed 2026-09-04, session 22 (REPLAT P4e), as the honest remainder of that piece.
WHAT P4e DELIVERED: the field's hard 14 m boundary is gone at the play camera — the grass tapers to
the horizon and the colour seam across the old edge collapsed from 18.3 levels of blue to 2.7. From
the AIR at fourteen metres up the improvement is large but the extent is still findable, because the
far tier stops at 28 m and everything past that is ground.
WHY IT STOPS AT 28 m, MEASURED AT THE RETINA FRAMEBUFFER (DPR 2, `perf.mjs bird`, best-of-12,
interleaved, machine at load ~8):
      no far tier                31.5 ms
      far tier 225k over 28 m    40.7 ms     <- SHIPPED, +9 ms
      far tier 450k over 40 m    48.0 ms     +16 ms
      far tier 450k over 40 m, seg 1, no shadow   40.1 ms
Real geometry to the horizon is simply not affordable: covering 28 m costs +9 ms and 40 m costs
+16 ms, and the map is 240 m across. Two levers were measured and both are small — dropping the
shadow receive saves 2.4 ms, and seg 1 saves nothing at all, which says the cost is FILL and not
vertices.
WHAT WOULD BUY THE REST: alpha-tested CARDS. One quad carrying fifteen blades in a texture gets the
same coverage for a fifteenth of the instances, which is exactly the ratio the fill measurement says
is needed. It was not attempted in P4e because it wants a CC0 grass alpha atlas (an asset and a
licence line), alpha-to-coverage or an alpha test with the sorting that implies, and its own LOD
handover to the geometry tier — that is a piece, not a tuning, and shipping it half-built would have
put a second ring in the field.
DO NOT reach for "just extend the radius" instead. It was measured and it is worse than doing
nothing: at 40 m with the count raised to hold density the edge does not disappear, it MOVES, and
`edgefind` scores it 16.90 against the 14 m field's 5.92, because at that range the fade compresses
into a handful of pixels near the horizon. A bigger disc is still a disc.

### 83. THE KEA'S UNDERWING FLASH IS A SLIVER, NOT A FLASH — THE COVERT MASK IS TOO SMALL
Filed 2026-09-04, session 28 (REPLAT P5d2). The gate works; the region it gates is the wrong shape.
WHAT IS RIGHT: a kea shows no red until it opens, and that is now true and measured — **0 of 810,000
pixels** read scarlet on a folded bird, because the coverts and the barred underside are both tied
to the wing's own open state and driven every frame.
WHAT IS WRONG: with the wing OPEN, only **124** pixels on the bird read scarlet. The covert mask
catches **106 of 3,009 vertices** — a thin strip along the wing's leading edge where
`kea_underwing_01` shows a broad flash across the whole inner wing. Opening the wing therefore
reveals almost nothing, which is the opposite of the bird's most recognisable feature.
WHY IT IS SMALL: the mask is `bone is Humerus AND normal·up < -0.35`. That is a sound test and it
was tightened to -0.35 precisely because -0.15 leaked scarlet onto the OUTSIDE of a folded wing. But
a folded wing curls its coverts outward, so the only vertices that stay reliably ventral are the few
along the fold line. **The normal cannot separate what the pose keeps moving.**
THE FIX, for whoever takes it: define the coverts by POSITION rather than by normal — the proximal
ventral quadrant of the wing, measured in the wing's own frame (along the humerus, below its axis).
Position does not change with the fold, so the mask can be as broad as the plate without leaking.
`aKeaCovert` is already a separate baked attribute and the shader already gates it, so this is a
change to one bake loop and nothing else.
DO NOT reach for loosening the normal threshold instead: that is the change that put red on the
outside of a folded wing, and the 0-pixel result above is what it costs to undo.

### 84. THE KEA'S FEATHER SCALLOPING NEEDS A PAINTED ALBEDO
Filed 2026-09-04, session 28 (REPLAT P5d2), on Eric's instruction not to attempt it in that pass.
`kea_underwing_01` shows every body feather **dark-rimmed** — a scalloped, scaled look that is most
of what makes a kea read as a kea in a close frame. The base mesh is a black palm cockatoo whose
albedo has silky, unscalloped plumage, and the recolour takes hue from a palette and DETAIL from
that texture's luminance. There is no scalloping in the source to take, so no palette or tint can
synthesise it.
IT MUST NOT BE FAKED WITH NOISE. A procedural rim would have to key off UV or position and would
tile visibly against feather flow; the battery asserts no `scallop` term exists in the shader for
exactly that reason.
WHAT IT ACTUALLY NEEDS: a painted albedo over the model's existing UVs — either hand-painted in
Blender's texture paint over the current map, or a feather-edge generator baked to UV space. Either
way it is a texture piece with its own proof, not a tuning of P5d.

### 85. THE SKI LODGE DECK IS NOT IN THE PROP REGISTRY
Filed 2026-09-05, session 30 (REPLAT P6A), deliberately left out of that piece and written down
rather than half-done. Every other structure in both biomes is now a registry entry; the lodge's
deck is not. It is decking, a rail run, two tables, a bench and a flight of steps, drawn in WORLD
coordinates inside `buildSkifield` with **three `railTop` colliders interleaved through the
geometry** — so extracting it is not the mechanical lift the other twenty-six were, and P6A's
success condition was that nothing moves.
WHY IT CAN WAIT: it is furniture rather than a building, and a GLB batch will deliver the lodge
itself long before it delivers the deck a kea stands on.
WHAT IT NEEDS: probably three entries (`lodge_deck`, `deck_table` placed twice, `deck_steps`),
with the railTop colliders declared on the entries instead of called inline — and the same
before/after mesh-digest discipline P6A used, because the deck is in the 29_lodge_deck vantage.

### 86. GIT-LFS IS NOW UNAVOIDABLE AND IS ITS OWN PIECE
Filed 2026-09-05, session 30 (REPLAT P6A), which P6A.md explicitly forbade folding in. The asset
tier is ~30 MB today (`assets/models/kea_astra.glb` alone is 19 MB) and P6A just made adding models
cheap, which means the tier is about to grow on purpose. Every GLB is a binary blob that git stores
whole, per revision — and the bird alone has already been through four derivations in the tree.
THE DECISION IS NOT "TURN LFS ON": it is a choice between git-lfs, a fetch-on-build step, and
shipping the assets out of band, and it interacts with how `dist/` is deployed and with whether a
fresh clone can run the gauntlet offline (it can today, which is worth something). LICENCES.md's
own size note already flagged the threshold: "if the asset tier grows past a few tens of MB, that
is the moment to reach for git-lfs or a fetch-on-build step". It has.

### 87. A SWAPPED MODEL CANNOT BE DRESSED INTO A P3 SCANNED FAMILY
Filed 2026-09-05, session 30 (REPLAT P6A), found while writing the material-policy column and
written down rather than half-built. A registry entry's `material.keepModelPBR:false` currently
strips the model's own maps and applies the entry's declared `color`. What it does NOT do is what
the column implies it might: dress the model into the P3 scanned family the entry names, so a
grey-boxed GLB picks up real albedo, normal and roughness.
WHY IT IS NOT A ONE-LINER: `installMaterials` has already run by the time `installModels` does —
main.mjs awaits the scanned sets before the model tier, deliberately, so a swapped prop lands into a
finished world rather than a half-dressed one. Pushing a new material into `matFam(f).mats` after
that install does nothing, because the install is what applies the maps. Doing it properly means
either a re-dress pass the material tier exposes, or moving the model tier ahead of the material
tier and accepting that a model then loads before the world it stands in is dressed.
IN THE MEANTIME: `material.family` is validated against the real seven names and recorded as INTENT
for whoever brings the file, and each placement records the families its primitive body actually
resolved (`propsState().families`) so the intent can be checked against the thing being replaced.
