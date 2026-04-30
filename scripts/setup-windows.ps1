# One-shot setup + launch for ppt-tools on Windows.
#
# Run via the start.cmd wrapper at the repo root (double-click it), or directly:
#   pwsh -ExecutionPolicy Bypass -File scripts/setup-windows.ps1
#
# Flow:
#   1. Sanity-check Node.js, install dependencies, ensure Office dev certs.
#   2. Start Vite in a SEPARATE cmd window so its output is visible and
#      its lifecycle is independent of this script.
#   3. Wait for the dev server to actually accept connections on port 3000.
#   4. Sideload the manifest and launch PowerPoint via office-addin-debugging.
#   5. Block forever — closing this window stops the debug session.

[CmdletBinding()]
param()

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

function Write-Step($msg) {
  Write-Host ''
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Stop-OnError($code, $msg) {
  Write-Host ''
  Write-Host $msg -ForegroundColor Red
  Write-Host 'Press Enter to close this window.'
  $null = Read-Host
  exit $code
}

$devProc = $null

try {
  Write-Host ''
  Write-Host 'IMPORTANT: keep this window open while using ppt-tools.' -ForegroundColor Yellow
  Write-Host 'Closing it stops the dev server and the task pane will go blank in PowerPoint.' -ForegroundColor Yellow

  Write-Step 'Checking Node.js'
  $nodeVersion = ''
  try {
    $nodeVersion = (& node --version 2>$null) -replace '^v', ''
  } catch {
    Stop-OnError 1 'Node.js not found. Install Node 22 or newer from https://nodejs.org/.'
  }
  if (-not $nodeVersion) {
    Stop-OnError 1 'Node.js not found. Install Node 22 or newer from https://nodejs.org/.'
  }
  $major = [int]($nodeVersion.Split('.')[0])
  if ($major -lt 22) {
    Stop-OnError 1 "Node $nodeVersion is too old. Install Node 22 or newer from https://nodejs.org/."
  }
  Write-Host "Node $nodeVersion OK"

  Write-Step 'Installing npm packages (skipped if already present)'
  if (-not (Test-Path "$projectDir\node_modules\.bin\vite.cmd")) {
    & npm install
    if ($LASTEXITCODE -ne 0) {
      Stop-OnError $LASTEXITCODE 'npm install failed.'
    }
  } else {
    Write-Host 'node_modules is already populated'
  }

  Write-Step 'Installing Office Add-in dev certificates'
  Write-Host 'If a Windows security (UAC) prompt appears, click "Yes".'
  Write-Host 'If certs are already trusted, this finishes immediately.'
  & npx office-addin-dev-certs install
  if ($LASTEXITCODE -ne 0) {
    Stop-OnError $LASTEXITCODE 'Dev cert install failed. Try running this script as Administrator.'
  }

  Write-Step 'Releasing port 3000 if a previous run left it occupied'
  $stale = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($staleProcessId in $stale) {
    if ($staleProcessId -gt 0) {
      Write-Host "  killing stale process on port 3000 (PID $staleProcessId)"
      Stop-Process -Id $staleProcessId -Force -ErrorAction SilentlyContinue
    }
  }

  Write-Step 'Starting the Vite dev server in a new window'
  Write-Host 'A separate "ppt-tools dev server" window will open. Keep it open too.'
  $devCmd = "title ppt-tools dev server (Vite) && cd /d `"$projectDir`" && npm run dev"
  $devProc = Start-Process -PassThru -FilePath 'cmd.exe' -ArgumentList @('/k', $devCmd)

  Write-Step 'Waiting for the dev server to accept connections on port 3000'
  $ready = $false
  for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 1
    $tcp = Test-NetConnection -ComputerName 'localhost' -Port 3000 `
      -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($tcp) { $ready = $true; break }
    if ($i % 10 -eq 0) { Write-Host "  still waiting ($i s)..." }
  }
  if (-not $ready) {
    Stop-OnError 1 'Dev server did not start within 60 seconds. Check the "ppt-tools dev server" window for errors.'
  }
  Write-Host 'Dev server is listening on port 3000.'

  Write-Step 'Sideloading the add-in and launching PowerPoint'
  & npm run start:debug
  if ($LASTEXITCODE -ne 0) {
    Stop-OnError $LASTEXITCODE "start:debug exited with code $LASTEXITCODE."
  }

  Write-Host ''
  Write-Host '----------------------------------------------------------------' -ForegroundColor Green
  Write-Host ' ppt-tools is running.' -ForegroundColor Green
  Write-Host ' Keep this window AND the "ppt-tools dev server" window open.' -ForegroundColor Green
  Write-Host ' When done, close this window — both will stop together.' -ForegroundColor Green
  Write-Host '----------------------------------------------------------------' -ForegroundColor Green

  try {
    while ($true) { Start-Sleep -Seconds 60 }
  } finally {
    if ($devProc -and -not $devProc.HasExited) {
      Stop-Process -Id $devProc.Id -Force -ErrorAction SilentlyContinue
    }
    & npm run stop:debug 2>$null
  }
} catch {
  Write-Host ''
  Write-Host "Unexpected error: $_" -ForegroundColor Red
  if ($_.ScriptStackTrace) {
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
  }
  if ($devProc -and -not $devProc.HasExited) {
    Stop-Process -Id $devProc.Id -Force -ErrorAction SilentlyContinue
  }
  Stop-OnError 1 'Setup failed. See the message above.'
}
