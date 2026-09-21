from pathlib import Path
import sys,json,numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent));from render_cached import GLB
D=Path(__file__).resolve().parents[1];previous=Path(sys.argv[1]) if len(sys.argv)>1 else D.parents[1]/'kea_ground_revision/baseline/kea_animated.glb'
a=GLB(previous);b=GLB(D/'kea_animated.glb');original=GLB(D/'model/kea_reference_shape.glb')
protected=['nodes','skins','meshes','materials','textures','images']
assert all(a.j[k]==b.j[k] for k in protected)
ids=set(range(len(original.j['accessors'])))
for m in b.j['meshes']:
 for p in m['primitives']:
  ids.update(p['attributes'].values());ids.add(p['indices'])
  for target in p.get('targets',[]):ids.update(target.values())
assert all(a.acc(i).tobytes()==b.acc(i).tobytes() for i in ids)
for name in ['Animation_01','approved_idle','flight_loop','flight_glide','flight_bank_left','flight_bank_right']:
 aa=next(x for x in a.j['animations'] if x['name']==name);bb=next(x for x in b.j['animations'] if x['name']==name)
 assert len(aa['channels'])==len(bb['channels'])
 for x,y in zip(aa['channels'],bb['channels']):
  assert x['target']==y['target'];sa=aa['samplers'][x['sampler']];sb=bb['samplers'][y['sampler']]
  for k in ['input','output']:assert a.acc(sa[k]).tobytes()==b.acc(sb[k]).tobytes(),name
animations={x['name']:x for x in b.j['animations']};data=json.loads((D/'kea_motion_clips.json').read_text());socket=json.loads((D/'BEAK_GRIP.json').read_text());carry=json.loads((D/'CARRY_ATTACHMENT.json').read_text());tip=socket['tipVertex'];node=socket['glTFNodeIndex'];contact=[];carry_error=[];world_error=[]
for clip in data['clips']:
 if clip['name'] not in ['beak_tear','carry_walk','carry_idle']:continue
 b.j['animations']=[animations[clip['name']]]
 for t in clip['times']:
  geo,w=b.geometry(t);bill=geo[0][0][tip];socketpos=(w[node]@np.r_[socket['localPosition'],1])[:3];world_error.append(np.linalg.norm(bill-socketpos))
  if clip['name']=='beak_tear' and 1.05<=t<=2.6:contact.append(bill)
  if clip['name'].startswith('carry_'):
   M=np.array(carry['localMatrixColumnMajor']).reshape(4,4).T
   center=(w[node]@M@np.array([0,.025,0,1]))[:3];expected=(w[node]@np.r_[carry['centerLocalPosition'],1])[:3];carry_error.append(np.linalg.norm(center-expected))
contact=np.array(contact);drift=float(np.linalg.norm(contact-contact[0],axis=1).max());assert drift<1e-4;assert max(carry_error)<1e-8;assert max(world_error)<1e-4
prop=GLB(D/'carry_ball.glb');assert not prop.j.get('skins');assert all('skin' not in n for n in prop.j['nodes']);tri=sum(len(prop.acc(p['indices']).ravel())//3 for m in prop.j['meshes'] for p in m['primitives'])
report={'approvedGeometryAndAllOriginalAccessorBytesExact':True,'protectedJsonSectionsExact':protected,'unchangedExistingClips':['Animation_01','approved_idle','flight_loop','flight_glide','flight_bank_left','flight_bank_right'],'modifiedClips':['walk_loop','beak_tear'],'addedClips':['watch_idle','carry_walk','carry_idle'],'contactHoldMaxTipDriftSourceUnits':drift,'socketToSkinnedTipMaxErrorSourceUnits':float(max(world_error)),'carryPropCenterMaxErrorSourceUnits':float(max(carry_error)),'carryPropRigged':False,'carryPropTriangles':tri,'sourceVideo':'Kea - Iconic New Zealand Alpine Parrot.mp4','referenceRanges':['00:21–24.6','00:32.36–37.28','01:14–21.72','01:26.96–28.9'],'scope':'Sampled contacts and unchanged-data checks, not an exhaustive collision audit or live game test.'}
(D/'GROUND_REVISION_VALIDATION.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
