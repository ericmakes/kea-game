/* THE SPECIMEN LOADER — REPLAT P1 step 3 (2026-09-03).

   The gauntlet has always evaluated the game's source with THREE injected, and it still does.
   Only the container changed: the specimen used to be a <script> block inside
   untitled-kea-game.html, and is now the ES module src/game.mjs.

   WHY NOT JUST import() THE MODULE. load() is synchronous — every battery opens with
   `const H=load()` at top level — and it must hand back a FRESH game per call, because
   harness-everything.js calls it a second time to prove that two different world seeds still
   drive the tint seam identically. Measured on node 26.5.0: require() of an ES module works but
   CACHES, and cannot be cache-busted (a ?query specifier is MODULE_NOT_FOUND for require).
   Query-busted dynamic import() is fresh, but async. So the module is read as text and evaluated,
   exactly as the script block was.

   'use strict' IS NOT DECORATION. ES module code is always strict; a new Function body is sloppy
   unless told otherwise. Without this line a battery would run the specimen under LOOSER rules
   than the browser does — an undeclared assignment would quietly make a global here and throw
   there — and the gauntlet would certify a build that faults on load. The module is known to be
   strict-safe: it imports cleanly as a real ESM.

   Every strip below is ASSERTED, never best-effort. If the module's shape changes, this throws
   loudly rather than handing back a half-evaluated specimen that fails somewhere confusing. */
const fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname,'..','..');
const SPECIMEN=path.join(ROOT,'src','game.mjs');
const SIG='KEA-LOGIC-START';

function specimenSource(){
  const src=fs.readFileSync(SPECIMEN,'utf8');
  if(!src.includes(SIG)) throw new Error('SPECIMEN FAIL: '+SIG+' not found in src/game.mjs');
  const strip=(re,label)=>{
    const hits=src.match(re);
    if(!hits||hits.length!==1) throw new Error('SPECIMEN FAIL: expected exactly one '+label+', found '+(hits?hits.length:0));
  };
  strip(/^import \* as THREE from 'three';$/m,'THREE import');
  strip(/^export default globalThis\.KEAGAME;$/m,'default export');
  strip(/^export \{ THREE \};$/m,'named THREE export');
  return src
    .replace(/^import \* as THREE from 'three';$/m,'/* THREE injected by the gauntlet loader */')
    .replace(/^export default globalThis\.KEAGAME;$/m,'')
    .replace(/^export \{ THREE \};$/m,'');
}

/* evaluate a fresh specimen and hand back its KEAGAME */
function evalSpecimen(THREE){
  const body=specimenSource();
  (new Function('THREE',"'use strict';\n"+body+'\n;globalThis.__X=KEAGAME;'))(THREE);
  return globalThis.__X;
}
module.exports={specimenSource,evalSpecimen,SPECIMEN,ROOT,SIG};
