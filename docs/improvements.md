# FMHY Browser — Improvement Plan

Prioritized list of improvements for v0.1.3-alpha.

## Phase 1 — Security & Reliability

| # | Area | Description | Files | Est. |
|---|------|-------------|-------|------|
| 1 | Security | Enable `sandbox: true` for main window | `main.js:133` | 5m |
| 2 | Security | Add Content Security Policy via session headers | `main.js` | 10m |
| 3 | Security | Remove unused `openExternal` IPC handler (dead code) | `preload.js:16`, `main.js:115-118` | 5m |
| 4 | Deps | Remove `cross-fetch` — Node 22 has native `fetch` | `package.json`, `main.js:3,47-48` | 5m |
| 5 | Bug | Show window before adblocker loads (avoid blank screen on slow connection) | `main.js:169-176` | 15m |
| 6 | Bug | Add `.catch()` to all IPC Promise chains (bookmarks, whitelist, downloads) | `renderer.js` | 10m |
| 7 | Bug | Replace `setTimeout(500)` with event-driven initialization in webview | `webview-preload.js:85` | 10m |

## Phase 2 — Code Quality

| # | Area | Description | Files | Est. |
|---|------|-------------|-------|------|
| 8 | Quality | Move `shell` destructure to top-level require | `main.js:116` | 2m |
| 9 | Quality | Pin `tar` override to exact version | `package.json:42` | 2m |
| 10 | Quality | Add `"engines": { "node": ">=22.0.0" }` to package.json | `package.json` | 2m |
| 11 | Quality | Replace sync file I/O with async (bookmarks, whitelist) | `main.js:20-25` | 15m |
| 12 | Quality | Standardize `addEventListener` over `onclick` | `renderer.js:20-22,39` | 10m |
| 13 | Quality | Add logging to empty catch blocks | `main.js`, `renderer.js`, `webview-preload.js` | 10m |
| 14 | Quality | Debounce MutationObserver in webview-preload | `webview-preload.js:48-63` | 10m |

## Phase 3 — UX & Features

| # | Area | Description | Files | Est. |
|---|------|-------------|-------|------|
| 15 | UX | Add keyboard shortcuts (Ctrl+T/W/Tab/L/R/D/F) | `renderer.js`, `main.js` | 30m |
| 16 | UX | Add `did-fail-load` handler for webview error feedback | `renderer.js` | 10m |
| 17 | UX | Add SSL certificate error handler | `main.js` | 10m |
| 18 | UX | Add tab state persistence (session restore) | `main.js`, `renderer.js` | 20m |
| 19 | UX | Deduplicate `loadURL` if URL unchanged | `renderer.js:165-167` | 5m |
| 20 | UX | Optimize tab switch — track active tab ref instead of looping all | `renderer.js:100-104` | 5m |

## Phase 4 — Configuration & Docs

| # | Area | Description | Files | Est. |
|---|------|-------------|-------|------|
| 21 | Config | Add app icon (not `null`) | `package.json:30` | 10m |
| 22 | Docs | Add LICENSE file | `LICENSE` | 5m |
| 23 | Config | Expand `.gitignore` with standard entries | `.gitignore` | 5m |
| 24 | Docs | Remove nonexistent `backups/` from README | `README.md:63` | 2m |
| 25 | Quality | Remove redundant `oneClick: false` from electron-builder config | `package.json:33` | 2m |

---

**Total estimated effort:** ~3-4 hours

**Progress tracking:**

- [x] Phase 1 — Security & Reliability
  - [x] 1. Enable sandbox
  - [x] 2. Add CSP
  - [x] 3. Remove unused openExternal
  - [x] 4. Remove cross-fetch
  - [x] 5. Show window before adblocker
  - [x] 6. Add .catch() to IPC chains
  - [x] 7. Event-driven webview init
- [x] Phase 2 — Code Quality
  - [ ] ~~8. Move shell destructure~~ (moot — handler was removed)
  - [x] 9. Pin tar override
  - [x] 10. Add engines field
  - [x] 11. Async file I/O
  - [x] 12. Standardize event listeners
  - [x] 13. Log empty catches
  - [x] 14. Debounce MutationObserver
- [x] Phase 3 — UX & Features
  - [x] 15. Keyboard shortcuts
  - [x] 16. did-fail-load handler
  - [x] 17. SSL error handler
  - [ ] 18. Tab persistence *(deferred)*
  - [x] 19. Deduplicate loadURL
  - [x] 20. Optimize tab switch
- [x] Phase 4 — Config & Docs
  - [x] 21. App icon *(from fmhy.net favicon)*
  - [x] 22. LICENSE file
  - [x] 23. Expand .gitignore
  - [x] 24. Fix README
  - [x] 25. Remove redundant config
