/* BIRDCLIPS — what the baked clips and the wing-release morph do to the game's own rig.
   Usage: node gauntlet/verify/birdclips.mjs [glb]     default: the approved animated package
          JSON=1 ...                                   machine-readable

   WHY THIS EXISTS. Astra's approved package ships nine baked clips that write ALL 101 joints, and
   a morph with no bone-angle driver. The game does not use a mixer at all: rigCommit() poses the
   skeleton itself every frame from the primitive bird's handles. Those two facts cannot both own a
   bone, and EXPORT_CHANGES.md says so in as many words — "a procedural rig writing those same
   transforms can fight with or overwrite the mixer... integration must choose ownership".
   This measures the collision instead of reasoning about it: which joints each clip claims, which
   joints rigCommit claims, and what the morph actually does to the mesh UNDER A PROCEDURAL WING
   POSE — the case the package explicitly says is uncertified.
   IT LOADS THE REAL FILE WITH THE REAL LOADER. GLTFLoader.parse under node, the game's own
   keaBirdFrame/keaRigBind/keaRigApply for the pose, and CPU skinning through three's own
   applyBoneTransform, so the numbers describe the shipped adapter and not a re-implementation. */
import * as THREE from 'three';
import fs from 'fs'; import path from 'path'; import url from 'url';
globalThis.createImageBitmap=async()=>({width:4,height:4,close(){}});
globalThis.self={URL:{createObjectURL:()=>'blob:stub',revokeObjectURL(){}}};
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..','..');
const GLB=process.argv[2]||path.join(ROOT,'assets/models/astra_incoming/approved/kea_animated.glb');
const JSONOUT=!!process.env.JSON;

/* the game's own rig adapter, loaded the way every battery loads the specimen */
const { createRequire } = await import('module');
const require=createRequire(import.meta.url);
const { load }=require(path.join(ROOT,'audits/2026-08-26/rig.js'));
const H=load(), X=H.X, KEABIRD=X.KEABIRD;

const buf=fs.readFileSync(GLB);
const gltf=await new Promise((res,rej)=>new GLTFLoader().parse(
  buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'',res,rej));
let sk=null; gltf.scene.traverse(o=>{ if(o.isSkinnedMesh)sk=o; });
const root=gltf.scene;
const clips=gltf.animations;
const byName=Object.fromEntries(clips.map(c=>[c.name,c]));
const bones={}; const byBone={}; sk.skeleton.bones.forEach(b=>byBone[b.name]=b);
for(const [k,n] of Object.entries(KEABIRD.bones)) if(byBone[n])bones[k]=byBone[n];
const out={glb:path.relative(ROOT,GLB), bones:Object.keys(bones).length, joints:sk.skeleton.bones.length};

/* ---- (1) WHO CLAIMS WHICH JOINT ---- */
const RIGKEYS=['body','neck','head','jaw','tail','humR','ulnaR','metaR','humL','ulnaL','metaL',
               'femR','tibR','femL','tibL'];
const rigBoneNames=new Set(RIGKEYS.map(k=>KEABIRD.bones[k]).filter(Boolean));
const nodeName=new Map();
root.traverse(o=>nodeName.set(o.uuid,o.name));
const clipRows=[];
for(const c of clips){
  const targets=new Set(); let weightTracks=0; const wVals=new Set();
  for(const t of c.tracks){
    const nm=t.name.split('.')[0];
    const prop=t.name.split('.').slice(1).join('.');
    if(prop.startsWith('morphTargetInfluences')){ weightTracks++; for(const v of t.values)wVals.add(+v.toFixed(3)); continue; }
    targets.add(nm);
  }
  const contested=[...targets].filter(n=>rigBoneNames.has(n));
  clipRows.push({clip:c.name, dur:+c.duration.toFixed(6), tracks:c.tracks.length,
    joints:targets.size, weightTracks, weights:[...wVals].sort((a,b)=>a-b),
    contested:contested.length});
}
out.clips=clipRows;
out.rigOwns=RIGKEYS.length;
out.rigBonesPresent=[...rigBoneNames].filter(n=>byBone[n]).length;

