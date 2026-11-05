import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {server,ready} from '../server.mjs';
let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.PGIT_BROWSER_PATH});
 const page=await browser.newPage({viewport:{width:1280,height:860}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(await ready);
 await mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/interface-empty.png',fullPage:true,animations:'disabled'});
 await page.evaluate(()=>{
  // Presentation fixtures only; no invented branch/status is written to real projects.
  groups=[{id:'work',name:'Polar Little Lab',color:'teal',icon:'code'},{id:'personal',name:'Personal',color:'orange',icon:'folder'}];
  recents=['/projects/pgit','/projects/payment-service','/projects/design-system','/personal/notes'];
  projectGroups=Object.fromEntries(recents.map((path,i)=>[path,i===3?'personal':'work']));
  recentDetails=Object.fromEntries(recents.map((path,i)=>[path,{branch:['main','feature/payment-retry','main','writing'][i],openedAt:Date.now()-i*3600000}]));
  renderRecents();
 });
 const toggle=page.locator('.home-group-toggle').first();
 const list=page.locator('.home-group-list').first();
 await toggle.click();await list.waitFor({state:'hidden'});
 assert.equal(await toggle.getAttribute('aria-expanded'),'false');
 await toggle.press('Enter');await list.waitFor({state:'visible'});
 await page.waitForFunction(()=>!document.querySelector('.home-group-list').getAnimations().length);
 assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
 // A rapid reversal must leave the final state reachable and free of stale animation styles.
 await toggle.click();await toggle.click();
 await page.waitForFunction(()=>!document.querySelector('.home-group-list').getAnimations().length);
 assert.equal(await list.isVisible(),true);assert.equal(await list.evaluate(el=>el.inert),false);
 for(const theme of ['light','dark']){
  await page.evaluate(theme=>PgitSettings.setTheme(theme),theme);
  await page.screenshot({path:`test-results/interface-${theme}.png`,fullPage:true,animations:'disabled'});
  assert.equal(await page.locator('#welcomeOpen').evaluate(el=>getComputedStyle(el).color),theme==='dark'?'rgb(229, 233, 238)':'rgb(37, 43, 50)');
 }
 for(const language of ['ko','en','ja','zh-CN','es','fr']){
  await page.evaluate(language=>PgitI18n.setLanguage(language),language);
  await page.setViewportSize({width:600,height:720});
  assert.ok(await page.locator('#welcome').evaluate(el=>el.scrollWidth<=el.clientWidth),language+' horizontal overflow');
 }
 await page.evaluate(()=>{PgitI18n.setLanguage('ko');PgitSettings.setTheme('light')});
 await page.screenshot({path:'test-results/interface-compact.png',fullPage:true,animations:'disabled'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await toggle.click();assert.equal(await list.isVisible(),false);
 assert.equal(await list.evaluate(el=>el.getAnimations().length),0);
 await toggle.press('Space');assert.equal(await list.isVisible(),true);
 assert.equal(await page.locator('.home-overview').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.locator('#welcomeClone').click();await page.locator('#projectDialog').waitFor();
 assert.equal(await page.locator('#projectDialog').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await page.keyboard.press('Escape');await page.locator('#projectDialog').waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);
 console.log('Interface polish passed: keyboard disclosure, rapid reversal, reduced motion, 6-language compact layout, dialog dismissal; screenshots captured.');
} finally {
 await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
