(() => {
 const valid=['light','dark','system'];
 let theme=localStorage.getItem('pgit.theme')||'light';
 const system=matchMedia('(prefers-color-scheme: dark)');
 function setTheme(value,{persist=true}={}){
  theme=valid.includes(value)?value:'light';
  document.documentElement.dataset.theme=theme==='system'?(system.matches?'dark':'light'):theme;
  localStorage.setItem('pgit.theme',theme);
  document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)));
  if(parent===window){document.querySelectorAll('iframe.project-frame').forEach(f=>f.contentWindow.postMessage({source:'pgit-theme',theme},location.origin));if(persist&&typeof save==='function')save()}
 }
 window.PgitSettings={setTheme,get theme(){return theme}};
 system.addEventListener('change',()=>{if(theme==='system')setTheme(theme,{persist:false})});
 window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.source==='pgit-theme')setTheme(event.data.theme,{persist:false})});
 setTheme(theme,{persist:false});
 if(parent!==window){document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();parent.postMessage({source:'pgit-pane',type:'settings'},location.origin)}});return;}
 const page=document.createElement('section');page.id='settingsPage';page.hidden=true;page.setAttribute('aria-labelledby','settingsTitle');
 page.innerHTML=`<aside class="settings-nav"><button type="button" data-close-settings>작업 공간으로 돌아가기</button><h1 id="settingsTitle">설정</h1><nav aria-label="설정 항목"><button type="button" data-settings-section="appearance">모양</button><button type="button" data-settings-section="language">언어</button></nav></aside><div class="settings-content"><section data-settings-panel="appearance" aria-labelledby="appearanceTitle"><h2 id="appearanceTitle" tabindex="-1">모양</h2><h3>테마</h3><div class="theme-gallery" role="group" aria-label="테마"></div></section><section data-settings-panel="language" aria-labelledby="languageTitle" hidden><h2 id="languageTitle" tabindex="-1">언어</h2><div class="language-options" role="group" aria-label="언어"><button type="button" class="literal-data" data-language-choice="ko"><strong>한국어</strong><span>Korean</span></button><button type="button" class="literal-data" data-language-choice="en"><strong>English</strong><span>영어</span></button></div></section></div>`;
 // Cards are data-driven so further themes do not turn settings into a larger modal.
 for(const [id,name] of [['light','Frost'],['dark','Polar Night'],['system','시스템 설정 사용']]){
  const card=document.createElement('button');card.type='button';card.className='theme-card';card.dataset.themeChoice=id;
  const preview=document.createElement('span');preview.className='theme-preview preview-'+id;preview.setAttribute('aria-hidden','true');preview.innerHTML='<span class="preview-tabs"></span><span class="preview-sidebar"><i></i><i></i><i></i></span><span class="preview-graph"><i></i><i></i><i></i><i></i></span><span class="preview-details"><i></i><i></i></span>';
  const label=document.createElement('span');label.className='theme-card-label';const text=document.createElement('strong');text.textContent=name;if(id!=='system')text.className='literal-data';label.append(text,PgitIcons.icon('check'));card.append(preview,label);card.onclick=()=>setTheme(id);page.querySelector('.theme-gallery').append(card);
 }
 const container=document.querySelector('#projectPanels')||document.body;container.append(page);
 const siblings=new Map();let previousFocus=null,previousHash='';
 function sync(){page.querySelectorAll('[data-language-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.languageChoice===window.PgitI18n.language)));page.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)))}
 function show(section='appearance',focus=true){
  if(page.hidden){previousFocus=document.activeElement;for(const child of container.children){if(child===page||child.tagName==='SCRIPT'||child.tagName==='DIALOG'||child.matches('header'))continue;siblings.set(child,child.inert);child.inert=true}}
  document.body.dataset.settings='open';page.hidden=false;button.setAttribute('aria-pressed','true');
  page.querySelectorAll('[data-settings-panel]').forEach(panel=>panel.hidden=panel.dataset.settingsPanel!==section);
  page.querySelectorAll('[data-settings-section]').forEach(link=>link.setAttribute('aria-current',link.dataset.settingsSection===section?'page':'false'));
  sync();if(focus)page.querySelector(`[data-settings-panel="${section}"] h2`).focus();
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
 for(const item of page.querySelectorAll('[data-settings-section]')){PgitIcons.label(item,item.dataset.settingsSection==='appearance'?'palette':'language',item.textContent);item.onclick=()=>open(item.dataset.settingsSection)}
 page.querySelectorAll('[data-language-choice]').forEach(b=>b.onclick=()=>{window.PgitI18n.setLanguage(b.dataset.languageChoice);sync()});
 const button=document.createElement('button');button.type='button';button.className='settings-button';button.setAttribute('aria-pressed','false');PgitIcons.label(button,'settings','설정');button.onclick=()=>page.hidden?open():close();
 (document.querySelector('.project-bar')||document.querySelector('header'))?.append(button);
 Object.assign(window.PgitSettings,{open,close});
 document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();open()}else if(event.key==='Escape'&&!page.hidden){event.preventDefault();close()}});
 window.addEventListener('popstate',()=>{if(location.hash.startsWith('#settings/'))show(location.hash.endsWith('/language')?'language':'appearance');else close()});
 sync();if(location.hash.startsWith('#settings/'))show(location.hash.endsWith('/language')?'language':'appearance',false);
})();
