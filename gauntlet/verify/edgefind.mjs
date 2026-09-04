// EDGE FINDER — is there a findable line in this frame, and how findable is it?
// Usage: node gauntlet/verify/edgefind.mjs <png> [more.png ...]
//   env: Y0,Y1,X0,X1  restrict to a box in pixels (default: whole frame minus the HUD strips)
//        WIN          step window in rows/columns (default 14)
//        TOPN         how many peaks to name (default 3)
//        FAIL         findability above which to exit 1 (default off)
// Its contract test is gauntlet/verify/edgefind-selftest.mjs. Run that whenever this file changes.
//
// WHY THIS EXISTS (REPLAT P4e). The brief is "prove no ring, edge or colour seam is findable", and
// every instrument in this directory answers a DIFFERENT question. diff and boxdiff ask "did this
// frame change since the baseline"; pxdiff asks "how many pixels moved". None of them can look at
// ONE frame and say whether it contains a line. Eyeballing it is exactly what this project does not
// accept for a claim it is going to write down, and "I could not see it" is not a measurement -
// P4c wrote an exemption on that basis and it cost a whole session.
//
// WHAT A GRASS FIELD'S EDGE ACTUALLY IS, WHICH IS WHY THERE ARE THREE CHANNELS.
// It is only PARTLY a brightness step. Three channels, measured on the same pass:
//     L   mean luminance per row (or column)
//     C   mean CHROMA per row - max(R,G,B) minus min(R,G,B). Saturation, not hue.
//     G   mean |horizontal luminance gradient| per row - a texture-energy proxy. Blades are
//         high-frequency detail; bare ground is not, however similar their average colour.
//
// THE C CHANNEL WAS ADDED BECAUSE THE MEASUREMENT SAID SO, and this is worth reading before
// trusting any number out of this file. REPLAT P4e measured the field's own edge under control -
// the SAME image rows, same light, same fog, shot once with blades standing there and once
// without - and the answer was:
//        bare ground   rgb 178.1 166.5 128.9    chroma 49    luma 166.3
//        with blades   rgb 181.9 157.9  99.7    chroma 82    luma 158.8
// Red is unchanged, luminance moves 4.5%, and CHROMA moves by two thirds. The field's edge is a
// SATURATION seam, not a brightness one - the ground beyond it is not darker or lighter, it is
// washed out. A luminance-and-texture detector scores that nearly clean, and this instrument was
// about to be used to certify "no colour seam is findable" while being structurally unable to see
// one. Three channels, and the verdict is the worst of them.
//
// AND THE NUMBER THAT MATTERS IS A RATIO, NOT A STEP. A raw step size is unreadable: a frame with a
// strong lighting gradient has big steps everywhere and none of them is a line. FINDABILITY is the
// peak step divided by the TYPICAL step ELSEWHERE in the same scan - "how far this line stands out
// from everything else in the frame". A smooth gradient gives peaks near the typical and scores ~1.
// A hard line is an outlier and scores high. That is what "findable" means, stated as arithmetic.
//
// TWO THINGS ABOUT THAT DENOMINATOR, AND THE SELFTEST FOUND BOTH ON ITS FIRST RUN.
//   1. THE PEAK'S OWN NEIGHBOURHOOD IS EXCLUDED FROM IT. A window step smears one line across 2*WIN
//      slots, so a frame that is otherwise perfectly flat has a "typical" step made ENTIRELY of the
//      line being measured - and a hard 60-level step scored 2.00, i.e. "not findable", which is
//      the exact opposite of the truth. Everything within 3*WIN of the peak is dropped.
//   2. THERE IS AN ABSOLUTE FLOOR OF HALF A GREY LEVEL. On a synthetic flat frame the denominator is
//      genuinely zero and the ratio is meaningless (or infinite). The floor is not a fudge to avoid
//      a division: below about half an 8-bit level a step is not visible at all, whatever it stands
//      out from, so the floor is the perceptual bottom of the scale and saying so is what stops the
//      ratio being read as unbounded. THE RAW STEP IS PRINTED BESIDE THE RATIO ALWAYS, because a
//      large ratio over a tiny step is a large ratio over nothing.
//
// IT SCANS BOTH AXES. A field edge at the play camera is a horizontal band; the same disc from the
// air is a circle whose arcs are locally horizontal at the top and bottom and locally vertical at
// the sides. Rows alone would half-blind it, so rows AND columns, and the verdict is the worse.
//
// WHAT IT CANNOT DO, STATED. It finds STRAIGHT-ish discontinuities aligned with the frame axes. A
// diagonal seam is smeared across many rows and scores lower than it deserves, and a small ring
// well inside the frame is averaged against the full width of every row it crosses. It is a
// tripwire that catches the artefact this piece is about, not a general seam detector - and a low
// score is evidence, not proof. The wide frame gets looked at as well.
import {execSync} from 'child_process'; import fs from 'fs';

const WIN=+(process.env.WIN||14), TOPN=+(process.env.TOPN||3);
const FAIL=process.env.FAIL?+process.env.FAIL:null;
const files=process.argv.slice(2);
if(!files.length){ console.error('edgefind: give it at least one png'); process.exit(2); }

/* ONE ffmpeg CALL PER FRAME, and the same recipe pxdiff already uses - raw gray straight out, no
   new dependency and no intermediate file. The dimensions come back from the same invocation's
   stderr rather than being assumed, because a 320x180 vantage is in this set and a hardcoded 960
   would silently read it as garbage. */
