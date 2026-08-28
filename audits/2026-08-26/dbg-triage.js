const {load,stage,far}=require('./rig');
const H=load(),{X,G,tick,hold,un,tap,P1}=H;
X.boot();X.startGame(1);
const k0=G.keas[0];
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;h.asleep=false;});

// --- pie mystery ---
const pie=G.props.find(p=>p.name==='pie');
console.log('pie at',pie.x.toFixed(2),pie.y.toFixed(2),pie.z.toFixed(2));
stage(H,k0,{x:pie.x,y:pie.y,z:pie.z}); k0.y=Math.max(k0.y,pie.y-0.4); tick(2);
// what does target selection see?
let best=null,bd=99;
for(const it of G.inter){ if(it.done)continue; if(it.locked&&it.locked())continue;
  if(it.kind==='prop'&&(it.heldBy||it.banked))continue;
  const p=it.getPos?it.getPos():it;
  const d=Math.sqrt((k0.x-p.x)**2+(k0.y+0.4-p.y)**2+(k0.z-p.z)**2);
  if(d<(it.range||1.3)&&d<bd){bd=d;best=it;}}
console.log('kea at',k0.x.toFixed(2),k0.y.toFixed(2),k0.z.toFixed(2),'| best target:',best&&(best.label||best.name),'d='+bd.toFixed(2));
tap(P1.grab);
console.log('held after grab:',k0.held&&k0.held.name);

// --- moving-car tug range (B5) with correct staging ---
G.trafT.a=0.01; G.trafT.b=999; tick(3);
const car=G.cars.filter(c=>c.traffic).pop();
const mw=G.inter.find(i=>i.car===car&&i.mission==='wiper'&&!i.done);
console.log('car spawned x=',car.x.toFixed(1),'z=',car.z,'dir',car.dir);
k0.x=-20; k0.z=car.z+0.9; k0.y=0; k0.grounded=true; k0.stun=0;
if(k0.held){k0.held.heldBy=null;k0.held=null;}
let latched=false, minD=99;
for(let i=0;i<60*25;i++){
  const p=mw.getPos(); const d=Math.hypot(k0.x-p.x,k0.y+0.4-p.y,k0.z-p.z);
  minD=Math.min(minD,d);
  if(!latched&&d<1.3){ hold(P1.grab); }
  X.update(1/60);
  if(!latched&&k0.tug===mw){ latched=true; console.log('LATCHED at d='+d.toFixed(2)); }
  if(latched&&i%60===0){} 
  if(latched){ // run 3 more seconds then report
    for(let j=0;j<180;j++)X.update(1/60);
    const pn=mw.getPos(); const dn=Math.hypot(k0.x-pn.x,k0.z-pn.z);
    console.log('after 3s: still tugging?',k0.tug===mw,'dist='+dn.toFixed(1)+'m progress='+mw.progress.toFixed(2));
    break;
  }
}
if(!latched)console.log('never latched, minD='+minD.toFixed(2));
