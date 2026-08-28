#!/bin/bash
# THE GATE — nine batteries, all green or no ship. Usage: bash gauntlet/verify/gate.sh
cd "$(dirname "$0")/../.."
BATS="harness-smoke.js audits/2026-08-26/harness-flow.js audits/2026-08-26/harness-couch.js audits/2026-08-26/harness-adversarial.js audits/2026-08-26/harness-systems.js audits/2026-08-26/harness-colossal.js audits/2026-08-27/harness-newbuilds-audit.js audits/2026-08-27/harness-audit-pass2.js audits/2026-08-28/harness-everything.js"
for h in $BATS; do node $h 2>&1 | grep -v "THREE.Material" | tail -1; done | tee /tmp/gate.txt
if grep -q "✗\|FINDINGS" /tmp/gate.txt; then echo CERT-FAIL; exit 1; fi
md5sum untitled-kea-game.html
if [ -n "$OUTDIR" ]; then
  cp untitled-kea-game.html "$OUTDIR"/untitled-kea-game.html
  cd gauntlet && rm -f "$OUTDIR"/kea-gauntlet-pack.zip
  zip -rq "$OUTDIR"/kea-gauntlet-pack.zip reference CRITIC.md TASKS.md OPPORTUNITIES.md audio verify capture motion -x "*/node_modules/*"
  cd ..
fi
echo CERTIFIED-SHIP
