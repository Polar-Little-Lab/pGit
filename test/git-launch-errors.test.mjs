import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {git} from '../git.mjs';
import {runGit} from '../advanced.mjs';
test('missing working folder and missing Git have distinct actionable errors',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pgit-launch-'));
 try{
  for(const execute of [git,runGit]){
   await assert.rejects(execute(path.join(root,'missing'),['status']),/저장소 폴더를 찾을 수 없습니다/);
   await assert.rejects(execute(root,['status'],{env:{PATH:path.join(root,'no-bin')}}),/Git 실행 파일을 찾을 수 없습니다/);
   assert.match(await execute(root,['--version']),/git version/);
  }
 }finally{await rm(root,{recursive:true,force:true})}
});

test('unavailable volumes do not report repository deletion',{skip:process.platform!=='darwin'},async()=>{
 const {repositoryExists}=await import('../git-runtime.mjs');
 await assert.rejects(repositoryExists('/Volumes/pgit-nonexistent-test-volume/repository'),error=>error.code==='ENOENT');
 await assert.rejects(git('/Volumes/pgit-nonexistent-test-volume/repository',['status']),error=>error.code!=='REPOSITORY_MISSING');
});
