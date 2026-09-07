/* PLATESCORE SELFTEST — does the scorer measure what it says it measures?
   Usage: node gauntlet/verify/platescore-selftest.mjs

   A scorer is about to drive six iterations of terrain work, so it gets the same treatment every
   other instrument in this session got: synthetic images whose properties are known by
   construction, and controls in BOTH directions. Roughly a third of the faults this session found
   were in the assertions rather than in the code, and the five recurring shapes were: a threshold
   derived from the constant under test, an absolute threshold a lesser effect already satisfies, a
   literal that agrees with the world, a sampling grid coarser than its target, and a measurement
   taken in the wrong space. Each check below is aimed at one of those. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { execSync } from 'child_process';
import { bandNorm, loadRGB, lumPlane, edgeDensity, ridgeP10, snowPatch, lumaHue, silhouette,
         measureAll, plateBand, PROPS, NORMW } from './platescore.mjs';
import { BANDS, PLATESKY } from './stripcam.mjs';

const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const BOARD=path.join(ROOT,'gauntlet/reference/board');
const TMP='/tmp/psst'; fs.mkdirSync(TMP,{recursive:true});
let bad=0;
const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)bad++; return !!c; };
console.log('PLATESCORE SELFTEST');

/* A synthetic image, built pixel by pixel so its properties are known and not measured off
   something that might already be wrong. */
function synth(w,h,fn){
  const buf=Buffer.alloc(w*h*3);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const c=fn(x,y), i=(y*w+x)*3;
    buf[i]=Math.max(0,Math.min(255,c[0]|0));
    buf[i+1]=Math.max(0,Math.min(255,c[1]|0));
    buf[i+2]=Math.max(0,Math.min(255,c[2]|0));
  }
  return {w,h,buf};
}
const grey=v=>[v,v,v];

/* ---- 1. EDGE DENSITY ---- */
{
  const ramp=synth(400,200,(x)=>grey(40+x*0.5));                 // a smooth gradient: no edges
  const noise=synth(400,200,(x,y)=>grey(((x*7919+y*104729)%251)));// full-scale hash: edges everywhere
  const checks=synth(400,200,(x,y)=>grey((((x>>3)+(y>>3))&1)?40:210));
  const a=edgeDensity(ramp).value, b=edgeDensity(noise).value, c=edgeDensity(checks).value;
  ok(a<0.02,'a smooth ramp has almost no edges ('+a.toFixed(4)+')');
  ok(b>0.9,'a full-scale noise field is almost all edges ('+b.toFixed(4)+')');
  ok(c>0.05&&c<0.5,'an 8 px checkerboard sits between them ('+c.toFixed(4)+
     ') — edges on the cell boundaries only');
  ok(b>a*20,'and the ordering is not marginal: noise is '+(b/Math.max(a,1e-6)).toFixed(0)+
     'x the ramp');
  /* THE SAMPLING GRID IS NOT COARSER THAN ITS TARGET, which was one of this session's recurring
     faults: a 500 mm ray grid walked between 40 mm purlins and found nothing.
     AND THE OPERATOR'S REAL LIMIT IS RECORDED RATHER THAN WISHED AWAY. A Sobel takes a SYMMETRIC
     difference across +/-1 px, so for a one-pixel alternation L[x+1] and L[x-1] have the same
     parity and the gradient is exactly ZERO — it is blind at precisely Nyquist. Measured: a 1 px
     checkerboard scores 0.0000. That is a property of the operator, not a defect, and it is fine
     for this job because rock texture at the strip's scale is several pixels across; but it is
     stated here so nobody later reads a 0 as "no detail" when it may mean "detail too fine to
     see". Two pixels is the finest structure this metric can honestly claim. */
  const fine1=synth(400,200,(x,y)=>grey(((x+y)&1)?40:210));
  const fine2=synth(400,200,(x,y)=>grey((((x>>1)+(y>>1))&1)?40:210));
  ok(edgeDensity(fine1).value<0.01,'it is BLIND to a one-pixel checkerboard ('+
     edgeDensity(fine1).value.toFixed(4)+') — a symmetric +/-1 difference is zero at Nyquist, '+
     'which is recorded rather than asserted away');
  ok(edgeDensity(fine2).value>0.5,'and it sees a TWO-pixel checkerboard ('+
     edgeDensity(fine2).value.toFixed(4)+'), so 2 px is the finest structure it can claim');
}

