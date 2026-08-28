/* exact battery replay with diagnostics on the failing tears */
const {load,collector,stage,far,sweep}=require('./rig');
const H=load(),{X,G,tick,hold,un,tap,P1,P2}=H;
X.boot(); X.startGame(2);
const k0=G.keas[0],k1=G.keas[1];
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;h.asleep=false;h.zzz&&(h.zzz.visible=false);});
// peck section (as battery)
const pecks=G.inter.filter(i=>i.kind==='peck'&&!i.repeat);
for(const pk of pecks){ stage(H,k0,pk.getPos()); tick(2);
  for(let i=0;i<(pk.needHits||1)+1&&!pk.done;i++){ tap(P1.grab); tick(3); } }
// tear section with diagnostics
far(H,k1);
const tears=G.inter.filter(i=>i.kind==='tear');
for(const t of tears){
  if(t.done)continue;
  const p=t.getPos();
  sweep(H,p,2.2); stage(H,k0,p);
  if(t.needsPartner||t.needsBoth){ k1.x=p.x-0.5;k1.z=p.z-0.5;k1.y=X.groundHeightAt(k1.x,k1.z,p.y);k1.grounded=true;k1.stun=0; }
  else far(H,k1);
  tick(2);
  const isSpike=/SPIKES/.test(t.label);
  hold(P1.grab); if(t.needsPartner||t.needsBoth)hold(P2.grab);
  let steps=0;
  while(!t.done&&steps<60*9){
    if(isSpike&&steps<3){
      console.log(t.label,'@'+p.x.toFixed(1),'f'+steps,'keaY',k0.y.toFixed(2),'keaZ',k0.z.toFixed(2),'gr',k0.grounded,'stun',k0.stun.toFixed(1),'tug',k0.tug?(k0.tug.label+'@'+(k0.tug.getPos?k0.tug.getPos().x.toFixed(1):'?')):'-','held',k0.held?k0.held.name:'-','prog',t.progress.toFixed(3));
    }
    X.update(1/60); steps++;
  }
  un(P1.grab); un(P2.grab); tick(3);
  if(isSpike)console.log('  ->',t.label,'@'+p.x.toFixed(1),t.done?'DONE':'FAILED prog='+t.progress.toFixed(2),'steps',steps);
}
