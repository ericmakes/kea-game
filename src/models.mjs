/* REPLAT P6A — THE MODEL TIER: the half of the prop seam that loads a GLB.

   Its own module for the same reasons materials.mjs, post.mjs and bird.mjs are: game.mjs keeps the
   single `three` import the gauntlet's specimen loader asserts, and a look feature must not be able
   to take the game down. Every prop whose registry entry says source:'model' is loaded here, after
   boot; anything that fails keeps its primitive body and says why in G.models.

   IT IS OFF BY DEFAULT, because no entry ships as source:'model'. Turn one on without a rebuild:
       KEAPROPS='{"bench":{"source":"model","url":"models/placeholder_box.glb"}}'
   and turn it back off by removing it. The registry is what decides; this file only does what the
   registry says.

   ---- WHAT THIS FILE IS NOT ALLOWED TO TOUCH ----
   Colliders and anchors. Both are declared in the entry and emitted by placeProp at build time,
   before this module has run at all, and nothing below reaches for either. That is the guarantee
   P6A.md asks for stated as a property of the code rather than as a promise: a model cannot change
   what the bird can perch on or where a mission attaches, because the code that installs models
   has no reference to the arrays that decide those things. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { maskCutouts } from './alphamode.mjs';
import { loadVehicles, buildVehicle } from './vehicles.mjs';
const ALPHASEEN=new Map();

/* ONE FETCH PER URL, however many props share it — four wheelie bins are one download. Keyed on
   the resolved url, and the PROMISE is cached rather than the result, so two props asking at the
   same time do not race into two requests. */
const CACHE=new Map();
function loadGLB(url){
  if(!CACHE.has(url))CACHE.set(url,new Promise((res,rej)=>new GLTFLoader().load(url,res,undefined,rej)));
  return CACHE.get(url);
}

/* ---- NORMALISATION: BRING THE FILE TO THIS GAME'S UNITS AND ORIENTATION ----
   Measured, never typed, and the bird's own note says why at length: a recorded number describing
   an asset that can be re-exported is a trap. So the box is measured HERE, on the clone that is
   about to be used, every time.
     fit.standM  the size the prop should occupy along fit.axis, in game metres. null = trust the file.
     fit.axis    which of the model's own axes standM measures. 'y' unless the exporter was odd.
     fit.ry      a yaw correction, in radians, for an asset that arrives facing the wrong way.
     fit.ground  lift so the lowest vertex lands on the prop's own y=0.
     fit.size    [x,y,z] game metres for the measured box AFTER the yaw, one scale per axis — for a model
                 whose proportions differ from the collider it must agree with (SPIKE_ADOPT 11: Poly Haven's
                 picnic table is 2.92 m long at a 0.75 m top; the game's is 2.4 m at 0.85, and its handbag,
                 sandwich and the bird's perch all sit on that top). Overrides standM. The scale is applied
                 OUTSIDE the yaw, so x/y/z mean the game's axes, not the file's. */
function normalise(root,fit){
  const yaw=new THREE.Object3D();
  yaw.add(root);
  if(fit.ry)yaw.rotation.y=fit.ry;
  yaw.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3(); bb.getSize(size);
  if(fit.size){
    const outer=new THREE.Object3D(); outer.add(yaw);
    const sv=fit.size.map((m,i)=>m/Math.max(1e-6,size.getComponent(i)));
    outer.scale.set(sv[0],sv[1],sv[2]);
    /* centred on the prop's origin in x/z, as the collider is; the lift in the unscaled box, then scaled */
    const c=new THREE.Vector3(); bb.getCenter(c);
    yaw.position.set(-c.x,fit.ground?-bb.min.y:0,-c.z);
    return {yaw:outer,scale:sv[1],scales:sv.map(v=>+v.toFixed(5)),measured:+size.y.toFixed(4),
            lift:+(fit.ground?-bb.min.y*sv[1]:0).toFixed(5),
            size:[+size.x.toFixed(4),+size.y.toFixed(4),+size.z.toFixed(4)]};
  }
  const measured=Math.max(1e-6,fit.axis==='x'?size.x:(fit.axis==='z'?size.z:size.y));
  const s=fit.standM?(fit.standM/measured):1;
  yaw.scale.setScalar(s);
  /* THE LIFT IS COMPUTED FROM THE UNSCALED BOX AND THEN SCALED, because bb was measured before
     the scale was applied — the same order the bird uses, and getting it the other way round is
     how a model ends up floating by exactly its own scale factor. */
  if(fit.ground)yaw.position.y=-bb.min.y*s;
  return {yaw,scale:s,measured:+measured.toFixed(4),
          lift:+(fit.ground?-bb.min.y*s:0).toFixed(5),
          size:[+size.x.toFixed(4),+size.y.toFixed(4),+size.z.toFixed(4)]};
}

