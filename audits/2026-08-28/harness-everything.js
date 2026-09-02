/* THE EVERYTHING PASS — mission matrix, finale, save, leakage, perf (2026-08-28) */
const {load,collector}=require('../2026-08-26/rig');
const H=load(),{X,G}=H, C=collector('EVERYTHING');
const ok=C.ok, tick=n=>{for(let i=0;i<n;i++)X.update(1/60);};
const P1=H.P1, hold=H.hold, un=H.un, tap=H.tap;
X.boot();

/* TODO 17: THE BUILD-TIME TRUTH ABOUT PROP HOMES, captured here and nowhere else. The sections below
   spend three hundred assertions carrying props around, and one of them boots the game a SECOND time
   (the snow section, which needs a fresh world for its resolver sweep) - which rebuilds the world and
   leaves TWO of every prop in G.props from that point on. So no later moment can speak for the build,
   and the home-positions section asserts against this snapshot for anything build-shaped. The double
   boot is filed as TODO 48; it is not this piece to fix. */
const HOMESATBOOT=G.props.map(p=>({id:p.id,name:p.name,home:Object.assign({},p.home),
  mx:p.mesh?p.mesh.position.x:null, my:p.mesh?p.mesh.position.y:null, mz:p.mesh?p.mesh.position.z:null,
  mrx:p.mesh?p.mesh.rotation.x:null, mry:p.mesh?p.mesh.rotation.y:null, mrz:p.mesh?p.mesh.rotation.z:null,
  cls:p.homeClass, food:!!p.food, shiny:!!p.shiny}));

// ---- shared drivers (perch idiom throughout) ----
const kq=()=>G.keas[0];
function park(){ G.trafT.a=999; G.trafT.b=999;
  G.humans.forEach(h=>{h.x=45;h.z=45;h.home={x:45,z:45};h.patrol=null;});
  G.sheep.forEach(s=>{s.x=-48;s.z=-48;s.home={x:-48,z:-48};}); }
function perchAt(x,z,y){ const k=kq(); const p=Math.max(0.25,y||0.25,X.groundHeightAt(x,z,3)+0.02);
  for(let i=0;i<3;i++){ k.x=x; k.z=z; k.y=p; k.vy=0; X.update(1/60); } return p; }
function takeProp(name){ const k=kq(); const p=G.props.find(pp=>pp.name===name&&!pp.banked&&!pp.heldBy);
  if(!p)return null; if(k.held){k.held.heldBy=null;k.held=null;}
  const yy=perchAt(p.x,p.z,Math.max(0.25,p.y));
  for(let i=0;i<3;i++){ k.x=p.x; k.z=p.z; k.y=yy; k.vy=0; X.update(1/60); }
  tap(P1.grab); tick(2); return (k.held===p||k.hatProp===p)?p:null; }
function peckL(frag,extraHits){ const t=G.inter.find(it=>it.kind==='peck'&&!it.done&&it.label&&it.label.includes(frag));
  if(!t)return false; const q=t.getPos(); const yy=perchAt(q.x,q.z,Math.max(0.25,q.y-0.3));
  for(let n=0;n<(t.needHits||1)+1+(extraHits||0);n++){ for(let i=0;i<2;i++){ kq().x=q.x; kq().z=q.z; kq().y=yy; kq().vy=0; X.update(1/60); } tap(P1.grab); tick(2); }
  return true; }
function tearL(frag){ const t=G.inter.find(it=>it.kind==='tear'&&!it.done&&it.label&&it.label.includes(frag));
  if(!t)return false; const q=t.getPos(); const k=kq();
  const yy=Math.max(q.y,X.groundHeightAt(q.x,q.z,3)+0.02);
  hold(P1.grab); let st=0; while(!t.done&&st<60*9){ k.x=q.x; k.z=q.z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); st++; }
  un(P1.grab); tick(2); return t.done; }
function dropAt(x,y,z){ const k=kq(); for(let i=0;i<3;i++){ k.x=x; k.z=z; k.y=y; k.vy=0; X.update(1/60); } tap(P1.grab); tick(12); }
const M=id=>{ const m=G.missions.find(m=>m.id===id); return m&&m.done===true; };

C.section('MISSION MATRIX — classic, driven by legit verbs');
X.startGame(1); tick(8); park();
const driven=[], failed=[], reviewed=[];
function drive(id,fn){ try{ if(M(id)){driven.push(id+'*');return;} fn(); tick(6);
    if(M(id))driven.push(id); else failed.push(id);
  }catch(e){ failed.push(id+'!'+String(e.message).slice(0,30)); } }
drive('wiper',()=>{ tearL('WIPER'); tearL('WIPER'); tearL('WIPER'); });
drive('keys',()=>{ takeProp('ute keys'); });
drive('sandwich',()=>{ const p=takeProp('sandwich');
  if(p)dropAt(G.nestPos.x,G.nestY+0.1,G.nestPos.z); });
drive('t_pack',()=>{ tearL('UNZIP'); });
drive('t_bar',()=>{ tick(6); const p=takeProp('muesli bar');
  if(p){ dropAt(G.nestPos.x,G.nestY+0.1,G.nestPos.z); tick(4);
    perchAt(G.nestPos.x,G.nestPos.z,G.nestY+0.1); const p2=takeProp('muesli bar');
    if(p2){ for(let i=0;i<3;i++){ kq().x=G.nestPos.x; kq().z=G.nestPos.z; kq().y=G.nestY+0.1; kq().vy=0; X.update(1/60); } tap(P1.grab); tick(30); } } });

drive('passport',()=>{ peckL('HANDBAG'); tick(4); takeProp('passport');
  dropAt(G.nestPos.x,G.nestY+0.1,G.nestPos.z); });
drive('can',()=>{ peckL('BIN LID'); tick(4); takeProp('shiny can'); });
drive('wake',()=>{ const tom=G.humans.find(h=>h.key==='tom'); if(tom){ tom.x=20; tom.z=-20; tom.asleep=true;
  perchAt(20,-19,0.3); tap(P1.scream); tick(20); } });
reviewed.push('pielift(needs Dave up the ladder — behavioural)');
drive('q_chimney',()=>{ const hint=(G.hints||[]).find(h=>h.mid==='q_chimney');
  console.log('  CHIMDBG hint', hint?(hint.x.toFixed(1)+','+hint.y.toFixed(1)+','+hint.z.toFixed(1)):'none');
  const cx=hint?hint.x:-24.9, cz=hint?hint.z:-10.2, cy=hint?hint.y:6.4;
  for(let i=0;i<160;i++){ const k=kq(); k.x=cx; k.z=cz; k.y=cy; k.vy=0; k.grounded=true; X.update(1/60);} });
reviewed.push('q_median(honk-at-median interplay — staging-resistant headless; 10s manual QA)');
drive('q_muster',()=>{ const s=G.sheep[0]; if(s){ s.home={x:0,z:34}; for(let i=0;i<50;i++){ s.x=0; s.z=34; X.update(1/60); } s.home={x:-48,z:-48}; s.x=-48; s.z=-48; } });
drive('q_pegs',()=>{ for(let r=0;r<3;r++){ const p=takeProp('clothes peg')||takeProp('peg'); if(p)dropAt(kq().x+2+r,0.4,kq().z+2); } });
reviewed.push('b_cap(guarded-head)');
drive('s_pole',()=>{ takeProp('ski pole')||tearL('POLE'); });
drive('s_binding',()=>{ tearL('BINDING'); });
console.log('  DRIVEN: '+driven.join(','));
if(failed.length)console.log('  FAILED: '+failed.join(','));
reviewed.push('roofhonk','seal(sys)','snow(sys)','jam(flow)','spikes','slide','q_peck','q_table(p2)','bootroad(p2)','airmail(p2)','b_five(p2)','b_beanie(sys)','s_ski','s_lift','t_pole2','t_sign','sign','paddock','grumble3','b_dress','b_body');
console.log('  REVIEW-COVERED-OR-COMPLEX: '+reviewed.join(','));
ok(failed.length===0,'every driven classic mission completes ('+driven.length+' driven, '+failed.length+' failed'+(failed.length?': '+failed.join(','):'')+')');

C.section('THE FINALE — full pursuit, then the nest');
X.startGame(1); tick(6); park();
G.finaleOn=true; const k0=kq();
const four=G.humans.slice(0,4);
four.forEach(h=>{ h.x=k0.x+2; h.z=k0.z+2; h.stun=0; h.distracted=0; h.aggro(k0); });
tick(4);
ok(G.apexArmed===true,'four chasers arm the apex');
perchAt(G.nestPos.x,G.nestPos.z,G.nestY+0.1); tick(8);
ok(G.won===true&&M('apex'),'the nest wins the game');
{ let threw=false; try{ X.startGame(1); tick(6); }catch(e){ threw=true; }
  ok(!threw&&G.won!==true&&G.running===true,'post-victory restart is clean'); }

C.section('SAVE — the full round trip');
X.startGame(1); tick(6); park();
{ const k=kq(); takeProp('ute keys'); dropAt(G.nestPos.x,G.nestY+0.1,G.nestPos.z); tick(6); // bank one shiny
  peckL('BACKPACK'); tick(4);
  G.wantedT=2.2; G.wanted=2;
  X.SAVE.write&&X.SAVE.write();
  X.startGame(1); tick(12); // hydration lands
  const keysBanked=G.props.some(p=>p.name==='ute keys'&&p.banked);
  const packDone=G.inter.some(it=>it.kind==='peck'&&/BACKPACK/.test(it.label||'')&&it.done);
  ok(keysBanked,'banked shiny survives the reload');
  ok(packDone,'consumed peck survives the reload');
  ok(M('keys')&&M('t_pack'),'mission ticks survive the reload'); }

C.section('CROSS-MODE LEAKAGE');
X.startGame(2,{colossal:true}); tick(4); G.level=5; tick(2);
X.startGame(1); tick(6);
{ const k=kq();
  ok(!G.colossal,'classic restart drops colossal');
  ok(Math.abs(k.g.scale.x-0.7)<0.02,'kea returns to true size ('+k.g.scale.x.toFixed(2)+')');
  ok(!G.missions.some(m=>m.id==='c_stomp3'),'colossal missions leave the board'); }

C.section('THE FIRE FLICKERS — never a frozen flame');
X.startGame(1); tick(4); G.night=true; G.nightManual=true; G.nightT=1; X.nightApply(1);
{ G._fireSpy=[]; tick(90); const seen=G._fireSpy.slice();
  G._fireSpy=null;
  const mn=Math.min.apply(null,seen), mx=Math.max.apply(null,seen);
  ok(seen.length>=80&&(mx-mn)>0.08,'fire intensity varies across settled night ('+seen.length+' frames, spread '+(mx-mn).toFixed(3)+')');
  ok(G.fire&&G.fire.flame.visible&&G.fire.inner&&G.fire.inner.visible,'flame and inner tongue visible at night'); }

C.section('GRUNGE READS THE GROUND - wear and stones know their surface');
X.startGame(1); tick(4);
{ const W=G.wear||[], ST=G.stones||[], V=new H.THREE.Vector3();
  G.scene.updateMatrixWorld(true);
  const laid=(x,z)=>{ let t=null;                       // tallest laid surface under this spot, read from the scene
    G.scene.traverse(m=>{ const g=m.geometry; if(!g||g.type!=='BoxGeometry')return;
      const p=g.parameters; if(p.width<4||p.depth<4)return;
      m.getWorldPosition(V); const top=V.y+p.height/2;
      if(top>0.6||(t!==null&&top<=t))return;
      if(Math.abs(x-V.x)<=p.width/2&&Math.abs(z-V.z)<=p.depth/2) t=top; });
    return t; };
  ok(W.length===6,'six wear discs laid down ('+W.length+')');
  ok(ST.length===26,'twenty six stones on the country ('+ST.length+')');
  const buried=W.filter(w=>{ const t=laid(w.x,w.z); return t!==null&&w.y<=t; });
  ok(buried.length===0,'no wear disc is buried under the paint it sits on ('+buried.map(w=>w.x+','+w.z).join(' ')+')');
  const floaty=W.filter(w=>w.y>(laid(w.x,w.z)||0)+0.04);
  ok(floaty.length===0,'no wear disc floats above its surface ('+floaty.map(w=>w.x+','+w.z).join(' ')+')');
  const sunk=ST.filter(s=>laid(s.x,s.z)!==null);
  ok(sunk.length===0,'no stone is sunk into a laid surface ('+sunk.length+')');
  const onPaint=W.filter(w=>w.paint), onDirt=W.filter(w=>!w.paint);
  ok(onDirt.length>=3&&onPaint.length>=2,'wear spans dirt and seal ('+onDirt.length+' dirt / '+onPaint.length+' sealed)');
  ok(onDirt.every(w=>w.color===0x8A7A52),'dirt wear stays brown');
  ok(onPaint.every(w=>w.color!==0x8A7A52&&((w.color>>16)&255)<0x60),'sealed wear goes oil-dark'); }

