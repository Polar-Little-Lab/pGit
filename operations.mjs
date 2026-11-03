import {backgroundGitEnvironment} from './git-runtime.mjs';
import {remoteWebInfo} from './provider-remotes.mjs';
import {cherryPickPlan} from './multi-commit.mjs';
import {mergePreview} from './merge-preview.mjs';
import {git, fileHistoryPage, snapshot, openRepo, parseStatus} from './git.mjs';
import {access, mkdir, realpath, readdir, rm, readFile, lstat} from 'node:fs/promises';
import path from 'node:path';

const text=(value,label)=>{if(typeof value!=='string'||!value.trim()||value.includes('\0')||value.length>4096)throw Error(`${label}을 입력하세요.`);return value.trim()};
async function ref(root,value){const name=text(value,'참조');if(name.startsWith('-'))throw Error('잘못된 참조');return (await git(root,['rev-parse','--verify','--end-of-options',`${name}^{commit}`])).trim()}
async function branchName(root,value){const name=text(value,'브랜치 이름');await git(root,['check-ref-format','--branch',name]);return name}
async function localBranch(root,value){const name=await branchName(root,value);await git(root,['show-ref','--verify',`refs/heads/${name}`]);return name}
async function remoteName(root,value){const name=text(value,'원격 이름');if(!(await git(root,['remote'])).trim().split('\n').includes(name))throw Error('원격 저장소가 없습니다.');return name}
async function clean(root){if((await snapshot(root)).files.length)throw Error('먼저 변경을 커밋하거나 stash에 보관하세요.');}
async function idle(root){if((await extras(root)).operation)throw Error('진행 중인 작업을 계속하거나 중단하세요.');}
function remoteURL(value){const url=text(value,'원격 URL');if(!/^(https:\/\/[^\s]+|ssh:\/\/[^\s]+|[\w.-]+@[\w.-]+:[^\s]+|\/[^\0]*)$/.test(url))throw Error('HTTPS, SSH 또는 로컬 절대 경로를 사용하세요.');if(/^https:\/\/[^/]*@/.test(url))throw Error('URL에 토큰을 넣지 마세요. Git credential helper를 사용하세요.');return url}
async function exists(file){return access(file).then(()=>true,()=>false)}
export async function extras(root){
 const dir=(await git(root,['rev-parse','--absolute-git-dir'])).trim();
 let operation=null;for(const [file,name] of [['rebase-merge','rebase'],['rebase-apply','rebase'],['MERGE_HEAD','merge'],['CHERRY_PICK_HEAD','cherry-pick'],['REVERT_HEAD','revert']])if(await exists(path.join(dir,file))){operation=name;break}
 const remotes=(await git(root,['remote'])).trim().split('\n').filter(Boolean);
 const refs=(await git(root,['for-each-ref','--format=%(refname)%09%(objectname)%09%(*objectname)%09%(subject)','refs/remotes','refs/tags'])).trim().split('\n').filter(Boolean).map(s=>{const [name,object,peeled,...subject]=s.split('\t');return {name,hash:peeled||object,subject:subject.join('\t')}});
 const stashes=(await git(root,['stash','list','--format=%H%x09%gd%x09%gs'])).trim().split('\n').filter(Boolean).map(s=>{const [hash,name,...title]=s.split('\t');return {hash,name,title:title.join('\t')}});
 const upstream=await git(root,['rev-parse','--abbrev-ref','--symbolic-full-name','@{upstream}']).then(s=>s.trim(),()=>null);
 const counts=upstream?await git(root,['rev-list','--left-right','--count','HEAD...@{upstream}']).then(s=>s.trim().split(/\s+/).map(Number),()=>[0,0]):[0,0];
 const worktrees=await worktreeOverview(root);
 const remoteDetails=await Promise.all(remotes.map(async name=>({name,...remoteWebInfo(await git(root,['remote','get-url',name]).then(s=>s.trim(),()=>''))})));
 return {remotes,remoteDetails,refs,stashes,upstream,ahead:counts[0],behind:counts[1],operation,worktrees};
}
export async function worktreeEntries(root){
 return (await git(root,['worktree','list','--porcelain','-z'])).split('\0\0').filter(Boolean).map((block,index)=>{
  const fields=block.split('\0'),value=key=>fields.find(x=>x.startsWith(key+' '))?.slice(key.length+1);
  return {path:path.resolve(value('worktree')),branch:value('branch')||null,head:value('HEAD')||null,main:index===0,detached:fields.includes('detached'),bare:fields.includes('bare'),locked:fields.some(x=>x==='locked'||x.startsWith('locked ')),lockReason:value('locked')||'',prunable:fields.some(x=>x==='prunable'||x.startsWith('prunable '))};
 });
}
export async function worktreeOverview(root){
 const entries=await worktreeEntries(root),result=[];
 for(let i=0;i<entries.length;i+=4)result.push(...await Promise.all(entries.slice(i,i+4).map(async item=>{
  if(item.bare)return {...item,current:false,changes:null,error:null};
  try{const current=await realpath(item.path)===await realpath(root);const changes=parseStatus(await git(item.path,['status','--porcelain=v1','-z','--untracked-files=all'])).length;return {...item,current,changes,error:null}}
  catch{return {...item,current:false,changes:null,error:'작업 폴더 상태를 읽을 수 없습니다.'}}
 })));
 return result;
}
export async function fullState(root,limit){return {...await snapshot(root,limit),...await extras(root)}}
export async function createRepository(kind,data){const target=text(data.path,'대상 절대 경로');if(!path.isAbsolute(target))throw Error('절대 경로가 필요합니다.');if(kind==='init'){await mkdir(target,{recursive:true});if(await git(target,['rev-parse','--show-toplevel']).then(()=>true,()=>false))throw Error('이미 Git 저장소 안에 있습니다.');await git(target,['init','-b','main'])}else {if(await exists(target))throw Error('복제 대상은 아직 존재하지 않는 폴더여야 합니다.');await git(path.dirname(target),['clone','--',remoteURL(data.url),target]);}return openRepo(target)}
export const readOperations=new Set(['remoteTags','cherryPickPreview','worktreeOverview','mergePreview','stashDiff','fileHistory','fileHistoryPage','blameView','blame','compare','reflog','remoteList','worktreeList','trackedFiles']);
export async function operate(root,action,d={}){
 switch(action){
 case 'mergePreview':return mergePreview(root,d);
 case 'branchCreate':await idle(root);await git(root,['branch',await branchName(root,d.name),await ref(root,d.ref||'HEAD')]);break;
 case 'branchSwitch':await idle(root);await clean(root);await git(root,['switch',await localBranch(root,d.name)]);break;
 case 'branchRename':await idle(root);await git(root,['branch','-m',await localBranch(root,d.name),await branchName(root,d.newName)]);break;
 case 'branchDelete':await idle(root);await git(root,['branch','-d',await localBranch(root,d.name)]);break;
 case 'remoteAdd':{const name=text(d.name,'원격 이름');if(!/^[a-zA-Z0-9][\w.-]*$/.test(name))throw Error('잘못된 원격 이름');await git(root,['remote','add',name,remoteURL(d.url)]);break}
 case 'remoteRemove':await git(root,['remote','remove',await remoteName(root,d.name)]);break;
 case 'remoteList':return git(root,['remote','-v']);
 case 'fetch':await git(root,['fetch','--prune',await remoteName(root,d.remote)]);break;
 case 'pull':{const strategy=d.strategy||'ff-only';if(!['ff-only','merge','rebase'].includes(strategy))throw Error('잘못된 Pull 방식');await idle(root);await clean(root);if(!(await extras(root)).upstream)throw Error('Push로 추적 브랜치를 먼저 설정하세요.');await git(root,['pull',...(strategy==='ff-only'?['--ff-only']:strategy==='merge'?['--no-rebase','--ff','--no-edit']:['--rebase'])]);break;}
 case 'push':{await idle(root);const branch=(await snapshot(root)).branch;await localBranch(root,branch);await git(root,['push','--set-upstream',await remoteName(root,d.remote),`refs/heads/${branch}:refs/heads/${branch}`]);break}
 case 'tagCreate':{const name=text(d.name,'태그 이름');await git(root,['check-ref-format',`refs/tags/${name}`]);if(name.startsWith('-'))throw Error('잘못된 태그');await git(root,['tag',...(d.message?['-a','-m',text(d.message,'태그 메시지')]:[]),name,await ref(root,d.ref||'HEAD')]);break}
 case 'tagDelete':{const name=text(d.name,'태그 이름');await git(root,['show-ref','--verify',`refs/tags/${name}`]);await git(root,['tag','-d','--',name]);break}
 case 'stashSave':await idle(root);await git(root,['stash','push','--include-untracked','-m',text(d.message||'pGit stash','메시지')]);break;
 case 'stashApply':case 'stashPop':case 'stashDrop':case 'stashDiff':{const stash=(await extras(root)).stashes.find(s=>s.hash===d.hash);if(!stash)throw Error('Stash가 변경되었습니다. 새로고침하세요.');if(action==='stashDiff')return git(root,['stash','show','-p','--include-untracked',stash.name]);await idle(root);if(action!=='stashDrop')await clean(root);await git(root,['stash',action==='stashApply'?'apply':action==='stashPop'?'pop':'drop',stash.name]);break}
 case 'merge':{await idle(root);await clean(root);const target=await ref(root,d.ref);if((d.expectedHead&&d.expectedHead!==await ref(root,'HEAD'))||(d.expectedTarget&&d.expectedTarget!==target))throw Error('검사 이후 브랜치가 변경되었습니다. 다시 검사하세요.');await git(root,['merge','--no-edit',target]);break;}
 case 'rebase':await idle(root);await clean(root);await git(root,['rebase',await ref(root,d.ref)]);break;
 case 'cherryPickPreview':return cherryPickPlan(root,d.refs);
 case 'cherryPickMany':{
  await idle(root);await clean(root);const plan=await cherryPickPlan(root,d.refs);
  if(plan.head!==d.expectedHead||plan.branch!==d.expectedBranch)throw Error('현재 브랜치가 변경되었습니다. 적용 대상을 다시 확인하세요.');
  await git(root,['cherry-pick','--no-edit',...plan.commits.map(commit=>commit.hash)]);break;
 }
 case 'cherryPick':case 'revert':if(action==='cherryPick'&&d.expectedHead){const current=await snapshot(root);if(current.head!==d.expectedHead||current.branch!==d.expectedBranch)throw Error('작업 대상 브랜치가 변경되었습니다. 다시 열어주세요.')}await idle(root);await clean(root);await git(root,[action==='cherryPick'?'cherry-pick':'revert','--no-edit',await ref(root,d.ref)]);break;
 case 'continue':case 'abort':{const op=(await extras(root)).operation;if(!op)throw Error('진행 중인 작업이 없습니다.');await git(root,op==='merge'&&action==='continue'?['commit','--no-edit']:[op,action==='continue'?'--continue':'--abort']);if(op==='rebase'&&!(await extras(root)).operation){const dir=(await git(root,['rev-parse','--absolute-git-dir'])).trim();for(const entry of await readdir(dir,{withFileTypes:true}))if(entry.isDirectory()&&/^pgit-rebase-[a-zA-Z0-9]+$/.test(entry.name))await rm(path.join(dir,entry.name),{recursive:true,force:true})}break}
 case 'resolve':{const files=(await snapshot(root)).files;if(!files.some(f=>f.name===d.name&&f.conflict))throw Error('충돌 파일을 선택하세요.');const file=path.resolve(root,d.name);const stat=await lstat(file).catch(e=>{if(e.code==='ENOENT')return null;throw e});if(stat?.isFile()&&/^([<|=>])\1{6}/m.test(await readFile(file,'utf8')))throw Error('충돌 마커가 남아 있습니다. 충돌 편집기에서 해결하세요.');await git(root,['add','--',d.name]);break}
 case 'undoCommit':await idle(root);await clean(root);await git(root,['reset','--soft',await ref(root,'HEAD~1')]);break;
 case 'fileHistoryPage':{
  const name=d.name;if(typeof name!=='string'||!name||name.includes('\0')||name.length>4096)throw Error('추적 중인 파일을 선택하세요.');
  const tracked=(await git(root,['--literal-pathspecs','ls-files','-z','--',name])).split('\0');if(!tracked.includes(name))throw Error('추적 중인 파일을 선택하세요.');
  const offset=d.offset??0;if(!Number.isSafeInteger(offset)||offset<0)throw Error('잘못된 참조');
  const query=typeof d.query==='string'?d.query.trim():'';if(query.includes('\0')||query.length>256)throw Error('검색어는 256자 이하로 입력하세요.');
  return fileHistoryPage(root,{name,revision:await ref(root,d.revision||'HEAD'),query,offset});
 }
 case 'blameView':{
  const name=d.name;if(typeof name!=='string'||!name||name.includes('\0'))throw Error('추적 중인 파일을 선택하세요.');
  const revision=await ref(root,'HEAD'),object=revision+':'+name;
  const size=Number((await git(root,['cat-file','-s',object])).trim());if(size>1024*1024)throw Error('1MB가 넘는 파일은 미리보기를 생략합니다.');
  const content=await git(root,['show',object]);if(content.includes('\0'))throw Error('바이너리 파일입니다. 미리보기를 제공하지 않습니다.');
  if(content.split('\n').length>20000)throw Error('파일이 너무 커서 줄별 이력을 표시할 수 없습니다.');
  const raw=await git(root,['blame','--line-porcelain',revision,'--',name]),lines=[];let item;
  for(const line of raw.split('\n')){const header=line.match(/^([a-f0-9]{40,64}) (\d+) (\d+)(?: \d+)?$/);if(header){item={hash:header[1],originalLine:Number(header[2]),line:Number(header[3])};continue}if(!item)continue;
   if(line.startsWith('author '))item.author=line.slice(7);else if(line.startsWith('author-time '))item.date=new Date(Number(line.slice(12))*1000).toISOString();else if(line.startsWith('summary '))item.title=line.slice(8);else if(line.startsWith('filename ')){const value=line.slice(9);item.name=value.startsWith('"')?JSON.parse(value):value}else if(line.startsWith('\t')){lines.push({...item,content:line.slice(1)});item=null}
  }
  return {name,revision,lines};
 }
 case 'fileHistory':case 'blame':{const name=text(d.name,'파일 경로');const files=(await git(root,['ls-files','-z'])).split('\0');if(!files.includes(name))throw Error('추적 중인 파일을 선택하세요.');return action==='blame'?git(root,['blame','--date=short','--',name]):git(root,['log','--follow','-n','100','--format=%h %aI %an%n%s','--',name]);}
 case 'trackedFiles':return (await git(root,['ls-files','-z'])).split('\0').filter(Boolean);
 case 'compare':return git(root,['diff','--stat','--patch','--no-ext-diff','--no-textconv',await ref(root,d.from),await ref(root,d.to),'--']);
 case 'reflog':return git(root,['reflog','-n','100','--date=iso']);
 case 'remoteTags':{
 const names=(await git(root,['remote'])).trim().split('\n');if(!names.includes(d.remote))throw Error('등록된 원격 저장소를 선택하세요.');
 const raw=await git(root,['-c','credential.interactive=false','-c','core.sshCommand=ssh -o BatchMode=yes -o ConnectTimeout=10','ls-remote','--tags','--',d.remote],{env:backgroundGitEnvironment()});
 const tags=new Map();for(const line of raw.trim().split('\n')){const [hash,ref]=line.split('\t');if(!ref?.startsWith('refs/tags/'))continue;const name=ref.slice(10).replace(/\^\{\}$/,'');const item=tags.get(name)||{name};if(ref.endsWith('^{}'))item.target=hash;else item.hash=hash;tags.set(name,item)}return [...tags.values()].sort((a,b)=>a.name.localeCompare(b.name));
 }
 case 'worktreeOverview':return worktreeOverview(root);
 case 'worktreeList':return git(root,['worktree','list']);
 case 'worktreeAdd':{await idle(root);const target=text(d.path,'절대 경로');if(!path.isAbsolute(target)||await exists(target))throw Error('존재하지 않는 절대 경로를 입력하세요.');await git(root,['worktree','add','-b',await branchName(root,d.name),'--',target,await ref(root,d.ref||'HEAD')]);break}
 case 'worktreeRemove':{const target=await realpath(text(d.path,'worktree 경로'));const entries=await worktreeEntries(root);let item;for(const w of entries){if(await realpath(w.path).then(p=>p===target,()=>false)){item=w;break}}if(!item)throw Error('등록된 worktree가 아닙니다.');if(item.main||target===await realpath(root))throw Error('기본 또는 현재 작업 폴더는 삭제할 수 없습니다.');if(item.locked)throw Error('잠금을 해제한 뒤 삭제하세요.');await git(root,['worktree','remove','--',target]);break;}
 default:throw Error('지원하지 않는 작업입니다.');
 }
 return null;
}
