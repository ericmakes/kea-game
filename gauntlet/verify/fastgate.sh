#!/bin/bash
# per-change inner loop: syntax + smoke + colossal tail
cd "$(dirname "$0")/../.." || exit 1
# REPLAT P1: the specimen is src/game.mjs. Parsed through the SAME loader the gate uses, under the
# same 'use strict', so a syntax or strict-mode fault shows up here in the inner loop rather than
# nine batteries later.
node -e "const {specimenSource}=require('./audits/2026-08-26/keasrc');new Function('THREE',\"'use strict';\"+specimenSource());" || { echo FASTGATE:SYNTAX-FAIL; exit 1; }
node harness-smoke.js >/dev/null 2>&1 || { echo FASTGATE:SMOKE-FAIL; exit 1; }
node audits/2026-08-26/harness-colossal.js >/dev/null 2>&1 || { echo FASTGATE:COLOSSAL-FAIL; exit 1; }
echo FASTGATE PASS
