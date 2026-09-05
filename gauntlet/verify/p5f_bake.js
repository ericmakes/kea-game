/* P5F PATH A FALLBACK — THE BAKE, allocation-free inner loop.
   For each texel of OUR atlas: the surface point of OUR mesh that owns it -> Astra's space ->
   nearest point on ASTRA's surface (normal-agreement required, so a body texel cannot pull colour
   off a floating alpha feather card facing the other way) -> Astra's UV there -> sample. */
const {readGLB,accessor}=require(process.env.S+'/glb.js');
const {decodePNG,sample}=require(process.env.S+'/png.js');
const fs=require('fs'), zlib=require('zlib');
const SIZE=+(process.env.SIZE||2048), MAP=process.env.MAP||'Kea_BaseColour';
const OUT=process.env.OUT||(process.env.S+'/baked_'+MAP+'_'+SIZE+'.png');
const t0=Date.now();

function loadMesh(f){
  const g=readGLB(f), j=g.json, p=j.meshes[0].primitives[0];
  const pos=accessor(g,p.attributes.POSITION), uv=accessor(g,p.attributes.TEXCOORD_0);
  const nor=p.attributes.NORMAL!==undefined?accessor(g,p.attributes.NORMAL):null;
  const idx=p.indices!==undefined?accessor(g,p.indices):null;
  const nT=idx?idx.length/3:pos.length/9;
  return {pos,uv,nor,idx,nT};
}
const OURS=loadMesh('assets/models/kea_bill.glb'), AST=loadMesh('assets/models/kea_astra.glb');
const S3=JSON.parse(fs.readFileSync(process.env.S+'/affine.json','utf8'));
const img=decodePNG(process.env.S+'/'+MAP+'.png');
console.log('source '+MAP+' '+img.W+'x'+img.H+' ch'+img.ch+'  ->  target '+SIZE+'x'+SIZE);

/* --- Astra triangles flattened into typed arrays --- */
const nT=AST.nT;
const TP=new Float32Array(nT*9), TU=new Float32Array(nT*6), TN=new Float32Array(nT*3);
for(let t=0;t<nT;t++){
  const a=AST.idx?AST.idx[t*3]:t*3, b=AST.idx?AST.idx[t*3+1]:t*3+1, c=AST.idx?AST.idx[t*3+2]:t*3+2;
  const ix=[a,b,c];
  for(let k=0;k<3;k++){ const v=ix[k];
    TP[t*9+k*3]=AST.pos[v*3]; TP[t*9+k*3+1]=AST.pos[v*3+1]; TP[t*9+k*3+2]=AST.pos[v*3+2];
    TU[t*6+k*2]=AST.uv[v*2];  TU[t*6+k*2+1]=AST.uv[v*2+1]; }
  const e1x=TP[t*9+3]-TP[t*9], e1y=TP[t*9+4]-TP[t*9+1], e1z=TP[t*9+5]-TP[t*9+2];
  const e2x=TP[t*9+6]-TP[t*9], e2y=TP[t*9+7]-TP[t*9+1], e2z=TP[t*9+8]-TP[t*9+2];
  let nx=e1y*e2z-e1z*e2y, ny=e1z*e2x-e1x*e2z, nz=e1x*e2y-e1y*e2x;
  const L=Math.hypot(nx,ny,nz)||1; TN[t*3]=nx/L; TN[t*3+1]=ny/L; TN[t*3+2]=nz/L;
}
/* --- uniform grid, CSR-packed --- */
const CELL=3.0;
let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
for(let i=0;i<nT*3;i++)for(let k=0;k<3;k++){const v=TP[i*3+k];if(v<lo[k])lo[k]=v;if(v>hi[k])hi[k]=v;}
const dim=[0,1,2].map(k=>Math.max(1,Math.ceil((hi[k]-lo[k])/CELL)+1));
const NC=dim[0]*dim[1]*dim[2];
const cnt=new Int32Array(NC+1);
const cellsOf=t=>{ let a0=1e9,a1=1e9,a2=1e9,b0=-1e9,b1=-1e9,b2=-1e9;
  for(let k=0;k<3;k++){const x=TP[t*9+k*3],y=TP[t*9+k*3+1],z=TP[t*9+k*3+2];
    if(x<a0)a0=x; if(x>b0)b0=x; if(y<a1)a1=y; if(y>b1)b1=y; if(z<a2)a2=z; if(z>b2)b2=z;}
  return [Math.floor((a0-lo[0])/CELL),Math.floor((a1-lo[1])/CELL),Math.floor((a2-lo[2])/CELL),
          Math.floor((b0-lo[0])/CELL),Math.floor((b1-lo[1])/CELL),Math.floor((b2-lo[2])/CELL)];};
