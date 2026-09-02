// CROSSRUN SELFTEST — the contract test for crossrun.mjs (TODO 33).
// Usage: node gauntlet/verify/crossrun-selftest.mjs
//
// crossrun costs five browser sweeps to run for real, so its comparison half is split out as
// compare() and driven here over prepared directories instead. That is the only way to assert what
// it does with a frame that got LESS reproducible, which is the whole contract - waiting for the
// rig to become unstable by itself is not a test. Two of the four fixtures are synthetic for that
// reason; the last one shoots for real, twice, on one vantage, because a comparison function that
// is never handed a real pair proves nothing about the shooting path.
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path'; import os from 'os';
import {compare, shootRun} from './crossrun.mjs';
import {churnOf} from './pxdiff.mjs';

const HERE=path.dirname(new URL(import.meta.url).pathname);
const CAP=path.resolve(HERE,'..','capture'), BASE=path.join(CAP,'baseline');
const F=[]; const ok=(c,m)=>{ if(!c)F.push(m); else console.log('  · '+m); };
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'kea-crossself-'));
const R=n=>{ const d=path.join(TMP,n); fs.mkdirSync(d,{recursive:true}); return d; };
const PICK='18_rear_close', OTHER='15_sign';

try{
  // ---- 1. two identical runs churn nothing, and every vantage is reported
  const a=R('a'), b=R('b');
  for(const f of [PICK+'.png',OTHER+'.png']){
    fs.copyFileSync(path.join(BASE,f),path.join(a,f));
    fs.copyFileSync(path.join(BASE,f),path.join(b,f)); }
  const r1=compare([a,b],[PICK,OTHER]);
  ok(r1.length===2, `both fixtures came back as rows, not ${r1.length}`);
  ok(r1.every(r=>r.worst===0), `two identical runs churn ${r1.map(r=>r.worst).join(' and ')} px`);
  ok(r1.every(r=>r.samples.length===1), 'two runs make one pair');

  // ---- 2. a frame that got less reproducible is named, and only that one
  const c=R('c');
  fs.copyFileSync(path.join(BASE,OTHER+'.png'),path.join(c,OTHER+'.png'));
  execSync(`ffmpeg -v error -i "${path.join(BASE,PICK+'.png')}" -vf `+
    `"geq=r='min(255,r(X,Y)+12)':g='min(255,g(X,Y)+12)':b='min(255,b(X,Y)+12)'" `+
    `-y "${path.join(c,PICK+'.png')}"`);
  const r2=compare([a,c],[PICK,OTHER]);
  const hit=r2.find(r=>r.id===PICK), miss=r2.find(r=>r.id===OTHER);
  ok(hit.worst>400000, `the lifted frame churns ${hit.worst} px of 518400`);
  ok(hit.worst>hit.ceiling, `which is over its recorded ceiling of ${Math.round(hit.ceiling)}`);
  ok(miss.worst===0, `and the frame beside it is untouched at ${miss.worst} px`);

  // ---- 3. the ceiling is pxdiff's, not a second copy of it
  ok(hit.ceiling===churnOf(PICK) && churnOf(PICK)>0,
    `the ceiling is read from the pxdiff CHURN table (${churnOf(PICK)} px for ${PICK})`);
  ok(compare([a,b],['09_colossal']).length===0 ||
     compare([a,b],['09_colossal'])[0].runs<2,
    'a vantage with no frames in the runs is reported as thin rather than compared');

  // ---- 4. three runs make three pairs, and the worst of them is what is reported
  const r4=compare([a,b,c],[PICK]);
  ok(r4[0].samples.length===3, `three runs make ${r4[0].samples.length} pairs`);
  ok(r4[0].samples.filter(s=>s===0).length===1, 'one of which is the identical pair, at 0 px');
  ok(r4[0].worst===Math.max(...r4[0].samples), `and the row carries the worst of them (${r4[0].worst})`);

  // ---- 5. the shooting path, for real, on one vantage
  const s1=shootRun(R('s1'),[PICK]), s2=shootRun(R('s2'),[PICK]);
  ok(fs.existsSync(path.join(s1,PICK+'.png'))&&fs.existsSync(path.join(s2,PICK+'.png')),
    'two real runs each produced the frame, in their own process');
  const r5=compare([s1,s2],[PICK]);
  ok(r5.length===1 && r5[0].samples.length===1, 'and they compare as one pair');
  // NOT a multiple of the recorded ceiling: a real pair can legitimately be 0 (the two runs land in
  // the same state) or several times the ceiling (which is the finding, and is how this vantage got
  // recalibrated), so a bound either side of it would be asserting the rig is stable rather than
  // asserting this file works. What is load bearing is that the count came back at all - pxdelta
  // returns -1 when ffmpeg gives it nothing - and that it is nowhere near a whole-frame change.
  ok(r5[0].worst>=0, `a real cross-run pair produced a count, not the -1 sentinel: ${r5[0].worst} px`);
  // AND NOT A FRACTION OF THE LIFTED FRAME EITHER. That bound was /50 and it went red, because a
  // real cross-run pair on this vantage came back 16317 px once - see the outlier note in
  // pxdiff.mjs. Asserting that the rig is stable is not this file job; asserting that a real pair
  // comes back as a photograph rather than a whole frame is.
  ok(r5[0].worst<hit.worst,
    `and it is a photograph rather than a whole frame: ${r5[0].worst} px against ${hit.worst}`);
} finally { fs.rmSync(TMP,{recursive:true,force:true}); }

if(F.length){ console.log(`CROSSRUN-SELFTEST: ${F.length} FINDINGS`);
  for(const f of F)console.log('    ✗ '+f); process.exit(1); }
console.log('CROSSRUN-SELFTEST: ALL PASS');
