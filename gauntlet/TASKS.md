# TASKS — visual-ROI order (fix the biggest pixels first)

TIER A — the global image (touches every frame)
A1 grade: exposure/contrast so gold reads gold, snow holds detail, sky stays deep
A2 fog: atmospheric blue-grey, mountains layer in depth, no milk
A3 sun: intense clear key; soft glow only, never a disc

TIER B — the ground truth (half of every frame)
B1 tussock field: gold dominance, height variance, wind believable
B2 gravel carpark vs tussock: contrast enough to spot a cone at a glance
B3 scree + beech skirts: the transition band sells the valley

TIER C — THE BIRD (the protagonist is the pixel budget)
C1 scallop scale: readable at vantage 03, not noise at gameplay cam
C2 bill: long, slate, hooked — profile silhouette test
C3 underwing flash: vantage 04 must catch scarlet mid-flap
C4 P1/P2 tell at couch distance

TIER D — set pieces (hut corrugate + veranda, vehicle paint under IBL, campervan glass)
TIER E — humans (skin/cloth under the same light; pratfall pose reads at distance)
TIER F — fx (landing dust, snow splat, feather puffs, luge spray)


## Tier G (2026-08-27 audit): fidelity ladder — fun cartoon semi-realistic
- G1 kea mesh: hi-seg lathe body, two-arc culmen beak, rounded wing slats, eye-ring
- G2 humans: capsule limbs, mitten hands, nose blob
- G3 hut corrugation stripes + window inset
- G4 grass arc-bend (curve, not shear) + clump patches
- G5 cars: glass inset, wheel-arch shade, roof camber
- G6 snow soft edges + sparkle
- G7 per-ring depth haze on mountains
- G8 contact blobs under all props
Style guards: NZ-vivid saturation; outlines off; no PBR grey.


## Mega-wave (2026-08-27 evening): six-ask sweep — CERTIFIED
1. Radio crash: guarded-path null-safe (+sign/jam siblings); 1P take-EVERYTHING sweep enforces the class
2. Interpenetration: rotation-aware pushOut (van 0.2 / ute -0.15), humans collide (y-default fix), solid picnic table
3. Feathered wings: 8 pivoted blades/side, asymmetric stroke, per-feather lag whip, fan open/stack, orange gated to flight
4. 1P arrow camera (yaw/dist), 2P arrows untouched
5. PUBG touch: joystick + FLAP/GRAB/SCREECH + right-drag camera
6. 8BitDo x2: any-slot scan, hat-axis dpad, Switch face tolerance
Vantage 17_flight added. Systems 27g + couch pad-variants enforcing.

## EVERYTHING PASS (2026-08-28) — battery 9 added to the gate
Driven to completion (13): wiper keys sandwich t_pack t_bar passport can wake q_chimney q_muster q_pegs s_pole s_binding.
Proven elsewhere / behavioural review (24): roofhonk seal snow jam spikes slide q_peck q_table bootroad airmail b_five b_beanie s_ski s_lift t_pole2 t_sign sign paddock grumble3 b_dress b_body b_cap pielift q_median.
Finale proven: 4 chasers arm apex; nest wins; post-victory restart clean (GAME FIX: won/finale flags now reset in startGame).
Save round-trip proven end-to-end (rig localStorage stub). Cross-mode leakage clean. Perf floor <8ms.
Gauntlet upgrades: gate.sh one-command gate+ship; FLAKES.md staging law; battery 9.
Deferred: baseline SSIM auto-diff (diff.mjs) — next luxury.

## 2026-08-28 — THE EVERYTHING PASS (battery 9)
- Mission matrix: 13 classic ids driven by legit verbs (wiper x3, keys, sandwich, t_pack->t_bar chain,
  passport, can, wake, q_chimney, q_muster, q_pegs, s_pole, s_binding); 23 review-classified with reasons.
- Finale proven end-to-end: finaleOn -> 4 chasers arm apex -> nest -> winGame; post-victory restart clean.
- GAME FIX shipped: startGame now resets won/finaleOn/apexArmed/apexNoted (victory-flag leak).
- SAVE round-trip proven (rig gained localStorage stub); world-persistence-across-restart recorded
  as design-coherent acquittal.
- Cross-mode leakage green (colossal->classic scale/missions); perf floor <8ms headless mean.
- META: gate.sh (one-command nine-battery gate+ship), diff.mjs (SSIM baseline auto-diff),
  FLAKES.md (staging-law ledger).
