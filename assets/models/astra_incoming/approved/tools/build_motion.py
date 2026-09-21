from pathlib import Path
import sys,json,copy,hashlib,math
import numpy as np
from scipy.spatial.transform import Rotation as R
sys.path.insert(0,str(Path(__file__).resolve().parent))
import render_cached as rc
OUT=Path(__file__).resolve().parents[1]; OUT.mkdir(exist_ok=True)
g=rc.GLB(str(Path(__file__).resolve().parents[1]/'model/kea_reference_shape.glb')); world,base=g.matrices(3.5)
nodes=g.j['nodes']; joints=g.j['skins'][0]['joints'];parents={c:i for i,n in enumerate(nodes) for c in n.get('children',[])}
# User-approved head tilt is retained. Only animation poses may change.
neutral=base[43]['rotation'].copy()
names={i:nodes[i]['name'] for i in joints}
socket=json.loads((OUT/'BEAK_GRIP.json').read_text());socket_node=socket['glTFNodeIndex'];socket_local=np.r_[socket['localPosition'],1.]
def curve(t,knots,values):
 k=max(0,min(len(knots)-2,np.searchsorted(knots,t)-1));u=np.clip((t-knots[k])/(knots[k+1]-knots[k]),0,1);u=u*u*(3-2*u)
 return values[k]*(1-u)+values[k+1]*u
def shift_world(p,i,delta):
 ww,_=g.matrices(3.5,{nodes[j]['name']:p[j] for j in joints})
 p[i]['translation']+=np.linalg.solve(ww[parents[i],:3,:3],np.array(delta))
def tip_world(p):
 ww,_=g.matrices(3.5,{nodes[j]['name']:p[j] for j in joints})
 return (ww[socket_node]@socket_local)[:3]
def turn(p,i,axis,degrees):
 if degrees==0:return
 p[i]['rotation']=(R.from_quat(p[i]['rotation'])*R.from_rotvec(np.array(axis)*np.deg2rad(degrees))).as_quat()
