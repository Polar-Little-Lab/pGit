import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import * as git from './git.mjs';
import {fullState,operate,readOperations,createRepository} from './operations.mjs';
import {advanced,advancedActions,advancedReads} from './advanced.mjs';
import {provider,providerActions} from './providers.mjs';
import {comparisonFiles,comparisonFile} from './comparison.mjs';
const token=randomBytes(32).toString('hex');let root=null,busy=false;
const server=http.createServer(async(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');const host=`127.0.0.1:${server.address().port}`;if(req.headers.host!==host){res.writeHead(403);return res.end('Forbidden')}
try{if(req.method==='GET'&&['/workspace.js','/workspace.css','/logo.svg','/advanced.js','/providers.js','/diff-layout.js','/comparison.js','/comparison.css'].includes(req.url)){res.setHeader('Content-Type',req.url.endsWith('.js')?'text/javascript':req.url.endsWith('.css')?'text/css':'image/svg+xml');return res.end(await readFile(new URL('./public'+req.url,import.meta.url)))}if(req.method==='GET'&&req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");return res.end((await readFile(new URL('./public/index.html',import.meta.url),'utf8')).replace('__PGIT_TOKEN__',token))}
if(req.method!=='POST'||req.url!=='/api'){res.writeHead(404);return res.end()}
if(req.headers.origin!==`http://${host}`||req.headers['x-pgit-token']!==token){res.writeHead(403);return res.end('Forbidden')}
let body='';for await(const c of req){body+=c;if(Buffer.byteLength(body)>2100000)throw Error('요청이 너무 큽니다.')}const {action,...data}=JSON.parse(body);if(busy)throw Error('다른 작업이 진행 중입니다. 잠시 후 다시 시도하세요.');busy=true;let result;
try{if(['open','init','clone'].includes(action)){const next=action==='open'?await git.openRepo(data.path):await createRepository(action,data);result=await fullState(next);root=next}else {if(!root)throw Error('먼저 저장소를 여세요.');switch(action){case 'comparisonFiles':result=await comparisonFiles(root,data);break;case 'comparisonFile':result=await comparisonFile(root,data);break;case 'state':result=await fullState(root,data.limit);break;case 'diff':result=await git.diff(root,data.name,!!data.staged);break;case 'commitDiff':result=await git.commitDiff(root,data.hash);break;case 'stage':await git.stage(root,data.name,!!data.value);result=await fullState(root,data.limit);break;case 'commit':await git.commit(root,data.message);result=await fullState(root,data.limit);break;default:result=providerActions.has(action)?await provider(root,action,data):advancedActions.has(action)?await advanced(root,action,data):await operate(root,action,data);if(!readOperations.has(action)&&!advancedReads.has(action)&&!providerActions.has(action))result=await fullState(root,data.limit)}}}finally{busy=false}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({result}));}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.stderr||e.message}));}});
export {server};
export const ready=new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}/`;console.log(`pGit: ${url}`);resolve(url)});});

