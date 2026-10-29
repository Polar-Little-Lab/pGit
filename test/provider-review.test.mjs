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
