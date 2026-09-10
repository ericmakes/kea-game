/* PLATESCORE — the strip, scored against the plates, property by property.
   Usage: node gauntlet/verify/platescore.mjs            shoot recipe c, score, print the table
          RECIPE=b node gauntlet/verify/platescore.mjs   score another family
          FRAME=<png> MASK=<png> node ...                score frames already on disk
          JSON=1 node ...                                machine-readable, for the iteration loop

   WHY THIS EXISTS. Four of Eric's five terrain points were closed by measuring one number each —
   value, form, scale, banding — and the strip still came back reading like a different family. A
   measurement that says "in band" while the picture says "no" is measuring the wrong thing, and the
   answer is not to stop measuring: it is to measure the properties that were doing the judging.
   Eric named five: edge density, local contrast, snow patchiness, luma/hue, silhouette roughness.

   EVERY TARGET IS DERIVED FROM THE PAIRED PLATE, and never from our own output — that is the whole
   discipline here. A band read off the game is a band the game passes by construction.
   AND THE BAND'S WIDTH COMES FROM THE PLATE'S OWN DISAGREEMENT WITH ITSELF. Each plate's ridge band
   is split into four vertical tiles and the property measured in each; the target is the spread of
   those four, widened to at least +/-18% of the plate's own mean. A photograph of a mountain range
   is not uniform, and a band tighter than the reference's internal variation is a band that means
   nothing. It is stated per property in the table so it can be argued with.

   THE TWO PLATES DISAGREE, LOUDLY, AND THAT IS KEPT. nz_alps_01 is a close massif under a deep blue
   sky with a dark foreground rock; nz_alps_02 is a distant snowy ridge under overcast white. Their
   bands do not overlap on most properties. So the game is scored against EACH, separately, and a
   property counts as in band if it lands inside EITHER — which is the honest reading of "look like
   these two photographs", and it is reported both ways so the disagreement stays visible.

   EVERYTHING IS MEASURED ON A BAND-CROPPED, WIDTH-NORMALISED IMAGE. Edge density and silhouette
   roughness are per-pixel quantities: at two different scales they are two different measurements.
   Crop to the ridge band (stripcam.mjs owns those), scale to 1440 wide, then measure. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { execSync } from 'child_process';
import { W as SW, H as SH, CAM, QUIET, BANDS, GAMEBAND, PLATESKY, RECIPENAME } from './stripcam.mjs';

const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'../..');
const OUT=path.join(ROOT,'gauntlet/capture');
const BOARD=path.join(ROOT,'gauntlet/reference/board');
export const NORMW=1440;          // every image is measured at this width

/* ---------- image loading ---------- */
export function loadRGB(f){
  const d=execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height `+
    `-of csv=p=0 "${f}"`,{encoding:'utf8'}).trim().split(',').map(Number);
  const buf=execSync(`ffmpeg -v error -i "${f}" -vf format=rgb24 -f rawvideo -`,
    {maxBuffer:1<<28,encoding:'buffer'});
  return {w:d[0],h:d[1],buf};
}
/* CROP TO A BAND AND SCALE TO ONE WIDTH. format=rgb24 goes BEFORE crop, which is not a style
   choice: an odd-width crop of a subsampled JPEG short-decodes otherwise, and lum.mjs lost an
   afternoon to exactly that (asked 335 px, got 332). */
export function bandNorm(src,lo,hi,w){
  const d=execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height `+
    `-of csv=p=0 "${src}"`,{encoding:'utf8'}).trim().split(',').map(Number);
  const y0=Math.round(d[1]*lo), hh=Math.round(d[1]*(hi-lo));
  const tmp=path.join('/tmp','ps_'+path.basename(src).replace(/\W/g,'_')+'_'+
    Math.round(lo*100)+'_'+Math.round(hi*100)+'_'+w+'.png');
  execSync(`ffmpeg -v error -y -i "${src}" -vf `+
    `"format=rgb24,crop=${d[0]}:${hh}:0:${y0},scale=${w}:-2" "${tmp}"`);
  return loadRGB(tmp);
}
const px=(im,x,y)=>{const i=(y*im.w+x)*3;return [im.buf[i],im.buf[i+1],im.buf[i+2]];};
const lumOf=p=>(0.2126*p[0]+0.7152*p[1]+0.0722*p[2])/255;
export function lumPlane(im){
  const L=new Float32Array(im.w*im.h);
  for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++)L[y*im.w+x]=lumOf(px(im,x,y));
  return L;
}
const quant=(arr,q)=>{ const s=Float64Array.from(arr).sort();
  return s[Math.min(s.length-1,Math.max(0,Math.floor(s.length*q)))]; };

/* ---------- the five properties ---------- */

/* 1. EDGE DENSITY — a Sobel gradient-magnitude histogram, reported as the fraction of pixels whose
      gradient exceeds 0.06 in luma per pixel. A photograph of rock is dense with edges at every
      scale; a smooth shaded heightfield has almost none, which is what made ours read as a blob.
      THE FRACTION, NOT THE MEAN, because the mean is dominated by the vast smooth areas both
      images share and moves very little between a blob and a cliff. */
export function edgeDensity(im,L,keep){
  L=L||lumPlane(im); const {w,h}=im;
  /* THE EXPOSURE IS NORMALISED AWAY FIRST, and that is a correction rather than a refinement. The
     threshold below is an ABSOLUTE step in luma, so a darker image has smaller gradients everywhere
     and scores lower on structure it actually has. Measured: adding the triplanar rock scan to the
     range RAISED its detail and DROPPED this metric from 0.058 to 0.038, because the same change
     darkened the band from 0.489 to 0.398. That is the metric reading brightness, and brightness is
     already its own row in the table. Scaling each band to a common mean luma makes edge density a
     statement about STRUCTURE and lets the two properties be chased independently.
     THE PLATES ARE NORMALISED THE SAME WAY, so the comparison stays like for like — and their bands
     move when this changes, which is why it is done inside the metric rather than to the image. */
  let mean=0, mcount=0;
  for(let i=0;i<L.length;i++)if(!keep||keep[i]){mean+=L[i];mcount++;}
  mean=mcount?mean/mcount:0;
  const k=mean>1e-4?0.45/mean:1;
  if(Math.abs(k-1)>1e-6){ const N=new Float32Array(L.length);
    for(let i=0;i<L.length;i++)N[i]=Math.min(1,L[i]*k); L=N; }
  let n=0, tot=0; const hist=new Array(12).fill(0);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const g=(a,b)=>L[a]-L[b];
    const gx=g((y-1)*w+x+1,(y-1)*w+x-1)+2*g(y*w+x+1,y*w+x-1)+g((y+1)*w+x+1,(y+1)*w+x-1);
    const gy=g((y+1)*w+x-1,(y-1)*w+x-1)+2*g((y+1)*w+x,(y-1)*w+x)+g((y+1)*w+x+1,(y-1)*w+x+1);
    /* ONLY WHERE THE SUBJECT IS, and the 3x3 neighbourhood must be entirely inside the mask —
       otherwise the SILHOUETTE itself counts as an enormous edge and the metric measures how much
       sky is in frame. */
    if(keep){ let all=1;
      for(let dy=-1;dy<=1&&all;dy++)for(let dx=-1;dx<=1;dx++)if(!keep[(y+dy)*w+x+dx]){all=0;break;}
      if(!all)continue; }
    const m=Math.hypot(gx,gy)/4;
    tot++; if(m>0.06)n++;
    hist[Math.min(11,Math.floor(m*40))]++;
  }
  return {value:n/tot, hist:hist.map(v=>+(v/tot).toFixed(4))};
}

/* 2. LOCAL CONTRAST — the 10th percentile of luma in the ridge band. Eric's own number: the plates
      sit near 0.04, meaning a real range has genuinely BLACK shadowed faces. Ours reached 0.27,
      which is a range with no dark end at all. p10 rather than the minimum, so one blown pixel
      cannot carry it. */
export function ridgeP10(im,L,keep){ L=L||lumPlane(im);
  const v=keep?Array.from(L).filter((_,i)=>keep[i]):L;
  return {value:v.length?quant(v,0.10):null}; }

/* 3. SNOW PATCHINESS — how HARD the snow's edges are. The snow mask is taken relative to each
      image's own distribution (above the midpoint between its median and its 98th percentile), so
      it works on an overcast plate and a blue-sky one alike without a fixed threshold. Then two
      numbers: the mean gradient magnitude ON the mask boundary (a hard edge is a big gradient; a
      gradient-blended snowline is a small one), and the perimeter over sqrt(area), which is the
      shape term — patches broken up by noise have far more perimeter than one smooth cap.
      REPORTED AS THE BOUNDARY GRADIENT, with the shape term printed beside it, because it is the
      one that distinguishes "hard-edged patches" from "a soft ramp" and that is what Eric asked
      for. If the mask is tiny the property is reported as absent rather than as a number: an image
      with no snow has no snow edges, and inventing a value for it would be worse than saying so. */
export function snowPatch(im,L,keep){
  L=L||lumPlane(im); const {w,h}=im;
  const sub=keep?Array.from(L).filter((_,i)=>keep[i]):L;
  if(keep&&sub.length<200)return {value:null,area:0,note:'nothing inside the mask'};
  const med=quant(sub,0.50), hi=quant(sub,0.98);
  const thr=med+0.60*(hi-med);
  const m=new Uint8Array(w*h);
  let area=0, room=0;
  for(let i=0;i<L.length;i++){ if(keep&&!keep[i])continue; room++;
    if(L[i]>thr){m[i]=1;area++;} }
  if(area<room*0.01)return {value:null,area:room?area/room:0,note:'no snow to speak of'};
  let per=0, gsum=0, gn=0;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x; if(!m[i])continue;
    if(m[i-1]&&m[i+1]&&m[i-w]&&m[i+w])continue;      // interior
    per++;
    const gx=(L[i+1]-L[i-1]), gy=(L[i+w]-L[i-w]);
    gsum+=Math.hypot(gx,gy)/2; gn++;
  }
  return {value:gn?gsum/gn:0, area:room?area/room:0, shape:per/Math.sqrt(area)};
}

