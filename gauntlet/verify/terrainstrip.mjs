/* THE SILHOUETTE STRIP — three noise recipes, in the game, beside the plates.
   Usage: node gauntlet/verify/terrainstrip.mjs   ->  gauntlet/capture/STRIP_*.png

   TERRAIN.md section 4: Eric picks a SILHOUETTE FAMILY, not a tint. Three things follow from that
   and this file exists to honour all three.

   1. THE MATERIAL IS HELD CONSTANT. Only KEATERRAIN's `recipe` changes between shots. If the
      material moved too, the choice on offer would be a tint again — which is precisely the mistake
      that got the cone direction rejected.
   2. IT IS WIDE. Silhouette is a property of the RANGE, not of a peak, so these are shot at 1920
      wide on a camera that looks along the skyline rather than at one massif. A 60-degree frame
      shows about a sixth of the range; that is not enough to judge a family by.
   3. IT SITS BESIDE THE PLATES. nz_alps_01 and nz_alps_02 are what Eric named, so each recipe is
      composited under both of them at matching width — the comparison he asked for, not a gallery
      of three frames he has to hold in his head.

   THE RECIPE COMES FROM KEATERRAIN AND NOT FROM AN EDIT, which is the difference between a strip
   Eric can reproduce and one he has to take my word for. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { execSync } from 'child_process';
import {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED} from './webrig.mjs';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/capture');
const BOARD=path.join(ROOT,'gauntlet/reference/board');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* THE CAMERA, THE STAGING AND THE BANDS ALL COME FROM stripcam.mjs, so the tool that shoots the
   strip and the tool that scores it cannot disagree about what the strip IS. They used to be
   copies. */
import {W, H as Hh, CAM, QUIET, BANDS, GAMEBAND, RECIPENAME} from './stripcam.mjs';

const RECIPES=['a','b','c'];
const srv=await(async()=>{ ensureBuild(); return serve(); })();
console.log('terrainstrip: serving '+srv.origin+'   '+W+'x'+Hh+', material held constant\n');
const shots=[];
for(const r of RECIPES){
  process.env.KEATERRAIN=JSON.stringify({recipe:r});
  const browser=await launch(); const page=await browser.newPage();
  await page.setViewport({width:W,height:Hh});
  await preparePage(page,{seed:GAUNTLETSEED,biome:'carpark'});
  await page.goto(srv.origin+'/',{waitUntil:'load'});
  await assertBooted(page);
  await page.evaluate('window.AudioContext=undefined;KEAGAME.startGame(1);');
  await sleep(900);
  await page.evaluate(QUIET); await page.evaluate(CAM);
  await sleep(1400);
  /* PROVE THE OVERRIDE LANDED. A strip whose variants are all the same frame is worse than no
     strip, and webrig's own comment records a KEAMATS pass that did exactly that. */
  const st=await page.evaluate('(()=>{const t=KEAGAME.G.terrain;'+
    'let hi=0; for(const v of t.field)if(v>hi)hi=v;'+
    'return {recipe:t.recipe, maxH:+hi.toFixed(2), ignored:t.ignored};})()');
  if(st.recipe!==r)throw new Error('terrainstrip: asked for recipe '+r+' and the page built '+st.recipe);
  if(st.ignored.length)throw new Error('terrainstrip: the page refused '+st.ignored.join(', '));
  const f=path.join(OUT,'STRIP_'+r+'.png');
  await page.screenshot({path:f});
  await browser.close();
  shots.push({r,f,st});
  console.log('  recipe '+r+'  ('+RECIPENAME(r)+')   max height '+st.maxH+' m');
}
delete process.env.KEATERRAIN;
await srv.close();



const bandCrop=(src,dst,lo,hi,w)=>{
  const d=execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height `+
    `-of csv=p=0 "${src}"`,{encoding:'utf8'}).trim().split(',').map(Number);
  const y0=Math.round(d[1]*lo), hh=Math.round(d[1]*(hi-lo));
  execSync(`ffmpeg -v error -y -i "${src}" -vf `+
    `"format=rgb24,crop=${d[0]}:${hh}:0:${y0},scale=${w}:-2" "${dst}"`);
  return dst;
};
for(const s of shots){
  const gband=bandCrop(s.f,path.join('/tmp','g_'+s.r+'.png'),GAMEBAND[0],GAMEBAND[1],1440);
  for(const n of ['nz_alps_01','nz_alps_02']){
    const pband=bandCrop(path.join(BOARD,n+'.jpg'),path.join('/tmp','p_'+n+'.png'),
                         BANDS[n][0],BANDS[n][1],1440);
    const out=path.join(OUT,'STRIP_'+s.r+'_vs_'+n.replace('nz_','')+'.png');
    /* the PLATE on top, the recipe under it, with a hairline between so the join is unambiguous */
    execSync(`ffmpeg -v error -y -i "${pband}" -i "${gband}" -filter_complex `+
      `"[0:v]pad=1440:ih+3:0:0:color=0x202020[a];[a][1:v]vstack=inputs=2,format=rgb24" "${out}"`);
  }
}
/* AND ONE SHEET WITH ALL THREE FAMILIES UNDER ONE PLATE, because the choice is between them and a
   choice is easier made on one page than across three files. */
{ const pb=bandCrop(path.join(BOARD,'nz_alps_02.jpg'),'/tmp/p2.png',
                    BANDS.nz_alps_02[0],BANDS.nz_alps_02[1],1440);
  const gs=shots.map(s=>path.join('/tmp','g_'+s.r+'.png'));
  execSync(`ffmpeg -v error -y -i "${pb}" -i "${gs[0]}" -i "${gs[1]}" -i "${gs[2]}" `+
    `-filter_complex "[0:v][1:v][2:v][3:v]vstack=inputs=4,format=rgb24" `+
    `"${path.join(OUT,'STRIP_SHEET_plate_then_abc.png')}"`);
}
console.log('\n  wrote STRIP_{a,b,c}.png, STRIP_<r>_vs_alps_0{1,2}.png and');
console.log('  STRIP_SHEET_plate_then_abc.png — the plate with all three families under it.');
console.log('  the material is identical in all three — only the noise stack differs.');
