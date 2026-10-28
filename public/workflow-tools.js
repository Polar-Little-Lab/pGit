// GitKraken-style everyday actions, using the same guarded repository bridge.
const description=el('textarea');description.id='commitDescription';description.placeholder='상세 설명 (선택)';description.setAttribute('aria-label','커밋 상세 설명');description.maxLength=3998;description.rows=3;$('message').after(description);
const summaryCounter=el('span','0 / 72','summary-counter');$('message').before(summaryCounter);
function completeMessage(){return $('message').value.trim()+(description.value.trim()?'\n\n'+description.value.trim():'')}
const workflowControls=controls;controls=function(){workflowControls();const length=$('message').value.length;summaryCounter.textContent=length+' / 72';summaryCounter.classList.toggle('long-summary',length>72);if(completeMessage().length>4000){$('commit').disabled=true;$('commitSummary').textContent='제목과 상세 설명은 합쳐서 4,000자 이내로 입력하세요.'}document.querySelectorAll('[data-stage-all]').forEach(b=>{const members=(state?.files||[]).filter(b.dataset.stageAll==='true'?hasWorkingChange:hasStagedChange);b.disabled=working||!members.length||!!state?.files.some(f=>f.conflict)})};
const workflowPublish=publishPane;publishPane=function(){if(embedded)sendShell({type:'state',path:state?.root||null,count:state?.files.length||0,busy:working,draft:completeMessage()});else workflowPublish()};
description.oninput=()=>{controls();publishPane()};
$('message').addEventListener('input',()=>{controls();publishPane()});
$('form').onsubmit=async e=>{e.preventDefault();if($('commit').disabled)return;const message=completeMessage();if(await mutate('commit',{message})){$('message').value='';description.value='';controls();publishPane();notify('커밋을 생성했습니다.')}};
const bulkChanges=renderChangesFiles;renderChangesFiles=function(){bulkChanges();for(const group of $('files').querySelectorAll('.change-group')){const stage=group.dataset.area==='working';const button=el('button',stage?'전체 스테이징':'전체 해제','stage-all');button.type='button';button.dataset.stageAll=String(stage);button.onclick=()=>mutate('stageAll',{value:stage});group.querySelector('h2').append(button)}controls()};
document.addEventListener('keydown',event=>{if(mode!=='changes'||document.querySelector('dialog[open]')||activeFrostPicker)return;const mod=event.metaKey||event.ctrlKey;if(mod&&event.key==='Enter'&&!event.shiftKey){event.preventDefault();if(!$('commit').disabled)$('form').requestSubmit()}else if(mod&&event.shiftKey&&['s','u'].includes(event.key.toLowerCase())){event.preventDefault();if(!working&&state&&!state.files.some(f=>f.conflict))mutate('stageAll',{value:event.key.toLowerCase()==='s'})}});
// Dropping source onto the checked-out branch opens a review step; Git runs only on submit.
let draggedBranch=null;
const branchDropDialog=el('dialog');branchDropDialog.className='branch-drop-dialog';branchDropDialog.setAttribute('aria-label','브랜치 작업 선택');document.body.append(branchDropDialog);
function branchDrop(source,target){if(working||!state||source===target)return;const title=el('h2','브랜치 연결'),route=el('p',source+' → '+target,'branch-route');const explanation=el('p',target===state.branch?'현재 브랜치에 적용할 작업을 선택하세요. 다음 화면에서 내용을 검토하고 실행합니다.':'대상 브랜치를 먼저 체크아웃해야 합니다. 작업 폴더가 깨끗한지 확인한 뒤 전환하세요.');const close=el('button','취소');close.onclick=()=>branchDropDialog.close();branchDropDialog.replaceChildren(title,route,explanation);
 const choices=target===state.branch?[['merge','병합 · '+source+' → '+target,{ref:source}],['rebase','리베이스 · '+target+' onto '+source,{ref:source}]]:[['branchSwitch',target+' 체크아웃',{name:target}]];
 for(const [key,label,data] of choices){const button=el('button',label,'command-option');button.onclick=()=>{branchDropDialog.close();contextualCommand(key,data)};branchDropDialog.append(button)}branchDropDialog.append(close);branchDropDialog.showModal()}