/* ---- 1b. EDGE DENSITY IS ABOUT STRUCTURE, NOT EXPOSURE ---- */
{
  const mk=g=>synth(400,200,(x,y)=>grey(g*(((x>>3)+(y>>3))&1?0.2:1.0)*255));
  const bright=edgeDensity(mk(1.0)).value, dark=edgeDensity(mk(0.35)).value;
  ok(Math.abs(bright-dark)<0.03,'the SAME pattern at two exposures scores the same ('+
     bright.toFixed(4)+' vs '+dark.toFixed(4)+') — before this was normalised, adding rock texture '+
     'to the range LOWERED its edge density because the change also darkened it');
  /* AND IT MUST NOT REWRITE THE PLANE IT WAS HANDED, or local contrast would be measured on a
     normalised image and silently become a different property. */
  const im=mk(0.35), L=lumPlane(im), before=Array.from(L.slice(0,64));
  edgeDensity(im,L);
  ok(before.every((v,i)=>v===L[i]),'and it does not mutate the luma plane it is given, so '+
     'local contrast is still measured on the real values');
}

/* ---- 2. LOCAL CONTRAST ---- */
{
  /* 15% OF ROWS, NOT 10, and the difference is an off-by-one that mattered: with exactly 10% dark
     the 10th percentile lands ON the boundary, floor(N*0.10) indexes the first BRIGHT pixel, and
     the check read 0.706 on an image that is a tenth black. A fixture has to put the answer
     unambiguously inside the statistic it is testing. */
  const dark=synth(200,200,(x,y)=>grey(y<30?5:180));   // 15% of rows near black
  const flat=synth(200,200,()=>grey(180));
  const p=ridgeP10(dark).value, q=ridgeP10(flat).value;
  ok(p<0.05,'p10 finds a dark tenth ('+p.toFixed(3)+') — the plates read about 0.04');
  ok(q>0.6,'and a flat mid-grey has no dark end ('+q.toFixed(3)+')');
  /* AN ABSOLUTE THRESHOLD A LESSER EFFECT ALREADY SATISFIES: a handful of black pixels must NOT
     move p10, or "local contrast" could be bought with a few dead texels. */
  const few=synth(200,200,(x,y)=>grey((y<2)?5:180));
  ok(ridgeP10(few).value>0.6,'and 1% of black pixels does not move it ('+
     ridgeP10(few).value.toFixed(3)+'), so contrast cannot be faked with a few dark texels');
}

/* ---- 3. SNOW PATCHINESS ---- */
{
  const hard=synth(400,200,(x,y)=>grey((((x>>5)+(y>>5))&1)?230:70));   // hard-edged bright patches
  const soft=synth(400,200,(x,y)=>grey(70+160*(0.5+0.5*Math.sin(x/60))));// the same brightness, ramped
  const h=snowPatch(hard), s=snowPatch(soft);
  ok(h.value!==null&&s.value!==null,'both test images have enough bright area to measure');
  ok(h.value>s.value*3,'HARD-EDGED patches score '+h.value.toFixed(4)+' against a smooth ramp\'s '+
     s.value.toFixed(4)+' — '+(h.value/Math.max(s.value,1e-9)).toFixed(0)+'x, which is the '+
     'distinction Eric asked for (patches, not a gradient)');
  const cap=synth(400,200,(x,y)=>grey(y<60?230:70));                    // one smooth cap
  ok(snowPatch(cap).shape<h.shape/2,'and a single cap is far less broken up than patches '+
     '(perimeter/sqrt(area) '+snowPatch(cap).shape.toFixed(1)+' against '+h.shape.toFixed(1)+')');
  const none=synth(400,200,()=>grey(70));
  ok(snowPatch(none).value===null,'an image with no snow reports ABSENT rather than a number');
}

/* ---- 4. LUMA AND HUE, MEASURED IN THE RIGHT SPACE ---- */
{
  const warm=synth(100,100,()=>[150,110,70]);   // hue ~30, warm rock
  const cool=synth(100,100,()=>[100,120,150]);  // hue ~215, cool distance
  const a=lumaHue(warm), b=lumaHue(cool);
  ok(a.hue>15&&a.hue<45,'a warm brown measures hue '+a.hue.toFixed(0)+' (expected about 30)');
  ok(b.hue>195&&b.hue<235,'a cool blue-grey measures hue '+b.hue.toFixed(0)+
     ' (expected about 215) — the plates sit at 210-212');
  ok(Math.abs(a.luma-(0.2126*150+0.7152*110+0.0722*70)/255)<1e-6,
     'luma is Rec.709 on the ENCODED value, which is the space the plates were photographed in');
}

