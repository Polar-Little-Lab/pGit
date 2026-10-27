const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('pgitDesktop',{chooseFolder:()=>ipcRenderer.invoke('choose-folder')});
