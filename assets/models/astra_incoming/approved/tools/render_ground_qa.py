from pathlib import Path
import sys,json,numpy as np
from PIL import Image,ImageDraw
D=Path(__file__).resolve().parents[1];sys.path.insert(0,str(D/'tools'))
# The same unrigged fixtures used in the motion preview.
ss={'__file__':str(D/'tools/render_motion.py')};exec((D/'tools/render_motion.py').read_text().split("(D/'BEAK_GRIP.json')")[0],ss)
import render_cached as rc
g=rc.GLB(D/'kea_animated.glb');animations={a['name']:a for a in g.j['animations']};g.j['materials']=ss['g'].j['materials'];g.j['textures']=ss['g'].j['textures'];original=g.geometry
cases=[('beak_tear',1.4),('beak_tear',2.2),('beak_tear',2.95),('carry_walk',.25)]
sheet=Image.new('RGB',(1440,2000),'white');draw=ImageDraw.Draw(sheet)
for row,(name,t) in enumerate(cases):
 g.j['animations']=[animations[name]];geo,w=original(t)
 if name=='beak_tear':geo+=ss['paper_scene'](t,geo[0][0][ss['tip']])
 else:geo+=ss['carry_scene'](w)
 g.geometry=lambda time=None,overrides=None:(geo,w)
 for col,cam in enumerate(([0,.1,1],[1,.12,0],[1,.24,1])):
  p=D/'previews'/f'ground_qa_{row}_{col}.png';rc.render(g,p,camera=cam,target=[0,27,4],span=76,width=480,height=480)
  sheet.paste(Image.open(p),(col*480,row*500+20));draw.text((col*480+8,row*500+4),f'{name} {t:.2f}s | '+['front','side','three-quarter'][col],fill='black')
 g.geometry=original
sheet.save(D/'previews/ground_qa.jpg',quality=94)
