@echo off
title TOPH Sovereign — Inference Setup
echo.
echo ==========================================
echo  TOPH SOVEREIGN BUILD — INFERENCE SETUP
echo ==========================================
echo.

REM Check Ollama
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo  ERROR: Ollama not found.
    echo  Download from: https://ollama.com/download/windows
    echo  After install, restart this script.
    echo.
    pause
    exit /b 1
)
echo  Ollama found.
echo.

REM Model selection
echo  Choose base model:
echo  [1] Llama 3.1 8B   — 8GB RAM  — recommended for most machines
echo  [2] Llama 3.2 3B   — 4GB RAM  — fast, smaller machines
echo  [3] Mistral 7B     — 8GB RAM  — good balance
echo  [4] Llama 3.1 70B  — 40GB RAM — best quality
echo.
set /p choice="  Enter choice (1/2/3/4): "

if "%choice%"=="1" set MODEL=llama3.1:8b
if "%choice%"=="2" set MODEL=llama3.2:3b
if "%choice%"=="3" set MODEL=mistral:latest
if "%choice%"=="4" set MODEL=llama3.1:70b

if "%MODEL%"=="" (
    echo  Invalid choice. Defaulting to llama3.1:8b
    set MODEL=llama3.1:8b
)

echo.
echo  Pulling %MODEL% from Ollama registry...
echo  (This may take several minutes on first run)
echo.
ollama pull %MODEL%

if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Failed to pull model. Check your connection.
    pause
    exit /b 1
)

echo.
echo  Building TOPH model with system prompt firmware...
echo.

REM Use PowerShell to write the Modelfile properly (avoids bat echo encoding issues)
set SCRIPT_DIR=%~dp0
set PROMPT_FILE=%SCRIPT_DIR%..\02-system-prompt\toph-system-prompt.txt
set MODELFILE=%SCRIPT_DIR%Modelfile

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$model = '%MODEL%'; $promptPath = '%PROMPT_FILE%'; $outPath = '%MODELFILE%'; " ^
  "$prompt = Get-Content $promptPath -Raw -Encoding UTF8; " ^
  "$content = 'FROM ' + $model + \"`n\" + 'SYSTEM \"\"\"' + \"`n\" + $prompt + \"`n\" + '\"\"\"'; " ^
  "Set-Content -Path $outPath -Value $content -Encoding UTF8; " ^
  "Write-Host '  Modelfile written: ' $outPath"

if %errorlevel% neq 0 (
    echo  ERROR: Failed to write Modelfile.
    pause
    exit /b 1
)

echo.
echo  Creating TOPH model in Ollama...
ollama create toph -f "%SCRIPT_DIR%Modelfile"

if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Failed to create TOPH model.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  TOPH inference engine ready.
echo.
echo  Test it:   ollama run toph
echo  Type:      align
echo  Expected:  TOPH initializes with 19 axioms
echo.
echo  Then start the full stack:
echo  cd .. ^&^& npm start
echo ==========================================
echo.
pause
