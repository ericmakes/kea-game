from pathlib import Path
import json,sys,numpy as np,subprocess,math
from PIL import Image,ImageDraw
sys.path.insert(0,str(Path(__file__).resolve().parent));import render_cached as rc
D=Path(__file__).resolve().parents[1];data=json.loads((D/'kea_motion_clips.json').read_text());shape=json.loads((D/'kea_motion_shape.json').read_text());g=rc.GLB(D/'model/kea_reference_shape.glb');acc=g.acc;P=acc(0);N=acc(1);ix=np.array(shape['indices']);delta=np.array(shape['deltaPosition']).reshape(-1,3);cn=np.array(shape['correctedNormal']).reshape(-1,3)
def setshape(weight):
 a=1-(1-weight)*np.array(shape['wingInfluence']);p=P.copy();n=N.copy();p[ix]+=delta*a[:,None];n[ix]=rc.norm(n[ix]*(1-a[:,None])+cn*a[:,None]);g.acc=lambda k:p.copy()if k==0 else n.copy()if k==1 else acc(k)
def overrides(frame):return {data['nodes'][i]:v for i,v in frame.items()}
def sampled(clip,t):
 i=min(len(clip['times'])-2,max(0,np.searchsorted(clip['times'],t)-1));u=np.clip((t-clip['times'][i])/(clip['times'][i+1]-clip['times'][i]),0,1);a=clip['frames'][i];b=clip['frames'][i+1];out={}
 for id in a:
  out[id]={}
  for k in a[id]:
   x=np.array(a[id][k]);y=np.array(b[id][k]);y=-y if k=='rotation' and x@y<0 else y;v=x*(1-u)+y*u;out[id][k]=(v/np.linalg.norm(v)if k=='rotation'else v).tolist()
 return overrides(out)
setshape(1);orig_geo=g.geometry
# Grip at the approved bill tip. Derived from the current skinned geometry, not a guessed socket.
geo,w=orig_geo(3.5);at=g.j['meshes'][0]['primitives'][0]['attributes'];j=np.array(g.j['skins'][0]['joints'])[acc(at['JOINTS_0']).astype(int)];weights=acc(at['WEIGHTS_0']);upper=(weights*np.isin(j,[41,42])).sum(1);rot=w[43,:3,:3];rot/=np.linalg.norm(rot,axis=0);h=(geo[0][0]-w[43,:3,3])@rot;tip=int(np.where(upper>.99)[0][np.argmin(h[upper>.99,1])]);node=int(j[tip,np.argmax(weights[tip])]);local=(np.linalg.inv(w[node])@np.r_[geo[0][0][tip],1])[:3]
tear=next(c for c in data['clips']if c['name']=='beak_tear')
def tip_at(t):return orig_geo(3.5,sampled(tear,t))[0][0][0][tip]
anchor=tip_at(1.05);release=tip_at(3.35)
carry_center_local=(np.linalg.inv(w[node])@np.r_[geo[0][0][tip]+[0,-2.,0],1])[:3]
carry_matrix=np.linalg.inv(w[node])@np.array([[100,0,0,geo[0][0][tip][0]],[0,100,0,geo[0][0][tip][1]-4.5],[0,0,100,geo[0][0][tip][2]],[0,0,0,1]])
colors=[[.79,.70,.48],[.27,.20,.13],[.8,.12,.06],[.95,.7,.1]];oldcached=rc.cached_textures;matids=[]
for k,c in enumerate(colors):
 ti=len(g.j['textures']);g.j['textures'].append({'source':10000+k});mi=len(g.j['materials']);g.j['materials'].append({'pbrMetallicRoughness':{'baseColorTexture':{'index':ti}},'normalTexture':{'index':ti},'doubleSided':True});matids.append(mi)
def cached(glb,color_idx,normal_idx,albedo,normal):
 if color_idx>=10000:
  col=np.r_[rc.srgb_to_linear(np.array(colors[color_idx-10000])),1];return col.reshape(1,1,4),np.array([[[.5,.5,1.]]])
 return oldcached(glb,color_idx,normal_idx,albedo,normal)
rc.cached_textures=cached

def quad(points,mat):
 p=np.array(points,float);n=np.cross(p[1]-p[0],p[2]-p[0]);n=n/max(np.linalg.norm(n),1e-9);return p,np.tile(n,(4,1)),np.array([[0,0],[1,0],[1,1],[0,1]]),np.array([[0,1,2],[0,2,3]]),mat

