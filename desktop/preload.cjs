const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('pgitDesktop',{chooseFolder:()=>ipcRenderer.invoke('choose-folder'),loadWorkspace:()=>ipcRenderer.invoke('workspace-load'),saveWorkspace:value=>ipcRenderer.invoke('workspace-save',value)});
