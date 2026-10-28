const fs=require('node:fs/promises');
function normalizeWorkspace(value){
 const path=p=>typeof p==='string'&&p.startsWith('/')&&p.length<=4096&&!p.includes('\0');
 if(!value||typeof value!=='object')return {projects:[],activePath:null,recents:[]};
 const paths=[...new Set((Array.isArray(value.projects)?value.projects:[]).map(p=>p?.path).filter(path))].slice(0,50);
 return {...(['light','glacier','snow','dark','aurora','midnight','system'].includes(value.theme)?{theme:value.theme}:{}),...(['ko','en'].includes(value.language)?{language:value.language}:{}),projects:paths.map(p=>({path:p,name:p.split('/').pop()})),activePath:paths.includes(value.activePath)?value.activePath:null,recents:[...new Set((Array.isArray(value.recents)?value.recents:[]).filter(path))].slice(0,18)};
}
async function readWorkspace(file){try{return normalizeWorkspace(JSON.parse(await fs.readFile(file,'utf8')))}catch{return normalizeWorkspace(null)}}
let pending=Promise.resolve();
function writeWorkspace(file,value){const data=JSON.stringify(normalizeWorkspace(value));const next=pending.then(async()=>{await fs.writeFile(file+'.tmp',data,{mode:0o600});await fs.rename(file+'.tmp',file)});pending=next.catch(()=>{});return next}
module.exports={normalizeWorkspace,readWorkspace,writeWorkspace};
