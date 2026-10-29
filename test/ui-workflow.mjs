import {chromium} from 'playwright';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const root=await mkdtemp(path.join(os.tmpdir(),'pgit-workflow-'));let browser;
try{
 await git(root,['init','-b','main']);await git(root,['config','user.name','Polar']);await git(root,['config','user.email','test@example.invalid']);await writeFile(root+'/app.txt','original\n');await git(root,['add','.']);await git(root,['commit','-m','Initial']);await git(root,['checkout','-b','feature/aurora']);await writeFile(root+'/feature.txt','feature\n');await git(root,['add','.']);await git(root,['commit','-m','Aurora feature']);await git(root,['branch','feature/frost']);await git(root,['checkout','main']);await git(root,['update-ref','refs/remotes/origin/feature/aurora','feature/aurora']);await writeFile(root+'/app.txt','changed\n');await writeFile(root+'/new.txt','new\n');
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});const page=await browser.newPage({viewport:{width:1520,height:960}});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto((await ready)+'workspace');await page.getByRole('button',{name:'저장소 열기',exact:true}).click();await page.locator('#pathInput').fill(root);await page.locator('#openForm').getByRole('button',{name:'열기',exact:true}).click();await page.locator('.historyrow').first().waitFor();
 await page.locator('[data-ref="refs/heads/feature/aurora"]').click();
 const historySearch=page.getByRole('searchbox',{name:'커밋 검색'});
 await historySearch.fill('Aurora feature');assert.match(await page.locator('.history-info').textContent(),/검색 결과 1개/);
 await historySearch.fill('nothing-matches-this');assert.match(await page.locator('.history-info').textContent(),/검색 결과 0개/);
 await historySearch.fill('');assert.match(await page.locator('.history-info').textContent(),/개 커밋/);
 // Group shared prefixes while retaining full refs for filtering and actions.
 const folder=page.locator('#branches .branch-folder').first();
 assert.equal(await folder.locator(':scope>summary .branch-folder-name').textContent(),'feature');
 assert.equal(await folder.locator(':scope>summary .folder-count').textContent(),'2');
 await folder.locator(':scope>summary').click();
 assert.equal(await page.locator('[data-ref="refs/heads/feature/aurora"]').isVisible(),false);
 assert.equal(await page.locator('.branch-search').count(),0);
 await folder.locator(':scope>summary').click();
 const localSection=page.locator('.branch-section').filter({has:page.locator('#branches')});
 await localSection.locator(':scope>summary').click();assert.equal(await folder.isVisible(),false);
 await page.locator('#reset').click();await page.waitForFunction(()=>!document.querySelector('#reset').disabled);
 assert.equal(await localSection.getAttribute('open'),null);
 await localSection.locator(':scope>summary').click();
 const remoteSection=page.locator('.branch-section').filter({has:page.locator('.remote-group')});
 await remoteSection.locator(':scope>summary').click();assert.equal(await page.locator('.remote-group').isVisible(),false);
 await remoteSection.locator(':scope>summary').press('Enter');assert.equal(await page.locator('.remote-group').isVisible(),true);
 // Search, keyboard selection and Escape preserve the surrounding Git form.
 await page.locator('.current-branch').click();const picker=page.getByRole('combobox',{name:'전환할 브랜치',exact:true});assert.ok((await page.locator('#commandDialog').boundingBox()).height<420);await picker.click();await page.getByRole('searchbox',{name:'전환할 브랜치 검색'}).fill('aurora');await page.getByRole('searchbox',{name:'전환할 브랜치 검색'}).press('ArrowDown');await page.getByRole('option',{name:'feature/aurora',exact:true}).press('Enter');assert.equal(await page.locator('#command-name').inputValue(),'feature/aurora');await picker.click();await page.getByRole('searchbox',{name:'전환할 브랜치 검색'}).press('Escape');assert.equal(await page.locator('#commandDialog').isVisible(),true);assert.equal(await picker.getAttribute('aria-expanded'),'false');await page.locator('#commandDialog').getByRole('button',{name:'닫기',exact:true}).click();
 await page.locator('#changesNav').click();await page.getByRole('button',{name:'전체 스테이징',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-area=staged] h2').textContent.includes('2'));assert.match(await git(root,['diff','--cached']),/changed/);await page.getByRole('button',{name:'전체 해제',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-area=staged] h2').textContent.includes('0'));assert.equal(await git(root,['diff','--cached']),'');
 await page.locator('#message').fill('Detailed commit');await page.getByRole('textbox',{name:'커밋 상세 설명'}).fill('Why this changes\nSecond paragraph');await page.locator('#message').press('Control+Shift+s');await page.getByRole('button',{name:'스테이징한 변경 커밋 · 2개 파일',exact:true}).waitFor();await page.locator('#message').press('Control+Enter');await page.waitForFunction(()=>document.querySelector('#message').value==='');assert.equal((await git(root,['log','-1','--format=%B'])).trim(),'Detailed commit\n\nWhy this changes\nSecond paragraph');assert.equal(await page.locator('#commitDescription').inputValue(),'');
 // Drag/drop reviews exact direction and preselects the source without executing immediately.
 const head=(await git(root,['rev-parse','HEAD'])).trim();await page.locator('[data-ref="refs/heads/feature/aurora"]').dragTo(page.locator('[data-ref="refs/heads/main"]'));await page.getByRole('dialog',{name:'브랜치 작업 선택'}).waitFor();assert.equal((await git(root,['rev-parse','HEAD'])).trim(),head);await page.getByRole('button',{name:'병합 · feature/aurora → main',exact:true}).click();assert.equal(await page.locator('#command-ref').inputValue(),'feature/aurora');await page.getByRole('combobox',{name:'현재 브랜치에 합칠 참조'}).click();await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/frost-select.png'});await page.getByRole('searchbox',{name:'현재 브랜치에 합칠 참조 검색'}).press('Escape');await page.locator('#commandDialog').getByRole('button',{name:'실행',exact:true}).click();await page.locator('#commandDialog').waitFor({state:'hidden'});await git(root,['merge-base','--is-ancestor','feature/aurora','main']);assert.equal((await git(root,['branch','--show-current'])).trim(),'main');assert.deepEqual(errors,[]);
 console.log('Workflow UI passed: searchable picker, keyboard/Escape, bulk stage/unstage, multiline commit, shortcuts, reviewed drag-to-merge.');
}finally{await browser?.close();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true})}
