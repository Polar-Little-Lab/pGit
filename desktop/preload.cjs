const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('pgitDesktop',{platform:process.platform,chooseFolder:options=>ipcRenderer.invoke('choose-folder',options),loadWorkspace:()=>ipcRenderer.invoke('workspace-load'),saveWorkspace:value=>ipcRenderer.invoke('workspace-save',value)});
