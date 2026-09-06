// REPIN — the consensus re-pin, as an instrument instead of a hand procedure.
// Usage: node gauntlet/verify/repin.mjs [ids]    env: RUNS (default 4), DRY=1, KEEP=1
//        FIRSTPIN=<ids> ...      pin vantages that have NO baseline yet (Eric's call, see below)
//        SHOOT=<dir> node gauntlet/verify/repin.mjs [ids]      one sweep into <dir>, then stop
//        DIRS=<d1>,<d2>,<d3>[,...] node gauntlet/verify/repin.mjs [ids]   consensus from those
//
// WHY THIS FILE EXISTS (TODO 73). A re-pin used to mean "copy whatever is sitting in
// gauntlet/capture into baseline/", which is one sweep, and one sweep is not a measurement. Session
// 15b proved what that costs: across four independent sweeps, ONE RUN STOOD CLEAR OF THE OTHER
// THREE ON 12 OF 28 VANTAGES - it had been shot while the machine was still settling from a killed
// run - and on several the other three agreed at EXACTLY zero. Pinning from the frames on disk
// would have pinned that run's state on about fifteen vantages. It was done by hand that night, in
// a scratch script that no longer exists, which means the next re-pin either repeats the reasoning
// from the log or quietly goes back to one sweep. Eric has now ordered a consensus re-pin twice, so
// it is a tool.
//
// THE MEDOID, PER VANTAGE, NOT PER RUN. For each vantage, each run's frame is scored by its TOTAL
// pixel distance to the same frame in every other run, and the lowest score wins. That is the take
// the other takes agree with most - the consensus state, not an average of states, which matters
// because you cannot average two photographs and get a photograph.
// PER VANTAGE IS THE LOAD-BEARING HALF. A sweep is thirty independent photographs in thirty browser
// processes, so a run can be the outlier on one frame and the consensus on another: session 15b's
// pin provenance came out run1 7, run2 12, run3 4, run4 5, and 28_skifield_base's outlier was run3
// while run1 was the outlier nearly everywhere else. A run is disqualified PER FRAME, never wholesale.
//
// IT REFUSES TO PIN A FRAME IT CANNOT FORM A CONSENSUS ABOUT. With fewer than three runs carrying a
// vantage there is no medoid worth the name - two frames are equidistant from each other and the
// "winner" is just the first one - so such a vantage is reported and left alone. Same for a vantage
// with no baseline: adding one is a new-vantage decision for Eric, not a side effect of a re-pin
// (26_tour_brochure and 27_travel_card have been waiting on that call for three sessions).
//
// FIRSTPIN IS HOW ERIC'S DECISION GETS EXPRESSED, and it is deliberately a SECOND, EXPLICIT list
// rather than a loosening of the rule above. The refusal is the safety property - a re-pin must
// never quietly enlarge the pinned set - so the ids to first-pin have to be NAMED, and naming one
// that already has a baseline is refused as a mistake rather than treated as a re-pin. Everything
// else is identical: the same N sweeps, the same per-vantage medoid, the same provenance line. It
// exists because the tour has three more maps to come and each one arrives as a set of first pins;
// doing that by hand three more times is how a consensus quietly becomes one sweep again.
//     FIRSTPIN=31_camp_shelter,32_camp_sites,33_camp_gate DIRS=/a,/b,/c node repin.mjs
import fs from 'fs'; import path from 'path'; import os from 'os';
import {shootRun} from './crossrun.mjs';
import {pxdelta} from './pxdiff.mjs';

const HERE=path.dirname(new URL(import.meta.url).pathname);
const ROOT=path.resolve(HERE,'..','..');
const CAP=path.resolve(HERE,'..','capture'), BASE=path.join(CAP,'baseline');

