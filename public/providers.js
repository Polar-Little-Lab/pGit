Object.assign(commands,{
githubPRs:['GitHub Pull Requests',[]],githubIssues:['GitHub Issues',[]],githubRuns:['GitHub Actions',[]],githubPRDiff:['PR Diff',[['number','PR 번호']]],githubPRChecks:['PR 검사 결과',[['number','PR 번호']]],githubPRCreate:['Draft PR 만들기',[['title','제목'],['body','본문'],['base','기준 브랜치','main'],['head','이미 Push한 브랜치','branches']],'GitHub에 Draft PR을 게시합니다. gh에 로그인된 계정을 사용합니다.'],githubPRComment:['PR 댓글 게시',[['number','PR 번호'],['body','댓글']],'입력한 댓글을 GitHub에 게시합니다.'],githubPRApprove:['PR 승인 리뷰',[['number','PR 번호'],['body','리뷰']],'GitHub에 승인 리뷰를 게시합니다.'],githubPRRequestChanges:['PR 변경 요청',[['number','PR 번호'],['body','리뷰']],'GitHub에 변경 요청 리뷰를 게시합니다.'],githubPRCheckout:['PR 체크아웃',[['number','PR 번호']]],githubIssueCreate:['GitHub 이슈 만들기',[['title','제목'],['body','본문']],'선택한 원격 저장소에 이슈를 게시합니다.'],githubIssueComment:['이슈 댓글 게시',[['number','이슈 번호'],['body','댓글']],'입력한 댓글을 GitHub에 게시합니다.']
});categories.push(['GitHub · gh 로그인 필요',['githubPRs','githubIssues','githubRuns','githubPRDiff','githubPRChecks','githubPRCreate','githubPRComment','githubPRApprove','githubPRRequestChanges','githubPRCheckout','githubIssueCreate','githubIssueComment']]);
const integrations=el('section',undefined,'sidebar-integrations');$('branches').previousElementSibling.before(integrations);


function providerListFrame(action,remote,onRemote){
 const body=advancedFrame(PgitI18n.t(commands[action][0])+(remote?' · '+remote:''),'list');body.dataset.providerAction=action;PgitCommandHelp.mount(body,action);providerRemoteSelect(body,remote,onRemote);return body;
}
function providerItem(item,title,meta,provider,action,remote){
 const project=state.remoteDetails?.find(r=>r.name===remote)?.url;
 const number=provider==='github'?(item.number||item.databaseId):(item.iid||item.id);
 const section=action.endsWith('Issues')?'issues':action==='githubPRs'?'pull':action==='gitlabMRs'?'-/merge_requests':action==='githubRuns'?'actions/runs':'-/pipelines';
 const href=item.web_url||item.url||(project&&Number.isInteger(number)?project.replace(/\/$/,'')+'/'+(provider==='gitlab'&&section==='issues'?'-/issues':section)+'/'+number:'');
 const entry=PgitUI.listItem({title,meta,href,className:'provider-row'});
 if(action==='githubIssues'){
  const button=el('button',undefined,'ui-list-main');button.type='button';button.append(...entry.main.childNodes);button.querySelector('.ui-list-external')?.remove();button.onclick=()=>showGitHubIssue(item.number,remote);entry.main.replaceWith(button);
  const link=el('a','GitHub에서 열기');if(PgitUI.externalLink(link,href))entry.actions.append(link);
 }
 return entry.element;
}

