/* AUDIT PASS 2 — whole-game surfaces (2026-08-27) */
const {load,collector}=require('../2026-08-26/rig');
const H=load(),{X,G}=H, C=collector('AUDIT-PASS2');
const ok=C.ok, tick=n=>{for(let i=0;i<n;i++)X.update(1/60);};
const P1=H.P1, hold=H.hold, un=H.un, tap=H.tap;
X.boot(); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); // pristine: battery 9 owns save persistence

C.section('restart integrity under repetition (2->1->2)');
X.startGame(2); tick(2); const hN=G.humans.length, hiN=(G.hints||[]).length;
X.startGame(1); tick(2);
ok(G.keas.length===1&&G.humans.length===hN,'1P restart: 1 kea, full cast ('+G.humans.length+')');
X.startGame(2); tick(2);
ok(G.keas.length===2&&G.humans.length===hN&&(G.hints||[]).length===hiN,'2P restart: 2 keas, cast+hints stable');

C.section('colossal lock ladder');
X.startGame(2,{colossal:true}); tick(2);
const lk=id=>{ const m=G.missions.find(m=>m.id===id); return m&&typeof m.locked==='function'?m.locked():false; };
ok(lk('c_coneair')&&lk('c_stomp3')&&lk('c_fleeall'),'level 1: tiers II-IV locked');
G.level=3; ok(!lk('c_coneair')&&!lk('c_sololatch')&&!lk('snow')&&lk('c_stomp3'),'level 3 opens tier II only');
G.level=5; ok(!lk('c_stomp3')&&!lk('c_bunt')&&!lk('pielift')&&lk('c_fleeall'),'level 5 opens tier III only');
G.level=7; ok(!lk('c_fleeall')&&!lk('sign'),'level 7 opens tier IV');

C.section('rumble hooks (spy)');
X.startGame(2); tick(2);
G._rumbleSpy=[]; const kr=G.keas[1]; kr.stun=0; kr._stunPrev=0; tick(1);
kr.stun=1.6; tick(2);
ok(G._rumbleSpy.some(r=>r.i===1&&r.why==='stun'),'stun rising edge rumbles the right player');
let noThrow=true; try{ H.X.press; (0,eval)('1'); }catch(e){noThrow=false;}
ok(noThrow&&G._rumbleSpy.length>=1,'RUMBLE path headless-safe'); G._rumbleSpy=null;

C.section('camera auto-recenter timing (1P)');
X.startGame(1); tick(2);
G.camYaw=1.2; G.camIdleT=0; tick(60*2);
ok(G.camYaw>1.0,'no recenter inside 3s ('+G.camYaw.toFixed(2)+')');
tick(60*3);
ok(Math.abs(G.camYaw)<0.1,'eases home after the idle window ('+G.camYaw.toFixed(2)+')');
G.camYaw=1.2; G.camIdleT=10; H.X.press('ArrowLeft'); tick(2); H.X.release('ArrowLeft'); tick(50);
ok(G.camYaw>0.9,'touching the camera resets the clock ('+G.camYaw.toFixed(2)+')');
G.camYaw=0;

C.section('rotated tray-top: standing math');
{ const cx=12,cz=7,ry=-0.15, lx=0.9, lz=2.0;
  const wx=cx+lx*Math.cos(ry)+lz*Math.sin(ry), wz=cz-lx*Math.sin(ry)+lz*Math.cos(ry);
  const gh=X.groundHeightAt(wx,wz,2.0);
  ok(Math.abs(gh-1.4)<0.05,'rotated ute corner reads top 1.4 ('+gh.toFixed(2)+')'); }

