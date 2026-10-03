/* THE SPIKE'S CARS, IN WEBGL — SPIKE_ADOPT row 1 (2026-10-03).

   The render spike Eric approved built its vehicles as signed distance fields (its tools/cars.mjs):
   a 3.95 m hatch, a 5.3 m Hilux-class ute, a 5 m caravan and a box trailer, zoned into paint, glass,
   trim, lamps and plate. tools/derive_vehicles.mjs writes them as a PLAIN GLB (no meshopt, no
   quantization, float normals) — this module loads that file, paints it and puts it in the game
   through the P6A seam (src/models.mjs calls buildVehicle for any entry with a `vehicle` block) and,
   for traffic, through G.vehicleDress.

   THE PAINT is the spike's two-layer car paint re-expressed for WebGLRenderer, which has no TSL: a
   MeshPhysicalMaterial (colour coat + clear coat at roughness 0.035) and, in onBeforeCompile, the
   three things that made the spike's cars read as parked at a trailhead rather than in a showroom —
     ROAD DUST rising 35 cm up the body (in the body's own frame, so it is the same on every car)
     GRIME, a world-space noise that breaks the clear coat's roughness so the sky is not a mirror
     PANEL GAPS, 5 mm shut-lines at the doors, bonnet and tailgate, antialiased with fwidth
   THE WHEELS are the spike's lathe tyre with a rounded shoulder and a five-spoke alloy face, built
   from the wheel positions the GLB carries in its node extras, and MERGED to three meshes a car
   (tyre, face, alloy) so the shadow proxies and the draw-call budget are not undone by spokes.
   COLOURS ARE sRGB HEX, as the spike authored them with colour management on; the game runs with
   ColorManagement off, so every hex is converted here explicitly. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const lin = (hex) => new THREE.Color(hex).convertSRGBToLinear();
let LOAD = null;
export function loadVehicles(url) {
  if (!LOAD) LOAD = new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej)).then(gltf => {
    /* A COMPRESSED FILE MUST NOT LOOK LIKE A LOADED ONE. GLTFLoader without a meshopt decoder does not
       stop at the extension: it builds the scene with empty buffers. So the file's own declaration
       is checked, and every body must arrive with real triangles. */
    const req = (gltf.parser && gltf.parser.json && gltf.parser.json.extensionsRequired) || [];
    if (req.length) throw new Error('vehicles: ' + url + ' requires ' + req.join(', ') + ' — run tools/derive_vehicles.mjs');
    const bodies = {};
    for (const n of gltf.scene.children) {
      let tris = 0; n.traverse(o => { if (o.isMesh) { const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
      if (!tris) throw new Error('vehicles: body ' + n.name + ' decoded to no triangles');
      bodies[n.name] = n;
    }
    for (const k of ['hatch', 'ute', 'caravan', 'trailer']) if (!bodies[k]) throw new Error('vehicles: no ' + k + ' in ' + url);
    return { gltf, bodies };
  });
  return LOAD;
}

/* ---- the paint ---- */
const NOISE = `
float kvH(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float kvN(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(kvH(i),kvH(i+vec3(1,0,0)),f.x),mix(kvH(i+vec3(0,1,0)),kvH(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(kvH(i+vec3(0,0,1)),kvH(i+vec3(1,0,1)),f.x),mix(kvH(i+vec3(0,1,1)),kvH(i+vec3(1,1,1)),f.x),f.y),f.z); }
float kvF(vec3 p){ return kvN(p)*0.5+kvN(p*2.0+7.1)*0.25+kvN(p*4.0+13.7)*0.125; }
`;
export function paint(hex, { metal = 0, rough = 0.32, coat = 1, dust = 1, seams = null, L = null } = {}) {
  const m = new THREE.MeshPhysicalMaterial({ color: lin(hex), metalness: metal, roughness: rough,
    clearcoat: coat, clearcoatRoughness: 0.035 });
  const S = (seams && seams.z) || [], NS = Math.max(1, S.length);
  const U = { kvDust: { value: dust }, kvL: { value: new THREE.Vector4(L ? L.ty : 0, L ? L.sy : 1, L ? L.tz : 0, L ? L.sz : 1) },
    kvSeams: { value: Array.from({ length: NS }, (_, i) => S[i] ? new THREE.Vector3(S[i][0], S[i][1], S[i][2]) : new THREE.Vector3(1e4, 0, 0)) },
    kvDustCol: { value: lin(0x6b5f4f) } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 kvW; varying vec3 kvB;\nuniform vec4 kvL;\n' + sh.vertexShader.replace('#include <worldpos_vertex>',
      '#include <worldpos_vertex>\n  kvW=(modelMatrix*vec4(transformed,1.0)).xyz;\n  kvB=vec3(transformed.x*kvL.y, transformed.y*kvL.y+kvL.x, transformed.z*kvL.w+kvL.z);');
    sh.fragmentShader = `varying vec3 kvW; varying vec3 kvB;\nuniform float kvDust; uniform vec3 kvDustCol; uniform vec3 kvSeams[${NS}];\n` + NOISE + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  float kvGrime=kvF(kvW*3.1);
  /* road dust: 35 cm up the body in its own frame, plus a little grime everywhere */
  float kvD=clamp((smoothstep(0.48,0.06,kvB.y)*0.75+kvGrime*0.08)*kvDust,0.0,0.85);
  /* 5 mm panel gaps, kept to a sub-pixel darkening at distance by fwidth */
  float kvGap=0.0;
  for(int i=0;i<${NS};i++){ vec3 s=kvSeams[i]; float dz=abs(kvB.z-s.x), w=fwidth(kvB.z)+0.0025;
    kvGap=max(kvGap, smoothstep(w,0.00125,dz)*step(s.y,kvB.y)*step(kvB.y,s.z)); }
  diffuseColor.rgb=mix(diffuseColor.rgb,kvDustCol,kvD)*(1.0-kvGap*0.75);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor=mix(roughnessFactor,0.85,kvD);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n  metalnessFactor*=(1.0-kvD);')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n  material.clearcoat*=clamp(1.0-kvD*1.1,0.0,1.0);\n  material.clearcoatRoughness=clamp(0.035+kvGrime*0.06,0.0,1.0);');
  };
  m.customProgramCacheKey = () => 'kvPaint' + NS;
  m.name = 'paint';
  return m;
}
const glass = (tint) => new THREE.MeshPhysicalMaterial({ color: tint || new THREE.Color(0.012, 0.014, 0.016),
  roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.52 });
