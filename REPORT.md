# REPORT — REPLAT P4b, the field you played (session 19, 2026-09-03)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `758d82092e337f53141c607a8e0390d7`.
**Nothing re-pinned. 27 of 28 vantages flagged.**

## YOUR DIAGNOSIS WAS RIGHT, AND I HAD WRITTEN IT DOWN MYSELF

P4's own ARTBIBLE entry says, under what is still short: *"the 260 tuft cones are still there,
standing among the real blades... left because removing 260 rnd draws shifts the seeded stream."*
That was my reasoning and **it was also wrong on its own terms** — that block and the ski field's
26 tufts both sat inside `if(!HEADLESS)`, so node never made those draws and no battery could have
seen them. I had a real-sounding reason not to delete them and never checked whether it applied.

## THE FOUR FIXES

**(1) The old procedural grass is deleted.** 260 cones in the carpark, 26 tuft cylinders in the ski
field, 5 on the nest knoll. A battery now asserts `PAL.tussock` survives only as a terrain vertex
colour, so nothing can scatter it as geometry again.

**(2) A continuous cover layer** — 150,000 blades in a 10 m radius, shorter than the shortest clump
blade by construction so the clumps rise out of it and your readability trade is untouched.

**(3) Real colour, per blade and per clump** — green base, ochre/tawny/bleached body, rust tips,
from `nz_tussock_03`'s foreground mound. Plus the half no blade could fix: **the ground itself**.

**(4) Blades widened toward a leaf** — taper is per-layer now (0.55 where it was a global 0.72),
widths 9–20 mm, so a leaf stays wide along its length and catches light instead of reading as hair.

## THE COVER LAYER'S COST, AS YOU ASKED

Loop-timed scene cost, GPU synced, at the Retina framebuffer (2304×1296). Baseline **8.978 ms**.

    clumps only        19.863 ms   2.2x baseline
    clumps + cover     25.165 ms   2.8x baseline
    THE COVER LAYER     +5.302 ms

P4 shipped at 23.878 ms, so all of the above costs **1.3 ms over what you already accepted**.

## TWO THINGS WORTH KNOWING

**My first cover layer was wrong in a way only measurement shows.** 340,000 blades over 16 m,
**21.9 ms — more than the clump layer itself** — and it still did not cure the bare ground at the
play camera. A 100 mm blade at fifteen metres is two pixels tall and the ground behind it wins.
So I measured the ground instead of adding more blades: the terrain averages **#9b9787**, a
desaturated grey-beige. That is the sand. One tint multiplier on the grass-family terrain costs
nothing and is **the single largest thing in P4b that the play camera actually sees.**

**My colour work did nothing at first, and I proved the mechanism before touching it.** The
gradient was in and the field came back exactly as monochrome. Rather than read the shader, I
forced base to pure red and tip to pure blue through `KEAGRASS` — red bases, blue tips, working
perfectly. The palette was four colours inside twenty degrees of hue. The battery asserts colour
*separation* now, not the presence of a mechanism, because presence was already true.

## FRAMES TO EYEBALL

- `gauntlet/capture/14_player_view.png` — the play camera, which is the one you played
- `gauntlet/capture/05_tussock_ground.png` — bird height, against **nz_tussock_01/03**
- `gauntlet/capture/03_kea_plate.png` — the bird reads **2632** against a floor of 1600, better
  than P4 shipped, because the tinted ground gives it something to sit against

## VERIFIED

Nine batteries ALL PASS; **fourteen P4b sabotages, all fourteen red**; 30/30 vantages shoot clean;
sidebyside 33 pairs; subjects 16 checked, **2 missing — the two known TODO 75 reds, no new
regression**. diff 27 of 28 flagged, boxdiff 7 of 12 changed, pxdiff 28 over band.

**Stability is clean; the machine is not.** A four-vantage sweep flagged 05 at 0.9859 — the frame
P4b changed most, so I suspected the field's anchor snap. Run alone at four takes it reads
**1.0000**. Re-running flagged 21 and 03 instead and left 05 clean; alone those read 0.9998 and
0.9997. A flagged vantage that *moves between runs* is measuring load, not code — the same finding
session 17 recorded for 22_torch_beam. Load averaged ~6 from this session's own capture passes.
No threshold was touched.

## WHAT IS STILL SHORT

- **The ground tint is one flat multiplier.** It cures the sand; it does not give the ground its own
  variation. Splat-blending the P3 gravel family into the grass one is the real answer, and that is
  P3's territory.
- **The cover stops at 10 m**; past that the ground tint carries it. First thing to look at if the
  field ever reads as a disc following the bird.

## SUGGESTED NEXT

P5 — the kea as an asset. It is now the only thing in frame still made of primitives.