async function checkoutProvider(key,number,remote){
 if(working)return;working=true;controls();const body=advancedDialog.querySelector('.advanced-body');
 try{await api(key,{number,remote});advancedDialog.close();notify('브랜치 전환 완료')}catch(error){notify(error.message);if(body?.isConnected){body.querySelector('.provider-checkout-error')?.remove();const message=PgitUI.message(error.message,{error:true});message.classList.add('provider-checkout-error');body.append(message)}}finally{working=false;controls()}
}
function providerRemoteSelect(body,remote,onChange){
 if(state.remotes.length<2)return;
 const toolbar=el('div',undefined,'git-toolbar'),select=el('select');select.setAttribute('aria-label','원격');
 for(const name of state.remotes){const option=el('option',name);option.value=name;select.append(option)}select.value=remote||'';select.onchange=()=>onChange(select.value);toolbar.append(select);body.append(toolbar);
}
const providerOpenCommand=openCommand;openCommand=async function(key){
 if(key==='githubIssueComment'&&state&&!working){panel.close();return showGitHub('githubIssues')}
 if(state&&!working&&['githubPRs','githubIssues','githubRuns','gitlabMRs','gitlabIssues','gitlabPipelines'].includes(key)){panel.close();return key.startsWith('github')?showGitHub(key):showGitLab(key)}
 return providerOpenCommand(key);
};
let githubViewRequest=0;
async function showGitHub(action,remote){if(!state)return notify('먼저 저장소를 여세요.');remote=remote||(state.remotes.includes('origin')?'origin':state.remotes[0]);const request=++githubViewRequest,root=state.root;const body=providerListFrame(action,remote,value=>showGitHub(action,value));const list=el('div',undefined,'ui-item-list');body.append(list);if(!remote){list.append(PgitUI.message('원격 저장소가 없습니다.'));return}list.append(PgitUI.message('불러오는 중…'));try{const result=JSON.parse(await api(action,{remote}));if(request!==githubViewRequest||state.root!==root||!body.isConnected)return;list.replaceChildren();for(const item of result){const row=providerItem(item,(item.number?'#'+item.number+' · ':'')+(item.title||item.displayTitle),item.headRefName?item.headRefName+' → '+item.baseRefName:item.status?item.status+' · '+(item.conclusion||''):[item.state,item.updatedAt].filter(Boolean).join(' · '),'github',action,remote);if(action==='githubPRs'){const detail=el('button','상세 보기');detail.onclick=()=>showProviderReview('github',item.number,remote);row.querySelector('.ui-list-actions').append(detail)}if(action==='githubPRs')for(const [key,label] of [['githubPRDiff','Diff'],['githubPRChecks','검사'],['githubPRCheckout','체크아웃']]){const b=el('button',label);b.onclick=async()=>{if(key==='githubPRDiff'||key==='githubPRChecks')return showProviderReview('github',item.number,remote,key==='githubPRDiff'?'files':'checks');return checkoutProvider(key,item.number,remote)};row.querySelector('.ui-list-actions').append(b)}list.append(row)}if(!result.length)list.append(PgitUI.message('표시할 항목이 없습니다.'))}catch(e){if(request===githubViewRequest&&body.isConnected)list.replaceChildren(PgitUI.message(e.message,{error:true}))}}

const beforeProviderApi=api;api=async function(action,data={}){const result=await beforeProviderApi(action,data);if(action==='githubPRCheckout'||action==='gitlabMRCheckout'){state=await beforeProviderApi('state',{limit:historyLimit});scope=null;activeCommit=null;render()}return result};

const gitlabRemoteField=['remote','원격','remotes'];
Object.assign(commands,{
 gitlabMRs:['GitLab Merge Requests',[gitlabRemoteField]],gitlabIssues:['GitLab Issues',[gitlabRemoteField]],gitlabPipelines:['GitLab Pipelines',[gitlabRemoteField]],
 gitlabMRDiff:['MR Diff',[gitlabRemoteField,['number','MR 번호']]],gitlabMRChecks:['MR 파이프라인',[gitlabRemoteField,['number','MR 번호']]],gitlabMRCheckout:['MR 체크아웃',[gitlabRemoteField,['number','MR 번호']]],
 gitlabMRCreate:['Draft MR 만들기',[gitlabRemoteField,['title','제목'],['body','본문'],['base','기준 브랜치','main'],['head','이미 Push한 브랜치','branches']],'선택한 GitLab 원격에 Draft MR을 게시합니다.'],
 gitlabMRComment:['MR 댓글 게시',[gitlabRemoteField,['number','MR 번호'],['body','댓글']],'입력한 댓글을 GitLab에 게시합니다.'],
 gitlabIssueCreate:['GitLab 이슈 만들기',[gitlabRemoteField,['title','제목'],['body','본문']],'선택한 GitLab 원격에 이슈를 게시합니다.']
});
categories.push(['GitLab',['gitlabMRs','gitlabIssues','gitlabPipelines','gitlabMRDiff','gitlabMRChecks','gitlabMRCheckout','gitlabMRCreate','gitlabMRComment','gitlabIssueCreate']]);

