/* GROUNDTRUTH — does the game know where its DRAWN ground is? 2026-10-02, the feet piece.

   BIRDFEET found the bird's soles exactly on groundHeightAt and the bird still sunk in 18_rear_close:
   the carpark seal is drawn as a 0.14 m box sitting ON y=0, so its top is 14 cm above the height
   every walker stands at. The first cut of this tool was the SURVEY that found the class (every
   map's 240 m plane carries +-0.1..0.2 m of display relief groundHeightAt never sees; every seal,
   groomed run, road and path is a 0.10..0.28 m box on y=0). The fix is render-only — walkers are
   drawn at logic y + drawnLift — so the logic heights are SUPPOSED to differ from the drawing now,
   and what has to be true instead is that drawnGroundAt is the drawing. That is what this asserts.
   For each map, a STEP-m grid over the play box, at every cell whose logic ground is the base or the
   range (not a collider top — where the lift applies): a ray straight down through every drawn
   mesh (keas, instanced grass, skinned meshes, sprites and points excluded; water counts), first UPWARD face below 0.40 m = the surface a walker's feet meet. FINDING when
   |surface - drawnGroundAt| > TOL. Findings are grouped by mesh so the report names the offender.
   CONTROL=1 answers a flat 0 for every cell in place of drawnGroundAt — the pre-fix world — and
   must FAIL: the battery has to see the defect it was written for.
   Usage: node gauntlet/verify/groundtruth.mjs      BIOMES=carpark,skifield  TOL=0.02  STEP=1  CONTROL=1 */
