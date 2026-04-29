# One-shot setup + launch for ppt-tools on Windows.
#
# Run via the start.cmd wrapper at the repo root (double-click it), or directly:
#   pwsh -ExecutionPolicy Bypass -File scripts/setup-windows.ps1
#
# It checks Node.js, installs dependencies, ensures Office Add-in dev
# certificates are trusted, runs `npm run start:debug` (which boots Vite,
# sideloads the add-in, and opens PowerPoint), and then keeps this window
# alive so the dev server child process is not reaped.

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

function Write-Step($msg) {
  Write-Host ''
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Fail($msg) {
  Write-Host $msg -ForegroundColor Red
  Write-Host 'Press Enter to close this window.'
  Read-Host | Out-Null
  exit 1
}

Write-Host ''
Write-Host 'IMPORTANT: keep this window open while using ppt-tools.' -ForegroundColor Yellow
Write-Host 'Closing it stops the dev server and the task pane will go blank in PowerPoint.' -ForegroundColor Yellow

Write-Step 'Checking Node.js'
try {
  $nodeVersion = (& node --version) -replace '^v', ''
} catch {
  Fail 'Node.js not found. Install Node 22 or newer from https://nodejs.org/.'
}
$major = [int]($nodeVersion.Split('.')[0])
if ($major -lt 22) {
  Fail "Node $nodeVersion is too old. Install Node 22 or newer from https://nodejs.org/."
}
Write-Host "Node $nodeVersion OK"

Write-Step 'Installing npm packages (skipped if already present)'
if (-not (Test-Path "$projectDir\node_modules\.bin\vite.cmd")) {
  npm install
  if ($LASTEXITCODE -ne 0) { Fail 'npm install failed.' }
} else {
  Write-Host 'node_modules is already populated'
}

Write-Step 'Installing Office Add-in dev certificates'
Write-Host 'If a Windows security (UAC) prompt appears, click "Yes".'
Write-Host 'If certs are already trusted, this finishes immediately.'
npx office-addin-dev-certs install
if ($LASTEXITCODE -ne 0) {
  Fail 'Dev cert install failed. Try running this script as Administrator.'
}

Write-Step 'Launching PowerPoint with the add-in sideloaded'
Write-Host "When PowerPoint opens, click 'Open ppt-tools' on the Home tab."
Write-Host ''
npm run start:debug
if ($LASTEXITCODE -ne 0) { Fail 'start:debug failed.' }

Write-Host ''
Write-Host '----------------------------------------------------------------' -ForegroundColor Green
Write-Host ' ppt-tools is running.' -ForegroundColor Green
Write-Host ' Leave this window open while using PowerPoint.' -ForegroundColor Green
Write-Host ' When done, close this window (the dev server will stop too).' -ForegroundColor Green
Write-Host '----------------------------------------------------------------' -ForegroundColor Green

# Block forever — closing the window is the user's signal to stop.
try {
  while ($true) { Start-Sleep -Seconds 60 }
} finally {
  # Best-effort cleanup if the user hits Ctrl+C instead of closing the window.
  & npm run stop:debug 2>$null
}
