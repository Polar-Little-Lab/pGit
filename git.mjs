import {gitEnvironment,gitLaunchError,missingRepository,repositoryExists} from './git-runtime.mjs';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {realpath,readFile,lstat} from 'node:fs/promises';
import path from 'node:path';
const exec=promisify(execFile);
export async function git(root,args,{env={},timeout=30000}={}){try{const {stdout}=await exec('git',['--no-pager','-c','core.quotePath=false','-c','color.ui=false',...args],{cwd:root,windowsHide:true,maxBuffer:8*1024*1024,timeout,env:{...gitEnvironment(),...env,GIT_OPTIONAL_LOCKS:'0',GIT_LITERAL_PATHSPECS:['stash','check-ignore','submodule'].includes(args[0])?'0':'1'}});return stdout}catch(error){throw await gitLaunchError(error,root)}}
export async function openRepo(input){if(typeof input!=='string'||!input.trim())throw Error('저장소의 절대 경로를 입력하세요.');const root=await realpath(input).catch(error=>{if(['ENOENT','ENOTDIR'].includes(error.code))return repositoryExists(input).then(exists=>{if(!exists)throw missingRepository(input,error);throw error});throw error});const top=(await git(root,['rev-parse','--show-toplevel'])).trim();if(!top)throw Error('일반 Git 작업 폴더를 선택하세요.');return realpath(top);}
export function parseStatus(raw){const chunks=raw.split('\0'),out=[];for(let i=0;i<chunks.length;i++){const c=chunks[i];if(!c)continue;const xy=c.slice(0,2),name=c.slice(3);let original=null;if(/[RC]/.test(xy))original=chunks[++i];out.push({name,original,index:xy[0],worktree:xy[1],untracked:xy==='??',conflict:xy.includes('U')||['AA','DD'].includes(xy)});}return out;}
export async function snapshot(root,limit=200){limit=Math.max(200,Math.min(2000,Number.isInteger(limit)?limit:200));const raw=await git(root,['status','--porcelain=v1','-z','--untracked-files=all']);const branches=(await git(root,['for-each-ref','--format=%(refname:short)%09%(objectname)%09%(HEAD)','refs/heads'])).trim().split('\n').filter(Boolean).map(s=>{const [name,hash,head]=s.split('\t');return {name,hash,current:head==='*'}});let history=[];const head=await git(root,['rev-parse','--verify','HEAD']).then(value=>value.trim(),()=>null);if(head){history=(await git(root,['log','--branches','--remotes','--tags','HEAD','--topo-order','-n',String(limit),'--format=%H%x00%P%x00%an%x00%aI%x00%s%x00%b%x00'])).split('\0\n').filter(Boolean).map(s=>{const [hash,parents,author,date,title,body]=s.replace(/^\n/,'').split('\0');return {hash,parents:parents?parents.split(' '):[],author,date,title,body:body?.trim()||''}})}const branch=await git(root,['symbolic-ref','--short','HEAD']).then(s=>s.trim(),()=>'(detached HEAD)');return {root,head,branch,branches,history,files:parseStatus(raw),limited:history.length===limit};}
async function knownFile(root,name){const file=(await snapshot(root)).files.find(f=>f.name===name);if(!file)throw Error('파일 상태가 변경되었습니다. 새로고침하세요.');return file;}
export async function diff(root,name,staged=false){const f=await knownFile(root,name);if(f.untracked){const absolute=path.resolve(root,name);if(!absolute.startsWith(root+path.sep))throw Error('잘못된 파일 경로');const stat=await lstat(absolute);if(!stat.isFile())return '일반 파일이 아닙니다. 미리보기를 제공하지 않습니다.';if(stat.size>1024*1024)return '1MB가 넘는 파일은 미리보기를 생략합니다.';const data=await readFile(absolute);if(data.includes(0))return '바이너리 파일입니다.';return data.toString('utf8').split('\n').map(l=>'+'+l).join('\n')}return git(root,['diff','--no-ext-diff','--no-textconv',...(staged?['--cached']:[]),'--',name]);}
export async function stage(root,name,value){const f=await knownFile(root,name);if(f.conflict)throw Error('충돌 파일 처리는 다음 단계에서 지원합니다.');const names=f.original?[f.original,name]:[name];if(value)await git(root,['add','--',...names]);else {const head=await git(root,['rev-parse','--verify','HEAD']).then(()=>true,()=>false);await git(root,head?['reset','-q','HEAD','--',...names]:['rm','--cached','--ignore-unmatch','--',...names]);}}
export async function commit(root,message){if(typeof message!=='string'||!message.trim()||message.length>4000)throw Error('커밋 메시지를 1~4,000자로 입력하세요.');const s=await snapshot(root);if(s.files.some(f=>f.conflict))throw Error('충돌을 먼저 해결하세요.');if(!s.files.some(f=>f.index!==' '&&f.index!=='?'))throw Error('스테이징한 변경이 없습니다.');await git(root,['commit','-m',message]);}
export async function commitDiff(root,hash){if(!/^[a-f0-9]{40,64}$/.test(hash))throw Error('잘못된 커밋입니다.');return git(root,['show','--format=fuller','--no-ext-diff','--no-textconv',hash,'--']);}

