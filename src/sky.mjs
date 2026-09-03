/* THE SKY — REPLAT P2 (2026-09-03).
   The HDRI environment map, loaded and convolved into image-based light.

   WHY IT IS NOT IN game.mjs. Exactly the reason post.mjs is not: the gauntlet loads game.mjs as a
   TEXT SPECIMEN and evaluates it with THREE injected, and keasrc.js asserts that file has exactly
   ONE import. Adding HDRLoader here would break all nine batteries at once. So the recipe — every
   constant, the fog, the sun, the shadow config — lives in game.mjs where the batteries can read
   it, and only the LOADING lives out here, wired from the browser entry where no battery looks.

   WHY THE FILE IS FETCHED AND NOT BUNDLED. Vite would happily inline a 1.5MB .hdr as a base64
   data URI, which inflates it by a third and buries it in dist/kea.js — the single chunk the gate
   md5s and the capture rig serves. A look asset has no business changing that hash. It is copied
   through publicDir instead (see vite.config.mjs) and requested by URL, which is also the only
   thing HDRLoader takes.

   WHY THE GAME DOES NOT WAIT FOR IT. initRenderer has already installed the painted-gradient
   environment by the time this runs, so the first frame is lit. The HDRI replaces it when it
   arrives. A slow network therefore costs fidelity for a few hundred milliseconds rather than
   showing a black page or a dead-looking one, and a network that fails outright costs only the
   upgrade — which is the same law post.mjs follows: a look feature must not be able to take the
   game down. */
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

/* HDRLoader, not RGBELoader. Same parser — RGBELoader is a deprecated alias in r185 and prints
   "RGBELoader has been deprecated" on every load. Measured that warning while sampling these
   files, so the non-deprecated name is used from the start rather than after a future removal. */

export function skyURL(KEAGAME) {
  const SKY = KEAGAME.SKY;
  /* RELATIVE, because vite is configured base:'./' and the capture rig serves dist/ from a
     loopback root while a real deploy may sit in a subdirectory. An absolute '/hdri/...' would
     work in the rig and 404 in the subdirectory, which is the worst of the two failure shapes:
     it would pass every check here and degrade only in the place nobody photographs. */
  return new URL(SKY.hdri, document.baseURI).href;
}

export function installSky(KEAGAME) {
  const G = KEAGAME.G, SKY = KEAGAME.SKY;
  if (!G.renderer) throw new Error('sky: no renderer to build a PMREM with');
  if (!G.scene) throw new Error('sky: no scene to light');

  const url = skyURL(KEAGAME);
  return new Promise((resolve, reject) => {
    new HDRLoader().load(url, tex => {
      try {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        /* PMREM, not the raw equirect. Assigning an equirectangular texture straight to
           scene.environment makes three build a mip chain by ordinary filtering, which is wrong
           for roughness: a rough surface must integrate a WIDE cone of the environment, and
           box-filtered mips do not approximate that. PMREMGenerator prefilters per roughness
           level, which is what makes a rough weatherboard read as rough instead of as a blurry
           mirror. It also collapses the resolution question — see assets/LICENCES.md on why 1k
           is not a compromise here. */
        const pm = new THREE.PMREMGenerator(G.renderer);
        pm.compileEquirectangularShader();
        const env = pm.fromEquirectangular(tex).texture;
        pm.dispose();
        /* the source texture has done its job; the convolved cube is what the scene keeps */
        tex.dispose();

        const prev = G.scene.environment;
        G.scene.environment = env;
        /* Intensity and rotation are NOT set here. initScene already set both from the same SKY
           constants, and nightApply drives the intensity every frame the sky is rolling — so
           writing them again from this module would create a second author for one value and a
           race with the day/night lerp. This module owns the TEXTURE and nothing else. */
        if (prev && prev.dispose) prev.dispose();   // release the painted fallback's cube

        G.ibl = Object.assign(G.ibl || {}, {
          mode: 'hdri', source: SKY.hdri, url, pmrem: true,
          rotationY: SKY.envRotationY, intensity: G.scene.environmentIntensity,
        });
        resolve(G.ibl);
      } catch (e) { reject(e); }
    }, undefined, err => reject(new Error('sky: could not load ' + url + ' — ' + (err && err.message || err))));
  });
}
