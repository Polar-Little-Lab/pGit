import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const temp=await realpath(await mkdtemp(path.join('/tmp','pgit-manual-'))),root=temp+'/arctic-notes';let browser;
const manifest=[];
try{
 await git(temp,['init','-b','main',root]);await git(root,['config','user.name','Polar']);await git(root,['config','user.email','polar@example.com']);await mkdir(root+'/src');
 await writeFile(root+'/src/app.js',"export const title = 'Arctic';\n");await git(root,['add','.']);await git(root,['commit','-m','feat: start Arctic notes']);
 await writeFile(root+'/README.md','# Arctic notes\n');await git(root,['add','.']);await git(root,['commit','-m','docs: add introduction']);await writeFile(root+'/notes.txt','Welcome\n');await git(root,['add','.']);await git(root,['commit','-m','feat: add notes']);
 await git(root,['branch','feature/search']);await git(root,['tag','v1.0']);await git(temp,['init','--bare',temp+'/origin.git']);await git(root,['remote','add','origin',temp+'/origin.git']);await git(root,['push','-u','origin','main']);
 await writeFile(root+'/notes.txt','Welcome to Arctic\n');await git(root,['stash','push','-m','Draft notes']);
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(12000);const address=await ready;
 await page.goto(address+'workspace');await page.evaluate(root=>mutate('open',{path:root}),root);
 async function shot(name,targets,modal=true){
  await page.mouse.move(1420,940);const boxes=[];for(const target of targets){await target.waitFor({state:'visible'});const b=await target.boundingBox();if(b)boxes.push(b)}
  await page.evaluate(boxes=>{const host=document.createElement('div');host.id='guide-callouts';host.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147483647';boxes.forEach((b,i)=>{const mark=document.createElement('div');const left=Math.max(5,b.x-2),top=Math.max(17,b.y-2);mark.style.cssText=`position:fixed;left:${left}px;top:${top}px;width:${Math.min(b.width+4,innerWidth-left-5)}px;height:${b.height+4}px;border:3px solid #dc2525;border-radius:5px;box-sizing:border-box`;const num=document.createElement('b');num.textContent=i+1;num.style.cssText='position:absolute;top:-15px;left:-7px;background:#ce2020;color:white;border:2px solid white;border-radius:50%;width:24px;height:24px;text-align:center;font: bold 14px/20px system-ui';mark.append(num);host.append(mark)});(document.querySelector('dialog[open]')||document.body).append(host)},boxes);
  let clip;const dialog=page.locator('dialog[open]').last();if(modal&&await dialog.count()){const b=await dialog.boundingBox(),all=[b,...boxes];const x=Math.max(0,Math.min(...all.map(b=>b.x))-18),y=Math.max(0,Math.min(...all.map(b=>b.y))-18);clip={x,y,width:Math.min(1440,Math.max(...all.map(b=>b.x+b.width))+18)-x,height:Math.min(960,Math.max(...all.map(b=>b.y+b.height))+18)-y}}
  await page.screenshot({path:`docs/images/guide-${name}.png`,...(clip?{clip}:{})});await page.locator('#guide-callouts').evaluate(e=>e.remove());console.log(name);
 }
 async function close(){await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()))}
 async function form(key,values={}){
  await close();await page.evaluate(key=>openCommand(key),key);
  for(const [name,value] of Object.entries(values)){const input=page.locator('#command-'+name);if(await input.count()){if(await input.evaluate(e=>!!e.dataset.commitPicker))await page.evaluate(async({name,value})=>PgitCommitPicker.select(document.getElementById('command-'+name),value),{name,value});else if(await input.evaluate(e=>e.tagName==='SELECT'))await input.selectOption(value,{force:true});else await input.fill(value)}}
  const fields=await page.locator('#commandDialog form label').allTextContents();const title=await page.locator('#commandDialog .bar strong').innerText();
  const targets=page.locator('#commandDialog form').locator('input:visible,.frost-select-trigger:visible');await shot(key.toLowerCase(),[...await targets.all(),page.locator('#commandDialog form button[type=submit]')]);manifest.push({key,title,fields,image:`guide-${key.toLowerCase()}`});
 }
 async function submit(){await page.locator('#commandDialog form button[type=submit]').click();await page.locator('#commandDialog').waitFor({state:'hidden'});await page.locator('#toast').waitFor({state:'hidden'})}
 if(!process.env.PGIT_GUIDE_TAIL){
 // Branch lifecycle: each form and its real result.
 await form('branchCreate',{name:'feature/draft',ref:'HEAD'});await submit();await shot('branchcreate-result',[page.locator('[data-ref="refs/heads/feature/draft"]')],false);assert.match(await git(root,['branch','--list']),/feature\/draft/);
 await form('branchRename',{name:'feature/draft',newName:'feature/ready'});await submit();await shot('branchrename-result',[page.locator('[data-ref="refs/heads/feature/ready"]')],false);
 await form('branchDelete',{name:'feature/ready'});await submit();assert.equal((await git(root,['branch','--list','feature/ready'])).trim(),'');await shot('branchdelete-result',[page.locator('#branches')],false);
 const definitions=await page.evaluate(()=>Object.keys(commands));
 const covered=new Set(['init','clone','branchCreate','branchRename','branchDelete','branchSwitch','worktreeList','worktreeAdd','worktreeRemove','worktreeLock','worktreeUnlock']);
 const examples={remoteAdd:{name:'upstream',url:'https://github.com/octocat/Hello-World.git'},tagCreate:{name:'v1.1',ref:'HEAD',message:'First release'},amend:{message:'feat: refine Arctic notes'},searchHistory:{query:'notes'},rebasePlan:{base:'HEAD~2'},ignoreFile:{name:'local.log'},cherryPick:{ref:'HEAD~1'},revert:{ref:'HEAD'},resetPreview:{ref:'HEAD~1'},compare:{from:'HEAD~1',to:'HEAD'}};
 await writeFile(root+'/local.log','local output\n');
 for(const key of definitions){if(covered.has(key))continue;const values=examples[key]||{};await form(key,values);}
 await writeFile('docs/guide-features.json',JSON.stringify(manifest,null,2)+'\n');
 await close();
 // Read/edit/preview screens beyond their entry forms.
 await writeFile(root+'/notes.txt','Welcome to Arctic notes\n');await page.evaluate(async()=>{state=await api('state');render()});
 for(const [key,data,name] of [['readText',{name:'notes.txt'},'edit-file'],['discardPreview',{name:'notes.txt'},'discard-preview'],['resetPreview',{ref:'HEAD~1'},'reset-preview'],['rebasePlan',{base:'HEAD~2'},'rebase-plan'],['profileRead',{},'author']]){
  await close();if(key==='resetPreview'){await git(root,['stash','push','-u','-m','Save work']);await page.evaluate(async()=>{state=await api('state');render()})}await page.evaluate(({key,data})=>openAdvanced(key,data),{key,data});await page.locator('.advanced-dialog .advanced-body').waitFor();await shot(name,[page.locator('.advanced-body')]);
 }
 await close();await writeFile(root+'/notes.txt','Welcome to Arctic notes\n');await page.evaluate(async()=>{state=await api('state');render();await openAdvanced('discardPreview',{name:'notes.txt'})});await page.getByRole('button',{name:'파일 변경 버리기',exact:true}).click();await page.locator('.advanced-dialog').waitFor({state:'hidden'});await page.evaluate(()=>openAdvanced('recoveryList',{}));await shot('recovery-list',[page.locator('.advanced-body').getByRole('button',{name:'복구',exact:true})]);await page.getByRole('button',{name:'복구',exact:true}).click();await page.getByRole('button',{name:'다시 버리기',exact:true}).waitFor();await shot('recovery-result',[page.getByRole('button',{name:'다시 버리기',exact:true})]);await close();
 // Worktree create/open/lock/delete controls.
 await page.evaluate(path=>openWorktrees(null,{create:true}),temp+'/second');
 await close();await git(root,['worktree','add','-b','feature/parallel',temp+'/parallel','HEAD']);await page.evaluate(async()=>{state=await api('state');render();await openWorktrees()});await page.locator('.worktree-row').filter({hasText:'feature/parallel'}).click();await shot('worktree-actions',[page.locator('.worktree-detail')]);
 await page.getByRole('button',{name:'잠금',exact:true}).click();await page.getByRole('button',{name:'잠금 해제',exact:true}).waitFor();await shot('worktree-locked',[page.getByRole('button',{name:'잠금 해제',exact:true})]);await page.getByRole('button',{name:'잠금 해제',exact:true}).click();await page.getByRole('button',{name:'잠금',exact:true}).waitFor();await page.getByRole('button',{name:'삭제',exact:true}).click();await shot('worktree-delete',[page.getByRole('button',{name:'작업 폴더 삭제',exact:true})]);await page.getByRole('button',{name:'작업 폴더 삭제',exact:true}).click();await page.locator('.worktree-row').filter({hasText:'feature/parallel'}).waitFor({state:'hidden'});await close();
 // Read-only result views and local Git synchronization.
 for(const key of ['remoteList','stashDiff','fileHistory','blame','reflog','searchHistory','submodules']){
  await form(key,key==='searchHistory'?{query:'notes'}:{});await page.locator('#commandDialog form button[type=submit]').click();await page.locator('#commandDialog .command-output').waitFor();await shot(key.toLowerCase()+'-result',[page.locator('#commandDialog .command-output')]);
 }
 await close();await git(root,['stash','push','-u','-m','Save restored notes']);await page.evaluate(async()=>{state=await api('state');render()});
 for(const key of ['fetch','pull','push']){await form(key);await submit();await shot(key+'-result',[page.locator('#syncLabel')],false)}
 await form('tagCreate',{name:'v1.1',ref:'HEAD',message:'Arctic notes release'});await submit();await shot('tagcreate-result',[page.locator('[data-ref="refs/tags/v1.1"]')],false);await form('tagDelete',{name:'v1.1'});await submit();await shot('tagdelete-result',[page.locator('.tag-ref').first()],false);
 // Conflict editor with a real conflicted merge.
 await git(root,['checkout','-b','feature/conflict']);await writeFile(root+'/notes.txt','Feature notes\n');await git(root,['commit','-am','feat: update notes']);await git(root,['checkout','main']);await writeFile(root+'/notes.txt','Main notes\n');await git(root,['commit','-am','docs: update notes']);await git(root,['merge','feature/conflict']).catch(()=>{});await page.evaluate(async()=>{state=await api('state');render()});
 await form('resolve',{name:'notes.txt'});await form('conflictRead',{name:'notes.txt'});await page.locator('#commandDialog form button[type=submit]').click();await page.locator('#conflictResult').waitFor();await shot('conflict-choices',[page.getByRole('button',{name:'왼쪽 사용',exact:true}),page.getByRole('button',{name:'오른쪽 사용',exact:true}),page.getByRole('button',{name:'양쪽 사용',exact:true})]);await page.getByRole('button',{name:'양쪽 사용',exact:true}).click();await shot('conflict-save',[page.locator('#conflictResult'),page.getByRole('button',{name:'결과 저장·스테이징',exact:true})]);await page.getByRole('button',{name:'결과 저장·스테이징',exact:true}).click();await page.locator('.advanced-dialog').waitFor({state:'hidden'});await form('continue');await submit();assert.equal((await git(root,['ls-files','-u'])).trim(),'');
 }
 // Selecting several existing commits is different from selecting file lines.
 await page.locator('.branchitem.checked-out').click();await page.locator('.historyrow').nth(1).click();await page.locator('.historyrow').nth(2).click({modifiers:['Meta']});await shot('multiple-commits',[page.locator('#historySelectionTools'),page.locator('.historyrow.active').first()],false);await page.getByRole('button',{name:'선택한 커밋 Cherry-pick',exact:true}).click();await page.getByRole('button',{name:'현재 브랜치에 적용',exact:true}).waitFor();await shot('multiple-preview',[page.locator('.cherry-pick-order'),page.getByRole('button',{name:'현재 브랜치에 적용',exact:true})]);await close();
 // Existing public GitHub PR, read-only. No comments, reviews or merges are submitted.
 await git(root,['remote','add','github','https://github.com/Polar-Little-Lab/pGit.git']);await page.evaluate(async()=>{state=await api('state');render();await showProviderReview('github',3,'github')});await page.locator('.review-tabs').waitFor();
 for(const tab of ['overview','files','checks','comments','threads','submit','merge']){await page.locator(`[data-review-tab=${tab}]`).click();await page.locator('.review-content').waitFor();await page.locator('.review-content').getByText('불러오는 중…',{exact:true}).waitFor({state:'hidden'});await shot('review-'+tab,[page.locator(`[data-review-tab=${tab}]`),page.locator('.review-content')]);}
 await close();

 // Shell creation and genuine HTTPS clone, with their resulting tabs.
 await page.goto(address);await page.getByRole('button',{name:'새 프로젝트 탭',exact:true}).click();await page.locator('[data-project-mode=init]').click();await page.locator('#projectPath').fill(temp+'/new-project');await shot('project-init',[page.locator('[data-project-mode=init]'),page.locator('#projectPath'),page.locator('#submitProject')]);await page.locator('#submitProject').click();await page.locator('#projectDialog').waitFor({state:'hidden'});assert.equal((await git(temp+'/new-project',['rev-parse','--is-inside-work-tree'])).trim(),'true');await shot('project-init-result',[page.locator('.project-tab').last()],false);
 await page.getByRole('button',{name:'새 프로젝트 탭',exact:true}).click();await page.locator('[data-project-mode=clone]').click();await page.locator('#cloneUrl').fill('https://github.com/octocat/Hello-World.git');await page.locator('#projectPath').fill(temp+'/hello-world');await shot('project-clone',[page.locator('[data-project-mode=clone]'),page.locator('#cloneUrl'),page.locator('#projectPath'),page.locator('#submitProject')]);await page.locator('#submitProject').click();await page.locator('#projectDialog').waitFor({state:'hidden',timeout:120000});assert.match(await git(temp+'/hello-world',['remote','get-url','origin']),/github.com\/octocat/);await page.frameLocator('iframe:not([hidden])').locator('.historyrow').first().waitFor();await shot('project-clone-result',[page.locator('.project-tab').last()],false);
 await page.locator('.settings-button').click();
 for(const section of ['appearance','language','sync']){await page.locator(`[data-settings-section=${section}]`).click();await shot('settings-'+section,[page.locator(`[data-settings-section=${section}]`),page.locator(`[data-settings-panel=${section}]`)],false)}
 await page.locator('[data-close-settings]').click();
 await page.goto(address+'workspace');await page.evaluate(root=>mutate('open',{path:root}),root);await page.evaluate(()=>openAdvanced('resetPreview',{ref:'HEAD~1'}));await page.getByRole('button',{name:'Reset 실행',exact:true}).click();await page.locator('.advanced-dialog').waitFor({state:'hidden'});await page.evaluate(()=>openAdvanced('resetJournal',{}));await shot('reset-undo',[page.locator('.advanced-body'),page.getByRole('button',{name:'Reset 실행 취소',exact:true})]);await page.getByRole('button',{name:'Reset 실행 취소',exact:true}).click();await page.getByRole('button',{name:'Reset 다시 실행',exact:true}).waitFor();await shot('reset-redo',[page.getByRole('button',{name:'Reset 다시 실행',exact:true})]);await close();

 if(manifest.length)await writeFile('docs/guide-features.json',JSON.stringify([...new Map(manifest.map(item=>[item.key,item])).values()],null,2)+'\n');console.log('Feature captures complete: '+manifest.length);
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(temp,{recursive:true,force:true})}
