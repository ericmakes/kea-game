// CHANGED-PIXEL TRIPWIRE — count the pixels that moved, and by how much, for every pinned vantage.
// Usage: node gauntlet/verify/pxdiff.mjs   (run after a capture pass, beside diff.mjs)
//   env: PXGREY  grey levels that count as a change (default 8)
//        PXBAND  multiply every band, for a deliberately loose or tight pass (default 1)
//        PXCELLS=1  for each row over band, name the hottest 60px cells
//        PXFAIL=1   exit 1 on a warning, for anybody who wants this in a gate
// Its contract test is gauntlet/verify/pxdiff-selftest.mjs. Run that whenever this file changes.
//
// WHY THIS EXISTS (TODO 31, and TODO 30 and 33 from the other end). There are three instruments in
// this directory - diff, stability, boxdiff - and all three are SSIM, so all three share one blind
// spot: a low-amplitude change spread thinly over a wide area moves SSIM less than its fourth
// decimal place on a 960x540 frame. The facet-normal pass in piece 9 re-shaded EVERY curved hull in
// the game and diff.mjs flagged nothing. And it fails from the small end too: session 3 recorded
// 01_carpark_wide at ssim 1.0000 take-to-take and filed it clean, while 755 of its pixels were
// swaying across the full width of the frame.
// So this asks a different question in a different unit. Not "how similar are these two
// photographs" but HOW MANY PIXELS MOVED, AND WHAT IS THE WORST ONE.
//
// IT WARNS, IT DOES NOT FAIL. diff.mjs owns the go/no-go and keeps it: a frame under 0.965 there is
// a red gate whatever this file says. This one surfaces what SSIM averages away, so a global
// re-shade or a sway cannot ship silently. Exit code is 0 unless PXFAIL is set.
//
// TWO TIERS, PER VANTAGE, AND BOTH DERIVED FROM ONE MEASURED NUMBER. A global threshold is useless
// in both directions: one that flags 07_jam at seven thousand flags nothing at all, while
// 09_colossal reshoots to twenty pixels and should scream at three figures. So each vantage carries
// its own CHURN - the worst distance between two captures of the SAME build in DIFFERENT processes
// (TODO 33) - and the two markers come off it:
//     ~   over churn.  More moved than this vantage has ever moved by itself. Worth a look.
//     !   over band, where band is twice churn, floor 400. Headroom for a state nobody has seen.
// Churn is not the take-to-take variance stability.mjs measures inside one run, and it is not
// drift. It is what the same photograph costs you for being taken twice.
//
// CHURN HAS GROWN EVERY TIME IT HAS BEEN MEASURED, AND THAT IS THE MOST IMPORTANT LINE IN THIS
// FILE. First cut: three full sweeps. The selftest control - an untouched frame through the same
// rig - blew straight past it, so it was re-measured over the ten pairwise distances of FIVE
// sweeps: 07_jam 20 -> 1881, 10_skifield 3 -> 1152, 19_roof_follow 890 -> 4168. Then crossrun.mjs
// shot five MORE sweeps an hour later on the same build and fourteen of twenty-eight vantages beat
// the five-sweep ceiling too: 09_colossal 22 -> 2233, 11_trailhead 673 -> 4446, 23_paddock_gate
// 117 -> 1252, 10_skifield 1152 -> 5822. The states are discrete but the number of them is not
// small, and which of them a batch of sweeps visits depends on the machine that night.
// SO TREAT THIS TABLE AS A FLOOR THAT HAS NEVER STOPPED RISING, not as a ceiling. It is the max of
// everything measured on 2026-09-02 - two batches of five sweeps, twenty pairwise distances per
// vantage, plus the selftest control shots - and it will move again. crossrun.mjs prints a
// paste-ready replacement and goes red when a vantage beats its row.
// ONE OUTLIER IS DELIBERATELY NOT IN HERE. 18_rear_close came back 16317 px once, in a real
// cross-run pair inside the selftest, against a distribution that otherwise tops out at 3909 over
// thirty-odd pairs and 2563 over a further fifteen taken straight afterwards. A single five-fold
// outlier that will not reproduce is FLAKES law 9 - SwiftShader is moody and shotR retakes - not a
// state, and fitting the table to it would put the 18 band above the piece-9 re-shade and blind
// this instrument on the one vantage it was proved with. Written down rather than absorbed: if it
// comes back, the resolution on 18 is gone and the selftest is where it will show.
//
// AND THE COUNT IS A STEP FUNCTION, WHICH IS WORTH KNOWING BEFORE READING IT AS A DISTANCE.
// 29_lodge_deck sits 129 px from its baseline on four sweeps and 1452 on the fifth, while its worst
// churn pair is 229 - which cannot be a distance, and is not one. A wide area of that frame sits
// within a grey level or two of the GREY window, so a small move flips thirteen hundred pixels
// across the boundary at once. That is why the amplitude is reported beside the count and why the
// markers have headroom: the count says HOW MUCH MOVED, not how far anything went.
//
// WHAT IT SAYS ABOUT THE PINNED SET AT 8232590523658dfc3f5a1fe59a916de0, and this is the corrected
// version of it. A vantage whose distance from its baseline beats its churn on every sweep has
// moved rather than churned. On five sweeps that looked like six vantages. On ten it is TWO, and
// both were already known:
//     07_jam       7497..9372 px against a churn of 2865   boxdiff 0.9580, TODO 60
//     17_flight    7333..9189 px against a churn of 1951   the piece 54 wing, TODO 57
// THE OTHER FOUR COLLAPSED WHEN THE CHURN WAS MEASURED AGAIN, and the first version of this header
// claimed them. 09_colossal read 1565..1584 from its baseline against a churn of 22 - seventy-one
// times over, and it looked like the cleanest signal in the set - and then churned 2233 all by
// itself. Same for 20_dead_rear, 11_trailhead and 23_paddock_gate. TODO 68 carries what is left.
// WHICH IS THE REAL FINDING, AND IT IS NOT ABOUT ANY ONE FRAME: while the rig churns thousands of
// pixels, a pixel count cannot separate drift from churn on most of this set. A warn here is a
// LOOK, never a verdict. TODO 67 and 30 are the fix - park the caption, freeze the clock - and the
// target TODO 33 named all along, a count near zero, is reachable that way and no other.
// THE RECIPE is ffmpeg, no new dependency - diff.mjs already shells to it. Pass one thresholds the
// absolute difference and averages the mask, which turns a count into a mean; pass two takes the
// peak; the optional cell pass area-scales the same mask to 16x9 and reads it back raw, so a whole
// density map costs one more invocation rather than 144 crops.
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path';

