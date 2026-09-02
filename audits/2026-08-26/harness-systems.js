/* Phase 2: systems exhaustion.
   AMENDED 2026-08-26 after v1 triage:
   - tears staged at EXACT footprint + debris sweep (v1 offset staging = illegal state cluster)
   - traffic body-block repositions BEFORE update at +4 (v1 sat exactly on the <5 boundary)
   - moving-tug replaced by teleport range-release test, now ENFORCING (fix F5)
   - decay test isolates traffic first (v1 measured honking, not decay)
   - tom nap + spikes/nails flipped EXPECT-BUG -> ENFORCING (fixes F3, F1) */
const {load,collector,stage,far,sweep,clearTraffic}=require('./rig');
const H=load(),{X,G,tick,hold,un,tap,P1,P2}=H;
const C=collector('SYSTEMS'),ok=C.ok;
X.boot(); X.startGame(2);
const k0=G.keas[0],k1=G.keas[1];
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;h.asleep=false;h.zzz&&(h.zzz.visible=false);});
G.sheep.forEach(s=>{s.x=-48;s.z=-48;s.home={x:-48,z:-48};}); // 2026-08-27e: drover sheep wander now — leash them clear of legacy sections
const tomH=G.humans.find(h=>h.key==='tom');

C.section('peck exhaustion (pre-req for locked tears)');
const pecks=G.inter.filter(i=>i.kind==='peck'&&!i.repeat);
for(const pk of pecks){
  stage(H,k0,pk.getPos()); tick(2);
  for(let i=0;i<(pk.needHits||1)+1&&!pk.done;i++){ tap(P1.grab); tick(3); }
  ok(pk.done===true,'peck completes: '+pk.label);
}
ok(pecks.length===4,'non-repeat pecks census '+pecks.length+' (2026-08-27: +ute peck)');

C.section('tear exhaustion — every tear reachable from a legal perch; spikes contested by live Dave (F15)');
far(H,k1);
// ADDED 2026-08-27b: strip peels + quickie tears proven through REAL inputs, pristine world
C.section('strip peel: door seal comes off bit by bit, intact at the end');
G.trafT.a=999; G.trafT.b=999; // no traffic during the long pristine proofs - later sections set their own
const sealT=G.inter.find(t=>t.strip&&/DOOR SEAL/.test(t.label));
ok(!!sealT,'seal is a strip tear');
const SST=sealT.strip;
ok(SST.N>=8&&SST.N===SST.path.length-1&&SST.f===0,'a full ring of attached segments, none freed yet (N='+SST.N+')');
const fr0=sealT.getPos(), fr0x=fr0.x, fr0y=fr0.y, fr0z=fr0.z;
let sStuck=false;
while(SST.f<SST.N&&!sStuck){
  const want=SST.f+1, sp=sealT.getPos();
  stage(H,k0,sp); k0.y=sp.y; k0.vy=0; far(H,k1); tick(1); hold(P1.grab);
  let st=0; while(SST.f<want&&st<600){ k0.y=sp.y; k0.vy=0; X.update(1/60); st++; }
  un(P1.grab); tick(2);
  if(SST.f<want)sStuck=true;
  if(SST.f===4)ok(G.missions.find(m=>m.id==='seal').done!==true,'four bits off - mission still open (no early credit)');
  if(SST.f===5){ const fp=sealT.getPos();
    ok(Math.hypot(fp.x-fr0x,fp.y-fr0y,fp.z-fr0z)>0.8,'frontier has moved along the door frame'); }
}
ok(!sStuck,'every segment workable (stalled at '+SST.f+'/'+SST.N+')');
ok(G.missions.find(m=>m.id==='seal').done===true,'last bit pops - seal mission credits');
ok(SST.segs.every(sg=>!sg.m||sg.m.visible===false),'attached segments cleared');
ok(!!G.props.find(pp=>pp.name==='door seal'),'the WHOLE seal drops as one intact prop');

C.section('strip peel: 3 HR RETURN sticker');
const stkT=G.inter.find(t=>t.strip&&/STICKER/.test(t.label));
ok(!!stkT&&stkT.strip.N===5,'sticker is a five-bit strip');
{ let guard=0;
  while(stkT.strip.f<5&&guard<8){ const sp=stkT.getPos(); stage(H,k0,sp); k0.y=sp.y; k0.vy=0; tick(1);
    hold(P1.grab); const w=stkT.strip.f+1; let st=0; while(stkT.strip.f<w&&st<540){ k0.y=sp.y; k0.vy=0; X.update(1/60); st++; } un(P1.grab); tick(1); guard++; } }
ok(G.missions.find(m=>m.id==='t_sign').done===true,'sticker fully revised');
ok(!!G.props.find(pp=>pp.name==='track sticker'&&pp.shiny),'intact sticker drops, shiny');

C.section('quickie tears through real inputs');
const utePk=G.inter.find(t=>t.kind==='peck'&&/UTE/.test(t.label));
{ const p=utePk.getPos(); stage(H,k0,p); k0.y=Math.max(k0.y,p.y-0.3); tick(2);
  tap(P1.grab); tick(2); tap(P1.grab); tick(2); }
ok(G.missions.find(m=>m.id==='q_peck').done===true,'two real pecks fire q_peck');
const bindT=G.inter.find(t=>t.kind==='tear'&&/BINDING/.test(t.label));
{ const p=bindT.getPos(); stage(H,k0,p); k0.y=p.y; tick(1); hold(P1.grab);
  let st=0; while(!bindT.done&&st<540){ k0.y=p.y; k0.vy=0; X.update(1/60); st++; } un(P1.grab); tick(2); }
ok(G.missions.find(m=>m.id==='s_binding').done===true,'binding chewed via the real hold path');
const pkT=G.inter.find(t=>t.kind==='tear'&&/UNZIP/.test(t.label));
{ const p=pkT.getPos(); stage(H,k0,p); k0.y=p.y; tick(1); hold(P1.grab);
  let st=0; while(!pkT.done&&st<540){ k0.y=p.y; k0.vy=0; X.update(1/60); st++; } un(P1.grab); tick(3); }
