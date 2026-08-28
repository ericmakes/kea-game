# DIRECTION — "ARTHUR'S PASS, 8AM"

One phrase: **hard morning light on gold tussock country, and a real kea in it.**

The three truths every frame answers to:
1. **The country** — Lindis-gold Chionochloa flats, greywacke/schist grey, extensive scree,
   dark beech skirts at the slope feet, hard white snow, deep clear zenith blue hazing to the
   horizon. If the flats read lawn-green, it is not New Zealand and the frame fails.
2. **The bird** — deep dusky olive, EVERY feather edged black (scallops readable at gameplay
   distance), lighter olive crown, long slate hooked bill, scarlet-orange underwing flash in
   flight, blue-green sheen on primary tops, grey legs. If it reads as a green pigeon, fail.
3. **The comedy camera** — Squirrel-with-a-Gun energy: low, close, world looming; humans
   pratfall flat and get up; hats are trophies. Slapstick, never harm.

Readability law (score cap): at the 320px couch exhibit, a stranger must instantly find the
kea, tell P1 from P2, and read the interaction prompt. Beauty never buys ambiguity.

References push the game FORWARD, not "more like itself": photo_* = real NZ + kea macros
(how light behaves on tussock/greywacke/plumage); style_* = aspirational frames.
In-container substitutes live in NOTES.md (searched references, summarized).

4. **STUDIO FINISH** — no naked primitives. A mountain is a ridgeline, not a cone; a beech
   is a canopy, not a sphere; a grass blade tapers. Silhouettes are sculpted, shading has
   depth (AO in the folds, detail in the ground), and nothing reads as programmer art at
   a glance. Blocky is an auto-fail tell now.


## THE BIRD, FROM THE CAMERA THAT MATTERS (2026-08-27, ref: live kea photos)
The follow camera (behind, above) is the judging view — vantage 14_player_view is money shot #1.
From there a real kea is: a smooth olive dome in FINE dark-olive feather-edging (dense thin crescents,
never bold hooks); long folded wings whose DARK tips CROSS over the tail; a broad dark band at the
tail tip; head and grey hooked bill carried forward of the body line, visible even from behind.
Big bold scallops read as watermelon/leopard at gameplay distance — texture cells stay small.
Sign text lives on a dedicated front plate (rbox UVs slice canvas textures — never texture text onto rbox).


## CREATURE BODIES ARE LOFTS (2026-08-27 night, research-backed)
The single-file pattern for 3D creatures is parametric BufferGeometry — never sphere-piles,
never imported models. Bodies are LOFTED: cross-section rings along a spine (loft() builder),
one continuous hull per animating segment, generous overlap at joints so pivots survive.
Wing law: blades are AUTHORED in their rest pose (lying back along the flank); the WRIST owns
the flight swing (rotation.y ~1.32 rad as the fan opens). Fold poses must never fight blade
authoring — if a fold needs three rotations to look closed, the authoring is wrong.
Loft UVs wrap integer counts (seam-free); scallop tiling 5 around x 7 along.
The collider inverse-transform convention (Three Y-rot): local_x = dx*cos(ry) - dz*sin(ry);
local_z = dx*sin(ry) + dz*cos(ry). The 08-27 skew bug came from flipped sense — and the
harness co-signed it by asserting with the same mirrored math. Assertions must derive from
engine convention, not from the patch under test.

Loft law addendum (same night): lofts are wound OUTWARD and BOTH ENDS ARE CAPPED — an open ring
at a joint reads as a hollow bird from the follow camera. Creature materials ship DoubleSide as
armor: winding slips must cost lighting subtlety, never solidity.