/* 4. LUMA AND HUE. The band's mean luma, its mean hue in degrees and its saturation. These are the
      properties the earlier pieces already chased; they are here so one table carries all of it
      and so a change that fixes texture by wrecking the colour cannot hide. */
export function lumaHue(im,keep){
  const {w,h}=im; const s=[0,0,0]; let n=0, l=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ if(keep&&!keep[y*w+x])continue;
    const p=px(im,x,y);
    s[0]+=p[0];s[1]+=p[1];s[2]+=p[2]; l+=lumOf(p); n++; }
  if(!n)return {luma:null,hue:null,sat:null,rgb:[0,0,0],px:0};
  const rgb=s.map(v=>v/n), mx=Math.max(...rgb), mn=Math.min(...rgb);
  let hue=Math.atan2(Math.sqrt(3)*(rgb[1]-rgb[2]),2*rgb[0]-rgb[1]-rgb[2])*180/Math.PI;
  if(hue<0)hue+=360;
  return {luma:l/n, hue, sat:(mx-mn)/(mx||1), rgb, px:n};
}

/* 5. SILHOUETTE ROUGHNESS — how jagged the skyline is, in pixels of second difference per column.
      A ridge of arêtes reverses direction constantly; a smooth massif does not. Measured on the
      skyline AFTER a 3-px smooth, so single-pixel dither is not mistaken for a peak, and normalised
      by nothing at all: both images are at the same width and the same band height, which is what
      bandNorm is for.
      THE SKYLINE COMES FROM A MASK THE CALLER SUPPLIES, because there is no single sky test that is
      honest on all three images — see PLATESKY in stripcam.mjs, and the game's exact painted mask
      below. A colour threshold that works on one of these pictures is wrong on another, and this
      session has already built and thrown away four of them. */
export function silhouette(im,isSky){
  const {w,h}=im;
  const top=[];
  for(let x=0;x<w;x++){ let y=0; while(y<h&&isSky(px(im,x,y),x,y))y++; top.push(y); }
  const sm=[];
  for(let x=0;x<w;x++){ let a=0,c=0;
    for(let d=-1;d<=1;d++){ const q=x+d; if(q>=0&&q<w){a+=top[q];c++;} } sm.push(a/c); }
  let rough=0, n=0;
  for(let x=1;x<w-1;x++){ rough+=Math.abs(sm[x+1]-2*sm[x]+sm[x-1]); n++; }
  const known=top.filter(v=>v>0&&v<h-1).length;
  return {value:n?rough/n:0, coverage:known/w,
          span:Math.max(...sm)-Math.min(...sm), mean:sm.reduce((a,b)=>a+b,0)/w};
}

/* ---------- the target bands, from the paired plate's own four tiles ---------- */
export const PROPS=['edgeDensity','ridgeP10','snowPatch','luma','hue','sat','silhouette'];
const MINREL=0.18;                // a band is never tighter than +/-18% of the plate's own mean
const HUETOL=30;                  // degrees, about the plate's mean — see plateBand

/* EVERY PROPERTY IS MEASURED ON THE SUBJECT ONLY, and finding that out cost a false 7-of-7. The
   colour metrics were being taken over the whole ridge band, SKY INCLUDED, and the sky is a large
   blue area: the strip scored hue 201 while terrainvalue.mjs — which masks the range by DEPTH and
   measures nothing else — put the same rock at hue 24, warm. Both numbers were right about
   different things and only one of them is about the rock. The sky also occupies a different
   fraction of the game frame than of either plate, so including it makes the comparison
   incomparable in a way no amount of band-fitting can fix.
   edgeDensity NORMALISES ITS OWN COPY of the luma plane; ridgeP10 and snowPatch must NOT see a
   normalised one, since their whole point is the image's real values. The plane is passed in and
   never mutated — checked by the selftest, because an in-place normalisation here would silently
   rewrite the contrast number too. */
export function measureAll(im,isSky){
  const L=lumPlane(im);
  const {w,h}=im;
  let keep=null;
  if(isSky){ keep=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)keep[y*w+x]=isSky(px(im,x,y),x,y)?0:1; }
  const lh=lumaHue(im,keep);
  return { edgeDensity:edgeDensity(im,L,keep).value, ridgeP10:ridgeP10(im,L,keep).value,
           snowPatch:snowPatch(im,L,keep).value, luma:lh.luma, hue:lh.hue, sat:lh.sat,
           silhouette:isSky?silhouette(im,isSky).value:null,
           _extra:{snow:snowPatch(im,L,keep), lh, edge:edgeDensity(im,L,keep), subject:lh.px} };
}

/* FOUR TILES, and they are VERTICAL slices rather than quadrants on purpose: a mountain photograph
   varies far more left-to-right (this massif, that valley, the next ridge) than top-to-bottom
   inside its own ridge band, so vertical slices sample the variation that actually exists. */
export function plateBand(im,isSky){
  const tiles=[];
  const tw=Math.floor(im.w/4);
  for(let t=0;t<4;t++){
    const sub={w:tw,h:im.h,buf:Buffer.alloc(tw*im.h*3)};
    for(let y=0;y<im.h;y++)for(let x=0;x<tw;x++){
      const p=px(im,t*tw+x,y), i=(y*tw+x)*3;
      sub.buf[i]=p[0]; sub.buf[i+1]=p[1]; sub.buf[i+2]=p[2]; }
    tiles.push(measureAll(sub,isSky));
  }
  const whole=measureAll(im,isSky);
  const band={};
  for(const k of PROPS){
    const vs=tiles.map(t=>t[k]).filter(v=>v!==null&&isFinite(v));
    if(!vs.length||whole[k]===null){ band[k]=null; continue; }
    const c=whole[k];
    /* HUE IS THE ONE PROPERTY WHOSE BAND IS NOT THE TILE SPREAD, and the reason is arithmetic
       rather than taste. Hue is an ANGLE, and nz_alps_02's four tiles run from warm rock to blue
       distance — 22 degrees to 221 — so the spread rule handed it a band 199 degrees wide, which
       accepts essentially any colour. The range duly measured hue 57, a warm yellow-tan against two
       plates that sit at 210 and 212, and the table called it IN BAND. That is exactly the
       "measurement says yes, picture says no" failure this whole file exists to stop, so hue gets a
       FIXED tolerance about the plate's own mean instead: 30 degrees, which is roughly where two
       greys stop reading as the same stone. This makes the test harder, not easier. */
    if(k==='hue'){ band[k]={lo:c-HUETOL,hi:c+HUETOL,plate:c,tiles:vs,fixed:true}; continue; }
    let lo=Math.min(...vs), hi=Math.max(...vs);
    const pad=Math.abs(c)*MINREL;
    lo=Math.min(lo,c-pad); hi=Math.max(hi,c+pad);
    band[k]={lo,hi,plate:c,tiles:vs};
  }
  return {band,whole};
}

/* ---------- shooting the strip ---------- */
async function shootStrip(recipe){
  const {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED}=await import('./webrig.mjs');
  ensureBuild(); const srv=await serve();   // serve() is async — an unawaited one navigates to "undefined/"
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const out={};
  /* TWO FRAMES. The shipping one is what gets scored; the FLAG one paints the range a colour
     nothing else in the scene wears, by forcing its own aerial-perspective haze to magenta at full
     strength, and that is what gives an EXACT silhouette with no colour threshold anywhere near
     it. The alternative — a sky test on the shipping frame — is the mistake this session made four
     times: blue-dominance stopped at the clouds, then missed desaturated horizon sky, then fog
     invariance called the grass at the camera's feet sky. */
  for(const [name,haze] of [['ship',null],['flag',{color:0xFF00FF,density:0.25}]]){
    /* KEATERRAINX merges extra terrain constants into both shots, so a candidate can be scored
       without an edit-and-rebuild cycle. The tool sets KEATERRAIN itself, so an outer one would be
       clobbered — the same trap terrainvalue.mjs hit, where two different treeline candidates came
       back byte-identical. */
    const xtra=process.env.KEATERRAINX?JSON.parse(process.env.KEATERRAINX):{};
    process.env.KEATERRAIN=JSON.stringify(Object.assign({},xtra,haze?{recipe,haze}:{recipe}));
    const browser=await launch(); const page=await browser.newPage();
    await page.setViewport({width:SW,height:SH});
    await preparePage(page,{seed:GAUNTLETSEED,biome:'carpark'});
    await page.goto(srv.origin+'/',{waitUntil:'load'});
    await assertBooted(page);
    await page.evaluate('window.AudioContext=undefined;KEAGAME.startGame(1);');
    await sleep(900);
    await page.evaluate(QUIET); await page.evaluate(CAM);
    const st=await page.evaluate('(()=>({recipe:KEAGAME.G.terrain.recipe}))()');
    if(st.recipe!==recipe)throw new Error('platescore: asked for recipe '+recipe+
      ' and the page built '+st.recipe);
    await sleep(1300);
    const f=path.join(OUT,'SCORE_'+name+'.png');
    await page.screenshot({path:f}); await browser.close();
    out[name]=f;
  }
  delete process.env.KEATERRAIN;
  await srv.close();
  return out;
}

/* ---------- the report ---------- */
const FMT={edgeDensity:v=>v.toFixed(4), ridgeP10:v=>v.toFixed(3), snowPatch:v=>v.toFixed(4),
           luma:v=>v.toFixed(3), hue:v=>v.toFixed(0), sat:v=>v.toFixed(3),
           silhouette:v=>v.toFixed(3)};
const LABEL={edgeDensity:'edge density', ridgeP10:'local contrast (ridge p10)',
             snowPatch:'snow patchiness (edge)', luma:'luma', hue:'hue',
             sat:'saturation', silhouette:'silhouette roughness'};