let gitlabViewRequest=0;
async function showGitLab(action='gitlabMRs',remote){
 if(!state)return notify('먼저 저장소를 여세요.');
 const request=++gitlabViewRequest,root=state.root;remote=remote||(state.remotes.includes('origin')?'origin':state.remotes[0]);
 const body=providerListFrame(action,remote,value=>showGitLab(action,value));
 const list=el('div',undefined,'ui-item-list');list.setAttribute('aria-live','polite');body.append(list);
 if(!remote){list.replaceChildren(PgitUI.message('원격 저장소가 없습니다.'));return}
 if(action!=='gitlabPipelines'){const create=el('button',action==='gitlabMRs'?'Draft MR 만들기':'GitLab 이슈 만들기');create.onclick=()=>command(action==='gitlabMRs'?'gitlabMRCreate':'gitlabIssueCreate');body.append(create)}
 async function command(key,number){advancedDialog.close();await openCommand(key);const field=$('command-remote');if(field){field.value=remote;field.dispatchEvent(new Event('change',{bubbles:true}))}if(number)$('command-number').value=number}
 list.append(PgitUI.message('불러오는 중…'));
 try{const items=JSON.parse(await api(action,{remote}));if(request!==gitlabViewRequest||state.root!==root||!body.isConnected)return;list.replaceChildren();
 for(const item of items){const row=providerItem(item,(item.iid?'#'+item.iid+' · ':'')+(item.title||'#'+item.id+' · '+item.ref),item.source_branch?item.source_branch+' → '+item.target_branch:item.status||item.updated_at||'','gitlab',action,remote);
 if(action==='gitlabMRs'){const detail=el('button','상세 보기');detail.onclick=()=>showProviderReview('gitlab',item.iid,remote);row.querySelector('.ui-list-actions').append(detail)}if(action==='gitlabMRs')for(const [key,label] of [['gitlabMRDiff','Diff'],['gitlabMRChecks','검사'],['gitlabMRCheckout','체크아웃'],['gitlabMRComment','MR 댓글 게시']]){const b=el('button',label);b.onclick=()=>key==='gitlabMRCheckout'?checkoutProvider(key,item.iid,remote):showProviderReview('gitlab',item.iid,remote,key==='gitlabMRDiff'?'files':key==='gitlabMRChecks'?'checks':'submit');row.querySelector('.ui-list-actions').append(b)}list.append(row)}if(!items.length)list.append(PgitUI.message('표시할 항목이 없습니다.'));
 }catch(e){if(request===gitlabViewRequest&&body.isConnected)list.replaceChildren(PgitUI.message(e.message,{error:true}))}
}

