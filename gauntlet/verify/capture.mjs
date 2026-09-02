/* KEA GAUNTLET PHOTOGRAPHER v2 — built on the proven probe skeleton.
   In-container: @sparticuz/chromium + puppeteer-core, local three.js via interception.
   On a real machine with `npm i puppeteer` it falls back automatically. */
import fs from 'fs'; import path from 'path'; import url from 'url'; import os from 'os';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/capture'); fs.mkdirSync(OUT,{recursive:true});
const THREE_LOCAL=fs.readFileSync(path.join(ROOT,'node_modules/three/build/three.min.js'));
const HTML='file://'+path.join(ROOT,'untitled-kea-game.html');
// SEEDED WORLD (2026-08-28): the game seeds nothing, so every load builds a different country.
// three draws 12 randoms per mesh from the same stream, so a global Math.random seed alone lets any
// added object reshuffle the whole world. Seed the game rng at its own boot instead.
// TODO 36: the rig photographs a NAMED biome. Default carpark, so every existing baseline is a
// carpark baseline and nothing about the pinned set changes until somebody asks for another map.
/* TODO 39: A VANTAGE NAMES ITS OWN MAP. There are two maps now, so the biome cannot be one global
   for the whole pass - the ski field vantages at the bottom of this file are shot in the ski field
   and every carpark baseline is shot in the carpark, in one run. BIOME is still the DEFAULT, so a
   shot that says nothing lands exactly where it always did and no pinned frame moves. One seeded
   temp copy per biome, written once and reused. */
const BIOME=(process.env.BIOME||'carpark').replace(/[^a-z0-9_]/gi,'');
const RAWSRC=fs.readFileSync(path.join(ROOT,'untitled-kea-game.html'),'utf8');
const seeded=(()=>{ const cache={}; return b=>{
  if(!cache[b]){ const anchor='if(!HEADLESS)boot();';
    if(RAWSRC.split(anchor).length!==2) throw new Error('capture: boot anchor missing from the game file');
    const p=path.join(os.tmpdir(),'kea-seeded-capture-'+b+'.html');
    fs.writeFileSync(p,RAWSRC.replace(anchor,"if(!HEADLESS){setSeed(20260828);boot({biome:'"+b+"'});}"));
    cache[b]='file://'+p; }                 // a real navigation, so evaluateOnNewDocument still fires
  return cache[b]; }; })();
const ONLY=(process.env.SHOTS||'').split(',').filter(Boolean);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function launch(){
  try{ const p=await import('puppeteer');
    try{ return await p.default.launch({headless:true,args:['--no-sandbox']}); }
    catch(e){ return await p.default.launch({headless:true,channel:'chrome',args:['--no-sandbox']}); } } // bundled chrome is unsigned on some macs
  catch(e){ const chromium=(await import('@sparticuz/chromium')).default;
    const p=await import('puppeteer-core');
    return p.default.launch({executablePath:await chromium.executablePath(),
      args:[...chromium.args,'--no-sandbox'],headless:true}); }
}
const BOOT=`window.AudioContext=undefined; KEAGAME.startGame(1);`;
const BOOTCOL=`window.AudioContext=undefined; KEAGAME.startGame(1,{colossal:true});`;

