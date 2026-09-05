/* P5F — THE JUDGING STRIP. REPLAT P5F section 3: "Shoot the four judging angles (head, posture,
   folded, wings-open) for whichever path succeeds, alongside the same angles from our current
   kea_bill.glb, as a side-by-side strip. Eric picks."

   Both rows are the SAME MESH — kea_bill.glb, our geometry, unchanged. The only difference
   between the rows is where the colour comes from:
     row A (BEFORE)  the P5d2/P5e palette recolour: hue from KEABIRD.plume, detail from the
                     cockatoo texture's luminance. What ships today.
     row B (AFTER)   the Astra paint, baked onto our UV layout by proximity (P5F Path A fallback).
   Path A step one — a straight material swap of Astra's atlas onto our mesh — was measured and
   REJECTED before any of this; see the harness assertions and P5F's ledger row.

   Usage: node gauntlet/verify/p5f_strip.mjs
   Output: gauntlet/capture/P5F_astra_strip.png plus the eight source frames. */
import fs from 'fs'; import path from 'path';
import {ensureBuild,serve,preparePage,assertBooted,launch,ROOT} from './webrig.mjs';

const OUT=path.join(ROOT,'gauntlet','capture');
const W=560,H=560;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PIN=b=>`{const _p=()=>{try{${b}}catch(e){}requestAnimationFrame(_p);};requestAnimationFrame(_p);}`;
const CAM=(x,y,z,lx,ly,lz)=>`KEAGAME.G.camLock={x:${x},y:${y},z:${z},lx:${lx},ly:${ly},lz:${lz}};`;
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true);
  const td=document.getElementById('todo'); if(td)td.style.display='none';
  /* EVERY OVERLAY OFF. The ids are read out of index.html, not guessed — a guessed id fails
     silently and puts the HUD in the middle of a judging frame, which is exactly what the first
     take of this strip did. */
  const OVERLAYS=['topbar','chaos','combo','phud1','phud2','prompt1','prompt2','todo','todohint',
    'mutebtn','milist','feed','tour','tourback','splitline','hold1','hold2'];
  OVERLAYS.forEach(id=>{const e=document.getElementById(id); if(e)e.style.display='none';});
  const fd=document.getElementById('feed'); if(fd)fd.textContent='';
  KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
  KEAGAME.G.humans.forEach(h=>{h._park=true;});
  {const _k=()=>{try{KEAGAME.G.humans.forEach(h=>{if(!h._park)return;h.x=46;h.z=46;
      h.home={x:46,z:46};h.patrol=null;h.state='idle';h.t=0;if(h.g)h.g.position.set(46,0,46);});
      const f=document.getElementById('feed'); if(f&&f.firstChild)f.textContent='';
      /* RE-HIDDEN EVERY FRAME, not once. The game shows #todohint AFTER boot, so a single
         pass at stage time left "TAB — to-do list" across the bottom of every judging frame. */
      OVERLAYS.forEach(id=>{const e=document.getElementById(id);
        if(e&&e.style.display!=='none')e.style.display='none';});
      KEAGAME.G.time=12.0;}catch(e){}requestAnimationFrame(_k);};requestAnimationFrame(_k);}`;

/* THE FOUR ANGLES P5F NAMES. Each is the bird pinned every frame — the harness-side perch idiom,
   because a one-shot pose is undone by the settle. Same marks in both rows, so the only variable
   in the strip is the paint.

   THE CAMERA IS MEASURED OFF THE BIRD, NOT TYPED — the P5d lesson about posedUnits, applied to
   framing. Hand-typed camLock triples put the "side view" three-quarters onto the bird's face and
   the "head" shot underneath its feet, because the mark, the yaw and the model's own scale all
   feed into where a camera has to stand and none of them is visible from here. So each angle is a
   DIRECTION in the bird's own frame plus a distance in bird-radii; the stage measures the bird's
   world bounding box and its facing, then solves the triple. Re-measured per row, so if the two
   rows ever differ in size the framing follows rather than silently cropping one of them. */
const FRAME=(fwd,right,up,dist,aimUp,aimBone)=>`{
  const k=KEAGAME.G.keas[0];
  let mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  k.g.updateMatrixWorld(true);
  /* MEASURED OFF THE POSED SKELETON, NOT off geometry.boundingBox. A SkinnedMesh's geometry box
     is its BIND pose — this rig binds wings-SPREAD, 169.6 model units across — so the first take
     read R=1.144 m for a bird that stands 0.5 m and framed all eight shots from three metres.
     Bone world positions are the posed bird, which is the thing being photographed. */
  let bones=null;
  k.g.traverse(o=>{ if(o.isSkinnedMesh&&o.skeleton&&!bones)bones=o.skeleton.bones; });
  if(bones&&bones.length){
    for(const b of bones){ const e=b.matrixWorld.elements;
      const wx=e[12], wy=e[13], wz=e[14];
      if(wx<mn[0])mn[0]=wx; if(wx>mx[0])mx[0]=wx;
      if(wy<mn[1])mn[1]=wy; if(wy>mx[1])mx[1]=wy;
      if(wz<mn[2])mn[2]=wz; if(wz>mx[2])mx[2]=wz; }
  } else {
    /* the primitive bird has no skeleton — fall back to the group's meshes so this rig still
       frames SOMETHING rather than dividing by an empty box, and the readback says which. */
    k.g.traverse(o=>{ if(!o.isMesh)return; const g=o.geometry; if(!g)return;
      if(!g.boundingBox)g.computeBoundingBox();
      const bb=g.boundingBox, e=o.matrixWorld.elements;
      for(let i=0;i<8;i++){
        const x=(i&1)?bb.max.x:bb.min.x, y=(i&2)?bb.max.y:bb.min.y, z=(i&4)?bb.max.z:bb.min.z;
        const wx=e[0]*x+e[4]*y+e[8]*z+e[12], wy=e[1]*x+e[5]*y+e[9]*z+e[13], wz=e[2]*x+e[6]*y+e[10]*z+e[14];
        if(wx<mn[0])mn[0]=wx; if(wx>mx[0])mx[0]=wx;
        if(wy<mn[1])mn[1]=wy; if(wy>mx[1])mx[1]=wy;
        if(wz<mn[2])mn[2]=wz; if(wz>mx[2])mx[2]=wz; }});
  }
  const C=[(mn[0]+mx[0])/2,(mn[1]+mx[1])/2,(mn[2]+mx[2])/2];
  const R=Math.max(mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2])/2;
  /* the bird's own axes, off its world matrix. front is local -z, which the flight and tug code
     both already depend on — see the yaw note in bird.mjs. */
  const e=k.g.matrixWorld.elements;
  const nrm=v=>{const L=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/L,v[1]/L,v[2]/L];};
  const F=nrm([-e[8],-e[9],-e[10]]), Rt=nrm([e[0],e[1],e[2]]), U=[0,1,0];
  const d=R*${dist};
  const dir=nrm([F[0]*${fwd}+Rt[0]*${right}+U[0]*${up},
                 F[1]*${fwd}+Rt[1]*${right}+U[1]*${up},
                 F[2]*${fwd}+Rt[2]*${right}+U[2]*${up}]);
  /* AIM AT A NAMED BONE WHEN ONE IS GIVEN. The head shot aimed at the bounding-box centre puts
     the body in the middle of frame and the head in a corner — the bird is mostly not its head.
     The name comes from KEABIRD.bones, so it is the same string the rig binds by. */
  let aim=[C[0],C[1]+R*${aimUp},C[2]];
  const aimBone=${aimBone?JSON.stringify(aimBone):'null'};
  if(aimBone&&bones){ const b=bones.find(x=>x.name===aimBone);
    if(b){const e2=b.matrixWorld.elements; aim=[e2[12],e2[13],e2[14]];} }
  /* THE CAMERA IS OFFSET FROM THE AIM POINT, all three axes from the same anchor. The first cut
     took x and z from the box centre and y from the aim point, so any shot that aimed somewhere
     other than the centre — the head — was framed from a position on neither. */
  KEAGAME.G.camLock={x:aim[0]+dir[0]*d, y:aim[1]+dir[1]*d, z:aim[2]+dir[2]*d,
                     lx:aim[0], ly:aim[1], lz:aim[2]};
  window.__p5fFrame={C,R,aim,cam:KEAGAME.G.camLock,src:bones&&bones.length?'skeleton':'meshbox'};
}`;

/* THE BIRD IS FLOWN, NOT PERCHED, FOR ALL FOUR. The tussock is waist-high on a 0.5 m kea and the
   first take had grass across the bill in every frame — a judging strip whose subject is half
   occluded judges the grass. Holding it at 2.6 m clears the field entirely and gives both rows the
   same clean backdrop, so the ONLY difference left in the strip is the paint. grounded=false with
   vy pinned to 0 is the existing 04_flight_underwing idiom. */
const PERCH=(ry,extra)=>PIN(`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=2.6;k.vy=0;
  k.grounded=false;k.ry=${ry};k.stun=0;k.landFlare=0;k.preenT=99;k.idleT=0;k.idleAct=null;${extra||''}`);

const ANGLES=[
  /* head: front three-quarters, slightly above — the angle kea_head_01 is shot from */
  ['head',   'HEAD',        PERCH(1.9,'k.flapDrive=0;k.flapPh=0;'),
     FRAME( 0.78, 0.55, 0.26, 1.15, 0, 'cockatoo_Head_bone_06')],
  /* posture: pure side elevation, the plate the culmen ratio was measured against */
  ['posture','POSTURE',     PERCH(1.9,'k.flapDrive=0;k.flapPh=0;'),
     FRAME( 0.00, 1.00, 0.12, 3.10, 0.05)],
  /* folded: rear three-quarters from above — where the folded covert scalloping shows */
  ['folded', 'FOLDED WING', PERCH(1.9,'k.flapDrive=0;k.flapPh=0;'),
     FRAME(-0.55, 0.70, 0.45, 2.80, 0.05)],
  /* wings open: from in front and a little below, the only angle that shows the underwing */
  ['open',   'WINGS OPEN',  PERCH(1.9,'k.flapDrive=1;k.flapPh=0.36;'),
     FRAME( 0.94, 0.12,-0.18, 3.30, 0.00)],
];

const ROWS=[
  ['A_palette',{model:true},                    'BEFORE — palette recolour (ships today)'],
  ['B_astra',  {model:true,astraTex:{on:true}}, 'AFTER — Astra paint baked onto our mesh'],
];

/* ---- THE EYE, WHICH THE HARVEST TURNED INTO A QUESTION ----
   P5e added the eye-ring as GEOMETRY, on P5E.md's own terms: "add a small ring geometry if the
   texture route fights the UVs", and it did, because the cockatoo atlas has no locatable eye.
   Astra's paint HAS one. So with both on, our kea has two eyes on each side of its head — which
   is not a taste question, it is a defect, and which one to keep IS a taste question. Both are
   shot so Eric decides on the picture rather than on this paragraph. */
const EYE=[
  ['eye_ringon', {model:true,astraTex:{on:true}},                 'ring ON — the painted eye AND the P5e ring'],
  ['eye_ringoff',{model:true,astraTex:{on:true},plume:{eyeR:0}},  'ring OFF — Astra\'s painted eye alone'],
];

ensureBuild();
const srv=await serve();
const shots={};
for(const [rowKey,birdCfg,label] of ROWS){
  process.env.KEABIRD=JSON.stringify(birdCfg);
  const browser=await launch();
  try{
    for(const [aKey,,stage,frame] of ANGLES){
      const page=await browser.newPage();
      await page.setViewport({width:W,height:H,deviceScaleFactor:1});
      await preparePage(page);
      const errs=[]; page.on('pageerror',e=>errs.push(e.message.split('\n')[0]));
      await page.goto(srv.origin+'/',{waitUntil:'load'});
      await assertBooted(page);
      await page.evaluate(()=>{window.AudioContext=undefined;KEAGAME.startGame(1);});
      await sleep(500);
      await page.evaluate(QUIET+stage);
      await sleep(900);                 // let the pin settle before the box is measured
      await page.evaluate(frame);       // measure the bird, then solve the camera
      await sleep(700);
      /* THE BIRD STATE IS READ BACK AND PRINTED, not assumed. A frame that photographed the
         primitive bird, or the palette when the strip claims Astra, would look plausible and be
         the whole judgement wrong. */
      const g=await page.evaluate(()=>({mode:KEAGAME.G.bird&&KEAGAME.G.bird.mode,
        paint:KEAGAME.G.bird&&KEAGAME.G.bird.paint,
        astra:KEAGAME.G.bird&&KEAGAME.G.bird.astra&&KEAGAME.G.bird.astra.ok,
        why:KEAGAME.G.bird&&(KEAGAME.G.bird.why||(KEAGAME.G.bird.astra||{}).why)}));
      const f=path.join(OUT,`P5F_${rowKey}_${aKey}.png`);
      await page.screenshot({path:f});
      shots[rowKey+'/'+aKey]=f;
      const fr=await page.evaluate(()=>window.__p5fFrame||null);
      console.log(`${rowKey} ${aKey}  bird=${g.mode} paint=${g.paint} astraLoaded=${g.astra}`+
        (fr?`  R=${fr.R.toFixed(3)}m(${fr.src})`:'  NO FRAME')+
        (g.why?' why='+g.why:'')+(errs.length?'  PAGEERR: '+errs[0]:''));
      if(g.mode!=='model') throw new Error(`${rowKey}/${aKey} did not photograph the MODEL bird (${g.why||'?'})`);
      const wantPaint=birdCfg.astraTex?'astra-baked':'palette';
      if(g.paint!==wantPaint) throw new Error(`${rowKey}/${aKey} photographed paint='${g.paint}', wanted '${wantPaint}'`);
      await page.close();
    }
  } finally { await browser.close(); }
}
/* the eye pair: one angle, pure side of the head, where an eye is unambiguous */
const EYEFRAME=FRAME(0.10,1.00,0.10,1.05,0,'cockatoo_Head_bone_06');
for(const [key,birdCfg,label] of EYE){
  process.env.KEABIRD=JSON.stringify(birdCfg);
  const browser=await launch();
  try{
    const page=await browser.newPage();
    await page.setViewport({width:W,height:H,deviceScaleFactor:1});
    await preparePage(page);
    await page.goto(srv.origin+'/',{waitUntil:'load'});
    await assertBooted(page);
    await page.evaluate(()=>{window.AudioContext=undefined;KEAGAME.startGame(1);});
    await sleep(500);
    await page.evaluate(QUIET+PERCH(1.9,'k.flapDrive=0;k.flapPh=0;'));
    await sleep(900);
    await page.evaluate(EYEFRAME);
    await sleep(700);
    const g=await page.evaluate(()=>({paint:KEAGAME.G.bird&&KEAGAME.G.bird.paint,
      eyes:KEAGAME.G.bird&&KEAGAME.G.bird.eyes||0}));
    const f=path.join(OUT,`P5F_${key}.png`);
    await page.screenshot({path:f});
    shots[key]=f;
    console.log(`${key}  paint=${g.paint} eyeMeshes=${g.eyes}`);
    if(g.paint!=='astra-baked') throw new Error(key+' did not photograph the baked paint');
    await page.close();
  } finally { await browser.close(); }
}
await srv.close();
console.log('\nframes shot. compositing…');

/* ---- THE COMPOSITE. Same idiom as sidebyside.mjs: a page of <img> and a screenshot, because a
   font is the one thing a hand-rolled PNG writer cannot do and every panel here needs a label. */
const b64=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const CW=380, CH=380;
const cell=(f,cap)=>`<div style="display:flex;flex-direction:column;min-width:0">
  <img src="${b64(f)}" style="width:${CW}px;height:${CH}px;object-fit:cover;display:block;background:#000">
  ${cap?`<div style="color:#8a8a92;font:600 12px/1.5 -apple-system,sans-serif;padding:5px 2px 0">${cap}</div>`:''}
