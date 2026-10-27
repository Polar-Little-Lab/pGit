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
export function parseGitHubRemote(url){let match=url.match(/^git@([\w.-]+):([\w.-]+)\/([\w.-]+?)(?:\.git)?$/)||url.match(/^https:\/\/([\w.-]+)\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/)||url.match(/^ssh:\/\/git@([\w.-]+)\/([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);if(!match)throw Error('origin에 GitHub HTTPS 또는 SSH 원격을 설정하세요.');return match[1]+'/'+match[2]+'/'+match[3]}
export async function provider(root,action,d={}){const remote=await git(root,['remote','get-url','origin']).then(s=>s.trim(),()=>{throw Error('origin 원격이 없습니다.')});const repo=parseGitHubRemote(remote);if(action==='githubPRCheckout'){if((await snapshot(root)).files.length||(await extras(root)).operation)throw Error('작업 폴더가 깨끗하고 진행 중인 작업이 없어야 합니다.');}const args=[...githubArgs(action,d),'--repo',repo];try{const {stdout}=await exec('gh',args,{cwd:root,timeout:120000,maxBuffer:8*1024*1024,env:{...process.env,GH_PROMPT_DISABLED:'1',GH_PAGER:'cat',NO_COLOR:'1'}});return stdout||'완료'}catch(e){if(action==='githubPRChecks'&&[1,8].includes(e.code)&&e.stdout)return e.stdout;if(e.code==='ENOENT')throw Error('GitHub CLI(gh)를 설치하고 터미널에서 gh auth login으로 로그인하세요.');throw Error(e.stderr||e.message)}}