async function shot(name,stage,opts){
  if(ONLY.length&&!ONLY.some(o=>name.startsWith(o)))return;
  const o=opts||{};
  const browser=await launch();
  const page=await browser.newPage();
  // DETERMINISM (2026-08-28): the world is built from Math.random at page load, before any
  // evaluate can seed it. Without this the same build reshoots at ssim 0.82 and the tripwire is noise.
  await page.evaluateOnNewDocument(()=>{ let t=20260828>>>0;
    Math.random=()=>{ t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t); r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; });
  await page.setViewport({width:o.w||960,height:o.h||540,deviceScaleFactor:1});
  await page.setRequestInterception(true);
  page.on('request',r=>{ if(/three(\.min)?\.js/.test(r.url()))r.respond({contentType:'application/javascript',body:THREE_LOCAL});
    else if(/fonts\./.test(r.url()))r.respond({contentType:'text/css',body:''}); else r.continue(); });
  await page.goto(seeded(o.biome||BIOME),{waitUntil:'load'}); await sleep(1000);
  await page.evaluate(o.colossal?BOOTCOL:BOOT); await sleep(500);
  await page.evaluate(QUIET);
  if(o.colossal){ await page.evaluate(`for(let i=0;i<9;i++)KEAGAME.award(300,'CAR: BUNTED',{x:0,y:1,z:0});`); await sleep(500); }
  await page.evaluate('{'+stage+'}'); await sleep(o.settle||900);
  await page.screenshot({path:path.join(OUT,name+'.png')});
  await browser.close();
  console.log('shot',name);
}
async function shotR(name,stage,opts){ // SwiftShader is moody: up to 3 takes per photograph
  for(let a=1;a<=3;a++){ try{ await shot(name,stage,opts); return; }
    catch(e){ console.log('retake',name,a); await sleep(400); } }
  console.log('GAVE UP',name);
}
// SUBJECT STAGING (2026-08-31): four showcase vantages had no subject in them. The bird flies
// out of frame during the settle, so a one-shot stage cannot hold it. PIN re-applies the pose
// every animation frame for as long as the page lives - the harness-side perch idiom (law 7).
const PIN=body=>`{ const _pin=()=>{ try{ ${body} }catch(e){} requestAnimationFrame(_pin); }; requestAnimationFrame(_pin); }`;
const CAM=(x,y,z,lx,ly,lz)=>`KEAGAME.G.camLock={x:${x},y:${y},z:${z},lx:${lx},ly:${ly},lz:${lz}};`;
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true); const td=document.getElementById('todo'); if(td)td.style.display='none'; KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
  // LAW 4, and QUIET was breaking it: parking a human ONCE does not hold, because the ambient AI
  // walks them straight back. Measured on vantage 02 - dave sits at (46,46) at stage time and is
  // at (-19.2,-4.2), in frame beside the hut, 900ms later. Whether he arrived before the shutter
  // depended on the machine, which is the whole 0.9899 of that vantage. Re-park every frame,
  // state included. A vantage that WANTS a human on set clears _park before staging them.
  KEAGAME.G.humans.forEach(h=>{h._park=true;});
  { const _pk=()=>{ try{ KEAGAME.G.humans.forEach(h=>{ if(!h._park)return;
        h.x=46; h.z=46; h.home={x:46,z:46}; h.patrol=null; h.state='idle'; h.t=0;
        if(h.g)h.g.position.set(46,0,46); }); }catch(e){}
      requestAnimationFrame(_pk); }; requestAnimationFrame(_pk); }
  KEAGAME.G.trafT.a=999;KEAGAME.G.trafT.b=999;
  for(let i=KEAGAME.G.cars.length-1;i>=0;i--){const c=KEAGAME.G.cars[i];if(c.traffic){KEAGAME.G.scene.remove(c.g);const ci=KEAGAME.G.colliders.indexOf(c.collider);if(ci>=0)KEAGAME.G.colliders.splice(ci,1);for(let q=KEAGAME.G.inter.length-1;q>=0;q--)if(KEAGAME.G.inter[q].car===c)KEAGAME.G.inter.splice(q,1);KEAGAME.G.cars.splice(i,1);}}`;

await shotR('01_carpark_wide',`const k=KEAGAME.G.keas[0];k.x=4;k.z=16;k.y=0;k.grounded=true;k.ry=2.4; ${CAM(11,4.2,25,3.5,0.8,15.5)}`);
await shotR('02_hut_snow',`const k=KEAGAME.G.keas[0];k.x=-24;k.z=-2.5;k.y=0;k.grounded=true;k.ry=Math.PI; ${CAM(-16,4.5,3,-24,2.6,-8)}`);
await shotR('03_kea_plate',`const k=KEAGAME.G.keas[0];k.preenT=99;k.idleT=0;KEAGAME.G.poseLock=true;
  ${PIN('k.preenT=99;k.idleT=0;k.idleAct=null;k.x=0;k.z=0;k.y=KEAGAME.groundHeightAt(0,0,1);k.vy=0;k.grounded=true;k.ry=1.9;k.stun=0;KEAGAME.G.time=12.0;')}
  ${CAM(1.35,0.95,1.15,0,0.55,0)}`);
// the bird sat above the HUD band, behind the chaos chip. Pin it mid-air at the top of the
// upstroke: flapPh PI/2 gives sst=1, which is both max stroke and open=1.0, and open above
// 0.25 is the only thing that makes the scarlet underwing panel (oPan) visible at all.
await shotR('04_flight_underwing',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=false;
  KEAGAME.press(KEAGAME.P1MAP.flap);
  ${PIN('k.x=0;k.z=0;k.y=3.2;k.vy=0;k.grounded=false;k.ry=0.4;k.flapDrive=1;k.flapPh=0.36;k.stun=0;k.landFlare=0;')}
  ${CAM(0.6,1.2,1.5,0,3.12,0)}`,{settle:900});
