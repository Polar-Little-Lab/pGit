Object.assign(commands,{
githubPRs:['GitHub Pull Requests',[]],githubIssues:['GitHub Issues',[]],githubRuns:['GitHub Actions',[]],githubPRDiff:['PR Diff',[['number','PR 번호']]],githubPRChecks:['PR 검사 결과',[['number','PR 번호']]],githubPRCreate:['Draft PR 만들기',[['title','제목'],['body','본문'],['base','기준 브랜치','main'],['head','이미 Push한 브랜치','branches']],'GitHub에 Draft PR을 게시합니다. gh에 로그인된 계정을 사용합니다.'],githubPRComment:['PR 댓글 게시',[['number','PR 번호'],['body','댓글']],'입력한 댓글을 GitHub에 게시합니다.'],githubPRApprove:['PR 승인 리뷰',[['number','PR 번호'],['body','리뷰']],'GitHub에 승인 리뷰를 게시합니다.'],githubPRRequestChanges:['PR 변경 요청',[['number','PR 번호'],['body','리뷰']],'GitHub에 변경 요청 리뷰를 게시합니다.'],githubPRCheckout:['PR 체크아웃',[['number','PR 번호']]],githubIssueCreate:['GitHub 이슈 만들기',[['title','제목'],['body','본문']],'선택한 원격 저장소에 이슈를 게시합니다.'],githubIssueComment:['이슈 댓글 게시',[['number','이슈 번호'],['body','댓글']],'입력한 댓글을 GitHub에 게시합니다.']
});categories.push(['GitHub · gh 로그인 필요',['githubPRs','githubIssues','githubRuns','githubPRDiff','githubPRChecks','githubPRCreate','githubPRComment','githubPRApprove','githubPRRequestChanges','githubPRCheckout','githubIssueCreate','githubIssueComment']]);
const integrations=el('section',undefined,'sidebar-integrations');$('branches').previousElementSibling.before(integrations);


function providerTabs(definitions,active,onSelect){
 return PgitUI.segments({items:definitions,value:active,label:'리뷰 · 이슈 · CI',onChange:onSelect,className:'reference-modes provider-tabs',dataKey:'providerTab'}).element;
}
function providerItem(item,title,meta,provider,action,remote){
 const project=state.remoteDetails?.find(r=>r.name===remote)?.url;
 const number=provider==='github'?(item.number||item.databaseId):(item.iid||item.id);
 const section=action.endsWith('Issues')?'issues':action==='githubPRs'?'pull':action==='gitlabMRs'?'-/merge_requests':action==='githubRuns'?'actions/runs':'-/pipelines';
 const href=item.web_url||item.url||(project&&Number.isInteger(number)?project.replace(/\/$/,'')+'/'+(provider==='gitlab'&&section==='issues'?'-/issues':section)+'/'+number:'');
 const candidate=el('a',undefined,'provider-item-link'),valid=PgitUI.externalLink(candidate,href),link=valid?candidate:el('div',undefined,'provider-item-link');link.append(el('strong',title,'literal-data'),el('p',meta,'literal-data'));
 if(valid){link.title=href;const external=el('span','↗','provider-item-external');external.setAttribute('aria-hidden','true');link.append(external)}return link;
}

let githubViewRequest=0;
async function showGitHub(action,remote='origin'){if(!state)return notify('먼저 저장소를 여세요.');const request=++githubViewRequest,root=state.root;const body=advancedFrame('GitHub · '+remote,'list');const tabs=providerTabs([['githubPRs','Pull Requests'],['githubIssues','Issues'],['githubRuns','Actions']],action,key=>showGitHub(key,remote));body.append(tabs);const list=el('div');body.append(list);list.append(el('p','불러오는 중…'));try{const result=JSON.parse(await api(action,{remote}));if(request!==githubViewRequest||state.root!==root||!body.isConnected)return;list.replaceChildren();for(const item of result){const row=el('div',undefined,'provider-row');row.append(providerItem(item,(item.number?'#'+item.number+' · ':'')+(item.title||item.displayTitle),item.headRefName?item.headRefName+' → '+item.baseRefName:item.status?item.status+' · '+(item.conclusion||''):item.updatedAt||'','github',action,remote));if(action==='githubPRs'){const detail=el('button','상세 보기');detail.onclick=()=>showProviderReview('github',item.number,remote);row.append(detail)}if(action==='githubPRs')for(const [key,label] of [['githubPRDiff','Diff'],['githubPRChecks','검사'],['githubPRCheckout','체크아웃']]){const b=el('button',label);b.onclick=async()=>{if(key==='githubPRDiff'||key==='githubPRChecks')return showProviderReview('github',item.number,remote,key==='githubPRDiff'?'files':'checks');advancedDialog.close();await openCommand(key);const n=$('command-number');if(n)n.value=item.number;const r=$('command-remote');if(r){r.value=remote;r.dispatchEvent(new Event('change',{bubbles:true}))}};row.append(b)}list.append(row)}if(!result.length)list.append(el('p','표시할 항목이 없습니다.'))}catch(e){if(request===githubViewRequest&&body.isConnected)list.textContent=e.message}}

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
 const body=advancedFrame('GitLab · '+PgitPaths.basename(root),'list');
 const toolbar=el('div',undefined,'git-toolbar'),select=el('select');select.setAttribute('aria-label','원격');
 for(const name of state.remotes){const option=el('option',name);option.value=name;select.append(option)}select.value=remote||'';select.onchange=()=>showGitLab(action,select.value);toolbar.append(select);
 const tabs=providerTabs([['gitlabMRs','Merge Requests'],['gitlabIssues','Issues'],['gitlabPipelines','Pipelines']],action,key=>showGitLab(key,remote));
 body.append(toolbar,tabs);const list=el('div');list.setAttribute('aria-live','polite');body.append(list);
 if(!remote){list.textContent='원격 저장소가 없습니다.';return}
 if(action!=='gitlabPipelines'){const create=el('button',action==='gitlabMRs'?'Draft MR 만들기':'GitLab 이슈 만들기');create.onclick=()=>command(action==='gitlabMRs'?'gitlabMRCreate':'gitlabIssueCreate');body.append(create)}
 async function command(key,number){advancedDialog.close();await openCommand(key);const field=$('command-remote');if(field){field.value=remote;field.dispatchEvent(new Event('change',{bubbles:true}))}if(number)$('command-number').value=number}
 list.append(el('p','불러오는 중…'));
 try{const items=JSON.parse(await api(action,{remote}));if(request!==gitlabViewRequest||state.root!==root||!body.isConnected)return;list.replaceChildren();
 for(const item of items){const row=el('div',undefined,'provider-row');row.append(providerItem(item,(item.iid?'#'+item.iid+' · ':'')+(item.title||'#'+item.id+' · '+item.ref),item.source_branch?item.source_branch+' → '+item.target_branch:item.status||item.updated_at||'','gitlab',action,remote));
 if(action==='gitlabMRs'){const detail=el('button','상세 보기');detail.onclick=()=>showProviderReview('gitlab',item.iid,remote);row.append(detail)}if(action==='gitlabMRs')for(const [key,label] of [['gitlabMRDiff','Diff'],['gitlabMRChecks','검사'],['gitlabMRCheckout','체크아웃'],['gitlabMRComment','MR 댓글 게시']]){const b=el('button',label);b.onclick=()=>key==='gitlabMRCheckout'?command(key,item.iid):showProviderReview('gitlab',item.iid,remote,key==='gitlabMRDiff'?'files':key==='gitlabMRChecks'?'checks':'submit');row.append(b)}list.append(row)}if(!items.length)list.append(el('p','표시할 항목이 없습니다.'));
 }catch(e){if(request===gitlabViewRequest&&body.isConnected)list.textContent=e.message}
}

