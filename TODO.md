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

### 13. style-star
Snapshot score at page open; on page turn, STYLE star if chaos earned
during the page >= par. Par v1 = 1.5 x the sum of the page missions'
points (placeholder — tuning is playtest, note it in the log).
PROOF: simulate awards across a page turn; assert grant and deny on both
sides of par.

### 14. clean-getaway-star
Zero cagings while the page was open (either bird counts in co-op). Cage
spy pattern.
PROOF: clean page grants; a caging mid-page voids.

### 15. coop-jail-hardening
Co-op only: the caged timer freezes, mash becomes a SQUAWK ping (locator
on the partner's screen, no time reduction), latch-peck JAILBREAK is the
only fast exit. Solo behaviour unchanged.
PROOF: co-op stage — caged persists without partner action, frees on latch
onDone; solo stage — mash-out still works.

### 16. score-attribution
Thread the acting kea's idx through award() into per-kea ledgers alongside
the shared score. Outside VS nothing visible changes.
PROOF: two keas award separately; ledgers split; shared total unchanged.

### 17. home-positions
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
