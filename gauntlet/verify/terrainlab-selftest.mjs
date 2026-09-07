/* CONTRACT TEST for terrainlab.mjs. Usage: node gauntlet/verify/terrainlab-selftest.mjs
   The lab's arithmetic is what gets PORTED into the game, so its correctness is load-bearing before
   a line of it reaches src/. These assertions are also a dry run of TERRAIN.md section 5: anything
   that can be proved here about the height function should be proved here, where it costs 50 ms,
   rather than in a battery that has to boot a world. */
import {build,skyline,RECIPES,RING} from './terrainlab.mjs';

let bad=0; const F=[];
const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); if(!c){F.push(m);bad++;} };
const {nTheta,nR,r0,r1}=RING, dR=(r1-r0)/(nR-1);
const H0=build(RECIPES.a).H;
console.log('TERRAINLAB SELFTEST');

/* 1. DETERMINISM. The game's copy must derive its shape from position and never draw a random,
      because every seeded draw in a biome build depends on rnd()'s call order (TODO 47). If the
      lab's field is not reproducible, the port cannot be either. */
{ const A=build(RECIPES.a).H, B=build(RECIPES.a).H;
  let same=A.length===B.length;
  for(let i=0;i<A.length&&same;i++)if(A[i]!==B[i])same=false;
  ok(same,'the same recipe gives a byte-identical field — no hidden randomness ('+A.length+' cells)');
  const C=build(RECIPES.c).H;
  let diff=false; for(let i=0;i<A.length;i++)if(Math.abs(A[i]-C[i])>1e-6){diff=true;break;}
  ok(diff,'and a different recipe gives a different field'); }

/* 2. THE INNER SEAM IS ZERO. The annulus meets the existing ground plane at r0 and there must be
      no step to hide: the play area's terrain is at y 0 there. */
{ let worst=0;
  for(let i=0;i<nTheta;i++)worst=Math.max(worst,Math.abs(H0[i]));
  ok(worst<0.05,'the inner ring sits at zero, so it meets the play area with no step ('+
     worst.toFixed(4)+' m worst)'); }

/* 3. THERMAL EROSION CONSERVES MASS. This is the strongest single check on the erosion pass: it
      MOVES material downhill, it does not create or destroy it. A pass that fails this is not
      erosion, it is a filter that happens to look eroded — and the difference shows the first time
      someone changes the iteration count and the range quietly grows. */
{ const R=RECIPES.c;
  const none=build({...R, erode:{...R.erode, iters:0}}).H;
  const lots=build({...R, erode:{...R.erode, iters:40}}).H;
  const sum=a=>{ let s=0; for(const v of a)s+=v; return s; };
  const s0=sum(none), s1=sum(lots);
  ok(Math.abs(s1-s0)/s0<1e-6,'erosion conserves mass — total height '+s0.toFixed(1)+
     ' before, '+s1.toFixed(1)+' after forty iterations ('+
     (Math.abs(s1-s0)/s0*100).toExponential(1)+'% drift)');
  /* AND IT REDUCES THE MAXIMUM SLOPE, which is what an angle of repose means. */
  const maxSlope=A=>{ let m=0;
    for(let j=0;j<nR-1;j++){ const r=r0+dR*j, dT=2*Math.PI*r/nTheta;
      for(let i=0;i<nTheta;i++){ const k=j*nTheta+i;
        m=Math.max(m,Math.abs(A[k+nTheta]-A[k])/dR,
                     Math.abs(A[j*nTheta+((i+1)%nTheta)]-A[k])/dT); } }
    return m; };
  const m0=maxSlope(none), m1=maxSlope(lots);
  ok(m1<m0,'and it reduces the steepest slope in the field, '+m0.toFixed(2)+' -> '+m1.toFixed(2)+
     ' (an angle of repose is exactly a slope ceiling)'); }

