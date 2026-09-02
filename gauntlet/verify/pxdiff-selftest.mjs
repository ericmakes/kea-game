// PXDIFF SELFTEST — the contract test for pxdiff.mjs (TODO 31).
// Usage: node gauntlet/verify/pxdiff-selftest.mjs
//
// An instrument that measures other things has to be measurable itself, and this one exists to
// catch a class of change that SSIM cannot see - so the proof has to be a pair SSIM PASSES and
// pxdiff FLAGS. Three fixtures, cheapest first:
//   1. IDENTITY. A frame against itself is zero pixels and zero amplitude. If this fails the
//      arithmetic is wrong and nothing below means anything.
//   2. THE BLIND SPOT, SYNTHESISED. Every pixel of a real frame lifted by twelve grey levels.
//      SSIM is luminance-normalised, so it barely moves; the pixel count is the whole frame.
//   3. THE PIECE-9 PAIR, REAL, SHOT TONIGHT, WITH ITS OWN CONTROL. The brief for TODO 31 named
//      this as the ready-made test case and it still is, but not as a stored pair - the baselines
//      were re-pinned on the smooth hulls at 59a8493, so the AFTER is already in the set and only
//      the BEFORE has to be made. computeVertexNormals IS the before state: ExtrudeGeometry is
//      non-indexed, so three's own recompute puts the flat facets back exactly, which is how the
//      piece-9 battery proved its case. Shot through a COPY of capture.mjs rather than a switch
//      inside it - the same reason gate-selftest.sh builds a copy of the gate: no override exists
//      in the shipped rig for anybody to shoot a pinned frame through by accident.
//      THE CONTROL IS SHOT THROUGH THE SAME COPY WITH THE INJECTION EMPTY, and it earns its five
//      seconds. The first version of this file asserted the re-shade absolutely - amplitude over
//      20 levels, eight warm cells - and the sabotage that replaces the un-smoothing with a no-op
//      left BOTH of those green, because ordinary cross-run churn on this vantage also moves 49
//      levels and warms 12 cells. Worse, the amplitude does not discriminate at all: measured, the
//      re-shade peaks LOWER than the churn does (43 against 49). What separates them is the COUNT
//      and the SPREAD, so both are asserted against the control rather than against a number.
// Measured when this was written: BEFORE against the pinned baseline is ssim 0.9865 - which is
// what the TODO 31 brief recorded for the same pair, from a different direction, a session and
// eleven builds ago - 11637 changed pixels against a band of 1700 and 39 of 144 cells warm, while
// the control on the same night read 816 px and 12 cells. The SSIM figure is the one number here
// that is NOT stable enough to assert against a threshold; see the note beside it below.
import {execSync} from 'child_process'; import fs from 'fs'; import path from 'path'; import os from 'os';
import {pxdelta, pxcells, churnOf, bandOf} from './pxdiff.mjs';

const HERE=path.dirname(new URL(import.meta.url).pathname);
const ROOT=path.resolve(HERE,'..','..');
const CAP=path.resolve(HERE,'..','capture'), BASE=path.join(CAP,'baseline');
const F=[]; const bad=(m)=>F.push(m);
const ok=(c,m)=>{ if(!c)bad(m); else console.log('  · '+m); };
const ssim=(a,b)=>{ let out='';
  try{ out=execSync(`ffmpeg -i "${a}" -i "${b}" -lavfi ssim -f null - 2>&1`).toString(); }catch(e){ out=String(e.output||e); }
  const m=out.match(/All:([\d.]+)/); return m?parseFloat(m[1]):0; };
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'kea-pxself-'));
const SHOT=path.join(HERE,'.pxdiff-selftest-capture.mjs');   // must live in the repo: ESM resolves
                                                             // node_modules from the file location
const CHURNED=(()=>{ const s=fs.readFileSync(path.join(HERE,'pxdiff.mjs'),'utf8');
  const m=s.match(/const CHURN=\{([\s\S]*?)\n\};/);
  if(!m) throw new Error('pxdiff-selftest: the CHURN table is missing from pxdiff.mjs');
  const out={}; for(const r of m[1].matchAll(/'([^']+)'\s*:\s*(\d+)/g)) out[r[1]]=+r[2];
  return out; })();

