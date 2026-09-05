# THE GAUNTLET — the system, and how we've used it

Written 2026-09-05 as a handoff explainer. This describes the process that has
governed the kea game's development. The ACTUAL files it describes
(harness code, gate.sh, the batteries, FLAKES.md, the audit skill) live in the
Mac bundle at ~/kea-gauntlet-portable and are pulled into this export by the
companion paste block — this document explains what they are and how they were
run, which the code alone doesn't tell you.

---

## 1. WHAT THE GAUNTLET IS

A test-and-certify machine wrapped around a single game. Its job is to let an
AI (Claude Code, running unattended overnight) change the game and PROVE each
change is correct before it ships — so the game never silently breaks, and so
work can proceed while the human sleeps. It is the reason this project moved as
fast as it did with one non-coder directing it.

Core principle: **the machine proves CORRECT; only the human judges GOOD.**
Everything a test can decide (does the mission still complete? did the port
move any geometry? is this frame reproducible?) the gauntlet checks
automatically. Everything that is taste (does the bird look like a kea? is the
grass the right colour?) is left for the human to judge from rendered frames.

## 2. THE PIECES OF IT

- **The game** — one file historically (untitled-kea-game.html), now a Vite
  project under re-platform (see THE_REPLATFORM section).
- **The nine batteries** — headless test suites run under bare Node. ~500
  assertions total covering missions, both game modes, the couch/2-player
  paths, adversarial cases, the colossal mode, and per-build audits. Run by
  `gauntlet/verify/gate.sh`, which must print **CERTIFIED-SHIP**. Red = fix or
  park; never ship red.
- **The capture rig** — `capture.mjs` shoots ~28 fixed camera "vantages" of
  the game via headless Chrome/puppeteer, producing PNGs.
- **The tripwires** — instruments that compare captures:
  - `diff.mjs` — SSIM against pinned baselines; detects a frame that CHANGED.
  - `pxdiff.mjs` — changed-pixel count; catches low-amplitude re-shades SSIM
    rounds away.
  - `boxdiff.mjs` — per-subject region check; catches a subject drifting
    inside an otherwise-stable frame.
  - `subjects.mjs` — presence detector; catches a showcase frame that shipped
    with its subject MISSING (a birdless "flight" shot is stable but wrong).
  - `crossrun.mjs` / `stability.mjs` — shoot the same build several times and
    compare takes to each other; separates real change from render noise.
    LAW learned here: nothing is unstable until three sweeps agree.
- **The baselines** — the pinned "correct" version of every vantage, in
  `gauntlet/capture/baseline/`. Re-pinning = accepting a new look as the truth.
- **FLAKES.md** — the hard-won laws about flaky tests. Mandatory reading before
  writing any test. Sample laws that emerged: never weaken an assertion to get
  green; a test that resists 3 staging attempts is parked, not forced; an
  assertion that can't fail is not a test (proven by sabotage); re-pin only
  from a measured consensus sweep, never from whatever's on disk.

## 3. THE SHIP LAW (how every change ships)

    patch → fastgate (boot/syntax) → battery proof for mechanical changes →
    gate.sh prints CERTIFIED-SHIP → md5 the build → (visual? reshoot + diff +
    re-pin) → commit. One piece = one commit. Proof in the SAME commit as the
    change.

The last clause is load-bearing. When a session shipped five look-fixes with
no assertions (P5d2), a seven-way sabotage came back seven-green — nothing
would have caught a regression. "Proof in the same breath" is the law that
prevents that.

## 4. HOW WE RAN IT — two modes

**Overnight (blind).** Launched with:
`caffeinate -i claude --dangerously-skip-permissions "Read OVERNIGHT.md and
begin the overnight gauntlet."`
- `caffeinate -i` holds the Mac awake; the flag pre-approves tool prompts so
  the run is zero-touch. Acceptable because everything it touches is a git
  commit that can be reverted.
- It reads OVERNIGHT.md (the rules/contract) then TODO.md (the work queue),
  does up to six pieces smallest-first, certifies each, writes REPORT.md, and
  stops. Resumable cold from gauntlet-log.md — the worker keeps no memory
  between sessions; everything durable is in the files.
- Fenced: an explicit BLOCKED list in TODO.md keeps the blind run OFF taste
  work (the bird, lighting look, colour). Those need eyes.

**Waves / supervised (eyes-in-the-loop).** For anything judged by look. The
human is present; the machine builds 2-3 VARIANT strips per taste call,
reshoots the same vantage for each, the human picks, the pick is locked as
named constants + assertions (taste becomes a contract the night runs then
protect). Governed by WAVES.md.

**The morning ritual.** cat REPORT.md → check git log → run gate.sh yourself →
eyeball any frames the report flagged → re-pin what earned it → launch the next
run. The human's recurring job shrank to: read the report, judge the frames,
say yes/no.

## 5. THE SESSION LOCK

One writer owns the tree at a time. A SESSION.lock file is created at session
start and deleted at exit; a second session refuses to write if it exists.
Added after a two-writer collision (an overnight run and a supervised session
both editing at once). The human-side rule: never run a night shift and a day
wave at the same time.

## 6. THE REFERENCE BOARD

gauntlet/reference/board/ — a "studio wall" of 85 target images (60+ real kea
photos, NZ location plates, and reference-game screenshots), plus the Birds of
War trailer frames added when the visual target reset. `sidebyside.mjs`
composites a game vantage beside its target image so every art judgement is
"closer to THAT?" rather than "better?". Deep pools are deliberate: many photos
of the same behaviour give a model more reference points.

## 7. THE GAME-FOCUS-AUDIT SKILL

A separate skill (lives at /mnt/skills/user/game-focus-audit on the authoring
machine) that runs a focus-group + technical audit on a build: plays the game's
logic headlessly with test harnesses BEFORE forming any opinion, then produces
a severity-tiered review with executable evidence, an opportunities tier, a
genre-convention diff, persona voices, and a fix plan routed to patch sites.
Its ethos — "a finding without a failing test is review-tier, never a
showstopper" — is where much of the gauntlet's discipline came from. The two
full-frame visual audits that set the game's art direction were run this way.

## 8. THE HARD-WON CONTAINER TRUTHS

Things learned the painful way, worth inheriting:
- Wall-kills often happen AFTER the work finished — verify by mtime before
  rerunning.
- Background jobs are reaped between tool calls — don't rely on nohup.
- Headless-green does NOT prove browser-safe for canvas code — a browser-only
  boot error hides behind a green gate. The fix: extract the painter, run it
  under node against a stubbed 2D context, read the real error.
- Casting Python numbers before emitting JS (np.float64 leaked into JS once and
  killed the world build while all batteries stayed green).
- Measure, don't argue: repeatedly, a "600s hang" was leaked Chrome processes;
  a churn "regression" was a bad sweep; a fps reading was the browser idling.
  Every one was caught by measuring rather than reasoning.
