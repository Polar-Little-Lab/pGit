import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';import {server,ready} from '../server.mjs';
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(await ready);await page.evaluate(()=>PgitSettings.open('language'));
 let cases=0;
 for(const language of ['ko','en','ja','zh-CN','es','fr'])for(const width of [800,1200,1600])for(const uiSize of [12,14]){
  await page.setViewportSize({width,height:900});await page.evaluate(({language,uiSize})=>{PgitI18n.setLanguage(language);PgitSettings.setTypography({...PgitSettings.typography,uiSize});PgitSettings.open('language')},{language,uiSize});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const failures=await page.evaluate(()=>{const failures=[];for(const e of document.querySelectorAll('.settings-content,.theme-card,.language-options button,.typography-options button,.settings-nav button,.fetch-options button'))if(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1&&e.matches('button'))failures.push(e.className||e.textContent);for(const e of document.querySelectorAll('.language-options strong,.language-options span')){const range=document.createRange();range.selectNodeContents(e);if(range.getClientRects().length!==1)failures.push('wrapped language: '+e.textContent)}return failures});
  assert.deepEqual(failures,[],JSON.stringify({language,width,uiSize}));cases++;
 }
 await mkdir('test-results',{recursive:true});await page.evaluate(()=>{PgitI18n.setLanguage('ko');PgitSettings.open('language')});await page.screenshot({path:'test-results/settings-language-scaled.png'});await page.setViewportSize({width:800,height:900});await page.evaluate(()=>PgitSettings.open('typography'));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:'test-results/settings-narrow-scaled.png'});assert.deepEqual(errors,[]);console.log(`Settings layout passed: ${cases} language, window, font-size combinations.`);
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
