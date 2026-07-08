let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let bookmarks = [];

const container = document.getElementById('webview-container');
const tabsContainer = document.getElementById('tabs-container');
const urlInput = document.getElementById('url-input');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const welcomePage = document.getElementById('welcome-page');
const bookmarkList = document.getElementById('bookmark-list');
const welcomeBookmarks = document.getElementById('welcome-bookmarks');
const adblockToggle = document.getElementById('adblock-toggle');
const downloadList = document.getElementById('download-list');
const downloadBar = document.getElementById('download-bar');

// ---- Window Controls ----
document.getElementById('minimize-btn').onclick = () => window.electronAPI.minimize();
document.getElementById('maximize-btn').onclick = () => window.electronAPI.maximize();
document.getElementById('close-btn').onclick = () => window.electronAPI.close();

// ---- Tab Management ----
function createTab(url) {
  const id = ++tabIdCounter;
  const webview = document.createElement('webview');
  webview.id = 'wv-' + id;
  webview.setAttribute('preload', '../webview-preload.js');
  webview.setAttribute('allowpopups', '');
  webview.src = url || 'about:blank';
  webview.style.display = 'none';
  container.appendChild(webview);

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.tabId = id;
  tabEl.innerHTML = '<span class="title">New Tab</span><button class="close-tab">&times;</button>';
  tabEl.querySelector('.close-tab').onclick = (e) => { e.stopPropagation(); closeTab(id); };
  tabEl.onclick = () => switchTab(id);
  tabsContainer.appendChild(tabEl);

  const tab = { id, webview, el: tabEl, url: url || '', title: 'New Tab', favicon: '' };
  tabs.push(tab);

  webview.addEventListener('ipc-message', (e) => {
    if (e.channel === 'page-title') {
      tab.title = e.args[0];
    } else if (e.channel === 'open-tab') {
      createTab(e.args[0]);
    }
  });

  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title;
    updateTabUI(tab);
  });

  webview.addEventListener('did-navigate', (e) => {
    tab.url = e.url;
    updateTabUI(tab);
    if (tab.id === activeTabId) urlInput.value = e.url;
  });

  webview.addEventListener('did-navigate-in-page', (e) => {
    if (e.isMainFrame) {
      tab.url = e.url;
      if (tab.id === activeTabId) urlInput.value = e.url;
    }
  });

  webview.addEventListener('did-start-loading', () => {
    if (tab.id === activeTabId) reloadBtn.textContent = '\u2715';
  });

  webview.addEventListener('did-stop-loading', () => {
    if (tab.id === activeTabId) reloadBtn.textContent = '\u21BB';
    updateNavButtons();
  });

  webview.addEventListener('page-favicon-updated', (e) => {
    tab.favicon = e.favicons[0] || '';
    updateTabUI(tab);
  });

  webview.addEventListener('new-window', (e) => {
    e.preventDefault();
    createTab(e.url);
  });

  switchTab(id);
  return tab;
}

function switchTab(id) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;
  activeTabId = id;

  tabs.forEach(t => {
    t.el.classList.remove('active');
    t.webview.classList.remove('active');
    t.webview.style.display = 'none';
  });

  tab.el.classList.add('active');
  tab.webview.classList.add('active');
  tab.webview.style.display = '';

  urlInput.value = tab.url || '';
  updateNavButtons();
  updateAdBlockButton(tab.url);
  welcomePage.classList.remove('active');
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  const tab = tabs[idx];
  tab.webview.remove();
  tab.el.remove();
  tabs.splice(idx, 1);
  if (tabs.length === 0) {
    activeTabId = null;
    welcomePage.classList.add('active');
    urlInput.value = '';
    backBtn.disabled = true;
    forwardBtn.disabled = true;
    reloadBtn.textContent = '\u21BB';
    return;
  }
  if (id === activeTabId) {
    const next = tabs[Math.min(idx, tabs.length - 1)];
    switchTab(next.id);
  }
}

function updateTabUI(tab) {
  const titleEl = tab.el.querySelector('.title');
  if (titleEl) {
    titleEl.textContent = tab.title || 'New Tab';
    tab.el.title = tab.url || tab.title;
  }
}

// ---- Navigation ----
function navigateActiveTab(url) {
  if (!url || !url.trim()) return;
  let finalUrl = url.trim();
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    if (finalUrl.includes('.')) finalUrl = 'https://' + finalUrl;
    else finalUrl = 'https://www.google.com/search?q=' + encodeURIComponent(finalUrl);
  }
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    tab.webview.loadURL(finalUrl);
  }
}

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') navigateActiveTab(urlInput.value);
});

