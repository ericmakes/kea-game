// CONTRACT TEST for lum.mjs. Usage: node gauntlet/verify/lum-selftest.mjs
// Every fixture is GENERATED from arithmetic, so the expected numbers are known exactly rather
// than read off a photograph — the mistake mkplaceholder.mjs was written to avoid.
import {lumStats} from './lum.mjs';
import {execSync} from 'child_process'; import fs from 'fs'; import os from 'os'; import path from 'path';

const T=fs.mkdtempSync(path.join(os.tmpdir(),'kea-lum-'));
const F=[]; let bad=0;
const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); if(!c){F.push(m);bad++;} };
const near=(a,b,e)=>Math.abs(a-b)<=e;

/* a solid RGB rectangle. `format=rgb24` INSIDE THE FILTERGRAPH is not decoration: the colour source
   defaults to a YUV format, and a YUV round trip is LOSSY at the ends — the first cut of this file
   asked for white and got 253, and asked for 0x808080 and got 126. Four assertions went red on a
   1-2 level error in the FIXTURE, while the instrument was exact. A contract test whose fixtures
   are not what they claim tests nothing, so the pixels are asked for in the space they are checked
   in. `-pix_fmt rgb24` on the OUTPUT does not fix it — that converts FROM yuv, keeping the error;
   the format has to be forced in the graph so the source generates RGB natively. Verified: white
   then lands as exactly 255 and 0x808080 as exactly 128.
   (Same lesson mkplaceholder.mjs records: generate from arithmetic, and check that the arithmetic
   is what actually reached the file.) */
function solid(name,w,h,hex){ const p=path.join(T,name);
  execSync(`ffmpeg -v error -y -f lavfi -i "color=c=${hex}:s=${w}x${h},format=rgb24" `+
    `-frames:v 1 "${p}"`);
  return p; }
/* two stacked bands, for the fraction arithmetic */
function bands(name,w,h,top,bot){ const p=path.join(T,name);
  /* format ON EACH SOURCE, not after the stack: stacking two YUV inputs and converting the
     RESULT keeps the round-trip error, which is how this fixture still delivered 253 for white
     after the solid() one was fixed. */
  execSync(`ffmpeg -v error -y -f lavfi -i "color=c=${top}:s=${w}x${h/2},format=rgb24" `+
    `-f lavfi -i "color=c=${bot}:s=${w}x${h/2},format=rgb24" `+
    `-filter_complex vstack -frames:v 1 "${p}"`);
  return p; }

console.log('LUM SELFTEST');

/* 1. MID GREY. 0x808080 is 128/255 = 0.502 on every channel, so luma is 0.502 whatever the
      coefficients are — which is the point of testing with grey first: it isolates the plumbing
      from the Rec.709 weights. */
{ const p=solid('grey.png',200,200,'0x808080');
  const s=lumStats(p,{x0:0,y0:0,x1:200,y1:200});
  ok(near(s.mean,128/255,0.004),'mid grey reads mean '+s.mean.toFixed(4)+' (want 0.5020)');
  ok(s.clip===0,'and nothing clipped ('+s.clip+')');
  ok(near(s.sat,0,1e-6),'and zero saturation ('+s.sat.toFixed(4)+')');
  ok(s.n===200*200,'and it measured every pixel in the box ('+s.n+')'); }

/* 2. WHITE CLIPS COMPLETELY, black not at all. The clip test is all-three-channels, so pure white
      is 100% and pure red — one channel at 255 — must be 0%. That distinction is the whole reason
      the test is written as an AND: a saturated red sky is not blown highlights. */
{ const w=lumStats(solid('white.png',100,100,'white'),{x0:0,y0:0,x1:100,y1:100});
  ok(near(w.clipPct,100,1e-6),'white is 100% clipped ('+w.clipPct.toFixed(2)+'%)');
  ok(near(w.mean,1,0.005),'and mean luma 1 ('+w.mean.toFixed(4)+')');
  const k=lumStats(solid('black.png',100,100,'black'),{x0:0,y0:0,x1:100,y1:100});
  ok(k.clipPct===0&&near(k.mean,0,0.005),'black is 0% clipped, mean 0 ('+k.mean.toFixed(4)+')');
  const r=lumStats(solid('red.png',100,100,'red'),{x0:0,y0:0,x1:100,y1:100});
  ok(r.clipPct===0,'PURE RED is 0% clipped — one channel out of headroom is not blown white ('+
    r.clipPct.toFixed(2)+'%)');
  ok(near(r.mean,0.2126,0.01),'and its luma is the Rec.709 red weight ('+r.mean.toFixed(4)+
    ', want 0.2126)'); }

