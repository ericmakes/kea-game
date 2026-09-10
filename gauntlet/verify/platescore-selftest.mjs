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
         measureAll, plateBand, PROPS, NORMW,
         cloudMask, blobs, cloudForm, undersideShading, skyGradient, aerialPersp, skyColour,
         skyMeasureAll, skyPlateBand, sunDisc, SKYPROPS, SKYCONTEXT, CLOUDSAT,
         CLOUDFLOOR, CLOUDCEIL, cloudFlat, boxBlur, FLATSCALE,
         SKYFORMPROPS } from './platescore.mjs';
import { BANDS, PLATESKY, SKYBANDS, SKYPLATES, BOWSKY, SKYFORM } from './stripcam.mjs';

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
/* px is private to platescore.mjs; the selftest reads pixels the same way rather than widening
   the module's surface for a test. */
const px=(im,x,y)=>{const i=(y*im.w+x)*3;return [im.buf[i],im.buf[i+1],im.buf[i+2]];};

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

/* ======================================================================================
   THE SKY — SKY.md step 1. Same treatment: synthetic images with known answers, a case per
   property, both controls, and a regression test for every fault this instrument made while
   it was being built. Three of the five recurring shapes turned up again inside an hour.
   ====================================================================================== */
console.log('  --- sky ---');
const blue=(l)=>[Math.round(l*0.62),Math.round(l*0.78),Math.round(l*1.0)];  // sat = 0.38

/* ---- S1. THE CLOUD MASK IS ABSOLUTE, AND IT DOES NOT SPLIT A GRADIENT ---- */
{
  /* half neutral, half saturated: cover is exactly a half, by construction. */
  const half=synth(200,100,(x)=>x<100?grey(200):blue(200));
  const cm=cloudMask(half,null);
  ok(cm.mask&&Math.abs(cm.cover-0.5)<0.01,
     'cloud mask on half grey / half blue: cover '+(cm.cover*100).toFixed(1)+'% — a half is a half');
  ok(cm.mask&&cm.mask[50*200+10]===1&&cm.mask[50*200+150]===0,
     'the mask claims the NEUTRAL half and not the blue one — cloud is defined by neutrality, '+
     'not by brightness');

  /* THE REGRESSION TEST FOR THE OTSU BUG, and it is the whole reason this mask is absolute. A
     pure blue vertical gradient with no cloud in it anywhere: Otsu reported 64% cover on exactly
     this shape of picture (nz_tussock_03) with a separability of 0.729, because a gradient splits
     into its top half and its bottom half beautifully. The answer must be NO CLOUD. */
  const grad=synth(200,200,(x,y)=>blue(90+y*0.7));
  const cg=cloudMask(grad,null);
  ok(cg.mask===null&&/no cloud/.test(cg.note||''),
     'a pure blue gradient reports NO CLOUD ('+(cg.cover*100).toFixed(1)+'% neutral) — the '+
     'threshold cannot split a gradient into halves and call one of them cumulus');

  /* both degenerate directions refuse, and say which. */
  const clear=cloudMask(synth(100,100,()=>blue(180)),null);
  ok(clear.mask===null&&/no cloud/.test(clear.note||''),
     'a cloudless sky refuses the cloud properties rather than reporting a shape for 0% of a mask');
  const soup=cloudMask(synth(100,100,()=>grey(180)),null);
  ok(soup.mask===null&&/wall-to-wall/.test(soup.note||''),
     'a wall-to-wall overcast refuses them too — no cloud EDGE in frame means nothing to measure');
  ok(CLOUDFLOOR>0&&CLOUDCEIL<1&&CLOUDSAT>0.05&&CLOUDSAT<0.5,
     'the mask\'s three constants are stated and named (sat<'+CLOUDSAT+', cover in '+
     CLOUDFLOOR+'..'+CLOUDCEIL+') rather than buried as literals');
}

