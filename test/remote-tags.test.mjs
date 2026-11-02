import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {git} from '../git.mjs';import {operate} from '../operations.mjs';
test('remote tags are queried per remote without importing refs or duplicating annotated tags',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pgit-tags-'));t.after(()=>rm(root,{recursive:true,force:true}));await git(root,['init','-b','main']);await git(root,['config','user.name','Test']);await git(root,['config','user.email','test@example.invalid']);await writeFile(root+'/file','base');await git(root,['add','file']);await git(root,['commit','-m','base']);await git(root,['init','--bare',root+'/remote.git']);await git(root,['remote','add','origin',root+'/remote.git']);await git(root,['tag','-a','v1','-m','release']);await git(root,['tag','local-only']);await git(root,['push','origin','refs/tags/v1']);await git(root,['tag','-d','v1']);const rows=await operate(root,'remoteTags',{remote:'origin'});assert.equal(rows.length,1);assert.equal(rows[0].name,'v1');assert.equal(rows[0].target,(await git(root,['rev-parse','HEAD'])).trim());assert.notEqual(rows[0].hash,rows[0].target);assert.equal((await git(root,['tag'])).trim(),'local-only');await assert.rejects(operate(root,'remoteTags',{remote:'missing'}),/등록된/);
 await git(root,['init','--bare',root+'/other.git']);await git(root,['remote','add','other',root+'/other.git']);assert.deepEqual(await operate(root,'remoteTags',{remote:'other'}),[]);
});

import vm from 'node:vm';import {readFile} from 'node:fs/promises';
test('remote tag refresh follows interval, keeps failed snapshots and stops periodic reads when disabled',async()=>{
 let now=1000,minutes='10',calls=0,fail=false;const source=await readFile(new URL('../public/providers.js',import.meta.url),'utf8');
 const context={state:{root:'/repo',remoteDetails:[{name:'origin'}]},localStorage:{getItem:()=>minutes},Date:{now:()=>now},document:{hidden:false},window:{},integrations:{querySelectorAll:()=>[]},request:async()=>{calls++;if(fail)throw Error('offline');return [{name:'v1',hash:'a'.repeat(40)}]}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('const remoteTagLists=new Map();')),context);
 const refresh=()=>vm.runInContext('refreshRemoteTags(request)',context);
 await refresh();assert.equal(calls,1);await refresh();assert.equal(calls,1);now+=600000;await refresh();assert.equal(calls,2);
 fail=true;now+=600000;await refresh();assert.equal(calls,3);assert.equal(vm.runInContext('[...remoteTagLists.values()][0].tags[0].name',context),'v1');await refresh();assert.equal(calls,3);
 minutes='0';now+=6000000;await refresh();assert.equal(calls,3);await vm.runInContext('refreshRemoteTags(request,true)',context);assert.equal(calls,4);
});