// Every entry represents a configured Git remote, not an authenticated account.
for(const [key,definition] of Object.entries(commands))if(key.startsWith('github'))definition[1].unshift(['remote','원격','remotes']);
function renderRemoteSites(groups=[]){
 const remotes=[...(state?.remoteDetails||[])];for(const group of groups){const name=group.querySelector('.branch-folder-name').textContent;if(!remotes.some(r=>r.name===name))remotes.push({name})}remotes.sort((a,b)=>(a.name==='origin'?-1:b.name==='origin'?1:a.name.localeCompare(b.name)));integrations.replaceChildren();
 const heading=el('div',undefined,'remote-sites-heading'),title=el('span','원격 저장소','caption'),add=el('button');add.type='button';PgitIcons.label(add,'plus');add.setAttribute('aria-label','원격 추가');add.title='원격 추가';add.onclick=()=>openCommand('remoteAdd');heading.append(title,add);integrations.append(heading);
 for(const remote of remotes){const row=el('div',undefined,'remote-site');row.dataset.remote=remote.name;const header=el('div',undefined,'remote-site-header');row.append(header);const group=groups.find(g=>g.querySelector('.branch-folder-name').textContent===remote.name),children=group?.querySelector(':scope>.branch-folder-children'),count=group?.querySelectorAll('.remote-branch').length||0;
 if(count){const toggle=el('button',undefined,'remote-site-toggle');PgitIcons.label(toggle,'right');toggle.setAttribute('aria-label',remote.name);const key=(state?.root||'')+'|remote|'+remote.name;let expanded=branchFolderExpansion.get(key)??true;toggle.setAttribute('aria-expanded',String(expanded));children.hidden=!expanded;toggle.onclick=()=>{expanded=!expanded;children.hidden=!expanded;const tags=row.querySelector('.remote-tags');if(tags)tags.hidden=!expanded;toggle.setAttribute('aria-expanded',String(expanded));branchFolderExpansion.set(key,expanded)};header.append(toggle)}
 const link=el(remote.url?'a':'span',undefined,'remote-site-link');link.append(PgitIcons.icon(remote.provider||'folder'));const text=el('span',undefined,'remote-site-text');text.append(el('strong',remote.name,'literal-data'));if(remote.host)text.append(el('small',remote.host,'literal-data remote-site-host'));text.append(el('span',remote.project||'웹 주소 없음',remote.project?'literal-data':'remote-site-unavailable'));link.append(text);
 if(remote.url){PgitUI.externalLink(link,remote.url);link.title=remote.url;const external=el('span','↗','remote-site-external');external.setAttribute('aria-hidden','true');link.append(external)}header.append(link);
 if(count){header.append(el('span',String(count),'remote-site-count folder-count'));row.append(children)}appendRemoteTags(row,remote);integrations.append(row)}
 if(!remotes.length)integrations.append(el('p','원격 저장소가 없습니다.','remote-sites-empty'));
}

const remoteTagLists=new Map();
function remoteTagKey(root,remote){return JSON.stringify([root,remote.name,remote.url])}
function appendRemoteTags(row,remote){
 const key=remoteTagKey(state.root,remote),cached=remoteTagLists.get(key),tags=cached?.tags;
 const box=el(tags?.length?'details':'section',undefined,'remote-tags branch-section'),heading=el(tags?.length?'summary':'div','TAGS',tags?.length?undefined:'branch-section-heading');
 box.dataset.section='remote-tags:'+remote.name;
 heading.append(el('span',tags?String(tags.length):cached?.error?'!':'…','folder-count'));
 if(cached?.error)heading.title='원격 태그를 갱신하지 못했습니다.';
 box.append(heading);
 if(tags?.length){
  box.open=branchFolderExpansion.get(state.root+'|section|'+box.dataset.section)??true;heading.addEventListener('click',rememberBranchSection);
  const list=el('div',undefined,'branch-section-body');
  for(const tag of tags){const item=el('div',undefined,'nav sidebar-ref tag-ref remote-tag');item.append(PgitIcons.icon('tag'),el('span',tag.name,'literal-data'));item.title=tag.name+' · '+(tag.target||tag.hash);list.append(item)}box.append(list);
 }else box.classList.add('is-empty');
 box.hidden=row.querySelector('.remote-site-toggle')?.getAttribute('aria-expanded')==='false';row.append(box);
}
async function refreshRemoteTags(request,force=false){
 const root=state?.root;if(!root)return;
 const minutes=Number(localStorage.getItem('pgit.autoFetchMinutes')??10),interval=[5,10,30].includes(minutes)?minutes*60000:Infinity;
 for(const remote of state.remoteDetails||[]){
  if(state?.root!==root||document.hidden||window.frameElement?.hidden)return;
  const key=remoteTagKey(root,remote),previous=remoteTagLists.get(key);
  if(previous&&!force&&Date.now()-previous.at<interval)continue;
  remoteTagLists.set(key,{...previous,at:Date.now()});
  try{const tags=await request('remoteTags',{remote:remote.name});remoteTagLists.set(key,{tags,at:Date.now()})}
  catch{remoteTagLists.set(key,{tags:previous?.tags,error:true,at:Date.now()})}
  if(state?.root!==root)return;
  const row=[...integrations.querySelectorAll('.remote-site')].find(row=>row.dataset.remote===remote.name);
  if(row){row.querySelector('.remote-tags')?.remove();appendRemoteTags(row,remote)}
 }
}

