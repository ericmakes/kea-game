/* REPLAT P5b — THE BIRD AS AN ASSET: loader and swap.
   Its own module for the same reason materials.mjs and post.mjs are: game.mjs keeps the single
   import the gauntlet's specimen loader asserts, and a look feature must not be able to take the
   game down. If the model does not load, the game keeps its primitive bird and says so.
   IT IS OFF BY DEFAULT. KEABIRD.model is false, so every pinned vantage and every battery still
   sees the bird they were calibrated on. Turn it on with KEABIRD='{"model":true}'. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

/* ---- WHICH PART OF THE BIRD IS THIS VERTEX? — REPLAT P5d ----
   The recolour needs regions and the model has one material for the whole animal, so the regions
   are DERIVED: from which bone owns the vertex, and — where bones cannot tell dorsal from ventral —
   from the vertex normal. The underwing is the case that forces this: coverts and the wing's upper
   surface are weighted to the SAME humerus, and only the normal separates them.
   Computed once on the shared geometry before any bird is cloned. */
const REGION={BODY:0,COVERT:1,FLIGHT:2,BILL:3,FOOT:4,CROWN:5};
function keaRegions(THREE,sk,P,upLocal){
  const g=sk.geometry, nor=g.attributes.normal;
  const J=g.attributes.skinIndex, W=g.attributes.skinWeight;
  const bones=sk.skeleton.bones;
  const kind=bones.map(b=>{ const n=b.name;
    if(/Mandible|Bone047/.test(n))return 'bill';
    if(/Finger|Tarsus|Leg_/.test(n))return 'foot';
    if(/Metacarpus|Ulna/.test(n))return 'far';      // distal wing: flight feathers
    if(/Humerus/.test(n))return 'near';             // proximal wing: coverts territory
    if(/_Head_|Neck/.test(n))return 'crown';
    return 'body'; });
  const col=(h)=>new THREE.Color(h).convertSRGBToLinear();
  const C={body:col(P.body),crown:col(P.crown),covert:col(P.covert),flight:col(P.flight),
           bill:col(P.bill),foot:col(P.foot)};
  /* A PER-VERTEX TINT, BLENDED BY BONE WEIGHT — not a winner-take-all region id.
     The first cut picked the dominant bone and wrote an integer region, and every boundary where
     two bones share a vertex about equally flickered between two palette entries from one vertex to
     the next. On the throat, where neck, head and body all meet, that photographed as a RAINBOW
     COLLAR. Blending by the same weights the skin already uses makes the boundaries as smooth as
     the deformation is, and costs nothing at runtime because it is baked here. */
  const out=new Float32Array(g.attributes.position.count*3);
  const up=upLocal;                       // the bird's UP, expressed in this mesh's local space
  const hist={};
  for(let v=0;v<g.attributes.position.count;v++){
    let r=0,gr=0,b2=0,tot=0;
    /* WHICH WAY THIS VERTEX FACES, IN THE BIRD'S OWN FRAME. The covert test used nor.getY(v) — the
       normal's local Y — and this model is yawed about 45 degrees with a rotated mesh space, so
       "local down" is not "down" and the test selected the wrong half of the wing: the scarlet came
       out on the OUTSIDE of a folded wing, where a kea has none. Dotted against the measured up
       vector instead. */
    const nd = nor.getX(v)*up.x + nor.getY(v)*up.y + nor.getZ(v)*up.z;
    for(let k=0;k<4;k++){
      const w=W.getComponent(v,k); if(w<=0)continue;
      const t=kind[J.getComponent(v,k)]||'body';
      let c;
      /* THE COVERTS AND THE BARRED UNDERSIDE ARE NOT BAKED INTO THE TINT ANY MORE. Both live under
         a folded wing on a real kea, so both are carried as MASKS and gated on wing-open in the
         shader. What is baked here is what the bird looks like with the wing SHUT. */
      if(t==='near')      c = C.body;
      else if(t==='far')  c = C.body;
      else if(t==='bill') c = C.bill;
      else if(t==='foot') c = C.foot;
      else if(t==='crown')c = C.crown;
      else                c = C.body;
      r+=c.r*w; gr+=c.g*w; b2+=c.b*w; tot+=w;
      hist[t]=(hist[t]||0)+w;
    }
    if(tot<=0){ r=C.body.r; gr=C.body.g; b2=C.body.b; tot=1; }
    out[v*3]=r/tot; out[v*3+1]=gr/tot; out[v*3+2]=b2/tot;
  }
  g.setAttribute('aKeaTint',new THREE.BufferAttribute(out,3));
  /* THE TWO WING MASKS. Both are strictly VENTRAL — a kea shows neither from above, and the first
     pass leaked scarlet onto the outside of a folded wing by testing at -0.15 in the wrong space.
     -0.35 is deliberately tighter than the geometry needs: a folded wing curls its coverts outward,
     so a loose threshold catches feathers that will face the camera when the wing shuts. */
  const cm=new Float32Array(g.attributes.position.count);
  const fm=new Float32Array(g.attributes.position.count);
  for(let v=0;v<g.attributes.position.count;v++){
    let c2=0,f=0,tot=0;
    const nd = nor.getX(v)*up.x + nor.getY(v)*up.y + nor.getZ(v)*up.z;
    for(let k=0;k<4;k++){ const w=W.getComponent(v,k); if(w<=0)continue;
      const t=kind[J.getComponent(v,k)];
      if(t==='near' && nd < -0.35) c2+=w;
      if(t==='far'  && nd < -0.35) f+=w;
      tot+=w; }
    cm[v]=tot>0?c2/tot:0; fm[v]=tot>0?f/tot:0;
  }
  g.setAttribute('aKeaCovert',new THREE.BufferAttribute(cm,1));
  g.setAttribute('aKeaFlight',new THREE.BufferAttribute(fm,1));
  for(const k in hist)hist[k]=Math.round(hist[k]);
  return hist;
}

