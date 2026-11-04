import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const root=await mkdtemp(path.join(os.tmpdir(),'pgit-detail-'));const target=root+'-linked';let browser;
try{
 await git(root,['init','-b','main']);await git(root,['-c','user.name=Test','-c','user.email=test@example.test','commit','--allow-empty','-m','Initial']);await git(root,['worktree','add','-b','feature',target]);
 browser=await chromium.launch({headless:true,executablePath:process.env.PGIT_BROWSER_PATH});const page=await browser.newPage();await page.goto((await ready)+'workspace');
 for(const folder of [root,target]){
  await page.evaluate(folder=>mutate('open',{path:folder}),folder);await page.locator('.sidebar-worktree.current .sidebar-worktree-menu').click();await page.locator('.worktree-dialog[aria-busy=false] .worktree-detail[data-worktree-path]').waitFor();
  const detail=page.locator('.worktree-detail');assert.equal(await detail.getByText('현재 프로젝트',{exact:true}).count(),0);assert.equal(await detail.getByRole('button',{name:'작업 폴더 열기',exact:true}).count(),0);
  if(folder===root){assert.equal(await detail.getByText('기본 작업 폴더',{exact:true}).count(),1);assert.equal(await detail.locator('.worktree-actions').count(),0)}else{assert.equal(await detail.getByRole('button',{name:'잠금',exact:true}).count(),1)}
  await page.locator('.worktree-dialog .close-control').click();await page.locator('.sidebar-worktree:not(.current) .sidebar-worktree-menu').click();await page.locator('.worktree-dialog[aria-busy=false] .worktree-detail[data-worktree-path]').waitFor();assert.equal(await detail.getByRole('button',{name:'작업 폴더 열기',exact:true}).isEnabled(),true);await page.locator('.worktree-dialog .close-control').click();
 }
 await page.evaluate(async()=>{await openWorktrees();worktreeCreate.click()});await page.getByRole('textbox',{name:'새 브랜치',exact:true}).fill('draft/escape');await page.keyboard.press('Escape');await page.locator('.worktree-dialog').waitFor({state:'hidden'});await page.evaluate(async()=>{await openWorktrees();worktreeCreate.click()});assert.equal(await page.getByRole('textbox',{name:'새 브랜치',exact:true}).inputValue(),'draft/escape');await page.keyboard.press('Escape');await page.locator('.worktree-dialog').waitFor({state:'hidden'});
 console.log('Worktree detail passed: current main/linked hide redundant badge/open action; main badge, linked lock and other worktree opening retained.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});await rm(target,{recursive:true,force:true})}
