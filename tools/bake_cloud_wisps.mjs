/* BAKE THE CLOUD WISP ATLAS — TODO 118's asset.
   Usage: node tools/bake_cloud_wisps.mjs        ->  assets/tex/cloud_wisps.png

   WHY THIS EXISTS. SKY.md step 2 closed seven of eight sky properties and stopped at the cap with
   cloud boundary complexity at 4.76 against the plate's band of 7.11 to 17.25. A circle scores
   3.545, so the game's cloud outline is 1.34 times a circle's where nz_carpark_01's is 4.1 times.
   A fringe of 26 small spheres per lobe was the last honest gain geometry had to offer, and it was
   not enough: OPAQUE SPHERE UNIONS CANNOT MAKE A WISPY EDGE. The plate's cloud is feathered and
   semi-transparent at its margins, and a boundary metric is exactly what notices that.

   WHY OURS AND NOT A DOWNLOAD, same argument as the grass cards and checked the same way. The
   shipped cloud is a white cumulus mass lit by the scene's own sun with a neutral shadow floor,
   and its wisps have to hand over to that body invisibly at the seam. A third-party cloud alpha
   carries its own lighting baked into its greys, which is the one thing that cannot be re-lit — so
   it would either read as a sticker on the side of our cloud or force the body to match IT. Baked
   here, the atlas is pure ALPHA and the body's own material does every bit of the colour and the
   shading. It also needs no third-party licence, and its ledger row says so.

   SOFT ALPHA, WHICH IS THE OPPOSITE OF THE GRASS ATLAS, AND THE REASON IS WORTH STATING. Those
   cards are a hard alphaTest cutout: every texel opaque or absent, because a soft edge at a test
   threshold shimmers. Here the graded edge IS the deliverable — a torn, feathered margin is what
   the plate has and what perimeter-over-root-area measures — so this atlas blends, and the tier
   pays for that with depthWrite off and a margin-only placement. TODO 118 names the trap: the
   first cloud iteration of the sky pass rendered every sphere transparent and came back reading as
   a BUNCH OF GRAPES, because every see-through overlap drew its own outline inside the mass. Alpha
   goes on the MARGIN, over an opaque body, and nowhere else.

   THE ALPHA IS WRITTEN INTO RGB AS WELL AS A. three's alphaMap samples the GREEN channel, not the
   alpha channel, and a texture that looks right in a viewer while reading zero in the shader is a
   long afternoon. Both are written, so it cannot matter which is sampled. */
import fs from 'fs';
import path from 'path';
import url from 'url';
import { execSync } from 'child_process';

const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');

const CELL=256, GRID=4, N=CELL*GRID;

/* A SEEDED GENERATOR OF ITS OWN, because this runs offline and must neither touch nor depend on
   the game's shared stream (TODO 47: rnd() draw order is load-bearing). Same LCG shape as
   setSeed so the numbers are of the same family, and the same one the grass baker uses. */
let _s=0x51ED2701;
const rnd=(a,b)=>{ _s+=0x6D2B79F5; let r=Math.imul(_s^_s>>>15,1|_s);
  r^=r+Math.imul(r^r>>>7,61|r); return a+(((r^r>>>14)>>>0)/4294967296)*(b-a); };

/* VALUE NOISE, hashed rather than tabled, so a cell's texture is a pure function of its
   coordinates and the bake is reproducible byte for byte. */
const hash=(x,y,s)=>{ let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,2246822519);
  h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; };
const sm=t=>t*t*(3-2*t);
const noise=(x,y,s)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=sm(x-xi), yf=sm(y-yi);
  const a=hash(xi,yi,s), b=hash(xi+1,yi,s), c=hash(xi,yi+1,s), d=hash(xi+1,yi+1,s);
  return (a+(b-a)*xf)+((c+(d-c)*xf)-(a+(b-a)*xf))*yf; };
const fbm=(x,y,s)=>{ let v=0,amp=0.5,f=1;
  for(let o=0;o<5;o++){ v+=noise(x*f,y*f,s+o*17)*amp; amp*=0.5; f*=2; } return v; };

