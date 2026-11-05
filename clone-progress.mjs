import {spawn} from 'node:child_process';
import {gitEnvironment,gitLaunchError} from './git-runtime.mjs';

export function parseCloneProgress(line){
 const match=line.trim().match(/^(?:remote:\s*)?(Enumerating objects|Counting objects|Compressing objects|Receiving objects|Resolving deltas|Updating files|Checking out files):\s*(?:(\d+)%\s*\((\d+)\/(\d+)\)|(\d+))(.*)$/);
 if(!match)return null;
 const stages={'Enumerating objects':'preparing','Counting objects':'preparing','Compressing objects':'preparing','Receiving objects':'receiving','Resolving deltas':'resolving','Updating files':'checkout','Checking out files':'checkout'};
 const transfer=match[6].match(/,\s*([\d.]+\s*[KMGT]?i?B)\s*\|\s*([\d.]+\s*[KMGT]?i?B\/s)/);
 return {stage:stages[match[1]],percent:match[2]===undefined?null:Math.min(100,Number(match[2])),current:Number(match[3]||match[5]),total:match[4]?Number(match[4]):null,...(transfer?{received:transfer[1],speed:transfer[2]}:{})};
}
export async function cloneWithProgress(parent,url,target,onProgress=()=>{}){
 onProgress({stage:'connecting',percent:null});
 try{await new Promise((resolve,reject)=>{
  const child=spawn('git',['-c','color.ui=false','clone','--progress','--',url,target],{cwd:parent,windowsHide:true,env:{...gitEnvironment(),LC_ALL:'C',LANG:'C'}});
  let pending='',stderr='',timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM')},30*60*1000);
  child.stdout.resume();child.stderr.setEncoding('utf8');
  child.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-16384);pending+=chunk;const lines=pending.split(/[\r\n]/);pending=lines.pop().slice(-4096);for(const line of lines){const progress=parseCloneProgress(line);if(progress)onProgress(progress)}});
  child.once('error',error=>{clearTimeout(timer);reject(error)});
  child.once('close',code=>{clearTimeout(timer);if(timedOut)return reject(Error('복제가 30분 안에 완료되지 않았습니다. 네트워크와 대상 폴더를 확인한 뒤 다시 시도하세요.'));if(code!==0)return reject(Object.assign(Error(stderr.trim()||'저장소 복제에 실패했습니다.'),{code,stderr}));resolve()});
 })}catch(error){throw await gitLaunchError(error,parent)}
 onProgress({stage:'loading',percent:null});
}