for(let t=0;t<nT;t++){const c=cellsOf(t);
  for(let z=c[2];z<=c[5];z++)for(let y=c[1];y<=c[4];y++)for(let x=c[0];x<=c[3];x++)
    cnt[x+dim[0]*(y+dim[1]*z)+1]++;}
for(let i=0;i<NC;i++)cnt[i+1]+=cnt[i];
const items=new Int32Array(cnt[NC]); const fill=cnt.slice(0,NC);
for(let t=0;t<nT;t++){const c=cellsOf(t);
  for(let z=c[2];z<=c[5];z++)for(let y=c[1];y<=c[4];y++)for(let x=c[0];x<=c[3];x++){
    const ci=x+dim[0]*(y+dim[1]*z); items[fill[ci]++]=t;}}
console.log('grid '+dim.join('x')+'  '+items.length+' entries for '+nT+' triangles  ('+((Date.now()-t0)/1000).toFixed(1)+'s)');

/* --- allocation-free closest-point-on-triangle; writes into OUTQ --- */
const OUTQ=new Float64Array(6); // qx,qy,qz,b0,b1,b2
function closestOnTri(t,px,py,pz){
  const o=t*9;
  const ax=TP[o],ay=TP[o+1],az=TP[o+2], bx=TP[o+3],by=TP[o+4],bz=TP[o+5], cx=TP[o+6],cy=TP[o+7],cz=TP[o+8];
  const abx=bx-ax,aby=by-ay,abz=bz-az, acx=cx-ax,acy=cy-ay,acz=cz-az;
  let px0=px-ax,py0=py-ay,pz0=pz-az;
  const d1=abx*px0+aby*py0+abz*pz0, d2=acx*px0+acy*py0+acz*pz0;
  if(d1<=0&&d2<=0){OUTQ[0]=ax;OUTQ[1]=ay;OUTQ[2]=az;OUTQ[3]=1;OUTQ[4]=0;OUTQ[5]=0;return;}
  let bpx=px-bx,bpy=py-by,bpz=pz-bz;
  const d3=abx*bpx+aby*bpy+abz*bpz, d4=acx*bpx+acy*bpy+acz*bpz;
  if(d3>=0&&d4<=d3){OUTQ[0]=bx;OUTQ[1]=by;OUTQ[2]=bz;OUTQ[3]=0;OUTQ[4]=1;OUTQ[5]=0;return;}
  const vc=d1*d4-d3*d2;
  if(vc<=0&&d1>=0&&d3<=0){const v=d1/(d1-d3);
    OUTQ[0]=ax+v*abx;OUTQ[1]=ay+v*aby;OUTQ[2]=az+v*abz;OUTQ[3]=1-v;OUTQ[4]=v;OUTQ[5]=0;return;}
  let cpx=px-cx,cpy=py-cy,cpz=pz-cz;
  const d5=abx*cpx+aby*cpy+abz*cpz, d6=acx*cpx+acy*cpy+acz*cpz;
  if(d6>=0&&d5<=d6){OUTQ[0]=cx;OUTQ[1]=cy;OUTQ[2]=cz;OUTQ[3]=0;OUTQ[4]=0;OUTQ[5]=1;return;}
  const vb=d5*d2-d1*d6;
  if(vb<=0&&d2>=0&&d6<=0){const w=d2/(d2-d6);
    OUTQ[0]=ax+w*acx;OUTQ[1]=ay+w*acy;OUTQ[2]=az+w*acz;OUTQ[3]=1-w;OUTQ[4]=0;OUTQ[5]=w;return;}
  const va=d3*d6-d5*d4;
  if(va<=0&&(d4-d3)>=0&&(d5-d6)>=0){const w=(d4-d3)/((d4-d3)+(d5-d6));
    OUTQ[0]=bx+w*(cx-bx);OUTQ[1]=by+w*(cy-by);OUTQ[2]=bz+w*(cz-bz);OUTQ[3]=0;OUTQ[4]=1-w;OUTQ[5]=w;return;}
  const den=1/(va+vb+vc), v=vb*den, w=vc*den;
  OUTQ[0]=ax+abx*v+acx*w;OUTQ[1]=ay+aby*v+acy*w;OUTQ[2]=az+abz*v+acz*w;
  OUTQ[3]=1-v-w;OUTQ[4]=v;OUTQ[5]=w;
}
const HIT=new Float64Array(4); // tri, b0,b1,b2
function nearest(px,py,pz,nx,ny,nz){
  const gx=Math.floor((px-lo[0])/CELL), gy=Math.floor((py-lo[1])/CELL), gz=Math.floor((pz-lo[2])/CELL);
  let bestScore=Infinity, bestD=Infinity, bestT=-1, b0=0,b1=0,b2=0;
  for(let r=1;r<=10;r++){
    for(let z=gz-r;z<=gz+r;z++){ if(z<0||z>=dim[2])continue;
      for(let y=gy-r;y<=gy+r;y++){ if(y<0||y>=dim[1])continue;
        for(let x=gx-r;x<=gx+r;x++){ if(x<0||x>=dim[0])continue;
          if(r>1&&Math.abs(x-gx)<r&&Math.abs(y-gy)<r&&Math.abs(z-gz)<r)continue;
          const ci=x+dim[0]*(y+dim[1]*z);
          for(let ii=cnt[ci];ii<cnt[ci+1];ii++){ const t=items[ii];
            const dot=TN[t*3]*nx+TN[t*3+1]*ny+TN[t*3+2]*nz;
            if(dot<0.15)continue;
            closestOnTri(t,px,py,pz);
            const dx=OUTQ[0]-px, dy=OUTQ[1]-py, dz=OUTQ[2]-pz;
            const d=Math.sqrt(dx*dx+dy*dy+dz*dz);
            const score=d-2.0*dot;
            if(score<bestScore){bestScore=score;bestD=d;bestT=t;b0=OUTQ[3];b1=OUTQ[4];b2=OUTQ[5];}
          }}}}
    if(bestT>=0&&bestD<r*CELL)break;
  }
  HIT[0]=bestT;HIT[1]=b0;HIT[2]=b1;HIT[3]=b2; return bestD;
}

