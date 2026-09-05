/* THE PLACEHOLDER GLB — REPLAT P6A.
   P6A.md's swap proof needs a model, and the piece is forbidden from sourcing one ("does not
   source, adapt, or import any real model"). So the asset is GENERATED, here, from twenty lines of
   arithmetic — which makes its provenance airtight in a way a download never is: the licence row
   in assets/LICENCES.md can point at this file, and anyone can re-run it and md5 the result.

   WHY IT IS 190 x 98 x 60 AND NOT A UNIT CUBE. A placeholder at exactly game scale would let the
   normalisation path be a no-op 1:1 and still look correct, which is the one thing a proof must not
   allow. These are the bench's own proportions in CENTIMETRES, so the loader has to divide by ~100
   to land it — the same "derive the scale from a measurement, never type it" rule the bird's
   posedUnits note argues at length. If the fit is wrong the box is a hundred times too big and no
   frame could hide it.
   ITS ORIGIN IS AT THE FOOT, not the centre, for the same reason: `fit.ground` has to be exercised
   by something, and a box already sitting on its own origin would prove nothing. The box spans
   y -9 to 89, so the loader must lift it 9 units (0.09 m) to stand it on the ground.

   Usage: node gauntlet/verify/mkplaceholder.mjs   ->  assets/models/placeholder_box.glb */
import fs from 'fs'; import path from 'path'; import url from 'url'; import crypto from 'crypto';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'assets','models','placeholder_box.glb');

const W=190, H=98, D=60, Y0=-9;                      // centimetres, origin at the foot
const x0=-W/2, x1=W/2, y0=Y0, y1=Y0+H, z0=-D/2, z1=D/2;
/* twenty-four vertices, four per face, so every face gets its own flat normal — an indexed
   eight-vertex cube would have to share them and shade like a sphere. */
const FACES=[
  {n:[ 0, 0, 1], v:[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]},
  {n:[ 0, 0,-1], v:[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]]},
  {n:[ 1, 0, 0], v:[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]]},
  {n:[-1, 0, 0], v:[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]]},
  {n:[ 0, 1, 0], v:[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]]},
  {n:[ 0,-1, 0], v:[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]},
];
const pos=[], nor=[], idx=[];
FACES.forEach((f,fi)=>{ f.v.forEach(v=>{ pos.push(...v); nor.push(...f.n); });
  const b=fi*4; idx.push(b,b+1,b+2, b,b+2,b+3); });

const posB=Buffer.from(new Float32Array(pos).buffer);
const norB=Buffer.from(new Float32Array(nor).buffer);
const idxB=Buffer.from(new Uint16Array(idx).buffer);
/* THE TWO CHUNKS PAD WITH DIFFERENT BYTES, and the spec is explicit about it: JSON pads with
   SPACES (0x20), BIN pads with zeros. Zero-padding the JSON produced a file three.js loaded
   perfectly and JSON.parse refused — trailing NULs are not whitespace — which is the sort of
   almost-valid asset that only bites the second tool to read it. */
const pad4=(b,fill)=>b.length%4?Buffer.concat([b,Buffer.alloc(4-b.length%4,fill===undefined?0:fill)]):b;
const bin=Buffer.concat([pad4(posB),pad4(norB),pad4(idxB)]);
const oPos=0, oNor=pad4(posB).length, oIdx=oNor+pad4(norB).length;
const mn=[x0,y0,z0], mx=[x1,y1,z1];

const gltf={
  asset:{version:'2.0',generator:'kea-gauntlet mkplaceholder.mjs (REPLAT P6A)',
         copyright:'CC0 1.0 — generated for the untitled kea game gauntlet'},
  scene:0, scenes:[{nodes:[0],name:'placeholder'}],
  nodes:[{mesh:0,name:'placeholder_box'}],
  meshes:[{name:'placeholder_box',primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2,material:0}]}],
  materials:[{name:'placeholder',doubleSided:false,
    pbrMetallicRoughness:{baseColorFactor:[0.62,0.24,0.72,1.0],metallicFactor:0.0,roughnessFactor:0.75}}],
  accessors:[
    {bufferView:0,componentType:5126,count:pos.length/3,type:'VEC3',min:mn,max:mx},
    {bufferView:1,componentType:5126,count:nor.length/3,type:'VEC3'},
    {bufferView:2,componentType:5123,count:idx.length,type:'SCALAR'}],
  bufferViews:[
    {buffer:0,byteOffset:oPos,byteLength:posB.length,target:34962},
    {buffer:0,byteOffset:oNor,byteLength:norB.length,target:34962},
    {buffer:0,byteOffset:oIdx,byteLength:idxB.length,target:34963}],
  buffers:[{byteLength:bin.length}],
};
const jsonB=pad4(Buffer.from(JSON.stringify(gltf),'utf8'),0x20);
const chunk=(b,type)=>{ const h=Buffer.alloc(8); h.writeUInt32LE(b.length,0); h.writeUInt32LE(type,4);
  return Buffer.concat([h,b]); };
const jc=chunk(jsonB,0x4E4F534A), bc=chunk(bin,0x004E4942);
const head=Buffer.alloc(12); head.write('glTF',0,'ascii');
head.writeUInt32LE(2,4); head.writeUInt32LE(12+jc.length+bc.length,8);
const glb=Buffer.concat([head,jc,bc]);
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,glb);
console.log('wrote '+path.relative(ROOT,OUT)+'  '+glb.length+' bytes  md5 '+
  crypto.createHash('md5').update(glb).digest('hex'));
console.log('box '+W+'x'+H+'x'+D+' model units, origin at the foot (y '+y0+' to '+y1+')');
