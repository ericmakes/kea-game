/* COLOURDIGEST — every colour the game hands the GPU, per map, as a diffable file. SPIKE_ADOPT row 5,
   2026-10-03 (ColorManagement ON).

   WHY. The project ran with THREE.ColorManagement OFF and converted sRGB -> linear BY HAND at ~59 call
   sites. Turning it on means three converts in the Color constructor instead, so every hand conversion
   that stays converts TWICE, and every raw hex that never had one starts converting for the first time.
   Both are silent: nothing throws, a colour just moves. This file makes them loud. It records, in the
   real built game at a pinned noon, on every map:
     materials  every Color-valued property and every Color / Vector3 / Vector4 uniform, per mesh
     vertices   every 'color' attribute (sum and a coarse hash, so a re-coloured array cannot hide)
     lights     colour and intensity          scene   fog colour and density, background
   keyed by traversal order and mesh shape, which a colour-space change does not move. Traffic is held
   off (G.trafT): a car spawning in one take and not the other shifts every key after it.
   DIFF=<a.json> compares a fresh digest against a saved one and prints every value that moved, with the
   ratio — a hand conversion applied twice shows as linear^2.2 (a darkening that grows with darkness);
   a raw hex converted for the first time shows the same signature, which is why every row is then
   judged at its call site, not here. This is an instrument, not a gate battery.
   Usage: node gauntlet/verify/colourdigest.mjs [out.json]    BIOMES=carpark,...  DIFF=<old.json> */
import fs from 'fs';
import { ensureBuild, serve, preparePage, assertBooted, launch, GAUNTLETSEED } from './webrig.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BIOMES = (process.env.BIOMES || 'carpark,skifield,campground,village,river,station').split(',');
const OUTF = process.argv[2] || null;
ensureBuild();
const srv = await serve(); const browser = await launch();
const digest = {};
try {
  for (const biome of BIOMES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 320, height: 180, deviceScaleFactor: 1 });
    await preparePage(page, { seed: GAUNTLETSEED, biome });
    await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(800);
    await assertBooted(page, { biome });
    for (let i = 0; i < 100; i++) { const m = await page.evaluate(() => (KEAGAME.G.models || {}).mode); if (m && m !== 'loading') break; await sleep(100); }
    await page.evaluate('window.AudioContext=undefined; KEAGAME.G.clockPin=12.0; KEAGAME.startGame(1); KEAGAME.G.trafT={a:1e9,b:1e9};'); await sleep(1500);
    digest[biome] = await page.evaluate(() => {
      const G = KEAGAME.G, r5 = v => Math.round(v * 1e5) / 1e5, out = { scene: {}, lights: [], meshes: [] };
      const col = c => [r5(c.r), r5(c.g), r5(c.b)];
      if (G.scene.fog) out.scene.fog = { color: col(G.scene.fog.color), density: G.scene.fog.density ?? null };
      if (G.scene.background && G.scene.background.isColor) out.scene.background = col(G.scene.background);
      out.scene.toneMapping = G.renderer.toneMapping; out.scene.exposure = G.renderer.toneMappingExposure;
      out.scene.envIntensity = G.scene.environmentIntensity;
      let n = 0;
      G.scene.traverse(o => {
        n++;
        if (o.isLight) { out.lights.push({ i: n, type: o.type, name: o.name || '', color: col(o.color), intensity: r5(o.intensity),
          ground: o.groundColor ? col(o.groundColor) : undefined }); return; }
        if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
        const g = o.geometry, key = `${n}:${o.type}:${o.name || ''}:${g && g.attributes.position ? g.attributes.position.count : 0}`;
        const row = { k: key, m: [] };
        for (const m of (Array.isArray(o.material) ? o.material : [o.material])) { if (!m) continue;
          const mr = { t: m.type, c: {} };
          for (const p in m) { const v = m[p]; if (v && v.isColor) mr.c[p] = col(v); }
          if (m.uniforms) for (const u in m.uniforms) { const v = m.uniforms[u] && m.uniforms[u].value; if (!v) continue;
            if (v.isColor) mr.c['u.' + u] = col(v);
            else if (v.isVector3) mr.c['u.' + u] = [r5(v.x), r5(v.y), r5(v.z)];
            else if (v.isVector4) mr.c['u.' + u] = [r5(v.x), r5(v.y), r5(v.z), r5(v.w)];
            else if (Array.isArray(v) && v[0] && (v[0].isColor || v[0].isVector3)) mr.c['u.' + u] = v.map(e => e.isColor ? col(e) : [r5(e.x), r5(e.y), r5(e.z)]); }
          row.m.push(mr); }
        const C = g && g.attributes.color;
        if (C) { let s = [0, 0, 0], h = 0; for (let i = 0; i < C.count; i++) { const a = [C.getX(i), C.getY(i), C.getZ(i)];
            for (let c = 0; c < 3; c++) s[c] += a[c]; h = (h * 31 + Math.round(a[0] * 255) * 65536 + Math.round(a[1] * 255) * 256 + Math.round(a[2] * 255)) >>> 0; }
          row.vc = { n: C.count, mean: s.map(v => r5(v / C.count)), h }; }
        if (o.isInstancedMesh && o.instanceColor) { const I = o.instanceColor; let s = [0, 0, 0]; for (let i = 0; i < o.count; i++) for (let c = 0; c < 3; c++) s[c] += I.array[i * 3 + c];
          row.ic = { n: o.count, mean: s.map(v => r5(v / Math.max(1, o.count))) }; }
        out.meshes.push(row);
      });
      return out;
    });
    await page.close();
    console.log(`  ${biome.padEnd(11)} ${digest[biome].meshes.length} meshes  ${digest[biome].lights.length} lights`);
  }
} finally { await browser.close().catch(() => {}); await srv.close(); }
if (OUTF) { fs.writeFileSync(OUTF, JSON.stringify(digest)); console.log('COLOURDIGEST -> ' + OUTF); }