C.section('THE FIELD IS COMBED - tussock lean and clump');
{ const B=[]; for(let i=0;i<600;i++) B.push(X.grassBlade(-58+i*0.19,-40+((i*7)%80)));
  ok(B.every(b=>b.lean>=0.08&&b.lean<=0.30),'blade lean stays inside the comb band');
  const dirs=B.map(b=>b.dir), lo=Math.min.apply(null,dirs), hi=Math.max.apply(null,dirs);
  ok(hi-lo<1.4,'the whole field leans one way (dir spread '+(hi-lo).toFixed(2)+' rad, not a scatter)');
  ok(hi-lo>0.2,'the breeze wanders across the flats (dir spread '+(hi-lo).toFixed(2)+' rad)');
  ok(X.grassBlade(10.1,4.1).cell===X.grassBlade(11.2,4.9).cell,'blades inside one clump share a height cell');
  ok(X.grassBlade(10.1,4.1).cell!==X.grassBlade(20.6,4.1).cell,'a clump four cells away is a different height');
  const hs=B.map(b=>b.h);
  ok(Math.min.apply(null,hs)<0.75&&Math.max.apply(null,hs)>1.35,'heights run from grazed to tall ('+
     Math.min.apply(null,hs).toFixed(2)+' to '+Math.max.apply(null,hs).toFixed(2)+')'); }

C.section('THE PADDOCK GATE - a toy for the emptiest area');
X.startGame(1); tick(8); park();
{ const t=G.inter.find(it=>it.kind==='tear'&&/BALING TWINE/.test(it.label||''));
  ok(!!t,'the baling twine is chewable at the paddock gate');
  const before=G.penGate?G.penGate.rotation.y:0;
  const chewed=tearL('BALING TWINE'); tick(120);
  ok(chewed&&M('q_twine'),'chewing the twine credits q_twine');
  ok(G.props.some(p=>p.name==='length of twine'),'the chewed twine drops as a carryable');
  ok(G.penGate&&G.penGate.rotation.y<before-0.9,'the gate swings open ('+
     (G.penGate?G.penGate.rotation.y.toFixed(2):'no gate')+' rad)');
  ok(G.sheep.length>0&&G.sheep.every(sh=>sh.panic>0),'the sheep are rattled by it'); }

C.section('THE HAT SURVIVES THE RELOAD - wearables persistence');
X.startGame(1); tick(8); park();
{ const k=kq();
  const bn=G.props.filter(p=>p.name==="tramper's beanie").find(p=>!p.banked&&!p.heldBy&&!p.worn);
  ok(!!bn,'a beanie is loose in the world');
  if(bn){ bn.x=12; bn.z=-42; bn.y=0.4; bn.mesh.position.set(bn.x,bn.y,bn.z);   // clean ground, law 3
    const yy=perchAt(bn.x,bn.z,0.5);
    for(let i=0;i<3;i++){ k.x=bn.x; k.z=bn.z; k.y=yy; k.vy=0; X.update(1/60); }
    tap(P1.grab); tick(3); }
  ok(k.hatProp&&k.hatProp.name==="tramper's beanie",'the beanie goes on the head, not in the beak');
  const before=G.props.filter(p=>p.name==="tramper's beanie").length;
  X.SAVE.write&&X.SAVE.write();
  X.startGame(1); tick(12);                                  // hydration lands on a later tick
  const k2=kq();
  ok(k2.hatProp&&k2.hatProp.name==="tramper's beanie",'the worn hat survives the reload');
  ok(k2.hatProp&&k2.hatProp.mesh.parent===k2.head,'the hat rides the LIVE bird, not the one that took it');
  const after=G.props.filter(p=>p.name==="tramper's beanie").length;
  ok(after<=before+1,'the reload does not mint a spare beanie ('+before+' to '+after+')');
  const ghosts=G.props.filter(p=>p.heldBy&&G.keas.indexOf(p.heldBy)<0);
  ok(ghosts.length===0,'no prop is held by a bird that no longer exists ('+ghosts.map(p=>p.name).join(' ')+')'); }

C.section('THE METER KICKS - HUD juice on a big landing');
X.startGame(1); tick(4);
{ const quiet=()=>{ G.combo=0; G.comboArmed=false; G.hudPulse=0; };
  quiet(); X.award(12,'a small one',null);
  ok(!(G.hudPulse>0),'a small award leaves the meter alone ('+(G.hudPulse||0).toFixed(2)+')');
  quiet(); X.award(60,'a big one',null);
  const peak=G.hudPulse;
  ok(peak>0.5,'a big award kicks the meter ('+peak.toFixed(2)+')');
  X.award(60,'another big one',null);
  ok(G.hudPulse>peak&&G.hudPulse<=1.5,'the kick stacks but stays capped ('+G.hudPulse.toFixed(2)+')');
  tick(60);
  ok(G.hudPulse===0,'and it settles back to nothing inside a second ('+G.hudPulse.toFixed(2)+')');
  quiet(); G.combo=3; G.comboArmed=true; X.award(12,'a small one on a hot streak',null);
  ok(G.hudPulse>0,'a small award on a hot combo kicks it too - the meter reads what LANDS'); }

C.section('THE OUTSKIRTS GET A GAG - road, ski field, trailhead');
X.startGame(1); tick(8); park();
{ const homeNear=(nm,hx,hz,r)=>{ const p=G.props.filter(pp=>pp.name===nm).pop();
    return !!p&&Math.hypot(p.home.x-hx,p.home.z-hz)<r; };
  ok(homeNear('ski goggles',-41.2,-38.05,2.0),'the goggles lie at the ski rack');
  ok(homeNear('woollen sock',46.9,-39.0,2.0),'the sock lies under the boot rail');
  // the paddle, pecked where it stands
  ok(peckL('ROADWORKS PADDLE'),'the paddle is peckable at the verge');
  tick(45);
  ok(M('r_paddle'),'flipping the paddle credits r_paddle');
  const rests=()=>G.paddle&&Math.abs(G.paddle.rotation.y-(G.paddleFlipped?Math.PI:0))<0.15;
  ok(rests(),'the paddle rests where its own state says ('+
     (G.paddle?G.paddle.rotation.y.toFixed(2):'none')+' rad, flipped='+G.paddleFlipped+')');
  { const before=G.score, flips=G.paddleFlips||0;
    peckL('ROADWORKS PADDLE'); tick(45);
    ok((G.paddleFlips||0)>flips,'it keeps flipping, it does not latch shut');
    ok(rests(),'and it still rests where its state says');
    ok(G.score===before,'a re-flip pays nothing - the gag is not a chaos tap'); }
  // the two takeables, isolated on clean ground first (law 3)
  const grab=(nm,gx,gz)=>{ const k=kq();                       // law 3: isolate, and clear the neighbours
    const p=G.props.filter(pp=>pp.name===nm).find(pp=>!pp.banked&&!pp.heldBy&&!pp.worn);
    if(!p)return null;
    for(const q of G.props){ if(q===p||q.heldBy||q.banked)continue;
      if(Math.hypot(q.x-gx,q.z-gz)<3.5){ q.x=-49; q.z=-49; q.y=0.2; q.mesh.position.set(-49,0.2,-49); } }
    p.x=gx; p.z=gz; p.y=0.4; p.mesh.position.set(p.x,p.y,p.z);
    const yy=perchAt(p.x,p.z,0.5);
    for(let i=0;i<3;i++){ k.x=p.x; k.z=p.z; k.y=yy; k.vy=0; X.update(1/60); }
    tap(P1.grab); tick(3); return p; };
  const gg=grab('ski goggles',-16,-44);
  ok(gg&&kq().hatProp===gg,'the goggles go on the head, not in the beak');
  ok(M('s_goggles'),'wearing the goggles credits s_goggles');
  const so=grab('woollen sock',22,-44);
  ok(so&&kq().held===so,'the sock is carryable');
  ok(M('t_sock'),'taking the sock credits t_sock'); }

C.section('THE CANOPY TAKES THE NIGHT');
X.startGame(1); tick(4);
{ const T=H.THREE, lin=h=>new T.Color(h).convertSRGBToLinear();
  const L=c=>{ const o={}; c.getHSL(o); return o.l; };
  const reg=G.nightMats||[];
  ok(reg.length>=5,'the trees hand their materials to the night driver ('+reg.length+')');
  const near=(a,b)=>Math.abs(a.r-b.r)<1e-4&&Math.abs(a.g-b.g)<1e-4&&Math.abs(a.b-b.b)<1e-4;
  const leaf=reg.find(e=>near(e.day,lin(0x4E7F3E)));
  ok(!!leaf,'the mid canopy green is one of them');
  // law 1 + law 5: the finale left night ON and it persisted, so own the day first
  G.night=false; G.nightManual=true;
  let s0=0; while(G.nightT>0.001&&s0<900){ X.update(1/60); s0++; }
  const dayL=leaf?L(leaf.day):0;
  ok(leaf&&Math.abs(L(leaf.m.color)-dayL)<0.01,'by day the canopy wears its day colour');
  G.night=true;
  let st=0; while(G.nightT<0.999&&st<900){ X.update(1/60); st++; }
  ok(G.nightT>0.999,'night settles in ('+G.nightT.toFixed(4)+' after '+st+' frames)');
  const ratio=leaf?L(leaf.m.color)/dayL:9;
  ok(ratio<=0.45,'the canopy goes dark with the sky - lightness ratio '+ratio.toFixed(3)+' (0.45 floor)');
  const worst=reg.reduce((w,e)=>Math.max(w,L(e.m.color)/Math.max(1e-6,L(e.day))),0);
  ok(worst<=0.45,'every foliage and bark material goes with it (worst '+worst.toFixed(3)+')');
  G.night=false; let s2=0; while(G.nightT>0.001&&s2<900){ X.update(1/60); s2++; }
  ok(leaf&&Math.abs(L(leaf.m.color)-dayL)<0.01,'and the morning gives the green back ('+
     (leaf?L(leaf.m.color).toFixed(3):'-')+' vs '+dayL.toFixed(3)+')');
  G.nightManual=false; }

C.section('THE GLAZING CATCHES THE SKY');
X.startGame(1); tick(6);
{ const gm=G.glassMats||[];
  ok(gm.length>=2,'the glazing family registered its materials ('+gm.length+')');
  ok(gm.every(m=>m.vertexColors===true),'and every one of them reads vertex colour');
  const panes=[]; G.scene.traverse(o=>{ if(o.material&&gm.indexOf(o.material)>=0)panes.push(o); });
  ok(panes.length>=8,'the live scene is glazed ('+panes.length+' panes found by traversal)');
  let broken=0, flat=0, spread=0, minBlue=9, sill=0;
  for(const m of panes){ const g=m.geometry, p=g.attributes.position, c=g.attributes.color;
    if(!c||c.count!==p.count){ broken++; continue; }
    let lo=0, hi=0;
    for(let i=0;i<p.count;i++){ if(p.getY(i)<p.getY(lo))lo=i; if(p.getY(i)>p.getY(hi))hi=i; }
    const T=[c.getX(hi),c.getY(hi),c.getZ(hi)], B=[c.getX(lo),c.getY(lo),c.getZ(lo)];
    const sp=Math.max(Math.abs(T[0]-B[0]),Math.abs(T[1]-B[1]),Math.abs(T[2]-B[2]));
    if(sp<0.02)flat++;
    spread=Math.max(spread,sp);
    minBlue=Math.min(minBlue,T[2]-T[0]);                          // the head leans sky
    sill=Math.max(sill,Math.max(B[0],B[1],B[2])-Math.min(B[0],B[1],B[2])); // the sill sits neutral
    const span=Math.max(1e-6,p.getY(hi)-p.getY(lo));              // a ramp, not a step
    for(let i=0;i<p.count;i++){ const t=(p.getY(i)-p.getY(lo))/span;
      if(Math.abs(c.getX(i)-(B[0]+(T[0]-B[0])*t))>1e-5){ broken++; break; } }
  }
  ok(broken===0,'every pane colour tracks that pane own height, linearly ('+broken+' broken)');
  ok(flat===0,'no pane came out flat ('+flat+' of '+panes.length+')');
  ok(spread<=0.12,'the ramp stays LOW contrast - worst channel delta '+spread.toFixed(3)+' (0.12 ceiling)');
  ok(spread>=0.02,'and it is genuinely there - worst channel delta '+spread.toFixed(3));
  ok(minBlue>=0.05,'the head of every pane leans sky-blue (min blue over red '+minBlue.toFixed(3)+')');
  ok(sill<=0.04,'and the sill sits near-white (worst sill channel spread '+sill.toFixed(3)+')');
  // THE TRAP: the panes moved to a new memo key, so the warm night window could orphan silently
  const wm=G.warmMats&&G.warmMats[0];
  ok(!!wm&&gm.indexOf(wm)>=0,'the warm night window is still one of the glazing materials');
  ok(panes.some(m=>m.material===wm),'and something in the scene actually wears it'); }

