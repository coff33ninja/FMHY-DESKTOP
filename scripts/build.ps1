param([switch]$Pack)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

if ($Pack) {
  Write-Host "Building portable .exe only..." -ForegroundColor Cyan
  npm run pack
} else {
  Write-Host "Building NSIS installer + portable .exe..." -ForegroundColor Cyan
  npm run build
}

if ($LASTEXITCODE -eq 0) {
  Write-Host "Build complete - output in dist/" -ForegroundColor Green
} else {
  throw "Build failed"
}
