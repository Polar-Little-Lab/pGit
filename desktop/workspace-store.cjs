const fs=require('node:fs/promises');
const pathsUtil=require('../path-utils.cjs');
const groupModel=require('../project-groups.cjs');
function normalizeWorkspace(value){
 const path=pathsUtil.isAbsolute;
 if(!value||typeof value!=='object')return {projects:[],activePath:null,recents:[]};
 const paths=[...new Set((Array.isArray(value.projects)?value.projects:[]).map(p=>p?.path).filter(path))].slice(0,50);
 const typography={};for(const [key,choices] of Object.entries({uiSize:[12,14,16],codeSize:[12,14,16,18,20],font:['system','menlo','monaco','consolas'],spacing:[1.5,1.833,2.2]}))if(choices.includes(value.typography?.[key]))typography[key]=value.typography[key];
 const missingPaths=[...new Set((Array.isArray(value.missingPaths)?value.missingPaths:[]).filter(path))].slice(0,18);
 const recentDetails={};for(const p of (Array.isArray(value.recents)?value.recents:[]).filter(path).slice(0,18)){const d=value.recentDetails?.[p];if(d&&typeof d==='object')recentDetails[p]={pinned:d.pinned===true,...(typeof d.branch==='string'?{branch:d.branch.slice(0,1024)}:{}),...(Number.isFinite(d.openedAt)&&d.openedAt>0?{openedAt:d.openedAt}:{})}}
 return {...groupModel.normalize(value),...(Object.keys(recentDetails).length?{recentDetails}:{}),...(missingPaths.length?{missingPaths}:{}),...(Object.keys(typography).length?{typography}:{}),...(['light','glacier','snow','dark','aurora','midnight','system'].includes(value.theme)?{theme:value.theme}:{}),...(['ko','en','ja','zh-CN','es','fr'].includes(value.language)?{language:value.language}:{}),projects:paths.map(p=>({path:p,name:pathsUtil.basename(p)})),activePath:paths.includes(value.activePath)?value.activePath:null,recents:[...new Set((Array.isArray(value.recents)?value.recents:[]).filter(path))].slice(0,18)};
}
async function readWorkspace(file){try{return normalizeWorkspace(JSON.parse(await fs.readFile(file,'utf8')))}catch{return normalizeWorkspace(null)}}
let pending=Promise.resolve();
function writeWorkspace(file,value){const data=JSON.stringify(normalizeWorkspace(value));const next=pending.then(async()=>{await fs.writeFile(file+'.tmp',data,{mode:0o600});await fs.rename(file+'.tmp',file)});pending=next.catch(()=>{});return next}
module.exports={normalizeWorkspace,readWorkspace,writeWorkspace};
