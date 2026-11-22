@echo off
rem One-click setup and test run for Windows: double-click this file.
rem It runs run-tests.ps1 (PowerShell). The execution-policy bypass applies to this run only.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-tests.ps1"
echo.
pause