/* ---- (2) THE MORPH UNDER A PROCEDURAL WING POSE ----
   Three poses, CPU-skinned, compared vertex by vertex on the 532 rows the morph touches:
     A  procedural glide pose, morph 0   — what the game would render TODAY with the model swapped in
     B  procedural glide pose, morph 1   — the package's "intended starting endpoint" for procedural flight
     C  authored flight_glide, morph 1   — what the rigger actually drew for that state
   C is the reference: it is the only one of the three anybody has approved. */
const mixer=new THREE.AnimationMixer(root);
const setClip=(name,t)=>{ mixer.stopAllAction();
  const a=mixer.clipAction(byName[name]); a.reset(); a.play(); mixer.setTime(t);
  root.updateMatrixWorld(true); };

/* the approved rest, which is where the game's rest pose must come from now */
setClip('approved_idle',0);
const frame=X.keaBirdFrame(THREE,bones);
const rig=X.keaRigBind(THREE,bones,frame);       // captures THIS pose as the rest every delta is from
const byKey={}; for(const b of rig)byKey[b.key]=b;

/* rigCommit's own arithmetic, copied structurally: the flight branch's steady glide.
   w.rotation.z -> side*0.08, x -> 0, y -> 0, open -> 1.0   (game.mjs, the !grounded branch) */
function proceduralGlide(){
  const put=(key,x,y,z)=>{ const b=byKey[key]; if(b)X.keaRigApply(THREE,b,{x,y,z},frame); };
  const R={x:0,y:0,z:0};                         // body/neck/head left at rest for a clean read
  put('body',R.x,R.y,R.z);
  const open=1.0;
  for(const sd of [-1,1]){
    const seg=sd<0?['humL','ulnaL','metaL']:['humR','ulnaR','metaR'];
    const wx=0, wy=0, wz=sd*0.08;
    for(let i=0;i<3;i++){
      const k=KEABIRD.wingChain[i], o=KEABIRD.openChain[i]*(open-0.06);
      put(seg[i], wx*k, wy*k+sd*o, wz*k);
    }
  }
  root.updateMatrixWorld(true);
}

const g=sk.geometry;
const pos=g.attributes.position;
const mt=g.morphAttributes.position&&g.morphAttributes.position[0];
const N=pos.count;
const morphRows=[]; if(mt){ for(let i=0;i<N;i++){ if(mt.getX(i)||mt.getY(i)||mt.getZ(i))morphRows.push(i); } }
out.morphRows=morphRows.length;

function skinAll(weight){
  if(sk.morphTargetInfluences)sk.morphTargetInfluences[0]=weight;
  sk.updateMatrixWorld(true); sk.skeleton.update();
  const v=new THREE.Vector3(), o=new Float32Array(N*3);
  const saved=[];
  for(let i=0;i<N;i++){
    let px=pos.getX(i), py=pos.getY(i), pz=pos.getZ(i);
    if(mt&&weight){ px+=mt.getX(i)*weight; py+=mt.getY(i)*weight; pz+=mt.getZ(i)*weight; }
    v.set(px,py,pz);
    // three skins from geometry.attributes.position, so write the morphed value in, transform, restore
    saved.push([pos.getX(i),pos.getY(i),pos.getZ(i)]);
    pos.setXYZ(i,px,py,pz);
    sk.applyBoneTransform(i,v);
    o[i*3]=v.x; o[i*3+1]=v.y; o[i*3+2]=v.z;
  }
  for(let i=0;i<N;i++)pos.setXYZ(i,saved[i][0],saved[i][1],saved[i][2]);
  pos.needsUpdate=true;
  return o;
}
const dist=(a,b,i)=>Math.hypot(a[i*3]-b[i*3],a[i*3+1]-b[i*3+1],a[i*3+2]-b[i*3+2]);
const stats=(arr)=>{ const s=arr.slice().sort((x,y)=>x-y);
  return {mean:+(arr.reduce((p,c)=>p+c,0)/arr.length).toFixed(3),
          p50:+s[Math.floor(s.length*0.5)].toFixed(3),
          p95:+s[Math.floor(s.length*0.95)].toFixed(3),
          max:+s[s.length-1].toFixed(3)}; };
/* triangle health on the faces the morph touches: area change and normal flips */
const idx=g.index;
const morphSet=new Set(morphRows);
const faces=[];
for(let f=0;f<idx.count;f+=3){ const a=idx.getX(f),b=idx.getX(f+1),c=idx.getX(f+2);
  if(morphSet.has(a)||morphSet.has(b)||morphSet.has(c))faces.push([a,b,c]); }
