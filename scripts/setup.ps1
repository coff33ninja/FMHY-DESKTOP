param([switch]$Force)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

Write-Host "Allowing Electron postinstall scripts..." -ForegroundColor Cyan
$status = npm approve-scripts electron@33.4.11 --allow-scripts-pending 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "  (already allowed or not needed)" -ForegroundColor Yellow
}

Write-Host "Setup complete" -ForegroundColor Green
Write-Host "  npm start   — run in dev mode" -ForegroundColor White
Write-Host "  npm run build — build installer + portable" -ForegroundColor White
