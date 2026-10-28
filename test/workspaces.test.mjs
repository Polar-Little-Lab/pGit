import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {server,ready} from '../server.mjs';import {git} from '../git.mjs';
import store from '../desktop/workspace-store.cjs';
test('workspace requests remain bound to their repository across concurrent tabs',async t=>{
 const parent=await mkdtemp(path.join(os.tmpdir(),'pgit-tabs-'));t.after(async()=>{await new Promise(r=>server.close(r));await rm(parent,{recursive:true,force:true})});
 const roots=[];for(const name of ['north','south']){const root=path.join(parent,name);await git(parent,['init','-b','main',root]);await git(root,['config','user.name','Test']);await git(root,['config','user.email','test@example.invalid']);await writeFile(root+'/same.txt',name+' original\n');await git(root,['add','.']);await git(root,['commit','-m',name]);await writeFile(root+'/same.txt',name+' changed\n');roots.push(root)}
 const url=await ready;const html=await (await fetch(url+'workspace')).text();const token=html.match(/const token='([a-f0-9]+)'/)[1];
 async function call(workspaceId,action,data={}){const r=await fetch(url+'api',{method:'POST',headers:{origin:url.slice(0,-1),'content-type':'application/json','x-pgit-token':token},body:JSON.stringify({workspaceId,action,...data})});return {status:r.status,...await r.json()}}
 const opened=await Promise.all(roots.map((root,i)=>call('tab-'+i,'open',{path:root})));assert.ok(opened.every(r=>r.status===200));
 const diffs=await Promise.all([call('tab-0','diff',{name:'same.txt'}),call('tab-1','diff',{name:'same.txt'})]);assert.match(diffs[0].result,/north changed/);assert.match(diffs[1].result,/south changed/);
 assert.equal((await call('tab-0','stage',{name:'same.txt',value:true})).status,200);
 assert.equal(await git(roots[1],['diff','--cached']),'');
 assert.equal((await call('tab-1','commit',{message:'must not commit north'})).status,400);
 assert.equal((await call('tab-0','commit',{message:'north only'})).status,200);
 assert.equal((await git(roots[0],['log','-1','--format=%s'])).trim(),'north only');
 assert.equal((await git(roots[1],['log','-1','--format=%s'])).trim(),'south');
 assert.equal((await call('tab-0','closeWorkspace')).status,200);
 assert.equal((await call('tab-0','state')).status,400);
 assert.equal((await call('tab-1','state')).status,200);
 assert.equal((await call('../invalid','state')).status,400);
});
test('desktop tab persistence validates paths, omits drafts and writes atomically',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'pgit-store-'));t.after(()=>rm(dir,{recursive:true,force:true}));const file=path.join(dir,'workspace.json');
 const data={projects:[{path:'/north',draft:'not persisted'},{path:'/north'},{path:'relative'},{path:'/south'}],activePath:'/south',recents:['/north','/north','relative']};
 await store.writeWorkspace(file,data);const restored=await store.readWorkspace(file);assert.deepEqual(restored,{projects:[{path:'/north',name:'north'},{path:'/south',name:'south'}],activePath:'/south',recents:['/north']});
 await Promise.all([store.writeWorkspace(file,{projects:[{path:'/one'}]}),store.writeWorkspace(file,{projects:[{path:'/two'}]})]);assert.equal((await store.readWorkspace(file)).projects[0].path,'/two');
 await writeFile(file,'invalid json');assert.deepEqual((await store.readWorkspace(file)).projects,[]);
});

test('language preference persists only supported locales',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'pgit-locale-'));t.after(()=>rm(dir,{recursive:true,force:true}));const file=path.join(dir,'workspace.json');
 await store.writeWorkspace(file,{language:'en',projects:[{path:'/north'}]});assert.equal((await store.readWorkspace(file)).language,'en');
 await store.writeWorkspace(file,{language:'ko'});assert.equal((await store.readWorkspace(file)).language,'ko');
 await store.writeWorkspace(file,{language:'invalid'});assert.equal((await store.readWorkspace(file)).language,undefined);
});

test('theme preference only persists supported choices',()=>{
 for(const theme of ['light','dark','system'])assert.equal(store.normalizeWorkspace({theme}).theme,theme);
 assert.equal(store.normalizeWorkspace({theme:'invalid'}).theme,undefined);
});
