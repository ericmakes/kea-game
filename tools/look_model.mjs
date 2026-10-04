/* LOOK AT A MODEL — the +Z-front check tools/accept_generated.mjs cannot make from geometry. Renders a GLB in a bare
   three.js page (headless Chrome via puppeteer) from three cameras: FROM +Z (where MODEL_MANIFEST's front must face),
   from +X (the side), and from above, each labelled, on a 1 m grid with the +Z axis drawn, under a plain sun and sky
   light. One PNG, three panels. Usage: node tools/look_model.mjs <model.glb> <out.png> */
import fs from 'fs'; import path from 'path'; import http from 'http'; import url from 'url';
import { launch } from '../gauntlet/verify/webrig.mjs';   // the rig's own browser launch (its fallbacks are what work on this machine)
const [GLB, OUT] = process.argv.slice(2);
if (!GLB || !OUT) { console.error('usage: node tools/look_model.mjs <model.glb> <out.png>'); process.exit(2); }
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html' };
const PAGE = `<!doctype html><html><body style="margin:0;background:#bbb"><canvas id=c width=1500 height=500></canvas>
<script type=importmap>{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type=module>
import * as THREE from 'three'; import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
r.setScissorTest(true); const scene = new THREE.Scene(); scene.background = new THREE.Color(0xd8dce0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x887766, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(4, 8, 6); scene.add(sun);
const g = await new GLTFLoader().loadAsync('/model.glb'); scene.add(g.scene);
const bb = new THREE.Box3().setFromObject(g.scene), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3()), R = Math.max(sz.x, sz.y, sz.z);
const grid = new THREE.GridHelper(Math.ceil(R * 1.6), Math.ceil(R * 1.6), 0x666666, 0x999999); scene.add(grid);
const ax = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0.01, 0), R * 0.9, 0x0044ff, R * 0.12, R * 0.06); scene.add(ax);
const views = [[0, 0.35, 2.6], [2.6, 0.35, 0], [0.01, 3.0, 0.01]];
views.forEach((v, i) => { const cam = new THREE.PerspectiveCamera(35, 1, 0.01, 100); cam.position.set(c.x + v[0] * R, c.y + v[1] * R, c.z + v[2] * R); cam.lookAt(c);
  r.setViewport(i * 500, 0, 500, 500); r.setScissor(i * 500, 0, 500, 500); r.render(scene, cam); });
window.__done = { size: [sz.x, sz.y, sz.z].map(v => +v.toFixed(3)), min: [bb.min.x, bb.min.y, bb.min.z].map(v => +v.toFixed(3)) };
</script></body></html>`;
const srv = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/') { s.writeHead(200, { 'content-type': 'text/html' }); return s.end(PAGE); }
  const f = u === '/model.glb' ? path.resolve(GLB) : path.join(ROOT, u);
  if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); }).listen(0);
const port = srv.address().port, browser = await launch();
try { const p = await browser.newPage(); await p.setViewport({ width: 1500, height: 500 });
  await p.goto('http://127.0.0.1:' + port + '/'); await p.waitForFunction('window.__done', { timeout: 60000 });
  const info = await p.evaluate('window.__done');
  await p.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;top:0;left:0;width:1500px;display:flex;font:16px Helvetica;color:#000';
    for (const t of ['FROM +Z (the front must face here)', 'FROM +X (side)', 'FROM ABOVE (+Z down the page)']) { const s = document.createElement('div'); s.style.cssText = 'width:500px;padding:6px;background:rgba(255,255,255,.7)'; s.textContent = t; d.appendChild(s); }
    document.body.appendChild(d); });
  await p.screenshot({ path: OUT }); console.log('LOOK_MODEL ' + GLB + ' -> ' + OUT + '  box ' + info.size.join(' x ') + '  min ' + info.min.join(', '));
} finally { await browser.close(); srv.close(); }
