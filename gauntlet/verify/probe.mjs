/* REPLAT P1 step 4: built bundle over loopback, three bundled, seed via __KEA_BOOT__. */
import {ensureBuild,serve,preparePage,assertBooted,launch} from './webrig.mjs';
ensureBuild(); const srv=await serve();
const browser=await launch();
const page=await browser.newPage();
await page.setViewport({width:640,height:360});
await preparePage(page);
page.on('pageerror',e=>console.log('PAGEERR:',e.message.split('\n')[0]));
await page.goto(srv.origin+'/',{waitUntil:'load'});
await assertBooted(page);
await page.evaluate(()=>{window.AudioContext=undefined;KEAGAME.startGame(1);});
await new Promise(r=>setTimeout(r,4000));
await page.screenshot({path:'gauntlet/capture/probe_title.png'});
console.log('TITLE SHOT OK');
await browser.close(); await srv.close();
