// A missing dependency is not a repository/path error. Never retry a mutation here.
window.PgitGitSetup=(()=>{
 const t=text=>window.PgitI18n?.t(text)||text;
 let dialog,card;
 function show(error={}){
  if(parent!==window){parent.postMessage({source:'pgit-pane',type:'git-unavailable',code:'GIT_UNAVAILABLE',reason:error.reason,platform:error.platform},location.origin);return}
  const inline=document.querySelector('#projectDialog[open] #projectGitSetup');
  if(card?.isConnected&&(inline?inline.contains(card):dialog?.open))return;
  card?.remove();card=document.createElement('section');card.className='git-setup-card';card.setAttribute('role','alert');
  const heading=document.createElement('div');heading.className='git-setup-heading';heading.append(PgitIcons.icon('branch'));const title=document.createElement('strong');title.textContent=t('Git을 실행할 수 없습니다');heading.append(title);
  const explanation=document.createElement('p');explanation.textContent=t(error.reason==='permission'?'Git 실행 권한을 확인해 주세요.':error.reason==='developer-tools'?'macOS 개발자 도구 설정을 확인해 주세요.':'Git이 설치되지 않았거나 pGit에서 찾을 수 없는 상태입니다.');
  const steps=document.createElement('ol');for(const text of ['Git 공식 설치 안내에서 운영체제에 맞게 설치하세요.','이미 설치했다면 터미널에서 git --version이 실행되는지 확인하세요.','설치 또는 PATH 변경 후 pGit을 완전히 종료하고 다시 여세요.']){const item=document.createElement('li');item.textContent=t(text);steps.append(item)}
  const actions=document.createElement('div');actions.className='git-setup-actions';const install=document.createElement('a');install.textContent=t('Git 설치 안내');PgitUI.externalLink(install,'https://git-scm.com/install/');const check=document.createElement('button');check.type='button';PgitIcons.label(check,'refresh',t('설치 확인'));const status=document.createElement('p');status.className='git-setup-status';status.setAttribute('role','status');actions.append(install,check);
  check.onclick=async()=>{check.disabled=true;status.textContent=t('Git을 확인하는 중…');try{const r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json','X-Pgit-Token':typeof shellToken==='string'?shellToken:token},body:JSON.stringify({action:'gitAvailability',workspaceId:'git-setup'})});const data=await r.json();if(!r.ok)throw Error();status.textContent=t('Git이 준비되었습니다. 원래 작업을 다시 실행하세요.');status.dataset.ready='true';steps.hidden=true;explanation.hidden=true;install.hidden=true;title.textContent=t('Git을 사용할 수 있습니다');}catch{status.textContent=t('아직 Git을 실행할 수 없습니다. 설치와 실행 경로를 확인해 주세요.')}finally{check.disabled=false}};
  card.append(heading,explanation,steps,actions,status);
  if(inline){inline.replaceChildren(card);inline.hidden=false;return}
  if(!dialog){dialog=document.createElement('dialog');dialog.id='gitSetupDialog';document.body.append(dialog)}
  PgitUI.dialogFrame(dialog,{title:'Git 설정 확인',body:card,className:'dialog-heading',titleTag:'h2'});if(!dialog.open)dialog.showModal();
 }
 return {show,clear:()=>{card?.remove();card=null;const inline=document.getElementById('projectGitSetup');if(inline)inline.hidden=true}};
})();
