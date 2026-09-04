// CONTRACT TEST FOR edgefind.mjs. Run it whenever that file changes.
// Usage: node gauntlet/verify/edgefind-selftest.mjs
//
// An instrument that reports a number nobody has calibrated is worse than no instrument: the
// number gets written into a recipe and quoted back for months. This builds synthetic frames whose
// answer is known by construction and checks edgefind gives it.
//
// TWO OF THESE CASES ARE THE ONES THAT MATTER, AND THEY ARE WHY THERE ARE THREE CHANNELS.
//   Case 3, the G channel: noise on top, flat below, IDENTICAL MEAN LUMINANCE. Half of what a
//     grass field's edge is, and a luminance-only detector calls it clean.
//   Case 7, the C channel: the SAME luminance and the SAME texture, different SATURATION. That is
//     the OTHER half, and P4e measured it as the louder half - the field's real edge moves chroma
//     by two thirds and luminance by four percent.
// If either channel goes blind the instrument is blind to the exact artefact REPLAT P4e was
// written to remove, and this file is where that shows up rather than in a recipe six months
// later.
import {execSync} from 'child_process'; import fs from 'fs'; import os from 'os';
import path from 'path'; import zlib from 'zlib';

const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'kea-edge-'));
const CRCT=(()=>{const T=[];for(let n=0;n<256;n++){let k=n;for(let m=0;m<8;m++)k=k&1?0xEDB88320^(k>>>1):k>>>1;T[n]=k>>>0;}return T;})();
const crc32=b=>{let c=~0;for(const x of b)c=CRCT[(c^x)&255]^(c>>>8);return (~c)>>>0;};
/* A GREY PNG WRITTEN BY HAND. No image dependency for a test whose whole job is to be trustworthy
   when the toolchain is not. */
function writeGray(file,w,h,fn){ return writePx(file,w,h,(x,y)=>{ const v=fn(x,y); return [v,v,v]; }); }
function writePx(file,w,h,fn){
  const stride=w*3+1, raw=Buffer.alloc(h*stride);
  for(let y=0;y<h;y++){ raw[y*stride]=0;
    for(let x=0;x<w;x++){ const c=fn(x,y);
      for(let k=0;k<3;k++) raw[y*stride+1+x*3+k]=Math.max(0,Math.min(255,Math.round(c[k]))); } }
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4); ihdr[8]=8; ihdr[9]=2;
  const chunk=(t,d)=>{ const b=Buffer.alloc(12+d.length); b.writeUInt32BE(d.length,0);
    b.write(t,4,'ascii'); d.copy(b,8);
    b.writeUInt32BE(crc32(Buffer.concat([Buffer.from(t,'ascii'),d])),8+d.length); return b; };
  fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
  return file;
}
/* A FIXED-SEED HASH, so a selftest cannot pass on Tuesday and fail on Wednesday. */
const rnd=(x,y)=>{ const v=Math.sin(x*12.9898+y*78.233)*43758.5453; return v-Math.floor(v); };

let fails=0;
const ok=(cond,msg)=>{ console.log((cond?'  ✓ ':'  ✗ ')+msg); if(!cond)fails++; };
const run=(f,env)=>{
  const out=execSync(`node ${path.join(import.meta.dirname,'edgefind.mjs')} "${f}"`,
    {env:Object.assign({},process.env,{Y0:'0',Y1:'256',X0:'0',X1:'256',TOPN:'6'},env||{})}).toString();
  const rows=out.split('\n').filter(l=>/FINDABILITY/.test(l)).map(l=>{
    /* THE CHANNEL SET IS READ FROM THE OUTPUT, NOT LISTED HERE. This regex said [LG] and the C
       channel had just been added, so every C line parsed as null and three assertions reported
       "not found" for a channel that was working perfectly. A test that hardcodes the thing under
       test is a test that goes green when the feature is deleted. */
    const m=l.match(/(row|col)\s+([A-Z])\s+at\s+(-?\d+)\s+step\s+([\d.]+)\s+FINDABILITY\s+([\d.]+)/);
    return m?{axis:m[1],ch:m[2],at:+m[3],step:+m[4],find:+m[5]}:null; }).filter(Boolean);
  return {rows,top:rows[0],out};
};

const W=256,H=256;
console.log('edgefind-selftest');

// 1. A SMOOTH GRADIENT IS NOT A LINE, however big its total range.
{ const f=writeGray(path.join(TMP,'gradient.png'),W,H,(x,y)=>40+y*0.7);
  const r=run(f);
  ok(r.top.find<3.5,'a smooth 180-level gradient scores LOW — a big range is not a line ('+
     r.top.find.toFixed(2)+')'); }

// 2. A HARD LUMINANCE STEP IS A LINE, and it is found at the row it was drawn on.
{ const f=writeGray(path.join(TMP,'lstep.png'),W,H,(x,y)=>y<128?90:150);
  const r=run(f);
  const L=r.rows.find(q=>q.ch==='L'&&q.axis==='row');
  ok(!!L&&L.find>20,'a 60-level hard step scores HIGH ('+(L?L.find.toFixed(2):'not found')+')');
  ok(!!L&&Math.abs(L.at-128)<=2,'and is located at the row it was drawn on ('+(L?L.at:'-')+' vs 128)'); }

