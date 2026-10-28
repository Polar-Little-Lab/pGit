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
 if(parent!==window)return;
 const dialog=document.createElement('dialog');dialog.id='settingsDialog';dialog.setAttribute('aria-labelledby','settingsTitle');
 dialog.innerHTML='<div class="bar"><strong id="settingsTitle">설정</strong><button type="button" data-close-settings>닫기</button></div><div class="body settings-body"><section><h3>모양</h3><div class="ui-segmented" role="group" aria-label="모양"><button type="button" data-theme-choice="light">밝게</button><button type="button" data-theme-choice="dark">어둡게</button><button type="button" data-theme-choice="system">시스템</button></div></section><section><h3>언어</h3><div class="ui-segmented" role="group" aria-label="언어"><button type="button" class="literal-data" data-language-choice="ko">한국어</button><button type="button" class="literal-data" data-language-choice="en">English</button></div></section></div>';
 document.body.append(dialog);
 function sync(){dialog.querySelectorAll('[data-language-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.languageChoice===window.PgitI18n.language)));dialog.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)))}
 dialog.querySelector('[data-close-settings]').onclick=()=>dialog.close();
 dialog.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>setTheme(b.dataset.themeChoice));
 dialog.querySelectorAll('[data-language-choice]').forEach(b=>b.onclick=()=>{window.PgitI18n.setLanguage(b.dataset.languageChoice);sync()});
 const button=document.createElement('button');button.type='button';button.className='settings-button';button.textContent='설정';button.onclick=()=>{sync();dialog.showModal()};
 (document.querySelector('.project-bar')||document.querySelector('header'))?.append(button);
 document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();sync();if(!dialog.open)dialog.showModal()}});
 sync();
})();
