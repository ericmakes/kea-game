/* Phase 2.5: couch battery adapted for fixed 2-slot shared keyboard */
const {load,collector,stage,far}=require('./rig');
const H=load(),{X,G,tick,hold,un,tap,P1,P2}=H;
const C=collector('COUCH'),ok=C.ok;
X.boot(); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); X.startGame(2); // pristine: battery 9 owns save persistence
const k0=G.keas[0],k1=G.keas[1];
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;}); // clear arena per staging law

C.section('verb matrix per device (isolated actors)');
k0.x=-30;k0.z=-30;k0.y=0;k0.grounded=true; k1.x=-30;k1.z=-20;k1.y=0;k1.grounded=true; tick(2);
// move
let a={x:k0.x,z:k0.z},b={x:k1.x,z:k1.z};
hold(P1.fwd);tick(20);un(P1.fwd);
ok(Math.abs(k0.x-a.x)+Math.abs(k0.z-a.z)>0.4,'P1 fwd moves k0');
ok(Math.abs(k1.x-b.x)+Math.abs(k1.z-b.z)<0.02,'k1 untouched by P1');
b={x:k1.x,z:k1.z};a={x:k0.x,z:k0.z};
hold(P2.fwd);tick(20);un(P2.fwd);
ok(Math.abs(k1.x-b.x)+Math.abs(k1.z-b.z)>0.4,'P2 fwd moves k1');
ok(Math.abs(k0.x-a.x)+Math.abs(k0.z-a.z)<0.02,'k0 untouched by P2');
// flap
const y1=k1.y; hold(P2.flap); tick(12); un(P2.flap); // AMENDED 2026-08-26: hold-to-fly
ok(k1.y>y1+0.2&&k0.grounded,'P2 held flap lifts k1 only (k1.y='+k1.y.toFixed(2)+')');
tick(140);
// scream isolation via stats + cooldown fields
k0.screamCd=0;k1.screamCd=0;
tap(P1.scream);
ok(k0.screamT<0.1&&k1.screamT>1,'P1 scream fires k0 only');
tick(120);
// grab per device: two separate wipers
const wt=G.inter.filter(i=>i.mission==='wiper'&&!i.done);
stage(H,k0,wt[0].getPos()); stage(H,k1,wt[1].getPos()); tick(2);
hold(P1.grab); tick(40);
ok(wt[0].progress>0.3,'P1 hold tears wiper A ('+wt[0].progress.toFixed(2)+')');
ok(wt[1].progress===0,'wiper B untouched by P1');
hold(P2.grab); tick(40);
ok(wt[1].progress>0.3,'P2 hold tears wiper B ('+wt[1].progress.toFixed(2)+')');
un(P1.grab);un(P2.grab); tick(5);

C.section('duo on the SAME tear = documented team-vandalism rate (~2x)');
const sign=G.inter.find(i=>i.mission==='sign');
stage(H,k0,sign.getPos()); far(H,k1); tick(2);
hold(P1.grab); tick(60); un(P1.grab);
const solo=sign.progress; sign.progress=0; tick(3); sign.progress=0;
stage(H,k0,sign.getPos()); const sp=sign.getPos(); k1.x=sp.x-0.35;k1.z=sp.z+0.3;k1.y=0;k1.grounded=true; tick(2);
hold(P1.grab);hold(P2.grab); tick(60); un(P1.grab);un(P2.grab);
const duo=sign.progress;
ok(duo/Math.max(0.01,solo)>1.7&&duo/Math.max(0.01,solo)<2.3,'duo rate '+(duo/solo).toFixed(2)+'x solo (want ~2x)');
sign.progress=0; tick(3);

C.section('coop gates: solo-blocked, duo-open');
const latch=G.chilly.latch, lp=latch.getPos();
far(H,k1); stage(H,k0,lp); tick(2);
hold(P1.grab); tick(150); un(P1.grab);
ok(latch.progress<0.05&&!latch.done,'chilly solo blocked ('+latch.progress.toFixed(2)+')');
k1.x=lp.x;k1.z=lp.z-0.6;k1.y=0;k1.grounded=true; tick(2);
hold(P1.grab);hold(P2.grab); tick(140); un(P1.grab);un(P2.grab); tick(2);
ok(latch.done===true,'chilly duo opens');
const tarp=G.tarp, tp=tarp.getPos();
far(H,k1); stage(H,k0,tp); tick(2);
hold(P1.grab); tick(100);
ok(tarp.progress<0.05,'tarp solo blocked');
k1.x=tp.x+0.8;k1.z=tp.z;k1.y=0;k1.grounded=true; tick(2);
hold(P2.grab); tick(140); un(P1.grab);un(P2.grab); tick(2);
ok(tarp.done===true,'tarp duo rips');

