// A bounded, searchable history view. Queries run against Git, not just loaded rows.
async function showFileHistory(name){
 if(!state||working)return;panel.close();const root=state.root,body=advancedFrame('파일 이력','list');advancedDialog.classList.add('file-history-dialog');body.classList.add('file-history-view');
 advancedDialog.addEventListener('close',()=>{if(!advancedDialog.open)advancedDialog.classList.remove('file-history-dialog','file-history-comparing');clearTimeout(timer)},{once:true});
 PgitCommandHelp.mount(body,'fileHistory');body.append(el('div',name,'file-history-path literal-data'));
 const toolbar=el('form',undefined,'file-history-toolbar'),search=el('input'),run=el('button','검색'),refresh=el('button','새로고침');search.type='search';search.maxLength=256;search.placeholder='이 파일의 전체 이력에서 커밋 메시지 검색';search.setAttribute('aria-label','커밋 메시지 검색');run.type='submit';refresh.type='button';toolbar.append(search,run,refresh);body.append(toolbar);
 const list=el('div',undefined,'ui-item-list file-history-list');list.setAttribute('aria-label','파일 이력');const footer=el('div',undefined,'file-history-footer'),status=el('span'),retry=el('button','새로고침');retry.type='button';retry.hidden=true;status.setAttribute('role','status');footer.append(status,retry);body.append(list,footer);
 let revision=null,offset=0,query='',version=0,timer,loading=false,hasMore=false,failedTarget=0;const alive=()=>body.isConnected&&advancedDialog.open&&state?.root===root;
 async function openHistoryFile(commit,source){
  const saved=[...body.children],scroll=list.scrollTop,detail=el('section',undefined,'file-history-detail'),bar=el('div',undefined,'file-history-detail-heading'),back=el('button','파일 이력'),title=el('strong',commit.title,'literal-data'),path=el('div',commit.oldName!==commit.name?commit.oldName+' → '+commit.name:commit.name,'file-history-path literal-data'),viewer=el('div');
  back.type='button';bar.append(back,title);detail.append(bar,path,viewer);body.replaceChildren(detail);advancedDialog.classList.add('file-history-comparing');
  back.onclick=()=>{body.replaceChildren(...saved);advancedDialog.classList.remove('file-history-comparing');list.scrollTop=scroll;source.focus({preventScroll:true})};
  await showComparison(viewer,{hash:commit.hash,parent:0,name:commit.name||name,fileOnly:true});
 }
 async function load(target=0,reset=false){
  const request=++version,append=target>0;if(reset)revision=null;loading=true;retry.hidden=true;hasMore=false;list.setAttribute('aria-busy','true');status.textContent='불러오는 중…';if(!append){list.replaceChildren();list.scrollTop=0;offset=0;}
  try{const result=await api('fileHistoryPage',{name,query,offset:target,...(revision?{revision}:{})});if(!alive()||request!==version)return;revision=result.revision;offset=result.offset+result.commits.length;hasMore=result.hasMore;
   for(const commit of result.commits){
    const row=PgitUI.listItem({title:commit.title}),button=el('button',undefined,'ui-list-item file-history-open'),main=el('span',undefined,'ui-list-main');button.type='button';button.title=commit.title;button.onclick=()=>openHistoryFile(commit,button);
    const meta=el('span',commit.author,'ui-list-meta literal-data'),date=el('time',new Date(commit.date).toLocaleDateString(document.documentElement.lang||undefined));date.dateTime=commit.date;date.title=new Date(commit.date).toLocaleString();meta.append(el('span',' · '),date);main.append(row.main.querySelector('strong'),meta);
    const hash=el('code',commit.hash.slice(0,8),'file-history-hash literal-data');hash.title=commit.hash;button.append(main,hash);list.append(button);
   }
   if(!append&&!result.commits.length)list.append(PgitUI.message(query?'일치하는 항목이 없습니다.':'표시할 항목이 없습니다.'));
   status.replaceChildren(el('span','커밋'),document.createTextNode(' '+offset));
  }catch(error){if(alive()&&request===version){status.textContent=error.message;failedTarget=target;retry.hidden=false}}
  finally{if(alive()&&request===version){loading=false;list.setAttribute('aria-busy','false')}}
 }
 function applySearch(){clearTimeout(timer);query=search.value.trim();load(0)}
 toolbar.onsubmit=event=>{event.preventDefault();applySearch()};search.oninput=()=>{clearTimeout(timer);++version;hasMore=false;retry.hidden=true;timer=setTimeout(applySearch,350)};
 refresh.onclick=()=>{clearTimeout(timer);query=search.value.trim();load(0,true)};retry.onclick=()=>load(failedTarget);list.onscroll=()=>{if(!loading&&hasMore&&list.scrollHeight-list.scrollTop-list.clientHeight<160)load(offset)};
 await load();if(alive())search.focus();
}
const fileHistoryOpenCommand=openCommand;openCommand=async function(key){await fileHistoryOpenCommand(key);if(key!=='fileHistory')return;const form=panel.querySelector('form');if(form)form.onsubmit=event=>{event.preventDefault();showFileHistory(form.elements.name.value)}};
