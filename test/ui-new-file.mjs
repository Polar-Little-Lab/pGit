import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const root=await mkdtemp(path.join(os.tmpdir(),'pgit-new-file-'));let browser;
try{
 await git(root,['init','-b','main']);await git(root,['config','user.name','Test']);await git(root,['config','user.email','test@example.invalid']);
 await writeFile(root+'/AGENTS.md','Original\n');await git(root,['add','.']);await git(root,['commit','-m','Initial']);await writeFile(root+'/AGENTS.md','Changed\n');
 browser=await chromium.launch({headless:true,executablePath:process.env.PGIT_BROWSER_PATH});const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto((await ready)+'workspace');await page.evaluate(root=>mutate('open',{path:root}),root);await page.locator('#changesNav').click();
 await page.getByRole('button',{name:'새 파일',exact:true}).click();await page.getByLabel('파일 경로',{exact:true}).fill('src/example.yml');await page.getByLabel('새 파일 내용').fill('enabled: true\n');
 await mkdir('test-results',{recursive:true});await page.evaluate(()=>PgitSettings.setTheme('dark'));await page.waitForTimeout(350);await page.screenshot({path:'test-results/new-file-dark.png'});
 await page.getByRole('button',{name:'파일 만들기',exact:true}).click();await page.waitForFunction(()=>!working&&!document.querySelector('.advanced-dialog').open);
 assert.equal(await readFile(root+'/src/example.yml','utf8'),'enabled: true\n');assert.equal(await git(root,['diff','--cached']),'');
 await page.getByRole('button',{name:'src/example.yml · 작업 중',exact:true}).waitFor();
 // Normal text and selected filenames must remain legible in every shipped palette.
 for(const theme of ['light','glacier','snow','dark','aurora','midnight']){
  await page.evaluate(theme=>PgitSettings.setTheme(theme),theme);await page.waitForTimeout(350);
  const ratios=await page.evaluate(()=>{
   const rgb=c=>c.match(/[\d.]+/g).slice(0,3).map(Number),lum=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
   const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
   const row=document.querySelector('#changes .file.active'),button=row.querySelector('.file-stage'),bulk=document.querySelector('[data-stage-all=true]');
   return [ratio(getComputedStyle(row.querySelector('.change-path')).color,getComputedStyle(row).backgroundColor),ratio(getComputedStyle(button).color,getComputedStyle(button).backgroundColor),ratio(getComputedStyle(bulk).color,getComputedStyle(bulk.parentElement).backgroundColor)];
  });
  assert.ok(ratios.every(r=>r>=4.5),`${theme}: contrast ${ratios}`);
 }
 await page.evaluate(()=>PgitSettings.setTheme('dark'));await page.waitForTimeout(350);await page.screenshot({path:'test-results/changes-dark.png'});
 await page.getByRole('button',{name:'새 파일',exact:true}).click();await page.getByLabel('파일 경로',{exact:true}).fill('src/example.yml');await page.getByLabel('새 파일 내용').fill('DO NOT OVERWRITE');await page.getByRole('button',{name:'파일 만들기',exact:true}).click();await page.locator('.advanced-body .command-error').waitFor();
 assert.equal(await readFile(root+'/src/example.yml','utf8'),'enabled: true\n');assert.equal(await page.getByLabel('새 파일 내용').inputValue(),'DO NOT OVERWRITE');await page.waitForFunction(()=>!working);await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'src/example.yml 파일 전체 스테이징',exact:true}).click();await page.waitForFunction(()=>!working&&state.files.some(f=>f.name==='src/example.yml'&&f.index==='A'));
 assert.equal(await git(root,['show',':src/example.yml']),'enabled: true\n');assert.deepEqual(errors,[]);
 console.log('New file UI passed: create, preserve duplicate content, stage, and six-theme text contrast.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:100})}