ok(pkT.done===true,'pack unzipped via the real hold path');
{ const mb=G.props.find(pp=>pp.name==='muesli bar');
  ok(!!mb&&mb.snack==='t_bar','pack spawns the muesli bar with its snack tag');
  if(mb){ tick(3); stage(H,k0,{x:mb.x,y:Math.max(0.4,mb.y),z:mb.z}); tick(2); tap(P1.grab); tick(2);
    k0.x=G.nestPos.x; k0.z=G.nestPos.z; k0.y=G.nestY; tick(3); if(k0.held)tap(P1.grab); tick(5);
    ok(G.missions.find(m=>m.id==='t_bar').done===true,'muesli scoffed at the nest'); } }

const tears=G.inter.filter(i=>i.kind==='tear');
let torn=0, unreachable=[];
for(const t of tears){
  if(t.done)continue;
  const p=t.getPos();
  sweep(H,p,2.2);
  stage(H,k0,p);
  if(t.needsPartner||t.needsBoth){ k1.x=p.x-0.5;k1.z=p.z-0.5;k1.y=X.groundHeightAt(k1.x,k1.z,p.y);k1.grounded=true;k1.stun=0; }
  else far(H,k1);
  tick(2);
  hold(P1.grab); if(t.needsPartner||t.needsBoth)hold(P2.grab);
  let steps=0; while(!t.done&&steps<60*9){ X.update(1/60); steps++; }
  un(P1.grab); un(P2.grab); tick(3);
  if(t.done)torn++; else unreachable.push(t.label+' @'+p.x.toFixed(1)+','+p.y.toFixed(1)+','+p.z.toFixed(1)+' prog='+t.progress.toFixed(2));
}
ok(unreachable.length===0,'unreachable tears: '+unreachable.join(' | '));
console.log('    tears driven: '+torn+'/'+tears.length);
ok(G.missions.find(m=>m.id==='spikes').done===true,'6 spikes -> mission');
ok(G.missions.find(m=>m.id==='seal').done===true,'seal mission');
ok(G.missions.find(m=>m.id==='sign').done===true,'sign mission');
ok(G.missions.find(m=>m.id==='wiper').done===true,'wiper x3 mission');
ok(G.tent.down===true,'tent collapsed');
ok(G.bin.tipped===true,'bin tip fired after unlock');

C.section('tug pins the kea on the roof (fix F1 enforcing)');
const nailLike=G.colliders.find(c=>c.kind==='roof');
k0.x=nailLike.x+3.4; k0.z=nailLike.z+2.6; k0.y=X.groundHeightAt(k0.x,k0.z,4); k0.grounded=true; k0.slideV=0;
hold(P1.grab); // AMENDED 2026-08-26: tug contract requires grabHeld; v2 test forgot the key
k0.tug={label:'fake-grip',getPos:()=>({x:k0.x,y:k0.y+0.4,z:k0.z}),range:9,progress:0,need:99,done:false,tuggers:new Set()};
const zPin=k0.z; tick(45);
ok(Math.abs(k0.z-zPin)<0.05,'beak grip beats the slide (drift '+(Math.abs(k0.z-zPin)).toFixed(3)+'m)');
un(P1.grab); k0.tug=null; tick(2);

C.section('prop verbs: grab/drop/bank per category; cone rules');
tick(30);
function grabProp(p){ sweep(H,p,1.6); p.mesh.position.set(p.x,p.y,p.z); stage(H,k0,{x:p.x,y:p.y,z:p.z}); k0.y=Math.max(k0.y,p.y-0.4); tick(2); tap(P1.grab); return k0.held===p; }
const cone=G.props.find(p=>p.cone&&!p.heldBy&&!p.banked);
ok(grabProp(cone),'grab cone');
let d0;{ k0.ry=0; const sx=k0.x,sz=k0.z; hold(P1.fwd); tick(30); un(P1.fwd); d0=Math.hypot(k0.x-sx,k0.z-sz); }
const _hA=k0.held?k0.held.name:'none';
tap(P1.grab); tick(2);
const _hB=k0.held?k0.held.name:'none';
let d1;{ k0.ry=0; const sx=k0.x,sz=k0.z; hold(P1.fwd); tick(30); un(P1.fwd); d1=Math.hypot(k0.x-sx,k0.z-sz); }
ok(d0<d1*0.75,'cone slows carry ('+d0.toFixed(2)+' vs '+d1.toFixed(2)+') [heldA='+_hA+' heldB='+_hB+']');
ok(grabProp(cone),'re-grab cone');
hold(P1.flap); tick(90); un(P1.flap); // AMENDED 2026-08-26: hold-to-fly
ok(k0.y<=2.25,'cone fly ceiling holds under sustained lift y='+k0.y.toFixed(2));
tap(P1.grab); tick(60);
const shiny=G.props.find(p=>p.shiny&&!p.banked&&!p.heldBy);
ok(grabProp(shiny),'grab shiny '+shiny.name);
k0.x=G.nestPos.x;k0.z=G.nestPos.z;k0.y=G.nestY;k0.grounded=true;tick(2);
const st0=G.nestStash; tap(P1.grab);
ok(shiny.banked&&G.nestStash===st0+1,'shiny banks to stash');
const food=G.props.find(p=>p.food&&!p.banked&&!p.heldBy);
ok(grabProp(food),'grab food '+food.name);
k0.x=G.nestPos.x;k0.z=G.nestPos.z;k0.y=G.nestY;k0.grounded=true;tick(2);
const f0=G.stats.food; tap(P1.grab);
ok(G.stats.food===f0+1&&food.banked,'food eaten at nest');

C.section('DO NOT FEED payoff: scoffing in front of Rex (fix F12)');
clearTraffic(H);
const rex=G.humans.find(h=>h.key==='rex');
const food2=G.props.find(p=>p.food&&!p.banked&&!p.heldBy);
if(food2&&!G.missions.find(m=>m.id==='sign').done){ /* sign already torn in exhaustion — restage */ }
G.missions.find(m=>m.id==='sign').done=false; // dated restage 2026-08-26: sign mission reset to test payoff gate
if(food2){
  ok(grabProp(food2),'grab second food '+food2.name);
  rex.x=G.nestPos.x+4; rex.z=G.nestPos.z; rex.state='idle'; rex.stun=0; rex.chaseKea=null;
  k0.x=G.nestPos.x;k0.z=G.nestPos.z;k0.y=G.nestY;k0.grounded=true;tick(2);
  tap(P1.grab); tick(3);
  ok(rex.state==='chase','Rex enforces the sign (state='+rex.state+')');
  rex.x=45;rex.z=45;rex.state='idle';rex.chaseKea=null;rex.home={x:45,z:45};
}
G.missions.find(m=>m.id==='sign').done=true;

