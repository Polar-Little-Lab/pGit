// Explicit commands share one accessible form; no arbitrary shell execution.
const commands={
 branchCreate:['브랜치 만들기',[['name','브랜치 이름'],['ref','시작 커밋','commits',false,'HEAD']]],
 branchSwitch:['브랜치 전환',[['name','전환할 브랜치','branches']],'작업 폴더가 깨끗한 경우에만 전환합니다.'],
 branchRename:['브랜치 이름 변경',[['name','기존 브랜치','branches'],['newName','새 이름']]],
 branchDelete:['브랜치 삭제',[['name','삭제할 브랜치','branches']]],
 remoteAdd:['원격 추가',[['name','원격 이름','origin'],['url','원격 저장소 주소']]],
 remoteRemove:['원격 제거',[['name','원격 이름','remotes']],'원격 설정과 해당 원격 추적 참조를 제거합니다.'],
 remoteList:['원격 주소 보기',[]],fetch:['Fetch',[['remote','원격','remotes']]],pull:['Pull',[['strategy','Pull 방식','pullStrategies']]],push:['Push',[['remote','원격','remotes']],'현재 브랜치를 원격의 같은 이름 브랜치로 전송합니다. 강제 Push는 하지 않습니다.'],
 stashSave:['Stash 만들기',[['message','설명','pGit stash']],'추적하지 않는 새 파일도 보관합니다.'],stashApply:['Stash 적용',[['hash','Stash','stashes']]],stashPop:['Stash 적용 후 제거',[['hash','Stash','stashes']]],stashDrop:['Stash 삭제',[['hash','Stash','stashes']],'선택한 Stash를 삭제합니다. 이 작업은 취소할 수 없습니다.'],stashDiff:['Stash Diff',[['hash','Stash','stashes']]],
 tagCreate:['태그 만들기',[['name','태그 이름'],['ref','대상 커밋','commits',false,'HEAD'],['message','설명 (비우면 lightweight)','','optional']]],tagDelete:['로컬 태그 삭제',[['name','태그','tags']]],
 mergePreview:['병합 전 충돌 검사',[['ref','검사할 참조','mergeRefs']]],
 merge:['병합',[['ref','현재 브랜치에 합칠 참조','branches']]],rebase:['리베이스',[['ref','기준 브랜치','branches']],'현재 브랜치의 커밋 해시가 변경됩니다. 공유한 브랜치에서는 신중하게 실행하세요.'],cherryPick:['Cherry-pick',[['ref','대상 커밋','commits']]],revert:['Revert',[['ref','대상 커밋','commits']],'변경을 반대로 적용하는 새 커밋을 만듭니다.'],
 continue:['작업 계속',[],'충돌 파일을 수정하고 해결됨으로 표시한 뒤 계속하세요.'],abort:['진행 중인 작업 중단',[],'현재 병합·리베이스 등의 변경을 취소합니다. 충돌 해결 중 수정한 내용을 잃을 수 있습니다.'],resolve:['충돌 해결됨으로 표시',[['name','외부 편집기로 수정한 파일','conflicts']],'파일을 스테이징합니다. 충돌 내용을 직접 해결했는지 확인하세요.'],
 undoCommit:['마지막 커밋 되돌리기',[],'HEAD를 부모 커밋으로 이동하고 변경은 스테이징에 남깁니다. 이미 공유한 커밋에는 Revert를 사용하세요.'],
 fileHistory:['파일 이력',[['name','추적 파일','files']]],blame:['Blame',[['name','추적 파일','files']]],compare:['참조 비교',[['from','기준 참조','commits',false,'HEAD~1'],['to','비교 참조','commits',false,'HEAD']]],reflog:['Reflog',[]],
 worktreeList:['Worktree 목록',[]],worktreeAdd:['Worktree 만들기',[['path','새 작업 폴더 절대 경로'],['name','새 브랜치'],['ref','시작 커밋','commits',false,'HEAD']]],worktreeRemove:['Worktree 제거',[['path','제거할 작업 폴더','worktrees']],'선택한 작업 폴더를 삭제합니다. 수정 내용이 있거나 잠긴 worktree는 Git이 거부합니다.'],
 init:['새 저장소 만들기',[['path','프로젝트 폴더']]],clone:['저장소 복제',[['url','원격 저장소 주소'],['path','프로젝트 폴더']]]
};
const categories=[['저장소',['init','clone','remoteAdd','remoteList','remoteRemove']],['브랜치',['branchCreate','branchSwitch','branchRename','branchDelete']],['동기화',['fetch','pull','push']],['커밋',['mergePreview','merge','rebase','cherryPick','revert','compare','undoCommit','reflog']],['보관',['stashSave','stashDiff','stashApply','stashPop','stashDrop','tagCreate','tagDelete']],['파일 · Worktree',['fileHistory','blame','resolve','worktreeList','worktreeAdd','worktreeRemove']]];
const panel=el('dialog');panel.id='commandDialog';panel.setAttribute('aria-label','Git 작업');document.body.append(panel);
const toolbar=el('div',undefined,'git-toolbar');const paletteButton=el('button','작업 검색 ⌘K');paletteButton.onclick=showCommands;toolbar.append(paletteButton);
for(const key of ['fetch','pull','push','branchCreate','stashSave']){const b=el('button',commands[key][0]);b.dataset.repoCommand=key;b.onclick=()=>openCommand(key);toolbar.append(b)}
const syncLabel=el('span',undefined,'cell-muted');syncLabel.id='syncLabel';toolbar.append(syncLabel);document.querySelector('main').prepend(toolbar);
const banner=el('div',undefined,'operation-banner');banner.hidden=true;toolbar.after(banner);
const extrasPanel=el('div');extrasPanel.id='extraRefs';$('branches').after(extrasPanel);