def pose(kind,t,duration):
 p=copy.deepcopy(base);phase=t/duration;ang=phase*2*np.pi
 if kind in ['walk_loop','carry_walk']:
  shift_world(p,83,[.65*np.sin(ang),-.55+.35*np.cos(2*ang),0])
  turn(p,83,[0,0,1],-3+1.1*np.cos(2*ang))
  turn(p,45,[0,0,1],3-1.1*np.cos(2*ang))
  turn(p,43,[0,0,1],-.6*np.sin(2*ang))
  if kind=='carry_walk':
   turn(p,43,[0,1,0],4*np.sin(ang));turn(p,40,[0,0,1],3)
 elif kind in ['watch_idle','carry_idle']:
  yaw=curve(phase,[0,.18,.4,.62,.83,1],[0,-12,-12,8,8,0])
  turn(p,43,[0,1,0],yaw if kind=='watch_idle' else yaw*.5)
  turn(p,43,[1,0,0],curve(phase,[0,.2,.45,.7,1],[0,6,6,-3,0]))
  if kind=='carry_idle':turn(p,40,[0,0,1],3)
 elif kind.startswith('flight_'):
  # Trailer-informed flight states: hold the broad-span part of the beat for gliding.
  if kind!='flight_loop':phase=4/18
  _,src=g.matrices(1.4916666666666658+phase/3)
  for i in range(34,40):
   p[i]=copy.deepcopy(src[i]);q0=g.matrices(1.4916666666666658)[1][i]['rotation'];q1=g.matrices(1.825)[1][i]['rotation'];error=(R.from_quat(q0)*R.from_quat(q1).inv()).as_rotvec();u=phase*phase*(3-2*phase);p[i]['rotation']=(R.from_rotvec(error*u)*R.from_quat(p[i]['rotation'])).as_quat()
  _,legs=g.matrices(1.65)
  for i in [17,16,15,33,32,31]:p[i]=copy.deepcopy(legs[i])
  turn(p,83,[0,0,1],-48)
  turn(p,45,[0,0,1],24)
  turn(p,43,[0,0,1],18)
  # Undo the upright wing-plane pitch inherited from the source wing sample.
  # Apply in world space at each existing humerus, without changing its pivot.
  for shoulder in [36,39]:
   ww,_=g.matrices(3.5,{nodes[i]['name']:p[i] for i in joints})
   pr=ww[parents[shoulder],:3,:3].copy();pr/=np.linalg.norm(pr,axis=0)
   rot=ww[shoulder,:3,:3].copy();rot/=np.linalg.norm(rot,axis=0)
   p[shoulder]['rotation']=R.from_matrix(pr.T@R.from_euler('x',40,degrees=True).as_matrix()@rot).as_quat()
  if kind in ['flight_bank_left','flight_bank_right']:
   # Roll the articulated bird about game-forward +Z; retain the approved local head tilt.
   ww,_=g.matrices(3.5,{nodes[i]['name']:p[i] for i in joints})
   pr=ww[parents[83],:3,:3].copy();pr/=np.linalg.norm(pr,axis=0)
   rot=ww[83,:3,:3].copy();rot/=np.linalg.norm(rot,axis=0)
   angle=20 if kind=='flight_bank_left' else -20
   p[83]['rotation']=R.from_matrix(pr.T@R.from_euler('z',angle,degrees=True).as_matrix()@rot).as_quat()
 elif kind=='beak_tear':
  # Reference 00:32–37: lower/brace, change bill angle, nibble/regrip, then an authored pull.
  reach=curve(t,[0,.35,1.,2.6,3.05,3.4,4.2],[0,.15,1,1,.72,.55,0])
  turn(p,83,[0,0,1],-12*reach);shift_world(p,83,[0,-1.4*reach,2*reach])
  turn(p,45,[0,0,1],-10*reach);turn(p,43,[0,0,1],-12*reach)
  contact=tip_world(p)
  yaw=curve(t,[0,.8,1.15,1.5,1.85,2.2,2.55,2.85,3.15,3.5,4.2],[0,0,10,10,4,-8,-8,5,5,0,0])
  roll=curve(t,[0,.8,1.2,1.55,1.9,2.3,2.65,3.1,3.6,4.2],[0,0,12,12,3,-7,-7,3,0,0])
  turn(p,43,[0,1,0],yaw);turn(p,43,[1,0,0],roll)
  # Small contact compensation around the bill tip, not a long forward neck reach.
  correction=contact-tip_world(p);shift_world(p,45,correction)
  jaw=curve(t,[0,.7,.95,1.05,1.22,1.36,1.62,1.78,2.05,2.2,2.48,2.6,3.25,3.35,3.55,4.2],[0,0,7,1,5,1,6,1,4,1,5,1,1,8,2,0])
  turn(p,40,[0,0,1],jaw)
 if kind in ['walk_loop','carry_walk','beak_tear','watch_idle','carry_idle']:
  # Two-bone IK: planted foot does not sink or roll with the body.
  def matrices():return g.matrices(3.5,{nodes[i]['name']:p[i] for i in joints})[0]
  def orient(i,source,target):
   ww=matrices();a=source/np.linalg.norm(source);b=target/np.linalg.norm(target);axis=np.cross(a,b);dot=np.clip(a@b,-1,1)
   delta=R.from_rotvec(axis/max(np.linalg.norm(axis),1e-10)*np.arccos(dot)).as_matrix();pr=ww[parents[i],:3,:3];pr=pr/np.linalg.norm(pr,axis=0);old=ww[i,:3,:3];old=old/np.linalg.norm(old,axis=0);p[i]['rotation']=R.from_matrix(pr.T@delta@old).as_quat()
  for fem,tib,ank,offset in [(17,16,15,0),(33,32,31,.5)]:
   target=world[ank,:3,3].copy()
   if kind in ['walk_loop','carry_walk']:
    q=(phase+offset)%1
    u=(q-.62)/.38
    target[2]+=3-6*q/.62 if q<.62 else -3+6*u*u*(3-2*u)
    target[1]+=0 if q<.62 else 1.8*np.sin(u*np.pi)
   ww=matrices();hip=ww[fem,:3,3];knee=ww[tib,:3,3];foot=ww[ank,:3,3];l1=np.linalg.norm(knee-hip);l2=np.linalg.norm(foot-knee);v=target-hip;d=min(np.linalg.norm(v),l1+l2-1e-5);unit=v/np.linalg.norm(v);bend=knee-hip-unit*((knee-hip)@unit);bend/=np.linalg.norm(bend);along=(l1*l1-l2*l2+d*d)/(2*d);goal=hip+along*unit+np.sqrt(max(0,l1*l1-along*along))*bend
   orient(fem,knee-hip,goal-hip);ww=matrices();orient(tib,ww[ank,:3,3]-ww[tib,:3,3],target-ww[tib,:3,3]);ww=matrices();pr=ww[parents[ank],:3,:3];pr/=np.linalg.norm(pr,axis=0);ar=world[ank,:3,:3].copy();ar/=np.linalg.norm(ar,axis=0);p[ank]['rotation']=R.from_matrix(pr.T@ar).as_quat()
 for i in joints:p[i]['scale']=base[i]['scale'].copy()
 return {str(i):{k:v.tolist() for k,v in p[i].items()} for i in joints}
