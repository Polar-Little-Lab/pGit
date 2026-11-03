let graphPreferencesRoot=null,hiddenGraphRefs=new Set(),soloGraphRef=null;
const selectedCommits=new Set();let selectionAnchor=null;
function graphRefs(){return [...state.branches.map(b=>({name:'refs/heads/'+b.name,hash:b.hash})),...state.refs.filter(r=>!r.name.endsWith('/HEAD'))]}
function loadGraphPreferences(){
 if(!state||graphPreferencesRoot===state.root)return;
 graphPreferencesRoot=state.root;hiddenGraphRefs=new Set();soloGraphRef=null;selectedCommits.clear();selectionAnchor=null;
 try{const saved=JSON.parse(localStorage.getItem('pgit.graph.'+state.root)||'null');if(Array.isArray(saved?.hidden))hiddenGraphRefs=new Set(saved.hidden.filter(ref=>typeof ref==='string'));if(typeof saved?.solo==='string')soloGraphRef=saved.solo}catch{}
}
function graphRefVisible(name){return soloGraphRef?name===soloGraphRef:!hiddenGraphRefs.has(name)}
function filteredGraphHistory(){
 loadGraphPreferences();
 const refs=graphRefs(),names=new Set(refs.map(r=>r.name));
 hiddenGraphRefs=new Set([...hiddenGraphRefs].filter(name=>names.has(name)));if(soloGraphRef&&!names.has(soloGraphRef))soloGraphRef=null;
 return PgitHistoryModel.filterHistory(state.history,refs,[...hiddenGraphRefs],soloGraphRef,state.branch==='(detached HEAD)'?state.head:null);
}
function changeGraphVisibility(action,ref){
 if(action==='solo')soloGraphRef=soloGraphRef===ref?null:ref;
 else if(action==='hide'){if(hiddenGraphRefs.has(ref))hiddenGraphRefs.delete(ref);else hiddenGraphRefs.add(ref)}
 else if(action==='stop')soloGraphRef=null;
 else{hiddenGraphRefs.clear();soloGraphRef=null}
 try{localStorage.setItem('pgit.graph.'+state.root,JSON.stringify({hidden:[...hiddenGraphRefs],solo:soloGraphRef}))}catch{}
 const chosen=soloGraphRef&&graphRefs().find(item=>item.name===soloGraphRef);if(chosen){scope=chosen.hash;selectedHistoryRef=chosen.name}else if(action==='stop'){scope=null;selectedHistoryRef=null}selectedCommits.clear();selectionAnchor=null;tab('history');render();
}
function paintGraphRefs(){document.querySelectorAll('aside [data-ref]').forEach(button=>{
 button.classList.toggle('graph-ref-hidden',hiddenGraphRefs.has(button.dataset.ref)&&!soloGraphRef);
 button.classList.toggle('graph-ref-solo',soloGraphRef===button.dataset.ref);
})}
function paintCommitSelection(){
 for(const row of document.querySelectorAll('.historyrow')){
  const selected=selectedCommits.size?selectedCommits.has(row.dataset.hash):row.dataset.hash===activeCommit;
  row.classList.toggle('active',selected);row.setAttribute('aria-pressed',String(selected));
 }
 let tools=$('historySelectionTools');if(!tools){tools=el('div',undefined,'history-selection-tools');tools.id='historySelectionTools';document.querySelector('#history .filterbar')?.after(tools)}
 tools.replaceChildren();tools.hidden=!selectedCommits.size;
 if(selectedCommits.size){const count=el('span',`선택한 커밋 · ${selectedCommits.size}`),apply=el('button','선택한 커밋 Cherry-pick'),clear=el('button','선택 해제');apply.disabled=selectedCommits.size<2||working;apply.onclick=()=>openMultiCherryPick();clear.onclick=()=>{selectedCommits.clear();selectionAnchor=null;paintCommitSelection()};tools.append(count);if(selectedCommits.size===2){const compare=el('button','두 커밋 비교');compare.onclick=()=>{const commits=state.history.filter(c=>selectedCommits.has(c.hash));compareSelectedCommits(commits[1].hash,commits[0].hash)};tools.append(compare)}tools.append(apply,clear)}
}
const graphDrawRows=drawRows;drawRows=function(){
 graphDrawRows();const visible=new Set([...document.querySelectorAll('.historyrow')].map(row=>row.dataset.hash));
 for(const hash of selectedCommits)if(!visible.has(hash))selectedCommits.delete(hash);
 paintCommitSelection();
 const bar=document.querySelector('#history .filterbar');bar?.querySelector('.graph-visibility-tools')?.remove();
 if(soloGraphRef||hiddenGraphRefs.size){const tools=el('div',undefined,'graph-visibility-tools');
  if(soloGraphRef){const name=el('span',soloGraphRef.replace(/^refs\/(heads|remotes|tags)\//,''),'literal-data');const stop=el('button','단독 보기 종료');stop.onclick=()=>changeGraphVisibility('stop');tools.append(name,stop)}
  else{const reset=el('button',`숨긴 브랜치 표시 · ${hiddenGraphRefs.size}`);reset.onclick=()=>changeGraphVisibility('reset');tools.append(reset)}
  bar?.append(tools);
 }
 paintGraphRefs();
};
const graphRender=render;render=function(){loadGraphPreferences();graphRender();paintGraphRefs()};
const graphSelectCommit=selectCommit;selectCommit=async function(commit){const result=graphSelectCommit(commit);paintCommitSelection();return result};
// Explicit parent navigation reveals the destination without scrolling the inspector.
function navigateToCommit(hash){
 const commit=state?.history.find(item=>item.hash===hash);if(!commit)return;
 selectedCommits.clear();selectionAnchor=hash;
 const findRow=()=>document.querySelector(`.historyrow[data-hash="${hash}"]`);
 if(!findRow()&&historyQuery){historyQuery='';renderHistory()}
 selectCommit(commit);
 const row=findRow(),scroller=$('historyScroll');if(!row||!scroller)return;
 row.focus({preventScroll:true});
 const head=scroller.querySelector('.history-head')?.offsetHeight||0;
 const top=scroller.scrollTop+row.getBoundingClientRect().top-scroller.getBoundingClientRect().top-head-(scroller.clientHeight-head-row.offsetHeight)/2;
 scroller.scrollTo({top:Math.max(0,top),behavior:'instant'});
}
$('history').addEventListener('click',event=>{
 const row=event.target.closest('.historyrow');if(!row)return;
 const hash=row.dataset.hash;
 if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey){selectedCommits.clear();selectionAnchor=hash;return}
 event.preventDefault();event.stopImmediatePropagation();
 const rows=[...document.querySelectorAll('.historyrow')].map(row=>row.dataset.hash);
 if(event.shiftKey){const anchor=selectionAnchor||activeCommit||hash;const start=rows.indexOf(anchor),end=rows.indexOf(hash);if(!event.metaKey&&!event.ctrlKey)selectedCommits.clear();for(const value of rows.slice(Math.min(start<0?end:start,end),Math.max(start,end)+1))selectedCommits.add(value);selectionAnchor=anchor}
 else{if(!selectedCommits.size&&activeCommit)selectedCommits.add(activeCommit);if(selectedCommits.has(hash))selectedCommits.delete(hash);else selectedCommits.add(hash);selectionAnchor=hash}
 const commit=state.history.find(c=>c.hash===hash);if(commit)selectCommit(commit);paintCommitSelection();
},true);
$('history').addEventListener('keydown',event=>{if(event.key==='Escape'&&selectedCommits.size){event.preventDefault();selectedCommits.clear();selectionAnchor=null;paintCommitSelection()}},true);
// Extend the existing compact context menus instead of creating another menu style.
document.addEventListener('contextmenu',event=>{
 const button=event.target.closest('.branchitem,.remote-branch');if(!button)return;
 const ref=button.dataset.ref,body=advancedDialog.querySelector('.advanced-body');if(!body)return;
 const options=[[hiddenGraphRefs.has(ref)?'그래프에 표시':'그래프에서 숨기기',()=>changeGraphVisibility('hide',ref)],[soloGraphRef===ref?'단독 보기 종료':'이 브랜치만 보기',()=>changeGraphVisibility('solo',ref)]];
 for(const [label,action] of options){const item=el('button',label,'command-option');item.onclick=()=>{advancedDialog.close();action()};body.append(item)}
});
$('history').addEventListener('contextmenu',event=>{
 const row=event.target.closest('.historyrow');if(!row)return;if(selectedCommits.size<2||!selectedCommits.has(row.dataset.hash)){selectedCommits.clear();selectionAnchor=row.dataset.hash;const commit=state.history.find(c=>c.hash===row.dataset.hash);if(commit)selectCommit(commit);return;}
 event.preventDefault();event.stopImmediatePropagation();const body=advancedFrame('여러 커밋 선택','menu');const apply=el('button','선택한 커밋 Cherry-pick','command-option');apply.onclick=()=>{advancedDialog.close();openMultiCherryPick()};body.append(apply);
},true);
async function openMultiCherryPick(){
 if(working||selectedCommits.size<2)return;
 const body=advancedFrame('여러 커밋 Cherry-pick','list');body.textContent='적용 순서를 확인하는 중…';
 try{
  const plan=await api('cherryPickPreview',{refs:[...selectedCommits]});if(!body.isConnected||!advancedDialog.open)return;
  body.replaceChildren();const target=el('p');target.append(el('span','적용 대상'),document.createTextNode(' · '),el('strong',plan.branch,'literal-data'),document.createTextNode(' · '),el('code',plan.head.slice(0,8)));
  const list=el('ol',undefined,'cherry-pick-order');for(const commit of plan.commits){const item=el('li');item.append(el('code',commit.hash.slice(0,8)),el('span',commit.title,'literal-data'));list.append(item)}
  const apply=el('button','현재 브랜치에 적용','primary');body.append(target,list,apply);
  apply.onclick=async()=>{apply.disabled=true;if(await applyAdvanced('cherryPickMany',{refs:plan.commits.map(c=>c.hash),expectedHead:plan.head,expectedBranch:plan.branch,limit:historyLimit})){selectedCommits.clear();selectionAnchor=null;paintCommitSelection();advancedDialog.close()}else apply.disabled=true};
 }catch(error){if(body.isConnected){body.textContent=error.message;body.setAttribute('role','alert')}}
}

const changesCount=$('count');PgitIcons.label($('changesNav'),'changes','변경 사항');$('changesNav').append(changesCount);PgitIcons.label(reviewBack,'back','그래프로 돌아가기');
