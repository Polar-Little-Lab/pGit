import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,rename,readFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {git,stageAll,commit,snapshot} from '../git.mjs';
test('bulk staging handles unborn repositories, rename/delete, partial changes and preserves working files',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pgit-bulk-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await git(root,['init','-b','main']);await git(root,['config','user.name','Test']);await git(root,['config','user.email','test@example.invalid']);
 await writeFile(root+'/one.txt','original\n');await writeFile(root+'/remove.txt','delete me\n');
 await stageAll(root,true);await stageAll(root,false);assert.equal(await git(root,['ls-files']),'');assert.equal(await readFile(root+'/one.txt','utf8'),'original\n');
 await stageAll(root,true);await commit(root,'Initial\n\nDetailed explanation');assert.equal((await git(root,['log','-1','--format=%B'])).trim(),'Initial\n\nDetailed explanation');
 assert.equal((await snapshot(root)).history[0].body,'Detailed explanation');
 await rename(root+'/one.txt',root+'/renamed.txt');await rm(root+'/remove.txt');await writeFile(root+'/new.txt','staged version\n');await git(root,['add','new.txt']);await writeFile(root+'/new.txt','working version\n');
 await stageAll(root,true);assert.match(await git(root,['show',':new.txt']),/working version/);assert.equal((await git(root,['diff'])).trim(),'');
 await stageAll(root,false);assert.equal((await git(root,['diff','--cached'])).trim(),'');assert.equal(await readFile(root+'/new.txt','utf8'),'working version\n');assert.equal(await readFile(root+'/renamed.txt','utf8'),'original\n');
 await assert.rejects(stageAll(root,'yes'),/잘못된/);
});
test('bulk staging refuses unresolved conflicts without modifying the index',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pgit-bulk-conflict-'));t.after(()=>rm(root,{recursive:true,force:true}));await git(root,['init','-b','main']);await git(root,['config','user.name','Test']);await git(root,['config','user.email','test@example.invalid']);await writeFile(root+'/file','base');await stageAll(root,true);await commit(root,'base');await git(root,['checkout','-b','side']);await writeFile(root+'/file','side');await stageAll(root,true);await commit(root,'side');await git(root,['checkout','main']);await writeFile(root+'/file','main');await stageAll(root,true);await commit(root,'main');await git(root,['merge','side']).catch(()=>{});const before=await git(root,['ls-files','-u']);assert.ok(before);await assert.rejects(stageAll(root,true),/충돌/);await assert.rejects(stageAll(root,false),/충돌/);assert.equal(await git(root,['ls-files','-u']),before);
});
