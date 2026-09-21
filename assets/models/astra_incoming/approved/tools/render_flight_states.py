from pathlib import Path
import sys,json,numpy as np,subprocess
from PIL import Image,ImageDraw
sys.path.insert(0,str(Path(__file__).resolve().parent))
import render_cached as rc
D=Path(__file__).resolve().parents[1];g=rc.GLB(D/'kea_animated.glb');acc=g.acc
prim=g.j['meshes'][0]['primitives'][0];pa=prim['attributes']['POSITION'];na=prim['attributes']['NORMAL']
P=acc(pa)+acc(prim['targets'][0]['POSITION']);N=rc.norm(acc(na)+acc(prim['targets'][0]['NORMAL']))
g.acc=lambda k:P if k==pa else N if k==na else acc(k)
animations={a['name']:a for a in g.j['animations']};names={i:g.j['nodes'][i]['name'] for i in g.j['skins'][0]['joints']}
schedule=[(0,'flight_loop'),(1.2,'flight_glide'),(2.2,'flight_bank_left'),(3.3,'flight_glide'),(3.9,'flight_bank_right'),(5.,'flight_loop')]
def sample(name,t):
 g.j['animations']=[animations[name]]
 return g.matrices(t%(.6 if name=='flight_loop' else 1.))[1]
def pose_at(t):
 k=max(i for i,(s,n) in enumerate(schedule) if t>=s);s,name=schedule[k];b=sample(name,t-s)
 if k and t-s<.24:
  a=sample(schedule[k-1][1],t-schedule[k-1][0]);u=(t-s)/.24;u=u*u*(3-2*u)
  for i in names:
   for key in ['translation','rotation','scale']:
    x=a[i][key];y=b[i][key]
    if key=='rotation' and x@y<0:y=-y
    v=x*(1-u)+y*u;b[i][key]=rc.norm(v) if key=='rotation' else v
 return {names[i]:b[i] for i in names},name
frames=D/'previews/flight_states';frames.mkdir(exist_ok=True)
sheet=Image.new('RGB',(1440,1000),'white');draw=ImageDraw.Draw(sheet)
for j,t in enumerate([1.8,2.9,4.6]):
 pose,name=pose_at(t)
 for row,cam in enumerate(([1,.24,1],[0,.05,1])):
  path=frames/f'qa_{row}_{j}.png';rc.render(g,path,camera=cam,target=[0,28,0],span=190,width=480,height=480,pose=pose)
  sheet.paste(Image.open(path),(j*480,row*500+20));draw.text((j*480+10,row*500+3),name+(' | three-quarter' if row==0 else ' | front'),fill='black')
sheet.save(D/'previews/flight_states_qa.jpg')
for i in range(180):
 pose,name=pose_at(i/30);path=frames/f'{i:04d}.png'
 rc.render(g,path,camera=[1,.24,1],target=[0,28,0],span=190,width=480,height=480,pose=pose)
 im=Image.open(path);dr=ImageDraw.Draw(im);dr.text((12,12),name.replace('_',' '),fill='black');im.save(path)
subprocess.run(['ffmpeg','-y','-v','error','-framerate','30','-i',str(frames/'%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p',str(D/'previews/flight_states.mp4')],check=True)
