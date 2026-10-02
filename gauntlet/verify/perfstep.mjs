/* PERFSTEP — one step of the performance piece, measured the way Eric ruled it. 2026-10-02.

   Eric: "Target 16.7 ms on AC with everything live and the bird flying, measured with the live meter;
   framescore on the six key vantages per step, refuse any step that drops a property out of band."
   So a step is two readings and a verdict:
     COST   framebudget.mjs, unlocked, RUNS times (default 2), each its own headful browser on the
            real GPU, the bird flown round a circuit. The figure is the MEDIAN of the runs' means: one
            run is a sample of a thermally drifting machine (the same state has read 65.7 then 40.0).
            Refused unless the machine is on AC — the target is an AC figure.
     LOOK   the six key vantages (GAPAUDIT.md) shot fresh, scored by framescore.mjs against the Birds
            of War wall. Per vantage, per property: in band or not.
   THE REFUSAL. Against the previous step's file (PREV=<label>), any property that was IN band and is
   now OUT is a refusal, named. A property that was out and stays out is not a refusal — the step is
   not asked to fix the grade, only not to break what is right. Exit 1 on a refusal.
   Usage: LABEL=s1_depth PREV=s0_base node gauntlet/verify/perfstep.mjs     RUNS=2  SKIPLOOK=1  SKIPCOST=1
   Writes gauntlet/capture/perf/<label>.json and copies the six frames to gauntlet/capture/perf/<label>/. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { execFileSync } from 'child_process';
const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'gauntlet/capture/perf');
const LABEL = process.env.LABEL || 'step';
const RUNS = +(process.env.RUNS || 2);
export const KEY6 = ['01_carpark_wide', '02_hut_snow', '06_skyline', '11_trailhead', '12_seal_midpeel', '07_jam'];
fs.mkdirSync(path.join(OUT, LABEL), { recursive: true });
const run = (args, env = {}) => execFileSync('node', args, { cwd: ROOT, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 64 << 20 });

const rec = { label: LABEL, at: new Date().toISOString(), cost: null, look: null };
const power = execFileSync('pmset', ['-g', 'batt'], { encoding: 'utf8' });
rec.ac = /AC Power/.test(power);

if (!process.env.SKIPCOST) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    let txt = ''; try { txt = run(['gauntlet/verify/framebudget.mjs'], { MODES: 'unlocked', JSON: '1' }); }
    catch (e) { txt = String(e.stdout || ''); }                 // OVER BUDGET exits 1 and still prints
    const j = JSON.parse(txt.slice(txt.indexOf('{')));
    const u = j.out.find(r => r.mode === 'unlocked');
    runs.push({ meanMs: u.meanMs, medianMs: u.medianMs, p95Ms: u.p95Ms, fps: u.fps, gpu: u.gpu, refuse: j.refuse });
  }
  const m = runs.map(r => r.meanMs).sort((a, b) => a - b);
  const med = m.length % 2 ? m[m.length >> 1] : (m[m.length / 2 - 1] + m[m.length / 2]) / 2;
  rec.cost = { runs, meanMs: +med.toFixed(2) };
}
if (!process.env.SKIPLOOK) {
  run(['gauntlet/verify/capture.mjs'], { SHOTS: KEY6.join(',') });
  const frames = KEY6.map(v => { const src = path.join(ROOT, 'gauntlet/capture', v + '.png'), dst = path.join(OUT, LABEL, v + '.png'); fs.copyFileSync(src, dst); return dst; });
  const fsj = JSON.parse(run(['gauntlet/verify/framescore.mjs', ...frames], { JSON: '1', WALL: 'bow' }));
  rec.look = {};
  for (const r of fsj) { const v = path.basename(r.frame, '.png'); rec.look[v] = { inCount: r.inCount, rows: Object.fromEntries(r.rows.map(x => [x.k, { gv: +x.gv.toFixed(4), ok: x.ok, miss: +(x.miss || 0).toFixed(2) }])) }; }
}
const refusals = [];
if (!rec.ac) refusals.push('the machine is on battery — the target is an AC figure');
if (process.env.PREV) {
  const prev = JSON.parse(fs.readFileSync(path.join(OUT, process.env.PREV + '.json'), 'utf8'));
  if (rec.look && prev.look) for (const v of KEY6) for (const k in (prev.look[v] || {}).rows || {}) {
    const a = prev.look[v].rows[k], b = rec.look[v] && rec.look[v].rows[k];
    if (a && a.ok && b && !b.ok) refusals.push(`${v} ${k}: was in band (${a.gv}), now out (${b.gv}, ${b.miss} half-widths)`);
  }
  rec.prev = process.env.PREV;
}
rec.refusals = refusals;
fs.writeFileSync(path.join(OUT, LABEL + '.json'), JSON.stringify(rec, null, 1));
console.log(`PERFSTEP ${LABEL}${rec.prev ? ' (against ' + rec.prev + ')' : ''}   ${rec.ac ? 'AC' : 'BATTERY'}`);
if (rec.cost) console.log(`  cost   ${rec.cost.meanMs} ms/frame (median of ${RUNS} unlocked means: ${rec.cost.runs.map(r => r.meanMs).join(', ')})  budget 16.67`);
if (rec.look) console.log('  look   ' + KEY6.map(v => `${v.slice(0, 2)} ${rec.look[v].inCount}/6`).join('  '));
console.log(refusals.length ? refusals.map(r => '    ✗ ' + r).join('\n') + `\nPERFSTEP: REFUSED (${refusals.length})` : 'PERFSTEP: ACCEPTED — no property left its band');
process.exit(refusals.length ? 1 : 0);
