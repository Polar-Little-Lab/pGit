const fs=require('node:fs/promises');
const {createReadStream}=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {promisify}=require('node:util');
const execFile=promisify(require('node:child_process').execFile);
const ROOT='https://github.com/Polar-Little-Lab/pGit/releases/download/';
function selectDownload(release,platform,arch){
 const version=release.tag_name?.replace(/^v/,'');
 if(!/^\d+\.\d+\.\d+$/.test(version)||release.draft||release.prerelease)return null;
 const suffix=platform==='darwin'&&['arm64','x64'].includes(arch)?`macos-${arch}.dmg`:platform==='win32'&&arch==='x64'?'windows-x64-setup.exe':null;
 if(!suffix)return null;
 const name=`pGit-${version}-${suffix}`,base=ROOT+encodeURIComponent(release.tag_name)+'/';
 const asset=release.assets?.find(a=>a.name===name),sums=release.assets?.find(a=>a.name==='SHA256SUMS.txt');
 if(!asset||!sums||asset.browser_download_url!==base+name||sums.browser_download_url!==base+'SHA256SUMS.txt'||!Number.isSafeInteger(asset.size)||asset.size<=0||asset.size>1024**3)return null;
 return {name,size:asset.size,url:asset.browser_download_url,checksums:sums.browser_download_url};
}
async function digest(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex')}
async function markDownloaded(file,platform){
 if(platform==='darwin')await execFile('/usr/bin/xattr',['-w','com.apple.quarantine',`0083;${Math.floor(Date.now()/1000).toString(16)};pGit;`,file]);
 if(platform==='win32')await fs.writeFile(file+':Zone.Identifier','[ZoneTransfer]\r\nZoneId=3\r\nHostUrl=https://github.com/Polar-Little-Lab/pGit\r\n');
}
function createDownloader({getDownload,directory,platform=process.platform,fetchImpl=globalThis.fetch,mark=markDownloaded,open=async()=>'',reveal=()=>{}}){
 let state={status:'idle'},active,controller,completed;
 const snapshot=()=>({...state});
 async function request(url,signal,timeout=30000){
  for(let hops=0;hops<6;hops++){
   const u=new URL(url);
   if(u.protocol!=='https:'||u.username||u.password||u.port||!['github.com','release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname))throw Error('Untrusted download');
   const response=await fetchImpl(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(timeout)]),redirect:'manual'});
   if([301,302,303,307,308].includes(response.status)){await response.body?.cancel();url=new URL(response.headers.get('location'),url).href;continue}
   if(!response.ok||!response.body)throw Error('Download failed');return response;
  }throw Error('Too many redirects');
 }
 async function run(){
  let folder,handle;
  const signal=controller.signal;
  completed=null;state={status:'preparing',received:0,total:0};
  try{
   const info=await getDownload();signal.throwIfAborted();
   if(!info)throw Error('No installer');
   // Revalidate even the main-process metadata before creating a local file.
   if(path.basename(info.name)!==info.name||!info.url.startsWith(ROOT)||!info.checksums.startsWith(ROOT))throw Error('Invalid installer');
   state={status:'preparing',name:info.name,received:0,total:info.size};
   const sums=await request(info.checksums,signal);let text='';
   for await(const chunk of sums.body){text+=Buffer.from(chunk).toString('utf8');if(Buffer.byteLength(text)>65536)throw Error('Invalid checksums')}
   const matches=text.split(/\r?\n/).map(line=>/^([a-fA-F0-9]{64}) [ *](.+)$/.exec(line)).filter(m=>m&&m[2]===info.name);
   if(matches.length!==1)throw Error('Missing checksum');const expected=matches[0][1].toLowerCase();
   await fs.mkdir(directory,{recursive:true});folder=await fs.mkdtemp(path.join(directory,'pGit-update-'));
   const partial=path.join(folder,info.name+'.part'),file=path.join(folder,info.name);
   handle=await fs.open(partial,'wx');
   const response=await request(info.url,signal,600000);state.status='downloading';const hash=createHash('sha256');
   for await(const chunk of response.body){signal.throwIfAborted();state.received+=chunk.length;if(state.received>info.size)throw Error('Invalid size');hash.update(chunk);await handle.writeFile(chunk)}
   state.status='verifying';await handle.close();handle=null;signal.throwIfAborted();
   if(state.received!==info.size||hash.digest('hex')!==expected)throw Error('Integrity check failed');
   await fs.rename(partial,file);await mark(file,platform);signal.throwIfAborted();
   completed={file,expected};state.status='completed';folder=null;
  }catch{state.status=signal.aborted?'cancelled':'error'}
  finally{await handle?.close().catch(()=>{});if(folder)await fs.rm(folder,{recursive:true,force:true}).catch(()=>{});active=null}
  return snapshot();
 }
 return {snapshot,start(){if(active||state.status==='completed')return snapshot();controller=new AbortController();active=run();return snapshot()},async cancel(){controller?.abort();await active;return snapshot()},async open(){if(!completed)return false;try{if(await digest(completed.file)!==completed.expected)throw Error('Changed installer');const error=await open(completed.file);if(error)throw Error('Could not open installer');return true}catch{completed=null;state.status='error';return false}},async reveal(){if(!completed)return false;try{await fs.access(completed.file);reveal(completed.file);return true}catch{completed=null;state.status='error';return false}},async settled(){await active;return snapshot()}};
}
module.exports={createDownloader,selectDownload};