await shotR('05_tussock_ground',`const k=KEAGAME.G.keas[0];
  ${PIN('k.x=-8;k.z=-24;k.y=0;k.vy=0;k.grounded=true;k.ry=0.6;k.stun=0;k.idleT=0;k.idleAct=null;KEAGAME.G.time=12.0;')}
  ${CAM(-8,1.0,-19.5,-14,3.5,-60)}`);
await shotR('06_skyline',CAM(0,3.2,10,-40,16,-120));
// QUIET deletes every traffic car, so the jam vantage was an empty road. spawnTraffic is not
// exported and the game file is out of scope for this piece, so drive the game OWN spawner:
// zero its timers, tick, and clear the spawn mouth each time so the next car is let in (it
// refuses to spawn within 7 units of an existing car of the same direction). Then jam them.
await shotR('07_jam',`const G=KEAGAME.G;
  const SLOT=[[-1.5,32.2,1],[5.6,32.2,1],[12.8,32.2,1],[2.0,35.8,-1],[10.2,35.8,-1]];
  const held=[];
  for(let n=0;n<200&&held.length<SLOT.length;n++){
    G.trafT.a=0; G.trafT.b=0; KEAGAME.update(1/60);
    for(const c of G.cars){ if(!c.traffic||held.indexOf(c)>=0)continue;
      const s=SLOT[held.length]; if(!s)break;
      c.x=s[0]; c.z=s[1]; c.speed=0; c.dir=s[2];
      c.g.position.set(c.x,c.g.position.y,c.z);
      c.g.rotation.y=s[2]>0?-Math.PI/2:Math.PI/2;
      if(c.collider){c.collider.x=c.x;c.collider.z=c.z;}
      held.push(c); } }
  G.trafT.a=999; G.trafT.b=999;
  // STAGE THE BODY COLOUR. spawnTraffic picks it with pick(), which draws Math.random, so the
  // queue changed from blue to white the moment an unrelated piece shifted that stream - and it
  // took subjects.mjs going red to notice. The photographer stages its subject (piece 4), so the
  // colour is staged too: fresh material per car, applied ONLY to the meshes that shared this car
  // body material inside its own bodyG, which leaves bumpers, glass and lamps alone. mat() stores
  // linear, so convert to match.
  for(const c of held){ const bg=c.bodyG; if(!bg||!bg.children.length)continue;
    const src=bg.children[0].material; if(!src)continue;
    const body=new THREE.MeshStandardMaterial({color:new THREE.Color(0x3E6484).convertSRGBToLinear(),
      roughness:src.roughness, metalness:src.metalness, envMapIntensity:src.envMapIntensity});
    bg.traverse(o=>{ if(o.isMesh&&o.material===src)o.material=body; }); }
  const cone=G.props.find(p=>p.cone&&!p.heldBy); if(cone){cone.x=1.2;cone.z=34.0;cone.y=0.06;cone.mesh.position.set(cone.x,cone.y,cone.z);}
  ${PIN('for(const c of G.cars){ if(c.traffic){c.speed=0;c.rootCause="kea";} } const k=G.keas[0];k.x=-4.3;k.z=34.0;k.y=0;k.vy=0;k.grounded=true;k.ry=1.57;k.stun=0;')}
  ${CAM(-8.6,1.7,34.0,3.0,1.15,34.0)}`);
/* 08 IS LEFT ALONE ON PURPOSE (TODO 51, session 8). It is the vantage this item is named for, and
   the PIN it asks for does NOT fix it - measured: unpinned it runs 0.9978/0.9978/0.9978/0.9995 over
   four sweeps of five takes, and pinned it runs 1.0000/0.9879/0.9983, which is no better and one
   sweep worse. The probe says why nothing else here will help either: staged and pinned, five takes
   report the bird, both prompt strings, the wrapped line counts, the docked flag, the plate height
   and the chaos readout ALL IDENTICAL, with only the frame count moving (140 to 142). Everything
   this rig can name is already deterministic. What is left is dt-driven per-frame accumulation on a
   320x180 canvas where two frames of drift is a visible number of pixels, and the fix for that is a
   deterministic frame clock for the whole rig, which is TODO 33 and re-pins every vantage.
   Classified review-tier under FLAKES law 8 rather than pinned for the sake of pinning: changing a
   baseline frame that buys no measured stability is a cost with no purchase. */