C.section('traffic lifecycle: spawn, body-block, driver, chip, clear, despawn cleanup (fix F4 enforcing)');
far(H,k0);far(H,k1);k0.stun=0;
clearTraffic(H);
G.trafT.a=0.01; tick(3);
let car=G.cars.filter(c=>c.traffic).pop();
ok(!!car,'traffic spawns');
let stopped=false;
for(let i=0;i<60*8&&!stopped;i++){ k0.x=car.x+4; k0.z=car.z; k0.y=0; k0.grounded=true; k0.stun=99; X.update(1/60); if(car.speed<0.3)stopped=true; }
ok(stopped,'body-block stops a car (jam can never be bricked by banking cones)');
let drv=null;
for(let i=0;i<60*9&&!drv;i++){ k0.x=car.x+4;k0.z=car.z;k0.y=0;k0.grounded=true;k0.stun=99; X.update(1/60); drv=G.humans.find(h=>h.driverCar===car); }
ok(!!drv,'driver exits after prolonged block');
let chip=null;
for(let i=0;i<60*6&&!chip;i++){ k0.x=car.x+4;k0.z=car.z;k0.y=0;k0.grounded=true;k0.stun=99; X.update(1/60); chip=G.props.find(p=>p.name==='hot chip'); }
ok(!!chip,'jammed driver throws a chip');
const deadRefsBefore=G.inter.filter(i=>i.car===car).length;
ok(deadRefsBefore>0,'car carries tear entries pre-despawn ('+deadRefsBefore+')');
far(H,k0); k0.stun=0; G.trafT.a=999;
for(const pr of G.props){ if(!pr.heldBy&&!pr.banked&&Math.abs(pr.z-34)<4.5){ pr.x=-49;pr.z=-44;pr.y=0.1;pr.mesh.position.set(pr.x,pr.y,pr.z);} } // AMENDED 2026-08-26: clear road strays
let gone=false; for(let i=0;i<60*45&&!gone;i++){ X.update(1/60); if(!G.cars.includes(car))gone=true; }
ok(gone,'car despawns after crossing');
ok(G.inter.filter(i=>i.car===car).length===0,'despawn removes its tear entries from the registry (F4)');
ok(!G.colliders.includes(car.collider),'collider removed');

C.section('tug range-release (fix F5 enforcing): teleported kea lets go');
clearTraffic(H);
// AMENDED 2026-08-26: exhaustion now clears all 30 tears, so restage one for this physics-class test
const anyTear=G.inter.find(i=>i.kind==='tear'&&i.mission==='sign');
anyTear.done=false; anyTear.progress=0;
ok(!!anyTear,'restaged tear for range test: '+anyTear.label);
sweep(H,anyTear.getPos(),2.2); stage(H,k0,anyTear.getPos()); tick(2);
hold(P1.grab); tick(20);
ok(k0.tug===anyTear&&anyTear.progress>0.1,'latched ('+anyTear.progress.toFixed(2)+')');
k0.x+=12; tick(2);
ok(k0.tug===null,'tug releases when target leaves range');
un(P1.grab); anyTear.done=true; tick(3); // restore restage

C.section('snow bomb: miss, reload, hit');
ok(G.missions.find(m=>m.id==='snow').done!==true,'snow mission untouched by tear exhaustion (F16: zone no longer eats the press at the nails)');
clearTraffic(H); // AMENDED 2026-08-26: sterilize arena — Dave was strolling through the miss zone
G.humans.forEach(h=>{h.x=45;h.z=45;h.state='idle';h.chaseKea=null;h.stun=0;});
const daveH=G.humans.find(h=>h.key==='dave'); if(daveH){daveH.onLadder=true;daveH.x=G.ladder.x;daveH.z=G.ladder.z+0.6;}
const sc=G.snowCap, hut=sc.hut;
sc.loaded=true; sc.mesh.visible=true;
k0.stun=0; k0.x=hut.x; k0.z=hut.z+2.4; k0.y=X.groundHeightAt(k0.x,k0.z,4); k0.grounded=true; tick(1);
tap(P1.grab); tick(90);
ok(sc.loaded===false,'snow consumed on miss');
ok(G.missions.find(m=>m.id==='snow').done!==true,'miss does not complete mission');
sc.reloadT=0.01; tick(5);
ok(sc.loaded===true,'snow reloads');
const trish=G.humans.find(h=>h.key==='trish');
trish.x=hut.x; trish.z=hut.z+2.9; trish.state='idle'; trish.stun=0;
k0.x=hut.x; k0.z=hut.z+2.4; k0.y=X.groundHeightAt(k0.x,k0.z,4); k0.grounded=true; tick(1);
tap(P1.grab);
let _stag=false; // AMENDED 2026-08-27g: humans collide now — pin the victim under the payload, latch the stagger
for(let i=0;i<110;i++){ trish.x=hut.x; trish.z=hut.z+2.9; X.update(1/60);
  if(trish.stun>0||trish.state==='grumble')_stag=true; }
ok(G.missions.find(m=>m.id==='snow').done===true,'direct hit completes SNOW BUSINESS');
ok(_stag,'victim staggered');
trish.x=45;trish.z=45;

C.section('roof luge (works when NOT tugging)');
G.missions.find(m=>m.id==='slide').done=false; // dated restage 2026-08-26
k0.x=hut.x; k0.z=hut.z+0.5; k0.y=4.0; k0.grounded=true; k0.slideD=0; k0.slideV=0; k0.slideScored=false; k0.vy=0; k0.tug=null;
const s0=G.score; tick(60*3);
ok(G.missions.find(m=>m.id==='slide').done===true,'luge mission');
ok(G.score>s0,'luge scores (+'+(G.score-s0)+')');

C.section('sheep panic (AMENDED 2026-08-27e: drover update — panic may leave the pen; homing covers the return)');
const sh=G.sheep[0]; const _px=sh.x,_pz=sh.z; sh.panic=5;
tick(60*6);
ok(Math.hypot(sh.x-_px,sh.z-_pz)>0.8,'panic moves the sheep');
ok(Math.abs(sh.x)<=51&&Math.abs(sh.z)<=51,'panic stays in the world');

