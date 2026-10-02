# GAPAUDIT.md — how far the game is from the spike and from the trailer, measured

SPIKE ADOPTION piece 1, 2026-10-02, branch `replat-b`. The instrument is
`gauntlet/verify/framescore.mjs`, the render spike's whole-frame platescore driver lifted into the
gauntlet. It calls `platescore.mjs`'s own exported measuring and band-making UNCHANGED (md5
`4903d650…08f2`, the same file the spike copied), so its numbers and the spike's are the same
instrument. **Proved before use:** on the spike's own inputs it reproduces the spike's verdicts
exactly (game baseline 2/6, spike 5/6 against ref_bow), and the spike frame scores 6/6 against
itself as a positive control.

Re-run: `WALL=both node gauntlet/verify/framescore.mjs gauntlet/capture/baseline/<v>.png ...`

## The six key vantages

The six `sidebyside.mjs` pairs with ARTBIBLE P2's light trio: 01 and 02 against ref_bow_00
(DAYLIGHT), 06 and 11 against ref_bow_04 (WARMTH + HAZE), 12 and 07 against ref_bow_06 (SHADOW
SOFTNESS). The frames are the pinned baselines at commit `91cfe0d` (piece 0).

**Against the Birds of War wall** (`ref_bow_00 / 04 / 06`; in band if inside ANY plate's band).
A number in brackets is how far OUTSIDE the nearest band, in that band's half-widths.

| vantage | in band | edge density | ridge p10 | highlight patch | luma | hue | saturation |
|---|---|---|---|---|---|---|---|
| 01_carpark_wide | **2/6** | 0.140 (0.6) | 0.324 (0.2) | 0.087 ✓ | 0.562 (0.2) | 57 ✓ | 0.095 (1.7) |
| 02_hut_snow | **4/6** | 0.356 (0.1) | 0.289 ✓ | 0.101 ✓ | 0.498 ✓ | 49 ✓ | 0.192 (0.1) |
| 06_skyline | **2/6** | 0.198 ✓ | 0.405 (1.4) | 0.078 ✓ | 0.547 (0.1) | 175 (3.3) | 0.062 (2.0) |
| 11_trailhead | **3/6** | 0.398 (0.6) | 0.354 (0.6) | 0.057 ✓ | 0.557 (0.1) | 46 ✓ | 0.315 ✓ |
| 12_seal_midpeel | **3/6** | 0.152 (0.5) | 0.181 ✓ | 0.108 ✓ | 0.510 ✓ | 136 (2.0) | 0.036 (2.2) |
| 07_jam | **1/6** | 0.139 (0.6) | 0.376 (1.0) | 0.090 ✓ | 0.563 (0.2) | 196 (4.0) | 0.098 (1.6) |
| *spike 01, for scale* | *5/6* | *0.180 (0.1)* | *0.163 ✓* | *0.063 ✓* | *0.423 ✓* | *51 ✓* | *0.285 ✓* |

**Against the spike's frame** (`gauntlet/reference/spike/01_carpark_wide.png`, md5 `5508e114…`,
pinned 2026-10-02; one plate, its own four tiles set the band):

| vantage | in band | edge density | ridge p10 | highlight patch | luma | hue | saturation |
|---|---|---|---|---|---|---|---|
| 01_carpark_wide | **2/6** | 0.140 (0.1) | 0.324 (0.6) | 0.087 ✓ | 0.562 (0.8) | 57 ✓ | 0.095 (2.6) |
| 02_hut_snow | **3/6** | 0.356 (4.7) | 0.289 (0.2) | 0.101 ✓ | 0.498 ✓ | 49 ✓ | 0.192 (0.6) |
| 06_skyline | **2/6** | 0.198 ✓ | 0.405 (1.7) | 0.078 ✓ | 0.547 (0.6) | 175 (3.1) | 0.062 (3.3) |
| 11_trailhead | **3/6** | 0.398 (6.0) | 0.354 (1.0) | 0.057 ✓ | 0.557 (0.7) | 46 ✓ | 0.315 ✓ |
| 12_seal_midpeel | **3/6** | 0.152 ✓ | 0.181 ✓ | 0.108 ✓ | 0.510 (0.1) | 136 (1.8) | 0.036 (3.8) |
| 07_jam | **1/6** | 0.139 (0.2) | 0.376 (1.3) | 0.090 ✓ | 0.563 (0.8) | 196 (3.8) | 0.098 (2.5) |

The spike-wall comparison is only meaningful for 01 (same shot). For the other five it says how
far a different shot is from the spike's ONE frame, which is mostly a statement about the shot.

## What the table says, and what it cannot

- **Saturation is the consistent gap.** Out on 5 of 6 against the trailer, by 1.6–2.2 half-widths,
  and this is WITH the CSS `saturate(1.22)` boost already in the captured frame. That is Piece 2's
  brief — ColorManagement on, the un-converted light and fog colours that currently render too pale,
  and the CSS filter replaced by a grade the scorer can see.
- **Hue goes blue on the three sky-and-tarmac frames** (06 at 175°, 12 at 136°, 07 at 196°): their
  mean colour is dominated by blue sky and grey seal. Warm light will move it; it is also partly
  composition and should not be chased into a cast.
- **Luma runs a hair high on four** (0.547–0.563 against a ceiling near 0.539): the spike's 01 sits
  at 0.423 with the same plates.
- **Ridge p10 (the dark end) is high on 01, 06, 11, 07**: shade does not go dark enough. Both this
  and luma are the shade-tone question Piece 2 checks the tone mapper against.
- **Edge density is low on the carpark frames** (0.139–0.152): smooth seal and primitive props. The
  spike only reached 0.180 here too; it is geometry (Pieces 3–4), not grade.
- **A whole-frame statistic cannot see geometry.** A frame can be in band on all six and still read
  as CG. Eric's eye judges; this is the instrument.

## THE FRAME BUDGET — the gap the table does not show, and the larger one

Eric's rule is 60 fps with the full game running. `gauntlet/verify/framebudget.mjs` (headful system
Chrome on Metal, the game live, the bird flown round a circuit by real input) measures the SHIPPED
game, before any spike piece, at **40–70 ms per frame at 1920×1080 — 15–25 fps.**
`gauntlet/verify/frameablate.mjs`, one live unlocked session:

| state | mean ms/frame | fps |
|---|---|---|
| everything on (the game as shipped) | 65.7 / 40.0 (start / end of session) | 15–25 |
| post stack off (GTAO, bloom, DOF) | 30.5 | 33 |
| shadow map off (VSM 2048, 14-sample blur) | 32.4 | 31 |
| instanced grass hidden | 39.7 | 25 |
| half resolution | 28.1 | 36 |
| all four off | 13.8 | 72 |

GPU-bound and spread across four systems; no single cut brings it to 16.7 ms. Measured on battery
after ~40 minutes of sustained capture sweeps — thermal state moves the absolute figure (the same
state read 65.7 then 40.0 in one session), not the conclusion. The spike's 11–14 ms for one static
carpark was the warning; the game is already three to five times that.
