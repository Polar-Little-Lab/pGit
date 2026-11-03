import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {git} from '../git.mjs';import {server,ready} from '../server.mjs';
const root=await mkdtemp(path.join(os.tmpdir(),'pgit-delete-safety-'));
const linked=root+'-linked';let browser;
try{
 await git(root,['init','-b','main']);await git(root,['config','user.name','Delete Test']);await git(root,['config','user.email','test@example.invalid']);await git(root,['commit','--allow-empty','-m','Baseline']);
 browser=await chromium.launch({headless:true,...(process.env.PGIT_BROWSER_PATH?{executablePath:process.env.PGIT_BROWSER_PATH}:{})});const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(10000);await page.goto((await ready)+'workspace');await page.evaluate(root=>mutate('open',{path:root}),root);
 const submit=()=>page.locator('#commandDialog button[type=submit]').click();
 async function choose(command,name){await page.evaluate(command=>openCommand(command),command);await page.locator('#commandDialog [role=combobox]').click();await page.getByRole('option',{name,exact:true}).click();await submit()}
 async function rejected(name,file){await choose('branchDelete',name);await page.waitForFunction(()=>!working&&!!document.querySelector('#commandDialog .command-error')?.textContent);assert.ok(await page.locator('#commandDialog').isVisible());await git(root,['show-ref','--verify','refs/heads/'+name]);console.log(name+': '+await page.locator('#commandDialog .command-error').textContent());await page.screenshot({path:'test-results/'+file+'.png'});await page.locator('#commandDialog .close-control').click()}
 await mkdir('test-results',{recursive:true});
 await page.evaluate(()=>openCommand('branchCreate'));await page.locator('#command-name').fill('test/current');await submit();await page.locator('#commandDialog').waitFor({state:'hidden'});
 await choose('branchSwitch','test/current');await page.locator('#commandDialog').waitFor({state:'hidden'});assert.equal((await git(root,['branch','--show-current'])).trim(),'test/current');
 await rejected('test/current','branch-delete-current-blocked');assert.equal((await git(root,['branch','--show-current'])).trim(),'test/current');
 await choose('branchSwitch','main');await page.locator('#commandDialog').waitFor({state:'hidden'});
 await page.locator('.branchitem[data-ref="refs/heads/test/current"]').click();assert.equal((await git(root,['branch','--show-current'])).trim(),'main');await choose('branchDelete','test/current');await page.locator('#commandDialog').waitFor({state:'hidden'});await assert.rejects(git(root,['show-ref','--verify','refs/heads/test/current']));console.log('History-only branch: deleted; checked-out branch remained main');
 await git(root,['worktree','add','-b','test/linked',linked]);await page.evaluate(()=>mutate('state'));await rejected('test/linked','branch-delete-linked-blocked');
 await git(root,['switch','-c','test/unmerged']);await writeFile(path.join(root,'unmerged.txt'),'unmerged');await git(root,['add','.']);await git(root,['commit','-m','Unmerged change']);await git(root,['switch','main']);await page.evaluate(()=>mutate('state'));await rejected('test/unmerged','branch-delete-unmerged-blocked');
 console.log('Branch deletion UI safety passed: current and linked-worktree branches protected; viewed branch deletable; unmerged branch protected.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});await rm(linked,{recursive:true,force:true})}
