import test from 'node:test';import assert from 'node:assert/strict';import {reviewRequest,reviewProvider,normalizeReview} from '../provider-review.mjs';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {git} from '../git.mjs';
const head='a'.repeat(40),base='b'.repeat(40);
test('review requests use encoded GitLab subgroups and bind approvals to a SHA',()=>{
 const repo={host:'git.company.test',project:'group/sub/repo'},data={number:7,head,kind:'approve'};
 const [cli,args]=reviewRequest('gitlab',repo,'reviewSubmit',data);assert.equal(cli,'glab');assert.ok(args.includes('projects/group%2Fsub%2Frepo/merge_requests/7/approve'));assert.ok(args.includes('sha='+head));
 const [,github]=reviewRequest('github',{host:'github.com',project:'team/repo'},'reviewSubmit',{...data,kind:'request_changes',body:'$(literal)\nreview'});assert.ok(github.includes('commit_id='+head));assert.ok(github.includes('event=REQUEST_CHANGES'));assert.ok(github.includes('body=$(literal)\nreview'));
 assert.throws(()=>reviewRequest('gitlab',repo,'reviewSubmit',{...data,kind:'request_changes'}));assert.throws(()=>reviewRequest('gitlab',repo,'reviewFiles',{number:'--help'}));assert.throws(()=>reviewRequest('github',repo,'reviewSubmit',{...data,head:'--help'}));
 assert.equal(normalizeReview('gitlab',{iid:7,sha:head,diff_refs:{base_sha:base}}).base,base);
});
async function fixture(t){const root=await mkdtemp(path.join(os.tmpdir(),'pgit-review-'));t.after(()=>rm(root,{recursive:true,force:true}));await git(root,['init']);await git(root,['remote','add','company','git@git.company.test:group/sub/repo.git']);return root}
test('review reads reject changed heads and remapped remotes; stale approvals never post',async t=>{
 const root=await fixture(t);const d={provider:'gitlab',remote:'company',number:7,repoId:'gitlab:git.company.test/group/sub/repo',head,base};let posts=0,reads=0,changed=false;
 const execute=async(cli,args)=>{assert.equal(cli,'glab');if(args.includes('POST')){posts++;return {stdout:'{}'}}if(args[1].includes('/diffs?'))return {stdout:'[]'};reads++;return {stdout:JSON.stringify({iid:7,sha:changed?'c'.repeat(40):head,diff_refs:{base_sha:base},state:'opened'})}};
 const detail=await reviewProvider(root,'reviewDetail',d,execute);assert.equal(detail.repoId,d.repoId);assert.equal((await reviewProvider(root,'reviewFiles',d,execute)).items.length,0);
 changed=true;await assert.rejects(reviewProvider(root,'reviewSubmit',{...d,kind:'approve'},execute),/변경/);assert.equal(posts,0);
 changed=false;await reviewProvider(root,'reviewSubmit',{...d,kind:'approve'},execute);assert.equal(posts,1);
 await git(root,['remote','set-url','company','git@git.company.test:other/repo.git']);await assert.rejects(reviewProvider(root,'reviewFiles',d,execute),/원격/);assert.ok(reads>=4);
});
test('GitHub checks include check runs and legacy commit statuses',async t=>{
 const root=await fixture(t);await git(root,['remote','set-url','company','git@github.com:team/repo.git']);const d={provider:'github',remote:'company',number:7,repoId:'github:github.com/team/repo',head,base};
 const execute=async(cli,args)=>{assert.equal(cli,'gh');const endpoint=args[1];return {stdout:JSON.stringify(endpoint.includes('/check-runs?')?{total_count:1,check_runs:[{name:'CI',status:'completed',conclusion:'success'}]}:endpoint.includes('/statuses?')?[{context:'external/build',state:'failure'}]:{number:7,head:{sha:head},base:{sha:base},state:'open'})}};
 const result=await reviewProvider(root,'reviewChecks',d,execute);assert.equal(result.items.length,2);assert.equal(result.items[1].status,'failure');assert.equal(result.hasMore,false);
});
test('files fetched while remote changes are not returned as a reviewed version',async t=>{
 const root=await fixture(t);let reads=0;const d={provider:'gitlab',remote:'company',number:7,repoId:'gitlab:git.company.test/group/sub/repo',head,base};const execute=async(cli,args)=>({stdout:JSON.stringify(args[1].includes('/diffs?')?[{new_path:'file',diff:'+new'}]:{sha:++reads===1?head:'c'.repeat(40),diff_refs:{base_sha:base}})});await assert.rejects(reviewProvider(root,'reviewFiles',d,execute),/변경/);
});

