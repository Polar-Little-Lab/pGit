// The shell keeps each project alive in its own pane. Git requests carry its session ID.
const embedded=window.parent!==window;
if(embedded)document.body.classList.add('embedded');
const sendShell=message=>{if(embedded)parent.postMessage({source:'pgit-pane',...message},location.origin)};
function publishPane(){sendShell({type:'state',path:state?.root||null,count:state?.files.length||0,busy:working,draft:$('message').value})}
const paneControls=controls;controls=function(){paneControls();publishPane()};
$('message').addEventListener('input',publishPane);

// A persistent graph/review area with a dedicated commit sidebar.
const workingReview=el('section',undefined,'working-review');workingReview.id='workingReview';workingReview.hidden=true;
const diffContent=document.querySelector('#changes .workspace > div:last-child');
workingReview.append(diffContent);$('history').after(workingReview);
const oldTab=tab;tab=function(value){oldTab(value);$('changes').hidden=false;workingReview.hidden=value!=='changes';document.body.dataset.view=value;};
const previousSelectChange=selectChange;selectChange=function(name,area){previousSelectChange(name,area);tab('changes')};
$('changesNav').onclick=()=>tab('changes');
const stageHeader=document.querySelector('#changes .files .bar');stageHeader.replaceChildren(el('strong','변경 사항'),el('span','WORKING DIRECTORY','panel-eyebrow'));
const commitLabel=el('label','커밋 메시지');commitLabel.htmlFor='message';$('form').prepend(commitLabel);
$('message').placeholder='변경 내용을 한 줄로 요약하세요';
const workspaceHeading=document.querySelector('.top');workspaceHeading.classList.add('workspace-heading');
const repoHeading=el('span','저장소를 여세요','repo-heading');workspaceHeading.prepend(repoHeading);
const branchBadge=$('branchPicker');branchBadge.title='현재 체크아웃된 브랜치';
const arcticToolbar=document.querySelector('.git-toolbar');arcticToolbar.classList.add('workspace-toolbar');
const undo=el('button','↶ 마지막 커밋 취소');undo.title='마지막 커밋을 취소하고 변경을 스테이징에 남깁니다.';undo.dataset.repoCommand='undoCommit';undo.onclick=()=>openCommand('undoCommit');arcticToolbar.append(undo);
const refresh=el('button');PgitIcons.label(refresh,'refresh');refresh.setAttribute('aria-label','저장소 새로고침');refresh.title='저장소 새로고침';refresh.onclick=()=>state&&mutate('state');arcticToolbar.append(refresh);
const switchView=el('button','그래프 보기','return-graph');switchView.onclick=()=>tab('history');workingReview.prepend(switchView);
const side=document.querySelector('.shell > aside');const captions=[...side.querySelectorAll(':scope > .caption')];const repositoryCaption=captions.find(c=>c.textContent==='REPOSITORY');if(repositoryCaption){let node=repositoryCaption.nextSibling;while(node){const next=node.nextSibling;node.remove();node=next}repositoryCaption.remove()}
const sidebarFoot=el('div',undefined,'sidebar-foot');sidebarFoot.append(el('span','POLAR WORKSPACE'),el('small','코드의 흐름을 더 선명하게.'));side.append(sidebarFoot);
const arcticRender=render;render=function(){arcticRender();repoHeading.textContent=PgitPaths.basename(state?.root)||'저장소를 여세요';tab(mode);publishPane()};
const arcticControls=controls;controls=function(){arcticControls();refresh.disabled=working||!state;undo.disabled=working||!state||!!state.operation||state.files.length>0||!state.history[0]?.parents.length;for(const key of ['fetch','push']){const b=arcticToolbar.querySelector(`[data-repo-command="${key}"]`);b.disabled=working||!state||!state.remotes.length;b.title=state&&!state.remotes.length?'먼저 원격 저장소를 연결하세요.':key==='fetch'?'원격의 최신 커밋과 브랜치 정보를 가져옵니다. 현재 브랜치에는 적용하지 않습니다.':'현재 브랜치의 커밋을 원격 저장소로 올립니다.'}const pull=arcticToolbar.querySelector('[data-repo-command="pull"]');pull.disabled=working||!state?.upstream;pull.title=state&&!state.upstream?'추적 브랜치를 먼저 설정하세요.':'Pull'};
// Persist failures close to the operation, without replacing success feedback.
const paneNotice=el('div',undefined,'pane-error');paneNotice.hidden=true;paneNotice.setAttribute('role','alert');document.querySelector('main').prepend(paneNotice);
window.addEventListener('message',async event=>{if(!embedded||event.source!==parent||event.origin!==location.origin||event.data?.source!=='pgit-shell')return;const m=event.data;if(m.type==='recover-draft'&&typeof m.draft==='string'&&!$('message').value){const [title,...body]=m.draft.split('\n');$('message').value=title;const detail=$('commitDescription');if(detail)detail.value=body.join('\n').replace(/^\n/,'');controls();return}if(m.type==='dismiss-palette'){if(panel.open&&panel.dataset.dialogKind==='palette')panel.close();return}if(m.type==='open'){
 paneNotice.hidden=true;const ok=await mutate(m.action||'open',{path:m.path,url:m.url});
 if(!ok){paneNotice.replaceChildren(el('span','프로젝트를 열지 못했습니다. 폴더 경로와 Git 저장소인지 확인하세요.'));const retry=el('button','다시 시도');retry.onclick=()=>{paneNotice.hidden=true;mutate(m.action||'open',{path:m.path,url:m.url}).then(success=>paneNotice.hidden=!!success)};const choose=el('button','다른 프로젝트 열기');choose.onclick=()=>sendShell({type:'add-project'});paneNotice.append(retry,choose);paneNotice.hidden=false;sendShell({type:'open-error',message:mutate.lastError||'프로젝트를 열지 못했습니다. 경로를 확인하세요.'})}
 }});
if(embedded){$('openRepo').onclick=()=>sendShell({type:'add-project'});document.querySelector('header').hidden=true;sendShell({type:'ready'})}
document.addEventListener('keydown',event=>{if(!embedded)return;if((event.metaKey||event.ctrlKey)&&['t','w'].includes(event.key.toLowerCase())){event.preventDefault();sendShell({type:'shortcut',command:event.key.toLowerCase()==='t'?'new':'close'})}else if(event.ctrlKey&&event.key==='Tab'){event.preventDefault();sendShell({type:'shortcut',command:'next'})}});
// Ensure per-project rendering does not leave the commit panel hidden on startup.
tab(mode);controls();
