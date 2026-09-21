/* BIRDFRAME — how much of the frame the bird actually occupies, at a given staging.
   Usage: node gauntlet/verify/birdframe.mjs            measure the five close-ups, both birds
          IDS=03_kea_plate ...                          a subset

   WHY IT EXISTS. Turning the model on swapped a protagonist 1.084 m wide for one 0.626 m wide —
   same height, 42% less width, because the approved bird's wings are properly folded where the
   primitive's splayed. Five close-up vantages were framed for the old one and now read as a small
   bird in a big field. Re-staging them is a look decision, but "does this frame the bird the way
   it used to" is a MEASUREMENT, and this is it: project the bird's own vertices through the live
   camera and report the box in pixels.
   IT MEASURES BOTH BIRDS AT WHATEVER CAMERA THE VANTAGE CURRENTLY DECLARES, so the before and the
   after are the same instrument rather than a memory of how the old frame looked. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';
const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..','..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* the five close-ups, with the stage each one sets — copied from capture.mjs by ID, and the
   camera is read back OFF THE PAGE afterwards rather than parsed, so this cannot drift from it. */
const STAGE={
  '03_kea_plate':`const k=KEAGAME.G.keas[0];k.preenT=99;k.idleT=0;KEAGAME.G.poseLock=true;
    k.x=0;k.z=0;k.y=KEAGAME.groundHeightAt(0,0,1);k.vy=0;k.grounded=true;k.ry=1.9;k.stun=0;KEAGAME.G.time=12.0;`,
  '13_idle_preen':`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0;k.grounded=true;k.ry=2.2;k.stun=0;
    k.landFlare=0;k.vy=0;KEAGAME.G.poseLock=false;k.idleT=99;
    k.idleAct={kind:'preen',t:0.7,dur:3.5,side:1};k._idleEver=true;`,
  '18_rear_close':`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=false;k.x=-9.2;k.z=10.6;k.y=0;
    k.grounded=true;k.ry=5.8;k.stun=0;k.idleT=0;k.idleAct=null;`,
  '20_dead_rear':`const k=KEAGAME.G.keas[0];k.x=-9.55;k.z=10.15;k.y=0;k.vy=0;k.grounded=true;
    k.stun=0;k.ry=Math.atan2((-11)-(-9.55),8-10.15);KEAGAME.G.poseLock=true;`,
  '25_preen_follow':`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=false;k.x=0;k.z=0;k.y=0;k.vy=0;
    k.grounded=true;k.ry=2.2;k.stun=0;k.landFlare=0;k.idleT=99;
    k.idleAct={kind:'preen',t:1.1,dur:4.0,side:1};k._idleEver=true;`,
};
/* the camera each vantage declares today, read out of capture.mjs so there is ONE copy of it */
const CAPSRC=fs.readFileSync(path.join(HERE,'capture.mjs'),'utf8');
function camFor(id){
  const i=CAPSRC.indexOf("shotR('"+id+"'");
  if(i<0)return null;
  const seg=CAPSRC.slice(i,CAPSRC.indexOf('`);',i));
  const m=seg.match(/\$\{CAM\(([^)]*)\)\}/);
  if(!m)return null;
  try{ return new Function('F_RY','F_BACK','F_H','Math','return ['+m[1]+']')(2.2,5.2*(0.62+0.42)*0.6,2.15*(0.62+0.45),Math); }
  catch(e){ return null; }
}
const IDS=(process.env.IDS||Object.keys(STAGE).join(',')).split(',').filter(Boolean);
ensureBuild(); const SRV=await serve();
const MEASURE=`(()=>{
  const G=KEAGAME.G,k=G.keas[0],cam=G.cams&&G.cams[0];
  if(!cam)return JSON.stringify({err:'no camera'});
  cam.updateMatrixWorld(true); k.g.updateMatrixWorld(true);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,n=0;
  const V=k.g.position.constructor;
  /* THE SHADOW IS NOT THE BIRD, and leaving it in made this instrument lie in the most
     convincing way available: it reported the approved bird at 336 px on 03_kea_plate, all but
     identical to the primitive's 344, which would have said the re-stage was unnecessary. The
     bird is 112 px there. The other 248 were a flat blob on the ground, which is wider than the
     animal and does not shrink when the animal does. Measured, not guessed: skinned-only came
     back 112x156 while everything-visible came back 257x259 and the shadow alone 248x101. */
  k.g.traverse(o=>{ if(!o.isMesh||!o.visible)return;
    if(o===k.shadowM)return;
    let p=o; let vis=true; while(p){ if(p.visible===false){vis=false;break;} p=p.parent; }
    if(!vis)return;
    const g=o.geometry; if(!g||!g.attributes.position)return;
    o.updateWorldMatrix(true,false);
    const pos=g.attributes.position;
    for(let i=0;i<pos.count;i+=3){
      const v=new V(pos.getX(i),pos.getY(i),pos.getZ(i));
      if(o.isSkinnedMesh)o.applyBoneTransform(i,v);
      v.applyMatrix4(o.matrixWorld).project(cam);
      if(v.z>1)continue;
      const sx=(v.x*0.5+0.5)*960, sy=(-v.y*0.5+0.5)*540;
      x0=Math.min(x0,sx); x1=Math.max(x1,sx); y0=Math.min(y0,sy); y1=Math.max(y1,sy); n++; }});
  return JSON.stringify({n, wpx:Math.round(x1-x0), hpx:Math.round(y1-y0),
    cx:Math.round((x0+x1)/2), cy:Math.round((y0+y1)/2),
    frac:+(((x1-x0)/960)).toFixed(3), mode:G.bird&&G.bird.mode});})()`;
