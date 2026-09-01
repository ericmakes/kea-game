// SIDEBYSIDE — the studio wall in the loop.
// Composites a game vantage beside its reference photo so every art
// judgement is "closer to THAT?" instead of "better?".
// Usage:  node gauntlet/verify/sidebyside.mjs        (all pairs)
//         node gauntlet/verify/sidebyside.mjs 03     (pairs for vantage 03)
// Output: gauntlet/reference/pairs/  (gitignored — derived artifacts)
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const cap = f => path.join(ROOT, 'gauntlet', 'capture', f);
const ref = f => path.join(ROOT, 'gauntlet', 'reference', 'board', f);
const OUT = path.join(ROOT, 'gauntlet', 'reference', 'pairs');
const PAIRS = [
  ['03_kea_plate.png', 'kea_head_01.jpg'],
  ['03_kea_plate.png', 'kea_posture_01.jpg'],
  ['18_rear_close.png', 'kea_head_01.jpg'],
  ['13_idle_preen.png', 'kea_preen_01.jpg'],
  ['25_preen_follow.png', 'kea_preen_01.jpg'],
  ['04_flight_underwing.png', 'kea_underwing_01.jpg'],
  ['04_flight_underwing.png', 'kea_underwing_02.jpg'],
  ['09_colossal.png', 'kea_scale_01.jpg'],
  ['12_seal_midpeel.png', 'kea_on_car_01.jpg'],
  ['12_seal_midpeel.png', 'ugg_shadows_01.jpg'],
  ['01_carpark_wide.png', 'nz_carpark_01.jpg'],
  ['14_player_view.png', 'nz_tussock_01.jpg'],
  ['05_tussock_ground.png', 'nz_tussock_01.jpg'],
  ['23_paddock_gate.png', 'nz_tussock_03.jpg'],
  ['06_skyline.png', 'nz_alps_01.jpg'],
  ['02_hut_snow.png', 'nz_hut_01.jpg'],
  ['21_night_camp.png', 'nz_mist_01.jpg'],
  ['16_trish.png', 'nz_hikers_01.jpg'],
];
const only = process.argv[2] || '';
const b64 = p => `data:image/${p.endsWith('.png') ? 'png' : 'jpeg'};base64,` +
  fs.readFileSync(p).toString('base64');
fs.mkdirSync(OUT, { recursive: true });
// LAUNCH (2026-09-01): mirrors capture.mjs. The bundled chrome is unsigned on some macs and
// spawn fails with errno -88 (EBADARCH), so fall back to the installed channel exactly as the
// photographer does. Without this the tool cannot run on the studio machine at all.
const browser = await (async () => {
  try { return await puppeteer.launch({ headless: true, args: ['--no-sandbox'] }); }
  catch (e) { return await puppeteer.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] }); }
})();
const page = await browser.newPage();
await page.setViewport({ width: 1960, height: 760 });
let n = 0;
for (const [v, r] of PAIRS) {
  if (only && !v.startsWith(only)) continue;
  if (!fs.existsSync(cap(v))) { console.log(`skip ${v} (no capture)`); continue; }
  if (!fs.existsSync(ref(r))) { console.log(`skip ${r} (no ref)`); continue; }
  const html = `<body style="margin:0;background:#141416;display:flex;height:760px">
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
      <div style="color:#eee;font:700 20px sans-serif;padding:8px 12px">GAME - ${v}</div>
      <img src="${b64(cap(v))}" style="flex:1;object-fit:contain;min-height:0">
    </div>
    <div style="width:4px;background:#000"></div>
    <div style="flex:1;display:flex;flex-direction:column;min-width:0">
      <div style="color:#ffd23f;font:700 20px sans-serif;padding:8px 12px">TARGET - ${r}</div>
      <img src="${b64(ref(r))}" style="flex:1;object-fit:contain;min-height:0">
    </div></body>`;
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  const out = path.join(OUT, `${v.replace('.png', '')}__${r.replace('.jpg', '')}.png`);
  await page.screenshot({ path: out });
  console.log('pair', path.basename(out));
  n++;
}
await browser.close();
console.log(`SIDEBYSIDE: ${n} pairs -> gauntlet/reference/pairs/`);