out.morphFaces=faces.length;
function faceGeom(P){ const A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3(),
    u=new THREE.Vector3(),v=new THREE.Vector3(),n=new THREE.Vector3(); const res=[];
  for(const [a,b,c] of faces){
    A.set(P[a*3],P[a*3+1],P[a*3+2]); B.set(P[b*3],P[b*3+1],P[b*3+2]); C.set(P[c*3],P[c*3+1],P[c*3+2]);
    u.subVectors(B,A); v.subVectors(C,A); n.crossVectors(u,v);
    res.push({area:n.length()*0.5, n:n.clone().normalize()});
  } return res; }

setClip('approved_idle',0); proceduralGlide();
const A0=skinAll(0), A1=skinAll(1);
const fA0=faceGeom(A0), fA1=faceGeom(A1);
setClip('flight_glide',0);
const C1=skinAll(1);
const fC1=faceGeom(C1);
setClip('approved_idle',0);
const REST0=skinAll(0);

const dA=morphRows.map(i=>dist(A0,A1,i));                    // what the morph moves, procedurally posed
const dA0C=morphRows.map(i=>dist(A0,C1,i));                  // procedural w0 vs the authored flight pose
const dA1C=morphRows.map(i=>dist(A1,C1,i));                  // procedural w1 vs the authored flight pose
out.morphTravelUnderProceduralGlide=stats(dA);
out.proceduralW0_vs_authoredFlight=stats(dA0C);
out.proceduralW1_vs_authoredFlight=stats(dA1C);
const flips=(f1,f2)=>f1.reduce((n,t,i)=>n+(t.n.dot(f2[i].n)<0?1:0),0);
const collapse=(f1,f2)=>f1.reduce((n,t,i)=>n+((f2[i].area>0?t.area/f2[i].area:99)<0.25?1:0),0);
out.faceNormalFlips={ w0_vs_w1:flips(fA0,fA1), w0_vs_authored:flips(fA0,fC1), w1_vs_authored:flips(fA1,fC1) };
out.faceCollapse   ={ w0_vs_authored:collapse(fA0,fC1), w1_vs_authored:collapse(fA1,fC1) };
/* wing extent, as a plain silhouette read */
const span=(P)=>{ let mn=1e9,mx=-1e9; for(const i of morphRows){ const x=P[i*3]; if(x<mn)mn=x; if(x>mx)mx=x; } return +(mx-mn).toFixed(2); };
out.wingSpanUnits={ rest_w0:span(REST0), procGlide_w0:span(A0), procGlide_w1:span(A1), authoredGlide_w1:span(C1) };

if(JSONOUT){ console.log(JSON.stringify(out,null,2)); }
else {
  console.log('BIRDCLIPS  '+out.glb);
  console.log('  '+out.joints+' joints, '+out.bones+' of '+out.rigOwns+' rigCommit bones resolved, morph rows '+out.morphRows+', faces touched '+out.morphFaces);
  console.log('  clip                 dur      tracks joints wTrk weights        joints rigCommit also writes');
  for(const r of out.clips) console.log('  '+r.clip.padEnd(20)+String(r.dur).padEnd(9)+
    String(r.tracks).padEnd(7)+String(r.joints).padEnd(7)+String(r.weightTracks).padEnd(5)+
    JSON.stringify(r.weights).padEnd(15)+r.contested);
  console.log('\n  THE MORPH UNDER A PROCEDURAL GLIDE POSE (source-render units, 532 rows)');
  console.log('    the morph moves them              '+JSON.stringify(out.morphTravelUnderProceduralGlide));
  console.log('    procedural w0 vs authored flight  '+JSON.stringify(out.proceduralW0_vs_authoredFlight));
  console.log('    procedural w1 vs authored flight  '+JSON.stringify(out.proceduralW1_vs_authoredFlight));
  console.log('    face normal flips                 '+JSON.stringify(out.faceNormalFlips));
  console.log('    faces collapsed under a quarter   '+JSON.stringify(out.faceCollapse));
  console.log('    wing-row x span                   '+JSON.stringify(out.wingSpanUnits));
}