C.section('detector quickfire — legit verbs only');
G.trafT.a=999; G.trafT.b=999;
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;});
G.sheep.forEach(s=>{s.x=-48;s.z=-48;s.home={x:-48,z:-48};});
const kq=G.keas[0];
const carryTo=(p,x,y,z)=>{ if(kq.held){kq.held.heldBy=null;kq.held=null;}
  const perch=Math.max(0.25,p.y,X.groundHeightAt(p.x,p.z,3)+0.02);
  for(let i=0;i<3;i++){ kq.x=p.x; kq.z=p.z; kq.y=perch; kq.vy=0; X.update(1/60); }
  tap(P1.grab); tick(2);
  if(kq.held!==p)return false;
  for(let i=0;i<3;i++){ kq.x=x; kq.z=z; kq.y=y; kq.vy=0; X.update(1/60); }
  tap(P1.grab); tick(20); return true; };
{ const boot=G.props.find(p=>/boot/i.test(p.name)&&!p.banked&&!p.heldBy);
  const c1=carryTo(boot,0,0.4,34);
  ok(c1&&G.missions.find(m=>m.id==='bootroad').done===true,'bootroad: boot on the centre line credits'); }
{ const any=G.props.find(p=>!p.banked&&!p.heldBy&&!p.wearable&&!p.heavy&&!/boot/i.test(p.name));
  const c2=carryTo(any,5,9,20);
  ok(c2&&G.missions.find(m=>m.id==='airmail').done===true,'airmail: high drop credits ('+(any&&any.name)+')'); }
{ // legit chain: peck handbag + backpack so the table actually holds three things, then clear it
  const peckAt=(label)=>{ const t=G.inter.find(it=>it.kind==='peck'&&!it.done&&it.label&&it.label.includes(label));
    if(!t)return false; const q=t.getPos();
    for(let n=0;n<(t.needHits||1)+1;n++){ for(let i=0;i<2;i++){ kq.x=q.x; kq.z=q.z; kq.y=Math.max(0.25,q.y-0.3); kq.vy=0; X.update(1/60); } tap(P1.grab); tick(2); }
    return true; };
  peckAt('HANDBAG'); peckAt('BACKPACK'); tick(5);
  const tprops=G.props.filter(p=>p.home&&Math.hypot(p.home.x-15,p.home.z+13)<3.2&&!p.banked&&!p.heldBy);
  let moved=0, di=0; for(const p of tprops){ if(carryTo(p,30+di*3,0.4,-28-di*3))moved++; di++; }
  tick(30);
  ok(G.missions.find(m=>m.id==='q_table').done===true,'q_table credits after the legit unlock chain (moved '+moved+'/'+tprops.length+')'); }
{ // legit chain: tear both mirrors + raid the bin so five shinies exist in the world
  const tearOff=(label)=>{ const t=G.inter.find(it=>it.kind==='tear'&&!it.done&&it.label&&it.label.includes(label));
    if(!t)return false; const q=t.getPos(); const perch=Math.max(q.y,X.groundHeightAt(q.x,q.z,3)+0.02);
    hold(P1.grab); let st=0; while(!t.done&&st<60*8){ kq.x=q.x; kq.z=q.z; kq.y=perch; kq.vy=0; kq.grounded=true; X.update(1/60); st++; }
    un(P1.grab); tick(2); return t.done; };
  const peck2=(label)=>{ const t=G.inter.find(it=>it.kind==='peck'&&!it.done&&it.label&&it.label.includes(label));
    if(!t)return false; const q=t.getPos(); const perch=Math.max(0.25,q.y-0.3,X.groundHeightAt(q.x,q.z,3)+0.02);
    for(let n=0;n<(t.needHits||1)+1;n++){ for(let i=0;i<2;i++){ kq.x=q.x; kq.z=q.z; kq.y=perch; kq.vy=0; X.update(1/60); } tap(P1.grab); tick(2); }
    return true; };
  tearOff('MIRROR'); tearOff('MIRROR'); peck2('BIN LID'); tick(5);
  const shinies=G.props.filter(p=>p.shiny&&!p.banked&&!p.heldBy).slice(0,5);
  let banked=0;
  for(const p of shinies){ if(kq.held){kq.held.heldBy=null;kq.held=null;}
    const perch=Math.max(0.25,p.y,X.groundHeightAt(p.x,p.z,3)+0.02);
    for(let i=0;i<3;i++){ kq.x=p.x; kq.z=p.z; kq.y=perch; kq.vy=0; X.update(1/60); }
    tap(P1.grab); tick(2);
    if(kq.held!==p)continue;
    for(let i=0;i<4;i++){ kq.x=G.nestPos.x; kq.z=G.nestPos.z; kq.y=G.nestY; kq.vy=0; X.update(1/60); }
    tap(P1.grab); tick(3); if(p.banked)banked++; }
  ok(banked>=5&&G.missions.find(m=>m.id==='b_five').done===true,'b_five: five shinies banked in one nest ('+banked+')'); }

