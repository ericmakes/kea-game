/* END-TO-END TRAVEL DRIVE: the browser-only half of TODO 38 - the map, the out beat, the page load
   in the middle, the auto-start and the in beat. A second biome is INJECTED into a temp copy of the
   game so it survives the reload, because a runtime defineBiome does not. */
import fs from 'fs'; import path from 'path'; import os from 'os';
const ROOT='/Users/e.barker/kea-gauntlet-portable';
const THREE_LOCAL=fs.readFileSync(path.join(ROOT,'node_modules/three/build/three.min.js'));
let src=fs.readFileSync(path.join(ROOT,'untitled-kea-game.html'),'utf8');
const A="defineBiome('carpark',{label:'THE CARPARK',build:buildCarpark,\n  anchor:{x:7,y:26,z:34, lx:7,ly:1,lz:-11}});";
/* THE STAND-IN ONLY GOES IN IF THE REAL ONE IS NOT THERE YET, and since TODO 39 it never does: the
   ski field is a real map with its own builder, so this drives the journey into the actual thing.
   The injection is kept for the day somebody reverts a biome, and the carpark anchor is only
   REQUIRED when it is about to be used - it changed the morning the carpark took a cast, and a
   dead code path is a poor reason to fail an instrument. */
const INJECT=!/defineBiome\('skifield'/.test(src);
if(INJECT){
  if(src.split(A).length!==2)throw new Error('journey: carpark registration anchor missing');
  src=src.replace(A,A+"\ndefineBiome('skifield',{label:'THE CLUB SKI FIELD',build:buildCarpark,anchor:{x:7,y:26,z:34,lx:7,ly:1,lz:-11}});"); }
console.log(INJECT?'journey: ski field injected as a stand-in (it builds the carpark)':'journey: a real ski field is registered, driving into that');
const TMP=path.join(os.tmpdir(),'kea-journey.html'); fs.writeFileSync(TMP,src);
const p=await import('puppeteer');
let browser; try{ browser=await p.default.launch({headless:true,args:['--no-sandbox']}); }
catch(e){ browser=await p.default.launch({headless:true,channel:'chrome',args:['--no-sandbox']}); }
const page=await browser.newPage();
await page.setViewport({width:960,height:540});
await page.setRequestInterception(true);
page.on('request',r=>{ if(/three(\.min)?\.js/.test(r.url()))r.respond({contentType:'application/javascript',body:THREE_LOCAL});
  else if(/fonts\./.test(r.url()))r.respond({contentType:'text/css',body:''}); else r.continue(); });
page.on('pageerror',e=>console.log('PAGEERR:',e.message.split('\n')[0]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const st=()=>page.evaluate(()=>({biome:KEAGAME.G.biome,running:KEAGAME.G.running,
  phase:(KEAGAME.G.travel||{}).phase||null, ended:(KEAGAME.G.travel||{}).ended||null,
  to:(KEAGAME.G.travel||{}).to||null, card:document.getElementById('travelcard').textContent,
  cardOn:document.getElementById('travelcard').classList.contains('on'),
  paused:KEAGAME.G.paused, tour:document.getElementById('tour').classList.contains('open'),
  pick:localStorage.getItem('keaTourPick'), arm:localStorage.getItem('keaTourArrive')}));
await page.goto('file://'+TMP,{waitUntil:'load'}); await sleep(1000);
await page.evaluate(()=>{ window.AudioContext=undefined; localStorage.clear(); KEAGAME.startGame(1); });
await sleep(400);
await page.evaluate(()=>{ const G=KEAGAME.G,S=KEAGAME.STARS;
  for(const k of S.KINDS){ S.rec(G.chapters[0])[k]=true; S.rec(G.chapters[1])[k]=true; }
  KEAGAME.SAVE.write(); });
console.log('in play        ',JSON.stringify(await st()));
await page.keyboard.press('KeyM'); await sleep(300);
console.log('map open in play',JSON.stringify(await st()));
const rows=await page.evaluate(()=>[...document.querySelectorAll('#tourlist .trow')]
  .map(r=>r.querySelector('.nm').firstChild.textContent+' -> '+r.querySelector('button').textContent));
console.log('rows           ',JSON.stringify(rows));
await page.screenshot({path:path.join(ROOT,'gauntlet/capture/probe_map_inplay.png')});
const nav=page.waitForNavigation({timeout:15000}).catch(()=>null);
await page.evaluate(()=>{ const b=[...document.querySelectorAll('#tourlist .trow button')].find(x=>x.textContent==='GO'); b.click(); });
await sleep(250);
console.log('just after GO  ',JSON.stringify(await st()));
await nav; await sleep(1400);
console.log('after the load ',JSON.stringify(await st()));
await page.screenshot({path:path.join(ROOT,'gauntlet/capture/probe_arrival.png')});
await page.keyboard.press('Space'); await sleep(200);
console.log('space (fresh)  ',JSON.stringify(await st()));
await sleep(2200);
console.log('settled        ',JSON.stringify(await st()));
await browser.close();
