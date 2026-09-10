/* ORPHANS SELFTEST — does the sweeper kill only what the caller started?
   Usage: node gauntlet/verify/orphans-selftest.mjs

   The dangerous half of this module is which PIDs it decides to kill, and that decision is pure:
   a set difference over parsed ps output. So it is tested on FIXED ps text rather than on live
   processes — no browser is spawned and nothing is signalled by this file. */
import { headlessPids, newPids } from './orphans.mjs';
let bad=0;
const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)bad++; };
console.log('ORPHANS SELFTEST');

/* Real ps lines, trimmed: two rig browsers, the user's own Chrome, and this node process. */
const PS=[
'  PID COMMAND',
'  501 /sbin/launchd',
'37567 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --allow-pre-commit-input --disable-background-networking --headless=new --remote-debugging-port=0',
'37573 /Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Helpers/Google Chrome Helper --type=gpu-process --headless',
'40001 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
'40002 /Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Helpers/Google Chrome Helper --type=renderer',
'40100 node gauntlet/verify/repin.mjs',
].join('\n');

const pids=headlessPids(PS);
ok(pids.size===2&&pids.has(37567)&&pids.has(37573),
   'only the two --headless processes are found ('+[...pids].join(', ')+')');
ok(!pids.has(40001)&&!pids.has(40002),
   'and the user\'s own Chrome is NOT among them — the discriminator is --headless and not the '+
   'executable path, because puppeteer drives the INSTALLED Chrome here');
ok(!pids.has(40100),'nor is the node process that is doing the sweeping');

/* THE SAFETY PROPERTY: nothing that was already running can be killed. */
ok(newPids(new Set([37567,37573]),pids).length===0,
   'a browser that was already running before the batch is never killed, even though it matches');
ok(newPids(new Set([37567]),pids).join()==='37573',
   'and one that appeared DURING the batch is ('+newPids(new Set([37567]),pids).join()+')');
ok(newPids(new Set([99999]),pids).length===2,
   'a snapshot with nothing in common leaves both to be swept');
ok(newPids(pids,new Set()).length===0,
   'and a browser that exited on its own is not chased');

/* MALFORMED INPUT MUST NOT PRODUCE A PID. A sweeper that parses "0" out of a blank line and
   signals it would be signalling its own process group. */
ok(headlessPids('\n\n   \n--headless with no pid\n').size===0,
   'a line with no PID yields nothing — parsing 0 out of it would signal our own process group');
ok(headlessPids('').size===0,'empty ps output yields nothing');
ok(headlessPids(undefined)!==null,'and a real call returns a Set rather than throwing');

console.log(bad?('ORPHANS SELFTEST: '+bad+' FINDINGS'):'ORPHANS SELFTEST: ALL PASS');
process.exit(bad?1:0);
