/* FRAMEMETER — the frame budget as a GATE BATTERY. PERF piece, 2026-10-02.

   Eric: "promote the meter to a battery". framebudget.mjs is the live meter (headful system Chrome on
   the real GPU, the game running, the bird flown round a circuit by real input, vsync and the frame
   limiter off so a rAF delta is the frame's real cost). This runs it RUNS times, each in its own
   browser, and judges the MEDIAN of the unlocked means against 16.67 ms — one run is a sample of a
   thermally drifting machine, not a measurement.
   IT FAILS CLOSED. The target is an AC figure, so on battery power this is a FINDING, not a skip: a
   battery that prints ALL PASS without measuring is the vacuous pass this gauntlet exists to refuse.
   Plug in to certify. A run the meter itself calls INVALID (software renderer, hidden window, frames
   not drawn) is a finding too.
   It speaks the gate's contract: ALL PASS + exit 0, or FINDINGS + exit 1.
   AT 100% RENDER SCALE (Eric, 2026-10-03: "under the 16.7 ms budget at 100% render scale on this Mac;
   auto scale is a safety net only"). KEASCALE=1 is set for every run unless the caller overrides it.
   Usage: node gauntlet/verify/framemeter.mjs     env: RUNS (3)  BUDGET_MS (16.67)  KEASCALE */
import { execFileSync } from 'child_process';
import path from 'path'; import url from 'url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..');
const RUNS = +(process.env.RUNS || 3), BUDGET = +(process.env.BUDGET_MS || 1000 / 60);
const fails = [];
let ac = false; try { ac = /AC Power/.test(execFileSync('pmset', ['-g', 'batt'], { encoding: 'utf8' })); } catch (e) {}
if (!ac) fails.push('the machine is on battery power — the frame budget is an AC figure; plug in to certify');
const runs = [];
if (ac) for (let i = 0; i < RUNS; i++) {
  let txt = '';
  try { txt = execFileSync('node', ['gauntlet/verify/framebudget.mjs'], { cwd: ROOT, encoding: 'utf8', env: { KEASCALE: '1', ...process.env, MODES: 'unlocked', JSON: '1' }, maxBuffer: 16 << 20 }); }
  catch (e) { txt = String(e.stdout || ''); }                 // OVER BUDGET exits 1 and still prints its JSON
  let j = null; try { j = JSON.parse(txt.slice(txt.indexOf('{'))); } catch (e) { fails.push(`run ${i + 1}: the meter printed no verdict`); continue; }
  const u = j.out.find(r => r.mode === 'unlocked');
  if (j.verdict === 'INVALID') fails.push(`run ${i + 1}: the meter refused its own reading — ${j.refuse.join('; ')}`);
  runs.push({ mean: u.meanMs, median: u.medianMs, p95: u.p95Ms, px: u.px, gpu: u.gpu });
}
const means = runs.map(r => r.mean).sort((a, b) => a - b);
const med = means.length ? (means.length % 2 ? means[means.length >> 1] : (means[means.length / 2 - 1] + means[means.length / 2]) / 2) : null;
if (med != null && med > BUDGET) fails.push(`median unlocked mean ${med.toFixed(2)} ms is over the ${BUDGET.toFixed(2)} ms budget (runs ${means.join(', ')})`);
console.log(`FRAMEMETER ${ac ? 'AC' : 'BATTERY'}  render scale ${process.env.KEASCALE || '1 (fixed)'}  ${runs.length} runs  ${runs[0] ? runs[0].px + '  ' + runs[0].gpu : ''}`);
for (const [i, r] of runs.entries()) console.log(`  run ${i + 1}: mean ${r.mean} ms  median ${r.median}  p95 ${r.p95}`);
console.log(fails.length ? fails.map(f => '    ✗ ' + f).join('\n') + `\nFRAMEMETER: ${fails.length} FINDINGS`
                         : `FRAMEMETER: ALL PASS — ${med.toFixed(2)} ms a frame at ${process.env.KEASCALE ? 'scale ' + process.env.KEASCALE : '100%'}, live game, bird flying, inside ${BUDGET.toFixed(2)}`);
process.exit(fails.length ? 1 : 0);
