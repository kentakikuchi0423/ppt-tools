@echo off
REM Double-click entry point on Windows.
REM Runs scripts/setup-windows.ps1 with execution-policy bypass for this one
REM invocation only — it does not change your global PowerShell policy.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
if not "%EXITCODE%"=="0" (
  echo The script exited with code %EXITCODE%.
)
echo Press any key to close this window.
pause >nul