/* ---- S2. BLOBS: THE COUNT, THE AREA AND THE PERIMETER ARE ARITHMETIC ---- */
{
  /* two 20x20 squares, well separated. A solid WxH square has area W*H and a 4-connected
     boundary of 2(W+H)-4 pixels. */
  const two=synth(200,100,(x,y)=>{
    const in1=x>=10&&x<30&&y>=10&&y<30, in2=x>=150&&x<170&&y>=60&&y<80;
    return (in1||in2)?grey(220):blue(200); });
  const cm=cloudMask(two,null); const bs=blobs(two,cm.mask,0);
  ok(bs.length===2,'two separated squares give two blobs, not one and not three (got '+bs.length+')');
  ok(bs.every(b=>b.area===400),'each blob\'s area is 400 px, which is what a 20x20 square has');
  ok(bs.every(b=>b.per===2*(20+20)-4),
     'each blob\'s perimeter is '+(2*(20+20)-4)+' px, which is what a 20x20 square\'s '+
     '4-connected boundary has (got '+bs.map(b=>b.per).join(', ')+')');
  /* THE SIZE FLOOR IS NOT TIDYING UP. A single-pixel speck has a perimeter-to-area ratio nothing
     real can match, and JPEG chroma noise makes hundreds of them near any threshold. */
  /* The square is 30x30 rather than 20x20 so the frame clears CLOUDFLOOR — a 20x20 blob in a
     200x100 frame is 2% of it, and the mask rightly refuses to call 2% a cloud. */
  const speck=synth(200,100,(x,y)=>((x===5&&y===5)||(x>=100&&x<130&&y>=35&&y<65))?grey(220):blue(200));
  const cs=cloudMask(speck,null);
  ok(cs.mask!==null,'a 30x30 blob in a 200x100 frame is '+(cs.cover*100).toFixed(1)+
     '% cover and clears the floor');
  ok(blobs(speck,cs.mask).length===1&&blobs(speck,cs.mask,0).length===2,
     'the size floor drops a one-pixel speck and keeps a 30x30 square — without it the shape term '+
     'would be measuring compression noise');
}

/* ---- S3. CLOUD FORM: SHAPE AND VERTICAL EXTENT ---- */
{
  const sq=synth(400,100,(x,y)=>(x>=100&&x<140&&y>=30&&y<70)?grey(220):blue(200));
  const cm=cloudMask(sq,null); const cf=cloudForm(sq,cm);
  const want=(2*(40+40)-4)/Math.sqrt(1600);
  ok(Math.abs(cf.shape-want)<0.01,
     'cloud shape on a 40x40 square is '+cf.shape.toFixed(3)+', and perimeter/sqrt(area) for that '+
     'square is '+want.toFixed(3));
  ok(Math.abs(cf.vext-40/100)<0.01,
     'vertical extent is '+cf.vext.toFixed(3)+' — a 40 px blob in a 100 px band is 0.40 of it');
  /* THE SHAPE TERM MUST NOTICE A RAGGED EDGE, which is the whole point of it: a comb with the same
     area and the same bounding box has far more perimeter than a rectangle. */
  const comb=synth(400,100,(x,y)=>{
    const body=x>=100&&x<140&&y>=30&&y<50;
    const teeth=x>=100&&x<140&&y>=50&&y<70&&((x-100)%4<2);
    return (body||teeth)?grey(220):blue(200); });
  const cc=cloudForm(comb,cloudMask(comb,null));
  ok(cc.shape>cf.shape*1.4,
     'a combed edge scores '+cc.shape.toFixed(2)+' against the rectangle\'s '+cf.shape.toFixed(2)+
     ' — the shape term is about the BOUNDARY, which is what "hard-edged, noise-broken" means');
}