function showCommands(){panel.dataset.dialogKind='palette';panel.replaceChildren();const search=el('input');search.type='search';search.placeholder='작업 검색';search.setAttribute('aria-label','Git 작업 검색');const body=el('div',undefined,'command-body'),list=el('div');body.append(search,list);PgitUI.dialogFrame(panel,{title:'Git 작업',body,canClose:()=>!working});
 function draw(){list.replaceChildren();const query=search.value.toLocaleLowerCase();for(const [name,keys] of categories){const filtered=keys.filter(k=>((window.PgitI18n?.t(commands[k][0])||commands[k][0])+' '+PgitCommandHelp.text(k)+(k==='init'?' 초기화 init initialize':'')+(k==='reflog'?' 참조 이동 기록 reflog':'')).toLocaleLowerCase().includes(query));if(!filtered.length)continue;list.append(el('div',name,'caption'));for(const key of filtered){const title=commands[key][0],b=el('button',undefined,'command-option');b.dataset.command=key;b.setAttribute('aria-label',title);b.append(el('strong',title),PgitCommandHelp.node(key));b.disabled=!state&&!['init','clone'].includes(key);b.onclick=()=>openCommand(key);list.append(b)}}}
 search.oninput=draw;panel.refreshCommandSearch=draw;draw();if(!panel.open)panel.showModal();search.focus()
}
window.addEventListener('pgit-language-change',()=>{if(panel.open&&panel.dataset.dialogKind==='palette')panel.refreshCommandSearch?.()});