C.section('wanted heat, gym deploy + drain, isolated decay');
clearTraffic(H); far(H,k0); far(H,k1);
G.wantedT=3.9; X.noise({x:0,z:0},9,'misdeed',null);
ok(G.gymOut===true&&!!G.gym,'gym deploys at wanted 4');
const gy=G.inter.find(i=>i.repeat&&/GYM/.test(i.label));
ok(!!gy,'gym is peckable');
stage(H,k0,gy.getPos()); tick(2);
const w0=G.wantedT; tap(P1.grab);
ok(G.wantedT<w0-0.9,'gym drains heat ('+w0.toFixed(2)+' -> '+G.wantedT.toFixed(2)+')');
clearTraffic(H); far(H,k0);
const w1=G.wantedT; tick(60*10);
ok(G.wantedT<w1&&G.wantedT>=w1-0.6,'passive decay in range (10s: '+w1.toFixed(2)+' -> '+G.wantedT.toFixed(2)+')');

C.section('combo multiplier math (fix F2 enforcing: 2nd chained action = x2)');
G.combo=0;G.comboT=0;G.comboArmed=false;
const c0=G.score; X.award(10,'T1',{x:0,y:1,z:0});
ok(G.score-c0===10,'first award x1');
const c1=G.score; X.award(10,'T2',{x:0,y:1,z:0});
ok(G.score-c1===20,'chained award x2 (+'+(G.score-c1)+')');
tick(60*6);
const c2=G.score; X.award(10,'T3',{x:0,y:1,z:0});
ok(G.score-c2===10,'combo resets after 5s idle');

C.section('tom nap discipline (fix F3 enforcing)');
tomH.home={x:28,z:0};
tomH.asleep=false; tomH.sleepT=0.5; tomH.state='grumble'; tomH.x=-10; tomH.z=-25; tomH.t=0; tomH.stun=0;
tick(60*3);
ok(!(tomH.asleep&&Math.hypot(tomH.x-tomH.home.x,tomH.z-tomH.home.z)>4),'tom refuses to nap on the tarmac (aslp='+tomH.asleep+' '+Math.hypot(tomH.x-tomH.home.x,tomH.z-tomH.home.z).toFixed(1)+'m out)');
let arrived=false; for(let i=0;i<60*30&&!arrived;i++){ X.update(1/60); if(tomH.asleep)arrived=true; }
ok(arrived&&Math.hypot(tomH.x-tomH.home.x,tomH.z-tomH.home.z)<4,'tom walks home then naps ('+tomH.x.toFixed(1)+','+tomH.z.toFixed(1)+')');

// ADDED 2026-08-26 (v5): wearables + the hidden AS-WELL page
C.section('wearables: sleep-guarded beanie theft, wear, doff, awake denial');
// tom ended the previous section asleep at his bench — the beanie sits by his head
const bnP=G.props.find(pp=>/beanie/.test(pp.name));
ok(!!bnP&&bnP.wearable,'beanie prop exists and is wearable');
ok(tomH.asleep===true,'tramper is snoring (precondition)');
ok(tomH.hatG&&tomH.hatG.visible===false,'his beanie is OFF his head, beside him (spawn wiring)');
stage(H,k0,{x:bnP.x,y:bnP.y,z:bnP.z}); k0.y=Math.max(k0.y,bnP.y-0.4); tick(2); tap(P1.grab); tick(2);
ok(k0.hatProp===bnP&&bnP.worn===true,'beanie stolen off the sleeping head and WORN');
ok(G.missions.find(m=>m.id==='b_beanie').done===true,'b_beanie fires');
far(H,k0); tick(2); tap(P1.grab); tick(2); // no target, hat on -> doff
ok(k0.hatProp===null&&bnP.worn===false,'doff returns the hat to the world');
tomH.asleep=false; tomH.zzz.visible=false; tomH.state='idle'; tomH.sleepT=30; tick(1); // sleepT reset or his nap AI re-sleeps him mid-test
bnP.x=30; bnP.z=30; bnP.y=0.12; if(bnP.mesh)bnP.mesh.position.set(30,0.12,30); // isolate: nothing else in reach
stage(H,k0,{x:30,y:0.12,z:30}); tick(2); tap(P1.grab); tick(1);
ok(k0.hatProp===null&&bnP.worn===false,'awake tramper guards his beanie');
tomH.asleep=true; tomH.zzz.visible=true;

C.section('cap-pop: close screech ragdolls the ranger, cap becomes loot');
const rexH2=G.humans.find(h=>h.key==='rex');
rexH2.x=40;rexH2.z=40;rexH2.state='idle';rexH2.stun=0;rexH2.chaseKea=null;
k0.x=rexH2.x+1.2;k0.z=rexH2.z;k0.y=0;k0.grounded=true;k0.stun=0;k0.screamCd=0;k0.screamT=99;
tick(1); tap(P1.scream); tick(3);
ok(rexH2._capPopped===true&&rexH2.hatG.visible===false,'cap popped clean off');
ok(!!rexH2.launched||rexH2.sprawl>0,'ranger is mid-pratfall');
const capP=G.props.find(pp=>/ranger's cap/.test(pp.name));
ok(!!capP,'cap is now a wearable prop');
let rec=0; while((rexH2.launched||rexH2.sprawl>0)&&rec++<60*8)H.X.update(1/60);
ok(rec<60*8,'ranger sprawls then recovers ('+(rec/60).toFixed(1)+'s)');
stage(H,k0,{x:capP.x,y:capP.y,z:capP.z}); k0.y=Math.max(k0.y,capP.y-0.4); tick(2); tap(P1.grab); tick(2);
ok(k0.hatProp===capP,'wearing the ranger\'s cap');
ok(G.missions.find(m=>m.id==='b_cap').done===true,'b_cap fires');

C.section('AS WELL page: hidden until the main list is done, never blocks the finale');
X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); G.missions.forEach(m=>{m.done=false; m.n=0;}); G.chapIdx=0; // virgin board, world untouched
ok(G.missions.filter(m=>m.bonus).length===6,'six bonus rows exist');
G.finaleOn=false; G.missions.find(m=>m.id==='apex').locked=true;
const mains=G.missions.filter(m=>!m.finale&&!m.bonus&&!m.done);
for(let i=0;i<mains.length-1;i++)mains[i].done=true;
const last=mains[mains.length-1];
ok(G.missions.filter(m=>m.bonus&&m.locked).length>=4,'bonus rows still ??? pre-completion');
H.X.done(last.id);
ok(G.finaleOn===true,'main-list completion arms the finale (bonus rows did not block it)');
ok(G.missions.filter(m=>m.bonus&&m.locked).length===0,'…and reveals the AS WELL page');

