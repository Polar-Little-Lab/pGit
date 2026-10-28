// Graph is the home surface. WIP and commit selection share one contextual right panel.
const commitPanel=el('section',undefined,'selected-commit-panel');
commitPanel.id='selectedCommitPanel';commitPanel.hidden=true;
const commitReview=el('section',undefined,'commit-review');commitReview.hidden=true;
const reviewBack=el('button','← 그래프로 돌아가기','review-back');
const reviewContent=el('div');reviewContent.id='commitReviewContent';
commitReview.append(reviewBack,reviewContent);document.querySelector('main').append(commitPanel,commitReview);
let panelSelection='commit',commitSelectionVersion=0,selectedCommitFile=null;
function setPanel(selection){selection=mode==='changes'?'wip':'commit';panelSelection=selection;document.body.dataset.selection=selection;commitPanel.hidden=selection!=='commit';$('changes').hidden=selection==='commit';}
function graphHome(){mode='history';$('history').hidden=false;workingReview.hidden=true;commitReview.hidden=true;document.body.dataset.view='history';$('historyNav').classList.add('active');$('changesNav').classList.remove('active');setPanel('commit');}
reviewBack.onclick=graphHome;switchView.onclick=graphHome;
const contextTab=tab;tab=function(value){contextTab(value);commitReview.hidden=true;if(value==='changes')setPanel('wip');else{setPanel('commit');const chosen=state?.history.find(c=>c.hash===activeCommit)||state?.history[0];if(chosen&&commitPanel.dataset.hash!==chosen.hash)selectCommit(chosen)}};
const contextSelectChange=selectChange;selectChange=function(name,area){setPanel('wip');contextSelectChange(name,area)};
function openWip(){tab('changes')}
function clearCommitSelection(){++commitSelectionVersion;delete commitPanel.dataset.hash;selectedCommitFile=null;commitPanel.replaceChildren(el('p',state?.history.length?'선택된 커밋 없음':'아직 커밋이 없습니다.','compare-empty'));setPanel('commit')}
let renderSelecting=false;
selectCommit=async function(commit){
 if(renderSelecting&&mode!=='history')return;
 activeCommit=commit.hash;commitPanel.dataset.hash=commit.hash;selectedCommitFile=null;const version=++commitSelectionVersion;
 setPanel('commit');graphHome();document.querySelector('.wip-row')?.classList.remove('active');
 document.querySelectorAll('.historyrow').forEach(r=>{r.classList.toggle('active',r.dataset.hash===commit.hash);r.setAttribute('aria-pressed',String(r.dataset.hash===commit.hash))});
 const header=el('div',undefined,'selected-commit-heading');header.append(el('span','COMMIT','caption'),el('code',commit.hash.slice(0,8)));
 const title=el('h2',commit.title),author=el('div',undefined,'commit-author');
 const avatar=el('span',commit.author.slice(0,2).toUpperCase(),'author-avatar');
 const identity=el('div');const authored=el('time',new Date(commit.date).toLocaleString());authored.dateTime=commit.date;identity.append(el('strong',commit.author),authored);author.append(avatar,identity);
 const parents=el('div',undefined,'commit-parents');parents.append(el('span','부모 커밋'));for(const hash of commit.parents){const parent=el('button',hash.slice(0,7));parent.disabled=!state.history.some(c=>c.hash===hash);parent.onclick=()=>selectCommit(state.history.find(c=>c.hash===hash));parents.append(parent)}
 const status=el('div','변경 파일을 불러오는 중…','commit-file-heading');const list=el('div',undefined,'selected-commit-files');const commitBody=el('p',commit.body||'','commit-body');commitBody.hidden=!commit.body;commitPanel.replaceChildren(header,title,commitBody,author,parents,status,list);
 try{const summary=await api('comparisonFiles',{hash:commit.hash,parent:0});if(version!==commitSelectionVersion||!commitPanel.isConnected)return;
 status.textContent=`변경 파일 · ${summary.files.length}`;
 const parentChoice=el('select');parentChoice.dataset.uiOptions='true';parentChoice.setAttribute('aria-label','커밋 상세 비교 부모');parentChoice.hidden=summary.parents.length<2;summary.parents.forEach((hash,i)=>{const option=el('option',`부모 ${i+1} · ${hash.slice(0,7)}`);option.value=i;parentChoice.append(option)});
 status.append(parentChoice);
 async function openFile(file){if(panelSelection!=='commit'||activeCommit!==commit.hash)return;selectedCommitFile=file.name;list.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.name===file.name);b.setAttribute('aria-pressed',String(b.dataset.name===file.name))});$('history').hidden=true;workingReview.hidden=true;commitReview.hidden=false;const root=el('div');root.id='inlineCommitDiff';reviewContent.replaceChildren(root);await showComparison(root,{hash:commit.hash,parent:Number(parentChoice.value),name:file.name})}
 function drawFiles(files){list.replaceChildren();for(const file of files){const button=el('button',undefined,'commit-file');button.dataset.name=file.name;button.title=file.name;button.append(el('span',file.status,'commit-file-status status-'+file.status),el('span',file.name));button.onclick=()=>openFile(file);list.append(button)}if(!files.length)list.append(el('p','이 부모와 비교한 파일 변경이 없습니다.','change-empty'))}
 drawFiles(summary.files);
 parentChoice.onchange=async()=>{try{const next=await api('comparisonFiles',{hash:commit.hash,parent:Number(parentChoice.value)});if(version!==commitSelectionVersion)return;drawFiles(next.files);graphHome()}catch(error){notify(error.message)}};
 }catch(error){if(version===commitSelectionVersion)status.textContent=error.message}
};
const contextHistory=renderHistory;renderHistory=function(){renderSelecting=true;try{contextHistory()}finally{renderSelecting=false}document.querySelector('.commit-inspector')?.remove();document.querySelector('.wip-row')?.remove();if(mode==='history'&&!document.querySelector('.historyrow')){++commitSelectionVersion;delete commitPanel.dataset.hash;commitPanel.replaceChildren(el('p',state?.history.length?'선택된 커밋 없음':'아직 커밋이 없습니다.','compare-empty'));setPanel('commit')}};
const contextRender=render;render=function(){const wasReview=!commitReview.hidden;const file=selectedCommitFile;contextRender();setPanel(panelSelection);if(wasReview&&file){const waitVersion=commitSelectionVersion;queue.then(()=>{if(waitVersion===commitSelectionVersion){const button=[...commitPanel.querySelectorAll('.commit-file')].find(b=>b.dataset.name===file);button?.click()}})}};
// Icons share one stroke weight and visual size instead of platform-dependent Unicode glyphs.
function toolIcon(key){return PgitIcons.icon({undoCommit:'undo',fetch:'fetch',pull:'pull',push:'push',branchCreate:'branch',stashSave:'stash',stashPop:'unstash'}[key])}
const popTool=el('button');popTool.dataset.repoCommand='stashPop';popTool.onclick=()=>openCommand('stashPop');arcticToolbar.append(popTool);
const toolbarNames={undoCommit:'커밋 취소',fetch:'Fetch',pull:'Pull',push:'Push',branchCreate:'브랜치 만들기',stashSave:'Stash 만들기',stashPop:'Stash Pop'};
const toolGroup=el('div',undefined,'primary-tools');arcticToolbar.prepend(toolGroup);
for(const key of ['undoCommit','fetch','pull','push','branchCreate','stashSave','stashPop']){const button=arcticToolbar.querySelector(`[data-repo-command="${key}"]`);button.replaceChildren(toolIcon(key),el('span',toolbarNames[key]));button.setAttribute('aria-label',toolbarNames[key]);toolGroup.append(button)}
const compactControls=controls;controls=function(){compactControls();popTool.disabled=working||!state?.stashes.length};
// A real current-branch menu and a repository identity occupy the toolbar's left side.
const repoContext=el('div',undefined,'repo-context');const currentBranch=el('button','브랜치 선택','current-branch');currentBranch.onclick=()=>openCommand('branchSwitch');repoContext.append(repoHeading,currentBranch);arcticToolbar.prepend(repoContext);workspaceHeading.hidden=true;workspaceHeading.style.setProperty('display','none','important');
const compactRender=render;render=function(){compactRender();PgitIcons.label(currentBranch,'branch',state?.branch||'브랜치 선택');currentBranch.title=state?.root||'';document.querySelectorAll('.branchitem').forEach(b=>{b.title=b.textContent;b.classList.toggle('checked-out',b.dataset.ref==='refs/heads/'+state?.branch)});};
// Native-feeling adjustable columns. Widths are preferences, never repository state.
for(const [sideName,label,min,max,defaultWidth] of [['left','브랜치 패널 너비',150,320,200],['right','상세 패널 너비',260,480,320]]){const divider=el('div',undefined,'pane-divider divider-'+sideName);divider.tabIndex=0;divider.setAttribute('role','separator');divider.setAttribute('aria-label',label);divider.setAttribute('aria-orientation','vertical');document.querySelector('.shell').append(divider);let width=Number(localStorage.getItem('pgit.pane.'+sideName))||defaultWidth;function resize(value){width=Math.max(min,Math.min(max,value));document.body.style.setProperty('--'+sideName+'-width',width+'px');divider.setAttribute('aria-valuenow',width);divider.setAttribute('aria-valuemin',min);divider.setAttribute('aria-valuemax',max)}resize(width);divider.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();resize(width+(e.key==='ArrowRight'?1:-1)*(sideName==='left'?1:-1)*16);localStorage.setItem('pgit.pane.'+sideName,width)};divider.onpointerdown=e=>{e.preventDefault();const start=e.clientX,initial=width;divider.setPointerCapture(e.pointerId);divider.onpointermove=move=>resize(initial+(move.clientX-start)*(sideName==='left'?1:-1));divider.onpointerup=()=>{divider.onpointermove=null;localStorage.setItem('pgit.pane.'+sideName,width)};divider.onlostpointercapture=()=>divider.onpointermove=null};}
const contextChooseRef=chooseHistoryRef;chooseHistoryRef=function(ref,hash){contextChooseRef(ref,hash);const commit=state?.history.find(c=>c.hash===hash);if(commit)selectCommit(commit)};
setPanel('commit');controls();
