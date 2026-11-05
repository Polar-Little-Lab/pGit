// A searchable switcher complements + without changing the new-tab action.
(()=>{
 const trigger=byId('showTabs'),popup=document.createElement('div');popup.id='tabPicker';popup.popover='auto';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','열린 탭 검색');
 const search=document.createElement('input');search.type='search';search.placeholder='프로젝트 또는 그룹 검색';search.setAttribute('aria-label','프로젝트 또는 그룹 검색');
 const list=document.createElement('div');list.className='tab-picker-list';popup.append(search,list);document.body.append(popup);trigger.setAttribute('aria-controls',popup.id);PgitIcons.label(trigger,'chevronDown');
 function position(){const r=trigger.getBoundingClientRect();popup.style.top=(r.bottom+8)+'px';popup.style.left=Math.max(8,Math.min(r.right-360,innerWidth-368))+'px'}
 function draw(){
  const all=projects.filter(p=>!p.pendingStartId);trigger.disabled=!all.length;
  if(!popup.matches(':popover-open'))return;
  const focused=document.activeElement?.dataset.tabId;const q=search.value.trim().toLocaleLowerCase();list.replaceChildren();
  const filtered=all.filter(p=>[p.name,p.path,projectGroup(p.path)?.name].join(' ').toLocaleLowerCase().includes(q));
  const buckets=new Map();for(const p of filtered){const g=projectGroup(p.path),id=g?.id||'';if(!buckets.has(id))buckets.set(id,{group:g,items:[]});buckets.get(id).items.push(p)}
  for(const {group,items} of buckets.values()){
   const heading=document.createElement('div');heading.className='tab-picker-heading';if(group)heading.append(groupBadge(group));else heading.textContent=PgitI18n.t('그룹 없음');list.append(heading);
   for(const p of items){const b=document.createElement('button');b.type='button';b.className='tab-picker-item';b.dataset.tabId=p.id;b.setAttribute('aria-current',String(p.id===activeId));const text=document.createElement('span');text.className='literal-data';const name=document.createElement('strong');name.textContent=p.name;const path=document.createElement('small');path.textContent=p.path||PgitI18n.t('새 탭');text.append(name,path);b.append(PgitIcons.icon(p.start?'plus':'branch'),text);if(p.id===activeId)b.append(PgitIcons.icon('check'));b.onclick=()=>{popup.hidePopover();selectProject(p.id);byId('tab-'+p.id)?.focus()};list.append(b)}
  }
  if(!filtered.length){const empty=document.createElement('p');empty.textContent=PgitI18n.t('검색 결과가 없습니다.');list.append(empty)}if(focused)[...list.querySelectorAll('button')].find(b=>b.dataset.tabId===focused)?.focus({preventScroll:true});position();
 }
 trigger.onclick=()=>{if(popup.matches(':popover-open'))popup.hidePopover();else{search.value='';popup.showPopover();draw();search.focus()}};
 popup.addEventListener('toggle',event=>{trigger.setAttribute('aria-expanded',String(event.newState==='open'))});
 popup.addEventListener('keydown',event=>{const items=[...list.querySelectorAll('button')],index=items.indexOf(document.activeElement);if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();items[(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus()}else if(event.key==='Enter'&&event.target===search){event.preventDefault();items[0]?.click()}else if(event.key==='Escape'){event.preventDefault();popup.hidePopover();trigger.focus()}});
 search.oninput=draw;window.renderTabPicker=draw;window.addEventListener('resize',()=>{if(popup.matches(':popover-open'))position()});draw();
})();
