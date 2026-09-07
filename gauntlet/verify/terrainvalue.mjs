/* STEP 1 — VALUE. Is the range in the plates' band, and is it DARKER than its own sky?
   Usage: node gauntlet/verify/terrainvalue.mjs        env: IDS=<a,b,c>  KEEP=1

   Eric: "the range reads luma 0.79 vs the plates' 0.40-0.45 - pull the fog on the range back until
   rock sits in that band; rock must be DARKER than the sky as in both plates; assert the band at
   the wide vantages."

   THE PLATES, MEASURED at the ridge bands terrainstrip crops to (and this refines the brief):
       nz_alps_01   ridge luma 0.392   rgb  84,102,124   sat 0.32  hue 212    sky luma 0.434
       nz_alps_02   ridge luma 0.503   rgb 123,129,135   sat 0.09  hue 210    sky luma 0.799
   0.40-0.45 is alps_01's number; alps_02's ridge is lighter than the brief says. The band asserted
   here is 0.39-0.50, which is what the two plates actually span — WIDER than Eric asked for, and
   said out loud rather than quietly, because a band tighter than the references it comes from is a
   band that will be fought later for no reason.

   THE RANGE IS MEASURED OVER A MASK IT PAINTS ITSELF, AND AT A DEPTH IT REPORTS ITSELF. Three
   sweeps of the same vantages, differing only in the range's own haze:
       A   haze black at density 1e-5  — effectively unhazed, so this is the range's base colour
       B   haze black at density D     — the same frame with a known amount of haze applied
       S   exactly as the game ships
   ONLY THE RANGE RESPONDS TO ITS OWN HAZE, so the mask is simply "pixels that got darker from A to
   B". That is a physical test rather than a colour one, which matters because the whole question is
   what colour the range is — a mask that thresholded colour would beg it. The mask is eroded 2 px
   so a silhouette edge cannot contribute a pixel that is half sky.
   AND THE SAME TWO FRAMES GIVE DEPTH, per pixel, for free: hz = 1 - lumB/lumA, and the haze is
   FogExp2, so L = sqrt(-ln(1-hz))/D metres. THAT IS WHAT MAKES THE BAND MEANINGFUL AT THESE
   VANTAGES. The annulus runs r 64-190 with its crest at 0.82 of that, and a wide vantage near the
   origin sees the near inner SKIRT of it — low, sub-treeline, tussock, barely hazed — filling much
   more of the frame than the range proper. Measured over the whole mask, 11_trailhead reads luma
   0.696 at hue 51: correct for a tussock foothill and nothing to do with the plates, whose ridge
   bands are distant rock. So the band is asserted on pixels beyond FAR metres and the near skirt is
   reported beside it rather than averaged into it.
   AN EARLIER MASK, BUILT BY DIFFING TWO FRAMES WITH THE RANGE HIDDEN, WAS WRONG: the two frames
   come from separate browser launches, so grass and cloud motion differ between them and the diff
   picked up moving foreground while MISSING more than half the range. It measured 0.836 where a
   painted mask measures 0.744 on the same frame, and it is what made a mix of two dark colours
   appear to come out brighter than either.

   AND THE SKY IS THE SKY DIRECTLY ABOVE THE ROCK, per column — the 20 px immediately above the
   topmost range pixel in that column, median — rather than a band of the frame or a colour class.
   That is the comparison both plates make: rock against the sky it stands in front of. It needs no
   threshold and it cannot drift as the ridge height changes. */
import fs from 'fs'; import path from 'path'; import os from 'os'; import url from 'url';
import { execSync } from 'child_process';
import { shootRun } from './crossrun.mjs';
import { ensureBuild } from './webrig.mjs';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');

/* THE WIDE VANTAGES, and which of them actually carry the range is DISCOVERED rather than assumed:
   a vantage whose painted mask covers less than 1% of the frame is reported as "range not in
   frame" and not measured. That way the list can be generous without inventing measurements. */
const IDS=(process.env.IDS||'01_carpark_wide,06_skyline,10_skifield,28_skifield_base,11_trailhead')
  .split(',').filter(Boolean);