/* ---- MATERIAL POLICY ----
   `keepModelPBR:true` leaves the asset wearing its own maps, which is the whole reason to want a
   real model. `false` strips them and paints the mesh in the entry's declared `material.color` —
   the escape hatch for a download whose maps are wrong for this game's light, and for a grey-box.
   An entry that asks for the override without declaring a colour keeps the file's own base colour
   and loses only the maps, because inventing a colour here would be a look decision made by a
   loader.
   EITHER WAY THE MATERIALS ARE CLONED PER PROP. GLTFLoader hands every clone of a scene the SAME
   material instance, so tinting one bin at night would tint all four — the SkeletonUtils lesson
   from the bird, met on materials instead of skeletons.
   AND EITHER WAY THE NIGHT POLICY IS APPLIED, which is the column a bare loader drops on the
   floor: nightTint() enrols a material in the day/night colour lerp, and a swapped prop that is
   not enrolled stays lit at midnight while the primitive beside it goes dark. */
function dress(root,entry,K){
  const pol=entry.material||{}, out={materials:0,tinted:0,overridden:0};
  root.traverse(o=>{
    if(!o.isMesh||!o.material)return;
    const list=Array.isArray(o.material)?o.material:[o.material];
    const cloned=list.map(m=>{
      const c=m.clone(); out.materials++;
      if(!pol.keepModelPBR){
        c.map=null; c.normalMap=null; c.roughnessMap=null; c.metalnessMap=null; c.aoMap=null;
        if(pol.color!==null&&pol.color!==undefined)
          c.color.copy(new THREE.Color(pol.color));
        c.needsUpdate=true; out.overridden++;
      }
      if(pol.nightTint&&K.nightTint){ K.nightTint(c); out.tinted++; }
      return c;
    });
    o.material=Array.isArray(o.material)?cloned:cloned[0];
    if(!K.G.headless){ o.castShadow=true; o.receiveShadow=true; }
  });
  return out;
}