def paper_scene(t,tippos):
 x,y,z=anchor;parts=[]
 # Paper left/right panels remain held by an unrigged support.
 for l,r in [(-6,-1.2),(1.2,6)]:parts.append(quad([[x+l,y,z],[x+r,y,z],[x+r,y-9,z],[x+l,y-9,z]],matids[0]))
 if t<1.05:top=anchor.copy();bottom=anchor-np.array([0,9,0])
 elif t<2.9:
  top=tippos;progress=np.clip((t-2.6)/(.3),0,1);fixed=anchor-np.array([0,9,0]);free=top-np.array([0,9,0]);bottom=fixed*(1-progress)+free*progress
 elif t<3.35:top=tippos;bottom=top-np.array([0,9,0])
 else:
  dt=t-3.35;top=release+np.array([0,-55*dt*dt,4*dt]);top[1]=max(9.,top[1]);bottom=top-np.array([0,9,0]);bottom[2]+=3*np.sin(dt*5)
 parts.append(quad([top+[-1.2,0,0],top+[1.2,0,0],bottom+[1.2,0,0],bottom+[-1.2,0,0]],matids[0]))
 # Stand behind paper; simple rigid geometry, no bones.
 parts.append(quad([[x-7,y-8,z+.5],[x+7,y-8,z+.5],[x+7,y-10,z+.5],[x-7,y-10,z+.5]],matids[1]))
 parts.append(quad([[x-.7,y-10,z+1],[x+.7,y-10,z+1],[x+.7,0,z+1],[x-.7,0,z+1]],matids[1]))
 return parts

def carry_scene(world):
 prop_matrix=world[node]@carry_matrix
 center=(prop_matrix@np.array([0,.025,0,1]))[:3];parts=[]
 for band in range(6):
  for sector in range(12):
   points=[]
   for b,s in [(band,sector),(band+1,sector),(band+1,sector+1),(band,sector+1)]:
    lat=-np.pi/2+b*np.pi/6;lon=s*2*np.pi/12
    v=.025*np.array([np.cos(lat)*np.cos(lon),np.sin(lat),np.cos(lat)*np.sin(lon)])+[0,.025,0]
    points.append((prop_matrix@np.r_[v,1])[:3])
   part=quad(points,matids[2+sector%2]);parts.append((part[0],rc.norm(part[0]-center),part[2],part[3],part[4]))
 return parts

(D/'BEAK_GRIP.json').write_text(json.dumps({'glTFNodeIndex':node,'nodeName':g.j['nodes'][node]['name'],'localPosition':local.tolist(),'tipVertex':tip,'previewPaperAnchor':anchor.tolist(),'events':tear['events'],'note':'Preview prop is unrigged and procedurally torn; gameplay physics is not implemented.'},indent=2))
(D/'CARRY_ATTACHMENT.json').write_text(json.dumps({'glTFNodeIndex':node,'nodeName':g.j['nodes'][node]['name'],'propFile':'carry_ball.glb','localMatrixColumnMajor':carry_matrix.T.ravel().tolist(),'centerLocalPosition':carry_center_local.tolist(),'radiusSourceUnits':2.5,'note':'Attach prop root beneath this existing joint using localMatrixColumnMajor. It accounts for legacy source scale; retain your normal bird asset scale above both. Carry clips assume already holding; no pickup is implied.'},indent=2))
mode=sys.argv[1]if len(sys.argv)>1 else'samples';paths=[]
for clip in data['clips']:
 if len(sys.argv)>2 and clip['name']!=sys.argv[2]:continue
 setshape(clip['wingRestWeight']);poses=[overrides(f)for f in clip['frames'][:-1]];cloud=np.concatenate([orig_geo(3.5,p)[0][0][0]for p in poses]);lo=cloud.min(0);hi=cloud.max(0)
 if clip['name']=='beak_tear':lo=np.minimum(lo,anchor+[-7,-anchor[1],0]);hi=np.maximum(hi,anchor+[7,1,1])
 target=(lo+hi)/2;cam=rc.norm(np.array([1,.24,1.]));right=rc.norm(np.cross([0,1,0],cam));up=np.cross(cam,right);span=max(np.ptp(cloud@up),np.ptp(cloud@right))*1.22
 if clip['name']=='beak_tear':span=76
 folder=D/'previews'/clip['name'];folder.mkdir(parents=True,exist_ok=True)
 indices=range(len(poses))if mode=='movies'else [0,len(poses)//4,len(poses)//2,3*len(poses)//4]
 for i in indices:
  pose=poses[i];geo,w=orig_geo(3.5,pose)
  if clip['name']=='beak_tear':geo=geo+paper_scene(clip['times'][i],geo[0][0][tip])
  if clip['name'].startswith('carry_'):geo=geo+carry_scene(w)
  g.geometry=lambda time=None,overrides=None: (geo,w)
  path=folder/f'{i:04d}.png';rc.render(g,path,camera=cam,target=target,span=span,width=480,height=480,time=3.5);paths.append(path)
 g.geometry=orig_geo
 if mode=='movies':
  once=D/'previews'/f'{clip["name"]}_once.mp4';out=D/'previews'/f'{clip["name"]}.mp4'
  subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','30','-i',str(folder/'%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p',str(once)],check=True)
  subprocess.run(['ffmpeg','-y','-loglevel','error','-stream_loop','3','-i',str(once),'-c','copy',str(out)],check=True);once.unlink()
if mode=='samples':
 s=Image.new('RGB',(1920,500*((len(paths)+3)//4)),'white');dr=ImageDraw.Draw(s)
 for k,p in enumerate(paths):s.paste(Image.open(p),(k%4*480,k//4*500+20));dr.text((k%4*480+8,k//4*500+3),p.parent.name+' '+p.stem,fill='black')
 s.save(D/'previews/motion_samples.jpg',quality=94)
