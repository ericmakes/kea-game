# SPIKE-STANDARD TARGETS — one per map (SPIKE_ADOPT 21d)

Eric, 2026-10-04: "the spike-standard target for [each map] must be built with the same grade, so every map inherits
the look I approved." The spike rendered one frame, the Carpark's; every other map gets a target built the same way:

1. **The game's own key vantage**, pinned, shot with its sky key (`SKYKEY=1`), HUD and all.
2. **An image-to-image pass to the spike's standard** — Higgsfield `gpt_image_2_5` (high, 2K), two references: the
   game frame (composition, every object, the camera) and the spike frame (`gauntlet/reference/spike/01_carpark_wide.png`,
   the material and light standard). The prompt keeps the composition exactly, changes only surfaces and light, removes
   the HUD. Two variants; the one that holds the horizon and layout is kept. Stored raw in `raw/`.
3. **The approved grade, applied by the game's own operator** — `tools/grade_match.mjs` runs the raw target through the
   arithmetic of `gradePass` (src/post.mjs) with the values FILM.grade ships, read from that file. Not a statistics
   transfer: that forced the spike's content onto the target (a snowfield made murky at a carpark's mean brightness).
4. **Its sky key beside it** (`<name>.sky.png`, the game frame's own) — the target keeps the frame's composition.

Scored with `TARGET=gauntlet/reference/targets/<name>.jpg WALL=record node gauntlet/verify/framescore.mjs <frame>`: the
target governs luma, hue, saturation, contrast and aerial perspective; the bow plates govern detail density and snow.

| map | key vantage | target | raw | Higgsfield job | grade at build |
|---|---|---|---|---|---|
| Ski Field | `28_skifield_base` | `28_skifield_base.jpg` | `raw/28_skifield_base_higgsfield.jpg` | `5dc4a85a-5b7e-44aa-9ec4-0cf4e8f61789` (variant A of 2; B `63b82f74`) | sat 1.15, warm 0.05, warmG 0.55, contrast 1.05, vig 0.22 |

KNOWN LIMIT: a generator does not hold geometry to the pixel. The Ski Field target drew its far mountains a little
taller than the game's, so the frame's sky key leaves a thin band of the target's sky counted as ground. Whole-frame
statistics tolerate it; anything per-pixel would not.
