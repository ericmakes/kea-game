/* KEA MOTION STRIPS — live clips per feel-vantage, tiled by ffmpeg after.
   MOTS=walk|flap|preen (comma list). One browser per clip, frames at ~140ms. */
import fs from 'fs'; import path from 'path'; import url from 'url';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/motion'); fs.mkdirSync(OUT,{recursive:true});
const THREE_LOCAL=fs.readFileSync(path.join(ROOT,'node_modules/three/build/three.min.js'));
const HTML='file://'+path.join(ROOT,'untitled-kea-game.html');
const ONLY=(process.env.MOTS||'').split(',').filter(Boolean);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function launch(){
  try{ const p=await import('puppeteer'); return p.default.launch({headless:true,args:['--no-sandbox']}); }
  catch(e){ const chromium=(await import('@sparticuz/chromium')).default;
    const p=await import('puppeteer-core');
    return p.default.launch({executablePath:await chromium.executablePath(),
      args:[...chromium.args,'--no-sandbox'],headless:true}); }
}
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true); const td=document.getElementById('todo'); if(td)td.style.display='none'; KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
  KEAGAME.G.humans.forEach(h=>{h.x=46;h.z=46;h.home={x:46,z:46};h.patrol=null;});
  KEAGAME.G.sheep.forEach(s=>{s.x=-48;s.z=-48;s.home={x:-48,z:-48};});
  KEAGAME.G.trafT.a=999; KEAGAME.G.trafT.b=999;`;
const CAM=(x,y,z,lx,ly,lz)=>`KEAGAME.G.camLock={x:${x},y:${y},z:${z},lx:${lx},ly:${ly},lz:${lz}};`;

const MOTIONS=[
 {id:'landing', frames:12, gap:0, steps:3, key:null,
  stage:`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=3.4;k.vy=-0.6;k.grounded=false;k.ry=1.9;KEAGAME.G.poseLock=false; ${CAM(2.9,1.3,1.4,0,1.1,0)}`},

 {id:'takeoff', frames:12, gap:110, key:'Space', treadmill:true,
  stage:`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0;k.grounded=true;k.ry=1.9;KEAGAME.G.poseLock=false;k.idleT=0;k.idleAct=null; ${CAM(3.0,1.5,1.3,0,1.0,0)}`},

 {id:'walk', frames:12, gap:130, key:'KeyW', treadmill:true,
  stage:`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0;k.grounded=true;k.ry=1.9;KEAGAME.G.poseLock=false;k.idleT=0;k.idleAct=null; ${CAM(2.7,1.15,1.1,0,0.55,0)}`},
 {id:'flap', frames:12, gap:120, key:'Space', treadmill:true,
  stage:`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0.4;k.grounded=false;k.vy=1.2;k.ry=1.9;KEAGAME.G.poseLock=false; ${CAM(3.1,2.4,1.6,0,1.8,0)}`},
 {id:'preen', frames:12, gap:170, key:null,
  stage:`const k=KEAGAME.G.keas[0];k.x=0;k.z=0;k.y=0;k.grounded=true;k.ry=2.2;KEAGAME.G.poseLock=false;k.idleT=99;k.idleAct={kind:'preen',t:0.1,dur:9,side:1};k._idleEver=true; ${CAM(1.5,1.0,1.25,0,0.55,0)}`},
];
for(const m of MOTIONS){
  if(ONLY.length&&!ONLY.includes(m.id))continue;
  const browser=await launch();
  const page=await browser.newPage();
  await page.setViewport({width:640,height:360,deviceScaleFactor:1});
  await page.setRequestInterception(true);
  page.on('request',r=>{ if(/three(\.min)?\.js/.test(r.url()))r.respond({contentType:'application/javascript',body:THREE_LOCAL});
    else if(/fonts\./.test(r.url()))r.respond({contentType:'text/css',body:''}); else r.continue(); });
  await page.goto(HTML,{waitUntil:'load',timeout:20000});
  await page.evaluate(`window.AudioContext=undefined; KEAGAME.startGame(1);`);
  await sleep(300);
  await page.evaluate(QUIET);
  await page.evaluate(m.stage);
  await sleep(500);
  if(m.key)await page.keyboard.down(m.key);
  await page.evaluate(()=>{
    window.requestAnimationFrame=()=>0; // freeze the live loop; we drive
    document.body.classList.add('photo');
    for(let w=0;w<4;w++)KEAGAME.update(1/30); // settle the stage before frame zero
  });
  let landed=0;
  for(let f=0;f<m.frames;f++){
    let data; try{ data=await page.evaluate((stepsPerCell,tread)=>{
      const G=KEAGAME.G, r=G.renderer, cam=G.cams[0];
      for(let st=0; st<stepsPerCell; st++){
        if(tread){ const k=G.keas[0]; k.x=0; k.z=0; if(k.y>1.4){k.y=1.4;k.vy=Math.min(k.vy,0);} }
        KEAGAME.update(1/30);
      }
      r.render(G.scene,cam);
      const k=G.keas[0];
      return {img:r.domElement.toDataURL('image/jpeg',0.9), kx:+k.x.toFixed(2), ky:+k.y.toFixed(2), kz:+k.z.toFixed(2), gr:k.grounded, cl:!!G.camLock, run:G.running};
    }, m.steps||3, !!m.treadmill);
    }catch(e){ console.log('frame',f,'lost — keeping',landed); break; }
    console.log('f'+f, JSON.stringify({kx:data.kx,ky:data.ky,kz:data.kz,gr:data.gr,cl:data.cl,run:data.run}));
    fs.writeFileSync(path.join(OUT,`${m.id}_${String(f).padStart(2,'0')}.jpg`),Buffer.from(data.img.split(',')[1],'base64')); landed++;
  }
  console.log('sheet '+m.id+' ('+landed+'f)');
  if(m.key)await page.keyboard.up(m.key);
  await browser.close();
  console.log('sheet '+m.id+' ('+m.frames+'f)');
}
