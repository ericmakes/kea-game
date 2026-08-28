/* shared audit rig — fresh game instance per load()
   AMENDED 2026-08-26: hold() now fires a press edge (was KEYS.add only —
   missed press-gated verbs like drop); added sweep() and clearTraffic(). */
const fs=require('fs');

const path=require('path'); const ROOT=path.resolve(__dirname,'..','..');
const THREE=require(path.join(ROOT,'node_modules','three'));
function load(){
  global.localStorage={_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null;},setItem(k,v){this._m.set(k,String(v));},removeItem(k){this._m.delete(k);},clear(){this._m.clear();}}; // fresh store per instance
  global.THREE=THREE; global.window=undefined; const noop=()=>{};
  global.addEventListener=noop; global.performance={now:()=>Date.now()};
  global.requestAnimationFrame=noop; global.innerWidth=1280; global.innerHeight=720; global.devicePixelRatio=1;
  const html=fs.readFileSync(path.join(ROOT,'untitled-kea-game.html'),'utf8');
  const logic=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(b=>b.includes('KEA-LOGIC-START'));
  (new Function('THREE',logic+'\n;globalThis.__X=KEAGAME;'))(THREE);
  const X=globalThis.__X;
  const H={X,G:X.G,THREE,
    tick:(n,dt)=>{for(let i=0;i<(n||1);i++)X.update(dt||1/60);},
    hold:c=>X.press(c), un:c=>X.release(c),
    tap:c=>{X.press(c);X.update(1/60);X.release(c);},
    P1:X.P1MAP,P2:X.P2MAP};
  return H;
}
function collector(name){
  const F=[];
  return { ok:(c,m)=>{if(!c)F.push(m);},
    F,
    section:s=>console.log('  · '+s),
    report(){ if(F.length){ console.log(name+': '+F.length+' FINDINGS'); F.forEach(f=>console.log('    ✗ '+f)); }
      else console.log(name+': ALL PASS'); return F.length; } };
}
/* park a kea legally AT an interactable's exact footprint (players perch on beams/roofs) */
function stage(H,k,p){
  k.x=p.x; k.z=p.z; k.stun=0; k.vy=0;
  k.y=H.X.groundHeightAt(k.x,k.z,Math.max(p.y,0.4)+0.4);
  k.grounded=true; k.tug=null; k.slideV=0; k.slideD=0;
  if(k.held){k.held.heldBy=null;k.held=null;}
}
function far(H,k){ k.x=-49;k.z=-49;k.y=0;k.grounded=true;k.tug=null;k.slideV=0; if(k.held){k.held.heldBy=null;k.held=null;} }
/* relocate loose debris away from a work zone so press edges don't grab it */
function sweep(H,pos,r){
  for(const p of H.G.props){ if(p.heldBy||p.banked)continue;
    if(Math.hypot(p.x-pos.x,p.z-pos.z)<(r||2.2)){ p.x=-49+Math.random()*2; p.z=-46+Math.random()*2; p.y=0.1; p.mesh.position.set(p.x,p.y,p.z);} }
}
function clearTraffic(H){
  const G=H.G;
  for(let i=G.cars.length-1;i>=0;i--){ const c=G.cars[i]; if(!c.traffic)continue;
    G.scene.remove(c.g); const ci=G.colliders.indexOf(c.collider); if(ci>=0)G.colliders.splice(ci,1);
    for(let q=G.inter.length-1;q>=0;q--){ if(G.inter[q].car===c)G.inter.splice(q,1); }
    const d=G.humans.find(h=>h.driverCar===c); if(d){G.scene.remove(d.g);G.humans.splice(G.humans.indexOf(d),1);}
    G.cars.splice(i,1); }
  G.trafT.a=999;G.trafT.b=999;
}
module.exports={load,collector,stage,far,sweep,clearTraffic};
