import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import * as git from './git.mjs';
const token=randomBytes(32).toString('hex');let root=null,busy=false;
const server=http.createServer(async(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');const host=`127.0.0.1:${server.address().port}`;if(req.headers.host!==host){res.writeHead(403);return res.end('Forbidden')}
try{if(req.method==='GET'&&req.url==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");return res.end((await readFile(new URL('./public/index.html',import.meta.url),'utf8')).replace('__PGIT_TOKEN__',token))}
if(req.method!=='POST'||req.url!=='/api'){res.writeHead(404);return res.end()}
if(req.headers.origin!==`http://${host}`||req.headers['x-pgit-token']!==token){res.writeHead(403);return res.end('Forbidden')}
let body='';for await(const c of req){body+=c;if(body.length>16000)throw Error('요청이 너무 큽니다.')}const {action,...data}=JSON.parse(body);if(busy)throw Error('다른 작업이 진행 중입니다. 잠시 후 다시 시도하세요.');busy=true;let result;
try{if(action==='open'){root=await git.openRepo(data.path);result=await git.snapshot(root)}else {if(!root)throw Error('먼저 저장소를 여세요.');switch(action){case 'state':result=await git.snapshot(root);break;case 'diff':result=await git.diff(root,data.name,!!data.staged);break;case 'commitDiff':result=await git.commitDiff(root,data.hash);break;case 'stage':await git.stage(root,data.name,!!data.value);result=await git.snapshot(root);break;case 'commit':await git.commit(root,data.message);result=await git.snapshot(root);break;default:throw Error('지원하지 않는 작업입니다.')}}}finally{busy=false}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({result}));}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.stderr||e.message}));}});
export {server};
export const ready=new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}/`;console.log(`pGit: ${url}`);resolve(url)});});
