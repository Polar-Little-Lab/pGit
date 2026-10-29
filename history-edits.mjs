import {readFile,writeFile,rename} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {git,snapshot} from './git.mjs';
import {extras} from './operations.mjs';
import {repositoryRevision} from './refresh.mjs';

export const historyEditActions=new Set(['resetPreview','resetApply','resetJournal','resetUndo','resetRedo']);
export const historyEditReads=new Set(['resetPreview','resetJournal']);
async function journalPath(root){return path.join((await git(root,['rev-parse','--absolute-git-dir'])).trim(),'pgit-reset.json')}
async function save(root,value){const file=await journalPath(root),temp=file+'.'+randomUUID();await writeFile(temp,JSON.stringify(value),{mode:0o600});await rename(temp,file)}
async function load(root){try{return JSON.parse(await readFile(await journalPath(root),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
async function ref(root,value){if(typeof value!=='string'||!value||value.startsWith('-')||value.includes('\0'))throw Error('잘못된 참조');return (await git(root,['rev-parse','--verify','--end-of-options',value+'^{commit}'])).trim()}
async function idle(root){if((await extras(root)).operation)throw Error('진행 중인 작업을 먼저 완료하세요.')}
async function protectPaths(root,target,undo=false){
 // Hard reset must never remove an ignored file/directory or alter a submodule.
 if(/^[a-zS] /m.test(await git(root,['ls-files','-v'])))throw Error('숨김 또는 sparse checkout 파일이 있는 저장소의 Reset은 아직 지원하지 않습니다.');
 const entries=await git(root,['ls-tree','-r',target]);if(/^160000 /m.test(entries)||(await git(root,['ls-files','--stage'])).includes('160000 '))throw Error('서브모듈이 있는 저장소의 Reset은 아직 지원하지 않습니다.');
 const changed=(await git(root,['diff','--name-only','-z','HEAD',target,'--'])).split('\0').filter(Boolean);
 const targetNames=new Set((await git(root,['ls-tree','-r','--name-only','-z',target])).split('\0'));
 const others=(await git(root,['ls-files','--others','-z'])).split('\0').filter(Boolean);
 for(const name of others)if(!(undo&&targetNames.has(name))&&changed.some(file=>file===name||file.startsWith(name+'/')||name.startsWith(file+'/')))throw Error('대상 경로에 추적하지 않는 파일이 있습니다. 먼저 보관하세요.');
}
export async function resetPreview(root,d){
 await idle(root);const state=await snapshot(root);if(state.files.length)throw Error('Reset 전에 변경을 커밋하거나 스태시에 보관하세요.');
 const target=await ref(root,d.ref);if(target===state.head)throw Error('이미 현재 커밋입니다.');
 await protectPaths(root,target);
 return {head:state.head,branch:state.branch,target,revision:await repositoryRevision(root),summary:await git(root,['diff','--stat',target,state.head,'--'])};
}
export async function historyEdit(root,action,d={}){
 if(action==='resetPreview')return resetPreview(root,d);
 if(action==='resetJournal'){const journal=await load(root);if(!journal)return null;return {head:journal.head,target:journal.target,branch:journal.branch,mode:journal.mode,undone:journal.undone,available:journal.phase==='done'&&journal.revision===await repositoryRevision(root)}}
 if(action==='resetApply'){
  if(!['soft','mixed','hard'].includes(d.mode))throw Error('잘못된 Reset 방식');
  const plan=await resetPreview(root,{ref:d.target});if(plan.head!==d.head||plan.revision!==d.revision)throw Error('검토 이후 저장소가 변경되었습니다. 다시 확인하세요.');
  await git(root,['update-ref','refs/pgit/backups/reset-'+randomUUID(),plan.head]);
  const journal={...plan,mode:d.mode,undone:false,phase:'pending'};await save(root,journal);
  await git(root,['reset','--'+d.mode,plan.target]);journal.phase='done';journal.revision=await repositoryRevision(root);await save(root,journal);return;
 }
 if(!['resetUndo','resetRedo'].includes(action))throw Error('지원하지 않는 이력 작업');
 await idle(root);const journal=await load(root),undo=action==='resetUndo';
 if(!journal||journal.phase!=='done'||journal.undone===undo||journal.revision!==await repositoryRevision(root))throw Error('Reset 이후 저장소가 변경되었습니다. 자동 실행 취소를 할 수 없습니다.');
 const target=undo?journal.head:journal.target;await protectPaths(root,target,undo);
 journal.phase='pending';await save(root,journal);
 // The fingerprint includes the index and working files. Only our exact reset result is reverted.
 await git(root,['reset',undo?'--hard':'--'+journal.mode,target]);journal.undone=undo;journal.phase='done';journal.revision=await repositoryRevision(root);await save(root,journal);
}
