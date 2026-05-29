@echo off
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

where node >nul 2>&1
if errorlevel 1 (
    echo Install Node.js from https://nodejs.org then try again.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Installing...
    call npm install
)

if not exist ".env" (
    copy .env.example .env >nul
    echo.
    echo  Open .env in Notepad and add your Gemini key, then run this again.
    notepad .env
    pause
    exit /b 0
)

echo Starting API server...
start "Study Hub - API" cmd /k "cd /d "%~dp0" && set PATH=C:\Program Files\nodejs;%PATH% && npm run server"

echo Starting web app...
start "Study Hub - App" cmd /k "cd /d "%~dp0" && set PATH=C:\Program Files\nodejs;%PATH% && npm run dev"

echo.
echo  WAIT until the "Study Hub - App" window shows:
echo    Local: http://localhost:5173/
echo.
echo  Then open that link in your browser.
echo  DO NOT close either black window while studying.
echo.
timeout /t 6 /nobreak >nul
start http://localhost:5173/
pause
