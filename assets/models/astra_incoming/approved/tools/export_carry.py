from pathlib import Path
import numpy as np,json,struct,io
from PIL import Image
D=Path(__file__).resolve().parents[1]
doc={'asset':{'version':'2.0','generator':'Kea carry demo'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'carry_ball','mesh':0}],'meshes':[{'primitives':[]}],'buffers':[{}],'bufferViews':[],'accessors':[],'materials':[],'textures':[],'images':[]};buf=bytearray()
def view(data):
 buf.extend(b'\0'*(-len(buf)%4));off=len(buf);buf.extend(data);i=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(data)});return i

def acc(a,kind,ctype=5126):
 a=np.asarray(a,dtype='<f4' if ctype==5126 else '<u2');d={'bufferView':view(a.tobytes()),'componentType':ctype,'count':len(a),'type':kind}
 if kind=='VEC3':d.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 i=len(doc['accessors']);doc['accessors'].append(d);return i
for mat,color in enumerate([(204,31,15),(242,178,26)]):
 im=Image.new('RGB',(2,2),color);s=io.BytesIO();im.save(s,format='PNG');doc['images'].append({'bufferView':view(s.getvalue()),'mimeType':'image/png'});doc['textures'].append({'source':mat});doc['materials'].append({'pbrMetallicRoughness':{'baseColorTexture':{'index':mat},'roughnessFactor':.7,'metallicFactor':0}})
 P=[];N=[];UV=[];F=[]
 for b in range(6):
  for sec in range(mat,12,2):
   q=[];n=[]
   for latid,lonid in [(b,sec),(b+1,sec),(b+1,sec+1),(b,sec+1)]:
    lat=-np.pi/2+latid*np.pi/6;lon=lonid*np.pi/6;v=np.array([np.cos(lat)*np.cos(lon),np.sin(lat),np.cos(lat)*np.sin(lon)]);n.append(v);q.append(.025*v+[0,.025,0])
   start=len(P);P.extend(q);N.extend(n);UV.extend([[0,0],[0,1],[1,1],[1,0]])
   for tri in [(0,1,2),(0,2,3)]:
    a,c,d=np.array(q)[list(tri)]
    if np.linalg.norm(np.cross(c-a,d-a))>1e-12:F.append([start+x for x in tri])
 doc['meshes'][0]['primitives'].append({'attributes':{'POSITION':acc(P,'VEC3'),'NORMAL':acc(N,'VEC3'),'TEXCOORD_0':acc(UV,'VEC2')},'indices':acc(np.array(F).ravel(),'SCALAR',5123),'material':mat})
doc['buffers'][0]['byteLength']=len(buf);js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*(-len(js)%4);buf.extend(b'\0'*(-len(buf)%4));(D/'carry_ball.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf)
print('Unrigged 5 cm ball, origin at bottom, 120 triangles, embedded textures')
