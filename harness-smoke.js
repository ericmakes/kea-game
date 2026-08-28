/* KEA smoke battery — audit-kit style. Runs game logic under node with real three.js. */
const fs=require('fs');
const THREE=require('three');

/* ---- minimal stubs (kit §10) ---- */
global.THREE=THREE;
global.window=undefined; // logic checks typeof window
const noop=()=>{};
global.addEventListener=noop;
global.performance={now:()=>Date.now()};
global.requestAnimationFrame=noop;
global.innerWidth=1280; global.innerHeight=720; global.devicePixelRatio=1;

/* ---- assembly loader (identify logic by content, never index) ---- */
const SIG='KEA-LOGIC-START';
const html=require('fs').readFileSync(require('path').join(__dirname,'untitled-kea-game.html'),'utf8');
const logic=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(b=>b.includes(SIG));
if(!logic){console.error('SPECIMEN FAIL: logic block not found');process.exit(1);}
console.log('specimen: html '+html.length+' bytes, logic '+logic.length+' chars');

let F=[]; const ok=(c,m)=>{ if(!c) F.push(m); };

(new Function('THREE',logic+'\n;globalThis.__X=KEAGAME;'))(THREE);
const X=globalThis.__X, G=X.G;
ok(!!G,'state root G exposed');

/* ---- boot to world ---- */
X.boot(); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); // pristine: battery 9 owns save persistence // headless: scene+world only
ok(G.scene&&G.scene.children.length>40,'world populated, children='+(G.scene?G.scene.children.length:0));
ok(G.inter.length>25,'interactables registered n='+G.inter.length);
ok(G.props.length>=8,'loose props n='+G.props.length);
console.log('phase0 boot: PASS ('+G.inter.length+' interactables, '+G.props.length+' props, '+G.colliders.length+' colliders)');

/* ---- capability map (10 lines) ----
state root: KEAGAME.G · scene G.scene · tick: KEAGAME.update(dt) 1/60 caller RAF
input seam: press(code)+KEYS set; maps P1MAP/P2MAP; PRESSED cleared end of update
entities: G.keas (x,y,z,ry,held,tug) · G.humans (key,state,x,z) · G.props (name,x,z,heldBy,banked)
missions: G.missions[{id,done,n,need}] · start: startGame(1|2) · no persistence
headless: window.__KEA_HEADLESS__ or no window; renderer/audio/DOM gated
signature: 'KEA-LOGIC-START' */

const tick=(n,dt)=>{for(let i=0;i<(n||1);i++)X.update(dt||1/60);};
const P1=X.P1MAP,P2=X.P2MAP;
const hold=c=>X.KEYS.add(c), un=c=>X.KEYS.delete(c), tap=c=>{X.press(c);tick();X.release(c);};

/* ---- journey: title -> 1P via public API ---- */
X.startGame(2); // 2P covers superset
ok(G.running===true,'running after start');
ok(G.keas.length===2,'two keas spawned');
ok(G.missions.filter(m=>m.coop).length===4,'coop missions present in 2P');
ok(G.humans.map(h=>h.key).sort().join(',')==='dave,rex,tom,trish','named humans: '+G.humans.map(h=>h.key));
tick(30);
console.log('phase1 journey: PASS');

/* ---- movement isolation (couch law C) ---- */
const k0=G.keas[0],k1=G.keas[1];
const a0={x:k0.x,z:k0.z},a1={x:k1.x,z:k1.z};
hold(P1.fwd); tick(30); un(P1.fwd);
ok(Math.abs(k0.z-a0.z)+Math.abs(k0.x-a0.x)>0.5,'P1 fwd moves kea0');
ok(Math.abs(k1.z-a1.z)+Math.abs(k1.x-a1.x)<0.05,'P1 input does NOT move kea1 (moved '+(Math.abs(k1.z-a1.z)+Math.abs(k1.x-a1.x)).toFixed(3)+')');
hold(P2.left); tick(20); un(P2.left);
ok(Math.abs(k1.ry)>0.2,'P2 turn drives kea1 ry='+k1.ry.toFixed(2));
console.log('phase2.5 isolation: PASS');

/* ---- flight ---- */
// AMENDED 2026-08-26: flight v3 is HOLD-to-fly (sustained wingbeats), not tap impulses
const y0=k0.y; hold(P1.flap); tick(35); 
ok(k0.y>y0+1.2,'held flap climbs y='+k0.y.toFixed(2));
un(P1.flap); // AMENDED 2026-08-26 (2): momentum arc is intended — assert gravity retakes within half a second
let arcT=0; while(k0.vy>0&&arcT<30){tick(1);arcT++;}
ok(arcT<30,'release arcs over the top in '+arcT+' ticks');
tick(180); ok(k0.grounded===true&&k0.y<=0.01+X.groundHeightAt(k0.x,k0.z,k0.y+0.4)+0.01,'lands, grounded='+k0.grounded+' y='+k0.y.toFixed(2));
console.log('system flight: PASS');