/* 4. SCREE IS DEPOSITED BELOW WHAT WAS REMOVED. The claim is that the erosion actually ran
      downhill, not that its parameters were set — the material pass will key a scree surface off
      this mask, so it has to mean what it says. */
{ const R=RECIPES.c;
  const {H,scree}=build(R);
  const none=build({...R, erode:{...R.erode, iters:0}}).H;
  let loss=0, gain=0, screeH=0, lossH=0, n=0, m=0;
  for(let j=0;j<nR;j++)for(let i=0;i<nTheta;i++){
    const k=j*nTheta+i, d=H[k]-none[k];
    if(d<-0.01){ loss-=d; lossH+=none[k]; n++; }
    if(scree[k]>0.01){ gain+=scree[k]; screeH+=none[k]; m++; } }
  ok(n>50&&m>50,'erosion moved material in a lot of places ('+n+' losing, '+m+' gaining)');
  ok(screeH/m < lossH/n,'and the ground it PILED ON is lower than the ground it CUT — mean '+
     (screeH/m).toFixed(1)+' m against '+(lossH/n).toFixed(1)+
     ' m, which is what makes it a scree fan and not a smoothing filter'); }

/* 5. THE VALLEYS ARE U, NOT V. Measured as the curvature of the cross-section at the floor: a U
      has a broad flat bottom, so its second derivative across the axis is small at the centre and
      large at the walls. A V is the other way round. */
{ const R=RECIPES.c;
  const flat=build({...R, valleys:0, erode:{...R.erode,iters:0}}).H;
  const cut=build({...R, erode:{...R.erode,iters:0}}).H;
  /* find the azimuth where the most was removed — that is a valley axis */
  let bestI=0, bestD=0;
  const j=Math.round(nR*0.6);
  for(let i=0;i<nTheta;i++){ const d=flat[j*nTheta+i]-cut[j*nTheta+i];
    if(d>bestD){bestD=d; bestI=i;} }
  ok(bestD>1,'a valley axis is findable, '+bestD.toFixed(1)+' m removed at its deepest');
  /* THE PROBE MUST SPAN THE WHOLE TROUGH, and the first version did not. It sampled +/-14 azimuth
     indices where the valley's own half-width at this ring is 20.3, so every "wall" sample was
     still on the FLOOR and the curvature it compared was the terrain's own noise. Derived from the
     recipe now, so the probe cannot go stale when the width changes. */
  const t=j/(nR-1), wRad=R.valleyW*(0.5+t), wIdx=wRad/(2*Math.PI/nTheta);
  const span=Math.round(wIdx*1.6);
  const prof=[];
  for(let o=-span;o<=span;o++)prof.push(cut[j*nTheta+((bestI+o+nTheta)%nTheta)]);
  const c0=span;                                        // index of the axis within prof
  const d2=k=>prof[k-1]-2*prof[k]+prof[k+1];
  /* mean |curvature| over the flat floor against over the walls — a U has its bend at the walls */
  const band=(a1,b1)=>{ let s2=0,n2=0;
    for(let k=a1;k<=b1;k++){ if(k<1||k>=prof.length-1)continue; s2+=Math.abs(d2(k)); n2++; }
    return n2?s2/n2:0; };
  const floorC=band(c0-Math.round(wIdx*0.5), c0+Math.round(wIdx*0.5));
  const wallC=Math.max(band(c0-span, c0-Math.round(wIdx*0.8)),
                       band(c0+Math.round(wIdx*0.8), c0+span));
  ok(wallC>floorC,'and its cross-section is a U, not a V — mean curvature at the walls '+
     wallC.toFixed(3)+' exceeds mean curvature across the floor '+floorC.toFixed(3));
  /* AND THE FLOOR IS ACTUALLY FLAT, which is the thing a U has and a V does not. Planing to an
     absolute floor rather than scaling by existing height was what fixed this: the fractional
     version left a 10.0 m bump at the axis against 4.3-6.6 m either side of it. */
  const fl=[]; for(let k=c0-Math.round(wIdx*0.5);k<=c0+Math.round(wIdx*0.5);k++)
    if(k>=0&&k<prof.length)fl.push(prof[k]);
  const flo=Math.min(...fl), fhi=Math.max(...fl);
  ok(fhi-flo < (Math.max(...prof)-flo)*0.45,'and the trough FLOOR is flat — it varies '+
     (fhi-flo).toFixed(1)+' m across its width where the walls rise '+
     (Math.max(...prof)-flo).toFixed(1)+' m above it'); }

