/* BIRDPOSE — photograph the approved bird in the GAME'S OWN LOADER, one frame per authored clip.
   Usage: node gauntlet/verify/birdpose.mjs [outdir]
          CLIPS=walk_loop,flight_glide ...   shoot a subset
          GLB=models/...                     a different asset (page URL, under assets/)

   WHY IT IS BUILT THIS WAY. The game has no mixer: installBird loads the GLB and rigCommit() poses
   the skeleton every frame from the primitive bird's handles. So a clip cannot simply be "played"
   in the game — something has to own the bones. This tool makes that ownership explicit and
   temporary: it boots the real game with the real loader (recolour, eye rings, measured scale and
   ground offset all come from bird.mjs), then hands the skeleton to the clip for one photograph by
   nulling kea._model — which is precisely the switch an integration would make permanent for the
   states the clips own. The pose itself is sampled in node from the GLB with three's own
   AnimationMixer and injected by bone NAME, so what is photographed is the authored pose and not a
   re-implementation of it.
   THE MORPH TRAVELS WITH THE POSE, because EXPORT_CHANGES.md says it must: each clip keys its own
   wing-release weight and this applies that same value. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import * as THREE from 'three';
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';
globalThis.createImageBitmap=async()=>({width:4,height:4,close(){}});
globalThis.self={URL:{createObjectURL:()=>'blob:stub',revokeObjectURL(){}}};
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..','..');
const OUT=process.argv[2]||path.join(ROOT,'gauntlet/capture/bird');
const GLBREL=process.env.GLB||'models/astra_incoming/approved/kea_animated.glb';
/* SHOT ON THE SKI FIELD, NOT IN THE CARPARK, and that is a staging decision with a reason: the
   carpark origin stands in waist-deep tussock and the first cut of these previews photographed a
   bird buried to the shoulder in grass. The groomed band is flat, clean and white, so the
   silhouette — which is the thing being judged — has nothing to compete with. */
const BIOME=process.env.BIOME||'skifield';
const AT_XZ=(process.env.XZ||'17,19').split(',').map(Number);
const GLBABS=path.join(ROOT,'assets',GLBREL);
fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---- sample every clip in node ---- */
const buf=fs.readFileSync(GLBABS);
const gltf=await new Promise((res,rej)=>new GLTFLoader().parse(
  buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'',res,rej));
const root=gltf.scene; let sk=null; root.traverse(o=>{ if(o.isSkinnedMesh)sk=o; });
const mixer=new THREE.AnimationMixer(root);
const BONES=sk.skeleton.bones.map(b=>b.name);
/* one representative time per clip: the middle of a held pose, and the extreme of a stroke —
   named here rather than derived, because "which frame shows this clip" is a judgement */
const AT={approved_idle:0, walk_loop:0.25, watch_idle:0.9, beak_tear:1.05,
          flight_loop:0.15, flight_glide:0, flight_bank_left:0, flight_bank_right:0,
          carry_walk:0.25, carry_idle:0.9};
const WANT=(process.env.CLIPS||Object.keys(AT).join(',')).split(',').filter(Boolean);
/* NOPOSE=1 photographs THE GAME'S OWN REST — no clip injected, rigCommit left running. That is
   the naive swap: point the url at a file and see what the loader makes of it. It is the control
   every other frame here is read against, and it is the one that shows what bird.mjs's
   "evaluate animations[0] at restT" does to an asset whose animations[0] is not a rest clip. */
const NOPOSE=!!process.env.NOPOSE;
const poses={};
if(NOPOSE)poses['_game_rest']={t:null,dur:null,bones:null,w:null};
for(const c of NOPOSE?[]:gltf.animations){
  if(!(c.name in AT)||!WANT.includes(c.name))continue;
  mixer.stopAllAction();
  const a=mixer.clipAction(c); a.reset(); a.play(); mixer.setTime(Math.min(AT[c.name],c.duration));
  root.updateMatrixWorld(true);
  const rec={t:AT[c.name],dur:+c.duration.toFixed(4),bones:{},w:(sk.morphTargetInfluences||[0])[0]||0};
  for(const b of sk.skeleton.bones)
    rec.bones[b.name]=[b.position.x,b.position.y,b.position.z,
                       b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w,
                       b.scale.x,b.scale.y,b.scale.z];
  poses[c.name]=rec;
}
console.log('birdpose: sampled '+Object.keys(poses).length+' clips from '+GLBREL);

