/* THE STRIP VANTAGE, IN ONE PLACE — the camera, the staging, the ridge bands and the band crop.
   Usage: import { W, H, CAM, QUIET, BANDS, GAMEBAND, RECIPENAME, bandCrop } from './stripcam.mjs'

   WHY THIS FILE EXISTS. terrainstrip.mjs shoots the silhouette strip and platescore.mjs scores it,
   and until this file they would each have carried their own copy of the camera and the ridge
   bands. That is exactly how terrainlab.mjs drifted from the game earlier this session: it kept a
   private copy of the recipes, the game's angle of repose was raised, and the lab's whole selftest
   stayed green while modelling a range nobody shipped. A scorer measuring a band the shooter did
   not shoot would be the same fault with the same silent signature — every number plausible, all of
   them about a different picture.
   terrainstrip.mjs is a top-level script with top-level await, so it cannot be imported without
   running a three-recipe capture pass. Hence a module rather than an export from it. */

export const W=1920, H=620;

/* A LONGER LENS, AND THAT IS THE WHOLE TRICK. At head height with the game's 60-degree vertical
   FOV the range is a thin band behind the carpark — the first attempt came back mostly cars and
   grass, with the mountains occupying about a tenth of the frame. A 40 m peak at r 150 subtends 15
   degrees, so at 60 degrees it can never be more than a quarter of the picture however it is aimed.
   The plates were plainly not shot on a wide lens either.
   So: narrow the FOV to 26 degrees and lift the camera clear of the props. The aim is IDENTICAL
   across every recipe and every iteration — a fair comparison has to be the same camera. */
export const CAM=`KEAGAME.G.camLock={x:0,y:9,z:-46,lx:0,ly:26,lz:160};
  for(const c of KEAGAME.G.cams){ c.fov=26; c.updateProjectionMatrix(); }`;

export const QUIET=`KEAGAME.CASEFILES.forEach(c=>c.seen=true);
  { const td=document.getElementById('todo'); if(td)td.style.display='none'; }
  KEAGAME.G.cfOpen=false; KEAGAME.G.paused=false;
  KEAGAME.G.humans.forEach(h=>{h._park=true;});
  { const _p=()=>{ try{
      KEAGAME.G.humans.forEach(h=>{ if(!h._park)return; h.x=46;h.z=46;h.home={x:46,z:46};
        h.patrol=null; h.state='idle'; h.t=0; if(h.g)h.g.position.set(46,0,46); });
      const fd=document.getElementById('feed'); if(fd)fd.textContent='';
      const td=document.getElementById('todo'); if(td)td.style.display='none';
      KEAGAME.G.time=12.0;
      const k=KEAGAME.G.keas[0]; k.x=46;k.z=46;k.y=0;k.vy=0;k.stun=0;k.grounded=true;
    }catch(e){} requestAnimationFrame(_p); }; requestAnimationFrame(_p); }
  KEAGAME.G.poseLock=true;`;

/* THE RIDGE BANDS, read off the images rather than guessed: nz_alps_01's massif sits in the middle
   third, nz_alps_02's ridge a little lower, and the game's range is the upper-middle of its
   letterbox once the lens is narrowed to 26 degrees. Cropping each image to the band its mountains
   actually occupy is what puts the two ridgelines adjacent at comparable scale — and it is also
   what makes a measurement comparable, since edge density and silhouette roughness are both
   PER PIXEL and mean nothing across two different scales. */
export const BANDS={ nz_alps_01:[0.31,0.80], nz_alps_02:[0.44,0.76] };
export const GAMEBAND=[0.28,0.72];

export function RECIPENAME(r){
  return {a:'broad massifs',b:'serrated aretes',c:'glaciated troughs'}[r]||r; }

/* THE SKY TEST IS PER PLATE, and each one is a measurement rather than a preference. The two skies
   could not be less alike: nz_alps_01 is a deep blue whose LUMA (0.430) is indistinguishable from
   its own frame median (0.439), so a brightness threshold is degenerate there and blue-dominance is
   what separates it; nz_alps_02 is overcast white at 0.851, where blue-dominance finds nothing at
   all and luma is exact. A single "sky test" for both would be wrong for one of them. */
export const PLATESKY={
  nz_alps_01:{ how:'blue-dominance b-r>20 (its sky luma 0.430 equals the frame median 0.439)',
               test:p=>p[2]-p[0]>20 },
  nz_alps_02:{ how:'luma>0.77 (overcast white at 0.851; blue-dominance finds nothing)',
               test:p=>(0.2126*p[0]+0.7152*p[1]+0.0722*p[2])/255>0.77 },
};

