@echo off
chcp 65001 >nul
echo ===================================================
echo  SETUP: SE Connex Customer Portal
echo ===================================================
echo.
cd /d "%~dp0"

echo [1/1] Installing dependencies...
call npm install

echo.
echo ===================================================
echo  SETUP COMPLETE
echo  Double-click start.bat to run development server
echo ===================================================
pause
