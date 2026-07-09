# FMHY Browser

**Unofficial** desktop app for [fmhy.net](https://fmhy.net) and linked external sites. Not affiliated with or endorsed by FMHY. Built on Electron with ad-blocking, tab management, bookmarks, PiP, download manager, and automatic Base64 link decoding.

## Quick Start

```powershell
npm install
npm start
```

## Features

### Ad-Blocking
Uses `@ghostery/adblocker` with EasyList + uBlock Origin filters (14 lists). Hooked into `session.defaultSession.webRequest.onBeforeRequest`. Per-domain whitelist toggled via the `AB` button in the URL bar — whitelisted domains persist across sessions in `userData/whitelist.json`. Cosmetic filtering (CSS element-hiding + anti-adblock scriptlets) is applied inside each webview via `engine.getCosmeticsFilters()`. The engine is cached to disk and refreshed in the background on startup.

### Tab Management
Custom `<webview>`-based tab system:
- **New tab**: `+` button or click a bookmark/welcome link
- **Switch tabs**: click any tab in the tab bar
- **Close tab**: `×` on the tab
- **External links** (non-fmhy.net) open in new foreground tabs automatically via two mechanisms:
  - Capture-phase click interception in `webview-preload.js` → `ipcRenderer.sendToHost('open-tab', url)`
  - `<a target="_blank">` and `window.open()` → `new-window` event on webview
- **Tab state**: URL bar, back/forward buttons, and reload/stop button update per active tab
- **Session restore**: Open tabs are persisted to `userData/tabs.json` and restored on relaunch

### Navigation
- Back / Forward / Reload buttons (reload toggles to stop while loading)
- URL bar with enter-to-navigate (auto-prepends `https://` if a domain is detected, falls back to Google search)
- Welcome page with "Open FMHY" button and saved bookmarks
- **Keyboard shortcuts**: Ctrl+T (new tab), Ctrl+W (close tab), Ctrl+L (focus URL), Ctrl+R (reload), Ctrl+D (bookmark page), Ctrl+Tab / Ctrl+Shift+Tab (cycle tabs)

### Bookmarks
Persisted as JSON in `userData/bookmarks.json`. Add via:
- Right-click the URL bar
- Double-click the titlebar

Displayed in the collapsible sidebar (toggle with `☰` button) and on the welcome page.

### Picture-in-Picture
Double-click any `<video>` element to toggle PiP. Works on all sites loaded in webviews.

### Video Download
Hover over any `<video>` element to reveal a download button (⬇). Click to save the video via a file picker dialog. Uses `session.defaultSession.on('will-download')` to handle the actual download.

### Downloads
Tracked via `session.defaultSession.on('will-download')` — progress and completion shown in the download bar at the bottom of the window. Completed downloads show a system notification.

### Base64 Auto-Decoder
FMHY uses Base64-encoded links for external sites. `webview-preload.js` decodes `<a>` hrefs automatically:
- If the decoded URL points to fmhy.net → navigate same tab
- If external → open in new tab
- A MutationObserver auto-clicks "Open Link" popup buttons when they appear

## Project Structure

```
fmhy-browser/
├── main.js                 # Main process: window, ad-blocker, IPC, downloads
├── preload.js              # Main window preload: contextBridge for renderer
├── webview-preload.js      # Injected into each <webview>: link intercept, Base64, PiP
├── renderer/
│   ├── index.html          # Custom browser chrome (tabs, toolbar, sidebar)
│   ├── style.css           # Dark theme frameless UI
│   └── renderer.js         # Tab management, navigation, bookmarks, ad-toggle, downloads
├── package.json            # Electron 43, @ghostery/adblocker, electron-builder
├── docs/                   # Improvement plans and documentation
└── scripts/                # Automation scripts
```

## Data Storage

| Data | Path |
|---|---|
| Bookmarks | `%APPDATA%/fmhy-browser/bookmarks.json` |
| Ad-block whitelist | `%APPDATA%/fmhy-browser/whitelist.json` |
| Open tabs | `%APPDATA%/fmhy-browser/tabs.json` |

## Building

```powershell
npm run build        # NSIS installer + portable
npm run pack         # Portable .exe only
```

Output goes to `dist/`.

## Key Details

- Frameless window with custom titlebar (drag to move, min/max/close buttons)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webviewTag: true`
- Ad-block loads asynchronously on app start; all navigations and fetches are filtered
- Webview preload (`webview-preload.js`) communicates with the renderer via `ipcRenderer.sendToHost`
- All untrusted SSL certificates are rejected (`certificate-error` event → `callback(false)`)
- Node.js 22+ required (see `.nvmrc`)
