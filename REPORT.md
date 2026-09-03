# REPORT — session 15, 2026-09-03: REPLAT P2, sky and sun

**P2 is built and certified. Every frame is flagged and nothing is re-pinned, as ordered.**

Branch `replat-b`. Lock taken at start, released as the final act. The tip was certified BEFORE
anything moved — gate CERTIFIED-SHIP and diff 28 compared 0 flagged — so this piece was built on a
known-good ground rather than an assumed one.

| | |
|---|---|
| nine batteries | ALL PASS |
| gate | CERTIFIED-SHIP · gate-selftest ALL PASS |
| P2 sabotages | 6 written, 6 go red |
| captures | 30/30, no retakes, no give-ups |
| stability | 4 vantages x 4 takes, 0 unstable (worst 0.9981) |
| plays | journey drives carpark → map → GO → load → ski field → to-do → ticking footer |
| diff | 25 of 28 flagged — **for you, not re-pinned** |
| subjects | 16 checked, 2 red **on purpose** (and one old red fixed itself) |
| specimen | `6a6aac54d7a3d3dff61de5f634052082` src/game.mjs |
| bundle | `372f1b98408a424e2a621b0d7f048d85` dist/kea.js |
| frozen | `8232590523658dfc3f5a1fe59a916de0` **unchanged** |

## WHAT TO LOOK AT FIRST

`gauntlet/reference/pairs/` — 25 sidebyside composites, and **eight of them are new because that
tool had no Birds of War pair in it at all.** The one instrument whose entire job is "closer to
THAT?" could not put the wall you named beside the game. Start with:

- `01_carpark_wide__ref_bow_00.png` — daylight
- `06_skyline__ref_bow_04.png` and `11_trailhead__ref_bow_04.png` — warmth and haze
- `07_jam__ref_bow_06.png` and `12_seal_midpeel__ref_bow_06.png` — shadow softness

`gauntlet/reference/pairs/p2-strips/` — 24 frames, every taste call I made, each labelled with the
numbers that produced it and `LOCKED` on the one I shipped. Nothing here was shipped unseen.

## MY HONEST READ ON YOUR THREE FRAMES

**ref_bow_00, daylight.** Warmth and coloured shade have moved genuinely toward it. The remaining
gap is overwhelmingly **material and geometry**, not light: the reference puts its daylight on
brick, weatherboard and foliage, and throws dappled shadow off a leafy caster. We have flat
untextured colour on rounded primitives and no leafy caster anywhere. That is P3–P6.

**ref_bow_04, warmth.** The closest of the three. Distance now hazes on an exponential curve with
no near plane to give it away — the old linear fog put the whole carpark inside a hard no-haze zone
and then ramped, which is why the hills read as pasted on.

**ref_bow_06, shadow softness.** The softness is right; **the contrast is not.** Shadows are real,
soft-edged and correctly placed, and they are gentler than the reference. Ratio variant C is the
closer answer and it is already shot — `p2-strips/ratio_C_stronger__*.png`. That is a one-constant
change if you want it.

## THE DECISION I WANT FROM YOU

**The sky dome is now the only thing in the frame that is not lit** (TODO 76). It is
MeshBasicMaterial with `fog:false` — authored art, a saturated blue tuned to the palette your
vividness law names. Everything else is lit by a measured HDRI and hazed by real fog, so the seam
shows precisely where the reference is least like us: ref_bow_00 and _04 both have a blown, pale,
warm sky, and the dome stays a confident blue.

**REPLAT §3 and ARTBIBLE's vividness law genuinely disagree here, and a real NZ alpine sky IS deep
blue.** No tuning satisfies both, so I did not pick. Three options are in TODO 76; my
recommendation is the middle one — tune only the dome's LOW band toward the fog colour so the
horizon stops being a seam, keep `skyTop` saturated. Small, reversible, and it does not touch the
vividness law at altitude. Worth a strip at 06 and 11.

## THE FINDINGS THAT MATTER

