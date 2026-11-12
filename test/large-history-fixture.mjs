import {mkdtemp,rm} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import os from 'node:os';import path from 'node:path';import {git} from '../git.mjs';
export async function largeHistoryFixture(){
 const root=await mkdtemp(path.join(os.tmpdir(),'pgit-large-history-'));await git(root,['init','-b','main']);
 let input='';for(let i=0;i<2205;i++){const message=`Commit ${i}`;input+=`commit refs/heads/main\ncommitter Test <test@example.invalid> ${1700000000+i} +0000\ndata ${message.length}\n${message}\n\n`}
 const result=spawnSync('git',['fast-import','--quiet'],{cwd:root,input,encoding:'utf8'});if(result.status)throw Error(result.stderr);
 const hash=(await git(root,['rev-parse','HEAD~300'])).trim();await git(root,['-c','user.name=Test','-c','user.email=test@example.invalid','tag','-a','old-release',hash,'-m','Annotated release']);await git(root,['branch','old-branch',hash]);
 return {root,hash,cleanup:()=>rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:200})};
}
