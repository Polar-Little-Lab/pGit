import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const root=await mkdtemp(path.join(os.tmpdir(),'pgit-refresh-ui-'));let browser;
try{
 await git(root,['init','-b','main']);await git(root,['config','user.name','Polar']);await git(root,['config','user.email','test@example.invalid']);await writeFile(root+'/file.txt','base\n');await git(root,['add','.']);await git(root,['commit','-m','base']);
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});
 const page=await browser.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((await ready)+'workspace');await page.evaluate(async root=>{await mutate('open',{path:root});tab('changes')},root);
 await page.locator('#message').fill('keep title');await page.locator('#commitDescription').fill('keep description');
 await writeFile(root+'/file.txt','first edit\n');await page.waitForFunction(()=>state.files.length===1);
 await page.waitForFunction(()=>document.querySelector('#diff').textContent.includes('first edit'));
 await writeFile(root+'/file.txt','other edit\n');await page.waitForFunction(()=>document.querySelector('#diff').textContent.includes('other edit'));
 assert.equal(await page.evaluate(()=>selected),'file.txt');assert.equal(await page.locator('#message').inputValue(),'keep title');assert.equal(await page.locator('#commitDescription').inputValue(),'keep description');
 await page.evaluate(()=>openCommand('branchCreate'));await writeFile(root+'/paused.txt','modal edit\n');await page.waitForTimeout(3500);
 assert.equal(await page.evaluate(()=>state.files.some(f=>f.name==='paused.txt')),false);
 await page.locator('#commandDialog').getByRole('button',{name:'닫기',exact:true}).click();await page.waitForFunction(()=>state.files.some(f=>f.name==='paused.txt'));
 await git(root,['add','.']);await page.waitForFunction(()=>state.files.every(f=>f.index==='M'||f.index==='A'));
 await git(root,['commit','-m','external commit']);await page.waitForFunction(()=>state.history[0].title==='external commit'&&state.files.length===0);
 await git(root,['checkout','-b','external/branch']);await page.waitForFunction(()=>state.branch==='external/branch');
 assert.equal(await page.locator('#message').inputValue(),'keep title');assert.equal(await page.evaluate(()=>mode),'changes');
 await page.evaluate(()=>tab('history'));await page.getByRole('searchbox',{name:'커밋 검색',exact:true}).fill('base');
 await git(root,['tag','external-tag']);await page.waitForFunction(()=>state.refs.some(r=>r.name==='refs/tags/external-tag'));
 assert.equal(await page.getByRole('searchbox',{name:'커밋 검색',exact:true}).inputValue(),'base');assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'커밋 검색');
 // Hold an old refresh response while a user mutation is queued behind it.
 let intercepted,release;
 const captured=new Promise(resolve=>intercepted=resolve),held=new Promise(resolve=>release=resolve);
 await page.route('**/api',async route=>{
  if(route.request().postDataJSON().action!=='refreshState'){await route.continue();return}
  const response=await route.fetch();intercepted();await held;await route.fulfill({response});
 });
 await captured;
 const mutation=page.evaluate(()=>mutate('branchCreate',{name:'user/wins',ref:'HEAD'}));
 await page.waitForFunction(()=>working);
 release();await mutation;await page.unroute('**/api');
 assert.equal(await page.evaluate(()=>state.branches.some(b=>b.name==='user/wins')),true);
 assert.deepEqual(errors,[]);console.log('Automatic refresh UI passed: external edits, same-status edits, staging, commit, checkout, modal pause and draft/search preservation.');
}finally{await browser?.close();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true})}
