/* THE BEVEL AUDIT — which flank details are sealed inside their own body (TODO 32).
   Usage: node audits/2026-08-28/audit-bevel-flanks.js
   THIS IS A REPORT, NOT A BATTERY. It is deliberately not in gate.sh: TODO 32 is unfixed, so an
   assertion here would be red by design, and a red battery that is meant to be red teaches the gate
   to lie. It prints what is buried and by how much, so the sweep can be scoped before it is judged.

   WHY (TODO 32, found by piece 10). rbox is roundedBoxGeo, an ExtrudeGeometry: three expands the
   SHAPE by bevelSize on the two shape axes and leaves the EXTRUDE axis exact. roundedBoxGeo builds
   its shape in x and y and extrudes along z, and rbox maps w->x, h->y, d->z. So rbox(w,h,d,r) really
   measures (w + 1.84r) x (h + 1.84r) x d, and anything mounted at a nominal offset on x or y is
   inside the body while the same arithmetic on z is exact. Piece 10 fixed the caravan DOOR only and
   the brief said the ute and the hut wanted auditing before anyone believed it was caravan-only.

   THE EXTRUDE AXIS IS THE CONTROL, and that is the point of reporting it. If z came back as buried
   as x and y, the model above would be wrong and this whole audit would be measuring something else.
   It does not: see the summary at the bottom of a run.

   WHAT COUNTS AS A FLANK DETAIL, stated as the heuristic it is. This cannot know intent - a bunk, an
   engine and a sink are all legitimately inside a body. It flags a mesh only when all three hold:
     A PANEL - thin on SOME axis (its smallest extent <= 0.22, or <= 0.35 of its largest), which is
       the signature of a stripe, a trim, a frame or a weatherboard line rather than of furniture.
       Not thin on the axis being tested: the hut weatherboard lines span 7.02 in x and 0.02 in y,
       and it is their X faces that are buried;
     INSIDE the skin on that axis;
     WITHIN 0.30 of it, so it is plausibly meant to BE the surface rather than to sit deep in the
       body. The caravan cases piece 10 measured sit between 0.14 and 0.26 inside.
   Every number a row prints is measured off the geometry that ships, in the SHELL's own frame, so a
   rotated group (the ute carries rotation.y -0.15) is compared on its own axes and not on the world.
*/
const {load}=require('../2026-08-26/rig');
const H=load(), {X,G,THREE}=H;
X.boot();

const AX=['x','y','z'], SHAPE=new Set(['x','y']);
const THIN_ABS=0.22, THIN_REL=0.35, NEAR=0.30, BODY_MIN=2.0;
const SHOW=process.env.BEVELALL?1e9:8;   // BEVELALL=1 prints every row rather than the worst few

G.scene.updateMatrixWorld(true);
const boxOf=(mesh,frame)=>{ const g=mesh.geometry; if(!g||!g.attributes||!g.attributes.position)return null;
  g.computeBoundingBox(); const b=g.boundingBox.clone();
  b.applyMatrix4(new THREE.Matrix4().multiplyMatrices(frame,mesh.matrixWorld)); return b; };

// A BODY IS AN EXTRUDED SHELL BIG ENOUGH TO HAVE DETAIL ON IT. Found by walking the scene rather
// than off a G handle, because only the caravan door has one - and this way the ski field buildings
// are audited too, which no brief asked for and which is where two of the findings are.
const shells=[];
G.scene.traverse(o=>{ if(!o.isMesh||!o.geometry)return;
  if(o.geometry.type!=='ExtrudeGeometry')return;
  o.geometry.computeBoundingBox(); const b=o.geometry.boundingBox;
  const d=[b.max.x-b.min.x, b.max.y-b.min.y, b.max.z-b.min.z];
  if(Math.max(...d)<BODY_MIN)return;
  if(!o.parent)return;
  shells.push({mesh:o, dims:d, vol:d[0]*d[1]*d[2]}); });
shells.sort((a,b)=>b.vol-a.vol);

// one shell per parent group: the biggest extruded thing in it is the body, the rest is detail
const bodies=[]; const claimed=new Set();
for(const s of shells){ if(claimed.has(s.mesh.parent))continue; claimed.add(s.mesh.parent); bodies.push(s); }

