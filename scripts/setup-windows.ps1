# One-shot setup + launch for ppt-tools on Windows.
#
# Run via the start.cmd wrapper at the repo root (double-click it), or directly:
#   pwsh -ExecutionPolicy Bypass -File scripts/setup-windows.ps1
#
# It checks Node.js, installs dependencies, installs dev certs (UAC prompt
# the first time), and then runs `npm run start:debug` which boots Vite,
# sideloads the add-in, and opens PowerPoint with it loaded.

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
  exit 1
}

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
Write-Host "When PowerPoint opens, go to the Home tab and click 'Open ppt-tools'."
Write-Host "To stop, close this window or run 'npm run stop:debug' in another terminal."
Write-Host ''
npm run start:debug