function readRGB(f){
  const probe=execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height `+
    `-of csv=p=0 "${f}"`).toString().trim().split(',').map(Number);
  const [w,h]=probe;
  const buf=execSync(`ffmpeg -i "${f}" -f rawvideo -pix_fmt rgb24 - 2>/dev/null`,
    {maxBuffer:1<<28});
  if(buf.length<w*h*3) throw new Error('edgefind: short read on '+f+' ('+buf.length+' for '+w+'x'+h+')');
  return {w,h,px:buf};
}

/* THE TWO SCANS. `across` is the axis averaged over; `along` is the axis stepped through. Written
   once and called twice with the axes swapped, so the row and column passes cannot drift apart. */
function profile(img,box,byRow){
  const {w,px}=img, {x0,x1,y0,y1}=box;
  const n=byRow?(y1-y0):(x1-x0), m=byRow?(x1-x0):(y1-y0);
  const L=new Float64Array(n), C=new Float64Array(n), G=new Float64Array(n);
  for(let i=0;i<n;i++){
    let sl=0, sc=0, sg=0, prev=null;
    for(let j=0;j<m;j++){
      const x=byRow?(x0+j):(x0+i), y=byRow?(y0+i):(y0+j);
      const k=(y*w+x)*3, r=px[k], g=px[k+1], b=px[k+2];
      const v=0.2126*r+0.7152*g+0.0722*b;
      sl+=v; sc+=Math.max(r,g,b)-Math.min(r,g,b);
      if(prev!==null)sg+=Math.abs(v-prev); prev=v;
    }
    L[i]=sl/m; C[i]=sc/m; G[i]=sg/Math.max(1,m-1);
  }
  return {L,C,G,n};
}
/* THE STEP AT EACH POSITION: the difference between the mean of the WIN slots after it and the WIN
   slots before it. A window rather than a neighbouring pair, because single-row noise on a 960 px
   frame is comparable to a real soft transition and a pairwise difference is all noise. */
function steps(arr,n){
  const s=new Float64Array(n); 
  for(let i=WIN;i<n-WIN;i++){
    let a=0,b=0;
    for(let k=0;k<WIN;k++){ a+=arr[i-1-k]; b+=arr[i+k]; }
    s[i]=Math.abs(b/WIN-a/WIN);
  }
  return s;
}
/* HALF AN 8-BIT LEVEL. The perceptual bottom of the scale, and the reason the ratio is bounded. */
const FLOOR=0.5;
const median=a=>{ const v=a.slice().sort((p,q)=>p-q); return v.length?v[v.length>>1]:0; };
/* THE TYPICAL STEP ELSEWHERE: everything outside 3*WIN of the peak, floored. */
function elsewhereMedian(s,n,peak){
  const rest=[]; for(let i=WIN;i<n-WIN;i++) if(Math.abs(i-peak)>3*WIN) rest.push(s[i]);
  return Math.max(FLOOR, rest.length?median(rest):0);
}

function scan(img,box,byRow,label){
  const {L,C,G,n}=profile(img,box,byRow);
  const out=[];
  if(n<=2*WIN+2) return out;                 // too small to step through: report nothing, not junk
  for(const [ch,arr] of [['L',L],['C',C],['G',G]]){
    const s=steps(arr,n);
    const idx=Array.from(s.keys()).filter(i=>i>=WIN&&i<n-WIN).sort((a,b)=>s[b]-s[a]);
    /* PEAKS ARE SEPARATED BY AT LEAST ONE WINDOW, or the top three are three slots of one line. */
    const peaks=[];
    for(const i of idx){ if(peaks.every(p=>Math.abs(p-i)>WIN))peaks.push(i); if(peaks.length>=TOPN)break; }
    for(const p of peaks){
      const denom=elsewhereMedian(s,n,p);
      out.push({axis:label,ch,at:(byRow?box.y0:box.x0)+p, step:s[p], find:s[p]/denom});
    }
  }
  return out;
}

let worst=0, bad=0;
for(const f of files){
  const img=readRGB(f);
  /* THE DEFAULT BOX EXCLUDES THE HUD STRIPS AND THE SKY. The chaos plate at the top and the
     to-do/KEA plates at the bottom are hard-edged UI and would be the loudest "edge" in every
     frame; the sky is a smooth gradient with no ground in it. Both are overridable. */
  const box={
    x0:+(process.env.X0||Math.round(img.w*0.02)),
    x1:+(process.env.X1||Math.round(img.w*0.98)),
    y0:+(process.env.Y0||Math.round(img.h*0.30)),
    y1:+(process.env.Y1||Math.round(img.h*0.94)),
  };
  const rows=scan(img,box,true,'row'), cols=scan(img,box,false,'col');
  const all=rows.concat(cols).sort((a,b)=>b.find-a.find);
  console.log(`${f.split('/').pop().padEnd(38)} ${img.w}x${img.h}  box y${box.y0}-${box.y1} x${box.x0}-${box.x1}`);
  /* A FRAME WITH NOTHING IN IT MUST PRINT "nothing", NOT THROW. The first cut indexed all[0]
     unconditionally and died on a perfectly flat test frame — a law-14 fuse in the instrument
     itself, found by its own selftest on the first run. An instrument that cannot survive its
     easiest input is not one you can quote. */
  if(!all.length){ console.log('   no step measurable in this box'); continue; }
  for(const r of all.slice(0,TOPN))
    console.log(`   ${r.axis} ${r.ch}  at ${String(r.at).padStart(4)}   step ${r.step.toFixed(2).padStart(7)}`+
                `   FINDABILITY ${r.find.toFixed(2).padStart(6)}`);
  const top=all[0];
  if(top.find>worst)worst=top.find;
  if(FAIL!==null&&top.find>FAIL)bad++;
}
console.log(`EDGEFIND: ${files.length} frame(s), worst findability ${worst.toFixed(2)}`+
  (FAIL!==null?`, threshold ${FAIL}, ${bad} over`:''));
if(FAIL!==null&&bad)process.exitCode=1;