C.section('THE POPUPS FAN OUT - five in one tick, five places');
X.startGame(1); tick(4);
{ G.popFan=[];                                        // law 1: the feed state survives startGame
  for(let n=0;n<5;n++)X.award(10+n,'crime '+n,null);   // one tick, no update between them
  const F=G.popFan||[];
  ok(F.length===5,'five awards spawned five stack entries ('+F.length+')');
  const dx=F.map(f=>f.dx), sc=F.map(f=>f.scale), dl=F.map(f=>f.delay);
  let clash=0, closest=99;
  for(let a=0;a<dx.length;a++)for(let b=a+1;b<dx.length;b++){
    const gap=Math.abs(dx[a]-dx[b]); if(gap<1e-6)clash++; if(gap<closest)closest=gap; }
  ok(clash===0,'no two popups share an x offset ('+clash+' clashes, closest pair '+closest.toFixed(2)+'px)');
  ok(closest>2,'and they are far enough apart to read as a fan, not a wobble ('+closest.toFixed(2)+'px)');
  ok(dx.every(v=>Math.abs(v)<=34.001),'every offset stays inside the 34px band (worst '+
     Math.max.apply(null,dx.map(Math.abs)).toFixed(2)+')');
  ok(new Set(dx.map(v=>v.toFixed(3))).size===5,'all five offsets are distinct to the pixel');
  let mono=true; for(let i=1;i<sc.length;i++)if(!(sc[i]<sc[i-1]))mono=false;
  ok(mono,'scale falls off monotonically down the stack ('+sc.map(v=>v.toFixed(2)).join(' ')+')');
  ok(sc[4]>0.4,'but the deepest line is still legible ('+sc[4].toFixed(2)+')');
  let stag=true; for(let i=1;i<dl.length;i++)if(!(dl[i]>dl[i-1]))stag=false;
  ok(stag,'the fade start staggers monotonically ('+dl.map(v=>v.toFixed(2)).join(' ')+')');
  ok(F.every((f,i)=>f.i===i),'each entry knows its own depth in the stack');
  // and the stack CLEARS once the feed has emptied, or every later burst piles up behind it
  tick(Math.ceil(1.7*60)+6); X.award(11,'a lone crime later',null);
  ok((G.popFan||[]).length===1,'a burst that has aged off screen leaves the next one at the top ('+
     (G.popFan||[]).length+' live)');
  ok(G.popFan[0].i===0,'so a lone popup is never scaled down as if it were buried'); }

C.section('THE TAB PILL GETS OUT OF THE WAY');
X.startGame(1); tick(6); park();
{ const L=X.plateLines, VW0=1280;
  // the predictor, checked against what the CAPTURES actually show rather than against itself
  ok(L('<b>E</b> HOLD to RIP WIPER',320)===2,'a 19-char prompt wraps at 320px - that is vantage 08');
  ok(L('<b>E</b> HOLD to RIP WIPER',960)===1,'and the same prompt fits one line at 960px');
  ok(L('',960)===0,'an empty plate has no lines');
  ok(L(null,320)===0,'and neither has a missing one');
  ok(L('<b>E</b> GO',960)===L('E GO',960),'markup is not counted - the plate wraps text');
  ok(L('x'.repeat(240),960)>=5,'a runaway prompt wraps a long way ('+L('x'.repeat(240),960)+' lines)');
  let mono=true; for(let w=300;w<=1600;w+=100)
    if(L('x'.repeat(60),w)>L('x'.repeat(60),w-100))mono=false;
  ok(mono,'and the wrap never gets WORSE as the viewport gets wider');

  // branch one: a narrow viewport docks the pill on its own
  global.innerWidth=320; X.update(1/60);
  ok(G.hudNarrow===true,'320px reads as narrow ('+G.hudVW+'px)');
  ok(G.tabDocked===true,'so the pill docks out of the plate way');
  global.innerWidth=VW0; X.update(1/60);
  ok(G.hudNarrow===false&&G.tabDocked===false,'a wide quiet HUD leaves it centred where it belongs');

  // branch two: a REAL wrapping prompt docks it at a width that is not narrow at all. The road
  // hint is 48 characters, which fits one line at 1280 and takes two at the 960 the captures use.
  // the world DOES put a real wrapping prompt on that plate - the road hint is 48 chars, which
  // takes two lines at the 960 the captures use. But which prompt wins at a given spot depends on
  // what earlier sections left lying there (law 1 and law 3), and a first attempt failed here
  // because a shorter interactable prompt beat the hint. So the world check stays a world check,
  // and the CONTRACT is driven straight through setPrompt plus hudReflow, with no tick to spoil it.
  const k=kq(); const y=Math.max(0.25,X.groundHeightAt(0,34,3)+0.02);
  for(let i=0;i<8;i++){ k.x=0; k.z=34; k.y=y; k.vy=0; k.grounded=true; X.update(1/60); }
  ok(G.hintNow&&G.hintNow[0]==='jam','the bird standing in the road picks up the jam hint');

  const HINT='<span style="opacity:.78">the road hint, at the width the captures use</span>';
  X.setPrompt(0,HINT); X.hudReflow(960);
  ok(G.hudLines[0]>1,'a plate that wraps at 960px reports its wrap ('+G.hudLines[0]+' lines)');
  ok(G.hudNarrow===false,'960px is not narrow');
  ok(G.tabDocked===true,'and the pill docks anyway - the WRAP is its own trigger');
  X.setPrompt(0,HINT); X.hudReflow(1600);
  ok(G.hudLines[0]===1&&G.tabDocked===false,'give the same plate room and the pill goes back to the middle');
  X.setPrompt(0,''); X.hudReflow(320);
  ok(G.hudLines[0]===0&&G.tabDocked===true,'no prompt at all still docks at 320 - width alone is enough');
  X.setPrompt(0,''); global.innerWidth=VW0; X.update(1/60); }

C.section('THE PREEN KEEPS ITS HEAD ON');
X.startGame(1); tick(6); park();
{ const T=H.THREE, v=new T.Vector3(), bb=new T.Box3();
  const k=kq(); G.poseLock=false;
  const pin=()=>{ k.x=0; k.z=0; k.vy=0; k.grounded=true; k.stun=0; k.landFlare=0; };
  const read=()=>{ k.g.updateMatrixWorld(true);
    k.head.getWorldPosition(v); const hy=v.y;
    k.beakTip.getWorldPosition(v); const by=v.y;
    let wt=-99; for(const w of k.wings){ bb.setFromObject(w); if(bb.max.y>wt)wt=bb.max.y; }
    return {hy,by,wt}; };

  // the REFERENCE the contract is calibrated on: what the bird does standing still. The head pivot
  // is never above the wing-bbox top in this rig - the folded wing tops are simply higher than the
  // head - so an absolute "head above the wing line" test would be unsatisfiable. eps is the
  // engine own tolerance and the test reads it rather than restating a number (law 10).
  for(let i=0;i<80;i++){ pin(); k.idleAct=null; k.idleT=0; X.update(1/60); }
  const rest=read(), restGap=rest.hy-rest.wt;
  ok(restGap<0,'standing still the head pivot already sits under the wing line ('+restGap.toFixed(3)+')');
  ok(restGap>-X.PREEN.eps,'and the resting deficit is inside eps, which is what eps was set from');

  // the whole cycle, both sides, every 0.05s
  let worstH=99, worstB=99, atT=0, atS=0, dips=0, n=0;
  for(const side of [1,-1]) for(let t=0;t<=3.5;t+=0.05){
    for(let i=0;i<3;i++){ pin(); k.idleT=99; k._idleEver=true;
      k.idleAct={kind:'preen',t,dur:3.5,side}; X.update(1/60); }
    const r=read(); n++;
    if(r.hy-r.wt<worstH){ worstH=r.hy-r.wt; atT=t; atS=side; }
    if(r.by-r.wt<worstB)worstB=r.by-r.wt;
    if(r.by<r.hy)dips++;                      // the beak still goes DOWN, or it is not a preen
  }
  ok(n>=140,'the whole cycle got sampled, both sides ('+n+' frames)');
  ok(worstH>=-X.PREEN.eps,'the head pivot never drops more than eps under the wing line (worst '+
     worstH.toFixed(4)+' at t='+atT.toFixed(2)+' side '+atS+', eps '+X.PREEN.eps+')');
  ok(worstH>=restGap-0.005,'in fact the preen carries the head no lower than standing still does ('+
     worstH.toFixed(4)+' vs '+restGap.toFixed(4)+')');
  // and it is still a preen: the beak dips toward the shoulder every frame, and the neck reaches out
  ok(dips===n,'the beak stays below the head pivot throughout - it is a preen, not a scan ('+dips+'/'+n+')');
  ok(worstB>=-0.31,'but the beak is no longer buried (worst '+worstB.toFixed(3)+', was -0.379)');
  ok(worstB<restGap,'and it does reach further down than a resting bird ever does ('+worstB.toFixed(3)+')');
  { for(let i=0;i<40;i++){ pin(); k.idleT=99; k._idleEver=true;
      k.idleAct={kind:'preen',t:1.2,dur:3.5,side:1}; X.update(1/60); }
    ok(Math.abs(k.neck.rotation.y)>1.0,'the neck reaches out to the shoulder ('+
       k.neck.rotation.y.toFixed(2)+' rad, target '+X.PREEN.yaw+')'); }
  k.idleAct=null; }

C.section('THE WHITE THING BEHIND THE BIRD IS CARPARK GRIT');
// Vantage 18 showed a pale rounded lump on the tarmac behind the bird at the caravan door and
// nothing in the game could say what it was. It is one of the 26 carpark grit pebbles: a
// scene-level 5-segment sphere, radius 0.05 to 0.12, y-squashed, laid over the carpark slab.
// Not seal debris, not the nest egg, not an orphan - so the verdict is KEEP, and this section
// pins that verdict so the next reader does not have to re-investigate it by projection.
{ const T=H.THREE, wp=new T.Vector3();
  const g=G.gravel;
  ok(Array.isArray(g)&&g.length===26,'the grit is a NAMED population, not anonymous scenery (n='+
     (g?g.length:'missing')+')');

  // the carpark slab is box(40,0.14,22,tarmac) centred (2,17): x -18..22, z 6..28
  const SLAB={x0:-18,x1:22,z0:6,z1:28};
  let outside=0; for(const p2 of g)
    if(p2.x<SLAB.x0||p2.x>SLAB.x1||p2.z<SLAB.z0||p2.z>SLAB.z1)outside++;
  ok(outside===0,'every pebble lies on the carpark slab, which is why one can turn up at the '+
     'caravan door ('+outside+' strays)');

  // the caravan door is inside the scatter reach, so a pale pebble there is grit BY CONSTRUCTION.
  // the door is where vantage 18 puts the bird; the scatter spans x 2+-19, z 17+-10.
  const DOOR={x:-9.0,z:10.2};
  ok(DOOR.x>=2-19&&DOOR.x<=2+19&&DOOR.z>=17-10&&DOOR.z<=17+10,
     'and the caravan door sits inside the scatter reach, so a pebble there needs no other name');

  // the registry is not fiction: every entry has a real mesh standing on it
  const level=[]; for(const o of G.scene.children){
    if(!o.isMesh||!o.geometry||o.geometry.type!=='SphereGeometry')continue;
    o.getWorldPosition(wp);
    if(wp.x<SLAB.x0||wp.x>SLAB.x1||wp.z<SLAB.z0||wp.z>SLAB.z1)continue;
    level.push({x:wp.x,z:wp.z,r:o.geometry.parameters.radius}); }
  let matched=0; for(const p2 of g)
    if(level.some(m=>Math.abs(m.x-p2.x)<1e-3&&Math.abs(m.z-p2.z)<1e-3&&Math.abs(m.r-p2.r)<1e-4))matched++;
  ok(matched===g.length,'every named pebble has its mesh ('+matched+'/'+g.length+')');

  // THE ANTI-ORPHAN TRIPWIRE, which is the half of this piece with a future. If anyone drops an
  // unparented sphere on the carpark from here on, this count stops agreeing and the gate says so.
  ok(level.length===g.length,'and NOTHING else unparented is loose on the carpark slab - '+
     level.length+' spheres there, all 26 of them named grit');

  // TEXTURE: the scatter alternates two greys, and only one of them was registered for the
  // speckle detail map, so half the pebbles rendered flat and smooth while their siblings were
  // stone. Read the registry rather than restating it (law 10).
  const tints=[...new Set(g.map(p2=>p2.color))];
  ok(tints.length===2,'the scatter uses two greys ('+tints.map(c=>'0x'+c.toString(16).toUpperCase()).join(' ')+')');
  let mapped=0; for(const c of tints) if(X.MAPKIND[c]==='speckle')mapped++;
  ok(mapped===2,'and BOTH are registered speckle now, so no pebble renders as flat smooth putty ('+
     mapped+'/2)');
}

