/* Phase 3: inputs no designer intended */
const {load,collector,stage,far}=require('./rig');
const H=load(),{X,G,tick,hold,un,tap,P1,P2}=H;
const C=collector('ADVERSARIAL'),ok=C.ok;
X.boot(); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); X.startGame(2); // pristine: battery 9 owns save persistence
const k0=G.keas[0],k1=G.keas[1];
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;});
far(H,k1);

C.section('grab spam on nothing');
far(H,k0); tick(2); const s0=G.score;
for(let i=0;i<20;i++)tap(P1.grab);
ok(G.score===s0,'20 empty grabs award nothing');

C.section('grab-while-holding near a tear drops, never tugs');
const seal=G.inter.find(i=>/SEAL/.test(i.label));
const w=G.props.find(p=>!p.banked&&!p.heldBy&&!p.heavy);
stage(H,k0,{x:w.x,y:w.y,z:w.z}); tick(2); tap(P1.grab);
ok(k0.held===w,'holding '+w.name);
const sp=seal.getPos(); k0.x=sp.x;k0.z=sp.z+0.3;k0.y=X.groundHeightAt(k0.x,k0.z,sp.y);k0.grounded=true; tick(2);
// AMENDED 2026-08-26: v3 drop-toss means a CONTINUED hold may re-target the tear behind the
// tossed item (drop-then-rip, one-button grammar). The accident-safety contract is the TAP:
tap(P1.grab); tick(2);
ok(k0.held===null,'tap while holding = drop, nothing else');
ok(seal.progress===0,'tap never chains into a tug ('+seal.progress.toFixed(2)+')');
// AMENDED 2026-08-27: the seal is now a strip whose frontier sits at the door's bottom corner,
// so the tossed item's landing spot vs grab range is RNG. Restage deterministically.
stage(H,k0,{x:w.x,y:w.y,z:w.z}); tick(1);
tap(P1.grab); tick(2); // re-take the tossed item so the chain starts FROM a holding state
ok(k0.held===w,'re-holding for the chain test');
{ const sp2=seal.getPos(); k0.x=sp2.x;k0.z=sp2.z+0.3;k0.y=X.groundHeightAt(k0.x,k0.z,sp2.y);k0.grounded=true; tick(1); }
hold(P1.grab); tick(45); un(P1.grab); // one sustained gesture: press drops, item tumbles clear, beak latches the seal
ok(k0.held===null&&seal.progress>0.1,'sustained hold chains drop -> rip — v3 contract ('+seal.progress.toFixed(2)+')');
seal.progress=0; tick(3);

C.section('shoo mid-tug releases the tug');
const sign=G.inter.find(i=>i.mission==='sign');
stage(H,k0,sign.getPos()); tick(2);
hold(P1.grab); tick(40);
ok(k0.tug===sign&&sign.progress>0.3,'tug engaged '+sign.progress.toFixed(2));
const rex=G.humans.find(h=>h.key==='rex');
rex.x=k0.x+0.5; rex.z=k0.z; rex.state='chase'; rex.chaseKea=k0; tick(8);
ok(k0.stun>0,'shoo landed');
ok(k0.tug===null,'tug released on stun');
un(P1.grab); const pr=sign.progress; tick(60*2);
ok(sign.progress<pr,'progress decays after interrupt ('+pr.toFixed(2)+' -> '+sign.progress.toFixed(2)+')');
rex.x=45;rex.z=45;rex.state='idle';rex.chaseKea=null;

C.section('screech spam respects cooldown');
k0.stun=0; k0.screamCd=0; const sc0=G.stats.screeches;
for(let i=0;i<10;i++){ tap(P1.scream); tick(5); } // ~0.9s total
ok(G.stats.screeches-sc0<=2,'10 spam presses -> '+(G.stats.screeches-sc0)+' screeches (cooldown holds)');

C.section('bank spam: one item, one award');
tick(60*2);
const shiny=G.props.find(p=>p.shiny&&!p.banked&&!p.heldBy);
stage(H,k0,{x:shiny.x,y:shiny.y,z:shiny.z}); k0.y=Math.max(k0.y,shiny.y-0.4); tick(2); tap(P1.grab);
ok(k0.held===shiny,'holding shiny');
k0.x=G.nestPos.x;k0.z=G.nestPos.z;k0.y=G.nestY;k0.grounded=true;tick(2);
const st=G.nestStash;
tap(P1.grab); tap(P1.grab); tap(P1.grab);
ok(G.nestStash===st+1,'triple-press banks exactly once');

C.section('extreme physics: tunnel + bounds');
k0.stun=0; k0.x=0;k0.z=0;k0.y=50;k0.vy=-100;k0.grounded=false;
tick(120);
ok(k0.y>=-0.01,'no floor tunneling y='+k0.y.toFixed(2));
k0.x=999;k0.z=-999; tick(2);
ok(Math.abs(k0.x)<=52.01&&Math.abs(k0.z)<=52.01,'bounds clamp survives teleport');

C.section('contradictory inputs');
hold(P1.fwd);hold(P1.back);hold(P1.left);hold(P1.right); tick(30);
[P1.fwd,P1.back,P1.left,P1.right].forEach(un);
ok(Number.isFinite(k0.x)&&Number.isFinite(k0.ry),'fwd+back+left+right stays finite');

C.section('kea cannot pickpocket a human mid-carry');
const trish=G.humans.find(h=>h.key==='trish');
const sand=G.props.find(p=>p.snack==='sandwich');
if(!sand.banked){
  sand.heldBy=trish; trish.carry=sand; trish.state='return'; trish.x=0;trish.z=0;
  stage(H,k0,{x:trish.x,y:1,z:trish.z}); tick(2);
  tap(P1.grab);
  ok(k0.held!==sand,'cannot grab from human hands');
  sand.heldBy=null; trish.carry=null;
}

C.section('kick snow while unloaded does nothing');
const sc=G.snowCap; sc.loaded=false; sc.mesh.visible=false; sc.reloadT=99;
k0.stun=0; k0.x=sc.hut.x; k0.z=sc.hut.z+2.4; k0.y=X.groundHeightAt(k0.x,k0.z,4); k0.grounded=true;
k0.onRoof=G.colliders.find(c=>c.kind==='roof');
const fx0=G.fx.length; tap(P1.grab);
ok(G.fx.length===fx0,'no phantom snow blob when unloaded');

process.exitCode=C.report()?1:0;
