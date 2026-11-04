import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {operate,extras} from '../operations.mjs';import '../public/history-model.js';
test('graph hiding preserves shared ancestors; solo follows its ancestry without mutating history',()=>{
 const history=[{hash:'a',parents:['base']},{hash:'b',parents:['base']},{hash:'base',parents:[]}],refs=[{name:'a',hash:'a'},{name:'b',hash:'b'}];
 const visible=(hidden,solo,head)=>PgitHistoryModel.filterHistory(history,refs,hidden,solo,head).map(c=>c.hash);
 assert.deepEqual(visible(['a']),['b','base']);assert.deepEqual(visible(['a'],'a'),['a','base']);assert.deepEqual(visible(['a','b']),[]);assert.deepEqual(visible(['a','b'],null,'a'),['a','base']);assert.deepEqual(visible([],'deleted'),['a','b','base']);assert.equal(history.length,3);
});
async function fixture(t){const root=await mkdtemp(path.join(os.tmpdir(),'pgit-multi-'));t.after(()=>rm(root,{recursive:true,force:true}));await git(root,['init','-b','main']);await git(root,['config','user.name','Polar']);await git(root,['config','user.email','test@example.invalid']);await writeFile(root+'/file','base\n');await git(root,['add','.']);await git(root,['commit','-m','base']);await git(root,['checkout','-b','topic']);const hashes=[];for(const value of ['one','two']){await writeFile(root+'/file',value+'\n');await git(root,['commit','-am',value]);hashes.push((await git(root,['rev-parse','HEAD'])).trim())}await git(root,['checkout','main']);return {root,hashes}}
test('multi cherry-pick orders ancestors first, previews without writes, rejects dirty/stale targets',async t=>{
 const {root,hashes}=await fixture(t);const plan=await operate(root,'cherryPickPreview',{refs:hashes.toReversed()});assert.deepEqual(plan.commits.map(c=>c.hash),hashes);assert.equal((await readFile(root+'/file','utf8')),'base\n');
 const args={refs:hashes,expectedHead:plan.head,expectedBranch:plan.branch};
 await writeFile(root+'/dirty','keep');await assert.rejects(operate(root,'cherryPickMany',args),/변경/);await rm(root+'/dirty');
 await git(root,['checkout','-b','same-head']);await assert.rejects(operate(root,'cherryPickMany',args),/브랜치가 변경/);await git(root,['checkout','main']);
 await operate(root,'cherryPickMany',args);assert.equal(await readFile(root+'/file','utf8'),'two\n');assert.equal((await git(root,['log','-2','--format=%s'])).trim(),'two\none');
 await assert.rejects(operate(root,'cherryPickPreview',{refs:[hashes[0],hashes[0]]}),/서로 다른/);
});
test('multi cherry-pick conflict remains abortable and merge commits are rejected before changes',async t=>{
 const {root,hashes}=await fixture(t);await writeFile(root+'/file','main\n');await git(root,['commit','-am','main']);
 const plan=await operate(root,'cherryPickPreview',{refs:hashes});await assert.rejects(operate(root,'cherryPickMany',{refs:hashes,expectedHead:plan.head,expectedBranch:plan.branch}));assert.equal((await extras(root)).operation,'cherry-pick');await operate(root,'abort');assert.equal((await git(root,['rev-parse','HEAD'])).trim(),plan.head);assert.equal(await readFile(root+'/file','utf8'),'main\n');
 await git(root,['merge','--no-ff','-s','ours','topic','-m','merge']);const merge=(await git(root,['rev-parse','HEAD'])).trim();await assert.rejects(operate(root,'cherryPickPreview',{refs:[hashes[0],merge]}),/병합 커밋/);assert.equal((await git(root,['status','--porcelain'])).trim(),'');
});
