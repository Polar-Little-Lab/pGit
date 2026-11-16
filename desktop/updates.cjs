const RELEASES='https://github.com/Polar-Little-Lab/pGit/releases';
function parseVersion(value){
 const match=/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value||'');
 if(!match)throw Error('Invalid version');
 return {parts:match.slice(1,4).map(BigInt),prerelease:match[4]};
}
function compareStableRelease(current,latest){
 const a=parseVersion(current),b=parseVersion(latest);
 if(b.prerelease)throw Error('Not a stable release');
 for(let i=0;i<3;i++){if(a.parts[i]!==b.parts[i])return a.parts[i]<b.parts[i]?-1:1}
 return a.prerelease?-1:0;
}
function createUpdateChecker({fetchImpl=globalThis.fetch,now=Date.now,platform=process.platform,arch=process.arch}={}){
 let pending,cached;
 return function check(current){
  if(cached&&cached.current===current&&now()-cached.at<60000)return Promise.resolve(cached.result);
  if(pending)return pending;
  pending=(async()=>{
   try{
    const response=await fetchImpl('https://api.github.com/repos/Polar-Little-Lab/pGit/releases/latest',{headers:{Accept:'application/vnd.github+json','User-Agent':'pGit-update-check','X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout(10000),redirect:'error'});
    if(response.status===404)return {status:'unavailable'};
    if(response.status===403||response.status===429)return {status:'rate-limited'};
    if(!response.ok)throw Error('Release request failed');
    const release=await response.json();
    if(release.draft||release.prerelease)throw Error('Not a public stable release');
    const comparison=compareStableRelease(current,release.tag_name);
    const result={status:comparison<0?'available':comparison>0?'ahead':'current',version:release.tag_name.replace(/^v/,''),url:`${RELEASES}/tag/${encodeURIComponent(release.tag_name)}`};
    const download=require('./update-download.cjs').selectDownload(release,platform,arch);if(download)result.download=download;
    cached={current,at:now(),result};return result;
   }catch{return {status:'error'}}
   finally{pending=null}
  })();
  return pending;
 };
}
module.exports={createUpdateChecker,compareStableRelease};
