import test from 'node:test';import assert from 'node:assert/strict';import {githubArgs,parseGitHubRemote} from '../providers.mjs';
test('GitHub adapter parses origin without credentials or arbitrary command options',()=>{assert.equal(parseGitHubRemote('git@github.com:Polar-Little-Lab/pGit.git'),'github.com/Polar-Little-Lab/pGit');assert.equal(parseGitHubRemote('https://github.example.com/team/repo.git'),'github.example.com/team/repo');assert.throws(()=>parseGitHubRemote('https://token@github.com/team/repo'));assert.throws(()=>githubArgs('githubPRDiff',{number:'--help'}));assert.throws(()=>githubArgs('runShell'));const args=githubArgs('githubPRCreate',{title:'Test',body:'$(touch bad)\ntext',base:'main',head:'feature'});assert.ok(args.includes('$(touch bad)\ntext'));assert.ok(args.includes('--draft'));});

import {parseGitLabRemote,gitlabArgs,gitlabProvider} from '../providers.mjs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {git} from '../git.mjs';
test('GitLab self-hosted subgroups, HTTPS ports and safe argument construction',()=>{
 const remote=parseGitLabRemote('git@git.company.test:division/team/project.git');assert.equal(remote.project,'division/team/project');assert.equal(remote.host,'git.company.test');
 assert.equal(parseGitLabRemote('https://git.company.test:8443/division/repo.git').host,'git.company.test:8443');
 assert.equal(parseGitLabRemote('ssh://git@git.company.test:2222/division/repo.git').host,'git.company.test');
 for(const value of ['https://token@git.company.test/a/b','https://git.company.test/a/b?token=secret','file:///a/b','--help'])assert.throws(()=>parseGitLabRemote(value));
 assert.deepEqual(gitlabArgs('gitlabMRs',{},remote),['api','projects/division%2Fteam%2Fproject/merge_requests?state=opened&per_page=50','--hostname','git.company.test']);
 assert.throws(()=>gitlabArgs('gitlabMRDiff',{number:'--help'},remote));assert.throws(()=>gitlabArgs('shell',{},remote));
 assert.ok(gitlabArgs('gitlabMRCreate',{title:'Title',body:'$(touch bad)',head:'feature',base:'main'},remote).includes('description=$(touch bad)'));
});
test('GitLab uses chosen remote and blocks checkout with local changes before invoking CLI',async t=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pgit-gitlab-'));t.after(()=>rm(root,{recursive:true,force:true}));await git(root,['init','-b','main']);await git(root,['config','user.name','Test']);await git(root,['config','user.email','test@example.invalid']);await writeFile(path.join(root,'file'),'base');await git(root,['add','.']);await git(root,['commit','-m','base']);await git(root,['remote','add','company','git@git.company.test:division/team/project.git']);
 let calls=0;const run=async(binary,args,options)=>{calls++;assert.equal(binary,'glab');assert.equal(options.env.GITLAB_HOST,'git.company.test');assert.ok(args.includes('git.company.test'));return {stdout:'[]'}};
 assert.equal(await gitlabProvider(root,'gitlabMRs',{remote:'company'},run),'[]');assert.equal(calls,1);
 await writeFile(path.join(root,'file'),'changed');await assert.rejects(gitlabProvider(root,'gitlabMRCheckout',{remote:'company',number:1},run),/깨끗/);assert.equal(calls,1);
 await assert.rejects(gitlabProvider(root,'gitlabMRs',{remote:'missing'},run),/원격/);
});
