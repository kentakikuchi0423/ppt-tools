@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
if not "%EXITCODE%"=="0" echo The script exited with code %EXITCODE%.
echo Press any key to close this window.
pause >nul