C.section('THE GRASS TINT IS SEEDED, NOT A LOTTERY');
// buildGrass is `if(HEADLESS)return`, so node can never see the field itself. What node CAN do is
// hold the tint seam to its contract, and then check the field still goes through it. The old code
// drew two Math.random per blade, so ANY change to the object count retinted the whole country -
// which was the entire residual tripwire noise. It could not move onto rnd() either: 42000 blades
// at two draws each would have injected 84000 draws into the middle of buildWorld.
{ const T=H.THREE;
  const seq=(inst,n)=>{ const c=new T.Color();
    const cA=new T.Color(0xB8901F), cB=new T.Color(0x8A7C2E), cC=new T.Color(0xD9B84A);
    inst.grassTintReset(); const out=[];
    for(let i=0;i<n;i++){ inst.grassTint(c,cA,cB,cC); out.push(c.getHexString()); }
    return out.join(','); };

  const a=seq(X,200);
  ok(a===seq(X,200),'the same build replays an identical tint sequence after a reset');
  const distinct=new Set(a.split(',')).size;
  ok(distinct>20,'and the sequence genuinely varies, so this is a real comparison ('+distinct+' distinct tints)');

  // THE CLAIM, stated as strongly as it can be: neither the world seed nor Math.random can move
  // the tint. Second FRESH instance, a different seed, and Math.random poisoned to a constant.
  const realRandom=Math.random;
  let poisoned=0; Math.random=()=>{ poisoned++; return 0.123456789; };
  let b, seen;
  try{ const H2=load(); H2.X.setSeed(987654321);
       poisoned=0;                       // count the SEAM only - load() itself makes three uuids
       b=seq(H2.X,200); seen=poisoned; }
  finally{ Math.random=realRandom; }
  ok(b===a,'a different world seed AND a poisoned Math.random give the SAME tint sequence');
  ok(seen===0,'in fact the tint seam never calls Math.random at all ('+seen+' calls)');

  // and the field really does go through that seam. buildGrass is browser-only, so this is a
  // structural check on the source rather than a behavioural one - stated plainly, not disguised.
  const src=require('fs').readFileSync(require('path').join(__dirname,'..','..','untitled-kea-game.html'),'utf8');
  const body=src.slice(src.indexOf('function buildGrass()'), src.indexOf('function buildTrees'));
  ok(body.indexOf('grassTint(col')>0,'buildGrass tints its blades through that seam');
  ok(body.indexOf('Math.random')<0,'and buildGrass no longer touches Math.random anywhere');
  // that second claim covers the DETAIL MAP as well as the blades: the grass speckle painter was
  // another ~10k Math.random draws, so object-count changes still reshuffled the multiply-map even
  // once the blades were seeded. It now paints from a fixed seed, like detailTex already did.
}

C.section('CURVED HULLS ARE SMOOTH WITHOUT MOVING A VERTEX');
// rbox is an ExtrudeGeometry and ExtrudeGeometry is NON-INDEXED, so each triangle owns its three
// vertices and its own flat normal - that is the banding on the ute bonnet and the caravan roof.
// The briefed fix (computeVertexNormals) cannot help for exactly that reason, and this section
// proves that claim rather than asserting it: three own recompute on a non-indexed geometry
// reproduces the flat facets, which is what makes it a perfect stand-in for the BEFORE state.
{ const T=H.THREE;
  ok(X.SMOOTHSTAT.geos>0,'the smoothing pass ran at build ('+X.SMOOTHSTAT.geos+' geometries, '+
     X.SMOOTHSTAT.verts+' vertices)');

  const g=X.roundedBoxGeo(1.3,0.7,2.1,0.12);        // a fresh size, through the real build path
  const flat=g.clone(); flat.computeVertexNormals(); // == the pre-smoothing flat facets
  const pos=g.attributes.position, sm=g.attributes.normal, fl=flat.attributes.normal;

  ok(!g.index,'the geometry is non-indexed, which is why computeVertexNormals cannot smooth it');
  ok(pos.count===flat.attributes.position.count&&pos.count%3===0,
     'vertex and triangle counts are untouched ('+pos.count+' verts, '+(pos.count/3)+' tris)');

  // NOT ONE VERTEX MOVED - the silhouette constraint, checked rather than promised
  let moved=0;
  for(let i=0;i<pos.count;i++){ const q=flat.attributes.position;
    if(pos.getX(i)!==q.getX(i)||pos.getY(i)!==q.getY(i)||pos.getZ(i)!==q.getZ(i))moved++; }
  ok(moved===0,'and not one position moved, so the silhouette is bit-identical ('+moved+' moved)');

  // and the pass is not a no-op
  let changed=0;
  for(let i=0;i<sm.count;i++)
    if(Math.abs(sm.getX(i)-fl.getX(i))>1e-4||Math.abs(sm.getY(i)-fl.getY(i))>1e-4||
       Math.abs(sm.getZ(i)-fl.getZ(i))>1e-4)changed++;
  ok(changed>0,'the normals genuinely changed, so computeVertexNormals is NOT equivalent ('+
     changed+' of '+sm.count+' rewritten)');

  // THE CONTRACT: group vertices by shared position. Where the FLAT normals all sat inside the
  // engine own threshold, the smoothed ones must now agree. Where any pair exceeded it, that is a
  // real edge and it must still be crisp. Read the threshold from the engine (law 10).
  const lim=X.SMOOTH_DEG;
  const by=new Map();
  for(let i=0;i<pos.count;i++){
    const k=pos.getX(i).toFixed(4)+'_'+pos.getY(i).toFixed(4)+'_'+pos.getZ(i).toFixed(4);
    let a2=by.get(k); if(!a2){ a2=[]; by.set(k,a2); } a2.push(i); }
  const maxAng=(att,idx)=>{ let m=0;
    for(let a2=0;a2<idx.length;a2++)for(let b=a2+1;b<idx.length;b++){
      const u=new T.Vector3(att.getX(idx[a2]),att.getY(idx[a2]),att.getZ(idx[a2]));
      const v=new T.Vector3(att.getX(idx[b]),att.getY(idx[b]),att.getZ(idx[b]));
      if(u.lengthSq()<1e-9||v.lengthSq()<1e-9)continue;      // the zero-area seam triangles
      const ang=u.angleTo(v)*180/Math.PI; if(ang>m)m=ang; }
    return m; };
  const minPair=(att,idx)=>{ let m=999;
    for(let a2=0;a2<idx.length;a2++)for(let b=a2+1;b<idx.length;b++){
      const u=new T.Vector3(att.getX(idx[a2]),att.getY(idx[a2]),att.getZ(idx[a2]));
      const v=new T.Vector3(att.getX(idx[b]),att.getY(idx[b]),att.getZ(idx[b]));
      if(u.lengthSq()<1e-9||v.lengthSq()<1e-9)continue;
      const ang=u.angleTo(v)*180/Math.PI; if(ang<m)m=ang; }
    return m; };
  let welded=0, leaked=0, keptEdge=0, blunted=0, arc=0;
  for(const idx of by.values()){
    if(idx.length<2)continue;
    const before=maxAng(fl,idx), after=maxAng(sm,idx), near=minPair(fl,idx);
    if(before<=lim){ if(after<=0.5)welded++; else leaked++; }
    else if(near>lim){ if(after>lim*0.5)keptEdge++; else blunted++; }   // no two normals close: a real edge
    else arc++;                                    // a chain of small steps round an arc - smooths
  }
  ok(welded>0&&leaked===0,'every facet join inside '+lim+'deg was welded smooth ('+welded+
     ' welded, '+leaked+' left banded)');
  ok(keptEdge+blunted===0,'a ROUNDED box has no hard edges to keep - every edge is an arc ('+
     keptEdge+'/'+blunted+')');
  ok(arc>0,'so the chain groups smooth as the arcs they are ('+arc+' of them, closest pair under '+
     lim+'deg but spanning more)');

  // EDGE PRESERVATION needs a shape that HAS an edge. Two quads on a hinge, non-indexed like
  // ExtrudeGeometry, with the dihedral as the knob.
  const hinge=deg=>{ const t2=deg*Math.PI/180, sy=Math.sin(t2), cz=Math.cos(t2);
    const q=[[0,0,0],[1,0,0],[1,0,1],[0,0,1]];                       // flat quad, normal +Y
    const r2=[[0,0,1],[1,0,1],[1,sy,1+cz],[0,sy,1+cz]];              // hinged off the shared edge
    const tri=(A,B,C)=>[...A,...B,...C];
    const arr=[...tri(q[0],q[1],q[2]),...tri(q[0],q[2],q[3]),
               ...tri(r2[0],r2[1],r2[2]),...tri(r2[0],r2[2],r2[3])];
    const gg=new T.BufferGeometry();
    gg.setAttribute('position',new T.Float32BufferAttribute(arr,3));
    gg.computeVertexNormals();                                       // flat facets, as extrude gives
    return gg; };
  const gapAt=gg=>{ const pp=gg.attributes.position, nn=gg.attributes.normal, m=new Map();
    for(let i=0;i<pp.count;i++){ const k=pp.getX(i).toFixed(4)+'_'+pp.getY(i).toFixed(4)+'_'+pp.getZ(i).toFixed(4);
      let a3=m.get(k); if(!a3){ a3=[]; m.set(k,a3); } a3.push(i); }
    let worst=0; for(const idx of m.values()) if(idx.length>1){ const v2=maxAng(nn,idx); if(v2>worst)worst=v2; }
    return worst; };

  const soft=hinge(20), hard=hinge(90);
  ok(gapAt(soft)>19&&gapAt(hard)>89,'the fixture starts banded at both angles ('+
     gapAt(soft).toFixed(1)+'deg and '+gapAt(hard).toFixed(1)+'deg)');
  X.smoothFacetNormals(soft); X.smoothFacetNormals(hard);
  ok(gapAt(soft)<0.5,'a 20deg join - inside the threshold - welds smooth ('+gapAt(soft).toFixed(2)+'deg)');
  ok(gapAt(hard)>89,'a 90deg edge stays exactly as crisp as it was ('+gapAt(hard).toFixed(1)+'deg)');

  // normals stay unit length, except the two zero-area seam triangles three itself emits
  let nonUnit=0;
  for(let i=0;i<sm.count;i++){ const L=Math.hypot(sm.getX(i),sm.getY(i),sm.getZ(i));
    if(Math.abs(L-1)>1e-3)nonUnit++; }
  ok(nonUnit===6,'normals stay unit length bar the 6 that three emits zeroed on two ZERO-AREA '+
     'seam triangles, which rasterize to nothing ('+nonUnit+')');
}