C.section('b_five: fifth shiny in the nest');
G.nestStash=4;
const sh5=G.props.find(pp=>pp.shiny&&!pp.banked&&!pp.heldBy&&!pp.wearable);
ok(!!sh5,'a shiny remains: '+(sh5&&sh5.name));
sweep(H,{x:sh5.x,z:sh5.z},1.6); sh5.mesh.position.set(sh5.x,sh5.y,sh5.z);
stage(H,k0,{x:sh5.x,y:sh5.y,z:sh5.z}); k0.y=Math.max(k0.y,sh5.y-0.4); tick(2); tap(P1.grab);
ok(k0.held===sh5,'holding '+sh5.name);
k0.x=G.nestPos.x;k0.z=G.nestPos.z;k0.y=G.nestY;k0.grounded=true;tick(2); tap(P1.grab);
ok(G.missions.find(m=>m.id==='b_five').done===true,'b_five fires at stash 5');

// ADDED 2026-08-26 (v7): documented-crime case files — registry integrity
C.section('case files: every dossier maps to a real mission, headless never opens one');
const CF=H.X.CASEFILES;
ok(Array.isArray(CF)&&CF.length===6,'six case files on record');
ok(new Set(CF.map(c=>c.id)).size===6,'ids unique');
const classicIds=new Set(G.missions.map(m=>m.id));
for(const cf of CF){
  ok(classicIds.has(cf.id),'dossier "'+cf.title+'" maps to mission '+cf.id);
  ok(typeof cf.vid==='string'&&cf.vid.length===11,'valid clip id for '+cf.id);
  ok(cf.at&&isFinite(cf.at.x)&&isFinite(cf.at.z)&&cf.at.r>0,'crime scene set for '+cf.id);
}
H.X.checkCaseFiles();
ok(CF.every(c=>!c.seen),'headless: no dossier ever opens (guard holds)');
ok(G.missions.find(m=>m.id==='slide').label.indexOf('Toboggan')===0,'the luge is now spelled out');

// ADDED 2026-08-26 (v9): cars respect each other's space
C.section('traffic follow-gap: queue never merges');
G.props.filter(pp=>pp.cone&&!pp.heldBy).slice(0,1).forEach(cn=>{cn.x=6;cn.z=32.6;cn.y=0.06;cn.mesh.position.set(cn.x,cn.y,cn.z);});
G.trafT.a=0.01; G.trafT.b=999;
let tc1=null; for(let i=0;i<240&&!tc1;i++){ H.X.update(1/60); tc1=G.cars.find(c=>c.traffic&&c.dir===1); }
ok(!!tc1,'first traffic car spawned');
tc1.x=-16; G.trafT.a=0.01;
let tc2=null; for(let i=0;i<240&&!tc2;i++){ H.X.update(1/60); tc2=G.cars.find(c=>c.traffic&&c.dir===1&&c!==tc1); }
ok(!!tc2,'second traffic car spawned behind');
tc2.x=-46; tc2.speed=8;
let minGap=1e9;
for(let i=0;i<60*8;i++){ H.X.update(1/60);
  const g=Math.abs(tc2.x-tc1.x); if(g<minGap)minGap=g; }
ok(minGap>=2.2,'bodies never interpenetrate (min gap '+minGap.toFixed(2)+')');
ok(Math.abs(tc2.x-tc1.x)>=3.3,'follower parks a respectful length back ('+Math.abs(tc2.x-tc1.x).toFixed(2)+')');
ok(tc1.speed<0.6&&tc2.speed<0.9,'both queued at the cone');
// ADDED 2026-08-27: chapter pages + quickie detectors (ski field, trailhead, pegs, chimney)
C.section('chapters: eight pages, visibility-gated, credit never blocked');
X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); G.missions.forEach(m=>{m.done=false; m.n=0;}); G.chapIdx=0; // virgin board, world untouched
H.X.startGame(1); tick(3); const kq=G.keas[0]; // fresh world: earlier sections completed most pages already
ok(Array.isArray(G.chapters)&&G.chapters.length===8,'eight chapter pages defined');
ok(G.chapters[4]==='THE SKI FIELD'&&G.chapters[5]==='THE TRAILHEAD','new settings hold pages 5 and 6');
const cpRows=G.missions.filter(m=>m.area==='THE CARPARK'&&!m.finale&&!m.hide&&!m.bonus);
ok(cpRows.length>=5,'carpark page has its rows incl quickies ('+cpRows.length+')');
const idx0=G.chapIdx;
for(const m of cpRows)if(!m.done)H.X.done(m.id);
ok(G.chapIdx>idx0,'page turns when the carpark list clears (chapIdx '+idx0+' -> '+G.chapIdx+')');
ok(G.missions.find(m=>m.id==='paddock').done!==true,'later-page mission still undone (no false credit — paddock untouched)');

C.section('quickies: pegs, ski pole, ski relocation, chimney, tow wheel, pack->muesli');
const qpPre=G.missions.find(m=>m.id==='q_pegs'); const preDone=!!(qpPre&&qpPre.done);
const pegs=G.props.filter(pp=>/clothes peg/.test(pp.name));
ok(pegs.length===3,'three pegs on the line');
for(const pg of pegs){ stage(H,kq,{x:pg.x,y:pg.y,z:pg.z}); kq.y=Math.max(kq.y,pg.y-0.3); tick(2); tap(P1.grab); tick(2);
  if(kq.held===pg){ far(H,kq); tick(1); tap(P1.grab); tick(2); } }
const qp=G.missions.find(m=>m.id==='q_pegs');
ok(qp.done===true&&(preDone||qp.n>=3),'all three pegs stolen -> q_pegs done ('+(preDone?'pre-done':qp.n+'/3')+')');

