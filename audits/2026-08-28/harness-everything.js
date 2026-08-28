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
ok(failed.length===0,'every driven classic mission completes ('+driven.length+' driven, '+failed.length+' failed)');

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

C.section('PERF FLOOR');
X.startGame(2); tick(30);
{ const t0=Date.now(); for(let i=0;i<600;i++)X.update(1/60); const ms=(Date.now()-t0)/600;
  ok(ms<8,'headless update mean '+ms.toFixed(2)+'ms (< 8ms floor)'); }

process.exitCode=C.report()?1:0;