const HERE=path.dirname(new URL(import.meta.url).pathname);
const CAP=path.resolve(HERE,'..','capture'), BASE=path.join(CAP,'baseline');
const GREY=+(process.env.PXGREY||8);
const SCALE=+(process.env.PXBAND||1);

// MEASURED 2026-09-02 on build 8232590523658dfc3f5a1fe59a916de0: the worst distance seen between
// any two capture sweeps of that build, over two batches of five. A vantage with no row here gets
// DEFAULT, which is deliberately loud, and the selftest goes red if a pinned vantage has no row.
const DEFAULT=200;
const CHURN={
  '01_carpark_wide'    :3996, '02_hut_snow'      :2575, '03_kea_plate'     :3033,
  '04_flight_underwing':3086, '05_tussock_ground':2775, '06_skyline'       :8791,
  '07_jam'             :2865, '08_readability_320':1480,'09_colossal'      :2233,
  '10_skifield'        :5822, '11_trailhead'     :4446, '12_seal_midpeel'  :3123,
  '13_idle_preen'      :6932, '14_player_view'   :3872, '15_sign'          :1924,
  '16_trish'           :1700, '17_flight'        :1951, '18_rear_close'    :3909,
  '19_roof_follow'     :4168, '20_dead_rear'     :5489, '21_night_camp'    :2399,
  '22_torch_beam'      :5308, '23_paddock_gate'  :1252, '24_verge_paddle'  :1922,
  '25_preen_follow'    :2801, '28_skifield_base' : 453, '29_lodge_deck'    : 229,
  '30_groomed_band'    :1597,
};
export const churnOf=id=>(id in CHURN?CHURN[id]:DEFAULT)*SCALE;
export const bandOf=id=>Math.max(400*SCALE, churnOf(id)*2);

