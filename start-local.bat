@echo off
chcp 65001 >nul
echo ==========================================
echo  StringStrange - Local Network Mode
echo ==========================================
echo.

REM Get local IP address (method 1 - ipconfig)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do set LOCAL_IP=%%a
set LOCAL_IP=%LOCAL_IP: =%

REM Fallback method if empty
if "%LOCAL_IP%"=="" (
  for /f "delims=[] tokens=2" %%a in ('ping -4 -n 1 %computername% ^| findstr [') do set LOCAL_IP=%%a
)

echo Your Local IP: %LOCAL_IP%
echo.

REM Update the env file for frontend
echo REACT_APP_BACKEND_URL=http://%LOCAL_IP%:8001 > .env.local

echo === IMPORTANT ===
echo.
echo STEP 1: Open a NEW terminal and run:
echo    cd server
echo    python server.py
echo.
echo STEP 2: Then come back here and press any key to start frontend...
echo.
pause

echo.
echo Starting React app on 0.0.0.0:3000...
echo.
echo Access URLs:
echo   This device:     http://localhost:3000
echo   Other devices:  http://%LOCAL_IP%:3000
echo.

set PORT=3000
set HOST=0.0.0.0
npm start
