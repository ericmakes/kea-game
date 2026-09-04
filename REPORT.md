# REPORT — P5a: the first CC-BY asset, and the obligation it brought (session 24, 2026-09-04)

Branch `replat-b`. **CERTIFIED-SHIP** at specimen `1d175922c03eb13d6e30788e34795bac`.
Twelve sabotages, all twelve red. **Nothing in `assets/models` yet — that part is yours.**

## THE THING I DID NOT EXPECT TO FIND

You picked F, the palm cockatoo. It is **the project's first CC-BY asset**, and that turned out to
change an obligation nobody had booked. Sketchfab's licence field for it reads:

> **"Author must be credited. Commercial use is allowed."**

Everything before it was CC0 from Poly Haven, where `LICENCES.md` credits authors because they did
the work and *nothing demands it*. This one demands it — and **the game had no credits surface at
all.** A credit that lives only in a markdown file in the repo is not a credit to a player who has
the game and not the repo. So the ledger line you asked for was necessary and not sufficient.

## WHAT SHIPPED

- **`CREDITS` in `src/game.mjs`** — one source of truth. Lists the CC-BY cockatoo **and** the CC0
  Poly Haven authors, who are in there precisely because nothing compels it and they would be the
  first line dropped in a hurry. A battery keeps them.
- **Rendered on the title screen at boot**, before anything is played — not behind a menu a player
  may never open. Built from text nodes, **never `innerHTML`** (asserted: they are constants today,
  and the day one is fetched an innerHTML credits line is an injection point). Shot:
  `gauntlet/capture/P5_credits_title.png`.
- **The ledger and the game cross-check, both directions.** `assets/LICENCES.md` now carries a
  machine-readable `<!-- ASSET ... -->` marker per asset from P5 on — invisible in rendered
  markdown, load-bearing for the gate. Add an asset and forget the credit: **red**. Delete a credit
  while the ledger still lists the asset: **red**. Neither is catchable by reading.
- **A landed file cannot sit on a `PENDING` md5.** Either the file exists and its md5 matches, or it
  does not exist and the md5 says PENDING. Sabotaged both ways.
- **Blender 5.2.1 LTS installed** and verified headless with glTF import. The first attempt died on
  `No space left on device`; after you cleared space it went through clean.

## YOUR MOVE — the drop

1. Download **Rockatoo character** from
   [sketchfab.com/3d-models/rockatoo-character-1595e8668689427f87cffb2b0daf99e5](https://sketchfab.com/3d-models/rockatoo-character-1595e8668689427f87cffb2b0daf99e5)
   — GLB if offered; FBX or `.blend` is fine, Blender is in now and can convert.
2. Put it at **`assets/models/rockatoo.glb`** — that exact path. The ledger marker names it and the
   battery checks it.
3. Tell me. **The gate will be RED the moment it lands, by design** — the marker says `PENDING` and
   a file on a PENDING md5 is exactly what the battery refuses. My first act is to hash it, write
   the md5 in, and record the real geometry and the bone names.

## WHAT I STILL CANNOT KNOW

**Whether its bones are named.** Sketchfab's API does not expose a skeleton, and both candidates I
could actually download had armatures of `Bone.001 … Bone.0NN`. One animation clip proves the
cockatoo is *rigged*; it does not prove the rig is *legible*. If it is anonymous, P5b's joint map
becomes a hand-built index table — and I will say so rather than quietly hard-code it.

## ONE MISTAKE, CAUGHT

Undoing a sabotage with `git checkout -- assets/LICENCES.md` **wiped the uncommitted ledger
section** — the P5 entry had not been committed, so restoring "the file" restored the version
without it, and the batteries went red for a reason unrelated to the sabotage. Recovered from the
sabotage script's own backup. The rule I stepped outside of: while work is uncommitted, restore from
the harness's backup, never from git.

## PROOF

Nine batteries ALL PASS · gate CERTIFIED-SHIP · twelve sabotages all red (credit deleted, credit
un-required, author misspelled, renderer not called, element removed from the page, `innerHTML`
substituted, marker deleted, `attrib=required` dropped, CC0 authors dropped, `md5` field dropped,
file landed on PENDING, md5 claimed for an absent file) · bundle builds · credits legible on the
title screen.