try{
  // ---- 1. identity
  const any=path.join(BASE,'18_rear_close.png');
  const d0=pxdelta(any,any);
  ok(d0.px===0 && d0.max===0, `a frame against itself is ${d0.px} px and ${d0.max} levels`);
  ok(d0.w===960 && d0.h===540, `the frame size is read off ffmpeg, not assumed: ${d0.w}x${d0.h}`);

  // ---- 2. the blind spot, synthesised
  const lift=path.join(TMP,'lifted.png');
  execSync(`ffmpeg -v error -i "${any}" -vf "geq=r='min(255,r(X,Y)+12)':g='min(255,g(X,Y)+12)':b='min(255,b(X,Y)+12)'" -y "${lift}"`);
  const dl=pxdelta(any,lift), sl=ssim(any,lift);
  ok(sl>=0.965, `a whole frame lifted 12 levels still passes the diff threshold at ssim ${sl.toFixed(4)}`);
  ok(dl.px>400000, `and the pixel count sees all of it: ${dl.px} px of ${dl.w*dl.h}`);
  ok(dl.max>=11 && dl.max<=13, `with the amplitude reported honestly at ${dl.max} levels`);

  // ---- 3. the piece-9 pair, shot through a copy of the rig
  const src=fs.readFileSync(path.join(HERE,'capture.mjs'),'utf8');
  const A_ROOT="const ROOT=path.resolve(path.dirname(url.fileURLToPath(import.meta.url)),'../..');";
  const A_OUT="const OUT=path.join(ROOT,'gauntlet/capture');";
  const A_QUIET="KEAGAME.G.trafT.a=999;";
  for(const [name,a] of [['ROOT',A_ROOT],['OUT',A_OUT],['QUIET',A_QUIET]])
    if(src.split(a).length!==2) throw new Error('pxdiff-selftest: the '+name+' anchor is missing from capture.mjs');
  const UNSMOOTH="KEAGAME.G.scene.traverse(o=>{if(o.geometry&&!o.geometry.index)o.geometry.computeVertexNormals();});";
  const shoot=(inject,tag)=>{
    fs.writeFileSync(SHOT, src.replace(A_ROOT,`const ROOT=${JSON.stringify(ROOT)};`)
                              .replace(A_OUT,`const OUT=${JSON.stringify(path.join(TMP,tag))};`)
                              .replace(A_QUIET,inject+'\n  '+A_QUIET));
    fs.mkdirSync(path.join(TMP,tag),{recursive:true});
    execSync(`SHOTS=18_rear_close node "${SHOT}"`,{cwd:ROOT,stdio:'ignore'});
    return path.join(TMP,tag,'18_rear_close.png'); };
  const before=shoot(UNSMOOTH,'before'), control=shoot('void 0;','control');
  ok(fs.existsSync(before)&&fs.existsSync(control),
    'a BEFORE frame and an untouched CONTROL were shot through the same copy of the rig');
  if(fs.existsSync(before)&&fs.existsSync(control)){
    const pinned=path.join(BASE,'18_rear_close.png');
    const band=bandOf('18_rear_close');
    const s9=ssim(before,pinned), d9=pxdelta(before,pinned);
    const sc=ssim(control,pinned), dc=pxdelta(control,pinned);
    ok('18_rear_close' in CHURNED, `18_rear_close has a measured churn (${CHURNED['18_rear_close']} px), so its band of ${band} is derived and not guessed`);
    console.log(`  · the control landed at ${dc.px} px, ssim ${sc.toFixed(4)} - this vantage own churn`);
    // DO NOT ASSERT THAT THE PAIR PASSES 0.965. It usually does - 0.9868, 0.9863, 0.9863 on three
    // consecutive runs the night this was written - but one run in six came back 0.9580, because
    // the BEFORE shot carries this vantage own churn on top of the re-shade and the pair straddles
    // the diff threshold. An assertion that depends on which side it lands on is a flake (law 12),
    // and the complaint does not need it: what matters is that SSIM barely registers a change of
    // this size at all, while the count is not close to ambiguous.
    ok(Math.abs(s9-0.965)<0.05,
      `SSIM BARELY REGISTERS IT: ssim ${s9.toFixed(4)} sits ${(s9-0.965>=0?'+':'')}`+
      `${(s9-0.965).toFixed(4)} from the 0.965 gate it is supposed to be policed by`);
    ok(d9.px>band, `AND PXDIFF FLAGS IT: ${d9.px} px moved against a band of ${band}`);
    ok(d9.px/band>4, `by ${(d9.px/band).toFixed(1)} times its band, which is not a close call`);
    // NOT A RATIO AGAINST THE CONTROL, AND THIS IS THE SECOND FLAKE THIS FIXTURE TAUGHT ME. The
    // first version asked for four times the control and went red twice in eight runs, because the
    // control has its own churn and it is not small: eight shots of the untouched frame against
    // the same baseline read 0, 9, 766, 770, 817, 1825, 3344 and 3909 px. A ratio against a moving
    // denominator is not a bound. The DIFFERENCE is, because the two distributions do not overlap
    // and neither of them is guessed: the re-shade contribution measured five times is 11904,
    // 12651, 12659, 12660 and 12664 - stable to a fifth of a percent, because it is the same hulls
    // being re-shaded every time - and the churn tail across those eight control shots tops out
    // under 4000. 6000 sits in that gap with headroom on both sides.
    ok(d9.px-dc.px>6000,
      `the re-shade is not the churn: ${d9.px} px against the control ${dc.px}, a gap of ${d9.px-dc.px}`);
    // the SHAPE of the blind spot: wide and thin, not one hot corner. Asserted against the control,
    // because a bare cell count does not tell a re-shade from a settle that landed a frame later.
    const hot=c=>pxcells(c,pinned).filter(x=>x.frac>0.005).length;
    const h9=hot(before), hc=hot(control);
    ok(h9-hc>=12, `and it is spread: ${h9} of 144 cells warm against the control ${hc}`);
  }

  // ---- 4. every pinned vantage is calibrated
  const uncal=fs.readdirSync(BASE).filter(f=>f.endsWith('.png')).map(f=>f.replace(/\.png$/,''))
    .filter(id=>!(id in CHURNED));
  ok(uncal.length===0,`every pinned vantage has a measured churn${uncal.length?' - missing: '+uncal.join(', '):''}`);
  const wrong=Object.keys(CHURNED).filter(id=>bandOf(id)!==Math.max(400,CHURNED[id]*2));
  ok(wrong.length===0,`and every band is twice that churn with a floor of 400${wrong.length?' - not: '+wrong.join(', '):''}`);
} finally {
  fs.rmSync(SHOT,{force:true});
  fs.rmSync(TMP,{recursive:true,force:true});
}

if(F.length){ console.log(`PXDIFF-SELFTEST: ${F.length} FINDINGS`);
  for(const f of F)console.log('    ✗ '+f); process.exit(1); }
console.log('PXDIFF-SELFTEST: ALL PASS');
