@echo off
echo ====================================================
echo Launching SyncPoll (Full Stack: Go Backend + React)
echo ====================================================

start "SyncPoll Backend" cmd /k "%~dp0run-backend.bat"
ping -n 3 127.0.0.1 >nul

start "SyncPoll Frontend" cmd /k "%~dp0run-frontend.bat"
ping -n 3 127.0.0.1 >nul

start https://localhost:5173
echo SyncPoll is up and running securely!
echo Tip: To get a fully trusted public link (no browser warnings, 1-click WhatsApp share), run run-tunnel.bat

