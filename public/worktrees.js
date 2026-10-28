// A focused manager; opening another worktree preserves the current project and draft.
const worktreeDialog=el('dialog');worktreeDialog.className='worktree-dialog';worktreeDialog.setAttribute('aria-label','워크트리 관리');
const worktreeHeader=el('div',undefined,'bar'),worktreeClose=el('button','닫기');PgitIcons.close(worktreeClose);worktreeClose.onclick=()=>worktreeDialog.close();worktreeHeader.append(el('strong','워크트리 관리'),worktreeClose);
const worktreeBody=el('div',undefined,'body'),worktreeTools=el('div',undefined,'worktree-tools'),worktreeCreate=el('button','워크트리 만들기'),worktreeRefresh=el('button','새로고침');PgitIcons.label(worktreeCreate,'plus','워크트리 만들기');PgitIcons.label(worktreeRefresh,'refresh','새로고침');worktreeCreate.setAttribute('aria-expanded','false');worktreeTools.append(worktreeCreate,worktreeRefresh);
const worktreeError=el('p',undefined,'command-error');worktreeError.setAttribute('role','alert');worktreeError.hidden=true;
const worktreeForm=el('form',undefined,'worktree-form');worktreeForm.hidden=true;
const worktreeInputs={};for(const [name,label,placeholder] of [['name','새 브랜치','feature/task'],['path','새 작업 폴더 절대 경로','/Users/you/Projects/task'],['ref','시작 참조','HEAD']]){const lab=el('label',label),input=el('input');input.name=name;input.required=true;input.placeholder=placeholder;input.setAttribute('aria-label',label);input.className='literal-data';if(name==='ref')input.value='HEAD';lab.append(input);worktreeForm.append(lab);worktreeInputs[name]=input}
const createActions=el('div',undefined,'worktree-actions'),createCancel=el('button','취소'),createSubmit=el('button','만들기','primary');createCancel.type='button';createCancel.onclick=()=>{worktreeForm.hidden=true;worktreeCreate.setAttribute('aria-expanded','false');worktreeCreate.focus()};createActions.append(createCancel,createSubmit);worktreeForm.append(createActions);
const worktreeList=el('div',undefined,'worktree-list');worktreeBody.append(worktreeTools,worktreeForm,worktreeError,worktreeList);worktreeDialog.append(worktreeHeader,worktreeBody);document.body.append(worktreeDialog);
let worktreeBusy=false,worktreeVersion=0;
function worktreeFail(error){worktreeError.textContent=error.message;worktreeError.hidden=false}
function worktreeButtons(){for(const b of worktreeBody.querySelectorAll('button'))b.disabled=worktreeBusy||b.dataset.unavailable==='true'}
async function refreshWorktrees(){if(worktreeBusy)return;const version=++worktreeVersion;worktreeBusy=true;worktreeButtons();worktreeError.hidden=true;
 try{const items=await api('worktreeOverview');if(version===worktreeVersion)drawWorktrees(items)}catch(error){worktreeFail(error)}finally{worktreeBusy=false;worktreeButtons()}
}
async function changeWorktree(action,data){if(worktreeBusy||working)return false;worktreeBusy=true;working=true;controls();worktreeButtons();worktreeError.hidden=true;let success=false;
 try{state=await api(action,{limit:historyLimit,...data});render();success=true}catch(error){worktreeFail(error)}finally{working=false;worktreeBusy=false;controls();worktreeButtons()}
 if(success)await refreshWorktrees();return success;
}
function drawWorktrees(items){worktreeList.replaceChildren();for(const item of items){
 const card=el('section',undefined,'worktree-card');card.dataset.worktreePath=item.path;
 const head=el('div',undefined,'worktree-card-heading'),name=el('strong',item.branch?.replace(/^refs\/heads\//,'')||(item.detached?'Detached HEAD':'Bare repository'),'literal-data');head.append(name);
 for(const [on,label] of [[item.current,'현재 프로젝트'],[item.main,'기본 작업 폴더'],[item.locked,'잠김']])if(on)head.append(el('span',label,'worktree-badge'));
 const location=el('p',item.path,'literal-data worktree-path');location.title=item.path;
 const status=el('p',item.error||(item.changes===null?'':item.changes?`변경 ${item.changes}개`:'변경 없음'),'worktree-status');
 const actions=el('div',undefined,'worktree-actions');
 function action(label,fn,unavailable=false){const b=el('button',label);b.type='button';b.dataset.unavailable=String(unavailable);b.disabled=unavailable;b.onclick=fn;PgitIcons.label(b,label==='삭제'?'trash':label==='잠금'?'lock':label==='잠금 해제'?'unlock':'folder',label);actions.append(b);return b}
 action(embedded?'프로젝트 탭으로 열기':'작업 폴더 열기',async()=>{if(embedded){sendShell({type:'open-worktree',path:item.path});worktreeDialog.close()}else{if($('message').value.trim()||$('commitDescription')?.value.trim()){worktreeFail(Error('커밋 초안을 정리한 뒤 작업 폴더를 전환하세요.'));return}if(await mutate('open',{path:item.path}))worktreeDialog.close()}},item.current||item.bare||!!item.error);
 action(item.locked?'잠금 해제':'잠금',()=>changeWorktree(item.locked?'worktreeUnlock':'worktreeLock',{path:item.path}),item.main||item.bare);
 const remove=action('삭제',()=>{confirmation.hidden=false;confirmDelete.focus()},item.main||item.current||item.locked||item.bare||!!item.error||item.changes!==0);remove.title='변경이 없고 잠금이 해제된 작업 폴더만 삭제할 수 있습니다.';
 const confirmation=el('div',undefined,'worktree-confirm');confirmation.hidden=true;confirmation.append(el('p','이 작업 폴더를 삭제합니다. 브랜치와 커밋은 유지됩니다.'));
 const cancel=el('button','취소'),confirmDelete=el('button','작업 폴더 삭제');cancel.onclick=()=>confirmation.hidden=true;confirmDelete.onclick=()=>changeWorktree('worktreeRemove',{path:item.path});confirmation.append(cancel,confirmDelete);
 card.append(head,location,status);if(item.lockReason)card.append(el('p',item.lockReason,'literal-data'));card.append(actions,confirmation);worktreeList.append(card);
}}
worktreeCreate.onclick=()=>{worktreeForm.hidden=!worktreeForm.hidden;worktreeCreate.setAttribute('aria-expanded',String(!worktreeForm.hidden));if(!worktreeForm.hidden)worktreeInputs.name.focus()};worktreeRefresh.onclick=refreshWorktrees;
worktreeForm.onsubmit=async event=>{event.preventDefault();const data=Object.fromEntries(new FormData(worktreeForm));if(await changeWorktree('worktreeAdd',data)){worktreeForm.hidden=true;worktreeCreate.setAttribute('aria-expanded','false');worktreeInputs.name.value='';worktreeInputs.path.value='';worktreeCreate.focus()}};
function openWorktrees(){if(!state)return;worktreeForm.hidden=true;worktreeCreate.setAttribute('aria-expanded','false');if(!worktreeDialog.open)worktreeDialog.showModal();refreshWorktrees()}
const worktreeNav=el('button','워크트리','nav');$('historyNav').after(worktreeNav);worktreeNav.onclick=openWorktrees;PgitIcons.label(worktreeNav,'worktree','워크트리');
const worktreeOpenCommand=openCommand;openCommand=async function(key){if(key==='worktreeList'){panel.close();openWorktrees();return}return worktreeOpenCommand(key)};
