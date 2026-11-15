import test from 'node:test';
import assert from 'node:assert/strict';
import {createUpdateChecker,compareStableRelease} from '../desktop/updates.cjs';
const release=tag=>({ok:true,status:200,json:async()=>({tag_name:tag,draft:false,prerelease:false,html_url:'https://evil.invalid'})});
test('compares numeric release versions, prereleases and build metadata',()=>{
 assert.equal(compareStableRelease('1.9.0','v1.10.0'),-1);
 assert.equal(compareStableRelease('2.0.0','v1.10.0'),1);
 assert.equal(compareStableRelease('1.2.3+build','v1.2.3'),0);
 assert.equal(compareStableRelease('1.2.3-beta.1','v1.2.3'),-1);
 for(const tag of ['v1.2','garbage','v1.2.3-beta'])assert.throws(()=>compareStableRelease('1.2.3',tag));
});
test('deduplicates requests, briefly caches success, and builds a trusted release URL',async()=>{
 let calls=0,clock=0,resolve;
 const check=createUpdateChecker({now:()=>clock,fetchImpl:async(url,options)=>{
  calls++;assert.equal(url,'https://api.github.com/repos/Polar-Little-Lab/pGit/releases/latest');assert.equal(options.redirect,'error');assert.ok(options.signal);await new Promise(r=>resolve=r);return release('v1.10.0');
 }});
 const a=check('1.9.0'),b=check('1.9.0');assert.equal(a,b);resolve();
 assert.deepEqual(await a,{status:'available',version:'1.10.0',url:'https://github.com/Polar-Little-Lab/pGit/releases/tag/v1.10.0'});
 await check('1.9.0');assert.equal(calls,1);
 clock=60001;const next=check('1.9.0');resolve();await next;assert.equal(calls,2);
});
test('handles latest, ahead, missing releases, throttling, malformed responses, and offline retry',async()=>{
 for(const [current,status] of [['1.2.3','current'],['1.3.0','ahead']])assert.equal((await createUpdateChecker({fetchImpl:async()=>release('v1.2.3')})(current)).status,status);
 for(const [code,status] of [[404,'unavailable'],[403,'rate-limited'],[429,'rate-limited'],[500,'error']])assert.equal((await createUpdateChecker({fetchImpl:async()=>({ok:false,status:code})})('1.0.0')).status,status);
 for(const data of [{tag_name:'oops'},{tag_name:'v2.0.0',draft:true},{tag_name:'v2.0.0',prerelease:true}])assert.equal((await createUpdateChecker({fetchImpl:async()=>({ok:true,json:async()=>data})})('1.0.0')).status,'error');
 let offline=true;const check=createUpdateChecker({fetchImpl:async()=>{if(offline)throw Error('offline');return release('v1.2.3')}});
 assert.equal((await check('1.0.0')).status,'error');offline=false;assert.equal((await check('1.0.0')).status,'available');
});
