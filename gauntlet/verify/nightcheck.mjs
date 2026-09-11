/* NIGHTCHECK — is the night frame actually lit by moonlight?
   Usage: node gauntlet/verify/nightcheck.mjs          shoot both night frames and assert
          KEEP=1 ...                                   leave the frames in gauntlet/capture

   WHY THIS EXISTS. Eric's critic pass named two night faults as BUGS rather than taste: "a warm
   tan/orange patch glows in the night sky ... day-sun or day environment lighting leaking onto
   geometry that should be moonlit", and "clouds are still fully-lit day cumulus at night". Both
   turned out to be one seam — scene.environment is a DAYTIME alpine HDRI and its night intensity
   was 0.80 against the day's 0.55, HIGHER after dark, while the comment on the knob that scales it
   says it exists to DIM. The headless batteries cannot see any of that: it is a statement about
   pixels under a particular light, so it needs a frame.
   THE THRESHOLD IS ON HUE, NOT BRIGHTNESS. Moonlight is blue-white and the game's night
   directional is 0xB9CCEE, so nothing lit by it can have r above b. A warm pixel at night is
   therefore day light arriving through some seam, whatever its brightness.
   AND THE CAMPFIRE IS EXEMPT, BY POSITION AND ON PURPOSE. The carpark has a fire and warm van
   lights, and they are correct: they are warm light sources IN the scene rather than daylight
   leaking onto it. They sit in the bottom third of the strip frame, so the assertion is made above
   that line — which is also the only part of the frame that is "night SKY" in Eric's sense.
   Three separate measurements in this session were quietly about that campfire before the limit
   went in: it is the brightest thing in both night frames and it clips. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { W as SW, H as SH, CAM, QUIET, SKYQUIET } from './stripcam.mjs';
import { loadRGB } from './platescore.mjs';

const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'../..');
const OUT=path.join(ROOT,'gauntlet/capture');

/* THE SKY FRACTION. Above this line the frame is sky, ridge and cloud; below it is the carpark. */
export const SKYFRAC=0.62;
/* A pixel is WARM when red leads blue by this much. 12 of 255 is about the smallest difference
   that reads as a tint rather than as dither. */
export const WARMTH=12;
/* How much warmth is tolerated in the sky. Not zero: the ridge catches a little spill from the
   fire at the frame's edge, and JPEG-free PNGs still carry renderer dither. 0.05% of the sky is
   four hundred pixels of a 1920x384 region — visible as a patch would not be. */
export const WARMMAX=0.0005;

export function measure(file){
  const im=loadRGB(file);
  const {w,h}=im;
  const at=(x,y)=>{const i=(y*w+x)*3;return [im.buf[i],im.buf[i+1],im.buf[i+2]];};
  const lum=p=>(0.2126*p[0]+0.7152*p[1]+0.0722*p[2])/255;
  const ymax=Math.round(h*SKYFRAC);
  let warm=0, n=0, peak=0, clip=0, worst=null;
  for(let y=0;y<ymax;y++)for(let x=0;x<w;x++){
    const p=at(x,y); n++;
    const d=p[0]-p[2];
    if(d>WARMTH){ warm++; if(!worst||d>worst.d)worst={x,y,d,p}; }
    const L=lum(p); if(L>peak)peak=L; if(L>0.995)clip++;
  }
  return {file:path.basename(file), sky:n, warm, frac:warm/n, peak, clip, worst, w, h, ymax};
}

if((process.argv[1]||'').endsWith('nightcheck.mjs')){
  const {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED}=await import('./webrig.mjs');
  ensureBuild(); const srv=await serve();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  /* nightApply IS RE-ASSERTED EVERY FRAME, not once. The game's own driver eases nightT toward its
     target whenever nightManual is not held, so a single call would be undone during the settle —
     the same law every other live vantage in capture.mjs obeys. */
  const NIGHT=`(()=>{ const G=KEAGAME.G;
    G.night=true; G.nightManual=true; G.nightT=1; KEAGAME.nightApply(1);
    const _n=()=>{ try{ G.nightManual=true; G.nightT=1; KEAGAME.nightApply(1); }catch(e){}
      requestAnimationFrame(_n); }; requestAnimationFrame(_n); })();`;
  const frames=[];
  for(const [name,aim] of [
    ['NIGHT_range',null],
    ['NIGHT_moon',`(()=>{ const G=KEAGAME.G, P=G.moonPos;
       G.camLock={x:0,y:9,z:-46,lx:P[0],ly:P[1],lz:P[2]}; })();`]]){
    const b=await launch(); const p=await b.newPage();
    await p.setViewport({width:SW,height:SH});
    await preparePage(p,{seed:GAUNTLETSEED,biome:'carpark'});
    await p.goto(srv.origin+'/',{waitUntil:'load'});
    await assertBooted(p);
    await p.evaluate('window.AudioContext=undefined;KEAGAME.startGame(1);');
    await sleep(900);
    await p.evaluate(QUIET); await p.evaluate(CAM); await p.evaluate(SKYQUIET);
    await p.evaluate(NIGHT);
    if(aim)await p.evaluate(aim);
    await sleep(1400);
    const st=await p.evaluate(`(()=>({t:KEAGAME.G.nightT,
      stars:!!KEAGAME.G.starfield.visible, moon:!!KEAGAME.G.moon.visible,
      env:KEAGAME.G.scene.environmentIntensity}))()`);
    if(st.t!==1)throw new Error('nightcheck: the page is at nightT '+st.t+', not 1');
    const f=path.join(OUT,name+'.png');
    await p.screenshot({path:f}); await b.close();
    frames.push({...measure(f),st});
  }
  await srv.close();
  let bad=0;
  const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)bad++; };
  console.log('NIGHTCHECK   sky is the top '+(SKYFRAC*100).toFixed(0)+'% of the frame; '+
    'warm means r-b > '+WARMTH);
  for(const f of frames){
    console.log('  '+f.file+'   nightT '+f.st.t+'   environmentIntensity '+f.st.env.toFixed(3)+
      '   stars '+f.st.stars+'   moon '+f.st.moon);
    ok(f.frac<=WARMMAX,'    no warm daylight in the night sky: '+(f.frac*100).toFixed(4)+
       '% of it is warm, against a ceiling of '+(WARMMAX*100).toFixed(2)+'%'+
       (f.worst?('   worst ('+f.worst.x+','+f.worst.y+') rgb '+f.worst.p.join(',')+' r-b '+f.worst.d):''));
    /* A GENERAL GUARD, NOT A REGRESSION TEST, and the difference is worth being honest about. A
       clipped night sky means something is being lit as though it were day, so the row is worth
       having — but nothing in this pass was ever clipping. The "peak 1.000 with a 156-pixel
       plateau" that sent me hunting the moon was the CAMPFIRE, which this measurement excludes by
       position; the moon's own peak is 0.910. The row has no known way to fire, which is stated
       here rather than dressed up as coverage. */
    ok(f.clip===0,'    and nothing in the night sky is clipped to white ('+f.clip+
       ' px, peak luma '+f.peak.toFixed(3)+')');
  }
  console.log(bad?('NIGHTCHECK: '+bad+' FINDINGS'):'NIGHTCHECK: ALL PASS');
  if(!process.env.KEEP)for(const f of frames)
    try{ fs.unlinkSync(path.join(OUT,f.file)); }catch(e){}
  process.exit(bad?1:0);
}