const std = (hex, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: lin(hex), roughness: rough, metalness: metal }, extra));
function zoneMats() {
  return {
    glass: glass(), glassTint: glass(new THREE.Color(0.03, 0.022, 0.015)),
    trim: std(0x161718, 0.62), lightW: std(0xd8dde0, 0.04, 0, { clearcoat: 1 }),
    lightR: std(0x7a0c08, 0.08, 0, { clearcoat: 1, emissive: lin(0x200000) }),
    plate: std(0xe9e7df, 0.45), chassis: std(0x8f9398, 0.45, 1.0), galv: std(0x9da2a6, 0.42, 1.0),
    tarp: std(0x1d7d86, 0.82, 0, { sheen: 0.5, sheenRoughness: 0.6, sheenColor: lin(0x6fc3c8) }),
    stripe: paint(0x4f9a3a, { rough: 0.35, dust: 0.6 }), door: paint(0xe8e7e1, { rough: 0.32, dust: 0.6 }),
  };
}

/* ---- the wheels: the spike's lathe tyre and five-spoke alloy, merged per car by material ---- */
function wheelParts(r, w) {
  const rimR = r * 0.62, pts = [];
  for (let i = 0; i <= 14; i++) { const a = Math.PI * i / 14;
    pts.push(new THREE.Vector2(rimR + (r - rimR) * Math.sin(a) ** 0.55, -w / 2 * Math.cos(a))); }
  const tyre = new THREE.LatheGeometry(pts, 40).rotateZ(Math.PI / 2);
  const face = new THREE.CylinderGeometry(rimR * 1.02, rimR * 1.02, w * 0.70, 32).rotateZ(Math.PI / 2);
  const alloy = [];
  for (const s of [-1, 1]) {
    alloy.push(new THREE.CylinderGeometry(rimR * 0.22, rimR * 0.22, 0.02, 16).rotateZ(Math.PI / 2).translate(s * w * 0.36, 0, 0));
    alloy.push(new THREE.TorusGeometry(rimR * 0.97, 0.012, 6, 40).rotateY(Math.PI / 2).translate(s * w * 0.35, 0, 0));
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2;
      alloy.push(new THREE.BoxGeometry(0.02, rimR * 0.78, 0.05).rotateX(a).translate(s * w * 0.355, Math.cos(a) * rimR * 0.5, Math.sin(a) * rimR * 0.5)); }
  }
  return { tyre, face, alloy: mergeGeometries(alloy.map(g => g.toNonIndexed())) };
}
function wheelsFor(list, alloyHex) {
  const acc = { tyre: [], face: [], alloy: [] };
  for (const wv of list || []) { const p = wheelParts(wv.r, wv.w);
    for (const k in acc) acc[k].push(p[k].toNonIndexed().translate(wv.x, wv.y, wv.z)); }
  const g = new THREE.Group(); g.name = 'wheels';
  const M = { tyre: std(0x1b1b1c, 0.88), face: std(0x141414, 0.7), alloy: std(alloyHex || 0xb8bcc0, 0.32, 1.0) };
  for (const k in acc) if (acc[k].length) { const m = new THREE.Mesh(mergeGeometries(acc[k]), M[k]); m.castShadow = m.receiveShadow = true; g.add(m); }
  return g;
}

/* ---- one vehicle ----
   v = { node:'hatch'|'ute'|'caravan'|'trailer', paint:hex, metal, rough, coat, alloy:hex, ry, mirrorZ }
   Returns a Group in the CAR'S OWN FRAME (y 0 at the ground under the wheels), to be added to the
   placement group the primitive body lived in. */
export function buildVehicle(V, v) {
  const src = V.bodies[v.node], g = new THREE.Group(); g.name = 'vehicle_' + v.node;
  const ud = src.userData || {};
  const L = { ty: src.position.y, sy: src.scale.y, tz: src.position.z, sz: src.scale.z };
  const P = paint(v.paint, { metal: v.metal || 0, rough: v.rough || 0.32, coat: v.coat == null ? 1 : v.coat, seams: ud.seams || null, L });
  const Z = zoneMats();
  const body = src.clone(true);
  body.traverse(o => { if (!o.isMesh) return;
    const zone = o.material && o.material.name;
    o.material = zone === 'paint' ? P : (Z[zone] || P); o.userData.zone = zone;   // the game finds the tarp by zone
    o.castShadow = o.receiveShadow = true; });
  g.add(body);
  g.add(wheelsFor(ud.wheels, v.alloy));
  const inner = new THREE.Group(); inner.add(g);
  if (v.mirrorZ) g.scale.z = -1;       // the spike's caravan has its drawbar at -z; the game's at +z
  if (v.ry) inner.rotation.y = v.ry;
  inner.userData.vehicle = { node: v.node, paint: v.paint, mirrorZ: !!v.mirrorZ, ry: v.ry || 0 };
  return inner;
}
