import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {parseCloneProgress,cloneWithProgress} from '../clone-progress.mjs';import {git} from '../git.mjs';
test('clone stages parse real progress without inventing overall percentage',()=>{
 assert.deepEqual(parseCloneProgress('Receiving objects:  62% (620/1000), 1.90 GiB | 12.00 MiB/s'),{stage:'receiving',percent:62,current:620,total:1000,received:'1.90 GiB',speed:'12.00 MiB/s'});
 assert.equal(parseCloneProgress('remote: Enumerating objects: 1000, done.').percent,null);
 assert.equal(parseCloneProgress('Resolving deltas: 85% (85/100)').stage,'resolving');
 assert.equal(parseCloneProgress('Updating files: 40% (4/10)').stage,'checkout');
 assert.equal(parseCloneProgress('fatal: access denied'),null);
});
test('streaming clone succeeds and propagates failures',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'pgit-progress-'));
 try{await git(dir,['init','-b','main','source']);const source=path.join(dir,'source');await writeFile(path.join(source,'hello'),'hello');await git(source,['add','.']);await git(source,['-c','user.name=Test','-c','user.email=test@example.invalid','commit','-m','base']);
 const updates=[];await cloneWithProgress(dir,'file://'+source,path.join(dir,'copy'),p=>updates.push(p));assert.equal(updates[0].stage,'connecting');assert.equal(updates.at(-1).stage,'loading');assert.ok(updates.some(p=>p.stage==='receiving'));assert.equal(await git(source,['rev-parse','HEAD']),await git(path.join(dir,'copy'),['rev-parse','HEAD']));
 await assert.rejects(cloneWithProgress(dir,path.join(dir,'missing'),path.join(dir,'failed')),/does not exist|not exist/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