/* ---- S4. UNDERSIDE SHADING IS SIGNED, AND THE SIGN IS THE POINT ---- */
{
  const lit=synth(300,120,(x,y)=>{
    if(!(x>=100&&x<200&&y>=30&&y<90))return blue(200);
    return grey(y<50?230:(y<70?190:150)); });      // bright top, dark belly
  const cm=cloudMask(lit,null); const L=lumPlane(lit);
  const us=undersideShading(lit,L,cm);
  ok(us.value>0.15,'a bright-topped, dark-bellied blob scores +'+us.value.toFixed(3)+
     ' — positive means the top is lighter than the belly, which is what a lit cumulus does');
  const flip=synth(300,120,(x,y)=>{
    if(!(x>=100&&x<200&&y>=30&&y<90))return blue(200);
    return grey(y<50?150:(y<70?190:230)); });
  const uf=undersideShading(flip,lumPlane(flip),cloudMask(flip,null));
  ok(uf.value<-0.15,'turning it upside down scores '+uf.value.toFixed(3)+
     ' — the metric cannot be fooled by magnitude alone');
  const flat=synth(300,120,(x,y)=>(x>=100&&x<200&&y>=30&&y<90)?grey(210):blue(200));
  ok(Math.abs(undersideShading(flat,lumPlane(flat),cloudMask(flat,null)).value)<0.01,
     'a flat white blob scores ~0 — no shading is not "some shading"');
}

/* ---- S5. THE GRADIENT: ABSOLUTES, THE EXPOSURE-FREE RATIO, AND THE BANDING STEP ---- */
{
  /* a linear luma ramp in a saturated blue, 200 rows: row 0 (top) is darkest. */
  const ramp=synth(300,200,(x,y)=>blue(110+y*0.5));
  const g=skyGradient(ramp,lumPlane(ramp),null,cloudMask(ramp,null));
  ok(g.topLuma!==null&&g.horizLuma>g.topLuma,
     'on a ramp that brightens downward, the horizon end ('+g.horizLuma.toFixed(3)+
     ') is brighter than the zenith end ('+g.topLuma.toFixed(3)+')');
  /* THE RATIO IS EXPOSURE-FREE, and this is the check that says so rather than the comment. The
     same ramp at 70% exposure must give the SAME ratio and a different absolute. */
  const dim=synth(300,200,(x,y)=>blue((110+y*0.5)*0.7));
  const gd=skyGradient(dim,lumPlane(dim),null,cloudMask(dim,null));
  ok(Math.abs(gd.lumaRatio-g.lumaRatio)<0.01 && Math.abs(gd.topLuma-g.topLuma)>0.05,
     'the same sky at 70% exposure keeps its ratio ('+gd.lumaRatio.toFixed(3)+' vs '+
     g.lumaRatio.toFixed(3)+') and loses its absolute ('+gd.topLuma.toFixed(3)+' vs '+
     g.topLuma.toFixed(3)+') — which is exactly why the ratio is the judged row');
  ok(Math.abs(g.satRatio-1)<0.02,
     'a ramp of constant saturation has a saturation ratio of '+g.satRatio.toFixed(3)+', i.e. 1');
  ok(g.maxStep!==null&&g.maxStep<=1,
     'a smooth ramp\'s largest single-row 8-bit step is '+g.maxStep+' level');

  /* CONTOURING: the same ramp quantised to steps of 8 levels must be caught. */
  const step=synth(300,200,(x,y)=>blue(110+Math.floor(y/16)*8));
  const gs=skyGradient(step,lumPlane(step),null,cloudMask(step,null));
  ok(gs.maxStep>=4,'a ramp quantised into 8-level plateaux reports a step of '+gs.maxStep+
     ' — contouring is a visible jump after a flat run, and that is what this measures');

  /* THE ROW FLOOR: a row carrying a sliver of sky must not set the banding number. This is the
     regression test for a real 15-level "step" reported in a photograph. */
  const sliver=synth(400,200,(x,y)=>{
    const open = (y%2===0) ? (x<400) : (x<8);          // odd rows hold 2% of the width
    if(!open) return grey(215);                        // cloud
    return blue(y%2===0 ? 150 : 250);                  // and the sliver is a wildly different blue
  });
  const gv=skyGradient(sliver,lumPlane(sliver),null,cloudMask(sliver,null));
  ok(gv.maxStep===null||gv.maxStep<=2,
     'a row holding 2% of the width cannot set the banding step (got '+gv.maxStep+
     ') — a median taken from thirty pixels is noise, not a picture');

  /* AND maxStep IS REFUSED UNDER HEAVY CLOUD, because there is no vertical slice of sky to look
     for a step in. nz_carpark_01, at 76% cover, reported a 15-level step before this landed. */
  const heavy=synth(300,200,(x,y)=>x<250?grey(215):blue(110+y*0.5));
  const gh=skyGradient(heavy,lumPlane(heavy),null,cloudMask(heavy,null));
  ok(gh.maxStep===null,'at '+(cloudMask(heavy,null).cover*100).toFixed(0)+
     '% cloud cover the banding step is refused rather than estimated');
}

