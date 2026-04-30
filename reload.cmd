@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\reload-windows.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
echo ----------------------------------------------------------------
echo The reload script has ended (exit code %EXITCODE%).
echo ----------------------------------------------------------------
pause