/* 6. EVERY PEAK A DIFFERENT SILHOUETTE — the specific thing the cone ring could never do, and
      therefore the assertion that matters most. IT COMES WITH A CONE CONTROL, because an instrument
      that cannot detect the direction Eric rejected is worth nothing: a ring of seven identical
      cones must score 1.00 and the terrain must not.

      TWO EARLIER VERSIONS OF THIS MEASUREMENT WERE WRONG, and both failed the same way — they
      measured something true but irrelevant.
        - Correlating raw azimuth SECTORS gave 0.89, because every massif rises and falls, so eight
          sectors each holding roughly one massif all look like "up then down". That says the
          skyline has peaks in it, not that the peaks differ.
        - Detrending first only got it to 0.79: sector boundaries do not align with summits, so half
          of each window is somebody else's mountain.
      What "a different silhouette" means is that peaks compared SUMMIT TO SUMMIT differ. So the
      summits are found, each gets a window scaled by its OWN half-width and normalised to its OWN
      height, and those profiles are compared. Then the statistic is the MEAN over all pairs, not
      the max: with nine peaks there are 36 pairs and the largest is noisy, while the mean separates
      cleanly — measured, terrain scores 0.08/-0.00/0.05 and identical cones score 1.00. */
{ const profiles=(sk,S=9)=>{
    const n=sk.length;
    const sm=i2=>{ let s2=0,m2=0; for(let o=-6;o<=6;o++){ s2+=sk[(i2+o+n)%n]; m2++; } return s2/m2; };
    const smo=[]; for(let i2=0;i2<n;i2++)smo.push(sm(i2));
    const pk=[];
    for(let i2=0;i2<n;i2++)if(smo[i2]>smo[(i2+n-1)%n]&&smo[i2]>=smo[(i2+1)%n])pk.push({i:i2,h:smo[i2]});
    pk.sort((a,b)=>b.h-a.h);
    return pk.slice(0,S).map(p=>{
      const half=p.h*0.5; let L=0,Rr=0;
      while(L<n/4&&smo[(p.i-L+n)%n]>half)L++;
      while(Rr<n/4&&smo[(p.i+Rr)%n]>half)Rr++;
      const wid=Math.max(4,L+Rr), prof=[];
      for(let k=-12;k<=12;k++)prof.push(sk[(p.i+Math.round(k/12*wid*1.4)+n)%n]/p.h);
      return prof; });
  };
  const corr=(A,B)=>{ const ma=A.reduce((x,y)=>x+y,0)/A.length, mb=B.reduce((x,y)=>x+y,0)/B.length;
    let nu=0,da=0,db=0;
    for(let i2=0;i2<A.length;i2++){ const a=A[i2]-ma,b=B[i2]-mb; nu+=a*b; da+=a*a; db+=b*b; }
    return nu/Math.sqrt(da*db||1); };
  const meanPair=P=>{ let s2=0,n2=0;
    for(let i2=0;i2<P.length;i2++)for(let k=i2+1;k<P.length;k++){ s2+=corr(P[i2],P[k]); n2++; }
    return n2?s2/n2:1; };

  /* THE CONTROL FIRST: seven identical cones on the same ring, which is what was rejected. */
  const cones=(()=>{ const A=new Float32Array(nR*nTheta);
    for(let c=0;c<7;c++){ const a0=c/7*Math.PI*2;
      for(let j2=0;j2<nR;j2++){ const r=r0+dR*j2;
        for(let i2=0;i2<nTheta;i2++){ const ang=i2/nTheta*Math.PI*2;
          const d=Math.hypot(Math.cos(ang)*r-Math.cos(a0)*140,Math.sin(ang)*r-Math.sin(a0)*140);
          A[j2*nTheta+i2]=Math.max(A[j2*nTheta+i2],Math.max(0,40*(1-d/45))); } } }
    return A; })();
  const cc=meanPair(profiles(skyline(cones)));
  ok(cc>0.9,'CONTROL: a ring of seven identical cones scores '+cc.toFixed(2)+
     ' on this measurement, so it can see the direction Eric rejected');

  for(const k of ['a','b','c']){
    const mp=meanPair(profiles(skyline(build(RECIPES[k]).H)));
    ok(mp<0.35,k+': EVERY PEAK IS ITS OWN SHAPE — mean correlation between the nine major '+
       'summits\' normalised profiles is '+mp.toFixed(2)+', against 1.00 for identical cones'); } }

