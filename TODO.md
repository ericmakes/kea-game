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

### 18. fix-verb  (VS)
Restorer role gets one generic verb: E-hold on any wrecked tear → restored
state; ORDER points = chaos value undone x DECAY^cycles (per object; both
directions share the cycle count).
PROOF: wreck/fix/wreck/fix one object headless; assert the decaying value
sequence and the state flips.

### 19. botch-system  (VS)
Every restore lands at BOTCH fidelity: seeded wonk transform — slight
rotation, offset, misalignment — signs crooked, wipers skewed. Success
condition still true. Applies to fixes, carry-back placements, and
replacements.
PROOF: restore an object; assert state restored AND transform inside the
wonk band and not pristine; seeded so the tripwire stays deterministic.

### 20. carry-back-restore  (VS)
Displaced props (cones on the road, boots, stolen shinies): restorer picks
up and drops within the home radius → restored (botched placement) + ORDER
points on the drop.
PROOF: displace, carry, drop in radius → points + restored; drop outside
radius → nothing.

### 21. consumable-replace  (VS)
Scoffed food cannot be un-eaten: each consumable class gets a SOURCE (the
picnic spread / the chilly bin). Restorer fetches a replacement and places
it at the home spot → restored + ORDER points. Travel time is the price of
the menace's snack strategy.
PROOF: scoff → fetch → place at home → points + prop present (botched);
source depletion rules assert.

### 22. vs-match-scaffold
Title gains 2 KEA VERSUS. Match flow: coin-flip roles (THE MENACE / THE
MANAGEMENT popups), timer 3/5/8 min (default 5), horn, results screen with
split scores + the biggest single play each side. Tie → sudden death,
first point wins, 60s cap then draw.
PROOF: state machine headless — seeded random roles, timer expiry, winner
decision incl. the tie path. Screens: leave flagged for Eric.

### 23. arena-scoping
A match is one patch: only interactables whose mission area matches the
arena score; anything else → WRONG PATCH, NO POINTS prompt. RANDOM PATCH
picks one; TOUR runs the chapter order as a series.
PROOF: in-arena act scores; out-of-arena act scores zero and prompts;
seeded selector; TOUR sequence asserts.

### 24. role-aware-rex  (VS)
Rex hunts THE MENACE specifically at WANTED >= 3 during VS; a caging pays
the restorer an ORDER bonus; menace mash-out is solo (latch locked in VS).
PROOF: staged — rex targets the menace only; bonus lands; latch locked.

### 25. vs-hud-split
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

### 30. pin-G-time-set-wide  (harness-side only — game file untouched)
Found in session 3 while stabilising vantage 25. The grass shader sways on uTime, so EVERY
grass-filled frame varies with how many animation frames the settle got through. Measured: 25
sat at 0.9949 take-to-take until G.time was pinned, then 0.9998. The same effect is the residual
~0.002-0.003 on every grass vantage (05 at 0.9969, 03 at 0.9972, 14 at 0.9978).
FIX: pin G.time in QUIET so all time-based animation freezes for every vantage at once, the way
21 and 25 already do locally. Expect the whole set to land near 0.999 take-to-take.
RE-PIN: all of them, ONCE — the sway phase freezes at whatever G.time is chosen, so every frame
moves slightly. Judge before pinning; leave flagged for Eric.
WHY IT WAS NOT DONE IN SESSION 3: it is a one-line change with a 25-frame re-pin behind it, and
that sweep deserves its own piece rather than riding along inside another one.
CORRECTION, MEASURED IN SESSION 4 — THE SCOPE IS WIDER THAN THE SSIM NUMBERS SAY, AND SO IS THE
LIST. The session-3 sweep recorded 01_carpark_wide at 1.0000 take-to-take and filed it under
"clean as found". That figure is wrong. Reshot twice in session 4 against nothing but itself,
baseline out of the picture: 755 pixels differ by more than 8 grey levels, spread across the FULL
frame width (bbox x 5..959, y 145..267 - the tussock band at the horizon), hottest 60px cells at
x 780, 600, 660, 540, 0 and 840, all at y 180. So 01 sways exactly like the frames already on the
list; it merely hides it better. The reason SSIM missed it is amplitude, not area: max delta is
only 33 levels, and a low-amplitude change spread thin over a wide band moves SSIM less than the
fourth decimal place on a 960x540 frame.
THAT IS THE SAME BLIND SPOT AS ITEM 31, FROM THE OTHER END. 31 is a large change nobody can see
because SSIM averages it away over the whole frame; this is a small change nobody can see for the
same reason. Any instrument built for 31 should be pointed at this too, and a changed-pixel count
would have caught both - it is what caught this one.
CONSEQUENCES FOR THIS ITEM: (a) do not trust the session-3 "clean as found" column to say which
vantages the G.time pin will move - it under-reports, so re-measure with a pixel count rather than
SSIM before deciding what the re-pin sweep covers; (b) "expect the whole set to land near 0.999"
is optimistic phrasing, since several frames already READ as 0.999+ while still churning
hundreds of pixels - the honest target is a changed-pixel count near zero, not an SSIM near one.

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

### 32. rbox-bevel-swallows-wall-detail
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

### 36. tour-chassis  (invisible surgery - first tour piece)
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

### 39. skifield-biome
First new map: a club ski field diorama - rope tow line, day lodge with
deck, ski racks, groomed band, drifts banked against structures (snow
touches buildings, never buries - the unbury verdict as law).
GRADUATION: Carpark's ski corner + missions migrate here; Carpark
vantage 10 re-staged or retired, Eric judges. All new skifield vantages
are first-pins: shoot, leave ALL flagged.
PROOF: boot-skifield battery in house style; presence checks per new
vantage; migrated missions complete headless in the new map.

### 40. skifield-missions
8-12 missions incl. the graduates. Signatures: tray-slide down the
groomed band (new chaos verb), rope-tow ride, goggle heist, deck lunch
raids (VS consumable sources), buried-lunchbox digs. Star page wired;
coop badges where a mission wants two birds.
PROOF: mission batteries; star grants both sides; TAB shows the page.

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

### 52. THE CAGE HINT STILL TELLS A CO-OP BIRD TO MASH ITS WAY OUT
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
