/* KEA GAUNTLET PHOTOGRAPHER v2 — built on the proven probe skeleton.
   In-container: @sparticuz/chromium + puppeteer-core, local three.js via interception.
   On a real machine with `npm i puppeteer` it falls back automatically. */
import fs from 'fs'; import path from 'path'; import url from 'url';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/capture'); fs.mkdirSync(OUT,{recursive:true});
const THREE_LOCAL=fs.readFileSync(path.join(ROOT,'node_modules/three/build/three.min.js'));
const HTML='file://'+path.join(ROOT,'untitled-kea-game.html');
const ONLY=(process.env.SHOTS||'').split(',').filter(Boolean);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function launch(){
  try{ const p=await import('puppeteer'); return p.default.launch({headless:true,args:['--no-sandbox']}); }
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
  await page.setViewport({width:o.w||960,height:o.h||540,deviceScaleFactor:1});
  await page.setRequestInterception(true);
  page.on('request',r=>{ if(/three(\.min)?\.js/.test(r.url()))r.respond({contentType:'application/javascript',body:THREE_LOCAL});
    else if(/fonts\./.test(r.url()))r.respond({contentType:'text/css',body:''}); else r.continue(); });
  await page.goto(HTML,{waitUntil:'load'}); await sleep(1000);
  await page.evaluate(o.colossal?BOOTCOL:BOOT); await sleep(500);
  await page.evaluate(QUIET);
  if(o.colossal){ await page.evaluate(`for(let i=0;i<9;i++)KEAGAME.award(300,'x',{x:0,y:1,z:0});`); await sleep(500); }
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
const CAM=(x,y,z,lx,ly,lz)=>`KEAGAME.G.camLock={x:${x},y:${y},z:${z},lx:${lx},ly:${ly},lz:${lz}};`;
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true); const td=document.getElementById('todo'); if(td)td.style.display='none'; KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
  KEAGAME.G.humans.forEach(h=>{h.x=46;h.z=46;h.home={x:46,z:46};h.patrol=null;});
  KEAGAME.G.trafT.a=999;KEAGAME.G.trafT.b=999;
  for(let i=KEAGAME.G.cars.length-1;i>=0;i--){const c=KEAGAME.G.cars[i];if(c.traffic){KEAGAME.G.scene.remove(c.g);const ci=KEAGAME.G.colliders.indexOf(c.collider);if(ci>=0)KEAGAME.G.colliders.splice(ci,1);for(let q=KEAGAME.G.inter.length-1;q>=0;q--)if(KEAGAME.G.inter[q].car===c)KEAGAME.G.inter.splice(q,1);KEAGAME.G.cars.splice(i,1);}}`;

await shotR('01_carpark_wide',`const k=KEAGAME.G.keas[0];k.x=4;k.z=16;k.y=0;k.grounded=true;k.ry=2.4; ${CAM(11,4.2,25,3.5,0.8,15.5)}`);
await shotR('02_hut_snow',`const k=KEAGAME.G.keas[0];k.x=-24;k.z=-2.5;k.y=0;k.grounded=true;k.ry=Math.PI; ${CAM(-16,4.5,3,-24,2.6,-8)}`);
await shotR('03_kea_plate',`const k=KEAGAME.G.keas[0];k.preenT=99;k.idleT=0;KEAGAME.G.poseLock=true;k.x=0;k.z=0;k.y=KEAGAME.groundHeightAt(0,0,1);k.vy=0;k.grounded=true;k.ry=1.9;k.stun=0; ${CAM(1.35,0.95,1.15,0,0.55,0)}`);
await shotR('04_flight_underwing',`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=3.2;k.grounded=false;k.vy=1.4;k.flapDrive=1;k.ry=0.4;KEAGAME.press(KEAGAME.P1MAP.flap); ${CAM(0.6,1.6,3.4,0,3.0,0)}`,{settle:600});
await shotR('05_tussock_ground',`const k=KEAGAME.G.keas[0];k.x=-8;k.z=-24;k.y=0;k.grounded=true;k.ry=0.6; ${CAM(-8,1.0,-19.5,-14,3.5,-60)}`);
await shotR('06_skyline',CAM(0,3.2,10,-40,16,-120));
await shotR('07_jam',`const G=KEAGAME.G;
  const cone=G.props.find(p=>p.cone&&!p.heldBy); if(cone){cone.x=-4;cone.z=32.6;cone.y=0.06;cone.mesh.position.set(cone.x,cone.y,cone.z);}
  const k=G.keas[0];k.x=-6;k.z=30;k.y=0;k.grounded=true;k.ry=1.2; ${CAM(-22,4.2,26,-6,1.0,33)}`);
await shotR('08_readability_320',`const k=KEAGAME.G.keas[0];k.x=4;k.z=16;k.y=0;k.grounded=true;k.ry=2.6; ${CAM(8,3.4,22,2,0.8,14)}`,{w:320,h:180});
await shotR('09_colossal',`const k=KEAGAME.G.keas[0];k.x=2;k.z=14;k.y=0;k.grounded=true;k.ry=2.4; ${CAM(14,4.5,26,2,2.6,14)}`,{colossal:true});
await shotR('10_skifield',`const k=KEAGAME.G.keas[0];k.x=-37;k.z=-36;k.y=0;k.grounded=true;k.ry=3.9; ${CAM(-28,5,-27,-40,1.6,-40)}`);
await shotR('11_trailhead',`const k=KEAGAME.G.keas[0];k.x=42;k.z=-37;k.y=0;k.grounded=true;k.ry=0.8; ${CAM(33,4.5,-30,44,1.8,-40)}`);
await shotR('21_night_camp',`KEAGAME.G.night=true;KEAGAME.G.nightT=1;KEAGAME.nightApply(1);
  const k=KEAGAME.G.keas[0];k.x=34.7;k.z=-5.3;k.y=0;k.grounded=true;k.ry=2.7;KEAGAME.G.poseLock=true;
  ${CAM(38.2,1.7,-3.2,34.6,0.7,-6.4)}`);
await shotR('22_torch_beam',`KEAGAME.G.night=true;KEAGAME.G.nightT=1;KEAGAME.nightApply(1);
  const G=KEAGAME.G,k=G.keas[0];k.x=0;k.z=14;k.y=0;k.grounded=true;k.ry=3.1;G.poseLock=true;
  const rex=G.humans.find(h=>h.key==='rex'); if(rex){rex.x=0;rex.z=8;rex.ry=0;rex.state='idle';rex.patrol=null;
    if(rex.torch){rex.torch.g.rotation.y=0;rex.torch.spot.intensity=2.6;rex.torch.lens.visible=true;}}
  for(let i=0;i<3;i++)KEAGAME.update(1/60);
  ${CAM(5.5,1.7,10.5,0,0.9,11)}`);
await shotR('20_dead_rear',`const k=KEAGAME.G.keas[0];k.x=-9.55;k.z=10.15;k.y=0;k.grounded=true;k.ry=Math.atan2((-11)-(-9.55),8-10.15);KEAGAME.G.poseLock=true; const c=KEAGAME.G.cams&&KEAGAME.G.cams[0]; if(c){c.position.set(k.x-Math.sin(k.ry)*1.7, 1.1, k.z-Math.cos(k.ry)*1.7);}`);
await shotR('19_roof_follow',`const k=KEAGAME.G.keas[0];k.x=-24;k.z=-7.4;k.y=5.2;k.vy=0;k.grounded=true;k.ry=2.6;KEAGAME.G.poseLock=true; const c=KEAGAME.G.cams&&KEAGAME.G.cams[0]; if(c){c.position.set(k.x-Math.sin(2.6)*4.2, k.y+2.0, k.z-Math.cos(2.6)*4.2);}`);
await shotR('18_rear_close',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=false;k.x=-9.2;k.z=10.6;k.y=0;k.grounded=true;k.ry=5.8;k.stun=0;k.idleT=0;k.idleAct=null; ${CAM(-8.6,1.5,12.4,-9.6,0.5,9.4)}`);
await shotR('17_flight',`const k=KEAGAME.G.keas[0];KEAGAME.G.poseLock=false;k.x=0;k.z=0;k.y=3;k.grounded=false;k.flapDrive=true;k.vy=0.5;k.ry=2.2;k.stun=0; ${CAM(2.6,3.4,2.3,0,2.9,0)}`);
await shotR('16_trish',`const t=KEAGAME.G.humans.find(h=>h.key==='trish'); t.x=15;t.z=-10.5;t.state='idle';t.g.position.set(15,0,-10.5);
const k=KEAGAME.G.keas[0];k.x=11;k.z=-7;k.y=0;k.grounded=true;k.ry=2.2;KEAGAME.G.poseLock=true; ${CAM(13.2,1.75,-8.2,15,1.15,-10.6)}`);
await shotR('14_player_view',`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0;k.grounded=true;k.ry=2.2;k.stun=0;k.landFlare=0;k.vy=0;KEAGAME.G.poseLock=true; ${CAM(-4.38,2.3,3.18,0,0.9,0)}`);
await shotR('15_sign',`const k=KEAGAME.G.keas[0];const sg=KEAGAME.G.signG; k.x=sg.position.x-0.6;k.z=sg.position.z+2.2;k.y=0;k.grounded=true;k.ry=2.9;KEAGAME.G.poseLock=true; ${CAM('sg.position.x','2.0','sg.position.z+3.4','sg.position.x','1.8','sg.position.z')}`);
await shotR('13_idle_preen',`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0;k.grounded=true;k.ry=2.2;k.stun=0;k.landFlare=0;k.vy=0;KEAGAME.G.poseLock=false;k.idleT=99;k.idleAct={kind:'preen',t:0.7,dur:3.5,side:1};k._idleEver=true; ${CAM(1.35,0.95,1.15,0,0.55,0)}`);
await shotR('12_seal_midpeel',`{const t=KEAGAME.G.inter.find(x=>x.strip&&/DOOR SEAL/.test(x.label)); for(let i=0;i<6;i++)t.onDone(t.getPos());
const k=KEAGAME.G.keas[0], p=t.getPos(); k.x=p.x-0.35; k.y=p.y-0.15; k.z=p.z+0.55; k.grounded=false; k.vy=0; k.ry=2.4;} ${CAM(-6.6,1.9,11.2,-9.7,1.3,8.4)}`);
console.log('CAPTURE COMPLETE');
