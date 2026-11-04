import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,realpath,mkdir} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'pgit-group-home-')));let browser;
try{
 const roots=[];
 for(const folder of ['one/api','two/api','last']){
  const repo=path.join(root,folder);await mkdir(repo,{recursive:true});await git(repo,['init','-b','main']);await git(repo,['config','user.name','Test']);await git(repo,['config','user.email','test@example.invalid']);await writeFile(repo+'/file','base');await git(repo,['add','.']);await git(repo,['commit','-m','base']);roots.push(repo);
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.PGIT_BROWSER_PATH});
 const page=await browser.newPage({viewport:{width:1440,height:960}});page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(await ready);
 await page.evaluate(async roots=>{
  await openProject(roots[0]);groups=[{id:'team',name:'Team',color:'teal',icon:'code'}];
  projectGroups=Object.fromEntries(roots.slice(0,2).map(p=>[p,'team']));recents=[roots[0]];renderRecents();save();
 },roots);
 const first=page.frameLocator('iframe.project-frame').first();
 await first.locator('#changesNav').click();
 await first.getByRole('textbox',{name:'커밋 메시지',exact:true}).fill('Keep my draft');
 await page.locator('#homeButton').click();
 assert.equal(await page.locator('.home-group-project').count(),2);
 assert.equal(await page.locator('.recent-row').count(),1);
 await page.locator('.home-group-toggle').click();assert.equal(await page.locator('.home-group-list').isVisible(),false);
 await page.locator('#projectSearch').fill(roots[1]);assert.equal(await page.locator('.home-group-project').count(),1);assert.equal(await page.locator('.home-group-list').isVisible(),true);
 await page.locator('#projectSearch').fill('');assert.equal(await page.locator('.home-group-list').isVisible(),false);
 await page.locator('.home-group-toggle').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.home-group-list').isVisible(),true);
 await page.getByRole('button',{name:'그룹 열기',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.home-group-result')?.textContent.includes('2 / 2'));
 assert.equal(await page.getByRole('tab').count(),2);assert.equal(await first.getByRole('textbox',{name:'커밋 메시지',exact:true}).inputValue(),'Keep my draft');
 await page.locator('#homeButton').click();await page.getByRole('button',{name:'그룹 열기',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.home-group-result')?.textContent.includes('2 / 2'));assert.equal(await page.getByRole('tab').count(),2);
 await page.locator('#homeButton').click();
 // A missing middle repository stops the batch; later repositories stay closed.
 await page.evaluate(({root,roots})=>{projectGroups[root+'/missing']='team';projectGroups[roots[2]]='team';renderRecents()}, {root,roots});
 await page.getByRole('button',{name:'그룹 열기',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.home-group-result')?.textContent.includes('2 / 4'));
 assert.equal(await page.getByRole('tab').count(),2);assert.equal(await page.locator('#projectDialog').isVisible(),false);
 await page.locator('#homeButton').click();
 // Search opens only the displayed repositories.
 await page.locator('#projectSearch').fill('last');await page.getByRole('button',{name:'표시된 저장소 열기',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.home-group-result')?.textContent.includes('1 / 1'));assert.equal(await page.getByRole('tab').count(),3);
 await page.locator('#homeButton').click();await page.locator('#projectSearch').fill('');
 await page.evaluate(()=>{groups[0].name='Very long group name '.repeat(2).slice(0,40);renderRecents()});
 for(const language of ['ko','en','ja','zh','es','fr']){
  await page.evaluate(language=>PgitI18n.setLanguage(language),language);
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>PgitSettings.setTheme(theme),theme);await page.setViewportSize({width:600,height:650});
   assert.ok(await page.locator('#homeGroups').evaluate(el=>el.scrollWidth<=el.clientWidth));
   assert.equal(await page.locator('.home-group-toggle .project-group-badge').textContent(),'Very long group name '.repeat(2).slice(0,40));
  }
 }
 await page.evaluate(()=>{PgitI18n.setLanguage('ko');PgitSettings.setTheme('light')});await page.setViewportSize({width:1440,height:960});
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/group-home.png',fullPage:true});
 await page.waitForFunction(()=>Object.keys(JSON.parse(localStorage.getItem('pgit.arctic.workspace.v1')).projectGroups).length===4);
 await page.reload();await page.locator('#homeButton').click();await page.locator('.home-group-project').first().waitFor();assert.equal(await page.locator('.home-group-project').count(),4);
 for(const repo of roots)assert.equal((await git(repo,['status','--porcelain'])).trim(),'');
 assert.deepEqual(errors,[]);console.log('Group home passed: retained membership, collapse/search/keyboard, batch open, duplicate tabs, draft preservation, partial failure, 6 languages, dark/light narrow layout, reload and unchanged Git.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:200})}
