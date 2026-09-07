/* TERRAIN LAB — the heightfield's arithmetic, offline, before any of it touches the game.
   Usage: node gauntlet/verify/terrainlab.mjs [recipe]   ->  gauntlet/capture/TERRAIN_<recipe>_*.png
          RECIPES=a,b,c node gauntlet/verify/terrainlab.mjs      all of them, for the strip

   WHY THIS EXISTS. TERRAIN.md replaces the cone ring with a procedural heightfield, and the thing
   Eric picks is a SILHOUETTE FAMILY. Iterating a noise stack through the game means a Vite rebuild
   and a headless browser per look — about forty seconds a try — and it means editing the specimen,
   which cannot be done while a consensus re-pin is shooting. None of the arithmetic needs three.js:
   it is a height function, an erosion pass and a projection. So it lives here first, runs in under
   a second, and gets ported once it is right.

   IT RENDERS THREE THINGS PER RECIPE, and the third is the one that matters:
     PLAN     a top-down heightmap of the annulus. Reads like a map: are the ridgelines wandering,
              do the valleys go somewhere, is the erosion cutting gullies.
     RELIEF   lambert-shaded from the game's own sun direction. This is where an arête either looks
              like an arête or looks like a crease.
     SKYLINE  for an eye at the centre, the maximum elevation angle at each azimuth — which IS the
              silhouette, the actual thing being judged, reduced to a curve that can be measured
              and compared between recipes rather than admired.

   THE NOISE IS DETERMINISTIC AND DEPENDENCY-FREE — an integer hash, not Math.random — because the
   game's copy must be too: every seeded draw in a biome build depends on rnd()'s call order
   (TODO 47), so the terrain must derive its shape from position and never draw. Writing it that way
   here means the port is a copy rather than a rewrite. */
import fs from 'fs'; import path from 'path'; import url from 'url';
import { execSync } from 'child_process';
const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');
const OUT=path.join(ROOT,'gauntlet/capture');

/* ---------- deterministic value noise ---------- */
const hash2=(x,y)=>{ let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);
  h=Math.imul(h^(h>>>13),1274126177); return ((h^(h>>>16))>>>0)/4294967296; };
const smooth=t=>t*t*(3-2*t);
function vnoise(x,y){
  const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
  const a=hash2(xi,yi), b=hash2(xi+1,yi), c=hash2(xi,yi+1), d=hash2(xi+1,yi+1);
  const u=smooth(xf), v=smooth(yf);
  return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
}
/* BAND-LIMITED, AND THIS IS THE MOST IMPORTANT LINE IN THE FILE. An octave whose wavelength is
   finer than about twice the grid spacing cannot be represented: it aliases, and on a POLAR grid
   whose cell width runs 0.90 m at the inner edge to 3.03 m at the rim it aliases DIFFERENTLY at
   different radii, which reads as a rendering bug rather than as rock.
   MEASURED, BEFORE THE LIMIT EXISTED: recipe b ran five ridged octaves from f=0.034 at lacunarity
   2.3, so its finest octave had a wavelength near one metre against two-to-three-metre cells. Its
   skyline came back with 33 single-sample NEEDLES, the worst standing 2.56 degrees clear of both
   its neighbours — about a 41-pixel spike with nothing beside it in a 60-degree frame. Those are
   not aretes. An arete is a crest several samples wide; a one-sample spike is the grid failing.
   `cell` is the local sample spacing in metres. Octaves finer than 2*cell are dropped, and the
   normalisation drops with them so the amplitude does not quietly fall as the limit bites. */
function fbm(x,y,oct,lac,gain,cell){
  let s=0, amp=1, f=1, norm=0;
  for(let i=0;i<oct;i++){
    if(cell&&1/f<2*cell*FREQSCALE)break;
    s+=vnoise(x*f,y*f)*amp; norm+=amp; amp*=gain; f*=lac; }
  return norm>0?s/norm:0.5;
}
/* RIDGED: turn the noise's troughs into crests. This is the term a cone can never have. */
function ridged(x,y,oct,lac,gain,sharp,cell){
  let s=0, amp=1, f=1, norm=0;
  for(let i=0;i<oct;i++){
    if(cell&&1/f<2*cell*FREQSCALE)break;
    const n=1-Math.abs(vnoise(x*f,y*f)*2-1);
    s+=Math.pow(n,sharp)*amp; norm+=amp; amp*=gain; f*=lac; }
  return norm>0?s/norm:0;
}
/* the noise is sampled in units where one unit is one metre times the recipe's own frequency, so
   the octave's world wavelength is 1/(f * recipeF). FREQSCALE carries the recipe frequency into
   the Nyquist test; it is set per call site below. */
