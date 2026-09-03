/* THE FROZEN CONTROL — reshoot untitled-kea-game.html on r128 and SSIM it against its own baseline.
   Usage: node gauntlet/verify/frozen.mjs [ids]     env: FROZENREF (git rev of the pre-port rig)

   WHY THIS EXISTS (REPLAT P1 step 4, 2026-09-03). The first capture pass on the ported build
   flagged 26 of 28 vantages, and nothing on hand could say how much of that was THE PORT and how
   much was this machine, this Chrome, this GPU: the baselines were pinned on an earlier day and
   nobody had re-established that they still reproduced. This reshoots the FROZEN build through the
   PRE-PORT path and diffs it against the same baselines. It answered 0.99998 and 0.99994, which is
   what turned "all of the drift is the port" from an assumption into a measurement.

   IT DOES NOT REIMPLEMENT THE STAGING. A first draft of this file copied the vantage table across,
   and got both frames wrong — different camera, no PIN, no nightApply — which is the failure mode
   of every duplicated fixture: it answers confidently and it answers wrong. Instead it checks the
   pre-port capture rig OUT OF GIT verbatim and patches exactly two paths in it: the three build it
   loads (now under the three-r128 alias) and where it writes. The staging is therefore always the
   real staging, at the revision that pinned the baselines.

   Reads the frozen build; never writes to it. */
import fs from 'fs'; import path from 'path'; import url from 'url'; import os from 'os';
import { execSync, execFileSync } from 'child_process';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BASE = path.join(ROOT, 'gauntlet/capture/baseline');
const UMD  = path.join(ROOT, 'node_modules/three-r128/build/three.min.js');
// the last revision at which capture.mjs still drove the r128 single-file build
const REF  = process.env.FROZENREF || '812cf63';
const ids  = (process.argv[2] || '01_carpark_wide,21_night_camp');

if (!fs.existsSync(UMD))
  throw new Error('frozen: three-r128 is not installed — the frozen build cannot be reproduced without its own three');

const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'kea-frozen-'));
let src = execFileSync('git', ['show', REF + ':gauntlet/verify/capture.mjs'], { cwd: ROOT, encoding: 'utf8' });
const patch = (from, to, label) => {
  if (!src.includes(from)) throw new Error('frozen: ' + label + ' not found in the ' + REF + ' rig');
  src = src.replace(from, to);
};
patch('node_modules/three/build/three.min.js', 'node_modules/three-r128/build/three.min.js', 'three build path');
patch("const OUT=path.join(ROOT,'gauntlet/capture');", "const OUT=process.env.__FROZEN_OUT;", 'output directory');

// written INSIDE gauntlet/verify so its own ROOT resolution and node's module lookup both hold
const tmpRig = path.join(HERE, '.frozen-rig.' + process.pid + '.mjs');
fs.writeFileSync(tmpRig, src);
try {
  execSync(`node ${JSON.stringify(tmpRig)}`, {
    cwd: ROOT, stdio: 'inherit',
    env: { ...process.env, __FROZEN_OUT: OUT, SHOTS: ids },
  });
} finally { fs.unlinkSync(tmpRig); }

let worst = 1, n = 0, bad = 0;
for (const id of ids.split(',').filter(Boolean)) {
  const shot = path.join(OUT, id + '.png'), ref = path.join(BASE, id + '.png');
  if (!fs.existsSync(shot)) { console.log('✗ ' + id.padEnd(22) + ' the frozen rig produced no frame'); bad++; continue; }
  if (!fs.existsSync(ref))  { console.log('· ' + id.padEnd(22) + ' no baseline to compare'); continue; }
  let out = '';
  try { out = execSync(`ffmpeg -i "${shot}" -i "${ref}" -lavfi ssim -f null - 2>&1`, { encoding: 'utf8' }); }
  catch (e) { out = String(e.stdout || e.output || e); }        // ffmpeg writes ssim to STDERR
  const m = out.match(/All:([\d.]+)/); const ssim = m ? parseFloat(m[1]) : NaN;
  n++; if (ssim < worst) worst = ssim;
  const ok = ssim >= 0.99;               // a control, not a tripwire: this should read ~1.0000
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${id.padEnd(22)} frozen-vs-baseline ssim ${Number.isNaN(ssim) ? '??' : ssim.toFixed(5)}` +
    (ok ? '' : '  <-- THE GROUND MOVED, not the game'));
}
console.log(`FROZEN CONTROL: ${n} compared, ${bad} off (worst ${worst.toFixed(5)}); frames in ${OUT}`);
process.exitCode = bad ? 1 : 0;
