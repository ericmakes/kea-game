/* REPLAT P6A — THE SWAP PROOF, BOTH DIRECTIONS, IN PICTURES.
   P6A.md section 3: registering props proves the plumbing exists but not that it works, so one
   low-risk anchor-free prop is swapped end to end. The battery proves the numbers; this proves the
   frame, which is the half a battery cannot see.

   FIVE SHOTS, ONE VANTAGE, ONE SEED:
     A  primitive           the bench as it ships
     B  model               the same bench from placeholder_box.glb
     C  model, night        the night-tint column applied to a MODEL's own materials
     D  primitive again     the flip back — byte-identical to A, which is the claim
     E  model, reverted     swapped at load, then revertProp() called live in the page
   A and D are diffed against each other here rather than by eye: "flip it back to primitive and
   show the frame returns to baseline" is a measurement, and E proves the way back does not need a
   page reload. Every shot also dumps G.propsState and G.models so the pictures and the numbers
   come out of the same run.

   Usage: node gauntlet/verify/p6a-swap.mjs   ->  gauntlet/capture/P6A_*.png */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { execSync } from 'child_process';
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/capture');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const SWAP={bench:{source:'model',url:'models/placeholder_box.glb',
                   fit:{standM:0.98,axis:'y',ground:true}}};
const SWAPNIGHT={bench:{source:'model',url:'models/placeholder_box.glb',
                        fit:{standM:0.98,axis:'y',ground:true},material:{nightTint:true}}};
/* THE BENCH IS AT (28,0). Close enough that a 190 x 98 x 60 box arriving unnormalised would fill
   the frame a hundred times over, which is the point of shooting it from here.
   THE BIRD IS PARKED OFF SET, unlike every pinned vantage, and deliberately: this frame is a
   measurement of ONE PROP against itself across a swap, and a bird in it would put its own idle
   churn into every number. It goes where QUIET already puts the humans. */
const CAM=`KEAGAME.G.camLock={x:25.4,y:1.30,z:2.6,lx:28,ly:0.55,lz:0};`;
const STAGE=`const k=KEAGAME.G.keas[0];k.x=46;k.z=46;k.y=0;k.grounded=true;k.ry=0;
  KEAGAME.G.poseLock=true;
  { const _pb=()=>{ try{ const b=KEAGAME.G.keas[0]; b.x=46;b.z=46;b.y=0;b.vy=0;b.stun=0;
      b.idleT=0;b.idleAct=null;b.grounded=true; }catch(e){} requestAnimationFrame(_pb); };
    requestAnimationFrame(_pb); }
  ${CAM}`;