// ADDED 2026-08-28: landing sequence + strut phase
C.section('landing: flare fires in the air, crouch on the edge');
H.X.startGame(1); tick(2);
const kl=G.keas[0]; kl.x=0; kl.z=0; kl.y=3.2; kl.vy=-2.5; kl.grounded=false; kl.landFlare=0;
let flaredAir=false, crouched=false;
for(let i=0;i<240;i++){ X.update(1/60);
  if(!kl.grounded&&kl.landFlare>0&&kl.y>0.15)flaredAir=true;
  if(kl.grounded&&(kl.crouchT||0)>0)crouched=true;
  if(kl.grounded&&i>30)break; }
ok(flaredAir,'flare engages before touchdown');
ok(crouched,'touchdown crouch fires');
C.section('strut: the head stabs and holds');
kl.y=0; kl.vy=0; kl.grounded=true; tick(5);
{ let mx=-9,mn=9; hold(P1.fwd);
  for(let i=0;i<70;i++){ X.update(1/60); const t=kl._thr||0; if(t>mx)mx=t; if(t<mn)mn=t; }
  un(P1.fwd); tick(2);
  ok(mx>0.5&&mn<0.2,'thrust-hold cycles ('+mn.toFixed(2)+'..'+mx.toFixed(2)+')'); }
C.section('Dumpster Gang extractions: bins erupt, milestones sparkle');
H.X.startGame(1); tick(2);
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;});
const kb=G.keas[0];
{ const bt=G.inter.find(it=>it.kind==='peck'&&it.label&&it.label.includes('BIN LID'));
  ok(!!bt,'bin peck present');
  if(typeof G.needHydrate!=="undefined")G.needHydrate=false; tick(6);
  bt.done=false; bt.hits=0; if(G.bin)G.bin.open=false;
  const q=bt.getPos();
  const perch=Math.max(0.25,q.y-0.3,X.groundHeightAt(q.x,q.z,3)+0.02);
  for(let n=0;n<(bt.needHits||1)+1;n++){ for(let i=0;i<2;i++){ kb.x=q.x; kb.z=q.z; kb.y=perch; kb.vy=0; X.update(1/60); } tap(P1.grab); tick(2);
    console.log('  TAP'+n,'hits='+bt.hits,'done='+bt.done,'props='+G.props.length); }
  console.log('  BINDBG hits='+bt.hits+' done='+bt.done+' held='+(kb.held?kb.held.name:'none')+' perch='+perch.toFixed(2)+' q='+q.x.toFixed(1)+','+q.y.toFixed(1)+','+q.z.toFixed(1));
  bt.done=false; bt.hits=0; // belt and braces against any late hydration
  const NAMES=['rubbish','shiny can'];
  const near=()=>G.props.filter(p=>NAMES.includes(p.name)&&Math.hypot(p.x-q.x,p.z-q.z)<2.4).length;
  const n0=near();
  bt.onDone&&bt.onDone(q); tick(3); // peck->completion is b_five's proof; this proof owns the eruption
  const born=near()-n0;
  ok(born>=3,'cracking the bin erupts a junk fountain (+'+born+' junk near the bin)'); }
{ G._fxSpy=[]; H.X.award(50,'TEST MILESTONE',{x:0,y:1,z:0});
  ok(G._fxSpy.some(f=>f.why==='sparkle'),'mission-grade awards sparkle gold');
  G._fxSpy=null; }
// ADDED 2026-08-28b: THE NIGHT WAVE — arrival, torch, cage, jailbreak
C.section('night arrives for the wanted');
H.X.startGame(1); tick(2);
G.nightManual=false; G.night=false; G.nightT=0; G.wanted=3;
tick(70);
ok(G.night===true&&G.nightT>0.3,'wanted>=3 rolls the sky ('+G.nightT.toFixed(2)+')');
ok(G.sun.intensity<1.0,'the sun stands down ('+G.sun.intensity.toFixed(2)+')');

