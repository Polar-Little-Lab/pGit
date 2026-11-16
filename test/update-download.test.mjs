import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createDownloader,selectDownload} from '../desktop/update-download.cjs';
const base='https://github.com/Polar-Little-Lab/pGit/releases/download/v2.0.0/';
const bytes=Buffer.from('installer fixture'),sha=createHash('sha256').update(bytes).digest('hex');
const name='pGit-2.0.0-macos-arm64.dmg',info={name,size:bytes.length,url:base+name,checksums:base+'SHA256SUMS.txt'};
const release={tag_name:'v2.0.0',assets:[{name,size:bytes.length,browser_download_url:info.url},{name:'SHA256SUMS.txt',browser_download_url:info.checksums}]};
async function fixture(t,options={}){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'pgit-download-test-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));return {directory,manager:createDownloader({directory,getDownload:async()=>info,mark:async()=>{},fetchImpl:async url=>new Response(url===info.checksums?`${sha}  ${name}\n`:bytes),...options})}}
test('selects only matching official platform asset with checksums',()=>{
 assert.deepEqual(selectDownload(release,'darwin','arm64'),info);
 for(const [platform,arch] of [['darwin','x64'],['win32','arm64'],['linux','x64']])assert.equal(selectDownload(release,platform,arch),null);
 assert.equal(selectDownload({...release,assets:[{...release.assets[0],browser_download_url:'https://evil.invalid/'+name},release.assets[1]]},'darwin','arm64'),null);
 assert.equal(selectDownload({...release,prerelease:true},'darwin','arm64'),null);
 assert.equal(selectDownload({...release,assets:[release.assets[0]]},'darwin','arm64'),null);
 const win='pGit-2.0.0-windows-x64-setup.exe';assert.equal(selectDownload({...release,assets:[{name:win,size:10,browser_download_url:base+win},release.assets[1]]},'win32','x64').name,win);
});
test('downloads, verifies, marks, opens only on request and rejects later tampering',async t=>{
 let opened=0,marked=0,file;const {manager,directory}=await fixture(t,{mark:async()=>{marked++},open:async p=>{opened++;file=p;return ''}});
 manager.start();manager.start();assert.equal((await manager.settled()).status,'completed');assert.equal(marked,1);assert.equal(opened,0);
 assert.equal(await manager.open(),true);assert.equal(opened,1);assert.deepEqual(await fs.readFile(file),bytes);assert.equal(await manager.reveal(),true);
 assert.equal((await fs.readdir(directory)).length,1);await fs.writeFile(file,'tampered');assert.equal(await manager.open(),false);assert.equal(opened,1);assert.equal(manager.snapshot().status,'error');
});
test('rejects bad checksum and wrong size, cleans partial files, permits retry',async t=>{
 for(const kind of ['checksum','size','redirect']){
 let fail=true;const {manager,directory}=await fixture(t,{fetchImpl:async url=>{
  if(url===info.checksums)return new Response(`${fail&&kind==='checksum'?'0'.repeat(64):sha}  ${name}\n`);
  if(fail&&kind==='redirect')return new Response(null,{status:302,headers:{location:'https://evil.invalid/installer'}});
  return new Response(fail&&kind==='size'?Buffer.from('short'):bytes);
 }});
 manager.start();assert.equal((await manager.settled()).status,'error');assert.deepEqual(await fs.readdir(directory),[]);assert.equal(await manager.open(),false);
 fail=false;manager.start();assert.equal((await manager.settled()).status,'completed');
 }
});
test('cancels a stream and removes partial data before allowing retry',async t=>{
 let ready;const started=new Promise(r=>ready=r);
 const {manager,directory}=await fixture(t,{fetchImpl:async(url,{signal})=>{
  if(url===info.checksums)return new Response(`${sha}  ${name}\n`);
  return new Response(new ReadableStream({start(c){c.enqueue(bytes.subarray(0,4));signal.addEventListener('abort',()=>c.error(signal.reason),{once:true});ready()}}));
 }});
 manager.start();await started;assert.equal((await manager.cancel()).status,'cancelled');assert.deepEqual(await fs.readdir(directory),[]);
});
test('preserves OS download security metadata on the saved installer',{skip:!['darwin','win32'].includes(process.platform)},async t=>{
 const {manager,directory}=await fixture(t,{mark:undefined});manager.start();assert.equal((await manager.settled()).status,'completed');
 const file=path.join(directory,(await fs.readdir(directory))[0],name);
 if(process.platform==='win32')assert.match(await fs.readFile(file+':Zone.Identifier','utf8'),/ZoneId=3/);
 else{const {execFileSync}=await import('node:child_process');assert.match(execFileSync('/usr/bin/xattr',['-p','com.apple.quarantine',file],{encoding:'utf8'}),/^0083;.*;pGit;/)}
});