export async function score({recipe='c',frame=null,mask=null}={}){
  if(!frame){ const s=await shootStrip(recipe); frame=s.ship; mask=s.flag; }
  const game=bandNorm(frame,GAMEBAND[0],GAMEBAND[1],NORMW);
  /* THE GAME'S SKY IS EVERYTHING THE FLAG FRAME DID NOT PAINT. Exact, and eroded by nothing,
     because a silhouette is precisely the boundary we want. */
  let gameSky=null;
  if(mask){
    const mim=bandNorm(mask,GAMEBAND[0],GAMEBAND[1],NORMW);
    const isMag=p=>p[0]>110&&p[2]>110&&p[1]<70&&Math.abs(p[0]-p[2])<90;
    gameSky=(p,x,y)=>!isMag(px(mim,x,y));
  }
  const g=measureAll(game,gameSky);

  const plates={};
  for(const n of Object.keys(BANDS)){
    const im=bandNorm(path.join(BOARD,n+'.jpg'),BANDS[n][0],BANDS[n][1],NORMW);
    plates[n]=plateBand(im,PLATESKY[n].test);
  }

  const rows=[]; let inCount=0, judged=0;
  for(const k of PROPS){
    const gv=g[k];
    const cells=Object.keys(plates).map(n=>{
      const b=plates[n].band[k];
      if(b===null||gv===null)return {n,b,ok:null};
      return {n,b,ok:gv>=b.lo&&gv<=b.hi};
    });
    const any=cells.some(c=>c.ok===true), all=cells.every(c=>c.ok===null);
    if(!all){ judged++; if(any)inCount++; }
    rows.push({k,gv,cells,ok:all?null:any});
  }
  return {game:g,plates,rows,inCount,judged,frame,mask,recipe};
}

export function table(res){
  const L=[];
  L.push('  property                      game        nz_alps_01 band          nz_alps_02 band        verdict');
  for(const r of res.rows){
    const f=FMT[r.k]||(v=>String(v));
    const cell=c=>c.b===null?'        —            ':
      (('['+f(c.b.lo)+' … '+f(c.b.hi)+']').padEnd(22));
    L.push('  '+LABEL[r.k].padEnd(28)+
      (r.gv===null?'—':f(r.gv)).padEnd(12)+
      cell(res.rows.find(q=>q.k===r.k).cells[0])+
      cell(res.rows.find(q=>q.k===r.k).cells[1])+
      (r.ok===null?'not judged':(r.ok?'IN BAND':'OUT'))+
      (r.ok===false?'  ('+r.cells.filter(c=>c.b).map(c=>
        (r.gv<c.b.lo?'below ':'above ')+c.n.replace('nz_',''))
        .join(', ')+')':''));
  }
  L.push('');
  L.push('  '+res.inCount+' of '+res.judged+' properties in band (a property counts as in band if '+
    'it lands inside EITHER plate)');
  return L.join('\n');
}

/* plateSubject(name) — what a plate's ROCK measures, with its sky masked off. Exported so that
   every instrument in the tree takes its plate references from one place. terrainvalue.mjs was
   comparing the game's depth-masked RANGE against plate numbers taken over the whole ridge band
   INCLUDING SKY, which is the same apples-to-oranges fault this file had until the subject mask
   landed — and the two instruments duly disagreed about the same range, one calling it in band and
   the other out. One measurement of the plates, imported, cannot do that. */
export function plateSubject(name){
  const im=bandNorm(path.join(BOARD,name+'.jpg'),BANDS[name][0],BANDS[name][1],NORMW);
  const L=lumPlane(im), {w,h}=im;
  const keep=new Uint8Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*3;
    keep[y*w+x]=PLATESKY[name].test([im.buf[i],im.buf[i+1],im.buf[i+2]])?0:1; }
  const v=Array.from(L).filter((_,i)=>keep[i]).sort((a,b)=>a-b);
  const q=t=>v[Math.min(v.length-1,Math.floor(v.length*t))];
  const lh=lumaHue(im,keep);
  return {luma:lh.luma, hue:lh.hue, sat:lh.sat, p10:q(0.10), p50:q(0.50), p90:q(0.90),
          spread:q(0.90)-q(0.10), px:v.length};
}

/* ---------- the composite, so the picture can be looked at beside the numbers ----------
   Eric's loop is "shoot the c strip, score it, view the composite yourself against alps_01 and
   alps_02, adjust". The scorer already crops and normalises exactly the bands it measures, so it
   is the right thing to build the composite from: what I look at is then the same pixels the table
   is about, rather than a differently-cropped picture that might disagree with it. */
export function compose(frame){
  const outs=[];
  const gband=bandNorm(frame,GAMEBAND[0],GAMEBAND[1],NORMW);
  const gtmp='/tmp/ps_compose_game.png';
  execSync(`ffmpeg -v error -y -i "${frame}" -vf `+
    `"format=rgb24,crop=iw:${Math.round(SH*(GAMEBAND[1]-GAMEBAND[0]))}:0:`+
    `${Math.round(SH*GAMEBAND[0])},scale=${NORMW}:-2" "${gtmp}"`);
  for(const n of Object.keys(BANDS)){
    const ptmp='/tmp/ps_compose_'+n+'.png';
    const src=path.join(BOARD,n+'.jpg');
    const d=execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height `+
      `-of csv=p=0 "${src}"`,{encoding:'utf8'}).trim().split(',').map(Number);
    execSync(`ffmpeg -v error -y -i "${src}" -vf `+
      `"format=rgb24,crop=${d[0]}:${Math.round(d[1]*(BANDS[n][1]-BANDS[n][0]))}:0:`+
      `${Math.round(d[1]*BANDS[n][0])},scale=${NORMW}:-2" "${ptmp}"`);
    const out=path.join(OUT,'SCORE_vs_'+n.replace('nz_','')+'.png');
    execSync(`ffmpeg -v error -y -i "${ptmp}" -i "${gtmp}" -filter_complex `+
      `"[0:v]pad=${NORMW}:ih+3:0:0:color=0x202020[a];[a][1:v]vstack=inputs=2,format=rgb24" "${out}"`);
    outs.push(out);
  }
  return outs;
}


/* ======================================================================================
   THE SKY — SKY.md step 1. Five properties, the same discipline: every target band comes
   from the paired plate, the band is never tighter than the plate's own internal spread,
   and the region is masked so that a number about the sky cannot be a number about a hill.
   ====================================================================================== */
import { SKYBANDS, SKYPLATES, SKYGAMEBAND, SKYFLAG, SKYQUIET, BOWSKY, SKYFORM } from './stripcam.mjs';

/* THE CLOUD MASK IS AN ABSOLUTE NEUTRALITY THRESHOLD, AND OTSU WAS TRIED FIRST AND THROWN AWAY.
   The mask is derived the SAME WAY for the game and for the plates, and that sameness is the
   point. The obvious alternative was a third flag frame — clouds only, black background — which
   would have given the game an EXACT geometric mask while the plates got a threshold, and then
   "perimeter over root area" would have been two different measurements wearing one name: a
   geometric mask has hard edges by construction and a thresholded photograph does not.

   WHY NOT OTSU, WHICH IS WHAT THIS FUNCTION DID FIRST. Otsu picks the threshold that best splits a
   histogram in two, and a SMOOTH VERTICAL GRADIENT splits beautifully — into its top half and its
   bottom half. Run on nz_tussock_03, whose sky crop is 122 rows of cloudless deep blue, it
   reported 64% cloud cover with a separability of 0.729, and it did the same on every signal
   offered to it (blue-minus-red 63.8%, saturation 66.9%, saturation minus the row median 64.1%).
   A number that high, on that picture, is the instrument measuring the sky's own aerial
   perspective and calling it cumulus. This is the fourth time this session that a threshold
   derived from the data under test has agreed with whatever it was pointed at.

   SO THE THRESHOLD IS ABSOLUTE, AND IT IS ABSOLUTE IN SATURATION, because that is the one property
   where cloud and sky do not overlap: a cloud is NEUTRAL, whatever its brightness, and these skies
   are not. Cover, measured across a sweep, with what each picture actually shows beside it:

                       s<0.10  s<0.15  s<0.20  s<0.25  s<0.30  s<0.35   what is in the crop
       nz_carpark_01    24.9%   51.9%   75.7%   84.0%   85.2%   86.5%   a cumulus bank, most of it
       nz_tussock_03     0.0%    0.0%    0.1%    7.5%   38.1%   57.9%   cloudless deep blue
       nz_alps_01        0.0%    0.0%    0.0%    0.0%    0.0%    0.1%   cloudless

   0.20 is the only threshold in that sweep that agrees with all three pictures at once. Above it
   tussock_03 starts inventing cloud out of its gradient; below it carpark_01 starts losing the
   grey half of its own cloud bank. Note the shape of the evidence as well as its value: carpark_01
   has a PLATEAU from 0.25 to 0.35 — a real boundary — and tussock_03 has none, which is the
   signature of a picture with no cloud in it to find.

   LUMA CANNOT DO THIS JOB, which is why saturation and not brightness. A cumulus underside is
   DARKER than the blue sky beside it while its top is brighter, so any luma threshold splits the
   cloud in half — and the half it discards is exactly what property 2 exists to measure.

   THE GAME'S FRAMES CARRY A CSS SATURATION BOOST and the plates do not: index.html renders the
   canvas under filter:saturate(1.22). It is not removed here. It is what the player sees, so it is
   what should be judged, and every saturation row in the table is a statement about the shipped
   picture rather than about the framebuffer. It does mean this threshold sits nearer the game's
   grey cloud bellies than it does the plates', and the cloud mask's own saturation histogram is
   printed under the table so that if a cloud ever straddles it, that shows rather than hides. */
