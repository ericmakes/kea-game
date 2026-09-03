# REPORT — REPLAT P3, scanned materials (session 16, 2026-09-03)

Branch `replat-b`. Gate **CERTIFIED-SHIP** at specimen `c48aced312c8966239a340c6f1c0391a`,
bundle `6159d4e8cdb54fb2aa038a3a472c336d`. SESSION.lock taken and released.
**Nothing was re-pinned. 27 of 28 vantages are flagged and waiting on you.**

## SHIPPED

**REPLAT P3 — scanned materials.** Seven CC0 PBR sets from Poly Haven replace the procedural
canvas textures on grass, gravel, asphalt, weatherboard, corrugated iron, brick and snow. Full
albedo + normal + roughness on every family. 21 files, 16 MB, every one md5-verified against the
publisher's API at import and recorded in `assets/LICENCES.md` before a line of code was written.

| family | set | tile | mode | texel |
|---|---|---|---|---|
| grass | withered_grass | 2.000 m | paint | 1.95 mm |
| gravel | gravel_floor_02 | 2.000 m | scan | 1.95 mm |
| asphalt | asphalt_02 | 3.000 m | scan | 2.93 mm |
| weatherboard | dark_planks | 2.000 m | paint | 1.95 mm |
| corrugate | corrugated_iron_02 | 2.700 m | paint | 2.64 mm |
| brick | brick_wall_09 | 2.010 m | scan | 1.96 mm |
| snow | snow_02 | 2.000 m | scan | 1.95 mm |

Snow is the seventh and was not in your six: the game has a whole ski field and `PAL.snow` was
carrying a procedural canvas exactly like the other six.

**Texel density is derived, not dialled.** `tileM` is the publisher's own published real-world
size, and a battery cross-checks it against the millimetres in LICENCES.md. Geometry UVs are
rescaled into metres and the textures repeat at 1/tileM, so a texel is ~2 mm across on every
surface in the game — which is the right number for a game played at bird height, since
ref_bow_02 and ref_bow_03 are both shot from about 300 mm up.

## FRAMES TO EYEBALL — the three you named

- `gauntlet/reference/pairs/01_carpark_wide__ref_bow_00.png` — brick/weatherboard target
- `gauntlet/reference/pairs/02_hut_snow__ref_bow_00.png`
- `gauntlet/reference/pairs/07_jam__ref_bow_06.png` — metal/asphalt target
- `gauntlet/reference/pairs/12_seal_midpeel__ref_bow_06.png`
- `gauntlet/reference/pairs/05_tussock_ground__ref_bow_02.png` — grass, at bird height
- `gauntlet/reference/pairs/24_verge_paddle__ref_bow_02.png`

And the two that show the most new material per pixel:

- `gauntlet/capture/19_roof_follow.png` — corrugated iron at true 79 mm pitch, brick chimney,
  red weatherboard laps, scanned stones in the tussock. The single best frame in the set.
- `gauntlet/capture/07_jam.png` — the road, at bird height, reading as a road.

## THREE THINGS I WANT YOUR CALL ON

1. **Tiling repetition on the car park.** `asphalt_02`'s tar cracks repeat every 3 m, about 13
   times across the 40 m slab. On the road they read as expansion joints and are almost a gain; on
   the slab they are a repeat. Every fix is bigger than P3 — a breakup layer, a stochastic or
   triplanar sample, or a 4 m tile at coarser texel — and every one is a taste call, so I measured
   it and left it. Visible at 01.
2. **The tints.** Four `scan` families wear the NZ palette as a luminance-neutral hue push:
   asphalt 0.45, snow 0.55, gravel 0.35, brick 0.20. 0 is the raw scan and 1 is the full palette
   hue at the scan's own brightness. They are shootable without a rebuild —
   `KEAMATS='{"families":{"asphalt":{"tint":0.8}}}'` — if you want a strip.
3. **The ski tow-top anchor block** is an old concrete block that shares `PAL.gravel`, so it now
   wears driveway gravel. Defensible on a weathered aggregate block, and the alternative is
   inventing a concrete family P3 was not asked for. Visible at 28. Say the word either way.

## WHAT IS STILL SHORT, AND WHY IT IS NOT P3's

- The grass scan is barely visible at the wide vantages, because 42,000 cone blades stand on top
  of it. That is P4's brief exactly, and the scan is what P4's blades will stand in.
- Brick rests on two chimneys. ref_bow_00 is a brick HOUSE and the game has no masonry wall — the
  gap is geometry, which is P6. The family is sourced, licensed, tiled and proven so P6 opens with
  it working instead of discovering on the day that it has no brick.
- Not one prop changed. ref_bow_03's bin plastic is a MODEL question: P6.
- The pale tarmac ellipses still read as puddles at 01. Pre-existing PHASE 1 gap, untouched.

## VERIFIED

Nine batteries ALL PASS; gate CERTIFIED-SHIP; gate-selftest ALL PASS; **fourteen P3 sabotages, 13
red and the 14th recorded in ARTBIBLE rather than hidden**; bundle builds; 30/30 vantages shoot
with no retakes and no GAVE UP; stability 4 vantages x 3 takes, 0 unstable (worst 0.9998), so seven
async texture fetches add no variance; sidebyside 33 pairs.

    diff       28 compared, 27 flagged, worst 0.7439
    boxdiff    12 compared, 10 changed
    pxdiff     28 compared, 27 over band
    subjects   16 checked, 2 missing — exactly the two known-red from TODO 75, no new regression

The one frame `diff` did **not** flag is `04_flight_underwing` at **ssim 1.0000** — the only
vantage with no family surface in it, byte for byte unchanged. That is the cleanest statement
available that the swap moved what it should and nothing else.

Two things worth knowing that are not defects: `harness-smoke` now prints 98 interactables where it
printed 100, and I proved that is a seeded-stream artefact rather than a regression — adding a
single empty `Object3D` to the untouched baseline moves the same number to 99, with chaos and every
boot count identical. And my first instrument run was garbage because I re-shot the whole set with
`BIOME=skifield` and overwrote the carpark pass; caught it by opening a frame, re-shot from an
emptied directory, and every number above is from the clean pass.

## SUGGESTED NEXT

P4 — instanced grass. It is the piece the P3 ground was built to sit under, and it is the biggest
remaining gap to ref_bow_02 and ref_bow_03.
