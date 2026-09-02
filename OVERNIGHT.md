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
   (`SHOTS=<ids> node gauntlet/verify/capture.mjs`), then run ALL THREE
   instruments over the pass - they ask three different questions and the
   first two sessions to skip the latter two each missed something:
   - `node gauntlet/verify/diff.mjs`    frame SSIM. Owns the go/no-go.
   - `node gauntlet/verify/boxdiff.mjs` subject-box SSIM. A whole-frame SSIM
     is a landscape metric; the bird can be replaced outright inside it.
   - `node gauntlet/verify/pxdiff.mjs`  changed-pixel count. All the SSIM
     instruments are blind to a thin re-shade spread over a wide area.
     `PXCELLS=1` tells you where.
   Re-pin ONLY intentional changes
   (`cp gauntlet/capture/<v>.png gauntlet/capture/baseline/`), and a re-pin
   that moves a subject box or a pixel count on a vantage you were not
   aiming at is not a staging fix - park it.
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

## SESSION LOCK (added 2026-09-02 after the two-writer collision)
- At session start, before ANY write: if SESSION.lock exists at repo
  root, STOP and tell Eric which session holds it. Otherwise create
  SESSION.lock with your purpose and start time.
- Delete SESSION.lock as your final act. One writer owns the tree at a
  time - no exceptions, including waves and Eric's own paste blocks.
