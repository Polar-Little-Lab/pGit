(() => {
 const valid=[...PgitThemes.map(theme=>theme.id),'system'];
 let theme=localStorage.getItem('pgit.theme')||'light';
 const system=matchMedia('(prefers-color-scheme: dark)');
 function setTheme(value,{persist=true}={}){
  theme=valid.includes(value)?value:'light';
  const palette=PgitThemes.find(item=>item.id===(theme==='system'?(system.matches?'dark':'light'):theme));
  const html=document.documentElement;html.dataset.theme=palette.id;html.dataset.appearance=palette.appearance;
  for(const [key,value] of Object.entries(palette.colors))html.style.setProperty('--polar-'+key,value);
  for(const [key,value] of Object.entries({bg:palette.colors.surface,hover:palette.colors.soft,selected:palette.colors.selected,'selected-border':palette.colors.accent,border:palette.colors.border}))html.style.setProperty('--control-'+key,value);
  html.style.setProperty('--polar-danger',palette.appearance==='dark'?'#ed9b96':'#b44848');
  localStorage.setItem('pgit.theme',theme);
  document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)));
  if(parent===window){document.querySelectorAll('iframe.project-frame').forEach(f=>f.contentWindow.postMessage({source:'pgit-theme',theme},location.origin));if(persist&&typeof save==='function')save()}
 }
 const typographyDefaults={uiSize:12,codeSize:12,font:'system',spacing:1.833};
 const typographyChoices={uiSize:[12,14],codeSize:[12,14,16,18,20],font:['system','menlo','monaco','consolas'],spacing:[1.5,1.833,2.2]};
 const codeFonts={system:'ui-monospace, SFMono-Regular, Menlo, monospace',menlo:'Menlo, ui-monospace, monospace',monaco:'Monaco, ui-monospace, monospace',consolas:'Consolas, Menlo, monospace'};
 let typography={...typographyDefaults};try{typography={...typography,...JSON.parse(localStorage.getItem('pgit.typography')||'{}')}}catch{}
 function setTypography(value,{persist=true}={}){
  if(value.uiSize===16)value={...value,uiSize:14};delete typography.zoom;
  for(const key of Object.keys(typographyDefaults))typography[key]=typographyChoices[key].includes(value[key])?value[key]:typographyDefaults[key];
  if(parent===window)localStorage.setItem('pgit.typography',JSON.stringify(typography));
  const html=document.documentElement;html.dataset.uiSize=String(typography.uiSize);
  html.style.setProperty('--ui-font-size',typography.uiSize+'px');html.style.setProperty('--code-font-size',typography.codeSize+'px');html.style.setProperty('--code-font',codeFonts[typography.font]);html.style.setProperty('--code-row-height',Math.round(typography.codeSize*typography.spacing)+'px');
  if(parent===window){document.body.style.removeProperty('zoom');document.body.style.removeProperty('height');document.querySelectorAll('iframe.project-frame').forEach(f=>f.contentWindow.postMessage({source:'pgit-typography',value:typography},location.origin))}
  document.querySelectorAll('[data-type-key]').forEach(b=>b.setAttribute('aria-pressed',String(String(typography[b.dataset.typeKey])===b.dataset.typeValue)));
  document.querySelectorAll('.idea-diff').forEach(node=>node.pgitTypographyRefresh?.());
  window.dispatchEvent(new Event('resize'));if(persist&&parent===window&&typeof save==='function')save();
 }
 window.PgitSettings={setTheme,setTypography,get typography(){return {...typography}},get theme(){return theme}};
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.source==='pgit-typography')setTypography(event.data.value)});
 setTypography(typography,{persist:false});

 system.addEventListener('change',()=>{if(theme==='system')setTheme(theme,{persist:false})});
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.source==='pgit-theme')setTheme(event.data.theme,{persist:false})});
 setTheme(theme,{persist:false});
 if(parent!==window){document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();parent.postMessage({source:'pgit-pane',type:'settings'},location.origin)}});return;}
 const page=document.createElement('section');page.id='settingsPage';page.hidden=true;page.setAttribute('aria-labelledby','settingsTitle');
 page.innerHTML=`<aside class="settings-nav"><button type="button" data-close-settings>작업 공간으로 돌아가기</button><h1 id="settingsTitle">설정</h1><nav aria-label="설정 항목"><button type="button" data-settings-section="appearance">모양</button><button type="button" data-settings-section="typography">글꼴 및 크기</button><button type="button" data-settings-section="language">언어</button><button type="button" data-settings-section="sync">동기화</button></nav></aside><div class="settings-content"><section data-settings-panel="appearance" aria-labelledby="appearanceTitle"><h2 id="appearanceTitle" tabindex="-1">모양</h2><h3>테마</h3><div class="theme-gallery" role="group" aria-label="테마"></div></section><section data-settings-panel="language" aria-labelledby="languageTitle" hidden><h2 id="languageTitle" tabindex="-1">언어</h2><div class="language-options" role="group" aria-label="언어"></div></section><section data-settings-panel="sync" aria-labelledby="syncTitle" hidden><h2 id="syncTitle" tabindex="-1">동기화</h2><h3>자동 Fetch</h3><div class="fetch-options" role="group" aria-label="자동 Fetch"></div><p class="settings-help">활성 프로젝트의 원격 브랜치와 이력을 갱신합니다. Pull이나 병합은 실행하지 않습니다.</p></section></div>`;
 for(const {id,name,english} of PgitI18n.languages){
  const choice=document.createElement('button');choice.type='button';choice.className='literal-data';choice.dataset.languageChoice=id;
  const native=document.createElement('strong');native.textContent=name;native.lang=id;
  const subtitle=document.createElement('span');subtitle.textContent=english;subtitle.lang='en';
  choice.append(native,subtitle);page.querySelector('.language-options').append(choice);
 }
 for(const [value,label] of [[0,'끄기'],[5,'5분'],[10,'10분'],[30,'30분']]){const option=document.createElement('button');option.type='button';option.dataset.fetchMinutes=value;option.textContent=label;option.onclick=()=>{localStorage.setItem('pgit.autoFetchMinutes',String(value));sync()};page.querySelector('.fetch-options').append(option)}
 // Cards are data-driven so further themes do not turn settings into a larger modal.
 for(const {id,name,colors} of [...PgitThemes,{id:'system',name:'시스템 설정 사용'}]){
  const card=document.createElement('button');card.type='button';card.className='theme-card';card.dataset.themeChoice=id;
  const preview=document.createElement('span');preview.className='theme-preview preview-'+id;preview.setAttribute('aria-hidden','true');if(colors){for(const [key,color] of Object.entries({bg:colors.canvas,panel:colors.soft,line:colors.border,accent:colors.accent}))preview.style.setProperty('--preview-'+key,color)}preview.innerHTML='<span class="preview-tabs"></span><span class="preview-sidebar"><i></i><i></i><i></i></span><span class="preview-graph"><i></i><i></i><i></i><i></i></span><span class="preview-details"><i></i><i></i></span>';
  const label=document.createElement('span');label.className='theme-card-label';const text=document.createElement('strong');text.textContent=name;if(id!=='system')text.className='literal-data';label.append(text,PgitIcons.icon('check'));card.append(preview,label);card.onclick=()=>setTheme(id);page.querySelector('.theme-gallery').append(card);
 }
 const typographyPanel=document.createElement('section');typographyPanel.className='typography-settings';typographyPanel.dataset.settingsPanel='typography';typographyPanel.setAttribute('aria-labelledby','typographyTitle');
 const typographyTitle=document.createElement('h2');typographyTitle.id='typographyTitle';typographyTitle.tabIndex=-1;typographyTitle.textContent='글꼴 및 크기';typographyPanel.append(typographyTitle);
 for(const [key,label] of [['uiSize','UI 글자 크기'],['codeSize','코드 글자 크기'],['font','코드 글꼴'],['spacing','코드 줄 간격']]){
  const row=document.createElement('div');row.className='typography-row';const title=document.createElement('span');title.textContent=label;const options=document.createElement('div');options.className='typography-options';options.setAttribute('role','group');options.setAttribute('aria-label',label);
  for(const value of typographyChoices[key]){const b=document.createElement('button');b.type='button';b.dataset.typeKey=key;b.dataset.typeValue=value;b.textContent=key==='uiSize'?(value===12?'기본':'크게'):key==='font'?({system:'시스템 고정폭',menlo:'Menlo',monaco:'Monaco',consolas:'Consolas'}[value]):key==='spacing'?({1.5:'촘촘하게',1.833:'기본',2.2:'넓게'}[value]):value+(key==='zoom'?'%':'px');b.onclick=()=>setTypography({...typography,[key]:value});options.append(b)}row.append(title,options);typographyPanel.append(row);
 }
 const preview=document.createElement('pre');preview.className='typography-preview literal-data';preview.textContent='// pGit · 코드 미리보기 · Preview\nconst branch = "main";\n+ const message = "변경 사항 · 日本語";';typographyPanel.append(preview);
 const resetType=document.createElement('button');resetType.type='button';resetType.textContent='글꼴 및 크기 초기화';resetType.onclick=()=>setTypography(typographyDefaults);typographyPanel.append(resetType);page.querySelector('[data-settings-panel=appearance]').after(typographyPanel);
 const container=document.querySelector('#projectPanels')||document.body;container.append(page);setTypography(typography,{persist:false});
 const siblings=new Map();let previousFocus=null,previousHash='';
 function sync(){const minutes=localStorage.getItem('pgit.autoFetchMinutes')??'10';page.querySelectorAll('[data-fetch-minutes]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fetchMinutes===minutes)));page.querySelectorAll('[data-language-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.languageChoice===window.PgitI18n.language)));page.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)))}
 function show(section='appearance',focus=true){
  if(page.hidden){previousFocus=document.activeElement;for(const child of container.children){if(child===page||child.tagName==='SCRIPT'||child.tagName==='DIALOG'||child.matches('header'))continue;siblings.set(child,child.inert);child.inert=true}}
  document.body.dataset.settings='open';page.hidden=false;button.setAttribute('aria-pressed','true');
  page.querySelectorAll('[data-settings-panel]').forEach(panel=>panel.hidden=false);
  page.querySelectorAll('[data-settings-section]').forEach(link=>link.setAttribute('aria-current',link.dataset.settingsSection===section?'page':'false'));
  sync();const target=page.querySelector(`[data-settings-panel="${section}"]`);target.scrollIntoView({block:'start'});if(focus)target.querySelector('h2').focus({preventScroll:true});
 }
 function close({focus=true}={}){
  if(page.hidden)return;
  page.hidden=true;delete document.body.dataset.settings;button.setAttribute('aria-pressed','false');
  for(const [element,inert] of siblings)element.inert=inert;siblings.clear();
  history.replaceState(null,'',location.pathname+location.search+previousHash);
  if(focus)(previousFocus?.isConnected?previousFocus:button).focus();
  document.querySelector('iframe.project-frame:not([hidden])')?.contentWindow.postMessage({source:'pgit-shell',type:'active'},location.origin);
 }
 function open(section='appearance'){
  if(page.hidden){previousHash=location.hash.startsWith('#settings/')?'':location.hash;history.pushState({settings:true},'',`#settings/${section}`)}
  else history.replaceState({settings:true},'',`#settings/${section}`);
  show(section);
 }
 page.querySelector('[data-close-settings]').onclick=()=>close();
 PgitIcons.label(page.querySelector('[data-close-settings]'),'back','작업 공간으로 돌아가기');
 for(const item of page.querySelectorAll('[data-settings-section]')){PgitIcons.label(item,item.dataset.settingsSection==='appearance'?'palette':item.dataset.settingsSection==='sync'?'fetch':item.dataset.settingsSection==='typography'?'typography':'language',item.textContent);item.onclick=()=>open(item.dataset.settingsSection)}
 page.querySelectorAll('[data-language-choice]').forEach(b=>b.onclick=()=>{window.PgitI18n.setLanguage(b.dataset.languageChoice);sync()});
 const button=document.createElement('button');button.type='button';button.className='settings-button';button.setAttribute('aria-pressed','false');PgitIcons.label(button,'settings');button.setAttribute('aria-label','설정');button.dataset.tooltip='설정 · ⌘/Ctrl+,';button.onclick=()=>page.hidden?open():close();
 (document.querySelector('.project-bar')||document.querySelector('header'))?.append(button);
 Object.assign(window.PgitSettings,{open,close});
 document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();open()}else if(event.key==='Escape'&&!page.hidden){event.preventDefault();close()}});
 window.addEventListener('popstate',()=>{if(location.hash.startsWith('#settings/'))show(['appearance','typography','language','sync'].find(section=>location.hash==='#settings/'+section)||'appearance');else close()});
 sync();if(location.hash.startsWith('#settings/'))show(['appearance','typography','language','sync'].find(section=>location.hash==='#settings/'+section)||'appearance',false);
})();