C.section('THE CARAVAN DOOR IS ON ITS WALL, NOT FINNING OFF THE SIDE OF IT');
// Vantages 12, 18 and 20 all showed one defect three ways: the caravan door was built with the HUT
// door build - a slab thin in Z - but the caravan door wall faces X. So the door face pointed
// fore-aft and the slab stuck out of the side of the van as a black fin: edge-on in 12 and 18, and
// square-on from dead astern in 20, which a flush door never is.
// The reorientation is a dim-preserving axis swap, and this section pins BOTH halves of it: the
// slabs are now thinnest toward the wall with their faces spanning the wall plane, and they land on
// the wall skin as MEASURED rather than as nominal. That second half is load bearing. rbox is an
// ExtrudeGeometry and three expands the shape by bevelSize (r*0.92) on the two SHAPE axes while
// leaving the EXTRUDE axis exact, so the 2.4-wide shell does not end at x 1.2, it ends at 1.476.
// Every other detail on this wall - side windows at 1.225, awning rail at 1.23, gutter trim at
// 1.22 - is sealed inside the van by that margin, which is why the wall photographs as blank white
// in 12. A door placed on the nominal plane would have joined them, so the offsets were restaggered
// off the measured skin instead, and the tripwire below is what stops that being re-broken quietly.
{
  const d=G.vanDoor;
  ok(!!d&&d.axis==='x','the door is registered with its wall axis, so the gate can read it off G');

  const ext=m=>{ const gg=m.geometry; gg.computeBoundingBox(); const b=gg.boundingBox;
    return {sx:b.max.x-b.min.x, sy:b.max.y-b.min.y, sz:b.max.z-b.min.z,
      x0:m.position.x+b.min.x, x1:m.position.x+b.max.x,
      y0:m.position.y+b.min.y, y1:m.position.y+b.max.y,
      z0:m.position.z+b.min.z, z1:m.position.z+b.max.z}; };
  const E={frame:ext(d.frame),door:ext(d.door),pane:ext(d.pane),step:ext(d.step),grip:ext(d.grip)};

  // 1. THE ASSERTION THAT FLIPS. Before the piece the smallest extent of all three slabs was Z
  //    (0.03, 0.04, 0.045) and X spanned the door WIDTH. Now X is the thin axis on all three.
  for(const k of ['frame','door','pane']){ const e=E[k];
    ok(e.sx<e.sy&&e.sx<e.sz,'the '+k+' is thinnest toward the wall - x '+e.sx.toFixed(4)+
       ' against y '+e.sy.toFixed(4)+' and z '+e.sz.toFixed(4));
    ok(e.sx<0.09,'and thin in absolute terms, not merely relatively ('+k+' x '+e.sx.toFixed(4)+')'); }

  // 2. THE FACE SPANS THE WALL PLANE, at the dims it always had. Z is the extrude axis so it comes
  //    out exact; Y is a shape axis so it carries the bevel expansion. Both are checked against the
  //    ORIGINAL numbers, which is what makes this an axis swap and not a resize.
  const DIM={frame:[1.56,1.04],door:[1.48,0.96],pane:[0.95,0.30]};
  for(const k of ['frame','door','pane']){ const e=E[k], [ny,nz]=DIM[k];
    ok(Math.abs(e.sz-nz)<1e-6,'the '+k+' spans its full '+nz+' along the wall in z ('+e.sz.toFixed(4)+')');
    ok(e.sy>=ny-1e-6&&e.sy<=ny+0.05,'and its full '+ny+' up the wall in y ('+e.sy.toFixed(4)+
       ', bevel expansion included)'); }
  ok(E.door.sz*E.door.sy>1.4,'so the door presents a real door-sized face to the world, not an edge ('+
     (E.door.sz*E.door.sy).toFixed(3)+' square units)');

  // 3. WHERE THE WALL ACTUALLY IS. A scanline, because the shell side wall has NO vertices between
  //    its corner arcs - the straight run from y 0.6 to 2.1 is two vertices and a quad, so sampling
  //    positions finds nothing at the door height. So cut every triangle of every non-door body of
  //    the van by the plane y=Y, then cut that segment at z=0.6, and take the biggest x. That is
  //    the outer skin at the door centre line, measured off the geometry that ships.
  const st=G.inter.find(t=>t.strip&&/DOOR SEAL/.test(t.label)).strip;
  const skip=new Set([d.frame,d.door,d.pane,d.step,d.grip].concat(st.segs.map(sg=>sg.m)));
  const bodies=[];
  for(const o of d.group.children){ if(!o.isMesh||skip.has(o))continue;
    const p=o.geometry.attributes.position; if(!p||!p.count)continue;
    const ix=o.geometry.index, N=ix?ix.count:p.count, tri=[];
    const V=i=>[p.getX(i)+o.position.x,p.getY(i)+o.position.y,p.getZ(i)+o.position.z];
    for(let i=0;i<N;i+=3){ const a=ix?ix.getX(i):i, b=ix?ix.getX(i+1):i+1, c=ix?ix.getX(i+2):i+2;
      tri.push([V(a),V(b),V(c)]); }
    bodies.push(tri); }
  ok(bodies.length>=40,'the van skin came back as a real body list ('+bodies.length+' meshes)');
  const skinAt=(Y,Z)=>{ let best=-Infinity;
    for(const tri of bodies) for(const t of tri){ const pts=[];
      for(let e=0;e<3;e++){ const a=t[e], c=t[(e+1)%3];
        if((a[1]-Y)*(c[1]-Y)>0||a[1]===c[1])continue;
        const u=(Y-a[1])/(c[1]-a[1]);
        pts.push([a[0]+u*(c[0]-a[0]), a[2]+u*(c[2]-a[2])]); }
      if(pts.length<2)continue;
      const p1=pts[0], p2=pts[1];
      if((p1[1]-Z)*(p2[1]-Z)>0)continue;
      const v=p1[1]===p2[1]?0:(Z-p1[1])/(p2[1]-p1[1]);
      const x=p1[0]+v*(p2[0]-p1[0]);
      if(x>best)best=x; }
    return best; };
  let SKIN=-Infinity, worstProud=99, worstY=0, n=0;
  for(let Y=E.door.y0;Y<=E.door.y1+1e-9;Y+=0.05){ const sk=skinAt(Y,0.6); n++;
    if(sk>SKIN)SKIN=sk;
    if(E.frame.x1-sk<worstProud){ worstProud=E.frame.x1-sk; worstY=Y; } }
  ok(n>=28,'the whole door height got scanned ('+n+' slices)');
  ok(SKIN>1.4,'and the skin is where the bevel says it is, not where the nominal dim says ('+
     SKIN.toFixed(4)+', nominal half width 1.2)');

  // 4. FLUSH MEANS BOTH THINGS AT ONCE: the face stands OUT of the skin at every height, and the
  //    back of the frame is BEHIND the skin, so it is bedded into the wall with no gap to see under.
  ok(worstProud>0,'the door face stands proud of the van skin at every height - worst margin '+
     worstProud.toFixed(4)+' at y '+worstY.toFixed(2));
  ok(E.frame.x0<SKIN,'and the back of the frame is bedded inside the skin, so it is flush and not '+
     'a slab floating off the wall ('+E.frame.x0.toFixed(4)+' against '+SKIN.toFixed(4)+')');

  // 5. THE LAYERS STACK OUTWARD ALONG THE WALL NORMAL. This is what "restagger the offsets onto the
  //    wall axis" has to mean: strictly increasing faces, nothing coplanar, handle outermost.
  const stack=[['frame',E.frame.x1],['door',E.door.x1],['glass',E.pane.x1],['handle',E.grip.x1]];
  let mono=true; for(let i=1;i<stack.length;i++) if(!(stack[i][1]>stack[i-1][1]+0.005))mono=false;
  ok(mono,'the layers stack strictly outward along the wall normal - '+
     stack.map(q=>q[0]+' '+q[1].toFixed(3)).join(', '));

  // 6. AND THE STEP IS A STEP: it butts the wall, projects off it, and is wider ALONG the wall than
  //    it is deep off it. Turned the wrong way it was a narrow tongue pointing fore-aft.
  ok(E.step.x0<SKIN&&E.step.x1>SKIN+0.2,'the step butts the wall and projects off it ('+
     E.step.x0.toFixed(3)+' to '+E.step.x1.toFixed(3)+', skin '+SKIN.toFixed(3)+')');
  ok(E.step.sz>E.step.sx,'and it is wider along the wall than deep off it (z '+E.step.sz.toFixed(3)+
     ' against x '+E.step.sx.toFixed(3)+')');
  ok(E.step.z0<E.door.z1&&E.step.z1>E.door.z0,'and it sits under the doorway it serves');

  // 7. THE SEAL. Same twelve steps, same path shape, now wrapped on the reoriented frame - and the
  //    bead is outboard of the skin, which it was NOT before: at x 1.245 the attached beading was
  //    inside the van and only the freed segments were ever visible.
  const sealT=G.inter.find(t=>t.strip&&/DOOR SEAL/.test(t.label));
  ok(!!sealT,'the seal is still a strip tear on the reoriented door');
  ok(st.N===12&&st.N===st.path.length-1,'and still a TWELVE step path, read as path.length-1 (N '+
     st.N+', points '+st.path.length+')');
  ok(st.f===0,'nothing peeled it before this section (f '+st.f+')');
  const xs=Array.from(new Set(st.path.map(p=>+p.x.toFixed(6))));
  ok(xs.length===1,'the whole bead shares one wall-normal x, so it lies IN the wall plane ('+
     xs.join(',')+')');
  ok(xs[0]>SKIN,'and that x is outboard of the skin, so the attached bead is on the door and not '+
     'sealed inside the van ('+xs[0].toFixed(3)+' against '+SKIN.toFixed(3)+')');
  let stray=0; for(const p of st.path)
    if(p.y<E.frame.y0||p.y>E.frame.y1||p.z<E.frame.z0||p.z>E.frame.z1)stray++;
  ok(stray===0,'and every bead point sits inside the frame footprint in the wall plane ('+stray+' strays)');
  const axes=st.segs.map(sg=>sg.axis).join('');
  ok(axes==='yyyyyzzzyyyy','the bead runs up an edge, across the head and down the far edge, all of '+
     'it in the wall plane ('+axes+')');

  // 8. AND IT STILL COMES OFF, twelve bits, through real held input, with the frontier reachable at
  //    every one of them. Moving the bead 0.255 further out from the van could have broken this
  //    silently, so it is driven rather than argued: perch idiom at each frontier (FLAKES law 7).
  X.startGame(1); tick(8); park();
  const k=kq(), p0=sealT.getPos(); let stuck=false, bits=0;
  while(st.f<st.N&&!stuck){ const want=st.f+1, q=sealT.getPos();
    const yy=Math.max(0.25,q.y,X.groundHeightAt(q.x,q.z,3)+0.02);
    for(let i=0;i<3;i++){ k.x=q.x; k.z=q.z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); }
    hold(P1.grab); let sp=0;
    while(st.f<want&&sp<60*10){ k.x=q.x; k.z=q.z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); sp++; }
    un(P1.grab); tick(2);
    if(st.f<want)stuck=true; else bits++; }
  ok(!stuck&&bits===12,'all twelve bits come off, each reachable from a perch at its own frontier ('+
     st.f+'/'+st.N+')');
  ok(M('seal'),'the seal mission credits on the last bit');
  ok(!!G.props.find(pp=>pp.name==='door seal'),'and the WHOLE seal drops as one intact prop');
  const p1=sealT.getPos(), travel=Math.hypot(p1.x-p0.x,p1.y-p0.y,p1.z-p0.z);
  ok(travel>0.8,'the frontier travelled the frame rather than sitting still ('+travel.toFixed(2)+')');
  ok(st.segs.every(sg=>!sg.m||sg.m.visible===false),'and the attached segments are all cleared');
}

C.section('ONE CELL, ONE BIRD — jail occupancy is global, and a full cell shoos');
// The cage gate used to be per-bird — !(k.caged>0) — so rex could put BOTH keas in the one DOC
// crate at the same time and the transport read as a bunk room. Occupancy is now a property of the
// WORLD, asked through jailFull(), and a warrant served on a full cell degrades to a shoo that
// says so. Driven through the real chase collision rather than by calling cageKea, because the
// branch under test lives inside case 'chase'.
{
  X.startGame(2); tick(8); park();
  const a=G.keas[0], b=G.keas[1];
  const rex=G.humans.find(h=>h.key==='rex');
  ok(!!rex&&G.keas.length===2,'two keas and a ranger on the board ('+G.keas.length+' keas)');
  a.caged=0; b.caged=0; a.stun=0; b.stun=0;
  if(a.held){a.held.heldBy=null;a.held=null;} if(b.held){b.held.heldBy=null;b.held=null;}
  a.x=0; a.z=31.5; b.x=4; b.z=31.5;
  ok(!X.jailFull()&&X.jailedKea()===null,'the cell starts empty');
  G.wanted=3; G.wantedT=3.4;
  // rex parked on the bird, chase state forced, kea held on clean ground at reachable height:
  // d is 0.3 every frame so the collision test fires on the first update it can.
  const siege=k=>{ rex.stun=0; rex.launched=null; rex.asleep=false; rex.distracted=0;
    rex.state='chase'; rex.chaseKea=k; rex.giveUpT=0; rex.t=0;
    for(let i=0;i<40;i++){ k.y=0.25; k.vy=0; k.grounded=true; rex.x=k.x; rex.z=k.z-0.3;
      X.update(1/60);
      if((k.caged||0)>0||rex.state==='shoo')break; }
    return rex.state; };
  G._cageSpy=[]; G._shooSpy=[];
  siege(a);
  ok((a.caged||0)>0,'rex cages the first bird through the chase collision ('+(a.caged||0).toFixed(1)+'s)');
  ok(X.jailFull()&&X.jailedKea()===a,'and the world now reports the cell occupied by that bird');
  ok(G._cageSpy.length===1&&G._cageSpy[0].idx===a.idx,
     'the cage spy saw exactly one caging, of kea '+a.idx+' ('+JSON.stringify(G._cageSpy)+')');

  // THE ASSERTION THE PIECE EXISTS FOR: same warrant, same collision, second bird.
  const cagedBefore=G._cageSpy.length;
  siege(b);
  ok((b.caged||0)===0,'the second bird CANNOT be caged while the cell is taken (caged '+(b.caged||0).toFixed(2)+')');
  ok(G._cageSpy.length===cagedBefore,'the cage spy saw no second caging ('+G._cageSpy.length+' total)');
  ok(G._shooSpy.length===1&&G._shooSpy[0].idx===b.idx&&G._shooSpy[0].noVacancy===true,
     'it was shooed instead, and the shoo carries the no-vacancy reason ('+JSON.stringify(G._shooSpy)+')');
  ok(b.stun>0,'the shoo landed on the bird — stunned, feathers out ('+b.stun.toFixed(2)+')');
  ok((a.caged||0)>0,'and the sitting tenant was not evicted to make room ('+a.caged.toFixed(1)+'s)');
  ok(G.keas.filter(k=>(k.caged||0)>0).length===1,'exactly one bird is behind bars, which is the whole law');

  // AND IT IS OCCUPANCY, NOT A LOCKOUT: free the cell and the same bird cages on the next siege.
  a.caged=0; tick(4); b.stun=0; b.caged=0;
  ok(!X.jailFull(),'the cell reads empty again once the tenant leaves');
  G._cageSpy=[];
  siege(b);
  ok((b.caged||0)>0,'the second bird cages fine into an empty cell ('+(b.caged||0).toFixed(1)+'s)');
  ok(G._cageSpy.length===1&&G._cageSpy[0].idx===b.idx,'so the gate was the cell, not the bird ('+JSON.stringify(G._cageSpy)+')');

  // the latch reads the same predicate it always did — locked when nobody is in there.
  const lt=G.inter.find(it=>it.kind==='peck'&&it.label==='PECK THE LATCH');
  ok(!!lt,'the latch is still a peck target');
  ok(lt.locked()===false,'unlocked while a bird is inside');
  b.caged=0; tick(2);
  ok(lt.locked()===true,'and locked again with the cell empty');
  G._cageSpy=null; G._shooSpy=null;
}

