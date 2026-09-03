import puppeteer from 'puppeteer'; import fs from 'fs';
const SP='/private/tmp/claude-501/-Users-e-barker-kea-gauntlet-portable/58cceab5-f8d5-42c1-94f7-a090d39fb0be/scratchpad', V=process.argv.slice(2);
const b64=f=>fs.readFileSync(SP+'/'+f).toString('base64');
const CX=+process.env.CX||60, CY=+process.env.CY||280, CW=+process.env.CW||420, CH=+process.env.CH||250, Z=+process.env.Z||2;
const cell=(v)=>{const [f,l]=v.split('::');return `<figure><div class="c"><img src="data:image/png;base64,${b64(f)}"></div><figcaption>${l}</figcaption></figure>`;};
const html=`<style>body{margin:0;background:#111;color:#eee;font:13px system-ui}
h1{padding:6px 10px;margin:0;font-size:15px}
.g{display:grid;grid-template-columns:repeat(${process.env.COLS||2},${CW*Z}px);gap:6px;padding:6px}
.c{width:${CW*Z}px;height:${CH*Z}px;overflow:hidden;position:relative}
.c img{position:absolute;left:${-CX*Z}px;top:${-CY*Z}px;width:${960*Z}px;height:${540*Z}px;image-rendering:pixelated}
figure{margin:0}figcaption{padding:4px 8px;color:#ffd479}</style>
<h1>${process.env.TITLE||'strip'}</h1><div class="g">${V.map(cell).join('')}</div>`;
const br=await puppeteer.launch({headless:true,channel:'chrome'});
const pg=await br.newPage(); await pg.setViewport({width:CW*Z*(+(process.env.COLS||2))+24,height:2200});
await pg.setContent(html,{waitUntil:'load'});
await pg.screenshot({path:SP+'/'+(process.env.OUT||'strip')+'.png',fullPage:true});
await br.close(); console.log((process.env.OUT||'strip')+'.png');
