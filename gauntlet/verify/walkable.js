/* WALKABILITY — can the bird actually get from A to B on foot, or is there a hole in the route?
   Usage (standalone):  node gauntlet/verify/walkable.js         — runs every route it knows
   Used by:             audits/2026-08-28/harness-everything.js  (section: WALKABILITY)

   COMMONJS ON PURPOSE, unlike its neighbours in this directory. The other instruments here are
   photographic tools that ESM scripts drive; this one is an assertion the GATE runs, and the nine
   batteries are CommonJS and load their specimen synchronously (`const H=load()` at top level).
   An ESM twin would either have to be duplicated or awaited, and a walkability check that only the
   command line can run is exactly the arrangement that let this defect ship in the first place.

   WHY THIS EXISTS. The river's swing bridge was built, collidered, asserted along its whole length,
   photographed and shipped — and it did not CONNECT. Its deck sat at y 2.55 and the boardwalk that
   led to it sat at 0.51, with nothing in between; the far end stopped 2.55 m above bare grass with
   no landing and no track. Every assertion about it was TRUE: the deck was a roof collider, it held
   at near, mid and far, the crossing mission fired. What nothing asked was whether a bird WALKING
   from the path could get onto it, because "a collider exists at these three points" and "this
   route is continuous" are different questions and the gauntlet only had instruments for the first.
   Eric found it by looking at 39_river_walk.

   THE MEASUREMENT THAT FINDS IT. Sample a polyline every `step` metres and read groundHeightAt
   twice at each point:
     ACHIEVED  groundHeightAt(x, z, carry)  — carry being the previous sample's height plus a
               stride, which is how a walking bird arrives at the next surface. groundHeightAt only
               lifts the bird onto a surface it is already near:
                   if(curY >= c.top-0.55 && c.top > h) h = c.top;
               That 0.55 is the game's own reach, so it is the threshold this file measures against
               rather than a number of mine.
     EXISTS    groundHeightAt(x, z, Infinity) — every surface at this point, reachable or not.
   A route is walkable when those two agree everywhere AND no achieved step exceeds the reach.

   THE TWO CHECKS CATCH DIFFERENT THINGS, AND THE SECOND IS THE LOAD-BEARING ONE.
     maxUp      a wall: a surface the bird stands in front of and cannot climb.
     outOfReach a surface the route runs UNDER — the bridge's own defect. On the shipped route the
                profile was 0.51 flat then 0.00 flat: its only step was 0.51 DOWN, inside the reach,
                so a step-size check ALONE would have called it walkable while the bird strolled the
                full 24 m underneath the bridge it was supposed to be crossing. The out-of-reach
                count was 99 samples deep and is the number that names the defect.

   IT MEASURES BOTH DIRECTIONS, and the reason is a sabotage that got away. The first cut ignored
   down-steps on the grounds that falling off a bridge is legal — which is true, and irrelevant:
   falling off the SIDE of a route is never sampled, because the samples are on the route. A drop
   ALONG a route is a cliff in the middle of a path. Deleting the far landing left the deck ending
   2.55 m above bare grass and the up-only check called that walkable, because the bird's last step
   was downward. A route is somewhere a player walks; if it drops further than the bird can climb
   back up, it is not a route, it is a one-way trip. So `maxUp` is a wall and `maxDown` is a cliff
   and both are measured against the same reach.

   IT ALSO CAUGHT ITS OWN FIX. The first cut of the stair drew six treads at the right places and
   emitted all six COLLIDERS at the prop origin, because the entry mapped `top` and forgot `z`. The
   picture would have looked perfect. This file reported a 0.68 m step and 99 samples out of reach. */
const path=require('path');

const REACH=0.55;          // groundHeightAt's own snap window
const STRIDE=0.30;         // how much altitude a walking bird brings to the next surface

/* profile(gh, pts, step) -> [{x,z,h,exists,d}] ; gh is a groundHeightAt(x,z,curY) function */
function profile(gh, pts, step){
  const S=step||0.25, out=[];
  let carry=null;
  for(let i=1;i<pts.length;i++){
    const a=pts[i-1], b=pts[i];
    const L=Math.hypot(b.x-a.x,b.z-a.z), n=Math.max(1,Math.ceil(L/S));
    for(let k=(i===1?0:1);k<=n;k++){
      const t=k/n, x=a.x+(b.x-a.x)*t, z=a.z+(b.z-a.z)*t;
      const h=gh(x,z,carry===null?0.4:carry+STRIDE);
      out.push({x:+x.toFixed(3),z:+z.toFixed(3),h:+h.toFixed(4),
                exists:+gh(x,z,Infinity).toFixed(4),d:+(S*out.length).toFixed(2)});
      carry=h;
    }
  }
  return out;
}

