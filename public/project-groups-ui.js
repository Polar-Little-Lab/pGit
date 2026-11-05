// Group metadata belongs to the local workspace, never to Git configuration.
(()=>{
 const t=text=>window.PgitI18n?.t(text)||text;
 function button(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;return b}
 function refresh(){renderTabs();renderRecents();save()}
 window.renderGroupFilters=()=>{
  const host=byId('groupFilters');if(!host)return;host.replaceChildren();
  for(const [id,name] of [['all','전체'],['recent','최근 프로젝트'],['favorites','즐겨찾기'],...groups.map(g=>[g.id,g.name]),['none','그룹 없음']]){
   const b=button(t(name),()=>{groupFilter=id;renderRecents()});b.setAttribute('aria-pressed',String(groupFilter===id));const g=groups.find(g=>g.id===id);if(g)b.replaceChildren(groupBadge(g));host.append(b);
  }
 };
 // Home navigation includes assigned paths even after they leave the recent list.
 const collapsed=new Set();let openingGroup=false,groupResult=null;
 window.renderHomeGroups=()=>{
  const host=byId('homeGroups');host.replaceChildren();host.hidden=!groups.length||['none','recent','favorites'].includes(groupFilter);if(host.hidden)return;
  const query=byId('projectSearch').value.trim().toLocaleLowerCase();
  for(const group of groups){
   if(groupFilter!=='all'&&groupFilter!==group.id)continue;
   const paths=Object.keys(projectGroups).filter(path=>projectGroups[path]===group.id);
   const visible=paths.filter(path=>(path+' '+group.name).toLocaleLowerCase().includes(query));
   if(query&&!visible.length)continue;
   const section=document.createElement('div');section.className='home-group';section.dataset.groupId=group.id;section.style.setProperty('--group-color',PgitGroups.colors[group.color]);
   const header=document.createElement('div');header.className='home-group-header';
   const list=document.createElement('div');list.className='home-group-list';list.id='home-group-'+group.id;
   list.hidden=collapsed.has(group.id)&&!query;
   const toggle=button('',()=>{
    const expanded=toggle.getAttribute('aria-expanded')!=='true';
    if(expanded)collapsed.delete(group.id);else collapsed.add(group.id);
    toggle.setAttribute('aria-expanded',String(expanded));
    // Collapse is presentation only: do not replace the focused button or list.
    const from=list.hidden?0:list.getBoundingClientRect().height;
    list.getAnimations().forEach(animation=>animation.cancel());
    list.hidden=false;list.inert=!expanded;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){list.hidden=!expanded;return}
    const animation=list.animate([{height:from+'px',opacity:expanded?0.65:1},{height:(expanded?list.scrollHeight:0)+'px',opacity:expanded?1:0}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)'});
    animation.onfinish=()=>{list.hidden=!expanded;animation.cancel()};
   });
   toggle.className='home-group-toggle';toggle.setAttribute('aria-expanded',String(!list.hidden));toggle.setAttribute('aria-controls',list.id);
   const count=document.createElement('span');count.className='home-group-count';count.textContent=String(visible.length);
   toggle.append(PgitIcons.icon('right'),groupBadge(group),count);
   const open=button(t(query?'표시된 저장소 열기':'그룹 열기'),async()=>{
    if(openingGroup||opening)return;
    openingGroup=true;groupResult=null;renderHomeGroups();let completed=0;
    try{
     // Sequential opens preserve the shell's opening guard and duplicate-tab handling.
     for(const path of visible){if(!await openProject(path,'open',{},true))break;completed++}
     groupResult={id:group.id,completed,total:visible.length};
    }finally{openingGroup=false;renderHomeGroups()}
   });open.disabled=openingGroup||!visible.length;
   const edit=button('',()=>openProjectGroups(null,group.id));PgitIcons.label(edit,'settings');edit.className='home-group-edit icon-control';edit.setAttribute('aria-label',t('그룹 편집')+' · '+group.name);edit.title=t('그룹 편집');open.classList.add('home-group-open');header.append(toggle,open,edit);section.append(header,list);
   for(const path of visible){
    const row=button('',()=>missingPaths.has(path)?reopenMissing(path):openProject(path,'open',{},true));row.className='home-group-project literal-data';row.title=path;
    const name=document.createElement('strong');name.textContent=PgitPaths.basename(path);const location=document.createElement('small');location.textContent=path;const info=document.createElement('span');info.className='home-group-info';info.append(name,location);const branch=document.createElement('span');branch.className='home-group-branch';branch.append(PgitIcons.icon('branch'),document.createTextNode(recentDetails[path]?.branch||'—'));const status=document.createElement('span');status.className='home-group-state';status.textContent=missingPaths.has(path)?t('폴더 없음'):projects.some(p=>p.path===path)?t('열린 프로젝트'):'';row.append(PgitIcons.icon('folder'),info,branch,status);list.append(row);
   }
   if(!paths.length){const empty=document.createElement('p');empty.className='group-help';empty.textContent=t('그룹을 만든 뒤 프로젝트를 선택하세요.');list.append(empty)}
   if(groupResult?.id===group.id){const result=document.createElement('p');result.className='home-group-result';result.setAttribute('role','status');const label=document.createElement('span');label.textContent=t(groupResult.completed===groupResult.total?'그룹 열기 완료':'그룹 열기가 중단되었습니다.');result.append(label,document.createTextNode(' '+groupResult.completed+' / '+groupResult.total));section.append(result)}
   host.append(section);
  }
 };
 const dialog=document.createElement('dialog');dialog.id='projectGroupsDialog';
 const body=document.createElement('div');body.className='groups-body';
 PgitUI.dialogFrame(dialog,{title:'프로젝트 그룹',body,className:'dialog-heading',titleTag:'h2'});document.body.append(dialog);
 const intro=document.createElement('p');intro.textContent='색상과 아이콘으로 탭을 구분합니다. 그룹 설정은 이 컴퓨터에 저장됩니다.';
 const layout=document.createElement('div');layout.className='groups-layout';const sidebar=document.createElement('div');sidebar.className='groups-sidebar';const editor=document.createElement('div');editor.className='group-editor';layout.append(sidebar,editor);body.append(intro,layout);
 let selected=null,targetPath=null;
 const names={folder:'폴더',cloud:'클라우드',code:'코드',worktree:'워크트리',branch:'브랜치',lock:'잠금'};
 const colors={blue:'파랑',orange:'주황',teal:'청록',purple:'보라',rose:'분홍',slate:'회색'};
 function renderSidebar(){
  sidebar.replaceChildren();for(const g of groups){const b=button('',()=>{selected=g.id;render()});b.replaceChildren(groupBadge(g));b.setAttribute('aria-pressed',String(selected===g.id));sidebar.append(b)}
  const add=button(t('새 그룹'),()=>{selected=null;render();byId('groupName').focus()});PgitIcons.label(add,'plus',t('새 그룹'));add.disabled=groups.length>=30;sidebar.append(add);
 }
 function render(){
  renderSidebar();editor.replaceChildren();const group=groups.find(g=>g.id===selected);let color=group?.color||'blue',icon=group?.icon||'folder';
  const form=document.createElement('form');form.className='group-form';const name=document.createElement('input');name.id='groupName';name.maxLength=40;name.required=true;name.value=group?.name||'';name.placeholder='AWS';editor.append(form);form.append(PgitUI.labeledField(t('그룹 이름'),name));
  const preview=document.createElement('div');preview.className='group-preview';const updatePreview=()=>preview.replaceChildren(groupBadge({name:name.value.trim()||'AWS',color,icon}));name.oninput=updatePreview;
  const palette=document.createElement('div');palette.className='group-choices';const glyphs=document.createElement('div');glyphs.className='group-choices';
  function choices(){palette.replaceChildren();glyphs.replaceChildren();for(const [key,hex] of Object.entries(PgitGroups.colors)){const b=button('',()=>{color=key;choices();updatePreview()});b.className='group-swatch';b.style.setProperty('--swatch',hex);b.setAttribute('aria-label',t(colors[key]));b.setAttribute('aria-pressed',String(color===key));b.append(PgitIcons.icon(color===key?'check':'palette'));palette.append(b)}for(const key of PgitGroups.icons){const b=button('',()=>{icon=key;choices();updatePreview()});PgitIcons.label(b,key);b.setAttribute('aria-label',t(names[key]));b.setAttribute('aria-pressed',String(icon===key));glyphs.append(b)}}
  choices();updatePreview();for(const [label,control] of [['그룹 색상',palette],['그룹 아이콘',glyphs]]){control.setAttribute('role','group');control.setAttribute('aria-label',t(label));const caption=document.createElement('span');caption.textContent=t(label);form.append(caption,control)}form.append(preview);
  const error=document.createElement('p');error.setAttribute('role','alert');error.className='error';error.hidden=true;const actions=document.createElement('div');actions.className='group-form-actions';const submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent=t(group?'그룹 저장':'그룹 만들기');actions.append(submit);form.append(error,actions);
  form.onsubmit=event=>{event.preventDefault();const title=name.value.trim();if(!title)return name.focus();if(groups.some(g=>g.id!==selected&&g.name.toLocaleLowerCase()===title.toLocaleLowerCase())){error.hidden=false;error.textContent=t('같은 이름의 그룹이 있습니다.');return}if(group)Object.assign(group,{name:title,color,icon});else{selected=crypto.randomUUID();groups.push({id:selected,name:title,color,icon});if(targetPath)projectGroups[targetPath]=selected}refresh();render()};
  if(!group){const hint=document.createElement('p');hint.textContent=t('그룹을 만든 뒤 프로젝트를 선택하세요.');editor.append(hint);return}
  const deleteButton=button(t('그룹 삭제'),()=>{groups=groups.filter(g=>g.id!==selected);for(const [p,id] of Object.entries(projectGroups))if(id===selected)delete projectGroups[p];if(groupFilter===selected)groupFilter='all';selected=groups[0]?.id||null;refresh();render()});deleteButton.className='group-delete';actions.append(deleteButton);
  const note=document.createElement('p');note.textContent=t('그룹을 삭제해도 저장소와 파일은 유지됩니다.');note.className='group-help';editor.append(note);
  const heading=document.createElement('h3');heading.textContent=t('프로젝트 선택');const hint=document.createElement('p');hint.className='group-help';hint.textContent=t('체크하면 이 그룹으로 이동합니다. 변경은 즉시 저장됩니다.');const search=document.createElement('input');search.type='search';search.placeholder=t('프로젝트 검색');search.setAttribute('aria-label',t('프로젝트 검색'));const list=document.createElement('div');list.className='group-project-list';editor.append(heading,hint,search,list);
  const paths=[...new Set([targetPath,...projects.map(p=>p.path),...recents,...Object.keys(projectGroups)].filter(Boolean))];
  function renderPaths(){list.replaceChildren();for(const path of paths.filter(p=>p.toLocaleLowerCase().includes(search.value.toLocaleLowerCase()))){const input=document.createElement('input');input.type='checkbox';input.checked=projectGroups[path]===selected;input.setAttribute('aria-label',PgitPaths.basename(path));const row=document.createElement('label');row.className='group-project-row';row.classList.toggle('group-target',path===targetPath);const text=document.createElement('span');text.className='group-project-copy literal-data';const title=document.createElement('strong');title.textContent=PgitPaths.basename(path);const detail=document.createElement('small');detail.textContent=path;text.append(title,detail);row.append(input,text);const assigned=projectGroup(path);if(assigned)row.append(groupBadge(assigned));input.onchange=()=>{if(input.checked)projectGroups[path]=selected;else delete projectGroups[path];refresh();renderPaths();list.querySelectorAll('input')[paths.filter(p=>p.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())).indexOf(path)]?.focus()};list.append(row)}if(!list.children.length){const empty=document.createElement('p');empty.textContent=t('프로젝트를 열면 여기에 표시됩니다.');list.append(empty)}}
  search.oninput=renderPaths;renderPaths();
 }
 window.openProjectGroups=(path,groupId)=>{targetPath=groupId!==undefined?null:path||projects.find(p=>p.id===activeId)?.path||null;selected=groupId!==undefined?groupId:projectGroups[targetPath]||groups[0]?.id||null;render();if(!dialog.open)dialog.showModal();byId('groupName').focus()};
 PgitIcons.label(byId('createHomeGroup'),'plus','새 그룹');byId('createHomeGroup').onclick=()=>openProjectGroups(null,null);PgitIcons.label(byId('manageGroups'),'worktree');byId('manageGroups').onclick=()=>openProjectGroups();renderGroupFilters();renderHomeGroups();
})();
