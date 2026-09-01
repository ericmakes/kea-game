// SUBJECT TRIPWIRE — the showcase vantages must actually CONTAIN their subject.
// Usage: node gauntlet/verify/subjects.mjs   (run after a capture pass, beside diff.mjs)
//
// WHY THIS EXISTS (2026-08-31): diff.mjs only asks whether a frame changed. It cannot tell you
// that 04_flight_underwing had no bird in it for weeks, because a birdless frame is perfectly
// stable. Four vantages were shipping their world with the subject flown out of frame. SSIM is a
// drift detector; this is a presence detector, and the two are not the same tool.
//
// HOW THE CLASSIFIERS WERE BUILT, and the trap that made a first attempt worthless: a plain
// hue-band "olive" counter measures the LANDSCAPE, not the bird. Measured on the birdless
// baselines, a loose h45-95 window scored 3939 olive pixels in the 07 box and only 1529 in the
// correctly staged frame - the tussock is gold and the grass is green, and both landed inside the
// window, so the test read GREEN for the empty road and RED for the jam. The window below is
// derived from the palette instead:
//   kea      keaBody h59 s0.53 v0.42 | keaWing h68 s0.55 v0.33 | keaBelly h57 s0.48 v0.54
//   NOT kea  tussock h41 s0.77 v0.79 | ground h41 s0.69 v0.59 | grass h89 s0.61 v0.47
//            tree    h105 s0.51 v0.50
// The bird is separated by hue (52-80 excludes gold at 41 and green at 89) AND by saturation
// (its olive is muted, under 0.62; tussock and ground sit above 0.65).
//
// Every threshold below is a MEASURED number, not a guess. `absent` records what the same box
// scored on the birdless frame this piece replaced, so the margin is auditable in both
// directions: min sits above absent and below the staged count.
import {execSync} from 'child_process';
import fs from 'fs'; import path from 'path';

const HERE=path.dirname(new URL(import.meta.url).pathname);
const CAP=path.resolve(HERE,'..','capture');
const W=960, H=540;

const hsv=(r,g,b)=>{ r/=255;g/=255;b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  let h=0; if(d){ if(mx===r)h=((g-b)/d+6)%6; else if(mx===g)h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; }
  return [h, mx?d/mx:0, mx]; };

const CLS={
  kea:     (h,s,v)=>h>=52&&h<=80&&s>=0.30&&s<=0.62&&v>=0.15&&v<=0.58,
  scarlet: (h,s,v)=>(h<=25||h>=352)&&s>=0.60&&v>=0.35,
  carblue: (h,s,v)=>h>=195&&h<=225&&s>=0.35&&s<=0.75&&v>=0.30&&v<=0.70,
  // keaBeak 0x413C35 is dark and almost colourless - v 0.25, s 0.19. Inside the tight head box of
  // vantage 25 it is the ONLY dark thing, which is what makes a crude "dark and grey" window work
  // there and nowhere else. The cere was tried first and is useless (x1.2): a sliver of it shows
  // even when the head is fully buried. The beak is the signal, because a buried head has none.
  beak:    (h,s,v)=>v<=0.34&&s<=0.35,
};

// region is [x,y,w,h] as fractions of the frame, so a viewport change does not silently move it
const SPEC=[
  { file:'04_flight_underwing', tests:[
    { what:'the bird is in frame, below the HUD band', cls:'kea',     box:[0.38,0.20,0.24,0.35], min:240, absent:0 },
    { what:'and its scarlet underwing is showing',     cls:'scarlet', box:[0.38,0.20,0.24,0.35], min:400, absent:0 } ]},
  { file:'07_jam', tests:[
    { what:'the road carries a queue of cars',         cls:'carblue', box:[0.20,0.45,0.60,0.35], min:3000, absent:14 },
    { what:'and the bird is standing its ground in it',cls:'kea',     box:[0.40,0.58,0.20,0.24], min:170,  absent:43 } ]},
  { file:'09_colossal', tests:[
    { what:'the colossal bird is in frame',            cls:'kea',     box:[0.38,0.42,0.24,0.28], min:560,  absent:109 } ]},
  { file:'17_flight', tests:[
    { what:'the bird is airborne mid-frame',           cls:'kea',     box:[0.42,0.26,0.20,0.24], min:190,  absent:60 } ]},
  // 25_preen_follow judges the ORIGINAL complaint - that the preening bird reads headless from the
  // FOLLOW camera - which no vantage could see before. It stages the worst frame of the cycle
  // (t=1.60, side -1). `absent` here is not a guess and not an old frame: it is this same vantage
  // reshot with the PRE-piece-6 preen constants, where the head is buried under the wing and the
  // beak does not show at all. Measured 33 with the fix, 0 without it.
  { file:'25_preen_follow', tests:[
    { what:'the preening head and beak clear the body from the follow cam',
      cls:'beak', box:[0.500,0.518,0.057,0.074], min:12, absent:0 } ]},
];

function count(file,box,cls){
  const x=Math.round(box[0]*W), y=Math.round(box[1]*H);
  const w=Math.round(box[2]*W), h=Math.round(box[3]*H);
  const buf=execSync(`ffmpeg -v error -i "${file}" -vf "crop=${w}:${h}:${x}:${y}" -f rawvideo -pix_fmt rgb24 -`,
    {maxBuffer:1<<28});
  const f=CLS[cls]; let n=0;
  for(let i=0;i<buf.length;i+=3){ const [hh,ss,vv]=hsv(buf[i],buf[i+1],buf[i+2]); if(f(hh,ss,vv))n++; }
  return n;
}

let fails=0, ran=0;
for(const s of SPEC){
  const file=path.join(CAP,s.file+'.png');
  if(!fs.existsSync(file)){ console.log(`- ${s.file.padEnd(22)} not captured, skipped`); continue; }
  for(const t of s.tests){
    const n=count(file,t.box,t.cls); ran++;
    const ok=n>=t.min; if(!ok)fails++;
    console.log(`${ok?'✓':'✗'} ${s.file.padEnd(22)} ${t.cls.padEnd(8)} ${String(n).padStart(6)} `+
      `(floor ${t.min}, birdless frame scored ${t.absent})  ${t.what}`+
      (ok?'':'  <-- SUBJECT MISSING'));
  }
}
console.log(`SUBJECTS: ${ran} checked, ${fails} missing`);
process.exitCode=fails?1:0;