await shotR('08_readability_320',`const k=KEAGAME.G.keas[0];k.x=4;k.z=16;k.y=0;k.grounded=true;k.ry=2.6; ${CAM(8,3.4,22,2,0.8,14)}`,{w:320,h:180});
// the colossal bird wandered during the settle - colossal stomps and bunts fire on contact and
// the score pump had already put it in a mood. Pin it, and bring the camera in so LV10 reads
// as colossal AGAINST the cars instead of as a speck.
await shotR('09_colossal',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=true;
  ${PIN('k.x=1.2;k.z=20.0;k.y=0;k.vy=0;k.grounded=true;k.ry=1.0;k.stun=0;')}
  ${CAM(5.8,2.9,25.2,1.2,1.3,19.6)}`,{colossal:true});
await shotR('10_skifield',`const k=KEAGAME.G.keas[0];k.x=-37;k.z=-36;k.y=0;k.grounded=true;k.ry=3.9; ${CAM(-28,5,-27,-40,1.6,-40)}`);
await shotR('11_trailhead',`const k=KEAGAME.G.keas[0];k.x=42;k.z=-37;k.y=0;k.grounded=true;k.ry=0.8; ${CAM(33,4.5,-30,44,1.8,-40)}`);
await shotR('21_night_camp',`KEAGAME.G.night=true;KEAGAME.G.nightManual=true;KEAGAME.G.nightT=1;KEAGAME.nightApply(1);
  const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=true;
  ${PIN('k.x=34.7;k.z=-5.3;k.y=0;k.vy=0;k.grounded=true;k.ry=2.7;k.stun=0;KEAGAME.G.time=12.0;KEAGAME.G._fireSpit=5;')}
  ${CAM(38.2,1.7,-3.2,34.6,0.7,-6.4)}`);
await shotR('22_torch_beam',`KEAGAME.G.night=true;KEAGAME.G.nightManual=true;KEAGAME.G.nightT=1;KEAGAME.nightApply(1);
  const G=KEAGAME.G,k=G.keas[0];G.poseLock=true;
  const rex=G.humans.find(h=>h.key==='rex'); if(rex)rex._park=false;
  for(let i=0;i<3;i++)KEAGAME.update(1/60);
  ${PIN("k.x=0;k.z=14;k.y=0;k.vy=0;k.grounded=true;k.ry=3.1;k.stun=0;"+
        "if(rex){rex.x=0;rex.z=8;rex.ry=0;rex.state='chase';rex.t=0;rex.patrol=null;rex.g.position.set(0,0,8);"+
        "if(rex.torch){rex.torch.g.rotation.y=0;rex.torch.spot.intensity=2.6;rex.torch.lens.visible=true;}}")}
  ${CAM(5.5,1.7,10.5,0,0.9,11)}`);
await shotR('20_dead_rear',`const k=KEAGAME.G.keas[0];k.x=-9.55;k.z=10.15;k.y=0;k.grounded=true;k.ry=Math.atan2((-11)-(-9.55),8-10.15);KEAGAME.G.poseLock=true; const c=KEAGAME.G.cams&&KEAGAME.G.cams[0]; if(c){c.position.set(k.x-Math.sin(k.ry)*1.7, 1.1, k.z-Math.cos(k.ry)*1.7);}`);
// 19 used to set cams[0].position directly, so the follow cam spent the whole settle lerping
// away from it and the frame landed wherever the machine frame count left it (0.985 against
// itself). camLock holds the SAME geometry the direct set was reaching for - eye at
// bird - forward*4.2 + 2.0 up, target at bird + forward*1.6, head height - and PIN holds the
// bird, which was parked on the roof with nothing stopping gravity or the roof logic moving it.
await shotR('19_roof_follow',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=true;
  ${PIN('k.x=-24;k.z=-7.4;k.y=5.2;k.vy=0;k.grounded=true;k.ry=2.6;k.stun=0;')}
  ${CAM(-24-Math.sin(2.6)*4.2, 7.2, -7.4-Math.cos(2.6)*4.2, -24+Math.sin(2.6)*1.6, 5.92, -7.4+Math.cos(2.6)*1.6)}`);
