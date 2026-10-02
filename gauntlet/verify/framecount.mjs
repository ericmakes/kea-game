/* FRAMECOUNT — what one frame submits: draw calls and triangles for the whole frame (every render()
   the frame makes: shadow cascades, the scene, the post quads), and how many meshes cast. Headless
   is fine: the counts are the scene's, not the GPU's. Usage: node gauntlet/verify/framecount.mjs */
import { ensureBuild, serve, preparePage, assertBooted, launch, GAUNTLETSEED } from './webrig.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
ensureBuild(); const srv = await serve(); const browser = await launch();
try {
  const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 720 });
  await preparePage(page, { seed: GAUNTLETSEED, biome: process.env.BIOME || 'carpark' }); await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(1500);
  await assertBooted(page, { biome: process.env.BIOME || 'carpark' }); await page.evaluate('KEAGAME.startGame(1)'); await sleep(2500);
  console.log(await page.evaluate(() => new Promise(res => { const G = KEAGAME.G, r = G.renderer;
    let meshes = 0, casters = 0, castTris = 0, inst = 0;
    G.scene.traverse(o => { if (!o.isMesh) return; let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false; if (!v) return; meshes++; if (o.isInstancedMesh) inst++;
      if (o.castShadow) { casters++; const g = o.geometry; const t = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : (g.instanceCount && g.instanceCount !== Infinity ? g.instanceCount : 1)); castTris += t; (window.__top = window.__top || []).push([Math.round(t), o.name || o.geometry.type, o.parent && (o.parent.name || o.parent.type)]); } });
    const top = (window.__top || []).sort((a, b) => b[0] - a[0]).slice(0, 8);
    const sm = r.shadowMap, smr = sm.render.bind(sm); let shT = 0, shC = 0, shN = 0;
    const rbd = r.renderBufferDirect.bind(r); let inSh = false; const who = new Map();
    r.renderBufferDirect = (cam, sc, geo, mat, obj, grp) => { if (inSh) { const t0 = r.info.render.triangles; rbd(cam, sc, geo, mat, obj, grp);
        const ci = G.shadows && G.shadows.csm ? G.shadows.csm.lights.findIndex(L => L.shadow.camera === cam) : -1; (window.__perCam = window.__perCam || {})[ci] = ((window.__perCam || {})[ci] || 0) + 1;
        const k = (obj.name || obj.type) + '|' + geo.type + '|' + (obj.parent && (obj.parent.name || obj.parent.type)) + '|cast=' + obj.castShadow + '|recv=' + obj.receiveShadow; const e = who.get(k) || [0, 0]; e[0]++; e[1] += r.info.render.triangles - t0; who.set(k, e); return; }
      return rbd(cam, sc, geo, mat, obj, grp); };
    sm.render = (...a) => { const t0 = r.info.render.triangles, c0 = r.info.render.calls; inSh = true; try { smr(...a); } finally { inSh = false; } shT += r.info.render.triangles - t0; shC += r.info.render.calls - c0; shN++; };
    window.__who = who;
    r.info.autoReset = false; requestAnimationFrame(() => { r.info.reset(); shT = shC = shN = 0; requestAnimationFrame(() => {
      const i = r.info.render; const lights = []; G.scene.traverse(o => { if (o.isLight && o.castShadow) { let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false; lights.push([o.type, o.name || '', v, o.shadow.mapSize.x, +o.intensity.toFixed(2)]); } });
      const whoTop = [...window.__who.entries()].sort((a, b) => b[1][1] - a[1][1]).slice(0, 12).map(([k, v]) => [v[1], v[0], k]);
      const bins = {}; const sp = new THREE.Sphere(); G.scene.traverse(o => { if (!o.isMesh || !o.castShadow) return; o.geometry.computeBoundingSphere(); sp.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld); const r = sp.radius, k = r < 0.05 ? '<0.05' : r < 0.1 ? '<0.10' : r < 0.2 ? '<0.20' : r < 0.4 ? '<0.40' : r < 1 ? '<1.0' : '>=1'; bins[k] = (bins[k] || 0) + 1; });
      res(JSON.stringify({ proxies: G.shadows && G.shadows.proxies, builds: G.__proxyBuilds, perCascade: window.__perCam, casterRadius: bins, whoTop, lights, shadowPasses: shN, shadowCalls: shC, shadowTris: shT, top, meshes, instanced: inst, casters, castTris: Math.round(castTris), callsPerFrame: i.calls, trisPerFrame: i.triangles, shadowCascades: G.shadows && G.shadows.cascades, programs: r.info.programs.length })); r.info.autoReset = true; }); }); })));
} finally { await browser.close().catch(() => {}); await srv.close(); }
