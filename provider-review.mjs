import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {git} from './git.mjs';
import {parseGitHubRemote,parseGitLabRemote} from './provider-remotes.mjs';
const exec=promisify(execFile);
export const reviewActions=['reviewDetail','reviewFiles','reviewChecks','reviewComments','reviewSubmit','reviewThreads','reviewInline','reviewReply','reviewResolve','reviewMergePreview','reviewMerge'];
const positive=value=>{if(!/^[1-9]\d{0,14}$/.test(String(value)))throw Error('잘못된 번호');return String(value)};
const bodyText=value=>{if(typeof value!=='string'||!value.trim()||value.length>4000||value.includes('\0'))throw Error('댓글을 1~4,000자로 입력하세요.');return value.trim()};
const discussion=value=>{if(typeof value!=='string'||!/^[a-f0-9]{40}$/.test(value))throw Error('잘못된 스레드');return value};
const sha=value=>{if(!/^[a-f0-9]{40,64}$/.test(value||''))throw Error('검토할 커밋을 다시 불러오세요.');return value};
export function reviewRequest(provider,repo,action,d){
 const id=positive(d.number),page=positive(d.page||1),gh=provider==='github';
 if(!['github','gitlab'].includes(provider))throw Error('지원하지 않는 연동');
 const prefix=gh?`repos/${repo.project}/pulls/${id}`:`projects/${encodeURIComponent(repo.project)}/merge_requests/${id}`;
 let endpoint=prefix,fields=null,method='POST';
 if(action==='reviewGate'&&gh)return ['gh',['pr','view',id,'--repo',repo.host+'/'+repo.project,'--json','headRefOid,baseRefOid,mergeStateStatus,reviewDecision,statusCheckRollup']];
 if(action==='reviewProject')endpoint=gh?`repos/${repo.project}`:`projects/${encodeURIComponent(repo.project)}`;
 else if(action==='reviewThreads')endpoint+=gh?`/comments?per_page=100&page=${page}`:`/discussions?per_page=100&page=${page}`;
 else if(action==='reviewThread')endpoint=gh?`repos/${repo.project}/pulls/comments/${positive(d.thread)}`:prefix+'/discussions/'+discussion(d.thread);
 else if(action==='reviewReply'){endpoint+=gh?`/comments/${positive(d.thread)}/replies`:'/discussions/'+discussion(d.thread)+'/notes';fields={body:bodyText(d.body)}}
 else if(action==='reviewResolve'&&!gh){if(typeof d.resolved!=='boolean')throw Error('잘못된 해결 상태');endpoint+='/discussions/'+discussion(d.thread);fields={resolved:d.resolved};method='PUT'}
 else if(action==='reviewInline'){
  if(typeof d.path!=='string'||!d.path||d.path.includes('\0'))throw Error('잘못된 파일 경로');
  const line=d.after??d.before;positive(line);
  if(gh){endpoint+='/comments';fields={body:bodyText(d.body),commit_id:sha(d.head),path:d.path,line:Number(line),side:d.after!==undefined?'RIGHT':'LEFT'}}
  else {endpoint+='/discussions';fields={body:bodyText(d.body),'position[position_type]':'text','position[base_sha]':sha(d.base),'position[start_sha]':sha(d.start),'position[head_sha]':sha(d.head),'position[old_path]':d.oldPath,'position[new_path]':d.path};if(d.before!==undefined)fields['position[old_line]']=Number(positive(d.before));if(d.after!==undefined)fields['position[new_line]']=Number(positive(d.after))}
 }
 else if(action==='reviewMerge'){
  if(!(gh?['merge','squash','rebase']:['merge','squash']).includes(d.method))throw Error('잘못된 병합 방식');
  endpoint+='/merge';method='PUT';fields=gh?{sha:sha(d.head),merge_method:d.method}:{sha:sha(d.head),squash:d.method==='squash',auto_merge:false,should_remove_source_branch:false};
 }
 else if(action==='reviewFiles')endpoint+=gh?`/files?per_page=100&page=${page}`:`/diffs?per_page=100&page=${page}`;
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
 return [gh?'gh':'glab',['api',endpoint,'--hostname',repo.host,...(fields?['--method',method,...Object.entries(fields).flatMap(([key,value])=>[typeof value==='string'?'--raw-field':'--field',key+'='+value])]:[])]];
}
export function normalizeReview(provider,item){const gh=provider==='github';return {
 number:gh?item.number:item.iid,title:item.title||'',description:(gh?item.body:item.description)||'',author:gh?item.user?.login:item.author?.username,
 source:gh?item.head?.label:item.source_branch,target:gh?item.base?.label:item.target_branch,
 start:gh?undefined:item.diff_refs?.start_sha,canMerge:gh?undefined:item.user?.can_merge,pipeline:gh?undefined:item.head_pipeline,
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
 const check=async()=>{const current=await detail();if(current.head!==sha(d.head)||d.base&&current.base!==d.base||d.start&&current.start!==d.start)throw Error('원격 커밋이 변경되었습니다. 상세 화면을 새로고침하세요.');return current};
 async function mergePlan(){
  const current=await check(),project=await request('reviewProject');let methods=[],reasons=[];
  if(!['open','opened'].includes(current.state)||current.draft)reasons.push('열려 있는 정식 PR/MR만 병합할 수 있습니다.');
  if(d.provider==='github'){
   const gate=await request('reviewGate');if(gate.headRefOid!==current.head||gate.baseRefOid!==current.base)throw Error('원격 커밋이 변경되었습니다.');
   if(gate.mergeStateStatus!=='CLEAN')reasons.push('병합 상태: '+gate.mergeStateStatus);
   if(['REVIEW_REQUIRED','CHANGES_REQUESTED'].includes(gate.reviewDecision))reasons.push('승인 상태: '+gate.reviewDecision);
   const checks=gate.statusCheckRollup;if(!Array.isArray(checks)||checks.some(c=>c.__typename==='StatusContext'?c.state!=='SUCCESS':c.status!=='COMPLETED'||!['SUCCESS','NEUTRAL','SKIPPED'].includes(c.conclusion)))reasons.push('완료되지 않았거나 실패한 검사가 있습니다.');
   if(!project.permissions?.push&&!project.permissions?.maintain&&!project.permissions?.admin)reasons.push('병합 권한을 확인할 수 없습니다.');
   methods=['merge','squash','rebase'].filter(m=>project[{merge:'allow_merge_commit',squash:'allow_squash_merge',rebase:'allow_rebase_merge'}[m]]===true);
  }else{
   if(current.mergeStatus!=='mergeable')reasons.push('병합 상태: '+current.mergeStatus);
   if(current.canMerge!==true)reasons.push('병합 권한을 확인할 수 없습니다.');
   if(current.pipeline&&(!['success','skipped'].includes(current.pipeline.status)||current.pipeline.sha!==current.head))reasons.push('현재 커밋의 파이프라인이 통과하지 않았습니다.');
   if(project.only_allow_merge_if_pipeline_succeeds&&(!current.pipeline||current.pipeline.status==='skipped'&&!project.allow_merge_on_skipped_pipeline))reasons.push('필수 파이프라인이 통과하지 않았습니다.');
   methods=project.squash_option==='always'?['squash']:project.squash_option==='never'?['merge']:['default_on','default_off'].includes(project.squash_option)?['merge','squash']:[];
  }
  if(!methods.length)reasons.push('사용할 수 있는 병합 방식이 없습니다.');await check();return {head:current.head,base:current.base,source:current.source,target:current.target,methods,reasons,allowed:reasons.length===0};
 }
 if(action==='reviewMergePreview')return mergePlan();
 if(action==='reviewMerge'){
  if(d.confirm!==true)throw Error('대상 브랜치와 커밋을 확인하세요.');const plan=await mergePlan();if(!plan.allowed||!plan.methods.includes(d.method))throw Error(plan.reasons.join('\n')||'병합 방식이 변경되었습니다.');
  const result=await request(action);if(d.provider==='github'?result.merged!==true:result.state!=='merged')throw Error('서버가 병합 완료를 확인하지 않았습니다. 새로고침하세요.');return {merged:true};
 }
 if(action==='reviewInline'){
  const current=await check();if(!['open','opened'].includes(current.state))throw Error('닫힌 PR/MR에는 새 줄 댓글을 게시할 수 없습니다.');
  const files=await request('reviewFiles',{page:d.filePage||1});const file=files.find(f=>(d.provider==='github'?f.filename:f.new_path)===d.path);if(!file)throw Error('변경 파일을 다시 선택하세요.');
  const oldPath=d.provider==='github'?file.previous_filename||file.filename:file.old_path,patch=d.provider==='github'?file.patch:file.diff;
  if(oldPath!==d.oldPath||!patch||file.too_large||file.collapsed||!patchContainsLine(patch,d.before,d.after))throw Error('댓글을 달 줄이 현재 Diff에 없습니다.');
  await check();await request(action,{oldPath,start:current.start});return {posted:true};
 }
 if(action==='reviewReply'||action==='reviewResolve'){
  await check();const thread=await request('reviewThread');
  if(d.provider==='github'&&(thread.in_reply_to_id||!thread.pull_request_url?.endsWith('/pulls/'+positive(d.number))))throw Error('선택한 PR의 원본 스레드가 아닙니다.');
  if(action==='reviewResolve'&&!thread.notes?.some(n=>n.resolvable))throw Error('해결 상태를 변경할 수 없는 스레드입니다.');
  await request(action);return {posted:true};
 }
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

export function patchContainsLine(patch,before,after){
 if(before===undefined&&after===undefined)return false;
 for(const value of [before,after])if(value!==undefined&&(!Number.isInteger(value)||value<1))return false;
 let old,newer,remainingOld=0,remainingNew=0;
 for(const line of patch.split('\n')){const h=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(h){old=Number(h[1]);newer=Number(h[3]);remainingOld=Number(h[2]??1);remainingNew=Number(h[4]??1);continue}
  let a,b;if(line[0]==='-'&&remainingOld>0){a=old++;remainingOld--}else if(line[0]==='+'&&remainingNew>0){b=newer++;remainingNew--}else if(line[0]===' '&&remainingOld>0&&remainingNew>0){a=old++;b=newer++;remainingOld--;remainingNew--}else continue;
  if(a===before&&b===after)return true;
 }return false;
}
