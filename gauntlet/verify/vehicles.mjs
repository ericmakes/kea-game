/* VEHICLES — did the spike's cars land, and do they stand on the ground? SPIKE_ADOPT 1, 2026-10-03.

   The real built game in the capture browser, carpark. Asserted:
     LOADED   every entry that ships a spike vehicle (src/game.mjs, source:'model' with a vehicle
              block) is in G.models.swapped, none is in G.models.failed — a compressed or empty GLB
              must not look like a primitive that simply stayed (src/vehicles.mjs refuses one)
     REAL     each swapped placement draws its vehicle and hides its primitive body, and the vehicle
              has triangles
     ON THE GROUND  the lowest point of each vehicle's TYRES is within TOL of the drawn ground under
              that wheel (drawnGroundAt) — no car sunk 14 cm into the seal, none floating. The caravan
              and the trailer stand on their wheels too; the drawbar jockey is not a wheel
     TRAFFIC  a traffic car spawned after load wears the spike hatch
     WALKERS  humans and sheep standing on the base ground have their lowest point on the drawn ground
              (SPIKE_ADOPT 2), within TOL, at the stance (the leg swing zeroed for the reading)
   Usage: node gauntlet/verify/vehicles.mjs     TOL (metres, 0.012) */
import { ensureBuild, serve, preparePage, assertBooted, launch, GAUNTLETSEED } from './webrig.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TOL = +(process.env.TOL || 0.012);
ensureBuild(); const srv = await serve(); const browser = await launch();
let r = null;
try {
  const page = await browser.newPage(); await page.setViewport({ width: 640, height: 360 });
  await preparePage(page, { seed: GAUNTLETSEED, biome: 'carpark' }); await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(1500);
  await assertBooted(page, { biome: 'carpark' });
  for (let i = 0; i < 100; i++) { const m = await page.evaluate(() => (KEAGAME.G.models || {}).mode); if (m && m !== 'loading') break; await sleep(100); }
  await page.evaluate('KEAGAME.startGame(1)'); await sleep(1500);
  r = await page.evaluate((TOL) => {
    const G = KEAGAME.G, M = G.models || {}, out = { mode: M.mode, failed: M.failed || [], rows: [] };
    const want = (G.propReg || []).filter(p => p.entry.vehicle);
    out.want = want.map(p => p.id);
    const v = new THREE.Vector3(), bb = new THREE.Box3();
    for (const p of want) {
      const row = { id: p.id, swapped: (M.swapped || []).includes(p.id), bodyHidden: p.body.every(o => o.userData.keepWithModel || !o.visible) };
      const veh = p.model && p.model.root; let tris = 0, low = Infinity, lowAt = null;
      if (veh) { veh.updateMatrixWorld(true);
        veh.traverse(o => { if (!o.isMesh) return; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; });
        /* the tyres: the merged lathe mesh under 'wheels'; its lowest vertex per wheel position */
        const wheels = veh.getObjectByName('wheels'); const tyre = wheels && wheels.children[0];
        if (tyre) { const P = tyre.geometry.attributes.position;
          for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(tyre.matrixWorld); if (v.y < low) { low = v.y; lowAt = [v.x, v.z]; } } } }
      row.tris = tris;
      if (lowAt) { const gy = KEAGAME.drawnGroundAt(lowAt[0], lowAt[1]); row.tyreOverGround = +(low - gy).toFixed(4); row.ground = +gy.toFixed(4); }
      out.rows.push(row);
    }
    /* a traffic car, spawned now that the file is in */
    const before = (G.cars || []).filter(c => c.traffic).length;
    G.trafT && (G.trafT.a = 0); for (let i = 0; i < 400 && (G.cars || []).filter(c => c.traffic).length === before; i++) KEAGAME.update(1 / 60);
    const tc = (G.cars || []).find(c => c.traffic);
    out.traffic = tc ? { dressed: !!tc.vehicleModel, hidden: (tc.body || []).every(o => !o.visible) } : null;
    /* WALKERS (SPIKE_ADOPT 2): every human and sheep standing on the base ground — not asleep, sprawled,
       launched, on a ladder or mid-bounce — its lowest drawn vertex against the drawn ground under it.
       Decals (no depth write), sprites and the alert marks are not feet. */
    out.walkers = [];
    const low = (g) => { let m = Infinity; g.updateMatrixWorld(true);
      g.traverse(o => { if (!o.isMesh || !o.visible || (o.material && o.material.depthWrite === false)) return;
        let vis = true; for (let q = o; q && q !== g.parent; q = q.parent) if (!q.visible) vis = false; if (!vis) return;
        const P = o.geometry.attributes.position; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (v.y < m) m = v.y; } });
      return m; };
    for (const h of G.humans || []) { if (!h.g || h.asleep || h.sprawl > 0 || h.launched || h.onLadder) continue;
      if (KEAGAME.groundHeightAt(h.x, h.z, 0.4) > 0.02) continue;
      /* THE STANCE, not a stride: the walk cycle swings the boots below the stance (measured -32.7 mm mid
         stride against -24.9 standing), and it is the stance the lift answers for */
      const sw = [h.legL && h.legL.rotation.x, h.legR && h.legR.rotation.x];
      if (h.legL) h.legL.rotation.x = 0; if (h.legR) h.legR.rotation.x = 0;
      const lo = low(h.g); if (h.legL) h.legL.rotation.x = sw[0]; if (h.legR) h.legR.rotation.x = sw[1];
      out.walkers.push({ who: 'human ' + h.key, d: +(lo - KEAGAME.drawnGroundAt(h.x, h.z)).toFixed(4), raised: KEAGAME.drawnGroundAt(h.x, h.z) > 0.05, at: [+h.x.toFixed(1), +h.z.toFixed(1)] }); }
    for (const sh of G.sheep || []) { if (!sh.g || (sh.mode && sh.mode !== 'graze')) continue;
      const x = sh.g.position.x, z = sh.g.position.z; if (KEAGAME.groundHeightAt(x, z, 0.4) > 0.02) continue;
      out.walkers.push({ who: 'sheep', d: +(low(sh.g) - KEAGAME.drawnGroundAt(x, z)).toFixed(4), raised: KEAGAME.drawnGroundAt(x, z) > 0.05, at: [+x.toFixed(1), +z.toFixed(1)] }); }
    return out;
  }, TOL);
} finally { await browser.close().catch(() => {}); await srv.close(); }
const fails = [];
if (!r.want.length) fails.push('no entry ships a spike vehicle');
for (const f of r.failed) fails.push(`${f.id} failed to load: ${f.why}`);
for (const w of r.rows) {
  if (!w.swapped) fails.push(`${w.id}: not swapped — still on its primitive body`);
  if (!w.bodyHidden) fails.push(`${w.id}: the primitive body is still drawn under the vehicle`);
  if (!(w.tris > 1000)) fails.push(`${w.id}: the vehicle has ${w.tris} triangles`);
  if (w.tyreOverGround == null) fails.push(`${w.id}: no tyres found to stand it on`);
  else if (Math.abs(w.tyreOverGround) > TOL) fails.push(`${w.id}: tyres ${(w.tyreOverGround * 1000).toFixed(1)} mm ${w.tyreOverGround < 0 ? 'INTO' : 'above'} the drawn ground`);
}
/* WALKERS: the same 12 mm band as the vehicles. The primitive people's boots reach 31.4 mm below their
   own origin at the stance (game.mjs HUMANFOOT), and a walker left at logic height on the seal would
   read -171 mm. At least one walker must stand on a RAISED floor, or the check could not see the defect. */