/* ---- tear a wiper (legal staging: park kea at a parked car's wiper) ---- */
const wiperT=G.inter.find(i=>i.kind==='tear'&&i.mission==='wiper'&&!i.done);
ok(!!wiperT,'a wiper tear exists');
let wp=wiperT.getPos();
k0.x=wp.x; k0.z=wp.z+0.6; k0.y=X.groundHeightAt(k0.x,k0.z,2); k0.grounded=true;
hold(P1.grab); tick(150); un(P1.grab); tick(2);
ok(wiperT.done===true,'wiper torn after hold, progress='+wiperT.progress.toFixed(2)+'/'+wiperT.need);
const m_w=G.missions.find(m=>m.id==='wiper');
ok(m_w.n===1,'wiper mission counts once n='+m_w.n);
ok(G.props.some(p=>p.name==='wiper'),'loose wiper spawned');
ok(G.score>0,'score awarded '+G.score);
console.log('system tear: PASS (score '+G.score+')');

/* ---- carry + nest bank ---- */
const loose=G.props.find(p=>p.name==='wiper'&&!p.heldBy);
k0.x=loose.x; k0.z=loose.z; k0.y=loose.y; tick(2);
tap(P1.grab);
ok(k0.held===loose,'picked up wiper');
k0.x=G.nestPos.x; k0.z=G.nestPos.z; k0.y=G.nestY; k0.grounded=true; tick(2);
tap(P1.grab);
ok(loose.banked===true&&k0.held===null,'banked at nest');
ok(G.nestStash===1,'stash count '+G.nestStash);
console.log('system carry/bank: PASS');

/* ---- passport chain: peck handbag -> steal -> nest -> mission ---- */
const bag=G.inter.find(i=>i.kind==='peck'&&/HANDBAG/.test(i.label));
const bp=bag.getPos(); k0.x=bp.x; k0.z=bp.z+0.5; k0.y=0; k0.grounded=true; tick(2);
tap(P1.grab); tap(P1.grab);
ok(bag.done===true,'handbag pecked open');
const pass=G.props.find(p=>p.mission==='passport');
ok(!!pass,'passport spawned');
k0.x=pass.x;k0.z=pass.z;k0.y=pass.y; tick(2); tap(P1.grab);
ok(k0.held===pass,'holding passport');
k0.x=G.nestPos.x;k0.z=G.nestPos.z;k0.y=G.nestY; tick(2); tap(P1.grab);
ok(G.missions.find(m=>m.id==='passport').done===true,'passport mission done');
console.log('system heist: PASS');

/* ---- owner aggro + shoo drops item ---- */
const sand=G.props.find(p=>p.snack==='sandwich'); // 2026-08-28: sandwich credits on the scoff now
k0.stun=0; k0.x=sand.x;k0.z=sand.z;k0.y=sand.y; tick(2); tap(P1.grab);
ok(k0.held===sand,'holding sandwich');
tick(90,1/60);
const trish=G.humans.find(h=>h.key==='trish');
ok(trish.state==='chase'||trish.state==='shoo'||k0.held===null,'trish reacts to theft, state='+trish.state);
trish.x=k0.x+0.5; trish.z=k0.z; trish.state='chase'; trish.chaseKea=k0; tick(10);
ok(k0.held===null,'shoo made kea drop sandwich (stun='+k0.stun.toFixed(2)+')');
ok(G.stats.shooed>=1,'shoo counted');
tick(400); // let trish retrieve + world settle
console.log('system persecution: PASS (trish now '+trish.state+')');

/* ---- traffic jam via cone (the Homer Tunnel test) ---- */
const cone=G.props.find(p=>p.cone&&!p.heldBy);
cone.x=0; cone.z=33.2; cone.y=0.06; cone.vy=0; // stage: cone on road
G.trafT.a=0.01; G.trafT.b=99; tick(2);
let car=G.cars.find(c=>c.traffic);
ok(!!car,'traffic car spawned at x='+(car&&car.x));
let jammed=false;
for(let i=0;i<60*30&&!jammed;i++){ X.update(1/60); const m=G.missions.find(m=>m.id==='jam'); if(m.done)jammed=true;
  if(i===60*8){G.trafT.a=0.01;} } // second car
ok(jammed,'cone caused a certified traffic jam');
const stopped=G.cars.filter(c=>c.traffic&&c.speed<0.5).length;
ok(stopped>=1,'cars actually stopped n='+stopped);
console.log('system traffic: PASS (jam mission '+jammed+')');

