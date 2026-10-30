import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {git} from '../git.mjs';
import {repositoryRevision} from '../refresh.mjs';
test('revision detects content, staging, refs, HEAD, config and operation changes without modifying Git',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pgit-refresh-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await git(root,['init','-b','main']);await git(root,['config','user.name','Test']);await git(root,['config','user.email','test@example.invalid']);
 let previous=await repositoryRevision(root);
 async function changed(){const next=await repositoryRevision(root);assert.notEqual(next,previous);assert.equal(await repositoryRevision(root),next);previous=next}
 await writeFile(root+'/file.txt','base\n');await changed();
 await writeFile(root+'/file.txt','next\n');await changed(); // Same status AND same size.
 await git(root,['add','.']);await changed();await git(root,['commit','-m','base']);await changed();
 await git(root,['checkout','-b','topic']);await changed(); // Same commit, different branch.
 await git(root,['tag','v1']);await changed();
 await git(root,['remote','add','origin','/tmp/example']);await changed();
 const head=(await git(root,['rev-parse','HEAD'])).trim();
 await writeFile(root+'/.git/MERGE_HEAD',head+'\n');await changed();
 await rm(root+'/.git/MERGE_HEAD');await changed();
 assert.equal((await git(root,['status','--porcelain'])).trim(),'');
 assert.equal((await git(root,['rev-parse','HEAD'])).trim(),head);
});

import {autoFetch} from '../refresh.mjs';
test('automatic fetch updates remote refs without touching local changes and throttles worktrees',async t=>{
 const base=await mkdtemp(path.join(os.tmpdir(),'pgit-autofetch-'));t.after(()=>rm(base,{recursive:true,force:true}));const remote=base+'/remote',root=base+'/clone';
 await git(base,['init','-b','main',remote]);await git(remote,['config','user.name','Test']);await git(remote,['config','user.email','test@example.invalid']);await writeFile(remote+'/file','base');await git(remote,['add','.']);await git(remote,['commit','-m','base']);await git(base,['clone',remote,root]);const head=(await git(root,['rev-parse','HEAD'])).trim();await writeFile(root+'/file','keep draft');await git(remote,['branch','new-feature']);await writeFile(remote+'/file','remote change');await git(remote,['commit','-am','remote']);
 assert.deepEqual((await autoFetch(root,10)).failed,[]);assert.equal((await git(root,['rev-parse','HEAD'])).trim(),head);assert.notEqual((await git(root,['rev-parse','origin/main'])).trim(),head);assert.match(await git(root,['diff']),/keep draft/);await git(root,['show-ref','refs/remotes/origin/new-feature']);
 let calls=0;assert.equal((await autoFetch(root,10,async()=>{calls++})).skipped,true);await git(root,['worktree','add','-b','other',base+'/other']);assert.equal((await autoFetch(base+'/other',10,async()=>{calls++})).skipped,true);assert.equal(calls,0);await assert.rejects(autoFetch(root,1));
});

test('automatic fetch pauses during an operation and backs off after remote failures',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pgit-fetch-failure-'));t.after(()=>rm(root,{recursive:true,force:true}));await git(root,['init','-b','main']);await git(root,['remote','add','origin','https://example.invalid/team/repo']);await git(root,['remote','add','upstream','https://example.invalid/upstream/repo']);let calls=0;
 const run=async(binary,args,options)=>{calls++;assert.equal(binary,'git');assert.equal(options.env.GIT_TERMINAL_PROMPT,'0');assert.match(options.env.GIT_SSH_COMMAND,/BatchMode=yes/);if(args.at(-1)==='origin')throw Error('offline');return {stdout:''}};
 await writeFile(root+'/.git/MERGE_HEAD','pending');assert.equal((await autoFetch(root,10,run)).skipped,true);assert.equal(calls,0);await rm(root+'/.git/MERGE_HEAD');assert.deepEqual((await autoFetch(root,10,run)).failed,['origin']);assert.equal(calls,2);assert.equal((await autoFetch(root,10,run)).skipped,true);assert.equal(calls,2);
});

import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('fetch scheduler respects intervals, off, operation pauses and failure backoff',async()=>{
 let time=1000,preference='10',scheduled,fetches=0,fail=false;
 const document={hidden:false,body:{dataset:{}},querySelector:()=>null,addEventListener(){}};
 const sandbox={api:async action=>{if(action==='autoFetch'){fetches++;if(fail)throw Error('offline');return {failed:[]}}return {revision:'same',state:null}},state:{root:'/repo',remotes:['origin']},working:false,controls(){},document,window:{addEventListener(){}},parent:{document},localStorage:{getItem:()=>preference},Date:{now:()=>time},setTimeout:fn=>{scheduled=fn;return 1},clearTimeout(){},historyLimit:200};
 vm.runInNewContext(await readFile(new URL('../public/auto-refresh.js',import.meta.url),'utf8'),sandbox);
 await scheduled();time+=9*60000;await scheduled();assert.equal(fetches,0);time+=60000;await scheduled();assert.equal(fetches,1);
 preference='0';await scheduled();time+=60*60000;await scheduled();assert.equal(fetches,1);
 preference='5';await scheduled();time+=5*60000;sandbox.working=true;await scheduled();assert.equal(fetches,1);sandbox.working=false;document.hidden=true;await scheduled();assert.equal(fetches,1);document.hidden=false;sandbox.state.operation='merge';await scheduled();assert.equal(fetches,1);sandbox.state.operation=null;fail=true;await scheduled();assert.equal(fetches,2);await scheduled();assert.equal(fetches,2);assert.equal(sandbox.working,false);
});
