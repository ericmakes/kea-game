from pathlib import Path
import sys,json,struct,copy,hashlib,csv
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent))
from render_cached import GLB,norm,render
D=Path(__file__).resolve().parents[1]
src=GLB(D/'model/kea_reference_shape.glb'); anim=GLB(D/'kea_animated.glb')
lock=json.loads((D/'APPROVED_CHARACTER_LOCK.json').read_text())
checks={f:hashlib.sha256((D/'model'/f).read_bytes()).hexdigest()==h for f,h in lock['files'].items()};assert all(checks.values())
doc=copy.deepcopy(src.j);binary=bytearray(src.bin)
def add(v,kind):
 v=np.asarray(v,dtype='<f4');binary.extend(b'\0'*(-len(binary)%4));off=len(binary);binary.extend(v.tobytes());bv=len(doc['bufferViews']);doc['bufferViews'].append(dict(buffer=0,byteOffset=off,byteLength=v.nbytes));ac=dict(bufferView=bv,componentType=5126,count=len(v),type=kind)
 if kind in ('VEC3','SCALAR'):ac.update(min=v.min(0).tolist(),max=v.max(0).tolist())
 doc['accessors'].append(ac);return len(doc['accessors'])-1
P=np.fromfile(D/'model/actual_position_1.bin','<f4').reshape(-1,3);N=np.fromfile(D/'model/actual_normal_1.bin','<f4').reshape(-1,3)
p=doc['meshes'][0]['primitives'][0];p['attributes']['POSITION']=add(P,'VEC3');p['attributes']['NORMAL']=add(N,'VEC3')
idle=copy.deepcopy(next(a for a in anim.j['animations'] if a['name']=='approved_idle'));idle['channels']=[c for c in idle['channels'] if c['target']['path']!='weights'];samplers=[]
for c in idle['channels']:
 s=idle['samplers'][c['sampler']];c['sampler']=len(samplers);samplers.append(dict(input=add(anim.acc(s['input']),'SCALAR'),output=add(anim.acc(s['output']),anim.j['accessors'][s['output']]['type']),interpolation=s.get('interpolation','LINEAR')))
