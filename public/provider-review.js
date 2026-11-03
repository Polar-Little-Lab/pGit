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
 const toolbar=el('div',undefined,'review-toolbar'),back=el('button','목록으로'),refresh=PgitIcons.refresh();
 back.onclick=()=>provider==='github'?showGitHub('githubPRs',remote):showGitLab('gitlabMRs',remote);refresh.onclick=()=>showProviderReview(provider,number,remote);toolbar.append(back,refresh);
 const header=el('section',undefined,'review-heading'),tabs=el('div',undefined,'review-tabs'),content=el('section',undefined,'review-content');content.setAttribute('aria-live','polite');body.append(toolbar,header,tabs,content);header.textContent='불러오는 중…';
 let detail,tabVersion=0,currentTab='overview';
 const context=()=>({provider,number,remote,repoId:detail.repoId,head:detail.head,base:detail.base,start:detail.start});
 try{detail=await api('reviewDetail',{provider,number,remote});if(!alive())return}catch(e){if(alive())header.textContent=e.message;return}
 const draftKey=[root,detail.repoId,number].join('|');
 header.replaceChildren(el('h2',detail.title,'literal-data'),el('p',`${detail.author||''} · ${detail.source||''} → ${detail.target||''}`,'literal-data'),el('p',`${detail.state}${detail.draft?' · Draft':''} · ${detail.head?.slice(0,10)||''} · ${detail.mergeStatus||''}`,'literal-data'));
 const definitions=[['overview','개요'],['files','변경 파일'],['checks','검사 결과'],['comments','댓글'],['submit','리뷰 작성'],['threads','리뷰 스레드'],['merge','병합 실행']];
 const tabControl=PgitUI.selectionGroup(tabs,{label:'리뷰 · 이슈 · CI',value:initialTab,onChange:draw,items:definitions.map(([value,label])=>{const button=el('button',label);button.dataset.reviewTab=value;return {value,button}})});
 async function draw(key){
  currentTab=key;body.dataset.reviewView=key;const request=++tabVersion,valid=()=>alive()&&request===tabVersion;
  tabControl.setValue(key);content.replaceChildren();
  if(key==='overview'){content.append(el('div',detail.description||'설명이 없습니다.',detail.description?'review-description literal-data':'review-description'));return}
  if(key==='submit'){renderForm();return}
  if(key==='merge'){await renderMerge(valid);return}
  if(key==='threads'){await renderThreads(valid);return}
  const list=el('div',undefined,key==='files'?'review-files':'review-items'),more=el('button','더 불러오기'),status=el('p');content.append(list,status,more);let page=1;const seenChecks=new Set();
  const fileList=el('div',undefined,'review-file-list'),diff=el('div',undefined,'review-patch');if(key==='files')list.append(fileList,diff);
  const action=key==='files'?'reviewFiles':key==='checks'?'reviewChecks':'reviewComments';
  async function load(){more.disabled=true;status.textContent='불러오는 중…';try{
   const result=await api(action,{...context(),page});if(!valid())return;status.textContent='';
   for(const item of result.items){
    if(key==='files'){
     const filePage=page;const name=provider==='github'?item.filename:item.new_path,previous=provider==='github'?item.previous_filename:item.old_path;
     const button=el('button',name,'review-file literal-data');button.title=previous&&previous!==name?previous+' → '+name:name;button.onclick=()=>{
      fileList.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});diff.replaceChildren(el('div',button.title,'review-patch-heading literal-data'));
      const patch=provider==='github'?item.patch:item.diff;if(!patch||item.too_large||item.collapsed){diff.append(el('p','서버가 이 파일의 Diff를 제공하지 않습니다.'));return}
      const rows=reviewPatchRows(patch),limit=10000;for(const line of rows.slice(0,limit)){const row=el('div',undefined,'review-patch-row '+line.kind);row.append(el('span',String(line.before??'')),el('span',String(line.after??'')),el('code',line.text));if(line.before||line.after){const comment=el('button','+','review-line-comment');comment.setAttribute('aria-label','줄 댓글 · '+(line.after??line.before));comment.title='줄 댓글';comment.onclick=()=>inlineForm(diff,{path:name,oldPath:previous||name,before:line.before,after:line.after,filePage},valid);row.append(comment)}diff.append(row)}if(rows.length>limit)diff.append(el('p','Diff 표시 한도를 초과했습니다.'));
     };fileList.append(button);if(fileList.children.length===1)button.click();
    }else if(key==='checks'){
     if(item.legacy&&seenChecks.has(item.name))continue;if(item.legacy)seenChecks.add(item.name);
     const {element:row}=PgitUI.listItem({title:item.name||'#'+item.id+' · '+(item.ref||''),meta:[item.status,item.conclusion,item.sha?.slice(0,10)].filter(Boolean).join(' · ')});list.classList.add('ui-item-list');list.append(row);
    }else{
     const row=el('article',undefined,'review-item');row.append(el('strong',item.user?.login||item.author?.username||'','literal-data'),el('time',[item.created_at,item.reviewState].filter(Boolean).join(' · '),'literal-data'),el('div',item.body||'','review-description literal-data'));list.append(row);
    }
   }
   if(page===1&&!result.items.length)status.textContent='표시할 항목이 없습니다.';if(key==='files'&&!result.hasMore&&Number(detail.fileCount)>fileList.children.length)status.textContent='서버가 일부 변경 파일을 생략했습니다.';page++;more.hidden=!result.hasMore;
  }catch(e){if(valid())status.textContent=e.message}finally{if(valid())more.disabled=false}}
  more.onclick=load;await load();
 }
 async function postAction(action,data,error,button,onSuccess){
  if(!alive()||working)return;working=true;controls();button.disabled=true;error.textContent='';
  toolbar.querySelectorAll('button').forEach(b=>b.disabled=true);tabs.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{const result=await api(action,{...context(),...data});if(alive())await onSuccess(result)}
  catch(e){if(alive())error.textContent=e.message}
  finally{working=false;controls();if(alive()){button.disabled=false;toolbar.querySelectorAll('button').forEach(b=>b.disabled=false);tabs.querySelectorAll('button').forEach(b=>b.disabled=false)}}
 }
 function commentForm(host,key,label,action,data,onSuccess){
  const form=el('form',undefined,'review-form review-thread-form'),title=el('strong',label,'literal-data'),text=el('textarea'),submit=el('button','게시','primary'),error=el('p',undefined,'command-error');
  text.rows=3;text.maxLength=4000;text.required=true;text.setAttribute('aria-label','댓글 내용');text.value=reviewDrafts.get(key)?.body||'';text.oninput=()=>reviewDrafts.set(key,{body:text.value});submit.type='submit';error.setAttribute('role','alert');
  form.append(title,text,error,submit);host.append(form);form.onsubmit=async e=>{e.preventDefault();if(!text.value.trim())return;const value=text.value;text.disabled=true;await postAction(action,{...data,body:value},error,submit,async()=>{reviewDrafts.delete(key);await onSuccess()});text.disabled=false};return form;
 }
 function inlineForm(diff,position,valid){
  if(!valid()||working)return;diff.querySelector('.review-thread-form')?.remove();
  const key=[draftKey,detail.head,position.path,position.before,position.after].join('|');
  const form=commentForm(diff,key,position.path+' · '+(position.after??position.before),'reviewInline',position,async()=>{notify('리뷰를 게시했습니다.');await draw('threads')});
  form.scrollIntoView({block:'nearest'});form.querySelector('textarea').focus();
 }
 async function renderThreads(valid){
  const list=el('div',undefined,'review-items'),status=el('p'),more=el('button','더 불러오기');content.append(list,status,more);let page=1;const ghThreads=new Map();
  function card(id,notes,position,resolvable,resolved){
   const row=el('article',undefined,'review-item review-thread'),where=position?(position.new_path||position.path||'')+' · '+(position.new_line??position.old_line??position.line??''):'',title=el('strong',where||'#'+id,'literal-data');row.append(title);
   for(const note of notes){const entry=el('section',undefined,'review-thread-note');entry.append(el('strong',note.user?.login||note.author?.username||'','literal-data'),el('div',note.body||'','review-description literal-data'));row.append(entry)}
   const reply=el('button','답글');reply.onclick=()=>{if(row.querySelector('form'))return;commentForm(row,draftKey+'|reply|'+id,where,'reviewReply',{thread:id},async()=>{notify('리뷰를 게시했습니다.');await draw('threads')})};row.append(reply);
   if(provider==='gitlab'&&resolvable){const resolve=el('button',resolved?'다시 열기':'해결됨으로 표시'),error=el('p',undefined,'command-error');error.setAttribute('role','alert');resolve.onclick=()=>postAction('reviewResolve',{thread:id,resolved:!resolved},error,resolve,()=>draw('threads'));row.append(resolve,error)}list.append(row);
  }
  async function load(){more.disabled=true;status.textContent='불러오는 중…';try{
   const result=await api('reviewThreads',{...context(),page});if(!valid())return;
   if(provider==='github'){
    for(const item of result.items){const id=String(item.in_reply_to_id||item.id);if(!ghThreads.has(id))ghThreads.set(id,[]);ghThreads.get(id).push(item)}
    list.replaceChildren();for(const [id,notes] of ghThreads){const first=notes.find(n=>!n.in_reply_to_id)||notes[0];card(id,notes,first,false,false)}
   }else for(const item of result.items){const note=item.notes?.find(n=>n.position)||item.notes?.[0];card(item.id,item.notes||[],note?.position,item.notes?.some(n=>n.resolvable),item.notes?.filter(n=>n.resolvable).every(n=>n.resolved))}
   status.textContent=page===1&&!result.items.length?'표시할 항목이 없습니다.':'';page++;more.hidden=!result.hasMore;
  }catch(e){if(valid())status.textContent=e.message}finally{if(valid())more.disabled=false}}
  more.onclick=load;await load();
 }
 async function renderMerge(valid){
  const status=el('p','불러오는 중…');content.append(status);let plan;
  try{plan=await api('reviewMergePreview',context());if(!valid())return}catch(e){if(valid())status.textContent=e.message;return}
  status.textContent=plan.allowed?'병합 준비가 완료되었습니다.':plan.reasons.join('\n');
  const route=el('p',`${plan.source} → ${plan.target} · ${plan.head.slice(0,10)}`,'literal-data');content.append(route);
  if(!plan.allowed)return;
  const select=el('select');select.setAttribute('aria-label','병합 방식');select.dataset.uiOptions='true';for(const method of plan.methods){const option=el('option',method);option.value=method;select.append(option)}
  const confirm=el('label','대상 브랜치와 커밋을 확인했습니다.','reset-confirm'),check=el('input');check.type='checkbox';confirm.prepend(check);
  const submit=el('button','지금 병합','primary'),error=el('p',undefined,'command-error');error.setAttribute('role','alert');submit.disabled=true;check.onchange=()=>submit.disabled=!check.checked;
  submit.onclick=async()=>{if(!check.checked)return;select.disabled=true;check.disabled=true;await postAction('reviewMerge',{method:select.value,confirm:true},error,submit,async()=>{notify('병합이 완료되었습니다.');await showProviderReview(provider,number,remote)});select.disabled=false;check.disabled=false;check.checked=false;submit.disabled=true};
  content.append(select,confirm,error,submit);
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
