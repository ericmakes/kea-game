// Engine-independent animation sampler. Nodes must be resolved by glTF node INDEX.
// Apply after any other animation mixer. Stop that mixer from driving these bones.
export function sampleClip(clip, elapsed) {
 const t=clip.loop ? ((elapsed%clip.duration)+clip.duration)%clip.duration : Math.max(0,Math.min(elapsed,clip.duration));
 let a=0;while(a+1<clip.times.length && clip.times[a+1]<=t)a++;
 const b=Math.min(a+1,clip.times.length-1), u=a===b?0:(t-clip.times[a])/(clip.times[b]-clip.times[a]);
 const out={};
 for(const [id,v] of Object.entries(clip.frames[a])) {
  out[id]={};
  for(const [key,x] of Object.entries(v)) {
   let y=clip.frames[b][id][key],value;
   if(key==='rotation') {
    let dot=x.reduce((s,n,i)=>s+n*y[i],0);if(dot<0){y=y.map(n=>-n);dot=-dot;}
    if(dot<.9995){const angle=Math.acos(Math.min(1,dot)),den=Math.sin(angle);value=x.map((n,i)=>(n*Math.sin((1-u)*angle)+y[i]*Math.sin(u*angle))/den);}
    else value=x.map((n,i)=>n*(1-u)+y[i]*u);
    const len=Math.hypot(...value);value=value.map(n=>n/len);
   } else value=x.map((n,i)=>n*(1-u)+y[i]*u);
   out[id][key]=value;
  }
 }
 return out;
}
export function applyPose(pose, resolveNode) {
 for(const [id,trs] of Object.entries(pose)) {
  const n=resolveNode(Number(id));if(!n)throw Error(`Missing glTF node ${id}`);
  n.position.fromArray(trs.translation);n.quaternion.fromArray(trs.rotation);n.scale.fromArray(trs.scale);
 }
}
export function eventsBetween(clip, previous, now) {
 if(now<previous)return [];
 const events=[];const begin=clip.loop?Math.floor(previous/clip.duration):0,end=clip.loop?Math.floor(now/clip.duration):0;
 for(let cycle=begin;cycle<=end;cycle++)for(const e of clip.events){const at=e.time+cycle*clip.duration;if(at>previous&&at<=now)events.push({...e,at});}
 return events;
}
export function createMotionShape(position, normal, correction) {
 const p=Array.from({length:position.count},(_,i)=>[position.getX(i),position.getY(i),position.getZ(i)]);
 const n=Array.from({length:normal.count},(_,i)=>[normal.getX(i),normal.getY(i),normal.getZ(i)]);
 const flat=a=>Array.isArray(a[0])?a.flat():a,dp=flat(correction.deltaPosition),cn=flat(correction.correctedNormal);
 return function apply(wingRestWeight=1){
  const w=Math.max(0,Math.min(1,wingRestWeight));
  correction.indices.forEach((i,k)=>{
   const a=1-(1-w)*correction.wingInfluence[k];
   position.setXYZ(i,...p[i].map((v,j)=>v+a*dp[k*3+j]));
   const v=n[i].map((v,j)=>v*(1-a)+a*cn[k*3+j]),l=Math.hypot(...v);normal.setXYZ(i,...v.map(x=>x/l));
  });position.needsUpdate=true;normal.needsUpdate=true;
 };
}
// Optional Three.js integration: pass your application's THREE namespace.
export function toThreeClips(THREE, data, resolveNode) {
 return data.clips.map(clip=>{
  const tracks=[];
  for(const id of Object.keys(data.nodes)){
   const node=resolveNode(Number(id));if(!node)throw Error(`Missing glTF node ${id}`);
   for(const [key,property,Track] of [['translation','position',THREE.VectorKeyframeTrack],['rotation','quaternion',THREE.QuaternionKeyframeTrack],['scale','scale',THREE.VectorKeyframeTrack]])
    tracks.push(new Track(`${node.uuid}.${property}`,clip.times,clip.frames.flatMap(frame=>frame[id][key])));
  }
  const result=new THREE.AnimationClip(clip.name,clip.duration,tracks);result.userData={events:clip.events,loop:clip.loop,wingRestWeight:clip.wingRestWeight};return result;
 });
}
