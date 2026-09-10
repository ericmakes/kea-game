/* ORPHANED HEADLESS BROWSERS — FINDING THEM, AND KILLING ONLY THE ONES YOU STARTED.
   Usage: import { headlessPids, newPids, sweepOrphans } from './orphans.mjs'

   WHY THIS EXISTS (TODO 115). A killed capture pass leaves headless Chrome behind. Measured twice
   in one session: 276 MB and 136 MB still resident after the parent had gone, on a machine whose
   swap was already 7.6 GB of 8 GB used — which is exactly how one killed pass poisons the sweep
   after it, and it cost four dead sweeps before it was understood.

   TWO RULES, AND BOTH OF THEM ARE ABOUT NOT KILLING THE WRONG THING.
   THE DISCRIMINATOR IS `--headless`, NOT THE EXECUTABLE PATH. puppeteer drives the INSTALLED Google
   Chrome in this project rather than a bundled Chromium, so a pkill on the binary would close the
   user's own browser — 45 processes of it, on the machine this was written on.
   AND `--headless` ALONE IS STILL NOT ENOUGH, because another rig run may be in flight, or the user
   may be running a headless browser of their own. So a sweep takes a SNAPSHOT first and kills only
   PIDs that appeared after it and are still alive: a set difference, which cannot reach anything
   that was already running. That is the whole safety property and it is the part worth testing. */
import { execSync } from 'child_process';

/* Every live PID whose command line carries --headless. Returns a Set; an empty Set on any error,
   because a sweeper that throws is worse than a sweeper that finds nothing. */
export function headlessPids(ps){
  try{
    const out=ps!==undefined?ps:execSync('ps ax -o pid,command',{encoding:'utf8'});
    return new Set(out.split('\n')
      .filter(l=>l.includes('--headless'))
      .map(l=>+l.trim().split(/\s+/)[0])
      .filter(n=>Number.isInteger(n)&&n>0));
  }catch(e){ return new Set(); }
}

/* THE SET DIFFERENCE, PURE, so it can be tested without spawning a browser. This is the function
   that decides what dies, so it is the function that has to be provably narrow. */
export function newPids(before,now){
  const out=[];
  for(const pid of now) if(!before.has(pid)) out.push(pid);
  return out;
}

/* Kill the new ones. Returns how many were signalled; a PID that has already exited is not an
   error and is not counted. */
export function sweepOrphans(before,ps){
  let killed=0;
  for(const pid of newPids(before,headlessPids(ps))){
    try{ process.kill(pid,'SIGKILL'); killed++; }catch(e){}
  }
  return killed;
}
