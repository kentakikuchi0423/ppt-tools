# Hard-reset script for the ppt-tools add-in on Windows.
#
# Use this when the task pane is showing stale content (PowerPoint or its
# WebView2 has cached a previous version of the add-in HTML). It:
#   1. Kills any running Office process so they release file locks.
#   2. Stops any active office-addin-debugging session.
#   3. Wipes Office's per-add-in caches (Wef, WebExt).
#   4. Hands off to the normal setup-windows.ps1 flow to re-launch.
#
# Run via the reload.cmd wrapper at the repo root (double-click it), or
# directly: pwsh -ExecutionPolicy Bypass -File scripts/reload-windows.ps1

[CmdletBinding()]
param()

$projectDir = Split-Path -Parent $PSScriptRoot
Set-Location $projectDir

function Write-Step($msg) {
  Write-Host ''
  Write-Host "==> $msg" -ForegroundColor Cyan
}

Write-Step 'Killing running Office processes'
foreach ($name in 'POWERPNT', 'EXCEL', 'WINWORD', 'OUTLOOK', 'ONENOTE', 'MSACCESS') {
  $procs = Get-Process -Name $name -ErrorAction SilentlyContinue
  if ($procs) {
    Write-Host "  $name (PIDs: $($procs.Id -join ', ')) — terminating"
    $procs | Stop-Process -Force -ErrorAction SilentlyContinue
  }
}

Write-Step 'Stopping any active office-addin-debugging session'
& npx office-addin-debugging stop manifest.xml 2>$null
& npm run stop:debug 2>$null

Write-Step 'Clearing the Office add-in caches and Vite build artifacts'
$paths = @(
  "$env:LOCALAPPDATA\Microsoft\Office\16.0\Wef",
  "$env:LOCALAPPDATA\Microsoft\Office\16.0\WebExt",
  "$env:LOCALAPPDATA\Microsoft\Office\OfficeFileCache",
  "$env:LOCALAPPDATA\Microsoft\Office\16.0\AddinCache",
  "$projectDir\node_modules\.vite",
  "$projectDir\dist"
)
foreach ($p in $paths) {
  if (Test-Path $p) {
    Write-Host "  removing $p"
    Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
  } else {
    Write-Host "  (skipped, not present) $p"
  }
}

Write-Step 'Handing off to setup-windows.ps1 to restart everything'
& "$PSScriptRoot\setup-windows.ps1"
