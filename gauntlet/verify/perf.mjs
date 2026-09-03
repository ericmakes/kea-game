// PERF — what a frame actually costs, in milliseconds, on this machine.
// Usage: node gauntlet/verify/perf.mjs [cameraKey]   env: BIOME, KEAGRASS, RUNS, RENDERS, W, H
//
// WHY THIS FILE EXISTS (REPLAT P4). P4's proof contract says "frame budget measured and recorded
// (must hold a playable frame rate on Eric's Mac)", and every earlier attempt in this project to
// put a number on a frame got one of two useless answers:
//   16.6 ms, BECAUSE OF VSYNC. A RAF loop on a healthy scene reports the refresh interval no matter
//     how much headroom there is. Session 17 measured exactly that and it said nothing at all.
//   a JS timing of r.render(), WHICH DOES NOT WAIT FOR THE GPU. WebGL commands are queued; the call
//     returns long before the work is done, so the number is the driver's submission cost.
// So: render N times in a tight loop, then force a sync with a 1x1 readPixels, and divide. Best of
// several passes, because the first pass pays for shader compiles and texture uploads and the OS
// will occasionally steal a slice. The number is a SCENE cost, not a whole-frame cost - it excludes
// the post chain deliberately, so a grass tier can be compared against another grass tier without
// bloom and depth-of-field moving underneath the comparison.
//
// IT REPORTS WHAT WAS DRAWN ALONGSIDE WHAT IT COST. A millisecond figure with no triangle count is
// not reproducible six months later, so renderer.info comes back with it.
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';

const CAMS={
  // the three that matter for grass: bird height in the field, the wide, and the ski field
  bird:    {pos:[-6.0,0.55,-14.0], at:[2.0,0.35,-2.0],  biome:'carpark'},
  wide:    {pos:[0,26,44],         at:[0,0,10],         biome:'carpark'},
  tussock: {pos:[-2.0,1.10,-30.0], at:[6.0,0.60,-46.0], biome:'skifield'},
};
const KEY=process.argv[2]||'bird';
const C=CAMS[KEY]; if(!C){ console.error('perf: no such camera "'+KEY+'". Known: '+Object.keys(CAMS).join(', ')); process.exit(1); }
const BIOME=process.env.BIOME||C.biome;
const RUNS=+(process.env.RUNS||6), RENDERS=+(process.env.RENDERS||40);
const W=+(process.env.W||1280), H=+(process.env.H||720);

/* RAF=1: THE RENDER CADENCE, AND EXPLICITLY *NOT* A FRAME RATE.
   This mode was added to answer "does it hold a playable frame rate" and it CANNOT, which is worth
   stating in the file rather than learning twice. Headless Chrome drives requestAnimationFrame on
   a fixed cadence that has nothing to do with how long the GPU took — it reported 59.9 fps median
   for 120,000 blades, for 1,900,000 blades and for the pre-P4 build, all identical, while the
   loop-timed cost of those three differed by a factor of ten. A number that does not move when the
   work grows tenfold is not measuring the work.
   It is kept because the render CADENCE is still worth reading (the game's loop really is running
   — measured at ~110 renders/s here), and because leaving it out invites the next session to write
   it again and believe it. THE COMPARATIVE INSTRUMENT IS THE DEFAULT LOOP-TIMED MODE.
   AND THE FIRST GUARD ON IT WAS ALSO WRONG: it checked renderer.info after the frame and found one
   triangle in one call, concluded nothing had rendered, and I nearly recorded "the render loop is
   not running". info.autoReset means those counters describe the LAST pass of the composer, which
   is a fullscreen quad. The honest check is whether the frame COUNTER advanced. */
