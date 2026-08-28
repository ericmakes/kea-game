const {load,stage,far,sweep}=require('./rig');
const H=load(),{X,G,tick,hold,un,tap,P1}=H;
X.boot();X.startGame(1);
const k0=G.keas[0];
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;h.asleep=false;});
const spikes=G.inter.filter(i=>/SPIKES/.test(i.label));
console.log('spike xs:',spikes.map(s=>s.getPos().x.toFixed(1)).join(','));
// tear spike0 first (mimic battery order)
sweep(H,spikes[0].getPos(),2.2); stage(H,k0,spikes[0].getPos()); tick(2);
hold(P1.grab); let n=0; while(!spikes[0].done&&n++<600)X.update(1/60); un(P1.grab); tick(3);
console.log('spike0 done:',spikes[0].done);
// now spike1 with instrumentation
const t=spikes[1], p=t.getPos();
sweep(H,p,2.2); stage(H,k0,p); tick(2);
console.log('staged: kea',k0.x.toFixed(2),k0.y.toFixed(2),k0.z.toFixed(2),'grounded',k0.grounded,'spike1 at',p.x.toFixed(2),p.y.toFixed(2),p.z.toFixed(2));
hold(P1.grab);
for(let f=0;f<8;f++){
  // recompute best like the game does
  let best=null,bd=99;
  for(const it of G.inter){ if(it.done)continue; if(it.locked&&it.locked())continue;
    if(it.kind==='prop'&&(it.heldBy||it.banked))continue;
    const q=it.getPos?it.getPos():it;
    const d=Math.sqrt((k0.x-q.x)**2+(k0.y+0.4-q.y)**2+(k0.z-q.z)**2);
    if(d<(it.range||1.3)&&d<bd){bd=d;best=it;}}
  X.update(1/60);
  console.log('f'+f,'kea y',k0.y.toFixed(2),'z',k0.z.toFixed(2),'grounded',k0.grounded,'best:',best&&(best.label||best.name),'d',bd.toFixed(2),'tug:',k0.tug&&k0.tug.label,'prog',t.progress.toFixed(3),'held:',k0.held&&k0.held.name);
}
