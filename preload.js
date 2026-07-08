const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),
});

contextBridge.exposeInMainWorld('fmhyAPI', {
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  addBookmark: (bm) => ipcRenderer.invoke('add-bookmark', bm),
  removeBookmark: (url) => ipcRenderer.invoke('remove-bookmark', url),
  getWhitelist: () => ipcRenderer.invoke('get-whitelist'),
  toggleWhitelist: (domain) => ipcRenderer.invoke('toggle-whitelist', domain),
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  isFmhy: (url) => ipcRenderer.invoke('is-fmhy', url),
  onDownloadStart: (cb) => ipcRenderer.on('download-start', (_, d) => cb(d)),
  onDownloadUpdate: (cb) => ipcRenderer.on('download-update', (_, d) => cb(d)),
});
