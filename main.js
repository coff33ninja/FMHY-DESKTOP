const { app, BrowserWindow, session, ipcMain, dialog, nativeImage, Notification } = require('electron');
const { FiltersEngine, Request, adsAndTrackingLists, fetchLists, fetchResources } = require('@ghostery/adblocker');
const fetch = require('cross-fetch');
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
const userDataPath = app.getPath('userData');
const bookmarksPath = path.join(userDataPath, 'bookmarks.json');
const whitelistPath = path.join(userDataPath, 'whitelist.json');

function loadJSON(p, def) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return def; }
}
function saveJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
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
    registerAdBlocker();
  } catch (err) {
    console.error('Failed to load ad blocker:', err);
  }
}

let adblockRegistered = false;
function registerAdBlocker() {
  if (!engine || adblockRegistered) return;
  adblockRegistered = true;
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['https://*/*', 'http://*/*'] }, (details, callback) => {
    callback({ cancel: shouldBlockRequest(details) });
  });
}

function isFmhyDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'fmhy.net' || hostname.endsWith('.fmhy.net');
  } catch {
    return false;
  }
}

function getFavicon(webContents) {
  try {
    const path = webContents.getFavicon();
    return path || '';
  } catch {
    return '';
  }
}

// Base64 decoder handled by webview-preload.js (injected into each <webview>)

// ---- Window IPC (from preload) ----
ipcMain.on('minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on('maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (win?.isMaximized()) win.unmaximize(); else win?.maximize();
});
ipcMain.on('close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

// ---- App IPC Handlers ----
ipcMain.handle('get-bookmarks', () => bookmarks);
ipcMain.handle('add-bookmark', (_, bm) => {
  if (!bookmarks.find(b => b.url === bm.url)) {
    bookmarks.push(bm);
    saveJSON(bookmarksPath, bookmarks);
  }
  return bookmarks;
});
ipcMain.handle('remove-bookmark', (_, url) => {
  bookmarks = bookmarks.filter(b => b.url !== url);
  saveJSON(bookmarksPath, bookmarks);
  return bookmarks;
});
ipcMain.handle('get-whitelist', () => [...adblockWhitelist]);
ipcMain.handle('toggle-whitelist', (_, domain) => {
  if (adblockWhitelist.has(domain)) adblockWhitelist.delete(domain);
  else adblockWhitelist.add(domain);
  saveJSON(whitelistPath, [...adblockWhitelist]);
  return [...adblockWhitelist];
});
ipcMain.handle('get-downloads', () => downloads);
ipcMain.handle('open-external', (_, url) => {
  const { shell } = require('electron');
  shell.openExternal(url);
});
ipcMain.handle('is-fmhy', (_, url) => isFmhyDomain(url));

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
      sandbox: false,
      webviewTag: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  session.defaultSession.on('will-download', (event, item) => {
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
  await setupAdBlocker();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