// One index transaction; working files are never reset or deleted.
export async function stageAll(root,value){
 if(typeof value!=='boolean')throw Error('잘못된 스테이징 요청');
 const s=await snapshot(root);
 if(s.files.some(f=>f.conflict))throw Error('충돌을 먼저 해결하세요.');
 if(value)await git(root,['add','--all','--','.']);
 else if(await git(root,['rev-parse','--verify','HEAD']).then(()=>true,()=>false))await git(root,['reset','-q','HEAD','--','.']);
 else await git(root,['rm','-r','--cached','--ignore-unmatch','--','.']);
}

// Resolve aliases before selection so forms always submit an immutable commit hash.
export async function commitChoice(root,ref){
 if(typeof ref!=='string'||!ref||ref.startsWith('-')||ref.includes('\0'))throw Error('잘못된 커밋입니다.');
 let hash;
 try{hash=(await git(root,['rev-parse','--verify','--quiet','--end-of-options',ref+'^{commit}'])).trim()}
 catch(error){if(error.code===1)throw Error('해당 참조의 커밋을 찾을 수 없습니다. 브랜치·태그 이름이나 HEAD~2 같은 참조를 확인하세요.');throw error}
 const [author,date,title]=(await git(root,['show','-s','--format=%an%x00%aI%x00%s',hash,'--'])).trimEnd().split('\0');
 return {hash,author,date,title};
}

export async function commitCandidates(root,ref){
 const source=await commitChoice(root,ref),target=await commitChoice(root,'HEAD');
 const raw=await git(root,['log','--topo-order','--cherry-pick','--right-only','-n','501','--format=%H%x00%P%x00%an%x00%aI%x00%s',target.hash+'...'+source.hash,'--']);
 const commits=raw.trimEnd().split('\n').filter(Boolean).map(line=>{const [hash,parents,author,date,title]=line.split('\0');return {hash,parents:parents?parents.split(' '):[],author,date,title}});
 return {source:source.hash,target:target.hash,commits:commits.slice(0,500),limited:commits.length>500};
}

export async function amendInfo(root){
 const {hash:head}=await commitChoice(root,'HEAD');
 const message=(await git(root,['show','-s','--format=%B',head,'--'])).replace(/\n$/,'');
 const files=(await git(root,['diff','--cached','--name-only','-z'])).split('\0').filter(Boolean);
 return {head,message,files};
}

// Stream rename-aware history: Git's --skip/--grep can omit the rename needed
// to follow older names. Keep memory bounded and stop after one matching page.
export function fileHistoryPage(root,{name,revision,query,offset,size=50}){
 return new Promise((resolve,reject)=>{
  const child=spawn('git',['--no-pager','log','--follow','--no-show-signature','--name-status','--diff-merges=first-parent','-z','--format=%H%x00%an%x00%aI%x00%s%x00%P',revision,'--',name],{cwd:root,windowsHide:true,env:{...gitEnvironment(),GIT_OPTIONAL_LOCKS:'0',GIT_LITERAL_PATHSPECS:'1'}});
  let buffer='',fields=[],matched=0,done=false,stderr='';const commits=[],needle=query.toLowerCase();
  const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);child.kill();if(error)reject(error);else resolve({name,revision,commits:commits.slice(0,size),hasMore:commits.length>size,offset,pageSize:size})};
  const timer=setTimeout(()=>finish(Error('Git history search timed out.')),30000);
  child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');child.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-4096)});
  child.on('error',async error=>finish(await gitLaunchError(error,root)));
  child.stdout.on('data',chunk=>{if(done)return;buffer+=chunk;let end;while(!done&&(end=buffer.indexOf('\0'))>=0){fields.push(buffer.slice(0,end));buffer=buffer.slice(end+1);if(fields.length<7)continue;const status=fields[5].trim(),renamed=/^[RC]/.test(status);if(renamed&&fields.length<8)continue;const [hash,author,date,title,parents]=fields,oldName=fields[6],fileName=renamed?fields[7]:oldName;fields=[];if(!needle||title.toLowerCase().includes(needle)){if(matched++>=offset)commits.push({hash,author,date,title,parents:parents.split(' ').filter(Boolean),name:fileName,oldName});if(commits.length>size)finish()}}});
  child.on('close',code=>{if(!done)finish(code?Error(stderr||'Git history failed.'):null)});
 });
}

// Pin each page to a commit hash so moving refs cannot shift subsequent pages.
export async function historyPage(root,{ref='HEAD',offset=0,limit=200}={}){
 if(!Number.isSafeInteger(offset)||offset<0)throw Error('잘못된 이력 위치입니다.');
 if(!Number.isInteger(limit)||limit<1||limit>200)throw Error('한 번에 최대 200개 커밋을 불러올 수 있습니다.');
 const {hash}=await commitChoice(root,ref);
 const raw=await git(root,['log','--topo-order',`--skip=${offset}`,'-n',String(limit+1),'--format=%H%x00%P%x00%an%x00%aI%x00%s%x00%b%x00',hash,'--']);
 const rows=raw.split('\0\n').filter(Boolean).map(s=>{const [hash,parents,author,date,title,body]=s.replace(/^\n/,'').split('\0');return {hash,parents:parents?parents.split(' '):[],author,date,title,body:body?.trim()||''}});
 return {hash,commits:rows.slice(0,limit),hasMore:rows.length>limit,nextOffset:offset+Math.min(rows.length,limit)};
}