## THE ART BAR (2026-08-28, named by Eric)
Visual style target: SQUIRREL WITH A GUN (visuals ONLY — zero guns, zero gore in mechanics),
blended with UNTITLED GOOSE GAME and A SHORT HIKE. The judging question for every frame is now:
would this pass in those games''' screenshot feeds? Small-critter vs oversized world, soft
grounded lighting, chunky readable props, warm saturated palette, intentional set-dressing mess.
Reference images approved by Eric live in this pack; judge side-by-side, never from memory.


## APPROVED REFERENCE BOARD (2026-08-28, Eric: "all of these are great")
Judge every item against its reference, side-by-side, never memory:
1. SWAG (store.steampowered.com/app/2067050) — scale grammar: tiny critter, oversized readable props, soft grounded light
2. UGG (store.steampowered.com/app/837470, goose.game) — flat confident colour, zero noise, silhouettes carry everything
3. A Short Hike (store.steampowered.com/app/1055540) — warm palette, chunky terrain, flight-feel target
4. Kea (wikipedia/Kea) — olive scallops, grey hooked culmen, orange ONLY in flight
5. Hut (lonelyplanet best-backcountry-huts-new-zealand) — corrugated iron, one bold colour, water tank, long-drop out back
6. Tussock (nzgeo.com/stories/fields-of-gold) — tawny gold, clumped, wind-combed, never lawn
7. Southern Alps (wikipedia) — grey-blue rock under snow, never white cones
8. Sheep (wikipedia/Romney_sheep) — woolly loaf silhouette
9. Trampers (wikipedia/Tramping_in_New_Zealand) — beanies, shorts-over-longs, big packs
10. DOC ute (wikipedia/Toyota_Hilux) — flat-deck tray, mud, aerial
11. Campervan (wikipedia/Campervan) — white loaf, coloured waistline stripe
12. Rope tow (craigieburn.co.nz/play) — nutcracker tows, ticket shack with fireplace
13. Chilly bin (wikipedia/Cooler) — two-tone box, white lid
14. Pie (wikipedia/Meat_pie) — flat-top Kiwi bakery unit
15. DOC signage/campsites (doc.govt.nz) — yellow-on-green fingerboards, chunky timber tables
16. Cones, 90s cars, bin, pegs, keys, radio, passport, boots, nest — inherit 1-3; approved from gauntlet strips


## THE WING-FOLD LAW (2026-08-28, ornithology-sourced)
Real fold = Z: humerus rotates in against the body, elbow flexes forearm parallel to torso,
wrist folds the hand+primaries BACKWARD to lock along the flank; remiges slide over each
other like a closing hand fan. The visible folded wing is a LAYERED SHIELD: scapulars over
coverts (primary coverts fully hidden), thin secondary edge, stacked primary TIPS projecting
toward/over the tail. THE RUMP SITS UNDER THE FOLDED WINGS on a perched bird; flanks are
BELOW the wing. A folded wing that hangs beside an exposed back reads as a hinge — the tell.
Model law: fold = shield plates lapping the back + tight primary packet to the tail;
flight = shield stows, wrist swings the fan out. No joint may read at the shoulder.
(Sources: bird-topography guides; wing-fold mechanics refs — see chat 2026-08-28.)


## ONE-BIRD LAW (2026-08-28, Eric: "not several shapes glued together")
The bird is ONE creature in every state and every frame between states.
- The flight wing and folded wing are THE SAME RIG: an arm surface rooted at the shoulder,
  secondaries on its trailing edge, primary fan at its wrist. States differ by ROTATION and
  fan-open only. Nothing may appear, vanish, or scale to fake a pose.
- Every part enters another part inside an overlap: tail roots emerge from covert wedges,
  legs from thigh tufts, neck from the body opening. No plate-on-surface edges.
- Scapulars are BODY feathers fixed over the shoulder, hiding the pivot in all states.
- The judging instrument for "one bird" is the TAKEOFF/LANDING motion strip: if any frame
  of the transition shows a part swapping rather than moving, the rig fails.


## REFERENCE 17: DUMPSTER GANG (2026-08-28, from Eric video — co-op raccoon mayhem, coming soon)
What it does that we should steal, translated to NZ kea:
- NIGHT AS DRAMA: warm window/lamp glow vs cool moonlight; torch CONES as threat + spotlight.
- THE SEEKER: a relentless pursuer hunting with a flashlight — beam-caught escalates the chase.
- BEHIND BARS: caught = caged (pet carrier on the ute); in 2P your mate pecks the latch to free you.
- LOOT PINATAS: bins ERUPT junk physically when cracked, never politely spawn.
- CELEBRATION JUICE: gold sparkle bursts on milestones.
- Customization lives in wearables (hats) — lean in, never a shop.
Rank: bin burst + sparkle juice = built same-day; Night Shift + torch seeker + caged = the Night wave, on Eric go.
