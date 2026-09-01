// VANTAGE STABILITY — reshoot a vantage N times and measure take-to-take SSIM.
// Usage: node gauntlet/verify/stability.mjs [ids]   env: TAKES (default 3)
//
// diff.mjs asks "did this frame change since the baseline". It CANNOT ask "is this frame
// reproducible at all", and a vantage whose staging drifts with machine load reads as permanent
// drift no matter how often it is re-pinned. This is the instrument for that second question:
// it compares takes against EACH OTHER, so the baseline plays no part.
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path'; import os from 'os';
const HERE=path.dirname(new URL(import.meta.url).pathname);
const ROOT=path.resolve(HERE,'..','..'), CAP=path.resolve(HERE,'..','capture');
const TAKES=+(process.env.TAKES||3);
const IDS=(process.argv[2]||'19,21,22,03').split(',').filter(Boolean);
const THRESH=+(process.env.STABLE||0.995);
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'kea-stab-'));
const ssim=(a,b)=>{ let out='';
  try{ out=execSync(`ffmpeg -i "${a}" -i "${b}" -lavfi ssim -f null - 2>&1`).toString(); }catch(e){ out=String(e.output||e); }
  const m=out.match(/All:([\d.]+)/); return m?parseFloat(m[1]):0; };
let worstAll=1, flags=0;
for(const id of IDS){
  const takes=[];
  for(let t=1;t<=TAKES;t++){
    execSync(`SHOTS=${id} node gauntlet/verify/capture.mjs`,{cwd:ROOT,stdio:'ignore'});
    const f=fs.readdirSync(CAP).find(f2=>f2.startsWith(id)&&f2.endsWith('.png'));
    if(!f){ console.log(`? ${id} produced no frame`); break; }
    const dst=path.join(TMP,`${f}.take${t}.png`); fs.copyFileSync(path.join(CAP,f),dst); takes.push({f,dst});
  }
  if(takes.length<2)continue;
  let worst=1; for(let t=1;t<takes.length;t++){ const s=ssim(takes[0].dst,takes[t].dst); if(s<worst)worst=s; }
  const flag=worst<THRESH; if(flag)flags++; if(worst<worstAll)worstAll=worst;
  console.log(`${flag?'✗':'✓'} ${takes[0].f.padEnd(26)} take-to-take worst ssim ${worst.toFixed(4)}`+
    (flag?'  <-- this vantage does not reshoot the same twice':''));
}
console.log(`STABILITY: ${IDS.length} vantages, ${TAKES} takes each, ${flags} unstable `+
  `(worst ${worstAll.toFixed(4)}, threshold ${THRESH})`);
process.exitCode=flags?1:0;
