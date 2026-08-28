/* Phase 1 + 3 + 4.75: flow, inert keys, pause, unattended, monkey fuzz, perf */
const {load,collector}=require('./rig');
const H=load(),{X,G,tick,hold,un,tap,P1,P2}=H;
const C=collector('FLOW'),ok=C.ok;

C.section('pre-start inertness');
X.boot(); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); // pristine: battery 9 owns save persistence
[...Object.values(P1),...Object.values(P2)].forEach(c=>{X.press(c);X.update(1/60);X.release(c);});
ok(G.running===false,'inputs before start do not start game');
ok(G.keas.length===0,'no keas pre-start');
ok(G.score===0,'no score pre-start');

C.section('start 1P: P2 keys inert');
X.startGame(1);
ok(G.keas.length===1,'1P spawns one kea');
const k0=G.keas[0]; const snap={x:k0.x,z:k0.z,ry:k0.ry};
Object.values(P2).forEach(c=>hold(c)); tick(60); Object.values(P2).forEach(c=>un(c));
ok(Math.abs(k0.x-snap.x)+Math.abs(k0.z-snap.z)+Math.abs(k0.ry-snap.ry)<0.01,'P2 inputs move nothing in 1P (drift '+(Math.abs(k0.x-snap.x)+Math.abs(k0.z-snap.z)).toFixed(3)+')');
ok(G.stats.screeches===0,'P2 scream key inert in 1P');

C.section('pause freezes sim (via G.paused; key handler is DOM-only — see evidence ceiling)');
hold(P1.fwd); tick(10);
const px=k0.x,pz=k0.z; G.paused=true; tick(30);
ok(Math.abs(k0.x-px)+Math.abs(k0.z-pz)<0.001,'pause freezes movement');
const wiper=G.inter.find(i=>i.mission==='wiper'&&!i.done);
un(P1.fwd);
const wp=wiper.getPos(); k0.x=wp.x;k0.z=wp.z+0.4;k0.y=X.groundHeightAt(k0.x,k0.z,1);k0.grounded=true;
G.paused=false; hold(P1.grab); tick(30); const prog1=wiper.progress;
G.paused=true; tick(60); ok(Math.abs(wiper.progress-prog1)<0.001,'pause freezes tug progress at '+wiper.progress.toFixed(2));
G.paused=false; un(P1.grab); tick(5);

C.section('unattended 90s survival (range assertions)');
let threw=null; try{ tick(60*90); }catch(e){threw=e.stack.split('\n')[0];}
ok(!threw,'unattended survives: '+threw);
const tcars=G.cars.filter(c=>c.traffic).length;
ok(tcars>=1&&tcars<=8,'traffic flows, count '+tcars);
ok(G.humans.length>=4&&G.humans.length<=6,'human count sane '+G.humans.length);
ok(Number.isFinite(G.score),'score finite');

C.section('monkey fuzz 30s, both maps');
const CODES=[...Object.values(P1),...Object.values(P2)];
threw=null;
try{
  for(let i=0;i<60*30;i++){
    for(const c of CODES){ if(Math.random()<0.06){ X.KEYS.has(c)?un(c):(X.press(c)); } }
    X.update(1/60);
  }
}catch(e){threw=e.stack.split('\n').slice(0,2).join(' | ');}
CODES.forEach(un);
ok(!threw,'monkey fuzz survives: '+threw);
ok(Math.abs(k0.x)<=52.01&&Math.abs(k0.z)<=52.01,'kea within bounds x='+k0.x.toFixed(1)+' z='+k0.z.toFixed(1));
ok(k0.y>-0.5&&k0.y<80,'kea y sane '+k0.y.toFixed(1));
ok(Number.isFinite(G.score)&&G.score>=0,'score sane after fuzz '+G.score);

C.section('perf smoke at populated state');
tick(60*5);
const t0=Date.now(); tick(300); const ms=(Date.now()-t0)/300;
ok(ms<8,'update() avg '+ms.toFixed(2)+'ms/frame (budget 8ms headless)');
console.log('    perf: '+ms.toFixed(2)+'ms/frame, '+G.inter.length+' interactables live');

process.exitCode=C.report()?1:0;
