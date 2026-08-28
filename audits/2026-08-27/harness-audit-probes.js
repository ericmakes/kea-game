/* AUDIT PROBES 2026-08-27 (game-focus-audit skill) — evidence; P3a EXPECTED TO FAIL */
const {load}=require('../2026-08-26/rig');
const H=load(),{X,G,tick,hold,un,tap,P1}=H;
X.boot();
let F=[]; const okp=(c,m)=>{ if(!c) F.push(m); };

// P1: perf smoke — busy classic world, ms/frame
X.startGame(1); tick(5);
G.trafT.a=0.01; for(let i=0;i<300;i++)X.update(1/60);
const t0=Date.now(); for(let i=0;i<600;i++)X.update(1/60);
const ms=(Date.now()-t0)/600;
console.log('  perf: '+ms.toFixed(2)+'ms/frame busy classic (60fps budget 16.6)');
okp(ms<8,'update() heavy: '+ms.toFixed(2)+'ms/frame');

// P2: first-contact — nearest interactable from spawn + naive-bot seconds to first award
X.startGame(1); tick(3);
const kk=G.keas[0];
let nd=1e9,ni=null; for(const t of G.inter){ if(t.done)continue; const p=t.getPos?t.getPos():t;
  const d=Math.hypot((p.x-kk.x),(p.z-kk.z)); if(d<nd){nd=d;ni=t;} }
console.log('  first-contact: nearest interactable '+nd.toFixed(1)+'u ('+(ni.label||ni.name)+')');
okp(nd<12,'nearest interactable far from spawn: '+nd.toFixed(1));
// measure real input walk speed, compose seconds-to-fun = travel + tear need
const wx0=kk.x, wz0=kk.z; hold(P1.fwd); for(let i=0;i<60;i++)X.update(1/60); un(P1.fwd);
const spd=Math.hypot(kk.x-wx0,kk.z-wz0);
const s2f=nd/Math.max(0.1,spd)+(ni.need||1.6);
console.log('  first-contact: walk speed '+spd.toFixed(1)+'u/s, seconds-to-fun estimate '+s2f.toFixed(1)+'s (travel '+ (nd/spd).toFixed(1)+' + work '+(ni.need||1.6)+')');
okp(spd>2&&s2f<15,'seconds-to-fun estimate '+s2f.toFixed(1)+'s at speed '+spd.toFixed(1));

// P3: VOX shoo hook — EXPECTED FAIL (the finding's failing test)
const hm=G.humans.find(h=>!h.driverCar); const kx=G.keas[0]; kx.size=1;
let sh=0; while(hm.state!=='shoo'&&sh<600){ hm.state='idle'; hm.t=0.5; kx.x=hm.x+0.8; kx.z=hm.z; kx.y=0; kx.grounded=true; X.update(1/60); sh++; if(hm.state==='shoo')break; }
console.log('  (shoo provoke under pinning: state='+hm.state+' — informational; hook verified at source below)');
const src=require('fs').readFileSync(__dirname+'/../../untitled-kea-game.html','utf8');
okp(/VOX\.play\('shoo'/.test(src),'P3a (ENFORCING, fixed during audit): shoo state reachable in play (proven above) but no VOX.play(shoo) hook in source — most common bark is silent');
okp(/VOX\.play\('flee'/.test(src),'P3b (ENFORCING, fixed during audit): flee VO recorded (flee1/flee2) but no VOX.play(flee) hook in source');
console.log('  vox hooks in source: shoo='+/VOX\.play\('shoo'/.test(src)+' flee='+/VOX\.play\('flee'/.test(src)+' | shooProvoked='+(hm.state==='shoo'));

if(F.length){ console.error('PROBE FINDINGS:\n  - '+F.join('\n  - ')); }
console.log('PROBES DONE — '+F.length+' finding(s)');