/* ---- S6. AERIAL PERSPECTIVE, AND THE SIGN CONVENTION ---- */
{
  /* saturation falls toward the bottom of the frame — a sky paling into its horizon. */
  const pale=synth(300,200,(x,y)=>{ const l=200, s=0.45*(1-y/200)+0.05;
    return [Math.round(l*(1-s)),Math.round(l*(1-s*0.4)),l]; });
  const ap=aerialPersp(pale,lumPlane(pale),null,cloudMask(pale,null));
  ok(ap.value>0.1,'a sky that pales downward scores +'+ap.value.toFixed(3)+
     ' — positive is the direction all three plates go');
  const even=synth(300,200,()=>blue(200));
  ok(Math.abs(aerialPersp(even,lumPlane(even),null,cloudMask(even,null)).value)<0.01,
     'a flat sky scores ~0 — no aerial perspective is not "some"');
}

/* ---- S7. THE BAND MACHINERY: FIXED HUE TOLERANCE AND THE SIGNED-PROPERTY FLOOR ---- */
{
  const im=bandNorm(path.join(BOARD,'nz_alps_01.jpg'),SKYBANDS.nz_alps_01[0],
                    SKYBANDS.nz_alps_01[1],NORMW);
  const pb=skyPlateBand(im,SKYPLATES.nz_alps_01.test);
  const hb=pb.band.skyHue;
  ok(hb&&hb.fixed&&Math.abs((hb.hi-hb.lo)-50)<0.01,
     'the hue band is a FIXED 25 degrees either side of the plate ('+hb.lo.toFixed(0)+'..'+
     hb.hi.toFixed(0)+'), not the tile spread — the terrain pass learned that one expensively, '+
     'where a 199-degree band called a yellow-tan the same colour as slate');
  /* THE FLOOR ON A SIGNED PROPERTY. underside is near zero on a cloudless plate, and +/-18% of
     near-zero is a band that fails everything. */
  const src=fs.readFileSync(path.join(ROOT,'gauntlet/verify/platescore.mjs'),'utf8');
  ok(/FLOOR=\{underside:0\.01, maxStep:0\.5\}/.test(src),
     'the signed properties carry an absolute band floor as well as a relative one, so a plate '+
     'whose value is near zero cannot hand out a band of +/-0.002');
  /* THE BANDS ARE NOT DERIVED FROM THE GAME. Same check as the terrain half, on the sky path. */
  /* TWO CALL SITES NOW — the sky plates and the form plate — and the property being asserted is
     not the COUNT but that every one of them is handed a PLATE. A third call site would be fine;
     a call on our own frame would not, because a band derived from our own output is a band we
     pass by construction. */
  const sites=[...src.matchAll(/(?<!function\s)skyPlateBand\(([^)]*)\)/g)].map(m=>m[1]);
  ok(sites.length===2,'skyPlateBand has '+sites.length+' call sites in the scorer');
  ok(sites.every(a=>/^(im|formIm)\s*,/.test(a)),
     'and every one of them is handed a PLATE image ('+sites.map(a=>a.split(',')[0].trim())
     .join(', ')+') — our own sky cannot widen a target it is judged against');
}

