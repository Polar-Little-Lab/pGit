import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {git} from './git.mjs';
import {parseGitHubRemote,parseGitLabRemote} from './provider-remotes.mjs';
const exec=promisify(execFile);
export const reviewActions=['reviewDetail','reviewFiles','reviewChecks','reviewComments','reviewSubmit'];
const positive=value=>{if(!/^[1-9]\d{0,8}$/.test(String(value)))throw Error('잘못된 번호');return String(value)};
const sha=value=>{if(!/^[a-f0-9]{40,64}$/.test(value||''))throw Error('검토할 커밋을 다시 불러오세요.');return value};
export function reviewRequest(provider,repo,action,d){
 const id=positive(d.number),page=positive(d.page||1),gh=provider==='github';
 if(!['github','gitlab'].includes(provider))throw Error('지원하지 않는 연동');
 const prefix=gh?`repos/${repo.project}/pulls/${id}`:`projects/${encodeURIComponent(repo.project)}/merge_requests/${id}`;
 let endpoint=prefix,fields=null;
 if(action==='reviewFiles')endpoint+=gh?`/files?per_page=100&page=${page}`:`/diffs?per_page=100&page=${page}`;
 else if(action==='reviewComments')endpoint=gh?`repos/${repo.project}/issues/${id}/comments?per_page=100&page=${page}`:prefix+`/notes?per_page=100&page=${page}&sort=asc&order_by=created_at`;
 else if(action==='reviewReviews'&&gh)endpoint=prefix+`/reviews?per_page=100&page=${page}`;
 else if(action==='reviewStatuses'&&gh)endpoint=`repos/${repo.project}/commits/${sha(d.head)}/statuses?per_page=100&page=${page}`;
 else if(action==='reviewChecks')endpoint=gh?`repos/${repo.project}/commits/${sha(d.head)}/check-runs?per_page=100&page=${page}`:prefix+`/pipelines?per_page=100&page=${page}`;
 else if(action==='reviewSubmit'){
  const kind=d.kind;if(!['comment','approve',...(gh?['request_changes']:[])].includes(kind))throw Error('지원하지 않는 리뷰 작업');
  const body=typeof d.body==='string'?d.body.trim():'';if(body.length>4000||body.includes('\0')||kind!=='approve'&&!body)throw Error('리뷰 내용을 1~4,000자로 입력하세요.');
  if(kind==='comment'){endpoint=gh?`repos/${repo.project}/issues/${id}/comments`:prefix+'/notes';fields={body}}
  else if(gh){endpoint+='/reviews';fields={commit_id:sha(d.head),event:kind==='approve'?'APPROVE':'REQUEST_CHANGES',body}}
  else {endpoint+='/approve';fields={sha:sha(d.head)}}
 }else if(action!=='reviewDetail')throw Error('지원하지 않는 리뷰 작업');
 return [gh?'gh':'glab',['api',endpoint,'--hostname',repo.host,...(fields?['--method','POST',...Object.entries(fields).flatMap(([key,value])=>['--raw-field',key+'='+value])]:[])]];
}
export function normalizeReview(provider,item){const gh=provider==='github';return {
 number:gh?item.number:item.iid,title:item.title||'',description:(gh?item.body:item.description)||'',author:gh?item.user?.login:item.author?.username,
 source:gh?item.head?.label:item.source_branch,target:gh?item.base?.label:item.target_branch,
 head:gh?item.head?.sha:item.sha,base:gh?item.base?.sha:item.diff_refs?.base_sha,
 state:item.state,draft:!!item.draft,url:gh?item.html_url:item.web_url,
 mergeStatus:gh?(item.merged?'merged':item.mergeable===null?'unknown':item.mergeable?'mergeable':'conflicting'):item.detailed_merge_status||item.merge_status,
 fileCount:gh?item.changed_files:item.changes_count,updatedAt:item.updated_at
}}
export async function reviewProvider(root,action,d,execute=exec){
 if(!['github','gitlab'].includes(d.provider))throw Error('지원하지 않는 연동');
 const remote=d.remote||'origin';if(!(await git(root,['remote'])).trim().split('\n').includes(remote))throw Error('원격 저장소가 없습니다.');
 const url=(await git(root,['remote','get-url',remote])).trim();
 let repo;if(d.provider==='gitlab')repo=parseGitLabRemote(url);else{const parts=parseGitHubRemote(url).split('/');repo={host:parts.shift(),project:parts.join('/')}}
 const repoId=d.provider+':'+repo.host+'/'+repo.project;
 if(action!=='reviewDetail'&&d.repoId!==repoId)throw Error('원격 주소가 변경되었습니다. 상세 화면을 다시 여세요.');
 async function request(key,extra={}){const [binary,args]=reviewRequest(d.provider,repo,key,{...d,...extra});try{const {stdout}=await execute(binary,args,{cwd:root,timeout:120000,maxBuffer:8*1024*1024,env:{...process.env,GH_PROMPT_DISABLED:'1',GH_PAGER:'cat',GITLAB_HOST:repo.host,GLAB_SEND_TELEMETRY:'false',NO_COLOR:'1'}});return JSON.parse(stdout)}catch(e){if(e.code==='ENOENT')throw Error(`${binary} CLI를 설치하고 ${repo.host}에 로그인하세요.`);throw Error(e.stderr||e.message)}}
 const detail=()=>request('reviewDetail').then(item=>({...normalizeReview(d.provider,item),repoId}));
 if(action==='reviewDetail')return detail();
 const check=async()=>{const current=await detail();if(current.head!==sha(d.head)||d.base&&current.base!==d.base)throw Error('원격 커밋이 변경되었습니다. 상세 화면을 새로고침하세요.');return current};
 if(action==='reviewSubmit'){
  const current=await check();if(!['open','opened'].includes(current.state))throw Error('열려 있는 PR/MR에서만 리뷰할 수 있습니다.');
  // GitHub attaches reviews to commit_id; GitLab atomically validates sha on approval.
  await request(action);return {posted:true};
 }
 if(action==='reviewFiles'||action==='reviewChecks')await check();
 const result=await request(action);
 let statuses=[];if(action==='reviewChecks'&&d.provider==='github')statuses=await request('reviewStatuses');
 if(action==='reviewFiles'||action==='reviewChecks')await check();
 if(action==='reviewChecks'&&d.provider==='github')return {items:[...(result.check_runs||[]),...statuses.map(item=>({...item,name:item.context,status:item.state,legacy:true}))],hasMore:Number(result.total_count)>Number(d.page||1)*100||statuses.length===100};
 if(action==='reviewComments'&&d.provider==='github'){const reviews=await request('reviewReviews');return {items:[...result,...reviews.map(item=>({...item,created_at:item.submitted_at,reviewState:item.state}))].sort((a,b)=>(a.created_at||'').localeCompare(b.created_at||'')),hasMore:result.length===100||reviews.length===100}}
 if(!Array.isArray(result))throw Error('서버 응답 형식이 올바르지 않습니다.');
 return {items:result,hasMore:result.length===100};
}