let FREQSCALE=1;

/* ---------- the recipes. THIS is what Eric picks between. ---------- */
export const RECIPES={
  /* a — BROAD MASSIFS: few big mountains, fBm-dominant, gentle arêtes. The Aoraki side of the
       range: large simple forms with long ridges running off them. */
  a:{ name:'broad massifs',
      warp:{f:0.010,amp:26}, fbm:{f:0.016,oct:5,lac:2.1,gain:0.52,amp:1.00},
      ridge:{f:0.022,oct:4,lac:2.2,gain:0.50,sharp:2.0,amp:0.55},
      valleys:5, valleyW:0.20, valleyDepth:0.42, erode:{iters:12,talus:0.55,rate:0.42} },
  /* b — SERRATED: ridge-dominant, high frequency, many sharp peaks. The Darran/Kaikoura read:
       a saw of arêtes with cirques between them. */
  b:{ name:'serrated aretes',
      warp:{f:0.016,amp:34}, fbm:{f:0.022,oct:5,lac:2.2,gain:0.48,amp:0.62},
      ridge:{f:0.034,oct:5,lac:2.3,gain:0.55,sharp:2.8,amp:1.00},
      valleys:7, valleyW:0.13, valleyDepth:0.52, erode:{iters:18,talus:0.68,rate:0.48} },
  /* c — GLACIATED: deep U-valleys and big scree, moderate ridging. The Hooker/Tasman read:
       massifs separated by broad flat-floored troughs. */
  c:{ name:'glaciated troughs',
      warp:{f:0.012,amp:30}, fbm:{f:0.018,oct:5,lac:2.0,gain:0.55,amp:0.85},
      ridge:{f:0.026,oct:4,lac:2.1,gain:0.52,sharp:2.3,amp:0.75},
      valleys:4, valleyW:0.30, valleyDepth:0.68, erode:{iters:26,talus:1.60,rate:0.55} },
};

/* ---------- the annulus ---------- */
export const RING={ r0:55, r1:185, nTheta:384, nR:72, peakH:56, footH:9 };