/* --- rasterise OUR UV triangles --- */
const px=Buffer.alloc(SIZE*SIZE*4), cov=new Uint8Array(SIZE*SIZE);
let done=0, miss=0, far=0, maxd=0, sumd=0, nq=0;
const oT=OURS.nT;
for(let t=0;t<oT;t++){
  const a=OURS.idx?OURS.idx[t*3]:t*3, b=OURS.idx?OURS.idx[t*3+1]:t*3+1, c=OURS.idx?OURS.idx[t*3+2]:t*3+2;
  const ix=[a,b,c];
  const ux=[],uy=[],wx=[],wy=[],wz=[],nxA=[],nyA=[],nzA=[];
  for(let k=0;k<3;k++){ const v=ix[k];
    ux.push(OURS.uv[v*2]*(SIZE-1)); uy.push(OURS.uv[v*2+1]*(SIZE-1));
    const X=OURS.pos[v*3],Y=OURS.pos[v*3+1],Z=OURS.pos[v*3+2];
    wx.push(S3[0][0]*X+S3[0][1]*Y+S3[0][2]*Z+S3[0][3]);
    wy.push(S3[1][0]*X+S3[1][1]*Y+S3[1][2]*Z+S3[1][3]);
    wz.push(S3[2][0]*X+S3[2][1]*Y+S3[2][2]*Z+S3[2][3]);
    const NX=OURS.nor?OURS.nor[v*3]:0, NY=OURS.nor?OURS.nor[v*3+1]:1, NZ=OURS.nor?OURS.nor[v*3+2]:0;
    nxA.push(S3[0][0]*NX+S3[0][1]*NY+S3[0][2]*NZ);
    nyA.push(S3[1][0]*NX+S3[1][1]*NY+S3[1][2]*NZ);
    nzA.push(S3[2][0]*NX+S3[2][1]*NY+S3[2][2]*NZ); }
  const det=(ux[1]-ux[0])*(uy[2]-uy[0])-(ux[2]-ux[0])*(uy[1]-uy[0]);
  if(Math.abs(det)<1e-12)continue;
  const x0=Math.max(0,Math.floor(Math.min(ux[0],ux[1],ux[2]))-1);
  const x1=Math.min(SIZE-1,Math.ceil(Math.max(ux[0],ux[1],ux[2]))+1);
  const y0=Math.max(0,Math.floor(Math.min(uy[0],uy[1],uy[2]))-1);
  const y1=Math.min(SIZE-1,Math.ceil(Math.max(uy[0],uy[1],uy[2]))+1);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const o=y*SIZE+x; if(cov[o])continue;
    const cxp=x+0.5, cyp=y+0.5;
    const l1=((ux[1]-cxp)*(uy[2]-cyp)-(ux[2]-cxp)*(uy[1]-cyp))/det;
    const l2=((ux[2]-cxp)*(uy[0]-cyp)-(ux[0]-cxp)*(uy[2]-cyp))/det;
    const l3=1-l1-l2;
    if(l1<-0.35||l2<-0.35||l3<-0.35)continue;
    const wxp=l1*wx[0]+l2*wx[1]+l3*wx[2], wyp=l1*wy[0]+l2*wy[1]+l3*wy[2], wzp=l1*wz[0]+l2*wz[1]+l3*wz[2];
    let nx=l1*nxA[0]+l2*nxA[1]+l3*nxA[2], ny=l1*nyA[0]+l2*nyA[1]+l3*nyA[2], nz=l1*nzA[0]+l2*nzA[1]+l3*nzA[2];
    const nl=Math.hypot(nx,ny,nz)||1; nx/=nl;ny/=nl;nz/=nl;
    const d=nearest(wxp,wyp,wzp,nx,ny,nz);
    if(HIT[0]<0){miss++;cov[o]=1;continue;}
    sumd+=d;nq++; if(d>maxd)maxd=d; if(d>6)far++;
    const tt=HIT[0];
    const U=HIT[1]*TU[tt*6]+HIT[2]*TU[tt*6+2]+HIT[3]*TU[tt*6+4];
    const V=HIT[1]*TU[tt*6+1]+HIT[2]*TU[tt*6+3]+HIT[3]*TU[tt*6+5];
    const col=sample(img,U,V);
    px[o*4]=col[0];px[o*4+1]=col[1];px[o*4+2]=col[2];px[o*4+3]=col[3];
    cov[o]=2;done++;
  }
}
console.log('painted '+done+' texels ('+(100*done/(SIZE*SIZE)).toFixed(1)+'% of atlas), '+miss+' found no Astra surface   ('+((Date.now()-t0)/1000).toFixed(1)+'s)');
console.log('proximity: mean '+(sumd/nq).toFixed(2)+' units, max '+maxd.toFixed(2)+', '+far+' texels ('+(100*far/nq).toFixed(2)+'%) pulled from >6 units');

