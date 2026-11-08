import {repositoryRevision} from './refresh.mjs';
import {gitLaunchError,gitEnvironment,gitScriptCommand,shellQuote} from './git-runtime.mjs';
import {spawn} from 'node:child_process';
import {readFile,writeFile,copyFile,open,rename,lstat,realpath,mkdtemp,rm,mkdir,readdir} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {git,snapshot} from './git.mjs';
import {extras} from './operations.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
export function runGit(root,args,{input='',env={}}={}){return new Promise((resolve,reject)=>{let output='',error='',size=0,limit=false,launchFailed=false;const child=spawn('git',['--no-pager','-c','color.ui=false','-c','core.quotePath=false',...args],{cwd:root,windowsHide:true,env:{...gitEnvironment(),GIT_LITERAL_PATHSPECS:args[0]==='submodule'?'0':'1',...env}});const timer=setTimeout(()=>{limit=true;child.kill('SIGTERM')},120000);child.on('error',async e=>{launchFailed=true;clearTimeout(timer);reject(await gitLaunchError(e,root))});child.stdout.on('data',b=>{size+=b.length;if(size>8*1024*1024){limit=true;child.kill()}else output+=b});child.stderr.on('data',b=>{if(error.length<100000)error+=b});child.stdin.on('error',()=>{});child.on('close',async code=>{clearTimeout(timer);if(launchFailed)return;if(code===0&&!limit)resolve(output);else reject(await gitLaunchError(Object.assign(Error(limit?'Git 작업 시간 또는 출력 한도를 초과했습니다. 새로고침 후 상태를 확인하세요.':error||'Git 작업 실패'),limit?{}:{stderr:error}),root))});child.stdin.end(input)})}
async function filePath(root,name,{allowMissing=false}={}){if(typeof name!=='string'||!name||name.includes('\0')||path.isAbsolute(name)||name.split(/[\\/]/).some(p=>p==='..'||p==='.git'))throw Error('잘못된 파일 경로');const top=await realpath(root),absolute=path.resolve(top,name);if(!absolute.startsWith(top+path.sep))throw Error('저장소 바깥 경로');const parent=await realpath(path.dirname(absolute));if(parent!==top&&!parent.startsWith(top+path.sep))throw Error('심볼릭 링크 경로는 편집할 수 없습니다.');const stat=await lstat(absolute).catch(e=>{if(allowMissing&&e.code==='ENOENT')return null;throw e});if(stat&&(!stat.isFile()||stat.size>1024*1024))throw Error('1MB 이하 일반 텍스트 파일만 지원합니다.');return absolute}
async function textFile(root,name){const absolute=await filePath(root,name);const bytes=await readFile(absolute);if(bytes.includes(0))throw Error('바이너리 파일은 편집할 수 없습니다.');return {absolute,content:bytes.toString('utf8'),revision:digest(bytes)}}
async function known(root,name){const files=(await git(root,['ls-files','-z','--cached','--others','--exclude-standard'])).split('\0');if(!files.includes(name))throw Error('저장소 파일이 아닙니다.');}
async function ready(root){if((await extras(root)).operation)throw Error('진행 중인 작업을 먼저 완료하세요.');if((await snapshot(root)).files.length)throw Error('먼저 커밋하거나 Stash에 보관하세요.');}
async function commitRef(root,ref){if(typeof ref!=='string'||ref.startsWith('-'))throw Error('잘못된 참조');return (await git(root,['rev-parse','--verify','--end-of-options',ref+'^{commit}'])).trim()}
export async function hunks(root,name,staged=false){const f=(await snapshot(root)).files.find(f=>f.name===name);if(!f||f.untracked||f.conflict||f.original)throw Error('부분 스테이징은 충돌·이름 변경이 없는 추적 파일에 지원합니다.');const patch=await git(root,['diff','--no-ext-diff','--no-textconv','--no-renames','--unified=3',...(staged?['--cached']:[]),'--',name]);if(/^(new file mode|deleted file mode|old mode|new mode|Binary files|GIT binary patch)/m.test(patch))throw Error('파일 생성·삭제·모드 변경·바이너리는 파일 단위로 스테이징하세요.');const start=patch.indexOf('\n@@ ');if(start<0)return {revision:digest(patch),hunks:[],header:''};const header=patch.slice(0,start+1);const blocks=patch.slice(start+1).split(/(?=^@@ )/m).filter(Boolean);return {revision:digest(patch),header,hunks:blocks.map((text,index)=>({index,text}))}}
export function selectedLinePatch(header,hunk,selected,reverse=false){
 const lines=hunk.split('\n');if(lines.at(-1)==='')lines.pop();const range=lines.shift().match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(!range)throw Error('잘못된 Diff');
 if(!Array.isArray(selected)||!selected.length||selected.some(i=>!Number.isInteger(i)||i<0||i>=lines.length||!['+','-'].includes(lines[i][0])))throw Error('변경된 줄을 선택하세요.');const chosen=new Set(selected);let result=[],included=false;
 lines.forEach((line,i)=>{const type=line[0];if(type==='\\'){if(included)result.push(line);return}included=true;if(type===' '){result.push(line);return}if(type==='+'||type==='-'){if(chosen.has(i))result.push((reverse?(type==='+'?'-':'+'):type)+line.slice(1));else if(type===(reverse?'+':'-'))result.push(' '+line.slice(1));else included=false;}});
 const oldCount=result.filter(l=>l[0]===' '||l[0]==='-').length,newCount=result.filter(l=>l[0]===' '||l[0]==='+').length,oldStart=Number(range[reverse?3:1]);const newStart=oldCount===0?oldStart+1:newCount===0?Math.max(0,oldStart-1):oldStart;
 return header+`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@\n`+result.join('\n')+'\n';
}
export async function rebasePlan(root,base){const hash=await commitRef(root,base),head=await commitRef(root,'HEAD');await git(root,['merge-base','--is-ancestor',hash,head]);if((await git(root,['rev-list','--merges',`${hash}..${head}`])).trim())throw Error('병합 커밋을 포함한 재정렬은 아직 지원하지 않습니다.');const lines=(await git(root,['log','--reverse','--format=%H%x00%B%x00',`${hash}..${head}`])).split('\0\n').filter(Boolean);if(lines.length>100)throw Error('한 번에 최대 100개 커밋을 편집할 수 있습니다.');return {base:hash,head,commits:lines.map(line=>{const [hash,message]=line.split('\0');return {hash:hash.trim(),title:message.split('\n')[0],message:message.trimEnd(),action:'pick'}})}}
async function recoveryDir(root){const dir=path.join((await git(root,['rev-parse','--absolute-git-dir'])).trim(),'pgit-recovery');await mkdir(dir,{recursive:true,mode:0o700});return dir}
async function discardPreview(root,name){
 if((await extras(root)).operation)throw Error('진행 중인 작업을 먼저 완료하세요.');
 const entry=(await snapshot(root)).files.find(f=>f.name===name);
 if(!entry||entry.untracked||entry.conflict||entry.original||entry.worktree!=='M')throw Error('작업 폴더에서 수정한 추적 텍스트 파일을 선택하세요.');
 const file=await textFile(root,name),base=await git(root,['show',`:${name}`]);
 if(base.includes('\0')||Buffer.byteLength(base)>1024*1024||!Buffer.from(file.content).equals(await readFile(file.absolute)))throw Error('1MB 이하 UTF-8 텍스트 파일만 지원합니다.');
 if((await runGit(root,['hash-object','--stdin'],{input:base})).trim()!==(await git(root,['rev-parse',`:${name}`])).trim())throw Error('스테이징 내용이 변경되었거나 UTF-8 텍스트가 아닙니다.');
 return {name,content:file.content,revision:file.revision,base,indexRevision:digest(base)};
}
async function discardContent(root,preview,content){
 const current=await discardPreview(root,preview.name);
 if(current.revision!==preview.revision||current.indexRevision!==preview.indexRevision)throw Error('파일 또는 스테이징 내용이 변경되었습니다. 다시 확인하세요.');
 const backup={id:randomUUID(),name:preview.name,content:preview.content,redoContent:content,after:digest(content),createdAt:new Date().toISOString(),restored:false};
 await writeFile(path.join(await recoveryDir(root),backup.id+'.json'),JSON.stringify(backup),{flag:'wx',mode:0o600});
 const file=await textFile(root,preview.name);if(file.revision!==preview.revision)throw Error('파일이 변경되었습니다.');await writeFile(file.absolute,content);
}
async function discardPartial(root,d){
 if(d.staged)throw Error('스테이징된 변경은 버릴 수 없습니다.');
 const preview=await discardPreview(root,d.name),patch=await hunks(root,d.name,false);
 if(patch.revision!==d.revision)throw Error('파일이 변경되었습니다. Diff를 다시 열어 주세요.');
 const hunk=patch.hunks.find(h=>h.index===d.index);if(!hunk)throw Error('변경 블록이 없습니다.');
 const partial=d.lines!==undefined,content=partial?selectedLinePatch(patch.header,hunk.text,d.lines,true):patch.header+hunk.text;
 const temp=await mkdtemp(path.join(os.tmpdir(),'pgit-discard-'));
 try{const file=path.join(temp,d.name);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,preview.content);await runGit(temp,['apply',...(partial?[]:['--reverse']),'-'],{input:content});await discardContent(root,preview,await readFile(file,'utf8'))}
 finally{await rm(temp,{recursive:true,force:true})}
}
// Create text files without replacing existing files or following directory links.
async function createText(root,{name,content=''}){
 if(typeof name!=='string'||!name||path.isAbsolute(name)||name.includes('\\')||name.split('/').some(part=>!part||part==='.'||part==='..'||part.toLowerCase()==='.git'||/[<>:"|?*\x00-\x1f]/.test(part)||/[. ]$/.test(part)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)))throw Error('저장소 안의 파일 경로를 입력하세요. 예: src/example.yml');
 if(typeof content!=='string'||Buffer.byteLength(content)>1024*1024||content.includes('\0'))throw Error('1MB 이하의 텍스트만 저장할 수 있습니다.');
 if((await git(root,['ls-files','-z','--cached','--',name])).split('\0').includes(name))throw Error('이미 추적 중인 파일입니다. 기존 파일 편집을 사용하세요.');
 let ignored=false;try{ignored=!!(await git(root,['check-ignore','--no-index','--',name])).trim()}catch(error){if(error.code!==1)throw error}
 if(ignored)throw Error('무시 규칙에 포함된 경로입니다. 다른 경로를 입력하거나 무시 규칙을 수정하세요.');
 const top=await realpath(root);let parent=top;
 for(const part of name.split('/').slice(0,-1)){
  parent=path.join(parent,part);
  try{await mkdir(parent)}catch(error){if(error.code!=='EEXIST')throw error}
  if(!(await lstat(parent)).isDirectory()||await realpath(parent)!==parent)throw Error('심볼릭 링크 또는 파일을 포함한 경로에는 생성할 수 없습니다.');
 }
 try{await writeFile(path.join(parent,name.split('/').at(-1)),content,{flag:'wx'})}
 catch(error){if(error.code==='EEXIST')throw Error('같은 이름의 파일 또는 폴더가 이미 있습니다. 다른 이름을 입력하세요.');throw error}
}
export const advancedActions=new Set(['rebaseCandidates','rewordInfo','rewordCommit','discardHunk','discardLines','redoDiscard','discardPreview','discardFile','recoveryList','recoverFile','hunks','stageHunk','stageLines','stageSelection','readText','createText','saveText','conflictRead','conflictSave','ignoreFile','ignoreCandidates','amendSelectionInfo','amend','amendMessage','rebasePlan','rebaseApply','searchHistory','worktreeLock','worktreeUnlock','submodules','submoduleUpdate','profileRead','profileSave','diffSides']);
export const advancedReads=new Set(['rebaseCandidates','rewordInfo','amendSelectionInfo','ignoreCandidates','discardPreview','recoveryList','hunks','readText','conflictRead','rebasePlan','searchHistory','submodules','profileRead','diffSides']);
export async function advanced(root,action,d={}){switch(action){
case 'discardPreview':return discardPreview(root,d.name);
case 'discardHunk':case 'discardLines':if(action==='discardLines'&&(!Array.isArray(d.lines)||!d.lines.length))throw Error('변경된 줄을 선택하세요.');await discardPartial(root,{...d,lines:action==='discardLines'?d.lines:undefined});break;
case 'discardFile':{const preview=await discardPreview(root,d.name);if(preview.revision!==d.revision||preview.indexRevision!==d.indexRevision)throw Error('파일 또는 스테이징 내용이 변경되었습니다. 다시 확인하세요.');await discardContent(root,preview,preview.base);break}
case 'recoveryList':{const dir=await recoveryDir(root),items=[];for(const name of await readdir(dir)){if(!/^[a-f0-9-]{36}\.json$/.test(name))continue;const item=JSON.parse(await readFile(path.join(dir,name),'utf8'));items.push({id:item.id,name:item.name,createdAt:item.createdAt,restored:!!item.restored})}return items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
case 'recoverFile':case 'redoDiscard':{
 if((await extras(root)).operation)throw Error('진행 중인 작업을 먼저 완료하세요.');if(!/^[a-f0-9-]{36}$/.test(d.id))throw Error('잘못된 복구 항목');
 const location=path.join(await recoveryDir(root),d.id+'.json'),backup=JSON.parse(await readFile(location,'utf8')),redo=action==='redoDiscard';
 if(!!backup.restored!==redo||redo&&typeof backup.redoContent!=='string')throw Error('복구 상태가 변경되었습니다. 목록을 다시 여세요.');
 await known(root,backup.name);const file=await textFile(root,backup.name);
 if(file.revision!==(redo?digest(backup.content):backup.after))throw Error('변경 취소 이후 파일이 수정되었습니다. 현재 내용을 보관한 뒤 복구하세요.');
 if(!redo&&typeof backup.redoContent!=='string')backup.redoContent=file.content;await writeFile(file.absolute,redo?backup.redoContent:backup.content);backup.restored=!redo;await writeFile(location,JSON.stringify(backup),{mode:0o600});break
}
case 'hunks':return hunks(root,d.name,!!d.staged);
case 'stageSelection':{
 const p=await hunks(root,d.name,!!d.staged);if(p.revision!==d.revision)throw Error('파일이 변경되었습니다. Diff를 다시 확인하세요.');
 if(!Array.isArray(d.selections)||!d.selections.length||d.selections.length>p.hunks.length)throw Error('변경된 줄을 선택하세요.');
 const seen=new Set();const parts=d.selections.slice().sort((a,b)=>a.index-b.index).map(selection=>{if(seen.has(selection.index))throw Error('중복된 변경 블록');seen.add(selection.index);const h=p.hunks.find(h=>h.index===selection.index);if(!h)throw Error('변경 블록 없음');return selectedLinePatch('',h.text,selection.lines,!!d.staged)});
 const patch=p.header+parts.join('');await runGit(root,['apply','--cached','--check','-'],{input:patch});await runGit(root,['apply','--cached','-'],{input:patch});break;
}
case 'stageLines':{const p=await hunks(root,d.name,!!d.staged);if(p.revision!==d.revision)throw Error('파일이 변경되었습니다.');const h=p.hunks.find(h=>h.index===d.index);if(!h)throw Error('변경 블록 없음');const patch=selectedLinePatch(p.header,h.text,d.lines,!!d.staged);await runGit(root,['apply','--cached','--check','-'],{input:patch});await runGit(root,['apply','--cached','-'],{input:patch});break}
case 'stageHunk':{const p=await hunks(root,d.name,!!d.staged);if(p.revision!==d.revision)throw Error('파일이 변경되었습니다. Diff를 다시 열어 주세요.');const h=p.hunks.find(h=>h.index===d.index);if(!h)throw Error('변경 블록이 없습니다.');await runGit(root,['apply','--cached',...(d.staged?['--reverse']:[]),'--check','-'],{input:p.header+h.text});await runGit(root,['apply','--cached',...(d.staged?['--reverse']:[]),'-'],{input:p.header+h.text});break}
case 'createText':await createText(root,d);break;
case 'readText':await known(root,d.name);{const {content,revision}=await textFile(root,d.name);return {content,revision}}
case 'saveText':{await known(root,d.name);const f=await textFile(root,d.name);if(f.revision!==d.revision)throw Error('파일이 외부에서 변경되었습니다. 다시 열어 주세요.');if(typeof d.content!=='string'||Buffer.byteLength(d.content)>1024*1024||d.content.includes('\0'))throw Error('텍스트가 너무 큽니다.');await writeFile(f.absolute,d.content);break}
case 'conflictRead':{if(!(await snapshot(root)).files.some(f=>f.name===d.name&&f.conflict))throw Error('충돌 파일이 아닙니다.');const f=await textFile(root,d.name);const sides=await Promise.all([1,2,3].map(n=>git(root,['show',`:${n}:${d.name}`]).catch(()=>'')));return {...f,absolute:undefined,base:sides[0],ours:sides[1],theirs:sides[2]}}
case 'conflictSave':{if(!(await snapshot(root)).files.some(f=>f.name===d.name&&f.conflict))throw Error('충돌 파일이 아닙니다.');if(/^([<|=>])\1{6}/m.test(d.content))throw Error('충돌 마커가 남아 있습니다.');await advanced(root,'saveText',d);await git(root,['add','--',d.name]);break}
case 'ignoreCandidates':return (await git(root,['ls-files','--others','--exclude-standard','-z'])).split('\0').filter(name=>name&&name!=='.gitignore');
case 'ignoreFile':{
 const names=[...new Set(Array.isArray(d.names)?d.names:[d.name])];if(!names.length||names.length>5000||names.some(name=>typeof name!=='string'||!name||/[\r\n\0]/.test(name)||name==='.gitignore'))throw Error('무시할 파일을 선택하세요.');
 const untracked=new Set((await git(root,['ls-files','--others','--exclude-standard','-z'])).split('\0'));if(names.some(name=>!untracked.has(name)))throw Error('선택한 파일 상태가 변경되었습니다. 다시 선택하세요.');
 const absolute=await filePath(root,'.gitignore',{allowMissing:true}),previous=await readFile(absolute,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e}),existing=new Set(previous.split('\n'));
 const patterns=names.map(name=>'/'+name.replace(/[\\*?\[\]#! ]/g,'\\$&')).filter(pattern=>!existing.has(pattern));
 if(patterns.length)await writeFile(absolute,previous+(previous&&!previous.endsWith('\n')?'\n':'')+patterns.join('\n')+'\n');break
}
case 'rebaseCandidates':return rebaseCandidates(root);
case 'rewordInfo':return rewordInfo(root,d);
case 'rewordCommit':await rewordCommit(root,d);break;
case 'amendSelectionInfo':return amendSelectionInfo(root);
case 'amendMessage':case 'amend':{if(action==='amend'&&d.names){await amendSelection(root,d);break}if((await extras(root)).operation)throw Error('진행 중인 작업을 완료하세요.');if(typeof d.message!=='string'||!d.message.trim()||d.message.length>4000)throw Error('메시지를 입력하세요.');if(action==='amend'&&!(await git(root,['diff','--cached','--name-only'])).trim())throw Error('스테이징한 변경이 없습니다.');const expected=await commitRef(root,'HEAD');if(expected!==d.head)throw Error('HEAD가 변경되었습니다.');await git(root,['update-ref',`refs/pgit/backups/${Date.now()}`,expected]);await git(root,['commit','--amend',...(action==='amendMessage'?['--only']:[]),'-m',d.message]);break}
case 'rebasePlan':return rebasePlan(root,d.base);
case 'rebaseApply':{await ready(root);const plan=await rebasePlan(root,d.base);if(plan.head!==d.head)throw Error('HEAD가 변경되었습니다. 계획을 다시 여세요.');if(!Array.isArray(d.commits)||d.commits.length!==plan.commits.length||!d.commits.length)throw Error('잘못된 커밋 목록');const expected=new Set(plan.commits.map(c=>c.hash));let preceding=false;for(const c of d.commits){if(!expected.delete(c.hash)||!['pick','reword','drop','squash','fixup'].includes(c.action))throw Error('잘못된 리베이스 계획');if(['squash','fixup'].includes(c.action)&&!preceding)throw Error('Squash/Fixup 앞에는 유지할 커밋이 필요합니다.');if(c.action==='reword'&&(typeof c.message!=='string'||!c.message.trim()||c.message.length>4000||c.message.includes('\0')))throw Error('커밋 메시지를 1~4,000자로 입력하세요.');if(['pick','reword'].includes(c.action))preceding=true}if(!preceding)throw Error('하나 이상의 커밋을 유지하세요.');await git(root,['update-ref',`refs/pgit/backups/${Date.now()}`,plan.head]);const temp=await mkdtemp(path.join((await git(root,['rev-parse','--absolute-git-dir'])).trim(),'pgit-rebase-'));let finished=false;try{const todo=path.join(temp,'todo');const steps=[];for(const [i,c] of d.commits.entries()){steps.push(`${c.action==='reword'?'pick':c.action} ${c.hash}`);if(c.action==='reword'){const messageFile=path.join(temp,'message-'+i);await writeFile(messageFile,c.message+'\n',{mode:0o600});steps.push('exec '+gitScriptCommand('reword-commit.cjs')+' '+shellQuote(process.platform==='win32'?messageFile.replace(/\\/g,'/'):messageFile))}}await writeFile(todo,steps.join('\n')+'\n');const editor=gitScriptCommand('sequence-editor.cjs');await runGit(root,['rebase','--interactive',plan.base],{env:{GIT_SEQUENCE_EDITOR:editor,GIT_EDITOR:gitScriptCommand('git-noop.cjs'),PGIT_TODO:todo,ELECTRON_RUN_AS_NODE:'1'}});finished=true}finally{if(finished)await rm(temp,{recursive:true,force:true})}break}
case 'searchHistory':{const q=typeof d.query==='string'?d.query.trim():'';if(!q||q.length>200)throw Error('검색어를 1~200자로 입력하세요.');const raw=await git(root,['log','--all','-n','201','--regexp-ignore-case','--fixed-strings',`--grep=${q}`,'--format=%H%x00%P%x00%an%x00%aI%x00%s%x00%b%x00']);const commits=raw.split('\0\n').filter(Boolean).map(line=>{const [hash,parents,author,date,title,body]=line.replace(/^\n/,'').split('\0');return {hash,parents:parents?parents.split(' '):[],author,date,title,body:body?.trim()||''}});return {commits:commits.slice(0,200),hasMore:commits.length>200}}
case 'worktreeLock':case 'worktreeUnlock':{const target=await realpath(d.path);let w;for(const item of (await extras(root)).worktrees){if(await realpath(item.path).then(p=>p===target,()=>false)){w=item;break}}if(!w)throw Error('등록된 worktree가 아닙니다.');await git(root,['worktree',action==='worktreeLock'?'lock':'unlock','--',w.path]);break}
case 'submodules':return git(root,['submodule','status','--recursive']);
case 'submoduleUpdate':await runGit(root,['submodule','update','--init','--recursive']);break;
case 'profileRead':return {name:await git(root,['config','user.name']).then(s=>s.trim(),()=>''),email:await git(root,['config','user.email']).then(s=>s.trim(),()=>''),sign:await git(root,['config','commit.gpgsign']).then(s=>s.trim()==='true',()=>false)};
case 'profileSave':{for(const key of ['name','email'])if(typeof d[key]!=='string'||!d[key].trim()||/[\r\n\0]/.test(d[key]))throw Error('이름과 이메일을 입력하세요.');await git(root,['config','--local','user.name',d.name]);await git(root,['config','--local','user.email',d.email]);await git(root,['config','--local','commit.gpgsign',d.sign?'true':'false']);break}
case 'diffSides':{await known(root,d.name);const f=await textFile(root,d.name);const base=await git(root,['show',`HEAD:${d.name}`]).catch(()=> '');return {base,content:f.content}}
default:throw Error('지원하지 않는 고급 작업입니다.');}return null;}

async function amendSelectionInfo(root){
 const state=await snapshot(root);if(!state.head)throw Error('커밋이 없습니다.');
 return {head:state.head,message:(await git(root,['show','-s','--format=%B','HEAD'])).replace(/\n$/,''),files:state.files,revision:await repositoryRevision(root)};
}
async function amendSelection(root,d){
 if((await extras(root)).operation)throw Error('진행 중인 작업을 완료하세요.');
 if(typeof d.message!=='string'||!d.message.trim()||d.message.length>4000)throw Error('메시지를 입력하세요.');
 const info=await amendSelectionInfo(root);if(info.head!==d.head)throw Error('HEAD가 변경되었습니다.');if(info.revision!==d.revision)throw Error('파일 상태가 변경되었습니다. 새로고침하세요.');
 if(!Array.isArray(d.names)||!d.names.length||new Set(d.names).size!==d.names.length||d.names.some(n=>typeof n!=='string'||!info.files.some(f=>f.name===n)))throw Error('파일을 선택하세요.');
 if(info.files.some(f=>f.conflict))throw Error('충돌을 먼저 해결하세요.');
 const chosen=info.files.filter(f=>d.names.includes(f.name)),paths=[...new Set(chosen.flatMap(f=>[f.name,...(f.original?[f.original]:[])]))];
 const index=path.resolve(root,(await git(root,['rev-parse','--git-path','index'])).trim()),lock=index+'.lock';
 const held=await open(lock,'wx');let temp,ownsLock=true;
 try{
  if(await repositoryRevision(root)!==d.revision)throw Error('파일 상태가 변경되었습니다. 새로고침하세요.');
  temp=await mkdtemp(path.join(path.dirname(index),'pgit-amend-'));const next=path.join(temp,'next'),restored=path.join(temp,'restored');const env={GIT_INDEX_FILE:next};
  await copyFile(index,restored);await git(root,['read-tree',d.head],{env});
  const staged=chosen.filter(f=>f.index!==' '&&f.index!=='?').flatMap(f=>[f.name,...(f.original?[f.original]:[])]);
  if(staged.length){const patch=await git(root,['diff','--cached','--binary','--full-index','--no-renames',d.head,'--',...staged]);if(patch)await runGit(root,['apply','--cached','--binary','-'],{input:patch,env})}
  const unstaged=chosen.filter(f=>f.index===' '||f.index==='?').map(f=>f.name);if(unstaged.length)await git(root,['add','-A','--',...unstaged],{env});
  if(await repositoryRevision(root)!==d.revision)throw Error('파일 상태가 변경되었습니다. 새로고침하세요.');
  const tree=(await git(root,['write-tree'],{env})).trim();
  await git(root,['reset',tree,'--',...paths],{env:{GIT_INDEX_FILE:restored}});
  await writeFile(lock,await readFile(restored));
  await git(root,['update-ref',`refs/pgit/backups/${Date.now()}`,d.head]);
  await git(root,['commit','--amend','-m',d.message],{env});
  await held.close();await rename(lock,index);ownsLock=false;
 }finally{await held.close().catch(()=>{});if(ownsLock)await rm(lock,{force:true});if(temp)await rm(temp,{recursive:true,force:true})}
}

async function rewordInfo(root,d){
 if((await extras(root)).operation)throw Error('진행 중인 작업을 먼저 완료하세요.');
 const head=await commitRef(root,'HEAD'),target=await commitRef(root,d.target);
 try{await git(root,['merge-base','--is-ancestor',target,head])}catch{throw Error('현재 브랜치에 포함된 커밋만 수정할 수 있습니다.')}
 const descendants=(await git(root,['rev-list','--reverse','--topo-order','--ancestry-path',target+'..'+head])).trim().split('\n').filter(Boolean);
 return {head,target,count:descendants.length+1,message:(await git(root,['show','-s','--format=%B',target])).replace(/\n$/,''),descendants};
}
async function rewordCommit(root,d){
 if(typeof d.message!=='string'||!d.message.trim()||d.message.length>4000||d.message.includes('\0'))throw Error('메시지를 입력하세요.');
 if(await commitRef(root,'HEAD')!==d.head)throw Error('HEAD가 변경되었습니다.');
 const plan=await rewordInfo(root,d);if(plan.head!==d.head)throw Error('HEAD가 변경되었습니다.');
 const branch=(await git(root,['symbolic-ref','-q','HEAD']).catch(()=> 'HEAD')).trim();
 const mapped=new Map();
 for(const hash of [plan.target,...plan.descendants]){
  const raw=await git(root,['cat-file','commit',hash]),split=raw.indexOf('\n\n');
  if(split<0||raw.includes('\ufffd'))throw Error('UTF-8 커밋 메시지만 수정할 수 있습니다.');
  const headers=raw.slice(0,split).split(/\n(?! )/).filter(h=>! /^(gpgsig(?:-sha256)?|mergetag) /.test(h));
  if(headers.some(h=>h.startsWith('encoding ')&&!/^encoding utf-?8$/i.test(h)))throw Error('UTF-8 커밋 메시지만 수정할 수 있습니다.');
  const updated=headers.map(h=>h.startsWith('parent ')?'parent '+(mapped.get(h.slice(7))||h.slice(7)):h).join('\n');
  const message=hash===plan.target?d.message.replace(/\n*$/,'')+'\n':raw.slice(split+2);
  mapped.set(hash,(await runGit(root,['hash-object','-t','commit','-w','--stdin'],{input:updated+'\n\n'+message})).trim());
 }
 if((await git(root,['symbolic-ref','-q','HEAD']).catch(()=> 'HEAD')).trim()!==branch)throw Error('HEAD가 변경되었습니다.');
 await git(root,['update-ref','refs/pgit/backups/reword-'+randomUUID(),plan.head]);
 await git(root,['update-ref','-m','pgit: reword commit',branch,mapped.get(plan.head),plan.head]);
}

async function rebaseCandidates(root){
 const commits=(await git(root,['log','--topo-order','-n','101','--format=%H%x00%s%x00%an%x00%aI%x00%P'])).trim().split('\n').filter(Boolean).map(line=>{const [hash,title,author,date,parents]=line.split('\0');return {hash,title,author,date,parents:parents?parents.split(' '):[]}});
 const eligible=new Map();let current=commits[0],count=0;while(current){eligible.set(current.hash,count++);if(current.parents.length!==1)break;current=commits.find(c=>c.hash===current.parents[0])}
 return commits.map(c=>({...c,count:eligible.get(c.hash)||0,reason:c.hash===commits[0].hash?'현재 마지막 커밋 · 이후 커밋 없음':!eligible.has(c.hash)?'이후 범위에 병합 커밋 포함':''}));
}
