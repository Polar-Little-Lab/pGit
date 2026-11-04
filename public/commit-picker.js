// Commit metadata and selection are shared by every command and worktree form.
// FrostSelect supplies the same searchable, keyboard-accessible presentation.
window.PgitCommitPicker=(()=>{
 function option(commit,refs=[]){
  const item=document.createElement('option');item.value=commit.hash;
  item.dataset.title=commit.title;item.dataset.selectedLabel=commit.hash.slice(0,8);
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
 function renderChoice(option){const text=el('span',undefined,'commit-option literal-data');text.append(el('strong',option.dataset.title||option.textContent),el('small',option.dataset.description||''));return text}
 function mountList(select,{label,onSelect}){
  select.dataset.inlineList='true';select.hidden=true;select.required=false;
  const element=el('div',undefined,'commit-list-picker'),search=el('input'),list=el('div',undefined,'commit-list-options');
  search.type='search';search.placeholder='메시지·작성자·해시 검색';search.setAttribute('aria-label',label+' 검색');list.setAttribute('role','listbox');list.setAttribute('aria-label',label);element.append(search,list);
  function refresh(){list.replaceChildren();const query=search.value.toLocaleLowerCase();for(const option of select.options){if(!option.value||!(option.textContent+' '+option.value).toLocaleLowerCase().includes(query))continue;
   const row=el('button');row.type='button';row.setAttribute('role','option');row.setAttribute('aria-selected',String(option.selected));row.disabled=option.disabled;row.append(renderChoice(option));if(option.selected)row.append(PgitIcons.icon('check'));row.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));onSelect?.();list.querySelector('[aria-selected=true]')?.focus()};list.append(row);
  }if(!list.children.length)list.append(el('p','일치하는 항목이 없습니다.','select-empty'))}
  list.onkeydown=e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();const rows=[...list.querySelectorAll('button:not(:disabled)')],index=rows.indexOf(document.activeElement);rows[e.key==='Home'?0:e.key==='End'?rows.length-1:(index+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length]?.focus()};
  search.oninput=()=>{select.value='';refresh();onSelect?.()};search.onkeydown=e=>{if(['ArrowDown','Enter'].includes(e.key)){e.preventDefault();const row=list.querySelector('button:not(:disabled)');if(e.key==='Enter')row?.click();else row?.focus()}};select.addEventListener('change',refresh);
  function setCommits(commits,snapshot){search.value='';populate(select,{...snapshot,history:commits},null);select.value='';refresh()}
  setCommits([], {history:[],refs:[],branches:[]});return {element,setCommits,refresh};
 }
 return {create,populate,select:selectCommit,renderChoice,mountList};
})();