/* ---- photograph each one in the game ---- */
ensureBuild();
const SRV=await serve(); console.log('birdpose: serving '+SRV.origin);
const CAM=(x,y,z,lx,ly,lz)=>`KEAGAME.G.camLock={x:${x},y:${y},z:${z},lx:${lx},ly:${ly},lz:${lz}};`;
const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true);const td=document.getElementById('todo');if(td)td.style.display='none';
  KEAGAME.G.cfOpen=false;KEAGAME.G.paused=false;KEAGAME.G.humans.forEach(h=>{h._park=true;});
  {const _pk=()=>{try{KEAGAME.G.humans.forEach(h=>{if(!h._park)return;h.x=46;h.z=46;h.home={x:46,z:46};h.patrol=null;h.state='idle';h.t=0;if(h.g)h.g.position.set(46,0,46);});}catch(e){}requestAnimationFrame(_pk);};requestAnimationFrame(_pk);}`;
const report={glb:GLBREL,shots:[]};
for(const [name,rec] of Object.entries(poses)){
  const browser=await launch();
  try{
    const page=await browser.newPage();
    await page.setViewport({width:960,height:540,deviceScaleFactor:1});
    await preparePage(page,{seed:GAUNTLETSEED,biome:BIOME});
    /* PLUME=off disables keaRecolour AND the eye rings, by handing the recipe a null plume — the
       merge in game.mjs takes the else branch for null and replaces the object outright. It is the
       only way to see the asset's OWN paint through the game's renderer and lighting. */
    const cfg=Object.assign({model:true,url:GLBREL}, process.env.PLUME==='off'?{plume:null}:{});
    await page.evaluateOnNewDocument(`globalThis.__KEA_BIRD__=${JSON.stringify(cfg)};`);
    await page.goto(SRV.origin,{waitUntil:'load'}); await sleep(1200);
    await assertBooted(page,{biome:BIOME});
    await page.evaluate('window.AudioContext=undefined; KEAGAME.startGame(1);'); await sleep(400);
    /* WAIT FOR THE BIRD TO ACTUALLY ATTACH, which is not the same as the page having booted. The
       approved GLB is 32 MB; startGame builds the keas long before that fetch resolves, and
       installBird then attaches to the keas that already exist. Reading G.bird before that lands
       reports {"birds":0} and the injection silently poses nothing — which is exactly what the
       first run of this tool did, ten times over. */
    let bird='{}';
    for(let i=0;i<60;i++){
      bird=await page.evaluate('JSON.stringify(KEAGAME.G.bird||{})');
      const b=JSON.parse(bird); if(b.mode==='primitive')break;
      if(b.mode==='model'&&b.birds>0)break;
      await sleep(500);
    }
    { const b=JSON.parse(bird);
      if(b.mode!=='model'||!(b.birds>0)) throw new Error('bird never attached: '+bird.slice(0,160)); }
    await page.evaluate(QUIET);
    /* hand the skeleton to the clip, and hold the bird still under it */
    const GY=await page.evaluate(`KEAGAME.groundHeightAt(${AT_XZ[0]},${AT_XZ[1]},1)`);
    const applied=rec.bones===null? await page.evaluate(`(()=>{
      const G=KEAGAME.G,k=G.keas[0];
      const _hold=()=>{ try{ k.x=${AT_XZ[0]};k.z=${AT_XZ[1]};k.y=KEAGAME.groundHeightAt(${AT_XZ[0]},${AT_XZ[1]},1);
        k.vy=0;k.grounded=true;k.ry=1.9;k.stun=0;k.idleT=0;k.idleAct=null;G.time=12.0; }catch(e){}
        requestAnimationFrame(_hold); }; requestAnimationFrame(_hold);
      return {ok:true,bones:-1,morph:null};})()`)
    : await page.evaluate(`(()=>{
      const G=KEAGAME.G,k=G.keas[0]; if(!k||!k._model)return {ok:false,why:'no model on kea 0'};
      const M=k._model, P=${JSON.stringify(rec.bones)};
      const by={}; M.sk.skeleton.bones.forEach(b=>by[b.name]=b);
      let n=0; for(const nm in P){ const b=by[nm]; if(!b)continue; const v=P[nm];
        b.position.set(v[0],v[1],v[2]); b.quaternion.set(v[3],v[4],v[5],v[6]); b.scale.set(v[7],v[8],v[9]); n++; }
      if(M.sk.morphTargetInfluences)M.sk.morphTargetInfluences[0]=${rec.w};
      k._model=null;                       // rigCommit stops here: the clip owns the bones now
      M.root.updateMatrixWorld(true);
      const _hold=()=>{ try{ for(const nm in P){ const b=by[nm]; if(!b)continue; const v=P[nm];
          b.position.set(v[0],v[1],v[2]); b.quaternion.set(v[3],v[4],v[5],v[6]); b.scale.set(v[7],v[8],v[9]); }
        if(M.sk.morphTargetInfluences)M.sk.morphTargetInfluences[0]=${rec.w};
        k.x=${AT_XZ[0]};k.z=${AT_XZ[1]};k.y=KEAGAME.groundHeightAt(${AT_XZ[0]},${AT_XZ[1]},1);k.vy=0;k.grounded=true;k.ry=1.9;k.stun=0;
        G.time=12.0; }catch(e){} requestAnimationFrame(_hold); };
      requestAnimationFrame(_hold);
      return {ok:true,bones:n,morph:${rec.w}};
    })()`);
    /* 0.83 m out, which is a PORTRAIT and was derived rather than guessed: the game runs a ~92
       degree horizontal FOV, so the frame is 1.16*d tall and 2*d*tan(46) wide — at this distance a
       0.50 m bird stands 273 px of 540 and a 1.3 m flight span still fits inside 1.76 m of frame.
       The same camera for every clip, so the ten frames can be read against each other. */
    await page.evaluate(CAM(AT_XZ[0]+0.60,0.50+GY,AT_XZ[1]+0.52, AT_XZ[0],0.25+GY,AT_XZ[1]));
    await sleep(900);
    await page.screenshot({path:path.join(OUT,name+'.png')});
    console.log('  shot '+name.padEnd(18)+' bones '+(applied.bones||0)+'  morph '+rec.w+'  '+bird.slice(0,90));
    report.shots.push({clip:name,t:rec.t,dur:rec.dur,morph:rec.w,bones:applied.bones||0,bird:JSON.parse(bird)});
  } catch(e){ console.log('  FAILED '+name+' — '+String(e&&e.message||e).split('\n')[0]); }
  finally{ try{ await browser.close(); }catch(_){ } }
}
fs.writeFileSync(path.join(OUT,'BIRDPOSE.json'),JSON.stringify(report,null,2));
console.log('birdpose: '+report.shots.length+' frames -> '+OUT);
process.exit(0);