/* 3. GREEN AND BLUE CARRY THEIR OWN WEIGHTS, which is what proves the coefficients are not
      accidentally equal — a mean of (r+g+b)/3 would give 0.333 for all three. */
{ const g=lumStats(solid('green.png',80,80,'lime'),{x0:0,y0:0,x1:80,y1:80});
  const b=lumStats(solid('blue.png',80,80,'blue'),{x0:0,y0:0,x1:80,y1:80});
  ok(near(g.mean,0.7152,0.01),'pure green luma '+g.mean.toFixed(4)+' (want 0.7152)');
  ok(near(b.mean,0.0722,0.01),'pure blue luma '+b.mean.toFixed(4)+' (want 0.0722)'); }

/* 4. THE CLIPPED FRACTION IS A FRACTION. Half white over half black must be 50%, and the mean must
      be 0.5 — this is the assertion that would catch a count divided by the wrong denominator,
      which is exactly how a "3% of the frame" number gets reported wrong by a factor of the crop. */
{ const p=bands('half.png',100,100,'white','black');
  const s=lumStats(p,{x0:0,y0:0,x1:100,y1:100});
  ok(near(s.clipPct,50,0.5),'half white over half black is 50% clipped ('+s.clipPct.toFixed(2)+'%)');
  ok(near(s.mean,0.5,0.01),'and mean luma 0.5 ('+s.mean.toFixed(4)+')');
  ok(s.max>=254&&s.min<=1,'with max at the top and min at the bottom ('+Math.round(s.max)+
    ' / '+Math.round(s.min)+')');
  /* AND THE BOX ACTUALLY RESTRICTS. Measuring only the top half must read 100%. If the crop were
     ignored, every number above would still pass and every number would be wrong. */
  const top=lumStats(p,{x0:0,y0:0,x1:100,y1:50});
  ok(near(top.clipPct,100,0.5),'and the top half alone is 100% clipped, so the box is honoured ('+
    top.clipPct.toFixed(2)+'%)');
  const bot=lumStats(p,{x0:0,y0:50,x1:100,y1:100});
  ok(bot.clipPct===0,'and the bottom half alone is 0% ('+bot.clipPct.toFixed(2)+'%)'); }

/* 5. HUE. A known turquoise must come back at its known hue, because judging water against a
      plate is a hue-and-saturation claim and a hue that is 60 degrees out would pass any
      brightness test in this file. 0x6FA8B8 is the game's own milky pale. */
{ const s=lumStats(solid('teal.png',60,60,'0x6FA8B8'),{x0:0,y0:0,x1:60,y1:60});
  ok(near(s.hue,193,3),'0x6FA8B8 reads hue '+Math.round(s.hue)+' (want ~193, cyan-blue)');
  ok(near(s.sat,0.397,0.02),'and saturation '+s.sat.toFixed(3)+' (want 0.397)'); }

/* 6. THE HUD STRIPS ARE SKIPPED BY DEFAULT, and that default is load-bearing: the capture's own
      near-white HUD text would otherwise land in every clip count. A frame that is white ONLY in
      the top 44 rows must read as zero clipped when no box is given. */
{ const p=path.join(T,'hud.png');
  execSync(`ffmpeg -v error -y -f lavfi -i "color=c=white:s=200x44,format=rgb24" `+
    `-f lavfi -i "color=c=0x404040:s=200x112,format=rgb24" `+
    `-f lavfi -i "color=c=white:s=200x44,format=rgb24" `+
    `-filter_complex vstack=inputs=3 -frames:v 1 "${p}"`);
  const dflt=lumStats(p);
  ok(dflt.clipPct===0,'white HUD strips top and bottom are excluded by default ('+
    dflt.clipPct.toFixed(2)+'% clipped over '+dflt.h+' rows of 200)');
  const all=lumStats(p,{x0:0,y0:0,x1:200,y1:200});
  ok(near(all.clipPct,44,1),'and including them reads 44% — so the exclusion is the default, not '+
    'a hardcoded blindness ('+all.clipPct.toFixed(2)+'%)'); }

/* 7. IT REFUSES AN EMPTY BOX rather than dividing by zero and reporting NaN as a pass. */
{ let threw=null;
  try{ lumStats(solid('tiny.png',10,10,'gray'),{x0:5,y0:5,x1:5,y1:9}); }catch(e){ threw=e.message; }
  ok(threw&&/empty box/.test(threw),'an empty box throws rather than returning NaN ('+threw+')'); }

fs.rmSync(T,{recursive:true,force:true});
console.log(bad?('LUM SELFTEST: '+bad+' FINDINGS'):'LUM SELFTEST: ALL PASS');
process.exit(bad?1:0);