/* ---- S8. BOTH CONTROLS, ON THE REAL PLATES ---- */
{
  const names=Object.keys(SKYBANDS);
  const pb={}; for(const n of names)
    pb[n]=skyPlateBand(bandNorm(path.join(BOARD,n+'.jpg'),SKYBANDS[n][0],SKYBANDS[n][1],NORMW),
                       SKYPLATES[n].test||null);
  /* POSITIVE CONTROL: every plate is in its own band on every property it carries. If a plate
     falls outside a band derived from its own four tiles, the band is arithmetically wrong. */
  for(const n of names){
    let out=[]; let jud=0;
    for(const k of SKYPROPS){ const b=pb[n].band[k], v=pb[n].whole[k];
      if(!b||v===null||v===undefined||!isFinite(v))continue; jud++;
      if(v<b.lo||v>b.hi)out.push(k); }
    ok(out.length===0,n+' is inside its own band on all '+jud+' properties it carries'+
       (out.length?' — except '+out.join(', '):''));
  }
  /* NEGATIVE CONTROL: the plates must not all agree, or the instrument is measuring nothing.
     nz_alps_01 is a saturated deep blue that barely pales; nz_carpark_01 is a cumulus bank over a
     hazy basin. They should part company. */
  let differ=[], jud=0;
  for(const k of SKYPROPS){
    const b=pb.nz_carpark_01.band[k], v=pb.nz_alps_01.whole[k];
    if(!b||v===null||v===undefined||!isFinite(v))continue; jud++;
    if(v<b.lo||v>b.hi)differ.push(k); }
  ok(differ.length>=1,'nz_alps_01 falls OUT of nz_carpark_01\'s band on '+differ.length+' of '+
     jud+' shared properties ('+differ.join(', ')+') — two different skies measure differently');
  /* AND THE PLATES THAT CANNOT SPEAK SAY SO. Only carpark_01 has cloud in its sky crop; the other
     two must report the three cloud properties as absent rather than as a number. */
  for(const n of ['nz_tussock_03','nz_alps_01'])
    ok(['cloudShape','underside'].every(k=>pb[n].band[k]===null),
       n+' carries no cloud in its sky crop and offers no band for the three cloud properties — '+
       'an absent reference is stated, not averaged in');
  ok(['cloudShape','underside'].every(k=>pb.nz_carpark_01.band[k]!==null),
     'nz_carpark_01 does carry cloud, and is the plate the two cloud properties are judged '+
     'against');
  /* AND THE WITHDRAWAL IS ASSERTED, not just explained: cloudVext must not be in the judged set,
     because on the only plate that carries cloud it is a measurement of cover. */
  ok(!SKYPROPS.includes('cloudVext')&&SKYCONTEXT.includes('cloudVext'),
     'cloud vertical extent is reported and NOT judged — the one plate with cloud has a bank '+
     'larger than its own crop, so its extent is 1.0 whatever shape the clouds are');
  ok(Math.abs(pb.nz_carpark_01.whole.cloudVext-1)<0.02,
     'and that is checked rather than asserted from memory: nz_carpark_01\'s bank measures '+
     pb.nz_carpark_01.whole.cloudVext.toFixed(3)+' of its own sky crop');
}

