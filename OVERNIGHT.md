# OVERNIGHT GAUNTLET — mission brief for Claude Code
You are running the kea game's overnight gauntlet, unattended. Work one piece
at a time. Certified work gets committed; anything red gets parked with notes.
Eric reads REPORT.md over coffee and eyeballs the frames. Do not wait for him.

## Scope
Pick pieces ONLY from gauntlet/OPPORTUNITIES.md (Tier 2, smallest first) or
TODO.md if Eric has added one. One piece = one commit. Never bundle.

## Per-piece protocol
1. Read gauntlet/verify/FLAKES.md BEFORE writing any test. It is law.
2. Plan the patch. Edits to untitled-kea-game.html are exact-string anchored
   (assert the anchor exists, replace, atomic single write).
3. After EVERY patch: `bash gauntlet/verify/fastgate.sh` (must PASS).
4. Mechanical behavior changes get a proof appended to
   audits/2026-08-28/harness-everything.js in its house style.
5. `bash gauntlet/verify/gate.sh` must print CERTIFIED-SHIP. Red = fix or park.
6. If puppeteer is installed: reshoot affected vantages
   (`SHOTS=<ids> node gauntlet/verify/capture.mjs`), run
   `node gauntlet/verify/diff.mjs`, and re-pin ONLY intentional changes
   (`cp gauntlet/capture/<v>.png gauntlet/capture/baseline/`).
7. Commit on branch `gauntlet`: `PIECE: <name> — certified <md5>`.
8. Append to gauntlet-log.md: piece, verdict, md5, what to eyeball, surprises.

## Hard laws (non-negotiable)
- NEVER commit a red gate. NEVER weaken, skip, or delete an assertion to pass.
- A test that resists 3 staging attempts is classified review-tier in the log
  and the piece is parked (FLAKES law 8). Move on.
- No apostrophes in gate/test prose. Anchor on ASCII strings only.
- The game stays ONE file. No new dependencies. HEADLESS guards on anything
  canvas/DOM so Tier A stays node-only.

## Stop conditions (checkpoint, write REPORT.md, end the run)
- 6 pieces certified, OR
- 2 consecutive pieces each failing 3 rounds, OR
- context or credit pressure.
State is resumable: next session starts by reading gauntlet-log.md.

## REPORT.md format
Shipped (name — md5 — one line), Parked (name — why), Frames to eyeball
(paths), Suggested next three picks.

## SHIFT DISCIPLINE (added 2026-09-01 after the idle stall)
- Never end your turn while unshipped pieces remain and no stop condition is
  met. If waiting on a background job, poll it yourself on a timer; there is
  no foreman to hand control to.
- The full stability sweep blocks game-file edits: run it LAST in a session,
  never mid-ration.
