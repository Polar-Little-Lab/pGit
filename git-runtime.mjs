import {fileURLToPath} from 'node:url';
export function shellQuote(value){return "'"+value.replace(/'/g,"'\\''")+"'"}
export function gitScriptCommand(name,{executable=process.execPath,platform=process.platform}={}){
 const script=fileURLToPath(new URL('./scripts/'+name,import.meta.url)).replace(/([\\/])app\.asar([\\/])/,'$1app.asar.unpacked$2');
 const normalized=value=>platform==='win32'?value.replace(/\\/g,'/'):value;
 return shellQuote(normalized(executable))+' '+shellQuote(normalized(script));
}
export function gitEnvironment(env=process.env){return {...env,ELECTRON_RUN_AS_NODE:'1',GIT_TERMINAL_PROMPT:'0',GIT_EDITOR:gitScriptCommand('git-noop.cjs'),GIT_SEQUENCE_EDITOR:gitScriptCommand('git-noop.cjs')}}
export function backgroundGitEnvironment(env=process.env){return {...gitEnvironment(env),GIT_ASKPASS:gitScriptCommand('git-no-prompt.cjs'),SSH_ASKPASS:gitScriptCommand('git-no-prompt.cjs'),GCM_INTERACTIVE:'never',SSH_ASKPASS_REQUIRE:'never',GIT_SSH_COMMAND:'ssh -o BatchMode=yes -o ConnectTimeout=10'}}