const RAF=!!process.env.RAF, DPR=+(process.env.DPR||1);
ensureBuild(); const S=await serve(); const b=await launch();
try{
  const pg=await b.newPage();
  await pg.setViewport({width:W,height:H,deviceScaleFactor:DPR});
  await preparePage(pg,{seed:GAUNTLETSEED,biome:BIOME});
  await pg.goto(S.origin,{waitUntil:'load'});
  await assertBooted(pg,{biome:BIOME});
  await pg.evaluate((wantPost)=>{ window.__PERF_POST__=wantPost; KEAGAME.startGame(1); },!!process.env.POST);
  await new Promise(r=>setTimeout(r,1200));
  if(RAF){
    const r=await pg.evaluate(({pos,at})=>new Promise(res=>{
      const G=KEAGAME.G, cam=G.cams[0];
      G.camLock=true;
      cam.position.set(pos[0],pos[1],pos[2]); cam.lookAt(at[0],at[1],at[2]);
      /* PROOF THAT THE FRAMES BEING TIMED ARE FRAMES THAT DREW THE GRASS. A frame-rate loop that
         quietly measures a paused game reports a beautiful 60 and means nothing, and the two
         measurements in this file disagreed by a factor of fifteen until this was added. */
      const seen={tris:0,calls:0,frames:0,f0:KEAGAME.G.renderer.info.render.frame};
      const dt=[]; let last=performance.now(), n=0;
      const tick=()=>{ const now=performance.now(); if(n>10)dt.push(now-last); last=now; n++;
        seen.frames=KEAGAME.G.renderer.info.render.frame-seen.f0;
        if(n<260)requestAnimationFrame(tick);
        else { dt.sort((a,b2)=>a-b2);
          const med=dt[Math.floor(dt.length/2)], p95=dt[Math.floor(dt.length*0.95)];
          res({frames:n, rendersObserved:seen.frames,
               medianMs:+med.toFixed(2), p95Ms:+p95.toFixed(2),
               cadenceHz:+(1000/med).toFixed(1), note:'CADENCE, NOT FPS — see the header',
               drawing:{w:G.renderer.domElement.width,h:G.renderer.domElement.height,
                        dpr:G.renderer.getPixelRatio()},
               grass:G.grass?{tier:G.grass.tier,instances:G.grass.instances,near:G.grass.near,
                              density:Math.round(G.grass.density||0)}:null}); } };
      requestAnimationFrame(tick);
    }),{pos:C.pos,at:C.at});
    console.log(JSON.stringify(Object.assign({camera:KEY,biome:BIOME,cssViewport:W+'x'+H,
      deviceScaleFactor:DPR, mode:'RAF (the game\'s own loop, vsync included)'},r),null,1));
    await b.close(); if(S.close)S.close();
    /* A FRAME-RATE LOOP THAT MEASURES A PAUSED GAME REPORTS A BEAUTIFUL 60 AND MEANS NOTHING, and
       this mode did exactly that: it reported 59.9 fps median for 120,000 blades and for
       1,900,000 blades and for the pre-P4 build, all identical, because the game's own render loop
       was not running under this harness at all and every one of those numbers was the browser
       idling. It disagreed with the loop-timed cost by a factor of fifteen and I nearly believed
       the flattering one. It is a HARD FAILURE now — a measurement that cannot prove it measured
       something is not a measurement. */
    if(!r.rendersObserved){
      console.error('perf: the game rendered NOTHING across '+r.frames+' animation frames — this '+
        'is the browser idling, not a cadence. Something stopped the render loop.');
      process.exit(2);
    }
    process.exit(0);
  }
  const out=await pg.evaluate(({pos,at,renders,runs})=>{
    const G=KEAGAME.G, r=G.renderer, gl=r.getContext(), cam=G.cams[0];
    /* THE CAMERA IS PLACED AND HELD. camLock is the only thing that stops updateCams lerping it
       away - FLAKES law 12 learned that on the capture rig and it is the same seam here. */
    G.camLock=true; G.time=12.0;
    cam.position.set(pos[0],pos[1],pos[2]);
    cam.lookAt(at[0],at[1],at[2]);
    cam.updateMatrixWorld(true);
    const px=new Uint8Array(4);
    /* SCENE-ONLY BY DEFAULT, WHOLE-FRAME ON REQUEST. A grass tier is compared against another
       grass tier, and bloom plus ambient occlusion plus depth of field moving underneath that
       comparison would only add noise — so the default excludes them. But "holds a playable frame
       rate" is a claim about the WHOLE frame, and the post chain is part of it, so POST=1 renders
       through the composer the game actually ships. Both numbers are recorded; neither alone is
       the answer. */
    /* !! ON BOTH SIDES. The first cut assigned `G.post.render` (a FUNCTION) to `post` and then
       reported `post===true`, so a run that DID go through the composer printed "post on: false"
       and I spent a measurement cycle believing the machine had thrown a fit. A flag that is
       reported has to be a flag. */
    const post=!!(window.__PERF_POST__ && G.post && G.post.render);
    const one=post ? (()=>G.post.render(false,window.innerWidth,window.innerHeight))
                   : (()=>r.render(G.scene,cam));
    const pass=(n)=>{ const t0=performance.now();
      for(let i=0;i<n;i++) one();
      gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);     // the sync that makes this real
      return (performance.now()-t0)/n; };
    pass(8);                                                   // warm: compiles, uploads, caches
    r.info.reset(); r.render(G.scene,cam);
    const drawn={calls:r.info.render.calls, tris:r.info.render.triangles, pts:r.info.render.points};
    let best=1e9, all=[];
    for(let k=0;k<runs;k++){ const ms=pass(renders); all.push(+ms.toFixed(3)); if(ms<best)best=ms; }
    all.sort((a,b2)=>a-b2);
    const g=G.grass||null;
    return {ms:+best.toFixed(3), median:all[Math.floor(all.length/2)], samples:all, drawn,
            grass:g?{tier:g.tier,instances:g.instances,perBladeTris:g.perBladeTris,
              lodNear:g.lodNear,lodFar:g.lodFar,radius:g.radius,shader:g.shader}:null,
            post:post,
            memory:{geometries:r.info.memory.geometries,textures:r.info.memory.textures}};
  },{pos:C.pos,at:C.at,renders:RENDERS,runs:RUNS});
  const fps=1000/out.ms;
  console.log(JSON.stringify({camera:KEY,biome:BIOME,viewport:W+'x'+H,post:!!process.env.POST,
    msPerRender:out.ms, medianMs:out.median, impliedFps:+fps.toFixed(1),
    frameBudgetPct:+((out.ms/16.667)*100).toFixed(1),
    postActuallyOn:out.post, drawCalls:out.drawn.calls, triangles:out.drawn.tris,
    grass:out.grass, samples:out.samples},null,1));
} finally { await b.close(); if(S.close)S.close(); }
process.exit(0);
