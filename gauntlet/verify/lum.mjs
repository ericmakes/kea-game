// LUMINANCE — how bright is this region, and is any of it CLIPPED?
// Usage: node gauntlet/verify/lum.mjs <png> [more.png ...]
//   env: X0,Y0,X1,Y1   the box to measure, in pixels (default: the whole frame minus HUD strips)
//        CLIP          the sRGB level at or above which a pixel counts as blown (default 250)
//        FAILCLIP      clipped fraction above which to exit 1, in percent (default off)
//        FAILMEAN      mean luma above which to exit 1, 0..1 (default off)
//        JSON=1        one line of JSON per file instead of the table
// Its contract test is gauntlet/verify/lum-selftest.mjs. Run that whenever this file changes.
//
// WHY THIS EXISTS. Eric's river audit: "38 currently blows out across a third of the frame — assert
// a luminance clamp on that vantage", and separately "is the blowout the water material or the sun
// angle at that vantage? One reshoot at a different time-of-day settles it." Both of those are
// questions about the DISTRIBUTION OF BRIGHTNESS in a region of a photograph, and nothing in this
// directory could answer either. diff, boxdiff and stability are all SSIM, which is a SIMILARITY
// measure: it compares two frames and is blind to the absolute level of both. edgefind measures how
// findable a LINE is. pxdiff counts pixels that MOVED. A frame can be uniformly, catastrophically
// blown out and every one of them will call it clean, because it is clean — compared to the
// equally blown baseline it is being held against.
//
// SO IT MEASURES ONE FRAME AGAINST A NUMBER, not against another frame. That makes it the first
// instrument here that can carry a LOOK BUDGET: "no more than 2% of the water may be clipped" is a
// claim about the world, it survives a re-pin, and it goes red when a material or a light changes
// in a way a photograph-to-photograph comparison would happily certify.
//
// IT MEASURES ENCODED sRGB, DELIBERATELY, not linear light. Blowout is a perceptual complaint about
// a picture — detail the eye cannot recover because the file has run out of headroom — and the
// place headroom runs out is the 8-bit encoded value. Rec.709 coefficients on the sRGB values give
// the luma a viewer sees. Converting to linear first would report a much lower "mean" and would make
// the clip test meaningless, since clipping IS an encoding phenomenon.
//
// THE HUD IS EXCLUDED BY DEFAULT, and it has to be. Every capture carries CHAOS at the top and the
// hint bar at the bottom, both of them near-white text on dark pills, and both would land in a clip
// count as blown pixels that have nothing to do with the world. Same strips edgefind uses.
import {execSync} from 'child_process'; import fs from 'fs';

const CLIP=+(process.env.CLIP||250);
const FAILCLIP=process.env.FAILCLIP===undefined?null:+process.env.FAILCLIP;
const FAILMEAN=process.env.FAILMEAN===undefined?null:+process.env.FAILMEAN;
const HUDTOP=44, HUDBOT=44;                        // the same strips edgefind skips

