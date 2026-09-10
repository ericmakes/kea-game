# Task 1b paint provenance

The supplied kea plates were viewed directly beside the Task 1 and revised renders. `kea_head_01.jpg` and `kea_head_02.jpg` govern the face and fine head feathering; `kea_posture_01.jpg` governs the bronze body, green dorsal wing and tail; `kea_underwing_01.jpg` governs body scalloping, scarlet coverts and fine flight-feather barring.

Two new reference-guided image-generation swatches supply irregular body contour feathers and fine streaky head plumage. These are material artwork sources, not generated bird renders. Their detail is sampled through the original UV-to-anatomy correspondence, graded into the plate-guided palette and combined with registered facial, wing and tail paint. Feather scale uses separate fixed-frequency fields blended by anatomical masks. The original UV accessor is never changed.

Normal relief is derived from feather detail before pigment-only grading. Underwing bars and changes of feather hue therefore do not emboss as ridges. The old foot and shin pixels in both maps, and all old albedo alpha, are copied exactly.

The delivery renders sample the actual model and embedded textures. No generated whole-bird image is used as a render.

## Body source

Source PNG SHA-256: `0c5c18197710976c85e14a447e9665607e943fbd4515e3b888f7233e6a15f5bf`.

Reference files: `kea_posture_01.jpg`, `kea_underwing_01.jpg`.

Generation prompt:

Create a photoreal production albedo material swatch of real kea BODY CONTOUR FEATHERS, matching these exact kea reference plates. This is a texture for Nestor notabilis, not a drawing of a bird. Square seamless flat front-on swatch, filled edge to edge with naturally overlapping feathers. Warm BROWN-OLIVE / BRONZE / KHAKI-BROWN, distinctly brown rather than green, with warm tan feather centers and fine dark brown rims. IMPORTANT morphology: organic irregular feather shapes, varying width and length by 30–50%, imperfect staggered groups, natural changes in direction and overlap, varying rim darkness and thickness, feather tips softly feathered with visible fine fibrous barbs. About 8–12 feathers across, 10–14 rows, BUT DO NOT make a uniform geometric grid or identical repeated scales. No chainmail, no reptile or fish scales, no identical U-shapes, no stylised cartoon outlines. Some feathers longer and tapered, some wider rounded, some partly concealed by neighbours, every visible contour feather still has a dark edge as in the kea breast/back plates. Rich realistic subtle rachis and fine angled barbs. Medium bronze/khaki-brown value with charcoal-brown rims, not pale sage and not saturated green. Flat diffuse albedo only: even illumination with minimal baked shadow, no directional highlight, vignette, perspective, bird silhouette, background, text or labels. 2048x2048 source texture, detail throughout, no large empty regions.

## Head source

Source PNG SHA-256: `8ee97a0098bb4815204403f7a056c396e37b084d5b0fdf51c6e210608d25e39a`.

Reference files: `kea_head_01.jpg`, `kea_head_02.jpg`.

Generation prompt:

Create a photoreal seamless square albedo material swatch of the fine HEAD FEATHERING of a real kea (Nestor notabilis), taken specifically from the crown and cheek feather morphology in the two supplied photographs. This is a close-range production texture, NOT a whole bird or head illustration. Fill the entire image edge-to-edge with dense, fine, long, narrow, streaky feather filaments and tapered overlapping lance-shaped little feathers, all generally flowing downwards with a gently irregular natural flow. Crucial: HEAD FEATHERS ARE NOT SCALLOPED. NO round scales, chainmail, regular fishscale pattern, rows of U shapes, chunky leaf outlines, or body feather shapes. The head looks soft and finely streaked, like the photographs: slender dark brown feather separations around fine warm khaki/taupe bronze streaks, subtle buff central shafts, individual hairlike angled barbs. Many fine narrow strands, roughly 35–50 little pointed feathers across, numerous lengths varying organically, soft irregular overlaps; no uniform grid. Warm khaki-brown / brown-olive / bronze, moderately dark, NOT green or pale sage. No eyes, beak, cere, nostril, skin, background, silhouettes or text: only the plumage material. Flat evenly lit diffuse albedo, no highlights, dramatic shadows or ambient occlusion, no depth of field. 2048x2048, seamless square swatch.
