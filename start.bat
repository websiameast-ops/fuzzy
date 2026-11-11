@echo off
chcp 65001 >nul
echo ===================================================
echo  START: SE Connex Customer Portal (Vite Dev Server)
echo ===================================================
echo.
cd /d "%~dp0"

if not exist "node_modules\" (
    echo [!] Installing dependencies...
    call npm install
)

echo Starting browser at: http://localhost:5180/fuzzy/
start "" "http://localhost:5180/fuzzy/"

echo.
echo Starting Vite Dev Server (Press Ctrl + C to stop)...
echo.
call npm run dev