C.section('THE STAR LEDGER — three stars a page, schema v2, and no cleared page is ever lost');
// The to-do list already has PAGES; it had no memory of how well any of them went. The ledger adds
// three stars per page keyed by AREA - cleared, style, clean - plus a per-page chaos snapshot,
// which is the thing that makes "earned WHILE the page was open" answerable at all: the run total
// cannot tell you which page paid for it. Pieces 13 and 14 grant style and clean; this piece owns
// the storage, the derivable cleared grant, the retro-grant for old saves, and the header pips.
// Storage is swapped for an inspectable Map so the wire format can be read, then handed back.
{
  const realLS=globalThis.localStorage, _m=new Map();
  globalThis.localStorage={getItem:k=>_m.has(k)?_m.get(k):null,
                           setItem:(k,v)=>_m.set(k,String(v)),removeItem:k=>_m.delete(k)};
  const S=X.STARS;
  try{
    // 1. A FRESH RUN. The ledger is reset and hydrated on every startGame the way the done list is,
    //    so a wiped save cannot leave a star standing that no save record supports.
    X.SAVE.wipe(); X.startGame(1); tick(8); park();
    const P1A=S.cur();
    ok(P1A==='THE CARPARK','page one is the open page ('+P1A+')');
    ok(Object.keys(G.stars).length===0,'no page has a star yet on a fresh run ('+
       Object.keys(G.stars).length+' recorded)');
    ok(S.pips(P1A)==='☆☆☆'&&S.count(P1A)===0,'so the open page shows three hollow pips ('+S.pips(P1A)+')');
    { const snap=G.pageChaos[P1A];
      ok(!!snap&&snap.close===null,'the open page has a live snapshot, not a closed one');
      ok(snap.open===(G.score||0),'and it opened at the current meter ('+snap.open+' vs score '+(G.score||0)+')'); }

    // 2. THE HEADER IS COMPUTED WITHOUT THE DOM, which is what makes the render assertable at all
    //    (the same seam as plateLines and hudReflow).
    ok(S.header(0).state==='open'&&S.header(0).text.indexOf('☆☆☆')>0,
       'the open page header carries its pips ('+S.header(0).text+')');
    ok(S.header(1).state==='next'&&S.header(1).text.indexOf('THE NEXT PAGE')>0,
       'the page after it is still a question mark ('+S.header(1).text+')');
    ok(S.header(2).text===null,'and pages beyond that render no header at all');
    ok(S.header(99)===null,'off the end of the book returns nothing');

    // 3. CLEAR THE PAGE. Chaos is banked first so the snapshot has something to measure, then every
    //    row of page one is ticked through done() - the real completion path, popups and all.
    const before=G.score||0;
    X.award(60,'LEDGER TEST',null); X.award(40,'LEDGER TEST',null);
    ok((G.score||0)>before,'the meter moved while page one was open ('+before+' -> '+(G.score||0)+')');
    const rows=S.rows(P1A);
    ok(rows.length>0,'page one has rows to clear ('+rows.length+')');
    for(const m of rows)X.done(m.id);
    tick(6);
    ok(S.rec(P1A).cleared===true,'CLEARED lands on the page whose every row is done');
    /* RE-BASED 2026-09-02 by piece 14, and it is a re-base and not a weakening: this page is cleared
       through done() with nobody ever caged, so under the clean-getaway star it now legitimately
       holds TWO. Everything the original assertion protected is still asserted - the count, the
       glyphs and the POSITION of each pip - and the middle one is still hollow, because only
       mission pay landed on this page and style wants half again as much. Piece 13 will fill it
       only when the page earns beyond its own missions. */
    ok(S.count(P1A)===2&&S.pips(P1A)==='★☆★','cleared and clean, style still hollow ('+S.pips(P1A)+')');
    ok(S.cur()!==P1A,'the page turned ('+P1A+' -> '+S.cur()+')');
    { const snap=G.pageChaos[P1A];
      ok(snap.close!==null,'the page it left is CLOSED');
      ok(snap.earned===snap.close-snap.open&&snap.earned>0,
         'and its earned figure is the meter it actually moved while open ('+snap.open+' -> '+
         snap.close+' = '+snap.earned+')'); }
    { const snap=G.pageChaos[S.cur()];
      ok(!!snap&&snap.close===null&&snap.open===(G.score||0),
         'the page it landed on opened fresh at the current meter ('+(snap?snap.open:'none')+')');
      ok(S.earned(S.cur())===0,'so the new page has earned nothing yet ('+S.earned(S.cur())+')'); }
    ok(S.header(0).state==='cleared'&&S.header(0).text.indexOf('★☆★')>0,
       'and the cleared page header shows the star it won ('+S.header(0).text+')');

    // 4. THE WIRE FORMAT. v2, with a stars map and a pages map, under the SAME storage key - the
    //    key is what a returning player is identified by, so bumping it would wipe every run alive.
    X.SAVE.write();
    const raw=_m.get('keaSaveV1_n');
    ok(!!raw,'a blob was written under the unchanged v1 key name');
    const blob=JSON.parse(raw);
    ok(blob.v===2,'the schema announces itself as v2 ('+blob.v+')');
    ok(!!blob.stars&&blob.stars[P1A]&&blob.stars[P1A].cleared===true,'the star is on the wire');
    ok(!!blob.pages&&blob.pages[P1A]&&blob.pages[P1A].earned>0,
       'so is the page chaos snapshot ('+JSON.stringify(blob.pages[P1A])+')');
    ok(Array.isArray(blob.done)&&blob.done.length>=rows.length&&'peak' in blob&&'hats' in blob,
       'and every v1 field is still there, so an older build reading this blob still works');

    // 5. ROUND TRIP. Restart and the stars come back off the blob, not off the world.
    const earnedV2=blob.pages[P1A].earned;
    X.startGame(1); tick(12);
    ok(S.rec(P1A).cleared===true,'the star survives the reload');
    ok(G.pageChaos[P1A]&&G.pageChaos[P1A].earned===earnedV2,
       'and so does the closed page snapshot ('+(G.pageChaos[P1A]||{}).earned+' vs '+earnedV2+')');
    ok(G.pageChaos[S.cur()]&&G.pageChaos[S.cur()].close===null,
       'while the page still in progress is re-opened rather than restored, because the meter itself restarts');

    // 6. THE LEGACY BLOB — the assertion the piece exists for. A v1 save has a done list and no
    //    stars at all. CLEARED is a function of the done list, so it is re-derived and nobody who
    //    cleared a page before this piece existed loses the pip for it.
    const legacy={done:blob.done,chapIdx:blob.chapIdx,peak:blob.peak,t:blob.t,band:blob.band,hats:blob.hats};
    ok(!('v' in legacy)&&!('stars' in legacy)&&!('pages' in legacy),'the legacy blob has no schema marker and no ledger');
    _m.set('keaSaveV1_n',JSON.stringify(legacy));
    X.startGame(1); tick(12);
    ok(S.rec(P1A).cleared===true,'CLEARED is retro-granted from a v1 done list ('+S.pips(P1A)+')');
    ok(S.rec(P1A).style===false&&S.rec(P1A).clean===false,
       'and ONLY cleared - style and clean are not derivable, so they are not invented');
    ok(!G.pageChaos[P1A]||G.pageChaos[P1A].close===null||G.pageChaos[P1A].earned===0,
       'no chaos snapshot is fabricated for a page the old save never measured');

    // 7. A WIPE TAKES THE LEDGER WITH IT. Same path as the Backspace-at-title wipe.
    X.SAVE.wipe(); X.startGame(1); tick(12);
    ok(Object.keys(G.stars).length===0,'wiping the save clears the ledger too ('+
       Object.keys(G.stars).length+' pages recorded)');
    ok(S.pips('THE CARPARK')==='☆☆☆','back to three hollow pips on page one');
  } finally { globalThis.localStorage=realLS; }
}

const SNOWZ0=-53, SNOWZ1=-17;
C.section('SNOW LIES ON THE COUNTRY — the shed no longer stands in a white saucer');
// TODO 28, verdict from Eric 2026-09-01: unbury, slide clear of the shed footprint, banking against
// the walls is welcome. The snow patches were the only ground decal in the file that never asked
// what was already built under them - the wear paths call paintAt and the stones dodge the seal,
// but snow was laid at a hardcoded y=0.05 wherever the draw landed, and two of the ten landed on
// the ski-field shed. THE RESOLVER IS THE ASSERTABLE PART, and deliberately so: the patch loop is
// inside the browser-only branch and cannot be reproduced headless (the tussock loop above it draws
// from the same seeded stream and never runs headless), so what is tested here is the total
// behaviour of snowSpot over the WHOLE envelope, which is stronger than testing the ten discs one
// seed happened to produce.
{
  X.boot();
  // 1. THE WORLD THE MEASUREMENT WAS TAKEN AGAINST. Assert it, so this section cannot pass quietly
  //    against a map where the shed has moved (FLAKES law 10 — read the convention, do not restate it).
  const shed=G.colliders.find(c=>Math.abs(c.x+40)<0.01&&Math.abs(c.z+40)<0.01);
  ok(!!shed,'the ski-field shed collider is where the session-3 measurement found it');
  ok(shed&&shed.top===2&&Math.min(shed.w,shed.d)>=X.SNOWBULK,
     'and it is a broad structure topped above the ground ('+(shed?shed.w+' x '+shed.d+' top '+shed.top:'none')+')');

  // 2. THE LADDER STARTS WHERE IT IS. Rung zero is the identity, which is what makes a patch that
  //    was never buried stay exactly where the draw put it — no movement, no mesh, no rnd() draw.
  ok(X.SNOWSLIDE[0][0]===0&&X.SNOWSLIDE[0][1]===0,'the first rung of the ladder is the candidate itself');
  ok(X.SNOWSLIDE.length===41,'and the ladder is a fixed table, not a search ('+X.SNOWSLIDE.length+' rungs)');
  { const q=X.snowSpot(10,-35,2.0);
    ok(q.x===10&&q.z===-35&&q.slid===0,'a clear candidate is returned untouched ('+q.x+','+q.z+')'); }

  // 3. THE TWO PATCHES THE LEDGER MEASURED, by their recorded numbers. Both were buried; both move.
  for(const [x,z,r,label] of [[-40.94,-40.41,2.57,'the big one, 45 of 80 samples on the roof'],
                              [-39.25,-39.79,1.69,'the small one, 62 of 80']]){
    ok(!!X.snowBlocked(x,z,r),'as found it is buried in the shed — '+label);
    const q=X.snowSpot(x,z,r);
    ok(!X.snowBlocked(q.x,q.z,q.r),'and it resolves onto clear country ('+x+','+z+' -> '+
       q.x.toFixed(2)+','+q.z.toFixed(2)+', slid '+q.slid.toFixed(2)+')');
    ok(q.r===r,'at its own radius, unshrunk ('+q.r+')');
    ok(q.slid>0&&q.slid<=8.0,'by a slide off the fixed ladder, not an arbitrary jump ('+q.slid.toFixed(2)+')'); }

  // 4. A TRUNK IS BANKED AGAINST, NOT SLID OFF. Snow round the foot of a tree is right; it is a
  //    BROAD footprint that turns a disc into a saucer. Set off the measured band: trunks 0.35-0.44.
  { const trunks=G.colliders.filter(c=>c.kind==='box'&&c.top>0.2&&Math.min(c.w,c.d)<X.SNOWBULK
                                       &&c.z>=SNOWZ0&&c.z<=SNOWZ1);
    ok(trunks.length>=3,'the snow band has slender uprights in it ('+trunks.length+')');
    let held=0; for(const c of trunks){ const q=X.snowSpot(c.x,c.z,2.0); if(q.slid===0)held++; }
    ok(held===trunks.length,'and a disc centred on every one of them stays put ('+held+'/'+trunks.length+')'); }

  // 5. TOTALITY — the assertion that makes the browser-only loop safe. Every candidate the generator
  //    could possibly draw resolves to a spot no building is under. Proven over the envelope rather
  //    than over one seed, so no future reseed can reintroduce the defect.
  { const F=X.SNOWFIELD; let n=0,stuck=0,slid=0,bad=0,worst=0;
    const t0=Date.now();
    for(let x=F.x0;x<=F.x1;x+=1)for(let z=F.z0;z<=F.z1;z+=1)for(const r of [1.5,2.5,3.6]){
      n++; const q=X.snowSpot(x,z,r);
      if(q.stuck){stuck++;continue;}
      if(q.slid>0)slid++; if(q.slid>worst)worst=q.slid;
      if(X.snowBlocked(q.x,q.z,q.r))bad++; }
    ok(n>8000,'the sweep covers the whole envelope at three radii ('+n+' candidates in '+(Date.now()-t0)+'ms)');
    ok(bad===0,'NOT ONE resolved spot has a building under it ('+bad+' of '+n+')');
    ok(stuck===0,'and none is stuck with nowhere to go ('+stuck+')');
    ok(slid>0&&slid<n*0.2,'only the minority near a structure moves at all ('+slid+', '+
       (100*slid/n).toFixed(1)+'% of the envelope)');
    ok(worst<=8.0,'and the worst slide is inside the ladder ('+worst.toFixed(2)+')'); }

  // 6. THE ENVELOPE IS ONE CONSTANT, read by the generator and by the resolver, so they cannot drift
  //    apart — the bug that put a disc off the edge of the map would be exactly that drift.
  ok(X.SNOWFIELD.x0===-50&&X.SNOWFIELD.x1===50&&X.SNOWFIELD.z0===-50&&X.SNOWFIELD.z1===-20,
     'the snow field envelope is named, not repeated ('+JSON.stringify(X.SNOWFIELD)+')');
  ok(!!X.snowBlocked(0,0,2).offmap,'a spot outside the envelope is refused as off-map');

  // 7. THE REGISTER EXISTS IN BOTH PATHS, and is honestly empty headless. Said out loud because the
  //    obvious "fix" — moving the generator out of the browser branch so G.snow fills here too —
  //    would fill it with positions the browser does not have, since the tussock loop above it draws
  //    from the same stream and only runs in the browser. An empty register beats a lying one.
  ok(Array.isArray(G.snow),'G.snow is a register like G.wear and G.stones');
  ok(G.snow.length===0,'and it is empty under node, because the discs are browser-only meshes ('+G.snow.length+')');
}

