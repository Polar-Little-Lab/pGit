import {git,snapshot} from './git.mjs';

async function commit(root,value){
 if(typeof value!=='string'||!value.trim()||value.startsWith('-')||value.includes('\0')||value.length>4096)throw Error('검사할 참조가 올바르지 않습니다.');
 return (await git(root,['rev-parse','--verify','--end-of-options',value.trim()+'^{commit}'])).trim();
}
async function ancestor(root,a,b){try{await git(root,['merge-base','--is-ancestor',a,b]);return true}catch(error){if(error.code===1)return false;throw error}}
export function parseMergeTree(output){
 const parts=output.split('\0');const tree=parts.shift();if(!/^[a-f0-9]{40,64}$/.test(tree))throw Error('Git 병합 검사 결과를 읽을 수 없습니다.');
 const files=[];while(parts.length&&parts[0])files.push(parts.shift());if(parts[0]==='')parts.shift();
 const messages=[];while(parts.length&&parts[0]){const count=Number(parts.shift());if(!Number.isInteger(count)||count<0||count>parts.length-2)throw Error('Git 병합 검사 결과를 읽을 수 없습니다.');const paths=parts.splice(0,count),type=parts.shift(),message=parts.shift();messages.push({paths,type,message})}
 return {files:[...new Set(files)],messages};
}
export async function mergePreview(root,{ref}={}){
 const [head,target,state]=await Promise.all([commit(root,'HEAD'),commit(root,ref),snapshot(root)]);
 const result={head,target,ref:ref.trim(),branch:state.branch,dirty:state.files.length>0,files:[],messages:[]};
 if(await ancestor(root,target,head))return {...result,status:'upToDate'};
 if(await ancestor(root,head,target))return {...result,status:'fastForward'};
 try{await git(root,['merge-base',head,target])}catch(error){if(error.code===1)return {...result,status:'unrelated'};throw error}
 // External merge drivers can run arbitrary commands; never invoke them in a preview.
 let drivers='';try{drivers=await git(root,['config','--get-regexp','^merge\..*\.driver$'])}catch(error){if(error.code!==1)throw error}
 if(drivers.trim())throw Error('사용자 지정 병합 드라이버가 있어 자동 검사를 지원하지 않습니다.');
 let output,status='clean';
 try{output=await git(root,['merge-tree','--write-tree','--name-only','--messages','-z',head,target])}
 catch(error){if(error.code===1&&typeof error.stdout==='string'&&/^[a-f0-9]{40,64}\0/.test(error.stdout)){output=error.stdout;status='conflicts'}else if(/unknown option|usage: git merge-tree/.test(error.stderr||'')){throw Error('병합 전 검사는 Git 2.38 이상이 필요합니다.')}else throw error}
 return {...result,status,...parseMergeTree(output)};
}
