import {parseGitHubRemote,parseGitLabRemote} from './provider-remotes.mjs';
export {parseGitHubRemote,parseGitLabRemote} from './provider-remotes.mjs';
import {reviewProvider,reviewActions} from './provider-review.mjs';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {git,snapshot} from './git.mjs';import {extras} from './operations.mjs';
const exec=promisify(execFile);
const string=(v,label,max=4000)=>{if(typeof v!=='string'||!v.trim()||v.length>max||v.includes('\0'))throw Error(label+'을 입력하세요.');return v.trim()};
const number=v=>{if(!/^[1-9]\d*$/.test(String(v)))throw Error('올바른 번호를 입력하세요.');return String(v)};
export const providerActions=new Set(['githubPRs','githubIssues','githubRuns','githubPRDiff','githubPRChecks','githubPRCreate','githubPRComment','githubPRApprove','githubPRRequestChanges','githubPRCheckout','githubIssueCreate','githubIssueComment']);
export function githubArgs(action,d={}){switch(action){
case 'githubPRs':return ['pr','list','--limit','50','--json','number,title,author,headRefName,baseRefName,isDraft,url,reviewDecision,updatedAt'];
case 'githubIssues':return ['issue','list','--limit','50','--json','number,title,labels,assignees,url,updatedAt'];
case 'githubRuns':return ['run','list','--limit','30','--json','databaseId,displayTitle,headBranch,status,conclusion,url'];
case 'githubPRDiff':return ['pr','diff',number(d.number),'--color','never'];
case 'githubPRChecks':return ['pr','checks',number(d.number),'--json','name,state,link'];
case 'githubPRCreate':return ['pr','create','--draft','--title',string(d.title,'제목',256),'--body',string(d.body,'본문'),'--base',string(d.base,'기준 브랜치',256),'--head',string(d.head,'작업 브랜치',256)];
case 'githubPRComment':return ['pr','comment',number(d.number),'--body',string(d.body,'댓글')];
case 'githubPRApprove':return ['pr','review',number(d.number),'--approve','--body',string(d.body,'리뷰')];
case 'githubPRRequestChanges':return ['pr','review',number(d.number),'--request-changes','--body',string(d.body,'리뷰')];
case 'githubPRCheckout':return ['pr','checkout',number(d.number)];
case 'githubIssueCreate':return ['issue','create','--title',string(d.title,'제목',256),'--body',string(d.body,'본문')];
case 'githubIssueComment':return ['issue','comment',number(d.number),'--body',string(d.body,'댓글')];
default:throw Error('지원하지 않는 GitHub 작업');}}
for(const key of reviewActions)providerActions.add(key);
export async function provider(root,action,d={},execute=exec){if(reviewActions.includes(action))return reviewProvider(root,action,d);if(action.startsWith('gitlab'))return gitlabProvider(root,action,d);const name=string(d.remote||'origin','원격 이름');if(!(await extras(root)).remotes.includes(name))throw Error('원격 저장소가 없습니다.');const remote=(await git(root,['remote','get-url',name])).trim();const repo=parseGitHubRemote(remote);if(action==='githubPRCheckout'){if((await snapshot(root)).files.length||(await extras(root)).operation)throw Error('작업 폴더가 깨끗하고 진행 중인 작업이 없어야 합니다.');}const args=[...githubArgs(action,d),'--repo',repo];try{const {stdout}=await execute('gh',args,{cwd:root,windowsHide:true,timeout:120000,maxBuffer:8*1024*1024,env:{...process.env,GH_PROMPT_DISABLED:'1',GH_PAGER:'cat',NO_COLOR:'1'}});return stdout||'완료'}catch(e){if(action==='githubPRChecks'&&[1,8].includes(e.code)&&e.stdout)return e.stdout;if(e.code==='ENOENT')throw Error('GitHub CLI(gh)를 설치하고 터미널에서 gh auth login으로 로그인하세요.');throw Error(e.stderr||e.message)}}

export const gitlabActions=['gitlabMRs','gitlabIssues','gitlabPipelines','gitlabMRDiff','gitlabMRChecks','gitlabMRCheckout','gitlabMRCreate','gitlabMRComment','gitlabIssueCreate'];
for(const action of gitlabActions)providerActions.add(action);
export function gitlabArgs(action,d,remote){
 const project='projects/'+encodeURIComponent(remote.project), mr=()=>project+'/merge_requests/'+number(d.number);
 const api=(endpoint,fields)=>['api',endpoint,'--hostname',remote.host,...(fields?['--method','POST',...Object.entries(fields).flatMap(([k,v])=>['--raw-field',k+'='+v])]:[])];
 switch(action){
 case 'gitlabMRs':return api(project+'/merge_requests?state=opened&per_page=50');
 case 'gitlabIssues':return api(project+'/issues?state=opened&per_page=50');
 case 'gitlabPipelines':return api(project+'/pipelines?per_page=30');
 case 'gitlabMRChecks':return api(mr()+'/pipelines?per_page=30');
 case 'gitlabMRDiff':return ['mr','diff',number(d.number),'--color','never','--repo',remote.repo];
 case 'gitlabMRCheckout':return ['mr','checkout',number(d.number),'--repo',remote.repo];
 case 'gitlabMRCreate':return api(project+'/merge_requests',{title:'Draft: '+string(d.title,'제목',256),description:string(d.body,'본문'),source_branch:string(d.head,'작업 브랜치',256),target_branch:string(d.base,'기준 브랜치',256)});
 case 'gitlabMRComment':return api(mr()+'/notes',{body:string(d.body,'댓글')});
 case 'gitlabIssueCreate':return api(project+'/issues',{title:string(d.title,'제목',256),description:string(d.body,'본문')});
 default:throw Error('지원하지 않는 GitLab 작업');
 }
}
export async function gitlabProvider(root,action,d={},execute=exec){
 const name=string(d.remote||'origin','원격 이름');if(!(await extras(root)).remotes.includes(name))throw Error('원격 저장소가 없습니다.');
 const remote=parseGitLabRemote((await git(root,['remote','get-url',name])).trim());
 if(action==='gitlabMRCheckout'&&((await snapshot(root)).files.length||(await extras(root)).operation))throw Error('작업 폴더가 깨끗하고 진행 중인 작업이 없어야 합니다.');
 try{const {stdout}=await execute('glab',gitlabArgs(action,d,remote),{cwd:root,windowsHide:true,timeout:120000,maxBuffer:8*1024*1024,env:{...process.env,GITLAB_HOST:remote.host,GLAB_SEND_TELEMETRY:'false',NO_COLOR:'1',GIT_TERMINAL_PROMPT:'0'}});return stdout||'완료'}
 catch(e){if(e.code==='ENOENT')throw Error(`GitLab CLI(glab)를 설치하고 glab auth login --hostname ${remote.host} 명령으로 로그인하세요.`);throw Error(e.stderr||e.message)}
}