const IDS=(process.argv[2]||'').split(',').filter(Boolean);
const FIRST=(process.env.FIRSTPIN||'').split(',').filter(Boolean);
const RUNS=+(process.env.RUNS||4);
const DRY=!!process.env.DRY;
/* SHOOT-THEN-SELECT, AS TWO SEPARATE JOBS, BECAUSE ONE LONG JOB IS A FRAGILE JOB. Four sweeps is
   about eight minutes in one process, and this file lost two of those to a process that died at
   run 4 and to one killed at run 1 — each time throwing away every sweep that HAD succeeded.
   DIRS=/a,/b,/c,/d skips the shooting entirely and forms the consensus from run directories
   already on disk, so each sweep can be its own short command (`SHOOT=dir` below) and a sweep that
   dies costs one sweep. It is also how a re-pin gets audited after the fact: the frames the pins
   came from are still there to be looked at. */
const SHOOT=process.env.SHOOT||'';
const DIRS=(process.env.DIRS||'').split(',').filter(Boolean);

/* ONE SWEEP, INTO A NAMED DIRECTORY, AND NOTHING ELSE. This is the half that takes minutes. */
if(SHOOT){
  fs.mkdirSync(SHOOT,{recursive:true});
  shootRun(SHOOT,IDS);
  const n=fs.readdirSync(SHOOT).filter(f=>f.endsWith('.png')&&!f.startsWith('probe_')).length;
  console.log('SHOT '+n+' frames -> '+SHOOT);
  process.exit(0);
}

if(!DIRS.length&&RUNS<3){ console.error('repin: RUNS='+RUNS+' cannot form a consensus. Three is '+
  'the minimum and four is what session 15b used; two frames are equidistant from each other and '+
  'the winner is just whichever was listed first.'); process.exit(1); }
if(DIRS.length&&DIRS.length<3){ console.error('repin: DIRS names only '+DIRS.length+
  ' run(s) — three is the minimum for a consensus.'); process.exit(1); }
for(const d of DIRS) if(!fs.existsSync(d)){ console.error('repin: no such run directory: '+d); process.exit(1); }