async function showRemoteAddresses(){
 const root=state.root;panel.dataset.dialogKind='list';panel.replaceChildren();
 const body=el('div',undefined,'command-body'),list=el('div',undefined,'ui-item-list');
 PgitCommandHelp.mount(body,'remoteList');list.append(PgitUI.message('불러오는 중…'));body.append(list);PgitUI.dialogFrame(panel,{title:commands.remoteList[0],body,canClose:()=>!working});if(!panel.open)panel.showModal();
 const valid=()=>panel.open&&body.isConnected&&state?.root===root;
 try{const result=await api('remoteList');if(!valid())return;list.replaceChildren();const groups=new Map();
  for(const line of result.trim().split('\n').filter(Boolean)){const match=line.match(/^(\S+)\s+(.+)\s+\((fetch|push)\)$/);if(!match)continue;const [,name,url,kind]=match;if(!groups.has(name))groups.set(name,[]);groups.get(name).push({kind,url})}
  for(const [name,addresses] of groups){
   const fetchUrls=[...new Set(addresses.filter(a=>a.kind==='fetch').map(a=>a.url))],pushUrls=[...new Set(addresses.filter(a=>a.kind==='push').map(a=>a.url))];
   const same=fetchUrls.length>0&&fetchUrls.length===pushUrls.length&&fetchUrls.every(url=>pushUrls.includes(url));
   const lines=same?fetchUrls.map(url=>PgitI18n.t('원격 주소')+' · '+url):addresses.map(({kind,url})=>kind+' · '+url);
   list.append(PgitUI.listItem({title:name,meta:lines.join('\n')}).element);
  }
  if(!groups.size)list.append(PgitUI.message('원격 저장소가 없습니다.'));
 }catch(error){if(valid())list.replaceChildren(PgitUI.message(error.message,{error:true}))}
}
async function showCommandRead(key,data={}){
 const root=state.root;panel.dataset.dialogKind='output';const body=el('div',undefined,'command-body');PgitUI.dialogFrame(panel,{title:commands[key][0],body,canClose:()=>!working});PgitCommandHelp.mount(body,key);const output=el('div');output.append(PgitUI.message('불러오는 중…'));body.append(output);if(!panel.open)panel.showModal();
 const valid=()=>panel.open&&body.isConnected&&state?.root===root;
 try{const result=await api(key,data);if(!valid())return;const text=typeof result==='string'?result:JSON.stringify(result,null,2);output.replaceChildren(text?.trim()?el('pre',text,'command-output'):PgitUI.message('표시할 항목이 없습니다.'))}catch(error){if(valid())output.replaceChildren(PgitUI.message(error.message,{error:true}))}
}
function showHistorySearch(){
 const root=state.root;panel.dataset.dialogKind='list';
 const view=PgitUI.historyBrowser(panel,{placeholder:'저장소 전체 이력에서 커밋 메시지 검색',label:'전체 이력 검색 결과'}),{element,search,results,list,status,error}=view;
 element.dataset.command='searchHistory';search.id='command-query';search.name='query';search.required=true;results.classList.add('history-search-results');list.classList.add('history-search-list');
 PgitUI.dialogFrame(panel,{title:commands.searchHistory[0],body:element});PgitCommandHelp.mount(element,'searchHistory');element.prepend(element.querySelector('.command-help'));
 view.message('검색어를 입력하면 전체 이력의 커밋 메시지에서 찾습니다.');
 let version=0;const alive=()=>panel.open&&element.isConnected&&state?.root===root;
 async function run(){const query=search.value.trim();if(!query){++version;view.busy(false);error.textContent='';status.textContent='';view.message('검색어를 입력하면 전체 이력의 커밋 메시지에서 찾습니다.');search.focus();return}
  const request=++version;view.busy(true);error.textContent='';status.textContent='검색 중…';view.message('커밋 이력을 검색하는 중…');
  try{const result=await api('searchHistory',{query});if(!alive()||request!==version)return;list.replaceChildren();list.scrollTop=0;
   for(const commit of result.commits||[])list.append(PgitUI.commitRow(commit,{className:'history-search-row',onOpen:()=>{if(working)return;if(!state.history.some(c=>c.hash===commit.hash))state.history.push(commit);historyQuery='';panel.close();chooseHistoryRef(null,commit.hash);navigateToCommit(commit.hash)}}));
   if(!result.commits?.length)view.message('검색 결과가 없습니다. 다른 검색어로 다시 검색해 보세요.');status.textContent=result.hasMore?'검색 결과 · 최근 200개 표시 · 검색어를 좁혀 주세요.':`검색 결과 ${(result.commits?.length||0).toLocaleString()}개`;
  }catch(e){if(alive()&&request===version){list.replaceChildren();status.textContent='';error.textContent=e.message}}
  finally{if(alive()&&request===version)view.busy(false)}
 }
 element.onsubmit=e=>{e.preventDefault();run()};view.refresh.onclick=run;
 panel.showModal();search.focus();
}
async function openCommand(key){if(working)return;if(!state&&!['init','clone'].includes(key)){notify('먼저 저장소를 여세요.');return}if(key==='searchHistory')return showHistorySearch();if(key==='remoteList')return showRemoteAddresses();if(['reflog','submodules'].includes(key))return showCommandRead(key);let amend=null;if(['amend','amendMessage'].includes(key)){try{amend=await api('amendInfo')}catch(e){notify(e.message);return}}const [title,fields,warning]=commands[key];panel.dataset.dialogKind='form';panel.replaceChildren();const form=el('form',undefined,'command-body');form.dataset.command=key;if(amend)form.dataset.amendHead=amend.head;if(key!=='merge')PgitUI.commandFormLayout(form,{inline:fields.length===1&&!['cherryPick','init','clone'].includes(key)&&fields[0][2]!=='commitMessage'});PgitUI.dialogFrame(panel,{title,body:form,canClose:()=>!working});PgitCommandHelp.mount(form,key);if(warning)form.append(el('p',warning,'command-notice'));const error=el('p',undefined,'command-error');error.setAttribute('role','alert');const inputs=amend?{head:{value:amend.head}}:{};let tracked=[];if(fields.some(f=>f[2]==='files'))try{tracked=await api('trackedFiles')}catch(e){notify(e.message);return}
for(const [name,label,source,optional,initial] of fields){const choices=source==='pullStrategies'?[['ff-only','Fast-forward only'],['merge','Merge'],['rebase','Rebase']]:source==='mergeRefs'?[...state.branches.map(b=>[b.name,b.name]),...state.refs.filter(r=>r.name.startsWith('refs/remotes/')&&!r.name.endsWith('/HEAD')).map(r=>[r.name,r.name.slice(13)])]:source==='branches'?state.branches.map(b=>[b.name,b.name]):source==='remotes'?state.remotes.map(n=>[n,n]):source==='stashes'?state.stashes.map(s=>[s.hash,s.name+' · '+s.title]):source==='tags'?state.refs.filter(r=>r.name.startsWith('refs/tags/')).map(r=>[r.name.slice(10),r.name.slice(10)]):source==='conflicts'?state.files.filter(f=>f.conflict).map(f=>[f.name,f.name]):source==='files'?tracked.map(n=>[n,n]):source==='worktrees'?state.worktrees.filter(w=>w.path!==state.root).map(w=>[w.path,w.branch?.replace(/^refs\/heads\//,'')||PgitPaths.basename(w.path)]):null;
const input=source==='commits'?PgitCommitPicker.create(state,initial||activeCommit||state.head):el(source==='commitMessage'?'textarea':choices?'select':'input');input.id='command-'+name;input.name=name;if(name==='url')input.placeholder='https://gitlab.example.com/team/project.git';input.required=!optional;if(source==='commitMessage'){input.value=amend.message;input.className='commit-message-input';input.rows=6;input.maxLength=4000}else if(source==='commits'){}else if(choices){for(const [v,t] of choices){const option=el('option',t);option.value=v;input.append(option)}if(!choices.length){input.append(el('option','항목 없음'));input.disabled=true}}else{input.type='text';input.value=source==='selected'?activeCommit||'':source||''}const lab=el('label',label);lab.htmlFor=input.id;form.append(lab,input);inputs[name]=input}
if(amend){const summary=el('div',undefined,'amend-summary');summary.append(el('strong',key==='amendMessage'?'스테이징된 변경은 포함하지 않습니다.':amend.files.length?'함께 반영할 파일':'스테이징한 변경이 없습니다.'));for(const name of key==='amendMessage'?[]:amend.files)summary.append(el('div',name,'literal-data'));form.append(summary)}const submit=el('button',key==='amendMessage'?'메시지 수정':key==='amend'?'변경 추가':key==='init'?'만들기':key==='clone'?'복제':key==='branchSwitch'?'브랜치 전환':key==='resetPreview'?'변경 내용 확인':'실행','primary');submit.type='submit';submit.disabled=(key==='amend'&&!amend.files.length)||Object.values(inputs).some(i=>i.disabled);form.append(error,submit);form.onsubmit=async e=>{e.preventDefault();if(working)return;const data=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.value]));if(key==='merge'&&form.mergePreview){data.expectedHead=form.mergePreview.head;data.expectedTarget=form.mergePreview.target}submit.disabled=true;working=true;error.textContent='';controls();try{const result=await api(key,{...data,limit:historyLimit});if(typeof result==='string'||Array.isArray(result)){panel.dataset.dialogKind=key==='remoteList'?'list':'output';panel.replaceChildren();const text=typeof result==='string'?result:result.join('\n');const output=text.trim()?el('pre',text,'command-output'):PgitUI.message('조회 결과가 없습니다.');PgitUI.dialogFrame(panel,{title,body:output,canClose:()=>!working})}else{state=result;scope=null;render();panel.close();notify(title+' 완료')}}catch(e){error.textContent=e.message;try{if(state){state=await api('state',{limit:historyLimit});render()}}catch{} }finally{working=false;controls();submit.disabled=false}};if(['init','clone'].includes(key))PgitFolderPicker.mount({input:inputs.path,submit,error,url:inputs.url});PgitReferenceFields.mount({key,form,inputs,submit,error,snapshot:state});if(!panel.open)panel.showModal();Object.values(inputs).find(input=>typeof input.focus==='function')?.focus();}
function renderExtras(){if(!state)return;syncLabel.textContent=state.upstream?`${state.upstream} · ↑${state.ahead} ↓${state.behind}`:'추적 브랜치 없음';banner.replaceChildren();banner.hidden=!state.operation;if(state.operation){banner.append(el('strong',state.operation+' 진행 중'));const conflicts=state.files.filter(f=>f.conflict);if(conflicts.length){const edit=el('button','충돌 편집기 열기');edit.onclick=()=>conflicts.length===1?openAdvanced('conflictRead',{name:conflicts[0].name}):openCommand('conflictRead');banner.append(edit)}for(const key of ['continue','abort']){const b=el('button',commands[key][0]);b.disabled=key==='continue'&&!!conflicts.length;b.onclick=()=>openCommand(key);banner.append(b)}}extrasPanel.replaceChildren();const remoteRefs=state.refs.filter(r=>r.name.startsWith('refs/remotes/')&&!r.name.endsWith('/HEAD'));extrasPanel.append(el('div','REMOTE','caption'));for(const remote of [...new Set(remoteRefs.map(r=>r.name.slice(13).split('/')[0]))]){const group=el('details');group.className='remote-group';group.open=true;const summary=el('summary');summary.append(el('span',remote,'branch-folder-name literal-data'),el('span',String(remoteRefs.filter(r=>r.name.startsWith('refs/remotes/'+remote+'/')).length),'folder-count'));const children=el('div',undefined,'branch-folder-children');group.append(summary,children);for(const r of remoteRefs.filter(r=>r.name.startsWith('refs/remotes/'+remote+'/'))){const b=el('button',r.name.slice(14+remote.length),'nav remote-branch');b.dataset.ref=r.name;b.title=r.name.slice(13);b.onclick=()=>chooseHistoryRef(r.name,r.hash);children.append(b)}extrasPanel.append(group)}if(!remoteRefs.length)extrasPanel.append(el('div','원격 브랜치 없음','branch-empty'));extrasPanel.append(el('div','TAGS','caption'));for(const r of state.refs.filter(r=>r.name.startsWith('refs/tags/'))){const b=el('button',undefined,'nav sidebar-ref tag-ref');b.append(el('span',r.name.slice(10),'literal-data'));b.dataset.ref=r.name;b.title=r.name.slice(10);b.prepend(PgitIcons.icon('tag'));b.onclick=()=>chooseHistoryRef(r.name,r.hash);extrasPanel.append(b)}extrasPanel.append(el('div',`STASHES · ${state.stashes.length}`,'caption'));for(const s of state.stashes){const b=el('button',undefined,'nav sidebar-ref stash-ref');b.append(PgitIcons.icon('stash'),el('span',s.title,'literal-data'));b.title=s.name+' · '+s.title;b.dataset.stash=s.hash;b.onclick=()=>contextualCommand('stashDiff',{hash:s.hash});extrasPanel.append(b)}}
const baseRender=render;render=function(){baseRender();renderExtras();syncHistoryScope()};
const baseControls=controls;controls=function(){baseControls();document.querySelectorAll('[data-repo-command]').forEach(b=>b.disabled=working||!state)};
// Serialize requests: detail reads must not collide with mutations on the local bridge.
const rawApi=api;let queue=Promise.resolve();api=function(action,data={}){const next=queue.then(()=>rawApi(action,data));queue=next.catch(()=>{});return next};
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();showCommands()}});
controls();