</div>`;
const rowLabel=t=>`<div style="color:#ffd23f;font:700 15px -apple-system,sans-serif;padding:14px 0 7px">${t}</div>`;
const html=`<body style="margin:0;background:#131316;padding:24px 26px;width:${CW*4+3*10+52}px">
  <div style="color:#fff;font:800 26px -apple-system,sans-serif">P5F — THE ASTRA HARVEST</div>
  <div style="color:#9a9aa4;font:400 14px/1.65 -apple-system,sans-serif;padding:8px 0 2px;max-width:1200px">
    Both rows are the SAME MESH: <b style="color:#ddd">kea_bill.glb</b>, our geometry, our rig, 4,927 triangles — unchanged.
    The only difference is where the colour comes from. Astra's atlas could NOT be swapped on directly
    (measured: mean per-region colour error <b style="color:#ff8a6b">72.3</b> against a control floor of 0.4);
    its paint was <b style="color:#ddd">baked onto our UV layout by proximity</b>, which lands at <b style="color:#7fd18a">3.5</b>.
  </div>
  ${rowLabel('ROW A — BEFORE: the P5d2/P5e palette recolour. Hue from KEABIRD.plume, detail from the cockatoo texture\'s luminance. This is what ships today.')}
  <div style="display:flex;gap:10px">${ANGLES.map(a=>cell(shots['A_palette/'+a[0]],a[1])).join('')}</div>
  ${rowLabel('ROW B — AFTER: Astra\'s painted feathers, baked onto our mesh. Real scalloping, green coverts, slate bill — the thing the palette route could not synthesise.')}
  <div style="display:flex;gap:10px">${ANGLES.map(a=>cell(shots['B_astra/'+a[0]],a[1])).join('')}</div>
  ${rowLabel('OPEN QUESTION — THE EYE. Astra\'s paint carries its own eye; P5e added one as geometry because the cockatoo atlas had none. Both on = two eyes. Which one stays is Eric\'s call.')}
  <div style="display:flex;gap:10px">
    ${cell(shots['eye_ringon'],'ring ON — painted eye AND the P5e gold ring')}
    ${cell(shots['eye_ringoff'],'ring OFF — Astra\'s painted eye alone')}
    <div style="width:${CW*2+10}px;color:#9a9aa4;font:400 13px/1.7 -apple-system,sans-serif;padding-left:14px">
      <b style="color:#ddd">The head is also the bake's worst region</b> — residual 18.3 against a
      3.5 mean, second only to the lower mandible at 20.0. Both are exactly where our geometry
      differs most from Astra's: P5d took the crest OFF our crown and P5e lengthened our bill, so
      proximity has the least to work with there. That is why the painted eye does not sit quite
      where the P5e ring does.<br><br>
      <b style="color:#ddd">Nothing here ships yet.</b> KEABIRD.astraTex.on is false by default, exactly
      as KEABIRD.model is. Every pinned vantage and all nine batteries still see the bird they were
      calibrated on.
    </div>
  </div>
</body>`;
{
  const browser=await launch();
  const page=await browser.newPage();
  await page.setViewport({width:CW*4+3*10+52+40,height:200,deviceScaleFactor:1});
  await page.setContent(html,{waitUntil:'load'});
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  const out=path.join(OUT,'P5F_astra_strip.png');
  await page.screenshot({path:out,fullPage:true});
  await browser.close();
  console.log('STRIP -> '+path.relative(ROOT,out));
}