const dragRender=render;render=function(){dragRender();for(const button of $('branches').querySelectorAll('[data-ref]')){button.draggable=true;const name=button.dataset.ref.slice(11);button.ondragstart=e=>{if(working){e.preventDefault();return}draggedBranch=name;e.dataTransfer.setData('text/plain',name);e.dataTransfer.effectAllowed='link'};button.ondragover=e=>{if(draggedBranch&&draggedBranch!==name){e.preventDefault();button.classList.add('branch-drop-target')}};button.ondragleave=()=>button.classList.remove('branch-drop-target');button.ondrop=e=>{e.preventDefault();button.classList.remove('branch-drop-target');if(draggedBranch)branchDrop(draggedBranch,name);draggedBranch=null};button.ondragend=()=>{draggedBranch=null;document.querySelectorAll('.branch-drop-target').forEach(b=>b.classList.remove('branch-drop-target'))}}};
controls();

// Branch groups are presentation only; all actions retain the complete Git ref.
const branchFolderExpansion=new Map();
function groupBranches(host,buttons,prefix,relativeName){
 const tree={groups:new Map(),leaves:[]};
 for(const button of buttons){const name=relativeName(button),parts=name.split('/');let node=tree;for(const segment of parts.slice(0,-1)){if(!node.groups.has(segment))node.groups.set(segment,{groups:new Map(),leaves:[]});node=node.groups.get(segment)}const label=el('span',parts.at(-1),'branch-label literal-data');button.firstChild.replaceWith(label);button.title=name;node.leaves.push(button)}
 function count(node){return node.leaves.length+[...node.groups.values()].reduce((n,child)=>n+count(child),0)}
 function append(node,parent,path){for(const [name,child] of node.groups){const key=(state?.root||'')+'|'+prefix+'|'+path+name,group=el('details',undefined,'branch-folder');group.dataset.branchGroup=key;group.open=branchFolderExpansion.get(key)??true;const summary=el('summary');summary.append(el('span',name,'branch-folder-name literal-data'),el('span',String(count(child)),'folder-count'));const children=el('div',undefined,'branch-folder-children');group.append(summary,children);append(child,children,path+name+'/');summary.addEventListener('click',()=>{branchFolderExpansion.set(key,!group.open)});parent.append(group)}for(const button of node.leaves)parent.append(button)}
 const fragment=document.createDocumentFragment();append(tree,fragment,'');host.append(fragment);
}
function restoreBranchFolders(){for(const group of side.querySelectorAll('.branch-folder,.remote-group'))group.open=branchFolderExpansion.get(group.dataset.branchGroup)??true}
const folderRender=render;render=function(){folderRender();groupBranches($('branches'),[...$('branches').querySelectorAll('[data-ref]')],'local',b=>b.dataset.ref.slice('refs/heads/'.length));for(const remote of side.querySelectorAll('.remote-group')){const buttons=[...remote.querySelectorAll('.remote-branch')];const key=(state?.root||'')+'|remote|'+buttons[0]?.dataset.ref.split('/')[2];remote.dataset.branchGroup=key;remote.querySelector(':scope>summary').addEventListener('click',()=>{branchFolderExpansion.set(key,!remote.open)});groupBranches(remote.querySelector(':scope>.branch-folder-children'),buttons,'remote:'+buttons[0]?.dataset.ref.split('/')[2],b=>b.dataset.ref.slice('refs/remotes/'.length).split('/').slice(1).join('/'))}restoreBranchFolders()};

// Top-level branch sections use the same disclosure as prefix folders.
function branchSection(key,label,nodes){
 const section=el('details',undefined,'branch-section');
 const stateKey=(state?.root||'')+'|section|'+key;
 section.open=branchFolderExpansion.get(stateKey)??true;
 const summary=el('summary',label),body=el('div',undefined,'branch-section-body');
 summary.addEventListener('click',()=>branchFolderExpansion.set((state?.root||'')+'|section|'+key,!section.open));
 section.append(summary,body);nodes[0].before(section);body.append(...nodes);return section;
}
const sectionRender=render;render=function(){
 sectionRender();
 let local=$('branches').closest('.branch-section');
 if(!local){const caption=$('branches').previousElementSibling;local=branchSection('local','로컬 브랜치',[$('branches')]);if(caption?.classList.contains('caption'))caption.remove()}
 local.open=branchFolderExpansion.get((state?.root||'')+'|section|local')??true;
 const extra=$('extraRefs');if(extra){const caption=extra.querySelector(':scope>.caption');if(caption){const nodes=[];let node=caption.nextElementSibling;while(node&&!node.classList.contains('caption')){nodes.push(node);node=node.nextElementSibling}if(nodes.length){branchSection('remote','원격 브랜치',nodes);caption.remove()}}}
};
