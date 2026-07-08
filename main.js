const { app, BrowserWindow, session, ipcMain, dialog, nativeImage, Notification } = require('electron');
const { FiltersEngine, Request, adsAndTrackingLists, fetchLists, fetchResources } = require('@ghostery/adblocker');
const path = require('path');
const fs = require('fs');

const TYPE_MAP = {
  mainFrame: 'main_frame', subFrame: 'sub_frame', stylesheet: 'stylesheet',
  script: 'script', image: 'image', font: 'font', object: 'object',
  xhr: 'xmlhttprequest', ping: 'other', media: 'media', webSocket: 'websocket', other: 'other',
};

let engine;
let adblockWhitelist = new Set();
const downloads = [];
let videoDownloadPath = null;
const userDataPath = app.getPath('userData');
const bookmarksPath = path.join(userDataPath, 'bookmarks.json');
const whitelistPath = path.join(userDataPath, 'whitelist.json');
const tabsPath = path.join(userDataPath, 'tabs.json');

function loadJSON(p, def) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return def; }
}
async function saveJSON(p, data) {
  await fs.promises.writeFile(p, JSON.stringify(data, null, 2), 'utf-8');
}

let bookmarks = loadJSON(bookmarksPath, []);
adblockWhitelist = new Set(loadJSON(whitelistPath, []));

function isWhitelisted(url) {
  try { return adblockWhitelist.has(new URL(url).hostname); } catch { return false; }
}

function shouldBlockRequest(details) {
  if (!engine || isWhitelisted(details.url)) return false;
  const adblockType = TYPE_MAP[details.resourceType] || 'other';
  const request = Request.fromRawDetails({
    url: details.url,
    type: adblockType,
    sourceUrl: details.referrer || '',
  });
  return engine.match(request).match === true;
}

async function setupAdBlocker() {
  try {
    const lists = await fetchLists(fetch, adsAndTrackingLists);
    const resources = await fetchResources(fetch);
    engine = FiltersEngine.parse(lists.join('\n'), { resources, enableCompression: true });
  } catch (err) {
    console.error('Failed to load ad blocker:', err);
  }
}

function isFmhyDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'fmhy.net' || hostname.endsWith('.fmhy.net');
  } catch {
    return false;
  }
}

// ---- Window IPC (from preload) ----
ipcMain.on('minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on('maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win?.isMaximized()) win.unmaximize(); else win?.maximize();
});
ipcMain.on('close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

// ---- App IPC Handlers ----
ipcMain.handle('get-bookmarks', () => bookmarks);
ipcMain.handle('add-bookmark', async (_, bm) => {
  if (!bookmarks.find(b => b.url === bm.url)) {
    if (!bm.favicon && bm.url) {
      try {
        const img = nativeImage.createFromDataURL('');
        if (!img.isEmpty()) bm.favicon = img.toDataURL();
      } catch (e) { console.error(e); }
    }
    bookmarks.push(bm);
    await saveJSON(bookmarksPath, bookmarks);
  }
  return bookmarks;
});
ipcMain.handle('remove-bookmark', async (_, url) => {
  bookmarks = bookmarks.filter(b => b.url !== url);
  await saveJSON(bookmarksPath, bookmarks);
  return bookmarks;
});
ipcMain.handle('get-whitelist', () => [...adblockWhitelist]);
ipcMain.handle('toggle-whitelist', async (_, domain) => {
  if (adblockWhitelist.has(domain)) adblockWhitelist.delete(domain);
  else adblockWhitelist.add(domain);
  await saveJSON(whitelistPath, [...adblockWhitelist]);
  return [...adblockWhitelist];
});
ipcMain.handle('get-downloads', () => downloads);
ipcMain.handle('is-fmhy', (_, url) => isFmhyDomain(url));
ipcMain.handle('is-ad-url', (_, url) => {
  if (!engine) return false;
  const result = engine.match(Request.fromRawDetails({ url, type: 'main_frame' }));
  return result.match === true;
});
ipcMain.handle('save-tabs', async (_, urls) => {
  await saveJSON(tabsPath, urls);
});
ipcMain.handle('get-stored-tabs', () => loadJSON(tabsPath, []));
ipcMain.handle('download-video', async (event, url) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  try {
    const name = path.basename(new URL(url).pathname) || 'video.mp4';
    const result = await dialog.showSaveDialog(win, {
      defaultPath: name,
      filters: [{ name: 'Video', extensions: ['mp4', 'webm', 'avi', 'mkv', 'mov', 'flv', 'wmv'] }],
    });
    if (!result.canceled && result.filePath) {
      videoDownloadPath = result.filePath;
      win.webContents.downloadURL(url);
    }
  } catch (e) {
    console.error('Video download failed:', e);
  }
});

ipcMain.handle('get-favicon', (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return '';
    const wc = win.webContents;
    const icon = wc.getFavicon();
    return icon || '';
  } catch {
    return '';
  }
});

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  session.defaultSession.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    event.preventDefault();
    callback(false);
  });

  session.defaultSession.on('will-download', (event, item) => {
    if (videoDownloadPath) {
      item.setSavePath(videoDownloadPath);
      videoDownloadPath = null;
    }
    const entry = {
      url: item.getURL(),
      filename: item.getFilename(),
      path: item.getPath(),
      size: 0,
      received: 0,
      state: 'progressing',
      startTime: Date.now(),
    };
    downloads.unshift(entry);
    item.on('updated', () => {
      entry.received = item.getReceivedBytes();
      entry.size = item.getTotalBytes();
    });
    item.on('done', (e, state) => {
      entry.state = state;
      if (state === 'completed' && Notification.isSupported()) {
        new Notification({ title: 'Download Complete', body: entry.filename }).show();
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-update', entry);
      }
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download-start', entry);
    }
  });

  return mainWindow;
}

app.whenReady().then(async () => {
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['https://*/*', 'http://*/*'] }, (details, callback) => {
    callback({ cancel: shouldBlockRequest(details) });
  });
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission !== 'notifications');
  });

  await setupAdBlocker();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
