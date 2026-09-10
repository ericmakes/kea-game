/* SKYTONE — TODO 76's variant strip: how blue should the sky be?
   Usage: node gauntlet/verify/skytone.mjs        shoot the page, measure every panel
          KEEP=1 ...                              leave the per-panel PNGs on disk

   WHY THIS IS A STRIP AND NOT A ROW IN platescore's TABLE. Sky tone is the one sky property the
   references do not agree about. Measured on each plate's own sky region, saturation runs from
   0.009 to 0.582 — nz_alps_02 is overcast and nz_alps_01 is the deepest blue on the board — and
   the game sits at 0.527, inside that range and above every plate with a wide elevation span. A
   band whose two ends are "no blue at all" and "the bluest sky we have" is not a test. So the
   machine measures and prints, and Eric picks. SKY.md 4 named this and named its shape: three
   tones, one page, everything else held constant.

   ERIC NAMED THE TWO PLATES TO JUDGE AGAINST: nz_alps_01 and nz_alps_02. Both are on the page, at
   the top, cropped to their own sky regions by the same code that measures them. nz_alps_02 is NOT
   in platescore's scored sky set — a blue sky judged against an overcast plate gets a luma band it
   can only reach by turning white — but for a TONE PICK it is exactly the right other end of the
   scale, which is Eric's point.

   ONE VARIABLE PER STEP. The hue is separate from the saturation because the plates AGREE on the
   hue and disagree on the saturation: 212, 214, 216 and 217 against the game's 205. One of those
   is a correctable bias and the other is a taste call, so panel 1 moves the hue alone and panels 2
   and 3 then move the saturation on top of it. A page where two things change at once cannot be
   picked from.

   THE LABELS ARE BURNED IN BY THE BROWSER, not by ffmpeg: this ffmpeg build has no drawtext filter
   (checked, it reports zero), and an unlabelled four-panel page of nearly-identical blues is a
   page nobody can act on. The panels are shot with a DOM caption already in them, and the plates
   get theirs from the composite page, which is itself an HTML document screenshotted at the end. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { execSync } from 'child_process';
import { W as SW, H as SH, CAM, QUIET, SKYQUIET, SKYFLAG, SKYBANDS, SKYPLATES, SKYGAMEBAND }
  from './stripcam.mjs';
import { bandNorm, skyMeasureAll, skyColour, cloudMask, lumPlane, NORMW } from './platescore.mjs';

const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'../..');
const OUT=path.join(ROOT,'gauntlet/capture');
const BOARD=path.join(ROOT,'gauntlet/reference/board');
const TMP='/tmp/skytone'; fs.mkdirSync(TMP,{recursive:true});

/* THE FOUR PANELS. satMul and hueRot are the only things that differ; the cloud recipe, the range,
   the light and the camera are identical across all four. */
const PANELS=[
  {id:'0_shipped',  sat:1.00, hue:0,  what:'AS SHIPPED — the NZ tourism blue ARTBIBLE names'},
  {id:'1_hue',      sat:1.00, hue:8,  what:'HUE ONLY — +8 degrees, which every plate agrees on'},
  {id:'2_softer',   sat:0.70, hue:8,  what:'SOFTER — hue fixed, saturation to 70%'},
  {id:'3_plates',   sat:0.45, hue:8,  what:'THE PLATES — hue fixed, saturation to 45%'},
];

const isMag=p=>p[0]>110&&p[2]>110&&p[1]<70&&Math.abs(p[0]-p[2])<90;
const px=(im,x,y)=>{const i=(y*im.w+x)*3;return [im.buf[i],im.buf[i+1],im.buf[i+2]];};

/* THE CAPTION, INJECTED BEFORE THE SHUTTER. Fixed to the frame rather than the page so it cannot
   scroll, and given an explicit font stack because a headless Chrome has no default worth relying
   on. It sits in the BOTTOM-left, clear of the sky band this page is about. */
const caption=(text)=>`(()=>{ const d=document.createElement('div');
  d.style.cssText='position:fixed;left:0;bottom:0;z-index:99999;padding:6px 14px;'+
    'background:rgba(8,10,14,0.86);color:#fff;font:600 20px/1.3 ui-monospace,Menlo,monospace;'+
    'letter-spacing:0.02em';
  d.textContent=${JSON.stringify(text)}; document.body.appendChild(d); })();`;

