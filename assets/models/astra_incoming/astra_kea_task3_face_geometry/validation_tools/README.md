# Task 3 validation

`INDEPENDENT_GEOMETRY_AUDIT.json` and `ACCESSOR_AUDIT.csv` compare the stated baseline GLB with the delivered GLB independently of the sculpting and packing code. They identify every accessor whose payload changed and record a SHA-256 digest for each source/result payload.

The byte gate permits only the individual payload bytes of accessor **0 / POSITION** and accessor **1 / NORMAL**. It compares the complete remaining file byte for byte, including the JSON chunk, GLB/chunk headers, all embedded images, every other accessor, and padding. The two hashes of that unchanged complement must match.

The geometry gate verifies finite positions and unit normals, exact original global bounds and accessor min/max, fixed counts of **101 joints / 3,013 vertices / 4,927 triangles**, unchanged data outside an independently defined source head region, and no newly collapsed triangles. `CHANGED_VERTICES.csv` lists the changed vertex rows, their coordinates, displacement and normal rotation.

The byte/head contract result is separate from internal mouth diagnostics. `PASS_WITH_INTERNAL_MOUTH_ADVISORIES` means those hard gates pass, with explicitly listed internal shading or lining changes. Original duplicate vertices on the main exterior head surface must remain coincident; originally coincident internal mouth components can separate during the lining tuck and are recorded individually.

Absolute degeneracy and small relative area are reported separately. The final hidden lining shrink leaves three triangles below 0.01% of their source area; their measured areas remain positive and are listed in the report. This advisory is not suppressed, and the audit does not claim robust manifold geometry.

`HEAD_INTERSECTIONS.json` is a separate diagnostic. It compares strict non-coplanar triangle crossings against those already in the baseline. It separates the main exterior UV surface from detached mouth components. It does not certify the absence of every kind of collision, and a hidden upper/lower lip contact used to close the gape is distinct from a visible cheek or cere fold. Any final contact review must identify its exact face pairs and reason rather than suppressing them.

If supplied, `HEAD_EDIT_SCOPE.png` plots accessor data directly: the changed vertices on the original whole model, and the source/revised head projected into the original model's XY plane. It is an edit-scope diagram, not a material render.

To reproduce with Python and NumPy:

```sh
python validate_head.py BASELINE.glb RESULT.glb validation
python head_intersections.py BASELINE.glb RESULT.glb validation/HEAD_INTERSECTIONS.json
```

For the documented closed-gape underlap, supply its exact reviewed face sets. The diagnostic checks those faces against source jaw influences and lip anchors; it retains all crossing pairs:

```sh
python head_intersections.py BASELINE.glb RESULT.glb validation/HEAD_INTERSECTIONS.json --contact-review CLOSURE_REPORT.json
```

The optional scope plot additionally requires Matplotlib:

```sh
python plot_edit_scope.py BASELINE.glb RESULT.glb validation/HEAD_EDIT_SCOPE.png
```

The source and result SHA-256 values in each report identify the exact files inspected. A later change requires a new report.
