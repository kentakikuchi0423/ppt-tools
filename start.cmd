@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-windows.ps1"
set EXITCODE=%ERRORLEVEL%
echo.
echo ----------------------------------------------------------------
echo The setup script has ended (exit code %EXITCODE%).
echo If PowerPoint is still open, the dev server is no longer running
echo and the task pane will go blank. Re-run start.cmd to bring it back.
echo ----------------------------------------------------------------
pause