await shotR('18_rear_close',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=false;k.x=-9.2;k.z=10.6;k.y=0;k.grounded=true;k.ry=5.8;k.stun=0;k.idleT=0;k.idleAct=null; ${CAM(-8.6,1.5,12.4,-9.6,0.5,9.4)}`);
// same escape as 04. flapPh 1.1 sits just past the top of the stroke so the wings read
// mid-beat rather than pinned at a limit.
/* TODO 53, AND THE SESSION-7 DIAGNOSIS IT WAS FILED ON WAS WRONG. That report said the fix was to
   give this vantage the {settle:900} that 04 passes. It is not: shot() already reads
   `o.settle||900`, so 900 IS the default and 04 passing it explicitly is a no-op. The two vantages
   have always had the same settle, and the 0.9024 that started this was simply the worst sample of
   a frame that sits between 0.979 and 0.993 - measured three times at five takes on the unchanged
   build, while 04 came back 0.9974 to 0.9999 on the same runs.
   WHAT IT ACTUALLY IS, read off the rig rather than guessed: five takes reported the bird IDENTICAL
   at read time - flapPh, flapDrive, y, ry, and the wing transform agreeing to nine decimal places -
   while G.time came back between 2.3509 and 2.3843. The bird was never the variable. The ground was.
   TODO 30 measured the same thing from the other end: the grass shader sways on uTime, so every
   grass-filled frame varies with how many animation frames the settle got through, and this camera
   looks down across the tussock from three metres up. Pinning G.time is the law-12 idiom that 21 and
   25 already use locally. Measured after: 0.9998, 0.9993, 0.9998 - three sweeps of five takes.
   ONE VANTAGE ONLY, per the brief. Doing it in QUIET for the whole set is TODO 30 and re-pins
   everything, which is a judged call and not this one.
   TODO 54, DONE 2026-09-02: THE flapDrive PIN IS INERT AND THIS FRAME WAS A GLIDE. The PIN chain is
   registered after the game loop, so it runs after update() and render(): the game zeroed flapDrive
   every frame because the flap key was not held, and the pinned 1 never reached an animate() call.
   The press line above is the fix, the same one 04 has always had - the GAME sets flapDrive, so the
   pose is the real flap branch.
   AND THE PROOF THE BRIEF ASKED FOR CANNOT BE THE ONE IT NAMED. TODO 54 says to assert flapDrive is
   1 at read time; it ALREADY read 1 while inert, because the PIN writes it back after render. Read
   the pose instead. Five takes, before and after, off a probe that is this file with the shutter
   swapped for a state read, so the staging cannot drift from the rig:
     head.rotation.x  -0.200 -> -0.100   (H.rotation.x = flapDrive ? -0.1 : -0.2, assigned not
                                          lerped, so it is exactly what animate last saw)
     wing.rotation.z  -0.300 -> -1.171   (the glide constant, gone)
     wing.rotation.x   0.000 -> -0.120
     wing open         1.000 ->  0.998
     _beatT           absent ->  0.02-0.04  (the flap audio cadence, game-owned and NOT pinned)
   Stability after, three sweeps of five takes: 0.9997, 0.9972, 0.9976, bar 0.995.
   NOT RE-PINNED - the wings go from glide to mid-downstroke and that is Eric judgement, per the
   brief. And the frame reads 0.9826 against the old baseline, which diff.mjs does not flag at 0.965
   even though the bird box alone moved to 0.639: a subject that fills a twentieth of the frame can
   change completely without the drift detector noticing. Filed as TODO 57. */
await shotR('17_flight',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=false;
  KEAGAME.press(KEAGAME.P1MAP.flap);
  ${PIN('k.x=0;k.z=0;k.y=3.0;k.vy=0;k.grounded=false;k.flapDrive=1;k.flapPh=1.1;k.ry=2.2;k.stun=0;k.landFlare=0;KEAGAME.G.time=12.0;')}
  ${CAM(2.35,3.15,2.1,0,3.0,0)}`);
