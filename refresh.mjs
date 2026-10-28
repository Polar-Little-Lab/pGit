import {createHash} from 'node:crypto';
import {lstat,readFile} from 'node:fs/promises';
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