export async function installModels(K){
  const reg=(K.G.propReg||[]).filter(p=>p.source==='model');
  K.G.models={mode:reg.length?'loading':'none',want:reg.length,swapped:[],failed:[],detail:{}};
  if(!reg.length){ K.G.models.mode='none'; return K.G.models; }
  /* SPIKE_ADOPT 1: TRAFFIC WEARS THE SPIKE'S HATCH TOO. Traffic is spawned mid-run and has no registry
     row, so the dress is a hook mkCar calls; cars already on the road when the file lands are dressed
     here. The primitive body is hidden, the wipers and aerial (added after it) stay. */
  if(reg.some(p=>p.entry.vehicle)){
    try{ const V=await loadVehicles(reg.find(p=>p.entry.vehicle).entry.url);
      const TRAFFICPAINT=[0x24476b,0xe9e8e3,0xe0a91c,0x6b3f72,0x5d646b];
      K.G.vehicleDress=(car,type,color)=>{ if(car.vehicleModel)return;
        const v=buildVehicle(V,{node:type==='ute'?'ute':'hatch', paint:TRAFFICPAINT[Math.abs(Math.round((car.x||0)*7+(car.z||0)))%TRAFFICPAINT.length]});
        for(const o of car.body||[])o.visible=false;
        car.g.add(v); car.vehicleModel=v; };
      for(const c of K.G.cars||[]) if(c.traffic) K.G.vehicleDress(c,c.type,null);
    }catch(e){ console.error('models: traffic stays primitive —',e); }
  }
  for(const p of reg){
    const url=p.entry.url;
    if(p.entry.vehicle){
      try{ const V=await loadVehicles(url); const v=buildVehicle(V,p.entry.vehicle);
        for(const o of p.body)if(!o.userData.keepWithModel)o.visible=false;   // a mission object (the DOC crate) stays
        /* on the DRAWN ground (SPIKE_ADOPT 2): the carpark's cars carry the seal in their placement y;
           anywhere else the plane's relief under the wheels is taken here */
        const lift=K.drawnGroundAt?K.drawnGroundAt(p.at.x,p.at.z)-(p.at.y||0):0;
        v.position.y=lift/(p.at.scale||1);
        p.group.add(v);
        p.model={root:v,yaw:v,url,scale:1,lift:+lift.toFixed(4),measured:null}; p.mode='model';
        K.G.models.swapped.push(p.id);
        K.G.models.detail[p.id]={url,vehicle:p.entry.vehicle.node,hidden:p.body.length,
          colliders:p.colliders.length,anchors:Object.keys(p.entry.anchors).length};
      }catch(e){ K.G.models.failed.push({id:p.id,url,why:String(e&&e.message||e)}); for(const o of p.body)o.visible=true;
        console.error('models: '+p.id+' vehicle did not build, staying on the primitive —',e); }
      continue;
    }
    let gltf;
    try{ gltf=await loadGLB(url); }
    catch(e){
      /* A LOOK FEATURE MUST NOT BE ABLE TO TAKE THE GAME DOWN. The primitive body was built at
         build time and is still standing; all that is lost is the swap, and the reason is on the
         record rather than in a stack trace nobody reads. */
      K.G.models.failed.push({id:p.id,url,why:String(e&&e.message||e)});
      console.error('models: '+p.id+' did not load, staying on the primitive —',e);
      continue;
    }
    /* THE SAME ALPHA RULE AS THE BIRD (src/alphamode.mjs): a BLEND material over a measured cutout
       is drawn as a MASK. On the shared gltf.scene, before the clone, so every copy inherits it. */
    const alpha=maskCutouts(gltf.scene, ALPHASEEN);
    try{
      const root=gltf.scene.clone(true);
      const n=normalise(root,p.entry.fit);
      const mat=dress(root,p.entry,K);
      /* THE PRIMITIVE IS HIDDEN, NOT DELETED. It cost nothing more to keep, it is what a
         later flip back to 'primitive' needs, and a deleted body would take the seeded stream's
         evidence with it. Visibility only — the meshes stay in the group and stay measurable. */
      for(const o of p.body)if(!o.userData.keepWithModel)o.visible=false;   // a part flagged keepWithModel stays (the tow shed's roof over generated walls), as the vehicle path already allows
      p.group.add(n.yaw);
      p.model={root,yaw:n.yaw,url,scale:n.scale,lift:n.lift,measured:n.measured};
      p.mode='model';
      /* BOUND PARTS (SPIKE_ADOPT 20, the bin). A mission tweens a PRIMITIVE part (PECK BIN LID turns and lifts the bin's
         lid mesh); with the primitive hidden that motion would play on nothing. entry.bind {field: nodeName} names the
         primitive part (p[field]) and the model's own node that must follow it: each frame, before the node draws, it takes
         the primitive part's rotation and translation as DELTAS from their rest, in the model's units (/ the fit's scale).
         The primitive part keeps driving the mission — colliders, anchors and the tween are untouched; the model follows.
         A named node the file does not have is reported in G.models, never invented. */
      const bound=[];
      for(const [field,name] of Object.entries(p.entry.bind||{})){
        const prim=p[field], node=root.getObjectByName(name);
        if(!prim||!node){ K.G.models.failed.push({id:p.id,url,why:'bind: '+(prim?'the model has no node '+name:'the primitive has no part '+field)}); continue; }
        const P0=prim.position.clone(), R0=prim.rotation.clone(), N0=node.position.clone(), NR0=node.rotation.clone(), sc=n.scale||1;
        const follow=()=>{ node.position.set(N0.x+(prim.position.x-P0.x)/sc, N0.y+(prim.position.y-P0.y)/sc, N0.z+(prim.position.z-P0.z)/sc);
          node.rotation.set(NR0.x+prim.rotation.x-R0.x, NR0.y+prim.rotation.y-R0.y, NR0.z+prim.rotation.z-R0.z); node.updateMatrixWorld(true); };
        node.traverse(o=>{ if(o.isMesh){ const was=o.onBeforeRender; o.onBeforeRender=function(...a){ follow(); return was&&was.apply(this,a); }; } });
        bound.push(field+'->'+name); }
      K.G.models.swapped.push(p.id);
      K.G.models.detail[p.id]={url,alpha,scale:+n.scale.toFixed(6),...(n.scales?{scales:n.scales}:{}),lift:n.lift,measured:n.measured,
                               modelSize:n.size,materials:mat.materials,
                               tinted:mat.tinted,overridden:mat.overridden,
                               hidden:p.body.length,colliders:p.colliders.length,
                               anchors:Object.keys(p.entry.anchors).length,bound};
    }catch(e){
      K.G.models.failed.push({id:p.id,url,why:'attach: '+String(e&&e.message||e)});
      for(const o of p.body)o.visible=true;
      console.error('models: '+p.id+' loaded but did not attach, staying on the primitive —',e);
    }
  }
  K.G.models.mode=K.G.models.swapped.length?'model':'primitive';
  /* AND THE STATE BLOCK IS REBUILT, not patched — the same rule G.mats and G.propsState follow. */
  if(K.propsState)K.G.propsState=K.propsState();
  return K.G.models;
}

/* ---- THE OTHER DIRECTION ----
   P6A.md: "A registry that can only go one way is half a seam." The shipped way back is to remove
   the entry's `source:'model'` and rebuild the world, which is what flipping KEAPROPS off does.
   This is the way back WITHOUT a rebuild, for a battery, a variant strip, or an A/B frame pair:
   the model comes off, the primitive body comes back, and the collider and anchors were never
   touched by either direction so there is nothing to restore. */
export function revertProp(K,id){
  const p=(K.G.propReg||[]).find(q=>q.id===id);
  if(!p||p.mode!=='model')return false;
  p.group.remove(p.model.yaw);
  for(const o of p.body)o.visible=true;
  p.mode='primitive'; p.model=null;
  const M=K.G.models; if(M){ M.swapped=M.swapped.filter(s=>s!==id); delete M.detail[id];
    M.mode=M.swapped.length?'model':'primitive'; }
  if(K.propsState)K.G.propsState=K.propsState();
  return true;
}