const BAND=[0.39,0.50];
const D=0.0085;                 // the probe density, and the shipping one
const FAR=+(process.env.FAR||120);   // metres: beyond this is the range, nearer is its skirt

const lum=p=>(0.2126*p[0]+0.7152*p[1]+0.0722*p[2])/255;
function frame(f){
  const o=execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height `+
    `-of csv=p=0 "${f}"`,{encoding:'utf8'}).trim().split(',');
  const W=+o[0], H=+o[1];
  const buf=execSync(`ffmpeg -v error -i "${f}" -vf format=rgb24 -f rawvideo -`,
    {maxBuffer:1<<28,encoding:'buffer'});
  return {W,H,at:(x,y)=>{const i=(y*W+x)*3;return [buf[i],buf[i+1],buf[i+2]];}};
}

ensureBuild();
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'kea-value-'));
const dFlag=path.join(TMP,'A'), dHaze=path.join(TMP,'B'), dShip=path.join(TMP,'S');
try{
  process.env.KEATERRAIN=JSON.stringify({haze:{color:0x000000,density:0.00001}});
  shootRun(dFlag,IDS); console.log('A: unhazed sweep shot');
  process.env.KEATERRAIN=JSON.stringify({haze:{color:0x000000,density:D}});
  shootRun(dHaze,IDS); console.log('B: black-haze sweep shot');
  /* KEAHAZE={"color":...,"density":...} shoots S with a candidate instead of the shipping value.
     It exists so the constant can be LANDED against these vantages rather than against the strip
     camera, which turned out to be a flattering one: the strip's tele view at eye y 9 sees the far
     peaks, and every wide vantage sees the near skirt. */
  if(process.env.KEAHAZE)process.env.KEATERRAIN=JSON.stringify({haze:JSON.parse(process.env.KEAHAZE)});
  else delete process.env.KEATERRAIN;
  shootRun(dShip,IDS); console.log('S: shipping sweep shot'+(process.env.KEAHAZE?'  [KEAHAZE candidate '+process.env.KEAHAZE+']':''));

  const rows=[]; let fails=0;
  for(const id of IDS){
    const fA=path.join(dFlag,id+'.png'), fB=path.join(dHaze,id+'.png'), fS=path.join(dShip,id+'.png');
    if(![fA,fB,fS].every(f=>fs.existsSync(f))){ rows.push({id,skip:'not shot'}); continue; }
    const A=frame(fA), B=frame(fB), S=frame(fS);
    if(A.W!==B.W||A.W!==S.W||A.H!==B.H||A.H!==S.H){ rows.push({id,skip:'frame sizes differ'}); continue; }
    const {W,H}=A, HUD=44;
    /* the mask: only the range responds to the range's own haze */
    const raw=new Uint8Array(W*H), dep=new Float32Array(W*H);
    for(let y=HUD;y<H-HUD;y++)for(let x=0;x<W;x++){
      const la=lum(A.at(x,y)), lb=lum(B.at(x,y));
      if(la<=0.02||la-lb<6/255)continue;              // no response, or too dark to divide by
      const hz=1-lb/la;
      if(hz<=0||hz>=0.999)continue;
      raw[y*W+x]=1; dep[y*W+x]=Math.sqrt(-Math.log(1-hz))/D; }
    const near=[], far=[]; const top=new Int32Array(W).fill(-1);
    for(let y=HUD+2;y<H-HUD-2;y++)for(let x=2;x<W-2;x++){
      if(!raw[y*W+x])continue;
      let ok=1;
      for(let dy=-2;dy<=2&&ok;dy++)for(let dx=-2;dx<=2;dx++)if(!raw[(y+dy)*W+x+dx]){ok=0;break;}
      if(!ok)continue;
      (dep[y*W+x]>=FAR?far:near).push([x,y]);
      if(dep[y*W+x]>=FAR&&top[x]<0)top[x]=y; }
    const frac=(near.length+far.length)/(W*(H-2*HUD));
    if(frac<0.01){ rows.push({id,skip:'range not in frame ('+(frac*100).toFixed(2)+'% of it)'}); continue; }
    if(far.length<2000){ rows.push({id,skip:'no range beyond '+FAR+' m in frame ('+far.length+' px)'}); continue; }
    const stat=(m)=>{ if(!m.length)return null;
      const rgb=[0,0,0]; let ml=0;
      for(const [x,y] of m){ const p=S.at(x,y); rgb[0]+=p[0];rgb[1]+=p[1];rgb[2]+=p[2]; ml+=lum(p); }
      ml/=m.length; for(let i=0;i<3;i++)rgb[i]/=m.length;
      const mx=Math.max(...rgb), mn=Math.min(...rgb);
      let hue=Math.atan2(Math.sqrt(3)*(rgb[1]-rgb[2]),2*rgb[0]-rgb[1]-rgb[2])*180/Math.PI;
      if(hue<0)hue+=360;
      return {ml,rgb,sat:(mx-mn)/(mx||1),hue,px:m.length}; };
    const R=stat(far), N=stat(near);
    /* the sky immediately above the rock, per column */
    const sk=[];
    for(let x=0;x<W;x++){
      if(top[x]<0)continue;
      const col=[];
      for(let y=Math.max(0,top[x]-21);y<top[x]-1;y++)col.push(lum(S.at(x,y)));
      if(col.length){ col.sort((a,b)=>a-b); sk.push(col[col.length>>1]); } }
    sk.sort((a,b)=>a-b);
    const sky=sk.length?sk[sk.length>>1]:NaN;
    const inBand=R.ml>=BAND[0]&&R.ml<=BAND[1], darker=R.ml<sky;
    if(!inBand||!darker)fails++;
    rows.push({id,R,N,sky,frac,inBand,darker});
  }

  console.log('');
  console.log('STEP 1 — THE RANGE\'S VALUE AT THE WIDE VANTAGES   band '+BAND[0]+'-'+BAND[1]+
    ' (what nz_alps_01 and nz_alps_02 span)');
  for(const r of rows){
    if(r.skip){ console.log('  -  '+r.id.padEnd(18)+r.skip); continue; }
    console.log('  '+(r.inBand&&r.darker?'ok ':'XX ')+r.id.padEnd(18)+
      'RANGE (>'+FAR+'m) luma '+r.R.ml.toFixed(3)+'  rgb '+
      r.R.rgb.map(v=>v.toFixed(0)).join(',').padEnd(12)+' sat '+r.R.sat.toFixed(2)+
      '  hue '+r.R.hue.toFixed(0).padStart(3)+'   sky '+r.sky.toFixed(3)+
      (r.inBand?'':'   OUT OF BAND')+(r.darker?'':'   BRIGHTER THAN ITS SKY'));
    console.log('     '+''.padEnd(18)+'skirt (<'+FAR+'m) luma '+
      (r.N?r.N.ml.toFixed(3)+'  rgb '+r.N.rgb.map(v=>v.toFixed(0)).join(',').padEnd(12)+
        ' sat '+r.N.sat.toFixed(2)+'  hue '+r.N.hue.toFixed(0).padStart(3)+
        '   '+(r.N.px/(r.N.px+r.R.px)*100).toFixed(0)+'% of the range mask':'none in frame')+
      '   — tussock foothill, not judged against the plates');
  }
  const done=rows.filter(r=>!r.skip);
  console.log('');
  if(!done.length){ console.log('VERDICT: nothing measured — no vantage carried the range.'); process.exit(1); }
  console.log('VERDICT: '+(fails===0
    ? 'the range sits in the plates\' band at all '+done.length+' vantages that carry it, and is\n'+
      '         darker than its own sky at every one.'
    : fails+' of '+done.length+' vantages fail the band or the sky comparison.'));
  process.exit(fails===0?0:1);
} finally {
  if(process.env.KEEP)console.log('kept '+TMP); else fs.rmSync(TMP,{recursive:true,force:true});
}
