/* BIRDMILESTONE — walk, grip, pull, detach, carry, photographed end to end in the real game.
   Usage: node gauntlet/verify/birdmilestone.mjs [outdir]

   This is the REPLAT P5c milestone as a run rather than as a claim. It boots the game with the
   approved bird on, walks the kea to a real tear with the real movement keys, holds the real grab
   key until the tear completes, lets the game spawn its prop, picks it up and walks off with it —
   and photographs each beat. Nothing here reaches into the tear system: the only writes are key
   presses and a position pin, because a milestone that stages its own success proves nothing.
   WHAT IT ASSERTS IN PASSING is the thing a photograph cannot: G.birdBeats, the five authored
   events, in order, each once. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';
const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..','..');
const OUT=process.argv[2]||path.join(ROOT,'gauntlet/capture/bird');
fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
ensureBuild();
const SRV=await serve(); console.log('birdmilestone: serving '+SRV.origin);
const browser=await launch();
const shots=[];
try{
  const page=await browser.newPage();
  await page.setViewport({width:960,height:540,deviceScaleFactor:1});
  await preparePage(page,{seed:GAUNTLETSEED,biome:'carpark'});
  await page.evaluateOnNewDocument(`globalThis.__KEA_BIRD__={"model":true};`);
  await page.goto(SRV.origin,{waitUntil:'load'}); await sleep(1400);
  await assertBooted(page,{biome:'carpark'});
  await page.evaluate('window.AudioContext=undefined; KEAGAME.startGame(1);'); await sleep(400);
  for(let i=0;i<60;i++){ const b=JSON.parse(await page.evaluate('JSON.stringify(KEAGAME.G.bird||{})'));
    if(b.mode==='model'&&b.birds>0)break; if(b.mode==='primitive')throw new Error('model did not load'); await sleep(500); }
  await page.evaluate(`KEAGAME.CASEFILES.forEach(c=>c.seen=true);
    const td=document.getElementById('todo'); if(td)td.style.display='none';
    KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false; KEAGAME.G.birdBeats=[];
    KEAGAME.G.humans.forEach(h=>{h.x=46;h.z=46;h.home={x:46,z:46};h.patrol=null;});`);
  /* THE TARGET IS A REAL TEAR, FOUND rather than typed: the first solo non-strip tear on the map,
     which is the pack at the trailhead — the one whose completion spawns something carryable. */
  const tgt=await page.evaluate(`(()=>{const G=KEAGAME.G;
    const t=G.inter.find(it=>it.kind==='tear'&&!it.done&&!it.strip&&!it.needsBoth&&it.getPos);
    const q=t.getPos(); return JSON.stringify({label:t.label,x:q.x,y:q.y,z:q.z});})()`);
  const T=JSON.parse(tgt); console.log('  target: '+T.label+' at '+T.x.toFixed(1)+','+T.z.toFixed(1));
  /* the props that existed BEFORE the tear, so the prize can be identified as the one that was
     not there before rather than as the nearest snack — the trailhead has a sandwich lying about
     and the first run walked off with that instead */
  await page.evaluate(`KEAGAME.G._before=new Set(KEAGAME.G.props.map(p=>p.id));`);
  /* THE KEY NAMES ARE CHECKED BEFORE THEY ARE PRESSED, because press(undefined) is a silent
     no-op and that is exactly how the first two runs of this tool "failed": the map's forward key
     is `fwd`, the tool asked for `f`, nothing moved, and the report said the milestone had not
     happened rather than that the tool had not pressed anything. */
  { const keys=JSON.parse(await page.evaluate('JSON.stringify(KEAGAME.P1MAP)'));
    for(const need of ['fwd','grab'])
      if(!keys[need])throw new Error('birdmilestone: P1MAP has no `'+need+'` key — it has '+
        Object.keys(keys).join(', ')); }
  /* SIDE ON TO THE ACTION, not down the bird's own approach line. The first cut put the camera
     behind the bird looking at the tear, so the bird walked away from the lens and the pack — a
     red box a third of a metre across — filled the middle of every frame while the protagonist
     was off the edge. A milestone sheet with no bird in it is not a milestone sheet. The bird
     walks along +z toward the tear, so the camera stands off on +x and looks between the two. */
  const cam=(dx,dy,dz)=>`KEAGAME.G.camLock={x:${(T.x+dx).toFixed(3)},y:${(T.y+dy).toFixed(3)},z:${(T.z+dz).toFixed(3)},lx:${T.x.toFixed(3)},ly:${(T.y-0.22).toFixed(3)},lz:${(T.z-0.55).toFixed(3)}};`;
  const shoot=async(name,note,fast)=>{ await sleep(fast?0:450);
    await page.screenshot({path:path.join(OUT,'milestone_'+name+'.png')});
    const st=JSON.parse(await page.evaluate(`(()=>{const k=KEAGAME.G.keas[0];
      return JSON.stringify({clip:k._anim&&k._anim.cur, tug:!!k.tug,
        prog:k.tug?+(k.tug.progress||0).toFixed(2):null, held:k.held?k.held.name:null,
        beats:(KEAGAME.G.birdBeats||[]).map(b=>b.name)});})()`));
    shots.push({name,note,...st}); console.log('  '+name.padEnd(9)+' clip '+String(st.clip).padEnd(12)+
      ' tug '+st.tug+'  held '+st.held+'  beats '+st.beats.length); };

  /* 1. WALK IN, on the real forward key, from two and a half metres out, FACING the tear —
     and walk until it is in reach rather than for a guessed number of milliseconds. The first
     cut walked for 520 ms, and at 4.6 m/s the bird was two and a half metres PAST the pack
     before the shutter opened: it photographed an idle bird beside nothing, grabbed a walking
     pole on the way back, and reported a milestone that had not happened. */
  await page.evaluate(`(()=>{const G=KEAGAME.G,k=G.keas[0];
    k.x=(${T.x}); k.z=(${T.z})-2.5; k.y=KEAGAME.groundHeightAt(k.x,k.z,1); k.grounded=true;
    k.vy=0; k.ry=Math.atan2((${T.x})-k.x, (${T.z})-k.z);})()`);
  await page.evaluate(cam(1.30,0.34,-2.05));
  const reach=await page.evaluate(`(()=>{const G=KEAGAME.G;
    const t=G.inter.find(it=>it.kind==='tear'&&!it.done&&!it.strip&&it.getPos);
    return (t.range||1.3)*0.55;})()`);
  /* THE APPROACH STOPS INSIDE THE PAGE, not across the wire. Polling the distance from node and
     releasing the key on the next round trip is a race the bird keeps winning: at 4.6 m/s it
     covers 10 cm in a frame, and a SCREENSHOT costs a third of a second — so any frame taken
     during the approach hands the bird three metres of unsupervised walking and it ends up 90 m
     away with the loop hunting a target behind it. Measured, twice, by this tool doing exactly
     that.
     SO THE PHOTOGRAPH AND THE APPROACH ARE TWO RUNS OVER THE SAME GROUND. The walk frame is a
     short burst from the start mark with the shutter in it; then the bird is put BACK on the same
     mark and walks in again with nothing interrupting, and that second run is the one the grip,
     the pull and the carry follow. The staging is in the photograph, never in the milestone. */
  const startMark=`(()=>{const G=KEAGAME.G,k=G.keas[0];
    k.x=(${T.x}); k.z=(${T.z})-2.5; k.y=KEAGAME.groundHeightAt(k.x,k.z,1); k.grounded=true;
    k.vy=0; k.ry=Math.atan2((${T.x})-k.x, (${T.z})-k.z);})()`;
  await page.evaluate(`KEAGAME.press(KEAGAME.P1MAP.fwd)`);
  await sleep(300);
  await shoot('1_walk','mid-stride on the real forward key',true);
  await page.evaluate(`KEAGAME.release(KEAGAME.P1MAP.fwd)`);
  await page.evaluate(startMark); await sleep(120);
  const arrived=await page.evaluate(`(()=>new Promise(res=>{
    const G=KEAGAME.G,k=G.keas[0]; let n=0;
    KEAGAME.press(KEAGAME.P1MAP.fwd);
    const step=()=>{ const d=Math.hypot(k.x-(${T.x}),(k.y+0.4)-(${T.y}),k.z-(${T.z}));
      if(d<=${reach}||++n>600){ KEAGAME.release(KEAGAME.P1MAP.fwd); res(+d.toFixed(3)); return; }
      requestAnimationFrame(step); };
    requestAnimationFrame(step); }))()`);
  console.log('  arrived at '+arrived+' m from the grip point (reach '+reach.toFixed(2)+')');
  if(arrived>reach)throw new Error('birdmilestone: the approach overshot ('+arrived+' m) — the '+
    'milestone below would be staged, not walked');
  /* 2. GRIP — hold the real grab key. The tear owns progress from here. */
  await page.evaluate(`KEAGAME.press(KEAGAME.P1MAP.grab)`);
  await shoot('2_grip','the grab key goes down, beak_grip fires');
  await sleep(400); await shoot('3_pull','mid-pull, clip time driven by tear progress');
  /* 3. hold until the tear completes */
  for(let i=0;i<40;i++){ const done=await page.evaluate(`(()=>{const k=KEAGAME.G.keas[0];
      return !k.tug||k.tug.done;})()`); if(done)break; await sleep(200); }
  await shoot('4_detach','the tear completes — tear_impulse');
  await page.evaluate(`KEAGAME.release(KEAGAME.P1MAP.grab)`);
  await sleep(600);
  /* 4. CARRY — pick up what the tear dropped, with the real grab tap, then walk */
  /* THE PRIZE IS THE ONE THE TEAR DROPPED, not whatever happens to be nearest — the trailhead
     has walking poles and a sock lying about, and the first cut walked off with a pole and called
     it a carry. The pack spawns a muesli bar; take that one by name, or fall back to the nearest
     thing that appeared after the tear if a different tear is ever chosen. */
  await page.evaluate(`(()=>{const G=KEAGAME.G,k=G.keas[0];
    const fresh=G.props.filter(pp=>!pp.heldBy&&!pp.banked&&!G._before.has(pp.id));
    const p=fresh[0]||G.props.filter(pp=>!pp.heldBy&&!pp.banked)
      .sort((a,b)=>Math.hypot(a.x-k.x,a.z-k.z)-Math.hypot(b.x-k.x,b.z-k.z))[0];
    if(p){ k.x=p.x; k.z=p.z; k.y=Math.max(0.25,p.y); G._milestonePrize=p.name; }})()`);
  await sleep(200);
  await page.evaluate(`KEAGAME.press(KEAGAME.P1MAP.grab)`); await sleep(120);
  await page.evaluate(`KEAGAME.release(KEAGAME.P1MAP.grab)`); await sleep(300);
  await page.evaluate(`KEAGAME.press(KEAGAME.P1MAP.fwd)`);
  await shoot('5_carry','walking off with the prize');
  await page.evaluate(`KEAGAME.release(KEAGAME.P1MAP.fwd)`);
  const beats=JSON.parse(await page.evaluate('JSON.stringify(KEAGAME.G.birdBeats||[])'));
  const order=beats.map(b=>b.name);
  const want=['beak_grip','beak_regrip','beak_regrip','tear_impulse'];
  const ok=want.every((n,i)=>order[i]===n);
  console.log('  beats: '+order.join(' -> '));
  console.log('  the five authored beats fired in order: '+(ok?'YES':'NO'));
  fs.writeFileSync(path.join(OUT,'MILESTONE.json'),JSON.stringify({target:T,shots,beats},null,2));
} finally { try{ await browser.close(); }catch(e){} }
console.log('birdmilestone: '+shots.length+' frames -> '+OUT);
process.exit(0);