// a human opted OUT of the park is a human the ambient AI owns again, so law 4 applies to her
// directly: pin position AND state every frame, not once.
await shotR('16_trish',`const t=KEAGAME.G.humans.find(h=>h.key==='trish'); t._park=false;
const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=true;
  ${PIN("t.x=15;t.z=-10.5;t.ry=0;t.state='idle';t.t=0;t.patrol=null;t.g.position.set(15,0,-10.5);"+
        "k.x=11;k.z=-7;k.y=0;k.vy=0;k.grounded=true;k.ry=2.2;k.stun=0;")}
  ${CAM(13.2,1.75,-8.2,15,1.15,-10.6)}`);
await shotR('14_player_view',`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0;k.grounded=true;k.ry=2.2;k.stun=0;k.landFlare=0;k.vy=0;KEAGAME.G.poseLock=true; ${CAM(-4.38,2.3,3.18,0,0.9,0)}`);
await shotR('15_sign',`const k=KEAGAME.G.keas[0];const sg=KEAGAME.G.signG; k.x=sg.position.x-0.6;k.z=sg.position.z+2.2;k.y=0;k.grounded=true;k.ry=2.9;KEAGAME.G.poseLock=true; ${CAM('sg.position.x','2.0','sg.position.z+3.4','sg.position.x','1.8','sg.position.z')}`);
await shotR('13_idle_preen',`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0;k.grounded=true;k.ry=2.2;k.stun=0;k.landFlare=0;k.vy=0;KEAGAME.G.poseLock=false;k.idleT=99;k.idleAct={kind:'preen',t:0.7,dur:3.5,side:1};k._idleEver=true; ${CAM(1.35,0.95,1.15,0,0.55,0)}`);
await shotR('12_seal_midpeel',`{const t=KEAGAME.G.inter.find(x=>x.strip&&/DOOR SEAL/.test(x.label)); for(let i=0;i<6;i++)t.onDone(t.getPos());
const k=KEAGAME.G.keas[0], p=t.getPos(); k.x=p.x-0.35; k.y=p.y-0.15; k.z=p.z+0.55; k.grounded=false; k.vy=0; k.ry=2.4;} ${CAM(-6.6,1.9,11.2,-9.7,1.3,8.4)}`);
await shotR('23_paddock_gate',`const k=KEAGAME.G.keas[0];
  ${PIN('k.x=-41.4;k.z=6.4;k.y=0;k.vy=0;k.grounded=true;k.ry=-1.1;k.stun=0;k.idleT=0;k.idleAct=null;KEAGAME.G.time=12.0;')}
  ${CAM(-45.0,1.5,8.6,-41.6,0.7,3.2)}`);