export const CLOUDSAT=0.20;
/* AND THE MASK IS REFUSED WHEN IT IS DEGENERATE. A crop with no cloud in it and a crop that is
   nothing but cloud both make every cloud property meaningless, and the difference between "0.4%
   of the crop is cloud" and "there are no clouds here" is a difference the table must state rather
   than average away. nz_alps_01 measured 0.4% under the old mask and duly reported a cloud shape
   of 6.75 and per-tile values of 39.6, 38.2 and 40.0 — a band from that accepts anything. */
export const CLOUDFLOOR=0.03, CLOUDCEIL=0.97;
export function cloudMask(im,keep){
  const {w,h}=im;
  const mask=new Uint8Array(w*h); const sat=new Float32Array(w*h);
  let area=0, room=0, sLo=0,nLo=0,sHi=0,nHi=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x; if(keep&&!keep[i])continue; room++;
    const p=i*3, r=im.buf[p]/255,g=im.buf[p+1]/255,b=im.buf[p+2]/255;
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
    const sv=mx>0?(mx-mn)/mx:0; sat[i]=sv;
    if(sv<CLOUDSAT){mask[i]=1;area++;sLo+=sv;nLo++;} else {sHi+=sv;nHi++;}
  }
  if(room<400)return {mask:null,note:'sky region too small to threshold ('+room+' px)'};
  const cover=area/room;
  const hist=new Array(10).fill(0);
  for(let i=0;i<sat.length;i++)if(!keep||keep[i])hist[Math.min(9,Math.floor(sat[i]*10))]++;
  const out={thr:CLOUDSAT, cover, area, room, sat,
             meanCloudSat:nLo?sLo/nLo:null, meanSkySat:nHi?sHi/nHi:null,
             hist:hist.map(v=>+(v/room).toFixed(3))};
  if(cover<CLOUDFLOOR)return {...out,mask:null,
    note:'no cloud to speak of — '+(cover*100).toFixed(1)+'% of the sky is neutral'};
  if(cover>CLOUDCEIL)return {...out,mask:null,
    note:'wall-to-wall cloud — '+(cover*100).toFixed(1)+'% of the sky is neutral, so there is no '+
         'cloud EDGE in frame to measure'};
  return {...out,mask};
}

/* CONNECTED COMPONENTS, 4-connected, with a floor on size. A JPEG's chroma noise makes a few
   hundred one-pixel specks near any threshold and a speck has a perimeter-to-area ratio nothing
   else can match, so a floor is not tidying up — without it the shape term measures compression. */
export function blobs(im,mask,minFrac){
  const {w,h}=im; const lab=new Int32Array(w*h).fill(-1); const out=[];
  /* minFrac===0 IS AN EXPLICIT OPT-OUT and not just a small number: Math.max(9, 0) is 9, so
     asking for "no floor" and getting a nine-pixel one is the sort of quiet disagreement between
     a caller and a default that the selftest exists to catch — and did. */
  const floor=minFrac===0?1:Math.max(9,Math.round(w*h*(minFrac===undefined?0.0002:minFrac)));
  const qx=new Int32Array(w*h), qy=new Int32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(!mask[y*w+x]||lab[y*w+x]>=0)continue;
    const id=out.length; let head=0,tail=0; qx[tail]=x;qy[tail]=y;tail++; lab[y*w+x]=id;
    let x0=x,x1=x,y0=y,y1=y,area=0,per=0;
    while(head<tail){
      const cx=qx[head],cy=qy[head];head++;
      area++; if(cx<x0)x0=cx; if(cx>x1)x1=cx; if(cy<y0)y0=cy; if(cy>y1)y1=cy;
      let edge=0;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=cx+dx, ny=cy+dy;
        if(nx<0||ny<0||nx>=w||ny>=h||!mask[ny*w+nx]){edge=1;continue;}
        if(lab[ny*w+nx]<0){lab[ny*w+nx]=id;qx[tail]=nx;qy[tail]=ny;tail++;}
      }
      if(edge)per++;
    }
    out.push({id,area,per,x0,x1,y0,y1});
  }
  return out.filter(b=>b.area>=floor);
}

/* 1. CLOUD FORM — two numbers, because "form" is two questions and one of them is the one the
      current sky fails. SHAPE is perimeter over root area, area-weighted across blobs: the
      snow-patchiness shape term, which is already written and already tested. VERTICAL EXTENT is
      each blob's bounding-box height as a fraction of the sky band, area-weighted: eight
      ellipsoids at scale.y 0.32 are flat by construction, and a cumulus builds. */
export function cloudForm(im,cm){
  if(!cm||!cm.mask)return {shape:null,vext:null,cover:null,blobs:0,note:cm&&cm.note};
  const bs=blobs(im,cm.mask);
  if(!bs.length)return {shape:null,vext:null,cover:cm.cover,blobs:0,note:'no cloud blob above the size floor'};
  let A=0,sh=0,ve=0;
  for(const b of bs){ A+=b.area; sh+=b.area*(b.per/Math.sqrt(b.area));
    ve+=b.area*((b.y1-b.y0+1)/im.h); }
  return {shape:sh/A, vext:ve/A, cover:cm.cover, blobs:bs.length, boxes:bs.length};
}

/* 2. UNDERSIDE SHADING — per blob, the mean luma of the top third of its bounding box minus the
      mean of the bottom third, area-weighted, SIGNED. Positive means bright top and dark belly,
      which is what a lit cumulus does. This is the property TODO 76 is actually about: the current
      sky paints a grey belly sphere by hand, and the question is whether that gives the plates'
      number and whether it points the right way. Measured on the blob's own rows so that a blob
      high in the band and one low in it are compared like for like. */
export function undersideShading(im,L,cm){
  if(!cm||!cm.mask)return {value:null};
  const {w,h}=im; const bs=blobs(im,cm.mask);
  if(!bs.length)return {value:null,note:'no cloud blob above the size floor'};
  let A=0,acc=0, per=[];
  for(const b of bs){
    const bh=b.y1-b.y0+1; if(bh<6)continue;
    const t0=b.y0, t1=b.y0+Math.floor(bh/3), u0=b.y1-Math.floor(bh/3), u1=b.y1;
    let st=0,nt=0,su=0,nu=0;
    for(let y=t0;y<=t1;y++)for(let x=b.x0;x<=b.x1;x++){const i=y*w+x;if(cm.mask[i]){st+=L[i];nt++;}}
    for(let y=u0;y<=u1;y++)for(let x=b.x0;x<=b.x1;x++){const i=y*w+x;if(cm.mask[i]){su+=L[i];nu++;}}
    if(!nt||!nu)continue;
    const d=st/nt-su/nu; acc+=b.area*d; A+=b.area; per.push(+d.toFixed(3));
  }
  return {value:A?acc/A:null, blobs:per.length, each:per.slice(0,10)};
}

/* 6. FLATNESS — is the cloud a layered deck or a heap of balls?
      Eric's complaint, in his words: the clouds "read as stacked balloons - blinding white,
      perfectly round, no flat base, no shaded underside", where real alpine cumulus is
      "flat-bottomed, horizontally stretched, soft-topped".
      MEASURED AS STRUCTURE ANISOTROPY: the mean absolute luma gradient ACROSS the frame's rows
      over the mean absolute gradient ALONG them. A layered deck has strong gradients crossing its
      bands and weak ones running along them; a union of spheres is isotropic by construction.
      AT SIXTEEN PIXELS, AND THE SCALE IS THE WHOLE PROPERTY. At texel scale this measurement is
      worthless and says so: the fine lumpiness of a real deck swamps its layering, and nz_alps_02
      — the flattest plate on the board — read 1.084 against the game's balloons at 1.565, which is
      backwards. Box-blur first and the two separate cleanly, and the separation grows with scale
      for the deck and not for the spheres:

                            r0     r4     r8    r16    r28
          nz_alps_02      1.084  2.089  2.420  2.708  3.097     a layered deck
          nz_carpark_01   1.720  1.994  2.022  1.982  1.742     towering cumulus
          the game        1.714  1.885  2.026  2.060  1.901     spheres

      r16 is taken because it is where the deck stands clearest of both the other two while its own
      trend is still rising — a scale chosen off the references, not off our own output.
      NOTE WHAT THAT TABLE SAYS ABOUT THE GAME: at 2.060 it sits with the TOWERING plate, not the
      flat one. The two cloud forms are genuinely different and the measurement can tell them apart,
      which is the only reason it is worth having.
      MEASURED IN NORMALISED PIXELS. Every image reaches this function at 1440 wide with square
      pixels, so a 16 px blur is the same angular scale on a plate and on a frame. */
export function boxBlur(L,w,h,r){
  if(r<1)return L;
  const t=new Float32Array(L.length), o=new Float32Array(L.length);
  for(let y=0;y<h;y++){ let s=0,n=0;
    for(let x=0;x<w;x++){ s+=L[y*w+x]; n++;
      if(x>=2*r+1){s-=L[y*w+x-2*r-1];n--;}
      if(x>=r)t[y*w+x-r]=s/n; }
    for(let x=Math.max(0,w-r);x<w;x++)t[y*w+x]=t[y*w+Math.max(0,w-r-1)]; }
  for(let x=0;x<w;x++){ let s=0,n=0;
    for(let y=0;y<h;y++){ s+=t[y*w+x]; n++;
      if(y>=2*r+1){s-=t[(y-2*r-1)*w+x];n--;}
      if(y>=r)o[(y-r)*w+x]=s/n; }
    for(let y=Math.max(0,h-r);y<h;y++)o[y*w+x]=o[Math.max(0,h-r-1)*w+x]; }
  return o;
}
export const FLATSCALE=16;
export function cloudFlat(im,L,keep,cm){
  L=L||lumPlane(im); const {w,h}=im;
  /* THE REGION IS THE CLOUD, and where the mask was REFUSED as wall-to-wall the region is the
     whole crop — because that refusal means the crop is nothing but cloud. That is the case for
     the form plate and it is the reason it can carry this property at all. */
  const m=(cm&&cm.mask)?cm.mask:keep;
  const r=FLATSCALE, st=FLATSCALE;
  const B=boxBlur(L,w,h,r);
  let gy=0,gx=0,n=0;
  for(let y=st;y<h-st;y++)for(let x=st;x<w-st;x++){
    const i=y*w+x;
    if(m&&!(m[i]&&m[i-st]&&m[i+st]&&m[i-st*w]&&m[i+st*w]))continue;
    gy+=Math.abs(B[i+st*w]-B[i-st*w]); gx+=Math.abs(B[i+st]-B[i-st]); n++; }
  if(n<500)return {value:null,note:'fewer than 500 samples with a '+st+' px neighbourhood inside '+
    'the cloud — too little cloud to say whether it is layered'};
  return {value:(gy/n)/((gx/n)||1e-9), gy:gy/n, gx:gx/n, n};
}