const pol=G.props.find(pp=>pp.name==='ski pole'&&pp.mission==='s_pole');
stage(H,kq,{x:pol.x,y:pol.y,z:pol.z}); kq.y=Math.max(kq.y,pol.y-0.3); tick(2); tap(P1.grab); tick(2);
ok(G.missions.find(m=>m.id==='s_pole').done===true,'ski pole pickup fires s_pole');
if(kq.held){ far(H,kq); tick(1); tap(P1.grab); tick(2); }

const ski=G.props.find(pp=>pp.name==='ski'&&pp.missionFar==='s_ski');
stage(H,kq,{x:ski.x,y:ski.y,z:ski.z}); kq.y=Math.max(kq.y,ski.y-0.3); tick(2); tap(P1.grab); tick(2);
ok(kq.held===ski,'the marked ski is carryable (heavy)');
for(let i=0;i<46;i++){ kq.x+=0.6; kq.y=1.0; kq.vy=0; tick(1); } // fly-carry at believable speed: F5 range-release drops cargo on teleport-fast movement
tick(1); tap(P1.grab); tick(3);
ok(G.missions.find(m=>m.id==='s_ski').done===true,'ski dropped 24 out -> missionFar credits s_ski [held:'+(ski.heldBy?ski.heldBy.id:'no')+' d:'+Math.hypot(ski.x-ski.home.x,ski.z-ski.home.z).toFixed(1)+' farScored:'+(!!ski._farScored)+']');

{ const wp=new THREE.Vector3(); G.chimneyRef.getWorldPosition(wp);
  for(let i=0;i<4;i++){ kq.x=wp.x; kq.y=wp.y; kq.z=wp.z; kq.grounded=true; kq.vy=0; tick(1); }
  ok(G.missions.find(m=>m.id==='q_chimney').done===true,'standing the chimney fires q_chimney [wp:'+wp.x.toFixed(1)+','+wp.y.toFixed(1)+','+wp.z.toFixed(1)+' kea:'+kq.x.toFixed(1)+','+kq.y.toFixed(1)+','+kq.z.toFixed(1)+' gr:'+kq.grounded+']'); }
for(let i=0;i<4;i++){ kq.x=G.towWheel.position.x; kq.y=2.2; kq.z=G.towWheel.position.z; kq.vy=0; tick(1); }
ok(G.missions.find(m=>m.id==='s_lift').done===true,'perching the tow wheel fires s_lift');


// ADDED 2026-08-27c: persistence, seeded RNG, cosmetic band
C.section('persistence: save -> re-boot -> hydrated');
{ const _m=new Map(); globalThis.localStorage={getItem:k=>_m.has(k)?_m.get(k):null,setItem:(k,v)=>_m.set(k,String(v)),removeItem:k=>_m.delete(k)};
  H.X.startGame(1); tick(3);
  H.X.done('wiper'); H.X.done('seal'); H.X.done('q_peck'); tick(2);
  ok(_m.has('keaSaveV1_n'),'save blob written on done()');
  const blob=JSON.parse(_m.get('keaSaveV1_n'));
  ok(blob.done.includes('seal')&&blob.done.includes('q_peck'),'blob carries mission ids ('+blob.done.length+')');
  H.X.startGame(1); tick(3); // hydrate runs in update
  const back=['wiper','seal','q_peck'].every(id=>G.missions.find(m=>m.id===id).done===true);
  ok(back,'re-boot restores done flags');
  H.X.SAVE.wipe();
  H.X.startGame(1); tick(3);
  ok(G.missions.find(m=>m.id==='seal').done!==true,'wipe -> fresh list');
  delete globalThis.localStorage; }
C.section('seeded RNG: identical boots');
{ H.X.setSeed(31); const s1=[H.X.rnd(0,1),H.X.rnd(0,1),H.X.rnd(0,1)];
  H.X.setSeed(31); const s2=[H.X.rnd(0,1),H.X.rnd(0,1),H.X.rnd(0,1)];
  ok(s1.join()===s2.join(),'same seed -> identical rnd stream');
  H.X.setSeed(32); const s3=[H.X.rnd(0,1),H.X.rnd(0,1),H.X.rnd(0,1)];
  ok(s3.join()!==s1.join(),'different seed diverges'); }
C.section('cosmetic band present');
{ H.X.startGame(1); tick(2); ok(!!G.keas[0].band,'kea wears a leg band mesh'); }

// ADDED 2026-08-27d: idle life — hands-off behaviors, instant cancel, tug immunity, 2P independence
C.section('idle life: the bird entertains itself, but never on the clock');
H.X.startGame(2); tick(3);
const ki=G.keas[0], kj=G.keas[1];
ki.x=-30; ki.z=18; ki.y=0; ki.grounded=true; kj.x=30; kj.z=18; kj.y=0; kj.grounded=true;
const parkH=()=>{ G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;}); };
parkH();
G.trafT.a=999; G.trafT.b=999; tick(2);
for(let i=0;i<60*12;i++){ parkH(); ki.x=-30; ki.z=18; if(!ki.grounded){/* hop in flight */} X.update(1/60); }
ok(ki.idleT>1||ki._idleEver,'left alone, the kea clocks idle time ('+(ki.idleT||0).toFixed(1)+'s, ever='+!!ki._idleEver+')');
ok(!!ki._idleEver,'an idle behavior fired within 12s');
// input cancels instantly
ki.idleAct={kind:'scan',t:0,dur:2,side:1}; ki.idleT=5;
hold(P1.fwd); tick(2); un(P1.fwd);
ok(!ki.idleAct&&ki.idleT===0,'player input wipes the act and the clock');
// tug immunity
{ const tt=G.inter.find(t=>t.kind==='tear'&&!t.done&&!t.needsBoth&&!t.needsPartner);
  const tp=tt.getPos(); ki.idleT=99; ki.x=tp.x; ki.z=tp.z; ki.y=tp.y; ki.vy=0; tick(1);
  hold(P1.grab); let st=0; while(!ki.tug&&st<120){ parkH(); ki.x=tp.x; ki.z=tp.z; ki.y=tp.y; ki.vy=0; X.update(1/60); st++; }
  ok(!!ki.tug,'latched a real tear for the immunity test');
  for(let i=0;i<30;i++){ parkH(); ki.y=tp.y; ki.vy=0; X.update(1/60); }
  ok(ki.idleT===0&&!ki.idleAct,'tugging is never idle [idleT='+ki.idleT.toFixed(2)+']');
  un(P1.grab); tick(2); }
