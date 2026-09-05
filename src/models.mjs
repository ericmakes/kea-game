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
     fit.ground  lift so the lowest vertex lands on the prop's own y=0. */
function normalise(root,fit){
  const yaw=new THREE.Object3D();
  yaw.add(root);
  if(fit.ry)yaw.rotation.y=fit.ry;
  yaw.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(root);
  const size=new THREE.Vector3(); bb.getSize(size);
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
          c.color.copy(new THREE.Color(pol.color).convertSRGBToLinear());
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
  for(const p of reg){
    const url=p.entry.url;
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
    try{
      const root=gltf.scene.clone(true);
      const n=normalise(root,p.entry.fit);
      const mat=dress(root,p.entry,K);
      /* THE PRIMITIVE IS HIDDEN, NOT DELETED. It cost nothing more to keep, it is what a
         later flip back to 'primitive' needs, and a deleted body would take the seeded stream's
         evidence with it. Visibility only — the meshes stay in the group and stay measurable. */
      for(const o of p.body)o.visible=false;
      p.group.add(n.yaw);
      p.model={root,yaw:n.yaw,url,scale:n.scale,lift:n.lift,measured:n.measured};
      p.mode='model';
      K.G.models.swapped.push(p.id);
      K.G.models.detail[p.id]={url,scale:+n.scale.toFixed(6),lift:n.lift,measured:n.measured,
                               modelSize:n.size,materials:mat.materials,
                               tinted:mat.tinted,overridden:mat.overridden,
                               hidden:p.body.length,colliders:p.colliders.length,
                               anchors:Object.keys(p.entry.anchors).length};
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
