/* FRAMEABLATE — where does a frame of the live game go? SPIKE ADOPTION, 2026-10-02.
   framebudget.mjs says how long a frame takes; this says WHY, by switching things off one at a time
   INSIDE ONE live, headful, unlocked session (bird flying, everything running) and timing each state.
   One session on purpose: a fresh browser per state would fold boot and shader-compile noise into
   the difference being measured. Each state is held for HOLD seconds after SETTLE seconds of warm-up.
   Usage: node gauntlet/verify/frameablate.mjs     env: W H HOLD SETTLE */
import { ensureBuild, serve, preparePage, assertBooted, assertBirdDressed, GAUNTLETSEED } from './webrig.mjs';
const W=+(process.env.W||1920), H=+(process.env.H||1080), HOLD=+(process.env.HOLD||4), SETTLE=+(process.env.SETTLE||1.5);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
ensureBuild(); const srv=await serve();
const p=(await import('puppeteer')).default;
const b=await p.launch({headless:false,channel:'chrome',defaultViewport:null,args:['--no-sandbox',`--window-size=${W},${H+120}`,
  '--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling',
  '--disable-gpu-vsync','--disable-frame-rate-limit']});
try{
  const pg=(await b.pages())[0]; await pg.setViewport({width:W,height:H,deviceScaleFactor:1});
  await preparePage(pg,{seed:GAUNTLETSEED,biome:'carpark'}); await pg.goto(srv.origin,{waitUntil:'load'}); await sleep(1000);
  await assertBooted(pg,{biome:'carpark'});
  await pg.evaluate('KEAGAME.startGame(1)'); await assertBirdDressed(pg); await pg.bringToFront();
  await pg.evaluate(`(()=>{ const K=KEAGAME,M=K.P1MAP; K.press(M.fwd); let t=0; setInterval(()=>{ t++;
    if(t%16===0){K.release(M.left);K.release(M.right);K.press((t/16)%2?M.left:M.right);} if(t%30<6)K.press(M.flap); else K.release(M.flap); },100);
    window.__ms=()=>new Promise(res=>{ const d=[]; let l=performance.now(); const t0=l; const f=n=>{ d.push(n-l); l=n; if(n-t0<${HOLD}*1000)requestAnimationFrame(f); else { d.shift(); d.sort((a,b)=>a-b); res({mean:+(d.reduce((a,b)=>a+b,0)/d.length).toFixed(2), median:+d[d.length>>1].toFixed(2), n:d.length}); } }; requestAnimationFrame(f); });
    const G=K.G; window.__abl={
      base:()=>{},
      nopost:()=>{ G.__post=G.__post||G.post; G.post=null; },
      noshadow:()=>{ G.renderer.shadowMap.enabled=false; G.scene.traverse(o=>{ if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);} }); },
      nograss:()=>{ for(const k of ['grassMesh','grassCoverMesh','grassFarMesh','grassCards'])if(G[k])G[k].visible=false; G.scene.traverse(o=>{ if(o.isInstancedMesh)o.visible=false; }); },
      halfres:()=>{ G.renderer.setPixelRatio(0.5); },
      noclump:()=>{ if(G.grassMesh)G.grassMesh.visible=false; },
      nocover:()=>{ G.scene.traverse(o=>{ if(o.name==='grass_cover')o.visible=false; }); },
      nofar:()=>{ G.scene.traverse(o=>{ if(o.name==='grass_far')o.visible=false; }); },
      nocards:()=>{ if(G.grassCards)G.grassCards.visible=false; },
      noao:()=>{ const e=G.post&&G.post.__eyes; G.__ao=G.__ao||[]; (G.post._eyesList?G.post._eyesList():[]).forEach(e=>{ if(e.ao){e.ao.enabled=false;} }); },
      nobloom:()=>{ (G.post._eyesList?G.post._eyesList():[]).forEach(e=>{ e.composer.passes.forEach(p=>{ if(p.constructor.name.includes('Bloom'))p.enabled=false; }); }); },
      scale75:()=>{ G.renderer.setPixelRatio(0.75); },
      treestd:()=>{ for(const r of G.treeReg||[]) if(r.model)r.model.traverse(o=>{ if(o.isMesh&&o.material&&o.material.isMeshPhysicalMaterial){ o.userData._m=o.material; const m=new THREE.MeshStandardMaterial(); THREE.MeshStandardMaterial.prototype.copy.call(m,o.material); m.alphaTest=0.5; m.side=THREE.DoubleSide; o.material=m; } }); },
      nocars:()=>{ G.scene.traverse(o=>{ if(o.name&&o.name.startsWith('vehicle_')){ o.userData._v=o.visible; o.visible=false; } }); },
      carstd:()=>{ G.scene.traverse(o=>{ if(o.isMesh&&o.material&&o.material.isMeshPhysicalMaterial&&!(o.parent&&o.parent.parent&&o.parent.parent.isLOD)){ let v=false; for(let p=o;p;p=p.parent)if(p.name&&p.name.startsWith('vehicle_'))v=true; if(!v)return; o.userData._m=o.material; const m=new THREE.MeshStandardMaterial(); THREE.MeshStandardMaterial.prototype.copy.call(m,o.material); o.material=m; } }); },
      notrees:()=>{ for(const r of G.treeReg||[]) if(r.model)r.model.visible=false; },
      treenoshadow:()=>{ for(const r of G.treeReg||[]) if(r.model)r.model.traverse(o=>{ if(o.isMesh){ o.userData._cs=o.castShadow; o.castShadow=false; } }); },
      sceneonly:()=>{ G.__post=G.__post||G.post; G.post=null; G.renderer.shadowMap.enabled=false; G.scene.traverse(o=>{ if(o.isInstancedMesh)o.visible=false; if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);} }); G.renderer.setPixelRatio(0.5); },
    };
    window.__restore=()=>{ if(G.__post)G.post=G.__post; G.renderer.shadowMap.enabled=true; G.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
      for(const r of G.treeReg||[]) if(r.model){ r.model.visible=true; r.model.traverse(o=>{ if(o.isMesh&&o.userData._cs!==undefined)o.castShadow=o.userData._cs; }); }
      G.scene.traverse(o=>{ if(o.userData._m){ o.material=o.userData._m; delete o.userData._m; } if(o.userData._v!==undefined){ o.visible=o.userData._v; delete o.userData._v; } });
      if(G.grassMesh)G.grassMesh.visible=true; if(G.grassCards)G.grassCards.visible=true; G.scene.traverse(o=>{ if(/^grass_/.test(o.name||'')&&o!==G.grassCards)o.visible=true; });
      (G.post&&G.post._eyesList?G.post._eyesList():[]).forEach(e=>{ if(e.ao)e.ao.enabled=true; e.composer.passes.forEach(p=>{ if(p.constructor.name.includes('Bloom'))p.enabled=true; }); });
      G.scene.traverse(o=>{ if(o.isInstancedMesh)o.visible=true; if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);} }); };
  })()`);
  await sleep(3000);
  for(const s of (process.env.STATES||'base,nopost,noshadow,nograss,halfres,sceneonly,base').split(',')){
    await pg.evaluate(s=>{ window.__restore(); window.__abl[s](); },s); await sleep(SETTLE*1000);
    const r=await pg.evaluate('window.__ms()');
    const calls=await pg.evaluate(()=>{ const r=KEAGAME.G.renderer; return r.info.render.frame; });
    console.log(s.padEnd(10), String(r.mean).padStart(7)+' ms mean', String(r.median).padStart(7)+' median', (1000/r.mean).toFixed(1).padStart(6)+' fps', r.n+' frames');
  }
} finally { await b.close().catch(()=>{}); await srv.close(); }