C.section('duet window: 1.2s apart fails, 0.5s apart lands');
const v=G.vanTop;
k0.x=v.x;k0.z=v.z-0.5;k0.y=v.top;k0.grounded=true;
k1.x=v.x;k1.z=v.z+0.5;k1.y=v.top;k1.grounded=true;
k0.screamCd=0;k1.screamCd=0;k0.screamT=99;k1.screamT=99; tick(2);
tap(P1.scream); tick(72); // 1.2s
k1.screamCd=0; tap(P2.scream);
ok(G.missions.find(m=>m.id==='duet').done!==true,'1.2s gap: no duet');
tick(120); k0.screamCd=0;k1.screamCd=0;k0.screamT=99;k1.screamT=99;
tap(P1.scream); tick(30); // 0.5s
tap(P2.scream);
ok(G.missions.find(m=>m.id==='duet').done===true,'0.5s gap: duet lands');

// ADDED 2026-08-27: gamepad bridge (kit fake pads drive the real pollPads seam)
C.section('gamepads: pad0/pad1 drive their own kea through the key bridge');
const buzzes=[];
const mkPad=(i,pressed,ax)=>({mapping:'standard',axes:ax||[0,0],
  buttons:Array.from({length:17},(_,k)=>({pressed:(pressed||[]).includes(k),value:(pressed||[]).includes(k)?1:0})),
  vibrationActuator:{playEffect:()=>{buzzes.push(i);return Promise.resolve();}}});
let PADS=[null,null,null,null];
globalThis.navigator=globalThis.navigator||{}; navigator.getGamepads=()=>PADS;
X.startGame(2); tick(3);
const kA=G.keas[0], kB=G.keas[1];
kA.x=-20;kA.z=-20;kA.y=0;kA.grounded=true; kB.x=20;kB.z=-20;kB.y=0;kB.grounded=true; tick(1);
const a0={x:kA.x,z:kA.z}, b0={x:kB.x,z:kB.z};
PADS[0]=mkPad(0,[12]); tick(40); PADS[0]=mkPad(0); tick(2); // dpad-up
ok(Math.hypot(kA.x-a0.x,kA.z-a0.z)>0.6,'pad0 dpad moves kea1 ('+Math.hypot(kA.x-a0.x,kA.z-a0.z).toFixed(2)+')');
ok(Math.hypot(kB.x-b0.x,kB.z-b0.z)<0.15,'kea2 untouched by pad0');
const b1={x:kB.x,z:kB.z};
PADS[1]=mkPad(1,[],[0,-0.9]); tick(40); PADS[1]=mkPad(1); tick(2); // stick up = waddle fwd
ok(Math.hypot(kB.x-b1.x,kB.z-b1.z)>0.6,'pad1 stick moves kea2');
const pg=G.props.find(p=>!p.heldBy&&!p.banked&&!p.heavy&&!p.wearable);
kA.x=pg.x;kA.z=pg.z;kA.y=Math.max(0.2,pg.y);kA.vy=0; tick(2);
PADS[0]=mkPad(0,[2]); tick(2); PADS[0]=mkPad(0); tick(2); // X grabs
ok(kA.held===pg,'pad0 X button grabs ('+(kA.held?kA.held.name:'nothing')+')');
navigator.getGamepads=undefined;

// ADDED 2026-08-27g: 8BitDo tolerance — hat-axis dpad, sparse indices, face-button spread
C.section('8BitDo pads: hat dpads, sparse slots, generous faces');
{ const mkPad=(over)=>Object.assign({connected:true,mapping:'',axes:[0,0,0,0,0,0,0,0,0,3.29],buttons:Array.from({length:17},()=>({pressed:false,value:0}))},over||{});
  const g=globalThis.navigator||{}; const oldGG=g.getGamepads;
  // hat-axis pad at index 1 (slot 0 empty), second pad at index 3
  const padA=mkPad(), padB=mkPad();
  g.getGamepads=()=>[null,padA,null,padB];
  H.X.startGame(2); tick(2);
  const kA=G.keas[0], kB=G.keas[1];
  kA.x=-10; kA.z=0; kA.y=0; kA.grounded=true; kB.x=10; kB.z=0; kB.y=0; kB.grounded=true; tick(1);
  // padA drives P1 fwd via HAT axis (axes[9]=-1 -> up)
  const ax0=kA.x, az0=kA.z;
  padA.axes[9]=-1; tick(40); padA.axes[9]=3.29;
  ok(Math.hypot(kA.x-ax0,kA.z-az0)>0.5,'hat-axis dpad walks P1 from pad slot 1');
  // padB (slot 3) drives P2 with bumper-grab and b1 flap
  const bz0=kB.y;
  padB.buttons[1].pressed=true; tick(6); padB.buttons[1].pressed=false; tick(4);
  ok(kB.vy>0.5||kB.y>0.05||!kB.grounded,'b1 flaps P2 from pad slot 3 (Switch-layout tolerance)');
  padB.buttons[4].pressed=true; tick(3); padB.buttons[4].pressed=false;
  ok(true,'bumper grab accepted without throw');
  g.getGamepads=oldGG; tick(2); }
process.exitCode=C.report()?1:0;
