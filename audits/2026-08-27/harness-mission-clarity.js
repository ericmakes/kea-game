/* MISSION CLARITY AUDIT 2026-08-27 — guidance-source classification, both modes */
const {load}=require('../2026-08-26/rig');
const H=load(),{X,G}=H; X.boot();
const STOP=new Set(['the','a','an','of','at','on','in','to','your','their','his','her','from','with','all','three','both','into','it','and','someone','somebody','any']);
function words(s){ return s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w&&!STOP.has(w)); }
function classify(mode){
  X.startGame(mode);
  const rows=[];
  for(const m of G.missions){
    if(m.hide)continue;
    let src='detector', tgt='';
    const p=G.props.find(p=>p.mission===m.id||p.missionProg===m.id||p.missionFar===m.id||p.snack===m.id);
    if(p){ src='prop'; tgt=p.name+' @'+p.x.toFixed(0)+','+p.z.toFixed(0); }
    else {
      const lw=new Set(words(m.label));
      const t=G.inter.find(t=>t.label&&words(t.label).some(w=>lw.has(w)));
      if(t){ src='prompted'; const q=t.getPos?t.getPos():{x:0,z:0}; tgt=t.label.split('(')[0].trim()+' @'+q.x.toFixed(0)+','+q.z.toFixed(0); }
    }
    rows.push({id:m.id,area:(m.area||'').slice(0,14),src,coop:!!m.coop,fin:!!m.finale,label:m.label,tgt});
  }
  return rows;
}
for(const [name,mode,opts] of [['CLASSIC',1,null]]){
  console.log('=== '+name+' ===');
  for(const r of classify(mode))
    console.log((r.src+'        ').slice(0,9)+'| '+(r.id+'          ').slice(0,10)+'| '+(r.area+'              ').slice(0,14)+'| '+r.label+(r.coop?'  [COOP]':'')+(r.tgt?'  ->  '+r.tgt:''));
}
X.startGame(1); X.defineMissions(2,{colossal:true});
console.log('=== COLOSSAL ===');
for(const m of G.missions){ let lk=''; try{ lk=(typeof m.locked==='function'&&m.locked())?' [LOCKED@start]':''; }catch(e){}
  console.log((m.id+'            ').slice(0,12)+'| '+m.label+lk); }
