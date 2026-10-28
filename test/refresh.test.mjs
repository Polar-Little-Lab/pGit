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