/* THE SIGNATURE, and it is worth more than the heuristic list below it. A panel whose face is
   INSIDE the skin on a shape axis while its face on the EXTRUDE axis is PROUD of the skin is not a
   judgement call at all: the author gave it one margin, that margin works on the exact axis and
   fails on the bevelled ones, so their intent is on the record in the geometry. No thinness
   window, no distance window, nothing to argue with. Every row here is a mesh that was meant to sit
   on the surface and does on some faces and not others. */
/* THE NEAR SIDE IS THE ONLY SIDE WORTH COMPARING, and getting that wrong put a burial of 7.023 in
   the first witness list I printed. A trim on the LEFT wall has its right-hand face 7 metres inside
   the right-hand skin, which is true and meaningless. So every test below picks the face on the side
   of the body the detail actually sits on, off the sign of its offset from the shell centre. The
   heuristic list was accidentally immune because its 0.30 window threw those rows away; the
   signature list was not, because nothing there has a window to hide behind. */
const nearSide=(mid,skMid)=>mid>=skMid?1:-1;
const rows=[]; const seen={x:0,y:0,z:0}, hit={x:0,y:0,z:0}; const witness=[];
for(const b of bodies){
  const frame=new THREE.Matrix4().copy(b.mesh.matrixWorld).invert();
  const skin=boxOf(b.mesh,frame);
  const details=[];
  b.mesh.parent.traverse(o=>{ if(o.isMesh&&o!==b.mesh)details.push(o); });
  const found=[];
  for(const d of details){ const db=boxOf(d,frame); if(!db)continue;
    const ext={x:db.max.x-db.min.x, y:db.max.y-db.min.y, z:db.max.z-db.min.z};
    const big=Math.max(ext.x,ext.y,ext.z); if(big<=0)continue;
    // A PANEL IS THIN ON SOME AXIS, NOT NECESSARILY ON THE ONE BEING TESTED, and getting that
    // wrong made the first version of this audit miss its best find. The hut weatherboard lines
    // are box(7.02,0.02,5.42): thin in Y, spanning the whole wall in x and z, and their X faces sit
    // at 3.510 against a skin of 3.592. Requiring thinness on the axis under test excluded them,
    // because 7.02 is not thin - so the audit was blind to exactly the kind of detail it is for.
    const small=Math.min(ext.x,ext.y,ext.z);
    const panel=small<=THIN_ABS||small<=THIN_REL*big; if(!panel)continue;
    for(const a of AX){
      const mid=(db.min[a]+db.max[a])/2, skMid=(skin.min[a]+skin.max[a])/2;
      const s=nearSide(mid,skMid);
      const face=s>0?db.max[a]:db.min[a], sk=s>0?skin.max[a]:skin.min[a];
      const inside=(sk-face)*s;                         // >0 means the face is inside the skin
      if(inside<=1e-9||inside>NEAR)continue;
      seen[a]++;
      found.push({a,s,face,sk,inside,ext:ext[a],thinnest:small,
        at:{x:(db.min.x+db.max.x)/2,y:(db.min.y+db.max.y)/2,z:(db.min.z+db.max.z)/2}});
      hit[a]++; } }
  rows.push({b,skin,details:details.length,found});

  for(const d of details){ const db=boxOf(d,frame); if(!db)continue;
    const ext={x:db.max.x-db.min.x, y:db.max.y-db.min.y, z:db.max.z-db.min.z};
    const big=Math.max(ext.x,ext.y,ext.z), small=Math.min(ext.x,ext.y,ext.z);
    if(big<=0)continue;
    if(!(small<=THIN_ABS||small<=THIN_REL*big))continue;
    const proud=[], buried=[];
    { const mid=(db.min.z+db.max.z)/2, skMid=(skin.min.z+skin.max.z)/2, s=nearSide(mid,skMid);
      const zf=s>0?db.max.z:db.min.z, zs=s>0?skin.max.z:skin.min.z;
      if((zf-zs)*s>1e-4)proud.push({s,by:(zf-zs)*s,face:zf,sk:zs}); }
    for(const a of ['x','y']){
      const mid=(db.min[a]+db.max[a])/2, skMid=(skin.min[a]+skin.max[a])/2, s=nearSide(mid,skMid);
      const f=s>0?db.max[a]:db.min[a], sk=s>0?skin.max[a]:skin.min[a];
      if((sk-f)*s>1e-4&&(sk-f)*s<=NEAR)buried.push({a,s,by:(sk-f)*s,face:f,sk}); }
    if(proud.length&&buried.length){
      buried.sort((p,q)=>q.by-p.by); proud.sort((p,q)=>q.by-p.by);
      witness.push({body:b, ext, worst:buried[0], best:proud[0],
        at:{x:(db.min.x+db.max.x)/2,y:(db.min.y+db.max.y)/2,z:(db.min.z+db.max.z)/2}}); }
  }
}

