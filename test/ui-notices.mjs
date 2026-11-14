import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir,mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
let browser;const root=await mkdtemp(path.join(os.tmpdir(),'pgit-notices-'));
const luminance=rgb=>{const values=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return values[0]*.2126+values[1]*.7152+values[2]*.0722};
const contrast=(a,b)=>{a=luminance(a);b=luminance(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
try{
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});const page=await browser.newPage({viewport:{width:1200,height:800}});await page.goto(await ready);await page.waitForFunction(()=>typeof missingNotice==='function');
 for(const theme of ['light','glacier','snow','dark','aurora','midnight']){
  await page.evaluate(theme=>{PgitSettings.setTheme(theme);missingNotice('/example/testing')},theme);
  await page.locator('#shellNotice').evaluate(async el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  const colors=await page.locator('#shellNotice').evaluate(el=>{const a=getComputedStyle(el),b=getComputedStyle(el.querySelector('button'));return [a.color,a.backgroundColor,b.color,b.backgroundColor]});assert.ok(contrast(colors[0],colors[1])>=4.5,theme+' notice contrast');assert.ok(contrast(colors[2],colors[3])>=4.5,theme+' action contrast');
 }
 await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/notice-midnight.png'});
 const entry=await page.evaluate(()=>{notice('Entry');const el=document.getElementById('shellNotice'),a=el.getAnimations()[0];a.pause();a.currentTime=0;const from=el.getBoundingClientRect().top;a.currentTime=240;const to=el.getBoundingClientRect().top;a.play();return {from,to}});assert.ok(entry.from<0&&entry.to>=60);
 await page.locator('#shellNotice').evaluate(async el=>Promise.all(el.getAnimations().map(a=>a.finished)));
 const exit=await page.evaluate(()=>{hideNotice();const el=document.getElementById('shellNotice'),a=el.getAnimations()[0];a.pause();a.currentTime=0;const from=el.getBoundingClientRect().top;a.currentTime=179;const to=el.getBoundingClientRect().top;notice('Replacement');return {from,to}});assert.ok(exit.to<exit.from);await page.locator('#shellNotice').waitFor({state:'visible'});assert.equal(await page.locator('#shellNotice').textContent(),'Replacement');
 const start=Date.now();await page.locator('#shellNotice').waitFor({state:'hidden'});assert.ok(Date.now()-start>=3000);
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>missingNotice('/example/testing'));assert.ok(await page.locator('#shellNotice').evaluate(el=>el.getAnimations().every(a=>a.effect.getTiming().duration===0)));await page.evaluate(()=>hideNotice());await page.locator('#shellNotice').waitFor({state:'hidden'});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await git(root,['init','-b','main']);await page.evaluate(root=>openProject(root),root);
 const frame=page.frames().find(f=>f.url().includes('/workspace'));assert.ok(frame);
 await frame.evaluate(()=>openCommand('remoteAdd'));await frame.getByRole('textbox',{name:'원격 이름',exact:true}).fill('notice-test');await frame.getByRole('textbox',{name:'원격 저장소 주소',exact:true}).fill('https://gitlab.example.test/team/demo.git');await frame.getByRole('button',{name:'실행',exact:true}).click();
 await page.locator('#shellNotice').getByText('원격 추가 완료',{exact:true}).waitFor();assert.equal(await frame.locator('#toast').isVisible(),false);assert.match(await git(root,['remote','get-url','notice-test']),/gitlab.example.test/);
 await page.locator('#shellNotice').evaluate(async el=>Promise.all(el.getAnimations().map(a=>a.finished)));assert.ok(await page.locator('#shellNotice').evaluate(el=>el.matches(':popover-open')));
 await page.locator('#shellNotice').waitFor({state:'hidden'});
 const standalone=await browser.newPage();await standalone.goto((await ready)+'workspace');await standalone.waitForFunction(()=>typeof PgitUI!=='undefined');await standalone.evaluate(()=>{showCommands();notify('Standalone notice')});await standalone.locator('#toast').waitFor({state:'visible'});assert.ok(await standalone.locator('#toast').evaluate(el=>el.matches(':popover-open')));await standalone.locator('#toast').waitFor({state:'hidden'});await standalone.close();
 console.log('Notice contrast passed across six themes; downward entrance, upward exit, replacement, duration and reduced-motion passed');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:200})}
