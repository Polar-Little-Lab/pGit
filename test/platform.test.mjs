import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import paths from '../path-utils.cjs';import {normalizeWorkspace} from '../desktop/workspace-store.cjs';import {runtimeEnvironment,windowChrome} from '../desktop/platform.cjs';
import {gitScriptCommand,shellQuote} from '../git-runtime.mjs';import {git,openRepo} from '../git.mjs';import {createRepository,operate,fullState} from '../operations.mjs';import {advanced,rebasePlan} from '../advanced.mjs';
test('drive, UNC, POSIX and Korean project paths survive workspace persistence',()=>{
 const valid=['C:\\Users\\사용자\\My Projects\\repo','D:/Projects/repo','\\\\server\\share\\repo','//server/share/repo','/Users/polar/repo'];
 for(const p of valid){assert.equal(paths.isAbsolute(p),true,p);const w=normalizeWorkspace({projects:[{path:p}],activePath:p,recents:[p]});assert.equal(w.projects[0].name,'repo');assert.equal(w.activePath,p);assert.equal(w.recents[0],p)}
 for(const p of ['C:relative','repo','\\relative','\\\\server','',null,'C:\\bad\0path'])assert.equal(paths.isAbsolute(p),false,String(p));
});
test('Windows environment preserves PATH and uses native window controls',()=>{
 const env=runtimeEnvironment({Path:'C:\\Tools;C:\\Windows\\System32',ProgramFiles:'C:\\Program Files',LOCALAPPDATA:'C:\\Users\\사용자\\AppData\\Local'},'win32');assert.equal(env.Path,undefined);assert.ok(env.PATH.startsWith('C:\\Tools;'));assert.ok(env.PATH.includes(';C:\\Program Files\\Git\\cmd'));assert.ok(env.PATH.includes('Programs\\Git\\cmd'));assert.deepEqual(windowChrome('win32'),{frame:true});assert.equal(windowChrome('darwin').titleBarStyle,'hiddenInset');assert.equal(runtimeEnvironment({PATH:'/tools'},'darwin').PATH.split(':')[0],'/tools');
});
test('Git shell helper commands quote spaces and apostrophes without backslash loss',()=>{
 const command=gitScriptCommand('sequence-editor.cjs',{platform:'win32',executable:"C:\\Program Files\\Polar's Git\\pGit.exe"});assert.ok(command.startsWith("'C:/Program Files/Polar'\\''s Git/pGit.exe' "));assert.equal(shellQuote('a$(touch x)'),"'a$(touch x)'");
});
test('create, clone, worktree and reword work in spaced Unicode paths',async t=>{
 const parent=await mkdtemp(path.join(os.tmpdir(),"pgit 공백 ' "));t.after(()=>rm(parent,{recursive:true,force:true}));const root=await createRepository('init',{path:path.join(parent,'My repo')});
 await git(root,['config','user.name','Polar']);await git(root,['config','user.email','test@example.invalid']);await git(root,['config','core.autocrlf','false']);
 await writeFile(path.join(root,'file.txt'),'base\n');await git(root,['add','.']);await git(root,['commit','--edit','-m','base']);const base=(await git(root,['rev-parse','HEAD'])).trim();
 await writeFile(path.join(root,'file.txt'),'second\n');await git(root,['commit','-am','second']);const plan=await rebasePlan(root,base);plan.commits[0].action='reword';plan.commits[0].message='한글 message with spaces';await advanced(root,'rebaseApply',plan);assert.equal((await git(root,['log','-1','--format=%s'])).trim(),plan.commits[0].message);
 const clone=await createRepository('clone',{url:root,path:path.join(parent,'Clone repo')});assert.equal(await openRepo(clone),clone);await operate(root,'worktreeAdd',{path:path.join(parent,'Parallel work'),name:'feature/parallel',ref:'HEAD'});assert.equal((await fullState(root)).worktrees.length,2);
});
test('CRLF working diff remains aligned when global autocrlf conversion is enabled',async t=>{
 const {workingComparison}=await import('../comparison.mjs');await import('../public/diff-layout.js');const root=await mkdtemp(path.join(os.tmpdir(),'pgit-crlf-'));t.after(()=>rm(root,{recursive:true,force:true}));await git(root,['init','-b','main']);await git(root,['config','user.name','Polar']);await git(root,['config','user.email','test@example.invalid']);await git(root,['config','core.autocrlf','true']);await writeFile(path.join(root,'file.txt'),'first\r\nsecond\r\n');await git(root,['add','.']);await git(root,['commit','-m','base']);await writeFile(path.join(root,'file.txt'),'first\r\nchanged\r\n');const result=await workingComparison(root,{name:'file.txt'});const rows=globalThis.PgitDiff.alignDiff(result.before,result.after,result.patch);assert.equal(rows.filter(r=>r.after!==null).map(r=>r.after).join('\n')+'\n',result.after.content);
});
