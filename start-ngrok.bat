@echo off
chcp 65001 >nul
echo ==========================================
echo  StringStrange - Public URL via Ngrok
echo ==========================================
echo.

REM Start ngrok for frontend (port 3000)
start "Ngrok Frontend" ngrok.exe http 3000

echo.
echo Wait for ngrok to start, then:
echo 1. Copy the https:// URL from the ngrok window
echo 2. Update .env with that URL for the backend
echo.
echo Starting React app...
set PORT=3000
set HOST=0.0.0.0
npm start
