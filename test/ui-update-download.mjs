import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';
import {server,ready} from '../server.mjs';
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.state={status:'idle'};window.opens=0;window.reveals=0;
  window.pgitDesktop={platform:'darwin',appInfo:async()=>({version:'1.2.0',platform:'darwin',arch:'arm64'}),saveWorkspace:async()=>true,loadWorkspace:async()=>null,
   checkForUpdates:async()=>({status:'available',version:'1.3.0',download:{name:'pGit-1.3.0-macos-arm64.dmg'},url:'https://github.com/Polar-Little-Lab/pGit/releases/tag/v1.3.0'}),
   downloadState:async()=>window.state,startDownload:async()=>window.state={status:'downloading',name:'pGit-1.3.0-macos-arm64.dmg',received:52428800,total:104857600},cancelDownload:async()=>window.state={...window.state,status:'cancelled'},openDownload:async()=>{window.opens++;return true},revealDownload:async()=>{window.reveals++;return true}};
 });
 await page.goto(await ready);await page.evaluate(()=>PgitSettings.open('about'));
 await expect(page.locator('.about-download')).toBeHidden();await page.locator('[data-check-updates]').click();await expect(page.locator('[data-download-start]')).toBeVisible();
 await page.locator('[data-download-start]').click();await expect(page.locator('[data-download-progress]')).toHaveAttribute('value','50');await expect(page.locator('[data-download-size]')).toHaveText('50.0 / 100.0 MB');
 for(const lang of ['en','ja','zh-CN','es','fr']){await page.evaluate(l=>PgitI18n.setLanguage(l),lang);await expect(page.locator('[data-download-label]')).not.toHaveText('설치 파일 다운로드 중…');assert.doesNotMatch(await page.locator('.about-download').innerText(),/[가-힣]/)}
 await page.locator('[data-download-cancel]').click();await expect(page.locator('[data-download-start]')).toBeVisible();await expect(page.locator('[data-download-progress]')).toBeHidden();
 await page.locator('[data-download-start]').click();await page.evaluate(()=>window.state.status='error');await expect(page.locator('[data-download-start]')).toBeVisible();
 await page.locator('[data-download-start]').click();await page.evaluate(()=>{PgitSettings.close();window.state.status='completed';window.state.received=window.state.total});await page.evaluate(()=>PgitSettings.open('about'));await expect(page.locator('[data-download-open]')).toBeVisible();assert.equal(await page.evaluate(()=>window.opens),0);
 await page.locator('[data-download-open]').click();await page.locator('[data-download-reveal]').click();assert.equal(await page.evaluate(()=>window.opens),1);assert.equal(await page.evaluate(()=>window.reveals),1);
 await page.evaluate(()=>{PgitI18n.setLanguage('ko');PgitSettings.setTheme('light')});await page.screenshot({path:'test-results/update-download-light.png'});
 await page.evaluate(()=>{PgitI18n.setLanguage('en');PgitSettings.setTheme('dark')});await page.screenshot({path:'test-results/update-download-dark.png'});
 assert.deepEqual(errors,[]);console.log('Download UI passed: progress, cancel, retry, six languages, reopen, explicit installer actions.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
