/* GLBDIFF SELFTEST — can it tell the difference it claims to?
   Usage: node gauntlet/verify/glbdiff-selftest.mjs

   This instrument is a GATE on incoming third-party assets: it decides whether a delivery is
   accepted or rejected. So it gets the same treatment every other instrument in this tree got —
   controls in both directions, on files whose answer is known by construction, because a gate that
   accepts everything and a gate that rejects everything both look like a working gate on a good
   delivery. The mutations below are surgical: each edits exactly one kind of byte in a real GLB and
   asserts the verdict flips for the right reason. */
import fs from 'fs';
import { parseGLB, diffGLB, verdict, accessorValues } from './glbdiff.mjs';

const BILL='assets/models/kea_bill.glb';
const T1B='assets/models/astra_incoming/astra_kea_task1b_skin/kea_bill_skin.glb';
const T3='assets/models/astra_incoming/astra_kea_task3_face_geometry/kea_bill_face_geometry.glb';
const TMP='/tmp/glbdiff-selftest'; fs.mkdirSync(TMP,{recursive:true});
let bad=0;
const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)bad++; return !!c; };
console.log('GLBDIFF SELFTEST');

/* ---- 0. THE POSITIVE CONTROL: a file against itself must be silent ---- */
{
  const r=diffGLB(BILL,BILL);
  const anyAcc=r.accessors.some(a=>a.changed), anyImg=r.images.some(x=>x.changed);
  ok(!anyAcc&&!anyImg&&r.json.total===0&&!r.structure.length,
     'a file diffed against ITSELF reports nothing changed — without this, a gate that sees '+
     'differences everywhere would look like it was working');
  ok(verdict(r,'images').fails.some(f=>/nothing was delivered/.test(f)),
     'and "expect images" REJECTS it, because an identical file delivered nothing');
}

/* ---- 1. THE REAL DELIVERIES, which is the other half of the control ---- */
{
  const a=verdict(diffGLB(BILL,T1B),'images');
  ok(a.ok,'the real Task 1b texture pass ACCEPTS under "expect images" ('+
     a.imgChanged.length+' images moved, no accessors)');
  const b=verdict(diffGLB(T1B,T3),'posnorm');
  ok(b.ok,'the real Task 3 geometry pass ACCEPTS under "expect posnorm" ('+
     b.accChanged.map(x=>x.role.split(':').pop()).join('+')+' moved, no images)');
  /* AND THE EXPECTATIONS ARE NOT INTERCHANGEABLE. If they were, the flag would be decoration. */
  ok(!verdict(diffGLB(BILL,T1B),'posnorm').ok,
     'a texture pass REJECTS under "expect posnorm" — the two expectations are not interchangeable');
  ok(!verdict(diffGLB(T1B,T3),'images').ok,
     'and a geometry pass REJECTS under "expect images"');
}