// hop is real physics: force acquisitions until a hop rolls
let hopped=false, guard=0;
while(!hopped&&guard<200){ ki.idleAct=null; ki.idleT=99; ki.grounded=true; ki.y=0; ki.vy=0;
  let st=0; while(!ki.idleAct&&st<300){ parkH(); X.update(1/60); st++; }
  if(ki.idleAct&&ki.idleAct.kind==='hop'){ hopped=ki.vy>0.5||!ki.grounded; } guard++; }
ok(hopped,'a hop eventually rolls and leaves the ground (tries='+guard+')');
// 2P independence: kj idles while ki is driven
kj.idleT=99; kj.idleAct=null; ki.idleAct=null; ki.idleT=0;
hold(P1.fwd); let st2=0; while(!kj.idleAct&&st2<600){ parkH(); X.update(1/60); st2++; } un(P1.fwd);
ok(!!kj.idleAct&&!ki.idleAct,'kea2 preens while kea1 works');
// poseLock outranks idle
G.poseLock=true; kj.idleT=99; kj.idleAct=null; tick(60);
ok(!kj.idleAct,'poseLock suppresses idle entirely'); G.poseLock=false;

// ADDED 2026-08-27e: sheep drover — herdable anywhere, 15s unattended -> slow trudge home
C.section('sheep: herdable, homesick after 15 seconds, slow about it');
H.X.startGame(1); tick(3);
const kd=G.keas[0]; G.trafT.a=999; G.trafT.b=999;
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};});
const shp=G.sheep[0]; shp.home={x:G.pen.x,z:G.pen.z}; shp.x=shp.home.x; shp.z=shp.home.z; shp.panic=0; shp.calmT=0; tick(1);
const sx0=shp.x, sz0=shp.z;
// drive: bird sits behind the sheep, pointing it at the road (z+)
for(let i=0;i<60*4;i++){ kd.x=shp.x; kd.z=shp.z-1.0; kd.y=0.2; kd.vy=0; X.update(1/60); }
ok(Math.hypot(shp.x-sx0,shp.z-sz0)>3,'four seconds of drover work moves the sheep well clear ('+Math.hypot(shp.x-sx0,shp.z-sz0).toFixed(1)+'u)');
ok(shp.z>sz0+2,'and in the pushed direction (away from the bird)');
ok(shp.mode==='herd','mode reads herd');
// full muster to the road fires the crime
let sguard=0, lastZ=shp.z, slipHold=0, slip=1;
while(Math.abs(shp.z-34)>=2.0&&sguard<60*60){
  if(slipHold>0)slipHold--;
  if(sguard%45===0){ if(shp.z-lastZ<0.2){ slip=-slip; slipHold=110; } lastZ=shp.z; }
  const off=slipHold>0?slip*2.3:0;
  kd.x=shp.x+off; kd.z=shp.z-0.9; kd.y=0.2; kd.vy=0; X.update(1/60); sguard++; }
ok(Math.abs(shp.z-34)<2.2,'sheep mustered to road [z='+shp.z.toFixed(1)+' x='+shp.x.toFixed(1)+' mode='+shp.mode+' t='+(sguard/60).toFixed(0)+'s]');
tick(2);
ok(G.missions.find(m=>m.id==='q_muster').done===true,'q_muster credits');
// abandonment: 15s untouched, then the slow trudge
kd.x=-45; kd.z=-45; kd.y=0; tick(1);
const hx0=Math.hypot(shp.home.x-shp.x,shp.home.z-shp.z);
for(let i=0;i<60*14;i++)X.update(1/60);
ok(shp.mode!=='home','still waiting at 14s (calmT='+shp.calmT.toFixed(1)+')');
for(let i=0;i<60*3;i++)X.update(1/60);
ok(shp.mode==='home','walking home after the 15s mark');
const px=shp.x, pz=shp.z;
for(let i=0;i<60*5;i++)X.update(1/60);
const step5=Math.hypot(shp.x-px,shp.z-pz);
ok(step5>1.2&&step5<4.5,'homeward pace is a trudge, not a sprint ('+(step5/5).toFixed(2)+'u/s)');
ok(Math.hypot(shp.home.x-shp.x,shp.home.z-shp.z)<hx0-1,'and the distance home is falling');
// re-scare cancels the walk
kd.x=shp.x+0.8; kd.z=shp.z; kd.y=0.2; tick(30);
ok(shp.mode==='herd'&&shp.calmT===0,'a returning bird restarts the muster instantly');
kd.x=-45; kd.z=-45; tick(1);
let hg=0; while(Math.hypot(shp.home.x-shp.x,shp.home.z-shp.z)>=1.6&&hg<60*180){ X.update(1/60); hg++; }
ok(Math.hypot(shp.home.x-shp.x,shp.home.z-shp.z)<1.6,'left alone long enough, it makes it all the way back [t='+(hg/60).toFixed(0)+'s at '+shp.x.toFixed(1)+','+shp.z.toFixed(1)+' hd='+Math.hypot(shp.home.x-shp.x,shp.home.z-shp.z).toFixed(1)+' mode='+shp.mode+']');
ok(Math.abs(shp.x)<=51&&Math.abs(shp.z)<=51,'never left the world');

