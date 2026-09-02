// SUBJECT DRIFT — SSIM the SUBJECT BOX of every pinned vantage against its baseline.
// Usage: node gauntlet/verify/boxdiff.mjs   (run after a capture pass, beside diff.mjs)
//
// WHY THIS EXISTS (TODO 57, 2026-09-02). There were two instruments and a gap between them.
// diff.mjs asks whether the FRAME moved since it was pinned. subjects.mjs asks whether the bird is
// THERE. Neither asks whether the bird MOVED - and it turns out nothing did, for four builds.
// Piece 54 turned 17_flight from a glide into a mid-downstroke. That is a different photograph of a
// different wing pose, and diff.mjs reported 0.9826 against a threshold of 0.965 and did not flag
// it. The bird fills about a twentieth of a 960x540 frame, so a whole-frame SSIM is a landscape
// metric: the subject can be replaced outright and stay inside the drift budget. Cropped to its
// subject box the same pair reads 0.639.
//
// THE BOXES ARE subjects.mjs OWN, imported rather than copied - the same regions, a different
// question. A vantage gets a row here when it carries a SUBJECT box there (the 07 road box is not a
// subject and is skipped by name). Adding coverage means measuring a box per vantage the way
// subjects.mjs measured its, WITH AN EYEBALL:
//   DO NOT TRY TO FIND THE BIRD AUTOMATICALLY. Two attempts on the night this was written, both
//   worthless. A bounding box over every kea-window pixel spans 96% of the frame, because the
//   window only discriminates INSIDE a chosen region - which is the trap subjects.mjs already warns
//   about. And a peak-density search finds the HUD in 24 of 25 frames, because the KEA 1 badge is
//   painted in var(--kea): the same olive as the bird, by design. The frames that need boxes and do
//   not have them are 03, 13, 18 and 20, where the subject IS the photograph.
//
// THRESHOLD. Measured, and every number here is one this file produced rather than a round guess:
//   04_flight_underwing  0.9999   |  09_colossal  1.0000  |  25_preen_follow  0.9996
//   17_flight            0.6388   the piece 54 change, which diff.mjs reads as 0.9826 and passes
//   07_jam               0.9580   NOT an intended change - see below
// The bar sits at 0.98: an order of magnitude clear of the three that are unchanged, and nowhere
// near the one it was built to catch.
// AND ITS FIRST RUN FOUND SOMETHING NOBODY HAD SEEN. 07_jam reads 0.9580 in the subject box while
// the whole frame reads 0.9904 and passes at 0.965. It is not noise: three consecutive reshoots gave
// 0.957981, 0.957981 and 0.957993 against the pinned baseline, so the subject is perfectly
// reproducible and has simply MOVED since it was pinned - the resting wings sit differently. That
// baseline was pinned at 59a8493, many builds back, and narrowing it further needs a bisect with a
// camera. Left flagged for Eric rather than re-pinned, which is the whole point of an instrument.
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path';
import {SPEC, W, H} from './subjects.mjs';

const HERE=path.dirname(new URL(import.meta.url).pathname);
const CAP=path.resolve(HERE,'..','capture'), BASE=path.join(CAP,'baseline');
const THRESH=+(process.env.BOXDIFF||0.98);
const NOTSUBJECT=new Set(['carblue']);           // the jam road queue is scenery, not a subject

// one box per vantage: the union of its subject-carrying test boxes
const ROWS=[];
for(const s of SPEC){
  const boxes=s.tests.filter(t=>!NOTSUBJECT.has(t.cls)).map(t=>t.box);
  if(!boxes.length)continue;
  const x0=Math.min(...boxes.map(b=>b[0])), y0=Math.min(...boxes.map(b=>b[1]));
  const x1=Math.max(...boxes.map(b=>b[0]+b[2])), y1=Math.max(...boxes.map(b=>b[1]+b[3]));
  ROWS.push({file:s.file, box:[x0,y0,x1-x0,y1-y0], from:s.tests.filter(t=>!NOTSUBJECT.has(t.cls)).map(t=>t.cls).join('+')});
}

const crop=(file,box,out)=>{
  const x=Math.round(box[0]*W), y=Math.round(box[1]*H);
  const w=Math.round(box[2]*W), h=Math.round(box[3]*H);
  execSync(`ffmpeg -v error -i "${file}" -vf "crop=${w}:${h}:${x}:${y}" -y "${out}"`);
  return {w,h};
};
const ssim=(a,b)=>{ let out='';
  try{ out=execSync(`ffmpeg -i "${a}" -i "${b}" -lavfi ssim -f null - 2>&1`).toString(); }catch(e){ out=String(e.output||e); }
  const m=out.match(/All:([\d.]+)/); return m?parseFloat(m[1]):0; };

const TMP=fs.mkdtempSync(path.join(CAP,'boxdiff-'));
let n=0, flags=0, worst=1;
try{
  for(const r of ROWS){
    const fresh=path.join(CAP,r.file+'.png'), base=path.join(BASE,r.file+'.png');
    if(!fs.existsSync(fresh)||!fs.existsSync(base)){
      console.log(`- ${r.file.padEnd(22)} no pinned pair, skipped`); continue; }
    const a=path.join(TMP,r.file+'.fresh.png'), b=path.join(TMP,r.file+'.base.png');
    const dim=crop(fresh,r.box,a); crop(base,r.box,b);
    const s=ssim(a,b); n++; if(s<worst)worst=s;
    const flag=s<THRESH; if(flag)flags++;
    console.log(`${flag?'✗':'✓'} ${r.file.padEnd(22)} subject ssim ${s.toFixed(4)}`+
      `  [${dim.w}x${dim.h} ${r.from}]`+(flag?'  <-- THE SUBJECT CHANGED, whatever the frame says':''));
  }
} finally { fs.rmSync(TMP,{recursive:true,force:true}); }
console.log(`BOXDIFF: ${n} subjects compared, ${flags} changed (worst ${worst.toFixed(4)}, threshold ${THRESH})`);
process.exitCode=flags?1:0;
