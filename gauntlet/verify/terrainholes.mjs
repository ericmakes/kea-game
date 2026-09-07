/* STEP 0 — IS THE HOLLOW LOOK THE FOG, OR ARE THERE REAL HOLES IN THE RING?
   Usage: node gauntlet/verify/terrainholes.mjs   ->  gauntlet/capture/HOLES_*.png

   Eric's instruction, and it is the right order: "one reshoot with fog disabled to settle whether
   the hollow look is purely fog or whether there are geometric gaps between massifs where sky shows
   through the ring - if real holes exist, fix the geometry before anything else."

   THE ANSWER WAS: REAL HOLES, and they were BACKFACE CULLING. terrainMesh's triangle winding was
   inside out, so every one of the 27648 vertex normals pointed down; the material is FrontSide, so
   every part of the range whose surface sat below the eye was culled and the sky behind it showed
   through. At eye level the range covered 17.6% of the frame; after the winding fix, 100%. The same
   bug was Eric's point 2 ("flat and unlit"): with the sun at (-0.696,0.636,0.333) only 0.62% of
   vertices had N.L > 0, so the range was receiving no diffuse sun at all. 99.38% after.

   THREE MEASUREMENTS, AND EACH ONE EXISTS BECAUSE AN EARLIER VERSION OF IT WAS FOOLED.

   1. NORMALS, read out of the page. The cheapest and the most direct: a winding is invisible until
      something measures it, which is precisely how it survived ten assertions about this mesh.

   2. COVERAGE, by HIDING THE RANGE AND DIFFING. A pixel counts as range only if removing the range
      changes it. This is the one coverage test with no colour threshold in it at all, so it cannot
      be argued with — but note what it does NOT say: a pixel with a TREE in front of the range also
      fails to change, so "gaps" from this test alone include every foreground occluder.

   3. SKY, by FOG INVARIANCE. Fog at r 64-190 shifts a rock pixel by tens of levels, and the sky
      background is not fogged at all, so a pixel identical between the fog-on and fog-off frames is
      background sky. THIS IS THE TEST THAT ANSWERS ERIC'S QUESTION, because a hole is not "no
      terrain here", it is "SKY here, below the ridge".
      TWO EARLIER DETECTORS WERE WRONG AND BOTH WERE WRONG BY BEING A COLOUR THRESHOLD:
        - walking down from the top of the frame to find the ridge, then looking for sky beneath it,
          with sky = blue-dominance. The white CLOUDS are not blue-dominant, so the walk stopped at
          a cloud and counted the real sky below it as a hole: 662 of 960 columns "failed".
        - the same blue-dominance test on the horizon row. Horizon sky is desaturated pale blue-grey
          (b-r = 19 against a threshold of 26), so it reported ZERO sky on a row that is 82% sky.
      Fog invariance has no threshold on colour, only on CHANGE, and clouds and horizon sky and
      water all behave correctly under it. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { execSync } from 'child_process';
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/capture');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const W=1920, H=620;

/* THE STRIP CAMERA, so this is measured at the vantage the range is judged from. */
const CAM=`KEAGAME.G.camLock={x:0,y:9,z:-46,lx:0,ly:26,lz:160};
  for(const c of KEAGAME.G.cams){ c.fov=26; c.updateProjectionMatrix(); }`;
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true);
  { const td=document.getElementById('todo'); if(td)td.style.display='none'; }
  KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
  { const _p=()=>{ try{
      KEAGAME.G.time=12.0;
      const fd=document.getElementById('feed'); if(fd)fd.textContent='';
      const td=document.getElementById('todo'); if(td)td.style.display='none';
      const k=KEAGAME.G.keas[0]; k.x=46;k.z=46;k.y=0;k.vy=0;k.stun=0;k.grounded=true;
    }catch(e){} requestAnimationFrame(_p); }; requestAnimationFrame(_p); }
  KEAGAME.G.poseLock=true;`;

/* THE EYE AND THE FRAME, kept as the numbers the camera is actually built from rather than as
   pixel constants, because every angle below is derived and a stale constant would be silent.
   The aim rises atan(17/206) = 4.716 deg, the FOV is 26 deg over H px, so level sight sits
   4.716 * H/26 px BELOW frame centre. */
const EY=9, PITCH=Math.atan2(26-EY, 160-(-46))*180/Math.PI;
const PXDEG=H/26, HZ=Math.round(H/2+PITCH*PXDEG);
const HFOV=2*Math.atan(Math.tan(13*Math.PI/180)*W/H)*180/Math.PI;

const SRV=serve();
async function shoot(name,{fogOff=false,hideRange=false,hideAll=false}={}){
  if(fogOff)process.env.KEASKY=JSON.stringify({fogDensityDay:0,fogDensityNight:0});
  else delete process.env.KEASKY;
  process.env.KEATERRAIN=JSON.stringify({recipe:'c'});
  const browser=await launch(); const page=await browser.newPage();
  await page.setViewport({width:W,height:H});
  await preparePage(page,{seed:GAUNTLETSEED,biome:'carpark'});
  await page.goto((await SRV).origin+'/',{waitUntil:'load'});
  await assertBooted(page);
  await page.evaluate('window.AudioContext=undefined;KEAGAME.startGame(1);');
  await sleep(900);
  await page.evaluate(QUIET); await page.evaluate(CAM);
  const st=await page.evaluate(`(()=>{
    const G=KEAGAME.G, m=G.terrainMesh;
    if(${hideRange})m.visible=false;
    /* THE BARE SKY: every mesh turned off EXCEPT the backdrop, so what is left is what the sky
       looks like with the world out of the way. That is the POSITIVE reference test 3 needs.
       BACKDROP IS WHAT DOES NOT TAKE FOG, and that is a property of the thing rather than a list of
       names to keep in step: this sky is a BackSide MeshBasicMaterial sphere of r 210 with a
       cylinder inside it, both material.fog === false, and the first version of this hid them along
       with everything else and photographed a BLACK FRAME. The calibration below caught it, which
       is the whole reason it is there. */
    let hid=0, kept=0;
    if(${hideAll})G.scene.traverse(o=>{
      if(!(o.isMesh||o.isInstancedMesh||o.isPoints||o.isLine))return;
      if(o.material&&o.material.fog===false){ kept++; return; }
      o.visible=false; hid++; });
    const n=m.geometry.attributes.normal.array, cnt=n.length/3;
    const L=G.sun.position.clone().normalize();
    let sy=0, dn=0, lit=0;
    for(let k=0;k<cnt;k++){ const ny=n[k*3+1]; sy+=ny; if(ny<=0)dn++;
      if(n[k*3]*L.x+ny*L.y+n[k*3+2]*L.z>0)lit++; }
    return {fog:G.scene.fog?G.scene.fog.density:null, recipe:G.terrain.recipe,
      vis:m.visible, hid, kept, verts:cnt, meanNy:sy/cnt, downward:dn, litFrac:lit/cnt,
      sun:L.toArray(), side:m.material.side, matFog:m.material.fog};
  })()`);
  await sleep(1300);
  const f=path.join(OUT,'HOLES_'+name+'.png');
  await page.screenshot({path:f});
  await browser.close();
  console.log('  '+name.padEnd(10)+'fog '+String(st.fog).padEnd(7)+' recipe '+st.recipe+
    '   range visible '+st.vis+(st.hid?'   meshes hidden '+st.hid+', backdrop kept '+st.kept:''));
  if(hideAll&&!st.hid)throw new Error('terrainholes: asked to hide every mesh and hid none');
  if(hideAll&&!st.kept)throw new Error('terrainholes: hid every mesh and kept no backdrop, so the '+
    'sky reference is a black frame. The backdrop is identified by material.fog === false.');
  if(fogOff&&st.fog)throw new Error('terrainholes: asked for no fog, page has density '+st.fog);
  if(hideRange&&st.vis)throw new Error('terrainholes: asked to hide the range and it is still visible');
  if(!st.matFog)throw new Error('terrainholes: the terrain material has fog OFF, which would make '+
    'the fog-invariance sky test call the whole range sky. The test below is only valid while '+
    'every fogged surface is actually fogged.');
  return {f,st};
}

const rgb=f=>execSync(`ffmpeg -v error -i "${f}" -vf format=rgb24 -f rawvideo -`,
  {maxBuffer:1<<28,encoding:'buffer'});

console.log('STEP 0 — the range at the strip camera. eye y '+EY+', aim +'+PITCH.toFixed(2)+
  ' deg, level sight at row y '+HZ+', HFOV '+HFOV.toFixed(1)+' deg');
ensureBuild();
const on   = await shoot('fog_on');
const off  = await shoot('fog_off',  {fogOff:true});
const bare = await shoot('no_range', {fogOff:true, hideRange:true});
const sky  = await shoot('sky_only', {fogOff:true, hideAll:true});
(await SRV).close();

/* ---- 1. NORMALS ---- */
const N=on.st;
console.log('');
console.log('1. NORMALS      '+N.verts+' vertices   mean n.y '+N.meanNy.toFixed(4)+
  '   pointing down '+N.downward);
console.log('   sun '+N.sun.map(v=>v.toFixed(3)).join(', ')+
  '   fraction of the range with N.L > 0  '+(N.litFrac*100).toFixed(2)+'%');
const NORMOK = N.downward===0 && N.meanNy>0.5 && N.litFrac>0.90;
console.log('   '+(NORMOK?'OK — the range faces up and receives the sun.'
  :'FAIL — an inside-out winding: the range cannot be lit and will be backface-culled.'));

/* ---- 2. COVERAGE, by hiding the range ---- */
const A=rgb(off.f), B=rgb(bare.f), C=rgb(on.f), S=rgb(sky.f);
const at=(bf,x,y)=>{const o=(y*W+x)*3;return [bf[o],bf[o+1],bf[o+2]];};
const cov=(x,y)=>{const p=at(A,x,y),q=at(B,x,y);
  return Math.abs(p[0]-q[0])>4||Math.abs(p[1]-q[1])>4||Math.abs(p[2]-q[2])>4;};
console.log('');
console.log('2. COVERAGE     a pixel counts as range only if removing the range changes it');
let atLevel=0; for(let x=0;x<W;x++)if(cov(x,HZ))atLevel++;
for(const d of [-6,-3,-1.5,0,1.5,3]){
  const y=Math.round(HZ+d*PXDEG); let n=0; for(let x=0;x<W;x++)if(cov(x,y))n++;
  console.log('   '+(d<0?d.toFixed(1)+' deg above':d===0?'   at eye level':
    '+'+d.toFixed(1)+' deg below').padEnd(16)+'y='+String(y).padStart(3)+'   '+
    String(n).padStart(5)+' px  '+(n/W*100).toFixed(1).padStart(5)+'%');
}

/* ---- 3. SKY BELOW THE RANGE, against a photograph of the bare sky ---- */
/* THE SKY IS DEFINED BY A PICTURE OF THE SKY. Every mesh off, one frame, and a pixel is sky if it
   matches that frame. No colour threshold, no fog reasoning, and clouds are handled for free
   because a cloud is a mesh and is therefore absent from the reference.
   THE FOURTH DETECTOR, AND THE THIRD ONE WAS ALSO WRONG. Fog invariance was a real improvement on
   blue-dominance — it got clouds, horizon haze and water right — but it identifies "sky OR
   NEAR-FIELD GEOMETRY", because fog barely touches anything close: at 10 m the FogExp2 factor is
   1-exp(-(0.0062*10)^2) = 0.38%, well under any usable tolerance. It reported 617 columns of holes,
   and every one of them sat 5.8-7.5 deg BELOW eye level reading [94,110,47] — the grass at the
   camera's feet. A test whose failures all cluster in one place is describing that place, not the
   thing it was pointed at. */
const TOL=6;
const isSky=(x,y)=>{const p=at(A,x,y),q=at(S,x,y);
  return Math.abs(p[0]-q[0])<=TOL&&Math.abs(p[1]-q[1])<=TOL&&Math.abs(p[2]-q[2])<=TOL;};
/* CALIBRATED EVERY RUN, because a sky test that has quietly stopped working must say so: the
   zenith is sky, and neither the ground at the camera's feet nor a cloud is. */
if(!isSky(Math.round(W/2),20))throw new Error('terrainholes: the sky test does not call the ZENITH '+
  'sky — it is not measuring what it claims');
if(isSky(Math.round(W/2),H-5))throw new Error('terrainholes: the sky test calls the GROUND UNDER '+
  'THE CAMERA sky — it is not measuring what it claims');
console.log('');
console.log('3. SKY BELOW THE RANGE   sky = a pixel matching a frame shot with every mesh hidden');
console.log('   ('+sky.st.hid+' meshes off, '+sky.st.kept+' backdrop kept), so haze and near ground cannot pose as sky)');
/* A HOLE IS SKY WITH *RANGE* ABOVE IT — which is why this needs BOTH tests and not either one.
   Defining the ridge as "the first pixel from the top that is not sky" brings the clouds straight
   back in through a third door: a cloud is not sky under fog invariance either, so open sky BELOW a
   cloud but ABOVE the ridge got counted as a hole and 32.6% of columns "failed" a frame whose
   eye-level row is 100% range. The range is the thing whose silhouette matters, so the range is
   what has to be overhead: test 2 says where the range is, test 3 says where the sky is. */
/* THE HUD STRIPS ARE NOT THE SCENE. The top and bottom 44 px are DOM, so they are byte-identical
   in every frame — which means they match the sky reference trivially and are unchanged by hiding
   the range. That put all 161 remaining "holes" in one place: y 580-595, inside the bottom strip,
   diff from the sky reference exactly 0. lum.mjs excludes the same two strips for the same reason;
   this is that exclusion, not a tolerance being loosened to get a green. */
const HUD=44;
let holeCols=[], skyAtLevel=0;
for(let x=0;x<W;x++){
  if(isSky(x,HZ))skyAtLevel++;
  let range=false, hole=false;
  for(let y=HUD;y<H-HUD;y++){
    if(cov(x,y))range=true;
    else if(range && isSky(x,y)){ hole=true; break; }
  }
  if(hole)holeCols.push(x);
}
let runs=[],r=0,prev=-9;
for(const x of holeCols){ if(x===prev+1)r++; else {if(r)runs.push(r); r=1;} prev=x; }
if(r)runs.push(r); runs.sort((a,b)=>b-a);
console.log('   sky ON the eye-level row            '+String(skyAtLevel).padStart(5)+' px  '+
  (skyAtLevel/W*100).toFixed(1)+'%    (range there: '+(atLevel/W*100).toFixed(1)+'%)');
console.log('   columns with sky below the RANGE    '+String(holeCols.length).padStart(5)+' of '+W+
  '   '+(holeCols.length/W*100).toFixed(1)+'%');
if(runs.length)console.log('   widest hole                        '+runs[0]+' px = '+
  (runs[0]/W*HFOV).toFixed(1)+' deg of azimuth');

const HOLESOK = skyAtLevel===0 && holeCols.length*1.0/W < 0.02;
const why=[];
if(!NORMOK)why.push('the winding is inside out — the range cannot be lit and is backface-culled');
if(skyAtLevel)why.push((skyAtLevel/W*100).toFixed(1)+'% of the EYE-LEVEL ROW is sky');
if(holeCols.length*1.0/W>=0.02)why.push((holeCols.length/W*100).toFixed(1)+
  '% of columns show sky BELOW the range, widest '+(runs[0]/W*HFOV).toFixed(1)+' deg');
console.log('');
console.log('VERDICT: '+(NORMOK&&HOLESOK
  ? 'the ring CLOSES. No sky at eye level, no holes through the range, and the range\n'+
    '         faces the sun — so the hollow look was the FOG and the flat look was the WINDING.'
  : 'REAL FAULTS — fix the geometry before anything else:\n         - '+why.join('\n         - ')));
process.exit(NORMOK&&HOLESOK?0:1);