/* THE SKY'S OWN ROWS — every gradient property is a statement about height, so they all share one
   pass that produces, per row of the band, the mean luma / saturation / hue of the sky pixels that
   are NOT cloud. Excluding cloud is not optional: a row crossing a cumulus is a row about a cloud,
   and with cloud in it the regression below measures cloud cover per row. */
function skyRows(im,L,keep,cm){
  const {w,h}=im; const rows=[];
  for(let y=0;y<h;y++){
    let n=0,l=0,s=0,hx=0,hy=0, lv=[];
    for(let x=0;x<w;x++){ const i=y*w+x;
      if(keep&&!keep[i])continue; if(cm&&cm.mask&&cm.mask[i])continue;
      const p=i*3, r=im.buf[p]/255,g=im.buf[p+1]/255,b=im.buf[p+2]/255;
      const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
      n++; l+=L[i]; lv.push(L[i]); s+=mx>0?(mx-mn)/mx:0;
      let hh=0; if(mx!==mn){ const dd=mx-mn;
        hh=mx===r?60*(((g-b)/dd)%6):mx===g?60*((b-r)/dd+2):60*((r-g)/dd+4); if(hh<0)hh+=360; }
      hx+=Math.cos(hh*Math.PI/180); hy+=Math.sin(hh*Math.PI/180);
    }
    /* A ROW NEEDS ENOUGH CLEAR SKY IN IT TO HAVE A MEDIAN WORTH THE NAME. The first floor here
       was 2% of the width, and on nz_carpark_01 — 76% cloud — that admitted rows carrying thirty
       pixels of blue seen between cumulus, whose median jumped by up to 36 eight-bit levels from
       one row to the next. The banding metric duly reported a step of 15 levels in a photograph.
       15% of the band's width, which is 216 px at the measuring width. */
    if(n<Math.max(24,w*0.15)){rows.push(null);continue;}
    lv.sort((a,b)=>a-b);
    let hue=Math.atan2(hy/n,hx/n)*180/Math.PI; if(hue<0)hue+=360;
    rows.push({y,n,luma:l/n,med:lv[lv.length>>1],sat:s/n,hue});
  }
  return rows;
}

/* 3. SKY GRADIENT, AS TWO ABSOLUTES AND NOT AS A SLOPE, and that choice is a correction made
      before the first number was taken rather than after. A slope in luma per unit of BAND height
      is not comparable between these images: nz_carpark_01's sky band is 0.34 of its frame,
      nz_tussock_03's 0.14, nz_alps_01's 0.09, and the same physical sky measured across a thin
      slice and a thick one gives two different slopes. Normalising by frame height instead only
      moves the problem onto the vertical field of view, which the plates do not carry and which
      tussock_03 — a PORTRAIT crop — plainly does not share with a 26-degree letterbox.
      What IS comparable, and is also what the eye actually reads, are the ABSOLUTES at the two
      ends of the visible sky: how dark and how saturated the sky is at the top of frame, and how
      pale it has become where it meets the land. Both are dimensionless, both are free of the
      field of view, and a three-stop vertex ramp that runs too dark at one end and too white at
      the other is out at both ends rather than passing on an average.
      Measured on the top and bottom DECILE of usable clear-sky rows, so one row of JPEG artefact
      at a crop edge cannot set either end.
      THE HUE ROTATION SURVIVES AS AN ACROSS-BAND QUANTITY because it is already dimensionless — a
      real sky's hue turns as it approaches the horizon, and three stops of vertex colour barely
      turn at all. Its dependence on how much sky is in frame is real and is stated in the table.
      THE BANDING WIDTH is lifted from terrainvalue.mjs, where it was written for exactly this
      defect: how many rows each 8-bit level holds. A photograph's noise changes level almost every
      row; a coarse ramp holds a level for many. */
export function skyGradient(im,L,keep,cm){
  const rows=skyRows(im,L,keep,cm).filter(Boolean);
  if(rows.length<12)return {topLuma:null,horizLuma:null,topSat:null,horizSat:null,
                            lumaRatio:null,satRatio:null,hueRot:null,maxStep:null,bandWidth:null,
                            note:'fewer than 12 usable rows of clear sky'};
  const dec=Math.max(2,Math.round(rows.length/10));
  const top=rows.slice(0,dec), bot=rows.slice(-dec);
  const mean=(a,k)=>a.reduce((s,r)=>s+r[k],0)/a.length;
  const meanHue=a=>{let x=0,y=0;for(const r of a){x+=Math.cos(r.hue*Math.PI/180);y+=Math.sin(r.hue*Math.PI/180);}
    let h=Math.atan2(y/a.length,x/a.length)*180/Math.PI; if(h<0)h+=360; return h;};
  let hueRot=meanHue(top)-meanHue(bot);
  while(hueRot>180)hueRot-=360; while(hueRot<-180)hueRot+=360;
  /* BANDING, TWO WAYS, AND ONLY ONE OF THEM IS JUDGED — see SKYPROPS for why bandWidth is not.
     bandWidth is terrainvalue.mjs's number: how many rows each 8-bit level holds. maxStep is the
     LARGEST single-row jump in the row median, in 8-bit levels, and that is what contouring
     actually looks like: a flat run, then a visible step. A photograph's grain changes level almost
     every row and steps by one; a quantised ramp holds and then jumps. */
  let changes=0;
  for(let i=1;i<rows.length;i++)
    if(Math.round(rows[i].med*255)!==Math.round(rows[i-1].med*255))changes++;
  /* maxStep IS MEASURED ONLY ACROSS ADJACENT ROWS OF THE FRAME, never across a gap. rows[] has
     already had its unusable rows dropped, so two entries can be forty rows apart in the picture
     and the difference between them is not a STEP, it is a gradient. The longest contiguous run is
     what gets measured, and if no run reaches 12 rows the property is refused rather than
     estimated: nz_carpark_01, whose clear sky comes in slivers between cumulus, has no such run
     and reported a 15-level step in a photograph before this was put right. */
  let maxStep=null, runBest=0;
  /* AND REFUSED OUTRIGHT WHERE THE SKY IS MOSTLY CLOUD. Contiguity is not enough: on
     nz_carpark_01 the clear sky between cumulus moves ACROSS the frame from row to row, so twelve
     adjacent rows can each hold 200 px of blue and each hold it somewhere else, and the row median
     jumps 13 to 17 levels with no contouring anywhere in the picture. Above a quarter cloud cover
     there is no vertical slice of sky to look for a step in, and the honest answer is that this
     photograph cannot say. */
  const heavy=cm&&cm.cover!==undefined&&cm.cover>0.25;
  { let run=[];
    const flush=()=>{ if(run.length>=12&&run.length>runBest){ runBest=run.length; let m=0;
        for(let i=1;i<run.length;i++){
          const d=Math.abs(Math.round(run[i].med*255)-Math.round(run[i-1].med*255));
          if(d>m)m=d; } maxStep=m; } run=[]; };
    for(const r of rows){ if(run.length&&r.y!==run[run.length-1].y+1)flush(); run.push(r); }
    flush(); }
  if(heavy)maxStep=null;
  const levels=Math.abs(Math.round(rows[rows.length-1].med*255)-Math.round(rows[0].med*255));
  const tL=mean(top,'luma'), hL=mean(bot,'luma'), tS=mean(top,'sat'), hS=mean(bot,'sat');
  /* THE RATIOS ARE THE JUDGED FORM, AND THE ABSOLUTES ARE NOT. Two photographs of the same sky at
     different exposures disagree about its luma and agree about its SHAPE, and these three do
     exactly that: the top of the visible sky reads 0.637, 0.653 and 0.428, so a band from the
     absolutes spans 0.35 to 0.80 and passes almost anything. Divide the horizon end by the zenith
     end and the same three plates land on 1.046, 1.179 and 1.100 — they agree, because how much a
     sky pales toward the horizon is a property of the ATMOSPHERE and not of the shutter speed.
     Same for saturation: absolutes 0.48 / 0.41 / 0.58, ratios 0.52 / 0.71 / 0.98.
     The absolutes stay in the table as context, because "our sky's zenith reads 0.95" would be
     worth knowing even though it cannot be judged against a photograph's exposure. */
  return {topLuma:tL, horizLuma:hL, topSat:tS, horizSat:hS,
          lumaRatio:tL>1e-4?hL/tL:null, satRatio:tS>1e-4?hS/tS:null,
          hueRot, maxStep, runBest,
          bandWidth:changes?rows.length/changes:rows.length, levels, rows:rows.length, dec};
}

/* 5. AERIAL PERSPECTIVE — the saturation DROP from the top of the visible sky to the horizon,
      signed, positive when the sky pales downward as a real one does. A difference of the two
      absolutes above rather than a fitted slope, for the reason given there, and the two ends stay
      judged separately as well: a sky can get this difference right by being wrong at both ends,
      and the table should not let it.
      Measured on all three plates and every one of them desaturates toward the horizon, which is
      what makes this a test rather than a preference.
      The other half of SKY.md 3.5 — whether the sky's own haze band agrees with the range's
      TERRAIN.haze — is a comparison of two authored constants, not of pixels, and is reported
      under the table where a constant belongs. */
