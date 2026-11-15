import {chromium} from 'playwright';
import {expect} from 'playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,realpath,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {git} from '../git.mjs';
import {server,ready} from '../server.mjs';
const root=await realpath(await mkdtemp(path.join(os.tmpdir(),'pgit-restore-')));
let browser;
try {
 await git(root,['init','-b','main']);
 await git(root,['config','user.name','Fixture']);
 await git(root,['config','user.email','test@example.invalid']);
 await writeFile(path.join(root,'file.txt'),'unchanged\n');
 await git(root,['add','.']);await git(root,['commit','-m','Restore fixture']);
 const head=await git(root,['rev-parse','HEAD']);
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});
 const page=await browser.newPage();
 await page.goto(await ready);
 await page.evaluate(root=>openProject(root),root);
 await expect(page.frameLocator('iframe.project-frame').locator('.historyrow')).toHaveCount(1);
 await page.waitForFunction(root=>JSON.parse(localStorage.getItem('pgit.arctic.workspace.v1')||'{}').activePath===root,root);

 let opens=0;
 await page.route('**/api',route=>{
  if(route.request().postDataJSON()?.action==='open'&&++opens===1)
   return route.fulfill({status:400,json:{error:'같은 저장소에서 다른 작업이 진행 중입니다.',code:'REPOSITORY_BUSY'}});
  return route.continue();
 });
 await page.reload();
 const frame=page.frameLocator('iframe.project-frame');
 await expect(frame.locator('.historyrow')).toHaveCount(1,{timeout:10000});
 assert.equal(opens,2,'only the transient open is retried');
 const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8')).version;
 await expect(frame.locator('footer')).toContainText(`pGit ${version}`);
 assert.equal(await git(root,['rev-parse','HEAD']),head);
 assert.equal(await git(root,['status','--porcelain']),'');
 await page.unroute('**/api');
 opens=0;
 await page.route('**/api',route=>{
  if(route.request().postDataJSON()?.action==='open'){
   opens++;return route.fulfill({status:400,json:{error:'저장소 경로를 찾을 수 없습니다.'}});
  }
  return route.continue();
 });
 await page.reload();
 await expect(page.frameLocator('iframe.project-frame').locator('.pane-error')).toBeVisible();
 assert.equal(opens,1,'permanent open errors are not retried');
 await page.unroute('**/api');
 opens=0;
 await page.route('**/api',route=>{
  if(route.request().postDataJSON()?.action==='open'){
   opens++;return route.fulfill({status:400,json:{error:'같은 저장소에서 다른 작업이 진행 중입니다.',code:'REPOSITORY_BUSY'}});
  }
  return route.continue();
 });
 await page.reload();
 await expect(page.frameLocator('iframe.project-frame').locator('.pane-error')).toBeVisible({timeout:10000});
 assert.equal(opens,6,'persistent contention stops after five retries');
 await page.unroute('**/api');
 let writes=0;
 await page.route('**/api',route=>{
  if(route.request().postDataJSON()?.action==='stage'){
   writes++;return route.fulfill({status:400,json:{error:'busy',code:'REPOSITORY_BUSY'}});
  }
  return route.continue();
 });
 const code=await page.frames().find(f=>f.url().includes('/workspace?')).evaluate(()=>api('stage',{name:'file.txt',value:true}).then(()=>null,error=>error.code));
 assert.equal(code,'REPOSITORY_BUSY');assert.equal(writes,1,'Git writes are never automatically retried');
 console.log('Tab restore: transient repository contention recovers; permanent errors remain actionable; Git content unchanged.');
} finally {
 await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 await rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
