import http from 'node:http';
import {repositoryRevision} from './refresh.mjs';
import {randomBytes} from 'node:crypto';
import {readFile,realpath} from 'node:fs/promises';
import * as git from './git.mjs';
import {fullState,operate,readOperations,createRepository} from './operations.mjs';
import {advanced,advancedActions,advancedReads} from './advanced.mjs';
import {provider,providerActions} from './providers.mjs';
import {comparisonFiles,comparisonFile,workingComparison} from './comparison.mjs';
const token=randomBytes(32).toString('hex');
const workspaces=new Map(), busyWorkspaces=new Set(), busyRoots=new Set();
const assets=new Set(['theme-catalog.js','tooltips.js','icons.js','settings.css','history-tools.js','history-model.js','auto-refresh.js','worktrees.js','merge-preview.js','conflict-model.js','conflict-editor.js','settings.js','themes.css','controls.css','check.svg','chevron.svg','branch.svg','changes.js','workspace.js','workspace.css','logo.svg','logo.png','advanced.js','providers.js','diff-layout.js','comparison.js','comparison.css','shell.js','arctic.js','arctic.css','shell.css','frost.css','graph-workspace.js','frost-select.js','workflow-tools.js','locales.js','i18n.js','code-syntax.js','diff-viewer.js']);
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const host=`127.0.0.1:${server.address().port}`;
 if(req.headers.host!==host){res.writeHead(403);return res.end('Forbidden')}
 try{
  const pathname=new URL(req.url,`http://${host}`).pathname;
  if(req.method==='GET'&&assets.has(pathname.slice(1))){res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.css')?'text/css':pathname.endsWith('.png')?'image/png':'image/svg+xml');return res.end(await readFile(new URL('./public'+pathname,import.meta.url)))}
  if(req.method==='GET'&&['/','/workspace'].includes(pathname)){
   res.setHeader('Content-Type','text/html; charset=utf-8');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'");
   return res.end((await readFile(new URL(pathname==='/'?'./public/shell.html':'./public/index.html',import.meta.url),'utf8')).replace('__PGIT_TOKEN__',token));
  }
  if(req.method!=='POST'||pathname!=='/api'){res.writeHead(404);return res.end()}
  if(req.headers.origin!==`http://${host}`||req.headers['x-pgit-token']!==token){res.writeHead(403);return res.end('Forbidden')}
  let body='';for await(const c of req){body+=c;if(Buffer.byteLength(body)>2100000)throw Error('요청이 너무 큽니다.')}
  const {action,workspaceId='default',...data}=JSON.parse(body);
  if(typeof workspaceId!=='string'||!/^[-a-zA-Z0-9_]{1,80}$/.test(workspaceId))throw Error('잘못된 작업 공간입니다.');
  if(busyWorkspaces.has(workspaceId))throw Error('이 프로젝트에서 다른 작업이 진행 중입니다.');
  // Capture the root before awaiting. Another tab can never redirect this operation.
  let root=workspaces.get(workspaceId),lockedRoot=null;
  busyWorkspaces.add(workspaceId);
  let result;
  try{
   if(action==='resolveRepo'){result=await git.openRepo(data.path)}
   else if(action==='closeWorkspace'){workspaces.delete(workspaceId);result=true}
   else {
    if(['open','init','clone'].includes(action)){
     if(!workspaces.has(workspaceId)&&workspaces.size>=50)throw Error('프로젝트는 최대 50개까지 열 수 있습니다.');
     root=action==='open'?await git.openRepo(data.path):await createRepository(action,data);
    }
    if(!root)throw Error('먼저 저장소를 여세요.');
    if(busyRoots.has(root))throw Error('같은 저장소에서 다른 작업이 진행 중입니다.');
    busyRoots.add(root);lockedRoot=root;
    if(action==='worktreeRemove'){const target=await realpath(data.path);if([...workspaces.values()].includes(target))throw Error('열려 있는 프로젝트 탭을 먼저 닫으세요.');}
    if(['open','init','clone'].includes(action)){result=await fullState(root);workspaces.set(workspaceId,root)}
    else switch(action){
     case 'workingComparison':result=await workingComparison(root,data);break;
     case 'comparisonFiles':result=await comparisonFiles(root,data);break;
     case 'comparisonFile':result=await comparisonFile(root,data);break;
     case 'refreshState':{const revision=await repositoryRevision(root);result={revision,state:revision===data.revision?null:await fullState(root,data.limit)};break;}
     case 'state':result=await fullState(root,data.limit);break;
     case 'diff':result=await git.diff(root,data.name,!!data.staged);break;
     case 'commitDiff':result=await git.commitDiff(root,data.hash);break;
     case 'stage':await git.stage(root,data.name,!!data.value);result=await fullState(root,data.limit);break;
     case 'stageAll':await git.stageAll(root,data.value);result=await fullState(root,data.limit);break;
     case 'commit':await git.commit(root,data.message);result=await fullState(root,data.limit);break;
     default:result=providerActions.has(action)?await provider(root,action,data):advancedActions.has(action)?await advanced(root,action,data):await operate(root,action,data);if(!readOperations.has(action)&&!advancedReads.has(action)&&!providerActions.has(action))result=await fullState(root,data.limit);
    }
   }
  }finally{busyWorkspaces.delete(workspaceId);if(lockedRoot)busyRoots.delete(lockedRoot)}
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({result}));
 }catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.stderr||e.message}));}
});
export {server};
export const ready=new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}/`;console.log(`pGit: ${url}`);resolve(url)});});
