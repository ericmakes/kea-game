/* COLOSSAL battery (new 2026-08-26): leveling, size scaling, fear, stomp, bunt, solo-coop, summit finale */
const {load,collector,stage,far,sweep,clearTraffic}=require('./rig');
const H=load(),{X,G,tick,hold,un,tap,P1}=H;
const C=collector('COLOSSAL'),ok=C.ok;
X.boot(); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); X.startGame(1,{colossal:true}); // pristine: battery 9 owns save persistence
const k0=G.keas[0];
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;h.asleep=false;h.zzz&&(h.zzz.visible=false);});

C.section('mode boots: tiered list, level 1, size 1');
ok(G.colossal===true,'colossal flag set');
ok(G.level===1&&Math.abs((k0.size||1)-1)<0.001,'starts sparrow-sized');
ok(!!G.missions.find(m=>m.id==='c_stomp3'),'tiered missions present');
ok(G.missions.find(m=>m.id==='c_stomp3').locked(),'stage III locked at LV1');
ok(!!G.missions.find(m=>m.id==='c_apex'&&m.finale),'summit finale present');

C.section('leveling: chaos grows the bird, monotonic, capped');
let lastS=k0.size;
X.award(200,'T',{x:0,y:1,z:0}); tick(2);
ok(G.level>=2&&k0.size>lastS,'level '+G.level+' size '+k0.size.toFixed(2));
lastS=k0.size;
for(let i=0;i<20;i++)X.award(150,'T',{x:0,y:1,z:0});
ok(G.level===10,'caps at MAX (LV'+G.level+')');
ok(k0.size>2.7&&k0.size<3.1,'towering: size '+k0.size.toFixed(2));
ok(Math.abs(k0.g.scale.x-0.7*k0.size)<0.01,'mesh scale tracks size');
ok(!G.missions.find(m=>m.id==='c_stomp3').locked(),'stage III unlocked');

C.section('reach scales: tug from classic-impossible distance');
const sign=G.inter.find(i=>i.mission==='sign'); sign.done=false; sign.progress=0; // dated restage
const sp=sign.getPos();
k0.x=sp.x; k0.z=sp.z+3.4; k0.y=0; k0.grounded=true; k0.stun=0; tick(2); // 3.4m out; classic range 1.6
hold(P1.grab); tick(30);
ok(sign.progress>0.4,'giant beak reaches 3.4m and rips fast ('+sign.progress.toFixed(2)+')');
un(P1.grab); sign.done=true; tick(3);

C.section('heavy exemption: cones are chips now');
const cone=G.props.find(p=>p.cone&&!p.banked&&!p.heldBy);
sweep(H,{x:cone.x,z:cone.z},1.6); cone.mesh.position.set(cone.x,cone.y,cone.z);
stage(H,k0,{x:cone.x,y:cone.y,z:cone.z}); tick(2); tap(P1.grab);
ok(k0.held===cone,'grab cone');
let d1;{ k0.ry=0; const sx=k0.x,sz=k0.z; hold(P1.fwd); tick(30); un(P1.fwd); d1=Math.hypot(k0.x-sx,k0.z-sz); }
ok(d1>2.2,'no heavy slowdown at giant size ('+d1.toFixed(2)+'m in 0.5s)');
hold(P1.flap); tick(80); un(P1.flap);
ok(k0.y>3,'cone flies with you now y='+k0.y.toFixed(2));
ok(G.missions.find(m=>m.id==='c_coneair').done===true,'CONE AIRLIFT mission');
tick(90); tap(P1.grab); tick(5);

C.section('solo coop-cracking at giant size');
const latch=G.chilly.latch;
ok(!latch.done,'latch fresh');
sweep(H,latch.getPos(),2.2); stage(H,k0,latch.getPos()); tick(2);
hold(P1.grab); let st=0; while(!latch.done&&st++<300)X.update(1/60); un(P1.grab); tick(2);
ok(latch.done===true,'one enormous beak cracks the chilly bin');
ok(G.missions.find(m=>m.id==='c_sololatch').done===true,'solo-latch mission');

C.section('humans flee the giant');
const trish=G.humans.find(h=>h.key==='trish');
trish.x=k0.x+3; trish.z=k0.z; trish.state='idle'; trish.stun=0; trish.launched=null; trish.sprawl=0;
const td0=3; tick(60);
ok(trish.state==='flee'||trish.launched||trish.sprawl,'trish flees the colossus (state='+trish.state+')');
const td1=Math.hypot(trish.x-k0.x,trish.z-k0.z);
ok(td1>td0,'and gains distance ('+td1.toFixed(1)+'m)');

C.section('STOMP launches a crowd');
clearTraffic(H);
const three=G.humans.slice(0,3);
three.forEach((h,i)=>{ h.x=k0.x+Math.cos(i*2.1)*2.2; h.z=k0.z+Math.sin(i*2.1)*2.2; h.state='idle'; h.stun=0; h.launched=null; h.sprawl=0; });
k0.grounded=true; k0.screamCd=0; tick(1);
tap(P1.scream); tick(3);
const airborne=three.filter(h=>h.launched||h.stun>0).length;
ok(airborne>=3,'stomp launched '+airborne+'/3');
ok(G.missions.find(m=>m.id==='c_stomp3').done===true,'STOMP×3 mission');
tick(60*4); // let them land + recover

C.section('ragdoll lands, sprawls, recovers');
far(H,k0); tick(30); // AMENDED 2026-08-26: step the colossus back — standing in the crowd re-bowls everyone forever (by design)
const rag=three[0];
ok(rag.launched===null||rag.launched===undefined||!rag.launched,'flight over');
let rec=0; while((rag.sprawl>0||rag.stun>0)&&rec++<60*6)X.update(1/60);
ok(rag.stun<=0&&!rag.sprawl,'human back on their feet');

C.section('BUNT: giant shoves traffic');
clearTraffic(H); G.trafT.a=0.01; tick(3);
const car=G.cars.filter(c=>c.traffic).pop();
ok(!!car,'traffic spawned');
for(let i=0;i<60*10&&!car.bunted;i++){ k0.x=car.x+1; k0.z=car.z; k0.y=0; k0.grounded=true; k0.stun=0; X.update(1/60); }
ok(car.bunted===true,'car bunted');
ok(G.missions.find(m=>m.id==='c_bunt').n>=1,'bunt mission counting ('+G.missions.find(m=>m.id==='c_bunt').n+')');
far(H,k0); clearTraffic(H);

C.section('SUMMIT: full size, ridge, screech -> win');
ok(G.level===10,'at max level');
const roof=G.colliders.find(c=>c.kind==='roof');
k0.x=roof.x; k0.z=roof.z+0.3; k0.y=X.groundHeightAt(k0.x,k0.z,4.4); k0.grounded=true; k0.screamCd=0; k0.stun=0; tick(1);
tap(P1.scream); tick(3);
ok(G.missions.find(m=>m.id==='c_apex').done===true,'COLOSSUS mission');
ok(G.won===true,'the mountain has a new landlord');

process.exitCode=C.report()?1:0;
