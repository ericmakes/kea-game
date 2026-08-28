import fs from 'fs';
const chromium=(await import('@sparticuz/chromium')).default;
const p=await import('puppeteer-core');
const THREE_LOCAL=fs.readFileSync('node_modules/three/build/three.min.js');
const browser=await p.default.launch({executablePath:await chromium.executablePath(),
  args:[...chromium.args,'--no-sandbox'],headless:true,dumpio:true});
const page=await browser.newPage();
await page.setViewport({width:640,height:360});
await page.setRequestInterception(true);
page.on('request',r=>{ if(/three(\.min)?\.js/.test(r.url()))r.respond({contentType:'application/javascript',body:THREE_LOCAL});
  else if(/fonts\./.test(r.url()))r.respond({contentType:'text/css',body:''}); else r.continue(); });
page.on('pageerror',e=>console.log('PAGEERR:',e.message.split('\n')[0]));
await page.goto('file://'+process.cwd()+'/untitled-kea-game.html',{waitUntil:'load'});
await page.evaluate(()=>{window.AudioContext=undefined;KEAGAME.startGame(1);});
await new Promise(r=>setTimeout(r,4000));
await page.screenshot({path:'gauntlet/capture/probe_title.png'});
console.log('TITLE SHOT OK');
await browser.close();