/* build(recipe) -> {H: Float32Array[nR*nTheta], scree: Float32Array} in metres */
export function build(R){
  const {nTheta,nR,r0,r1}=RING;
  const H=new Float32Array(nR*nTheta);
  /* THE AMPLITUDE RAMPS WITH RADIUS, which is what makes one annulus serve the foothills AND the
     mountains — Eric asked for both. Zero at the inner edge so it meets the existing ground plane
     exactly, rolling by the middle, alpine at the rim. */
  const RAMP=new Float32Array(nR);
  for(let j=0;j<nR;j++){
    const t=j/(nR-1), r=r0+(r1-r0)*t;
    /* smoothstep in, so the seam has no crease, then a strong ramp out to the peaks */
    /* THE CREST IS INSIDE THE RIM, NOT AT IT, and this was a real bug found by measuring where the
       skyline's needles came from: mean radius 179-185 m, the outermost ring. Elevation angle is
       h/r so the highest ground usually wins the silhouette, the ramp put the highest ground at the
       boundary, and the boundary is the one place with the coarsest cells and — see the erosion
       loop — no erosion at all. The single ring that FORMS the skyline was the single ring getting
       no smoothing.
       So the ramp peaks at 0.82 of the way out and falls away behind, which is also what a range
       actually does: a crest line with ground dropping away beyond it. The rim then sits below the
       crest and stops being the silhouette. */
    const crest=0.82;
    const rise=Math.pow(Math.min(1,t/crest),1.7);
    const fall=t>crest?1-0.26*smooth((t-crest)/(1-crest)):1;
    const ramp=smooth(Math.min(1,t/0.22))*
               (RING.footH+(RING.peakH-RING.footH)*rise)/RING.peakH*fall;
    RAMP[j]=ramp;
    for(let i=0;i<nTheta;i++){
      const ang=i/nTheta*Math.PI*2;
      let x=Math.cos(ang)*r, y=Math.sin(ang)*r;
      /* 1. DOMAIN WARP FIRST — offset the sample point so ridgelines wander instead of radiating.
            Applied after this and it merely blurs the result. */
      const wx=fbm(x*R.warp.f, y*R.warp.f, 3,2.0,0.5)*2-1;
      const wy=fbm(x*R.warp.f+31.7, y*R.warp.f-17.3, 3,2.0,0.5)*2-1;
      x+=wx*R.warp.amp; y+=wy*R.warp.amp;
      /* 2. fBm massif  +  3. ridged arêtes, both BAND-LIMITED to this ring's cell size. The
            angular spacing grows with radius, so the rim is legitimately coarser than the inside —
            and it is also further from the camera, so that is the right way round. */
      const cell=Math.max(2*Math.PI*r/nTheta, (r1-r0)/(nR-1));
      FREQSCALE=R.fbm.f;
      const m=fbm(x*R.fbm.f, y*R.fbm.f, R.fbm.oct, R.fbm.lac, R.fbm.gain, cell)*R.fbm.amp;
      FREQSCALE=R.ridge.f;
      const a=ridged(x*R.ridge.f, y*R.ridge.f, R.ridge.oct, R.ridge.lac, R.ridge.gain, R.ridge.sharp, cell)*R.ridge.amp;
      H[j*nTheta+i]=(m+a)/(R.fbm.amp+R.ridge.amp)*RING.peakH*ramp;
    }
  }
  /* 4. U-SHAPED VALLEYS, carved, because noise gives V and a glacial trough is a U. Axes are
        evenly spaced in azimuth and jittered by a hash, so they are deliberate features rather
        than whatever the noise happened to leave. */
  for(let v=0;v<R.valleys;v++){
    const a0=(v+0.5)/R.valleys*Math.PI*2 + (hash2(v*7+1,v*13+5)-0.5)*0.7;
    for(let j=0;j<nR;j++){
      const t=j/(nR-1);
      for(let i=0;i<nTheta;i++){
        const ang=i/nTheta*Math.PI*2;
        let d=Math.abs(((ang-a0+Math.PI*3)%(Math.PI*2))-Math.PI);   // angular distance to the axis
        /* the trough widens outward, as a glacier's does */
        const w=R.valleyW*(0.5+t);
        if(d>w)continue;
        const u=d/w;
        /* PLANED TO AN ABSOLUTE FLOOR, NOT SCALED BY WHAT WAS THERE. Carving `H -= H*depth*prof`
           removes a FRACTION, so a valley inherits the ridge it cut through: measured on recipe c,
           the trough floor came out 10.0 m at the axis against 4.3-6.6 m either side of it, a bump
           sitting in the middle of the flat bottom because 32% of a big number beats 100% of a
           small one. A glacier does not scale the ground, it PLANES it — everything below the
           trough surface is simply gone.
           So the valley is a MINIMUM against a U-surface: floor at the axis, rising as u^4 (a U;
           u^2 would be a V with rounded shoulders) and high enough at the walls that nothing
           outside the trough is touched. */
        const k=j*nTheta+i;
        const floorH=RAMP[j]*RING.peakH*(1-R.valleyDepth);
        const wall=floorH+RAMP[j]*RING.peakH*Math.pow(u,4);
        const blend=smooth(Math.min(1,t/0.3));
        const planed=Math.min(H[k],wall);
        H[k]=H[k]+(planed-H[k])*blend;
      }
    }
  }
  /* 5. THERMAL EROSION — enforce an angle of repose and pile what comes off below. This is the
        pass that cuts gullies and leaves SCREE FANS, which is what the plates show and what no
        amount of noise gives on its own. Records where it deposited, so the material can use it. */
  const scree=new Float32Array(nR*nTheta);
  const dR=(r1-r0)/(nR-1);
  /* EVERY RING, INCLUDING THE BOUNDARIES, with a one-sided neighbourhood where there is no ring
     beyond. Skipping j=0 and j=nR-1 left the two rings that matter most untouched: the inner one
     meets the play area and the outer one used to be the skyline. */
  for(let it=0; it<R.erode.iters; it++){
    for(let j=0;j<nR;j++){
      const r=r0+dR*j, dT=2*Math.PI*r/nTheta;
      for(let i=0;i<nTheta;i++){
        const k=j*nTheta+i;
        const nb=[[j*nTheta+((i+1)%nTheta),dT],[j*nTheta+((i+nTheta-1)%nTheta),dT]];
        if(j>0)nb.push([k-nTheta,dR]);
        if(j<nR-1)nb.push([k+nTheta,dR]);
        let lo=-1, loD=0, best=0;
        for(const [kk,dist] of nb){ const drop=(H[k]-H[kk])/dist;
          if(drop>best){ best=drop; lo=kk; loD=dist; } }
        if(lo<0||best<=R.erode.talus)continue;
        const move=(best-R.erode.talus)*loD*R.erode.rate*0.5;
        H[k]-=move; H[lo]+=move; scree[lo]+=move;
      }
    }
  }
  return {H,scree};
}