export function aerialPersp(im,L,keep,cm){
  const g=skyGradient(im,L,keep,cm);
  if(g.topSat===null||g.topSat===undefined)return {value:null,note:g.note};
  return {value:g.topSat-g.horizSat, topSat:g.topSat, horizSat:g.horizSat};
}

/* THE SKY'S OWN COLOUR, clear of cloud, so the tone can be chased without the cloud cover of the
   day moving it. Same three numbers the terrain table carries, same reasons. */
export function skyColour(im,keep,cm){
  const {w,h}=im; let n=0,l=0,s=0,hx=0,hy=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const i=y*w+x;
    if(keep&&!keep[i])continue; if(cm&&cm.mask&&cm.mask[i])continue;
    const p=i*3, r=im.buf[p]/255,g=im.buf[p+1]/255,b=im.buf[p+2]/255;
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
    n++; l+=0.2126*r+0.7152*g+0.0722*b; s+=mx>0?(mx-mn)/mx:0;
    let hh=0; if(mx!==mn){ const dd=mx-mn;
      hh=mx===r?60*(((g-b)/dd)%6):mx===g?60*((b-r)/dd+2):60*((r-g)/dd+4); if(hh<0)hh+=360; }
    hx+=Math.cos(hh*Math.PI/180); hy+=Math.sin(hh*Math.PI/180); }
  if(!n)return {luma:null,sat:null,hue:null,px:0};
  let hue=Math.atan2(hy/n,hx/n)*180/Math.PI; if(hue<0)hue+=360;
  return {luma:l/n, sat:s/n, hue, px:n};
}

export const SKYPROPS=['cloudShape','underside','cloudFlat',
                       'lumaRatio','satRatio','maxStep',
                       'skyLuma','skyHue','skySat'];
/* cloudFlat IS BANDED FROM ONE PLATE ONLY, AND NOT BY THE "EITHER PLATE" RULE.
   nz_alps_02 is the plate that shows the form being asked for. nz_carpark_01 has cloud too, and
   towering cumulus is a DIFFERENT form: it measures 1.982 where the deck measures 2.708, and the
   game's spheres measure 2.060. Offering both bands under "in band if EITHER" would hand the
   current sky a pass on the plate whose form nobody asked for, which is the loophole this file
   already refuses twice over (cloud cover, and nz_alps_02's own luma for tone). One plate, named,
   with the reason — and it makes the row harder rather than easier. */
export const SKYFORMPROPS=['cloudFlat'];
/* CLOUD VERTICAL EXTENT IS WITHDRAWN FROM THE JUDGED SET, and the direction of that change is
   the part worth stating: the game PASSES it (0.920, against a band of 0.819 to 1.179) and it is
   being withdrawn anyway, because it cannot mean what it is named and because it was blocking a
   property the game FAILS. Withdrawing a green row that stands in the way of a red one makes this
   table harder, not easier.
   WHY IT CANNOT MEAN WHAT IT IS NAMED. The only plate with cloud in its sky crop is nz_carpark_01,
   and its cloud bank is LARGER THAN THE CROP IN BOTH DIRECTIONS — one blob, bounding box 1440x276
   in a 1440x276 image. So "the mask's vertical extent as a fraction of the sky band" measures 1.0
   for that plate no matter what shape its clouds are, and any band derived from it says only "your
   cloud must reach from the top of the visible sky to the bottom of it". That is cloud COVER,
   which is already excluded from judging for precisely this reason, wearing the name of cloud FORM.
   Bounding-box aspect ratio was tried as a replacement and is crop-limited in the same way (the
   plate's blob measures 276/1440 = 0.19 because the crop is 276 tall, not because its clouds are).
   AND IT WAS IN DIRECT CONFLICT WITH UNDERSIDE SHADING. A cloud that fills the visible sky top to
   bottom has neither a visible top nor a visible base, so the property that measures the
   difference between them has nothing to measure — the game's two cloud blobs both ran off the top
   AND bottom of the band, and the larger of the two scored -0.035 for that reason while its
   unclipped neighbour scored +0.134, comfortably in band. Satisfying one of these two rows made
   the other unmeasurable.
   SO VERTICAL BUILD GOES WHERE IT CAN ACTUALLY BE JUDGED: the number is still printed below the
   table, and SKY.md 4 already holds cloud form's unmeasurable half as a taste call beside cloud
   variety. A flat cloud is obvious in the strip; that is what the strip is for.

   CLOUD COVER IS REPORTED AND NOT JUDGED, and that is a decision with a reason. Cover is the
   WEATHER of the afternoon the photograph was taken: nz_carpark_01 is most of a cumulus bank,
   nz_tussock_03 has a few small clouds at the ridge, nz_alps_01 is nearly clear. Their bands do
   not overlap and never could, so under "in band if EITHER plate" a cover band accepts everything
   from empty to overcast — a row that is always green is not a test. Form and shading are about
   what a cloud IS and they are judged; how many there are is Eric's, and SKY.md 4 already holds it
   as a taste call (cloud VARIETY, counted in recipes). */
/* HUE ROTATION IS REPORTED AND NOT JUDGED, AND THAT CONTRADICTS THE BRIEF, which says the plates'
   hue "ROTATES with height, not just their luma". Measured across each plate's own sky crop it
   does no such thing: nz_carpark_01 turns -1.9 degrees, nz_tussock_03 turns 0.0, nz_alps_01 turns
   +2.4. They do not even agree on the SIGN, and a band from them spans -6.3 to +4.4 degrees, which
   is a row that passes anything. What the plates do instead is DESATURATE toward the horizon while
   holding their hue — which is the aerial-perspective row, and that one they agree on. The number
   is still printed, because "our sky's hue turns 40 degrees" would be worth knowing.
   BANDWIDTH IS REPORTED AND NOT JUDGED for a related reason: it conflates a smooth ramp with no
   ramp at all. nz_alps_01, a photograph with no banding in it anywhere, holds each 8-bit level for
   17.4 rows simply because its gradient is shallow, while nz_carpark_01 holds one for 2.7. A band
   spanning those accepts every sky ever rendered. maxStep is the judged form of the same question
   and the two clear-sky plates agree on it exactly: 1 level, all four tiles, both plates. */
export const SKYCONTEXT=['cloudCover','cloudVext','cloudBlobs','skyTopLuma','skyHorizLuma',
                         'skyTopSat','skyHorizSat','aerial','hueRot','bandWidth','levels','skyPx'];

export function skyMeasureAll(im,inSky){
  const {w,h}=im; const L=lumPlane(im);
  let keep=null;
  if(inSky){ keep=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)keep[y*w+x]=inSky(px(im,x,y),x,y)?1:0; }
  const cm=cloudMask(im,keep);
  const cf=cloudForm(im,cm), us=undersideShading(im,L,cm);
  const gr=skyGradient(im,L,keep,cm), ap=aerialPersp(im,L,keep,cm), sc=skyColour(im,keep,cm);
  const fl=cloudFlat(im,L,keep,cm);
  let skyPx=0; if(keep){for(let i=0;i<keep.length;i++)if(keep[i])skyPx++;} else skyPx=w*h;
  return { cloudShape:cf.shape, cloudVext:cf.vext, underside:us.value, cloudFlat:fl.value,
           lumaRatio:gr.lumaRatio, satRatio:gr.satRatio, maxStep:gr.maxStep,
           skyTopLuma:gr.topLuma, skyHorizLuma:gr.horizLuma,
           skyTopSat:gr.topSat,   skyHorizSat:gr.horizSat, aerial:ap.value,
           skyLuma:sc.luma, skyHue:sc.hue, skySat:sc.sat,
           cloudCover:cf.cover, cloudBlobs:cf.blobs, hueRot:gr.hueRot,
           bandWidth:gr.bandWidth, levels:gr.levels, skyPx,
           _extra:{cm:{thr:cm.thr,cover:cm.cover,note:cm.note,hist:cm.hist,
                       meanCloudSat:cm.meanCloudSat,meanSkySat:cm.meanSkySat},
                   cf,us,gr,ap,sc,fl} };
}

/* THE SKY'S BAND COMES FROM ITS PLATE'S OWN FOUR TILES, exactly as the terrain's does, and the
   tiles are VERTICAL SLICES for the opposite reason. A mountain photograph varies left-to-right,
   so vertical slices sampled the variation that existed. A sky varies TOP-TO-BOTTOM — that is
   three of these ten properties — so a horizontal slice would destroy the very quantity being
   measured, and a vertical slice keeps the full height of the band in every tile. Same shape of
   answer, arrived at from the other direction. */
const SKYHUETOL=25;   // degrees. Tighter than the terrain's 30: these three skies agree to 6.
export function skyPlateBand(im,inSky){
  const tiles=[]; const tw=Math.floor(im.w/4);
  for(let t=0;t<4;t++){
    const sub={w:tw,h:im.h,buf:Buffer.alloc(tw*im.h*3)};
    for(let y=0;y<im.h;y++)for(let x=0;x<tw;x++){
      const p=px(im,t*tw+x,y), i=(y*tw+x)*3;
      sub.buf[i]=p[0]; sub.buf[i+1]=p[1]; sub.buf[i+2]=p[2]; }
    tiles.push(skyMeasureAll(sub,inSky));
  }
  const whole=skyMeasureAll(im,inSky);
  const band={};
  for(const k of SKYPROPS){
    const vs=tiles.map(t=>t[k]).filter(v=>v!==null&&isFinite(v));
    if(!vs.length||whole[k]===null||!isFinite(whole[k])){ band[k]=null; continue; }
    const c=whole[k];
    if(k==='skyHue'){ band[k]={lo:c-SKYHUETOL,hi:c+SKYHUETOL,plate:c,tiles:vs,fixed:true}; continue; }
    let lo=Math.min(...vs), hi=Math.max(...vs);
    /* THE +/-18% FLOOR IS ON THE ABSOLUTE VALUE, and for the SIGNED properties — luma slope, hue
       rotation, underside shading — that floor is nearly nothing when the plate's own value is
       near zero. So signed properties also get an absolute floor, stated per property, which is
       the smallest difference that is visible in the picture at all. Without it, a plate whose hue
       barely rotates would hand out a band of +/-0.2 degrees and every future sky would fail a row
       that means nothing. */
    const FLOOR={underside:0.01, maxStep:0.5};
    const pad=Math.max(Math.abs(c)*MINREL, FLOOR[k]||0);
    lo=Math.min(lo,c-pad); hi=Math.max(hi,c+pad);
    band[k]={lo,hi,plate:c,tiles:vs};
  }
  return {band,whole,tiles};
}


