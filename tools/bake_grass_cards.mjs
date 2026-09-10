/* BAKE THE GRASS CARD ATLAS — TODO 82's asset, made from our own blades.
   Usage: node tools/bake_grass_cards.mjs [biome]     ->  assets/tex/grass_cards.png

   WHY OURS AND NOT A DOWNLOAD. TODO 82 says the card tier "wants a CC0 grass alpha atlas (an asset
   and a licence line)", and the network was checked rather than assumed: ambientCG has 60 Atlas
   assets and NOT ONE is grass — eight Foliage sets and a shelf of LeafSets, all broadleaf. Poly
   Haven has CC0 grass MODELS (grass_medium_01/02, grass_bermuda_01) whose textures are alpha blade
   atlases, but they are green European lawn and meadow species.
   THE FIELD IS GOLDEN NZ TUSSOCK AND ERIC HAS ALREADY APPROVED IT. Dropping a green European atlas
   in at 28 m would replace a judged look with one he has not seen, at exactly the distance where
   the two tiers have to agree. So the atlas is BAKED FROM THE GAME'S OWN BLADE RECIPE — the same
   heights, widths, taper, lean and base/tip/tint colours the near tier draws from GRASS — which
   makes the handover a colour and species match by construction rather than by tuning. It also
   needs no third-party licence, and its ledger row says so.

   EVERY NUMBER COMES OUT OF THE SPECIMEN. Nothing here is a second copy of the blade recipe: the
   script evaluates game.mjs and reads GRASS.biomes[biome] and GRASS.farLayer, so a change to the
   field's colours or proportions is picked up by re-running the bake rather than by editing this
   file to match. */
import fs from 'fs';
import path from 'path';
import url from 'url';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const HERE=path.dirname(url.fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const require2=createRequire(import.meta.url);
const { evalSpecimen }=require2(path.join(ROOT,'audits/2026-08-26/keasrc.js'));
const X=evalSpecimen(require2('three'));

const BIOME=process.argv[2]||'carpark';
const G=X.GRASS, B=G.biomes[BIOME], F=G.farLayer;
if(!B)throw new Error('bake: no such biome '+BIOME);

/* THE GRID. 4x4 variants so an instance can pick one and the field does not repeat visibly; 256 px
   a card, which at the distances this tier covers is well over a texel per pixel. */
const CELL=256, GRID=4, N=CELL*GRID;
/* FORTY-EIGHT, NOT FIFTEEN. TODO 82's "one quad carrying fifteen blades" is the arithmetic of the
   INSTANCE ratio — a fifteenth of the instances for the same coverage — and it is not a budget for
   the atlas. Fifteen blades fills 15% of a card's texels, and a card at 60 m is five to ten pixels
   across, so fifteen blades came out as scattered dark specks rather than as a field: measured, and
   visible in the first shot. The card is free to be dense; it is one quad either way. */
const BLADES=48;

/* A SEEDED GENERATOR OF ITS OWN, because this runs offline and must not touch — or depend on — the
   game's shared stream. Same LCG shape as setSeed so the numbers are of the same family. */
let _s=0x9E3779B9;
const rnd=(a,b)=>{ _s+=0x6D2B79F5; let r=Math.imul(_s^_s>>>15,1|_s);
  r^=r+Math.imul(r^r>>>7,61|r); return a+(((r^r>>>14)>>>0)/4294967296)*(b-a); };

const img=new Uint8Array(N*N*4);                 // RGBA, transparent
const put=(x,y,r,g,b)=>{ if(x<0||y<0||x>=N||y>=N)return; const i=(y*N+x)*4;
  img[i]=r; img[i+1]=g; img[i+2]=b; img[i+3]=255; };
const hex=v=>[(v>>16)&255,(v>>8)&255,v&255];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

const base=hex(B.base), tip=hex(B.tip), tints=B.tint.map(hex);
let drawn=0;
for(let cy=0;cy<GRID;cy++)for(let cx=0;cx<GRID;cx++){
  const ox=cx*CELL, oy=cy*CELL;
  for(let k=0;k<BLADES;k++){
    /* THE BLADE, IN THE CARD'S OWN SPACE. A card is one metre wide and holds the tier's tallest
       blade, so heights map straight off GRASS.farLayer.h and read at the same scale as the
       geometry tier they hand over from. */
    const hMax=F.h[1];
    const h=rnd(F.h[0],hMax)/hMax;               // 0..1 of the card's height
    const w=rnd(F.w[0],F.w[1])/1.0;              // metres, card is 1 m wide
    const lean=rnd(-F.lean[1],F.lean[1]);
    const x0=rnd(0.06,0.94);
    const tint=tints[(k+cx*3+cy*5)%tints.length];
    const gain=rnd(0.82,1.12);
    const px=CELL, py=CELL;
    const STEPS=Math.max(24,Math.round(h*py));
    for(let s=0;s<=STEPS;s++){
      const t=s/STEPS;
      const cxp=(x0+lean*t*t)*px;
      const cyp=py-1-t*h*py;                     // 0 at the bottom of the cell: grass grows UP
      const hw=Math.max(0.5,(w*(1-B.taper*t))*px*0.5);
      /* colour: base to tip up the blade, then the per-blade tint, which is what stops the card
         reading as one flat swatch at distance */
      const c0=mix(base,tip,t*0.85);
      const c=mix(c0,tint,0.45).map(v=>Math.min(255,Math.max(0,v*gain)));
      for(let dx=-Math.ceil(hw);dx<=Math.ceil(hw);dx++){
        if(Math.abs(dx)>hw)continue;
        put(ox+Math.round(cxp)+dx,oy+Math.round(cyp),c[0]|0,c[1]|0,c[2]|0);
        /* one row of vertical thickening, so a near-vertical blade is continuous rather than dotted */
        put(ox+Math.round(cxp)+dx,oy+Math.round(cyp)-1,c[0]|0,c[1]|0,c[2]|0);
      }
    }
    drawn++;
  }
}
/* HARD ALPHA, NO ANTIALIASING, ON PURPOSE. This atlas is for an alphaTest cutout: a soft edge would
   either shimmer at the test threshold or need blending and the sorting that implies, which TODO 82
   names as one of the reasons the tier is a piece. Every texel is opaque or absent. */
let opaque=0; for(let i=3;i<img.length;i+=4)if(img[i])opaque++;
const raw='/tmp/grass_cards.raw';
fs.writeFileSync(raw,Buffer.from(img));
const out=path.join(ROOT,'assets/tex/grass_cards.png');
execSync(`ffmpeg -v error -y -f rawvideo -pix_fmt rgba -s ${N}x${N} -i "${raw}" `+
  `-frames:v 1 -pix_fmt rgba "${out}"`);
const st=fs.statSync(out);
console.log('baked '+out);
console.log('  '+N+'x'+N+'  '+GRID+'x'+GRID+' cards, '+BLADES+' blades each ('+drawn+' drawn)');
console.log('  coverage '+(opaque/(N*N)*100).toFixed(1)+'% opaque texels — the rest is cut away');
console.log('  from GRASS.biomes.'+BIOME+' + GRASS.farLayer, read out of the specimen');
console.log('  bytes '+st.size.toLocaleString('en-US')+
  '  md5 '+execSync('md5 -q "'+out+'"').toString().trim());
