# Kea — Task 3 face geometry

## Baseline

The user confirmed a **geometry-only delivery on Task 1b**, with the approved **Task 1c** images to be embedded in their pipeline. The input is `kea_bill_skin.glb`, SHA-256 `a119267fab2b64e691b0c11a3df14ad8f6767ad84cd028008da02e1a7820ecdc`.

The GLB retains the input's Task 1b images byte-for-byte. The included sparse patch can instead be applied directly to a compatible 1c GLB, preserving its images and all other unmodified bytes. It verifies the affected head's original POSITION/NORMAL values, UVs, skin weights and topology before applying.

## Strict change scope

Only the float32 vertex values in **POSITION accessor 0** and **NORMAL accessor 1** are patched. The GLB file size, container headers, entire JSON chunk, all other accessors and buffers, and all embedded image payloads remain byte-identical to the baseline. There is no re-export, re-unwrap, scale or origin operation.

The eye ring moves and enlarges with the eye's original UV-mapped surface. Its image pixels are retained to obey the restriction that only POSITION and NORMAL bytes may change. No image repaint is included. The same applies to the cere and bill textures.

## Face changes

The bill is shorter and continuously hooked, the lower mandible is a shallow tucked wedge, the forehead is rounded, and both eyes are larger and farther forward. `HEAD_CHANGES.md` and `HEAD_MEASUREMENTS.json` record the measured proportions and the remaining UV constraints. The rest and folded review poses show no exposed red mouth lining.

## Main files

| File | Purpose |
|---|---|
| `kea_bill_face_geometry.glb` | Geometry-only update, retaining the 1b embedded images. |
| `head_patch/head_patch.npz` | Sparse edited head POSITION and NORMAL rows with source-value guards. |
| `head_patch/apply_head_patch.py` | Applies the patch to a compatible GLB while preserving that input's images and all other bytes. |
| `kea_face_preview.png` | Five actual-model review views. |
| `kea_face_before_after.png` | Same-camera face comparison against 1b. |

To apply directly to an input carrying 1c images, run from `head_patch/` with Python 3 and numpy installed:

```bash
python apply_head_patch.py INPUT.glb head_patch.npz OUTPUT.glb
```

The script stops if the affected head values, UVs, indices or skin weights differ. It never rewrites input textures or metadata and leaves a validation JSON beside the output.

## Review images

The four existing review angles are accompanied by a three-quarter front head view. All images render the actual patched model with its embedded textures, original skin weights and original `Animation_01`. Camera adjustments exist only in the renderer and do not enter the GLB. The metadata records the exact source hash, cameras and animation times.

The head, cere, bill and posture are reviewed beside `kea_head_01.jpg`, `kea_head_02.jpg` and `kea_posture_01.jpg`. The reference photographs are not redistributed in this package.

## Review limits

The fixed UV allocation stretches the same eye texels over the enlarged eye, so it adds no paint resolution. The ring and cere follow their existing UVs without repainting.

The supplied wide-open jaw rotations produce an angular lower-wedge silhouette. `validation_renders/mouth_animation_check.png` shows the bind pose and selected original animation frames. The exposed lining strips found during development have been resolved. These sampled views are not an exhaustive review of every frame or future procedural pose.

Internal mouth surfaces are intentionally recessed and have separated spatial seams and small triangles; the independent audit lists these as advisories. All original triangles remain, and the strict byte/head change gate is separate from these internal geometry diagnostics.

## Validation files

- `POSITION_NORMAL_PATCH_VALIDATION.json`: source/output hashes, changed accessors and exact changed vertex IDs, byte gate and counts.
- `INDEPENDENT_GEOMETRY_AUDIT.json`: independent comparison of every other byte, all accessors, embedded images, rig, weights, topology, bounds and head-only scope.
- `HEAD_MEASUREMENTS.json`: final before/after bill, jaw, eye and crown measurements.
- `CLOSURE_REPORT.json` and `MOUTH_RECESS_REPORT.json`: intended lip contacts and internal lining adjustments.
- `head_patch/`: guarded sparse geometry patch for a compatible 1c input GLB.
- `renders/render_metadata.json`: five actual-model view specifications.
- `SHA256SUMS.txt`: checksums for the delivered files.

## Attribution

The supplied model derives from “Rockatoo character” by Macauley.B under the project's recorded CC BY 4.0 attribution. Retain the existing project author credit.

- Author: https://sketchfab.com/Macauley.B
- Original model: https://sketchfab.com/3d-models/rockatoo-character-1595e8668689427f87cffb2b0daf99e5
- Licence recorded in the supplied ledger: https://creativecommons.org/licenses/by/4.0/

This derivative changes only the head vertex positions and normals as documented. The delivered Task 1b paint remains unchanged; the approved Task 1c images were unavailable.