// One history navigation surface; HEAD and the viewed branch are separate states.
let selectedHistoryRef=null;
let scopedHistoryRoot=null;const scopedHistoryPages=new Map();
function currentHistoryPage(){return scopedHistoryRoot===state?.root?scopedHistoryPages.get(scope):null}
function mergeScopedHistory(page){const known=new Set(state.history.map(c=>c.hash));state.history.push(...page.commits.filter(c=>!known.has(c.hash)))}
function updateHistoryCount(){
 const info=document.querySelector('.history-info');if(!info||!state)return;
 const page=currentHistoryPage(),loaded=page?.commits.length||Number(info.dataset.visible||0),total=!scope?'0':Number.isSafeInteger(page?.total)?page.total.toLocaleString():null;
 const count=loaded.toLocaleString()+' / '+(total!==null?'전체 '+total+'개':page?.countError?'전체 집계 실패':'전체 집계 중…');
 info.textContent=(historyQuery.trim()?'검색 '+Number(info.dataset.matches||0).toLocaleString()+'개 · ':'')+count;
 info.title='전체는 선택한 브랜치·태그에서 도달할 수 있는 커밋 수입니다. 검색과 그래프 필터는 불러온 이력에 적용됩니다.';
 if(page?.countError){const retry=el('button','재시도','history-count-retry');retry.type='button';retry.setAttribute('aria-label','전체 커밋 수 다시 조회');retry.onclick=()=>loadHistoryCount(scope,page);info.append(retry);info.title=page.countError}
}
async function loadHistoryCount(hash,page){
 if(page.countLoading||Number.isSafeInteger(page.total))return;
 const root=state.root;page.countLoading=true;page.countError=null;updateHistoryCount();
 try{const result=await api('historyCount',{ref:hash});page.total=result.total}catch(error){page.countError=error.message}
 finally{page.countLoading=false;if(state?.root===root&&scope===hash&&currentHistoryPage()===page)updateHistoryCount()}
}
let historyPrefetchFrame=0;
function scheduleHistoryPrefetch(){
 if(historyPrefetchFrame)return;
 historyPrefetchFrame=requestAnimationFrame(()=>{
  historyPrefetchFrame=0;const scroller=$('historyScroll'),page=currentHistoryPage();
  if(!scroller||!scroller.isConnected||scroller.clientHeight===0||mode!=='history'||working||historyQuery.trim()||!page?.commits.length||page.loading||page.error||!page.hasMore)return;
  if(scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<=scroller.clientHeight)void loadScopedHistory(scope,true);
 });
}
function renderHistoryContinuation(page,list){
 list.querySelector('.history-continuation')?.remove();if(!page)return;
 const footer=el('div',undefined,'history-continuation');
 if(page.error){const retry=el('button','다시 시도');retry.onclick=()=>loadScopedHistory(scope,true);retry.disabled=working||page.loading;footer.append(retry)}
 else if(page.loading){footer.textContent='이전 커밋을 불러오는 중…';footer.setAttribute('role','status')}
 else if(!page.hasMore&&page.commits.length){footer.textContent='모든 커밋을 불러왔습니다.'}
 else return;
 list.append(footer);
}
async function loadScopedHistory(hash,more=false){
 if(!state||!hash)return;
 if(scopedHistoryRoot!==state.root){scopedHistoryRoot=state.root;scopedHistoryPages.clear()}
 const root=state.root;let page=scopedHistoryPages.get(hash);
 if(page?.loading||page&&(!more||!page.hasMore)&&!page.error)return;
 if(!page){page={commits:[],hasMore:true,nextOffset:0};scopedHistoryPages.set(hash,page);void loadHistoryCount(hash,page)}
 page.loading=true;page.error=null;
 if(more&&$('commitRows'))renderHistoryContinuation(page,$('commitRows'));
 try{const result=await api('historyPage',{ref:hash,offset:page.nextOffset});if(state?.root!==root)return;
 const known=new Set(page.commits.map(c=>c.hash));page.commits.push(...result.commits.filter(c=>!known.has(c.hash)));page.hasMore=result.hasMore;page.nextOffset=result.nextOffset;
 }catch(error){page.error=error.message}finally{page.loading=false;if(state?.root===root&&scope===hash){mergeScopedHistory(page);renderHistory()}}
}
function chooseHistoryRef(ref,hash){if((scope!==hash||selectedHistoryRef!==ref)&&$('historyScroll'))$('historyScroll').scrollTop=0;selectedHistoryRef=ref;scope=hash;activeCommit=hash;tab('history');renderHistory()}
function historyScopeLabel(){return scope?(selectedHistoryRef?.startsWith('refs/tags/')?'태그: ':selectedHistoryRef?'브랜치: ':'커밋: ')+(selectedHistoryRef?.replace(/^refs\/(heads|remotes|tags)\//,'')||scope.slice(0,7)):'브랜치 선택'}
let historyScopeRoot=null,historyCheckedOutRef=null;
function syncHistoryScope(){
 if(!state)return;
 if(historyScopeRoot!==state.root){historyScopeRoot=state.root;selectedHistoryRef=null;scope=null;historyCheckedOutRef=null}
 const checkedOut=state.branch==='(detached HEAD)'?null:'refs/heads/'+state.branch;
 if(historyCheckedOutRef!==checkedOut&&selectedHistoryRef===historyCheckedOutRef){selectedHistoryRef=null;scope=null}
 historyCheckedOutRef=checkedOut;
 if(!scope)selectedHistoryRef=null;
 if(selectedHistoryRef){const ref=state.refs.find(r=>r.name===selectedHistoryRef)||state.branches.find(b=>'refs/heads/'+b.name===selectedHistoryRef);if(ref)scope=ref.hash;else{selectedHistoryRef=null;scope=null}}
 if(!scope){const current=state.branches.find(b=>b.current)||state.branches.find(b=>b.name===state.branch);selectedHistoryRef=current?'refs/heads/'+current.name:null;scope=current?.hash||state.head||null}
 if(scope){const page=currentHistoryPage();if(page)mergeScopedHistory(page);else void loadScopedHistory(scope)}
 document.querySelectorAll('[data-ref]').forEach(b=>{const selected=!!scope&&b.dataset.ref===selectedHistoryRef;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))});
}
