// Bundled, allowlisted brand assets only; no external requests or user-supplied markup.
(()=>{
 const catalog=PgitGroupCatalog,byId=new Map(catalog.map(x=>[x.id,x]));
 window.groupIcon=key=>{if(!byId.has(key))return PgitIcons.icon(key);const img=document.createElement('img');const entry=byId.get(key);img.src='/group-icons/'+key+'.'+(entry.format||'svg');img.alt='';img.className='group-brand-icon';if(entry.backdrop){img.classList.add('brand-on-dark');if(typeof entry.backdrop==='string')img.style.backgroundColor=entry.backdrop;}img.loading='lazy';return img};
 window.createGroupIconPicker=(selected,onSelect)=>{
  const host=document.createElement('div');host.className='group-icon-picker';const search=document.createElement('input');search.type='search';search.placeholder='아이콘 검색 · AWS, EC2, 하나은행, Docker';search.setAttribute('aria-label','아이콘 검색');
  const filters=document.createElement('div');filters.className='icon-category-filters';let category='Recommended';const grid=document.createElement('div');grid.className='group-icon-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','그룹 아이콘');const status=document.createElement('small');status.setAttribute('role','status');
  const base=PgitGroups.icons.filter(id=>!byId.has(id)).map(id=>({id,name:({folder:'폴더',cloud:'클라우드',code:'코드',worktree:'워크트리',branch:'브랜치',lock:'잠금'})[id]||id,category:'General',keywords:''}));
  const all=[...base,...catalog],recommended=new Set(['aws-aws-cloud-logo','aws-amazon-ec2','aws-amazon-simple-storage-service','aws-aws-lambda','hana-bank','finance-woori','finance-bidv','finance-gln','brand-github','brand-docker','brand-kubernetes','brand-spring','brand-react','brand-java','brand-terraform','folder','cloud','code']);
  function draw(){filters.replaceChildren();for(const [id,label] of [['Recommended','추천'],['AWS','AWS'],['Finance','금융·결제'],['Development','개발 도구'],['General','기본'],['All','전체']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(category===id));b.onclick=()=>{category=id;draw()};filters.append(b)}
   grid.replaceChildren();const q=search.value.trim().toLocaleLowerCase();const entries=all.filter(x=>(q||category==='All'||x.category===category||(category==='Recommended'&&(recommended.has(x.id)||x.id===selected)))&&(!q||[x.name,x.id,x.keywords].join(' ').toLocaleLowerCase().includes(q)));status.textContent=entries.length+'개';
   for(const entry of entries){const b=document.createElement('button');b.type='button';b.className='group-icon-option';b.title=entry.name;b.setAttribute('aria-label',entry.name);b.setAttribute('aria-pressed',String(selected===entry.id));b.append(groupIcon(entry.id));const text=document.createElement('span');text.textContent=entry.name;b.append(text);b.onclick=()=>{selected=entry.id;for(const el of grid.children)el.setAttribute('aria-pressed',String(el===b));onSelect(selected)};grid.append(b)}
   if(!entries.length){const empty=document.createElement('p');empty.textContent='검색 결과가 없습니다.';grid.append(empty)}
  }search.oninput=draw;host.append(search,filters,status,grid);draw();return host;
 };
})();
