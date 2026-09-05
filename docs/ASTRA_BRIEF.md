# ASTRA HANDOFF — make this cockatoo into a kea

You are being handed a 3D bird model and asked to turn it into a kea
(Nestor notabilis, the New Zealand alpine parrot) for a browser game.
Work in Blender. Read this whole file before touching the model.

---

## THE PROJECT, IN ONE PARAGRAPH

A photoreal browser game (three.js, Vite build) about a kea causing chaos in
a New Zealand alpine carpark. The environment already renders with scanned
PBR materials, HDRI lighting, soft shadows and a real instanced grass field.
The bird is the last major asset still wrong: it was a procedural pile of
primitives, and is being replaced with a rigged model adapted from a palm
cockatoo, because no kea model exists anywhere online. The visual target for
the whole game is the trailer for HexNest Games' *Birds of War* — see the
`ref_bow_*.jpg` frames for the quality bar (that game's magpie is exactly the
fidelity we want for the kea).

## THE FILES YOU HAVE

- `rockatoo.glb` — the ORIGINAL palm cockatoo, untouched. CC-BY, author
  Macauley.B ("Rockatoo character", Sketchfab). 16,989 tris, 161 bones,
  1 animation clip, PBR material (baseColor + normal).
- `kea_base.glb` — our current derivative: the 60-joint crest removed
  (7,121 vertices deleted, crown intact), 4,927 tris. THIS is the file to
  edit unless you have a reason to start from the original.
- `renders/` — how it currently looks in-game (P5d2: settled, olive, folded).
  Eric's reaction: "kind of terrifying." Your job is to fix why.
- `plates/kea_*.jpg` — real kea reference photos. The truth. Judge every
  change against these, not against memory of what a parrot looks like.
- `P5E.md` — the detailed defect list, in priority order, with what each fix
  is and how we will measure it. Follow it.
- `LICENCES.md` excerpt — the attribution rows, so your changes get recorded.

## HARD CONSTRAINTS — breaking any of these makes the output unusable

1. **PRESERVE THE ARMATURE EXACTLY.** Every bone name and the hierarchy must
   be unchanged. Our animation system binds to these names. Key bones:
   `_rootJoint → Ilium → Scapula → Neck → Head`, `UpperMandible`,
   `LowerMandible`, `Humerus_r/l → Ulna_r/l → Metacarpus_r/l`,
   `Femur → Tibia → Tarsus → Leg` (both sides), toes `FingerBF/BB/SB/SF`,
   `Tail → TailEnd → TailEnd_LongFeather ×30`. The `FeatherHead_*` crest
   bones were removed in kea_base.glb and must NOT come back.
   Gotcha: the left leg bones are numbered `_092/_00` where the right is
   `_076/_077` — creation order, not symmetry. Do not "fix" that.
2. **Do not rescale or re-origin.** Posed height is ~96.5 model units; the
   game scales it. Change the mesh, not the transform.
3. **Do not re-rig, do not change the feet.** The feet are already correct —
   grey, scaly, zygodactyl (two toes forward, two back). Leave them.
4. **Keep the UV layout** if you are only painting textures. If you change
   geometry (the bill, the tail), re-UV only the parts you changed.
5. **Bind pose is wings-spread and the whole model is yawed ~45°** in bind
   space. Do not "correct" the yaw — our binding code compensates for it.
6. **Export GLB**, embedded textures, same node structure. Name it
   `kea_astra.glb`.
7. **CC-BY derivative:** write a `CHANGES.md` listing every change you made
   (geometry, texture, materials), so the attribution row can name them.

## THE WORK — six fixes, priority order (full detail in P5E.md)

1. **The bill.** Currently short, blunt and heavy — the cockatoo's. A kea's
   upper mandible is LONG, SLENDER and smoothly curved, tapering to a fine
   point, projecting well past the face — like curved scissors. Lengthen
   along the culmen, reduce base depth, taper the tip, keep the curve
   continuous. Keep both mandible bones weighted so the jaw still opens.
   Measure against `kea_head_01.jpg` and `kea_head_02.jpg`.
2. **The eye-ring.** Paint a bright orange-gold ring around the dark eye
   (sample the colour from a tight box on the ring in `kea_head_01.jpg`). This
   single feature is most of the kea's expression.
3. **Value and colour.** The bird is far too dark. Real kea photograph pale
   olive-brown in daylight: tan/buff chest lighter than the back, greenish
   mantle, EMERALD-GREEN coverts on the folded upperwing (currently absent).
   Sample regions from `kea_posture_01.jpg` and `kea_underwing_01.jpg`.
4. **The tail.** Renders as bare quills with no vane. Restore/rebuild the
   vanes on the `TailEnd_LongFeather` chains — short, closed, green-and-black
   barred at rest.
5. **The underwing.** Wing open: a BROAD scarlet-orange sheet across the
   whole inner wing with black-and-yellow barring on the flight feathers
   (`kea_underwing_01.jpg`). Wing folded: NO red visible at all.
6. **The cere.** Pale grey-tan naked skin at the bill base with a visible
   nostril, warm ochre wash on the cheek below the eye.

**Bonus, if you can paint textures:** the scalloping. Every kea body feather
is dark-rimmed, producing a scaled pattern across chest and back
(`kea_posture_01.jpg`). The cockatoo albedo has none. A painted albedo with
scalloping would be the single biggest step toward the photo — we could not
do this in our pipeline.

## DELIVERABLES

- `kea_astra.glb` — the edited model, armature intact.
- `CHANGES.md` — what you changed, for attribution.
- Four renders: head close-up, full-body side (posture), folded wing from
  behind, wings open showing the underwing — matching the reference angles.
- Optional: the `.blend` file.

## WHAT HAPPENS TO YOUR OUTPUT

It is dropped into the game repo as `assets/models/kea_astra.glb`. An
automated gate hashes it, verifies every bone name matches, runs the game's
missions headless against it (the door-seal mission must complete 12/12),
and renders it from the same four angles. Eric compares it side by side
with another attempt at the same brief and picks. If the armature changed,
the gate rejects it — hence constraint 1.