import {patchContainsLine} from '../provider-review.mjs';
test('inline positions match added, removed and shifted context lines exactly',()=>{
 const patch='@@ -4,2 +4,3 @@\n-old\n+new\n+extra\n context';assert.equal(patchContainsLine(patch,4,undefined),true);assert.equal(patchContainsLine(patch,undefined,5),true);assert.equal(patchContainsLine(patch,5,6),true);assert.equal(patchContainsLine(patch,5,5),false);assert.equal(patchContainsLine(patch,undefined,999),false);assert.equal(patchContainsLine(patch,undefined,undefined),false);
 const repo={host:'git.example.test',project:'group/repo'},data={number:7,head,base,start:base,path:'new.js',oldPath:'old.js',before:5,after:6,body:'@file is literal'};
 const [,args]=reviewRequest('gitlab',repo,'reviewInline',data);assert.ok(args.includes('position[old_line]=5'));assert.ok(args.includes('position[new_line]=6'));assert.ok(args.includes('position[start_sha]='+base));assert.equal(args[args.indexOf('position[new_line]=6')-1],'--field');assert.equal(args[args.indexOf('body=@file is literal')-1],'--raw-field');
 const [,gh]=reviewRequest('github',repo,'reviewInline',{...data,before:4,after:undefined});assert.ok(gh.includes('side=LEFT'));assert.ok(gh.includes('line=4'));
});
test('inline write revalidates file path and patch before sending',async t=>{
 const root=await fixture(t),d={provider:'gitlab',remote:'company',number:7,repoId:'gitlab:git.company.test/group/sub/repo',head,base,start:base,path:'file',oldPath:'file',after:1,body:'review'};let posts=0;
 const execute=async(cli,args)=>{if(args.includes('POST')){posts++;return {stdout:'{}'}}return {stdout:JSON.stringify(args[1].includes('/diffs?')?[{new_path:'file',old_path:'file',diff:'@@ -1 +1 @@\n-old\n+new'}]:{sha:head,diff_refs:{base_sha:base,start_sha:base},state:'opened'})}};
 await assert.rejects(reviewProvider(root,'reviewInline',{...d,after:2},execute),/Diff/);assert.equal(posts,0);await reviewProvider(root,'reviewInline',d,execute);assert.equal(posts,1);
});
test('merge rechecks gates, sends reviewed SHA and never auto-merges or removes source branch',async t=>{
 const root=await fixture(t),d={provider:'gitlab',remote:'company',number:7,repoId:'gitlab:git.company.test/group/sub/repo',head,base,start:base,method:'squash',confirm:true};let blocked=false,writes=0;
 const execute=async(cli,args)=>{if(args.includes('PUT')){writes++;assert.ok(args.includes('sha='+head));assert.ok(args.includes('auto_merge=false'));assert.ok(args.includes('should_remove_source_branch=false'));return {stdout:'{"state":"merged"}'}}return {stdout:JSON.stringify(args[1].includes('/merge_requests/')?{sha:head,diff_refs:{base_sha:base,start_sha:base},state:'opened',user:{can_merge:true},detailed_merge_status:blocked?'not_approved':'mergeable',head_pipeline:{sha:head,status:'success'}}:{squash_option:'always'})}};
 const preview=await reviewProvider(root,'reviewMergePreview',d,execute);assert.equal(preview.allowed,true);assert.deepEqual(preview.methods,['squash']);blocked=true;await assert.rejects(reviewProvider(root,'reviewMerge',d,execute),/not_approved/);assert.equal(writes,0);blocked=false;await assert.rejects(reviewProvider(root,'reviewMerge',{...d,confirm:false},execute),/확인/);await reviewProvider(root,'reviewMerge',d,execute);assert.equal(writes,1);
});
test('GitHub merge refuses pending or failed checks and uses only allowed methods',async t=>{
 const root=await fixture(t);await git(root,['remote','set-url','company','git@github.com:team/repo.git']);const d={provider:'github',remote:'company',number:7,repoId:'github:github.com/team/repo',head,base,method:'squash',confirm:true};let pending=true,posts=0;
 const execute=async(cli,args)=>{if(args[0]==='pr')return {stdout:JSON.stringify({headRefOid:head,baseRefOid:base,mergeStateStatus:'CLEAN',reviewDecision:'APPROVED',statusCheckRollup:[{__typename:'CheckRun',status:pending?'IN_PROGRESS':'COMPLETED',conclusion:pending?null:'SUCCESS'}]})};if(args.includes('PUT')){posts++;assert.ok(args.includes('merge_method=squash'));assert.ok(args.includes('sha='+head));return {stdout:'{"merged":true}'}}return {stdout:JSON.stringify(args[1].includes('/pulls/')?{number:7,head:{sha:head},base:{sha:base},state:'open'}:{permissions:{push:true},allow_squash_merge:true,allow_merge_commit:false,allow_rebase_merge:false})}};
 assert.equal((await reviewProvider(root,'reviewMergePreview',d,execute)).allowed,false);await assert.rejects(reviewProvider(root,'reviewMerge',d,execute),/검사/);assert.equal(posts,0);pending=false;await assert.rejects(reviewProvider(root,'reviewMerge',{...d,method:'rebase'},execute),/방식/);await reviewProvider(root,'reviewMerge',d,execute);assert.equal(posts,1);
});
test('thread reply validates PR ownership; GitLab resolution uses a typed boolean',async t=>{
 const root=await fixture(t),thread='c'.repeat(40),d={provider:'gitlab',remote:'company',number:7,repoId:'gitlab:git.company.test/group/sub/repo',head,base,thread,resolved:true,body:'reply'};let writes=0;
 const run=async(cli,args)=>{if(args.includes('PUT')||args.includes('POST')){writes++;return {stdout:'{}'}}return {stdout:JSON.stringify(args[1].includes('/discussions/')?{notes:[{resolvable:true}]}:{sha:head,diff_refs:{base_sha:base}})}};
 await reviewProvider(root,'reviewReply',d,run);await reviewProvider(root,'reviewResolve',d,run);assert.equal(writes,2);
 const [,args]=reviewRequest('gitlab',{host:'example.com',project:'a/b'},'reviewResolve',d);assert.equal(args[args.indexOf('resolved=true')-1],'--field');
 await git(root,['remote','set-url','company','git@github.com:team/repo.git']);await assert.rejects(reviewProvider(root,'reviewReply',{...d,provider:'github',repoId:'github:github.com/team/repo',thread:'1234567890'},async(cli,args)=>({stdout:JSON.stringify(args[1].includes('/pulls/comments/')?{pull_request_url:'https://api.github.com/repos/team/repo/pulls/99'}:{head:{sha:head},base:{sha:base}})})),/원본/);
});