/* ==================================================================================
   THE SKY, ITS PLATES AND ITS BAND — SKY.md step 1.
   ================================================================================== */

/* THE BRIEF NAMED FOUR PLATES AND THREE OF THEM HAVE NO SKY IN THEM. SKY.md §2 asks for the sky
   regions of ref_bow_00, _04 and _06 plus nz_alps_01. Measured before use, over the top 22% of each
   frame, as the fraction of pixels whose 3x3 Sobel magnitude is under 0.015 — sky is SMOOTH, a
   eucalypt canopy is the opposite, and that separates "sky in frame" from "trees in frame" without
   needing a colour hypothesis:

       ref_bow_00   6.8% smooth   luma 0.303  hue  28     canopy and a roofline
       ref_bow_04   5.8% smooth   luma 0.405  hue  49     dense gum canopy, white-out behind
       ref_bow_06  11.3% smooth   luma 0.368  hue  38     tree shade over a driveway
       nz_alps_01  98.4% smooth   luma 0.437  hue 212     a genuine deep blue sky

   Looked at, to be sure the number was not the fault: _00 is a brick house under gums, _04 is a
   street framed by a gum, _06 is a driveway in tree shade. The REF_BOW.md board notes agree — those
   three are named as the LIGHT, DENSITY and SHADOW targets, never as skies. The whole 24-frame
   trailer wall was then measured the same way: its only open sky is ref_bow_19/20/21, a CLOUDLESS
   deep blue wedge behind a title card, and ref_bow_13, which is HUD to the horizon. Birds of War
   simply has no frame that can govern cloud form.

   SO THE NZ WALL GOVERNS THE SKY, and the substitutes were chosen by the same measurement:

       nz_carpark_01  63% smooth, 4000x2248  broken cumulus over an alpine basin, dark undersides,
                                             blue gaps, aerial perspective into the ranges — and it
                                             is the CARPARK MAP'S OWN reference photo
       nz_tussock_03  83% smooth,  576x870   clear high-country sky, a strong vertical gradient and
                                             small distant cumulus at the ridge
       nz_alps_01     98% smooth, 1024x577   the saturated deep-blue end, already the terrain pair

   AND nz_alps_02 IS DELIBERATELY NOT IN THE SKY SET, which is a departure from the terrain pass
   worth stating. There, keeping two plates that disagreed loudly was the honest reading of "look
   like these two photographs". Here the disagreement is not style but WEATHER: alps_02 is uniform
   overcast at luma 0.851 and saturation 0.005, and the game renders a fine-weather midday sky
   (G.time is pinned to 12.0 by QUIET). A blue sky scored against an overcast plate would be handed
   a luma band it can only reach by turning white, and with "in band if EITHER plate" that band is
   not a test, it is a loophole. Three fine-weather daytime skies is a tighter set than four, and
   the BOW sky tone is still reported — as ONE NUMBER beside the table, from BOWSKY below, rather
   than as a band a graded title card is in no position to set. */

/* THE SKY CROP IS DERIVED, NOT TYPED. Per column, the topmost row that is definitely NOT sky —
   strongly green (g - max(r,b) > 8, i.e. vegetation) or dark (luma < 0.25, i.e. rock, tree,
   shadow) — and the band is [0, min over ALL columns], so the crop contains sky in every column of
   the frame. The margin is printed with each entry because that is the number that would have to
   move for the crop to be wrong. This is the same discipline that fixed terrainvalue.mjs: a crop
   read off the image, stated, rather than a fraction remembered from a previous session. */
export const SKYBANDS={ nz_carpark_01:[0.00,0.34], nz_tussock_03:[0.00,0.14], nz_alps_01:[0.00,0.30] };

export const SKYPLATES={
  nz_carpark_01:{ test:null,
    how:'the whole crop — the topmost non-sky pixel in ANY column sits at 0.349 of the frame '+
        'height, below the 0.34 band, so no per-pixel mask is needed and none is used',
    what:'cloud form, underside shading, aerial perspective' },
  nz_tussock_03:{ test:null,
    how:'the whole crop — nearest non-sky pixel at 0.147, below the 0.14 band',
    what:'sky gradient and tone, clear high country' },
  /* alps_01 is the one plate whose band cannot be a pure crop: a single peak reaches 0.099 while
     90% of columns are sky to 0.325, and a 0.09 crop is 244 px of picture. So it keeps a mask, and
     the mask is the one PLATESKY already states for it, with a margin of 75: its sky reads b-r
     95..104 against a threshold of 20, and the ground below reads p95 = 60. */
  nz_alps_01:{ test:p=>p[2]-p[0]>20,
    how:'blue-dominance b-r>20 inside a 0.30 band — sky reads b-r 95..104, ground p95 60',
    what:'the saturated deep-blue end' },
};