const rows=[];
for(const id of IDS){
  const cam=camFor(id);
  for(const [label,cfg] of [['primitive',{model:false}],['approved',{model:true}]]){
    const browser=await launch();
    try{
      const page=await browser.newPage();
      await page.setViewport({width:960,height:540,deviceScaleFactor:1});
      await preparePage(page,{seed:GAUNTLETSEED,biome:'carpark'});
      await page.evaluateOnNewDocument(`globalThis.__KEA_BIRD__=${JSON.stringify(cfg)};`);
      await page.goto(SRV.origin,{waitUntil:'load'}); await sleep(1300);
      await assertBooted(page,{biome:'carpark'});
      await page.evaluate('window.AudioContext=undefined; KEAGAME.startGame(1);'); await sleep(400);
      if(cfg.model)for(let i=0;i<50;i++){ const b=JSON.parse(await page.evaluate('JSON.stringify(KEAGAME.G.bird||{})'));
        if(b.mode==='model'&&b.birds>0)break; await sleep(400); }
      await page.evaluate('{'+STAGE[id]+'}');
      if(cam)await page.evaluate(`KEAGAME.G.camLock={x:${cam[0]},y:${cam[1]},z:${cam[2]},lx:${cam[3]},ly:${cam[4]},lz:${cam[5]}};`);
      await sleep(700);
      const r=JSON.parse(await page.evaluate(MEASURE));
      rows.push({id,bird:label,...r});
      console.log('  '+id.padEnd(17)+label.padEnd(11)+'bird '+String(r.wpx).padStart(4)+' x '+
        String(r.hpx).padStart(3)+' px  ('+(r.frac*100).toFixed(1)+'% of width)  centre '+r.cx+','+r.cy);
    } catch(e){ console.log('  '+id+' '+label+' FAILED '+String(e.message).split('\n')[0]); }
    finally{ try{ await browser.close(); }catch(_){}}
  }
}
fs.writeFileSync(path.join(ROOT,'gauntlet/capture/bird/BIRDFRAME.json'),JSON.stringify(rows,null,2));
process.exit(0);