// Every entry represents a configured Git remote, not an authenticated account.
for(const [key,definition] of Object.entries(commands))if(key.startsWith('github'))definition[1].unshift(['remote','원격','remotes']);
function showRemoteTools(remote){
 if(remote.provider==='github')return showGitHub('githubPRs',remote.name);
 if(remote.provider==='gitlab')return showGitLab('gitlabMRs',remote.name);
 const body=advancedFrame(remote.name+' · '+remote.host,'menu');
 for(const [provider,label] of [['github','GitHub'],['gitlab','GitLab']]){const button=el('button',label,'command-option');PgitIcons.label(button,provider,label);button.onclick=()=>provider==='github'?showGitHub('githubPRs',remote.name):showGitLab('gitlabMRs',remote.name);body.append(button)}
}
function renderRemoteSites(groups=[]){
 const remotes=[...(state?.remoteDetails||[])];for(const group of groups){const name=group.querySelector('.branch-folder-name').textContent;if(!remotes.some(r=>r.name===name))remotes.push({name})}remotes.sort((a,b)=>(a.name==='origin'?-1:b.name==='origin'?1:a.name.localeCompare(b.name)));integrations.replaceChildren();
 const heading=el('div',undefined,'remote-sites-heading'),title=el('span','원격 저장소','caption'),add=el('button');add.type='button';PgitIcons.label(add,'plus');add.setAttribute('aria-label','원격 추가');add.title='원격 추가';add.onclick=()=>openCommand('remoteAdd');heading.append(title,add);integrations.append(heading);
 for(const remote of remotes){const row=el('div',undefined,'remote-site');row.dataset.remote=remote.name;const group=groups.find(g=>g.querySelector('.branch-folder-name').textContent===remote.name),children=group?.querySelector(':scope>.branch-folder-children'),count=group?.querySelectorAll('.remote-branch').length||0;
 if(count){const toggle=el('button',undefined,'remote-site-toggle');PgitIcons.label(toggle,'right');toggle.setAttribute('aria-label',remote.name);const key=(state?.root||'')+'|remote|'+remote.name;let expanded=branchFolderExpansion.get(key)??true;toggle.setAttribute('aria-expanded',String(expanded));children.hidden=!expanded;toggle.onclick=()=>{expanded=!expanded;children.hidden=!expanded;const tags=row.querySelector('.remote-tags');if(tags)tags.hidden=!expanded;toggle.setAttribute('aria-expanded',String(expanded));branchFolderExpansion.set(key,expanded)};row.append(toggle)}
 const link=el(remote.url?'a':'span',undefined,'remote-site-link');link.append(PgitIcons.icon(remote.provider||'folder'));const text=el('span',undefined,'remote-site-text');text.append(el('strong',remote.name,'literal-data'));if(remote.host)text.append(el('small',remote.host,'literal-data remote-site-host'));text.append(el('span',remote.project||'웹 주소 없음',remote.project?'literal-data':'remote-site-unavailable'));link.append(text);
 if(remote.url){PgitUI.externalLink(link,remote.url);link.title=remote.url;const external=el('span','↗','remote-site-external');external.setAttribute('aria-hidden','true');link.append(external)}row.append(link);
 if(remote.url){const tools=el('button');PgitIcons.label(tools,'review');tools.setAttribute('aria-label','리뷰 · 이슈 · CI');tools.title='리뷰 · 이슈 · CI';tools.onclick=()=>showRemoteTools(remote);row.append(tools)}if(count){row.append(el('span',String(count),'remote-site-count folder-count'),children)}appendRemoteTags(row,remote);integrations.append(row)}
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
