# Audit Report: FMHY Browser (fmhy-browser)

**Version:** 0.1.5-alpha | **Author:** coff33ninja | **Type:** Electron desktop app

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 3 |
| Low | 3 |
| Info | 4 |

---

## 1. Dependencies

### High
- **Missing dev dependencies** | `package.json` | `eslint`, `@eslint/js`, and `png-to-ico` are listed as devDependencies but not installed (`npm ls` shows UNMET DEPENDENCY). Run `npm install` to fix.
- **Extraneous packages** | `node_modules` | `cross-fetch`, `node-fetch`, `tr46`, `webidl-conversions`, `whatwg-url` are present in `node_modules` but not in `package.json`. Leftovers from pre-`cross-fetch` removal. Run `npm prune` to clean.

### Medium
- **Overly permissive semver ranges** | `package.json` | All deps use `^` caret ranges (e.g. `^43.0.0` for electron). Pin to exact versions for reproducible builds, especially for an alpha release.

### Low
- **`@ghostery/adblocker` @ `2.18.1`** | Adblocker engine — no known CVEs. Acceptable.

### Resolved
- `tar` override pinned to `7.5.16` (avoids known CVEs in older transitive versions).
- `npm audit` reports **0 vulnerabilities**.

---

## 2. Configuration

### Medium
- **Version duplication** | `package.json` says `0.1.5-alpha`, `version.json` also says `0.1.5-alpha` — they match currently, but two sources of truth will drift. Recommend using `package.json` as the canonical source and reading it in `version.json` at build time.
- **ESLint cannot run** | `npm run lint` fails because `eslint` is not installed (unmet dependency). Fix the missing devDependencies first.

### Low
- **No `.editorconfig`** | No editor-agnostic formatting config. Not critical since the project is small.
- **`version.json`** | Contains `repository` field with value `coff33ninja/FMHY-DESKTOP` — useful but not listed as `repository` in `package.json`. Add `"repository"` field to `package.json` for npm metadata.

### Info
- `.gitignore` covers `node_modules/`, `dist/`, `.env`, `.env.local`, logs, editor dirs, and `backups/` — good coverage.
- CSP is set via `<meta>` tag in `index.html` — restricts scripts/styles to `'self'` with `unsafe-inline` for styles.
- ESLint config is reasonable (recommended rules, `no-unused-vars` on warn, `eqeqeq` enforced, `no-var`).
- CI workflow (`release.yml`) is well-structured with proper token handling and pre-release detection.

---

## 3. Disk Usage

### High
- **`dist/` — 620.5 MB** | Contains 3 old installer EXEs and `win-unpacked/` with full Electron runtime. These are build artifacts; `git status` shows the working tree is clean (`.gitignore` excludes `dist/`), but they take up local space. Run `scripts\clean.ps1` to remove.

### Info
- `node_modules/` — 435.5 MB (expected for Electron + adblocker)
- Free space on drive: **129.3 GB** — no immediate pressure.

---

## 4. Environment Portability

### Info
- Build scripts are in `scripts/` — good organization.
- No `.env` or `.env.example` files (not needed for this project).
- Node version pinned via `.nvmrc` (22) and `package.json` `engines` field.
- No hardcoded absolute paths detected in config files.
- `setup.ps1` handles `npm install` and Electron postinstall approval.
- `reset.ps1` provides a full clean + reinstall workflow.

---

## 5. Git Health

### Status: Clean
- Working tree: clean, no uncommitted changes
- No untracked files, no stashes
- Single branch (`master`) with 18 commits
- Commit history uses conventional commit prefixes (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`, `perf:`)
- `git fsck` reports no errors
- Largest blob in history: `package-lock.json` at ~195 KB (normal for npm)
- No tagged releases visible

### Low
- **No tags** | The CI workflow triggers on `v*` tags, but none exist yet (no release has been cut). First release will need `git tag v0.1.5-alpha && git push origin v0.1.5-alpha`.

---

## 6. Code Quality

### Medium
- **Sync file I/O in main process** | `main.js:22` uses `fs.readFileSync` for JSON loads and `writeFileSync` for cache writes. Blocking the main process on disk I/O can cause UI jank. The `saveJSON` helper on line 24 already uses `fs.promises.writeFile` — use async for reads too.
- **Unused `getCosmetics` import in `renderer.js`** | If the cosmetic filtering refactor removed usage, the IPC handler on `main.js:162` is still registered but may be dead code on the renderer side.

### Low
- Empty catch blocks with only `console.error` exist (acceptable for an alpha)
- `electronAPI` preload exposes only `minimize`/`maximize`/`close` — clean and minimal surface

---

## 7. Recommendations (Prioritized)

1. **Fix unmet devDependencies** — Run `npm install` to get `eslint`, `@eslint/js`, `png-to-ico`
2. **Prune extraneous packages** — `npm prune` to remove `cross-fetch`, `node-fetch`, etc.
3. **Clean `dist/`** — Run `scripts\clean.ps1` to reclaim ~620 MB
4. **Pin dependency versions** — Replace `^` with exact versions for `electron`, `electron-builder`, `@ghostery/adblocker`
5. **Async file I/O** — Convert `fs.readFileSync` / `writeFileSync` to async equivalents
6. **Add `version.json` to `.gitignore` or make it build-generated** — Avoid version drift
7. **Add `"repository"` field to `package.json`** — For npm metadata correctness
