Object.assign(commands,{
githubPRs:['GitHub Pull Requests',[]],githubIssues:['GitHub Issues',[]],githubRuns:['GitHub Actions',[]],githubPRDiff:['PR Diff',[['number','PR 번호']]],githubPRChecks:['PR 검사 결과',[['number','PR 번호']]],githubPRCreate:['Draft PR 만들기',[['title','제목'],['body','본문'],['base','기준 브랜치','main'],['head','이미 Push한 브랜치','branches']],'GitHub에 Draft PR을 게시합니다. gh에 로그인된 계정을 사용합니다.'],githubPRComment:['PR 댓글 게시',[['number','PR 번호'],['body','댓글']],'입력한 댓글을 GitHub에 게시합니다.'],githubPRApprove:['PR 승인 리뷰',[['number','PR 번호'],['body','리뷰']],'GitHub에 승인 리뷰를 게시합니다.'],githubPRRequestChanges:['PR 변경 요청',[['number','PR 번호'],['body','리뷰']],'GitHub에 변경 요청 리뷰를 게시합니다.'],githubPRCheckout:['PR 체크아웃',[['number','PR 번호']]],githubIssueCreate:['GitHub 이슈 만들기',[['title','제목'],['body','본문']],'origin 저장소에 이슈를 게시합니다.'],githubIssueComment:['이슈 댓글 게시',[['number','이슈 번호'],['body','댓글']],'입력한 댓글을 GitHub에 게시합니다.']
});categories.push(['GitHub · gh 로그인 필요',['githubPRs','githubIssues','githubRuns','githubPRDiff','githubPRChecks','githubPRCreate','githubPRComment','githubPRApprove','githubPRRequestChanges','githubPRCheckout','githubIssueCreate','githubIssueComment']]);
const githubNav=el('button','GitHub','nav');githubNav.id='githubNav';githubNav.setAttribute('aria-haspopup','dialog');PgitIcons.label(githubNav,'github','GitHub');const integrations=el('section',undefined,'sidebar-integrations');integrations.append(el('div','연동','caption'),githubNav);$('branches').previousElementSibling.before(integrations);githubNav.onclick=()=>showGitHub('githubPRs');
async function showGitHub(action){if(!state)return notify('먼저 저장소를 여세요.');const body=advancedFrame('GitHub · '+state.root.split('/').pop(),'list');const tabs=el('div',undefined,'git-toolbar');for(const [key,label] of [['githubPRs','Pull Requests'],['githubIssues','Issues'],['githubRuns','Actions']]){const b=el('button',label,key===action?'active':'');b.onclick=()=>showGitHub(key);tabs.append(b)}body.append(tabs,el('p','이 기기의 GitHub CLI 로그인과 origin 원격을 사용합니다.'));const list=el('div');body.append(list);list.append(el('p','불러오는 중…'));try{const result=JSON.parse(await api(action));list.replaceChildren();for(const item of result){const row=el('div',undefined,'provider-row');row.append(el('strong',(item.number?'#'+item.number+' · ':'')+(item.title||item.displayTitle)),el('p',item.headRefName?item.headRefName+' → '+item.baseRefName:item.status?item.status+' · '+(item.conclusion||''):item.updatedAt||''));if(action==='githubPRs')for(const [key,label] of [['githubPRDiff','Diff'],['githubPRChecks','검사'],['githubPRCheckout','체크아웃']]){const b=el('button',label);b.onclick=async()=>{advancedDialog.close();await openCommand(key);const n=$('command-number');if(n)n.value=item.number};row.append(b)}list.append(row)}if(!result.length)list.append(el('p','표시할 항목이 없습니다.'))}catch(e){list.textContent=e.message}}

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
const gitlabNav=el('button','GitLab','nav');gitlabNav.id='gitlabNav';gitlabNav.setAttribute('aria-haspopup','dialog');PgitIcons.label(gitlabNav,'gitlab','GitLab');integrations.append(gitlabNav);gitlabNav.onclick=()=>showGitLab();
let gitlabViewRequest=0;
async function showGitLab(action='gitlabMRs',remote){
 if(!state)return notify('먼저 저장소를 여세요.');
 const request=++gitlabViewRequest,root=state.root;remote=remote||(state.remotes.includes('origin')?'origin':state.remotes[0]);
 const body=advancedFrame('GitLab · '+root.split('/').pop(),'list');
 const tabs=el('div',undefined,'git-toolbar'),select=el('select');select.setAttribute('aria-label','원격');
 for(const name of state.remotes){const option=el('option',name);option.value=name;select.append(option)}select.value=remote||'';select.onchange=()=>showGitLab(action,select.value);tabs.append(select);
 for(const [key,label] of [['gitlabMRs','Merge Requests'],['gitlabIssues','Issues'],['gitlabPipelines','Pipelines']]){const b=el('button',label,key===action?'active':'');b.setAttribute('aria-pressed',String(key===action));b.onclick=()=>showGitLab(key,remote);tabs.append(b)}
 body.append(tabs);const list=el('div');list.setAttribute('aria-live','polite');body.append(list);
 if(!remote){list.textContent='원격 저장소가 없습니다.';return}
 if(action!=='gitlabPipelines'){const create=el('button',action==='gitlabMRs'?'Draft MR 만들기':'GitLab 이슈 만들기');create.onclick=()=>command(action==='gitlabMRs'?'gitlabMRCreate':'gitlabIssueCreate');body.append(create)}
 async function command(key,number){advancedDialog.close();await openCommand(key);const field=$('command-remote');if(field){field.value=remote;field.dispatchEvent(new Event('change',{bubbles:true}))}if(number)$('command-number').value=number}
 list.append(el('p','불러오는 중…'));
 try{const items=JSON.parse(await api(action,{remote}));if(request!==gitlabViewRequest||state.root!==root||!body.isConnected)return;list.replaceChildren();
 for(const item of items){const row=el('div',undefined,'provider-row');row.append(el('strong',(item.iid?'#'+item.iid+' · ':'')+(item.title||'#'+item.id+' · '+item.ref),'literal-data'),el('p',item.source_branch?item.source_branch+' → '+item.target_branch:item.status||item.updated_at||''));
 if(action==='gitlabMRs')for(const [key,label] of [['gitlabMRDiff','Diff'],['gitlabMRChecks','검사'],['gitlabMRCheckout','체크아웃'],['gitlabMRComment','MR 댓글 게시']]){const b=el('button',label);b.onclick=()=>command(key,item.iid);row.append(b)}list.append(row)}if(!items.length)list.append(el('p','표시할 항목이 없습니다.'));
 }catch(e){if(request===gitlabViewRequest&&body.isConnected)list.textContent=e.message}
}
