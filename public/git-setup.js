// Dependency setup only checks availability; never retry repository mutations here.
window.PgitGitSetup=(()=>{
 const t=text=>window.PgitI18n?.t(text)||text;
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=t(text);if(cls)e.className=cls;return e};
 let dialog,card;
 function clear(){card?.remove();card=null;const inline=document.getElementById('projectGitSetup');if(inline)inline.hidden=true;const project=document.getElementById('projectDialog');if(project)delete project.dataset.gitSetup}
 function show(error={}){
  if(parent!==window){parent.postMessage({source:'pgit-pane',type:'git-unavailable',code:'GIT_UNAVAILABLE',reason:error.reason,platform:error.platform},location.origin);return}
  const inline=document.querySelector('#projectDialog[open] #projectGitSetup');
  if(card?.isConnected&&(inline?inline.contains(card):dialog?.open))return;
  clear();const current=card=make('section',null,'git-setup-card');
  const platform=error.platform||window.pgitDesktop?.platform,platformName=platform==='win32'?'Windows':platform==='darwin'?'macOS':platform==='linux'?'Linux':'';
  const header=make('div',null,'git-setup-heading'),symbol=make('span',null,'git-setup-symbol');symbol.append(PgitIcons.icon('branch'));const copy=make('div');const title=make('h3',error.reason==='permission'?'Git 실행 권한을 확인해 주세요':error.reason==='developer-tools'?'macOS 개발자 도구를 확인해 주세요':'먼저 Git을 준비해 주세요');copy.append(title,make('p','pGit이 커밋과 브랜치를 다루는 데 필요한 도구입니다.'));header.append(symbol,copy);
  const reason=make('p',error.reason==='permission'?'설치된 Git을 실행할 권한이 없습니다. 실행 권한을 조정한 뒤 다시 확인하세요.':error.reason==='developer-tools'?'macOS 개발자 도구 설정이 완료되지 않았습니다. 설치 또는 초기 설정을 마친 뒤 확인하세요.':'Git이 설치되지 않았거나 pGit에서 찾을 수 없습니다.','git-setup-reason');reason.setAttribute('role','status');
  const steps=make('div',null,'git-setup-steps');
  const row=(number,label,description)=>{const host=make('div',null,'git-setup-step'),badge=make('span',number,'git-setup-number'),text=make('div',null,'git-setup-step-copy');text.append(make('strong',label),make('p',description));host.append(badge,text);steps.append(host);return host};
  const installRow=row('1','Git 설치하기',platformName?platformName+'용 공식 안내를 새 창에서 엽니다.':'운영체제에 맞는 공식 설치 안내를 엽니다.');const install=make('a','설치 안내 열기','git-setup-install');PgitUI.externalLink(install,'https://git-scm.com/install/');const external=PgitIcons.icon('external');external.setAttribute('aria-hidden','true');install.append(external);installRow.append(install);
  const checkRow=row('2','설치가 끝났나요?','이미 설치했다면 바로 확인할 수 있습니다.');const check=make('button','설치 확인','git-setup-check primary');check.type='button';checkRow.append(check);
  const status=make('div',null,'git-setup-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;checkRow.append(status);
  const help=make('details',null,'git-setup-help');help.append(make('summary','설치했는데도 찾지 못하나요?'),make('p','pGit을 완전히 종료한 뒤 다시 열어주세요. 설치 중 바뀐 실행 경로가 현재 앱에는 반영되지 않을 수 있습니다.'),make('p','계속 문제가 생기면 터미널에서 git --version이 실행되는지 확인하세요. 실행되지 않으면 Git 설치와 실행 경로를 확인해야 합니다.'));
  const note=make('p',inline?'입력한 저장소 주소와 폴더 경로는 그대로 유지됩니다.':'확인 후 이 창을 닫고 원래 작업을 다시 실행하세요.','git-setup-context');
  const done=make('button',inline?'입력한 작업으로 돌아가기':'완료','git-setup-done primary');done.type='button';done.hidden=true;done.onclick=()=>{if(inline){clear();document.getElementById('submitProject')?.focus()}else dialog.close()};
  card.append(header,reason,steps,help,note,done);
  check.onclick=async()=>{
   if(check.disabled)return;check.disabled=true;check.textContent=t('확인 중…');checkRow.setAttribute('aria-busy','true');status.hidden=false;status.dataset.state='checking';status.textContent=t('설치된 Git을 확인하고 있습니다.');
   try{
    const r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json','X-pGit-Token':typeof shellToken==='string'?shellToken:token},body:JSON.stringify({action:'gitAvailability',workspaceId:'git-setup'})});const data=await r.json();if(!r.ok||!data.result?.version)throw Error();if(card!==current||!current.isConnected)return;
    current.dataset.ready='true';title.textContent=t('Git이 준비되었습니다');reason.textContent=data.result.version;reason.classList.add('literal-data');symbol.replaceChildren(PgitIcons.icon('check'));steps.hidden=true;help.hidden=true;done.hidden=false;note.textContent=t(inline?'돌아가기를 누르면 입력했던 내용을 확인하고 작업을 실행할 수 있습니다.':'이제 저장소 열기와 복제를 사용할 수 있습니다.');done.focus();
   }catch{if(card!==current||!current.isConnected)return;status.dataset.state='missing';status.textContent=t('아직 Git을 찾지 못했습니다. 설치를 마쳤다면 pGit을 종료한 뒤 다시 열어주세요.');help.open=true}
   finally{check.disabled=false;check.textContent=t('설치 확인');checkRow.removeAttribute('aria-busy')}
  };
  if(inline){inline.replaceChildren(card);inline.hidden=false;document.getElementById('projectDialog').dataset.gitSetup='required';check.focus();return}
  if(!dialog){dialog=document.createElement('dialog');dialog.id='gitSetupDialog';document.body.append(dialog)}
  PgitUI.dialogFrame(dialog,{title:'Git 준비',body:card,className:'dialog-heading',titleTag:'h2'});if(!dialog.open)dialog.showModal();
 }
 return {show,clear};
})();
