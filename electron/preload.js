const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFile: (defaultPath) => ipcRenderer.invoke('save-file', defaultPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Debug operations
  getBackendLog: () => ipcRenderer.invoke('get-backend-log'),
  openLogFolder: () => ipcRenderer.invoke('open-log-folder'),

  // Check if running in Electron
  isElectron: true,

  // Platform info
  platform: process.platform
});