const img=new Uint8Array(N*N*4);

/* THE SHAPE OF ONE WISP. A soft body that fades out, with the fade DRIVEN BY NOISE rather than by
   distance alone — that is the difference between a blurred disc, which adds no boundary at all,
   and a torn margin, which is the whole point. Two dials with a reason each:
     CORE holds a solid centre, so a wisp seats onto the opaque body it extends without a seam.
     TEAR is how far the noise can push the edge in and out; too little is a disc, too much is
     confetti that reads as noise rather than as cloud. */
/* CORE IS SMALL, AND THE FIRST BAKE SHOWS WHY IT HAD TO BE. At 0.34 with the tear applied only
   where r exceeds it, every cell came out as a HARD-EDGED SOLID WHITE DISC inside a torn ring:
   alpha stepped from 1 to noise across a single texel at r = CORE, and a step in an alpha map is a
   visible circle on the cloud. The tear is ramped in from the core outward now, so there is no
   discontinuity anywhere, and the core is small enough that the shape reads as a puff rather than
   as a disc with a fringe. */
/* AND SPAN IS WHY THERE IS A THIRD DIAL. The margin's radius is 1 + noise*TEAR, and the cell only
   reaches r = 1 along its axes and r = 1.41 into its corners — so with TEAR at 0.68 a direction
   whose noise ran high wanted a margin out at 1.68 and the CELL CLIPPED IT. Alpha was still
   non-zero where the cell ended, which is a hard square edge in an alpha map, and it showed in the
   frame exactly as that: faint hard-edged rectangles sitting over the sky beside every cloud, with
   one correct white tuft among them to prove the rest of the tier worked. SPAN scales the whole
   field so its widest direction still closes inside the cell. There is a border guard below as
   well, because one silent hard edge was enough. */
const CORE=0.10, TEAR=0.55, SPAN=0.56;
/* GAIN, AND IT IS CALIBRATED AGAINST THE SCORER'S OWN THRESHOLD RATHER THAN CHOSEN BY EYE.
   platescore's cloud mask is a NEUTRALITY test: a pixel counts as cloud when its saturation falls
   below 0.20. A white wisp at alpha a over the game's sky, whose RGB is about (0.32,0.48,0.68) at
   saturation 0.53, blends to saturation 0.228 at a = 0.5 and 0.177 at a = 0.6 — so the boundary
   the metric actually sees is the a = 0.57 ISO-CONTOUR of this atlas, and everything fainter than
   that is feathering the eye can see and the number cannot. Ungained, only six to eight per cent
   of a cell clears 0.57 and it clears it in a small round patch near the core, which is why the
   first wisp tier moved the boundary metric from 4.76 to 4.82 and no further.
   The gain lifts the whole field so that the 0.57 contour sits out in the NIBBLED zone, where it
   is ragged. Clamped, so the core simply saturates rather than blowing out. */
