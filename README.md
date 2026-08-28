# THE KEA GAUNTLET — runs without anyone
Self-contained certification machine for `untitled-kea-game.html`. No chat, no Claude, no Eric required.

## Setup (once)
    npm install            # three (required) + puppeteer (only for visuals)

## Tier A — the logic gate (seconds, node only)
    bash gauntlet/verify/gate.sh
Runs all NINE batteries (smoke, flow, couch, adversarial, systems, colossal,
newbuild, pass2, everything — ~500 assertions) against the game file in this
folder. Prints CERTIFIED-SHIP or CERT-FAIL with the failing lines. Exit code
matches, so it drops straight into CI. Set OUTDIR=/some/dir to also export the
certified game + a fresh pack zip.

## Tier B — the visual tripwire (needs Chrome via puppeteer)
    SHOTS=21_night_camp node gauntlet/verify/capture.mjs   # reshoot vantage(s)
    node gauntlet/verify/diff.mjs                           # SSIM vs baseline
Every pinned baseline lives in gauntlet/capture/baseline. diff flags any
vantage that drifts below 0.965 SSIM and exits 1.

## Editing the game
Patch `untitled-kea-game.html`, run Tier A. If you point Claude Code at this
folder, it can run the whole loop — patch, gate, diff — autonomously.
Staging laws for writing new tests live in gauntlet/verify/FLAKES.md.
