from pathlib import Path
import struct,json,io
from PIL import Image
# Reuse the exact unrigged geometry sampled by the preview renderer.
source=Path(__file__).with_name('render_motion.py').read_text().split("(D/'BEAK_GRIP.json')")[0];exec(source)
parts=paper_scene(0,anchor);names=['paper_left','paper_right','paper_strip','support_rail','support_post'];doc={'asset':{'version':'2.0','generator':'Kea unrigged paper demonstration'},'scene':0,'scenes':[{'nodes':list(range(5))}],'nodes':[],'meshes':[],'bufferViews':[],'accessors':[],'buffers':[{}],'materials':[],'textures':[],'images':[]};binary=bytearray()
def view(raw):
 binary.extend(b'\0'*((-len(binary))%4));offset=len(binary);binary.extend(raw);k=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':offset,'byteLength':len(raw)});return k
def accessor(array,kind,ctype):
 ar=np.asarray(array,dtype='<f4'if ctype==5126 else'<u2');v=view(ar.tobytes());ac={'bufferView':v,'componentType':ctype,'count':len(ar),'type':kind}
 if kind=='VEC3':ac['min']=ar.min(0).tolist();ac['max']=ar.max(0).tolist()
 i=len(doc['accessors']);doc['accessors'].append(ac);return i
for color in colors:
 im=Image.new('RGBA',(2,2),tuple(int(c*255)for c in color)+(255,));buf=io.BytesIO();im.save(buf,format='PNG');v=view(buf.getvalue());idx=len(doc['images']);doc['images'].append({'bufferView':v,'mimeType':'image/png'});doc['textures'].append({'source':idx});doc['materials'].append({'pbrMetallicRoughness':{'baseColorTexture':{'index':idx},'metallicFactor':0,'roughnessFactor':.9},'doubleSided':True})
def localize(p):
 p=np.array(p).copy();p-=np.array([anchor[0],0,anchor[2]+1]);p[:,[0,2]]*=-1;return p*.01
for i,(p,n,uv,f,mat)in enumerate(parts):
 p=localize(p);n=n.copy();n[:,[0,2]]*=-1;prim={'attributes':{'POSITION':accessor(p,'VEC3',5126),'NORMAL':accessor(n,'VEC3',5126),'TEXCOORD_0':accessor(uv,'VEC2',5126)},'indices':accessor(f.ravel(),'SCALAR',5123),'material':0 if i<3 else 1};doc['meshes'].append({'name':names[i],'primitives':[prim]});doc['nodes'].append({'name':names[i],'mesh':i})
doc['buffers'][0]['byteLength']=len(binary);js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4);binary.extend(b'\0'*((-len(binary))%4));raw=struct.pack('<III',0x46546c67,2,28+len(js)+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary;(D/'paper_tear_demo.glb').write_bytes(raw)
frames=[]
for t in tear['times']:
 tippos=tip_at(t);parts=paper_scene(t,tippos);frames.append({names[i]:localize(part[0]).tolist()for i,part in enumerate(parts)})
(D/'paper_tear_motion.json').write_text(json.dumps({'units':'metres','times':tear['times'],'frames':frames,'sourcePreviewPlacement':{'translation':[float(anchor[0]),0,float(anchor[2]+1)],'rotationYRadians':math.pi,'scale':100},'note':'Unrigged vertex animation demo. The 100x transform places this metric prop into the existing source render coordinate space; adapt placement and scale in your game.'},separators=(',',':')))
print('Exported metric unrigged prop and',len(frames),'matched motion frames')