/* ---- chilly bin coop gate: solo must NOT open, duo must ---- */
const latch=G.chilly.latch;
ok(latch.needsPartner===true,'latch requires partner');
k1.x=-40;k1.z=-40; // partner far away
const lp=latch.getPos(); k0.x=lp.x;k0.z=lp.z+0.7;k0.y=0;k0.grounded=true;k0.stun=0; tick(2);
hold(P1.grab); tick(200); un(P1.grab);
ok(latch.done!==true&&latch.progress<0.05,'solo tug does NOT open chilly bin (progress '+latch.progress.toFixed(2)+')');
k1.x=lp.x; k1.z=lp.z-0.7; k1.y=0; k1.grounded=true; tick(2);
hold(P1.grab); hold(P2.grab); tick(200); un(P1.grab); un(P2.grab); tick(2);
ok(latch.done===true,'duo opens chilly bin');
ok(G.missions.find(m=>m.id==='coop_bin').done===true,'coop_bin mission done');
ok(G.props.some(p=>p.mission==='pav'),'pavlova spawned');
console.log('system coop gate: PASS');

/* ---- tarp needs BOTH tugging ---- */
const tarp=G.tarp; const tp=tarp.getPos();
k0.x=tp.x-0.8;k0.z=tp.z;k0.y=0;k0.grounded=true; k1.x=-40;k1.z=-40; tick(2);
hold(P1.grab); tick(120);
ok(tarp.progress<0.05,'solo tarp tug blocked');
k1.x=tp.x+0.8;k1.z=tp.z;k1.y=0;k1.grounded=true; tick(2);
hold(P2.grab); tick(160); un(P1.grab); un(P2.grab);
ok(tarp.done===true,'both-kea tarp rip works');
console.log('system big pull: PASS');

/* ---- duet screech on van roof ---- */
const v=G.vanTop;
k0.x=v.x;k0.z=v.z;k0.y=v.top;k0.grounded=true;k0.screamCd=0;
k1.x=v.x+0.6;k1.z=v.z;k1.y=v.top;k1.grounded=true;k1.screamCd=0; tick(2);
X.press(P1.scream); X.update(1/60); X.release(P1.scream);
X.press(P2.scream); X.update(1/60); X.release(P2.scream);
ok(G.missions.find(m=>m.id==='duet').done===true,'duet mission done');
console.log('system duet: PASS');

/* ---- screech wakes tom ---- */
const tom=G.humans.find(h=>h.key==='tom');
if(tom.asleep!==true){tom.asleep=true;tom.zzz.visible=true;}
k0.x=tom.x+1;k0.z=tom.z;k0.y=0;k0.screamCd=0;k0.screamT=99;k1.screamT=99; k1.x=-40;k1.z=-40; tick(2);
X.press(P1.scream); X.update(1/60); X.release(P1.scream);
ok(tom.asleep===false,'tom woken by screech');
ok(G.missions.find(m=>m.id==='wake').done===true,'wake mission done');
console.log('system dawn chorus: PASS');

/* ---- inert keys law: pause key P is not bound in headless; grab with nothing near is inert ---- */
k0.x=-48;k0.z=-48;k0.y=0; tick(2);
const s0=G.score; tap(P1.grab); tap(P1.grab);
ok(G.score===s0,'grab in empty tussock awards nothing');

/* ---- unattended survival: 30 sim-seconds of nothing ---- */
let crashed=null;
try{ tick(60*30); }catch(e){ crashed=e.message; }
ok(!crashed,'unattended 30s survives: '+crashed);
ok(G.score>=0&&Number.isFinite(G.score),'score finite '+G.score);
console.log('phase1 unattended: PASS');

/* ---- finale wiring sanity (stage remaining missions done, drive apex) ---- */
for(const m of G.missions){ if(!m.finale&&!m.done){ m.done=true; } }
G.finaleOn=false; X.done; // recompute via missionDone path not needed; call checkFinale prereq
const f=G.missions.find(m=>m.id==='apex'); f.locked=false; G.finaleOn=true;
k0.x=2;k0.z=14;k0.y=0;k0.grounded=true;
G.humans.forEach(h=>{h.asleep=false;h.zzz&&(h.zzz.visible=false);h.x=k0.x+3;h.z=k0.z+3;h.state='chase';h.chaseKea=k0;h.giveUpT=0;});
X.update(1/60);
ok(G.apexArmed===true,'apex arms with 4 chasers (chasing='+G.humans.filter(h=>h.state==='chase').length+')');
k0.x=G.nestPos.x;k0.z=G.nestPos.z;k0.y=G.nestY;k0.stun=0; X.update(1/60);
ok(G.won===true,'escape to nest wins');
console.log('phase finale: PASS');

if(F.length){ console.error('FINDINGS:\n  - '+F.join('\n  - ')); process.exit(1); }
console.log('ALL PASS — '+G.inter.length+' interactables, final chaos '+G.score);
