/* GLBDIFF — what actually changed between two .glb files, semantically.
   Usage: node gauntlet/verify/glbdiff.mjs BASE.glb CANDIDATE.glb [--expect images|posnorm]
          JSON=1 ... for machine-readable output

   WHY THIS IS NOT A BYTE COMPARE. A texture pass legitimately rewrites container bookkeeping: new
   PNG payloads are appended, so image bufferView offsets and lengths move and the buffer's
   byteLength grows. A byte compare says "everything after offset N differs" and tells you nothing.
   What the gate actually needs to know is whether any MEANING changed — did a vertex move, did a
   UV shift, did a joint get renamed, did a weight change — and that question is answered by
   extracting each accessor's VALUES and each image's PAYLOAD and comparing those, not the bytes
   that happen to carry them.

   SO CONTAINER BOOKKEEPING IS DELIBERATELY NOT COMPARED DIRECTLY. It is validated indirectly and
   more strongly: if an offset were wrong, the accessor values read through it would differ, and
   that is what gets reported. Raw JSON differences are still enumerated, but classified, so an
   expected offset move does not read as a defect and an unexpected material change cannot hide
   among forty of them.

   THE VERDICT IS THE POINT. `--expect images` passes only if image payloads are the ONLY thing
   that moved; `--expect posnorm` only if POSITION and NORMAL accessor values are. Anything else —
   a changed index, a nudged UV, a renamed bone, an extra animation channel — is a rejection with
   the path named. */
import fs from 'fs';
import crypto from 'crypto';

const CT={5120:{n:1,g:(b,o)=>b.readInt8(o)},5121:{n:1,g:(b,o)=>b.readUInt8(o)},
  5122:{n:2,g:(b,o)=>b.readInt16LE(o)},5123:{n:2,g:(b,o)=>b.readUInt16LE(o)},
  5125:{n:4,g:(b,o)=>b.readUInt32LE(o)},5126:{n:4,g:(b,o)=>b.readFloatLE(o)}};
const NC={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};

export function parseGLB(path){
  const buf=fs.readFileSync(path);
  if(buf.readUInt32LE(0)!==0x46546C67)throw new Error(path+': not a glb');
  let off=12, json=null, bin=null;
  while(off+8<=buf.length){
    const len=buf.readUInt32LE(off), type=buf.readUInt32LE(off+4);
    const data=buf.slice(off+8,off+8+len);
    if(type===0x4E4F534A)json=JSON.parse(data.toString('utf8'));
    else if(type===0x004E4942)bin=data;
    off+=8+len+((len%4)?(4-(len%4)):0);
  }
  if(!json)throw new Error(path+': no JSON chunk');
  return {path,json,bin:bin||Buffer.alloc(0),bytes:buf.length,
          md5:crypto.createHash('md5').update(buf).digest('hex'),
          sha256:crypto.createHash('sha256').update(buf).digest('hex')};
}

/* ACCESSOR VALUES, read through the bufferView the way a loader would — stride included, because a
   change of stride with compensating offsets is still the same data and must not read as a diff. */
export function accessorValues(g,i){
  const a=g.json.accessors[i];
  if(a.bufferView===undefined)return {a,vals:null,note:'no bufferView (zero-filled or sparse)'};
  const bv=g.json.bufferViews[a.bufferView];
  const ct=CT[a.componentType]; const nc=NC[a.type];
  const elem=ct.n*nc;
  const stride=bv.byteStride||elem;
  const base=(bv.byteOffset||0)+(a.byteOffset||0);
  const out=new Array(a.count*nc);
  for(let k=0;k<a.count;k++)for(let c=0;c<nc;c++)
    out[k*nc+c]=ct.g(g.bin,base+k*stride+c*ct.n);
  return {a,vals:out,nc};
}
export function imageBytes(g,i){
  const im=g.json.images[i];
  if(im.bufferView===undefined)return {note:'external uri: '+(im.uri||'?'),buf:null};
  const bv=g.json.bufferViews[im.bufferView];
  const b=g.bin.slice(bv.byteOffset||0,(bv.byteOffset||0)+bv.byteLength);
  return {buf:b,md5:crypto.createHash('md5').update(b).digest('hex'),bytes:b.length,
          mime:im.mimeType||'?'};
}

/* WHICH ATTRIBUTE IS THIS ACCESSOR? Reported by NAME rather than by index, because "accessor 0
   changed" is not a finding a reviewer can act on and "POSITION changed" is. */