/* 7. THE SKYLINE DOES NOT COME FROM THE OUTERMOST RING. A regression guard on a real bug: the
      amplitude ramp originally peaked AT the rim, which is the coarsest ring and — before it was
      fixed — the one ring the erosion loop skipped. The single ring forming the silhouette was the
      single ring getting no smoothing, and it showed as 26 one-sample needles on recipe b. */
{ for(const k of ['a','b','c']){
    const H=build(RECIPES[k]).H;
    let atRim=0;
    for(let i=0;i<nTheta;i++){
      let best=0,bj=0;
      for(let j=0;j<nR;j++){ const el=Math.atan2(H[j*nTheta+i]-1.6,r0+dR*j); if(el>best){best=el;bj=j;} }
      if(bj>=nR-2)atRim++; }
    ok(atRim<nTheta*0.15,k+': the skyline comes from inside the rim, not off the boundary ('+
      atRim+' of '+nTheta+' azimuths peak in the outer two rings)'); } }

/* 8. NO ONE-SAMPLE NEEDLES. An arête is a crest several samples wide; a single azimuth sample
      standing clear of both its neighbours is the grid failing, and at 0.94 degrees a sample that
      is 15 px wide in a 60-degree frame it is conspicuous. */
{ for(const k of ['a','b','c']){
    const sk=skyline(build(RECIPES[k]).H), n=sk.length;
    let worst=0;
    for(let i=0;i<n;i++){ const c=Math.min(sk[i]-sk[(i+n-1)%n],sk[i]-sk[(i+1)%n])*180/Math.PI;
      if(c>worst)worst=c; }
    ok(worst<1.2,k+': no azimuth stands more than '+worst.toFixed(2)+
      ' deg clear of both neighbours (recipe b measured 2.59 before band-limiting and the crest fix)'); } }

/* ---- THE LAB AND THE GAME MUST BE THE SAME RANGE ----
   terrainlab.mjs carries its OWN copy of the recipes and of the erosion loop, because it runs
   offline in about 50 ms per recipe and importing the specimen would drag a browser's worth of
   module in with it. That copy is how Eric picked recipe c — so the moment it drifts from the game,
   the lab describes a range nobody ships and every silhouette assertion above becomes a claim
   about a different mountain.
   IT HAD ALREADY DRIFTED. Step 2 raised recipe c's angle of repose from talus 0.50 — 26.6 degrees,
   which was planing every face flat, and not an alpine slope — to 1.60, in the game only, and this
   entire selftest stayed green across the change without noticing. That is precisely the failure
   the check below makes impossible. */
{
  const { createRequire } = await import('module');
  const require2 = createRequire(import.meta.url);
  const { evalSpecimen } = require2('../../audits/2026-08-26/keasrc.js');
  /* THE SPECIMEN IS HANDED ITS THREE, the way every battery hands it one — it takes THREE as a
     parameter rather than importing it, which is what keeps its single static import single. */
  const X = evalSpecimen(require2('three'));
  const GR = X.TERRAIN.recipes, LB = RECIPES;
  const keys = [...new Set([...Object.keys(GR), ...Object.keys(LB)])].sort();
  ok(keys.length===Object.keys(GR).length && keys.length===Object.keys(LB).length,
     'the lab knows exactly the recipes the game does ('+keys.join(',')+')');
  const diffs=[];
  const walk=(a,b,pth)=>{
    if(a&&b&&typeof a==='object'&&typeof b==='object'){
      for(const k of new Set([...Object.keys(a),...Object.keys(b)]))walk(a[k],b[k],pth+'.'+k);
    } else if(a!==b) diffs.push(pth+': game '+JSON.stringify(a)+' vs lab '+JSON.stringify(b));
  };
  for(const k of keys)walk(GR[k],LB[k],k);
  ok(diffs.length===0,'AND EVERY RECIPE PARAMETER IS IDENTICAL between the game and the lab'+
     (diffs.length?' — '+diffs.length+' differ: '+diffs.slice(0,6).join('; '):
      ' ('+keys.length+' recipes, every field)')+
     '. The lab is where Eric chose the silhouette family; if it drifts, it is judging a range the '+
     'game does not build.');
}

console.log(bad?('TERRAINLAB SELFTEST: '+bad+' FINDINGS'):'TERRAINLAB SELFTEST: ALL PASS');
process.exit(bad?1:0);
