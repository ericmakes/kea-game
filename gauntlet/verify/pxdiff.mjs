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
// MEASURED WITH FIVE FULL SWEEPS, and three would have lied. The first cut of this table used three
// sweeps and I nearly shipped it. Then the selftest control - an untouched frame shot through the
// same rig - came back at 3909 px on a vantage whose three-sweep ceiling was 825, twice in eight
// runs. Sampled properly, over all ten pairwise distances of five sweeps, 07_jam went from 20 to
// 1881, 10_skifield from 3 to 1152, 19_roof_follow from 890 to 4168 and 13_idle_preen from 2922 to
// 6932. THE STATES ARE DISCRETE BUT THERE ARE MORE THAN THREE OF THEM, so a ceiling taken from
// three samples is a floor.
//
// AND THE COUNT IS A STEP FUNCTION, WHICH IS WORTH KNOWING BEFORE READING IT AS A DISTANCE.
// 29_lodge_deck sits 129 px from its baseline on four sweeps and 1452 on the fifth, while its worst
// churn pair is 229 - which cannot be a distance, and is not one. A wide area of that frame sits
// within a grey level or two of the GREY window, so a small move flips thirteen hundred pixels
// across the boundary at once. That is why the amplitude is reported beside the count and why the
// markers have headroom: the count says HOW MUCH MOVED, not how far anything went.
//
// WHAT IT SAID ON ITS FIRST RUN, against the pinned set at 8232590523658dfc3f5a1fe59a916de0. Six
// vantages read over churn on all five sweeps, so what separates them from their baseline is not
// churn. Two were already known and four had never been seen by any instrument here:
//     07_jam        7497..9372 px over a churn of 1881   known - boxdiff 0.9580, TODO 60
//     17_flight     7333..9189 px over a churn of 1951   known - the piece 54 wing, TODO 57
//     09_colossal   1565..1584 px over a churn of   22   NEW. seventy times its own churn, and
//                                                        ssim 0.9992. it read 0 px in session 6.
//     20_dead_rear  3512..5425 px over a churn of 2475   NEW
//     11_trailhead  1221..1893 px over a churn of  673   NEW
//     23_paddock_gate 235..319 px over a churn of  117   NEW, and small enough that only the ~
//                                                        marker ever sees it
// THE RECIPE is ffmpeg, no new dependency - diff.mjs already shells to it. Pass one thresholds the
// absolute difference and averages the mask, which turns a count into a mean; pass two takes the
// peak; the optional cell pass area-scales the same mask to 16x9 and reads it back raw, so a whole
// density map costs one more invocation rather than 144 crops.
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path';

const HERE=path.dirname(new URL(import.meta.url).pathname);
const CAP=path.resolve(HERE,'..','capture'), BASE=path.join(CAP,'baseline');
const GREY=+(process.env.PXGREY||8);
const SCALE=+(process.env.PXBAND||1);

// MEASURED 2026-09-02 on build 8232590523658dfc3f5a1fe59a916de0: the worst of the ten pairwise
// distances between five full capture sweeps. A vantage with no row here gets DEFAULT, which is
// deliberately loud, and the selftest goes red if a pinned vantage has no measured row.
const DEFAULT=200;
const CHURN={
  '01_carpark_wide'    :3996, '02_hut_snow'      :2575, '03_kea_plate'     :3033,
  '04_flight_underwing':3086, '05_tussock_ground':2546, '06_skyline'       :5871,
  '07_jam'             :1881, '08_readability_320':1480,'09_colossal'      :  22,
  '10_skifield'        :1152, '11_trailhead'     : 673, '12_seal_midpeel'  :3123,
  '13_idle_preen'      :6932, '14_player_view'   :1611, '15_sign'          :1474,
  '16_trish'           :1700, '17_flight'        :1951, '18_rear_close'    : 825,
  '19_roof_follow'     :4168, '20_dead_rear'     :2475, '21_night_camp'    :2399,
  '22_torch_beam'      :2690, '23_paddock_gate'  : 117, '24_verge_paddle'  :1620,
  '25_preen_follow'    :2801, '28_skifield_base' : 233, '29_lodge_deck'    : 229,
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
