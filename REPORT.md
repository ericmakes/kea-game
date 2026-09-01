# REPORT — overnight session 3, 2026-09-01

Stop condition: **6 pieces certified.** Nothing parked as failed, nothing red, no piece needed a
third staging attempt except vantage 22 (recorded, not hidden). Final build
**d5c59486c55a24fb251bf0615605fde5**, gate CERTIFIED-SHIP, **25** vantages at 0 flagged, subjects
tripwire **7/7**.

**Read the first two sections before the shipped list.** The session opened on a red gate from a
clean tree, and three of the six pieces found that the *brief* was wrong about the rig.

## The gate was RED when I arrived, on your certified md5

First thing I did was run the gate on an untouched tree at `347b4b93` — the build last session
certified — and it came back `CERT-FAIL`: *every driven classic mission completes (12 driven, 1
failed)*. It then went green **11 times running** (8 standalone battery runs, 3 full gate-shaped
serial passes) and has not reproduced since.

The mission id was **unrecoverable**, and that is the part worth fixing: `gate.sh` keeps only
`tail -1` per battery, so the `FAILED:` console line scrolls past, and the assertion message
carried counts but no names. A rare red that cannot say what went red is a red you cannot chase.
Fixed the diagnostics only — the message is byte-identical when green — and proved it by sabotage:
killing the `can` driver prints `12 driven, 1 failed: can`, the exact shape of the opening failure.
That also settles what the numbers meant: all 13 were attempted and precisely one did not complete.
Logged as **FLAKES law 11**, review-tier. The next occurrence names itself.

## Three of six briefs described a rig that does not exist

This is now the standing pattern (it was two of six last session) and it is worth taking seriously
when you write the next diet:

| piece | the brief asked for | what the rig actually is |
|---|---|---|
| 7 `floating-text-cull` | cull a stray world-space label | **there is no world-space text in the game.** Zero `Sprite` occurrences; exactly two `fillText` sites, both on signposts |
| 27 `seeded-grass-tint` | prove it with two headless builds; move tint onto `rnd()` | `buildGrass` opens `if(HEADLESS)return`. And `rnd()` would inject **84 000 draws** mid-`buildWorld`, reshuffling every later object |
| 9 `facet-normals` | recompute vertex normals on lofted/lathed hulls | the banded hulls are `rbox`/ExtrudeGeometry, **non-indexed** — so `computeVertexNormals` is a *no-op*. `loft()` already calls it. `hull()` is retired |

In all three the honest fix existed and shipped; it just was not the briefed one.

## Shipped

| # | piece | md5 | one line |
|---|-------|-----|----------|
| 7 | floating-text-cull | *game untouched* | Premise falsified. The "tiny text" is a **snow patch** — a flat disc 53 units out, sliced into glyph-like fragments by tussock. Identified by projection, confirmed by ablation. No defect, no code. |
| 8 | white-object-18 | `01675b29` | The white lump behind the bird is **carpark grit**, intentional → kept, and now *named* (`G.gravel`) and *textured* (half the pebbles were unregistered in MAPKIND and rendered as flat putty). |
| 29 | vantage-staging-vs-the-flake-laws | *game untouched* | Five vantages never reshot the same twice. New `stability.mjs`. **QUIET was breaking FLAKES law 4** — see below. |
| 27 | seeded-grass-tint | `1667e397` | Blade tint (and the grass detail map) onto fixed-seed generators. Residual tripwire noise **0.9735 → 0.9983**, at the renderer's own floor. |
| 26 | followcam-preen-vantage | *game untouched* | New `25_preen_follow` at the engine's own follow geometry, staging the **worst** frame of the cycle. Verdict: piece 6's fix **holds**. |
| 9 | facet-normals | `d5c59486` | Curved hulls smooth without moving a vertex. Blocky facet bands → continuous curve. **Judge-required, nothing re-pinned.** |

## Parked / not improvised on (3 new TODO items, all with measurements)