export function frameSize(png){
  const o=execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height `+
    `-of csv=p=0 "${png}"`,{encoding:'utf8'}).trim().split(',');
  return {w:+o[0], h:+o[1]};
}

/* lumStats(png, box) -> {w,h,n,mean,meanR,meanG,meanB,clip,clipPct,p99,max,min,sat,hue}
   box is {x0,y0,x1,y1} in pixels; omitted edges default to the frame minus the HUD strips. */
export function lumStats(png, box){
  const S=frameSize(png), b=box||{};
  const x0=Math.max(0,b.x0===undefined?0:b.x0), y0=Math.max(0,b.y0===undefined?HUDTOP:b.y0);
  const x1=Math.min(S.w,b.x1===undefined?S.w:b.x1), y1=Math.min(S.h,b.y1===undefined?S.h-HUDBOT:b.y1);
  const w=x1-x0, h=y1-y0;
  if(w<=0||h<=0)throw new Error('lum: empty box '+JSON.stringify({x0,y0,x1,y1})+' in '+S.w+'x'+S.h);
  const raw=execSync(`ffmpeg -v error -i "${png}" -vf "crop=${w}:${h}:${x0}:${y0},format=rgb24" `+
    `-f rawvideo -`,{maxBuffer:1<<28,encoding:'buffer'});
  const n=w*h;
  if(raw.length<n*3)throw new Error('lum: short decode, got '+raw.length+' want '+n*3);
  let sR=0,sG=0,sB=0,sY=0,clip=0,max=0,min=255;
  const hist=new Uint32Array(256);
  for(let i=0;i<n;i++){
    const r=raw[i*3], g=raw[i*3+1], bl=raw[i*3+2];
    sR+=r; sG+=g; sB+=bl;
    /* Rec.709 luma on the ENCODED values — see the header. */
    const y=0.2126*r+0.7152*g+0.0722*bl;
    sY+=y; hist[Math.min(255,Math.round(y))]++;
    if(y>max)max=y; if(y<min)min=y;
    if(r>=CLIP&&g>=CLIP&&bl>=CLIP)clip++;          // WHITE clipping: all three channels out of room
  }
  let acc=0, p99=255;
  for(let v=0;v<256;v++){ acc+=hist[v]; if(acc>=n*0.99){ p99=v; break; } }
  const mR=sR/n, mG=sG/n, mB=sB/n;
  const mx=Math.max(mR,mG,mB), mn=Math.min(mR,mG,mB);
  /* HUE AND SATURATION OF THE MEAN COLOUR, which is how a water material gets judged against a
     plate: "milky turquoise" is a hue and a saturation, and both are checkable. */
  let hue=0;
  if(mx>mn){ const d=mx-mn;
    if(mx===mR)hue=60*(((mG-mB)/d)%6); else if(mx===mG)hue=60*((mB-mR)/d+2); else hue=60*((mR-mG)/d+4); }
  if(hue<0)hue+=360;
  return {box:{x0,y0,x1,y1}, w, h, n, mean:sY/n/255, meanR:mR, meanG:mG, meanB:mB,
          clip, clipPct:clip/n*100, p99, max, min, sat:mx>0?(mx-mn)/mx:0, hue};
}

/* ---- THE LOOK BUDGETS. `node lum.mjs --budgets` checks every one against gauntlet/capture ----

   THIS IS WHAT ERIC ASKED FOR: "assert a luminance clamp on that vantage". A clamp is only an
   assertion if something runs it, and it has to live somewhere that a re-pin cannot silently move —
   which is why it is a NUMBER here and not a comparison against a baseline frame. Re-pin the world
   and diff.mjs starts agreeing with whatever the world now looks like; this file keeps disagreeing.

   Run it after a capture pass, beside diff.mjs and pxdiff.mjs.
   A budget names the box, the ceiling, and WHAT IT IS PROTECTING — because a bare number in a table
   is the thing that gets nudged when it goes red. */
export const BUDGETS={
  '37_river_bridge':{ box:{x0:0,y0:300,x1:960,y1:492}, clipPct:0.5, mean:0.82, satMax:0.40,
    what:'the braid, lower half. Glacial water must not blow out: measured at 0.06% clipped '+
         'after the WATER material landed, against 0.5% allowed.' },
  '38_river_floes':{ box:{x0:0,y0:245,x1:960,y1:492}, clipPct:0.5, mean:0.82, satMax:0.40,
    what:'the glacier lake. THIS IS THE FRAME ERIC FLAGGED — it shipped with a specular hot spot '+
         '15.53% clipped pure white inside the box, and 5.17% across the whole band. Roughness '+
         '0.72 took it to 0.00%. sunangle.mjs has the one-variable-at-a-time evidence.' },
};
/* WHY SATURATION IS BUDGETED HERE AND NOT IN THE BATTERY. The plates Eric named measure
   PHOTOGRAPHS — nz_river_01 at sat 0.20, nz_water_01 at 0.33 — and the comparable quantity in this
   game is a rendered frame, not a material's albedo. The render adds the sky's blue and the sun's
   warm and tone-maps the highlights toward white, which measured out at about half: albedo 0.42
   photographs at 0.22. A battery holding an albedo to a photograph's number is comparing two
   different things, so the albedo carries a ceiling there and the plate comparison lives here. */

function checkBudgets(dir){
  let bad=0, n=0;
  console.log('LOOK BUDGETS');
  for(const id of Object.keys(BUDGETS)){
    const B=BUDGETS[id], f=dir+'/'+id+'.png';
    if(!fs.existsSync(f)){ console.log('  - '+id+'  NOT SHOT — nothing to check'); continue; }
    const s=lumStats(f,B.box); n++;
    const overClip=B.clipPct!==undefined&&s.clipPct>B.clipPct;
    const overMean=B.mean!==undefined&&s.mean>B.mean;
    const overSat=B.satMax!==undefined&&s.sat>B.satMax;
    const okk=!overClip&&!overMean&&!overSat;
    console.log((okk?'  \x1b[32m✓\x1b[0m ':'  \x1b[31m✗\x1b[0m ')+id.padEnd(18)+
      'clip '+s.clipPct.toFixed(2)+'% of '+B.clipPct+'%   mean '+s.mean.toFixed(3)+
      ' of '+B.mean+'   hue '+Math.round(s.hue)+'  sat '+s.sat.toFixed(2)+
      (B.satMax!==undefined?' of '+B.satMax:''));
    if(!okk){ console.log('      '+B.what); bad++; }
  }
  console.log('LUM BUDGETS: '+n+' checked, '+bad+' over budget');
  return bad;
}

if(import.meta.url===new URL(process.argv[1],'file:').href||process.argv[1]&&
   import.meta.url.endsWith(process.argv[1].split('/').pop())){
  if(process.argv.includes('--budgets')){
    const dir=process.argv.find(a=>a.endsWith('/capture'))||'gauntlet/capture';
    process.exit(checkBudgets(dir)?1:0); }
  const box={};
  for(const k of ['x0','y0','x1','y1'])
    if(process.env[k.toUpperCase()]!==undefined)box[k]=+process.env[k.toUpperCase()];
  const files=process.argv.slice(2).filter(a=>a.endsWith('.png'));
  if(!files.length){ console.error('lum: name at least one png'); process.exit(2); }
  let bad=0;
  if(!process.env.JSON)
    console.log('  frame'.padEnd(30)+'  mean   p99  max   clip%   sat   hue   mean RGB');
  for(const f of files){
    if(!fs.existsSync(f)){ console.error('lum: no such file '+f); bad++; continue; }
    const s=lumStats(f,box);
    if(process.env.JSON){ console.log(JSON.stringify(Object.assign({file:f},s))); }
    else console.log('  '+f.split('/').pop().padEnd(28)+'  '+s.mean.toFixed(3)+'  '+
      String(s.p99).padStart(4)+'  '+String(Math.round(s.max)).padStart(3)+'  '+
      s.clipPct.toFixed(2).padStart(6)+'  '+s.sat.toFixed(2)+'  '+
      String(Math.round(s.hue)).padStart(4)+'   '+
      Math.round(s.meanR)+','+Math.round(s.meanG)+','+Math.round(s.meanB));
    if(FAILCLIP!==null&&s.clipPct>FAILCLIP){
      console.log('    ✗ '+s.clipPct.toFixed(2)+'% clipped, over the '+FAILCLIP+'% budget'); bad++; }
    if(FAILMEAN!==null&&s.mean>FAILMEAN){
      console.log('    ✗ mean luma '+s.mean.toFixed(3)+', over the '+FAILMEAN+' budget'); bad++; }
  }
  process.exit(bad&&(FAILCLIP!==null||FAILMEAN!==null||bad===files.length)?1:0);
}
