/* node tools/kea_lab/shoot.mjs <out.png> '<query>' — one lab render (see render.html) */
import { serve, launch, ROOT } from '../../gauntlet/verify/webrig.mjs';
const [out, q] = process.argv.slice(2);
const srv = await serve(ROOT), br = await launch();
try { const pg = await br.newPage(); const Q = new URLSearchParams(q); await pg.setViewport({ width: +(Q.get('w') || 900), height: +(Q.get('h') || 900) });
  pg.on('pageerror', e => console.error('page:', e.message));
  await pg.goto(srv.origin + '/tools/kea_lab/render.html?' + q); await pg.waitForFunction('window.__done', { timeout: 60000 });
  console.log(JSON.stringify(await pg.evaluate('window.__done'))); await pg.screenshot({ path: out });
} finally { await br.close(); await srv.close(); }