- **28 `snow-patch-grounding`** — found while doing piece 7. Two of ten snow patches are **buried in
  the ski-field shed** (footprint samples at ground height 2.00 against a disc at y=0.05), which is
  why that shed stands in a white saucer in vantage 10. I did not fix it: "lay it on the surface"
  is wrong here (the raised sample is the shed *roof*, and a disc there pokes through the eave), so
  the patch must **move**, and where scenery moves to is a taste call next door to the blocked
  tussock wave. Full measurements and the stream-neutrality constraint are in the TODO.
- **30 `pin-G-time-set-wide`** — the grass shader sways on `uTime`, so every grass frame varies with
  the settle's frame count. Measured: vantage 25 went 0.9949 → 0.9998 when I pinned `G.time`
  locally. One line in QUIET fixes it set-wide, but it carries a 25-frame re-pin, which deserves
  its own piece rather than riding inside another.
- **31 `a-tripwire-that-can-see-shading`** — see the finding below.

Nothing was parked as *failed*. Vantage 22 took three staging attempts and I kept the record of
the first two because both were deterministic **and wrong**.

## The finding that matters most: QUIET is not quiet

`QUIET` parks all four humans at (46,46) **once**, and the ambient AI walks them straight back.
That is FLAKES law 4 word for word — *pin state inside the loop, every frame* — and the harness was
breaking its own law. Measured on vantage 02: Dave is at (46,46) at stage time and at
**(−19.19, −4.16), in frame beside the hut, 900 ms later**. Whether he arrived before the shutter
was down to the machine.

**It had been shipping for months.** The old baselines for **19, 21 and 14** each have a stray
hi-viz human standing in frame — pinned, judged and shipped. Nobody saw it because SSIM can only
say a frame *changed*, never that it is *wrong*. Same blind spot `subjects.mjs` was built for.

## The second finding: SSIM at 0.965 cannot police shading

Piece 9 re-shaded **every curved hull in the game** and the tripwire flagged **nothing** — worst
0.9865. Yet numerically the change is large (max channel delta 108 on vantage 12; 17 396 pixels
shifted by >6 levels), and a crop of the caravan roofline corner is night and day.

That is the **third** blind spot in one family, and the three together are worth a law:

1. a birdless frame is perfectly stable (piece 4),
2. an unstable frame reads as permanent drift (piece 29),
3. a global re-shade reads as no change at all (piece 9).

Filed as TODO 31 with a ready-made test case: the baseline currently holds the banded shading and
the working capture holds the smooth one.

## Frames to eyeball

Highest value first. **The first one is the judge-required call.**

1. `gauntlet/capture/12_seal_midpeel.png` vs `gauntlet/capture/baseline/12_seal_midpeel.png` —
   **crop the caravan's front-top rounded corner** (around x 175–325, y 60–170). Blocky polygonal
   facet bands become a continuous curve. This is piece 9 and it is your call: genuinely smooth, but
   softer in character than the faceted toon look. **Nothing is re-pinned**, so the tripwire still
   holds the banded version — the ~0.986–0.99 on caravan and vehicle vantages is this piece awaiting
   you, *not* drift. Also `18_rear_close.png` and `01`/`09` for the ute bonnet.
2. `gauntlet/capture/25_preen_follow.png` — **new vantage.** Magnify it; the bird is ~70 px. The
   head lobe, pale cere and dark beak sit clear of the body mass at the *worst* frame of the preen
   cycle. Piece 6's fix holds at the camera your original complaint actually named.
3. `gauntlet/capture/22_torch_beam.png` — the beam now lands squarely on the bird, with rex's alert
   mark up. Two stray humans that used to loiter on the hut deck are gone.
4. `gauntlet/capture/19_roof_follow.png` — Dave no longer stands in the corner, and the camera is
   the true follow geometry rather than wherever the lerp stopped.
5. `gauntlet/capture/05_tussock_ground.png`, `14_player_view.png`, `03_kea_plate.png` — the new
   grass tint. Same three source colours and the same split, only the sequence differs.
6. `gauntlet/capture/07_jam.png` — the queue is deliberately blue again; see below.

## Two calls you may want to overrule

