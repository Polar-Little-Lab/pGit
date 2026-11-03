import {fileURLToPath} from 'node:url';
import {stat} from 'node:fs/promises';
export function missingRepository(root,cause){return Object.assign(new Error('저장소 폴더를 찾을 수 없습니다. 폴더가 이동되거나 삭제되었는지 확인하고 프로젝트를 다시 여세요.',{cause}),{code:'REPOSITORY_MISSING',repositoryPath:root})}
export async function repositoryExists(root){
 try{await stat(root);return true}catch(error){
  if(!['ENOENT','ENOTDIR'].includes(error.code))throw error;
  // An unavailable drive is not evidence that the repository was deleted.
  const volume=root.match(/^\/Volumes\/[^/]+/)?.[0]||root.match(/^[A-Za-z]:[\\/]/)?.[0]||root.match(/^\\\\[^\\]+\\[^\\]+/)?.[0];
  if(volume)await stat(volume);
  return false;
 }
}
export async function gitLaunchError(error,root){
 if(error.code!=='ENOENT')return error;
 if(root){
  try{if(!await repositoryExists(root))return missingRepository(root,error)}catch(cause){return cause}
 }
 return new Error('Git 실행 파일을 찾을 수 없습니다. Git 설치와 실행 경로를 확인한 뒤 앱을 다시 시작하세요.',{cause:error});
}
export function shellQuote(value){return "'"+value.replace(/'/g,"'\\''")+"'"}
export function gitScriptCommand(name,{executable=process.execPath,platform=process.platform}={}){
 const script=fileURLToPath(new URL('./scripts/'+name,import.meta.url)).replace(/([\\/])app\.asar([\\/])/,'$1app.asar.unpacked$2');
 const normalized=value=>platform==='win32'?value.replace(/\\/g,'/'):value;
 return shellQuote(normalized(executable))+' '+shellQuote(normalized(script));
}
export function gitEnvironment(env=process.env){return {...env,ELECTRON_RUN_AS_NODE:'1',GIT_TERMINAL_PROMPT:'0',GIT_EDITOR:gitScriptCommand('git-noop.cjs'),GIT_SEQUENCE_EDITOR:gitScriptCommand('git-noop.cjs')}}
export function backgroundGitEnvironment(env=process.env){return {...gitEnvironment(env),GIT_ASKPASS:gitScriptCommand('git-no-prompt.cjs'),SSH_ASKPASS:gitScriptCommand('git-no-prompt.cjs'),GCM_INTERACTIVE:'never',SSH_ASKPASS_REQUIRE:'never',GIT_SSH_COMMAND:'ssh -o BatchMode=yes -o ConnectTimeout=10'}}