// ADDED 2026-08-27f: mission clarity — rewritten labels + hint pings at detector stages
C.section('mission clarity: hints ping near unfinished detector missions, then shut up');
H.X.startGame(1); tick(2);
const kh=G.keas[0]; G.trafT.a=999; G.trafT.b=999;
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};});
G.sheep.forEach(s=>{s.x=-48;s.z=-48;s.home={x:-48,z:-48};});
ok(G.hints&&G.hints.length>=8,'hint registry populated ('+(G.hints?G.hints.length:0)+')');
ok(/roof until the driver honks/.test(G.missions.find(m=>m.id==='roofhonk').label),'roofhonk label no longer circular');
ok(/roof snow down/.test(G.missions.find(m=>m.id==='snow').label),'snow label names the mechanic');
ok(/handbag/.test(G.missions.find(m=>m.id==='passport').label),'passport label names its source');
ok(/out of his car/.test(G.missions.find(m=>m.id==='paddock').label),'paddock label explains the lead');
const hMed=G.hints.find(h=>h.mid==='q_median');
for(let i=0;i<4;i++){ kh.x=hMed.x; kh.z=hMed.z; kh.y=hMed.y; kh.vy=0; kh.grounded=true; X.update(1/60); }
ok(G.hintNow&&(G.hintNow[0]==='q_median'||G.hintNow[0]==='jam'),'standing the centre line pings a road hint [got='+(G.hintNow&&G.hintNow[0])+']');
G.missions.find(m=>m.id==='q_median').done=true;
for(let i=0;i<4;i++){ kh.x=hMed.x; kh.z=hMed.z; kh.y=hMed.y; kh.vy=0; X.update(1/60); }
ok(G.hintNow[0]!=='q_median','done mission hints go silent');
G.missions.find(m=>m.id==='q_median').done=false;
// hint yields to a real prompt: stand at a takeable prop within hint radius of the road hints
const kp=G.props.find(p=>!p.heldBy&&!p.heavy&&Math.hypot(p.x-0,p.z-30)<40);
kh.x=kp.x; kh.z=kp.z; kh.y=Math.max(0.2,kp.y); kh.vy=0; tick(3);
ok(G.hintNow[0]===null||G.hintNow[0]===undefined,'a real interact prompt outranks the hint');
far(H,kh); tick(1);

// ADDED 2026-08-27g: full-interaction sweep + collision laws + camera keys + feathered wings
C.section('1P take-EVERYTHING sweep (the radio-crash class)');
H.X.startGame(1); tick(2);
const kg=G.keas[0]; G.trafT.a=999; G.trafT.b=999;
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;});
G.sheep.forEach(s=>{s.x=-48;s.z=-48;s.home={x:-48,z:-48};});
{ const fails=[]; const roster=G.props.slice();
  for(const p of roster){ if(p.banked||p.heldBy)continue;
    try{
      if(kg.held){kg.held.heldBy=null;kg.held=null;} if(kg.hatProp){kg.hatProp.heldBy=null;kg.hatProp.worn=false;kg.hatProp=null;} kg.stun=0;
      kg.x=p.x; kg.z=p.z; kg.y=Math.max(0.2,p.y); kg.vy=0; tick(1);
      tap(P1.grab); tick(2);
      if(kg.held===p){ tap(P1.grab); tick(2); } // drop in place
      else if(kg.hatProp===p){ tap(P1.grab); tick(2); } // doff
    }catch(e){ fails.push(p.name+': '+e.message); }
  }
  ok(fails.length===0,'every prop grabbable in 1P without a crash'+(fails.length?' — FAILED: '+fails.join(' | '):' ('+roster.length+' props)'));
}
{ const rp=G.props.find(p=>p.name==='DOC radio');
  ok(!!rp,'DOC radio present');
  rp.banked=false; rp.worn=false; rp.heldBy=null; rp.x=rp.home.x; rp.y=rp.home.y; rp.z=rp.home.z;
  if(rp.mesh)rp.mesh.position.set(rp.x,rp.y,rp.z);
  let threw=false; try{ kg.held=null;
    for(let i=0;i<3;i++){ kg.x=rp.x; kg.z=rp.z; kg.y=1.42; kg.vy=0; kg.grounded=true; X.update(1/60); }
    tap(P1.grab); for(let i=0;i<3;i++){ kg.x=rp.x; kg.z=rp.z; kg.y=1.42; kg.vy=0; X.update(1/60); } }catch(e){ threw=true; }
  kg.x=46; kg.z=-46; tick(1); if(kg.held)tap(P1.grab); tick(1); }

C.section('collision laws: nothing walks through furniture or rotated vehicles');
{ const hm=G.humans[0]; hm.x=15; hm.z=-13; hm.state='idle'; hm.launched=null; hm.sprawl=0; hm.onLadder=false;
  for(let i=0;i<8;i++)X.update(1/60);
  ok(Math.hypot(hm.x-15,hm.z+13)>0.6,'a human placed inside the picnic table is pushed clear ('+hm.x.toFixed(1)+','+hm.z.toFixed(1)+')');
  hm.x=45; hm.z=45; tick(1); }
{ kg.x=-11; kg.z=8; kg.y=0.3; kg.vy=0; kg.grounded=true; for(let i=0;i<6;i++)X.update(1/60);
  const dx=kg.x-(-11), dz=kg.z-8, sn=Math.sin(0.2), cs=Math.cos(0.2);
  const lx=Math.abs(dx*cs-dz*sn), lz=Math.abs(dx*sn+dz*cs);
  ok(lx>1.35||lz>2.85,'kea inside the ROTATED campervan is ejected past its true footprint (local '+lx.toFixed(2)+','+lz.toFixed(2)+')'); }

C.section('1P arrow camera: yaw is a camera, not a bird');
{ H.X.press('ArrowRight'); tick(30); H.X.release('ArrowRight');
  ok((G.camYaw||0)!==0,'ArrowRight steers camYaw in 1P ('+(G.camYaw||0).toFixed(2)+')');
  G.camYaw=0; }
H.X.startGame(2); tick(2);
{ const k2=G.keas[1]; k2.x=20; k2.z=20; k2.y=0; k2.grounded=true; tick(1); const x0=k2.x,z0=k2.z; const cy0=G.camYaw||0;
  H.X.press('ArrowUp'); tick(40); H.X.release('ArrowUp');
  ok(Math.hypot(k2.x-x0,k2.z-z0)>0.5,'in 2P the arrows still walk kea2');
  ok((G.camYaw||0)===cy0,'and never touch the camera'); }

C.section('feathered wings: fan opens on the flap, stacks on the ground');
H.X.startGame(1); tick(2);
const kw=G.keas[0];
ok(kw.feathers&&kw.feathers[0].length===8&&kw.feathers[1].length===8,'eight blades a side');
kw.grounded=false; kw.y=4; kw.flapDrive=true; for(let i=0;i<40;i++){ kw.y=4; kw.vy=0; X.update(1/60); }
ok(kw.wings[0].userData.open>0.5,'flap opens the fan ('+kw.wings[0].userData.open.toFixed(2)+')');
kw.flapDrive=false; kw.y=0; kw.grounded=true; kw.vy=0; for(let i=0;i<80;i++)X.update(1/60);
ok(kw.wings[0].userData.open<0.2,'grounded fold stacks it ('+kw.wings[0].userData.open.toFixed(2)+')');

process.exitCode=C.report()?1:0;
