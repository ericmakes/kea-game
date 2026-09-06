/* THE EVERYTHING PASS — mission matrix, finale, save, leakage, perf (2026-08-28) */
const {load,collector}=require('../2026-08-26/rig');
const H=load(),{X,G}=H, C=collector('EVERYTHING');
const ok=C.ok, tick=n=>{for(let i=0;i<n;i++)X.update(1/60);};
const P1=H.P1, hold=H.hold, un=H.un, tap=H.tap;
X.boot();

/* TODO 17: THE BUILD-TIME TRUTH ABOUT PROP HOMES, captured here and nowhere else. The sections below
   spend three hundred assertions carrying props around, and one of them boots the game a SECOND time
   (the snow section, which needs a fresh world for its resolver sweep). The snapshot is still the
   only thing that can speak for the FIRST build, so the home-positions section keeps asserting
   against it - a rebuild is a different world even when it is the only one in the registries.
   TODO 48 IS FIXED (session 7): buildWorld now empties the registries it fills, so the second boot
   replaces the world instead of adding a second copy of it on top. The counts below are what one
   world costs, and the section at the end of this file holds them to it. */
/* THE MAPS THAT ARE REALLY REGISTERED, captured before any section can register a stand-in.
   Five cleanup assertions used to read `Object.keys(BIOME.ALL).length===2` — a literal restating
   how many maps the tour happened to have — and all five went red the day the campground landed,
   none of them because anything leaked. What they actually mean is "this section put its stand-in
   back", so that is what they compare against now, and the village, the river and the station will
   not cost another edit. */
const REALBIOMES=Object.keys(X.BIOME.ALL).slice();
const biomesRestored=()=>{ const now=Object.keys(X.BIOME.ALL);
  return now.length===REALBIOMES.length&&REALBIOMES.every(id=>now.includes(id)); };
const BOOTCOUNTS=Object.fromEntries(X.WORLDREGS.map(r=>[r,(G[r]||[]).length]));
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
/* RECALIBRATED AT REPLAT P4, WITH EVIDENCE. The claim has not moved: the whole field leans ONE
   WAY, wandering slowly across the flats, because that is what a breeze looks like on tussock and
   the alternative — every blade picking its own direction — reads as static rather than as a
   field. What moved is WHERE the claim lives. P4 put every per-blade decision in the vertex
   shader, so `grassBlade` is gone; the 260 tuft cones still need a CPU pose, and both of them now
   read ONE named constant block (GRASS.comb) that the shader line is generated from by string
   interpolation.
   THE LEAN BOUND IS DERIVED, NOT SAMPLED, WHICH IS STRICTLY STRONGER. The old form drew 600 blades
   and checked the spread of what came back — an empirical bound that could pass on a lucky sample
   and, being a hardcoded pair of numbers, went red the moment the biome profile legitimately
   changed. A sine of amplitude `amp` spans exactly 2*amp end to end, so the bound is the constant,
   and it holds for every point in the world rather than for six hundred of them. */
{ const C=X.GRASS.comb;
  ok(!!C&&typeof C.amp==='number','the comb is one named constant block (GRASS.comb)');
  ok(2*C.amp<1.4,'THE WHOLE FIELD LEANS ONE WAY — the comb spans '+(2*C.amp).toFixed(2)+
     ' rad end to end, which is a lean and not a scatter (bound 1.4)');
  ok(2*C.amp>0.2,'and it does wander across the flats rather than being one fixed angle ('+
     (2*C.amp).toFixed(2)+' rad)');
  /* and the sampled behaviour still agrees with the derived bound, which is what makes the
     derivation a claim about THIS code rather than about trigonometry */
  { const D=[]; for(let i=0;i<600;i++) D.push(X.grassComb(-58+i*0.19,-40+((i*7)%80)));
    const lo=Math.min.apply(null,D), hi=Math.max.apply(null,D);
    ok(hi-lo<=2*C.amp+1e-9,'six hundred samples stay inside that derived bound ('+
       (hi-lo).toFixed(3)+' <= '+(2*C.amp).toFixed(3)+')');
    ok(hi-lo>0.2,'and they genuinely spread, so this is a real comparison ('+(hi-lo).toFixed(2)+' rad)'); }

  /* ONE SET OF NUMBERS, TWO CONSUMERS. The tufts and the blades sharing a comb is the thing this
     section is actually protecting, and it is now checkable: the shader's dir line is BUILT from
     the same constants, so a change to GRASS.comb reaches both or neither. */
  { const vs=X.GRASS_GLSL_V;
    ok(vs.indexOf('#define COMB_AMP  '+C.amp.toFixed(6))>0,
       'the blade shader is generated from those constants, not from a second copy of them');
    ok(/float dir=COMB_BASE\+COMB_AMP\*sin\(w\.x\*COMB_FX\+w\.y\*COMB_FZ\)/.test(vs),
       'and its dir line is the same expression the tufts use');
    const src=require('fs').readFileSync(require('path').join(__dirname,'..','..','src','game.mjs'),'utf8');
    ok(src.indexOf('function grassBlade(')<0,
       'the old CPU pose function is GONE rather than left beside the shader to drift out of step'); }

  /* THE CLUMP STILL AGREES WITH ITSELF. Blades in one mound share a height, blades four cells away
     do not — the tuft seam carries the same cell hash the shader does. */
  ok(X.grassTuftPose(10.1,4.1).cell===X.grassTuftPose(11.2,4.9).cell,'blades inside one clump share a height cell');
  ok(X.grassTuftPose(10.1,4.1).cell!==X.grassTuftPose(20.6,4.1).cell,'a clump four cells away is a different height');
  const hs=[]; for(let i=0;i<400;i++) hs.push(X.grassTuftPose(-40+i*0.21,12+((i*5)%60)).h);
  const hlo=Math.min.apply(null,hs), hhi=Math.max.apply(null,hs);
  const HB=X.GRASS.biomes.carpark.h;
  ok(hlo>=HB[0]*0.72-1e-6&&hhi<=HB[1]*(0.72+0.56)+1e-6,
     'heights stay inside the biome profile scaled by the clump weight ('+hlo.toFixed(2)+' to '+
     hhi.toFixed(2)+', profile '+HB[0]+'-'+HB[1]+')');
  ok(hhi-hlo>0.15,'and they run from grazed to tall rather than all agreeing ('+(hhi-hlo).toFixed(2)+')');
}

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

  /* TEXTURE: the scatter alternates two greys, and only one of them was registered for the
     speckle detail map, so half the pebbles rendered flat and smooth while their siblings were
     stone. Read the registry rather than restating it (law 10).
     RECALIBRATED AT REPLAT P3, WITH EVIDENCE, AND THE CONTRACT IS THE SAME CONTRACT. Both greys
     left MAPKIND together and arrived in MATFAM together: they are the scanned `gravel` family
     now (gravel_floor_02, CC0, licensed in assets/LICENCES.md) instead of two registrations of one
     procedural speckle canvas. The claim this assertion was written to defend has not moved one
     inch — BOTH greys carry the SAME surface treatment, so no pebble renders as flat smooth putty
     next to a textured sibling — so what changed is the registry it reads, not the bar it sets.
     It is also strictly stronger than it was, because it now checks the two greys agree with EACH
     OTHER rather than each matching a hardcoded kind name: half the scatter quietly landing in a
     different family is the modern shape of the original defect, and the old form could not see
     it. The MAPKIND half is kept as an exclusion — a colour in both registries would take
     whichever branch mat() tested first, which is the one way this could go wrong silently. */
  const tints=[...new Set(g.map(p2=>p2.color))];
  ok(tints.length===2,'the scatter uses two greys ('+tints.map(c=>'0x'+c.toString(16).toUpperCase()).join(' ')+')');
  const famOf=c=>X.MATFAM[c];
  let mapped=0; for(const c of tints) if(famOf(c)==='gravel')mapped++;
  ok(mapped===2,'and BOTH are the scanned gravel family now, so no pebble renders as flat smooth '+
     'putty ('+mapped+'/2, families '+tints.map(c=>famOf(c)||'none').join(' + ')+')');
  ok(tints.every(c=>X.MAPKIND[c]===undefined),
     'and NEITHER is still registered for a procedural canvas — one colour in both registries '+
     'would take whichever branch mat() happened to test first ('+
     tints.map(c=>X.MAPKIND[c]||'-').join(' + ')+')');
}

C.section('THE GRASS TINT IS SEEDED, NOT A LOTTERY');
/* RECALIBRATED AT REPLAT P4, WITH EVIDENCE, AND THE CLAIM IS STRONGER THAN IT WAS.
   The old contract was: the blade tint must be immune to the world seed and to Math.random, so
   that changing the number of objects in the world cannot retint the whole country. It was met by
   giving the tint its own fixed-seed generator on the CPU — `grassTint`/`grassTintReset`.
   P4 DELETED THAT SEAM because it deleted the thing it served. A camera-anchored field decides
   where every blade stands in the VERTEX SHADER, so there are no per-instance colours to generate:
   a blade's tint is now a pure function of the WORLD POSITION it lands on, hashed in GLSL. That is
   not a weaker guarantee, it is the same guarantee without a sequence — there is no ordering to
   perturb, so object count, world seed and Math.random are all structurally incapable of moving it,
   rather than merely observed not to.
   WHAT IS ASSERTED NOW is the property that actually matters and can still be reached from node:
   the field is built without touching Math.random at all, and the tint is derived from the blade's
   world position rather than from anything that could vary run to run. The dead functions are gone
   rather than left exported and unused — a seam nothing goes through is a trap, and the previous
   version of this section would have kept passing over one. */
{ const src=require('fs').readFileSync(require('path').join(__dirname,'..','..','src','game.mjs'),'utf8');
  const body=src.slice(src.indexOf('function buildGrass('), src.indexOf('function nightTint'));
  ok(body.length>200,'buildGrass is where it is expected to be ('+body.length+' chars)');
  ok(body.indexOf('Math.random')<0,'buildGrass touches Math.random nowhere — an object-count change '+
     'cannot reshuffle the field');
  const vs=src.slice(src.indexOf('const GRASS_GLSL_V='), src.indexOf('const GRASS_GLSL_F='));
  ok(vs.length>800,'the blade vertex shader is where it is expected to be ('+vs.length+' chars)');
  ok(vs.indexOf('vGrassTint=')>0,'the blade computes its own tint in the vertex shader');
  ok(vs.indexOf('mix(mix(uTintA,uTintB')>0&&vs.indexOf('uTintC,h1.x')>0&&vs.indexOf('vGrassTint=body')>0,
     'and it mixes the biome three-tint the recipe supplies, not a literal');
  /* P4b: AND THE BLADE IS NOT ONE FLAT COLOUR. Green at the foot, body through the middle, rust at
     the tip — the thing that was missing when Eric read the whole country as monochrome. */
  ok(vs.indexOf('uTintBase')>0&&vs.indexOf('uTintTip')>0,
     'the blade carries a base and a tip colour as well as a body');
  ok(vs.indexOf('body=mix(body,uTintC,cw*')>0,
     'and the MOUND leans its own way, or a field of varied blades averages back to one colour');
  /* THE TINT IS A FUNCTION OF WORLD POSITION, WHICH IS THE WHOLE POINT. The hash inputs must be
     the world position `w`, never the instance index — an index-derived tint would travel WITH the
     blade as the field follows the camera, so a patch of ground would change colour as you walked
     toward it. That is the P4 shape of the defect this section has always been about. */
  ok(vs.indexOf('vec2 h1=keaGH2(w*')>0&&vs.indexOf('h2=keaGH2(w*')>0,
     'every per-blade draw is hashed from the WORLD POSITION, so a blade cannot carry its '+
     'appearance across the world as the field follows the camera');
  ok(vs.indexOf('gl_InstanceID')<0&&vs.indexOf('aOff*uNear')>0,
     'the lattice offset only places the blade; it never decides what the blade looks like');
  ok(src.indexOf('function grassTint(')<0&&src.indexOf('function grassTintReset(')<0,
     'and the CPU tint seam is GONE, not left exported and unreachable');
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
  let welded=0, leaked=0, keptEdge=0, blunted=0, arc=0, banded=0;
  for(const idx of by.values()){
    if(idx.length<2)continue;
    const before=maxAng(fl,idx), after=maxAng(sm,idx), near=minPair(fl,idx);
    if(before<=lim){ if(after<=0.5)welded++; else leaked++; }
    else if(near>lim){ if(after>lim*0.5)keptEdge++; else blunted++; }   // no two normals close: a real edge
    else arc++;                                    // a chain of small steps round an arc - smooths
    // ADDED 2026-09-03: whatever bucket it landed in, if it is not a genuine hard edge it must
    // actually END smooth. The arc bucket never checked this - see the note on the assertion below.
    if(near<=lim && after>0.5) banded++;
  }
  ok(welded>0&&leaked===0,'every facet join inside '+lim+'deg was welded smooth ('+welded+
     ' welded, '+leaked+' left banded)');
  ok(keptEdge+blunted===0,'a ROUNDED box has no hard edges to keep - every edge is an arc ('+
     keptEdge+'/'+blunted+')');
  // AMENDED 2026-09-03 (REPLAT P1 step 3). This read `ok(arc>0, 'so the chain groups smooth as the
  // arcs they are')` — and it did not check that they smoothed. It counted them and called that a
  // pass. Measured on the same shape, same call, both stacks:
  //     r128  358 groups, 333 welded, 25 arc — and ALL 25 arc groups ended with a >0.5deg gap,
  //           i.e. 25 vertex groups were STILL BANDED and the battery called it green
  //     r185  352 groups, 352 welded, 0 arc, 0 banded — the box smooths everywhere
  // So r185 did not lose the chain case; ExtrudeGeometry stopped producing the seam that made it,
  // and the 25 residual bands went with it. Re-pinning `arc>0` would have demanded the defect back.
  // The claim it should always have made, which r128 would have FAILED and r185 passes:
  ok(banded===0,'no group that is not a genuine hard edge is left banded ('+banded+' banded; '+
     welded+' welded, '+arc+' chain groups)');

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

  // NORMALS STAY UNIT LENGTH, except on triangles that have no area to take a normal from.
  // AMENDED 2026-09-03 (REPLAT P1 step 3). This read `nonUnit===6` and described "the 6 that three
  // emits zeroed on two ZERO-AREA seam triangles". Both numbers were three's, not the game's:
  // r128's ExtrudeGeometry emitted two degenerate seam triangles on this shape and zeroed their
  // 6 vertex normals. r185's does not, so the count went to 0 and the battery went red on a
  // three.js IMPROVEMENT. Measured on both, same shape, same call:
  //     r128  714 tris, 2 zero-area, 6 zeroed normals
  //     r185  700 tris, 0 zero-area, 0 zeroed normals
  // Re-pinning 6 to 0 would just swap one version's magic number for another's. So the claim is
  // now tied to its CAUSE and holds on either stack: the only non-unit normals in the mesh are the
  // ones belonging to zero-area triangles, three per such triangle, and there are no others. That
  // is strictly stronger than the count it replaces — it would still catch a real smoothing bug,
  // and if a future three re-introduces degenerate triangles it says so in as many words.
  const triArea=t=>{ const A=t*3;
    const ax=pos.getX(A),ay=pos.getY(A),az=pos.getZ(A);
    const bx=pos.getX(A+1)-ax,by=pos.getY(A+1)-ay,bz=pos.getZ(A+1)-az;
    const cx=pos.getX(A+2)-ax,cy=pos.getY(A+2)-ay,cz=pos.getZ(A+2)-az;
    return Math.hypot(by*cz-bz*cy, bz*cx-bx*cz, bx*cy-by*cx); };
  let degenTris=0, degenVerts=0;
  for(let t=0;t<pos.count/3;t++) if(triArea(t)<1e-12){ degenTris++; degenVerts+=3; }
  let nonUnit=0, nonUnitOffDegen=0;
  for(let i=0;i<sm.count;i++){ const L=Math.hypot(sm.getX(i),sm.getY(i),sm.getZ(i));
    if(Math.abs(L-1)>1e-3){ nonUnit++; if(triArea(Math.floor(i/3))>=1e-12) nonUnitOffDegen++; } }
  ok(nonUnitOffDegen===0,'every normal on a triangle that HAS area is unit length ('+
     nonUnitOffDegen+' that are not)');
  ok(nonUnit===degenVerts,'and the only non-unit normals are the '+degenVerts+' on '+degenTris+
     ' zero-area triangle(s), which rasterize to nothing ('+nonUnit+' non-unit)');
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

C.section('THE STAR LEDGER — three stars a page, and no cleared page is ever lost');
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
    ok(blob.v===3,'the schema announces itself as v3, one slot per map (TODO 37) ('+blob.v+')');
    ok(!!blob.stars&&blob.stars[P1A]&&blob.stars[P1A].cleared===true,'the star is on the wire');
    ok(!!blob.pages&&blob.pages[P1A]&&blob.pages[P1A].earned>0,
       'so is the page chaos snapshot ('+JSON.stringify(blob.pages[P1A])+')');
    /* THE v1 SHAPE IS STILL AT THE TOP OF THE BLOB, and after TODO 37 it is a MIRROR of whichever
       map you are standing in rather than the only copy. The promise this assertion protects is the
       reason the mirror is written at all: there are older copies of this file, and one of them
       opening this save has to find the carpark exactly where it looks for it. */
    ok(Array.isArray(blob.done)&&blob.done.length>=rows.length&&'peak' in blob&&'hats' in blob,
       'and every v1 field is still there, so an older build reading this blob still works');
    { const sl=blob.biomes&&blob.biomes.carpark;
      ok(!!sl,'the same progress is also in the carpark slot, which is what this build reads');
      ok(!!sl&&JSON.stringify(sl.stars)===JSON.stringify(blob.stars)&&
         JSON.stringify(sl.done)===JSON.stringify(blob.done),
         'and the mirror at the top is exactly that slot, not a second version of the truth'); }

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

/* THE BAND IS THE ENVELOPE, READ OFF THE ENGINE (TODO 63, law 10 again). These were -53 and -17,
   hand-picked to be generous around SNOWFIELD when the section was written, and generous was wrong
   in a way nothing noticed until the rail pass put a slender upright at z -17: the clothesline sits
   INSIDE this window and OUTSIDE the actual envelope, so a disc centred on it starts off-map, slides
   3.2 to get on-map, and read as a trunk that failed to hold its ground. */
const SNOWZ0=X.SNOWFIELD.z0, SNOWZ1=X.SNOWFIELD.z1;
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
  /* TODO 63 CHANGED WHAT THIS SET CONTAINS, and the assertion had to get more precise rather than
     more forgiving. It read: a disc centred on any slender upright in the band stays put. That was
     true of the only slender uprights the band had - tree trunks, standing in the open - and it
     quietly assumed no other kind could exist. The rail pass added three, and two of them stand
     within arm reach of a BUILDING: the ski rack rail is 1.9 metres off the tow shed. A disc centred
     there slides, and it should, because the shed is broad and the shed is why. So the claim is split
     into the two things it was conflating - the slender thing never blocks, and a broad neighbour
     always does. */
  { const trunks=G.colliders.filter(c=>c.kind==='box'&&c.top>0.2&&Math.min(c.w,c.d)<X.SNOWBULK
                                       &&c.z>=SNOWZ0&&c.z<=SNOWZ1);
    ok(trunks.length>=3,'the snow band has slender uprights in it ('+trunks.length+')');
    const broadNear=(c,r)=>G.colliders.some(o=>o!==c&&o.kind==='box'&&o.top>0.2&&
      Math.min(o.w,o.d)>=X.SNOWBULK&&
      Math.hypot(Math.max(0,Math.abs(c.x-o.x)-o.w),Math.max(0,Math.abs(c.z-o.z)-o.d))<r);
    const open=trunks.filter(c=>!broadNear(c,2.0)), crowded=trunks.filter(c=>broadNear(c,2.0));
    ok(open.length>=3,'and at least three of them stand in the open ('+open.length+' of '+trunks.length+')');
    let held=0; for(const c of open){ const q=X.snowSpot(c.x,c.z,2.0); if(q.slid===0)held++; }
    ok(held===open.length,'a disc centred on a slender upright in the open stays exactly put ('+
       held+'/'+open.length+')');
    let why=0; for(const c of crowded){ const b=X.snowBlocked(c.x,c.z,2.0);
      if(b&&Math.min(b.w,b.d)>=X.SNOWBULK)why++; }
    ok(why===crowded.length,'and the ones beside a building slide because of the BUILDING ('+
       why+'/'+crowded.length+')'); }

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

C.section('THE CO-OP CELL - the clock stops, the key squawks, and the latch is the door');
// TODO 15. Solo, the cage is a timer you mash out of. In co-op the clock STOPS: the grab key buys
// no seconds, it SQUAWKS a locator onto the partner plate, and the latch peck is the only door.
// BOTH HALVES ARE DRIVEN, because "solo behaviour unchanged" is the half that can regress in
// silence - the solo section here is not scenery, it is the control the freeze is measured against.
{
  const J=X.JAIL, P2=H.P2;   // player two: this section is the only one that drives the second bird
  // ---- SOLO: the control ----
  X.startGame(1); tick(8); park();
  const solo=G.keas[0];
  ok(G.keas.length===1&&J.coop()===false,'one bird on the board, so this is the solo cell');
  solo.caged=8; solo._cagePrev=false; solo.stun=0; G.squawk=null; tick(1);
  const t0=solo.caged; tick(30);
  ok(solo.caged<t0-0.4,'solo: the sentence runs itself down without anybody doing anything ('+
     t0.toFixed(2)+' -> '+solo.caged.toFixed(2)+')');
  // one tap is one edge. Measure a plain frame and a tapped frame and take the difference, so the
  // assertion is about the MASH and not about the frame it costs.
  const p0=solo.caged; tick(1); const plain=p0-solo.caged;
  const m0=solo.caged; tap(P1.grab); const mashed=m0-solo.caged; tick(1);
  ok(Math.abs(mashed-plain-0.5)<1e-9,'solo: a mash is worth half a second off the sentence ('+
     mashed.toFixed(4)+' against '+plain.toFixed(4)+' for an idle frame)');
  ok(G.squawk===null,'solo: nothing squawked - with nobody to hear it the mash IS the mechanic');
  /* A BIRD IN A CRATE IS NOT ENTERTAINING ITSELF. The caged branch returns before the idle code, so
     an act rolled the frame before the door shut used to sit there mid-preen. Solo it healed itself
     when the sentence ran out; co-op it would have been permanent, which is how harness-systems
     found it. Asserted in BOTH modes because it was never right in either. */
  solo.caged=6; solo.idleAct={kind:'preen',t:0,dur:9,side:1}; solo.idleT=99; tick(1);
  ok(!solo.idleAct&&solo.idleT===0,'solo: the crate stops the idle act and the idle clock with it');
  solo.caged=0; tick(2);
  solo.caged=0.4; tick(1); tap(P1.grab); tick(2);
  ok((solo.caged||0)===0&&solo.grounded===false,'solo: mashing still opens the door, and it still throws you out of it');

  // ---- CO-OP: the piece ----
  X.startGame(2); tick(8); park();
  const a=G.keas[0], b=G.keas[1];
  const rex=G.humans.find(h=>h.key==='rex');
  ok(G.keas.length===2&&J.coop()===true,'two birds on the board, so this is the co-op cell');
  a.caged=0; b.caged=0; a.stun=0; b.stun=0; G.squawk=null;
  if(a.held){a.held.heldBy=null;a.held=null;} if(b.held){b.held.heldBy=null;b.held=null;}
  a.x=0; a.z=31.5; b.x=4; b.z=31.5; G.wanted=3; G.wantedT=3.4;
  // through the real chase collision, the same way the one-cell section does it, so the cage popup
  // and the ping reset in cageKea are on the path too rather than staged around.
  const siege=k=>{ rex.stun=0; rex.launched=null; rex.asleep=false; rex.distracted=0;
    rex.state='chase'; rex.chaseKea=k; rex.giveUpT=0; rex.t=0;
    for(let i=0;i<40;i++){ k.y=0.25; k.vy=0; k.grounded=true; rex.x=k.x; rex.z=k.z-0.3;
      X.update(1/60); if((k.caged||0)>0||rex.state==='shoo')break; }
    return (k.caged||0)>0; };
  ok(siege(a),'rex puts the first bird in the cell through the real chase collision');
  const sentence=a.caged;

  // THE ASSERTION THE PIECE EXISTS FOR, and it is deliberately longer than the whole solo sentence.
  tick(600);
  ok(a.caged===sentence,'co-op: ten seconds pass and the sentence has not moved one frame ('+
     sentence.toFixed(2)+'s, still '+a.caged.toFixed(2)+'s)');
  ok((a.caged||0)>0&&X.jailedKea()===a,'which is longer than the eight-second solo sentence, and the bird is still in there');

  a.idleAct={kind:'preen',t:0,dur:9,side:1}; a.idleT=99; tick(1);
  ok(!a.idleAct&&a.idleT===0,'co-op: same in the cell that never opens by itself, where it would otherwise be forever');

  // the key that used to buy seconds now calls for help
  a._cagePrev=false; tick(1); G.squawk=null;
  const c0=a.caged; tap(P1.grab); tick(1);
  ok(a.caged===c0,'co-op: mashing buys not one second ('+c0.toFixed(3)+' -> '+a.caged.toFixed(3)+')');
  const PING=()=>G.squawk||{};   // a missing ping must FAIL an assertion, never throw past the rest
  const nm=v=>v===undefined||v===null?'none':(+v).toFixed(2);   // the MESSAGE must survive it too
  ok(!!G.squawk&&PING().idx===a.idx,'it squawks instead, and the ping names who is inside (kea '+
     (G.squawk?PING().idx:'none')+')');
  ok(PING().n===1,'one press, one ping ('+PING().n+')');

  // ---- the ping is a LOCATOR, and it speaks in directions the partner can act on ----
  b.x=a.x; b.z=a.z-10; b.ry=0; b.stun=0; tick(1);
  const S=PING();
  ok(S.to===b.idx,'the ping lands on the partner and not on the prisoner (kea '+S.to+')');
  ok(S.dist!==undefined&&Math.abs(S.dist-10)<0.6,'and it carries how far away the cell is ('+nm(S.dist)+'m of a staged 10)');
  ok(S.say==='AHEAD','standing off the cell and facing it, the cell reads AHEAD ('+S.say+')');
  ok(G.hudLines[b.idx]>0,'the line reaches the partner plate rather than living only in the state ('+
     G.hudLines[b.idx]+' wrapped lines)');
  ok(!!S.text&&S.text.indexOf('PECK THE LATCH')>=0,'and it says what to do about it');
  ok(!!S.text&&X.PROMPTS[b.idx]===S.text,'the partner plate carries the line verbatim, not a second copy of it');
  /* THE ASSERTION FOUND A REAL GAP, and it is written here rather than quietly dropped. Nothing
     writes a prompt for a caged bird - the caged branch returns before interact() and hintScan() -
     so the plate keeps whatever was on it when the door shut, which near the ute is the cage hint:
     "a mate pecks the latch, or mash your way out". In solo that stale line is true. In co-op it is
     a lie told to the one bird that cannot act on it, so the co-op cell writes its own plate. */
  ok(String(X.PROMPTS[a.idx]).indexOf('SQUAWK')>=0,'and the prisoner plate says what the key does now instead of a stale line ('+
     String(X.PROMPTS[a.idx]).replace(/<[^>]*>/g,'')+')');
  ok(String(X.PROMPTS[a.idx]).indexOf('mash')<0,'with no mash instruction left on it, because mashing no longer does that');

  /* THE BEARING IS DERIVED FROM THE STEERING CONVENTION, NEVER RESTATED (FLAKES law 10). The file
     has no compass. What it has is a left key that ADDS to ry, so the test reads that first and
     then requires the ping to agree with it: turn the way the left key turns you and a thing that
     was AHEAD has to become RIGHT. Re-map the controls and this assertion follows them. */
  const ry0=b.ry; hold(P2.left); tick(6); un(P2.left); tick(1);
  ok(b.ry>ry0,'the left key adds to ry ('+ry0.toFixed(3)+' -> '+b.ry.toFixed(3)+')');
  b.ry=ry0+Math.PI/2; tick(1);
  ok(PING().say==='RIGHT','turn a quarter turn the way the left key turns you and the cell is RIGHT ('+PING().say+')');
  b.ry=ry0-Math.PI/2; tick(1);
  ok(PING().say==='LEFT','the other way and it is LEFT ('+PING().say+')');
  b.ry=ry0+Math.PI; tick(1);
  ok(PING().say==='BEHIND','turn your back on it and it is BEHIND ('+PING().say+')');
  b.ry=ry0; tick(1);

  // ---- the cooldown is an ear, not a mute ----
  const n1=PING().n;
  a._cagePrev=false; tick(1); tap(P1.grab); tick(1);
  ok(PING().n===n1,'a second press inside the cooldown does not re-ping ('+PING().n+')');
  tick(40); a._cagePrev=false; tick(1); tap(P1.grab); tick(1);
  ok(PING().n===n1+1,'and it pings again once the cooldown is out ('+PING().n+')');
  ok((a.caged||0)>0,'through every one of those presses the bird never got a second off ('+a.caged.toFixed(2)+'s)');

  // ---- the latch IS the door ----
  const lt=G.inter.find(it=>it.kind==='peck'&&it.label==='PECK THE LATCH');
  ok(!!lt&&lt.locked()===false,'the latch is unlocked while the cell is occupied');
  const q=lt.getPos();
  const perch2=(x,z,y)=>{ const p=Math.max(0.25,y||0.25,X.groundHeightAt(x,z,3)+0.02);
    for(let i=0;i<3;i++){ b.x=x; b.z=z; b.y=p; b.vy=0; b.grounded=true; X.update(1/60); } return p; };
  const yy=perch2(q.x,q.z,Math.max(0.25,q.y-0.3));
  const sc0=G.score;
  for(let n=0;n<(lt.needHits||1)+1;n++){
    for(let i=0;i<2;i++){ b.x=q.x; b.z=q.z; b.y=yy; b.vy=0; b.grounded=true; X.update(1/60); }
    tap(P2.grab); tick(2); }
  ok((a.caged||0)===0,'the latch is the door: the partner pecks it open and the prisoner is out');
  ok(!X.jailFull()&&X.jailedKea()===null,'the cell reads empty again');
  ok(G.score>sc0,'and the jailbreak paid ('+(G.score-sc0)+' chaos)');
  ok(G.squawk===null,'the ping went with the door - a locator pointing at an empty cage is worse than none');

  // ---- FLAKES law 1: the world persists across startGame, so a live ping would ride into the next run
  { a.caged=8; a._cagePrev=false; G.squawk=null; tick(1); tap(P1.grab); tick(1);
    ok(!!G.squawk,'a ping is live when the restart comes');
    X.startGame(2); tick(4);
    ok(G.squawk===null,'startGame cleared it, and nothing is left pointing at the old cell'); }
}

C.section('SCORE ATTRIBUTION - every point lands on exactly one book, and they add up');
// TODO 16. The brief asked for the acting kea to be THREADED through award(). It is derived
// instead: the loop over G.keas names the bird whose frame it is, award() reads that, and the three
// awards that fire outside the loop pass the bird by hand. The invariant below is what makes the
// split worth anything - score is the sum of the books at every instant, so no VS scoreboard built
// on them can disagree with the number on the HUD.
{
  const L=X.LEDGER, P2=H.P2;
  const books=()=>[L.of(0),L.of(1),G.ledgerLoose||0];
  ok(G.score===L.total(),'the books already add up to the score on arrival ('+G.score+' vs '+L.total()+')');

  X.startGame(2); tick(8); park();
  const a=G.keas[0], b=G.keas[1];
  ok(G.score===L.total(),'and a restart does not break that, because the ledgers outlive it exactly as the score does ('+
     G.score+' vs '+L.total()+')');

  // ---- TWO BIRDS, TWO BOOKS, THROUGH REAL INTERACTABLES ----
  // FLAKES law 3: isolate. Both birds are on the board, so the one not acting is parked far away
  // where it cannot reach the target and take the award off the bird under test.
  /* THE TARGETS ARE NAMED, NOT TAKEN OFF THE TOP OF THE LIST. The first pass took whatever came
     first and drew FLIP THE ROADWORKS PADDLE, whose award sits behind a one-shot G.paddleDone that
     an earlier section had already spent - so the bird pecked a real target, completed it, and
     earned nothing. These two pay unconditionally every time they are opened, and they are at
     opposite ends of the carpark. Label fragments are the house idiom here; peckL uses the same. */
  const pk=f=>G.inter.find(it=>it.kind==='peck'&&!it.done&&it.label&&it.label.indexOf(f)>=0&&
                               !(it.locked&&it.locked())&&it.getPos);
  const pecks=[pk('HANDBAG'),pk('BACKPACK')];
  ok(!!pecks[0]&&!!pecks[1],'both named peck targets are still open ('+
     pecks.map(p=>p?p.label:'MISSING').join(', ')+')');
  const peckWith=(k,map,it)=>{ const q=it.getPos();
    const yy=Math.max(0.25,q.y-0.3,X.groundHeightAt(q.x,q.z,3)+0.02);
    for(let n=0;n<(it.needHits||1)+1;n++){
      for(let i=0;i<2;i++){ k.x=q.x; k.z=q.z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); }
      tap(map.grab); tick(2); } };
  const far=k=>{ k.x=46; k.z=46; k.y=0.25; k.vy=0; k.grounded=true; };

  far(b); const s0=G.score, k0=books();
  peckWith(a,P1,pecks[0]);
  const dS=G.score-s0, d0=L.of(0)-k0[0], d1=L.of(1)-k0[1], dL=(G.ledgerLoose||0)-k0[2];
  ok(dS>0,'bird one earned something real off a peck target ('+dS+' chaos)');
  ok(d0===dS,'and every point of it went on bird one book ('+d0+' of '+dS+')');
  ok(d1===0&&dL===0,'with nothing on the partner book and nothing loose ('+d1+', '+dL+')');

  far(a); const s1=G.score, k1=books();
  peckWith(b,P2,pecks[1]);
  const eS=G.score-s1, e0=L.of(0)-k1[0], e1=L.of(1)-k1[1];
  ok(eS>0,'bird two earns off its own target ('+eS+' chaos)');
  ok(e1===eS&&e0===0,'and it lands on bird two book, not on the one that went first ('+e1+' vs '+e0+')');
  ok(L.of(0)>0&&L.of(1)>0&&L.of(0)!==L.of(1),'the two books are separately populated and not the same number ('+
     L.of(0)+' / '+L.of(1)+')');
  ok(G.score===L.total(),'and the shared total is still exactly the sum of them ('+G.score+' vs '+L.total()+')');

  // ---- WHAT THE STACK CANNOT SEE GOES LOOSE, NOT ONTO A BIRD ----
  // an award raised from outside any kea frame - which is what the traffic jam does - is counted
  // but not credited. The alternative is worse: crediting whichever bird updated last.
  { const k2=books(), s2=G.score;
    ok(G.actor===null,'no bird owns the frame between updates');
    X.award(30,'STAGED: NOBODY DID THIS',{x:0,y:1,z:0});
    ok(G.score-s2>0,'the points still reach the shared score ('+(G.score-s2)+')');
    ok(L.of(0)===k2[0]&&L.of(1)===k2[1],'but neither book moved');
    ok((G.ledgerLoose||0)-k2[2]===G.score-s2,'they went loose, all of them ('+((G.ledgerLoose||0)-k2[2])+')');
    ok(G.score===L.total(),'and loose still counts toward the sum, so the invariant holds'); }

  // ---- AN EXPLICIT ACTOR BEATS THE STACK, which is what the three hand-passed sites rely on ----
  { const k3=books();
    G.actor=a; X.award(10,'STAGED: CREDITED ELSEWHERE',{x:0,y:1,z:0},b); G.actor=null;
    ok(L.of(1)-k3[1]>0&&L.of(0)-k3[0]===0,'the bird named at the call site is credited, not the bird holding the frame');
    ok(L.actorOf(0)===0,'an index names a bird, and index zero is a bird rather than a falsy nothing');
    ok(L.actorOf(undefined)===-1&&L.actorOf(null)===-1,'and nothing named with no frame open is nobody, which is what loose means'); }

  // ---- A RESTART DOES NOT REWRITE HISTORY ----
  { const t0=L.total(), sc=G.score;
    X.startGame(2); tick(4);
    ok(L.total()===t0&&G.score===sc,'startGame leaves both the score and the books where they were ('+
       L.total()+' vs '+t0+')');
    ok(G.score===L.total(),'so they still add up after it'); }
}

C.section('ONE BUILD, ONE WORLD - the second boot replaces the country, it does not add another');
// TODO 48. boot() calls initScene, which throws the old scene away and makes a new one - so a second
// boot used to leave the registries describing meshes that are in no scene, on top of the ones that
// are. This battery is where it lived: the snow section boots again for a fresh resolver sweep, and
// from that line on every section ran against two of every prop, interactable and collider.
//
// THE PROOF THE BRIEF ASKED FOR CANNOT BE WRITTEN AS THE BRIEF WROTE IT. "G.props.length after the
// last section equals the count after the first boot" is false on a healthy build and always was:
// play SPAWNS props. The GoPro out of the backpack, the aerial, the mirror, the spikes, the nail,
// the ranger cap - twenty-three of them by the time the sections above are done, all legitimate.
// So the claim is split into the three things that were actually wrong, each asserted directly.
{
  const now=r=>(G[r]||[]).length;
  const root=m=>{ let n=m; while(n&&n.parent)n=n.parent; return n; };
  /* A COUNT WAS THE WRONG ASSERTION HERE and piece 21 proved it by adding a seventh registry: the
     magic number failed on a correct change and said nothing about what was missing. The claim that
     matters is that every registry a build fills is IN the list, so name them. */
  for(const r of ['props','inter','colliders','cars','sheep','strips','foodSrc'])
    ok(X.WORLDREGS.indexOf(r)>=0,'the build clears G.'+r+' ('+X.WORLDREGS.join(', ')+')');

  // 1. NOTHING IN THE REGISTRIES BELONGS TO A SCENE THAT NO LONGER EXISTS. This is the bug itself:
  //    the first world survived in the lists while its meshes hung off the discarded scene.
  const orphans=G.props.filter(p=>p.mesh&&root(p.mesh)!==G.scene);
  ok(orphans.length===0,'no prop in G.props hangs off a discarded scene ('+orphans.length+' orphans of '+
     G.props.length+')');
  const oc=G.colliders.filter(c=>c.mesh&&root(c.mesh)!==G.scene);
  ok(oc.length===0,'and no collider does either ('+oc.length+' of '+G.colliders.length+')');

  // 2. THE SINGLETONS ARE SINGULAR, which is what a doubled registry breaks first: a find() that
  //    expects the only one of something gets whichever copy sorts first.
  const latches=G.inter.filter(it=>it.label==='PECK THE LATCH').length;
  ok(latches===1,'exactly ONE latch to peck, not one per boot ('+latches+')');
  const keys=G.props.filter(p=>p.name==='ute keys').length;
  ok(keys===1,'exactly one set of ute keys, so a mission prop cannot be shadowed by its own copy ('+keys+')');
  ok(G.sheep.length===3,'three sheep in the paddock, not six ('+G.sheep.length+')');
  ok(G.cars.length===6,'six cars on the road, not twelve ('+G.cars.length+')');

  // 3. AND A BUILD COSTS THE SAME EVERY TIME. Booting again here is the direct statement of the fix,
  //    against the counts taken at the very first boot of this file.
  X.boot();
  for(const r of X.WORLDREGS)
    ok(now(r)===BOOTCOUNTS[r],'a fresh boot leaves G.'+r+' exactly one world ('+now(r)+
       ' against '+BOOTCOUNTS[r]+' at the first boot)');
  X.startGame(1); tick(6);
}

C.section('THE PROP HEADING IS A DRAW NOBODY READS, AND IT IS NOW NAMED THAT');
// TODO 47, option (b). propAt has always drawn a random heading per prop and nothing has ever
// applied it to a prop mesh - ry is the kea and human convention (this.ry drives g.rotation.y) and
// it is not the prop one. Piece 17 had to record the MESH transform to get an honest spawn rotation
// and filed this. The draw STAYS: every later rnd() in the browser is downstream of it and removing
// one draw repins the entire world, which is the snow-patch lesson from session 5. The name is the
// fix, and these assertions are what stop it quietly becoming live again.
{
  X.boot();   // a clean world: props spawned during play are built by the same factory but land later
  const built=G.props.slice();
  ok(built.length>0,'props on the board to look at ('+built.length+')');
  ok(built.every(p=>typeof p._ryUnused==='number'),'every prop still carries the draw, under its honest name');
  ok(built.every(p=>p.ry===undefined),'and none of them carries a field called ry any more');
  ok(built.every(p=>p._ryUnused>=0&&p._ryUnused<6),'the draw is still rnd(0,6) ('+
     built.map(p=>p._ryUnused).reduce((a,b)=>Math.min(a,b),9).toFixed(2)+' to '+
     built.map(p=>p._ryUnused).reduce((a,b)=>Math.max(a,b),-9).toFixed(2)+')');
  ok(new Set(built.map(p=>p._ryUnused)).size===built.length,
     'one draw each, all different, so the stream really is being spent ('+
     new Set(built.map(p=>p._ryUnused)).size+' distinct of '+built.length+')');

  /* THE CLAIM THAT MATTERS: nothing reads it. Stated as the thing you could see if something did -
     a prop whose mesh had been turned by its own draw. Every prop is built axis-aligned about Y; the
     two that a build site rotates are laid over about X (the skis, rotation.x=1.35). */
  const turned=built.filter(p=>p.mesh&&Math.abs(p.mesh.rotation.y)>1e-9);
  ok(turned.length===0,'not one prop mesh has been turned about Y ('+turned.length+' of '+built.length+
     (turned.length?': '+turned.slice(0,3).map(p=>p.name).join(', '):'')+')');
  const agree=built.filter(p=>p.mesh&&Math.abs(p.mesh.rotation.y-p._ryUnused)<1e-9);
  ok(agree.length===0,'and not one mesh heading agrees with its own draw, which is what applying it would look like');
  const skis=built.filter(p=>p.name==='ski');
  ok(skis.length===2,'the two skis on the rack are the build site that DOES rotate a prop ('+skis.length+')');
  ok(skis.every(p=>Math.abs(p.mesh.rotation.x-1.35)<1e-9),'and it lays them over about X ('+
     skis.map(p=>p.mesh.rotation.x.toFixed(2)).join(', ')+')');
  ok(skis.every(p=>p.mesh.rotation.y===0),'about X and never about Y, which is the axis the dead draw would have used');
  X.startGame(1); tick(6);
}

C.section('THE CAGE HINT NO LONGER LIES IN CO-OP - and after TODO 55 somebody can actually read it');
// TODO 52. Piece 15 took the mash away in co-op, which made the one line this hint carries false in
// one of the two modes: "a mate pecks the latch, or mash your way out". addHint refuses to replace a
// mid it already has and nothing clears G.hints between runs, so a line baked in at build time is
// the line the process keeps - a solo run followed by a co-op restart would hand over the solo copy.
// So hint text is now RESOLVED WHEN READ. Strings still work; a function is evaluated at the moment
// somebody looks at it, which is the only moment the mode is known.
{
  const HI=X.HINTS;
  const cage=()=>(G.hints||[]).find(h=>h.mid==='cage');
  /* READ THROUGH AN ACCESSOR. The guard rule, and by the end of this session it had cost four
     sabotages: cage() is undefined the moment anything stops the hint being added, and cage().text
     is then a throw that takes every finding in this section with it. The sabotage that removed the
     hint from the ute came back with ZERO findings until this existed. */
  const cageF=k=>(cage()||{})[k];

  X.startGame(1); tick(6);
  ok(!!cage(),'the cage hint is on the board');
  ok(typeof cageF('text')==='function','and it carries a function, not a baked line ('+typeof cageF('text')+')');
  const solo=HI.text(cage());
  ok(solo.indexOf('mash your way out')>=0,'solo: it still tells you to mash, because solo still lets you ('+solo+')');

  // THE ASSERTION THE BRIEF ASKED FOR: restart into the other mode and read it again. Under the old
  // baked string this is the one that could not pass - addHint had already refused to replace it.
  X.startGame(2); tick(6);
  const coop=HI.text(cage());
  ok(coop.indexOf('mash')<0,'co-op: the mash instruction is gone, because mashing squawks and buys nothing ('+coop+')');
  ok(coop.indexOf('latch')>=0,'and it names the thing that does work');
  ok(coop!==solo,'the two modes read differently from the same hint object');

  // and back again, because the bug was specifically that the FIRST mode won forever
  X.startGame(1); tick(6);
  ok(HI.text(cage())===solo,'and it goes back when the mode does, which a baked string could never do');

  // a plain string hint is untouched by any of this
  { const str=(G.hints||[]).find(h=>typeof h.text==='string');
    ok(!!str&&HI.text(str)===str.text,'a string hint still resolves to itself ('+(str?str.mid:'none')+')'); }

  /* AND THE FINDING THIS PIECE TRIPPED OVER, which was bigger than the lie it was sent to fix:
     NOBODY HAD EVER BEEN ABLE TO READ THIS HINT. hintScan drops any hint whose mid is not an open
     mission, and there is no mission with the id 'cage'. Every other hint mid has one. So the line
     was unreachable for its whole life, in both modes, and the lie was invisible while it lasted.
     THE TRIPWIRE THAT SAID SO HAS NOW FIRED, WHICH IS WHAT IT WAS FOR. TODO 55 answered its
     question - option b, the mission gate gets an explicit opt-out - so the assertion is re-aimed
     at the new invariant rather than deleted. It is strictly more than it was: the cage hint is
     still the only missionless one, it is missionless ON PURPOSE, the opt-out has not spread, and
     the typo safety the gate was really there for is proved to still work. */
  const mids=(G.hints||[]).map(h=>h.mid);
  const orphan=mids.filter(m=>!G.missions.find(x=>x.id===m));
  ok(orphan.length===1&&orphan[0]==='cage',
     'exactly one hint has no mission behind it and it is still the cage one ('+JSON.stringify(orphan)+')');
  ok(cageF('free')===true,'and it is missionless ON PURPOSE - free is declared at the call site ('+cageF('free')+')');
  ok((G.hints||[]).filter(h=>h.free).length===1,
     'exactly one hint in the game is free, so the opt-out did not spread ('+
     (G.hints||[]).filter(h=>h.free).map(h=>h.mid).join(',')+')');

  /* THE SAFETY THE MISSION GATE WAS REALLY THERE FOR IS A TYPO IN A MID, and trading that away to
     make one hint live would be a bad deal. So drive it: a hint with a mid no mission has, which
     does NOT declare itself free, must still be invisible. Driven at a clean patch of ground with
     no other hint and no interactable in reach, and spliced back out afterwards, because nothing
     clears G.hints between runs (FLAKES law 1) and the counts above are asserted again on the next
     pass through this file. */
  { X.startGame(1); tick(6); park();
    const k=G.keas[0]; if(k.held){k.held.heldBy=null;k.held=null;}
    const TX=30, TZ=-30;
    X.HINTS.add('nosuchmission',TX,0.5,TZ,6,'THIS LINE MUST NEVER REACH A PLATE');
    const bogus=(G.hints||[]).find(h=>h.mid==='nosuchmission');
    ok(!!bogus&&!bogus.free,'a hint with a mid no mission has, and no free flag, is on the board');
    X.setPrompt(k.idx,'');
    const ty=Math.max(0.25,X.groundHeightAt(TX,TZ,3)+0.02);
    for(let i=0;i<4;i++){ k.x=TX; k.z=TZ; k.y=ty; k.vy=0; k.grounded=true; X.update(1/60); }
    ok((G.hintNow||[])[k.idx]!==('nosuchmission'),
       'and standing in it displays NOTHING, so the typo safety survived the opt-out ('+
       ((G.hintNow||[])[k.idx]||'nothing')+')');
    ok(String(X.PROMPTS[k.idx]).indexOf('MUST NEVER REACH A PLATE')<0,
       'the plate never carried its line ('+String(X.PROMPTS[k.idx]).replace(/<[^>]*>/g,'').slice(0,40)+')');
    const bi=(G.hints||[]).indexOf(bogus); if(bi>=0)G.hints.splice(bi,1);
    ok(!(G.hints||[]).some(h=>h.mid==='nosuchmission'),'and the bogus hint is off the board again');
    ok((G.hints||[]).map(h=>h.mid).filter(m=>!G.missions.find(x=>x.id===m)).length===1,
       'so the missionless count is back to one'); }

  /* THE PROOF TODO 55 ASKS FOR: stand a bird in the radius in BOTH modes and read the plate. The
     spot is the hint centre plus three on x - the centre itself is inside grab range of the ute
     keys, and a verb prompt beats a hint by design, which is the assertion after these two. */
  { const CX=()=>cageF('x')+3, CZ=()=>cageF('z');   // accessor: see the note at cageF
    /* LAW 3, AND IT TOOK A SEED SHIFT TO EXPOSE THE GAP. This spot was chosen as "hint radius, but
       clear of the ute keys", which was true of exactly one arrangement of the world. The comment
       three lines up says a verb prompt beats a hint BY DESIGN — so any grabbable that happens to
       land within range turns these four assertions red, and the placement moves whenever the
       seeded stream does (FLAKES law 15: a section added or removed anywhere earlier is enough).
       That is what happened at REPLAT P4: the ski goggles drifted into range and the plate came
       back "E DOFF THE SKI GOGGLES" instead of the cage line.
       So the spot is CLEARED rather than assumed clear, which is what law 3 has said all along —
       isolate the subject before the assert instead of hoping the neighbours stay away. */
    /* THE BIRD MUST BE CARRYING AND WEARING NOTHING. `k.held` was already cleared at each call
       site; `k.hatProp` was not, and a WORN item offers a DOFF verb which — as the comment above
       says — beats a hint by design. Nothing pinned the hat, so it depended on what the seeded
       stream happened to leave the bird in, and a section removed anywhere earlier is enough to
       change that (FLAKES law 15). At REPLAT P4 the bird turned up in ski goggles and four
       assertions came back reading "E DOFF THE SKI GOGGLES".
       Cleared HERE, in the one helper every one of those assertions goes through, rather than at
       each call site — which is how `k.held` came to be cleared in three places and the hat in
       none. */
    const bare=(k)=>{ if(k.held){k.held.heldBy=null;k.held=null;}
      if(k.hatProp){ k.hatProp.heldBy=null; k.hatProp=null; } };
    const standAt=(k,x,z)=>{ X.setPrompt(k.idx,''); bare(k);
      const y=Math.max(0.25,X.groundHeightAt(x,z,3)+0.02);
      for(let i=0;i<4;i++){ k.x=x; k.z=z; k.y=y; k.vy=0; k.grounded=true; X.update(1/60); }
      return String(X.PROMPTS[k.idx]); };

    X.startGame(1); tick(6); park();
    { const k=G.keas[0]; if(k.held){k.held.heldBy=null;k.held=null;}
      const plate=standAt(k,CX(),CZ());
      ok((G.hintNow||[])[k.idx]==='cage','solo: the bird in the cage radius is reading the cage hint ('+
         ((G.hintNow||[])[k.idx]||'nothing')+')');
      ok(plate.indexOf(HI.text(cage()))>=0,'and the plate carries the resolved solo line');
      ok(plate.indexOf('mash your way out')>=0,'which is the one that mentions mashing ('+
         plate.replace(/<[^>]*>/g,'').slice(0,72)+')'); }

    X.startGame(2); tick(6); park();
    { const k=G.keas[0]; if(k.held){k.held.heldBy=null;k.held=null;}
      const plate=standAt(k,CX(),CZ());
      ok((G.hintNow||[])[k.idx]==='cage','co-op: the same spot reads the same hint');
      ok(plate.indexOf(HI.text(cage()))>=0,'and the plate carries the resolved CO-OP line');
      ok(plate.indexOf('mash')<0,'with no mashing in it, because co-op does not let you ('+
         plate.replace(/<[^>]*>/g,'').slice(0,72)+')');
      ok(plate.indexOf('latch')>=0,'and it names the thing that does work'); }

    /* A VERB BEATS A HINT, and that is what keeps this from being noise on the plate: hintScan only
       writes when the plate is empty. At the hint centre the ute keys are in reach, so the grab
       prompt is what a player sees there - the hint is still the one in range, and still silent. */
    X.startGame(1); tick(6); park();
    { const k=G.keas[0]; if(k.held){k.held.heldBy=null;k.held=null;}
      const plate=standAt(k,cageF('x'),cageF('z'));
      ok((G.hintNow||[])[k.idx]==='cage','at the centre the cage hint is the one in range');
      ok(plate.indexOf('GRAB')>=0&&plate.indexOf('night ranger')<0,
         'but a verb in reach owns the plate and the hint stays quiet ('+
         plate.replace(/<[^>]*>/g,'').slice(0,40)+')'); } }

  // THE RESOLVER IS ON THE DISPLAY PATH, proved through a hint that CAN fire rather than by trusting
  // the export. Pick an open-mission hint, stand the bird in it with an empty plate, and read the HUD.
  { X.startGame(1); tick(6); park();
    /* AND NOTHING WORN, for the reason spelled out at the cage plate above: a WORN item offers a
       DOFF verb and a verb in reach beats a hint by design, so a bird that the seeded stream
       happened to leave in ski goggles reads "E DOFF THE SKI GOGGLES" on every plate in this
       block. `k.held` was cleared here and `k.hatProp` was not. */
    const k=G.keas[0];
    if(k.held){k.held.heldBy=null;k.held=null;}
    if(k.hatProp){k.hatProp.heldBy=null;k.hatProp=null;}
    const live=(G.hints||[]).find(h=>{ const m=G.missions.find(x=>x.id===h.mid);
      return m&&!m.done&&!(typeof m.locked==='function'?m.locked():m.locked); });
    ok(!!live,'a hint with an open mission behind it to test the display path with ('+(live?live.mid:'none')+')');
    X.setPrompt(k.idx,'');
    for(let i=0;i<4;i++){ k.x=live.x; k.z=live.z; k.y=Math.max(0.25,live.y); k.vy=0; k.grounded=true; X.update(1/60); }
    /* hintScan returns the FIRST hint in list order whose radius the bird is in, and hint radii
       overlap - standing in one can put you in an earlier one. So the assertion reads back WHICH
       hint fired and holds the plate to that one, rather than insisting on the one that was aimed
       at: the claim is that the display path resolves, not that a particular hint won. */
    const fired=(G.hints||[]).find(h=>h.mid===(G.hintNow||[])[k.idx]);
    ok(!!fired,'the bird is standing in a hint ('+((G.hintNow||[])[k.idx]||'nothing')+')');
    ok(!!fired&&String(X.PROMPTS[k.idx]).indexOf(HI.text(fired))>=0,
       'and the plate carries exactly what the resolver returns for it');
    /* AND THE SAME THING WITH A FUNCTION, END TO END. Every hint that can currently display carries a
       string, so the assertion above passes whether the display path resolves or reads h.text raw -
       it would not catch the resolver being taken back out. So this one hands a live hint a FUNCTION
       and requires the plate to show what it returns. Restored afterwards. */
    if(fired){ const keep=fired.text;
      /* THE RETURN VALUE IS COMPUTED, NOT A LITERAL, and that is not decoration. Concatenating a
         function gives you its SOURCE - so a display path that had stopped resolving would still
         put the words of a literal onto the plate and this assertion would pass while broken. It
         did, on the first attempt. Joined at run time, the sentence exists nowhere in the source. */
      fired.text=()=>['RESOLVED','ON','THE','DISPLAY','PATH'].join(' ');
      X.setPrompt(k.idx,'');
      if(k.hatProp){k.hatProp.heldBy=null;k.hatProp=null;}   // the bird can pick one up mid-block
      for(let i=0;i<4;i++){ k.x=fired.x; k.z=fired.z; k.y=Math.max(0.25,fired.y); k.vy=0; k.grounded=true; X.update(1/60); }
      const plate=String(X.PROMPTS[k.idx]);
      ok(plate.indexOf('RESOLVED ON THE DISPLAY PATH')>=0,
         'a function-backed hint reaches the plate RESOLVED ('+plate.replace(/<[^>]*>/g,'').slice(0,60)+')');
      ok(plate.indexOf('=>')<0,'and not as its own source text, which is what a raw concatenation would show');
      fired.text=keep; } }
  X.startGame(1); tick(6);
}

C.section('THE TOUR CHASSIS - the world is now a biome, and it is the only one registered');
// TODO 36. The proof contract is ZERO OBSERVABLE CHANGE, so most of the evidence for this piece is
// not in this section at all: it is the nine batteries passing without a touched assertion, the
// capture set flagging nothing new, and the carpark builder being byte-identical to the buildWorld
// body it was lifted out of. What IS asserted here is the seam itself - that there is one, that it
// names what it built, that the guarantees survive it, and that it cannot drop you nowhere.
{
  const B=X.BIOME;
  ok(!!B&&!!B.ALL,'there is a biome registry');
  ok(B.DEFAULT==='carpark','and the default is the world that already existed ('+B.DEFAULT+')');
  /* THE COUNT IS NOW ASSERTED AGAINST THE BROCHURE, WHICH IS WHAT THIS COMMENT ALWAYS CLAIMED IT
     WAS. It said "asserted against the BROCHURE rather than against a number" directly above
     `length===2`, which is a number — and it went red the day the campground landed. The thing
     that would actually be wrong is a map with a pin and no builder, a builder with no pin, or
     maps built OUT OF ORDER, so that is what this asks: the registered set is exactly a prefix of
     the tour table. The default is checked separately above. */
  { const ids=X.TOUR.TABLE.map(t=>t.id), reg=Object.keys(B.ALL);
    const prefix=ids.slice(0,reg.length);
    ok(reg.length>=2,'at least the two maps the tour opened with are registered ('+reg.join(', ')+')');
    ok(prefix.every(id=>!!B.ALL[id])&&reg.every(id=>prefix.includes(id)),
       'and the registered maps are exactly the first '+reg.length+' pins on the brochure, so the '+
       'tour is built in the order it is sold ('+reg.join(', ')+' against '+prefix.join(', ')+')'); }
  ok(Object.keys(B.ALL).every(id=>X.TOUR.TABLE.some(t=>t.id===id)),
     'and every registered map has a pin on the brochure ('+Object.keys(B.ALL).join(', ')+')');
  ok(typeof B.ALL.carpark.build==='function','the carpark carries its builder');
  ok(B.ALL.carpark.label==='THE CARPARK','and a label to put on a map pin later ('+B.ALL.carpark.label+')');

  // BOOTING NAMES WHAT IT BUILT, which is what everything downstream will read instead of guessing.
  X.boot();
  ok(G.biome==='carpark','a plain boot builds the carpark and says so ('+G.biome+')');
  const counts=Object.fromEntries(X.WORLDREGS.map(r=>[r,(G[r]||[]).length]));
  X.boot({biome:'carpark'});
  ok(G.biome==='carpark','naming it explicitly does the same thing');
  for(const r of X.WORLDREGS)
    ok((G[r]||[]).length===counts[r],'and builds the same G.'+r+' either way ('+(G[r]||[]).length+')');

  /* AN UNKNOWN ID LANDS YOU SOMEWHERE REAL. A save or a link naming a biome that has not shipped
     yet - or has been renamed - must not throw and must not leave an empty world. It falls back to
     the default, and G.biome reports where you ACTUALLY are rather than where you asked to be. */
  /* the boot is WRAPPED because the failure mode here is a throw, not a wrong value - biomeOf
     returning undefined kills the battery on the next property access and takes every finding
     after it down too. A dead battery is a worse witness than a red one. */
  /* THE ID HERE MUST BE ONE NOTHING WILL EVER REGISTER. It used to be skifield, which was fine
     while the ski field did not exist and wrong the morning it did - the test quietly became a test
     that booting the ski field lands in the ski field. */
  let threw=null; try{ X.boot({biome:'nowhere-at-all'}); }catch(e){ threw=e&&e.message||String(e); }
  ok(!threw,'an unregistered biome does not throw on the way in ('+(threw||'no throw')+')');
  ok(G.biome==='carpark','and it falls back to the default rather than nowhere ('+G.biome+')');
  ok(G.props.length===counts.props,'and the fallback is a real world, not an empty one ('+G.props.length+' props)');
  ok(B.of('nowhere-at-all')===B.ALL.carpark,'the resolver says the same thing on its own');
  ok(B.of('skifield')===B.ALL.skifield,'while a map that IS registered resolves to itself');
  ok(B.of('carpark')===B.ALL.carpark&&B.of()===B.ALL.carpark,'and a missing id is the default too');

  // THE TODO 48 GUARANTEE LIVES IN THE DISPATCHER, ABOVE THE BIOME, so a biome author cannot forget
  // it. Two boots in a row through the new seam still leave exactly one world.
  X.boot(); X.boot();
  for(const r of X.WORLDREGS)
    ok((G[r]||[]).length===counts[r],'two boots through the dispatcher still leave one world in G.'+r+
       ' ('+(G[r]||[]).length+')');

  // AND THE RIG DOOR THE BATTERIES WILL USE. H.boot(name) exists and H.boot() means the default, so
  // no existing call site had to change - which is the whole reason this piece is invisible.
  H.boot(); ok(G.biome==='carpark','the rig boots the default with no argument');
  H.boot('carpark'); ok(G.biome==='carpark','and takes a name when it is given one');
  X.startGame(1); tick(6);
}

C.section('THE TOUR - a brochure, a save slot per map, and what it costs to open one');
/* TODO 37. Two things, and the second one only makes sense because of the first: progress is now
   stored per BIOME, and there is a brochure that reads that store and decides what you are allowed
   to walk into.
   THE SCHEMA IS THE PART THAT COULD LOSE SOMEBODY SOMETHING. v2 stored one world because there was
   one, and the tour makes that assumption expensive in a specific way: the star ledger is keyed by
   AREA, and two maps are perfectly free to have a page with the same name. Under v2 they would have
   written over each other. So the round trip below deliberately uses two biomes whose page names are
   IDENTICAL - the stub builds the carpark - because that is the collision the slots exist for and a
   test with two different chapter lists would not have touched it.
   THE BROCHURE IS DATA, and it has to be, because five of its six pins cannot be photographed yet.
   The look is flagged for Eric; the state machine is asserted here. */
{
  const realLS=globalThis.localStorage, _m=new Map();
  globalThis.localStorage={getItem:k=>_m.has(k)?_m.get(k):null,
                           setItem:(k,v)=>_m.set(k,String(v)),removeItem:k=>_m.delete(k)};
  const T=X.TOUR, S=X.STARS, B=X.BIOME;
  /* STUB NAMES THE FIRST PIN ON THE PAPER THAT HAS A PRICE AND NO BUILDER, which is what every
     unbuilt-map question below needs, and it is the one this section is allowed to register and
     delete. IT IS DERIVED NOW RATHER THAN TYPED. It was `const STUB=2` with a comment saying "pin 2
     since TODO 39, because pin 1 is built" — a constant restating a fact about the world that the
     world was going to change, and it did the moment the campground got a builder: three
     assertions went red asking an unbuilt-map question about a map that had just been built.
     Reading it off the registry keeps the CLAIM identical and survives the village, the river and
     the station landing too. */
  const STUB=T.TABLE.findIndex(t=>!B.ALL[t.id]);
  if(STUB<0)throw new Error('EVERYTHING: every map on the brochure has a builder — the unbuilt-map '+
    'section has nothing left to ask about and needs rewriting, not deleting');
  const grant=(area,kinds)=>{ const r=S.rec(area); for(const k of kinds)r[k]=true; return r; };
  try{
    // 1. THE TABLE IS THE TUNING SURFACE, so the things a tuner could get wrong are asserted.
    ok(Array.isArray(T.TABLE)&&T.TABLE.length>=2,'the tour is one table ('+T.TABLE.length+' pins)');
    ok(T.TABLE[0].id===B.DEFAULT&&T.TABLE[0].need===0,
       'the first pin is the map that already exists and costs nothing ('+T.TABLE[0].id+', need '+T.TABLE[0].need+')');
    { let asc=true, prev=-1; for(const t of T.TABLE){ if(!(t.need>prev)&&t.need!==0)asc=false; if(t.need<prev)asc=false; prev=t.need; }
      ok(asc,'the thresholds only go up, so no later pin is cheaper than an earlier one ('+
         T.TABLE.map(t=>t.need).join(',')+')'); }
    ok(new Set(T.TABLE.map(t=>t.id)).size===T.TABLE.length,'no map is pinned twice');
    ok(T.TABLE.every(t=>t.pin&&t.pin.x>0&&t.pin.x<1&&t.pin.y>0&&t.pin.y<1),
       'every pin sits on the paper, in fractions rather than pixels');
    ok(T.TABLE.every(t=>!!t.name&&!!t.sub),'and every pin carries its own copy');
    /* TWO SOURCES FOR A NAME IS ONE TOO MANY, so where a map is actually built the brochure and the
       biome registry are held to the same string. This is the assertion that catches a rename in
       one place and not the other. */
    for(const t of T.TABLE) if(B.ALL[t.id])
      ok(B.ALL[t.id].label===t.name,'the brochure and the registry agree on the name of '+t.id+
         ' ('+B.ALL[t.id].label+' vs '+t.name+')');

    // 2. A VIRGIN CAREER. Nothing is invented for a map nobody has been to.
    X.SAVE.wipe(); X.boot(); X.startGame(1); tick(8); park();
    { const m=T.model();
      ok(m.stars===0,'a fresh career has no stars ('+m.stars+')');
      ok(m.here===B.DEFAULT,'and the brochure knows which map the bird is standing in ('+m.here+')');
      ok(m.pins[0].state==='current','the carpark reads as where you are');
      ok(m.pins.slice(1).every(p=>p.state==='locked'),
         'every other pin is LOCKED, which is a different answer from not built yet ('+
         m.pins.map(p=>p.id+':'+p.state).join(' ')+')');
      ok(m.pins.slice(1).every(p=>p.stars===0&&p.of===0&&!p.visited),
         'and carries no stars and no denominator, because a map nobody has opened has no pages yet');
      ok(m.pins[0].of===(G.chapters||[]).length*S.KINDS.length,
         'the carpark denominator is its own page count times three ('+m.pins[0].of+')');
      ok(m.pins[0].stamp===false,'and it is not stamped on a fresh run'); }

    /* 3. THE CURRENCY IS THE TOTAL, and it is the ledger the game already keeps.
       TODO 39 CHANGED WHAT THIS BLOCK CAN ASK, and for the better: the paid-for-and-unbuilt state
       has moved one pin along the paper, so both states are now asserted against REAL rows of the
       table - pin 1 open because a map was built behind it, pin 2 soon because none has been yet. */
    /* ENOUGH PAGES TO PAY FOR THE STUB, DERIVED. This granted four pages for twelve stars, which
       paid for pin 2 exactly while pin 2 was the first unbuilt map. The campground gave pin 2 a
       builder, the stub moved to the village at eighteen, and the whole section started asking
       unbuilt-map questions about a map it had not paid for — reporting "the third pin is paid for
       too (18)" against twelve stars in hand. The fixture follows the price now. */
    const NEED2=T.TABLE[1].need, NEEDSTUB=T.TABLE[STUB].need;
    const PAGES=Math.max(4,Math.ceil(NEEDSTUB/S.KINDS.length));
    ok(PAGES<=G.chapters.length,'the carpark has enough pages to pay for the first unbuilt pin ('+
       PAGES+' needed of '+G.chapters.length+')');
    for(let i=0;i<PAGES;i++)grant(G.chapters[i],S.KINDS);
    { const m=T.model();
      ok(m.stars===PAGES*S.KINDS.length,PAGES+' pages granted whole count as '+
         (PAGES*S.KINDS.length)+' stars ('+m.stars+')');
      ok(m.pins[0].stars===m.stars,'all of them belong to the map they were earned on');
      ok(NEED2<=m.stars,'which covers what the second pin costs ('+NEED2+')');
      ok(m.pins[1].unlocked===true,'so the second pin is paid for');
      ok(m.pins[1].state==='open',
         'and it says GO, because TODO 39 built the map behind it ('+m.pins[1].state+')');
      ok(NEEDSTUB<=m.stars&&m.pins[STUB].unlocked===true,
         'the first unbuilt pin is paid for too ('+NEEDSTUB+' against '+m.stars+')');
      ok(m.pins[STUB].state==='soon',
         'and THAT one says NOT BUILT YET rather than GO, because its map does not exist ('+m.pins[STUB].state+')');
      /* the pin AFTER the stub, not pin 3: the stub moves as the tour fills up and this one has to
         move with it or it starts asserting 'locked' about a map that is merely unbuilt */
      const NEXT=STUB+1;
      if(NEXT<m.pins.length) ok(m.pins[NEXT].state==='locked',
        'while the pin after it is still locked at '+m.pins[NEXT].need); }

    /* A PICK IS REFUSED FOR TWO DIFFERENT REASONS AND SAYS WHICH, because the brochure button and
       whatever piece 38 builds both need to tell the player something true. */
    /* THE FIRST PIN THIS RUN CANNOT AFFORD, derived for the same reason STUB is: index 3 was a
       locked map until the campground moved the stub onto it, and then this asked a locked-map
       question about a map that answers 'not built yet'. */
    { const LOCKED=T.TABLE.findIndex(t=>t.need>T.model().stars);
      ok(LOCKED>=0,'there is still a pin this run cannot afford, for the locked-map question');
      const r1=T.pick(T.TABLE[LOCKED].id);
      ok(r1.ok===false&&r1.why==='locked'&&r1.need===T.TABLE[LOCKED].need,
         'picking a locked map is refused as locked, with the price in the answer ('+JSON.stringify(r1)+')');
      const r2=T.pick(T.TABLE[STUB].id);
      ok(r2.ok===false&&r2.why==='not built yet',
         'picking a paid-for map that has no builder is refused as unbuilt ('+JSON.stringify(r2)+')');
      const r3=T.pick('nowhere');
      ok(r3.ok===false&&/no such map/.test(r3.why||''),'and a map that is not on the brochure at all is refused');
      ok(!_m.has(T.KEY),'none of the three refusals recorded a pick ('+(_m.get(T.KEY)||'nothing')+')'); }

    X.SAVE.write();
    { const blob=JSON.parse(_m.get('keaSaveV1_n'));
      ok(blob.v===3&&!!blob.biomes&&!!blob.biomes.carpark,'the write puts the carpark in its own slot');
      ok(blob.biome==='carpark','and records which map it was written from ('+blob.biome+')');
      ok(Array.isArray(blob.biomes.carpark.areas)&&blob.biomes.carpark.areas.length===G.chapters.length,
         'with its page list, so the brochure can say n of m without loading the map ('+
         blob.biomes.carpark.areas.length+')'); }

    // 4. THE MAP EXISTS NOW. Same table, same save, and the pin flips to GO.
    B.define(T.TABLE[STUB].id,{label:T.TABLE[STUB].name,build:B.ALL.carpark.build});
    { const m=T.model();
      ok(m.pins[STUB].built===true&&m.pins[STUB].state==='open',
         'registering a builder turns the paid-for pin into GO ('+m.pins[STUB].state+')');
      const r=T.pick(T.TABLE[STUB].id);
      ok(r.ok===true,'and the pick is accepted ('+JSON.stringify(r)+')');
      ok(_m.get(T.KEY)===T.TABLE[STUB].id,'and recorded where boot will find it ('+_m.get(T.KEY)+')');
      ok(X.SAVE.picked()===T.TABLE[STUB].id,'which is exactly what SAVE.picked reads back'); }

    // 5. BOOT INTO THE BIOME, AND BACK, WITH THE SLOTS KEEPING THEIR OWN STARS.
    //    Both maps have the SAME page names here, which is the collision v2 could not survive.
    X.boot({biome:T.TABLE[STUB].id}); X.startGame(1); tick(8); park();
    ok(G.biome===T.TABLE[STUB].id,'booting into the stub map lands there ('+G.biome+')');
    { const m=T.model();
      ok(m.here===T.TABLE[STUB].id&&m.pins[STUB].state==='current','and the brochure follows you ('+m.here+')');
      ok(m.pins[STUB].stars===0,'the new map starts with no stars of its own ('+m.pins[STUB].stars+')');
      ok(m.pins[0].stars===PAGES*S.KINDS.length,
         'while the carpark still has all '+(PAGES*S.KINDS.length)+
         ', read off the blob rather than the world ('+m.pins[0].stars+')');
      ok(m.stars===PAGES*S.KINDS.length,'so the career total is unchanged by travelling ('+m.stars+')');
      ok(Object.keys(G.stars).length===0,
         'and the live ledger is empty, because the slot that hydrated was this map own ('+
         Object.keys(G.stars).length+' pages)'); }
    grant(G.chapters[0],['style']); X.SAVE.write();
    { const m=T.model();
      ok(m.pins[STUB].stars===1&&m.pins[0].stars===PAGES*S.KINDS.length,
         'a star earned here lands here ('+m.pins[STUB].stars+' vs carpark '+m.pins[0].stars+')');
      ok(m.stars===PAGES*S.KINDS.length+1,'and the total is the sum of the maps ('+m.stars+')'); }
    /* READ THROUGH AN ACCESSOR, and this block is the reason the rule exists. Written the obvious
       way - blob.biomes.carpark.stars - it THREW under the sabotage that made every write start the
       blob fresh, and a battery that dies takes every finding after it down with it: that sabotage
       came back with zero findings and looked like a test gap. It was not. It was this block
       reading state that only exists when the code works. Five pieces old and it still caught me. */
    { const blob=JSON.parse(_m.get('keaSaveV1_n'));
      const stars=id=>((blob.biomes||{})[id]||{}).stars||{};
      const a=stars('carpark'), b=stars(T.TABLE[STUB].id);
      ok(Object.keys(blob.biomes||{}).length===2,
         'both maps are in the blob ('+Object.keys(blob.biomes||{}).join(',')+')');
      ok(Object.keys(a).length===PAGES&&Object.keys(b).length===1,
         'each holding its own record ('+Object.keys(a).length+' pages of carpark vs '+Object.keys(b).length+')');
      ok(!!Object.keys(a)[0]&&Object.keys(a)[0]===Object.keys(b)[0],
         'and they key their pages by the SAME name, which is the collision the slots exist for ('+
         (Object.keys(b)[0]||'nothing')+')'); }

    X.boot({biome:'carpark'}); X.startGame(1); tick(8); park();
    ok(G.biome==='carpark','and back again');
    { const m=T.model();
      ok(m.pins[0].stars===PAGES*S.KINDS.length,'the carpark stars are still there after the round trip ('+m.pins[0].stars+')');
      ok(S.rec(G.chapters[0]).style===true&&S.rec(G.chapters[1]).clean===true,
         'in the live ledger, off the blob, page by page');
      ok(m.pins[STUB].stars===1,'and the other map kept its one ('+m.pins[STUB].stars+')');
      ok(m.stars===PAGES*S.KINDS.length+1,'total unchanged ('+m.stars+')'); }

    /* AND A PLAIN BOOT FOLLOWS THE PICK, which is the whole mechanism the brochure GO button uses
       today - it records and reloads, and piece 38 replaces the reload with a flyover. This caught
       itself while the section was being written: the migration block below booted plainly, landed
       in the picked map rather than the carpark, and read a slot that had never been written. That
       is the feature working, and it is now an assertion instead of a surprise. */
    X.boot(); ok(G.biome===T.TABLE[STUB].id,'a plain boot follows the recorded pick ('+G.biome+')');
    X.SAVE.pick('carpark'); X.boot();
    ok(G.biome==='carpark','and picking the carpark brings you back to it ('+G.biome+')');

    // 6. MIGRATION. A v2 blob is the carpark and nothing else, and it says where it came from.
    { const v2={v:2, done:['wiper'], chapIdx:1, peak:1234, t:56, band:2,
                stars:{[G.chapters[0]]:{cleared:true,style:true,clean:false}},
                pages:{[G.chapters[0]]:{open:0,close:400,earned:400,paid:200,caged:0}},
                hats:[null]};
      const mg=X.SAVE.migrate(v2);
      ok(mg.v===3,'a v2 blob migrates to v3 ('+mg.v+')');
      ok(mg.biome==='carpark'&&!!mg.biomes.carpark,'into the carpark slot, because that is the world it described');
      ok(mg.biomes.carpark.from==='v2','and the slot records the vintage it was retro-granted from ('+mg.biomes.carpark.from+')');
      ok(mg.peak===1234&&mg.t===56&&mg.band===2,
         'the career numbers stay at the top of the blob, because they are the player and not the map');
      ok(JSON.stringify(mg.biomes.carpark.stars)===JSON.stringify(v2.stars),'every star comes across');
      ok(JSON.stringify(mg.biomes.carpark.pages)===JSON.stringify(v2.pages),'so does every page snapshot');
      ok(mg.biomes.carpark.done[0]==='wiper'&&mg.biomes.carpark.chapIdx===1,'so does the done list and the page you were on');
      ok(Object.keys(mg.biomes).length===1,'and nothing is invented for a map v2 never knew about');
      // and it HYDRATES, which is the part a player would notice
      _m.set('keaSaveV1_n',JSON.stringify(v2));
      X.boot(); X.startGame(1); tick(12);
      ok(S.rec(G.chapters[0]).cleared===true&&S.rec(G.chapters[0]).style===true,
         'a v2 save hydrates through the migration ('+S.pips(G.chapters[0])+')');
      ok(G.chaosPeak>=1234,'and the career peak comes with it ('+G.chaosPeak+')');
      ok(T.model().pins[STUB].stars===0,'while the other map is back to nothing, because v2 never had one');
      // a v1 blob has no marker at all
      const v1=X.SAVE.migrate({done:['wiper'],chapIdx:0});
      ok(v1.v===3&&v1.biomes.carpark.from==='v1','a blob with no marker at all migrates as v1 ('+v1.biomes.carpark.from+')');
      ok(X.SAVE.migrate(null)===null&&X.SAVE.migrate('rubbish')===null,'and nothing migrates to nothing rather than throwing'); }

    // 7. A WIPE TAKES THE PICK WITH IT, or the next boot would keep walking into a map the player
    //    just asked to forget.
    X.SAVE.pick('carpark');
    ok(!!_m.get(T.KEY),'a pick is on the wire');
    X.SAVE.wipe();
    ok(!_m.has(T.KEY),'and a wipe takes it, so the next boot is the default again');
    ok(X.SAVE.picked()===null,'with nothing to read back');
    // AND A PICK NAMING A MAP THAT IS NOT REGISTERED IS IGNORED RATHER THAN OBEYED
    _m.set(T.KEY,'nowhere-at-all');
    ok(X.SAVE.picked()===null,'a pick naming a map that does not exist reads as no pick ('+X.SAVE.picked()+')');
  } finally {
    delete B.ALL[T.TABLE[STUB].id];    // the registry goes back to what the chassis section asserts
    globalThis.localStorage=realLS;
    X.SAVE.wipe&&X.SAVE.wipe(); X.boot(); X.startGame(1); tick(6);
  }
  /* AND THE REAL MAPS SURVIVE THE SECTION. This mattered the day TODO 39 landed: the finally used to
     delete pin 1 by index, which was the stub while the ski field was hypothetical and would have
     quietly deleted the actual ski field out of the registry for every section after this one. */
  ok(biomesRestored()&&!!X.BIOME.ALL.skifield,
     'the stub biome is out of the registry again and the built ones are not ('+
     Object.keys(X.BIOME.ALL).join(',')+')');
}

C.section('TRAVEL - leaving a map, arriving at one, and a skip that knows what was already down');
/* TODO 38, built fresh: piece 34 was reverted and there was no travel code left in the file to
   re-key. The two findings the Sep 1 investigation paid for are BINDING and both are honoured here:
   the anchors are a TABLE rather than a derivation from hints or mission props, and the skip arms
   late AND remembers which keys were already down when the beat opened, because the thing that
   opened it was itself a keypress.
   G.cams IS EMPTY UNDER NODE, so what is asserted is the STATE MACHINE - phases, the clock, the
   freeze, the skip, the restore, and the one-shot arrival - and the feel of the blend is flagged.
   The blend itself is placed in updateCams BEFORE the camLock line, which is the third piece of
   binding evidence: after it, every pinned vantage would depend on whether a beat was running. */
{
  const realLS=globalThis.localStorage, _m=new Map();
  globalThis.localStorage={getItem:k=>_m.has(k)?_m.get(k):null,
                           setItem:(k,v)=>_m.set(k,String(v)),removeItem:k=>_m.delete(k)};
  const V=X.TRAVEL, T=X.TOUR, B=X.BIOME;
  const tv=()=>G.travel||{};
  /* READ THROUGH AN ACCESSOR - the guard rule, and the THIRD time in this one session that it has
     been the difference between a sabotage landing and a battery dying. tv().held only exists while
     a beat is RUNNING: the ended record does not carry it, so any sabotage that makes a beat end
     early turns `tv().held[KEY]` into a throw and takes every finding after it down. */
  const heldOf=c=>((G.travel||{}).held||{})[c];
  try{
    X.SAVE.wipe(); X.boot(); X.startGame(1); tick(8); park();

    // 0. THE ANCHOR TABLE IS HELD TO THE WORLD IT NAMES, which is the only way a table cannot drift.
    { const a=V.anchor('carpark');
      ok(!!a,'the carpark declares an anchor');
      ok(!!a&&['x','y','z','lx','ly','lz'].every(k=>typeof a[k]==='number'),'and it is six numbers');
      let sx=0,sz=0; for(const pr of G.props){ sx+=pr.x; sz+=pr.z; }
      const cx=sx/G.props.length, cz=sz/G.props.length;
      ok(!!a&&Math.hypot(a.lx-cx,a.lz-cz)<24,
         'it looks at the map the world actually built, within 24 of the prop centroid ('+
         (a?Math.hypot(a.lx-cx,a.lz-cz).toFixed(1):'none')+' from '+cx.toFixed(1)+','+cz.toFixed(1)+')');
      ok(!!a&&a.y>X.groundHeightAt(a.x,a.z,a.y)+6,'from well above the ground at its own feet ('+(a?a.y:0)+')');
      ok(!!a&&a.y>a.ly,'looking down at the map rather than up out of it');
      ok(V.anchor('nowhere-at-all')===null,'and a biome that does not exist declares no anchor rather than inventing one'); }

    // 1. LEAVING. The beat opens, names both ends, and refuses to be doubled up.
    ok(V.out('nowhere-at-all')===null,'travel refuses a destination with no builder');
    { const o=V.out('carpark');
      ok(!!o&&o.phase==='out','travelOut opens an OUT beat ('+tv().phase+')');
      ok(tv().from==='carpark'&&tv().to==='carpark','naming where from and where to ('+tv().from+' -> '+tv().to+')');
      ok(V.busy()===true,'and the machine reports itself busy');
      ok(V.out('carpark')===null,'a second beat cannot open on top of one that is running');
      ok(V.u()===0,'the clock starts at zero ('+V.u()+')'); }

    /* THE BIRD IS NOT DRIVING DURING A BEAT. Asserted by holding the key down rather than by reading
       a flag, because the flag is not the claim - the claim is that the waddle does not happen. */
    { const k=G.keas[0]; k.x=0; k.z=0; k.y=0; k.grounded=true; k.ry=0; tick(2);
      const x0=k.x, z0=k.z;
      hold(P1.fwd); tick(10); un(P1.fwd);
      ok(Math.hypot(k.x-x0,k.z-z0)<0.01,'a held waddle key moves the bird nowhere while a beat plays ('+
         Math.hypot(k.x-x0,k.z-z0).toFixed(4)+')');
      ok(V.busy()===true,'and the beat is still running, so that was the freeze and not the end of it'); }

    // 2. IT ENDS BY ITSELF, ON ITS OWN CLOCK, AND AN OUT BEAT ARMS AN ARRIVAL.
    { let n=0; while(V.busy()&&n<600){ X.update(1/60); n++; }
      ok(!V.busy(),'the beat ends on its own clock ('+n+' frames)');
      ok(Math.abs(n/60-V.K.out)<0.2,'and that clock is the tunable one ('+(n/60).toFixed(2)+'s vs '+V.K.out+')');
      ok(tv().ended==='out'&&tv().skipped===false,'the record says which beat ended and that nobody skipped it');
      const ar=X.SAVE.peekArrival();
      ok(!!ar&&ar.to==='carpark','leaving arms an arrival at the map it was leaving for ('+JSON.stringify(ar&&ar.to)+')');
      ok(!!ar&&!!ar.run&&ar.run.mode===1,'and remembers the run it was in, so the load lands in it ('+
         JSON.stringify(ar&&ar.run)+')'); }

    /* AND THE BIRD DRIVES AGAIN, which is the other half of the freeze claim. Same held key, same
       ten frames, and the only thing that changed is that the beat is over. */
    { const k=G.keas[0]; k.x=0; k.z=0; k.y=0; k.grounded=true; k.ry=0; tick(2);
      const x0=k.x, z0=k.z; hold(P1.fwd); tick(10); un(P1.fwd);
      ok(Math.hypot(k.x-x0,k.z-z0)>0.2,'with the beat over the same held key moves it again ('+
         Math.hypot(k.x-x0,k.z-z0).toFixed(3)+')'); }

    // 3. ARRIVING. startGame consumes the armed arrival exactly once and plays the IN beat.
    { X.SAVE.armArrival('carpark',{mode:1});
      X.startGame(1); tick(2);
      ok(tv().phase==='in','starting a run with an arrival armed plays the IN beat ('+tv().phase+')');
      ok(tv().card==='THE CARPARK','and the card is the name the biome registry gives the place ('+tv().card+')');
      ok(X.SAVE.peekArrival()===null,'the arrival is consumed on the way in');
      const wasIn=tv().phase;
      X.startGame(1); tick(2);
      ok(wasIn==='in'&&tv().phase!=='in','so restarting does not play it again ('+tv().phase+')');
      /* AND AN ARRIVAL ARMED FOR A DIFFERENT MAP IS NOT THIS MAP BEAT. This used to register a
         stub called skifield and delete it again; since TODO 39 the ski field is a real map, so the
         other end of the journey is the actual other end and nothing here touches the registry. */
      X.SAVE.armArrival('skifield',{mode:1});
      X.boot({biome:'carpark'}); X.startGame(1); tick(2);
      ok(tv().phase!=='in','an arrival armed for another map does not fire on this one ('+tv().phase+')');
      _m.delete(T.ARRIVEKEY); }

    /* 4. THE SKIP, WHICH IS THE PART THAT COST A SESSION TO LEARN. The beat is opened WITH a travel
       key already down - which is what actually happens, because the button or the key that opened
       it is still under the finger - and that key must not skip anything. It only counts after it
       has been released and pressed again. */
    { X.startGame(1); tick(6); park();
      const KEY=V.KEYS[0];
      X.KEYS.add(KEY);                       // down at the open, exactly like the press that opened it
      V.in();
      ok(heldOf(KEY)===true,'the beat remembers which travel keys were already down at the open ('+heldOf(KEY)+')');
      let n=0; while(V.busy()&&n<40){ X.update(1/60); n++; }   // well past the arm delay
      ok(V.busy()===true,'a key still held from before the open skips nothing ('+n+' frames in)');
      ok(tv().armed===true,'even though the beat is armed by now');
      X.KEYS.delete(KEY); X.update(1/60);
      ok(heldOf(KEY)===false,'releasing it hands it back the right to ask ('+heldOf(KEY)+')');
      X.KEYS.add(KEY); X.update(1/60);
      ok(!V.busy(),'and pressing it again skips the beat');
      ok(tv().ended==='in'&&tv().skipped===true,'the record says it was skipped, not that it ran out ('+
         JSON.stringify({ended:tv().ended,skipped:tv().skipped})+')');
      X.KEYS.delete(KEY); }

    /* THE ARM DELAY IS A SECOND LOCK, not the same one. A key that was NOT down at the open, pressed
       inside the delay, is a real request - so it must not be thrown away, and it must not land
       early either. It takes effect the moment the beat arms. */
    { X.KEYS.clear(); const KEY=V.KEYS[0];
      V.in(); ok(tv().armed===false,'a fresh beat is not armed yet');
      X.KEYS.add(KEY); X.update(1/60);
      ok(V.busy()===true&&tv().armed===false,'a key pressed inside the arm delay does not skip yet');
      let n=0; while(V.busy()&&n<40){ X.update(1/60); n++; }
      ok(!V.busy(),'and lands the moment the beat arms rather than being thrown away ('+n+' frames)');
      ok(tv().skipped===true,'as a skip');
      ok(Math.abs((n+1)/60-V.K.arm)<0.06,'which is the arm delay and not the full beat ('+
         ((n+1)/60).toFixed(3)+'s vs '+V.K.arm+')');
      X.KEYS.clear(); }

    // 5. THE CAMERA AND CONTROL STATE COME BACK EXACTLY, and the assertion proves it is a RESTORE
    //    rather than a coincidence by moving all three while the beat is running.
    { X.startGame(1); tick(6);
      G.camYaw=1.2; G.camDist=0.7; G.photo=true;
      V.in();
      G.camYaw=-9; G.camDist=1.6; G.photo=false;
      let n=0; while(V.busy()&&n<400){ X.update(1/60); n++; }
      ok(G.camYaw===1.2&&G.camDist===0.7&&G.photo===true,
         'the camera and control state are restored to what they were at the open ('+
         JSON.stringify({camYaw:G.camYaw,camDist:G.camDist,photo:G.photo})+')');
      G.photo=false; }

    /* 6. THE BLEND SITS BEFORE camLock, WHICH IS THE THIRD PIECE OF BINDING EVIDENCE, and it can be
       proved under node after all - G.cams is empty, but nothing about updateCams needs a real
       camera. A stub with a position and a lookAt is enough to ask the only question that matters:
       with a beat running AND camLock set, which one wins. If the blend were applied after camLock,
       every pinned vantage in the capture set would depend on whether a travel beat was live. */
    { X.startGame(1); tick(6);
      const mk=()=>({position:{x:0,y:0,z:0,set(a,b,c){this.x=a;this.y=b;this.z=c;}},
                     look:null, lookAt(a,b,c){ this.look={x:a,y:b,z:c}; }});
      const cam=mk(); G.cams.length=0; G.cams.push(cam);
      const k=G.keas[0]; k.x=0; k.z=0; k.y=0; k.grounded=true; k.ry=0;
      // a beat halfway through, so the blend is at full strength and cannot be mistaken for a no-op
      V.in(); G.travel.t=V.K.in/2;
      X.CAMS.update(1/60);
      const blended={x:cam.position.x,y:cam.position.y,z:cam.position.z};
      const a=V.anchor('carpark');
      ok(Math.abs(blended.y-a.y)>0.5&&blended.y>1,
         'mid-beat the blend has actually moved the eye toward the anchor ('+blended.y.toFixed(2)+
         ' between the follow height and '+a.y+')');
      G.camLock={x:11,y:4.2,z:25,lx:3.5,ly:0.8,lz:15.5};
      X.CAMS.update(1/60);
      ok(cam.position.x===11&&cam.position.y===4.2&&cam.position.z===25,
         'and camLock still wins over it, so the photographer is untouched by travel ('+
         JSON.stringify({x:cam.position.x,y:cam.position.y,z:cam.position.z})+')');
      ok(!!cam.look&&cam.look.x===3.5&&cam.look.y===0.8&&cam.look.z===15.5,
         'look-at included, which is the half a blend would have quietly kept ('+JSON.stringify(cam.look)+')');
      G.camLock=null; G.cams.length=0; G.travel=null; }

    // 7. A BEAT WITH NO ANCHOR STILL RUNS, because a biome is allowed to ship before its
    //    establishing shot has been chosen. It just has nothing to blend toward.
    { B.define('anchorless',{label:'THE ANCHORLESS PLACE',build:B.ALL.carpark.build});
      let threw=null;
      try{ X.boot({biome:'anchorless'}); X.startGame(1); tick(4);
        const o=V.out('anchorless'); if(o)ok(o.anchor===null,'a biome with no anchor opens a beat with no anchor');
        let n=0; while(V.busy()&&n<400){ X.update(1/60); n++; } }
      catch(e){ threw=e&&e.message||String(e); }
      ok(!threw,'and nothing throws for the want of one ('+(threw||'no throw')+')');
      delete B.ALL.anchorless; }
  } finally {
    delete B.ALL.anchorless;           // and NOT the ski field, which is a map and not a stub
    globalThis.localStorage=realLS;
    X.KEYS.clear(); G.travel=null;
    X.SAVE.wipe&&X.SAVE.wipe(); X.boot(); X.startGame(1); tick(6);
  }
  ok(biomesRestored()&&!!X.BIOME.ALL.skifield,
     'the travel section leaves the real biomes registered and no stubs ('+
     Object.keys(X.BIOME.ALL).join(',')+')');
  ok(!X.TRAVEL.busy(),'and no beat running');
}

C.section('A HINT BELONGS TO THE MAP THAT CAN ANSWER IT - and startGame no longer needs a ute');
/* TODO 58, found by piece 55 and a blocker on the first real second map. The cage hint was added in
   startGame off G.uteG.localToWorld with NO guard, and G.uteG is set by the carpark builder: the day
   a biome without a ute booted, startGame threw, in every mode, before the hint even mattered.
   THE FIX IS AN OWNER, NOT A GUARD. The hint moved into mkDocUte, which is the thing that builds the
   cage. A map with no ute never calls it, so it never has the hint, and no if anywhere has to
   remember that. And G.hints joined the world registries, because it was the one thing a build put
   on the board that the dispatcher never took back off - invisible with one map, and the day there
   are two it means the carpark teaching follows you to the ski field and points at props in a
   country that is not there.
   AND MOVING CODE EARLIER IN THE FRAME CHANGED WHAT IT MEANT, which is the entry worth reading:
   localToWorld in r128 multiplies by matrixWorld and does not compute it. At build time nothing had,
   so the hint landed at its LOCAL offset - 1.1 metres behind the world origin, firing in the middle
   of the carpark - and this battery caught it on the first run. The site now calls
   updateMatrixWorld first and the hint is back at exactly the coordinates it had in startGame. */
{
  const B=X.BIOME;
  const cageOf=()=>(G.hints||[]).find(h=>h.mid==='cage')||null;
  try{
    X.boot(); X.startGame(1); tick(8);
    const before=cageOf();
    ok(!!before,'the carpark still has its cage hint');
    ok(!!before&&Math.abs(before.x-12.16)<0.01&&Math.abs(before.z-5.91)<0.01,
       'at the same world coordinates it had when startGame placed it ('+
       (before?before.x.toFixed(2)+', '+before.z.toFixed(2):'none')+')');
    const nHints=(G.hints||[]).length;
    ok(nHints===9,'and the carpark puts nine hints on the board ('+nHints+')');

    /* A MAP WITH NOTHING IN IT AT ALL is the sharpest version of the question - not just no ute, no
       anything - and it is the shape TODO 39 will boot before its diorama is finished. */
    B.define('bareground',{label:'BARE GROUND',build:()=>{}});
    let threw=null;
    try{ X.boot({biome:'bareground'}); X.startGame(1); tick(8); }
    catch(e){ threw=e&&e.message||String(e); }
    ok(!threw,'a biome with no ute - with nothing at all - boots and starts without throwing ('+
       (threw||'no throw')+')');
    ok(G.biome==='bareground','and it is really that biome, not a fallback ('+G.biome+')');
    ok(cageOf()===null,'the cage hint is simply absent there, with no guard anywhere saying so');
    ok((G.hints||[]).length===0,'and none of the carpark teaching came with us ('+
       (G.hints||[]).map(h=>h.mid).join(',')+')');

    X.boot({biome:'carpark'}); X.startGame(1); tick(8);
    const after=cageOf();
    ok(!!after&&(G.hints||[]).length===nHints,'coming back rebuilds every hint the carpark owns ('+
       (G.hints||[]).length+')');
    ok(!!after&&Math.abs(after.x-(before?before.x:0))<1e-9&&Math.abs(after.z-(before?before.z:0))<1e-9,
       'the cage one at the identical coordinates, twice ('+(after?after.x.toFixed(4):'none')+')');
    ok(!!after&&after.free===true&&typeof after.text==='function',
       'still free and still resolved when read, so piece 52 and piece 55 are untouched by the move');
  } finally { delete B.ALL.bareground; X.boot(); X.startGame(1); tick(6); }
  ok(biomesRestored(),'the bare-ground biome is out of the registry again ('+
     Object.keys(X.BIOME.ALL).join(',')+')');
}

C.section('2 KEA VERSUS - the match scaffold, every branch of the decision driven');
// TODO 22. A match is a WINDOW over the shared economy: piece 16 gave each bird a book that adds up
// to the score, and a match snapshots both at the whistle and reads the difference. So the chaos you
// arrived with does not count, and nothing about scoring had to change to get a scoreboard.
// The screens are browser-only and the timer is feel; the DECISION is a state machine and all four
// of its endings are driven below - the horn, sudden death, the sudden-death cap, and the draw.
{
  const V=X.VS;
  /* THE COMBO IS ISOLATED BEFORE EVERY PAYMENT, and that is the style-star lesson taken rather than
     relearned: award() multiplies the base by the live combo, so a literal in an assertion below
     would be asserting the combo and not the match. Zeroed here, bumpCombo takes it to one, and the
     multiplier is one - which pay() then CHECKS by returning what actually landed. */
  const pay=(k,pts,label)=>{ G.combo=0; G.comboT=0; const s0=G.score;
    X.award(pts,label||'STAGED',{x:0,y:1,z:0},k); return G.score-s0; };
  const clear=()=>{ G.paused=false; };   // vsEnd pauses the game; every ending here undoes it
  /* every read of the result goes through this, because the failure mode of a broken ending is a
     result that never arrives - and a battery that throws on result.winner takes every finding after
     it down with it. Learned twice already tonight; taken as a habit now. */
  const RES=()=>(G.vs&&G.vs.result)||{};

  // ---- roles ----
  X.startGame(2,{vs:true}); tick(4);
  /* FLAKES law 3, applied to a rule this section is not testing: piece 23 scopes scoring to one
     PATCH, and everything below stages awards wherever it is convenient. Turn the arena off so
     the assertions are about the thing they name. Piece 23 has its own section for the rule. */
  G.vs.arena=null;
  ok(!!G.vs&&G.vs.phase==='play','a match opens in play ('+(G.vs?G.vs.phase:'no match')+')');
  ok(G.vs.roles.menace!==G.vs.roles.management,'the two roles are different birds ('+
     JSON.stringify(G.vs.roles)+')');
  ok(V.role(G.vs.roles.menace)==='menace'&&V.role(G.vs.roles.management)==='management',
     'and each bird reports the role it holds');
  ok(V.role(0)!==V.role(1),'never the same role twice');
  /* IT IS A REAL FLIP, NOT A CONSTANT. Started repeatedly it must produce both assignments - the
     draw comes from rnd(), so this is deterministic under the gauntlet seed rather than lucky. */
  { const seen={}; for(let i=0;i<40;i++){ const v=V.start({}); seen[v.roles.menace]=1; }
    ok(!!seen[0]&&!!seen[1],'forty flips produce both assignments, so the coin is a coin ('+
       Object.keys(seen).join('/')+')'); }

  // ---- the clock is named, and the default is five minutes ----
  ok(V.LEN.short===180&&V.LEN.std===300&&V.LEN.long===480,'three lengths, 3 / 5 / 8 minutes');
  X.startGame(2,{vs:true}); tick(2);
  G.vs.arena=null;   // law 3: this section is not testing piece 23 scoping
  ok(G.vs.len===300&&G.vs.lenKey==='std','a match with no length asked for is the five minute one ('+G.vs.len+'s)');
  X.startGame(2,{vs:true,len:'long'}); tick(2);
  ok(G.vs.len===480,'and it takes a named length ('+G.vs.len+'s)');
  X.startGame(2,{vs:true,len:'fortnight'}); tick(2);
  ok(G.vs.len===300&&G.vs.lenKey==='std','an unknown length falls back to the default rather than to NaN ('+G.vs.len+')');

  // ---- a match needs two birds ----
  X.startGame(1); tick(4);
  ok(V.start({})===null,'a versus match cannot start with one bird on the board');

  // ---- THE SCORE IS A DELTA, which is the whole design ----
  X.startGame(2); tick(4);
  pay(G.keas[0],90,'BEFORE THE WHISTLE');
  const pre=X.LEDGER.of(0);
  X.startGame(2,{vs:true}); tick(4);
  /* FLAKES law 3, applied to a rule this section is not testing: piece 23 scopes scoring to one
     PATCH, and everything below stages awards wherever it is convenient. Turn the arena off so
     the assertions are about the thing they name. Piece 23 has its own section for the rule. */
  G.vs.arena=null;
  ok(X.LEDGER.of(0)>=pre,'the book carries the pre-match chaos over, because books outlive a restart');
  ok(V.scores()[0]===0&&V.scores()[1]===0,'but the match starts level at nothing to nothing ('+
     JSON.stringify(V.scores())+')');
  const first=pay(G.keas[0],30,'IN THE MATCH');
  ok(first===30,'the combo is out of the way, so a staged 30 pays 30 ('+first+')');
  ok(V.scores()[0]===first,'and only what is earned inside the match counts ('+JSON.stringify(V.scores())+')');

  // ---- the biggest single play each side ----
  /* the tops are DERIVED from what actually landed rather than from the numbers asked for, so the
     assertion survives anything that ever multiplies an award again. */
  const plays=[['SMALL',10],['THE BIG ONE',55],['SMALL AGAIN',12]].map(p=>({l:p[0],pts:pay(G.keas[0],p[1],p[0])}));
  const top=plays.reduce((a,b)=>b.pts>a.pts?b:a);
  const theirs={l:'THEIR BEST',pts:pay(G.keas[1],25,'THEIR BEST')};
  ok(G.vs.best[0]&&G.vs.best[0].pts===top.pts&&G.vs.best[0].label===top.l,
     'the biggest play is remembered, not the latest (kept '+JSON.stringify(G.vs.best[0])+
     ' of '+JSON.stringify(plays)+')');
  ok(G.vs.best[1]&&G.vs.best[1].pts===theirs.pts&&G.vs.best[1].label===theirs.l,
     'and each side keeps its own ('+JSON.stringify(G.vs.best[1])+')');

  // ---- ENDING 1: the horn, with a leader ----
  { G.vs.t=G.vs.len-0.001; tick(2);
    ok(G.vs.phase==='over'&&G.vs.why==='time','the horn ends it ('+G.vs.phase+'/'+G.vs.why+')');
    const r=RES();
    ok(r.winner===0,'and the bird that earned more takes it ('+JSON.stringify(r.scores)+' -> kea '+r.winner+')');
    ok(!!r.best&&r.best[0].pts===top.pts&&r.best[1].pts===theirs.pts,'the result carries both best plays ('+
       (r.best?r.best[0].pts+' / '+r.best[1].pts:'no result')+')');
    ok(V.update(1/60)===null,'a finished match does not tick on');
    clear(); }

  // ---- ENDING 2: level at the horn is NOT a result, it is sudden death ----
  X.startGame(2,{vs:true}); tick(4); clear();
  G.vs.arena=null;   // law 3: this section is not testing piece 23 scoping
  pay(G.keas[0],40,'LEVEL'); pay(G.keas[1],40,'LEVEL');
  ok(V.scores()[0]===V.scores()[1],'the two are level going into the horn ('+JSON.stringify(V.scores())+')');
  G.vs.t=G.vs.len-0.001; tick(2);
  ok(G.vs.phase==='sudden','level at the horn opens sudden death rather than declaring a draw ('+G.vs.phase+')');
  ok(G.vs.result===null,'and nothing is decided yet');
  ok(JSON.stringify(G.vs.tieAt)===JSON.stringify(V.scores()),'it remembers the score it was level at');

  // ---- ENDING 3: first point takes it ----
  { tick(60);
    ok(G.vs.phase==='sudden','still running a minute in is not required, but it is still running here');
    pay(G.keas[1],5,'THE GOLDEN POINT'); tick(2);
    ok(G.vs.phase==='over'&&G.vs.why==='sudden','the first point ends it ('+G.vs.why+')');
    ok(RES().winner===1,'and it goes to whoever scored it ('+JSON.stringify(RES().scores)+
       ' -> kea '+RES().winner+')');
    clear(); }

  // ---- ENDING 4: nobody blinks, and it is an honest draw ----
  X.startGame(2,{vs:true}); tick(4); clear();
  G.vs.arena=null;   // law 3: this section is not testing piece 23 scoping
  pay(G.keas[0],40,'LEVEL'); pay(G.keas[1],40,'LEVEL');
  G.vs.t=G.vs.len-0.001; tick(2);
  ok(G.vs.phase==='sudden','level again, so sudden death again');
  G.vs.sudden=V.SUDDEN-0.001; tick(2);
  ok(G.vs.phase==='over'&&G.vs.why==='draw','the cap runs out and it is a draw ('+G.vs.why+')');
  ok(RES().winner===-1,'with nobody named the winner ('+RES().winner+')');
  ok(!!RES().scores&&RES().scores[0]===RES().scores[1],'because the scores are still level ('+
     JSON.stringify(RES().scores)+')');
  clear();

  // ---- FLAKES law 1: a restart takes the match with it ----
  X.startGame(2,{vs:true}); tick(4); clear();
  G.vs.arena=null;   // law 3: this section is not testing piece 23 scoping
  ok(!!G.vs&&V.on(),'a match is running when the restart comes');
  X.startGame(1); tick(4);
  ok(G.vs===null&&!V.on(),'startGame cleared it, so no match rides into the next run');
  clear();
}

C.section('THE FIX VERB - wreck it, put it back, wreck it again, and it is worth less every time');
// TODO 18. THE MANAGEMENT holds the same key on a wrecked tear and it goes back. No per-object
// special cases: addTear already snapshots the base transform so the wreck animation can lean from
// it, and the restore just puts the snapshot back.
// What an act is WORTH is learned rather than tabulated (piece 13 again): a tear carries no points
// field, every value is a literal inside its own onDone, so the FIRST wreck measures what actually
// landed and that becomes the pristine value. One counter serves both directions.
{
  const FIX=X.FIX, V=X.VS, P2=H.P2;
  X.startGame(2,{vs:true}); tick(6); park();
  G.vs.arena=null;   // law 3: this section is not testing piece 23 scoping
  G.paused=false;
  const a=G.keas[0], b=G.keas[1];
  G.vs.roles={menace:0,management:1};                  // staged, because the coin is a coin
  ok(FIX.can(b)&&!FIX.can(a),'only the management can put things back ('+V.role(0)+' / '+V.role(1)+')');

  // a tear one bird can finish alone, and the other bird parked so it cannot join in (FLAKES law 3)
  const t=G.inter.find(it=>it.kind==='tear'&&!it.done&&!it.needsBoth&&!it.needsPartner&&it.getPos);
  ok(!!t,'a solo-finishable tear to work on ('+(t?t.label:'none')+')');
  const far=k=>{ k.x=46; k.z=46; k.y=0.25; k.vy=0; k.grounded=true; };
  /* THE COMBO IS HELD AT ZERO FOR THE WHOLE ACT, not just before it: the award lands somewhere
     inside a multi-second hold, so there is no single moment to zero it at. Same reason as piece 22
     - a literal in an assertion below would otherwise be asserting the combo. */
  const act=(k,map,other,want)=>{ far(other);
    const q=t.getPos(), yy=Math.max(q.y,X.groundHeightAt(q.x,q.z,3)+0.02);
    const s0=V.scores()[k.idx];
    hold(map.grab); let st=0;
    while(t.done!==want&&st<60*20){ G.combo=0; G.comboT=0;
      k.x=q.x; k.z=q.z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); st++; }
    un(map.grab); tick(2);
    return {paid:V.scores()[k.idx]-s0, frames:st}; };

  // ---- WRECK ONE: full price, and the object learns what it is worth ----
  const w1=act(a,P1,b,true);
  ok(t.done===true,'the menace wrecks it');
  ok(w1.paid>0,'and gets paid for it ('+w1.paid+')');
  ok(t.paid===w1.paid,'the object learned its pristine value from what actually landed ('+t.paid+')');
  ok(t.cycles===1,'one act, one cycle ('+t.cycles+')');
  const base=t.paid;

  // ---- FIX ONE: the same hold, the other bird, decayed once ----
  ok(FIX.value(t)===Math.round(base*0.6),'the order value is the pristine value decayed once ('+
     FIX.value(t)+' of '+base+')');
  const f1=act(b,P2,a,false);
  ok(t.done===false,'the management puts it back');
  ok(t.mesh?t.mesh.visible===true:true,'and the thing is visible again');
  ok(f1.paid===Math.round(base*0.6),'paid at DECAY once ('+f1.paid+' against '+Math.round(base*0.6)+')');
  ok(t.cycles===2,'two acts, two cycles ('+t.cycles+')');

  // ---- WRECK TWO: the SAME counter, so the menace is paid less for doing it again ----
  const w2=act(a,P1,b,true);
  ok(t.done===true,'the menace wrecks it a second time');
  ok(w2.paid===Math.round(base*0.36),'and is paid at DECAY squared, because both directions share the count ('+
     w2.paid+' against '+Math.round(base*0.36)+')');
  ok(w2.paid<w1.paid,'which is less than the first time ('+w2.paid+' < '+w1.paid+')');
  ok(t.cycles===3,'three acts, three cycles ('+t.cycles+')');

  // ---- FIX TWO ----
  const f2=act(b,P2,a,false);
  ok(t.done===false,'and it goes back again');
  ok(f2.paid===Math.round(base*0.216),'at DECAY cubed ('+f2.paid+' against '+Math.round(base*0.216)+')');
  ok(t.cycles===4,'four acts, four cycles ('+t.cycles+')');

  /* THE SEQUENCE IS THE PIECE, so it is asserted as a sequence and not only act by act: strictly
     falling, and each step the same ratio as the last. */
  const seq=[w1.paid,f1.paid,w2.paid,f2.paid];
  ok(seq.every((v,i)=>i===0||v<seq[i-1]),'the four acts fall strictly in value ('+seq.join(' -> ')+')');
  /* THE RATIO FORM OF THIS WAS A FLAKE AND WAS THROWN AWAY. Measured 35 -> 21 -> 13 -> 8, the
     step ratios are 0.600, 0.619 and 0.615 - rounding at small values, and two of them sat inside a
     0.02 tolerance by a thousandth. A tolerance that narrow passes today and fails the day a tear
     award changes, on correct code. The exact form has no tolerance to get wrong: each act is the
     pristine value decayed by the number of acts before it, rounded the way the game rounds. */
  const want=seq.map((v,i)=>Math.round(base*Math.pow(FIX.DECAY,i)));
  ok(seq.join(',')===want.join(','),'and each is exactly the pristine value decayed by the acts before it ('+
     seq.join(' -> ')+' against '+want.join(' -> ')+')');

  // ---- AND NONE OF IT EXISTS OUTSIDE A MATCH ----
  X.startGame(2); tick(6); park(); G.paused=false;
  const t2=G.inter.find(it=>it.kind==='tear'&&!it.done&&!it.needsBoth&&!it.needsPartner&&it.getPos);
  ok(!V.on(),'no match is running');
  ok(!FIX.can(G.keas[0])&&!FIX.can(G.keas[1]),'so neither bird is the management');
  ok(!!t2&&!FIX.fixable(t2,G.keas[1]),'and a tear is not fixable by anybody');
  ok(G._decay==null,'the award hook is not armed outside a match ('+G._decay+')');
  X.startGame(1); tick(6);
}

C.section('THE BOTCH - a restore goes back, and it goes back crooked, and it never gets worse');
// TODO 19. THE MANAGEMENT puts a thing back with its beak, so it lands wonky: a small rotation and a
// small offset off pristine, bounded by the mode constant. The success condition is untouched - only
// the transform is crooked - and the wonk is measured from PRISTINE every time, so an object fought
// over five times is exactly as crooked as one fought over once.
{
  const B=X.BOTCH, FIX=X.FIX, V=X.VS, P2=H.P2;
  ok(B.FIDELITY===0.80,'the fidelity constant is the one the mode constants name ('+B.FIDELITY+')');
  ok(Math.abs(B.BAND.rot-(1-B.FIDELITY)*0.6)<1e-12&&Math.abs(B.BAND.off-(1-B.FIDELITY)*0.18)<1e-12,
     'and the band is DERIVED from it rather than a second number to keep in step ('+
     B.BAND.rot.toFixed(3)+' rad, '+B.BAND.off.toFixed(3)+'m)');

  /* THE WONK IS A FUNCTION OF THE OBJECT, NOT OF THE WORLD STREAM. This is the assertion that says
     so: spend a pile of rnd() draws between two calls and the answer does not move. Off rnd() it
     would, and the tripwire would have to tolerate it. */
  { const a=B.wonk('t99',0); for(let i=0;i<50;i++)X.rnd(0,1); const b=B.wonk('t99',0);
    ok(JSON.stringify(a)===JSON.stringify(b),'the same object at the same cycle wonks identically, fifty draws apart');
    ok(JSON.stringify(B.wonk('t99',1))!==JSON.stringify(a),'a later cycle is a different wonk, so it is not one frozen pose');
    ok(JSON.stringify(B.wonk('t98',0))!==JSON.stringify(a),'and a different object is a different wonk'); }
  { const vals=[]; for(let i=0;i<200;i++)vals.push(B.noise('k'+i));
    ok(vals.every(v=>v>=-1&&v<=1),'the noise is bounded to -1..1 over two hundred keys');
    ok(vals.some(v=>v<-0.3)&&vals.some(v=>v>0.3),'and it uses both signs rather than leaning one way'); }

  // ---- through a REAL restore ----
  X.startGame(2,{vs:true}); tick(6); park(); G.paused=false;
  /* FLAKES law 3, applied to a rule this section is not testing: piece 23 scopes scoring to one
     PATCH, and everything below stages awards wherever it is convenient. Turn the arena off so
     the assertions are about the thing they name. Piece 23 has its own section for the rule. */
  G.vs.arena=null;
  const a=G.keas[0], b=G.keas[1];
  G.vs.roles={menace:0,management:1};
  const t=G.inter.find(it=>it.kind==='tear'&&!it.done&&!it.needsBoth&&!it.needsPartner&&it.getPos&&it.mesh&&it.base);
  ok(!!t,'a solo-finishable tear with a mesh and a base transform ('+(t?t.label:'none')+')');
  const pristine={px:t.base.px,pz:t.base.pz,rx:t.base.rx||0,rz:t.baseRz||0};
  const far=k=>{ k.x=46; k.z=46; k.y=0.25; k.vy=0; k.grounded=true; };
  /* FLAKES law 3, and it cost a round to remember: RIP OFF SPIKES spawns a loose spike prop AT the
     tear position when it is wrecked, so the restorer standing on the wreckage picks the PROP as its
     nearest interactable and never sees the thing it came to fix. Clear the ground first. */
  const clearGround=q=>{ for(const p of G.props){ if(p.heldBy||p.banked)continue;
    if(Math.hypot(p.x-q.x,p.z-q.z)<3.5){ p.x=44; p.z=44; p.vy=0; if(p.mesh)p.mesh.position.set(44,0.3,44); } } };
  const act=(k,map,other,want)=>{ far(other);
    const q=t.getPos(), yy=Math.max(q.y,X.groundHeightAt(q.x,q.z,3)+0.02);
    if(k.held){k.held.heldBy=null;k.held=null;}
    clearGround(q);
    hold(map.grab); let st=0;
    while(t.done!==want&&st<60*20){ G.combo=0; G.comboT=0; clearGround(q);
      k.x=q.x; k.z=q.z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); st++; }
    un(map.grab); tick(2); return st; };
  const dev=()=>({ px:t.mesh.position.x-pristine.px, pz:t.mesh.position.z-pristine.pz,
                   rx:t.mesh.rotation.x-pristine.rx, rz:t.mesh.rotation.z-pristine.rz });
  const inBand=d=>Math.abs(d.px)<=B.BAND.off+1e-9&&Math.abs(d.pz)<=B.BAND.off+1e-9&&
                  Math.abs(d.rx)<=B.BAND.rot+1e-9&&Math.abs(d.rz)<=B.BAND.rot+1e-9;
  const mag=d=>Math.max(Math.abs(d.px),Math.abs(d.pz),Math.abs(d.rx),Math.abs(d.rz));

  act(a,P1,b,true);
  ok(t.done===true,'the menace wrecks it');
  act(b,P2,a,false);
  ok(t.done===false,'THE SUCCESS CONDITION STILL HOLDS - it is restored');
  ok(t.mesh.visible===true,'and it is back in the world');
  const d1=dev();
  ok(mag(d1)>1e-6,'but it did NOT land pristine ('+JSON.stringify(d1)+')');
  ok(inBand(d1),'and it landed inside the band the constant sets');
  ok(!!t.botch,'the object records the wonk it is wearing');

  /* NON-COMPOUNDING IS THE PIECE. Wreck it and restore it again: the deviation is measured from
     PRISTINE both times, so the second one is a DIFFERENT wonk of the SAME size, not a bigger one. */
  act(a,P1,b,true); act(b,P2,a,false);
  const d2=dev();
  ok(t.done===false,'restored a second time');
  ok(inBand(d2),'still inside the band, measured from pristine and not from where it last landed ('+
     JSON.stringify(d2)+')');
  ok(JSON.stringify(d2)!==JSON.stringify(d1),'and it is a different crooked, because the cycle moved on');
  ok(mag(d2)<=B.BAND.rot+1e-9,'the second restore is not twice as wonky as the first ('+
     mag(d1).toFixed(4)+' then '+mag(d2).toFixed(4)+', band '+B.BAND.rot.toFixed(4)+')');

  // five more rounds, because compounding is the kind of bug that only shows after a few
  { for(let i=0;i<5;i++){ act(a,P1,b,true); act(b,P2,a,false); }
    const d=dev();
    ok(t.done===false&&inBand(d),'seven restores in and it is still inside the same band ('+
       JSON.stringify(d)+')');
    ok(mag(d)<=B.BAND.rot+1e-9,'so an object fought over all match is as crooked as one put back once, no worse'); }
  X.startGame(1); tick(6);
}

C.section('THE CARRY-BACK - pick it up where it does not belong, drop it where it does');
// TODO 20. The whole verb is two questions asked at the moment of a drop: was this away when you
// picked it up, and is it home now. No carry state, so a bird shooed mid-carry simply does not score.
// What it pays is LEARNED - whatever the drop that displaced it awarded becomes its pristine value -
// and the carry-back pays that decayed by the same shared cycle count the tears use.
{
  const CY=X.CARRY, B=X.BOTCH, V=X.VS, P2=H.P2;
  X.startGame(2,{vs:true}); tick(6); park(); G.paused=false;
  /* FLAKES law 3, applied to a rule this section is not testing: piece 23 scopes scoring to one
     PATCH, and everything below stages awards wherever it is convenient. Turn the arena off so
     the assertions are about the thing they name. Piece 23 has its own section for the rule. */
  G.vs.arena=null;
  const a=G.keas[0], b=G.keas[1];
  G.vs.roles={menace:0,management:1};
  const free=k=>{ if(k.held){k.held.heldBy=null;k.held=null;} };
  const takeWith=(k,map,p)=>{ free(k);
    const yy=Math.max(0.25,p.y,X.groundHeightAt(p.x,p.z,3)+0.02);
    for(let i=0;i<3;i++){ k.x=p.x; k.z=p.z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); }
    tap(map.grab); tick(2); return k.held===p; };
  const dropAt=(k,map,x,z)=>{ const yy=Math.max(0.25,X.groundHeightAt(x,z,3)+0.02);
    for(let i=0;i<3;i++){ k.x=x; k.z=z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); }
    G.combo=0; G.comboT=0; const s0=V.scores()[k.idx];
    tap(map.grab); tick(4); return V.scores()[k.idx]-s0; };

  /* FLAKES law 3, and the first pick failed on it: interact() takes the NEAREST candidate, and the
     first displaceable prop in the world is a ski lying under CHEW THE BINDING - the tear sits
     0.36 away and the ski 0.57, so every tap went to the tear and the bird never picked anything up.
     Choose a prop standing on clean ground instead of teleporting one there, because this piece is
     about where a prop LIVES and moving its neighbourhood would be moving the question. */
  const nearest=q=>{ let d=99; for(const it of G.inter){ if(it===q)continue;
      if(it.kind==='prop'&&(it.heldBy||it.banked))continue;
      const g=it.getPos?it.getPos():it;
      d=Math.min(d,Math.hypot(g.x-q.x,g.z-q.z)); } return d; };
  const clean=exclude=>G.props.filter(q=>q.home&&!q.banked&&!q.heldBy&&q.homeClass==='displaceable'&&q!==exclude)
    .sort((u,v)=>nearest(v)-nearest(u))[0];
  const p=clean(null);
  ok(!!p&&nearest(p)>0.9,'a displaceable prop with a home and the most elbow room in the world ('+
     (p?p.name:'none')+', nearest neighbour '+(p?nearest(p).toFixed(2):'-')+'m)');
  const home={x:p.home.x,z:p.home.z};
  const dist=()=>Math.hypot(p.x-home.x,p.z-home.z);

  // ---- THE MENACE TAKES IT SOMEWHERE IT DOES NOT BELONG ----
  ok(takeWith(a,P1,p),'the menace picks it up');
  dropAt(a,P1,home.x+26,home.z);
  ok(dist()>20,'and drops it a long way from home ('+dist().toFixed(1)+'m)');
  ok(p._wasAway===true,'the prop knows it is away');
  ok(CY.at(p)===false,'and the home predicate agrees');
  const learned=p.paid||0;
  ok(p.paid!==undefined,'the drop taught it what displacing it was worth ('+learned+')');

  // ---- WRONG BIRD: the menace cannot tidy up ----
  { ok(takeWith(a,P1,p),'the menace picks it up again');
    const paid=dropAt(a,P1,home.x,home.z);
    ok(paid===0,'dropping it home as the MENACE pays nothing ('+paid+')');
    ok((p.cycles||0)===0,'and counts no cycle ('+(p.cycles||0)+')'); }

  // ---- RIGHT BIRD, WRONG PLACE: outside the radius is not a restore ----
  { ok(takeWith(a,P1,p),'move it out again'); dropAt(a,P1,home.x+26,home.z);
    ok(takeWith(b,P2,p),'the management picks it up');
    const paid=dropAt(b,P2,home.x+6,home.z);
    ok(paid===0,'dropping it SIX metres from home pays nothing ('+paid+')');
    ok(dist()>CY.HOMER,'because it is outside the catch radius ('+dist().toFixed(2)+' > '+CY.HOMER+')');
    ok(p._wasAway===true,'and it is still away');
    ok((p.cycles||0)===0,'still no cycle ('+(p.cycles||0)+')'); }

  // ---- RIGHT BIRD, RIGHT PLACE ----
  { p.paid=40;                     // staged pristine value, so the payment is a number and not a maybe
    ok(takeWith(b,P2,p),'the management picks it up');
    const want=CY.value(p);
    ok(want===40,'the order value of an untouched object is its pristine value ('+want+')');
    const paid=dropAt(b,P2,home.x,home.z);
    ok(paid===want,'dropping it home pays exactly that ('+paid+' against '+want+')');
    ok(p._wasAway===false,'the prop is no longer away');
    ok((p.cycles||0)===1,'one cycle counted ('+p.cycles+')');
    ok(CY.at(p),'and it is home ('+dist().toFixed(3)+'m)');

    /* BOTCHED PLACEMENT, through piece 19 and not a second kind of crooked: home, but not EXACTLY
       home, and inside the band the mode constant sets. */
    ok(dist()>1e-6,'but not exactly home - a bird put it there ('+dist().toFixed(4)+'m)');
    ok(Math.abs(p.x-home.x)<=B.BAND.off+1e-9&&Math.abs(p.z-home.z)<=B.BAND.off+1e-9,
       'and the offset is inside the botch band ('+B.BAND.off.toFixed(3)+'m)');
    ok(!!p.botch,'the prop records the wonk it is wearing'); }

  // ---- AND IT DECAYS ON THE SHARED COUNTER ----
  { ok(takeWith(a,P1,p),'the menace takes it away again'); dropAt(a,P1,home.x+26,home.z);
    ok(takeWith(b,P2,p),'the management fetches it back');
    const want=CY.value(p);
    ok(want===Math.round(40*Math.pow(X.FIX.DECAY,p.cycles)),'the second homecoming is worth less ('+
       want+' at cycle '+p.cycles+')');
    const paid=dropAt(b,P2,home.x,home.z);
    ok(paid===want,'and pays that ('+paid+')');
    ok(paid<40,'strictly less than the first ('+paid+' < 40)'); }

  // ---- A PROP NOBODY WAS EVER PAID FOR IS WORTH NOTHING TO TIDY, WHICH IS CORRECT ----
  { const q=clean(p);
    ok(!!q&&nearest(q)>0.9,'a second displaceable prop with room around it ('+(q?q.name:'none')+
       ', nearest '+(q?nearest(q).toFixed(2):'-')+'m)');
    q.paid=0; q.cycles=0;
    ok(takeWith(a,P1,q),'moved away by the menace'); dropAt(a,P1,q.home.x+26,q.home.z);
    q.paid=0;                                     // whatever that drop taught it, stage it back to nothing
    ok(takeWith(b,P2,q),'and fetched back by the management');
    const paid=dropAt(b,P2,q.home.x,q.home.z);
    ok(paid===0,'it pays nothing, because undoing something worthless is worthless ('+paid+')');
    ok((q.cycles||0)===1,'but it still COUNTS as a restore ('+q.cycles+')');
    /* THE BOUND THIS ASSERTED WAS NEVER THE ONE THE CODE GUARANTEES, and it had been passing on the
       luck of which prop this block picked. botchWonk draws x and z INDEPENDENTLY - each a noise in
       [-1,1] times BAND.off - so the invariant is PER AXIS and the furthest a botched landing can
       sit from home is the corner of the band. Every other botch assertion in this file reads it per
       axis (three of them); this one was the outlier. Found by piece 38, whose extra world builds
       moved the rng stream and handed this block a different prop: DOC radio, dx -0.0314 and dz
       0.0248 against an off of 0.0360 - inside the band on both axes, 0.0399 away in a straight
       line. FLAKES law 10: read the convention, do not re-hardcode a number. */
    ok(Math.abs(q.x-q.home.x)<=B.BAND.off+1e-9&&Math.abs(q.z-q.home.z)<=B.BAND.off+1e-9,
       'and it still lands home, botched inside the band on both axes ('+(q.x-q.home.x).toFixed(4)+
       ', '+(q.z-q.home.z).toFixed(4)+' vs '+B.BAND.off.toFixed(4)+')');
    ok(Math.hypot(q.x-q.home.x,q.z-q.home.z)<=B.BAND.off*Math.SQRT2+1e-9,
       'which is no further from home than the corner of it ('+
       Math.hypot(q.x-q.home.x,q.z-q.home.z).toFixed(4)+')'); }

  X.startGame(1); tick(6);
}

C.section('THE SOURCE - a scoffed sandwich cannot be un-eaten, so the management walks');
// TODO 21. The asymmetry is the point: the menace undoes the management with one bite and the
// management cannot answer it in place. Every consumable is replaceable from a SOURCE, the source
// for a consumable is the nearest one to where that consumable LIVES (derived, not tabulated), and
// the source runs out - which is what stops it being a treadmill.
{
  const FD=X.FOOD, CY=X.CARRY, B=X.BOTCH, V=X.VS, P2=H.P2;
  X.startGame(2,{vs:true}); tick(6); park(); G.paused=false;
  /* FLAKES law 3, applied to a rule this section is not testing: piece 23 scopes scoring to one
     PATCH, and everything below stages awards wherever it is convenient. Turn the arena off so
     the assertions are about the thing they name. Piece 23 has its own section for the rule. */
  G.vs.arena=null;
  const a=G.keas[0], b=G.keas[1];
  G.vs.roles={menace:0,management:1};
  const free=k=>{ if(k.held){k.held.heldBy=null;k.held=null;} };
  const standAt=(k,x,z)=>{ const yy=Math.max(0.25,X.groundHeightAt(x,z,3)+0.02);
    for(let i=0;i<3;i++){ k.x=x; k.z=z; k.y=yy; k.vy=0; k.grounded=true; X.update(1/60); } };
  const dropAt=(k,map,x,z)=>{ standAt(k,x,z); G.combo=0; G.comboT=0;
    const s0=V.scores()[k.idx]; tap(map.grab); tick(4); return V.scores()[k.idx]-s0; };

  ok((G.foodSrc||[]).length===2,'two sources in the world ('+(G.foodSrc||[]).map(s=>s.id).join(', ')+')');
  ok((G.foodSrc||[]).every(s=>s.stock===FD.STOCK),'each starts with the stock constant ('+FD.STOCK+')');

  const food=G.props.find(p=>p.food&&p.home&&!p.banked);
  ok(!!food,'a consumable with a home ('+(food?food.name:'none')+')');
  const src=FD.near(food.home.x,food.home.z);
  ok(!!src,'and a nearest source to where it lives ('+(src?src.id:'none')+')');

  // ---- THE MENACE EATS IT ----
  food.banked=true; food.heldBy=null; if(food.mesh)food.mesh.visible=false;
  food.paid=50; food.cycles=0;              // staged pristine value, so the payment is a number
  ok(FD.orders().indexOf(food)>=0,'a scoffed consumable is an outstanding order');
  ok(FD.orderFor(src)===food,'and the source that can answer it is the one nearest its home');
  /* THE OTHER SOURCE MUST NOT ANSWER IT, which is the half of "derived, not tabulated" a
     single-source assertion cannot see - and it has to be asked AFTER the food is eaten, which is
     what the first version of this got wrong: with no outstanding order both sources answered null
     and the assertion passed on a sabotage that had broken the rule. */
  { const other=(G.foodSrc||[]).find(t=>t!==src);
    ok(!!other,'there is a second source to be wrong with ('+(other?other.id:'none')+')');
    ok(FD.orderFor(other)!==food,'and it does NOT answer an order that belongs to the first'); }

  /* IT CANNOT BE UN-EATEN. There is no verb anywhere that puts a banked consumable back where it
     was - the only route is the source - and that is asserted rather than assumed. */
  ok(food.banked===true&&(!food.mesh||food.mesh.visible===false),'it is gone from the world');
  ok(CY.at(food)===false||food.banked,'and nothing has quietly restored it');

  // ---- WRONG BIRD AT THE SOURCE ----
  { standAt(a,src.x,src.z); free(a);
    const got=FD.fetch(a);
    ok(got===null,'the MENACE gets nothing from the source');
    ok(src.stock===FD.STOCK,'and takes no stock ('+src.stock+')'); }

  // ---- RIGHT BIRD, WRONG PLACE ----
  { standAt(b,src.x+9,src.z+9); free(b);
    ok(FD.at(b)===null,'standing nowhere near a source is not being at one');
    ok(FD.fetch(b)===null,'so nothing is handed over'); }

  // ---- THE MANAGEMENT WALKS TO THE SOURCE AND FETCHES ONE ----
  { standAt(b,src.x,src.z); free(b);
    const stock0=src.stock;
    const rep=FD.fetch(b), R=()=>rep||{};   // a refused fetch must FAIL an assertion, never throw
    ok(!!rep,'the management is handed a replacement at the '+src.id);
    ok(!!rep&&b.held===rep,'straight into the beak');
    ok(R().banked===false,'it is a real prop in the world again');
    ok(src.stock===stock0-1,'and the source is one down ('+src.stock+' of '+FD.STOCK+')');
    ok(R()._wasAway===true,'it counts as away, because it is standing at the source and not at home');
    ok(!!R().home&&Math.hypot(src.x-R().home.x,src.z-R().home.z)>0.5,'which is not where it lives'); }

  // ---- AND CARRYING IT HOME RESTORES IT, THROUGH PIECE 20 AND NOT A SECOND PATH ----
  { const rep=b.held, R=()=>rep||{};
    ok(!!rep,'the management is still carrying the replacement');
    const want=CY.value(rep);
    const home=R().home?{x:R().home.x,z:R().home.z}:{x:0,z:0};
    ok(want===50,'the order value is the pristine value of what was eaten ('+want+')');
    const paid=dropAt(b,P2,home.x,home.z);
    ok(paid===want,'placing it at the home spot pays ORDER ('+paid+')');
    ok(R().banked===false&&(!R().mesh||R().mesh.visible===true),'the prop is present again');
    ok(!!rep&&CY.at(rep),'and it is home ('+(rep?Math.hypot(rep.x-home.x,rep.z-home.z).toFixed(3):'-')+'m)');
    ok(!!rep&&Math.hypot(rep.x-home.x,rep.z-home.z)>1e-6,'but botched, not exact');
    ok(!!rep&&Math.abs(rep.x-home.x)<=B.BAND.off+1e-9&&Math.abs(rep.z-home.z)<=B.BAND.off+1e-9,
       'and inside the same band every other restore uses');
    ok((R().cycles||0)===1,'one cycle counted, on the same counter ('+R().cycles+')');
    ok(!!rep&&FD.orders().indexOf(rep)<0,'and it is no longer an outstanding order'); }

  // ---- DEPLETION ----
  { const s=FD.near(food.home.x,food.home.z);
    let handed=0;
    for(let i=0;i<6;i++){
      food.banked=true; food.heldBy=null; if(food.mesh)food.mesh.visible=false;
      standAt(b,s.x,s.z); free(b);
      if(FD.fetch(b))handed++; }
    ok(handed===FD.STOCK-1,'the source hands over what it had left and no more ('+handed+
       ' after one was already taken, stock constant '+FD.STOCK+')');
    ok(s.stock===0,'the source is empty ('+s.stock+')');
    free(b);
    food.banked=true; food.heldBy=null; if(food.mesh)food.mesh.visible=false;
    standAt(b,s.x,s.z);
    ok(FD.fetch(b)===null,'and an empty source hands over nothing at all');
    ok(FD.orderFor(s)===food,'while the order is still outstanding - the menace is ahead, which is the point'); }

  X.startGame(1); tick(6);
}

C.section('ARENA SCOPING - a match is one patch, and the rest of the country is free');
// TODO 23. The brief scopes on "interactables whose mission area matches the arena" and the file
// cannot answer that for most of them: 29 of 65 carry a mission id. So every interactable is STAMPED
// with an area derived from data that exists - its own mission area, or the area of the nearest
// thing that has one - and the score gate reads the POSITION an award happened at, which award()
// already carries. Forty-six call sites untouched.
{
  const A=X.ARENA, V=X.VS;
  X.startGame(2,{vs:true}); tick(6); park(); G.paused=false;
  const a=G.keas[0], b=G.keas[1];

  // ---- the stamp covers everything, which is the whole reason it is derived ----
  const stamped=A.stamp();
  const all=G.inter.length, withMission=G.inter.filter(it=>!!A.of(it)).length;
  ok(withMission<all,'most interactables carry no mission of their own ('+withMission+' of '+all+')');
  ok(stamped===all,'but every one of them ends up with an area ('+stamped+' of '+all+')');
  ok(G.inter.every(it=>!it.area||(G.chapters||[]).indexOf(it.area)>=0||it.area==='TO DO (AS WELL)'),
     'and every stamp is a real area rather than an invented one');
  /* the ones that DO carry a mission must keep their own area - the derivation is a fallback, not an
     override, and a fallback that quietly overrode would be invisible without this. */
  { const owned=G.inter.filter(it=>!!A.of(it));
    ok(owned.length>0&&owned.every(it=>it.area===A.of(it)),
       'a thing with a mission keeps ITS OWN area, the nearest-neighbour rule only fills gaps ('+owned.length+' checked)'); }

  // ---- the arena is chosen at the whistle, and it is a real patch ----
  ok(!!G.vs.arena&&(G.chapters||[]).indexOf(G.vs.arena)>=0,'a match names a patch ('+G.vs.arena+')');
  { const seen={}; for(let i=0;i<40;i++){ const v=V.start({}); seen[v.arena]=1; }
    ok(Object.keys(seen).length>1,'forty matches do not all pick the same one ('+
       Object.keys(seen).length+' distinct of '+(G.chapters||[]).length+')'); }
  { const v=V.start({arena:'THE HUT'}); ok(v.arena==='THE HUT','a named patch is honoured ('+v.arena+')');
    const w=V.start({arena:'THE MOON'}); ok((G.chapters||[]).indexOf(w.arena)>=0,
      'and an unknown one falls back to a real patch rather than to nothing ('+w.arena+')'); }
  /* TOUR runs the chapter order as a series, which is the other half of the brief. */
  { G.vsTour=0; const seq=[]; for(let i=0;i<4;i++)seq.push(V.start({tour:true}).arena);
    ok(seq.join('|')===(G.chapters||[]).slice(0,4).join('|'),
       'TOUR walks the chapters in order ('+seq.join(' -> ')+')'); }

  // ---- IN PATCH SCORES, OUT OF PATCH DOES NOT ----
  { const inIt=G.inter.find(it=>it.area&&A.home(it));
    ok(!!inIt,'something to aim at with a known area ('+(inIt?inIt.area:'none')+')');
    /* if the stamp is broken there is nothing to aim at, and every read below would throw and take
       the findings with it. Fifth time this has come up, so it is now reflex: bail the block, keep
       the verdict. */
    if(!inIt){ ok(false,'no stamped interactable at all, so the scoping block cannot run'); }
    else {
    V.start({arena:inIt.area}); G.paused=false;
    const here=A.home(inIt);
    ok(A.at(here)===inIt.area,'the gate reads that spot as its own patch ('+A.at(here)+')');
    ok(A.ok(here)===true,'and lets it score');

    const outIt=G.inter.find(it=>it.area&&it.area!==inIt.area&&A.home(it));
    ok(!!outIt,'and something in a DIFFERENT patch ('+(outIt?outIt.area:'none')+')');
    const there=outIt?A.home(outIt):{x:here.x+80,z:here.z+80};
    ok(!!outIt&&A.at(there)===outIt.area,'the gate reads that spot as the other patch ('+A.at(there)+')');
    ok(A.ok(there)===false,'and refuses it');

    // through award() itself, which is where it has to be true
    G._wrongSpy=[];
    G.combo=0; G.comboT=0; const s0=G.score;
    X.award(40,'IN THE PATCH',{x:here.x,y:1,z:here.z},a);
    const inPaid=G.score-s0;
    ok(inPaid===40,'an act inside the patch pays in full ('+inPaid+')');
    G.combo=0; G.comboT=0; const s1=G.score;
    X.award(40,'OUT OF THE PATCH',{x:there.x,y:1,z:there.z},a);
    const outPaid=G.score-s1;
    ok(outPaid===0,'an act outside it pays NOTHING ('+outPaid+')');
    ok(G._wrongSpy.length===1&&!!outIt&&G._wrongSpy[0].area===outIt.area,
       'and says so once, naming the patch it was actually in ('+JSON.stringify(G._wrongSpy)+')');
    ok(V.scores()[0]===40,'so the scoreboard only ever saw the in-patch one ('+JSON.stringify(V.scores())+')');

    /* AN AWARD WITH NO POSITION IS NOT A PATCH ACT - a page turn, a finale - and is never gated.
       Getting this wrong would silently stop the game paying for anything that has no location. */
    G.combo=0; G.comboT=0; const s2=G.score;
    X.award(25,'NO PLACE AT ALL',null,a);
    ok(G.score-s2===25,'an award with no position is not scoped and pays in full ('+(G.score-s2)+')');
    G._wrongSpy=null; } }

  // ---- AND NONE OF IT APPLIES OUTSIDE A MATCH ----
  { X.startGame(2); tick(4);
    const anywhere={x:-40,y:1,z:-40};
    ok(A.ok(anywhere)===true,'with no match running every patch is open');
    G.combo=0; G.comboT=0; const s0=G.score;
    X.award(30,'NO MATCH',anywhere,G.keas[0]);
    ok(G.score-s0===30,'and an act anywhere pays in full ('+(G.score-s0)+')'); }
  X.startGame(1); tick(6);
}

C.section('ROLE-AWARE REX - the ranger picks a side, and the cell changes hands');
// TODO 24. Piece 15 stopped the cage clock in co-op because your mate is the only way out. In a
// match your mate is the one who put you there, so the solo rules come back and the latch is locked.
// One predicate does the whole reversal, which is the return on having written it as one predicate.
{
  const V=X.VS, J=X.JAIL, RR=X.ROLEREX;
  X.startGame(2,{vs:true}); tick(6); park(); G.paused=false;
  const a=G.keas[0], b=G.keas[1];
  G.vs.roles={menace:0,management:1};
  const rex=G.humans.find(h=>h.key==='rex');
  ok(!!rex,'a ranger on the board');

  // ---- THE CELL IS A SOLO CELL AGAIN ----
  ok(J.coop()===false,'inside a match the co-op cell is off, even with two birds on the board');
  { a.caged=8; a._cagePrev=false; a.stun=0; G.squawk=null; tick(1);
    const t0=a.caged; tick(30);
    ok(a.caged<t0-0.4,'the sentence runs itself down again ('+t0.toFixed(2)+' -> '+a.caged.toFixed(2)+')');
    const m0=a.caged; tap(P1.grab); const mashed=m0-a.caged; tick(1);
    ok(mashed>0.4,'and mashing buys seconds again ('+mashed.toFixed(3)+')');
    ok(G.squawk===null,'with no squawk, because there is nobody friendly to hear it');
    const lt=G.inter.find(it=>it.kind==='peck'&&it.label==='PECK THE LATCH');
    ok(!!lt,'the latch is still on the board');
    ok(!!lt&&lt.locked()===true,'but it is LOCKED with a bird inside, which it never is outside a match');
    a.caged=0; tick(2); }

  // ---- AND IT GOES BACK when the match is over ----
  { X.startGame(2); tick(6);
    ok(J.coop()===true,'a plain two-player game is the co-op cell again');
    const lt=G.inter.find(it=>it.kind==='peck'&&it.label==='PECK THE LATCH');
    G.keas[0].caged=8; tick(2);
    ok(!!lt&&lt.locked()===false,'and the latch unlocks again with somebody inside');
    G.keas[0].caged=0; tick(2); }

  // ---- REX PICKS A SIDE ----
  X.startGame(2,{vs:true}); tick(6); park(); G.paused=false;
  const a2=G.keas[0], b2=G.keas[1];
  G.vs.roles={menace:0,management:1};
  const rex2=G.humans.find(h=>h.key==='rex');
  { rex2.x=0; rex2.z=0; rex2.stun=0;
    b2.x=1; b2.z=0; b2.y=0.25; b2.grounded=true;      // the MANAGEMENT is right next to him
    a2.x=9; a2.z=0; a2.y=0.25; a2.grounded=true;      // the MENACE is nine metres away
    G.wanted=0;
    ok(rex2.nearestKea(28)===b2,'below the warrant he takes the nearest bird, exactly as he always did');
    G.wanted=3;
    ok(rex2.nearestKea(28)===a2,'with a warrant out he walks past the management and hunts THE MENACE');
    G.vs.roles={menace:1,management:0};
    ok(rex2.nearestKea(28)===b2,'swap the roles and he swaps targets, so it is the ROLE and not the index');
    G.vs.roles={menace:0,management:1};
    ok(rex2.nearestKea(2)===null,'and range still applies - he does not hunt across the map ('+
       (rex2.nearestKea(2)?'found one':'nothing in 2m')+')'); }

  // ---- OUTSIDE A MATCH HE IS HIS OLD SELF ----
  { X.startGame(2); tick(6); park();
    const r=G.humans.find(h=>h.key==='rex'), x=G.keas[0], y=G.keas[1];
    r.x=0; r.z=0; y.x=1; y.z=0; y.y=0.25; y.grounded=true; x.x=9; x.z=0; x.y=0.25; x.grounded=true;
    G.wanted=3;
    ok(r.nearestKea(28)===y,'with no match running a warrant does not make him picky'); }

  // ---- A CAGING PAYS THE MANAGEMENT ----
  X.startGame(2,{vs:true}); tick(6); park(); G.paused=false;
  const a3=G.keas[0], b3=G.keas[1];
  G.vs.roles={menace:0,management:1};
  /* THE ARENA IS LEFT ON AND SET SOMEWHERE ELSE ON PURPOSE. The bonus is awarded with NO position
     because a caging is a match event and not a patch act, and this is where that claim is paid for:
     if it were scoped, the bonus would vanish whenever the ute was not in the arena. */
  G.vs.arena=(G.chapters||[]).find(c=>c!=='THE CARPARK')||null;
  { const rex3=G.humans.find(h=>h.key==='rex');
    a3.caged=0; b3.caged=0; a3.stun=0; b3.stun=0;
    if(a3.held){a3.held.heldBy=null;a3.held=null;} if(b3.held){b3.held.heldBy=null;b3.held=null;}
    a3.x=0; a3.z=31.5; b3.x=40; b3.z=40; G.wanted=3; G.wantedT=3.4;
    G.combo=0; G.comboT=0;
    const before=V.scores();
    const siege=k=>{ rex3.stun=0; rex3.launched=null; rex3.asleep=false; rex3.distracted=0;
      rex3.state='chase'; rex3.chaseKea=k; rex3.giveUpT=0; rex3.t=0;
      for(let i=0;i<40;i++){ G.combo=0; G.comboT=0; k.y=0.25; k.vy=0; k.grounded=true;
        rex3.x=k.x; rex3.z=k.z-0.3; X.update(1/60);
        if((k.caged||0)>0||rex3.state==='shoo')break; }
      return (k.caged||0)>0; };
    ok(siege(a3),'rex cages the menace');
    const after=V.scores();
    ok(after[1]-before[1]===RR.CAGE,'and the MANAGEMENT is paid the caging bonus ('+
       (after[1]-before[1])+' against '+RR.CAGE+')');
    ok(after[0]-before[0]===0,'while the menace is paid nothing for being caught ('+(after[0]-before[0])+')');
    ok(!!G.vs.arena&&G.vs.arena!=='THE CARPARK','and the arena was somewhere else the whole time ('+G.vs.arena+')');

    /* THE OTHER WAY ROUND PAYS NOTHING, and this is the assertion the first sabotage sweep was
       missing: caging anybody at all would have paid the management, and nothing here would have
       noticed, because the section only ever caged the menace. */
    a3.caged=0; b3.caged=0; a3.stun=0; b3.stun=0; tick(4);
    b3.x=0; b3.z=31.5; a3.x=40; a3.z=40; G.wanted=3; G.wantedT=3.4; G.combo=0; G.comboT=0;
    const pre=V.scores();
    ok(siege(b3),'rex cages the MANAGEMENT this time');
    const post=V.scores();
    ok(post[1]-pre[1]===0,'and nobody is paid a bonus for that ('+(post[1]-pre[1])+')');
    ok(post[0]-pre[0]===0,'least of all the menace ('+(post[0]-pre[0])+')'); }

  X.startGame(1); tick(6);
}

C.section('THE VERSUS HUD - two scores, two roles and a clock, down to 320px');
// TODO 25. Built the way piece 5 built the reflow: the layout is a set of FLAGS computed from the
// viewport width and the match state, and the DOM is left with nothing to decide. Nothing here
// measures an element, which is exactly why this whole section runs under node at any width.
{
  const VH=X.VSHUD, V=X.VS;
  ok(VH.W.wide===640&&VH.W.mid===420,'two named breakpoints ('+VH.W.wide+' / '+VH.W.mid+')');
  ok(VH.clock(0)==='0:00'&&VH.clock(59)==='0:59'&&VH.clock(60)==='1:00'&&VH.clock(305)==='5:05',
     'the clock formats minutes and seconds ('+[0,59,60,305].map(VH.clock).join(' ')+')');
  ok(VH.clock(-5)==='0:00','and never counts past zero into nonsense ('+VH.clock(-5)+')');

  // ---- no match, no scoreline ----
  X.startGame(2); tick(4);
  ok(VH.state(1280).on===false,'with no match running there is nothing to draw');
  X.hudReflow(320);
  ok(!!G.vsHud&&G.vsHud.on===false,'and the reflow says so at 320 too');

  // ---- a match, three bands ----
  X.startGame(2,{vs:true}); tick(4); G.vs.arena=null; G.paused=false;
  G.vs.roles={menace:0,management:1};
  const wide=VH.state(1280), mid=VH.state(500), narrow=VH.state(320);
  ok(wide.on&&mid.on&&narrow.on,'a running match draws at every width');
  ok(wide.band==='wide'&&mid.band==='mid'&&narrow.band==='narrow',
     'three bands off the two breakpoints ('+[wide.band,mid.band,narrow.band].join(', ')+')');
  ok(VH.state(640).band==='wide'&&VH.state(639).band==='mid','the wide breakpoint is where it says it is');
  ok(VH.state(420).band==='mid'&&VH.state(419).band==='narrow','and so is the mid one');

  /* EACH BAND DROPS THE LEAST USEFUL THING rather than shrinking everything. At 320 the scoreline IS
     the HUD: two numbers, a clock, and one letter each. */
  ok(wide.showLabels===true&&mid.showLabels===false&&narrow.showLabels===false,
     'labels survive only at wide');
  ok(wide.showRoleWords===true&&mid.showRoleWords===true&&narrow.showRoleWords===false,
     'role words survive down to mid and not below');
  ok(wide.names[0]==='MENACE'&&wide.names[1]==='MANAGEMENT','wide spells the roles out ('+wide.names.join(' / ')+')');
  ok(narrow.names[0]==='M'&&narrow.names[1]==='O','narrow gives each role one letter ('+narrow.names.join(' / ')+')');
  ok(narrow.narrow===true&&wide.narrow===false,'and the narrow flag is set for whoever reads it');

  // ---- it reports the MATCH scores, not the shared total ----
  { G.combo=0; G.comboT=0; X.award(40,'FOR THE HUD',null,G.keas[0]);
    const st=VH.state(1280);
    ok(st.scores[0]===V.scores()[0]&&st.scores[1]===V.scores()[1],
       'the scoreline carries the match scores ('+JSON.stringify(st.scores)+')');
    ok(st.scores[0]!==G.score,'which are not the shared total ('+st.scores[0]+' vs '+G.score+')');
    ok(st.lead===0,'and it names who is ahead ('+st.lead+')');
    G.combo=0; G.comboT=0; X.award(40,'AND FOR THEM',null,G.keas[1]);
    ok(VH.state(1280).lead===-1,'or that nobody is ('+VH.state(1280).lead+')'); }

  // ---- the clock counts the match down, and sudden death counts its own cap ----
  { G.vs.t=G.vs.len-65; const st=VH.state(1280);
    ok(st.clock==='1:05','the clock shows what is left of the match ('+st.clock+')');
    ok(st.sudden===false,'and knows it is not sudden death yet');
    G.vs.phase='sudden'; G.vs.sudden=20; G.vs.tieAt=V.scores().slice();
    const sd=VH.state(1280);
    ok(sd.sudden===true,'in sudden death it says so');
    ok(sd.clock==='0:40','and counts the CAP down instead of the match ('+sd.clock+')');
    G.vs.phase='play'; }

  /* THE VANTAGE-08 LAW. Piece 5 docks the TAB pill when the plate wraps or the viewport is narrow;
     a running match at 320 is one more reason, because the versus line owns that bottom edge. */
  { X.setPrompt(0,''); X.setPrompt(1,'');
    X.hudReflow(1280);
    ok(G.tabDocked===false,'wide and quiet, the pill sits where it always did');
    X.hudReflow(320);
    ok(G.vsHud.narrow===true&&G.tabDocked===true,'at 320 with a match on, the pill is docked out of the way');
    /* AND THE MATCH IS NOT WHY, which is worth asserting because the first version of this piece
       added a match term to tabDocked and no sabotage could break it: the versus HUD goes narrow
       below 420 and the plate docks the pill below 480, so the match condition was a strict subset
       and could never change the answer. It was removed. */
    ok(X.VSHUD.W.mid<480,'the versus narrow band sits inside the plate narrow band ('+X.VSHUD.W.mid+' < 480)');
    { const wasVs=G.vs; G.vs=null; X.hudReflow(320);
      ok(G.tabDocked===true,'so the pill docks at 320 with no match at all, for the reason it always did');
      G.vs=wasVs; X.hudReflow(320); }
    ok(G.hudVW===320,'and the reflow recorded the width it was asked about ('+G.hudVW+')'); }

  // ---- and it stops drawing when the match is over ----
  { V.end('time'); G.paused=false;
    ok(VH.state(1280).over===true,'a finished match reports itself over');
    X.startGame(1); tick(4);
    ok(VH.state(1280).on===false,'and a fresh solo run draws nothing at all'); }
}

C.section('THE CLUB SKI FIELD - the second map boots, and it is a map and not a stub');
/* TODO 39, and the first thing to say is what it is NOT: the GRADUATION is not here. Moving the
   carpark ski corner and its five missions up the mountain shifts every seeded draw after it and
   therefore re-pins all 25 baselines, and it takes five missions and a star page out of a live save.
   That is a judged call. What is here is purely additive - a new builder, a new registration, and
   three things that were globals pretending to be constants for as long as there was one map.
   THREE OWNERS, NOT THREE GUARDS, which is TODO 58 applied one layer up each time:
     the NEST SITE, because buildNest reads G.nestPos and the ski field setting its own would
       otherwise have moved the carpark nest up the hill on the next build,
     the SNOW ENVELOPE, because SNOWFIELD is the band the CARPARK draws patches from,
     and the CAST, which is the one that was a live throw: startGame pushed four humans with carpark
       coordinates in them and read G.ladder - set only by buildHut - with no guard at all. The
       batteries never saw it because an earlier carpark boot had always left G.ladder lying about.
       The section below deletes it and proves both halves.
   AND IT IS ALL READ HEADLESS, drifts included, which the carpark patches are not: those live inside
   a !HEADLESS branch and can only be trusted by looking at them. */
{
  const B=X.BIOME, S=X.SKI, T=X.TOUR;
  const ski=()=>B.ALL.skifield||{};
  const drift=i=>(G.snow||[])[i]||{};
  const col=id=>G.colliders.find(c=>c.kind==='box'&&Math.abs(c.x-id.x)<0.01&&Math.abs(c.z-id.z)<0.01)||{};
  try{
    // 1. THE REGISTRATION IS A DECLARATION, and every part of it is something a map cannot do without.
    ok(typeof ski().build==='function','the ski field carries its builder');
    ok(typeof ski().cast==='function','and its cast, so nobody elses furniture arrives with it');
    ok(!!ski().anchor,'and an anchor to establish it from');
    ok(!!ski().snow&&ski().snow===S.SNOW,'and the snow envelope it draws its drifts inside');
    ok(ski().label===T.TABLE[1].name,'with the label the brochure already promised ('+ski().label+')');

    // 2. IT BOOTS, IT STARTS, AND IT IS REALLY THAT MAP.
    let threw=null;
    try{ X.boot({biome:'skifield'}); X.startGame(1); tick(8); }catch(e){ threw=e&&e.message||String(e); }
    ok(!threw,'the ski field boots and starts a run without throwing ('+(threw||'no throw')+')');
    ok(G.biome==='skifield','and it is that map rather than a fallback ('+G.biome+')');

    /* 3. THE CAST. Nobody is on the hill yet and the registry says so on purpose - the club field
       crowd arrive with the missions in TODO 40. What matters here is that the carpark four do NOT
       arrive, because every one of them carries carpark coordinates. */
    ok(G.humans.length===0,'nobody is on the hill, because this map declares nobody ('+
       G.humans.map(h=>h.key).join(',')+')');

    /* AND THE THROW THAT USED TO BE THERE IS STILL A THROW FOR THE CODE THAT ASKED FOR IT. Give a
       map with no hut the CARPARK cast and startGame dies on G.ladder, exactly as it did in every
       biome without a hut before this piece. The ski field is safe because it owns its cast, not
       because anything anywhere got a guard. */
    { B.define('hutless',{label:'HUTLESS',build:()=>{},cast:B.ALL.carpark.cast});
      delete G.ladder;
      let lt=null;
      try{ X.boot({biome:'hutless'}); X.startGame(1); tick(2); }catch(e){ lt=e&&e.message||String(e); }
      ok(!!lt,'the carpark cast in a map with no hut still dies for the want of a ladder ('+(lt||'no throw')+')');
      delete B.ALL.hutless; }
    { delete G.ladder;
      let st=null;
      try{ X.boot({biome:'skifield'}); X.startGame(1); tick(8); }catch(e){ st=e&&e.message||String(e); }
      ok(!st,'while the ski field boots with no ladder in the world at all ('+(st||'no throw')+')');
      /* NULL RATHER THAN undefined SINCE TODO 62, and that is the stronger answer: the dispatcher
         actively clears it on the way in, so the ski field is not merely a map that never set a
         ladder, it is a map that could not inherit one. */
      ok(!G.ladder,'and it never inherited one either ('+String(G.ladder)+')'); }

    // 4. THE NEST IS THIS MAP NEST, and the carpark one is where it always was afterwards.
    ok(!!G.nestPos&&G.nestPos.x===S.NEST.x&&G.nestPos.z===S.NEST.z,
       'the nest site is the one the ski field declares ('+JSON.stringify(G.nestPos)+')');
    ok(!!G.nestG&&Math.abs(G.nestG.position.x-S.NEST.x)<0.01&&Math.abs(G.nestG.position.z-S.NEST.z)<0.01,
       'and the nest was actually built there ('+(G.nestG?G.nestG.position.x+','+G.nestG.position.z:'none')+')');

    /* 4b. NO ROAD, NO TRAFFIC. This is what a soak test found on the first build of this map: the
       lane numbers were the carpark road written into spawnTraffic, and updateTraffic runs whenever
       a run does, so thirty seconds up the mountain put seven hatchbacks across the snow at z 34.
       The lanes are a biome declaration now, and this drives the timer rather than waiting on it -
       if a car can be spawned here at all, it is a car in the wrong country. */
    { ok(X.TRAFFIC.of()===null,'the ski field declares no road ('+JSON.stringify(X.TRAFFIC.of())+')');
      ok(X.TRAFFIC.spawn(1)===null&&X.TRAFFIC.spawn(-1)===null,'so the spawner refuses both directions outright');
      G.trafT.a=0; G.trafT.b=0; tick(120);
      ok(G.cars.length===0,'and two seconds of the traffic timer puts nothing on the hill ('+
         G.cars.map(c=>c.x.toFixed(0)+','+c.z.toFixed(1)).join(' ')+')'); }

    /* 5. THE DIORAMA IS HELD TO ITS OWN DECLARATION, which is the only way a table of coordinates
       cannot drift from the world it describes - law 10, and the same contract the carpark anchor
       is under. */
    ok(S.TOW.top<S.TOW.base,'the tow runs uphill, which is the direction the map is built around ('+
       S.TOW.top+' above '+S.TOW.base+')');
    ok(S.TOW.towers.every(z=>z<S.TOW.base&&z>S.TOW.top),'and every tower stands between its two stations ('+
       S.TOW.towers.join(',')+')');
    { let desc=true; for(let i=1;i<S.TOW.towers.length;i++)if(S.TOW.towers[i]>=S.TOW.towers[i-1])desc=false;
      ok(desc,'in order up the hill rather than in a heap'); }
    ok(!!G.towWheel&&Math.abs(G.towWheel.position.x-S.TOW.x)<0.01&&Math.abs(G.towWheel.position.z-(S.TOW.base-2.0))<0.01,
       'the bull wheel is at the bottom station ('+(G.towWheel?G.towWheel.position.x+','+G.towWheel.position.z:'none')+')');
    ok(!!G.towWheel&&G.towWheel.position.y>2,'up where a bird has to fly to it ('+(G.towWheel?G.towWheel.position.y:0)+')');
    ok([S.PISTE.x0,S.PISTE.x1,S.PISTE.z0,S.PISTE.z1].every(v=>Math.abs(v)<=52),
       'the groomed band lies inside the play clamp, so the whole of it can be walked ('+
       [S.PISTE.x0,S.PISTE.x1,S.PISTE.z0,S.PISTE.z1].join(',')+')');
    { const c=col({x:S.LODGE.x,z:S.LODGE.z});
      ok(c.solid===true&&Math.abs(c.w-S.LODGE.w/2)<0.01&&Math.abs(c.d-S.LODGE.d/2)<0.01,
         'the lodge is a solid box the size the table says ('+c.w+' by '+c.d+')');
      ok(Math.abs((c.top||0)-(S.LODGE.h+0.4))<0.01,'standing on its piles ('+c.top+')'); }
    { const dz=S.LODGE.z+S.LODGE.d/2+S.LODGE.deck/2;
      ok(Math.abs(X.groundHeightAt(S.LODGE.x,dz,0.8)-0.71)<0.01,
         'the deck is somewhere a kea can stand ('+X.groundHeightAt(S.LODGE.x,dz,0.8)+')');
      ok(X.groundHeightAt(S.LODGE.x,S.LODGE.z,4.4)>S.LODGE.h,
         'and so is the lodge roof, because a kea will ('+X.groundHeightAt(S.LODGE.x,S.LODGE.z,4.4)+')'); }

    /* 6. THE GEAR ON THE RACKS, AND EVERY MISSION ID ON IT BELONGS TO THIS MAP. It carried no ids at
       all the night the diorama shipped and TODO 40 gave it this map own list, so the claim got
       stronger rather than weaker: whatever a prop up here asks for has to be something the ski
       field DECLARES. A prop answering a carpark mission is the lie TODO 55 was sent to fix. The ski
       boot is called a SKI BOOT for the same reason - a prop NAME is a detector in this engine, and
       anything called boot scores the carpark bonus the moment it is carried far enough. */
    { const n=nm=>G.props.filter(p=>p.name===nm).length;
      ok(n('ski')===5&&n('ski pole')===3&&n('ski goggles')===2&&n('ski boot')===1&&n('rubbish')===1,
         'the racks hold five skis, three poles, two goggles, a boot and a bit of litter ('+
         G.props.map(p=>p.name).join(', ')+')');
      ok(G.props.length===12,'twelve props and nothing else ('+G.props.length+')');
      { const claimed=p=>[p.mission,p.missionFar,p.missionProg].filter(Boolean);
        const stray=G.props.filter(p=>claimed(p).some(id=>!G.missions.some(m=>m.id===id)));
        ok(stray.length===0,'every mission a prop claims is one this map declares ('+
           (stray.length?stray.map(p=>p.name+'->'+claimed(p).join('/')).join(', '):'no strays')+')');
        ok(G.props.some(p=>claimed(p).length),'and some of them do claim one, which is TODO 40 ('+
           G.props.filter(p=>claimed(p).length).length+' of '+G.props.length+')'); }
      ok(G.props.every(p=>p.name!=='boot'),'nothing up here is called boot, which is a detector and not a name');
      ok(G.props.every(p=>!p.food&&!p.shiny),'nothing is food or shiny, so no counted economy is shadowed');
      ok(G.inter.length===G.props.length&&G.inter.every(it=>it.kind==='prop'),
         'every interactable on the map is one of those props ('+G.inter.length+')'); }

    /* 7. THE DRIFTS, AND THE UNBURY VERDICT AS LAW. Every drift up here is DELIBERATELY aimed at a
       wall, so the resolver does the work it was written for. The bound is read off how a drift is
       CONSTRUCTED rather than off a number one of them produced - law 15. */
    { const env=S.SNOW;
      ok(G.snow.length===16,'sixteen drifts are registered, headless included ('+G.snow.length+')');
      const buried=G.snow.filter(s=>!!X.snowBlocked(s.x,s.z,s.r,env));
      ok(buried.length===0,'not one of their hard discs sits on a structure, which is the unbury verdict ('+
         buried.length+' buried)');
      const near=s=>G.colliders.some(c=>c.kind==='box'&&c.top>0.2&&Math.min(c.w,c.d)>=X.SNOWBULK&&
        Math.hypot(Math.max(0,Math.abs(s.x-c.x)-c.w),Math.max(0,Math.abs(s.z-c.z)-c.d))<s.r+1.2);
      const touching=G.snow.filter(near);
      ok(touching.length>=8,'and the ones aimed at a building are still banked against it ('+
         touching.length+' of '+G.snow.length+' touching)');
      ok(touching.every(s=>s.slid>0&&s.slid<=3.3),
         'each having slid clear by a step or two rather than to somewhere else entirely ('+
         touching.map(s=>s.slid.toFixed(1)).join(',')+')');
      /* A POLE IS BANKED AGAINST, NOT SLID OFF - SNOWBULK, and the six tower drifts are the case it
         was written for. Nothing moved them, because nothing up there is broad enough to be a
         structure. */
      const towerD=G.snow.filter(s=>s.at==='tower');
      ok(towerD.length===S.TOW.towers.length&&towerD.every(s=>s.slid===0),
         'and the drift at the foot of every tower never moved at all, because a pole is banked against ('+
         towerD.map(s=>s.slid).join(',')+')');
      ok(G.snow.every(s=>!s.stuck),'no drift ran out of places to go ('+G.snow.filter(s=>s.stuck).length+' stuck)'); }

    /* 8. THE ENVELOPE IS THE ONLY THING ABOUT THE VERDICT THAT MOVED, and this is the assertion that
       says so: the same point is off the map for the carpark band and on it for a ski field. */
    { const off=X.snowBlocked(0,0,2), on=X.snowBlocked(0,0,2,S.SNOW);
      ok(!!off&&off.offmap===true,'the middle of the map is outside the CARPARK snow band ('+JSON.stringify(off)+')');
      ok(on===null||!on.offmap,'and inside the ski field one, because up here it is snow edge to edge'); }

    /* 9. THE SNOWLINE IS AT THE BOTTOM OF THE MAP, and this is the sign of the plane rotation read
       back off the geometry rather than trusted to a comment. The plane is built in XY and laid down
       by the minus-90 rotation, so local y is world MINUS z: get it backwards and there is bush above
       the peaks. */
    { const gd=G.skiGround, pp=gd&&gd.geometry.attributes.position, cc=gd&&gd.geometry.attributes.color;
      const at=(xw,zw)=>{ if(!pp)return null; let best=-1,bi=0;
        for(let i=0;i<pp.count;i++){ const d=Math.hypot(pp.getX(i)-xw,-pp.getY(i)-zw); if(best<0||d<best){best=d;bi=i;} }
        return {r:cc.getX(bi),g:cc.getY(bi),b:cc.getZ(bi)}; };
      const bot=at(0,45), top=at(0,-45);
      ok(!!bot&&!!top,'the ground carries vertex colours to read');
      ok(!!top&&top.b>0.9,'the top of the map is snow ('+(top?top.b.toFixed(3):'none')+' blue)');
      ok(!!bot&&!!top&&bot.b<top.b-0.3,'and the bottom of it is tussock, which is where a snowline goes ('+
         (bot?bot.b.toFixed(3):'none')+' vs '+(top?top.b.toFixed(3):'none')+')'); }

    /* 10. THE ANCHOR, UNDER THE SAME CONTRACT THE CARPARK ONE IS. A table cannot drift from the
       world if the world is what it is asserted against. */
    { const a=X.TRAVEL.anchor('skifield');
      ok(!!a&&['x','y','z','lx','ly','lz'].every(k=>typeof a[k]==='number'),'the ski field anchor is six numbers');
      let sx=0,sz=0; for(const pr of G.props){ sx+=pr.x; sz+=pr.z; }
      const cx=sx/G.props.length, cz=sz/G.props.length;
      ok(!!a&&Math.hypot(a.lx-cx,a.lz-cz)<24,'looking at the map the builder actually built ('+
         (a?Math.hypot(a.lx-cx,a.lz-cz).toFixed(1):'none')+' from '+cx.toFixed(1)+','+cz.toFixed(1)+')');
      ok(!!a&&a.y>X.groundHeightAt(a.x,a.z,a.y)+6,'from well above the ground at its own feet ('+(a?a.y:0)+')');
      ok(!!a&&a.y>a.ly,'looking down at the map rather than up out of it'); }

    /* 11. ONE BUILD, ONE WORLD - INCLUDING THE SNOW. G.snow was the last thing a build put on the
       board that the dispatcher never took back off it: invisible under node, where the carpark
       patches are not built at all, and two maps worth of drifts in the browser. TODO 48 for snow. */
    { const one=G.snow.length;
      X.boot({biome:'carpark'});
      ok(G.snow.length===0,'the carpark takes the ski field drifts off the board on its way in ('+G.snow.length+')');
      X.boot({biome:'skifield'});
      ok(G.snow.length===one,'and coming back leaves one map worth of them rather than two ('+G.snow.length+')'); }

    // 12. AND THE CARPARK IS EXACTLY WHERE IT WAS LEFT, which is the whole additive claim.
    X.boot({biome:'carpark'});
    ok(G.props.length===BOOTCOUNTS.props,'the carpark still builds its own props after a trip up the hill ('+
       G.props.length+' vs '+BOOTCOUNTS.props+')');
    X.startGame(1); tick(8);
    ok(G.props.length===BOOTCOUNTS.props+1,
       'and its cast still puts the sleeping tramper beanie out on top of them ('+G.props.length+')');
    ok((G.hints||[]).length===9,'and its nine hints ('+(G.hints||[]).length+')');
    ok(G.nestPos.x===-4&&G.nestPos.z===-33,'its nest is back at the carpark site ('+JSON.stringify(G.nestPos)+')');
    ok(!!G.nestG&&Math.abs(G.nestG.position.x+4)<0.01&&Math.abs(G.nestG.position.z+33)<0.01,
       'and built there, which is what would have gone wrong if the ski field had kept the global ('+
       (G.nestG?G.nestG.position.x+','+G.nestG.position.z:'none')+')');
    ok(G.humans.map(h=>h.key).join(',')==='trish,tom,dave,rex','the carpark four are back on the job ('+
       G.humans.map(h=>h.key).join(',')+')');
    ok(!!G.ladder,'and Dave has his ladder again ('+JSON.stringify(G.ladder)+')');
    { const RD=X.TRAFFIC.of();
      ok(!!RD&&RD.up===32.2&&RD.down===35.8,'the carpark still declares the road it has always had ('+
         JSON.stringify(RD)+')');
      G.trafT.a=0; G.trafT.b=0; tick(6);
      const traf=G.cars.filter(c=>c.traffic);
      ok(traf.length>0&&traf.every(c=>Math.abs(c.z-34)<2.5),
         'and its morning traffic still arrives on it ('+traf.map(c=>c.z.toFixed(1)).join(',')+')'); }
  } finally {
    delete B.ALL.hutless;
    X.boot(); X.startGame(1); tick(6);
  }
  ok(biomesRestored(),'the section leaves the real maps registered ('+
     Object.keys(X.BIOME.ALL).join(',')+')');
}

C.section('THE CLUB FIELD TO-DO LIST - the second map stops handing out carpark jobs');
/* TODO 40. TODO 39 shipped a map and left one lie standing on it, said out loud in that log entry:
   defineMissions was one hardcoded carpark list, so the ski field opened with eight pages about a
   campervan, a hut and a road - none of them on the mountain, none of them finishable there. Same
   class as the cage hint in 55 and the carpark teaching in 58, and the same fix a third time: the
   list is declared beside the builder.
   THREE THINGS IN THE ENGINE HAD THE CARPARK WRITTEN INTO THEM, and each one is a throw or a dead
   end for the second list rather than a matter of taste:
     missionDone unlocked the mission whose id is literally apex, with no guard, in the one code path
       a player reaches once - so the first map without an apex would have thrown on its last job;
     checkFinale WAS the carpark sentence - four humans in pursuit, then home to the nest - which a
       map with nobody on it can never satisfy, so arm() and check() are declared with the mission;
     checkMisc was a run of carpark detectors behind a carpark guard, so a mission may now carry its
       own check() and the ski field four are all about PLACE.
   AND THE PROOF THAT MATTERS MOST IS THE NEGATIVE ONE: not one job on either map can be finished on
   the other. */
{
  const B=X.BIOME, S=X.SKI, ST=X.STARS;
  const M2=id=>(G.missions||[]).find(m=>m.id===id)||{};      // law 14: never read .done off a find
  const hold=(x,z,y,n)=>{ const k=kq(); for(let i=0;i<(n||6);i++){ k.x=x;k.z=z;k.y=y;k.vy=0;k.grounded=true; X.update(1/60); } };
  try{
    X.SAVE.wipe&&X.SAVE.wipe();
    X.boot({biome:'skifield'}); X.startGame(1); tick(8); park();

    // 1. THE LIST IS THIS MAP LIST, and the pages are its own.
    ok(JSON.stringify(G.chapters)==='["THE ROPE TOW","THE DAY LODGE"]',
       'the ski field opens on its own two pages ('+JSON.stringify(G.chapters)+')');
    ok(G.missions.length===9,'nine jobs including the finale ('+G.missions.length+')');
    ok(ST.rows(G.chapters[0]).length===4&&ST.rows(G.chapters[1]).length===4,
       'four rows on each page ('+ST.rows(G.chapters[0]).length+' and '+ST.rows(G.chapters[1]).length+')');
    ok(G.missions.filter(m=>m.finale).length===1,'exactly one finale ('+
       G.missions.filter(m=>m.finale).map(m=>m.id).join(',')+')');
    ok(!G.missions.some(m=>m.bonus),'and no bonus page, because this map has not earned one yet');

    /* 2. NOT ONE CARPARK JOB IS ON THE HILL, which is the lie this piece exists to remove. Read
       against the carpark list itself rather than against a list of ids typed in here, so a mission
       added to either map tomorrow is covered by the same assertion. */
    const skiIds=G.missions.map(m=>m.id);
    X.boot({biome:'carpark'}); X.startGame(1); tick(6);
    const cpIds=G.missions.map(m=>m.id);
    const overlap=skiIds.filter(id=>cpIds.indexOf(id)>=0);
    ok(overlap.length===0,'no id appears on both maps ('+(overlap.join(',')||'none')+')');
    ok(cpIds.indexOf('s_ski')>=0&&skiIds.indexOf('s_ski')<0,
       'the carpark keeps its own ski corner jobs and the ski field is not handed them ('+
       cpIds.filter(i=>i.charAt(0)==='s'&&i.charAt(1)==='_').join(',')+')');
    ok(cpIds.length===43&&G.chapters.length===8,
       'and the carpark list is exactly what it always was ('+cpIds.length+' jobs, '+G.chapters.length+' pages)');

    // 3. EVERY JOB ON THE HILL IS DRIVEN, by the verbs a player has.
    X.boot({biome:'skifield'}); X.startGame(1); tick(8); park();
    { for(let i=0;i<3;i++){ const p=takeProp('ski pole');
        if(p)dropAt(kq().x+1.2+i,0.3,kq().z+1.2); tick(2); }
      ok(M2('k_poles').done===true,'three poles redistributed ('+(M2('k_poles').n||0)+' of 3)'); }
    { const g=takeProp('ski goggles');
      ok(!!g&&M2('k_goggles').done===true,'the goggles are taken and WORN, which is what the row asks ('+
         (g?g.name:'none')+')'); }
    { const b=G.props.find(p=>p.name==='ski boot');
      if(b){ perchAt(b.x,b.z,0.3); tap(P1.grab); tick(2);
        dropAt(b.home.x+16,0.3,b.home.z+2); tick(4); }
      ok(M2('k_boot').done===true,'the boot is lost, thoroughly ('+
         (b?Math.hypot(b.x-b.home.x,b.z-b.home.z).toFixed(1):'none')+' from home, needs 12)'); }
    { hold(G.towWheel.position.x,G.towWheel.position.z,G.towWheel.position.y,8);
      ok(M2('k_wheel').done===true,'the bull wheel is perched'); }
    { hold(S.TOW.x,S.TOW.base,2.2,8);
      ok(M2('k_shed').done===true,'the engine shed roof is supervised from'); }
    { hold(S.LODGE.x,S.LODGE.z,3.6,8);
      ok(M2('k_roof').done===true,'and the lodge roof is stood on'); }
    { const p=G.props.find(pp=>pp.name==='ski'&&!pp.heldBy&&!pp.banked);
      if(p){ perchAt(p.x,p.z,Math.max(0.3,p.y)); tap(P1.grab); tick(2);
        dropAt((S.PISTE.x0+S.PISTE.x1)/2,0.3,10); tick(4); }
      ok(M2('k_ski').done===true,'and a ski is out on the groomed band ('+
         (p?p.x.toFixed(1)+','+p.z.toFixed(1):'none')+')'); }
    { let n=0;
      for(const nm of ['ski pole','ski goggles','ski']){
        for(let i=0;i<2&&n<3;i++){ const p=takeProp(nm); if(!p)break;
          dropAt(G.nestPos.x,G.nestY+0.1,G.nestPos.z); tick(6);
          if(p.banked)n++; } }
      ok(M2('k_stash').done===true,'and the nest is furnished with three pieces of other people kit ('+
         G.props.filter(p=>p.banked).length+' banked)'); }

    /* 4. THE FINALE. It is locked while the list is open, live the moment it closes - this map
       declares no arming, because there is nobody on it to make anything happen first - and it is
       won at the top station and nowhere else. */
    ok(G.finaleOn===true,'the list closed, so the finale is on');
    ok(M2('k_summit').locked===false,'and the summit is unlocked ('+M2('k_summit').locked+')');
    ok(G.won===false,'nothing is won yet, because nobody has been up there');
    hold(S.TOW.x,S.TOW.base,2.2,4);
    ok(G.won===false,'and standing at the BOTTOM station is not the top one');
    hold(S.TOW.x,S.TOW.top,3.2,10);
    ok(G.won===true,'perching the top station wins the map');
    ok(M2('k_summit').done===true,'and the finale row is ticked, by flag and not by the name apex');

    /* 5. THE STARS LAND ON THIS MAP PAGES, which is the collision the save slots were built for -
       and until tonight it could only be tested with two maps sharing one page list. */
    ok(ST.rec(G.chapters[0]).cleared===true&&ST.rec(G.chapters[1]).cleared===true,
       'both ski field pages are cleared ('+ST.pips(G.chapters[0])+' and '+ST.pips(G.chapters[1])+')');
    X.SAVE.write();
    { const blob=X.SAVE.migrate(X.SAVE.load())||{biomes:{}};
      const slot=(blob.biomes||{}).skifield||{};
      const areas=slot.areas||[];
      ok(areas.length===2&&areas[0]==='THE ROPE TOW',
         'the save slot for this map lists ITS pages ('+areas.join(' | ')+')');
      ok(!!(slot.stars||{})['THE ROPE TOW'],'and its stars are keyed by them');
      ok(!((blob.biomes||{}).carpark),'while the carpark slot is untouched, because nothing happened there ('+
         Object.keys(blob.biomes||{}).join(',')+')'); }
    { const m=X.TOUR.model();
      ok(m.pins[1].pages===2&&m.pins[1].of===2*ST.KINDS.length,
         'and the brochure reads the ski field denominator off its own page count ('+
         m.pins[1].stars+' of '+m.pins[1].of+')'); }

    /* 6. THE TEACHING IS GATED THE WAY PIECE 55 GATED IT. Four hints, and the summit one says
       nothing at all until the finale unlocks - which is the mission gate doing exactly what it was
       kept for, on a hint that would otherwise spoil the end of the map. */
    { const mids=(G.hints||[]).map(h=>h.mid);
      ok(mids.length===4&&mids.indexOf('k_wheel')>=0&&mids.indexOf('k_summit')>=0,
         'the ski field puts four hints on the board ('+mids.join(',')+')');
      ok(mids.every(id=>G.missions.some(m=>m.id===id)),'every one of them names a job this map has');
      /* THE SAVE HAS TO GO FIRST, and this cost a finding before it was an assertion: the write
         above banked a FINISHED map, so the next boot hydrated every job as done and every hint went
         quiet - which is the mission gate working exactly as designed and my own test reading it as
         a failure. FLAKES law 1 with the save on top of it. */
      X.SAVE.wipe&&X.SAVE.wipe();
      X.boot({biome:'skifield'}); X.startGame(1); tick(8); park();
      ok(G.missions.every(m=>!m.done),'a wiped save opens the list unfinished again ('+
         G.missions.filter(m=>m.done).length+' done)');
      const k=kq();
      X.setPrompt(0,''); hold(S.TOW.x,S.TOW.top+1.2,0.3,4); X.HINTS.scan(k);
      ok(G.hintNow[0]===null,'standing at the top station teaches nothing while the summit is locked ('+
         G.hintNow[0]+')');
      X.setPrompt(0,''); hold(G.towWheel.position.x,G.towWheel.position.z+2,0.3,4); X.HINTS.scan(k);
      ok(G.hintNow[0]==='k_wheel','while the wheel hint speaks, because that job is open ('+G.hintNow[0]+')');
      for(const m of G.missions)if(!m.finale&&!m.done)X.done(m.id);
      tick(4);
      X.setPrompt(0,''); hold(S.TOW.x,S.TOW.top+1.2,0.3,4); X.HINTS.scan(k);
      ok(G.hintNow[0]==='k_summit','and the summit hint speaks the moment the list is done ('+G.hintNow[0]+')'); }

    /* 7. THE COOP BADGE IS A COOP BADGE, and the assertion is that one bird cannot do it: the roof
       is the same roof, and it takes two. */
    X.boot({biome:'skifield'}); X.startGame(2); tick(8); park();
    { ok(M2('k_duet').coop===true,'two-bird runs get a coop row on the lodge page ('+M2('k_duet').label+')');
      const a=G.keas[0], b=G.keas[1];
      for(let i=0;i<8;i++){ a.x=S.LODGE.x; a.z=S.LODGE.z; a.y=3.6; a.vy=0;
        b.x=-49; b.z=-49; b.y=0; X.update(1/60); }
      ok(M2('k_duet').done!==true,'one bird on the roof is not a duet');
      for(let i=0;i<8;i++){ for(const kk of [a,b]){ kk.x=S.LODGE.x+(kk===a?-1:1); kk.z=S.LODGE.z; kk.y=3.6; kk.vy=0; } X.update(1/60); }
      ok(M2('k_duet').done===true,'both beaks up there is'); }
  } finally {
    /* NAME THE BIOME ON THE WAY OUT. A plain X.boot() does NOT go home: buildWorld falls back to
       G.biome before the default, so a bare boot after this section stays on the mountain and every
       section after it would have run up there. */
    X.SAVE.wipe&&X.SAVE.wipe();
    X.boot({biome:'carpark'}); X.startGame(1); tick(6);
  }
  ok(G.biome==='carpark'&&G.chapters.length===8,'the section hands the carpark back its own list ('+
     G.biome+', '+G.chapters.length+' pages)');
}

C.section('A BUILD TAKES ITS HANDLES BACK OFF THE BOARD - the last thing the dispatcher missed');
/* TODO 62, found in session 11 by the piece 39 sabotage sweep rather than by a brief. WORLDREGS
   covered every LIST a build fills; it did not cover the HANDLES - one object per thing a map has
   exactly one of - so after a carpark boot every one of them still pointed at a mesh in a scene that
   had already been thrown away, and the ski field ran with the CARPARK tow wheel on G.
   THE TRANSCRIPT THAT FOUND IT is the one worth keeping: with G.towWheel=wheel deleted from the ski
   field builder, this battery reported the wheel at -37.9,-40 FROM INSIDE THE SKI FIELD. That is the
   carpark wheel, still being spun by update every frame, and still able to answer a proximity
   detector at coordinates in a country that was not loaded.
   IT IS ALSO HOW THE CAST BUG HID FOR TWO SESSIONS: a stale G.ladder made a hutless boot look
   perfectly safe in every battery, because Dave found the LAST map ladder and climbed that.
   THE AUDIT IS THE OTHER HALF OF THE PIECE. Every handle was read reader by reader first, and every
   cross-map reader was already behind a truthiness guard or inside an interactable its own builder
   registered - so the sweep needed no new guards, and the soak below is what proves that claim
   rather than the reading of it. */
{
  const B=X.BIOME, HS=X.WORLDHANDLES, LS=X.WORLDLISTS, FL=X.WORLDFLAGS;
  try{
    // 1. THE CARPARK FILLS THEM, which is what makes the sweep worth doing at all.
    X.boot({biome:'carpark'}); X.startGame(1); tick(8); park();
    const filled=HS.filter(h=>!!G[h]);
    ok(filled.length>=12,'a carpark build hangs a dozen handles on G ('+filled.length+' of '+HS.length+': '+
       filled.join(',')+')');
    ok(LS.every(l=>Array.isArray(G[l])&&G[l].length>0),'and fills its three lists ('+
       LS.map(l=>l+':'+(G[l]||[]).length).join(' ')+')');
    ok(!!G.towWheel&&Math.abs(G.towWheel.position.x-(-37.9))<0.2,
       'including the carpark tow wheel, at the ski corner where it is built ('+
       (G.towWheel?G.towWheel.position.x.toFixed(1)+','+G.towWheel.position.z.toFixed(1):'none')+')');

    /* 2. AND A BIOME THAT DOES NOT BUILD A THING DOES NOT HAVE IT. The bare-ground biome is the
       sharpest form of the question - not a map missing one hut, a map with nothing at all - and it
       is the same stand-in TODO 58 used for the hints. */
    B.define('bareground',{label:'BARE GROUND',build:()=>{}});
    X.boot({biome:'bareground'});
    const kept=HS.filter(h=>!!G[h]);
    ok(kept.length===0,'a build with nothing in it leaves not one handle standing ('+
       (kept.join(',')||'none')+')');
    ok(LS.every(l=>Array.isArray(G[l])&&G[l].length===0),
       'the lists are EMPTIED rather than nulled, so anything counting them reads nothing ('+
       LS.map(l=>l+':'+JSON.stringify(G[l])).join(' ')+')');
    for(const k in FL)ok(G[k]===FL[k],'and the latch G.'+k+' is back to its own default ('+G[k]+')');

    /* 3. THE ONES DELIBERATELY LEFT ALONE, asserted so that the exceptions are a decision rather
       than an oversight. G.nestPos has unguarded readers by design - the finale and the bank check
       read it every frame - so nulling it would trade a stale value for a throw. */
    ok(!!G.nestPos&&typeof G.nestPos.x==='number',
       'G.nestPos survives the sweep on purpose, because every map declares one ('+
       JSON.stringify(G.nestPos)+')');
    ok(HS.indexOf('nestPos')<0&&LS.indexOf('nestPos')<0,'and it is not on either list');
    ok(HS.indexOf('nestStash')<0,'nor is the stash count, which is the player and not the map');

    /* 4. NOTHING THROWS FOR THE WANT OF ANY OF THEM, which is the claim the reader audit makes and
       this is the test of it: a whole minute of a real run, in both modes, with the night driver
       going and the traffic timer wound to zero, on a map with no fire, no bin, no ute, no hut and
       no cast. */
    { let threw=null;
      try{ X.startGame(1); for(let i=0;i<1800;i++){ if(i===600){G.night=true;G.nightManual=true;}
             if(i===1200){G.trafT.a=0;G.trafT.b=0;} X.update(1/60); } }
      catch(e){ threw=(e&&e.message||String(e))+' @ '+String(e&&e.stack).split('\n')[1]; }
      ok(!threw,'thirty seconds of a solo run on bare ground throws nothing ('+(threw||'no throw')+')');
      let threw2=null;
      try{ X.startGame(2); for(let i=0;i<900;i++)X.update(1/60);
           X.VS.start({len:'short'}); for(let i=0;i<900;i++)X.update(1/60); }
      catch(e){ threw2=(e&&e.message||String(e))+' @ '+String(e&&e.stack).split('\n')[1]; }
      ok(!threw2,'and a two-bird run with a match on it throws nothing either ('+(threw2||'no throw')+')'); }

    // 5. THE SKI FIELD BRINGS ITS OWN, and the wheel is the one that proves the point.
    X.boot({biome:'skifield'}); X.startGame(1); tick(8);
    ok(!!G.towWheel&&Math.abs(G.towWheel.position.x-X.SKI.TOW.x)<0.01,
       'the ski field wheel is the ski field one ('+
       (G.towWheel?G.towWheel.position.x.toFixed(1)+','+G.towWheel.position.z.toFixed(1):'none')+')');
    ok(!G.ladder&&!G.fire&&!G.bin&&!G.uteG&&!G.snowCap,
       'and it has no ladder, fire, bin, ute or roof snow, because it builds none of them ('+
       ['ladder','fire','bin','uteG','snowCap'].filter(h=>!!G[h]).join(',')+' present)');
    ok((G.gravel||[]).length===0&&(G.stones||[]).length===0&&(G.wear||[]).length===0,
       'the carpark grit, stones and desire paths did not come up the hill with us');

    // 6. AND THE CARPARK GETS ALL OF IT BACK, because a sweep that loses something is worse.
    X.boot({biome:'carpark'}); X.startGame(1); tick(8);
    const back=HS.filter(h=>!!G[h]);
    ok(back.length===filled.length&&back.join(',')===filled.join(','),
       'coming back rebuilds exactly the handles it had ('+back.length+' vs '+filled.length+')');
    ok(!!G.towWheel&&Math.abs(G.towWheel.position.x-(-37.9))<0.2,
       'the wheel is the carpark one again ('+(G.towWheel?G.towWheel.position.x.toFixed(1):'none')+')');
    ok(LS.every(l=>(G[l]||[]).length>0),'and its three lists are full again ('+
       LS.map(l=>l+':'+(G[l]||[]).length).join(' ')+')');
  } finally {
    delete B.ALL.bareground;
    X.boot({biome:'carpark'}); X.startGame(1); tick(6);
  }
  ok(biomesRestored(),'and the stand-in is out of the registry ('+
     Object.keys(X.BIOME.ALL).join(',')+')');
}

C.section('A RAIL IS A SURFACE - the rack, the boot rail and the clothesline hold what is put on them');
/* TODO 63, and it is OPPORTUNITIES Tier 3 item 2, which says in as many words that it bit that pass
   twice: PROPS REST WHERE PLACED, no rail or rack or line holds anything, props fall every time.
   MEASURED BEFORE THE FIX: twelve of the carpark twenty-two props were on the ground inside three
   seconds - two skis and two poles off the rack, both walking poles off the boot rail, all three
   clothes pegs off the line, the goggles, the sock, the beanie. The pegs are the sharpest: the
   mission says steal all three clothes PEGS and every one of them was lying in the dirt.
   THE ANSWER WAS ALREADY IN THE PHYSICS. A prop falls until groundHeightAt gives it something to
   stand on, and it has consulted the colliders since the day it was written - the sandwich has
   rested on the picnic table for weeks because that table has a collider. The rails did not. So this
   is a collider pass and not a new rule: railTop declares the top of a thing you can rest something
   on, never solid, because a rail is something a kea perches and walks over rather than something
   that stops it.
   AND THE PROPS THAT SIT ON ONE ARE PLACED AT THEIR RESTING HEIGHT, so nothing pops upward on the
   first frame - which is the difference between resting where it was placed and merely being caught. */
{
  const restY=p=>X.groundHeightAt(p.x,p.z,p.y+0.3)+0.08;   // what the physics will settle it at
  const settle=n=>{ for(let i=0;i<(n||180);i++)X.update(1/60); };
  try{
    X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();
    const at1=G.props.map(p=>({name:p.name,y:p.y,home:p.home.y}));
    settle(180);

    /* 1. NOTHING MOVES, which is the whole claim. A prop is allowed to be ON THE GROUND by design -
       the goggles are dropped at the rack, the sock blew off the rail hours ago - so the assertion
       is about props that were placed ABOVE the ground, and it names the ones that fall. */
    /* THE BEANIE IS EXCLUDED BY NAME, AND IT IS A FINDING RATHER THAN AN EXEMPTION (TODO 64). It is
       placed at head height on the sleeping tramper, and a person is not a surface: there is nothing
       under it to rest on, so it falls into the dirt beside him while the row says steal the beanie
       off the sleeping tramper HEAD. Fixing it means a prop that rides a thing that moves, which is
       a different mechanic from a prop that rests on a thing that does not, and it needs a design
       answer rather than a collider. */
    { const high=G.props.filter((p,i)=>at1[i].home>0.5&&!p.heldBy&&!p.banked&&p.name.indexOf('beanie')<0);
      const fell=high.filter(p=>p.y<p.home.y-0.05);
      ok(high.length>=9,'the carpark places at least nine props up on something ('+high.length+': '+
         [...new Set(high.map(p=>p.name))].join(', ')+')');
      ok(fell.length===0,'and after three seconds not one of them has fallen off it ('+
         (fell.map(p=>p.name+' '+p.home.y.toFixed(2)+'->'+p.y.toFixed(2)).join(', ')||'none')+')'); }

    /* 2. AND THEY REST WHERE THEY WERE PLACED, not merely somewhere above the dirt: the settled
       height is what the physics resolves under them, to the centimetre. */
    { const off=G.props.filter(p=>!p.heldBy&&!p.banked&&Math.abs(p.y-restY(p))>0.02);
      ok(off.length===0,'every prop sits exactly where the ground under it puts it ('+
         (off.map(p=>p.name+' '+p.y.toFixed(2)+' vs '+restY(p).toFixed(2)).join(', ')||'none')+')'); }

    // 3. THE THREE SURFACES, ONE AT A TIME, held to the props they were built to hold.
    { const pegs=G.props.filter(p=>p.name==='clothes peg');
      ok(pegs.length===3&&pegs.every(p=>p.y>1.4),'all three pegs are up on the line ('+
         pegs.map(p=>p.y.toFixed(2)).join(',')+')');
      const skis=G.props.filter(p=>p.name==='ski');
      ok(skis.length===2&&skis.every(p=>p.y>0.9),'both skis are up on the rack ('+
         skis.map(p=>p.y.toFixed(2)).join(',')+')');
      const wp=G.props.filter(p=>p.name==='walking pole');
      ok(wp.length===2&&wp.every(p=>p.y>0.7),'both walking poles are up on the boot rail ('+
         wp.map(p=>p.y.toFixed(2)).join(',')+')'); }

    /* 4. A RAIL IS NOT A WALL. It is not solid, so a bird at ground level walks straight under it
       and is never pushed sideways by it, and it does not step UP onto it from the ground either -
       groundHeightAt only offers a top to something already within reach of it. */
    /* THE RAIL IS FOUND BY WHERE IT IS, not by the property under test. Written the other way -
       find(...&&!c.solid) - a sabotage that made rails solid returned nothing, the guard below
       skipped every behavioural assertion, and the finding read as a missing collider rather than a
       wall in the middle of the ski corner. Law 14 in its other form: do not let the thing being
       asserted decide whether the assertion runs. */
    { const k=kq(); const rail=G.colliders.find(c=>c.kind==='box'&&c.top>0.9&&c.top<1.0&&
        Math.abs(c.x+40.4)<0.2&&Math.abs(c.z+38.1)<0.2);
      ok(!!rail,'the ski rack rail is a collider now ('+
         (rail?rail.w+' x '+rail.d+' top '+rail.top:'none')+')');
      ok(!!rail&&rail.solid===false,'and not a solid one, because a rail is perched and not bumped into ('+
         (rail?String(rail.solid):'no rail')+')');
      if(rail){
        k.x=rail.x; k.z=rail.z; k.y=0; k.vy=0; k.grounded=true; tick(4);
        ok(Math.abs(k.x-rail.x)<0.02&&Math.abs(k.z-rail.z)<0.02,
           'a bird on the ground stands under it without being shoved ('+k.x.toFixed(2)+','+k.z.toFixed(2)+')');
        /* AND IT LIFTS A BIRD THAT WALKS INTO IT, which is the engine step-up rule and not a defect
           of this piece: groundHeightAt offers any top within 0.55 of what is asking, the bird asks
           with its beak at y plus 0.4, and every low surface in the game already behaves this way -
           the picnic table at 0.85 is the same class. A kea that hops onto a ski rack is right. */
        ok(Math.abs(k.y-rail.top)<0.01,'and a bird that walks into it steps up onto it, the way it does onto the picnic table ('+
           k.y.toFixed(2)+' vs top '+rail.top+')');
        ok(rail.top<0.4+0.55,'which is the step-up rule and not a special case ('+rail.top+' under 0.95)');
        ok(Math.abs(X.groundHeightAt(rail.x,rail.z,rail.top+0.2)-rail.top)<0.001,
           'while a bird already up at rail height is offered the rail to stand on ('+
           X.groundHeightAt(rail.x,rail.z,rail.top+0.2)+')'); } }

    /* 5. THE REGRESSION THIS PIECE CAUSED AND FIXED, pinned so it cannot come back. interact()
       measures from the beak - y plus 0.4 - so raising the skis onto the rail put one 0.395 from the
       beak against the CHEW THE BINDING tear at 0.41, and holding the key at the binding picked up a
       ski instead. The skis moved half a ski width apart. A single tap at the tear must not put
       anything in the beak. */
    { const t=G.inter.find(it=>it.kind==='tear'&&!it.done&&it.label&&it.label.includes('BINDING'));
      ok(!!t,'the binding tear is still there');
      if(t){ const q=t.getPos(), k=kq();
        if(k.held){k.held.heldBy=null;k.held=null;}
        const yy=Math.max(q.y,X.groundHeightAt(q.x,q.z,3)+0.02);
        for(let i=0;i<3;i++){ k.x=q.x;k.z=q.z;k.y=yy;k.vy=0;k.grounded=true; X.update(1/60); }
        /* HELD, NOT TAPPED: a tear takes a hold, and its progress decays the moment nothing is
           tugging it - so a tap would read zero on a tear that is working perfectly. */
        hold(P1.grab);
        for(let i=0;i<8;i++){ k.x=q.x;k.z=q.z;k.y=yy;k.vy=0;k.grounded=true; X.update(1/60); }
        const prog=t.progress, heldName=k.held?k.held.name:null;
        un(P1.grab); tick(2);
        ok(!heldName,'standing at the binding, the grab goes to the tear and not to a ski ('+
           (heldName||'nothing held')+')');
        ok(prog>0,'and the tug lands on it ('+prog.toFixed(2)+')'); } }

    /* 6. THE SKI FIELD RACKS ARE ROTATED, and that is the part a collider gets wrong quietly. Each
       rack has its own yaw, the gear is placed in the rack OWN frame, and the collider carries the
       same yaw - so if the sign convention were wrong the rail would be somewhere else and every ski
       would be in the snow, which is exactly what the first version of this piece did. */
    X.boot({biome:'skifield'}); X.startGame(1); tick(4); park();
    { const placed=G.props.filter(p=>p.home.y>0.5);
      settle(180);
      const fell=placed.filter(p=>p.y<p.home.y-0.05);
      ok(placed.length===8,'the ski field puts eight pieces of gear up on its three racks ('+placed.length+')');
      ok(fell.length===0,'and every one of them is still there three seconds later ('+
         (fell.map(p=>p.name).join(',')||'none')+')');
      const yaws=[...new Set(G.colliders.filter(c=>!c.solid&&c.top>0.9&&c.top<1.1).map(c=>c.ry))];
      ok(yaws.length>=3&&yaws.some(v=>v!==0),'the rack rails carry their own yaw, not a flat guess ('+
         yaws.map(v=>v.toFixed(2)).join(',')+')'); }
  } finally {
    X.boot({biome:'carpark'}); X.startGame(1); tick(6);
  }
}

C.section('THE CAREER PEAK IS ALIVE - PEAK 0 was not modesty, it was a dead read');
/* TODO 35, the half of it that needs no judgement. One line in update read G.chaos, which NOTHING in
   the file has ever assigned: the meter is G.score, and the HUD says so out loud - it renders CHAOS
   plus G.score. So (undefined||0) > (peak||0) was 0 > 0 on every frame of every run since the line
   was written, the peak never rose, and every player has always been shown PEAK 0 in three places -
   the to-do footer, the win screen, and the save blob that carries the number between maps.
   THE OTHER READ IS THE NIGHT AUTO-DRIVER AND IT IS LEFT ALONE ON PURPOSE. Pointing that one at the
   meter changes WHEN NIGHT FALLS, which is a feel change on two pinned vantages and a playtest call
   rather than an overnight one. TODO 35 still holds it, and the last assertion here PINS today's
   behaviour so that the day somebody takes option (a) this section goes red and says so. */
{
  try{
    X.boot({biome:'carpark'}); X.startGame(1); tick(6); park();
    G.chaosPeak=0; G.score=0;
    ok((G.chaosPeak||0)===0,'a fresh career starts at nothing ('+G.chaosPeak+')');

    // 1. IT FOLLOWS THE METER, which is the whole fix.
    X.award(120,'A BIG ONE',{x:0,y:1,z:0}); tick(4);
    ok(G.score>=120,'points land on the meter ('+G.score+')');
    ok(G.chaosPeak===G.score,'and the peak is the meter at its highest ('+G.chaosPeak+' vs '+G.score+')');
    X.award(60,'ANOTHER',{x:0,y:1,z:0}); tick(4);
    ok(G.chaosPeak===G.score,'it rises with it ('+G.chaosPeak+')');

    /* 2. AND IT IS A PEAK, not a mirror: the meter can go down - the fix verb pays less every cycle
       and a match reads differences - and the high-water mark does not follow it. */
    { const high=G.chaosPeak; G.score=Math.round(high/2); tick(6);
      ok(G.chaosPeak===high,'the meter falling leaves the peak where it was ('+G.chaosPeak+
         ' with the meter at '+G.score+')');
      X.award(5,'A SMALL ONE',{x:0,y:1,z:0}); tick(4);
      ok(G.chaosPeak===high,'and a small score after a big one does not lower it ('+G.chaosPeak+')'); }

    /* 3. IT IS A CAREER NUMBER, so it lives at the top of the blob rather than in a map slot - which
       is the piece 37 schema rule, and this is the first number that has ever been able to test it. */
    { const realLS=globalThis.localStorage, _m=new Map();
      globalThis.localStorage={getItem:k=>_m.has(k)?_m.get(k):null,
                               setItem:(k,v)=>_m.set(k,String(v)),removeItem:k=>_m.delete(k)};
      try{
        const high=G.chaosPeak;
        X.SAVE.write();
        const blob=X.SAVE.migrate(X.SAVE.load())||{};
        ok(blob.peak===high,'the write puts the peak at the top of the blob ('+blob.peak+' vs '+high+')');
        const slots=blob.biomes||{};
        ok(Object.keys(slots).length>0&&Object.keys(slots).every(id=>slots[id].peak===undefined),
           'and not in any map slot, because it is the player and not the map ('+
           Object.keys(slots).join(',')+')');
        G.chaosPeak=0; X.boot({biome:'carpark'}); X.startGame(1); tick(12);
        ok(G.chaosPeak===high,'and a fresh run hydrates it back ('+G.chaosPeak+')');
      } finally { globalThis.localStorage=realLS; } }

    /* 4. THE TWO PLACES A PLAYER READS IT ARE DOM STRINGS - the to-do footer and the win screen -
       and renderTodo returns immediately under HEADLESS, so what is asserted here is the number they
       are both built from. The footer is read in a real browser by journey.mjs. */
    ok(Math.round(G.chaosPeak)>0,'the number the footer and the win screen are built from is no longer zero ('+
       Math.round(G.chaosPeak)+')');

    /* 5. AND THE NIGHT DRIVER IS STILL EXACTLY AS DEAD AS IT WAS. This is the assertion that goes red
       the day somebody takes TODO 35 option (a), which is the point of writing it: night is allowed
       to fall on WANTED and on nothing else, and a quiet five thousand chaos does not bring it. */
    { G.night=false; G.nightManual=false; G.nightT=0; G.wanted=0; const was=G.score; G.score=5000;
      tick(10);
      ok(G.night===false,'a huge quiet score still does not bring the night on ('+G.score+' chaos, night '+
         G.night+') - TODO 35 option (a) is still open and this line is its tripwire');
      G.wanted=3; tick(10);
      ok(G.night===true,'while WANTED 3 brings it on, which is the half that was ever wired ('+G.night+')');
      G.night=false; G.nightManual=false; G.nightT=0; G.wanted=0; G.score=was; X.nightApply(0); tick(2); }
  } finally {
    G.night=false; G.nightManual=false; G.nightT=0; X.nightApply(0);
    X.boot({biome:'carpark'}); X.startGame(1); tick(6);
  }
}

C.section('THE TO-DO FOOTER IS A CLOCK, NOT A SNAPSHOT OF THE LAST MISSION');
/* TODO 66, and it is the other half of tonight peak fix rather than a new complaint. The footer of
   the to-do list carries the three live numbers a player checks - how many jobs are done, the career
   peak, and how long they have been at it - and every one of them was built INSIDE renderTodo, which
   runs on a mission event and at no other time. Open the list two minutes into a run and it read
   0:00; after piece 65 made the peak real it would have read PEAK 0 beside a meter showing four
   hundred, which is a worse lie than the dead read was.
   ONE FUNCTION, TWO CALL SITES. todoFoot() builds the line; renderTodo writes it when it rebuilds
   the list, and the HUD frame rewrites that one element while the panel is open and the string has
   actually changed. The string is the assertable part and the DOM is not, which is the same shape as
   plateLines and hudReflow: the render is browser-only, the decision is not. */
{
  try{
    X.boot({biome:'carpark'}); X.startGame(1); tick(6); park();
    G.playT=0; G.chaosPeak=0; G.score=0;
    const foot=()=>X.todoFoot();
    const parse=str=>{ const m=/^(\d+)\/(\d+) · PEAK (\d+) · (\d+:\d\d)$/.exec(str||'');
      return m?{dn:+m[1],all:+m[2],peak:+m[3],t:m[4]}:null; };

    // 1. THE SHAPE, so the three numbers cannot quietly become two.
    { const f=parse(foot());
      ok(!!f,'the footer is three numbers in one line ('+foot()+')');
      ok(!!f&&f.all===G.missions.filter(m=>!m.finale&&!m.hide).length,
         'the denominator is every job on the page list, finale and hidden rows aside ('+(f&&f.all)+')');
      ok(!!f&&f.dn===0&&f.peak===0&&f.t==='0:00','and at the start of a run all three are zero ('+foot()+')'); }

    /* 2. IT MOVES WITH NO MISSION EVENT AT ALL, which is the whole piece: nothing below completes a
       row, and all three numbers still change. */
    /* THE COMBO IS WHY THIS READS THE METER AND NOT THE LITERAL. award multiplies by G.combo, so a
       240 landed 960 - the same trap piece 22 and piece 18 both wrote down, met here for the third
       time. The claim is that the footer carries the peak, not that a number I typed is the peak. */
    X.award(240,'A BIG ONE',{x:0,y:1,z:0});
    tick(600);
    { const f=parse(foot());
      ok(!!f&&f.peak===Math.round(G.chaosPeak)&&f.peak===Math.round(G.score),
         'ten seconds later the peak is on it, and it is the meter high-water mark ('+foot()+
         ', meter '+G.score+')');
      ok(!!f&&f.t==='0:10','and the clock has run ('+(f&&f.t)+')');
      ok(!!f&&f.dn===0,'with not one row ticked in between ('+(f&&f.dn)+' done)'); }

    // 3. AND THE DONE COUNT STILL FOLLOWS THE LIST, because that is what it was always for.
    { const before=parse(foot()).dn;
      const open=G.missions.find(m=>!m.done&&!m.finale&&!m.hide&&!m.bonus);
      ok(!!open,'there is a job left to tick ('+(open?open.id:'none')+')');
      if(open){ X.done(open.id); tick(2);
        const f=parse(foot());
        ok(!!f&&f.dn===before+1,'ticking one moves the count by one ('+before+' -> '+(f&&f.dn)+')'); } }

    /* 4. THE CLOCK IS THE CAREER CLOCK, not the run clock, and the footer reads the same G.playT the
       save carries - so it survives a reload the way the peak does. Asserted through the accessor
       rather than the DOM, because the DOM does not exist here. */
    { const t0=G.playT; G.playT=125; const f=parse(foot());   // absolute: ten seconds have already run
      ok(!!f&&f.t==='2:05','two minutes and five seconds reads as 2:05 ('+(f&&f.t)+')');
      G.playT=t0; }

    /* 5. AND THE FOOTER IS ONE STRING FROM ONE FUNCTION. Nothing else in the file may build it: this
       is asserted the only way a battery can, by holding the function to the numbers it reads and
       then changing one of them underneath it. */
    { const was=G.chaosPeak; G.chaosPeak=987;
      ok(/PEAK 987/.test(foot()),'the line is built from the live numbers each time it is asked ('+foot()+')');
      G.chaosPeak=was; }
  } finally {
    X.boot({biome:'carpark'}); X.startGame(1); tick(6);
  }
}

C.section('PERF FLOOR');
X.startGame(2); tick(30);
{ const t0=Date.now(); for(let i=0;i<600;i++)X.update(1/60); const ms=(Date.now()-t0)/600;
  ok(ms<8,'headless update mean '+ms.toFixed(2)+'ms (< 8ms floor)'); }

/* ============================================================
   REPLAT P2 — SKY AND SUN. The recipe becomes law.
   ============================================================
   P2's proof contract is three claims: IBL and sun present in scene state, shadow casting on, and
   fog params pinned as named constants. This section is that contract, plus the day/night roll,
   which is where an exponential-fog port breaks if it breaks at all.

   IT ASSERTS THROUGH KEAGAME.SKY RATHER THAN RE-TYPING THE NUMBERS. Law 10: an assertion reads the
   convention, never a second copy of it. Re-typing 0.0062 here would mean a future tune has to be
   made in two files and would go red for the wrong reason when somebody only did it in one. What
   is asserted is that every light and the fog actually READ the constants — which is the claim
   worth making, because the failure mode this piece was written against is a literal left behind
   in initScene after the block above it was retuned. */
C.section('REPLAT P2: sky and sun');
{
  const SKY=X.SKY, PI=Math.PI;
  const near=(a,b,eps,what)=>ok(Math.abs(a-b)<=(eps||1e-6),what+' ('+a+' vs '+b+')');
  X.boot({biome:'carpark'}); tick(4);
  /* LAW 5, WITH A TWIST WORTH WRITING DOWN. Night is owned here as always — nightManual set, so
     the auto-driver cannot ease it — but nightApply is deliberately NOT called yet, because at
     boot it has not run: update() only calls it when nightT and the target disagree, and both are
     0. That matters for the colour assertions below.
     THE sRGB/LINEAR SEAM, FOUND BY THIS SECTION AND PRE-EXISTING. initScene hands raw authored
     hex to the lights and the fog, while nightApply writes the SAME constants through
     convertSRGBToLinear(). So a colour is one value at boot and a slightly deeper one the moment
     the first day/night transition completes — 0xC4D2D6 becomes 0x8DA4AB. That is r128 behaviour
     the port carried over verbatim and it is NOT P2's to change: converting at boot would move
     every frame in the set, which is a judged re-pin and not a sky piece. It is asserted in BOTH
     encodings instead, so the seam is documented and a future session that decides to close it
     will find the two halves already written down rather than discovering them one red at a time. */
  G.nightManual=true; G.night=false; G.nightT=0;

  ok(!!SKY,'the sky recipe is exported as one named block (KEAGAME.SKY)');
  const lin=h=>new H.THREE.Color(h).convertSRGBToLinear().getHex();
  const raw=h=>new H.THREE.Color(h).getHex();

  // ---- FOG: exponential, and pinned to the constants ----
  const fog=G.scene.fog;
  ok(!!fog,'the scene carries fog at all');
  ok(!!fog&&fog.isFogExp2===true,'and it is EXPONENTIAL fog, not the linear near/far pair P2 replaced'+
     ' ('+(fog?fog.constructor.name:'none')+')');
  ok(!!fog&&fog.near===undefined&&fog.far===undefined,
     'so it has no near/far to drive — nightApply must roll DENSITY (near '+(fog&&fog.near)+
     ', far '+(fog&&fog.far)+')');
  near(fog&&fog.density,SKY.fogDensityDay,1e-9,'day fog density is the pinned constant');
  ok(!!fog&&fog.color.getHex()===raw(SKY.fogDay),
     'and at boot its colour is the pinned constant, authored-encoded (#'+
     (fog?fog.color.getHexString():'?')+')');
  /* THE FOG IS TUNED TO THE SKY, AND THAT IS CHECKABLE RATHER THAN A CLAIM IN A COMMENT. The
     failure P2 corrected is fog DARKER than the horizon it sits against, which makes distant
     ridges fade toward something bluer than the sky behind them — the one thing aerial perspective
     never does. So the assertion is that the fog is no darker than the dome's own low band. */
  { const skyLow=(X.PAL||{}).skyLow;
    ok(skyLow!==undefined,'the palette is reachable to compare the fog against ('+skyLow+')');
    const lum=h=>{ const c=new H.THREE.Color(h); return 0.2126*c.r+0.7152*c.g+0.0722*c.b; };
    const lf=lum(SKY.fogDay), ls=skyLow===undefined?0:lum(skyLow);
    ok(skyLow!==undefined&&lf>=ls*0.90,
       'the fog is tuned to the sky it sits against, not darker than it (fog '+lf.toFixed(3)+
       ' vs skyLow '+ls.toFixed(3)+')'); }

  // ---- THE SUN: present, warm, casting, and pinned ----
  const sun=G.sun;
  ok(!!sun&&sun.isDirectionalLight===true,'the sun is one directional light');
  near(sun&&sun.intensity,SKY.sunIntensityDay*PI,1e-6,'its day intensity is the constant x pi');
  ok(!!sun&&sun.color.getHex()===raw(SKY.sunDay),
     'and at boot its colour is the pinned constant, authored-encoded (#'+
     (sun?sun.color.getHexString():'?')+')');
  { const c=sun?sun.color:{r:0,g:0,b:0};
    ok(c.r>c.g&&c.g>c.b,'the sun is WARM — r > g > b, which is the whole point of "one warm'+
       ' directional sun" ('+c.r.toFixed(3)+' / '+c.g.toFixed(3)+' / '+c.b.toFixed(3)+')'); }
  ok(!!sun&&sun.position.x===SKY.sunPosDay[0]&&sun.position.y===SKY.sunPosDay[1]&&
     sun.position.z===SKY.sunPosDay[2],'and it stands where the constant puts it');

  /* SHADOW CASTING ON — asserted, not eyeballed. This is only possible because P2 lifted the
     shadow config out of its `if(!HEADLESS)` guard: every line of it sets a number or a flag on an
     object three builds regardless, and none of them allocates a map. Under the old guard this
     proof could not be written at all. */
  ok(!!sun&&sun.castShadow===true,'SHADOW CASTING IS ON');
  ok(!!sun&&sun.shadow.mapSize.x===SKY.shadowMap&&sun.shadow.mapSize.y===SKY.shadowMap,
     'the shadow map is the pinned size ('+(sun?sun.shadow.mapSize.x:0)+')');
  near(sun&&sun.shadow.radius,SKY.shadowRadius,1e-9,'shadow radius is pinned');
  ok(!!sun&&sun.shadow.blurSamples===SKY.shadowBlur,'shadow blur samples are pinned ('+
     (sun?sun.shadow.blurSamples:0)+')');
  near(sun&&sun.shadow.normalBias,SKY.shadowNormalBias,1e-9,'shadow normal bias is pinned');
  /* THE BIAS IS ZERO ON PURPOSE AND THE TEST SAYS WHY. A variance shadow map compares moments
     rather than depths, so a negative constant bias does not cure acne here — it opens light
     leaks under thin geometry. If somebody switches shadowType back to pcfsoft they must put the
     constant bias back, and this pairing is the reminder. */
  ok(SKY.shadowType!=='vsm'||SKY.shadowBias===0,
     'a VSM shadow map runs at zero constant bias, leaning on the normal offset instead (type '+
     SKY.shadowType+', bias '+SKY.shadowBias+')');
  { const sc=sun?sun.shadow.camera:{};
    ok(sc.left===-SKY.shadowExtent&&sc.right===SKY.shadowExtent&&
       sc.top===SKY.shadowExtent&&sc.bottom===-SKY.shadowExtent&&sc.far===SKY.shadowFar,
       'and the shadow camera covers the pinned extent ('+sc.left+'..'+sc.right+', far '+sc.far+')'); }

  // ---- IBL PRESENT IN SCENE STATE ----
  ok(!!G.ibl,'IBL PROVENANCE IS IN SCENE STATE (G.ibl)');
  ok(!!G.ibl&&G.ibl.source===SKY.hdri,'and it names the environment it expects ('+
     (G.ibl||{}).source+')');
  near(G.scene.environmentIntensity,SKY.envIntensityDay,1e-9,'the scene environment intensity is the pinned constant');
  near(G.scene.environmentRotation.y,SKY.envRotationY,1e-9,'and the environment is rotated by the measured constant');
  /* A BATTERY CANNOT SEE THE TEXTURE — PMREM needs a WebGL renderer — so what it checks is the
     state a headless run CAN distinguish: the slot is declared and unclaimed. 'painted' and 'hdri'
     are both browser outcomes, and webrig.assertBooted is what refuses to photograph the wrong
     one. Asserting 'none' here is therefore the real invariant, not a weaker version of one: it
     proves initScene declares the contract before any renderer exists to fulfil it. */
  ok(!!G.ibl&&G.ibl.mode==='none'&&G.ibl.pmrem===false,
     'headless, the slot is declared and unclaimed — the browser fills it ('+(G.ibl||{}).mode+')');

  /* THE ROTATION CHECKS ITSELF AGAINST ITS OWN INPUTS. envRotationY is a MEASURED number, and the
     thing it must satisfy is that the HDRI's sun and the game's sun end up at the same azimuth.
     Assert the identity rather than the value, so that moving sunPosDay or swapping the HDRI
     without re-measuring goes red HERE with a message that says to re-measure — instead of
     shipping a world whose specular highlights point one way and whose shadows fall the other. */
  { const az=Math.atan2(SKY.sunPosDay[2],SKY.sunPosDay[0]);
    near(SKY.envRotationY,az-SKY.hdriSunAz,1e-3,
      'the environment rotation IS the azimuth difference it was measured as — re-measure '+
      'hdriSunAz if the HDRI or sunPosDay changes'); }

  /* THE CARPARK RECEIVES SHADOWS, and this one has to be a SOURCE assertion because
     receiveShadow is set behind `!HEADLESS` on every mesh in the game — the flag genuinely does
     not exist in node. The defect it guards is worth the unusual shape: `{noshadow:true}` turns
     off cast AND receive, the carpark slab used it, and so every car in the opening set cast
     dutifully into a surface that could not take a shadow. The road and the ski-field slab both
     re-enable receive after noshadow; the carpark simply did not, and ARTBIBLE listed the result
     as "no cast shadows anywhere" for months. Reading the specimen text is the only instrument
     available, so it is used deliberately and labelled. */
  { const src=require('../2026-08-26/keasrc').specimenSource();
    const slab=/const slab=box\([^)]*PAL\.tarmac[^)]*\{noshadow:true\}\);\s*slab\.receiveShadow=!HEADLESS;/.test(src);
    const apron=/const apron=box\([^)]*PAL\.tarmac[^)]*\{noshadow:true\}\);\s*apron\.receiveShadow=!HEADLESS;/.test(src);
    ok(slab,'the carpark slab RECEIVES shadows (noshadow kills receive as well as cast)');
    ok(apron,'and so does the entrance apron'); }

  // ---- THE DAY/NIGHT ROLL DRIVES ALL OF IT ----
  /* This is the section that would have caught the port bug. nightApply used to write fog.near and
     fog.far; FogExp2 has neither, so the old code would have set two properties nothing reads and
     the night fog would simply never have arrived — silently, with no error, on a vantage shot
     once a session. Law 5 throughout: night is OWNED here, never eased into. */
  G.night=true; G.nightManual=true; G.nightT=1; X.nightApply(1); tick(2);
  near(G.scene.fog.density,SKY.fogDensityNight,1e-9,'night rolls the fog DENSITY to its constant');
  ok(G.scene.fog.color.getHex()===lin(SKY.fogNight),
     'and the fog colour with it, linear-encoded as nightApply writes it (#'+
     G.scene.fog.color.getHexString()+')');
  ok(G.sun.color.getHex()===lin(SKY.sunNight),
     'and the sun colour likewise (#'+G.sun.color.getHexString()+')');
  near(G.scene.environmentIntensity,SKY.envIntensityNight,1e-9,
     'and the ENVIRONMENT dims — without this a midday HDRI keeps lighting the night at full');
  near(G.sun.intensity,SKY.sunIntensityNight*PI,1e-6,'and the sun stands down to its night constant');
  ok(G.sun.position.x===SKY.sunPosNight[0]&&G.sun.position.z===SKY.sunPosNight[2],
     'and crosses the sky to the night position');
  near(G.hemi.intensity,SKY.hemiIntensityNight*PI,1e-6,'hemisphere follows');
  near(G.fill.intensity,SKY.fillIntensityNight*PI,1e-6,'fill follows');
  near(G.rim.intensity,SKY.rimIntensityNight*PI,1e-6,'rim follows');
  ok(!!G.ibl&&Math.abs(G.ibl.intensity-SKY.envIntensityNight)<1e-9,
     'and G.ibl reports the intensity actually in force, not the one it booted with');

  /* AND IT COMES BACK. A one-way lerp is the other half of the same bug class: the night vantages
     are shot in the same pass as the day ones, off the same page in some tools, so a value that
     rolls out and does not roll back moves frames nobody was aiming at. */
  G.night=false; G.nightT=0; X.nightApply(0); tick(2);
  near(G.scene.fog.density,SKY.fogDensityDay,1e-9,'and day rolls every one of them back');
  ok(G.scene.fog.color.getHex()===lin(SKY.fogDay),
     'the day fog colour comes back linear-encoded, which is the seam noted at the top of this '+
     'section and not a drift (#'+G.scene.fog.color.getHexString()+')');
  ok(G.sun.color.getHex()===lin(SKY.sunDay),
     'and so does the sun (#'+G.sun.color.getHexString()+')');
  near(G.scene.environmentIntensity,SKY.envIntensityDay,1e-9,'environment included');
  near(G.sun.intensity,SKY.sunIntensityDay*PI,1e-6,'sun included');
  near(G.hemi.intensity,SKY.hemiIntensityDay*PI,1e-6,'hemisphere included');
  near(G.fill.intensity,SKY.fillIntensityDay*PI,1e-6,'fill included');
  near(G.rim.intensity,SKY.rimIntensityDay*PI,1e-6,'rim included');

  /* THE FILL AND RIM ARE THE SHADOW'S ENEMY, and the recipe's central trade is written down as an
     assertion so the night shift cannot quietly undo it. They do NOT cast, so every unit they
     carry is a unit that fills shadows straight back in; P2 moved that energy to the sun, which
     does cast. If a later tune pushes them back up without lowering the sun, the shadows this
     piece exists to deliver stop reading — measured, that was YLOW 122 flat against YLOW 97 with
     the trade in place.
     THE CEILING IS DERIVED FROM THE TWO MEASURED STATES, and the first attempt at it was worth
     nothing. It read "under a fifth of the sun", which sounded like a bound and forbade nothing:
     a sabotage restoring fill to its old 0.15 gave 0.25 against a 0.37 ceiling and came back with
     ZERO FINDINGS. Law 14's tell — a sabotage that obviously breaks the feature returning nothing
     — applied to a bound rather than to a read. So the number now comes from the measurements:
     the flat state was (0.15+0.15)/1.45 = 0.207 of the sun and the state that reads is
     (0.05+0.10)/1.85 = 0.081, so 0.12 sits between them with room for a real tune above the
     recipe and none for the regression. Both sabotages were re-run against it. */
  ok(G.fill.castShadow===false&&G.rim.castShadow===false,
     'fill and rim do NOT cast — which is exactly why they are kept small');
  { const ratio=(SKY.fillIntensityDay+SKY.rimIntensityDay)/SKY.sunIntensityDay;
    ok(ratio<0.12,'the non-casting fills stay under 0.12 of the sun, so cast shadows still read '+
       '(ratio '+ratio.toFixed(3)+', flat was 0.207, ceiling 0.12)'); }

  X.boot({biome:'carpark'}); X.startGame(1); tick(6);   // hand the world back as it was found
}

/* ============================================================
   REPLAT P3 — SCANNED MATERIALS. The recipe becomes law.
   ============================================================
   P3's proof contract is three claims: every material family resolves a REAL texture set, the
   licences are recorded, and no procedural canvas is left on a swapped family. Plus the thing the
   brief puts first and no earlier piece could assert at all — CORRECT TEXEL DENSITY PER SURFACE.

   THIS SECTION EXISTS BECAUSE THE DENSITY MATHS IS ARITHMETIC, NOT A PHOTOGRAPH. A texture only
   lands in a browser, so the obvious instinct is that "the gravel is the right size" is an eyeball
   judgement. It is not: the density chain is (UVs rescaled to metres) x (repeat = 1/tileM), and
   the first half runs in node exactly as it runs on a GPU. So the tiling can be PROVEN, per
   geometry kind, on the real meshes the real world builds — and what is left for Eric's eye is
   whether 2 m of gravel is the right LOOK, which is the only half that was ever taste.

   IT READS THE RECIPE, NEVER A SECOND COPY OF IT (law 10). Not one tile size or tint is retyped
   below. The one deliberate exception is the LICENCE CROSS-CHECK, which compares MATS.tileM
   against the millimetres written in assets/LICENCES.md — two independent records of the same
   fact, on purpose, because "no asset lands without its licence line" is only worth something if
   the line and the code cannot drift apart. */
C.section('REPLAT P3: scanned materials');
{
  const MATS=X.MATS, FAM=MATS.families, NAMES=Object.keys(FAM);
  const near=(a,b,eps,what)=>ok(Math.abs(a-b)<=(eps||1e-6),what+' ('+a+' vs '+b+')');
  X.boot({biome:'carpark'}); tick(4);

  ok(!!MATS&&!!FAM,'the material recipe is exported as one named block (KEAGAME.MATS)');
  /* THE COUNT IS DERIVED FROM THE LEDGER, not typed. It was `===7` and went red the moment P3b
     added concrete on Eric's verdict — a bound fitted to the number of the day, which is law 15's
     time bomb and the third time this section has been caught by it. What is actually worth
     asserting is that the recipe and the ledger agree about HOW MANY families there are. */
  { const fs=require('fs'), path=require('path');
    const lic=fs.readFileSync(path.join(__dirname,'../../assets/LICENCES.md'),'utf8');
    const listed=(lic.match(/^### [a-z]+ — `/gm)||[]).length;
    ok(NAMES.length===listed,'the recipe and the licence ledger agree on the family count ('+
       NAMES.length+' in MATS, '+listed+' in LICENCES.md: '+NAMES.join(', ')+')');
    ok(NAMES.length>=7,'and it is at least REPLAT P3 six plus snow ('+NAMES.length+')'); }

  // ---- EVERY FAMILY RESOLVES A REAL TEXTURE SET ----
  /* The strongest claim a headless battery can make about a file it cannot decode: the file is
     THERE, on disk, at the exact path the browser will ask for, and it is not a stub. Three maps
     per family, so a family that quietly shipped with two is red here rather than flat in a
     photograph nobody ablated. */
  { const fs=require('fs'), path=require('path');
    const root=path.resolve(__dirname,'../..');
    let files=0, bytes=0;
    for(const f of NAMES){ const F=FAM[f];
      ok(typeof F.asset==='string'&&F.asset.length>0,f+' names a real asset ('+F.asset+')');
      ok(F.mode==='scan'||F.mode==='paint',f+' declares a mode the pipeline knows ('+F.mode+')');
      for(const suf of ['diff','nor_gl','arm']){
        const rel='assets/'+MATS.dir+F.asset+'_'+suf+'_'+MATS.res+'.jpg';
        const p=path.join(root,rel);
        const st=fs.existsSync(p)?fs.statSync(p):null;
        ok(!!st&&st.size>20000,f+': '+rel+' is on disk and is a real image ('+
           (st?st.size+' bytes':'MISSING')+')');
        if(st){files++;bytes+=st.size;} } }
    ok(files===NAMES.length*3,'every family has all three maps on disk — albedo, normal, ARM ('+
       files+'/'+(NAMES.length*3)+')');
    /* AND THEY ARE THE JPEGS THEY CLAIM TO BE. A zero-length or half-downloaded file passes a size
       check on a bad day; the SOI marker does not. Cheap, and it is the difference between "a file
       exists" and "a texture will decode". */
    for(const f of NAMES){ const p=path.join(root,'assets/'+MATS.dir+FAM[f].asset+'_diff_'+MATS.res+'.jpg');
      const b=fs.existsSync(p)?fs.readFileSync(p,{start:0,end:1}):null;
      ok(!!b&&b[0]===0xFF&&b[1]===0xD8,f+' albedo starts with a JPEG SOI marker, so it will decode'); }
    ok(bytes>10e6&&bytes<40e6,'the texture tier is the size LICENCES.md says it is ('+
       (bytes/1048576).toFixed(1)+' MB)'); }

  // ---- THE LICENCE LINE AND THE CODE AGREE ----
  /* "No asset lands without its licence line" (REPLAT.md section 1) is the condition the whole
     external-asset tier lands under, so it is asserted rather than remembered. Two directions:
     every asset the code uses is written down, and the real-world size it is tiled at is the size
     the ledger records. The second is the one with teeth — tileM is the texel density, and a
     density retuned by eye while the ledger still says 2000 mm is a lie that renders fine. */
  { const fs=require('fs'), path=require('path');
    const lic=fs.readFileSync(path.join(__dirname,'../../assets/LICENCES.md'),'utf8');
    for(const f of NAMES){ const F=FAM[f];
      ok(lic.indexOf('`'+F.asset+'`')>=0,f+': '+F.asset+' has a licence entry in assets/LICENCES.md');
      for(const suf of ['diff','nor_gl','arm'])
        ok(lic.indexOf(F.asset+'_'+suf+'_'+MATS.res+'.jpg')>=0,
           f+': '+suf+' is listed by filename in the ledger, with its md5');
      /* the ledger writes millimetres, the recipe writes metres — compared, not copied */
      const m=new RegExp('`'+F.asset+'`[\\s\\S]{0,900}?Published real-world size: \\*\\*([0-9.]+) x').exec(lic);
      ok(!!m,f+': the ledger records a published real-world size');
      if(m) near(F.tileM,parseFloat(m[1])/1000,5e-4,
        f+': the tile the game uses IS the size the publisher published and the ledger recorded'); }
    ok(/CC0/.test(lic),'and the tier is recorded as CC0'); }

  // ---- NO PROCEDURAL CANVAS LEFT ON A SWAPPED FAMILY ----
  /* Three claims in one: the two registries are disjoint, every family actually claims some
     colour or surface, and the three detailTex kinds the swap retired are GONE FROM THE FILE
     rather than merely unreferenced. The last one is a source read, deliberately and labelled —
     a dead branch in a texture builder is a trap, because the next person to add a road finds a
     plausible-looking `asphalt` kind sitting there and uses it. */
  { const both=Object.keys(X.MATFAM).filter(c=>X.MAPKIND[c]!==undefined);
    ok(both.length===0,'no colour is registered in BOTH registries — a colour in both takes '+
       'whichever branch mat() tested first ('+both.join(',')+')');
    const claimed={}; for(const c of Object.keys(X.MATFAM))claimed[X.MATFAM[c]]=(claimed[X.MATFAM[c]]||0)+1;
    /* grass and snow also reach the terrain planes, which do not go through mat() at all, so the
       colour registry is not where their claim lives — G.mats is. Assert through the state. */
    /* A FAMILY MAY LIVE IN EITHER BIOME, so the claim is checked across BOTH. `concrete` exists
       only at the ski field — it is one poured footing at the top of the rope tow — and asserting
       it against the carpark alone would have made a correct assignment look like a dead family. */
    { const seen={};
      for(const b of ['carpark','skifield']){ X.boot({biome:b}); X.startGame(1); tick(4); park();
        for(const f of NAMES) seen[f]=(seen[f]||0)+((G.mats.families[f]||{}).materials|0); }
      X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();
      for(const f of NAMES) ok(seen[f]>0,
        f+' actually claims a surface in one of the two maps ('+(seen[f]|0)+' material(s))'); }
    const src=require('../2026-08-26/keasrc').specimenSource();
    for(const dead of ['asphalt','corrugate','snowtex'])
      ok(src.indexOf("kind==='"+dead+"'")<0,
         "the procedural '"+dead+"' canvas is GONE from detailTex, not merely unreferenced");
    for(const live of ['grain','speckle','brushed','panel','weave'])
      ok(src.indexOf("kind==='"+live+"'")>=0,
         "and '"+live+"' is untouched — it is not a family REPLAT P3 names ("+live+")");
    /* ANCHOR ON THE CALL, NOT ON THE COLOUR. The first cut of this asserted the hex 0x9E5442 was
       absent from the file and went red against the COMMENT that explains why it was removed —
       a test matching the prose written about it rather than the code. The claim is that the five
       lap-line boxes are not built any more, so the geometry call is the anchor. */
    ok(!/box\(7\.02,0\.02,5\.42,/.test(src),
       'the five fake weatherboard lap lines are gone; the scan has real ones at real spacing'); }

  // ---- PROVENANCE IS IN SCENE STATE, THE SAME SHAPE AS G.ibl ----
  { ok(!!G.mats,'MATERIAL PROVENANCE IS IN SCENE STATE (G.mats)');
    ok(G.mats.mode==='none'&&G.mats.loaded===0,
       'headless, the slot is declared and unclaimed — the browser fills it ('+G.mats.mode+')');
    for(const f of NAMES){ const r=G.mats.families[f]||{};
      ok(r.asset===FAM[f].asset&&r.tileM===FAM[f].tileM&&r.mode===FAM[f].mode,
         f+': the state block reports the recipe it was built from ('+r.asset+' @ '+r.tileM+'m)'); } }

  // ---- TEXEL DENSITY: THE UVs CARRY METRES, ON EVERY GEOMETRY KIND ----
  /* This is the claim the brief leads with, and it is checked on the REAL meshes the REAL world
     built — walk the scene, find every mesh whose material belongs to a family, and measure the
     UV span against the world span it covers. A texel is tileM/1024 metres across if and only if
     one unit of UV is one metre of surface, so that is what is measured: the span, per axis, per
     face, against the geometry's own parameters. Nothing here trusts the helper that wrote them. */
  { const fam=[]; G.scene.traverse(o=>{ const m=o.material;
      if(o.isMesh&&m&&m.userData&&m.userData.matFamily&&o.geometry&&o.geometry.attributes.uv)
        fam.push(o); });
    ok(fam.length>40,'the built world carries a decent population of family meshes ('+fam.length+')');

    const spanOf=(g,lo,hi)=>{ const uv=g.attributes.uv; let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
      for(let i=lo;i<hi;i++){ const u=uv.getX(i),v=uv.getY(i);
        if(u<u0)u0=u; if(u>u1)u1=u; if(v<v0)v0=v; if(v>v1)v1=v; }
      return {u:u1-u0,v:v1-v0}; };

    /* BOXES — the case that matters most, because a box's UVs are 0..1 PER FACE and a shared
       texture would therefore give a 40 m car park slab and a 0.7 m chimney the same tile count.
       three lays the six faces down in a fixed order (px, nx, py, ny, pz, nz) with u along the
       first extent and v along the second, so every face is checked against ITS OWN pair. */
    { let boxes=0, faces=0, bad=[];
      for(const o of fam){ const g=o.geometry; if(g.type!=='BoxGeometry')continue;
        const p=g.parameters;
        if(p.widthSegments!==1||p.heightSegments!==1||p.depthSegments!==1)continue;
        boxes++;
        const ext=[[p.depth,p.height],[p.depth,p.height],[p.width,p.depth],
                   [p.width,p.depth],[p.width,p.height],[p.width,p.height]];
        for(let f=0;f<6;f++){ const s=spanOf(g,f*4,f*4+4); faces++;
          if(Math.abs(s.u-ext[f][0])>1e-4||Math.abs(s.v-ext[f][1])>1e-4)
            bad.push(o.material.userData.matFamily+' face'+f+' '+s.u.toFixed(3)+'x'+s.v.toFixed(3)+
                     ' want '+ext[f][0]+'x'+ext[f][1]); } }
      /* THE BAR IS COVERAGE, NOT A COUNT. The first cut asserted `boxes>=8` and went red at 7,
         which is law 15's time bomb in miniature: a bound fitted to a number one build happened to
         produce. What is worth asserting is that the measurement reached EVERY family box in the
         world and that more than one family contributed — so the day a family box appears with
         non-default segments, this says so instead of quietly measuring six of seven. */
      const allBoxes=fam.filter(o=>o.geometry.type==='BoxGeometry');
      const fams=new Set(allBoxes.map(o=>o.material.userData.matFamily));
      ok(boxes===allBoxes.length,'EVERY family box in the built world was measured, none skipped '+
         'for odd segments ('+boxes+'/'+allBoxes.length+', '+faces+' faces)');
      ok(fams.size>=3,'and they span several families, so this is not one prop passing for the set ('+
         [...fams].join(', ')+')');
      ok(bad.length===0,'EVERY FACE OF EVERY FAMILY BOX SPANS ITS OWN WORLD SIZE IN UV METRES'+
         (bad.length?' — '+bad.slice(0,3).join(' | '):' ('+faces+'/'+faces+')')); }

    /* THE CARPARK SLAB BY NAME, because it is the surface every opening vantage is looking at and
       because a 40 x 22 m box is where a per-face bug is largest. Derived from the geometry's own
       parameters, per law 10 and law 15 — never from the 40 and 22 typed into buildCarpark. */
    { const slab=fam.find(o=>o.geometry.type==='BoxGeometry'&&o.material.userData.matFamily==='asphalt'&&
                             o.geometry.parameters.width>30);
      ok(!!slab,'the carpark slab is an asphalt-family mesh');
      if(slab){ const p=slab.geometry.parameters, s=spanOf(slab.geometry,8,12);  // face 2 = +Y, the top
        near(s.u,p.width,1e-4,'its top face spans its full width in UV metres');
        near(s.v,p.depth,1e-4,'and its full depth');
        const tiles=p.width/FAM.asphalt.tileM;
        ok(Math.abs(tiles-p.width/3)<1e-6,'so the asphalt tiles '+tiles.toFixed(1)+
           ' times across a '+p.width+' m slab, at '+(FAM.asphalt.tileM/1024*1000).toFixed(2)+
           ' mm per texel'); } }

    /* THE TERRAIN PLANE, which is the other extreme: 240 m of ground on one PlaneGeometry. */
    { const gnd=fam.find(o=>o.geometry.type==='PlaneGeometry'&&o.geometry.parameters.width>100);
      ok(!!gnd,'the terrain plane is a family mesh (the grass scan, in paint mode)');
      if(gnd){ const p=gnd.geometry.parameters, s=spanOf(gnd.geometry,0,gnd.geometry.attributes.uv.count);
        near(s.u,p.width,1e-3,'the terrain spans its full width in UV metres');
        near(s.v,p.height,1e-3,'and its full depth'); } }

    /* CYLINDERS AND SPHERES ARE MEASURED AGAINST A PRISTINE GEOMETRY OF THE SAME PARAMETERS, not
       against an arithmetic guess at three's UV layout — law 10 and law 15 together, and the first
       cut of this section got it wrong in exactly the way those laws describe. A sphere's u does
       NOT span 1.0: three offsets the pole rows by half a segment, so the real span is
       1 + 1/widthSegments, and an assertion that "wants 2*pi*r" fails on correct geometry and
       reads as a bug in the code under test. Building the untouched geometry and multiplying its
       own span by the metre factor cannot be wrong about the convention, because it IS the
       convention. The factor is the claim; the layout is three's business. */
    const T=H.THREE;
    const spanAll=g=>spanOf(g,0,g.attributes.uv.count);
    { let cyls=0, bad=[];
      for(const o of fam){ const g=o.geometry; if(g.type!=='CylinderGeometry')continue;
        const p=g.parameters, ref=new T.CylinderGeometry(p.radiusTop,p.radiusBottom,p.height,
              p.radialSegments,p.heightSegments,p.openEnded);
        /* the torso's u goes ONCE AROUND, so it carries the mean circumference (these are
           truncated cones as often as cylinders) and its v carries the height. */
        const torso=(p.radialSegments+1)*(p.heightSegments+1);
        const got=spanOf(g,0,torso), want=spanOf(ref,0,torso);
        const circ=Math.PI*(p.radiusTop+p.radiusBottom);
        cyls++;
        if(Math.abs(got.u-want.u*circ)>1e-4||Math.abs(got.v-want.v*p.height)>1e-4)
          bad.push(o.material.userData.matFamily+' '+got.u.toFixed(4)+'x'+got.v.toFixed(4)+
                   ' want '+(want.u*circ).toFixed(4)+'x'+(want.v*p.height).toFixed(4)); }
      ok(cyls>0,'family cylinders found to measure ('+cyls+')');
      ok(bad.length===0,'every family cylinder torso spans its circumference by its height'+
         (bad.length?' — '+bad.slice(0,3).join(' | '):' ('+cyls+'/'+cyls+')')); }

    { let sp=0, bad=[];
      for(const o of fam){ const g=o.geometry; if(g.type!=='SphereGeometry')continue;
        const p=g.parameters, ref=new T.SphereGeometry(p.radius,p.widthSegments,p.heightSegments);
        const got=spanAll(g), want=spanAll(ref); sp++;
        if(Math.abs(got.u-want.u*2*Math.PI*p.radius)>1e-4||Math.abs(got.v-want.v*Math.PI*p.radius)>1e-4)
          bad.push(o.material.userData.matFamily+' r'+p.radius.toFixed(3)+' '+
                   got.u.toFixed(4)+'x'+got.v.toFixed(4)+' want '+
                   (want.u*2*Math.PI*p.radius).toFixed(4)+'x'+(want.v*Math.PI*p.radius).toFixed(4)); }
      ok(sp>0,'family spheres found to measure ('+sp+' — the carpark grit)');
      ok(bad.length===0,'every family sphere spans its equator by its meridian'+
         (bad.length?' — '+bad.slice(0,3).join(' | '):' ('+sp+'/'+sp+')')); }

    /* AND NOTHING OUTSIDE A FAMILY WAS TOUCHED. The other half of the same claim, and the one that
       keeps this piece inside its brief: a non-family mesh must still carry three's own 0..1 UVs,
       because P3 was asked to swap seven families and not to re-tile the whole game. */
    { let plain=0, moved=[];
      G.scene.traverse(o=>{ const m=o.material, g=o.geometry;
        if(!o.isMesh||!g||g.type!=='BoxGeometry'||!g.attributes.uv)return;
        if(m&&m.userData&&m.userData.matFamily)return;
        if(g.parameters.widthSegments!==1)return;
        plain++;
        const s=spanOf(g,0,4);
        if(Math.abs(s.u-1)>1e-6||Math.abs(s.v-1)>1e-6)moved.push(g.parameters.width+'x'+g.parameters.height); });
      ok(plain>50,'plenty of non-family boxes to check ('+plain+')');
      ok(moved.length===0,'and EVERY ONE still carries three unit UVs — P3 swapped seven families, '+
         'not the whole game'+(moved.length?' — '+moved.slice(0,3).join(' | '):'')); } }

  /* ---- THE CORRUGATIONS RUN DOWN THE SLOPE, WHICH IS A FACT ABOUT ROOFS ---- */
  /* A corrugated roof whose ribs run ALONG the ridge does not drain, and it is the single most
     obvious way to get a scanned material wrong on a building. The direction is not a taste call
     and it is not visible enough to trust to a glance either — I read it off 19_roof_follow as
     WRONG and it was right, which is exactly why this is measured instead of eyeballed.
     corrugated_iron_02's ribs run vertically in the image, so they are lines of CONSTANT U and
     therefore run along whatever world direction V increases in. Measured on the built roof: U
     runs along world X (the ridge) and V runs down the pitched slope, so the ribs run down the
     slope. The claim asserted is the geometric one — V has a vertical component on a pitched
     panel — because that is what "down the slope" means and it survives the hut moving. */
  { let panels=0, bad=[];
    G.scene.traverse(o=>{ const m=o.material;
      if(!(o.isMesh&&m&&m.userData&&m.userData.matFamily==='corrugate'))return;
      if(o.geometry.type!=='BoxGeometry')return;
      const g=o.geometry;
      o.updateWorldMatrix(true,false);
      const V=[];
      for(let i=8;i<12;i++){                          // face 2 = +Y, the four top-face vertices
        const w=new H.THREE.Vector3(g.attributes.position.getX(i),g.attributes.position.getY(i),
                                    g.attributes.position.getZ(i)).applyMatrix4(o.matrixWorld);
        V.push({u:g.attributes.uv.getX(i),v:g.attributes.uv.getY(i),p:w}); }
      let vd=null;
      for(let a=0;a<4&&!vd;a++)for(let b=0;b<4;b++){ if(a===b)continue;
        if(Math.abs(V[a].u-V[b].u)<1e-6&&Math.abs(V[a].v-V[b].v)>1e-6){
          vd=V[b].p.clone().sub(V[a].p).normalize(); break; } }
      if(!vd)return;
      panels++;
      /* a PITCHED panel must have V leaning up or down the pitch; a flat one cannot and is
         excluded by the same test rather than by a name. */
      const pitched=Math.abs(vd.y)>0.05;
      if(pitched&&Math.abs(vd.y)<0.3)
        bad.push(m.userData.matFamily+' '+vd.x.toFixed(2)+','+vd.y.toFixed(2)+','+vd.z.toFixed(2)); });
    ok(panels>=3,'corrugate panels found to measure ('+panels+')');
    ok(bad.length===0,'THE CORRUGATIONS RUN DOWN THE SLOPE on every pitched panel, not along the '+
       'ridge — a roof that does not drain is the loudest way to get a scanned material wrong'+
       (bad.length?' — '+bad.join(' | '):''));
    /* AND THE PITCH IS A REAL CORRUGATE PITCH. 2.7 m over 1024 px with ~34 ribs is 79 mm, against
       a real sheet's 76 mm. Recorded as a bound on the TILE, because that is the constant a future
       session would move. */
    ok(FAM.corrugate.tileM>2.0&&FAM.corrugate.tileM<3.4,
       'and the sheet tiles at a real corrugate pitch — '+FAM.corrugate.tileM+' m over 34 ribs is '+
       (FAM.corrugate.tileM/34*1000).toFixed(0)+' mm against a real sheet 76 mm'); }

  // ---- THE rbox UV VARIANT: WORLD Y ON V ON EVERY FACE ----
  /* An ExtrudeGeometry's UVs are already in model units, which is exactly what texel density
     wants. What they are NOT is consistently oriented: three's WorldUVGenerator lays the cap faces
     down as (x,y) and the side walls as (y,-z), so world Y lands on V on the caps and on U on the
     two end walls. glassRamp's comment records that defect and works around it; for a colour it is
     invisible, but for WEATHERBOARD it turns the laps ninety degrees on the hut's gable ends.
     The variant geometry is cached under its own key, so this also proves the plain geometry every
     other caller shares was not poisoned on the way past. */
  { const wall=X.roundedBoxGeo(7,2.6,5.4,0.1,true), plain=X.roundedBoxGeo(7,2.6,5.4,0.1);
    ok(wall!==plain,'the metre-UV rbox variant is a SEPARATE cached geometry, so the plain one '+
       'every other caller shares cannot be poisoned by it');
    /* THE CLAIM IS EXACT, SO THE ASSERTION IS EXACT — and the two cuts before this one were not.
       Both tried to identify the end walls by NORMAL DOMINANCE and both went red against correct
       code, because smoothFacetNormals blends normals across three bevel segments and every
       dominance bucket inside the side-wall group ends up spanning the same 7.07 m. Law 15's own
       words: derive the bound from how the value is CONSTRUCTED.
       WHAT IT IS CONSTRUCTED FROM. three's WorldUVGenerator writes a side wall's u as the RAW
       local coordinate it picked — position.y on a wall of constant x, position.x on a wall of
       constant y — and v as 1-z either way. So every side-wall vertex must satisfy exactly one of
       two identities, and they are float equalities rather than tolerances:
           v === position.y     the vertical end walls, reoriented: world Y is on V
           u === position.x     the horizontal walls, untouched: both axes already horizontal
       A vertex satisfying NEITHER is a wall carrying world Y on U — which is the defect, and it is
       what the plain geometry has on exactly half its perimeter. */
    const audit=g=>{ const gr=(g.groups||[]).find(x=>x.materialIndex===1);
      const lo=gr?gr.start:0, hi=gr?gr.start+gr.count:0;
      let vy=0,ux=0,neither=0;
      for(let i=lo;i<hi&&i<g.attributes.uv.count;i++){
        if(Math.abs(g.attributes.uv.getY(i)-g.attributes.position.getY(i))<1e-6)vy++;
        else if(Math.abs(g.attributes.uv.getX(i)-g.attributes.position.getX(i))<1e-6)ux++;
        else neither++; }
      return {vy,ux,neither,n:hi-lo}; };
    const A=audit(wall), B=audit(plain);
    ok(A.n>1000,'the hut wall geometry has a real perimeter to measure ('+A.n+' side-wall vertices)');
    ok(A.neither===0,'ON THE VARIANT, EVERY SIDE-WALL VERTEX CARRIES WORLD Y ON V OR IS ALREADY '+
       'HORIZONTAL — so a weatherboard lap runs level on every face of the hut ('+A.vy+
       ' reoriented + '+A.ux+' already horizontal, '+A.neither+' wrong)');
    ok(A.vy>0&&A.ux>0,'and BOTH kinds are present, so it reoriented the end walls without '+
       'flattening the ones that were right ('+A.vy+' / '+A.ux+')');
    ok(B.neither>0,'while the plain geometry has '+B.neither+' vertices carrying world Y on U — '+
       'the three behaviour this variant exists to correct, and the reason glassRamp rides vertex '+
       'Y instead of a UV');
    near(A.ux,B.ux,0,'the walls that were already right were not touched ('+A.ux+' vs '+B.ux+')');

    /* AND THE LID FACES ARE UNTOUCHED, which is the regression the first cut actually shipped for
       ten minutes: it swapped cap vertices near the wall's vertical edges. The 7 x 2.6 m wall face
       must read 7 across U and 2.6 up V on BOTH geometries, to the float. */
    { const lid=(g,axis)=>{ const gr=(g.groups||[]).find(x=>x.materialIndex===0);
        const lo=gr?gr.start:0, hi=gr?gr.start+gr.count:0; let a=1e9,b=-1e9;
        for(let i=lo;i<hi;i++){ const val=axis==='u'?g.attributes.uv.getX(i):g.attributes.uv.getY(i);
          if(val<a)a=val; if(val>b)b=val; }
        return b-a; };
      /* 1e-5 AND NOT 1e-9: a BufferAttribute is Float32, so 2.6 comes back as 2.5999999046 and a
         nine-decimal bound fails on arithmetic that is exactly right. The EQUALITY between the two
         geometries below is still exact (tolerance 0) — that comparison is float-to-float and has
         no decimal to lose. */
      near(lid(wall,'u'),7,1e-5,'the variant left the WALL FACE spanning its full 7 m width on U');
      near(lid(wall,'v'),2.6,1e-5,'and its full 2.6 m height on V');
      near(lid(wall,'u'),lid(plain,'u'),0,'identical to the plain geometry on U, so only the '+
        'perimeter was reoriented');
      near(lid(wall,'v'),lid(plain,'v'),0,'and identical on V'); }

    /* and the hut wall in the built world is actually using it */
    { let hut=null; G.scene.traverse(o=>{ if(o.isMesh&&o.material&&o.material.userData&&
        o.material.userData.matFamily==='weatherboard')hut=o; });
      ok(!!hut,'the hut wall is a weatherboard-family mesh');
      ok(!!hut&&hut.geometry.type==='ExtrudeGeometry',
         'and it is the rbox extrude, whose UVs are metres already ('+(hut?hut.geometry.type:'-')+')'); } }

  // ---- THE TINT AND THE PAINT NORMALISATION ARE ARITHMETIC, SO THEY ARE PROVEN, NOT EYEBALLED ----
  /* matDress is the whole colour half of the recipe and it runs in node. What it must guarantee is
     that neither mode moves EXPOSURE: a scan-mode tint pushes hue at constant luminance, and a
     paint-mode colour is scaled by exactly the reciprocal of the mean the albedo was normalised
     to. Both are checked by driving matDress with a fabricated map set and reading the material
     back — which is also the only way to test the loaded branch without a GPU. */
  { const T=H.THREE, lum=c=>0.2126*c.r+0.7152*c.g+0.0722*c.b;
    /* LAW 14: read through an accessor that cannot throw. A family with no material would make
       `S.mats[0].userData` a stack trace and no verdict, and a sabotage against this whole block
       would then come back with ZERO findings and read as a gap in the test. The count is asserted
       above; this returns null instead of exploding. */
    const probe=(f)=>{ const S=X.matFam(f), m=(S.mats||[])[0];
      if(!m||!m.userData||!m.userData.matBase)return null;
      const base=m.userData.matBase.clone(), had=S.maps;
      S.maps={map:{},normalMap:{},roughnessMap:{}};
      X.matDress(m); const got=m.color.clone(), rough=m.roughness;
      S.maps=had; X.matDress(m);                       // hand it back exactly as it was found
      return {base,got,rough}; };

    for(const f of NAMES){ const F=FAM[f], r=probe(f);
      ok(!!r,f+': has a material to read the dressed colour back off');
      if(!r)continue;
      if(F.mode==='scan'){
        near(lum(r.got),1,2e-3,f+' (scan): the tint is LUMINANCE-NEUTRAL, so choosing a hue cannot '+
          'smuggle in an exposure change');
        if(F.tint>0){ const hue=r.base.clone().multiplyScalar(1/(lum(r.base)||1));
          const want=new T.Color(1,1,1).lerp(hue,F.tint);
          near(r.got.r,want.r,1e-5,f+': and it is white lerped toward the palette hue by tint='+F.tint); }
      } else {
        near(lum(r.got)*MATS.paintMean,lum(r.base),1e-5,
          f+' (paint): the colour carries exactly 1/paintMean, so an albedo normalised to '+
          MATS.paintMean+' lands the surface back on its authored luminance');
      }
      near(r.rough,MATS.roughScale,1e-9,f+': with maps on, the SCAN owns roughness (material '+
        'roughness '+r.rough+' x roughnessMap.g), not mat()\'s authored 0.82'); }

    /* AND IT GOES BACK. A material that cannot return to the palette look is a material that would
       photograph as scanned on a machine whose fetch failed, which is the exact failure assertBooted
       exists to refuse. This also proves the probe above left the world as it found it. */
    for(const f of NAMES){ const m=(X.matFam(f).mats||[])[0], u=(m||{}).userData||{};
      ok(!!m&&!!u.matBase&&m.color.equals(u.matBase),
         f+': with no maps it is the authored palette colour again (#'+
         (m?m.color.getHexString():'-')+' vs #'+(u.matBase?u.matBase.getHexString():'-')+')');
      near((m||{}).roughness,u.matRough,1e-9,f+': and the authored roughness'); } }

  /* THE FAMILY MATERIALS MUST NOT ALSO BE NIGHT-TINTED. nightTint captures a material's colour at
     registration and lerps it every night frame; matDress writes the same colour when the textures
     land. Two authors for one value is the P2 note's own warning, and today the two sets are
     disjoint — this is the tripwire for the day somebody nightTints a roof. */
  { const bad=(G.nightMats||[]).filter(e=>e.m.userData&&e.m.userData.matFamily);
    ok(bad.length===0,'no family material is ALSO night-tinted — matDress and nightApply would '+
       'both own its colour ('+bad.length+')'); }

  /* THE SKI FIELD BUILDS ITS OWN MATERIALS LONG AFTER THE FIRST INSTALL, which is the one ordering
     this design has to survive: travel builds a second biome after the textures have landed, so a
     material created LATER must dress itself on creation rather than waiting for an install that
     already happened. Proven by building it and reading the registry back. */
  { X.boot({biome:'skifield'}); X.startGame(1); tick(4); park();
    ok(G.mats.families.snow.materials>0,'the ski field enrols its snow surfaces on build ('+
       G.mats.families.snow.materials+')');
    ok(G.mats.families.corrugate.materials>0,'and its corrugate roofs ('+
       G.mats.families.corrugate.materials+')');
    const gnd=G.skiGround;
    ok(!!gnd&&gnd.material.userData.matFamily==='snow',
       'and the ski ground itself is the snow scan, not the carpark grass ('+
       (gnd?gnd.material.userData.matFamily:'-')+')'); }

  X.boot({biome:'carpark'}); X.startGame(1); tick(6);   // hand the world back as it was found
}

/* ============================================================
   REPLAT P3b — THE TILING BREAKUP, and Eric's other two P3 verdicts.
   ============================================================
   The shader itself cannot be run in node, so what this section proves is everything AROUND it
   that can be: that it INSTALLED, that its constants are the pinned ones, that it is scoped to the
   surfaces where rotating a tile is safe, and that the override seam every variant strip rides on
   cannot silently drop a leaf. Each one of those is a bug this piece actually shipped and had to
   photograph its way back out of, which is why they are assertions and not comments. */
C.section('REPLAT P3b: the tiling breakup');
{
  const MATS=X.MATS, FAM=MATS.families, NAMES=Object.keys(FAM), B=MATS.breakup;
  const near=(a,b,eps,what)=>ok(Math.abs(a-b)<=(eps||1e-6),what+' ('+a+' vs '+b+')');
  X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();

  /* ---- IT INSTALLED AT ALL ----
     THE FIRST CUT OF THE BREAKUP WAS A SILENT NO-OP FOR ITS WHOLE FIRST LIFE. onBeforeCompile
     hands you the shader with its `#include <...>` directives UNRESOLVED, so surgery written
     against the expanded chunk text matched nothing, replaced nothing and threw nothing: the
     uniforms all read correctly, the frame looked almost right, and a runtime A/B of breakup-on
     against breakup-off came back BYTE-IDENTICAL. That is the only reason it was caught.
     So the substrings are validated against the three that is actually installed, once, at module
     scope — and this is the assertion that turns a three upgrade renaming a chunk into a RED GATE
     instead of a car park that quietly goes back to looking tiled. */
  ok(!!G.mats.breakup,'the breakup reports its own install state in scene state (G.mats.breakup)');
  ok(G.mats.breakup.ok===true,'THE BREAKUP INSTALLED — every shader chunk it rewrites still '+
     'contains the line it rewrites ('+(G.mats.breakup.ok===true?'ok':G.mats.breakup.why)+')');
  { const C2=H.THREE.ShaderChunk||{};
    for(const n of ['map_fragment','roughnessmap_fragment','normal_fragment_maps'])
      ok(typeof C2[n]==='string'&&C2[n].length>0,'three still has ShaderChunk.'+n);
    /* and the three lines by name, so a rename says WHICH one moved */
    ok((C2.map_fragment||'').indexOf('texture2D( map, vMapUv )')>=0,
       'map_fragment still samples map at vMapUv');
    ok((C2.roughnessmap_fragment||'').indexOf('texelRoughness.g')>=0,
       'roughnessmap_fragment still reads roughness from the GREEN channel');
    ok((C2.normal_fragment_maps||'').indexOf('vec3 mapN = texture2D( normalMap, vNormalMapUv )')>=0,
       'normal_fragment_maps still builds mapN from a tangent-space sample'); }

  /* ---- THE CONSTANTS ARE THE PINNED ONES, AND THE REJECTED KNOB IS PINNED AT ZERO ----
     varRestore is the one that matters. Run at 1.0 alongside blendSharp 4 it drew the lattice as
     dark hexagonal cell borders across the whole car park — photographed, on the strip, variant D.
     It is correct arithmetic (it restores exactly the variance three-tap blending removes) and it
     is perceptually wrong without a histogram-preserving transform, because it boosts contrast
     hardest precisely where the blend is widest, which is on the seams. Kept at 0 rather than
     deleted, and PINNED at 0 here so it cannot drift back up by accident. */
  ok(B.varRestore===0,'the variance restore is pinned OFF — measured, it draws the lattice it was '+
     'meant to hide (varRestore '+B.varRestore+', see the strip in ARTBIBLE)');
  ok(B.blendSharp>1,'the blend weights ARE sharpened, which is what actually recovers the contrast '+
     'a 3-tap blend costs — most of the surface becomes one tap at native contrast (blendSharp '+
     B.blendSharp+')');
  ok(B.macroAmount>0&&B.macroRough>0,'the macro variation layer drives BOTH albedo and roughness — '+
     'weathering changes how a surface scatters, not only how dark it is ('+B.macroAmount+' / '+
     B.macroRough+')');
  /* THE MACRO SCALE MUST NOT BE A TILE MULTIPLE, which is the whole point of "never aligns with
     the tile". Asserted against EVERY family's tile, derived, not eyeballed. */
  /* SCOPED TO THE ISOTROPIC FAMILIES, because they are the only ones the lattice and the macro
     layer ever touch. The first cut of this checked all eight and went red on corrugate at 2.7 m
     against a 2.6 m patch — a true statement about two numbers and a meaningless one about the
     game, since a corrugate roof is never rotated per tile. The bound has to be scoped to where
     the mechanism runs, or it fails on facts that do not matter. */
  { const ISOT=NAMES.filter(f=>FAM[f].iso).map(f=>FAM[f].tileM);
    for(const f of NAMES.filter(f=>FAM[f].iso)){ const r=B.macroM/FAM[f].tileM;
      ok(Math.abs(r-Math.round(r))>0.15,'the macro layer does not align with the '+f+' tile ('+
         B.macroM+'m / '+FAM[f].tileM+'m = '+r.toFixed(3)+' tiles, and a whole number would lock)');
      ok(Math.abs(B.patchM-FAM[f].tileM)>0.2,
         'and the patch lattice is not the same size as the '+f+' tile either ('+B.patchM+' vs '+
         FAM[f].tileM+') — a lattice on the tile grid would draw a second grid'); }
    ok(B.macroM>3*Math.max(...ISOT),
       'the macro layer is well ABOVE the largest tile it runs on, so it reads as weathering '+
       'rather than as more texture ('+B.macroM+'m against a largest iso tile of '+
       Math.max(...ISOT)+'m)'); }

  /* ---- IT IS SCOPED TO THE SURFACES WHERE ROTATING A TILE IS SAFE ----
     This is the assertion with the most teeth in the section. Rotating a tile is only safe on an
     ISOTROPIC material: gravel, asphalt, dry grass and snow have no grain, so a rotated patch is
     the same material. Weatherboard laps, corrugate ribs, brick courses and concrete form lines
     are DIRECTIONAL — rotating those would tilt the laps and lean the courses, which is a worse
     defect than the repetition being cured. */
  { const ISO=NAMES.filter(f=>FAM[f].iso), DIR=NAMES.filter(f=>!FAM[f].iso);
    ok(ISO.length>=4&&DIR.length>=4,'the families split into isotropic and directional ('+
       ISO.join(',')+' | '+DIR.join(',')+')');
    for(const f of ISO) ok(FAM[f].iso===true,f+' is isotropic, so a rotated tile is the same material');
    /* the four DIRECTIONAL ones by name and by REASON, so a future session cannot flip one
       without meeting the sentence that says why it must not */
    for(const [f,why] of [['weatherboard','its laps must run level'],
                          ['corrugate','its ribs must run down the slope'],
                          ['brick','its courses must stay horizontal'],
                          ['concrete','its form lines must stay level']])
      ok(FAM[f]&&FAM[f].iso===false,f+' is NOT rotated per tile, because '+why);
    /* and the gate is read from the FAMILY, not from a list kept here: every material carrying
       breakup uniforms must belong to an iso family, in both maps. */
    const bad=[];
    for(const b of ['carpark','skifield']){ X.boot({biome:b}); X.startGame(1); tick(4); park();
      G.scene.traverse(o=>{ const m=o.material;
        if(!(o.isMesh&&m&&m.userData))return;
        const f=m.userData.matFamily; if(!f)return;
        const hasU=!!m.userData.keaU;
        if(hasU!==!!FAM[f].iso)bad.push(b+':'+f+(hasU?' HAS':' LACKS')+' breakup'); }); }
    X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();
    ok(bad.length===0,'EVERY breakup material is an isotropic family and every isotropic family '+
       'material has it — in both maps'+(bad.length?' — '+[...new Set(bad)].slice(0,4).join(' | '):'')); }

  /* ---- A DIRECTIONAL FAMILY CANNOT BE HANDED THE BREAKUP'S COMPILED PROGRAM ----
     three caches compiled programs, and the cache key includes `material.customProgramCacheKey()`,
     whose default return value is `this.onBeforeCompile.toString()`. That is the ONLY thing
     standing between a brick wall and the rotation shader: asphalt and brick can otherwise have
     identical program parameters — same maps, same uv channel, same lights, no vertex colours — so
     if the key did not separate them, three would be free to hand one the other's program and a
     brick wall would render with its courses rotated per tile. It would look like a material
     choice, not a bug.
     TWO CLAIMS, because they fail in opposite directions. Every ISO material must share ONE key
     (they run identical source and differ only in uniform values, so a per-family key would
     silently quadruple the compiles), and NO iso key may equal a NON-iso key. Both are read off
     the real materials rather than reasoned about. */
  { const iso=new Map(), dir=new Map();
    for(const b of ['carpark','skifield']){ X.boot({biome:b}); X.startGame(1); tick(4); park();
      G.scene.traverse(o=>{ const m=o.material;
        if(!(o.isMesh&&m&&m.userData&&m.userData.matFamily))return;
        const k=typeof m.customProgramCacheKey==='function'?m.customProgramCacheKey():'(none)';
        (m.userData.keaU?iso:dir).set(m.userData.matFamily+'|'+k,k); }); }
    X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();
    const isoKeys=new Set([...iso.values()]), dirKeys=new Set([...dir.values()]);
    ok(isoKeys.size===1,'every breakup material shares ONE program cache key, so the shader is '+
       'compiled once and not once per family ('+isoKeys.size+' distinct)');
    ok(dirKeys.size>=1,'the directional families have a key of their own ('+dirKeys.size+')');
    const shared=[...isoKeys].filter(k=>dirKeys.has(k));
    ok(shared.length===0,'and NO directional family shares a key with the breakup — that key is '+
       'the only thing stopping three handing a brick wall the rotation shader');
    /* AND THE KEY IS ACTUALLY THE ONE three DERIVES, not a stub. The default
       customProgramCacheKey returns onBeforeCompile.toString(), so a breakup material's key must
       contain the injected source and a directional one's must not — which is the mechanism
       spelled out, rather than a restatement of the two set comparisons above.
       (The first cut of this line was `ok(A && B || true, ...)`, which always passes. A vacuous
       assertion is worse than no assertion, so it is written properly or not at all.) */
    ok([...isoKeys][0].indexOf('MATBREAK')>=0||[...isoKeys][0].indexOf('keaTiles')>=0||
       [...isoKeys][0].indexOf('sh.fragmentShader')>=0,
       'the breakup key IS the injected onBeforeCompile source ('+
       [...isoKeys][0].slice(0,44).replace(/\s+/g,' ')+'...)');
    for(const k of dirKeys) ok(k.indexOf('fragmentShader')<0,
       'and a directional family key carries no shader surgery at all ('+
       k.slice(0,44).replace(/\s+/g,' ')+')'); }

  /* ---- THE PER-FAMILY PATCH UNIFORM IS DERIVED FROM THAT FAMILY'S OWN TILE ----
     uKeaPatch converts UV (which arrives in TILES, because repeat is 1/tileM) into the lattice's
     own units, so it has to carry tileM/patchM or the patch size would silently differ per family
     — 2.6 m on asphalt and 1.7 m on grass, from one constant that reads as if it were metres. */
  { let checked=0, bad=[];
    G.scene.traverse(o=>{ const m=o.material;
      if(!(o.isMesh&&m&&m.userData&&m.userData.keaU))return;
      const F=FAM[m.userData.matFamily], U=m.userData.keaU;
      checked++;
      if(Math.abs(U.uKeaPatch.value-F.tileM/B.patchM)>1e-9)
        bad.push(m.userData.matFamily+' '+U.uKeaPatch.value);
      if(Math.abs(U.uKeaMacro.value-1/B.macroM)>1e-12)bad.push(m.userData.matFamily+' macro'); });
    ok(checked>0,'breakup materials found to check ('+checked+')');
    ok(bad.length===0,'every one converts ITS OWN tile into lattice units, so the patch is the '+
       'same size in metres on every family'+(bad.length?' — '+bad.slice(0,3).join(' | '):'')); }

  /* ---- THE OVERRIDE SEAM CANNOT SILENTLY DROP A LEAF ----
     A whole variant strip was shot, composed and nearly judged on FOUR IDENTICAL FRAMES because
     the old override loop assigned `breakup` wholesale: KEAMATS='{"breakup":{"blendSharp":4}}'
     left patchM, macroM and both macro amounts undefined, the uniforms went NaN, and every variant
     was equally broken. A NaN uniform still renders something, and what it renders looks like a
     deliberate look. So the merge is depth-limited and leaf-wise, and it REPORTS what it ignored.
     Driven here through the real seam - the module-scope global the rig sets - by re-evaluating
     the specimen, which is the only honest way to test a module-scope merge. */
  { const {evalSpecimen}=require('../2026-08-26/keasrc');
    /* LAW 14, AND A SABOTAGE PROVED IT WAS NEEDED. The first cut of this let a throw out of
       evalSpecimen: sabotaging the merge back to a wholesale assign wiped seven of the eight
       family records, boot died on `undefined.iso`, and the battery printed A STACK TRACE AND NO
       VERDICT — so the sabotage came back with zero findings and read as a gap in the test rather
       than as the defect it was. It catches now, and the throw becomes a FINDING: no override
       should be able to stop the world from building, which is a claim worth making on its own. */
    const run=(over)=>{ const prev=globalThis.__KEA_MATS__;
      globalThis.__KEA_MATS__=over;
      let out={threw:null,MATS:null,ignored:[]};
      try{ const Y=evalSpecimen(H.THREE); Y.boot({biome:'carpark'});
           out={threw:null,MATS:Y.MATS,ignored:Y.G.mats.ignored.slice()}; }
      catch(e){ out={threw:(e&&e.message)||String(e),MATS:null,ignored:[]}; }
      finally{ globalThis.__KEA_MATS__=prev; }
      ok(!out.threw,'the override "'+JSON.stringify(over).slice(0,52)+'" does not stop the world '+
         'from building ('+(out.threw||'built')+')');
      return out; };
    const leaf=(r,path,dflt)=>{ let v=r.MATS; for(const k of path.split('.')){ if(!v)return dflt; v=v[k]; }
      return v===undefined?dflt:v; };

    { const r=run({breakup:{blendSharp:2.5}});
      ok(!!r,'the specimen re-evaluates under an override');
      near(leaf(r,'breakup.blendSharp',NaN),2.5,1e-9,'a nested leaf override takes');
      near(leaf(r,'breakup.patchM',NaN),B.patchM,1e-9,'AND ITS SIBLINGS SURVIVE — patchM is still there');
      near(leaf(r,'breakup.macroM',NaN),B.macroM,1e-9,'and macroM');
      near(leaf(r,'breakup.macroAmount',NaN),B.macroAmount,1e-9,'and macroAmount');
      ok(r.ignored.length===0,'and nothing was ignored ('+r.ignored.join(',')+')'); }

    { const r=run({families:{asphalt:{tint:0.9}}});
      near(leaf(r,'families.asphalt.tint',NaN),0.9,1e-9,'a two-level family override takes');
      near(leaf(r,'families.asphalt.tileM',NaN),FAM.asphalt.tileM,1e-9,'and its siblings survive too');
      near(leaf(r,'families.grass.tileM',NaN),FAM.grass.tileM,1e-9,'and the other families are untouched');
      ok(Object.keys(leaf(r,'families',{})).length===NAMES.length,
         'and ALL '+NAMES.length+' family records survive a one-family override — a wholesale '+
         'assign here is what sent four identical frames to a variant strip ('+
         Object.keys(leaf(r,'families',{})).length+')'); }

    /* EVERY SHAPE OF TYPO IS REPORTED BY PATH, because webrig refuses a pass that ignored
       something and the message has to say what. Four shapes, all of which have actually
       happened or nearly did. */
    for(const [over,want] of [
      [{nosuch:1},'nosuch'],
      [{breakup:{blendSharpp:9}},'breakup.blendSharpp'],
      [{families:{asfalt:{tint:0.8}}},'families.asfalt'],
      [{families:{asphalt:{tnit:0.8}}},'families.asphalt.tnit'],
    ]){ const r=run(over);
      ok(r.ignored.indexOf(want)>=0,'a misspelled override is REPORTED by path, not silently '+
         'dropped ('+want+' -> ['+r.ignored.join(',')+'])'); }

    /* AND A NaN CANNOT GET IN. This is the one that cost the strip: the value has to be a finite
       number of the same type as the leaf it replaces, or it is refused and reported. */
    for(const [over,want] of [
      [{breakup:{patchM:'2.6'}},'breakup.patchM (not a finite number: 2.6)'],
      [{breakup:{macroM:null}},'breakup.macroM (not a finite number: null)'],
    ]){ const r=run(over);
      ok(r.ignored.some(x=>x.indexOf(want.split(' (')[0])===0),
         'a non-numeric override is refused, so no uniform can go NaN ('+want.split(' (')[0]+
         ' -> ['+r.ignored.join(',')+'])');
      ok(isFinite(leaf(r,'breakup.patchM',NaN))&&isFinite(leaf(r,'breakup.macroM',NaN)),
         'and every breakup constant is still a finite number afterwards'); } }

  /* ---- ERIC'S THIRD VERDICT: THE ANCHOR BLOCK IS CONCRETE, NOT GRAVEL ---- */
  { X.boot({biome:'skifield'}); X.startGame(1); tick(4); park();
    let blk=null;
    G.scene.traverse(o=>{ const m=o.material;
      if(!(o.isMesh&&m&&m.userData&&m.userData.matFamily==='concrete'))return;
      if(o.geometry.type!=='BoxGeometry')return; blk=o; });
    ok(!!blk,'the ski tow top anchor is a CONCRETE-family mesh, not gravel — Eric called the '+
       'gravel a mis-assignment and a poured footing is what it is');
    if(blk){ const p=blk.geometry.parameters;
      ok(Math.abs(p.width-1.8)<1e-6&&Math.abs(p.depth-1.4)<1e-6,
         'and it is the same 1.8 x 1.4 m block it always was — the MATERIAL changed, not the world ('+
         p.width+' x '+p.height+' x '+p.depth+')');
      ok(!blk.material.userData.keaU,
         'and it does NOT get per-tile rotation, because concrete form lines must stay level'); }
    /* nothing else may have quietly joined the gravel family's old colour */
    ok(X.MATFAM[0x9B9891]==='gravel','PAL.gravel still means gravel');
    ok(X.MATFAM[0xA9A7A2]==='concrete','and the footing has a hex of its own, so one family\'s '+
       'colour cannot speak for another object\'s material');
    X.boot({biome:'carpark'}); X.startGame(1); tick(4); park(); }

  /* ---- ERIC'S SECOND VERDICT: THE FOUR TINTS PASS AS-IS ----
     Recorded as a pin rather than left implicit. These are Eric's accepted taste values; a session
     that wants to move one is welcome to, and should have to change this line to do it. */
  { const WANT={gravel:0.35,asphalt:0.45,brick:0.20,snow:0.55};
    for(const [f,v] of Object.entries(WANT))
      near(FAM[f].tint,v,1e-9,f+' keeps the tint Eric accepted at the P3 judgement'); }

  X.boot({biome:'carpark'}); X.startGame(1); tick(6);   // hand the world back as it was found
}

/* ============================================================
   REPLAT P4 — INSTANCED GRASS. The recipe becomes law.
   ============================================================
   P4's proof contract is three claims: instance count and LOD thresholds asserted, frame budget
   measured and recorded, and wind deterministic under the capture clock pin. The shader cannot run
   in node, so what is proved here is everything around it that can be — and, as with P3b, every
   one of these is a bug this piece actually shipped and had to photograph its way out of. */
C.section('REPLAT P4: instanced grass');
{
  const GR=X.GRASS, T=X.grassTier();
  const near=(a,b,eps,what)=>ok(Math.abs(a-b)<=(eps||1e-6),what+' ('+a+' vs '+b+')');
  X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();

  // ---- THE SHADER INSTALLED AT ALL ----
  /* THE SAME TRAP AS P3b, AND IT CAUGHT THE SAME WAY: onBeforeCompile hands you a shader whose
     `#include` directives are unresolved, so surgery against expanded chunk text matches nothing
     and throws nothing. A field with no wind, no thinning and no transmission looks ALMOST right.
     Validated at module scope against the three that is installed, reported in scene state, and
     the capture rig refuses to photograph a pass where it did not take. */
  ok(!!G.grass,'the grass reports itself in scene state (G.grass)');
  ok(G.grass.shader===true,'THE BLADE SHADER INSTALLED — every chunk it rewrites still contains the '+
     'line it rewrites ('+(G.grass.shader===true?'ok':G.grass.shader)+')');
  { const C2=H.THREE.ShaderChunk||{};
    ok((C2.begin_vertex||'').indexOf('vec3 transformed = vec3( position );')>=0,
       'begin_vertex still declares transformed the way the blade hooks it');
    ok((C2.lights_fragment_end||'').indexOf('#if defined( RE_IndirectDiffuse )')>=0,
       'lights_fragment_end still has the seam the transmission adds into');
    const F=(H.THREE.ShaderLib&&H.THREE.ShaderLib.physical&&H.THREE.ShaderLib.physical.fragmentShader)||'';
    ok(F.indexOf('vec4 diffuseColor = vec4( diffuse, opacity );')>=0,
       'and meshphysical_frag still declares diffuseColor where the blade tint replaces it'); }

  // ---- INSTANCE COUNT AND LOD THRESHOLDS, WHICH THE CONTRACT NAMES ----
  ok(T.count>0,'the tier declares an instance count ('+T.count+')');
  ok(G.grass.instances===0&&G.grass.headless===true,
     'headless builds no field — there is no GPU to instance onto — but declares what it would ('+
     G.grass.count+' blades)');
  near(G.grass.count,T.count,0,'and the count it declares is the tier it was asked for');
  /* THE THRESHOLDS ARE DERIVED FROM THE RADIUS, NEVER TYPED TWICE. A tier given a lodFar that
     disagreed with the radius it draws over would thin blades that are still inside the field, or
     draw blades past its edge — and both read as "the grass is broken" rather than as a number
     being wrong. There is one number and the rest come off it. */
  near(T.lodFar,T.near,1e-9,'the outer LOD threshold IS the field radius, so nothing is drawn past it');
  near(T.lodNear,T.near*GR.lodFrac,1e-9,'and the inner one is the pinned fraction of it');
  ok(T.lodNear<T.lodFar,'full density inside, fading out to the edge ('+T.lodNear.toFixed(1)+
     '..'+T.lodFar+' m)');
  ok(GR.fadeBand>0&&GR.fadeBand<0.5,'the fade band is a real window, so a blade shrinks out rather '+
     'than popping ('+GR.fadeBand+')');
  /* NO DEAD KNOBS IN THE RECIPE. A constant nothing reads is a knob that lies about being
     connected: a later session tunes it, photographs no change, and concludes the feature is
     broken. There were two — a top-level `clumpM` and `bare` that the per-biome values shadowed —
     and a sabotage zeroing one of them stayed GREEN, which is how they were found. Every
     top-level scalar must be reachable from the shader source or the uniform block that feeds it. */
  /* THE SEARCH IS STRUCTURAL, NOT TEXTUAL, and the first cut of it was not: it looked for the bare
     key name anywhere in the shader source and matched the word "bare" inside its own COMMENT
     about bare ground, so reintroducing the dead knob stayed green. Third time this file has been
     caught matching its own prose. A consumer is a `GRASS.<key>` reference AFTER the recipe block
     ends — the block itself is the declaration and cannot count as a use of what it declares. */
  { const src=require('../2026-08-26/keasrc').specimenSource();
    const after=src.slice(src.indexOf('matMerge(GRASS,'));
    ok(after.length>1000,'there is source after the recipe block to look in ('+after.length+' chars)');
    const dead=[];
    for(const k of Object.keys(GR)){
      if(typeof GR[k]!=='number')continue;                 // tier/biome tables are checked above
      if(after.indexOf('GRASS.'+k)<0)dead.push(k); }
    ok(dead.length===0,'every top-level GRASS scalar is actually read by something'+
       (dead.length?' — DEAD KNOBS: '+dead.join(', ')+' (a constant nothing reads is a knob that '+
        'lies about being connected)':' ('+
        Object.keys(GR).filter(k=>typeof GR[k]==='number').length+' checked)'));

    /* ---- AND THE SWEEP NOW GOES INSIDE THE BLOCKS — REPLAT P4d ----
       The check above skips anything that is not a top-level number, which is every nested block:
       cover, ground, tiers, biomes. P4d added GRASS.ground.{segs,maskScale} and a knob that lies
       about being connected is no less of a lie for living one level down.
       IT MATCHES THE LEAF NAME, NOT `GRASS.<block>.<leaf>`, AND THAT IS FORCED BY HOW THE LEAVES
       ARE ACTUALLY READ. A layer spec reaches the shader as `L.taper` off a merged copy, and the
       terrain reads `GRD.segs` off a local alias — so a fully-qualified search would report every
       one of them dead. Comments are stripped first, for the fourth time in this file: an
       assertion matches code, never the prose written about it.
       ITS LIMIT, STATED. A leaf whose name collides with an unrelated property elsewhere in the
       file would pass vacuously. It is a tripwire for a NEWLY ADDED knob, whose name is the one
       thing under the author's control, and not a proof that every leaf is live. */
    { const code=after.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
      const deadLeaf=[], seen=[];
      const walk=(o,path,depth)=>{ for(const [k,v] of Object.entries(o)){
        if(v&&typeof v==='object'&&!Array.isArray(v)){ if(depth>0)walk(v,path+k+'.',depth-1); continue; }
        if(typeof v!=='number')continue;
        if(seen.indexOf(k)>=0)continue; seen.push(k);
        if(code.indexOf('.'+k)<0)deadLeaf.push(path+k); } };
      for(const k of Object.keys(GR)) if(GR[k]&&typeof GR[k]==='object'&&!Array.isArray(GR[k]))
        walk(GR[k],k+'.',1);
      ok(deadLeaf.length===0,'and every NESTED numeric leaf is read by name too'+
         (deadLeaf.length?' — DEAD KNOBS: '+deadLeaf.join(', '):' ('+seen.length+' leaf names checked)')); } }
  near(T.density,T.count/(Math.PI*T.near*T.near),1e-6,
     'the reported density IS count over the disc it covers ('+Math.round(T.density)+' blades/m2)');
  ok(T.density>90,'and it is a FIELD density, not the 33 blades/m2 a world-sized static disc could '+
     'afford ('+Math.round(T.density)+'/m2)');

  /* EVERY TIER IS COHERENT, not just the shipped one — a tier nobody has selected lately is
     exactly where a bad number waits. */
  { const keep=GR.tier;
    for(const t of Object.keys(GR.tiers)){ GR.tier=t; const q=X.grassTier();
      ok(q.count>0&&q.near>0,t+' declares a count and a radius ('+q.count+' in r'+q.near+'m)');
      ok(q.lodNear<q.lodFar&&q.lodFar===q.near,t+' has coherent thresholds');
      ok(q.density>90,t+' is a field density ('+Math.round(q.density)+'/m2)'); }
    GR.tier=keep; }

  // ---- THE FIELD FOLLOWS THE CAMERA, WHICH IS THE WHOLE DESIGN ----
  /* A static field over the playable world can afford 33 blades/m2 at this budget and photographs
     as stubble; shrinking its radius to raise density just moves the grass away from the bird,
     which is what the density sweep in ARTBIBLE shows. The anchor is what fixes that, and it has
     to be WRITTEN EVERY FRAME — left at its initial (0,0) the field is a disc round the world
     origin and the foreground is empty, which is precisely the failure it was introduced to cure
     and photographs identically to "the grass did not build". */
  { const src=require('../2026-08-26/keasrc').specimenSource();
    ok(/U\.uAnchor\.value\.set\(/.test(src),'the anchor is written from the frame loop');
    ok(/Math\.round\(c\.position\.x\/q\)\*q/.test(src),
       'and it is SNAPPED to a grid, so the field cannot swim under a creeping camera');
    ok(GR.snap>0&&GR.snap<=1,'the snap is small enough to stay inside the fade band ('+GR.snap+' m)');
    const vs=X.GRASS_GLSL_V;
    ok(vs.indexOf('vec2 w=uAnchor+aOff*uNear;')>0,
       'and the blade takes its world position from that anchor plus its lattice offset'); }

  // ---- WIND: DETERMINISTIC UNDER THE CAPTURE CLOCK PIN ----
  /* The contract names this explicitly. The capture rig holds G.time at 12.0 on every animation
     frame, so a photographed frame is a fixed frame — but ONLY if the wind is a function of that
     clock and nothing else. A single performance.now() or Date.now() in the blade shader's driver
     would make every vantage in the set irreproducible, and it would look like flakiness rather
     than like a bug. */
  { const src=require('../2026-08-26/keasrc').specimenSource();
    const vs=X.GRASS_GLSL_V;
    ok(vs.indexOf('uTime*uGustHz')>0&&vs.indexOf('uTime*uFlutterHz')>0,
       'both wind frequencies are functions of uTime');
    /* COMMENTS STRIPPED FIRST. The first cut searched the raw shader source and went red against
       the COMMENT that explains the shader reads no clock — the same self-matching trap the P3
       weatherboard check fell into. Assertions match code, never the prose written about it. */
    const code=vs.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
    ok(code.indexOf('performance.now')<0&&code.indexOf('Date.now')<0,
       'and the shader reads no clock of its own');
    ok(/U\.uTime\.value=G\.time;/.test(src),
       'uTime IS G.time — the clock the capture rig pins, and no other');
    /* and the driver block itself takes nothing else that varies per frame */
    const blk=src.slice(src.indexOf('if(G.grassMat&&G.grassMat.userData.keaG)'),
                        src.indexOf('if(G.grassMat&&G.grassMat.userData.keaG)')+900);
    ok(blk.indexOf('performance.now')<0&&blk.indexOf('Date.now')<0&&blk.indexOf('Math.random')<0,
       'the per-frame grass driver reads no wall clock and no randomness at all');
    ok(GR.windGust>0&&GR.windFlutter>0,'both wind terms are actually on ('+GR.windGust+' / '+
       GR.windFlutter+')');
    ok(GR.windGust>GR.windFlutter,'and the slow gust leads the fast flutter, so the field moves as '+
       'one thing rather than shimmering'); }

  // ---- THE BLADE IS A BLADE ----
  /* TAPER IS PER LAYER AT P4b — a cover blade is blunter than a clump leaf — so the probe takes
     the clump layer's taper off the biome profile rather than a top-level constant that no longer
     exists. Reading GR.taper here returned undefined and the width came back NaN. */
  { const g=X.grassBladeGeo(GR.seg,GR.biomes.carpark.taper,GR.bend);
    const pos=g.attributes.position, n=pos.count;
    ok(n===2*GR.seg+1,'the blade is a strip with a POINTED tip — '+n+' vertices for '+GR.seg+
       ' segments, not a squared-off ribbon');
    ok(g.userData.tris===2*GR.seg-1,'and '+g.userData.tris+' triangles');
    /* it must TAPER and it must ARC: a blade that neither narrows nor curves is a fence paling,
       and ref_bow_02's grass is all curve */
    let wBase=0,wTip=1e9,zBase=0,zTip=0;
    for(let i=0;i<n;i++){ const y=pos.getY(i), ax=Math.abs(pos.getX(i));
      if(y<1e-6){ wBase=Math.max(wBase,ax); zBase=pos.getZ(i); }
      if(y>1-1e-6){ wTip=Math.min(wTip,ax); zTip=pos.getZ(i); } }
    ok(wBase>0.4,'it is full width at the base ('+wBase.toFixed(3)+')');
    ok(wTip<0.02,'and comes to a point at the tip ('+wTip.toFixed(4)+')');
    /* IT MUST ACTUALLY ARC, not merely agree with its own constant. The first cut of this only
       compared the geometry against GRASS.bend — so setting bend to zero made the assertion
       VACUOUSLY TRUE and a field of straight spikes sailed through. Caught by exactly that
       sabotage. The bound comes first, then the agreement. */
    ok(GR.bend>0.1,'the blade is pinned to a real arc, not a straight spike (bend '+GR.bend+')');
    near(zTip-zBase,GR.bend,1e-6,'and the geometry arcs forward by exactly that much');
    /* THE NORMALS ARE ONE SHEET, DELIBERATELY. A blade is one triangle thick; face normals on a
       curved strip swing through ninety degrees and make the whole field read as noise under a
       directional sun. */
    const nr=g.attributes.normal; let sheet=true;
    for(let i=0;i<nr.count;i++) if(nr.getZ(i)!==1||nr.getX(i)!==0||nr.getY(i)!==0)sheet=false;
    ok(sheet,'every vertex normal is the same sheet normal, not a computed face normal'); }

  // ---- BLADE WIDTH IS IN METRES, WHICH COST THIS PIECE A WHOLE PHOTOGRAPH ----
  /* The first cut carried the old code's width numbers straight over. They were a MULTIPLIER on a
     95 mm plane and became an ABSOLUTE width the moment the geometry went unit-sized, so the field
     came back as metre-wide angular shards. Real pasture grass is 4-10 mm across and a tussock
     leaf is narrower; anything above about 3 cm is not a blade. */
  for(const [b,B] of Object.entries(GR.biomes)){
    ok(B.w[0]>0.001&&B.w[1]<0.03,b+' blade width is a BLADE WIDTH in metres, not a multiplier ('+
       (B.w[0]*1000).toFixed(1)+'-'+(B.w[1]*1000).toFixed(1)+' mm)');
    ok(B.w[0]<B.w[1]&&B.h[0]<B.h[1],b+' width and height are ranges the right way round');
    ok(B.h[1]<1.6,b+' blades are grass-height, not reeds ('+B.h[1]+' m)');
    ok(B.bare>0&&B.bare<0.75,b+' leaves real bare ground between the mounds ('+
       (B.bare*100).toFixed(0)+'% of cells)'); }
  /* TUSSOCK IS A SHAPE CLAIM, NOT A COLOUR ONE. The brief asked for tussock-shaped blades in the
     alpine biome, and a tussock leaf is longer, narrower and stands closer to upright than pasture
     grass, in tighter mounds with more open ground between. Asserted as the RELATION between the
     two profiles, so it survives both being retuned. */
  { const c=GR.biomes.carpark, s=GR.biomes.skifield;
    ok(s.h[1]>c.h[1],'the alpine blade is LONGER than the pasture blade ('+s.h[1]+' vs '+c.h[1]+' m)');
    ok(s.w[1]<c.w[1],'and NARROWER ('+(s.w[1]*1000).toFixed(1)+' vs '+(c.w[1]*1000).toFixed(1)+' mm)');
    ok(s.lean[1]<c.lean[1],'and stands closer to upright ('+s.lean[1]+' vs '+c.lean[1]+' rad)');
    ok(s.bare>c.bare,'and its mounds sit in more open ground ('+(s.bare*100).toFixed(0)+'% vs '+
       (c.bare*100).toFixed(0)+'%)');
    ok(s.clumpM>c.clumpM,'in a coarser mound spacing ('+s.clumpM+' vs '+c.clumpM+' m)'); }

  // ---- THE CUT-OUTS FIT, AND THEY COVER WHAT THEY USED TO ----
  /* The reject mask used to be a CPU closure per biome. A camera-anchored field decides where a
     blade stands in the shader, so the same information travels as four uniform boxes — and four
     is a hard limit, so a fifth would be a silent truncation rather than a compile error. */
  for(const b of ['carpark','skifield']){
    const cuts=X.grassCuts(b);
    ok(cuts.length===4,b+' passes exactly the four cut-out boxes the shader has uniforms for ('+
       cuts.length+')');
    ok(cuts.every(c=>c.length===4),'and each is a centre and a half-extent');
    const live=cuts.filter(c=>c[3]>0);
    ok(live.length>=3,b+' actually cuts things out ('+live.length+' live boxes)'); }
  /* the carpark cut-outs still cover the surfaces they always did — a blade growing through the
     road or the car park is the loudest possible way to get this wrong */
  { const cuts=X.grassCuts('carpark');
    const inside=(x,z)=>cuts.some(c=>c[3]>0&&Math.abs(x-c[0])<c[2]&&Math.abs(z-c[1])<c[3]);
    ok(inside(0,34),'the road is cut out');
    ok(inside(2,17),'the car park is cut out');
    ok(inside(-24,-9),'the hut slab is cut out');
    ok(!inside(-40,-40),'and open country is not ('+(-40)+','+(-40)+')'); }

  // ---- THE SKI FIELD GREW GRASS FOR THE FIRST TIME ----
  { X.boot({biome:'skifield'}); X.startGame(1); tick(4); park();
    ok(G.grass&&G.grass.biome==='skifield','the ski field builds a field of its own');
    ok(G.grass.bare===GR.biomes.skifield.bare,'with the alpine profile, not the carpark one ('+
       G.grass.bare+')');
    const cuts=X.grassCuts('skifield');
    const inside=(x,z)=>cuts.some(c=>c[3]>0&&Math.abs(x-c[0])<c[2]&&Math.abs(z-c[1])<c[3]);
    ok(inside(X.SKIPISTE?0:20,0)||inside(20,0),'the groomed run is cut out');
    X.boot({biome:'carpark'}); X.startGame(1); tick(4); park(); }

  // ---- THE FRAME BUDGET IS RECORDED, WHICH THE CONTRACT ALSO NAMES ----
  /* A battery cannot time a GPU. What it CAN do is refuse to let the recorded numbers quietly
     disappear: the measured cost of every tier lives in ARTBIBLE under REPLAT P4, and this checks
     the tiers named in the recipe are the tiers the measurement wrote down. A tier added later
     without a measurement goes red here rather than shipping unmeasured. */
  { const fs=require('fs'), path=require('path');
    const ab=fs.readFileSync(path.join(__dirname,'../../ARTBIBLE.md'),'utf8');
    const sec=ab.slice(ab.indexOf('## REPLAT P4'));
    ok(sec.length>400,'ARTBIBLE carries a REPLAT P4 section');
    ok(/8\.98\s*ms|8\.978/.test(sec),'and it records the pre-P4 baseline the tiers are measured against');
    /* THE DOCUMENT WRITES "120,000" BECAUSE IT IS PROSE FOR A PERSON; the recipe writes 120000
       because it is code. Normalise the separators rather than making the table harder to read —
       an assertion should bend to the document, not the other way round. */
    const flat=sec.replace(/,/g,'');
    for(const t of Object.keys(GR.tiers))
      ok(flat.indexOf(String(GR.tiers[t].count))>=0,
         'the measured cost of tier "'+t+'" ('+GR.tiers[t].count+' blades) is recorded there');
    ok(sec.indexOf('ms')>=0,'in milliseconds'); }

  X.boot({biome:'carpark'}); X.startGame(1); tick(6);   // hand the world back as it was found
}

/* ============================================================
   REPLAT P4b — Eric played it. Four fixes, four contracts.
   ============================================================ */
C.section('REPLAT P4b: the field Eric played');
{
  const GR=X.GRASS, near=(a,b,eps,what)=>ok(Math.abs(a-b)<=(eps||1e-6),what+' ('+a+' vs '+b+')');
  X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();
  const src=require('../2026-08-26/keasrc').specimenSource();

  /* ---- (1) THE OLD PROCEDURAL GRASS IS GONE, NOT DISABLED ----
     Eric's diagnosis was that BOTH systems were live: the P4 blade field and the cone/tuft grass it
     superseded, so the ground read as sand with party hats. A superseded system left in the tree is
     not a fallback, it is a second answer to the same question — and this is the assertion that
     stops it coming back, because the shape it came back as last time was "harmless, and it keeps
     the seeded stream still". */
  ok(!/new THREE\.ConeGeometry\(0\.34,0\.9,5\)/.test(src),
     'the 260 five-sided tussock cones are GONE from the carpark');
  ok(!/cyl\(0\.02,0\.3,0\.85,PAL\.tussock/.test(src),
     'and the 26 tuft cylinders are gone from the ski field');
  ok(!/cyl\(0\.02,0\.05,rnd\(0\.25,0\.45\),PAL\.tussock/.test(src),
     'and the five on the nest knoll');
  /* nothing may quietly re-scatter PAL.tussock as geometry again; it survives only as a TERRAIN
     vertex colour, which is the ground and not a blade */
  { const uses=(src.match(/PAL\.tussock/g)||[]).length;
    const colourUses=(src.match(/Color\(PAL\.tussock\)/g)||[]).length;
    /* the +1 in the first cut was for the palette declaration, which is written `tussock:0xC9992F`
       and does not match `PAL.tussock` at all — so the bound was one too high and went red on
       correct code. EVERY use must be a vertex colour; none may be geometry. */
    ok(uses===colourUses&&uses>0,'PAL.tussock survives only as a terrain vertex colour — no '+
       'scattered geometry wears it ('+uses+' uses, '+colourUses+' of them colours)'); }

  /* ---- (2) A CONTINUOUS COVER LAYER, WITH NO BARE GROUND BY CONSTRUCTION ---- */
  const CV=GR.cover;
  ok(!!CV&&CV.count>0,'there is a cover layer at all ('+(CV?CV.count:0)+' blades)');
  ok(CV.bare===0,'IT LEAVES NO CELL EMPTY — bare must be exactly zero or the layer whose whole job '+
     'is that no ground shows has holes in it by design ('+CV.bare+')');
  ok(CV.clumpPull<0.2,'and it is laid nearly uniformly rather than gathered into mounds ('+
     CV.clumpPull+')');
  ok(CV.h[1]<GR.biomes.carpark.h[0],'the cover is SHORTER than the shortest clump blade, so the '+
     'clumps rise out of it ('+CV.h[1]+' m against '+GR.biomes.carpark.h[0]+' m)');
  ok(CV.h[1]<0.20,'and short enough not to cost the bird the readability P4 tuned ('+CV.h[1]+' m)');
  { const d=CV.count/(Math.PI*CV.near*CV.near);
    ok(d>GR.tiers[GR.tier].count/(Math.PI*GR.tiers[GR.tier].near*GR.tiers[GR.tier].near),
       'the cover is DENSER than the clump layer ('+Math.round(d)+' vs '+
       Math.round(GR.tiers[GR.tier].count/(Math.PI*GR.tiers[GR.tier].near*GR.tiers[GR.tier].near))+
       '/m2) — it has to fill what the clumps deliberately leave'); }
  /* IT HOLDS FULL DENSITY ALMOST TO ITS EDGE, unlike the clump layer. They do different jobs: a
     clump is a silhouette and can fade early, a cover that has half-faded leaves the bare ground it
     was added to cure. */
  ok(CV.lodFrac>GR.lodFrac,'the cover thins later than the clumps do ('+CV.lodFrac+' vs '+
     GR.lodFrac+' of radius)');
  ok(CV.seg<GR.seg,'and its blades are cheaper, because a 100 mm blade does not need to arc ('+
     CV.seg+' segments against '+GR.seg+')');
  ok(!!G.grass.cover&&G.grass.cover.count===CV.count,
     'and scene state reports it, so a pass can tell whether it was built ('+
     (G.grass.cover||{}).count+')');

  /* ---- (3) REAL COLOUR, PER BLADE AND PER CLUMP ----
     The failure was not the mechanism, it was the palette: four colours inside twenty degrees of
     hue photographed as one. So the assertion is about SEPARATION, measured, not about the
     mechanism being present. */
  { const lum=h=>{const c=new H.THREE.Color(h);return 0.2126*c.r+0.7152*c.g+0.0722*c.b;};
    const hue=h=>{const c=new H.THREE.Color(h),o={};c.getHSL(o);return o.h*360;};
    for(const [b,B] of Object.entries(GR.biomes)){
      ok(B.base!==undefined&&B.tip!==undefined,b+' declares a base and a tip colour');
      /* the base must be GREEN and the tip must be BROWN — a green base that is merely a duller
         gold is the thing that shipped and did not read */
      const hb=hue(B.base);
      ok(hb>60&&hb<140,b+' base is a real green, not a duller gold (hue '+hb.toFixed(0)+' deg)');
      ok(lum(B.tip)<lum(B.tint[0]),b+' tip is DARKER than the body, so a rust tip reads against it');
      /* and the three body draws must actually differ */
      const ls=B.tint.map(lum);
      ok(Math.max.apply(null,ls)/Math.min.apply(null,ls)>1.8,
         b+' the three body colours span a real value range ('+
         ls.map(v=>v.toFixed(3)).join(' / ')+')');
      ok(Math.abs(lum(B.base)-lum(B.tint[2]))>0.15,
         b+' and the green base is nowhere near the pale stalk it has to read against'); } }
  { const vs=X.GRASS_GLSL_V;
    ok(vs.indexOf('vGrassSeed=uSeed*')>0,'how rust a leaf has gone is PER BLADE, so some are green '+
       'to the end and some are brown from halfway'); }

  /* ---- (4) THE BLADE IS A LEAF, NOT A STRAND ---- */
  for(const [b,B] of Object.entries(GR.biomes)){
    ok(B.taper!==undefined,b+' carries its own taper (a cover blade is blunter than a clump leaf)');
    ok(B.taper<0.65,b+' the leaf stays wide most of its length rather than tapering from the base ('+
       B.taper+')');
    ok(B.w[1]>=0.012,b+' and it is wide enough to catch light along its edge ('+
       (B.w[1]*1000).toFixed(1)+' mm)');
    ok(B.w[1]<0.03,b+' while still being a blade and not a strap ('+(B.w[1]*1000).toFixed(1)+' mm)'); }

  /* ---- THE GROUND, WHICH IS THE HALF NO BLADE COULD FIX ----
     Measured at the play camera, the terrain averaged #9b9787 — a desaturated grey-beige, and that
     is what showed between every clump. No density of sub-pixel blades covers it; the ground's own
     colour had to change. It is a multiplier on the GRASS-family terrain only. */
  ok(GR.groundTint!==undefined,'the terrain under the field carries a tint of its own');
  { const c=new H.THREE.Color(GR.groundTint), o={}; c.getHSL(o);
    ok(o.h*360>60&&o.h*360<140,'and it pulls the ground toward green rather than sand (hue '+
       (o.h*360).toFixed(0)+' deg)');
    ok(o.s>0.15,'with real saturation, because grey is what it is curing ('+o.s.toFixed(3)+')'); }
  ok(/fam==='grass'\?new THREE\.Color\(GRASS\.groundTint\)/.test(src),
     'it is applied to the GRASS family terrain only — the ski field ground is snow and snow is '+
     'not supposed to look like soil');

  /* ---- AND THE BIRD IS STILL VISIBLE, WHICH IS THE TRADE NOT TO UNDO ---- */
  ok(GR.biomes.carpark.h[1]<=0.50,'the clump blade height is still inside the readability tune P4 '+
     'measured against the subject floors ('+GR.biomes.carpark.h[1]+' m)');

  X.boot({biome:'carpark'}); X.startGame(1); tick(6);
}

/* ============================================================
   REPLAT P4c — NATURE HAS NO RIGHT ANGLES.
   ============================================================
   Eric played P4b and the field read in SQUARES. The cause was MEASURED before anything moved:
   shooting 14_player_view at clumpM 0.70 / 1.35 / 2.70 makes the square patches shrink and grow
   with it, which identifies the clump cell and nothing else. The model was one mound per SQUARE
   cell, and `bare` culled WHOLE CELLS — right-angled holes in the middle of the country. Three
   structural changes, and this section is the pin on all three. */
C.section('REPLAT P4c: nature has no right angles');
{
  const GR=X.GRASS, vs=X.GRASS_GLSL_V;
  X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();

  /* ---- (1) A MOUND IS THE NEAREST FEATURE POINT, NOT THE CENTRE OF ITS OWN CELL ----
     A jittered grid is still a grid: every cell contributes exactly one mound and its territory IS
     the cell, so the boundaries lie on cell edges however far the centre is moved. Taking the
     nearest of the 3x3 neighbourhood makes the territories irregular polygons that follow no cell
     edge, and a blade near a boundary goes to whichever mound is actually closer. */
  ok(GR.blobScan===true,'the blob scan is ON — mounds are overlapping territories, not tiles');
  ok(/for\(int j=-1;j<=1;j\+\+\)for\(int i=-1;i<=1;i\+\+\)/.test(vs),
     'and it really is a 3x3 neighbourhood search in the shader');
  ok(vs.indexOf('if(dd<bestD){ bestD=dd; cc=pt; cell=cn; }')>0,
     'taking the NEAREST feature point, which is what makes a territory irregular');
  /* AND THE MOUND IDENTITY TRAVELS WITH IT. `cell` has to become the winning neighbour, not stay
     the own cell — otherwise the height and colour of a blade still step at cell edges even though
     its position does not, and the squares come back in the COLOUR instead of the geometry. */
  ok(/cc=pt; cell=cn;/.test(vs),
     'the winning neighbour becomes the mound identity too, so height and colour follow the '+
     'territory rather than stepping at a cell edge');
  /* REPLAT P4d REWROTE THIS LINE'S PROSE, AND THE PROSE WAS THE BUG. It used to read "and it is
     skipped where the pull is negligible, because nine hash lookups per vertex is not free" — an
     exemption nobody ever shot, which kept the squares alive in the cover layer for a whole extra
     session. The uniform is still the switch; what it is allowed to switch OFF is now a named
     constant, asserted in the P4d section below. */
  ok(vs.indexOf('uBlobScan>0.5')>0,'the scan is switched by a uniform, so a layer can be exempted '+
     'from it at all — see REPLAT P4d for what may earn that exemption');

  /* ---- (2) BARE GROUND COMES OFF A SMOOTH FIELD, NOT A PER-CELL STEP ----
     This was the worst of it: culling a whole square cell puts four right angles in the middle of
     open country. A noise field gives a bare patch an outline that wanders. */
  ok(!/step\(uBare,keaGH\(cell/.test(vs),
     'the per-cell bare STEP is gone — that is what cut square holes in the field');
  ok(/smoothstep\(uBare-uBareSoft,uBare\+uBareSoft,keaFbm\(w\*uBareScale\)\)/.test(vs),
     'and bare ground is a smooth noise field with a soft, wandering boundary');
  ok(GR.bareScale>0&&GR.bareScale<1,'the bare field has a real scale ('+GR.bareScale+
     ' per metre, so patches are about '+(1/GR.bareScale).toFixed(1)+' m across)');
  ok(GR.bareSoft>0,'and a boundary width, so the edge of a bare patch is not a hard line ('+
     GR.bareSoft+')');
  /* the patches must be BIGGER than the mound spacing, or the noise just re-cuts the same grid at
     a different scale and nothing is gained */
  ok(1/GR.bareScale>GR.biomes.carpark.clumpM*2,
     'and bare patches are much larger than the mound spacing, so the field reads as drifts '+
     'rather than as a second lattice ('+(1/GR.bareScale).toFixed(1)+' m against '+
     GR.biomes.carpark.clumpM+' m)');

  /* ---- (3) THE FIELD'S EDGE IS RAGGED, NOT A DISC ----
     The fade was a pure function of distance from the camera, which is a perfect circle — the
     straight line's circular cousin, and it reads as a patch following the bird. */
  ok(GR.edgeVar>0,'the field edge is perturbed at all ('+GR.edgeVar+')');
  ok(/float edge=1\.0\+\(keaFbm\(w\*[0-9.]+\)-0\.5\)\*2\.0\*uEdgeVar/.test(vs),
     'by noise in WORLD space, so the boundary wanders and stays put as the camera moves');
  ok(/smoothstep\(uLodNear\*edge,uLodFar\*edge,d\)/.test(vs),
     'and the perturbation is applied to BOTH thresholds, or the fade band itself changes width '+
     'around the ring');
  ok(GR.edgeVar<0.5,'while staying inside the radius the tier measured its cost at ('+GR.edgeVar+')');

  /* ---- NOTHING ELSE IN THE FIELD MAY STEP ON A SQUARE CELL ----
     The general claim, so a fourth per-cell step added later goes red here. `cell` may be used for
     mound identity (which is now a territory, not a tile) and nothing else may branch on it. */
  { const usesStep=(vs.match(/step\([^)]*cell/g)||[]);
    ok(usesStep.length===0,'no remaining hard step is keyed on a cell index'+
       (usesStep.length?' — '+usesStep.join(' | '):' (0 found)')); }

  /* ---- AND THE THINGS P4b EARNED ARE INTACT ---- */
  ok(GR.biomes.carpark.h[1]<=0.50,'the bird readability tune is untouched ('+
     GR.biomes.carpark.h[1]+' m)');
  ok(GR.biomes.carpark.base!==undefined&&GR.biomes.carpark.tip!==undefined,
     'and the P4b colour work is still there');
  ok(GR.groundTint!==undefined,'ground tint included');

  X.boot({biome:'carpark'}); X.startGame(1); tick(6);
}

/* ============================================================
   REPLAT P4d — THE SQUARES WERE THE COVER LAYER, AND AN UNSHOT EXEMPTION KEPT THEM.
   ============================================================
   Eric played P4c and STILL saw squares. P4c had fixed the clump layer and, in the same breath,
   written the sentence that kept the bug alive: the 3x3 territory search "is skipped where the
   pull is negligible: the cover layer sits at 0.10 and gathers almost nothing, so nine hash
   lookups per vertex would buy it nothing". That was never photographed. Measured the P4c way —
   14_player_view at cover.clumpM 0.55 / 1.10 / 2.20 — the straight bare LANES in the near field
   double and double again in step with it, while the bare-ground noise field (bareScale 0.0725 /
   0.145 / 0.29) and the ground colour mask (ground.segs 24/48/96, ground.maskScale 0.5/1.0/2.0)
   moved the frame and produced no square at any setting.
   AND THE MECHANISM IS ARITHMETIC, WHICH IS WHY THE EXEMPTION WAS ALWAYS WRONG. `w=mix(w,cc,pull)`
   moves every blade `pull` of the way toward its cell's centre. On a square cell that VACATES A
   MARGIN ALONG EVERY CELL EDGE, so a small pull does not draw a faint grid — it draws a grid of
   straight empty LANES, in negative space, and the smallness that was thought to make it safe is
   exactly what makes it legible. Re-shot at cover.clumpPull 0 the lanes vanish at both 0.55 and
   2.20, which pins the pull as the cause and rules out the mound colour.
   So the threshold stops being a magic 0.2 inside a uniform and becomes GRASS.blobMinPull at zero.
   This section is the pin on the general claim: ANY layer that pulls at all gets a territory. */
C.section('REPLAT P4d: any pull at all earns a territory');
{
  const GR=X.GRASS, vs=X.GRASS_GLSL_V;
  const src=require('../2026-08-26/keasrc').specimenSource();
  X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();

  /* ---- (1) THE GATE IS A NAMED CONSTANT, NOT A NUMBER BURIED IN A UNIFORM ----
     The 0.2 was unreachable from the recipe, so it could not be tuned, could not be shot, and
     could not be argued with — the three properties that let it survive a whole session. */
  ok(typeof GR.blobMinPull==='number','the blob-scan gate is a named constant (GRASS.blobMinPull)');
  ok(GR.blobMinPull===0,'and it is ZERO: any pull at all earns the nine lookups ('+
     GR.blobMinPull+')');
  { const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
    ok(code.indexOf('GRASS.blobMinPull')>0,'the shader gate READS that constant');
    ok(!/clumpPull\)>0\.2\)\?1:0/.test(code),
       'and the magic 0.2 it replaced is gone from the code'); }

  /* ---- (2) THE GENERAL CLAIM, COMPUTED THE WAY grassShader COMPUTES IT ----
     Not against a second copy of the numbers: grassSpecs is what feeds the shader, so a layer
     added later — a third tier, a new biome's cover — is swept by this loop for free. */
  { const bad=[];
    for(const biome of ['carpark','skifield']){
      const S=X.grassSpecs(biome);
      for(const name of ['clump','cover']){
        const L=S[name], pull=L.clumpPull===undefined?GR.clumpPull:L.clumpPull;
        const scan=!!(GR.blobScan&&pull>GR.blobMinPull);
        if(pull>0&&!scan)bad.push(biome+'.'+name+' pulls '+pull+' with NO territory');
        ok(pull<=0||scan,biome+' '+name+' layer pulls '+pull+' toward a mound, so it gets an '+
           'IRREGULAR territory rather than a square cell'); } }
    ok(bad.length===0,'no layer anywhere pulls toward a square cell'+
       (bad.length?' — '+bad.join(' | '):' (4 layers checked)')); }

  /* ---- (3) AND THE COVER LAYER IS THE ONE THIS PIECE IS ABOUT ----
     Named explicitly, because the general loop above would stay green if somebody set the cover's
     pull to zero instead — which was measured, works for the geometry, and was NOT what shipped:
     it leaves the mound identity (height and colour, via `cw`) stepping on a square lattice, and
     it flattens the density variation the cover reads better with. Reachable as
     KEAGRASS='{"cover":{"clumpPull":0}}' for anyone who wants to shoot it again. */
  { const C4=X.grassSpecs('carpark').cover;
    const pull=C4.clumpPull===undefined?GR.clumpPull:C4.clumpPull;
    ok(pull>0,'the cover layer still gathers, so it still has density variation ('+pull+')');
    ok(pull>GR.blobMinPull,'and that gather is over the gate, so its territories are irregular'); }

  /* ---- (4) THE MECHANISM, IN THE LINE THAT CAUSES IT ----
     A pull of p empties a p-wide margin along every territory boundary. That is fine when the
     boundary wanders and fatal when it is a cell edge, and it is the whole reason (2) has to hold
     for EVERY layer rather than only for the ones that gather hard. */
  ok(vs.indexOf('w=mix(w,cc,pull);')>0,
     'the pull is a lerp toward the mound centre, which is what empties the territory boundary');

  /* ---- (5) THE OTHER TWO CANDIDATES KEEP THEIR SCALE KNOBS ----
     Both were ruled out BY MEASUREMENT, and the only reason that was possible is that both had a
     knob to sweep. The ground colour mask had none — its lattice was `PlaneGeometry(240,240,48,48)`
     and its pattern was four magic frequencies inline — so it got one before it was diagnosed. A
     candidate system with no scale knob cannot be ruled in or out, and the next session will have
     candidates too. */
  ok(GR.bareScale>0,'the bare-ground field has a scale knob to sweep ('+GR.bareScale+')');
  ok(!!GR.ground&&typeof GR.ground.segs==='number'&&typeof GR.ground.maskScale==='number',
     'and the ground colour mask now has BOTH — a lattice and a pattern frequency');
  ok(GR.ground.maskScale===1,'the pattern knob ships at 1.0: it is a measurement seam, not a tune ('+
     GR.ground.maskScale+')');
  ok(GR.ground.segs>=24&&GR.ground.segs<=96,'and the lattice ships at the tessellation P3 shot the '+
     'ground materials against ('+GR.ground.segs+' segments over 240 m = '+
     (240/GR.ground.segs).toFixed(1)+' m cells)');
  { const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
    ok(/PlaneGeometry\(240,240,GRD\.segs,GRD\.segs\)/.test(code),
       'the terrain plane is built from the constant, not from a literal 48');
    /* BOTH TERRAIN PLANES, and the first cut of this assertion only checked one — it sliced from
       buildCarpark and went red on the SKI FIELD's plane, which was still a literal 48,48. That is
       the assertion doing its job: a seam that reaches one of two planes is a knob that lies about
       its scope, and sweeping it on the ski field would have photographed four identical frames. */
    /* ONE 240 m PLANE PER REGISTERED MAP, derived rather than typed for the reason the literal
       `2` here went red: every biome builds exactly one terrain plane, so the count is a fact
       about the registry and not a number to keep re-typing as the tour fills up. */
    const planes=(code.match(/new THREE\.PlaneGeometry\(240,240,[^)]*\)/g)||[]);
    const maps=Object.keys(X.BIOME.ALL).length;
    ok(planes.length===maps,'there is exactly one 240 m terrain plane per registered map, all to '+
       'be kept in step ('+planes.length+' planes, '+maps+' maps)');
    ok(planes.every(t=>t.indexOf('GRD.segs,GRD.segs')>0),
       'and BOTH are built from the constant, not from a literal'+
       (planes.length?' — '+planes.join(' | '):'')); }

  /* ---- (6) AND EVERYTHING P4b AND P4c EARNED IS STILL THERE ----
     P4d touched a threshold and a mask's constants. It must not have moved the bird's readability
     or the colour work, and those are the two things every grass session is tempted to move. */
  ok(GR.biomes.carpark.h[1]<=0.50,'the bird readability tune is untouched ('+
     GR.biomes.carpark.h[1]+' m)');
  ok(GR.biomes.carpark.base!==undefined&&GR.biomes.carpark.tip!==undefined,
     'the P4b per-blade colour work is still there');
  /* THE MESSAGE IS THROW-PROOF, AND IT WAS NOT — A LAW-14 FUSE IN AN ASSERTION ABOUT A MISSING
     CONSTANT. The first cut formatted the value as '#'+GR.groundTint.toString(16), so the exact
     sabotage this line exists to catch (delete groundTint) died on `undefined.toString` and killed
     the whole battery instead of reporting one finding. The gate still went red — a throw prints
     no ALL PASS and exits non-zero — but the FINDING was lost, and a battery that dies cannot tell
     you which of its 4,000 claims failed. Same shape as the P4c debug readback. Format defensively
     in any message that describes a value whose absence is the thing being asserted. */
  ok(GR.groundTint!==undefined,'the P4b ground tint is still there ('+
     (GR.groundTint===undefined?'MISSING':'#'+GR.groundTint.toString(16).toUpperCase())+')');
  ok(GR.blobScan===true&&GR.bareScale>0&&GR.edgeVar>0,
     'and all three of P4c\'s structural fixes are still on');

  X.boot({biome:'carpark'}); X.startGame(1); tick(6);
}

/* ============================================================
   REPLAT P4e — THE FIELD STOPS BEING A DISC.
   ============================================================
   Eric played P4d: the grass reads perfectly and you can see WHERE IT STOPS. The blade field is a
   14 m disc anchored to the camera and beyond it the ground was bare, so the boundary was the
   loudest line in a wide frame.
   THREE CANDIDATES WERE MEASURED AND TWO OF THEM LOST.
     - A BIGGER DISC does not work and the measurement is unambiguous: shot at 40 m with the count
       raised to hold density, the edge does not go away, it MOVES, and it scores WORSE than the
       14 m one (16.90 against 5.92 on gauntlet/verify/edgefind.mjs) because at that range the fade
       is compressed into a handful of pixels near the horizon.
     - PAINTING THE GROUND to match cannot do it alone. Setting the terrain albedo to BLACK at the
       band beyond the blades moves its luminance 18% and its blue by one and a half levels; fog is
       0.55% at twelve metres and cannot explain it. Whatever the rest of that pixel is, an albedo
       multiplier does not reach it.
     - REAL GEOMETRY does, because what makes a bladed pixel different is OCCLUSION, and nothing
       painted on a flat plane reproduces that.
   So: a third instanced tier over an annulus, plus a ground term that carries the colour past it.
   This section is the pin on the parts of that a headless battery can reach. */
C.section('REPLAT P4e: the field stops being a disc');
{
  const GR=X.GRASS, vs=X.GRASS_GLSL_V;
  const src=require('../2026-08-26/keasrc').specimenSource();
  const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
  X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();

  /* ---- (1) THERE IS A FAR TIER AND IT REPORTS ITSELF ---- */
  ok(!!GR.farLayer,'there is a far tier in the recipe (GRASS.farLayer)');
  ok(!!G.grass&&!!G.grass.far,'and it reports itself in scene state (G.grass.far)');
  ok(G.grass.far.count===GR.farLayer.count,'at the count the recipe asked for ('+
     G.grass.far.count+')');
  /* AND THE COUNT IS A REAL COUNT. The first cut of this section asserted only that the tier
     EXISTED and that its reported count matched the recipe — so setting the recipe to zero left
     0===0 and the whole feature could be deleted while every assertion stayed green. A tier with
     no blades in it is not a tier, and "it agrees with itself" is not a claim about the world. */
  ok(GR.farLayer.count>0,'and it is a REAL count — a far tier of zero blades is no far tier ('+
     GR.farLayer.count+')');
  ok(G.grass.far.density>8,'covering its annulus at a density that can read as ground cover ('+
     Math.round(G.grass.far.density)+' blades/m2 over the ring it actually occupies)');
  { const T2=X.grassTier();
    ok(G.grass.far.density<T2.density,'and thinner than the near field, which is the whole point '+
       'of a far tier ('+Math.round(G.grass.far.density)+' against '+Math.round(T2.density)+')'); }

  /* ---- (2) IT IS AN ANNULUS, AND ITS INNER EDGE IS INSIDE THE NEAR TIERS ----
     THE FIRST CUT SHIPPED A BARE RING AND THE EDGE FINDER FOUND IT. rMin 0.30 of a 52 m radius is
     15.6 m, the clump layer stops at 14 m, and the 1.6 m annulus between them had no layer in it
     at all — a ring of bare ground drawn around the player, which is the artefact this piece
     exists to remove wearing a larger radius. The tiers must OVERLAP, and by a real margin. */
  { const T=X.grassTier(), F=GR.farLayer, inner=F.near*F.rMin;
    ok(F.rMin>0,'the far tier is an ANNULUS, not a disc — it spends nothing under the near tiers ('+
       'rMin '+F.rMin+')');
    ok(inner<T.near,'and its inner edge is INSIDE the clump layer, so the two OVERLAP rather than '+
       'leaving a bare ring between them ('+inner.toFixed(1)+' m against '+T.near+' m)');
    ok(T.near-inner>=2.0,'with a real margin, not a millimetre of luck ('+
       (T.near-inner).toFixed(1)+' m of overlap)');
    ok(F.near>T.near*1.5,'and it reaches well past the clump layer, or it is not a far tier ('+
       F.near+' m against '+T.near+' m)'); }

  /* ---- (3) THE FAR BLADE IS THE SAME SPECIES AS THE NEAR BLADE ----
     THE OTHER THING THE FIRST CUT GOT WRONG. 110k blades of 34-86 cm at 45-105 mm wide bought
     screen coverage with SIZE and photographed as sheaves of wheat: grass visibly coarser at
     thirty metres than at three. A scale break reads worse than the bare ground it replaced,
     because it says the country changes as you walk. Coverage is bought with COUNT. */
  { const B=GR.biomes.carpark, F=GR.farLayer;
    ok(F.h[1]<=B.h[1]*1.6,'the far blade is the same species as the near blade in HEIGHT ('+
       F.h[1]+' m against '+B.h[1]+' m)');
    ok(F.w[1]<=B.w[1]*1.8,'and in WIDTH — coverage is bought with count, never with size ('+
       (F.w[1]*1000).toFixed(1)+' mm against '+(B.w[1]*1000).toFixed(1)+' mm)');
    ok(F.w[0]>0.001&&F.w[1]<0.03,'and it is still a BLADE width in metres ('+
       (F.w[0]*1000).toFixed(1)+'-'+(F.w[1]*1000).toFixed(1)+' mm)'); }

  /* ---- (4) fadeBand IS PER LAYER, AND THAT IS WHAT DISSOLVES THE HANDOVER ----
     A far tier with the near tier's fade band relocates the edge instead of removing it: measured
     12.79 findability at 0.11, 7.17 at 0.30, 5.77 at 0.55 with the peak moving off the texture
     channel entirely. It must NOT be raised globally — the same width under the camera stunts the
     blades in the most visible part of the frame. */
  { const F=GR.farLayer;
    ok(F.fadeBand!==undefined,'the far tier carries its OWN fade band');
    ok(F.fadeBand>GR.fadeBand*2,'and it is far wider than the near layers\' ('+F.fadeBand+
       ' against '+GR.fadeBand+')');
    ok(GR.fadeBand<=0.15,'while the near layers keep the band P4 tuned ('+GR.fadeBand+')');
    ok(/B\.fadeBand===undefined\?GRASS\.fadeBand:B\.fadeBand/.test(code),
       'and the shader reads the per-layer value with the global as the fallback, so a layer that '+
       'does not ask for one is unchanged'); }

  /* ---- (5) THE FAR TIER DOES NOT RECEIVE SHADOWS, AND ONLY IT ----
     A shadow-map lookup is a PER-FRAGMENT cost and the far tier is the most overdrawn thing in the
     frame. Measured at 2.4 ms of the far tier's cost at DPR 2. The near layers keep theirs. */
  { ok(GR.farLayer.shadow===false,'the far tier does not receive shadows — nothing can resolve one '+
       'at thirty metres and it is the most overdrawn surface in the frame');
    ok(GR.cover.shadow===undefined&&GR.biomes.carpark.shadow===undefined,
       'and the near layers do not opt out of it');
    ok(/mesh\.receiveShadow=\(L\.shadow!==false\)/.test(code),
       'the flag is read per layer, defaulting to ON'); }

  /* ---- (6) THE GROUND'S DRIFT IS THE BLADE FIELD'S OWN NOISE, CHARACTER FOR CHARACTER ----
     Not a lookalike. "A similar noise field" is exactly how a seam gets reintroduced by a later
     tune of one of them, so the two expressions are compared as TEXT. */
  { const blade=(vs.match(/float keaFbm\(vec2 p\)\{[^}]*\}/)||[''])[0];
    const ground=(X.MATFAR_GLSL.match(/float keaFarFbm\(vec2 p\)\{[^}]*\}/)||[''])[0];
    ok(blade.length>20,'the blade shader has an fbm to compare against');
    ok(ground.length>20,'and the ground term has one');
    ok(blade.replace('keaFbm','F').replace(/keaVal/g,'V')===
       ground.replace('keaFarFbm','F').replace(/keaVal/g,'V'),
       'and they are CHARACTER-IDENTICAL once the two names are normalised — the ground reads the '+
       'same field the blades do\n      blade:  '+blade+'\n      ground: '+ground); }

  /* ---- (7) THE CUT-OUTS ARE NO LONGER RIGHT ANGLES ----
     They were a hard axis-aligned box test, and giving the grass the range to reach the tarmac is
     what exposed it: the field used to fade out at 14 m and the car park is 30 m away, so nobody
     had ever seen its edge. The ramp lives entirely OUTSIDE the box, so every existing assertion
     about what the cut-outs cover still holds to the millimetre. */
  { ok(!/bool keaCut\(/.test(vs),'the hard boolean cut-out test is gone');
    ok(/float keaCutK\(/.test(vs),'and the cut-out returns a FACTOR, so a verge can thin instead '+
       'of stopping');
    ok(/smoothstep\(0\.0, max\(0\.05, soft\*\(1\.0\+n\*0\.6\)\), sd\)/.test(vs),
       'the noise varies the ramp WIDTH and not its position — at sd<=0 the factor is zero whatever '+
       'the noise says, so no blade can appear inside a cut-out');
    ok(GR.cutSoft>0.3&&GR.cutSoft<3,'the verge is a stride wide, which is what the edge of a gravel '+
       'car park in tussock country looks like ('+GR.cutSoft+' m)');
    ok(/alive\*=keaCutK\(uCut0/.test(vs),'and the four factors MULTIPLY, so overlapping cut-outs '+
       'thin each other rather than one winning at a seam'); }

  /* ---- (8) TODO 80: THE ROLLING HILLS HAVE FORM, AND THEY WEAR THE GROUND TINT ----
     Filed in P4d as the last straight edge in a wide frame. The sculpt only ever scaled x and z, so
     at the pole — where x and z are zero — it multiplied nothing and no amount of noise in it could
     break the flat cap. Read off the built geometry, not off the source. */
  { const hills=[]; G.scene.traverse(o=>{ if(o.name==='tussockHill')hills.push(o); });
    ok(hills.length>=9,'the rolling tussock hills are in the world and nameable ('+hills.length+')');
    const h0=hills[0];
    ok(!!h0&&h0.geometry.parameters.heightSegments>=14,
       'with enough height bands to shape a crown with ('+
       (h0?h0.geometry.parameters.heightSegments:0)+', was 10)');
    ok(/pos\.setY\(v,y\*k\)/.test(code),
       'and the sculpt displaces Y as well as X and Z — scaling x,z alone multiplies ZERO at the '+
       'pole, which is why the old cap could not be broken');
    /* THE CAP IS MEASURED, NOT ASSERTED FROM THE CODE. Take the highest vertices and check they do
       not all sit at one height: a flat cap is a plateau of identical y, and that is the defect. */
    { const pp=h0.geometry.attributes.position; let ymax=-1e9;
      for(let v=0;v<pp.count;v++) ymax=Math.max(ymax,pp.getY(v));
      let spread=0,n=0;
      for(let v=0;v<pp.count;v++){ const y=pp.getY(v);
        if(y>ymax*0.90){ spread=Math.max(spread,ymax-y); n++; } }
      ok(n>3,'there are vertices in the top tenth of the hill to measure ('+n+')');
      ok(spread>ymax*0.02,'and they are NOT a plateau — the crown has relief ('+
         spread.toFixed(2)+' m of spread across the top tenth)'); }
    /* AND THE TINT. The hills never went through matGround, so tinted flat ground met untinted gold
       hill along a visible join — an open colour seam in the P4b, P4c and P4d recipes. */
    /* THE TINT IS CHECKED AGAINST WHAT THE VERTEX WOULD BE WITHOUT IT, and the first cut of this
       was not: it asserted the hill's blue was below 0.45, and the UNTINTED palette is already at
       0.029 in linear space, so removing the tint sailed straight through. A threshold that the
       broken state also satisfies is not a test. The colour is now RECONSTRUCTED — the same lerp
       the builder does, at the same vertex — and the tinted and untinted predictions are BOTH
       compared, so the assertion can only pass one of them. */
    { const cc=h0.geometry.attributes.color, pp2=h0.geometry.attributes.position;
      const T=new H.THREE.Color(GR.groundTint).convertSRGBToLinear();
      const cG2=new H.THREE.Color(X.PAL.ground2).convertSRGBToLinear();
      const cT2=new H.THREE.Color(X.PAL.tussock).convertSRGBToLinear();
      let hi=0; for(let v=1;v<pp2.count;v++) if(pp2.getY(v)>pp2.getY(hi)) hi=v;
      const rad=h0.geometry.parameters.radius;
      const t=Math.max(0,Math.min(1,pp2.getY(hi)/rad*0.5+0.5));
      const plain=cG2.clone().lerp(cT2,t*0.85);
      const tinted=plain.clone().multiply(T);
      const got={r:cc.getX(hi),g:cc.getY(hi),b:cc.getZ(hi)};
      const d=(c)=>Math.abs(got.r-c.r)+Math.abs(got.g-c.g)+Math.abs(got.b-c.b);
      ok(T.b<0.25,'the ground tint is an olive, so blue is what it removes ('+T.b.toFixed(3)+')');
      ok(d(tinted)<0.01,'the hill\'s crown vertex IS its palette colour times groundTint ('+
         d(tinted).toFixed(4)+' away)');
      ok(d(plain)>0.05,'and it is NOT the untinted colour — the two predictions are far enough '+
         'apart for this to be a test ('+d(plain).toFixed(4)+' away)'); } }

  /* ---- (9) EVERY LAYER IS DRIVEN, WHICH IS THE ONE THAT CANNOT BE SEEN IN A STILL ----
     A layer left off the per-frame list keeps its anchor at (0,0) — a static disc round the world
     origin — and its wind frozen. It photographs as "the far grass does not follow the camera",
     which looks like a design decision rather than a bug. */
  ok(/\[G\.grassMat,G\.grassCoverMat,G\.grassFarMat\]/.test(code),
     'all three layer materials are driven from ONE list, so adding a tier cannot half-connect it');

  /* ---- (9b) THE BULL WHEEL IS PINNED BY THE CAPTURE CLOCK ----
     Not P4e's bug, but P4e's false alarm: 28_skifield_base's scarlet subject reshot at 490, 1067
     and 2038 across three takes of ONE build, straddling its floor, and it read as a P4e
     regression until the takes were counted. The cause is an INTEGRATOR — `rotation.z += dt*2.4`
     accumulates wall-clock deltas, and the rig's `G.time = 12.0` pin cannot reach one. Every
     animated handle the capture rig photographs has to be a FUNCTION of the pinned clock, which is
     the rule the grass wind already follows. */
  { ok(!/towWheel\.rotation\.z\+=/.test(code),
       'the bull wheel does not INTEGRATE dt — a clock pin cannot reach an integrator');
    ok(/towWheel\.rotation\.z=G\.time\*/.test(code),
       'it is a function of G.time, the clock the capture rig pins, so a photographed frame is a '+
       'fixed frame');
    X.boot({biome:'skifield'}); X.startGame(1); tick(4);
    /* AND IT IS MEASURED, not merely read off the source: set the clock twice and the angle must
       follow it exactly, with no memory of how many ticks happened in between. */
    { const w=G.towWheel;
      ok(!!w,'the ski field has a bull wheel to check');
      if(w){ G.time=12.0; tick(1); const a=w.rotation.z;
             for(let i=0;i<7;i++)tick(1);        // seven more frames, clock still pinned
             G.time=12.0; tick(1); const b=w.rotation.z;
             ok(Math.abs(a-b)<1e-9,'and eight frames at the same pinned clock leave it at the same '+
                'angle ('+a.toFixed(6)+' vs '+b.toFixed(6)+')');
             G.time=13.0; tick(1); const c=w.rotation.z;
             ok(Math.abs(c-a)>0.5,'while moving the clock does turn it ('+
                (c-a).toFixed(3)+' rad for one second)'); } }
    X.boot({biome:'carpark'}); X.startGame(1); tick(4); park(); }

  /* ---- (10) AND THE THINGS P4b, P4c AND P4d EARNED ARE INTACT ---- */
  ok(GR.biomes.carpark.h[1]<=0.50,'the bird readability tune is untouched ('+
     GR.biomes.carpark.h[1]+' m)');
  ok(GR.blobScan===true&&GR.blobMinPull===0,'P4d\'s territory gate is still open to every layer');
  ok(GR.groundTint!==undefined,'the P4b ground tint is still there');

  X.boot({biome:'carpark'}); X.startGame(1); tick(6);
}

/* ============================================================
   REPLAT P5 — ATTRIBUTION IS A CONDITION OF USE, SO THE GATE ENFORCES IT.
   ============================================================
   Every asset before P5 was CC0 and attribution was a courtesy. The palm cockatoo base mesh is
   CC-BY and Sketchfab's own licence field reads "Author must be credited." That is a condition, and
   a condition that lives only in a markdown file in the repo is not met for a player who has the
   game and not the repo.
   SO THE LEDGER AND THE GAME ARE CROSS-CHECKED, IN BOTH DIRECTIONS. assets/LICENCES.md carries a
   machine-readable `<!-- ASSET ... -->` marker per asset added from P5 onward; this section parses
   them and asserts the attribution-required set matches CREDITS exactly. Add an asset and forget
   the credit: red. Delete a credit while the asset is still in the ledger: red. Neither is
   catchable by reading, which is the whole point. */
C.section('REPLAT P5: the licence ledger and the credits agree');
{
  const fsx=require('fs'), pathx=require('path');
  const ROOT=pathx.resolve(__dirname,'..','..');
  const led=fsx.readFileSync(pathx.join(ROOT,'assets/LICENCES.md'),'utf8');

  /* ---- (1) THE MARKERS PARSE AT ALL ---- */
  const marks=[];
  for(const m of led.matchAll(/<!--\s*ASSET\s+([^>]*?)-->/g)){
    const raw=m[1], o={};
    for(const kv of raw.matchAll(/(\w+)=(?:"([^"]*)"|(\S+))/g)) o[kv[1]]=kv[2]!==undefined?kv[2]:kv[3];
    marks.push(o);
  }
  ok(marks.length>0,'the licence ledger carries machine-readable ASSET markers ('+marks.length+')');
  for(const m of marks){
    ok(!!m.file&&!!m.md5,'every marker names a file and an md5 ('+(m.file||'?')+')');
    ok(!!m.licence,'and its licence ('+(m.licence||'?')+')'); }

  /* ---- (2) A LANDED FILE CANNOT SIT ON A PENDING md5 ----
     The ledger's promise is that a later session can re-verify the BYTES rather than trust them.
     PENDING is legitimate only while the file genuinely is not there — Eric downloads the cockatoo
     from Sketchfab, whose /download endpoint needs an account. The moment it lands, PENDING is a
     lie, and this is what catches it. */
  for(const m of marks){
    const abs=pathx.join(ROOT,'assets',m.file), here=fsx.existsSync(abs);
    if(m.md5==='PENDING'){
      ok(!here,'`'+m.file+'` is marked PENDING and is genuinely NOT in the tree — a landed file on '+
         'a PENDING md5 would make the ledger decoration');
    } else {
      ok(here,'`'+m.file+'` is in the tree, as its recorded md5 claims');
      if(here){ const got=require('crypto').createHash('md5')
          .update(fsx.readFileSync(abs)).digest('hex');
        ok(got===m.md5,'and its bytes match the ledger ('+got.slice(0,12)+' vs '+
           String(m.md5).slice(0,12)+')'); } } }

  /* ---- (2b) AND EVERY ASSET IN THE TREE HAS A ROW — THE LAW, STATED THE OTHER WAY ROUND ----
     REPLAT.md's condition is "no asset lands without its licence line". Checking markers against
     files only catches a row whose file is missing; it cannot catch a FILE WHOSE ROW IS MISSING,
     which is the direction the law is actually about. Deleting the derived cockatoo's whole ledger
     section left every assertion green until this was added.
     Scoped to models/ because that is the tier where a file is added one at a time by hand; the
     texture and HDRI tiers arrive as whole publisher sets and carry their own tables. */
  { const dir=pathx.join(ROOT,'assets/models');
    if(fsx.existsSync(dir)){
      const have=new Set(marks.map(m=>m.file));
      const orphans=fsx.readdirSync(dir).filter(f=>/\.(glb|gltf|fbx)$/i.test(f))
        .filter(f=>!have.has('models/'+f));
      ok(orphans.length===0,'every model file in the tree has a licence row'+
         (orphans.length?' — UNLICENSED IN TREE: '+orphans.join(', ')+
          ' (REPLAT.md: no asset lands without its licence line)':' ('+
          fsx.readdirSync(dir).filter(f=>/\.(glb|gltf|fbx)$/i.test(f)).length+' checked)')); } }

  /* ---- (3) EVERY ATTRIBUTION-REQUIRED ASSET IS CREDITED IN THE GAME ---- */
  const need=marks.filter(m=>m.attrib==='required');
  const cred=X.CREDITS||[];
  ok(Array.isArray(cred)&&cred.length>0,'the game carries a CREDITS block ('+cred.length+' entries)');
  for(const m of need){
    const hit=cred.find(c=>c.required&&c.author===m.author&&c.title===m.title);
    ok(!!hit,'`'+m.title+'` by '+m.author+' is CC-BY, so it MUST be credited in game — and it is'+
       (hit?'':' NOT. This is a licence breach, not a style problem.'));
    if(hit)ok(/CC-BY/i.test(hit.lic),'and the credit names the licence ('+hit.lic+')'); }

  /* ---- (4) AND NO CREDIT CLAIMS AN OBLIGATION THE LEDGER DOES NOT HAVE ----
     The reverse direction. A required credit with no ledger row behind it means the ledger lost an
     asset, which is the same failure seen from the other end. */
  for(const c of cred.filter(x=>x.required)){
    ok(need.some(m=>m.author===c.author&&m.title===c.title),
       'the required credit for `'+c.title+'` has a ledger row behind it'); }

  /* ---- (5) THE CREDITS REACH A PLAYER, NOT JUST A FILE ----
     A credit that never renders is not a credit. There is no DOM in node, so what is proved here is
     that the renderer exists, is wired into boot, and writes into an element the shipped page
     actually has — the three ways this silently becomes a no-op. */
  { const src=require('../2026-08-26/keasrc').specimenSource();
    const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
    ok(typeof X.creditsRender==='function','there is a credits renderer');
    ok(/creditsRender\(\);/.test(code),'and it is CALLED at boot, not merely defined');
    const html=fsx.readFileSync(pathx.join(ROOT,'index.html'),'utf8');
    ok(/id="credits"/.test(html),'and the shipped page has the element it writes into');
    ok(/getElementById\('credits'\)/.test(code),'which is the element it looks for');
    /* IT MUST NOT BUILD THE LINE WITH innerHTML. These are constants today; the day one of them is
       fetched, an innerHTML credits line is an injection point. Cheap habit, permanent property. */
    const fn=String(X.creditsRender);
    ok(!/innerHTML/.test(fn),'the credits line is built from text nodes, never innerHTML'); }

  /* ---- (6) THE CC0 ENTRIES ARE THERE TOO, WHICH IS THE ONE NOBODY WOULD MISS ----
     They are not obliged and that is exactly why they would be the first to go. */
  ok(cred.some(c=>!c.required&&/CC0/i.test(c.lic)),
     'the CC0 authors are credited as well, though nothing compels it');

  X.boot({biome:'carpark'}); X.startGame(1); tick(4);
}

/* ============================================================
   REPLAT P5b — THE RIG ADAPTER: the pose writes must reach the bones.
   ============================================================
   The bird's animation is 80 hand-written pose writes onto Groups with identity rest orientation.
   A skinned bone poses relative to a bind pose with axes pointing wherever the rigger left them, so
   the binding is a CONJUGATION and not an axis-swap table — every key bone on this model was
   measured and not one is axis-aligned. What a headless battery can reach is the recipe, the
   arithmetic, and the one thing that actually broke: the NAMES. */
C.section('REPLAT P5b: the rig adapter');
{
  const fsx=require('fs'), pathx=require('path'), ROOT=pathx.resolve(__dirname,'..','..');
  const B=X.KEABIRD;
  const src=require('../2026-08-26/keasrc').specimenSource();
  const code=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');

  /* ---- (1) IT IS OFF BY DEFAULT, WHICH IS WHAT KEEPS EVERY PINNED VANTAGE HONEST ---- */
  ok(!!B,'there is a bird-model recipe (KEABIRD)');
  ok(B.model===false,'and the model is OFF by default, so no baseline moves while the look is '+
     'still being judged ('+B.model+')');

  /* ---- (2) EVERY BONE NAME IN THE RECIPE EXISTS IN THE ACTUAL FILE ----
     THE ONE THAT ALREADY EARNED ITS KEEP. The left leg's suffixes are not the mirror of the
     right's — the right runs _076/_077 and the left runs _092/_00, numbered in creation order —
     so two guessed names shipped and the bind refused the whole model. Parsed straight out of the
     GLB here, so a rename or a re-export cannot quietly un-bind the bird. */
  { const f=pathx.join(ROOT,'assets/models',pathx.basename(B.url));
    ok(fsx.existsSync(f),'the model file the recipe names is in the tree ('+B.url+')');
    if(fsx.existsSync(f)){
      const buf=fsx.readFileSync(f);
      const j=JSON.parse(buf.slice(20,20+buf.readUInt32LE(12)).toString('utf8'));
      const joints=new Set((j.skins&&j.skins[0]?j.skins[0].joints:[]).map(i=>j.nodes[i].name));
      ok(joints.size>0,'and it carries a skin with joints ('+joints.size+')');
      const missing=Object.entries(B.bones).filter(([k,n])=>!joints.has(n)).map(([k,n])=>k+'='+n);
      ok(missing.length===0,'every bone the recipe names EXISTS in the file'+
         (missing.length?' — MISSING: '+missing.join(', '):' ('+Object.keys(B.bones).length+' checked)'));
      /* THE CREST MUST BE GONE FROM THE SHIPPED FILE AND STILL FINDABLE UPSTREAM.
         This assertion used to require the prefix to MATCH joints in the shipped model, which was
         right while the shipped model was the un-crested download. Now that P5e ships the derived
         bill model the crest is already deleted, and the old form went red for the best possible
         reason: the thing it was guarding against had been fixed. So it is inverted, and the prefix
         is checked against the UPSTREAM file — which stays in the tree precisely so the derivation
         chain can be re-run — to prove the prefix is not simply dead. */
      const crest=[...joints].filter(n=>n.startsWith(B.crestPrefix));
      ok(crest.length===0,'the shipped model carries NO crest joints — P5d removed all 60 ('+
         crest.length+' found)');
      { const up=pathx.join(ROOT,'assets/models/rockatoo.glb');
        ok(fsx.existsSync(up),'the unmodified upstream is still in the tree to re-derive from');
        if(fsx.existsSync(up)){
          const ub=fsx.readFileSync(up);
          const uj=JSON.parse(ub.slice(20,20+ub.readUInt32LE(12)).toString('utf8'));
          const un=new Set((uj.skins&&uj.skins[0]?uj.skins[0].joints:[]).map(i=>uj.nodes[i].name));
          const uc=[...un].filter(n=>n.startsWith(B.crestPrefix));
          ok(uc.length>20,'and the crest prefix still names them there, so it is not a dead '+
             'constant ('+uc.length+' upstream)'); } }
      /* the mesh is skinned at all — a morph-target bird would pass every name check and pose nothing */
      const prim=j.meshes[0].primitives[0];
      ok(!!(prim.attributes&&prim.attributes.JOINTS_0),
         'and the mesh is SKINNED (JOINTS_0), not morph-target — three.js\' own free parrot is '+
         'morph-target and would pass every other check here while posing nothing'); } }

  /* ---- (3) THE SCALE IS DERIVED, NOT TYPED ---- */
  ok(B.standM>0.3&&B.standM<0.8,'the kea\'s standing height is a real bird height ('+B.standM+' m)');
  ok(B.posedUnits>50,'and the model\'s posed height is recorded to divide by ('+B.posedUnits+' units)');
  /* THE SCALE IS DERIVED FROM A MEASUREMENT TAKEN AT LOAD, NOT FROM THE RECORDED CONSTANT.
     This assertion used to require `B.standM/B.posedUnits` in the loader and it went red the moment
     the loader got BETTER: P5d deleted the crest, which was 70% of the vertices and the tallest
     part of the bird, and `posedUnits` — a number recorded from the unmodified download — was
     instantly wrong by a third. A recorded measurement of a mesh that can be edited is a trap, so
     the box is now measured after every edit. The recipe keeps posedUnits as the reading for the
     UNMODIFIED file and the loader publishes what it actually measured, so the two can be compared
     rather than assumed equal. */
  { const bsrc=fsx.readFileSync(pathx.join(ROOT,'src/bird.mjs'),'utf8');
    ok(/B\.standM\/posed/.test(bsrc),
       'the loader derives the scale from standM over a box it MEASURED, not from the recorded '+
       'posedUnits, which goes stale the moment the mesh is edited');
    ok(/setFromObject\(root\)/.test(bsrc),'and the box is measured off the loaded mesh');
    ok(!/scale\.setScalar\(0\.0[0-9]+\)/.test(bsrc),'with no literal scale left in the loader');
    ok(/K\.G\.bird\.posedUnits=/.test(bsrc),
       'and it publishes what it measured, so a stale recipe value can be seen rather than trusted'); }

  /* ---- (4) THE CONJUGATION IS CORRECT, MEASURED ON A SYNTHETIC SKELETON ----
     Built here rather than loaded, so the arithmetic is tested without a GPU or a 5 MB fetch. The
     claim: a ZERO delta must reproduce the rest pose EXACTLY, whatever the bone's rest orientation.
     That is the property an axis-swap table cannot hold and the whole reason for the conjugation. */
  { const T=H.THREE;
    const parent=new T.Object3D();
    const bone=new T.Bone();
    /* a deliberately awkward rest: no axis aligned with anything */
    bone.quaternion.setFromEuler(new T.Euler(0.61,-1.22,0.43,'XYZ'));
    bone.position.set(3,4,5);
    parent.add(bone); parent.rotation.set(0.2,1.1,-0.3); parent.updateMatrixWorld(true);
    const restLocal=bone.quaternion.clone();
    const rig=X.keaRigBind(T,{b:bone},null);
    ok(rig.length===1,'the binder captures the joint');
    X.keaRigApply(T,rig[0],{x:0,y:0,z:0},null);
    const d=Math.abs(bone.quaternion.x-restLocal.x)+Math.abs(bone.quaternion.y-restLocal.y)
           +Math.abs(bone.quaternion.z-restLocal.z)+Math.abs(bone.quaternion.w-restLocal.w);
    ok(d<1e-9,'a ZERO delta reproduces the rest pose exactly, on a bone with no axis aligned to '+
       'anything ('+d.toExponential(2)+')');
    /* a non-zero delta must actually move it, and by the right amount: the angle between the posed
       and rest quaternions must equal the delta's angle, because a conjugation is a rotation and
       rotations preserve angle. */
    const ang=0.5;
    X.keaRigApply(T,rig[0],{x:ang,y:0,z:0},null);
    const got=2*Math.acos(Math.min(1,Math.abs(bone.quaternion.dot(restLocal))));
    ok(Math.abs(got-ang)<1e-6,'and a '+ang+' rad delta rotates the bone by exactly that angle, '+
       'which is the property that makes the conjugation a retarget and not a distortion ('+
       got.toFixed(6)+')');
    /* AND THE AXIS, WHICH IS THE WHOLE POINT AND WHICH THE ANGLE TEST ABOVE CANNOT SEE.
       A sabotage that DELETED the conjugation entirely stayed green against the angle check —
       correctly, because rotating about the bone's own local x is also a rotation of 0.5 rad. What
       separates a retarget from a distortion is WHICH AXIS the bird turns about: the pose author
       wrote `head.rotation.x` meaning the bird's own left-right axis, and on a bone whose local x
       points at (-0.92, 0.28, 0.26) that is a different thing entirely. So: take the bone's WORLD
       delta and check its axis is the bird-frame x it was asked for. */
    { const restW=rig[0].restWorld.clone();
      bone.updateWorldMatrix(true,false);
      const nowW=new T.Quaternion();
      bone.matrixWorld.decompose(new T.Vector3(),nowW,new T.Vector3());
      const dW=nowW.clone().multiply(restW.clone().invert());
      /* axis of dW */
      const sn=Math.sqrt(Math.max(0,1-dW.w*dW.w));
      const axis=sn<1e-8?new T.Vector3(1,0,0)
        :new T.Vector3(dW.x/sn,dW.y/sn,dW.z/sn).normalize();
      const dot=Math.abs(axis.dot(new T.Vector3(1,0,0)));
      ok(dot>0.9999,'and it turns about the BIRD\'S x axis in world space, not the bone\'s own — '+
         'the property an axis-swap table cannot hold and the only thing separating a retarget '+
         'from a distortion (axis dot x = '+dot.toFixed(6)+')'); } }

  /* ---- (5) THE FRAME IS MEASURED FROM THE MODEL, NOT ASSUMED ----
     This model is yawed about 45 degrees; anything that assumed world axes would be wrong by that
     much. Two synthetic humeri, deliberately placed on a diagonal. */
  { const T=H.THREE;
    const mk=(x,z)=>{ const b=new T.Bone(); b.position.set(x,0,z); b.updateMatrixWorld(true); return b; };
    const fr=X.keaBirdFrame(T,{humL:mk(-1,-1),humR:mk(1,1)});
    ok(Math.abs(fr.right.y)<1e-9,'the measured lateral axis is level');
    ok(Math.abs(fr.right.x-fr.right.z)<1e-6,'and it follows the humeri onto the diagonal, rather '+
       'than snapping to a world axis ('+fr.right.x.toFixed(3)+', '+fr.right.z.toFixed(3)+')');
    ok(Math.abs(fr.fwd.dot(fr.right))<1e-6,'forward is perpendicular to it');
    ok(Math.abs(fr.up.y-1)<1e-9,'and up is up'); }

  /* ---- (6) THE COMMIT IS WIRED, AND ONLY WHERE IT CANNOT BE SKIPPED ---- */
  ok(/if\(this\._model\)this\.rigCommit\(\);/.test(code),
     'the commit runs at the END of the pose, after poseLock, which is applied last');
  ok(/rigCommit\(\)\{/.test(code),'and it exists');
  { const B2=B.wingChain, O=B.openChain;
    ok(Array.isArray(B2)&&B2.length===3,'the wing chain names all three segments the model has');
    ok(B2[0]>B2[1]&&B2[1]>B2[2],'with the stroke strongest at the humerus and softening outward ('+
       B2.join(' > ')+')');
    ok(Array.isArray(O)&&O.length===3&&O[0]===0,
       'and `open` drives the ulna and metacarpus, not the humerus — the model has no per-primary '+
       'feather bones for the old spread, so it folds into extension ('+O.join(', ')+')'); }

  /* ---- (6b) THE FIVE P5d2 LOOK FIXES, EACH ASSERTED ----
     THESE WERE ALL UNASSERTED WHEN FIRST SHIPPED and a seven-way sabotage came back seven green:
     the jaw sign could flip, the wing-open gate could be deleted, the shading could go back to the
     floor-clamped ratio that dimmed the bird to mud, and nothing would have gone red. Proof in the
     same breath as the change is the law and this pass did not have it. */
  { const P=B.plume, bsrc=fsx.readFileSync(pathx.join(ROOT,'src/bird.mjs'),'utf8');
    ok(!!P,'there is a plumage palette (KEABIRD.plume)');

    /* (i) THE BILL RESTS SHUT, AND THE SIGN IS THE WHOLE POINT. Swept and measured on the posed
       bird as the angle between the mandibles' length axes: +0.6 gives 6.8 degrees, 0 gives 35.5,
       and -0.62 — the first value shipped — gives about 70, wider than the pose it was meant to
       close. A negative jawShut is not a tuning, it is the sign error. */
    ok(P.jawShut>0.3&&P.jawShut<1.0,'the jaw-shut offset is POSITIVE and closes the bill — '+
       'negative forces a 70 degree gape ('+P.jawShut+')');
    ok(/jaw\.rotation\.x \+ \(B\.plume\?B\.plume\.jawShut:0\)/.test(code),
       'and it is ADDED to what the game asks, so the beak still opens from a closed rest');

    /* (ii) A KEA SHOWS NO RED UNTIL IT OPENS. Both the coverts and the barred underside live under
       a folded wing, so both are gated on the wing's own open state. Measured on the render: 0 of
       810,000 pixels read scarlet on the folded bird. */
    ok(/c = mix\(c, uCov, vKeaCv\*uOpen\);/.test(bsrc),
       'the coverts are gated on wing-open — a kea shows no red while perched');
    ok(/float fl = vKeaFl\*uOpen;/.test(bsrc),
       'and so is the barred underside, for the same reason');
    ok(/U\.uOpen\.value=clamp\(/.test(code),
       'and uOpen is DRIVEN from the wing every frame, not pinned to a constant');
    ok(P.openLo>0&&P.openHi>P.openLo,'with a real gate window ('+P.openLo+'..'+P.openHi+')');

    /* (iii) NEITHER MASK MAY TOUCH THE DORSAL SURFACE. The first pass tested the normal's local Y
       on a model yawed 45 degrees and put scarlet on the OUTSIDE of a folded wing. */
    { const m=bsrc.match(/if\(t==='near' && nd < (-?[0-9.]+)\)/);
      ok(!!m,'the covert bake tests the normal against the bird\'s up vector');
      ok(!!m&&parseFloat(m[1])<-0.2,'and only accepts clearly VENTRAL faces ('+(m?m[1]:'?')+')');
      ok(/nor\.getX\(v\)\*up\.x/.test(bsrc),
         'against the measured up vector carried into mesh-local space, not the raw local Y'); }

    /* (iv) THE SHADING IS CENTRED ON 1, NOT FLOOR-CLAMPED. On a BLACK cockatoo a floor-clamped
       lum/mean put nearly the whole bird on its floor: the palette was dimmed to 0.55 of itself and
       the bird came out mud. Centring keeps the mean texel at exactly the palette colour. */
    ok(/float shade=1\.0\+\(lum\/max\(uMean,1e-3\)-1\.0\)\*uDetail;/.test(bsrc),
       'the source shading modulates AROUND the palette rather than scaling it down from a floor');
    ok(P.detail>0.1&&P.detail<0.9,'with a real detail amount ('+P.detail+')');
    ok(P.shadeLo>0.4&&P.shadeHi<1.35,'and a guard on the extremes, which is where the cockatoo\'s '+
       'bare red face lives ('+P.shadeLo+'..'+P.shadeHi+')');
    ok(/uMean:\{value:P\.mean\}/.test(bsrc)&&/B\.plume\.mean=/.test(bsrc),
       'and the mean it divides by is MEASURED off the texture, not typed');

    /* (v) THE PALETTE IS ASSERTED AGAINST THE PLATE'S OWN RATIOS, not against a hex I chose.
       kea_underwing_01, sampled: covert 121,33,12 and flight ground 101,91,60. Those two settled
       arguments the eye was losing — the coverts are a deep BRICK, and the flight ground is OLIVE,
       where the first pass had orange over gold and the underwing read as hazard tape. */
    const ch=(h)=>({r:(h>>16)&255,g:(h>>8)&255,b:h&255});
    { const c=ch(P.covert);
      ok(c.g/c.r<0.40,'the coverts are a DEEP RED, not orange — the plate is 33/121 = 0.27 green '+
         'over red ('+(c.g/c.r).toFixed(2)+')');
      ok(c.b/c.r<0.25,'and barely any blue, as the plate has ('+(c.b/c.r).toFixed(2)+')');
      /* AND THE RATIOS ALONE CANNOT TELL BRICK FROM ORANGE, which a sabotage proved: 0xD93A0B —
         the orange the first pass shipped — has g/r 0.27 and b/r 0.05 and passes both tests above.
         What separates them is the RED CHANNEL'S MAGNITUDE. The plate's covert is 121 in a
         photograph, which lifts to about 169 as albedo; orange sits at 217. So the band comes off
         the measurement rather than off a preference. */
      ok(c.r>140&&c.r<196,'and it is BRICK rather than orange — the plate\'s 121 lifts to about '+
         '169 as albedo, where orange sits at 217 (red channel '+c.r+')'); }
    { const f=ch(P.flight);
      ok(f.g/f.r>0.75&&f.g/f.r<1.05,'the flight-feather ground is OLIVE, not gold — the plate is '+
         '91/101 = 0.90 ('+(f.g/f.r).toFixed(2)+')');
      ok(f.b/f.r<0.75,'with the blue well down ('+(f.b/f.r).toFixed(2)+')'); }
    { const b2=ch(P.body);
      ok(b2.g/b2.r>0.70&&b2.g/b2.r<1.0,'the body is a warm olive, R>=G ('+(b2.g/b2.r).toFixed(2)+')');
      /* THE THRESHOLD WAS TIGHTER THAN THE REFERENCE, which is a badly chosen threshold and not a
         finding. kea_posture_01's mantle is #857b5c: b/r = 92/133 = 0.69. The palette sits at 0.70.
         A bound that excludes the plate's own value by a hundredth tests nothing but my rounding,
         so it is set from the plate with room either side. */
      ok(b2.b/b2.r<0.78,'and warm rather than grey — the plate\'s mantle is 0.69 ('+
         (b2.b/b2.r).toFixed(2)+')'); }
    { const bl=ch(P.bill);
      ok(bl.b>bl.g&&bl.g>bl.r,'the bill is SLATE — the one patch on the plate where B > G > R ('+
         [bl.r,bl.g,bl.b].join(',')+')'); }

    /* (vi) AND THE SCALLOPING IS NOT ATTEMPTED, ON PURPOSE. A kea's every body feather is
       dark-rimmed and the cockatoo's albedo has no such edging; tinting cannot synthesise it. It
       needs a painted map, which is a different piece. Recorded so nobody reads its absence as an
       oversight — and so nobody fakes it with a noise term. */
    ok(!/scallop/i.test(bsrc),'no scalloping is faked in the shader — it needs a painted albedo '+
       'and is filed as its own piece'); }

  /* ---- (6c) THE P5e KEA PASS, EACH CHANGE ASSERTED ----
     P5E.md's own constraint: "Every look fix ships with its assertion in the same commit. P5d2
     proved what happens otherwise: seven fixes, seven green sabotages." */
  { const P=B.plume, bsrc=fsx.readFileSync(pathx.join(ROOT,'src/bird.mjs'),'utf8');
    const led=fsx.readFileSync(pathx.join(ROOT,'assets/LICENCES.md'),'utf8');
    const ch=(h)=>({r:(h>>16)&255,g:(h>>8)&255,b:h&255});

    /* (i) THE BILL. The model's own ratio cannot be measured headless — it is a warped GLB — but
       the RECIPE must point at the warped file, and the file must exist and be in the ledger.
       The warp's measured outcome (culmen:head 0.793 -> 1.268 against the plate's 1.27) is
       recorded in LICENCES.md beside the md5, which is the auditable place for it. */
    ok(/kea_bill\.glb/.test(B.url),'the recipe points at the reshaped-bill model ('+B.url+')');
    { const f=pathx.join(ROOT,'assets/models','kea_bill.glb');
      ok(fsx.existsSync(f),'and that file is in the tree');
      ok(led.indexOf('models/kea_bill.glb')>0,'with a ledger row naming the change, as CC-BY '+
         'requires'); }

    /* (ii) THE VALUE LIFT. The plates run 0.46 to 0.70 and centre near 0.52; the P5d2 palette sat
       at 0.486 with a shading FLOOR of 0.62 that cost a fifth of it on lit surfaces and far more in
       shadow. Both halves are asserted: the palette's own value, and the floor that was dragging it
       down. A dark bird was the single loudest defect in Eric's verdict. */
    { const bd=ch(P.body), v=Math.max(bd.r,bd.g,bd.b)/255;
      ok(v>0.52&&v<0.72,'the body palette sits in the plates\' value range, 0.46-0.70 ('+
         v.toFixed(3)+')');
      ok(P.shadeLo>=0.75,'and the shading floor no longer drags it down — 0.62 was costing a fifth '+
         'of the value on lit surfaces ('+P.shadeLo+')');
      ok(P.shadeHi<=1.25,'while still guarding the bright end, where the bare red face lives ('+
         P.shadeHi+')');
      const cr=ch(P.crown), cv=Math.max(cr.r,cr.g,cr.b)/255;
      ok(cv>=v,'the crown is no darker than the body, as both plates show ('+cv.toFixed(3)+
         ' vs '+v.toFixed(3)+')'); }

    /* (iii) THE UPPERWING GREEN, which was ABSENT ENTIRELY and is the plate's most distinctive
       body colour after the underwing. Classed off kea_posture_01 at hue 100, sat 0.41, over 5321
       pixels — it is unambiguously there in the bird and was unambiguously missing in the render. */
    ok(P.wing!==undefined,'there is a folded-upperwing colour at all');
    { const w=ch(P.wing);
      ok(w.g>w.r&&w.g>w.b,'and it is GREEN — g above both r and b ('+[w.r,w.g,w.b].join(',')+')');
      const mxc=Math.max(w.r,w.g,w.b), mnc=Math.min(w.r,w.g,w.b);
      ok((mxc-mnc)/mxc>0.25,'with real saturation, not a grey-green ('+
         ((mxc-mnc)/mxc).toFixed(2)+')'); }
    ok(/c = C\.body\.clone\(\)\.lerp\(C\.wing,gk\)/.test(bsrc),
       'the green BLENDS across the normal rather than switching — a hard split speckled the wing '+
       'vertex by vertex, the same defect as the rainbow collar met on a normal test');

    /* (iv) THE EYE-RING. P5E.md calls it "the cheapest transformation" and names the measurement
       trap explicitly: boxes drawn by eye caught feather instead of ring. The class that produced
       this colour was hue 20-55, sat >= 0.55, over 1981 matched pixels, and it came back
       hsv 41 / 0.75 / 0.64 — which is what is asserted, not the hex. */
    { const e=ch(P.eyeRing);
      const mxc=Math.max(e.r,e.g,e.b), mnc=Math.min(e.r,e.g,e.b);
      const sat=(mxc-mnc)/mxc;
      let h=0; const d=mxc-mnc;
      if(d){ if(mxc===e.r)h=((e.g-e.b)/d+6)%6; else if(mxc===e.g)h=(e.b-e.r)/d+2; else h=(e.r-e.g)/d+4; h*=60; }
      ok(h>=30&&h<=50,'the eye-ring is ORANGE-GOLD, hue 30-50 as the plate measured at 41 ('+
         h.toFixed(0)+')');
      ok(sat>=0.60,'and high-saturation, as the plate measured at 0.75 — a palette sweep must not '+
         'be able to grey it out ('+sat.toFixed(2)+')');
      const dk=ch(P.eyeDark), dv=Math.max(dk.r,dk.g,dk.b)/255;
      ok(dv<0.20,'with a dark eye behind it for contrast ('+dv.toFixed(3)+')'); }
    ok(P.eyeR>0,'the ring is switched on ('+P.eyeR+')');
    ok(P.eyeLat>0&&P.eyeLat<=1.0,'and placed as a fraction of the head\'s HALF-WIDTH, so it lands '+
       'on the surface — the first cut used a single scalar and put a floating eyeball beside the '+
       'head ('+P.eyeLat+')');
    ok(/boneInverses\[headIdx\]/.test(bsrc),
       'the head box is measured in the bone\'s BIND space, which is the space the ring is '+
       'parented into');
    ok(/const fwd=bw\.clone\(\)\.applyMatrix4/.test(bsrc),
       'and forward is derived from the BILL BASE rather than assumed to be an axis');

    /* (v) AND THE THINGS P5E.md SAYS MUST NOT REGRESS. */
    { const f=ch(P.foot);
      ok(f.b>=f.r,'the feet are still the grey-blue that already matched the plate ('+
         [f.r,f.g,f.b].join(',')+')'); }
    ok(P.jawShut>0.3,'the bill still rests shut');
    ok(P.openLo>0,'and there is still no red until the wing opens');
    ok(!/scallop/i.test(bsrc),'and no scalloping is faked — P5E.md puts it outside this scope and '+
       'TODO 84 carries it'); }

  /* ---- (7) THE PRIMITIVE BIRD IS STILL THE ONE THAT SHIPS ----
     Everything above is inert until Eric flips KEABIRD.model. The handles the 80 writes use must
     still be built by buildMesh, or turning the model OFF would leave no bird at all. */
  X.boot({biome:'carpark'}); X.startGame(1); tick(4);
  { const k=G.keas[0];
    ok(!!k,'a bird exists');
    for(const h of ['body','neck','head','jaw','tail'])
      ok(!!k[h]&&k[h].isObject3D,'the '+h+' handle is a real Object3D the pose can write to');
    ok(Array.isArray(k.wings)&&k.wings.length===2,'both wings');
    ok(Array.isArray(k.legs)&&k.legs.length===2,'both legs');
    ok(Array.isArray(k.tailF)&&k.tailF.length>=4,'and the tail fan');
    ok(!k._model,'and no model is attached in a headless build, so the primitive bird is what the '+
       'batteries and the pinned vantages see'); }

  X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();
}

/* ============================================================================================
   REPLAT P6A — THE MODEL-SWAP SEAM. The success condition is that NOTHING CHANGED.
   ============================================================================================
   P6A.md's contract is unusual: the piece is judged by what it did NOT do. So this section is
   mostly invariants, and the numbers it holds them to were measured on the PRE-SEAM tree — the
   commit before the registry existed — rather than read back off the build it is testing. A
   self-consistent measurement would pass on any world; these numbers only pass on THIS one.

   HOW THE PRE-SEAM NUMBERS WERE TAKEN. Boot each biome under the gauntlet seed, walk the scene,
   and hash every MESH's world transform, geometry parameters, material and shadow flags. Meshes
   only, deliberately: the seam gives three props a Group they did not have before (the bench, the
   paddock fence and the roadworks paddle all used to add straight to the scene), and a pure Group
   is not a thing anyone can see. What a reader CAN see is a mesh, and not one of them moved.
   THE UUIDS HAD TO COME OUT OF THAT HASH. three.js serialises an ExtrudeGeometry's shape with its
   uuid, and a uuid is twelve draws from the seeded Math.random — so a first cut of this digest
   compared random numbers and reported drift in the SKI FIELD from a change to a carpark bench.
   THE COLLIDER HASH IS NORMALISED FOR THE SAME CLASS OF REASON. Three sites pushed raw literals
   into G.colliders with their own key order while addBoxCollider used another, so a JSON.stringify
   digest compared spelling. Fixed field order, fixed precision, absent ry === 0. */
C.section('REPLAT P6A: the model-swap seam');
{
  const crypto=require('crypto'), fs=require('fs'), path=require('path');
  const ROOT=path.resolve(__dirname,'..','..');
  const THREE=H.THREE||require('three');

  /* the pre-seam readings, one line per biome, taken on the commit before the registry landed */
  const PRESEAM={
    carpark :{mesh:'1c53ebbf15dcb55c', col:'1b025c57715cb017', meshes:1029, tris:223592,
              inter:64, props:21, colliders:29, cars:6, sheep:3, strips:2, hints:9, snow:0,
              foodSrc:2, gravel:26, stones:26, wear:6, nightMats:6},
    skifield:{mesh:'28d3d95a94deefcc', col:'fc06ef03250ea1ed', meshes:364, tris:43014,
              inter:12, props:12, colliders:11, cars:0, sheep:0, strips:0, hints:4, snow:16,
              foodSrc:0, gravel:0, stones:0, wear:0, nightMats:6},
  };
  const worldRead=(biome)=>{
    X.setSeed(20260828);
    { let t=20260828>>>0; Math.random=()=>{ t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t);
        r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; }
    X.boot({biome}); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe();
    G.scene.updateMatrixWorld(true);
    const mh=crypto.createHash('md5'); let meshes=0, tris=0;
    const v=new THREE.Vector3(), q=new THREE.Quaternion(), s=new THREE.Vector3();
    G.scene.traverse(o=>{
      if(!o.isMesh)return;
      meshes++;
      o.matrixWorld.decompose(v,q,s);
      const g=o.geometry, p=g&&g.parameters, m=o.material;
      const pos=g&&g.attributes&&g.attributes.position;
      if(pos)tris+=(g.index?g.index.count:pos.count)/3;
      mh.update([v.x.toFixed(5),v.y.toFixed(5),v.z.toFixed(5),
                 q.x.toFixed(5),q.y.toFixed(5),q.z.toFixed(5),q.w.toFixed(5),
                 s.x.toFixed(5),s.y.toFixed(5),s.z.toFixed(5),
                 (g?g.type:'-'),
                 (p?JSON.stringify(p).replace(/"uuid":"[^"]*",?/g,''):'-'),
                 (m?(m.type+':'+(m.color?m.color.getHexString():'-')+':'+
                   (m.roughness!==undefined?m.roughness.toFixed(3):'-')):'-'),
                 (o.castShadow?'C':'-')+(o.receiveShadow?'R':'-')+(o.visible?'V':'-')].join('|')+'\n');
    });
    const CF=c=>[c.kind,(c.x||0).toFixed(6),(c.z||0).toFixed(6),(c.w||0).toFixed(6),(c.d||0).toFixed(6),
      (c.top||0).toFixed(6),(c.ridge||0).toFixed(6),(c.slope||0).toFixed(6),
      c.solid?1:0,(c.ry||0).toFixed(6),c.slide?1:0,c.hut?1:0].join(',');
    const ch=crypto.createHash('md5');
    for(const c of G.colliders)ch.update(CF(c)+'\n');
    return {mesh:mh.digest('hex').slice(0,16), col:ch.digest('hex').slice(0,16),
            meshes, tris:Math.round(tris),
            inter:G.inter.length, props:G.props.length, colliders:G.colliders.length,
            cars:G.cars.length, sheep:G.sheep.length, strips:G.strips.length,
            hints:G.hints.length, snow:G.snow.length, foodSrc:(G.foodSrc||[]).length,
            gravel:(G.gravel||[]).length, stones:(G.stones||[]).length, wear:(G.wear||[]).length,
            nightMats:(G.nightMats||[]).length, CF};
  };

  /* ---- (1) THE WORLD IS THE WORLD IT WAS ---- */
  for(const biome of ['carpark','skifield']){
    const r=worldRead(biome), want=PRESEAM[biome];
    ok(r.mesh===want.mesh, biome+': every mesh is where it was before the seam, with the geometry, '+
       'material and shadow flags it had — world mesh digest '+r.mesh+' against '+want.mesh);
    ok(r.col===want.col, biome+': every collider is where it was, in the order it was pushed — '+
       'collider digest '+r.col+' against '+want.col);
    for(const k of ['meshes','tris','inter','props','colliders','cars','sheep','strips','hints',
                    'snow','foodSrc','gravel','stones','wear','nightMats'])
      ok(r[k]===want[k], biome+': '+k+' is unchanged at '+want[k]+' (got '+r[k]+')');
  }

  /* ---- (2) THE REGISTRY IS A REGISTRY, and every row carries the six columns P6A.md names ---- */
  const P=X.PROPS, ALL=P.ALL, IDS=Object.keys(ALL);
  ok(IDS.length>=20,'the registry holds a real prop tier, not a demo ('+IDS.length+' entries)');
  let shipsModel=[], noBuild=[], badCol=[], badAnchor=[], badMat=[], badFit=[];
  for(const id of IDS){ const e=ALL[id];
    if(e.source!=='primitive')shipsModel.push(id);
    if(typeof e.build!=='function')noBuild.push(id);
    if(!Array.isArray(e.collider))badCol.push(id);
    for(const c of e.collider){
      if(c.kind==='box'){ if(!(c.w>0&&c.d>0&&isFinite(c.top)))badCol.push(id+'.box'); }
      else if(c.kind==='roof'){ if(!(c.w>0&&c.d>0&&isFinite(c.ridge)&&isFinite(c.slope)))badCol.push(id+'.roof'); }
      else badCol.push(id+'.'+c.kind); }
    for(const [n,a] of Object.entries(e.anchors))
      if(!(isFinite(a.x)&&isFinite(a.z)&&(a.y===undefined||isFinite(a.y))))badAnchor.push(id+'.'+n);
    if(!e.material||typeof e.material.keepModelPBR!=='boolean'||typeof e.material.nightTint!=='boolean')badMat.push(id);
    if(!e.fit||!(e.fit.standM===null||e.fit.standM>0)||!['x','y','z'].includes(e.fit.axis))badFit.push(id);
    if(!e.biome)badMat.push(id+'.biome');
  }
  ok(shipsModel.length===0,'NOTHING SHIPS SWAPPED — every entry is source:primitive ('+
     (shipsModel.join(', ')||'none is not')+')');
  ok(noBuild.length===0,'every entry names a primitive builder, so a failed model always has '+
     'something to fall back to ('+(noBuild.join(', ')||'all do')+')');
  ok(badCol.length===0,'every declared collider is a shape groundHeightAt can read ('+
     (badCol.join(', ')||'all are')+')');
  ok(badAnchor.length===0,'every declared anchor is a finite point ('+(badAnchor.join(', ')||'all are')+')');
  ok(badMat.length===0,'every entry declares a material policy and a biome ('+(badMat.join(', ')||'all do')+')');
  /* A MISSPELLED FAMILY MUST NOT LOOK LIKE A POLICY, and the first cut of this registry had three
     of them: 'wood' and 'metal' have never been families, and it is 'corrugate' not 'corrugated'.
     None would have done anything at all. defineProp throws on an unknown name now — which is why
     this reads the FAMILY LIST rather than re-typing it, and why the throw is driven below. */
  { const fams=Object.keys(X.MATS.families);
    const bad=IDS.filter(id=>ALL[id].material.family!==null&&!fams.includes(ALL[id].material.family));
    ok(bad.length===0,'every declared material family is one of the '+fams.length+' P3 families ('+
       (bad.map(b=>b+'='+ALL[b].material.family).join(', ')||'all are')+')');
    let threw=false;
    try{ P.define('__p6a_bad_family__',{build(){},material:{family:'metal'}}); }catch(e){ threw=true; }
    ok(threw,'and defineProp REFUSES an unknown family rather than silently ignoring it');
    delete ALL.__p6a_bad_family__;
    let threw2=false;
    try{ P.define('__p6a_no_build__',{}); }catch(e){ threw2=true; }
    ok(threw2,'and refuses an entry with no primitive builder');
    delete ALL.__p6a_no_build__;
    let threw3=false;
    try{ P.define('bench',{build(){}}); }catch(e){ threw3=true; }
    ok(threw3,'and refuses a duplicate id, so two rows cannot claim one object'); }
  ok(badFit.length===0,'every entry declares a usable model normalisation ('+(badFit.join(', ')||'all do')+')');

  /* ---- (3) THE ANCHORS DO NOT COME FROM THE GEOMETRY ----
     The claim P6A.md calls the highest-risk thing in the piece, driven rather than argued: read
     every anchor of every placed prop, then DESTROY the bodies — hide them, move them, scale them
     to nothing — and read them all again. A single anchor that consulted a mesh moves. */
  X.setSeed(20260828); X.boot({biome:'carpark'});
  {
    const reg=G.propReg;
    ok(reg.length>=20,'the carpark places a real prop tier through the registry ('+reg.length+')');
    const snap=()=>reg.map(p=>Object.keys(p.entry.anchors).sort().map(n=>{
      const a=P.anchor(p,n); return p.id+'.'+n+'='+a.x.toFixed(9)+','+a.y.toFixed(9)+','+a.z.toFixed(9);
    }).join(';')).join('|');
    const before=snap();
    let moved=0;
    for(const p of reg)for(const o of p.body){ o.visible=false; o.position.set(999,999,999);
      o.scale.setScalar(0.001); moved++; }
    G.scene.updateMatrixWorld(true);
    ok(moved>0,'there were bodies to destroy ('+moved+' meshes)');
    ok(snap()===before,'EVERY ANCHOR IN THE WORLD SURVIVES THE BODY BEING DESTROYED — '+
       'not one of them reads a mesh');
    /* and the colliders are equally untouched, for the same reason */
    const colBefore=G.colliders.map(c=>JSON.stringify(c)).join('|');
    G.scene.updateMatrixWorld(true);
    ok(G.colliders.map(c=>JSON.stringify(c)).join('|')===colBefore,
       'and so is every collider — the physical world does not consult a vertex either');
  }

  /* ---- (4) THE COLLIDER IS THE ENTRY'S, NOT THE BODY'S ----
     Recompute each placement's colliders straight from its entry and its transform, and check the
     ones actually in G.colliders are those, by value. This is what makes "a swapped model must not
     silently change what the bird can perch on" a property rather than a promise. */
  X.setSeed(20260828); X.boot({biome:'carpark'});
  {
    let n=0, wrong=[];
    for(const p of G.propReg){
      const want=p.entry.collider.map(c=>P.collider(p,c));
      if(want.length!==p.colliders.length){ wrong.push(p.id+' count'); continue; }
      for(let i=0;i<want.length;i++){ n++;
        if(JSON.stringify(want[i])!==JSON.stringify(p.colliders[i]))wrong.push(p.id+'['+i+']');
        if(G.colliders.indexOf(p.colliders[i])<0)wrong.push(p.id+'['+i+'] not in the world'); }
    }
    ok(n>0,'there are registry colliders to check ('+n+')');
    ok(wrong.length===0,'every emitted collider is exactly what the entry declares, transformed by '+
       'the placement ('+(wrong.join(', ')||'all '+n+' of them')+')');
  }

  /* ---- (5) BOTH DIRECTIONS, AT THE REGISTRY ----
     P6A.md: "A registry that can only go one way is half a seam." The browser half is proved in
     pictures by gauntlet/verify/p6a-swap.mjs; this is the half a battery can see. Flip an entry to
     source:'model', rebuild, and check that the world is IDENTICAL — because the primitive body is
     always built (a GLB is a fetch, and a fetch can fail), the collider and the anchors come from
     the entry either way, and the only thing that changes headless is which source the placement
     says it WANTS. Then flip it back and check it is identical again. */
  {
    const e=ALL.bench, was={source:e.source, url:e.url, fit:Object.assign({},e.fit)};
    const read=()=>{ const r=worldRead('carpark');
      const p=P.placed('bench');
      return {mesh:r.mesh, col:r.col, colliders:r.colliders,
              anchors:Object.keys(p.entry.anchors).map(n=>{const a=P.anchor(p,n);
                return n+'='+a.x+','+a.y+','+a.z;}).join(';'),
              mode:p.mode, source:p.source, body:p.body.length,
              vis:p.body.filter(o=>o.visible).length}; };
    const prim=read();
    e.source='model'; e.url='models/placeholder_box.glb';
    e.fit=Object.assign({},e.fit,{standM:0.98,axis:'y',ground:true});
    const asModel=read();
    e.source=was.source; e.url=was.url; e.fit=was.fit;
    const back=read();

    ok(prim.source==='primitive'&&asModel.source==='model'&&back.source==='primitive',
       'the entry flips both ways and the placement reports which it wants ('+
       prim.source+' -> '+asModel.source+' -> '+back.source+')');
    ok(asModel.mode==='primitive','and headless it STAYS on the primitive body, because nothing '+
       'fetched a GLB — a battery must never depend on the network');
    ok(asModel.body===prim.body&&asModel.vis===prim.vis,
       'the primitive body is built and visible either way, so a failed load has something to '+
       'fall back to ('+asModel.vis+' of '+asModel.body+' meshes)');
    ok(asModel.col===prim.col,'THE COLLIDER WORLD IS BYTE-IDENTICAL with the entry asking for a '+
       'model ('+asModel.col+')');
    ok(asModel.colliders===prim.colliders,'and the collider COUNT is unchanged ('+asModel.colliders+')');
    ok(asModel.anchors===prim.anchors,'THE ANCHORS ARE IDENTICAL with the entry asking for a model');
    ok(asModel.mesh===prim.mesh,'and so is every mesh in the world — asking for a model changes '+
       'nothing until one actually arrives');
    ok(back.mesh===prim.mesh&&back.col===prim.col&&back.anchors===prim.anchors,
       'AND THE FLIP BACK RETURNS THE WORLD EXACTLY — the seam goes both ways');
  }

  /* ---- (5b) EVERY MISSION ANCHOR RESOLVES TO THE POINT IT RESOLVED TO BEFORE ----
     THIS IS THE ASSERTION THE SECTION BELOW CANNOT MAKE, and it was added because the section
     below was SABOTAGED AND DID NOT BITE. Moving the bin lid anchor a millimetre in the registry
     passed every check in (6), because (6) asks whether the mission reads the entry — and it does,
     so the mission moved with it. A seam whose two halves agree with each other proves only that
     they agree.
     So this asks the question from outside the seam entirely: walk every interactable in the world,
     call the getPos() the game itself calls, and hash the answers against what the PRE-SEAM tree
     answered. Sixty-five points in the carpark, twelve in the ski field, plus every teaching hint —
     which are placed points too, and two of them moved from raw arithmetic to a declared anchor in
     this piece. One millimetre anywhere and this goes red. */
  {
    const digest=(biome)=>{
      X.setSeed(20260828);
      { let t=20260828>>>0; Math.random=()=>{ t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t);
          r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; }
      X.boot({biome}); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); X.startGame(1); tick(4);
      const rows=[];
      for(const it of G.inter){ let q=null;
        try{ q=it.getPos?it.getPos():null; }catch(e){ q=null; }
        rows.push([it.kind,(it.label||'').replace(/\s*\(\d+\/\d+\)\s*$/,''),
          q?+q.x.toFixed(6):null,q?+q.y.toFixed(6):null,q?+q.z.toFixed(6):null]); }
      rows.sort((a,b)=>(a[1]+a[0]).localeCompare(b[1]+b[0])||a[2]-b[2]);
      const hints=G.hints.map(h=>[h.mid,+h.x.toFixed(6),+h.y.toFixed(6),+h.z.toFixed(6),h.r]).sort();
      const md=o=>crypto.createHash('md5').update(JSON.stringify(o)).digest('hex').slice(0,16);
      return {n:rows.length, inter:md(rows), hints:md(hints), hn:hints.length};
    };
    const WANT={carpark :{n:65, inter:'4a9acee400d03854', hn:9, hints:'6e9458ae1276c86f'},
                skifield:{n:12, inter:'d468e22d35759485', hn:4, hints:'1383d48400f14029'}};
    for(const b of ['carpark','skifield']){
      const r=digest(b), w=WANT[b];
      ok(r.n===w.n,b+': the same number of interactables answer ('+r.n+' against '+w.n+')');
      ok(r.inter===w.inter,b+': EVERY MISSION ANCHOR RESOLVES TO THE POINT IT RESOLVED TO BEFORE '+
         'THE SEAM — '+r.n+' interactables, digest '+r.inter+' against '+w.inter);
      ok(r.hn===w.hn,b+': the same number of teaching hints ('+r.hn+' against '+w.hn+')');
      ok(r.hints===w.hints,b+': and every hint is at the point it was, including the two that '+
         'stopped being hand-written arithmetic in this piece — digest '+r.hints+' against '+w.hints);
    }
  }

  /* ---- (6) THE MISSION ANCHORS THAT ACTUALLY MATTER ----
     The seal is the canary; the rest of these are the anchors P6A.md names by hand. Every one is
     read through the live interactable rather than through the registry, so this checks the WIRING
     and not just the arithmetic. */
  X.setSeed(20260828); X.boot({biome:'carpark'}); X.startGame(1); tick(4);
  {
    const seal=G.inter.find(t=>t.strip&&/DOOR SEAL/.test(t.label));
    ok(!!seal,'the caravan door seal is still a strip tear on a registry-placed campervan');
    ok(seal&&seal.strip.N===12,'and it is still a TWELVE step path (N '+(seal&&seal.strip.N)+')');
    const van=P.placed('campervan');
    ok(!!van&&van.id==='campervan','the campervan is a placement');
    /* the bead is drawn in the placement's frame, so the strip's own world head must agree with
       the entry's declared door anchor to within the bead's own offset */
    { const a=P.anchor(van,'door'), q=seal.getPos();
      ok(Math.hypot(q.x-a.x,q.z-a.z)<1.6,'and the seal frontier is at the declared door anchor '+
         '('+q.x.toFixed(2)+','+q.z.toFixed(2)+' against '+a.x.toFixed(2)+','+a.z.toFixed(2)+')'); }
    const named=[['bin','lid','PECK BIN LID'],['bin','body','TIP THE BIN'],
                 ['doc_ute','latch','PECK THE LATCH'],['sheep_pen','twine','BALING TWINE'],
                 ['trailer','tarp','TUG TARP'],['chilly_bin','latch','TUG LATCH'],
                 ['roadworks_paddle','face','ROADWORKS PADDLE'],['sign_dontfeed','panel','TEAR DOWN SIGN'],
                 ['tent','guyA','GUY-LINE'],['handbag','clasp','HANDBAG'],['trail_pack','zip','UNATTENDED PACK']];
    for(const [id,an,frag] of named){
      const p=P.placed(id), it=G.inter.find(i=>i.label&&i.label.includes(frag));
      if(!p){ ok(false,'prop '+id+' is placed'); continue; }
      if(!it){ ok(false,'the '+frag+' interactable exists'); continue; }
      const a=P.anchor(p,an), q=it.getPos();
      ok(Math.abs(q.x-a.x)<1e-9&&Math.abs(q.y-a.y)<1e-9&&Math.abs(q.z-a.z)<1e-9,
         frag+' reads the '+id+'.'+an+' anchor exactly ('+q.x.toFixed(6)+','+q.y.toFixed(6)+','+
         q.z.toFixed(6)+')');
    }
    /* the wipers and the aerial are read off their MESHES on purpose — they are the anchors a
       model would have to bring geometry for, and the entry records where they must land */
    for(const id of ['car_red','car_blue','car_white','car_yellow']){
      const p=P.placed(id);
      ok(!!p&&p.colliders.length===1,id+' is a placement with exactly its declared collider');
      ok(!!p.entry.anchors.wiperL&&!!p.entry.anchors.wiperR&&!!p.entry.anchors.aerial,
         'and it declares where a model must put its wipers and its aerial');
    }
  }

  /* ---- (7) THE CONFIG SEAM REFUSES LOUDLY ----
     A misspelled id must not look like a swap that did nothing — the failure that cost session 17
     a whole variant strip on KEAMATS, met here before it can happen again. */
  {
    const src=fs.readFileSync(path.join(ROOT,'src','game.mjs'),'utf8');
    ok(/function propsConfig\(\)/.test(src),'there is a KEAPROPS merge');
    ok(/PROPSIGNORED\.push\(id\+' \(no such prop\)'\)/.test(src),
       'and an unknown prop id is REPORTED rather than ignored');
    ok(/matMerge\(PROPS\[id\],over,id,2,PROPSIGNORED\)/.test(src),
       'and a leaf that does not exist on the entry goes through the same depth-limited merge '+
       'KEASKY and KEAMATS use, so a typo cannot look like a tuning');
    ok(/ignored:PROPSIGNORED\.slice\(\)/.test(src),
       'and what was refused travels out in G.propsState for the rig to fail the pass on');
    const wr=fs.readFileSync(path.join(ROOT,'gauntlet','verify','webrig.mjs'),'utf8');
    ok(/KEAPROPS/.test(wr)&&/__KEA_PROPS__/.test(wr),
       'and the rig can set it without a rebuild, the way it can set the sky, the materials, the '+
       'grass and the bird');
  }

  /* ---- (8) THE MODEL TIER CANNOT REACH THE COLLIDERS OR THE ANCHORS ----
     Stated as a property of the source rather than as a promise in a comment: the file that
     installs models has no reference to G.colliders, no reference to the anchor table, and never
     calls the collider emitter. If a later session adds one, this goes red. */
  {
    const m=fs.readFileSync(path.join(ROOT,'src','models.mjs'),'utf8');
    ok(!/G\.colliders/.test(m),'src/models.mjs never touches G.colliders');
    ok(!/\.collide\(/.test(m),'and never emits a collider');
    ok(!/entry\.anchors\s*\[/.test(m)&&!/propAnchor/.test(m),
       'and never computes an anchor — both are the registry\'s, decided at build time');
    ok(/for\(const o of p\.body\)o\.visible=false;/.test(m),
       'the primitive body is HIDDEN rather than deleted, so the way back needs nothing restored');
    ok(/export function revertProp/.test(m),'and there is a way back that does not need a reload');
    ok(/CACHE/.test(m),'one fetch per url however many props share it');
    ok(/m\.clone\(\)/.test(m),'and the materials are cloned per prop, or tinting one bin would '+
       'tint all four');
    ok(/failed\.push/.test(m),'a failed load is recorded and the game keeps playing');
    const mn=fs.readFileSync(path.join(ROOT,'src','main.mjs'),'utf8');
    ok(/installModels/.test(mn)&&/await import\('\.\/models\.mjs'\)/.test(mn),
       'it is wired from main.mjs behind a dynamic import, so game.mjs keeps the single import the '+
       'specimen loader asserts');
    ok(/catch \(e\)/.test(mn.slice(mn.indexOf('installModels'))),
       'and it cannot take the game down');
  }

  /* ---- (9) THE PLACEHOLDER ASSET LANDED THE WAY EVERY ASSET HAS TO ---- */
  {
    const glb=path.join(ROOT,'assets','models','placeholder_box.glb');
    ok(fs.existsSync(glb),'the placeholder GLB is in the tree');
    if(fs.existsSync(glb)){
      const b=fs.readFileSync(glb);
      ok(b.toString('ascii',0,4)==='glTF'&&b.readUInt32LE(4)===2,'and it is a real binary glTF 2.0');
      ok(b.readUInt32LE(8)===b.length,'whose header length agrees with the file ('+b.length+' bytes)');
      const jl=b.readUInt32LE(12);
      let j=null; try{ j=JSON.parse(b.toString('utf8',20,20+jl)); }catch(e){}
      ok(!!j,'and whose JSON chunk parses — space-padded, as the spec requires, not zero-padded');
      ok(j&&j.meshes&&j.meshes.length===1,'one mesh');
      const led=fs.readFileSync(path.join(ROOT,'assets','LICENCES.md'),'utf8');
      const row=led.match(/<!-- ASSET file=models\/placeholder_box\.glb md5=([0-9a-f]{32})[^>]*-->/);
      ok(!!row,'it has its licence-ledger row, like any other asset');
      if(row)ok(row[1]===crypto.createHash('md5').update(b).digest('hex'),
        'and the bytes on disk are the bytes the ledger names');
      ok(/CC0/.test(led.slice(led.indexOf('THE PLACEHOLDER BOX'))),'recorded as CC0');
      ok(fs.existsSync(path.join(ROOT,'gauntlet','verify','mkplaceholder.mjs')),
         'and the generator that made it is in the tree, so the provenance is re-runnable rather '+
         'than asserted');
    }
  }

  /* ---- (10) AND THE SEAM IS ACTUALLY USED ---- */
  X.setSeed(20260828); X.boot({biome:'carpark'});
  {
    const st=G.propsState;
    ok(st&&st.placed>=20,'the carpark builds its prop tier through the registry ('+
       (st&&st.placed)+' placements)');
    ok(st.model===0&&st.wantModel.length===0,'and not one of them is swapped');
    ok(st.ignored.length===0,'and no KEAPROPS path was refused on a plain boot');
    ok(st.anchors>=40,'the registry carries a real anchor table ('+st.anchors+' named points)');
    /* WHAT EACH BODY ACTUALLY WEARS IS MEASURED, so the census cannot drift from the world the way
       a declared list would. The hut is the one worth naming: two families off one prop. */
    { const fams=Object.keys(X.MATS.families);
      const bad=Object.entries(st.families).filter(([id,fs])=>fs.some(f=>!fams.includes(f)));
      ok(bad.length===0,'every family a placed body actually resolved is a real one ('+
         (bad.map(b=>b[0]).join(', ')||'all are')+')');
      ok(Object.keys(st.families).length>0,'and the measurement found some ('+
         Object.entries(st.families).map(([k,v])=>k+':'+v.join('+')).join(', ')+')');
      const hut=st.families.hut||[];
      ok(hut.includes('weatherboard')&&hut.includes('corrugate'),
         'the hut wears TWO scanned families off one prop, which is why `family` on an entry is '+
         'recorded intent for a model and not a claim about the primitive ('+hut.join('+')+')'); }
    const src=fs.readFileSync(path.join(ROOT,'src','game.mjs'),'utf8');
    ok(!/addBoxCollider\(x,z,1\.9,0\.6,0\.62,true\)/.test(src),
       'and the migrated props no longer push their own colliders at the call site');
    ok(X.WORLDREGS.includes('propReg'),'propReg is emptied by the dispatcher like every other '+
       'list a build fills, so a second boot cannot leave the first map\'s placements on the board');
    X.boot({biome:'skifield'});
    ok(G.propReg.length>0&&G.propReg.every(p=>p.entry.biome==='skifield'||p.entry.biome==='*'),
       'and a build only places props that belong to its map ('+
       G.propReg.map(p=>p.id).join(', ')+')');
    X.boot({biome:'carpark'});
    ok(G.propReg.length===st.placed,'and rebuilding the carpark places exactly the same tier again ('+
       G.propReg.length+')');
  }

  X.setSeed(20260828); X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();
}

/* ============================================================================================
   THE DOC CAMPGROUND — the third map boots, and it declares everything a map has to declare
   ============================================================================================
   CAMPGROUND.md, following pieces 39 and 40 exactly. The first thing to say is what it is NOT:
   nothing graduated. The carpark keeps its tent, its clothes line, its chilly bin and its picnic
   set, and it keeps them for the reason TODO 47 records — propAt draws a deliberate rnd per prop so
   the country cannot move, so deleting one carpark prop reshuffles grass, snow, tussock and beech
   across all 28 baselines. Two maps have a tent. That is what campgrounds and carparks are like.
   ADDITIVITY IS NOT ASSERTED HERE, AND THAT IS DELIBERATE: the P6A section above already holds the
   carpark and ski field mesh digests and collider digests to the values measured before the prop
   seam landed, and a third map that moved either would go red there — in the instrument built for
   exactly that question — rather than in a new assertion written to agree with this one. */
C.section('THE DOC CAMPGROUND - the third map, additive, with its own cast and its own list');
{
  const B=X.BIOME, T=X.TOUR, P=X.PROPS;
  const camp=()=>B.ALL.campground||{};
  const boot=()=>{ X.setSeed(20260828); X.boot({biome:'campground'}); X.SAVE&&X.SAVE.wipe&&X.SAVE.wipe(); };

  // 1. THE REGISTRATION IS A DECLARATION, and every part of it is something a map cannot do without.
  ok(typeof camp().build==='function','the campground carries its builder');
  ok(typeof camp().cast==='function','and its cast, so nobody else furniture arrives with it');
  ok(typeof camp().missions==='function','and its own list, so it cannot hand out carpark jobs');
  ok(!!camp().anchor,'and an anchor to establish it from');
  ok(camp().label==='THE DOC CAMPGROUND','and the label the brochure pin already carries ('+camp().label+')');
  ok(T.TABLE.some(t=>t.id==='campground'),'and it was on the brochure before it had a builder');

  // 2. IT BOOTS, AND IT IS A MAP RATHER THAN A STUB.
  boot();
  ok(G.biome==='campground','booting into the campground lands there ('+G.biome+')');
  ok(G.scene.children.length>60,'and it is a populated world ('+G.scene.children.length+' children)');
  ok(G.colliders.length>=10,'with a physical world under it ('+G.colliders.length+' colliders)');
  ok(G.inter.length>=9,'and things to do to it ('+G.inter.length+' interactables)');

  /* 3. THE FIVE DECLARATIONS THAT ONLY LOOK LIKE CONSTANTS. Piece 39 found four the hard way and
        the one it did NOT find put seven hatchbacks across the ski field snow. Every one is asked
        of this map rather than assumed, and two of them are asserted to be EMPTY — declared empty
        is a different thing from forgotten, and only an assertion can tell them apart. */
  ok(G.nestPos&&G.nestPos.x===-34&&G.nestPos.z===-26,
     'the map owns its nest site rather than inheriting the carpark one ('+JSON.stringify(G.nestPos)+')');
  ok((G.snow||[]).length===0,'a river flat in summer has no drifts, and the envelope is declared '+
     'empty rather than left out ('+(G.snow||[]).length+')');
  ok(camp().snow===null,'and the biome says so in its own registration ('+String(camp().snow)+')');
  ok(!camp().traffic,'the campground track takes no through traffic, declared rather than omitted');
  X.startGame(1); tick(30);
  ok(G.cars.filter(c=>c.traffic).length===0,
     'so nothing spawns onto it — the ski field learned that one with seven hatchbacks ('+
     G.cars.filter(c=>c.traffic).length+')');
  ok(G.humans.length===3,'and the cast is three campers, because the soft things have to belong to '+
     'somebody ('+G.humans.map(h=>h.key).join(', ')+')');
  ok(!G.humans.some(h=>h.key==='rex'),'and NOT the ranger: the jail verb is wired to G.cage, which '+
     'this map does not build, so a second ranger would be a second cell');

  // 4. EVERY PROP IS A REGISTRY ENTRY, which is how the model pass will find them.
  { const reg=G.propReg||[];
    ok(reg.length>=15,'the campground builds its furniture through the P6A registry ('+reg.length+')');
    const foreign=reg.filter(p=>p.entry.biome!=='campground'&&p.entry.biome!=='*');
    ok(foreign.length===0,'and every placement belongs to this map or to every map ('+
       (foreign.map(p=>p.id+'='+p.entry.biome).join(', ')||'all do')+')');
    ok(reg.every(p=>p.source==='primitive'),'all of them primitive, because no model has arrived');
    /* THE PLACEHOLDER NOTE THE BRIEF PROMISED IS THIS ASSERTION, not a list in a markdown file:
       every campground prop carries the columns a model swap needs, so `PROPS.ALL` IS the list. */
    const entries=Object.values(P.ALL).filter(e=>e.biome==='campground');
    ok(entries.length>=10,'and the registry can be READ as the model pass work list ('+
       entries.length+' entries)');
    ok(entries.every(e=>typeof e.build==='function'&&Array.isArray(e.collider)&&!!e.anchors),
       'each with the builder, collider and anchors a swap needs'); }

  // 5. THE LIST IS THIS MAP'S OWN, AND NOT ONE ID IS SHARED WITH ANOTHER MAP.
  { const ids=G.missions.map(m=>m.id);
    ok(G.missions.length>=8&&G.missions.length<=12,
       'eight to twelve jobs and a finale, as the brief asks ('+G.missions.length+')');
    ok(G.chapters.length===2,'on two star pages ('+G.chapters.join(' | ')+')');
    ok(G.missions.every(m=>m.finale||G.chapters.includes(m.area)),
       'and every job belongs to a page this map declares');
    ok(G.missions.some(m=>m.finale),'there is a finale, declared with the mission');
    /* THE CROSS-MAP CHECK, now over THREE lists rather than two. Piece 40 asserted it against the
       carpark; a third map is where an id collision actually becomes likely.
       BOTH MODES, AND THAT GAP WAS FOUND BY SABOTAGE. The first cut compared one-player lists only,
       and a deliberate collision on `tarp` came back green — because `tarp` is a COOP mission and
       exists only when the carpark is started in mode 2. Half the ids on every map were outside the
       check. Every list is now taken in both modes and unioned. */
    const listOf=(biome,mode)=>{ X.boot({biome}); X.startGame(mode); return G.missions.map(m=>m.id); };
    const other=new Set([...listOf('carpark',1),...listOf('carpark',2),
                         ...listOf('skifield',1),...listOf('skifield',2)]);
    const mine=new Set([...listOf('campground',1),...listOf('campground',2)]);
    const clash=[...mine].filter(i=>other.has(i));
    ok(clash.length===0,'not one campground mission id appears on another map, in either mode ('+
       (clash.join(', ')||'none of '+mine.size+' does, against '+other.size+' elsewhere')+')');
    ok(mine.size>ids.length,'and the coop badge is inside the check rather than outside it ('+
       mine.size+' ids across both modes against '+ids.length+' in one)'); }

  /* 6. AND THE JOBS COMPLETE, DRIVEN, IN THIS MAP. Every one that can be reached by the perch idiom
        is driven rather than argued — the ones that are pure position checks are driven by standing
        the bird where the mission says and letting update() decide. */
  boot(); X.startGame(1); tick(6);
  { const k=kq();
    const stand=(x,z,y)=>{ for(let i=0;i<4;i++){ k.x=x; k.z=z; k.y=y; k.vy=0; k.grounded=true;
      k.stun=0; X.update(1/60); } };
    const M=id=>G.missions.find(m=>m.id===id)||{};
    // the shelter roof, which is a collider this map built
    const SH=P.placed('camp_shelter');
    const r=P.anchor(SH,'ridge');
    stand(r.x,r.z,r.y+0.05); tick(4);
    ok(M('c_roof').done===true,'the cook shelter roof is standable, and holding it pays ('+
       'y '+k.y.toFixed(2)+')');
    // the finale is locked until the list is done, which is the piece 55 gate doing its work
    ok(M('c_gate').locked===true||M('c_gate').done!==true,
       'and the finale is not reachable before the list is');
    // the tap puddle: drop something of somebody else in it
    const boot0=G.props.find(p=>p.name==='tramping boot');
    ok(!!boot0,'there are boots outside the tent to rehome ('+
       G.props.filter(p=>p.name==='tramping boot').length+')');
    if(boot0){ boot0.x=X.CAMP.TAP.x; boot0.z=X.CAMP.TAP.z; boot0.y=0.1;
      boot0.mesh.position.set(boot0.x,boot0.y,boot0.z); tick(4);
      ok(M('c_tap').done===true,'and a boot left in the tap puddle is noticed'); }
  }

  // 7. THE BROCHURE PIN FLIPS, which is the whole point of registering a builder.
  { X.boot({biome:'carpark'}); X.startGame(1); tick(4);
    const pin=T.model().pins.find(p=>p.id==='campground');
    ok(!!pin&&pin.built===true,'the campground pin knows its map is built now');
    ok(pin.state!=='soon','so the brochure stops saying NOT BUILT YET ('+pin.state+')'); }

  X.setSeed(20260828); X.boot({biome:'carpark'}); X.startGame(1); tick(4); park();
}

process.exitCode=C.report()?1:0;
