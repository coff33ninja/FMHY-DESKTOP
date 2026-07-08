param([switch]$Deep)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Removing dist/..." -ForegroundColor Cyan
Remove-Item -LiteralPath "$root\dist" -Recurse -Force -ErrorAction SilentlyContinue

if ($Deep) {
  Write-Host "Removing node_modules/..." -ForegroundColor Cyan
  Remove-Item -LiteralPath "$root\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host "Removing package-lock.json..." -ForegroundColor Cyan
  Remove-Item -LiteralPath "$root\package-lock.json" -Force -ErrorAction SilentlyContinue
  Write-Host "Deep clean complete. Run scripts\setup.ps1 to reinstall." -ForegroundColor Green
} else {
  Write-Host "Clean complete." -ForegroundColor Green
}