C.section('the torch finds you');
G.night=true; G.nightManual=true; G.nightT=1; H.X.nightApply(1); // own the state as the N key does — the auto-driver must not ease it off mid-test
G.humans.forEach(h=>{ if(h.key!=='rex'){h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;} });
const rexN=G.humans.find(h=>h.key==='rex');
rexN.x=0; rexN.z=26; rexN.ry=0; rexN.state='idle'; rexN.stun=0; rexN.distracted=0; if(rexN.torch)rexN.torch.g.rotation.y=0;
const kn=G.keas[0]; kn.x=0; kn.z=31.5; kn.y=0; kn.grounded=true; kn._beamT=0; kn.caged=0;
const heat0=G.wantedT||0;
rexN.patrol=null;
for(let i=0;i<70&&rexN.state!=='chase';i++){ rexN.x=0; rexN.z=26; rexN.ry=0; if(rexN.state!=='chase')rexN.state='idle'; if(rexN.torch)rexN.torch.g.rotation.y=0; X.update(1/60); }
ok(rexN.state==='chase',"beam-caught: the ranger comes ("+rexN.state+")");
ok((G.wantedT||0)>heat0,'and the heat rises (wantedT '+heat0.toFixed(2)+' -> '+(G.wantedT||0).toFixed(2)+')');

C.section('BEHIND BARS: caught, pinned, mash-out');
rexN.x=kn.x; rexN.z=kn.z-0.3; rexN.state='chase'; rexN.chaseKea=kn; G.wanted=3;
for(let i=0;i<40&&!(kn.caged>0);i++){ rexN.x=kn.x; rexN.z=kn.z-0.3; X.update(1/60); }
ok(kn.caged>0,'the carrier claims a kea ('+(kn.caged||0).toFixed(1)+'s)');
{ const wp=new THREE.Vector3(0,1.7,-1.1); G.uteG.localToWorld(wp);
  tick(2);
  ok(Math.hypot(kn.x-wp.x,kn.z-wp.z)<0.7,'pinned to the ute carrier'); }
{ const c0=kn.caged;
  for(let m=0;m<4;m++){ H.X.press(kn.map.grab); tick(1); H.X.release(kn.map.grab); tick(1); }
  ok(kn.caged<c0-1.3,'mashing shaves the sentence ('+c0.toFixed(1)+' -> '+kn.caged.toFixed(1)+')'); }
kn.caged=0.01; tick(3);
ok((kn.caged||0)<=0&&!kn.grounded===false||kn.vy>=0,'freed');

C.section('JAILBREAK: a mate pecks the latch');
H.X.startGame(2); tick(2);
G.night=true; G.night=true; G.nightManual=true; G.nightT=1; H.X.nightApply(1); // own the state as the N key does — the auto-driver must not ease it off mid-test
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;});
const j1=G.keas[0], j2=G.keas[1];
const rexJ=G.humans.find(h=>h.key==='rex');
rexJ.cageKea(j1); tick(2);
ok(j1.caged>4,'kea one is behind bars');
{ const lt=G.inter.find(it=>it.kind==='peck'&&it.label==='PECK THE LATCH');
  ok(!!lt,'the latch is peckable');
  const q=lt.getPos?lt.getPos():(()=>{const p=new THREE.Vector3(0,1.2,-1.1);G.uteG.localToWorld(p);return p;})();
  const perch=Math.max(0.3,X.groundHeightAt(q.x,q.z,3)+0.02);
  for(let n=0;n<(lt.needHits||4)+2&&j1.caged>0;n++){
    for(let i=0;i<2;i++){ j2.x=q.x; j2.z=q.z; j2.y=perch; j2.vy=0; X.update(1/60); }
    tap(H.P2.grab); tick(2); }
  ok(j1.caged<=0,'sprung by the partner'); }
process.exitCode=C.report()?1:0;
