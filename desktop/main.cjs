const {app,BrowserWindow,dialog,ipcMain,Menu}=require('electron');
const path=require('node:path');
const {readWorkspace,writeWorkspace}=require('./workspace-store.cjs');
let window,server,url;
if(!app.requestSingleInstanceLock())app.quit();else{
app.on('second-instance',()=>{if(window){window.show();window.focus()}});
app.whenReady().then(async()=>{try{
process.env.PATH=[process.env.PATH,'/opt/homebrew/bin','/usr/local/bin','/usr/bin','/bin'].filter(Boolean).join(':');
const backend=await import('../server.mjs');server=backend.server;url=await backend.ready;
ipcMain.handle('choose-folder',async event=>{if(event.sender!==window.webContents||event.senderFrame.url!==url)throw Error('Invalid sender');const result=await dialog.showOpenDialog(window,{properties:['openDirectory'],title:'Git 저장소 선택'});return result.canceled?null:result.filePaths[0]});
const store=path.join(app.getPath('userData'),'arctic-workspace.json');
function trusted(event){if(event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||event.senderFrame.url!==url)throw Error('Invalid sender')}
ipcMain.handle('workspace-load',async event=>{trusted(event);return readWorkspace(store)});
ipcMain.handle('workspace-save',async(event,value)=>{trusted(event);await writeWorkspace(store,value);return true});
function createWindow(){window=new BrowserWindow({width:1520,height:960,minWidth:1100,minHeight:700,titleBarStyle:'hiddenInset',trafficLightPosition:{x:14,y:18},title:'pGit',backgroundColor:'#f3f8fc',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});window.webContents.setWindowOpenHandler(()=>({action:'deny'}));window.webContents.on('will-navigate',(event,target)=>{if(target!==url)event.preventDefault()});window.webContents.session.setPermissionRequestHandler((_w,_p,callback)=>callback(false));window.loadURL(url);window.on('closed',()=>window=null)}
Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'pGit',submenu:[{role:'about'},{type:'separator'},{role:'quit'}]},{label:'편집',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},{label:'보기',submenu:[{role:'reload'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'}]}]));
createWindow();app.on('activate',()=>{if(!window)createWindow()});
}catch(error){dialog.showErrorBox('pGit 시작 실패',error.message);app.quit()}});
app.on('window-all-closed',()=>app.quit());app.on('before-quit',()=>server?.close());
}