C.section('THE STYLE STAR — par is what the page paid you, times a named ratio');
{ const S=X.STARS;
  X.startGame(1); tick(8); park();
  const CH=G.chapters.slice();
  /* FLAKES law 1 again: done() writes the save and startGame hydrates it back, and this section also
     has to own the star record, so the reset is explicit and happens AFTER the ticks. */
  function freshBook(){ X.startGame(1); tick(8); park();
    for(const m of G.missions){ m.done=false; if(m.need!==undefined)m.n=0; }
    G.chapIdx=0; G.stars={}; G.pageChaos={}; S.open(CH[0]); tick(2); }
  const snap=a=>G.pageChaos[a]||{};
  /* every figure below is a MEASURED score delta, never a literal, because award() multiplies by the
     live combo - an assertion written against the base value would be asserting the combo, not the star */
  function pay(base){ const s0=G.score; X.award(base,'BATTERY PAY',null); return G.score-s0; }

  // 1. THE RATIO IS NAMED, AND PAR IS NOTHING BUT THE RATIO TIMES WHAT THE PAGE PAID.
  ok(S.PARRATIO===1.5,'par is a named ratio, fenced for playtest ('+S.PARRATIO+')');

  // 2. THE PURSE CLAIMS BOTH HANDLER ORDERS. Nine handlers in the file award and then call done();
  //    eight call done() and then award. A star that only saw one of them would be silently wrong on
  //    half the missions, and the half it was wrong about would depend on nothing but house style.
  freshBook();
  { const rows=S.rows(CH[0]);
    for(let q=0;q<rows.length-2;q++)rows[q].done=true;      // leave two, so the page does not turn yet
    const first=pay(100);
    X.done(rows[rows.length-2].id); tick(1);
    ok(snap(CH[0]).paid===first,'award THEN done: the payout is on the page ('+snap(CH[0]).paid+' of '+first+')');
    const before=snap(CH[0]).paid;
    X.done(rows[rows.length-1].id);                          // this one turns the page
    const atTurn=Object.assign({},snap(CH[0]));
    const late=pay(100);                                     // ...and pays afterwards, mid-frame
    tick(2);
    const after=snap(CH[0]);
    ok(after.paid===before+late,'done THEN award: the late payout is on the page too ('+
       after.paid+' = '+before+' + '+late+')');

    // 3. AND IT IS ON THE PAGE THAT EARNED IT, not on the page the turn moved to. The mission that
    //    turns a page is very often one that awards after done(), by which time curPage() has already
    //    moved on - so this is the difference between charging the new page for the old page last
    //    mission and not. It also decided a star: with the payout misfiled, the old page par was
    //    short by it and granted a style star for earning exactly what it paid.
    ok(G.chapIdx===1,'the page turned ('+CH[G.chapIdx]+')');
    ok((snap(CH[1]).paid||0)===0,'the new page starts owing nothing ('+(snap(CH[1]).paid||0)+')');

    // 4. THE STAR IS JUDGED AT END OF FRAME. At the instant of the turn the last payout is not in
    //    G.score yet; one tick later it is, and both sides of the comparison have it.
    ok(atTurn.earned<after.earned,'the turning frame was still paying out when the page closed ('+
       atTurn.earned+' -> '+after.earned+')');
    ok(S.par(CH[0])===Math.round(S.PARRATIO*after.paid),'par is the ratio times the payout ('+
       S.par(CH[0])+' = '+S.PARRATIO+' x '+after.paid+')');

    // 5. DENY. This page paid what it paid and the bird earned not a point more, so there was no
    //    flamboyance in it: earned equals paid, par is half again as much, no star.
    ok(after.earned===after.paid,'nothing but mission pay landed on this page ('+after.earned+')');
    ok(after.earned<S.par(CH[0]),'so it is under par ('+after.earned+' < '+S.par(CH[0])+')');
    ok(S.rec(CH[0]).style===false,'and the style star is DENIED');
    ok(S.rec(CH[0]).cleared===true,'while CLEARED still landed - the stars are independent'); }

  // 6. GRANT, on the other side of the same par. Freelance chaos in its own frame is NOT mission pay,
  //    which is the whole point of the purse: it lifts earned without lifting par.
  freshBook();
  { const rows=S.rows(CH[0]);
    for(let q=0;q<rows.length-1;q++)rows[q].done=true;
    const free=pay(500); tick(2);                            // its own frame, no mission in it
    ok((snap(CH[0]).paid||0)===0,'freelance chaos in its own frame owes the page nothing ('+
       (snap(CH[0]).paid||0)+')');
    const mp=pay(100);
    X.done(rows[rows.length-1].id); tick(2);
    const p=snap(CH[0]);
    ok(p.paid===mp,'only the mission frame counts as pay ('+p.paid+' of '+(free+mp)+' earned)');
    ok(p.earned>=free,'the freelance points are still EARNED ('+p.earned+')');
    ok(p.earned>=S.par(CH[0]),'which clears par ('+p.earned+' >= '+S.par(CH[0])+')');
    ok(S.rec(CH[0]).style===true,'and the style star is GRANTED');

    // 7. IDEMPOTENT. Judging again must not revoke a star already given, and must not re-announce it.
    const again=S.judge(CH[0]);
    ok(!!again&&again.granted===true&&again.fresh===false,'a second judgement keeps it and does not re-fire');
    ok(S.rec(CH[0]).style===true,'the star survives being judged twice'); }

  // 8. A PAGE THAT PAID NOTHING NEVER GRANTS ONE. A book cleared by staging (or by a future cheat)
  //    has paid==0, and 1.5 x 0 is 0, so a naive comparison would hand out a free star to every page.
  freshBook();
  { const rows=S.rows(CH[0]);
    for(const m of rows)m.done=true;                          // no award() anywhere in that
    S.sync(); S.judge(CH[0]);
    ok((snap(CH[0]).paid||0)===0,'the staged page paid nothing ('+(snap(CH[0]).paid||0)+')');
    ok(S.rec(CH[0]).style===false,'so no style star, even though earned >= par arithmetically');
    ok(S.par(CH[0])===0,'par on an unpaid page is zero, and zero is not a target ('+S.par(CH[0])+')'); }

  // 9. THE PURSE KEYS ON G.frames, NOT G.time, because the photographer PINS G.time in QUIET and a
  //    pinned clock would collapse every frame in the run into one purse - which would make freelance
  //    chaos from any earlier frame count as mission pay.
  { const f0=G.frames; X.update(1/60); X.update(1/60);
    ok(G.frames===f0+2,'G.frames advances once per update ('+f0+' -> '+G.frames+')');
    freshBook();
    const rows=S.rows(CH[0]);
    for(let q=0;q<rows.length-1;q++)rows[q].done=true;
    const pinned=7;                                            // exactly what QUIET does to the clock
    G.time=pinned; const free=pay(400);
    G.time=pinned; X.update(1/60);
    G.time=pinned; X.update(1/60);
    G.time=pinned; const mp=pay(100);
    X.done(rows[rows.length-1].id);
    G.time=pinned; X.update(1/60); X.update(1/60);
    ok(snap(CH[0]).paid===mp,'with the clock pinned the purse still separates the frames ('+
       snap(CH[0]).paid+' of '+(free+mp)+')'); }

  // 10. paid RIDES IN THE SAVE, because par has to survive a reload or the star becomes unearnable on
  //     a page you came back to. Closed pages only - an open page restarts its clock, which is the law
  //     piece 12 set when the meter itself restarts at zero on load.
  { freshBook();
    const rows=S.rows(CH[0]);
    for(let q=0;q<rows.length-1;q++)rows[q].done=true;
    pay(120); X.done(rows[rows.length-1].id); tick(2);
    const paid=snap(CH[0]).paid;
    ok(paid>0,'a closed page with a payout to remember ('+paid+')');
    X.SAVE.write();
    const blob=X.SAVE.load();
    ok(!!blob&&!!blob.pages&&blob.pages[CH[0]]&&blob.pages[CH[0]].paid===paid,
       'the payout is on the wire ('+(blob&&blob.pages&&blob.pages[CH[0]]?blob.pages[CH[0]].paid:'absent')+')');
    G.stars={}; G.pageChaos={};
    S.init(blob);
    ok(snap(CH[0]).paid===paid,'and it comes back off a reload ('+snap(CH[0]).paid+')');
    ok(S.par(CH[0])===Math.round(S.PARRATIO*paid),'so par survives the reload ('+S.par(CH[0])+')');
    const cur=S.cur();
    ok((snap(cur).paid||0)===0,'while the page still open restarts its own clock ['+cur+'] ('+
       (snap(cur).paid||0)+')'); }
}