function accessorRoles(g){
  const role={};
  const put=(i,s)=>{ if(i===undefined)return; role[i]=role[i]?role[i]+'+'+s:s; };
  (g.json.meshes||[]).forEach((m,mi)=>m.primitives.forEach((p,pi)=>{
    for(const [k,v] of Object.entries(p.attributes||{}))put(v,'mesh'+mi+'/prim'+pi+':'+k);
    put(p.indices,'mesh'+mi+'/prim'+pi+':INDICES');
  }));
  (g.json.skins||[]).forEach((s,si)=>put(s.inverseBindMatrices,'skin'+si+':IBM'));
  (g.json.animations||[]).forEach((an,ai)=>{
    (an.samplers||[]).forEach((sm,mi)=>{ put(sm.input,'anim'+ai+'/s'+mi+':input');
      put(sm.output,'anim'+ai+'/s'+mi+':output'); }); });
  return role;
}

/* A DEEP JSON DIFF THAT IGNORES NOTHING BUT CLASSIFIES EVERYTHING. */
function jsonDiff(a,b,path,out){
  if(a===b)return out;
  const ta=Array.isArray(a)?'array':(a===null?'null':typeof a);
  const tb=Array.isArray(b)?'array':(b===null?'null':typeof b);
  if(ta!==tb||ta!=='object'&&ta!=='array'){
    if(a!==b)out.push({path,from:a,to:b}); return out; }
  const keys=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);
  for(const k of keys)jsonDiff(a?a[k]:undefined,b?b[k]:undefined,path?path+'.'+k:k,out);
  return out;
}
/* CONTAINER BOOKKEEPING: the paths a texture swap is ALLOWED to move. Named narrowly on purpose —
   `buffers.*.byteLength` and the byteOffset/byteLength of a bufferView that an IMAGE uses. */
function classifyJson(diffs,base,cand){
  const imgViews=new Set();
  for(const g of [base,cand])for(const im of (g.json.images||[]))
    if(im.bufferView!==undefined)imgViews.add(im.bufferView);
  const book=[], real=[];
  for(const d of diffs){
    let m;
    if(/^buffers\.\d+\.byteLength$/.test(d.path)){ book.push(d); continue; }
    if((m=d.path.match(/^bufferViews\.(\d+)\.(byteOffset|byteLength)$/))&&imgViews.has(+m[1])){
      book.push(d); continue; }
    real.push(d);
  }
  return {book,real};
}

export function diffGLB(basePath,candPath){
  const A=parseGLB(basePath), B=parseGLB(candPath);
  const rep={base:{path:basePath,md5:A.md5,sha256:A.sha256,bytes:A.bytes},
             cand:{path:candPath,md5:B.md5,sha256:B.sha256,bytes:B.bytes},
             counts:{}, accessors:[], images:[], json:{}, structure:[]};
  /* STRUCTURE FIRST. If the counts differ, nothing below is comparable index by index and saying
     so is more useful than 400 spurious diffs. */
  for(const k of ['accessors','bufferViews','meshes','materials','textures','images','samplers',
                  'nodes','skins','animations','buffers','scenes']){
    const na=(A.json[k]||[]).length, nb=(B.json[k]||[]).length;
    rep.counts[k]=[na,nb];
    if(na!==nb)rep.structure.push(k+' count '+na+' -> '+nb);
  }
  const roleA=accessorRoles(A), roleB=accessorRoles(B);
  if(!rep.structure.length){
    for(let i=0;i<A.json.accessors.length;i++){
      const va=accessorValues(A,i), vb=accessorValues(B,i);
      const role=roleA[i]||roleB[i]||'(unreferenced)';
      if(roleA[i]!==roleB[i])rep.structure.push('accessor '+i+' role '+roleA[i]+' -> '+roleB[i]);
      let changed=false, n=0, maxAbs=0, firstAt=-1;
      if(!va.vals||!vb.vals){ changed=JSON.stringify(va.note)!==JSON.stringify(vb.note); }
      else if(va.vals.length!==vb.vals.length){ changed=true; }
      else {
        for(let k=0;k<va.vals.length;k++)if(va.vals[k]!==vb.vals[k]){
          changed=true; n++; const d=Math.abs(va.vals[k]-vb.vals[k]);
          if(d>maxAbs)maxAbs=d; if(firstAt<0)firstAt=k; }
      }
      rep.accessors.push({i,role,type:A.json.accessors[i].type,
        comp:A.json.accessors[i].componentType,count:A.json.accessors[i].count,
        changed,elemsChanged:n,maxAbsDelta:+maxAbs.toFixed(6),firstAt});
    }
    for(let i=0;i<(A.json.images||[]).length;i++){
      const ia=imageBytes(A,i), ib=imageBytes(B,i);
      rep.images.push({i,mime:ia.mime,baseBytes:ia.bytes,candBytes:ib.bytes,
        baseMd5:ia.md5,candMd5:ib.md5,changed:ia.md5!==ib.md5});
    }
  }
  const all=jsonDiff(A.json,B.json,'',[]);
  const cls=classifyJson(all,A,B);
  rep.json={total:all.length,bookkeeping:cls.book.length,
            real:cls.real.slice(0,60),realTotal:cls.real.length};
  return rep;
}

