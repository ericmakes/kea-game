// BASELINE AUTO-DIFF — SSIM every pinned vantage against its fresh capture.
// Usage: node gauntlet/verify/diff.mjs [ids]   (run after a capture pass)
//        STALE=ok node gauntlet/verify/diff.mjs   compare stale frames anyway
//
// A FRAME OLDER THAN THE BUNDLE IS NOT EVIDENCE, AND IT USED TO BE REPORTED AS IF IT WERE.
// gauntlet/capture holds whatever the last pass left there, and a pass that was interrupted, or a
// targeted sweep that shot two vantages, leaves the other forty frames behind from an older build.
// Diffing those against a freshly re-pinned baseline flags them as DRIFTED, which is the worst
// possible false alarm: it looks exactly like the thing this tool exists to catch.
// Measured the day this landed: a targeted two-vantage sweep after a re-pin flagged
// 25_preen_follow at 0.9605, and its frame was thirty minutes older than dist/kea.js. TODO 115
// named this fix ("a frame's mtime against the bundle's is enough to catch that") after a killed
// pass poisoned a sweep; it took one more false alarm to write it.
// STALE FRAMES ARE REPORTED AND NOT COUNTED, rather than silently skipped — a vantage that was
// never reshot is something the caller needs to know about, it is just not a regression.
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path';
const HERE=path.dirname(new URL(import.meta.url).pathname);
const CAP=path.resolve(HERE,'..','capture'), BASE=path.join(CAP,'baseline');
const ROOT=path.resolve(HERE,'..','..');
const IDS=(process.argv[2]||'').split(',').filter(Boolean);
const THRESH=0.965; let worst=1, flags=0, n=0;
/* THE BUNDLE IS THE REFERENCE CLOCK, not the specimen source: a capture photographs dist/, so an
   edit to src/game.mjs that has not been built yet must NOT invalidate frames. If there is no
   bundle at all there is nothing to be stale against, and every frame is compared. */
const bundle=path.join(ROOT,'dist','kea.js');
const built=fs.existsSync(bundle)?fs.statSync(bundle).mtimeMs:0;
const allowStale=process.env.STALE==='ok';
const stale=[];
for(const f of fs.readdirSync(BASE).filter(f=>f.endsWith('.png'))){
  if(IDS.length&&!IDS.some(o=>f.startsWith(o)))continue;
  const fresh=path.join(CAP,f); if(!fs.existsSync(fresh))continue;
  if(built&&!allowStale&&fs.statSync(fresh).mtimeMs<built){ stale.push(f); continue; }
  let out=''; try{ out=execSync(`ffmpeg -i "${fresh}" -i "${path.join(BASE,f)}" -lavfi ssim -f null - 2>&1`).toString(); }catch(e){ out=String(e.output||e); }
  const m=out.match(/All:([\d.]+)/); const ssim=m?parseFloat(m[1]):0;
  n++; if(ssim<worst)worst=ssim;
  const flag=ssim<THRESH; if(flag)flags++;
  console.log(`${flag?'✗':'✓'} ${f.padEnd(26)} ssim ${ssim.toFixed(4)}${flag?'  <-- drifted from baseline':''}`);
}
if(stale.length)console.log('\n· '+stale.length+' frame(s) older than dist/kea.js and NOT compared — '+
  'they were shot against an earlier build, so a difference would say nothing about this one:\n  '+
  stale.map(f=>f.replace(/\.png$/,'')).join(', ')+
  '\n  reshoot them, or pass STALE=ok to compare anyway.');
console.log(`DIFF: ${n} compared, ${flags} flagged (worst ${worst.toFixed(4)}, threshold ${THRESH})`+
  (stale.length?', '+stale.length+' stale':''));
process.exitCode=flags?1:0;
