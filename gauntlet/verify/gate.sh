#!/bin/bash
# THE GATE — nine batteries, all green or no ship. Usage: bash gauntlet/verify/gate.sh
# THIS FILE HAS ITS OWN CONTRACT TEST: gauntlet/verify/gate-selftest.sh. Run it whenever this file
# changes. Against the pre-2026-09-02 gate it reports four findings, one per class of dead battery
# that used to certify: a throw, a battery that prints nothing, one that passes then exits 1, and a
# battery file that is not there at all.
# 2026-09-02 (TODO 46): THE GATE NOW ASSERTS POSITIVELY. It used to keep tail -1 per battery and go
# red only on a NEGATIVE match, and that could not see two whole classes of red:
#   1. A battery that THROWS prints a stack trace and no verdict at all. A stack trace matches
#      neither the tick nor FINDINGS, so a battery dying on its first assertion read as a pass.
#      Found by adversarial sabotage on piece 34, in a battery that had just been written.
#   2. harness-smoke.js ends with a node ExperimentalWarning about localStorage, two lines AFTER its
#      own verdict, so tail -1 kept the warning and threw the verdict away. Battery one of nine has
#      therefore been a no-op in this gate for its whole life: it prints FINDINGS and exits 1 on
#      failure, and neither reached the check. fastgate caught it by exit code; the gate did not.
# So: every battery must print its own ALL PASS line AND exit zero, and the number of verdicts must
# equal the number of batteries. Node warning noise is filtered before the verdict line is taken.
cd "$(dirname "$0")/../.."
BATS="harness-smoke.js audits/2026-08-26/harness-flow.js audits/2026-08-26/harness-couch.js audits/2026-08-26/harness-adversarial.js audits/2026-08-26/harness-systems.js audits/2026-08-26/harness-colossal.js audits/2026-08-27/harness-newbuilds-audit.js audits/2026-08-27/harness-audit-pass2.js audits/2026-08-28/harness-everything.js"
NOISE="THREE.Material|ExperimentalWarning|trace-warnings"
: > /tmp/gate.txt
N=0; DIRTY=0
for h in $BATS; do
  N=$((N+1))
  OUT=$(node "$h" 2>&1); RC=$?
  # 2026-09-03 (REPLAT P1 step 3): PRINT EVERY FINDING, not just the last line. The gate kept
  # `tail -1` per battery, so a battery with two findings surfaced only the SECOND one — the gate
  # still went red (the grep below sees any ✗), but it under-reported, and a porting session spent
  # a whole cycle fixing one finding before learning a second existed. Verdict AND findings now.
  # This does not loosen the count check: finding lines carry no 'ALL PASS', and a battery that
  # printed two verdicts would push PASSES above N and still fail. It fails closed either way.
  printf '%s\n' "$OUT" | grep -Ev "$NOISE" | grep -E "ALL PASS|FINDINGS|✗" | tee -a /tmp/gate.txt
  if [ "$RC" -ne 0 ]; then DIRTY=$((DIRTY+1)); echo "GATE: $h exited $RC" | tee -a /tmp/gate.txt; fi
done
if grep -q "✗\|FINDINGS" /tmp/gate.txt; then echo CERT-FAIL; exit 1; fi
PASSES=$(grep -c "ALL PASS" /tmp/gate.txt)
if [ "$PASSES" -ne "$N" ] || [ "$DIRTY" -ne 0 ]; then
  echo "CERT-FAIL: $PASSES of $N batteries reported ALL PASS, $DIRTY exited unclean"; exit 1; fi
# THE GATE HASHES WHAT THE BATTERIES LOADED. Since REPLAT P1 the specimen is src/game.mjs, not
# untitled-kea-game.html — that file is the FROZEN r128 build, kept as a reference for the
# re-platform and no longer under test. Hashing it here would have certified a file no battery
# reads. Both are printed: the specimen under test first, the frozen reference second, labelled.
echo -n 'specimen  '; md5sum src/game.mjs
echo -n 'frozen    '; md5sum untitled-kea-game.html
if [ -n "$OUTDIR" ]; then
  mkdir -p "$OUTDIR"/src
  cp src/game.mjs src/main.mjs "$OUTDIR"/src/
  cp index.html vite.config.mjs package.json "$OUTDIR"/
  cp untitled-kea-game.html "$OUTDIR"/untitled-kea-game.html   # the frozen reference travels too
  cd gauntlet && rm -f "$OUTDIR"/kea-gauntlet-pack.zip
  zip -rq "$OUTDIR"/kea-gauntlet-pack.zip reference CRITIC.md TASKS.md OPPORTUNITIES.md audio verify capture motion -x "*/node_modules/*"
  cd ..
fi
echo CERTIFIED-SHIP
