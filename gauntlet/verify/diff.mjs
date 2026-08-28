// BASELINE AUTO-DIFF — SSIM every pinned vantage against its fresh capture.
// Usage: node gauntlet/verify/diff.mjs   (run after a capture pass)
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path';
const HERE=path.dirname(new URL(import.meta.url).pathname);
const CAP=path.resolve(HERE,'..','capture'), BASE=path.join(CAP,'baseline');
const THRESH=0.965; let worst=1, flags=0, n=0;
for(const f of fs.readdirSync(BASE).filter(f=>f.endsWith('.png'))){
  const fresh=path.join(CAP,f); if(!fs.existsSync(fresh))continue;
  let out=''; try{ out=execSync(`ffmpeg -i "${fresh}" -i "${path.join(BASE,f)}" -lavfi ssim -f null - 2>&1`).toString(); }catch(e){ out=String(e.output||e); }
  const m=out.match(/All:([\d.]+)/); const ssim=m?parseFloat(m[1]):0;
  n++; if(ssim<worst)worst=ssim;
  const flag=ssim<THRESH; if(flag)flags++;
  console.log(`${flag?'✗':'✓'} ${f.padEnd(26)} ssim ${ssim.toFixed(4)}${flag?'  <-- drifted from baseline':''}`);
}
console.log(`DIFF: ${n} compared, ${flags} flagged (worst ${worst.toFixed(4)}, threshold ${THRESH})`);
process.exitCode=flags?1:0;
