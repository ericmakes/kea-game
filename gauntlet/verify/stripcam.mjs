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