async function shoot(){
  const {ensureBuild,serve,preparePage,assertBooted,launch,GAUNTLETSEED}=await import('./webrig.mjs');
  ensureBuild(); const srv=await serve();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const out={};
  for(const p of PANELS){
    out[p.id]={};
    for(const kind of ['ship','flag']){
      /* KEASKY CARRIES THE TONE, so no rebuild between panels — and webrig REFUSES a leaf it does
         not know, which is why skySatMul and skyHueRot went into its SKY_KEYS list in the same
         commit as the constants. A refused override would have shot four identical frames and
         called them four variants; that has happened once in this project already. */
      process.env.KEASKY=JSON.stringify({skySatMul:p.sat,skyHueRot:p.hue});
      const browser=await launch(); const page=await browser.newPage();
      await page.setViewport({width:SW,height:SH});
      await preparePage(page,{seed:GAUNTLETSEED,biome:'carpark'});
      await page.goto(srv.origin+'/',{waitUntil:'load'});
      await assertBooted(page);
      await page.evaluate('window.AudioContext=undefined;KEAGAME.startGame(1);');
      await sleep(900);
      await page.evaluate(QUIET); await page.evaluate(CAM); await page.evaluate(SKYQUIET);
      if(kind==='flag')await page.evaluate(SKYFLAG);
      /* THE KNOBS ARE READ BACK OFF THE PAGE. A variant strip whose panels are secretly identical
         is the worst outcome here, and it is silent — so the page is asked what it actually got. */
      const got=await page.evaluate('(()=>({s:KEAGAME.SKY.skySatMul,h:KEAGAME.SKY.skyHueRot}))()');
      if(Math.abs(got.s-p.sat)>1e-9||Math.abs(got.h-p.hue)>1e-9)
        throw new Error('skytone: panel '+p.id+' asked for satMul '+p.sat+'/hueRot '+p.hue+
          ' and the page has '+got.s+'/'+got.h+' — the KEASKY seam did not take');
      if(kind==='ship')await page.evaluate(caption(p.what));
      await sleep(1300);
      const f=path.join(TMP,'panel_'+p.id+'_'+kind+'.png');
      await page.screenshot({path:f}); await browser.close();
      out[p.id][kind]=f;
    }
  }
  delete process.env.KEASKY;
  await srv.close();
  return out;
}

/* EVERY PANEL IS MEASURED THE WAY THE SCORED TABLE MEASURES, with the game's own magenta sky mask,
   so the numbers under this page and the numbers in platescore's table are the same quantity. */
function measure(ship,flag){
  const band=SKYGAMEBAND;
  const im=bandNorm(ship,band[0],band[1],NORMW);
  const mim=bandNorm(flag,band[0],band[1],NORMW);
  const g=skyMeasureAll(im,(p,x,y)=>isMag(px(mim,x,y)));
  return {luma:g.skyLuma, hue:g.skyHue, sat:g.skySat,
          topSat:g.skyTopSat, horizSat:g.skyHorizSat, ratio:g.satRatio};
}

function plateSky(n,band,test){
  const im=bandNorm(path.join(BOARD,n+'.jpg'),band[0],band[1],NORMW);
  const {w,h}=im; let keep=null;
  if(test){ keep=new Uint8Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)keep[y*w+x]=test(px(im,x,y))?1:0; }
  const c=skyColour(im,keep,cloudMask(im,keep));
  return {luma:c.luma, hue:c.hue, sat:c.sat};
}

const frames=await shoot();

/* ---- the page ---- */
/* nz_alps_02 has no entry in SKYBANDS because it is not in the scored set. Its sky crop is derived
   the same way every other one was — the topmost row that is definitely not sky, in any column,
   sits at 0.217 — and it is stated here rather than imported from a set it is deliberately not in. */
const PLATES=[
  {n:'nz_alps_01', band:SKYBANDS.nz_alps_01, test:SKYPLATES.nz_alps_01.test,
   what:'PLATE nz_alps_01 — the deepest blue on the board'},
  {n:'nz_alps_02', band:[0,0.21], test:null,
   what:'PLATE nz_alps_02 — overcast, the other end of the scale'},
];

