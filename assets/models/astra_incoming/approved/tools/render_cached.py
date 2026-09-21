#!/usr/bin/env python3
"""Read-only glTF skin + CPU triangle renderer. All transforms are render-only."""
import argparse, json, struct, io, math
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation
from PIL import Image, ImageDraw, ImageFilter

def norm(a):return a/np.maximum(np.linalg.norm(a,axis=-1,keepdims=True),1e-12)
def srgb_to_linear(a):return np.where(a<=.04045,a/12.92,((a+.055)/1.055)**2.4)
def linear_to_srgb(a):return np.where(a<=.0031308,12.92*a,1.055*np.maximum(a,0)**(1/2.4)-.055)

class GLB:
 def __init__(self,path):
  p=Path(path).read_bytes();n=struct.unpack_from('<I',p,12)[0];self.j=json.loads(p[20:20+n]);self.bin=p[28+n:];self.path=path
 def acc(self,k):
  a=self.j['accessors'][k];v=self.j['bufferViews'][a['bufferView']];dtype={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']];m={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];z=np.ndarray((a['count'],m),dtype=dtype,buffer=self.bin,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',np.dtype(dtype).itemsize*m),np.dtype(dtype).itemsize)).copy()
  if a.get('normalized'):z=z.astype(float)/np.iinfo(dtype).max
  return z
 def image(self,k):
  im=self.j['images'][k];v=self.j['bufferViews'][im['bufferView']];return Image.open(io.BytesIO(self.bin[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])).convert('RGBA')
 def matrices(self,time=None,overrides=None):
  nodes=self.j['nodes'];trs=[{k:np.array(n.get(k,default),float) for k,default in [('translation',[0,0,0]),('rotation',[0,0,0,1]),('scale',[1,1,1])]} for n in nodes]
  if time is not None:
   anim=self.j['animations'][0]
   for c in anim['channels']:
    s=anim['samplers'][c['sampler']];ts=self.acc(s['input']).ravel();vs=self.acc(s['output']);t=float(np.clip(time,ts[0],ts[-1]));ii=np.clip(np.searchsorted(ts,t,side='right')-1,0,len(ts)-1);jj=min(ii+1,len(ts)-1);q=0 if ii==jj or s.get('interpolation')=='STEP' else (t-ts[ii])/(ts[jj]-ts[ii]);v0=vs[ii];v1=vs[jj];key=c['target']['path']
    if key=='rotation' and np.dot(v0,v1)<0:v1=-v1
    if key=='rotation' and np.dot(v0,v1)<.9995:
     angle=np.arccos(np.clip(np.dot(v0,v1),-1,1));v=(np.sin((1-q)*angle)*v0+np.sin(q*angle)*v1)/np.sin(angle)
    else:v=v0*(1-q)+v1*q
    if key=='rotation':v=norm(v)
    trs[c['target']['node']][key]=v
  if overrides:
   for name,d in overrides.items():
    idx=next(i for i,n in enumerate(nodes) if n.get('name')==name)
    for key,v in d.items():trs[idx][key]=np.array(v)
  local=[]
  for i,n in enumerate(nodes):
   if 'matrix' in n:m=np.array(n['matrix']).reshape(4,4).T
   else:
    d=trs[i];m=np.eye(4);m[:3,:3]=Rotation.from_quat(d['rotation']).as_matrix()@np.diag(d['scale']);m[:3,3]=d['translation']
   local.append(m)
  world=[None]*len(nodes)
  def recur(i,par):
   world[i]=par@local[i]
   for child in nodes[i].get('children',[]):recur(child,world[i])
  for i in self.j['scenes'][self.j.get('scene',0)]['nodes']:recur(i,np.eye(4))
  return np.array(world),trs
 def geometry(self,time=None,overrides=None):
  world,trs=self.matrices(time,overrides);out=[]
  for ni,node in enumerate(self.j['nodes']):
   if 'mesh' not in node:continue
   for p in self.j['meshes'][node['mesh']]['primitives']:
    a=p['attributes'];pos=self.acc(a['POSITION']);n=self.acc(a['NORMAL']);uv=self.acc(a['TEXCOORD_0']);f=self.acc(p['indices']).reshape(-1,3).astype(int)
    if 'skin' in node:
     s=self.j['skins'][node['skin']];ib=self.acc(s['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1);bones=world[s['joints']]@ib;ji=self.acc(a['JOINTS_0']).astype(int);w=self.acc(a['WEIGHTS_0']);m=(bones[ji]*w[:,:,None,None]).sum(axis=1);pos=np.einsum('nij,nj->ni',m,np.c_[pos,np.ones(len(pos))])[:,:3];n=norm(np.einsum('nij,nj->ni',m[:,:3,:3],n))
    else:pos=(np.c_[pos,np.ones(len(pos))]@world[ni].T)[:,:3];n=norm(n@np.linalg.inv(world[ni][:3,:3]))
    out.append((pos,n,uv,f,p.get('material',0)))
  return out,world

_TEXTURE_CACHE = {}

def cached_textures(glb, color_idx, normal_idx, albedo, normal):
 key=(str(glb.path),color_idx,normal_idx,str(albedo),str(normal))
 if key not in _TEXTURE_CACHE:
  tex=np.array(Image.open(albedo).convert("RGBA") if albedo else glb.image(color_idx),np.float32)/255
  tex[:,:,:3]=srgb_to_linear(tex[:,:,:3])
  nt=np.array(Image.open(normal).convert("RGB") if normal else glb.image(normal_idx).convert("RGB"),np.float32)/255
  _TEXTURE_CACHE[key]=(tex,nt)
 return _TEXTURE_CACHE[key]

def sample(im,uv):
 h,w=im.shape[:2];u=np.clip(uv[:,0]*(w-1),0,w-1);v=np.clip(uv[:,1]*(h-1),0,h-1);x=np.floor(u).astype(int);y=np.floor(v).astype(int);xx=np.minimum(x+1,w-1);yy=np.minimum(y+1,h-1);fx=(u-x)[:,None];fy=(v-y)[:,None]
 return (im[y,x]*(1-fx)+im[y,xx]*fx)*(1-fy)+(im[yy,x]*(1-fx)+im[yy,xx]*fx)*fy

def render(glb,out,camera=(1,.2,1),target=None,time=None,width=1200,height=1200,span=None,albedo=None,normal=None,pose=None,debug=False,lighting=True,yaw=0,shadow=False):
 geo,world=glb.geometry(time,pose);R=Rotation.from_euler('y',yaw,degrees=True).as_matrix()
 geo=[(p@R.T,n@R.T,uv,f,mat) for p,n,uv,f,mat in geo];allp=np.concatenate([x[0] for x in geo]);lo=allp.min(axis=0);hi=allp.max(axis=0)
 auto_target=target is None
 if auto_target:target=(lo+hi)/2
 else:target=np.array(target,float)
 cam=norm(np.array(camera,float));right=norm(np.cross(np.array([0,1,0]),cam));up=np.cross(cam,right)
 flat=np.stack([(allp-target)@right,(allp-target)@up],axis=1)
 if auto_target:
  middle=(flat.min(axis=0)+flat.max(axis=0))/2;target=target+right*middle[0]+up*middle[1];flat-=middle
 if span is None:span=max(np.ptp(flat[:,1])*1.15,np.ptp(flat[:,0])*height/width*1.15)
 scale=height/span
 yy=np.linspace(0,1,height)[:,None,None];bg_top=np.array([.82,.87,.9]);bg_bottom=np.array([.93,.93,.9]);rgb=np.broadcast_to(srgb_to_linear(bg_top*(1-yy)+bg_bottom*yy),(height,width,3)).copy().astype(np.float32);zbuf=np.full((height,width),-np.inf,np.float32);mask=np.zeros((height,width),np.uint8)
 # A large broad daylight key and sky fill are constant in the model frame.
 key=norm(np.array([-.7,1.4,1.3]));fill=norm(np.array([1,.65,-.3]));view=cam
 if shadow and cam[1]>0:
  sh=Image.new('L',(width,height),0);draw=ImageDraw.Draw(sh);ground=lo[1]
  for pp,_,_,ff,_ in geo:
   projected=pp.copy();dy=pp[:,1]-ground;projected-=dy[:,None]*key[None,:]/key[1];sx=(projected-target)@right*scale+width/2;sy=height/2-(projected-target)@up*scale
   for inds in ff:draw.polygon([(float(sx[i]),float(sy[i])) for i in inds],fill=255)
  soft=np.array(sh.filter(ImageFilter.GaussianBlur(max(2,width*.008))),np.float32)/255
  contact=np.array(sh.filter(ImageFilter.GaussianBlur(max(1,width*.0025))),np.float32)/255
  rgb*=1-(soft*.11+contact*.035)[:,:,None]
 
 for pos,ns,uv,faces,matidx in geo:
  mat=glb.j['materials'][matidx];pbr=mat.get('pbrMetallicRoughness',{});color_idx=glb.j['textures'][pbr['baseColorTexture']['index']]['source'];normal_idx=glb.j['textures'][mat['normalTexture']['index']]['source']
  tex,nt=cached_textures(glb,color_idx,normal_idx,albedo,normal)
  xy=np.stack([(pos-target)@right*scale+width/2,height/2-(pos-target)@up*scale],axis=1);zz=(pos-target)@cam
  for inds in faces[np.argsort(zz[faces].mean(axis=1))]:
   tri=xy[inds];z=zz[inds];xmin=max(0,int(np.floor(tri[:,0].min())));xmax=min(width-1,int(np.ceil(tri[:,0].max())));ymin=max(0,int(np.floor(tri[:,1].min())));ymax=min(height-1,int(np.ceil(tri[:,1].max())))
   if xmin>xmax or ymin>ymax:continue
   ax,ay=tri[0];bx,by=tri[1];cx,cy=tri[2];den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
   if abs(den)<1e-6:continue
   gy,gx=np.mgrid[ymin:ymax+1,xmin:xmax+1];gx=gx+.5;gy=gy+.5;w0=((by-cy)*(gx-cx)+(cx-bx)*(gy-cy))/den;w1=((cy-ay)*(gx-cx)+(ax-cx)*(gy-cy))/den;w2=1-w0-w1;inside=(w0>=-1e-6)&(w1>=-1e-6)&(w2>=-1e-6);depth=w0*z[0]+w1*z[1]+w2*z[2];inside&=depth>zbuf[ymin:ymax+1,xmin:xmax+1]
   if not inside.any():continue
   ys,xs=np.where(inside);weights=np.stack([w0[inside],w1[inside],w2[inside]],axis=1);uvs=weights@uv[inds];col=sample(tex,uvs);keep=col[:,3]>.08
   if not keep.any():continue
   ys=ys[keep];xs=xs[keep];weights=weights[keep];uvs=uvs[keep];col=col[keep];N=norm(weights@ns[inds]);edge1=pos[inds[1]]-pos[inds[0]];edge2=pos[inds[2]]-pos[inds[0]];duv1=uv[inds[1]]-uv[inds[0]];duv2=uv[inds[2]]-uv[inds[0]];det=duv1[0]*duv2[1]-duv1[1]*duv2[0]
   if abs(det)>1e-10:
    T=(edge1*duv2[1]-edge2*duv1[1])/det;B=(edge2*duv1[0]-edge1*duv2[0])/det;T=norm(T-N*(N@T)[:,None]);hand=np.where(np.sum(np.cross(N,T)*B,axis=1)<0,-1,1);B=np.cross(N,T)*hand[:,None];nm=sample(nt,uvs)*2-1;N=norm(T*nm[:,0,None]+B*nm[:,1,None]+N*nm[:,2,None])
   # double sided geometry follows glTF double-sided normal inversion
   face_normal=np.cross(edge1,edge2)
   if np.dot(face_normal,cam)<0:N=-N
   if lighting:
    ndotl=np.maximum(N@key,0);ndotf=np.maximum(N@fill,0);ambient=.49+.07*np.maximum(N[:,1],0);illum=ambient+.43*ndotl+.12*ndotf;rgbcol=col[:,:3]*illum[:,None]
    halfv=norm(key+view);spec=.017*np.maximum(N@halfv,0)**28;rgbcol+=spec[:,None]
   else:rgbcol=col[:,:3]
   abs_y=ys+ymin;abs_x=xs+xmin;alpha=np.clip(col[:,3],0,1)[:,None];rgb[abs_y,abs_x]=rgbcol*alpha+rgb[abs_y,abs_x]*(1-alpha);zbuf[abs_y,abs_x]=depth[ys,xs];mask[abs_y,abs_x]=255
 im=Image.fromarray(np.uint8(np.clip(linear_to_srgb(rgb),0,1)*255));Path(out).parent.mkdir(parents=True,exist_ok=True);im.save(out)
 if debug:Image.fromarray(mask).save(str(Path(out).with_name(Path(out).stem+'_mask.png')))
 print(json.dumps({'path':str(out),'bounds':[lo.tolist(),hi.tolist()],'target':target.tolist(),'span':float(span),'camera':cam.tolist(),'time':time}),flush=True)
 return im

def main():
 p=argparse.ArgumentParser();p.add_argument('glb');p.add_argument('out');p.add_argument('--camera',nargs=3,type=float,default=[1,.2,1]);p.add_argument('--target',nargs=3,type=float);p.add_argument('--time',type=float);p.add_argument('--span',type=float);p.add_argument('--width',type=int,default=1200);p.add_argument('--height',type=int,default=1200);p.add_argument('--albedo');p.add_argument('--normal');p.add_argument('--pose');p.add_argument('--yaw',type=float,default=0);p.add_argument('--shadow',action='store_true');p.add_argument('--unlit',action='store_true');args=p.parse_args();render(GLB(args.glb),args.out,camera=args.camera,target=args.target,time=args.time,width=args.width,height=args.height,span=args.span,albedo=args.albedo,normal=args.normal,pose=json.loads(Path(args.pose).read_text()) if args.pose else None,lighting=not args.unlit,yaw=args.yaw,shadow=args.shadow)
if __name__=='__main__':main()