idle['samplers']=samplers;doc['animations'].append(idle)
doc['buffers'][0]['byteLength']=len(binary);js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*(-len(js)%4);binary.extend(b'\0'*(-len(binary)%4));raw=struct.pack('<III',0x46546c67,2,28+len(js)+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
(D/'kea_approved.glb').write_bytes(raw);approved=GLB(D/'kea_approved.glb')
def digest(path):
 b=path.read_bytes();return dict(sha256=hashlib.sha256(b).hexdigest(),md5=hashlib.md5(b).hexdigest(),bytes=len(b))
hashes={f:digest(D/f) for f in ['kea_approved.glb','kea_animated.glb']};(D/'CHARACTER_HASHES.json').write_text(json.dumps(hashes,indent=2))
for alg in ['sha256','md5']:(D/(alg.upper()+'SUMS.txt')).write_text(''.join(f'{v[alg]}  {f}\n' for f,v in hashes.items()))
attrs=p['attributes'];aa=anim.j['meshes'][0]['primitives'][0]['attributes'];sa=src.j['meshes'][0]['primitives'][0]['attributes']
report={'baseline':'APPROVED_CHARACTER_LOCK.json and exact locked evaluated POSITION/NORMAL arrays; not historical Task 3','lock_file_hashes_match':checks,'hashes':hashes,'checks':{},'limits':['No live game or procedural rig test','No exhaustive animated intersection test','Canonical wing-open view uses animated flight morph, not static folded base alone']}
c=report['checks'];c['101_joints']=len(doc['skins'][0]['joints'])==101;c['4927_triangles']=len(src.acc(p['indices']).ravel())//3==4927
for label,g in [('approved',approved),('animated',anim)]:
 at=g.j['meshes'][0]['primitives'][0]['attributes'];c[label+'_positions_match_approved_bytes']=g.acc(at['POSITION']).tobytes()==P.tobytes();c[label+'_normals_match_approved_bytes']=g.acc(at['NORMAL']).tobytes()==N.tobytes();c[label+'_original_binary_prefix_exact']=g.bin[:len(src.bin)]==src.bin
 for k in ['nodes','skins','materials','textures','images','samplers','scenes']:c[label+'_'+k+'_exact']=g.j.get(k)==src.j.get(k)
 c[label+'_original_accessors_exact']=g.j['accessors'][:len(src.j['accessors'])]==src.j['accessors'];c[label+'_original_animation_exact']=g.j['animations'][0]==src.j['animations'][0]
 for k,v in sa.items():
  if k not in ['POSITION','NORMAL']:c[label+'_'+k+'_bytes_exact']=g.acc(at[k]).tobytes()==src.acc(v).tobytes()
 c[label+'_index_bytes_exact']=g.acc(g.j['meshes'][0]['primitives'][0]['indices']).tobytes()==src.acc(p['indices']).tobytes()
 c[label+'_no_compression']=not any(x in json.dumps(g.j) for x in ['KHR_draco_mesh_compression','EXT_meshopt_compression'])
assert all(c.values())
# Exact affected rows and existing skin influences.
target=anim.j['meshes'][0]['primitives'][0]['targets'][0];dp=anim.acc(target['POSITION']);dn=anim.acc(target['NORMAL']);rows=np.where(np.any(dp!=0,axis=1)|np.any(dn!=0,axis=1))[0];ji=src.acc(sa['JOINTS_0']).astype(int);wt=src.acc(sa['WEIGHTS_0']);joints=src.j['skins'][0]['joints'];shape=json.loads((D/'kea_motion_shape.json').read_text());influence=dict(zip(shape['indices'],shape['wingInfluence']))
with (D/'MORPH_VERTEX_SCOPE.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['vertex_row','dx','dy','dz','dnx','dny','dnz','wing_partition_weight','skin_node_indices','skin_node_names','skin_weights'])
 for i in rows:
  ids=[joints[j] for j,weight in zip(ji[i],wt[i]) if weight>0];weights=[float(weight) for weight in wt[i] if weight>0];w.writerow([i,*dp[i],*dn[i],influence.get(int(i),0),json.dumps(ids),json.dumps([src.j['nodes'][j].get('name') for j in ids]),json.dumps(weights)])
report['morph']={'name':'flight_wing_release','position_changed_rows':int(np.any(dp!=0,axis=1).sum()),'normal_changed_rows':int(np.any(dn!=0,axis=1).sum()),'union_rows':len(rows),'vertex_count':len(P),'partition_bones':{str(i):src.j['nodes'][i]['name'] for i in range(34,40)},'position_max_abs_component':float(abs(dp).max()),'normal_only_rows_with_zero_wing_partition':int(sum(not np.any(dp[i]) and influence.get(int(i),0)==0 for i in rows))}
report['accessors']={'source_count':len(src.j['accessors']),'approved_count':len(approved.j['accessors']),'animated_count':len(anim.j['accessors']),'approved_active_position_normal':[attrs['POSITION'],attrs['NORMAL']],'animated_active_position_normal':[aa['POSITION'],aa['NORMAL']],'animated_morph':target}
(D/'HANDOFF_VALIDATION.json').write_text(json.dumps(report,indent=2));print(json.dumps({'checks_pass':all(c.values()),'morph':report['morph'],'accessors':report['accessors'],'hashes':hashes},indent=2),flush=True)
# All clips, measured durations and exact endpoint tests.
clips=[]
for a in anim.j['animations']:
 start=min(float(anim.acc(s['input']).min()) for s in a['samplers']);end=max(float(anim.acc(s['input']).max()) for s in a['samplers']);loop=a.get('extras',{}).get('loop');clips.append({'name':a['name'],'duration':end-start,'loop':loop,'all_sampler_endpoints_identical':all(np.array_equal(anim.acc(s['output'])[0],anim.acc(s['output'])[-1]) for s in a['samplers'])})
(D/'CLIP_MEASUREMENTS.json').write_text(json.dumps(clips,indent=2))
# Actual mesh renders, with embedded images. Apply glTF morph before skinning for open view.
R=D/'canonical_renders';R.mkdir(exist_ok=True);approved.j['animations']=[idle]
render(approved,R/'head.png',camera=[1,.08,.7],target=[0,43,4],span=28,width=1000,height=1000,time=0)
render(approved,R/'side.png',camera=[1,.08,0],width=1000,height=1000,time=0,shadow=True)
render(approved,R/'folded_rear.png',camera=[.55,.18,-1],width=1000,height=1000,time=0,shadow=True)
anim.j['animations']=[next(a for a in anim.j['animations'] if a['name']=='flight_glide')];acc=anim.acc;pp=acc(aa['POSITION'])+dp;nn=norm(acc(aa['NORMAL'])+dn);anim.acc=lambda k:pp if k==aa['POSITION'] else nn if k==aa['NORMAL'] else acc(k)
render(anim,R/'wings_open.png',camera=[0,-.55,1],width=1200,height=1000,time=0)
from PIL import Image,ImageDraw
sheet=Image.new('RGB',(1000,1040),'white');dr=ImageDraw.Draw(sheet)
for i,name in enumerate(['head','side','folded_rear','wings_open']):
 im=Image.open(R/(name+'.png'));im.thumbnail((500,480));x=(i%2)*500;y=(i//2)*520;sheet.paste(im,(x+(500-im.width)//2,y+30));dr.text((x+12,y+8),name,fill='black')
sheet.save(R/'contact_sheet.jpg',quality=92)