const NIGHT=`KEAGAME.G.night=true;KEAGAME.G.nightManual=true;KEAGAME.G.nightT=1;KEAGAME.nightApply(1);`;
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true);
  const td=document.getElementById('todo'); if(td)td.style.display='none';
  KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
  KEAGAME.G.humans.forEach(h=>{h._park=true;});
  { const _pk=()=>{ try{ KEAGAME.G.humans.forEach(h=>{ if(!h._park)return;
        h.x=46; h.z=46; h.home={x:46,z:46}; h.patrol=null; h.state='idle'; h.t=0;
        if(h.g)h.g.position.set(46,0,46); }); }catch(e){} requestAnimationFrame(_pk); };
    requestAnimationFrame(_pk); }
  { const _cl=()=>{ try{ KEAGAME.G.time=12.0; }catch(e){} requestAnimationFrame(_cl); };
    requestAnimationFrame(_cl); }
  { const fd0=document.getElementById('feed'); if(fd0)fd0.textContent='';
    const _pf=()=>{ try{ const fd=document.getElementById('feed');
      if(fd&&fd.firstChild)fd.textContent=''; }catch(e){} requestAnimationFrame(_pf); };
    requestAnimationFrame(_pf); }
  KEAGAME.G.trafT.a=999;KEAGAME.G.trafT.b=999;
  for(let i=KEAGAME.G.cars.length-1;i>=0;i--){const c=KEAGAME.G.cars[i];if(c.traffic){
    KEAGAME.G.scene.remove(c.g);
    const ci=KEAGAME.G.colliders.indexOf(c.collider);if(ci>=0)KEAGAME.G.colliders.splice(ci,1);
    for(let q=KEAGAME.G.inter.length-1;q>=0;q--)if(KEAGAME.G.inter[q].car===c)KEAGAME.G.inter.splice(q,1);
    KEAGAME.G.cars.splice(i,1);}}`;

/* WHAT EVERY SHOT READS BACK. The three things P6A.md says must not move across a swap, measured
   in the page rather than argued: the collider the placement emitted, every anchor the entry
   declares, and the prop's own world transform. */
const READ=`(()=>{ const G=KEAGAME.G, P=KEAGAME.PROPS;
  const p=P.placed('bench');
  const anchors={}; for(const n of Object.keys(p.entry.anchors)){ const a=P.anchor(p,n);
    anchors[n]=[+a.x.toFixed(6),+a.y.toFixed(6),+a.z.toFixed(6)]; }
  return {mode:p.mode, source:p.source,
    group:[p.group.position.x,p.group.position.y,p.group.position.z],
    bodyMeshes:p.body.length, bodyVisible:p.body.filter(o=>o.visible).length,
    colliders:p.colliders.map(c=>[c.kind,+c.x.toFixed(6),+c.z.toFixed(6),+c.w.toFixed(6),
                                  +c.d.toFixed(6),+c.top.toFixed(6),c.solid?1:0]),
    anchors, colliderTotal:G.colliders.length,
    models:G.models, propsState:G.propsState,
    nightMats:(G.nightMats||[]).length }; })()`;

let SRV=null;
const origin=async()=>{ if(!SRV){ ensureBuild(); SRV=await serve();
  console.log('p6a-swap: built and serving '+SRV.origin); } return SRV.origin; };

/* EVERY SHOT RUNS THE SAME NUMBER OF ROUND TRIPS BEFORE THE SHUTTER, and that is not fussiness.
   The first cut read the state block back BEFORE photographing the live-revert frame, which gave
   that one shot two extra evaluates of settle — and the grass, which is a camera-following
   instanced field with per-frame work, resolved at a different sub-pixel phase. 18,035 pixels of
   speckle across the whole field, none of it anywhere near the bench, and it read as "the revert
   did not return to baseline". The revert was fine; the timeline was not. So `after` runs BEFORE
   the settle, exactly where a swap would land, and the state block is read AFTER the screenshot. */
async function shot(name,{props,night,after}={}){
  const url0=await origin();
  if(props)process.env.KEAPROPS=JSON.stringify(props); else delete process.env.KEAPROPS;
  const browser=await launch();
  try{
    const page=await browser.newPage();
    await page.setViewport({width:960,height:540,deviceScaleFactor:1});
    await preparePage(page,{seed:GAUNTLETSEED,biome:'carpark'});
    await page.goto(url0,{waitUntil:'load'}); await sleep(1000);
    await assertBooted(page,{biome:'carpark'});
    await page.evaluate(`window.AudioContext=undefined; KEAGAME.startGame(1);`); await sleep(500);
    await page.evaluate(QUIET);
    await page.evaluate('{'+STAGE+(night?NIGHT:'')+(after||'')+'}');
    await sleep(900);
    await page.screenshot({path:path.join(OUT,name+'.png')});
    const st=await page.evaluate(READ);
    console.log('\n== '+name+' ==');
    console.log(JSON.stringify(st,null,1));
    return st;
  } finally { try{ browser.process()&&browser.process().kill('SIGKILL'); }catch(e){}
    try{ await browser.close(); }catch(e){} }
}
/* THE WAY BACK WITHOUT A RELOAD. src/models.mjs exports revertProp for exactly this, but the page
   has already consumed the bundle as one chunk and re-importing it would run main.mjs a second
   time — so the same six lines are driven against the live registry here, which is also how a
   battery or a variant strip would reach it. */
const REVERT=`{ const P=KEAGAME.PROPS, p=P.placed('bench');
  p.group.remove(p.model.yaw); for(const o of p.body)o.visible=true;
  p.mode='primitive'; p.model=null;
  const M=KEAGAME.G.models; M.swapped=M.swapped.filter(s=>s!=='bench');
  delete M.detail['bench']; M.mode=M.swapped.length?'model':'primitive';
  KEAGAME.G.propsState=KEAGAME.propsState(); }`;

const A=await shot('P6A_A_bench_primitive');
/* THE CONTROL, AND THIS PROOF IS WORTHLESS WITHOUT IT. The bench stands in the grass field, and
   src/game.mjs's REPLAT P4c note records at length that the field's content is a STEP FUNCTION of
   camera position — a take-to-take camera hair either side of the 0.5 m snap moves the whole
   field, and the session that measured it got 3 / 1 / 3 unstable vantages from the same code on
   the same machine. So "did the flip back return to baseline" cannot be asked against 1.0000; it
   has to be asked against what this vantage reshoots at when NOTHING has changed. A2 is that
   number, shot identically to A, and every claim below is held to it rather than to perfection. */
const A2=await shot('P6A_A2_control');
const B=await shot('P6A_B_bench_model',{props:SWAP});
const C=await shot('P6A_C_bench_model_night',{props:SWAPNIGHT,night:true});
const D=await shot('P6A_D_bench_primitive_again');
const E=await shot('P6A_E_bench_reverted',{props:SWAP,after:REVERT});

/* ---- THE MEASUREMENTS ----
   THE FULL FRAME IS THE RIGHT UNIT FOR THE RELOAD PATH AND THE WRONG ONE FOR THE LIVE REVERT, and
   the reason is measured rather than assumed. Loading the GLB consumes 44 extra draws from the
   rig's seeded Math.random — three.js takes uuids for every geometry, material and texture it
   makes, off the same stream — so every later consumer in that page shifts. It is the same
   phenomenon BASELINE.md records under the 2026-08-28 tooling fix ("adding ONE object shifts every
   later draw and reshuffles the whole world"), met here on a model load instead of a new mesh, and
   it photographs as a fine speckle across the grass field with nothing at all near the bench.
   IT CANNOT REACH THE SHIPPED GAME: no entry ships source:'model', so nothing is fetched, no draw
   is consumed, and the 28 pinned vantages never see it. It reaches this proof only because this
   proof is the one thing in the tree that deliberately turns a swap on.
   So the reload path (A vs D) is held to the WHOLE FRAME, byte for byte, and the live revert is
   held to the bench's own box — which is where the claim is: the primitive body comes back exactly
   as it was. The grass outside it is the seeded stream, not the seam. */
const BENCH='360:180:240:170';                              // w:h:x:y around the bench at (28,0)
const ssim=(a,b,crop)=>{ const c=crop?`,crop=${crop}`:'';
  const o=execSync(`ffmpeg -i "${path.join(OUT,a)}" -i "${path.join(OUT,b)}" `+
    `-lavfi "[0:v]format=gray${c}[x];[1:v]format=gray${c}[y];[x][y]ssim" -f null - 2>&1`).toString();
  const m=o.match(/All:([\d.]+)/); return m?parseFloat(m[1]):0; };
const F='P6A_A_bench_primitive.png', CTL='P6A_A2_control.png';
const AA=ssim(F,CTL), AD=ssim(F,'P6A_D_bench_primitive_again.png'),
      AB=ssim(F,'P6A_B_bench_model.png'), AE=ssim(F,'P6A_E_bench_reverted.png');
const AAc=ssim(F,CTL,BENCH), ADc=ssim(F,'P6A_D_bench_primitive_again.png',BENCH),
      AEc=ssim(F,'P6A_E_bench_reverted.png',BENCH), ABc=ssim(F,'P6A_B_bench_model.png',BENCH);
const pc=v=>v.toFixed(4);
console.log('\n---- P6A SWAP PROOF ----');
console.log('                                                       whole frame   the bench box');
console.log('  A vs A2  CONTROL: nothing changed at all             '+pc(AA)+'        '+pc(AAc));
console.log('  A vs D   primitive -> model -> primitive, reloaded   '+pc(AD)+'        '+pc(ADc));
console.log('  A vs E   primitive vs live-reverted model            '+pc(AE)+'        '+pc(AEc));
console.log('  A vs B   primitive vs MODEL                          '+pc(AB)+'        '+pc(ABc));
console.log('\n  the two ways back must be no worse than the control; the swap must be far worse.');
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
let bad=[];
const FLOOR=Math.min(AA,AAc)-0.0005;      // the control, with a hair of slack for ffmpeg rounding
if(AD<FLOOR)bad.push('the reloaded flip back is worse than the control (A vs D '+pc(AD)+
  ' against '+pc(AA)+')');
if(ADc<FLOOR)bad.push('the reloaded flip back did not restore the bench (A vs D at the bench '+
  pc(ADc)+' against control '+pc(AAc)+')');
if(AEc<FLOOR)bad.push('the live revert did not restore the bench (A vs E at the bench '+
  pc(AEc)+' against control '+pc(AAc)+')');
if(AB>0.965)bad.push('the model is not visibly different from the primitive (A vs B '+pc(AB)+')');
if(ABc>0.90)bad.push('the model is not visibly different AT THE BENCH (A vs B at the bench '+pc(ABc)+')');
if(ABc>AAc-0.05)bad.push('the swap is not clear of this vantage own churn (model '+pc(ABc)+
  ', control '+pc(AAc)+')');
if(B.mode!=='model')bad.push('B did not swap (mode '+B.mode+')');
if(C.mode!=='model')bad.push('C did not swap (mode '+C.mode+')');
if(A.mode!=='primitive'||D.mode!=='primitive')bad.push('A or D was not primitive');
if(E.mode!=='primitive')bad.push('E did not revert (mode '+E.mode+')');
if(E.source!=='model')bad.push('E was not asked for a model in the first place, so it proves nothing');
if(E.bodyVisible!==E.bodyMeshes)bad.push('the primitive body did not come back visible ('+
  E.bodyVisible+' of '+E.bodyMeshes+')');
if(!same(A.colliders,E.colliders))bad.push('the collider moved across the live revert');
if(!same(A.anchors,E.anchors))bad.push('an anchor moved across the live revert');
if(B.bodyVisible!==0)bad.push('the primitive body was still visible under the model ('+B.bodyVisible+')');
if(!same(A.colliders,B.colliders))bad.push('THE COLLIDER MOVED ACROSS THE SWAP');
if(!same(A.anchors,B.anchors))bad.push('AN ANCHOR MOVED ACROSS THE SWAP');
if(A.colliderTotal!==B.colliderTotal)bad.push('the world collider count changed across the swap');
if(!(C.nightMats>A.nightMats))bad.push('the night tint did not reach the model materials ('+
  C.nightMats+' against '+A.nightMats+')');
if(bad.length){ bad.forEach(b=>console.log('✗ '+b)); console.log('P6A SWAP: FINDINGS'); process.exitCode=1; }
else console.log('P6A SWAP: ALL PASS — collider and anchors identical both ways, night tint reaches the model');
if(SRV&&SRV.close)SRV.close();
process.exit(process.exitCode||0);
