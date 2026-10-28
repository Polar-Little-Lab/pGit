import {git} from './git.mjs';
export async function cherryPickPlan(root,refs){
 if(!Array.isArray(refs)||refs.length<2||refs.length>100||refs.some(hash=>typeof hash!=='string'||!/^([a-f0-9]{40}|[a-f0-9]{64})$/.test(hash))||new Set(refs).size!==refs.length)throw Error('서로 다른 커밋을 2개에서 100개까지 선택하세요.');
 const commits=new Map();
 for(const hash of refs){
  const line=await git(root,['show','-s','--format=%H%x00%P%x00%s',hash]);
  const [resolved,parents,title]=line.trimEnd().split('\0');
  if(resolved!==hash||parents.split(' ').filter(Boolean).length>1)throw Error('병합 커밋은 여러 커밋 Cherry-pick에서 제외하세요.');
  commits.set(hash,{hash,title});
 }
 // Parent-before-child ordering, including unusual author/committer dates.
 const order=(await git(root,['rev-list','--topo-order',...refs])).trim().split('\n').reverse().filter(hash=>commits.has(hash));
 const head=(await git(root,['rev-parse','--verify','HEAD'])).trim();
 const branch=await git(root,['symbolic-ref','--short','HEAD']).then(value=>value.trim(),()=>'(detached HEAD)');
 return {head,branch,commits:order.map(hash=>commits.get(hash))};
}