const ff=(a,b,lavfi,raw)=>{ const cmd=`ffmpeg -i "${a}" -i "${b}" -lavfi "${lavfi}" `+
    (raw?`-f rawvideo -pix_fmt gray - 2>/dev/null`:`-f null - 2>&1`);
  try{ return execSync(cmd,{maxBuffer:1<<24,encoding:raw?'buffer':'utf8'}); }
  catch(e){ return raw?Buffer.alloc(0):String(e.output||e); } };

// pixels differing by more than GREY levels, via the mean of a thresholded difference
export function pxdelta(a,b){
  const mask=`blend=all_mode=difference,format=gray,geq='if(gt(p(X\\,Y)\\,${GREY})\\,255\\,0)'`;
  const o1=ff(a,b,`${mask},signalstats,metadata=print:key=lavfi.signalstats.YAVG`);
  const o2=ff(a,b,`blend=all_mode=difference,format=gray,signalstats,metadata=print:key=lavfi.signalstats.YMAX`);
  const dim=o1.match(/ (\d+)x(\d+)[ ,]/)||[0,'960','540'];
  const w=+dim[1], h=+dim[2];
  const yavg=o1.match(/YAVG=([\d.]+)/), ymax=o2.match(/YMAX=([\d.]+)/);
  return { px: yavg? Math.round(parseFloat(yavg[1])/255*w*h) : -1,
           max: ymax? Math.round(parseFloat(ymax[1])) : -1, w, h };
}

// WHERE it moved: the same mask, area-scaled to a 16x9 grid and read back raw. One ffmpeg call for
// the whole map. This is the shape that caught the 01_carpark_wide sway in session 4 - a wide band
// of low-amplitude change reads as many warm cells rather than one hot one.
export function pxcells(a,b,cols=16,rows=9){
  const mask=`blend=all_mode=difference,format=gray,geq='if(gt(p(X\\,Y)\\,${GREY})\\,255\\,0)',scale=${cols}:${rows}:flags=area`;
  const buf=ff(a,b,mask,true);
  if(buf.length<cols*rows)return [];
  const out=[];
  for(let i=0;i<cols*rows;i++) out.push({cx:i%cols, cy:(i/cols)|0, frac:buf[i]/255});
  return out.sort((p,q)=>q.frac-p.frac);
}

if(path.resolve(process.argv[1]||'')===path.resolve(HERE,'pxdiff.mjs')){
  let n=0, warns=0, notes=0, worst=0, worstName='-';
  for(const f of fs.readdirSync(BASE).filter(f2=>f2.endsWith('.png'))){
    const fresh=path.join(CAP,f); if(!fs.existsSync(fresh))continue;
    const id=f.replace(/\.png$/,'');
    const churn=Math.round(churnOf(id)), band=Math.round(bandOf(id));
    const d=pxdelta(fresh,path.join(BASE,f));
    n++; if(d.px>worst){ worst=d.px; worstName=id; }
    const warn=d.px>band, note=!warn&&d.px>churn;
    if(warn)warns++; if(note)notes++;
    console.log(`${warn?'!':note?'~':'✓'} ${id.padEnd(22)} ${String(d.px).padStart(7)} px moved by >${GREY}`+
      `  worst ${String(d.max).padStart(3)} levels   churn ${String(churn).padStart(5)}`+
      (warn?`  <-- ${(d.px/churn).toFixed(1)}x WHAT THIS VANTAGE CHURNS`
           :note?'  <- over churn, under the headroom':''));
    if((warn||note)&&process.env.PXCELLS){
      const w=Math.round(d.w/16), h=Math.round(d.h/9);
      const hot=pxcells(fresh,path.join(BASE,f)).filter(c=>c.frac>0.002).slice(0,6);
      console.log('      hottest '+w+'x'+h+' cells: '+(hot.length
        ? hot.map(c=>`x${c.cx*w}y${c.cy*h} ${(c.frac*100).toFixed(1)}%`).join('  ')
        : 'none above 0.2 percent - the change is spread thinner than the grid'));
    }
  }
  console.log(`PXDIFF: ${n} compared, ${warns} over band, ${notes} over churn only `+
    `(loudest ${worst} px on ${worstName}, grey ${GREY}, x${SCALE})`);
  process.exitCode=(warns&&process.env.PXFAIL)?1:0;
}