/* THE BOW SKY, AS A REPORTED NUMBER AND NOT A BAND. ref_bow_20 is the trailer's only frame with
   open sky; it is a cloudless wedge behind a title card, heavily graded, so it can say what colour
   the reference sky IS and nothing about what shape a cloud is. b-r>40 inside the top 30% picks
   the blue and rejects both the white title (neutral, b-r ~0) and the canopy (negative). */
export const BOWSKY={ plate:'ref_bow_20', band:[0.00,0.30], test:p=>p[2]-p[0]>40 };

/* THE GAME'S SKY BAND, derived from the flag frame the same way the plates' crops are — the
   topmost row of the strip that the range mask claims in ANY column. Filled in by the first sky
   shoot rather than guessed; see skyScore, which recomputes it from the flag frame every run and
   warns if the constant has drifted from what the picture says. */
export const SKYGAMEBAND=[0.00,0.384];

/* THE FLAG FRAME FOR THE SKY IS THE TERRAIN FLAG INVERTED. The terrain pass painted the RANGE
   magenta through its own haze uniform and took the subject as the magenta pixels. Here the DOME
   and its haze band go magenta and the clouds and the sun sprite are hidden, so the magenta pixels
   are exactly the pixels where you can see sky — geometry-derived, with no colour threshold
   anywhere near real content. Four sky detectors were built and thrown away during the terrain
   pass; this is not a fifth, it is the same flag trick pointed the other way.
   THE DOME'S vertexColors MUST GO OFF. Its material.color multiplies the per-vertex gradient, so
   setting the colour alone paints a magenta GRADIENT and the dark end fails any tolerance.
   THE HUD IS HIDDEN, and that is not cosmetic: the top bar and the feed sit over the top of the
   frame, which for the sky IS the subject. terrainvalue.mjs excludes the HUD strips for the same
   reason and found the same fault the hard way — three vantages reporting a "band" at the same row
   as the top bar's own edge. */
export const SKYFLAG=`(()=>{ const G=KEAGAME.G;
  document.querySelectorAll('.hud,#mutebtn').forEach(e=>{e.style.display='none';});
  const M=new THREE.Color(0xFF00FF);
  if(G.sky){ G.sky.material.vertexColors=false; G.sky.material.color=M.clone();
             G.sky.material.needsUpdate=true; }
  if(G.haze){ G.haze.material.color=M.clone(); G.haze.material.opacity=1;
              G.haze.material.needsUpdate=true; }
  if(G.sunSprite)G.sunSprite.visible=false;
  (G.clouds||[]).forEach(c=>{c.visible=false;});
})();`;

/* THE SHIP FRAME FOR THE SKY hides the HUD and nothing else. Same reason, same rows. */
/* #mutebtn IS NOT .hud, AND IT SITS IN THE SKY. It is `class="muted"`, so the first version of
   this hid the top bar and the feed and left a rounded grey button with the word "sound" on it in
   the top right of the strip — visible in the first composite, right in the middle of the region
   being measured. The flag frame excluded it from the mask correctly (it is DOM, so it was never
   magenta), which means the NUMBERS were right and the PICTURE I was judging by eye had a button
   in it. Both have to be clean. */
export const SKYQUIET=`document.querySelectorAll('.hud,#mutebtn').forEach(e=>{e.style.display='none';});`;

/* THE CLOUD-FORM PLATE, WHICH IS A DIFFERENT PLATE FROM THE SKY ONES AND DELIBERATELY SO.
   nz_alps_02 is out of the scored SKY set above because it is overcast and a blue sky judged
   against it gets a luma band it can only reach by turning white. But Eric named it for cloud FORM
   — "flat-bottomed, horizontally stretched, soft-topped, greyer and shadowed underneath, and varied
   from wisps to towers" — and looked at, that is exactly what it is: a layered stratocumulus deck
   with visible flat bases, thin wisps at the top right and thicker banks below.
   ITS WHOLE CROP IS CLOUD, which is the property that makes it usable here and unusable for tone.
   The cloud mask refuses it as wall-to-wall, correctly; for a FORM measurement that refusal is the
   point, because there is no cloud/sky boundary to find and none is needed.
   THE CROP IS DERIVED THE SAME WAY EVERY OTHER ONE IS: the topmost row that is definitely not sky,
   in any column, sits at 0.217, so a 0.21 band is pure cloud in every column. */
export const SKYFORM={ plate:'nz_alps_02', band:[0.00,0.21],
  what:'a layered deck: flat bases, horizontal stretch, grey undersides, wisps through to banks' };