/* ---- S9. THE PLATE CHOICE ITSELF IS CHECKED, NOT REMEMBERED ---- */
{
  /* SKY.md names ref_bow_00, _04 and _06 as the sky references and they contain no sky. That
     substitution is now load-bearing — the whole sky band comes off three different plates — so
     the evidence for it is asserted here rather than left in a comment for someone to trust.
     Smoothness over the top 22% of the frame: sky is smooth, a eucalypt canopy is not. */
  const smooth=(n)=>{
    const im=bandNorm(path.join(BOARD,n+'.jpg'),0,0.22,720);
    const L=lumPlane(im); const {w,h}=im; let sm=0,tot=0;
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const g=(a,b)=>L[a]-L[b];
      const gx=g((y-1)*w+x+1,(y-1)*w+x-1)+2*g(y*w+x+1,y*w+x-1)+g((y+1)*w+x+1,(y+1)*w+x-1);
      const gy=g((y+1)*w+x-1,(y-1)*w+x-1)+2*g((y+1)*w+x,(y-1)*w+x)+g((y+1)*w+x+1,(y-1)*w+x+1);
      tot++; if(Math.hypot(gx,gy)/4<0.015)sm++; }
    return sm/tot; };
  for(const n of ['ref_bow_00','ref_bow_04','ref_bow_06']){
    const f=smooth(n);
    ok(f<0.30,n+' is '+(f*100).toFixed(1)+'% smooth over its top 22% — SKY.md names it as a sky '+
       'reference and it is canopy and roofline. This is why the sky plates were substituted');
  }
  for(const n of Object.keys(SKYBANDS)){
    const f=smooth(n);
    ok(f>0.55,n+' is '+(f*100).toFixed(1)+'% smooth over its top 22% — it is a sky, which is the '+
       'qualification for being in this set');
  }
  /* AND THE CROPS ARE PURE, which is the claim SKYBANDS makes about the two plates it gives no
     mask. Per column, the topmost row that is definitely not sky must lie BELOW the band. */
  for(const n of ['nz_carpark_01','nz_tussock_03']){
    const im=bandNorm(path.join(BOARD,n+'.jpg'),0,1,720);
    const {w,h}=im; let worst=1;
    for(let x=0;x<w;x++){ let y=0;
      for(;y<h;y++){ const p=px(im,x,y);
        const L=(0.2126*p[0]+0.7152*p[1]+0.0722*p[2])/255;
        if(p[1]-Math.max(p[0],p[2])>8||L<0.25)break; }
      if(y/h<worst)worst=y/h; }
    ok(worst>SKYBANDS[n][1],n+'\'s crop is pure sky: the nearest non-sky pixel in ANY column is '+
       'at '+worst.toFixed(3)+' and the band ends at '+SKYBANDS[n][1]+
       ', so it needs no per-pixel mask and is given none');
  }
  ok(SKYPLATES.nz_carpark_01.test===null&&SKYPLATES.nz_tussock_03.test===null&&
     typeof SKYPLATES.nz_alps_01.test==='function',
     'and the two pure crops carry no mask while alps_01 — whose highest peak reaches 0.099 — '+
     'carries the one PLATESKY already states for it');
}

/* ---- S10. THE SUN DISC READS AN EMPTY FRAME AS EMPTY ---- */
{
  const dark=path.join(TMP,'sun_dark.png');
  execSync('ffmpeg -v error -y -f lavfi -i color=c=0x203040:s=320x160 -frames:v 1 "'+dark+'"');
  ok(sunDisc(dark).found===false,
     'a frame with no bright pixel in it reports NO DISC rather than a centroid of nothing — the '+
     'first version of the terrain sky detector photographed a black frame and measured it');
  const spot=path.join(TMP,'sun_spot.png');
  /* format=rgb24 BEFORE drawbox, or the white is not white. lavfi's color source is YUV, and a
     box drawn as white@1 on it comes back out of the PNG at 253 — so the fixture for a clipping
     test was not clipped, and the check that caught it was right to. */
  execSync('ffmpeg -v error -y -f lavfi -i color=c=0x203040:s=320x160 -vf '+
    '"format=rgb24,drawbox=x=150:y=70:w=20:h=20:color=white@1:t=fill" -frames:v 1 "'+spot+'"');
  const sd=sunDisc(spot);
  ok(sd.found&&Math.abs(sd.cx-160)<3&&Math.abs(sd.cy-80)<3,
     'a 20x20 white box at (150,70) is found centred at ('+sd.cx.toFixed(1)+', '+sd.cy.toFixed(1)+
     '), which is its middle');
  ok(sd.clipped>0.9,'and it is reported as '+(sd.clipped*100).toFixed(0)+
     '% clipped to white, which a solid white box is');
}

