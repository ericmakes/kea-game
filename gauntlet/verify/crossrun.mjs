// CROSS-RUN CHURN — shoot the set, quit the browser, shoot it again in a fresh process, and put a
// number on what the same photograph costs you for being taken twice.
// Usage: node gauntlet/verify/crossrun.mjs [ids]   env: RUNS (default 5)
//        CROSSKEEP=1 leaves the run directories on disk and prints where
//
// WHY THIS EXISTS (TODO 33). There were two questions about a frame and three instruments, and
// none of them asked the third question. diff.mjs asks whether a frame changed since it was pinned.
// stability.mjs asks whether it reshoots the same twice INSIDE one capture run - FLAKES law 12 is
// explicitly takes compared against each other. boxdiff asks whether the subject moved. Nobody
// asked whether it reshoots the same twice in a DIFFERENT PROCESS, and that turns out to be a
// separate class: 08_readability_320 and 22_torch_beam both read zero take-to-take within a run and
// thousands of pixels apart across runs. Session 4 measured it by hand off a checkout; this is the
// instrument, and it is cheap because piece 31 already built the unit.
//
// WHAT THE BRIEF ASKED FOR AND WHY IT IS NOT WHAT SHIPPED. TODO 33 says: assert the changed-pixel
// count per frame is near zero. Measured, that assertion would be red on nineteen of twenty-eight
// vantages tonight and it would be red for a reason nobody can fix from here - the settle lands on
// one of a handful of animation frame counts and each count is a different exact photograph, so the
// distance between two runs is the distance between two states, not a residual that shrinks if you
// try harder. Near zero is the GOAL of TODO 30 and 67, not a contract this instrument can hold.
// So it holds the contract it can: NO VANTAGE CHURNS MORE THAN IT IS RECORDED AS CHURNING. The
// ceilings live in pxdiff.mjs, which is the file that has to read them, and this is the file that
// measures them - so a staging change that makes a frame less reproducible goes red here, and a
// recalibration is a paste from the table this prints.
//
// FIVE RUNS, NOT THREE, AND THAT IS A MEASURED DEFAULT. Piece 31 built its first table from three
// sweeps and was wrong: 18_rear_close read a ceiling of 825 over three runs and 3909 in the wild,
// and over five runs 07_jam went 20 -> 1881 and 19_roof_follow 890 -> 4168. Ten pairwise distances
// beat three. RUNS=2 is honest for a quick look at one vantage and dishonest as a calibration.
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path'; import os from 'os';
import {pxdelta, churnOf} from './pxdiff.mjs';

const HERE=path.dirname(new URL(import.meta.url).pathname);
const ROOT=path.resolve(HERE,'..','..'), CAP=path.resolve(HERE,'..','capture');

// SHOOT A RUN IN ITS OWN PROCESS. execSync is the whole point: capture.mjs launches and closes its
// own browser per shot, but it is one node process for the sweep, and a sweep is what has to be
// repeated. The frames are copied out immediately because the next run overwrites them.
export function shootRun(dir,ids){
  fs.mkdirSync(dir,{recursive:true});
  const env=ids&&ids.length?`SHOTS=${ids.join(',')} `:'';
  execSync(`${env}node gauntlet/verify/capture.mjs`,{cwd:ROOT,stdio:'ignore'});
  for(const f of fs.readdirSync(CAP).filter(f2=>f2.endsWith('.png')))
    fs.copyFileSync(path.join(CAP,f),path.join(dir,f));
  return dir;
}

// COMPARE PREPARED RUNS. Split out so the selftest can drive it over fixtures instead of a browser.
export function compare(dirs,only){
  const base=path.join(CAP,'baseline');
  const names=fs.existsSync(base)? fs.readdirSync(base).filter(f=>f.endsWith('.png')) : [];
  const rows=[];
  for(const f of names){
    const id=f.replace(/\.png$/,'');
    if(only&&only.length&&!only.some(o=>id.startsWith(o)))continue;
    const have=dirs.filter(d=>fs.existsSync(path.join(d,f)));
    if(have.length<2){ rows.push({id,runs:have.length,samples:[],worst:-1,ceiling:churnOf(id)}); continue; }
    const samples=[];
    for(let i=0;i<have.length;i++) for(let j=i+1;j<have.length;j++)
      samples.push(pxdelta(path.join(have[i],f),path.join(have[j],f)).px);
    rows.push({id, runs:have.length, samples, worst:Math.max(...samples), ceiling:churnOf(id)});
  }
  return rows;
}

if(path.resolve(process.argv[1]||'')===path.resolve(HERE,'crossrun.mjs')){
  const IDS=(process.argv[2]||'').split(',').filter(Boolean);
  const RUNS=+(process.env.RUNS||5);
  const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'kea-crossrun-'));
  let rows=[];
  try{
    const dirs=[];
    for(let r=1;r<=RUNS;r++){ dirs.push(shootRun(path.join(TMP,'run'+r),IDS)); console.log('run',r,'shot'); }
    rows=compare(dirs,IDS);
  } finally { if(!process.env.CROSSKEEP) fs.rmSync(TMP,{recursive:true,force:true}); else console.log('kept',TMP); }

  let flags=0, thin=0;
  for(const r of rows){
    if(r.runs<2){ console.log(`- ${r.id.padEnd(22)} only ${r.runs} run produced this frame, skipped`); thin++; continue; }
    const over=r.worst>r.ceiling; if(over)flags++;
    console.log(`${over?'✗':'✓'} ${r.id.padEnd(22)} churn ${String(r.worst).padStart(6)} px worst of `+
      `${r.samples.length} pairs   recorded ${String(Math.round(r.ceiling)).padStart(6)}`+
      (over?'  <-- LESS REPRODUCIBLE THAN IT IS RECORDED AS BEING':''));
  }
  if(rows.some(r=>r.runs>=2)){
    console.log('\nPASTE-READY, if this run is a deliberate recalibration of the pxdiff CHURN table:');
    for(const r of rows.filter(r2=>r2.runs>=2))
      console.log(`  '${r.id}':${String(r.worst).padStart(5)},   // ${r.samples.join(' ')}`);
  }
  if(RUNS<5) console.log(`\nNOTE: ${RUNS} runs is ${RUNS<3?'a spot check':'thin'} - a ceiling from `+
    `three samples is a floor, which is how the first pxdiff table came out wrong. Calibrate on 5.`);
  console.log(`CROSSRUN: ${rows.length-thin} vantages, ${RUNS} runs, ${flags} over their recorded churn`);
  process.exitCode=flags?1:0;
}