/* walkable(gh, pts, opts) -> {ok, maxUp, wallAt, outOfReach, worst, samples, reach, profile} */
function walkable(gh, pts, opts){
  const o=opts||{}, reach=o.reach===undefined?REACH:o.reach;
  const p=profile(gh,pts,o.step);
  let maxUp=0, at=null, maxDown=0, dnAt=null;
  for(let i=1;i<p.length;i++){ const d=p[i].h-p[i-1].h;
    if(d>maxUp){ maxUp=d; at=p[i]; }
    if(-d>maxDown){ maxDown=-d; dnAt=p[i]; } }
  /* A SURFACE THE ROUTE RUNS UNDER. `demand` is how much more altitude the bird needed to make it,
     which is the number worth reading: for the shipped bridge it was 1.70 m past the reach. */
  const under=p.filter(s=>s.exists>s.h+1e-6)
               .map(s=>Object.assign({},s,{demand:+(s.exists-(s.h+STRIDE)-reach).toFixed(4)}));
  const worst=under.slice().sort((a,b)=>b.demand-a.demand)[0]||null;
  return {ok:maxUp<=reach+1e-9&&maxDown<=reach+1e-9&&under.length===0,
          maxUp:+maxUp.toFixed(4), wallAt:at, maxDown:+maxDown.toFixed(4), cliffAt:dnAt,
          outOfReach:under.length, worst, samples:p.length, reach, profile:p};
}

/* THE ROUTES THIS FILE KNOWS, so the battery and the command line cannot disagree about what "the
   crossing" means. Every route is a walk a player would actually take, and every waypoint is read
   off the world's own constants — move the bridge and the route moves with it.
   THE FIRST IS A POSITIVE CONTROL and it is not decoration: a harness on which everything fails
   proves nothing, and stepping up onto the boardwalk is a 0.51 m rise against a 0.55 m reach, so it
   passes by 40 mm and would go red the moment either number moved. */
function routes(V){
  const R=V.RIV;
  return {
    'river: flat -> boardwalk':
      [{x:R.WALK.x,z:R.WALK.z0-6},{x:R.WALK.x,z:R.WALK.z0+6}],
    'river: boardwalk -> stair -> deck -> landing -> far track':
      [{x:R.WALK.x,z:R.WALK.z0+1},
       {x:R.WALK.x,z:R.BRIDGE.z0-R.STEPN*R.STEP.tread},   // the foot of the near stair
       {x:R.BRIDGE.x,z:R.BRIDGE.z0+0.5},                  // onto the deck
       {x:R.BRIDGE.x,z:R.BRIDGE.z1-0.5},                  // across it
       {x:R.BRIDGE.x,z:R.FAR.z1+1.0},                     // landing, stair down, onto the ground
       {x:R.BRIDGE.x,z:R.FAR.zt-1.0}],                    // and away down the far track
  };
}

module.exports={profile,walkable,routes,REACH,STRIDE};

if(require.main===module){
  const {load}=require(path.resolve(__dirname,'../../audits/2026-08-26/rig'));
  const H=load(), X=H.X;
  const R=routes(X); let bad=0;
  for(const name of Object.keys(R)){
    X.setSeed(20260828); X.boot({biome:name.split(':')[0]});
    const r=walkable((x,z,y)=>X.groundHeightAt(x,z,y),R[name]);
    console.log((r.ok?'\x1b[32m✓\x1b[0m ':'\x1b[31m✗\x1b[0m ')+name);
    console.log('    '+r.samples+' samples   maxUp '+r.maxUp.toFixed(3)+
      ' / maxDown '+r.maxDown.toFixed(3)+' m of '+r.reach+' reach   out-of-reach '+r.outOfReach+
      (r.worst?'\n    worst: a surface at '+r.worst.exists.toFixed(2)+' m over ground '+
        r.worst.h.toFixed(2)+' at z '+r.worst.z+', short by '+r.worst.demand.toFixed(2)+' m':''));
    if(!r.ok)bad++;
  }
  console.log('WALKABLE: '+Object.keys(R).length+' routes, '+bad+' with a hole in them');
  process.exit(bad?1:0);
}
