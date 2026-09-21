# Approved kea and animation integration handoff — 21 September 2026

## Load these

- `kea_approved.glb`: standalone, exact locked approved shape. Play `approved_idle` at time 0 for the approved rest pose. Original bind/default pose is preserved, not rewritten.
- `kea_animated.glb`: existing delivered animation asset, unchanged bytes, same approved base plus wing-release morph and added clips. Choose named clips explicitly; do not auto-play the first legacy animation.
- `CHARACTER_HASHES.json`, `SHA256SUMS.txt`, `MD5SUMS.txt`: identities of both GLBs.
- `canonical_renders/`: head, side, folded rear and open-wing PNGs plus a contact sheet. See EXPORT_CHANGES.md for exact render-state provenance.
- `CLIP_MANIFEST.md`: all 11 embedded clips, durations, playback, root-motion policy, states and events.
- `EXPORT_CHANGES.md`: all export changes, morph scope and procedural animation integration contract.
- `VALIDATION_REPORT.md` and `HANDOFF_VALIDATION.json`: current baseline checks and their limits.

The approved shape is locked; this handoff packages it without further sculpting or painting. The rest-shape file was newly made standalone from exact approved arrays. The animated file is unchanged from the recovered motion pack. Neither is claimed byte-identical to historical Task 3.

## Earlier flagged items

| Item | Status in the approved character | Remaining work |
|---|---|---|
| Wing tuck at rest | Resolved for the approved static rest pose: folded wings are baked into the approved base. New rear/side renders show the tucked silhouette with no visible scarlet underwing sheet. | Procedural wing folding and transitions are not certified. Coordinate morph and skeleton and inspect intermediate poses in the game. |
| Tail vanes | Partially addressed by the retained earlier body/tail work, but NOT certified complete as the original Task 2 deliverable. Broad feather surfaces are visible from the rear. | Narrow tail slots remain; the side view still has thin pointed tips. Do not mark Task 2 fully resolved. Any further tail refinement is a new change to the approved geometry and should be reviewed explicitly. |

No previous task is silently re-opened and no tail or wing geometry was changed during packaging.

## Integration acceptance

1. Verify GLB hashes and select approved_idle: compare approved head tilt, side and rear silhouette.
2. Ensure the loader accepts plain GLB, embedded textures, skinning and standard POSITION/NORMAL morph targets. Keep existing asset scale; source transforms were preserved.
3. Establish one owner for each bone and for the morph weight. Do not apply the legacy shape adapter to the standalone exports.
4. Play each named clip and inspect the full wing range and blends, contacts, bill socket, culling and tail. In-place travel and target alignment are controller responsibilities.
5. Implement walk -> grip -> pull -> detach -> carry using the supplied events and attachment data; paper tearing is only a demo.
6. Run your game certification and couch playtest. This handoff makes no claim to have run them.

All existing preview MP4s are retained under previews/ plus motion_preview.mp4. tools/ includes the existing generation/render/validation code and the new package_handoff.py. The original README.md explains the animation pack. model/SOURCE_README.md is historical source provenance and retains attribution; its old adapter instructions apply only to the source route, not the new standalone files. Older reports describe their named stage, not an additional current certification. GROUND_REVISION_VALIDATION.json was retained from the preceding delivery; rerunning it requires that preceding animated GLB.

Attribution: modified Rockatoo character by Macauley.B, CC BY 4.0. Full source/creator links remain in model/SOURCE_README.md. No commercial reference mesh or texture atlas is included.