const TMP=DIRS.length?null:fs.mkdtempSync(path.join(os.tmpdir(),'kea-repin-'));
const dirs=DIRS.slice();
try{
  if(!DIRS.length)
    for(let r=1;r<=RUNS;r++){ dirs.push(shootRun(path.join(TMP,'run'+r),IDS)); console.log('run '+r+' shot'); }
  else console.log('forming a consensus from '+dirs.length+' run directories already on disk');

  const pinned=path.join(BASE);
  const want=fs.readdirSync(BASE).filter(f=>f.endsWith('.png'))
    .filter(f=>!IDS.length||IDS.some(o=>f.startsWith(o)));
  /* THE FIRST PINS ARE ADDED TO THE WORK LIST, and a name that is already pinned is an ERROR rather
     than a no-op: FIRSTPIN means "this has never been pinned", so if it has, the caller believes
     something untrue about the set and should find that out here. */
  for(const id of FIRST){
    const f=id.endsWith('.png')?id:id+'.png';
    if(fs.existsSync(path.join(BASE,f)))
      throw new Error('repin: FIRSTPIN names '+f+', which ALREADY has a baseline — that is a re-pin, '+
        'not a first pin. Drop it from FIRSTPIN and pass it as an id instead.');
    if(!dirs.some(d=>fs.existsSync(path.join(d,f))))
      throw new Error('repin: FIRSTPIN names '+f+', which none of the run directories shot');
    want.push(f);
  }

  const prov={}, rows=[]; let thin=0;
  for(const f of want){
    const id=f.replace(/\.png$/,'');
    const have=dirs.map((d,i)=>({run:i+1,p:path.join(d,f)})).filter(x=>fs.existsSync(x.p));
    if(have.length<3){ rows.push({id,runs:have.length,skip:true}); thin++; continue; }
    // pairwise distances, then each candidate's total distance to the others
    const D={};
    for(let i=0;i<have.length;i++)for(let j=i+1;j<have.length;j++){
      const px=pxdelta(have[i].p,have[j].p).px;
      D[i+'_'+j]=px; D[j+'_'+i]=px; }
    const score=have.map((x,i)=>({...x,sum:have.reduce((a,_,j)=>a+(i===j?0:D[i+'_'+j]),0)}));
    score.sort((a,b)=>a.sum-b.sum||a.run-b.run);
    const win=score[0];
    prov[win.run]=(prov[win.run]||0)+1;
    rows.push({id,runs:have.length,win:win.run,sums:score.map(s=>s.run+':'+s.sum),
               spread:score[score.length-1].sum-win.sum});
    if(!DRY) fs.copyFileSync(win.p,path.join(pinned,f));
  }

  const w=Math.max(...rows.map(r=>r.id.length));
  for(const r of rows){
    if(r.skip){ console.log('- '+r.id.padEnd(w)+'  only '+r.runs+' run(s) produced this frame — NOT pinned'); continue; }
    console.log((DRY?'· ':'✓ ')+r.id.padEnd(w)+'  medoid run '+r.win+' of '+r.runs+
      '   totals ['+r.sums.join(' ')+']   spread '+r.spread);
  }
  console.log('\nPIN PROVENANCE  '+Object.keys(prov).sort().map(k=>'run'+k+' '+prov[k]).join(', ')+
    '   (a run is disqualified per frame, never wholesale)');
  if(FIRST.length)console.log('FIRST PINS ADDED TO THE SET  '+FIRST.join(', ')+
    '   — a new vantage on Eric\'s call, not a side effect of a re-pin');
  /* THE RUN COUNT IS THE NUMBER OF RUNS THIS ACTUALLY USED, not the RUNS default. With
     DIRS=/a,/b,/c,/d,/e it printed "4 runs" from a five-run consensus — and that line is what gets
     pasted into BASELINE.md as the pin's provenance, so it was a tool misreporting its own
     evidence. Per vantage the count can be lower still (a targeted sweep carries only some
     frames), which is why the per-row `runs` is what the skip check reads. */
  console.log('REPIN: '+(DIRS.length||RUNS)+' run directories, '+
    (rows.length-thin)+' vantages '+(DRY?'would be':'')+' pinned'+
    (thin?', '+thin+' skipped for want of a consensus':'')+(DRY?'  [DRY RUN — nothing written]':''));
  /* NOT IN THE SET, AND THE TOOL SAYS SO EVERY TIME rather than leaving it to be remembered. */
  /* A VANTAGE IS A NUMBERED FRAME, and that is now the filter rather than "everything except
     probe_*". The capture directory also holds every PROOF frame any piece has ever shot —
     P4d_proof_wide_AB, P5e_step2_face, P6A_B_bench_model and about forty others — and they are not
     vantages, have no baseline and never will. Listing them buried the one thing this line exists
     to say (26_tour_brochure and 27_travel_card are waiting on a decision) under forty rows of
     noise, which is the same as not saying it.
     THE UNION OF EVERY RUN DIRECTORY, not dirs[0], because a TARGETED sweep carries only the
     frames it was asked for — `SHOOT=dir repin.mjs 03_kea_plate` writes one file — and reading the
     first directory alone would report the other twenty-seven as unpinned. */
  const shot=new Set();
  for(const d of dirs) for(const f of fs.readdirSync(d))
    if(/^\d\d_.*\.png$/.test(f))shot.add(f);
  const unpinned=[...shot].filter(f=>!fs.existsSync(path.join(BASE,f)));
  if(unpinned.length) console.log('UNPINNED, and still not pinned by this tool — adding a vantage '+
    'is a decision for Eric, not a side effect of a re-pin: '+unpinned.map(f=>f.replace(/\.png$/,'')).join(', '));
} finally {
  /* DIRS the caller owns are never deleted — they are the caller's evidence, not our scratch. */
  if(TMP){ if(process.env.KEEP) console.log('kept '+TMP); else fs.rmSync(TMP,{recursive:true,force:true}); }
}