/* ---------- shooting the sky ---------- */
/* THREE FRAMES, AND THE THIRD ONE POINTS SOMEWHERE ELSE ENTIRELY.
   ship  — the shipped sky at the strip vantage, HUD hidden. What gets scored.
   flag  — the same frame with the dome and its haze band painted magenta and the clouds and sun
           sprite hidden, so the magenta pixels are EXACTLY where sky is visible. The terrain
           pass's flag trick, pointed the other way; see SKYFLAG in stripcam.mjs.
   sun   — a fourth wall. The sun is 53 degrees off the strip camera's axis (its half-angles are
           35.6 horizontal and 13.0 vertical), so THE SUN IS NOT IN THE STRIP and no amount of
           measuring the strip will say anything about the disc. Computed, not discovered by
           screenshotting and squinting: the sprite sits at normalize(SKY.sunPosDay)*168, the
           camera at (0,9,-46) looking at (0,26,160), and the dot of those two directions is 0.598.
           So the sun gets its own frame with the camera turned to face it. */
async function shootSky(){
  const {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED}=await import('./webrig.mjs');
  ensureBuild(); const srv=await serve();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const out={};
  for(const name of ['ship','flag','sun']){
    const browser=await launch(); const page=await browser.newPage();
    await page.setViewport({width:SW,height:SH});
    await preparePage(page,{seed:GAUNTLETSEED,biome:'carpark'});
    await page.goto(srv.origin+'/',{waitUntil:'load'});
    await assertBooted(page);
    await page.evaluate('window.AudioContext=undefined;KEAGAME.startGame(1);');
    await sleep(900);
    await page.evaluate(QUIET); await page.evaluate(CAM); await page.evaluate(SKYQUIET);
    if(name==='sun'){
      /* AIMED BY ARITHMETIC. camLock takes a look-at point, so the point is the sprite's own
         position — which after SKY.md step 0 is derived from the light, so this frame is aimed at
         the light too and any disagreement between them shows up as an off-centre disc. */
      await page.evaluate(`(()=>{ const G=KEAGAME.G, P=G.sunSpritePos;
        G.camLock={x:0,y:9,z:-46,lx:P[0],ly:P[1],lz:P[2]}; })();`);
    }
    if(name==='flag') await page.evaluate(SKYFLAG);
    if(name==='sun'){ const st=await page.evaluate(
      '(()=>({p:KEAGAME.G.sunSpritePos,vis:!!(KEAGAME.G.sunSprite&&KEAGAME.G.sunSprite.visible)}))()');
      out.sunState=st; }
    await sleep(1300);
    const f=path.join(OUT,'SKYSCORE_'+name+'.png');
    await page.screenshot({path:f}); await browser.close();
    out[name]=f;
  }
  await srv.close();
  return out;
}

/* THE GAME'S SKY BAND IS READ OFF ITS OWN FLAG FRAME EVERY RUN, and the constant in stripcam.mjs
   is only ever checked against it. Per column, the topmost row the flag frame did NOT paint
   magenta — that is where the sky ends going down — and the band reaches the MEDIAN of those, with
   the exact magenta mask doing the rest. Not the minimum, which is what the plates use: a plate's
   crop has to be pure because a photograph has no mask, and the game has one, so a generous band
   plus an exact mask measures more of the real sky rather than less. */
const isMag=p=>p[0]>110&&p[2]>110&&p[1]<70&&Math.abs(p[0]-p[2])<90;
export function gameSkyBand(maskFrame){
  const im=loadRGB(maskFrame);
  const ends=[];
  for(let x=0;x<im.w;x++){ let y=0; while(y<im.h&&isMag(px(im,x,y)))y++; ends.push(y/im.h); }
  const s=ends.slice().sort((a,b)=>a-b);
  const q=t=>s[Math.min(s.length-1,Math.floor(s.length*t))];
  return {band:[0,+q(0.50).toFixed(3)], min:q(0), p10:q(0.10), p50:q(0.50), p90:q(0.90),
          allSky:s[s.length-1]>=0.999};
}

/* THE SUN DISC — measured, and NOT scored against a plate, because no plate in the set has the sun
   in it. nz_carpark_01 and nz_tussock_03 are both shot with the sun behind the camera and
   nz_alps_01 is a side-lit massif. Inventing a band for it would be inventing the reference.
   What IS checkable: the disc's angular offset from where the LIGHT is (SKY.md 1.1's defect, now
   asserted headless at 0.000 degrees), how big it renders, and how much of its core is clipped to
   white — which is lum.mjs's question and the one that decides whether it reads as a sun or as a
   blown-out patch. */
export function sunDisc(frame,expect){
  const im=loadRGB(frame); const {w,h}=im;
  let n=0,cx=0,cy=0,clip=0,peak=0;
  const L=lumPlane(im);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x; if(L[i]<0.90)continue;
    n++; cx+=x; cy+=y; if(L[i]>peak)peak=L[i];
    const p=i*3; if(im.buf[p]>=254&&im.buf[p+1]>=254&&im.buf[p+2]>=254)clip++;
  }
  if(!n)return {found:false,note:'no pixel above luma 0.90 — no disc in this frame'};
  cx/=n; cy/=n;
  /* THE OFFSET IS IN DEGREES, THROUGH THE ACTUAL PROJECTION, not in pixels. The frame is 1920x620
     at a 26-degree VERTICAL fov, so a pixel is 26/620 degrees vertically and the horizontal scale
     follows from the aspect — computing it the other way round is the mistake this session already
     made once, reporting azimuths off the vertical fov. */
  const degPerPx=26/h;
  const dx=(cx-w/2)*degPerPx, dy=(cy-h/2)*degPerPx;
  return {found:true, px:n, frac:n/(w*h), cx, cy, offsetDeg:Math.hypot(dx,dy),
          offX:dx, offY:dy, radiusPx:Math.sqrt(n/Math.PI), clipped:clip/n, peak, expect};
}

export async function skyScore({frames=null}={}){
  const s=frames||await shootSky();
  const gb=gameSkyBand(s.flag);
  const band=process.env.SKYBAND?JSON.parse(process.env.SKYBAND):gb.band;
  const game=bandNorm(s.ship,band[0],band[1],NORMW);
  const mim=bandNorm(s.flag,band[0],band[1],NORMW);
  const inSky=(p,x,y)=>isMag(px(mim,x,y));
  const g=skyMeasureAll(game,inSky);

  const plates={};
  for(const n of Object.keys(SKYBANDS)){
    const im=bandNorm(path.join(BOARD,n+'.jpg'),SKYBANDS[n][0],SKYBANDS[n][1],NORMW);
    plates[n]=skyPlateBand(im,SKYPLATES[n].test||null);
  }
  /* THE BOW SKY, AS ONE ROW OF NUMBERS AND NOT AS A BAND — see BOWSKY in stripcam.mjs. */
  let bow=null;
  { const im=bandNorm(path.join(BOARD,BOWSKY.plate+'.jpg'),BOWSKY.band[0],BOWSKY.band[1],NORMW);
    const {w,h}=im; const keep=new Uint8Array(w*h); let n=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){ if(BOWSKY.test(px(im,x,y))){keep[y*w+x]=1;n++;} }
    if(n>2000)bow={...skyColour(im,keep,null),px:n};
    else bow={note:'only '+n+' px of sky survive the mask'}; }

  /* THE FORM PLATE, banded on its own — see SKYFORMPROPS. */
  const formIm=bandNorm(path.join(BOARD,SKYFORM.plate+'.jpg'),SKYFORM.band[0],SKYFORM.band[1],NORMW);
  const form=skyPlateBand(formIm,null);

  const rows=[]; let inCount=0, judged=0;
  for(const k of SKYPROPS){
    const gv=g[k];
    const src=SKYFORMPROPS.includes(k)?{[SKYFORM.plate]:form}:plates;
    const cells=Object.keys(src).map(n=>{
      const b=src[n].band[k];
      if(b===null||gv===null||gv===undefined||!isFinite(gv))return {n,b,ok:null};
      return {n,b,ok:gv>=b.lo&&gv<=b.hi};
    });
    const any=cells.some(c=>c.ok===true), none=cells.every(c=>c.ok===null);
    if(!none){ judged++; if(any)inCount++; }
    rows.push({k,gv,cells,ok:none?null:any});
  }
  const sun=sunDisc(s.sun,s.sunState);
  return {game:g,plates,form,rows,inCount,judged,bow,sun,frames:s,band,gb};
}

const SKYFMT={cloudShape:v=>v.toFixed(2), cloudVext:v=>v.toFixed(3), underside:v=>v.toFixed(3),
  cloudFlat:v=>v.toFixed(3),
  lumaRatio:v=>v.toFixed(3), satRatio:v=>v.toFixed(3), maxStep:v=>v.toFixed(1),
  skyLuma:v=>v.toFixed(3), skyHue:v=>v.toFixed(0), skySat:v=>v.toFixed(3)};