const WTOL = TOL;
if (!r.walkers.length) fails.push('no walkers standing to check');
if (!r.walkers.some(w => w.raised)) fails.push('no walker stands on a raised drawn floor, so this check cannot see a sunk one');
for (const w of r.walkers) if (Math.abs(w.d) > WTOL) fails.push(`${w.who} at ${w.at}: lowest point ${(w.d * 1000).toFixed(1)} mm from the drawn ground`);
if (!r.traffic) fails.push('no traffic car spawned to check');
else if (!r.traffic.dressed || !r.traffic.hidden) fails.push('a traffic car spawned after load does not wear the spike hatch');
console.log(`VEHICLES  models ${r.mode}  ${r.rows.length} spike vehicles  tolerance ${(TOL * 1000).toFixed(0)} mm`);
for (const w of r.rows) console.log(`  ${w.id.padEnd(11)} swapped ${w.swapped}  ${String(w.tris).padStart(6)} tris  tyre ${w.tyreOverGround == null ? '-' : (w.tyreOverGround * 1000).toFixed(1) + ' mm'} over the drawn ground (${w.ground})`);
console.log(`  traffic ${JSON.stringify(r.traffic)}`);
for (const w of r.walkers) console.log(`  ${w.who.padEnd(12)} at ${w.at}  lowest point ${(w.d * 1000).toFixed(1)} mm from the drawn ground`);
console.log(fails.length ? fails.map(f => '    ✗ ' + f).join('\n') + `\nVEHICLES: ${fails.length} FINDINGS` : 'VEHICLES: ALL PASS — every spike vehicle loaded and drawn, vehicles and walkers on the drawn ground');
process.exit(fails.length ? 1 : 0);
