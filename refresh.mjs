import {createHash} from 'node:crypto';
import {lstat,readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {git,parseStatus} from './git.mjs';

// Poll Git's view, not a recursive filesystem watcher (which also watches build output).
// Include file metadata: porcelain alone cannot detect another edit to an already dirty file.
export async function repositoryRevision(root) {
 const [status,refs,dir,config,worktrees]=await Promise.all([
  git(root,['status','--porcelain=v1','-z','--untracked-files=all']),
  git(root,['for-each-ref','--format=%(refname)%00%(objectname)']),
  git(root,['rev-parse','--absolute-git-dir']),
  git(root,['config','--local','--list','-z']),
  git(root,['worktree','list','--porcelain','-z'])
 ]);
 const hash=createHash('sha256');
 for(const value of [root,status,refs,config,worktrees])hash.update(value).update('\0');
 const gitDir=dir.trim();
 hash.update(await readFile(path.join(gitDir,'HEAD')));
 const names=[...parseStatus(status).map(file=>path.join(root,file.name)),
  ...['index','MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply'].map(name=>path.join(gitDir,name))];
 // Bound concurrent filesystem requests for repositories with many untracked files.
 for(let i=0;i<names.length;i+=64){
  const stamps=await Promise.all(names.slice(i,i+64).map(async name=>{
   try{const s=await lstat(name,{bigint:true});return [name,String(s.size),String(s.mtimeNs),String(s.ctimeNs),String(s.ino)]}
   catch(error){if(error.code==='ENOENT'||error.code==='ENOTDIR')return [name,'missing'];throw error}
  }));
  hash.update(JSON.stringify(stamps));
 }
 return hash.digest('hex');
}

const fetchAttempts=new Map();
export async function autoFetch(root,minutes,execute){
 if(![5,10,30].includes(minutes))throw Error('Invalid fetch interval');
 const common=await realpath(path.resolve(root,(await git(root,['rev-parse','--git-common-dir'])).trim()));
 const now=Date.now();if(now-(fetchAttempts.get(common)||0)<minutes*60000)return {skipped:true};
 const dir=(await git(root,['rev-parse','--absolute-git-dir'])).trim();
 for(const file of ['MERGE_HEAD','CHERRY_PICK_HEAD','REVERT_HEAD','rebase-merge','rebase-apply'])if(await lstat(path.join(dir,file)).then(()=>true,()=>false))return {skipped:true};
 if(now-(fetchAttempts.get(common)||0)<minutes*60000)return {skipped:true};
 fetchAttempts.set(common,now);
 const names=(await git(root,['remote'])).trim().split('\n').filter(Boolean),failed=[];
 if(!execute){const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');execute=promisify(execFile)}
 for(const remote of names){try{await execute('git',['-c','credential.interactive=false','fetch','--prune','--no-recurse-submodules','--',remote],{cwd:root,timeout:30000,maxBuffer:1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GIT_ASKPASS:'/usr/bin/false',SSH_ASKPASS:'/usr/bin/false',GIT_SSH_COMMAND:'ssh -o BatchMode=yes -o ConnectTimeout=10'}})}catch{failed.push(remote)}}
 return {failed,at:now};
}
