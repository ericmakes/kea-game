const {load,far}=require('./rig');
const H=load(),{X,G,tick,tap,P1}=H;
X.boot(); X.startGame(1,{colossal:true});
const k0=G.keas[0];
G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;h.asleep=false;});
for(let i=0;i<20;i++)X.award(150,'T',{x:0,y:1,z:0});
console.log('level',G.level,'size',k0.size.toFixed(2));
const three=G.humans.slice(0,3);
three.forEach((h,i)=>{ h.x=k0.x+Math.cos(i*2.1)*2.2; h.z=k0.z+Math.sin(i*2.1)*2.2; h.state='idle'; h.stun=0; h.launched=null; h.sprawl=0; });
k0.grounded=true; k0.screamCd=0; tick(1); tap(P1.scream); tick(3);
far(H,k0); 
const rag=three[0];
for(let t=0;t<8*60;t++){ X.update(1/60);
  if(t%30===0)console.log((t/60).toFixed(1)+'s',rag.key,'state',rag.state,'stun',rag.stun.toFixed(2),'sprawl',(rag.sprawl||0).toFixed(2),'launched',!!rag.launched,'y',rag.g.position.y.toFixed(2),'pos',rag.x.toFixed(1),rag.z.toFixed(1));
}
