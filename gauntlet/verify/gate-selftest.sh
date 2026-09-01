#!/bin/bash
# GATE SELFTEST (TODO 46, 2026-09-02) — the gate has to be able to SEE a battery that dies.
# The gate is shell, so it cannot be proved by a node battery; this is its contract test. It runs a
# copy of the real gate.sh against stub batteries, so the production list stays hardcoded and no
# environment override exists in the shipped gate for anybody to narrow it with by accident.
# Usage: bash gauntlet/verify/gate-selftest.sh
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT

python3 - "$ROOT" "$T" <<'PY'
import sys, os
root, t = sys.argv[1], sys.argv[2]
s = open(os.path.join(root, 'gauntlet/verify/gate.sh')).read()
cd = 'cd "$(dirname "$0")/../.."'
assert s.count(cd) == 1, 'selftest: the cd anchor is missing from gate.sh'
s = s.replace(cd, 'cd "%s"' % root)
i = s.index('BATS="'); j = s.index('"\n', i + 6)
assert i > 0, 'selftest: the BATS anchor is missing from gate.sh'
s = s[:i] + 'BATS="$SELFBATS"' + s[j + 1:]
open(os.path.join(t, 'gate-copy.sh'), 'w').write(s)
PY
[ -f "$T/gate-copy.sh" ] || { echo "GATE-SELFTEST: could not build a gate copy"; exit 1; }

w(){ printf '%s\n' "$2" > "$T/$1"; }
w good1.js  'console.log("STUB ONE: ALL PASS");'
w good2.js  'console.log("STUB TWO: ALL PASS");'
w warned.js 'console.log("STUB WARNED: ALL PASS");
process.emitWarning("localStorage is not available", "ExperimentalWarning");'
w throws.js 'console.log("  · a section that never finishes");
null.ended;'
w finds.js  'console.log("STUB FINDS: 1 FINDINGS");
console.log("    ✗ something that matters");'
w silent.js 'process.exit(0);'
w liar.js   'console.log("STUB LIAR: ALL PASS"); process.exitCode=1;'

F=()
check(){ # name, expected verdict, battery list
  local out rc
  out=$(SELFBATS="$3" bash "$T/gate-copy.sh" 2>&1); rc=$?
  if printf '%s' "$out" | grep -q "$2"; then
    if [ "$2" = "CERTIFIED-SHIP" ] && [ "$rc" -ne 0 ]; then
      F+=("$1: said CERTIFIED-SHIP but exited $rc"); return; fi
    if [ "$2" = "CERT-FAIL" ] && [ "$rc" -eq 0 ]; then
      F+=("$1: said CERT-FAIL but exited zero"); return; fi
    echo "  · $1: $2"
  else
    F+=("$1: expected $2, got [$(printf '%s' "$out" | tail -1)]")
  fi
}

check "two clean batteries certify"                CERTIFIED-SHIP "$T/good1.js $T/good2.js"
check "a battery that THROWS is red"               CERT-FAIL      "$T/good1.js $T/throws.js"
check "a battery reporting findings is red"        CERT-FAIL      "$T/good1.js $T/finds.js"
check "a battery that says nothing is red"         CERT-FAIL      "$T/good1.js $T/silent.js"
check "a battery that passes then exits 1 is red"  CERT-FAIL      "$T/good1.js $T/liar.js"
check "a battery file that is missing is red"      CERT-FAIL      "$T/good1.js $T/gone.js"
check "a verdict buried under node warnings still counts" CERTIFIED-SHIP "$T/good1.js $T/warned.js"

if [ ${#F[@]} -ne 0 ]; then
  echo "GATE-SELFTEST: ${#F[@]} FINDINGS"
  for f in "${F[@]}"; do echo "    ✗ $f"; done
  exit 1
fi
echo "GATE-SELFTEST: ALL PASS"
