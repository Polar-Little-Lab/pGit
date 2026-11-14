import {chromium} from 'playwright';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const temp=await mkdtemp(path.join(os.tmpdir(),'pgit-ui-tabs-'));let browser;
try{
 const roots=[];for(const name of ['aurora-api','glacier-web']){const root=path.join(temp,name);await git(temp,['init','-b','main',root]);await git(root,['config','user.name','Polar']);await git(root,['config','user.email','test@example.invalid']);await writeFile(root+'/app.txt',name+' original\n');await git(root,['add','.']);await git(root,['commit','-m','Create '+name]);await git(root,['branch','feature/arctic']);await writeFile(root+'/app.txt',name+' changed\n');roots.push(root)}
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});const page=await browser.newPage({viewport:{width:1520,height:960}});page.setDefaultTimeout(12000);await page.emulateMedia({reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(await ready);await page.locator('#welcome').waitFor();
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/arctic-home.png'});
 async function open(root){await page.evaluate(root=>openProject(root),root);const frame=page.frameLocator(`iframe[title="${path.basename(root)} 작업 공간"]`);await frame.locator('.historyrow').first().waitFor({state:'attached'});return frame}
 const first=await open(roots[0]);await first.getByRole('button',{name:/작업 검색/}).click();await first.locator('#commandDialog').waitFor();await page.getByRole('button',{name:'새 프로젝트 탭',exact:true}).click();await first.locator('#commandDialog').waitFor({state:'hidden'});await page.getByRole('button',{name:'새 탭 닫기',exact:true}).click();await first.locator('.commit-file').first().waitFor();await page.screenshot({path:'test-results/history-separated.png'});assert.equal(await first.locator('.history-working-link,.wip-row').count(),0);assert.equal(await first.locator('#changes').isVisible(),false);assert.equal(await first.getByRole('textbox',{name:'커밋 메시지',exact:true}).count(),0);await first.getByRole('searchbox',{name:'커밋 검색'}).fill('no-such-commit-9382');await first.getByText('선택된 커밋 없음',{exact:true}).waitFor();assert.equal(await first.locator('#changes').isVisible(),false);await first.getByRole('searchbox',{name:'커밋 검색'}).fill('');await first.locator('.historyrow').first().waitFor();await first.locator('#changesNav').click();assert.equal(await first.locator('#history').isVisible(),false);assert.equal(await first.locator('#changesNav').evaluate(e=>e.classList.contains('active')),true);await first.getByRole('button',{name:'app.txt · 작업 중',exact:true}).click();await first.getByRole('textbox',{name:'커밋 메시지',exact:true}).fill('Aurora draft stays here');await first.getByRole('textbox',{name:'커밋 상세 설명'}).fill('Description stays too');await first.locator('#diff .diff-added code').getByText('aurora-api changed',{exact:true}).waitFor();
 // Selecting history changes the right panel; opening a file uses the center without losing WIP drafts.
 await first.locator('.return-graph').click();assert.equal(await first.getByRole('textbox',{name:'커밋 메시지',exact:true}).count(),0);await first.locator('#branches .branchitem.checked-out').press('Control+Enter');assert.equal((await git(roots[0],['rev-list','--count','HEAD'])).trim(),'1');
 assert.ok(await first.locator('.history-scroll').evaluate(e=>e.getBoundingClientRect().height>500));
 await first.locator('.historyrow').first().click();await first.locator('.commit-file').first().waitFor();
 assert.equal(await first.locator('#changes').isVisible(),false);
 assert.equal(await first.locator('#history').isVisible(),true);
 await first.locator('.commit-file[data-name="app.txt"]').click();
 await first.locator('.diff-added code').filter({hasText:'aurora-api original'}).waitFor();
 assert.equal(await first.locator('#history').isVisible(),false);
 await first.getByRole('button',{name:'그래프로 돌아가기',exact:true}).click();
 await first.locator('#changesNav').click();
 assert.equal(await first.locator('#selectedCommitPanel').isVisible(),false);
 assert.equal(await first.getByRole('textbox',{name:'커밋 메시지',exact:true}).inputValue(),'Aurora draft stays here');
 await first.getByRole('button',{name:'app.txt · 작업 중',exact:true}).click();
 const second=await open(roots[1]);await second.locator('#changesNav').click();assert.equal(await page.getByRole('tab').count(),2);assert.equal(await second.getByRole('textbox',{name:'커밋 메시지',exact:true}).inputValue(),'');
 // A tab rerender can cancel CSS transitions; still compare the final hover colors.
 const hoveredTab=page.locator('.project-tab').filter({hasText:'aurora-api'});await hoveredTab.getByRole('tab').hover();await hoveredTab.evaluate(async e=>{await new Promise(requestAnimationFrame);await Promise.allSettled(e.getAnimations({subtree:true}).map(a=>a.finished))});const tabHover=await hoveredTab.evaluate(e=>getComputedStyle(e).backgroundColor.replace(/^rgba\((.*), 1\)$/, 'rgb($1)'));await hoveredTab.locator('.tab-close').hover();await hoveredTab.evaluate(async e=>{await new Promise(requestAnimationFrame);await Promise.allSettled(e.getAnimations({subtree:true}).map(a=>a.finished))});assert.equal(await hoveredTab.evaluate(e=>getComputedStyle(e).backgroundColor.replace(/^rgba\((.*), 1\)$/, 'rgb($1)')),tabHover);await page.screenshot({path:'test-results/tab-full-hover.png'});
 await page.locator('.project-tab').filter({hasText:'aurora-api'}).dragTo(page.locator('.project-tab').filter({hasText:'glacier-web'}));
 assert.match(await page.getByRole('tab').first().textContent(),/glacier-web/);

 await second.getByRole('button',{name:'app.txt 파일 전체 스테이징',exact:true}).click();await second.getByRole('button',{name:'app.txt · 커밋할 변경',exact:true}).waitFor();assert.equal(await git(roots[0],['diff','--cached']),'');assert.match(await git(roots[1],['diff','--cached']),/glacier-web changed/);
 await page.getByRole('tab').filter({hasText:'aurora-api'}).click();assert.equal(await first.getByRole('textbox',{name:'커밋 메시지',exact:true}).inputValue(),'Aurora draft stays here');await first.locator('#diff .diff-added code').getByText('aurora-api changed',{exact:true}).waitFor();
 await page.screenshot({path:'test-results/arctic-tabs.png'});
 // Closing a tab never drops a draft without an explicit choice.
 await page.getByRole('button',{name:'aurora-api 탭 닫기',exact:true}).click();await page.getByRole('dialog',{name:'커밋 초안을 보관할까요?'}).waitFor();await page.getByRole('button',{name:'계속 작성',exact:true}).click();assert.equal(await page.getByRole('tab').count(),2);
 await first.getByRole('textbox',{name:'커밋 메시지',exact:true}).fill('');assert.equal(await first.getByRole('textbox',{name:'커밋 상세 설명'}).inputValue(),'Description stays too');await page.getByRole('button',{name:'aurora-api 탭 닫기',exact:true}).click();await page.getByRole('dialog',{name:'커밋 초안을 보관할까요?'}).waitFor();await page.getByRole('button',{name:'계속 작성',exact:true}).click();await first.getByRole('textbox',{name:'커밋 상세 설명'}).fill('');
 // Reopening the same repository focuses its existing tab.
 await open(roots[0]);assert.equal(await page.getByRole('tab').count(),2);
 await page.getByRole('tab').filter({hasText:'glacier-web'}).click();await second.getByRole('button',{name:'app.txt · 커밋할 변경',exact:true}).click();await second.locator('#diff .diff-added code').getByText('glacier-web changed',{exact:true}).waitFor();
 await second.getByRole('textbox',{name:'커밋 메시지',exact:true}).fill('Commit glacier only');await second.getByRole('button',{name:'스테이징한 변경 커밋 · 1개 파일',exact:true}).click();await second.getByText('작업 중 영역에서 커밋할 변경을 스테이징하세요.',{exact:true}).waitFor();assert.equal((await git(roots[0],['rev-list','--count','HEAD'])).trim(),'1');assert.equal((await git(roots[1],['rev-list','--count','HEAD'])).trim(),'2');
 // Let the real persistence debounce settle, then reload the shell and restore both projects.
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('pgit.arctic.workspace.v1')||'{}').activePath?.replaceAll('\\','/').endsWith('/glacier-web'));
 await page.reload();await page.getByRole('tab').filter({hasText:'glacier-web'}).waitFor();assert.equal(await page.getByRole('tab').count(),2);await page.frameLocator('iframe[title="glacier-web 작업 공간"]').locator('.historyrow').first().waitFor({timeout:30000});
 assert.equal(await page.getByRole('tab').filter({hasText:'glacier-web'}).getAttribute('aria-selected'),'true');const clean=page.frameLocator('iframe[title="glacier-web 작업 공간"]');assert.equal(await clean.locator('.history-working-link').count(),0);assert.equal(await clean.locator('#changes').isVisible(),false);
 await page.getByRole('button',{name:'glacier-web 탭 닫기',exact:true}).click();await page.getByRole('tab').filter({hasText:'glacier-web'}).waitFor({state:'detached'});assert.equal(await page.getByRole('tab').count(),1);
 await page.getByRole('tab').filter({hasText:'aurora-api'}).press('Control+t');await page.locator('#welcome').waitFor();await page.getByRole('button',{name:'새 탭 닫기',exact:true}).click();
 assert.deepEqual(errors,[]);console.log('Tabs UI passed: +, independent Git operations, draft preservation, duplicate prevention, close guard, restore, drag reorder and shortcuts.');
}finally{await browser?.close();await new Promise(r=>server.close(r));await rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:200})}
