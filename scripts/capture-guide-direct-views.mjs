import {chromium} from 'playwright';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const root=await mkdtemp(path.join(os.tmpdir(),'pgit-guide-'));let browser;
try{
 await git(root,['init','-b','main']);await git(root,['config','user.name','Polar']);await git(root,['config','user.email','guide@example.invalid']);await writeFile(root+'/notes.txt','Initial notes\n');await git(root,['add','.']);await git(root,['commit','-m','Initial notes']);await git(root,['commit','--allow-empty','-m','Review project setup']);await git(root,['branch','feature/notes']);await git(root,['switch','feature/notes']);await git(root,['switch','main']);
 browser=await chromium.launch({headless:true,executablePath:process.env.PGIT_BROWSER_PATH});const page=await browser.newPage({viewport:{width:1200,height:800}});await page.goto((await ready)+'workspace');await page.evaluate(root=>mutate('open',{path:root}),root);
 await writeFile(root+'/notes.txt','Draft notes\n');await page.evaluate(()=>openAdvanced('discardPreview',{name:'notes.txt'}));await page.getByRole('button',{name:'파일 변경 버리기',exact:true}).click();await page.locator('.advanced-dialog').waitFor({state:'hidden'});
 await page.evaluate(()=>openAdvanced('resetPreview',{ref:'HEAD~1'}));await page.getByRole('button',{name:'Reset 실행',exact:true}).click();await page.locator('.advanced-dialog').waitFor({state:'hidden'});
 for(const key of ['reflog','resetJournal','recoveryList','submodules','githubPRs','githubIssues','githubRuns','gitlabMRs','gitlabIssues','gitlabPipelines']){
  if(process.env.PGIT_GUIDE_PROVIDERS_ONLY&&!key.startsWith('github')&&!key.startsWith('gitlab'))continue;
  await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await page.evaluate(key=>openCommand(key),key);const dialog=page.locator('dialog[open]');await dialog.waitFor();
  await dialog.evaluate(d=>{const target=d.querySelector('.command-output,.ui-list-message,.advanced-body button')||d.querySelector('.advanced-body');if(target){target.style.outline='2px solid #dc2525';target.style.outlineOffset='3px'}});
  await dialog.screenshot({path:'docs/images/guide-'+key.toLowerCase()+'.png'});
 }
 console.log('Captured '+(process.env.PGIT_GUIDE_PROVIDERS_ONLY?6:11)+' direct result screens from the app; local Git data and genuine no-remote states.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true})}