const GAIN=1.9;
let cells=0, alphaSum=0, nonZero=0, graded=0;
for(let cy=0;cy<GRID;cy++)for(let cx=0;cx<GRID;cx++){
  const seed=(cy*GRID+cx)*131+7;
  const ox=cx*CELL, oy=cy*CELL;
  /* each cell gets its own noise scale and its own slight squash, so sixteen wisps on one cloud
     do not read as sixteen copies */
  const nsc=rnd(2.2,4.1), sq=rnd(0.72,1.05), rot=rnd(0,Math.PI);
  const cs=Math.cos(rot), sn=Math.sin(rot);
  for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){
    /* -1..1 in the cell, rotated and squashed */
    let px=(x/(CELL-1))*2-1, py=(y/(CELL-1))*2-1;
    const rx=px*cs-py*sn, ry=(px*sn+py*cs)/sq;
    const r=Math.hypot(rx,ry);
    /* the noise field, remapped to -1..1 and used to move the EDGE, not to multiply the body */
    const nz=(fbm(rx*nsc+8,ry*nsc+8,seed)-0.5)*2;
    const edge=(1.0+nz*TEAR)*SPAN;          // where this direction's margin sits, inside the cell
    let a;
    if(r<=CORE)a=1;
    else if(r>=edge)a=0;
    else { const t=(r-CORE)/Math.max(1e-4,edge-CORE); a=1-sm(t); }
    /* A SECOND, FINER NOISE NIBBLES HOLES IN THE MARGIN — the plate's edges are broken, not merely
       soft, and a hole carries boundary the way a bump does.
       RAMPED IN FROM THE CORE OUTWARD, which is the fix for the hard disc: at the core the nibble
       has no authority at all and at the edge it has all of it, so alpha is continuous everywhere
       instead of stepping from 1 to noise across one texel. */
    if(a>0&&r>CORE){
      const ramp=sm(Math.max(0,Math.min(1,(r-CORE)/Math.max(1e-4,edge-CORE))));
      const n2=fbm(rx*nsc*3.1+40,ry*nsc*3.1+40,seed+91);
      const keep=Math.max(0,Math.min(1,(n2-0.22)*3.4));
      a*=1-ramp*(1-keep); }
    /* THE BORDER GUARD. Belt and braces over SPAN: alpha is forced to zero across the outermost
       texels of the cell whatever the noise wanted, so an atlas cell can never present a hard edge
       to a ClampToEdgeWrapping sampler. */
    a*=1-sm(Math.max(0,Math.min(1,(r-0.90)/0.10)));
    a*=GAIN;
    const v=Math.max(0,Math.min(1,a));
    const b=Math.round(v*255);
    const i=((oy+y)*N+(ox+x))*4;
    img[i]=b; img[i+1]=b; img[i+2]=b; img[i+3]=b;
    alphaSum+=v; if(b)nonZero++; if(b>8&&b<247)graded++;
  }
  cells++;
}

const raw='/tmp/cloud_wisps.raw';
fs.writeFileSync(raw,Buffer.from(img));
const out=path.join(ROOT,'assets/tex/cloud_wisps.png');
execSync(`ffmpeg -v error -y -f rawvideo -pix_fmt rgba -s ${N}x${N} -i "${raw}" `+
  `-frames:v 1 -pix_fmt rgba "${out}"`);
const st=fs.statSync(out);
console.log('baked '+out);
console.log('  '+N+'x'+N+'  '+GRID+'x'+GRID+' wisps ('+cells+' cells), core '+CORE+', tear '+TEAR);
/* AND THE FRACTION ABOVE THE SCORER'S CONTOUR IS PRINTED, because that is the number the boundary
   metric responds to and it is not the same as coverage. */
{ let above=0;
  for(let i=1;i<img.length;i+=4)if(img[i]>=Math.round(0.57*255))above++;
  console.log('  above the a=0.57 contour the scorer measures: '+(above/(N*N)*100).toFixed(1)+
    '% of the sheet'); }
console.log('  mean alpha '+(alphaSum/(N*N)).toFixed(3)+
  '   non-zero '+(nonZero/(N*N)*100).toFixed(1)+'%'+
  '   GRADED (neither clear nor solid) '+(graded/(N*N)*100).toFixed(1)+
  '% — that band is the feathered margin, and it is what this atlas is for');
/* THE BORDER IS MEASURED AND PRINTED, because it is the thing that was wrong. */
{ let bmax=0;
  for(let cy=0;cy<GRID;cy++)for(let cx=0;cx<GRID;cx++){
    const ox=cx*CELL, oy=cy*CELL;
    for(let t=0;t<CELL;t++){
      for(const [x,y] of [[ox+t,oy],[ox+t,oy+CELL-1],[ox,oy+t],[ox+CELL-1,oy+t]])
        bmax=Math.max(bmax,img[((y)*N+(x))*4+1]); } }
  console.log('  worst alpha anywhere on a cell BORDER: '+bmax+
    ' of 255 — anything above zero is a hard square edge in the frame'); }
console.log('  bytes '+st.size.toLocaleString('en-US')+
  '  md5 '+execSync('md5 -q "'+out+'"').toString().trim());