await shotR('24_verge_paddle',`const k=KEAGAME.G.keas[0];k.x=6.2;k.z=28.4;k.y=0;k.grounded=true;k.ry=0.5; ${CAM(3.6,1.7,26.2,7.4,1.05,29.4)}`);
// 25 (2026-09-01): piece 6 fixed the preen head read and was certified against a metric, but the
// original complaint named the FOLLOW camera and NO vantage stood there - 13 is a 1.35-unit
// portrait and 14 is follow distance with no preen. This is that gap, so the set can judge the
// actual complaint from now on.
// The camera is the engine own follow geometry at size 1 rather than an invented distance:
// back = 5.2*(0.62+0.42*S), height = 2.15*(0.62+0.45*S) from updateCams, aimed at the head height
// the engine itself uses (k.y+0.72*S). And it stages the WORST frame of the cycle, measured
// headless across both sides at 0.05s steps: t=1.60 on side -1, where the head sits 0.0459 under
// the wing line against PREEN.eps of 0.055. Judging the easy frame would prove nothing.
// camDist: the game lets the player pull the follow cam in to 0.6 and out to 1.6 (clamp at line
// 3215), default 1. At the DEFAULT the bird is about 40px tall and no head read is possible by eye
// or by classifier - worth knowing, and reported. So this stands at 0.6, the closest the engine
// itself allows, which is a real player camera and not an invented one.
const F_RY=2.2, F_DIST=0.6, F_BACK=5.2*(0.62+0.42)*F_DIST, F_H=2.15*(0.62+0.45);
await shotR('25_preen_follow',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=false;
  ${PIN("k.x=0;k.z=0;k.y=0;k.vy=0;k.grounded=true;k.ry="+F_RY+";k.stun=0;k.landFlare=0;"+
        "k.idleT=99;k._idleEver=true;k.idleAct={kind:'preen',t:1.60,dur:3.5,side:-1};KEAGAME.G.time=12.0;")}
  ${CAM(-Math.sin(F_RY)*F_BACK, F_H, -Math.cos(F_RY)*F_BACK, 0, 0.72, 0)}`);
/* 26 (TODO 37): THE BROCHURE, which is the one part of that piece with a look, and the brief hands
   the look to Eric. STAGED WITH A CAREER IN PROGRESS rather than a virgin save, because every pin
   locked is the least informative version of this screen. Two pages fully starred puts four of the
   five pin states on one sheet of paper: the carpark CURRENT with 6 of 24, the ski field paid for
   but NOT BUILT YET, the campground LOCKED with its price showing, and nothing stamped.
   The brochure is a full-screen overlay with its own background, so the running game behind it does
   not reach the frame - which is also why this vantage needs no camera and no bird. */
await shotR('26_tour_brochure',`const G=KEAGAME.G, S=KEAGAME.STARS;
  for(const kind of S.KINDS){ S.rec(G.chapters[0])[kind]=true; S.rec(G.chapters[1])[kind]=true; }
  KEAGAME.SAVE.write();
  KEAGAME.TOUR.open(true);`);
/* 27 (TODO 38): THE ARRIVAL BEAT, frozen halfway. The camera is mid-blend between the anchor and the
   follow cam and the level card is up, which is the whole of what that piece has a LOOK for - and
   the brief flags the feel, so this exists to be judged rather than pinned.
   NO camLock HERE, deliberately: this vantage is photographing the travel blend, which camLock is
   built to override. The beat is held at u=0.5 by pinning its clock every frame, because
   travelUpdate would otherwise run it out during the settle - the same law-12 idiom as everything
   else in this file that leaves something live. */
await shotR('27_travel_card',`const k=KEAGAME.G.keas[0];
  KEAGAME.TRAVEL.in();
  ${PIN("k.x=0;k.z=0;k.y=0;k.vy=0;k.grounded=true;k.ry=2.2;k.stun=0;k.idleT=0;k.idleAct=null;"+
        "KEAGAME.G.time=12.0; if(KEAGAME.G.travel&&KEAGAME.G.travel.phase)KEAGAME.G.travel.t=KEAGAME.TRAVEL.K.in*0.5;")}`);
/* ---------- THE CLUB SKI FIELD (TODO 39) ----------
   THREE FIRST PINS, AND ALL THREE ARE LEFT FLAGGED, per the brief: nothing here has ever been
   photographed, so there is nothing to drift from and every one of them is a judged frame. They are
   shot in the ski field by naming it, which is the whole of the rig change above.
   The bird is PINNED in all three (law 7 and law 12): two of them stand it on a structure, where
   gravity and the roof logic would otherwise have it somewhere else by the time the shutter opens,
   and the third stands it on the corduroy where the idle animation would turn it around. */
const SKI={biome:'skifield'};
// 28: the bottom station - engine shed, bull wheel, the queue pad, drifts banked against the shed.
await shotR('28_skifield_base',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=true;
  ${PIN('k.x=4.0;k.z=24.0;k.y=2.2;k.vy=0;k.grounded=true;k.ry=1.9;k.stun=0;k.idleT=0;k.idleAct=null;KEAGAME.G.time=12.0;')}
  ${CAM(11.5,4.6,29.5, 4.0,2.0,23.0)}`,SKI);
// 29: the day lodge from downhill - the deck, the racks, and the drift banked along the wall.
// the deck floor put the bird behind its own railing at this distance, so it stands on the near
// trestle TABLE instead - which is where a kea would be anyway, and reads against the green wall.
await shotR('29_lodge_deck',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=true;
  ${PIN('k.x=-19.4;k.z=13.3;k.y=1.49;k.vy=0;k.grounded=true;k.ry=2.7;k.stun=0;k.idleT=0;k.idleAct=null;KEAGAME.G.time=12.0;')}
  ${CAM(-13.0,3.4,23.0, -21.5,1.8,13.0)}`,SKI);
// 30: up the groomed band, with the tow line and its towers running away to the top station.
await shotR('30_groomed_band',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=true;
  ${PIN('k.x=17.0;k.z=19.0;k.y=0.11;k.vy=0;k.grounded=true;k.ry=3.2;k.stun=0;k.idleT=0;k.idleAct=null;KEAGAME.G.time=12.0;')}
  ${CAM(19.5,3.2,26.0, 15.0,1.2,-6.0)}`,SKI);
console.log('CAPTURE COMPLETE');
