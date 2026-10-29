// PR/MR content is untrusted repository data: render it as text, never HTML.
let reviewView=0;
const reviewDrafts=new Map();
function reviewPatchRows(patch){
 let before=0,after=0;return String(patch).split('\n').map(text=>{
  const header=text.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
  if(header){before=Number(header[1]);after=Number(header[2]);return {text,kind:'header'}}
  if(text.startsWith('+'))return {text,kind:'added',after:after++};
  if(text.startsWith('-'))return {text,kind:'removed',before:before++};
  if(text.startsWith(' '))return {text,kind:'context',before:before++,after:after++};
  return {text,kind:'header'};
 });
}
async function showProviderReview(provider,number,remote='origin',initialTab='overview'){
 if(!state)return;const root=state.root,version=++reviewView;
 const body=advancedFrame((provider==='github'?'Pull Request':'Merge Request')+' #'+number,'review');body.classList.add('provider-review');
 const alive=()=>body.isConnected&&advancedDialog.open&&version===reviewView&&state?.root===root;
 const toolbar=el('div',undefined,'review-toolbar'),back=el('button','목록으로'),refresh=el('button','새로고침');
 back.onclick=()=>provider==='github'?showGitHub('githubPRs'):showGitLab('gitlabMRs',remote);refresh.onclick=()=>showProviderReview(provider,number,remote);toolbar.append(back,refresh);
 const header=el('section',undefined,'review-heading'),tabs=el('div',undefined,'review-tabs'),content=el('section',undefined,'review-content');content.setAttribute('aria-live','polite');body.append(toolbar,header,tabs,content);header.textContent='불러오는 중…';
 let detail,tabVersion=0,currentTab='overview';
 const context=()=>({provider,number,remote,repoId:detail.repoId,head:detail.head,base:detail.base});
 try{detail=await api('reviewDetail',{provider,number,remote});if(!alive())return}catch(e){if(alive())header.textContent=e.message;return}
 const draftKey=[root,detail.repoId,number].join('|');
 header.replaceChildren(el('h2',detail.title,'literal-data'),el('p',`${detail.author||''} · ${detail.source||''} → ${detail.target||''}`,'literal-data'),el('p',`${detail.state}${detail.draft?' · Draft':''} · ${detail.head?.slice(0,10)||''} · ${detail.mergeStatus||''}`,'literal-data'));
 const definitions=[['overview','개요'],['files','변경 파일'],['checks','검사 결과'],['comments','댓글'],['submit','리뷰 작성']];
 for(const [key,label] of definitions){const button=el('button',label);button.dataset.reviewTab=key;button.onclick=()=>draw(key);tabs.append(button)}
 async function draw(key){
  currentTab=key;const request=++tabVersion,valid=()=>alive()&&request===tabVersion;
  tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.reviewTab===key);b.setAttribute('aria-pressed',String(b.dataset.reviewTab===key))});content.replaceChildren();
  if(key==='overview'){content.append(el('div',detail.description||'설명이 없습니다.',detail.description?'review-description literal-data':'review-description'));return}
  if(key==='submit'){renderForm();return}
  const list=el('div',undefined,key==='files'?'review-files':'review-items'),more=el('button','더 불러오기'),status=el('p');content.append(list,status,more);let page=1;const seenChecks=new Set();
  const fileList=el('div',undefined,'review-file-list'),diff=el('div',undefined,'review-patch');if(key==='files')list.append(fileList,diff);
  const action=key==='files'?'reviewFiles':key==='checks'?'reviewChecks':'reviewComments';
  async function load(){more.disabled=true;status.textContent='불러오는 중…';try{
   const result=await api(action,{...context(),page});if(!valid())return;status.textContent='';
   for(const item of result.items){
    if(key==='files'){
     const name=provider==='github'?item.filename:item.new_path,previous=provider==='github'?item.previous_filename:item.old_path;
     const button=el('button',name,'review-file literal-data');button.title=previous&&previous!==name?previous+' → '+name:name;button.onclick=()=>{
      fileList.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});diff.replaceChildren(el('div',button.title,'review-patch-heading literal-data'));
      const patch=provider==='github'?item.patch:item.diff;if(!patch||item.too_large||item.collapsed){diff.append(el('p','서버가 이 파일의 Diff를 제공하지 않습니다.'));return}
      const rows=reviewPatchRows(patch),limit=10000;for(const line of rows.slice(0,limit)){const row=el('div',undefined,'review-patch-row '+line.kind);row.append(el('span',String(line.before??'')),el('span',String(line.after??'')),el('code',line.text));diff.append(row)}if(rows.length>limit)diff.append(el('p','Diff 표시 한도를 초과했습니다.'));
     };fileList.append(button);if(fileList.children.length===1)button.click();
    }else if(key==='checks'){
     if(item.legacy&&seenChecks.has(item.name))continue;if(item.legacy)seenChecks.add(item.name);
     const row=el('article',undefined,'review-item');row.append(el('strong',item.name||'#'+item.id+' · '+(item.ref||''),'literal-data'),el('p',[item.status,item.conclusion,item.sha?.slice(0,10)].filter(Boolean).join(' · '),'literal-data'));list.append(row);
    }else{
     const row=el('article',undefined,'review-item');row.append(el('strong',item.user?.login||item.author?.username||'','literal-data'),el('time',[item.created_at,item.reviewState].filter(Boolean).join(' · '),'literal-data'),el('div',item.body||'','review-description literal-data'));list.append(row);
    }
   }
   if(page===1&&!result.items.length)status.textContent='표시할 항목이 없습니다.';if(key==='files'&&!result.hasMore&&Number(detail.fileCount)>fileList.children.length)status.textContent='서버가 일부 변경 파일을 생략했습니다.';page++;more.hidden=!result.hasMore;
  }catch(e){if(valid())status.textContent=e.message}finally{if(valid())more.disabled=false}}
  more.onclick=load;await load();
 }
 function renderForm(){
  const draft=reviewDrafts.get(draftKey)||{kind:'comment',body:''},form=el('form',undefined,'review-form'),select=el('select');select.setAttribute('aria-label','리뷰 종류');select.dataset.uiOptions='true';
  for(const [value,label] of [['comment','댓글 게시'],['approve','승인'],...(provider==='github'?[['request_changes','변경 요청']]:[])]){const option=el('option',label);option.value=value;select.append(option)}select.value=draft.kind;
  const text=el('textarea');text.setAttribute('aria-label','리뷰 내용');text.maxLength=4000;text.value=draft.body;text.rows=7;
  const error=el('p',undefined,'command-error');error.setAttribute('role','alert');const notice=el('p',provider==='github'?'입력한 리뷰를 GitHub에 게시합니다.':'입력한 리뷰를 GitLab에 게시합니다.');
  const submit=el('button','게시','primary');submit.type='submit';
  const persist=()=>reviewDrafts.set(draftKey,{kind:select.value,body:text.value});
  function sync(){persist();text.hidden=provider==='gitlab'&&select.value==='approve';text.required=select.value!=='approve';submit.disabled=!['open','opened'].includes(detail.state)||select.value!=='approve'&&!text.value.trim()}
  select.onchange=sync;text.oninput=sync;form.append(select,text,notice,error,submit);content.append(form);sync();
  form.onsubmit=async event=>{
   event.preventDefault();if(!alive()||working||submit.disabled)return;working=true;controls();submit.disabled=true;select.disabled=true;text.disabled=true;error.textContent='';toolbar.querySelectorAll('button').forEach(b=>b.disabled=true);tabs.querySelectorAll('button').forEach(b=>b.disabled=true);
   try{await api('reviewSubmit',{...context(),kind:select.value,body:text.hidden?'':text.value});if(provider==='gitlab'&&select.value==='approve'&&text.value.trim())reviewDrafts.set(draftKey,{kind:'comment',body:text.value});else reviewDrafts.delete(draftKey);if(alive()){text.value='';notify('리뷰를 게시했습니다.');await draw('comments')}}
   catch(e){if(alive())error.textContent=e.message}
   finally{working=false;controls();if(alive()){select.disabled=false;text.disabled=false;toolbar.querySelectorAll('button').forEach(b=>b.disabled=false);tabs.querySelectorAll('button').forEach(b=>b.disabled=false);if(currentTab==='submit')sync()}}
  };
 }
 await draw(initialTab);
}
