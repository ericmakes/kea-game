/* THE BLOWOUT DIAGNOSTIC — is a hot spot the MATERIAL or the LIGHT GEOMETRY?
   Usage: node gauntlet/verify/sunangle.mjs   ->  gauntlet/capture/SUN_*.png + a table

   WHY THIS SHAPE AND NOT THE ONE THAT WAS ASKED FOR. Eric's eyeball item 10 on the river audit was
   "38: is the blowout the water material or the sun angle at that vantage? One reshoot at a
   different time-of-day settles it." It does not, and finding out why is half the answer: THIS GAME
   HAS NO TIME OF DAY. G.sun.position is set once from SKY.sunPosDay and never moves; G.time drives
   wind phase and animation only, and the single thing that relocates the sun is nightApply's
   day->night lerp. Reshooting at G.time=8 and G.time=17 would have produced two identical frames
   and "settled" the question with a false negative.

   SO IT SEPARATES THE TWO CAUSES DIRECTLY INSTEAD. A specular hot spot needs three things — a light
   direction, a view direction and a roughness — and each can be moved on its own:
     B  ROUGHNESS UP, nothing else. If the spot dims and spreads, the material owns it.
     C  ENVMAP DOWN, nothing else. Separates the HDRI's contribution from the sun's.
     D  CAMERA MOVED, same material. A specular spot is a mirror of the light in the view
        direction, so it must MOVE across the water when the camera does. If it does not move, it
        is not specular at all and every roughness change is treating the wrong thing.
     E  NIGHT, which is the only thing in the game that does move the sun.
   Four one-variable experiments beat one confounded reshoot.

   IT MEASURES, IT DOES NOT JUDGE. Each frame is read by lum.mjs over the same two boxes — the whole
   water band and a tight box on the spot — so the table is comparable down a column. The verdict is
   Eric's; the numbers are so the verdict is about something. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';
import {lumStats} from './lum.mjs';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/capture');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* VANTAGE 38's OWN CAMERA AND BIRD, so this is the frame Eric was looking at and not a new one. */
const CAM=(x,y,z,lx,ly,lz)=>`KEAGAME.G.camLock={x:${x},y:${y},z:${z},lx:${lx},ly:${ly},lz:${lz}};`;
const CAM38=CAM(-17.0,3.2,17.0, -25.0,0.6,24.0);
const CAMMOVED=CAM(-33.0,3.2,17.0, -25.0,0.6,24.0);      // 16 m along the shore, same target
/* THE SAME QUIETING capture.mjs applies, because the first cut of this file did not and the whole
   diagnostic was wrong. The to-do star page was OPEN across the right 40% of every frame — a big
   flat cream panel — which is why columns x 600..960 came back identical to three decimals across a
   16 m camera move, and why raising the lake's roughness from 0.24 to 0.75 appeared to change the
   "water" mean by 0.001. Two thirds of the measured box was UI. An instrument that photographs the
   HUD and calls it water will confidently report that the material has nothing to do with it. */
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true);
  { const td=document.getElementById('todo'); if(td)td.style.display='none'; }
  KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false; KEAGAME.G.todoPinned=false;
  KEAGAME.G.humans.forEach(h=>{h._park=true;});
  { const _pk=()=>{ try{ KEAGAME.G.humans.forEach(h=>{ if(!h._park)return;
        h.x=46;h.z=46;h.home={x:46,z:46};h.patrol=null;h.state='idle';h.t=0;
        if(h.g)h.g.position.set(46,0,46); }); }catch(e){} requestAnimationFrame(_pk); };
    requestAnimationFrame(_pk); }
  { const fd0=document.getElementById('feed'); if(fd0)fd0.textContent='';
    const _pf=()=>{ try{ const fd=document.getElementById('feed');
      if(fd&&fd.firstChild)fd.textContent='';
      const td=document.getElementById('todo'); if(td)td.style.display='none';
    }catch(e){} requestAnimationFrame(_pf); }; requestAnimationFrame(_pf); }`;

const PIN=`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=true;
  { const _p=()=>{ try{ const f=KEAGAME.G.rivFloes&&KEAGAME.G.rivFloes[1];
      if(f){k.x=f.p.group.position.x;k.z=f.p.group.position.z;k.y=0.34;}
      k.vy=0;k.grounded=true;k.ry=2.4;k.stun=0;k.idleT=0;k.idleAct=null;KEAGAME.G.time=12.0;
    }catch(e){} requestAnimationFrame(_p); }; requestAnimationFrame(_p); }`;

/* THE TWO BOXES. The water band is the lake as it fills the frame; the spot box is the hot patch
   Eric is complaining about, and both are the SAME pixels in every variant. */
/* THE TWO BOXES, both entirely inside the lake and clear of the HUD pills top and bottom. Read off
   the frame after the quieting landed, not guessed: the lake's waterline crosses y~230 and the
   hint bar starts at y~496. */
const BOX={ band:{x0:0,y0:245,x1:960,y1:492}, spot:{x0:420,y0:340,x1:900,y1:492} };

const VARIANTS=[
  {id:'A_baseline',  cam:CAM38,    note:'as it ships'},
  {id:'B_rough075',  cam:CAM38,    note:'lake roughness 0.24 -> 0.75',
   tweak:`KEAGAME.G.rivLake.material.roughness=0.75;KEAGAME.G.rivLake.material.needsUpdate=true;`},
  {id:'C_env010',    cam:CAM38,    note:'lake envMapIntensity 0.55 -> 0.10',
   tweak:`KEAGAME.G.rivLake.material.envMapIntensity=0.10;KEAGAME.G.rivLake.material.needsUpdate=true;`},
  {id:'D_cammoved',  cam:CAMMOVED, note:'camera 16 m along the shore, material untouched'},
  {id:'E_night',     cam:CAM38,    note:'night — the only thing that moves the sun',
   tweak:`KEAGAME.G.night=true;KEAGAME.G.nightManual=true;KEAGAME.G.nightT=1;KEAGAME.nightApply(1);`},
];

let SRV=null;
async function origin(){ if(!SRV){ ensureBuild(); SRV=await serve();
  console.log('sunangle: built and serving '+SRV.origin); } return SRV.origin; }

async function shoot(v){
  const browser=await launch(); const page=await browser.newPage();
  await page.setViewport({width:960,height:540});
  await preparePage(page,{seed:GAUNTLETSEED,biome:'river'});
  await page.goto((await origin())+'/',{waitUntil:'load'});
  await assertBooted(page);
  await page.evaluate(`window.AudioContext=undefined;KEAGAME.startGame(1);`);
  await sleep(900);
  await page.evaluate(QUIET);
  await page.evaluate(PIN+v.cam);
  if(v.tweak)await page.evaluate(v.tweak);
  await sleep(1400);
  const p=path.join(OUT,'SUN_'+v.id+'.png');
  await page.screenshot({path:p});
  const sun=await page.evaluate(`(()=>{const s=KEAGAME.G.sun;
    return {pos:[s.position.x,s.position.y,s.position.z], intensity:s.intensity,
            rough:KEAGAME.G.rivLake.material.roughness,
            env:KEAGAME.G.rivLake.material.envMapIntensity,
            ibl:KEAGAME.G.ibl&&KEAGAME.G.ibl.mode};})()`);
  await browser.close();
  return {p,sun};
}

const rows=[];
for(const v of VARIANTS){
  const {p,sun}=await shoot(v);
  const band=lumStats(p,BOX.band), spot=lumStats(p,BOX.spot);
  rows.push({v,band,spot,sun});
  console.log('shot '+v.id);
}
if(SRV)await SRV.close();

console.log('\nBLOWOUT DIAGNOSTIC — vantage 38, the glacier lake');
console.log('  sun position '+JSON.stringify(rows[0].sun.pos)+'   IBL '+rows[0].sun.ibl+
  '   (fixed: G.time does not move it)');
console.log('');
console.log('  variant        rough  env    WATER BAND              HOT SPOT');
console.log('                               mean  clip%   hue      mean  clip%   max');
for(const r of rows)
  console.log('  '+r.v.id.padEnd(13)+'  '+String(r.sun.rough).padEnd(6)+
    String(r.sun.env).padEnd(6)+' '+r.band.mean.toFixed(3)+'  '+
    r.band.clipPct.toFixed(2).padStart(6)+'  '+String(Math.round(r.band.hue)).padStart(4)+'     '+
    r.spot.mean.toFixed(3)+'  '+r.spot.clipPct.toFixed(2).padStart(6)+'  '+
    String(Math.round(r.spot.max)).padStart(4));
for(const r of rows) console.log('  '+r.v.id.padEnd(13)+'  '+r.v.note);
