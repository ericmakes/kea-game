import fs from 'node:fs';import {sampleClip,createMotionShape,eventsBetween} from '../kea-motion-player.mjs';
const root=new URL('../',import.meta.url),data=JSON.parse(fs.readFileSync(new URL('kea_motion_clips.json',root)));let count=0;
for(const c of data.clips)for(let i=0;i<c.times.length;i++){
 const pose=sampleClip(c,c.times[i]);const expected=c.loop&&i===c.times.length-1?c.frames[0]:c.frames[i];
 for(const id of Object.keys(pose))for(const k of Object.keys(pose[id])){
 const x=pose[id][k], y=expected[id][k];const sign=k==='rotation'&&x.reduce((v,a,j)=>v+a*y[j],0)<0?-1:1;
 for(let j=0;j<x.length;j++)if(Math.abs(x[j]-sign*y[j])>2e-7)throw Error(`Keyframe mismatch ${c.name} ${i} ${id} ${k}`);
 }count++;
}
const tear=data.clips.find(c=>c.name==='beak_tear');const events=eventsBetween(tear,-1,tear.duration);
if(events.map(e=>e.name).join(',')!=='beak_grip,beak_regrip,beak_regrip,tear_impulse,beak_release')throw Error('Interaction events lost');
fs.writeFileSync(new URL('RUNTIME_VALIDATION.json',root),JSON.stringify({keyframesChecked:count,allMatchedWithin:2e-7,tearEvents:events},null,2));
console.log('PASS',count,'keyframes; five interaction events');