const f3=v=>(v>=0?' ':'')+v.toFixed(3);
console.log('BEVEL AUDIT — '+bodies.length+' extruded bodies with detail on them\n');
for(const r of rows){
  const d=r.b.dims;
  console.log('BODY at '+['x','y','z'].map(k=>r.b.mesh.getWorldPosition(new THREE.Vector3())[k].toFixed(2)).join(', ')+
    '   shell '+d.map(v=>v.toFixed(3)).join(' x ')+'   '+r.details+' detail meshes');
  console.log('  its own skin:  x +-'+r.skin.max.x.toFixed(3)+'   y '+r.skin.min.y.toFixed(3)+
    ' to '+r.skin.max.y.toFixed(3)+'   z +-'+r.skin.max.z.toFixed(3)+
    '     (x and y carry the bevel, z is exact)');
  if(!r.found.length){ console.log('  nothing buried within '+NEAR+' of the skin\n'); continue; }
  const byAxis={};
  for(const q of r.found)(byAxis[q.a]=byAxis[q.a]||[]).push(q);
  for(const a of AX){ const list=(byAxis[a]||[]).sort((p,q)=>q.inside-p.inside); if(!list.length)continue;
    console.log('  '+(SHAPE.has(a)?'SHAPE':'extrude')+' axis '+a+': '+list.length+' buried');
    for(const q of list.slice(0,SHOW))
      console.log('      face '+f3(q.face)+' against skin '+f3(q.sk)+'   buried '+q.inside.toFixed(3)+
        '   span '+q.ext.toFixed(3)+' on '+q.a+', thinnest '+q.thinnest.toFixed(3)+
        '   at ('+q.at.x.toFixed(2)+','+q.at.y.toFixed(2)+','+q.at.z.toFixed(2)+')');
    if(list.length>SHOW)console.log('      ... and '+(list.length-SHOW)+' more');
  }
  console.log('');
}
console.log('THE SIGNATURE — a panel PROUD of the skin on the exact axis and INSIDE it on a bevelled');
console.log('one. The author gave it a margin; it works on z and fails on x or y. Not a heuristic.');
if(!witness.length)console.log('  none');
witness.sort((p,q)=>q.worst.by-p.worst.by);
for(const w of witness.slice(0,process.env.BEVELALL?1e9:14))
  console.log('  proud '+w.best.by.toFixed(3)+' on z (face '+f3(w.best.face)+' vs '+f3(w.best.sk)+
    ')   BURIED '+w.worst.by.toFixed(3)+' on '+w.worst.a+' (face '+f3(w.worst.face)+' vs '+
    f3(w.worst.sk)+')   at ('+w.at.x.toFixed(2)+','+w.at.y.toFixed(2)+','+w.at.z.toFixed(2)+')');
if(!process.env.BEVELALL&&witness.length>14)console.log('  ... and '+(witness.length-14)+' more');
console.log('WITNESSES: '+witness.length+' panels prove their own intent\n');
console.log('SUMMARY — buried thin faces by axis, which is the control as much as the finding:');
for(const a of AX) console.log('  '+(SHAPE.has(a)?'SHAPE  ':'extrude')+' '+a+': '+hit[a]);
console.log('BEVEL-AUDIT: '+AX.reduce((n,a)=>n+hit[a],0)+' buried faces across '+bodies.length+' bodies');
