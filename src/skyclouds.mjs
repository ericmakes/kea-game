/* THE SKY'S CLOUDS — SPIKE_ADOPT 25 (Eric 2026-10-04: "the sphere-union cumulus is the last procedural primitive in the
   environment and reads as rendered puffs against the photographic horizon; stop tuning lobes. Build three candidates").
   SKY.cloudMode picks one; this file only does what it says, in the browser (headless never imports it, and the
   procedural clouds are still BUILT there and here — they draw from the seeded stream, and a world that skipped them
   would move every placement after them; here they are only HIDDEN):
     'procedural'  the sphere-union cumulus, as before
     'photo'   (A) the day sky is the photograph alone — the far field's pizzo_pernice dome (SKY.farOn), whose own baked
                   clouds are the clouds; it already crossfades to the painted night dome (uFarDay)
     'cards'   (B) alpha-cut CC0 cumulus photographs (tools/derive_cloud_cards.mjs, Poly Haven kloofendal_48d) on layered
                   billboards at altitude, drifting slowly — about the procedural set's cover
     'hybrid'  (C) the photograph plus a few cards as the near, moving layer
   A CARD is a plane turned about y to face the camera (it is a photograph of a cloud seen from the side), drawn after the
   range in depth (the range occludes it), fog off, unlit: its colour is the photograph's, times SKY.cloudCards.gain,
   which brings a display-referred JPEG to the scene's light under the tone mapper. At night it fades (opacity) and
   darkens (cloudNightTint) with the far field's day factor. Positions come from a local hash of the card index, never
   from the seeded stream. G.cloudCards holds them; the sky key (stripcam SKYKEY) hides them with the rest of the sky. */
import * as THREE from 'three';

export async function installSkyClouds(K) {
  const G = K.G, S = K.SKY, mode = S.cloudMode || 'procedural', C = S.cloudCards || {};
  const hideProcedural = () => { for (const c of G.clouds || []) c.visible = mode === 'procedural'; };
  G.cloudCards = []; G.skyClouds = { mode };
  hideProcedural();
  if (mode !== 'cards' && mode !== 'hybrid') return G.skyClouds;
  const set = C.set, loader = new THREE.TextureLoader();
  const tex = await Promise.all(set.map(f => loader.loadAsync(new URL(C.dir + f, document.baseURI).href)));
  for (const t of tex) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; }
  const layers = mode === 'cards' ? C.layers : C.hybrid;
  const h = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  let n = 0;
  const group = new THREE.Group(); group.name = 'cloudCards';
  for (const L of layers) for (let j = 0; j < L.n; j++, n++) {
    const t = tex[n % tex.length], aspect = t.image.width / t.image.height;
    const w = L.w[0] + (L.w[1] - L.w[0]) * h(n, 1), r = L.r[0] + (L.r[1] - L.r[0]) * h(n, 2), y = L.alt[0] + (L.alt[1] - L.alt[0]) * h(n, 3);
    const az = (j + h(n, 4) * 0.7) / L.n * Math.PI * 2 + (L.phase || 0);
    const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false, color: new THREE.Color(C.gain, C.gain, C.gain) });
    const card = new THREE.Mesh(new THREE.PlaneGeometry(w, w / aspect), m);
    card.userData = { az0: az, r, y, drift: C.drift * (0.7 + 0.6 * h(n, 5)) };
    /* FACE THE CAMERA THAT IS DRAWING IT, not G.cams[0]: a card turned toward the wrong camera is seen nearly edge-on and
       samples a coarse mip — a blocky beige slab (measured at 06 and 30); split screen has two cameras besides */
    card.onBeforeRender = (r, sc, cam) => { card.rotation.set(0, Math.atan2(cam.position.x - card.position.x, cam.position.z - card.position.z), 0); card.updateMatrixWorld(true); };
    card.renderOrder = -1; card.frustumCulled = true; group.add(card); G.cloudCards.push(card);
    /* OUT OF THE POST PASSES' DEPTH, as the procedural wisps are: a card is a transparent quad, and the AO pass read the
       whole quad as a surface — a stair-stepped beige slab at AO's resolution, measured at 06 and 30 */
    (G.postExclude = G.postExclude || []).push(card); }
  let scene = null;
  const dayC = new THREE.Color(C.gain, C.gain, C.gain), nightC = dayC.clone().multiplyScalar(S.cloudNightTint);
  const tick = () => {
    if (G.scene !== scene) { scene = G.scene; hideProcedural(); if (scene) scene.add(group); }
    /* DRIFT ON THE GAME'S CLOCK (G.time, as the grass wind and the water do), so a capture that pins the clock pins the sky */
    const cam = G.cams && G.cams[0], day = G.farU ? G.farU.uFarDay.value : 1, T = G.time || 0;
    for (const c of G.cloudCards) { const u = c.userData, az = u.az0 + u.drift * T;
      c.position.set(Math.sin(az) * u.r, u.y, Math.cos(az) * u.r);
      c.material.opacity = Math.max(0, Math.min(1, 0.15 + 0.85 * day)); c.material.color.copy(nightC).lerp(dayC, day); }
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  Object.assign(G.skyClouds, { cards: G.cloudCards.length, textures: set.length });
  return G.skyClouds;
}