**Piece 8 keeps the white object.** It is one of the 26 carpark grit pebbles (line 937), on the
carpark slab, intentional and commented — not seal debris, not an egg, not an orphan. So the brief's
"keep" fork applied, and I did the *name it and texture it* the brief asked for: `G.gravel` in the
house style, and `_mk(0x9AA0A6,'speckle')`, because **half the scatter was unregistered in MAPKIND
and rendered as flat untextured putty** while its siblings rendered as stone. If you want it gone
from that spot, the knob is the scatter count or an exclusion around the caravan door — a taste call
I did not make.

**Piece 27 forced a decision about 07_jam.** Removing ~94 k `Math.random` draws turned the traffic
queue from blue to **white**, because `spawnTraffic` picks body colour with `pick()`. The frame was
a perfectly good jam; its *subject had changed identity*, and `subjects.mjs` went red — which I did
not know a presence tripwire could catch. I did **not** re-fit the classifier, and measured before
deciding not to: against a purpose-shot **carless** reference, `carblue` separated only ×7.5 on the
new build, and every colour-agnostic candidate was worse (×2.1, ×1.5, ×0.8). A body colour drawn
from `Math.random` cannot be pinned by any hue window. So `capture.mjs` now **stages** the colour —
fresh material per car, applied only to meshes sharing that car's body material inside its own
`bodyG`, so bumpers, glass and lamps are untouched. `carblue` is 17 649 against the **original**
floor of 3000. Piece 4's calibration is untouched and nothing was refitted.

## New instrument

`gauntlet/verify/stability.mjs` — reshoots a vantage N times and compares the takes **against each
other**, baseline out of the picture. `diff.mjs` structurally cannot ask "is this frame
reproducible at all", which is exactly how `22_torch_beam` sat in `BASELINE.md` as "known-noisy"
across four builds with no cause ever found. Threshold 0.995 is calibrated, not invented: a
properly locked vantage (03) reshoots at 0.9976 while all the suspects sat at 0.985.

Run it beside `diff.mjs` and `subjects.mjs`. **All 25 vantages are now measured and all 25 pass.**
The set was 6-for-25 unreproducible and is now 25-for-25:

- clean as found — 01, 03–15, 17, 18, 20, 23, 24 (0.997–1.000)
- **fixed this session** — 02 `0.9899→0.9988`, 16 `0.9911→0.9983`, 19 `0.9850→0.9988`,
  21 `0.9860→0.9986`, 22 `0.9852→0.9970`, 25 `0.9949→0.9998`

The remaining floor is ~0.997 on grass-heavy frames — that is the `uTime` sway residual TODO 30
removes.

## Suggested next three picks

1. **TODO 30 `pin-G-time-set-wide`** — one line in QUIET, and it takes the *whole* set to ~0.999
   take-to-take. Every judgement after it gets quieter, which is the same argument that made 27
   worth doing early. Its 25-frame re-pin is the only cost, and you will be re-pinning for piece 9
   anyway — do them in one sweep.
2. **TODO 31 `a-tripwire-that-can-see-shading`** — because right now a global re-shade is invisible
   to the gate, and piece 9 is sitting in exactly that gap. A warn-band at ~0.995 is probably the
   cheap 80%.
3. **TODO 10 `caravan-door-orientation`** (judge-required) — the next unshipped item in your own run
   order, and the last of the pre-mode pieces. Then the mode pieces 11–25.

**28 is deliberately not in that list** — it needs your eye on where a snow patch should go, and 27
is now done, which relaxes its stream-neutrality constraint (mesh count no longer tints the field,
so a plain exclusion `continue` is legal).

## Housekeeping

- **New laws:** FLAKES **11** (the mission-matrix intermittent) and **12** (a photograph is a
  staging contract; drift against the baseline is not the same question as variance against
  yourself).
- **Exports added:** `MAPKIND`, `grassTint`, `grassTintReset`, `smoothFacetNormals`, `SMOOTHSTAT`,
  `SMOOTH_DEG`, `roundedBoxGeo` — each because it was the only way to make a browser-only contract
  hermetic (the piece-5 precedent).
- **TODO.md is 27 → 31 items.** Your `cat >>` appends reached the file this time; I checked.
- Two pieces changed **no game code at all** (7, 26) and one changed only the harness (29). Game md5
  moved `347b4b93` → `01675b29` → `1667e397` → `d5c59486`.
