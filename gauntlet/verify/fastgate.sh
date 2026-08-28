#!/bin/bash
# per-change inner loop: syntax + smoke + colossal tail
cd "$(dirname "$0")/../.." || exit 1
node -e "const s=require('fs').readFileSync('untitled-kea-game.html','utf8');const l=[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(b=>b.includes('KEA-LOGIC-START'));new Function(l);" || { echo FASTGATE:SYNTAX-FAIL; exit 1; }
node harness-smoke.js >/dev/null 2>&1 || { echo FASTGATE:SMOKE-FAIL; exit 1; }
node audits/2026-08-26/harness-colossal.js >/dev/null 2>&1 || { echo FASTGATE:COLOSSAL-FAIL; exit 1; }
echo FASTGATE PASS