/* ---- S11. FLATNESS: LAYERED DECK AGAINST A HEAP OF BALLS ---- */
{
  /* HORIZONTAL BANDS — a layered deck. Gradients cross the bands (vertical) and run along them
     (horizontal), so the ratio must be well above 1. Bands 40 px tall, which is the scale the
     property is measured at. */
  /* EVERY FIXTURE VARIES ON BOTH AXES, and two earlier versions did not. A pure sin(y) image has
     EXACTLY zero horizontal gradient, so the ratio divides by nothing: the vertical-band case came
     out 0.00 and the fine-band case 12,084,033. Adding per-pixel noise did not fix it either — a
     16 px box blur removes almost all of it, so the weak axis went back to the floor and the
     horizontal-band case read 6064. What a real cloud field HAS, and what these fixtures need, is
     LARGE-SCALE variation along both axes: a deck's bands undulate and brighten along their length.
     The slow sin(x) term below is that, at a scale the blur keeps. Deterministic, so the numbers
     are stable, and the metric is left alone — it is unbounded only on a perfectly one-dimensional
     field, which no photograph is. */
  const along=x=>Math.round(Math.sin(x/90*Math.PI)*12);
  const bands=synth(600,400,(x,y)=>grey(150+Math.round(Math.sin(y/40*Math.PI)*45)+along(x)));
  const fb=cloudFlat(bands,lumPlane(bands),null,null);
  ok(fb.value>2.5,'horizontal bands score '+fb.value.toFixed(2)+' — a layered deck has strong '+
     'gradients crossing it and weak ones along it');
  /* VERTICAL BANDS — the same structure turned 90 degrees must score BELOW 1, or the metric is
     measuring contrast rather than direction. */
  const vert=synth(600,400,(x,y)=>grey(150+Math.round(Math.sin(x/40*Math.PI)*45)+along(y)));
  const fv=cloudFlat(vert,lumPlane(vert),null,null);
  ok(fv.value<0.4,'the same bands turned 90 degrees score '+fv.value.toFixed(2)+
     ' — the metric is about DIRECTION, not about how much contrast there is');
  /* A DIAGONAL PATTERN IS THE THIRD DIRECTION AND IT MUST LAND NEAR 1, which is a stronger check
     than reciprocity: it says the metric is measuring the axis a structure prefers rather than
     merely reacting to contrast. (Reciprocity was tried and is not a fair test — a 1-D fixture's
     weak axis is noise-floored, so the product is not 1 and never could be.) */
  const diag=synth(600,400,(x,y)=>grey(150+Math.round(Math.sin((x+y)/56*Math.PI)*45)));
  const fd=cloudFlat(diag,lumPlane(diag),null,null);
  ok(fd.value>0.7&&fd.value<1.4,'the same bands at 45 degrees score '+fd.value.toFixed(2)+
     ' — near 1, because a diagonal prefers neither axis');
  /* ROUND BLOBS — isotropic by construction, which is what a union of spheres is. */
  const balls=synth(600,400,(x,y)=>{
    let v=120;
    for(const [cx,cy,r] of [[140,150,70],[300,190,90],[460,140,75],[220,280,60],[400,300,65]]){
      const d=Math.hypot(x-cx,y-cy); if(d<r)v=Math.max(v,215-d/r*40); }
    return grey(v); });
  const fr=cloudFlat(balls,lumPlane(balls),null,null);
  ok(fr.value>0.75&&fr.value<1.35,'round blobs score '+fr.value.toFixed(2)+
     ' — near 1, because a ball has no preferred direction. THIS is what the game measures like');
  ok(fb.value>fr.value*2,'and a deck is more than twice a heap of balls ('+fb.value.toFixed(2)+
     ' against '+fr.value.toFixed(2)+'), which is the whole discrimination the property exists for');

  /* THE SCALE IS LOAD-BEARING. Bands 3 px tall are layered structure the eye cannot see and the
     16 px blur must wash away — otherwise the property would reward fine dithering. */
  const fine=synth(600,400,(x,y)=>grey(150+Math.round(Math.sin(y/3*Math.PI)*45)+along(x)));
  const ff=cloudFlat(fine,lumPlane(fine),null,null);
  ok(ff.value<1.6,'3 px bands score '+ff.value.toFixed(2)+' — the '+FLATSCALE+
     ' px blur washes out structure finer than the layering this property is about, so it cannot '+
     'be satisfied by dither');
  /* AND THE BLUR IS A BLUR: mean-preserving, and it really does remove fine detail. */
  { const L=lumPlane(fine), B=boxBlur(L,600,400,FLATSCALE);
    const mean=a=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i];return s/a.length;};
    ok(Math.abs(mean(L)-mean(B))<0.02,'boxBlur preserves the mean ('+mean(L).toFixed(3)+' vs '+
       mean(B).toFixed(3)+')');
    let vL=0,vB=0; const mL=mean(L),mB=mean(B);
    for(let i=0;i<L.length;i++){vL+=(L[i]-mL)**2;vB+=(B[i]-mB)**2;}
    ok(vB<vL*0.25,'and removes most of the variance of a 3 px pattern ('+
       (vB/vL*100).toFixed(1)+'% left), which is what makes the scale choice meaningful'); }

  /* IT REFUSES A REGION TOO SMALL TO SAY ANYTHING. A 33 px neighbourhood needs room. */
  const tiny=synth(60,40,()=>grey(180));
  ok(cloudFlat(tiny,lumPlane(tiny),null,null).value===null,
     'a region with no room for a '+FLATSCALE+' px neighbourhood is refused rather than estimated');
}