backBtn.onclick = () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview.canGoBack()) tab.webview.goBack();
};

forwardBtn.onclick = () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview.canGoForward()) tab.webview.goForward();
};

reloadBtn.onclick = () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    if (tab.webview.isLoading()) tab.webview.stop();
    else tab.webview.reload();
  }
};

function updateNavButtons() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    backBtn.disabled = !tab.webview.canGoBack();
    forwardBtn.disabled = !tab.webview.canGoForward();
  } else {
    backBtn.disabled = true;
    forwardBtn.disabled = true;
  }
}

// ---- Browser Actions ----
document.getElementById('new-tab-btn').onclick = () => createTab();
document.getElementById('welcome-start').onclick = () => createTab('https://fmhy.net');

// ---- Ad-Block Toggle ----
function updateAdBlockButton(url) {
  try {
    const domain = new URL(url).hostname;
    fmhyAPI.getWhitelist().then(list => {
      if (list.includes(domain)) adblockToggle.classList.add('off');
      else adblockToggle.classList.remove('off');
    });
  } catch {
    adblockToggle.classList.remove('off');
  }
}

adblockToggle.onclick = () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.url) return;
  try {
    const domain = new URL(tab.url).hostname;
    fmhyAPI.toggleWhitelist(domain).then(() => {
      tab.webview.reload();
      updateAdBlockButton(tab.url);
    });
  } catch {}
};

// ---- Bookmarks ----
function renderBookmarks() {
  const render = (list) => {
    list.innerHTML = bookmarks.map(b => `
      <div class="bookmark-item" data-url="${b.url}">
        ${b.favicon ? `<img class="favicon" src="${b.favicon}" onerror="this.style.display='none'">` : '<span class="favicon"></span>'}
        <span class="title">${b.title}</span>
        <button class="del" title="Remove">&times;</button>
      </div>
    `).join('');
    list.querySelectorAll('.bookmark-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('del')) return;
        createTab(el.dataset.url);
      });
      el.querySelector('.del').addEventListener('click', (e) => {
        e.stopPropagation();
        fmhyAPI.removeBookmark(el.dataset.url).then(renderBookmarks);
      });
    });
  };
  render(bookmarkList);
  render(welcomeBookmarks);
}

function addCurrentPageBookmark() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.url) return;
  const domain = (() => { try { return new URL(tab.url).hostname; } catch { return ''; } })();
  if (!domain) return;
  const bm = { url: tab.url, title: tab.title || domain, favicon: tab.favicon || '' };
  fmhyAPI.addBookmark(bm).then(() => {
    fmhyAPI.getBookmarks().then(b => { bookmarks = b; renderBookmarks(); });
  });
}

// Context menu for bookmarking
document.addEventListener('contextmenu', (e) => {
  if (e.target.id === 'url-input') {
    addCurrentPageBookmark();
  }
});

// Double-click titlebar to add bookmark
document.getElementById('titlebar').addEventListener('dblclick', (e) => {
  if (e.target.closest('#window-controls')) return;
  addCurrentPageBookmark();
});

// ---- Sidebar ----
document.getElementById('sidebar-toggle').onclick = () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
};

// ---- Downloads ----
fmhyAPI.onDownloadStart((entry) => {
  downloadBar.classList.remove('hidden');
  const el = document.createElement('div');
  el.className = 'download-item';
  el.dataset.url = entry.url;
  el.innerHTML = `<span class="name">${entry.filename}</span> downloading...`;
  downloadList.appendChild(el);
});

fmhyAPI.onDownloadUpdate((entry) => {
  const el = downloadList.querySelector(`[data-url="${entry.url}"]`);
  if (el) {
    if (entry.state === 'completed') {
      el.innerHTML = `<span class="name">${entry.filename}</span> done`;
      el.classList.add('done');
    } else if (entry.state === 'cancelled' || entry.state === 'interrupted') {
      el.innerHTML = `<span class="name">${entry.filename}</span> failed`;
      el.classList.add('done');
    } else {
      const pct = entry.size > 0 ? Math.round(entry.received / entry.size * 100) : '?';
      el.innerHTML = `<span class="name">${entry.filename}</span> ${pct}%`;
    }
  }
});

document.getElementById('download-toggle').onclick = () => {
  downloadBar.classList.add('hidden');
  downloadList.innerHTML = '';
};

// ---- Init ----
fmhyAPI.getBookmarks().then(b => { bookmarks = b; renderBookmarks(); });