/* ---------- outputs ---------- */
const png=(name,w,h,buf)=>{ const raw=path.join('/tmp',name+'.raw');
  fs.writeFileSync(raw,buf);
  execSync(`ffmpeg -v error -y -f rawvideo -pix_fmt rgb24 -s ${w}x${h} -i "${raw}" `+
    `"${path.join(OUT,name+'.png')}"`);
  fs.unlinkSync(raw); return path.join(OUT,name+'.png'); };

function plan(H,name,S=520){
  const {nTheta,nR,r0,r1}=RING, buf=Buffer.alloc(S*S*3);
  let hi=0; for(const v of H)if(v>hi)hi=v;
  for(let py=0;py<S;py++)for(let px=0;px<S;px++){
    const x=(px/S-0.5)*2*r1, y=(py/S-0.5)*2*r1;
    const r=Math.hypot(x,y), o=(py*S+px)*3;
    if(r<r0||r>r1){ buf[o]=buf[o+1]=buf[o+2]=r<r0?24:10; continue; }
    let ang=Math.atan2(y,x); if(ang<0)ang+=Math.PI*2;
    const v=Math.max(0,Math.min(1,bilerp(H,r,ang)/hi));
    buf[o]=Math.round(v*255); buf[o+1]=Math.round(v*255); buf[o+2]=Math.round(v*255);
  }
  return png(name,S,S,buf);
}
/* BILINEAR, AND THE FIRST VERSION OF THIS FUNCTION LIED TO ME. Sampling the polar grid
   nearest-neighbour into a Cartesian image put strong RADIAL STREAKS across the whole ring, and I
   nearly went hunting for them in the erosion pass. They were in the renderer: a cell is
   2*pi*r/nTheta wide and (r1-r0)/(nR-1) deep, so near the inner edge it is 0.90 m by 1.83 m —
   radially elongated — and nearest-neighbour smears that into a comb. Measured, the field's
   radial-to-tangential gradient ratio is 1.03 to 1.23, which is very nearly isotropic.
   THE GRID'S OWN ANISOTROPY IS REAL BUT BENIGN, and worth writing down before someone "fixes" it:
   cells are square where 2*pi*r/nTheta equals dR, which at nTheta 384 is r ~112 — the middle of the
   ring. So they are about twice too wide at the rim and twice too narrow inside. That is the right
   way round: the rim is further from the camera and needs LESS angular detail, not more. */
function bilerp(H,rr,ang){
  const {nTheta,nR,r0,r1}=RING;
  const fj=Math.max(0,Math.min(nR-1.001,(rr-r0)/(r1-r0)*(nR-1)));
  const fi=(ang/(Math.PI*2)*nTheta+nTheta)%nTheta;
  const j0=Math.floor(fj), i0=Math.floor(fi), tj=fj-j0, ti=fi-i0;
  const j1=Math.min(nR-1,j0+1), i1=(i0+1)%nTheta;
  const a=H[j0*nTheta+i0], b=H[j0*nTheta+i1], c=H[j1*nTheta+i0], d=H[j1*nTheta+i1];
  return (a*(1-ti)+b*ti)*(1-tj)+(c*(1-ti)+d*ti)*tj;
}
function relief(H,name,S=520){
  const {nTheta,nR,r0,r1}=RING, buf=Buffer.alloc(S*S*3);
  const dR=(r1-r0)/(nR-1);
  /* the game's own sun, from SKY.sunPosDay = (-46, 42, 22), normalised */
  const sl=Math.hypot(-46,42,22), Lx=-46/sl, Ly=42/sl, Lz=22/sl;
  for(let py=0;py<S;py++)for(let px=0;px<S;px++){
    const x=(px/S-0.5)*2*r1, y=(py/S-0.5)*2*r1;
    const r=Math.hypot(x,y), o=(py*S+px)*3;
    if(r<r0||r>r1){ buf[o]=buf[o+1]=buf[o+2]=r<r0?26:12; continue; }
    let ang=Math.atan2(y,x); if(ang<0)ang+=Math.PI*2;
    /* gradients from BILINEAR samples a fixed world distance apart, so the derivative is in
       metres-per-metre everywhere rather than in cells-per-cell */
    const h=1.6;
    const gr=(bilerp(H,Math.min(r1,r+h),ang)-bilerp(H,Math.max(r0,r-h),ang))/(2*h);
    const dA=h/r;
    const gt=(bilerp(H,r,ang+dA)-bilerp(H,r,ang-dA))/(2*h);
    /* surface normal in world terms: radial and tangential gradients projected back to x/y */
    const ca=Math.cos(ang), sa=Math.sin(ang);
    const nx=-(gr*ca-gt*sa), ny=1, nz=-(gr*sa+gt*ca);
    const nl=Math.hypot(nx,ny,nz);
    const lam=Math.max(0.06,(nx/nl*Lx+ny/nl*Ly+nz/nl*Lz));
    const v=Math.round(Math.min(255,lam*255));
    buf[o]=v; buf[o+1]=v; buf[o+2]=v;
  }
  return png(name,S,S,buf);
}
/* THE SKYLINE: for an eye at the centre at 1.6 m, the max elevation angle per azimuth. This is the
   silhouette itself, and it is the thing being judged. */
