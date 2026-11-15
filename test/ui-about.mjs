import {chromium,expect} from 'playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {server,ready} from '../server.mjs';
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1100,height:760}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.updateCalls=0;window.updateResult={status:'available',version:'1.10.0',url:'https://github.com/Polar-Little-Lab/pGit/releases/tag/v1.10.0'};
  window.pgitDesktop={saveWorkspace:async()=>true,loadWorkspace:async()=>null,platform:'darwin',appInfo:async()=>({version:'1.1.1',platform:'darwin',arch:'arm64'}),checkForUpdates:async()=>{window.updateCalls++;if(window.delayUpdate)await new Promise(r=>window.finishUpdate=r);if(window.failUpdate)throw Error('offline');return window.updateResult}};
 });
 await page.goto(await ready);await page.evaluate(()=>PgitSettings.open('about'));
 await expect(page.locator('[data-version-value]')).toHaveText('1.1.1 · macOS · arm64');
 assert.equal(await page.evaluate(()=>window.updateCalls),0);
 const button=page.locator('[data-check-updates]'),status=page.locator('[data-update-status]');
 await page.evaluate(()=>window.delayUpdate=true);await button.click();await expect(button).toBeDisabled();await expect(button).toHaveText('업데이트 확인 중…');
 await page.evaluate(()=>PgitI18n.setLanguage('en'));await expect(button).toHaveText('Checking for updates…');
 await page.evaluate(()=>{window.delayUpdate=false;window.finishUpdate()});await expect(status).toContainText('A new version is available.');await expect(button).toBeEnabled();
 const titles={ko:'앱 정보',en:'About',ja:'アプリ情報','zh-CN':'关于应用',es:'Acerca de',fr:'À propos'};
 for(const [language,title] of Object.entries(titles)){
  await page.evaluate(language=>PgitI18n.setLanguage(language),language);
  await expect(page.locator('#aboutTitle')).toHaveText(title);await expect(page.locator('[data-settings-section=about]')).toHaveText(title);
  for(const state of ['available','current','ahead','unavailable','rate-limited','error']){
   await page.evaluate(state=>window.updateResult.status=state,state);await button.click();await expect(button).toBeEnabled();
   await expect(page.locator('[data-release-link]')).toBeVisible({visible:['available','current','ahead'].includes(state)});
   if(language!=='ko')assert.doesNotMatch(await page.locator('[data-settings-panel=about]').innerText(),/[가-힣]/);
   await expect(page.locator('[data-version-value]')).toHaveText('1.1.1 · macOS · arm64');
  }
 }
 await page.evaluate(()=>{PgitI18n.setLanguage('en');window.failUpdate=true});await button.click();await expect(status).toContainText('Could not check for updates');
 await page.evaluate(()=>{window.failUpdate=false;window.updateResult.status='available';PgitSettings.setTheme('light')});await button.click();await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/about-light.png'});
 await page.evaluate(()=>{PgitI18n.setLanguage('ja');PgitSettings.setTheme('dark')});await page.screenshot({path:'test-results/about-dark.png'});
 await page.reload();await page.evaluate(()=>PgitSettings.open('about'));await expect(page.locator('#aboutTitle')).toHaveText('アプリ情報');
 const web=await browser.newPage();await web.goto(await ready);await web.evaluate(()=>{PgitI18n.setLanguage('en');PgitSettings.open('about')});await expect(web.locator('[data-check-updates]')).toBeDisabled();await expect(web.locator('[data-version-state]')).toHaveText('Running in a browser');
 assert.deepEqual(errors,[]);console.log('About UI passed: six languages, live language changes, update states, retry, persistence, browser fallback.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
