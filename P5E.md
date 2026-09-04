# P5E.md — THE KEA PASS

Turning the de-crested cockatoo into a kea. Written 2026-09-05 after Eric
compared the P5d2 render against the reference plates side by side.

Governed by REPLAT.md and WAVES.md. Branch `replat-b`. Take SESSION.lock.
Standard laws — and note P5d2's own finding: **look fixes ship with
assertions in the same breath, or a sabotage comes back green.**

---

## 0. THE VERDICT THAT PRODUCED THIS BRIEF

The silhouette, stance, body mass and feet are RIGHT and must not be
disturbed. What is wrong is the FACE and the SURFACE. Eric's reaction to
P5d2 was "kind of terrifying" — the render reads as a dark, heavy-billed
crow rather than a kea. Six defects produce that read. They are listed in
priority order; the first two change the gut reaction most.

Reference plates, all in `gauntlet/reference/board/`:
`kea_head_01.jpg`, `kea_head_02.jpg` (face, bill, eye, cere),
`kea_posture_01.jpg` (silhouette, scalloping, upperwing green, tail),
`kea_underwing_01.jpg` (scarlet display, barring, body value),
`kea_feet_01.jpg` (already matched — do not touch the feet).

---

## 1. THE BILL — the single biggest defect  (Blender, geometry)

**Plate:** the upper mandible is LONG, SLENDER and smoothly curved — it
sweeps forward and down in one arc, tapers to a fine point, and projects
well past the face. In `kea_head_01` the exposed culmen is roughly as long
as the eye-to-bill-base distance, and the bill's depth at its base is a
small fraction of its length. It reads like curved scissors: a precision
tool.

**Render:** short, blunt, heavy — a thick stubby hook that barely clears
the face. This is the palm cockatoo's bill and it is the main reason the
bird reads as a weapon rather than a character.

**Work:** reshape the upper-mandible geometry in Blender — lengthen along
the culmen, reduce depth at the base, taper the tip finer, keep the hook's
curvature continuous with no kink. The lower mandible stays small and
tucked. `UpperMandible` and `LowerMandible` are named bones; keep both
weighted correctly so the jaw still opens and the P5d2 shut-rest holds.

**Measure it, do not eyeball it:** derive a culmen-length : head-depth
ratio from `kea_head_01` and `kea_head_02` by pixel measurement, and assert
the model's ratio lands within tolerance of the plates'. Assert the bill's
base depth : culmen length ratio too — that is what separates slender from
heavy.

---

## 2. THE EYE-RING — the cheapest transformation  (texture)

**Plate:** a bright ORANGE-GOLD ring encircles a dark eye, set against pale
grey facial feathering. This is the kea's signature feature and the whole
source of its inquisitive expression.

**Render:** a plain dark eye, no ring, sunk in dark brown.

**Work:** paint the ring into the albedo (or add a small ring geometry if
the texture route fights the UVs). Sample the ring colour from a TIGHT box
inside the iris ring in `kea_head_01` — do not trust any figure quoted in
chat; several of the values sampled during the discussion that produced
this brief caught feather instead of ring. Verify the sample: the ring is
high-saturation orange, hue roughly 35-45 degrees, clearly distinct from
every surrounding feather tone. Assert saturation and hue bounds so a
future palette sweep can't grey it out.

---

## 3. VALUE AND COLOUR — the bird is far too dark  (shading/palette)

**Plate:** the kea is LIGHT and WARM in daylight — an olive-brown body
that photographs pale, a tan/buff chest, a greenish mantle, and distinctly
EMERALD-GREEN coverts on the folded upperwing.

**Render:** near-uniform dark brown-black on head and chest, no green
anywhere on the upperwing. Dark reads as sinister; the real bird is soft.

**Work:** raise overall value and warm the hue. Introduce the regional
variation the plates show rather than one flat tint:
- crown/nape: mid grey-olive
- chest/breast: warmer tan-olive, LIGHTER than the back
- mantle/back: olive with a green cast
- folded upperwing coverts: emerald green — currently absent entirely
Sample each region from the plates with tight boxes and record the sampled
values in the brief's own log. Assert the rendered mantle-to-chest value
RATIO against the plate's, not absolute pixels, so exposure changes don't
break it. Assert green is present on the folded upperwing.

---

## 4. THE TAIL — currently bare quills  (geometry)

**Plate:** a short, neat, closed tail, green-and-black barred, held tidily.

**Render:** the tail renders as bare shafts with no vane — visible sticks
with nothing on them. This is a significant contributor to the horror read.

**Work:** the source has `Tail → TailEnd → TailEnd_LongFeather ×30`. Either
the vane geometry is missing, hidden, or was culled with the crest — find
out which before fixing; if the crest deletion took it, that is a bug in
P5d and should be reported as one. Restore or rebuild the vanes, keep the
tail short and closed at rest. Assert vane geometry exists and that the
tail's rendered silhouette area exceeds a floor (a bare-quill tail fails).

---

## 5. THE UNDERWING FLASH — TODO 83, already diagnosed  (shader/bake)

**Plate:** with the wing open, a BROAD brilliant scarlet-orange sheet across
the whole inner wing, with bold black-and-yellow barring on the flight
feathers below it.

**Render:** 124 scarlet pixels. The covert mask catches 106 of 3,009
vertices — a strip along the fold line only.

**Work:** as TODO 83 already states — define the coverts by POSITION IN THE
WING'S OWN FRAME (which does not move with the fold), not by surface
normal (which does). One bake loop; the gate and the attribute exist.
Assert scarlet pixel count above a floor with the wing OPEN and at zero
with it FOLDED — both directions, as P5d2 did.

---

## 6. THE CERE AND FACE  (texture, small)

**Plate:** a pale grey-tan naked cere at the bill base with a visible
nostril, and a warm ochre wash across the cheek below the eye.

**Render:** dark brown to the bill, no cere, no nostril.

**Work:** paint into the albedo alongside the eye-ring — same pass.

---

## 7. SCALLOPING — the texture that makes a kea a kea  (TODO 84, own piece)

**Plate:** EVERY body feather is dark-rimmed, producing a scaled/scalloped
pattern across chest, back and flanks. It is a large part of why the real
bird reads as beautiful rather than blank.

The cockatoo's albedo does not contain it and no tint synthesises it. This
is a painted-texture piece and is deliberately NOT in P5e's scope — Eric
was told as much when he approved this ordering. The existing battery
asserting no scallop term exists in the shader STAYS, so nobody fakes it
with noise. When P5e lands, TODO 84 becomes the next bird piece.

---

## ORDER OF WORK

1. Bill (Blender geometry) — biggest gut-reaction change, and it must
   happen before any face texture work so the UVs settle first.
2. Eye-ring + cere (texture) — cheapest transformation per unit effort.
3. Value/colour + upperwing green (shading).
4. Tail vanes (geometry, investigate cause first).
5. Underwing flash (TODO 83 bake).

Render the four judging angles after step 2 AND again at the end — Eric
should see the face change on its own before the rest lands on top of it.

## CONSTRAINTS

- Silhouette, stance, body mass and FEET must not regress. Assert them.
- Seal mission 12/12 headless; every mission anchor keeps working.
- CC-BY: any further derivative gets its own ledger row naming the change.
- The model stays off by default until Eric accepts the pass.
- Every look fix ships with its assertion in the same commit. P5d2 proved
  what happens otherwise: seven fixes, seven green sabotages.
- Do NOT attempt scalloping. Do NOT soften the bird toward "cute" — the
  target is an accurate kea; its charm comes from accuracy, not styling.