/* ---- THE RECOLOUR, as a shader term on the model's own material ----
   Same idiom as P3's paint mode: the texture supplies DETAIL through its luminance and the palette
   supplies HUE, so the source's silky feather shading survives the change of species instead of
   being replaced by a flat decal. The flight feathers additionally get procedural barring, because
   a black cockatoo's texture has none and a kea's underwing is unmistakable without it. */
function keaRecolour(THREE,mat,P){
  const U={
    uCov :{value:new THREE.Color(P.covert).convertSRGBToLinear()},
    uFli :{value:new THREE.Color(P.flight).convertSRGBToLinear()},
    uBar :{value:new THREE.Color(P.bar).convertSRGBToLinear()},
    uBarN:{value:P.barN}, uBarW:{value:P.barW}, uMean:{value:P.mean},
    uDetail:{value:P.detail}, uShLo:{value:P.shadeLo}, uShHi:{value:P.shadeHi},
    uOpen:{value:0},
  };
  mat.userData.keaU=U;
  mat.onBeforeCompile=(sh)=>{
    Object.assign(sh.uniforms,U);
    sh.vertexShader='attribute vec3 aKeaTint;\nattribute float aKeaFlight;\nattribute float aKeaCovert;\n'+
      'varying vec3 vKeaTint;\nvarying float vKeaFl;\nvarying float vKeaCv;\nvarying vec3 vKeaLocal;\n'+
      sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n\tvKeaTint=aKeaTint;\n\tvKeaFl=aKeaFlight;\n'+
        '\tvKeaCv=aKeaCovert;\n\tvKeaLocal=position;');
    sh.fragmentShader='uniform vec3 uCov,uFli,uBar;\nuniform float uBarN,uBarW,uMean,uDetail,uShLo,uShHi,uOpen;\n'+
      'varying vec3 vKeaTint;\nvarying float vKeaFl;\nvarying float vKeaCv;\nvarying vec3 vKeaLocal;\n'+
      sh.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      {
        vec3 c = vKeaTint;
        /* NOTHING RED UNTIL THE WING OPENS. uOpen is driven from the wing's own open state every
           frame, so a perched kea is olive all over and the colour is a thing it DOES rather than a
           thing it wears. */
        c = mix(c, uCov, vKeaCv*uOpen);
        float fl = vKeaFl*uOpen;
        if(fl>0.004){
          vec3 f = uFli;
          float t=fract(vKeaLocal.z*uBarN);
          f = mix(f, uBar, step(1.0-uBarW,t));
          c = mix(c, f, fl);
        }
        /* THE SHADING IS CENTRED ON 1, NOT CLAMPED FROM BELOW. A black cockatoo's texels sit far
           under the mean, so a floor-clamped ratio put the whole bird on its floor and dimmed the
           palette to mud. Centring keeps the mean texel at exactly the palette colour and lets the
           source's feather shading modulate around it. */
        float lum=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
        float shade=1.0+(lum/max(uMean,1e-3)-1.0)*uDetail;
        diffuseColor.rgb = c * clamp(shade,uShLo,uShHi);
      }`);
  };
  mat.needsUpdate=true;
}

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
    /* EVALUATE THE CLIP AT THE FOLDED FRAME AND MAKE THAT THE REST. Done before anything is
       measured or bound, so the scale box, the ground offset and every bone rest all describe the
       perched bird rather than the spread bind pose. The mixer is used once and dropped — nothing
       animates at runtime; the game poses this skeleton itself. */
    if(gltf.animations&&gltf.animations.length&&B.restT>0){
      const mx=new THREE.AnimationMixer(root);
      mx.clipAction(gltf.animations[0]).play();
      mx.setTime(Math.min(B.restT,gltf.animations[0].duration));
      /* NO stopAllAction() HERE — it resets every track and puts the bind pose straight back, which
         is exactly what the first cut did: the clip was evaluated, then thrown away, and the box
         came back byte-identical to the spread pose. The mixer is simply dropped; the bones keep
         the values it wrote. */
      root.updateMatrixWorld(true);
    }
    root.updateMatrixWorld(true);
    /* REGIONS AND RECOLOUR, once per bird because SkeletonUtils.clone gives each its own geometry
       reference — cheap either way, and it keeps the material per-bird so a future variant strip
       can tint two birds differently. */
    if(B.plume){
      /* the bird's UP, carried into the mesh's own local space, because that is the space the
         geometry normals live in */
      sk.updateWorldMatrix(true,false);
      const inv=new THREE.Matrix4().copy(sk.matrixWorld).invert();
      const upLocal=new THREE.Vector3(0,1,0).transformDirection(inv).normalize();
      const hist=keaRegions(THREE,sk,B.plume,upLocal);
      K.G.bird.regions=hist;
      /* THE TEXTURE'S MEAN LUMINANCE IS MEASURED, not typed: the palette divides by it, so a
         guessed value would silently darken or blow out the whole bird. Sampled off the decoded
         image the loader already has. */
      const m=sk.material;
      if(m.map&&m.map.image&&!B._meanDone){
        try{
          const im=m.map.image, cv=document.createElement('canvas');
          const W2=Math.min(128,im.width||128), H2=Math.min(128,im.height||128);
          cv.width=W2; cv.height=H2;
          const cx=cv.getContext('2d',{willReadFrequently:true});
          cx.drawImage(im,0,0,W2,H2);
          const d=cx.getImageData(0,0,W2,H2).data;
          let sum=0,n=0;
          for(let i=0;i<d.length;i+=4){ if(d[i+3]<8)continue;
            sum+=(0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2])/255; n++; }
          if(n>0){ B.plume.mean=+(sum/n).toFixed(4); B._meanDone=true;
            K.G.bird.texMean=B.plume.mean; }
        }catch(e){ K.G.bird.texMeanWhy=String(e&&e.message||e); }
      }
      keaRecolour(THREE,m,B.plume);
    }
    const frame=K.keaBirdFrame(THREE,bones);
    /* THE MODEL IS YAWED. Undo the measured bird frame so the asset faces the way the game's whole
       codebase already assumes — "body front is local -z", which the flight and tug code both
       depend on. Derived from the skeleton, never a typed-in 45 degrees. */
    const yaw=new THREE.Object3D();
    yaw.quaternion.copy(frame.quat).invert();
    /* SCALE AND GROUND ARE MEASURED OFF THIS MESH, NOT OFF A CONSTANT — REPLAT P5d.
       They used to come from KEABIRD.posedUnits, a number taken from the model as downloaded. Then
       P5d deleted the crest, which was 70% of the vertices AND the tallest part of the bird, and
       that constant was instantly wrong: the bird came out 0.30 m tall and floating 186 mm. A
       recorded measurement of a mesh that can be edited is a trap, so the box is measured HERE,
       after the edit, every time. posedUnits stays in the recipe as the reading for the unmodified
       file and is asserted against this, so the two cannot silently disagree.
       THE FEET ARE PUT ON THE GROUND BY THE SAME MEASUREMENT. The model's lowest vertex is not at
       its origin, which is where the 77 mm float came from. */
    const gScale=0.7*(kea.size||1);
    yaw.add(root);
    yaw.scale.setScalar(1); yaw.position.set(0,0,0);
    yaw.updateMatrixWorld(true);
    const bb=new THREE.Box3().setFromObject(root);
    const posed=Math.max(1e-6, bb.max.y-bb.min.y);
    const s=(B.standM/posed)/gScale;
    yaw.scale.setScalar(s);
    /* lift so the lowest vertex lands on y=0 in the bird's own group */
    yaw.position.y = -bb.min.y * s;
    kea.g.add(yaw);
    /* the fold, measured rather than assumed — the number the recipe's restT was chosen from */
    { const a=new THREE.Vector3().setFromMatrixPosition(bones.metaL.matrixWorld);
      const c=new THREE.Vector3().setFromMatrixPosition(bones.metaR.matrixWorld);
      K.G.bird.wingSpanUnits=+a.distanceTo(c).toFixed(1); }
    kea._model={root,sk,yaw,bones,frame,
      rig:K.keaRigBind(THREE,bones,frame),
      posScale:1/s, posedUnits:+posed.toFixed(2), scale:s, groundLift:+(-bb.min.y*s).toFixed(4)};
    K.G.bird.posedUnits=+posed.toFixed(2);
    K.G.bird.scale=+s.toFixed(6);
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
