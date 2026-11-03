if(window.pgitDesktop)document.documentElement.dataset.platform=window.pgitDesktop.platform;
if(window.pgitDesktop)document.body.classList.add('desktop');
const byId=id=>document.getElementById(id);
let draggedProject=null;
let projects=[],activeId=null,recents=[],projectMode='open',opening=false,pendingClose=null,saveTimer;
const sessionKey='pgit.arctic.workspace.v1';
function notice(message){byId('shellNotice').textContent=message;byId('shellNotice').hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>byId('shellNotice').hidden=true,4500)}
function persisted(){return {typography:window.PgitSettings?.typography,theme:window.PgitSettings?.theme||'light',language:window.PgitI18n?.language||'ko',projects:projects.filter(p=>p.path).map(p=>({path:p.path,name:p.name})),activePath:projects.find(p=>p.id===activeId)?.path||null,recents:recents.slice(0,18)}}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{const data=persisted();try{localStorage.setItem(sessionKey,JSON.stringify(data))}catch{}window.pgitDesktop?.saveWorkspace(data).catch(()=>notice('프로젝트 목록을 저장하지 못했습니다.'));},150)}
function renderRecents(){const host=byId('recentProjects');host.replaceChildren();byId('recentCount').textContent=recents.length?`${recents.length}개 저장소`:'';for(const path of recents){const b=document.createElement('button');b.className='recent-project';b.title=path;const icon=document.createElement('span');icon.className='repo-symbol';icon.textContent='⑂';const text=document.createElement('span');const name=document.createElement('strong');name.textContent=PgitPaths.basename(path);const location=document.createElement('small');location.textContent=path;text.append(name,location);b.append(icon,text);b.onclick=()=>openProject(path);host.append(b)}if(!recents.length){const empty=document.createElement('div');empty.className='recent-empty';empty.textContent='첫 프로젝트를 열어 보세요. 최근 작업한 저장소가 여기에 모입니다.';host.append(empty)}}
function selectProject(id,focus=false){window.PgitSettings?.close?.({focus:false});activeId=id;for(const p of projects){p.frame.hidden=p.id!==id;if(p.id===id)send(p,{type:'active'})}byId('welcome').hidden=!!id;renderTabs();save();if(focus)projects.find(p=>p.id===id)?.frame.focus()}
function renderTabs(){const host=byId('projectTabs');host.replaceChildren();for(const p of projects){const wrap=document.createElement('div');wrap.className='project-tab'+(p.id===activeId?' selected':'');wrap.onclick=event=>{if(!event.target.closest('button'))selectProject(p.id)};wrap.draggable=true;wrap.ondragstart=e=>{draggedProject=p.id;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',p.id)};wrap.ondragover=e=>{if(draggedProject){e.preventDefault();e.dataTransfer.dropEffect='move'}};wrap.ondrop=e=>{e.preventDefault();const from=projects.findIndex(item=>item.id===draggedProject),to=projects.indexOf(p);if(from>=0&&from!==to){const [moved]=projects.splice(from,1);projects.splice(to,0,moved);renderTabs();save()}draggedProject=null};wrap.ondragend=()=>draggedProject=null;const b=document.createElement('button');b.type='button';b.role='tab';b.id='tab-'+p.id;b.setAttribute('aria-selected',String(p.id===activeId));b.setAttribute('aria-controls','panel-'+p.id);b.tabIndex=p.id===activeId?0:-1;b.title=p.path||p.name;const mark=document.createElement('span');mark.className='tab-mark';mark.append(PgitIcons.icon(p.busy?'refresh':'branch'));mark.classList.toggle('is-busy',!!p.busy);mark.setAttribute('aria-hidden','true');const label=document.createElement('span');label.className='tab-text';label.textContent=p.name;const count=document.createElement('span');count.className='tab-count';count.textContent=p.count||'';count.hidden=!p.count;b.append(mark,label,count);b.onclick=()=>selectProject(p.id);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=projects.indexOf(p);const next=e.key==='Home'?projects[0]:e.key==='End'?projects.at(-1):projects[(i+(e.key==='ArrowRight'?1:-1)+projects.length)%projects.length];selectProject(next.id);byId('tab-'+next.id)?.focus()}};const close=document.createElement('button');close.className='tab-close';PgitIcons.label(close,'close');close.setAttribute('aria-label',`${p.name} 탭 닫기`);close.title=p.busy?'작업이 끝난 뒤 닫을 수 있습니다.':'프로젝트 탭 닫기';close.disabled=!!p.busy;close.onclick=()=>requestClose(p);wrap.append(b,close);host.append(wrap)}}
const projectDrafts={open:{path:''},clone:{path:'',url:''},init:{path:''}};
function projectErrorMessage(error){
 const message=error.message||String(error);
 if(/ENOENT.*realpath/.test(message))return '폴더를 찾을 수 없습니다. 경로를 확인하세요.';
 if(/not a git repository/i.test(message))return 'Git 저장소가 아닌 폴더입니다.';
 if(/EACCES|Permission denied/i.test(message))return '폴더에 접근할 권한이 없습니다.';
 return message;
}
function clearProjectError(){byId('projectError').textContent='';byId('projectPath').removeAttribute('aria-invalid');byId('cloneUrl').removeAttribute('aria-invalid')}
function projectBusy(){
 const form=byId('projectForm');form.setAttribute('aria-busy',String(opening));
 for(const control of form.querySelectorAll('input,button'))control.disabled=opening;
 byId('submitProject').textContent=opening?(projectMode==='clone'?'복제 중…':projectMode==='init'?'만드는 중…':'여는 중…'):byId('projectTitle').textContent;
}
function setProjectMode(mode){
 if(opening)return;
 if(mode!==projectMode){projectDrafts[projectMode]={path:byId('projectPath').value,url:byId('cloneUrl').value};byId('projectPath').value=projectDrafts[mode].path;byId('cloneUrl').value=projectDrafts[mode].url||''}
 projectMode=mode;clearProjectError();
 for(const b of document.querySelectorAll('[data-project-mode]'))b.setAttribute('aria-pressed',String(b.dataset.projectMode===mode));
 byId('cloneUrlField').hidden=mode!=='clone';byId('cloneUrl').required=mode==='clone';
 byId('pathLabel').textContent=mode==='open'?'프로젝트 폴더':'새 프로젝트의 절대 경로';
 byId('projectTitle').textContent=mode==='open'?'프로젝트 열기':mode==='clone'?'저장소 복제':'새 저장소 만들기';
 byId('projectHelp').textContent=mode==='clone'?'아직 존재하지 않는 새 폴더 경로를 입력하세요.':mode==='init'?'선택한 폴더에 main 브랜치의 Git 저장소를 만듭니다.':'';
 byId('projectHelp').hidden=mode==='open';byId('browseProject').hidden=mode==='clone'||!window.pgitDesktop;
 projectBusy();
}
function showProjectDialog(mode='open'){if(opening)return;setProjectMode(mode);byId('projectError').textContent='';byId('projectDialog').showModal();byId(mode==='clone'?'cloneUrl':'projectPath').focus()}
function createPane(path,name){const id=crypto.randomUUID();const frame=document.createElement('iframe');frame.className='project-frame';frame.id='panel-'+id;frame.title=(name||'새 프로젝트')+' 작업 공간';frame.setAttribute('role','tabpanel');frame.setAttribute('aria-labelledby','tab-'+id);frame.src='/workspace?session='+id;frame.hidden=true;const p={id,path,name:name||PgitPaths.basename(path)||'새 프로젝트',frame,busy:true,ready:false,count:0,draft:''};projects.push(p);byId('projectPanels').append(frame);return p}
function send(p,message){p.frame.contentWindow.postMessage({source:'pgit-shell',...message},location.origin)}
async function openProject(path,action='open',extra={}){
 if(opening)return;
 const previousId=activeId;let created=null;
 opening=true;clearProjectError();projectBusy();
 try{
  if(action==='open'){
   const response=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json','X-Pgit-Token':shellToken},body:JSON.stringify({action:'resolveRepo',path,workspaceId:'resolve-'+crypto.randomUUID()})});
   const body=await response.json();if(!response.ok)throw Error(body.error||'프로젝트 경로를 확인하세요.');path=body.result;
  }
  const duplicate=projects.find(p=>p.path===path&&action==='open');
  if(duplicate){selectProject(duplicate.id);byId('projectDialog').close();return}
  if(projects.length>=50)throw Error('프로젝트는 최대 50개까지 열 수 있습니다.');
  created=createPane(path);created.initial={action,path,...extra};
  const loaded=new Promise((resolve,reject)=>{created.resolveOpen=resolve;created.rejectOpen=reject});
  // Keep the form and its input until Git confirms success.
  await loaded;
  selectProject(created.id);byId('projectDialog').close();
 }catch(error){
  if(created){created.busy=false;await removeProject(created);selectProject(previousId)}
  opening=false;setProjectMode(action);byId('projectPath').value=path;
  if(!byId('projectDialog').open)byId('projectDialog').showModal();
  byId('projectError').textContent=projectErrorMessage(error);
  const errorField=action==='clone'&&/authentication|repository .*not found|could not resolve|URL|HTTPS|SSH/i.test(error.message)?byId('cloneUrl'):byId('projectPath');
  errorField.setAttribute('aria-invalid','true');errorField.focus();
 }finally{opening=false;projectBusy();if(created){delete created.resolveOpen;delete created.rejectOpen}}
}

async function removeProject(p){if(p.busy)return;const index=projects.indexOf(p);try{await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json','X-Pgit-Token':shellToken},body:JSON.stringify({action:'closeWorkspace',workspaceId:p.id})})}catch{}p.frame.remove();projects=projects.filter(x=>x!==p);if(activeId===p.id)selectProject(projects[Math.min(index,projects.length-1)]?.id||null);else{renderTabs();save()}byId('addProject').focus()}
function requestClose(p){if(p.busy)return notice('진행 중인 Git 작업이 끝난 뒤 탭을 닫아 주세요.');if(p.draft.trim()){pendingClose=p;byId('closeTabDialog').showModal()}else removeProject(p)}
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.source!=='pgit-pane')return;const p=projects.find(p=>p.frame.contentWindow===event.source);if(!p)return;const m=event.data;if(m.type==='ready'){p.ready=true;p.frame.contentWindow.postMessage({source:'pgit-theme',theme:window.PgitSettings.theme},location.origin);p.frame.contentWindow.postMessage({source:'pgit-language',language:window.PgitI18n.language},location.origin);send(p,{type:'open',...(p.initial||{action:'open',path:p.path})})}else if(m.type==='state'){p.busy=!!m.busy;p.count=m.count||0;p.draft=typeof m.draft==='string'?m.draft:'';if(m.path){p.path=m.path;p.name=PgitPaths.basename(m.path);p.frame.title=p.name+' 작업 공간';recents=[p.path,...recents.filter(r=>r!==p.path)].slice(0,18);renderRecents()}renderTabs();save();if(m.path&&!m.busy)p.resolveOpen?.()}else if(m.type==='open-error'){p.busy=false;renderTabs();if(p.rejectOpen)p.rejectOpen(Error(m.message||'저장소를 열지 못했습니다.'));else notice(m.message||'저장소를 열지 못했습니다.')}else if(m.type==='open-worktree'&&typeof m.path==='string'&&PgitPaths.isAbsolute(m.path))openProject(m.path);else if(m.type==='settings')window.PgitSettings.open();else if(m.type==='add-project')showProjectDialog();else if(m.type==='shortcut'){if(m.command==='new')showProjectDialog();if(m.command==='close')requestClose(p);if(m.command==='next'){const index=projects.indexOf(p);selectProject(projects[(index+1)%projects.length]?.id,true)}}});
for(const b of document.querySelectorAll('[data-project-mode]'))b.onclick=()=>setProjectMode(b.dataset.projectMode);
byId('addProject').onclick=()=>showProjectDialog();byId('welcomeOpen').onclick=()=>showProjectDialog();byId('welcomeClone').onclick=()=>showProjectDialog('clone');PgitIcons.label(byId('homeButton'),'folder');byId('homeButton').onclick=()=>selectProject(null);
byId('closeProjectDialog').onclick=byId('cancelProject').onclick=()=>{if(!opening)byId('projectDialog').close()};byId('projectDialog').addEventListener('cancel',event=>{if(opening)event.preventDefault()});byId('keepTab').onclick=()=>byId('closeTabDialog').close();byId('discardTab').onclick=()=>{byId('closeTabDialog').close();if(pendingClose)removeProject(pendingClose);pendingClose=null};
byId('browseProject').onclick=async()=>{const mode=projectMode;try{const path=await window.pgitDesktop.chooseFolder();if(path&&mode===projectMode&&!opening){byId('projectPath').value=path;clearProjectError();byId('projectPath').focus()}}catch(e){byId('projectError').textContent=e.message}};
byId('projectForm').onsubmit=e=>{e.preventDefault();const path=byId('projectPath').value.trim();if(!PgitPaths.isAbsolute(path)){byId('projectError').textContent='폴더의 절대 경로를 입력하세요.';byId('projectPath').setAttribute('aria-invalid','true');byId('projectPath').focus();return}openProject(path,projectMode,{url:byId('cloneUrl').value.trim()})};
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='t'){e.preventDefault();showProjectDialog()}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='w'&&activeId){e.preventDefault();requestClose(projects.find(p=>p.id===activeId))}});
async function restore(){let saved;try{saved=window.pgitDesktop?await window.pgitDesktop.loadWorkspace():JSON.parse(localStorage.getItem(sessionKey)||'null')}catch{}if(saved?.typography)window.PgitSettings.setTypography(saved.typography,{persist:false});if(saved?.theme)window.PgitSettings.setTheme(saved.theme,{persist:false});if(saved?.language)window.PgitI18n.setLanguage(saved.language,{persist:false});if(saved&&Array.isArray(saved.recents))recents=saved.recents.filter(p=>typeof p==='string'&&PgitPaths.isAbsolute(p)).slice(0,18);renderRecents();if(saved&&Array.isArray(saved.projects)){for(const item of saved.projects.slice(0,50)){if(typeof item.path!=='string'||!PgitPaths.isAbsolute(item.path)||projects.some(p=>p.path===item.path))continue;const p=createPane(item.path,item.name);p.initial={action:'open',path:item.path}}selectProject(projects.find(p=>p.path===saved.activePath)?.id||projects[0]?.id||null)}}
const settingsRoute=location.hash;restore().then(()=>{if(settingsRoute.startsWith('#settings/'))window.PgitSettings.open(['appearance','typography','language','sync'].find(section=>settingsRoute==='#settings/'+section)||'appearance')});

PgitIcons.label(byId('addProject'),'plus');PgitIcons.close(byId('closeProjectDialog'));PgitIcons.label(byId('browseProject'),'folder','찾아보기');

const closeDraftDialog=PgitIcons.close(document.createElement('button'));closeDraftDialog.onclick=()=>byId('closeTabDialog').close();byId('closeTabDialog').querySelector('.dialog-heading').append(closeDraftDialog);

for(const id of ['projectPath','cloneUrl'])byId(id).addEventListener('input',clearProjectError);

if(window.pgitDesktop?.platform==='win32')byId('projectPath').placeholder=String.raw`C:\Users\you\Projects\project`;

// Shell chrome is outside each workspace dialog (iframe events do not bubble here).
document.addEventListener('click',()=>{for(const project of projects)send(project,{type:'dismiss-palette'})});
