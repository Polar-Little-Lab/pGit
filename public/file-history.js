// A bounded, searchable history view. Queries run against Git, not just loaded rows.
async function showFileHistory(name){
 if(!state||working)return;panel.close();const root=state.root,body=advancedFrame('파일 이력','list');advancedDialog.classList.add('file-history-dialog');body.classList.add('file-history-view');
 advancedDialog.addEventListener('close',()=>{if(!advancedDialog.open)advancedDialog.classList.remove('file-history-dialog');clearTimeout(timer)},{once:true});
 PgitCommandHelp.mount(body,'fileHistory');body.append(el('div',name,'file-history-path literal-data'));
 const toolbar=el('form',undefined,'file-history-toolbar'),search=el('input'),run=el('button','검색'),refresh=el('button','새로고침');search.type='search';search.maxLength=256;search.placeholder='이 파일의 전체 이력에서 커밋 메시지 검색';search.setAttribute('aria-label','커밋 메시지 검색');run.type='submit';refresh.type='button';toolbar.append(search,run,refresh);body.append(toolbar);
 const list=el('div',undefined,'ui-item-list file-history-list');list.setAttribute('aria-label','파일 이력');const footer=el('div',undefined,'file-history-footer'),previous=el('button','이전'),status=el('span'),next=el('button','다음');previous.type=next.type='button';status.setAttribute('role','status');footer.append(previous,status,next);body.append(list,footer);
 let revision=null,offset=0,query='',version=0,timer;const alive=()=>body.isConnected&&advancedDialog.open&&state?.root===root;
 async function load(target=0,reset=false){
  const request=++version;if(reset)revision=null;previous.disabled=next.disabled=true;list.setAttribute('aria-busy','true');list.replaceChildren(PgitUI.message('불러오는 중…'));
  try{const result=await api('fileHistoryPage',{name,query,offset:target,...(revision?{revision}:{})});if(!alive()||request!==version)return;revision=result.revision;offset=result.offset;list.replaceChildren();
   for(const commit of result.commits){const row=PgitUI.listItem({title:commit.title,meta:commit.author});const title=el('button',commit.title,'file-history-open literal-data');title.type='button';title.title=commit.title;title.onclick=()=>{advancedDialog.close();tab('history');selectCommit(commit)};row.main.querySelector('strong').replaceWith(title);
    const meta=row.main.querySelector('.ui-list-meta'),date=el('time',new Date(commit.date).toLocaleDateString(document.documentElement.lang||undefined));date.dateTime=commit.date;date.title=new Date(commit.date).toLocaleString();meta.append(el('span',' · '),date,el('code',commit.hash.slice(0,8),'literal-data'));list.append(row.element);
   }
   if(!result.commits.length)list.append(PgitUI.message(query?'일치하는 항목이 없습니다.':'표시할 항목이 없습니다.'));
   status.replaceChildren(el('span',String(offset/result.pageSize+1),'literal-data'),document.createTextNode(' · '),el('span','커밋'),document.createTextNode(' '+result.commits.length));previous.disabled=offset===0;next.disabled=!result.hasMore;list.scrollTop=0;
  }catch(error){if(alive()&&request===version){list.replaceChildren(PgitUI.message(error.message,{error:true}));status.textContent='';previous.disabled=next.disabled=true}}
  finally{if(alive()&&request===version)list.setAttribute('aria-busy','false')}
 }
 function applySearch(){clearTimeout(timer);query=search.value.trim();load(0)}
 toolbar.onsubmit=event=>{event.preventDefault();applySearch()};search.oninput=()=>{clearTimeout(timer);++version;previous.disabled=next.disabled=true;timer=setTimeout(applySearch,350)};
 refresh.onclick=()=>{clearTimeout(timer);query=search.value.trim();load(0,true)};previous.onclick=()=>load(Math.max(0,offset-50));next.onclick=()=>load(offset+50);
 await load();if(alive())search.focus();
}
const fileHistoryOpenCommand=openCommand;openCommand=async function(key){await fileHistoryOpenCommand(key);if(key!=='fileHistory')return;const form=panel.querySelector('form');if(form)form.onsubmit=event=>{event.preventDefault();showFileHistory(form.elements.name.value)}};
