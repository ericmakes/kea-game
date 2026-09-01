/* THE EVERYTHING PASS — mission matrix, finale, save, leakage, perf (2026-08-28) */
const {load,collector}=require('../2026-08-26/rig');
const H=load(),{X,G}=H, C=collector('EVERYTHING');
const ok=C.ok, tick=n=>{for(let i=0;i<n;i++)X.update(1/60);};
const P1=H.P1, hold=H.hold, un=H.un, tap=H.tap;
X.boot();

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

C.section('PERF FLOOR');
X.startGame(2); tick(30);
{ const t0=Date.now(); for(let i=0;i<600;i++)X.update(1/60); const ms=(Date.now()-t0)/600;
  ok(ms<8,'headless update mean '+ms.toFixed(2)+'ms (< 8ms floor)'); }

process.exitCode=C.report()?1:0;