/* ---- S12. THE FORM PLATE, AND WHY IT BANDS ALONE ---- */
{
  const im=bandNorm(path.join(BOARD,SKYFORM.plate+'.jpg'),SKYFORM.band[0],SKYFORM.band[1],NORMW);
  const pb=skyPlateBand(im,null);
  const b=pb.band.cloudFlat, v=pb.whole.cloudFlat;
  ok(b&&v>=b.lo&&v<=b.hi,SKYFORM.plate+' is inside its own flatness band ('+v.toFixed(3)+
     ' in ['+b.lo.toFixed(3)+' … '+b.hi.toFixed(3)+'])');
  ok(v>2.2,'and it really is a layered deck: '+v.toFixed(3)+
     ' against 1.0 for anything without a preferred direction');
  /* THE NEGATIVE CONTROL IS THE OTHER CLOUD PLATE, and it is the reason this property bands from
     one plate only. nz_carpark_01 has plenty of cloud and it is a DIFFERENT FORM — towering
     cumulus. If its band were offered alongside, "in band if either plate" would hand a sky of
     spheres a pass on the plate whose form nobody asked for. */
  const cim=bandNorm(path.join(BOARD,'nz_carpark_01.jpg'),
                     SKYBANDS.nz_carpark_01[0],SKYBANDS.nz_carpark_01[1],NORMW);
  const cpb=skyPlateBand(cim,null);
  const cv=cpb.whole.cloudFlat;
  ok(cv!==null&&(cv<b.lo||cv>b.hi),
     'nz_carpark_01 — towering cumulus — measures '+cv.toFixed(3)+' and falls OUTSIDE the deck\'s '+
     'band, so the two forms are distinguishable and the band cannot be passed by the wrong one');
  ok(SKYFORMPROPS.length===1&&SKYFORMPROPS[0]==='cloudFlat',
     'and flatness is the only property banded this way, named in SKYFORMPROPS');
  /* THE FORM PLATE IS NOT IN THE SKY SET, which is what keeps its overcast luma out of the tone
     rows while letting its FORM govern here. */
  ok(!Object.keys(SKYBANDS).includes(SKYFORM.plate),
     SKYFORM.plate+' is deliberately NOT in the scored sky set — overcast, so its luma would hand '+
     'a blue sky a band it can only reach by turning white');
}

console.log(bad?('PLATESCORE SELFTEST: '+bad+' FINDINGS'):'PLATESCORE SELFTEST: ALL PASS');
process.exit(bad?1:0);
