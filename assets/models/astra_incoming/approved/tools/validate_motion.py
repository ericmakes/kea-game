from pathlib import Path
import sys,json,hashlib,numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent));from render_cached import GLB
D=Path(__file__).resolve().parents[1];lock=json.loads((D/'APPROVED_CHARACTER_LOCK.json').read_text());assert all(hashlib.sha256((D/'model'/n).read_bytes()).hexdigest()==s for n,s in lock['files'].items());data=json.loads((D/'kea_motion_clips.json').read_text());g=GLB(D/'model/kea_reference_shape.glb');w,trs=g.matrices(3.5);report={'approvedFilesHashChecks':'PASS','geometrySculpted':False,'rigDefinitionsModified':False,'clips':[]}
for clip in data['clips']:
 errors=[];scales=[];q=[]
 for t,frame in zip(clip['times'],clip['frames']):
  ov={data['nodes'][i]:v for i,v in frame.items()};ww,_=g.matrices(3.5,ov);q.append([v['rotation']for v in frame.values()]);scales.extend([np.max(abs(np.array(v['scale'])-trs[int(i)]['scale']))for i,v in frame.items()])
  for ankle,offset in [(15,0),(31,.5)]:
   if clip['name'] in ['walk_loop','carry_walk'] and (t/clip['duration']+offset)%1<.62:
    target=w[ankle,:3,3].copy();target[2]+=3-6*((t/clip['duration']+offset)%1)/.62
    errors.append(float(np.linalg.norm(ww[ankle,:3,3]-target)))
   if clip['name'] in ['beak_tear','watch_idle','carry_idle']:errors.append(float(np.linalg.norm(ww[ankle,:3,3]-w[ankle,:3,3])))
 q=np.array(q);q/=np.linalg.norm(q,axis=-1,keepdims=True);steps=np.rad2deg(2*np.arccos(np.clip(abs((q[1:]*q[:-1]).sum(-1)),-1,1)))
 report['clips'].append({'name':clip['name'],'duration':clip['duration'],'frameCount':len(clip['frames']),'exactLoopEndpoints':clip['frames'][0]==clip['frames'][-1]if clip['loop']else None,'allFinite':bool(np.isfinite(q).all()),'maxAnimatedScaleDeviation':float(max(scales)),'maximumRotationStepDegreesAt30fps':float(steps.max()),'maximumPlantedFootErrorSourceCoordinates':float(max(errors))if errors else None})
 assert max(scales)==0
 assert np.isfinite(q).all()
 if errors:assert max(errors)<1e-4, (clip['name'],max(errors))
 if clip['loop']:assert clip['frames'][0]==clip['frames'][-1]
report['scope']='Lock hashes, original-data preservation (separate report), sampled rotations/scales/foot constraints. Not an exhaustive animation collision test or live-game test.'
prop=GLB(D/'paper_tear_demo.glb');report['paperPropHasSkin']=bool(prop.j.get('skins')or any('skin'in n for n in prop.j['nodes']));assert not report['paperPropHasSkin'];report['paperTriangleCount']=sum(len(prop.acc(p['indices']).ravel())//3 for m in prop.j['meshes']for p in m['primitives']);(D/'MOTION_VALIDATION.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