import { ensureBuild, serve, preparePage, assertBooted, launch, GAUNTLETSEED } from './webrig.mjs';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TOL = +(process.env.TOL || 0.02), STEP = +(process.env.STEP || 1);
/* THE WHOLE PLAY BOX by default. RANGE_R0 narrows it to a disc, for isolating a finding. */
const RANGE_R0 = +(process.env.RANGE_R0 || 999);
const BIOMES = (process.env.BIOMES || 'carpark,skifield,campground,village,river,station').split(',');
ensureBuild();
const srv = await serve(); const browser = await launch();
let total = 0; const out = [];
try {
  for (const biome of BIOMES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 320, height: 180, deviceScaleFactor: 1 });
    await preparePage(page, { seed: GAUNTLETSEED, biome });
    await page.goto(srv.origin, { waitUntil: 'load' }); await sleep(800);
    await assertBooted(page, { biome });
    const r = await page.evaluate(({ TOL, STEP, R0, DBG, CTL }) => {
      const G = KEAGAME.G, own = new Set();
      for (const k of G.keas || []) k.g && k.g.traverse(o => own.add(o));
      /* WATER IS A FLOOR: transparent meshes are included, as the lookup includes them — a walker
         on the river stands on its surface rather than vanishing under it */
      const meshes = []; G.scene.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && !own.has(o)
          && o.material && !Array.isArray(o.material) && o.material.visible !== false
          && o.material.depthWrite !== false                             // a shadow blob or decal is not a floor
          && !o.userData.shadowProxy) {                                   // nor a shadow proxy (src/shadows.mjs): never drawn
        let vis = true, p = o; while (p) { if (!p.visible) vis = false; p = p.parent; } if (vis) meshes.push(o); } });
      const RANGE_R0 = R0;
      /* ITS OWN VERTICAL RAY, NOT three's Raycaster: measured, Mesh.raycast hit and missed the same
         snow-mound face depending only on where the ray started (3.0 m hit, 2.5 m missed, 2.0 m hit).
         Every drawn triangle in world space, bucketed by 1 m cell; at each grid point the highest
         UPWARD face (by the winding three draws) is the surface. Brute force and independent of
         everything in game.mjs it is checking. */
      const B = new Map(), v = new THREE.Vector3(), key = (i, k) => i * 4096 + k;
      for (const o of meshes) {
        const g = o.geometry, P = g.attributes.position, I = g.index; if (!P) continue;
        /* a mesh that starts more than 3 m up (a cloud) is sky, not something a walker stands under */
        if (new THREE.Box3().copy((g.computeBoundingBox(), g.boundingBox)).applyMatrix4(o.matrixWorld).min.y > 3) continue;
        const W = new Float32Array(P.count * 3);
        /* water at its STILL surface (G.water[].base), not this frame's ripple — the floor the lookup promises */
        const wb = (G.water || []).find(w => w.m === o);
        for (let q = 0; q < P.count; q++) { v.fromBufferAttribute(P, q); if (wb) v.z = wb.base[q]; v.applyMatrix4(o.matrixWorld); W[q * 3] = v.x; W[q * 3 + 1] = v.y; W[q * 3 + 2] = v.z; }
        const nt = (I ? I.count : P.count) / 3, side = o.material.side;   // 0 front, 1 back, 2 double
        for (let t = 0; t < nt; t++) {
          const a = (I ? I.getX(t * 3) : t * 3) * 3, b = (I ? I.getX(t * 3 + 1) : t * 3 + 1) * 3, c = (I ? I.getX(t * 3 + 2) : t * 3 + 2) * 3;
          const ax = W[a], ay = W[a + 1], az = W[a + 2], bx = W[b], by = W[b + 1], bz = W[b + 2], cx = W[c], cy = W[c + 1], cz = W[c + 2];
          const ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
          const ux = (by - ay) * (cz - az) - (bz - az) * (cy - ay), uz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
          /* SEEN FROM ABOVE is decided by the material's side, not the winding alone: the sky dome is
             drawn BackSide, and by winding its crown is an 'upward face' 150 m up over every cell —
             which made the first run of this a vacuous pass with every cell 'under a prop' */
          const up = ny > 0.3 * Math.hypot(ux, ny, uz), dnf = -ny > 0.3 * Math.hypot(ux, ny, uz);
          if (!(side === 0 ? up : side === 1 ? dnf : (up || dnf))) continue;
          const mnx = Math.min(ax, bx, cx), mxx = Math.max(ax, bx, cx), mnz = Math.min(az, bz, cz), mxz = Math.max(az, bz, cz);
          if (mxx < -53 || mnx > 53 || mxz < -53 || mnz > 53) continue;
          const T = [ax, ay, az, bx, by, bz, cx, cy, cz, ny, o];
          for (let gi = Math.floor(Math.max(-53, mnx)); gi <= Math.floor(Math.min(53, mxx)); gi++)
            for (let gk = Math.floor(Math.max(-53, mnz)); gk <= Math.floor(Math.min(53, mxz)); gk++) {
              const kk = key(gi + 2048, gk + 2048); let L = B.get(kk); if (!L) B.set(kk, L = []); L.push(T); } }
      }
      const surfaceAt = (px, pz) => {
        let best = -Infinity, obj = null;
        for (const T of B.get(key(Math.floor(px) + 2048, Math.floor(pz) + 2048)) || []) {
          const [ax, ay, az, bx, by, bz, cx, cy, cz, A] = T;
          const w0 = ((bz - pz) * (cx - px) - (bx - px) * (cz - pz)) / A, w1 = ((cz - pz) * (ax - px) - (cx - px) * (az - pz)) / A, w2 = 1 - w0 - w1;
          if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
          const y = w0 * ay + w1 * by + w2 * cy; if (y > best) { best = y; obj = T[10]; } }
        return obj ? { y: best, object: obj } : null;
      };
      const by = {};
      let cells = 0, worst = 0, props = 0, worstAt = null;
      /* DEBUGAT='x,z' lists every upward face under that point, and what the lookup says about it */
      let debug = null;
      if (DBG) { const [dx, dz] = DBG; const L = [];
        for (const T of B.get(key(Math.floor(dx) + 2048, Math.floor(dz) + 2048)) || []) {
          const [ax, ay, az, bx, by_, bz, cx, cy, cz, A] = T;
          const w0 = ((bz - dz) * (cx - dx) - (bx - dx) * (cz - dz)) / A, w1 = ((cz - dz) * (ax - dx) - (cx - dx) * (az - dz)) / A, w2 = 1 - w0 - w1;
          if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
          L.push([+(w0 * ay + w1 * by_ + w2 * cy).toFixed(4), T[10].geometry.type, T[10].position.toArray().map(v => +v.toFixed(2)), [w0, w1, w2].map(v => +v.toFixed(3)), [ay, by_, cy].map(v => +v.toFixed(3))]); }
        debug = { faces: L.sort((a, b) => b[0] - a[0]), lookup: KEAGAME.drawnGroundAt(dx, dz), explain: KEAGAME.drawnGroundExplain(dx, dz) }; }
      for (let x = -52; x <= 52; x += STEP) for (let z = -52; z <= 52; z += STEP) {
        if (Math.hypot(x, z) >= RANGE_R0) continue;
        const base = Math.max(0, KEAGAME.terrainHeightAt(x, z));
        if (KEAGAME.groundHeightAt(x, z, 1e3) > base + 0.02) continue;   // a collider top: the prop IS the logic, no lift
        const h = surfaceAt(x + 1e-4, z + 1e-4);
        if (!h) continue;
        /* A PROP IS NOT A FLOOR: a rock, a cone, a rail at knee height, a post (under 0.25 m^2 in plan,
           or over 1 m tall and not ground-sized) or a mesh that does not rest on the ground is
           counted separately and never failed here — whether a kea should walk THROUGH
           it is a collider question, not a drawn-ground one */
        const ob = new THREE.Box3().copy((h.object.geometry.computeBoundingBox(), h.object.geometry.boundingBox)).applyMatrix4(h.object.matrixWorld);
        const oarea = (ob.max.x - ob.min.x) * (ob.max.z - ob.min.z);
        if (!/^(Box|Cylinder|Circle|Ring|Plane|Buffer)Geometry$/.test(h.object.geometry.type) || ob.min.y > 0.15 || oarea < 0.25 || (ob.max.y > 1.0 && oarea < 4)) { props++; continue; }
        cells++;
        const d = h.y - (CTL ? 0 : KEAGAME.drawnGroundAt(x + 1e-4, z + 1e-4)); if (Math.abs(d) > worst) { worst = Math.abs(d); worstAt = [x, z, h.object.geometry.type]; }
        if (Math.abs(d) <= TOL) continue;
        const o = h.object, mk = o.uuid;
        const e = by[mk] || (by[mk] = { geom: o.geometry.type, pos: o.getWorldPosition(new THREE.Vector3()).toArray().map(v => +v.toFixed(2)),
          size: (o.geometry.computeBoundingBox(), o.geometry.boundingBox.getSize(new THREE.Vector3()).toArray().map(v => +v.toFixed(2))), n: 0, dmin: 1e9, dmax: -1e9, at: [x, z] });
        e.n++; e.dmin = Math.min(e.dmin, d); e.dmax = Math.max(e.dmax, d);
      }
      const grid = Math.pow(Math.floor(104 / STEP) + 1, 2);
      return { debug, cells, grid, worst, worstAt, props, offenders: Object.values(by).sort((a, b) => b.n - a.n) };
    }, { TOL, STEP, R0: RANGE_R0, CTL: !!process.env.CONTROL, DBG: process.env.DEBUGAT ? process.env.DEBUGAT.split(',').map(Number) : null });
    if (r.debug) console.log(biome, 'DEBUGAT', JSON.stringify(r.debug, null, 0));
    out.push({ biome, ...r }); total += r.offenders.reduce((s, o) => s + o.n, 0);
    /* NOT VACUOUS: at least half the grid must actually have been measured */
    if (r.cells < r.grid * 0.5) { total++; r.vacuous = true; }
    await page.close();
  }
} finally { await browser.close().catch(() => {}); await srv.close(); }
if (process.env.JSON) console.log(JSON.stringify(out, null, 1));
console.log(`GROUNDTRUTH  tolerance ±${(TOL * 1000).toFixed(0)} mm  step ${STEP} m`);
for (const b of out) {
  console.log(`  ${b.biome.padEnd(11)} ${b.vacuous ? '[VACUOUS — under half the grid measured] ' : ''}${b.cells} walkable cells (${b.props} under props), worst |drawn - drawnGroundAt| ${(b.worst * 1000).toFixed(1)} mm${b.worst > 0.005 ? " at " + b.worstAt : ""}, ${b.offenders.length} offending meshes`);
  for (const o of b.offenders.slice(0, 8)) console.log(`     ${String(o.n).padStart(5)} cells  ${o.geom} at ${o.pos} size ${o.size}  drawn-minus-lookup ${(o.dmin * 1000).toFixed(0)}..${(o.dmax * 1000).toFixed(0)} mm  e.g. (${o.at})`);
}
console.log(total ? `GROUNDTRUTH: ${total} FINDINGS` : 'GROUNDTRUTH: ALL PASS — drawnGroundAt is the drawn ground on every walkable cell');
process.exit(total ? 1 : 0);