C.section('THE CLEAN GETAWAY STAR — the cage is remembered, escaping does not clear it');
{ const S=X.STARS;
  let CH=G.chapters.slice();
  function freshBook(mode){ X.startGame(mode||1); tick(8); park();
    CH=G.chapters.slice();
    for(const m of G.missions){ m.done=false; if(m.need!==undefined)m.n=0; }
    G.chapIdx=0; G.stars={}; G.pageChaos={}; G._cageSpy=[]; S.open(CH[0]); tick(2); }
  /* turn the page the honest way: finish the last row through done(), with a payout so the page has
     books to close, and let the end-of-frame drain judge it */
  function turnPage(){ const rows=S.rows(CH[G.chapIdx]);
    for(let q=0;q<rows.length-1;q++)rows[q].done=true;
    X.award(100,'BATTERY PAY',null);
    X.done(rows[rows.length-1].id); tick(2); }
  const rex=()=>G.humans.find(h=>h.key==='rex');
  const snap=a=>G.pageChaos[a]||{};

  // 1. A CLEAN PAGE GRANTS IT, and the three stars are independent: this page is cleared and clean
  //    and NOT stylish, because nothing but mission pay landed on it.
  freshBook(); turnPage();
  ok((snap(CH[0]).caged||0)===0,'the page recorded no cagings ('+(snap(CH[0]).caged||0)+')');
  ok(S.rec(CH[0]).clean===true,'so the clean-getaway star is GRANTED');
  ok(S.rec(CH[0]).cleared===true&&S.rec(CH[0]).style===false,
     'and the three stars are independent (cleared yes, style no, clean yes)');
  ok((snap(CH[1]).caged||0)===0,'the next page opens clean too ('+(snap(CH[1]).caged||0)+')');

  // 2. ONE CAGING VOIDS THE PAGE, AND ESCAPING DOES NOT CLEAR IT. The star is for not being caught,
  //    not for getting out, so the counter only ever goes up. The cage spy is the independent witness
  //    that a caging actually happened - it is written by cageKea beside the page mark, not by it.
  freshBook();
  rex().cageKea(G.keas[0]);
  ok(G._cageSpy.length===1,'the cage spy saw the caging ('+G._cageSpy.length+')');
  ok(snap(CH[0]).caged===1,'and the page was marked ('+snap(CH[0]).caged+')');
  G.keas[0].caged=0; tick(6);                       // out of the cage, long before the page turns
  ok((G.keas[0].caged||0)===0,'the bird is out of the cage again');
  turnPage();
  ok(snap(CH[0]).caged===1,'the page still remembers it ('+snap(CH[0]).caged+')');
  ok(S.rec(CH[0]).clean===false,'so the clean-getaway star is DENIED');
  ok(S.rec(CH[0]).cleared===true,'while CLEARED still lands - being caught does not undo the work');
  ok((snap(CH[1]).caged||0)===0,'and the NEXT page is not punished for it ('+(snap(CH[1]).caged||0)+')');

  // 3. THE COUNT IS A COUNT, not a flag, and two cagings with an escape between them read as two.
  freshBook();
  rex().cageKea(G.keas[0]); G.keas[0].caged=0; tick(3);
  rex().cageKea(G.keas[0]); G.keas[0].caged=0; tick(3);
  ok(snap(CH[0]).caged===2,'two cagings, two marks ('+snap(CH[0]).caged+')');
  ok(G._cageSpy.length===2,'and the spy agrees ('+G._cageSpy.length+')');

  // 4. EITHER BIRD COUNTS IN CO-OP, and it needs no special case: cageKea is the ONE place in the file
  //    that puts a bird behind bars, it is called per bird, and the page never asks which.
  freshBook(2);
  ok(G.keas.length===2,'two birds on the couch ('+G.keas.length+')');
  rex().cageKea(G.keas[1]); tick(2);
  ok(snap(CH[0]).caged===1,'the SECOND bird getting caged marks the page ('+snap(CH[0]).caged+')');
  turnPage();
  ok(S.rec(CH[0]).clean===false,'so kea two can lose kea one the star, which is co-op');

  // 5. IT RIDES IN THE SAVE. Without this a reload would hand the star to a page that had been dirty,
  //    since a fresh snapshot starts at zero cagings.
  freshBook();
  rex().cageKea(G.keas[0]); tick(2); turnPage();
  { const caged=snap(CH[0]).caged;
    ok(caged===1,'a closed page with a caging on the record ('+caged+')');
    X.SAVE.write();
    const blob=X.SAVE.load();
    ok(!!blob&&!!blob.pages&&blob.pages[CH[0]]&&blob.pages[CH[0]].caged===caged,
       'the caging is on the wire ('+(blob&&blob.pages&&blob.pages[CH[0]]?blob.pages[CH[0]].caged:'absent')+')');
    G.stars={}; G.pageChaos={}; S.init(blob);
    ok(snap(CH[0]).caged===caged,'and it comes back off a reload ('+snap(CH[0]).caged+')');
    ok(S.judgeClean(CH[0]).granted===false,'so a re-judge after the reload still refuses the star'); }

  // 6. NO RETRO-GRANT, WHICH IS THE OPPOSITE CALL TO PIECE 12 AND FOR A GOOD REASON. CLEARED is a
  //    function of the done list, so every save can be asked. Nothing in a v1 or early-v2 blob records
  //    whether anybody was caged, so granting on a silent record would hand every legacy page a free
  //    third star. The same blob is asserted BOTH ways in one go: cleared retro-granted, clean not.
  { freshBook();
    const rows=S.rows(CH[0]);
    const legacy={v:2, done:rows.map(m=>m.id), chapIdx:0, stars:{},
                  pages:{}};
    legacy.pages[CH[0]]={open:0,close:300,earned:300,paid:100};   // no caged field at all, as v1 had none
    for(const m of rows)m.done=true;
    G.stars={}; G.pageChaos={};
    const rep=S.init(legacy);
    ok(rep.retro>=1,'a legacy blob still retro-grants CLEARED ('+rep.retro+')');
    ok(S.rec(CH[0]).cleared===true,'so nobody loses a cleared page to the upgrade');
    ok(S.rec(CH[0]).clean===false,'but the clean star is NOT invented from a silent record');
    ok((snap(CH[0]).caged||0)===0,'the missing field reads as zero cagings, which is why judging is what gates it'); }
}

C.section('HOME POSITIONS — every prop remembers the transform it was built at');
{ const HM=X.HOMES, B=HOMESATBOOT;
  X.startGame(1); tick(8); park();

  // 1. EVERY PROP BUILT WITH THE WORLD HAS A COMPLETE HOME. Six finite numbers, no exceptions - a prop
  //    with a partial home is worse than one with none, because a restore would move it to NaN.
  ok(B.length>15,'the built world has props to remember ('+B.length+')');
  { const bad=B.filter(p=>!p.home||['x','y','z','rx','ry','rz'].some(k=>!isFinite(p.home[k])));
    ok(bad.length===0,'every one carries a complete spawn transform (bad: '+
       (bad.map(p=>p.name).join(', ')||'none')+')'); }
  ok(HM.R===1.6,'the home radius is a named constant, fenced for playtest ('+HM.R+')');

  // 2. THE CLASSES TODO 17 NAMES ARE ALL THERE, named by what the foundation is FOR: carry-back for
  //    the displaceables, replacement for the consumables, because a scoffed sandwich cannot be
  //    carried home.
  { const names=B.map(p=>p.name);
    for(const want of ['road cone','boot','ute keys','sandwich'])
      ok(names.filter(nm=>nm===want).length>0,'the ledger covers '+want+' ('+
         names.filter(nm=>nm===want).length+' of them)');
    const cones=B.filter(p=>p.name==='road cone');
    ok(cones.length>=4&&cones.every(c=>c.home),'all the cones remember where they were stacked ('+cones.length+')');
    ok(B.filter(p=>p.shiny).length>0&&B.filter(p=>p.shiny).every(p=>p.home),'the shinies do too ('+
       B.filter(p=>p.shiny).map(p=>p.name).join(', ')+')');
    ok(B.filter(p=>p.food).length>0,'and the food ('+B.filter(p=>p.food).map(p=>p.name).join(', ')+')');
    ok(B.filter(p=>p.food).every(p=>p.cls==='consumable'),'food is classed consumable');
    ok(B.filter(p=>!p.food).every(p=>p.cls==='displaceable'),'and everything else is a displaceable');
    ok(G.props.every(p=>p.homeClass===HM.cls(p)),'the stored class always agrees with the rule that made it'); }

  // 3. THE SWEEP IS THE POINT OF THE PIECE, and the skis are the case that proves it. They are laid
  //    over at rotation.x=1.35 on the line AFTER propAt returns, so a factory-time read would have
  //    recorded them flat and a later restore would have stood them up on the rack like new stock.
  { const skis=B.filter(p=>p.name==='ski');
    ok(skis.length===2,'two skis on the rack at build ('+skis.length+')');
    ok(skis.every(k=>Math.abs(k.home.rx-1.35)<1e-9),'their home rotation is the laid-over one they were BUILT with ('+
       skis.map(k=>k.home.rx.toFixed(2)).join(', ')+')');
    ok(skis.every(k=>Math.abs(k.home.rx-k.mrx)<1e-9),'which is exactly what the mesh said at build time');
    const rot=B.filter(p=>Math.abs(p.home.rx)>1e-9||Math.abs(p.home.ry)>1e-9||Math.abs(p.home.rz)>1e-9);
    ok(rot.length>0,'so at least one prop is built rotated and the sweep earns its keep ('+rot.length+')'); }
  { let off=0;
    for(const p of B){ if(p.mx===null)continue;
      if(Math.hypot(p.home.x-p.mx,p.home.z-p.mz)>1e-9||Math.abs(p.home.y-p.my)>1e-9)off++;
      if(Math.abs(p.home.rx-p.mrx)>1e-9||Math.abs(p.home.ry-p.mry)>1e-9||Math.abs(p.home.rz-p.mrz)>1e-9)off++; }
    ok(off===0,'and at build time every home IS the mesh, position and rotation, not an approximation ('+off+' off)'); }

  // 4. HOME IS NOT WHERE THE PROP IS. It survives being carried, dropped, tumbled and settled - the
  //    whole point, since a home that follows the prop can never bring anything back.
  { const b=G.props.find(p=>p.name==='boot');
    ok(!!b,'a boot to displace');
    const h0=JSON.stringify(b.home);
    b.x=30; b.z=30; b.y=0.4; b.vy=-1; b.mesh.position.set(30,0.4,30); tick(40);
    ok(JSON.stringify(b.home)===h0,'the home did not follow it ('+h0+')');
    ok(!HM.at(b),'and it reads as away from home ('+HM.dist(b).toFixed(2)+'u > '+HM.R+')');
    b.x=b.home.x+HM.R*0.5; b.z=b.home.z; b.mesh.position.set(b.x,b.y,b.z);
    ok(HM.at(b),'brought back inside the radius it reads as home ('+HM.dist(b).toFixed(2)+'u)');
    b.x=b.home.x+HM.R+0.2; b.mesh.position.set(b.x,b.y,b.z);
    ok(!HM.at(b),'and just outside it does not ('+HM.dist(b).toFixed(2)+'u)');

    // 5. IT SURVIVES SAVE AND RESTART. The blob carries no prop positions at all, so the risk is not
    //    losing the home - it is a hydrate or a restart rewriting it to wherever the prop happens to
    //    be lying, which would quietly declare every displaced prop already home.
    X.SAVE.write(); X.startGame(1); tick(8);
    const b2=G.props.find(p=>p.id===b.id);
    ok(!!b2&&JSON.stringify(b2.home)===h0,'its home came through the save and the restart intact ('+
       (b2?JSON.stringify(b2.home):'gone')+')'); }

  // 6. A PROP THAT SPAWNS DURING PLAY GETS ITS OWN HOME FROM THE FACTORY - its spawn point, which is
  //    the only honest answer for a thing the bin coughed up mid-game.
  { const spy=G.props.map(p=>p.id);
    X.startGame(1); tick(8);                        // startGame spawns the tramper beanie through propAt
    const fresh=G.props.filter(p=>spy.indexOf(p.id)<0);
    ok(fresh.length>0,'a prop was created after the world build ('+
       (fresh.map(p=>p.name).join(', ')||'none')+')');
    ok(fresh.every(p=>p.home&&['x','y','z','rx','ry','rz'].every(k=>isFinite(p.home[k]))),
       'and it has a complete home of its own');
    ok(fresh.every(p=>p.homeClass===HM.cls(p)),'classed like everything else'); }

  // 7. THE REGISTER IS IDEMPOTENT, so a future biome load can re-run it. It rewrites homes to the
  //    CURRENT transforms by design, so the live homes are put back afterwards - a battery that
  //    leaves the world lying about where its props belong is a trap for the next section.
  { const keep=G.props.map(p=>({p,h:Object.assign({},p.home)}));
    const n1=HM.register(), n2=HM.register();
    const withMesh=G.props.filter(p=>p.mesh).length;
    ok(n1===n2&&n1===withMesh,'re-sweeping is idempotent and counts every prop ('+n1+' then '+n2+' of '+withMesh+')');
    ok(G.homesN===n2,'and the count is on G where it can be inspected ('+G.homesN+')');
    for(const k of keep)k.p.home=k.h;
    ok(G.props.every(p=>!!p.home),'homes restored after the sweep test'); }
}

C.section('PERF FLOOR');
X.startGame(2); tick(30);
{ const t0=Date.now(); for(let i=0;i<600;i++)X.update(1/60); const ms=(Date.now()-t0)/600;
  ok(ms<8,'headless update mean '+ms.toFixed(2)+'ms (< 8ms floor)'); }

process.exitCode=C.report()?1:0;
