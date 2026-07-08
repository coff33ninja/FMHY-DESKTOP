$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting FMHY Browser in dev mode..." -ForegroundColor Cyan
npm start