const rows=[];
for(const p of PLATES){
  const src=path.join(BOARD,p.n+'.jpg');
  const d=execSync(`ffprobe -v error -select_streams v -show_entries stream=width,height `+
    `-of csv=p=0 "${src}"`,{encoding:'utf8'}).trim().split(',').map(Number);
  const f=path.join(TMP,'plate_'+p.n+'.png');
  execSync(`ffmpeg -v error -y -i "${src}" -vf "format=rgb24,crop=${d[0]}:`+
    `${Math.round(d[1]*(p.band[1]-p.band[0]))}:0:${Math.round(d[1]*p.band[0])},`+
    `scale=${NORMW}:-2" "${f}"`);
  rows.push({file:f, what:p.what, m:plateSky(p.n,p.band,p.test)});
}
for(const p of PANELS){
  const s=frames[p.id].ship;
  const f=path.join(TMP,'crop_'+p.id+'.png');
  execSync(`ffmpeg -v error -y -i "${s}" -vf "format=rgb24,crop=iw:`+
    `${Math.round(SH*(SKYGAMEBAND[1]-SKYGAMEBAND[0]))}:0:${Math.round(SH*SKYGAMEBAND[0])},`+
    `scale=${NORMW}:-2" "${f}"`);
  rows.push({file:f, what:p.what, m:measure(frames[p.id].ship,frames[p.id].flag), panel:p});
}

const b64=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const html=`<!doctype html><meta charset=utf8><style>
 body{margin:0;background:#111;color:#eee;font:13px/1.5 ui-monospace,Menlo,monospace}
 .r{border-top:1px solid #333}
 .c{padding:7px 12px 5px;display:flex;gap:18px;align-items:baseline}
 .t{font-weight:700;letter-spacing:.02em}
 .n{color:#9ab}
 img{display:block;width:${NORMW}px}
 h1{font:700 15px/1.4 ui-monospace,Menlo,monospace;margin:0;padding:10px 12px;background:#1b1d22}
</style><h1>TODO 76 — SKY TONE. Two plates, then the shipped sky, then three tones. One variable per step; the range, the light, the clouds and the camera are identical.</h1>
${rows.map(r=>`<div class=r><div class=c><span class=t>${r.what}</span>`+
  `<span class=n>luma ${r.m.luma.toFixed(3)} &nbsp; hue ${r.m.hue.toFixed(0)} &nbsp; sat ${r.m.sat.toFixed(3)}`+
  (r.panel?` &nbsp;·&nbsp; satMul ${r.panel.sat.toFixed(2)} hueRot +${r.panel.hue}`:'')+
  `</span></div><img src="${b64(r.file)}"></div>`).join('\n')}`;
const pageHtml=path.join(TMP,'page.html');
fs.writeFileSync(pageHtml,html);
{
  const {launch}=await import('./webrig.mjs');
  const browser=await launch(); const page=await browser.newPage();
  await page.setViewport({width:NORMW,height:900});
  await page.goto('file://'+pageHtml,{waitUntil:'load'});
  /* WAIT FOR THE IMAGES TO HAVE A HEIGHT, not just to have loaded. fullPage measures the document,
     and a document whose <img> elements have not been laid out yet is SHORT — the first run of this
     came back 1415 px against about 1572 of content and clipped the last panel off the bottom,
     which on a page whose whole purpose is comparing the last panel to the first is the one failure
     that matters. 'load' is not enough on its own for data-URI images.
     THE FIRST PAGE WAS FINE, AS IT TURNED OUT — 1415 px is the whole of it, and the estimate that
     said otherwise was mine. The wait stays anyway: the failure it guards against is silent, and
     the check that settled it (crop the bottom 200 px and look) is not one anybody will remember
     to repeat. */
  await page.evaluate(`(async()=>{ await Promise.all([...document.images].map(i=>i.decode?
    i.decode().catch(()=>{}):Promise.resolve())); await document.fonts.ready;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); })()`);
  const h=await page.evaluate('document.documentElement.scrollHeight');
  if(h<300)throw new Error('skytone: the page laid out only '+h+' px tall');
  await page.setViewport({width:NORMW,height:Math.min(30000,h)});
  const out=path.join(OUT,'SKYTONE_page.png');
  await page.screenshot({path:out,fullPage:true});
  console.log('  page laid out '+h+' px tall');
  await browser.close();
  console.log('\nSKY TONE — TODO 76, for Eric\'s pick');
  const w=Math.max(...rows.map(r=>r.what.length));
  for(const r of rows)
    console.log('  '+r.what.padEnd(w)+'   luma '+r.m.luma.toFixed(3)+
      '   hue '+r.m.hue.toFixed(0).padStart(3)+'   sat '+r.m.sat.toFixed(3)+
      (r.panel?'    (satMul '+r.panel.sat.toFixed(2)+', hueRot +'+r.panel.hue+')':''));
  console.log('\n  page  '+out);
  if(!process.env.KEEP)for(const r of rows)fs.unlinkSync(r.file);
}