export function skyline(H,eye=1.6){
  const {nTheta,nR,r0,r1}=RING, dR=(r1-r0)/(nR-1), out=new Float32Array(nTheta);
  for(let i=0;i<nTheta;i++){
    let best=0;
    for(let j=0;j<nR;j++){ const r=r0+dR*j;
      const el=Math.atan2(H[j*nTheta+i]-eye, r);
      if(el>best)best=el; }
    out[i]=best;
  }
  return out;
}
function skyplot(sk,name,W=960,Hh=200){
  const buf=Buffer.alloc(W*Hh*3);
  let hi=0; for(const v of sk)if(v>hi)hi=v;
  for(let px=0;px<W;px++){
    const v=sk[Math.round(px/W*sk.length)%sk.length];
    const top=Hh-1-Math.round(v/(hi||1)*(Hh-8));
    for(let py=0;py<Hh;py++){ const o=(py*W+px)*3;
      const on=py>=top;
      buf[o]=on?46:150; buf[o+1]=on?52:186; buf[o+2]=on?58:214; }
  }
  return png(name,W,Hh,buf);
}

if(import.meta.url===url.pathToFileURL(process.argv[1]||'').href){
  const which=(process.env.RECIPES||process.argv[2]||'a,b,c').split(',');
  console.log('TERRAIN LAB — '+RING.nTheta+' x '+RING.nR+' annulus, r '+RING.r0+'-'+RING.r1+' m\n');
  const stats=[];
  for(const key of which){
    const R=RECIPES[key]; if(!R){ console.error('no recipe '+key); continue; }
    const t0=Date.now();
    const {H,scree}=build(R);
    const ms=Date.now()-t0;
    const sk=skyline(H);
    plan(H,'TERRAIN_'+key+'_plan'); relief(H,'TERRAIN_'+key+'_relief'); skyplot(sk,'TERRAIN_'+key+'_skyline');
    /* peaks: local maxima of the skyline, which is what a viewer counts */
    let peaks=[], n=sk.length;
    for(let i=0;i<n;i++){ const p=sk[(i+n-1)%n], c=sk[i], q=sk[(i+1)%n];
      if(c>p&&c>=q&&c>0.06)peaks.push({i,el:c}); }
    let hi=0, lo=1e9, sum=0; for(const v of H){ if(v>hi)hi=v; if(v<lo)lo=v; sum+=v; }
    let sc=0; for(const v of scree)sc+=v;
    stats.push({key,name:R.name,ms,peaks:peaks.length,
      maxH:hi,meanH:sum/H.length,scree:sc,
      elMax:Math.max(...sk)*180/Math.PI, elMean:sk.reduce((a,b)=>a+b,0)/n*180/Math.PI});
  }
  console.log('  recipe  name                 ms   peaks  maxH   meanH  skyline el max/mean  scree');
  for(const s of stats)
    console.log('  '+s.key.padEnd(8)+s.name.padEnd(20)+String(s.ms).padStart(4)+
      String(s.peaks).padStart(7)+s.maxH.toFixed(1).padStart(7)+s.meanH.toFixed(1).padStart(8)+
      (s.elMax.toFixed(1)+'/'+s.elMean.toFixed(1)+' deg').padStart(19)+s.scree.toFixed(0).padStart(9));
  console.log('\n  wrote TERRAIN_<recipe>_{plan,relief,skyline}.png to gauntlet/capture/');
}
