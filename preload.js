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
  isFmhy: (url) => ipcRenderer.invoke('is-fmhy', url),
  isAdUrl: (url) => ipcRenderer.invoke('is-ad-url', url),
  saveTabs: (urls) => ipcRenderer.invoke('save-tabs', urls),
  getFavicon: () => ipcRenderer.invoke('get-favicon'),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  getStoredTabs: () => ipcRenderer.invoke('get-stored-tabs'),
  downloadVideo: (url) => ipcRenderer.invoke('download-video', url),
  onDownloadStart: (cb) => ipcRenderer.on('download-start', (_, d) => cb(d)),
  onDownloadUpdate: (cb) => ipcRenderer.on('download-update', (_, d) => cb(d)),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', () => cb()),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', () => cb()),
  onUpdateError: (cb) => ipcRenderer.on('update-error', (_, msg) => cb(msg)),
  installUpdate: () => ipcRenderer.send('install-update'),
});
