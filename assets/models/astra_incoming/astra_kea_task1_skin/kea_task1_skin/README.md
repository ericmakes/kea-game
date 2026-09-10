# Kea — Task 1 skin

## Files

| File | Purpose |
|---|---|
| `kea_albedo_4096.png` | 4096 × 4096 RGBA base colour; sRGB. Original opacity mask retained by resampling. |
| `kea_normal_4096.png` | 4096 × 4096 RGB tangent-space normal; linear/non-colour. |
| `kea_bill_skin.glb` | `kea_bill.glb` with the two embedded PNG image views swapped. |
| `renders/01_head_closeup.png` | Actual model: head and facial details. |
| `renders/02_full_body_side.png` | Actual model: folded-wing side/posture. |
| `renders/03_folded_wing_rear.png` | Actual model: folded-wing rear view. |
| `renders/04_wings_open_underwing.png` | Actual model: underwing colour and barring. |
| `VALIDATION.json` | Container/model byte-preservation checks and hashes. |
| `TEXTURE_VALIDATION.json` | Texture format, opacity, tangent-normal and UV-region checks. |
| `CHANGES.md` | Changes and original model attribution. |
| `PAINT_PROVENANCE.md` | Paint source method and generation prompt. |

The GLB is binary glTF 2.0 with embedded PNG textures and uncompressed geometry. It uses the original material, original metallic-roughness map, original UVs and original samplers. No game shader or material setting is changed.

## UV and texture limitations

| Area | Constraint and treatment |
|---|---|
| Eye-ring | Both sides share UV pixels. At 4096, the ring has about 43 × 48 pixels outer size and the dark centre about 29 pixels. The feature is registered to the existing eye rather than enlarged beyond its anatomy. |
| Cere and nostril | The cere straddles the bill/head UV boundary. The nostril is painted detail; there is no new nostril opening in the mesh. |
| Upper and lower wings | Separate UV islands allow independent green upper surfaces and scarlet underside surfaces. Bilateral wings mirror the same island pixels, so asymmetric left/right detail is not possible. |
| Folded wing edges | The supplied animation exposes narrow areas of underside. Those visible underside margins are painted green; the concealed inner region retains scarlet-orange. Visibility checks use the supplied animation and review cameras. |
| Feather edges | Original cut-out feather edges come from a 512² opacity map. Resampling to 4096 preserves their silhouette but cannot create new geometric feather separation or recover lost edge detail. |
| Small detached scraps | Several tiny UV scraps overlap unrelated anatomy. They use subdued neutral colours instead of intricate details that would bleed into another part. |
| Tail endcaps | Eighteen existing endcap triangles collapse to UV(0,0), so they cannot receive distinct painted detail without changing UVs. They retain a neutral colour. |
| Tail | The thin tail quills/rods are existing geometry. They remain present, with their original alpha silhouette. A skin-only pass cannot turn them into broad feather vanes. |

## Renders and scope of verification

The four PNGs are renders of the actual supplied mesh, skin and UVs, sampling the delivered maps. They use neutral daylight review lighting and the original embedded `Animation_01`: folded views at 3.5 seconds, open-wing view at 0.2 seconds. Render-only camera/orientation adjustments are recorded in `renders/render_metadata.json` and are never written to the GLB.

The handoff does not include the game renderer, procedural posing code or pinned camera settings. The images therefore match the requested types of viewing angle, not the original gameplay scenes pixel-for-pixel. In-game shader tints, exact game poses and mission gates have not been run. The original unusual bill tip, small mouth gap and tail rods are shown rather than hidden by mesh or opacity edits.

Reference photographs guided the surface appearance; their lighting is not a calibrated albedo measurement. The chest is deliberately pale and warm relative to the green mantle, with dark rims retaining feather definition.
