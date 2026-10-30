// One selection, one set of actions. Creation replaces the manager rather than nesting dialogs.
const worktreeDialog=el('dialog');worktreeDialog.className='worktree-dialog';worktreeDialog.setAttribute('aria-label','워크트리 관리');
const worktreeHeader=el('div',undefined,'bar'),worktreeTitle=el('strong','워크트리 관리'),worktreeClose=el('button','닫기');PgitIcons.close(worktreeClose);worktreeClose.onclick=()=>worktreeDialog.close();worktreeHeader.append(worktreeTitle,worktreeClose);
const worktreeBody=el('div',undefined,'body'),worktreeTools=el('div',undefined,'worktree-tools'),worktreeCreate=el('button','워크트리 만들기','primary'),worktreeRefresh=el('button');PgitIcons.label(worktreeCreate,'plus','워크트리 만들기');PgitIcons.label(worktreeRefresh,'refresh');worktreeRefresh.setAttribute('aria-label','새로고침');worktreeRefresh.title='새로고침';
const worktreeSearch=el('input');worktreeSearch.type='search';worktreeSearch.placeholder='브랜치 또는 폴더 검색';worktreeSearch.setAttribute('aria-label','브랜치 또는 폴더 검색');worktreeTools.append(worktreeSearch,worktreeRefresh,worktreeCreate);
const worktreeError=el('p',undefined,'command-error');worktreeError.setAttribute('role','alert');worktreeError.hidden=true;
const worktreeLayout=el('div',undefined,'worktree-layout'),worktreeList=el('div',undefined,'worktree-list'),worktreeDetail=el('section',undefined,'worktree-detail');worktreeList.setAttribute('role','listbox');worktreeList.setAttribute('aria-label','워크트리');worktreeLayout.append(worktreeList,worktreeDetail);
const worktreeForm=el('form',undefined,'worktree-form');worktreeForm.hidden=true;
const worktreeInputs={};for(const [name,label,placeholder] of [['name','새 브랜치','feature/task'],['ref','시작 참조','HEAD'],['path','새 작업 폴더 절대 경로','/Users/you/Projects/task']]){const lab=el('label',label),input=el('input');input.name=name;input.required=true;input.placeholder=placeholder;input.setAttribute('aria-label',label);input.className='literal-data';input.autocomplete='off';if(name==='ref')input.value='HEAD';lab.append(input);worktreeForm.append(lab);worktreeInputs[name]=input}
const worktreeRefs=el('datalist');worktreeRefs.id='worktreeRefs';worktreeInputs.ref.setAttribute('list',worktreeRefs.id);worktreeForm.append(worktreeRefs);
const createActions=el('div',undefined,'worktree-actions'),createCancel=el('button','취소'),createSubmit=el('button','만들기','primary');createCancel.type='button';createActions.append(createCancel,createSubmit);worktreeForm.append(createActions);
worktreeBody.append(worktreeError,worktreeTools,worktreeLayout,worktreeForm);worktreeDialog.append(worktreeHeader,worktreeBody);document.body.append(worktreeDialog);
let worktreeBusy=false,worktreeVersion=0,worktreeItems=[],worktreeSelected=null,worktreeDraftRoot=null,worktreePathEdited=false;
function worktreeFail(error){worktreeError.textContent=error.message;worktreeError.hidden=false}
function worktreeButtons(){for(const b of worktreeBody.querySelectorAll('button,input'))b.disabled=worktreeBusy||b.dataset.unavailable==='true';worktreeClose.disabled=worktreeBusy;worktreeDialog.setAttribute('aria-busy',String(worktreeBusy))}
function worktreeMode(creating){worktreeForm.hidden=!creating;worktreeTools.hidden=creating;worktreeLayout.hidden=creating;worktreeDialog.dataset.view=creating?'create':'list';worktreeTitle.textContent=creating?'워크트리 만들기':'워크트리 관리';worktreeError.hidden=true}
worktreeDialog.addEventListener('cancel',e=>{if(worktreeBusy){e.preventDefault();return}if(!worktreeForm.hidden){e.preventDefault();worktreeMode(false);worktreeCreate.focus()}});
async function refreshWorktrees(){if(worktreeBusy)return;const version=++worktreeVersion;worktreeBusy=true;worktreeButtons();worktreeError.hidden=true;
 try{const items=await api('worktreeOverview');if(version===worktreeVersion){worktreeItems=items;if(!items.some(i=>i.path===worktreeSelected))worktreeSelected=(items.find(i=>i.current)||items[0])?.path;drawWorktrees()}}catch(error){worktreeFail(error)}finally{worktreeBusy=false;worktreeButtons()}
}
async function changeWorktree(action,data){if(worktreeBusy||working)return false;worktreeBusy=true;working=true;controls();worktreeButtons();worktreeError.hidden=true;let success=false;
 try{state=await api(action,{limit:historyLimit,...data});render();success=true}catch(error){worktreeFail(error)}finally{working=false;worktreeBusy=false;controls();worktreeButtons()}
 if(success)await refreshWorktrees();return success;
}
function worktreeName(item){return item.branch?.replace(/^refs\/heads\//,'')||(item.detached?'Detached HEAD':'Bare repository')}
function worktreeStatus(item){return item.error?'상태 확인 불가':item.changes===null?'':item.changes?`변경 ${item.changes}개`:'변경 없음'}
function drawWorktrees(){
 worktreeList.replaceChildren();const query=worktreeSearch.value.trim().toLocaleLowerCase(),items=worktreeItems.filter(i=>(worktreeName(i)+' '+i.path).toLocaleLowerCase().includes(query));
 if(!items.some(i=>i.path===worktreeSelected))worktreeSelected=items[0]?.path;
 if(!items.length)worktreeList.append(el('p','검색 결과가 없습니다.','worktree-empty'));
 for(const item of items){const row=el('button',undefined,'worktree-row');row.type='button';row.dataset.worktreePath=item.path;row.setAttribute('role','option');row.setAttribute('aria-selected',String(item.path===worktreeSelected));row.tabIndex=item.path===worktreeSelected?0:-1;
 const heading=el('span',undefined,'worktree-row-heading');heading.append(PgitIcons.icon('branch'),el('strong',worktreeName(item),'literal-data'));if(item.current)heading.append(el('span','현재 프로젝트','worktree-badge'));if(item.locked)heading.append(PgitIcons.icon('lock'));
 row.append(heading,el('span',item.path.split('/').pop(),'literal-data worktree-folder'),el('span',worktreeStatus(item),'worktree-status'));row.title=item.path;
 row.onclick=()=>{worktreeSelected=item.path;drawWorktrees();worktreeList.querySelector('[aria-selected=true]')?.focus()};row.ondblclick=()=>openWorktree(item);worktreeList.append(row)}
 drawWorktreeDetail(worktreeItems.find(i=>i.path===worktreeSelected));
}
worktreeList.onkeydown=e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;const rows=[...worktreeList.querySelectorAll('[role=option]')];if(!rows.length)return;e.preventDefault();let n=rows.indexOf(document.activeElement);n=e.key==='Home'?0:e.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,n+(e.key==='ArrowDown'?1:-1)));rows[n].click()};
async function openWorktree(item){if(worktreeBusy||item.current||item.bare||item.error)return;if(embedded){sendShell({type:'open-worktree',path:item.path});worktreeDialog.close()}else{if($('message').value.trim()||$('commitDescription')?.value.trim()){worktreeFail(Error('커밋 초안을 정리한 뒤 작업 폴더를 전환하세요.'));return}if(await mutate('open',{path:item.path}))worktreeDialog.close()}}
function drawWorktreeDetail(item){worktreeDetail.replaceChildren();delete worktreeDetail.dataset.worktreePath;if(!item)return;worktreeDetail.dataset.worktreePath=item.path;
 const heading=el('div',undefined,'worktree-detail-heading');heading.append(PgitIcons.icon('worktree'),el('strong',worktreeName(item),'literal-data'));worktreeDetail.append(heading);
 const badges=el('div',undefined,'worktree-badges');for(const [on,label] of [[item.current,'현재 프로젝트'],[item.main,'기본 작업 폴더'],[item.locked,'잠김']])if(on)badges.append(el('span',label,'worktree-badge'));worktreeDetail.append(badges);
 const location=el('p',item.path,'literal-data worktree-path');worktreeDetail.append(el('span','작업 폴더','worktree-field-label'),location,el('p',worktreeStatus(item),'worktree-status'));
 if(item.error)worktreeDetail.append(el('p',item.error,'command-error'));if(item.lockReason)worktreeDetail.append(el('p',item.lockReason,'literal-data worktree-path'));
 const actions=el('div',undefined,'worktree-actions');
 function action(label,icon,fn,unavailable=false){const b=el('button');b.type='button';b.dataset.unavailable=String(unavailable);b.disabled=unavailable;b.onclick=fn;PgitIcons.label(b,icon,label);actions.append(b);return b}
 const open=action(embedded?'프로젝트 탭으로 열기':'작업 폴더 열기','folder',()=>openWorktree(item),item.current||item.bare||!!item.error);open.className='primary';
 if(!item.main&&!item.bare)action(item.locked?'잠금 해제':'잠금',item.locked?'unlock':'lock',async()=>{if(await changeWorktree(item.locked?'worktreeUnlock':'worktreeLock',{path:item.path}))worktreeDetail.querySelector('.worktree-actions button:not(.primary)')?.focus()});
 worktreeDetail.append(actions);
 if(item.main||item.current||item.bare)return;
 const remove=el('button','삭제','worktree-remove');PgitIcons.label(remove,'trash','삭제');remove.dataset.unavailable=String(item.locked||!!item.error||item.changes!==0);remove.disabled=remove.dataset.unavailable==='true';
 const reason=item.locked?'잠금을 해제한 뒤 삭제하세요.':item.changes!==0||item.error?'변경이 없고 잠금이 해제된 작업 폴더만 삭제할 수 있습니다.':'';
 const confirmation=el('div',undefined,'worktree-confirm');confirmation.hidden=true;confirmation.append(el('p','이 작업 폴더를 삭제합니다. 브랜치와 커밋은 유지됩니다.'));
 const cancel=el('button','취소'),confirmDelete=el('button','작업 폴더 삭제');cancel.onclick=()=>{confirmation.hidden=true;remove.hidden=false;remove.focus()};confirmDelete.onclick=async()=>{if(await changeWorktree('worktreeRemove',{path:item.path}))worktreeList.querySelector('[aria-selected=true]')?.focus()};confirmation.append(cancel,confirmDelete);remove.onclick=()=>{confirmation.hidden=false;remove.hidden=true;confirmDelete.focus()};worktreeDetail.append(remove);if(reason)worktreeDetail.append(el('p',reason,'worktree-reason'));worktreeDetail.append(confirmation);
}
worktreeSearch.oninput=drawWorktrees;
worktreeInputs.path.oninput=()=>{worktreePathEdited=true};worktreeInputs.name.oninput=()=>{if(worktreePathEdited)return;const root=state.root.replace(/\/$/,''),name=worktreeInputs.name.value.trim().replace(/[^\p{L}\p{N}._-]+/gu,'-');worktreeInputs.path.value=name?root+'-'+name:''};
worktreeCreate.onclick=()=>{worktreeMode(true);worktreeRefs.replaceChildren();for(const value of ['HEAD',...(state.branches||[]).map(b=>typeof b==='string'?b:b.name).filter(Boolean)]){const option=el('option');option.value=value;worktreeRefs.append(option)}worktreeInputs.name.focus()};createCancel.onclick=()=>{worktreeMode(false);worktreeCreate.focus()};worktreeRefresh.onclick=refreshWorktrees;
worktreeForm.onsubmit=async event=>{event.preventDefault();const data=Object.fromEntries(new FormData(worktreeForm));if(await changeWorktree('worktreeAdd',data)){worktreeSelected=data.path;worktreeSearch.value='';worktreeMode(false);worktreeForm.reset();worktreeInputs.ref.value='HEAD';worktreePathEdited=false;drawWorktrees();worktreeList.querySelector('[aria-selected=true]')?.focus()}};
function openWorktrees(){if(!state)return;if(worktreeDraftRoot!==state.root){worktreeForm.reset();worktreeInputs.ref.value='HEAD';worktreePathEdited=false;worktreeDraftRoot=state.root;worktreeSearch.value='';worktreeSelected=null}worktreeMode(false);if(!worktreeDialog.open)worktreeDialog.showModal();refreshWorktrees()}
const worktreeNav=el('button','워크트리','nav');$('changesNav').after(worktreeNav);worktreeNav.onclick=openWorktrees;PgitIcons.label(worktreeNav,'worktree','워크트리');
const worktreeOpenCommand=openCommand;openCommand=async function(key){if(key==='worktreeList'){panel.close();openWorktrees();return}return worktreeOpenCommand(key)};
