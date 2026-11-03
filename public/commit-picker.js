// Commit metadata and selection are shared by every command and worktree form.
// FrostSelect supplies the same searchable, keyboard-accessible presentation.
window.PgitCommitPicker=(()=>{
 function option(commit,refs=[]){
  const item=document.createElement('option');item.value=commit.hash;
  item.dataset.title=commit.title;
  item.dataset.description=[commit.hash.slice(0,8),commit.author,commit.date.slice(0,10),...refs].filter(Boolean).join(' · ');
  item.textContent=commit.title+' · '+item.dataset.description;return item;
 }
 function create(snapshot,selected=snapshot.head){const select=document.createElement('select');populate(select,snapshot,selected);return select}
 function populate(select,snapshot,selected=snapshot.head){
  if(/^HEAD(?:~\d+)?$/.test(selected||'')){
   let commit=snapshot.history.find(c=>c.hash===snapshot.head);
   for(let remaining=Number(selected.split('~')[1]||0);remaining>0;remaining--){const parent=snapshot.history.find(c=>c.hash===commit?.parents?.[0]);if(!parent)break;commit=parent}
   selected=commit?.hash;
  }
  select.dataset.commitPicker='true';select.replaceChildren();
  for(const commit of [...snapshot.history].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))){
   const refs=[...(snapshot.refs||[]),...(snapshot.branches||[])].filter(r=>r.hash===commit.hash).map(r=>r.name.replace(/^refs\/(heads|remotes|tags)\//,''));
   select.append(option(commit,[...new Set(refs)]));
  }
  if([...select.options].some(o=>o.value===selected))select.value=selected;
  select.disabled=!select.options.length;
  if(select.disabled){const empty=document.createElement('option');empty.textContent='항목 없음';empty.value='';select.append(empty)}
  select.dispatchEvent(new Event('change',{bubbles:true}));return select;
 }
 async function selectCommit(select,ref){
  let item=[...select.options].find(o=>o.value===ref);
  if(!item){
   const submit=select.form?.querySelector('[type=submit]'),wasDisabled=submit?.disabled;
   select.value='';select.disabled=true;select.dispatchEvent(new Event('change',{bubbles:true}));if(submit)submit.disabled=true;
   try{const commit=await api('commitChoice',{ref});item=[...select.options].find(o=>o.value===commit.hash);if(!item){item=option(commit);select.prepend(item)}}
   finally{select.disabled=false;if(submit)submit.disabled=wasDisabled;select.dispatchEvent(new Event('change',{bubbles:true}))}
  }
  select.disabled=false;select.value=item.value;select.dispatchEvent(new Event('change',{bubbles:true}));
 }
 return {create,populate,select:selectCommit};
})();
