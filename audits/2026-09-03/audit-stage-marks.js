/* THE STAGE-MARK AUDIT — does the game accept the mark each vantage puts its bird on? (TODO 71)
   Usage: node audits/2026-09-03/audit-stage-marks.js       env: MARKSALL=1 prints every row

   THIS IS A REPORT, NOT A BATTERY, and it is deliberately not in gate.sh - the same reasoning
   audit-bevel-flanks.js states for itself: the finding it prints is unfixed, so an assertion here
   would be red by design, and a red battery that is meant to be red teaches the gate to lie.

   WHY (found in session 13 by piece 69). 20_dead_rear declares its bird at (-9.55, 10.15). ONE
   update(1/60) later the bird is at (-8.87763, 10.0137) and it stays there for 240 frames: the mark
   is inside a solid and the physics ejects it. That vantage then computed its camera offset from
   the mark rather than from where the bird ended up, so it framed a bird 0.68 off its own stage
   line for four builds and nothing in the rig could say so. The question this answers is whether 20
   was the only one.

   WHAT IT MEASURES. For every vantage in capture.mjs that names a literal bird mark, it stands the
   bird there in a headless world, runs ONE update at the rig's fixed dt, and prints how far the
   game moved it. An ejection is a step, not a drift: the game resolves out of a solid in a single
   frame, so anything over a few millimetres on the first frame is the world rejecting the mark.

   THE CONTROL IS 20 ITSELF, and it is the reason this can be trusted at all. rig.js says in its own
   text that node and the browser build DIFFERENT COUNTRIES from one seed - the browser also runs
   the !HEADLESS branches and those consume draws node never makes - so a headless answer about a
   staged position is only worth having if a known browser answer reproduces here. 20 is that known
   answer, measured through puppeteer at five decimals. The run prints CONTROL HOLDS or CONTROL
   BROKEN before anything else, and if it is broken every row below it is worthless.

   TRAFFIC IS CLEARED FIRST because QUIET clears it in the rig: a traffic car parked over a mark
   would be an ejection the photograph never sees. Everything else in the world is left alone.
   ONE BOOT FOR ALL THE MARKS, which is a stated approximation rather than an oversight: each row
   advances the world by one frame, so a row is judged against a world up to two dozen frames older
   than the boot. Buildings, parked cars and fences do not move in that time, and they are what
   ejects a bird. A row that lands on a falling PROP would be noise, and none currently does.  */
const {load, clearTraffic}=require('../2026-08-26/rig');
const fs=require('fs'); const path=require('path');
const ROOT=path.resolve(__dirname,'..','..');