**The carpark could not receive a shadow, and never has.** `{noshadow:true}` turns off cast AND
receive. The slab, its apron and its bay markings all used it, so every car in 01, 07 and 12 has
been casting dutifully into a surface that could not take a shadow. ARTBIBLE lists "no cast shadows
anywhere" as a GAP and treats it as work not yet done — it was one flag per surface. The road and
the ski-field slab already did this correctly; the carpark was simply missed.

**`sun.shadow.radius=3` has been decorative since the day it was written.** PCFSoftShadowMap
ignores `shadow.radius` outright. VSM is the only three shadow map whose softness is a parameter,
and at zero ambient its penumbra is clean where PCFSoft's is dithered.

**Your fill and rim lights were the thing erasing the shadows.** They are directional lights that
do not cast — authored to fake directional interest back when nothing cast — so every unit they
carried filled a real shadow straight back in. Their energy moved to the sun, which does cast.
Exposure lands on the P1 baseline to within a third of a level while YLOW falls 25.

**TODO 74 fixed itself, and its diagnosis was wrong.** `07_jam` carblue went 2950 → **10655**
against an untouched floor of 3000. No floor was lowered. The real cause of every subject-classifier
movement is not r128 pixel counts — it is that **P2 made shade coloured instead of grey**, and every
window in `subjects.mjs` was cut on frames where shade was neutral. Measured per clause: the lodge's
green rotates out of its HUE window (15877 → 5479 on that clause alone, saturation held, value
improved), and the beak's `dark AND grey` conjunction is empty because the mean saturation of its
dark pixels went **0.154 → 0.569**. Written up as TODO 75, which supersedes 74's diagnosis but
keeps its piece.

## RED ON PURPOSE — TWO SUBJECT CHECKS

`25_preen_follow beak` 3/12 and `29_lodge_deck hutgreen` 4645/8000. **No floor and no window was
touched.** I verified both by eye: the lodge fills a third of its frame and the preening bird is
centre-frame. Both fail conservatively — they under-report presence, so they still cannot pass a
frame whose subject is genuinely gone. Recalibration is TODO 75 and it needs your authority,
because the windows encode an assumption P2 deliberately retired.

## FOUR MISTAKES OF MINE, ALL CAUGHT BY MEASURING AGAIN

Recorded because each one nearly shipped a wrong number or a wrong story.

1. A 600s capture "hang" was **124 leaked Chrome processes** from earlier killed runs starving the
   machine — not a code fault. One shot alone ran in 5.9s. Your own Chrome was left alone; the test
   browsers were told apart by `--headless`, not by name.
2. A shadow probe measured 252,475 px of "shadow" that was **the to-do panel**, which opened
   because the probe did not replicate QUIET. Void; re-run properly it is 40,601 px.
3. I first diagnosed the subject failures as the subjects *brightening* out of a value ceiling.
   Both had got **darker**. Splitting each window into its conjuncts gave the real cause.
4. My own `(fill+rim)/sun` guard was first written loose enough to **forbid nothing** — a sabotage
   restoring the old fill came back with zero findings. Re-derived from the two measured states.

## ASSETS — THE FIRST BINARIES IN THE REPO

Three Poly Haven HDRIs, all CC0, 4.7MB, `assets/LICENCES.md` written as REPLAT requires. **Each
was verified against the publisher's own md5 taken from the API, not from the downloaded file**, and
the hash is recorded so a later session can re-verify rather than trust. Three because the sky was a
taste call and went to a strip; `KEASKY='{"hdri":"..."}'` reshoots any of them without needing this
session's network access back. `dry_field` looked warmest and is measurably the worst fit — its sun
sits at 20.2° elevation against the game's 39.5°, so its light would contradict the shadows.

## SUGGESTED NEXT THREE

1. **Judge this set and re-pin it** (or ask for ratio variant C first, then re-pin). Everything is
   flagged and waiting; P3 should not be built on an unjudged light model.
2. **TODO 76, the sky dome** — the last P2-shaped gap, and the one call I could not make for you.
3. **P3, scanned materials.** It is where the rest of the ref_bow_00 gap actually lives, and the
   asset tier, the licence ledger and the `publicDir` pipeline this piece built are exactly what it
   needs. TODO 75 (subject recalibration) is best done in the same breath, since P3 moves surface
   colour again and the windows will need cutting once, not twice.
