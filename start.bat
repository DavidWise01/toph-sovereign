@echo off
title TOPH Sovereign v5.1
echo.
echo ==========================================
echo  TOPH SOVEREIGN v5.1
echo  No bootloader. No phone home. Your rules.
echo ==========================================
echo.

REM Check Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found.
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo  Installing server dependencies...
    call npm install
    echo.
)
if not exist 03-frontend\node_modules (
    echo  Installing UI dependencies...
    cd 03-frontend && call npm install && cd ..
    echo.
)

REM Initialize storage if needed
if not exist 04-storage\data (
    echo  Initializing storage...
    node 04-storage\init-storage.js
    echo.
)

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>nul
if %errorlevel% neq 0 (
    echo  WARNING: Ollama not detected on port 11434.
    echo  Start Ollama, then refresh the UI.
    echo  If you haven't set up TOPH yet, run: 01-inference\setup-windows.bat
    echo.
)

echo  Starting TOPH server (port 3001) + UI (port 5173)...
echo  Opening http://localhost:5173 in a moment...
echo.
echo  Press Ctrl+C to stop.
echo.

REM Start server and UI concurrently
npm start