export function verdict(rep,expect){
  const accChanged=rep.accessors.filter(a=>a.changed);
  const imgChanged=rep.images.filter(x=>x.changed);
  const fails=[];
  if(rep.structure.length)fails.push('STRUCTURE MOVED: '+rep.structure.join('; '));
  if(rep.json.realTotal)fails.push(rep.json.realTotal+' JSON change(s) outside container '+
    'bookkeeping: '+rep.json.real.slice(0,6).map(d=>d.path).join(', '));
  if(expect==='images'){
    if(accChanged.length)fails.push('ACCESSOR VALUES MOVED (a texture pass must not touch geometry): '+
      accChanged.map(a=>a.role+' ['+a.elemsChanged+' elems]').join(', '));
    if(!imgChanged.length)fails.push('no image payload changed at all — nothing was delivered');
  } else if(expect==='posnorm'){
    const bad=accChanged.filter(a=>!/:(POSITION|NORMAL)$/.test(a.role));
    if(bad.length)fails.push('ACCESSORS OTHER THAN POSITION/NORMAL MOVED: '+
      bad.map(a=>a.role+' ['+a.elemsChanged+' elems]').join(', '));
    if(imgChanged.length)fails.push('IMAGE PAYLOADS MOVED (a geometry pass must not repaint): '+
      imgChanged.map(x=>'image'+x.i).join(', '));
    if(!accChanged.length)fails.push('no accessor changed at all — nothing was delivered');
  }
  return {ok:fails.length===0,fails,
          accChanged:accChanged.map(a=>({role:a.role,elems:a.elemsChanged,maxDelta:a.maxAbsDelta})),
          imgChanged:imgChanged.map(x=>({i:x.i,bytes:[x.baseBytes,x.candBytes]}))};
}

const _a=process.argv;
if((_a[1]||'').endsWith('glbdiff.mjs')){
  const [,,base,cand]=_a;
  const ex=(_a.indexOf('--expect')>0)?_a[_a.indexOf('--expect')+1]:null;
  const rep=diffGLB(base,cand);
  const v=ex?verdict(rep,ex):null;
  if(process.env.JSON){ console.log(JSON.stringify({rep,v},null,1)); }
  else {
    console.log('GLBDIFF');
    console.log('  base  '+base);
    console.log('        md5 '+rep.base.md5+'  '+rep.base.bytes.toLocaleString('en-US')+' bytes');
    console.log('  cand  '+cand);
    console.log('        md5 '+rep.cand.md5+'  '+rep.cand.bytes.toLocaleString('en-US')+' bytes');
    console.log('  counts identical: '+(rep.structure.length?'NO — '+rep.structure.join('; '):'yes'));
    console.log('  JSON changes: '+rep.json.total+' total, '+rep.json.bookkeeping+
      ' container bookkeeping, '+rep.json.realTotal+' other');
    for(const d of rep.json.real.slice(0,10))
      console.log('      '+d.path+'   '+JSON.stringify(d.from)+' -> '+JSON.stringify(d.to));
    const ac=rep.accessors.filter(a=>a.changed);
    console.log('  accessors changed: '+ac.length+' of '+rep.accessors.length);
    for(const a of ac)console.log('      '+a.role+'  '+a.type+'  '+a.elemsChanged+
      ' of '+(a.count*NC[a.type])+' components, max |delta| '+a.maxAbsDelta);
    const ic=rep.images.filter(x=>x.changed);
    console.log('  images changed: '+ic.length+' of '+rep.images.length);
    for(const x of ic)console.log('      image'+x.i+' '+x.mime+'  '+
      x.baseBytes.toLocaleString('en-US')+' -> '+x.candBytes.toLocaleString('en-US')+' bytes');
    if(v){ console.log('');
      console.log('  EXPECT '+ex+' -> '+(v.ok?'ACCEPT':'REJECT'));
      for(const f of v.fails)console.log('      ✗ '+f); }
  }
  process.exit(v&&!v.ok?1:0);
}