// 3. A TEXTURE STEP AT IDENTICAL MEAN LUMINANCE — the case the G channel exists for.
{ const f=writeGray(path.join(TMP,'gstep.png'),W,H,(x,y)=>y<128?(120+(rnd(x,y)-0.5)*120):120);
  const r=run(f);
  const G=r.rows.find(q=>q.ch==='G'&&q.axis==='row');
  const L=r.rows.find(q=>q.ch==='L'&&q.axis==='row');
  ok(!!G&&G.find>20,'the G channel finds a pure TEXTURE step ('+(G?G.find.toFixed(2):'not found')+')');
  ok(!!G&&Math.abs(G.at-128)<=2,'at the right row ('+(G?G.at:'-')+' vs 128)');
  /* AND THE L CHANNEL MUST BE NEARLY BLIND TO IT, which is the whole point: if L caught this the
     two channels would be measuring one thing and the G channel would be decoration. */
  ok(!!G&&(!L||G.find>L.find*3),'while the L channel is nearly blind to it — the means match '+
     '(G '+(G?G.find.toFixed(2):'-')+' vs L '+(L?L.find.toFixed(2):'-')+')'); }

// 4. A VERTICAL STEP IS FOUND BY THE COLUMN PASS. Rows alone would half-blind the instrument on a
//    ring, whose sides are vertical.
{ const f=writeGray(path.join(TMP,'vstep.png'),W,H,(x,y)=>x<128?90:150);
  const r=run(f);
  const C=r.rows.find(q=>q.axis==='col');
  ok(!!C&&C.find>20,'a vertical step is found by the COLUMN pass ('+(C?C.find.toFixed(2):'not found')+')');
  ok(!!C&&Math.abs(C.at-128)<=2,'at the right column ('+(C?C.at:'-')+' vs 128)'); }

// 5. FLAT IS FLAT. No division blow-up, no phantom line on a frame with nothing in it.
{ const f=writeGray(path.join(TMP,'flat.png'),W,H,()=>128);
  const r=run(f);
  ok(r.rows.length===0||r.rows.every(q=>q.step<0.5),
     'a perfectly flat frame reports no step above half a level'); }

// 6. THE SOFTER THE TRANSITION THE LOWER THE SCORE — monotone, or the number cannot be compared
//    between two builds, which is the only thing this instrument is ever used for.
{ const mk=(w2)=>writeGray(path.join(TMP,`ramp${w2}.png`),W,H,
    (x,y)=>90+60*Math.max(0,Math.min(1,(y-128+w2/2)/w2)));
  const a=run(mk(4)).top.find, b=run(mk(40)).top.find, c=run(mk(120)).top.find;
  ok(a>b&&b>c,'a 4px, 40px and 120px ramp of the SAME amplitude score in that order ('+
     a.toFixed(2)+' > '+b.toFixed(2)+' > '+c.toFixed(2)+')'); }

// 7. A PURE SATURATION STEP — identical luminance, identical texture, different chroma.
//    THE CASE THE C CHANNEL EXISTS FOR, and the one P4e measured as the field's real edge.
{ /* Both halves are built to the SAME luminance by construction: a grey of L on top, and below it
     a colour whose 0.2126/0.7152/0.0722 weighted sum is the same L but which is strongly saturated.
     Solve for a colour of the form (L+2a, L+a*k, L-b): easier to just pick one and correct it. */
  const L0=150;
  const mk=(sat)=>{ /* r,g,b chosen so luma == L0 exactly, chroma == sat */
    const r=L0+sat*0.55, b=L0-sat*0.45;
    const g=(L0-0.2126*r-0.0722*b)/0.7152;
    return [r,g,b]; };
  const flat=mk(0), col=mk(90);
  const f=writePx(path.join(TMP,'cstep.png'),W,H,(x,y)=>y<128?col:flat);
  const r=run(f);
  const C=r.rows.find(q=>q.ch==='C'&&q.axis==='row');
  const L=r.rows.find(q=>q.ch==='L'&&q.axis==='row');
  const G=r.rows.find(q=>q.ch==='G'&&q.axis==='row');
  ok(!!C&&C.find>20,'the C channel finds a pure SATURATION step ('+(C?C.find.toFixed(2):'not found')+')');
  ok(!!C&&Math.abs(C.at-128)<=2,'at the right row ('+(C?C.at:'-')+' vs 128)');
  /* AND THE OTHER TWO MUST BE NEARLY BLIND, or the three channels are measuring one thing. The
     halves are equal in luminance BY CONSTRUCTION and equal in texture (both are flat). */
  ok(!!C&&(!L||C.find>L.find*3),'while the L channel is nearly blind — the luminances are equal by '+
     'construction (C '+(C?C.find.toFixed(2):'-')+' vs L '+(L?L.find.toFixed(2):'-')+')');
  ok(!G||G.step<0.5,'and the G channel sees nothing — both halves are flat ('+
     (G?G.step.toFixed(3):'not found')+')'); }

console.log(fails?`EDGEFIND-SELFTEST: ${fails} FINDINGS`:'EDGEFIND-SELFTEST: ALL PASS');
process.exitCode=fails?1:0;
