$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Full Reset ===" -ForegroundColor Cyan

Write-Host "1/3 Cleaning..." -ForegroundColor Cyan
& "$root\scripts\clean.ps1" -Deep

Write-Host "2/3 Reinstalling..." -ForegroundColor Cyan
& "$root\scripts\setup.ps1"

Write-Host "3/3 Done." -ForegroundColor Green
Write-Host "Run scripts\dev.ps1 to start, or scripts\build.ps1 to build." -ForegroundColor White