/* ---- the diff ---- */
if (process.env.DIFF) {
  const A = JSON.parse(fs.readFileSync(process.env.DIFF, 'utf8')), rows = [];
  const cmp = (where, a, b) => { if (JSON.stringify(a) === JSON.stringify(b)) return;
    const ratio = Array.isArray(a) && Array.isArray(b) ? b.map((v, i) => a[i] ? +(v / a[i]).toFixed(3) : null) : null;
    rows.push({ where, a, b, ratio }); };
  for (const biome of Object.keys(digest)) { const a = A[biome], b = digest[biome]; if (!a) { rows.push({ where: biome, a: 'missing' }); continue; }
    for (const k of Object.keys({ ...a.scene, ...b.scene })) cmp(`${biome} scene.${k}`, a.scene[k], b.scene[k]);
    const la = new Map(a.lights.map(l => [l.i + l.type, l])); for (const l of b.lights) { const o = la.get(l.i + l.type); if (!o) { rows.push({ where: `${biome} light ${l.type} new` }); continue; }
      cmp(`${biome} light#${l.i} ${l.type} ${l.name} color`, o.color, l.color); cmp(`${biome} light#${l.i} ${l.type} ${l.name} intensity`, o.intensity, l.intensity); if (l.ground) cmp(`${biome} light#${l.i} ground`, o.ground, l.ground); }
    const ma = new Map(a.meshes.map(m => [m.k, m])); let missing = 0;
    for (const m of b.meshes) { const o = ma.get(m.k); if (!o) { missing++; continue; }
      m.m.forEach((mm, j) => { const om = o.m[j] || { c: {} }; for (const p of new Set([...Object.keys(om.c), ...Object.keys(mm.c)])) cmp(`${biome} ${m.k} ${mm.t}.${p}`, om.c[p], mm.c[p]); });
      if (m.vc || o.vc) cmp(`${biome} ${m.k} vertexColor.mean`, o.vc && o.vc.mean, m.vc && m.vc.mean);
      if (m.ic || o.ic) cmp(`${biome} ${m.k} instanceColor.mean`, o.ic && o.ic.mean, m.ic && m.ic.mean); }
    if (missing) rows.push({ where: `${biome}: ${missing} meshes not matched by key (the scene's structure moved)` }); }
  /* group identical (where-without-mesh-index, a, b) so a material shared by 300 meshes is one line */
  const grp = new Map(); for (const r of rows) { const w = r.where.replace(/ \d+:/, ' #:'), key = w + JSON.stringify(r.a) + JSON.stringify(r.b);
    const g = grp.get(key) || { ...r, where: w, n: 0 }; g.n++; grp.set(key, g); }
  const G2 = [...grp.values()];
  for (const r of G2) console.log(`  ${r.n > 1 ? ('x' + r.n).padStart(5) : '     '} ${r.where}  ${JSON.stringify(r.a)} -> ${JSON.stringify(r.b)}${r.ratio ? '  ratio ' + JSON.stringify(r.ratio) : ''}`);
  console.log(`COLOURDIGEST DIFF: ${rows.length} values moved (${G2.length} distinct)`);
}