// Issue bodies and comments are external content; keep them as literal text.
const issueDrafts=new Map();
async function showGitHubIssue(number,remote){
 if(!state||working)return;
 const root=state.root,key=JSON.stringify([root,remote,number]);
 const body=advancedFrame('GitHub · #'+number+' · '+remote,'issue');body.classList.add('issue-detail');
 const alive=()=>body.isConnected&&advancedDialog.open&&state?.root===root;
 const toolbar=el('div',undefined,'review-toolbar'),back=el('button','목록으로'),refresh=PgitIcons.refresh();
 back.onclick=()=>showGitHub('githubIssues',remote);toolbar.append(back,refresh);
 const conversation=el('section',undefined,'issue-conversation');conversation.setAttribute('aria-live','polite');
 const form=el('form',undefined,'issue-composer'),label=el('label','댓글'),input=el('textarea');input.id='issue-comment-body';label.htmlFor=input.id;input.rows=5;input.maxLength=4000;input.required=true;input.value=issueDrafts.get(key)||'';
 const error=el('p',undefined,'command-error');error.setAttribute('role','alert');const submit=el('button','댓글 게시','primary');submit.type='submit';submit.disabled=!input.value.trim();
 input.oninput=()=>{issueDrafts.set(key,input.value);submit.disabled=!input.value.trim();error.textContent=''};
 form.append(label,input,error,submit);body.append(toolbar,conversation,form);form.hidden=true;
 function commentCard(comment){const card=el('article',undefined,'issue-comment');const meta=el('div',undefined,'issue-comment-meta literal-data');meta.textContent=[comment.author?.login,comment.createdAt&&new Date(comment.createdAt).toLocaleString()].filter(Boolean).join(' · ');card.append(meta,el('div',comment.body||'','issue-text literal-data'));return card}
 let loading=false;
 async function load(){
  if(loading)return;loading=true;refresh.disabled=true;submit.disabled=true;
  if(!conversation.childNodes.length)conversation.append(PgitUI.message('불러오는 중…'));
  try{const issue=JSON.parse(await api('githubIssueView',{number,remote}));if(!alive())return;
   conversation.replaceChildren();const heading=el('header',undefined,'issue-heading');heading.append(el('span','#'+issue.number+' · '+issue.state,'literal-data'),el('h2',issue.title,'literal-data'));
   const link=el('a','GitHub에서 열기');if(PgitUI.externalLink(link,issue.url))heading.append(link);conversation.append(heading,commentCard(issue));
   const comments=issue.comments||[];conversation.append(el('h3',PgitI18n.t('댓글')+' · '+comments.length));for(const comment of comments)conversation.append(commentCard(comment));
   form.hidden=false;
  }catch(e){if(alive()){error.textContent=e.message;if(form.hidden){conversation.replaceChildren(PgitUI.message(e.message,{error:true}));}}}finally{loading=false;if(alive()){refresh.disabled=working;submit.disabled=working||!input.value.trim()}}
 }
 refresh.onclick=()=>{error.textContent='';load()};
 form.onsubmit=async event=>{
  event.preventDefault();if(working||loading||!input.value.trim()||!alive())return;
  const text=input.value;working=true;controls();input.disabled=true;submit.disabled=true;back.disabled=true;refresh.disabled=true;error.textContent='';
  try{await api('githubIssueComment',{number,remote,body:text});issueDrafts.delete(key);input.value='';conversation.append(commentCard({body:text}));notify('댓글 게시 완료');await load()}
  catch(e){if(alive())error.textContent=e.message}
  finally{working=false;controls();if(alive()){input.disabled=false;submit.disabled=!input.value.trim();back.disabled=false;refresh.disabled=false}}
 };
 await load();
}