// ---- the marks, read off the rig rather than kept in a second list that can rot ----
const SRC=fs.readFileSync(path.join(ROOT,'gauntlet/verify/capture.mjs'),'utf8');
const NUM='(-?\\d+(?:\\.\\d+)?)';
const MARKS=[];
for(const block of SRC.split(/await shotR?\(/).slice(1)){
  const name=(block.match(/^'([^']+)'/)||[])[1]; if(!name)continue;
  const body=block.split(/\n(?=await |\/\/|\/\*)/)[0];
  const mx=body.match(new RegExp('k\\.x='+NUM)), mz=body.match(new RegExp('k\\.z='+NUM));
  if(!mx||!mz)continue;                              // a vantage that stages no bird has no mark
  const my=body.match(new RegExp('k\\.y='+NUM));
  // A VANTAGE NAMES ITS OWN MAP (TODO 39) and a mark only means anything in the map it is shot in:
  // the ski field marks land in open carpark tussock and would every one of them read clean.
  const biome=/,\s*SKI\b/.test(body)?'skifield':'carpark';
  MARKS.push({name, x:+mx[1], z:+mz[1], y:my?+my[1]:0, biome});
}

// ONE WORLD PER BIOME, built on demand and kept, because load() is a whole game instance.
const WORLDS={};
function world(biome){
  if(WORLDS[biome])return WORLDS[biome];
  const H=load(); H.boot(biome==='carpark'?null:biome); H.X.startGame(1); H.tick(6);  // law 2: tick, then stage
  clearTraffic(H);
  H.G.poseLock=true;                  // photography: the vantages set it and it stops the idle actions
  return (WORLDS[biome]=H);
}

/* THE TEST IS pushOut's OWN, not the camera march's, and getting that wrong cost an hour. The march
   in updateCams asks whether a POINT is in a box; the bird is separated by pushOut with a radius,
   R = 0.28 * size, and it resolves on the SHALLOWER axis. Read with the march convention,
   18_rear_close came back moved 0.274 m with no collider anywhere near it - a finding with no cause,
   which is the shape of a wrong convention every time (FLAKES law 10). With pushOut's own numbers it
   is the caravan, at 2.906 against 2.9 + 0.28 in the collider's own rotated frame, and the predicted
   push equals the measured move to five decimals. So this returns the prediction as well as the box,
   and the run compares the two: a row where they disagree is a row this file does not understand. */
function pushed(G,k,px,py,pz){
  const R=0.28*(k.size||1);
  for(const c of G.colliders){ if(!c.solid||c.kind!=='box')continue;
    let dx=px-c.x, dz=pz-c.z;
    if(c.ry){ const sn=Math.sin(c.ry),cs=Math.cos(c.ry); const lx=dx*cs-dz*sn, lz=dx*sn+dz*cs; dx=lx; dz=lz; }
    if(Math.abs(dx)<c.w+R && Math.abs(dz)<c.d+R && py<c.top-0.15){
      const ox=(c.w+R)-Math.abs(dx), oz=(c.d+R)-Math.abs(dz);
      return {c, push:Math.min(ox,oz), axis:ox<oz?'x':'z'}; } }
  return null;
}
const r5=n=>Math.round(n*1e5)/1e5;
/* EVERY ROW RESETS THE BIRD COMPLETELY, and it is precaution rather than a fix: rows share one bird
   and every row here reads the same with and without the reset, measured both ways. It is here so
   that a future row which leaves the bird mid-idle-action, mid-slide or holding something cannot
   hand the next row a bird that was already moving and have it read as an ejection. */
function eject(H,m){
  const {X,G}=H, k=G.keas[0];
  k.x=m.x; k.z=m.z; k.y=m.y; k.vy=0; k.grounded=true; k.stun=0; k.tug=null; k.slideV=0; k.slideD=0;
  k.idleT=0; k.idleAct=null; k.preenT=0; k.landFlare=0; k.flapDrive=0;
  if(k.held){k.held.heldBy=null;k.held=null;}
  const hit=pushed(G,k,m.x,m.y,m.z);
  X.update(1/60);
  return {x:r5(k.x), z:r5(k.z), d:r5(Math.hypot(k.x-m.x,k.z-m.z)), hit};
}

/* ---- the control, first and loudest ----
   THREE MARKS MEASURED THROUGH PUPPETEER IN SESSION 13, on the staged page at shutter time, one per
   ejecting body: the caravan, a parked car, and the caravan again on its other axis. They are here
   because rig.js says in its own text that node and the browser build DIFFERENT COUNTRIES from one
   seed, so every row below is a claim about a world this process cannot photograph. If the three
   agree to five decimals, the bodies that eject a bird are in the same places in both. */
const BROWSER=[{name:'20_dead_rear', x:-8.87763, z:10.0137},
               {name:'01_carpark_wide', x:2.82, z:16},
               {name:'18_rear_close', x:-9.14552, z:10.86876}];
let held=true;
for(const b of BROWSER){
  const ctl=MARKS.find(m=>m.name===b.name);
  if(!ctl){ held=false; console.log('CONTROL BROKEN: capture.mjs no longer names a literal mark for '+b.name); continue; }
  const got=eject(world(ctl.biome),ctl);
  const ok=Math.abs(got.x-b.x)<0.005&&Math.abs(got.z-b.z)<0.005; if(!ok)held=false;
  console.log(`${ok?'CONTROL HOLDS ':'CONTROL BROKEN'}: ${b.name.padEnd(20)} headless ${got.x}, ${got.z}   browser ${b.x}, ${b.z}`);
}
if(!held) console.log('  every row below is worthless - the headless world is not the photographed one');

// ---- the sweep ----
const EJECT=0.02;                       // a resolve is a step; 2 cm on the first frame is not drift
const rows=MARKS.map(m=>({m, got:eject(world(m.biome),m)})).sort((a,b)=>b.got.d-a.got.d);
console.log(`\nMARK                 map       declared            after one update      moved   ejected by`);
let n=0;
for(const {m,got} of rows){
  const hot=got.d>EJECT; if(!hot&&!process.env.MARKSALL)continue; n++;
  const h=got.hit;
  const by=h?`box ${r5(h.c.x)}, ${r5(h.c.z)}  ${(h.c.w*2).toFixed(2)}x${(h.c.d*2).toFixed(2)} top ${h.c.top}`+
    `  predicted ${h.push.toFixed(3)} on ${h.axis}${Math.abs(h.push-got.d)>0.001?'  <-- PREDICTION DISAGREES':''}`:'';
  console.log(`${hot?'✗':'·'} ${m.name.padEnd(20)} ${m.biome.padEnd(9)} ${(m.x+', '+m.z).padEnd(19)} ${(got.x+', '+got.z).padEnd(21)} ${got.d.toFixed(3).padStart(6)}   ${by}`);
}
const worst=rows[0];
console.log(`\nSTAGE MARKS: ${rows.length} literal marks in capture.mjs, ${rows.filter(r=>r.got.d>EJECT).length} ejected over ${EJECT} m`+
  ` (worst ${worst?worst.m.name:'-'} ${worst?worst.got.d.toFixed(3):'-'} m). Control ${held?'holds':'BROKEN'}.`);
