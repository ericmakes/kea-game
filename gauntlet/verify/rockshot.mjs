/* ROCK PROOF — the boulders have no vantage, so they get a bespoke frame.
   Usage: node gauntlet/verify/rockshot.mjs   ->  gauntlet/capture/ROCK_*.png
   Not a pinned vantage and never will be: it exists so a shape change to mkBoulder can be judged
   at all. The ski field's ring is at r 26-50 and every pinned camera looks somewhere else. */
import path from 'path'; import url from 'url';
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/capture');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true);
  { const td=document.getElementById('todo'); if(td)td.style.display='none'; }
  KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
  KEAGAME.G.humans.forEach(h=>{h._park=true;});
  { const _pk=()=>{ try{ KEAGAME.G.humans.forEach(h=>{ if(!h._park)return;
      h.x=46;h.z=46;h.home={x:46,z:46};h.patrol=null;h.state='idle';h.t=0;
      if(h.g)h.g.position.set(46,0,46); }); }catch(e){} requestAnimationFrame(_pk); };
    requestAnimationFrame(_pk); }
  { const _pf=()=>{ try{ const fd=document.getElementById('feed'); if(fd)fd.textContent='';
      const td=document.getElementById('todo'); if(td)td.style.display='none';
      KEAGAME.G.time=12.0; const k=KEAGAME.G.keas[0];
      k.x=46;k.z=46;k.y=0;k.vy=0;k.stun=0;k.grounded=true; }catch(e){} requestAnimationFrame(_pf); };
    requestAnimationFrame(_pf); }
  KEAGAME.G.poseLock=true;`;

const srv=await(async()=>{ ensureBuild(); return serve(); })();
console.log('rockshot: serving '+srv.origin);
for(const [name,biome] of [['ski','skifield']]){
  const browser=await launch(); const page=await browser.newPage();
  await page.setViewport({width:960,height:540});
  await preparePage(page,{seed:GAUNTLETSEED,biome});
  await page.goto(srv.origin+'/',{waitUntil:'load'});
  await assertBooted(page);
  await page.evaluate(`window.AudioContext=undefined;KEAGAME.startGame(1);`);
  await sleep(900);
  await page.evaluate(QUIET);
  /* stand off the LARGEST registered rock, at head height, close enough to read a facet */
  const info=await page.evaluate(`(()=>{ const G=KEAGAME.G;
    let best=null, bs=-1;
    for(const m of (G.rocks||[])){ m.geometry.computeBoundingBox();
      const bb=m.geometry.boundingBox, s=(bb.max.x-bb.min.x)*(bb.max.z-bb.min.z);
      if(s>bs){ bs=s; best=m; } }
    if(!best)return null;
    const bb=best.geometry.boundingBox;
    const w=bb.max.x-bb.min.x, d=bb.max.z-bb.min.z, h=bb.max.y-bb.min.y;
    const R=Math.max(w,d)*2.2+2.0;
    KEAGAME.G.camLock={x:best.position.x+R*0.8, y:best.position.y+h*0.9, z:best.position.z+R*0.6,
                       lx:best.position.x, ly:best.position.y, lz:best.position.z};
    return {x:best.position.x,y:best.position.y,z:best.position.z,
            w:+w.toFixed(2),d:+d.toFixed(2),h:+h.toFixed(2),
            verts:best.geometry.attributes.position.count,
            geo:best.geometry.type, n:(G.rocks||[]).length}; })()`);
  await sleep(1200);
  await page.screenshot({path:path.join(OUT,'ROCK_'+name+'.png')});
  await browser.close();
  console.log('ROCK_'+name+'.png  '+JSON.stringify(info));
}
await srv.close();