const SKYLABEL={cloudShape:'cloud form (perim/sqrt area)', cloudVext:'cloud vertical extent',
  underside:'underside shading (top-belly)', cloudFlat:'cloud flatness (layered vs round)',
  lumaRatio:'gradient (horizon/zenith luma)',
  satRatio:'aerial perspective (sat ratio)', maxStep:'banding (max 8-bit step)',
  skyLuma:'sky luma', skyHue:'sky hue', skySat:'sky saturation'};

export function skyTable(res){
  const names=Object.keys(res.plates);
  const L=[];
  L.push('  property                          game     '+
    names.map(n=>(n.replace('nz_','')+' band').padEnd(24)).join('')+'verdict');
  for(const r of res.rows){
    const f=SKYFMT[r.k]||(v=>String(v));
    const cell=c=>c.b===null?'         —              ':
      (('['+f(c.b.lo)+' … '+f(c.b.hi)+']').padEnd(24));
    /* A FORM-PLATE ROW SAYS SO, because its band comes from a plate that is not in the sky set and
       a reader who did not know that would think the other columns had simply gone missing. */
    const isForm=SKYFORMPROPS.includes(r.k);
    L.push('  '+SKYLABEL[r.k].padEnd(32)+
      (r.gv===null||r.gv===undefined?'—':f(r.gv)).padEnd(9)+
      (isForm?(cell(r.cells[0])+'  <- '+SKYFORM.plate.replace('nz_','')+' only'+
               ' '.repeat(Math.max(0,24*(Object.keys(res.plates).length-1)-17-SKYFORM.plate.length))
              ):r.cells.map(cell).join(''))+
      (r.ok===null?'not judged':(r.ok?'IN BAND':'OUT'))+
      (r.ok===false?'  ('+r.cells.filter(c=>c.b).map(c=>
        (r.gv<c.b.lo?'below ':'above ')+c.n.replace('nz_','')).join(', ')+')':''));
  }
  L.push('');
  L.push('  '+res.inCount+' of '+res.judged+' properties in band (a property counts as in band if '+
    'it lands inside ANY plate that carries it)');
  return L.join('\n');
}

export function skyCompose(frames,band){
  const outs=[];
  const gtmp='/tmp/sky_compose_game.png';
  execSync(`ffmpeg -v error -y -i "${frames.ship}" -vf `+
    `"format=rgb24,crop=iw:${Math.max(2,Math.round(SH*(band[1]-band[0])))}:0:`+
    `${Math.round(SH*band[0])},scale=${NORMW}:-2" "${gtmp}"`);
  for(const n of Object.keys(SKYBANDS)){
    const src=path.join(BOARD,n+'.jpg'), ptmp='/tmp/sky_compose_'+n+'.png';
    const d=execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height `+
      `-of csv=p=0 "${src}"`,{encoding:'utf8'}).trim().split(',').map(Number);
    execSync(`ffmpeg -v error -y -i "${src}" -vf `+
      `"format=rgb24,crop=${d[0]}:${Math.round(d[1]*(SKYBANDS[n][1]-SKYBANDS[n][0]))}:0:`+
      `${Math.round(d[1]*SKYBANDS[n][0])},scale=${NORMW}:-2" "${ptmp}"`);
    const out=path.join(OUT,'SKYSCORE_vs_'+n.replace('nz_','')+'.png');
    execSync(`ffmpeg -v error -y -i "${ptmp}" -i "${gtmp}" -filter_complex `+
      `"[0:v]pad=${NORMW}:ih+3:0:0:color=0x202020[a];[a][1:v]vstack=inputs=2,format=rgb24" "${out}"`);
    outs.push(out);
  }
  return outs;
}

/* ---------- CLI ---------- */
/* RUN ONLY WHEN RUN, not when imported — the selftest imports every function above. argv[1] can
   be undefined (node -e), so it is guarded rather than assumed.
   AT THE END OF THE FILE, and that is load-bearing rather than tidy: a module's top level runs in
   source order, and while `function` declarations hoist, `const` bands and thresholds do not. With
   this block in the middle the sky path would have run before CLOUDSAT existed. */
const _argv1=process.argv[1]||'';
if(_argv1.endsWith('platescore.mjs')&&process.env.MODE!=='sky'){
  const res=await score({recipe:process.env.RECIPE||'c',
                         frame:process.env.FRAME||null, mask:process.env.MASK||null});
  if(process.env.JSON){ console.log(JSON.stringify({inCount:res.inCount,judged:res.judged,
      game:Object.fromEntries(PROPS.map(k=>[k,res.game[k]])),
      rows:res.rows.map(r=>({k:r.k,gv:r.gv,ok:r.ok,
        bands:r.cells.map(c=>c.b?{n:c.n,lo:c.b.lo,hi:c.b.hi,plate:c.b.plate}:null)}))},null,1)); }
  else {
    if(process.env.COMPOSE)for(const f of compose(res.frame))console.log('  composite '+f);
    console.log('PLATESCORE — recipe '+res.recipe+' ('+RECIPENAME(res.recipe)+
      ') against nz_alps_01 and nz_alps_02');
    console.log('  band = the spread of the plate\'s own four vertical tiles, widened to at least '+
      '+/-'+(MINREL*100).toFixed(0)+'% of its mean\n');
    console.log(table(res));
    const s=res.game._extra.snow;
    console.log('');
    console.log('  snow mask covers '+(s.area*100).toFixed(1)+'% of the game band'+
      (s.shape?', perimeter/sqrt(area) '+s.shape.toFixed(1):'')+
      (s.value===null?'   — '+s.note:''));
  }
  process.exit(res.inCount===res.judged?0:1);
}

/* MODE=sky node gauntlet/verify/platescore.mjs            shoot, score the sky, print the table
   MODE=sky COMPOSE=1 ...                                  and write the composites
   MODE=sky JSON=1 ...                                     machine-readable, for the iteration loop
   MODE=sky SHIP=a.png FLAG=b.png SUN=c.png ...            score frames already on disk
   MODE=sky SKYBAND='[0,0.4]' ...                          override the derived band */
if(_argv1.endsWith('platescore.mjs')&&process.env.MODE==='sky'){
  const pre=process.env.SHIP?{ship:process.env.SHIP,flag:process.env.FLAG,sun:process.env.SUN}:null;
  const res=await skyScore({frames:pre});
  if(process.env.JSON){ console.log(JSON.stringify({inCount:res.inCount,judged:res.judged,
      band:res.band,
      game:Object.fromEntries(SKYPROPS.concat(SKYCONTEXT).map(k=>[k,res.game[k]])),
      sun:res.sun,
      rows:res.rows.map(r=>({k:r.k,gv:r.gv,ok:r.ok,
        bands:r.cells.map(c=>c.b?{n:c.n,lo:c.b.lo,hi:c.b.hi,plate:c.b.plate}:null)}))},null,1)); }
  else {
    if(process.env.COMPOSE)for(const f of skyCompose(res.frames,res.band))
      console.log('  composite '+f);
    console.log('PLATESCORE / SKY — the strip vantage against '+
      Object.keys(res.plates).map(n=>n.replace('nz_','')).join(', '));
    console.log('  band = the spread of the plate\'s own four VERTICAL tiles, widened to at least '+
      '+/-'+(MINREL*100).toFixed(0)+'% of its mean. A vertical tile keeps the full height of the '+
      'band,\n  which for a sky is the axis every gradient lives on.');
    console.log('  the game\'s sky band is read off its own flag frame: sky ends at row '+
      (res.gb.p50*100).toFixed(1)+'% of the frame in the median column ('+
      (res.gb.min*100).toFixed(1)+'% at the highest peak, '+(res.gb.p90*100).toFixed(1)+
      '% at the lowest gap)'+
      (Math.abs(res.band[1]-SKYGAMEBAND[1])>0.02?
        '\n  ** SKYGAMEBAND says '+SKYGAMEBAND[1]+' and the picture says '+res.band[1]+
        ' — the constant has drifted from the world':''));
    console.log('');
    console.log(skyTable(res));
    const e=res.game._extra;
    console.log('');
    console.log('  CLOUD MASK   saturation < '+CLOUDSAT+'   cover '+
      (e.cm.cover*100).toFixed(1)+'%   '+res.game.cloudBlobs+' blob(s)   '+
      'mean sat: cloud '+(e.cm.meanCloudSat===null?'—':e.cm.meanCloudSat.toFixed(3))+
      ', clear sky '+(e.cm.meanSkySat===null?'—':e.cm.meanSkySat.toFixed(3))+
      (e.cm.note?'\n               ** '+e.cm.note:''));
    console.log('               saturation histogram, tenths: '+e.cm.hist.join(' '));
    console.log('  CONTEXT, reported and not judged — see SKYCONTEXT for why each one is here');
    for(const k of SKYCONTEXT){ const v=res.game[k];
      console.log('    '+k.padEnd(14)+(v===null||v===undefined?'—':(+v).toFixed(3))); }
    console.log('  THE BOW SKY (ref_bow_20, tone only, not a band):  '+
      (res.bow.note?res.bow.note:'luma '+res.bow.luma.toFixed(3)+'   hue '+
        res.bow.hue.toFixed(0)+'   sat '+res.bow.sat.toFixed(3)+'   ('+res.bow.px+' px)'));
    const sn=res.sun;
    console.log('  THE SUN DISC (its own frame, aimed at G.sunSpritePos; no plate carries the sun)');
    console.log('    '+(sn.found
      ? sn.px+' px above luma 0.90, radius '+sn.radiusPx.toFixed(1)+' px, '+
        (sn.clipped*100).toFixed(1)+'% of it clipped to white, peak luma '+sn.peak.toFixed(3)+
        '\n    centroid '+sn.offsetDeg.toFixed(2)+' degrees off the frame centre'+
        ' (x '+sn.offX.toFixed(2)+', y '+sn.offY.toFixed(2)+')'
      : sn.note));
  }
  process.exit(res.inCount===res.judged?0:1);
}
