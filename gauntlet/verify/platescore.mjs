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

/* ---------- CLI ---------- */
/* RUN ONLY WHEN RUN, not when imported — the selftest imports every function above. argv[1] can
   be undefined (node -e), so it is guarded rather than assumed. */
const _argv1=process.argv[1]||'';
if(_argv1.endsWith('platescore.mjs')){
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
