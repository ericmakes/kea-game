/* ADVERSARIAL AUDIT of the mega-wave builds — 2026-08-27 */
const {load,collector,stage,far,sweep,clearTraffic}=require('../2026-08-26/rig');
const H=load(),{X,G}=H, C=collector('NEWBUILD-AUDIT');
const ok=C.ok, tick=n=>{for(let i=0;i<n;i++)X.update(1/60);};
const P1=H.P1, hold=H.hold, un=H.un, tap=H.tap;
X.boot(); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); // pristine: battery 9 owns save persistence

C.section('A. chase AI vs the newly-solid picnic table');
X.startGame(1); tick(2);
const k0=G.keas[0]; G.trafT.a=999; G.trafT.b=999;
G.sheep.forEach(s=>{s.x=-48;s.z=-48;s.home={x:-48,z:-48};});
{ const tr=G.humans.find(h=>h.key==='trish');
  tr.x=15; tr.z=-16.5; tr.state='idle'; tr.patrol=null;
  k0.x=15; k0.z=-9.5; k0.y=0; k0.grounded=true; // kea straight across the table from her
  tr.aggro(k0); let reached=false, gaveUp=false;
  for(let i=0;i<60*8;i++){ k0.x=15; k0.z=-9.5; k0.y=0; k0.vy=0; X.update(1/60);
    const d=Math.hypot(tr.x-k0.x,tr.z-k0.z);
    if(d<1.6)reached=true;
    if(tr.state!=='chase')gaveUp=true;
    if(reached||gaveUp)break; }
  ok(reached||gaveUp,'table-blocked chase resolves (reached='+reached+' gaveUp='+gaveUp+') — no infinite wall-hug');
  tr.x=45; tr.z=45; tr.state='idle'; tick(2); }

C.section('B. colossal sprint into a rotated corner — tunneling check');
{ k0.size=3; k0.g&&k0.g.scale.setScalar(1.15*3);
  let inside=false;
  for(let trial=0;trial<40;trial++){
    k0.x=-11-6; k0.z=8-6; k0.y=0.3; k0.vy=0; k0.grounded=true; k0.ry=Math.atan2(6,6);
    for(let i=0;i<50;i++){ hold(P1.fwd); X.update(1/60);
      const dx=k0.x-(-11), dz=k0.z-8, sn=Math.sin(0.2), cs=Math.cos(0.2);
      const lx=Math.abs(dx*cs-dz*sn), lz=Math.abs(dx*sn+dz*cs);
      if(lx<1.2&&lz<2.6&&k0.y<2.2)inside=true; }
    un(P1.fwd); if(inside)break; }
  ok(!inside,'colossal sprint never ends up inside the rotated van (40 angled runs)');
  k0.size=1; k0.g&&k0.g.scale.setScalar(1.15); }

C.section('C. camera state hygiene across restarts');
{ G.camYaw=2.7; G.camDist=1.5;
  X.startGame(1); tick(2);
  ok(!(G.camYaw>1)&&!((G.camDist||1)>1.3),'restart clears camera yaw/zoom (yaw='+(G.camYaw||0).toFixed(2)+' dist='+(G.camDist||1).toFixed(2)+') — no disoriented spawn'); }

C.section('D. pad disconnect mid-hold — stuck input check');
{ const mkPad=(o)=>Object.assign({connected:true,mapping:'',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))},o||{});
  const nav=globalThis.navigator||{}; const oldGG=nav.getGamepads;
  const pad=mkPad(); nav.getGamepads=()=>[pad];
  X.startGame(1); tick(2);
  const k=G.keas[0]; k.x=0; k.z=0; k.y=0; k.grounded=true; tick(1);
  pad.axes[1]=-1; tick(30); // pad holds forward
  const x1=k.x,z1=k.z;
  nav.getGamepads=()=>[null,null,null,null]; // battery dies mid-hold
  tick(45);
  const drift=Math.hypot(k.x-x1,k.z-z1);
  ok(drift<0.4,'pad death releases held keys (post-disconnect drift '+drift.toFixed(2)+'u)');
  nav.getGamepads=oldGG; tick(2); }

C.section('E. feathers under tug — state sanity');
{ const k=G.keas[0]; k.x=0;k.z=0;k.y=2.5;k.grounded=false;k.flapDrive=true; tick(20);
  const openAir=k.wings[0].userData.open;
  k.tug={label:'audit-grip',getPos:()=>({x:k.x,y:k.y+0.4,z:k.z}),range:9,progress:0,need:99,done:false,tuggers:new Set()};
  hold(P1.grab); tick(30); un(P1.grab); k.tug=null; tick(2);
  const fOK=k.feathers[0].every(f=>isFinite(f.rotation.y)&&isFinite(f.rotation.z));
  ok(fOK,'feather rotations stay finite through an airborne tug (open was '+openAir.toFixed(2)+')'); }

C.section('F. sheep vs rotated ute');
{ const s=G.sheep[0]; s.home={x:G.pen.x,z:G.pen.z}; s.x=12; s.z=7; s.y=0; s.panic=0; s.calmT=0; tick(6);
  const dx=s.x-12, dz=s.z-7, sn=Math.sin(-0.15), cs=Math.cos(-0.15);
  const lx=Math.abs(dx*cs-dz*sn), lz=Math.abs(dx*sn+dz*cs);
  ok(lx>1.0||lz>2.15,'sheep placed inside the ute is ejected past its rotated footprint');
  s.x=-48; s.z=-48; s.home={x:-48,z:-48}; tick(1); }

process.exitCode=C.report()?1:0;