/* ---- 2. SURGICAL MUTATIONS. One byte class each, in a real file. ---- */
function loadRaw(p){ return fs.readFileSync(p); }
function chunks(buf){
  let off=12, out=[];
  while(off+8<=buf.length){ const len=buf.readUInt32LE(off), type=buf.readUInt32LE(off+4);
    out.push({type,start:off+8,len}); off+=8+len+((len%4)?(4-(len%4)):0); }
  return out;
}
/* (a) MOVE ONE VERTEX. The smallest possible geometry change: one float, in POSITION. */
{
  const buf=loadRaw(T1B); const g=parseGLB(T1B);
  const bin=chunks(buf).find(c=>c.type===0x004E4942);
  const acc=g.json.accessors[0], bv=g.json.bufferViews[acc.bufferView];
  const at=bin.start+(bv.byteOffset||0)+(acc.byteOffset||0);
  const was=buf.readFloatLE(at);
  buf.writeFloatLE(was+0.5,at);
  const p=TMP+'/one_vertex.glb'; fs.writeFileSync(p,buf);
  const r=diffGLB(T1B,p), v=verdict(r,'images');
  const pos=r.accessors.find(a=>/POSITION$/.test(a.role));
  ok(pos&&pos.changed&&pos.elemsChanged===1,
     'ONE moved vertex component is found, and counted as exactly 1 ('+
     (pos?pos.elemsChanged:'—')+') — a diff that rounds this to zero would pass a re-export');
  ok(!v.ok&&v.fails.some(f=>/ACCESSOR VALUES MOVED/.test(f)),
     'and it REJECTS a texture pass, naming POSITION');
  ok(verdict(r,'posnorm').ok,'while "expect posnorm" accepts it, which is what makes the flag mean something');
}
/* (b) NUDGE ONE UV. The change most likely to be missed, because it is invisible in a render of
       the same texture and fatal to a re-paint. */
{
  const buf=loadRaw(T1B); const g=parseGLB(T1B);
  const bin=chunks(buf).find(c=>c.type===0x004E4942);
  let uvIdx=null;
  for(const m of g.json.meshes)for(const pr of m.primitives)
    if(pr.attributes.TEXCOORD_0!==undefined)uvIdx=pr.attributes.TEXCOORD_0;
  const acc=g.json.accessors[uvIdx], bv=g.json.bufferViews[acc.bufferView];
  const at=bin.start+(bv.byteOffset||0)+(acc.byteOffset||0);
  buf.writeFloatLE(buf.readFloatLE(at)+0.01,at);
  const p=TMP+'/one_uv.glb'; fs.writeFileSync(p,buf);
  const r=diffGLB(T1B,p);
  ok(!verdict(r,'posnorm').ok&&verdict(r,'posnorm').fails.some(f=>/OTHER THAN POSITION\/NORMAL/.test(f)),
     'a single nudged UV REJECTS a geometry pass — the change most likely to slip through, since '+
     'it looks identical in a render and ruins every future repaint');
  ok(!verdict(r,'images').ok,'and it rejects a texture pass too');
}
/* (c) RENAME A JOINT. Constraint 1 of the brief: the game binds animation by bone NAME, and this
       is the mutation the automated gate exists to reject.
       DONE AS A BYTE OVERWRITE INSIDE THE JSON CHUNK, not by re-serialising. A glTF JSON chunk has
       a declared length, and JSON.parse -> JSON.stringify does not round-trip to the same bytes:
       number formatting alone made it 150 bytes longer here, so rewriting the chunk would have
       required moving every downstream offset. Overwriting the name's own bytes in place changes
       exactly one thing and leaves the whole container intact — which is also what makes the
       finding unambiguous. */
{
  const buf=loadRaw(T1B); const g=parseGLB(T1B);
  const cs=chunks(buf); const jc=cs.find(c=>c.type===0x4E4F534A);
  const nodeI=g.json.skins[0].joints[5];
  const before=g.json.nodes[nodeI].name;
  ok(!!before&&before.length>1,'the joint chosen for the rename test actually has a name ('+before+')');
  const needle=Buffer.from('"'+before+'"','utf8');
  const jsonBuf=buf.slice(jc.start,jc.start+jc.len);
  const at=jsonBuf.indexOf(needle);
  ok(at>=0,'and its name is found verbatim in the JSON chunk, so it can be overwritten in place');
  const out=Buffer.from(buf);
  /* last character of the name, one byte, same length */
  out[jc.start+at+needle.length-2]=0x58;   // 'X'
  const after=before.slice(0,-1)+'X';
  const p=TMP+'/renamed_joint.glb'; fs.writeFileSync(p,out);
  const r=diffGLB(T1B,p);
  ok(r.json.realTotal>0&&r.json.real.some(d=>/nodes\.\d+\.name/.test(d.path)),
     'a RENAMED JOINT is found and named by path ('+before+' -> '+after+') — this is the one the '+
     'automated gate rejects on, because animation binds by name');
  ok(!verdict(r,'images').ok&&!verdict(r,'posnorm').ok,
     'and it rejects under BOTH expectations, since no delivery is allowed to touch the rig');
}
/* (d) SWAP AN IMAGE PAYLOAD in a geometry pass. */
{
  const buf=loadRaw(T3);
  const g=parseGLB(T3);
  const bin=chunks(buf).find(c=>c.type===0x004E4942);
  const bv=g.json.bufferViews[g.json.images[0].bufferView];
  const at=bin.start+(bv.byteOffset||0)+1000;
  buf[at]=buf[at]^0xFF;
  const p=TMP+'/repainted.glb'; fs.writeFileSync(p,buf);
  const r=diffGLB(T1B,p), v=verdict(r,'posnorm');
  ok(!v.ok&&v.fails.some(f=>/IMAGE PAYLOADS MOVED/.test(f)),
     'ONE flipped byte inside an image payload REJECTS a geometry pass — "no repaint" is checked '+
     'on the payload, not on the file size, which is identical here');
}
/* ---- 3. CONTAINER BOOKKEEPING IS NOT A DEFECT, and that is load-bearing ---- */
{
  const r=diffGLB(BILL,T1B);
  ok(r.json.bookkeeping>0&&r.json.realTotal===0,
     'the real texture pass moves '+r.json.bookkeeping+' container fields (image bufferView '+
     'offsets/lengths and buffer byteLength) and NOTHING else — if those counted as defects, no '+
     'legitimate texture swap could ever pass');
}
console.log(bad?('GLBDIFF SELFTEST: '+bad+' FINDINGS'):'GLBDIFF SELFTEST: ALL PASS');
process.exit(bad?1:0);