clips=[]
for name,dur,loop in [('walk_loop',1.,True),('flight_loop',.6,True),('beak_tear',4.2,False),('flight_glide',1.,True),('flight_bank_left',1.,True),('flight_bank_right',1.,True),('watch_idle',3.,True),('carry_walk',1.,True),('carry_idle',3.,True)]:
 times=np.linspace(0,dur,round(dur*30)+1);frames=[pose(name,float(t),dur) for t in times]
 if loop:frames[-1]=copy.deepcopy(frames[0])
 clips.append(dict(name=name,duration=dur,loop=loop,times=times.tolist(),frames=frames,wingRestWeight=0 if name.startswith('flight_') else 1,events=([{'time':1.05,'name':'beak_grip'},{'time':1.62,'name':'beak_regrip'},{'time':2.05,'name':'beak_regrip'},{'time':2.9,'name':'tear_impulse'},{'time':3.35,'name':'beak_release'}] if name=='beak_tear' else [])))
payload={'version':1,'sourceGlbSha256':hashlib.sha256(Path(g.path).read_bytes()).hexdigest(),'nodes':names,'clips':clips}
(OUT/'kea_motion_clips.json').write_text(json.dumps(payload,separators=(',',':')))
# Partition existing corrections so approved head/body stay present during flight.
c=json.loads(Path(str(Path(__file__).resolve().parents[1]/'source_rest_correction.json')).read_text());ji=g.acc(3).astype(int) if False else g.acc(g.j['meshes'][0]['primitives'][0]['attributes']['JOINTS_0']).astype(int); wt=g.acc(g.j['meshes'][0]['primitives'][0]['attributes']['WEIGHTS_0']); wingweight=np.sum(wt*np.isin(np.array(joints)[ji],np.arange(34,40)),axis=1)
c['wingInfluence']=[float(wingweight[i]) for i in c['indices']];(OUT/'kea_motion_shape.json').write_text(json.dumps(c,separators=(',',':')))
report={'sourceSha256':payload['sourceGlbSha256'],'sourceModified':False,'jointCount':len(joints),'triangles':len(g.acc(5).ravel())//3,'accessorsChanged':[],'nodesChanged':[],'originalAnimationsChanged':False,'newAnimationFormat':'External node-index TRS clips; original GLB bytes untouched','headPose':{'oldRotation':g.matrices(3.5)[1][43]['rotation'].tolist(),'approvedRotation':neutral.tolist(),'originalHeadUpLateralDegrees':float(np.rad2deg(np.arctan2(world[43,0,1],world[43,1,1])))},'clips':[]}
for clip in clips:
 quats=np.array([d['rotation'] for f in clip['frames'] for d in f.values()]);report['clips'].append({'name':clip['name'],'frames':len(clip['frames']),'finite':bool(np.isfinite(quats).all()),'maximumQuaternionNormError':float(abs(np.linalg.norm(quats,axis=1)-1).max()),'exactLoopEndpoint':clip['frames'][0]==clip['frames'][-1] if clip['loop'] else None})
(OUT/'VALIDATION.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
