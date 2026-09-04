/* REPLAT P5b — THE BIRD AS AN ASSET: loader and swap.
   Its own module for the same reason materials.mjs and post.mjs are: game.mjs keeps the single
   import the gauntlet's specimen loader asserts, and a look feature must not be able to take the
   game down. If the model does not load, the game keeps its primitive bird and says so.
   IT IS OFF BY DEFAULT. KEABIRD.model is false, so every pinned vantage and every battery still
   sees the bird they were calibrated on. Turn it on with KEABIRD='{"model":true}'. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export async function installBird(K){
  const B=K.KEABIRD;
  if(!B||!B.model){ K.G.bird={mode:'primitive',why:'KEABIRD.model is off'}; return; }
  let gltf;
  try{
    gltf=await new Promise((res,rej)=>new GLTFLoader().load(B.url,res,undefined,rej));
  }catch(e){
    K.G.bird={mode:'primitive',why:'load failed: '+(e&&e.message||e)};
    console.error('bird: the model did not load, staying on the primitive bird —',e);
    return;
  }
  /* ONE LOAD, MANY BIRDS. SkeletonUtils.clone is the only correct way to copy a SkinnedMesh —
     Object3D.clone() shares the skeleton, so two birds would pose as one. */
  K.G.bird={mode:'model',url:B.url,birds:0,bones:0};
  const attach=(kea)=>{
    const root=skeletonClone(gltf.scene);
    let sk=null; root.traverse(o=>{ if(o.isSkinnedMesh)sk=o; });
    if(!sk){ K.G.bird={mode:'primitive',why:'no SkinnedMesh in the glb'}; return false; }
    const by={}; sk.skeleton.bones.forEach(b=>by[b.name]=b);
    const bones={}; let missing=[];
    for(const [k,n] of Object.entries(B.bones)){ if(by[n])bones[k]=by[n]; else missing.push(k+'='+n); }
    if(missing.length){ K.G.bird={mode:'primitive',why:'bones missing: '+missing.join(', ')}; return false; }
    root.updateMatrixWorld(true);
    const frame=K.keaBirdFrame(THREE,bones);
    /* THE MODEL IS YAWED. Undo the measured bird frame so the asset faces the way the game's whole
       codebase already assumes — "body front is local -z", which the flight and tug code both
       depend on. Derived from the skeleton, never a typed-in 45 degrees. */
    const yaw=new THREE.Object3D();
    yaw.quaternion.copy(frame.quat).invert();
    /* SCALE IS DERIVED, NOT TYPED: the posed box height against the kea's real standing height,
       divided back out of the group scale the bird already carries. */
    const gScale=0.7*(kea.size||1);
    const s=(B.standM/B.posedUnits)/gScale;
    yaw.scale.setScalar(s);
    yaw.add(root);
    kea.g.add(yaw);
    kea._model={root,sk,yaw,bones,frame,
      rig:K.keaRigBind(THREE,bones,frame),
      posScale:1/s};
    /* the primitive bird stays in the tree as the HANDLE hierarchy — every one of the 80 pose
       writes still lands on it — but its geometry is hidden. Nothing about update() changes. */
    kea.body.visible=false;
    if(kea.shadowM)kea.shadowM.visible=true;
    /* props are carried on the HEAD, so they need the model's head, not the hidden one */
    kea.headAttach=new THREE.Object3D(); bones.head.add(kea.headAttach);
    kea.headAttach.scale.setScalar(1/ (s*gScale) * gScale);   // undo the model scale for props
    K.G.bird.birds++; K.G.bird.bones=Object.keys(bones).length;
    return true;
  };
  K._birdAttach=attach;
  for(const k of (K.G.keas||[]))attach(k);
}
