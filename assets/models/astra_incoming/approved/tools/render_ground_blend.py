from pathlib import Path
import sys,numpy as np,subprocess,json
from PIL import Image,ImageDraw
D=Path(__file__).resolve().parents[1];sys.path.insert(0,str(D/'tools'));import render_cached as rc
g=rc.GLB(D/'kea_animated.glb');anims={a['name']:a for a in g.j['animations']};joints=g.j['skins'][0]['joints'];nodes=g.j['nodes'];folder=D/'previews/ground_blend';folder.mkdir(exist_ok=True)
def sample(name,t):
 g.j['animations']=[anims[name]];return g.matrices(t% (1 if name=='walk_loop' else 3))[1]
def smooth(u):u=np.clip(u,0,1);return u*u*(3-2*u)
for i in range(120):
 t=i/30;weight=smooth((t-.6)/.25)*(1-smooth((t-2.65)/.25));a=sample('watch_idle',t);b=sample('walk_loop',t-.6);pose={}
 for j in joints:
  pose[nodes[j]['name']]={}
  for k in ['translation','rotation','scale']:
   x=a[j][k];y=b[j][k]
   if k=='rotation' and x@y<0:y=-y
   v=x*(1-weight)+y*weight;pose[nodes[j]['name']][k]=rc.norm(v) if k=='rotation' else v
 p=folder/f'{i:04d}.png';rc.render(g,p,camera=[1,.24,1],target=[0,27,0],span=76,width=480,height=480,pose=pose)
 im=Image.open(p);dr=ImageDraw.Draw(im);dr.text((12,12),'Watch / start / walk / stop - in place',fill='black');im.save(p)
subprocess.run(['ffmpeg','-y','-v','error','-framerate','30','-i',str(folder/'%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p',str(D/'previews/ground_locomotion.mp4')],check=True)