/* ---- 5. SILHOUETTE ROUGHNESS ---- */
{
  const H=200, W2=400;
  const mk=fn=>synth(W2,H,(x,y)=>y<fn(x)?[100,170,220]:[60,60,60]);
  const smooth=mk(x=>60+30*Math.sin(x/120));
  const jag=mk(x=>60+30*Math.sin(x/120)+((x*7919)%13)-6);
  const flat=mk(()=>60);
  const isSky=p=>p[2]-p[0]>20;
  const a=silhouette(smooth,isSky).value, b=silhouette(jag,isSky).value, c=silhouette(flat,isSky).value;
  ok(c<0.02,'a dead flat skyline is not rough ('+c.toFixed(3)+')');
  ok(a<0.2,'a slow sine is barely rough ('+a.toFixed(3)+') — this is the "broad massif" reading');
  ok(b>a*5,'and a jagged skyline is '+(b/Math.max(a,1e-6)).toFixed(0)+'x rougher ('+
     b.toFixed(3)+'), which is what separates aretes from massifs');
  ok(silhouette(smooth,isSky).coverage>0.95,'the skyline is found in every column');
}

/* ---- 6. THE CONTROLS THAT MATTER: the plates against their own bands, and each other's ---- */
{
  const im={}, pb={};
  for(const n of Object.keys(BANDS)){
    im[n]=bandNorm(path.join(BOARD,n+'.jpg'),BANDS[n][0],BANDS[n][1],NORMW);
    pb[n]=plateBand(im[n],PLATESKY[n].test);
  }
  /* A PLATE MUST SCORE IN BAND AGAINST ITSELF. If it does not, the band is narrower than the
     plate's own variation and every reading taken with it is noise. This is the positive control,
     and without one a scorer on which everything fails would prove nothing. */
  for(const n of Object.keys(BANDS)){
    const w=pb[n].whole; let inb=0, jud=0;
    for(const k of PROPS){ const b=pb[n].band[k]; if(!b||w[k]===null)continue;
      jud++; if(w[k]>=b.lo&&w[k]<=b.hi)inb++; }
    ok(inb===jud,n+' scores in band against ITSELF on all '+jud+' judged properties ('+inb+'/'+jud+
       ') — a band tighter than the plate\'s own variation would measure nothing');
  }
  /* AND THE NEGATIVE CONTROL. The two plates are a close massif under blue sky and a distant snowy
     ridge under overcast; if the scorer cannot tell them apart it cannot tell anything apart. */
  const names=Object.keys(BANDS);
  let differ=0, jud=0; const which=[];
  for(const k of PROPS){
    const b=pb[names[1]].band[k], v=pb[names[0]].whole[k];
    if(!b||v===null)continue; jud++;
    if(v<b.lo||v>b.hi){ differ++; which.push(k); }
  }
  ok(differ>=3,names[0]+' scores OUT of '+names[1]+'\'s band on '+differ+' of '+jud+
     ' properties ('+which.join(', ')+') — the two references really are different pictures, and '+
     'a scorer that called them the same would be measuring nothing');
  /* THE BANDS ARE NOT DERIVED FROM THE GAME. Stated as a check on the code path rather than as
     prose: plateBand is only ever called on a plate, so there is no route by which our own output
     can widen a target it is then judged against. */
  const src=fs.readFileSync(path.join(ROOT,'gauntlet/verify/platescore.mjs'),'utf8');
  /* THE DEFINITION IS NOT A CALL. The first version of this counted every occurrence of the name
     and so counted `export function plateBand(` as one, reporting 2 where there is 1. */
  const calls=[...src.matchAll(/(?<!function\s)plateBand\(/g)].length;
  ok(calls===1&&/plateBand\(im,PLATESKY\[n\]\.test\)/.test(src),
     'plateBand is called exactly once in the scorer, on a PLATE — the target band cannot be '+
     'derived from our own frame');
}

console.log(bad?('PLATESCORE SELFTEST: '+bad+' FINDINGS'):'PLATESCORE SELFTEST: ALL PASS');
process.exit(bad?1:0);
