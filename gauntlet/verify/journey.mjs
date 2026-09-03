/* END-TO-END TRAVEL DRIVE: the browser-only half of TODO 38 - the map, the out beat, the page load
   in the middle, the auto-start and the in beat. A second biome is INJECTED into a temp copy of the
   game so it survives the reload, because a runtime defineBiome does not. */
import fs from 'fs'; import path from 'path';
/* REPLAT P1 step 4. This used to INJECT a stand-in ski field into a temp copy of the HTML so a
   second biome survived the reload. Two things killed that: a bundled build cannot be patched by
   string replacement, and the stand-in has been dead code since TODO 39 gave the ski field a real
   builder ("since TODO 39 it never does", as the note here said).
   So the fallback is retired and the PRECONDITION it protected is asserted instead. If somebody
   reverts the ski field, this now says so in one line rather than quietly driving the journey into
   a carpark wearing a ski field's name — which is the more useful failure of the two. */
import {ensureBuild,serve,preparePage,assertBooted,launch} from './webrig.mjs';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const src=fs.readFileSync(path.join(ROOT,'src','game.mjs'),'utf8');
if(!/defineBiome\('skifield'/.test(src))
  throw new Error("journey: no real 'skifield' biome is registered in src/game.mjs — this instrument "+
    "drives travel between two REAL maps and will not stand one up for itself");
console.log('journey: a real ski field is registered, driving into that');
ensureBuild(); const srv=await serve(); const TMP=srv.origin+'/';
const browser=await launch();
const page=await browser.newPage();
await page.setViewport({width:960,height:540});
await preparePage(page);
page.on('pageerror',e=>console.log('PAGEERR:',e.message.split('\n')[0]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const st=()=>page.evaluate(()=>({biome:KEAGAME.G.biome,running:KEAGAME.G.running,
  phase:(KEAGAME.G.travel||{}).phase||null, ended:(KEAGAME.G.travel||{}).ended||null,
  to:(KEAGAME.G.travel||{}).to||null, card:document.getElementById('travelcard').textContent,
  cardOn:document.getElementById('travelcard').classList.contains('on'),
  paused:KEAGAME.G.paused, tour:document.getElementById('tour').classList.contains('open'),
  pick:localStorage.getItem('keaTourPick'), arm:localStorage.getItem('keaTourArrive')}));
await page.goto(TMP,{waitUntil:'load'}); await sleep(1000);
await assertBooted(page);
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
/* TODO 40 asks for one thing only a browser can answer: TAB SHOWS THE PAGE. renderTodo returns
   immediately under HEADLESS, so the list a player actually reads has no headless proof at all - and
   the whole point of the piece is that the list on this map is not the carpark one. */
{ const todo=await page.evaluate(()=>{ const t=document.getElementById('todo');
    t.classList.add('open');
    return {heads:[...document.querySelectorAll('#milist .miarea')].map(h=>h.textContent),
            rows:[...document.querySelectorAll('#milist .mi')].map(r=>r.textContent.trim().slice(0,52))}; });
  console.log('to-do heads   ',JSON.stringify(todo.heads));
  console.log('to-do rows    ',JSON.stringify(todo.rows));
  /* TODO 66: THE FOOTER TICKS WHILE THE PANEL IS OPEN, which only a browser can answer - renderTodo
     runs on a mission event, so the three live numbers used to be a snapshot of the last one. Award
     some chaos, wait, and read the same element twice with nothing ticked in between. */
  const foot1=await page.evaluate(()=>{ KEAGAME.award(240,'PROBE',{x:0,y:1,z:0});
    return (document.getElementById('mifoot')||{}).textContent; });
  await sleep(2200);
  const foot2=await page.evaluate(()=>(document.getElementById('mifoot')||{}).textContent);
  console.log('footer         ',JSON.stringify(foot1),'->',JSON.stringify(foot2),
    foot1!==foot2?'(it ticks)':'(STALE - it did not move)');
  await page.screenshot({path:path.join(ROOT,'gauntlet/capture/probe_todo_skifield.png')});
  await page.evaluate(()=>document.getElementById('todo').classList.remove('open')); }
await page.keyboard.press('Space'); await sleep(200);
console.log('space (fresh)  ',JSON.stringify(await st()));
await sleep(2200);
console.log('settled        ',JSON.stringify(await st()));
await browser.close();
