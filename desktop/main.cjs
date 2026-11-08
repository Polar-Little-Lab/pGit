const {app,BrowserWindow,dialog,ipcMain,Menu,shell}=require('electron');
const path=require('node:path');
const {runtimeEnvironment,windowChrome}=require('./platform.cjs');
const {requireTrustedSender}=require('./trust.cjs');
const {readWorkspace,writeWorkspace}=require('./workspace-store.cjs');
if(process.env.PGIT_USER_DATA_DIR&&path.isAbsolute(process.env.PGIT_USER_DATA_DIR))app.setPath('userData',process.env.PGIT_USER_DATA_DIR);
let window,server,url;
if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',()=>{if(window){window.show();window.focus()}});
app.whenReady().then(async()=>{try{
process.env=runtimeEnvironment();
const backend=await import('../server.mjs');server=backend.server;url=await backend.ready;
ipcMain.handle('choose-folder',async(event,options={})=>{trusted(event);const title=typeof options?.title==='string'?options.title.slice(0,120):'Git 저장소 선택',defaultPath=typeof options?.defaultPath==='string'&&path.isAbsolute(options.defaultPath)?options.defaultPath:undefined;const result=await dialog.showOpenDialog(window,{properties:['openDirectory','createDirectory'],title,defaultPath});return result.canceled?null:result.filePaths[0]});
const store=path.join(app.getPath('userData'),'arctic-workspace.json');
function trusted(event){requireTrustedSender(event,window.webContents,url)}
ipcMain.handle('app-info',event=>{trusted(event);return {version:app.getVersion(),platform:process.platform,arch:process.arch}});
ipcMain.handle('default-project-parent',event=>{trusted(event);return app.getPath('home')});
ipcMain.handle('workspace-load',async event=>{trusted(event);return readWorkspace(store)});
ipcMain.handle('workspace-save',async(event,value)=>{trusted(event);await writeWorkspace(store,value);return true});
function createWindow(){window=new BrowserWindow({width:1520,height:960,minWidth:1100,minHeight:700,...windowChrome(),title:'pGit',backgroundColor:'#f3f8fc',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});window.webContents.setWindowOpenHandler(({url:target})=>{try{const link=new URL(target);if(link.protocol==='https:'&&!link.username&&!link.password)shell.openExternal(link.href).catch(()=>{});}catch{}return {action:'deny'}});window.webContents.on('will-navigate',(event,target)=>{if(target!==url)event.preventDefault()});window.webContents.session.setPermissionRequestHandler((_w,_p,callback)=>callback(false));// macOS editing accelerators normally come from the application menu.
window.webContents.on('before-input-event',(event,input)=>{
 if(process.platform!=='darwin'||input.type!=='keyDown'||!input.meta||input.control||input.alt||input.isComposing)return;
 const key=input.key.toLowerCase();
 if(key==='q'&&!input.shift){event.preventDefault();app.quit();return}
 const action=key==='z'?(input.shift?'redo':'undo'):!input.shift?({x:'cut',c:'copy',v:'paste',a:'selectAll'})[key]:null;
 if(action){event.preventDefault();window.webContents[action]()}
});window.loadURL(url);window.on('closed',()=>window=null)}
Menu.setApplicationMenu(null);
createWindow();app.on('activate',()=>{if(!window)createWindow()});
}catch(error){dialog.showErrorBox('pGit 시작 실패',error.message);app.quit()}});
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>server?.close());
}