/* --- dilate --- */
let filled=0;
for(let pass=0;pass<16;pass++){
  const add=[];
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const o=y*SIZE+x; if(cov[o]===2)continue;
    let r=0,g=0,b=0,a=0,m=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy; if(xx<0||yy<0||xx>=SIZE||yy>=SIZE)continue;
      const oo=yy*SIZE+xx; if(cov[oo]!==2)continue;
      r+=px[oo*4];g+=px[oo*4+1];b+=px[oo*4+2];a+=px[oo*4+3];m++;}
    if(m)add.push(o,r/m,g/m,b/m,a/m);
  }
  if(!add.length)break;
  for(let i=0;i<add.length;i+=5){const o=add[i];
    px[o*4]=add[i+1];px[o*4+1]=add[i+2];px[o*4+2]=add[i+3];px[o*4+3]=add[i+4];cov[o]=2;filled++;}
}
console.log('dilation filled '+filled+' margin texels');

/* --- write PNG --- */
const stride=SIZE*4, raw=Buffer.alloc(SIZE*(stride+1));
for(let y=0;y<SIZE;y++){raw[y*(stride+1)]=0; px.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);}
let TBL=null;
function crc(buf){ if(!TBL){TBL=new Int32Array(256);
  for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;TBL[n]=c;}}
  let c=-1; for(let i=0;i<buf.length;i++)c=TBL[(c^buf[i])&255]^(c>>>8); return c^-1;}
function chunk(type,data){const b=Buffer.alloc(8+data.length+4);b.writeUInt32BE(data.length,0);
  b.write(type,4,'ascii');data.copy(b,8);
  b.writeUInt32BE(crc(Buffer.concat([Buffer.from(type,'ascii'),data]))>>>0,8+data.length);return b;}
const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(SIZE,0); ihdr.writeUInt32BE(SIZE,4);
ihdr[8]=8;ihdr[9]=6;
fs.writeFileSync(OUT,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]));
console.log('wrote '+OUT+'  '+fs.statSync(OUT).size+' bytes   total '+((Date.now()-t0)/1000).toFixed(1)+'s');
